import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Package,
  ReceiptText,
  Users,
  WalletCards,
  Wrench,
  TrendingUp,
  Tag,
  Printer,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { money, date } from "../lib/utils";
import { Button, Panel, Status } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export default function InsightDetail() {
  const { type, id } = useParams();
  console.log(id);

  const navigate = useNavigate();
  const { sales, customers, suppliers, products, expenses, returns } =
    useAppData();
  console.log(sales);

  /* ---------------- Invoice view (route: /insights/invoice/:id) ------------- */
  if (type === "invoice") {
    const sale = sales.find((s) => s.id === id);

    const customer = sale?.customerId
      ? customers.find((c) => c.id === sale.customerId)
      : null;

    if (!sale) {
      return (
        <div className="space-y-4">
          <Back />
          <PageHeader title="Invoice not found" />
          <Panel>
            <div className="px-4 py-12 text-center">
              <ReceiptText size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                We couldn't find invoice {id}.
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                It may have been deleted or the link is incorrect.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => navigate("/insights/revenue")}
              >
                View all sales
              </Button>
            </div>
          </Panel>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Back />

        <PageHeader
          title={`Invoice ${sale.id}`}
          subtitle={`${sale.customer} · ${date(sale.date)}`}
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer size={14} />
                Print
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/returns")}
              >
                <RotateCcw size={14} />
                Return
              </Button>
              {Number(sale.due || 0) > 0 && (
                <Button
                  size="sm"
                  onClick={() =>
                    customer ? navigate("/customers") : navigate("/customers")
                  }
                >
                  <CreditCard size={14} />
                  Receive payment
                </Button>
              )}
            </>
          }
        />

        {/* Status strip */}
        <section className="panel overflow-hidden">
          <div className="grid grid-cols-2 divide-hm-border sm:divide-x lg:grid-cols-4">
            <Meta label="Date" value={date(sale.date)} />
            <Meta
              label="Customer"
              value={
                sale.customerId ? (
                  <Link
                    to="/customers"
                    className="text-hm-text hover:underline"
                  >
                    {sale.customer}
                  </Link>
                ) : (
                  sale.customer
                )
              }
            />
            <Meta label="Method" value={sale.method || "—"} />
            <Meta
              label="Status"
              value={
                <Status
                  tone={
                    sale.status === "Paid"
                      ? "success"
                      : sale.status === "Partial"
                        ? "warning"
                        : "neutral"
                  }
                  dot
                >
                  {sale.status}
                </Status>
              }
            />
          </div>
        </section>

        {/* Two columns */}
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          {/* Line items */}
          <Panel bodyClassName="p-0">
            <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
              <h2 className="text-hm-title text-hm-text">Line items</h2>
              <span className="text-hm-meta text-hm-text-subtle tabular-nums">
                {(sale.lineItems || []).length} item
                {(sale.lineItems || []).length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="table min-w-[560px]">
                <thead className="table-head">
                  <tr>
                    <th className="px-4">Item</th>
                    <th className="px-4">Type</th>
                    <th className="px-4 text-right">Price</th>
                    <th className="px-4 text-right">Qty</th>
                    <th className="px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.lineItems || []).map((i, idx) => (
                    <tr key={idx}>
                      <td className="px-4 font-medium text-hm-text">
                        {i.name}
                      </td>
                      <td className="px-4 text-hm-text-muted capitalize">
                        {i.type}
                      </td>
                      <td className="px-4 text-right tabular-nums text-hm-text-muted">
                        {money(i.price)}
                      </td>
                      <td className="px-4 text-right tabular-nums text-hm-text-muted">
                        {i.qty}
                      </td>
                      <td className="px-4 text-right tabular-nums font-medium">
                        {money(i.price * i.qty)}
                      </td>
                    </tr>
                  ))}
                  {!(sale.lineItems || []).length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-hm-body text-hm-text-muted"
                      >
                        No line items recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Payment summary */}
          <Panel bodyClassName="p-0">
            <div className="border-b border-hm-border px-4 py-3">
              <h2 className="text-hm-title text-hm-text">Payment summary</h2>
            </div>

            <dl className="divide-y divide-hm-border">
              <Row label="Subtotal" value={sale.subtotal ?? sale.total} />
              {Number(sale.discountAmount || 0) > 0 && (
                <Row
                  label={`Discount${
                    sale.discountType === "percentage"
                      ? ` (${sale.discountValue}%)`
                      : ""
                  }`}
                  value={-sale.discountAmount}
                  muted
                />
              )}
              <Row label="Net total" value={sale.total} emphasis />
              <Row label="Paid" value={sale.paid} muted />
              {Number(sale.returnedAmount || 0) > 0 && (
                <Row label="Returned" value={-sale.returnedAmount} muted />
              )}
              <Row
                label="Balance due"
                value={sale.due}
                emphasis
                tone={Number(sale.due || 0) > 0 ? "warning" : "default"}
              />
            </dl>
          </Panel>
        </div>
      </div>
    );
  }

  /* ---------------- Insight list views ------------------------------------ */
  const configs = {
    revenue: [
      "Revenue breakdown",
      "Every recorded sale and its payment status.",
      CircleDollarSign,
    ],
    "customer-dues": [
      "Customer outstanding",
      "Every customer balance still receivable.",
      Users,
    ],
    "supplier-payable": [
      "Supplier payable",
      "Purchases, payments and outstanding supplier credit.",
      WalletCards,
    ],
    "low-stock": [
      "Low stock detail",
      "Products at or below their minimum stock level.",
      Package,
    ],
    "product-sales": [
      "Product sales & profit",
      "Revenue and margin per spare part.",
      Package,
    ],
    "service-sales": [
      "Service revenue",
      "Workshop labour revenue by service.",
      Wrench,
    ],
    profit: [
      "Profit detail",
      "Revenue, product cost, expenses and resulting profit.",
      TrendingUp,
    ],
    discounts: [
      "Discount detail",
      "Every invoice where a customer discount was given.",
      Tag,
    ],
  };

  const [title, subtitle] = configs[type] || [
    "Business detail",
    "Detailed shop data.",
    ReceiptText,
  ];

  let content = null;
  if (type === "revenue") content = <SalesTable sales={sales} />;
  if (type === "customer-dues")
    content = <CustomerDues customers={customers} />;
  if (type === "supplier-payable")
    content = <SupplierPayable suppliers={suppliers} />;
  if (type === "low-stock") content = <LowStock products={products} />;
  if (type === "product-sales")
    content = <ProductSales sales={sales} products={products} />;
  if (type === "service-sales") content = <ServiceSales sales={sales} />;
  if (type === "profit")
    content = <ProfitDetail sales={sales} expenses={expenses} />;
  if (type === "discounts") content = <DiscountDetail sales={sales} />;

  return (
    <div className="space-y-4">
      <Back />
      <PageHeader title={title} subtitle={subtitle} />
      {content || (
        <Panel>
          <div className="px-4 py-12 text-center text-hm-body text-hm-text-muted">
            No detail available.
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ========================================================================== */
/* Invoice building blocks                                                     */
/* ========================================================================== */

function Meta({ label, value }) {
  return (
    <div className="px-4 py-3">
      <div className="text-hm-meta text-hm-text-muted">{label}</div>
      <div className="mt-0.5 text-hm-body text-hm-text">{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
  emphasis = false,
  tone = "default",
}) {
  const labelCls = muted
    ? "text-hm-text-muted"
    : emphasis
      ? "text-hm-body font-medium text-hm-text"
      : "text-hm-body text-hm-text";
  const valueCls =
    tone === "warning"
      ? "text-hm-warning"
      : muted
        ? "text-hm-text-muted"
        : emphasis
          ? "text-hm-text font-medium"
          : "text-hm-text";
  const prefix = muted && typeof value === "number" && value < 0 ? "− " : "";
  const display = typeof value === "number" ? Math.abs(value) : value;

  return (
    <div className="flex items-baseline justify-between px-4 py-2.5">
      <dt className={labelCls}>{label}</dt>
      <dd className={`tabular-nums ${valueCls}`}>
        {typeof value === "number" ? `${prefix}${money(display)}` : value}
      </dd>
    </div>
  );
}

/* ========================================================================== */
/* List views (unchanged data, cleaned presentation)                           */
/* ========================================================================== */

function SalesTable({ sales }) {
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[820px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Invoice</th>
              <th className="px-4">Customer</th>
              <th className="px-4">Date</th>
              <th className="px-4">Items</th>
              <th className="px-4 text-right">Total</th>
              <th className="px-4 text-right">Paid</th>
              <th className="px-4 text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="px-4 font-medium tabular-nums">
                  <Link
                    to={`/insights/invoice/${s.id}`}
                    className="text-hm-text hover:underline"
                  >
                    {s.id}
                  </Link>
                </td>
                <td className="px-4">{s.customer}</td>
                <td className="px-4 tabular-nums text-hm-text-muted">
                  {date(s.date)}
                </td>
                <td className="max-w-xs truncate px-4 text-hm-meta text-hm-text-subtle">
                  {(s.items || []).join(", ")}
                </td>
                <td className="px-4 text-right tabular-nums font-medium">
                  {money(s.total)}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {money(s.paid)}
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
      </div>
    </Panel>
  );
}

function CustomerDues({ customers }) {
  const rows = customers.filter((c) => Number(c.due) > 0);
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[820px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Customer</th>
              <th className="px-4">Phone</th>
              <th className="px-4 text-right">Visits</th>
              <th className="px-4 text-right">Spent</th>
              <th className="px-4 text-right">Outstanding</th>
              <th className="px-4 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 font-medium text-hm-text">{c.name}</td>
                <td className="px-4 tabular-nums text-hm-text-muted">
                  {c.phone || "—"}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {c.visits || 0}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {money(c.spent)}
                </td>
                <td className="px-4 text-right tabular-nums font-medium text-hm-warning">
                  {money(c.due)}
                </td>
                <td className="px-4 text-right">
                  <Link
                    to="/customers"
                    className="inline-flex items-center gap-1 text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
                  >
                    Manage <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SupplierPayable({ suppliers }) {
  const rows = suppliers.filter((s) => Number(s.due) > 0);
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[820px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Supplier</th>
              <th className="px-4 text-right">Purchased</th>
              <th className="px-4 text-right">Paid</th>
              <th className="px-4 text-right">Outstanding</th>
              <th className="px-4">Recent products</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 font-medium text-hm-text">{s.name}</td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {money(s.purchased)}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {money(s.paid)}
                </td>
                <td className="px-4 text-right tabular-nums font-medium text-hm-warning">
                  {money(s.due)}
                </td>
                <td className="px-4 text-hm-meta text-hm-text-subtle">
                  {(s.purchases || [])
                    .slice(0, 3)
                    .map((p) => `${p.productName} × ${p.qty}`)
                    .join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LowStock({ products }) {
  const rows = products.filter((p) => Number(p.stock) <= Number(p.minStock));
  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[720px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Product</th>
              <th className="px-4">Category</th>
              <th className="px-4 text-right">Stock</th>
              <th className="px-4 text-right">Minimum</th>
              <th className="px-4">Rack</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 font-medium text-hm-text">{p.name}</td>
                <td className="px-4 text-hm-text-muted">{p.category}</td>
                <td className="px-4 text-right tabular-nums">
                  <span className="badge-warning">{p.stock} units</span>
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {p.minStock}
                </td>
                <td className="px-4 text-hm-text-muted">{p.rack || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ProductSales({ sales, products }) {
  const rows = products
    .map((p) => {
      const lines = sales.flatMap((s) =>
        (s.lineItems || []).filter(
          (i) => i.type === "product" && i.id === p.id,
        ),
      );
      const qty = lines.reduce((a, i) => a + Number(i.qty || 0), 0);
      const revenue = lines.reduce(
        (a, i) => a + Number(i.price || 0) * Number(i.qty || 0),
        0,
      );
      const cost = lines.reduce(
        (a, i) =>
          a +
          Number(i.purchasePrice || p.purchasePrice || 0) * Number(i.qty || 0),
        0,
      );
      return { ...p, qty, revenue, cost, profit: revenue - cost };
    })
    .filter((p) => p.qty > 0)
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[760px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Product</th>
              <th className="px-4 text-right">Units sold</th>
              <th className="px-4 text-right">Sales</th>
              <th className="px-4 text-right">Cost</th>
              <th className="px-4 text-right">Profit</th>
              <th className="px-4 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4">
                  <div className="font-medium text-hm-text">{p.name}</div>
                  <div className="text-hm-meta text-hm-text-subtle">
                    Rack {p.rack || "—"}
                  </div>
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {p.qty}
                </td>
                <td className="px-4 text-right tabular-nums font-medium">
                  {money(p.revenue)}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {money(p.cost)}
                </td>
                <td className="px-4 text-right tabular-nums font-medium">
                  {money(p.profit)}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {p.revenue
                    ? `${Math.round((p.profit / p.revenue) * 100)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ServiceSales({ sales }) {
  const rows = {};
  sales.forEach((s) =>
    (s.lineItems || [])
      .filter((i) => i.type === "service")
      .forEach((i) => {
        rows[i.id] ??= { name: i.name, qty: 0, revenue: 0 };
        rows[i.id].qty += Number(i.qty || 0);
        rows[i.id].revenue += Number(i.price || 0) * Number(i.qty || 0);
      }),
  );

  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[560px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Service</th>
              <th className="px-4 text-right">Times performed</th>
              <th className="px-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(rows)
              .sort((a, b) => b.revenue - a.revenue)
              .map((r, i) => (
                <tr key={i}>
                  <td className="px-4 font-medium text-hm-text">{r.name}</td>
                  <td className="px-4 text-right tabular-nums text-hm-text-muted">
                    {r.qty}
                  </td>
                  <td className="px-4 text-right tabular-nums font-medium">
                    {money(r.revenue)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DiscountDetail({ sales }) {
  const rows = sales
    .filter((s) => Number(s.discountAmount || 0) > 0)
    .sort((a, b) => b.discountAmount - a.discountAmount);

  return (
    <Panel bodyClassName="p-0">
      <div className="overflow-x-auto">
        <table className="table min-w-[860px]">
          <thead className="table-head">
            <tr>
              <th className="px-4">Invoice</th>
              <th className="px-4">Customer</th>
              <th className="px-4">Date</th>
              <th className="px-4 text-right">Subtotal</th>
              <th className="px-4">Type</th>
              <th className="px-4 text-right">Discount</th>
              <th className="px-4 text-right">Net total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 font-medium tabular-nums">
                  <Link
                    to={`/insights/invoice/${s.id}`}
                    className="text-hm-text hover:underline"
                  >
                    {s.id}
                  </Link>
                </td>
                <td className="px-4">{s.customer}</td>
                <td className="px-4 tabular-nums text-hm-text-muted">
                  {date(s.date)}
                </td>
                <td className="px-4 text-right tabular-nums text-hm-text-muted">
                  {money(s.subtotal ?? s.total)}
                </td>
                <td className="px-4 capitalize text-hm-text-muted">
                  {s.discountType === "percentage"
                    ? `${s.discountValue}%`
                    : s.discountType || "—"}
                </td>
                <td className="px-4 text-right tabular-nums">
                  − {money(s.discountAmount)}
                </td>
                <td className="px-4 text-right tabular-nums font-medium">
                  {money(s.total)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-hm-body text-hm-text-muted"
                >
                  No discounts recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ProfitDetail({ sales, expenses }) {
  const revenue = sales.reduce((a, s) => a + Number(s.total || 0), 0);
  const cost = sales.reduce(
    (a, s) =>
      a +
      (s.lineItems || [])
        .filter((i) => i.type === "product")
        .reduce(
          (x, i) => x + Number(i.purchasePrice || 0) * Number(i.qty || 0),
          0,
        ),
    0,
  );
  const exp = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const net = revenue - cost - exp;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Panel>
        <div className="text-hm-meta text-hm-text-muted">Revenue</div>
        <div className="mt-0.5 text-[20px] font-medium tabular-nums text-hm-text">
          {money(revenue)}
        </div>
      </Panel>
      <Panel>
        <div className="text-hm-meta text-hm-text-muted">Product cost</div>
        <div className="mt-0.5 text-[20px] font-medium tabular-nums text-hm-text-muted">
          − {money(cost)}
        </div>
      </Panel>
      <Panel>
        <div className="text-hm-meta text-hm-text-muted">Expenses</div>
        <div className="mt-0.5 text-[20px] font-medium tabular-nums text-hm-text-muted">
          − {money(exp)}
        </div>
      </Panel>
      <Panel className="md:col-span-3">
        <div className="text-hm-meta text-hm-text-muted">Net profit</div>
        <div
          className={`mt-0.5 text-[28px] font-medium tabular-nums tracking-tight ${
            net < 0 ? "text-hm-danger" : "text-hm-text"
          }`}
        >
          {money(net)}
        </div>
        <div className="mt-1 text-hm-meta text-hm-text-subtle">
          Revenue − product cost − shop expenses
        </div>
      </Panel>
    </div>
  );
}

/* ========================================================================== */
/* Shared                                                                      */
/* ========================================================================== */

function Back() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
    >
      <ArrowLeft size={13} />
      Dashboard
    </Link>
  );
}
