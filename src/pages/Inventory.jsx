import React, { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, PackageSearch } from "lucide-react";
import { money } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import {
  Button,
  Modal,
  IconButton,
  Input,
  Select,
  Panel,
} from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";

const blank = {
  name: "",
  category: "Brake",
  brand: "Honda Original",
  purchasePrice: "",
  sellingPrice: "",
  stock: "",
  minStock: "5",
  rack: "A-01",
  supplierId: "",
  barcode: "",
  unit: "piece",
};

function nextProductId(products) {
  const max = products.reduce((m, p) => {
    const n = parseInt(String(p.id || "").replace("HBP-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `HBP-${String(max + 1).padStart(4, "0")}`;
}

export default function Inventory() {
  const { products, suppliers, addProduct, updateProduct, deleteProduct } =
    useAppData();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          `${p.name} ${p.id} ${p.category} ${p.brand} ${p.barcode || ""}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
          (category === "All" || p.category === category) &&
          (stockFilter === "All" ||
            (stockFilter === "Low" && p.stock <= p.minStock) ||
            (stockFilter === "In stock" && p.stock > p.minStock)),
      ),
    [products, q, category, stockFilter],
  );

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const totalUnits = products.reduce((a, p) => a + Number(p.stock), 0);

  function save() {
    if (!form.name.trim()) return;
    const item = {
      ...form,
      id: editing?.id || nextProductId(products),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      supplierId: form.supplierId || "",
      barcode: form.barcode || "",
      unit: form.unit || "piece",
    };
    editing ? updateProduct(editing.id, item) : addProduct(item);
    close();
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function edit(p) {
    setEditing(p);
    setForm({
      supplierId: "",
      barcode: "",
      unit: "piece",
      ...p,
    });
    setOpen(true);
  }

  function remove(p) {
    if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id);
  }

  const hasFilters = q || category !== "All" || stockFilter !== "All";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory"
        subtitle="Products, stock levels, and pricing."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={15} />
            Add product
          </Button>
        }
      />

      {/* Metrics strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Products" value={products.length} />
          <Stat
            label="Low stock"
            value={lowCount}
            tone={lowCount > 0 ? "warning" : "default"}
          />
          <Stat label="Stock units" value={totalUnits} />
        </div>
      </section>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hm-text-subtle"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, code, brand, barcode, or category…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-auto"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-auto"
          >
            <option>All</option>
            <option>Low</option>
            <option>In stock</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Product</th>
                <th className="px-4">Brand</th>
                <th className="px-4 text-right">Purchase</th>
                <th className="px-4 text-right">Selling</th>
                <th className="px-4 text-right">Stock</th>
                <th className="px-4">Rack</th>
                <th className="px-4">Supplier</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.stock <= p.minStock;
                const supplier = suppliers.find((s) => s.id === p.supplierId);
                return (
                  <tr key={p.id}>
                    <td className="px-4">
                      <div className="truncate font-medium text-hm-text">
                        {p.name}
                      </div>
                      <div className="text-hm-meta text-hm-text-subtle tabular-nums">
                        {p.id}
                        {p.barcode ? ` · ${p.barcode}` : ""}
                      </div>
                    </td>
                    <td className="px-4 text-hm-text-muted">{p.brand}</td>
                    <td className="px-4 text-right tabular-nums text-hm-text-muted">
                      {money(p.purchasePrice)}
                    </td>
                    <td className="px-4 text-right tabular-nums font-medium">
                      {money(p.sellingPrice)}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {low ? (
                        <span className="badge-warning">{p.stock} low</span>
                      ) : (
                        <span className="text-hm-text">
                          {p.stock}
                          {p.unit ? ` ${p.unit}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 text-hm-text-muted">{p.rack}</td>
                    <td className="px-4 text-hm-text-muted">
                      {supplier ? supplier.name : "—"}
                    </td>
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          label={`Edit ${p.name}`}
                          onClick={() => edit(p)}
                        >
                          <Edit3 size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${p.name}`}
                          variant="danger"
                          onClick={() => remove(p)}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filtered.length && (
            <div className="px-4 py-12 text-center">
              <PackageSearch
                size={22}
                className="mx-auto text-hm-text-subtle"
              />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                {hasFilters
                  ? "No products match your filters"
                  : "No products yet"}
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                {hasFilters
                  ? "Try clearing the search or switching category."
                  : "Add your first product to start tracking inventory."}
              </p>
              {hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setQ("");
                    setCategory("All");
                    setStockFilter("All");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setOpen(true)}
                >
                  <Plus size={14} />
                  Add product
                </Button>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Add / edit modal */}
      <Modal
        open={open}
        title={editing ? "Edit product" : "Add product"}
        description={
          editing
            ? "Update the details below and save."
            : "Fields marked with * are required."
        }
        onClose={close}
      >
        <div className="space-y-5">
          <FormSection title="Identity">
            <FormField label="Product name" required htmlFor="inv-name">
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Front brake pad"
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Category" htmlFor="inv-category">
                <Input
                  id="inv-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Brand" htmlFor="inv-brand">
                <Input
                  id="inv-brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Pricing">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Purchase price"
                htmlFor="inv-purchase"
                hint="What you pay per unit"
              >
                <Input
                  id="inv-purchase"
                  type="number"
                  min="0"
                  value={form.purchasePrice}
                  onChange={(e) =>
                    setForm({ ...form, purchasePrice: e.target.value })
                  }
                />
              </FormField>
              <FormField
                label="Selling price"
                htmlFor="inv-selling"
                hint="What the customer pays"
              >
                <Input
                  id="inv-selling"
                  type="number"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Stock">
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Current stock" htmlFor="inv-stock">
                <Input
                  id="inv-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </FormField>
              <FormField
                label="Minimum stock"
                htmlFor="inv-min"
                hint="Alert threshold"
              >
                <Input
                  id="inv-min"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Rack" htmlFor="inv-rack">
                <Input
                  id="inv-rack"
                  value={form.rack}
                  onChange={(e) => setForm({ ...form, rack: e.target.value })}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Tracking">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Supplier"
                htmlFor="inv-supplier"
                hint="Who supplies this product"
              >
                <Select
                  id="inv-supplier"
                  value={form.supplierId || ""}
                  onChange={(e) =>
                    setForm({ ...form, supplierId: e.target.value })
                  }
                >
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="Unit"
                htmlFor="inv-unit"
                hint="How it's counted"
              >
                <Select
                  id="inv-unit"
                  value={form.unit || "piece"}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  <option value="piece">Piece</option>
                  <option value="set">Set</option>
                  <option value="litre">Litre</option>
                  <option value="kg">Kg</option>
                  <option value="metre">Metre</option>
                </Select>
              </FormField>
            </div>
            <FormField
              label="Barcode"
              htmlFor="inv-barcode"
              hint="Scan or type the barcode. Used for fast POS lookup."
            >
              <Input
                id="inv-barcode"
                value={form.barcode || ""}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="e.g. 8901234500011"
              />
            </FormField>
          </FormSection>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? "Save changes" : "Add product"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone = "default" }) {
  const valueColor = tone === "warning" ? "text-hm-warning" : "text-hm-text";
  return (
    <div className="px-4 py-3">
      <div className="text-hm-meta text-hm-text-muted">{label}</div>
      <div
        className={`mt-0.5 text-[18px] font-medium tabular-nums ${valueColor}`}
      >
        {value}
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 text-hm-meta font-medium uppercase tracking-wide text-hm-text-subtle">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
