// screens-people.jsx — Students roster + profile detail, Instructors

const StudentsScreen = () => {
  const [selected, setSelected] = React.useState(STUDENTS[0]);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="សិស្ស · បញ្ជី"
        en={`Students · ${STUDENTS.length} active · 3 pending approval`}
        action={
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" icon={<Icon name="search" size={14}/>}>តម្រង · Filter</Btn>
            <Btn kind="ghost" size="md">នាំចេញ CSV · Export</Btn>
            <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}>បន្ថែម · Add</Btn>
          </div>
        }
      />

      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12,alignItems:'start'}}>
        {/* Roster table */}
        <Card pad={0}>
          {/* Filter chips */}
          <div style={{padding:'12px 16px',display:'flex',gap:6,flexWrap:'wrap',borderBottom:'1px solid var(--border)'}}>
            {['ទាំងអស់ · All (184)','New (3)','In progress (158)','Road exam soon (8)','Cleared (15)','Class B','Class A','Class C'].map((c,i)=>(
              <button key={i} style={{
                padding:'4px 10px',
                background: i===0 ? 'var(--ink)' : 'var(--surface-muted)',
                color: i===0 ? 'var(--bg)' : 'var(--ink-2)',
                border:'1px solid ' + (i===0?'var(--ink)':'var(--border)'),
                borderRadius:999,
                fontSize:11,fontWeight:500,
                cursor:'default',
              }}>{c}</button>
            ))}
          </div>
          {/* Table */}
          <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.5fr 0.8fr 1fr 1fr 1.4fr 24px',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
            <div>Student · សិស្ស</div>
            <div>Class</div>
            <div>Instructor</div>
            <div>Progress</div>
            <div>Next lesson · Status</div>
            <div></div>
          </div>
          {STUDENTS.map((s,i)=>(
            <div key={s.id} onClick={()=>setSelected(s)} style={{
              padding:'12px 16px',
              display:'grid',gridTemplateColumns:'1.5fr 0.8fr 1fr 1fr 1.4fr 24px',gap:14,
              alignItems:'center',
              borderBottom: i<STUDENTS.length-1 ? '1px solid var(--border)':'none',
              background: selected.id === s.id ? 'var(--surface-muted)' : 'transparent',
              cursor:'default',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <Avatar tag={s.photo} size={32} ring={selected.id===s.id}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.id} · {s.en}</div>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--ink-2)'}}>{s.cls}</div>
              <div style={{fontSize:12,color:'var(--ink-2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.inst}</div>
              <div>
                <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
                  <div style={{width:`${(s.hours/s.target)*100}%`,height:'100%',background:'var(--accent)'}}/>
                </div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4,fontVariantNumeric:'tabular-nums'}}>{s.hours}/{s.target}h</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <div style={{fontSize:11,color:'var(--ink-2)'}}>{s.next}</div>
                <Badge tone={
                  s.status==='Cleared' ? 'good' :
                  s.status==='Road exam soon' ? 'warn' :
                  s.status==='New' ? 'accent' : 'neutral'
                }>{s.status}</Badge>
              </div>
              <Icon name="chev" size={14} stroke={1.5}/>
            </div>
          ))}
        </Card>

        {/* Detail panel */}
        <StudentDetail s={selected}/>
      </div>
    </div>
  );
};

