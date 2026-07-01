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

const Card = ({ children, style, pad = 16, label, action }) => {
  const isKhmer = typeof label === 'string' && /[ក-៿]/.test(label);
  return (
  <div style={{
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
  // Tablet-sized screens (700–1100px) use the same layout as phones, so treat
  // them as "mobile". Only ≥1100px gets the desktop sidebar layout.
  const get = () => ({ mobile: window.innerWidth < 1100, tablet: false });
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
