import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  UserPlus,
  CheckCircle2,
  Package,
  Wrench,
  Eye,
  EyeOff,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Button, Modal, useToast } from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";
import { money, todayISO } from "../lib/utils";
import { findStockIssue, productQuantityInCart } from "../lib/inventory";
import { billMetrics } from "../lib/billing";
import AddProductModal from "../components/AddProductModal";
import AddServiceModal from "../components/AddServiceModal";
import CartPanel from "../components/pos/CartPanel";
import CustomerPanel from "../components/pos/CustomerPanel";
import PaymentSummary from "../components/pos/PaymentSummary";
import ReceiptPrint from "../components/pos/ReceiptPrint";

export default function POS() {
  const {
    products,
    services,
    customers,
    addCustomer,
    completeSale,
    upsertBillDraft,
    removeBillDraft,
    billDrafts,
    shopSettings,
  } = useAppData();
  const { showToast } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [paid, setPaid] = useState("");
  const [paidTouched, setPaidTouched] = useState(false);
  const [method, setMethod] = useState("Cash");
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [savedSale, setSavedSale] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [draftId, setDraftId] = useState(() => `DRAFT-${Date.now()}`);
  const [searchParams] = useSearchParams();
  const draftToOpen = searchParams.get("draft");
  const loadedDraftRef = useRef("");

  useEffect(() => {
    if (!draftToOpen || loadedDraftRef.current === draftToOpen) return;
    const draft = (billDrafts || []).find((item) => item.id === draftToOpen);
    if (!draft || !Array.isArray(draft.lineItems)) return;
    loadedDraftRef.current = draftToOpen;
    setDraftId(draft.id);
    setCart(draft.lineItems);
    setCustomerId(draft.customerId || "");
    setDiscountType(draft.discountType || "none");
    setDiscountValue(draft.discountValue ? String(draft.discountValue) : "");
    setPaid(draft.paid ? String(draft.paid) : "");
    setPaidTouched(true);
    setMethod(draft.method || "Cash");
  }, [billDrafts, draftToOpen]);


  useEffect(() => {
    const clean = () => document.body.classList.remove("receipt-mode");
    window.addEventListener("afterprint", clean);
    return () => window.removeEventListener("afterprint", clean);
  }, []);

  const printReceipt = () => {
    document.body.classList.add("receipt-mode");
    setTimeout(() => window.print(), 50);
  };

  useEffect(() => {
    if (customerId && !customers.find((c) => c.id === customerId)) {
      setCustomerId("");
    }
  }, [customerId, customers]);

  const customer = customers.find((c) => c.id === customerId) || null;

  const subtotal = cart.reduce(
    (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
    0,
  );

  const discountAmount = useMemo(() => {
    const v = Math.max(0, Number(discountValue) || 0);
    if (discountType === "percentage")
      return Math.min(subtotal, subtotal * (Math.min(100, v) / 100));
    if (discountType === "fixed") return Math.min(subtotal, v);
    return 0;
  }, [subtotal, discountType, discountValue]);

  const total = Math.max(0, subtotal - discountAmount);
  const safePaid = Math.min(Math.max(0, Number(paid) || 0), total);
  const due = Math.max(0, total - safePaid);
  const earnings = useMemo(
    () => billMetrics(cart, discountAmount),
    [cart, discountAmount],
  );

  useEffect(() => {
    if (!cart.length) {
      removeBillDraft(draftId);
      return;
    }

    upsertBillDraft({
      id: draftId,
      customer: customer?.name || "Walk-in Customer",
      customerId: customerId || null,
      date: todayISO(),
      subtotal,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountAmount,
      total,
      paid: safePaid,
      due,
      method,
      status: due > 0 ? "Partial" : "Unpaid",
      items: cart.map((item) => item.name),
      lineItems: cart,
      profit: earnings.netProfit,
      updatedAt: new Date().toISOString(),
    });
  }, [
    cart,
    customerId,
    customer?.name,
    discountAmount,
    discountType,
    discountValue,
    draftId,
    due,
    earnings.netProfit,
    method,
    safePaid,
    subtotal,
    total,
  ]);

  useEffect(() => {
    if (!paidTouched && total > 0) {
      setPaid(String(total));
    }
    if (total === 0 && !paidTouched) {
      setPaid("");
    }
  }, [total, paidTouched]);

  function addItem(item, type) {
    const sellingPrice = Number(
      item.price ?? (type === "product" ? item.sellingPrice : item.charges),
    );
    const purchasePrice = Number(
      type === "product" ? item.purchasePrice : item.cost,
    );
    if (sellingPrice <= 0 || purchasePrice <= 0) {
      showToast(
        `${item.name} needs both a selling price and purchase price before it can be billed.`,
        "warning",
      );
      return;
    }
    if (type === "service" && item.active === false) {
      showToast(`${item.name} is disabled.`, "warning");
      return;
    }
    if (type === "product" && Number(item.stock) <= 0) {
      showToast(`${item.name} is out of stock.`, "warning");
      return;
    }
    const price = sellingPrice;
    setCart((current) => {
      const found = current.find((i) => i.id === item.id && i.type === type);
      if (found) {
        if (
          type === "product" &&
          productQuantityInCart(current, item.id) >= Number(item.stock || 0)
        ) {
          showToast(`${item.name} has only ${item.stock} in stock.`, "warning");
          return current;
        }
        return current.map((i) =>
          i.id === item.id && i.type === type ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...current,
        {
          type,
          id: item.id,
          name: item.name,
          price,
          qty: 1,
          purchasePrice: Number(
            type === "service" ? item.cost || 0 : item.purchasePrice || 0,
          ),
        },
      ];
    });
  }

  function changeQty(id, type, delta) {
    setCart((current) =>
      current.map((i) => {
        if (i.id !== id || i.type !== type) return i;
        const source =
          type === "product" ? products.find((p) => p.id === id) : null;
        const next = Math.max(1, Number(i.qty) + delta);
        return source
          ? { ...i, qty: Math.min(next, Math.max(1, Number(source.stock))) }
          : { ...i, qty: next };
      }),
    );
  }

  function saveCustomer() {
    if (!newCustomer.name.trim()) return;
    const max = customers.reduce((m, c) => {
      const n = parseInt(String(c.id || "").replace("HBC-", ""), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    const id = `HBC-${String(max + 1).padStart(3, "0")}`;
    addCustomer({ ...newCustomer, id, visits: 0, spent: 0, due: 0 });
    setCustomerId(id);
    setNewCustomer({ name: "", phone: "", address: "" });
    setShowAddCustomer(false);
    setShowCustomer(false);
    setPaidTouched(false);
  }

  function saveSale(shouldPrint = false) {
    if (!cart.length) return;

    const stockIssue = findStockIssue(cart, products);
    if (stockIssue) {
      showToast(stockIssue.message, "danger");
      return;
    }

    if (due > 0 && !customerId) {
      showToast("Attach a customer before saving a partial payment.", "danger");
      return;
    }

    const id = completeSale({
      customerId,
      items: cart,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      total,
      paid: safePaid,
      method,
    });
    if (!id) {
      showToast("Stock changed before the sale could be saved.", "danger");
      return;
    }
    removeBillDraft(draftId);
    const sale = {
      id,
      customer: customer?.name || "Walk-in Customer",
      date: todayISO(),
      subtotal,
      discountType,
      discountValue: Number(discountValue) || 0,
      discountAmount,
      total,
      paid: safePaid,
      due,
      method,
      lineItems: cart,
    };
    setSavedSale(sale);
    setSuccess(true);
    setCart([]);
    setPaid("");
    setPaidTouched(false);
    setCustomerId("");
    setMethod("Cash");
    setDiscountType("none");
    setDiscountValue("");
    setDraftId(`DRAFT-${Date.now()}`);
    if (shouldPrint) printReceipt();
  }

  function newSale() {
    setSuccess(false);
    setSavedSale(null);
    setCart([]);
    setPaid("");
    setPaidTouched(false);
    setCustomerId("");
    setMethod("Cash");
    setDiscountType("none");
    setDiscountValue("");
    setDraftId(`DRAFT-${Date.now()}`);
  }

  return (
    <div>
      {/* ✅ Bill profit bar — upar, poore width mein */}
      <div className="mb-4">
        <EarningsPanel
          earnings={earnings}
          show={showEarnings}
          onToggle={() => setShowEarnings((value) => !value)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        {/* LEFT: buttons + bill */}
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="group flex flex-col items-start justify-between gap-6 rounded-hm-lg border border-hm-border bg-hm-surface p-5 text-left transition-colors hover:border-hm-border-strong hover:bg-hm-surface-2"
            >
              <div className="grid h-10 w-10 place-items-center rounded-hm-md border border-hm-border bg-hm-surface-2 text-hm-text">
                <Package size={18} />
              </div>
              <div>
                <div className="text-hm-title text-hm-text">Add product</div>
                <div className="mt-0.5 text-hm-meta text-hm-text-muted">
                  {products.length} product
                  {products.length === 1 ? "" : "s"} in stock
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowServiceModal(true)}
              className="group flex flex-col items-start justify-between gap-6 rounded-hm-lg border border-hm-border bg-hm-surface p-5 text-left transition-colors hover:border-hm-border-strong hover:bg-hm-surface-2"
            >
              <div className="grid h-10 w-10 place-items-center rounded-hm-md border border-hm-border bg-hm-surface-2 text-hm-text">
                <Wrench size={18} />
              </div>
              <div>
                <div className="text-hm-title text-hm-text">Add service</div>
                <div className="mt-0.5 text-hm-meta text-hm-text-muted">
                  {services.length} service
                  {services.length === 1 ? "" : "s"} available
                </div>
              </div>
            </button>
          </div>

          <CartPanel
            cart={cart}
            products={products}
            onQty={changeQty}
            onRemove={(item) => setCart((c) => c.filter((x) => x !== item))}
          />
        </section>

        {/* RIGHT: customer → payment, sticky */}
        <aside className="space-y-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <CustomerPanel
            customer={customer}
            onSelect={() => setShowCustomer(true)}
            onAdd={() => setShowAddCustomer(true)}
            onClear={() => setCustomerId("")}
          />

          <PaymentSummary
            total={total}
            subtotal={subtotal}
            discount={discountAmount}
            discountType={discountType}
            discountValue={discountValue}
            setDiscountType={setDiscountType}
            setDiscountValue={setDiscountValue}
            paid={paid}
            setPaid={(v) => {
              setPaidTouched(true);
              setPaid(v);
            }}
            due={due}
            method={method}
            setMethod={setMethod}
            disabled={!cart.length}
            onSave={() => saveSale(false)}
            onPrint={() => saveSale(true)}
          />
        </aside>
      </div>

      {/* Add product modal */}
      <AddProductModal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={products}
        cart={cart}
        onAdd={addItem}
      />

      {/* Add service modal */}
      <AddServiceModal
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        services={services}
        cart={cart}
        onAdd={addItem}
      />

      <div className="no-print">
        <Modal
          open={showCustomer}
          title="Attach customer"
          description="Choose an account so this bill updates their balance."
          onClose={() => setShowCustomer(false)}
        >
          <CustomerSearchList
            customers={customers}
            onSelect={(id) => {
              setCustomerId(id);
              setShowCustomer(false);
            }}
          />
        </Modal>

        <Modal
          open={showAddCustomer}
          title="New customer"
          description="The customer is immediately available in POS and Customers."
          onClose={() => setShowAddCustomer(false)}
        >
          <div className="space-y-3">
            <FormField label="Name" required htmlFor="pos-new-customer-name">
              <input
                id="pos-new-customer-name"
                className="input"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                placeholder="Customer name"
              />
            </FormField>
            <FormField label="Phone" htmlFor="pos-new-customer-phone">
              <input
                id="pos-new-customer-phone"
                className="input"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                placeholder="0300-1234567"
              />
            </FormField>
            <FormField label="Address" htmlFor="pos-new-customer-address">
              <input
                id="pos-new-customer-address"
                className="input"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
                placeholder="Peshawar"
              />
            </FormField>
            <Button className="w-full" onClick={saveCustomer}>
              <UserPlus size={15} />
              Save customer
            </Button>
          </div>
        </Modal>

        <Modal
          open={success}
          title="Sale saved"
          onClose={() => setSuccess(false)}
        >
          {savedSale && (
            <div>
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-hm-success"
                />
                <div className="min-w-0">
                  <div className="text-hm-body text-hm-text">
                    Invoice <span className="font-medium">{savedSale.id}</span>{" "}
                    · {savedSale.customer}
                  </div>
                  <div className="mt-1 text-[20px] font-medium tabular-nums text-hm-text">
                    {money(savedSale.total)}
                  </div>
                  {savedSale.discountAmount > 0 && (
                    <div className="mt-1 text-hm-meta text-hm-text-muted">
                      Discount applied {money(savedSale.discountAmount)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={printReceipt}
                >
                  Print again
                </Button>
                <Button className="flex-1" onClick={newSale}>
                  New sale
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>

      <ReceiptPrint sale={savedSale} shopName={shopSettings?.shopName || "Honda Bike Shop"} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bill profit bar — Easypaisa/JazzCash style hide/unhide              */
/* ------------------------------------------------------------------ */

function EarningsPanel({ earnings, show, onToggle }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        {/* Left: label + toggle */}
        <div className="flex items-center gap-3">
          <h2 className="text-hm-body font-medium text-hm-text">Bill profit</h2>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 rounded-hm-sm border border-hm-border px-2 py-1 text-hm-meta font-medium text-hm-text-muted transition-colors hover:bg-hm-surface-2 hover:text-hm-text"
            aria-label={show ? "Hide profit" : "Show profit"}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
            {show ? "Hide" : "Show"}
          </button>
        </div>

        {/* Right: figures ya dots */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {show ? (
            <>
              <Figure label="Product" value={earnings.productProfit} />
              <Figure label="Service" value={earnings.serviceProfit} />
              <Figure label="Before discount" value={earnings.grossProfit} />
              <Figure
                label="Net profit"
                value={earnings.netProfit}
                emphasis
                tone={earnings.netProfit < 0 ? "danger" : "success"}
              />
            </>
          ) : (
            <span
              className="select-none text-hm-body tracking-[0.2em] text-hm-text-subtle"
              aria-hidden="true"
            >
              ••••••
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Figure({ label, value, emphasis = false, tone = "default" }) {
  const color =
    tone === "danger"
      ? "text-hm-danger"
      : tone === "success"
        ? "text-hm-success"
        : "text-hm-text";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-hm-meta text-hm-text-subtle">{label}</span>
      <span
        className={`tabular-nums ${color} ${
          emphasis ? "text-hm-body font-semibold" : "text-hm-body font-medium"
        }`}
      >
        {money(value)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer picker (unchanged)                                         */
/* ------------------------------------------------------------------ */

function CustomerSearchList({ customers, onSelect }) {
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) =>
    `${c.name} ${c.phone} ${c.id}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="mb-3 rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2">
        <input
          autoFocus
          className="w-full bg-transparent text-hm-body text-hm-text outline-none placeholder:text-hm-text-subtle"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, or account ID…"
        />
      </div>

      <ul className="max-h-96 divide-y divide-hm-border overflow-y-auto rounded-hm-md border border-hm-border">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-hm-surface-2"
              onClick={() => onSelect(c.id)}
            >
              <div className="min-w-0">
                <div className="truncate text-hm-body font-medium text-hm-text">
                  {c.name}
                </div>
                <div className="truncate text-hm-meta text-hm-text-subtle tabular-nums">
                  {c.phone || "No phone"} · {c.id}
                </div>
              </div>
              <span className="shrink-0 text-hm-body font-medium tabular-nums text-hm-text-muted">
                {money(c.due || 0)}
              </span>
            </button>
          </li>
        ))}
        {!filtered.length && (
          <li className="px-3 py-8 text-center text-hm-body text-hm-text-muted">
            No customer found.
          </li>
        )}
      </ul>
    </>
  );
}




