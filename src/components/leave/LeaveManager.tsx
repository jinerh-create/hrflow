'use client';
import { useEffect, useState } from 'react';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { LeaveRequest, Employee, LeaveType } from '@/lib/types';
import { fmtDate } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import { calcWorkingDays } from '@/lib/utils';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

export default function LeaveManager() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetchRequests = async () => {
    setLoading(true);
    let q = sb.from('leave_requests').select('*, employee:employees(full_name,photo_url,employee_code), leave_type:leave_types(name), approver:employees!approved_by(full_name)').order('created_at', { ascending: false });
    if (tab !== 'all') q = q.eq('status', tab);
    const { data } = await q;
    setRequests((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [tab]);

  async function updateStatus(id: string, status: 'approved' | 'rejected', comments = '') {
    await sb.from('leave_requests').update({ status, comments }).eq('id', id);
    fetchRequests();
  }

  const counts = { pending: requests.filter(r => r.status === 'pending').length, approved: requests.filter(r => r.status === 'approved').length, rejected: requests.filter(r => r.status === 'rejected').length };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all','pending','approved','rejected'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${tab===t ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> New Request</button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
          <table className="tbl">
            <thead>
              <tr><th>Employee</th><th>Leave Type</th><th>Period</th><th>Days</th><th>Reason</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-slate-400 py-12">No {tab} requests</td></tr>
              ) : requests.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={(r as any).employee?.full_name ?? '?'} photoUrl={(r as any).employee?.photo_url} size={32} />
                      <div>
                        <p className="font-semibold text-sm">{(r as any).employee?.full_name}</p>
                        <p className="text-xs text-slate-400">{(r as any).employee?.employee_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-slate-600">{(r as any).leave_type?.name}</td>
                  <td className="text-sm text-slate-600">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</td>
                  <td className="font-semibold text-center">{r.days}</td>
                  <td className="text-sm text-slate-500 max-w-xs truncate">{r.reason ?? '—'}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    {r.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => updateStatus(r.id, 'approved')} className="btn-ghost btn-sm text-green-600 hover:bg-green-50 p-2"><CheckCircle size={16} /></button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} className="btn-ghost btn-sm text-red-600 hover:bg-red-50 p-2"><XCircle size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <NewLeaveModal onClose={() => setShowAdd(false)} onSaved={fetchRequests} />}
    </div>
  );
}

function NewLeaveModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [form, setForm] = useState({ employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  useEffect(() => {
    Promise.all([
      sb.from('employees').select('id,full_name').eq('status','active').order('full_name'),
      sb.from('leave_types').select('*'),
    ]).then(([e,l]) => { setEmployees(e.data ?? []); setLeaveTypes(l.data ?? []); });
  }, []);

  const days = form.start_date && form.end_date ? calcWorkingDays(form.start_date, form.end_date) : 0;

  async function save() {
    if (!form.employee_id || !form.leave_type_id || !form.start_date || !form.end_date) return;
    setSaving(true);
    await sb.from('leave_requests').insert({ ...form, days, status: 'pending' });
    setSaving(false); onSaved(); onClose();
  }

  return (
    <Modal title="New Leave Request" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Employee</label>
          <select className="form-select" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div><label className="form-label">Leave Type</label>
          <select className="form-select" value={form.leave_type_id} onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))}>
            <option value="">Select type</option>
            {leaveTypes.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Start Date</label><input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
          <div><label className="form-label">End Date</label><input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
        </div>
        {days > 0 && <p className="text-sm text-blue-600 font-semibold">{days} working day{days !== 1 ? 's' : ''}</p>}
        <div><label className="form-label">Reason</label><textarea className="form-input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
        <div className="flex gap-3">
          <button onClick={save} disabled={saving || !form.employee_id || !form.start_date} className="btn-primary flex-1">{saving ? 'Submitting…' : 'Submit Request'}</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
