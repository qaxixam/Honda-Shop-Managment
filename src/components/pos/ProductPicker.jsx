import React, { useMemo, useState } from "react";
import { Search, Package, Wrench, X, Plus } from "lucide-react";
import { money } from "../../lib/utils";

export default function ProductPicker({ products, services, onAdd }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("products");

  const items = tab === "products" ? products : services;

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return [
      ...products
        .filter((p) =>
          `${p.name} ${p.id} ${p.category} ${p.brand} ${p.barcode || ""}`
            .toLowerCase()
            .includes(q),
        )
        .map((p) => ({ ...p, type: "product", price: p.sellingPrice })),
      ...services
        .filter((s) =>
          `${s.name} ${s.id} ${s.category}`.toLowerCase().includes(q),
        )
        .map((s) => ({ ...s, type: "service", price: s.charges })),
    ].slice(0, 8);
  }, [query, products, services]);

  // Enter key adds the first result — additive, does not affect existing flow.
  function handleKeyDown(e) {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      onAdd(results[0], results[0].type);
      setQuery("");
    }
    if (e.key === "Escape" && query) {
      setQuery("");
    }
  }

  return (
    <div className="panel">
      {/* Search row */}
      <div className="border-b border-hm-border p-3">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2 focus-within:border-hm-primary">
            <Search size={16} className="shrink-0 text-hm-text-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-hm-body text-hm-text outline-none placeholder:text-hm-text-subtle"
              placeholder="Search by name, code, brand, barcode, category…"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-hm-xs p-0.5 text-hm-text-subtle hover:bg-hm-surface hover:text-hm-text"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-hm-md border border-hm-border bg-hm-surface shadow-hm-elevated">
              {results.map((r, i) => (
                <button
                  type="button"
                  key={`${r.type}-${r.id}`}
                  onClick={() => {
                    onAdd(r, r.type);
                    setQuery("");
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-hm-surface-2",
                    i > 0 ? "border-t border-hm-border" : "",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="truncate text-hm-body font-medium text-hm-text">
                      {r.name}
                    </div>
                    <div className="mt-0.5 truncate text-hm-meta text-hm-text-subtle">
                      {r.id}
                      {r.type === "product" && r.barcode
                        ? ` · ${r.barcode}`
                        : ""}
                      {r.type === "product" ? ` · ${r.stock} in stock` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 tabular-nums text-hm-body font-medium text-hm-text">
                    {money(r.price)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick add */}
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-hm-sm border border-hm-border p-0.5">
            <Tab
              active={tab === "products"}
              onClick={() => setTab("products")}
              icon={Package}
            >
              Products
            </Tab>
            <Tab
              active={tab === "services"}
              onClick={() => setTab("services")}
              icon={Wrench}
            >
              Services
            </Tab>
          </div>
          <span className="text-hm-meta text-hm-text-subtle">Tap to add</span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {items.slice(0, 9).map((item) => {
            const price = item.sellingPrice ?? item.charges;
            const outOfStock = tab === "products" && Number(item.stock) <= 0;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() =>
                    onAdd(item, tab === "products" ? "product" : "service")
                  }
                  className={[
                    "group flex w-full items-center justify-between gap-2 rounded-hm-sm border border-hm-border px-2.5 py-2 text-left transition-colors",
                    outOfStock
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-hm-border-strong hover:bg-hm-surface-2",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-hm-body font-medium text-hm-text">
                      {item.name}
                    </div>
                    {tab === "products" && (
                      <div className="mt-0.5 text-hm-meta text-hm-text-subtle tabular-nums">
                        {item.stock} in stock
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-hm-meta font-medium tabular-nums text-hm-text-muted">
                    {money(price)}
                  </div>
                  <Plus
                    size={13}
                    className="shrink-0 text-hm-text-subtle group-hover:text-hm-text"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-hm-xs px-2.5 py-1.5 text-hm-meta font-medium transition-colors",
        active
          ? "bg-hm-primary text-white"
          : "text-hm-text-muted hover:text-hm-text",
      ].join(" ")}
    >
      <Icon size={13} />
      {children}
    </button>
  );
}
