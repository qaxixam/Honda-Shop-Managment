import React from "react";
import { LogOut, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function Header({ onMenu }) {
  const { shopSettings = {} } = useAppData();
  const location = useLocation();
  const session = JSON.parse(sessionStorage.getItem("hbms_session") || "null");
  const section = { "/": "Dashboard", "/pos": "Billing", "/history": "Bill History", "/reports": "Reports", "/shop": "Administration", "/inventory": "Inventory", "/services": "Services", "/customers": "Customers", "/suppliers": "Suppliers", "/expenses": "Expenses", "/employees": "Employees", "/salaries": "Salaries", "/returns": "Returns" }[location.pathname] || "HBMS";
  const shopName = shopSettings.shopName || "Honda Bike Shop";
  function logout() { sessionStorage.removeItem("hbms_session"); window.location.reload(); }
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hm-border bg-hm-surface px-4 sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        className="btn-ghost -ml-2 p-2 lg:hidden"
        aria-label="Open menu"
        type="button"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-hm-body font-semibold text-hm-text">{shopName}</div>
        <div className="truncate text-hm-meta text-hm-text-muted">{section}</div>
      </div>
      <div className="hidden min-w-[720px] whitespace-nowrap border-x border-hm-border px-6 text-center text-[16px] leading-8 text-hm-text-muted xl:block" dir="rtl" lang="ar" style={{ fontFamily: '"Noto Naskh Arabic", "Amiri", "Traditional Arabic", serif' }}>
        مَا كَانَ مُحَمَّدٌ اَبَاۤ اَحَدٍ مِّنْ رِّجَالِكُمْ وَ لٰكِنْ رَّسُوْلَ اللّٰهِ وَ خَاتَمَ النَّبِیّٖنَؕ-وَ كَانَ اللّٰهُ بِكُلِّ شَیْءٍ عَلِیْمًا۠(۴۰)
      </div>
      <div className="mx-1 hidden h-6 w-px bg-hm-border sm:block" />
      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block"><div className="text-hm-body font-medium text-hm-text">{session?.username || "Admin"}</div><div className="text-hm-meta text-hm-text-subtle">{session?.role || "admin"}</div></div>
        <button type="button" className="btn-ghost p-2" onClick={logout} aria-label="Logout" title="Logout"><LogOut size={16} /></button>
      </div>
    </header>
  );
}
