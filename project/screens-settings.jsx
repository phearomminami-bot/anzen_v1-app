// screens-settings.jsx — System settings / control panel

// ── Global school settings store ──────────────────────────────────────────
if (!window.__schoolSettings) {
  window.__schoolSettings = window.__savedSettings || {
    name: 'Anzen',
    nameEn: 'Anzen',
    license: 'MOPWT-001-202-014',
    taxId: 'K001-202-014',
    established: '2014',
    director: 'Ven Chenda',
    phone: '+855 12 345 678',
    email: 'hello@anzen.drive',
    website: 'anzen.drive',
    facebook: 'facebook.com/anzen.drive',
    address: '123 St. Sothearos, Daun Penh, Phnom Penh 12000',
    logo: null,
    vat: '10',
    currency: 'USD ($)',
    pricing: [
      {id:1, n:'Standard',   km:'ស្តង់ដារ',    cls:'B', hrs:30, price:180, inc:'30h training · road exam'},
      {id:2, n:'Intensive',  km:'បន្ថែម',      cls:'B', hrs:40, price:240, inc:'40h + extra mock tests'},
      {id:3, n:'Motorcycle', km:'ម៉ូតូ',        cls:'A', hrs:18, price:110, inc:'18h training · road exam'},
      {id:4, n:'Truck',      km:'ឡានដឹក',     cls:'C', hrs:40, price:320, inc:'40h training · road exam'},
      {id:5, n:'Extra hour', km:'ម៉ោងបន្ថែម',  cls:'+', hrs:1,  price:20,  inc:'Per-hour rate · billed separately'},
    ],
    price_AT: 200,
    price_MT: 230,
    addons: [
      {id:1, km:'ការប្រឡងផ្លូវ',  en:'Road exam fee',         price:25},
      {id:2, km:'មេរៀន​បន្ថែម',    en:'Extra lesson (1h)',      price:18},
      {id:3, km:'ការ​ប្រឡង​សាក​', en:'Mock test pack (×5)',    price:30},
      {id:4, km:'ឯកសារ​ប័ណ្ណ​បើកបរ',    en:'Permit paperwork',       price:15},
      {id:5, km:'សៀវភៅ​សិក្សា',   en:'Study handbook (KH/EN)', price:8},
    ],
    studentForm: {
      shifts: ['ព្រឹក', 'ថ្ងៃ​ត្រង់', 'រសៀល', 'យប់'],
      days:   ['ចន្ទ-សុក្រ', 'សៅរ៍-អាទិត្យ'],
    },
    payments: {aba:true, wing:true, cash:true, bank:true, pipay:false, card:false},
    notifs: [true, true, true, true, true, true],
    hours: [
      {open:true,  start:'07:00', end:'18:00'},
      {open:true,  start:'07:00', end:'18:00'},
      {open:true,  start:'07:00', end:'18:00'},
      {open:true,  start:'07:00', end:'18:00'},
      {open:true,  start:'07:00', end:'18:00'},
      {open:true,  start:'07:00', end:'14:00'},
      {open:false, start:'07:00', end:'18:00'},
    ],
    instructorRoles: [
      {km:'គ្រូជាន់ខ្ពស់',  en:'Senior Instructor'},
      {km:'មេបង្រៀន',       en:'Lead Instructor'},
      {km:'គ្រូបង្រៀន',     en:'Instructor'},
      {km:'ហាត់ការ',         en:'Apprentice'},
    ],
    staffRoles: [
      {km:'នាយក​សាលា',   en:'School director'},
      {km:'ជំនួយការ',     en:'Assistant'},
      {km:'ស្ដីការ',       en:'Receptionist'},
      {km:'ហិរញ្ញវត្ថុ',   en:'Finance'},
      {km:'ជាង​ឡាន',      en:'Mechanic'},
      {km:'ដឹក​ជញ្ជូន',    en:'Driver/Logistics'},
    ],
  };
}
if (!window.__schoolSettings.addons) {
  window.__schoolSettings.addons = [
    {id:1, km:'ការប្រឡងផ្លូវ',  en:'Road exam fee',         price:25},
    {id:2, km:'មេរៀន​បន្ថែម',    en:'Extra lesson (1h)',      price:18},
    {id:3, km:'ការ​ប្រឡង​សាក​', en:'Mock test pack (×5)',    price:30},
    {id:4, km:'ឯកសារ​ប័ណ្ណ​បើកបរ',    en:'Permit paperwork',       price:15},
    {id:5, km:'សៀវភៅ​សិក្សា',   en:'Study handbook (KH/EN)', price:8},
  ];
}
if (window.__schoolSettings.price_AT == null) window.__schoolSettings.price_AT = 200;
if (window.__schoolSettings.price_MT == null) window.__schoolSettings.price_MT = 230;
// Target training hours per tracking phase (KH / JP / AI), split into theory and
// practical. The student card shows the hours of whichever phase the student is
// currently doing.
// Each phase holds { th (theory), prAT (practical · auto), prMT (practical · manual) }.
{
  const _DEF = () => ({ th:10, prAT:12, prMT:15 });
  const _phaseKeys = (window.STUDENT_PHASES || [{k:'KH'},{k:'JP'},{k:'AI'},{k:'SST'}]).map(p => p.k);
  if (!window.__schoolSettings.programHours) window.__schoolSettings.programHours = {};
  const _ph = window.__schoolSettings.programHours;
  _phaseKeys.forEach(k => {
    const v = _ph[k];
    if (typeof v === 'number') _ph[k] = { th:0, prAT:v, prMT:v };                        // legacy flat → practical
    else if (v && typeof v === 'object') {
      if (!('prAT' in v) && !('prMT' in v)) { const pr = Number(v.pr)||0; _ph[k] = { th:Number(v.th)||0, prAT:pr, prMT:pr }; }  // {th,pr} → split
      else _ph[k] = { th:Number(v.th)||0, prAT:Number(v.prAT)||0, prMT:Number(v.prMT)||0 };
    } else _ph[k] = _DEF();
  });
}
if (!window.__schoolSettings.studentForm) {
  window.__schoolSettings.studentForm = {
    shifts: ['ព្រឹក', 'ថ្ងៃ​ត្រង់', 'រសៀល', 'យប់'],
    days:   ['ចន្ទ-សុក្រ', 'សៅរ៍-អាទិត្យ'],
  };
}
if (!window.__schoolSettings.instructorRoles) {
  window.__schoolSettings.instructorRoles = [
    {km:'គ្រូជាន់ខ្ពស់',  en:'Senior Instructor'},
    {km:'មេបង្រៀន',       en:'Lead Instructor'},
    {km:'គ្រូបង្រៀន',     en:'Instructor'},
    {km:'ហាត់ការ',         en:'Apprentice'},
  ];
}
if (!window.__schoolSettings.staffRoles) {
  window.__schoolSettings.staffRoles = [
    {km:'នាយក​សាលា',   en:'School director'},
    {km:'ជំនួយការ',     en:'Assistant'},
    {km:'ស្ដីការ',       en:'Receptionist'},
    {km:'ហិរញ្ញវត្ថុ',   en:'Finance'},
    {km:'ជាង​ឡាន',      en:'Mechanic'},
    {km:'ដឹក​ជញ្ជូន',    en:'Driver/Logistics'},
  ];
}
if (!window.__schoolSettings.pricing?.length) {
  window.__schoolSettings.pricing = [
    {id:1, n:'Standard',   km:'ស្តង់ដារ',    cls:'B', hrs:30, price:180, inc:'30h training · road exam'},
    {id:2, n:'Intensive',  km:'បន្ថែម',      cls:'B', hrs:40, price:240, inc:'40h + extra mock tests'},
    {id:3, n:'Motorcycle', km:'ម៉ូតូ',        cls:'A', hrs:18, price:110, inc:'18h training · road exam'},
    {id:4, n:'Truck',      km:'ឡានដឹក',     cls:'C', hrs:40, price:320, inc:'40h training · road exam'},
    {id:5, n:'Extra hour', km:'ម៉ោងបន្ថែម',  cls:'+', hrs:1,  price:20,  inc:'Per-hour rate · billed separately'},
  ];
}
if (!window.__schoolSettings.payments) {
  window.__schoolSettings.payments = {aba:true, wing:true, cash:true, bank:true, pipay:false, card:false};
}
if (!window.__schoolSettings.notifs?.length) {
  window.__schoolSettings.notifs = [true, true, true, true, true, true];
}
if (!window.__schoolSettings.hours?.length) {
  window.__schoolSettings.hours = [
    {open:true,  start:'07:00', end:'18:00'},
    {open:true,  start:'07:00', end:'18:00'},
    {open:true,  start:'07:00', end:'18:00'},
    {open:true,  start:'07:00', end:'18:00'},
    {open:true,  start:'07:00', end:'18:00'},
    {open:true,  start:'07:00', end:'14:00'},
    {open:false, start:'07:00', end:'18:00'},
  ];
}
if (!window.__schoolSettings.vat) window.__schoolSettings.vat = '10';
if (!window.__schoolSettings.currency) window.__schoolSettings.currency = 'USD ($)';
if (!window.__schoolSettings.rolePermissions) {
  window.__schoolSettings.rolePermissions = { instructor: {}, student: {} };
}

// ── Main settings screen ──────────────────────────────────────────────────
// Mobile settings menu — sections grouped into a vertical list (iOS-style).
const SETTINGS_GROUPS = [
  { km:'សាលា',         en:'School',     ids:['school','locations','roles','accounts'] },
  { km:'ប្រតិបត្តិការ', en:'Operations', ids:['pricing','notify','integ','ai'] },
  { km:'ប្រព័ន្ធ',      en:'System',     ids:['appear','audit','data'] },
];
const SETTINGS_TAB_COLOR = {
  school:'#2A5DB0', locations:'#12786B', roles:'#6246C9', accounts:'#3A3EA0',
  pricing:'#B5650E', notify:'#E07B39', integ:'#0E6B8A', ai:'#8A2E8A',
  appear:'#E8A317', audit:'#4A5560', data:'#2A5DB0',
};

const SettingsScreen = ({ role, fontSize = 'md', setFontSize }) => {
  const { lang, setLang, tr, toast, dark, toggleDark } = useAppActions();
  const bp = useBreakpoint();
  const isAdmin = role === 'admin';
  const [tab, setTab]       = React.useState(isAdmin ? 'school' : 'appear');
  const [mobileNav, setMobileNav] = React.useState(true);   // mobile: show the grouped section menu vs a section
  const [dirty, setDirty]   = React.useState(false);
  const [version, setVersion] = React.useState(0); // bump to re-mount sub-tabs on discard

  // snapshot taken at mount (or after save) — used for discard
  const origRef = React.useRef(JSON.parse(JSON.stringify(window.__schoolSettings)));

  // Debounced auto-save: saveAllData() serializes the WHOLE dataset (students,
  // lessons, base64 logo…), which can take 50–150ms. Running it on every
  // keystroke froze typing in Settings fields. Coalesce writes instead.
  // The debounced auto-save writes localStorage only (skipCloud=true) — pushing
  // to Supabase on every keystroke-batch is the documented anti-pattern in
  // data.jsx ("only user-triggered changes push to cloud"). Cloud sync happens
  // on the explicit Save button (flushSave) and when leaving Settings.
  const saveTimer = React.useRef(null);
  const flushSave = () => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    if (window.saveAllData) window.saveAllData();
  };
  const queueSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveTimer.current = null; if (window.saveAllData) window.saveAllData(true); }, 700);
  };
  // Persist any pending edit when leaving Settings.
  React.useEffect(() => () => flushSave(), []);

  const markDirty = () => {
    setDirty(true);
    queueSave();
  };

  const handleSave = () => {
    origRef.current = JSON.parse(JSON.stringify(window.__schoolSettings));
    setDirty(false);
    if (window.__notifySettingsChanged) window.__notifySettingsChanged();
    if (window.__logActivity) window.__logActivity('settings', 'settings', tr('កំណត់​ប្រព័ន្ធ','System settings'));
    flushSave();
    toast(tr('បានរក្សាទុករួចហើយ ✓', 'Changes saved ✓'), 'good');
  };

  const handleDiscard = () => {
    // restore global store to snapshot, then re-mount all sub-components
    Object.assign(window.__schoolSettings,
      JSON.parse(JSON.stringify(origRef.current)));
    flushSave(); // sync localStorage with the restored state (cancels any pending write)
    setDirty(false);
    setVersion(v => v + 1);
    toast(tr('បានបោះបង់ការ​កែ​ប្រែ', 'Changes discarded'), 'neutral');
  };

  const allTabs = [
    {id:'school',    km:'ព័ត៌មាន​សាលា',      en:'School info',    icon:'home',     adminOnly:true},
    {id:'locations', km:'ទីតាំង',            en:'Branches',       icon:'map',      adminOnly:true},
    {id:'roles',     km:'តួនាទី & សិទ្ធិ',    en:'Roles',          icon:'users',    adminOnly:true},
    {id:'accounts',  km:'គណនី​ចូល',          en:'Logins',         icon:'users',    adminOnly:true},
    {id:'pricing',   km:'​តម្លៃ & ការ​ទូទាត់', en:'Pricing & pay',  icon:'cash',     adminOnly:true},
    {id:'notify',    km:'ការ​ជូន​ដំណឹង​',      en:'Notifications',  icon:'bell',     adminOnly:true},
    {id:'integ',     km:'ការ​ភ្ជាប់',          en:'Integrations',   icon:'plus',     adminOnly:true},
    {id:'ai',        km:'AI & OCR',           en:'AI & OCR',       icon:'settings', adminOnly:true},
    {id:'appear',    km:'រូបរាង',             en:'Appearance',     icon:'settings', adminOnly:false},
    {id:'audit',     km:'ប្រវត្តិ',           en:'History',        icon:'book',     adminOnly:true},
    {id:'data',      km:'ទិន្នន័យ',           en:'Data backup',    icon:'download', adminOnly:true},
  ];
  const tabs = isAdmin ? allTabs : allTabs.filter(t => !t.adminOnly);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km={isAdmin ? 'ការគ្រប់គ្រងប្រព័ន្ធ' : 'រូបរាង'}
        en={isAdmin ? 'Configure school info, branches, permissions, payments, integrations' : 'Customize your display preferences'}
        action={isAdmin && (
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" onClick={handleDiscard}
              style={dirty?{color:'var(--ink)'}:{opacity:.45,pointerEvents:'none'}}>
              {tr('បោះបង់','Discard')}
            </Btn>
            <Btn kind="primary" size="md" icon={<Icon name="check" size={14}/>}
              onClick={handleSave}
              style={dirty?{}:{opacity:.45,pointerEvents:'none'}}>
              {tr('រក្សាទុក','Save')}
            </Btn>
          </div>
        )}
      />

      {(() => {
      const tabContent = (
        <div key={version} style={{display:'flex',flexDirection:'column',gap:14,minWidth:0}}>
          {tab==='school'    && <SchoolInfo    onDirty={markDirty}/>}
          {tab==='locations' && <Locations     onDirty={markDirty}/>}
          {tab==='roles'     && <RolesPermissions onDirty={markDirty}/>}
          {tab==='accounts'  && <AccountsSettings/>}
          {tab==='pricing'   && <PricingSettings onDirty={markDirty}/>}
          {tab==='notify'    && <NotifSettings  onDirty={markDirty}/>}
          {tab==='integ'     && <Integrations/>}
          {tab==='ai'        && <AiSettings    onDirty={markDirty}/>}
          {tab==='appear'    && <AppearanceSettings lang={lang} setLang={setLang} tr={tr} toast={toast} fontSize={fontSize} setFontSize={setFontSize} role={role} dark={dark} toggleDark={toggleDark}/>}
          {tab==='audit'     && <AuditLog/>}
          {tab==='data'      && <DataBackup toast={toast} tr={tr}/>}
        </div>
      );
      const mobile = bp.tablet || bp.mobile;

      // ── MOBILE / TABLET · grouped section menu (vertical list) ──────────────
      if (isAdmin && mobile && mobileNav) return (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {SETTINGS_GROUPS.map(g => {
            const rows = tabs.filter(t => g.ids.includes(t.id));
            if (!rows.length) return null;
            return (
              <div key={g.km}>
                <div style={{fontSize:10.5,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.09em',textTransform:'uppercase',color:'var(--ink-3)',fontWeight:600,padding:'0 6px 7px'}}>{tr(g.km,g.en)}</div>
                <Card pad={0}>
                  {rows.map((t,i) => (
                    <button key={t.id} onClick={()=>{ setTab(t.id); setMobileNav(false); }} style={{
                      width:'100%',display:'flex',alignItems:'center',gap:12,padding:'12px 13px',
                      border:'none',borderTop:i?'1px solid var(--border)':'none',
                      background:'transparent',cursor:'pointer',textAlign:'left',font:'inherit',color:'var(--ink)',
                    }}>
                      <div style={{width:34,height:34,borderRadius:10,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:SETTINGS_TAB_COLOR[t.id]||'var(--accent)',color:'#fff'}}>
                        <Icon name={t.icon} size={16}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600}}>{t.km}</div>
                        <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.03em'}}>{t.en.toUpperCase()}</div>
                      </div>
                      <span style={{display:'flex',color:'var(--ink-3)',flexShrink:0}}><Icon name="chev" size={16}/></span>
                    </button>
                  ))}
                </Card>
              </div>
            );
          })}
        </div>
      );

      // ── MOBILE / TABLET · a section is open — back button + content ─────────
      if (isAdmin && mobile && !mobileNav) return (
        <div style={{display:'flex',flexDirection:'column',gap:14,minWidth:0}}>
          <button onClick={()=>setMobileNav(true)} style={{
            display:'flex',alignItems:'center',gap:8,padding:'9px 4px',background:'transparent',border:'none',
            cursor:'pointer',color:'var(--accent)',fontSize:14,fontWeight:600,fontFamily:'inherit',alignSelf:'flex-start',
          }}>
            <span style={{display:'flex',transform:'scaleX(-1)'}}><Icon name="chev" size={16}/></span>
            {tr('ការកំណត់','Settings')}
          </button>
          {tabContent}
        </div>
      );

      // ── DESKTOP (or non-admin) · left rail + content ───────────────────────
      return (
      <div style={{display:'grid',gridTemplateColumns: (isAdmin && !bp.tablet && !bp.mobile) ? '220px 1fr' : '1fr',gap:14,alignItems:'start'}}>
        {isAdmin && !bp.tablet && !bp.mobile && <Card pad={8}>
          <div style={{padding:'6px 8px',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',marginBottom:4}}>SECTIONS</div>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              width:'100%',display:'flex',alignItems:'center',gap:10,
              padding:'10px 10px',border:'none',
              background: tab===t.id ? 'var(--surface-muted)' : 'transparent',
              color: tab===t.id ? 'var(--ink)' : 'var(--ink-2)',
              borderRadius:8, fontSize:13, fontWeight: tab===t.id ? 600 : 400,
              cursor:'pointer', textAlign:'left', marginBottom:2,
            }}>
              <Icon name={t.icon} size={14} stroke={tab===t.id?2:1.5}/>
              <div style={{flex:1,minWidth:0}}>
                <div>{t.km}</div>
                <div style={{fontSize:10,color:'var(--ink-3)',marginTop:1,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>{t.en.toUpperCase()}</div>
              </div>
            </button>
          ))}

          <Divider/>
          <div style={{padding:10,marginTop:6}}>
            <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>SYSTEM</div>
            <div style={{fontSize:12,marginTop:6,color:'var(--ink-2)'}}>v0.4 · មិថុនា 2026</div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>Last backup · 2h ago</div>
            <Btn kind="ghost" size="sm" style={{marginTop:10,width:'100%',justifyContent:'center'}}
              onClick={()=>toast(tr('ការ​បម្រុង​ទុក​​ចាប់​ផ្ដើម…','Backup started…'),'neutral')}>
              Backup now
            </Btn>
          </div>
        </Card>}

        {tabContent}
      </div>
      );
      })()}
    </div>
  );
};

