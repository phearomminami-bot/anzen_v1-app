// nav.jsx — Sidebar, Topbar, Tabs variants + UserPill

// ─── Drag-reorder hook (used by all nav variants) ───
const useDragOrder = (onReorder) => {
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);

  const dragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const dragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIdx !== idx) setOverIdx(idx);
  };
  const drop = (e, idx) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) onReorder?.(dragIdx, idx);
    setDragIdx(null); setOverIdx(null);
  };
  const dragEnd = () => { setDragIdx(null); setOverIdx(null); };

  return { dragIdx, overIdx, dragStart, dragOver, drop, dragEnd };
};

// ─── Grip handle icon ───
const GripDots = ({ style = {} }) => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"
    style={{ flexShrink:0, opacity:.25, transition:'opacity .12s', cursor:'grab', ...style }}>
    <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
    <circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/>
    <circle cx="3" cy="11" r="1.5"/><circle cx="7" cy="11" r="1.5"/>
  </svg>
);

const NAV_ITEMS = {
  admin: [
    { id:'dashboard',   km:'ផ្ទាំងគ្រប់គ្រង',       en:'Dashboard',          jp:'ダッシュボード',   icon:'home' },
    { id:'students',    km:'សិស្ស',                 en:'Students',           jp:'生徒管理',         icon:'users' },
    { id:'lessons',     km:'មេរៀន',                 en:'Lessons',            jp:'レッスン',         icon:'book' },
    { id:'schedule',    km:'កាលវិភាគ',              en:'Schedule',           jp:'スケジュール',     icon:'cal' },
    { id:'instructors', km:'គ្រូ',                  en:'Instructors',        jp:'インストラクター', icon:'cap' },
    { id:'fleet',       km:'ការគ្រប់គ្រងយានយន្ត',    en:'Vehicle management', jp:'車両管理',         icon:'car' },
    { id:'vehicle',     km:'យានយន្ត',               en:'Vehicle',            jp:'車両',             icon:'wheel' },
    { id:'progress',    km:'វឌ្ឍនភាព',              en:'Progress',           jp:'進捗',             icon:'trend' },
    { id:'billing',     km:'វិក្កយបត្រ',             en:'Billing',            jp:'請求管理',         icon:'receipt' },
    { id:'finance',     km:'គ្រប់គ្រងហិរញ្ញវត្ថុ',   en:'Finance',            jp:'財務管理',         icon:'wallet' },
    { id:'analytics',   km:'ការវិភាគ',              en:'Analytics',          jp:'分析',             icon:'chart' },
    { id:'scores',      km:'តារាងពិន្ទុ',            en:'Scores',             jp:'成績表',           icon:'sheet' },
    { id:'stock',       km:'គ្រប់គ្រងស្តុក',         en:'Stock',              jp:'在庫管理',         icon:'box' },
    { id:'staff',       km:'គ្រប់​គ្រង​បុគ្គលិក',    en:'Staff',              jp:'スタッフ管理',     icon:'briefcase' },
    { id:'announce',    km:'ការជូនដំណឹង',           en:'Announcements',      jp:'お知らせ',         icon:'megaphone' },
    { id:'booking',     km:'ការកក់',                en:'Booking flow',       jp:'予約',             icon:'clipboard' },
    { id:'settings',    km:'ការ​កំណត់',              en:'Settings',           jp:'設定',             icon:'settings' },
  ],
  instructor: [
    { id:'dashboard',   km:'ផ្ទាំងគ្រប់គ្រង',       en:'Dashboard',          jp:'ダッシュボード',   icon:'home' },
    { id:'students',    km:'សិស្ស',                 en:'Students',           jp:'生徒管理',         icon:'users' },
    { id:'lessons',     km:'មេរៀន',                 en:'Lessons',            jp:'レッスン',         icon:'book' },
    { id:'schedule',    km:'កាលវិភាគ',              en:'Schedule',           jp:'スケジュール',     icon:'cal' },
    { id:'instructors', km:'គ្រូ',                  en:'Instructors',        jp:'インストラクター', icon:'cap' },
    { id:'fleet',       km:'ការគ្រប់គ្រងយានយន្ត',    en:'Vehicle management', jp:'車両管理',         icon:'car' },
    { id:'vehicle',     km:'យានយន្ត',               en:'Vehicle',            jp:'車両',             icon:'wheel' },
    { id:'progress',    km:'វឌ្ឍនភាព',              en:'Progress',           jp:'進捗',             icon:'trend' },
    { id:'billing',     km:'វិក្កយបត្រ',             en:'Billing',            jp:'請求管理',         icon:'receipt' },
    { id:'finance',     km:'គ្រប់គ្រងហិរញ្ញវត្ថុ',   en:'Finance',            jp:'財務管理',         icon:'wallet' },
    { id:'staff',       km:'គ្រប់​គ្រង​បុគ្គលិក',    en:'Staff',              jp:'スタッフ管理',     icon:'briefcase' },
    { id:'announce',    km:'ការជូនដំណឹង',           en:'Announcements',      jp:'お知らせ',         icon:'megaphone' },
    { id:'booking',     km:'ការកក់',                en:'Booking flow',       jp:'予約',             icon:'clipboard' },
    { id:'settings',    km:'ការ​កំណត់',              en:'Settings',           jp:'設定',             icon:'settings' },
  ],
  student: [
    { id:'dashboard',   km:'ទំព័រដើម',              en:'Home',               jp:'ホーム',           icon:'home' },
    { id:'lessons',     km:'មេរៀន',                 en:'Lessons',            jp:'レッスン',         icon:'book' },
    { id:'schedule',    km:'កាលវិភាគ',              en:'My schedule',        jp:'授業',             icon:'cal' },
    { id:'myprofile',   km:'សិស្ស',                 en:'My profile',         jp:'プロフィール',     icon:'users' },
    { id:'progress',    km:'វឌ្ឍនភាព',              en:'My progress',        jp:'進捗',             icon:'trend' },
    { id:'billing',     km:'ការទូទាត់',              en:'Payments',           jp:'支払い',           icon:'receipt' },
    { id:'booking',     km:'កក់មេរៀន',              en:'Book lesson',        jp:'レッスン予約',     icon:'star' },
    { id:'settings',    km:'ការ​កំណត់',              en:'Settings',           jp:'設定',             icon:'settings' },
  ],
};

