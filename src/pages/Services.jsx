import React, { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, Wrench } from "lucide-react";
import { money } from "../lib/utils";
import PageHeader from "../components/PageHeader";
import { Button, Modal, IconButton, Input, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";

const blank = { name: "", charges: "", time: "", category: "Maintenance" };

export default function Services() {
  const { services, addService, updateService, deleteService } = useAppData();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const list = useMemo(
    () =>
      services.filter((s) =>
        `${s.name} ${s.id} ${s.category}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [services, q],
  );

  const avgCharge = services.length
    ? services.reduce((a, s) => a + Number(s.charges || 0), 0) / services.length
    : 0;
  const categories = new Set(services.map((s) => s.category)).size;

  function save() {
    if (!form.name.trim()) return;
    const item = {
      ...form,
      id: editing?.id || `HBS-${String(services.length + 1).padStart(4, "0")}`,
      charges: Number(form.charges),
      time: Number(form.time),
    };
    editing ? updateService(editing.id, item) : addService(item);
    close();
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function edit(s) {
    setEditing(s);
    setForm({ ...s });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Services"
        subtitle="Workshop labour charges and time estimates."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={15} />
            Add service
          </Button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Services" value={services.length} />
          <Stat label="Average charge" value={money(avgCharge)} />
          <Stat label="Categories" value={categories} />
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
          placeholder="Search services by name, category, or code…"
          className="pl-9"
        />
      </div>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[680px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Service</th>
                <th className="px-4">Category</th>
                <th className="px-4 text-right">Charge</th>
                <th className="px-4 text-right">Time</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td className="px-4">
                    <div className="font-medium text-hm-text">{s.name}</div>
                    <div className="text-hm-meta text-hm-text-subtle tabular-nums">
                      {s.id}
                    </div>
                  </td>
                  <td className="px-4">
                    <span className="badge-neutral">{s.category}</span>
                  </td>
                  <td className="px-4 text-right tabular-nums font-medium">
                    {money(s.charges)}
                  </td>
                  <td className="px-4 text-right tabular-nums text-hm-text-muted">
                    {s.time} min
                  </td>
                  <td className="px-4">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton
                        label={`Edit ${s.name}`}
                        onClick={() => edit(s)}
                      >
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton
                        label={`Delete ${s.name}`}
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete ${s.name}?`)) deleteService(s.id);
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

          {!list.length && (
            <div className="px-4 py-12 text-center">
              <Wrench size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                {q ? "No services match your search" : "No services yet"}
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                {q
                  ? "Try a different name, category, or code."
                  : "Add workshop services so they can be billed in POS."}
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
                  <Plus size={14} />
                  Add service
                </Button>
              )}
            </div>
          )}
        </div>
      </Panel>

      <Modal
        open={open}
        title={editing ? "Edit service" : "Add service"}
        onClose={close}
      >
        <div className="space-y-3">
          <FormField label="Service name" required htmlFor="svc-name">
            <Input
              id="svc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Engine oil change"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category" htmlFor="svc-category">
              <Input
                id="svc-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </FormField>
            <FormField
              label="Standard charge"
              htmlFor="svc-charges"
              hint="What the customer pays"
            >
              <Input
                id="svc-charges"
                type="number"
                min="0"
                value={form.charges}
                onChange={(e) => setForm({ ...form, charges: e.target.value })}
              />
            </FormField>
          </div>
          <FormField
            label="Estimated time"
            htmlFor="svc-time"
            hint="In minutes"
          >
            <Input
              id="svc-time"
              type="number"
              min="0"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? "Save changes" : "Add service"}
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