// ── School info ──────────────────────────────────────────────────────────
const SchoolInfo = ({ onDirty }) => {
  const { tr } = useAppActions();
  const ss = window.__schoolSettings;
  const [logo,   setLogo]   = React.useState(ss.logo);
  const [name,   setName]   = React.useState(ss.name);
  const [nameEn, setNameEn] = React.useState(ss.nameEn);
  const [lic,    setLic]    = React.useState(ss.license);
  const [tax,    setTax]    = React.useState(ss.taxId);
  const [est,    setEst]    = React.useState(ss.established);
  const [dir,    setDir]    = React.useState(ss.director);
  const [phone,  setPhone]  = React.useState(ss.phone);
  const [email,  setEmail]  = React.useState(ss.email);
  const [web,    setWeb]    = React.useState(ss.website);
  const [fb,     setFb]     = React.useState(ss.facebook);
  const [addr,   setAddr]   = React.useState(ss.address);
  const [hours,  setHours]  = React.useState((ss.hours||[]).map(h=>({...h})));
  const [editing, setEditing] = React.useState(false);   // detail view first; ✎ to edit

  const logoRef = React.useRef(null);
  // Read-only field for the detail view.
  const Ro = ({km, en, value, mono}) => (
    <div style={{minWidth:0}}>
      <div style={{fontSize:11,color:'var(--ink-3)',fontWeight:600,marginBottom:3}}>{tr(km,en)}</div>
      <div style={{fontSize:14,fontWeight:500,color:value?'var(--ink)':'var(--ink-3)',fontFamily:mono?'"JetBrains Mono",monospace':'inherit',wordBreak:'break-word'}}>{value||'—'}</div>
    </div>
  );

  const up = (setter, key) => val => {
    setter(val);
    ss[key] = val;
    onDirty();
  };
  const upHour = (i, field, val) => {
    const next = hours.map((h,j) => j===i ? {...h,[field]:val} : h);
    setHours(next);
    ss.hours = next;
    onDirty();
  };

  const handleLogoFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Shrink the logo before storing — it lives in school_settings and is pulled
    // on every full load, so a multi-MB original would waste a lot of egress.
    const store = async (dataUrl) => {
      let out = dataUrl;
      if (window.__sbUploadMedia) { const u = await window.__sbUploadMedia(dataUrl, { folder:'logo', name:'logo' }); if (u) out = u; }
      up(setLogo,'logo')(out);
    };
    if (window.resizeImageFile) {
      window.resizeImageFile(file, 256, 256).then(store);
    } else {
      const reader = new FileReader();
      reader.onload = ev => { store(ev.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => { up(setLogo,'logo')(null); };

  return (
    <>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        {editing
          ? <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={()=>setEditing(false)}>{tr('រួចរាល់','Done')}</Btn>
          : <Btn kind="ghost" size="sm" icon={<Icon name="edit" size={13}/>} onClick={()=>setEditing(true)}>{tr('កែ','Edit')}</Btn>}
      </div>

      {!editing && (<>
        <Card label={tr('អត្តសញ្ញាណ','IDENTITY')}>
          <div style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:18,alignItems:'flex-start'}}>
            <div style={{width:120,height:120,borderRadius:14,overflow:'hidden',background:'var(--surface-muted)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {logo ? <img src={logo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="logo"/> : <Logo size={48}/>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <Ro km="ឈ្មោះ​ខ្មែរ" en="Khmer name" value={name}/>
              <Ro km="ឈ្មោះ​អង់គ្លេស" en="English name" value={nameEn}/>
              <Ro km="លេខ​អាជ្ញាប័ណ្ណ" en="License #" value={lic} mono/>
              <Ro km="លេខ​ពន្ធ" en="Tax ID" value={tax} mono/>
              <Ro km="ឆ្នាំ​បង្កើត" en="Established" value={est} mono/>
              <Ro km="ប្រធាន​សាលា" en="Director" value={dir}/>
            </div>
          </div>
        </Card>
        <Card label={tr('ការ​ទាក់​ទង​សាធារណៈ','CONTACT')}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <Ro km="ទូរស័ព្ទ" en="Phone" value={phone} mono/>
            <Ro km="អ៊ីមែល" en="Email" value={email} mono/>
            <Ro km="គេហ​ទំព័រ" en="Website" value={web} mono/>
            <Ro km="Facebook" en="Page" value={fb} mono/>
          </div>
          <Divider/>
          <div style={{marginTop:12}}><Ro km="អាសយដ្ឋាន" en="Office address" value={addr}/></div>
        </Card>
        <Card label={tr('ម៉ោង​ធ្វើ​ការ','BUSINESS HOURS')}>
          {DAYS_KM.map((d,i) => { const h = hours[i]; return (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderTop:i?'1px dashed var(--border)':'none',fontSize:13}}>
              <span style={{fontWeight:500}}>{tr(d, DAYS_EN[i])}</span>
              <span style={{color:h.open?'var(--ink)':'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{h.open ? `${h.start} – ${h.end}` : tr('បិទ','Closed')}</span>
            </div>
          ); })}
        </Card>
      </>)}

      {editing && (<>
      <Card label={tr('អត្តសញ្ញាណ','IDENTITY')}>
        <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:18,alignItems:'flex-start'}}>
          {/* Logo uploader */}
          <div>
            <div style={{
              width:120, height:120, borderRadius:14,
              background:'var(--surface-muted)', border:'2px dashed var(--border-strong)',
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative', overflow:'hidden', cursor:'pointer',
            }} onClick={()=>logoRef.current?.click()}>
              {logo ? (
                <img src={logo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="logo"/>
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <Logo size={48}/>
                  <div style={{fontSize:9,color:'var(--ink-3)',letterSpacing:'.06em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>Click to upload</div>
                </div>
              )}
              <div style={{
                position:'absolute',inset:0,background:'rgba(0,0,0,.45)',
                display:'flex',alignItems:'center',justifyContent:'center',
                opacity:0,transition:'opacity .15s',
              }}
              onMouseEnter={e=>e.currentTarget.style.opacity='1'}
              onMouseLeave={e=>e.currentTarget.style.opacity='0'}>
                <span style={{color:'#fff',fontSize:11,fontWeight:600}}>ប្ដូររូប</span>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoFile}/>
            <div style={{display:'flex',gap:4,marginTop:8}}>
              <Btn kind="ghost" size="sm" style={{flex:1,justifyContent:'center'}} onClick={()=>logoRef.current?.click()}>
                ផ្លាស់ប្ដូរ
              </Btn>
              {logo && (
                <Btn kind="ghost" size="sm" style={{color:'var(--danger)',borderColor:'var(--danger)'}} onClick={removeLogo}>
                  <Icon name="x" size={12}/>
                </Btn>
              )}
            </div>
          </div>

          {/* Identity fields */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <StField km="ឈ្មោះ​ខ្មែរ" en="Khmer name"         value={name}   onChange={up(setName,'name')}/>
            <StField km="ឈ្មោះ​អង់គ្លេស" en="English name"    value={nameEn} onChange={up(setNameEn,'nameEn')}/>
            <StField km="លេខ​អាជ្ញាប័ណ្ណ" en="License #"       value={lic}    onChange={up(setLic,'license')} mono/>
            <StField km="លេខ​ពន្ធ" en="Tax ID"                value={tax}    onChange={up(setTax,'taxId')} mono/>
            <StField km="ឆ្នាំ​បង្កើត" en="Established"        value={est}    onChange={up(setEst,'established')} mono/>
            <StField km="ប្រធាន​សាលា" en="Director"           value={dir}    onChange={up(setDir,'director')}/>
          </div>
        </div>
      </Card>

      <Card label={tr('ការ​ទាក់​ទង​សាធារណៈ','CONTACT')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <StField km="ទូរស័ព្ទ" en="Phone"         value={phone} onChange={up(setPhone,'phone')} mono/>
          <StField km="អ៊ីមែល" en="Email"           value={email} onChange={up(setEmail,'email')} mono/>
          <StField km="គេហ​ទំព័រ" en="Website"       value={web}   onChange={up(setWeb,'website')} mono/>
          <StField km="Facebook" en="Page"          value={fb}    onChange={up(setFb,'facebook')} mono/>
        </div>
        <Divider/>
        <div style={{marginTop:12}}>
          <StField km="អាសយដ្ឋាន" en="Office address" value={addr} onChange={up(setAddr,'address')}/>
        </div>
      </Card>

      <Card label={tr('ម៉ោង​ធ្វើ​ការ','BUSINESS HOURS')}>
        <div style={{display:'flex',flexDirection:'column',gap:0}}>
          {DAYS_KM.map((d,i) => {
            const h = hours[i];
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'180px auto 1fr 1fr 60px',gap:12,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:500}}>{tr(d, DAYS_EN[i])}</div>
                <StToggleFn on={h.open} onChange={v=>upHour(i,'open',v)}/>
                {h.open ? (
                  <>
                    <StTimeInput value={h.start} onChange={v=>upHour(i,'start',v)}/>
                    <StTimeInput value={h.end}   onChange={v=>upHour(i,'end',v)}/>
                  </>
                ) : (
                  <div style={{gridColumn:'3/5',fontSize:12,color:'var(--ink-3)'}}>{tr('បិទ','Closed')}</div>
                )}
                <div style={{textAlign:'right',fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>
                  {h.open ? calcHours(h.start,h.end) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </>)}
    </>
  );
};

// ── AI / OCR Settings ─────────────────────────────────────────────────────
const AiSettings = ({ onDirty }) => {
  const { tr } = useAppActions();
  const ss = window.__schoolSettings;
  const [key, setKey] = React.useState(ss.anthropicKey || '');
  const [show, setShow] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const save = () => { ss.anthropicKey = key.trim(); onDirty(); if (window.saveAllData) window.saveAllData(); };
  const testKey = async () => {
    if (!key.trim()) return;
    setTesting(true);
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key': key.trim(),
          'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:10,
          messages:[{role:'user',content:'Hi'}] }),
      });
      if (r.ok) { ss.anthropicKey = key.trim(); onDirty(); if (window.saveAllData) window.saveAllData(); }
      else { const e = await r.json(); alert('Error: ' + (e.error?.message || r.status)); }
    } catch(e) { alert('Connection error: ' + e.message); }
    setTesting(false);
  };
  return (
    <Card label={tr('បញ្ញាប្រឌិត','AI & OCR')}>
      <div style={{fontSize:13,color:'var(--ink-2)',marginBottom:14}}>
        {tr('បញ្ចូល Anthropic API Key ដើម្បីបើក ស្គេនអត្តសញ្ញាណប័ណ្ណ ស្វ័យប្រវត្ត នៅក្នុងការចុះឈ្មោះសិស្ស។',
            'Add an Anthropic API Key to enable automatic ID card scanning in student enrollment.')}
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{flex:1,position:'relative'}}>
          <input value={key} onChange={e=>setKey(e.target.value)} type={show?'text':'password'}
            placeholder="sk-ant-api03-..." style={{width:'100%',padding:'9px 40px 9px 12px',
            border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',
            color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box',
            fontFamily:'"JetBrains Mono",monospace'}}/>
          <button onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
            border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:'var(--ink-3)',padding:2}}>
            {show?'🙈':'👁'}
          </button>
        </div>
        <Btn kind="ghost" onClick={save}>{tr('រក្សា','Save')}</Btn>
        <Btn kind="primary" onClick={testKey} disabled={!key.trim()||testing}>
          {testing ? '⏳' : tr('សាកល្បង','Test')}
        </Btn>
      </div>
      {ss.anthropicKey && <div style={{marginTop:10,fontSize:11,color:'var(--ok)',fontWeight:500}}>
        ✓ {tr('API Key បានរក្សាទុក — ស្គេន ID Card ត្រៀមប្រើ','API Key saved — ID card scanning ready')}
      </div>}
      <div style={{marginTop:14,padding:12,background:'var(--surface-muted)',borderRadius:8,fontSize:11,color:'var(--ink-3)'}}>
        <div style={{fontWeight:600,marginBottom:4}}>{tr('របៀបប្រើ:','How to use:')}</div>
        <div>1. {tr('ចូល console.anthropic.com → API Keys → Create Key','Go to console.anthropic.com → API Keys → Create Key')}</div>
        <div>2. {tr('Copy key ហើយ paste នៅខាងលើ','Copy the key and paste it above')}</div>
        <div>3. {tr('ចុច Test → រួចចុច Save','Click Test → then Save')}</div>
        <div style={{marginTop:6}}>4. {tr('ក្នុង Add Student form → ចុច "📷 ស្គេនអត្តសញ្ញាណប័ណ្ណ"','In Add Student form → click "📷 Scan ID Card"')}</div>
      </div>
    </Card>
  );
};

const calcHours = (start, end) => {
  const [sh,sm] = start.split(':').map(Number);
  const [eh,em] = end.split(':').map(Number);
  const diff = (eh*60+em) - (sh*60+sm);
  if (diff <= 0) return '—';
  return diff % 60 === 0 ? `${diff/60}h` : `${Math.floor(diff/60)}h${diff%60}m`;
};

// ── Locations / Branches ──────────────────────────────────────────────────
// Build an embeddable Google Map URL. If the user pasted a link with @lat,lng
// or a "?q=" we use it; otherwise we geocode the address via output=embed.
const mapEmbedUrl = (b) => {
  const url = (b.mapUrl||'').trim();
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);          // …/@11.55,104.91,15z
  if (at) return `https://maps.google.com/maps?q=${at[1]},${at[2]}&z=15&output=embed`;
  const q = url.match(/[?&]q=([^&]+)/);                         // …?q=<place>
  if (q) return `https://maps.google.com/maps?q=${q[1]}&output=embed`;
  const query = (b.addr || b.name || 'Cambodia');
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
};
const openMapUrl = (b) => (b.mapUrl||'').trim()
  || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.addr||b.name||'')}`;

const Locations = ({ onDirty }) => {
  const { toast, tr } = useAppActions();
  const ss = window.__schoolSettings;
  if (!Array.isArray(ss.branches)) ss.branches = [
    {id:'PP', name:'Phnom Penh — សាខា​មេ', addr:'123 St. Sothearos, Daun Penh, Phnom Penh', mapUrl:'', status:'Active'},
    {id:'SR', name:'Siem Reap',             addr:'456 Sivutha Blvd, Siem Reap',              mapUrl:'', status:'Active'},
  ];
  const [, force]   = React.useReducer(x=>x+1, 0);
  const [editId, setEditId] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft]   = React.useState({ name:'', addr:'', mapUrl:'', status:'Active' });
  const [selId, setSelId]   = React.useState(ss.branches[0]?.id || null);

  const persist = () => { if (window.saveAllData) window.saveAllData(); onDirty && onDirty(); force(); };
  const addBranch = () => {
    if (!draft.name.trim()) { toast(tr('សូម​បញ្ចូល​ឈ្មោះ​សាខា','Enter a branch name'),'warn'); return; }
    const id = 'BR'+Date.now();
    ss.branches.push({ id, name:draft.name.trim(), addr:draft.addr.trim(), mapUrl:draft.mapUrl.trim(), status:draft.status });
    setDraft({ name:'', addr:'', mapUrl:'', status:'Active' }); setAdding(false); setSelId(id); persist();
    toast(tr('បាន​បន្ថែម​សាខា ✓','Branch added ✓'),'good');
  };
  const updBranch = (id, patch) => { const b=ss.branches.find(x=>x.id===id); if(b) Object.assign(b,patch); persist(); };
  const delBranch = (id) => { ss.branches = ss.branches.filter(x=>x.id!==id); if(selId===id) setSelId(ss.branches[0]?.id||null); persist(); toast(tr('បាន​លុប​សាខា','Branch removed'),'neutral'); };

  const inp = {style:{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}};
  const Lbl = ({children}) => <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:3,fontWeight:500}}>{children}</div>;
  const selBranch = ss.branches.find(b=>b.id===selId) || ss.branches[0];

  return (
    <>
      <Card label={tr('សាខា','BRANCHES')}
        action={<button onClick={()=>setAdding(a=>!a)} style={{border:'1px solid var(--accent)',background:adding?'var(--accent-soft)':'var(--surface)',color:'var(--accent)',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>+ {tr('បន្ថែម​សាខា','Add branch')}</button>}>

        {adding && (
          <div style={{border:'1px solid var(--accent)',borderRadius:10,padding:12,marginBottom:12,background:'var(--accent-soft)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><Lbl>{tr('ឈ្មោះ​សាខា','Branch name')} *</Lbl><input {...inp} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder={tr('ឧ. ភ្នំពេញ','e.g. Phnom Penh')}/></div>
              <div><Lbl>{tr('ស្ថានភាព','Status')}</Lbl>
                <select {...inp} value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>
                  <option value="Active">{tr('កំពុង​ដំណើរ​ការ','Active')}</option>
                  <option value="Planned">{tr('គ្រោង​នឹង​បើក','Planned')}</option>
                  <option value="Closed">{tr('បិទ','Closed')}</option>
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}><Lbl>{tr('អាសយដ្ឋាន','Address')}</Lbl><input {...inp} value={draft.addr} onChange={e=>setDraft({...draft,addr:e.target.value})} placeholder={tr('ផ្លូវ ឃុំ/សង្កាត់ ខេត្ត/ក្រុង','Street, commune, city')}/></div>
              <div style={{gridColumn:'1/-1'}}><Lbl>🗺 {tr('តំណ Google Maps','Google Maps link')}</Lbl><input {...inp} value={draft.mapUrl} onChange={e=>setDraft({...draft,mapUrl:e.target.value})} placeholder="https://maps.app.goo.gl/…  ឬ  https://www.google.com/maps/…"/></div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn kind="ghost" size="sm" onClick={()=>{setAdding(false);}}>{tr('បោះបង់','Cancel')}</Btn>
              <Btn kind="primary" size="sm" onClick={addBranch}>{tr('បន្ថែម','Add')}</Btn>
            </div>
          </div>
        )}

        {ss.branches.length===0 && !adding && (
          <div style={{padding:'24px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិន​ទាន់​មាន​សាខា','No branches yet')}</div>
        )}

        {ss.branches.map((b,i)=> editId===b.id ? (
          <div key={b.id} style={{padding:'12px 0',borderTop:i?'1px solid var(--border)':'none'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><Lbl>{tr('ឈ្មោះ','Name')}</Lbl><input {...inp} defaultValue={b.name} onChange={e=>b._n=e.target.value}/></div>
              <div><Lbl>{tr('ស្ថានភាព','Status')}</Lbl>
                <select {...inp} defaultValue={b.status} onChange={e=>b._s=e.target.value}>
                  <option value="Active">Active</option><option value="Planned">Planned</option><option value="Closed">Closed</option>
                </select></div>
              <div style={{gridColumn:'1/-1'}}><Lbl>{tr('អាសយដ្ឋាន','Address')}</Lbl><input {...inp} defaultValue={b.addr} onChange={e=>b._a=e.target.value}/></div>
              <div style={{gridColumn:'1/-1'}}><Lbl>🗺 {tr('តំណ Google Maps','Google Maps link')}</Lbl><input {...inp} defaultValue={b.mapUrl} onChange={e=>b._m=e.target.value}/></div>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn kind="ghost" size="sm" onClick={()=>{setEditId(null);force();}}>{tr('បោះបង់','Cancel')}</Btn>
              <Btn kind="primary" size="sm" onClick={()=>{ updBranch(b.id,{ name:b._n??b.name, status:b._s??b.status, addr:b._a??b.addr, mapUrl:b._m??b.mapUrl }); setEditId(null); }}>{tr('រក្សាទុក','Save')}</Btn>
            </div>
          </div>
        ) : (
          <div key={b.id} onClick={()=>setSelId(b.id)} style={{padding:'13px 8px',borderTop:i?'1px solid var(--border)':'none',display:'flex',gap:12,alignItems:'center',cursor:'pointer',borderRadius:8,background:selId===b.id?'var(--surface-muted)':'transparent'}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{fontSize:14,fontWeight:600}}>{b.name}</div>
                <Badge tone={b.status==='Active'?'good':b.status==='Closed'?'danger':'neutral'}>{b.status}</Badge>
                {b.mapUrl && <span style={{fontSize:10,color:'var(--good)'}}>🗺 {tr('មាន​ផែនទី','map set')}</span>}
              </div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{b.addr || '—'}</div>
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>window.open(openMapUrl(b),'_blank')} style={{border:'1px solid var(--border)',background:'var(--surface)',borderRadius:6,padding:'5px 9px',fontSize:11,fontWeight:600,cursor:'pointer',color:'var(--accent)'}}>🗺 {tr('បើក​ផែនទី','Open map')}</button>
              <button onClick={()=>{setEditId(b.id);force();}} style={{border:'1px solid var(--border)',background:'var(--surface)',borderRadius:6,padding:'5px 9px',fontSize:11,cursor:'pointer',color:'var(--ink-2)'}}>✎ {tr('កែ','Edit')}</button>
              <button onClick={()=>delBranch(b.id)} title={tr('លុប','Delete')} style={{border:'none',background:'none',cursor:'pointer',color:'var(--danger)',fontSize:14,padding:'2px 4px'}}>✕</button>
            </div>
          </div>
        ))}
      </Card>

      {selBranch && (
        <Card label={tr('ផែនទី​សាខា','BRANCH MAP')}
          action={<button onClick={()=>window.open(openMapUrl(selBranch),'_blank')} style={{border:'1px solid var(--accent)',background:'var(--surface)',color:'var(--accent)',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>↗ {tr('បើក​ក្នុង Google Maps','Open in Google Maps')}</button>}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>{selBranch.name} <span style={{fontSize:11,fontWeight:400,color:'var(--ink-3)'}}>· {selBranch.addr||'—'}</span></div>
          <div style={{borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',height:300,background:'var(--surface-muted)'}}>
            <iframe title="branch-map" src={mapEmbedUrl(selBranch)} width="100%" height="100%" style={{border:0,display:'block'}} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen></iframe>
          </div>
          <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
            {tr('ផែនទី​បង្ហាញ​តាម​អាសយដ្ឋាន។ ដើម្បី​ទីតាំង​ជាក់លាក់ សូម​បិទ​ភ្ជាប់​តំណ Google Maps ក្នុង​ការ​កែ​សាខា។','Map shown from the address. For an exact pin, paste a Google Maps link in the branch edit.')}
          </div>
        </Card>
      )}
    </>
  );
};

// ── Instructor roles manager ──────────────────────────────────────────────
const EditableRolesCard = ({ titleKm, titleEn, settingsKey, placeholderKm, placeholderEn }) => {
  const { toast, tr } = useAppActions();
  const [roles, setRoles]   = React.useState(() => [...(window.__schoolSettings[settingsKey] || [])]);
  const [newKm, setNewKm]   = React.useState('');
  const [newEn, setNewEn]   = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const persist = (next) => {
    window.__schoolSettings[settingsKey] = next;
    setRoles(next);
    if (window.saveAllData) window.saveAllData();
  };

  const addRole = () => {
    if (!newEn.trim()) { toast(tr('សូម​ដាក់​ឈ្មោះ​ជា​EN','Enter EN name'), 'warn'); return; }
    persist([...roles, {km: newKm.trim() || newEn.trim(), en: newEn.trim()}]);
    setNewKm(''); setNewEn(''); setAdding(false);
    toast(tr('បាន​បន្ថែម​តួនាទី','Role added'), 'good');
  };

  const removeRole = (idx) => {
    persist(roles.filter((_,i) => i !== idx));
    toast(tr('បាន​លុប​តួនាទី','Role removed'), 'neutral');
  };

  const iSt = {width:'100%',padding:'8px 10px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'};

  return (
    <Card pad={0}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
        <div style={{fontSize:14,fontWeight:600}}>{tr(titleKm, titleEn)}</div>
        <div style={{fontSize:12,color:'var(--ink-3)'}}>{roles.length} {tr('តួនាទី','roles')}</div>
        <div style={{flex:1}}/>
        <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>} onClick={()=>setAdding(v=>!v)}>
          {tr('បន្ថែម','Add')}
        </Btn>
      </div>
      <div style={{padding:'14px 18px',display:'flex',flexDirection:'column',gap:8}}>
        {roles.map((r, idx) => (
          <div key={idx} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)'}}>
            <div style={{width:32,height:32,borderRadius:7,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{idx+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600}}>{r.km}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{r.en}</div>
            </div>
            <button onClick={()=>removeRole(idx)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--ink-3)',padding:6,borderRadius:6,lineHeight:1,transition:'color .12s'}}
              onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--ink-3)'}>
              <Icon name="x" size={15}/>
            </button>
          </div>
        ))}
        {roles.length === 0 && (
          <div style={{textAlign:'center',padding:'20px 0',color:'var(--ink-3)',fontSize:13}}>
            {tr('មិន​ទាន់​មាន​តួនាទី','No roles yet')}
          </div>
        )}
        {adding && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto auto',gap:8,alignItems:'end',padding:'10px 0 2px'}}>
            <div>
              <label style={{fontSize:11,color:'var(--ink-3)',marginBottom:4,display:'block'}}>ឈ្មោះ (ខ្មែរ)</label>
              <input value={newKm} onChange={e=>setNewKm(e.target.value)} placeholder={placeholderKm || 'ជំនួយការ'} style={iSt}/>
            </div>
            <div>
              <label style={{fontSize:11,color:'var(--ink-3)',marginBottom:4,display:'block'}}>Name (EN)</label>
              <input value={newEn} onChange={e=>setNewEn(e.target.value)} placeholder={placeholderEn || 'Assistant'} style={iSt}/>
            </div>
            <Btn kind="primary" size="sm" onClick={addRole}>{tr('បន្ថែម','Add')}</Btn>
            <Btn kind="ghost" size="sm" onClick={()=>setAdding(false)}>{tr('បោះបង់','Cancel')}</Btn>
          </div>
        )}
      </div>
    </Card>
  );
};

// ── Tab-level permissions editor ──────────────────────────────────────────
// Compact, colour-coded permission levels shown as icon-only buttons (a legend
// above the table explains each icon), so the row doesn't fill up with text.
const PERM_LEVELS = [
  { v:'full',   km:'គ្រប់គ្រង', en:'Manage', icon:'edit', c:'#12A302' },
  { v:'view',   km:'មើល',       en:'View',   icon:'eye',  c:'#2A5DB0' },
  { v:'add',    km:'បញ្ចូល',    en:'Add',    icon:'plus', c:'#CA8A04' },
  { v:'hidden', km:'លាក់',      en:'Hidden', icon:'x',    c:'#8A8F98' },
];

const TabPermissionsEditor = ({ onDirty }) => {
  const { toast, tr, lang } = useAppActions();
  const ss = window.__schoolSettings;
  const [perms, setPerms] = React.useState(() => ({
    instructor: { ...(ss.rolePermissions?.instructor || {}) },
    student:    { ...(ss.rolePermissions?.student    || {}) },
  }));

  // All admin tabs are configurable for both roles (excluding dashboard & settings which are always shown)
  const allTabs = (window.NAV_ITEMS?.admin || []).filter(t => t.id !== 'settings' && t.id !== 'dashboard');

  const setLevel = (roleKey, tabId, level) => {
    const next = { ...perms, [roleKey]: { ...perms[roleKey], [tabId]: level } };
    setPerms(next);
    ss.rolePermissions = { instructor: next.instructor, student: next.student };
    if (window.saveAllData) window.saveAllData();
    if (window.__notifySettingsChanged) window.__notifySettingsChanged();
  };

  const getLevel = (roleKey, tabId) => perms[roleKey]?.[tabId] || 'full';

  const PermBtn = ({ roleKey, tabId }) => (
    <div style={{display:'flex',gap:5,justifyContent:'center'}}>
      {PERM_LEVELS.map(p => {
        const active = getLevel(roleKey, tabId) === p.v;
        return (
          <button key={p.v}
            title={lang==='km' ? p.km : p.en}
            aria-label={lang==='km' ? p.km : p.en}
            onClick={() => setLevel(roleKey, tabId, p.v)}
            style={{
              width:32, height:32, borderRadius:8, cursor:'pointer', padding:0, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              border: active ? '1.5px solid '+p.c : '1px solid var(--border)',
              background: active ? p.c : 'transparent',
              color: active ? '#fff' : 'var(--ink-3)',
              transition:'all .12s',
            }}>
            <Icon name={p.icon} size={15} stroke={2.2}/>
          </button>
        );
      })}
    </div>
  );

  return (
    <Card label={tr('​សិទ្ធិ​ប្រើ Tab','TAB PERMISSIONS')}>
      <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:14}}>
        {tr('Admin កំណត់​ថា​ Tab ណា​ដែល​គ្រូ​ ឬ​ សិស្ស​ អាច​ប្រើ​ ។ លំនាំ​ដើម​: Tab ទាំងអស់​ត្រូវ​បាន​បង្ហាញ​។',
            'Admin configures which tabs are visible and accessible per role. Default: all tabs are shown.')}
      </div>

      {/* Icon legend — explains the compact per-row buttons */}
      <div style={{display:'flex',gap:'8px 16px',flexWrap:'wrap',marginBottom:14}}>
        {PERM_LEVELS.map(p => (
          <span key={p.v} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'var(--ink-2)'}}>
            <span style={{width:22,height:22,borderRadius:6,background:p.c,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon name={p.icon} size={13} stroke={2.3}/>
            </span>
            {lang==='km' ? p.km : p.en}
          </span>
        ))}
      </div>

      <div style={{border:'1px solid var(--border)',borderRadius:8,overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
        {/* Header — vertical dividers between Tab / Instructor / Student */}
        <div style={{display:'grid',gridTemplateColumns:'130px 148px 148px',background:'var(--surface-muted)',borderBottom:'1px solid var(--border)'}}>
          <div style={{padding:'10px 14px',fontSize:11,fontWeight:600,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.07em'}}>
            {tr('ផ្ទាំង','Tab')}
          </div>
          <div style={{padding:'10px 14px',borderLeft:'1px solid var(--border)',textAlign:'center',fontWeight:600,fontSize:12,color:'var(--accent)'}}>
            {tr('គ្រូបង្រៀន','Instructor')}
          </div>
          <div style={{padding:'10px 14px',borderLeft:'1px solid var(--border)',textAlign:'center',fontWeight:600,fontSize:12,color:'#3B7A57'}}>
            {tr('សិស្ស','Student')}
          </div>
        </div>

        {allTabs.map((tab, idx) => (
          <div key={tab.id} style={{
            display:'grid', gridTemplateColumns:'130px 148px 148px',
            borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px'}}>
              <Icon name={tab.icon} size={13} color="var(--ink-3)"/>
              <div style={{fontSize:12,fontWeight:500}}>{lang==='km' ? tab.km : tab.en}</div>
            </div>
            <div style={{borderLeft:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 6px'}}>
              <PermBtn roleKey="instructor" tabId={tab.id}/>
            </div>
            <div style={{borderLeft:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 6px'}}>
              <PermBtn roleKey="student" tabId={tab.id}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:10,padding:'8px 12px',background:'var(--surface-muted)',borderRadius:6,fontSize:11,color:'var(--ink-3)'}}>
        ⚡ {tr('"លាក់" នឹង​លាក់​ Tab នោះ​ចេញ​ពី​ menu ។ ការ​ប្ដូរ​ប្រព័ន្ធ​ ត្រូវ​ "រក្សា​ទុក" ជាមុនសិន ។',
               '"Hidden" removes the tab from that role\'s navigation. Click "Save changes" to apply.')}
      </div>
    </Card>
  );
};

// ── Roles & permissions ───────────────────────────────────────────────────
const RolesPermissions = ({ onDirty }) => {
  const { toast, tr } = useAppActions();
  const roles = [
    {id:'super', name:'Super admin', color:'#B0413E', members:1, desc:'Full access'},
    {id:'dir',   name:'Director',    color:'#2A5DB0', members:1, desc:'All except billing config'},
    {id:'ops',   name:'Operations',  color:'#3B7A57', members:2, desc:'Schedule, fleet, staff'},
    {id:'recep', name:'Reception',   color:'#8B5E34', members:3, desc:'Students, payments, booking'},
    {id:'instr', name:'Instructor',  color:'#6B5836', members:5, desc:'Own students & schedule'},
    {id:'mech',  name:'Mechanic',    color:'#4A4A47', members:2, desc:'Fleet only'},
  ];
  const perms = [
    {mod:'Students',    p:[1,1,1,1,'own',0]},
    {mod:'Schedule',    p:[1,1,1,1,'own',0]},
    {mod:'Instructors', p:[1,1,1,0,0,0]},
    {mod:'Staff',       p:[1,1,1,0,0,0]},
    {mod:'Fleet',       p:[1,1,1,0,0,1]},
    {mod:'Service log', p:[1,1,1,0,0,1]},
    {mod:'Billing',     p:[1,0,0,1,0,0]},
    {mod:'Reports',     p:[1,1,1,0,0,0]},
    {mod:'Settings',    p:[1,0,0,0,0,0]},
  ];
  return (
    <>
      <Card pad={0}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'baseline',gap:10}}>
          <div style={{fontSize:14,fontWeight:600}}>{tr('តួនាទី','Roles')}</div>
          <div style={{fontSize:12,color:'var(--ink-3)'}}>{roles.reduce((a,b)=>a+b.members,0)} accounts · 6 roles</div>
          <div style={{flex:1}}/>
          <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}
            onClick={()=>toast(tr('មិន​ទាន់​មាន','Coming soon'),'neutral')}>
            បន្ថែម​តួនាទី
          </Btn>
        </div>
        <div style={{padding:18,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {roles.map(r=>(
            <div key={r.id} onClick={()=>toast(tr(`តួនាទី: ${r.name}`,'Role: '+r.name),'neutral')}
              style={{padding:14,border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',transition:'background .12s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:34,height:34,borderRadius:8,background:r.color+'22',color:r.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>{r.members}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{r.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{r.desc}</div>
                </div>
                <Icon name="settings" size={14}/>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <EditableRolesCard
          titleKm="តួនាទី​គ្រូ​បង្រៀន" titleEn="Instructor roles"
          settingsKey="instructorRoles"
          placeholderKm="គ្រូ​បង្រៀន" placeholderEn="Instructor"
        />
        <EditableRolesCard
          titleKm="តួនាទី​បុគ្គលិក" titleEn="Staff roles"
          settingsKey="staffRoles"
          placeholderKm="ជំនួយការ" placeholderEn="Assistant"
        />
      </div>

      <Card label={tr('ម៉ាទ្រីស​សិទ្ធិ','PERMISSION MATRIX')}>
        <div style={{border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',marginTop:6}}>
          <div style={{display:'grid',gridTemplateColumns:'160px repeat(6,1fr)',background:'var(--surface-muted)',padding:'10px 12px',gap:8,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
            <div>Module</div>
            {roles.map(r=> <div key={r.id} style={{textAlign:'center'}}>{r.name.split(' ')[0]}</div>)}
          </div>
          {perms.map((row)=>(
            <div key={row.mod} style={{display:'grid',gridTemplateColumns:'160px repeat(6,1fr)',padding:'10px 12px',gap:8,borderTop:'1px solid var(--border)',alignItems:'center'}}>
              <div style={{fontSize:12,fontWeight:500}}>{row.mod}</div>
              {row.p.map((v,j) => (
                <div key={j} style={{display:'flex',justifyContent:'center'}}>
                  <PermCell v={v}/>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{marginTop:12,display:'flex',gap:16,fontSize:11,color:'var(--ink-3)'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><PermCell v={1}/> Allow</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><PermCell v={'own'}/> Own records only</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}><PermCell v={0}/> Denied</span>
        </div>
      </Card>

      <TabPermissionsEditor onDirty={onDirty}/>
    </>
  );
};

const PermCell = ({ v }) => {
  if (v === 1)    return <div style={{width:24,height:24,borderRadius:5,background:'var(--good)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="check" size={13} stroke={3}/></div>;
  if (v === 'own') return <div style={{width:24,height:24,borderRadius:5,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>OWN</div>;
  return <div style={{width:24,height:24,borderRadius:5,background:'var(--surface-muted)',color:'var(--ink-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>—</div>;
};

// ── Pricing ──────────────────────────────────────────────────────────────
const PricingSettings = ({ onDirty }) => {
  const { toast, tr } = useAppActions();
  const ss = window.__schoolSettings;
  // Pricing edits are discrete (per row) — persist them fully (incl. cloud) and
  // notify open screens so Billing reflects the change immediately and it never
  // reverts to the old value after a cloud reload.
  const persist = () => {
    onDirty();
    if (window.saveAllData) window.saveAllData();
    if (window.__notifySettingsChanged) window.__notifySettingsChanged();
  };
  const [rows, setRows]     = React.useState((ss.pricing||[]).map(p=>({...p})));
  const [editId, setEditId] = React.useState(null);
  const [draft, setDraft]   = React.useState({});
  const [adding, setAdding] = React.useState(false);
  const [newDraft, setNewDraft] = React.useState({n:'',km:'',cls:'B',hrs:30,price:0,inc:''});
  const [payments, setPayments] = React.useState({...(ss.payments||{})});
  const [vat, setVat]       = React.useState(ss.vat);

  const commit = (next) => { setRows(next); ss.pricing = next; persist(); };

  const [addonRows, setAddonRows]         = React.useState((ss.addons||[]).map(a=>({...a})));
  const [addonEditId, setAddonEditId]     = React.useState(null);
  const [addonDraft, setAddonDraft]       = React.useState({});
  const [addonAdding, setAddonAdding]     = React.useState(false);
  const [addonNewDraft, setAddonNewDraft] = React.useState({km:'',en:'',price:0});

  const commitAddons = (next) => { setAddonRows(next); ss.addons = next; persist(); };
  const startEditAddon  = (row) => { setAddonEditId(row.id); setAddonDraft({...row}); };
  const cancelEditAddon = ()    => { setAddonEditId(null); setAddonDraft({}); };
  const saveEditAddon   = ()    => {
    commitAddons(addonRows.map(r => r.id === addonEditId ? {...addonDraft} : r));
    setAddonEditId(null); setAddonDraft({});
    toast(tr('បានកែ​Add-on','Add-on updated'),'good');
  };
  const deleteAddon = (id) => {
    commitAddons(addonRows.filter(r => r.id !== id));
    toast(tr('បានលុប','Deleted'),'neutral');
  };
  const saveNewAddon = () => {
    if (!addonNewDraft.km.trim() && !addonNewDraft.en.trim()) { toast('ត្រូវការ​ឈ្មោះ','warn'); return; }
    commitAddons([...addonRows, {...addonNewDraft, id: Date.now()}]);
    setAddonAdding(false);
    setAddonNewDraft({km:'',en:'',price:0});
    toast(tr('បានបន្ថែម','Added'),'good');
  };

  const startEdit = (row) => { setEditId(row.id); setDraft({...row}); };
  const cancelEdit = () => { setEditId(null); setDraft({}); };
  const saveEdit = () => {
    commit(rows.map(r => r.id === editId ? {...draft} : r));
    setEditId(null); setDraft({});
    toast(tr('បានកែ​តម្លៃ','Price updated'),'good');
  };
  const deletePlan = (id) => {
    commit(rows.filter(r => r.id !== id));
    toast(tr('បានលុប','Deleted'),'neutral');
  };
  const saveNew = () => {
    if (!newDraft.n.trim()) { toast('ត្រូវការ​ឈ្មោះ','warn'); return; }
    const next = [...rows, {...newDraft, id: Date.now()}];
    commit(next);
    setAdding(false);
    setNewDraft({n:'',km:'',cls:'B',hrs:30,price:0,inc:''});
    toast(tr('បានបន្ថែម','Added'),'good');
  };

  const togglePayment = (key) => {
    const next = {...payments, [key]: !payments[key]};
    setPayments(next);
    ss.payments = next;
    persist();
  };

  const upVat = v => { setVat(v); ss.vat = v; persist(); };

  const payMethods = [
    {k:'aba',   l:'ABA Mobile'},
    {k:'wing',  l:'Wing'},
    {k:'cash',  l:tr('សាច់​ប្រាក់','Cash')},
    {k:'bank',  l:'Bank transfer'},
    {k:'pipay', l:'Pi Pay'},
    {k:'card',  l:'Credit card'},
  ];

  const [priceAT, setPriceAT] = React.useState(ss.price_AT ?? 200);
  const [priceMT, setPriceMT] = React.useState(ss.price_MT ?? 230);
  const saveTuition = (field, val) => {
    ss[field] = val;
    onDirty();   // local debounce (cloud-synced when leaving Settings)
    if (window.__notifySettingsChanged) window.__notifySettingsChanged();   // Billing reflects the base tuition live
  };

  const [progHours, setProgHours] = React.useState(() => JSON.parse(JSON.stringify(ss.programHours || {})));
  const savePhaseHours = (k, kind, val) => {
    const cur = progHours[k] || { th:0, pr:0 };
    const next = { ...progHours, [k]: { ...cur, [kind]: val } };
    setProgHours(next);
    ss.programHours = next;
    onDirty();
    if (window.__notifySettingsChanged) window.__notifySettingsChanged();
  };

  return (
    <>
      <Card label={tr('ថ្លៃ​សិក្សា​មូលដ្ឋាន','BASE TUITION')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[{l:tr('AT · លេខ​អូតូ','AT · Auto'), field:'price_AT', val:priceAT, set:setPriceAT},
            {l:tr('MT · លេខ​ដៃ','MT · Manual'), field:'price_MT', val:priceMT, set:setPriceMT}].map(({l,field,val,set}) => (
            <div key={field} style={{padding:14,border:'1px solid var(--border)',borderRadius:8,background:'var(--surface-muted)'}}>
              <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:6,fontWeight:500}}>{l}</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:13,color:'var(--ink-3)'}}>$</span>
                <input type="number" min="0" value={val}
                  onChange={e=>{ const v=parseFloat(e.target.value)||0; set(v); saveTuition(field,v); }}
                  style={{width:'100%',padding:'6px 10px',border:'1px solid var(--border)',borderRadius:6,
                    fontSize:16,fontWeight:600,fontFamily:'var(--font-display)',
                    background:'var(--surface)',color:'var(--ink)'}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
          ថ្លៃទាំងនេះត្រូវបានប្រើប្រាស់ក្នុង Payment card របស់សិស្ស
        </div>
      </Card>

      <Card label={tr('ម៉ោង​គោលដៅ​តាម​វគ្គ · KH / JP / AI / SST','PROGRAM HOURS · KH / JP / AI / SST')}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12}}>
          {(window.STUDENT_PHASES || [{k:'KH',label:'KH',color:'#2A5DB0'},{k:'JP',label:'JP',color:'#B0413E'},{k:'AI',label:'AI',color:'#12A302'},{k:'SST',label:'SST',color:'#7A45C9'}]).map(p => {
            const h = progHours[p.k] || { th:0, pr:0 };
            return (
            <div key={p.k} style={{padding:14,border:'1px solid var(--border)',borderRadius:8,background:'var(--surface-muted)'}}>
              <div style={{fontSize:12,marginBottom:9,fontWeight:800,color:p.color}}>{p.label}</div>
              {[{kind:'th',l:tr('ទ្រឹស្ដី','Theory')},
                {kind:'prAT',l:tr('អនុវត្តន៍ · អូតូ (AT)','Practical · Auto (AT)')},
                {kind:'prMT',l:tr('អនុវត្តន៍ · លេខដៃ (MT)','Practical · Manual (MT)')}].map(({kind,l},ki) => (
                <div key={kind} style={{marginBottom:ki<2?9:0}}>
                  <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:3,fontWeight:500}}>{l}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <input type="number" min="0" value={h[kind] ?? 0}
                      onChange={e=>{ const v=parseInt(e.target.value)||0; savePhaseHours(p.k, kind, v); }}
                      style={{width:'100%',padding:'5px 9px',border:'1px solid var(--border)',borderRadius:6,
                        fontSize:15,fontWeight:600,fontFamily:'var(--font-display)',background:'var(--surface)',color:'var(--ink)'}}/>
                    <span style={{fontSize:12,color:'var(--ink-3)'}}>h</span>
                  </div>
                </div>
              ))}
            </div>
          );})}
        </div>
        <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
          {tr('ម៉ោង​គោលដៅ ទ្រឹស្ដី និង​អនុវត្តន៍ សម្រាប់​វគ្គ​នីមួយៗ។ កាត​សិស្ស​បង្ហាញ​ម៉ោង​តាម​វគ្គ​ដែល​សិស្ស​កំពុង​រៀន។',
              'Theory & practical target hours per phase. The student card shows the hours of the phase the student is currently doing.')}
        </div>
      </Card>

      <Card label={tr('វគ្គ​សិក្សា & តម្លៃ','COURSE PRICING')}>
        <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1fr 80px 80px 100px 1fr 100px',gap:14,background:'var(--surface-muted)',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
            <div>Plan</div><div>Class</div><div>Hours</div><div style={{textAlign:'right'}}>Price</div><div>Includes</div><div/>
          </div>
          {rows.map(p => editId===p.id ? (
            <div key={p.id} style={{padding:'12px 16px',background:'var(--accent-soft)',borderTop:'1px solid var(--border)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 60px 60px 80px',gap:10,marginBottom:10}}>
                <StField km="ឈ្មោះ EN" en="" value={draft.n}   onChange={v=>setDraft(d=>({...d,n:v}))}/>
                <StField km="ឈ្មោះ KH" en="" value={draft.km}  onChange={v=>setDraft(d=>({...d,km:v}))}/>
                <StField km="Class"    en="" value={draft.cls} onChange={v=>setDraft(d=>({...d,cls:v}))}/>
                <StField km="ម៉ោង"    en="" value={String(draft.hrs||'')} onChange={v=>setDraft(d=>({...d,hrs:parseInt(v)||0}))} mono/>
                <StField km="ថ្លៃ $"   en="" value={String(draft.price||'')} onChange={v=>setDraft(d=>({...d,price:parseFloat(v)||0}))} mono/>
              </div>
              <StField km="Includes" en="" value={draft.inc||''} onChange={v=>setDraft(d=>({...d,inc:v}))}/>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
                <Btn kind="ghost" size="sm" onClick={cancelEdit}>បោះបង់</Btn>
                <Btn kind="primary" size="sm" onClick={saveEdit}>រក្សាទុក</Btn>
              </div>
            </div>
          ) : (
            <div key={p.id} style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1fr 70px 60px 90px 1fr 120px',gap:12,alignItems:'center',borderTop:'1px solid var(--border)'}}>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{p.n}</div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{p.km}</div>
              </div>
              <Badge tone={p.cls==='+'?'accent':'neutral'}>{p.cls==='+'?'+ hr':`Class ${p.cls}`}</Badge>
              <div style={{fontSize:13,fontVariantNumeric:'tabular-nums',color:'var(--ink-2)'}}>{p.hrs}h</div>
              <div style={{textAlign:'right',fontSize:16,fontWeight:600,fontFamily:'var(--font-display)'}}>${p.price}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.inc}</div>
              <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                <Btn kind="ghost" size="sm" onClick={()=>startEdit(p)}>កែ</Btn>
                <Btn kind="ghost" size="sm" style={{color:'var(--danger)'}} onClick={()=>deletePlan(p.id)}>លុប</Btn>
              </div>
            </div>
          ))}

          {/* Add new plan inline form */}
          {adding && (
            <div style={{padding:'12px 16px',background:'color-mix(in oklch,var(--good) 6%,var(--surface))',borderTop:'1px solid var(--border)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 60px 60px 80px',gap:10,marginBottom:10}}>
                <StField km="ឈ្មោះ EN *" en="" value={newDraft.n}   onChange={v=>setNewDraft(d=>({...d,n:v}))}/>
                <StField km="ឈ្មោះ KH"  en="" value={newDraft.km}  onChange={v=>setNewDraft(d=>({...d,km:v}))}/>
                <StField km="Class"      en="" value={newDraft.cls} onChange={v=>setNewDraft(d=>({...d,cls:v}))}/>
                <StField km="ម៉ោង"      en="" value={String(newDraft.hrs||'')} onChange={v=>setNewDraft(d=>({...d,hrs:parseInt(v)||0}))} mono/>
                <StField km="ថ្លៃ $"     en="" value={String(newDraft.price||'')} onChange={v=>setNewDraft(d=>({...d,price:parseFloat(v)||0}))} mono/>
              </div>
              <StField km="Includes" en="" value={newDraft.inc} onChange={v=>setNewDraft(d=>({...d,inc:v}))}/>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
                <Btn kind="ghost" size="sm" onClick={()=>setAdding(false)}>បោះបង់</Btn>
                <Btn kind="primary" size="sm" onClick={saveNew}>+ បន្ថែម</Btn>
              </div>
            </div>
          )}
        </div>
        {!adding && (
          <button onClick={()=>{ setAdding(true); setEditId(null); }} style={{
            marginTop:10,width:'100%',padding:'12px',
            border:'1.5px dashed var(--border-strong)',background:'transparent',
            color:'var(--ink-3)',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',
            transition:'background .12s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            + {tr('បន្ថែម​​ផែន​ការ','Add pricing plan')}
          </button>
        )}
      </Card>

      <Card label={tr('Add-ons & ថ្លៃ​បន្ថែម','ADD-ONS PRICING')}>
        <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1fr 1fr 90px 100px',gap:14,background:'var(--surface-muted)',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
            <div>ឈ្មោះ KH</div><div>Name EN</div><div style={{textAlign:'right'}}>ថ្លៃ $</div><div/>
          </div>
          {addonRows.map(a => addonEditId===a.id ? (
            <div key={a.id} style={{padding:'12px 16px',background:'var(--accent-soft)',borderTop:'1px solid var(--border)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:10,marginBottom:10}}>
                <StField km="ឈ្មោះ KH" en="" value={addonDraft.km||''}  onChange={v=>setAddonDraft(d=>({...d,km:v}))}/>
                <StField km="Name EN"  en="" value={addonDraft.en||''}  onChange={v=>setAddonDraft(d=>({...d,en:v}))}/>
                <StField km="ថ្លៃ $"   en="" value={String(addonDraft.price||'')} onChange={v=>setAddonDraft(d=>({...d,price:parseFloat(v)||0}))} mono/>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <Btn kind="ghost" size="sm" onClick={cancelEditAddon}>បោះបង់</Btn>
                <Btn kind="primary" size="sm" onClick={saveEditAddon}>រក្សាទុក</Btn>
              </div>
            </div>
          ) : (
            <div key={a.id} style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1fr 1fr 80px 120px',gap:12,alignItems:'center',borderTop:'1px solid var(--border)'}}>
              <div style={{fontSize:13,fontWeight:500}}>{a.km}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{a.en}</div>
              <div style={{textAlign:'right',fontSize:15,fontWeight:600,fontFamily:'var(--font-display)'}}>${a.price}</div>
              <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                <Btn kind="ghost" size="sm" onClick={()=>startEditAddon(a)}>កែ</Btn>
                <Btn kind="ghost" size="sm" style={{color:'var(--danger)'}} onClick={()=>deleteAddon(a.id)}>លុប</Btn>
              </div>
            </div>
          ))}

          {addonAdding && (
            <div style={{padding:'12px 16px',background:'color-mix(in oklch,var(--good) 6%,var(--surface))',borderTop:'1px solid var(--border)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:10,marginBottom:10}}>
                <StField km="ឈ្មោះ KH *" en="" value={addonNewDraft.km}  onChange={v=>setAddonNewDraft(d=>({...d,km:v}))}/>
                <StField km="Name EN"     en="" value={addonNewDraft.en}  onChange={v=>setAddonNewDraft(d=>({...d,en:v}))}/>
                <StField km="ថ្លៃ $"      en="" value={String(addonNewDraft.price||'')} onChange={v=>setAddonNewDraft(d=>({...d,price:parseFloat(v)||0}))} mono/>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <Btn kind="ghost" size="sm" onClick={()=>setAddonAdding(false)}>បោះបង់</Btn>
                <Btn kind="primary" size="sm" onClick={saveNewAddon}>+ បន្ថែម</Btn>
              </div>
            </div>
          )}
        </div>
        {!addonAdding && (
          <button onClick={()=>{ setAddonAdding(true); setAddonEditId(null); }} style={{
            marginTop:10,width:'100%',padding:'12px',
            border:'1.5px dashed var(--border-strong)',background:'transparent',
            color:'var(--ink-3)',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',
            transition:'background .12s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            + {tr('បន្ថែម​ Add-on','Add add-on item')}
          </button>
        )}
      </Card>

      <Card label={tr('ការ​ទូទាត់ & ពន្ធ','PAYMENT & TAX')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div>
            <StFieldLabel km="វិធីសាស្ត្រ​ដែល​ទទួល​យក" en="Accepted payment methods"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}}>
              {payMethods.map(m=>(
                <div key={m.k} onClick={()=>togglePayment(m.k)} style={{
                  padding:'10px 12px',background:'var(--surface)',
                  border:'1px solid '+(payments[m.k]?'var(--accent)':'var(--border)'),
                  borderRadius:7,display:'flex',justifyContent:'space-between',alignItems:'center',
                  cursor:'pointer',transition:'border-color .12s',
                }}>
                  <span style={{fontSize:12,fontWeight:500,color:payments[m.k]?'var(--ink)':'var(--ink-3)'}}>{m.l}</span>
                  <StToggleFn on={payments[m.k]} onChange={()=>togglePayment(m.k)}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <StField km="VAT %" en="Tax rate" value={vat} onChange={upVat} mono suffix="%"/>
            <StField km="រូបិយ​ប័ណ្ណ" en="Currency" value={window.__schoolSettings.currency} onChange={v=>{window.__schoolSettings.currency=v;onDirty();}}/>
            <div>
              <StFieldLabel km="លេខ​​វិក្កយបត្រ" en="Invoice numbering"/>
              <div style={{marginTop:6,padding:'10px 12px',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,fontFamily:'"JetBrains Mono",monospace',fontSize:13,fontWeight:500}}>
                INV-{`{YYYY}`}-{`{####}`}
              </div>
              <div style={{marginTop:6,fontSize:11,color:'var(--ink-3)'}}>បច្ចុប្បន្ន: INV-2026-0425 · បន្ទាប់: INV-2026-0426</div>
            </div>
          </div>
        </div>
      </Card>

      <StudentFormSettings onDirty={onDirty}/>
    </>
  );
};

