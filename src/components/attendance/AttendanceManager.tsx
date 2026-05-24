'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Attendance, Employee } from '@/lib/types';
import { MONTHS } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';

export default function AttendanceManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const fetchData = async () => {
    setLoading(true);
    const [attRes, empRes] = await Promise.all([
      sb.from('attendance').select('*, employee:employees(full_name,photo_url,employee_code)').gte('date', `${monthStr}-01`).lte('date', `${monthStr}-31`).order('date', { ascending: false }),
      sb.from('employees').select('id,full_name,photo_url,employee_code').eq('status','active').order('full_name'),
    ]);
    setRecords((attRes.data ?? []) as any);
    setEmployees(empRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [year, month]);

  const summary = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    half_day: records.filter(r => r.status === 'half_day').length,
  };

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); }

  return (
    <div className="space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
          <span className="font-bold text-lg text-slate-800">{MONTHS[month-1]} {year}</span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight size={18} /></button>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Download size={15} /> Export</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Mark Attendance</button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-4 gap-4">
        {[['Present', summary.present, 'text-green-700 bg-green-50'],['Absent', summary.absent, 'text-red-700 bg-red-50'],['Late', summary.late, 'text-yellow-700 bg-yellow-50'],['Half Day', summary.half_day, 'text-blue-700 bg-blue-50']].map(([l,v,cls]) => (
          <div key={l as string} className={`card py-4 text-center ${cls as string}`}>
            <p className="text-2xl font-bold">{v as number}</p>
            <p className="text-sm font-semibold mt-0.5">{l as string}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Overtime</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-slate-400 py-12">No attendance records for {MONTHS[month-1]} {year}</td></tr>
              ) : records.map(r => (
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
                  <td className="text-sm text-slate-600">{r.date}</td>
                  <td className="text-sm text-slate-600 font-mono">{r.check_in ?? '—'}</td>
                  <td className="text-sm text-slate-600 font-mono">{r.check_out ?? '—'}</td>
                  <td className="text-sm text-slate-600">{r.overtime_hours > 0 ? `${r.overtime_hours}h` : '—'}</td>
                  <td><Badge status={r.status} /></td>
                  <td className="text-sm text-slate-500">{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <MarkAttendanceModal employees={employees} onClose={() => setShowAdd(false)} onSaved={fetchData} />}
    </div>
  );
}

function MarkAttendanceModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ employee_id: '', date: new Date().toISOString().slice(0,10), check_in: '09:00', check_out: '17:00', status: 'present', overtime_hours: '0', notes: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  async function save() {
    if (!form.employee_id) return;
    setSaving(true);
    await sb.from('attendance').upsert({ ...form, overtime_hours: Number(form.overtime_hours) }, { onConflict: 'employee_id,date' });
    setSaving(false); onSaved(); onClose();
  }

  return (
    <Modal title="Mark Attendance" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Employee</label>
          <select className="form-select" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div><label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>
          <div><label className="form-label">Check In</label><input className="form-input" type="time" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} /></div>
          <div><label className="form-label">Check Out</label><input className="form-input" type="time" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} /></div>
          <div><label className="form-label">Overtime (hrs)</label><input className="form-input" type="number" min="0" step="0.5" value={form.overtime_hours} onChange={e => setForm(f => ({ ...f, overtime_hours: e.target.value }))} /></div>
        </div>
        <div><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        <div className="flex gap-3">
          <button onClick={save} disabled={saving || !form.employee_id} className="btn-primary flex-1">{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
