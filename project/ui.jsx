// ui.jsx — shared UI atoms

const Photo = ({ tag, w, h, r = 6, style }) => {
  const isImg = typeof tag === 'string' && (tag.startsWith('data:') || tag.startsWith('http'));
  return isImg ? (
    <div style={{width:w,height:h,borderRadius:r,overflow:'hidden',flexShrink:0,...style}}>
      <img src={tag} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
    </div>
  ) : (
    <div className="ph" style={{ width: w, height: h, borderRadius: r, ...style }}>{tag}</div>
  );
};

// Vehicle profile = a built-in car icon in one of these colours + the plate
// number, instead of an uploaded photo. If a vehicle has no chosen colour yet,
// derive a stable one from its id/plate so each car still looks distinct.
const VEHICLE_COLORS = ['#2A5DB0','#B0413E','#12A302','#7A45C9','#CA8A04','#0E7490','#DB2777','#475569'];
const vehicleColor = (v) => {
  if (v && v.iconColor) return v.iconColor;
  const key = String((v && (v.id || v.plate)) || '');
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return VEHICLE_COLORS[h % VEHICLE_COLORS.length];
};
const VehicleAvatar = ({ v, w, h, r = 6, plate = true, style }) => {
  const color = vehicleColor(v);
  const num = (v && (v.plate || v.number || v.id)) || '';
  const hn = typeof h === 'number' ? h : 40;
  const iconSize = Math.max(14, Math.round(hn * (hn >= 60 ? 0.42 : 0.5)));
  const showNum = plate && num && hn >= 34;
  const fontSize = Math.max(8, Math.min(15, Math.round(hn * 0.17)));
  return (
    <div style={{ width: w, height: h, borderRadius: r, flexShrink: 0, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: showNum ? Math.max(1, Math.round(hn * 0.04)) : 0, overflow: 'hidden',
      background: color + '18', border: '1px solid ' + color + '44', ...style }}>
      <div style={{ color, display: 'flex' }}><Icon name="car" size={iconSize} stroke={1.7}/></div>
      {showNum ? <span style={{ fontSize, fontWeight: 800, lineHeight: 1, color, maxWidth: '100%',
        padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontFamily: '"JetBrains Mono",monospace', letterSpacing: '.02em' }}>{num}</span> : null}
    </div>
  );
};
if (typeof window !== 'undefined') { window.VehicleAvatar = VehicleAvatar; window.VEHICLE_COLORS = VEHICLE_COLORS; window.vehicleColor = vehicleColor; }

const Avatar = ({ tag, size = 36, ring }) => {
  const isImg = typeof tag === 'string' && (tag.startsWith('data:') || tag.startsWith('http'));
  return isImg ? (
    <div style={{width:size,height:size,borderRadius:999,overflow:'hidden',flexShrink:0,
      boxShadow:ring?`0 0 0 2px var(--accent)`:undefined}}>
      <img src={tag} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
    </div>
  ) : (
    <div className="ph" style={{
      width:size,height:size,borderRadius:999,
      fontSize:Math.max(8,size*0.22),
      boxShadow:ring?`0 0 0 2px var(--accent)`:'none',flexShrink:0,
    }}>{tag}</div>
  );
};

