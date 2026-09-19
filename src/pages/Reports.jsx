import React, { useMemo, useState } from "react";
import { Download, Printer, FileText, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { money, date, todayISO } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import { Button, Panel } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const ranges = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

export default function Reports() {
  const { sales, expenses, returns } = useAppData();
  const [period, setPeriod] = useState("daily");

  const anchor = todayISO();

  const filtered = useMemo(
    () => filterPeriod({ sales, expenses, returns }, period, anchor),
    [sales, expenses, returns, period, anchor],
  );

  const range = useMemo(() => dateRange(period, anchor), [period, anchor]);

  const revenue = filtered.sales.reduce((a, b) => a + Number(b.total || 0), 0);
  const grossBeforeReturns = filtered.sales.reduce(
    (a, b) => a + Number(b.subtotal ?? b.total ?? 0),
    0,
  );
  const discount = filtered.sales.reduce(
    (a, b) => a + Number(b.discountAmount || 0),
    0,
  );
  const returned = filtered.returns.reduce(
    (a, b) => a + Number(b.amount || 0),
    0,
  );
  const collected = filtered.sales.reduce((a, b) => a + Number(b.paid || 0), 0);
  const due = filtered.sales.reduce((a, b) => a + Number(b.due || 0), 0);
  const cost = filtered.sales.reduce((sum, s) => {
    const grossCost = (s.lineItems || [])
      .filter((i) => i.type === "product")
      .reduce(
        (a, i) => a + Number(i.purchasePrice || 0) * Number(i.qty || 0),
        0,
      );
    const returnedCost = filtered.returns
      .filter((r) => r.saleId === s.id)
      .reduce(
        (rs, r) =>
          rs +
          (r.items || [])
            .filter((i) => i.type === "product")
            .reduce(
              (a, i) => a + Number(i.purchasePrice || 0) * Number(i.qty || 0),
              0,
            ),
        0,
      );
    return sum + Math.max(0, grossCost - returnedCost);
  }, 0);
  const exp = filtered.expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  const net = revenue - returned - cost - exp;

  function exportCsv() {
    const rows = [
      [
        "Invoice",
        "Customer",
        "Date",
        "Subtotal",
        "Discount",
        "Total",
        "Paid",
        "Due",
        "Method",
        "Status",
      ],
      ...filtered.sales.map((s) => [
        s.id,
        s.customer,
        s.date,
        s.subtotal ?? s.total,
        s.discountAmount || 0,
        s.total,
        s.paid,
        s.due,
        s.method,
        s.status,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `hbms-${period}-report.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function print() {
    document.title = `HBMS-${period}-report`;
    window.print();
  }

  async function exportPdf() {
    const file = await window.hbmsDesktop?.exportReportPdf({
      title: "HBMS Report",
      periodKey: period,
      periodLabel: ranges[period],
      rangeLabel: range.label,
      generatedAt: new Date().toLocaleString("en-PK"),
      summary: { netSale: revenue, discount, returns: returned, netProfit: net },
      bills: filtered.sales.map((s) => ({
        invoice: s.id,
        customer: s.customer,
        date: date(s.date),
        subtotal: s.subtotal ?? s.total,
        net: s.total,
        due: s.due,
      })),
      returns: filtered.returns.map((r) => ({
        invoice: r.saleId,
        customer: r.customer,
        date: date(r.date),
        amount: r.amount,
        reason: r.reason,
      })),
    });
    if (file) window.alert(`PDF report saved to:\n${file}`);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle="Sales, profit, and returns by period."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={print}>
              <Printer size={15} />
              Print
            </Button>
            <Button variant="secondary" onClick={exportPdf}>
              <FileText size={15} />
              Export PDF
            </Button>
            <Button onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Period selector */}
      <section className="panel no-print">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-hm-meta text-hm-text-muted">Period</div>
            <div className="mt-0.5 text-hm-title tabular-nums text-hm-text">
              {range.label}
            </div>
          </div>
          <div
            className="grid grid-cols-4 rounded-hm-md border border-hm-border p-0.5"
            role="tablist"
            aria-label="Report period"
          >
            {Object.entries(ranges).map(([key, label]) => {
              const active = period === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(key)}
                  className={[
                    "rounded-hm-xs px-3 py-1.5 text-hm-meta font-medium transition-colors",
                    active
                      ? "bg-hm-primary text-white"
                      : "text-hm-text-muted hover:bg-hm-surface-2 hover:text-hm-text",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Primary metrics strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 divide-hm-border sm:divide-x lg:grid-cols-4">
          <Stat
            label="Net sales"
            value={money(revenue)}
            hint={`${filtered.sales.length} invoices`}
            className="border-b border-hm-border sm:border-b-0 lg:border-b-0"
          />
          <Stat
            label="Discounts"
            value={money(discount)}
            hint="Customer savings"
            className="border-b border-hm-border sm:border-b-0 lg:border-b-0"
          />
          <Stat
            label="Returns"
            value={money(returned)}
            hint={`${filtered.returns.length} return${
              filtered.returns.length === 1 ? "" : "s"
            }`}
            className="lg:border-l lg:border-hm-border"
          />
          <Stat
            label="Net profit"
            value={money(net)}
            hint="After cost & expenses"
            tone={net < 0 ? "danger" : "default"}
            className="border-t border-hm-border sm:border-t-0 lg:border-t-0"
          />
        </div>
      </section>

      {/* Sales record */}
      <Panel bodyClassName="p-0">
        <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
          <div>
            <h2 className="text-hm-title text-hm-text">
              All bills
            </h2>
            <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
              {range.label}
            </p>
          </div>
          <span className="text-hm-meta text-hm-text-subtle tabular-nums">
            {filtered.sales.length} row
            {filtered.sales.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Invoice</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Date</th>
                <th className="px-4 text-right">Subtotal</th>
                <th className="px-4 text-right">Net</th>
                <th className="px-4 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 font-medium tabular-nums">
                    <Link
                      to={`/insights/invoice/${s.id}`}
                      className="text-hm-text hover:underline"
                    >
                      {s.id}
                    </Link>
                  </td>
                  <td className="px-4">
                    {s.customerId ? (
                      <Link
                        to={`/customers/${s.customerId}`}
                        className="text-hm-text hover:underline"
                      >
                        {s.customer}
                      </Link>
                    ) : (
                      s.customer
                    )}
                  </td>
                  <td className="px-4 tabular-nums text-hm-text-muted">
                    {date(s.date)}
                  </td>
                  <td className="px-4 text-right tabular-nums text-hm-text-muted">
                    {money(s.subtotal ?? s.total)}
                  </td>
                  <td className="px-4 text-right tabular-nums font-medium">
                    {money(s.total)}
                  </td>
                  <td className="px-4 text-right tabular-nums">
                    {Number(s.due || 0) > 0 ? (
                      <span className="text-hm-warning">{money(s.due)}</span>
                    ) : (
                      <span className="text-hm-text-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.sales.length && (
            <div className="px-4 py-12 text-center">
              <FileText size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No sales in this period
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                Try a wider period to see activity.
              </p>
              {period !== "annual" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    setPeriod(period === "daily" ? "weekly" : "annual")
                  }
                >
                  Widen period
                </Button>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Returns in period */}
      <Panel bodyClassName="p-0">
        <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
          <div>
            <h2 className="text-hm-title text-hm-text">
              Returns
            </h2>
            <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
              {range.label}
            </p>
          </div>
          <span className="text-hm-meta text-hm-text-subtle tabular-nums">
            {filtered.returns.length} record
            {filtered.returns.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Invoice</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Date</th>
                <th className="px-4 text-right">Amount</th>
                <th className="px-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.returns.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 tabular-nums">
                    <Link
                      to={`/insights/invoice/${r.saleId}`}
                      className="text-hm-text hover:underline"
                    >
                      {r.saleId}
                    </Link>
                  </td>
                  <td className="px-4">{r.customer}</td>
                  <td className="px-4 tabular-nums text-hm-text-muted">
                    {date(r.date)}
                  </td>
                  <td className="px-4 text-right tabular-nums font-medium">
                    {money(r.amount)}
                  </td>
                  <td className="px-4 text-hm-text-muted">
                    {r.reason || <span className="text-hm-text-subtle">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.returns.length && (
            <div className="px-4 py-12 text-center">
              <RotateCcw size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No returns in this period
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                When a sale is returned, it will be listed here.
              </p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Local helpers ---------- */

function Stat({ label, value, hint, tone = "default", className = "" }) {
  const valueColor = tone === "danger" ? "text-hm-danger" : "text-hm-text";
  return (
    <div className={`px-4 py-3 ${className}`}>
      <div className="text-hm-meta text-hm-text-muted">{label}</div>
      <div
        className={`mt-0.5 text-[20px] font-medium tabular-nums ${valueColor}`}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-hm-meta text-hm-text-subtle">{hint}</div>
      )}
    </div>
  );
}

function PLCell({ label, value, emphasis = false, tone = "default" }) {
  const valueColor =
    tone === "danger"
      ? "text-hm-danger"
      : emphasis
        ? "text-hm-text"
        : "text-hm-text-muted";
  return (
    <div>
      <div className="text-hm-meta text-hm-text-muted">{label}</div>
      <div
        className={`mt-0.5 tabular-nums ${valueColor} ${
          emphasis
            ? "text-[22px] font-medium tracking-tight"
            : "text-[18px] font-medium"
        }`}
      >
        {money(value)}
      </div>
    </div>
  );
}

function PLDeduction({ label, value }) {
  return (
    <div className="flex items-baseline justify-between text-hm-meta">
      <span className="text-hm-text-muted">Less: {label}</span>
      <span className="tabular-nums text-hm-text-muted">
        {value > 0 ? `− ${money(value)}` : "—"}
      </span>
    </div>
  );
}

function PLBalance({ label, value, tone = "default" }) {
  const valueColor = tone === "warning" ? "text-hm-warning" : "text-hm-text";
  return (
    <div className="flex items-baseline justify-between text-hm-meta">
      <span className="text-hm-text-muted">{label}</span>
      <span className={`tabular-nums font-medium ${valueColor}`}>
        {money(value)}
      </span>
    </div>
  );
}

/* ---------- Period helpers (logic untouched) ---------- */

function filterPeriod({ sales, expenses, returns }, period, anchor) {
  const end = new Date(`${anchor}T23:59:59`);
  const start = new Date(end);
  if (period === "daily") start.setHours(0, 0, 0, 0);
  if (period === "weekly") {
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  }
  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  if (period === "annual") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  const inRange = (x) => {
    const d = new Date(`${x.date}T12:00:00`);
    return d >= start && d <= end;
  };
  return {
    sales: sales.filter(inRange),
    expenses: expenses.filter(inRange),
    returns: (returns || []).filter(inRange),
  };
}

function dateRange(period, anchor) {
  const end = new Date(`${anchor}T23:59:59`);
  const start = new Date(end);
  if (period === "daily") start.setHours(0, 0, 0, 0);
  if (period === "weekly") {
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  }
  if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  if (period === "annual") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  const fmt = (d) =>
    new Intl.DateTimeFormat("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);

  if (period === "daily") return { label: fmt(start), start, end };
  return { label: `${fmt(start)} – ${fmt(end)}`, start, end };
}
