import React, { useMemo, useState } from "react";
import { Search, Wrench } from "lucide-react";
import { Modal, Input } from "../components/ui";
import { money } from "../lib/utils";

export default function AddServiceModal({
  open,
  onClose,
  services,
  cart = [],
  onAdd,
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [services]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return services.filter((s) => {
      const matchesQuery =
        !query ||
        `${s.name} ${s.id} ${s.category}`.toLowerCase().includes(query);
      const matchesCategory = category === "All" || s.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [services, q, category]);

  function handleAdd(s) {
    if (s.active === false) return;
    onAdd({ ...s, type: "service", price: s.charges }, "service");
  }

  return (
    <Modal
      open={open}
      title="Add service"
      description="Tap a service to add it to the bill."
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
            placeholder="Search by name, code, or category…"
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

        {/* Service grid */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <li key={s.id}>
                  {(() => {
                    const quantity = cart.find(
                      (item) => item.id === s.id && item.type === "service",
                    )?.qty || 0;
                    const disabled = s.active === false;
                    const missingPrice = Number(s.charges) <= 0 || Number(s.cost) <= 0;
                    return (
                  <button
                    type="button"
                    aria-disabled={disabled || missingPrice}
                    onClick={() => handleAdd(s)}
                    className={`relative flex h-full w-full flex-col rounded-hm-md border px-3 py-2.5 pb-8 text-left transition-colors ${
                      disabled || missingPrice
                        ? "cursor-not-allowed border-red-300 bg-red-50 text-red-900 opacity-90"
                        : quantity > 0
                        ? "border-hm-primary bg-hm-primary-soft/30 hover:border-hm-primary"
                        : "border-hm-border hover:border-hm-border-strong hover:bg-hm-surface-2"
                    }`}
                  >
                    <div className="truncate text-hm-body font-medium text-hm-text">
                      {s.name}
                    </div>
                    <div className="mt-0.5 truncate text-hm-meta text-hm-text-subtle">
                      {s.category}
                      {s.time ? ` · ${s.time} min` : ""}
                    </div>
                    <div className="mt-2 text-hm-body font-medium tabular-nums text-hm-text">
                      {disabled ? "Disabled" : missingPrice ? "Price required" : money(s.charges)}
                    </div>
                    {quantity > 0 && (
                      <span className="absolute bottom-2 right-2 inline-flex min-w-6 items-center justify-center rounded-full bg-hm-primary px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-sm">
                        {quantity}
                      </span>
                    )}
                  </button>
                    );
                  })()}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center">
              <Wrench size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No services match
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
