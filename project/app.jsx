// app.jsx — Shell + router + tweaks + login/auth + global UX state

const FONT_OPTIONS = {
  inter:    { display:'Inter, system-ui, sans-serif',           en:'Inter, system-ui, sans-serif',           label:'Inter' },
  plex:     { display:'"IBM Plex Sans", system-ui, sans-serif', en:'"IBM Plex Sans", system-ui, sans-serif', label:'IBM Plex' },
  fraunces: { display:'Fraunces, Georgia, serif',               en:'Inter, system-ui, sans-serif',           label:'Fraunces × Inter' },
};

const FONT_SIZE_OPTIONS = [
  { v:'sm', label:'តូច',          en:'Small',       px:12, zoom:0.857 },
  { v:'md', label:'ធម្មតា',       en:'Normal',      px:14, zoom:1     },
  { v:'lg', label:'ធំ',           en:'Large',       px:16, zoom:1.143 },
  { v:'xl', label:'ធំ​ណាស់',     en:'Extra large', px:18, zoom:1.286 },
];

const ACCENT_OPTIONS = [
  { v:'#1B3A6B', soft:'#E4EAF4' },   // Anzen logo navy
  { v:'#2A5DB0', soft:'#E5EBF5' },
  { v:'#8B5E34', soft:'#F0E8DE' },
  { v:'#3B7A57', soft:'#E2EFE7' },
  { v:'#B0413E', soft:'#F4DEDD' },
];

const LOGIN_USERS = {
  admin:      { km:'ឆាយ ភារម្យ',        en:'Chhay Phearom', title:'នាយក · School director',                   avatar:'admin'  },
  instructor: { km:'គ្រូបង្រៀន', en:'Instructor', title:'', avatar:'inst-1' },
  student:    { km:'', en:'', title:'', studentId:null, avatar:'port-1' },
};

// helpers to update student user after login
const setLoggedInStudentUser = (s) => {
  LOGIN_USERS.student = {
    km: s.name, en: s.en,
    title: s.cls + ' · ' + s.id,
    studentId: s.id,
    avatar: s.photo,
  };
};

// Global notifications — computed from real data and pushed by real events
if (!window.NOTIFICATIONS) {
  window.NOTIFICATIONS = [];
  // Seed from real data on first load
  const _svcDue = (typeof VEHICLES !== 'undefined' ? VEHICLES : []).filter(v => v.status === 'Service due' || v.status === 'Workshop');
  _svcDue.forEach(v => window.NOTIFICATIONS.push({ tone:'warn', icon:'wrench', km:`${v.plate} ត្រូវ​ការ​ថែទាំ`, en:`${v.plate} needs service`, go:'fleet' }));
  const _overdue = (typeof INVOICES !== 'undefined' ? INVOICES : []).filter(inv => inv.status === 'Overdue');
  _overdue.forEach(inv => window.NOTIFICATIONS.push({ tone:'danger', icon:'cash', km:`${inv.id} ហួស​កាល​កំណត់`, en:`${inv.id} overdue`, go:'billing' }));
  const _exams = (typeof STUDENTS !== 'undefined' ? STUDENTS : []).filter(s => s.status === 'Road exam soon');
  if (_exams.length > 0) window.NOTIFICATIONS.push({ tone:'accent', icon:'flag', km:`ប្រឡង​ផ្លូវ ${_exams.length} នាក់​ខាង​មុខ`, en:`${_exams.length} road exam(s) upcoming`, go:'schedule' });
}

// drawer registry — name → form component
const FORMS = {
  newStudent:     NewStudentForm,
  newLesson:      NewLessonForm,
  newInstructor:  NewInstructorForm,
  newVehicle:     NewVehicleForm,
  newInvoice:     NewInvoiceForm,
  newMaintenance: NewMaintenanceForm,
  newStaff:       NewStaffForm,
};
const FORM_TITLES = {
  newStudent:     { km:'បន្ថែម​សិស្ស​​​​ថ្មី',           en:'New student'      },
  newLesson:      { km:'កក់​មេរៀន​ថ្មី',               en:'New lesson'        },
  newInstructor:  { km:'បន្ថែម​គ្រូ​ថ្មី',             en:'New instructor'    },
  newVehicle:     { km:'បន្ថែម​យានយន្ត​ថ្មី',          en:'New vehicle'       },
  newInvoice:     { km:'បង្កើត​វិក្កយបត្រ​',           en:'New invoice'       },
  newMaintenance: { km:'កក់​ការ​ថែទាំ',                en:'Schedule maintenance'},
  newStaff:       { km:'បន្ថែម​បុគ្គលិក​ថ្មី',         en:'New staff member'  },
};
const FORM_WIDTHS  = { newStudent: 794, newVehicle: 760 };
const FORM_DARK    = new Set(['newVehicle']);

