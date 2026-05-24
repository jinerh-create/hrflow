'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Department, Designation } from '@/lib/types';
import { generateEmployeeCode } from '@/lib/utils';

interface Props { onSaved: () => void; onCancel: () => void; employee?: any; }

export default function EmployeeForm({ onSaved, onCancel, employee }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: employee?.full_name ?? '',
    email: employee?.email ?? '',
    phone: employee?.phone ?? '',
    date_of_birth: employee?.date_of_birth ?? '',
    nationality: employee?.nationality ?? '',
    address: employee?.address ?? '',
    department_id: employee?.department_id ?? '',
    designation_id: employee?.designation_id ?? '',
    joining_date: employee?.joining_date ?? new Date().toISOString().slice(0,10),
    employment_type: employee?.employment_type ?? 'full_time',
    basic_salary: employee?.basic_salary ?? '',
    bank_name: employee?.bank_name ?? '',
    bank_account: employee?.bank_account ?? '',
    emergency_contact_name: employee?.emergency_contact_name ?? '',
    emergency_contact_phone: employee?.emergency_contact_phone ?? '',
    notes: employee?.notes ?? '',
  });
  const sb = getSupabase();

  useEffect(() => {
    Promise.all([
      sb.from('departments').select('*').order('name'),
      sb.from('designations').select('*').order('name'),
    ]).then(([d, des]) => {
      setDepartments(d.data ?? []);
      setDesignations(des.data ?? []);
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.full_name || !form.email || !form.joining_date) { setError('Name, email and joining date are required'); return; }
    setSaving(true); setError('');
    try {
      if (employee) {
        await sb.from('employees').update({ ...form, basic_salary: Number(form.basic_salary) || 0 }).eq('id', employee.id);
      } else {
        const { count } = await sb.from('employees').select('*', { count: 'exact', head: true });
        const code = generateEmployeeCode((count ?? 0) + 1);
        await sb.from('employees').insert({ ...form, employee_code: code, basic_salary: Number(form.basic_salary) || 0, status: 'active' });
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Failed to save'); }
    setSaving(false);
  }

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="form-label">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <F label="Full Name *"><input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ahmed Mohamed" /></F>
        <F label="Email *"><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ahmed@company.com" /></F>
        <F label="Phone"><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+960 xxx xxxx" /></F>
        <F label="Date of Birth"><input className="form-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></F>
        <F label="Nationality"><input className="form-input" value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Maldivian" /></F>
        <F label="Employment Type">
          <select className="form-select" value={form.employment_type} onChange={e => set('employment_type', e.target.value)}>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </F>
        <F label="Department">
          <select className="form-select" value={form.department_id} onChange={e => set('department_id', e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>
        <F label="Designation">
          <select className="form-select" value={form.designation_id} onChange={e => set('designation_id', e.target.value)}>
            <option value="">Select designation</option>
            {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>
        <F label="Joining Date *"><input className="form-input" type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)} /></F>
        <F label="Basic Salary (USD)"><input className="form-input" type="number" value={form.basic_salary} onChange={e => set('basic_salary', e.target.value)} placeholder="0" /></F>
        <F label="Bank Name"><input className="form-input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} /></F>
        <F label="Bank Account"><input className="form-input" value={form.bank_account} onChange={e => set('bank_account', e.target.value)} /></F>
        <F label="Emergency Contact"><input className="form-input" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Name" /></F>
        <F label="Emergency Phone"><input className="form-input" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} /></F>
      </div>
      <F label="Address"><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></F>
      <F label="Notes"><textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></F>

      <div className="flex gap-3 pt-2">
        <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : employee ? 'Update Employee' : 'Add Employee'}</button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
