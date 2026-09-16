import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  WalletCards,
  Users,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { money, date } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import { Button, Modal, IconButton, Input, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";
import { useNavigate } from "react-router-dom";

const blank = { name: "", phone: "", address: "" };

export default function Customers() {
  const navigate = useNavigate();
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    receivePayment,
    sales,
  } = useAppData();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [form, setForm] = useState(blank);

  const list = useMemo(
    () =>
      customers.filter((c) =>
        `${c.name} ${c.phone} ${c.id}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [customers, q],
  );

  const totalDue = customers.reduce((a, c) => a + Number(c.due || 0), 0);
  const dueCount = customers.filter((c) => Number(c.due || 0) > 0).length;

  function save() {
    if (!form.name.trim()) return;
    const item = {
      ...form,
      id: editing?.id || `HBC-${String(customers.length + 1).padStart(3, "0")}`,
      visits: Number(editing?.visits || 0),
      spent: Number(editing?.spent || 0),
      due: Number(editing?.due || 0),
      createdAt: editing?.createdAt || new Date().toISOString().slice(0, 10),
    };
    editing ? updateCustomer(editing.id, item) : addCustomer(item);
    close();
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function receive() {
    if (!selected || !Number(amount)) return;
    receivePayment(
      selected.id,
      Math.min(Number(amount), Number(selected.due || 0)),
    );
    setAmount("");
    setPayOpen(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        subtitle="Accounts, spending history, and outstanding balances."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={15} />
            Add customer
          </Button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Customers" value={customers.length} />
          <Stat
            label="Outstanding"
            value={money(totalDue)}
            tone={totalDue > 0 ? "warning" : "default"}
          />
          <Stat
            label="With balance"
            value={dueCount}
            tone={dueCount > 0 ? "warning" : "default"}
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
          placeholder="Search by name, phone, or ID…"
          className="pl-9"
        />
      </div>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[900px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Customer</th>
                <th className="px-4">Contact</th>
                <th className="px-4">Since</th>
                <th className="px-4 text-right">Visits</th>
                <th className="px-4 text-right">Spent</th>
                <th className="px-4 text-right">Balance</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const due = Number(c.due || 0);
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="cursor-pointer"
                  >
                    <td className="px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-hm-primary text-[11px] font-semibold text-white">
                          {c.name
                            .split(" ")
                            .map((x) => x[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-hm-text">
                            {c.name}
                          </div>
                          <div className="text-hm-meta text-hm-text-subtle tabular-nums">
                            {c.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4">
                      <div className="text-hm-text-muted">{c.phone || "—"}</div>
                      {c.address && (
                        <div className="truncate text-hm-meta text-hm-text-subtle">
                          {c.address}
                        </div>
                      )}
                    </td>
                    <td className="px-4 tabular-nums text-hm-text-muted">
                      {c.createdAt ? date(c.createdAt) : "—"}
                    </td>
                    <td className="px-4 text-right tabular-nums text-hm-text-muted">
                      {c.visits || 0}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {money(c.spent || 0)}
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
                        {due > 0 && (
                          <IconButton
                            label={`Receive payment from ${c.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(c);
                              setAmount("");
                              setPayOpen(true);
                            }}
                          >
                            <WalletCards size={14} />
                          </IconButton>
                        )}
                        <IconButton
                          label={`Edit ${c.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(c);
                            setForm({ ...c });
                            setOpen(true);
                          }}
                        >
                          <Edit3 size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${c.name}`}
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete ${c.name}?`))
                              deleteCustomer(c.id);
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

          {!list.length && (
            <div className="px-4 py-12 text-center">
              <Users size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                {q ? "No customers match your search" : "No customers yet"}
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                {q
                  ? "Try a different name, phone, or ID."
                  : "Add your first customer to track visits and balances."}
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
                  <UserPlus size={14} />
                  Add customer
                </Button>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Add / edit modal */}
      <Modal
        open={open}
        title={editing ? "Edit customer" : "Add customer"}
        onClose={close}
      >
        <div className="space-y-3">
          <FormField label="Name" required htmlFor="cus-name">
            <Input
              id="cus-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Customer name"
            />
          </FormField>
          <FormField label="Phone" htmlFor="cus-phone">
            <Input
              id="cus-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0300-1234567"
            />
          </FormField>
          <FormField label="Address" htmlFor="cus-address">
            <Input
              id="cus-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Hayatabad, Peshawar"
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? "Save changes" : "Add customer"}
          </Button>
        </div>
      </Modal>

      {/* Receive payment modal */}
      <Modal
        open={payOpen}
        title="Receive payment"
        onClose={() => setPayOpen(false)}
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-hm-md border border-hm-border bg-hm-surface-2 p-3">
              <div className="text-hm-body font-medium text-hm-text">
                {selected.name}
              </div>
              <div className="mt-1 flex items-center justify-between text-hm-meta text-hm-text-muted">
                <span>Outstanding balance</span>
                <strong className="tabular-nums text-hm-warning">
                  {money(selected.due)}
                </strong>
              </div>
            </div>

            <FormField label="Amount received" htmlFor="cus-pay-amount">
              <Input
                id="cus-pay-amount"
                type="number"
                min="1"
                max={selected.due}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Up to ${money(selected.due)}`}
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button onClick={receive}>
                <CreditCard size={14} />
                Receive payment
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