const ROLE_LABELS = {
  admin:      { km:'អ្នកគ្រប់គ្រង', en:'Admin',       jp:'管理者' },
  instructor: { km:'គ្រូបង្រៀន',     en:'Instructor',  jp:'講師' },
  student:    { km:'សិស្ស',          en:'Student',     jp:'生徒' },
};

// ─── UserPill — current user + logout dropdown ───
const UserPill = ({ role, onLogout, compact = false }) => {
  const { toast, navigate, confirm, tr, lang } = useAppActions();
  const u = (() => {
    if (role === 'instructor') {
      if (window.__loggedInInstructorData) return window.__loggedInInstructorData;
      if (window.__loggedInInstructorId) {
        const sf = (window.__staffData || []).find(s => s.instId === window.__loggedInInstructorId || s.id === window.__loggedInInstructorId);
        if (sf) return { km: sf.name, en: sf.en, title: sf.roleKm ? sf.roleKm + ' · ' + sf.role : sf.role, avatar: sf.photo };
        const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === window.__loggedInInstructorId);
        if (inst) return { km: inst.name, en: inst.en, title: inst.role || 'Instructor', avatar: inst.photo || 'inst-1' };
      }
    }
    return LOGIN_USERS[role] || LOGIN_USERS.admin;
  })();
  const r = ROLE_LABELS[role] || ROLE_LABELS.admin;
  const ll = (o) => o[lang] || o.en;
  const tt = tr || ((km, en, jp) => lang === 'jp' ? (jp || en) : lang === 'en' ? en : km);

  const handleLogout = () => confirm?.({
    title: tt('ចេញ​​ពី​​​​គណនី?','Sign out?','サインアウト？'),
    body:  tt('អ្នក​នឹង​​ត្រូវ​ ​ចូល​គណនី​ម្ដង​ទៀត​ដើម្បី​បន្ត​ប្រើ​ប្រាស់​​​​។','You will need to sign in again to continue.','再度サインインが必要になります。'),
    confirmText: tt('ចេញ','Sign out','サインアウト'),
    onConfirm: () => { onLogout(); toast?.(tt('បាន​​ចេញ​ដោយ​ជោគជ័យ','Signed out','サインアウトしました'),'neutral'); },
  });

  const menu = (
    <>
      <MenuLabel>{ll(u)}</MenuLabel>
      <MenuItem icon="users"    onClick={()=>navigate?.('settings')}>{tt('ប្រវត្តិ​​រូប','Profile','プロフィール')}</MenuItem>
      <MenuItem icon="settings" onClick={()=>navigate?.('settings')}>{tt('ការ​កំណត់','Settings','設定')}</MenuItem>
      <MenuDivider/>
      <MenuItem icon="arrow" onClick={handleLogout} danger>{tt('ចេញ','Sign out','サインアウト')}</MenuItem>
    </>
  );

  if (compact) {
    return (
      <div style={{display:'flex',alignItems:'center',gap:6,width:'100%'}}>
        <Dropdown align="left" width={220} dropUp trigger={
          <button style={{
            display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0,
            background:'transparent',border:'none',padding:0,cursor:'pointer',font:'inherit',color:'inherit',
          }}>
            <Avatar tag={u.avatar} size={32}/>
            <div style={{flex:1,minWidth:0,textAlign:'left'}}>
              <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ll(u)}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{ll(r)}</div>
            </div>
          </button>
        }>{menu}</Dropdown>
        {/* Direct logout button — always visible */}
        <button onClick={handleLogout} title={tt('ចេញ','Sign out')} style={{
          flexShrink:0,width:30,height:30,borderRadius:8,
          border:'1px solid var(--border)',background:'transparent',
          display:'flex',alignItems:'center',justifyContent:'center',
          cursor:'pointer',color:'var(--ink-3)',transition:'all .12s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--danger)';e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='var(--danger)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--ink-3)';e.currentTarget.style.borderColor='var(--border)';}}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
        {/* Build version — after the logout button; confirms which version is live */}
        {window.__ANZEN_VERSION && <span style={{flexShrink:0,fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{window.__ANZEN_VERSION}</span>}
      </div>
    );
  }

  return (
    <Dropdown align="right" width={220} trigger={
      <button style={{
        display:'flex',alignItems:'center',gap:10,
        padding:'5px 10px 5px 5px',
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:999, cursor:'pointer',font:'inherit',color:'inherit',
      }}>
        <Avatar tag={u.avatar} size={28}/>
        <div style={{lineHeight:1.15,textAlign:'left'}}>
          <div style={{fontSize:12,fontWeight:600}}>{ll(u)}</div>
          <div style={{fontSize:10,color:'var(--ink-3)'}}>{ll(r)}</div>
        </div>
        <Icon name="chev" size={12} stroke={2}/>
      </button>
    }>{menu}</Dropdown>
  );
};

// ─── Dark/Light toggle button ───
const DarkToggleBtn = () => {
  const { dark, toggleDark, lang } = useAppActions();
  return (
    <button
      onClick={toggleDark}
      title={dark
        ? (lang==='km'?'ប្ដូរ​ទៅ​ភ្លឺ':lang==='jp'?'ライトモード':'Switch to light')
        : (lang==='km'?'ប្ដូរ​ទៅ​ងងឹត':lang==='jp'?'ダークモード':'Switch to dark')}
      style={{
        width:32, height:32, borderRadius:8, flexShrink:0,
        border:'1px solid var(--border)', background:'var(--surface-muted)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', color:'var(--ink-2)', transition:'all .15s',
      }}
      onMouseEnter={e=>{e.currentTarget.style.background='var(--border)';e.currentTarget.style.color='var(--ink)';}}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-muted)';e.currentTarget.style.color='var(--ink-2)';}}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
};