// ── Image resize helper ───────────────────────────────────────────────────────
const resizeImageFile = (file, maxW = 400, maxH = 400) => new Promise(resolve => {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// ── Clickable upload: round (people) ────────────────────────────────────────
const UploadAvatar = ({ id, photo, size = 64, ring, onUpload }) => {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const isImg = typeof photo === 'string' && (photo.startsWith('data:') || photo.startsWith('http'));

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    resizeImageFile(file, 400, 400).then(async dataUrl => {
      let out = dataUrl;
      if (window.__sbUploadMedia) { const url = await window.__sbUploadMedia(dataUrl, { folder:'avatars', name:String(id||'') }); if (url) out = url; }
      onUpload && onUpload(id, out);
    });
  };

  return (
    <div style={{position:'relative',display:'inline-block',flexShrink:0,cursor:'pointer'}}
      onClick={() => ref.current?.click()}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {isImg
        ? <div style={{width:size,height:size,borderRadius:999,overflow:'hidden',
            boxShadow:ring?`0 0 0 3px var(--surface)`:undefined}}>
            <img src={photo} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          </div>
        : <div className="ph" style={{width:size,height:size,borderRadius:999,
            fontSize:Math.max(8,size*0.22),
            boxShadow:ring?`0 0 0 3px var(--surface)`:undefined}}>{photo}</div>
      }
      <div style={{
        position:'absolute',inset:0,borderRadius:999,
        background:hover?'rgba(0,0,0,.38)':'transparent',transition:'background .15s',
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        <span style={{fontSize:Math.max(10,size*0.17),opacity:hover?1:0,transition:'opacity .15s'}}>📷</span>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
    </div>
  );
};

// ── Clickable upload: rectangle (vehicles / cards) ────────────────────────────
const UploadPhoto = ({ id, photo, w, h, r = 6, onUpload, maxW = 800, maxH = 500, style }) => {
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const isImg = typeof photo === 'string' && (photo.startsWith('data:') || photo.startsWith('http'));

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    resizeImageFile(file, maxW, maxH).then(async dataUrl => {
      let out = dataUrl;
      if (window.__sbUploadMedia) { const url = await window.__sbUploadMedia(dataUrl, { folder:'photos', name:String(id||'') }); if (url) out = url; }
      onUpload && onUpload(id, out);
    });
  };

  return (
    <div style={{position:'relative',cursor:'pointer',width:w,height:h,flexShrink:0,borderRadius:r,overflow:'hidden',...style}}
      onClick={() => ref.current?.click()}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {isImg
        ? <img src={photo} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
        : <div className="ph" style={{width:'100%',height:'100%',borderRadius:r}}>{photo}</div>
      }
      <div style={{
        position:'absolute',inset:0,background:hover?'rgba(0,0,0,.35)':'transparent',
        transition:'background .15s',display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        <span style={{
          color:'#fff',fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:6,
          background:'rgba(0,0,0,.55)',opacity:hover?1:0,transition:'opacity .15s',
        }}>📷 Upload photo</span>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
    </div>
  );
};

const Card = ({ children, style, pad = 16, label, action, bar }) => {
  const isKhmer = typeof label === 'string' && /[ក-៿]/.test(label);
  // `bar` variant: a full-width navy header bar with white text (like the
  // record-book section bars), for a cleaner, more structured section title.
  if (bar && label) {
    return (
      <div className="anz-card" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', ...style }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
          background:'var(--accent)', color:'#fff', padding:'10px 14px',
          fontSize:14, fontWeight:700, fontFamily:'var(--font-km), sans-serif', letterSpacing:'.01em',
          WebkitPrintColorAdjust:'exact', printColorAdjust:'exact',
        }}>
          <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
          {action}
        </div>
        <div style={{ padding:pad }}>{children}</div>
      </div>
    );
  }
  return (
  <div className="anz-card" style={{
    background:'var(--surface)',
    border:'1px solid var(--border)',
    borderRadius:'var(--radius)',
    padding:pad,
    ...style,
  }}>
    {(label || action) && <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      gap:10, marginBottom:10, minHeight:24,
    }}>
      {label ? <div style={{
        fontSize: isKhmer ? 16 : 10, fontWeight: 700, lineHeight: 1.4,
        fontFamily: isKhmer ? 'var(--font-km), sans-serif' : '"JetBrains Mono", monospace',
        letterSpacing: isKhmer ? 'normal' : '.08em',
        textTransform: isKhmer ? 'none' : 'uppercase',
        color: isKhmer ? 'var(--ink)' : 'var(--ink-3)',
      }}>{label}</div> : <span/>}
      {action}
    </div>}
    {children}
  </div>
  );
};

