'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getSupabase } from '@/lib/supabase';
import { MONTHS, fmtMoney } from '@/lib/types';
import { Download } from 'lucide-react';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function ReportsManager() {
  const [deptData, setDeptData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [empStatus, setEmpStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      const [empRes, attRes, payRes] = await Promise.all([
        sb.from('employees').select('status, department:departments(name)'),
        sb.from('attendance').select('status').gte('date', `${currentYear}-01-01`).lte('date', `${currentYear}-12-31`),
        sb.from('payroll').select('month, net_salary').eq('year', currentYear),
      ]);

      // Dept distribution
      const deptMap: Record<string, number> = {};
      (empRes.data ?? []).forEach((e: any) => {
        const name = e.department?.name ?? 'Unassigned';
        deptMap[name] = (deptMap[name] ?? 0) + 1;
      });
      setDeptData(Object.entries(deptMap).map(([name, value]) => ({ name, value })));

      // Employee status pie
      const statusMap: Record<string, number> = {};
      (empRes.data ?? []).forEach((e: any) => { statusMap[e.status] = (statusMap[e.status] ?? 0) + 1; });
      setEmpStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Attendance summary by status
      const attMap: Record<string, number> = {};
      (attRes.data ?? []).forEach((a: any) => { attMap[a.status] = (attMap[a.status] ?? 0) + 1; });
      setAttendanceData(Object.entries(attMap).map(([name, value]) => ({ name, value })));

      // Monthly payroll
      const payMap: Record<number, number> = {};
      (payRes.data ?? []).forEach((p: any) => { payMap[p.month] = (payMap[p.month] ?? 0) + p.net_salary; });
      setPayrollData(MONTHS.map((m, i) => ({ month: m, amount: payMap[i+1] ?? 0 })));

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-16 text-slate-400">Loading reports…</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button className="btn-secondary"><Download size={15} /> Export PDF</button>
        <button className="btn-secondary"><Download size={15} /> Export Excel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly payroll trend */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Monthly Payroll {currentYear}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={payrollData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmtMoney(v)} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department distribution */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Employees by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`} labelLine={false}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance summary */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Attendance Summary {currentYear}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="value" radius={[0,4,4,0]}>
                {attendanceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee status */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Employee Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={empStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {empStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
