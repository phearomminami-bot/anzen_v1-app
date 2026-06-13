// details.jsx — modal/drawer content for "view detail" actions
// Lesson detail, Student profile, Instructor profile, Vehicle detail, Invoice preview

// ── Lesson location label helper ─────────────────────────────────────────────
const LESSON_LOCATIONS = [
  { v:'school', km:'សាលា',              en:'School' },
  { v:'yard',   km:'ទីលាន​ហាត់',        en:'Training Course' },
  { v:'apply',  km:'កន្លែង​ដាក់​ពាក្យ', en:'Application centre' },
  { v:'exam',   km:'កន្លែង​ប្រឡង',     en:'Exam centre' },
];
const locLabelFor = (pickup) => {
  const loc = LESSON_LOCATIONS.find(l => l.v === pickup);
  return loc ? `${loc.km} · ${loc.en}` : (pickup || '—');
};

const LESSON_TYPE_CATS = [
  { k:'pkh', label:'Practical KH', color:'a', max:20,  prefix:'KH' },
  { k:'tkh', label:'Theory KH',    color:'c', max:20,  prefix:'KH' },
  { k:'pjp', label:'Practical JP', color:'d', max:60,  prefix:'JP' },
  { k:'tjp', label:'Theory JP',    color:'e', max:40,  prefix:'JP' },
];

