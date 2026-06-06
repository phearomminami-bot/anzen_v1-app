// screens-people.jsx — Students roster + profile detail, Instructors

const StudentsScreen = ({ role = 'admin' }) => {
  const { toast, openForm, openDetail, tr, lang } = useAppActions();
  const bp = useBreakpoint();
  const [selectedId, setSelectedId] = React.useState(null);
  const [filter, setFilter] = React.useState('all');

  // Derive selected from live array every render (picks up newly added students)
  const selected = STUDENTS.find(s => s.id === selectedId) || STUDENTS[0] || null;

  const visible = STUDENTS.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'new') return s.status === 'New';
    if (filter === 'inprogress') return s.status === 'In progress';
    if (filter === 'exam') return s.status === 'Road exam soon';
    if (filter === 'cleared') return s.status === 'Cleared';
    if (filter.startsWith('cls-')) return s.cls.startsWith(filter.slice(4));
    return true;
  });

  const newCount       = STUDENTS.filter(s=>s.status==='New').length;
  const inProgCount    = STUDENTS.filter(s=>s.status==='In progress').length;
  const examCount      = STUDENTS.filter(s=>s.status==='Road exam soon').length;
  const clearedCount   = STUDENTS.filter(s=>s.status==='Cleared').length;
  const chips = [
    {id:'all',         label:tr(`ទាំងអស់ (${STUDENTS.length})`,`All (${STUDENTS.length})`)},
    {id:'new',         label:tr(`ថ្មី (${newCount})`,`New (${newCount})`)},
    {id:'inprogress',  label:tr(`កំពុង​បន្ត (${inProgCount})`,`In progress (${inProgCount})`)},
    {id:'exam',        label:tr(`នឹង​ប្រឡង​ផ្លូវ (${examCount})`,`Road exam soon (${examCount})`)},
    {id:'cleared',     label:tr(`បាន​ជោគជ័យ (${clearedCount})`,`Cleared (${clearedCount})`)},
    {id:'cls-B',       label:tr('ថ្នាក់ B','Class B')},
    {id:'cls-A',       label:tr('ថ្នាក់ A','Class A')},
    {id:'cls-C',       label:tr('ថ្នាក់ C','Class C')},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km={`សិស្ស · ${STUDENTS.length} នាក់`}
        en={`Students · ${STUDENTS.length} enrolled`}
        action={
          <div style={{display:'flex',gap:8}}>
            {can(role,'export','student') && STUDENTS.length > 0 && <Btn kind="ghost" size="md" onClick={()=>toast(tr('កំពុង​ទាញ​យក students.csv','Downloading students.csv'),'good')}>{tr('នាំចេញ CSV','Export CSV')}</Btn>}
            {can(role,'create','student') && <Btn kind="primary" size="md" onClick={()=>openForm('newStudent')} icon={<Icon name="plus" size={14}/>}>{tr('បន្ថែម​សិស្ស','Add student')}</Btn>}
          </div>
        }
      />

      {/* Empty state */}
      {STUDENTS.length === 0 ? (
        <Card style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 24px',textAlign:'center',gap:14}}>
          <div style={{width:60,height:60,borderRadius:999,background:'var(--surface-muted)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ink-3)'}}>
            <Icon name="users" size={26}/>
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>{tr('មិន​ទាន់​មាន​សិស្ស​ទេ','No students yet')}</div>
            <div style={{fontSize:13,color:'var(--ink-3)',lineHeight:1.5}}>{tr('ចុច​ "បន្ថែម​សិស្ស" ដើម្បី​ចុះ​ឈ្មោះ​សិស្ស​ដំបូង​','Click "Add student" to enroll the first student.')}</div>
          </div>
          {can(role,'create','student') && <Btn kind="primary" size="md" onClick={()=>openForm('newStudent')} icon={<Icon name="plus" size={14}/>}>{tr('បន្ថែម​សិស្ស​ដំបូង','Add first student')}</Btn>}
        </Card>
      ) : (
      <div style={{display:'grid',gridTemplateColumns:bp.mobile || bp.tablet ? '1fr' : '1.6fr 1fr',gap:12,alignItems:'start'}}>
        {/* Roster table */}
        <Card pad={0}>
          {/* Filter chips */}
          <div style={{padding:'12px 16px',display:'flex',gap:6,flexWrap:'wrap',borderBottom:'1px solid var(--border)'}}>
            {chips.map(c=>(
              <button key={c.id} onClick={()=>setFilter(c.id)} style={{
                padding:'4px 10px',
                background: filter===c.id ? 'var(--ink)' : 'var(--surface-muted)',
                color: filter===c.id ? 'var(--bg)' : 'var(--ink-2)',
                border:'1px solid ' + (filter===c.id?'var(--ink)':'var(--border)'),
                borderRadius:999, fontSize:11, fontWeight:500, cursor:'pointer',
              }}>{c.label}</button>
            ))}
          </div>
          {/* Table — scrollable on narrow screens */}
          <div style={{overflowX:'auto'}}>
          <div style={{minWidth:500}}>
          <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.5fr 0.8fr 1fr 1fr 1.4fr 24px',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
            <div>{tr('សិស្ស','Student')}</div>
            <div>{tr('ថ្នាក់','Class')}</div>
            <div>{tr('គ្រូ','Instructor')}</div>
            <div>{tr('វឌ្ឍនភាព','Progress')}</div>
            <div>{tr('ស្ថានភាព','Status')}</div>
            <div></div>
          </div>
          {visible.length === 0 && (
            <div style={{padding:'40px 16px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
              {tr('គ្មាន​សិស្ស​ស្រប​នឹង​តម្រង','No students match this filter')}
            </div>
          )}
          {visible.map((s,i)=>(
            <div key={s.id}
              onClick={()=>setSelectedId(s.id)}
              onDoubleClick={()=>openDetail('student', s)}
              style={{
                padding:'12px 16px',
                display:'grid',gridTemplateColumns:'1.5fr 0.8fr 1fr 1fr 1.4fr 24px',gap:14,
                alignItems:'center',
                borderBottom: i<visible.length-1 ? '1px solid var(--border)':'none',
                background: selected?.id === s.id ? 'var(--surface-muted)' : 'transparent',
                cursor:'pointer',
              }}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <Avatar tag={s.photo} size={32} ring={selected?.id===s.id}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lang==='km'?s.name:s.en}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.id}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--ink-2)'}}>{s.cls}</div>
              <div style={{fontSize:12,color:'var(--ink-2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.inst}</div>
              <div>
                <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
                  <div style={{width:`${s.target>0?(s.hours/s.target)*100:0}%`,height:'100%',background:'var(--accent)'}}/>
                </div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4,fontVariantNumeric:'tabular-nums'}}>{s.hours}/{s.target}h</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <Badge tone={
                  s.status==='Cleared' ? 'good' :
                  s.status==='Road exam soon' ? 'warn' :
                  s.status==='New' ? 'accent' : 'neutral'
                }>{s.status}</Badge>
              </div>
              <button onClick={(e)=>{ e.stopPropagation(); openDetail('student', s); }} style={{
                background:'transparent',border:'none',cursor:'pointer',padding:4,color:'var(--ink-3)',
              }} title="មើល​ប្រវត្តិ​​រូប">
                <Icon name="chev" size={14} stroke={1.5}/>
              </button>
            </div>
          ))}
          </div>
          </div>
        </Card>

        {/* Detail panel */}
        {selected ? <StudentDetail s={selected}/> : null}
      </div>
      )}
    </div>
  );
};