const DETAILS = {
  lesson:       { Component: LessonDetail,      titleFn: () => ({km:'មេរៀន · Lesson',         en:'Lesson detail'   }) },
  student:      { Component: StudentProfile,    titleFn: (d) => ({km:d?.name,                 en:`${d?.id} · ${d?.cls}`}) },
  instructor:   { Component: InstructorProfile, titleFn: (d) => ({km:d?.name,                 en:d?.en}) },
  vehicle:      { Component: VehicleDetail,     titleFn: (d) => ({km:d?.plate || 'Vehicle',   en:d?.make}) },
  invoice:      { Component: InvoicePreview,    titleFn: (d) => ({km:d?.id,                   en:'Invoice'}) },
  staffProfile: { Component: StaffProfile,      titleFn: (d) => ({km:d?.name || 'បុគ្គលិក',   en:d?.en || 'Staff profile'}) },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const bp = useBreakpoint();
  const [authed, setAuthed] = React.useState(false);
  const [current, setCurrent] = React.useState('dashboard');
  const [drawer, setDrawer] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [confirmState, setConfirmState] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  const [curriculumDone, setCurriculumDone] = React.useState(() => window.__savedCurriculumDone || new Set(CURRICULUM_DONE_DEFAULT));
  const [curriculumFeedback, setCurriculumFeedback] = React.useState(() => window.__savedCurriculumFeedback || {});

  React.useEffect(() => {
    const root = document.documentElement;
    const dark = !!t.dark;
    root.setAttribute('data-theme', dark ? 'dark' : '');
    const accent = t.accent || '#2A5DB0';
    const soft = dark
      ? accent + '28'
      : (ACCENT_OPTIONS.find(a => a.v === accent)?.soft || '#E5EBF5');
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-soft', soft);
    const f = FONT_OPTIONS[t.font] || FONT_OPTIONS.inter;
    root.style.setProperty('--font-en', f.en);
    root.style.setProperty('--font-display', f.display);
    const sz = FONT_SIZE_OPTIONS.find(o => o.v === t.fontSize) || FONT_SIZE_OPTIONS[1];
    root.style.setProperty('--font-size-base', sz.px + 'px');
    document.body.style.zoom = '';
  }, [t.accent, t.font, t.fontSize, t.dark]);

  const role = t.role || 'admin';
  const lang = t.lang || 'km';
  // mirror to window so non-context helpers can read it
  React.useEffect(() => { window.__anzenLang = lang; }, [lang]);

  // Keep curriculum state mirrored to window for persistence
  React.useEffect(() => { window.__curriculumDone = curriculumDone; }, [curriculumDone]);
  React.useEffect(() => { window.__curriculumFeedback = curriculumFeedback; }, [curriculumFeedback]);

  // Sidebar collapse state — persisted
  const [sideCollapsed, setSideCollapsed] = React.useState(() => {
    try { return localStorage.getItem('anzen_side_collapsed') === '1'; }
    catch { return false; }
  });
  const toggleSideCollapsed = React.useCallback(() => {
    setSideCollapsed(v => {
      const next = !v;
      try { localStorage.setItem('anzen_side_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  // Nav order — persisted per role in localStorage
  const [navOrder, setNavOrder] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('anzen_nav_order_v1') || '{}'); }
    catch { return {}; }
  });
  // All roles start from the full admin tab list; admin restricts via rolePermissions
  const baseItems = NAV_ITEMS.admin || [];
  const rolePerms = window.__schoolSettings?.rolePermissions?.[role] || {};
  const visibleBase = role === 'admin'
    ? baseItems
    : baseItems.filter(i => (rolePerms[i.id] || 'full') !== 'hidden');
  const savedOrder = navOrder[role];
  const items = savedOrder
    ? [...visibleBase].sort((a, b) => {
        const ai = savedOrder.indexOf(a.id);
        const bi = savedOrder.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : visibleBase;

  const handleNavReorder = React.useCallback((fromIdx, toIdx) => {
    const arr = items.map(i => i.id);
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    const next = { ...navOrder, [role]: arr };
    setNavOrder(next);
    try { localStorage.setItem('anzen_nav_order_v1', JSON.stringify(next)); } catch(e) {}
  }, [items, navOrder, role]);

  React.useEffect(() => {
    if (!items.find(i => i.id === current)) setCurrent('dashboard');
  }, [role]);

  const [activeStudentId, setActiveStudentId] = React.useState(null);
  const [studentsVersion, setStudentsVersion] = React.useState(0);
  const [notifVersion,       setNotifVersion]       = React.useState(0);
  const [instructorsVersion, setInstructorsVersion] = React.useState(0);
  const [staffVersion,       setStaffVersion]       = React.useState(0);
  const [settingsVersion,    setSettingsVersion]    = React.useState(0);
  const [trVersion,          setTrVersion]          = React.useState(0);

  React.useEffect(() => {
    window.__notifyStudentsChanged = () => setStudentsVersion(v => v + 1);
    return () => { delete window.__notifyStudentsChanged; };
  }, []);

  React.useEffect(() => {
    window.__notifyNotificationsChanged = () => setNotifVersion(v => v + 1);
    return () => { delete window.__notifyNotificationsChanged; };
  }, []);

  React.useEffect(() => {
    window.__notifyInstructorsChanged = () => setInstructorsVersion(v => v + 1);
    return () => { delete window.__notifyInstructorsChanged; };
  }, []);

  React.useEffect(() => {
    window.__notifyStaffChanged = () => setStaffVersion(v => v + 1);
    return () => { delete window.__notifyStaffChanged; };
  }, []);

  React.useEffect(() => {
    window.__notifySettingsChanged = () => setSettingsVersion(v => v + 1);
    return () => { delete window.__notifySettingsChanged; };
  }, []);

  React.useEffect(() => {
    window.__notifyTrChanged = () => setTrVersion(v => v + 1);
    return () => { delete window.__notifyTrChanged; };
  }, []);

  const login = (r) => {
    if (r === 'instructor') {
      if (!window.__loggedInInstructorId) window.__loggedInInstructorId = 'I-01';
      if (!window.__loggedInInstructorData) {
        const _id = window.__loggedInInstructorId;
        const _sf = (window.__staffData || []).find(s => s.instId === _id || s.id === _id);
        const _inst = !_sf ? (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === _id) : null;
        if (_sf)   { window.__loggedInInstructorData = { km: _sf.name, en: _sf.en, title: (_sf.roleKm ? _sf.roleKm + ' · ' : '') + (_sf.role || ''), avatar: _sf.photo || 'inst-1' }; }
        else if (_inst) { window.__loggedInInstructorData = { km: _inst.name, en: _inst.en, title: _inst.role || 'Instructor', avatar: _inst.photo || 'inst-1' }; }
        if (window.__loggedInInstructorData) LOGIN_USERS.instructor = window.__loggedInInstructorData;
      }
    }
    setTweak('role', r); setAuthed(true); setCurrent('dashboard'); window.__anzenStudentId = null;
  };
  const loginStudent = (student) => {
    setLoggedInStudentUser(student);
    setActiveStudentId(student.id);
    window.__anzenStudentId = student.id;
    setTweak('role', 'student');
    setAuthed(true);
    setCurrent('dashboard');
  };
  // Real Supabase login — map the profile's role into the app.
  const authLogin = (profile) => {
    const r = profile?.role || 'student';
    setTweak('role', r);
    if (r === 'student' && profile?.linked_id) {
      setActiveStudentId(profile.linked_id);
      window.__anzenStudentId = profile.linked_id;
      const stu = STUDENTS.find(s => s.id === profile.linked_id);
      if (stu) setLoggedInStudentUser(stu);
    } else {
      window.__anzenStudentId = null;
      if (r === 'instructor' && profile?.linked_id) {
        const lid = profile.linked_id;
        window.__loggedInInstructorId = lid;
        const sf   = (window.__staffData || []).find(s => s.instId === lid || s.id === lid);
        const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === lid);
        const name      = sf?.name  || inst?.name  || profile?.full_name    || lid;
        const nameEn    = sf?.en    || inst?.en    || profile?.full_name_en || profile?.full_name || lid;
        const photo     = sf?.photo || inst?.photo || 'inst-1';
        const roleTitle = sf ? (sf.roleKm ? sf.roleKm + ' · ' + sf.role : sf.role) : (inst?.role || 'Instructor');
        window.__loggedInInstructorData = { km: name, en: nameEn, title: roleTitle, avatar: photo };
        LOGIN_USERS.instructor = window.__loggedInInstructorData;
      }
    }
    setAuthed(true);
    setCurrent('dashboard');
    // Pull all data from Supabase for this session (Phase 2).
    if (window.__sbLoadAll) {
      window.__sbLoadAll()
        .then(() => {
          if (r === 'student' && profile?.linked_id) {
            const s = STUDENTS.find(x => x.id === profile.linked_id); if (s) setLoggedInStudentUser(s);
          }
          if (r === 'instructor' && profile?.linked_id) {
            const lid = profile.linked_id;
            const sf   = (window.__staffData || []).find(s => s.instId === lid || s.id === lid);
            const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === lid);
            const name      = sf?.name  || inst?.name  || profile?.full_name    || lid;
            const nameEn    = sf?.en    || inst?.en    || profile?.full_name_en || profile?.full_name || lid;
            const photo     = sf?.photo || inst?.photo || 'inst-1';
            const roleTitle = sf ? (sf.roleKm ? sf.roleKm + ' · ' + sf.role : sf.role) : (inst?.role || 'Instructor');
            window.__loggedInInstructorData = { km: name, en: nameEn, title: roleTitle, avatar: photo };
            LOGIN_USERS.instructor = window.__loggedInInstructorData;
          }
        })
        .catch(() => {});
    }
  };
  const logout = () => {
    window.__loggedInInstructorId = null;
    window.__loggedInInstructorData = null;
    setAuthed(false); window.__sbReady = false; if (window.__sbSignOut) window.__sbSignOut();
  };
  const setRoleAndAuth = (r) => { setTweak('role', r); setAuthed(true); };

  // Auto-login if a Supabase session already exists (page reload / return visit).
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(window.__sbConfigured && window.__sbConfigured())) return;
      try {
        const session = await window.__sbSession();
        if (session && !cancelled) {
          const profile = await window.__sbLoadProfile();
          if (profile && !cancelled) authLogin(profile);
        }
      } catch (e) { /* ignore — show login */ }
    })();
    return () => { cancelled = true; };
  }, []);
  const setLang = (v) => setTweak('lang', v);

  // tr() — trilingual helper: tr(km, en, jp?)
  const tr = React.useCallback((km, en, jp) => {
    if (typeof km === 'string' && typeof en === 'string') {
      if (!window.__trRegistry) window.__trRegistry = {};
      if (!window.__trRegistry[en]) window.__trRegistry[en] = km;
    }
    const kmVal = (typeof en === 'string' && window.__trOverrides?.[en]) || km;
    if (lang === 'km') return kmVal;
    if (lang === 'jp') return jp !== undefined ? jp : en;
    return en;
  }, [lang, trVersion]);

  const tabPermission = React.useCallback((tabId) => {
    if (role === 'admin') return 'full';
    return window.__schoolSettings?.rolePermissions?.[role]?.[tabId] || 'full';
  }, [role, settingsVersion]);

  // app actions exposed to all children via context
  const actions = React.useMemo(() => ({
    role, lang, tr, setLang, tabPermission,
    dark: !!t.dark,
    toggleDark: () => setTweak('dark', !t.dark),
    settingsVersion,
    navigate: setCurrent,
    openForm: (name, ctx) => setDrawer({ name, ctx }),
    closeForm: () => setDrawer(null),
    openDetail: (type, data) => setDetail({ type, data }),
    closeDetail: () => setDetail(null),
    confirm: (opts) => setConfirmState(opts),
    closeConfirm: () => setConfirmState(null),
    curriculumDone, setCurriculumDone, curriculumFeedback, setCurriculumFeedback,
    toast: (msg, tone = 'neutral', opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts(prev => [...prev, { id, msg, tone, ...opts }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), opts.duration || 3200);
    },
    logout,
  }), [role, lang, tr, t.dark, settingsVersion, curriculumDone, curriculumFeedback]);

  // global keyboard shortcuts
  React.useEffect(() => {
    if (!authed) return;
    const onKey = (e) => {
      // ⌘K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.__openSearch?.();
      }
      // ⌘N — new (based on role)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        if (role === 'admin')           actions.openForm('newStudent');
        else if (role === 'instructor') actions.openForm('newLesson');
        else                            actions.navigate('booking');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authed, actions, role]);

  // ─── Login screen ──────────────────────────────────────────────
  if (!authed) {
    return (
      <AppActionsContext.Provider value={actions}>
        <LoginScreen onLogin={login} onStudentLogin={loginStudent} onAuthLogin={authLogin}/>
        <AppTweaks t={t} setTweak={setTweak} setRoleAndAuth={setRoleAndAuth}/>
        <Toasts list={toasts}/>
      </AppActionsContext.Provider>
    );
  }

  // ─── Main app ──────────────────────────────────────────────────
  const screens = {
    dashboard:   <Dashboard role={role} studentId={activeStudentId}/>,
    students:    <StudentsScreen role={role}/>,
    schedule:    <ScheduleScreen view={t.calendar} role={role} studentId={activeStudentId}/>,
    lessons:     <LessonsScreen role={role}/>,
    instructors: <InstructorsScreen role={role}/>,
    fleet:       <FleetScreen role={role}/>,
    progress:    <ProgressScreen role={role} studentId={activeStudentId}/>,
    billing:     <BillingScreen  role={role} studentId={activeStudentId}/>,
    staff:       <StaffScreen role={role}/>,
    public:      <PublicScreen/>,
    booking:     <BookingScreen studentId={activeStudentId} role={role}/>,
    mobile:      <MobileScreen/>,
    vehicle:     <VehicleScreen/>,
    finance:     <FinanceScreen role={role}/>,
    announce:    <AnnounceScreen role={role}/>,
    settings:    <SettingsScreen role={role} fontSize={t.fontSize} setFontSize={(v)=>setTweak('fontSize',v)}/>,
  };
  const navStyle = t.nav || 'sidebar';

  const FormComp = drawer ? FORMS[drawer.name] : null;
  const formTitle = drawer ? FORM_TITLES[drawer.name] : null;
  const detailEntry = detail ? DETAILS[detail.type] : null;
  const detailTitle = detail && detailEntry ? detailEntry.titleFn(detail.data) : null;
  const DetailComp = detailEntry?.Component;

  const renderLayout = () => {
    // Mobile: always bottom bar, no sidebar
    if (bp.mobile) {
      return (
        <div style={{display:'flex',flexDirection:'column',minHeight:'100svh',width:'100vw',background:'var(--bg)'}}>
          <main style={{flex:1,overflow:'auto',padding:'12px 14px',paddingBottom:72}}>{screens[current]}</main>
          <MobileBottomBar items={items} current={current} onGo={setCurrent} role={role} onLogout={logout}/>
        </div>
      );
    }
    // Tablet: collapsed icon-only sidebar
    if (bp.tablet) {
      return (
        <div style={{display:'flex',height:'100vh',width:'100vw',background:'var(--bg)'}}>
          <Sidebar items={items} current={current} onGo={setCurrent} role={role} onLogout={logout} onReorder={handleNavReorder} collapsed/>
          <main style={{flex:1,overflow:'auto',padding:'16px 20px',minWidth:0}}>{screens[current]}</main>
        </div>
      );
    }
    // Desktop: full layout respecting navStyle
    if (navStyle === 'sidebar') {
      return (
        <div style={{display:'flex',height:'100vh',width:'100vw',background:'var(--bg)'}}>
          <Sidebar items={items} current={current} onGo={setCurrent} role={role} onLogout={logout} onReorder={handleNavReorder} collapsed={sideCollapsed} onToggleCollapse={toggleSideCollapsed}/>
          <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
            <ContentTopbar role={role}/>
            <main style={{flex:1,overflow:'auto',padding:'24px 28px'}}>{screens[current]}</main>
          </div>
        </div>
      );
    }
    if (navStyle === 'topbar') {
      return (
        <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',background:'var(--bg)'}}>
          <Topbar items={items} current={current} onGo={setCurrent} role={role} onLogout={logout} onReorder={handleNavReorder}/>
          <main style={{flex:1,overflow:'auto',padding:'24px 28px'}}>{screens[current]}</main>
        </div>
      );
    }
    return (
      <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',background:'var(--bg)'}}>
        <TabsBar items={items} current={current} onGo={setCurrent} role={role} onLogout={logout} onReorder={handleNavReorder}/>
        <main style={{flex:1,overflow:'auto',padding:'24px 28px'}}>{screens[current]}</main>
      </div>
    );
  };

  return (
    <AppActionsContext.Provider value={actions}>
      {renderLayout()}

      {/* Global modal for forms */}
      <FormModal
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={formTitle?.km}
        subtitle={formTitle?.en}
        width={FORM_WIDTHS[drawer?.name] || 640}
        dark={FORM_DARK.has(drawer?.name)}
      >
        {FormComp && <FormComp onClose={() => setDrawer(null)} ctx={drawer?.ctx}/>}
      </FormModal>

      {/* Global drawer for details */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detailTitle?.km}
        subtitle={detailTitle?.en}
        width={detail?.type === 'invoice' ? 640 : 540}
      >
        {DetailComp && <DetailComp {...{[detail.type]: detail.data}} onClose={() => setDetail(null)}/>}
      </Drawer>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        body={confirmState?.body}
        confirmText={confirmState?.confirmText}
        cancelText={confirmState?.cancelText}
        danger={confirmState?.danger}
        onConfirm={() => { confirmState?.onConfirm?.(); setConfirmState(null); }}
        onCancel={() => setConfirmState(null)}
      />

      <AppTweaks t={t} setTweak={setTweak} setRoleAndAuth={setRoleAndAuth}/>
      <Toasts list={toasts}/>
    </AppActionsContext.Provider>
  );
}