// ── Lesson edit form (inside modal) ──────────────────────────────────────────
const LessonEditForm = ({ lesson, onSave, onCancel }) => {
  const { toast, tr } = useAppActions();

  // Lessons pulled from Tab Lessons (same source as the create form)
  const _lib = (typeof window !== 'undefined' && window.__lessonsLib) || {};
  const TYPE_CATS = [
    { k:'theory',    km:'ទ្រឹស្ដី', en:'Theory · 学科',    color:'c', items: _lib.theoryTexts    || [] },
    { k:'practical', km:'អនុវត្តន៍', en:'Practical · 技能', color:'a', items: _lib.practicalTexts || [] },
  ];
  // Determine starting category from the lesson's color (c/e = theory, else practical)
  const initCat = (lesson.color === 'c' || lesson.color === 'e') ? 'theory' : 'practical';
  const initCatObj = TYPE_CATS.find(c => c.k === initCat) || TYPE_CATS[0];
  const initSel = Array.isArray(lesson.lessonIds)
    ? lesson.lessonIds.filter(id => initCatObj.items.some(u => u.id === id))
    : [];

  const [cat,       setCat]       = React.useState(initCat);
  const [selLessons,setSelLessons]= React.useState(initSel);
  const [date,      setDate]      = React.useState(lesson.date || '');
  const [hour,      setHour]      = React.useState(lesson.h    || 9);
  const [len,       setLen]       = React.useState(lesson.len  || 2);
  const [studentId, setStudentId] = React.useState(lesson.studentId === '—' ? '' : (lesson.studentId || ''));
  const [instId,    setInstId]    = React.useState(lesson.instId    === '—' ? '' : (lesson.instId    || ''));
  const [guests,    setGuests]    = React.useState(lesson.guests || []);
  const [vehId,     setVehId]     = React.useState(lesson.veh       === '—' ? '' : (lesson.veh       || ''));
  const [pickup,    setPickup]    = React.useState(lesson.pickup || 'school');
  const [locationText, setLocationText] = React.useState(lesson.location || '');
  const [note,      setNote]      = React.useState(lesson.note   || '');
  const [status,    setStatus]    = React.useState(lesson.status || 'scheduled');

  const catObj = TYPE_CATS.find(c => c.k === cat) || TYPE_CATS[0];
  const changeCat = (k) => { setCat(k); setSelLessons([]); };

  const LOCATIONS = [
    { v:'school', km:'សាលា',              en:'School' },
    { v:'yard',   km:'ទីលាន​ហាត់',        en:'Training Course' },
    { v:'apply',  km:'កន្លែង​ដាក់​ពាក្យ', en:'Application centre' },
    { v:'exam',   km:'កន្លែង​ប្រឡង',     en:'Exam centre' },
    { v:'classA', km:'Class A',           en:'Class A' },
    { v:'classB', km:'Class B',           en:'Class B' },
    { v:'classC', km:'Class C',           en:'Class C' },
  ];

  // Conflict check — exclude the lesson being edited
  const slotBusy = (l) => l !== lesson && l.status !== 'cancelled'
    && l.date === date && l.h < parseInt(hour) + parseFloat(len) && l.h + l.len > parseInt(hour);
  const hasConflict = React.useMemo(() => {
    if (!instId) return false;
    return LESSONS.some(l => (l.instId === instId || (l.guests||[]).includes(instId)) && slotBusy(l));
  }, [instId, date, hour, len]);
  const guestConflicts = React.useMemo(() => {
    const c = {};
    guests.forEach(gid => {
      c[gid] = LESSONS.some(l => l !== lesson && (l.instId===gid||(l.guests||[]).includes(gid)) && slotBusy(l));
    });
    return c;
  }, [guests, date, hour, len]);
  const vehConflict = React.useMemo(() => {
    if (!vehId) return false;
    return LESSONS.some(l => l !== lesson && l.veh === vehId && slotBusy(l));
  }, [vehId, date, hour, len]);

  const save = () => {
    if (!date) { toast(tr('ត្រូវ​ការ​កាល​បរិច្ឆេទ','Date required'), 'warn'); return; }
    const selObjs  = catObj.items.filter(u => selLessons.includes(u.id));
    const selLabel = selObjs.map(u => u.no ? `${u.no} ${tr(u.km,u.en)}` : tr(u.km,u.en)).join(', ');
    const typeName = `${tr(catObj.km, catObj.en)}${selLabel ? ' · ' + selLabel : ''}`;
    const lessonNo = selObjs.map(u => u.no).filter(Boolean).join(', ');
    Object.assign(lesson, {
      date, h: parseInt(hour), len: parseFloat(len),
      studentId: studentId || '—',
      instId:    instId    || '—',
      guests:    guests.length > 0 ? [...guests] : undefined,
      veh:       vehId     || '—',
      type: typeName, color: catObj.color,
      lessonIds: [...selLessons], lessonNo,
      pickup, location: locationText.trim(), note: note.trim(), status,
    });
    // When marked done, tick the matching lessons in the student's Progress checklist
    if (status === 'done' && studentId) {
      const stu = STUDENTS.find(x => x.id === studentId);
      if (stu && selLessons.length) {
        if (!stu.lessonProgress) stu.lessonProgress = {};
        selLessons.forEach(id => {
          stu.lessonProgress[id] = { ...(stu.lessonProgress[id]||{}), done: true, doneAt: date || (typeof todayStr==='function'?todayStr():'') };
        });
      }
    }
    if (window.__notifyLessonsChanged)  window.__notifyLessonsChanged();
    if (window.__notifyStudentsChanged) window.__notifyStudentsChanged();
    if (window.saveAllData) window.saveAllData();
    toast(tr('បានរក្សាទុក','Lesson updated'), 'good');
    onSave();
  };

  const activeVehs = VEHICLES.filter(v => v.status === 'Active');

  return (
    <FormShell onCancel={onCancel} onSave={save}
      saveLabel={tr('រក្សា​ទុក','Save')}
      cancelLabel={tr('បោះបង់','Cancel')}>

      {/* ── LESSON (Theory / Practical from Tab Lessons) ── */}
      <FormSection title="LESSON">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          {TYPE_CATS.map(tc => (
            <button key={tc.k} type="button" onClick={()=>changeCat(tc.k)} style={{
              padding:'10px 6px',borderRadius:8,fontSize:13,fontWeight:600,
              border:`2px solid ${cat===tc.k?'var(--accent)':'var(--border)'}`,
              background: cat===tc.k?'var(--accent-soft)':'var(--surface)',
              color:      cat===tc.k?'var(--accent)':'var(--ink-2)',
              cursor:'pointer',textAlign:'center',lineHeight:1.4,
            }}>{tr(tc.km, tc.en)} <span style={{opacity:.7,fontWeight:400}}>· {tc.items.length}</span></button>
          ))}
        </div>
        <Field label={tr('ជ្រើស​មេរៀន (ពី Tab Lessons)','Select lessons (from Tab Lessons)')}>
          {selLessons.length > 0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
              {catObj.items.filter(u=>selLessons.includes(u.id)).map(u => (
                <div key={u.id} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',
                  background:'var(--accent-soft)',border:'1px solid var(--accent)',borderRadius:6,
                  fontSize:12,fontWeight:500,color:'var(--accent)'}}>
                  {u.no ? `${u.no} · ` : ''}{tr(u.km, u.en)}
                  <button type="button" onClick={()=>setSelLessons(prev=>prev.filter(x=>x!==u.id))} style={{
                    border:'none',background:'none',cursor:'pointer',color:'var(--accent)',
                    fontSize:14,lineHeight:1,padding:0,display:'flex',alignItems:'center',
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
          {catObj.items.length === 0 ? (
            <div style={{fontSize:12,color:'var(--ink-3)',padding:'8px 0'}}>{tr('មិនទាន់មានមេរៀននៅ Tab Lessons','No lessons defined in Tab Lessons')}</div>
          ) : (
            <Select value="" onChange={e=>{
              const id = e.target.value;
              if (id && !selLessons.includes(id)) setSelLessons(prev => [...prev, id]);
            }}>
              {[
                <option key="_ph" value="">+ {tr('បន្ថែម​មេរៀន','Add lesson')}</option>,
                ...[1,2].flatMap(stage => {
                  const grp = catObj.items.filter(u => (u.stage||1) === stage && !selLessons.includes(u.id));
                  if (!grp.length) return [];
                  return [
                    <option key={'st'+stage} value="" disabled>{stage===1 ? tr('── ដំណាក់កាល ១','── Stage 1 · 第一段階 ──') : tr('── ដំណាក់កាល ២','── Stage 2 · 第二段階 ──')}</option>,
                    ...grp.map(u => <option key={u.id} value={u.id}>{u.no ? u.no+' · ' : ''}{tr(u.km, u.en)}{u.ja ? ' · '+u.ja : ''}</option>),
                  ];
                }),
              ]}
            </Select>
          )}
        </Field>
      </FormSection>

      {/* ── WHEN ── */}
      <FormSection title={tr('ពេល​វេលា','WHEN')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <Field label={tr('ថ្ងៃ *','Date *')}>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </Field>
          <Field label={tr('ម៉ោង​ចាប់​ផ្ដើម','Start time')}>
            <Select value={String(hour)} onChange={e=>setHour(parseInt(e.target.value))}>
              {Array.from({length:12},(_,i)=>i+7).map(h=>(
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </Select>
          </Field>
          <Field label={tr('រយៈ​ពេល','Duration')}>
            <Select value={String(len)} onChange={e=>setLen(parseFloat(e.target.value))}>
              {[1,1.5,2,2.5,3,4].map(l=><option key={l} value={l}>{l} ម៉ោង</option>)}
            </Select>
          </Field>
        </div>
      </FormSection>

      {/* ── PEOPLE ── */}
      <FormSection title={tr('អ្នក​ពាក់​ព័ន្ធ','PEOPLE')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Field label={tr('សិស្ស','Student')}>
            <Select value={studentId} onChange={e=>setStudentId(e.target.value)}>
              <option value="">{tr('ក្រុម / មិន​ផ្ទាល់​ខ្លួន','Group / not individual')}</option>
              {STUDENTS.map(s=><option key={s.id} value={s.id}>{s.name} · {s.id}</option>)}
            </Select>
          </Field>
          <Field label={tr('គ្រូ *','Instructor *')}
            sub={hasConflict ? tr('⚠ គ្រូ​នេះ​រវល់​ម៉ោង​នេះ','⚠ Instructor busy') : ''}>
            <Select value={instId} onChange={e=>setInstId(e.target.value)}
              style={hasConflict?{borderColor:'var(--warn)'}:{}}>
              <option value="">{tr('--- ជ្រើស​គ្រូ ---','--- Select instructor ---')}</option>
              {INSTRUCTORS.map(i=>{
                const busy = LESSONS.some(l=>l!==lesson&&(l.instId===i.id||(l.guests||[]).includes(i.id))&&slotBusy(l));
                return <option key={i.id} value={i.id}>{busy?'🔴 ':''}{i.name} · {i.en}{busy?tr(' (រវល់)',' (busy)'):''}</option>;
              })}
            </Select>
          </Field>
          <Field label={tr('យានយន្ត','Vehicle')} full
            sub={vehConflict?tr('⚠ ឡាន​ជាន់​ម៉ោង​គ្នា','⚠ Vehicle busy'):''}>
            <Select value={vehId} onChange={e=>setVehId(e.target.value)}
              style={vehConflict?{borderColor:'var(--warn)'}:{}}>
              <option value="">{tr('ស្វ័យ​ប្រវត្តិ','Auto-assign')}</option>
              {activeVehs.map(v=>{
                const busy = LESSONS.some(l=>l!==lesson&&l.veh===v.id&&slotBusy(l));
                return <option key={v.id} value={v.id}>{busy?'🔴 ':''}{v.plate} · {v.make}{busy?tr(' (ជាន់ម៉ោង)',' (busy)'):''}</option>;
              })}
            </Select>
          </Field>
        </div>
        {/* Guests */}
        <Field label={tr('គ្រូ​ភ្ញៀវ','Guest instructors')}>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:guests.length>0?8:0}}>
            {guests.map(gid=>{
              const gi = INSTRUCTORS.find(i=>i.id===gid);
              const busy = guestConflicts[gid];
              return (
                <div key={gid} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',
                  background:busy?'rgba(198,106,46,.12)':'var(--accent-soft)',
                  border:`1px solid ${busy?'var(--warn)':'var(--accent)'}`,borderRadius:6,
                  fontSize:12,fontWeight:500,color:busy?'var(--warn)':'var(--accent)'}}>
                  {busy&&'⚠ '}{gi?gi.en:gid}
                  <button type="button" onClick={()=>setGuests(prev=>prev.filter(x=>x!==gid))} style={{
                    border:'none',background:'none',cursor:'pointer',padding:0,
                    color:'inherit',fontSize:14,lineHeight:1,display:'flex',alignItems:'center',
                  }}>×</button>
                </div>
              );
            })}
          </div>
          <Select value="" onChange={e=>{
            const v=e.target.value;
            if(v&&v!==instId&&!guests.includes(v)) setGuests(prev=>[...prev,v]);
          }}>
            <option value="">+ {tr('Add guest instructor','Add guest instructor')}</option>
            {INSTRUCTORS.filter(i=>i.id!==instId&&!guests.includes(i.id)).map(i=>{
              const busy=LESSONS.some(l=>l!==lesson&&(l.instId===i.id||(l.guests||[]).includes(i.id))&&slotBusy(l));
              return <option key={i.id} value={i.id}>{busy?'🔴 ':''}{i.name} · {i.en}{busy?tr(' (រវល់)',' (busy)'):''}</option>;
            })}
          </Select>
        </Field>
      </FormSection>

      {/* ── LOCATION & STATUS ── */}
      <FormSection title={tr('ទីតាំង + ស្ថានភាព','LOCATION & STATUS')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Field label={tr('ទីតាំង​ជួប','Meeting location')}>
            <Select value={pickup} onChange={e=>setPickup(e.target.value)}>
              {LOCATIONS.map(loc=>(
                <option key={loc.v} value={loc.v}>{loc.km} · {loc.en}</option>
              ))}
            </Select>
          </Field>
          <Field label={tr('ឬ បំពេញ​ដោយ​ដៃ','Or type manually')}>
            <Input value={locationText} onChange={e=>setLocationText(e.target.value)} placeholder={tr('ទីតាំង​ផ្សេង...','Custom location...')}/>
          </Field>
          <Field label={tr('ស្ថានភាព','Status')}>
            <Select value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="scheduled">{tr('កំណត់​ពេល','Scheduled')}</option>
              <option value="done">{tr('រួច​រាល់','Done ✓')}</option>
              <option value="cancelled">{tr('លុប​ចោល','Cancelled')}</option>
            </Select>
          </Field>
          <Field label={tr('ចំណាំ','Note')} full>
            <Input value={note} onChange={e=>setNote(e.target.value)} placeholder={tr('ចំណាំ​បន្ថែម...','Extra note...')}/>
          </Field>
        </div>
      </FormSection>
    </FormShell>
  );
};

// ── Lesson detail ──────────────────────────────────────────────────────────
const LessonDetail = ({ lesson, onClose }) => {
  const { toast, confirm, role, tr, openForm, lang } = useAppActions();
  const [ver,     setVer]     = React.useState(0);
  const [editing, setEditing] = React.useState(false);
  if (!lesson) return null;
  const s  = studentById(lesson.studentId || lesson.who);
  const it = instById(lesson.instId || lesson.inst);
  const v  = vehById(lesson.veh);
  const c  = (LESSON_COLORS || {})[lesson.color] || {fg:'var(--accent)', bg:'var(--accent-soft)', bd:'var(--accent)'};
  const isStudent = role === 'student';
  const isDone = lesson.status === 'done';
  const isCancelled = lesson.status === 'cancelled';

  const locLabel = locLabelFor(lesson.pickup);
  // Khmer-pure labels (except names): lesson type + English location name.
  const typeLabel = (lesson.color==='c' || lesson.color==='e') ? tr('ទ្រឹស្ដី','Theory') : tr('អនុវត្ត','Practical');
  const locName = ((typeof LESSON_LOCATIONS !== 'undefined' ? LESSON_LOCATIONS : []).find(l => l.v === lesson.pickup)?.en) || lesson.pickup || '—';
  // Cumulative hour number(s) for this lesson, counted SEPARATELY per type —
  // Theory hours and Practical hours each have their own running count.
  // e.g. the 5th theory hour → "5"; a 2-hour lesson at theory-hour 5 → "5, 6".
  const isTheory = (l) => l.color === 'c' || l.color === 'e';
  const hourRange = (() => {
    const sid = lesson.studentId;
    if (!sid || sid === '—') return '';
    const sameType = isTheory(lesson);
    const mine = (typeof LESSONS !== 'undefined' ? LESSONS : [])
      .filter(l => l.studentId === sid && l.status !== 'cancelled' && isTheory(l) === sameType)
      .sort((a,b) => String(a.date||'').localeCompare(String(b.date||'')) || ((a.h||0) - (b.h||0)));
    let acc = 0, start = null;
    for (const l of mine) { if (l.id === lesson.id) { start = acc + 1; break; } acc += Math.max(1, Math.round(l.len||1)); }
    if (start == null) return '';
    const n = Math.max(1, Math.round(lesson.len||1));
    return Array.from({length:n}, (_,i) => start + i).join(', ');
  })();

  const markDone = () => {
    lesson.status = 'done';
    // Credit hours to student
    if (s) {
      s.hours = (s.hours || 0) + lesson.len;
      // Auto-advance status
      if (s.hours >= s.target && s.status !== 'Cleared') s.status = 'Road exam soon';
      // Tick the matching lessons in the student's Progress checklist
      if (Array.isArray(lesson.lessonIds) && lesson.lessonIds.length) {
        if (!s.lessonProgress) s.lessonProgress = {};
        lesson.lessonIds.forEach(id => {
          s.lessonProgress[id] = { ...(s.lessonProgress[id]||{}), done: true, doneAt: lesson.date || (typeof todayStr==='function'?todayStr():'') };
        });
      }
    }
    setVer(n => n+1);
    if (window.__notifyLessonsChanged)  window.__notifyLessonsChanged();
    if (window.__notifyStudentsChanged) window.__notifyStudentsChanged();
    if (window.saveAllData) window.saveAllData();
    toast(tr(`​បានកត់ ${lesson.len}ម៉ោង​ · ${s?.name||'Group'}`, `Logged ${lesson.len}h · ${s?.en||'Group'}`), 'good');
  };

  const cancelLesson = () => confirm?.({
    title: tr('លុប​ចោល​មេរៀន?', 'Cancel this lesson?'),
    body:  tr('អ្នក​ប្រាកដ​ទេ? មេរៀន​នឹង​ត្រូវ​បាន​លុប​ចោល ហើយ​សិស្ស​នឹង​ទទួល​ជូន​ដំណឹង។',
              'Are you sure? The lesson will be cancelled and the student notified.'),
    confirmText: tr('លុប', 'Cancel lesson'), danger: true,
    onConfirm: () => {
      lesson.status = 'cancelled';
      setVer(n => n+1);
      if (window.__notifyLessonsChanged) window.__notifyLessonsChanged();
      if (window.saveAllData) window.saveAllData();
      toast(tr('បាន​លុប​ចោល​មេរៀន', 'Lesson cancelled'), 'warn');
      onClose();
    },
  });

  const dateLabel = lesson.date ? formatDateShort(lesson.date, lang) : '';

  if (editing) {
    return <LessonEditForm lesson={lesson} onSave={() => { setEditing(false); setVer(n=>n+1); }} onCancel={() => setEditing(false)}/>;
  }

  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:18}}>
      {/* Header */}
      <div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Badge tone={lesson.color==='e'?'warn':lesson.color==='c'?'neutral':lesson.color==='d'?'good':'accent'}>
            {typeLabel}
          </Badge>
          {isDone      && <Badge tone="good">{tr('រួច​រាល់','Done')}</Badge>}
          {isCancelled && <Badge tone="danger">{tr('លុប​ចោល','Cancelled')}</Badge>}
          {!isDone && !isCancelled && <Badge tone="neutral">{tr('កំណត់​ពេល','Scheduled')}</Badge>}
        </div>
        <div style={{fontSize:32,fontWeight:600,marginTop:10,letterSpacing:'-.02em',fontFamily:'var(--font-display)'}}>
          {String(lesson.h).padStart(2,'0')}:00–{String(lesson.h + lesson.len).padStart(2,'0')}:00
        </div>
        <div style={{fontSize:13,color:'var(--ink-3)',marginTop:4}}>
          {dateLabel} · {typeLabel} · {lesson.len}{lang==='km' ? ' ម៉ោង' : 'h'}
        </div>
        {hourRange && (
          <div style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:8,padding:'3px 10px',borderRadius:7,background:'var(--accent-soft)',color:'var(--accent)',fontSize:12,fontWeight:600,width:'fit-content'}}>
            <Icon name="cal" size={12}/> {tr('ម៉ោងទី','Hour')} {hourRange}
          </div>
        )}
      </div>

      {/* Location */}
      <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10,display:'flex',gap:12,alignItems:'center'}}>
        <div style={{width:36,height:36,borderRadius:8,background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon name="flag" size={15}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>{tr('ទីតាំង','LOCATION')}</div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:2}}>
            <div style={{fontSize:13,fontWeight:500}}>{locName}</div>
            {lesson.pickup === 'school' && <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:4,background:'#E5EBF5',color:'#2A5DB0',fontFamily:'"JetBrains Mono",monospace'}}>School</span>}
            {lesson.pickup === 'yard'   && <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:4,background:'#E2EFE7',color:'#3B7A57',fontFamily:'"JetBrains Mono",monospace'}}>Course</span>}
          </div>
        </div>
      </div>

      {/* Student + Instructor */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {!isStudent && (
          <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10,display:'flex',gap:10,alignItems:'center'}}>
            {s ? <Avatar tag={s.photo} size={40}/> : <div style={{width:40,height:40,borderRadius:999,background:'var(--border)'}}/>}
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>{tr('សិស្ស','STUDENT')}</div>
              <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{s?.en || s?.name || tr('ក្រុម','Group')}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.id || '—'}</div>
            </div>
          </div>
        )}
        <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10,display:'flex',gap:10,alignItems:'center',gridColumn:isStudent?'span 2':undefined}}>
          {it ? <Avatar tag={it.photo} size={40}/> : <div style={{width:40,height:40,borderRadius:999,background:'var(--border)'}}/>}
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>{tr('គ្រូ','INSTRUCTOR')}</div>
            <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{it?.en || it?.name || '—'}</div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>★ {it?.rating} · {it?.lang}</div>
          </div>
        </div>
      </div>

      {/* Vehicle */}
      {v && (
        <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10,display:'flex',gap:10,alignItems:'center'}}>
          <Photo tag={v.photo} w={56} h={42} r={6}/>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>{tr('យានយន្ត','VEHICLE')}</div>
            <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{v.make}</div>
            <div style={{display:'flex',gap:6,alignItems:'center',marginTop:3,flexWrap:'wrap'}}>
              <span style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{v.plate} · {v.cls}</span>
              {v.trans && (
                <span style={{
                  fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,
                  background: v.trans==='MT' ? '#F4DEDD' : '#E5EBF5',
                  color:      v.trans==='MT' ? '#B0413E' : '#2A5DB0',
                  fontFamily:'"JetBrains Mono",monospace',
                }}>{v.trans}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guest instructors */}
      {lesson.guests && lesson.guests.length > 0 && (
        <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:8}}>{tr('គ្រូ​ភ្ញៀវ','GUEST INSTRUCTORS')}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {lesson.guests.map(gid => {
              const gi = instById(gid);
              return (
                <div key={gid} style={{display:'flex',gap:10,alignItems:'center'}}>
                  {gi ? <Avatar tag={gi.photo} size={32}/> : <div style={{width:32,height:32,borderRadius:999,background:'var(--border)'}}/>}
                  <div>
                    <div style={{fontSize:12,fontWeight:500}}>{gi?.en || gid}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>{gi?.name || ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      {lesson.note && (
        <div style={{padding:'10px 14px',background:'var(--surface-muted)',borderRadius:8,fontSize:13,color:'var(--ink-2)'}}>
          {lesson.note}
        </div>
      )}

      {/* Created by */}
      {lesson.createdBy && (
        <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:5,paddingTop:6,borderTop:'1px dashed var(--border)'}}>
          👤 {tr('បង្កើត​ដោយ','Created by')}: <span style={{fontWeight:600,color:'var(--ink-2)'}}>{lesson.createdBy}</span>
          {lesson.createdAt && <span style={{marginLeft:'auto',fontFamily:'"JetBrains Mono",monospace',fontSize:10}}>{String(lesson.createdAt).slice(0,10)}</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{display:'flex',gap:8,marginTop:'auto'}}>
        {isStudent ? (
          <>
            <Btn kind="ghost" size="md" onClick={onClose} style={{flex:1,justifyContent:'center'}}>{tr('ត្រឡប់','Close')}</Btn>
            <Btn kind="primary" size="md" onClick={()=>toast(tr('សាក​ទំនាក់​គ្រូ…','Contacting instructor…'),'neutral')} icon={<Icon name="phone" size={14}/>} style={{flex:2,justifyContent:'center'}}>{tr('ទំនាក់​គ្រូ','Contact instructor')}</Btn>
          </>
        ) : isDone ? (
          <>
            <Btn kind="ghost" size="md" onClick={onClose} style={{flex:1,justifyContent:'center'}}>{tr('បិទ','Close')}</Btn>
            <Btn kind="ghost" size="md" onClick={()=>{ openForm('editLesson', { lesson }); onClose && onClose(); }} style={{flex:1,justifyContent:'center'}}>✎ {tr('កែ','Edit')}</Btn>
          </>
        ) : isCancelled ? (
          <>
            <Btn kind="ghost" size="md" onClick={onClose} style={{flex:1,justifyContent:'center'}}>{tr('បិទ','Close')}</Btn>
            <Btn kind="ghost" size="md" onClick={()=>{ openForm('editLesson', { lesson }); onClose && onClose(); }} style={{flex:1,justifyContent:'center'}}>✎ {tr('កែ','Edit')}</Btn>
          </>
        ) : (
          <>
            <Btn kind="ghost" size="md" onClick={cancelLesson} style={{flex:1,justifyContent:'center'}}>{tr('លុប​ចោល','Cancel')}</Btn>
            <Btn kind="ghost" size="md" onClick={()=>{ openForm('editLesson', { lesson }); onClose && onClose(); }} style={{flex:1,justifyContent:'center'}}>✎ {tr('កែ','Edit')}</Btn>
            <Btn kind="primary" size="md" onClick={markDone} icon={<Icon name="check" size={14}/>} style={{flex:1,justifyContent:'center'}}>{tr('ចប់​មេរៀន ✓','Mark done ✓')}</Btn>
          </>
        )}
      </div>
    </div>
  );
};

// ── Note detail (schedule pinned note) — mirrors LessonDetail ───────────────
const NoteDetail = ({ note, onClose }) => {
  const { tr, confirm } = useAppActions();
  if (!note) return null;
  const invited = (note.invited || []).map(id => instById(id)).filter(Boolean);
  const dateLabel = note.date ? formatDateShort(note.date, 'en') : '';
  const doEdit = () => { if (window.__editScheduleNote) window.__editScheduleNote(note); onClose && onClose(); };
  const doDelete = () => confirm?.({
    title: tr('លុប​ចំណាំ?', 'Delete this note?'),
    body:  tr('អ្នក​ប្រាកដ​ទេ? ចំណាំ​នេះ​នឹង​ត្រូវ​លុប។', 'Are you sure? This note will be removed.'),
    confirmText: tr('លុប', 'Delete'), danger: true,
    onConfirm: () => { if (window.__deleteScheduleNote) window.__deleteScheduleNote(note.id); onClose && onClose(); },
  });
  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:18}}>
      {/* Header */}
      <div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Badge tone="warn">📌 {tr('ចំណាំ','Note')}</Badge>
        </div>
        {(note.title || note.text) && (
          <div style={{fontSize:24,fontWeight:700,marginTop:10,letterSpacing:'-.01em',fontFamily:'var(--font-display)'}}>
            {note.title || note.text}
          </div>
        )}
        <div style={{fontSize:13,color:'var(--ink-3)',marginTop:6}}>{[dateLabel, note.time].filter(Boolean).join(' · ')}</div>
      </div>

      {/* Description */}
      {(note.description || (!note.title && note.text)) && (
        <div style={{padding:14,background:'rgba(250,204,21,.12)',border:'1px solid rgba(250,204,21,.5)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:6}}>DESCRIPTION · ការ​ពិពណ៌នា</div>
          <div style={{fontSize:15,color:'var(--ink)',whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.6}}>{note.description || note.text}</div>
        </div>
      )}

      {/* Invited instructors */}
      {invited.length > 0 && (
        <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:8}}>INVITED · គ្រូ​ដែល​បាន​អញ្ជើញ</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {invited.map(gi => (
              <div key={gi.id} style={{display:'flex',gap:10,alignItems:'center'}}>
                {gi.photo ? <Avatar tag={gi.photo} size={32}/> : <div style={{width:32,height:32,borderRadius:999,background:'var(--border)'}}/>}
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{gi.en || gi.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{gi.name || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Created by */}
      {note.author && (
        <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:5,paddingTop:6,borderTop:'1px dashed var(--border)'}}>
          👤 {tr('បង្កើត​ដោយ','Created by')}: <span style={{fontWeight:600,color:'var(--ink-2)'}}>{note.author}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{display:'flex',gap:8,marginTop:'auto'}}>
        <Btn kind="ghost"   size="md" onClick={onClose}  style={{flex:1,justifyContent:'center'}}>{tr('បិទ','Close')}</Btn>
        <Btn kind="ghost"   size="md" onClick={doDelete} style={{flex:1,justifyContent:'center',color:'var(--danger)'}}>{tr('លុប','Delete')}</Btn>
        <Btn kind="primary" size="md" onClick={doEdit}   style={{flex:1,justifyContent:'center'}}>✎ {tr('កែ','Edit')}</Btn>
      </div>
    </div>
  );
};

// ── Student profile (full) ─────────────────────────────────────────────────
const StudentProfile = ({ student, onClose }) => {
  const { toast, openForm, openDetail, role, tr, curriculumDone, setCurriculumDone, curriculumFeedback, setCurriculumFeedback } = useAppActions();
  const [tab, setTab] = React.useState('info');
  const [openStages, setOpenStages] = React.useState({stage1:true, stage2:false});
  const [draftFeedback, setDraftFeedback] = React.useState({});
  const [lessonFilter, setLessonFilter] = React.useState('all');
  const [expandedLesson, setExpandedLesson] = React.useState(null);
  const [msgText, setMsgText] = React.useState('');
  const [acctShowPw, setAcctShowPw] = React.useState(false);
  const [acctChanging, setAcctChanging] = React.useState(false);
  const [acctNewPw, setAcctNewPw] = React.useState('');
  const [, forceUpdate] = React.useReducer(x => x+1, 0);
  const [sentMsgs, setSentMsgs] = React.useState([
    {time:'ឧសភា 28 · 14:32', text:'ការ​សាកល្បង​ក្នុង​ទីក្រុង​ត្រូវ​បាន​ណាត់​នៅ​ថ្ងៃ​ច័ន្ទ 9:00', type:'reminder'},
    {time:'ឧសភា 20 · 09:10', text:'ហ្វឹក​ហ្វឺន​ញ្ញត្តិ​​ប្រឡង​ ​​​​​', type:'assessment'},
  ]);
  if (!student) return null;
  const s = student;
  const canEdit = role === 'admin' || role === 'instructor';

  const toggleTopic = (id) => {
    if (!canEdit) return;
    setCurriculumDone(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      window.__curriculumDone = next;
      if (window.saveAllData) window.saveAllData();
      return next;
    });
  };

  const saveFeedback = (topicId) => {
    const text = (draftFeedback[topicId] || '').trim();
    if (!text) return;
    setCurriculumFeedback(prev => {
      const next = {...prev, [topicId]: text};
      window.__curriculumFeedback = next;
      if (window.saveAllData) window.saveAllData();
      return next;
    });
    setDraftFeedback(prev => ({...prev, [topicId]: ''}));
    toast(tr('បាន​រក្សា​ទុក​មតិ','Feedback saved'), 'good');
  };

  const totalTopics = CURRICULUM.reduce((a, st) => a + st.topics.length, 0);
  const totalDone   = CURRICULUM.reduce((a, st) => a + st.topics.filter(t2 => curriculumDone.has(t2.id)).length, 0);

  const studentLessons = (LESSONS || []).filter(l => l.who === s.id);
  const now = { day: 1, h: 9 };
  const isUpcoming = l => l.day > now.day || (l.day === now.day && l.h >= now.h);

  const filteredLessons = studentLessons.filter(l => {
    if (lessonFilter === 'upcoming') return isUpcoming(l);
    if (lessonFilter === 'done') return !isUpcoming(l);
    return true;
  });

  const DAY_NAMES = tr(DAYS_KM, DAYS_EN) === DAYS_KM ? DAYS_KM : DAYS_EN;

  const MSG_TEMPLATES = [
    { km:'ការ​ជូន​ដំណឹង​​មេរៀន', en:'Lesson reminder', type:'reminder',
      text: tr('សូម​ចំណាំ​មេរៀន​​របស់​អ្នក​','Reminder: your lesson is coming up. See you soon!') },
    { km:'លទ្ធ​ផល​វាយ​តម្លៃ', en:'Assessment result', type:'assessment',
      text: tr('លទ្ធ​ផល​វាយ​តម្លៃ​របស់​អ្នក','Your assessment result is ready. Check your progress tab.') },
    { km:'ការ​បង់​ប្រាក់', en:'Payment due', type:'payment',
      text: tr('ការ​​ទូទាត់​ការ​ជំពាក់​','Payment reminder: please settle your balance to continue lessons.') },
    { km:'ការ​លើក​កម្ពស់', en:'Encouragement', type:'good',
      text: tr('ការ​ស្វែង​រក​ ​','Great work! Keep it up — you\'re making excellent progress.') },
  ];

  const sendMsg = (text) => {
    if (!text.trim()) return;
    const now2 = new Date();
    const time = `${now2.getMonth()+1}/${now2.getDate()} · ${String(now2.getHours()).padStart(2,'0')}:${String(now2.getMinutes()).padStart(2,'0')}`;
    setSentMsgs(prev => [{time, text: text.trim(), type:'custom'}, ...prev]);
    setMsgText('');
    toast(tr('បាន​ផ្ញើ​សារ','Message sent'), 'good');
  };

  const saveStudentPw = () => {
    if (!acctNewPw.trim()) return;
    s.password = acctNewPw.trim();
    if (window.saveAllData) window.saveAllData();
    setAcctChanging(false); setAcctNewPw(''); forceUpdate();
    toast(tr('បាន​ផ្លាស់ Password','Password updated'), 'good');
  };

  const toggleStudentSuspend = () => {
    s.account_disabled = !s.account_disabled;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(s.account_disabled ? tr('គណនីត្រូវបានផ្អាក','Account suspended') : tr('គណនីដំណើរការ','Account activated'), s.account_disabled ? 'warn' : 'good');
  };

  const TABS = [
    { id:'info',       km:'ព័ត៌មាន',      en:'Info'       },
    { id:'schedule',   km:'កាលវិភាគ',     en:'Schedule'   },
    { id:'lessons',    km:'មេរៀន',         en:'Lessons'    },
    { id:'messages',   km:'សារ',           en:'Messages'   },
    { id:'curriculum', km:'វគ្គ​សិក្សា', en:'Curriculum' },
    ...(role === 'admin' ? [{ id:'account', km:'គណនី', en:'Account' }] : []),
  ];

  const LESSON_COLOR_MAP = (typeof LESSON_COLORS !== 'undefined' ? LESSON_COLORS : {});

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Header */}
      <div style={{padding:'20px 24px 0',background:'linear-gradient(to bottom, var(--surface-muted), var(--surface))'}}>
        <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16}}>
          <Photo tag={s.photo} w={72} h={72} r={999}/>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{s.id} · {s.cls}</div>
            <div style={{fontSize:22,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em',marginTop:2}}>{s.name}</div>
            <div style={{fontSize:13,color:'var(--ink-3)'}}>{s.en}</div>
            <div style={{display:'flex',gap:6,marginTop:8}}>
              <Badge tone={s.status==='Cleared'?'good':s.status==='Road exam soon'?'warn':s.status==='New'?'accent':'neutral'}>{s.status}</Badge>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <Btn kind="ghost" size="md" onClick={()=>toast?.('ហៅ​សិស្ស','neutral')} icon={<Icon name="phone" size={14}/>}>ហៅ</Btn>
            <Btn kind="primary" size="md" onClick={()=>openForm?.('newLesson',{studentId:s.id})} icon={<Icon name="cal" size={14}/>}>{tr('កក់​','Book')}</Btn>
          </div>
        </div>
        {/* Sub-tabs */}
        <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',overflowX:'auto'}}>
          {TABS.map(t2 => (
            <button key={t2.id} onClick={()=>setTab(t2.id)} style={{
              padding:'8px 14px',fontSize:12,fontWeight:500,border:'none',background:'none',cursor:'pointer',fontFamily:'inherit',
              whiteSpace:'nowrap',flexShrink:0,
              color:tab===t2.id?'var(--accent)':'var(--ink-3)',
              borderBottom:tab===t2.id?'2px solid var(--accent)':'2px solid transparent',
              marginBottom:-1,
            }}>
              {tr(t2.km, t2.en)}
              {t2.id==='curriculum' && (
                <span style={{marginLeft:5,fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>
                  {totalDone}/{totalTopics}
                </span>
              )}
              {t2.id==='lessons' && studentLessons.length > 0 && (
                <span style={{marginLeft:5,fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{studentLessons.length}</span>
              )}
              {t2.id==='messages' && sentMsgs.length > 0 && (
                <span style={{marginLeft:5,fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{sentMsgs.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div style={{flex:1,overflow:'auto'}}>
          <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',marginBottom:12}}>ព័ត៌មាន · INFO</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:13}}>
              <div><span style={{color:'var(--ink-3)',fontSize:11}}>ទូរស័ព្ទ</span><div style={{fontWeight:500,marginTop:2}}>{s.phone}</div></div>
              <div><span style={{color:'var(--ink-3)',fontSize:11}}>គ្រូ</span><div style={{fontWeight:500,marginTop:2}}>{s.inst}</div></div>
              <div><span style={{color:'var(--ink-3)',fontSize:11}}>មេរៀន​បន្ទាប់</span><div style={{fontWeight:500,marginTop:2}}>{s.next}</div></div>
              <div><span style={{color:'var(--ink-3)',fontSize:11}}>ការ​បង់</span><div style={{fontWeight:500,marginTop:2}}>{Math.round((s.paid||0)*100)}% បាន​បង់</div></div>
            </div>
          </div>
          <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',marginBottom:12}}>វឌ្ឍនភាព · PROGRESS</div>
            <div style={{display:'flex',alignItems:'baseline',gap:8}}>
              <div style={{fontSize:34,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>{s.hours}</div>
              <div style={{fontSize:13,color:'var(--ink-3)'}}>/ {s.target} ម៉ោង</div>
            </div>
            <div style={{height:8,background:'var(--border)',borderRadius:999,marginTop:10,overflow:'hidden'}}>
              <div style={{width:`${(s.hours/s.target)*100}%`,height:'100%',background:'var(--accent)',borderRadius:999}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:14}}>
              {[
                {l:'Theory',  v: s.theory  ? `${s.theory}%`  : '—', ok: (s.theory||0)  >= 70},
                {l:'Yard',    v: s.yard    ? `${s.yard}%`    : '—', ok: (s.yard||0)    >= 70},
                {l:'City',    v: s.city    ? `${s.city}%`    : '—', ok: (s.city||0)    >= 70},
                {l:'Highway', v: s.highway ? `${s.highway}%` : '—', ok: (s.highway||0) >= 70},
              ].map((m,i)=>(
                <div key={i} style={{padding:10,background:'var(--surface-muted)',borderRadius:8}}>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{m.l}</div>
                  <div style={{fontSize:14,fontWeight:600,marginTop:2,color:m.ok?'var(--good)':'var(--ink-2)'}}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'18px 24px'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',marginBottom:12}}>សកម្ម​ភាព · TIMELINE</div>
            {(() => {
              const sLessons = (LESSONS||[]).filter(l=>l.studentId===s.id&&l.status!=='cancelled').sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,5);
              if (sLessons.length === 0) return <div style={{padding:'12px 0',fontSize:12,color:'var(--ink-3)'}}>មិន​ទាន់​មាន​សកម្ម​ភាព · No activity yet</div>;
              return sLessons.map((l,i) => {
                const inst = (INSTRUCTORS||[]).find(ii=>ii.id===l.instId);
                return (
                  <div key={i} style={{display:'flex',gap:14,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none'}}>
                    <div style={{width:60,fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{l.date}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13}}>{l.type}</div>
                      <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{inst?.en || '—'}</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Tab: Schedule */}
      {tab === 'schedule' && (
        <div style={{flex:1,overflow:'auto'}}>
          <div style={{padding:'14px 24px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:500}}>
              {tr('កាលវិភាគ​​ · ','Schedule · ')}{studentLessons.filter(isUpcoming).length} {tr('មេរៀន​ខាង​មុខ','upcoming')}
            </div>
            <Btn kind="primary" size="sm" onClick={()=>openForm?.('newLesson',{studentId:s.id})} icon={<Icon name="cal" size={12}/>}>
              {tr('កក់​ថ្មី','Book new')}
            </Btn>
          </div>
          {studentLessons.length === 0 ? (
            <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
              {tr('មិន​​មាន​មេរៀន​ដែល​បាន​ណាត់','No lessons scheduled yet')}
            </div>
          ) : (
            <div style={{padding:'8px 0 16px'}}>
              {[...studentLessons].sort((a,b) => a.day - b.day || a.h - b.h).map((l, i) => {
                const it = instById(l.inst);
                const v = vehById(l.veh);
                const col = LESSON_COLOR_MAP[l.color] || {fg:'var(--accent)',bg:'var(--accent-soft)',bd:'var(--accent)'};
                const upcoming = isUpcoming(l);
                const dayNames = typeof DAYS_KM !== 'undefined' ? DAYS_KM : [];
                const dayName = dayNames[l.day] || `Day ${l.day}`;
                const lKey = `sched-${l.day}-${l.h}`;
                const isExp = expandedLesson === lKey;
                return (
                  <div key={i} style={{margin:'8px 16px 0'}}>
                    <div onClick={()=>setExpandedLesson(isExp ? null : lKey)} style={{
                      padding:14,borderRadius:isExp?'10px 10px 0 0':10,
                      border:`1px solid ${upcoming?col.bd:'var(--border)'}`,
                      borderBottom:isExp?'none':undefined,
                      background:upcoming?col.bg:'var(--surface-muted)',
                      opacity:upcoming?1:0.7, cursor:'pointer',
                    }}>
                      <div style={{display:'flex',gap:12,alignItems:'center'}}>
                        <div style={{width:48,textAlign:'center',flexShrink:0,borderRight:'1px solid var(--border)',paddingRight:12}}>
                          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{dayName}</div>
                          <div style={{fontSize:20,fontWeight:700,color:col.fg,fontVariantNumeric:'tabular-nums'}}>{String(l.h).padStart(2,'0')}</div>
                          <div style={{fontSize:10,color:'var(--ink-3)'}}>{l.len}h</div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,color:col.fg}}>{l.type}</div>
                          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3,display:'flex',gap:8}}>
                            {it && <span>👤 {it.name}</span>}
                            {v && <span>🚗 {v.plate}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          {!upcoming && <Badge tone="neutral">{tr('បាន​បញ្ចប់','Done')}</Badge>}
                          {upcoming && <Badge tone="accent">{tr('ខាង​មុខ','Upcoming')}</Badge>}
                          <div style={{transform:isExp?'rotate(90deg)':'none',transition:'transform .2s',color:'var(--ink-3)'}}><Icon name="chev" size={13}/></div>
                        </div>
                      </div>
                    </div>
                    {isExp && (
                      <div style={{padding:'12px 14px',background:'var(--surface-muted)',borderRadius:'0 0 10px 10px',border:`1px solid ${col.bd}`,borderTop:'none',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                        {it && <div style={{fontSize:12,color:'var(--ink-2)',flex:1}}>👤 {it.name} · ★ {it.rating}</div>}
                        {v && <div style={{fontSize:12,color:'var(--ink-2)',flex:1}}>🚗 {v.plate} · {v.make}</div>}
                        {upcoming && canEdit && (
                          <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
                            <Btn kind="ghost" size="sm" onClick={()=>toast(tr('ផ្លាស់​ប្ដូរ​','Rescheduled'),'neutral')}>{tr('ផ្លាស់​ប្ដូរ','Reschedule')}</Btn>
                            <Btn kind="ghost" size="sm" onClick={()=>{ toast(tr('បាន​លុប​ចោល','Cancelled'),'warn'); setExpandedLesson(null); }} style={{color:'var(--danger)',borderColor:'var(--danger)'}}>{tr('លុប​ចោល','Cancel')}</Btn>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Lessons */}
      {tab === 'lessons' && (
        <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>
          {/* Filter chips */}
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap'}}>
            {[
              {id:'all',      km:'ទាំង​អស់', en:'All'},
              {id:'upcoming', km:'ខាង​មុខ',  en:'Upcoming'},
              {id:'done',     km:'បាន​បញ្ចប់', en:'Done'},
            ].map(f => (
              <button key={f.id} onClick={()=>setLessonFilter(f.id)} style={{
                padding:'5px 12px',borderRadius:99,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',fontFamily:'inherit',
                background:lessonFilter===f.id?'var(--accent)':'var(--surface-muted)',
                color:lessonFilter===f.id?'#fff':'var(--ink-2)',
              }}>
                {tr(f.km, f.en)}
                <span style={{marginLeft:5,opacity:.7,fontSize:10}}>
                  {f.id==='all'?studentLessons.length:f.id==='upcoming'?studentLessons.filter(isUpcoming).length:studentLessons.filter(l=>!isUpcoming(l)).length}
                </span>
              </button>
            ))}
          </div>
          {filteredLessons.length === 0 ? (
            <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
              {tr('គ្មាន​មេរៀន','No lessons')}
            </div>
          ) : (
            <div style={{flex:1,overflow:'auto'}}>
              {[...filteredLessons].sort((a,b) => a.day - b.day || a.h - b.h).map((l, i) => {
                const it = instById(l.inst);
                const v = vehById(l.veh);
                const col = LESSON_COLOR_MAP[l.color] || {fg:'var(--accent)',bg:'var(--accent-soft)',bd:'var(--accent)'};
                const upcoming = isUpcoming(l);
                const dayNames = typeof DAYS_KM !== 'undefined' ? DAYS_KM : [];
                const dayName = dayNames[l.day] || `Day ${l.day}`;
                const lKey = `${l.day}-${l.h}`;
                const isExpanded = expandedLesson === lKey;
                return (
                  <div key={i}>
                    <div
                      onClick={()=>setExpandedLesson(isExpanded ? null : lKey)}
                      style={{
                        display:'grid',gridTemplateColumns:'56px 1fr auto',gap:12,
                        padding:'12px 16px',cursor:'pointer',alignItems:'center',
                        borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
                        background: isExpanded ? 'var(--surface-muted)' : 'transparent',
                        transition:'background .1s',
                      }}
                      onMouseEnter={e=>{ if(!isExpanded) e.currentTarget.style.background='var(--surface-muted)'; }}
                      onMouseLeave={e=>{ if(!isExpanded) e.currentTarget.style.background='transparent'; }}
                    >
                      <div style={{
                        textAlign:'center',padding:'8px 4px',borderRadius:8,
                        background:col.bg,border:`1px solid ${col.bd}`,
                      }}>
                        <div style={{fontSize:9,color:col.fg,fontFamily:'"JetBrains Mono",monospace',fontWeight:600}}>{dayName}</div>
                        <div style={{fontSize:16,fontWeight:700,color:col.fg,fontVariantNumeric:'tabular-nums'}}>{String(l.h).padStart(2,'0')}h</div>
                        <div style={{fontSize:9,color:col.fg}}>{l.len}h</div>
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{l.type}</div>
                        <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
                          {it ? it.name : '—'} · {v ? v.plate : '—'}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <Badge tone={upcoming?'accent':'neutral'}>{tr(upcoming?'ខាង​មុខ':'បាន​ចប់', upcoming?'Upcoming':'Done')}</Badge>
                        <div style={{transform:isExpanded?'rotate(90deg)':'none',transition:'transform .2s',color:'var(--ink-3)'}}>
                          <Icon name="chev" size={13}/>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{padding:'12px 16px',background:'var(--surface-muted)',borderBottom:'1px solid var(--border)',display:'flex',gap:8,flexWrap:'wrap'}}>
                        {it && (
                          <div style={{flex:1,minWidth:160,padding:'10px 12px',background:'var(--surface)',borderRadius:8,fontSize:12}}>
                            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>INSTRUCTOR</div>
                            <div style={{fontWeight:500}}>{it.name}</div>
                            <div style={{color:'var(--ink-3)',marginTop:2}}>★ {it.rating} · {it.lang}</div>
                          </div>
                        )}
                        {v && (
                          <div style={{flex:1,minWidth:140,padding:'10px 12px',background:'var(--surface)',borderRadius:8,fontSize:12}}>
                            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>VEHICLE</div>
                            <div style={{fontWeight:500}}>{v.make}</div>
                            <div style={{color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{v.plate}</div>
                          </div>
                        )}
                        {upcoming && canEdit && (
                          <div style={{display:'flex',gap:6,alignSelf:'flex-end',marginLeft:'auto'}}>
                            <Btn kind="ghost" size="sm" onClick={()=>toast(tr('ផ្លាស់​ប្ដូរ​','Lesson rescheduled'),'neutral')}>
                              {tr('ផ្លាស់​ប្ដូរ','Reschedule')}
                            </Btn>
                            <Btn kind="ghost" size="sm" onClick={()=>{ toast(tr('បាន​លុប​ចោល','Cancelled'),'warn'); setExpandedLesson(null); }} style={{color:'var(--danger)',borderColor:'var(--danger)'}}>
                              {tr('លុប​ចោល','Cancel')}
                            </Btn>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Messages */}
      {tab === 'messages' && (
        <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>
          {/* Quick templates */}
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',marginBottom:10}}>
              {tr('ស្បែក​​​ Default · ','QUICK TEMPLATES · ')}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {MSG_TEMPLATES.map((tpl, i) => (
                <button key={i} onClick={()=>sendMsg(tpl.text)} style={{
                  padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',border:'1px solid var(--border)',
                  background:'var(--surface)',color:'var(--ink-2)',fontFamily:'inherit',
                  display:'flex',alignItems:'center',gap:5,
                  transition:'background .1s',
                }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}
                >
                  <span>{tpl.type==='reminder'?'🔔':tpl.type==='assessment'?'📝':tpl.type==='payment'?'💳':'⭐'}</span>
                  {tr(tpl.km, tpl.en)}
                </button>
              ))}
            </div>
          </div>
          {/* Composer */}
          <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',gap:8}}>
            <textarea
              value={msgText}
              onChange={e=>setMsgText(e.target.value)}
              placeholder={tr('សរសេរ​សារ​​ · …','Type a message · …')}
              rows={2}
              style={{
                flex:1,padding:'8px 10px',fontSize:12,border:'1px solid var(--border)',
                borderRadius:8,background:'var(--surface)',color:'var(--ink)',
                fontFamily:'inherit',resize:'none',outline:'none',lineHeight:1.5,
              }}
              onKeyDown={e=>{ if(e.key==='Enter' && (e.ctrlKey||e.metaKey)) sendMsg(msgText); }}
            />
            <Btn kind="primary" onClick={()=>sendMsg(msgText)} disabled={!msgText.trim()}
              style={{alignSelf:'flex-end'}}
              icon={<Icon name="arrow" size={13}/>}>
              {tr('ផ្ញើ','Send')}
            </Btn>
          </div>
          {/* Sent history */}
          <div style={{flex:1,overflow:'auto'}}>
            {sentMsgs.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
                {tr('មិន​ទាន់​មាន​​​​​ · ','No messages sent yet')}
              </div>
            ) : (
              <div style={{padding:'8px 0'}}>
                <div style={{padding:'4px 16px',fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>
                  {tr('ប្រវត្តិ​ · ','SENT HISTORY · ')}
                </div>
                {sentMsgs.map((m, i) => (
                  <div key={i} style={{padding:'10px 16px',borderBottom:'1px solid var(--border)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{m.time}</span>
                      <span style={{fontSize:9,padding:'2px 7px',borderRadius:4,
                        background:m.type==='good'?'var(--good)':m.type==='payment'?'var(--warn)':m.type==='reminder'?'var(--accent-soft)':'var(--surface-muted)',
                        color:m.type==='good'?'#fff':m.type==='payment'?'#fff':m.type==='reminder'?'var(--accent)':'var(--ink-3)',
                      }}>
                        {m.type==='reminder'?'🔔':m.type==='assessment'?'📝':m.type==='payment'?'💳':m.type==='good'?'⭐':'✉️'}
                      </span>
                    </div>
                    <div style={{fontSize:12,color:'var(--ink-2)',lineHeight:1.5}}>{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Curriculum */}
      {tab === 'curriculum' && (
        <div style={{flex:1,overflow:'auto'}}>
          {/* overall bar */}
          <div style={{padding:'14px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:14}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--ink-3)',marginBottom:5}}>
                <span>{totalDone}/{totalTopics} {tr('មេរៀន','topics')}</span>
                <span style={{fontWeight:600,color:'var(--accent)'}}>{Math.round((totalDone/totalTopics)*100)}%</span>
              </div>
              <div style={{height:6,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(totalDone/totalTopics)*100}%`,background:'var(--accent)',borderRadius:99,transition:'width .4s'}}/>
              </div>
            </div>
            {canEdit && (
              <div style={{fontSize:11,color:'var(--ink-3)',flexShrink:0}}>
                {tr('ចុច​ ☑ ដើម្បី​សម្គាល់','Click ☑ to mark')}
              </div>
            )}
          </div>

          {CURRICULUM.map(stage => {
            const stageDone = stage.topics.filter(t2 => curriculumDone.has(t2.id)).length;
            const isOpen = openStages[stage.id];
            return (
              <div key={stage.id} style={{borderBottom:'1px solid var(--border)'}}>
                {/* Stage header */}
                <button onClick={()=>setOpenStages(p=>({...p,[stage.id]:!p[stage.id]}))} style={{
                  width:'100%',padding:'12px 24px',display:'flex',alignItems:'center',gap:12,
                  background:'var(--surface-muted)',border:'none',cursor:'pointer',font:'inherit',color:'inherit',textAlign:'left',
                }}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{tr(stage.km,stage.en)}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{stageDone}/{stage.topics.length} {tr('បញ្ចប់','done')}</div>
                  </div>
                  <div style={{transform:isOpen?'rotate(90deg)':'none',transition:'transform .2s'}}>
                    <Icon name="arrow" size={13} color="var(--ink-3)"/>
                  </div>
                </button>

                {isOpen && stage.topics.map((topic, idx) => {
                  const isDone = curriculumDone.has(topic.id);
                  const feedback = curriculumFeedback[topic.id] || '';
                  const draft = draftFeedback[topic.id] || '';
                  const isAssessment = topic.id === 's1-23' || topic.id === 's2-16';
                  return (
                    <div key={topic.id} style={{
                      padding:'10px 24px',
                      borderTop:'1px solid var(--border)',
                      background:isDone?'rgba(59,122,87,.03)':'transparent',
                    }}>
                      {/* Topic row */}
                      <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                        {/* Checkbox */}
                        <div
                          onClick={()=>toggleTopic(topic.id)}
                          style={{
                            width:20,height:20,borderRadius:5,border:`2px solid ${isDone?'var(--good)':'var(--border-strong)'}`,
                            background:isDone?'var(--good)':'transparent',
                            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1,
                            cursor:canEdit?'pointer':'default',transition:'all .15s',
                          }}
                        >
                          {isDone && <Icon name="check" size={11} color="#fff" stroke={3}/>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{
                            fontSize:13,lineHeight:1.45,
                            textDecoration:isDone?'line-through':'none',
                            color:isDone?'var(--ink-3)':'var(--ink)',
                            fontWeight:isAssessment?600:400,
                          }}>
                            {tr(topic.km, topic.en)}
                            {isAssessment && <span style={{marginLeft:6,fontSize:9,background:'var(--warn)',color:'#fff',padding:'1px 5px',borderRadius:4}}>ASSESSMENT</span>}
                          </div>
                          <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:1}}>{topic.id.toUpperCase()}</div>

                          {/* Existing feedback */}
                          {feedback && (
                            <div style={{
                              marginTop:8,padding:'8px 12px',
                              background:'var(--accent-soft)',borderLeft:'3px solid var(--accent)',
                              borderRadius:'0 6px 6px 0',fontSize:12,color:'var(--ink-2)',lineHeight:1.5,
                            }}>
                              <div style={{fontSize:9,color:'var(--accent)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:3}}>{tr('មតិ​គ្រូ','INSTRUCTOR NOTE')}</div>
                              {feedback}
                              {canEdit && (
                                <button onClick={()=>setCurriculumFeedback(p=>({...p,[topic.id]:''}))} style={{
                                  marginLeft:8,fontSize:9,color:'var(--ink-3)',background:'none',border:'none',cursor:'pointer',padding:0,
                                }}>✕ {tr('លុប','remove')}</button>
                              )}
                            </div>
                          )}

                          {/* Add feedback (admin/instructor only) */}
                          {canEdit && !feedback && (
                            <div style={{marginTop:6,display:'flex',gap:6,alignItems:'flex-end'}}>
                              <textarea
                                value={draft}
                                onChange={e=>setDraftFeedback(p=>({...p,[topic.id]:e.target.value}))}
                                placeholder={tr('បន្ថែម​មតិ​ · …','Add instructor note · …')}
                                rows={1}
                                style={{
                                  flex:1,padding:'5px 8px',fontSize:11,border:'1px solid var(--border)',
                                  borderRadius:6,background:'var(--surface)',color:'var(--ink)',
                                  fontFamily:'inherit',resize:'none',outline:'none',lineHeight:1.4,
                                }}
                                onFocus={e=>e.target.rows=3}
                                onBlur={e=>{ if(!draft) e.target.rows=1; }}
                              />
                              {draft.trim() && (
                                <Btn kind="primary" size="sm" onClick={()=>saveFeedback(topic.id)}>{tr('រក្សា','Save')}</Btn>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Account (admin only) */}
      {tab === 'account' && role === 'admin' && (
        <div style={{flex:1,overflow:'auto',padding:'20px 24px'}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',marginBottom:16}}>LOGIN ACCOUNT · គណនី​ចូល</div>
          <div style={{background:'var(--surface-muted)',borderRadius:12,padding:16,display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:11,color:'var(--ink-3)',width:80,flexShrink:0}}>USERNAME</span>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:14,fontWeight:600,flex:1}}>{s.id}</span>
              <span style={{padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600,
                background:s.account_disabled?'var(--danger-soft,#fee)':'var(--good-soft,#e6faf0)',
                color:s.account_disabled?'var(--danger)':'var(--good)'}}>
                {s.account_disabled ? tr('ផ្អាក','Suspended') : tr('សកម្ម','Active')}
              </span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:11,color:'var(--ink-3)',width:80,flexShrink:0}}>PASSWORD</span>
              {s.password ? (
                <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:14,flex:1,letterSpacing:'.08em'}}>
                  {acctShowPw ? s.password : '••••••'}
                </span>
              ) : <span style={{fontSize:13,color:'var(--ink-3)',flex:1}}>—</span>}
              <button onClick={()=>setAcctShowPw(p=>!p)} style={{fontSize:12,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>
                {acctShowPw ? tr('លាក់','Hide') : tr('មើល','Show')}
              </button>
            </div>
          </div>

          {acctChanging ? (
            <div style={{marginTop:14,display:'flex',gap:8}}>
              <input value={acctNewPw} onChange={e=>setAcctNewPw(e.target.value)}
                placeholder={tr('Password ថ្មី','New password')}
                style={{flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',fontSize:13,fontFamily:'"JetBrains Mono",monospace',background:'var(--surface)'}}/>
              <Btn kind="primary" size="md" onClick={saveStudentPw}>{tr('រក្សា','Save')}</Btn>
              <Btn kind="ghost" size="md" onClick={()=>{setAcctChanging(false);setAcctNewPw('');}}>✕</Btn>
            </div>
          ) : (
            <div style={{marginTop:14,display:'flex',gap:8}}>
              <Btn kind="ghost" size="md" onClick={()=>setAcctChanging(true)} icon={<Icon name="edit" size={13}/>} style={{flex:1,justifyContent:'center'}}>
                {tr('ផ្លាស់​ Password','Change Password')}
              </Btn>
              <Btn kind={s.account_disabled?'primary':'ghost'} size="md" onClick={toggleStudentSuspend}
                style={{flex:1,justifyContent:'center',color:s.account_disabled?undefined:'var(--danger)',borderColor:s.account_disabled?undefined:'var(--danger)'}}>
                {s.account_disabled ? tr('ដំណើរការ​វិញ','Re-enable') : tr('ផ្អាក','Suspend')}
              </Btn>
            </div>
          )}

          {s.account_disabled && (
            <div style={{marginTop:12,padding:'10px 14px',borderRadius:8,background:'var(--danger-soft,#fee2e2)',border:'1px solid var(--danger,#dc2626)',display:'flex',alignItems:'center',gap:8}}>
              <Icon name="x" size={14} style={{color:'var(--danger)'}}/>
              <span style={{fontSize:12,color:'var(--danger)'}}>
                {tr('គណនីនេះត្រូវបានផ្អាក — សិស្សមិនអាចចូលប្រព័ន្ធបាន','This account is suspended — student cannot log in')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Instructor profile ─────────────────────────────────────────────────────
const InstructorProfile = ({ instructor, onClose }) => {
  const { toast, role, tr } = useAppActions();
  const [showPw, setShowPw] = React.useState(false);
  const [changingPw, setChangingPw] = React.useState(false);
  const [newPw, setNewPw] = React.useState('');
  const [, forceUpdate] = React.useReducer(x => x+1, 0);
  if (!instructor) return null;
  const i = instructor;

  const saveNewPw = () => {
    if (!newPw.trim()) return;
    i.password = newPw.trim();
    const sf = (window.__staffData||[]).find(s => s.instId === i.id || s.id === i.id);
    if (sf) sf.password = newPw.trim();
    if (window.saveAllData) window.saveAllData();
    setChangingPw(false); setNewPw(''); forceUpdate();
    toast(tr('បាន​ផ្លាស់ Password','Password updated'), 'good');
  };

  const toggleSuspend = () => {
    i.account_disabled = !i.account_disabled;
    const sf = (window.__staffData||[]).find(s => s.instId === i.id || s.id === i.id);
    if (sf) sf.account_disabled = i.account_disabled;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(i.account_disabled ? tr('គណនីត្រូវបានផ្អាក','Account suspended') : tr('គណនីដំណើរការ','Account activated'), i.account_disabled ? 'warn' : 'good');
  };
  return (
    <div>
      <Photo tag={i.photo} w="100%" h={180} r={0}/>
      <div style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{i.id}</div>
            <div style={{fontSize:24,fontWeight:600,marginTop:4,fontFamily:'var(--font-display)'}}>{i.name}</div>
            <div style={{fontSize:13,color:'var(--ink-3)',marginTop:2}}>{i.en} · {i.role}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--warn)'}}>
            <Icon name="star" size={16}/>
            <span style={{fontSize:18,fontWeight:600}}>{i.rating}</span>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:20}}>
          {[
            {l:'Students',v:i.students},
            {l:'Today',v:i.today},
            {l:'Since',v:i.since},
          ].map((m,j)=>(
            <div key={j} style={{padding:14,background:'var(--surface-muted)',borderRadius:10}}>
              <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>{m.l}</div>
              <div style={{fontSize:22,fontWeight:600,marginTop:4,fontFamily:'var(--font-display)'}}>{m.v}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:20,padding:'14px 0',borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:11,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:8}}>QUALIFICATIONS · គុណវុឌ្ឍិ</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {i.cls.map(c => <Badge key={c} tone="neutral">Class {c}</Badge>)}
            <Badge tone="neutral">{i.lang}</Badge>
          </div>
        </div>

        {role === 'admin' && (
          <div style={{marginTop:14,padding:'14px 0',borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:10}}>ACCOUNT · គណនី</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:11,color:'var(--ink-3)',width:72,flexShrink:0}}>USERNAME</span>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:13,fontWeight:600}}>{i.id}</span>
              <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:600,
                background:i.account_disabled?'var(--danger-soft,#fee)':'var(--good-soft,#e6faf0)',
                color:i.account_disabled?'var(--danger)':'var(--good)'}}>
                {i.account_disabled ? tr('ផ្អាក','Suspended') : tr('សកម្ម','Active')}
              </span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:11,color:'var(--ink-3)',width:72,flexShrink:0}}>PASSWORD</span>
              {i.password ? (
                <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:13,letterSpacing:'.08em'}}>
                  {showPw ? i.password : '••••••'}
                </span>
              ) : <span style={{fontSize:12,color:'var(--ink-3)'}}>—</span>}
              <button onClick={()=>setShowPw(p=>!p)} style={{marginLeft:4,fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:'2px 4px'}}>
                {showPw ? tr('លាក់','Hide') : tr('មើល','Show')}
              </button>
              <button onClick={()=>setChangingPw(p=>!p)} style={{fontSize:11,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',padding:'2px 4px'}}>
                {tr('កែ','Change')}
              </button>
            </div>
            {changingPw && (
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                <input value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder={tr('Password ថ្មី','New password')}
                  style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:13,fontFamily:'"JetBrains Mono",monospace',background:'var(--surface)'}}/>
                <Btn kind="primary" size="sm" onClick={saveNewPw}>{tr('រក្សា','Save')}</Btn>
                <Btn kind="ghost" size="sm" onClick={()=>{setChangingPw(false);setNewPw('');}}>✕</Btn>
              </div>
            )}
            <Btn kind={i.account_disabled?'primary':'ghost'} size="sm" onClick={toggleSuspend}
              style={{color:i.account_disabled?undefined:'var(--danger)',borderColor:i.account_disabled?undefined:'var(--danger)'}}>
              {i.account_disabled ? tr('ដំណើរការ​វិញ','Re-enable account') : tr('ផ្អាក​គណនី','Suspend account')}
            </Btn>
          </div>
        )}

        <div style={{marginTop:14,display:'flex',gap:8}}>
          <Btn kind="ghost" onClick={()=>toast?.('បាន​​ផ្ញើ​សារ','good')} icon={<Icon name="phone" size={14}/>} style={{flex:1,justifyContent:'center'}}>ហៅ</Btn>
          <Btn kind="primary" onClick={()=>{toast?.('បាន​​រក្សា​​ទុក​','good'); onClose();}} style={{flex:2,justifyContent:'center'}}>រក្សា​ទុក​​ការ​​ផ្លាស់​ប្ដូរ</Btn>
        </div>
      </div>
    </div>
  );
};

// ── Vehicle detail ─────────────────────────────────────────────────────────
const VehicleDetail = ({ vehicle, onClose }) => {
  const { toast, confirm } = useAppActions();
  if (!vehicle) return null;
  const v = vehicle;
  return (
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:18}}>
      <Photo tag={v.photo} w="100%" h={160} r={10}/>
      <div>
        <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{v.plate}</div>
        <div style={{fontSize:22,fontWeight:600,marginTop:4,fontFamily:'var(--font-display)'}}>{v.make}</div>
        <div style={{fontSize:13,color:'var(--ink-3)',marginTop:2}}>{v.cls}</div>
        <div style={{marginTop:10}}>
          <Badge tone={v.status==='Active'?'good':v.status==='Service due'?'warn':'danger'}>{v.status}</Badge>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>ODOMETER</div>
          <div style={{fontSize:22,fontWeight:600,marginTop:4,fontVariantNumeric:'tabular-nums'}}>{v.km.toLocaleString()} <span style={{fontSize:12,fontWeight:400,color:'var(--ink-3)'}}>km</span></div>
        </div>
        <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>NEXT SERVICE</div>
          <div style={{fontSize:14,fontWeight:600,marginTop:4,color:v.service==='Today'||v.service==='Brake pads'?'var(--warn)':'var(--ink)'}}>{v.service}</div>
        </div>
      </div>

      <div>
        <div style={{fontSize:11,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:8}}>MAINTENANCE LOG · ប្រវត្តិ​ថែ​ទាំ</div>
        {(() => {
          const log = (window.__maintenanceData||[]).filter(m => m.vehId === v.id && m.done).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
          if (log.length === 0) return <div style={{padding:'12px 0',fontSize:12,color:'var(--ink-3)'}}>មិន​ទាន់​មាន · No maintenance records yet</div>;
          return log.map((m,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'90px 1fr 1fr auto',gap:10,padding:'8px 0',borderTop:i?'1px dashed var(--border)':'none',alignItems:'center',fontSize:12}}>
              <div style={{color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{m.date}</div>
              <div>{m.type}</div>
              <div style={{color:'var(--ink-3)'}}>{m.shop || 'In-house'}</div>
              <div style={{fontWeight:500,fontVariantNumeric:'tabular-nums'}}>{m.cost ? `$${m.cost}` : '—'}</div>
            </div>
          ));
        })()}
      </div>

      <div style={{display:'flex',gap:8,marginTop:'auto'}}>
        <Btn kind="ghost" onClick={()=>confirm?.({
          title:'យក​យានយន្ត​ចេញ?',
          body:'យានយន្ត​នេះ​នឹង​មិន​អាច​កក់​សម្រាប់​មេរៀន​​​ថ្មី​ទេ​បន្ទាប់​ពី​ផ្លាស់​ប្ដូរ​នេះ​។',
          confirmText:'​យក​ចេញ', danger:true,
          onConfirm: () => { toast?.('បាន​យក​​ចេញ​','warn'); onClose(); },
        })} style={{flex:1,justifyContent:'center'}}>យក​ចេញ · Retire</Btn>
        <Btn kind="primary" onClick={()=>toast?.('បាន​​​​​​កំណត់​​សកម្ម','good')} style={{flex:2,justifyContent:'center'}}>កែប្រែ · Edit</Btn>
      </div>
    </div>
  );
};

// ── Invoice preview ────────────────────────────────────────────────────────
const InvoicePreview = ({ invoice, onClose }) => {
  const { toast } = useAppActions();
  if (!invoice) return null;
  const inv = invoice;
  const s = studentById(inv.student);
  const printIt = () => { window.print(); toast?.('កំពុង​បោះ​ពុម្ព','neutral'); };
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Logo size={32}/>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>Anzen</div>
            <div style={{fontSize:10,color:'var(--ink-3)'}}>DRIVE ACADEMY</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>INVOICE</div>
          <div style={{fontSize:13,fontWeight:600,marginTop:2,fontFamily:'"JetBrains Mono",monospace'}}>{inv.id}</div>
        </div>
      </div>

      <div style={{marginTop:20,padding:14,background:'var(--surface-muted)',borderRadius:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>BILL TO</div>
          <div style={{fontSize:14,fontWeight:500,marginTop:4}}>{s?.name}</div>
          <div style={{fontSize:12,color:'var(--ink-3)'}}>{s?.en} · {s?.id}</div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{s?.phone}</div>
        </div>
        <div>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace'}}>DATE · STATUS</div>
          <div style={{fontSize:14,fontWeight:500,marginTop:4}}>{inv.date} · 2026</div>
          <div style={{marginTop:4}}>
            <Badge tone={inv.status==='Paid'?'good':inv.status==='Pending'?'warn':inv.status==='Overdue'?'danger':'neutral'}>{inv.status}</Badge>
          </div>
        </div>
      </div>

      <div style={{marginTop:18}}>
        <div style={{fontSize:11,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',marginBottom:8}}>ITEMS</div>
        <div style={{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
          {[
            {n:`${s?.cls || ''} · package`, h:'10h', p:inv.amount-10},
            {n:'Materials & mock test',      h:'—',  p:10},
          ].map((it,i) => (
            <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 60px 80px',gap:10,padding:'10px 12px',borderBottom:i<1?'1px solid var(--border)':'none',alignItems:'center',fontSize:12}}>
              <div>{it.n}</div>
              <div style={{color:'var(--ink-3)'}}>{it.h}</div>
              <div style={{textAlign:'right',fontVariantNumeric:'tabular-nums',fontWeight:500}}>${it.p}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:14,display:'flex',justifyContent:'flex-end'}}>
        <div style={{width:240}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--ink-2)',padding:'4px 0'}}><span>Subtotal</span><span style={{fontVariantNumeric:'tabular-nums'}}>${inv.amount}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--ink-2)',padding:'4px 0'}}><span>VAT</span><span style={{fontVariantNumeric:'tabular-nums'}}>$0</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:600,padding:'8px 0',borderTop:'1px solid var(--border)',marginTop:4}}><span>Total</span><span style={{fontVariantNumeric:'tabular-nums'}}>${inv.amount}.00</span></div>
          {inv.method !== '—' && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:6,textAlign:'right'}}>Paid via {inv.method}</div>}
        </div>
      </div>

      <div style={{marginTop:24,display:'flex',gap:8,paddingTop:16,borderTop:'1px solid var(--border)'}}>
        <Btn kind="ghost" onClick={()=>toast?.('បាន​​ផ្ញើ​​​ ​​អ៊ីមែល','good')} icon={<Icon name="phone" size={14}/>} style={{flex:1,justifyContent:'center'}}>​ផ្ញើ​អ៊ីមែល</Btn>
        <Btn kind="ghost" onClick={printIt} style={{flex:1,justifyContent:'center'}}>បោះ​ពុម្ព · Print</Btn>
        <Btn kind="primary" onClick={()=>toast?.('បាន​​ទាញ​​យក','good')} icon={<Icon name="arrow" size={14}/>} style={{flex:1,justifyContent:'center'}}>ទាញ​យក PDF</Btn>
      </div>
    </div>
  );
};

// ── Staff Profile ──────────────────────────────────────────────────────────
const StaffProfile = ({ staffProfile, onClose }) => {
  const { toast, tr, confirm } = useAppActions();
  const s = staffProfile;
  if (!s) return null;

  const att = ATTENDANCE_TODAY[s.id] || {};
  const week = (ATTENDANCE_WEEK[s.id] || {days:[0,0,0,0,0,0,0]}).days;
  const daysWorked = week.reduce((a,b)=>a+b,0);
  const leavesTaken = LEAVE_REQUESTS.filter(r => r.staffId === s.id && r.status === 'Approved').reduce((a,r)=>a+r.days,0);

  const deactivate = () => confirm?.({
    title: tr('ផ្អាក​បុគ្គលិក?','Deactivate staff?'),
    body: tr('សកម្មភាព​នេះ​នឹង​ផ្អាក​ការ​ចូល​ប្រើ​ប្រាស់​របស់​បុគ្គលិក​រូប​នេះ','This will suspend this staff member\'s access.'),
    confirmText: tr('ផ្អាក','Deactivate'), danger: true,
    onConfirm: () => { toast(tr('បាន​ផ្អាក · '+s.name,'Deactivated · '+s.en), 'warn'); onClose(); },
  });

  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {/* Header */}
      <div style={{padding:'24px 24px 20px',borderBottom:'1px solid var(--border)',display:'flex',gap:16,alignItems:'flex-start'}}>
        <Avatar tag={s.photo} size={56}/>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:700,letterSpacing:'-.01em'}}>{tr(s.name,s.en)}</div>
          <div style={{fontSize:13,color:'var(--ink-3)',marginTop:2}}>{tr(s.role_km,s.role_en)} · {tr(s.dept_km,s.dept_en)}</div>
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <Badge tone={s.status==='Active'?'good':'warn'}>{tr(s.status==='Active'?'សកម្ម':'ឈប់​សម្រាក',s.status)}</Badge>
            <Badge tone="neutral">{s.id}</Badge>
          </div>
        </div>
      </div>

      <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:20,overflow:'auto'}}>
        {/* Contact */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            [tr('ទូរស័ព្ទ','Phone'), s.phone, 'phone'],
            [tr('អ៊ីម៉ែល','Email'), s.email, null],
            [tr('ថ្ងៃ​​ចូល​ធ្វើការ','Hire date'), s.hire, null],
            [tr('ថ្ងៃ​​កំណើត','Date of birth'), s.dob, null],
          ].map(([label, val, icon]) => (
            <div key={label} style={{background:'var(--surface-muted)',borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:4}}>{label}</div>
              <div style={{fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
                {icon && <Icon name={icon} size={13} color="var(--accent)"/>}
                {val || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Salary */}
        <div style={{background:'var(--surface-muted)',borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',textTransform:'uppercase',marginBottom:8}}>
            {tr('ព័ត៌មាន​ប្រាក់​ខែ','Salary info')}
          </div>
          <div style={{display:'flex',gap:20}}>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:2}}>{tr('ប្រភេទ','Type')}</div>
              <div style={{fontWeight:500}}>{tr(s.salaryType==='monthly'?'ប្រចាំ​ខែ':'ប្រចាំ​ម៉ោង', s.salaryType==='monthly'?'Monthly':'Hourly')}</div>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:2}}>{tr('ចំនួន','Amount')}</div>
              <div style={{fontWeight:700,fontSize:18}}>${s.salary.toLocaleString()}<span style={{fontSize:12,fontWeight:400,color:'var(--ink-3)'}}>/{tr(s.salaryType==='monthly'?'ខែ':'ម៉ោង',s.salaryType==='monthly'?'mo':'hr')}</span></div>
            </div>
          </div>
        </div>

        {/* This week */}
        <div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:10}}>
            {tr('វត្តមាន​សប្ដាហ៍​នេះ','This week')}
          </div>
          <div style={{display:'flex',gap:6}}>
            {['ច','អ','ព','ព្រ','សុ','ស','អា'].map((d,i) => (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontSize:10,color:'var(--ink-3)'}}>{d}</div>
                <div style={{
                  width:28,height:28,borderRadius:8,
                  background: week[i] ? 'var(--good)' : 'var(--border)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  {week[i] ? <Icon name="check" size={12} color="#fff"/> : null}
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:8}}>
            {daysWorked}/7 {tr('ថ្ងៃ​ក្នុង​សប្ដាហ៍​នេះ','days this week')} · {leavesTaken} {tr('ថ្ងៃ​ច្បាប់​ប្រើ​ហើយ','days leave used')}
          </div>
        </div>

        {/* Today's attendance */}
        <div style={{display:'flex',gap:10}}>
          <div style={{flex:1,background:'var(--surface-muted)',borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',textTransform:'uppercase',marginBottom:4}}>{tr('ចូល​ថ្ងៃ​នេះ','Check-in')}</div>
            <div style={{fontSize:18,fontWeight:700,color: att.ci ? 'var(--good)' : 'var(--ink-3)'}}>{att.ci || '—'}</div>
          </div>
          <div style={{flex:1,background:'var(--surface-muted)',borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',textTransform:'uppercase',marginBottom:4}}>{tr('ចេញ​ថ្ងៃ​នេះ','Check-out')}</div>
            <div style={{fontSize:18,fontWeight:700,color: att.co ? 'var(--ink-2)' : 'var(--ink-3)'}}>{att.co || '—'}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:8,paddingTop:4,borderTop:'1px solid var(--border)'}}>
          <Btn kind="ghost" onClick={()=>toast(tr('ផ្ញើ​សារ​ជោគជ័យ','Message sent'),'good')} icon={<Icon name="phone" size={14}/>} style={{flex:1,justifyContent:'center'}}>
            {tr('ទំនាក់​ទំនង','Contact')}
          </Btn>
          <Btn kind="ghost" onClick={()=>toast(tr('កំពុង​កែ​ប្រែ...','Editing...'),'neutral')} style={{flex:1,justifyContent:'center'}}>
            {tr('កែ​ប្រែ','Edit')}
          </Btn>
          <Btn kind="ghost" onClick={deactivate} style={{flex:1,justifyContent:'center',color:'var(--danger)',borderColor:'var(--danger)'}}>
            {tr('ផ្អាក','Deactivate')}
          </Btn>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LessonDetail, NoteDetail, StudentProfile, InstructorProfile, VehicleDetail, InvoicePreview, StaffProfile });