// ─── Mobile bottom bar ───
// Compact labels for the cramped bottom tab bar (full names live in the menu).
const BAR_SHORT = {
  dashboard:{km:'ដើម',en:'Home'}, students:{km:'សិស្ស',en:'Students'},
  lessons:{km:'មេរៀន',en:'Lessons'}, schedule:{km:'កាលវិភាគ',en:'Schedule'},
  instructors:{km:'គ្រូ',en:'Tutors'}, vehicle:{km:'យានយន្ត',en:'Vehicle'},
  myprofile:{km:'សិស្ស',en:'Profile'},
  fleet:{km:'យានយន្ត',en:'Fleet'}, progress:{km:'វឌ្ឍនភាព',en:'Progress'},
  billing:{km:'វិក្កយបត្រ',en:'Billing'}, finance:{km:'ហិរញ្ញវត្ថុ',en:'Finance'},
  staff:{km:'បុគ្គលិក',en:'Staff'}, settings:{km:'កំណត់',en:'Settings'},
  announce:{km:'ដំណឹង',en:'News'},
};

// Shared mobile header — logo + school name + theme/language toggles.
// Used in the "More" menu and (with showDate) atop the dashboard.
// ── Notifications ────────────────────────────────────────────────────────────
// A live alert feed shown from a bell in the header: student schedule reminders
// (lessons / exams / applications happening TOMORROW), low-stock warnings, and
// vehicle document reminders (1 month) / warnings (1 week). Reminder wording is
// configurable in Settings (notifTemplates.reminder). Dismissed alerts hide for
// 24h; schedule reminders naturally clear once the day passes.
const NOTIF_DISMISS_KEY = 'anzen_notif_dismissed';
const __khDigit = { '0':'០','1':'១','2':'២','3':'៣','4':'៤','5':'៥','6':'៦','7':'៧','8':'៨','9':'៩' };
const khNum = (s) => String(s).replace(/[0-9]/g, d => __khDigit[d]);
const __localDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
// Dates in notifications use Khmer wording with Latin numerals
// ("ទី 11 ខែ 7 ឆ្នាំ 2026"); times use Latin ("10:00–12:00").
const notifDateLabel = (ds) => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(ds||'')) return ds||'';
  const [y,m,d] = ds.split('-');
  return `ទី ${+d} ខែ ${+m} ឆ្នាំ ${y}`;
};
const notifTimeRange = (startHHMM, lenH) => {
  const sh = parseInt(String(startHHMM).split(':')[0]) || 0;
  const sm = String(startHHMM).includes(':') ? String(startHHMM).split(':')[1] : '00';
  const eh = sh + (parseFloat(lenH) || 2);
  const pad = (n) => String(Math.floor(n)).padStart(2,'0');
  return `${pad(sh)}:${sm}–${pad(eh)}:00`;
};
const NOTIF_LOC = {
  school:{km:'សាលា',en:'School'}, yard:{km:'ទីលាន​ហាត់',en:'Training course'},
  apply:{km:'កន្លែង​ដាក់​ពាក្យ',en:'Application centre'}, exam:{km:'កន្លែង​ប្រឡង',en:'Exam centre'},
  classA:{km:'Class A',en:'Class A'}, classB:{km:'Class B',en:'Class B'}, classC:{km:'Class C',en:'Class C'},
};
const NOTIF_DEFAULT_TMPL = {
  km: 'សួស្ដី {student} 👋 នៅ​ថ្ងៃ​ស្អែក {date} វេលា​ម៉ោង {time} {activity}​នៅ {location}។',
  en: 'Hi {student} 👋 Tomorrow {date} at {time}, {activity} at {location}.',
};
const notifStock = (it) => (it.moves||[]).reduce((a,m)=> a + (m.type==='in'?m.qty:(m.type==='order'&&m.received)?m.qty:m.type==='out'?-m.qty:0), 0);

