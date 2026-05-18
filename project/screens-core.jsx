// screens-core.jsx — Dashboard (role-aware)

const DashboardAdmin = () => (
  <div style={{display:'flex',flexDirection:'column',gap:18}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
      <div>
        <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>ច័ន្ទ · MON, JUNE 1, 2026</div>
        <div style={{fontSize:28,fontWeight:600,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
          អរុណសួស្ដី លោក វេន <span style={{color:'var(--ink-3)'}}>· Good morning, Chenda</span>
        </div>
        <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4}}>
          មាន <b>22 មេរៀន</b> ថ្ងៃនេះ និងសិស្សថ្មី <b>3 នាក់</b> រង់ចាំការអនុម័ត។
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <Btn kind="ghost" size="md" icon={<Icon name="cal" size={14}/>}>បើកប្រតិទិន · Open calendar</Btn>
        <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}>បន្ថែមសិស្ស · New student</Btn>
      </div>
    </div>

    {/* KPI strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      <Card>
        <Stat label="សិស្សសកម្ម · Active students" value="184" delta="+12" sub="ខែនេះ · this month"/>
        <div style={{marginTop:10}}><Spark data={[140,142,148,150,158,165,172,184]} w={220} h={28}/></div>
      </Card>
      <Card>
        <Stat label="មេរៀនថ្ងៃនេះ · Lessons today" value="22" delta="+3" sub="ធៀបនឹងម្សិលមិញ · vs yesterday"/>
        <div style={{marginTop:10,display:'flex',gap:4}}>
          {[6,4,5,3,4].map((n,i)=>(
            <div key={i} style={{flex:1,height:28,background:'var(--surface-muted)',borderRadius:3,position:'relative'}}>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${n*15}%`,background:'var(--accent)',borderRadius:3}}/>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Stat label="ប្រាក់ចំណូល · Revenue (June)" value="$8.4k" delta="+18%" sub="គោលដៅ · target $12k"/>
        <div style={{marginTop:10,height:8,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
          <div style={{width:'70%',height:'100%',background:'var(--accent)'}}/>
        </div>
      </Card>
      <Card>
        <Stat label="អត្រាប្រឡងជាប់ · Pass rate" value="91%" delta="+2%" sub="៣០ ថ្ងៃ · last 30 days"/>
        <div style={{marginTop:10,display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--ink-3)'}}>
          <span style={{width:8,height:8,borderRadius:999,background:'var(--good)'}}/>
          ខ្ពស់ជាងមធ្យមជាតិ · above national avg
        </div>
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12}}>
      {/* Today's schedule */}
      <Card label="មេរៀនបន្ទាប់ · UP NEXT TODAY">
        {LESSONS.filter(l => l.day === 0).slice(0,5).map((l,i) => {
          const s = studentById(l.who);
          const it = instById(l.inst);
          const v = vehById(l.veh);
          return (
            <div key={i} style={{
              display:'grid',gridTemplateColumns:'80px 1fr auto',gap:14,
              padding:'12px 0',borderTop: i? '1px solid var(--border)':'none',
              alignItems:'center',
            }}>
              <div>
                <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>
                  {String(l.h).padStart(2,'0')}:00
                </div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{l.len}ម៉ោង · {l.len}h</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {s && <Avatar tag={s.photo} size={32}/>}
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{s ? s.name : '— ' + l.type}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
                    {l.type} · {it?.en} {v?.plate ? `· ${v.plate}` : ''}
                  </div>
                </div>
              </div>
              <Badge tone={l.color==='e'?'warn':'neutral'}>
                {l.color==='e' ? 'Road exam' : l.color==='d' ? 'Mock exam' : 'Practical'}
              </Badge>
            </div>
          );
        })}
      </Card>

      {/* Alerts */}
      <Card label="ការជូនដំណឹង · ALERTS">
        {[
          {tone:'warn',  k:'យានយន្តត្រូវការថែទាំ', e:'V-04 Isuzu D-Max needs service today', icon:'wrench'},
          {tone:'danger',k:'វិក្កយបត្រហួសកាលកំណត់', e:'INV-2026-0420 · Yim Sokuntha · $60 overdue 5d', icon:'cash'},
          {tone:'accent',k:'ប្រឡងផ្លូវ ៣ នាក់ ថ្ងៃសុក្រ',  e:'3 students sit road exam Fri Jun 5',  icon:'flag'},
          {tone:'good',  k:'សិស្សថ្មី ៣ នាក់',          e:'3 new enrollments pending approval',     icon:'users'},
        ].map((a,i)=>(
          <div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderTop:i?'1px solid var(--border)':'none'}}>
            <div style={{
              width:30,height:30,borderRadius:8,
              background:`var(--${a.tone==='danger'?'danger':a.tone==='warn'?'warn':a.tone==='good'?'good':'accent'}-soft, ${a.tone==='warn'?'#F6E9DC':a.tone==='danger'?'F4DEDD':a.tone==='good'?'E5F0EA':'E5EBF5'})`,
              display:'flex',alignItems:'center',justifyContent:'center',
              color:`var(--${a.tone==='danger'?'danger':a.tone==='warn'?'warn':a.tone==='good'?'good':'accent'})`,
              flexShrink:0,
            }}>
              <Icon name={a.icon} size={14}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500}}>{a.k}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{a.e}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Card label="ការចុះឈ្មោះតាមថ្នាក់ · ENROLLMENT BY CLASS">
        <BarRow label="B · Sedan" value={118} max={180} sub="118"/>
        <BarRow label="A · Motorcycle" value={42} max={180} sub="42"/>
        <BarRow label="C · Truck" value={19} max={180} sub="19"/>
        <BarRow label="D · Bus" value={5} max={180} sub="5"/>
      </Card>
      <Card label="ការប្រើប្រាស់ឡាន · FLEET UTILIZATION">
        <Stat label="" value="78%" sub="6 ក្នុង 9 រថយន្ត · 6 of 9 in use"/>
        <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(9,1fr)',gap:4}}>
          {VEHICLES.concat(VEHICLES.slice(0,3)).map((v,i)=>(
            <div key={i} title={v.plate} style={{
              aspectRatio:'1',borderRadius:6,
              background: v.status==='Active' ? 'var(--accent)' :
                          v.status==='Service due' ? 'var(--warn)' : 'var(--ink-3)',
              opacity: v.status==='Active' ? 1 : .4,
            }}/>
          ))}
        </div>
        <div style={{marginTop:10,display:'flex',gap:10,fontSize:11,color:'var(--ink-3)',flexWrap:'wrap'}}>
          <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--accent)',marginRight:4}}/>សកម្ម · in use</span>
          <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--warn)',marginRight:4}}/>ត្រូវថែទាំ · service</span>
          <span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--ink-3)',marginRight:4}}/>ទំនេរ · idle</span>
        </div>
      </Card>
      <Card label="សិស្សថ្មីសប្ដាហ៍នេះ · NEW THIS WEEK">
        {STUDENTS.filter(s=>s.status==='New').concat(STUDENTS.slice(0,3)).slice(0,4).map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none'}}>
            <Avatar tag={s.photo} size={28}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.en} · {s.cls}</div>
            </div>
            <Badge tone={s.status==='New'?'accent':'neutral'}>{s.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const DashboardInstructor = () => {
  const me = INSTRUCTORS[0]; // Mr. Vichea
  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>ច័ន្ទ · MON, JUNE 1, 2026</div>
          <div style={{fontSize:28,fontWeight:600,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
            អរុណសួស្ដី លោក វិច្ឆេយ្យ <span style={{color:'var(--ink-3)'}}>· 5 lessons today</span>
          </div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4}}>
            ម៉ោងបង្រៀនដំបូង <b>09:00</b> ជាមួយ <b>សុខ ចាន់ថា</b> · car <b>2AB-4180</b>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md" icon={<Icon name="phone" size={14}/>}>ហៅសិស្ស · Call student</Btn>
          <Btn kind="primary" size="md" icon={<Icon name="check" size={14}/>}>ចាប់ផ្ដើមមេរៀន · Start lesson</Btn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <Card><Stat label="មេរៀនថ្ងៃនេះ · Today" value="5" sub="ចេញ 4 · បន្ទាប់ 1"/></Card>
        <Card><Stat label="សិស្សរបស់ខ្ញុំ · My students" value="18" sub="៣ ប្រឡងសប្ដាហ៍នេះ · 3 exam this week"/></Card>
        <Card><Stat label="ការវាយតម្លៃ · My rating" value="4.9" delta="+0.1" sub="ពី 42 មតិ · from 42 reviews"/></Card>
        <Card><Stat label="ម៉ោងសប្ដាហ៍ · Hours this week" value="28" sub="គោលដៅ 30 · target 30h"/></Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:12}}>
        <Card label="កាលវិភាគថ្ងៃនេះ · YOUR DAY">
          {LESSONS.filter(l => l.day === 0 && l.inst === 'I-01').map((l,i) => {
            const s = studentById(l.who);
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
                <Btn kind="soft" size="sm" icon={<Icon name="chev" size={12}/>}>មើល · View</Btn>
              </div>
            );
          })}
          {/* fallback */}
          <div style={{padding:'12px 0',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'center'}}>
            <Btn kind="ghost" size="sm">មើលសប្ដាហ៍ទាំងមូល · View full week</Btn>
          </div>
        </Card>

        <Card label="សិស្សដែលត្រូវយកចិត្តទុកដាក់ · NEEDS YOUR ATTENTION">
          {[STUDENTS[0],STUDENTS[3],STUDENTS[8]].map((s,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'12px 0',borderTop:i?'1px solid var(--border)':'none',alignItems:'center'}}>
              <Avatar tag={s.photo} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{s.name}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
                  {i===0 ? 'យឺតពេលក្នុងការប្តូរលេខ · slow gear shifts' :
                   i===1 ? 'ត្រូវការអនុវត្តចតរថយន្ត · needs parallel parking' :
                   'រួចរាល់សម្រាប់ប្រឡងផ្លូវ · exam-ready 🎉'}
                </div>
              </div>
              <Btn kind="ghost" size="sm">កំណត់ត្រា</Btn>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

const DashboardStudent = () => {
  const me = STUDENTS[0]; // Sok Chantha
  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>SOK CHANTHA · S-1042 · CLASS B</div>
          <div style={{fontSize:28,fontWeight:600,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
            អរុណសួស្ដី ចាន់ថា <span style={{color:'var(--ink-3)'}}>· keep going!</span>
          </div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4}}>
            អ្នកនៅសល់ <b>16 ម៉ោង</b> ទៀតរហូតដល់ការប្រឡងផ្លូវ។
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md" icon={<Icon name="book" size={14}/>}>មាតិកាសិក្សា · Study</Btn>
          <Btn kind="accent" size="md" icon={<Icon name="plus" size={14}/>}>កក់មេរៀន · Book lesson</Btn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12}}>
        <Card style={{background:'var(--ink)',color:'var(--bg)',border:'none'}}>
          <div style={{fontSize:11,opacity:.6,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>មេរៀនបន្ទាប់ · NEXT LESSON</div>
          <div style={{fontSize:42,fontWeight:600,letterSpacing:'-.02em',marginTop:8,fontFamily:'var(--font-display)',lineHeight:1}}>ស្អែក 09:00</div>
          <div style={{fontSize:14,marginTop:8,opacity:.85}}>Practical · City driving · 2h</div>
          <div style={{marginTop:18,display:'flex',alignItems:'center',gap:12,padding:'12px',background:'rgba(255,255,255,.08)',borderRadius:8}}>
            <Avatar tag="inst-1" size={42}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>គ្រូ ស៊ុំ វិច្ឆេយ្យ</div>
              <div style={{fontSize:11,opacity:.7}}>Toyota Vios · 2AB-4180</div>
            </div>
            <Btn kind="ghost" size="sm" style={{borderColor:'rgba(255,255,255,.3)',color:'#fff'}}>ផ្លាស់ប្ដូរ</Btn>
          </div>
        </Card>

        <Card label="វឌ្ឍនភាពនៃវគ្គ · COURSE PROGRESS">
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:42,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>14</div>
            <div style={{fontSize:14,color:'var(--ink-3)'}}>/ 30 ម៉ោង</div>
          </div>
          <div style={{height:8,background:'var(--surface-muted)',borderRadius:999,marginTop:12,overflow:'hidden'}}>
            <div style={{width:'47%',height:'100%',background:'var(--accent)'}}/>
          </div>
          <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8}}>
            {[
              {l:'Theory · ច្បាប់ចរាចរណ៍', d:true},
              {l:'Yard · ការបើករថយន្តក្នុងទីលាន', d:true},
              {l:'City · ការបើកក្នុងទីក្រុង', d:false, p:'In progress'},
              {l:'Highway · ផ្លូវលឿន', d:false},
              {l:'Road exam · ប្រឡងផ្លូវ', d:false},
            ].map((m,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                <div style={{
                  width:18,height:18,borderRadius:999,
                  border:`1.5px solid ${m.d?'var(--good)':'var(--border-strong)'}`,
                  background:m.d?'var(--good)':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'#fff',
                }}>
                  {m.d && <Icon name="check" size={11} stroke={2.5}/>}
                </div>
                <div style={{flex:1,color: m.d?'var(--ink-3)':'var(--ink)',textDecoration:m.d?'line-through':'none'}}>{m.l}</div>
                {m.p && <Badge tone="accent">{m.p}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Card label="ការទូទាត់ · PAYMENTS">
          <Stat label="" value="$108 / $180" sub="60% បានបង់ · paid"/>
          <div style={{height:8,background:'var(--surface-muted)',borderRadius:999,marginTop:10,overflow:'hidden'}}>
            <div style={{width:'60%',height:'100%',background:'var(--good)'}}/>
          </div>
          <div style={{marginTop:12,fontSize:12,color:'var(--ink-2)'}}>បន្ទាប់: <b>$36</b> ត្រូវបង់នៅ <b>មិថុនា 15</b></div>
        </Card>
        <Card label="ការប្រឡងសាកល្បង · MOCK TESTS">
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:42,fontWeight:600,fontFamily:'var(--font-display)'}}>87</div>
            <div style={{fontSize:14,color:'var(--ink-3)'}}>/100 ពិន្ទុមធ្យម</div>
          </div>
          <div style={{display:'flex',gap:4,marginTop:14}}>
            {[72,78,80,83,79,85,88,91,87,89].map((v,i)=>(
              <div key={i} style={{flex:1,height:30,position:'relative',background:'var(--surface-muted)',borderRadius:3}}>
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${v}%`,background:i>=8?'var(--good)':'var(--accent)',borderRadius:3,opacity:i>=8?1:.6}}/>
              </div>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>១០ ការប្រឡងថ្មីៗ · last 10 mock tests</div>
        </Card>
        <Card label="ការប្រាស្រ័យ · MESSAGES">
          <div style={{display:'flex',gap:10,padding:'8px 0'}}>
            <Avatar tag="inst-1" size={30}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500}}>គ្រូ វិច្ឆេយ្យ</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>ស្អែកត្រៀមឯកសារ permit របស់អ្នកមកឲ្យបាន…</div>
            </div>
            <Badge tone="accent">2</Badge>
          </div>
          <div style={{display:'flex',gap:10,padding:'8px 0',borderTop:'1px solid var(--border)'}}>
            <Avatar tag="admin" size={30}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500}}>ការិយាល័យ Phlov</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>Receipt INV-2026-0418</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = ({ role }) => (
  role === 'instructor' ? <DashboardInstructor/> :
  role === 'student'    ? <DashboardStudent/>    :
                          <DashboardAdmin/>
);

Object.assign(window, { Dashboard, DashboardAdmin, DashboardInstructor, DashboardStudent });
