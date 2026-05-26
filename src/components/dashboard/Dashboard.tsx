'use client';
import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, CalendarOff, Banknote, Briefcase, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { fmtDate, fmtMoney } from '@/lib/types';
import type { LeaveRequest, Announcement } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Stats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingLeaves: number;
  monthlyPayroll: number;
  openJobs: number;
  expiringDocs: number;
}

const STAT_CARDS = (s: Stats) => [
  { label: 'Total Employees', value: s.totalEmployees, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600', trend: '+2%' },
  { label: 'Present Today', value: s.presentToday, icon: UserCheck, bg: 'bg-teal-50', color: 'text-teal-600', trend: null },
  { label: 'Absent Today', value: s.absentToday, icon: UserX, bg: 'bg-red-50', color: 'text-red-500', trend: null },
  { label: 'Late Today', value: s.lateToday, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', trend: null },
  { label: 'Pending Leaves', value: s.pendingLeaves, icon: CalendarOff, bg: 'bg-purple-50', color: 'text-purple-600', trend: null },
  { label: 'Monthly Payroll', value: fmtMoney(s.monthlyPayroll), icon: Banknote, bg: 'bg-indigo-50', color: 'text-indigo-600', trend: null },
  { label: 'Open Positions', value: s.openJobs, icon: Briefcase, bg: 'bg-cyan-50', color: 'text-cyan-600', trend: null },
  { label: 'Docs Expiring', value: s.expiringDocs, icon: AlertTriangle, bg: 'bg-orange-50', color: 'text-orange-600', trend: null },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalEmployees:0, presentToday:0, absentToday:0, lateToday:0, pendingLeaves:0, monthlyPayroll:0, openJobs:0, expiringDocs:0 });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      const [empRes, attRes, leaveRes, payRes, jobRes, docRes, annRes] = await Promise.all([
        sb.from('employees').select('id, status'),
        sb.from('attendance').select('status').eq('date', today),
        sb.from('leave_requests').select('id, status, employee_id, leave_type_id, start_date, end_date, days, reason, created_at, employee:employees(full_name,photo_url), leave_type:leave_types(name)').eq('status','pending').order('created_at', { ascending: false }).limit(6),
        sb.from('payroll').select('net_salary').eq('year', new Date().getFullYear()).eq('month', new Date().getMonth()+1),
        sb.from('job_postings').select('id').eq('status','open'),
        sb.from('documents').select('id').gte('expiry_date', today).lte('expiry_date', in30),
        sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(4),
      ]);

      const active = (empRes.data ?? []).filter(e => e.status === 'active').length;
      const att = attRes.data ?? [];
      const payTotal = (payRes.data ?? []).reduce((s, p) => s + p.net_salary, 0);

      setStats({
        totalEmployees: active,
        presentToday: att.filter(a => a.status === 'present').length,
        absentToday: att.filter(a => a.status === 'absent').length,
        lateToday: att.filter(a => a.status === 'late').length,
        pendingLeaves: (leaveRes.data ?? []).length,
        monthlyPayroll: payTotal,
        openJobs: (jobRes.data ?? []).length,
        expiringDocs: (docRes.data ?? []).length,
      });
      setRecentLeaves((leaveRes.data ?? []) as any);
      setAnnouncements((annRes.data ?? []) as any);
      setLoading(false);
    }
    load();
  }, []);

  const cards = STAT_CARDS(stats);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 flex items-center justify-between text-white shadow-lg" style={{ background: '#0DC9A0', boxShadow: '0 8px 24px rgba(13,201,160,0.25)' }}>
        <div>
          <h1 className="text-xl font-bold">Welcome back! 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>Here's what's happening in your organization today.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/employees" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-sm font-semibold px-4 py-2 rounded-xl">
            <Users size={16} /> Manage Employees
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card !p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{c.label}</p>
                <p className={cn('text-2xl font-bold mt-1.5', c.color)}>{c.value}</p>
                {c.trend && (
                  <p className="flex items-center gap-1 text-xs mt-1 font-medium" style={{ color: '#0DC9A0' }}>
                    <ArrowUpRight size={12} />{c.trend} this month
                  </p>
                )}
              </div>
              <div className={cn('p-2.5 rounded-xl', c.bg)}>
                <c.icon className={cn('w-5 h-5', c.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending leave requests */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800">Pending Leave Requests</h2>
              <p className="text-xs text-gray-400 mt-0.5">Needs your approval</p>
            </div>
            <Link href="/leave" className="flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#0DC9A0' }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <CalendarOff size={32} className="mb-2 text-gray-300" />
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentLeaves.map(lr => (
                <div key={lr.id} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors">
                  <Avatar name={(lr as any).employee?.full_name ?? '?'} photoUrl={(lr as any).employee?.photo_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{(lr as any).employee?.full_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(lr as any).leave_type?.name} · {fmtDate(lr.start_date)} – {fmtDate(lr.end_date)} · {lr.days}d</p>
                  </div>
                  <Badge status="pending" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-800">Announcements</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest updates</p>
            </div>
            <Link href="/announcements" className="text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#0DC9A0' }}>
              All →
            </Link>
          </div>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <p className="text-sm">No announcements</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((a, i) => (
                <div key={a.id} className="p-3 rounded-xl" style={i === 0 ? { background: '#EDFDF9', border: '1px solid rgba(13,201,160,0.2)' } : { background: '#F9FAFB' }}>
                  {a.is_pinned && <span className="badge text-[10px] mb-1" style={{ background: 'rgba(13,201,160,0.15)', color: '#0AA88A' }}>Pinned</span>}
                  <p className="font-semibold text-sm text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{fmtDate(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Employee', href: '/employees', icon: Users, color: 'bg-blue-50 text-blue-600' },
            { label: 'Record Attendance', href: '/attendance', icon: UserCheck, color: 'bg-teal-50 text-teal-600' },
            { label: 'Review Leaves', href: '/leave', icon: CalendarOff, color: 'bg-purple-50 text-purple-600' },
            { label: 'Run Payroll', href: '/payroll', icon: Banknote, color: 'bg-indigo-50 text-indigo-600' },
          ].map(q => (
            <Link key={q.label} href={q.href} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className={cn('p-2 rounded-lg', q.color)}>
                <q.icon size={18} />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
