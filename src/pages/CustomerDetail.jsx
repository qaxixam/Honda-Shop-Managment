import React from "react";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Phone,
  MapPin,
  Calendar,
  WalletCards,
  Receipt,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Button, Panel, Status } from "../components/ui";
import { money, date } from "../lib/utils";
import { useAppData } from "../context/AppDataContext";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, sales } = useAppData();

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="space-y-4">
        <Back />
        <PageHeader title="Customer not found" />
        <Panel>
          <div className="px-4 py-12 text-center">
            <Receipt size={22} className="mx-auto text-hm-text-subtle" />
            <p className="mt-3 text-hm-body font-medium text-hm-text">
              We couldn't find customer {id}.
            </p>
            <p className="mt-1 text-hm-meta text-hm-text-muted">
              It may have been deleted or the link is incorrect.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => navigate("/customers")}
            >
              Back to customers
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  // Match by customerId first, then fall back to name match for old
  // sales that predate the customerId field.
  const customerSales = sales
    .filter(
      (s) =>
        s.customerId === customer.id ||
        (s.customerId == null && s.customer === customer.name),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  const totalSpent = customerSales.reduce(
    (a, s) => a + Number(s.total || 0),
    0,
  );
  const totalPaid = customerSales.reduce((a, s) => a + Number(s.paid || 0), 0);
  const totalDue = Math.max(0, totalSpent - totalPaid);

  return (
    <div className="space-y-4">
      <Back />

      <PageHeader
        title={customer.name}
        subtitle={`${customer.phone || "No phone"} · ${customer.id}${
          customer.createdAt ? ` · Since ${date(customer.createdAt)}` : ""
        }`}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/customers")}
            >
              <Edit3 size={14} />
              Edit
            </Button>
            {totalDue > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/customers")}
              >
                <WalletCards size={14} />
                Receive payment
              </Button>
            )}
            <Button size="sm" onClick={() => navigate("/pos")}>
              <Plus size={14} />
              New sale
            </Button>
          </>
        }
      />

      {/* Summary strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 divide-hm-border sm:divide-x lg:grid-cols-4">
          <Stat label="Total visits" value={customer.visits || 0} />
          <Stat label="Total billed" value={money(totalSpent)} />
          <Stat label="Paid" value={money(totalPaid)} tone="success" />
          <Stat
            label="Outstanding"
            value={money(totalDue)}
            tone={totalDue > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      {/* Two columns */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* Purchase history */}
        <Panel bodyClassName="p-0">
          <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
            <div>
              <h2 className="text-hm-title text-hm-text">Purchase history</h2>
              <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
                {customerSales.length} invoice
                {customerSales.length === 1 ? "" : "s"} · newest first
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead className="table-head">
                <tr>
                  <th className="px-4">Invoice</th>
                  <th className="px-4">Date</th>
                  <th className="px-4 text-right">Total</th>
                  <th className="px-4 text-right">Paid</th>
                  <th className="px-4 text-right">Remaining</th>
                  <th className="px-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.map((s) => {
                  const total = Number(s.total || 0);
                  const paid = Number(s.paid || 0);
                  const due = Number(s.due || 0);
                  const payState =
                    due <= 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid";
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/insights/invoice/${s.id}`)}
                      className="cursor-pointer"
                    >
                      <td className="px-4 font-medium tabular-nums">{s.id}</td>
                      <td className="px-4 tabular-nums text-hm-text-muted">
                        {date(s.date)}
                      </td>
                      <td className="px-4 text-right tabular-nums font-medium">
                        {money(total)}
                      </td>
                      <td className="px-4 text-right tabular-nums">
                        {paid > 0 ? (
                          <span className="text-hm-text">{money(paid)}</span>
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
                        <Status
                          tone={
                            payState === "Paid"
                              ? "success"
                              : payState === "Partial"
                                ? "warning"
                                : "danger"
                          }
                          dot
                        >
                          {payState}
                        </Status>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary footer */}
              {customerSales.length > 0 && (
                <tfoot>
                  <tr className="border-t border-hm-border bg-hm-surface-2">
                    <td
                      colSpan={2}
                      className="px-4 py-2.5 text-hm-meta font-medium text-hm-text-muted"
                    >
                      Totals ({customerSales.length} invoice
                      {customerSales.length === 1 ? "" : "s"})
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-hm-text">
                      {money(totalSpent)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-hm-text">
                      {money(totalPaid)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {totalDue > 0 ? (
                        <span className="text-hm-warning">
                          {money(totalDue)}
                        </span>
                      ) : (
                        <span className="text-hm-text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
              )}
            </table>

            {!customerSales.length && (
              <div className="px-4 py-12 text-center">
                <Receipt size={22} className="mx-auto text-hm-text-subtle" />
                <p className="mt-3 text-hm-body font-medium text-hm-text">
                  No purchases yet
                </p>
                <p className="mt-1 text-hm-meta text-hm-text-muted">
                  This customer hasn't bought anything.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/pos")}
                >
                  <Plus size={14} />
                  Start a sale
                </Button>
              </div>
            )}
          </div>
        </Panel>

        {/* Info panel */}
        <Panel bodyClassName="p-0">
          <div className="border-b border-hm-border px-4 py-3">
            <h2 className="text-hm-title text-hm-text">Contact</h2>
          </div>

          <dl className="divide-y divide-hm-border">
            <InfoRow icon={Phone} label="Phone">
              {customer.phone || "—"}
            </InfoRow>
            <InfoRow icon={MapPin} label="Address">
              {customer.address || "—"}
            </InfoRow>
            <InfoRow icon={Calendar} label="Customer since">
              {customer.createdAt ? date(customer.createdAt) : "—"}
            </InfoRow>
          </dl>
        </Panel>
      </div>
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
      to="/customers"
      className="inline-flex items-center gap-1.5 text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
    >
      <ArrowLeft size={13} />
      Customers
    </Link>
  );
}
