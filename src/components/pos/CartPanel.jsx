import React from "react";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { money } from "../../lib/utils";

export default function CartPanel({ cart, products, onQty, onRemove }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-hm-border px-3 py-2.5">
        <ShoppingCart size={15} className="text-hm-text-subtle" />
        <h2 className="text-hm-title text-hm-text">Current bill</h2>
        <span className="ml-auto rounded-hm-xs bg-hm-surface-2 px-1.5 py-0.5 text-hm-meta font-medium text-hm-text-muted tabular-nums">
          {cart.length} {cart.length === 1 ? "line" : "lines"}
        </span>
      </div>

      {cart.length > 0 ? (
        <ul className="divide-y divide-hm-border">
          {cart.map((i) => (
            <li
              key={`${i.id}-${i.type}`}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2.5"
            >
              {/* Name + meta */}
              <div className="min-w-0">
                <div className="truncate text-hm-body font-medium text-hm-text">
                  {i.name}
                </div>
                <div className="mt-0.5 truncate text-hm-meta text-hm-text-subtle tabular-nums">
                  {i.id} · {i.type} · {money(i.price)}
                </div>
              </div>

              {/* Qty stepper */}
              <div className="flex items-center rounded-hm-sm border border-hm-border">
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-l-hm-sm text-hm-text-muted hover:bg-hm-surface-2 hover:text-hm-text"
                  onClick={() => onQty(i.id, i.type, -1)}
                  aria-label={`Decrease quantity of ${i.name}`}
                >
                  <Minus size={13} />
                </button>
                <span className="w-7 text-center text-hm-body font-medium tabular-nums text-hm-text">
                  {i.qty}
                </span>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-r-hm-sm text-hm-text-muted hover:bg-hm-surface-2 hover:text-hm-text"
                  onClick={() => onQty(i.id, i.type, 1)}
                  aria-label={`Increase quantity of ${i.name}`}
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Line total */}
              <div className="w-24 text-right text-hm-body font-medium tabular-nums text-hm-text">
                {money(i.price * i.qty)}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="grid h-8 w-8 place-items-center rounded-hm-sm text-hm-text-subtle hover:bg-hm-danger-soft hover:text-hm-danger"
                aria-label={`Remove ${i.name} from bill`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-12 text-center">
          <ShoppingCart
            size={22}
            className="mx-auto text-hm-text-subtle"
            aria-hidden="true"
          />
          <p className="mt-3 text-hm-body font-medium text-hm-text">
            Your bill is empty
          </p>
          <p className="mt-1 text-hm-meta text-hm-text-muted">
            Search above, or tap a quick-add item.
          </p>
        </div>
      )}
    </div>
  );
}
