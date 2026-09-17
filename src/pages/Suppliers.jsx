import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  WalletCards,
  PackagePlus,
  Truck,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { money } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import {
  Button,
  Modal,
  IconButton,
  Input,
  Select,
  Panel,
} from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";

const blank = { name: "", company: "", phone: "", address: "" };
function nextSupplierId(suppliers) {
  const max = suppliers.reduce((m, s) => {
    const n = parseInt(String(s.id || "").replace("HBSUP-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `HBSUP-${String(max + 1).padStart(3, "0")}`;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const {
    suppliers,
    products,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    paySupplier,
    recordSupplierPurchase,
  } = useAppData();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [form, setForm] = useState(blank);
  const [purchase, setPurchase] = useState({
    productId: "",
    qty: "1",
    unitCost: "",
    paid: "",
  });

  const filtered = useMemo(
    () =>
      suppliers.filter((s) =>
        `${s.name} ${s.company} ${s.phone}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [suppliers, q],
  );

  const payable = suppliers.reduce((a, s) => a + Number(s.due || 0), 0);
  const purchased = suppliers.reduce((a, s) => a + Number(s.purchased || 0), 0);

  function saveSupplier() {
    if (!form.name.trim()) return;
    const id = editing?.id || nextSupplierId(suppliers);
    editing
      ? updateSupplier(editing.id, { ...form })
      : addSupplier({
          ...form,
          id,
          purchased: 0,
          paid: 0,
          due: 0,
          purchases: [],
          payments: [],
        });
    close();
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function edit(s) {
    setEditing(s);
    setForm({ ...s });
    setOpen(true);
  }

  function addPurchase() {
    if (
      !selected ||
      !purchase.productId ||
      !Number(purchase.qty) ||
      !Number(purchase.unitCost)
    )
      return;
    const ok = recordSupplierPurchase({
      ...purchase,
      supplierId: selected.id,
    });
    if (ok) {
      setPurchaseOpen(false);
      setPurchase({ productId: "", qty: "1", unitCost: "", paid: "" });
    }
  }

  function doPay() {
    if (!Number(payAmount)) return;
    paySupplier(selected.id, Number(payAmount), payNote);
    setPayOpen(false);
    setPayAmount("");
    setPayNote("");
  }

  const purchaseTotal =
    Number(purchase.qty || 0) * Number(purchase.unitCost || 0);
  const purchaseCredit = Math.max(
    0,
    purchaseTotal - Number(purchase.paid || 0),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        subtitle="Purchase orders, payments, and payable balances."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={15} />
            Add supplier
          </Button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Suppliers" value={suppliers.length} />
          <Stat label="Total purchased" value={money(purchased)} />
          <Stat
            label="Total payable"
            value={money(payable)}
            tone={payable > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <div className="relative max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hm-text-subtle"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, company, or phone…"
          className="pl-9"
        />
      </div>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[880px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Supplier</th>
                <th className="px-4">Contact</th>
                <th className="px-4 text-right">Purchased</th>
                <th className="px-4 text-right">Paid</th>
                <th className="px-4 text-right">Payable</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const due = Number(s.due || 0);
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/suppliers/${s.id}`)}
                    className="cursor-pointer"
                  >
                    <td className="px-4">
                      <div className="font-medium text-hm-text">{s.name}</div>
                      <div className="text-hm-meta text-hm-text-subtle tabular-nums">
                        {s.id}
                        {s.company ? ` · ${s.company}` : ""}
                      </div>
                    </td>
                    <td className="px-4">
                      <div className="text-hm-text-muted">{s.phone || "—"}</div>
                      {s.address && (
                        <div className="truncate text-hm-meta text-hm-text-subtle">
                          {s.address}
                        </div>
                      )}
                    </td>
                    <td className="px-4 text-right tabular-nums text-hm-text-muted">
                      {money(s.purchased || 0)}
                    </td>
                    <td className="px-4 text-right tabular-nums text-hm-text-muted">
                      {money(s.paid || 0)}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {due > 0 ? (
                        <span className="font-medium text-hm-warning">
                          {money(due)}
                        </span>
                      ) : (
                        <span className="text-hm-text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          label={`Record purchase from ${s.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(s);
                            setPurchase({
                              productId: "",
                              qty: "1",
                              unitCost: "",
                              paid: "",
                            });
                            setPurchaseOpen(true);
                          }}
                        >
                          <PackagePlus size={14} />
                        </IconButton>
                        {due > 0 && (
                          <IconButton
                            label={`Pay ${s.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(s);
                              setPayAmount("");
                              setPayNote("");
                              setPayOpen(true);
                            }}
                          >
                            <WalletCards size={14} />
                          </IconButton>
                        )}
                        <IconButton
                          label={`Edit ${s.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            edit(s);
                          }}
                        >
                          <Edit3 size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${s.name}`}
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${s.name}?`))
                              deleteSupplier(s.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filtered.length && (
            <div className="px-4 py-12 text-center">
              <Truck size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                {q ? "No suppliers match your search" : "No suppliers yet"}
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                {q
                  ? "Try a different name, company, or phone."
                  : "Add suppliers to track purchases and payables."}
              </p>
              {q ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setQ("")}
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setOpen(true)}
                >
                  <Plus size={14} />
                  Add supplier
                </Button>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Add / edit supplier */}
      <Modal
        open={open}
        title={editing ? "Edit supplier" : "Add supplier"}
        onClose={close}
      >
        <div className="space-y-3">
          <FormField label="Supplier name" required htmlFor="sup-name">
            <Input
              id="sup-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Honda Parts Distributor"
            />
          </FormField>
          <FormField label="Company" htmlFor="sup-company">
            <Input
              id="sup-company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company name"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Phone" htmlFor="sup-phone">
              <Input
                id="sup-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0300-1234567"
              />
            </FormField>
            <FormField label="Address" htmlFor="sup-address">
              <Input
                id="sup-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Peshawar"
              />
            </FormField>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={saveSupplier}>
            {editing ? "Save changes" : "Add supplier"}
          </Button>
        </div>
      </Modal>

      {/* Record purchase */}
      <Modal
        open={purchaseOpen}
        title="Record purchase"
        description="Stock increases and the supplier ledger updates."
        onClose={() => setPurchaseOpen(false)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-hm-md border border-hm-border bg-hm-surface-2 p-3">
              <div className="text-hm-meta text-hm-text-muted">Supplier</div>
              <div className="mt-0.5 text-hm-body font-medium text-hm-text">
                {selected.name}
              </div>
            </div>

            <FormField label="Product" required htmlFor="pur-product">
              <Select
                id="pur-product"
                value={purchase.productId}
                onChange={(e) =>
                  setPurchase({ ...purchase, productId: e.target.value })
                }
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · Rack {p.rack}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Quantity" required htmlFor="pur-qty">
                <Input
                  id="pur-qty"
                  type="number"
                  min="1"
                  value={purchase.qty}
                  onChange={(e) =>
                    setPurchase({ ...purchase, qty: e.target.value })
                  }
                />
              </FormField>
              <FormField
                label="Unit cost"
                required
                htmlFor="pur-cost"
                hint="Purchase price per unit"
              >
                <Input
                  id="pur-cost"
                  type="number"
                  min="0"
                  value={purchase.unitCost}
                  onChange={(e) =>
                    setPurchase({ ...purchase, unitCost: e.target.value })
                  }
                />
              </FormField>
            </div>

            <FormField
              label="Amount paid now"
              htmlFor="pur-paid"
              hint="0 records the full amount as credit"
            >
              <Input
                id="pur-paid"
                type="number"
                min="0"
                value={purchase.paid}
                onChange={(e) =>
                  setPurchase({ ...purchase, paid: e.target.value })
                }
              />
            </FormField>

            <div className="rounded-hm-md border border-hm-border bg-hm-surface-2 p-3 text-hm-body">
              <div className="flex justify-between">
                <span className="text-hm-text-muted">Total</span>
                <strong className="tabular-nums text-hm-text">
                  {money(purchaseTotal)}
                </strong>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-hm-text-muted">Credit added</span>
                <strong className="tabular-nums text-hm-warning">
                  {money(purchaseCredit)}
                </strong>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setPurchaseOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addPurchase}>
                <PackagePlus size={14} />
                Save purchase
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay supplier */}
      <Modal
        open={payOpen}
        title="Pay supplier"
        onClose={() => setPayOpen(false)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-hm-md border border-hm-warning/30 bg-hm-warning-soft p-3">
              <div className="text-hm-meta font-medium text-hm-warning">
                Outstanding payable
              </div>
              <div className="mt-0.5 text-[22px] font-medium tabular-nums text-hm-warning">
                {money(selected.due)}
              </div>
            </div>

            <FormField label="Amount to pay" required htmlFor="pay-amount">
              <Input
                id="pay-amount"
                type="number"
                min="1"
                max={selected.due}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={`Up to ${money(selected.due)}`}
              />
            </FormField>

            <FormField label="Note" htmlFor="pay-note" hint="Optional">
              <Input
                id="pay-note"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="e.g. Cash, cheque #1234"
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button onClick={doPay}>
                <CreditCard size={14} />
                Record payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone = "default" }) {
  const valueColor = tone === "warning" ? "text-hm-warning" : "text-hm-text";
  return (
    <div className="px-4 py-3">
      <div className="text-hm-meta text-hm-text-muted">{label}</div>
      <div
        className={`mt-0.5 text-[18px] font-medium tabular-nums ${valueColor}`}
      >
        {value}
      </div>
    </div>
  );
}
