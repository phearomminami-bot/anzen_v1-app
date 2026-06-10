// screens-ops.jsx — Schedule, Fleet, Progress, Billing

const LESSON_COLORS = {
  a: { bg:'#D6E4F5', fg:'#1A4F96', bd:'#ADC8EC' }, // Practical KH — blue
  b: { bg:'#D6E4F5', fg:'#1A4F96', bd:'#ADC8EC' },
  c: { bg:'#E5DAF5', fg:'#5B2EA0', bd:'#C8ADED' }, // Theory KH — purple
  d: { bg:'#D4F0E4', fg:'#1A6B3C', bd:'#96D9B8' }, // Practical JP — green
  e: { bg:'#FAE8CC', fg:'#9B4D10', bd:'#F0C88A' }, // Theory JP — amber
};

// Location label: manual free-text wins, else map the known pickup keys
const LOC_NAMES = { school:'School', yard:'Course', apply:'Apply Centre', exam:'Exam Centre', classA:'Class A', classB:'Class B', classC:'Class C' };
const locLabelOf = (l) => (l.location && l.location.trim()) || LOC_NAMES[l.pickup] || l.pickup || '';

// Short lesson code for the calendar (e.g. "学科1" / "技能1"); falls back to type code
const lessonShort = (l) => {
  if (l.lessonNo) return l.lessonNo;
  const lib = (typeof window !== 'undefined' && window.__lessonsLib) || {};
  const all = [...(lib.theoryTexts||[]), ...(lib.practicalTexts||[])];
  if (Array.isArray(l.lessonIds) && l.lessonIds.length) {
    const nos = l.lessonIds.map(id => all.find(u=>u.id===id)?.no).filter(Boolean);
    if (nos.length) return nos.join(', ');
  }
  return (l.type||'').split('·')[1]?.trim() || '';
};

const isSunday = (dateStr) => !!dateStr && new Date(dateStr + 'T00:00:00').getDay() === 0;

// ── Per-student schedule colours (auto-assigned, recycled on graduation) ─────
const STUDENT_PALETTE = [
  { bg:'#D6E4F5', fg:'#1A4F96', bd:'#9FC0E8' }, // blue
  { bg:'#D4F0E4', fg:'#1A6B3C', bd:'#96D9B8' }, // green
  { bg:'#FAE8CC', fg:'#9B4D10', bd:'#F0C88A' }, // amber
  { bg:'#E5DAF5', fg:'#5B2EA0', bd:'#C8ADED' }, // purple
  { bg:'#F4DEDD', fg:'#B0413E', bd:'#E8B4B2' }, // red
  { bg:'#D3EDF5', fg:'#0E6B8A', bd:'#A5D8E8' }, // cyan
  { bg:'#F5D9E8', fg:'#A02060', bd:'#EBADC9' }, // pink
  { bg:'#E2EFD9', fg:'#4A7A1A', bd:'#C2DBA8' }, // lime
  { bg:'#F0E2D0', fg:'#7A5A2E', bd:'#DCC4A0' }, // brown
  { bg:'#DCE0F5', fg:'#3A3EA0', bd:'#B5BCEC' }, // indigo
  { bg:'#F5E6CC', fg:'#8A6A10', bd:'#E8D29A' }, // gold
  { bg:'#D9F0EC', fg:'#1A7A6B', bd:'#A8DDD4' }, // teal
  { bg:'#EFD9F0', fg:'#8A2E8A', bd:'#DCABDD' }, // magenta
  { bg:'#E0E4E8', fg:'#4A5560', bd:'#C0C8D0' }, // slate
];
const FINISHED_STUDENT_COLOR = { bg:'#EDEDEA', fg:'#9A9A93', bd:'#D8D8D2' }; // graduated → muted
const isStudentFinished = (s) => !!s && (s.status === 'Cleared' || s.exam_result === 'pass');

// Assign each ACTIVE student a distinct palette index; finished students free their slot
const buildStudentColorMap = () => {
  const persisted = window.__studentColorAssign || {};
  const map = {}; const used = new Set();
  const active = (typeof STUDENTS!=='undefined'?STUDENTS:[]).filter(s => !isStudentFinished(s));
  active.forEach(s => {                       // keep prior colour if still free
    const idx = persisted[s.id];
    if (typeof idx==='number' && idx>=0 && idx<STUDENT_PALETTE.length && !used.has(idx)) { map[s.id]=idx; used.add(idx); }
  });
  active.forEach((s,i) => {                    // assign a free slot to the rest
    if (map[s.id]!=null) return;
    let idx = STUDENT_PALETTE.findIndex((_,k)=>!used.has(k));
    if (idx===-1) idx = i % STUDENT_PALETTE.length;   // overflow → recycle
    map[s.id]=idx; used.add(idx);
  });
  window.__studentColorAssign = map;
  return map;
};
// Cached lookup — rebuild only when the student roster / statuses change
const studentColorMap = () => {
  const list = (typeof STUDENTS!=='undefined'?STUDENTS:[]);
  const sig = list.map(s=>s.id+(isStudentFinished(s)?'1':'0')).join(',');
  if (window.__scSig === sig && window.__scMap) return window.__scMap;
  const m = buildStudentColorMap();
  window.__scSig = sig; window.__scMap = m;
  return m;
};
const studentColor = (sid) => {
  if (!sid || sid==='—') return null;
  const s = (typeof STUDENTS!=='undefined'?STUDENTS:[]).find(x=>x.id===sid);
  if (!s) return null;
  if (isStudentFinished(s)) return FINISHED_STUDENT_COLOR;
  const idx = studentColorMap()[sid];
  return idx!=null ? STUDENT_PALETTE[idx] : null;
};