const Stat = ({ label, value, sub, delta }) => {
  // Khmer text is clipped by the tight mono line-height; give it its own font + leading.
  const isKhmer = typeof label === 'string' && /[ក-៿]/.test(label);
  return (
  <div>
    {label && <div style={{
      fontSize: isKhmer ? 11 : 10, fontWeight: 700, lineHeight: isKhmer ? 1.45 : 1,
      fontFamily: isKhmer ? 'var(--font-km), sans-serif' : '"JetBrains Mono", monospace',
      letterSpacing: isKhmer ? 'normal' : '.08em',
      textTransform: isKhmer ? 'none' : 'uppercase',
      color:'var(--ink-3)', marginBottom:10,
    }}>{label}</div>}
    <div style={{
      display:'flex',alignItems:'baseline',gap:8,
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
};

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
    <button onClick={onClick} className="anz-btn" style={{
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

/* ── Icon បែបរូបរាង (3D) ────────────────────────────────────────────
   វត្ថុមានផ្ទៃ ពន្លឺ និងស្រមោល ជំនួសរូបគូសដោយបន្ទាត់។ ប្រើតែពេល
   size >= 16 — ក្រោមនោះព័ត៌មានលម្អិតប្រែជាស្នាមប្រឡាក់ ដូច្នេះរូប
   បន្ទាត់ដើមច្បាស់ជាង។ លុបប្លុកនេះ = ត្រឡប់ទៅបន្ទាត់វិញ។ */
const SHAPED_ICONS = {"dashboard":"<path d=\"M8 46h48l-4 6H12z\" fill=\"#16233A\" opacity=\".18\"/><rect x=\"9\" y=\"42\" width=\"46\" height=\"6\" rx=\"2\" fill=\"#23538F\"/><rect x=\"9\" y=\"40\" width=\"46\" height=\"4\" rx=\"1.6\" fill=\"#3E7BC4\"/><rect x=\"15\" y=\"26\" width=\"9.5\" height=\"14\" fill=\"#1A4E9E\"/><rect x=\"15\" y=\"24\" width=\"9.5\" height=\"4\" rx=\"1.4\" fill=\"#5C93DC\"/><rect x=\"27.3\" y=\"16\" width=\"9.5\" height=\"24\" fill=\"#164477\"/><rect x=\"27.3\" y=\"14\" width=\"9.5\" height=\"4\" rx=\"1.4\" fill=\"#4E8BE8\"/><rect x=\"39.6\" y=\"30\" width=\"9.5\" height=\"10\" fill=\"#1A4E9E\"/><rect x=\"39.6\" y=\"28\" width=\"9.5\" height=\"4\" rx=\"1.4\" fill=\"#5C93DC\"/><path d=\"M17 12.6 30 20l4.6-2.6\" stroke=\"#E5A93A\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"17\" cy=\"12.6\" r=\"2.6\" fill=\"#F2C24E\"/>","students":"<ellipse cx=\"32\" cy=\"54\" rx=\"21\" ry=\"3.8\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M32 34c7.3 0 13.2 4.6 13.2 10.3V50c0 1.6-1.3 2.6-3 2.6H21.8c-1.7 0-3-1-3-2.6v-5.7C18.8 38.6 24.7 34 32 34z\" fill=\"#1A4E9E\"/><path d=\"M32 34c4 0 7.6 1.4 10 3.6-2.5 2.6-6 4.1-10 4.1s-7.5-1.5-10-4.1C24.4 35.4 28 34 32 34z\" fill=\"#2E6FD0\"/><circle cx=\"32\" cy=\"23.5\" r=\"8.6\" fill=\"#E0A97B\"/><path d=\"M32 14.9c4.8 0 8.6 3.9 8.6 8.6 0 .8-.1 1.5-.3 2.2-1.9-1.4-4.8-2.3-8.3-2.3s-6.4.9-8.3 2.3c-.2-.7-.3-1.4-.3-2.2 0-4.7 3.8-8.6 8.6-8.6z\" fill=\"#3A2A1E\"/><path d=\"M39.6 18v6.6c0 1.2-3.4 2.6-7.6 2.6s-7.6-1.4-7.6-2.6V18l7.6 3z\" fill=\"#0E2747\"/><path d=\"M32 8.4 48.6 15 32 21.6 15.4 15z\" fill=\"#12325C\"/><path d=\"M32 8.4 48.6 15 32 21.6z\" fill=\"#1D4E8F\"/><path d=\"M48.6 15v9.6\" stroke=\"#B08915\" stroke-width=\"1.8\" stroke-linecap=\"round\"/><circle cx=\"48.6\" cy=\"26.4\" r=\"2.6\" fill=\"#E5A93A\"/>","lessons":"<ellipse cx=\"32\" cy=\"52\" rx=\"24\" ry=\"4\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M6 18.5c7.6-2.8 16.8-2.4 26 3.4v25c-9.2-5.8-18.4-6.2-26-3.4z\" fill=\"#0F5D53\"/><path d=\"M58 18.5c-7.6-2.8-16.8-2.4-26 3.4v25c9.2-5.8 18.4-6.2 26-3.4z\" fill=\"#12655A\"/><path d=\"M9 21c6.6-2 14.3-1.3 22 3.6v20.9c-7.7-4.9-15.4-5.6-22-3.6z\" fill=\"#FBFAF6\"/><path d=\"M55 21c-6.6-2-14.3-1.3-22 3.6v20.9c7.7-4.9 15.4-5.6 22-3.6z\" fill=\"#FFFFFF\"/><path d=\"M13 28c4.6-1 9.6-.3 14 2.2M13 34c4.6-1 9.6-.3 14 2.2\" stroke=\"#9AA3AE\" stroke-width=\"1.9\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M51 28c-4.6-1-9.6-.3-14 2.2M51 34c-4.6-1-9.6-.3-14 2.2\" stroke=\"#B4BCC6\" stroke-width=\"1.9\" stroke-linecap=\"round\" fill=\"none\"/><path d=\"M32 21.9v25\" stroke=\"#0A4A42\" stroke-width=\"2.4\"/><path d=\"M41.4 14.6v13.8l-4.2-2.9-4.2 2.9V16.9z\" fill=\"#E5A93A\"/><path d=\"M41.4 14.6v13.8l-4.2-2.9V16.3z\" fill=\"#B08915\"/>","schedule":"<ellipse cx=\"32\" cy=\"55\" rx=\"22\" ry=\"3.6\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M11 17h42a3 3 0 0 1 3 3v29a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V20a3 3 0 0 1 3-3z\" fill=\"#3D2A85\"/><path d=\"M11 17h42a3 3 0 0 1 3 3v6H8v-6a3 3 0 0 1 3-3z\" fill=\"#6B4FCF\"/><path d=\"M8 26h48v22a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z\" fill=\"#FBFAF6\"/><path d=\"M8 26h48v3.4H8z\" fill=\"#E8E4EF\"/><rect x=\"14\" y=\"33\" width=\"9\" height=\"7\" rx=\"1.8\" fill=\"#CFC9E4\"/><rect x=\"27.5\" y=\"33\" width=\"9\" height=\"7\" rx=\"1.8\" fill=\"#CFC9E4\"/><rect x=\"41\" y=\"33\" width=\"9\" height=\"7\" rx=\"1.8\" fill=\"#6B4FCF\"/><rect x=\"14\" y=\"42.5\" width=\"9\" height=\"7\" rx=\"1.8\" fill=\"#CFC9E4\"/><rect x=\"27.5\" y=\"42.5\" width=\"9\" height=\"7\" rx=\"1.8\" fill=\"#E5A93A\"/><rect x=\"41\" y=\"42.5\" width=\"9\" height=\"7\" rx=\"1.8\" fill=\"#CFC9E4\"/><rect x=\"17\" y=\"8.5\" width=\"6\" height=\"12\" rx=\"3\" fill=\"#2A1C60\"/><rect x=\"17\" y=\"8.5\" width=\"6\" height=\"7\" rx=\"3\" fill=\"#8A73E0\"/><rect x=\"41\" y=\"8.5\" width=\"6\" height=\"12\" rx=\"3\" fill=\"#2A1C60\"/><rect x=\"41\" y=\"8.5\" width=\"6\" height=\"7\" rx=\"3\" fill=\"#8A73E0\"/>","instructors":"<ellipse cx=\"32\" cy=\"55\" rx=\"22\" ry=\"3.6\" fill=\"#16181C\" opacity=\".14\"/><circle cx=\"32\" cy=\"33\" r=\"23\" fill=\"#8A5E08\"/><circle cx=\"32\" cy=\"31.4\" r=\"23\" fill=\"#D99A1C\"/><circle cx=\"32\" cy=\"31.4\" r=\"17.2\" fill=\"#F6F4EE\"/><path d=\"M32 24v-9.4M26.3 36.8l-8.6 8.6M37.7 36.8l8.6 8.6\" stroke=\"#C08810\" stroke-width=\"5.6\" stroke-linecap=\"round\"/><path d=\"M32 23.2v-8.6M26.9 36.2l-8 8M37.1 36.2l8 8\" stroke=\"#F2C24E\" stroke-width=\"4\" stroke-linecap=\"round\"/><circle cx=\"32\" cy=\"31.4\" r=\"7.4\" fill=\"#A8720C\"/><circle cx=\"32\" cy=\"30.2\" r=\"7.4\" fill=\"#E5A93A\"/><circle cx=\"32\" cy=\"30.2\" r=\"3.4\" fill=\"#FBEBC4\"/>","vehicles":"<ellipse cx=\"32\" cy=\"53\" rx=\"25\" ry=\"4.2\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M5 43v-6c0-3 1.6-4.6 4.4-5.1l8.2-1.4 5.2-7.6C24.2 20.8 26.1 20 28.4 20h9.9c2.4 0 4.3.9 5.7 2.7l4.6 6.2 6.3 1.3C57.5 30.9 59 32.6 59 35.6V43c0 2.2-1.3 3.4-3.6 3.4H8.6C6.3 46.4 5 45.2 5 43z\" fill=\"#C2532B\"/><path d=\"M5 37.6c0-3 1.6-4.6 4.4-5.1l8.2-1.4 5.2-7.6C24.2 20.8 26.1 20 28.4 20h9.9c2.4 0 4.3.9 5.7 2.7l4.6 6.2 6.3 1.3C57.5 30.9 59 32.6 59 35.6z\" fill=\"#E8784E\"/><path d=\"M26.2 24.4h4.9v6.6l-12.6 1z\" fill=\"#2E3D4F\"/><path d=\"M33.8 24.4h4.3c1.3 0 2.2.4 3 1.4l3.9 5.2-11.2.9z\" fill=\"#3D5066\"/><path d=\"M26.2 24.4h4.9v2.2l-6.6.7z\" fill=\"#5E7590\" opacity=\".55\"/><path d=\"M9 33.6l7.6-1.2-.5 2.6-7.1.7z\" fill=\"#FFFFFF\" opacity=\".28\"/><rect x=\"6.4\" y=\"37.2\" width=\"6\" height=\"3.2\" rx=\"1.6\" fill=\"#F6EDD2\"/><rect x=\"51.6\" y=\"37.2\" width=\"6\" height=\"3.2\" rx=\"1.6\" fill=\"#9B3630\"/><circle cx=\"18.5\" cy=\"46\" r=\"7.4\" fill=\"#1F2630\"/><circle cx=\"18.5\" cy=\"46\" r=\"3.3\" fill=\"#B9C0CA\"/><circle cx=\"45.5\" cy=\"46\" r=\"7.4\" fill=\"#1F2630\"/><circle cx=\"45.5\" cy=\"46\" r=\"3.3\" fill=\"#B9C0CA\"/>","invoices":"<ellipse cx=\"32\" cy=\"53\" rx=\"24\" ry=\"4\" fill=\"#16181C\" opacity=\".14\"/><rect x=\"7\" y=\"34\" width=\"50\" height=\"14\" rx=\"3\" fill=\"#175636\"/><rect x=\"7\" y=\"31\" width=\"50\" height=\"14\" rx=\"3\" fill=\"#1E6B41\"/><rect x=\"7\" y=\"28\" width=\"50\" height=\"14\" rx=\"3\" fill=\"#25804E\"/><rect x=\"7\" y=\"16\" width=\"50\" height=\"16\" rx=\"3\" fill=\"#43AE72\"/><rect x=\"11\" y=\"19.4\" width=\"42\" height=\"9.2\" rx=\"1.6\" fill=\"#5FC08A\" opacity=\".55\"/><circle cx=\"32\" cy=\"24\" r=\"6\" fill=\"#F6EDD2\"/><path d=\"M32 20.6v6.8M30 22.2h3.4a1.7 1.7 0 0 1 0 3.4H30\" stroke=\"#A8720C\" stroke-width=\"1.7\" stroke-linecap=\"round\" fill=\"none\"/>","settings":"<ellipse cx=\"32\" cy=\"54\" rx=\"21\" ry=\"3.6\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M32 9.5l5.4 2.1 5.5-1.5 3.1 4.8 5.3 2.3-.7 5.7 3.4 4.6-3.4 4.6.7 5.7-5.3 2.3-3.1 4.8-5.5-1.5L32 45.5l-5.4-2.1-5.5 1.5-3.1-4.8-5.3-2.3.7-5.7L10 27.5l3.4-4.6-.7-5.7 5.3-2.3 3.1-4.8 5.5 1.5z\" fill=\"#3D4859\"/><path d=\"M32 7.9l5.4 2.1 5.5-1.5 3.1 4.8 5.3 2.3-.7 5.7 3.4 4.6-3.4 4.6.7 5.7-5.3 2.3-3.1 4.8-5.5-1.5L32 43.9l-5.4-2.1-5.5 1.5-3.1-4.8-5.3-2.3.7-5.7L10 25.9l3.4-4.6-.7-5.7 5.3-2.3 3.1-4.8 5.5 1.5z\" fill=\"#7B8AA3\"/><circle cx=\"32\" cy=\"25.9\" r=\"10.4\" fill=\"#4A566B\"/><circle cx=\"32\" cy=\"24.9\" r=\"10.4\" fill=\"#F6F4EE\"/><circle cx=\"32\" cy=\"24.9\" r=\"5.6\" fill=\"#8E9BB0\"/><path d=\"M23.5 18.6a10.4 10.4 0 0 1 14.6-1.9\" stroke=\"#FFFFFF\" stroke-width=\"2.4\" stroke-linecap=\"round\" fill=\"none\" opacity=\".75\"/>","bell":"<ellipse cx=\"32\" cy=\"54\" rx=\"17\" ry=\"3.2\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M32 11c8.6 0 14.4 6.2 14.4 14.6 0 7.8 1.6 11 3.6 13.4 1 1.2.2 3-1.4 3H15.4c-1.6 0-2.4-1.8-1.4-3 2-2.4 3.6-5.6 3.6-13.4C17.6 17.2 23.4 11 32 11z\" fill=\"#A8720C\"/><path d=\"M32 11c8.6 0 14.4 6.2 14.4 14.6 0 4.6.6 7.8 1.5 10.2H16.1c.9-2.4 1.5-5.6 1.5-10.2C17.6 17.2 23.4 11 32 11z\" fill=\"#E5A93A\"/><path d=\"M24.6 17.6c1.8-2.3 4.4-3.7 7.4-3.9\" stroke=\"#FBEBC4\" stroke-width=\"2.6\" stroke-linecap=\"round\" fill=\"none\" opacity=\".8\"/><rect x=\"13\" y=\"36\" width=\"38\" height=\"5.4\" rx=\"2.7\" fill=\"#8A5E08\"/><rect x=\"13\" y=\"35\" width=\"38\" height=\"4.4\" rx=\"2.2\" fill=\"#D99A1C\"/><circle cx=\"32\" cy=\"8.6\" r=\"3.4\" fill=\"#C08810\"/><circle cx=\"32\" cy=\"7.8\" r=\"3.4\" fill=\"#F2C24E\"/><path d=\"M27.4 43.6h9.2a4.6 4.6 0 0 1-9.2 0z\" fill=\"#8A5E08\"/>","shield":"<path d=\"M32 7.4 51 13.6v13.2c0 11.4-7.6 21.6-19 25.2-11.4-3.6-19-13.8-19-25.2V13.6z\" fill=\"#8A5E08\"/><path d=\"M32 6 51 12.2v13.2c0 11.4-7.6 21.6-19 25.2-11.4-3.6-19-13.8-19-25.2V12.2z\" fill=\"#E5A93A\"/><path d=\"M32 6 51 12.2v13.2c0 11.4-7.6 21.6-19 25.2z\" fill=\"#C08810\"/><path d=\"M22.8 28.4 29.4 35l12-12.6\" stroke=\"#FFFFFF\" stroke-width=\"4.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>","cap":"<ellipse cx=\"32\" cy=\"54\" rx=\"21\" ry=\"3.8\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M32 34c7.3 0 13.2 4.6 13.2 10.3V50c0 1.6-1.3 2.6-3 2.6H21.8c-1.7 0-3-1-3-2.6v-5.7C18.8 38.6 24.7 34 32 34z\" fill=\"#8A5E08\"/><path d=\"M32 34c4 0 7.6 1.4 10 3.6-2.5 2.6-6 4.1-10 4.1s-7.5-1.5-10-4.1C24.4 35.4 28 34 32 34z\" fill=\"#D99A1C\"/><path d=\"M29 35.4h6l-3 9.2z\" fill=\"#F6EDD2\"/><circle cx=\"32\" cy=\"24.6\" r=\"8.6\" fill=\"#E0A97B\"/><path d=\"M21.6 20.4h20.8c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8H21.6c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8z\" fill=\"#0E2747\"/><path d=\"M32 9.6c6 0 10.4 3.8 10.4 9v1.8H21.6v-1.8c0-5.2 4.4-9 10.4-9z\" fill=\"#12325C\"/><path d=\"M32 9.6c3 0 5.6 1 7.4 2.6-2 1.4-4.6 2.2-7.4 2.2s-5.4-.8-7.4-2.2C26.4 10.6 29 9.6 32 9.6z\" fill=\"#1D4E8F\"/><circle cx=\"32\" cy=\"16.6\" r=\"2.8\" fill=\"#E5A93A\"/>","sheet":"<ellipse cx=\"32\" cy=\"54\" rx=\"21\" ry=\"3.4\" fill=\"#16181C\" opacity=\".14\"/><rect x=\"13\" y=\"12\" width=\"38\" height=\"40\" rx=\"3\" fill=\"#C9C2AE\"/><rect x=\"10\" y=\"9\" width=\"38\" height=\"40\" rx=\"3\" fill=\"#FBFAF6\"/><path d=\"M10 12a3 3 0 0 1 3-3h32a3 3 0 0 1 3 3v6H10z\" fill=\"#2BA795\"/><rect x=\"14\" y=\"22\" width=\"12\" height=\"5\" rx=\"1.4\" fill=\"#D8E4E2\"/><rect x=\"29\" y=\"22\" width=\"15\" height=\"5\" rx=\"1.4\" fill=\"#D8E4E2\"/><rect x=\"14\" y=\"30\" width=\"12\" height=\"5\" rx=\"1.4\" fill=\"#D8E4E2\"/><rect x=\"29\" y=\"30\" width=\"15\" height=\"5\" rx=\"1.4\" fill=\"#E5A93A\"/><rect x=\"14\" y=\"38\" width=\"12\" height=\"5\" rx=\"1.4\" fill=\"#D8E4E2\"/><rect x=\"29\" y=\"38\" width=\"15\" height=\"5\" rx=\"1.4\" fill=\"#D8E4E2\"/>","box":"<ellipse cx=\"32\" cy=\"55\" rx=\"22\" ry=\"3.4\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M32 20 8 26v20l24 7 24-7V26z\" fill=\"#A8723C\"/><path d=\"M32 20v33l24-7V26z\" fill=\"#8A5C2C\"/><path d=\"M32 9 8 16l24 7 24-7z\" fill=\"#E0B87C\"/><path d=\"M32 16 8 16v10l24 6z\" fill=\"#C08A4E\"/><path d=\"M26 11.4 50 18.4v5.2l-24-7z\" fill=\"#F2E0C0\" opacity=\".7\"/><path d=\"M26 17.6v5.4L38 26.6v-5.4z\" fill=\"#F2E0C0\" opacity=\".5\"/>","briefcase":"<ellipse cx=\"32\" cy=\"53\" rx=\"23\" ry=\"3.6\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M25 13h14a3 3 0 0 1 3 3v5h-4.4v-3.6H26.4V21H22v-5a3 3 0 0 1 3-3z\" fill=\"#5E4A2A\"/><rect x=\"7\" y=\"20\" width=\"50\" height=\"28\" rx=\"4\" fill=\"#8A5E08\"/><rect x=\"7\" y=\"20\" width=\"50\" height=\"13\" rx=\"4\" fill=\"#C08810\"/><rect x=\"7\" y=\"31\" width=\"50\" height=\"4\" fill=\"#6E4A06\"/><rect x=\"26\" y=\"29\" width=\"12\" height=\"8\" rx=\"2\" fill=\"#E5A93A\"/><rect x=\"29.4\" y=\"31.6\" width=\"5.2\" height=\"2.8\" rx=\"1.4\" fill=\"#8A5E08\"/>","megaphone":"<ellipse cx=\"32\" cy=\"54\" rx=\"20\" ry=\"3.4\" fill=\"#16181C\" opacity=\".14\"/><path d=\"M12 24h8l22-10v30L20 34h-8a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z\" fill=\"#C2532B\"/><path d=\"M20 24 42 14v13H20z\" fill=\"#E8784E\"/><path d=\"M12 24h8v4h-8a4 4 0 0 1-3.6-2.2A4 4 0 0 1 12 24z\" fill=\"#E8784E\" opacity=\".5\"/><rect x=\"18\" y=\"34\" width=\"7\" height=\"14\" rx=\"2.4\" fill=\"#3D4859\"/><rect x=\"18\" y=\"34\" width=\"7\" height=\"5\" rx=\"2.4\" fill=\"#7B8AA3\"/><path d=\"M48 20.6a12 12 0 0 1 0 16.8M52.6 15.4a19 19 0 0 1 0 27.2\" stroke=\"#E5A93A\" stroke-width=\"3.4\" stroke-linecap=\"round\" fill=\"none\"/>","clipboard":"<ellipse cx=\"32\" cy=\"55\" rx=\"20\" ry=\"3.4\" fill=\"#16181C\" opacity=\".14\"/><rect x=\"12\" y=\"11\" width=\"40\" height=\"41\" rx=\"4\" fill=\"#3D4859\"/><rect x=\"12\" y=\"11\" width=\"40\" height=\"6\" rx=\"4\" fill=\"#7B8AA3\"/><rect x=\"17\" y=\"18\" width=\"30\" height=\"29\" rx=\"2\" fill=\"#FBFAF6\"/><rect x=\"25\" y=\"7\" width=\"14\" height=\"8\" rx=\"2.6\" fill=\"#8E9BB0\"/><rect x=\"25\" y=\"7\" width=\"14\" height=\"4\" rx=\"2\" fill=\"#C3CBD6\"/><path d=\"M21.6 32.4 27 37.8l14-14\" stroke=\"#2F6B4A\" stroke-width=\"4.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>"};
const SHAPED_ALIAS = {"home":"dashboard","chart":"dashboard","trend":"dashboard","users":"students","book":"lessons","cal":"schedule","cap":"cap","flag":"instructors","wheel":"instructors","car":"vehicles","cash":"invoices","wallet":"invoices","receipt":"invoices","sheet":"sheet","box":"box","briefcase":"briefcase","megaphone":"megaphone","clipboard":"clipboard","bell":"bell","settings":"settings"};

const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const paths = {
    home: 'M3 11l9-8 9 8M5 9.5V21h14V9.5',
    users:'M3 20c1-4 4-6 7-6s6 2 7 6M10 8a4 4 0 108 0 4 4 0 00-8 0',
    cal:  'M4 6h16v15H4zM4 10h16M9 3v4M15 3v4',
    car:  'M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1L2 11v5h2M4 16.5a2.5 2.5 0 105 0a2.5 2.5 0 10-5 0M14 16.5a2.5 2.5 0 105 0a2.5 2.5 0 10-5 0',
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
    trash:'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
    download:'M12 3v13M7 12l5 5 5-5M3 21h18',
    file:'M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8zM14 3l6 5h-6z',
    mail:'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM2 6l10 7 10-7',
    globe:'M12 3a9 9 0 100 18A9 9 0 0012 3zM3 12h18M12 3a12 12 0 010 18M12 3a12 12 0 000 18',
    eye:'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    x:'M6 6l12 12M6 18L18 6',
    edit:'M12 20h9 M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z',
    filter:'M4 6h16M7 12h10M10 18h4',
    box:'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
    tag:'M20 12l-8 8-9-9V4h7l10 8zM7.5 7.5h.01',
    // distinct, modern nav icons
    grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    cap:'M12 4 2 9l10 5 10-5-10-5ZM6 11.5V16c0 1 2.7 2 6 2s6-1 6-2v-4.5M20 10v5',
    wheel:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 9a3 3 0 100 6 3 3 0 000-6M12 3v6M6.5 17.5 10 14M17.5 17.5 14 14',
    trend:'M3 17l6-6 4 4 8-8M15 7h6v6',
    wallet:'M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H4a1 1 0 01-1-1V7ZM3 7V6a2 2 0 012-2h11v3M16.5 13h1',
    briefcase:'M4 8h16v12H4zM9 8V5a1 1 0 011-1h4a1 1 0 011 1v3M4 13h16',
    megaphone:'M3 10v4h4l9 5V5L7 10H3ZM18 9a4 4 0 010 6',
    clipboard:'M9 4h6v3H9zM8 5H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1h-2M9 12h6M9 16h4',
    receipt:'M6 2h12v20l-3-2-3 2-3-2-3 2V2ZM9 7h6M9 11h6M9 15h4',
    sheet:'M4 4h16v16H4zM4 9h16M4 14h16M9.5 4v16M14.5 4v16',
  };
  const shapedKey = SHAPED_ALIAS[name];
  if (shapedKey && size >= 16 && SHAPED_ICONS[shapedKey]) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64"
        style={{flexShrink:0, display:'block'}}
        dangerouslySetInnerHTML={{__html: SHAPED_ICONS[shapedKey]}} />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      <path d={paths[name] || paths.chev} />
    </svg>
  );
};

// Shared CSV download — opens cleanly in Google Sheets / Excel.
// cols: [ [header, rowFn], … ]; rows: array of records. UTF-8 BOM keeps Khmer
// readable; values are RFC-4180 quoted. Returns true on success.
const exportCSV = (filename, cols, rows) => {
  const esc = v => { const t = (v == null ? '' : String(v)); return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const lines = [cols.map(c => esc(c[0])).join(',')];
  (rows || []).forEach(r => lines.push(cols.map(c => esc(c[1](r))).join(',')));
  const csv = String.fromCharCode(0xFEFF) + lines.join('\r\n');
  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  } catch (e) { return false; }
};

// pinwheel mark — original brand mark (windmill / road junction abstract)
const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    {/* navy shield — matches the Anzen logo */}
    <path d="M16 2.5 L27.5 6.5 V15 C27.5 23 22 27.5 16 29.5 C10 27.5 4.5 23 4.5 15 V6.5 Z"
      fill="var(--accent)"/>
    {/* gold crossing roads */}
    <path d="M9 21.5 Q15 11 23.5 9.5" fill="none" stroke="var(--gold)" strokeWidth="2.7" strokeLinecap="round"/>
    <path d="M12.5 22 L19 10" fill="none" stroke="var(--gold)" strokeWidth="2.7" strokeLinecap="round"/>
  </svg>
);

const SectionTitle = ({ km, en, action }) => {
  const lang = (typeof window !== 'undefined' && window.__anzenLang) || 'km';
  // primary line in active language; secondary line in the other language
  const primary = lang === 'km' ? km : en;
  return (
  <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:14}}>
    <div>
      <div style={{fontSize:22,fontWeight:700,letterSpacing:'-.01em',fontFamily:'var(--font-display)'}}>{primary}</div>
    </div>
    {action}
  </div>
  );
};

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

