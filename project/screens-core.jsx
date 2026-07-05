// screens-core.jsx — Dashboard (role-aware)

// P = Practical (អនុវត្តន៍), T = Theory (ទ្រឹស្ដី); KH/JP = language track.
const LESSON_TYPE_LABEL = { a:'P KH', b:'P KH', c:'T KH', d:'P JP', e:'T JP' };
const LESSON_TYPE_FULL  = { a:'Practical KH', b:'Practical KH', c:'Theory KH', d:'Practical JP', e:'Theory JP' };
// Teaching-location badge (School / Course / …) shown on a lesson row.
const LESSON_LOC_BADGE = {
  school: { l:'School',  bg:'#E5EBF5', fg:'#2A5DB0', bd:'#C7D6EE' },
  yard:   { l:'Course',  bg:'#F4DEDD', fg:'#B0413E', bd:'#E6C7C5' },
  apply:  { l:'Apply',   bg:'#EDE7F6', fg:'#6B3FA0', bd:'#D9CCEC' },
  exam:   { l:'Exam',    bg:'#FCE8D5', fg:'#B5650E', bd:'#F0D2B0' },
  classA: { l:'Class A', bg:'#E2EFE7', fg:'#3B7A57', bd:'#C9E2D3' },
  classB: { l:'Class B', bg:'#E2EFE7', fg:'#3B7A57', bd:'#C9E2D3' },
  classC: { l:'Class C', bg:'#E2EFE7', fg:'#3B7A57', bd:'#C9E2D3' },
};
const LessonBadge = ({ l }) => {
  const loc = LESSON_LOC_BADGE[l?.pickup] ||
    { l: (l?.location && l.location.trim()) || l?.pickup || '—', bg:'var(--surface-muted)', fg:'var(--ink-2)', bd:'var(--border)' };
  return (
    <span title={loc.l} style={{
      fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:5,whiteSpace:'nowrap',flexShrink:0,
      background:loc.bg, color:loc.fg, border:`1px solid ${loc.bd}`,
      fontFamily:'"JetBrains Mono",monospace',
    }}>{loc.l}</span>
  );
};