// Build every currently-active alert. Pure — reads live globals, returns a list.
// opts.role/opts.studentId: a student only gets their OWN schedule reminders —
// no stock or vehicle alerts, and no other students' schedules.
const computeAlerts = (lang, tr, opts = {}) => {
  const isStudent = opts.role === 'student';
  const myId = opts.studentId || null;
  const out = [];
  const now = new Date();
  const today = __localDate(now);
  const tmr = new Date(now); tmr.setDate(tmr.getDate()+1);
  const tomorrow = __localDate(tmr);
  const ss = window.__schoolSettings || {};
  const tmpl = (ss.notifTemplates && ss.notifTemplates.reminder) || NOTIF_DEFAULT_TMPL;
  const base = tmpl[lang] || tmpl.km || NOTIF_DEFAULT_TMPL.km;
  const students = window.STUDENTS || [];
  const sName = (id) => { const s = students.find(x=>x.id===id); return s ? (lang==='km' ? s.name : (s.en||s.name)) : ''; };
  const locName = (k) => { const o = NOTIF_LOC[k]; return o ? o[lang]||o.en : ''; };
  const fill = (student, date, time, activity, location) => base
    .replace(/\{student\}/g, student).replace(/\{date\}/g, date).replace(/\{time\}/g, time)
    .replace(/\{activity\}/g, activity).replace(/\{location\}/g, location);

  // ── Schedule reminders (events tomorrow) ──
  const ACT = { lesson:{km:'រៀន',en:'lesson'}, exam:{km:'ប្រឡង',en:'exam'}, apply:{km:'ដាក់​ពាក្យ',en:'application'} };
  (window.LESSONS || []).filter(l => l.date === tomorrow && l.status !== 'cancelled' && l.studentId && l.studentId !== '—' && (!isStudent || l.studentId === myId)).forEach(l => {
    const nm = sName(l.studentId); if (!nm) return;
    const loc = locName(l.pickup) || l.location || locName('school');
    out.push({ id:'sched-'+(l.id||`${l.date}-${l.h}-${l.studentId}`), kind:'schedule', severity:'info', icon:'📅',
      title:`${nm} · ${tr('រៀន','Lesson')}`,
      body: fill(nm, notifDateLabel(tomorrow,lang), notifTimeRange(String(l.h).padStart(2,'0')+':00', l.len, lang), (ACT.lesson[lang]||ACT.lesson.km), loc) });
  });
  ((ss.scheduleExams)||[]).filter(e => e.date === tomorrow).forEach(e => {
    const isApply = e.kind === 'apply';
    const act = isApply ? ACT.apply : ACT.exam;
    const loc = isApply ? locName('apply') : locName('exam');
    (e.studentIds||[]).forEach(sid => { if (isStudent && sid !== myId) return; const nm = sName(sid); if (!nm) return;
      out.push({ id:`sched-${e.id||e.date}-${sid}`, kind:'schedule', severity: isApply?'info':'info', icon: isApply?'📝':'🎓',
        title:`${nm} · ${isApply?tr('ដាក់​ពាក្យ','Apply'):tr('ប្រឡង','Exam')}`,
        body: fill(nm, notifDateLabel(tomorrow,lang), notifTimeRange(e.time||'08:00', e.len, lang), (act[lang]||act.km), loc) });
    });
  });

  // Students only ever see their own schedule — stop here for them.
  if (isStudent) { const rank1 = { danger:0, warn:1, info:2 }; return out.sort((a,b)=> (rank1[a.severity]-rank1[b.severity])); }

  // ── Low-stock alerts ──
  ((ss.inventory)||[]).forEach(it => {
    const stk = notifStock(it);
    if ((it.minStock||0) > 0 && stk <= it.minStock) {
      out.push({ id:'stock-'+it.id, kind:'stock', severity:'warn', icon:'📦',
        title:`${tr('ស្តុក​ជិត​អស់','Low stock')} · ${it.name}`,
        body: tr(`${it.name} នៅ​សល់ ${stk} ${it.unit||''} (កំណត់ ${it.minStock})។ គួរ​ដាក់​កម្មង់​បន្ថែម។`,
                 `${it.name} down to ${stk} ${it.unit||''} (min ${it.minStock}). Time to reorder.`) });
    }
  });

  // ── Vehicle document reminders ──
  const daysUntil = (ds) => { if (!/^\d{4}-\d{2}-\d{2}/.test(ds||'')) return null; const t = new Date(ds+'T00:00:00'); return Math.round((t - new Date(today+'T00:00:00'))/86400000); };
  const DOCS = [
    { f:'reg_exp',  km:'ឆៀក​ឡាន',       en:'Inspection' },
    { f:'road_tax', km:'បង់​ពន្ធ​ផ្លូវ',  en:'Road tax' },
    { f:'ins_exp',  km:'ធានា​រ៉ាប់រង',    en:'Insurance' },
    { f:'oil_exp',  km:'ប្ដូរ​ប្រេង',      en:'Oil change' },
  ];
  (window.VEHICLES || []).forEach(v => {
    DOCS.forEach(doc => {
      const dy = daysUntil(v[doc.f]);
      if (dy == null || dy > 30) return;
      const label = tr(doc.km, doc.en);
      const plate = v.plate || v.id;
      let severity, msg;
      if (dy < 0)       { severity='danger'; msg = tr(`${label} របស់ ${plate} បាន​ផុត​កំណត់ ${Math.abs(dy)} ថ្ងៃ​មុន!`, `${label} for ${plate} expired ${Math.abs(dy)} days ago!`); }
      else if (dy <= 7) { severity='danger'; msg = tr(`⚠ ជិត​ដល់​ថ្ងៃ ${label} របស់ ${plate} — នៅ ${dy} ថ្ងៃ​ទៀត។`, `⚠ ${label} for ${plate} due in ${dy} day(s).`); }
      else              { severity='warn';   msg = tr(`${label} របស់ ${plate} ជិត​ដល់ — នៅ ${dy} ថ្ងៃ​ទៀត។`, `${label} for ${plate} in ${dy} days.`); }
      out.push({ id:`veh-${v.id}-${doc.f}`, kind:'vehicle', severity, icon: severity==='danger'?'🚨':'🚗',
        title:`${plate} · ${label}`, body: msg });
    });
  });

  const rank = { danger:0, warn:1, info:2 };
  return out.sort((a,b)=> (rank[a.severity]-rank[b.severity]));
};

