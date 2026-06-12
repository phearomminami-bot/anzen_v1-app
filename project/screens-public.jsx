// screens-public.jsx — Public landing page + Booking flow

const BookingPrototype = () => {
  const [step, setStep] = React.useState(1);
  const steps = [
    {n:1, km:'វគ្គ',     en:'Course'},
    {n:2, km:'កាលវិភាគ', en:'Time'},
    {n:3, km:'គ្រូ',      en:'Instructor'},
    {n:4, km:'ព័ត៌មាន',  en:'Details'},
    {n:5, km:'ការទូទាត់', en:'Payment'},
    {n:6, km:'បញ្ជាក់',   en:'Confirm'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="ដំណើរការកក់មេរៀន"
        en="Booking flow · live preview"
      />

      {/* Step indicator */}
      <Card pad={0}>
        <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:0}}>
          {steps.map((st,i)=>(
            <React.Fragment key={st.n}>
              <button onClick={()=>setStep(st.n)} style={{
                display:'flex',alignItems:'center',gap:8,
                border:'none',background:'transparent',padding:0,cursor:'pointer',
                color: st.n<=step ? 'var(--ink)' : 'var(--ink-3)',
              }}>
                <div style={{
                  width:28,height:28,borderRadius:999,
                  background: st.n<step ? 'var(--good)' : st.n===step ? 'var(--ink)' : 'var(--surface-muted)',
                  color: st.n<=step ? '#fff' : 'var(--ink-3)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:12,fontWeight:600,
                  border: st.n===step ? '2px solid var(--ink)' : '1px solid var(--border)',
                }}>{st.n<step ? <Icon name="check" size={13} stroke={2.5}/> : st.n}</div>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:12,fontWeight: st.n===step ? 600 : 500}}>{st.km}</div>
                  <div style={{fontSize:10,color:'var(--ink-3)',marginTop:1,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>{st.en.toUpperCase()}</div>
                </div>
              </button>
              {i<steps.length-1 && <div style={{flex:1,height:1,background: st.n<step ? 'var(--good)' : 'var(--border)',margin:'0 12px'}}/>}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && <BookingStepCourse/>}
        {step === 2 && <BookingStepTime/>}
        {step === 3 && <BookingStepInstructor/>}
        {step === 4 && <BookingStepDetails/>}
        {step === 5 && <BookingStepPayment/>}
        {step === 6 && <BookingStepConfirm/>}

        <div style={{padding:'18px 24px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-muted)'}}>
          <div style={{fontSize:12,color:'var(--ink-3)'}}>Step {step} of {steps.length}</div>
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" onClick={()=>setStep(Math.max(1,step-1))}>ត្រឡប់ · Back</Btn>
            <Btn kind="primary" size="md" onClick={()=>setStep(Math.min(steps.length,step+1))} icon={<Icon name="arrow" size={14}/>}>បន្ត · Continue</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};

const BookingScreen = ({ studentId, role }) => {
  if (role === 'student' && studentId) return <StudentBookingWizard studentId={studentId}/>;
  return <BookingPrototype/>;
};

const StepDots = ({ step, total }) => (
  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
    {Array.from({length:total},(_,i) => (
      <div key={i} style={{height:4,flex:1,borderRadius:999,background:i<step?'var(--ink)':'var(--border)',transition:'background .2s'}}/>
    ))}
    <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginLeft:4,whiteSpace:'nowrap'}}>{step}/{total}</div>
  </div>
);

