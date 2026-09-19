const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const crypto = require("crypto");

let win;
let db;
let dbPath;
const collections = ["products", "services", "customers", "sales", "suppliers", "expenses", "employees", "advances", "salary_payments", "returns", "bill_drafts", "shop_settings"];

function createSchema() {
  db.exec(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, updated_at TEXT NOT NULL); ${collections.map((name) => `CREATE TABLE IF NOT EXISTS ${name} (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);`).join(" ")} CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY, sale_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, created_at TEXT NOT NULL);`);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored).split(":");
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
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
  Menu.setApplicationMenu(null);
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
ipcMain.handle("auth:status", () => ({ setupRequired: db.prepare("SELECT COUNT(*) AS count FROM users").get().count === 0 }));
ipcMain.handle("auth:setup", (_event, { username, password }) => {
  const cleanUsername = String(username || "").trim();
  if (!cleanUsername || String(password || "").length < 6) throw new Error("Username and a password of at least 6 characters are required.");
  if (db.prepare("SELECT COUNT(*) AS count FROM users").get().count > 0) throw new Error("An admin account already exists.");
  db.prepare("INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)").run(crypto.randomUUID(), cleanUsername, hashPassword(password), new Date().toISOString());
  return { username: cleanUsername, role: "admin" };
});
ipcMain.handle("auth:login", (_event, { username, password }) => {
  const user = db.prepare("SELECT username, password_hash, role FROM users WHERE username = ?").get(String(username || "").trim());
  if (!user || !verifyPassword(String(password || ""), user.password_hash)) throw new Error("Invalid username or password.");
  return { username: user.username, role: user.role };
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

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}
function pdfMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
ipcMain.handle("report:export-pdf", async (_event, report) => {
  const now = new Date();
  const exportDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const exportTime = [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0"), String(now.getMilliseconds()).padStart(3, "0")].join("-");
  const result = await dialog.showSaveDialog(win, { title: "Export report as PDF", defaultPath: `hbms-${report.periodKey}-report-${exportDate}-${exportTime}.pdf`, filters: [{ name: "PDF document", extensions: ["pdf"] }] });
  if (result.canceled || !result.filePath) return null;
  const bills = (report.bills || []).map((bill) => `<tr><td>${htmlEscape(bill.invoice)}</td><td>${htmlEscape(bill.customer)}</td><td>${htmlEscape(bill.date)}</td><td>${pdfMoney(bill.subtotal)}</td><td>${pdfMoney(bill.net)}</td><td>${pdfMoney(bill.due)}</td></tr>`).join("");
  const returns = (report.returns || []).map((item) => `<tr><td>${htmlEscape(item.invoice)}</td><td>${htmlEscape(item.customer)}</td><td>${htmlEscape(item.date)}</td><td>${pdfMoney(item.amount)}</td><td>${htmlEscape(item.reason || "—")}</td></tr>`).join("");
  const summary = [["Net sale", pdfMoney(report.summary.netSale)], ["Discount", pdfMoney(report.summary.discount)], ["Returns", pdfMoney(report.summary.returns)], ["Net profit", pdfMoney(report.summary.netProfit)]]
    .map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#172033;font-size:10px}h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #172033;padding-bottom:5px}.meta{color:#667085;margin-bottom:18px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #d9dee8;padding:7px 8px;text-align:left}thead th{background:#eef2f7;font-weight:700}tbody tr:nth-child(even){background:#fafbfc}.summary th{width:70%;background:#f5f7fa}.summary td{text-align:right;font-weight:700}.empty{text-align:center;color:#667085;padding:16px;border:1px solid #d9dee8}
  </style></head><body><h1>${htmlEscape(report.title || "HBMS Report")}</h1><div class="meta">${htmlEscape(report.rangeLabel)} · Generated ${htmlEscape(report.generatedAt)}</div>
  <h2>Summary of ${htmlEscape(report.periodLabel)}</h2><table class="summary"><tbody>${summary}</tbody></table>
  <h2>All Bills</h2>${bills ? `<table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Subtotal</th><th>Net</th><th>Due</th></tr></thead><tbody>${bills}</tbody></table>` : '<div class="empty">No bills in this period.</div>'}
  <h2>Returns</h2>${returns ? `<table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Amount</th><th>Reason</th></tr></thead><tbody>${returns}</tbody></table>` : '<div class="empty">No returns in this period.</div>'}
  </body></html>`;
  const pdfWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdf = await pdfWindow.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
    fs.writeFileSync(result.filePath, pdf);
    return result.filePath;
  } finally { pdfWindow.close(); }
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