const StudentDetail = ({ s }) => (
  <Card pad={0}>
    <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
        <Photo tag={s.photo} w={64} h={64} r={999}/>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{s.name}</div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{s.en} · {s.id}</div>
        </div>
        <Btn kind="ghost" size="sm" icon={<Icon name="phone" size={13}/>}>ហៅ</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
        <div><span style={{color:'var(--ink-3)'}}>ថ្នាក់ · Class</span><div style={{fontWeight:500,marginTop:2}}>{s.cls}</div></div>
        <div><span style={{color:'var(--ink-3)'}}>គ្រូ · Instructor</span><div style={{fontWeight:500,marginTop:2}}>{s.inst}</div></div>
        <div><span style={{color:'var(--ink-3)'}}>ទូរស័ព្ទ · Phone</span><div style={{fontWeight:500,marginTop:2}}>{s.phone}</div></div>
        <div><span style={{color:'var(--ink-3)'}}>ចូលរៀន · Enrolled</span><div style={{fontWeight:500,marginTop:2}}>មីនា 2026</div></div>
      </div>
    </div>

    <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
      <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>វឌ្ឍនភាព · PROGRESS</div>
      <div style={{display:'flex',alignItems:'baseline',gap:8}}>
        <div style={{fontSize:32,fontWeight:600,fontFamily:'var(--font-display)'}}>{s.hours}</div>
        <div style={{fontSize:12,color:'var(--ink-3)'}}>/ {s.target} ម៉ោងបាន​អនុវត្ត</div>
      </div>
      <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,marginTop:8,overflow:'hidden'}}>
        <div style={{width:`${(s.hours/s.target)*100}%`,height:'100%',background:'var(--accent)'}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14}}>
        {[
          {l:'Theory · ច្បាប់', v:'95%', good:true},
          {l:'Yard · ទីលាន', v:'88%', good:true},
          {l:'City · ទីក្រុង', v:'62%', good:false},
          {l:'Highway', v:'—', good:false},
        ].map((m,i)=>(
          <div key={i} style={{padding:10,background:'var(--surface-muted)',borderRadius:8}}>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>{m.l}</div>
            <div style={{fontSize:15,fontWeight:600,marginTop:2,color:m.good?'var(--good)':'var(--ink-2)'}}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{padding:18,borderBottom:'1px solid var(--border)'}}>
      <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>សកម្មភាពថ្មីៗ · RECENT</div>
      {[
        {d:'មិថុនា 1', t:'មេរៀនពេញលេញ · Lesson logged 2h · City driving', who:'Mr. Vichea'},
        {d:'ឧសភា 30', t:'ការប្រឡងសាកល្បង · Mock test 87/100', who:'auto'},
        {d:'ឧសភា 28', t:'ការទូទាត់ · Payment $60 received', who:'ABA'},
        {d:'ឧសភា 25', t:'មេរៀន 1h · Yard parking', who:'Mr. Vichea'},
      ].map((a,i)=>(
        <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderTop:i?'1px dashed var(--border)':'none'}}>
          <div style={{width:50,fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',paddingTop:2}}>{a.d}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12}}>{a.t}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>{a.who}</div>
          </div>
        </div>
      ))}
    </div>

    <div style={{padding:14,display:'flex',gap:8}}>
      <Btn kind="ghost" size="sm" style={{flex:1}}>បើកប្រវត្តិរូប · Full profile</Btn>
      <Btn kind="primary" size="sm" style={{flex:1}}>កក់មេរៀន · Book lesson</Btn>
    </div>
  </Card>
);

const InstructorsScreen = () => (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="គ្រូបង្រៀន"
      en={`Instructors · ${INSTRUCTORS.length} on staff · 1 hiring`}
      action={
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="md">ប្រតិទិនក្រុម · Team calendar</Btn>
          <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}>បន្ថែម · Add instructor</Btn>
        </div>
      }
    />

    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {INSTRUCTORS.map(i => (
        <Card key={i.id} pad={0}>
          <div style={{position:'relative'}}>
            <Photo tag={i.photo} w="100%" h={140} r={0}/>
            <div style={{position:'absolute',top:10,right:10,display:'flex',gap:4}}>
              {i.cls.map(c => <Badge key={c} tone="neutral">Class {c}</Badge>)}
            </div>
          </div>
          <div style={{padding:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:15,fontWeight:600,fontFamily:'var(--font-display)'}}>{i.name}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{i.en} · {i.id}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4,color:'var(--warn)'}}>
                <Icon name="star" size={13}/>
                <span style={{fontSize:13,fontWeight:600}}>{i.rating}</span>
              </div>
            </div>
            <div style={{fontSize:12,color:'var(--ink-2)',marginTop:8}}>{i.role}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:14}}>
              <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase'}}>Students</div><div style={{fontSize:16,fontWeight:600,marginTop:2}}>{i.students}</div></div>
              <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase'}}>Today</div><div style={{fontSize:16,fontWeight:600,marginTop:2}}>{i.today}</div></div>
              <div><div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase'}}>Since</div><div style={{fontSize:16,fontWeight:600,marginTop:2}}>{i.since}</div></div>
            </div>
            <div style={{marginTop:14,padding:'10px 0 0',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{i.lang}</div>
              <Btn kind="ghost" size="sm" icon={<Icon name="chev" size={12}/>}>មើល · View</Btn>
            </div>
          </div>
        </Card>
      ))}

      {/* Hiring card */}
      <Card style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',minHeight:280,background:'transparent',border:'1.5px dashed var(--border-strong)'}}>
        <div style={{
          width:60,height:60,borderRadius:999,
          background:'var(--surface-muted)',
          display:'flex',alignItems:'center',justifyContent:'center',
          color:'var(--ink-3)',
        }}>
          <Icon name="plus" size={26}/>
        </div>
        <div style={{fontSize:14,fontWeight:600,marginTop:14}}>ជ្រើសរើសគ្រូថ្មី</div>
        <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>Hiring · 2 candidates in review</div>
        <Btn kind="ghost" size="sm" style={{marginTop:14}}>បើកដំណើរការ · Open pipeline</Btn>
      </Card>
    </div>
  </div>
);

Object.assign(window, { StudentsScreen, InstructorsScreen });
