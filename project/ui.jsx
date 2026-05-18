// ui.jsx — shared UI atoms

const Photo = ({ tag, w, h, r = 6, style }) => (
  <div className="ph" style={{ width: w, height: h, borderRadius: r, ...style }}>
    {tag}
  </div>
);

const Avatar = ({ tag, size = 36, ring }) => (
  <div className="ph" style={{
    width: size, height: size, borderRadius: 999,
    fontSize: Math.max(8, size*0.22),
    boxShadow: ring ? `0 0 0 2px var(--accent)` : 'none',
    flexShrink:0,
  }}>{tag}</div>
);

const Card = ({ children, style, pad = 16, label }) => (
  <div style={{
    background:'var(--surface)',
    border:'1px solid var(--border)',
    borderRadius:'var(--radius)',
    padding:pad,
    ...style,
  }}>
    {label && <div style={{
      font:'500 10px/1 "JetBrains Mono", monospace',
      letterSpacing:'.08em', textTransform:'uppercase',
      color:'var(--ink-3)', marginBottom:10,
    }}>{label}</div>}
    {children}
  </div>
);

const Stat = ({ label, value, sub, delta }) => (
  <div>
    <div style={{
      font:'500 10px/1 "JetBrains Mono", monospace',
      letterSpacing:'.08em', textTransform:'uppercase',
      color:'var(--ink-3)',
    }}>{label}</div>
    <div style={{
      display:'flex',alignItems:'baseline',gap:8,marginTop:8,
    }}>
      <div style={{
        fontSize:32, fontWeight:600, letterSpacing:'-.02em',
        fontFamily:'var(--font-display)',
      }}>{value}</div>
      {delta && <div style={{
        fontSize:12, color: delta.startsWith('+') ? 'var(--good)' : 'var(--danger)',
        fontVariantNumeric:'tabular-nums',
      }}>{delta}</div>}
    </div>
    {sub && <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>{sub}</div>}
  </div>
);

const Badge = ({ children, tone = 'neutral', size='sm' }) => {
  const tones = {
    neutral: { bg:'var(--surface-muted)', fg:'var(--ink-2)', bd:'var(--border)' },
    accent:  { bg:'var(--accent-soft)', fg:'var(--accent)', bd:'transparent' },
    good:    { bg:'#E5F0EA', fg:'var(--good)', bd:'transparent' },
    warn:    { bg:'#F6E9DC', fg:'var(--warn)', bd:'transparent' },
    danger:  { bg:'#F4DEDD', fg:'var(--danger)', bd:'transparent' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:4,
      padding: size==='sm' ? '2px 8px' : '4px 10px',
      borderRadius:999,
      background:t.bg, color:t.fg, border:`1px solid ${t.bd}`,
      fontSize: size==='sm' ? 11 : 12,
      fontWeight:500,
      whiteSpace:'nowrap',
    }}>{children}</span>
  );
};

const Btn = ({ children, kind = 'ghost', size = 'md', icon, onClick, style }) => {
  const sizes = {
    sm: { h:28, px:10, fs:12 },
    md: { h:34, px:14, fs:13 },
    lg: { h:42, px:18, fs:14 },
  }[size];
  const kinds = {
    primary: { bg:'var(--ink)', fg:'var(--bg)', bd:'var(--ink)' },
    accent:  { bg:'var(--accent)', fg:'#fff', bd:'var(--accent)' },
    ghost:   { bg:'transparent', fg:'var(--ink)', bd:'var(--border-strong)' },
    soft:    { bg:'var(--surface-muted)', fg:'var(--ink)', bd:'transparent' },
  };
  const k = kinds[kind];
  return (
    <button onClick={onClick} style={{
      display:'inline-flex',alignItems:'center',gap:6,
      height:sizes.h, padding:`0 ${sizes.px}px`,
      borderRadius:8, border:`1px solid ${k.bd}`,
      background:k.bg, color:k.fg,
      fontSize:sizes.fs, fontWeight:500,
      cursor:'default', whiteSpace:'nowrap',
      ...style,
    }}>{icon}{children}</button>
  );
};

