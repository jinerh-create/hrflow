'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types';
import { fmtDate, fmtMoney } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import EmployeeForm from './EmployeeForm';
import Link from 'next/link';

const T = {
  surface: '#F0F4F8',
  white: 'white',
  border: '#E8EDF5',
  primary: '#0DC9A0',
  primaryLight: '#E6FAF5',
  primaryDark: '#0AA88A',
  text: '#0F172A',
  sub: '#64748B',
  muted: '#94A3B8',
  radius: 12,
  radiusSm: 8,
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await sb.from('employees')
      .select('*, department:departments(name), designation:designations(name)')
      .order('created_at', { ascending: false });
    setEmployees(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    let list = employees;
    if (search) list = list.filter(e =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    setFiltered(list);
  }, [search, statusFilter, employees]);

  async function deleteEmployee(id: string) {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    await sb.from('employees').delete().eq('id', id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  const total = employees.length;
  const active = employees.filter(e => e.status === 'active').length;
  const inactive = employees.filter(e => e.status === 'inactive').length;
  const terminated = employees.filter(e => e.status === 'terminated').length;

  const statChips = [
    { value: 'all', label: 'All Employees', count: total, icon: Users, color: '#6366F1', bg: '#EEF2FF' },
    { value: 'active', label: 'Active', count: active, icon: UserCheck, color: '#10B981', bg: '#D1FAE5' },
    { value: 'inactive', label: 'Inactive', count: inactive, icon: AlertCircle, color: '#F59E0B', bg: '#FEF3C7' },
    { value: 'terminated', label: 'Terminated', count: terminated, icon: UserX, color: '#EF4444', bg: '#FEE2E2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {statChips.map(({ value, label, count, icon: Icon, color, bg }) => {
          const active = statusFilter === value;
          return (
            <button key={value} onClick={() => setStatusFilter(value)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              background: active ? color : T.white,
              border: `1.5px solid ${active ? color : T.border}`,
              borderRadius: T.radius + 2,
              cursor: 'pointer', textAlign: 'left',
              boxShadow: active ? `0 4px 14px ${color}30` : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: active ? 'rgba(255,255,255,0.2)' : bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} color={active ? 'white' : color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: active ? 'white' : T.text, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.82)' : T.muted, marginTop: 3, fontWeight: 500 }}>{label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} color={T.muted} style={{ position: 'absolute', left: 13, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code or email…"
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
              fontSize: 14, border: `1.5px solid ${T.border}`, borderRadius: T.radius,
              background: T.white, outline: 'none', fontFamily: 'inherit', color: T.text,
            }}
          />
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: T.radius,
          background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: `0 3px 10px ${T.primary}40`,
          flexShrink: 0,
        }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Table card */}
      <div style={{
        background: T.white, borderRadius: T.radius + 4,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `3px solid ${T.primaryLight}`, borderTopColor: T.primary,
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: T.muted, fontSize: 14 }}>Loading employees…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Users size={28} color={T.muted} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>No employees found</p>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              {search ? 'Try a different search term.' : 'Get started by adding your first employee.'}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)} style={{
                padding: '9px 20px', borderRadius: T.radiusSm,
                background: T.primary, color: 'white',
                fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                + Add First Employee
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                {['Employee', 'Department', 'Designation', 'Joining Date', 'Salary', 'Status', ''].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: h === '' ? 'right' : 'left',
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: T.muted,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={emp.full_name} photoUrl={emp.photo_url} size={36} />
                      <div>
                        <p style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{emp.full_name}</p>
                        <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{emp.employee_code} · {emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: T.sub, fontSize: 13 }}>{(emp as any).department?.name ?? '—'}</td>
                  <td style={{ padding: '13px 16px', color: T.sub, fontSize: 13 }}>{(emp as any).designation?.name ?? '—'}</td>
                  <td style={{ padding: '13px 16px', color: T.muted, fontSize: 13 }}>{fmtDate(emp.joining_date)}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 600, color: T.text, fontSize: 13 }}>{fmtMoney(emp.basic_salary)}</td>
                  <td style={{ padding: '13px 16px' }}><Badge status={emp.status} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <Link href={`/employees/${emp.id}`} style={{
                        display: 'flex', padding: 7, borderRadius: 8,
                        color: T.muted, background: 'none',
                      }}>
                        <Eye size={15} />
                      </Link>
                      <button style={{ display: 'flex', padding: 7, borderRadius: 8, color: T.muted, border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'inherit' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)} style={{ display: 'flex', padding: 7, borderRadius: 8, color: '#EF4444', border: 'none', cursor: 'pointer', background: 'none', fontFamily: 'inherit' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Employee" onClose={() => setShowAdd(false)} size="lg">
          <EmployeeForm onSaved={() => { setShowAdd(false); fetchEmployees(); }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}
