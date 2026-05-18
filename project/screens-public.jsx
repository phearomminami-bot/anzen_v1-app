// screens-public.jsx — Public landing page + Booking flow

const PublicScreen = () => (
  <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden'}}>
    {/* faux browser chrome */}
    <div style={{height:32,background:'var(--surface-muted)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 12px',gap:8}}>
      <div style={{display:'flex',gap:5}}>
        {['#FF5F57','#FEBC2E','#28C840'].map(c=><div key={c} style={{width:10,height:10,borderRadius:999,background:c}}/>)}
      </div>
      <div style={{flex:1,display:'flex',justifyContent:'center'}}>
        <div style={{fontSize:11,padding:'4px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,color:'var(--ink-3)'}}>
          phlov.drive · ផ្លូវ Driving Academy
        </div>
      </div>
    </div>

    {/* page header / nav */}
    <div style={{padding:'18px 32px',display:'flex',alignItems:'center',gap:24,borderBottom:'1px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Logo size={30}/>
        <div>
          <div style={{fontSize:15,fontWeight:600}}>ផ្លូវ Phlov</div>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.04em'}}>DRIVE ACADEMY</div>
        </div>
      </div>
      <nav style={{display:'flex',gap:18,fontSize:13,color:'var(--ink-2)',flex:1,justifyContent:'center'}}>
        {[
          {km:'អំពីពួកយើង',en:'About'},
          {km:'វគ្គសិក្សា',en:'Courses'},
          {km:'តម្លៃ',en:'Pricing'},
          {km:'គ្រូបង្រៀន',en:'Instructors'},
          {km:'ទីតាំង',en:'Locations'},
          {km:'សំណួរ',en:'FAQ'},
        ].map((n,i)=>(
          <button key={i} style={{border:'none',background:'transparent',padding:'4px 0',cursor:'default',color:'inherit',fontSize:13}}>
            {n.km} <span style={{color:'var(--ink-3)',fontSize:11}}>· {n.en}</span>
          </button>
        ))}
      </nav>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{fontSize:11,color:'var(--ink-3)'}}>KH · EN</div>
        <Btn kind="ghost" size="sm">ចូលគណនី</Btn>
        <Btn kind="accent" size="sm">ចុះឈ្មោះឥឡូវ</Btn>
      </div>
    </div>

    {/* hero */}
    <div style={{padding:'56px 32px 48px',display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:48,alignItems:'center',background:'var(--surface-muted)'}}>
      <div>
        <Badge tone="accent">ចូលរៀនថ្ងៃនេះ · Enrolling for June cohort</Badge>
        <h1 style={{fontSize:56,fontWeight:600,lineHeight:1.05,letterSpacing:'-.02em',margin:'18px 0 14px',fontFamily:'var(--font-display)'}}>
          រៀនបើកបរ<br/>
          <span style={{color:'var(--accent)'}}>ដោយទំនុកចិត្ត។</span>
        </h1>
        <p style={{fontSize:16,color:'var(--ink-2)',maxWidth:480,lineHeight:1.5,margin:'0 0 28px'}}>
          វគ្គបង្រៀនបើកបរប្រកបដោយតុល្យភាព ការអនុវត្តន៍ដោយផ្ទាល់ និងគ្រូដែលយកចិត្តទុកដាក់។
          <span style={{display:'block',color:'var(--ink-3)',fontSize:14,marginTop:6}}>Class A · B · C licenses · road exam preparation · since 2014.</span>
        </p>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <Btn kind="accent" size="lg" icon={<Icon name="book" size={16}/>}>ចាប់ផ្ដើមចុះឈ្មោះ · Start enrolling</Btn>
          <Btn kind="ghost" size="lg">មើលវិឌីអូ · Watch 2-min tour</Btn>
        </div>
        <div style={{marginTop:32,display:'flex',gap:32}}>
          {[
            {n:'2,400+', l:'សិស្សបានជោគជ័យ · graduates'},
            {n:'91%',    l:'ការប្រឡងជាប់ · pass rate'},
            {n:'12',     l:'គ្រូមានវិញ្ញាបនបត្រ · certified instructors'},
          ].map((s,i)=>(
            <div key={i}>
              <div style={{fontSize:24,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>{s.n}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* hero photo collage */}
      <div style={{position:'relative',height:420}}>
        <Photo tag="hero · student in car" w="100%" h={280} r={12} style={{position:'absolute',top:0,right:0,width:'90%'}}/>
        <Photo tag="instructor portrait" w={180} h={220} r={12} style={{position:'absolute',bottom:0,left:0,boxShadow:'0 18px 40px rgba(0,0,0,.12)'}}/>
        <Photo tag="happy graduate" w={160} h={160} r={999} style={{position:'absolute',bottom:30,right:30,boxShadow:'0 18px 40px rgba(0,0,0,.12)'}}/>
        <div style={{position:'absolute',top:24,left:0,background:'var(--surface)',padding:'10px 14px',borderRadius:10,border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,boxShadow:'0 8px 24px rgba(0,0,0,.06)'}}>
          <div style={{width:36,height:36,borderRadius:999,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name="cal" size={16}/>
          </div>
          <div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>ការអនុវត្តន៍បន្ទាប់</div>
            <div style={{fontSize:13,fontWeight:600}}>ស្អែក 09:00 · Toyota Vios</div>
          </div>
        </div>
      </div>
    </div>

    {/* Courses */}
    <div style={{padding:'56px 32px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:28}}>
        <div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>OUR COURSES · វគ្គបង្រៀន</div>
          <div style={{fontSize:32,fontWeight:600,marginTop:6,letterSpacing:'-.01em',fontFamily:'var(--font-display)'}}>ជ្រើសរើសវគ្គដែលសាកសមនឹងអ្នក</div>
        </div>
        <Btn kind="ghost" size="md" icon={<Icon name="arrow" size={14}/>}>មើលទាំងអស់</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
        {[
          {tag:'Class B', km:'រថយន្តបួនកង់', en:'Standard car', price:180, hrs:30, photo:'course-b'},
          {tag:'Class A', km:'ម៉ូតូ',         en:'Motorcycle',   price:110, hrs:18, photo:'course-a'},
          {tag:'Class C', km:'ឡានដឹកទំនិញ',  en:'Truck',        price:320, hrs:40, photo:'course-c'},
        ].map((c,i)=>(
          <Card key={i} pad={0}>
            <Photo tag={c.photo} w="100%" h={180} r={0}/>
            <div style={{padding:18}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <Badge tone={i===0?'accent':'neutral'}>{c.tag}</Badge>
                  <div style={{fontSize:18,fontWeight:600,marginTop:10,fontFamily:'var(--font-display)'}}>{c.km}</div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{c.en} · {c.hrs}h of training</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:24,fontWeight:600,fontFamily:'var(--font-display)'}}>${c.price}</div>
                  <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>ALL-IN</div>
                </div>
              </div>
              <ul style={{listStyle:'none',padding:0,margin:'18px 0 0',display:'flex',flexDirection:'column',gap:6,fontSize:12,color:'var(--ink-2)'}}>
                {[
                  i===0?'30 ម៉ោងបង្រៀន · 30h training':'18 ម៉ោងបង្រៀន · 18h training',
                  'ប្រឡងសាកល្បង​មិនកំណត់ · unlimited mock tests',
                  'ការ​​ត្រៀមឯកសារ · permit paperwork',
                  i===0?'រថយន្តចំនួន ៥ ម៉ូដែលឲ្យជ្រើស · 5 car models':'ការប្រឡងផ្លូវ · road exam included',
                ].slice(0,4).map((f,j)=>(
                  <li key={j} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <Icon name="check" size={13} stroke={2}/> {f}
                  </li>
                ))}
              </ul>
              <Btn kind="ghost" size="md" style={{marginTop:18,width:'100%',justifyContent:'center'}} icon={<Icon name="arrow" size={14}/>}>មើលលម្អិត · See details</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>

    {/* Instructors strip */}
    <div style={{padding:'48px 32px',background:'var(--ink)',color:'var(--bg)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:24}}>
        <div>
          <div style={{fontSize:11,opacity:.5,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>OUR INSTRUCTORS · គ្រូបង្រៀន</div>
          <div style={{fontSize:32,fontWeight:600,marginTop:6,letterSpacing:'-.01em',fontFamily:'var(--font-display)'}}>មនុស្សដែលនឹងជួយអ្នកសម្រេចលទ្ធផល</div>
        </div>
        <div style={{fontSize:13,opacity:.7,maxWidth:340}}>គ្រូទាំងអស់របស់យើងមានវិញ្ញាបនបត្រ និងបទពិសោធន៍ច្រើនជាង ៥ឆ្នាំ។</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
        {INSTRUCTORS.map(i=>(
          <div key={i.id} style={{textAlign:'left'}}>
            <Photo tag={i.photo} w="100%" h={200} r={10} style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.5)'}}/>
            <div style={{fontSize:14,fontWeight:600,marginTop:12}}>{i.name}</div>
            <div style={{fontSize:11,opacity:.6,marginTop:2}}>{i.en} · ★{i.rating}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Testimonial + CTA */}
    <div style={{padding:'56px 32px',display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:32,alignItems:'center'}}>
      <div>
        <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>មតិសិស្ស · TESTIMONIAL</div>
        <p style={{fontSize:28,lineHeight:1.4,letterSpacing:'-.005em',fontWeight:500,margin:'18px 0',fontFamily:'var(--font-display)'}}>
          "ប្រឡងជាប់លើកដំបូងដោយសារគ្រូ វិច្ឆេយ្យ។ កម្មវិធីទូរស័ព្ទចាក់ Khmer Sign Quiz ជួយឲ្យខ្ញុំត្រៀមមុនមេរៀន។"
        </p>
        <div style={{display:'flex',alignItems:'center',gap:12,marginTop:18}}>
          <Avatar tag="port-5" size={42}/>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>ឈឹម ឡាយហ៊ាង · Chhim Layheang</div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>Graduate · May 2026 · Class B</div>
          </div>
        </div>
      </div>
      <Card style={{background:'var(--accent)',border:'none',color:'#fff',padding:28}}>
        <div style={{fontSize:11,opacity:.7,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>NEXT COHORT · វគ្គបន្ទាប់</div>
        <div style={{fontSize:32,fontWeight:600,marginTop:8,fontFamily:'var(--font-display)'}}>មិថុនា ១៥</div>
        <div style={{fontSize:13,opacity:.85,marginTop:6}}>June 15, 2026 · 12 seats left · save 10% before Jun 8</div>
        <Btn kind="ghost" size="lg" style={{marginTop:20,width:'100%',justifyContent:'center',background:'#fff',color:'var(--accent)',borderColor:'#fff'}} icon={<Icon name="arrow" size={16}/>}>ចុះឈ្មោះឥឡូវ · Enroll now</Btn>
      </Card>
    </div>

    {/* Footer */}
    <div style={{padding:'32px',background:'var(--surface-muted)',borderTop:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr',gap:32,fontSize:12,color:'var(--ink-3)'}}>
      <div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <Logo size={24}/>
          <div style={{fontSize:13,fontWeight:600,color:'var(--ink)'}}>ផ្លូវ Phlov Drive Academy</div>
        </div>
        <div>គ្រឹះស្ថានបង្រៀនបើកបរត្រូវបានទទួលស្គាល់ដោយ​ក្រសួងសាធារណការ និងដឹកជញ្ជូន ឆ្នាំ ២០១៤។</div>
      </div>
      <div>
        <div style={{color:'var(--ink-2)',fontWeight:600,marginBottom:8}}>Phnom Penh</div>
        <div>123 St. Sothearos · Daun Penh<br/>+855 12 345 678<br/>hello@phlov.drive</div>
      </div>
      <div>
        <div style={{color:'var(--ink-2)',fontWeight:600,marginBottom:8}}>Siem Reap</div>
        <div>456 Sivutha Blvd<br/>+855 17 882 401<br/>siemreap@phlov.drive</div>
      </div>
      <div>
        <div style={{color:'var(--ink-2)',fontWeight:600,marginBottom:8}}>Follow</div>
        <div>Facebook · TikTok · Telegram · YouTube</div>
      </div>
    </div>
  </div>
);

// ── Booking flow ──
const BookingScreen = () => {
  const [step, setStep] = React.useState(2);
  const steps = [
    {n:1, km:'វគ្គ',    en:'Course'},
    {n:2, km:'កាលវិភាគ', en:'Time'},
    {n:3, km:'គ្រូ',     en:'Instructor'},
    {n:4, km:'ព័ត៌មាន',  en:'Details'},
    {n:5, km:'ការទូទាត់', en:'Payment'},
    {n:6, km:'បញ្ជាក់',   en:'Confirm'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="ដំណើរការកក់មេរៀន"
        en="Booking flow · live preview"
        action={<Btn kind="ghost" size="md">មើលលំហូរទាំងមូល · View all steps</Btn>}
      />

      {/* Step indicator */}
      <Card pad={0}>
        <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:0}}>
          {steps.map((st,i)=>(
            <React.Fragment key={st.n}>
              <button onClick={()=>setStep(st.n)} style={{
                display:'flex',alignItems:'center',gap:8,
                border:'none',background:'transparent',padding:0,cursor:'default',
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

        {step === 2 && <BookingStepTime/>}
        {step === 1 && <BookingStepCourse/>}
        {step === 3 && <BookingStepInstructor/>}

        <div style={{padding:'18px 24px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-muted)'}}>
          <div style={{fontSize:12,color:'var(--ink-3)'}}>Step {step} of {steps.length}</div>
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" onClick={()=>setStep(Math.max(1,step-1))}>ត្រឡប់ · Back</Btn>
            <Btn kind="primary" size="md" onClick={()=>setStep(Math.min(steps.length,step+1))} icon={<Icon name="arrow" size={14}/>}>បន្ត · Continue</Btn>
          </div>
        </div>
      </Card>

      {/* Other steps preview */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        <BookingMiniStep n={4} km="ព័ត៌មានសិស្ស · DETAILS" body={<div style={{display:'flex',flexDirection:'column',gap:6}}>
          {['ឈ្មោះ · Full name','ថ្ងៃខែឆ្នាំកំណើត','លេខអត្តសញ្ញាណប័ណ្ណ','ទូរស័ព្ទ + Email'].map((f,i)=>(
            <div key={i} style={{padding:'8px 10px',background:'var(--surface-muted)',borderRadius:6,fontSize:11,color:'var(--ink-3)'}}>{f}</div>
          ))}
        </div>}/>
        <BookingMiniStep n={5} km="ការទូទាត់ · PAYMENT" body={<div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{padding:'10px 12px',border:'2px solid var(--accent)',borderRadius:6,fontSize:11,display:'flex',justifyContent:'space-between'}}><span>ABA Mobile</span><span>•••• 4180</span></div>
          <div style={{padding:'10px 12px',border:'1px solid var(--border)',borderRadius:6,fontSize:11,color:'var(--ink-3)'}}>Wing · សាច់ប្រាក់</div>
          <div style={{padding:'10px 12px',border:'1px solid var(--border)',borderRadius:6,fontSize:11,color:'var(--ink-3)'}}>Bank transfer</div>
          <div style={{padding:10,background:'var(--surface-muted)',borderRadius:6,marginTop:6}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--ink-3)'}}><span>Class B · 30h</span><span>$180</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:600,marginTop:4}}><span>Total</span><span>$180.00</span></div>
          </div>
        </div>}/>
        <BookingMiniStep n={6} km="បញ្ជាក់ · CONFIRMATION" body={<div style={{textAlign:'center',padding:'12px 0'}}>
          <div style={{width:48,height:48,borderRadius:999,background:'var(--good)',color:'#fff',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name="check" size={26} stroke={2.5}/>
          </div>
          <div style={{fontSize:14,fontWeight:600,marginTop:10}}>ការកក់ត្រូវបានបញ្ជាក់</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>មេរៀនដំបូង · មិថុនា 4, 09:00</div>
          <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:8}}>BK-2026-0091</div>
        </div>}/>
      </div>
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

const BookingStepCourse = () => (
  <div style={{padding:24}}>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ជ្រើសរើសវគ្គ · Choose your course</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>បន្ទាប់ពីជ្រើសរើស អ្នកអាចចូលរួមថ្នាក់ទ្រឹស្តីភ្លាមៗ។</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {[
        {tag:'A',km:'ម៉ូតូ',p:'$110',h:'18h'},
        {tag:'B',km:'ឡានបួនកង់',p:'$180',h:'30h',sel:true},
        {tag:'C',km:'ឡានដឹកទំនិញ',p:'$320',h:'40h'},
      ].map((c,i)=>(
        <div key={i} style={{padding:18,border:`2px solid ${c.sel?'var(--accent)':'var(--border)'}`,borderRadius:10,background:c.sel?'var(--accent-soft)':'transparent'}}>
          <Badge tone={c.sel?'accent':'neutral'}>Class {c.tag}</Badge>
          <div style={{fontSize:18,fontWeight:600,marginTop:10,fontFamily:'var(--font-display)'}}>{c.km}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{c.h} of training</div>
          <div style={{fontSize:24,fontWeight:600,marginTop:14,fontFamily:'var(--font-display)'}}>{c.p}</div>
        </div>
      ))}
    </div>
  </div>
);

const BookingStepTime = () => {
  const [pick, setPick] = React.useState({day:3, h:10});
  const slots = [7,8,9,10,11,13,14,15,16];
  return (
    <div style={{padding:24}}>
      <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ជ្រើសរើសម៉ោងសម្រាប់ Class B · Pick your first lesson time</div>
      <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>មេរៀន​ដំបូងគឺ​អនុវត្តន៍ផ្ទាល់​ក្នុងទីលាន។</div>

      <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:24}}>
        {/* mini calendar */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600}}>មិថុនា 2026</div>
            <div style={{display:'flex',gap:4}}>
              <button style={{width:22,height:22,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',cursor:'default',display:'flex',alignItems:'center',justifyContent:'center',transform:'rotate(180deg)'}}><Icon name="chev" size={11}/></button>
              <button style={{width:22,height:22,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',cursor:'default',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="chev" size={11}/></button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6}}>
            {DAYS_EN.map(d => <div key={d} style={{fontSize:9,color:'var(--ink-3)',textAlign:'center',padding:3}}>{d[0]}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
            {Array.from({length:30},(_,i)=>i+1).map(d => {
              const isSel = d === 4;
              const past = d < 1;
              return (
                <button key={d} onClick={()=>setPick({...pick, day:d})} style={{
                  aspectRatio:'1',border:'none',
                  background: isSel ? 'var(--ink)' : past ? 'transparent' : 'var(--surface)',
                  color: isSel ? 'var(--bg)' : past ? 'var(--ink-3)' : 'var(--ink)',
                  borderRadius:6,fontSize:11,fontWeight:isSel?600:400,
                  cursor:'default',
                }}>{d}</button>
              );
            })}
          </div>
        </div>

        {/* time slots */}
        <div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>ម៉ោងទំនេរ​ ព្រហ. មិថុនា 4 · Available · Thu Jun 4</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
            {slots.map(h => {
              const taken = [7,11,16].includes(h);
              const sel = h === pick.h;
              return (
                <button key={h} disabled={taken} onClick={()=>setPick({...pick,h})} style={{
                  padding:'12px 10px',border:`1px solid ${sel?'var(--ink)':'var(--border)'}`,
                  background: sel ? 'var(--ink)' : taken ? 'var(--surface-muted)' : 'var(--surface)',
                  color: sel ? 'var(--bg)' : taken ? 'var(--ink-3)' : 'var(--ink)',
                  borderRadius:8,
                  fontSize:13,fontWeight:600,
                  fontFamily:'var(--font-display)',
                  cursor:'default',
                  textDecoration: taken ? 'line-through' : 'none',
                  opacity: taken ? .5 : 1,
                }}>{String(h).padStart(2,'0')}:00</button>
              );
            })}
          </div>
          <div style={{marginTop:18,padding:14,background:'var(--surface-muted)',borderRadius:8,display:'flex',alignItems:'center',gap:14}}>
            <Icon name="check" size={18} stroke={2}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600}}>ព្រហស្បតិ៍ · មិថុនា 4 · 10:00 (2h)</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>មេរៀននៅទីលាន Phnom Penh campus</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingStepInstructor = () => (
  <div style={{padding:24}}>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:6}}>ជ្រើសរើសគ្រូ · Pick your instructor</div>
    <div style={{fontSize:13,color:'var(--ink-3)',marginBottom:20}}>គ្រូទាំងអស់មានវិញ្ញាបនបត្រ Class B។ ឬអនុញ្ញាតឲ្យយើងផ្គូផ្គងជូនអ្នក។</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
      {INSTRUCTORS.filter(i=>i.cls.includes('B')).slice(0,3).map((i,idx)=>(
        <div key={i.id} style={{padding:16,border:`2px solid ${idx===0?'var(--accent)':'var(--border)'}`,borderRadius:10,background:idx===0?'var(--accent-soft)':'transparent'}}>
          <div style={{display:'flex',gap:12}}>
            <Photo tag={i.photo} w={56} h={56} r={999}/>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{i.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{i.en} · ★{i.rating}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>{i.role}</div>
            </div>
          </div>
          <div style={{marginTop:12,fontSize:11,color:'var(--ink-3)'}}>{i.lang}</div>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, { PublicScreen, BookingScreen });
