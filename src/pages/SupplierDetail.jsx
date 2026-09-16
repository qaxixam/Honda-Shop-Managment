import React, { useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Phone,
  MapPin,
  Building2,
  WalletCards,
  PackagePlus,
  CreditCard,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Button, Modal, Input, Select, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { money, date } from "../lib/utils";
import { useAppData } from "../context/AppDataContext";

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { suppliers, products, paySupplier, recordSupplierPurchase } =
    useAppData();

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchase, setPurchase] = useState({
    productId: "",
    qty: "1",
    unitCost: "",
    paid: "",
  });

  const supplier = suppliers.find((s) => s.id === id);

  if (!supplier) {
    return (
      <div className="space-y-4">
        <Back />
        <PageHeader title="Supplier not found" />
        <Panel>
          <div className="px-4 py-12 text-center">
            <Building2 size={22} className="mx-auto text-hm-text-subtle" />
            <p className="mt-3 text-hm-body font-medium text-hm-text">
              We couldn't find supplier {id}.
            </p>
            <p className="mt-1 text-hm-meta text-hm-text-muted">
              It may have been deleted or the link is incorrect.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => navigate("/suppliers")}
            >
              Back to suppliers
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const purchases = [...(supplier.purchases || [])].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  const payments = [...(supplier.payments || [])].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );

  const totalPurchased = Number(supplier.purchased || 0);
  const totalPaid = Number(supplier.paid || 0);
  const totalDue = Number(supplier.due || 0);
  const lastPayment = payments.length > 0 ? payments[0].date : null;

  function openPay() {
    setPayAmount("");
    setPayNote("");
    setPayOpen(true);
  }

  function doPay() {
    if (!Number(payAmount)) return;
    paySupplier(supplier.id, Number(payAmount), payNote);
    setPayOpen(false);
  }

  function openPurchase() {
    setPurchase({ productId: "", qty: "1", unitCost: "", paid: "" });
    setPurchaseOpen(true);
  }

  function addPurchase() {
    if (
      !purchase.productId ||
      !Number(purchase.qty) ||
      !Number(purchase.unitCost)
    )
      return;
    const ok = recordSupplierPurchase({
      ...purchase,
      supplierId: supplier.id,
    });
    if (ok) setPurchaseOpen(false);
  }

  const purchaseTotal =
    Number(purchase.qty || 0) * Number(purchase.unitCost || 0);
  const purchaseCredit = Math.max(
    0,
    purchaseTotal - Number(purchase.paid || 0),
  );

  return (
    <div className="space-y-4">
      <Back />

      <PageHeader
        title={supplier.name}
        subtitle={`${supplier.company || "Supplier"} · ${supplier.id}`}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/suppliers")}
            >
              <Edit3 size={14} />
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={openPurchase}>
              <PackagePlus size={14} />
              Record purchase
            </Button>
            {totalDue > 0 && (
              <Button size="sm" onClick={openPay}>
                <WalletCards size={14} />
                Pay supplier
              </Button>
            )}
          </>
        }
      />

      {/* Summary strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 divide-hm-border sm:divide-x lg:grid-cols-4">
          <Stat label="Total purchased" value={money(totalPurchased)} />
          <Stat label="Total paid" value={money(totalPaid)} tone="success" />
          <Stat
            label="Outstanding"
            value={money(totalDue)}
            tone={totalDue > 0 ? "warning" : "default"}
          />
          <Stat
            label="Last payment"
            value={lastPayment ? date(lastPayment) : "—"}
          />
        </div>
      </section>

      {/* Two columns */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {/* Purchase history */}
          <Panel bodyClassName="p-0">
            <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
              <div>
                <h2 className="text-hm-title text-hm-text">Purchase history</h2>
                <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
                  {purchases.length} record
                  {purchases.length === 1 ? "" : "s"} · newest first
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={openPurchase}>
                <Plus size={13} />
                Add
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="table min-w-[640px]">
                <thead className="table-head">
                  <tr>
                    <th className="px-4">Date</th>
                    <th className="px-4">Product</th>
                    <th className="px-4 text-right">Qty</th>
                    <th className="px-4 text-right">Unit cost</th>
                    <th className="px-4 text-right">Total</th>
                    <th className="px-4 text-right">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 tabular-nums text-hm-text-muted">
                        {date(p.date)}
                      </td>
                      <td className="px-4 font-medium text-hm-text">
                        {p.productName}
                      </td>
                      <td className="px-4 text-right tabular-nums text-hm-text-muted">
                        {p.qty}
                      </td>
                      <td className="px-4 text-right tabular-nums text-hm-text-muted">
                        {money(p.unitCost)}
                      </td>
                      <td className="px-4 text-right tabular-nums font-medium">
                        {money(p.total)}
                      </td>
                      <td className="px-4 text-right tabular-nums text-hm-text-muted">
                        {p.paid > 0 ? money(p.paid) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {purchases.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-hm-border bg-hm-surface-2">
                      <td
                        colSpan={4}
                        className="px-4 py-2.5 text-hm-meta font-medium text-hm-text-muted"
                      >
                        Totals ({purchases.length} purchase
                        {purchases.length === 1 ? "" : "s"})
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-hm-text">
                        {money(
                          purchases.reduce(
                            (a, p) => a + Number(p.total || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-hm-text-muted">
                        {money(
                          purchases.reduce(
                            (a, p) => a + Number(p.paid || 0),
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {!purchases.length && (
                <div className="px-4 py-12 text-center">
                  <PackagePlus
                    size={22}
                    className="mx-auto text-hm-text-subtle"
                  />
                  <p className="mt-3 text-hm-body font-medium text-hm-text">
                    No purchases yet
                  </p>
                  <p className="mt-1 text-hm-meta text-hm-text-muted">
                    Record a purchase to see it here.
                  </p>
                  <Button size="sm" className="mt-3" onClick={openPurchase}>
                    <Plus size={14} />
                    Record purchase
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          {/* Payment history */}
          <Panel bodyClassName="p-0">
            <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
              <div>
                <h2 className="text-hm-title text-hm-text">Payment history</h2>
                <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
                  {payments.length} payment
                  {payments.length === 1 ? "" : "s"} · newest first
                </p>
              </div>
              {totalDue > 0 && (
                <Button variant="secondary" size="sm" onClick={openPay}>
                  <WalletCards size={13} />
                  Pay
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="table min-w-[560px]">
                <thead className="table-head">
                  <tr>
                    <th className="px-4">Date</th>
                    <th className="px-4">Note</th>
                    <th className="px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 tabular-nums text-hm-text-muted">
                        {date(p.date)}
                      </td>
                      <td className="px-4 text-hm-text-muted">
                        {p.note || (
                          <span className="text-hm-text-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 text-right tabular-nums font-medium text-hm-success">
                        {money(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {payments.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-hm-border bg-hm-surface-2">
                      <td
                        colSpan={2}
                        className="px-4 py-2.5 text-hm-meta font-medium text-hm-text-muted"
                      >
                        Total paid
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-hm-text">
                        {money(
                          payments.reduce(
                            (a, p) => a + Number(p.amount || 0),
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {!payments.length && (
                <div className="px-4 py-12 text-center">
                  <WalletCards
                    size={22}
                    className="mx-auto text-hm-text-subtle"
                  />
                  <p className="mt-3 text-hm-body font-medium text-hm-text">
                    No payments yet
                  </p>
                  <p className="mt-1 text-hm-meta text-hm-text-muted">
                    Payments to this supplier will be listed here.
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Info panel */}
        <Panel bodyClassName="p-0">
          <div className="border-b border-hm-border px-4 py-3">
            <h2 className="text-hm-title text-hm-text">Contact</h2>
          </div>

          <dl className="divide-y divide-hm-border">
            <InfoRow icon={Phone} label="Phone">
              {supplier.phone || "—"}
            </InfoRow>
            <InfoRow icon={Building2} label="Company">
              {supplier.company || "—"}
            </InfoRow>
            <InfoRow icon={MapPin} label="Address">
              {supplier.address || "—"}
            </InfoRow>
          </dl>
        </Panel>
      </div>

      {/* Pay supplier modal */}
      <Modal
        open={payOpen}
        title="Pay supplier"
        onClose={() => setPayOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-hm-md border border-hm-warning/30 bg-hm-warning-soft p-3">
            <div className="text-hm-meta font-medium text-hm-warning">
              Outstanding payable
            </div>
            <div className="mt-0.5 text-[22px] font-medium tabular-nums text-hm-warning">
              {money(totalDue)}
            </div>
          </div>

          <FormField label="Amount to pay" required htmlFor="sp-pay-amount">
            <Input
              id="sp-pay-amount"
              type="number"
              min="1"
              max={totalDue}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`Up to ${money(totalDue)}`}
            />
          </FormField>

          <FormField label="Note" htmlFor="sp-pay-note" hint="Optional">
            <Input
              id="sp-pay-note"
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
      </Modal>

      {/* Record purchase modal */}
      <Modal
        open={purchaseOpen}
        title="Record purchase"
        description="Stock increases and the supplier ledger updates."
        onClose={() => setPurchaseOpen(false)}
      >
        <div className="space-y-4">
          <FormField label="Product" required htmlFor="sp-pur-product">
            <Select
              id="sp-pur-product"
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
            <FormField label="Quantity" required htmlFor="sp-pur-qty">
              <Input
                id="sp-pur-qty"
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
              htmlFor="sp-pur-cost"
              hint="Purchase price per unit"
            >
              <Input
                id="sp-pur-cost"
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
            htmlFor="sp-pur-paid"
            hint="0 records the full amount as credit"
          >
            <Input
              id="sp-pur-paid"
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
            <Button variant="secondary" onClick={() => setPurchaseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addPurchase}>
              <PackagePlus size={14} />
              Save purchase
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone = "default" }) {
  const valueColor =
    tone === "warning"
      ? "text-hm-warning"
      : tone === "success"
        ? "text-hm-success"
        : "text-hm-text";
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

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon size={14} className="mt-0.5 shrink-0 text-hm-text-subtle" />
      <div className="min-w-0 flex-1">
        <div className="text-hm-meta text-hm-text-muted">{label}</div>
        <div className="mt-0.5 text-hm-body text-hm-text">{children}</div>
      </div>
    </div>
  );
}

function Back() {
  return (
    <Link
      to="/suppliers"
      className="inline-flex items-center gap-1.5 text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
    >
      <ArrowLeft size={13} />
      Suppliers
    </Link>
  );
}
