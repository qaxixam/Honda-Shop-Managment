const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

let win;
let db;
let dbPath;
const collections = ["products", "services", "customers", "sales", "suppliers", "expenses", "employees", "advances", "salary_payments", "returns", "bill_drafts", "shop_settings"];

function createSchema() {
  db.exec(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at TEXT NOT NULL); ${collections.map((name) => `CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);`).join(" ")} CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL);`);
}

function saveRelational(data) {
  const transaction = db.transaction((state) => {
    for (const table of collections) {
      db.prepare(`DELETE FROM ${table}`).run();
      const stateKey = table === "salary_payments" ? "salaryPayments" : table === "bill_drafts" ? "billDrafts" : table === "shop_settings" ? "shopSettings" : table;
      const source = state[stateKey];
      const items = table === "shop_settings" ? [{ id: "main", ...(source || {}) }] : (source || []);
      const insert = db.prepare(`INSERT INTO ${table} (id, data, updated_at) VALUES (?, ?, ?)`);
      for (const item of items) insert.run(String(item.id), JSON.stringify(item), new Date().toISOString());
    }
    db.prepare("DELETE FROM sale_items").run();
    const saleItemInsert = db.prepare("INSERT INTO sale_items (id, sale_id, data, updated_at) VALUES (?, ?, ?, ?)");
    for (const sale of state.sales || []) for (const item of sale.items || sale.lineItems || []) saleItemInsert.run(`${sale.id}-${item.id}-${item.type}`, sale.id, JSON.stringify(item), new Date().toISOString());
    db.prepare("DELETE FROM purchases").run();
    const purchaseInsert = db.prepare("INSERT INTO purchases (id, supplier_id, data, updated_at) VALUES (?, ?, ?, ?)");
    for (const supplier of state.suppliers || []) for (const purchase of supplier.purchases || []) purchaseInsert.run(String(purchase.id || `${supplier.id}-${Date.now()}`), supplier.id, JSON.stringify(purchase), new Date().toISOString());
  });
  transaction(data);
}

function loadRelational() {
  const hasRows = db.prepare("SELECT COUNT(*) AS count FROM products").get().count || db.prepare("SELECT COUNT(*) AS count FROM sales").get().count;
  if (!hasRows) return null;
  const result = {};
  for (const table of collections) {
    const key = table === "salary_payments" ? "salaryPayments" : table === "bill_drafts" ? "billDrafts" : table === "shop_settings" ? "shopSettings" : table;
    const rows = db.prepare(`SELECT data FROM ${table} ORDER BY rowid`).all().map((row) => JSON.parse(row.data));
    result[key] = table === "shop_settings" ? (rows[0] || { shopName: "" }) : rows;
  }
  return result;
}

function openDatabase(file) {
  if (db) db.close();
  dbPath = file;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  createSchema();
}

function createWindow() {
  const defaultPath = path.join(app.getPath("userData"), "shop-data", "hbms.db");
  openDatabase(defaultPath);
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 1100, minHeight: 700, webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false } });
  if (process.env.NODE_ENV === "development") win.loadURL("http://localhost:5173");
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("db:load", () => {
  const relational = loadRelational();
  if (relational) return JSON.stringify(relational);
  const snapshot = db.prepare("SELECT data FROM app_state WHERE id = 1").get()?.data || null;
  if (snapshot) {
    const parsed = JSON.parse(snapshot);
    saveRelational(parsed);
    return JSON.stringify(parsed);
  }
  return null;
});
ipcMain.handle("db:save", (_event, data) => {
  saveRelational(data);
  db.prepare("INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at").run(JSON.stringify(data), new Date().toISOString());
  return true;
});
ipcMain.handle("shop:choose-location", async () => {
  const result = await dialog.showOpenDialog(win, { title: "Choose shop data folder", properties: ["openDirectory", "createDirectory"] });
  if (result.canceled || !result.filePaths[0]) return null;
  const next = path.join(result.filePaths[0], "hbms.db");
  if (dbPath !== next && fs.existsSync(dbPath) && !fs.existsSync(next)) fs.copyFileSync(dbPath, next);
  openDatabase(next);
  const saved = db.prepare("SELECT data FROM app_state WHERE id = 1").get()?.data || null;
  return { path: next, data: saved };
});
ipcMain.handle("shop:location", () => dbPath);
ipcMain.handle("shop:backup", async () => {
  const result = await dialog.showSaveDialog(win, { title: "Backup shop database", defaultPath: "hbms-backup.db", filters: [{ name: "SQLite database", extensions: ["db"] }] });
  if (result.canceled || !result.filePath) return null;
  db.pragma("wal_checkpoint(TRUNCATE)");
  fs.copyFileSync(dbPath, result.filePath);
  return result.filePath;
});
ipcMain.handle("shop:import", async () => {
  const result = await dialog.showOpenDialog(win, { title: "Import shop database", properties: ["openFile"], filters: [{ name: "SQLite database", extensions: ["db", "sqlite", "sqlite3"] }, { name: "All files", extensions: ["*"] }] });
  if (result.canceled || !result.filePaths[0]) return null;
  const source = result.filePaths[0];
  if (path.resolve(source) === path.resolve(dbPath)) return dbPath;
  let sourceDb;
  try {
    sourceDb = new Database(source, { readonly: true });
    const hasState = sourceDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('app_state', 'products', 'sales')").all().length > 0;
    if (!hasState) throw new Error("This file is not an HBMS database backup.");
    sourceDb.close();
    sourceDb = null;
    if (db) db.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      const target = `${dbPath}${suffix}`;
      if (fs.existsSync(target)) fs.rmSync(target, { force: true });
    }
    fs.copyFileSync(source, dbPath);
    openDatabase(dbPath);
    return { path: dbPath };
  } catch (error) {
    if (sourceDb) sourceDb.close();
    try { openDatabase(dbPath); } catch { /* keep the original error for the renderer */ }
    throw new Error(`Import failed: ${error.message}`);
  }
});
ipcMain.handle("shop:delete-all", async () => {
  const transaction = db.transaction(() => {
    for (const table of collections) db.prepare(`DELETE FROM ${table}`).run();
    db.prepare("DELETE FROM sale_items").run();
    db.prepare("DELETE FROM purchases").run();
    db.prepare("DELETE FROM app_state").run();
  });
  transaction();
  return true;
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
