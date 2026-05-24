'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, FileText, CheckCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Payroll, Employee } from '@/lib/types';
import { MONTHS, fmtMoney } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';

export default function PayrollManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [showGen, setShowGen] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetch = async () => {
    setLoading(true);
    const { data } = await sb.from('payroll').select('*, employee:employees(full_name,photo_url,employee_code,department:departments(name))').eq('month', month).eq('year', year).order('created_at', { ascending: false });
    setPayrolls((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [month, year]);

  const totalNet = payrolls.reduce((s, p) => s + p.net_salary, 0);
  const totalGross = payrolls.reduce((s, p) => s + p.basic_salary + p.allowances + p.overtime_pay + p.bonus, 0);

  async function markPaid(id: string) {
    await sb.from('payroll').update({ status: 'paid', processed_at: new Date().toISOString() }).eq('id', id);
    fetch();
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
          <span className="font-bold text-lg">{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight size={18} /></button>
        </div>
        <button onClick={() => setShowGen(true)} className="btn-primary"><Plus size={15} /> Generate / Add</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-sm text-slate-500 font-medium">Total Employees</p><p className="text-2xl font-bold text-slate-800 mt-1">{payrolls.length}</p></div>
        <div className="card text-center"><p className="text-sm text-slate-500 font-medium">Gross Payroll</p><p className="text-2xl font-bold text-indigo-600 mt-1">{fmtMoney(totalGross)}</p></div>
        <div className="card text-center"><p className="text-sm text-slate-500 font-medium">Net Payroll</p><p className="text-2xl font-bold text-green-600 mt-1">{fmtMoney(totalNet)}</p></div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
          <table className="tbl">
            <thead>
              <tr><th>Employee</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Overtime</th><th>Bonus</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-400 py-12">No payroll for {MONTHS[month-1]} {year}</td></tr>
              ) : payrolls.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={(p as any).employee?.full_name ?? '?'} photoUrl={(p as any).employee?.photo_url} size={32} />
                      <div>
                        <p className="font-semibold text-sm">{(p as any).employee?.full_name}</p>
                        <p className="text-xs text-slate-400">{(p as any).employee?.department?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{fmtMoney(p.basic_salary)}</td>
                  <td className="text-sm text-green-600">{fmtMoney(p.allowances)}</td>
                  <td className="text-sm text-red-600">-{fmtMoney(p.deductions + p.leave_deduction + p.advance_deduction)}</td>
                  <td className="text-sm text-blue-600">{fmtMoney(p.overtime_pay)}</td>
                  <td className="text-sm text-purple-600">{fmtMoney(p.bonus)}</td>
                  <td className="font-bold text-slate-800">{fmtMoney(p.net_salary)}</td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button className="btn-ghost btn-sm p-2 text-blue-600"><FileText size={15} /></button>
                      {p.status !== 'paid' && <button onClick={() => markPaid(p.id)} className="btn-ghost btn-sm p-2 text-green-600"><CheckCircle size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showGen && <GeneratePayrollModal month={month} year={year} onClose={() => setShowGen(false)} onSaved={fetch} />}
    </div>
  );
}

function GeneratePayrollModal({ month, year, onClose, onSaved }: { month: number; year: number; onClose: () => void; onSaved: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ employee_id: '', basic_salary: '', allowances: '0', deductions: '0', overtime_pay: '0', bonus: '0', advance_deduction: '0', leave_deduction: '0', notes: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  useEffect(() => {
    sb.from('employees').select('id,full_name,basic_salary').eq('status','active').order('full_name').then(({ data }) => setEmployees(data ?? []));
  }, []);

  function selectEmployee(id: string) {
    const emp = employees.find(e => e.id === id);
    setForm(f => ({ ...f, employee_id: id, basic_salary: String(emp?.basic_salary ?? 0) }));
  }

  const net = (Number(form.basic_salary) || 0) + (Number(form.allowances) || 0) + (Number(form.overtime_pay) || 0) + (Number(form.bonus) || 0) - (Number(form.deductions) || 0) - (Number(form.advance_deduction) || 0) - (Number(form.leave_deduction) || 0);

  async function save() {
    if (!form.employee_id) return;
    setSaving(true);
    await sb.from('payroll').upsert({
      employee_id: form.employee_id, month, year, status: 'processed',
      basic_salary: Number(form.basic_salary), allowances: Number(form.allowances),
      deductions: Number(form.deductions), overtime_pay: Number(form.overtime_pay),
      bonus: Number(form.bonus), advance_deduction: Number(form.advance_deduction),
      leave_deduction: Number(form.leave_deduction), net_salary: net, notes: form.notes,
      processed_at: new Date().toISOString(),
    }, { onConflict: 'employee_id,month,year' });
    setSaving(false); onSaved(); onClose();
  }

  const F = ({ label, k }: { label: string; k: string }) => (
    <div><label className="form-label">{label}</label>
      <input className="form-input" type="number" min="0" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
    </div>
  );

  return (
    <Modal title={`Payroll — ${MONTHS[month-1]} ${year}`} onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Employee</label>
          <select className="form-select" value={form.employee_id} onChange={e => selectEmployee(e.target.value)}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Basic Salary" k="basic_salary" />
          <F label="Allowances" k="allowances" />
          <F label="Deductions" k="deductions" />
          <F label="Overtime Pay" k="overtime_pay" />
          <F label="Bonus" k="bonus" />
          <F label="Advance Deduction" k="advance_deduction" />
          <F label="Leave Deduction" k="leave_deduction" />
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-600 font-medium">Net Salary</p>
          <p className="text-2xl font-bold text-blue-700">{fmtMoney(net)}</p>
        </div>
        <div><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        <div className="flex gap-3">
          <button onClick={save} disabled={saving || !form.employee_id} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save Payroll'}</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