// ── Toasts container ──────────────────────────────────────────────────────
const Toasts = ({ list }) => {
  const isMobile = window.innerWidth < 700;
  return ReactDOM.createPortal(
    <div style={{
      position:'fixed', bottom: isMobile ? 72 : 16, left:16, right: isMobile ? 16 : 'auto',
      zIndex:9500, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none',
    }}>
      {list.map(t => <Toast key={t.id} msg={t.msg} tone={t.tone} icon={t.icon}/>)}
    </div>,
    document.body
  );
};

// ── Login screen ──────────────────────────────────────────────────────────
const ROLE_TABS = [
  { key:'admin',      km:'អ្នកគ្រប់គ្រង', en:'Admin',      jp:'管理者',   badge_km:'Demo', badge_en:'Demo', badge_jp:'デモ', perms_km:'មើល និងកែប្រែ​ទាំងអស់', perms_en:'View & edit everything',     perms_jp:'全機能を閲覧・編集' },
  { key:'instructor', km:'គ្រូបង្រៀន',    en:'Instructor', jp:'講師',     badge_km:'',     badge_en:'',     badge_jp:'',     perms_km:'គ្រប់គ្រង​សិស្ស + មេរៀន', perms_en:'Manage students & lessons', perms_jp:'生徒・レッスン管理' },
  { key:'student',    km:'សិស្ស',         en:'Student',    jp:'生徒',     badge_km:'',     badge_en:'',     badge_jp:'' },
];

