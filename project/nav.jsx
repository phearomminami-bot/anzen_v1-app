// nav.jsx — Sidebar, Topbar, Tabs variants

const NAV_ITEMS = {
  admin: [
    { id:'dashboard',   km:'ផ្ទាំងគ្រប់គ្រង',  en:'Dashboard',     icon:'home' },
    { id:'students',    km:'សិស្ស',           en:'Students',      icon:'users' },
    { id:'schedule',    km:'កាលវិភាគ',        en:'Schedule',      icon:'cal' },
    { id:'instructors', km:'គ្រូ',            en:'Instructors',   icon:'flag' },
    { id:'fleet',       km:'យានយន្ត',         en:'Fleet',         icon:'car' },
    { id:'progress',    km:'វឌ្ឍនភាព',       en:'Progress',      icon:'chart' },
    { id:'billing',     km:'វិក្កយបត្រ',      en:'Billing',       icon:'cash' },
    { id:'public',      km:'ទំព័រសាធារណៈ',    en:'Public site',   icon:'map' },
    { id:'booking',     km:'ការកក់',          en:'Booking flow',  icon:'book' },
    { id:'mobile',      km:'ទូរស័ព្ទ',        en:'Mobile app',    icon:'phone' },
  ],
  instructor: [
    { id:'dashboard',   km:'ផ្ទាំងគ្រូ',     en:'Today',          icon:'home' },
    { id:'schedule',    km:'កាលវិភាគខ្ញុំ',   en:'My schedule',    icon:'cal' },
    { id:'students',    km:'សិស្សរបស់ខ្ញុំ',  en:'My students',   icon:'users' },
    { id:'fleet',       km:'យានយន្ត',        en:'Vehicles',      icon:'car' },
    { id:'progress',    km:'វឌ្ឍនភាព',      en:'Reports',       icon:'chart' },
    { id:'mobile',      km:'ទូរស័ព្ទ',       en:'Mobile app',    icon:'phone' },
  ],
  student: [
    { id:'dashboard',   km:'ទំព័រដើម',        en:'Home',           icon:'home' },
    { id:'schedule',    km:'មេរៀនរបស់ខ្ញុំ',  en:'My lessons',     icon:'cal' },
    { id:'progress',    km:'វឌ្ឍនភាព',       en:'My progress',    icon:'chart' },
    { id:'billing',     km:'ការទូទាត់',       en:'Payments',       icon:'cash' },
    { id:'booking',     km:'កក់មេរៀន',        en:'Book lesson',    icon:'book' },
    { id:'mobile',      km:'ទូរស័ព្ទ',        en:'Mobile app',     icon:'phone' },
  ],
};

const ROLE_LABELS = {
  admin:      { km:'អ្នកគ្រប់គ្រង', en:'Admin', avatar:'admin' },
  instructor: { km:'គ្រូបង្រៀន',     en:'Instructor · Mr. Vichea', avatar:'inst-1' },
  student:    { km:'សិស្ស',          en:'Student · Sok Chantha', avatar:'port-1' },
};

// ─── Sidebar variant ───
const Sidebar = ({ items, current, onGo, role, onRole }) => (
  <aside style={{
    width:240, background:'var(--surface)', borderRight:'1px solid var(--border)',
    display:'flex', flexDirection:'column', flexShrink:0,
  }}>
    <div style={{padding:'18px 18px 14px',display:'flex',alignItems:'center',gap:10}}>
      <Logo size={28}/>
      <div style={{lineHeight:1.15}}>
        <div style={{fontSize:14,fontWeight:600}}>ផ្លូវ Phlov</div>
        <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.04em'}}>DRIVE ACADEMY</div>
      </div>
    </div>
    <div style={{padding:'0 12px 8px'}}>
      <RoleSwitcher role={role} onRole={onRole} compact />
    </div>
    <Divider/>
    <nav style={{flex:1,padding:'8px 8px',overflow:'auto'}}>
      {items.map(it => (
        <button key={it.id} onClick={() => onGo(it.id)} style={{
          display:'flex',alignItems:'center',gap:10,
          width:'100%',padding:'8px 10px',marginBottom:2,
          border:'none', background: current===it.id ? 'var(--surface-muted)' : 'transparent',
          color: current===it.id ? 'var(--ink)' : 'var(--ink-2)',
          borderRadius:8, cursor:'default',
          fontSize:13, fontWeight: current===it.id ? 500 : 400,
          textAlign:'left',
        }}>
          <Icon name={it.icon} size={16} stroke={current===it.id ? 2 : 1.5}/>
          <span style={{flex:1}}>{it.km}</span>
          <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'var(--font-en)'}}>{it.en.toLowerCase()}</span>
        </button>
      ))}
    </nav>
    <Divider/>
    <div style={{padding:14,display:'flex',alignItems:'center',gap:10}}>
      <Avatar tag="VC" size={32}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:500}}>Ven Chenda</div>
        <div style={{fontSize:11,color:'var(--ink-3)'}}>School director</div>
      </div>
      <Icon name="settings" size={16}/>
    </div>
  </aside>
);

