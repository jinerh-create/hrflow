'use client';
import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock, CalendarOff, Banknote, Briefcase, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import { getSupabase } from '@/lib/supabase';
import { fmtDate, fmtMoney } from '@/lib/types';
import type { Employee, LeaveRequest, Announcement } from '@/lib/types';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import Link from 'next/link';

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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalEmployees:0, presentToday:0, absentToday:0, lateToday:0, pendingLeaves:0, monthlyPayroll:0, openJobs:0, expiringDocs:0 });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [upcoming, setUpcoming] = useState<Employee[]>([]);
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
        sb.from('leave_requests').select('id, status, employee_id, leave_type_id, start_date, end_date, days, reason, created_at, employee:employees(full_name,photo_url), leave_type:leave_types(name)').eq('status','pending').order('created_at', { ascending: false }).limit(5),
        sb.from('payroll').select('net_salary').eq('year', new Date().getFullYear()).eq('month', new Date().getMonth()+1),
        sb.from('job_postings').select('id').eq('status','open'),
        sb.from('documents').select('id').gte('expiry_date', today).lte('expiry_date', in30),
        sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
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

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} color="text-blue-600" iconBg="bg-blue-50" />
        <StatCard label="Present Today" value={stats.presentToday} icon={UserCheck} color="text-green-600" iconBg="bg-green-50" />
        <StatCard label="Absent Today" value={stats.absentToday} icon={UserX} color="text-red-600" iconBg="bg-red-50" />
        <StatCard label="Late Today" value={stats.lateToday} icon={Clock} color="text-yellow-600" iconBg="bg-yellow-50" />
        <StatCard label="Pending Leaves" value={stats.pendingLeaves} icon={CalendarOff} color="text-purple-600" iconBg="bg-purple-50" />
        <StatCard label="Monthly Payroll" value={fmtMoney(stats.monthlyPayroll)} icon={Banknote} color="text-indigo-600" iconBg="bg-indigo-50" />
        <StatCard label="Open Positions" value={stats.openJobs} icon={Briefcase} color="text-cyan-600" iconBg="bg-cyan-50" />
        <StatCard label="Docs Expiring (30d)" value={stats.expiringDocs} icon={AlertTriangle} color="text-orange-600" iconBg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending leave requests */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800">Pending Leave Requests</h2>
            <Link href="/leave" className="text-sm text-blue-600 font-medium hover:underline">View all →</Link>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map(lr => (
                <div key={lr.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <Avatar name={(lr as any).employee?.full_name ?? '?'} photoUrl={(lr as any).employee?.photo_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800">{(lr as any).employee?.full_name}</p>
                    <p className="text-xs text-slate-500">{(lr as any).leave_type?.name} · {fmtDate(lr.start_date)} – {fmtDate(lr.end_date)} ({lr.days}d)</p>
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
            <h2 className="font-bold text-slate-800">Announcements</h2>
            <Link href="/announcements" className="text-sm text-blue-600 font-medium hover:underline">All →</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No announcements</p>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-sm text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmtDate(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
