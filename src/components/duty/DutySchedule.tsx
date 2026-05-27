'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Sun, Sunset, Moon, Coffee } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import Modal from '@/components/shared/Modal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SHIFTS = {
  morning:   { label: 'Morning',   time: '06:00 – 14:00', color: '#F59E0B', bg: '#FEF9C3', icon: Sun },
  afternoon: { label: 'Afternoon', time: '14:00 – 22:00', color: '#6366F1', bg: '#EEF2FF', icon: Sunset },
  evening:   { label: 'Evening',   time: '18:00 – 02:00', color: '#8B5CF6', bg: '#F5F3FF', icon: Moon },
  night:     { label: 'Night',     time: '22:00 – 06:00', color: '#0EA5E9', bg: '#E0F2FE', icon: Moon },
  off:       { label: 'Day Off',   time: '—',             color: '#94A3B8', bg: '#F1F5F9', icon: Coffee },
};

type Shift = keyof typeof SHIFTS;

interface DutyRow {
  id: string;
  employee_id: string;
  date: string;
  shift: Shift;
  start_time?: string;
  end_time?: string;
  notes?: string;
  employee?: { full_name: string };
}

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay();
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const avatarColors = ['#6366F1', '#0DC9A0', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const avatarBg = (name: string) => avatarColors[(name?.charCodeAt(0) ?? 0) % avatarColors.length];
const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

export default function DutySchedule() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [schedules, setSchedules] = useState<DutyRow[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const sb = getSupabase();

  const weekDates = getWeekDates(baseDate);
  const weekStart = fmtDate(weekDates[0]);
  const weekEnd   = fmtDate(weekDates[6]);

  useEffect(() => { loadData(); }, [weekStart]);

  async function loadData() {
    setLoading(true);
    try {
      const [schRes, empRes] = await Promise.all([
        sb.from('duty_schedules').select('*, employee:employees(full_name)').gte('date', weekStart).lte('date', weekEnd),
        sb.from('employees').select('id,full_name').eq('status', 'active').order('full_name'),
      ]);
      setSchedules((schRes.data ?? []) as DutyRow[]);
      setEmployees(empRes.data ?? []);
    } catch { setSchedules([]); setEmployees([]); }
    finally { setLoading(false); }
  }

  function prevWeek() { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); }
  function nextWeek() { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); }

  const today = fmtDate(new Date());

  const shiftCounts = Object.keys(SHIFTS).reduce((acc, k) => {
    acc[k] = schedules.filter(s => s.shift === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={{ padding: 8, borderRadius: 9, border: '1.5px solid #E8EDF5', background: 'white', cursor: 'pointer', display: 'flex', color: '#64748B' }}>
            <ChevronLeft size={17} />
          </button>
          <div style={{ padding: '8px 18px', background: 'white', borderRadius: 11, border: '1.5px solid #E8EDF5', textAlign: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button onClick={nextWeek} style={{ padding: 8, borderRadius: 9, border: '1.5px solid #E8EDF5', background: 'white', cursor: 'pointer', display: 'flex', color: '#64748B' }}>
            <ChevronRight size={17} />
          </button>
          <button onClick={() => setBaseDate(new Date())} style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #E8EDF5', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0DC9A0', fontFamily: 'inherit' }}>
            Today
          </button>
        </div>
        <button onClick={() => { setSelectedDate(today); setShowModal(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 11,
          background: 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 3px 12px rgba(13,201,160,0.35)',
        }}>
          <Plus size={16} /> Assign Shift
        </button>
      </div>

      {/* Shift summary chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(Object.entries(SHIFTS) as [Shift, typeof SHIFTS[Shift]][]).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: s.bg, border: `1px solid ${s.color}22` }}>
            <s.icon size={14} color={s.color} />
            <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: s.color, background: 'white', padding: '1px 7px', borderRadius: 99 }}>{shiftCounts[key] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8EDF5', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', borderBottom: '2px solid #E8EDF5' }}>
          <div style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</div>
          {weekDates.map((d, i) => {
            const key = fmtDate(d);
            const isToday = key === today;
            const isFriSat = i === 5 || i === 6;
            return (
              <div key={key} style={{ padding: '12px 8px', textAlign: 'center', background: isToday ? '#E6FAF5' : 'transparent', borderLeft: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isFriSat ? '#EF4444' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{SHORT_DAYS[i]}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isToday ? '#0DC9A0' : isFriSat ? '#EF4444' : '#0F172A', marginTop: 2 }}>{d.getDate()}</div>
                <button
                  onClick={() => { setSelectedDate(key); setShowModal(true); }}
                  style={{ marginTop: 6, padding: '3px 8px', borderRadius: 6, border: '1px dashed #CBD5E1', background: 'none', cursor: 'pointer', fontSize: 11, color: '#94A3B8', fontFamily: 'inherit' }}
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>

        {/* Employee rows */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Loading schedule…</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No active employees found.</div>
        ) : (
          employees.map((emp, idx) => {
            const empSchedules = schedules.filter(s => s.employee_id === emp.id);
            return (
              <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr)', borderBottom: idx < employees.length - 1 ? '1px solid #F1F5F9' : 'none', minHeight: 64 }}>
                {/* Employee name */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(emp.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {initials(emp.full_name)}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name}</span>
                </div>
                {/* Day cells */}
                {weekDates.map((d, i) => {
                  const key = fmtDate(d);
                  const entry = empSchedules.find(s => s.date === key);
                  const isFriSat = i === 5 || i === 6;
                  const isToday = key === today;
                  const shift = entry ? SHIFTS[entry.shift] : null;
                  return (
                    <div
                      key={key}
                      onClick={() => { setSelectedDate(key); setShowModal(true); }}
                      style={{
                        borderLeft: '1px solid #F1F5F9',
                        background: isToday ? '#F0FDF4' : isFriSat ? '#FFF5F5' : 'transparent',
                        padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      {shift ? (
                        <div style={{ textAlign: 'center', padding: '4px 8px', borderRadius: 8, background: shift.bg, width: '100%' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: shift.color }}>{shift.label}</div>
                          <div style={{ fontSize: 9, color: shift.color, opacity: 0.8, marginTop: 1 }}>{shift.time}</div>
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: 36, borderRadius: 8, border: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 16, color: '#CBD5E1' }}>+</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <Modal title="Assign Shift" onClose={() => setShowModal(false)} size="sm">
          <AssignShiftForm
            date={selectedDate}
            employees={employees}
            onSaved={() => { setShowModal(false); loadData(); }}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function AssignShiftForm({ date, employees, onSaved, onCancel }: {
  date: string; employees: any[];
  onSaved: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ employee_id: '', shift: 'morning' as Shift, notes: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #E2E8F0', borderRadius: 9, background: 'white', outline: 'none', fontFamily: 'inherit', color: '#0F172A' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' };

  async function save() {
    if (!form.employee_id) return;
    setSaving(true);
    try {
      await sb.from('duty_schedules').upsert(
        { employee_id: form.employee_id, date, shift: form.shift, notes: form.notes },
        { onConflict: 'employee_id,date' }
      );
      onSaved();
    } catch { setSaving(false); }
  }

  const s = SHIFTS[form.shift];

  return (
    <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E8EDF5', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
        📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      <div>
        <label style={labelStyle}>Employee</label>
        <select style={inputStyle} value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
          <option value="">Select employee…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Shift</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(Object.entries(SHIFTS) as [Shift, typeof SHIFTS[Shift]][]).map(([key, sh]) => (
            <button
              key={key}
              onClick={() => setForm(f => ({ ...f, shift: key }))}
              style={{
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `2px solid ${form.shift === key ? sh.color : '#E2E8F0'}`,
                background: form.shift === key ? sh.bg : 'white',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: sh.color }}>{sh.label}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{sh.time}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <input style={inputStyle} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions…" />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving || !form.employee_id} style={{
          flex: 1, padding: '11px 0', borderRadius: 10,
          background: saving || !form.employee_id ? '#94A3B8' : 'linear-gradient(135deg, #0DC9A0 0%, #0994A0 100%)',
          color: 'white', fontSize: 14, fontWeight: 600,
          border: 'none', cursor: saving || !form.employee_id ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {saving ? 'Saving…' : 'Assign Shift'}
        </button>
        <button onClick={onCancel} style={{ padding: '11px 20px', borderRadius: 10, background: '#F1F5F9', color: '#475569', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