const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const paths = {
    home: 'M3 11l9-8 9 8M5 9.5V21h14V9.5',
    users:'M3 20c1-4 4-6 7-6s6 2 7 6M10 8a4 4 0 108 0 4 4 0 00-8 0',
    cal:  'M4 6h16v15H4zM4 10h16M9 3v4M15 3v4',
    car:  'M3 16h18l-2-7H5l-2 7zM6 16v2M18 16v2M7 12h10',
    chart:'M4 20V8M10 20V4M16 20v-6M22 20H2',
    cash: 'M3 7h18v10H3zM12 9a3 3 0 100 6 3 3 0 000-6zM6 9v6M18 9v6',
    star: 'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    book: 'M4 4h7v16H4zM13 4h7v16h-7z',
    phone:'M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2',
    chev: 'M9 6l6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    bell: 'M6 17h12l-2-3v-4a4 4 0 10-8 0v4l-2 3M10 21h4',
    search:'M11 5a6 6 0 100 12 6 6 0 000-12zM15 15l5 5',
    settings:'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2L5 5.8 3 9.3l2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z',
    check:'M5 12l5 5L20 7',
    arrow:'M5 12h14M13 5l7 7-7 7',
    map:'M9 21l-6-3V5l6 3 6-3 6 3v13l-6-3-6 3zM9 8v13M15 5v13',
    flag:'M5 21V4h14l-3 5 3 5H5',
    wrench:'M14 6a4 4 0 005 5l-9 9-4-4 8-8-5-5a4 4 0 005 3z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={paths[name] || paths.chev} />
    </svg>
  );
};

// pinwheel mark — original brand mark (windmill / road junction abstract)
const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <g transform="translate(16,16)">
      <path d="M0 0 L0 -13 A8 8 0 0 1 7 -7 Z"  fill="var(--accent)" opacity=".95"/>
      <path d="M0 0 L13 0 A8 8 0 0 1 7 7 Z"   fill="var(--accent)" opacity=".75"/>
      <path d="M0 0 L0 13 A8 8 0 0 1 -7 7 Z"  fill="var(--accent)" opacity=".55"/>
      <path d="M0 0 L-13 0 A8 8 0 0 1 -7 -7 Z" fill="var(--accent)" opacity=".35"/>
      <circle r="2" fill="var(--ink)" />
    </g>
  </svg>
);

const SectionTitle = ({ km, en, action }) => (
  <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
    <div>
      <div style={{fontSize:22,fontWeight:600,letterSpacing:'-.01em',fontFamily:'var(--font-display)'}}>{km}</div>
      <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{en}</div>
    </div>
    {action}
  </div>
);

const Divider = ({ v }) => (
  <div style={v ? {width:1,alignSelf:'stretch',background:'var(--border)'} : {height:1,background:'var(--border)'}}/>
);

// horizontal bar chart row
const BarRow = ({ label, value, max, sub }) => (
  <div style={{display:'flex',alignItems:'center',gap:12,padding:'6px 0'}}>
    <div style={{width:120,fontSize:12,color:'var(--ink-2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
    <div style={{flex:1,height:8,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
      <div style={{width:`${(value/max)*100}%`,height:'100%',background:'var(--accent)',borderRadius:999}}/>
    </div>
    <div style={{width:60,fontSize:12,color:'var(--ink-3)',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{sub || value}</div>
  </div>
);

// sparkline
const Spark = ({ data, w = 100, h = 28, color = 'var(--accent)' }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/span)*h}`).join(' ');
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const studentById = (id) => STUDENTS.find(s => s.id === id);
const instById    = (id) => INSTRUCTORS.find(i => i.id === id);
const vehById     = (id) => VEHICLES.find(v => v.id === id);

Object.assign(window, { Photo, Avatar, Card, Stat, Badge, Btn, Icon, Logo, SectionTitle, Divider, BarRow, Spark, studentById, instById, vehById });