// ── Date utilities ─────────────────────────────────────────────────────────
const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayStr = () => localDateStr();

// Return array of 7 YYYY-MM-DD strings starting Monday of (today + weekOffset weeks)
const getWeekDates = (offset = 0) => {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=Mon
  const mon = new Date(today);
  mon.setDate(today.getDate() - dow + offset * 7);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return localDateStr(d);
  });
};

// Short label: "21 ឧសភា · ព្រហ" or "May 21 · Thu"
const KM_MONTHS = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatDateShort = (iso, lang) => {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDate();
  const month = lang === 'km' ? KM_MONTHS[d.getMonth()] : EN_MONTHS[d.getMonth()];
  const wd = lang === 'km' ? DAYS_KM[(d.getDay()+6)%7] : DAYS_EN[(d.getDay()+6)%7];
  return lang === 'km' ? `${day} ${month} · ${wd}` : `${month} ${day} · ${wd}`;
};

// Computed hours logged by a student from done lessons
const studentHours = (studentId) =>
  LESSONS.filter(l => l.studentId === studentId && l.status === 'done').reduce((s,l) => s + (l.len||1), 0);

// Next upcoming lesson for a student
const nextLesson = (studentId) => {
  const today = todayStr();
  return LESSONS
    .filter(l => l.studentId === studentId && l.date >= today && l.status === 'scheduled')
    .sort((a,b) => a.date.localeCompare(b.date) || a.h - b.h)[0] || null;
};

