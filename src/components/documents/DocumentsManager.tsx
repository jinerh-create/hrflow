'use client';
import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, FileText } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Document, Employee } from '@/lib/types';
import { fmtDate, daysUntilExpiry } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import { cn } from '@/lib/utils';

const DOC_TYPES = ['contract','id_card','passport','work_permit','visa','certificate','warning','salary_letter','other'];

export default function DocumentsManager() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetchDocs = async () => {
    setLoading(true);
    let q = sb.from('documents').select('*, employee:employees(full_name,photo_url,employee_code)').order('created_at', { ascending: false });
    if (typeFilter !== 'all') q = q.eq('type', typeFilter);
    const { data } = await q;
    setDocs((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [typeFilter]);

  const filtered = search ? docs.filter(d => (d as any).employee?.full_name?.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase())) : docs;

  const expiringSoon = docs.filter(d => { const days = daysUntilExpiry(d.expiry_date); return days !== null && days <= 30 && days >= 0; });

  return (
    <div className="space-y-5">
      {expiringSoon.length > 0 && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
          <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-semibold text-orange-800 text-sm">{expiringSoon.length} document{expiringSoon.length>1?'s':''} expiring within 30 days</p>
            <p className="text-orange-600 text-xs mt-0.5">{expiringSoon.map(d => `${(d as any).employee?.full_name} – ${d.name}`).join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee or document name…" className="form-input flex-1" />
        <select className="form-select w-40" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Add Document</button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : (
          <table className="tbl">
            <thead>
              <tr><th>Employee</th><th>Document</th><th>Type</th><th>Issue Date</th><th>Expiry Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-400 py-12">No documents found</td></tr>
              ) : filtered.map(doc => {
                const days = daysUntilExpiry(doc.expiry_date);
                const expStatus = days === null ? null : days < 0 ? 'expired' : days <= 30 ? 'expiring' : 'valid';
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={(doc as any).employee?.full_name ?? '?'} photoUrl={(doc as any).employee?.photo_url} size={32} />
                        <p className="font-semibold text-sm">{(doc as any).employee?.full_name}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-slate-400" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-slate-100 text-slate-600 capitalize">{doc.type.replace(/_/g,' ')}</span></td>
                    <td className="text-sm text-slate-600">{fmtDate(doc.issue_date)}</td>
                    <td className="text-sm text-slate-600">
                      {doc.expiry_date ? (
                        <span className={cn(expStatus === 'expired' ? 'text-red-600 font-semibold' : expStatus === 'expiring' ? 'text-orange-600 font-semibold' : '')}>
                          {fmtDate(doc.expiry_date)}
                          {days !== null && days <= 30 && <span className="ml-1 text-xs">({days < 0 ? 'Expired' : `${days}d`})</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {expStatus === 'expired' ? <Badge status="rejected" label="Expired" /> :
                       expStatus === 'expiring' ? <Badge status="pending" label="Expiring" /> :
                       expStatus === 'valid' ? <Badge status="active" label="Valid" /> : <span className="text-slate-400 text-xs">No Expiry</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddDocModal onClose={() => setShowAdd(false)} onSaved={fetchDocs} />}
    </div>
  );
}

function AddDocModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ employee_id: '', type: 'contract', name: '', issue_date: '', expiry_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  useEffect(() => { sb.from('employees').select('id,full_name').eq('status','active').order('full_name').then(({ data }) => setEmployees(data ?? [])); }, []);

  async function save() {
    if (!form.employee_id || !form.name) return;
    setSaving(true);
    await sb.from('documents').insert(form);
    setSaving(false); onSaved(); onClose();
  }

  return (
    <Modal title="Add Document" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Employee</label>
          <select className="form-select" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Employment Contract 2024" /></div>
          <div><label className="form-label">Issue Date</label><input className="form-input" type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
          <div><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
        </div>
        <div><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        <div className="flex gap-3">
          <button onClick={save} disabled={saving || !form.employee_id || !form.name} className="btn-primary flex-1">{saving ? 'Saving…' : 'Add Document'}</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
