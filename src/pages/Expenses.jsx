import React, { useState } from "react";
import { Plus, Edit3, Trash2, WalletCards } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { money, date, todayISO } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import {
  Button,
  Modal,
  IconButton,
  Input,
  Textarea,
  Panel,
} from "../components/ui";
import FormField from "../components/FormField";

const blank = { type: "", amount: "", note: "" };

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const total = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  const largest = expenses.length
    ? Math.max(0, ...expenses.map((e) => Number(e.amount || 0)))
    : 0;

  function save() {
    if (!form.type.trim() || !Number(form.amount)) return;
    const item = { ...form, amount: Number(form.amount) };
    editing
      ? updateExpense(editing.id, item)
      : addExpense({
          id: `EXP-${Date.now()}`,
          date: todayISO(),
          ...item,
        });
    close();
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function edit(e) {
    setEditing(e);
    setForm({ ...e, amount: String(e.amount) });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        subtitle="Day-to-day shop expenses."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={15} />
            Add expense
          </Button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Total" value={money(total)} />
          <Stat label="Entries" value={expenses.length} />
          <Stat label="Largest single" value={money(largest)} />
        </div>
      </section>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[680px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Date</th>
                <th className="px-4">Expense</th>
                <th className="px-4 text-right">Amount</th>
                <th className="px-4">Notes</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 text-hm-text-muted tabular-nums">
                    {date(e.date)}
                  </td>
                  <td className="px-4 font-medium text-hm-text">{e.type}</td>
                  <td className="px-4 text-right tabular-nums">
                    {money(e.amount)}
                  </td>
                  <td className="px-4 text-hm-text-muted">
                    {e.note ? (
                      <span className="line-clamp-1">{e.note}</span>
                    ) : (
                      <span className="text-hm-text-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton
                        label={`Edit ${e.type}`}
                        onClick={() => edit(e)}
                      >
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton
                        label={`Delete ${e.type}`}
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete ${e.type}?`)) deleteExpense(e.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!expenses.length && (
            <div className="px-4 py-12 text-center">
              <WalletCards size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No expenses recorded
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                Record shop expenses to track them against revenue.
              </p>
              <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
                <Plus size={14} />
                Add expense
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <Modal
        open={open}
        title={editing ? "Edit expense" : "Add expense"}
        onClose={close}
      >
        <div className="space-y-3">
          <FormField label="Expense" required htmlFor="exp-type">
            <Input
              id="exp-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="e.g. Shop rent"
            />
          </FormField>
          <FormField label="Amount" required htmlFor="exp-amount">
            <Input
              id="exp-amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="45000"
            />
          </FormField>
          <FormField label="Notes" htmlFor="exp-note" hint="Optional">
            <Textarea
              id="exp-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional note"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? "Save changes" : "Add expense"}
          </Button>
        </div>
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
