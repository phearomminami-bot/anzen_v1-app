// screens-mobile.jsx — Mobile app mockups in iOS frames

const MobileScreen = () => (
  <div style={{display:'flex',flexDirection:'column',gap:14}}>
    <SectionTitle
      km="កម្មវិធីទូរស័ព្ទសម្រាប់សិស្ស"
      en="Student mobile app · 4 key flows"
      action={<div style={{display:'flex',gap:8}}>
        <Btn kind="ghost" size="md">iOS</Btn>
        <Btn kind="ghost" size="md">Android</Btn>
      </div>}
    />

    <div style={{display:'flex',gap:24,padding:'24px 0 40px',justifyContent:'center',flexWrap:'wrap',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
      <MobileHome/>
      <MobileLesson/>
      <MobileBook/>
      <MobileProgress/>
    </div>
  </div>
);

const MphoneShell = ({ children, label, sub }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
    <div style={{transform:'scale(0.78)',transformOrigin:'top center',marginBottom:-160}}>
      <IOSDevice width={390} height={780} dark={false}>
        {children}
      </IOSDevice>
    </div>
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase'}}>{sub}</div>
      <div style={{fontSize:14,fontWeight:600,marginTop:4}}>{label}</div>
    </div>
  </div>
);

const MTabBar = ({ active = 'home' }) => (
  <div style={{
    height:78,
    background:'rgba(255,255,255,.85)',
    backdropFilter:'blur(20px)',
    borderTop:'.5px solid rgba(0,0,0,.08)',
    display:'flex',
    paddingBottom:18,
  }}>
    {[
      {id:'home',i:'home',l:'ផ្ទះ'},
      {id:'cal',i:'cal',l:'មេរៀន'},
      {id:'prog',i:'chart',l:'វឌ្ឍន.'},
      {id:'pay',i:'cash',l:'ទូទាត់'},
      {id:'me',i:'users',l:'ខ្ញុំ'},
    ].map(t => (
      <div key={t.id} style={{
        flex:1,display:'flex',flexDirection:'column',alignItems:'center',
        justifyContent:'center',gap:3,
        color: t.id===active ? '#2A5DB0' : 'rgba(60,60,67,.6)',
      }}>
        <Icon name={t.i} size={22} stroke={2}/>
        <div style={{fontSize:10,fontWeight:500}}>{t.l}</div>
      </div>
    ))}
  </div>
);

const MobileHome = () => (
  <MphoneShell label="Home" sub="01 · ផ្ទះ">
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#F2F1ED'}}>
      {/* header */}
      <div style={{padding:'8px 20px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'rgba(60,60,67,.6)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>ច័ន្ទ · MON, JUN 1</div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:'-.02em',marginTop:2,fontFamily:'var(--font-display)'}}>សួស្ដី ចាន់ថា 👋</div>
          </div>
          <Avatar tag="port-1" size={36}/>
        </div>
      </div>

      {/* next lesson card */}
      <div style={{margin:'0 16px',padding:18,background:'#1A1A19',color:'#fff',borderRadius:18}}>
        <div style={{fontSize:10,opacity:.55,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>NEXT LESSON · មេរៀនបន្ទាប់</div>
        <div style={{fontSize:30,fontWeight:600,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>ស្អែក 09:00</div>
        <div style={{fontSize:13,opacity:.85}}>Practical · City driving</div>
        <div style={{marginTop:14,display:'flex',alignItems:'center',gap:10,padding:'10px',background:'rgba(255,255,255,.08)',borderRadius:10}}>
          <Avatar tag="inst-1" size={36}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500}}>គ្រូ វិច្ឆេយ្យ</div>
            <div style={{fontSize:10,opacity:.7}}>2AB-4180 · Toyota Vios</div>
          </div>
          <Icon name="chev" size={14}/>
        </div>
      </div>

      {/* progress */}
      <div style={{margin:'12px 16px',padding:16,background:'#fff',borderRadius:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div style={{fontSize:13,fontWeight:600}}>វឌ្ឍនភាព · Progress</div>
          <div style={{fontSize:12,color:'rgba(60,60,67,.6)'}}>14 / 30h</div>
        </div>
        <div style={{height:8,background:'#F2F1ED',borderRadius:999,marginTop:10,overflow:'hidden'}}>
          <div style={{width:'47%',height:'100%',background:'#2A5DB0'}}/>
        </div>
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <div style={{flex:1,padding:'8px 10px',background:'#F2F1ED',borderRadius:10}}>
            <div style={{fontSize:10,color:'rgba(60,60,67,.6)'}}>Mock avg</div>
            <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)'}}>87</div>
          </div>
          <div style={{flex:1,padding:'8px 10px',background:'#F2F1ED',borderRadius:10}}>
            <div style={{fontSize:10,color:'rgba(60,60,67,.6)'}}>Exam in</div>
            <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)'}}>16d</div>
          </div>
        </div>
      </div>

      {/* quick actions */}
      <div style={{margin:'4px 16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div style={{padding:14,background:'#fff',borderRadius:14,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,background:'#E5EBF5',color:'#2A5DB0',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name="plus" size={18}/>
          </div>
          <div style={{fontSize:12,fontWeight:600,lineHeight:1.2}}>កក់មេរៀន<br/><span style={{fontSize:10,color:'rgba(60,60,67,.5)',fontWeight:400}}>Book lesson</span></div>
        </div>
        <div style={{padding:14,background:'#fff',borderRadius:14,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,background:'#F6E9DC',color:'#8E5223',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name="book" size={18}/>
          </div>
          <div style={{fontSize:12,fontWeight:600,lineHeight:1.2}}>ការប្រឡងសាក<br/><span style={{fontSize:10,color:'rgba(60,60,67,.5)',fontWeight:400}}>Mock test</span></div>
        </div>
      </div>

      <div style={{flex:1}}/>
      <MTabBar active="home"/>
    </div>
  </MphoneShell>
);

const MobileLesson = () => (
  <MphoneShell label="Lesson detail" sub="02 · មេរៀន">
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#F2F1ED'}}>
      <div style={{padding:'4px 20px 12px',display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:34,height:34,borderRadius:999,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transform:'rotate(180deg)'}}>
          <Icon name="chev" size={16}/>
        </div>
        <div style={{flex:1,fontSize:14,fontWeight:600}}>មេរៀន · Lesson</div>
      </div>

      <div style={{margin:'0 16px',padding:18,background:'#fff',borderRadius:18}}>
        <Badge tone="accent">Practical · City</Badge>
        <div style={{fontSize:26,fontWeight:700,marginTop:10,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>ស្អែក 09:00</div>
        <div style={{fontSize:13,color:'rgba(60,60,67,.6)'}}>Tue, Jun 2 · 2 hours</div>
        <div style={{marginTop:18,padding:'10px 12px',background:'#F2F1ED',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
          <Avatar tag="inst-1" size={36}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600}}>គ្រូ វិច្ឆេយ្យ</div>
            <div style={{fontSize:11,color:'rgba(60,60,67,.6)'}}>★ 4.9 · since 2019</div>
          </div>
          <Icon name="phone" size={16}/>
        </div>
        <div style={{marginTop:8,padding:'10px 12px',background:'#F2F1ED',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
          <Photo tag="car-1" w={50} h={36} r={6}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>Toyota Vios</div>
            <div style={{fontSize:11,color:'rgba(60,60,67,.6)',fontFamily:'"JetBrains Mono",monospace'}}>2AB-4180</div>
          </div>
        </div>
      </div>

      <div style={{margin:'12px 16px',padding:14,background:'#fff',borderRadius:18}}>
        <div style={{fontSize:11,color:'rgba(60,60,67,.6)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:10}}>MAP · ទីតាំងជួប</div>
        <div style={{
          height:120,borderRadius:10,
          background:'linear-gradient(135deg,#E2E8DA 0%,#D1DBC1 100%)',
          position:'relative',overflow:'hidden',
        }}>
          {[...Array(8)].map((_,i)=>(
            <div key={i} style={{position:'absolute',top:`${10+i*15}%`,left:'-10%',right:'-10%',height:1,background:'rgba(0,0,0,.05)'}}/>
          ))}
          <div style={{position:'absolute',top:'45%',left:'40%',width:28,height:28,borderRadius:999,background:'#2A5DB0',border:'3px solid #fff',boxShadow:'0 2px 8px rgba(0,0,0,.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14}}>📍</div>
        </div>
        <div style={{marginTop:10,fontSize:12}}>Phnom Penh Campus · St. Sothearos #123</div>
      </div>

      <div style={{margin:'12px 16px',padding:14,background:'#fff',borderRadius:18}}>
        <div style={{fontSize:11,color:'rgba(60,60,67,.6)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:10}}>WHAT YOU'LL PRACTICE</div>
        {['ការប្តូរលេខក្នុងទីក្រុង','ការចតក្រៀតចំហៀង','ការប្រាស្រ័យចរាចរណ៍'].map((t,i)=>(
          <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderTop:i?'1px solid rgba(0,0,0,.06)':'none',fontSize:12}}>
            <Icon name="check" size={14} stroke={2}/>{t}
          </div>
        ))}
      </div>

      <div style={{flex:1}}/>

      <div style={{margin:'0 16px 14px',display:'flex',gap:8}}>
        <button style={{flex:1,padding:'14px',background:'#fff',border:'1px solid rgba(0,0,0,.08)',borderRadius:14,fontSize:13,fontWeight:600}}>លុបចោល</button>
        <button style={{flex:2,padding:'14px',background:'#1A1A19',color:'#fff',border:'none',borderRadius:14,fontSize:13,fontWeight:600}}>បញ្ជាក់ការមកដល់ · I'm coming</button>
      </div>
      <MTabBar active="cal"/>
    </div>
  </MphoneShell>
);

const MobileBook = () => (
  <MphoneShell label="Booking" sub="03 · កក់">
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#F2F1ED'}}>
      <div style={{padding:'4px 20px 12px',display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:34,height:34,borderRadius:999,background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transform:'rotate(180deg)'}}>
          <Icon name="chev" size={16}/>
        </div>
        <div style={{flex:1,fontSize:14,fontWeight:600}}>កក់មេរៀន · Book</div>
        <div style={{fontSize:11,color:'rgba(60,60,67,.5)'}}>2/4</div>
      </div>

      <div style={{padding:'0 20px'}}>
        <div style={{height:4,background:'#fff',borderRadius:999,overflow:'hidden'}}>
          <div style={{width:'50%',height:'100%',background:'#2A5DB0'}}/>
        </div>
      </div>

      <div style={{padding:'20px',flex:1,overflow:'auto'}}>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:'-.01em',fontFamily:'var(--font-display)'}}>ជ្រើសរើសម៉ោង</div>
        <div style={{fontSize:13,color:'rgba(60,60,67,.6)',marginTop:4}}>Pick a 2-hour slot</div>

        <div style={{marginTop:18,display:'flex',gap:8,overflowX:'auto',paddingBottom:6}}>
          {['ច័ន្ទ 1','អង្គា 2','ពុធ 3','ព្រហ 4','សុក្រ 5','សៅរ៍ 6','អាទ. 7'].map((d,i)=>{
            const sel = i===3;
            return (
              <div key={i} style={{
                padding:'10px 14px',minWidth:62,textAlign:'center',
                background: sel?'#1A1A19':'#fff',
                color: sel?'#fff':'#1A1A19',
                borderRadius:12,
                flexShrink:0,
              }}>
                <div style={{fontSize:10,opacity:.6,fontFamily:'"JetBrains Mono",monospace'}}>JUN</div>
                <div style={{fontSize:18,fontWeight:700,marginTop:2,fontFamily:'var(--font-display)'}}>{d.split(' ')[1]}</div>
                <div style={{fontSize:10,marginTop:2,opacity:.8}}>{d.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>

        <div style={{marginTop:18,fontSize:11,color:'rgba(60,60,67,.6)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em'}}>AVAILABLE · ទំនេរ</div>
        <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[
            {h:'07:00',a:true},{h:'08:00',a:true},{h:'09:00',a:false,t:true},
            {h:'10:00',a:true,sel:true},{h:'11:00',a:false,t:true},{h:'13:00',a:true},
            {h:'14:00',a:true},{h:'15:00',a:false,t:true},{h:'16:00',a:true},
          ].map((s,i)=>(
            <div key={i} style={{
              padding:'14px 6px',textAlign:'center',
              background: s.sel?'#1A1A19':'#fff',
              color: s.sel?'#fff':s.t?'rgba(60,60,67,.4)':'#1A1A19',
              border: '2px solid '+(s.sel?'#1A1A19':'transparent'),
              borderRadius:10,
              fontSize:14,fontWeight:600,
              fontFamily:'var(--font-display)',
              textDecoration: s.t?'line-through':'none',
            }}>{s.h}</div>
          ))}
        </div>

        <div style={{marginTop:18,padding:14,background:'#fff',borderRadius:14,display:'flex',gap:10,alignItems:'center'}}>
          <Avatar tag="inst-1" size={36}/>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:600}}>គ្រូ វិច្ឆេយ្យ</div>
            <div style={{fontSize:10,color:'rgba(60,60,67,.6)'}}>Auto-matched · ★ 4.9</div>
          </div>
          <div style={{fontSize:11,color:'#2A5DB0',fontWeight:600}}>ប្ដូរ</div>
        </div>
      </div>

      <div style={{margin:'0 16px 14px',padding:14,background:'#1A1A19',color:'#fff',borderRadius:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:11,opacity:.6}}>ព្រហ 4 មិថុនា · 10:00 (2h)</div>
          <div style={{fontSize:14,fontWeight:600,marginTop:2}}>Continue</div>
        </div>
        <Icon name="arrow" size={20}/>
      </div>
      <MTabBar active="cal"/>
    </div>
  </MphoneShell>
);

const MobileProgress = () => (
  <MphoneShell label="Progress" sub="04 · វឌ្ឍនភាព">
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#F2F1ED'}}>
      <div style={{padding:'4px 20px 8px',display:'flex',alignItems:'center',gap:14}}>
        <div style={{flex:1,fontSize:22,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>វឌ្ឍនភាព</div>
        <Icon name="settings" size={20}/>
      </div>

      {/* big circular progress */}
      <div style={{margin:'10px 16px',padding:'24px 18px',background:'#fff',borderRadius:18,textAlign:'center'}}>
        <svg width="160" height="160" style={{margin:'0 auto',display:'block'}}>
          <circle cx="80" cy="80" r="64" fill="none" stroke="#F2F1ED" strokeWidth="12"/>
          <circle cx="80" cy="80" r="64" fill="none" stroke="#2A5DB0" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${0.47*402} 402`} transform="rotate(-90 80 80)"/>
          <text x="80" y="82" textAnchor="middle" fontSize="36" fontWeight="700" fontFamily="Inter" letterSpacing="-1">14</text>
          <text x="80" y="100" textAnchor="middle" fontSize="11" fill="rgba(60,60,67,.6)">of 30 hours</text>
        </svg>
        <div style={{fontSize:13,marginTop:8,color:'rgba(60,60,67,.7)'}}>នៅសល់ 16 ម៉ោងទៀតរហូតដល់ប្រឡង</div>
      </div>

      {/* milestones */}
      <div style={{margin:'0 16px',padding:16,background:'#fff',borderRadius:18}}>
        <div style={{fontSize:11,color:'rgba(60,60,67,.6)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:10}}>MILESTONES · គន្លឹះ</div>
        {[
          {l:'Theory passed', d:true, t:'May 20'},
          {l:'Yard practice cleared', d:true, t:'May 27'},
          {l:'City driving', d:'progress', t:'In progress'},
          {l:'Highway lessons', d:false, t:'—'},
          {l:'Road exam', d:false, t:'Jun 18 (est.)'},
        ].map((m,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i?'1px solid rgba(0,0,0,.06)':'none'}}>
            <div style={{
              width:22,height:22,borderRadius:999,
              background: m.d===true?'#3B7A57':m.d==='progress'?'#2A5DB0':'#F2F1ED',
              color:'#fff',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              {m.d===true && <Icon name="check" size={13} stroke={2.5}/>}
              {m.d==='progress' && <div style={{width:8,height:8,borderRadius:999,background:'#fff'}}/>}
            </div>
            <div style={{flex:1,fontSize:13,color: m.d?'#1A1A19':'rgba(60,60,67,.5)',fontWeight:m.d==='progress'?600:400}}>{m.l}</div>
            <div style={{fontSize:11,color:'rgba(60,60,67,.5)'}}>{m.t}</div>
          </div>
        ))}
      </div>

      <div style={{flex:1}}/>
      <MTabBar active="prog"/>
    </div>
  </MphoneShell>
);

Object.assign(window, { MobileScreen });
