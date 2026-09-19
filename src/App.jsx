import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import BillHistory from "./pages/BillHistory";
import Inventory from "./pages/Inventory";
import Services from "./pages/Services";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Expenses from "./pages/Expenses";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import InsightDetail from "./pages/InsightDetail";
import Returns from "./pages/Returns";
import { AppDataProvider } from "./context/AppDataContext";
import { ToastProvider } from "./components/ui";
import CustomerDetail from "./pages/CustomerDetail";
import EmployeeDetail from "./pages/EmployeeDetail";
import SupplierDetail from "./pages/SupplierDetail";
import Salaries from "./pages/Salaries";
import ShopSettings from "./pages/ShopSettings";
export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <AppDataProvider>
      <ToastProvider>
        <div className="min-h-screen bg-hm-bg text-hm-text">
          <Sidebar open={open} onClose={() => setOpen(false)} />

          {/* pl matches the sidebar width exactly (272px). */}
          <div className="lg:pl-[272px]">
            <Header onMenu={() => setOpen(true)} />
            <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/history" element={<BillHistory />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/services" element={<Services />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/suppliers/:id" element={<SupplierDetail />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
                <Route path="/salaries" element={<Salaries />} />
                <Route path="/shop" element={<ShopSettings />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/insights/:type" element={<InsightDetail />} />
                <Route path="/insights/:type/:id" element={<InsightDetail />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
              </Routes>
            </main>
          </div>
        </div>
      </ToastProvider>
    </AppDataProvider>
  );
}