// Permission check — Admin: all; Instructor: edit students/instructors/lessons;
// Student: view own data + book lessons only.
const can = (role, action, target) => {
  if (role === 'admin' || role === 'instructor') return true;
  if (role === 'student') {
    if (action === 'view')   return ['self','student'].includes(target);
    if (action === 'create') return target === 'booking';
    return false;
  }
  return false;
};

// ── Responsive breakpoint hook ────────────────────────────────────────────
const useBreakpoint = () => {
  // Tablet is a primary device here, so 700–1100px gets its own layout: a
  // labelled, collapsible sidebar plus the search topbar. Below 700px is the
  // phone layout; ≥1100px is desktop.
  const get = () => ({
    mobile: window.innerWidth < 700,
    tablet: window.innerWidth >= 700 && window.innerWidth < 1100,
  });
  const [bp, setBp] = React.useState(get);
  React.useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return bp;
};

// ── Global "back" stack + edge-swipe gesture (native-app feel) ─────────────
if (typeof window !== 'undefined' && !window.__backStack) window.__backStack = [];

// Register a back handler while `active`. Edge-swipe (or runAppBack) calls the
// most-recently-registered one, so nested overlays close in order.
const useBackHandler = (active, fn) => {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => {
    if (!active) return;
    const entry = { run: () => { try { ref.current && ref.current(); } catch (e) {} } };
    window.__backStack.push(entry);
    return () => {
      const i = window.__backStack.indexOf(entry);
      if (i !== -1) window.__backStack.splice(i, 1);
    };
  }, [active]);
};

