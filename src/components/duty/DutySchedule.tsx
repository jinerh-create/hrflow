'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import Modal from '@/components/shared/Modal';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SHIFT_COLORS: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  morning:   { bg: '#EEF2FF', border: '#6366F1', label: '#4F46E5', dot: '#F59E0B' },
  afternoon: { bg: '#E6FAF5', border: '#0DC9A0', label: '#0994A0', dot: '#0DC9A0' },
  evening:   { bg: '#F5F3FF', border: '#8B5CF6', label: '#7C3AED', dot: '#8B5CF6' },
  night:     { bg: '#E0F2FE', border: '#0EA5E9', label: '#0369A1', dot: '#0EA5E9' },
  off:       { bg: '#F1F5F9', border: '#CBD5E1', label: '#64748B', dot: '#94A3B8' },
};

const SHIFT_TIMES: Record<string, string> = {
  morning:   '6:00 am - 2:00 pm',
  afternoon: '2:00 pm - 10:00 pm',
  evening:   '6:00 pm - 2:00 am',
  night:     '10:00 pm - 6:00 am',
  off:       'Day off',
};

interface DutyRow {
  id: string;
  employee_id: string;
  date: string;
  shift: string;
  notes?: string;
}

function getWeekDates(base: Date) {
  const day = base.getDay();
  const start = new Date(base);
  start.setDate(base.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const AVATAR_COLORS = ['#6366F1','#0DC9A0','#F59E0B','#EF4444','#8B5CF6','#EC4899','#0EA5E9','#14B8A6'];
const avatarBg = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
const initials  = (name: string) => name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() ?? '?';

export default function DutySchedule() {
  const [baseDate, setBaseDate]     = useState(new Date());
  const [schedules, setSchedules]   = useState<DutyRow[]>([]);
  const [employees, setEmployees]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [clickDate, setClickDate]   = useState('');
  const [clickEmp, setClickEmp]     = useState('');
  const sb = getSupabase();

  const weekDates = getWeekDates(baseDate);
  const weekStart = fmtDate(weekDates[0]);
  const weekEnd   = fmtDate(weekDates[6]);
  const today     = fmtDate(new Date());

  useEffect(() => { loadData(); }, [weekStart]);

  async function loadData() {
    setLoading(true);
    try {
      const [schRes, empRes] = await Promise.all([
        sb.from('duty_schedules').select('*').gte('date', weekStart).lte('date', weekEnd),
        sb.from('employees').select('id,full_name').eq('status','active').order('full_name'),
      ]);
      setSchedules((schRes.data ?? []) as DutyRow[]);
      setEmployees(empRes.data ?? []);
    } catch {
      setSchedules([]); setEmployees([]);
    } finally { setLoading(false); }
  }

  function prevWeek() { const d = new Date(baseDate); d.setDate(d.getDate()-7); setBaseDate(d); }
  function nextWeek() { const d = new Date(baseDate); d.setDate(d.getDate()+7); setBaseDate(d); }
  function goToday()  { setBaseDate(new Date()); }

  function openModal(date: string, empId = '') {
    setClickDate(date); setClickEmp(empId); setShowModal(true);
  }

  const COL = 'repeat(7, 1fr)';
  const GRID = `160px ${COL}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:"'Inter', system-ui, sans-serif" }}>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Month / Week / Day tabs */}
          <div style={{ display:'flex', background:'white', border:'1.5px solid #E8EDF5', borderRadius:10, overflow:'hidden' }}>
            {['Month','Week','Day'].map((t,i) => (
              <button key={t} style={{ padding:'8px 16px', fontSize:13, fontWeight: t==='Week' ? 700 : 500, color: t==='Week' ? 'white' : '#64748B', background: t==='Week' ? '#6366F1' : 'white', border:'none', cursor:'pointer', fontFamily:'inherit' }}>{t}</button>
            ))}
          </div>

          <button onClick={prevWeek} style={{ padding:8, borderRadius:9, border:'1.5px solid #E8EDF5', background:'white', cursor:'pointer', display:'flex', color:'#64748B' }}><ChevronLeft size={17}/></button>
          <button onClick={nextWeek} style={{ padding:8, borderRadius:9, border:'1.5px solid #E8EDF5', background:'white', cursor:'pointer', display:'flex', color:'#64748B' }}><ChevronRight size={17}/></button>

          <div style={{ padding:'8px 14px', background:'white', border:'1.5px solid #E8EDF5', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
            <Calendar size={14} color="#94A3B8"/>
            <span style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>
              {weekDates[0].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} – {weekDates[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
            </span>
          </div>

          <button onClick={goToday} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #E8EDF5', background:'white', fontSize:13, fontWeight:600, color:'#0F172A', cursor:'pointer', fontFamily:'inherit' }}>Today</button>
        </div>

        <button onClick={() => openModal(today)} style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'10px 20px', borderRadius:11,
          background:'linear-gradient(135deg,#0DC9A0 0%,#0994A0 100%)',
          color:'white', fontSize:14, fontWeight:600,
          border:'none', cursor:'pointer', fontFamily:'inherit',
          boxShadow:'0 3px 12px rgba(13,201,160,0.35)',
        }}>
          <Plus size={16}/> Assign Shift
        </button>
      </div>

      {/* Schedule grid */}
      <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EDF5', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Day header row */}
        <div style={{ display:'grid', gridTemplateColumns:GRID, borderBottom:'2px solid #E8EDF5', position:'sticky', top:0, zIndex:5, background:'white' }}>
          <div style={{ padding:'16px', borderRight:'1px solid #F1F5F9' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Member</span>
          </div>
          {weekDates.map((d, i) => {
            const key     = fmtDate(d);
            const isToday = key === today;
            const isFri   = i === 5;
            const isSat   = i === 6;
            const isWeekend = isFri || isSat;
            return (
              <div key={key} style={{
                padding:'12px 10px', textAlign:'center',
                background: isToday ? '#E6FAF5' : isWeekend ? '#FFF5F5' : 'white',
                borderLeft:'1px solid #F1F5F9',
              }}>
                <div style={{ fontSize:11, fontWeight:700, color: isWeekend ? '#EF4444' : '#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>{SHORT_DAYS[i]}</div>
                <div style={{ fontSize:26, fontWeight:900, color: isToday ? '#0DC9A0' : isWeekend ? '#EF4444' : '#0F172A', lineHeight:1.1, marginTop:2 }}>{d.getDate()}</div>
                <div style={{ fontSize:11, color:'#94A3B8', marginTop:1 }}>{MONTHS_SHORT[d.getMonth()]}</div>
              </div>
            );
          })}
        </div>

        {/* Employee rows */}
        {loading ? (
          <div style={{ padding:'50px', textAlign:'center' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #E6FAF5', borderTopColor:'#0DC9A0', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
            <p style={{ color:'#94A3B8', fontSize:14 }}>Loading schedule…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding:'50px', textAlign:'center', color:'#94A3B8', fontSize:14 }}>No active employees found. Add employees first.</div>
        ) : employees.map((emp, idx) => {
          const empSch = schedules.filter(s => s.employee_id === emp.id);
          const isLast = idx === employees.length - 1;
          return (
            <div key={emp.id} style={{ display:'grid', gridTemplateColumns:GRID, borderBottom: isLast ? 'none' : '1px solid #F1F5F9', minHeight:72 }}>
              {/* Name cell */}
              <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderRight:'1px solid #F1F5F9' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:avatarBg(emp.full_name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0 }}>
                  {initials(emp.full_name)}
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{emp.full_name}</span>
              </div>

              {/* Day cells */}
              {weekDates.map((d, i) => {
                const key     = fmtDate(d);
                const entry   = empSch.find(s => s.date === key);
                const isToday = key === today;
                const isWeekend = i === 5 || i === 6;
                const sc      = entry ? (SHIFT_COLORS[entry.shift] ?? SHIFT_COLORS.morning) : null;

                return (
                  <div
                    key={key}
                    onClick={() => openModal(key, emp.id)}
                    style={{
                      borderLeft:'1px solid #F1F5F9',
                      background: isToday ? '#F0FDF9' : isWeekend ? '#FFF8F8' : 'transparent',
                      padding:8, display:'flex', flexDirection:'column', gap:4,
                      cursor:'pointer', transition:'background 0.12s',
                    }}
                  >
                    {entry && sc ? (
                      <div style={{
                        padding:'6px 10px', borderRadius:8,
                        background: sc.bg,
                        border: `1.5px solid ${sc.border}33`,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                          <span style={{ fontSize:12, fontWeight:700, color: sc.label }}>Shift</span>
                          <span style={{ width:6, height:6, borderRadius:'50%', background: sc.dot, flexShrink:0 }}/>
                        </div>
                        <div style={{ fontSize:11, color: sc.label, opacity:0.85 }}>{SHIFT_TIMES[entry.shift]}</div>
                      </div>
                    ) : (
                      <div
                        style={{
                          flex:1, minHeight:52, borderRadius:8,
                          border:'1.5px dashed #E2E8F0',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#CBD5E1', fontSize:18, fontWeight:300,
                        }}
                      >+</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Assign Shift" onClose={() => setShowModal(false)} size="sm">
          <AssignShiftForm
            date={clickDate}
            preselectedEmp={clickEmp}
            employees={employees}
            onSaved={() => { setShowModal(false); loadData(); }}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function AssignShiftForm({ date, preselectedEmp, employees, onSaved, onCancel }: {
  date: string; preselectedEmp: string; employees: any[];
  onSaved: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({ employee_id: preselectedEmp, shift: 'morning', notes: '' });
  const [saving, setSaving] = useState(false);
  const sb = getSupabase();

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #E2E8F0', borderRadius:9, background:'white', outline:'none', fontFamily:'inherit', color:'#0F172A' };
  const lbl: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' };

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

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  return (
    <div style={{ padding:'16px 24px 24px', display:'flex', flexDirection:'column', gap:14, fontFamily:"'Inter', system-ui, sans-serif" }}>
      <div style={{ padding:'10px 14px', borderRadius:10, background:'#F8FAFC', border:'1px solid #E8EDF5', fontSize:13, fontWeight:600, color:'#0F172A' }}>
        📅 {displayDate}
      </div>

      <div>
        <label style={lbl}>Employee</label>
        <select style={inp} value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
          <option value="">Select employee…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
      </div>

      <div>
        <label style={lbl}>Shift Type</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {Object.entries(SHIFT_COLORS).map(([key, sc]) => (
            <button key={key} onClick={() => setForm(f => ({ ...f, shift: key }))} style={{
              padding:'10px 12px', borderRadius:10, cursor:'pointer', textAlign:'left',
              border:`2px solid ${form.shift === key ? sc.border : '#E2E8F0'}`,
              background: form.shift === key ? sc.bg : 'white',
              fontFamily:'inherit', transition:'all 0.15s',
            }}>
              <div style={{ fontSize:12, fontWeight:700, color:sc.label, textTransform:'capitalize' }}>{key}</div>
              <div style={{ fontSize:10, color:'#94A3B8', marginTop:2 }}>{SHIFT_TIMES[key]}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={lbl}>Notes (optional)</label>
        <input style={inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions…" />
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={save} disabled={saving || !form.employee_id} style={{
          flex:1, padding:'11px 0', borderRadius:10,
          background: !form.employee_id || saving ? '#94A3B8' : 'linear-gradient(135deg,#0DC9A0 0%,#0994A0 100%)',
          color:'white', fontSize:14, fontWeight:600,
          border:'none', cursor: !form.employee_id || saving ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        }}>
          {saving ? 'Saving…' : 'Assign Shift'}
        </button>
        <button onClick={onCancel} style={{ padding:'11px 20px', borderRadius:10, background:'#F1F5F9', color:'#475569', fontSize:14, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
