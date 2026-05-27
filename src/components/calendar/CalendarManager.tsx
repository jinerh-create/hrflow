'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import Modal from '@/components/shared/Modal';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  color: string;
}

const EVENT_TYPES = [
  { value: 'holiday',  label: 'Holiday',  color: '#EF4444' },
  { value: 'meeting',  label: 'Meeting',  color: '#6366F1' },
  { value: 'event',    label: 'Event',    color: '#0DC9A0' },
  { value: 'reminder', label: 'Reminder', color: '#F59E0B' },
  { value: 'deadline', label: 'Deadline', color: '#EC4899' },
];

export default function CalendarManager() {
  const now   = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [events, setEvents]     = useState<CalEvent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd]   = useState(false);
  const [addDate, setAddDate]   = useState('');

  useEffect(() => { fetchEvents(); }, [year, month]);

  async function fetchEvents() {
    try {
      const db    = getSupabase();
      const first = `${year}-${String(month+1).padStart(2,'0')}-01`;
      const last  = `${year}-${String(month+1).padStart(2,'0')}-${new Date(year,month+1,0).getDate()}`;
      const { data } = await db.from('calendar_events').select('*').gte('date', first).lte('date', last);
      setEvents((data ?? []) as CalEvent[]);
    } catch { setEvents([]); }
  }

  async function deleteEvent(id: string) {
    try { await getSupabase().from('calendar_events').delete().eq('id', id); fetchEvents(); } catch {}
  }

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const today       = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  function prevMonth() { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function nextMonth() { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }

  function dayKey(d: number) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  const selectedEvents = selected ? events.filter(e => e.date === selected) : [];

  return (
    <div style={{ display:'flex', gap:20, fontFamily:"'Inter', system-ui, sans-serif" }}>

      {/* Main calendar */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>

        {/* Header */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EDF5', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#0F172A', margin:0 }}>{MONTHS[month]} {year}</h2>
            <p style={{ fontSize:12, color:'#94A3B8', margin:'3px 0 0', fontWeight:500 }}>Attendance &amp; Leave Overview</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={prevMonth} style={{ padding:8, borderRadius:9, border:'1.5px solid #E8EDF5', background:'white', cursor:'pointer', display:'flex', color:'#64748B' }}><ChevronLeft size={17}/></button>
            <button onClick={nextMonth} style={{ padding:8, borderRadius:9, border:'1.5px solid #E8EDF5', background:'white', cursor:'pointer', display:'flex', color:'#64748B' }}><ChevronRight size={17}/></button>
            <button onClick={() => { setAddDate(today); setShowAdd(true); }} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
              background:'linear-gradient(135deg,#0DC9A0 0%,#0994A0 100%)',
              color:'white', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit',
              boxShadow:'0 3px 10px rgba(13,201,160,0.3)',
            }}>
              <Plus size={14}/> Add Event
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EDF5', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'2px solid #E8EDF5' }}>
            {DAYS.map((d, i) => {
              const isWeekend = i===5 || i===6;
              return (
                <div key={d} style={{ padding:'12px 0', textAlign:'center', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: isWeekend ? '#EF4444' : '#94A3B8' }}>{d}</div>
              );
            })}
          </div>

          {/* Day cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {/* Empty leading cells */}
            {Array.from({ length: firstDay }).map((_,i) => (
              <div key={`e${i}`} style={{ minHeight:90, borderRight:'1px solid #F1F5F9', borderBottom:'1px solid #F1F5F9' }}/>
            ))}

            {Array.from({ length: daysInMonth }).map((_,i) => {
              const d        = i+1;
              const key      = dayKey(d);
              const dayEvts  = events.filter(e => e.date === key);
              const isToday  = key === today;
              const isSel    = key === selected;
              const col      = (firstDay + i) % 7;
              const isWeekend = col === 5 || col === 6;

              return (
                <div
                  key={d}
                  onClick={() => setSelected(isSel ? null : key)}
                  style={{
                    minHeight:90, padding:8,
                    borderRight:'1px solid #F1F5F9',
                    borderBottom:'1px solid #F1F5F9',
                    background: isSel ? '#E6FAF5' : isToday ? '#F0FDF9' : isWeekend ? '#FFF8F8' : 'white',
                    cursor:'pointer', transition:'background 0.12s',
                    display:'flex', flexDirection:'column', gap:3,
                  }}
                >
                  {/* Date number */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{
                      fontSize:13, fontWeight:700,
                      width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center',
                      borderRadius:'50%',
                      background: isToday ? '#0DC9A0' : 'transparent',
                      color: isToday ? 'white' : isWeekend ? '#EF4444' : '#0F172A',
                    }}>{d}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setAddDate(key); setShowAdd(true); }}
                      style={{ opacity:0.4, padding:2, borderRadius:4, border:'none', background:'none', cursor:'pointer', color:'#64748B', fontSize:14, lineHeight:1, fontFamily:'inherit' }}
                    >+</button>
                  </div>

                  {/* Events */}
                  {dayEvts.slice(0,3).map(ev => (
                    <div key={ev.id} style={{
                      fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:5,
                      background: ev.color + '22', color: ev.color,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{ev.title}</div>
                  ))}
                  {dayEvts.length > 3 && <span style={{ fontSize:9, color:'#94A3B8' }}>+{dayEvts.length-3} more</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', alignItems:'center', gap:16, padding:'0 4px' }}>
          {EVENT_TYPES.map(t => (
            <div key={t.value} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:t.color, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'#64748B', fontWeight:500 }}>{t.label}</span>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:'#FFF8F8', border:'1px solid #FCA5A5', flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#EF4444', fontWeight:500 }}>Weekend</span>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width:280, display:'flex', flexDirection:'column', gap:14 }}>

        {/* Selected day events */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EDF5', padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:12 }}>
            {selected ? `Events — ${selected.slice(8)} ${MONTHS[month].slice(0,3)}` : 'Click a day to view events'}
          </h3>
          {selected && selectedEvents.length === 0 && (
            <p style={{ fontSize:13, color:'#94A3B8' }}>No events on this day.</p>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {selectedEvents.map(ev => (
              <div key={ev.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px', borderRadius:10, background:ev.color+'11', border:`1px solid ${ev.color}33` }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:ev.color, flexShrink:0, marginTop:3 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                  {ev.description && <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{ev.description}</div>}
                  <div style={{ fontSize:10, fontWeight:600, color:ev.color, marginTop:3, textTransform:'capitalize' }}>{ev.type}</div>
                </div>
                <button onClick={() => deleteEvent(ev.id)} style={{ padding:2, border:'none', background:'none', cursor:'pointer', color:'#94A3B8', display:'flex', flexShrink:0 }}>
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>
          {selected && (
            <button onClick={() => { setAddDate(selected); setShowAdd(true); }} style={{
              marginTop:10, width:'100%', padding:'8px 0', borderRadius:9,
              border:'1.5px dashed #CBD5E1', background:'none', cursor:'pointer',
              fontSize:12, fontWeight:600, color:'#64748B', fontFamily:'inherit',
            }}>
              + Add event on this day
            </button>
          )}
        </div>

        {/* Upcoming events */}
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E8EDF5', padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:12 }}>All Events This Month</h3>
          {events.length === 0
            ? <p style={{ fontSize:13, color:'#94A3B8' }}>No events added yet.</p>
            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {events.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(ev => (
                  <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:ev.color+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:ev.color }}>{ev.date.slice(8)}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                      <div style={{ fontSize:10, color:'#94A3B8', textTransform:'capitalize' }}>{ev.type}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Calendar Event" onClose={() => setShowAdd(false)} size="sm">
          <AddEventForm date={addDate} onSaved={() => { setShowAdd(false); fetchEvents(); }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}

function AddEventForm({ date, onSaved, onCancel }: { date: string; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title:'', date, type:'event', description:'', color:'#0DC9A0' });
  const [saving, setSaving] = useState(false);

  const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #E2E8F0', borderRadius:9, background:'white', outline:'none', fontFamily:'inherit', color:'#0F172A' };
  const lbl: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:'#64748B', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' };

  async function save() {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      await getSupabase().from('calendar_events').insert({ title:form.title, date:form.date, type:form.type, description:form.description, color:form.color });
      onSaved();
    } catch { setSaving(false); }
  }

  return (
    <div style={{ padding:'16px 24px 24px', display:'flex', flexDirection:'column', gap:14, fontFamily:"'Inter', system-ui, sans-serif" }}>
      <div>
        <label style={lbl}>Event Title *</label>
        <input style={inp} value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Staff Meeting, Public Holiday…" />
      </div>
      <div>
        <label style={lbl}>Date *</label>
        <input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
      </div>
      <div>
        <label style={lbl}>Type</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {EVENT_TYPES.map(t => (
            <button key={t.value} onClick={() => setForm(f=>({...f,type:t.value,color:t.color}))} style={{
              padding:'8px 10px', borderRadius:9, cursor:'pointer', textAlign:'left',
              border:`2px solid ${form.type===t.value ? t.color : '#E2E8F0'}`,
              background: form.type===t.value ? t.color+'18' : 'white',
              fontFamily:'inherit',
            }}>
              <div style={{ fontSize:12, fontWeight:700, color:t.color }}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={lbl}>Description (optional)</label>
        <input style={inp} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Optional details…" />
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={save} disabled={saving||!form.title} style={{
          flex:1, padding:'11px 0', borderRadius:10,
          background: !form.title||saving ? '#94A3B8' : `linear-gradient(135deg,${form.color} 0%,${form.color}CC 100%)`,
          color:'white', fontSize:14, fontWeight:600, border:'none', cursor: !form.title||saving ? 'not-allowed':'pointer', fontFamily:'inherit',
        }}>
          {saving ? 'Saving…' : 'Add Event'}
        </button>
        <button onClick={onCancel} style={{ padding:'11px 20px', borderRadius:10, background:'#F1F5F9', color:'#475569', fontSize:14, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
      </div>
    </div>
  );
}
