import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FileText, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Input, Panel, Select, Status } from "../components/ui";
import { useAppData } from "../context/AppDataContext";
import { money, date, todayISO } from "../lib/utils";
import { saleMetrics } from "../lib/billing";

const currentYear = new Date().getFullYear();
const currentMonth = todayISO().slice(0, 7);

export default function BillHistory() {
  const { sales, billDrafts } = useAppData();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("All");
  const [status, setStatus] = useState("All");
  const [period, setPeriod] = useState("All");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(String(currentYear));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    const saved = sales.map((sale) => ({
      ...sale,
      kind: "Saved",
      ref: sale.id,
      profit: saleMetrics(sale).netProfit,
    }));
    const drafts = (billDrafts || []).map((draft) => ({
      ...draft,
      kind: "Unsaved",
      ref: draft.id,
      profit: Number(draft.profit || saleMetrics(draft).netProfit || 0),
    }));

    return [...drafts, ...saved]
      .filter((row) => matchesSearch(row, q))
      .filter((row) => kind === "All" || row.kind === kind)
      .filter((row) => matchesStatus(row, status))
      .filter((row) => matchesPeriod(row, { period, month, year, from, to }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [billDrafts, from, kind, month, period, q, sales, status, to, year]);

  const totals = rows.reduce(
    (acc, row) => {
      acc.total += Number(row.total || 0);
      acc.paid += Number(row.paid || 0);
      acc.due += Number(row.due || 0);
      acc.profit += Number(row.profit || 0);
      return acc;
    },
    { total: 0, paid: 0, due: 0, profit: 0 },
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bill history"
        subtitle="Saved invoices and unsaved POS bills in one place."
      />

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 divide-hm-border sm:divide-x lg:grid-cols-4">
          <Stat label="Bills" value={rows.length} />
          <Stat label="Total" value={money(totals.total)} />
          <Stat label="Collected" value={money(totals.paid)} />
          <Stat
            label="Outstanding"
            value={money(totals.due)}
            tone={totals.due > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <Panel bodyClassName="p-3">
        <div className="grid gap-2 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hm-text-subtle"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search invoice, customer, item..."
              className="pl-9"
            />
          </div>
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option>All</option>
            <option>Saved</option>
            <option>Unsaved</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Paid</option>
            <option>Partial</option>
            <option>Unpaid</option>
          </Select>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>All</option>
            <option>Last 7 days</option>
            <option>Month</option>
            <option>Year</option>
            <option>Custom</option>
          </Select>
          {period === "Month" ? (
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          ) : period === "Year" ? (
            <Input
              type="number"
              min="2000"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          ) : period === "Custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From date"
              />
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To date"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-hm-md border border-hm-border px-3 text-hm-meta text-hm-text-muted">
              <CalendarDays size={14} />
              {period}
            </div>
          )}
        </div>
      </Panel>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[980px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Bill</th>
                <th className="px-4">Customer</th>
                <th className="px-4">Date</th>
                <th className="px-4">Items</th>
                <th className="px-4 text-right">Total</th>
                <th className="px-4 text-right">Paid</th>
                <th className="px-4 text-right">Due</th>
                <th className="px-4 text-right">Profit</th>
                <th className="px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.ref}`}>
                  <td className="px-4">
                    <div className="font-medium tabular-nums text-hm-text">
                      {row.kind === "Saved" ? (
                        <Link
                          to={`/insights/invoice/${row.id}`}
                          className="hover:underline"
                        >
                          {row.ref}
                        </Link>
                      ) : (
                        row.ref
                      )}
                    </div>
                    <div className="mt-0.5">
                      <Status tone={row.kind === "Saved" ? "success" : "warning"}>
                        {row.kind}
                      </Status>
                    </div>
                  </td>
                  <td className="px-4">{row.customer}</td>
                  <td className="px-4 tabular-nums text-hm-text-muted">
                    {date(row.date)}
                  </td>
                  <td className="max-w-xs truncate px-4 text-hm-meta text-hm-text-subtle">
                    {(row.items || []).join(", ") || "—"}
                  </td>
                  <td className="px-4 text-right tabular-nums font-medium">
                    {money(row.total)}
                  </td>
                  <td className="px-4 text-right tabular-nums text-hm-text-muted">
                    {money(row.paid)}
                  </td>
                  <td className="px-4 text-right tabular-nums">
                    {Number(row.due || 0) > 0 ? (
                      <span className="text-hm-warning">{money(row.due)}</span>
                    ) : (
                      <span className="text-hm-text-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 text-right tabular-nums font-medium">
                    {money(row.profit)}
                  </td>
                  <td className="px-4">
                    <Status tone={statusTone(row)}>{paymentLabel(row)}</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!rows.length && (
            <div className="px-4 py-12 text-center">
              <FileText size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No bills match these filters
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                Try a wider date range or clear the search.
              </p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function matchesSearch(row, query) {
  const text = `${row.ref} ${row.customer} ${(row.items || []).join(" ")}`;
  return text.toLowerCase().includes(query.toLowerCase().trim());
}

function matchesStatus(row, selected) {
  if (selected === "All") return true;
  return paymentLabel(row) === selected;
}

function paymentLabel(row) {
  if (Number(row.total || 0) <= 0) return "Unpaid";
  if (Number(row.due || 0) <= 0 && Number(row.paid || 0) > 0) return "Paid";
  if (Number(row.paid || 0) > 0) return "Partial";
  return "Unpaid";
}

function statusTone(row) {
  const label = paymentLabel(row);
  if (label === "Paid") return "success";
  if (label === "Partial") return "warning";
  return "danger";
}

function matchesPeriod(row, filters) {
  const rowDate = String(row.date || "").slice(0, 10);
  if (!rowDate) return false;

  if (filters.period === "Last 7 days") {
    const end = new Date(`${todayISO()}T23:59:59`);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const current = new Date(`${rowDate}T12:00:00`);
    return current >= start && current <= end;
  }

  if (filters.period === "Month") {
    return rowDate.startsWith(filters.month);
  }

  if (filters.period === "Year") {
    return rowDate.startsWith(String(filters.year || ""));
  }

  if (filters.period === "Custom") {
    const afterFrom = !filters.from || rowDate >= filters.from;
    const beforeTo = !filters.to || rowDate <= filters.to;
    return afterFrom && beforeTo;
  }

  return true;
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
