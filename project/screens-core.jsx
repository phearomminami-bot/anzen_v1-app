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

const DashboardStudent = ({ studentId }) => {
  const { navigate, toast, tr, lang } = useAppActions();
  const bp = useBreakpoint();
  const me = STUDENTS.find(s => s.id === studentId) || null;
  const u  = LOGIN_USERS.student;

  const displayName = me ? (lang === 'km' ? me.name : me.en) : (lang === 'km' ? u.km : u.en);
  const firstName   = displayName.split(' ').pop();
  const hours       = me?.hours  ?? 0;
  const target      = me?.target ?? 30;
  const hoursLeft   = Math.max(0, target - hours);
  const pct         = target > 0 ? hours / target : 0;
  const paidPct     = me?.paid ?? 0;
  const instName    = me?.inst && me.inst !== '—' ? me.inst : null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>
            {me ? `${me.name} · ${me.id} · ${me.cls}` : (lang==='km' ? u.km : u.en)}
          </div>
          <div style={{fontSize:28,fontWeight:700,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
            {tr(`អរុណ​សួស្ដី ${firstName} · បន្ត​ខំ!`, `Good morning, ${firstName}!`)}
          </div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4}}>
            {hoursLeft > 0
              ? tr(<>អ្នក​នៅ​សល់ <b>{hoursLeft} ម៉ោង</b> ទៀត​រហូត​ដល់​ការ​ប្រឡង​ផ្លូវ​។</>, <>You have <b>{hoursLeft} hours</b> left until your road exam.</>)
              : tr('ស្វាគមន៍​ចូល Anzen!', 'Welcome to Anzen!')}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md" onClick={()=>navigate('lessons')} icon={<Icon name="book" size={14}/>}>{tr('មេរៀន','Lessons')}</Btn>
          <Btn kind="accent" size="md" onClick={()=>navigate('booking')} icon={<Icon name="plus" size={14}/>}>{tr('កក់​មេរៀន','Book lesson')}</Btn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12}}>
        <Card style={{background:'var(--ink)',color:'var(--bg)',border:'none'}}>
          <div style={{fontSize:11,opacity:.6,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{tr('មេរៀន​បន្ទាប់','NEXT LESSON')}</div>
          {me?.next && me.next !== '—' ? (
            <>
              <div style={{fontSize:32,fontWeight:600,letterSpacing:'-.02em',marginTop:8,fontFamily:'var(--font-display)',lineHeight:1}}>{me.next}</div>
              <div style={{fontSize:13,marginTop:8,opacity:.85}}>{tr('អនុវត្តន៍ · 2 ម៉ោង','Practical · 2h')}</div>
              {instName && (
                <div style={{marginTop:14,display:'flex',alignItems:'center',gap:12,padding:'12px',background:'rgba(255,255,255,.08)',borderRadius:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{instName}</div>
                  </div>
                  <Btn kind="ghost" size="sm" onClick={()=>navigate('schedule')} style={{borderColor:'rgba(255,255,255,.3)',color:'#fff'}}>{tr('មើល','View')}</Btn>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{fontSize:22,fontWeight:600,marginTop:12,opacity:.7,fontFamily:'var(--font-display)'}}>{tr('មិន​ទាន់​មាន​​មេរៀន​កក់','No lesson booked yet')}</div>
              <div style={{marginTop:14}}>
                <Btn kind="ghost" size="sm" onClick={()=>navigate('booking')} style={{borderColor:'rgba(255,255,255,.3)',color:'#fff'}}>{tr('កក់​ឥឡូវ','Book now')}</Btn>
              </div>
            </>
          )}
        </Card>

        <Card bar label={tr('វឌ្ឍនភាព​​​នៃ​វគ្គ','COURSE PROGRESS')}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:42,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>{hours}</div>
            <div style={{fontSize:14,color:'var(--ink-3)'}}>/ {target} {tr('ម៉ោង','hours')}</div>
          </div>
          <div style={{height:8,background:'var(--surface-muted)',borderRadius:999,marginTop:12,overflow:'hidden'}}>
            <div style={{width:`${pct*100}%`,height:'100%',background:'var(--accent)'}}/>
          </div>
          <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8}}>
            {[
              {l:tr('ច្បាប់​ចរាចរណ៍','Theory · traffic law'), d: hours >= target * 0.1},
              {l:tr('ការ​បើក​ក្នុង​ទីលាន','Yard practice'),      d: hours >= target * 0.25},
              {l:tr('ការ​បើក​ក្នុង​ទីក្រុង','City driving'),      d: hours >= target * 0.5,  p: hours > 0 && hours < target * 0.5 ? tr('កំពុង​ធ្វើ','In progress') : null},
              {l:tr('ផ្លូវ​លឿន','Highway'),                      d: hours >= target * 0.8},
              {l:tr('ប្រឡង​ផ្លូវ','Road exam'),                   d: hours >= target},
            ].map((m,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                <div style={{
                  width:18,height:18,borderRadius:999,flexShrink:0,
                  border:`1.5px solid ${m.d?'var(--good)':'var(--border-strong)'}`,
                  background:m.d?'var(--good)':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',
                }}>
                  {m.d && <Icon name="check" size={11} stroke={2.5}/>}
                </div>
                <div style={{flex:1,color:m.d?'var(--ink-3)':'var(--ink)',textDecoration:m.d?'line-through':'none'}}>{m.l}</div>
                {m.p && <Badge tone="accent">{m.p}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Card bar label={tr('ការ​ទូទាត់','PAYMENTS')}>
          <Stat label="" value={`${Math.round(paidPct*100)}%`} sub={tr('បាន​បង់','paid')}/>
          <div style={{height:8,background:'var(--surface-muted)',borderRadius:999,marginTop:10,overflow:'hidden'}}>
            <div style={{width:`${paidPct*100}%`,height:'100%',background:'var(--good)'}}/>
          </div>
          {paidPct < 1 && (
            <div style={{marginTop:12,fontSize:12,color:'var(--ink-2)'}}>
              {tr('ទំនាក់​ទំនង​ការិយាល័យ​ដើម្បី​ជ្រាប​​ព័ត៌មាន','Contact office for payment details')}
            </div>
          )}
        </Card>
        <Card bar label={tr('ប្រឡង​សាកល្បង','MOCK TESTS')}>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:42,fontWeight:600,fontFamily:'var(--font-display)'}}>—</div>
            <div style={{fontSize:14,color:'var(--ink-3)'}}>{tr('/100','/ 100')}</div>
          </div>
          <div style={{marginTop:12,fontSize:12,color:'var(--ink-3)'}}>
            {tr('មិន​ទាន់​មាន​ការ​ប្រឡង​សាកល្បង','No mock tests taken yet')}
          </div>
        </Card>
        <Card bar label={tr('ព័ត៌មាន​គណនី','ACCOUNT INFO')}>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:2}}>ID</div>
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:600,fontSize:15}}>{me?.id || '—'}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:2}}>{tr('ថ្នាក់','Class')}</div>
              <div style={{fontWeight:500,fontSize:13}}>{me?.cls || '—'}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:2}}>{tr('គ្រូ','Instructor')}</div>
              <div style={{fontWeight:500,fontSize:13}}>{me?.inst || '—'}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:2}}>{tr('ទូរស័ព្ទ','Phone')}</div>
              <div style={{fontWeight:500,fontSize:13}}>{me?.phone || '—'}</div></div>
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