// ── Colour shading: Theory = darker/bolder, Practical = lighter (same hue) ───
const _hexRgb = (h) => { h=String(h).replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
const _rgbHex = (a) => '#'+a.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');
const _mix = (a,b,t) => { const A=_hexRgb(a),B=_hexRgb(b); return _rgbHex([0,1,2].map(i=>A[i]+(B[i]-A[i])*t)); };
const _lum = (h) => { const [r,g,b]=_hexRgb(h).map(v=>v/255); return 0.2126*r+0.7152*g+0.0722*b; };
const _autoText = (bg) => _lum(bg) > 0.55 ? '#16181d' : '#ffffff';   // guarantee legible text
const isTheoryLesson = (l) => l && (l.color === 'c' || l.color === 'e');

// Returns {bg, bd, accent, text} for a lesson block.
// Theory keeps the same hue but darker/stronger; Practical stays light.
const lessonBlockColor = (l, studentMode) => {
  const base = (!studentMode && studentColor(l.studentId)) || LESSON_COLORS[l.color] || LESSON_COLORS.a;
  if (isTheoryLesson(l)) {
    const bg = _mix(base.bg, base.fg, 0.62);   // deepen toward the dark hue
    return { bg, bd: base.fg, accent: base.fg, text: _autoText(bg) };
  }
  return { bg: base.bg, bd: base.bd, accent: base.fg, text: base.fg };
};


// ── Availability helper ────────────────────────────────────────────────────
// Returns 'available' | 'full' for a given (date, h) slot
const slotAvailability = (date, h) => {
  const overlapping = LESSONS.filter(l => l.date === date && l.status !== 'cancelled' && l.h <= h && h < l.h + l.len);
  const busyInsts = new Set(overlapping.flatMap(l => [l.instId, ...(l.guests || [])]).filter(x => x && x !== '—'));
  const busyVehs  = new Set(overlapping.map(l => l.veh).filter(x => x && x !== '—'));
  const freeInsts = INSTRUCTORS.filter(i => !busyInsts.has(i.id));
  const freeVehs  = VEHICLES.filter(v => v.status !== 'Workshop' && !busyVehs.has(v.id));
  return (freeInsts.length > 0 && freeVehs.length > 0) ? 'available' : 'full';
};

// Count available + total slots in a day (hours 7..18)
const dayAvailabilitySummary = (date) => {
  const hours = Array.from({length:12}, (_,i) => i+7);
  const available = hours.filter(h => slotAvailability(date, h) === 'available').length;
  return { available, total: hours.length };
};

// Compute Google Calendar-style column layout for overlapping lessons
const computeLayout = (dayLessons) => {
  const sorted = [...dayLessons].sort((a, b) => a.h !== b.h ? a.h - b.h : (b.h + b.len) - (a.h + a.len));
  const colEnds = [];
  const lessonCol = new Map();
  for (const l of sorted) {
    let c = colEnds.findIndex(end => end <= l.h);
    if (c === -1) c = colEnds.length;
    colEnds[c] = l.h + l.len;
    lessonCol.set(l, c);
  }
  const result = new Map();
  for (const l of sorted) {
    const overlaps = sorted.filter(o => o !== l && o.h < l.h + l.len && o.h + o.len > l.h);
    const total = Math.max(
      lessonCol.get(l) + 1,
      ...overlaps.map(o => lessonCol.get(o) + 1)
    );
    result.set(l, { col: lessonCol.get(l), total });
  }
  return result;
};

// ── Week view ──
const ScheduleWeek = ({ lessons = LESSONS, studentMode = false, weekDates = [], highlights = {}, onHighlight, hlColor = '', notes = [], onSlotClick, onNoteClick, dayNav = null }) => {
  const { openDetail, openForm, tr } = useAppActions();
  const dateInputRef = React.useRef(null);
  const hours = Array.from({length:12}, (_,i)=> i+7); // 7..18
  const today = todayStr();
  const isPaint = !!hlColor;
  // Slot click: use the chooser (lesson/note) if provided, else open lesson form.
  const onSlot = (date, h) => { if (onSlotClick) onSlotClick(date, h); else openForm('newLesson',{date,hour:h}); };
  return (
    <Card pad={0}>
      {/* Mobile: the day header IS the date navigator — tap the date to pick a day */}
      {dayNav ? (() => {
        const d0 = new Date((weekDates[0] || today) + 'T00:00:00');
        const js0 = d0.getDay(); const km0 = js0 === 0 ? 6 : js0 - 1;
        const dowKm = DAYS_KM[km0] || ''; const dowEn = (DAYS_EN[km0] || '').toUpperCase();
        const dd0 = (weekDates[0] || today).slice(8,10);
        const monKm = (typeof KM_MONTHS !== 'undefined' ? KM_MONTHS : [])[d0.getMonth()] || (d0.getMonth()+1);
        return (
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 10px',borderBottom:'1px solid var(--border)',background:'var(--surface-muted)'}}>
            <button onClick={dayNav.onPrev} style={{width:38,height:38,borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:15,fontWeight:600,color:'var(--ink-2)',flexShrink:0}}>◀</button>
            <button onClick={()=>{ const el=dateInputRef.current; if(el){ try{ el.showPicker ? el.showPicker() : el.click(); }catch(e){ el.click(); } } }}
              style={{flex:1,position:'relative',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,padding:'4px 8px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer'}}>
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>{dowEn} 📅</div>
              <div style={{fontSize:15,fontWeight:700,color: dayNav.isToday ? 'var(--accent)' : 'var(--ink)',fontFamily:'var(--font-km)'}}>{parseInt(dd0)} {dowKm} · {monKm}</div>
              <input ref={dateInputRef} type="date" value={weekDates[0] || today} onChange={e=>dayNav.onPick(e.target.value)}
                style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',width:'100%',height:'100%'}}/>
            </button>
            <button onClick={dayNav.onToday} style={{height:38,padding:'0 12px',borderRadius:9,border:'1px solid var(--border)',background: dayNav.isToday ? 'var(--accent)' : 'var(--surface)',color: dayNav.isToday ? '#fff' : 'var(--ink-2)',cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0}}>{tr('ថ្ងៃ​នេះ','Today')}</button>
            <button onClick={dayNav.onNext} style={{width:38,height:38,borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:15,fontWeight:600,color:'var(--ink-2)',flexShrink:0}}>▶</button>
          </div>
        );
      })() : (
      <div style={{display:'grid',gridTemplateColumns:`56px repeat(${weekDates.length},1fr)`,borderBottom:'1px solid var(--border)'}}>
        <div/>
        {weekDates.map((date, i) => {
          const isToday = date === today;
          const dayNum = date ? parseInt(date.slice(8)) : i+1;
          const jsDay = date ? new Date(date + 'T00:00:00').getDay() : ((i+1)%7); // 0=Sun
          const kmIdx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0..Sun=6
          const dayKm = DAYS_KM[kmIdx] || '';
          const dayEnStr = (DAYS_EN[kmIdx] || '').toUpperCase();
          const {available} = dayAvailabilitySummary(date);
          const isSun = isSunday(date);
          return (
            <div key={date||i} style={{padding:'12px 10px',borderLeft:'1px solid var(--border)',background:isToday?'var(--surface-muted)':isSun?'rgba(176,65,62,.07)':'transparent'}}>
              <div style={{fontSize:11,color:isSun?'#b0413e':'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>{dayEnStr}</div>
              <div style={{fontSize:18,fontWeight:600,marginTop:2,fontFamily:'var(--font-display)',color:isToday?'var(--accent)':isSun?'#b0413e':'inherit'}}>
                {dayNum} <span style={{fontSize:11,fontWeight:400,color:isSun?'#b0413e80':'var(--ink-3)'}}>{dayKm}</span>
              </div>
              {studentMode && (
                available > 0
                  ? <div style={{fontSize:9,color:'var(--good)',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{available} ទំនេរ</div>
                  : <div style={{fontSize:9,color:'var(--danger)',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>ពេញ</div>
              )}
            </div>
          );
        })}
      </div>
      )}
      {/* Body */}
      <div style={{display:'grid',gridTemplateColumns:`56px repeat(${weekDates.length},1fr)`,position:'relative'}}>
        {/* Hour labels */}
        <div>
          {hours.map(h => (
            <div key={h} style={{height:48,padding:'4px 8px',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{String(h).padStart(2,'0')}:00</div>
          ))}
        </div>
        {/* Day columns */}
        {weekDates.map((date,dayIdx)=>{
          const dayLessons = lessons.filter(l => l.date === date && l.status !== 'cancelled');
          // Timed notes join the same overlap layout as lessons, so a note and a
          // lesson at the same time sit side by side instead of covering each
          // other. Give notes a 1-hour span for the overlap math.
          const dayNotes = notes.filter(n => n.date === date && n.time).map(n => {
            const [hh,mm] = n.time.split(':').map(Number);
            return { ...n, h: hh + (mm||0)/60, len: 1, _note: true };
          }).filter(n => n.h >= 7 && n.h < 19);
          const layout = computeLayout([...dayLessons, ...dayNotes]);
          const isSun = isSunday(date);
          return (
            <div key={dayIdx} style={{position:'relative',borderLeft:'1px solid var(--border)',background:date===today?'rgba(42,93,176,.02)':isSun?'rgba(176,65,62,.04)':'transparent'}}>
              {hours.map(h => {
                const hlKey = `${date}:${h}`;
                const hlBg = highlights[hlKey] || '';
                if (!studentMode) {
                  return (
                    <div key={h}
                      onClick={()=>{ if(isPaint) onHighlight?.(date,h); else onSlot(date,h); }}
                      style={{height:48,borderBottom:'1px solid var(--border)',cursor:isPaint?'crosshair':'pointer',background:hlBg||'transparent',transition:'background .1s'}}
                      onMouseEnter={e=>{ e.currentTarget.style.background = hlBg ? (isPaint?'rgba(0,0,0,.08)':hlBg) : isPaint?hlColor:'rgba(42,93,176,.05)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background = hlBg||'transparent'; }}
                      title={isPaint?'':`បន្ថែម​មេរៀន ${String(h).padStart(2,'0')}:00`}
                    />
                  );
                }
                const avail = slotAvailability(date, h);
                const isAvail = avail === 'available';
                const baseBg = isAvail ? 'rgba(59,122,87,.07)' : 'rgba(176,65,62,.05)';
                return (
                  <div key={h}
                    onClick={()=>{ if(isPaint) onHighlight?.(date,h); else if(isAvail) openForm('newLesson',{date,hour:h}); }}
                    style={{
                      height:48, borderBottom:'1px solid var(--border)',
                      background: hlBg || baseBg,
                      cursor: isPaint ? 'crosshair' : isAvail ? 'pointer' : 'default',
                      display:'flex', alignItems:'center', paddingLeft:7, gap:5,
                      transition:'background .1s',
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.background = hlBg?(isPaint?'rgba(0,0,0,.08)':hlBg):isPaint?hlColor:isAvail?'rgba(59,122,87,.15)':baseBg; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background = hlBg||baseBg; }}
                  >
                    {!isPaint && <><span style={{width:5,height:5,borderRadius:'50%',flexShrink:0,background:isAvail?'var(--good)':'var(--danger)',opacity:isAvail?.8:.4}}/>
                    {isAvail && <span style={{fontSize:9,color:'var(--good)',fontFamily:'"JetBrains Mono",monospace',opacity:.7}}>ទំនេរ</span>}</>}
                  </div>
                );
              })}
              {/* Lesson blocks — Google Calendar-style columns for overlaps */}
              {dayLessons.map((l,i)=>{
                const top = (l.h - 7) * 48 + 2;
                const height = l.len * 48 - 4;
                const c = lessonBlockColor(l, studentMode);
                const s = studentById(l.studentId);
                const it = instById(l.instId);
                const v = vehById(l.veh);
                const { col, total } = layout.get(l) || { col: 0, total: 1 };
                const pct = 100 / total;
                const transLabel = v?.trans || '';
                const locLabel   = locLabelOf(l);
                return (
                  <button key={i} onClick={e=>{ e.stopPropagation(); openDetail('lesson', l); }} style={{
                    position:'absolute',top,
                    left:`calc(${col * pct}% + 4px)`,
                    width:`calc(${pct}% - 8px)`,
                    height,
                    background:c.bg,border:`1px solid ${c.bd}`,borderLeft:`3px solid ${c.accent}`,
                    borderRadius:6,padding:'4px 6px',overflow:'hidden',
                    fontSize:10.5,textAlign:'left',cursor:'pointer',font:'inherit',color:c.text,
                    boxSizing:'border-box',
                  }}>
                    <div style={{display:'flex',gap:4,alignItems:'baseline',overflow:'hidden',minWidth:0}}>
                      <span style={{fontWeight:700,color:c.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontSize:10.5,flexShrink:1,minWidth:0}}>
                        {studentMode ? (lessonShort(l) || l.type.split('·')[0].trim()) : (s ? (s.en || s.name) : l.type.split('·')[0].trim())}
                      </span>
                      {lessonShort(l) && (
                        <span style={{fontSize:9,fontWeight:700,color:c.text,opacity:.9,whiteSpace:'nowrap',flexShrink:0,fontFamily:'"JetBrains Mono",monospace'}}>
                          {lessonShort(l)}
                        </span>
                      )}
                    </div>
                    <div style={{display:'flex',gap:3,alignItems:'center',overflow:'hidden',minWidth:0}}>
                      <span style={{color:c.text,opacity:.88,fontSize:10,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',flex:1,minWidth:0}}>
                        {studentMode ? (it?.en || '—') : (it?.en || '—')}
                      </span>
                      {transLabel && <span style={{fontSize:8,fontWeight:700,padding:'1px 4px',borderRadius:3,background:transLabel==='MT'?'#B0413E':'#2A5DB0',color:'#fff',flexShrink:0,lineHeight:1.4}}>{transLabel}</span>}
                      {locLabel && <span style={{fontSize:8,fontWeight:700,padding:'1px 4px',borderRadius:3,background:locLabel==='School'?'#2A5DB0':'#B0413E',color:'#fff',flexShrink:0,lineHeight:1.4}}>{locLabel}</span>}
                    </div>
                    {!studentMode && l.guests && l.guests.length > 0 && (
                      <div style={{color:c.text,opacity:.78,fontSize:9.5,fontStyle:'italic',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {`[ ${l.guests.map(gid=>{ const gi=instById(gid); return gi?gi.en:gid; }).join(' · ')} ]`}
                      </div>
                    )}
                    {height >= 60 && v?.plate && (
                      <div style={{marginTop:2}}>
                        <span style={{fontSize:9,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{v.plate}</span>
                      </div>
                    )}
                  </button>
                );
              })}
              {/* Note blocks — share the grid's column layout so they never
                  cover a lesson at the same time */}
              {dayNotes.map(n => {
                const top = (n.h - 7) * 48 + 1;
                const { col, total } = layout.get(n) || { col:0, total:1 };
                const pct = 100 / total;
                const invitedNames = (n.invited||[]).map(id=>{ const i=INSTRUCTORS.find(x=>x.id===id); return i?(i.en||i.name):null; }).filter(Boolean);
                return (
                  <button key={n.id} onClick={e=>{ e.stopPropagation(); onNoteClick ? onNoteClick(n) : null; }}
                    title={`${n.time} · ${n.title||n.text||''}`}
                    style={{
                      position:'absolute', top,
                      left:`calc(${col * pct}% + 4px)`,
                      width:`calc(${pct}% - 8px)`,
                      minHeight:22,
                      background:'rgba(250,204,21,.22)', border:'1px solid rgba(202,138,4,.6)', borderLeft:'3px solid #ca8a04',
                      borderRadius:6, padding:'3px 6px', overflow:'hidden', zIndex:3,
                      fontSize:10.5, textAlign:'left', cursor:'pointer', font:'inherit', color:'var(--ink)', boxSizing:'border-box',
                    }}>
                    <div style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}>
                      <span style={{flexShrink:0}}>📌</span>
                      <span style={{fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{n.title||n.text}</span>
                    </div>
                    {invitedNames.length > 0 && (
                      <div style={{fontSize:9,color:'#92700a',fontStyle:'italic',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        👥 {invitedNames.join(' · ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ── Month view ──
const ScheduleMonth = ({ lessons = LESSONS, studentMode = false, weekDates = [] }) => {
  const { openDetail, openForm, tr } = useAppActions();
  const today = todayStr();
  // Build a 5-week (35-cell) grid from the Monday in weekDates[0]
  const startDate = weekDates[0] || today;
  const monthDates = Array.from({length:35}, (_,i) => {
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return localDateStr(d);
  });
  return (
    <Card pad={0}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--border)'}}>
        {DAYS_EN.map((d,i)=>(
          <div key={i} style={{padding:'10px 12px',fontSize:10,letterSpacing:'.08em',color:i===6?'#b0413e':'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderLeft:i?'1px solid var(--border)':'none',background:i===6?'rgba(176,65,62,.05)':'transparent'}}>{tr(DAYS_KM[i], d)}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(5,minmax(100px,1fr))'}}>
        {monthDates.map((date, i) => {
          const dayNum = parseInt(date.slice(8));
          const isToday = date === today;
          const dayLessons = lessons.filter(l => l.date === date && l.status !== 'cancelled');
          const avail = studentMode ? dayAvailabilitySummary(date) : null;
          const isSun = isSunday(date);
          return (
            <div key={i}
              onClick={studentMode ? undefined : ()=>openForm('newLesson',{date})}
              style={{
                borderLeft: i%7 ? '1px solid var(--border)':'none',
                borderTop: i>=7 ? '1px solid var(--border)':'none',
                padding:'8px 10px',
                background: isToday ? 'var(--surface-muted)' : isSun ? 'rgba(176,65,62,.05)' : 'transparent',
                display:'flex',flexDirection:'column',gap:4,
                minHeight:0, cursor:studentMode?'default':'pointer',
              }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{
                  fontSize:13,fontWeight:isToday?700:500,
                  width:22,height:22,borderRadius:999,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:isToday?'var(--ink)':'transparent',
                  color:isToday?'var(--bg)':isSun?'#b0413e':'var(--ink)',
                }}>{dayNum}</div>
                {studentMode && avail && (
                  avail.available > 0
                    ? <span style={{fontSize:9,color:'var(--good)',fontFamily:'"JetBrains Mono",monospace',background:'rgba(59,122,87,.1)',padding:'1px 5px',borderRadius:4}}>{avail.available}</span>
                    : <span style={{fontSize:9,color:'var(--danger)',fontFamily:'"JetBrains Mono",monospace',background:'rgba(176,65,62,.08)',padding:'1px 5px',borderRadius:4}}>ពេញ</span>
                )}
                {!studentMode && dayLessons.length > 0 && (
                  <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{dayLessons.length}</div>
                )}
              </div>
              {dayLessons.slice(0,3).map((l,j) => {
                const clr = lessonBlockColor(l, studentMode);
                const s = studentById(l.studentId);
                return (
                  <div key={j} onClick={e=>{e.stopPropagation(); openDetail('lesson', l);}} style={{
                    fontSize:10,padding:'2px 5px',fontWeight:isTheoryLesson(l)?600:400,
                    background:clr.bg,color:clr.text,
                    borderLeft:`2px solid ${clr.accent}`,borderRadius:3,
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',cursor:'pointer',
                  }}>
                    {String(l.h).padStart(2,'0')}:00 {lessonShort(l) || (studentMode ? l.type.split('·')[0].trim() : (s ? s.name.split(' ')[0] : l.type.split('·')[0].trim()))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ── Agenda view ──
const ScheduleAgenda = ({ lessons = LESSONS, studentMode = false, weekDates = [] }) => {
  const { openDetail, openForm, tr } = useAppActions();
  const hours = Array.from({length:12}, (_,i) => i+7);
  const today = todayStr();
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {weekDates.map((date, idx) => {
        const dayLessons = lessons.filter(l => l.date === date && l.status !== 'cancelled').sort((a,b)=>a.h-b.h);
        const isToday = date === today;
        const dayNum = parseInt(date.slice(8));
        const monthIdx = parseInt(date.slice(5,7)) - 1;
        const dayLabel = `${dayNum} ${KM_MONTHS[monthIdx]}`;
        const {available} = dayAvailabilitySummary(date);
        return (
          <Card key={date} pad={0}>
            <div style={{padding:'12px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'baseline',gap:10,background:isToday?'var(--surface-muted)':'transparent'}}>
              <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)'}}>{dayLabel}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{tr(DAYS_KM[idx], DAYS_EN[idx])}</div>
              {isToday && <Badge tone="accent">{tr('ថ្ងៃ​នេះ','today')}</Badge>}
              {studentMode && (
                available > 0
                  ? <Badge tone="good">{available} ម៉ោង​ទំនេរ</Badge>
                  : <Badge tone="danger">ពេញ</Badge>
              )}
              {!studentMode && <span style={{fontSize:12,color:'var(--ink-3)'}}>{dayLessons.length} {dayLessons.length===1?'lesson':'lessons'}</span>}
            </div>

            {dayLessons.length === 0 && !studentMode && (
              <div style={{padding:'20px 18px',fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>{tr('គ្មាន​មេរៀន','No lessons scheduled')}</div>
            )}
            {dayLessons.map((l,i) => {
              const c = lessonBlockColor(l, studentMode);
              const s = studentById(l.studentId);
              const it = instById(l.instId);
              const v = vehById(l.veh);
              return (
                <div key={i} onClick={()=>openDetail('lesson', l)} style={{padding:'14px 18px',display:'grid',gridTemplateColumns:'80px 4px 1fr 1fr auto',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none',cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <div>
                    <div style={{fontSize:16,fontWeight:600,fontFamily:'var(--font-display)'}}>{String(l.h).padStart(2,'0')}:00</div>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>{l.len}h</div>
                  </div>
                  <div style={{width:isTheoryLesson(l)?7:4,height:32,background:c.accent,borderRadius:2}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>{studentMode ? l.type : (s ? s.name : l.type)}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{studentMode ? (l.note||l.type.split('·')[1]?.trim()||'') : l.type}</div>
                  </div>
                  <div style={{fontSize:12,color:'var(--ink-2)'}}>
                    {it ? (
                      <button onClick={e=>{e.stopPropagation();openDetail('instructor',it);}} style={{font:'inherit',background:'none',border:'none',cursor:'pointer',color:'var(--accent)',padding:0,textDecoration:'underline dotted',fontSize:12}}>{it.en}</button>
                    ) : <span>—</span>}
                    {v && (
                      <button onClick={e=>{e.stopPropagation();openDetail('vehicle',v);}} style={{font:'inherit',background:'none',border:'none',cursor:'pointer',color:'var(--ink-3)',padding:0,textDecoration:'underline dotted',fontSize:11,marginTop:2,display:'block'}}>{v.plate} · {v.make.split('·')[0].trim()}</button>
                    )}
                  </div>
                  <Badge tone={l.color==='e'?'warn':l.color==='c'?'neutral':'accent'}>
                    {l.color==='e'?'Theory JP':l.color==='c'?'Theory KH':l.color==='d'?'Practical JP':'Practical KH'}
                  </Badge>
                </div>
              );
            })}

            {/* Available slots for students */}
            {studentMode && available > 0 && (
              <div style={{padding:'10px 18px 12px',borderTop:'1px solid var(--border)',background:'var(--surface-muted)'}}>
                <div style={{fontSize:10,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',color:'var(--ink-3)',textTransform:'uppercase',marginBottom:8}}>
                  {tr('ម៉ោង​ដែល​អាច​កក់​បាន','Available slots')}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {hours.filter(h=>!dayLessons.some(l=>l.h<=h&&h<l.h+l.len)).map(h => {
                    const isAvail = slotAvailability(date, h) === 'available';
                    return (
                      <button key={h}
                        onClick={isAvail ? ()=>openForm('newLesson',{date,hour:h}) : undefined}
                        disabled={!isAvail}
                        style={{
                          padding:'4px 9px',borderRadius:6,
                          border:`1px solid ${isAvail?'var(--good)':'rgba(176,65,62,.3)'}`,
                          background: isAvail?'rgba(59,122,87,.08)':'rgba(176,65,62,.05)',
                          color: isAvail?'var(--good)':'var(--danger)',
                          fontSize:11,fontFamily:'"JetBrains Mono",monospace',
                          cursor:isAvail?'pointer':'default',fontWeight:500,opacity:isAvail?1:0.6,
                        }}>
                        {String(h).padStart(2,'0')}:00{isAvail&&<span style={{marginLeft:4,fontSize:9}}>+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

const ScheduleScreen = ({ view, role = 'admin', studentId }) => {
  const { openForm, navigate, tr, lang, openDetail } = useAppActions();
  const bp = useBreakpoint();
  // Current logged-in user — the note's author (Google-Calendar style).
  const me = (role === 'instructor' ? (window.__loggedInInstructorData || LOGIN_USERS.instructor) : (LOGIN_USERS[role] || LOGIN_USERS.admin)) || {};
  const meName = (lang === 'km' ? me.km : me.en) || me.en || me.km || tr('នាយក','Admin');
  const [v, setV] = React.useState(view || 'week');
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [dayOffset,  setDayOffset]  = React.useState(0);
  const [ver, setVer] = React.useState(0);
  const [instFilter,    setInstFilter]    = React.useState('');
  const [vehFilter,     setVehFilter]     = React.useState('');
  const [studentFilter, setStudentFilter] = React.useState('');
  const [activeColor,   setActiveColor]   = React.useState('');
  const [highlights,    setHighlights]    = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('anzen_hl') || '{}'); } catch { return {}; }
  });
  const handleHighlight = (date, h) => {
    if (!activeColor) return;
    const key = `${date}:${h}`;
    setHighlights(prev => {
      const next = {...prev};
      if (next[key] === activeColor) delete next[key];
      else next[key] = activeColor;
      try { localStorage.setItem('anzen_hl', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Short notes / reminders pinned to a date (e.g. ប្រជុំគ្រូ · teacher meeting).
  // Notes live in school settings so they sync to the cloud and are shared with
  // all users (not just this device). Fall back to / migrate any older
  // device-local notes saved before sharing existed.
  const [notes, setNotes] = React.useState(() => {
    const ss = window.__schoolSettings;
    if (ss && Array.isArray(ss.scheduleNotes)) return ss.scheduleNotes;
    let local = [];
    try { local = JSON.parse(localStorage.getItem('anzen_sched_notes') || '[]'); } catch {}
    if (ss && local.length) ss.scheduleNotes = local;   // migrate once
    return local;
  });
  const [noteModal, setNoteModal] = React.useState(null); // null | { id?, date, time, title, description, author, invited:[] }
  const saveNotes = (next) => {
    setNotes(next);
    window.__scheduleNotes = next;
    if (!window.__schoolSettings) window.__schoolSettings = {};
    window.__schoolSettings.scheduleNotes = next;        // part of the synced settings blob
    try { localStorage.setItem('anzen_sched_notes', JSON.stringify(next)); } catch {}
    if (window.saveAllData) window.saveAllData();         // persist + push to cloud (shared)
  };
  const submitNote = () => {
    const title = (noteModal?.title || '').trim();
    const description = (noteModal?.description || '').trim();
    if (!title && !description) { setNoteModal(null); return; }
    const time = noteModal.time || '';
    const invited = noteModal.invited || [];
    // keep `text` mirrored to the title so any older consumer / cloud reader still works
    const text = title || description;
    if (noteModal.id) saveNotes(notes.map(n => n.id === noteModal.id ? { ...n, date: noteModal.date, time, title, description, text, invited } : n));
    else              saveNotes([...notes, { id: 'N' + Date.now(), date: noteModal.date, time, title, description, text, author: noteModal.author || meName, invited }]);
    if (window.__logActivity) window.__logActivity(noteModal.id ? 'edit' : 'create', 'note', (title || description || '').slice(0,60));
    setNoteModal(null);
  };
  const removeNote = (id) => {
    const n = notes.find(x => x.id === id);
    saveNotes(notes.filter(x => x.id !== id));
    if (window.__logActivity) window.__logActivity('delete', 'note', n ? (n.title || n.text || '').slice(0,60) : '');
  };
  const toggleInvite = (instId) => setNoteModal(m => {
    const cur = m.invited || [];
    return { ...m, invited: cur.includes(instId) ? cur.filter(x => x !== instId) : [...cur, instId] };
  });

  React.useEffect(()=>{ if(view) setV(view); }, [view]);
  // When data reloads (cloud sync / realtime), refresh notes from the shared
  // settings so notes added by other users appear here too.
  React.useEffect(() => {
    const fromSettings = window.__schoolSettings && window.__schoolSettings.scheduleNotes;
    if (Array.isArray(fromSettings) && fromSettings !== notes) setNotes(fromSettings);
  }, [ver]);
  React.useEffect(()=>{
    window.__notifyLessonsChanged     = () => setVer(n => n+1);
    window.__notifyInstructorsChanged = () => setVer(n => n+1);
    window.__notifyStudentsChanged    = () => setVer(n => n+1);
    return () => {
      delete window.__notifyLessonsChanged;
      delete window.__notifyInstructorsChanged;
      delete window.__notifyStudentsChanged;
    };
  }, []);

  // Pick up cross-tab filter set by Instructors/Fleet screens
  React.useEffect(()=>{
    if (window.__scheduleInstFilter) { setInstFilter(window.__scheduleInstFilter); delete window.__scheduleInstFilter; }
    if (window.__scheduleVehFilter)  { setVehFilter(window.__scheduleVehFilter);   delete window.__scheduleVehFilter; }
  }, []);

  const allWeekDates = getWeekDates(weekOffset);
  const today = todayStr();
  const studentMode = role === 'student';
  const instructorMode = false;

  // On mobile: show 1 day at a time with dayOffset navigation
  const getMobileDate = (off) => {
    const d = new Date(); d.setDate(d.getDate() + off);
    return localDateStr(d);   // local date (not UTC) so "today" is correct in UTC+7
  };
  const mobileDate = getMobileDate(dayOffset);
  // Jump to an arbitrary date picked from the calendar input.
  const setMobileDateAbs = (dateStr) => {
    if (!dateStr) return;
    const a = new Date(dateStr + 'T00:00:00'), b = new Date(today + 'T00:00:00');
    setDayOffset(Math.round((a - b) / 86400000));
  };
  const weekDates  = bp.mobile ? [mobileDate] : allWeekDates;

  const baseLessons = LESSONS.filter(l =>
    studentMode
      ? (l.studentId === studentId || l.studentId === '—') && l.status !== 'cancelled'
      : l.status !== 'cancelled'
  );

  const visibleLessons = !studentMode
    ? baseLessons.filter(l =>
        (!instFilter    || l.instId    === instFilter) &&
        (!vehFilter     || l.veh       === vehFilter) &&
        (!studentFilter || l.studentId === studentFilter))
    : baseLessons;

  const anyFilter = instFilter || vehFilter || studentFilter;

  const weekStart = allWeekDates[0] || '';
  const weekEnd   = allWeekDates[6] || '';
  const startDay  = weekStart ? parseInt(weekStart.slice(8)) : '';
  const endDay    = weekEnd   ? parseInt(weekEnd.slice(8))   : '';
  const monthIdx  = weekStart ? parseInt(weekStart.slice(5,7))-1 : 0;
  const labelKm   = bp.mobile
    ? `${parseInt(mobileDate.slice(8))} ${KM_MONTHS[parseInt(mobileDate.slice(5,7))-1]}`
    : (weekStart ? `${startDay}–${endDay} ${KM_MONTHS[monthIdx]}` : '');
  const labelEn   = bp.mobile
    ? `${EN_MONTHS[parseInt(mobileDate.slice(5,7))-1]} ${parseInt(mobileDate.slice(8))}`
    : (weekStart ? `${EN_MONTHS[monthIdx]} ${startDay}–${endDay}` : '');

  const viewLabel = (k) => tr(
    k==='week'?'សប្ដាហ៍':k==='month'?'ខែ':'បញ្ជី',
    k==='week'?'Week':k==='month'?'Month':'Agenda'
  );

  const HL_PALETTE = [
    { k:'y', bg:'rgba(250,204,21,.35)' },
    { k:'o', bg:'rgba(249,115,22,.30)' },
    { k:'r', bg:'rgba(239,68,68,.28)' },
    { k:'g', bg:'rgba(34,197,94,.28)' },
    { k:'b', bg:'rgba(59,130,246,.28)' },
    { k:'p', bg:'rgba(168,85,247,.28)' },
  ];
  // Notes visible in the current view (for both the grid blocks and the card)
  const noteSortKey = n => n.date + ' ' + (n.time || '99:99');
  const visNoteSet = new Set(weekDates);
  const visNotes = notes.filter(n => visNoteSet.has(n.date)).sort((a,b)=> noteSortKey(a)<noteSortKey(b)?-1: noteSortKey(a)>noteSortKey(b)?1:0);
  // Click a time slot → open the create modal defaulting to the lesson tab,
  // pre-filled with that slot's date+hour (switchable to a note).
  const openSlot = (date, hour) => setNoteModal({ mode:'lesson', date, hour, time:String(hour).padStart(2,'0')+':00', title:'', description:'', author:meName, invited:[] });
  const editNote = (n) => setNoteModal({ id:n.id, date:n.date, time:n.time||'', title:n.title||n.text||'', description:n.description||'', author:n.author, invited:n.invited||[] });
  // Clicking a note opens a read-only detail (like the lesson detail); its
  // Edit/Delete buttons call back into these handlers.
  React.useEffect(() => {
    window.__editScheduleNote   = (n) => editNote(n);
    window.__deleteScheduleNote = (id) => removeNote(id);
    return () => { delete window.__editScheduleNote; delete window.__deleteScheduleNote; };
  });

  const viewProps = { lessons:visibleLessons, studentMode, weekDates, highlights, onHighlight:handleHighlight, hlColor:activeColor,
    notes:visNotes, onSlotClick: studentMode ? null : openSlot, onNoteClick: (n)=>openDetail('note', n) };

  const selStyle = {
    padding:'6px 10px',border:'1px solid var(--border)',borderRadius:7,
    fontSize:12,background:'var(--surface)',color:'var(--ink)',cursor:'pointer',
    fontFamily:'inherit',minWidth:120,
  };
  const selActive = (val) => val ? {...selStyle, border:'1px solid var(--accent)', color:'var(--accent)', background:'var(--accent-soft)'} : selStyle;

  // Mobile: day navigation bar
  const MobileDayNav = () => {
    const d = new Date(mobileDate + 'T00:00:00');
    const isToday = mobileDate === today;
    const dd   = mobileDate.slice(8,10);
    const yyyy = mobileDate.slice(0,4);
    const dowKm = ['អាទិត្យ','ច័ន្ទ','អង្គារ','ពុធ','ព្រហស្បតិ៍','សុក្រ','សៅរ៍'][d.getDay()];
    const dowEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    const monKm = KM_MONTHS[d.getMonth()];
    const monEn = (EN_MONTHS[d.getMonth()] || '').slice(0,3);
    const label = tr(`${dowKm} - ${dd}/${monKm}/${yyyy}`, `${dowEn} - ${dd}/${monEn}/${yyyy}`);
    return (
      <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 10px'}}>
        <button onClick={()=>setDayOffset(o=>o-1)} style={{padding:'6px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface-muted)',cursor:'pointer',fontSize:14,fontWeight:600,color:'var(--ink-2)'}}>◀</button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--ink)',fontFamily:'var(--font-km)'}}>{label}</div>
        </div>
        <button onClick={()=>{ setDayOffset(0); }} style={{padding:'5px 10px',borderRadius:7,border:'1px solid var(--border)',background:isToday?'var(--accent)':'var(--surface-muted)',color:isToday?'#fff':'var(--ink-2)',cursor:'pointer',fontSize:11,fontWeight:600}}>ថ្ងៃ​នេះ</button>
        <button onClick={()=>setDayOffset(o=>o+1)} style={{padding:'6px 12px',borderRadius:7,border:'1px solid var(--border)',background:'var(--surface-muted)',cursor:'pointer',fontSize:14,fontWeight:600,color:'var(--ink-2)'}}>▶</button>
      </div>
    );
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {!bp.mobile && <SectionTitle
        km={`កាលវិភាគ · ${labelKm}`}
        en={`${studentMode?'My Schedule':'Schedule'} · ${labelEn}`}
        action={bp.mobile ? null : (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:2}}>
              {['week','month','agenda'].map(k => (
                <button key={k} onClick={()=>setV(k)} style={{
                  padding:'5px 10px',border:'none',
                  background: v===k ? 'var(--ink)' : 'transparent',
                  color: v===k ? 'var(--bg)' : 'var(--ink-2)',
                  borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',
                }}>{viewLabel(k)}</button>
              ))}
            </div>
            <Btn kind="ghost" size="md" onClick={()=>setWeekOffset(o=>o-1)}>{tr('◀ មុន','◀ Prev')}</Btn>
            <Btn kind="ghost" size="md" onClick={()=>setWeekOffset(0)}>{tr('ថ្ងៃ​នេះ','Today')}</Btn>
            <Btn kind="ghost" size="md" onClick={()=>setWeekOffset(o=>o+1)}>{tr('បន្ទាប់ ▶','Next ▶')}</Btn>
            <Btn kind="ghost" size="md" onClick={()=>generateSchedulePDF({lessons:visibleLessons,weekDates:allWeekDates,viewType:v,labelEn,instFilter,vehFilter,studentFilter})} icon={<Icon name="download" size={14}/>}>{tr('PDF','PDF')}</Btn>
            {!studentMode && <Btn kind="ghost" size="md" onClick={()=>setNoteModal({date:allWeekDates[0]||today,time:'09:00',title:'',description:'',author:meName,invited:[]})} icon={<Icon name="bell" size={14}/>}>{tr('+ ចំណាំ','+ Note')}</Btn>}
            {can(role,'create','lesson') && <Btn kind="primary" size="md" onClick={()=>openForm('newLesson')} icon={<Icon name="plus" size={14}/>}>{tr('មេរៀន​ថ្មី','New lesson')}</Btn>}
          </div>
        )}
      />}

      {/* Filter bar — admin only, desktop */}
      {!studentMode && !instructorMode && !bp.mobile && (
        <div style={{display:'flex',gap:8,alignItems:'center',padding:'8px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,flexWrap:'wrap'}}>

          {/* All button */}
          <button
            onClick={()=>{ setInstFilter(''); setVehFilter(''); setStudentFilter(''); }}
            style={{
              padding:'6px 14px',border:'none',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:600,
              background: !anyFilter ? 'var(--ink)' : 'var(--surface-muted)',
              color:       !anyFilter ? 'var(--bg)'  : 'var(--ink-2)',
              transition:'all .12s',
            }}>
            {tr('ទាំងអស់','All')}
          </button>

          <div style={{width:1,height:22,background:'var(--border)',margin:'0 4px'}}/>

          {/* Instructor dropdown */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>គ្រូ</span>
            <select value={instFilter} onChange={e=>{ setInstFilter(e.target.value); setStudentFilter(''); }}
              style={selActive(instFilter)}>
              <option value="">— គ្រូ​ទាំងអស់ All instructors —</option>
              {INSTRUCTORS.map(i => {
                const cnt = LESSONS.filter(l=>l.instId===i.id&&l.date===today&&l.status!=='cancelled').length;
                return <option key={i.id} value={i.id}>{i.en}{cnt>0?` (${cnt})`:''}​</option>;
              })}
            </select>
          </div>

          {/* Vehicle dropdown */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>ឡាន</span>
            <select value={vehFilter} onChange={e=>{ setVehFilter(e.target.value); setStudentFilter(''); }}
              style={selActive(vehFilter)}>
              <option value="">— ឡាន​ទាំងអស់ All vehicles —</option>
              {VEHICLES.filter(vv=>vv.status!=='Workshop').map(vv => (
                <option key={vv.id} value={vv.id}>{vv.plate} · {vv.make.split('·')[0].trim()}</option>
              ))}
            </select>
          </div>

          {/* Student dropdown */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>សិស្ស</span>
            <select value={studentFilter} onChange={e=>{ setStudentFilter(e.target.value); setInstFilter(''); setVehFilter(''); }}
              style={selActive(studentFilter)}>
              <option value="">— សិស្ស​ទាំងអស់ All students —</option>
              {STUDENTS.filter(s => LESSONS.some(l=>l.studentId===s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>

          {anyFilter && (
            <button onClick={()=>{ setInstFilter(''); setVehFilter(''); setStudentFilter(''); }}
              style={{marginLeft:'auto',padding:'4px 8px',fontSize:11,color:'var(--ink-3)',background:'transparent',border:'none',cursor:'pointer',textDecoration:'underline'}}>
              {tr('ដោះ​ស្រាយ','Clear')}
            </button>
          )}
        </div>
      )}

      {/* Mobile compact filters */}
      {!studentMode && bp.mobile && (
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <select value={instFilter} onChange={e=>{ setInstFilter(e.target.value); setStudentFilter(''); }}
            style={{...selActive(instFilter),flex:1,minWidth:0,fontSize:12}}>
            <option value="">គ្រូ​ទាំងអស់</option>
            {INSTRUCTORS.map(i => <option key={i.id} value={i.id}>{i.en}</option>)}
          </select>
          <select value={studentFilter} onChange={e=>{ setStudentFilter(e.target.value); setInstFilter(''); setVehFilter(''); }}
            style={{...selActive(studentFilter),flex:1,minWidth:0,fontSize:12}}>
            <option value="">សិស្ស​ទាំងអស់</option>
            {STUDENTS.filter(s=>LESSONS.some(l=>l.studentId===s.id)).map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Highlight palette — desktop only, week/month view */}
      {!bp.mobile && v !== 'agenda' && (
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'0 2px'}}>
          <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',marginRight:2}}>Highlight</span>
          {HL_PALETTE.map(({k,bg}) => (
            <button key={k} onClick={()=>setActiveColor(c=>c===bg?'':bg)} style={{
              width:18,height:18,borderRadius:'50%',border: activeColor===bg ? '2px solid var(--ink)' : '1.5px solid var(--border)',
              background:bg, cursor:'pointer', padding:0, flexShrink:0,
              boxShadow: activeColor===bg ? '0 0 0 2px var(--bg), 0 0 0 4px var(--ink)' : 'none',
              transition:'box-shadow .12s',
            }}/>
          ))}
          {activeColor && (
            <button onClick={()=>setActiveColor('')} style={{
              fontSize:11,padding:'2px 8px',borderRadius:6,border:'1px solid var(--border)',
              background:'var(--surface)',color:'var(--ink-3)',cursor:'pointer',marginLeft:2,
            }}>✕ {tr('ឈប់','Stop')}</button>
          )}
          {Object.keys(highlights).length > 0 && !activeColor && (
            <button onClick={()=>{ setHighlights({}); try{localStorage.removeItem('anzen_hl');}catch{} }} style={{
              fontSize:11,padding:'2px 8px',borderRadius:6,border:'1px solid var(--border)',
              background:'var(--surface)',color:'var(--ink-3)',cursor:'pointer',marginLeft:'auto',
            }}>{tr('លុប​ highlight​ ទាំង​អស់','Clear all highlights')}</button>
          )}
        </div>
      )}

      {/* Pinned notes summary — only for month/agenda views, which have no time
          grid. In the week grid (and on mobile) notes already appear as blocks
          inside the grid, so the summary card is redundant and hidden. */}
      {!studentMode && !bp.mobile && v !== 'week' && (() => {
        if (visNotes.length === 0) return null;
        return (
          <div style={{background:'rgba(250,204,21,.12)',border:'1px solid rgba(250,204,21,.5)',borderRadius:10,padding:'10px 12px'}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--ink-2)',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              📌 {tr('កំណត់​ចំណាំ','Notes')}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {visNotes.map(n => (
                <div key={n.id} style={{display:'flex',alignItems:'flex-start',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px'}}>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--accent)',fontFamily:'"JetBrains Mono",monospace',flexShrink:0,marginTop:1,whiteSpace:'nowrap'}}>
                    {n.date.slice(5)}{n.time ? ' · ' + n.time : ''}
                  </span>
                  <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:3}}>
                    <span style={{fontSize:13,fontWeight:600,color:'var(--ink)',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{n.title||n.text}</span>
                    {n.description && <span style={{fontSize:12,color:'var(--ink-2)',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{n.description}</span>}
                    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'2px 10px',fontSize:10.5,color:'var(--ink-3)'}}>
                      {n.author && <span>👤 {n.author}</span>}
                      {(n.invited||[]).length > 0 && (
                        <span style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
                          <Icon name="users" size={11}/>
                          {n.invited.map(id => { const i = INSTRUCTORS.find(x=>x.id===id); return i ? (lang==='km'?i.name:(i.en||i.name)) : null; }).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={()=>editNote(n)} title={tr('កែ','Edit')} style={{border:'none',background:'none',cursor:'pointer',color:'var(--ink-3)',fontSize:13,padding:'0 2px',flexShrink:0}}>✎</button>
                  <button onClick={()=>removeNote(n.id)} title={tr('លុប','Delete')} style={{border:'none',background:'none',cursor:'pointer',color:'var(--danger)',fontSize:15,lineHeight:1,padding:'0 2px',flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {bp.mobile
        ? <ScheduleWeek {...viewProps} dayNav={{
            onPrev:  ()=>setDayOffset(o=>o-1),
            onNext:  ()=>setDayOffset(o=>o+1),
            onToday: ()=>setDayOffset(0),
            onPick:  (dateStr)=>setMobileDateAbs(dateStr),
            isToday: mobileDate===today,
          }}/>
        : v==='week'   ? <ScheduleWeek   {...viewProps}/>
        : v==='month'  ? <ScheduleMonth  {...viewProps}/>
        :                <ScheduleAgenda {...viewProps}/>}

      {/* Mobile: PDF export at the bottom — agenda (list) layout reads cleanly on a phone */}
      {bp.mobile && (
        <Btn kind="ghost" size="md" style={{justifyContent:'center'}}
          onClick={()=>generateSchedulePDF({lessons:visibleLessons,weekDates:allWeekDates,viewType:'agenda',labelEn,instFilter,vehFilter,studentFilter})}
          icon={<Icon name="download" size={14}/>}>{tr('ទាញ​យក PDF','Download PDF')}</Btn>
      )}

      {studentMode ? (
        <div style={{display:'flex',gap:18,padding:'8px 4px',fontSize:11,color:'var(--ink-3)'}}>
          {[{l:'Practical KH',c:'a'},{l:'Theory KH',c:'c'},{l:'Practical JP',c:'d'},{l:'Theory JP',c:'e'}].map(t=>(
            <span key={t.l} style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:10,height:10,borderRadius:2,background:LESSON_COLORS[t.c].bg,borderLeft:`2px solid ${LESSON_COLORS[t.c].fg}`}}/>
              {t.l}
            </span>
          ))}
        </div>
      ) : (
        <div style={{display:'flex',gap:12,padding:'8px 4px',fontSize:11,color:'var(--ink-3)',flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontWeight:600,color:'var(--ink-2)'}}>{tr('ពណ៌សិស្ស','Student colours')}:</span>
          {STUDENTS.filter(s=>!isStudentFinished(s)).map(s=>{
            const cc = studentColor(s.id) || LESSON_COLORS.a;
            return (
              <span key={s.id} style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:10,height:10,borderRadius:3,background:cc.bg,border:`1px solid ${cc.fg}`}}/>
                {s.name}
              </span>
            );
          })}
          {STUDENTS.filter(s=>isStudentFinished(s)).length>0 && (
            <span style={{display:'flex',alignItems:'center',gap:5,opacity:.7}}>
              <span style={{width:10,height:10,borderRadius:3,background:FINISHED_STUDENT_COLOR.bg,border:`1px solid ${FINISHED_STUDENT_COLOR.fg}`}}/>
              {tr('បានបញ្ចប់','Graduated')}
            </span>
          )}
        </div>
      )}

      {noteModal && (
        <Modal open onClose={()=>setNoteModal(null)} width={420}>
          <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:16,fontWeight:700}}>
              {noteModal.id ? tr('កែ​ចំណាំ','Edit note') : noteModal.mode ? tr('បន្ថែម​នៅ​ម៉ោង​នេះ','Add at this time') : tr('ចំណាំ​ថ្មី','New note')}
            </div>

            {/* Lesson / Note toggle — only when creating from a time slot */}
            {noteModal.mode && !noteModal.id && (
              <div style={{display:'flex',background:'var(--surface-muted)',borderRadius:9,padding:3,gap:3}}>
                {[{k:'lesson',km:'មេរៀន',en:'Lesson',icon:'plus'},{k:'note',km:'ចំណាំ',en:'Note',icon:'bell'}].map(t=>(
                  <button key={t.k} onClick={()=>setNoteModal(m=>({...m,mode:t.k}))} style={{
                    flex:1,padding:'8px 10px',border:'none',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:600,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                    background: noteModal.mode===t.k ? 'var(--surface)' : 'transparent',
                    color: noteModal.mode===t.k ? 'var(--accent)' : 'var(--ink-3)',
                    boxShadow: noteModal.mode===t.k ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
                  }}><Icon name={t.icon} size={13}/>{tr(t.km,t.en)}</button>
                ))}
              </div>
            )}

            {noteModal.mode === 'lesson' ? (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{fontSize:13,color:'var(--ink-2)',background:'var(--surface-muted)',borderRadius:8,padding:'11px 13px',fontFamily:'"JetBrains Mono",monospace'}}>
                  📅 {noteModal.date}　🕒 {noteModal.time}
                </div>
                <Btn kind="primary" size="lg" icon={<Icon name="plus" size={15}/>} style={{justifyContent:'center'}}
                  onClick={()=>{ const d=noteModal.date, h=noteModal.hour; setNoteModal(null); openForm('newLesson',{date:d,hour:h}); }}>
                  {tr('កក់​មេរៀន​ថ្មី','Book new lesson')}
                </Btn>
                <Btn kind="ghost" size="md" onClick={()=>setNoteModal(null)} style={{justifyContent:'center'}}>{tr('បោះបង់','Cancel')}</Btn>
              </div>
            ) : (
            <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 130px',gap:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',display:'block',marginBottom:5}}>{tr('កាល​បរិច្ឆេទ','Date')}</label>
                <input type="date" value={noteModal.date} onChange={e=>setNoteModal(m=>({...m,date:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box',colorScheme:'light dark'}}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',display:'block',marginBottom:5}}>{tr('ម៉ោង','Time')}</label>
                <input type="time" value={noteModal.time || ''} onChange={e=>setNoteModal(m=>({...m,time:e.target.value}))}
                  style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box',colorScheme:'light dark',fontFamily:'"JetBrains Mono",monospace'}}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',display:'block',marginBottom:5}}>Title</label>
              <input value={noteModal.title||''} onChange={e=>setNoteModal(m=>({...m,title:e.target.value}))}
                placeholder={tr('ឧ. ប្រជុំគ្រូ','e.g. Teacher meeting')} autoFocus
                style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box',fontFamily:'var(--font-km),var(--font-en),inherit'}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',display:'block',marginBottom:5}}>Description</label>
              <textarea value={noteModal.description||''} onChange={e=>setNoteModal(m=>({...m,description:e.target.value}))} rows={3}
                placeholder={tr('ឧ. ប្រជុំគ្រូទាំងអស់ នៅបន្ទប់ប្រជុំ ម៉ោង ២ រសៀល','e.g. All-instructor meeting in the conference room at 2pm')}
                style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box',resize:'vertical',fontFamily:'var(--font-km),var(--font-en),inherit'}}/>
            </div>

            {/* Invite instructors (Google-Calendar style guests) */}
            <div>
              <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',display:'flex',alignItems:'center',gap:5,marginBottom:7}}>
                <Icon name="users" size={13}/> {tr('អញ្ជើញ​គ្រូ','Invite instructors')}
                {(noteModal.invited||[]).length>0 && <span style={{color:'var(--accent)',fontWeight:700}}>· {(noteModal.invited||[]).length}</span>}
              </label>
              {/* Dropdown — instructor names always shown in English */}
              <select value="" onChange={e=>{ if(e.target.value) toggleInvite(e.target.value); }}
                style={{width:'100%',padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box',colorScheme:'light dark'}}>
                <option value="">{tr('+ ជ្រើស​គ្រូ','+ Select instructor')}</option>
                {INSTRUCTORS.filter(i => !(noteModal.invited||[]).includes(i.id)).map(i => (
                  <option key={i.id} value={i.id}>{i.en || i.name}</option>
                ))}
              </select>
              {(noteModal.invited||[]).length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                  {(noteModal.invited||[]).map(id => {
                    const i = INSTRUCTORS.find(x => x.id === id);
                    if (!i) return null;
                    return (
                      <span key={id} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 11px',borderRadius:20,
                        border:'1px solid var(--accent)',background:'var(--accent-soft)',color:'var(--accent)',fontSize:12,fontWeight:600}}>
                        {i.en || i.name}
                        <button onClick={()=>toggleInvite(id)} title={tr('ដក​ចេញ','Remove')}
                          style={{border:'none',background:'none',cursor:'pointer',color:'var(--accent)',fontSize:15,lineHeight:1,padding:0}}>×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              {INSTRUCTORS.length===0 && <span style={{fontSize:12,color:'var(--ink-3)'}}>{tr('មិន​មាន​គ្រូ','No instructors')}</span>}
            </div>

            {/* Author (creator) */}
            <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:5,borderTop:'1px dashed var(--border)',paddingTop:10}}>
              👤 {tr('បង្កើត​ដោយ','Created by')}: <span style={{fontWeight:600,color:'var(--ink-2)'}}>{noteModal.author || meName}</span>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center'}}>
              {noteModal.id
                ? <Btn kind="ghost" size="md" style={{color:'var(--danger)'}} onClick={()=>{ removeNote(noteModal.id); setNoteModal(null); }}>{tr('លុប','Delete')}</Btn>
                : <span/>}
              <div style={{display:'flex',gap:8}}>
                <Btn kind="ghost" size="md" onClick={()=>setNoteModal(null)}>{tr('បោះបង់','Cancel')}</Btn>
                <Btn kind="primary" size="md" onClick={submitNote}>{tr('រក្សាទុក','Save')}</Btn>
              </div>
            </div>
            </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── Schedule PDF Generator ────────────────────────────────────────────────────
const generateSchedulePDF = ({ lessons, weekDates, viewType, labelEn, instFilter, vehFilter, studentFilter }) => {
  const ss   = window.__schoolSettings || {};
  const name = ss.name || 'Anzen Driving School';
  const HOURS = Array.from({length:12}, (_,i) => i+7);
  const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const LC    = { a:'#1A4F96', b:'#1A4F96', c:'#5B2EA0', d:'#1A6B3C', e:'#9B4D10' };
  const LBG   = { a:'#D6E4F5', b:'#D6E4F5', c:'#E5DAF5', d:'#D4F0E4', e:'#FAE8CC' };

  const fmtH = h => `${String(h).padStart(2,'0')}:00`;

  const lessonCard = (l) => {
    const key = l.color || l.cat || 'a';
    const col = LC[key]  || '#444';
    const bg  = LBG[key] || '#eee';
    const ht  = Math.max(1, l.len || 1);
    const inst = INSTRUCTORS.find(i => i.id === l.instId);
    const veh  = VEHICLES.find(v => v.id === l.veh);
    const stu  = STUDENTS.find(s => s.id === l.studentId);
    const typeLabel = key==='e' ? 'Theory JP' : key==='c' ? 'Theory KH' : key==='d' ? 'Practical JP' : 'Practical KH';
    const locLabel  = locLabelOf(l);
    const locBg     = locLabel === 'School' ? '#2A5DB0' : locLabel === 'Course' ? '#B0413E' : '#888';
    const transLabel = veh?.trans || '';
    return `<div style="background:${bg};border:1px solid ${col}55;border-left:3px solid ${col};border-radius:4px;padding:4px 6px;margin-bottom:3px;font-size:10px;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:1px">
        <span style="font-weight:700;color:${col};font-size:9px;text-transform:uppercase">${typeLabel}</span>
        ${locLabel ? `<span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:${locBg};color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">${locLabel}</span>` : ''}
        ${transLabel ? `<span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:${transLabel==='MT'?'#7A3B2B':'#3B7A57'};color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">${transLabel}</span>` : ''}
      </div>
      ${stu ? `<div style="font-weight:600;color:#222">${stu.name||''}</div>` : ''}
      <div style="color:#555">${inst ? (inst.en||inst.name||'') : '—'}</div>
      <div style="color:#888;font-size:9px">${veh ? veh.plate : '—'} · ${fmtH(l.h)}-${fmtH(l.h+(l.len||1))}</div>
    </div>`;
  };

  let filterInfo = '';
  if (instFilter) { const i = INSTRUCTORS.find(x=>x.id===instFilter); filterInfo = `Instructor: ${i?i.en:instFilter}`; }
  else if (vehFilter) { const v = VEHICLES.find(x=>x.id===vehFilter); filterInfo = `Vehicle: ${v?v.plate:vehFilter}`; }
  else if (studentFilter) { const s = STUDENTS.find(x=>x.id===studentFilter); filterInfo = `Student: ${s?s.name:studentFilter}`; }

  let bodyHTML = '';

  if (viewType === 'agenda') {
    const grouped = {};
    lessons.forEach(l => { if (!grouped[l.date]) grouped[l.date] = []; grouped[l.date].push(l); });
    const dates = Object.keys(grouped).sort();
    if (dates.length === 0) {
      bodyHTML = `<p style="color:#888;text-align:center;padding:20px">No lessons in this period.</p>`;
    } else {
      bodyHTML = dates.map(date => {
        const dayLessons = grouped[date].sort((a,b) => a.h - b.h);
        const d = new Date(date+'T00:00:00');
        const dayLabel = DAYS[d.getDay()===0?6:d.getDay()-1];
        return `<div style="margin-bottom:16px">
          <div style="font-size:12px;font-weight:700;color:#1A4F96;padding:6px 10px;background:#E8F0FB;border-radius:6px;margin-bottom:6px">${dayLabel} ${date}</div>
          ${dayLessons.map(l => `<div style="display:flex;gap:10px;padding:6px 10px;border-bottom:1px solid #eee;align-items:flex-start">
            <div style="min-width:78px;font-size:11px;font-weight:600;color:#444;font-family:monospace">${fmtH(l.h)}-${fmtH(l.h+(l.len||1))}</div>
            <div style="flex:1">${lessonCard(l)}</div>
          </div>`).join('')}
        </div>`;
      }).join('');
    }
  } else {
    // Week/month table
    const allDates = weekDates.length ? weekDates : [];
    bodyHTML = `<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px">
      <thead>
        <tr>
          <th style="width:50px;padding:6px;border:1px solid #ddd;background:#f5f5f3;font-size:10px;color:#888">Time</th>
          ${allDates.map((date,i) => {
            const d = new Date(date+'T00:00:00');
            const isSun = d.getDay() === 0;
            const dayLbl = DAYS[i] || '';
            const dayNum = date ? parseInt(date.slice(8)) : '';
            return `<th style="padding:6px;border:1px solid #ddd;background:${isSun?'#fff0f0':'#f5f5f3'};color:${isSun?'#c04040':'#333'};font-size:10px">
              <div style="font-weight:700">${dayLbl}</div>
              <div style="font-size:12px;font-weight:600">${dayNum}</div>
            </th>`;
          }).join('')}
        </tr>
      </thead>
      <tbody>
        ${HOURS.map(h => `<tr>
          <td style="padding:4px 6px;border:1px solid #eee;background:#fafaf7;font-family:monospace;font-size:10px;color:#888;vertical-align:top;white-space:nowrap">${fmtH(h)}</td>
          ${allDates.map(date => {
            const slotLessons = lessons.filter(l => l.date === date && l.status !== 'cancelled' && l.h <= h && h < l.h + (l.len||1));
            return `<td style="padding:3px;border:1px solid #eee;vertical-align:top;min-height:30px">
              ${slotLessons.map(l => lessonCard(l)).join('')}
            </td>`;
          }).join('')}
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  const bodyContent = `
  <div style="padding:16px 20px 10px;border-bottom:2px solid #1A4F96;display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px">
    <div>
      <div style="font-size:18px;font-weight:700;color:#1A4F96">${name}</div>
      <div style="font-size:13px;font-weight:600;color:#333;margin-top:2px">
        ${viewType==='agenda'?'Agenda':'Weekly Schedule'} · ${labelEn}
      </div>
      ${filterInfo ? `<div style="font-size:11px;color:#777;margin-top:2px">Filter: ${filterInfo}</div>` : ''}
    </div>
    <div style="text-align:right;font-size:10px;color:#aaa">
      <div>Printed: ${new Date().toLocaleDateString()}</div>
      <div>${lessons.length} lesson${lessons.length!==1?'s':''}</div>
    </div>
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;padding:0 20px 10px;font-size:10px;color:#555;align-items:center">
    ${[['Practical KH','a'],['Theory KH','c'],['Practical JP','d'],['Theory JP','e']].map(([lbl,k])=>
      `<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:11px;height:11px;border-radius:3px;background:${LBG[k]};border:1px solid ${LC[k]};-webkit-print-color-adjust:exact;print-color-adjust:exact"></span>${lbl}</span>`
    ).join('')}
    <span style="width:1px;height:12px;background:#ddd"></span>
    <span style="display:inline-flex;align-items:center;gap:5px"><span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:#2A5DB0;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">School</span> ទីតាំង​សាលា</span>
    <span style="display:inline-flex;align-items:center;gap:5px"><span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:#B0413E;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact">Course</span> ទីលាន​ហ្វឹក​ហាត់</span>
  </div>
  <div style="padding:0 20px 20px">${bodyHTML}</div>`;

  // Render in an in-app overlay (not a new window) so the user can always tap
  // Back to return to the app — a new tab/print view traps users on mobile.
  const HOST_ID = '__anzenPdfHost';
  document.getElementById(HOST_ID)?.remove();
  document.getElementById('__anzenPdfStyle')?.remove();

  const style = document.createElement('style');
  style.id = '__anzenPdfStyle';
  style.textContent = `
    #${HOST_ID}{position:fixed;inset:0;z-index:100000;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch}
    #${HOST_ID} .pdf-paper{font-family:Inter,'Khmer OS','Battambang',sans-serif;font-size:12px;color:#222;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @media print{
      body > *:not(#${HOST_ID}){display:none !important}
      #${HOST_ID}{position:static !important;overflow:visible !important}
      #${HOST_ID} .pdf-toolbar{display:none !important}
      @page{size:A4 landscape;margin:12mm}
    }`;
  document.head.appendChild(style);

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.innerHTML = `
    <div class="pdf-toolbar" style="position:sticky;top:0;z-index:2;display:flex;gap:8px;justify-content:space-between;align-items:center;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 12px;background:#1A4F96;color:#fff;box-shadow:0 1px 8px rgba(0,0,0,.25)">
      <button id="__pdfBack" style="display:inline-flex;align-items:center;gap:6px;border:none;background:rgba(255,255,255,.2);color:#fff;font-size:15px;font-weight:600;padding:10px 16px;border-radius:9px;cursor:pointer">⬅ ត្រឡប់ · Back</button>
      <button id="__pdfPrint" style="display:inline-flex;align-items:center;gap:6px;border:none;background:#fff;color:#1A4F96;font-size:15px;font-weight:700;padding:10px 16px;border-radius:9px;cursor:pointer">🖨 បោះពុម្ព / PDF</button>
    </div>
    <div class="pdf-paper">${bodyContent}</div>`;
  document.body.appendChild(host);

  const cleanup = () => { host.remove(); style.remove(); };
  host.querySelector('#__pdfBack').onclick  = cleanup;
  host.querySelector('#__pdfPrint').onclick = () => { try { window.print(); } catch(e) {} };
};
const FleetScreen = ({ role = 'admin' }) => {
  const { toast, openForm, openDetail, navigate, tr } = useAppActions();
  const [ver, setVer] = React.useState(0);
  React.useEffect(() => {
    const refresh = () => setVer(n => n+1);
    window.__notifyVehiclesChanged = refresh;
    window.__notifyLessonsChanged  = refresh;
    return () => { delete window.__notifyVehiclesChanged; delete window.__notifyLessonsChanged; };
  }, []);

  const today = todayStr();
  const workshop  = VEHICLES.filter(v => v.status === 'Workshop');
  const inUseToday = VEHICLES.filter(v => LESSONS.some(l => l.veh === v.id && l.date === today && l.status !== 'cancelled'));
  const totalVehs  = VEHICLES.length;
  const utilPct    = totalVehs > 0 ? Math.round((inUseToday.length / totalVehs) * 100) : 0;

  return (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km={`យានយន្ត · ${totalVehs} គ្រឿង${workshop.length > 0 ? ` · ${workshop.length} ស្ថិត​ក្នុង​ហាង` : ''}`}
      en={`Fleet · ${totalVehs} vehicle${totalVehs !== 1 ? 's' : ''}${workshop.length > 0 ? ` · ${workshop.length} in workshop` : ''}`}
      action={
        <div style={{display:'flex',gap:8}}>
          {role!=='student' && <Btn kind="ghost" size="md" onClick={()=>openForm('newMaintenance')} icon={<Icon name="wrench" size={14}/>}>{tr('កាលវិភាគ​ថែទាំ','Maintenance')}</Btn>}
          {role!=='student' && <Btn kind="primary" size="md" onClick={()=>openForm('newVehicle')} icon={<Icon name="plus" size={14}/>}>{tr('បន្ថែម​យានយន្ត','Add vehicle')}</Btn>}
        </div>
      }
    />

    {/* KPIs */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      <Card><Stat label={tr('ការ​ប្រើ​ប្រាស់','Utilization')} value={totalVehs > 0 ? `${utilPct}%` : '—'}/></Card>
      <Card><Stat label={tr('ប្រើ​ថ្ងៃ​នេះ','In use today')} value={`${inUseToday.length} / ${totalVehs}`}/></Card>
      <Card><Stat label={tr('កំពុង​ថែទាំ','In service')} value={workshop.length} sub={workshop.map(v=>v.plate).join(', ')||'—'}/></Card>
      <Card><Stat label={tr('ថែទាំ​ខ្ជះ','Maintenance due')} value={(window.__maintenanceData||[]).filter(m=>!m.done).length} sub={tr('នៅ​ខ្ជះ','pending')}/></Card>
    </div>

    <Card pad={0}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'80px 1fr 1fr 1fr 1fr 1fr',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
        <div></div>
        <div>{tr('យានយន្ត','Vehicle')}</div>
        <div>{tr('ថ្នាក់','Class')}</div>
        <div>{tr('ឈ្នាន់','Odometer')}</div>
        <div>{tr('ថែទាំ','Service')}</div>
        <div>{tr('ផ្ដល់​ឲ្យ · ស្ថានភាព','Assigned · Status')}</div>
      </div>
      {VEHICLES.map((v,i)=>{
        const todayLessons = LESSONS.filter(l=>l.veh===v.id&&l.date===todayStr()&&l.status!=='cancelled');
        return (
        <div key={v.id} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'80px 1fr 1fr 1fr 1fr 1fr',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none'}}>
          <div onClick={()=>openDetail('vehicle', v)} style={{cursor:'pointer'}}><Photo tag={v.photo} w={70} h={48} r={6}/></div>
          <div onClick={()=>openDetail('vehicle', v)} style={{cursor:'pointer'}}>
            <div style={{fontSize:13,fontWeight:500}}>{v.make}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{v.plate}</div>
          </div>
          <div style={{fontSize:12,color:'var(--ink-2)'}}>{v.cls}</div>
          <div>
            <div style={{fontSize:13,fontVariantNumeric:'tabular-nums',fontWeight:500}}>{v.km.toLocaleString()} <span style={{fontSize:11,color:'var(--ink-3)',fontWeight:400}}>km</span></div>
            <div style={{height:4,background:'var(--surface-muted)',borderRadius:999,marginTop:4,overflow:'hidden',width:80}}>
              <div style={{width:`${Math.min(100,v.km/1000)}%`,height:'100%',background:'var(--ink-3)'}}/>
            </div>
          </div>
          <div style={{fontSize:12}}>
            <div style={{color: v.service==='Today'||v.service==='Brake pads' ? 'var(--warn)' : 'var(--ink-2)'}}>{v.service}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{v.service==='OK' ? 'next 10k km' : 'check log'}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-start'}}>
            <div style={{fontSize:12,color:'var(--ink-2)'}}>{v.inst}</div>
            <div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
              <Badge tone={v.status==='Active'?'good':v.status==='Service due'?'warn':'danger'}>{v.status}</Badge>
              {todayLessons.length > 0 && <Badge tone="accent">{todayLessons.length} {tr('ថ្ងៃ​នេះ','today')}</Badge>}
            </div>
            {v.status !== 'Workshop' && (
              <Btn kind="ghost" size="sm" onClick={()=>{ window.__scheduleVehFilter=v.id; navigate('schedule'); }} icon={<Icon name="cal" size={11}/>}>
                {tr('ប្រតិទិន','Schedule')}
              </Btn>
            )}
          </div>
        </div>
        );
      })}
    </Card>

    {/* Maintenance timeline */}
    <Card label={tr('ការ​ថែទាំ​ខាង​មុខ','UPCOMING MAINTENANCE')}>
      {(() => {
        const upcoming = (window.__maintenanceData||[]).filter(m=>!m.done).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
        if (upcoming.length === 0) return (
          <div style={{padding:20,fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>
            {tr('មិន​ទាន់​មាន​ · ប្រើ​ប៊ូតុង "Maintenance" ដើម្បី​បន្ថែម','No maintenance scheduled · use the Maintenance button to add')}
          </div>
        );
        return upcoming.slice(0,6).map((m,i) => {
          const v = vehById(m.vehId);
          return (
            <div key={i} style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr 120px',gap:14,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none',alignItems:'center'}}>
              <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{m.date}</div>
              <div style={{fontSize:12,fontWeight:500}}>{v ? v.make : (m.vehId || '—')}</div>
              <div style={{fontSize:12,color:'var(--ink-2)'}}>{m.type}</div>
              <Badge tone={m.urgent ? 'warn' : 'neutral'}>{m.shop || 'in-house'}</Badge>
            </div>
          );
        });
      })()}
    </Card>
  </div>
  );
};

// ── Progress ──
const ProgressScreen = ({ role = 'admin', studentId }) => {
  const { toast, openDetail, tr } = useAppActions();
  const [range, setRange] = React.useState('month');

  // Student role: personal progress view only
  if (role === 'student') {
    const me = STUDENTS.find(s => s.id === studentId) || STUDENTS[0];
    const mockScores = [72, 75, 79, 82, 85, 88];
    const pct = Math.round((me.hours / me.target) * 100);

    const { curriculumDone: done, curriculumFeedback: feedback } = useAppActions();
    const [openStages, setOpenStages] = React.useState({stage1: true, stage2: false});

    const totalTopics = CURRICULUM.reduce((a, s) => a + s.topics.length, 0);
    const totalDone   = CURRICULUM.reduce((a, s) => a + s.topics.filter(t2 => done.has(t2.id)).length, 0);

    return (
      <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:800}}>
        <SectionTitle km="វឌ្ឍនភាព​របស់​ខ្ញុំ" en="My progress"/>

        {/* KPI strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          <Card><Stat label={tr('ម៉ោង​បាន​បញ្ចប់','Hours completed')} value={`${me.hours}h`} sub={`/${me.target}h ${tr('គោល​ដៅ','target')}`}/></Card>
          <Card><Stat label={tr('ប្រឡង​សាកល្បង​ចុង​ក្រោយ','Latest mock score')} value={`${mockScores[mockScores.length-1]}`} delta="+3"/></Card>
          <Card><Stat label={tr('ប្រឡង​ពិត','Road exam')} value={me.next} sub={tr('ការ​ណាត់​ជួប​បន្ទាប់','next appointment')}/></Card>
        </div>

        {/* Hours progress bar */}
        <Card label={tr('ដំណើរ​ការ​ម៉ោង​បង្រៀន','LESSON HOURS PROGRESS')}>
          <div style={{marginTop:8,marginBottom:6}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--ink-3)',marginBottom:6}}>
              <span>{me.hours}h {tr('រួច','done')}</span>
              <span>{me.target - me.hours}h {tr('នៅ​សល់','remaining')}</span>
            </div>
            <div style={{height:10,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:'var(--accent)',borderRadius:99,transition:'width .6s'}}/>
            </div>
            <div style={{textAlign:'center',marginTop:6,fontSize:12,fontWeight:600,color:'var(--accent)'}}>{pct}% {tr('បាន​បញ្ចប់','complete')}</div>
          </div>
        </Card>

        {/* Mock scores */}
        <Card label={tr('ពិន្ទុ​ប្រឡង​សាកល្បង','MOCK TEST SCORES')}>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:120,marginTop:8}}>
            {mockScores.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontSize:11,fontWeight:i===mockScores.length-1?700:400,color:i===mockScores.length-1?'var(--accent)':'var(--ink-3)'}}>{v}</div>
                <div style={{width:'100%',height:`${(v/100)*90}px`,background:'var(--accent)',borderRadius:'4px 4px 0 0',opacity:i===mockScores.length-1?1:.4}}/>
                <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>#{i+1}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Areas to improve */}
        <Card label={tr('ចំណុច​ត្រូវ​ធ្វើ​ល្អ​ជា​ងមុន','AREAS TO IMPROVE')}>
          <BarRow label={tr('ចត​ស​ម​ភាគ​ី','Parallel parking')} value={55} max={100} sub="55%"/>
          <BarRow label={tr('ប្ដូរ​ហ្លង','Lane changes')} value={72} max={100} sub="72%"/>
          <BarRow label={tr('វង់​មូល','Roundabouts')} value={68} max={100} sub="68%"/>
          <BarRow label={tr('ពិនិត្យ​កញ្ចក់','Mirror checks')} value={80} max={100} sub="80%"/>
        </Card>

        {/* ── Curriculum tracker ── */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          {/* Header */}
          <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14}}>{tr('វគ្គ​សិក្សា​ ​ B Class','Class B Curriculum')}</div>
              <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>
                {totalDone}/{totalTopics} {tr('មេរៀន​បញ្ចប់','topics completed')}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:22,fontWeight:700,letterSpacing:'-.02em',color:'var(--accent)'}}>{Math.round((totalDone/totalTopics)*100)}%</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div style={{height:4,background:'var(--border)'}}>
            <div style={{height:'100%',width:`${(totalDone/totalTopics)*100}%`,background:'var(--accent)',transition:'width .4s'}}/>
          </div>

          {/* Stage sections */}
          {CURRICULUM.map(stage => {
            const stageDone = stage.topics.filter(t2 => done.has(t2.id)).length;
            const stageTotal = stage.topics.length;
            const isOpen = openStages[stage.id];
            const stagePct = Math.round((stageDone/stageTotal)*100);

            return (
              <div key={stage.id} style={{borderBottom:'1px solid var(--border)'}}>
                {/* Stage header — clickable to collapse */}
                <button onClick={()=>setOpenStages(p=>({...p,[stage.id]:!p[stage.id]}))} style={{
                  width:'100%',padding:'14px 18px',display:'flex',alignItems:'center',gap:14,
                  background:'var(--surface-muted)',border:'none',cursor:'pointer',font:'inherit',
                  color:'inherit',textAlign:'left',
                }}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600}}>{tr(stage.km, stage.en)}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3,display:'flex',alignItems:'center',gap:8}}>
                      <span>{stageDone}/{stageTotal} {tr('មេរៀន','topics')}</span>
                      <div style={{flex:1,height:4,background:'var(--border)',borderRadius:99,overflow:'hidden',maxWidth:120}}>
                        <div style={{height:'100%',width:`${stagePct}%`,background:stagePct===100?'var(--good)':'var(--accent)',borderRadius:99,transition:'width .4s'}}/>
                      </div>
                      <span style={{fontWeight:600,color:stagePct===100?'var(--good)':'var(--accent)'}}>{stagePct}%</span>
                    </div>
                  </div>
                  <div style={{
                    width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',
                    transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform .2s',
                  }}>
                    <Icon name="arrow" size={14} color="var(--ink-3)"/>
                  </div>
                </button>

                {/* Topic list — read-only for student */}
                {isOpen && (
                  <div style={{padding:'4px 0'}}>
                    {stage.topics.map((topic, idx) => {
                      const isDone = done.has(topic.id);
                      const topicFeedback = (feedback || {})[topic.id] || '';
                      const isAssessment = topic.id === 's1-23' || topic.id === 's2-16';
                      return (
                        <div key={topic.id} style={{
                          padding:'10px 18px 10px 20px',
                          display:'flex',alignItems:'flex-start',gap:12,
                          borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                          background: isDone ? 'rgba(59,122,87,.04)' : 'transparent',
                        }}>
                          {/* Read-only indicator */}
                          <div style={{
                            width:20,height:20,borderRadius:6,
                            border:`2px solid ${isDone?'var(--good)':'var(--border-strong)'}`,
                            background:isDone?'var(--good)':'transparent',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            flexShrink:0,marginTop:1,
                          }}>
                            {isDone && <Icon name="check" size={11} color="#fff" stroke={3}/>}
                          </div>

                          <div style={{flex:1,minWidth:0}}>
                            <div style={{
                              fontSize:13,lineHeight:1.4,
                              color:isDone?'var(--ink-3)':'var(--ink)',
                              textDecoration:isDone?'line-through':'none',
                              fontWeight:isAssessment?600:400,
                            }}>
                              {tr(topic.km, topic.en)}
                              {isAssessment && <span style={{marginLeft:6,fontSize:9,background:'var(--warn)',color:'#fff',padding:'1px 5px',borderRadius:4}}>ASSESSMENT</span>}
                            </div>
                            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:1}}>{topic.id.toUpperCase()}</div>

                            {/* Instructor feedback — visible to student */}
                            {topicFeedback && (
                              <div style={{
                                marginTop:7,padding:'7px 11px',
                                background:'var(--accent-soft)',borderLeft:'3px solid var(--accent)',
                                borderRadius:'0 6px 6px 0',fontSize:12,color:'var(--ink-2)',lineHeight:1.5,
                              }}>
                                <div style={{fontSize:9,color:'var(--accent)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:3}}>
                                  {tr('មតិ​គ្រូ','INSTRUCTOR NOTE')}
                                </div>
                                {topicFeedback}
                              </div>
                            )}
                          </div>

                          {isDone && <Badge tone="good" style={{flexShrink:0}}>{tr('បញ្ចប់','Done')}</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  const rangeLabel = {
    week:    tr('សប្ដាហ៍​នេះ','This week'),
    month:   tr('ខែ​នេះ','This month'),
    quarter: tr('ត្រីមាស','Quarter'),
    year:    tr('ឆ្នាំ','Year'),
  };
  return (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="វឌ្ឍនភាព និងការត្រៀម​ប្រឡង"
      en="Progress & exam readiness"
      action={
        <div style={{display:'flex',gap:8}}>
          <Dropdown align="right" width={180} trigger={
            <Btn kind="ghost" size="md" icon={<Icon name="cal" size={13}/>}>{rangeLabel[range]}</Btn>
          }>
            <MenuItem onClick={()=>setRange('week')}>{rangeLabel.week}</MenuItem>
            <MenuItem onClick={()=>setRange('month')}>{rangeLabel.month}</MenuItem>
            <MenuItem onClick={()=>setRange('quarter')}>{rangeLabel.quarter}</MenuItem>
            <MenuItem onClick={()=>setRange('year')}>{rangeLabel.year}</MenuItem>
          </Dropdown>
          {role!=='student' && <Btn kind="ghost" size="md" onClick={()=>toast(tr('កំពុង​បង្កើត PDF','Generating report.pdf'),'good')}>{tr('នាំចេញ​របាយការណ៍','Export report')}</Btn>}
        </div>
      }
    />

    {(() => {
      const clearedStudents = STUDENTS.filter(s => s.status === 'Cleared');
      const examStudents = STUDENTS.filter(s => s.status === 'Road exam soon');
      const avgMockAll = STUDENTS.length > 0 ? Math.round(STUDENTS.reduce((a,s)=>a+(s.mock_avg||0),0)/STUDENTS.length) : '—';
      const avgHours = clearedStudents.length > 0 ? Math.round(clearedStudents.reduce((a,s)=>a+(s.hours||0),0)/clearedStudents.length) : '—';
      return (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Card><Stat label={tr('បានជាប់','Cleared')} value={clearedStudents.length} sub={tr('ទាំង​អស់','total')}/></Card>
          <Card><Stat label={tr('ម៉ោង​សិក្សា​មធ្យម','Avg hours')} value={avgHours} sub={tr('ដើម្បី​ជោគជ័យ','to clear')}/></Card>
          <Card><Stat label={tr('នឹង​ប្រឡង','Exam-ready')} value={examStudents.length} sub={tr('ខាង​មុខ','upcoming')}/></Card>
          <Card><Stat label={tr('ប្រឡង​សាកល្បង​មធ្យម','Mock avg')} value={avgMockAll}/></Card>
        </div>
      );
    })()}

    <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12}}>
      <Card label={tr('ប្រឡង​សាកល្បង ៦ ខែ​ចុង​ក្រោយ','MOCK TEST SCORES · 6 MONTHS')}>
        <div style={{display:'flex',alignItems:'flex-end',gap:6,height:160,marginTop:8}}>
          {[68,72,75,78,82,84].map((v,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{v}</div>
              <div style={{
                width:'100%',height:`${v}%`,background:'var(--accent)',
                borderRadius:'4px 4px 0 0',
                opacity: i===5 ? 1 : .5,
              }}/>
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{['Jan','Feb','Mar','Apr','May','Jun'][i]}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card label={tr('ចំណុច​ខ្សោយ​លើ​ផ្លូវ','COMMON ROAD ERRORS')}>
        <BarRow label="Parallel parking" value={42} max={100} sub="42%"/>
        <BarRow label="Lane changes" value={31} max={100} sub="31%"/>
        <BarRow label="Roundabouts" value={22} max={100} sub="22%"/>
        <BarRow label="Mirror checks" value={18} max={100} sub="18%"/>
        <BarRow label="Hill starts" value={11} max={100} sub="11%"/>
        <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>បានវិភាគពី ៦០ ដំណើរ​ប្រឡងសាកល្បង​ ខែឧសភា</div>
      </Card>
    </div>

    <Card label={tr('សិស្ស​ត្រៀម​ប្រឡង​សប្ដាហ៍​នេះ','EXAM-READY THIS WEEK')}>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1.4fr 1fr',gap:14,padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
        <div>{tr('សិស្ស','Student')}</div>
        <div>{tr('ម៉ោង / គោល​ដៅ','Hours / target')}</div>
        <div>{tr('ប្រឡង​សាក · ទិស','Mock avg · trend')}</div>
        <div>{tr('កាល​បរិច្ឆេទ​ប្រឡង','Exam date')}</div>
      </div>
      {STUDENTS.filter(s => s.status === 'Road exam soon' || s.hours >= s.target).map((s,i)=>(
        <div key={s.id} onClick={()=>openDetail('student', s)} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1.4fr 1fr',gap:14,padding:'12px 0',borderBottom:i<3?'1px solid var(--border)':'none',alignItems:'center',cursor:'pointer'}}>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <Avatar tag={s.photo} size={32}/>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.cls} · {s.inst}</div>
            </div>
          </div>
          <div style={{fontVariantNumeric:'tabular-nums',fontSize:13}}>{s.hours}/{s.target} <span style={{color:'var(--ink-3)',fontSize:11}}>h</span></div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--good)'}}>{[88,92,86,90][i%4]}</div>
            <Spark data={[78,80,82,84,86,90]} w={90} h={20}/>
          </div>
          <div style={{fontSize:12,color:'var(--ink-2)'}}>{s.next}</div>
        </div>
      ))}
    </Card>
  </div>
  );
};

// ── Billing ──
const BillingScreen = ({ role = 'admin', studentId }) => {
  const { toast, openForm, openDetail, tr } = useAppActions();
  const [billingFilter, setBillingFilter] = React.useState('All');

  // Student role: show only own invoices
  if (role === 'student') {
    const myInvoices = INVOICES.filter(v => v.student === studentId);
    const paid   = myInvoices.filter(v => v.status === 'Paid').reduce((a,v)=>a+v.amount,0);
    const due    = myInvoices.filter(v => v.status !== 'Paid').reduce((a,v)=>a+v.amount,0);
    return (
      <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:760}}>
        <SectionTitle km="ការ​ទូទាត់​របស់​ខ្ញុំ" en="My payments"/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          <Card><Stat label={tr('វិក្កយបត្រ​សរុប','Total invoices')} value={myInvoices.length}/></Card>
          <Card><Stat label={tr('បាន​ទូទាត់','Paid')} value={`$${paid}`}/></Card>
          <Card><Stat label={tr('នៅ​សល់​ត្រូវ​បង់','Outstanding')} value={`$${due}`} sub={due>0?tr('ត្រូវ​ទូទាត់','due'):undefined}/></Card>
        </div>
        <Card pad={0}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:13}}>
            {tr('វិក្កយបត្រ​របស់​ខ្ញុំ','My invoices')}
          </div>
          {myInvoices.length === 0 ? (
            <div style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>{tr('មិន​មាន​វិក្កយបត្រ','No invoices yet')}</div>
          ) : myInvoices.map((v,i) => (
            <div key={v.id} onClick={()=>openDetail('invoice',v)} style={{
              padding:'14px 16px',borderTop: i?'1px solid var(--border)':'none',
              display:'flex',alignItems:'center',gap:14,cursor:'pointer',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}
            >
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3}}>
                  <span style={{fontSize:12,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{v.id}</span>
                  <Badge tone={v.status==='Paid'?'good':v.status==='Pending'?'warn':'danger'}>{v.status}</Badge>
                </div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{v.date} · {v.method !== '—' ? v.method : tr('មិន​ទាន់​បង់','Unpaid')}</div>
              </div>
              <div style={{fontSize:18,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>${v.amount}</div>
              {v.status !== 'Paid' && (
                <Btn kind="primary" size="sm" onClick={e=>{e.stopPropagation();toast(tr('ត្រូវ​ការ​​ការ​ទូទាត់','Payment required · ABA / Wing'),'warn');}}>
                  {tr('ទូទាត់','Pay now')}
                </Btn>
              )}
            </div>
          ))}
        </Card>
        <Card label={tr('គម្រោង​វគ្គ​សិក្សា​របស់​ខ្ញុំ','MY COURSE PLAN')}>
          <div style={{display:'flex',gap:14,alignItems:'center',padding:'10px 0'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:15}}>Class B · ស្ដង់ដារ</div>
              <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>30 {tr('ម៉ោង​បង្រៀន','hours')} · {tr('បាន​ចុះ​ឈ្មោះ','Enrolled')}</div>
            </div>
            <div style={{fontSize:22,fontWeight:700}}>$180</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="វិក្កយបត្រ និងការ​ទូទាត់"
      en="Billing & payments"
      action={
        <div style={{display:'flex',gap:8}}>
          {role!=='student' && <Btn kind="ghost" size="md" onClick={()=>toast(tr('កំពុង​ទាញ​យក invoices.csv','Downloading invoices.csv'),'good')}>{tr('នាំចេញ','Export')}</Btn>}
          {role!=='student' && <Btn kind="primary" size="md" onClick={()=>openForm('newInvoice')} icon={<Icon name="plus" size={14}/>}>{tr('បង្កើត​វិក្កយបត្រ','New invoice')}</Btn>}
        </div>
      }
    />

    {(() => {
      const paidInv = INVOICES.filter(v => v.status === 'Paid');
      const pendingInv = INVOICES.filter(v => v.status === 'Pending' || v.status === 'Overdue');
      const overdueInv = INVOICES.filter(v => v.status === 'Overdue');
      const totalRev = paidInv.reduce((a,v) => a + (v.amount||0), 0);
      const totalOut = pendingInv.reduce((a,v) => a + (v.amount||0), 0);
      const totalOvr = overdueInv.reduce((a,v) => a + (v.amount||0), 0);
      const avgPer = STUDENTS.length > 0 && totalRev > 0 ? Math.round(totalRev / STUDENTS.length) : '—';
      return (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          <Card><Stat label={tr('ចំណូល​សរុប','Total revenue')} value={totalRev > 0 ? `$${totalRev.toLocaleString()}` : '$0'}/></Card>
          <Card><Stat label={tr('មិន​ទាន់​ទូទាត់','Outstanding')} value={`$${totalOut}`} sub={`${pendingInv.length} ${tr('វិក្កយបត្រ','invoices')}`}/></Card>
          <Card><Stat label={tr('ហួស​កាល​កំណត់','Overdue')} value={`$${totalOvr}`} sub={`${overdueInv.length} ${tr('វិក្កយបត្រ','invoices')}`}/></Card>
          <Card><Stat label={tr('មធ្យម​ភាគ​​ / សិស្ស','Avg / student')} value={avgPer === '—' ? '—' : `$${avgPer}`}/></Card>
        </div>
      );
    })()}

    <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12}}>
      <Card pad={0}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:13,fontWeight:600}}>{tr('វិក្កយបត្រ​ថ្មីៗ','Recent invoices')}</div>
          <div style={{flex:1}}/>
          <div style={{display:'flex',gap:4}}>
            {['All','Paid','Pending','Overdue'].map((t)=>(
              <button key={t} onClick={()=>setBillingFilter(t)} style={{
                padding:'4px 10px',
                background: billingFilter===t?'var(--ink)':'var(--surface-muted)',
                color: billingFilter===t?'var(--bg)':'var(--ink-2)',
                border:'1px solid '+(billingFilter===t?'var(--ink)':'var(--border)'),
                borderRadius:999,fontSize:11,fontWeight:500,cursor:'pointer',
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.2fr 1.4fr 0.8fr 0.8fr 0.8fr',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
          <div>{tr('វិក្កយបត្រ','Invoice')}</div><div>{tr('សិស្ស','Student')}</div><div>{tr('កាល​បរិច្ឆេទ','Date')}</div><div>{tr('វិធី','Method')}</div><div style={{textAlign:'right'}}>{tr('ចំនួន · ស្ថានភាព','Amount · Status')}</div>
        </div>
        {INVOICES.filter(v => billingFilter==='All' ? true : v.status===billingFilter).length === 0 && (
          <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
            <div style={{fontSize:24,marginBottom:8}}>🧾</div>
            {tr('មិន​ទាន់​មាន​វិក្កយបត្រ','No invoices yet')}
          </div>
        )}
        {INVOICES.filter(v => billingFilter==='All' ? true : v.status===billingFilter).map((v,i)=>{
          const s = studentById(v.student);
          return (
            <div key={v.id} onClick={()=>openDetail('invoice', v)} style={{padding:'14px 16px',display:'grid',gridTemplateColumns:'1.2fr 1.4fr 0.8fr 0.8fr 0.8fr',gap:14,alignItems:'center',borderTop:'1px solid var(--border)',cursor:'pointer'}}>
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,color:'var(--ink-2)'}}>{v.id}</div>
              <div style={{display:'flex',gap:8,alignItems:'center',minWidth:0}}>
                <Avatar tag={s?.photo} size={24}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tr ? tr(s?.name, s?.en) : s?.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.cls}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--ink-2)'}}>{v.date}</div>
              <div style={{fontSize:12,color:'var(--ink-2)'}}>{v.method}</div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                <div style={{fontSize:14,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>${v.amount}</div>
                <Badge tone={v.status==='Paid'?'good':v.status==='Pending'?'warn':v.status==='Overdue'?'danger':'neutral'}>{v.status}</Badge>
              </div>
            </div>
          );
        })}
      </Card>

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Card label={tr('វិធី​សាស្ត្រ​ទូទាត់','PAYMENT METHODS')}>
          <BarRow label="ABA Mobile" value={62} max={100} sub="62%"/>
          <BarRow label="Cash" value={18} max={100} sub="18%"/>
          <BarRow label="Wing" value={12} max={100} sub="12%"/>
          <BarRow label="Bank transfer" value={8} max={100} sub="8%"/>
        </Card>
        <Card label={tr('គម្រោង​វគ្គ​សិក្សា','COURSE PLANS')}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {n:'Class B · ស្ដង់ដារ', p:'$180', d:'30 ម៉ោងបង្រៀន',active:true},
              {n:'Class B · ផ្លាស់ប្តូរលេខ', p:'$220', d:'+ការបង់ប្រឡង'},
              {n:'Class A · ម៉ូតូ', p:'$110', d:'18 ម៉ោងបង្រៀន'},
              {n:'Class C · ឡានដឹកទំនិញ', p:'$320', d:'40 ម៉ោងបង្រៀន'},
            ].map((p,i)=>(
              <div key={i} onClick={()=>role!=='student' && toast(`កែ​​​​​​ ${p.n} (coming soon)`,'neutral')} style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:p.active?'var(--surface-muted)':'transparent',border:'1px solid var(--border)',borderRadius:8,cursor:role!=='student'?'pointer':'default'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{p.n}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{p.d}</div>
                </div>
                <div style={{fontSize:16,fontWeight:600,fontFamily:'var(--font-display)'}}>{p.p}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
  );
};

Object.assign(window, { ScheduleScreen, FleetScreen, ProgressScreen, BillingScreen, LESSON_COLORS, slotAvailability, dayAvailabilitySummary });
