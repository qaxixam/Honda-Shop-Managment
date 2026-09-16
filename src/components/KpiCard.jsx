import React from "react";

/**
 * MetricCard
 * ------------------------------------------------------------------
 * The single metric primitive for the whole app. `KpiCard` is a
 * re-export alias (see KpiCard.jsx) so existing imports keep working.
 *
 * Design notes (Option A — "Counter"):
 *  - No card, no shadow, no lift. Sits flat in the layout.
 *  - Optional left icon, inline and muted — never a tinted tile.
 *  - Value is the dominant element: 20px, tabular nums, medium weight.
 *  - Label is 12px muted. Hint is 12px muted.
 *  - `onClick` turns the whole thing into a button with a subtle
 *    background hover — no arrow, no transform.
 */
export default function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  onClick,
  valueClass = "",
  className = "",
}) {
  const isInteractive = typeof onClick === "function";

  const content = (
    <>
      <div className="flex items-center gap-1.5 text-hm-meta  text-hm-text-muted">
        {Icon && <Icon size={14} className="text-hm-text-subtle shrink-0" />}
        <span className="truncate">{label}</span>
      </div>

      <div
        className={`mt-1.5 text-[20px] leading-7 font-medium tracking-tight tabular-nums text-hm-text ${valueClass}`}
      >
        {value}
      </div>

      {hint && (
        <div className="mt-0.5   text-hm-meta text-hm-text-subtle">{hint}</div>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`block w-full rounded-hm-md border  border-hm-border bg-hm-surface px-4 py-3 text-left transition-colors hover:border-hm-border-strong hover:bg-hm-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hm-primary/20 ${className}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`px-1 py-1  ${className}`}>{content}</div>;
}