const DashboardAdmin = () => {
  const { navigate, openForm, openDetail, tr } = useAppActions();
  const bp = useBreakpoint();
  const [ver, setVer] = React.useState(0);
  const [nowHour, setNowHour] = React.useState(new Date().getHours());

  React.useEffect(() => {
    window.__notifyStudentsChanged    = () => setVer(n => n+1);
    window.__notifyInstructorsChanged = () => setVer(n => n+1);
    window.__notifyLessonsChanged     = () => setVer(n => n+1);
    // refresh current-hour every minute so the card flips at the hour boundary
    const tick = setInterval(() => setNowHour(new Date().getHours()), 60000);
    return () => {
      delete window.__notifyStudentsChanged;
      delete window.__notifyInstructorsChanged;
      delete window.__notifyLessonsChanged;
      clearInterval(tick);
    };
  }, []);

  const today = todayStr();

  // Live computed values
  const activeStudents  = STUDENTS.filter(s => s.status !== 'Cleared').length;
  const newStudents     = STUDENTS.filter(s => s.status === 'New').length;
  const examSoon        = STUDENTS.filter(s => s.status === 'Road exam soon').length;
  const clearedStudents = STUDENTS.filter(s => s.status === 'Cleared').length;
  const passRate        = STUDENTS.length > 0 ? Math.round((clearedStudents / STUDENTS.length) * 100) : 0;

  const todayLessons    = LESSONS.filter(l => l.date === today && l.status !== 'cancelled');
  const tomorrowStr     = (() => { const d = new Date(); d.setDate(d.getDate()+1); return localDateStr(d); })();
  const tomorrowLessons = LESSONS.filter(l => l.date === tomorrowStr && l.status !== 'cancelled');
  // Exams are scheduled separately from lessons (green); surface today's here too.
  const allExams        = (window.__schoolSettings && window.__schoolSettings.scheduleExams) || [];
  const todayExams      = allExams.filter(e => e.date === today).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));

  const activeVeh     = VEHICLES.filter(v => v.status === 'Active').length;
  const serviceVeh    = VEHICLES.filter(v => v.status === 'Service due' || v.status === 'Workshop');

  // Enrollment by class
  const clsB = STUDENTS.filter(s => s.cls && s.cls.startsWith('B')).length;
  const clsA = STUDENTS.filter(s => s.cls && s.cls.startsWith('A')).length;
  const clsC = STUDENTS.filter(s => s.cls && s.cls.startsWith('C')).length;
  const maxCls = Math.max(clsA, clsB, clsC, 1);

  // Map any lesson's vehicle ref (id OR plate) to a single canonical vehicle id,
  // so a vehicle used for several lessons in a day counts only ONCE. Excludes
  // '—'/empty (lessons with no vehicle).
  const vehKey = (raw) => {
    if (!raw || raw === '—') return null;
    const v = VEHICLES.find(x => x.id === raw || x.plate === raw);
    return v ? v.id : String(raw).trim();
  };

  // Currently-training: lessons whose time window covers the current hour
  const activeLessons = todayLessons.filter(l => nowHour >= l.h && nowHour < l.h + (l.len || 1));
  const activeInstIds = [...new Set(activeLessons.map(l => l.instId).filter(Boolean))];
  const activeVehIds  = [...new Set(activeLessons.map(l => vehKey(l.veh)).filter(Boolean))];

  // Today / Tomorrow at-a-glance totals
  const todayInstIds    = [...new Set(todayLessons.map(l => l.instId).filter(Boolean))];
  const todayVehIds     = [...new Set(todayLessons.map(l => vehKey(l.veh)).filter(Boolean))];
  const todayStudIds    = [...new Set(todayLessons.map(l => l.studentId).filter(Boolean))];
  const tmrwInstIds     = [...new Set(tomorrowLessons.map(l => l.instId).filter(Boolean))];
  const tmrwVehIds      = [...new Set(tomorrowLessons.map(l => vehKey(l.veh)).filter(Boolean))];
  const tmrwStudIds     = [...new Set(tomorrowLessons.map(l => l.studentId).filter(Boolean))];

  // Dynamic alerts
  const alerts = [
    ...serviceVeh.map(v => ({ tone:'warn', k:tr('យានយន្ត​ត្រូវ​ថែទាំ','Vehicle needs service'), e:`${v.plate} · ${v.make.split('·')[0].trim()} — ${v.service}`, icon:'wrench', go:'fleet' })),
    ...INVOICES.filter(inv => inv.status === 'overdue').map(inv => ({ tone:'danger', k:tr('វិក្កយបត្រ​ហួស​កាល','Invoice overdue'), e:`${inv.id} · ${inv.to}`, icon:'cash', go:'billing' })),
    ...(examSoon > 0 ? [{ tone:'accent', k:tr(`ប្រឡង​ផ្លូវ ${examSoon} នាក់`,`${examSoon} student${examSoon>1?'s':''} exam soon`), e:tr('ត្រូវ​ការ​ណាត់​ប្រឡង','Road exam appointment needed'), icon:'flag', go:'students' }] : []),
    ...(newStudents > 0 ? [{ tone:'good', k:tr(`សិស្ស​ថ្មី ${newStudents} នាក់`,`${newStudents} new student${newStudents>1?'s':''}`), e:tr('រង់​ចាំ​ការ​អនុម័ត','Awaiting approval'), icon:'users', go:'students' }] : []),
  ];

  const ss = window.__schoolSettings || {};

  // Shared lesson row renderer — compact=true when in 2-col mode
  const LessonRow = ({ l, i, compact }) => {
    const s  = studentById(l.studentId);
    const it = instById(l.instId);
    const v  = vehById(l.veh);
    const isNow = l.date === today && nowHour >= l.h && nowHour < l.h + (l.len || 1);
    return (
      <button onClick={()=>openDetail('lesson', l)} style={{
        display:'grid',gridTemplateColumns: compact ? '48px 1fr' : '60px 1fr auto',gap: compact ? 6 : 10,
        padding: compact ? '5px 0' : '9px 0',
        borderTop: i ? '1px solid var(--border)' : 'none',
        alignItems:'center',width:'100%',
        border:'none',background:'transparent',cursor:'pointer',
        font:'inherit',color:'inherit',textAlign:'left',
      }}>
        <div>
          <div style={{fontSize: compact ? 13 : 16, fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em',
            color: isNow ? 'var(--good)' : 'var(--ink)'}}>
            {String(l.h).padStart(2,'0')}:00
          </div>
          {!compact && <div style={{fontSize:10,color: isNow ? 'var(--good)' : 'var(--ink-3)',marginTop:1}}>
            {isNow ? tr('ដំណើរ','now') : `${l.len}h`}
          </div>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap: compact ? 6 : 8,minWidth:0}}>
          {s && <Avatar tag={s.photo} size={compact ? 22 : 26}/>}
          <div style={{minWidth:0}}>
            <div style={{fontSize: compact ? 12 : 13, fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
              color: isNow ? 'var(--good)' : 'var(--ink)'}}>
              {s ? (s.en || s.name) : l.type ? l.type.split('·')[0].trim() : '—'}
            </div>
            <div style={{fontSize:10,color:'var(--ink-3)',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {it?.en || it?.name || '—'}
            </div>
            {v?.plate && (
              <div style={{fontSize:10,marginTop:1,fontWeight:600,fontFamily:'"JetBrains Mono",monospace',
                color: v.trans==='MT' ? '#B0413E' : '#2A5DB0'}}>{v.plate}</div>
            )}
          </div>
        </div>
        {!compact && <LessonBadge l={l}/>}
      </button>
    );
  };

  return (
  <div style={{display:'flex',flexDirection:'column',gap:18}}>
    {/* ── Header (desktop/tablet only — mobile uses the fixed app-bar) ── */}
    {!bp.mobile && (
    <div>
      <div style={{display:'flex',alignItems:'baseline',gap:14,flexWrap:'wrap'}}>
        <div style={{fontSize:28,fontWeight:700,letterSpacing:'-.02em',fontFamily:'var(--font-display)'}}>
          {ss.name || tr('Anzen','Anzen')}
        </div>
        <div style={{fontSize:16,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',fontWeight:400}}>
          {today}
        </div>
      </div>
      <div style={{fontSize:13,color:'var(--ink-2)',marginTop:5}}>
        {todayLessons.length > 0 || newStudents > 0
          ? tr(
              <>{todayLessons.length > 0 && <span>មាន <b>{todayLessons.length} មេរៀន</b> ថ្ងៃ​នេះ</span>}{newStudents > 0 && <span>{todayLessons.length>0?' · ':''}<b>{newStudents} សិស្ស​ថ្មី</b> រង់ចាំ​ការ​អនុម័ត</span>}</>,
                <>{todayLessons.length > 0 && <span><b>{todayLessons.length} lesson{todayLessons.length>1?'s':''}</b> today</span>}{newStudents > 0 && <span>{todayLessons.length>0?' · ':''}<b>{newStudents} new student{newStudents>1?'s':''}</b> awaiting approval</span>}</>
            )
          : tr('សូម​ស្វាគមន៍ · ចាប់​ផ្ដើម​ដោយ​បន្ថែម​គ្រូ​ & សិស្ស', 'Welcome — start by adding instructors & students')}
      </div>
    </div>
    )}

    {/* ── KPI strip — desktop/tablet only ── */}
    {!bp.mobile && <div style={{display:'grid',gridTemplateColumns:bp.tablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)',gap:12}}>
      <KPICard label={tr('សិស្ស​សកម្ម','Active students')} onClick={()=>navigate('students')}>
        <Stat value={String(activeStudents)} sub={tr(`ចុះ​ឈ្មោះ​សរុប ${STUDENTS.length}`,`${STUDENTS.length} total enrolled`)}/>
        {STUDENTS.length === 0
          ? <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)'}}>{tr('មិន​ទាន់​មាន​សិស្ស','No students yet')}</div>
          : <div style={{marginTop:10,height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}><div style={{width:`${STUDENTS.length>0?(activeStudents/Math.max(activeStudents,1))*100:0}%`,height:'100%',background:'var(--accent)'}}/></div>
        }
      </KPICard>
      <KPICard label={tr('មេរៀន​ថ្ងៃ​នេះ','Lessons today')} onClick={()=>navigate('schedule')}>
        <Stat value={String(todayLessons.length)} sub={tr(`សរុប​មេរៀន ${LESSONS.length}`,`${LESSONS.length} total lessons`)}/>
        {LESSONS.length === 0
          ? <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)'}}>{tr('មិន​ទាន់​មាន​មេរៀន','No lessons yet')}</div>
          : <div style={{marginTop:10,display:'flex',gap:4,alignItems:'flex-end',height:28}}>
              {[...Array(5)].map((_,i) => {
                const d = new Date(today+'T00:00:00'); d.setDate(d.getDate() - 4 + i);
                const ds = localDateStr(d);
                const cnt = LESSONS.filter(l=>l.date===ds&&l.status!=='cancelled').length;
                const maxCnt = Math.max(...[...Array(5)].map((_2,j2)=>{const d2=new Date(today+'T00:00:00');d2.setDate(d2.getDate()-4+j2);return LESSONS.filter(l=>l.date===localDateStr(d2)&&l.status!=='cancelled').length;}),1);
                return <div key={i} style={{flex:1,height:`${Math.max(10,(cnt/maxCnt)*100)}%`,background:ds===today?'var(--accent)':'var(--border)',borderRadius:2}}/>;
              })}
            </div>
        }
      </KPICard>

      {/* Currently training — replaces Total Revenue */}
      <KPICard label={tr('កំពុង​ហ្វឹក​ហាត់','Currently Training')} onClick={()=>navigate('schedule')}>
        {activeLessons.length === 0 ? (
          <div style={{fontSize:12,color:'var(--ink-3)'}}>
            {tr('គ្មាន​មេរៀន​ឥឡូវ','No active lessons now')}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {activeLessons.map((l,i) => {
              const it = instById(l.instId);
              const v  = vehById(l.veh);
              return (
                <div key={i} style={{fontSize:14,fontWeight:700,color:'var(--ink)',lineHeight:1.25}}>
                  {it?.name || it?.en || '—'}
                  {v && <span style={{color:'var(--ink-3)',fontWeight:400}}> · {v.plate}</span>}
                </div>
              );
            })}
          </div>
        )}
      </KPICard>

      <KPICard label={tr('អត្រា​ជោគ​ជ័យ','Cleared rate')} onClick={()=>navigate('progress')}>
        <Stat value={STUDENTS.length > 0 ? `${passRate}%` : '—'} sub={tr(`${clearedStudents} ជោគជ័យ`,`${clearedStudents} cleared`)}/>
        {STUDENTS.length === 0
          ? <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)'}}>{tr('មិន​ទាន់​មាន​ទិន្នន័យ','No data yet')}</div>
          : <div style={{marginTop:10,height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}><div style={{width:`${passRate}%`,height:'100%',background:'var(--good)'}}/></div>
        }
      </KPICard>
    </div>}

    {/* ── Today / Tomorrow / Alerts  (glance bar stacked below each lesson card) ── */}
    {(() => {
      const GlanceBar = ({ vehIds, instIds, studIds }) => (
        <div style={{
          background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
          display:'grid',gridTemplateColumns:'repeat(3,1fr)',overflow:'hidden',
        }}>
          {[
            { val:vehIds.length,  km:'រថយន្ត',  en:'VEHICLES',    color:'var(--accent)' },
            { val:instIds.length, km:'គ្រូ',    en:'INSTRUCTORS', color:'var(--good)'   },
            { val:studIds.length, km:'សិស្ស',   en:'STUDENTS',    color:'var(--warn)'   },
          ].map((item,i) => (
            <div key={i} style={{
              display:'flex',alignItems:'center',gap:8,padding:'9px 12px',
              borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                fontSize:24,fontWeight:700,fontFamily:'var(--font-display)',
                color: item.val > 0 ? item.color : 'var(--ink-3)',lineHeight:1,flexShrink:0,
              }}>{item.val}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:9,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>
                  {tr(item.km, item.en)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );

      return (
        <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr':bp.tablet?'1fr 1fr':'1fr 1fr 1fr',gap:12,alignItems:'start'}}>
          {/* Column 1 — Today */}
          {(() => {
            const sorted = todayLessons.slice().sort((a,b)=>a.h-b.h);
            const cols = (!bp.mobile && sorted.length > 5) ? 2 : 1;
            const half = Math.ceil(sorted.length / 2);
            return (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {todayExams.length > 0 && (
                  <Card bar label={tr('ប្រឡង / ដាក់ពាក្យ ថ្ងៃ​នេះ','TODAY\'S EXAMS / APPLICATIONS')}>
                    {todayExams.map((e,i) => {
                      const stu = (e.studentIds||[]).map(id=>{const s=studentById(id);return s?(s.en||s.name):null;}).filter(Boolean);
                      const ins = (e.instIds||[]).map(id=>{const it=instById(id);return it?(it.en||it.name):null;}).filter(Boolean);
                      const km = window.__SCHED_KIND(e.kind);
                      return (
                        <button key={e.id||i} onClick={()=>openDetail('exam', e)} style={{width:'100%',textAlign:'left',display:'flex',gap:10,alignItems:'flex-start',padding:'9px 0',borderTop:i?'1px solid var(--border)':'none',background:'none',border:'none',cursor:'pointer',font:'inherit'}}>
                          <div style={{fontSize:12,fontWeight:700,fontFamily:'"JetBrains Mono",monospace',color:km.color,minWidth:42}}>{String(e.time||'').slice(0,5)}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:'var(--ink)'}}>{km.icon} {tr(km.km,km.en)}{stu.length?' · '+stu.join(', '):''}</div>
                            {ins.length>0 && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>👨‍🏫 {ins.join(' · ')}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </Card>
                )}
                <Card bar label={tr('មេរៀន​ថ្ងៃ​នេះ','TODAY\'S LESSONS')}>
                  {sorted.length === 0 ? (
                    <div style={{padding:'24px 0',textAlign:'center',color:'var(--ink-3)'}}>
                      <div style={{fontSize:13}}>{tr('គ្មាន​មេរៀន​ថ្ងៃ​នេះ','No lessons scheduled today')}</div>
                      <Btn kind="ghost" size="sm" onClick={()=>openForm('newLesson')} style={{marginTop:12}} icon={<Icon name="plus" size={13}/>}>{tr('បន្ថែម​មេរៀន','Add lesson')}</Btn>
                    </div>
                  ) : cols === 1 ? (
                    sorted.map((l,i) => <LessonRow key={l.id||i} l={l} i={i}/>)
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 10px'}}>
                      <div>{sorted.slice(0,half).map((l,i) => <LessonRow key={l.id||i} l={l} i={i} compact/>)}</div>
                      <div style={{borderLeft:'1px solid var(--border)',paddingLeft:10}}>
                        {sorted.slice(half).map((l,i) => <LessonRow key={l.id||i} l={l} i={i} compact/>)}
                      </div>
                    </div>
                  )}
                </Card>
                <GlanceBar vehIds={todayVehIds} instIds={todayInstIds} studIds={todayStudIds}/>
              </div>
            );
          })()}

          {/* Column 2 — Tomorrow */}
          {(() => {
            const sorted = tomorrowLessons.slice().sort((a,b)=>a.h-b.h);
            const cols = (!bp.mobile && sorted.length > 5) ? 2 : 1;
            const half = Math.ceil(sorted.length / 2);
            return (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <Card bar label={tr('មេរៀន​ថ្ងៃ​ស្អែក','TOMORROW\'S LESSONS')}>
                  {sorted.length === 0 ? (
                    <div style={{padding:'24px 0',textAlign:'center',color:'var(--ink-3)'}}>
                      <div style={{fontSize:13}}>{tr('គ្មាន​មេរៀន​ថ្ងៃ​ស្អែក','No lessons scheduled tomorrow')}</div>
                      <Btn kind="ghost" size="sm" onClick={()=>openForm('newLesson')} style={{marginTop:12}} icon={<Icon name="plus" size={13}/>}>{tr('បន្ថែម​មេរៀន','Add lesson')}</Btn>
                    </div>
                  ) : cols === 1 ? (
                    sorted.map((l,i) => <LessonRow key={l.id||i} l={l} i={i}/>)
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 10px'}}>
                      <div>{sorted.slice(0,half).map((l,i) => <LessonRow key={l.id||i} l={l} i={i} compact/>)}</div>
                      <div style={{borderLeft:'1px solid var(--border)',paddingLeft:10}}>
                        {sorted.slice(half).map((l,i) => <LessonRow key={l.id||i} l={l} i={i} compact/>)}
                      </div>
                    </div>
                  )}
                </Card>
                <GlanceBar vehIds={tmrwVehIds} instIds={tmrwInstIds} studIds={tmrwStudIds}/>
              </div>
            );
          })()}

          {/* Column 3 — Alerts */}
          <Card bar label={tr('ការ​ជូន​ដំណឹង','ALERTS')}>
            {alerts.length === 0 ? (
              <div style={{padding:'24px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
                {tr('គ្មាន​ការ​ជូន​ដំណឹង','No alerts — everything looks good')}
              </div>
            ) : alerts.map((a,i) => (
              <button key={i} onClick={()=>navigate(a.go)} style={{
                display:'flex',gap:10,padding:'10px 0',borderTop:i?'1px solid var(--border)':'none',
                width:'100%',textAlign:'left',border:'none',background:'transparent',cursor:'pointer',font:'inherit',color:'inherit',
              }}>
                <div style={{
                  width:30,height:30,borderRadius:8,flexShrink:0,
                  background: a.tone==='warn'?'#F6E9DC':a.tone==='danger'?'#F4DEDD':a.tone==='good'?'#E5F0EA':'var(--accent-soft)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color: a.tone==='warn'?'var(--warn)':a.tone==='danger'?'var(--danger)':a.tone==='good'?'var(--good)':'var(--accent)',
                }}>
                  <Icon name={a.icon} size={14}/>
                </div>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:12,fontWeight:500}}>{a.k}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{a.e}</div>
                </div>
              </button>
            ))}
          </Card>
        </div>
      );
    })()}
  </div>
  );
};

// Reusable clickable KPI card (hover affordance)
const KPICard = ({ children, label, onClick }) => {
  const [hover, setHover] = React.useState(false);
  // Khmer needs a taller line-height (stacked vowel marks) and its own font —
  // the mono/uppercase/letter-spacing Latin styling clips & truncates it.
  const isKhmer = typeof label === 'string' && /[ក-៿]/.test(label);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background:'var(--surface)', border:`1px solid ${hover?'var(--ink)':'var(--border)'}`,
        borderRadius:'var(--radius)', padding:16, textAlign:'left',cursor:'pointer',
        font:'inherit',color:'inherit', transition:'border-color .12s, transform .12s',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        // Pin content to top-left — without this a native <button> vertically
        // centers its content, so a card with short content drops its label down.
        display:'flex', flexDirection:'column', alignItems:'stretch', justifyContent:'flex-start',
      }}>
      {label && <div style={{
        fontSize: isKhmer ? 12 : 10, fontWeight: 700,
        lineHeight: 1.45,
        fontFamily: isKhmer ? 'var(--font-km), sans-serif' : '"JetBrains Mono", monospace',
        letterSpacing: isKhmer ? 'normal' : '.08em',
        textTransform: isKhmer ? 'none' : 'uppercase',
        color:'var(--ink-3)', marginBottom:10,
        // Reserve room for up to 2 lines so the number below stays aligned
        // across all cards and the title never shifts position.
        minHeight: '2.6em',
        wordBreak:'break-word', overflowWrap:'anywhere',
      }}>{label}</div>}
      {children}
    </button>
  );
};

const DashboardInstructor = () => {
  const { navigate, openForm, openDetail, toast, tr } = useAppActions();
  const bp = useBreakpoint();
  const [ver, setVer] = React.useState(0);
  React.useEffect(() => {
    window.__notifyLessonsChanged = () => setVer(n => n+1);
    return () => { delete window.__notifyLessonsChanged; };
  }, []);
  const me = INSTRUCTORS[0]; // I-01 = Chhay Phearom (logged-in instructor)
  const todayLessons = LESSONS.filter(l => l.date===todayStr() && l.instId==='I-01' && l.status!=='cancelled');
  const myStudents   = STUDENTS.filter(s => LESSONS.some(l => l.instId==='I-01' && l.studentId===s.id));
  const doneCnt      = todayLessons.filter(l => l.status==='done').length;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          {!bp.mobile && <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{tr('ច័ន្ទ · មិថុនា 1, 2026','MON · JUNE 1, 2026')}</div>}
          <div style={{fontSize:28,fontWeight:700,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
            {tr('អរុណ​សួស្ដី លោក វិច្ឆេយ្យ · 5 មេរៀន​ថ្ងៃ​នេះ','Good morning, Vichea · 5 lessons today')}
          </div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4}}>
            {tr(<>ម៉ោង​ដំបូង <b>09:00</b> ជាមួយ <b>សុខ ចាន់ថា</b> · ឡាន <b>2AB-4180</b></>,
                <>First lesson at <b>09:00</b> with <b>Sok Chantha</b> · car <b>2AB-4180</b></>)}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md" onClick={()=>toast(tr('កំពុង​ហៅ​សិស្ស','Calling student'),'neutral')} icon={<Icon name="phone" size={14}/>}>{tr('ហៅ​សិស្ស','Call student')}</Btn>
          <Btn kind="primary" size="md" onClick={()=>toast(tr('មេរៀន​ចាប់​ផ្ដើម 09:00','Lesson started'),'good',{icon:'check'})} icon={<Icon name="check" size={14}/>}>{tr('ចាប់​ផ្ដើម​មេរៀន','Start lesson')}</Btn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:bp.mobile ? 'repeat(2,1fr)' : bp.tablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)',gap:12}}>
        <Card><Stat label={tr('មេរៀន​ថ្ងៃ​នេះ','Today')} value={String(todayLessons.length)} sub={tr(`ចប់ ${doneCnt}`,`${doneCnt} done`)}/></Card>
        <Card><Stat label={tr('សិស្ស​របស់​ខ្ញុំ','My students')} value={String(myStudents.length)} sub={tr('ចុះ​ឈ្មោះ​ហើយ','enrolled')}/></Card>
        <Card><Stat label={tr('ការ​វាយ​តម្លៃ','My rating')} value="4.9" delta="+0.1" sub={tr('ពី 42 មតិ','from 42 reviews')}/></Card>
        <Card><Stat label={tr('ម៉ោង​សប្ដាហ៍​នេះ','Hours this week')} value="28" sub={tr('គោល​ដៅ 30','target 30h')}/></Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:12}}>
        <Card bar label={tr('កាលវិភាគ​ថ្ងៃ​នេះ','YOUR DAY')}>
          {LESSONS.filter(l => l.date === todayStr() && l.instId === 'I-01' && l.status !== 'cancelled').sort((a,b)=>a.h-b.h).map((l,i) => {
            const s = studentById(l.studentId);
            const v = vehById(l.veh);
            return (
              <div key={i} style={{
                display:'grid',gridTemplateColumns:'80px 40px 1fr auto',gap:14,
                padding:'14px 0',borderTop: i? '1px solid var(--border)':'none',
                alignItems:'center',
              }}>
                <div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)'}}>{String(l.h).padStart(2,'0')}:00</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{l.len}h</div>
                </div>
                {s ? <Avatar tag={s.photo} size={36}/> : <div/>}
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{s?.name || l.type}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{l.type} · {v?.plate||'—'}</div>
                </div>
                <Btn kind="soft" size="sm" onClick={()=>openDetail('lesson', l)} icon={<Icon name="chev" size={12}/>}>{tr('មើល','View')}</Btn>
              </div>
            );
          })}
          <div style={{padding:'12px 0',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'center'}}>
            <Btn kind="ghost" size="sm" onClick={()=>navigate('schedule')}>{tr('មើល​សប្ដាហ៍​ទាំង​មូល','View full week')}</Btn>
          </div>
        </Card>

        <Card bar label={tr('សិស្ស​​​​​​ត្រូវ​យក​ចិត្ត​ទុក​ដាក់','NEEDS YOUR ATTENTION')}>
          {STUDENTS.length === 0 && <div style={{fontSize:13,color:'var(--ink-3)',padding:'12px 0'}}>{tr('មិន​ទាន់​មាន​សិស្ស','No students yet')}</div>}
          {STUDENTS.slice(0,3).filter(Boolean).map((s,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'12px 0',borderTop:i?'1px solid var(--border)':'none',alignItems:'center'}}>
              <Avatar tag={s.photo} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{s.name}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
                  {i===0 ? tr('យឺត​ពេល​ក្នុង​ការ​ប្ដូរ​លេខ','slow gear shifts') :
                   i===1 ? tr('ត្រូវ​​​ការ​អនុវត្ត​ចត​រថយន្ត','needs parallel parking') :
                   tr('រួច​រាល់​សម្រាប់​ប្រឡង​ផ្លូវ 🎉','exam-ready 🎉')}
                </div>
              </div>
              <Btn kind="ghost" size="sm" onClick={()=>openDetail('student', s)}>{tr('កំណត់​​ត្រា','Note')}</Btn>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// Circular progress ring for the student dashboard.
const ProgressRing = ({ pct, size = 92, stroke = 9, color = 'var(--accent)', children }) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct || 0)));
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-muted)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition:'stroke-dashoffset .6s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>{children}</div>
    </div>
  );
};

