import React, { useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Phone,
  CalendarDays,
  WalletCards,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Button, Modal, IconButton, Input, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { money, date } from "../lib/utils";
import { useAppData } from "../context/AppDataContext";

const makeAdvanceBlank = () => ({
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
});

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees, advances, addAdvance, deleteAdvance } = useAppData();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(makeAdvanceBlank);

  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    return (
      <div className="space-y-4">
        <Back />
        <PageHeader title="Employee not found" />
        <Panel>
          <div className="px-4 py-12 text-center">
            <UserRound size={22} className="mx-auto text-hm-text-subtle" />
            <p className="mt-3 text-hm-body font-medium text-hm-text">
              We couldn't find employee {id}.
            </p>
            <p className="mt-1 text-hm-meta text-hm-text-muted">
              It may have been deleted or the link is incorrect.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => navigate("/employees")}
            >
              Back to employees
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  // All advances for this employee, newest first.
  const employeeAdvances = advances
    .filter((a) => a.employeeId === employee.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalAdvance = employeeAdvances.reduce(
    (sum, a) => sum + Number(a.amount || 0),
    0,
  );
  const remaining = Math.max(0, Number(employee.salary || 0) - totalAdvance);
  const lastAdvanceDate =
    employeeAdvances.length > 0 ? employeeAdvances[0].date : null;

  function save() {
    if (!Number(form.amount)) return;
    addAdvance({
      employeeId: employee.id,
      amount: Number(form.amount),
      date: form.date || new Date().toISOString().slice(0, 10),
      note: form.note,
    });
    close();
  }

  function close() {
    setOpen(false);
    setForm(makeAdvanceBlank);
  }

  function removeAdvance(a) {
    if (confirm(`Delete advance of ${money(a.amount)} on ${date(a.date)}?`)) {
      deleteAdvance(a.id);
    }
  }

  return (
    <div className="space-y-4">
      <Back />

      <PageHeader
        title={employee.name}
        subtitle={`${employee.role || "Employee"} · ${employee.id}${
          employee.joined ? ` · Joined ${date(employee.joined)}` : ""
        }`}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/employees")}
            >
              <Edit3 size={14} />
              Edit
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus size={14} />
              Add advance
            </Button>
          </>
        }
      />

      {/* Summary strip */}
      <section className="panel overflow-hidden">
        <div className="grid grid-cols-2 divide-hm-border sm:divide-x lg:grid-cols-4">
          <Stat label="Monthly salary" value={money(employee.salary)} />
          <Stat
            label="Total advance"
            value={money(totalAdvance)}
            tone={totalAdvance > 0 ? "warning" : "default"}
          />
          <Stat
            label="Remaining this month"
            value={money(remaining)}
            tone={remaining > 0 ? "default" : "warning"}
          />
          <Stat
            label="Last advance"
            value={lastAdvanceDate ? date(lastAdvanceDate) : "—"}
          />
        </div>
      </section>

      {/* Two columns */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* Advance history */}
        <Panel bodyClassName="p-0">
          <div className="flex items-center justify-between border-b border-hm-border px-4 py-3">
            <div>
              <h2 className="text-hm-title text-hm-text">Advance history</h2>
              <p className="mt-0.5 text-hm-meta text-hm-text-subtle">
                {employeeAdvances.length} record
                {employeeAdvances.length === 1 ? "" : "s"} · newest first
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              <Plus size={13} />
              Add
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="table min-w-[560px]">
              <thead className="table-head">
                <tr>
                  <th className="px-4">Date</th>
                  <th className="px-4">Note</th>
                  <th className="px-4 text-right">Amount</th>
                  <th className="px-4 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {employeeAdvances.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 tabular-nums text-hm-text-muted">
                      {date(a.date)}
                    </td>
                    <td className="px-4 text-hm-text-muted">
                      {a.note || <span className="text-hm-text-subtle">—</span>}
                    </td>
                    <td className="px-4 text-right tabular-nums font-medium text-hm-warning">
                      {money(a.amount)}
                    </td>
                    <td className="px-4">
                      <div className="flex justify-end">
                        <IconButton
                          label={`Delete advance of ${money(a.amount)}`}
                          variant="danger"
                          onClick={() => removeAdvance(a)}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {employeeAdvances.length > 0 && (
                <tfoot>
                  <tr className="border-t border-hm-border bg-hm-surface-2">
                    <td
                      colSpan={2}
                      className="px-4 py-2.5 text-hm-meta font-medium text-hm-text-muted"
                    >
                      Total ({employeeAdvances.length} record
                      {employeeAdvances.length === 1 ? "" : "s"})
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-hm-warning">
                      {money(totalAdvance)}
                    </td>
                    <td className="px-4 py-2.5" />
                  </tr>
                </tfoot>
              )}
            </table>

            {!employeeAdvances.length && (
              <div className="px-4 py-12 text-center">
                <WalletCards
                  size={22}
                  className="mx-auto text-hm-text-subtle"
                />
                <p className="mt-3 text-hm-body font-medium text-hm-text">
                  No advances yet
                </p>
                <p className="mt-1 text-hm-meta text-hm-text-muted">
                  This employee hasn't taken any advance.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setOpen(true)}
                >
                  <Plus size={14} />
                  Add advance
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
              {employee.phone || "—"}
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Joined">
              {employee.joined ? date(employee.joined) : "—"}
            </InfoRow>
          </dl>
        </Panel>
      </div>

      {/* Add advance modal */}
      <Modal
        open={open}
        title="Add salary advance"
        description="Each advance is logged with its own date. You can add as many as needed."
        onClose={close}
      >
        <div className="space-y-3">
          <FormField
            label="Amount"
            required
            htmlFor="adv-amount"
            hint="How much the employee is taking now"
          >
            <Input
              id="adv-amount"
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 5000"
            />
          </FormField>

          <FormField
            label="Date"
            htmlFor="adv-date"
            hint="Defaults to today — change if the advance was taken earlier"
          >
            <Input
              id="adv-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FormField>

          <FormField label="Note" htmlFor="adv-note" hint="Optional">
            <Input
              id="adv-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. Medical, Eid advance"
            />
          </FormField>

          {Number(form.amount) > 0 && (
            <div className="flex items-center justify-between rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2 text-hm-body">
              <span className="text-hm-text-muted">New total advance</span>
              <strong className="tabular-nums text-hm-warning">
                {money(totalAdvance + Number(form.amount || 0))}
              </strong>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            <WalletCards size={14} />
            Add advance
          </Button>
        </div>
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
      to="/employees"
      className="inline-flex items-center gap-1.5 text-hm-meta font-medium text-hm-text-muted hover:text-hm-text"
    >
      <ArrowLeft size={13} />
      Employees
    </Link>
  );
}
