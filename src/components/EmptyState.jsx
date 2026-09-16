import React from "react";

export default function EmptyState({
  title = "Nothing here yet",
  description = "Add your first record to get started.",
  icon: Icon,
  action,
  size = "default", // "default" | "compact"
  className = "",
}) {
  const pad = size === "compact" ? "px-6 py-8" : "px-6 py-12";

  return (
    <div className={`${pad} text-center ${className}`}>
      {Icon && (
        <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-hm-sm border border-hm-border bg-hm-surface-2 text-hm-text-subtle">
          <Icon size={16} />
        </div>
      )}
      <h3 className="text-hm-title text-hm-text">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-hm-body text-hm-text-muted">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