// ── Create login accounts for instructors / students ─────────────────────────
const AccountsSettings = () => {
  const { tr, toast } = useAppActions();
  const cloudOn = !!(window.__sbConfigured && window.__sbConfigured());

  const people = [
    ...(window.INSTRUCTORS || []).map(i => ({ id: i.id, type: 'instructor', name: i.name || i.en, email: i.email })),
    ...(window.STUDENTS    || []).map(s => ({ id: s.id, type: 'student',    name: s.name || s.en, email: s.email })),
  ];
  const [sel, setSel]     = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw]       = React.useState('');
  const [busy, setBusy]   = React.useState(false);
  const [result, setResult] = React.useState(null);

  const person = people.find(p => p.id === sel);
  React.useEffect(() => {
    setResult(null);
    if (person && person.email && person.email !== '—' && /@/.test(person.email)) setEmail(person.email);
    else setEmail('');
  }, [sel]);

  const genPw = () => setPw(Math.random().toString(36).slice(2, 4) + Math.random().toString(36).slice(2, 8));

  const create = async () => {
    if (!person)              { toast(tr('ជ្រើស​អ្នក​ប្រើ​សិន', 'Select a person first'), 'warn'); return; }
    if (!/^\S+@\S+$/.test(email)) { toast(tr('បញ្ចូល​អ៊ីមែល​ត្រឹមត្រូវ', 'Enter a valid email'), 'warn'); return; }
    if ((pw || '').length < 6){ toast(tr('ពាក្យ​សម្ងាត់​យ៉ាង​តិច ៦ តួ', 'Password must be ≥ 6 characters'), 'warn'); return; }
    setBusy(true); setResult(null);
    try {
      const r = await window.__sbCreateUserAccount({
        email, password: pw, role: person.type,
        fullName: person.name, linkedId: person.id,
      });
      setResult({ email, pw, role: person.type, name: person.name, needsConfirm: r.needsConfirm });
      toast(tr('បាន​បង្កើត​គណនី ✓', 'Account created ✓'), 'good');
    } catch (ex) {
      const m = (ex && ex.message) || '';
      toast(/already registered|exists/i.test(m)
        ? tr('អ៊ីមែល​នេះ​មាន​គណនី​រួច​ហើយ', 'This email already has an account')
        : tr('បរាជ័យ — ' + m, 'Failed — ' + m), 'danger');
    }
    setBusy(false);
  };

  if (!cloudOn) {
    return (
      <Card label={tr('គណនី​ចូល', 'LOGIN ACCOUNTS')}>
        <div style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.7}}>
          {tr('មុខងារ​នេះ​ត្រូវ​ការ​ភ្ជាប់ Supabase សិន។ សូម​ពិនិត្យ​ការ​កំណត់ creds ក្នុង​ឯកសារ HTML។',
              'This requires Supabase to be connected. Check the credentials in the HTML file.')}
        </div>
      </Card>
    );
  }

  return (
    <Card label={tr('បង្កើត​គណនី​ចូល · គ្រូ / សិស្ស', 'CREATE LOGIN · INSTRUCTOR / STUDENT')}>
      <div style={{padding:'10px 14px',marginBottom:16,background:'var(--surface-muted)',border:'1px dashed var(--border)',borderRadius:10,fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
        ⚠️ {tr('នៅ Supabase សូម​បិទ "Confirm email" (Authentication → Providers → Email) ដើម្បី​ឱ្យ​គណនី​ប្រើ​បាន​ភ្លាម។ បើ​សិស្ស​គ្មាន​អ៊ីមែល អាច​ប្រើ​ដូច s1@anzen.local ជា username។',
              'In Supabase, turn OFF "Confirm email" (Authentication → Providers → Email) so accounts work immediately. If a student has no email, use something like s1@anzen.local as the username.')}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div style={{gridColumn:'1 / -1'}}>
          <StFieldLabel km="ជ្រើស​គ្រូ / សិស្ស" en="Select instructor / student"/>
          <select value={sel} onChange={e=>setSel(e.target.value)}
            style={{marginTop:6,width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)'}}>
            <option value="">— {tr('ជ្រើស​រើស','select')} —</option>
            {(window.INSTRUCTORS||[]).length>0 && <optgroup label={tr('គ្រូ','Instructors')}>
              {window.INSTRUCTORS.map(i=><option key={i.id} value={i.id}>{(i.name||i.en)} · {i.id}</option>)}
            </optgroup>}
            {(window.STUDENTS||[]).length>0 && <optgroup label={tr('សិស្ស','Students')}>
              {window.STUDENTS.map(s=><option key={s.id} value={s.id}>{(s.name||s.en)} · {s.id}</option>)}
            </optgroup>}
          </select>
        </div>

        <StField km="អ៊ីមែល / Username" en="" value={email} onChange={setEmail}/>
        <div>
          <StFieldLabel km="ពាក្យ​សម្ងាត់" en="Password"/>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            <input value={pw} onChange={e=>setPw(e.target.value)}
              style={{flex:1,padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',fontFamily:'"JetBrains Mono",monospace'}}/>
            <Btn kind="ghost" size="sm" onClick={genPw}>{tr('បង្កើត','Generate')}</Btn>
          </div>
        </div>
      </div>

      <div style={{marginTop:16,display:'flex',justifyContent:'flex-end'}}>
        <Btn kind="primary" size="lg" icon={<Icon name="users" size={15}/>} onClick={create}
          style={busy?{opacity:.6,pointerEvents:'none'}:{}}>
          {busy ? tr('កំពុង​បង្កើត…','Creating…') : tr('បង្កើត​គណនី','Create account')}
        </Btn>
      </div>

      {result && (
        <div style={{marginTop:16,padding:'14px 16px',background:'color-mix(in oklch,var(--good) 8%,var(--surface))',border:'1px solid var(--good)',borderRadius:10}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>✓ {tr('គណនី​សម្រាប់','Account for')} {result.name} ({result.role})</div>
          <div style={{fontSize:13,fontFamily:'"JetBrains Mono",monospace',lineHeight:1.8}}>
            <div>📧 {result.email}</div>
            <div>🔑 {result.pw}</div>
          </div>
          <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
            {result.needsConfirm
              ? tr('⚠️ ត្រូវ​បញ្ជាក់​អ៊ីមែល​សិន (សូម​បិទ Confirm email នៅ Supabase)។','⚠️ Email confirmation required — turn off "Confirm email" in Supabase.')
              : tr('ប្រាប់​ព័ត៌មាន​នេះ​ទៅ​អ្នក​ប្រើ​ដើម្បី​ចូល។','Share these credentials with the user to log in.')}
          </div>
        </div>
      )}
    </Card>
  );
};

// ── Student Registration Form settings ───────────────────────────────────────
const StudentFormSettings = ({ onDirty }) => {
  const { tr } = useAppActions();
  const ss = window.__schoolSettings;
  const sf = ss.studentForm || { shifts: [], days: [] };
  if (!ss.studentForm) ss.studentForm = sf;

  const [shifts,    setShifts]    = React.useState([...(sf.shifts || [])]);
  const [days,      setDays]      = React.useState([...(sf.days || [])]);
  const [newShift,  setNewShift]  = React.useState('');
  const [newDay,    setNewDay]    = React.useState('');

  const commitSF = (patch) => {
    Object.assign(sf, patch);
    if (patch.shifts) setShifts([...patch.shifts]);
    if (patch.days)   setDays([...patch.days]);
    onDirty();
  };

  const removeShift = (i) => commitSF({ shifts: shifts.filter((_,j)=>j!==i) });
  const addShift    = () => {
    const v = newShift.trim();
    if (!v) return;
    commitSF({ shifts: [...shifts, v] });
    setNewShift('');
  };

  const removeDay = (i) => commitSF({ days: days.filter((_,j)=>j!==i) });
  const addDay    = () => {
    const v = newDay.trim();
    if (!v) return;
    commitSF({ days: [...days, v] });
    setNewDay('');
  };

  const chipSt = (i, arr, onRemove) => (
    <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',
      background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,fontSize:13}}>
      <span style={{fontFamily:'var(--font-km),sans-serif'}}>{arr[i]}</span>
      <button onClick={()=>onRemove(i)} style={{border:'none',background:'none',cursor:'pointer',
        color:'var(--ink-3)',fontSize:14,lineHeight:1,padding:0}}>×</button>
    </div>
  );

  const inp = {style:{padding:'7px 10px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,
    fontFamily:'var(--font-km),var(--font-en),inherit',background:'var(--surface)',color:'var(--ink)',flex:1}};

  return (
    <Card label={tr('ទម្រង់​ចុះ​ឈ្មោះ​សិស្ស','STUDENT REGISTRATION FORM')}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        {/* Study Shifts */}
        <div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:10}}>{tr('វេន​សិក្សា','Study Shifts')}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
            {shifts.map((_,i) => chipSt(i, shifts, removeShift))}
            {shifts.length === 0 && <span style={{fontSize:12,color:'var(--ink-3)'}}>—</span>}
          </div>
          <div style={{display:'flex',gap:6}}>
            <input {...inp} value={newShift} placeholder="ឧ. ព្រឹក" onChange={e=>setNewShift(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addShift()}/>
            <Btn kind="ghost" size="sm" onClick={addShift}>+</Btn>
          </div>
        </div>

        {/* Study Days */}
        <div>
          <div style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:10}}>{tr('ថ្ងៃ​សិក្សា','Study Days')}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
            {days.map((_,i) => chipSt(i, days, removeDay))}
            {days.length === 0 && <span style={{fontSize:12,color:'var(--ink-3)'}}>—</span>}
          </div>
          <div style={{display:'flex',gap:6}}>
            <input {...inp} value={newDay} placeholder="ឧ. ចន្ទ-សុក្រ" onChange={e=>setNewDay(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addDay()}/>
            <Btn kind="ghost" size="sm" onClick={addDay}>+</Btn>
          </div>
        </div>
      </div>
      <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)'}}>
        {tr('ការផ្លាស់ប្ដូរទាំងនេះនឹងបង្ហាញ​នៅ​ក្នុង​ Form ចុះ​ឈ្មោះ​សិស្ស​ថ្មី','Changes appear in the New Student form')}
      </div>
    </Card>
  );
};

