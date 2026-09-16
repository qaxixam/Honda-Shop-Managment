import React from "react";
import { CreditCard, Printer, ChevronDown } from "lucide-react";
import { Button } from "../ui";
import { money } from "../../lib/utils";

export default function PaymentSummary({
  total,
  subtotal,
  discount,
  discountType,
  discountValue,
  setDiscountType,
  setDiscountValue,
  paid,
  setPaid,
  due,
  method,
  setMethod,
  disabled,
  onSave,
  onPrint,
}) {
  const [showDiscount, setShowDiscount] = React.useState(
    discountType !== "none",
  );

  return (
    <aside className="panel h-fit overflow-hidden xl:sticky xl:top-20">
      {/* Total — dominant */}
      <div className="border-b border-hm-border p-4">
        <div className="text-hm-meta text-hm-text-muted">Total due</div>
        <div className="mt-0.5 text-[28px] leading-9 font-medium tabular-nums tracking-tight text-hm-text">
          {money(total)}
        </div>
        <div className="mt-1 flex items-center gap-2 text-hm-meta text-hm-text-subtle tabular-nums">
          <span>Subtotal {money(subtotal)}</span>
          {discount > 0 && (
            <>
              <span>·</span>
              <span className="text-hm-success">− {money(discount)}</span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Discount — collapsed until needed */}
        <div>
          <button
            type="button"
            onClick={() => setShowDiscount((s) => !s)}
            className="flex w-full items-center justify-between text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
          >
            <span>Discount</span>
            <span className="flex items-center gap-1.5 text-hm-text-subtle">
              {discountType !== "none" && discount > 0 ? (
                <span className="tabular-nums">− {money(discount)}</span>
              ) : (
                <span>None</span>
              )}
              <ChevronDown
                size={13}
                className={`transition-transform ${showDiscount ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          {showDiscount && (
            <div className="mt-2.5 space-y-2">
              <div className="grid grid-cols-3 rounded-hm-sm border border-hm-border p-0.5">
                {[
                  ["none", "None"],
                  ["percentage", "%"],
                  ["fixed", "PKR"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDiscountType(v)}
                    className={[
                      "rounded-hm-xs py-1.5 text-hm-meta font-medium transition-colors",
                      discountType === v
                        ? "bg-hm-primary text-white"
                        : "text-hm-text-muted hover:text-hm-text",
                    ].join(" ")}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {discountType !== "none" && (
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={discountType === "percentage" ? 100 : subtotal}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="input pr-12 tabular-nums"
                    placeholder={
                      discountType === "percentage" ? "e.g. 10" : "e.g. 500"
                    }
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-hm-meta font-medium text-hm-text-subtle">
                    {discountType === "percentage" ? "%" : "PKR"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Paid */}
        <label className="block">
          <span className="mb-1.5 block text-hm-meta font-medium text-hm-text-muted">
            Amount received
          </span>
          <input
            type="number"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            className="input text-hm-lead font-medium tabular-nums"
            placeholder="0"
          />
        </label>

        {/* Due / balance */}
        {due > 0 ? (
          <div className="flex items-center justify-between rounded-hm-sm border border-hm-warning/30 bg-hm-warning-soft px-3 py-2">
            <span className="text-hm-meta font-medium text-hm-warning">
              Balance due
            </span>
            <strong className="tabular-nums text-hm-body font-semibold text-hm-warning">
              {money(due)}
            </strong>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-hm-sm border border-hm-success/25 bg-hm-success-soft px-3 py-2">
            <span className="text-hm-meta font-medium text-hm-success">
              Fully paid
            </span>
            <strong className="tabular-nums text-hm-body font-semibold text-hm-success">
              {money(total)}
            </strong>
          </div>
        )}

        {/* Method */}
        <div>
          <div className="mb-1.5 text-hm-meta font-medium text-hm-text-muted">
            Payment method
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {["Cash", "Online"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={[
                  "rounded-hm-sm border px-2 py-2 text-hm-meta font-medium transition-colors",
                  method === m
                    ? "border-hm-primary bg-hm-primary-soft text-hm-text"
                    : "border-hm-border text-hm-text-muted hover:bg-hm-surface-2 hover:text-hm-text",
                ].join(" ")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Button
            disabled={disabled}
            className="w-full"
            variant="accent"
            onClick={onPrint}
          >
            <Printer size={15} />
            Charge & print
          </Button>
          <Button
            disabled={disabled}
            variant="secondary"
            className="w-full"
            onClick={onSave}
          >
            <CreditCard size={15} />
            Save without printing
          </Button>
        </div>
      </div>
    </aside>
  );
}
