import React, { useMemo, useState } from "react";
import { Banknote, Plus, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Button, IconButton, Input, Modal, Panel } from "../components/ui";
import FormField from "../components/FormField";
import { useAppData } from "../context/AppDataContext";
import { date, money, todayISO } from "../lib/utils";

export default function Salaries() {
  const { employees, salaryPayments = [], addSalaryPayment, deleteSalaryPayment } = useAppData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", date: todayISO(), note: "" });
  const totals = useMemo(() => salaryPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0), [salaryPayments]);
  const employeeName = (id) => employees.find((item) => item.id === id)?.name || "Deleted employee";
  const paidByEmployee = salaryPayments.reduce((acc, item) => {
    acc[item.employeeId] = (acc[item.employeeId] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  function save() {
    const employee = employees.find((item) => item.id === form.employeeId);
    const amount = Number(form.amount);
    if (!employee || amount <= 0) return;
    const remaining = Math.max(0, Number(employee.salary || 0) - (paidByEmployee[employee.id] || 0));
    if (amount > remaining) return;
    addSalaryPayment(form);
    setForm({ employeeId: "", amount: "", date: todayISO(), note: "" });
    setOpen(false);
  }

  return <div className="space-y-4">
    <PageHeader title="Salaries" subtitle="Record salary payments and deduct them from the shop amount." action={<Button onClick={() => setOpen(true)}><Plus size={15} /> Pay salary</Button>} />
    <section className="panel overflow-hidden"><div className="grid grid-cols-3 divide-x divide-hm-border"><Stat label="Payments" value={salaryPayments.length} /><Stat label="Total paid" value={money(totals)} /><Stat label="Employees" value={employees.length} /></div></section>
    <Panel bodyClassName="p-0"><div className="overflow-x-auto"><table className="table min-w-[700px]"><thead className="table-head"><tr><th className="px-4">Date</th><th className="px-4">Employee</th><th className="px-4">Note</th><th className="px-4 text-right">Amount</th><th className="px-4 text-right">Actions</th></tr></thead><tbody>{salaryPayments.map((item) => <tr key={item.id}><td className="px-4 tabular-nums text-hm-text-muted">{date(item.date)}</td><td className="px-4 font-medium text-hm-text">{employeeName(item.employeeId)}</td><td className="px-4 text-hm-text-muted">{item.note || "—"}</td><td className="px-4 text-right font-medium tabular-nums">{money(item.amount)}</td><td className="px-4"><div className="flex justify-end"><IconButton label="Delete salary payment" variant="danger" onClick={() => { if (confirm("Delete this salary payment?")) deleteSalaryPayment(item.id); }}><Trash2 size={14} /></IconButton></div></td></tr>)}</tbody></table>{!salaryPayments.length && <div className="px-4 py-12 text-center"><Banknote size={22} className="mx-auto text-hm-text-subtle" /><p className="mt-3 text-hm-body text-hm-text-muted">No salary payments recorded</p></div>}</div></Panel>
    <Modal open={open} title="Pay salary" description="The payment reduces the employee's remaining salary and is recorded as a shop expense." onClose={() => setOpen(false)}><div className="space-y-3"><FormField label="Employee" required htmlFor="salary-employee"><select id="salary-employee" className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Select employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — remaining {money(Math.max(0, Number(employee.salary || 0) - (paidByEmployee[employee.id] || 0)))}</option>)}</select></FormField><FormField label="Amount" required htmlFor="salary-amount"><Input id="salary-amount" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></FormField><FormField label="Date" htmlFor="salary-date"><Input id="salary-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormField><FormField label="Note" htmlFor="salary-note"><Input id="salary-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Monthly salary" /></FormField><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Deduct salary</Button></div></div></Modal>
  </div>;
}

function Stat({ label, value }) { return <div className="px-4 py-3"><div className="text-hm-meta text-hm-text-muted">{label}</div><div className="mt-0.5 text-[18px] font-medium tabular-nums text-hm-text">{value}</div></div>; }