// ── Real (Supabase) email/password login ───────────────────────────────────
const RealLoginCard = ({ onAuthLogin, onUseDemo }) => {
  const { lang, setLang, tr } = useAppActions();
  const [email, setEmail]   = React.useState('');
  const [pw, setPw]         = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [err, setErr]       = React.useState('');
  const [busy, setBusy]     = React.useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      const { profile } = await window.__sbSignIn(email, pw);
      onAuthLogin(profile || { role: 'student' });
    } catch (ex) {
      const m = (ex && ex.message) || '';
      setErr(/invalid login/i.test(m)
        ? tr('អ៊ីមែល ឬ ពាក្យសម្ងាត់ មិនត្រឹមត្រូវ', 'Incorrect email or password')
        : tr('ការ​ចូល​បរាជ័យ — ' + m, 'Sign-in failed — ' + m));
      setBusy(false);
    }
  };

  const inputStyle = {
    width:'100%', padding:'11px 13px', fontSize:14,
    border:'1.5px solid var(--border)', borderRadius:9,
    background:'var(--surface)', color:'var(--ink)', outline:'none', boxSizing:'border-box',
  };

  return (
    <div style={{
      minHeight:'100vh',width:'100vw',
      background:'linear-gradient(135deg,var(--bg) 0%,var(--surface-muted) 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:24,position:'relative',
    }}>
      {/* Lang switcher */}
      <div style={{position:'absolute',top:20,right:20,display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:999,padding:3,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
        {[{v:'km',label:'ខ្មែរ'},{v:'en',label:'English'},{v:'jp',label:'日本語'}].map(({v,label}) => (
          <button key={v} onClick={()=>setLang(v)} style={{
            padding:'5px 12px',border:'none',
            background: lang===v?'var(--ink)':'transparent',
            color: lang===v?'var(--bg)':'var(--ink-2)',
            borderRadius:999,cursor:'pointer',fontSize:11,fontWeight:600,transition:'all .15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Logo */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
        {window.__schoolSettings?.logo
          ? <img src={window.__schoolSettings.logo} style={{width:42,height:42,borderRadius:10,objectFit:'cover'}} alt="logo"/>
          : <Logo size={42}/>}
        <div>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:'-.02em',fontFamily:'var(--font-display)'}}>{window.__schoolSettings?.name || 'Anzen'}</div>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.08em',marginTop:1}}>{tr('សាកល​វិទ្យាល័យ​បើក​បរ','DRIVE ACADEMY')}</div>
        </div>
      </div>

      {/* Card */}
      <form onSubmit={submit} style={{
        width:'100%',maxWidth:380,
        background:'var(--surface)',border:'1px solid var(--border)',
        borderRadius:20,boxShadow:'0 8px 48px rgba(0,0,0,.10)',
        padding:'28px 28px 24px',
      }}>
        <div style={{fontSize:17,fontWeight:700,fontFamily:'var(--font-display)',marginBottom:4}}>
          {tr('ចូល​គណនី','Sign in')}
        </div>
        <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:20}}>
          {tr('បញ្ចូល​អ៊ីមែល និង​ពាក្យ​សម្ងាត់​របស់​អ្នក','Enter your email and password')}
        </div>

        <label style={{fontSize:12,fontWeight:600,color:'var(--ink-2)'}}>{tr('អ៊ីមែល','Email')}</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoFocus
          placeholder="you@example.com" style={{...inputStyle, marginTop:6, marginBottom:14}}/>

        <label style={{fontSize:12,fontWeight:600,color:'var(--ink-2)'}}>{tr('ពាក្យ​សម្ងាត់','Password')}</label>
        <div style={{position:'relative', marginTop:6}}>
          <input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)}
            placeholder="••••••••" style={{...inputStyle, paddingRight:64}}/>
          <button type="button" onClick={()=>setShowPw(s=>!s)} style={{
            position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
            border:'none',background:'none',cursor:'pointer',fontSize:11,color:'var(--ink-3)',fontWeight:600,
          }}>{showPw?tr('លាក់','Hide'):tr('បង្ហាញ','Show')}</button>
        </div>

        {err && <div style={{marginTop:14,padding:'9px 12px',background:'var(--surface-muted)',border:'1px solid var(--danger)',borderRadius:8,fontSize:12,color:'var(--danger)'}}>{err}</div>}

        <button type="submit" disabled={busy} style={{
          width:'100%',marginTop:20,padding:'12px',border:'none',borderRadius:10,
          background: busy?'var(--ink-3)':'var(--accent)', color:'#fff',
          fontSize:14,fontWeight:700,cursor: busy?'default':'pointer',fontFamily:'inherit',
        }}>{busy ? tr('កំពុង​ចូល…','Signing in…') : tr('ចូល','Sign in')}</button>

        <div style={{marginTop:16,textAlign:'center'}}>
          <button type="button" onClick={onUseDemo} style={{border:'none',background:'none',cursor:'pointer',fontSize:11,color:'var(--ink-3)',textDecoration:'underline'}}>
            {tr('ប្រើ​របៀប Demo','Use demo mode')}
          </button>
        </div>
      </form>
    </div>
  );
};

