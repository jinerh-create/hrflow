'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Employee } from '@/lib/types';
import { fmtDate, fmtMoney, STATUS_COLORS } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import EmployeeForm from './EmployeeForm';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    if (search) list = list.filter(e => e.full_name.toLowerCase().includes(search.toLowerCase()) || e.employee_code.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    setFiltered(list);
  }, [search, statusFilter, employees]);

  async function deleteEmployee(id: string) {
    if (!confirm('Delete this employee? This cannot be undone.')) return;
    await sb.from('employees').delete().eq('id', id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  const stats = { total: employees.length, active: employees.filter(e => e.status === 'active').length, inactive: employees.filter(e => e.status === 'inactive').length };

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {[['all','All','bg-slate-800 text-white'],[`active`,'Active','bg-green-100 text-green-700'],['inactive','Inactive','bg-yellow-100 text-yellow-700'],['terminated','Terminated','bg-red-100 text-red-700']].map(([v, l, cls]) => (
          <button key={v} onClick={() => setStatusFilter(v as string)}
            className={cn('px-4 py-1.5 rounded-full text-sm font-semibold transition-all', statusFilter === v ? cls : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300')}>
            {l}
            <span className="ml-1.5 text-xs opacity-70">{v === 'all' ? stats.total : v === 'active' ? stats.active : v === 'inactive' ? stats.inactive : employees.filter(e=>e.status==='terminated').length}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, code, email…"
            className="form-input pl-10" />
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No employees found</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Joining Date</th>
                <th>Salary</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.full_name} photoUrl={emp.photo_url} size={36} />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{emp.full_name}</p>
                        <p className="text-xs text-slate-400">{emp.employee_code} · {emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600 text-sm">{(emp as any).department?.name ?? '—'}</td>
                  <td className="text-slate-600 text-sm">{(emp as any).designation?.name ?? '—'}</td>
                  <td className="text-slate-500 text-sm">{fmtDate(emp.joining_date)}</td>
                  <td className="font-semibold text-slate-700 text-sm">{fmtMoney(emp.basic_salary)}</td>
                  <td><Badge status={emp.status} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/employees/${emp.id}`} className="btn-ghost btn-sm p-2"><Eye size={15} /></Link>
                      <button className="btn-ghost btn-sm p-2"><Edit2 size={15} /></button>
                      <button onClick={() => deleteEmployee(emp.id)} className="btn-ghost btn-sm p-2 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <Modal title="Add Employee" onClose={() => setShowAdd(false)} size="lg">
        <EmployeeForm onSaved={() => { setShowAdd(false); fetchEmployees(); }} onCancel={() => setShowAdd(false)} />
      </Modal>}
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
    </svg>
  );
}
