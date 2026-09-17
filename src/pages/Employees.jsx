import React, { useState } from "react";
import { Plus, Edit3, Trash2, Users, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Button, Modal, IconButton, Input, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { money, date, todayISO } from "../lib/utils";
import { useAppData } from "../context/AppDataContext";

const blank = {
  name: "",
  role: "",
  phone: "",
  salary: "",
};
function nextEmployeeId(employees) {
  const max = employees.reduce((m, e) => {
    const n = parseInt(String(e.id || "").replace("EMP-", ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `EMP-${String(max + 1).padStart(3, "0")}`;
}
export default function Employees() {
  const { employees, advances, addEmployee, updateEmployee, deleteEmployee } =
    useAppData();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const payroll = employees.reduce((a, e) => a + Number(e.salary || 0), 0);
  const totalAdvances = advances.reduce(
    (a, adv) => a + Number(adv.amount || 0),
    0,
  );

  // Pre-compute per-employee advance totals once.
  const advByEmployee = advances.reduce((acc, adv) => {
    acc[adv.employeeId] = (acc[adv.employeeId] || 0) + Number(adv.amount || 0);
    return acc;
  }, {});

  function save() {
    if (!form.name.trim() || !Number(form.salary)) return;
    const item = {
      ...form,
      salary: Number(form.salary),
    };
    editing
      ? updateEmployee(editing.id, item)
      : addEmployee({
          id: nextEmployeeId(employees),
          joined: todayISO(),
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
    setForm({
      name: e.name,
      role: e.role || "",
      phone: e.phone || "",
      salary: String(e.salary || ""),
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employees"
        subtitle="Roles, monthly salaries, and advance history."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={15} />
            Add employee
          </Button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <Stat label="Employees" value={employees.length} />
          <Stat label="Monthly payroll" value={money(payroll)} />
          <Stat
            label="Total advances"
            value={money(totalAdvances)}
            tone={totalAdvances > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table min-w-[820px]">
            <thead className="table-head">
              <tr>
                <th className="px-4">Employee</th>
                <th className="px-4">Role</th>
                <th className="px-4">Phone</th>
                <th className="px-4 text-right">Salary</th>
                <th className="px-4 text-right">Total advance</th>
                <th className="px-4 text-right">Remaining</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const total = advByEmployee[e.id] || 0;
                const remaining = Math.max(0, Number(e.salary || 0) - total);
                return (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/employees/${e.id}`)}
                    className="cursor-pointer"
                  >
                    <td className="px-4">
                      <div className="font-medium text-hm-text">{e.name}</div>
                      <div className="text-hm-meta text-hm-text-subtle tabular-nums">
                        {e.id}
                      </div>
                    </td>
                    <td className="px-4 text-hm-text-muted">{e.role || "—"}</td>
                    <td className="px-4 tabular-nums text-hm-text-muted">
                      {e.phone || "—"}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {money(e.salary)}
                    </td>
                    <td className="px-4 text-right tabular-nums">
                      {total > 0 ? (
                        <span className="text-hm-warning">{money(total)}</span>
                      ) : (
                        <span className="text-hm-text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 text-right tabular-nums font-medium text-hm-text">
                      {money(remaining)}
                    </td>
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          label={`Edit ${e.name}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            edit(e);
                          }}
                        >
                          <Edit3 size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${e.name}`}
                          variant="danger"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (confirm(`Delete ${e.name}?`))
                              deleteEmployee(e.id);
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

          {!employees.length && (
            <div className="px-4 py-12 text-center">
              <Users size={22} className="mx-auto text-hm-text-subtle" />
              <p className="mt-3 text-hm-body font-medium text-hm-text">
                No employees yet
              </p>
              <p className="mt-1 text-hm-meta text-hm-text-muted">
                Add employees to track salaries and advances.
              </p>
              <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
                <Plus size={14} />
                Add employee
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <Modal
        open={open}
        title={editing ? "Edit employee" : "Add employee"}
        onClose={close}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Name" required htmlFor="emp-name">
              <Input
                id="emp-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bilal Ahmad"
              />
            </FormField>
            <FormField label="Role" htmlFor="emp-role">
              <Input
                id="emp-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Mechanic"
              />
            </FormField>
            <FormField label="Phone" htmlFor="emp-phone">
              <Input
                id="emp-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0300-1234567"
              />
            </FormField>
            <FormField label="Monthly salary" required htmlFor="emp-salary">
              <Input
                id="emp-salary"
                type="number"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="32000"
              />
            </FormField>
          </div>

          <p className="rounded-hm-md border border-hm-border bg-hm-surface-2 px-3 py-2 text-hm-meta text-hm-text-muted">
            To record a salary advance, open the employee and add it from their
            detail page. This keeps a full history per employee.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save}>
            {editing ? "Save changes" : "Add employee"}
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