const LoginScreen = ({ onLogin, onStudentLogin, onAuthLogin }) => {
  const { lang, setLang, tr } = useAppActions();
  const [tab, setTab]       = React.useState('admin');
  const [sid, setSid]       = React.useState('');
  const [spw, setSpw]       = React.useState('');
  const [iid, setIid]       = React.useState('');
  const [ipw, setIpw]       = React.useState('');
  const [err, setErr]       = React.useState('');
  const [showPw, setShowPw] = React.useState(false);

  const configured = !!(window.__sbConfigured && window.__sbConfigured());
  const [demoMode, setDemoMode] = React.useState(false);

  // When connected to Supabase, show the real email/password login.
  if (configured && !demoMode) {
    return <RealLoginCard onAuthLogin={onAuthLogin} onUseDemo={() => setDemoMode(true)}/>;
  }

  const handleStudentLogin = () => {
    const id = sid.trim().toUpperCase();
    const student = STUDENTS.find(s => s.id === id && s.password === spw);
    if (!student) { setErr(tr('Student ID ឬ Password មិន​ត្រឹម​ត្រូវ','Incorrect Student ID or password')); return; }
    if (student.account_disabled) { setErr(tr('គណនីត្រូវបានផ្អាក — សូម​ទំនាក់ទំនង​គ្រឹះស្ថាន','Account suspended — please contact the school')); return; }
    setErr('');
    onStudentLogin(student);
  };

  const handleInstructorLogin = () => {
    const id = iid.trim().toUpperCase();
    if (!id || !ipw) { setErr(tr('សូម​បំពេញ ID និង Password','Please enter ID and password')); return; }
    const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === id && i.password === ipw);
    const sfByInst = inst ? (window.__staffData || []).find(s => s.instId === inst.id) : null;
    const sfById   = !inst ? (window.__staffData || []).find(s => s.id === id && s.password === ipw) : null;
    const sf = sfByInst || sfById;
    const instFinal = inst || (sf?.instId ? (typeof INSTRUCTORS!=='undefined'?INSTRUCTORS:[]).find(i=>i.id===sf.instId) : null);
    if (!inst && !sf) { setErr(tr('ID ឬ Password មិន​ត្រឹម​ត្រូវ','Incorrect ID or password')); return; }
    if (instFinal?.account_disabled || sf?.account_disabled) { setErr(tr('គណនីត្រូវបានផ្អាក — សូម​ទំនាក់ទំនង​គ្រឹះស្ថាន','Account suspended — please contact the school')); return; }
    const name   = sf?.name  || instFinal?.name  || id;
    const nameEn = sf?.en    || instFinal?.en    || id;
    const photo  = sf?.photo || instFinal?.photo || 'inst-1';
    const roleTitle = sf ? (sf.roleKm ? sf.roleKm + ' · ' + sf.role : sf.role) : (instFinal?.role || 'Instructor');
    window.__loggedInInstructorId   = instFinal?.id || sf?.instId || id;
    window.__loggedInInstructorData = { km: name, en: nameEn, title: roleTitle, avatar: photo };
    LOGIN_USERS.instructor = window.__loggedInInstructorData;
    setErr('');
    onLogin('instructor');
  };

  const currentTab = ROLE_TABS.find(t => t.key === tab);
  const u = LOGIN_USERS[tab] || LOGIN_USERS.student;

  return (
    <div style={{
      minHeight:'100vh',width:'100vw',
      background:'linear-gradient(135deg,var(--bg) 0%,var(--surface-muted) 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:24,position:'relative',
    }}>

      {/* Lang switcher */}
      <div style={{position:'absolute',top:20,right:20,display:'flex',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:999,padding:3,boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
        {[{v:'km',label:'ខ្មែរ'},{v:'en',label:'English'},{v:'jp',label:'日本語'}].map(({v,label}) => (
          <button key={v} onClick={()=>setLang(v)} style={{
            padding:'5px 12px',border:'none',
            background: lang===v?'var(--ink)':'transparent',
            color: lang===v?'var(--bg)':'var(--ink-2)',
            borderRadius:999,cursor:'pointer',fontSize:11,fontWeight:600,transition:'all .15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Logo */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
        {window.__schoolSettings?.logo
          ? <img src={window.__schoolSettings.logo} style={{width:42,height:42,borderRadius:10,objectFit:'cover'}} alt="logo"/>
          : <Logo size={42}/>
        }
        <div>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:'-.02em',fontFamily:'var(--font-display)'}}>{window.__schoolSettings?.name || 'Anzen'}</div>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.08em',marginTop:1}}>{tr('សាកល​វិទ្យាល័យ​បើក​បរ','DRIVE ACADEMY')}</div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width:'100%',maxWidth:420,
        background:'var(--surface)',border:'1px solid var(--border)',
        borderRadius:20,boxShadow:'0 8px 48px rgba(0,0,0,.10)',
        overflow:'hidden',
      }}>

        {/* Role tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--border)',background:'var(--surface-muted)'}}>
          {ROLE_TABS.map(t => (
            <button key={t.key} onClick={()=>{setTab(t.key);setErr('');}}
              style={{
                flex:1,padding:'14px 4px',border:'none',cursor:'pointer',
                fontFamily:'inherit',fontSize:12,fontWeight:tab===t.key?700:500,
                background: tab===t.key ? 'var(--surface)' : 'transparent',
                color: tab===t.key ? 'var(--ink)' : 'var(--ink-3)',
                borderBottom: tab===t.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition:'all .15s',
                display:'flex',flexDirection:'column',alignItems:'center',gap:2,
              }}>
              <span>{lang==='km'?t.km:lang==='jp'?t.jp:t.en}</span>
              {t.badge_en && (
                <span style={{fontSize:9,background:'var(--accent-soft)',color:'var(--accent)',padding:'1px 6px',borderRadius:99,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em'}}>
                  {lang==='km'?t.badge_km:lang==='jp'?t.badge_jp:t.badge_en}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div style={{padding:'28px 28px 24px'}}>

          {/* Admin demo panel */}
          {tab === 'admin' && (
            <div>
              <div style={{
                display:'flex',alignItems:'center',gap:16,
                padding:'16px 18px',marginBottom:20,
                background:'var(--surface-muted)',borderRadius:14,
                border:'1px solid var(--border)',
              }}>
                <Avatar tag={u.avatar} size={56}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:17,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>
                    {lang==='km'?u.km:u.en}
                  </div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{u.title}</div>
                  <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,padding:'3px 8px',background:'var(--accent-soft)',borderRadius:6}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)'}}/>
                    <span style={{fontSize:10,color:'var(--accent)',fontWeight:600,letterSpacing:'.04em'}}>
                      {lang==='km'?currentTab.perms_km:lang==='jp'?currentTab.perms_jp:currentTab.perms_en}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{padding:'10px 14px',marginBottom:20,background:'var(--surface-muted)',borderRadius:10,border:'1px dashed var(--border)',display:'flex',alignItems:'flex-start',gap:8}}>
                <span style={{fontSize:14,lineHeight:1}}>🔓</span>
                <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.5}}>
                  {tr('គណនី​ Demo — ចូល​ដោយ​មិន​ចាំបាច់​លេខ​សម្ងាត់ ។','Demo account — sign in without a password. Real data is used.','デモアカウント — パスワード不要。')}
                </div>
              </div>
              <button onClick={()=>onLogin(tab)} style={{
                width:'100%',height:48,borderRadius:12,background:'var(--ink)',color:'var(--bg)',
                border:'none',cursor:'pointer',fontSize:15,fontWeight:700,fontFamily:'inherit',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'opacity .15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              >
                <Icon name="arrow" size={15}/>
                {tr(`ចូល​ក្នុង​នាម ${currentTab.km}`, `Enter as ${currentTab.en}`)}
              </button>
            </div>
          )}

          {/* Instructor login — ID + password */}
          {tab === 'instructor' && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                <Avatar tag="inst-1" size={44}/>
                <div>
                  <div style={{fontSize:16,fontWeight:700}}>{tr('ចូល​ក្នុង​ App','Instructor portal')}</div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginTop:1}}>{tr('បញ្ជូល​ ID + Password','Enter your Instructor ID & password')}</div>
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',display:'block',marginBottom:5}}>Instructor ID</label>
                <input value={iid} onChange={e=>{setIid(e.target.value);setErr('');}}
                  onKeyDown={e=>e.key==='Enter'&&handleInstructorLogin()}
                  placeholder="I-01"
                  style={{width:'100%',height:46,padding:'0 14px',boxSizing:'border-box',border:'1.5px solid var(--border)',borderRadius:10,fontSize:16,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',background:'var(--surface)',color:'var(--ink)',outline:'none'}}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                />
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',display:'block',marginBottom:5}}>Password</label>
                <div style={{position:'relative'}}>
                  <input type={showPw?'text':'password'} value={ipw}
                    onChange={e=>{setIpw(e.target.value);setErr('');}}
                    onKeyDown={e=>e.key==='Enter'&&handleInstructorLogin()}
                    placeholder="••••••"
                    style={{width:'100%',height:46,padding:'0 44px 0 14px',boxSizing:'border-box',border:`1.5px solid ${err?'var(--danger)':'var(--border)'}`,borderRadius:10,fontSize:15,background:'var(--surface)',color:'var(--ink)',outline:'none',fontFamily:'"JetBrains Mono",monospace'}}
                    onFocus={e=>e.target.style.borderColor=err?'var(--danger)':'var(--accent)'}
                    onBlur={e=>e.target.style.borderColor=err?'var(--danger)':'var(--border)'}
                  />
                  <button onClick={()=>setShowPw(v=>!v)} tabIndex={-1}
                    style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-3)',padding:4,fontSize:11,fontWeight:600}}>
                    {showPw?tr('លាក់','Hide'):tr('បង្ហាញ','Show')}
                  </button>
                </div>
                {err && <div style={{fontSize:12,color:'var(--danger)',marginTop:5}}>{err}</div>}
              </div>
              <button onClick={handleInstructorLogin} style={{
                width:'100%',height:48,borderRadius:12,background:'var(--ink)',color:'var(--bg)',
                border:'none',cursor:'pointer',fontSize:15,fontWeight:700,fontFamily:'inherit',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'opacity .15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              >
                <Icon name="arrow" size={15}/> {tr('ចូល​គណនី','Sign in')}
              </button>
            </div>
          )}

          {/* Student login panel */}
          {tab === 'student' && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
                <Avatar tag="port-1" size={44}/>
                <div>
                  <div style={{fontSize:16,fontWeight:700}}>{tr('ចូល​ក្នុង​ App','Student portal','生徒ポータル')}</div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginTop:1}}>{tr('បញ្ជូល​ ID + Password','Enter your Student ID & password','生徒IDとパスワードを入力')}</div>
                </div>
              </div>

              {/* ID field */}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',display:'block',marginBottom:5}}>Student ID</label>
                <input value={sid} onChange={e=>{setSid(e.target.value);setErr('');}}
                  onKeyDown={e=>e.key==='Enter'&&handleStudentLogin()}
                  placeholder="S-1042"
                  style={{
                    width:'100%',height:46,padding:'0 14px',boxSizing:'border-box',
                    border:'1.5px solid var(--border)',borderRadius:10,
                    fontSize:16,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',
                    background:'var(--surface)',color:'var(--ink)',outline:'none',transition:'border-color .15s',
                  }}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}
                />
              </div>

              {/* Password field */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',display:'block',marginBottom:5}}>Password</label>
                <div style={{position:'relative'}}>
                  <input
                    type={showPw?'text':'password'} value={spw}
                    onChange={e=>{setSpw(e.target.value);setErr('');}}
                    onKeyDown={e=>e.key==='Enter'&&handleStudentLogin()}
                    placeholder="••••••••"
                    style={{
                      width:'100%',height:46,padding:'0 44px 0 14px',boxSizing:'border-box',
                      border:`1.5px solid ${err?'var(--danger)':'var(--border)'}`,borderRadius:10,
                      fontSize:15,background:'var(--surface)',color:'var(--ink)',
                      outline:'none',fontFamily:'inherit',transition:'border-color .15s',
                    }}
                    onFocus={e=>e.target.style.borderColor=err?'var(--danger)':'var(--accent)'}
                    onBlur={e=>e.target.style.borderColor=err?'var(--danger)':'var(--border)'}
                  />
                  <button onClick={()=>setShowPw(v=>!v)} tabIndex={-1}
                    style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-3)',padding:4}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      {showPw
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><path d="M1 1l22 22"/></>
                        : <><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                {err && <div style={{fontSize:12,color:'var(--danger)',marginTop:5,display:'flex',alignItems:'center',gap:4}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {err}
                </div>}
              </div>

              <button onClick={handleStudentLogin}
                style={{
                  width:'100%',height:48,borderRadius:12,
                  background:'var(--ink)',color:'var(--bg)',
                  border:'none',cursor:'pointer',fontSize:15,fontWeight:700,fontFamily:'inherit',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  transition:'opacity .15s',letterSpacing:'-.01em',
                }}
                onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
              >
                <Icon name="arrow" size={15}/> {tr('ចូល​គណនី','Sign in')}
              </button>

              <div style={{marginTop:14,padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
                  {tr(
                    'Admin ឬ គ្រូ​នឹង​ផ្ដល់ Student ID និង Password ជូន​អ្នក​នៅ​ពេល​ចុះ​ឈ្មោះ។',
                    'Your Student ID and password are given by your admin or instructor at enrollment.',
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data transfer hint on mobile */}
      {window.innerWidth < 700 && STUDENTS.length === 0 && (
        <div style={{marginTop:16,padding:'10px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,maxWidth:380,width:'100%',boxSizing:'border-box'}}>
          <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
            📲 {lang==='km'
              ? 'ដើម្បី​ឃើញ​ទិន្នន័យ​: ចូល → Settings → ទិន្នន័យ → Import'
              : 'To see your data: sign in → Settings → Data → Import backup file'}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{marginTop:16,fontSize:11,color:'var(--ink-3)',letterSpacing:'.04em',opacity:.6}}>
        Anzen · {new Date().getFullYear()}
      </div>
    </div>
  );
};

// ── Search ────────────────────────────────────────────────────────────────────
const SEARCH_TYPES = {
  student:    { label:'STUDENT',    color:'#2A5DB0', tab:'students',    detail:'student'    },
  instructor: { label:'INSTR',      color:'#8B5E34', tab:'instructors', detail:'instructor' },
  vehicle:    { label:'VEHICLE',    color:'#555A65', tab:'fleet',       detail:'vehicle'    },
  invoice:    { label:'INVOICE',    color:'#C66A2E', tab:'billing',     detail:'invoice'    },
  lesson:     { label:'LESSON',     color:'#3B7A57', tab:'lessons',     detail:'lesson'     },
  staff:      { label:'STAFF',      color:'#7C5CBF', tab:'staff',       detail:null         },
};

const buildSearchIndex = () => {
  const idx = [];
  const stu  = typeof STUDENTS    !== 'undefined' ? STUDENTS    : [];
  const inst = typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : [];
  const veh  = typeof VEHICLES    !== 'undefined' ? VEHICLES    : [];
  const inv  = typeof INVOICES    !== 'undefined' ? INVOICES    : [];
  const les  = typeof LESSONS     !== 'undefined' ? LESSONS     : [];
  stu.forEach(s  => idx.push({ type:'student',    key:`${s.name||''} ${s.en||''} ${s.id||''}`.toLowerCase(), label:s.name, sub:`${s.id} · ${s.cls} · ${s.status}`, data:s }));
  inst.forEach(i => idx.push({ type:'instructor', key:`${i.name||''} ${i.en||''} ${i.id||''}`.toLowerCase(), label:i.name, sub:i.en||i.id, data:i }));
  veh.forEach(v  => idx.push({ type:'vehicle',    key:`${v.plate||''} ${v.make||''}`.toLowerCase(), label:v.plate, sub:`${v.make} · ${v.status}`, data:v }));
  inv.forEach(v  => idx.push({ type:'invoice',    key:`${v.id||''} ${v.student||''}`.toLowerCase(), label:v.id, sub:`${v.student||''} · ${v.amount}`, data:v }));
  les.forEach(l  => {
    const s = stu.find(x => x.id === l.studentId);
    const i = inst.find(x => x.id === l.instId);
    idx.push({ type:'lesson', key:`${l.id||''} ${s?.name||''} ${s?.en||''} ${l.date||''} ${i?.name||''}`.toLowerCase(), label:l.id, sub:`${s?.name||l.studentId||''} · ${l.date}`, data:l });
  });
  (window.__staffData||[]).forEach(s => idx.push({ type:'staff', key:`${s.name||''} ${s.en||''} ${s.id||''}`.toLowerCase(), label:s.name, sub:`${s.en||''} · ${s.dept||''}`, data:s }));
  return idx;
};

const SearchModal = ({ open, onClose }) => {
  const { navigate, tr, openDetail } = useAppActions();
  const [q, setQ]         = React.useState('');
  const [sel, setSel]     = React.useState(0);
  const inputRef          = React.useRef();
  const listRef           = React.useRef();

  React.useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 40); }
  }, [open]);

  const results = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    return buildSearchIndex().filter(r => r.key.includes(ql)).slice(0, 15);
  }, [q]);

  React.useEffect(() => { setSel(0); }, [results.length]);

  React.useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block:'nearest' });
  }, [sel]);

  const go = (item) => {
    const m = SEARCH_TYPES[item.type];
    navigate(m.tab);
    if (m.detail) setTimeout(() => openDetail(m.detail, item.data), 80);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape')    { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => Math.min(i+1, results.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(i => Math.max(i-1, 0)); }
    if (e.key === 'Enter' && results[sel]) go(results[sel]);
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,.4)',backdropFilter:'blur(3px)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'9vh'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:580,margin:'0 16px',background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',boxShadow:'0 24px 64px rgba(0,0,0,.22)',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'72vh'}}>

        {/* Input */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
          <Icon name="search" size={17} stroke={1.5} color="var(--ink-3)"/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKeyDown}
            placeholder={tr('ស្វែងរក​សិស្ស, មេរៀន, វិក្កយបត្រ…','Search students, lessons, invoices…')}
            style={{flex:1,border:'none',outline:'none',background:'transparent',fontSize:16,color:'var(--ink)',fontFamily:'inherit'}}
          />
          {q && <button onClick={()=>setQ('')} style={{border:'none',background:'transparent',cursor:'pointer',color:'var(--ink-3)',padding:0,display:'flex',alignItems:'center'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>}
          <kbd style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid var(--border)',background:'var(--surface-muted)',color:'var(--ink-3)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div ref={listRef} style={{overflowY:'auto',flex:1}}>
            {results.map((item,i) => {
              const m = SEARCH_TYPES[item.type];
              const active = i === sel;
              return (
                <button key={i} onClick={()=>go(item)} onMouseEnter={()=>setSel(i)}
                  style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 16px',border:'none',borderLeft:`3px solid ${active?m.color:'transparent'}`,background:active?'var(--surface-muted)':'transparent',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
                  <span style={{fontSize:9,fontWeight:700,fontFamily:'JetBrains Mono,monospace',letterSpacing:'.07em',padding:'2px 6px',borderRadius:4,background:m.color+'1a',color:m.color,flexShrink:0,minWidth:54,textAlign:'center'}}>{m.label}</span>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.label}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:1}}>{item.sub}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {q.trim() && results.length === 0 && (
          <div style={{padding:'32px 16px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
            {tr('រក​មិន​ឃើញ​លទ្ធផល​សម្រាប់','No results for')} <strong style={{color:'var(--ink)'}}>{q}</strong>
          </div>
        )}

        {/* Idle hint */}
        {!q.trim() && (
          <div style={{padding:'18px 16px'}}>
            <div style={{fontSize:12,color:'var(--ink-3)',marginBottom:10}}>{tr('ស្វែងរក​ក្នុង','Search across')}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {Object.entries(SEARCH_TYPES).map(([k,m])=>(
                <span key={k} style={{padding:'3px 8px',borderRadius:6,background:m.color+'1a',color:m.color,fontSize:10,fontWeight:700,fontFamily:'JetBrains Mono,monospace',letterSpacing:'.06em'}}>{m.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard hints */}
        <div style={{padding:'8px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:14,fontSize:10,color:'var(--ink-3)',fontFamily:'JetBrains Mono,monospace',background:'var(--surface-muted)',flexShrink:0}}>
          {[['↑↓',tr('រើស','navigate')],['↵',tr('បើក','open')],['Esc',tr('បិទ','close')]].map(([k,v])=>(
            <span key={k}><kbd style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:3,padding:'1px 5px',marginRight:4}}>{k}</kbd>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Language toggle ────────────────────────────────────────────────────────────
const LangToggleBtn = () => {
  const { lang, setLang } = useAppActions();
  return (
    <button
      onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
      title={lang === 'km' ? 'Switch to English' : 'ប្ដូរ​ទៅ​ភាសា​ខ្មែរ'}
      style={{
        height:32, minWidth:46, padding:'0 10px', borderRadius:8, flexShrink:0,
        border:'1px solid var(--border)', background:'var(--surface-muted)',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', color:'var(--ink-2)',
        fontSize:11, fontWeight:700, fontFamily:'"JetBrains Mono",monospace',
        letterSpacing:'.06em', transition:'all .15s',
      }}
      onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-soft)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.borderColor='var(--accent)';}}
      onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-muted)';e.currentTarget.style.color='var(--ink-2)';e.currentTarget.style.borderColor='var(--border)';}}
    >
      {lang === 'km' ? 'EN' : 'ខ្មែរ'}
    </button>
  );
};

// ── Content topbar (above main area, sidebar layout only) ────────────────
const ContentTopbar = ({ role }) => {
  const { openForm, navigate, tr } = useAppActions();
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    window.__openSearch = () => setSearchOpen(true);
    return () => { delete window.__openSearch; };
  }, []);

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)}/>
      <div style={{
        height:64,background:'var(--surface)',borderBottom:'1px solid var(--border)',
        display:'flex',alignItems:'center',padding:'0 28px',gap:12,flexShrink:0,
      }}>
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            flex:1,display:'flex',alignItems:'center',gap:10,
            maxWidth:480,padding:'8px 14px',
            background:'var(--surface-muted)',border:'1px solid var(--border)',
            borderRadius:10,color:'var(--ink-3)',cursor:'pointer',
            font:'inherit',textAlign:'left',
          }}>
          <Icon name="search" size={15}/>
          <span style={{fontSize:13,flex:1}}>{tr('ស្វែងរក​សិស្ស, មេរៀន, វិក្កយបត្រ…','Search students, lessons, invoices…')}</span>
          <span style={{fontSize:10,fontFamily:'JetBrains Mono, monospace',background:'var(--surface)',padding:'2px 6px',borderRadius:4,border:'1px solid var(--border)',flexShrink:0}}>⌘K</span>
        </button>

        <NotificationsBell/>
        <LangToggleBtn/>
        <DarkToggleBtn/>

        {/* Quick create dropdown — admin / instructor only */}
        {role !== 'student' && (
          <Dropdown
            trigger={
              <button style={{
                height:34,padding:'0 12px',borderRadius:8,gap:6,
                border:'1px solid var(--border)',background:'var(--surface)',
                display:'inline-flex',alignItems:'center',cursor:'pointer',
                fontSize:12,fontWeight:500,
              }}>
                <Icon name="plus" size={14}/>
                <span>{tr('បង្កើត​ថ្មី','Create')}</span>
              </button>
            }>
            <MenuLabel>{tr('បង្កើត','CREATE')}</MenuLabel>
            {can(role,'create','student')    && <MenuItem icon="users" onClick={()=>openForm('newStudent')}      sub="⌘N">{tr('សិស្ស​ថ្មី','New student')}</MenuItem>}
            {can(role,'create','lesson')     && <MenuItem icon="cal"   onClick={()=>openForm('newLesson')}>{tr('មេរៀន​ថ្មី','New lesson')}</MenuItem>}
            {role === 'admin' && <MenuItem icon="flag"  onClick={()=>openForm('newInstructor')}>{tr('គ្រូ​ថ្មី','New instructor')}</MenuItem>}
            {role === 'admin' && <MenuItem icon="car"   onClick={()=>openForm('newVehicle')}>{tr('យានយន្ត​ថ្មី','New vehicle')}</MenuItem>}
            {role === 'admin' && <MenuItem icon="cash"  onClick={()=>openForm('newInvoice')}>{tr('វិក្កយបត្រ​ថ្មី','New invoice')}</MenuItem>}
          </Dropdown>
        )}
      </div>
    </>
  );
};

const NotificationsBell = () => {
  const { toast, navigate, tr, lang } = useAppActions();
  const items = window.NOTIFICATIONS || [];
  return (
    <Dropdown
      trigger={
        <button style={{
          width:34,height:34,borderRadius:8,
          border:'1px solid var(--border)',background:'var(--surface)',
          display:'flex',alignItems:'center',justifyContent:'center',
          position:'relative',cursor:'pointer',
        }} title={tr('ការ​ជូន​ដំណឹង','Notifications')}>
          <Icon name="bell" size={16}/>
          {items.length > 0 && (
            <span style={{position:'absolute',top:-4,right:-4,background:'var(--accent)',color:'#fff',fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:999}}>{items.length}</span>
          )}
        </button>
      } width={320}>
      <MenuLabel>{tr('ការ​ជូន​ដំណឹង','NOTIFICATIONS')}</MenuLabel>
      {items.length === 0 ? (
        <div style={{padding:'12px 10px',fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>
          {tr('គ្មាន​ការ​ជូន​ដំណឹង','No notifications')}
        </div>
      ) : items.map((a,i) => (
        <button key={i} onClick={()=>navigate(a.go)} style={{
          display:'flex',gap:10,padding:'10px 10px',width:'100%',textAlign:'left',
          border:'none',background:'transparent',cursor:'pointer',borderRadius:6,fontFamily:'inherit',
        }}
        onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{
            width:28,height:28,borderRadius:8,
            background: a.tone==='warn'?'#F6E9DC':a.tone==='danger'?'#F4DEDD':'var(--accent-soft)',
            color: a.tone==='warn'?'var(--warn)':a.tone==='danger'?'var(--danger)':'var(--accent)',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
          }}><Icon name={a.icon} size={13}/></div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:12,fontWeight:500}}>{lang==='km'?a.km:a.en}</div>
          </div>
        </button>
      ))}
      <MenuDivider/>
      <MenuItem onClick={()=>{
        if (window.NOTIFICATIONS) window.NOTIFICATIONS = [];
        if (window.__notifyNotificationsChanged) window.__notifyNotificationsChanged();
        toast(tr('បាន​សម្គាល់​ទាំង​អស់','Marked all read'),'good');
      }}>{tr('សម្គាល់​​មើល​ឃើញ​ទាំង​អស់','Mark all read')}</MenuItem>
    </Dropdown>
  );
};

const AppTweaks = ({ t, setTweak, setRoleAndAuth }) => (
  <TweaksPanel>
    <TweakSection label="Identity · អត្តសញ្ញាណ"/>
    <TweakRadio
      label="Role · តួនាទី (designer preview)"
      value={t.role || 'admin'}
      options={['admin','instructor','student']}
      onChange={(v) => setRoleAndAuth(v)}
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
    <TweakToggle
      label="ងងឹត · Dark mode"
      value={!!t.dark}
      onChange={(v) => setTweak('dark', v)}
    />
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

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{padding:24,fontFamily:'system-ui',maxWidth:480,margin:'60px auto'}}>
          <div style={{fontSize:18,fontWeight:700,color:'#B0413E',marginBottom:10}}>⚠️ App error</div>
          <div style={{fontSize:13,color:'#555',marginBottom:10}}>{this.state.err?.message}</div>
          <pre style={{fontSize:11,color:'#999',background:'#f5f5f5',padding:10,borderRadius:6,overflow:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
            {this.state.err?.stack}
          </pre>
          <button onClick={()=>location.reload()} style={{marginTop:14,padding:'8px 16px',background:'#2A5DB0',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13}}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary><App/></AppErrorBoundary>
);
