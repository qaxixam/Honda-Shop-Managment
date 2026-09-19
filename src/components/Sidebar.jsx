import React from "react";
import { NavLink } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  Users,
  Truck,
  WalletCards,
  BarChart3,
  X,
  Bike,
  UserCog,
  RotateCcw,
  History,
  Banknote,
  Settings,
} from "lucide-react";

const groups = [
  {
    label: "Workspace",
    items: [
      ["Dashboard", "/", LayoutDashboard],
      ["Billing", "/pos", ShoppingCart],
      ["Bill History", "/history", History],
      ["Returns", "/returns", RotateCcw],
    ],
  },
  {
    label: "Manage",
    items: [
      ["Inventory", "/inventory", Package],
      ["Services", "/services", Wrench],
      ["Customers", "/customers", Users],
      ["Suppliers", "/suppliers", Truck],
      ["Expenses", "/expenses", WalletCards],
      ["Employees", "/employees", UserCog],
      ["Salaries", "/salaries", Banknote],
      ["Administration", "/shop", Settings],
    ],
  },
  {
    label: "Analyze",
    items: [["Reports", "/reports", BarChart3]],
  },
];

export default function Sidebar({ open, onClose }) {
  const { shopSettings = {} } = useAppData();
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] -translate-x-full flex-col border-r border-hm-border bg-hm-surface transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        {/* Brand row — height matches the header (h-16) so borders align. */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-hm-border px-4">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-hm-sm bg-hm-primary text-white">
            <Bike size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-hm-title text-hm-text">{shopSettings.shopName || "Honda Bike Shop"}</div>
            <div className="truncate text-hm-meta text-hm-text-subtle">
              HBMS Desktop
            </div>
          </div>
          <button
            className="btn-ghost -mr-1 p-1.5 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {groups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
              <div className="px-3 pb-1.5 text-hm-meta font-medium text-hm-text-subtle">
                {group.label}
              </div>

              <ul className="space-y-0.5">
                {group.items.map(([label, path, Icon]) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end={path === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-2.5 rounded-hm-sm px-3 py-2 text-hm-body font-medium transition-colors",
                          isActive
                            ? "bg-hm-primary-soft text-hm-text"
                            : "text-hm-text-muted hover:bg-hm-surface-2 hover:text-hm-text",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            className={
                              isActive ? "text-hm-text" : "text-hm-text-subtle"
                            }
                          />
                          <span className="flex-1 truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

      </aside>
    </>
  );
}