const StudentDetail = ({ s }) => {
  const { toast, openForm, openDetail, navigate, tr, lang } = useAppActions();
  const [ver, setVer] = React.useState(0);
  React.useEffect(() => {
    const prev = window.__notifyStudentsChanged;
    window.__notifyStudentsChanged = () => setVer(n => n+1);
    return () => { window.__notifyStudentsChanged = prev; };
  }, []);

  const loggedHours = studentHours(s.id);
  const displayHours = loggedHours > 0 ? loggedHours : (s.hours || 0);
  const pct = s.target > 0 ? Math.min(1, displayHours / s.target) : 0;

  const upcoming = LESSONS
    .filter(l => l.studentId === s.id && l.status === 'scheduled' && l.date >= todayStr())
    .sort((a,b) => a.date.localeCompare(b.date) || a.h - b.h)
    .slice(0, 3);

  const done = LESSONS
    .filter(l => l.studentId === s.id && l.status === 'done')
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const enrolledLabel = s.regDate
    ? (() => { const d=new Date(s.regDate+'T00:00:00'); return `${KM_MONTHS[d.getMonth()]} ${d.getFullYear()}`; })()
    : '—';

  return (
  <Card pad={0}>
    {/* Header */}
    <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
        <Photo tag={s.photo} w={64} h={64} r={999}/>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{lang==='km'?s.name:s.en}</div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{s.id}</div>
        </div>
        <a href={`tel:${(s.phone||'').replace(/\s/g,'')}`} style={{textDecoration:'none'}}>
          <Btn kind="ghost" size="sm" icon={<Icon name="phone" size={13}/>}>{tr('ហៅ','Call')}</Btn>
        </a>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
        <div><span style={{color:'var(--ink-3)'}}>{tr('ថ្នាក់','Class')}</span><div style={{fontWeight:500,marginTop:2}}>{s.cls}</div></div>
        <div><span style={{color:'var(--ink-3)'}}>{tr('គ្រូ','Instructor')}</span><div style={{fontWeight:500,marginTop:2}}>{s.inst||'—'}</div></div>
        <div><span style={{color:'var(--ink-3)'}}>{tr('ទូរស័ព្ទ','Phone')}</span><div style={{fontWeight:500,marginTop:2}}>{s.phone||'—'}</div></div>
        <div><span style={{color:'var(--ink-3)'}}>{tr('ចូល​រៀន','Enrolled')}</span><div style={{fontWeight:500,marginTop:2}}>{enrolledLabel}</div></div>
      </div>
    </div>

    {/* Progress */}
    <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
      <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>{tr('វឌ្ឍនភាព','PROGRESS')}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:8}}>
        <div style={{fontSize:32,fontWeight:600,fontFamily:'var(--font-display)'}}>{displayHours}</div>
        <div style={{fontSize:12,color:'var(--ink-3)'}}>/ {s.target} {tr('ម៉ោង','hours')}</div>
      </div>
      <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,marginTop:8,overflow:'hidden'}}>
        <div style={{width:`${pct*100}%`,height:'100%',background:pct>=1?'var(--good)':'var(--accent)',transition:'width .3s'}}/>
      </div>
      {pct >= 1 && (
        <div style={{fontSize:12,color:'var(--good)',marginTop:6,fontWeight:500}}>{tr('✓ គ្រប់​ម៉ោង — រួច​រាល់​ប្រឡង','✓ Hours complete — ready for road exam')}</div>
      )}
    </div>

    {/* Upcoming */}
    <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
      <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>{tr('មេរៀន​ខាង​មុខ','UPCOMING LESSONS')}</div>
      {upcoming.length === 0 ? (
        <div style={{fontSize:12,color:'var(--ink-3)',padding:'4px 0'}}>{tr('មិន​ទាន់​មាន​មេរៀន​កក់','No lessons scheduled yet')}</div>
      ) : upcoming.map((l,i) => {
        const it = instById(l.instId);
        const c  = (LESSON_COLORS||{})[l.color]||LESSON_COLORS.a;
        return (
          <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderTop:i?'1px dashed var(--border)':'none',alignItems:'center'}}>
            <div style={{width:4,height:36,background:c.fg,borderRadius:2,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500}}>{formatDateShort(l.date,'en')} · {String(l.h).padStart(2,'0')}:00</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>{l.type} · {it?.en||'—'}</div>
            </div>
            <Badge tone="neutral">{l.len}h</Badge>
          </div>
        );
      })}
    </div>

    {/* Done lessons as activity */}
    {done.length > 0 && (
      <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
        <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>{tr('សកម្ម​ភាព​ថ្មីៗ','RECENT ACTIVITY')}</div>
        {done.map((l,i) => {
          const it  = instById(l.instId);
          const d   = new Date(l.date+'T00:00:00');
          const lbl = `${d.getDate()} ${KM_MONTHS[d.getMonth()]}`;
          return (
            <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderTop:i?'1px dashed var(--border)':'none'}}>
              <div style={{width:50,fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',paddingTop:2}}>{lbl}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12}}>{l.type} · {l.len}h</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>{it?.en||'—'}</div>
              </div>
              <Badge tone="good">{tr('ចប់','Done')}</Badge>
            </div>
          );
        })}
      </div>
    )}

    <div style={{padding:14,display:'flex',gap:8,flexWrap:'wrap'}}>
      <Btn kind="ghost" size="sm" onClick={()=>openDetail('student', s)} style={{flex:1,justifyContent:'center'}}>{tr('បើក​ប្រវត្តិ​រូប','Full profile')}</Btn>
      <Btn kind="ghost" size="sm" onClick={()=>navigate('schedule')} icon={<Icon name="cal" size={12}/>} style={{flex:1,justifyContent:'center'}}>{tr('ប្រតិទិន','Schedule')}</Btn>
      <Btn kind="primary" size="sm" onClick={()=>openForm('newLesson',{studentId:s.id})} style={{flex:1,justifyContent:'center'}}>{tr('កក់​មេរៀន','Book lesson')}</Btn>
    </div>
  </Card>
  );
};

