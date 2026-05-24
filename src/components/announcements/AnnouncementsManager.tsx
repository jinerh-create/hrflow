'use client';
import { useEffect, useState } from 'react';
import { Plus, Pin, Trash2, Megaphone } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/types';
import { fmtDate } from '@/lib/types';
import Modal from '@/components/shared/Modal';

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await sb.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    setAnnouncements((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return;
    await sb.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }

  async function togglePin(a: Announcement) {
    await sb.from('announcements').update({ is_pinned: !a.is_pinned }).eq('id', a.id);
    fetchAnnouncements();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> New Announcement</button>
      </div>
      {loading ? <div className="text-center py-12 text-slate-400">Loading…</div> : announcements.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`card flex gap-4 ${a.is_pinned ? 'border-l-4 border-l-yellow-400' : ''}`}>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="font-bold text-slate-800">{a.title}</h3>
                  {a.is_pinned && <span className="badge bg-yellow-100 text-yellow-700 text-xs">Pinned</span>}
                </div>
                <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-line">{a.content}</p>
                <p className="text-xs text-slate-400 mt-2">{fmtDate(a.created_at)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => togglePin(a)} className={`btn-ghost btn-sm p-2 ${a.is_pinned ? 'text-yellow-500' : ''}`}><Pin size={15} /></button>
                <button onClick={() => deleteAnnouncement(a.id)} className="btn-ghost btn-sm p-2 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddAnnouncementModal onClose={() => setShowAdd(false)} onSaved={fetchAnnouncements} />}
    </div>
  );
}

function AddAnnouncementModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', content: '', is_pinned: false });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();
  async function save() {
    if (!form.title || !form.content) return;
    setSaving(true);
    await sb.from('announcements').insert(form);
    setSaving(false); onSaved(); onClose();
  }
  return (
    <Modal title="New Announcement" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} /></div>
        <div><label className="form-label">Content</label><textarea className="form-input" rows={5} value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))} /></div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f=>({...f,is_pinned:e.target.checked}))} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-slate-700">Pin this announcement</span>
        </label>
        <div className="flex gap-3"><button onClick={save} disabled={saving || !form.title} className="btn-primary flex-1">{saving?'Posting…':'Post Announcement'}</button><button onClick={onClose} className="btn-secondary">Cancel</button></div>
      </div>
    </Modal>
  );
}