// ── Notifications ─────────────────────────────────────────────────────────
const NOTIF_ROWS = [
  {km:'ការ​រំ​លឹក​មេរៀន', en:'Lesson reminder', sub:'24 ម៉ោង​មុន​ការ​មក​ដល់', ch:['app','sms'],          tkey:'lesson24'},
  {km:'រំលឹក​មេរៀន',      en:'Lesson reminder', sub:'1 ម៉ោង​មុន',              ch:['app'],                 tkey:'lesson1'},
  {km:'រំលឹក​ការ​ទូទាត់​', en:'Payment reminder', sub:'3 ថ្ងៃ​មុន​ផុត​កំណត់',  ch:['app','sms','email'],   tkey:'payment'},
  {km:'ការ​អនុម័ត​ការ​​​ឈប់', en:'Leave approved',  sub:'ភ្លាមៗ​ពេល​អនុម័ត',      ch:['app','email'],         tkey:'leave'},
  {km:'ការ​ផុត​កំណត់​ឯកសារ​', en:'Doc expiring',   sub:'៦០ ថ្ងៃ​មុន​ការ​ផុត',   ch:['email'],               tkey:'doc'},
  {km:'អបអរ​ជោគជ័យ',       en:'Exam passed',     sub:'ភ្លាមៗ',               ch:['app','sms'],           tkey:'exam'},
];
const NOTIF_TMPL_META = [
  { key:'reminder', label:'ការ​រំលឹក​កាលវិភាគ (១ ថ្ងៃ​មុន) · Schedule reminder' },
  { key:'lesson24', label:'Lesson reminder 24h' },
  { key:'lesson1',  label:'Lesson reminder 1h'  },
  { key:'payment',  label:'Payment reminder'    },
  { key:'leave',    label:'Leave approved'      },
  { key:'doc',      label:'Doc expiring'        },
  { key:'exam',     label:'Exam passed'         },
  { key:'welcome',  label:'Welcome'             },
];
const DEFAULT_NOTIF_TEMPLATES = {
  reminder:{ km:'សួស្ដី {student} 👋 នៅ​ថ្ងៃ​ស្អែក {date} វេលា​ម៉ោង {time} {activity}​នៅ {location}។', en:'Hi {student} 👋 Tomorrow {date} at {time}, {activity} at {location}.' },
  lesson24:{ km:'ជំរាបសួរ {student.name} 👋 មេរៀនបន្ទាប់របស់អ្នកនឹងប្រព្រឹត្តទៅ {lesson.date} ម៉ោង {lesson.time} ជាមួយលោកគ្រូ {instructor.name}។', en:'Hi {student.name} 👋 Your next lesson is on {lesson.date} at {lesson.time} with {instructor.name}.' },
  lesson1: { km:'{student.name} មេរៀនរបស់អ្នកនឹងចាប់ផ្ដើមក្នុង ១ ម៉ោងទៀត ({lesson.time})។', en:'{student.name}, your lesson starts in 1 hour ({lesson.time}).' },
  payment: { km:'{student.name} សូមរំលឹកការទូទាត់ថ្លៃសិក្សា ផុតកំណត់ {lesson.date}។', en:'{student.name}, payment reminder — due {lesson.date}.' },
  leave:   { km:'ការស្នើសុំឈប់របស់អ្នកត្រូវបានអនុម័ត ✓', en:'Your leave request has been approved ✓' },
  doc:     { km:'ឯកសារ {doc.name} នឹងផុតកំណត់នៅ {doc.date}។ សូមបន្តសុពលភាព។', en:'Document {doc.name} expires on {doc.date}. Please renew.' },
  exam:    { km:'🎉 អបអរសាទរ {student.name}! អ្នកបានប្រឡងជាប់។', en:'🎉 Congratulations {student.name}! You passed your exam.' },
  welcome: { km:'សូមស្វាគមន៍ {student.name} មកកាន់ {school.name}! 🚗', en:'Welcome {student.name} to {school.name}! 🚗' },
};

