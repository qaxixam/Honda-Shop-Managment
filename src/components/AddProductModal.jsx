import React, { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import { Modal, Input } from "../components/ui";
import { money } from "../lib/utils";

export default function AddProductModal({ open, onClose, products, onAdd }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return products.filter((p) => {
      const matchesQuery =
        !query ||
        `${p.name} ${p.id} ${p.brand} ${p.category} ${p.barcode || ""}`
          .toLowerCase()
          .includes(query);
      const matchesCategory = category === "All" || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, q, category]);

  function handleAdd(p) {
    if (Number(p.stock) <= 0) return;
    onAdd({ ...p, type: "product", price: p.sellingPrice }, "product");
  }

  return (
    <Modal
      open={open}
      title="Add product"
      description="Tap a product to add it to the bill."
      onClose={onClose}
      wide
    >
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hm-text-subtle"
          />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, code, brand, or barcode…"
            className="pl-9"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={[
                  "rounded-hm-sm border px-2.5 py-1.5 text-hm-meta font-medium transition-colors",
                  active
                    ? "border-hm-primary bg-hm-primary-soft text-hm-text"
                    : "border-hm-border text-hm-text-muted hover:bg-hm-surface-2 hover:text-hm-text",
                ].join(" ")}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Product grid */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => {
                const out = Number(p.stock) <= 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={out}
                      onClick={() => handleAdd(p)}
                      className={[
                        "flex h-full w-full flex-col rounded-hm-md border px-3 py-2.5 text-left transition-colors",
                        out
                          ? "cursor-not-allowed border-hm-border bg-hm-surface-2 opacity-50"
                          : "border-hm-border hover:border-hm-border-strong hover:bg-hm-surface-2",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-hm-body font-medium text-hm-text">
                            {p.name}
                          </div>
                          <div className="mt-0.5 truncate text-hm-meta text-hm-text-subtle">
                            {p.brand || p.category}
                            {p.barcode ? ` · ${p.barcode}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <div className="text-hm-body font-medium tabular-nums text-hm-text">
                          {money(p.sellingPrice)}
                        </div>
                        <div
                          className={`text-hm-meta tabular-nums ${
                            out ? "text-hm-danger" : "text-hm-text-subtle"
                          }`}
                        >
                          {out ? "Out of stock" : `${p.stock} in stock`}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-12 text-center">
              <Package size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No products match
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                Try a different search or category.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
