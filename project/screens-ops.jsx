// screens-ops.jsx — Schedule, Fleet, Progress, Billing

const LESSON_COLORS = {
  a: { bg:'#E5EBF5', fg:'#2A5DB0', bd:'#C8D6EC' }, // practical
  b: { bg:'#E5EBF5', fg:'#2A5DB0', bd:'#C8D6EC' },
  c: { bg:'#EEEAE2', fg:'#6B5836', bd:'#DBD3C4' }, // theory
  d: { bg:'#F6E9DC', fg:'#8E5223', bd:'#E8D2B6' }, // mock
  e: { bg:'#F4DEDD', fg:'#8A2F2D', bd:'#EAC2C0' }, // road exam
};

// ── Week view ──
const ScheduleWeek = () => {
  const hours = Array.from({length:12}, (_,i)=> i+7); // 7..18
  return (
    <Card pad={0}>
      {/* Header row */}
      <div style={{display:'grid',gridTemplateColumns:'56px repeat(7,1fr)',borderBottom:'1px solid var(--border)'}}>
        <div/>
        {DAYS_KM.map((d,i)=>(
          <div key={i} style={{padding:'14px 10px',borderLeft:'1px solid var(--border)'}}>
            <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>{DAYS_EN[i].toUpperCase()}</div>
            <div style={{fontSize:18,fontWeight:600,marginTop:2,fontFamily:'var(--font-display)'}}>
              {i+1} <span style={{fontSize:11,fontWeight:400,color:'var(--ink-3)'}}>{d}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Body */}
      <div style={{display:'grid',gridTemplateColumns:'56px repeat(7,1fr)',position:'relative'}}>
        {/* Hour labels */}
        <div>
          {hours.map(h => (
            <div key={h} style={{height:48,padding:'4px 8px',borderBottom:'1px solid var(--border)',fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{String(h).padStart(2,'0')}:00</div>
          ))}
        </div>
        {/* Day columns */}
        {DAYS_KM.map((_,dayIdx)=>(
          <div key={dayIdx} style={{position:'relative',borderLeft:'1px solid var(--border)'}}>
            {hours.map(h => (
              <div key={h} style={{height:48,borderBottom:'1px solid var(--border)'}}/>
            ))}
            {LESSONS.filter(l=>l.day===dayIdx).map((l,i)=>{
              const top = (l.h - 7) * 48 + 2;
              const height = l.len * 48 - 4;
              const c = LESSON_COLORS[l.color] || LESSON_COLORS.a;
              const s = studentById(l.who);
              const it = instById(l.inst);
              return (
                <div key={i} style={{
                  position:'absolute',top,left:4,right:4,height,
                  background:c.bg,border:`1px solid ${c.bd}`,
                  borderLeft:`3px solid ${c.fg}`,
                  borderRadius:6,padding:'4px 6px',
                  overflow:'hidden',
                  fontSize:10.5,
                }}>
                  <div style={{fontWeight:600,color:c.fg,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {s ? s.en : l.type.split('·')[0]}
                  </div>
                  <div style={{color:'var(--ink-2)',fontSize:10,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {it?.en.replace('Mr.','').replace('Ms.','').trim()} · {l.type.split('·')[1]?.trim()}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Month view ──
const ScheduleMonth = () => {
  // June 2026 starts on Monday actually let's say it starts on Monday for the demo
  const cells = Array.from({length: 35}, (_,i) => i - 0); // day index
  return (
    <Card pad={0}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--border)'}}>
        {DAYS_EN.map((d,i)=>(
          <div key={i} style={{padding:'10px 12px',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderLeft:i?'1px solid var(--border)':'none'}}>{d} · {DAYS_KM[i]}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(5,minmax(110px,1fr))'}}>
        {cells.map((c,i) => {
          const day = i + 1;
          const dayMod = i % 7;
          const dayLessons = LESSONS.filter(l => l.day === dayMod).slice(0, day < 30 ? 3 : 1);
          const today = day === 1;
          return (
            <div key={i} style={{
              borderLeft: dayMod ? '1px solid var(--border)':'none',
              borderTop: i>=7 ? '1px solid var(--border)':'none',
              padding:'8px 10px',
              background: today ? 'var(--surface-muted)' : 'transparent',
              display:'flex',flexDirection:'column',gap:4,
              minHeight:0,
            }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{
                  fontSize:13,fontWeight:today?700:500,
                  width:22,height:22,borderRadius:999,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:today?'var(--ink)':'transparent',
                  color:today?'var(--bg)':'var(--ink)',
                }}>{day}</div>
                {dayLessons.length>0 && <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{LESSONS.filter(l=>l.day===dayMod).length}</div>}
              </div>
              {dayLessons.map((l,j) => {
                const c = LESSON_COLORS[l.color] || LESSON_COLORS.a;
                const s = studentById(l.who);
                return (
                  <div key={j} style={{
                    fontSize:10,padding:'2px 5px',
                    background:c.bg,color:c.fg,
                    borderLeft:`2px solid ${c.fg}`,
                    borderRadius:3,
                    whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                  }}>
                    {String(l.h).padStart(2,'0')}:00 {s ? s.en.split(' ')[0] : l.type.split('·')[0].trim()}
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
const ScheduleAgenda = () => {
  const byDay = DAYS_KM.map((d, idx) => ({
    day: d, en: DAYS_EN[idx], idx,
    lessons: LESSONS.filter(l => l.day === idx).sort((a,b)=>a.h-b.h),
  }));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {byDay.map(g => (
        <Card key={g.idx} pad={0}>
          <div style={{padding:'12px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'baseline',gap:10,background:g.idx===0?'var(--surface-muted)':'transparent'}}>
            <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)'}}>{g.idx + 1} មិថុនា</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>{g.day} · {g.en} · {g.lessons.length} lessons</div>
            {g.idx===0 && <Badge tone="accent">ថ្ងៃនេះ · today</Badge>}
          </div>
          {g.lessons.length===0 ? (
            <div style={{padding:'24px 18px',fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>គ្មានមេរៀន · No lessons scheduled</div>
          ) : g.lessons.map((l,i) => {
            const c = LESSON_COLORS[l.color] || LESSON_COLORS.a;
            const s = studentById(l.who);
            const it = instById(l.inst);
            const v = vehById(l.veh);
            return (
              <div key={i} style={{padding:'14px 18px',display:'grid',gridTemplateColumns:'80px 4px 1fr 1fr auto',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none'}}>
                <div>
                  <div style={{fontSize:16,fontWeight:600,fontFamily:'var(--font-display)'}}>{String(l.h).padStart(2,'0')}:00</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{l.len}h</div>
                </div>
                <div style={{width:4,height:32,background:c.fg,borderRadius:2}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{s ? s.name : l.type}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{l.type}</div>
                </div>
                <div style={{fontSize:12,color:'var(--ink-2)'}}>
                  <div>{it?.en || '—'}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{v?.plate || '—'} · {v?.make.split('·')[0]}</div>
                </div>
                <Badge tone={l.color==='e'?'warn':l.color==='c'?'neutral':'accent'}>
                  {l.color==='e'?'Road exam':l.color==='c'?'Theory':l.color==='d'?'Mock':'Practical'}
                </Badge>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
};

const ScheduleScreen = ({ view }) => {
  const [v, setV] = React.useState(view || 'week');
  React.useEffect(()=>{ if(view) setV(view); }, [view]);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="កាលវិភាគ · សប្ដាហ៍ទី ១ មិថុនា"
        en="Schedule · Week of June 1, 2026"
        action={
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:2}}>
              {['week','month','agenda'].map(k => (
                <button key={k} onClick={()=>setV(k)} style={{
                  padding:'5px 10px',border:'none',
                  background: v===k ? 'var(--ink)' : 'transparent',
                  color: v===k ? 'var(--bg)' : 'var(--ink-2)',
                  borderRadius:6,fontSize:12,fontWeight:500,
                  cursor:'default',textTransform:'capitalize',
                }}>{k==='week'?'សប្ដាហ៍':k==='month'?'ខែ':'បញ្ជី'} {k}</button>
              ))}
            </div>
            <Btn kind="ghost" size="md">មុន</Btn>
            <Btn kind="ghost" size="md">ថ្ងៃនេះ · Today</Btn>
            <Btn kind="ghost" size="md">បន្ទាប់</Btn>
            <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}>មេរៀនថ្មី · New</Btn>
          </div>
        }
      />
      {v==='week' ? <ScheduleWeek/> : v==='month' ? <ScheduleMonth/> : <ScheduleAgenda/>}

      {/* Legend */}
      <div style={{display:'flex',gap:18,padding:'8px 4px',fontSize:11,color:'var(--ink-3)'}}>
        {[
          {l:'Practical',c:'a'},{l:'Theory',c:'c'},
          {l:'Mock exam',c:'d'},{l:'Road exam',c:'e'},
        ].map(t=>(
          <span key={t.l} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:10,height:10,borderRadius:2,background:LESSON_COLORS[t.c].bg,borderLeft:`2px solid ${LESSON_COLORS[t.c].fg}`}}/>
            {t.l}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Fleet ──
const FleetScreen = () => (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="យានយន្ត & ការថែទាំ"
      en={`Fleet · ${VEHICLES.length} vehicles · 1 in workshop`}
      action={
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md" icon={<Icon name="wrench" size={14}/>}>កាលវិភាគថែទាំ</Btn>
          <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}>បន្ថែមរថយន្ត</Btn>
        </div>
      }
    />

    {/* KPIs */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      <Card><Stat label="ការប្រើ · Utilization" value="78%" delta="+4%"/></Card>
      <Card><Stat label="ការប្រើថ្ងៃនេះ · In use today" value="6 / 9"/></Card>
      <Card><Stat label="ការថែទាំ · In service" value="1" sub="V-06 Yamaha"/></Card>
      <Card><Stat label="ការប្រើ​ប្រេង · Fuel (mo.)" value="$612" delta="-8%"/></Card>
    </div>

    <Card pad={0}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'grid',gridTemplateColumns:'80px 1fr 1fr 1fr 1fr 1fr',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
        <div></div>
        <div>Vehicle · យានយន្ត</div>
        <div>Class</div>
        <div>Odometer</div>
        <div>Service</div>
        <div>Assigned · Status</div>
      </div>
      {VEHICLES.map((v,i)=>(
        <div key={v.id} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'80px 1fr 1fr 1fr 1fr 1fr',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none'}}>
          <Photo tag={v.photo} w={70} h={48} r={6}/>
          <div>
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
            <Badge tone={v.status==='Active'?'good':v.status==='Service due'?'warn':'danger'}>{v.status}</Badge>
          </div>
        </div>
      ))}
    </Card>

    {/* Maintenance timeline */}
    <Card label="ការថែទាំខាងមុខ · UPCOMING MAINTENANCE">
      <div style={{display:'flex',flexDirection:'column',gap:0}}>
        {[
          {d:'Today · ច័ន្ទ', v:'V-04 Isuzu D-Max', t:'Brake inspection · ត្រួតពិនិត្យហ្វ្រាំង', who:'Sambo Workshop', tone:'warn'},
          {d:'Jun 4 · ព្រហ.', v:'V-01 Toyota Vios', t:'Oil + filter change · ប្ដូរប្រេង', who:'in-house', tone:'neutral'},
          {d:'Jun 10 · ច័ន្ទ', v:'V-05 Kia Picanto', t:'Tire rotation · បង្វិលកង់', who:'in-house', tone:'neutral'},
          {d:'Jun 15 · សៅរ៍', v:'V-03 Honda Wave', t:'Annual inspection · ត្រួតពិនិត្យប្រចាំឆ្នាំ', who:'DOT centre', tone:'accent'},
        ].map((m,i)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr 120px',gap:14,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none',alignItems:'center'}}>
            <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',letterSpacing:'.04em'}}>{m.d}</div>
            <div style={{fontSize:12,fontWeight:500}}>{m.v}</div>
            <div style={{fontSize:12,color:'var(--ink-2)'}}>{m.t}</div>
            <Badge tone={m.tone}>{m.who}</Badge>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ── Progress ──
const ProgressScreen = () => (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="វឌ្ឍនភាព & ការត្រៀមប្រឡង"
      en="Progress & exam readiness"
      action={
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md">ខែ · This month</Btn>
          <Btn kind="ghost" size="md">នាំចេញរបាយការណ៍ · Export report</Btn>
        </div>
      }
    />

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      <Card><Stat label="អត្រាប្រឡងជាប់ · Pass rate" value="91%" delta="+2%"/></Card>
      <Card><Stat label="ម៉ោងសិក្សាមធ្យម · Avg hours" value="27" sub="ដើម្បីរួចរាល់ · to clear"/></Card>
      <Card><Stat label="ការប្រឡងលើកដំបូង · 1st-try pass" value="73%" delta="+5%"/></Card>
      <Card><Stat label="ការអនុវត្តន៍ · Mock test avg" value="84" delta="+3"/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12}}>
      <Card label="ការ​ប្រឡងសាកល្បង​ ៦ ខែចុង​ក្រោយ · MOCK TEST SCORES (6 mo.)">
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

      <Card label="ចំណុចខ្សោយលើផ្លូវ · COMMON ROAD ERRORS">
        <BarRow label="Parallel parking" value={42} max={100} sub="42%"/>
        <BarRow label="Lane changes" value={31} max={100} sub="31%"/>
        <BarRow label="Roundabouts" value={22} max={100} sub="22%"/>
        <BarRow label="Mirror checks" value={18} max={100} sub="18%"/>
        <BarRow label="Hill starts" value={11} max={100} sub="11%"/>
        <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>បានវិភាគពី ៦០ ដំណើរ​ប្រឡងសាកល្បង​ ខែឧសភា</div>
      </Card>
    </div>

    <Card label="សិស្ស​ត្រៀមប្រឡង · EXAM-READY THIS WEEK">
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1.4fr 1fr',gap:14,padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
        <div>Student</div>
        <div>Hours / target</div>
        <div>Mock avg · trend</div>
        <div>Exam date</div>
      </div>
      {STUDENTS.filter(s => s.status === 'Road exam soon' || s.hours >= s.target).map((s,i)=>(
        <div key={s.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1.4fr 1fr',gap:14,padding:'12px 0',borderBottom:i<3?'1px solid var(--border)':'none',alignItems:'center'}}>
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

// ── Billing ──
const BillingScreen = () => (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="វិក្កយបត្រ & ការទូទាត់"
      en="Billing & payments"
      action={
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md">នាំចេញ · Export</Btn>
          <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}>បង្កើតវិក្កយបត្រ · New invoice</Btn>
        </div>
      }
    />

    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      <Card><Stat label="ចំណូលខែនេះ · Revenue MTD" value="$8,420" delta="+18%"/></Card>
      <Card><Stat label="មិនទាន់ទូទាត់ · Outstanding" value="$1,260" sub="៩ វិក្កយបត្រ · 9 invoices"/></Card>
      <Card><Stat label="ហួសកាលកំណត់ · Overdue" value="$340" delta="-12%" sub="៣ វិក្កយបត្រ"/></Card>
      <Card><Stat label="មធ្យម / សិស្ស · Avg / student" value="$182"/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12}}>
      <Card pad={0}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:13,fontWeight:600}}>វិក្កយបត្រថ្មីៗ · Recent invoices</div>
          <div style={{flex:1}}/>
          <div style={{display:'flex',gap:4}}>
            {['All','Paid','Pending','Overdue'].map((t,i)=>(
              <button key={i} style={{
                padding:'4px 10px',
                background: i===0?'var(--ink)':'var(--surface-muted)',
                color: i===0?'var(--bg)':'var(--ink-2)',
                border:'1px solid '+(i===0?'var(--ink)':'var(--border)'),
                borderRadius:999,fontSize:11,fontWeight:500,cursor:'default',
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.2fr 1.4fr 0.8fr 0.8fr 0.8fr',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
          <div>Invoice</div><div>Student</div><div>Date</div><div>Method</div><div style={{textAlign:'right'}}>Amount · Status</div>
        </div>
        {INVOICES.map((v,i)=>{
          const s = studentById(v.student);
          return (
            <div key={v.id} style={{padding:'14px 16px',display:'grid',gridTemplateColumns:'1.2fr 1.4fr 0.8fr 0.8fr 0.8fr',gap:14,alignItems:'center',borderTop:'1px solid var(--border)'}}>
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,color:'var(--ink-2)'}}>{v.id}</div>
              <div style={{display:'flex',gap:8,alignItems:'center',minWidth:0}}>
                <Avatar tag={s?.photo} size={24}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s?.name}</div>
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
        <Card label="វិធីសាស្ត្រទូទាត់ · PAYMENT METHODS">
          <BarRow label="ABA Mobile" value={62} max={100} sub="62%"/>
          <BarRow label="Cash" value={18} max={100} sub="18%"/>
          <BarRow label="Wing" value={12} max={100} sub="12%"/>
          <BarRow label="Bank transfer" value={8} max={100} sub="8%"/>
        </Card>
        <Card label="គម្រោងវគ្គ · COURSE PLANS">
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {n:'Class B · ស្ដង់ដារ', p:'$180', d:'30 ម៉ោងបង្រៀន',active:true},
              {n:'Class B · ផ្លាស់ប្តូរលេខ', p:'$220', d:'+ការបង់ប្រឡង'},
              {n:'Class A · ម៉ូតូ', p:'$110', d:'18 ម៉ោងបង្រៀន'},
              {n:'Class C · ឡានដឹកទំនិញ', p:'$320', d:'40 ម៉ោងបង្រៀន'},
            ].map((p,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:p.active?'var(--surface-muted)':'transparent',border:'1px solid var(--border)',borderRadius:8}}>
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

Object.assign(window, { ScheduleScreen, FleetScreen, ProgressScreen, BillingScreen, LESSON_COLORS });
