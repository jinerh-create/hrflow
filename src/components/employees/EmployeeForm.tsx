'use client';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Department, Designation } from '@/lib/types';
import { generateEmployeeCode } from '@/lib/utils';

interface Props { onSaved: () => void; onCancel: () => void; employee?: any; }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', fontSize: 14,
  border: '1.5px solid #E2E8F0', borderRadius: 9,
  background: 'white', outline: 'none',
  fontFamily: "'Inter', system-ui, sans-serif",
  color: '#0F172A', transition: 'border-color 0.15s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#475569', marginBottom: 5, letterSpacing: '0.01em',
};
const sectionStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: '#94A3B8',
  paddingBottom: 8, borderBottom: '1px solid #F1F5F9',
  marginBottom: 12, marginTop: 4,
};

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
    joining_date: employee?.joining_date ?? new Date().toISOString().slice(0, 10),
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
    }).catch(() => {
      // tables may not exist yet — form still works with empty dropdowns
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.full_name || !form.email || !form.joining_date) {
      setError('Full name, email and joining date are required');
      return;
    }
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

  const F = ({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) => (
    <div style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '20px 24px 24px', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: '#FEF2F2', color: '#DC2626', fontSize: 13, border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Personal Info */}
      <div style={sectionStyle}>Personal Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <F label="Full Name *">
          <input style={inputStyle} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Ahmed Mohamed" />
        </F>
        <F label="Email Address *">
          <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ahmed@company.com" />
        </F>
        <F label="Phone Number">
          <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+960 xxx xxxx" />
        </F>
        <F label="Date of Birth">
          <input style={inputStyle} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
        </F>
        <F label="Nationality">
          <input style={inputStyle} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Maldivian" />
        </F>
        <F label="Address" span2>
          <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, City" />
        </F>
      </div>

      {/* Job Info */}
      <div style={sectionStyle}>Job Information</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <F label="Department">
          <select style={inputStyle} value={form.department_id} onChange={e => set('department_id', e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>
        <F label="Position / Designation">
          <select style={inputStyle} value={form.designation_id} onChange={e => set('designation_id', e.target.value)}>
            <option value="">Select position</option>
            {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </F>
        <F label="Employment Type">
          <select style={inputStyle} value={form.employment_type} onChange={e => set('employment_type', e.target.value)}>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </F>
        <F label="Joining Date *">
          <input style={inputStyle} type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)} />
        </F>
        <F label="Basic Salary (USD)">
          <input style={inputStyle} type="number" value={form.basic_salary} onChange={e => set('basic_salary', e.target.value)} placeholder="0" />
        </F>
      </div>

      {/* Bank & Emergency */}
      <div style={sectionStyle}>Bank & Emergency</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <F label="Bank Name">
          <input style={inputStyle} value={form.bank_name} onChange={e => set('bank_name', e.target.value)} />
        </F>
        <F label="Bank Account">
          <input style={inputStyle} value={form.bank_account} onChange={e => set('bank_account', e.target.value)} />
        </F>
        <F label="Emergency Contact Name">
          <input style={inputStyle} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
        </F>
        <F label="Emergency Contact Phone">
          <input style={inputStyle} value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} />
        </F>
        <F label="Notes" span2>
          <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </F>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={save} disabled={saving} style={{
          flex: 1, padding: '11px 0', borderRadius: 10,
          background: saving ? '#94A3B8' : 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: saving ? 'none' : '0 3px 10px rgba(13,201,160,0.3)',
        }}>
          {saving ? 'Saving…' : employee ? 'Update Employee' : 'Add Employee'}
        </button>
        <button onClick={onCancel} style={{
          padding: '11px 20px', borderRadius: 10,
          background: '#F1F5F9', color: '#475569',
          fontSize: 14, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
