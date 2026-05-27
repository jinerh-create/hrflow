'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Eye, Mail, Phone, Users, UserCheck, UserX, AlertCircle, MoreHorizontal } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types';
import { fmtDate } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Modal from '@/components/shared/Modal';
import EmployeeForm from './EmployeeForm';
import Link from 'next/link';

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  active:     { label: 'ACTIVE',     bg: '#DCFCE7', color: '#15803D' },
  inactive:   { label: 'INACTIVE',   bg: '#FEF9C3', color: '#A16207' },
  terminated: { label: 'TERMINATED', bg: '#FEE2E2', color: '#B91C1C' },
  on_leave:   { label: 'ON LEAVE',   bg: '#E0F2FE', color: '#0369A1' },
};

function EmployeeCard({ emp, onEdit, onView }: { emp: any; onEdit: () => void; onView: () => void }) {
  const st = STATUS_STYLE[emp.status] ?? STATUS_STYLE.active;
  const initials = emp.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const colors = ['#6366F1', '#0DC9A0', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const avatarBg = colors[(emp.full_name?.charCodeAt(0) ?? 0) % colors.length];

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E8EDF5',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}>
      {/* Card top */}
      <div style={{ padding: '14px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          padding: '3px 10px', borderRadius: 99,
          background: st.bg, color: st.color,
        }}>{st.label}</span>
        <button style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' }}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Profile */}
      <div style={{ padding: '10px 18px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: emp.photo_url ? 'transparent' : avatarBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: 'white',
          flexShrink: 0, overflow: 'hidden',
          border: '2px solid #E8EDF5',
        }}>
          {emp.photo_url
            ? <img src={emp.photo_url} alt={emp.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {emp.full_name}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            {emp.designation?.name ?? emp.designation_id ?? '—'}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#F1F5F9', margin: '0 0' }} />

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', padding: '0' }}>
        <div style={{ padding: '10px 18px', borderRight: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 3 }}>Department</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{emp.department?.name ?? '—'}</div>
        </div>
        <div style={{ padding: '10px 18px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 3 }}>Date of Joining</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{fmtDate(emp.joining_date)}</div>
        </div>
      </div>

      <div style={{ height: 1, background: '#F1F5F9' }} />

      {/* Contact */}
      <div style={{ padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={12} color="#64748B" />
          </div>
          <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Phone size={12} color="#64748B" />
          </div>
          <span style={{ fontSize: 12, color: '#475569' }}>{emp.phone || '—'}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #F1F5F9', marginTop: 'auto' }}>
        <button onClick={onEdit} style={{
          padding: '10px 0', fontSize: 13, fontWeight: 600,
          color: '#64748B', background: 'none', border: 'none',
          borderRight: '1px solid #F1F5F9', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: 'inherit',
        }}>
          <Edit2 size={13} /> Edit
        </button>
        <Link href={`/employees/${emp.id}`} style={{
          padding: '10px 0', fontSize: 13, fontWeight: 600,
          color: '#0DC9A0', background: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          textDecoration: 'none',
        }}>
          <Eye size={13} /> View
        </Link>
      </div>
    </div>
  );
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editEmp, setEditEmp] = useState<any>(null);
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

  const total = employees.length;
  const chips = [
    { value: 'all', label: 'All', count: total, icon: Users, c: '#6366F1', bg: '#EEF2FF' },
    { value: 'active', label: 'Active', count: employees.filter(e => e.status === 'active').length, icon: UserCheck, c: '#10B981', bg: '#D1FAE5' },
    { value: 'inactive', label: 'Inactive', count: employees.filter(e => e.status === 'inactive').length, icon: AlertCircle, c: '#F59E0B', bg: '#FEF3C7' },
    { value: 'terminated', label: 'Terminated', count: employees.filter(e => e.status === 'terminated').length, icon: UserX, c: '#EF4444', bg: '#FEE2E2' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Stat chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {chips.map(({ value, label, count, icon: Icon, c, bg }) => {
          const isActive = statusFilter === value;
          return (
            <button key={value} onClick={() => setStatusFilter(value)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              background: isActive ? c : 'white',
              border: `1.5px solid ${isActive ? c : '#E8EDF5'}`,
              borderRadius: 14, cursor: 'pointer',
              boxShadow: isActive ? `0 4px 14px ${c}35` : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: isActive ? 'rgba(255,255,255,0.22)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color={isActive ? 'white' : c} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: isActive ? 'white' : '#0F172A', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.8)' : '#94A3B8', marginTop: 3, fontWeight: 500 }}>{label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, position, email…"
            style={{ width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14, border: '1.5px solid #E8EDF5', borderRadius: 11, background: 'white', outline: 'none', fontFamily: 'inherit', color: '#0F172A' }}
          />
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 11,
          background: 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 3px 12px rgba(13,201,160,0.35)', flexShrink: 0,
        }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Card grid / states */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E6FAF5', borderTopColor: '#0DC9A0', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading employees…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8EDF5', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={28} color="#94A3B8" />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>No employees found</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
            {search ? 'Try a different search term.' : 'Add your first employee to get started.'}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} style={{ padding: '9px 22px', borderRadius: 9, background: '#0DC9A0', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add First Employee
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(emp => (
            <EmployeeCard key={emp.id} emp={emp}
              onEdit={() => setEditEmp(emp)}
              onView={() => {}}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Employee" onClose={() => setShowAdd(false)} size="lg">
          <EmployeeForm onSaved={() => { setShowAdd(false); fetchEmployees(); }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editEmp && (
        <Modal title="Edit Employee" onClose={() => setEditEmp(null)} size="lg">
          <EmployeeForm employee={editEmp} onSaved={() => { setEditEmp(null); fetchEmployees(); }} onCancel={() => setEditEmp(null)} />
        </Modal>
      )}
    </div>
  );
}
