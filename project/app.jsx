// app.jsx — Shell + router + tweaks wiring

const FONT_OPTIONS = {
  inter:    { display:'Inter, system-ui, sans-serif',           en:'Inter, system-ui, sans-serif',           label:'Inter' },
  plex:     { display:'"IBM Plex Sans", system-ui, sans-serif', en:'"IBM Plex Sans", system-ui, sans-serif', label:'IBM Plex' },
  fraunces: { display:'Fraunces, Georgia, serif',               en:'Inter, system-ui, sans-serif',           label:'Fraunces × Inter' },
};

const ACCENT_OPTIONS = [
  { v:'#2A5DB0', soft:'#E5EBF5' }, // cobalt
  { v:'#8B5E34', soft:'#F0E8DE' }, // bronze
  { v:'#3B7A57', soft:'#E2EFE7' }, // sage
  { v:'#B0413E', soft:'#F4DEDD' }, // brick
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [current, setCurrent] = React.useState('dashboard');

  // apply tweaks to CSS variables
  React.useEffect(() => {
    const root = document.documentElement;
    const accent = t.accent || '#2A5DB0';
    const soft = ACCENT_OPTIONS.find(a => a.v === accent)?.soft || '#E5EBF5';
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', soft);

    const f = FONT_OPTIONS[t.font] || FONT_OPTIONS.inter;
    root.style.setProperty('--font-en', f.en);
    root.style.setProperty('--font-display', f.display);
  }, [t.accent, t.font]);

  // role from tweaks (so it persists)
  const role = t.role || 'admin';
  const setRole = (r) => setTweak('role', r);
  const items = NAV_ITEMS[role];

  // ensure current screen exists in role's nav
  React.useEffect(() => {
    if (!items.find(i => i.id === current)) setCurrent('dashboard');
  }, [role]);

  // route → screen
  const screens = {
    dashboard:   <Dashboard role={role}/>,
    students:    <StudentsScreen/>,
    schedule:    <ScheduleScreen view={t.calendar}/>,
    instructors: <InstructorsScreen/>,
    fleet:       <FleetScreen/>,
    progress:    <ProgressScreen/>,
    billing:     <BillingScreen/>,
    public:      <PublicScreen/>,
    booking:     <BookingScreen/>,
    mobile:      <MobileScreen/>,
  };
  const navStyle = t.nav || 'sidebar';

  // layout depends on nav style
  if (navStyle === 'sidebar') {
    return (
      <div style={{display:'flex',height:'100vh',width:'100vw',background:'var(--bg)'}}>
        <Sidebar items={items} current={current} onGo={setCurrent} role={role} onRole={setRole}/>
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
          <ContentTopbar role={role} onRole={setRole} navStyle={navStyle}/>
          <main style={{flex:1,overflow:'auto',padding:'24px 28px'}}>
            {screens[current]}
          </main>
        </div>
        <AppTweaks t={t} setTweak={setTweak}/>
      </div>
    );
  }

  if (navStyle === 'topbar') {
    return (
      <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',background:'var(--bg)'}}>
        <Topbar items={items} current={current} onGo={setCurrent} role={role} onRole={setRole}/>
        <main style={{flex:1,overflow:'auto',padding:'24px 28px'}}>
          {screens[current]}
        </main>
        <AppTweaks t={t} setTweak={setTweak}/>
      </div>
    );
  }

  // tabs
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',background:'var(--bg)'}}>
      <TabsBar items={items} current={current} onGo={setCurrent} role={role} onRole={setRole}/>
      <main style={{flex:1,overflow:'auto',padding:'24px 28px'}}>
        {screens[current]}
      </main>
      <AppTweaks t={t} setTweak={setTweak}/>
    </div>
  );
}

const ContentTopbar = ({ role, onRole }) => (
  <div style={{
    height:64,background:'var(--surface)',borderBottom:'1px solid var(--border)',
    display:'flex',alignItems:'center',padding:'0 28px',gap:16,flexShrink:0,
  }}>
    <div style={{
      flex:1,display:'flex',alignItems:'center',gap:10,
      maxWidth:480,padding:'8px 14px',
      background:'var(--surface-muted)',border:'1px solid var(--border)',
      borderRadius:10,color:'var(--ink-3)',
    }}>
      <Icon name="search" size={15}/>
      <span style={{fontSize:13}}>ស្វែងរក · search students, lessons, invoices…</span>
      <span style={{marginLeft:'auto',fontSize:10,fontFamily:'JetBrains Mono, monospace',background:'var(--surface)',padding:'2px 6px',borderRadius:4,border:'1px solid var(--border)'}}>⌘K</span>
    </div>
    <button style={{
      width:34,height:34,borderRadius:8,
      border:'1px solid var(--border)',background:'var(--surface)',
      display:'flex',alignItems:'center',justifyContent:'center',
      position:'relative',cursor:'default',
    }}>
      <Icon name="bell" size={16}/>
      <span style={{position:'absolute',top:-4,right:-4,background:'var(--accent)',color:'#fff',fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:999}}>3</span>
    </button>
    <button style={{
      height:34,padding:'0 12px',borderRadius:8,
      border:'1px solid var(--border)',background:'var(--surface)',
      display:'flex',alignItems:'center',gap:8,cursor:'default',
    }}>
      <Icon name="plus" size={14}/>
      <span style={{fontSize:12,fontWeight:500}}>បង្កើតថ្មី · Create</span>
    </button>
  </div>
);

const AppTweaks = ({ t, setTweak }) => (
  <TweaksPanel>
    <TweakSection label="Identity · អត្តសញ្ញាណ"/>
    <TweakRadio
      label="Role · តួនាទី"
      value={t.role || 'admin'}
      options={['admin','instructor','student']}
      onChange={(v) => setTweak('role', v)}
    />
    <TweakSelect
      label="Navigation · ប្រភេទរុករក"
      value={t.nav || 'sidebar'}
      options={[
        {value:'sidebar', label:'Sidebar'},
        {value:'topbar',  label:'Topbar'},
        {value:'tabs',    label:'Pill tabs'},
      ]}
      onChange={(v) => setTweak('nav', v)}
    />

    <TweakSection label="Theme · រូបរាង"/>
    <TweakColor
      label="Accent · ពណ៌សំខាន់"
      value={t.accent}
      options={ACCENT_OPTIONS.map(a => a.v)}
      onChange={(v) => setTweak('accent', v)}
    />
    <TweakSelect
      label="Type pair · ប្រភេទអក្សរ"
      value={t.font}
      options={[
        {value:'inter',    label:'Inter — clean / default'},
        {value:'plex',     label:'IBM Plex — neutral / structured'},
        {value:'fraunces', label:'Fraunces × Inter — editorial'},
      ]}
      onChange={(v) => setTweak('font', v)}
    />

    <TweakSection label="Calendar · ប្រតិទិន"/>
    <TweakRadio
      label="Default view"
      value={t.calendar || 'week'}
      options={['week','month','agenda']}
      onChange={(v) => setTweak('calendar', v)}
    />
  </TweaksPanel>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