// ─── Topbar variant ───
const Topbar = ({ items, current, onGo, role, onRole }) => (
  <header style={{
    height:64, background:'var(--surface)', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', padding:'0 24px', gap:24, flexShrink:0,
  }}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <Logo size={26}/>
      <div style={{fontSize:15,fontWeight:600}}>ផ្លូវ Phlov</div>
    </div>
    <nav style={{display:'flex',alignItems:'center',gap:2,flex:1,overflow:'auto'}}>
      {items.map(it => (
        <button key={it.id} onClick={() => onGo(it.id)} style={{
          display:'flex',alignItems:'center',gap:6,
          padding:'8px 12px',
          border:'none', background:'transparent',
          color: current===it.id ? 'var(--ink)' : 'var(--ink-3)',
          borderRadius:8, cursor:'default',
          fontSize:13, fontWeight: current===it.id ? 600 : 400,
          borderBottom: current===it.id ? '2px solid var(--accent)' : '2px solid transparent',
          borderRadius:0,
          height:64,
        }}>
          <Icon name={it.icon} size={14}/>
          <span>{it.km}</span>
        </button>
      ))}
    </nav>
    <RoleSwitcher role={role} onRole={onRole}/>
  </header>
);

// ─── Tabs variant ───
const TabsBar = ({ items, current, onGo, role, onRole }) => (
  <div style={{flexShrink:0}}>
    <header style={{
      height:56, background:'var(--surface)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', padding:'0 24px', gap:16,
    }}>
      <Logo size={26}/>
      <div style={{fontSize:15,fontWeight:600}}>ផ្លូវ Phlov Drive Academy</div>
      <div style={{flex:1}}/>
      <RoleSwitcher role={role} onRole={onRole}/>
    </header>
    <div style={{
      background:'var(--surface-muted)', borderBottom:'1px solid var(--border)',
      padding:'8px 24px', display:'flex', gap:6, overflowX:'auto',
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onGo(it.id)} style={{
          display:'inline-flex',alignItems:'center',gap:6,
          padding:'6px 12px',
          border:'1px solid ' + (current===it.id ? 'var(--ink)' : 'var(--border)'),
          background: current===it.id ? 'var(--ink)' : 'var(--surface)',
          color: current===it.id ? 'var(--bg)' : 'var(--ink-2)',
          borderRadius:999, cursor:'default',
          fontSize:12, fontWeight:500, whiteSpace:'nowrap',
        }}>
          <Icon name={it.icon} size={13}/>
          {it.km} · <span style={{opacity:.6,fontFamily:'var(--font-en)'}}>{it.en}</span>
        </button>
      ))}
    </div>
  </div>
);

const RoleSwitcher = ({ role, onRole, compact }) => {
  const roles = ['admin','instructor','student'];
  return (
    <div style={{
      display:'flex',padding:3,
      background:'var(--surface-muted)',
      border:'1px solid var(--border)',
      borderRadius:999,
      ...(compact ? {width:'100%'} : {}),
    }}>
      {roles.map(r => (
        <button key={r} onClick={() => onRole(r)} style={{
          flex: compact ? 1 : 'unset',
          padding: compact ? '5px 6px' : '5px 12px',
          border:'none',
          background: role===r ? 'var(--surface)' : 'transparent',
          color: role===r ? 'var(--ink)' : 'var(--ink-3)',
          borderRadius:999, cursor:'default',
          fontSize: compact ? 10.5 : 11,
          fontWeight: role===r ? 600 : 500,
          boxShadow: role===r ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
          textTransform:'capitalize',
        }}>{r}</button>
      ))}
    </div>
  );
};

const TopActions = ({ role, onRole, hideRole }) => (
  <div style={{display:'flex',alignItems:'center',gap:10}}>
    <div style={{
      display:'flex',alignItems:'center',gap:8,
      padding:'6px 12px',
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:8, width:260,
      color:'var(--ink-3)',
    }}>
      <Icon name="search" size={14}/>
      <span style={{fontSize:12}}>ស្វែងរក · search students, lessons…</span>
      <span style={{
        marginLeft:'auto',fontSize:10,
        fontFamily:'JetBrains Mono, monospace',
        background:'var(--surface-muted)',
        padding:'1px 5px',borderRadius:3,
      }}>⌘K</span>
    </div>
    <Btn kind="ghost" size="sm" icon={<Icon name="bell" size={14}/>}>
      <span style={{
        background:'var(--accent)',color:'#fff',
        fontSize:10,fontWeight:600,
        padding:'1px 6px',borderRadius:999,
      }}>3</span>
    </Btn>
    {!hideRole && <RoleSwitcher role={role} onRole={onRole}/>}
  </div>
);

Object.assign(window, { NAV_ITEMS, ROLE_LABELS, Sidebar, Topbar, TabsBar, RoleSwitcher, TopActions });
