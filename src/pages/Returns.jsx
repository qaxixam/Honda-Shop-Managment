import React, { useMemo, useState } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Printer,
  ArrowRight,
  Package,
  Receipt,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Button, Modal, Input, Select, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";
import { money, date } from "../lib/utils";

export default function Returns() {
  const { sales, returns, recordReturn } = useAppData();

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("Cash");
  const [qtys, setQtys] = useState({});
  const [done, setDone] = useState(null);

  const filtered = useMemo(
    () =>
      sales.filter((s) =>
        `${s.id} ${s.customer}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [sales, q],
  );

  const available = (sale, item) => {
    const already = (returns || [])
      .filter((r) => r.saleId === sale.id)
      .reduce(
        (a, r) =>
          a +
          ((r.items || []).find((x) => x.id === item.id && x.type === item.type)
            ?.qty || 0),
        0,
      );
    return Math.max(0, Number(item.qty || 0) - Number(already || 0));
  };

  const lines = selected?.lineItems || [];
  const chosen = lines
    .map((i, idx) => ({
      ...i,
      idx,
      available: available(selected, i),
      returnQty: Math.min(Number(qtys[idx] || 0), available(selected, i)),
    }))
    .filter((i) => i.returnQty > 0);

  const grossChosen = chosen.reduce(
    (a, i) => a + Number(i.price || 0) * i.returnQty,
    0,
  );

  const remainingGross =
    (selected?.lineItems || []).reduce(
      (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
      0,
    ) -
    (returns || [])
      .filter((r) => r.saleId === selected?.id)
      .reduce(
        (a, r) =>
          a +
          (r.items || []).reduce(
            (x, i) => x + Number(i.price || 0) * Number(i.qty || 0),
            0,
          ),
        0,
      );

  const refundAmount = selected
    ? Math.min(
        grossChosen,
        remainingGross > 0
          ? (Number(selected.total || 0) / remainingGross) * grossChosen
          : grossChosen,
      )
    : 0;

  const totalReturned = selected?.returnedAmount || 0;

  const totalRefunded = (returns || []).reduce(
    (a, r) => a + Number(r.amount || 0),
    0,
  );
  const invoicesWithReturns = new Set((returns || []).map((r) => r.saleId))
    .size;

  function openSale(s) {
    setSelected(s);
    setQtys({});
    setReason("");
    setMethod("Cash");
  }

  function submit() {
    if (!selected || !chosen.length) return;
    const amount = refundAmount;
    const id = recordReturn({
      saleId: selected.id,
      items: chosen.map(({ idx, ...i }) => ({
        type: i.type,
        id: i.id,
        name: i.name,
        price: i.price,
        purchasePrice: i.purchasePrice,
        qty: i.returnQty,
      })),
      refundAmount: amount,
      method,
      reason,
    });
    if (id) {
      setDone({ id, amount, sale: selected });
      setSelected(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Returns & refunds"
        subtitle="Look up an invoice, choose returned quantities, and record the refund."
        action={
          <Link to="/pos">
            <Button variant="secondary">
              <Receipt size={15} />
              Back to POS
            </Button>
          </Link>
        }
      />

      {/* Summary strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Returns recorded" value={(returns || []).length} />
          <Stat label="Refunded" value={money(totalRefunded)} />
          <Stat label="Invoices adjusted" value={invoicesWithReturns} />
        </div>
      </section>

      {/* Invoice lookup */}
      <div className="relative max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hm-text-subtle"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by invoice number or customer…"
          className="pl-9"
        />
      </div>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Invoice</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Date</th>
                <th className="px-4 text-right">Original / current</th>
                <th className="px-4 text-right">Returned</th>
                <th className="px-4 text-right">Due</th>
                <th className="px-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const returned = Number(s.returnedAmount || 0);
                const original = Number(s.total || 0) + returned;
                const due = Number(s.due || 0);
                return (
                  <tr key={s.id}>
                    <td className="px-4 font-medium tabular-nums">{s.id}</td>
                    <td className="px-4">{s.customer}</td>
                    <td className="px-4 tabular-nums text-hm-text-muted">
                      {date(s.date)}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      <span className="text-hm-text-muted">
                        {money(original)}
                      </span>
                      <span className="ml-1.5 text-hm-text-subtle">/</span>
                      <span className="ml-1.5 font-medium text-hm-text">
                        {money(s.total)}
                      </span>
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {returned > 0 ? (
                        <span className="text-hm-text-muted">
                          {money(returned)}
                        </span>
                      ) : (
                        <span className="text-hm-text-subtle">—</span>
                      )}
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
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openSale(s)}
                        >
                          <RotateCcw size={13} />
                          Return
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filtered.length && (
            <div className="px-4 py-12 text-center">
              <Receipt size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                {q ? "No invoices match your search" : "No invoices yet"}
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                {q
                  ? "Try a different invoice number or customer name."
                  : "Once sales are recorded, they'll appear here for return."}
              </p>
              {q && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setQ("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Return history */}
      <Panel bodyClassName="p-0">
        <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
          <div>
            <h2 className="text-hm-title text-hm-text">Return history</h2>
            <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
              {returns?.length
                ? `${Math.min(10, returns.length)} of ${returns.length} return${
                    returns.length === 1 ? "" : "s"
                  }`
                : "No returns recorded"}
            </p>
          </div>
        </div>

        {returns?.length ? (
          <div className="overflow-x-auto">
            <table className="table min-w-[820px]">
              <thead className="table-head">
                <tr>
                  <th className="px-4">Return</th>
                  <th className="px-4">Invoice</th>
                  <th className="px-4">Customer</th>
                  <th className="px-4">Date</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4">Method</th>
                  <th className="px-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {returns.slice(0, 10).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 font-medium tabular-nums">{r.id}</td>
                    <td className="px-4">
                      <Link
                        to={`/insights/invoice/${r.saleId}`}
                        className="tabular-nums text-hm-text hover:underline"
                      >
                        {r.saleId}
                      </Link>
                    </td>
                    <td className="px-4">{r.customer}</td>
                    <td className="px-4 tabular-nums text-hm-text-muted">
                      {date(r.date)}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {money(r.amount)}
                    </td>
                    <td className="px-4 text-hm-text-muted">{r.method}</td>
                    <td className="px-4 text-hm-text-muted">
                      {r.reason || (
                        <span className="text-hm-text-subtle">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <RotateCcw size={22} className="mx-auto text-hm-text-subtle" />
            <p className="mt-3 text-hm-body font-medium text-hm-text">
              No returns yet
            </p>
            <p className="mt-1 text-hm-meta text-hm-text-muted">
              Recorded refunds will appear here.
            </p>
          </div>
        )}
      </Panel>

      {/* Return items modal */}
      <Modal
        open={!!selected}
        title={selected ? `Return items · ${selected.id}` : "Return items"}
        description={
          selected
            ? `${selected.customer} · Enter the quantity being returned.`
            : ""
        }
        onClose={() => setSelected(null)}
        wide
      >
        {selected && (
          <div className="space-y-4">
            {/* Invoice context */}
            <div className="grid grid-cols-2 gap-3 rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2.5">
              <div>
                <div className="text-hm-meta text-hm-text-muted">
                  Current invoice total
                </div>
                <div className="mt-0.5 text-hm-title tabular-nums text-hm-text">
                  {money(selected.total)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-hm-meta text-hm-text-muted">
                  Already returned
                </div>
                <div className="mt-0.5 text-hm-title tabular-nums text-hm-text">
                  {money(totalReturned)}
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="overflow-hidden rounded-hm-md border border-hm-border">
              <table className="table">
                <thead className="table-head">
                  <tr>
                    <th className="px-3">Item</th>
                    <th className="px-3 text-right">Price</th>
                    <th className="px-3 text-right">Available</th>
                    <th className="px-3 text-right w-24">Return qty</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((i, idx) => {
                    const avail = available(selected, i);
                    const disabled = !avail;
                    return (
                      <tr key={idx}>
                        <td className="px-3">
                          <div className="font-medium text-hm-text">
                            {i.name}
                          </div>
                          <div className="text-hm-meta text-hm-text-subtle">
                            {i.type}
                          </div>
                        </td>
                        <td className="px-3 text-right tabular-nums text-hm-text-muted">
                          {money(i.price)}
                        </td>
                        <td className="px-3 text-right tabular-nums">
                          {disabled ? (
                            <span className="text-hm-text-subtle">
                              None left
                            </span>
                          ) : (
                            <span className="text-hm-text">{avail}</span>
                          )}
                        </td>
                        <td className="px-3">
                          <Input
                            disabled={disabled}
                            type="number"
                            min="0"
                            max={avail}
                            value={qtys[idx] || ""}
                            onChange={(e) =>
                              setQtys({ ...qtys, [idx]: e.target.value })
                            }
                            className="text-right tabular-nums"
                            placeholder="0"
                            aria-label={`Return quantity for ${i.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Method + reason */}
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Refund method" htmlFor="ret-method">
                <Select
                  id="ret-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank</option>
                  <option>Credit</option>
                </Select>
              </FormField>
              <FormField label="Reason" htmlFor="ret-reason" hint="Optional">
                <Input
                  id="ret-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Wrong part"
                />
              </FormField>
            </div>

            {/* Refund summary + submit */}
            <div className="rounded-hm-md border border-hm-border bg-hm-surface-2 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-hm-body text-hm-text-muted">
                  Refund amount
                </span>
                <span className="text-[22px] font-medium tabular-nums text-hm-text">
                  {money(refundAmount)}
                </span>
              </div>
              {chosen.length > 0 && (
                <div className="mt-1 text-hm-meta text-hm-text-subtle">
                  {chosen.length} line{chosen.length === 1 ? "" : "s"} ·{" "}
                  {chosen.reduce((a, i) => a + i.returnQty, 0)} unit
                  {chosen.reduce((a, i) => a + i.returnQty, 0) === 1 ? "" : "s"}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                disabled={!chosen.length}
                onClick={submit}
              >
                <CheckCircle2 size={15} />
                {chosen.length
                  ? `Refund ${money(refundAmount)}`
                  : "Confirm refund"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success modal */}
      <Modal
        open={!!done}
        title="Return recorded"
        onClose={() => setDone(null)}
      >
        {done && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-hm-success"
              />
              <div className="min-w-0">
                <div className="text-hm-body text-hm-text">
                  <span className="font-medium">{done.id}</span> ·{" "}
                  {done.sale?.customer || "Walk-in Customer"}
                </div>
                <div className="mt-1 text-[20px] font-medium tabular-nums text-hm-text">
                  {money(done.amount)}
                </div>
                <div className="mt-1 text-hm-meta text-hm-text-muted">
                  Stock and invoice totals have been updated.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer size={15} />
                Print
              </Button>
              <Button onClick={() => setDone(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="px-4 py-3">
      <div className="text-hm-meta text-hm-text-muted">{label}</div>
      <div className="mt-0.5 text-[18px] font-medium tabular-nums text-hm-text">
        {value}
      </div>
    </div>
  );
}