const InstructorsScreen = ({ role = 'admin' }) => {
  const { toast, lang, tr } = useAppActions();
  const bp = useBreakpoint();
  const [, forceUpdate] = React.useReducer(x => x+1, 0);
  React.useEffect(() => {
    const prev = window.__notifyInstructorsChanged;
    window.__notifyInstructorsChanged = () => forceUpdate();
    return () => { window.__notifyInstructorsChanged = prev; };
  }, []);

  // Cycling standby: null → school → ground → break → null
  const STANDBY_CYCLE = [null, 'school', 'ground', 'break'];
  const STANDBY_META = {
    school: { km:'សាលា',      en:'School',   color:'#2A5DB0', bg:'#E5EBF5' },
    ground: { km:'ទីលានហាត់', en:'Training', color:'#3B7A57', bg:'#E2EFE7' },
    break:  { km:'សម្រាក',    en:'Break',    color:'#B0413E', bg:'#F4DEDD' },
  };
  const cycleStandby = (inst) => {
    const idx = STANDBY_CYCLE.indexOf(inst.standby ?? null);
    inst.standby = STANDBY_CYCLE[(idx + 1) % STANDBY_CYCLE.length];
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };

  // Student rating: one-time per instructor
  if (!window.__studentRatings) window.__studentRatings = {};
  const studentId = window.__anzenStudentId || null;
  const rateOnce = (inst, stars) => {
    if (!studentId) return;
    if (!window.__studentRatings[studentId]) window.__studentRatings[studentId] = {};
    if (window.__studentRatings[studentId][inst.id]) return; // already rated
    // running average
    const count = inst.ratingCount || 0;
    inst.rating = parseFloat(((inst.rating * count + stars) / (count + 1)).toFixed(2));
    inst.ratingCount = count + 1;
    window.__studentRatings[studentId][inst.id] = stars;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('អរគុណ​ចំពោះ​ការ​វាយ​តម្លៃ!','Thank you for your rating!'), 'good');
  };
  const myRating = (instId) => studentId ? (window.__studentRatings[studentId]?.[instId] || 0) : 0;
  const hasRated = (instId) => !!myRating(instId);

  return (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km={`គ្រូបង្រៀន · ${INSTRUCTORS.filter(i=>i.visible!==false).length} នាក់`}
      en={`Instructors · ${INSTRUCTORS.filter(i=>i.visible!==false).length} on staff`}
    />

    <div style={{display:'grid',gridTemplateColumns: bp.mobile ? 'repeat(auto-fill,minmax(160px,1fr))' : 'repeat(auto-fill,minmax(300px,1fr))',gap: bp.mobile ? 10 : 14}}>
      {INSTRUCTORS.filter(i => i.visible !== false).map(i => {
        const sf = (window.__staffData||[]).find(s => s.instId === i.id || s.en === i.en);
        const phone = (sf?.phone && sf.phone !== '—' ? sf.phone : null) || (i.phone && i.phone !== '—' ? i.phone : null);
        const email = (sf?.email && sf.email !== '—' ? sf.email : null) || (i.email && i.email !== '—' ? i.email : null);
        const photo = sf?.photo || i.photo;
        const sby = i.standby ? STANDBY_META[i.standby] : null;
        const status = sf?.status || null;
        const rated = hasRated(i.id);
        const myStars = myRating(i.id);
        const displayRating = Math.round(role === 'student' && rated ? myStars : (i.rating || 0));
        const photoH = bp.mobile ? 100 : 160;
        const cardPadV = bp.mobile ? 10 : 14;
        const cardPadH = bp.mobile ? 10 : 16;

        return (
        <Card key={i.id} pad={0} style={{display:'flex',flexDirection:'column'}}>

          {/* Photo */}
          <div style={{position:'relative'}}>
            <Photo tag={photo} w="100%" h={photoH} r={0}/>
            <div style={{position:'absolute',top:6,right:6,display:'flex',gap:3}}>
              {i.cls.map(c => <Badge key={c} tone="neutral" style={{fontSize:bp.mobile?9:undefined}}>Class {c}</Badge>)}
            </div>
          </div>

          <div style={{padding:`${cardPadV}px ${cardPadH}px`,flex:1,display:'flex',flexDirection:'column',gap:0}}>

            {/* Status + standby cycling button */}
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              {status && (
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{
                    width:7,height:7,borderRadius:999,flexShrink:0,
                    background: status==='On lesson'?'var(--accent)':status==='At desk'?'var(--good)':'var(--ink-3)',
                  }}/>
                  <span style={{fontSize:11,color:'var(--ink-2)'}}>{status}</span>
                </div>
              )}
              <div style={{flex:1}}/>
              <button onClick={() => cycleStandby(i)} style={{
                padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',
                border: sby ? `1.5px solid ${sby.color}` : '1px solid var(--border)',
                background: sby ? sby.bg : 'transparent',
                color: sby ? sby.color : 'var(--ink-3)',
                transition:'all .12s',
              }}>
                {sby ? (lang==='km' ? sby.km : sby.en) : '—'}
              </button>
            </div>

            {/* Name + ID */}
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:bp.mobile?13:15,fontWeight:700,fontFamily:'var(--font-display)',lineHeight:1.3}}>{lang==='km'?i.name:i.en}</div>
                {!bp.mobile && <div style={{fontSize:12,color:'var(--ink-2)',marginTop:1}}>{i.en}</div>}
              </div>
              <div style={{
                padding:'2px 7px',borderRadius:20,fontSize:10,fontWeight:700,
                background:'var(--surface-muted)',color:'var(--ink-3)',
                border:'1px solid var(--border)',whiteSpace:'nowrap',flexShrink:0,
                fontFamily:'"JetBrains Mono",monospace',
              }}>{i.id}</div>
            </div>

            {/* Role */}
            <div style={{fontSize:bp.mobile?11:12,color:'var(--accent)',fontWeight:500,marginTop:4}}>{i.role}</div>

            {/* Contact info — on mobile show only what has data */}
            <div style={{display:'flex',flexDirection:'column',gap:bp.mobile?3:5,marginTop:bp.mobile?6:10}}>
              {phone && (
                <div style={{display:'flex',alignItems:'center',gap:7,fontSize:bp.mobile?11:12,color:'var(--ink-2)'}}>
                  <Icon name="phone" size={12} color="var(--ink-3)"/>
                  <span>{phone}</span>
                </div>
              )}
              {!bp.mobile && email && (
                <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:'var(--ink-2)'}}>
                  <Icon name="mail" size={12} color="var(--ink-3)"/>
                  <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{email}</span>
                </div>
              )}
              {(!bp.mobile || i.lang) && (
              <div style={{display:'flex',alignItems:'center',gap:7,fontSize:bp.mobile?11:12,color:'var(--ink-2)'}}>
                <Icon name="globe" size={12} color="var(--ink-3)"/>
                <span>{i.lang || 'ខ្មែរ'}</span>
              </div>
              )}
              {!bp.mobile && i.nationality && (
                <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:'var(--ink-2)'}}>
                  <Icon name="flag" size={12} color="var(--ink-3)"/>
                  <span>{i.nationality}</span>
                </div>
              )}
            </div>

            <div style={{flex:1}}/>

            {/* Star rating — hidden for instructor role */}
            {role !== 'instructor' && (
              <div style={{borderTop:'1px solid var(--border)',marginTop:12,paddingTop:10}}>
                {role === 'admin' ? (
                  /* Admin: see actual average, read-only */
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {(i.ratingCount||0) === 0 ? (
                      <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('មិន​ទាន់​មាន​ការ​វាយ​តម្លៃ','No ratings yet')}</span>
                    ) : (
                      <>
                        <div style={{display:'flex',gap:2}}>
                          {[1,2,3,4,5].map(star => (
                            <span key={star} style={{fontSize:17,color:star<=Math.round(i.rating||0)?'var(--warn)':'var(--border)'}}></span>
                          ))}
                        </div>
                        <span style={{fontSize:12,fontWeight:600,color:'var(--ink-2)'}}>{(i.rating||0).toFixed(1)}</span>
                        <span style={{fontSize:11,color:'var(--ink-3)'}}>({i.ratingCount} {tr('មតិ','reviews')})</span>
                      </>
                    )}
                  </div>
                ) : role === 'student' ? (
                  /* Student: rate once */
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {rated ? (
                      <>
                        <div style={{display:'flex',gap:2}}>
                          {[1,2,3,4,5].map(star => (
                            <span key={star} style={{fontSize:17,color:star<=myStars?'var(--warn)':'var(--border)'}}></span>
                          ))}
                        </div>
                        <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('បាន​វាយ​តម្លៃ','Rated')}</span>
                      </>
                    ) : (
                      <>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => rateOnce(i, star)}
                            style={{background:'none',border:'none',padding:'1px 1px',cursor:'pointer',fontSize:22,color:'var(--border)',lineHeight:1}}>
                            ☆
                          </button>
                        ))}
                        <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('វាយ​តម្លៃ','Rate')}</span>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>
        );
      })}
    </div>
  </div>
  );
};

Object.assign(window, { StudentsScreen, InstructorsScreen });
