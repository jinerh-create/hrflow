'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { fmtDate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, User, Send } from 'lucide-react';

interface LeaveItem {
  id: string;
  employee: { full_name: string; employee_code: string; department?: { name: string } };
  leave_type: { name: string };
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}

export default function InboxManager() {
  const [tab, setTab] = useState<'leave' | 'announcements'>('leave');
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selected, setSelected] = useState<LeaveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const db = getSupabase();
    const [lv, an] = await Promise.all([
      db.from('leave_requests').select(`
        id, start_date, end_date, days, reason, status, created_at,
        employee:employees(full_name, employee_code, department:departments(name)),
        leave_type:leave_types(name)
      `).order('created_at', { ascending: false }),
      db.from('announcements').select('*').order('created_at', { ascending: false }),
    ]);
    setLeaves((lv.data ?? []) as LeaveItem[]);
    setAnnouncements(an.data ?? []);
    if (lv.data?.length) setSelected(lv.data[0] as LeaveItem);
    setLoading(false);
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await getSupabase().from('leave_requests').update({ status, comments: comment }).eq('id', id);
    setComment('');
    fetchAll();
  }

  const statusColor = (s: string) => ({
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  }[s] ?? 'bg-gray-100 text-gray-600');

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left panel */}
      <div className="w-80 flex flex-col gap-3">
        {/* Tabs */}
        <div className="card !p-1.5 flex gap-1">
          {(['leave', 'announcements'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn(
              'flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all',
              tab === t ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'
            )}>
              {t === 'leave' ? 'Leave Requests' : 'Announcements'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {tab === 'leave' ? leaves.map(lv => (
            <button key={lv.id} onClick={() => setSelected(lv)} className={cn(
              'w-full text-left card !p-4 transition-all hover:shadow-md',
              selected?.id === lv.id ? 'ring-2 ring-emerald-400' : ''
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                    {lv.employee?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{lv.employee?.full_name}</p>
                    <p className="text-xs text-gray-400">{lv.leave_type?.name}</p>
                  </div>
                </div>
                <span className={cn('badge text-[10px]', statusColor(lv.status))}>{lv.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{fmtDate(lv.start_date)} → {fmtDate(lv.end_date)} · {lv.days}d</p>
            </button>
          )) : announcements.map(a => (
            <div key={a.id} className="card !p-4">
              <div className="flex items-start gap-2">
                {a.is_pinned && <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">Pinned</span>}
              </div>
              <p className="text-sm font-semibold text-gray-800 mt-1">{a.title}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
              <p className="text-[11px] text-gray-400 mt-2">{fmtDate(a.created_at)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — leave detail */}
      {tab === 'leave' && selected && (
        <div className="flex-1 card flex flex-col">
          <div className="flex items-start justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold">
                {selected.employee?.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selected.employee?.full_name}</p>
                <p className="text-sm text-gray-500">{selected.employee?.employee_code} · {selected.employee?.department?.name}</p>
              </div>
            </div>
            <span className={cn('badge', statusColor(selected.status))}>{selected.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Leave Type</p>
              <p className="text-sm font-semibold">{selected.leave_type?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="text-sm font-semibold">{selected.days} day{selected.days !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Start Date</p>
              <p className="text-sm font-semibold">{fmtDate(selected.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">End Date</p>
              <p className="text-sm font-semibold">{fmtDate(selected.end_date)}</p>
            </div>
          </div>

          {selected.reason && (
            <div className="py-4 border-b border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Reason</p>
              <p className="text-sm text-gray-700">{selected.reason}</p>
            </div>
          )}

          {selected.status === 'pending' && (
            <div className="mt-auto pt-4">
              <p className="text-xs text-gray-400 mb-2">Comments (optional)</p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                className="form-input mb-3"
                placeholder="Add a comment..."
              />
              <div className="flex gap-3">
                <button onClick={() => updateStatus(selected.id, 'approved')} className="btn-primary flex-1">
                  <CheckCircle size={16} /> Approve
                </button>
                <button onClick={() => updateStatus(selected.id, 'rejected')} className="btn-danger flex-1">
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          )}

          {selected.status !== 'pending' && (
            <div className="mt-auto pt-4 text-center text-sm text-gray-400">
              <Clock size={16} className="inline mr-1" />
              This request has been {selected.status}.
            </div>
          )}
        </div>
      )}

      {tab === 'announcements' && (
        <div className="flex-1 card flex flex-col gap-4">
          <h2 className="font-bold text-gray-800">New Announcement</h2>
          <div>
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="Announcement title..." />
          </div>
          <div>
            <label className="form-label">Content</label>
            <textarea className="form-input" rows={5} placeholder="Write your announcement..." />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" className="rounded" /> Pin this announcement
          </label>
          <button className="btn-primary self-start">
            <Send size={16} /> Publish
          </button>
        </div>
      )}
    </div>
  );
}