const NotifSettings = ({ onDirty }) => {
  const { tr, toast } = useAppActions();
  const ss = window.__schoolSettings;
  if (!ss.notifs?.length) ss.notifs = NOTIF_ROWS.map(()=>true);
  if (!ss.notifChannels)  ss.notifChannels = NOTIF_ROWS.map(n => ({ app:n.ch.includes('app'), sms:n.ch.includes('sms'), email:n.ch.includes('email') }));
  if (!ss.notifTemplates) ss.notifTemplates = JSON.parse(JSON.stringify(DEFAULT_NOTIF_TEMPLATES));
  const [, force] = React.useReducer(x=>x+1,0);
  const [selTmpl, setSelTmpl] = React.useState(0);
  const [tLang, setTLang]     = React.useState('km');
  if (!ss.telegram) ss.telegram = { enabled:false, token:'', autoSend:false };
  const [tgTestId, setTgTestId] = React.useState('');
  const [tgBusy, setTgBusy]     = React.useState(false);
  const setTg = (patch) => { ss.telegram = { ...ss.telegram, ...patch }; onDirty(); force(); };

  const toggle = i => { ss.notifs = ss.notifs.map((v,j)=>j===i?!v:v); onDirty(); force(); };
  const toggleCh = (i,c) => {
    const cur = ss.notifChannels[i] || {};
    ss.notifChannels = ss.notifChannels.map((v,j)=> j===i ? {...cur, [c]: !cur[c]} : v);
    onDirty(); force();
  };
  const tmplKey = NOTIF_TMPL_META[selTmpl].key;
  const setTmplText = (text) => {
    ss.notifTemplates = { ...ss.notifTemplates, [tmplKey]: { ...(ss.notifTemplates[tmplKey]||{}), [tLang]: text } };
    onDirty(); force();
  };
  const resetTmpl = () => {
    ss.notifTemplates = { ...ss.notifTemplates, [tmplKey]: { ...DEFAULT_NOTIF_TEMPLATES[tmplKey] } };
    onDirty(); force();
  };

  const fillVars = (s) => (s||'')
    .replace(/\{student\.name\}/g, STUDENTS[0]?.name || 'សិស្ស')
    .replace(/\{student\}/g, STUDENTS[0]?.name || 'ធឿន យ៉ា')
    .replace(/\{date\}/g, tLang==='km' ? 'ទី១០ ខែ ៧ ឆ្នាំ ២០២៦' : 'Jul 10, 2026')
    .replace(/\{time\}/g, tLang==='km' ? '១០ៈ០០ ដល់ ១២ៈ០០' : '10:00 to 12:00')
    .replace(/\{activity\}/g, tLang==='km' ? 'រៀន' : 'lesson')
    .replace(/\{location\}/g, tLang==='km' ? 'ទីលាន​ហាត់' : 'Training course')
    .replace(/\{lesson\.date\}/g, (typeof todayStr==='function'?todayStr():'2026-01-01'))
    .replace(/\{lesson\.time\}/g, '09:00')
    .replace(/\{instructor\.name\}/g, INSTRUCTORS[0]?.en || 'Instructor')
    .replace(/\{school\.name\}/g, ss.name || 'Anzen')
    .replace(/\{doc\.name\}/g, 'Medical cert').replace(/\{doc\.date\}/g, (typeof todayStr==='function'?todayStr():''));

  const sendTest = (i) => {
    const row = NOTIF_ROWS[i];
    const t = ss.notifTemplates[row.tkey] || {};
    if (!window.NOTIFICATIONS) window.NOTIFICATIONS = [];
    window.NOTIFICATIONS.unshift({
      tone: row.tkey==='payment'?'warn':row.tkey==='exam'?'good':'accent',
      icon: row.tkey==='payment'?'cash':row.tkey==='exam'?'flag':'bell',
      km: fillVars(t.km || tr(row.km,row.en)),
      en: fillVars(t.en || row.en),
      go: row.tkey==='payment'?'billing':'schedule',
    });
    if (window.__notifyNotificationsChanged) window.__notifyNotificationsChanged();
    if (window.saveAllData) window.saveAllData();
    toast(tr('បានផ្ញើការជូនដំណឹងសាកល្បង ✓ — សូមមើលរូបកណ្ដឹងខាងលើ','Test sent ✓ — check the bell above'),'good');
    // Also deliver to the first student's Telegram when configured
    const tg = ss.telegram || {};
    const stu = STUDENTS.find(x => x.telegram);
    if (tg.enabled && tg.token && stu) {
      window.__sendTelegram(stu.telegram, fillVars(t.km || tr(row.km,row.en))).then(r => {
        toast(r.ok ? tr(`📨 Telegram → ${stu.name} ✓`,`📨 Telegram → ${stu.name} ✓`)
                   : tr('Telegram បរាជ័យ: '+(r.err||''),'Telegram failed: '+(r.err||'')), r.ok?'good':'warn');
      });
    }
  };

  const sendTgTest = () => {
    if (!ss.telegram.token) { toast(tr('សូមបញ្ចូល Bot Token','Enter the bot token'),'warn'); return; }
    if (!tgTestId.trim())   { toast(tr('សូមបញ្ចូល Chat ID','Enter a chat ID'),'warn'); return; }
    setTgBusy(true);
    // temporarily ensure enabled for the test
    const wasEnabled = ss.telegram.enabled; ss.telegram.enabled = true;
    window.__sendTelegram(tgTestId.trim(), `✅ ${ss.name||'Anzen'} — ${tr('សារសាកល្បងពី Anzen','Test message from Anzen')}`).then(r => {
      ss.telegram.enabled = wasEnabled || ss.telegram.enabled;
      setTgBusy(false);
      toast(r.ok ? tr('ផ្ញើជោគជ័យ ✓ សូមពិនិត្យ Telegram','Sent ✓ — check Telegram')
                 : tr('បរាជ័យ: '+(r.err||''),'Failed: '+(r.err||'')), r.ok?'good':'danger');
    });
  };

  const CH_LABEL = { app:'APP', sms:'SMS', email:'EMAIL' };

  const tgIn = {style:{width:'100%',padding:'8px 11px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}};

  return (
    <>
      <Card label={tr('តេលេក្រាម','TELEGRAM')}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{tr('ផ្ញើទៅ Telegram សិស្ស','Send to students\' Telegram')}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{tr('ភ្ជាប់ bot របស់សាលា ដើម្បីផ្ញើសារទៅសិស្ស','Connect the school bot to message students')}</div>
          </div>
          <StToggleFn on={!!ss.telegram.enabled} onChange={()=>setTg({enabled:!ss.telegram.enabled})}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10,opacity:ss.telegram.enabled?1:.5,pointerEvents:ss.telegram.enabled?'auto':'none'}}>
          <div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:4}}>{tr('Bot Token (ពី @BotFather)','Bot Token (from @BotFather)')}</div>
            <input {...tgIn} type="password" value={ss.telegram.token||''} onChange={e=>setTg({token:e.target.value})} placeholder="123456:ABC-DEF..."/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0'}}>
            <StToggleFn on={!!ss.telegram.autoSend} onChange={()=>setTg({autoSend:!ss.telegram.autoSend})}/>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{tr('ផ្ញើស្វ័យប្រវត្តិពេលកក់មេរៀន','Auto-send when a lesson is booked')}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{tr('សិស្សត្រូវមាន Chat ID (ក្នុងប្រវត្តិសិស្ស)','Student must have a Chat ID (in their profile)')}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'flex-end',borderTop:'1px dashed var(--border)',paddingTop:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:4}}>{tr('សាកល្បង — Chat ID','Test — Chat ID')}</div>
              <input {...tgIn} value={tgTestId} onChange={e=>setTgTestId(e.target.value)} placeholder="123456789"/>
            </div>
            <Btn kind="primary" size="md" onClick={sendTgTest} style={tgBusy?{opacity:.6}:{}}>{tgBusy?tr('កំពុងផ្ញើ…','Sending…'):tr('ផ្ញើសាកល្បង','Send test')}</Btn>
          </div>
          <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.6,background:'var(--surface-muted)',borderRadius:7,padding:'8px 11px'}}>
            {tr('របៀប៖ ១) បង្កើត bot ជាមួយ @BotFather យក token ២) សិស្ស​ផ្ញើ /start ទៅ bot ៣) យក Chat ID ដាក់ក្នុងប្រវត្តិសិស្ស។ ការផ្ញើតាមម៉ោងជាក់លាក់ ត្រូវការ server bot ដាច់ដោយឡែក។',
                'How: 1) Create a bot via @BotFather, copy the token 2) Student sends /start to the bot 3) Put their Chat ID in the student profile. Time-scheduled sends need a separate always-on bot server.')}
          </div>
        </div>
      </Card>

      <Card label={tr('ការ​ជូន​ដំណឹង​ស្វ័យ​ប្រវត្តិ','AUTOMATED REMINDERS')}>
        {NOTIF_ROWS.map((n,i)=>{
          const chans = ss.notifChannels[i] || {};
          return (
          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 168px 70px 52px',gap:12,padding:'12px 0',borderTop:i?'1px dashed var(--border)':'none',alignItems:'center'}}>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:ss.notifs[i]?'var(--ink)':'var(--ink-3)'}}>{tr(n.km, n.en)}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{n.sub}</div>
            </div>
            <div style={{display:'flex',gap:4}}>
              {['app','sms','email'].map(c => {
                const on = !!chans[c];
                return <button key={c} type="button" onClick={()=>toggleCh(i,c)} disabled={!ss.notifs[i]} style={{
                  padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:600,cursor:ss.notifs[i]?'pointer':'not-allowed',
                  background: on ? 'var(--accent-soft)' : 'var(--surface-muted)',
                  color: on ? 'var(--accent)' : 'var(--ink-3)',
                  border:'1px solid '+(on?'var(--accent)':'var(--border)'),
                  fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em',opacity:ss.notifs[i]?1:.45,
                }} title={tr('ចុចដើម្បីបិទ/បើក','Click to toggle channel')}>{CH_LABEL[c]}</button>;
              })}
            </div>
            <button type="button" onClick={()=>sendTest(i)} disabled={!ss.notifs[i]} style={{
              padding:'5px 8px',borderRadius:6,fontSize:11,fontWeight:600,fontFamily:'inherit',
              border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink-2)',
              cursor:ss.notifs[i]?'pointer':'not-allowed',opacity:ss.notifs[i]?1:.45,
            }} title={tr('ផ្ញើសាកល្បង','Send test')}>🔔 {tr('សាក','Test')}</button>
            <StToggleFn on={ss.notifs[i]} onChange={()=>toggle(i)}/>
          </div>
          );
        })}
        <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)'}}>
          {tr('ចុច "🔔 សាក" ដើម្បីផ្ញើការជូនដំណឹងសាកល្បងភ្លាមៗ ទៅរូបកណ្ដឹងខាងលើ។','Click "🔔 Test" to push a live notification to the bell above.')}
        </div>
      </Card>

      <Card label={tr('គំរូ​សារ','MESSAGE TEMPLATES')}>
        <div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:0,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden'}}>
          <div style={{background:'var(--surface-muted)',padding:8,borderRight:'1px solid var(--border)'}}>
            {NOTIF_TMPL_META.map((t,i)=>(
              <div key={i} onClick={()=>setSelTmpl(i)} style={{
                padding:'8px 10px',fontSize:12,
                background:selTmpl===i?'var(--surface)':'transparent',
                borderRadius:6,marginBottom:2,
                fontWeight:selTmpl===i?600:400,cursor:'pointer',
                color:selTmpl===i?'var(--ink)':'var(--ink-2)',
              }}>{t.label}</div>
            ))}
          </div>
          <div style={{padding:18}}>
            <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
              {['km','en'].map(lk=>(
                <span key={lk} onClick={()=>setTLang(lk)} style={{padding:'4px 10px',borderRadius:999,fontSize:11,cursor:'pointer',fontWeight:600,
                  background:tLang===lk?'var(--ink)':'var(--surface-muted)',color:tLang===lk?'var(--bg)':'var(--ink-3)'}}>
                  {lk==='km'?'ខ្មែរ':'English'}
                </span>
              ))}
              <div style={{flex:1}}/>
              <button type="button" onClick={resetTmpl} style={{border:'1px solid var(--border)',background:'var(--surface)',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer',color:'var(--ink-3)'}}>↺ {tr('កំណត់ដើម','Reset')}</button>
            </div>
            <textarea
              value={(ss.notifTemplates[tmplKey]||{})[tLang] || ''}
              onChange={e=>setTmplText(e.target.value)}
              rows={4}
              placeholder={tr('សរសេរសារ...','Write the message...')}
              style={{width:'100%',padding:'12px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:13,lineHeight:1.7,fontFamily:'var(--font-km), var(--font-en)',color:'var(--ink)',resize:'vertical',boxSizing:'border-box'}}
            />
            <div style={{marginTop:8,padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8,fontSize:12,lineHeight:1.6}}>
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:4}}>{tr('មើលជាមុន','PREVIEW')}</div>
              {fillVars((ss.notifTemplates[tmplKey]||{})[tLang] || '') || <span style={{color:'var(--ink-3)'}}>—</span>}
            </div>
            <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
              {tr('អថេរ','Variables')}: {(tmplKey==='reminder' ? ['{student}','{date}','{time}','{activity}','{location}'] : ['{student.name}','{lesson.date}','{lesson.time}','{instructor.name}','{school.name}']).map(v=>(
                <span key={v} onClick={()=>setTmplText(((ss.notifTemplates[tmplKey]||{})[tLang]||'')+' '+v)} style={{display:'inline-block',margin:'2px 4px 0 0',padding:'1px 6px',background:'var(--accent-soft)',color:'var(--accent)',borderRadius:4,fontFamily:'"JetBrains Mono",monospace',fontSize:10,cursor:'pointer'}}>{v}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

// ── Integrations ──────────────────────────────────────────────────────────
const Integrations = () => {
  const { toast, tr } = useAppActions();
  const integ = [
    {n:'ABA PayWay',       desc:'ការ​ទូទាត់​ស្វ័យ​ប្រវត្តិ​​​សម្រាប់​​ABA Mobile',      status:'Connected',     tone:'good',    k:'aba'},
    {n:'Wing Bank',        desc:'ការ​ទូទាត់ Wing',                               status:'Connected',     tone:'good',    k:'wing'},
    {n:'Facebook Lead Ads',desc:'​នាំ​យក​​អ្នក​ដាក់​ពាក្យ​ពី​ការ​ផ្សាយ​ពាណិជ្ជកម្ម',  status:'Connected',     tone:'good',    k:'fb'},
    {n:'Telegram bot',     desc:'ការ​ជូន​ដំណឹង + គណនី​សិស្ស',                     status:'Connected',     tone:'good',    k:'tg'},
    {n:'Google Maps',      desc:'ផែន​ទី + ការ​បង្ហាញ​ផ្លូវ',                        status:'Connected',     tone:'good',    k:'maps'},
    {n:'Twilio SMS',       desc:'ការ​ផ្ញើ​ SMS',                                   status:'Not connected', tone:'neutral', k:'twilio'},
    {n:'Google Calendar',  desc:'ការ​ធ្វើ​​សន្ទុះ​​កាល​វិភាគ​ខាង​ក្រៅ',              status:'Not connected', tone:'neutral', k:'gcal'},
    {n:'QuickBooks',       desc:'ការ​នាំ​ចេញ​ហិរញ្ញវត្ថុ',                           status:'Not connected', tone:'neutral', k:'qb'},
  ];
  return (
    <Card label={tr('សេវាកម្ម​ខាង​ក្រៅ','3RD-PARTY INTEGRATIONS')}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
        {integ.map(it=>(
          <div key={it.k} style={{padding:14,border:'1px solid var(--border)',borderRadius:10,display:'flex',gap:12,alignItems:'flex-start',transition:'background .12s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{width:40,height:40,borderRadius:8,background:'var(--surface-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,letterSpacing:'.05em',color:'var(--ink-2)',fontFamily:'"JetBrains Mono",monospace',flexShrink:0}}>{it.n.slice(0,3).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{fontSize:13,fontWeight:600}}>{it.n}</div>
                <Badge tone={it.tone}>{it.status}</Badge>
              </div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>{it.desc}</div>
            </div>
            <Btn kind="ghost" size="sm"
              onClick={()=>toast(tr(it.status==='Connected'?`កំពុង​ប្រើ ${it.n}`:`ភ្ជាប់​ ${it.n}…`, it.status==='Connected'?`Connected: ${it.n}`:`Connecting ${it.n}…`),'neutral')}>
              {it.status==='Connected'?'កែ':'ភ្ជាប់'}
            </Btn>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Appearance ────────────────────────────────────────────────────────────
// One notification-preference row. This is its OWN component so each row owns
// its useState — calling a Hook inside a .map() callback (as this used to do)
// violates the Rules of Hooks and breaks the moment the list becomes dynamic.
const NotifPrefRow = ({ p, i, tr }) => {
  const [on, setOn] = React.useState(p.def);
  return (
    <div style={{display:'flex',alignItems:'center',padding:'10px 0',borderTop:i?'1px solid var(--border)':'none'}}>
      <div style={{flex:1,fontSize:13}}>{tr(p.km,p.en)}</div>
      <StToggleFn on={on} onChange={v=>setOn(v)}/>
    </div>
  );
};

const AppearanceSettings = ({ lang, setLang, tr, toast, fontSize, setFontSize, role, dark, toggleDark }) => {
  const getInstData = () => {
    if (window.__loggedInInstructorData) return window.__loggedInInstructorData;
    if (window.__loggedInInstructorId) {
      const sf = (window.__staffData || []).find(s => s.instId === window.__loggedInInstructorId || s.id === window.__loggedInInstructorId);
      if (sf) return { km: sf.name, en: sf.en, title: sf.roleKm ? sf.roleKm + ' · ' + sf.role : sf.role, avatar: sf.photo };
      const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === window.__loggedInInstructorId);
      if (inst) return { km: inst.name, en: inst.en, title: inst.role || 'Instructor', avatar: inst.photo || 'inst-1' };
    }
    return null;
  };
  const u = (() => {
    if (role === 'instructor') {
      const d = getInstData();
      if (d) return d;
    }
    return LOGIN_USERS[role] || LOGIN_USERS.admin;
  })();
  const avatarRef = React.useRef(null);
  const [avatarSrc, setAvatarSrc] = React.useState(null);

  // Editable profile fields (instructor only)
  const [nameKm,   setNameKm]   = React.useState(() => u.km  || '');
  const [nameEn,   setNameEn]   = React.useState(() => u.en  || '');
  const [phone,    setPhone]    = React.useState(() => {
    if (!window.__loggedInInstructorId) return '';
    const lid = window.__loggedInInstructorId;
    const sf  = (window.__staffData || []).find(s => s.instId === lid || s.id === lid);
    const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === lid);
    const p = sf?.phone || inst?.phone || '';
    return p === '—' ? '' : (p || '');
  });
  const [email,    setEmail]    = React.useState(() => {
    if (!window.__loggedInInstructorId) return '';
    const lid = window.__loggedInInstructorId;
    const sf  = (window.__staffData || []).find(s => s.instId === lid || s.id === lid);
    const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === lid);
    const e = sf?.email || inst?.email || '';
    return e === '—' ? '' : (e || '');
  });
  const [, forceUpdate] = React.useReducer(x => x+1, 0);

  const saveProfile = () => {
    const lid = window.__loggedInInstructorId;
    if (!lid) { toast(tr('មិន​អាច​រក​គណនី','Cannot find account'), 'warn'); return; }
    const nm = nameKm.trim() || nameEn.trim();
    const ne = nameEn.trim() || nameKm.trim();
    if (!ne) { toast(tr('សូម​បំពេញ​ឈ្មោះ','Please enter your name'), 'warn'); return; }
    const ph = phone.trim() || '—';
    const em = email.trim() || '—';

    // Update INSTRUCTORS array
    const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === lid);
    if (inst) {
      inst.name = nm; inst.en = ne; inst.phone = ph; inst.email = em;
      if (avatarSrc) inst.photo = avatarSrc;
    }
    // Update __staffData
    const sf = (window.__staffData || []).find(s => s.instId === lid || s.id === lid);
    if (sf) {
      sf.name = nm; sf.en = ne; sf.phone = ph; sf.email = em;
      if (avatarSrc) sf.photo = avatarSrc;
    }
    // Update live login data
    const title = sf ? (sf.roleKm ? sf.roleKm + ' · ' + sf.role : sf.role) : (inst?.role || 'Instructor');
    const newData = { km: nm, en: ne, title, avatar: avatarSrc || (inst?.photo || sf?.photo || 'inst-1') };
    window.__loggedInInstructorData = newData;
    LOGIN_USERS.instructor = newData;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានរក្សាទុក​ប្រវត្តិរូប','Profile saved'), 'good');
  };

  const handleAvatar = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Theme & language live in the top bar (desktop) / the mobile "More" menu
          header now; font size was unused and has been removed. */}

      {/* Account / avatar upload */}
      <Card label={tr('គណនី','ACCOUNT · គណនី')}>
        {role === 'instructor' ? (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {/* Avatar + role badge row */}
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{position:'relative',cursor:'pointer'}} onClick={()=>avatarRef.current?.click()}>
                {avatarSrc ? (
                  <img src={avatarSrc} style={{width:64,height:64,borderRadius:999,objectFit:'cover',border:'2px solid var(--border)'}} alt="avatar"/>
                ) : (
                  <Avatar tag={u.avatar} size={64}/>
                )}
                <div style={{position:'absolute',bottom:-2,right:-2,width:22,height:22,borderRadius:999,background:'var(--ink)',border:'2px solid var(--surface)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
              <div style={{flex:1}}>
                <Badge tone="accent">{tr('គ្រូ','Instructor')}</Badge>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:6}}>{tr('ចុច​លើ​រូប​ភាព​ដើម្បី​ផ្លាស់ប្ដូរ​រូបថត','Click avatar to change photo')}</div>
              </div>
            </div>
            <Divider/>
            {/* Editable fields */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--ink-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em'}}>{tr('ឈ្មោះ​ខ្មែរ','Khmer Name')}</div>
                <input value={nameKm} onChange={e=>setNameKm(e.target.value)}
                  placeholder={tr('ឈ្មោះ​ជា​ភាសា​ខ្មែរ','Name in Khmer')}
                  style={{width:'100%',padding:'9px 11px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--ink-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em'}}>{tr('ឈ្មោះ​ជា​ភាសា​អង់គ្លេស','English Name')}</div>
                <input value={nameEn} onChange={e=>setNameEn(e.target.value)}
                  placeholder="Name in English"
                  style={{width:'100%',padding:'9px 11px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--ink-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em'}}>{tr('លេខ​ទូរស័ព្ទ','Phone')}</div>
                <input value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="0XX XXX XXX" type="tel"
                  style={{width:'100%',padding:'9px 11px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--ink-3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.06em'}}>{tr('អ៊ីម៉ែល','Email')}</div>
                <input value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="email@example.com" type="email"
                  style={{width:'100%',padding:'9px 11px',border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',font:'inherit',fontSize:13,boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}>
              <Btn kind="primary" onClick={saveProfile}>
                <Icon name="check" size={14}/> {tr('រក្សា​ទុក​ប្រវត្តិ​រូប','Save Profile')}
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{position:'relative',cursor:'pointer'}} onClick={()=>avatarRef.current?.click()}>
              {avatarSrc ? (
                <img src={avatarSrc} style={{width:52,height:52,borderRadius:999,objectFit:'cover',border:'2px solid var(--border)'}} alt="avatar"/>
              ) : (
                <Avatar tag={u.avatar} size={52}/>
              )}
              <div style={{position:'absolute',bottom:-2,right:-2,width:20,height:20,borderRadius:999,background:'var(--ink)',border:'2px solid var(--surface)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600}}>{lang==='km'?u.km:u.en}</div>
              <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{u.title}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>{tr('ចុច​លើ​រូប​ភាព​ដើម្បី​ផ្លាស់ប្ដូរ','Click avatar to change photo')}</div>
            </div>
            <Badge tone="accent">{tr({admin:'អ្នកគ្រប់គ្រង',instructor:'គ្រូ',student:'សិស្ស'}[role],{admin:'Admin',instructor:'Instructor',student:'Student'}[role])}</Badge>
          </div>
        )}
      </Card>

      {/* Notification toggles */}
      <Card label={tr('ការ​ជូន​ដំណឹង','NOTIFICATIONS · ការ​ជូន​ដំណឹង')}>
        {[{km:'អ៊ីមែល',en:'Email',def:true},{km:'SMS · សារ',en:'SMS',def:true},{km:'Push',en:'Push (app)',def:false}].map((p,i)=>(
          <NotifPrefRow key={i} p={p} i={i} tr={tr}/>
        ))}
      </Card>

      {/* Danger zone */}
      <Card label={tr('ឌាមីន','DANGER ZONE')} style={{borderColor:'var(--danger)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:13,fontWeight:500}}>{tr('លុប​គណនី','Delete account')}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{tr('សកម្ម​ភាព​នេះ​មិន​អាច​ត្រឡប់​​វិញ​បាន​ទេ​។','This action cannot be undone.')}</div>
          </div>
          <Btn kind="ghost" onClick={()=>toast(tr('មិន​ទាន់​មាន','Coming soon'),'neutral')} style={{color:'var(--danger)',borderColor:'var(--danger)'}}>
            {tr('លុប','Delete')}
          </Btn>
        </div>
      </Card>
    </div>
  );
};

// ── Audit log ─────────────────────────────────────────────────────────────
if (!window.__auditLog) window.__auditLog = [];

// Helper to push an audit event from anywhere in the app
const pushAudit = (who, act, tgt, sev='edit') => {
  const now = new Date();
  const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  window.__auditLog.unshift({t, d:'ថ្ងៃ​នេះ', who, act, tgt, sev});
  if (window.__auditLog.length > 200) window.__auditLog.pop();
};
Object.assign(window, { pushAudit });

// History / activity log — admin review of who created/edited/deleted what.
const ACT_META = {
  create:   { km:'បង្កើត',   en:'Created',  color:'var(--good)' },
  edit:     { km:'កែ',        en:'Edited',   color:'var(--accent)' },
  delete:   { km:'លុប',       en:'Deleted',  color:'var(--danger)' },
  settings: { km:'កំណត់',     en:'Settings', color:'var(--warn)' },
};
const ENTITY_KM = {
  student:'សិស្ស', lesson:'មេរៀន', instructor:'គ្រូ', staff:'បុគ្គលិក',
  vehicle:'យានយន្ត', invoice:'វិក្កយបត្រ', note:'ចំណាំ',
  'lesson-content':'ខ្លឹមសារ​មេរៀន', settings:'ការ​កំណត់',
};
const AuditLog = () => {
  const { tr, lang, confirm, toast } = useAppActions();
  const [filter, setFilter] = React.useState('all');
  const [selSnap, setSelSnap] = React.useState('');
  const [, setVer] = React.useState(0);
  React.useEffect(() => { window.__notifyAuditChanged = () => setVer(n=>n+1); return ()=>{delete window.__notifyAuditChanged;}; }, []);
  // Make sure there is always at least one restore point to pick from when this
  // tab is opened (snapshots are otherwise only made on saves/activity).
  React.useEffect(() => {
    try { if (window.saveAllData) window.saveAllData(true); if (window.__captureSnapshot) window.__captureSnapshot(true); } catch(e) {}
    setVer(n=>n+1);
  }, []);
  const events = (window.__schoolSettings && window.__schoolSettings.activityLog) || [];
  const filters = [['all','ទាំងអស់','All'],['create','បង្កើត','Created'],['edit','កែ','Edited'],['delete','លុប','Deleted'],['settings','កំណត់','Settings']];
  const shown = filter==='all' ? events : events.filter(e => e.action === filter);
  const fmtTime = (ts) => { try { return new Date(ts).toLocaleString('en-GB', {hour:'2-digit',minute:'2-digit'}); } catch(e){ return ''; } };
  const fmtDay  = (ts) => { try { return new Date(ts).toISOString().slice(0,10); } catch(e){ return ''; } };
  const fmtDT   = (ts) => { try { const d=new Date(ts); return d.toISOString().slice(0,10)+' · '+d.toLocaleString('en-GB',{hour:'2-digit',minute:'2-digit'}); } catch(e){ return ''; } };

  const snaps = (typeof window!=='undefined' && window.__listSnapshots) ? window.__listSnapshots() : [];
  const doRestore = () => {
    if (!selSnap) return;
    const s = snaps.find(x => x.id === selSnap);
    confirm?.({
      title: tr('ស្ដារ​ឡើងវិញ?','Restore this point?'),
      body:  tr('ទិន្នន័យ​ទាំងអស់​នឹង​ត្រឡប់​ទៅ​ស្ថានភាព​នៅ '+(s?fmtDT(s.ts):'')+'។ ការ​ផ្លាស់​ប្ដូរ​ក្រោយ​ពេល​នោះ​នឹង​បាត់។',
                 'All data will revert to its state at '+(s?fmtDT(s.ts):'')+'. Any changes after that point will be lost.'),
      confirmText: tr('ស្ដារ','Restore'), danger:true,
      onConfirm: () => { toast?.(tr('កំពុង​ស្ដារ…','Restoring…'),'neutral'); if (window.__restoreSnapshot) window.__restoreSnapshot(selSnap); },
    });
  };

  const clearAll = () => confirm?.({
    title: tr('សម្អាត​ប្រវត្តិ?','Clear history?'),
    body:  tr('កំណត់​ហេតុ​សកម្មភាព​ទាំងអស់​នឹង​ត្រូវ​លុប។','All activity records will be removed.'),
    confirmText: tr('សម្អាត','Clear'), danger:true,
    onConfirm: () => { if(window.__schoolSettings) window.__schoolSettings.activityLog = []; if(window.saveAllData) window.saveAllData(); setVer(n=>n+1); },
  });

  return (
    <Card label={tr('ប្រវត្តិ​សកម្មភាព','ACTIVITY HISTORY')}
      action={events.length>0 && <button onClick={clearAll} style={{border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink-3)',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>{tr('សម្អាត','Clear')}</button>}>
      <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:10}}>
        {tr('បង្ហាញ​សកម្មភាព​របស់​គណនី​គ្រូ និង​អ្នក​ប្រើ​ផ្សេងៗ — បង្កើត លុប កែ ឬ​បញ្ចូល​ទិន្នន័យ។',
            'Shows what instructor and other accounts have created, edited, deleted or entered.')}
      </div>

      {/* Restore to a point in time — always shown */}
      <div style={{background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
          ↩ {tr('ស្ដារ​ទិន្នន័យ​តាម​ថ្ងៃ & ម៉ោង','Restore to a date & time')}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <select value={selSnap} onChange={e=>setSelSnap(e.target.value)} disabled={snaps.length===0}
            style={{flex:'1 1 220px',minWidth:0,padding:'9px 12px',border:'1.5px solid var(--border)',borderRadius:8,background:'var(--surface)',color:'var(--ink)',fontSize:13}}>
            <option value="">{snaps.length ? tr('— ជ្រើស​ថ្ងៃ & ម៉ោង —','— pick date & time —') : tr('— មិន​ទាន់​មាន​ចំណុច​ស្ដារ —','— no restore points yet —')}</option>
            {snaps.map(s => <option key={s.id} value={s.id}>{fmtDT(s.ts)}</option>)}
          </select>
          <Btn kind="primary" size="md" onClick={doRestore} style={selSnap?{}:{opacity:.5,pointerEvents:'none'}}>{tr('ស្ដារ','Restore')}</Btn>
        </div>
        <div style={{fontSize:11,color:'var(--ink-3)',marginTop:8}}>
          {snaps.length
            ? tr('មាន '+snaps.length+' ចំណុច​ស្ដារ​នៅ​លើ​ឧបករណ៍​នេះ · ការ​ស្ដារ​នឹង​ត្រឡប់​ប្រព័ន្ធ​ទាំងមូល​ទៅ​ពេល​នោះ។', snaps.length+' restore points on this device · restoring reverts the whole system to that moment.')
            : tr('ចំណុច​ស្ដារ​នឹង​ត្រូវ​បាន​បង្កើត​ដោយ​ស្វ័យ​ប្រវត្តិ​នៅ​ពេល​មាន​ការ​ផ្លាស់​ប្ដូរ​ទិន្នន័យ។','Restore points are created automatically as data changes.')}
        </div>
      </div>

      <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'0 0 12px'}}>
        {filters.map(([c,km,en])=>(
          <button key={c} onClick={()=>setFilter(c)} style={{
            padding:'4px 12px',
            background: filter===c?'var(--ink)':'var(--surface-muted)',
            color: filter===c?'var(--bg)':'var(--ink-2)',
            border:'1px solid '+(filter===c?'var(--ink)':'var(--border)'),
            borderRadius:999, fontSize:11, fontWeight:500, cursor:'pointer',
          }}>{tr(km,en)}</button>
        ))}
      </div>

      {shown.length === 0 && (
        <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
          <div style={{fontSize:24,marginBottom:8}}>🕑</div>
          <div>{tr('មិន​ទាន់​មាន​សកម្មភាព','No activity yet')}</div>
          <div style={{fontSize:11,marginTop:6}}>{tr('សកម្មភាព​នឹង​ត្រូវ​កត់ត្រា​នៅ​ទីនេះ','Activity will be recorded here as the system is used')}</div>
        </div>
      )}
      {shown.map((e,i,arr)=>{
        const day = fmtDay(e.ts);
        const showDay = i===0 || fmtDay(arr[i-1].ts) !== day;
        const meta = ACT_META[e.action] || ACT_META.edit;
        const entKm = ENTITY_KM[e.entity] || e.entity;
        return (
          <React.Fragment key={e.id || i}>
            {showDay && (
              <div style={{padding:'14px 0 6px',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderTop:i?'1px solid var(--border)':'none',marginTop:i?6:0}}>{day}</div>
            )}
            <div style={{display:'flex',gap:10,padding:'9px 0',alignItems:'flex-start',borderTop:!showDay?'1px dashed var(--border)':'none'}}>
              <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',width:46,flexShrink:0,paddingTop:2}}>{fmtTime(e.ts)}</div>
              <div style={{width:8,height:8,borderRadius:999,background:meta.color,marginTop:6,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,lineHeight:1.5}}>
                  <b>{e.user}</b>
                  {e.role && e.role!=='admin' && <span style={{fontSize:10,color:'var(--accent)',background:'var(--accent-soft)',padding:'1px 6px',borderRadius:6,marginLeft:6,fontWeight:600}}>{tr('គ្រូ','Instructor')}</span>}
                  <span style={{color:meta.color,fontWeight:600,margin:'0 5px'}}>{tr(meta.km,meta.en)}</span>
                  <span style={{color:'var(--ink-2)'}}>{entKm}</span>
                  {e.detail && <span style={{color:'var(--ink)'}}> · {e.detail}</span>}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </Card>
  );
};

// ── Shared helpers ────────────────────────────────────────────────────────

// Editable input field
const StField = ({ km, en, value, onChange, mono, suffix, type='text' }) => (
  <div>
    <StFieldLabel km={km} en={en}/>
    <div style={{marginTop:6, position:'relative'}}>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding: suffix ? '9px 36px 9px 12px' : '9px 12px',
          background:'var(--surface)', border:'1.5px solid var(--border)',
          borderRadius:7, fontSize:13, fontWeight:500, color:'var(--ink)',
          fontFamily: mono ? '"JetBrains Mono", monospace' : 'var(--font-km), var(--font-en), inherit',
          outline:'none', transition:'border-color .15s', boxSizing:'border-box',
        }}
        onFocus={e => e.target.style.borderColor='var(--accent)'}
        onBlur={e => e.target.style.borderColor='var(--border)'}
      />
      {suffix && <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--ink-3)',fontSize:13,pointerEvents:'none'}}>{suffix}</span>}
    </div>
  </div>
);

const StFieldLabel = ({ km, en }) => (
  <div style={{marginBottom:2}}>
    <span style={{fontSize:12,fontWeight:600,color:'var(--ink-2)'}}>{km}</span>
    {en && <span style={{fontSize:10,color:'var(--ink-3)',marginLeft:6,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',textTransform:'uppercase'}}>{en}</span>}
  </div>
);

// Functional toggle
const StToggleFn = ({ on, onChange }) => (
  <div onClick={e=>{e.stopPropagation();onChange?.(!on);}} style={{
    width:36, height:20, borderRadius:999,
    background: on ? 'var(--accent)' : 'var(--border-strong)',
    position:'relative', transition:'background .15s',
    flexShrink:0, cursor:'pointer',
  }}>
    <div style={{
      position:'absolute', top:2, left: on ? 18 : 2,
      width:16, height:16, borderRadius:999, background:'#fff',
      boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .15s',
    }}/>
  </div>
);

// Time input
const StTimeInput = ({ value, onChange }) => (
  <input
    type="time" value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      padding:'7px 10px', background:'var(--surface)',
      border:'1.5px solid var(--border)', borderRadius:7,
      fontSize:13, fontWeight:500, color:'var(--ink)',
      fontFamily:'"JetBrains Mono",monospace',
      outline:'none', width:'100%', boxSizing:'border-box',
      colorScheme:'light dark',
    }}
    onFocus={e=>e.target.style.borderColor='var(--accent)'}
    onBlur={e=>e.target.style.borderColor='var(--border)'}
  />
);

const StMini = ({ k, v }) => (
  <div>
    <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>{k}</div>
    <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginTop:2}}>{v}</div>
  </div>
);

const StPill = ({ children }) => (
  <span style={{padding:'2px 6px',background:'var(--accent-soft)',color:'var(--accent)',borderRadius:4,fontFamily:'"JetBrains Mono",monospace',fontSize:11,fontWeight:600}}>{children}</span>
);

// ── Data Backup / Restore ────────────────────────────────────────────────
const DataBackup = ({ toast, tr }) => {
  const fileRef = React.useRef();
  const trFileRef = React.useRef();
  const [folderName, setFolderName] = React.useState('');
  const [abSupported] = React.useState(() => 'showDirectoryPicker' in window);
  const [trOverrideCount, setTrOverrideCount] = React.useState(() => Object.keys(window.__trOverrides || {}).length);

  const cloudOn = !!(window.__sbConfigured && window.__sbConfigured());
  const [cloudBusy, setCloudBusy] = React.useState('');

  const pushToCloud = async () => {
    if (cloudBusy) return;
    setCloudBusy('push');
    try {
      // Force-push ALL local data (not just changed rows) so a fresh/empty
      // cloud project gets fully populated — this is the migration action.
      const push = window.__sbForcePushAll || window.__sbPushNow;
      const r = await push();
      if (r && r.ok) toast(tr('បានផ្ទេរទិន្នន័យទៅ Cloud ✓', 'Pushed to cloud ✓'), 'good');
      else toast(tr('ផ្ទេរមានបញ្ហា — ' + (r?.error||''), 'Push failed — ' + (r?.error||'')), 'danger');
    } catch (e) { toast(tr('ផ្ទេរមានបញ្ហា', 'Push failed'), 'danger'); }
    setCloudBusy('');
  };
  // ── Usage panel ─────────────────────────────────────────────────────────────
  const fmtBytes = (n) => {
    if (!n) return '0 KB';
    if (n < 1024*1024) return (n/1024).toFixed(0) + ' KB';
    if (n < 1024*1024*1024) return (n/1024/1024).toFixed(1) + ' MB';
    return (n/1024/1024/1024).toFixed(2) + ' GB';
  };
  const dbBytes = React.useMemo(() => { try { return new Blob([localStorage.getItem('anzen_v1')||'']).size; } catch(e){ return 0; } }, []);
  const [usage, setUsage] = React.useState(null);     // {bytes,files} from Storage
  const [usageBusy, setUsageBusy] = React.useState(false);
  const loadUsage = async () => {
    if (usageBusy || !window.__sbStorageUsage) return;
    setUsageBusy(true);
    try { setUsage(await window.__sbStorageUsage()); }
    catch (e) { toast(tr('ទាញ​ការ​ប្រើ​ប្រាស់​មិន​បាន','Could not load usage'), 'danger'); }
    setUsageBusy(false);
  };
  React.useEffect(() => { if (window.__sbConfigured && window.__sbConfigured()) loadUsage(); }, []);
  const STORAGE_LIMIT = 1024*1024*1024;   // ~1 GB free
  const DB_LIMIT      = 500*1024*1024;    // ~500 MB free
  const UsageBar = ({ used, limit, color }) => {
    const pct = Math.min(100, Math.round((used/limit)*100));
    return (
      <div style={{height:8,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden',marginTop:6}}>
        <div style={{width:`${pct}%`,height:'100%',background:pct>=90?'var(--danger)':pct>=70?'var(--warn)':color,borderRadius:999}}/>
      </div>
    );
  };

  const [migBusy, setMigBusy] = React.useState(false);
  const [migProg, setMigProg] = React.useState(null); // {done,total,failed}
  const migrateMedia = async () => {
    if (migBusy || !window.__migrateMediaToStorage) return;
    setMigBusy(true); setMigProg({ done:0, total:0, failed:0 });
    try {
      const r = await window.__migrateMediaToStorage((p) => setMigProg(p));
      if (r.total === 0) toast(tr('គ្មាន​រូប base64 ត្រូវ​ផ្លាស់ — រួចរាល់​ហើយ','Nothing to migrate — all clear'), 'neutral');
      else toast(tr(`បាន​ផ្លាស់ ${r.done}/${r.total} រូប​ទៅ Storage ✓` + (r.failed?` (${r.failed} បរាជ័យ)`:''),
                    `Moved ${r.done}/${r.total} to Storage ✓` + (r.failed?` (${r.failed} failed)`:'')), 'good');
    } catch (e) { toast(tr('ផ្លាស់​មាន​បញ្ហា','Migration failed'), 'danger'); }
    setMigBusy(false);
  };
  const reloadFromCloud = async () => {
    if (cloudBusy) return;
    setCloudBusy('pull');
    try {
      await window.__sbLoadAll();
      if (window.saveAllData) { window.__sbSyncEnabled = false; window.saveAllData(); window.__sbSyncEnabled = true; }
      toast(tr('បានទាញទិន្នន័យពី Cloud ✓ — កំពុង reload', 'Reloaded from cloud ✓'), 'good');
      setTimeout(() => location.reload(), 800);
    } catch (e) { toast(tr('ទាញមានបញ្ហា', 'Reload failed'), 'danger'); setCloudBusy(''); }
  };

  React.useEffect(() => {
    abGetHandle().then(h => { if (h) setFolderName(h.name); });
  }, []);

  const handlePickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      await abSetHandle(handle);
      setFolderName(handle.name);
      // trigger first backup immediately
      await window.__autoBackup?.();
      toast(tr('បាន​កំណត់​ Folder ✓ — backup ដំបូង​បាន​ save', 'Folder set ✓ — first backup saved'), 'good');
    } catch(e) {
      if (e.name !== 'AbortError') toast(tr('មិន​អាច​ជ្រើស​ Folder', 'Could not pick folder'), 'danger');
    }
  };

  const handleClearFolder = async () => {
    await abSetHandle(null);
    setFolderName('');
    toast(tr('បាន​ដក​ Folder ចេញ', 'Auto-backup folder removed'), 'neutral');
  };

  const handleExportTranslations = () => {
    try {
      const reg    = window.__trRegistry || {};
      const groups = window.__trGroups   || {};
      const ov     = window.__trOverrides || {};
      const seen = {};
      // Grouped by screen, applying any current overrides so re-exports keep edits.
      const out = {};
      Object.keys(groups).forEach(g => {
        out[g] = {};
        Object.keys(groups[g]).forEach(en => { out[g][en] = ov[en] || groups[g][en]; seen[en] = 1; });
      });
      // Catch anything registered at runtime that isn't in a screen group.
      const other = {};
      Object.keys(reg).forEach(en => { if (!seen[en]) other[en] = ov[en] || reg[en]; });
      if (Object.keys(other).length) out['ផ្សេងៗ · Other'] = other;
      const total = Object.values(out).reduce((n,g)=>n+Object.keys(g).length, 0);
      const data = { 'anzen-translations': 'v2', exportedAt: new Date().toISOString(), count: total, groups: out };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anzen-translations-${localDateStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(tr(`បាន​ export ${total} ពាក្យ ✓`, `Exported ${total} phrases ✓`), 'good');
    } catch(e) { toast(tr('Export មានបញ្ហា','Export failed'), 'danger'); }
  };

  const handleImportTranslations = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        // Accept the grouped format (v2: { groups: { screen: {en:km} } }) or the
        // older flat format ({ translations: {en:km} } or a bare {en:km}).
        let translations = {};
        if (parsed && parsed.groups && typeof parsed.groups === 'object') {
          Object.values(parsed.groups).forEach(g => { if (g && typeof g === 'object') Object.assign(translations, g); });
        } else {
          translations = parsed.translations || parsed;
        }
        if (typeof translations !== 'object' || Array.isArray(translations)) throw new Error('invalid');
        window.__trOverrides = { ...(window.__trOverrides || {}), ...translations };
        window.__notifyTrChanged?.();
        const count = Object.keys(translations).length;
        setTrOverrideCount(Object.keys(window.__trOverrides).length);
        toast(tr(`បាន import ការ​បក​ប្រែ ${count} ✓`, `Imported ${count} translation(s) ✓`), 'good');
      } catch { toast(tr('ឯកសារ​មិន​ត្រឹម​ត្រូវ','Invalid translation file'), 'danger'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetTranslations = () => {
    window.__trOverrides = {};
    window.__notifyTrChanged?.();
    setTrOverrideCount(0);
    toast(tr('បាន​លុប​ការ​កែ​ប្រែ​ភាសា','Translation overrides cleared'), 'neutral');
  };

  const handleExport = () => {
    try {
      if (window.saveAllData) window.saveAllData();
      if (window.__persistLessonsLib) window.__persistLessonsLib();
      const main = localStorage.getItem('anzen_v1');
      if (!main) { toast(tr('គ្មាន​ទិន្នន័យ','No data found'), 'warn'); return; }
      // Bundle BOTH stores: the main data (anzen_v1) and the lessons
      // library (anzen_lessons_v1), so a backup can fully sync another device.
      const bundle = {
        _anzen_bundle: 1,
        anzen_v1:         JSON.parse(main),
        anzen_lessons_v1: JSON.parse(localStorage.getItem('anzen_lessons_v1') || 'null'),
      };
      const date = localDateStr();
      const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `anzen-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast(tr('បាន​ export ទិន្នន័យ ✓', 'Data exported ✓'), 'good');
    } catch(e) { toast(tr('Export មានបញ្ហា','Export failed'), 'danger'); }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && parsed._anzen_bundle) {
          // New bundle format: restore both stores.
          if (!parsed.anzen_v1 || parsed.anzen_v1.v !== 1) throw new Error('invalid');
          localStorage.setItem('anzen_v1', JSON.stringify(parsed.anzen_v1));
          if (parsed.anzen_lessons_v1) localStorage.setItem('anzen_lessons_v1', JSON.stringify(parsed.anzen_lessons_v1));
        } else if (parsed && parsed.v === 1) {
          // Legacy format: just the main store.
          localStorage.setItem('anzen_v1', ev.target.result);
        } else { throw new Error('invalid'); }
        toast(tr('Import រួចហើយ — កំពុង reload…','Import done — reloading…'), 'good');
        setTimeout(() => location.reload(), 1200);
      } catch { toast(tr('ឯកសារ​មិន​ត្រឹម​ត្រូវ','Invalid backup file'), 'danger'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const dataSize = (() => {
    try {
      const raw = localStorage.getItem('anzen_v1');
      if (!raw) return null;
      const kb = (raw.length / 1024).toFixed(1);
      const parsed = JSON.parse(raw);
      return { kb, students: parsed.STUDENTS?.length || 0, lessons: parsed.LESSONS?.length || 0, invoices: parsed.INVOICES?.length || 0 };
    } catch { return null; }
  })();

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Cloud sync (Supabase) */}
      <Card>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:cloudOn?'rgba(59,122,87,.14)':'var(--surface-muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="refresh" size={18} stroke={1.5} color={cloudOn?'var(--good)':'var(--ink-3)'}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700}}>{tr('Cloud · Supabase','Cloud · Supabase')}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>
                {cloudOn
                  ? tr('ភ្ជាប់​រួច​ហើយ — ទិន្នន័យ sync គ្រប់​ឧបករណ៍','Connected — data syncs across devices')
                  : tr('មិន​ទាន់​ភ្ជាប់ (placeholder creds)','Not connected (placeholder credentials)')}
              </div>
            </div>
            {cloudOn && <span style={{fontSize:11,fontWeight:700,color:'var(--good)',display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'var(--good)'}}/>{tr('ភ្ជាប់','Live')}
            </span>}
          </div>

          {cloudOn && (
            <>
              <div style={{padding:'10px 14px',background:'var(--surface-muted)',borderRadius:10,border:'1px dashed var(--border)',fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
                {tr('ផ្ទេរ​ទិន្នន័យ​ចាស់៖ ចុច “ផ្ទេរ​ទៅ Cloud” ដើម្បី​បញ្ជូន​ទិន្នន័យ​ក្នុង​ឧបករណ៍​នេះ​ឡើង​ទៅ Supabase (ធ្វើ​ម្ដង)។',
                    'Migrate old data: click “Push to cloud” to upload this device\'s data to Supabase (one-time).')}
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <Btn kind="primary" size="lg" icon={<Icon name="upload" size={15}/>} onClick={pushToCloud}
                  style={cloudBusy?{opacity:.6,pointerEvents:'none'}:{}}>
                  {cloudBusy==='push' ? tr('កំពុង​ផ្ទេរ…','Pushing…') : tr('⬆️ ផ្ទេរ​ទៅ Cloud','⬆️ Push to cloud')}
                </Btn>
                <Btn kind="ghost" size="lg" icon={<Icon name="download" size={15}/>} onClick={reloadFromCloud}
                  style={cloudBusy?{opacity:.6,pointerEvents:'none'}:{}}>
                  {cloudBusy==='pull' ? tr('កំពុង​ទាញ…','Reloading…') : tr('⬇️ ទាញ​ពី Cloud','⬇️ Reload from cloud')}
                </Btn>
              </div>
              <div style={{padding:'10px 14px',background:'var(--surface-muted)',borderRadius:10,border:'1px dashed var(--border)',fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
                {tr('ផ្លាស់​រូប​ចាស់៖ ផ្ទេរ​រូប/ឯកសារ base64 ដែល​មាន​ស្រាប់​ទៅ Storage ដើម្បី​បង្រួម database (ត្រូវ​បាន​បង្កើត bucket “media” សិន)។',
                    'Move old images: upload existing base64 photos/files to Storage to shrink the database (create the “media” bucket first).')}
              </div>
              <Btn kind="ghost" size="lg" onClick={migrateMedia} style={migBusy?{opacity:.6,pointerEvents:'none',justifyContent:'center'}:{justifyContent:'center'}}>
                {migBusy
                  ? (migProg && migProg.total ? `🖼 ${migProg.done}/${migProg.total}…` : tr('🖼 កំពុង​ផ្លាស់…','🖼 Migrating…'))
                  : tr('🖼 ផ្លាស់​រូប​ចាស់​ទៅ Storage','🖼 Move old images to Storage')}
              </Btn>

              {/* Usage */}
              <div style={{borderTop:'1px solid var(--border)',paddingTop:14,marginTop:4}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:700}}>{tr('ការ​ប្រើ​ប្រាស់','Usage')}</div>
                  <Btn kind="ghost" size="sm" onClick={loadUsage} style={usageBusy?{opacity:.6,pointerEvents:'none'}:{}}>
                    {usageBusy ? tr('កំពុង…','…') : tr('↻ ផ្ទុក​ឡើង​វិញ','↻ Refresh')}
                  </Btn>
                </div>

                {/* Storage (real) */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                    <span style={{color:'var(--ink-2)'}}>📦 Storage {usage ? `· ${usage.files} ${tr('ឯកសារ','files')}` : ''}</span>
                    <span style={{fontWeight:600}}>{usage ? `${fmtBytes(usage.bytes)} / 1 GB` : (usageBusy ? '…' : '—')}</span>
                  </div>
                  {usage && <UsageBar used={usage.bytes} limit={STORAGE_LIMIT} color="var(--accent)"/>}
                </div>

                {/* Database (estimate) */}
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                    <span style={{color:'var(--ink-2)'}}>🗄 {tr('Database (ប៉ាន់ស្មាន)','Database (est.)')}</span>
                    <span style={{fontWeight:600}}>~{fmtBytes(dbBytes)} / 500 MB</span>
                  </div>
                  <UsageBar used={dbBytes} limit={DB_LIMIT} color="var(--good)"/>
                </div>

                {/* Egress — not available via API */}
                <div style={{padding:'9px 12px',background:'var(--surface-muted)',borderRadius:8,fontSize:11,color:'var(--ink-3)',lineHeight:1.6,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span>📊 {tr('Egress (ទាញ​ចេញ/ខែ) មើល​បាន​តែ​នៅ Dashboard','Egress (per month) is only visible on the Dashboard')}</span>
                  <button onClick={()=>window.open(window.__sbDashboardUsageUrl(),'_blank')}
                    style={{border:'1px solid var(--accent)',background:'var(--surface)',color:'var(--accent)',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    ↗ {tr('បើក Dashboard','Open Dashboard')}
                  </button>
                </div>
                <div style={{fontSize:10,color:'var(--ink-3)',marginTop:6}}>
                  {tr('Free: ~5GB egress · 1GB storage · 500MB database ក្នុង​មួយ​ខែ','Free: ~5GB egress · 1GB storage · 500MB database per month')}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Auto-backup to folder */}
      <Card>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(34,197,94,.12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="refresh" size={18} stroke={1.5} color="var(--good)"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{tr('Backup ស្វ័យប្រវត្តិ','Auto-backup')}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{tr('save ជា anzen-backup.json រៀងរាល់ពេលមានការផ្លាស់ប្ដូរ','Saves anzen-backup.json to a folder on every data change')}</div>
            </div>
          </div>

          {!abSupported && (
            <div style={{padding:'10px 14px',background:'var(--surface-muted)',borderRadius:8,fontSize:12,color:'var(--ink-3)'}}>
              ⚠️ {tr('Browser របស់លោកអ្នក​មិន​គាំទ្រ​មុខ​ងារ​នេះ​ទេ (ប្រើ Chrome / Edge)','Your browser does not support this feature (use Chrome or Edge)')}
            </div>
          )}

          {abSupported && folderName && (
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(34,197,94,.08)',borderRadius:8,border:'1px solid rgba(34,197,94,.2)'}}>
              <Icon name="check" size={15} color="var(--good)" stroke={2.5}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:'var(--good)',fontWeight:600}}>{tr('កំពុង​ backup ទៅ','Backing up to')} <span style={{fontFamily:'"JetBrains Mono",monospace'}}>📁 {folderName}/anzen-backup.json</span></div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{tr('រាល់​ពេល​ save ទិន្នន័យ','On every data save')}</div>
              </div>
              <button onClick={handleClearFolder} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink-3)',cursor:'pointer',flexShrink:0}}>
                {tr('ដក​ចេញ','Remove')}
              </button>
            </div>
          )}

          {abSupported && (
            <Btn kind={folderName ? 'ghost' : 'primary'} size="lg" icon={<Icon name="map" size={15}/>} onClick={handlePickFolder}>
              {folderName ? tr('ប្ដូរ​ Folder…','Change folder…') : tr('ជ្រើស​ Folder…','Choose folder…')}
            </Btn>
          )}
        </div>
      </Card>

      <Card>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="download" size={18} stroke={1.5} color="var(--accent)"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{tr('Export ទិន្នន័យ','Export data')}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{tr('ទាញយក​ backup ជា​ file JSON','Download a JSON backup file')}</div>
            </div>
          </div>
          {dataSize && (
            <div style={{display:'flex',gap:20,padding:'10px 14px',background:'var(--surface-muted)',borderRadius:8}}>
              <div><div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',letterSpacing:'.05em'}}>Size</div><div style={{fontSize:15,fontWeight:600}}>{dataSize.kb} KB</div></div>
              <div><div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',letterSpacing:'.05em'}}>{tr('សិស្ស','Students')}</div><div style={{fontSize:15,fontWeight:600}}>{dataSize.students}</div></div>
              <div><div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',letterSpacing:'.05em'}}>{tr('មេរៀន','Lessons')}</div><div style={{fontSize:15,fontWeight:600}}>{dataSize.lessons}</div></div>
              <div><div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',letterSpacing:'.05em'}}>{tr('វិក្កយបត្រ','Invoices')}</div><div style={{fontSize:15,fontWeight:600}}>{dataSize.invoices}</div></div>
            </div>
          )}
          <Btn kind="primary" size="lg" icon={<Icon name="download" size={15}/>} onClick={handleExport}>
            {tr('ទាញ​យក​ Backup','Download backup')}
          </Btn>
        </div>
      </Card>

      <Card>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(176,65,62,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="upload" size={18} stroke={1.5} color="var(--danger)"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{tr('Import ទិន្នន័យ','Import data')}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{tr('ដំឡើង​ backup ពី​ file JSON — នឹង​ replace ទិន្នន័យ​ទាំង​អស់','Restore from JSON — replaces all current data')}</div>
            </div>
          </div>
          <div style={{padding:'10px 14px',background:'rgba(176,65,62,.06)',borderRadius:8,border:'1px solid rgba(176,65,62,.15)',fontSize:12,color:'var(--danger)'}}>
            ⚠️ {tr('ការ Import នឹង​លុប​ទិន្នន័យ​បច្ចុប្បន្ន​ទាំង​អស់ ហើយ​ reload ទំព័រ​ភ្លាម','Importing will erase all current data and reload the page immediately')}
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImport}/>
          <Btn kind="ghost" size="lg" icon={<Icon name="upload" size={15}/>} onClick={()=>fileRef.current?.click()}>
            {tr('ជ្រើស​ file JSON…','Choose JSON file…')}
          </Btn>
        </div>
      </Card>

      {/* Translation Export / Import */}
      <Card>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(59,122,87,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name="globe" size={18} stroke={1.5} color="#3B7A57"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{tr('ការ​បក​ប្រែ​ភាសា','Translations')}</div>
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{tr('ទាញ​យក​គូ​ភាសា​ខ្មែរ-អង់គ្លេស ដើម្បី​ពិនិត្យ​និង​កែ​តម្រូវ','Download KM/EN string pairs, correct them, then re-import')}</div>
            </div>
          </div>

          {trOverrideCount > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(59,122,87,.08)',borderRadius:8,border:'1px solid rgba(59,122,87,.2)'}}>
              <Icon name="check" size={15} color="#3B7A57" stroke={2.5}/>
              <div style={{flex:1,fontSize:12,color:'#3B7A57',fontWeight:600}}>
                {tr(`ការ​បក​ប្រែ​ ${trOverrideCount} ត្រូវ​បាន​សម្រួល​ (active)`, `${trOverrideCount} translation override(s) active`)}
              </div>
              <button onClick={handleResetTranslations} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink-3)',cursor:'pointer',flexShrink:0}}>
                {tr('ដក​ចេញ','Reset')}
              </button>
            </div>
          )}

          <div style={{padding:'10px 14px',background:'var(--surface-muted)',borderRadius:8,fontSize:12,color:'var(--ink-3)',lineHeight:1.6}}>
            <div style={{fontWeight:600,marginBottom:4,color:'var(--ink-2)'}}>{tr('របៀប​ប្រើ','How to use')}</div>
            <div>1. {tr('ចុច Export ដើម្បី​ទាញ​យក​ file JSON ដែល​មាន​ការ​បក​ប្រែ​ទាំង​អស់', 'Click Export to download a JSON file with all KM/EN pairs')}</div>
            <div>2. {tr('កែ​តម្រូវ​ភាសា​ខ្មែរ​ក្នុង​ col "translations"', 'Edit the Khmer values in the "translations" object')}</div>
            <div>3. {tr('ចុច Import ដើម្បី​ប្រើ​ការ​បក​ប្រែ​ថ្មី (ដោយ​មិន​ reload ទំព័រ)', 'Click Import to apply — no page reload needed')}</div>
          </div>

          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Btn kind="primary" size="lg" icon={<Icon name="download" size={15}/>} onClick={handleExportTranslations}>
              {tr('Export ការ​បក​ប្រែ','Export translations')}
            </Btn>
            <Btn kind="ghost" size="lg" icon={<Icon name="upload" size={15}/>} onClick={()=>trFileRef.current?.click()}>
              {tr('Import ការ​បក​ប្រែ','Import translations')}
            </Btn>
          </div>
          <input ref={trFileRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImportTranslations}/>
        </div>
      </Card>
    </div>
  );
};

Object.assign(window, { SettingsScreen });
