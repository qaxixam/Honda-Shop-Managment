import React from "react";
import { Bell, Menu, Search } from "lucide-react";

export default function Header({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hm-border bg-hm-surface px-4 sm:px-6 lg:px-8">
      {/* Left: mobile menu + search */}
      <button
        onClick={onMenu}
        className="btn-ghost -ml-2 p-2 lg:hidden"
        aria-label="Open menu"
        type="button"
      >
        <Menu size={18} />
      </button>

      {/* Search — presentational for now. Wire onSearch when ready. */}
      <div className="hidden max-w-md flex-1 items-center gap-2 rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-1.5 md:flex">
        <Search size={15} className="text-hm-text-subtle shrink-0" />
        <input
          type="search"
          placeholder="Search products, customers, invoices…"
          className="w-full bg-transparent text-hm-body text-hm-text outline-none placeholder:text-hm-text-subtle"
        />
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1.5">
        <button
          className="btn-ghost relative p-2"
          aria-label="Notifications"
          type="button"
        >
          <Bell size={17} />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-hm-border sm:block" />

        <button
          type="button"
          className="flex items-center gap-2.5 rounded-hm-sm px-1.5 py-1 text-left hover:bg-hm-surface-2"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-hm-primary text-hm-meta font-semibold text-white">
            ZA
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-hm-body font-medium text-hm-text">
              Shop Admin
            </div>
            <div className="truncate text-hm-meta text-hm-text-subtle">
              Owner
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