const StudentBookingWizard = ({ studentId }) => {
  const { toast, navigate, tr, lang } = useAppActions();
  const [step,    setStep]    = React.useState(1);
  const [selDay,  setSelDay]  = React.useState(null);
  const [selH,    setSelH]    = React.useState(null);
  const [selInst, setSelInst] = React.useState(null);
  const [done,    setDone]    = React.useState(false);

  const me      = STUDENTS.find(s => s.id === studentId) || null;
  const meClass = me?.cls?.replace?.('Class ','') || null;

  const { freeInsts, freeVeh } = React.useMemo(() => {
    if (selDay === null || selH === null) return { freeInsts:[], freeVeh:null };
    const over = LESSONS.filter(l => l.day === selDay && l.h <= selH && selH < l.h + l.len);
    const bI   = new Set(over.map(l => l.inst).filter(x => x !== '—'));
    const bV   = new Set(over.map(l => l.veh).filter(x => x !== '—'));
    const insts = INSTRUCTORS.filter(i => !bI.has(i.id) && (!meClass || i.cls.includes(meClass)));
    const veh   = VEHICLES.find(v => v.status !== 'Workshop' && !bV.has(v.id) && (!meClass || v.cls.startsWith(meClass)));
    return { freeInsts: insts, freeVeh: veh || null };
  }, [selDay, selH, meClass]);

  const selInstObj = INSTRUCTORS.find(i => i.id === selInst) || null;

  const doBook = () => {
    if (!freeVeh) return;
    const inst = selInst || freeInsts[0]?.id || '—';
    LESSONS.push({
      day: selDay, h: selH, len: 2,
      who:  studentId || '—',
      inst, veh: freeVeh.id,
      type: tr('ការ​អនុ​វត្ត​ន៍', 'Practical'),
      color: 'a',
    });
    if (!window.NOTIFICATIONS) window.NOTIFICATIONS = [];
    window.NOTIFICATIONS.unshift({
      tone:'accent', icon:'cal',
      km:`${me?.name || studentId} · ${DAYS_KM[selDay]} ${String(selH).padStart(2,'0')}:00`,
      en:`${me?.en || studentId} booked · ${DAYS_EN[selDay]} ${String(selH).padStart(2,'0')}:00`,
      go:'schedule',
    });
    if (window.__notifyStudentsChanged)      window.__notifyStudentsChanged();
    if (window.__notifyNotificationsChanged) window.__notifyNotificationsChanged();
    if (window.__notifyLessonsChanged)       window.__notifyLessonsChanged();
    toast(tr('បាន​កក់​មេរៀន​ដោយ​ជោគ​ជ័យ!', 'Lesson booked!'), 'good');
    setDone(true);
  };

  if (done) return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle km="កក់​មេរៀន" en="Book a lesson"/>
      <Card style={{textAlign:'center',padding:'56px 32px'}}>
        <div style={{width:64,height:64,borderRadius:999,background:'var(--good)',color:'#fff',margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon name="check" size={32} stroke={2.5}/>
        </div>
        <div style={{fontSize:24,fontWeight:700,fontFamily:'var(--font-display)',marginBottom:8}}>
          {tr('ការ​កក់​ត្រូវ​បាន​បញ្ជាក់!','Lesson confirmed!')}
        </div>
        <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:4}}>
          {DAYS_EN[selDay]} · {String(selH).padStart(2,'0')}:00–{String(selH+2).padStart(2,'0')}:00
        </div>
        {selInstObj && <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:24}}>{tr('គ្រូ','Instructor')}: {selInstObj.name}</div>}
        <Btn kind="primary" onClick={()=>navigate('schedule')} icon={<Icon name="cal" size={14}/>}>
          {tr('មើល​ក្នុង​កាល​វិភាគ','View in schedule')}
        </Btn>
      </Card>
    </div>
  );

  if (step === 1) {
    const hours = [7,8,9,10,11,12,13,14,15,16,17];
    return (
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <SectionTitle km="កក់​មេរៀន" en="Book a lesson"/>
        <StepDots step={1} total={3}/>
        <Card>
          <div style={{fontSize:16,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:4}}>
            {tr('ជ្រើស​ថ្ងៃ','Pick a day')}
          </div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:14}}>
            {tr('បៃ​តង = ទំ​នេរ · ក្រហម = ពេញ','Green = available · Red = full')}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginBottom:24}}>
            {DAYS_EN.map((d,i) => {
              const { available, total } = dayAvailabilitySummary(i);
              const full = available === 0;
              const sel  = selDay === i;
              return (
                <button key={i} disabled={full} onClick={()=>{setSelDay(i);setSelH(null);setSelInst(null);}} style={{
                  padding:'10px 4px',textAlign:'center',
                  border:'2px solid '+(sel?'var(--ink)':'var(--border)'),
                  background: sel?'var(--ink)':full?'var(--surface-muted)':'var(--surface)',
                  color: sel?'var(--bg)':full?'var(--ink-3)':'var(--ink)',
                  borderRadius:10,cursor:full?'not-allowed':'pointer',opacity:full?.6:1,
                }}>
                  <div style={{fontSize:10,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>{d.toUpperCase()}</div>
                  <div style={{fontSize:15,fontWeight:600,marginTop:2,fontFamily:'var(--font-display)'}}>{i+1}</div>
                  <div style={{fontSize:9,marginTop:3,fontFamily:'"JetBrains Mono",monospace',
                    color:sel?'rgba(255,255,255,.75)':full?'var(--danger)':'var(--good)'}}>
                    {full ? 'ពេញ' : `${available}/${total}`}
                  </div>
                </button>
              );
            })}
          </div>

          {selDay !== null && (
            <>
              <div style={{fontSize:14,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:4}}>
                {tr('ជ្រើស​ម៉ោង','Pick a time')} · {DAYS_EN[selDay]}
              </div>
              <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:12}}>
                {tr('2 ម៉ោង​ក្នុង​មួយ​វគ្គ','2 hours per session')}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
                {hours.map(h => {
                  const avail = slotAvailability(selDay, h) === 'available';
                  const sel   = selH === h;
                  return (
                    <button key={h} disabled={!avail} onClick={()=>setSelH(h)} style={{
                      padding:'12px 6px',textAlign:'center',
                      border:'2px solid '+(sel?'var(--ink)':avail?'#2d8a55':'var(--border)'),
                      background: sel?'var(--ink)':avail?'#f0faf4':'var(--surface-muted)',
                      color: sel?'var(--bg)':avail?'#2d8a55':'var(--ink-3)',
                      borderRadius:8,cursor:avail?'pointer':'not-allowed',
                      fontSize:12,fontWeight:600,fontFamily:'var(--font-display)',opacity:avail?1:.4,
                    }}>
                      {String(h).padStart(2,'0')}:00
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={{marginTop:20,display:'flex',justifyContent:'flex-end'}}>
            <Btn kind="primary" disabled={selDay===null||selH===null}
              onClick={()=>setStep(2)} icon={<Icon name="arrow" size={14}/>}>
              {tr('ជ្រើស​គ្រូ','Choose instructor')}
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 2) return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle km="ជ្រើស​គ្រូ​បង្រៀន" en="Pick instructor"/>
      <StepDots step={2} total={3}/>
      <Card>
        <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:16}}>
          {DAYS_EN[selDay]} · {String(selH).padStart(2,'0')}:00 — {tr(`${freeInsts.length} គ្រូ​ទំ​នេរ`,`${freeInsts.length} available`)}
        </div>
        {freeInsts.length === 0 ? (
          <div style={{padding:'32px',textAlign:'center'}}>
            <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:12}}>
              {tr('គ្មាន​គ្រូ​ទំ​នេរ​ក្នុង​ម៉ោង​នេះ','No instructors available at this time')}
            </div>
            <Btn kind="ghost" onClick={()=>setStep(1)}>{tr('ជ្រើស​ម៉ោង​ផ្សេង','Choose another time')}</Btn>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {freeInsts.map(inst => {
              const sel = selInst === inst.id;
              return (
                <button key={inst.id} onClick={()=>setSelInst(inst.id)} style={{
                  padding:16,border:`2px solid ${sel?'var(--ink)':'var(--border)'}`,
                  background:sel?'var(--surface-muted)':'var(--surface)',
                  borderRadius:12,cursor:'pointer',textAlign:'left',font:'inherit',transition:'all .12s',
                }}>
                  <Photo tag={inst.photo} w={52} h={52} r={999} style={{marginBottom:10}}/>
                  <div style={{fontSize:14,fontWeight:600}}>{inst.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>★{inst.rating} · {inst.en}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{inst.lang}</div>
                  {sel && <div style={{marginTop:8,fontSize:10,color:'var(--ink)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>✓ {tr('បាន​ជ្រើស','SELECTED')}</div>}
                </button>
              );
            })}
          </div>
        )}
        <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:16}}>
          <Btn kind="ghost" onClick={()=>setStep(1)}>{tr('ត្រឡប់','Back')}</Btn>
          <Btn kind="primary" disabled={!selInst||!freeVeh} onClick={()=>setStep(3)} icon={<Icon name="arrow" size={14}/>}>
            {tr('ពិនិត្យ​ការ​កក់','Review booking')}
          </Btn>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle km="ពិនិត្យ​និង​បញ្ជាក់" en="Review & confirm"/>
      <StepDots step={3} total={3}/>
      <Card>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
          {[
            {icon:'cal',  label:tr('ថ្ងៃ​ + ម៉ោង','Day & time'),  val:`${DAYS_EN[selDay]} · ${String(selH).padStart(2,'0')}:00–${String(selH+2).padStart(2,'0')}:00`},
            {icon:'flag', label:tr('គ្រូ','Instructor'),           val:selInstObj?`${selInstObj.name} · ★${selInstObj.rating}`:'—'},
            {icon:'car',  label:tr('យានយន្ត','Vehicle'),           val:freeVeh?`${freeVeh.make} · ${freeVeh.plate}`:tr('មិន​មាន','None')},
            {icon:'users',label:tr('សិស្ស','Student'),             val:me?(lang==='km'?me.name:me.en)+' · '+me.id:studentId||'—'},
          ].map((r,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:'var(--surface-muted)',borderRadius:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon name={r.icon} size={15}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',textTransform:'uppercase'}}>{r.label}</div>
                <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{r.val}</div>
              </div>
            </div>
          ))}
        </div>
        {!freeVeh && (
          <div style={{padding:'10px 14px',background:'#F4DEDD',borderRadius:8,fontSize:12,color:'var(--danger)',marginBottom:16}}>
            {tr('មិន​មាន​យាន​យន្ត​ទំ​នេរ​ក្នុង​ម៉ោង​នេះ','No vehicle available for this slot')}
          </div>
        )}
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <Btn kind="ghost" onClick={()=>setStep(2)}>{tr('ត្រឡប់','Back')}</Btn>
          <Btn kind="accent" disabled={!freeVeh} onClick={doBook} icon={<Icon name="check" size={14} stroke={2}/>}>
            {tr('បញ្ជាក់​ការ​កក់','Confirm booking')}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

const BookingMiniStep = ({n,km,body}) => (
  <Card style={{opacity:.95}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
      <div style={{width:22,height:22,borderRadius:999,background:'var(--surface-muted)',color:'var(--ink-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600}}>{n}</div>
      <div style={{fontSize:11,letterSpacing:'.06em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>STEP {n} · {km}</div>
    </div>
    {body}
  </Card>
);

const BookingStepCourse = () => {
  const ss = window.__schoolSettings || {};
  const pricing = ss.pricing || [];
  const courses = [
    pricing.find(p=>p.cls==='B') || {cls:'B',km:'ឡាន​បួន​កង់',n:'Standard',hrs:30,price:180},
    pricing.find(p=>p.cls==='A') || {cls:'A',km:'ម៉ូតូ',n:'Motorcycle',hrs:18,price:110},
    pricing.find(p=>p.cls==='C') || {cls:'C',km:'ឡាន​ដឹក​ទំ​និញ',n:'Truck',hrs:40,price:320},
  ];
  const [sel, setSel] = React.useState('B');
  return (
  <div style={{padding:24}}>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ជ្រើសរើសវគ្គ · Choose your course</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>បន្ទាប់ពីជ្រើសរើស អ្នកអាចចូលរួមថ្នាក់ទ្រឹស្តីភ្លាមៗ។</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {courses.map((c,i)=>(
        <button key={c.cls} onClick={()=>setSel(c.cls)} style={{
          padding:18, border:`2px solid ${sel===c.cls?'var(--accent)':'var(--border)'}`,
          borderRadius:10, background: sel===c.cls?'var(--accent-soft)':'transparent',
          cursor:'pointer', textAlign:'left', font:'inherit',
        }}>
          <Badge tone={sel===c.cls?'accent':'neutral'}>Class {c.cls}</Badge>
          <div style={{fontSize:18,fontWeight:600,marginTop:10,fontFamily:'var(--font-display)'}}>{c.km||c.n}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{c.hrs}h of training</div>
          <div style={{fontSize:24,fontWeight:600,marginTop:14,fontFamily:'var(--font-display)'}}>${c.price}</div>
        </button>
      ))}
    </div>
  </div>
  );
};

const BookingStepTime = () => {
  const [pick, setPick] = React.useState({day:null, h:null});
  const slots = [7,8,9,10,11,13,14,15,16];
  const takenSlots = [7,11,16];
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ជ្រើសរើសម៉ោង · Pick your first lesson time</div>
      <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>មេរៀន​ដំបូងគឺ​អនុវត្តន៍ផ្ទាល់​ក្នុងទីលាន។</div>

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:24}}>
        {/* mini calendar */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600}}>មិថុនា 2026</div>
            <div style={{display:'flex',gap:4}}>
              <button style={{width:22,height:22,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transform:'rotate(180deg)'}}><Icon name="chev" size={11}/></button>
              <button style={{width:22,height:22,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="chev" size={11}/></button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6}}>
            {DAYS_EN.map(d => <div key={d} style={{fontSize:9,color:'var(--ink-3)',textAlign:'center',padding:3}}>{d[0]}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
            {Array.from({length:30},(_,i)=>i+1).map(d => {
              const isSel = pick.day === d;
              const past = d < 1;
              return (
                <button key={d} onClick={()=>setPick({day:d, h:null})} style={{
                  aspectRatio:'1',border:'none',
                  background: isSel ? 'var(--ink)' : past ? 'transparent' : 'var(--surface)',
                  color: isSel ? 'var(--bg)' : past ? 'var(--ink-3)' : 'var(--ink)',
                  borderRadius:6,fontSize:11,fontWeight:isSel?600:400,
                  cursor:'pointer',
                }}>{d}</button>
              );
            })}
          </div>
        </div>

        {/* time slots */}
        <div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>
            {pick.day ? `ម៉ោងទំនេរ · June ${pick.day}` : 'ជ្រើស​ថ្ងៃ​ជាមុន'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {slots.map(h => {
              const taken = takenSlots.includes(h);
              const sel = pick.h === h;
              return (
                <button key={h} disabled={taken} onClick={()=>pick.day && setPick({...pick,h})} style={{
                  padding:'12px 10px',
                  border:`1px solid ${sel?'var(--ink)':'var(--border)'}`,
                  background: sel ? 'var(--ink)' : taken ? 'var(--surface-muted)' : 'var(--surface)',
                  color: sel ? 'var(--bg)' : taken ? 'var(--ink-3)' : 'var(--ink)',
                  borderRadius:8,
                  fontSize:13,fontWeight:600,
                  fontFamily:'var(--font-display)',
                  cursor: taken ? 'not-allowed' : pick.day ? 'pointer' : 'default',
                  textDecoration: taken ? 'line-through' : 'none',
                  opacity: taken ? .5 : 1,
                }}>{String(h).padStart(2,'0')}:00</button>
              );
            })}
          </div>
          {pick.day && pick.h && (
            <div style={{marginTop:18,padding:14,background:'var(--accent-soft)',borderRadius:8,display:'flex',alignItems:'center',gap:14,border:'1px solid var(--accent)'}}>
              <Icon name="check" size={18} stroke={2}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600}}>June {pick.day} · {String(pick.h).padStart(2,'0')}:00 (2h)</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>មេរៀននៅទីលាន Phnom Penh campus</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingStepInstructor = () => {
  const [sel, setSel] = React.useState(null);
  const instList = INSTRUCTORS.filter(i=>i.cls.includes('B')).slice(0,3);
  return (
  <div style={{padding:24}}>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ជ្រើសរើសគ្រូ · Pick your instructor</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>គ្រូទាំងអស់មានវិញ្ញាបនបត្រ Class B។ ឬអនុញ្ញាតឲ្យយើងផ្គូផ្គងជូនអ្នក។</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {instList.map((i,idx)=>(
        <button key={i.id} onClick={()=>setSel(i.id)} style={{
          padding:16, border:`2px solid ${sel===i.id?'var(--accent)':'var(--border)'}`,
          borderRadius:10, background:sel===i.id?'var(--accent-soft)':'transparent',
          cursor:'pointer', textAlign:'left', font:'inherit', transition:'all .12s',
        }}>
          <div style={{display:'flex',gap:12}}>
            <Photo tag={i.photo} w={56} h={56} r={999}/>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{i.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{i.en} · ★{i.rating}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>{i.role}</div>
            </div>
          </div>
          <div style={{marginTop:12,fontSize:11,color:'var(--ink-3)'}}>{i.lang}</div>
          {sel===i.id && <div style={{marginTop:8,fontSize:10,color:'var(--accent)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>✓ បាន​ជ្រើស · SELECTED</div>}
        </button>
      ))}
    </div>
  </div>
  );
};

const BookingStepDetails = () => (
  <div style={{padding:24}}>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ព័ត៌មានសិស្ស · Your details</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>ព័ត៌មាន​ទាំង​នេះ​ត្រូវ​ការ​សម្រាប់​ការ​ចុះ​ឈ្មោះ​ផ្លូវ​ការ។</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,maxWidth:600}}>
      {[
        {km:'ឈ្មោះពេញ (ខ្មែរ)',     en:'Full name (Khmer)',     ph:'ឧ. ចន ​ដារ៉ា'},
        {km:'ឈ្មោះ (English)',        en:'Full name (English)',   ph:'e.g. Chan Dara'},
        {km:'ថ្ងៃខែឆ្នាំ​កំណើត',      en:'Date of birth',         ph:'DD/MM/YYYY'},
        {km:'លេខ​អត្ត​សញ្ញាណ​ប័ណ្ណ', en:'National ID',           ph:'123-456-789'},
        {km:'ទូរស័ព្ទ',               en:'Phone',                 ph:'+855 __ ___ ___'},
        {km:'Email',                  en:'Email',                 ph:'you@example.com'},
      ].map((f,i)=>(
        <div key={i}>
          <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:4,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>{f.km}</div>
          <div style={{padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8,fontSize:12,color:'var(--ink-3)',border:'1px solid var(--border)'}}>{f.ph}</div>
        </div>
      ))}
    </div>
  </div>
);

const BookingStepPayment = () => {
  const ss = window.__schoolSettings || {};
  const [sel, setSel] = React.useState('aba');
  const methods = [
    {id:'aba',  label:'ABA Mobile',    sub:'•••• 4180', enabled: ss.payments?.aba },
    {id:'wing', label:'Wing',          sub:'លេខ​ Wing',  enabled: ss.payments?.wing},
    {id:'cash', label:'Cash',          sub:'ទទួល​ជា​សាច់​ប្រាក់', enabled: ss.payments?.cash},
    {id:'bank', label:'Bank transfer', sub:'ACB Bank',  enabled: ss.payments?.bank},
  ].filter(m => m.enabled !== false);

  const pricing = ss.pricing || [];
  const bCourse = pricing.find(p=>p.cls==='B') || {price:180, hrs:30, km:'ឡាន​បួន​កង់'};
  return (
  <div style={{padding:24}}>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ការទូទាត់ · Payment</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>ជ្រើស​វិធី​ទូទាត់​ដែល​ស្រួល​ជាង​គេ​សម្រាប់​អ្នក។</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:600}}>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {methods.map(m=>(
          <button key={m.id} onClick={()=>setSel(m.id)} style={{
            padding:'12px 14px', border:`2px solid ${sel===m.id?'var(--accent)':'var(--border)'}`,
            background: sel===m.id?'var(--accent-soft)':'var(--surface)',
            borderRadius:8, cursor:'pointer', textAlign:'left', font:'inherit',
            display:'flex', justifyContent:'space-between',
          }}>
            <span style={{fontSize:12,fontWeight:500}}>{m.label}</span>
            <span style={{fontSize:11,color:'var(--ink-3)'}}>{m.sub}</span>
          </button>
        ))}
      </div>
      <div style={{padding:16,background:'var(--surface-muted)',borderRadius:10,border:'1px solid var(--border)'}}>
        <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:10}}>ORDER SUMMARY</div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--ink-3)',marginBottom:6}}>
          <span>Class B · {bCourse.hrs}h ({bCourse.km})</span><span>${bCourse.price}</span>
        </div>
        {ss.addons?.slice(0,2).map((a,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--ink-3)',marginBottom:4}}>
            <span>{a.en}</span><span>+${a.price}</span>
          </div>
        ))}
        <div style={{borderTop:'1px solid var(--border)',marginTop:10,paddingTop:10,display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:600}}>
          <span>Total</span><span>${bCourse.price}</span>
        </div>
        {ss.vat && <div style={{fontSize:10,color:'var(--ink-3)',marginTop:4}}>VAT {ss.vat}% included</div>}
      </div>
    </div>
  </div>
  );
};

const BookingStepConfirm = () => (
  <div style={{padding:'32px 24px',textAlign:'center'}}>
    <div style={{width:64,height:64,borderRadius:999,background:'var(--good)',color:'#fff',margin:'0 auto 20px',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <Icon name="check" size={32} stroke={2.5}/>
    </div>
    <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-display)',marginBottom:8}}>ការ​កក់​ត្រូវ​បាន​បញ្ជាក់!</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:4}}>Thursday · June 4, 2026 · 10:00–12:00</div>
    <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:16}}>Instructor · Chhay Phearom · Toyota Vios ABC-1234</div>
    <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',padding:'8px 14px',background:'var(--surface-muted)',borderRadius:6,display:'inline-block'}}>
      BK-2026-{String(LESSONS.length+1).padStart(4,'0')}
    </div>
  </div>
);

Object.assign(window, { BookingScreen });
