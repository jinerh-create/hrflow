'use client';
import { useEffect, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { PerformanceReview, Employee } from '@/lib/types';
import { fmtDate } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Modal from '@/components/shared/Modal';

function Stars({ rating }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= (rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} />
      ))}
    </div>
  );
}

export default function PerformanceManager() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await sb.from('performance_reviews')
      .select('*, employee:employees(full_name,photo_url,employee_code), reviewer:employees!reviewer_id(full_name)')
      .order('created_at', { ascending: false });
    setReviews((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> New Review</button>
      </div>
      <div className="card p-0 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
          <table className="tbl">
            <thead><tr><th>Employee</th><th>Period</th><th>Rating</th><th>KPI Score</th><th>Reviewer</th><th>Date</th></tr></thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-400 py-12">No reviews yet</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={(r as any).employee?.full_name ?? '?'} photoUrl={(r as any).employee?.photo_url} size={32} />
                      <p className="font-semibold text-sm">{(r as any).employee?.full_name}</p>
                    </div>
                  </td>
                  <td className="text-sm font-medium">{r.period}</td>
                  <td><Stars rating={r.rating} /></td>
                  <td className="text-sm font-semibold">{r.kpi_score != null ? `${r.kpi_score}%` : '—'}</td>
                  <td className="text-sm text-slate-500">{(r as any).reviewer?.full_name ?? '—'}</td>
                  <td className="text-sm text-slate-500">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddReviewModal onClose={() => setShowAdd(false)} onSaved={fetchReviews} />}
    </div>
  );
}

function AddReviewModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ employee_id: '', reviewer_id: '', period: '', rating: '0', kpi_score: '', feedback: '', goals: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  useEffect(() => { sb.from('employees').select('id,full_name').eq('status','active').order('full_name').then(({ data }) => setEmployees(data ?? [])); }, []);

  async function save() {
    if (!form.employee_id || !form.period) return;
    setSaving(true);
    await sb.from('performance_reviews').insert({
      employee_id: form.employee_id, reviewer_id: form.reviewer_id || null,
      period: form.period, rating: Number(form.rating),
      kpi_score: form.kpi_score ? Number(form.kpi_score) : null,
      feedback: form.feedback, goals: form.goals,
    });
    setSaving(false); onSaved(); onClose();
  }

  return (
    <Modal title="New Performance Review" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Employee</label>
            <select className="form-select" value={form.employee_id} onChange={e => setForm(f=>({...f,employee_id:e.target.value}))}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Reviewer</label>
            <select className="form-select" value={form.reviewer_id} onChange={e => setForm(f=>({...f,reviewer_id:e.target.value}))}>
              <option value="">Select reviewer</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Period (e.g. 2024-Q1)</label><input className="form-input" value={form.period} onChange={e => setForm(f=>({...f,period:e.target.value}))} placeholder="2024-Q2" /></div>
          <div><label className="form-label">Rating (1–5)</label>
            <select className="form-select" value={form.rating} onChange={e => setForm(f=>({...f,rating:e.target.value}))}>
              {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'Not rated' : `${n} star${n>1?'s':''}`}</option>)}
            </select>
          </div>
          <div><label className="form-label">KPI Score (%)</label><input className="form-input" type="number" min="0" max="100" value={form.kpi_score} onChange={e => setForm(f=>({...f,kpi_score:e.target.value}))} /></div>
        </div>
        <div><label className="form-label">Feedback</label><textarea className="form-input" rows={3} value={form.feedback} onChange={e => setForm(f=>({...f,feedback:e.target.value}))} /></div>
        <div><label className="form-label">Goals for Next Period</label><textarea className="form-input" rows={2} value={form.goals} onChange={e => setForm(f=>({...f,goals:e.target.value}))} /></div>
        <div className="flex gap-3"><button onClick={save} disabled={saving} className="btn-primary flex-1">{saving?'Saving…':'Submit Review'}</button><button onClick={onClose} className="btn-secondary">Cancel</button></div>
      </div>
    </Modal>
  );
}
