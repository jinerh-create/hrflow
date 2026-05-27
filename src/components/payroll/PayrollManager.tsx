'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, FileText, CheckCircle, DollarSign, Users, TrendingDown, TrendingUp, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { MONTHS } from '@/lib/types';
import Modal from '@/components/shared/Modal';

const fmt = (n: number) => 'MVR ' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: '#F1F5F9', color: '#64748B' },
  processed: { label: 'Processed', bg: '#EEF2FF', color: '#4F46E5' },
  paid:      { label: 'Paid',      bg: '#DCFCE7', color: '#15803D' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1.5px solid #E2E8F0', borderRadius: 9,
  background: 'white', outline: 'none', fontFamily: 'inherit', color: '#0F172A',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
};

interface PayrollRow {
  id: string;
  employee_id: string;
  month: number; year: number;
  basic_salary: number;
  housing_allowance: number; transport_allowance: number;
  food_allowance: number; other_allowance: number;
  deductions: number; overtime_pay: number; bonus: number;
  advance_deduction: number; leave_deduction: number;
  net_salary: number; status: string;
  notes?: string; processed_at?: string;
  employee?: { full_name: string; employee_code: string; department?: { name: string } };
}

export default function PayrollManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payrolls, setPayrolls] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<PayrollRow | null>(null);
  const sb = getSupabase();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await sb.from('payroll')
        .select('*, employee:employees(full_name,employee_code,department:departments(name))')
        .eq('month', month).eq('year', year)
        .order('created_at', { ascending: false });
      setPayrolls((data ?? []) as PayrollRow[]);
    } catch { setPayrolls([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const totalBasic   = payrolls.reduce((s, p) => s + p.basic_salary, 0);
  const totalAllow   = payrolls.reduce((s, p) => s + p.housing_allowance + p.transport_allowance + p.food_allowance + p.other_allowance, 0);
  const totalDeduct  = payrolls.reduce((s, p) => s + p.deductions + p.advance_deduction + p.leave_deduction, 0);
  const totalNet     = payrolls.reduce((s, p) => s + p.net_salary, 0);

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  async function markPaid(id: string) {
    await sb.from('payroll').update({ status: 'paid', processed_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const avatarColors = ['#6366F1', '#0DC9A0', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const avatarBg = (name: string) => avatarColors[(name?.charCodeAt(0) ?? 0) % avatarColors.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={prevMonth} style={{ padding: 8, borderRadius: 9, border: '1.5px solid #E8EDF5', background: 'white', cursor: 'pointer', display: 'flex', color: '#64748B' }}>
            <ChevronLeft size={17} />
          </button>
          <div style={{ minWidth: 160, textAlign: 'center', padding: '8px 18px', background: 'white', borderRadius: 11, border: '1.5px solid #E8EDF5' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{MONTHS[month - 1]} {year}</span>
          </div>
          <button onClick={nextMonth} style={{ padding: 8, borderRadius: 9, border: '1.5px solid #E8EDF5', background: 'white', cursor: 'pointer', display: 'flex', color: '#64748B' }}>
            <ChevronRight size={17} />
          </button>
        </div>
        <button onClick={() => { setEditRow(null); setShowModal(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 11,
          background: 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 3px 12px rgba(13,201,160,0.35)',
        }}>
          <Plus size={16} /> Add Payroll
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Employees', value: payrolls.length, icon: Users, c: '#6366F1', bg: '#EEF2FF', fmt: (v: number) => String(v) },
          { label: 'Total Allowances', value: totalAllow, icon: TrendingUp, c: '#0DC9A0', bg: '#E6FAF5', fmt },
          { label: 'Total Deductions', value: totalDeduct, icon: TrendingDown, c: '#EF4444', bg: '#FEF2F2', fmt },
          { label: 'Net Payroll', value: totalNet, icon: DollarSign, c: '#F59E0B', bg: '#FEF9C3', fmt },
        ].map(({ label, value, icon: Icon, c, bg, fmt: f }) => (
          <div key={label} style={{ background: 'white', borderRadius: 16, border: '1px solid #E8EDF5', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={c} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{f(value)}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8EDF5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E6FAF5', borderTopColor: '#0DC9A0', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading payroll…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : payrolls.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <DollarSign size={26} color="#94A3B8" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>No payroll for {MONTHS[month - 1]} {year}</p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18 }}>Click "Add Payroll" to generate payroll for employees.</p>
            <button onClick={() => setShowModal(true)} style={{ padding: '9px 22px', borderRadius: 9, background: '#0DC9A0', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              + Add Payroll
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E8EDF5' }}>
                  {['Employee', 'Basic Salary', 'Allowances', 'Deductions', 'Overtime', 'Bonus', 'Net Salary', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrolls.map(p => {
                  const st = STATUS[p.status] ?? STATUS.draft;
                  const totalAllowRow = p.housing_allowance + p.transport_allowance + p.food_allowance + p.other_allowance;
                  const totalDeductRow = p.deductions + p.advance_deduction + p.leave_deduction;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarBg(p.employee?.full_name ?? ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                            {initials(p.employee?.full_name ?? '?')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.employee?.full_name ?? '—'}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{p.employee?.department?.name ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{fmt(p.basic_salary)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#059669', fontWeight: 600 }}>+{fmt(totalAllowRow)}</div>
                        {totalAllowRow > 0 && (
                          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                            {[['Hsg', p.housing_allowance], ['Trp', p.transport_allowance], ['Food', p.food_allowance], ['Other', p.other_allowance]].filter(([, v]) => (v as number) > 0).map(([k, v]) => `${k}: ${fmt(v as number)}`).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#DC2626', fontWeight: 600 }}>-{fmt(totalDeductRow)}</div>
                        {totalDeductRow > 0 && (
                          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                            {[['Ded', p.deductions], ['Adv', p.advance_deduction], ['Leave', p.leave_deduction]].filter(([, v]) => (v as number) > 0).map(([k, v]) => `${k}: ${fmt(v as number)}`).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#2563EB', fontWeight: 600 }}>{fmt(p.overtime_pay)}</td>
                      <td style={{ padding: '14px 16px', color: '#7C3AED', fontWeight: 600 }}>{fmt(p.bonus)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{fmt(p.net_salary)}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setEditRow(p); setShowModal(true); }} style={{ padding: 7, borderRadius: 8, border: 'none', background: '#EEF2FF', cursor: 'pointer', display: 'flex' }}>
                            <FileText size={14} color="#6366F1" />
                          </button>
                          {p.status !== 'paid' && (
                            <button onClick={() => markPaid(p.id)} style={{ padding: 7, borderRadius: 8, border: 'none', background: '#DCFCE7', cursor: 'pointer', display: 'flex' }}>
                              <CheckCircle size={14} color="#15803D" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E8EDF5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A', fontSize: 13 }}>Total ({payrolls.length})</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{fmt(totalBasic)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669' }}>+{fmt(totalAllow)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#DC2626' }}>-{fmt(totalDeduct)}</td>
                  <td colSpan={2} />
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', fontSize: 15 }}>{fmt(totalNet)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editRow ? 'Edit Payroll' : `Add Payroll — ${MONTHS[month - 1]} ${year}`} onClose={() => { setShowModal(false); setEditRow(null); }} size="lg">
          <PayrollForm month={month} year={year} existing={editRow} onSaved={() => { setShowModal(false); setEditRow(null); load(); }} onCancel={() => { setShowModal(false); setEditRow(null); }} />
        </Modal>
      )}
    </div>
  );
}

function PayrollForm({ month, year, existing, onSaved, onCancel }: {
  month: number; year: number; existing: PayrollRow | null;
  onSaved: () => void; onCancel: () => void;
}) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    employee_id: existing?.employee_id ?? '',
    basic_salary: String(existing?.basic_salary ?? ''),
    housing_allowance: String(existing?.housing_allowance ?? '0'),
    transport_allowance: String(existing?.transport_allowance ?? '0'),
    food_allowance: String(existing?.food_allowance ?? '0'),
    other_allowance: String(existing?.other_allowance ?? '0'),
    deductions: String(existing?.deductions ?? '0'),
    advance_deduction: String(existing?.advance_deduction ?? '0'),
    leave_deduction: String(existing?.leave_deduction ?? '0'),
    overtime_pay: String(existing?.overtime_pay ?? '0'),
    bonus: String(existing?.bonus ?? '0'),
    notes: existing?.notes ?? '',
  });
  const sb = getSupabase();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await sb.from('employees').select('id,full_name,basic_salary').eq('status', 'active').order('full_name');
        setEmployees(data ?? []);
      } catch {}
    })();
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const n = (k: string) => Number((form as any)[k]) || 0;

  const totalAllowances = n('housing_allowance') + n('transport_allowance') + n('food_allowance') + n('other_allowance');
  const totalDeductions = n('deductions') + n('advance_deduction') + n('leave_deduction');
  const net = n('basic_salary') + totalAllowances + n('overtime_pay') + n('bonus') - totalDeductions;

  function selectEmployee(id: string) {
    const emp = employees.find(e => e.id === id);
    set('employee_id', id);
    if (emp?.basic_salary) set('basic_salary', String(emp.basic_salary));
  }

  async function save() {
    if (!form.employee_id || !form.basic_salary) { setError('Employee and basic salary are required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        employee_id: form.employee_id, month, year,
        basic_salary: n('basic_salary'),
        housing_allowance: n('housing_allowance'),
        transport_allowance: n('transport_allowance'),
        food_allowance: n('food_allowance'),
        other_allowance: n('other_allowance'),
        deductions: n('deductions'),
        advance_deduction: n('advance_deduction'),
        leave_deduction: n('leave_deduction'),
        overtime_pay: n('overtime_pay'),
        bonus: n('bonus'),
        net_salary: net,
        status: 'processed',
        notes: form.notes,
        processed_at: new Date().toISOString(),
      };
      if (existing) {
        await sb.from('payroll').update(payload).eq('id', existing.id);
      } else {
        await sb.from('payroll').upsert(payload, { onConflict: 'employee_id,month,year' });
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Failed to save'); }
    setSaving(false);
  }

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#94A3B8', paddingBottom: 8, borderBottom: '1px solid #F1F5F9', marginBottom: 12, marginTop: 4 }}>
      {title}
    </div>
  );

  const Field = ({ label, k, hint }: { label: string; k: string; hint?: string }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type="number" min="0" value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder="0" />
      {hint && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {error && <div style={{ padding: '10px 14px', borderRadius: 9, background: '#FEF2F2', color: '#DC2626', fontSize: 13, border: '1px solid #FECACA' }}>{error}</div>}

      {/* Employee */}
      {sectionTitle('Employee')}
      <div>
        <label style={labelStyle}>Select Employee *</label>
        <select style={inputStyle} value={form.employee_id} onChange={e => selectEmployee(e.target.value)} disabled={!!existing}>
          <option value="">Choose employee…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Basic Salary (MVR) *</label>
        <input style={{ ...inputStyle, fontWeight: 700, fontSize: 15 }} type="number" min="0" value={form.basic_salary} onChange={e => set('basic_salary', e.target.value)} placeholder="0.00" />
      </div>

      {/* Allowances */}
      {sectionTitle('Allowances')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Housing Allowance" k="housing_allowance" />
        <Field label="Transport Allowance" k="transport_allowance" />
        <Field label="Food Allowance" k="food_allowance" />
        <Field label="Other Allowance" k="other_allowance" />
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Total Allowances</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#15803D' }}>+{fmt(totalAllowances)}</span>
      </div>

      {/* Earnings */}
      {sectionTitle('Additional Earnings')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Overtime Pay" k="overtime_pay" />
        <Field label="Bonus" k="bonus" />
      </div>

      {/* Deductions */}
      {sectionTitle('Deductions')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Deductions" k="deductions" hint="Tax / other" />
        <Field label="Advance Deduction" k="advance_deduction" />
        <Field label="Leave Deduction" k="leave_deduction" />
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 9, background: '#FFF1F2', border: '1px solid #FECDD3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#9F1239' }}>Total Deductions</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#BE123C' }}>-{fmt(totalDeductions)}</span>
      </div>

      {/* Net salary */}
      <div style={{ padding: '14px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>NET SALARY</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Basic + Allowances + Earnings − Deductions</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{fmt(net)}</div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <input style={inputStyle} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{
          flex: 1, padding: '11px 0', borderRadius: 10,
          background: saving ? '#94A3B8' : 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: saving ? 'none' : '0 3px 10px rgba(13,201,160,0.3)',
        }}>
          {saving ? 'Saving…' : existing ? 'Update Payroll' : 'Save Payroll'}
        </button>
        <button onClick={onCancel} style={{ padding: '11px 20px', borderRadius: 10, background: '#F1F5F9', color: '#475569', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
