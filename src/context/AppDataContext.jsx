import React from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { findStockIssue } from "../lib/inventory";
import { todayISO } from "../lib/utils";

const KEY = "hbms_store_v4";
const clone = (value) => JSON.parse(JSON.stringify(value));

const initial = {
  products: [],
  services: [],
  customers: [],
  sales: [],
  billDrafts: [],
  returns: [],
  expenses: [],
  suppliers: [],
  employees: [],
  advances: [],
  salaryPayments: [],
};

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [data, setData] = useState(() => clone(initial));
  const hydrated = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = window.hbmsDesktop ? await window.hbmsDesktop.load() : localStorage.getItem(KEY);
        if (saved) setData({ ...clone(initial), ...JSON.parse(saved) });
      } catch { /* Start with a clean store if the database is unavailable. */ }
      hydrated.current = true;
    };
    load();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const serialized = JSON.stringify(data);
    if (window.hbmsDesktop) window.hbmsDesktop.save(data);
    else localStorage.setItem(KEY, serialized);
  }, [data]);

  const updateCollection = (key, updater) =>
    setData((prev) => ({
      ...prev,
      [key]: typeof updater === "function" ? updater(prev[key]) : updater,
    }));

  const crud = (key) => ({
    add: (item) => updateCollection(key, (items) => [...items, item]),
    update: (id, patch) =>
      updateCollection(key, (items) =>
        items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      ),
    remove: (id) =>
      updateCollection(key, (items) => items.filter((x) => x.id !== id)),
  });

  const product = crud("products"),
    service = crud("services"),
    customer = crud("customers"),
    employee = crud("employees");

  // ---------------------------------------------------------------------------
  // Expense: date is normalized to YYYY-MM-DD so Reports.filterPeriod can parse
  // it. Without the .slice(0,10) the full ISO string ("...Z") makes
  // `${date}T12:00:00` an Invalid Date and the expense silently drops out of
  // every report.
  // ---------------------------------------------------------------------------
  const addExpense = (item) =>
    updateCollection("expenses", (items) => [
      { ...item, date: String(item.date || "").slice(0, 10) },
      ...items,
    ]);
  const updateExpense = (id, patch) =>
    updateCollection("expenses", (items) =>
      items.map((x) =>
        x.id === id
          ? {
              ...x,
              ...patch,
              date: String(patch.date || x.date || "").slice(0, 10),
            }
          : x,
      ),
    );
  const deleteExpense = (id) =>
    updateCollection("expenses", (items) => items.filter((x) => x.id !== id));

  const addSupplier = (item) =>
    updateCollection("suppliers", (items) => [
      ...items,
      {
        ...item,
        purchases: item.purchases || [],
        payments: item.payments || [],
      },
    ]);
  const updateSupplier = (id, patch) =>
    updateCollection("suppliers", (items) =>
      items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  const deleteSupplier = (id) =>
    updateCollection("suppliers", (items) => items.filter((x) => x.id !== id));

  // ---------------------------------------------------------------------------
  // Pay supplier — every payment is logged on the supplier as a record so the
  // detail page can show a full payment history, not just the running totals.
  // ---------------------------------------------------------------------------
  const paySupplier = (id, amount, note = "") => {
    const requested = Math.max(0, Number(amount) || 0);
    if (!requested) return;
    updateCollection("suppliers", (items) =>
      items.map((s) => {
        if (s.id !== id) return s;
        const applied = Math.min(requested, Number(s.due || 0));
        if (!applied) return s;
        const payment = {
          id: `PAY-${Date.now()}`,
          date: todayISO(),
          amount: applied,
          note: (note || "").trim(),
        };
        return {
          ...s,
          paid: Number(s.paid || 0) + applied,
          due: Math.max(0, Number(s.due || 0) - applied),
          payments: [payment, ...(s.payments || [])],
        };
      }),
    );
  };

  const receiveCustomerPayment = (id, amount) => {
    const safe = Math.max(0, Number(amount) || 0);
    updateCollection("customers", (items) =>
      items.map((x) =>
        x.id === id ? { ...x, due: Math.max(0, Number(x.due || 0) - safe) } : x,
      ),
    );
    updateCollection("sales", (items) => {
      let remaining = safe;
      return items.map((s) => {
        if (!remaining || s.customerId !== id || Number(s.due || 0) <= 0)
          return s;
        const applied = Math.min(remaining, Number(s.due));
        remaining -= applied;
        const nextDue = Number(s.due) - applied;
        return {
          ...s,
          paid: Number(s.paid || 0) + applied,
          due: nextDue,
          status: nextDue > 0 ? "Partial" : "Paid",
        };
      });
    });
  };

  const recordSupplierPurchase = ({
    supplierId,
    productId,
    qty,
    unitCost,
    paid,
  }) => {
    const quantity = Math.max(1, Number(qty) || 0);
    const cost = Math.max(0, Number(unitCost) || 0);
    const total = quantity * cost;
    const safePaid = Math.min(Math.max(0, Number(paid) || 0), total);
    const item = data.products.find((p) => p.id === productId);
    const supplier = data.suppliers.find((s) => s.id === supplierId);
    if (!item || !supplier || !total) return false;
    const purchase = {
      id: `PUR-${Date.now()}`,
      date: todayISO(),
      productId,
      productName: item.name,
      qty: quantity,
      unitCost: cost,
      total,
      paid: safePaid,
      due: total - safePaid,
    };
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: Number(p.stock || 0) + quantity,
              purchasePrice: cost,
            }
          : p,
      ),
      suppliers: prev.suppliers.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              purchased: Number(s.purchased || 0) + total,
              paid: Number(s.paid || 0) + safePaid,
              due: Number(s.due || 0) + (total - safePaid),
              purchases: [purchase, ...(s.purchases || [])],
            }
          : s,
      ),
    }));
    return true;
  };

  const completeSale = ({
    customerId,
    items,
    subtotal,
    discountType = "none",
    discountValue = 0,
    discountAmount = 0,
    total,
    paid,
    method,
  }) => {
    const stockIssue = findStockIssue(items, data.products);
    if (stockIssue) return false;

    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const safeDiscount = Math.min(
      safeSubtotal,
      Math.max(0, Number(discountAmount) || 0),
    );
    const safeTotal = Math.max(0, Number(total) || safeSubtotal - safeDiscount);
    const safePaid = Math.min(Math.max(0, Number(paid) || 0), safeTotal);
    const due = Math.max(0, safeTotal - safePaid);
    const maxInvoice = data.sales.reduce((m, s) => {
      const n = parseInt(String(s.id || "").replace("INV-", ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 1025);
    const invoiceNo = `INV-${maxInvoice + 1}`;
    const customer = data.customers.find((x) => x.id === customerId);
    const sale = {
      id: invoiceNo,
      customer: customer?.name || "Walk-in Customer",
      customerId: customerId || null,
      date: todayISO(),
      subtotal: safeSubtotal,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountAmount: safeDiscount,
      total: safeTotal,
      paid: safePaid,
      due,
      method,
      status: due > 0 ? "Partial" : "Paid",
      items: items.map((i) => i.name),
      lineItems: clone(items),
      returnedAmount: 0,
    };
    setData((prev) => {
      const nextProducts = prev.products.map((p) => {
        const sold = items
          .filter((i) => i.type === "product" && i.id === p.id)
          .reduce((sum, i) => sum + Number(i.qty || 0), 0);
        return sold
          ? { ...p, stock: Math.max(0, Number(p.stock || 0) - sold) }
          : p;
      });
      const nextCustomers = prev.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              visits: Number(c.visits || 0) + 1,
              spent: Number(c.spent || 0) + safeTotal,
              due: Number(c.due || 0) + due,
            }
          : c,
      );
      return {
        ...prev,
        products: nextProducts,
        customers: nextCustomers,
        sales: [sale, ...prev.sales],
      };
    });
    return invoiceNo;
  };

  const recordReturn = ({
    saleId,
    items,
    refundAmount,
    method = "Cash",
    reason = "",
  }) => {
    const sale = data.sales.find((s) => s.id === saleId);
    if (!sale || !items?.length) return false;
    const safeRefund = Math.min(
      Math.max(0, Number(refundAmount) || 0),
      Number(sale.total || 0),
    );
    if (!safeRefund) return false;
    const returnId = `RET-${Date.now().toString().slice(-7)}`;
    const returnRecord = {
      id: returnId,
      saleId,
      customerId: sale.customerId || null,
      customer: sale.customer || "Walk-in Customer",
      date: todayISO(),
      amount: safeRefund,
      method,
      reason,
      items: clone(items),
    };
    setData((prev) => {
      const nextProducts = prev.products.map((p) => {
        const returned = items
          .filter((i) => i.type === "product" && i.id === p.id)
          .reduce((sum, i) => sum + Number(i.qty || 0), 0);
        return returned ? { ...p, stock: Number(p.stock || 0) + returned } : p;
      });
      const nextSales = prev.sales.map((s) => {
        if (s.id !== saleId) return s;
        const nextTotal = Math.max(0, Number(s.total || 0) - safeRefund);
        const nextPaid = Math.min(Number(s.paid || 0), nextTotal);
        const nextDue = Math.max(0, nextTotal - nextPaid);
        return {
          ...s,
          total: nextTotal,
          due: nextDue,
          paid: nextPaid,
          returnedAmount: Number(s.returnedAmount || 0) + safeRefund,
          status: nextDue > 0 ? "Partial" : "Paid",
          returns: [...(s.returns || []), returnId],
        };
      });
      const nextCustomers = prev.customers.map((c) => {
        if (!sale.customerId || c.id !== sale.customerId) return c;
        const reduceDue = Math.min(Number(c.due || 0), safeRefund);
        return {
          ...c,
          due: Math.max(0, Number(c.due || 0) - reduceDue),
          spent: Math.max(0, Number(c.spent || 0) - safeRefund),
        };
      });
      return {
        ...prev,
        products: nextProducts,
        sales: nextSales,
        customers: nextCustomers,
        returns: [returnRecord, ...prev.returns],
      };
    });
    return returnId;
  };

  /* -------------------------------------------------------------------------
     Employee advances — a log, not a field. An employee can take an advance
     multiple times, on different dates. Each advance is a record. The "total
     advance" for an employee is the sum of all their records.
     ------------------------------------------------------------------------- */
  const addAdvance = (advance) => {
    const id = `ADV-${Date.now()}`;
    const record = {
      id,
      employeeId: advance.employeeId,
      amount: Math.max(0, Number(advance.amount) || 0),
      date: String(advance.date || todayISO()).slice(0, 10),
      note: (advance.note || "").trim(),
    };
    updateCollection("advances", (items) => [record, ...items]);
    return id;
  };

  const deleteAdvance = (id) =>
    updateCollection("advances", (items) => items.filter((a) => a.id !== id));

  const addSalaryPayment = (payment) => {
    const amount = Math.max(0, Number(payment.amount) || 0);
    if (!payment.employeeId || !amount) return null;
    const record = {
      id: `SAL-${Date.now()}`,
      expenseId: `EXP-SAL-${Date.now()}`,
      employeeId: payment.employeeId,
      amount,
      date: String(payment.date || todayISO()).slice(0, 10),
      note: (payment.note || "").trim(),
    };
    updateCollection("salaryPayments", (items) => [record, ...items]);
    const employee = data.employees.find((item) => item.id === payment.employeeId);
    addExpense({
      id: record.expenseId,
      date: record.date,
      type: `Salary - ${employee?.name || "Employee"}`,
      amount,
      note: record.note || "Employee salary payment",
    });
    return record.id;
  };

  const deleteSalaryPayment = (id) => {
    updateCollection("salaryPayments", (items) => items.filter((item) => item.id !== id));
    const payment = data.salaryPayments.find((item) => item.id === id);
    if (payment?.expenseId) deleteExpense(payment.expenseId);
  };

  const value = useMemo(
    () => ({
      ...data,
      updateCollection,
      addProduct: product.add,
      updateProduct: product.update,
      deleteProduct: product.remove,
      addService: service.add,
      updateService: service.update,
      deleteService: service.remove,
      addCustomer: customer.add,
      updateCustomer: customer.update,
      deleteCustomer: customer.remove,
      receivePayment: receiveCustomerPayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      paySupplier,
      recordSupplierPurchase,
      upsertBillDraft: (draft) =>
        updateCollection("billDrafts", (items) => {
          const normalized = {
            ...draft,
            updatedAt: draft.updatedAt || new Date().toISOString(),
          };
          const exists = items.some((item) => item.id === normalized.id);
          return exists
            ? items.map((item) =>
                item.id === normalized.id ? { ...item, ...normalized } : item,
              )
            : [normalized, ...items];
        }),
      removeBillDraft: (id) =>
        updateCollection("billDrafts", (items) =>
          items.filter((item) => item.id !== id),
        ),
      addEmployee: employee.add,
      updateEmployee: employee.update,
      deleteEmployee: employee.remove,
      addAdvance,
      deleteAdvance,
      addSalaryPayment,
      deleteSalaryPayment,
      completeSale,
      recordReturn,
      resetData: () => setData(clone(initial)),
    }),
    [data],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