const NotificationBell = () => {
  const { tr, lang, toast, role, studentId } = useAppActions();
  const [open, setOpen] = React.useState(false);
  const [tick, setTick] = React.useState(0);   // re-render on dismiss
  const [copiedId, setCopiedId] = React.useState(null);
  const readDismissed = () => { try { const o = JSON.parse(localStorage.getItem(NOTIF_DISMISS_KEY)||'{}'); const now=Date.now(); const c={}; Object.entries(o).forEach(([k,v])=>{ if(v>now) c[k]=v; }); return c; } catch(e){ return {}; } };
  const dismiss = (id) => { const c = readDismissed(); c[id] = Date.now()+24*3600*1000; try { localStorage.setItem(NOTIF_DISMISS_KEY, JSON.stringify(c)); } catch(e){} setTick(t=>t+1); };
  // Tap a message to copy it. Runs synchronously inside the click gesture so it
  // works on iOS Safari (which blocks clipboard writes from delayed callbacks).
  // Uses an execCommand selection (most compatible on mobile) plus the async API.
  const copyText = (text, id) => {
    let ok = false;
    try {
      const el = document.createElement('textarea');
      el.value = text; el.readOnly = false; el.contentEditable = 'true';
      el.style.position = 'fixed'; el.style.top = '0'; el.style.left = '0'; el.style.opacity = '0'; el.style.fontSize = '16px';
      document.body.appendChild(el);
      const range = document.createRange(); range.selectNodeContents(el);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      el.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
      document.body.removeChild(el);
    } catch (e) {}
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(()=>{}, ()=>{}); ok = true; } } catch (e) {}
    setCopiedId(id); setTimeout(()=>setCopiedId(c=>c===id?null:c), 1400);
    toast && toast(ok ? tr('បាន​ចម្លង​សារ ✓','Message copied ✓') : tr('សូម​ចុច​សង្កត់​លើ​សារ​ដើម្បី​ជ្រើស','Long-press the text to select & copy'), ok?'good':'warn');
  };
  const dismissed = readDismissed();
  const alerts = computeAlerts(lang, tr, { role, studentId }).filter(a => !dismissed[a.id]);
  const n = alerts.length;
  const sevColor = { danger:'#B0413E', warn:'#C98A12', info:'var(--accent)' };
  const sq = { width:40, height:40, borderRadius:10, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative', color:'var(--ink-2)' };
  return (
    <div style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} aria-label={tr('ការ​ជូន​ដំណឹង','Notifications')} title={tr('ការ​ជូន​ដំណឹង','Notifications')} style={sq}>
        <Icon name="bell" size={20}/>
        {n > 0 && <span style={{ position:'absolute', top:5, right:6, minWidth:16, height:16, padding:'0 4px', borderRadius:999, background:'#B0413E', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"JetBrains Mono",monospace', border:'2px solid var(--surface)' }}>{n>9?'9+':n}</span>}
      </button>
      {open && (<>
        <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:300 }}/>
        {/* Pinned to the viewport's right edge (not the bell) so it never spills off-screen on a phone. */}
        <div style={{ position:'fixed', top:'calc(58px + env(safe-area-inset-top,0px))', right:8, left:'auto', zIndex:301,
          width:'min(380px, calc(100vw - 16px))', maxHeight:'calc(100vh - 72px - env(safe-area-inset-top,0px))', display:'flex', flexDirection:'column',
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, boxShadow:'0 16px 40px rgba(20,30,55,.28)', overflow:'hidden' }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <Icon name="bell" size={15}/>
            <span style={{ flex:1, fontSize:14, fontWeight:700, fontFamily:'var(--font-km)' }}>{tr('ការ​ជូន​ដំណឹង','Notifications')}</span>
            <span style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace' }}>{n}</span>
          </div>
          <div style={{ flex:1, minHeight:0, overflowY:'auto' }}>
            {n === 0 ? (
              <div style={{ padding:'32px 20px', textAlign:'center', color:'var(--ink-3)', fontSize:13 }}>
                <div style={{ fontSize:26, marginBottom:8 }}>🔔</div>{tr('គ្មាន​ការ​ជូន​ដំណឹង​ថ្មី','No new notifications')}
              </div>
            ) : alerts.map(a => (
              <div key={a.id} style={{ display:'flex', gap:10, padding:'11px 13px', borderBottom:'1px solid var(--border)', borderLeft:`3px solid ${sevColor[a.severity]}`, background: copiedId===a.id ? 'var(--accent-soft)' : 'transparent', transition:'background .2s' }}>
                <span style={{ fontSize:17, flexShrink:0, lineHeight:1.3 }}>{a.icon}</span>
                <div
                  onClick={()=>copyText(a.body, a.id)}
                  title={tr('ចុច​ដើម្បី​ចម្លង','Tap to copy')}
                  style={{ flex:1, minWidth:0, cursor:'pointer', userSelect:'text', WebkitUserSelect:'text' }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:'var(--ink)' }}>{a.title}</div>
                  <div style={{ fontSize:12, color:'var(--ink-2)', marginTop:2, lineHeight:1.45, fontFamily:'var(--font-km)' }}>{a.body}</div>
                  {copiedId===a.id && <div style={{ fontSize:10.5, color:'var(--accent)', fontWeight:700, marginTop:3 }}>✓ {tr('បាន​ចម្លង','Copied')}</div>}
                </div>
                <button onClick={()=>dismiss(a.id)} aria-label={tr('បិទ','Dismiss')} title={tr('បិទ','Dismiss')} style={{ border:'none', background:'transparent', color:'var(--ink-3)', cursor:'pointer', fontSize:14, flexShrink:0, padding:'0 2px', alignSelf:'flex-start' }}>✕</button>
              </div>
            ))}
          </div>
          {n > 0 && <div style={{ padding:'8px 14px', borderTop:'1px solid var(--border)', fontSize:10.5, color:'var(--ink-3)', textAlign:'center' }}>💡 {tr('ចុច​លើ​សារ​ដើម្បី​ចម្លង','Tap a message to copy it')}</div>}
        </div>
      </>)}
    </div>
  );
};

