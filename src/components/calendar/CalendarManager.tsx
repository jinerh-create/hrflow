'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Users, CalendarCheck, CalendarOff, Clock } from 'lucide-react';
import { MONTHS } from '@/lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Event {
  date: string;
  type: 'attendance' | 'leave';
  label: string;
  color: string;
}

export default function CalendarManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0, total: 0 });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => { fetchEvents(); }, [year, month]);

  async function fetchEvents() {
    const db = getSupabase();
    const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const last = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    const [att, lv] = await Promise.all([
      db.from('attendance').select('date, status, employee:employees(full_name)').gte('date', first).lte('date', last),
      db.from('leave_requests').select('start_date, end_date, status, employee:employees(full_name), leave_type:leave_types(name)')
        .eq('status', 'approved').lte('start_date', last).gte('end_date', first),
    ]);

    const evts: Event[] = [];

    (att.data ?? []).forEach((a: any) => {
      const color = a.status === 'present' ? 'bg-emerald-400' : a.status === 'late' ? 'bg-amber-400' : 'bg-red-400';
      evts.push({ date: a.date, type: 'attendance', label: `${a.employee?.full_name}: ${a.status}`, color });
    });

    (lv.data ?? []).forEach((l: any) => {
      const d = new Date(l.start_date);
      const end = new Date(l.end_date);
      while (d <= end) {
        evts.push({ date: d.toISOString().slice(0, 10), type: 'leave', label: `${l.employee?.full_name}: ${l.leave_type?.name}`, color: 'bg-blue-400' });
        d.setDate(d.getDate() + 1);
      }
    });

    setEvents(evts);

    const attData = att.data ?? [];
    setStats({
      present: attData.filter((a: any) => a.status === 'present').length,
      absent: attData.filter((a: any) => a.status === 'absent').length,
      leave: lv.data?.length ?? 0,
      total: attData.length,
    });
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function dayKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const selectedEvents = selectedDay ? events.filter(e => e.date === selectedDay) : [];

  return (
    <div className="flex gap-6">
      {/* Main calendar */}
      <div className="flex-1 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Records', value: stats.total, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Present', value: stats.present, icon: CalendarCheck, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Absent', value: stats.absent, icon: CalendarOff, bg: 'bg-red-50', color: 'text-red-600' },
            { label: 'On Leave', value: stats.leave, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-3 !p-4">
              <div className={cn('p-2.5 rounded-xl', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="card">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</h2>
              <p className="text-sm text-gray-400">Attendance & Leave Overview</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const key = dayKey(d);
              const dayEvts = events.filter(e => e.date === key);
              const isToday = key === new Date().toISOString().slice(0, 10);
              const isSel = key === selectedDay;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(isSel ? null : key)}
                  className={cn(
                    'relative min-h-[64px] p-1.5 rounded-xl border transition-all text-left',
                    isSel ? 'border-emerald-400 bg-emerald-50' :
                    isToday ? 'border-emerald-200 bg-emerald-50/50' :
                    'border-transparent hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                    isToday ? 'bg-emerald-500 text-white' : 'text-gray-700'
                  )}>{d}</span>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayEvts.slice(0, 3).map((e, idx) => (
                      <span key={idx} className={cn('w-1.5 h-1.5 rounded-full', e.color)} />
                    ))}
                    {dayEvts.length > 3 && <span className="text-[9px] text-gray-400">+{dayEvts.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            {[
              { color: 'bg-emerald-400', label: 'Present' },
              { color: 'bg-red-400', label: 'Absent' },
              { color: 'bg-amber-400', label: 'Late' },
              { color: 'bg-blue-400', label: 'On Leave' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={cn('w-3 h-3 rounded-full', l.color)} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 space-y-4">
        {/* Mini month info */}
        <div className="card !p-5">
          <h3 className="font-semibold text-gray-800 mb-3">
            {selectedDay ? `Events on ${selectedDay.slice(8)}` : 'Select a day'}
          </h3>
          {selectedDay && selectedEvents.length === 0 && (
            <p className="text-sm text-gray-400">No records for this day.</p>
          )}
          {selectedEvents.length > 0 && (
            <div className="space-y-2">
              {selectedEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', e.color)} />
                  <span className="text-gray-700 leading-snug">{e.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming leaves */}
        <div className="card !p-5">
          <h3 className="font-semibold text-gray-800 mb-3">This Month Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Attendance Rate', value: stats.total ? Math.round((stats.present / stats.total) * 100) + '%' : '—', color: 'text-emerald-600' },
              { label: 'Absent Days', value: stats.absent, color: 'text-red-600' },
              { label: 'Leave Approvals', value: stats.leave, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{s.label}</span>
                <span className={cn('text-sm font-bold', s.color)}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
