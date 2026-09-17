import React from "react";
import { AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { money, todayISO } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import { Button, Panel } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    sales,
    products,
    expenses,
    customers,
    suppliers,
    employees,
    advances,
    returns,
  } = useAppData();

  const today = todayISO();

  /* ----- overall figures ----- */
  const revenue = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const collected = sales.reduce((a, s) => a + Number(s.paid || 0), 0);
  const customerDues = customers.reduce((a, c) => a + Number(c.due || 0), 0);
  const supplierPayable = suppliers.reduce((a, s) => a + Number(s.due || 0), 0);
  const lowStock = products.filter(
    (p) => Number(p.stock) <= Number(p.minStock),
  );

  const productCost = sales.reduce((sum, s) => {
    const grossCost = (s.lineItems || [])
      .filter((i) => i.type === "product")
      .reduce(
        (a, i) => a + Number(i.purchasePrice || 0) * Number(i.qty || 0),
        0,
      );
    const returnedCost = (returns || [])
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
  const expensesTotal = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const netProfit = revenue - productCost - expensesTotal;
  const outstanding = revenue - collected;

  /* ----- breakdown ----- */
  const productSales = sales.reduce(
    (sum, s) =>
      sum +
      (s.lineItems || [])
        .filter((i) => i.type === "product")
        .reduce((a, i) => a + Number(i.price || 0) * Number(i.qty || 0), 0),
    0,
  );
  const serviceSales = sales.reduce(
    (sum, s) =>
      sum +
      (s.lineItems || [])
        .filter((i) => i.type === "service")
        .reduce((a, i) => a + Number(i.price || 0) * Number(i.qty || 0), 0),
    0,
  );
  const discountsGiven = sales.reduce(
    (a, s) => a + Number(s.discountAmount || 0),
    0,
  );
  const returnsTotal = (returns || []).reduce(
    (a, r) => a + Number(r.amount || 0),
    0,
  );
  const totalAdvances = (advances || []).reduce(
    (a, adv) => a + Number(adv.amount || 0),
    0,
  );

  /* ----- today ----- */
  const todaySales = sales.filter((s) => s.date === today);
  const todayCollected = todaySales.reduce(
    (a, s) => a + Number(s.paid || 0),
    0,
  );
  const todayCost = todaySales.reduce(
    (sum, s) =>
      sum +
      (s.lineItems || [])
        .filter((i) => i.type === "product")
        .reduce(
          (a, i) => a + Number(i.purchasePrice || 0) * Number(i.qty || 0),
          0,
        ),
    0,
  );
  const todayExpenses = expenses
    .filter((e) => String(e.date || "").slice(0, 10) === today)
    .reduce((a, e) => a + Number(e.amount || 0), 0);
  const todayAdvances = (advances || [])
    .filter((adv) => String(adv.date || "").slice(0, 10) === today)
    .reduce((a, adv) => a + Number(adv.amount || 0), 0);
  const todayRevenue = todaySales.reduce((a, s) => a + Number(s.total || 0), 0);
  const todayProfit = todayRevenue - todayCost - todayExpenses;

  /* ----- primary ----- */
  const primary = [
    {
      label: "Revenue",
      value: money(revenue),
      hint: `${sales.length} invoices`,
      to: "/insights/revenue",
      tone: "info",
    },
    {
      label: "Net profit",
      value: money(netProfit),
      hint: "After cost & expenses",
      to: "/insights/profit",
      tone: netProfit < 0 ? "danger" : "success",
    },
    {
      label: "Receivable",
      value: money(customerDues),
      hint: "Owed by customers",
      to: "/insights/customer-dues",
      tone: "warning",
    },
    {
      label: "Payable",
      value: money(supplierPayable),
      hint: "Owed to suppliers",
      to: "/insights/supplier-payable",
      tone: "warning",
    },
  ];

  /* ----- today strip ----- */
  const todayStrip = [
    {
      label: "Collected today",
      value: money(todayCollected),
      hint: `${todaySales.length} invoice${todaySales.length === 1 ? "" : "s"}`,
      tone: todayCollected > 0 ? "success" : "default",
    },
    {
      label: "Sold today",
      value: money(todayRevenue),
      hint: "Total billed today",
      tone: "info",
    },
    {
      label: "Profit today",
      value: money(todayProfit),
      hint: "After cost & expenses",
      tone: todayProfit < 0 ? "danger" : "success",
    },
    {
      label: "Advances today",
      value: money(todayAdvances),
      hint: "Paid to employees",
      tone: todayAdvances > 0 ? "warning" : "default",
    },
  ];

  /* ----- breakdown strip ----- */
  const breakdown = [
    {
      label: "Product sales",
      value: money(productSales),
      hint: "Spare parts",
      to: "/insights/product-sales",
      tone: "info",
    },
    {
      label: "Service revenue",
      value: money(serviceSales),
      hint: "Workshop labour",
      to: "/insights/service-sales",
      tone: "info",
    },
    {
      label: "Discounts given",
      value: money(discountsGiven),
      hint: "Customer savings",
      to: "/insights/discounts",
      tone: "warning",
    },
    {
      label: "Returns",
      value: money(returnsTotal),
      hint: `${(returns || []).length} refund${
        (returns || []).length === 1 ? "" : "s"
      }`,
      to: "/returns",
      tone: returnsTotal > 0 ? "danger" : "default",
    },
  ];

  /* ----- dues strip ----- */
  const dues = [
    {
      label: "Customer dues",
      value: money(customerDues),
      hint: `${customers.filter((c) => Number(c.due || 0) > 0).length} accounts`,
      to: "/insights/customer-dues",
      tone: customerDues > 0 ? "warning" : "default",
    },
    {
      label: "Supplier payable",
      value: money(supplierPayable),
      hint: `${suppliers.filter((s) => Number(s.due || 0) > 0).length} suppliers`,
      to: "/insights/supplier-payable",
      tone: supplierPayable > 0 ? "warning" : "default",
    },
    {
      label: "Employee advances",
      value: money(totalAdvances),
      hint: `${employees.length} employees`,
      to: "/employees",
      tone: totalAdvances > 0 ? "warning" : "default",
    },
    {
      label: "Low stock items",
      value: lowStock.length,
      hint: "At or below minimum",
      to: "/inventory",
      tone: lowStock.length > 0 ? "warning" : "default",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Business snapshot — sales, profit, dues, and stock."
        action={
          <Link to="/pos">
            <Button>
              <Plus size={15} />
              New sale
            </Button>
          </Link>
        }
      />

      {/* -------- Overall metrics strip -------- */}
      <section className="panel overflow-hidden">
        <Strip items={primary} columns={4} />
      </section>

      {/* -------- Today strip -------- */}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-hm-border px-4 py-2.5">
          <h2 className="text-hm-meta font-medium text-hm-text-muted">
            Today —{" "}
            {new Date().toLocaleDateString("en-PK", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </h2>
        </div>
        <Strip items={todayStrip} columns={4} />
      </section>

      {/* -------- Breakdown + Dues -------- */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-hm-border px-4 py-2.5">
            <h2 className="text-hm-meta font-medium text-hm-text-muted">
              Sales breakdown
            </h2>
          </div>
          <Strip items={breakdown} columns={2} />
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-hm-border px-4 py-2.5">
            <h2 className="text-hm-meta font-medium text-hm-text-muted">
              Dues & attention
            </h2>
          </div>
          <Strip items={dues} columns={2} />
        </section>
      </div>

      {/* -------- Low stock + unpaid -------- */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel bodyClassName="p-0">
          <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-hm-title text-hm-text">Low stock</h2>
              <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
                At or below minimum level
              </p>
            </div>
            <Link
              to="/inventory"
              className="flex items-center gap-1 text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
            >
              Manage <ArrowRight size={13} />
            </Link>
          </div>

          <ul className="divide-y divide-hm-border">
            {lowStock.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  to="/inventory"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-hm-surface-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-hm-body font-medium text-hm-text">
                      {p.name}
                    </div>
                    <div className="text-hm-meta text-hm-text-subtle">
                      Rack {p.rack || "—"} · Min {p.minStock}
                    </div>
                  </div>
                  <span className="badge-danger tabular-nums shrink-0">
                    {p.stock} left
                  </span>
                </Link>
              </li>
            ))}
            {!lowStock.length && (
              <li className="px-4 py-8 text-center text-hm-body text-hm-text-muted">
                All stock levels look healthy.
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-5">
          {outstanding > 0 && (
            <Panel>
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-hm-warning"
                />
                <div className="min-w-0">
                  <div className="text-hm-body font-medium text-hm-text">
                    Unpaid invoices
                  </div>
                  <div className="mt-0.5 text-hm-meta text-hm-text-muted">
                    {money(outstanding)} not yet collected from customers.
                  </div>
                  <Link
                    to="/insights/customer-dues"
                    className="mt-2 inline-flex items-center gap-1 text-hm-meta font-medium text-hm-text hover:underline"
                  >
                    Review receivables <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </Panel>
          )}

          {supplierPayable > 0 && (
            <Panel>
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-hm-warning"
                />
                <div className="min-w-0">
                  <div className="text-hm-body font-medium text-hm-text">
                    Supplier payments due
                  </div>
                  <div className="mt-0.5 text-hm-meta text-hm-text-muted">
                    {money(supplierPayable)} payable to suppliers.
                  </div>
                  <Link
                    to="/suppliers"
                    className="mt-2 inline-flex items-center gap-1 text-hm-meta font-medium text-hm-text hover:underline"
                  >
                    Manage suppliers <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* -------- Footer line -------- */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-hm-meta text-hm-text-muted">
        <Link to="/customers" className="hover:text-hm-text">
          {customers.length} customers
        </Link>
        <span className="text-hm-border-strong">·</span>
        <Link to="/suppliers" className="hover:text-hm-text">
          {suppliers.length} suppliers
        </Link>
        <span className="text-hm-border-strong">·</span>
        <Link to="/employees" className="hover:text-hm-text">
          {employees.length} employees
        </Link>
        <span className="text-hm-border-strong">·</span>
        <Link to="/expenses" className="hover:text-hm-text">
          Expenses {money(expensesTotal)}
        </Link>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Strip — hairline-divided grid of metric cells.                              */
/* -------------------------------------------------------------------------- */

function Strip({ items, columns = 4 }) {
  const cols = columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-4";
  return (
    <div className={`grid grid-cols-2 sm:divide-x divide-hm-border ${cols}`}>
      {items.map((it, i) => {
        const Cell = it.to ? Link : "div";
        const cellProps = it.to ? { to: it.to } : {};

        const tone = it.tone || "default";
        const bar =
          tone === "success"
            ? "bg-hm-success"
            : tone === "warning"
              ? "bg-hm-warning"
              : tone === "danger"
                ? "bg-hm-danger"
                : tone === "info"
                  ? "bg-hm-info"
                  : "bg-transparent";
        const valueColor =
          tone === "success"
            ? "text-hm-success"
            : tone === "warning"
              ? "text-hm-warning"
              : tone === "danger"
                ? "text-hm-danger"
                : tone === "info"
                  ? "text-hm-info"
                  : "text-hm-text";

        return (
          <Cell
            key={it.label}
            {...cellProps}
            className={[
              "relative block px-4 py-3 transition-colors",
              it.to ? "hover:bg-hm-surface-2" : "",
              i < items.length - 1 ? "border-b border-hm-border" : "",
              columns === 4 && i < 2 ? "sm:border-b-0" : "",
              columns === 4 && i < items.length - 1
                ? "sm:border-b sm:border-hm-border lg:border-b-0"
                : "",
              columns === 2 && i < items.length - 1
                ? "sm:border-b sm:border-hm-border lg:border-b-0"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {tone !== "default" && (
              <span
                className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r ${bar}`}
                aria-hidden="true"
              />
            )}

            <div className="text-hm-meta text-hm-text-muted">{it.label}</div>
            <div
              className={`mt-0.5 text-[18px] font-medium tabular-nums ${valueColor}`}
            >
              {it.value}
            </div>
            {it.hint && (
              <div className="mt-0.5 text-hm-meta text-hm-text-subtle">
                {it.hint}
              </div>
            )}
          </Cell>
        );
      })}
    </div>
  );
}