const MobileAppHeader = ({ title, subtitle }) => {
  const { lang, tr, toast, setLang, dark, toggleDark } = useAppActions();
  const ss = window.__schoolSettings || {};
  const cycleLang = () => {
    const order = ['km','en','jp'];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang && setLang(next);
    toast && toast(next==='km'?'ប្តូរ​ទៅ​ភាសា​ខ្មែរ':next==='jp'?'日本語に切り替えました':'Switched to English','good');
  };
  const heading = title || ss.name || 'Anzen';
  const sq = {width:40,height:40,borderRadius:10,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0};
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,minHeight:40}}>
      <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
        {ss.logo ? <img src={ss.logo} style={{width:30,height:30,borderRadius:7,objectFit:'cover',flexShrink:0}} alt=""/> : <Logo size={30}/>}
        <div style={{minWidth:0}}>
          {/* Khmer glyphs stack vertically — use the body Khmer font and a roomy
              line-height so vowels/subscripts aren't clipped top or bottom. */}
          <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-km),var(--font-en),sans-serif',lineHeight:1.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{heading}</div>
          {subtitle && <div style={{fontSize:12,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',lineHeight:1.3}}>{subtitle}</div>}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
        <NotificationBell/>
        <button onClick={toggleDark} aria-label={tr('ផ្ទៃ​ខ្នង','Theme')} title={dark?tr('ប្ដូរ​ទៅ​ភ្លឺ','Switch to light'):tr('ប្ដូរ​ទៅ​ងងឹត','Switch to dark')} style={{...sq,fontSize:18}}>{dark?'🌙':'☀️'}</button>
        <button onClick={cycleLang} aria-label={tr('ភាសា','Language')} title={tr('ប្ដូរ​ភាសា','Change language')} style={{...sq,color:'var(--ink-2)'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></svg>
        </button>
      </div>
    </div>
  );
};

const MobileBottomBar = ({ items, current, onGo, role, onLogout }) => {
  const { lang, tr, toast, setLang, dark, toggleDark } = useAppActions();
  const ll = (o) => o[lang] || o.en;
  const cycleLang = () => {
    const order = ['km','en','jp'];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang && setLang(next);
    toast && toast(next==='km'?'ប្តូរ​ទៅ​ភាសា​ខ្មែរ':next==='jp'?'日本語に切り替えました':'Switched to English','good');
  };
  const shortLabel = (it) => { const s = BAR_SHORT[it.id]; return (s && (s[lang] || s.en)) || ll(it); };
  const [menuOpen, setMenuOpen] = React.useState(false);
  // Fixed bottom-bar tabs. Students get Home · Lessons · Schedule · My profile
  // (never the directory or vehicles); staff get Home · Students · Schedule · Vehicle.
  const QUICK_IDS = role === 'student'
    ? ['dashboard','lessons','schedule','myprofile']
    : ['dashboard','students','schedule','vehicle'];
  // Only pull from THIS role's own nav items — no cross-role fallback, so a
  // student can never surface an admin-only screen (e.g. vehicles) in the bar.
  const quickItems = QUICK_IDS
    .map(id => items.find(i => i.id === id) || (role !== 'student' && (window.NAV_ITEMS && window.NAV_ITEMS.admin || []).find(i => i.id === id)))
    .filter(Boolean);
  const ss = window.__schoolSettings;
  const close = () => setMenuOpen(false);
  const doRefresh = () => location.reload();   // Refresh = reload the page
  return (
    <>
      {menuOpen && (
        <div style={{position:'fixed',inset:0,background:'var(--bg)',zIndex:200,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',flexShrink:0,background:'var(--surface)'}}>
            <MobileAppHeader/>
          </div>
          <nav style={{flex:1,padding:'10px 14px',overflowY:'auto'}}>
            {items.map(it=>(
              <button key={it.id} onClick={()=>{onGo(it.id);close();}} style={{
                display:'flex',alignItems:'center',gap:14,width:'100%',padding:'13px 14px',marginBottom:4,
                border:'none',background:current===it.id?'var(--surface-muted)':'transparent',
                borderRadius:10,cursor:'pointer',fontSize:16,textAlign:'left',fontFamily:'inherit',
                color:current===it.id?'var(--ink)':'var(--ink-2)',fontWeight:current===it.id?700:500,
              }}>
                <Icon name={it.icon} size={20} stroke={current===it.id?2:1.5}/>
                {ll(it)}
              </button>
            ))}
          </nav>
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',flexShrink:0,paddingBottom:'calc(12px + env(safe-area-inset-bottom,0px))',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <UserPill role={role} onLogout={()=>{close();onLogout();}} compact/>
            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              {/* Refresh (reload) — icon-only, sits just left of Close */}
              <button onClick={doRefresh} aria-label={tr('ផ្ទុក​ឡើង​វិញ','Refresh')} title={tr('ផ្ទុក​ឡើង​វិញ','Refresh')} style={{display:'flex',alignItems:'center',justifyContent:'center',width:44,height:44,padding:0,border:'1px solid var(--border)',background:'var(--surface-muted)',borderRadius:12,cursor:'pointer',color:'var(--ink-2)'}}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
              </button>
              <button onClick={close} aria-label={tr('បិទ','Close')} title={tr('បិទ','Close')} style={{display:'flex',alignItems:'center',justifyContent:'center',width:44,height:44,padding:0,border:'1px solid var(--border)',background:'var(--surface-muted)',borderRadius:12,cursor:'pointer',color:'var(--ink-2)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:100,
        background:'var(--surface)',borderTop:'1px solid var(--border)',
        boxShadow:'0 -1px 12px rgba(0,0,0,.05)',
        display:'flex',alignItems:'stretch',
        paddingBottom:'env(safe-area-inset-bottom,0px)',
      }}>
        {quickItems.map(it=>{
          const on = current===it.id;
          return (
          <button key={it.id} onClick={()=>onGo(it.id)} style={{
            position:'relative',
            flex:1,minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',
            gap:3,border:'none',background:'transparent',cursor:'pointer',padding:'9px 2px 7px',
            color:on?'var(--accent)':'var(--ink-3)',transition:'color .15s',
          }}>
            {on && <span style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:24,height:3,borderRadius:'0 0 3px 3px',background:'var(--accent)'}}/>}
            <Icon name={it.icon} size={21} stroke={on?2.2:1.6}/>
            <span style={{
              fontSize:10,fontWeight:on?600:500,lineHeight:1.12,textAlign:'center',width:'100%',
              display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',
              wordBreak:'break-word',
            }}>{shortLabel(it)}</span>
          </button>
        );})}
        <button onClick={()=>setMenuOpen(true)} style={{
          flex:1,minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',
          gap:3,border:'none',background:menuOpen?'var(--surface-muted)':'transparent',
          cursor:'pointer',padding:'9px 2px 7px',color:menuOpen?'var(--accent)':'var(--ink-3)',transition:'color .15s',
        }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span style={{fontSize:10,fontWeight:menuOpen?600:500,lineHeight:1.12,textAlign:'center'}}>{tr('ទាំងអស់','More','すべて')}</span>
        </button>
      </div>
    </>
  );
};

// ─── Collapse chevron button ───
const CollapseBtn = ({ collapsed, onToggle, style = {} }) => (
  <button
    onClick={onToggle}
    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    style={{
      width:30, height:30, borderRadius:8, flexShrink:0,
      border:'1px solid var(--border)', background:'var(--surface-muted)',
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', color:'var(--ink-3)', transition:'all .15s',
      ...style,
    }}
    onMouseEnter={e=>{e.currentTarget.style.background='var(--border)';e.currentTarget.style.color='var(--ink)';}}
    onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-muted)';e.currentTarget.style.color='var(--ink-3)';}}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {collapsed
        ? <><polyline points="9 18 15 12 9 6"/></>
        : <><polyline points="15 18 9 12 15 6"/></>
      }
    </svg>
  </button>
);

// ─── Sidebar variant ───
const Sidebar = ({ items, current, onGo, role, onLogout, onReorder, collapsed = false, onToggleCollapse }) => {
  const { lang, settingsVersion } = useAppActions();
  const ll = (o) => o[lang] || o.en;
  const ss = window.__schoolSettings;

  if (collapsed) {
    return (
      <aside style={{
        width:56, background:'var(--surface)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', flexShrink:0, alignItems:'center',
        transition:'width .2s',
      }}>
        <button onClick={()=>onGo('dashboard')} style={{padding:'14px 0 10px',display:'flex',alignItems:'center',justifyContent:'center',width:'100%',background:'transparent',border:'none',cursor:'pointer'}}>
          {ss?.logo?<img src={ss.logo} style={{width:26,height:26,borderRadius:6,objectFit:'cover'}} alt=""/>:<Logo size={24}/>}
        </button>
        {onToggleCollapse && (
          <div style={{padding:'0 0 8px'}}>
            <CollapseBtn collapsed={collapsed} onToggle={onToggleCollapse}/>
          </div>
        )}
        <div style={{width:'100%',height:1,background:'var(--border)',flexShrink:0}}/>
        <nav style={{flex:1,padding:'6px 4px',overflowY:'auto',width:'100%'}}>
          {items.map(it=>(
            <button key={it.id} onClick={()=>onGo(it.id)} title={ll(it)} style={{
              width:'100%',height:40,display:'flex',alignItems:'center',justifyContent:'center',
              border:'none',borderRadius:8,cursor:'pointer',marginBottom:2,
              background:current===it.id?'var(--accent-soft)':'transparent',
              color:current===it.id?'var(--accent)':'var(--ink-3)',
            }}>
              <Icon name={it.icon} size={18} stroke={current===it.id?2:1.5}/>
            </button>
          ))}
        </nav>
        <div style={{width:'100%',height:1,background:'var(--border)',flexShrink:0}}/>
        <div style={{padding:'10px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
          <DarkToggleBtn/>
          <button onClick={()=>onLogout()} title="Sign out" style={{border:'none',background:'transparent',cursor:'pointer',padding:0}}>
            <Avatar tag={(role==='instructor'?(window.__loggedInInstructorData||LOGIN_USERS.instructor):LOGIN_USERS[role])?.avatar||LOGIN_USERS[role]?.avatar} size={30}/>
          </button>
        </div>
      </aside>
    );
  }

  const drag = useDragOrder(onReorder);

  return (
  <aside style={{
    width:240, background:'var(--surface)', borderRight:'1px solid var(--border)',
    display:'flex', flexDirection:'column', flexShrink:0,
    transition:'width .2s',
  }}>
    <div style={{display:'flex',alignItems:'center',gap:0}}>
      <button onClick={() => onGo('dashboard')} style={{
        flex:1,minWidth:0,padding:'18px 18px 14px',display:'flex',alignItems:'center',gap:10,
        background:'transparent',border:'none',cursor:'pointer',
        textAlign:'left',font:'inherit',color:'inherit',
      }}>
        {ss?.logo
          ? <img src={ss.logo} style={{width:28,height:28,borderRadius:6,objectFit:'cover',flexShrink:0}} alt="logo"/>
          : <Logo size={28}/>
        }
        <div style={{lineHeight:1.15,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ss?.name || 'Anzen'}</div>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.04em'}}>DRIVE ACADEMY</div>
        </div>
      </button>
      {onToggleCollapse && (
        <div style={{paddingRight:10,flexShrink:0}}>
          <CollapseBtn collapsed={collapsed} onToggle={onToggleCollapse}/>
        </div>
      )}
    </div>
    <Divider/>
    <nav style={{flex:1,padding:'8px 8px',overflow:'auto'}}>
      {items.map((it, idx) => {
        const isDragging = drag.dragIdx === idx;
        const isOver     = drag.overIdx === idx && drag.dragIdx !== null && !isDragging;
        const lineTop    = isOver && idx < drag.dragIdx;
        const lineBot    = isOver && idx > drag.dragIdx;
        return (
          <div key={it.id} style={{position:'relative',opacity:isDragging?.4:1,transition:'opacity .1s'}}
            draggable
            onDragStart={e=>drag.dragStart(e,idx)}
            onDragOver={e=>drag.dragOver(e,idx)}
            onDrop={e=>drag.drop(e,idx)}
            onDragEnd={drag.dragEnd}
          >
            {lineTop && <div style={{position:'absolute',top:0,left:8,right:8,height:2,background:'var(--accent)',borderRadius:1,zIndex:5}}/>}
            <button onClick={() => onGo(it.id)}
              onMouseEnter={e=>{ const g=e.currentTarget.querySelector('svg:first-child'); if(g) g.style.opacity='.7'; }}
              onMouseLeave={e=>{ const g=e.currentTarget.querySelector('svg:first-child'); if(g) g.style.opacity='.25'; }}
              style={{
                display:'flex',alignItems:'center',gap:8,
                width:'100%',padding:'8px 10px',marginBottom:2,
                border:'none', background: current===it.id ? 'var(--surface-muted)' : 'transparent',
                color: current===it.id ? 'var(--ink)' : 'var(--ink-2)',
                borderRadius:8, cursor:'pointer',
                fontSize:13, fontWeight: current===it.id ? 500 : 400,
                textAlign:'left',
              }}>
              <GripDots/>
              <Icon name={it.icon} size={16} stroke={current===it.id ? 2 : 1.5}/>
              <span style={{flex:1}}>{ll(it)}</span>
            </button>
            {lineBot && <div style={{position:'absolute',bottom:0,left:8,right:8,height:2,background:'var(--accent)',borderRadius:1,zIndex:5}}/>}
          </div>
        );
      })}
    </nav>
    <Divider/>
    <div style={{padding:'10px 14px', display:'flex', alignItems:'center', gap:8}}>
      <div style={{flex:1, minWidth:0}}>
        <UserPill role={role} onLogout={onLogout} compact/>
      </div>
      <DarkToggleBtn/>
    </div>
  </aside>
  );
};

// ─── Topbar variant ───
const Topbar = ({ items, current, onGo, role, onLogout, onReorder }) => {
  const { lang } = useAppActions();
  const ll = (o) => o[lang] || o.en;
  const drag = useDragOrder(onReorder);

  return (
  <header style={{
    height:64, background:'var(--surface)', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', padding:'0 24px', gap:24, flexShrink:0,
  }}>
    <button onClick={() => onGo('dashboard')} style={{
      display:'flex',alignItems:'center',gap:10,
      background:'transparent',border:'none',cursor:'pointer',font:'inherit',color:'inherit',
    }}>
      <Logo size={26}/>
      <div style={{fontSize:15,fontWeight:600}}>Anzen</div>
    </button>
    <nav style={{display:'flex',alignItems:'center',gap:2,flex:1,overflow:'auto'}}>
      {items.map((it, idx) => {
        const isDragging = drag.dragIdx === idx;
        const isOver     = drag.overIdx === idx && drag.dragIdx !== null && !isDragging;
        return (
          <div key={it.id} style={{position:'relative',display:'flex',alignItems:'stretch',opacity:isDragging?.4:1,transition:'opacity .1s'}}
            draggable
            onDragStart={e=>drag.dragStart(e,idx)}
            onDragOver={e=>drag.dragOver(e,idx)}
            onDrop={e=>drag.drop(e,idx)}
            onDragEnd={drag.dragEnd}
          >
            {isOver && idx < drag.dragIdx && <div style={{position:'absolute',left:0,top:8,bottom:8,width:2,background:'var(--accent)',borderRadius:1,zIndex:5}}/>}
            <button onClick={() => onGo(it.id)} style={{
              display:'flex',alignItems:'center',gap:5,
              padding:'8px 10px',
              border:'none', background:'transparent',
              color: current===it.id ? 'var(--ink)' : 'var(--ink-3)',
              cursor:'pointer',
              fontSize:13, fontWeight: current===it.id ? 600 : 400,
              borderBottom: current===it.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius:0, height:64, userSelect:'none',
            }}>
              <GripDots style={{transform:'rotate(90deg)'}}/>
              <Icon name={it.icon} size={14}/>
              <span>{ll(it)}</span>
            </button>
            {isOver && idx > drag.dragIdx && <div style={{position:'absolute',right:0,top:8,bottom:8,width:2,background:'var(--accent)',borderRadius:1,zIndex:5}}/>}
          </div>
        );
      })}
    </nav>
    <DarkToggleBtn/>
    <UserPill role={role} onLogout={onLogout}/>
  </header>
  );
};

// ─── Tabs variant ───
const TabsBar = ({ items, current, onGo, role, onLogout, onReorder }) => {
  const { lang } = useAppActions();
  const ll = (o) => o[lang] || o.en;
  const drag = useDragOrder(onReorder);

  return (
  <div style={{flexShrink:0}}>
    <header style={{
      height:56, background:'var(--surface)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', padding:'0 24px', gap:16,
    }}>
      <button onClick={() => onGo('dashboard')} style={{
        display:'flex',alignItems:'center',gap:10,
        background:'transparent',border:'none',cursor:'pointer',font:'inherit',color:'inherit',
      }}>
        <Logo size={26}/>
        <div style={{fontSize:15,fontWeight:600}}>Anzen</div>
      </button>
      <div style={{flex:1}}/>
      <DarkToggleBtn/>
      <UserPill role={role} onLogout={onLogout}/>
    </header>
    <div style={{
      background:'var(--surface-muted)', borderBottom:'1px solid var(--border)',
      padding:'8px 24px', display:'flex', gap:4, overflowX:'auto',
    }}>
      {items.map((it, idx) => {
        const isDragging = drag.dragIdx === idx;
        const isOver     = drag.overIdx === idx && drag.dragIdx !== null && !isDragging;
        return (
          <div key={it.id} style={{position:'relative',display:'flex',opacity:isDragging?.4:1,transition:'opacity .1s'}}
            draggable
            onDragStart={e=>drag.dragStart(e,idx)}
            onDragOver={e=>drag.dragOver(e,idx)}
            onDrop={e=>drag.drop(e,idx)}
            onDragEnd={drag.dragEnd}
          >
            {isOver && idx < drag.dragIdx && <div style={{position:'absolute',left:-2,top:0,bottom:0,width:2,background:'var(--accent)',borderRadius:1,zIndex:5}}/>}
            <button onClick={() => onGo(it.id)} style={{
              display:'inline-flex',alignItems:'center',gap:5,
              padding:'6px 11px',
              border:'1px solid ' + (current===it.id ? 'var(--ink)' : 'var(--border)'),
              background: current===it.id ? 'var(--ink)' : 'var(--surface)',
              color: current===it.id ? 'var(--bg)' : 'var(--ink-2)',
              borderRadius:999, cursor:'pointer',
              fontSize:12, fontWeight:500, whiteSpace:'nowrap', userSelect:'none',
            }}>
              <GripDots style={{
                transform:'rotate(90deg)',
                opacity: current===it.id ? .4 : .2,
                filter: current===it.id ? 'invert(1)' : 'none',
              }}/>
              <Icon name={it.icon} size={13}/>
              {ll(it)}
            </button>
            {isOver && idx > drag.dragIdx && <div style={{position:'absolute',right:-2,top:0,bottom:0,width:2,background:'var(--accent)',borderRadius:1,zIndex:5}}/>}
          </div>
        );
      })}
    </div>
  </div>
  );
};

Object.assign(window, { NAV_ITEMS, ROLE_LABELS, Sidebar, Topbar, TabsBar, UserPill, DarkToggleBtn, MobileAppHeader });
