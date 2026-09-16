import React from "react";

export default function PageHeader({ title, subtitle, action, actions }) {
  // Support both `action` (single node) and `actions` (array) so existing
  // pages keep working and newer pages can pass multiple controls.
  const right = actions ?? action;

  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-hm-page text-hm-text">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-hm-body text-hm-text-muted">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  );
}