const runAppBack = () => {
  const s = window.__backStack || [];
  if (s.length) { s[s.length - 1].run(); return true; }
  return false;
};

// Install the global edge-swipe detector once (call in the App root).
// Swipe right from the LEFT edge OR left from the RIGHT edge → back.
const useEdgeSwipeBack = () => {
  React.useEffect(() => {
    let sx = null, sy = null, t = 0, fromRight = false;
    const onStart = (e) => {
      if (e.touches.length !== 1) { sx = null; return; }
      const x = e.touches[0].clientX, w = window.innerWidth;
      if (x <= 28)        { sx = x; fromRight = false; }
      else if (x >= w-28) { sx = x; fromRight = true;  }
      else { sx = null; return; }
      sy = e.touches[0].clientY; t = Date.now();
    };
    const onEnd = (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = Math.abs(e.changedTouches[0].clientY - sy);
      const dt = Date.now() - t; sx = null;
      if (dy < 55 && dt < 600 && ((!fromRight && dx > 70) || (fromRight && dx < -70))) runAppBack();
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, []);
};

// ── Auto-backup via File System Access API (Chrome/Edge) ──────────────────
const _abOpenDB = () => new Promise((res, rej) => {
  const r = indexedDB.open('anzen_ab', 1);
  r.onupgradeneeded = e => e.target.result.createObjectStore('h');
  r.onsuccess = e => res(e.target.result);
  r.onerror = () => rej(r.error);
});

const abGetHandle = async () => {
  try {
    const db = await _abOpenDB();
    return await new Promise((res, rej) => {
      const t = db.transaction('h', 'readonly');
      const r = t.objectStore('h').get('dir');
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  } catch { return null; }
};

const abSetHandle = async (handle) => {
  try {
    const db = await _abOpenDB();
    await new Promise((res, rej) => {
      const t = db.transaction('h', 'readwrite');
      const r = handle ? t.objectStore('h').put(handle, 'dir') : t.objectStore('h').delete('dir');
      t.oncomplete = res;
      t.onerror = () => rej(t.error);
    });
  } catch {}
};

window.__autoBackup = async () => {
  try {
    const handle = await abGetHandle();
    if (!handle) return;
    let perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') return;
    const raw = localStorage.getItem('anzen_v1');
    if (!raw) return;
    const fh = await handle.getFileHandle('anzen-backup.json', { create: true });
    const w = await fh.createWritable();
    await w.write(raw);
    await w.close();
    window.__lastAutoBackup = new Date();
  } catch {}
};

// Round black floating "+" button — bottom-right, just above the mobile footer.
const MobileFab = ({ onClick, label }) => (
  <button onClick={onClick} aria-label={label} title={label} style={{
    position:'fixed', right:18,
    bottom:'calc(72px + env(safe-area-inset-bottom,0px))',
    width:56, height:56, borderRadius:'50%',
    background:'var(--ink)', color:'#fff', border:'none', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 6px 18px rgba(0,0,0,.32)', zIndex:90,
  }}>
    <Icon name="plus" size={26} stroke={2.6}/>
  </button>
);

Object.assign(window, { Photo, Avatar, UploadAvatar, UploadPhoto, resizeImageFile, Card, Stat, Badge, Btn, Icon, Logo, SectionTitle, Divider, BarRow, Spark, studentById, instById, vehById, can, todayStr, localDateStr, getWeekDates, formatDateShort, studentHours, nextLesson, KM_MONTHS, EN_MONTHS, abGetHandle, abSetHandle, useBreakpoint, MobileFab });