const DashboardStudent = ({ studentId }) => {
  const { navigate, tr, lang } = useAppActions();
  const bp = useBreakpoint();
  const me = STUDENTS.find(s => s.id === studentId) || STUDENTS.find(s => s.id === window.__anzenStudentId) || null;
  const u  = LOGIN_USERS.student;
  const today = (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().slice(0,10);

  const displayName = me ? (lang === 'km' ? me.name : (me.en || me.name)) : (lang === 'km' ? u.km : u.en);
  const firstName   = (displayName || '').split(' ').pop();

  // ── Real progress from logged lessons ─────────────────────────────────────
  const myLessons   = me ? LESSONS.filter(l => l.studentId === me.id) : [];
  const doneLessons = myLessons.filter(l => l.status === 'done');
  const doneHours   = doneLessons.reduce((a,l) => a + (Number(l.len) || 1), 0);
  const target      = Math.max(1, Number(me?.target) || 30);
  // Prefer real logged hours; fall back to a stored value only when it is sane.
  const hours       = doneLessons.length ? doneHours : Math.min(Number(me?.hours) || 0, target);
  const hoursLeft   = Math.max(0, target - hours);
  const pct         = Math.min(1, hours / target);
  const paidPct     = Math.max(0, Math.min(1, Number(me?.paid) || 0));
  const price       = (me && typeof studentPrice === 'function') ? studentPrice(me) : null;
  const instName    = me?.inst && me.inst !== '—' ? me.inst : null;

  // ── Next scheduled lesson ─────────────────────────────────────────────────
  const skey = (d, h) => `${d} ${String(h ?? 0).padStart(2,'0')}`;
  const upcoming = myLessons
    .filter(l => l.status !== 'cancelled' && l.status !== 'done' && l.date >= today)
    .sort((a,b) => skey(a.date,a.h).localeCompare(skey(b.date,b.h)));
  const nextLesson = upcoming[0];

  // ── Next exam / application (from the shared schedule) ─────────────────────
  const myExams = ((window.__schoolSettings && window.__schoolSettings.scheduleExams) || [])
    .filter(e => (e.studentIds || []).includes(me?.id) && e.date >= today)
    .sort((a,b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));
  const nextExam = myExams[0];
  const SK = (k) => (window.__SCHED_KIND ? window.__SCHED_KIND(k) : { km:'ប្រឡង', en:'Exam', icon:'🎓', color:'#12A302', soft:'#eafbe7', text:'#0c5a01' });

  // ── Phase tracking (KH / JP / AI) — the school's real progress model ───────
  const PHASES = window.STUDENT_PHASES || [{k:'KH',label:'KH',color:'#2A5DB0'},{k:'JP',label:'JP',color:'#B0413E'},{k:'AI',label:'AI',color:'#12A302'}];
  const phaseStatus = me?.phaseStatus || {};

  const daysUntil = (d) => Math.round((new Date(d+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000);
  const fmtDate = (d) => { const dd = d.slice(8); const mi = parseInt(d.slice(5,7))-1; const m = (typeof KM_MONTHS!=='undefined' && lang==='km') ? KM_MONTHS[mi] : (typeof EN_MONTHS!=='undefined' ? (EN_MONTHS[mi]||'').slice(0,3) : d.slice(5,7)); return `${parseInt(dd)} ${m}`; };
  const countLabel = (n) => n === 0 ? tr('ថ្ងៃ​នេះ','Today') : n === 1 ? tr('ស្អែក','Tomorrow') : tr(`នៅ ${n} ថ្ងៃ​ទៀត`, `in ${n} days`);
  const hr = new Date().getHours();
  const greet = hr < 12 ? tr('អរុណ​សួស្ដី','Good morning') : hr < 17 ? tr('ទិវា​សួស្ដី','Good afternoon') : tr('សាយ័ណ្ហ​សួស្ដី','Good evening');

  const labelCss = { fontSize:10, color:'var(--ink-3)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:2, fontFamily:'"JetBrains Mono",monospace' };
  const gridStat = { display:'grid', gridTemplateColumns: bp.mobile ? '1fr 1fr' : '1fr 1fr 1fr', gap:12 };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Greeting */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>
            {me ? `${me.name} · ${me.id} · ${tr('ថ្នាក់','Class')} ${me.cls}` : (lang==='km' ? u.km : u.en)}
          </div>
          <div style={{fontSize:bp.mobile?24:28,fontWeight:700,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
            {greet}, {firstName}! 👋
          </div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4}}>
            {nextExam
              ? tr(<>ការ​{SK(nextExam.kind).km}​របស់​អ្នក {countLabel(daysUntil(nextExam.date))} — សូម​ត្រៀម​ខ្លួន!</>, <>Your {SK(nextExam.kind).en.toLowerCase()} is {countLabel(daysUntil(nextExam.date))} — get ready!</>)
              : hoursLeft > 0
                ? tr(<>អ្នក​នៅ​សល់ <b>{hoursLeft} ម៉ោង</b> ទៀត​រហូត​ដល់​គោលដៅ​​វគ្គ​សិក្សា។</>, <>You have <b>{hoursLeft} hours</b> left to reach your course goal.</>)
                : tr('អ្នក​បាន​បញ្ចប់​ម៉ោង​សិក្សា​គ្រប់​ហើយ — អស្ចារ្យ! 🎉','You have completed all your training hours — great work! 🎉')}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexShrink:0}}>
          <Btn kind="ghost" size="md" onClick={()=>navigate('lessons')} icon={<Icon name="book" size={14}/>}>{tr('មេរៀន','Study')}</Btn>
          <Btn kind="accent" size="md" onClick={()=>navigate('booking')} icon={<Icon name="plus" size={14}/>}>{tr('កក់​មេរៀន','Book lesson')}</Btn>
        </div>
      </div>

      {/* Next lesson + progress */}
      <div style={{display:'grid',gridTemplateColumns: bp.mobile ? '1fr' : '1.3fr 1fr',gap:12}}>
        {/* Next lesson */}
        <Card style={{background:'var(--ink)',color:'var(--bg)',border:'none',display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:11,opacity:.6,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{tr('មេរៀន​បន្ទាប់','NEXT LESSON')}</div>
          {nextLesson ? (
            <>
              <div style={{display:'flex',alignItems:'baseline',gap:10,marginTop:10,flexWrap:'wrap'}}>
                <div style={{fontSize:30,fontWeight:600,letterSpacing:'-.02em',fontFamily:'var(--font-display)',lineHeight:1}}>{fmtDate(nextLesson.date)}</div>
                <div style={{fontSize:20,fontWeight:600,fontFamily:'"JetBrains Mono",monospace',opacity:.9}}>{String(nextLesson.h).padStart(2,'0')}:00</div>
                <Badge tone="accent">{countLabel(daysUntil(nextLesson.date))}</Badge>
              </div>
              <div style={{fontSize:13,marginTop:8,opacity:.85}}>
                {(nextLesson.type || tr('អនុវត្តន៍','Practical')).split('·').slice(-1)[0].trim()} · {nextLesson.len || 1}{tr('ម៉ោង','h')}
                {nextLesson.instId && (() => { const i = INSTRUCTORS.find(x=>x.id===nextLesson.instId); return i ? ` · 👨‍🏫 ${lang==='km'?i.name:(i.en||i.name)}` : ''; })()}
              </div>
              <div style={{marginTop:'auto',paddingTop:14}}>
                <Btn kind="ghost" size="sm" onClick={()=>navigate('schedule')} style={{borderColor:'rgba(255,255,255,.3)',color:'#fff'}}>{tr('មើល​កាលវិភាគ','View schedule')}</Btn>
              </div>
            </>
          ) : (
            <>
              <div style={{fontSize:20,fontWeight:600,marginTop:12,opacity:.75,fontFamily:'var(--font-display)'}}>{tr('មិន​ទាន់​មាន​​មេរៀន​កក់','No lesson booked yet')}</div>
              <div style={{fontSize:12,opacity:.6,marginTop:6}}>{tr('កក់​មេរៀន​បន្ទាប់​ដើម្បី​បន្ត​វឌ្ឍនភាព​របស់​អ្នក។','Book your next lesson to keep your progress going.')}</div>
              <div style={{marginTop:'auto',paddingTop:14}}>
                <Btn kind="ghost" size="sm" onClick={()=>navigate('booking')} style={{borderColor:'rgba(255,255,255,.3)',color:'#fff'}}>{tr('កក់​ឥឡូវ','Book now')}</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Course progress ring + phases */}
        <Card bar label={tr('វឌ្ឍនភាព​​​វគ្គ​សិក្សា','COURSE PROGRESS')}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <ProgressRing pct={pct}>
              <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-display)',lineHeight:1}}>{Math.round(pct*100)}%</div>
            </ProgressRing>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                <div style={{fontSize:28,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>{hours}</div>
                <div style={{fontSize:13,color:'var(--ink-3)'}}>/ {target} {tr('ម៉ោង','hrs')}</div>
              </div>
              <div style={{fontSize:12,color:'var(--ink-2)',marginTop:4}}>{doneLessons.length} {tr('មេរៀន​បាន​រៀន','lessons done')}</div>
              {hoursLeft > 0 && <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{tr('នៅ​សល់','left')} {hoursLeft} {tr('ម៉ោង','hrs')}</div>}
            </div>
          </div>
          {/* Phase chips (KH / JP / AI) */}
          <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
            {PHASES.map(p => {
              const st = phaseStatus[p.k] || '';
              const done = st === 'finished', active = st === 'starting';
              return (
                <div key={p.k} style={{
                  display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:999,
                  border:`1.5px solid ${done||active ? p.color : 'var(--border)'}`,
                  background: done ? p.color : active ? (p.color+'1a') : 'transparent',
                  color: done ? '#fff' : active ? p.color : 'var(--ink-3)',
                  fontSize:12,fontWeight:600,
                }}>
                  {done && <Icon name="check" size={11} stroke={3}/>}
                  {p.label}
                  <span style={{fontSize:10,opacity:.85,fontWeight:500}}>{done ? tr('ចប់','done') : active ? tr('កំពុង','now') : tr('រង់ចាំ','—')}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Exam · Payments · Account */}
      <div style={gridStat}>
        {/* Next exam / application */}
        <Card bar label={tr('ការ​ប្រឡង / ដាក់​ពាក្យ','EXAM · APPLICATION')}>
          {nextExam ? (() => { const k = SK(nextExam.kind); return (
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:8,background:k.soft,color:k.text,fontSize:12,fontWeight:700}}>
                <span>{k.icon}</span>{tr(k.km,k.en)}
              </div>
              <div style={{fontSize:26,fontWeight:700,fontFamily:'var(--font-display)',marginTop:10,letterSpacing:'-.01em'}}>{fmtDate(nextExam.date)}</div>
              <div style={{fontSize:13,color:'var(--ink-2)',marginTop:2}}>{(nextExam.time||'').slice(0,5)} · {countLabel(daysUntil(nextExam.date))}</div>
              {myExams.length > 1 && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:8}}>+{myExams.length-1} {tr('ការ​ណាត់​បន្ថែម','more upcoming')}</div>}
            </div>
          ); })() : (
            <div>
              <div style={{fontSize:22,marginBottom:6}}>📝</div>
              <div style={{fontSize:13,color:'var(--ink-2)'}}>{tr('មិន​ទាន់​មាន​ការ​ណាត់​ប្រឡង​ទេ។','No exam scheduled yet.')}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>{tr('គ្រូ​នឹង​ណាត់​ពេល​ពេល​អ្នក​ត្រៀម​រួច។','Your instructor will schedule it when you are ready.')}</div>
            </div>
          )}
        </Card>

        {/* Payments */}
        <Card bar label={tr('ការ​ទូទាត់','PAYMENTS')}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:34,fontWeight:700,fontFamily:'var(--font-display)'}}>{Math.round(paidPct*100)}%</div>
            <div style={{fontSize:13,color:'var(--ink-3)'}}>{tr('បាន​បង់','paid')}</div>
          </div>
          <div style={{height:8,background:'var(--surface-muted)',borderRadius:999,marginTop:10,overflow:'hidden'}}>
            <div style={{width:`${paidPct*100}%`,height:'100%',background: paidPct>=1 ? 'var(--good)' : 'var(--accent)',transition:'width .5s'}}/>
          </div>
          {price != null && (
            <div style={{fontSize:12,color:'var(--ink-2)',marginTop:10}}>
              {paidPct>=1
                ? tr('បាន​បង់​ថ្លៃ​សិក្សា​ពេញ ✓','Tuition fully paid ✓')
                : <>{tr('នៅ​ខ្វះ','Balance')} <b>${Math.round(price*(1-paidPct))}</b> / ${price}</>}
            </div>
          )}
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:6}}>{tr('ទំនាក់​ទំនង​ការិយាល័យ​សម្រាប់​ព័ត៌មាន​លម្អិត','Contact the office for details')}</div>
        </Card>

        {/* Account info */}
        <Card bar label={tr('ព័ត៌មាន​គណនី','ACCOUNT INFO')}>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div><div style={labelCss}>ID</div>
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:600,fontSize:14}}>{me?.id || '—'}</div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><div style={labelCss}>{tr('ថ្នាក់','Class')}</div><div style={{fontWeight:600,fontSize:13}}>{me?.cls || '—'} · {me?.trans || 'AT'}</div></div>
              <div><div style={labelCss}>{tr('ស្ថានភាព','Status')}</div><div style={{fontWeight:500,fontSize:12}}>{me?.status || '—'}</div></div>
            </div>
            <div><div style={labelCss}>{tr('គ្រូ​បង្រៀន','Instructor')}</div>
              <div style={{fontWeight:500,fontSize:13}}>{instName || tr('មិន​ទាន់​កំណត់','Not assigned')}</div></div>
            <div><div style={labelCss}>{tr('ទូរស័ព្ទ','Phone')}</div>
              <div style={{fontWeight:500,fontSize:13,fontFamily:'"JetBrains Mono",monospace'}}>{me?.phone || '—'}</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = ({ role, studentId }) => (
  role === 'student' ? <DashboardStudent studentId={studentId}/> :
                       <DashboardAdmin/>
);

Object.assign(window, { Dashboard, DashboardAdmin, DashboardInstructor, DashboardStudent, KPICard });
