// screens-staff.jsx — Staff management

if (!window.__staffData)      window.__staffData = [];
if (!window.__leaveData)      window.__leaveData = [];
// attendanceData: { "YYYY-MM-DD": { "EMP-001": "P"|"A"|"L"|"H" } }
if (!window.__attendanceData) window.__attendanceData = {};
// attendanceTimes: { "YYYY-MM-DD|EMP-001": { in:"08:00", out:"17:00" } }
if (!window.__attendanceTimes) window.__attendanceTimes = {};
// payrollRuns: [{id, month, entries:[{empId,base,overtime,bonus,nssf,tax,net,paid}], status, runAt}]
if (!window.__payrollRuns)    window.__payrollRuns = [];
// staffPolicy: editable leave policy
if (!window.__staffPolicy)    window.__staffPolicy = { annual:18, sick:12, notice:2 };

const DEPT_OPTS   = ['Office','Finance','Marketing','Workshop','Transport','Instruction','Admin'];
const STATUS_OPTS = ['At desk','On lesson','Available','Training','In shop','On route','Remote','Off-site'];

const StaffScreen = () => {
  const { openForm, toast, tr, confirm } = useAppActions();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [tab, setTab]         = React.useState('directory');
  const [view, setView]       = React.useState('cards');
  const [dept, setDept]       = React.useState('all');
  const [selectedId, setSelId] = React.useState(null);
  const [detailOpen, setDetailOpen] = React.useState(false);   // staff detail shows as a popup, not inline
  const [editing, setEditing] = React.useState(false);
  const [addLeave, setAddLeave] = React.useState(false);

  React.useEffect(() => {
    window.__notifyStaffChanged = () => forceUpdate();
    return () => { delete window.__notifyStaffChanged; };
  }, []);

  const staff  = window.__staffData;
  const leaves = window.__leaveData;

  // Handle cross-tab navigation target (e.g. from InstructorsScreen)
  React.useEffect(() => {
    if (window.__staffNavTarget) {
      const target = window.__staffNavTarget;
      delete window.__staffNavTarget;
      const found = staff.find(s => s.id === target || s.en === target);
      if (found) { setSelId(found.id); setTab('directory'); setDetailOpen(true); }
    }
  }, []);

  // Keep selection valid
  React.useEffect(() => {
    if (staff.length > 0 && (!selectedId || !staff.find(s => s.id === selectedId))) {
      setSelId(staff[0].id);
    }
    if (staff.length === 0) setSelId(null);
  }, [staff.length]);

  const selected = staff.find(s => s.id === selectedId) || null;

  const selectStaff = (id) => { setSelId(id); setEditing(false); setDetailOpen(true); };

  const approveLeave = (lv) => {
    lv.status = 'Approved';
    const emp = staff.find(s => s.id === lv.emp);
    if (emp) emp.leave = Math.max(0, (emp.leave || 0) - lv.days);
    forceUpdate();
    if (window.saveAllData) window.saveAllData();
    toast('ច្បាប់ឈប់បានអនុម័ត', 'good');
  };

  const denyLeave = (lv) => {
    lv.status = 'Denied';
    forceUpdate();
    if (window.saveAllData) window.saveAllData();
    toast('ច្បាប់ឈប់បានបដិសេធ', 'neutral');
  };

  const deleteLeave = (lv) => {
    const i = window.__leaveData.findIndex(l => l.id === lv.id);
    if (i !== -1) {
      if (lv.status === 'Approved') {
        const emp = staff.find(s => s.id === lv.emp);
        if (emp) emp.leave = (emp.leave || 0) + lv.days;
      }
      window.__leaveData.splice(i, 1);
    }
    forceUpdate();
    if (window.saveAllData) window.saveAllData();
    toast('បានលុបច្បាប់ឈប់', 'neutral');
  };

  const editLeaveDays = (lv, days) => {
    lv.days = days;
    forceUpdate();
    if (window.saveAllData) window.saveAllData();
  };

  const deleteStaff = (id) => {
    const i = window.__staffData.findIndex(s => s.id === id);
    if (i !== -1) window.__staffData.splice(i, 1);
    setEditing(false);
    forceUpdate();
    if (window.saveAllData) window.saveAllData();
    toast('បានលុបបុគ្គលិក', 'good');
  };

  // Offboard: keep the record (archived) but move to "Former staff", disable
  // their login and hide them from the Instructors tab. Data is NOT deleted.
  const offboardStaff = (id) => {
    const s = window.__staffData.find(x => x.id === id);
    if (!s) return;
    confirm?.({
      title: tr('សម្គាល់​ថា​ឈប់​ពី​ការងារ?','Mark as left employment?'),
      body:  tr('បុគ្គលិក​នេះ​នឹង​ផ្លាស់​ទៅ "អតីត​បុគ្គលិក"។ គណនី​ចូល​នឹង​ត្រូវ​ផ្អាក ហើយ​លាក់​ពី Tab គ្រូ។ ទិន្នន័យ​ទាំងអស់​ត្រូវ​បាន​រក្សា​ទុក។',
                 'This person moves to "Former staff". Their login is disabled and they\'re hidden from Instructors. All their data is kept.'),
      confirmText: tr('ឈប់​ពី​ការងារ','Offboard'), danger: true,
      onConfirm: () => {
        s.offboarded = true;
        s.offboardedAt = (typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0,10));
        s.account_disabled = true;
        const inst = instById(s.instId);
        if (inst) inst.visible = false;
        if (window.saveAllData) window.saveAllData();
        if (window.__notifyInstructorsChanged) window.__notifyInstructorsChanged();
        forceUpdate();
        toast(tr('បាន​សម្គាល់​ថា​ឈប់​ពី​ការងារ ✓','Marked as former staff ✓'), 'neutral');
      },
    });
  };
  const restoreStaff = (id) => {
    const s = window.__staffData.find(x => x.id === id);
    if (!s) return;
    s.offboarded = false;
    s.account_disabled = false;
    if (s.status === 'Former') s.status = 'At desk';
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បាន​ជួល​ឡើង​វិញ​ជា​បុគ្គលិក​សកម្ម','Restored to active staff'), 'good');
  };

  const saveEdit = (updated) => {
    const i = window.__staffData.findIndex(s => s.id === updated.id);
    if (i !== -1) window.__staffData[i] = updated;

    // Sync back to INSTRUCTORS if this staff member is an instructor
    if (updated.instId && typeof INSTRUCTORS !== 'undefined') {
      const inst = INSTRUCTORS.find(inst => inst.id === updated.instId);
      if (inst) {
        inst.name  = updated.name  || inst.name;
        inst.en    = updated.en    || inst.en;
        inst.phone = updated.phone || inst.phone;
        inst.email = updated.email || inst.email;
        inst.photo = updated.photo || inst.photo;
        inst.salary = updated.salary ?? inst.salary;
        if (updated.role) {
          const hasKm = inst.role && inst.role.includes(' · ');
          if (!hasKm) inst.role = updated.role;
          else {
            const parts = inst.role.split(' · ');
            inst.role = parts[0].trim() + ' · ' + updated.role;
          }
          inst.roleEn = updated.role;
        }
        if (window.__notifyInstructorsChanged) window.__notifyInstructorsChanged();
      }
    }

    // Keep logged-in instructor's display name in sync
    if (updated.instId && window.__loggedInInstructorId === updated.instId && typeof LOGIN_USERS !== 'undefined') {
      LOGIN_USERS.instructor = {
        km: updated.name, en: updated.en,
        title: updated.roleKm ? updated.roleKm + ' · ' + updated.role : updated.role,
        avatar: updated.photo,
      };
    }

    setEditing(false);
    forceUpdate();
    if (window.saveAllData) window.saveAllData();
    toast('បានកែ', 'good');
  };

  const savePhoto = (id, dataUrl) => {
    const i = window.__staffData.findIndex(s => s.id === id);
    if (i !== -1) {
      window.__staffData[i].photo = dataUrl;
      const instId = window.__staffData[i].instId;
      if (instId && typeof INSTRUCTORS !== 'undefined') {
        const inst = INSTRUCTORS.find(inst => inst.id === instId);
        if (inst) { inst.photo = dataUrl; if (window.__notifyInstructorsChanged) window.__notifyInstructorsChanged(); }
      }
      if (window.saveAllData) window.saveAllData();
      forceUpdate();
    }
  };

  const activeStaff = staff.filter(s => !s.offboarded);
  const formerStaff = staff.filter(s => s.offboarded);
  const deptCounts = DEPT_OPTS.reduce((acc, d) => {
    acc[d] = activeStaff.filter(s => s.dept === d).length;
    return acc;
  }, {});
  const filtered  = dept === 'former'
    ? formerStaff
    : activeStaff.filter(s => dept === 'all' || s.dept === dept);
  const pending   = leaves.filter(l => l.status === 'Pending');
  const upcoming  = leaves.filter(l => l.status === 'Approved');
  const total$    = staff.reduce((a, s) => a + (s.salary || 0), 0);
  const missingDocs = staff.filter(s => s.docs && Object.values(s.docs).some(v => !v)).length;

  const TABS = [
    {id:'directory', km:'បញ្ជី',     en:'Directory', icon:'users'},
    {id:'schedule',  km:'វត្តមាន',   en:'Attendance', icon:'cal'},
    {id:'leave',     km:'ច្បាប់ឈប់', en:'Leave',     icon:'flag'},
    {id:'payroll',   km:'ប្រាក់ខែ',  en:'Payroll',   icon:'cash'},
    {id:'docs',      km:'ឯកសារ',     en:'Documents', icon:'book'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="បុគ្គលិក"
        en={activeStaff.length ? `${activeStaff.length} employees · ${pending.length} pending leave` : 'No staff yet'}
        action={
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" onClick={()=>toast('Export CSV · coming soon','neutral')}>{tr('នាំចេញ','Export')}</Btn>
            <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}
              onClick={()=>openForm('newStaff')}>
              {tr('បន្ថែមបុគ្គលិក','Add staff')}
            </Btn>
          </div>
        }
      />

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
        <Card><Stat label={tr('សរុប','Total')}         value={activeStaff.length}                                sub={activeStaff.length ? `${[...new Set(activeStaff.map(s=>s.dept))].length} dept` : 'add staff'}/></Card>
        <Card><Stat label={tr('សកម្ម','On duty')}       value={activeStaff.filter(s=>s.status==='At desk'||s.status==='On lesson'||s.status==='In shop').length + '/' + activeStaff.length}/></Card>
        <Card><Stat label={tr('ច្បាប់រង់ចាំ','Pending leave')} value={pending.length}/></Card>
        <Card><Stat label={tr('ប្រាក់ខែ','Payroll')}    value={total$ ? `$${total$.toLocaleString()}` : '$0'}   sub="/month"/></Card>
        <Card><Stat label={tr('ឯកសារខ្វះ','Missing docs')}      value={missingDocs}                                       sub="missing"/></Card>
      </div>

      <Card pad={0}>
        {/* sub-tabs */}
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:4,alignItems:'center'}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'inline-flex',alignItems:'center',gap:7,padding:'7px 12px',border:'none',
              background: tab===t.id ? 'var(--surface-muted)' : 'transparent',
              color: tab===t.id ? 'var(--ink)' : 'var(--ink-3)',
              borderRadius:7,fontSize:12,fontWeight: tab===t.id ? 600 : 500,cursor:'default',
            }}>
              <Icon name={t.icon} size={13}/>{tr(t.km, t.en)}
            </button>
          ))}
          <div style={{flex:1}}/>
          {tab==='directory' && staff.length > 0 && (
            <div style={{display:'flex',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,padding:2}}>
              {['cards','table'].map(v => (
                <button key={v} onClick={()=>setView(v)} style={{
                  padding:'4px 10px',border:'none',
                  background: view===v ? 'var(--surface)' : 'transparent',
                  color: view===v ? 'var(--ink)' : 'var(--ink-3)',
                  borderRadius:5,fontSize:11,fontWeight:500,cursor:'default',textTransform:'capitalize',
                }}>{v}</button>
              ))}
            </div>
          )}
          {tab==='leave' && (
            <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}
              onClick={()=>setAddLeave(true)}>{tr('ស្នើច្បាប់','Request leave')}</Btn>
          )}
          <SfPrintMenu staff={staff}/>
        </div>

        {/* Directory tab */}
        {tab==='directory' && (
          staff.length === 0 ? (
            <div style={{padding:48,textAlign:'center',color:'var(--ink-3)'}}>
              <div style={{fontSize:32,marginBottom:12}}>👤</div>
              <div style={{fontSize:16,fontWeight:600,color:'var(--ink-2)',marginBottom:6}}>មិន​ទាន់​មាន​បុគ្គលិក</div>
              <div style={{fontSize:13,marginBottom:20}}>No staff added yet.</div>
              <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>} onClick={()=>openForm('newStaff')}>
                {tr('បន្ថែម​បុគ្គលិក​ដំបូង','Add first staff')}
              </Btn>
            </div>
          ) : (
            <div>
              {/* dept chips */}
              <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap'}}>
                {[
                  {id:'all', l:tr('ទាំងអស់','All'), n:activeStaff.length},
                  ...DEPT_OPTS.filter(d => deptCounts[d] > 0).map(d => ({id:d, l:d, n:deptCounts[d]})),
                  ...(formerStaff.length ? [{id:'former', l:tr('អតីត​បុគ្គលិក','Former'), n:formerStaff.length, former:true}] : []),
                ].map(d => (
                  <button key={d.id} onClick={()=>setDept(d.id)} style={{
                    padding:'4px 10px',
                    background: dept===d.id ? (d.former?'var(--warn)':'var(--ink)') : 'var(--surface)',
                    color: dept===d.id ? 'var(--bg)' : (d.former?'var(--warn)':'var(--ink-2)'),
                    border:'1px solid ' + (dept===d.id ? (d.former?'var(--warn)':'var(--ink)') : (d.former?'var(--warn)':'var(--border)')),
                    borderRadius:999,fontSize:11,fontWeight:500,cursor:'default',
                    display:'inline-flex',alignItems:'center',gap:6,
                  }}>
                    {d.l}
                    <span style={{opacity:.6,fontSize:10,fontFamily:'"JetBrains Mono",monospace'}}>{d.n}</span>
                  </button>
                ))}
              </div>

              {view === 'cards'
                ? <SfCards   staff={filtered} selectedId={selectedId} onSelect={selectStaff}/>
                : <SfTable   staff={filtered} selectedId={selectedId} onSelect={selectStaff}/>}
            </div>
          )
        )}

        {tab==='schedule' && <SfSchedule staff={staff}/>}
        {tab==='leave'    && <SfLeave    staff={staff} leaves={leaves} pending={pending} upcoming={upcoming} addLeave={addLeave} setAddLeave={setAddLeave} onApprove={approveLeave} onDeny={denyLeave} onDelete={deleteLeave} onEditDays={editLeaveDays}/>}
        {tab==='payroll'  && <SfPayroll  staff={staff}/>}
        {tab==='docs'     && <SfDocs     staff={staff} forceUpdate={forceUpdate}/>}
      </Card>

      {/* Detail / edit — pops out as a modal when a staff member is tapped. */}
      {tab==='directory' && selected && detailOpen && (
        <Modal open onClose={()=>{ setDetailOpen(false); setEditing(false); }} width={780}>
          {editing
            ? <SfEditPanel s={selected} onSave={saveEdit} onCancel={()=>setEditing(false)} onDelete={(id)=>{ deleteStaff(id); setDetailOpen(false); setEditing(false); }} onSavePhoto={savePhoto}/>
            : <SfDetailRow s={selected} onEdit={()=>setEditing(true)} onSavePhoto={savePhoto} onOffboard={offboardStaff} onRestore={restoreStaff}/>}
        </Modal>
      )}
    </div>
  );
};

// ── Cards grid ──
const SfCards = ({ staff, selectedId, onSelect }) => (
  <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
    {staff.map(s => {
      const docs = s.docs || {};
      const docOk = Object.values(docs).every(v => v);
      const docCount = Object.values(docs).filter(v => v).length;
      const docTotal = Object.keys(docs).length;
      return (
        <div key={s.id} onClick={()=>onSelect(s.id)} style={{
          padding:14,
          background: selectedId===s.id ? 'var(--surface-muted)' : 'var(--surface)',
          border:'1px solid ' + (selectedId===s.id ? 'var(--border-strong)' : 'var(--border)'),
          borderRadius:10,cursor:'default',
        }}>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <Avatar tag={s.photo} size={44}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{s.en} · {s.id}</div>
              <div style={{fontSize:11,color:'var(--ink-2)',marginTop:6}}>{s.role}</div>
            </div>
            <SfStatusDot status={s.status}/>
          </div>
          <div style={{marginTop:12,padding:'10px 0 0',borderTop:'1px dashed var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:11}}>
            <div>
              <div style={{color:'var(--ink-3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Dept</div>
              <div style={{marginTop:2,fontWeight:500}}>{s.dept || '—'}</div>
            </div>
            <div>
              <div style={{color:'var(--ink-3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Since</div>
              <div style={{marginTop:2,fontWeight:500}}>{s.since || '—'}</div>
            </div>
            <div>
              <div style={{color:'var(--ink-3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Leave bal.</div>
              <div style={{marginTop:2,fontWeight:500}}>{s.leave ?? '—'} ថ្ងៃ</div>
            </div>
            <div>
              <div style={{color:'var(--ink-3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Docs</div>
              <div style={{marginTop:2,fontWeight:500,color: docOk ? 'var(--good)' : 'var(--warn)'}}>
                {docTotal > 0 ? `${docCount}/${docTotal}` : '—'}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ── Table view ──
const SfTable = ({ staff, selectedId, onSelect }) => (
  <div style={{overflowX:'auto'}}>
  <div style={{minWidth:480}}>
    <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 0.8fr 0.8fr',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
      <div>Employee</div><div>Role · Dept</div><div>Status</div><div>Since</div><div>Leave bal.</div>
    </div>
    {staff.map((s,i) => (
      <div key={s.id} onClick={()=>onSelect(s.id)} style={{
        padding:'12px 16px',display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 0.8fr 0.8fr',gap:14,
        alignItems:'center',borderBottom:i<staff.length-1?'1px solid var(--border)':'none',
        background: selectedId===s.id ? 'var(--surface-muted)' : 'transparent',cursor:'default',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
          <Avatar tag={s.photo} size={32}/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.id} · {s.en}</div>
          </div>
        </div>
        <div>
          <div style={{fontSize:12,color:'var(--ink-2)'}}>{s.role}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{s.dept}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <SfStatusDot status={s.status}/>
          <span style={{fontSize:12,color:'var(--ink-2)'}}>{s.status}</span>
        </div>
        <div style={{fontSize:12,color:'var(--ink-2)'}}>{s.since || '—'}</div>
        <div style={{fontSize:12}}>{s.leave ?? '—'} d</div>
      </div>
    ))}
  </div>
  </div>
);

const SfStatusDot = ({ status }) => {
  const c = {'On lesson':'var(--accent)','Available':'var(--good)','Training':'var(--accent)','At desk':'var(--good)','Remote':'var(--ink-3)','Off-site':'var(--ink-3)','In shop':'var(--accent)','On route':'var(--accent)'}[status]||'var(--ink-3)';
  return <span style={{width:8,height:8,borderRadius:999,background:c,flexShrink:0,boxShadow:`0 0 0 3px ${c}22`}}/>;
};

// ── Detail panel ──
const SfDetailRow = ({ s, onEdit, onSavePhoto, onOffboard, onRestore }) => {
  const { toast, navigate, tr } = useAppActions();
  const [showPw, setShowPw] = React.useState(false);
  const [settingPw, setSettingPw] = React.useState(false);   // editing credentials (ID + password)
  const [newPw, setNewPw] = React.useState('');
  const [newId, setNewId] = React.useState('');
  const [, forceLocal] = React.useReducer(n => n + 1, 0);
  const docs  = s.docs  || {};
  const docCount = Object.values(docs).filter(v=>v).length;
  const docTotal = Object.keys(docs).length;
  const inst = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.id === s.instId || i.en === s.en);
  const todayLessons = inst ? LESSONS.filter(l=>l.instId===inst.id&&l.date===todayStr()&&l.status!=='cancelled') : [];
  const weekLessons  = inst ? LESSONS.filter(l=>l.instId===inst.id&&l.status!=='cancelled') : [];
  const myStudents   = inst ? STUDENTS.filter(st => st.inst===inst.en || st.inst===inst.name) : [];
  // Login ID: a custom username (can be long) overrides the record id.
  const loginId = s.username || inst?.username || inst?.id || s.id;
  const displayPw = s.password || inst?.password;

  const openCreds = () => { setNewId(loginId); setNewPw(''); setSettingPw(true); };
  // Save a custom login username and/or a new password (username can be a long name).
  const saveCreds = () => {
    const uid = newId.trim();
    if (uid) { s.username = uid; if (inst) inst.username = uid; }
    if (newPw.trim()) { s.password = newPw.trim(); if (inst) inst.password = newPw.trim(); }
    if (window.saveAllData) window.saveAllData();
    if (window.__notifyStaffChanged) window.__notifyStaffChanged();
    setSettingPw(false); setNewPw(''); forceLocal();
    toast(tr('បាន​រក្សា​ទុក​គណនី ✓', 'Login saved ✓'), 'good');
  };

  return (
    <Card pad={0}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
        <UploadAvatar id={s.id} photo={s.photo} size={64} onUpload={onSavePhoto}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <div style={{fontSize:20,fontWeight:600,fontFamily:'var(--font-display)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%'}}>{s.name}</div>
            {s.offboarded
              ? <Badge tone="warn">{tr('អតីត​បុគ្គលិក','Former staff')}{s.offboardedAt ? ' · ' + s.offboardedAt : ''}</Badge>
              : <><SfStatusDot status={s.status}/><span style={{fontSize:12,color:'var(--ink-3)'}}>{s.status}</span></>}
            {inst && <Badge tone="accent">{inst.cls.map(c=>`Class ${c}`).join(' · ')}</Badge>}
          </div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{s.en} · {s.id} · {s.role} · {s.dept}</div>
        </div>
        {!s.offboarded && (
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-display)',lineHeight:1,color:'var(--ink)'}}>${s.salary || 0}<span style={{fontSize:11,fontWeight:400,color:'var(--ink-3)'}}> /{s.salaryType==='hourly'?tr('ម៉ោង','hr'):tr('ខែ','mo')}</span></div>
            <div style={{fontSize:9.5,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace',marginTop:3}}>{tr('ប្រាក់​ខែ','Salary')}</div>
          </div>
        )}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginTop:12}}>
        {s.phone && s.phone !== '—' && (
          <Btn kind="ghost" size="sm" icon={<Icon name="phone" size={13}/>}
            onClick={()=>toast(s.phone,'neutral')}>{s.phone}</Btn>
        )}
        {inst && (
          <Btn kind="ghost" size="sm" icon={<Icon name="users" size={13}/>}
            onClick={()=>navigate('instructors')}>
            {inst.id}
          </Btn>
        )}
        {inst && (
          <Btn kind="ghost" size="sm" icon={<Icon name="users" size={13}/>}
            onClick={()=>{
              inst.visible = inst.visible === false ? true : false;
              if (window.saveAllData) window.saveAllData();
              if (window.__notifyInstructorsChanged) window.__notifyInstructorsChanged();
              if (window.__notifyStaffChanged) window.__notifyStaffChanged();
              toast(inst.visible === false
                ? (tr ? tr('លាក់​ពី Tab គ្រូ','Hidden from Instructors') : 'Hidden')
                : (tr ? tr('បង្ហាញ​នៅ Tab គ្រូ','Shown in Instructors') : 'Shown'), 'neutral');
            }}
            style={inst.visible === false ? {} : {color:'var(--good)',borderColor:'var(--good)'}}>
            {inst.visible === false
              ? (tr ? tr('បង្ហាញ​ក្នុង​គ្រូ','Show in Instructors') : 'Show in Instructors')
              : (tr ? tr('បង្ហាញ​ក្នុង​គ្រូ ✓','In Instructors ✓') : 'In Instructors ✓')}
          </Btn>
        )}
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ​សម្រួល','Edit')}</Btn>
        {!s.offboarded && (
          <Btn kind="primary" size="sm" icon={<Icon name="cal" size={13}/>}
            onClick={()=>{ if(inst) window.__scheduleInstFilter=inst.id; navigate('schedule'); }}>
            បើក​កាល​វិភាគ
          </Btn>
        )}
        {s.offboarded
          ? <Btn kind="ghost" size="sm" icon={<Icon name="refresh" size={13}/>}
              onClick={()=>onRestore && onRestore(s.id)}
              style={{color:'var(--good)',borderColor:'var(--good)'}}>
              {tr('ជួល​ឡើង​វិញ','Re-hire')}
            </Btn>
          : <Btn kind="ghost" size="sm"
              onClick={()=>onOffboard && onOffboard(s.id)}
              style={{color:'var(--warn)',borderColor:'var(--warn)'}}>
              {tr('ឈប់​ពី​ការងារ','Offboard')}
            </Btn>}
        </div>
      </div>

      {/* Teaching profile strip — instructors only */}
      {inst && (
        <div style={{padding:'12px 18px',borderBottom:'1px solid var(--border)',background:'var(--surface-muted)',display:'flex',gap:24,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.07em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace',flexShrink:0}}>{tr ? tr('ព័ត៌មាន​បង្រៀន','TEACHING') : 'TEACHING'}</div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap',flex:1}}>
            <div><div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Rating</div><div style={{fontSize:15,fontWeight:700,color:'var(--warn)',marginTop:1}}>★ {inst.rating}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Students</div><div style={{fontSize:15,fontWeight:700,marginTop:1}}>{myStudents.length}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Today</div><div style={{fontSize:15,fontWeight:700,color:todayLessons.length>0?'var(--accent)':'inherit',marginTop:1}}>{todayLessons.length}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Total lessons</div><div style={{fontSize:15,fontWeight:700,marginTop:1}}>{weekLessons.length}</div></div>
            <div><div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'.05em'}}>Languages</div><div style={{fontSize:12,marginTop:1,color:'var(--ink-2)'}}>{inst.lang}</div></div>
          </div>
        </div>
      )}

      <div style={{padding:18,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:16}}>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>{tr('ការងារ','EMPLOYMENT')}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:12}}>
            <SfRow k={tr('ចូលធ្វើការ','Start')}   v={s.since || '—'}/>
            <SfRow k={tr('ប្រភេទ','Contract')}     v={s.salaryType==='hourly'?tr('ម៉ោង','Hourly'):tr('ពេញ​ម៉ោង','Full-time')}/>
            <SfRow k={tr('នាយកដ្ឋាន','Dept')}      v={s.dept || '—'}/>
            <SfRow k={tr('ទូរស័ព្ទ','Phone')}       v={s.phone || '—'}/>
            {s.email && s.email !== '—' && <SfRow k="Email" v={s.email}/>}
          </div>
        </div>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>{tr('ច្បាប់ឈប់','LEAVE BALANCE')}</div>
          {(() => { const pol = window.__staffPolicy?.annual ?? 20; const lv = s.leave ?? pol; return (<>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}>
            <div style={{fontSize:24,fontWeight:600,fontFamily:'var(--font-display)'}}>{lv}</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>/ {pol} ថ្ងៃ</div>
          </div>
          <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,marginTop:8,overflow:'hidden'}}>
            <div style={{width:`${Math.min(100,(lv/pol)*100)}%`,height:'100%',background:'var(--accent)'}}/>
          </div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:6}}>
            {tr('បានប្រើ','Used')} {pol - lv} {tr('ថ្ងៃ','days')}
          </div>
          </>); })()}
        </div>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono", monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>
            {tr('ឯកសារ','DOCS')} · {docTotal > 0 ? `${docCount}/${docTotal}` : '—'}
          </div>
          {docTotal > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:12}}>
              {[{k:'contract',l:'កិច្ចសន្យា'},{k:'license',l:'ប័ណ្ណ'},{k:'medical',l:'វេជ្ជ'},{k:'bg',l:'ប្រវត្តិ'}].map(d => {
                const ok = docs[d.k];
                return (
                  <div key={d.k} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:16,height:16,borderRadius:4,background:ok?'var(--good)':'var(--surface-muted)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid '+(ok?'var(--good)':'var(--border)')}}>
                      {ok && <Icon name="check" size={11} stroke={3}/>}
                    </div>
                    <div style={{flex:1,fontSize:11,color:ok?'var(--ink-2)':'var(--warn)'}}>{d.l}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)'}}>{ok?'✓':'missing'}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{fontSize:11,color:'var(--ink-3)'}}>No documents tracked yet.</div>
          )}
        </div>
      </div>
      <SfExtendedInfo s={s}/>

      {/* Account credentials section */}
      <div style={{padding:'14px 18px',borderTop:'1px solid var(--border)'}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--ink-3)',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:10,fontFamily:'"JetBrains Mono",monospace'}}>
          {tr('គណនីប្រើប្រាស់','ACCOUNT / LOGIN')}
        </div>
        {!settingPw ? (
          <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:3}}>{tr('ID (Username)','ID (Username)')}</div>
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:14,fontWeight:700,letterSpacing:'.03em',color:'var(--accent)',wordBreak:'break-all'}}>{loginId}</div>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:3}}>{tr('ពាក្យ​សម្ងាត់','Password')}</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:14,fontWeight:700,letterSpacing:'.1em',color:'var(--ink)'}}>
                  {displayPw ? (showPw ? displayPw : '••••••') : '—'}
                </div>
                {displayPw && <button onClick={()=>setShowPw(v=>!v)} style={{
                  padding:'2px 8px',border:'1px solid var(--border)',borderRadius:6,
                  background:'var(--surface-muted)',cursor:'pointer',fontSize:11,color:'var(--ink-2)',
                }}>{showPw ? tr('លាក់','Hide') : tr('បង្ហាញ','Show')}</button>}
              </div>
            </div>
            <button onClick={openCreds} style={{
              marginLeft:'auto',padding:'6px 14px',border:'1px solid var(--accent)',borderRadius:8,
              background:'var(--accent-soft)',color:'var(--accent)',cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0,
            }}>{tr('ផ្លាស់​ប្ដូរ ID / ពាក្យ​សម្ងាត់','Change ID / Password')}</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:4}}>{tr('ID (Username) — អាច​វែង','ID (Username) — can be long')}</div>
              <input value={newId} onChange={e=>setNewId(e.target.value)} placeholder={tr('ឧ. chhorn.sovannara','e.g. chhorn.sovannara')}
                style={{width:'100%',height:38,padding:'0 12px',boxSizing:'border-box',border:'1.5px solid var(--accent)',borderRadius:8,fontSize:13,background:'var(--surface)',color:'var(--ink)',outline:'none',fontFamily:'"JetBrains Mono",monospace'}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:4}}>{tr('ពាក្យ​សម្ងាត់​ថ្មី','New password')} <span style={{color:'var(--ink-3)',fontWeight:400}}>{tr('(ទុក​ទទេ​បើ​មិន​ប្ដូរ)','(blank = keep)')}</span></div>
              <input value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder={tr('ពាក្យ​សម្ងាត់​ថ្មី','New password')} onKeyDown={e=>e.key==='Enter'&&saveCreds()}
                style={{width:'100%',height:38,padding:'0 12px',boxSizing:'border-box',border:'1.5px solid var(--border-strong)',borderRadius:8,fontSize:13,background:'var(--surface)',color:'var(--ink)',outline:'none',fontFamily:'"JetBrains Mono",monospace'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setSettingPw(false);setNewPw('');}} style={{flex:1,padding:'9px',border:'1px solid var(--border-strong)',borderRadius:8,background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer',fontSize:12,fontWeight:600}}>{tr('បោះ​បង់','Cancel')}</button>
              <button onClick={saveCreds} style={{flex:2,padding:'9px',border:'none',borderRadius:8,background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700}}>{tr('រក្សា​ទុក','Save')}</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// ── Edit panel ──
const SfEditPanel = ({ s, onSave, onCancel, onDelete, onSavePhoto }) => {
  const { toast, tr } = useAppActions();
  const [name,   setName]   = React.useState(s.name || '');
  const [nameEn, setNameEn] = React.useState(s.en || '');
  const [phone,  setPhone]  = React.useState(s.phone !== '—' ? (s.phone || '') : '');
  const [email,  setEmail]  = React.useState(s.email !== '—' ? (s.email || '') : '');
  const [role,   setRole]   = React.useState(s.role || '');
  const [dept,   setDept]   = React.useState(s.dept || '');
  const [since,  setSince]  = React.useState(s.since || '');
  const [salary, setSalary] = React.useState(s.salary || 0);
  const [stype,  setStype]  = React.useState(s.salaryType || 'monthly');
  const [status, setStatus] = React.useState(s.status || 'Active');
  const [leave,  setLeave]  = React.useState(s.leave ?? (window.__staffPolicy?.annual ?? 18));
  const [docs,   setDocs]   = React.useState({contract:0,license:0,medical:0,bg:0,...(s.docs||{})});
  const [confirm, setConfirm] = React.useState(false);
  const [showExt, setShowExt] = React.useState(false);
  const [ext, setExt] = React.useState({
    gender:'', dob:'', marital:'', idNum:'', address:'',
    emergencyName:'', emergencyRel:'', emergencyPhone:'',
    empType:'Full-time', manager:'', allowance:0, bankAccount:'',
    eduLevel:'', school:'', languages:'', skills:'',
    licenseType:'', licenseExpiry:'', drivingExp:0, instLevel:'', assignedVehicle:'', accidentHistory:'',
    ...(s.ext || {}),
  });

  const toggleDoc = (k) => setDocs(prev => ({...prev, [k]: prev[k] ? 0 : 1}));

  // Option lists for the extended-profile dropdowns.
  const relOpts    = [tr('ឪពុក','Father'),tr('ម្ដាយ','Mother'),tr('ប្ដី/ប្រពន្ធ','Spouse'),tr('បង/ប្អូន','Sibling'),tr('កូន','Child'),tr('សាច់​ញាតិ','Relative'),tr('មិត្ត​ភក្ដិ','Friend'),tr('ផ្សេងៗ','Other')];
  const licenseOpts = ['A','A1','B','B1','B2','C','D','E'];
  const instRolesCfg = ((window.__schoolSettings && window.__schoolSettings.instructorRoles) || []).map(r=>tr(r.km,r.en)).filter(Boolean);
  const instLevelOpts = instRolesCfg.length ? instRolesCfg : [tr('គ្រូ​ជាន់​ខ្ពស់','Senior Instructor'),tr('មេ​បង្រៀន','Lead Instructor'),tr('គ្រូ​បង្រៀន','Instructor'),tr('ហាត់​ការ','Apprentice')];
  const vehicleOpts = (typeof VEHICLES !== 'undefined' ? VEHICLES : []).map(v=>v.plate || v.id).filter(Boolean);
  // Dropdown that keeps an existing custom value selectable even if it's not in the list.
  const Dd = ({ value, onChange, options }) => (
    <Select value={value || ''} onChange={onChange}>
      <option value="">—</option>
      {value && !options.includes(value) && <option value={value}>{value}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </Select>
  );

  const save = () => {
    if (!nameEn.trim()) { toast('សូម​ បំពេញ​ Name EN','warn'); return; }
    onSave({
      ...s,
      name: name.trim() || nameEn.trim(),
      en: nameEn.trim(),
      phone: phone.trim() || '—',
      email: email.trim() || '—',
      role: role.trim(), dept: dept.trim(), since,
      salary: parseFloat(salary) || 0, salaryType: stype,
      status, leave: parseInt(leave) || 0, docs, ext,
    });
  };

  return (
    <Card pad={0}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <UploadAvatar id={s.id} photo={s.photo} size={48} onUpload={onSavePhoto}/>
        <div style={{flex:'1 1 120px',minWidth:0,fontSize:14,fontWeight:600}}>{tr('កែ​សម្រួល','Edit')} — {s.id}</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn kind="ghost" size="sm" style={{color:'var(--danger)'}}
            onClick={()=>setConfirm(true)}>លុប</Btn>
          <Btn kind="ghost" size="sm" onClick={onCancel}>បោះ​បង់</Btn>
          <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={save}>រក្សា​ទុក</Btn>
        </div>
      </div>

      {confirm && (
        <div style={{padding:14,background:'#FDF2F2',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1,fontSize:13,color:'var(--danger)',fontWeight:500}}>
            លុប {s.name} ចេញ​ពី​ប្រព័ន្ធ? This cannot be undone.
          </div>
          <Btn kind="ghost" size="sm" onClick={()=>setConfirm(false)}>{tr('ទេ','Cancel')}</Btn>
          <Btn kind="ghost" size="sm" style={{color:'var(--danger)',borderColor:'var(--danger)'}}
            onClick={()=>onDelete(s.id)}>{tr('លុប​ពិត','Delete')}</Btn>
        </div>
      )}

      <div style={{padding:18,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14}}>
        {/* Left col */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)'}}>{tr('ព័ត៌មាន','PERSONAL')}</div>
          <Field label={tr('ឈ្មោះ (ខ្មែរ)','Name (KH)')}><Input value={name} onChange={e=>setName(e.target.value)} placeholder="ណារី"/></Field>
          <Field label={tr('ឈ្មោះ (EN)','Name (EN) *')}><Input value={nameEn} onChange={e=>setNameEn(e.target.value)} placeholder="Nary"/></Field>
          <Field label={tr('ទូរស័ព្ទ','Phone')}><Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+855 12 000 000"/></Field>
          <Field label="Email"><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@anzen.drive"/></Field>
          <Field label={tr('ថ្ងៃ​ចូល','Start (YYYY-MM)')}><Input value={since} onChange={e=>setSince(e.target.value)} placeholder="2026-01"/></Field>
          <Field label={tr('ស្ថានភាព','Status')}>
            <Select value={status} onChange={e=>setStatus(e.target.value)}>
              {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        {/* Right col */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)'}}>{tr('តួ​នាទី & ប្រាក់​ខែ','ROLE & PAY')}</div>
          <Field label={tr('តួ​នាទី','Role')}><Input value={role} onChange={e=>setRole(e.target.value)} placeholder="Receptionist"/></Field>
          <Field label={tr('នាយក​ដ្ឋាន','Dept')}>
            <Select value={dept} onChange={e=>setDept(e.target.value)}>
              {DEPT_OPTS.map(d=><option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label={tr('ប្រភេទ','Salary type')}>
            <Select value={stype} onChange={e=>setStype(e.target.value)}>
              <option value="monthly">{tr('ប្រចាំ​ខែ','Monthly')}</option>
              <option value="hourly">{tr('ប្រចាំ​ម៉ោង','Hourly')}</option>
            </Select>
          </Field>
          <Field label={tr('ប្រាក់​ខែ','Salary ($)')}><Input type="number" value={salary} onChange={e=>setSalary(e.target.value)} min="0"/></Field>
          <Field label={tr('ច្បាប់​ឈប់','Leave balance (days)')}><Input type="number" value={leave} onChange={e=>setLeave(e.target.value)} min="0" max="20"/></Field>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--ink-2)',marginBottom:8}}>{tr('ឯកសារ','Documents')}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[{k:'contract',l:'កិច្ចសន្យា'},{k:'license',l:'ប័ណ្ណ'},{k:'medical',l:'វេជ្ជ'},{k:'bg',l:'ប្រវត្តិ'}].map(d => (
                <button key={d.k} type="button" onClick={()=>toggleDoc(d.k)} style={{
                  padding:'8px 10px',borderRadius:7,cursor:'pointer',fontFamily:'inherit',
                  border:`2px solid ${docs[d.k]?'var(--good)':'var(--border)'}`,
                  background:docs[d.k]?'#E8F5EE':'var(--surface)',
                  display:'flex',alignItems:'center',gap:6,fontSize:12,
                }}>
                  <div style={{width:14,height:14,borderRadius:3,background:docs[d.k]?'var(--good)':'var(--surface-muted)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
                    {docs[d.k] ? <Icon name="check" size={10} stroke={3}/> : null}
                  </div>
                  {d.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extended profile — collapsible */}
      <div style={{padding:'0 18px 18px'}}>
        <div style={{borderTop:'1px dashed var(--border)',paddingTop:12,display:'flex',alignItems:'center',gap:8}}>
          <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',flex:1}}>
            {tr('ព័ត៌មានបន្ថែម','EXTENDED PROFILE')}
          </div>
          <button onClick={()=>setShowExt(v=>!v)} style={{fontSize:11,border:'1px solid var(--border)',borderRadius:5,padding:'2px 8px',background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer'}}>
            {showExt ? '▲ បិទ' : '▼ បើក'}
          </button>
        </div>
        {showExt && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,marginTop:12}}>
            <div style={{gridColumn:'1/-1',font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.07em',color:'var(--ink-3)',paddingTop:4}}>{tr('ផ្ទាល់ខ្លួន','PERSONAL')}</div>
            <Field label={tr('ភេទ','Gender')}>
              <Select value={ext.gender} onChange={e=>setExt(p=>({...p,gender:e.target.value}))}>
                <option value="">—</option>
                <option value="M">{tr('ប្រុស','Male')}</option>
                <option value="F">{tr('ស្រី','Female')}</option>
              </Select>
            </Field>
            <Field label={tr('ថ្ងៃខែឆ្នាំ','DOB')}><Input type="date" value={ext.dob} onChange={e=>setExt(p=>({...p,dob:e.target.value}))}/></Field>
            <Field label={tr('ស្ថានភាព','Marital status')}>
              <Select value={ext.marital} onChange={e=>setExt(p=>({...p,marital:e.target.value}))}>
                <option value="">—</option>
                <option value="single">នៅ​លីវ</option>
                <option value="married">រៀបការ</option>
                <option value="divorced">លែង​លះ</option>
              </Select>
            </Field>
            <Field label={tr('អត្ត​សញ្ញាណ','ID/Passport')}><Input value={ext.idNum} onChange={e=>setExt(p=>({...p,idNum:e.target.value}))}/></Field>
            <div style={{gridColumn:'1/-1'}}><Field label={tr('អាសយដ្ឋាន','Address')}><Input value={ext.address} onChange={e=>setExt(p=>({...p,address:e.target.value}))}/></Field></div>

            <div style={{gridColumn:'1/-1',font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.07em',color:'var(--ink-3)',paddingTop:6}}>{tr('ទំនាក់ទំនងបន្ទាន់','EMERGENCY CONTACT')}</div>
            <Field label={tr('ឈ្មោះ','Name')}><Input value={ext.emergencyName} onChange={e=>setExt(p=>({...p,emergencyName:e.target.value}))}/></Field>
            <Field label={tr('ទំ​នាក់','Relation')}><Dd value={ext.emergencyRel} onChange={e=>setExt(p=>({...p,emergencyRel:e.target.value}))} options={relOpts}/></Field>
            <Field label={tr('ទូរស័ព្ទ','Phone')}><Input value={ext.emergencyPhone} onChange={e=>setExt(p=>({...p,emergencyPhone:e.target.value}))}/></Field>

            <div style={{gridColumn:'1/-1',font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.07em',color:'var(--ink-3)',paddingTop:6}}>{tr('ប្រភេទ​ការ​ងារ','EMPLOYMENT')}</div>
            <Field label={tr('ប្រភេទ','Type')}>
              <Select value={ext.empType} onChange={e=>setExt(p=>({...p,empType:e.target.value}))}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </Select>
            </Field>
            <Field label={tr('អ្នក​គ្រប់​គ្រង','Manager')}><Input value={ext.manager} onChange={e=>setExt(p=>({...p,manager:e.target.value}))}/></Field>
            <Field label={tr('ប្រាក់​ឧបត្ថម្ភ','Allowance ($)')}><Input type="number" value={ext.allowance} onChange={e=>setExt(p=>({...p,allowance:parseFloat(e.target.value)||0}))}/></Field>
            <Field label={tr('គណនី​ធនាគារ','Bank Account')}><Input value={ext.bankAccount} onChange={e=>setExt(p=>({...p,bankAccount:e.target.value}))}/></Field>

            <div style={{gridColumn:'1/-1',font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.07em',color:'var(--ink-3)',paddingTop:6}}>{tr('ការ​សិក្សា','EDUCATION')}</div>
            <Field label={tr('កម្រិត','Level')}>
              <Select value={ext.eduLevel} onChange={e=>setExt(p=>({...p,eduLevel:e.target.value}))}>
                <option value="">—</option>
                <option value="primary">{tr('បឋម​សិក្សា','Primary')}</option>
                <option value="secondary">{tr('មធ្យម​សិក្សា','Secondary')}</option>
                <option value="high">{tr('វិទ្យាល័យ','High school')}</option>
                <option value="bachelor">{tr('បរិញ្ញាបត្រ','Bachelor')}</option>
                <option value="master">{tr('អនុ​បណ្ឌិត','Master')}</option>
              </Select>
            </Field>
            <Field label={tr('វិទ្យាស្ថាន','School')}><Input value={ext.school} onChange={e=>setExt(p=>({...p,school:e.target.value}))}/></Field>
            <Field label={tr('ភាសា','Languages')}><Input value={ext.languages} onChange={e=>setExt(p=>({...p,languages:e.target.value}))} placeholder="ខ្មែរ, EN"/></Field>
            <Field label={tr('ជំនាញ','Skills')}><Input value={ext.skills} onChange={e=>setExt(p=>({...p,skills:e.target.value}))}/></Field>

            <div style={{gridColumn:'1/-1',font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.07em',color:'var(--ink-3)',paddingTop:6}}>{tr('ជំនាញ​បើក​បរ','DRIVING')}</div>
            <Field label={tr('ប្រភេទ​ប័ណ្ណ','License')}><Dd value={ext.licenseType} onChange={e=>setExt(p=>({...p,licenseType:e.target.value}))} options={licenseOpts}/></Field>
            <Field label={tr('ផុត​','Expiry')}><Input type="date" value={ext.licenseExpiry} onChange={e=>setExt(p=>({...p,licenseExpiry:e.target.value}))}/></Field>
            <Field label={tr('បទ​ពិសោធន៍','Exp (yr)')}><Input type="number" value={ext.drivingExp} onChange={e=>setExt(p=>({...p,drivingExp:parseFloat(e.target.value)||0}))}/></Field>
            <Field label={tr('ថ្នាក់​គ្រូ','Inst. Level')}><Dd value={ext.instLevel} onChange={e=>setExt(p=>({...p,instLevel:e.target.value}))} options={instLevelOpts}/></Field>
            <Field label={tr('យានយន្ត','Vehicle')}><Dd value={ext.assignedVehicle} onChange={e=>setExt(p=>({...p,assignedVehicle:e.target.value}))} options={vehicleOpts}/></Field>
            <Field label={tr('ប្រវត្តិ​គ្រោះ','Accidents')}><Input value={ext.accidentHistory} onChange={e=>setExt(p=>({...p,accidentHistory:e.target.value}))}/></Field>
          </div>
        )}
      </div>
    </Card>
  );
};

const SfRow = ({ k, v }) => (
  <div style={{display:'flex',justifyContent:'space-between',gap:10}}>
    <span style={{color:'var(--ink-3)'}}>{k}</span>
    <span style={{fontWeight:500,textAlign:'right'}}>{v}</span>
  </div>
);

// ── Attendance helpers ──
const ATT_LABELS = { P:{km:'មាន', en:'Present'}, A:{km:'អវត្តមាន', en:'Absent'}, L:{km:'យឺត', en:'Late'}, H:{km:'កន្លះថ្ងៃ', en:'Half-day'}, '':{km:'—', en:'—'} };
const ATT_COLOR  = { P:'var(--good)', A:'var(--danger)', L:'var(--warn)', H:'var(--accent)', '':'var(--border)' };
const ATT_BG     = { P:'#E8F5EE', A:'#FDF2F2', L:'#FEF3E8', H:'#E5EBF5', '':'var(--surface-muted)' };

const attGet = (date, empId) => (window.__attendanceData[date] || {})[empId] || '';
const attSet = (date, empId, val) => {
  if (!window.__attendanceData[date]) window.__attendanceData[date] = {};
  window.__attendanceData[date][empId] = val;
  if (window.saveAllData) window.saveAllData();
};
const timeKey = (date, empId) => `${date}|${empId}`;
const timeGet = (date, empId) => {
  const stored = window.__attendanceTimes[timeKey(date, empId)];
  return stored || { in: '08:00', out: '17:00', break: 1 };
};
const timeSet = (date, empId, val) => {
  window.__attendanceTimes[timeKey(date, empId)] = val;
  if (window.saveAllData) window.saveAllData();
};
const calcOT = (inT, outT, brk) => {
  if (!inT || !outT) return 0;
  const [ih,im] = inT.split(':').map(Number);
  const [oh,om] = outT.split(':').map(Number);
  const hrs = ((oh*60+om) - (ih*60+im)) / 60 - (brk ?? 1);
  return Math.max(0, Math.round((hrs - 8) * 10) / 10);
};

// Cycle: '' → P → L → H → A → ''
const ATT_CYCLE = ['', 'P', 'L', 'H', 'A'];

const AttCell = ({ date, empId, onUpdate }) => {
  const val = attGet(date, empId);
  const next = () => {
    const i = ATT_CYCLE.indexOf(val);
    const nv = ATT_CYCLE[(i + 1) % ATT_CYCLE.length];
    attSet(date, empId, nv);
    onUpdate();
  };
  return (
    <div onClick={next} title={ATT_LABELS[val]?.km||'—'} style={{
      margin:'4px auto', width:28, height:28, borderRadius:6,
      background: ATT_BG[val], border:`1.5px solid ${ATT_COLOR[val]}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', fontSize:11, fontWeight:700, color: ATT_COLOR[val],
      userSelect:'none', transition:'all .1s',
    }}>
      {val || '·'}
    </div>
  );
};

// ── Attendance tab ──
const SfSchedule = ({ staff }) => {
  const { tr } = useAppActions();
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [, forceUp] = React.useReducer(x => x + 1, 0);
  const [view, setView] = React.useState('week'); // 'today' | 'week'
  const weekDates = typeof getWeekDates === 'function' ? getWeekDates(weekOffset) : [];
  const today = todayStr();

  // Auto-fill 'P' for Mon–Fri past/today dates with no attendance record
  React.useEffect(() => {
    if (!staff.length || !weekDates.length) return;
    let changed = false;
    weekDates.forEach(d => {
      const dow = new Date(d + 'T00:00:00').getDay(); // 0=Sun,6=Sat
      if (dow === 0 || dow === 6) return;            // skip weekends
      if (d > today) return;                          // skip future
      staff.forEach(s => {
        if (!attGet(d, s.id)) {
          attSet(d, s.id, 'P');
          changed = true;
        }
      });
    });
    if (changed) forceUp();
  }, [weekOffset, staff.length]);

  if (staff.length === 0) return (
    <div style={{padding:48,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      No staff to track attendance for.
    </div>
  );

  // Summary counts for today
  const todayCounts = { P:0, A:0, L:0, H:0, '':0 };
  staff.forEach(s => { const v = attGet(today, s.id); todayCounts[v] = (todayCounts[v]||0) + 1; });

  // Weekly stats per staff
  const weekStats = (s) => {
    const counts = { P:0, A:0, L:0, H:0 };
    weekDates.forEach(d => { const v = attGet(d, s.id); if (counts[v] !== undefined) counts[v]++; });
    return counts;
  };

  return (
    <div style={{padding:18}}>
      {/* header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{display:'flex',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,padding:2}}>
          {['today','week'].map(v => (
            <button key={v} onClick={()=>setView(v)} style={{
              padding:'5px 12px',border:'none',
              background:view===v?'var(--surface)':'transparent',
              color:view===v?'var(--ink)':'var(--ink-3)',
              borderRadius:5,fontSize:12,fontWeight:view===v?600:500,cursor:'pointer',
            }}>{v==='today'?tr('ថ្ងៃ​នេះ','Today'):tr('សប្ដាហ៍','Week')}</button>
          ))}
        </div>
        <div style={{flex:1}}/>
        {view==='week' && <>
          <Btn kind="ghost" size="sm" onClick={()=>setWeekOffset(o=>o-1)}>◀ មុន</Btn>
          <Btn kind="ghost" size="sm" onClick={()=>setWeekOffset(0)}>សប្ដាហ៍​នេះ</Btn>
          <Btn kind="ghost" size="sm" onClick={()=>setWeekOffset(o=>o+1)}>បន្ទាប់ ▶</Btn>
        </>}
      </div>

      {/* Today's strip summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[
          {k:'P',l:tr('មាន','Present'),   c:'var(--good)'},
          {k:'L',l:tr('យឺត','Late'),     c:'var(--warn)'},
          {k:'H',l:tr('កន្លះ','Half'),   c:'var(--accent)'},
          {k:'A',l:tr('អវត្ត','Absent'), c:'var(--danger)'},
        ].map(({k,l,c}) => (
          <div key={k} style={{padding:'10px 14px',border:`1px solid ${c}33`,borderRadius:8,background:`${c}11`}}>
            <div style={{fontSize:10,color:c,fontWeight:600,letterSpacing:'.05em',textTransform:'uppercase',marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:700,color:c,fontFamily:'var(--font-display)'}}>{todayCounts[k]||0}</div>
          </div>
        ))}
      </div>

      {view === 'today' ? (
        /* TODAY VIEW — mark each staff */
        <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'10px 16px',background:'var(--surface-muted)',display:'grid',gridTemplateColumns:'2fr 1fr 2.8fr 1fr',gap:10,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
            <div>Employee</div><div>ស្ថានភាព</div><div style={{textAlign:'center'}}>ម៉ោង​ចូល → ចេញ · សម្រាក</div><div style={{textAlign:'center'}}>វត្តមាន · OT</div>
          </div>
          {staff.map((s,i) => {
            const val = attGet(today, s.id);
            const times = timeGet(today, s.id);
            const brk = times.break ?? 1;
            const ot = calcOT(times.in, times.out, brk);
            const showTime = val === 'P' || val === 'L';
            const tInp = (prop, w) => ({
              type: prop === 'break' ? 'number' : 'time',
              value: times[prop] ?? (prop==='break' ? 1 : ''),
              min: prop === 'break' ? 0 : undefined,
              max: prop === 'break' ? 8 : undefined,
              step: prop === 'break' ? 0.5 : undefined,
              onChange: e => { timeSet(today, s.id, {...times, [prop]: prop==='break' ? parseFloat(e.target.value)||0 : e.target.value}); forceUp(); },
              style: {padding:'3px 5px',border:'1px solid var(--border)',borderRadius:5,fontSize:11,background:'var(--surface)',color:'var(--ink)',fontFamily:'monospace',width:w},
            });
            return (
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 2.8fr 1fr',gap:10,alignItems:'center',padding:'10px 16px',borderTop:i?'1px solid var(--border)':'none'}}>
                <div style={{display:'flex',gap:10,alignItems:'center',minWidth:0}}>
                  <Avatar tag={s.photo} size={32}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.role} · {s.dept}</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <SfStatusDot status={s.status}/>
                  <span style={{fontSize:12,color:'var(--ink-2)'}}>{s.status}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  {showTime ? (
                    <>
                      <input {...tInp('in', 74)}/>
                      <span style={{fontSize:10,color:'var(--ink-3)'}}>→</span>
                      <input {...tInp('out', 74)}/>
                      <span style={{fontSize:10,color:'var(--ink-3)',marginLeft:4}}>សម្រាក</span>
                      <input {...tInp('break', 46)}/>
                      <span style={{fontSize:10,color:'var(--ink-3)'}}>h</span>
                    </>
                  ) : (
                    <span style={{fontSize:11,color:'var(--ink-3)'}}>—</span>
                  )}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                  <AttCell date={today} empId={s.id} onUpdate={forceUp}/>
                  {ot > 0 && showTime && (
                    <span style={{fontSize:10,fontWeight:700,color:'var(--warn)',background:'#FEF3E8',border:'1px solid var(--warn)',borderRadius:4,padding:'2px 5px'}}>OT {ot}h</span>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{padding:'8px 16px',borderTop:'1px solid var(--border)',background:'var(--surface-muted)',fontSize:11,color:'var(--ink-3)'}}>
            ចុច​លើ​ប្រអប់​ ដើម្បី​ប្ដូរ​ស្ថានភាព · Click cell to cycle: Present → Late → Half-day → Absent
          </div>
        </div>
      ) : (
        /* WEEK VIEW — calendar grid */
        <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'160px repeat(7,1fr) 100px',background:'var(--surface-muted)',borderBottom:'1px solid var(--border)'}}>
            <div style={{padding:'10px 12px',fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',letterSpacing:'.06em',textTransform:'uppercase'}}>Employee</div>
            {DAYS_EN.map((d,di) => {
              const date = weekDates[di] || '';
              const isToday = date === today;
              return (
                <div key={di} style={{padding:'8px 4px',fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:isToday?'var(--accent)':'var(--ink-3)',textAlign:'center',borderLeft:'1px solid var(--border)',fontWeight:isToday?700:400}}>
                  {d}<br/><span style={{fontSize:11,fontWeight:600}}>{date?parseInt(date.slice(8)):di+1}</span>
                </div>
              );
            })}
            <div style={{padding:'10px 6px',fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',textAlign:'center',borderLeft:'1px solid var(--border)'}}>P · A · L</div>
          </div>
          {staff.map(s => {
            const ws = weekStats(s);
            return (
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'160px repeat(7,1fr) 100px',borderTop:'1px solid var(--border)'}}>
                <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:8}}>
                  <Avatar tag={s.photo} size={24}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.en}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)'}}>{s.dept}</div>
                  </div>
                </div>
                {weekDates.map((date, di) => {
                  const isToday = date === today;
                  const isWeekend = di >= 5;
                  return (
                    <div key={di} style={{borderLeft:'1px solid var(--border)',background:isToday?'rgba(42,93,176,.04)':isWeekend?'var(--surface-muted)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <AttCell date={date} empId={s.id} onUpdate={forceUp}/>
                    </div>
                  );
                })}
                <div style={{borderLeft:'1px solid var(--border)',padding:'8px 6px',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontSize:11,fontFamily:'"JetBrains Mono",monospace',fontWeight:600}}>
                  <span style={{color:'var(--good)'}}>{ws.P}</span>
                  <span style={{color:'var(--ink-3)'}}>/</span>
                  <span style={{color:'var(--danger)'}}>{ws.A}</span>
                  <span style={{color:'var(--ink-3)'}}>/</span>
                  <span style={{color:'var(--warn)'}}>{ws.L}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)',display:'flex',gap:16,flexWrap:'wrap'}}>
        {[['P','var(--good)','Present'],['L','var(--warn)','Late'],['H','var(--accent)','Half-day'],['A','var(--danger)','Absent']].map(([k,c,l])=>(
          <span key={k} style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:14,height:14,borderRadius:3,background:ATT_BG[k],border:`1.5px solid ${c}`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:c}}>{k}</span>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Policy card ──
const SfPolicyCard = () => {
  const { toast, tr } = useAppActions();
  const p = window.__staffPolicy;
  const [editing, setEditing] = React.useState(false);
  const [annual, setAnnual] = React.useState(p.annual);
  const [sick,   setSick]   = React.useState(p.sick);
  const [notice, setNotice] = React.useState(p.notice);
  const save = () => {
    const prevAnnual = p.annual;
    const newAnnual  = parseInt(annual) || 18;
    const diff = newAnnual - prevAnnual;
    p.annual = newAnnual; p.sick = parseInt(sick)||12; p.notice = parseInt(notice)||2;
    // Propagate change to all staff: adjust leave balance proportionally
    if (window.__staffData) {
      window.__staffData.forEach(s => {
        s.leave = Math.max(0, newAnnual + ((s.leave ?? prevAnnual) - prevAnnual));
      });
    }
    if (window.saveAllData) window.saveAllData();
    if (window.__notifyStaffChanged) window.__notifyStaffChanged();
    setEditing(false);
    toast(`គោលនយោបាយ​បានរក្សា · Policy saved${diff!==0?` · Leave ${diff>0?'+':''}${diff}d for all staff`:''}`, 'good');
  };
  return (
    <>
      <div style={{fontSize:14,fontWeight:600,marginBottom:12,marginTop:18,display:'flex',alignItems:'center',gap:8}}>
        {tr('គោល​នយោបាយ','Policy')}
        {!editing && <button onClick={()=>setEditing(true)} style={{fontSize:11,border:'1px solid var(--border)',borderRadius:5,padding:'2px 8px',background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer'}}>✎ កែ</button>}
      </div>
      {editing ? (
        <div style={{padding:14,border:'1px solid var(--accent)',borderRadius:10,background:'var(--accent-soft)',display:'flex',flexDirection:'column',gap:10}}>
          {[
            {l:'ច្បាប់​ប្រចាំ​ឆ្នាំ (ថ្ងៃ)', v:annual, set:setAnnual},
            {l:'ច្បាប់​ឈឺ (ថ្ងៃ)',            v:sick,   set:setSick},
            {l:'ស្នើ​មុន​ (សប្ដាហ៍)',          v:notice, set:setNotice},
          ].map(({l,v,set}) => (
            <div key={l} style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{flex:1,fontSize:12,color:'var(--ink-2)'}}>{l}</span>
              <input type="number" min="0" value={v} onChange={e=>set(e.target.value)}
                style={{width:70,padding:'4px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontWeight:600,textAlign:'center',background:'var(--surface)',color:'var(--ink)'}}/>
            </div>
          ))}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
            <Btn kind="ghost" size="sm" onClick={()=>setEditing(false)}>បោះ​បង់</Btn>
            <Btn kind="primary" size="sm" onClick={save}>រក្សា​ទុក</Btn>
          </div>
        </div>
      ) : (
        <div style={{padding:14,border:'1px dashed var(--border)',borderRadius:10,background:'var(--surface-muted)',fontSize:12,color:'var(--ink-2)',lineHeight:1.8}}>
          • ច្បាប់​ប្រចាំ​ឆ្នាំ: <b>{p.annual} ថ្ងៃ</b><br/>
          • ច្បាប់​ឈឺ: <b>{p.sick} ថ្ងៃ</b><br/>
          • ស្នើ​មុន​: <b>{p.notice} សប្ដាហ៍</b> (vacation)
        </div>
      )}
    </>
  );
};

// Inline editable days count for leave records
const LvDaysEdit = ({ lv, onEdit }) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(String(lv.days));
  if (editing) return (
    <input type="number" min="1" value={val} autoFocus
      onChange={e=>setVal(e.target.value)}
      onBlur={()=>{ onEdit(lv, parseInt(val)||lv.days); setEditing(false); }}
      onKeyDown={e=>{ if(e.key==='Enter'||e.key==='Escape'){ onEdit(lv, parseInt(val)||lv.days); setEditing(false); }}}
      style={{width:44,padding:'1px 4px',border:'1.5px solid var(--accent)',borderRadius:4,fontSize:11,textAlign:'center',fontFamily:'inherit'}}/>
  );
  return (
    <span onClick={()=>setEditing(true)} style={{cursor:'text',borderBottom:'1px dashed var(--ink-3)',fontWeight:600}}
      title="ចុចដើម្បីប្ដូរថ្ងៃ">{lv.days}d</span>
  );
};

// ── Leave tab ──
const SfLeave = ({ staff, leaves, pending, upcoming, addLeave, setAddLeave, onApprove, onDeny, onDelete, onEditDays }) => {
  const { toast, tr } = useAppActions();
  const denied = leaves.filter(l => l.status === 'Denied');
  return (
    <div style={{padding:18,display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:16}}>
      <div>
        {addLeave && (
          <SfLeaveForm staff={staff} onClose={()=>setAddLeave(false)}/>
        )}

        <div style={{fontSize:14,fontWeight:600,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
          {tr('រង់ចាំ​ការ​អនុម័ត','Pending')}
          <Badge tone="warn">{pending.length}</Badge>
        </div>
        {pending.length === 0 && !addLeave && (
          <div style={{padding:24,textAlign:'center',color:'var(--ink-3)',fontSize:13,border:'1px dashed var(--border)',borderRadius:10,marginBottom:16}}>
            No pending leave requests.
          </div>
        )}
        {pending.map((lv,i) => {
          const e = staff.find(s => s.id === lv.emp);
          return (
            <div key={lv.id} style={{padding:14,border:'1px solid var(--border)',borderRadius:10,marginBottom:8,background:'var(--surface)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <Avatar tag={e?.photo} size={40}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{e?.name || lv.emp}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{e?.role} · {e?.dept}</div>
                </div>
                <Badge tone="warn">{lv.type}</Badge>
              </div>
              <div style={{marginTop:12,padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8,display:'flex',gap:14,alignItems:'center'}}>
                <div><div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>FROM</div><div style={{fontSize:13,fontWeight:600,marginTop:2}}>{lv.from}</div></div>
                <Icon name="arrow" size={14}/>
                <div><div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>TO</div><div style={{fontSize:13,fontWeight:600,marginTop:2}}>{lv.to}</div></div>
                <div style={{flex:1}}/>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>DAYS</div>
                  <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)',marginTop:2}}>{lv.days}</div>
                </div>
              </div>
              <div style={{marginTop:12,display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,fontSize:11,color:'var(--ink-3)'}}>{lv.id} · {lv.reason || lv.note || ''}</div>
                <button onClick={()=>onDelete(lv)} style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,padding:'2px 6px',borderRadius:4}} title="លុប">×</button>
                <Btn kind="ghost" size="sm" onClick={()=>onDeny(lv)}>{tr('បដិសេធ','Deny')}</Btn>
                <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={()=>onApprove(lv)}>{tr('អនុម័ត','Approve')}</Btn>
              </div>
            </div>
          );
        })}

        {upcoming.length > 0 && (
          <>
            <div style={{fontSize:14,fontWeight:600,marginTop:22,marginBottom:12}}>{tr('បានអនុម័ត','Approved')}</div>
            {upcoming.map(lv => {
              const e = staff.find(s => s.id === lv.emp);
              return (
                <div key={lv.id} style={{padding:'12px 14px',border:'1px solid var(--border)',borderRadius:8,marginBottom:6,display:'flex',alignItems:'center',gap:12}}>
                  <Avatar tag={e?.photo} size={28}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500}}>{e?.name || lv.emp}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:4}}>
                      {lv.from} → {lv.to} ·
                      <LvDaysEdit lv={lv} onEdit={onEditDays}/>
                      · {lv.type}
                    </div>
                  </div>
                  <Badge tone="good">Approved</Badge>
                  <button onClick={()=>onDelete(lv)} style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:16,padding:'2px 6px',borderRadius:4}} title="លុប">×</button>
                </div>
              );
            })}
          </>
        )}

        {denied.length > 0 && (
          <>
            <div style={{fontSize:14,fontWeight:600,marginTop:22,marginBottom:12}}>បានបដិសេធ · Denied</div>
            {denied.map(lv => {
              const e = staff.find(s => s.id === lv.emp);
              return (
                <div key={lv.id} style={{padding:'12px 14px',border:'1px solid var(--border)',borderRadius:8,marginBottom:6,display:'flex',alignItems:'center',gap:12,opacity:.7}}>
                  <Avatar tag={e?.photo} size={28}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500}}>{e?.name || lv.emp}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:4}}>
                      {lv.from} → {lv.to} · <LvDaysEdit lv={lv} onEdit={onEditDays}/>
                    </div>
                  </div>
                  <Badge tone="neutral">Denied</Badge>
                  <button onClick={()=>onDelete(lv)} style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:16,padding:'2px 6px',borderRadius:4}} title="លុប">×</button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>សមតុល្យ​ · Leave balances</div>
        {staff.length === 0 ? (
          <div style={{fontSize:12,color:'var(--ink-3)'}}>No staff yet.</div>
        ) : (
          <div style={{padding:14,border:'1px solid var(--border)',borderRadius:10,marginBottom:12}}>
            {staff.map((s,i) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none'}}>
                <Avatar tag={s.photo} size={26}/>
                <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.en}</div>
                {(() => { const pol = window.__staffPolicy?.annual ?? 20; const lv = s.leave ?? pol; return (<>
                <div style={{width:90,height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
                  <div style={{width:`${Math.min(100,(lv/pol)*100)}%`,height:'100%',background:lv<6?'var(--warn)':'var(--accent)'}}/>
                </div>
                <div style={{fontSize:12,width:60,textAlign:'right',fontWeight:500}}>{lv}/{pol}d</div>
                </>); })()}
              </div>
            ))}
          </div>
        )}

        <SfPolicyCard/>
      </div>
    </div>
  );
};

// ── Leave request form ──
const SfLeaveForm = ({ staff, onClose }) => {
  const { toast, tr } = useAppActions();
  const [empId,  setEmpId]  = React.useState(staff[0]?.id || '');
  const [type,   setType]   = React.useState('Vacation');
  const [from,   setFrom]   = React.useState('');
  const [to,     setTo]     = React.useState('');
  const [reason, setReason] = React.useState('');

  const submit = () => {
    if (!empId || !from || !to) { toast('សូម​បំពេញ​ព័ត៌​មាន​ទាំងអស់', 'warn'); return; }
    const d1 = new Date(from), d2 = new Date(to);
    const days = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    const nextId = 'LV-' + Date.now().toString().slice(-6);
    window.__leaveData.push({ id:nextId, emp:empId, type, from, to, days, status:'Pending', reason, filed:'Today' });
    if (window.__notifyStaffChanged) window.__notifyStaffChanged();
    if (window.saveAllData) window.saveAllData();
    toast('បាន​ស្នើ​ច្បាប់​ឈប់', 'good');
    onClose();
  };

  return (
    <div style={{padding:16,background:'var(--surface-muted)',borderRadius:10,marginBottom:16,border:'1px solid var(--border)'}}>
      <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>{tr('ស្នើ​ច្បាប់​ឈប់','New leave request')}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <Field label={tr('បុគ្គលិក','Staff')}>
          <Select value={empId} onChange={e=>setEmpId(e.target.value)}>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </Select>
        </Field>
        <Field label={tr('ប្រភេទ','Type')}>
          <Select value={type} onChange={e=>setType(e.target.value)}>
            <option value="Vacation">{tr('ឈប់​សម្រាក','Vacation')}</option>
            <option value="Sick">{tr('ច្បាប់​ឈឺ','Sick')}</option>
            <option value="Personal">{tr('ផ្ទាល់​ខ្លួន','Personal')}</option>
            <option value="Maternity">{tr('ច្បាប់​សម្រាល','Maternity')}</option>
          </Select>
        </Field>
        <Field label={tr('ពី','From')}><Input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></Field>
        <Field label={tr('ដល់','To')}><Input type="date" value={to} onChange={e=>setTo(e.target.value)}/></Field>
      </div>
      <Field label={tr('មូល​ហេតុ','Reason')+' (optional)'} full>
        <Input value={reason} onChange={e=>setReason(e.target.value)} placeholder="..."/>
      </Field>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
        <Btn kind="ghost" size="sm" onClick={onClose}>បោះ​បង់</Btn>
        <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={submit}>ដាក់​ស្នើ</Btn>
      </div>
    </div>
  );
};

// ── Payroll tab ──
const SfPayroll = ({ staff }) => {
  const { toast } = useAppActions();
  const [, forceUp] = React.useReducer(x => x + 1, 0);

  // Semi-monthly: period = "YYYY-MM-1" (1-15) or "YYYY-MM-2" (16-end)
  const now = new Date();
  const defaultHalf = now.getDate() <= 15 ? '1' : '2';
  const [period, setPeriod] = React.useState(
    `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${defaultHalf}`
  );
  const [view, setView]         = React.useState('run');
  const [histMonth, setHistMonth] = React.useState('');

  const runs = window.__payrollRuns;

  // Parse period
  const pParts  = period.split('-');
  const pYr     = parseInt(pParts[0]);
  const pMo     = parseInt(pParts[1]);
  const pHalf   = pParts[2];
  const pLastDay = new Date(pYr, pMo, 0).getDate();
  const pLabel  = `${pParts[0]}-${pParts[1]} (${pHalf==='1'?'1–15':'16–'+pLastDay})`;

  const goPrev = () => {
    if (pHalf === '2') { setPeriod(`${pParts[0]}-${pParts[1]}-1`); return; }
    const pd = new Date(pYr, pMo - 2, 1);
    setPeriod(`${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,'0')}-2`);
  };
  const goNext = () => {
    if (pHalf === '1') { setPeriod(`${pParts[0]}-${pParts[1]}-2`); return; }
    const nd = new Date(pYr, pMo, 1);
    setPeriod(`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}-1`);
  };

  // Sum OT hours from attendance for a staff member over this period
  const calcPeriodOT = (empId) => {
    const startDay = pHalf === '1' ? 1 : 16;
    const endDay   = pHalf === '1' ? 15 : pLastDay;
    let total = 0;
    for (let d = startDay; d <= endDay; d++) {
      const ds  = `${pParts[0]}-${pParts[1]}-${String(d).padStart(2,'0')}`;
      const att = (window.__attendanceData[ds] || {})[empId];
      if (att === 'P' || att === 'L') {
        const t = timeGet(ds, empId);
        total += calcOT(t.in, t.out, t.break ?? 1);
      }
    }
    return Math.round(total * 10) / 10;
  };

  const existingRun = runs.find(r => r.month === period);

  const buildEntries = () => staff.map(s => {
    const base     = Math.round((s.salary || 0) / 2);
    const otHours  = calcPeriodOT(s.id);
    const otRate   = (s.salary || 0) / 240 * 1.5; // monthly salary ÷ 240h × 1.5
    const overtime = Math.round(otHours * otRate);
    const bonus    = 0;
    const nssf     = Math.round(base * 0.02);
    const tax      = base > 400 ? Math.round((base - 400) * 0.05) : 0;
    const gross    = base + overtime + bonus;
    const net      = gross - nssf - tax;
    return { empId: s.id, base, overtime, otHours, bonus, nssf, tax, net, paid: false };
  });

  const [entries, setEntries] = React.useState(() => existingRun ? existingRun.entries : buildEntries());

  React.useEffect(() => {
    const r = runs.find(r => r.month === period);
    setEntries(r ? r.entries : buildEntries());
  }, [period, staff.length]);

  const updateEntry = (empId, field, val) => {
    setEntries(prev => prev.map(e => {
      if (e.empId !== empId) return e;
      const next = {...e, [field]: parseFloat(val) || 0};
      next.net = next.base + next.overtime + next.bonus - next.nssf - next.tax;
      return next;
    }));
  };

  const togglePaid = (empId) => {
    setEntries(prev => prev.map(e => e.empId === empId ? {...e, paid: !e.paid} : e));
  };

  const gross     = entries.reduce((a,e) => a + e.base + e.overtime + e.bonus, 0);
  const deduct    = entries.reduce((a,e) => a + e.nssf + e.tax, 0);
  const net       = entries.reduce((a,e) => a + e.net, 0);
  const paidCount = entries.filter(e => e.paid).length;

  const saveRun = (status) => {
    const idx = runs.findIndex(r => r.month === period);
    const run = { id: 'PR-'+period, month: period, entries, status, runAt: new Date().toISOString() };
    if (idx !== -1) runs[idx] = run;
    else runs.unshift(run);
    if (window.saveAllData) window.saveAllData();
    forceUp();
    toast(status === 'Paid' ? 'ប្រាក់ខែ​បានបញ្ជាក់' : 'បានរក្សា', 'good');
  };

  const markAllPaid = () => setEntries(prev => prev.map(e => ({...e, paid: true})));

  const runStatus = existingRun?.status || 'Draft';

  const runHistLabel = (r) => {
    const ps = r.month.split('-');
    if (ps.length < 3) return r.month;
    const ld = new Date(parseInt(ps[0]), parseInt(ps[1]), 0).getDate();
    return `${ps[0]}-${ps[1]} (${ps[2]==='1'?'1–15':'16–'+ld})`;
  };

  if (staff.length === 0) return (
    <div style={{padding:48,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>No staff for payroll.</div>
  );

  return (
    <div style={{padding:18}}>

      {/* Header controls */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,padding:2}}>
          {['run','history'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:'5px 12px',border:'none',
              background:view===v?'var(--surface)':'transparent',
              color:view===v?'var(--ink)':'var(--ink-3)',
              borderRadius:5,fontSize:12,fontWeight:v===view?600:500,cursor:'pointer',
            }}>{v==='run'?'វដ្ត​ទូទាត់':'ប្រវត្តិ'}</button>
          ))}
        </div>
        {view==='run' && (
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <button onClick={goPrev} style={{padding:'5px 9px',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',cursor:'pointer',fontSize:13,lineHeight:1}}>◀</button>
            <div style={{padding:'5px 14px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,background:'var(--surface)',fontFamily:'"JetBrains Mono",monospace',minWidth:170,textAlign:'center'}}>{pLabel}</div>
            <button onClick={goNext} style={{padding:'5px 9px',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',cursor:'pointer',fontSize:13,lineHeight:1}}>▶</button>
          </div>
        )}
        {view==='history' && (
          <input type="month" value={histMonth} onChange={e=>setHistMonth(e.target.value)}
            placeholder="Filter by month"
            style={{padding:'6px 10px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,background:'var(--surface)',color:'var(--ink)'}}/>
        )}
        {view==='run' && <Badge tone={runStatus==='Paid'?'good':runStatus==='Approved'?'accent':'warn'}>{runStatus}</Badge>}
        <div style={{flex:1}}/>
        {view==='run' && <>
          <Btn kind="ghost" size="sm" onClick={markAllPaid}>✓ Mark all paid</Btn>
          <Btn kind="ghost" size="sm" onClick={()=>saveRun('Draft')}>Save draft</Btn>
          <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={()=>saveRun('Paid')}>
            បញ្ជាក់ & ទូទាត់ · Confirm & Pay
          </Btn>
        </>}
      </div>

      {view === 'run' ? (
        <>
          {/* KPI strip */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <Card><Stat label="Gross" value={`$${gross.toLocaleString()}`}/></Card>
            <Card><Stat label="ការ​កាត់" value={`-$${deduct.toLocaleString()}`} sub="NSSF + Tax"/></Card>
            <Card><Stat label="Net payable" value={`$${net.toLocaleString()}`}/></Card>
            <Card><Stat label="បានបង់" value={`${paidCount}/${entries.length}`} sub={paidCount===entries.length&&entries.length>0?'Complete':'pending'}/></Card>
          </div>

          {/* Payroll table */}
          <div style={{overflowX:'auto'}}>
          <div style={{minWidth:620,border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'2fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 100px',gap:10,background:'var(--surface-muted)',fontSize:10,letterSpacing:'.07em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
              <div>Employee</div>
              <div style={{textAlign:'right'}}>Base (½)</div>
              <div style={{textAlign:'right'}}>OT</div>
              <div style={{textAlign:'right'}}>Bonus</div>
              <div style={{textAlign:'right'}}>NSSF</div>
              <div style={{textAlign:'right'}}>Tax</div>
              <div style={{textAlign:'right'}}>Net</div>
              <div style={{textAlign:'center'}}>ទូទាត់ · Paid</div>
            </div>
            {entries.map((e) => {
              const s = staff.find(x => x.id === e.empId);
              if (!s) return null;
              return (
                <div key={e.empId} style={{padding:'10px 14px',display:'grid',gridTemplateColumns:'2fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 100px',gap:10,alignItems:'center',borderTop:'1px solid var(--border)',background:e.paid?'rgba(59,122,87,.04)':'transparent'}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',minWidth:0}}>
                    <Avatar tag={s.photo} size={28}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                      <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>
                        {s.id}{(e.otHours||0)>0?<span style={{color:'var(--warn)'}}> · OT {e.otHours}h</span>:null}
                      </div>
                    </div>
                  </div>
                  <PayCell value={e.base}     onChange={v=>updateEntry(e.empId,'base',v)}/>
                  <PayCell value={e.overtime} onChange={v=>updateEntry(e.empId,'overtime',v)}/>
                  <PayCell value={e.bonus}    onChange={v=>updateEntry(e.empId,'bonus',v)}/>
                  <div style={{textAlign:'right',fontSize:12,color:'var(--ink-3)'}}>-${e.nssf}</div>
                  <div style={{textAlign:'right',fontSize:12,color:'var(--ink-3)'}}>-${e.tax}</div>
                  <div style={{textAlign:'right',fontSize:14,fontWeight:700,color:e.paid?'var(--good)':'var(--ink)'}}>${e.net}</div>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    <button onClick={()=>togglePaid(e.empId)} style={{
                      padding:'5px 10px',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600,
                      background:e.paid?'var(--good)':'var(--surface-muted)',
                      color:e.paid?'#fff':'var(--ink-3)',
                      transition:'all .15s',
                    }}>{e.paid?'✓ Paid':'Mark paid'}</button>
                  </div>
                </div>
              );
            })}
            <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',background:'var(--surface-muted)',display:'grid',gridTemplateColumns:'2fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 100px',gap:10,fontSize:12,fontWeight:700}}>
              <div>សរុប · Total</div>
              <div style={{textAlign:'right'}}>${entries.reduce((a,e)=>a+e.base,0)}</div>
              <div style={{textAlign:'right'}}>${entries.reduce((a,e)=>a+e.overtime,0)}</div>
              <div style={{textAlign:'right'}}>${entries.reduce((a,e)=>a+e.bonus,0)}</div>
              <div style={{textAlign:'right',color:'var(--ink-3)'}}>-${entries.reduce((a,e)=>a+e.nssf,0)}</div>
              <div style={{textAlign:'right',color:'var(--ink-3)'}}>-${entries.reduce((a,e)=>a+e.tax,0)}</div>
              <div style={{textAlign:'right',color:'var(--good)'}}>${net}</div>
              <div style={{textAlign:'center',fontSize:11,color:'var(--ink-3)'}}>{paidCount}/{entries.length}</div>
            </div>
          </div>
          </div>
          <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
            Base = ½ salary · OT = (salary÷240)×1.5/h · NSSF = 2% · Tax = 5% above $400 · ចុចលើ Base/OT/Bonus ដើម្បីកែ
          </div>
        </>
      ) : (
        /* HISTORY VIEW */
        <div>
          {(() => {
            const filteredRuns = histMonth ? runs.filter(r=>r.month.startsWith(histMonth)) : runs;
            return filteredRuns.length === 0 ? (
            <div style={{padding:32,textAlign:'center',color:'var(--ink-3)',fontSize:13,border:'1px dashed var(--border)',borderRadius:10}}>
              {histMonth ? `No payroll run for ${histMonth}.` : 'No payroll runs yet. Run your first payroll above.'}
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
            <div style={{minWidth:440,border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1fr',gap:14,background:'var(--surface-muted)',fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
                <div>Period</div><div>Staff</div><div style={{textAlign:'right'}}>Gross</div><div style={{textAlign:'right'}}>Net</div><div style={{textAlign:'center'}}>Status</div>
              </div>
              {filteredRuns.map((r,i) => {
                const g = r.entries.reduce((a,e)=>a+e.base+e.overtime+e.bonus,0);
                const n = r.entries.reduce((a,e)=>a+e.net,0);
                const paid = r.entries.filter(e=>e.paid).length;
                return (
                  <div key={r.id} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1fr',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none'}}>
                    <div style={{fontSize:13,fontWeight:600,fontFamily:'"JetBrains Mono",monospace'}}>{runHistLabel(r)}</div>
                    <div style={{fontSize:12,color:'var(--ink-2)'}}>{r.entries.length} people</div>
                    <div style={{textAlign:'right',fontSize:13}}>${g.toLocaleString()}</div>
                    <div style={{textAlign:'right',fontSize:14,fontWeight:600}}>${n.toLocaleString()}</div>
                    <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <Badge tone={r.status==='Paid'?'good':r.status==='Approved'?'accent':'warn'}>{r.status}</Badge>
                      <span style={{fontSize:10,color:'var(--ink-3)'}}>{paid}/{r.entries.length} paid</span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          );
          })()}
        </div>
      )}
    </div>
  );
};

const PayCell = ({ value, onChange }) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(String(value));
  React.useEffect(() => { if (!editing) setVal(String(value)); }, [value, editing]);
  return editing ? (
    <input type="number" value={val} min="0" autoFocus
      onChange={e=>setVal(e.target.value)}
      onBlur={()=>{ onChange(val); setEditing(false); }}
      onKeyDown={e=>{ if(e.key==='Enter'||e.key==='Escape'){ onChange(val); setEditing(false); }}}
      style={{width:'100%',textAlign:'right',padding:'4px 6px',border:'1.5px solid var(--accent)',borderRadius:5,fontSize:12,background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit'}}/>
  ) : (
    <div onClick={()=>setEditing(true)} style={{textAlign:'right',fontSize:12,cursor:'text',padding:'4px 6px',borderRadius:5,border:'1px solid transparent',userSelect:'none'}}
      title="Click to edit">
      ${value}
    </div>
  );
};

// ── Docs tab ──
const SfDocs = ({ staff, forceUpdate }) => {
  const { toast } = useAppActions();
  const DOC_TYPES = [
    {k:'contract', l:'កិច្ចសន្យាការងារ', en:'Employment contract'},
    {k:'license',  l:'ប័ណ្ណបើកបរ',       en:'Driving license'},
    {k:'medical',  l:'វិញ្ញាបន​វេជ្ជ',    en:'Medical cert.'},
    {k:'bg',       l:'ត្រួត​ប្រវត្តិ',     en:'Background check'},
  ];
  const missing = staff.filter(s => s.docs && Object.values(s.docs).some(v => !v));
  return (
    <div style={{padding:18}}>
      {staff.length === 0 ? (
        <div style={{padding:32,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>No staff to show documents for.</div>
      ) : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
            {DOC_TYPES.map(t => {
              const ok = staff.filter(s => s.docs && s.docs[t.k]).length;
              return (
                <Card key={t.k}>
                  <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em'}}>{t.en.toUpperCase()}</div>
                  <div style={{fontSize:13,marginTop:4,marginBottom:8}}>{t.l}</div>
                  <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                    <div style={{fontSize:28,fontWeight:600,fontFamily:'var(--font-display)',color:ok===staff.length?'var(--good)':'var(--warn)'}}>{ok}</div>
                    <div style={{fontSize:12,color:'var(--ink-3)'}}>/ {staff.length}</div>
                  </div>
                  <div style={{height:4,background:'var(--surface-muted)',borderRadius:999,marginTop:8,overflow:'hidden'}}>
                    <div style={{width:`${(ok/staff.length)*100}%`,height:'100%',background:ok===staff.length?'var(--good)':'var(--warn)'}}/>
                  </div>
                </Card>
              );
            })}
          </div>

          {missing.length > 0 && (
            <>
              <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>ឯកសារ​ខ្វះ · Missing</div>
              <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
                {missing.map((s,i) => (
                  <div key={s.id} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'2fr 2fr 1fr',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none'}}>
                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                      <Avatar tag={s.photo} size={32}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{s.name}</div>
                        <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.role}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {DOC_TYPES.filter(t => !s.docs[t.k]).map(t => (
                        <Badge key={t.k} tone="warn">ខ្វះ · {t.en}</Badge>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                      <Btn kind="ghost" size="sm" onClick={()=>toast('Reminder sent · '+s.en,'good')}>រំ​លឹក</Btn>
                      <Btn kind="primary" size="sm" onClick={()=>{
                        if (!s.docs) s.docs = {};
                        DOC_TYPES.filter(t => !s.docs[t.k]).forEach(t => { s.docs[t.k] = 1; });
                        forceUpdate();
                        if (window.saveAllData) window.saveAllData();
                        toast('Documents marked received · '+s.en,'good');
                      }}>Mark received</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {missing.length === 0 && (
            <div style={{padding:24,textAlign:'center',color:'var(--good)',fontSize:14,fontWeight:600}}>
              ✓ ឯកសារ​ទាំង​អស់​គ្រប់គ្រាន់ · All documents complete
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Print helpers ──
const printStaffCard = (s) => {
  if (!s) return;
  const ss = window.__schoolSettings || {};
  const school = ss.name || 'ANZEN Driving School';
  const w = window.open('', '_blank', 'width=450,height=340');
  const photoHtml = s.photo
    ? `<img src="${s.photo}" style="width:90px;height:90px;border-radius:8px;object-fit:cover;border:2px solid rgba(255,255,255,.15)"/>`
    : `<div style="width:90px;height:90px;border-radius:8px;background:#333;display:flex;align-items:center;justify-content:center;font-size:36px">👤</div>`;
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>Staff Card</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: 85.6mm 54mm; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Noto Sans Khmer', sans-serif; background: #fff; }
      .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 20px; font-family:'Noto Sans Khmer',sans-serif; }
      .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
      .pdf-bar button:hover { background:#3a6dc0; }
      .pdf-bar span { font-size:12px; opacity:.7; }
      @media print { .pdf-bar { display:none !important; } }
      .card { width:85.6mm; height:54mm; background:#111; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 14px; position:relative; overflow:hidden; }
      .card::before { content:''; position:absolute; right:-20px; top:-20px; width:110px; height:110px; border-radius:50%; background:rgba(255,255,255,.04); }
      .card::after  { content:''; position:absolute; right:14px; bottom:-28px; width:70px; height:70px; border-radius:50%; background:rgba(255,255,255,.03); }
      .info { flex:1; min-width:0; position:relative; }
      .school { font-size:7pt; opacity:.5; letter-spacing:.1em; text-transform:uppercase; margin-bottom:5px; }
      .name-km { font-size:14pt; font-weight:700; line-height:1.1; margin-bottom:2px; }
      .name-en { font-size:9pt; opacity:.55; margin-bottom:7px; }
      .role { font-size:9pt; opacity:.85; }
      .dept { font-size:7.5pt; opacity:.5; margin-top:2px; }
      .id-bar { margin-top:9px; padding-top:7px; border-top:1px solid rgba(255,255,255,.12); display:flex; justify-content:space-between; align-items:center; }
      .id-num { font-size:7.5pt; opacity:.45; font-family:monospace; }
      .phone  { font-size:8.5pt; opacity:.75; }
    </style>
  </head><body>
    <div class="card">
      ${photoHtml}
      <div class="info">
        <div class="school">${school}</div>
        <div class="name-km">${s.name||''}</div>
        <div class="name-en">${s.en||''}</div>
        <div class="role">${s.role||''}</div>
        <div class="dept">${s.dept||''}</div>
        <div class="id-bar">
          <span class="id-num">${s.id||''}</span>
          <span class="phone">${(s.phone&&s.phone!=='—')?s.phone:''}</span>
        </div>
      </div>
    </div>
    <div class="pdf-bar">
      <button onclick="window.print()">💾 រក្សា​ទុក​ជា PDF</button>
      <span>ជ្រើស "Save as PDF" ហើយ​ចុច Save</span>
    </div>
  </body></html>`);
  w.document.close();
};

const printPayslip = (s) => {
  if (!s) return;
  const runs = window.__payrollRuns || [];
  const ss = window.__schoolSettings || {};
  const school = ss.name || 'ANZEN Driving School';
  let latestEntry = null, latestPeriod = '';
  for (const r of runs) {
    const e = r.entries && r.entries.find(e => e.empId === s.id);
    if (e && (!latestPeriod || r.month > latestPeriod)) { latestEntry = e; latestPeriod = r.month; }
  }
  const periodLabel = (p) => {
    if (!p) return '—';
    const ps = p.split('-');
    if (ps.length < 3) return p;
    const ld = new Date(parseInt(ps[0]), parseInt(ps[1]), 0).getDate();
    return `${ps[0]}-${ps[1]} (${ps[2]==='1'?'1–15':'16–'+ld})`;
  };
  const base  = latestEntry ? latestEntry.base  : Math.round((s.salary||0)/2);
  const ot    = latestEntry ? latestEntry.overtime : 0;
  const bonus = latestEntry ? latestEntry.bonus : 0;
  const nssf  = latestEntry ? latestEntry.nssf  : Math.round(base*0.02);
  const tax   = latestEntry ? latestEntry.tax   : (base>400?Math.round((base-400)*0.05):0);
  const net   = latestEntry ? latestEntry.net   : (base+ot+bonus-nssf-tax);
  const today = new Date().toISOString().split('T')[0];
  const w = window.open('', '_blank', 'width=580,height=760');
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>Payslip · ${s.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: A5; margin: 12mm; }
      body { font-family:'Noto Sans Khmer',sans-serif; font-size:10pt; color:#111; margin:0; }
      .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 20px; font-family:'Noto Sans Khmer',sans-serif; }
      .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
      .pdf-bar button:hover { background:#3a6dc0; }
      .pdf-bar span { font-size:12px; opacity:.7; }
      @media print { .pdf-bar { display:none !important; } }
      h1 { text-align:center; font-size:17pt; margin:0 0 2px; }
      .sub { text-align:center; font-size:9pt; color:#666; margin-bottom:12px; }
      .period { display:inline-block; background:#111; color:#fff; padding:3px 14px; border-radius:4px; font-size:9.5pt; margin-bottom:14px; }
      .center { text-align:center; }
      .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 14px; background:#f6f6f6; padding:10px 12px; border-radius:7px; margin-bottom:14px; font-size:9pt; }
      .lbl { color:#888; font-size:7.5pt; text-transform:uppercase; letter-spacing:.05em; }
      .val { font-weight:600; }
      table { width:100%; border-collapse:collapse; }
      th { background:#111; color:#fff; padding:6px 10px; font-size:8pt; text-align:left; font-weight:600; }
      td { padding:6px 10px; border-bottom:1px solid #eee; font-size:9.5pt; }
      .deduct { color:#c00; }
      .total-row td { font-weight:700; font-size:11pt; background:#f6f6f6; border-top:2px solid #111; }
      .footer { margin-top:20px; display:flex; justify-content:space-between; font-size:8pt; color:#aaa; border-top:1px solid #eee; padding-top:8px; }
      .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:40px; }
      .sig-line { border-top:1px solid #ccc; padding-top:4px; text-align:center; font-size:8pt; color:#888; margin-top:40px; }
    </style>
  </head><body>
    <h1>${school}</h1>
    <div class="sub">ក្រដាស​ប្រាក់​ខែ · PAYSLIP</div>
    <div class="center"><span class="period">${periodLabel(latestPeriod)}</span></div>
    <div class="info-grid">
      <div><div class="lbl">ឈ្មោះ · Name</div><div class="val">${s.name||''}</div></div>
      <div><div class="lbl">Name EN</div><div class="val">${s.en||''}</div></div>
      <div><div class="lbl">ID</div><div class="val">${s.id||''}</div></div>
      <div><div class="lbl">Role · Dept</div><div class="val">${s.role||''} · ${s.dept||''}</div></div>
    </div>
    <table>
      <tr><th colspan="2">ប្រាក់​ · EARNINGS</th></tr>
      <tr><td>ប្រាក់ខែ​មូលដ្ឋាន · Base (½ month)</td><td style="text-align:right">$${base}</td></tr>
      <tr><td>ម៉ោង OT · Overtime</td><td style="text-align:right">$${ot}</td></tr>
      <tr><td>ប្រាក់​រង្វាន់ · Bonus</td><td style="text-align:right">$${bonus}</td></tr>
      <tr><th colspan="2">ការ​កាត់ · DEDUCTIONS</th></tr>
      <tr><td>NSSF (2%)</td><td style="text-align:right" class="deduct">−$${nssf}</td></tr>
      <tr><td>ពន្ធ​ · Tax</td><td style="text-align:right" class="deduct">−$${tax}</td></tr>
      <tr class="total-row"><td>សរុប​សុទ្ធ · NET PAY</td><td style="text-align:right">$${net}</td></tr>
    </table>
    <div class="footer"><span>ចេញ · Issued: ${today}</span><span>${school}</span></div>
    <div class="sig-grid">
      <div class="sig-line">ហត្ថ​លេខា​បុគ្គ​លិក · Employee Signature<br/>${s.name||''}</div>
      <div class="sig-line">ហត្ថ​លេខា​អ្នក​គ្រប់​គ្រង · Authorized<br/>${school}</div>
    </div>
    <div class="pdf-bar">
      <button onclick="window.print()">💾 រក្សា​ទុក​ជា PDF</button>
      <span>ជ្រើស "Save as PDF" ហើយ​ចុច Save</span>
    </div>
  </body></html>`);
  w.document.close();
};

const printStaffProfile = (s) => {
  if (!s) return;
  const ss = window.__schoolSettings || {};
  const school = ss.name || 'ANZEN Driving School';
  const pol = window.__staffPolicy || {annual:20,sick:12};
  const ext = s.ext || {};
  const docs = s.docs || {};
  const MARITAL = {single:'នៅ​លីវ', married:'រៀបការ', divorced:'លែង​លះ'};
  const EDU = {primary:'បឋម​សិក្សា', secondary:'មធ្យម​សិក្សា', high:'វិទ្យាល័យ', bachelor:'បរិញ្ញាបត្រ', master:'អនុ​បណ្ឌិត'};
  const row = (k, v) => v ? `<tr><td style="color:#888;font-size:8.5pt;width:42%">${k}</td><td style="font-weight:600">${v}</td></tr>` : '';
  const docRow = (k, l) => `<tr><td>${l}</td><td style="color:${docs[k]?'#2e7d32':'#c62828'};font-weight:600">${docs[k]?'✓ OK':'✗ ខ្វះ'}</td></tr>`;
  const today = new Date().toISOString().split('T')[0];
  const w = window.open('', '_blank', 'width=700,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>Profile · ${s.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size:A4; margin:15mm; }
      body { font-family:'Noto Sans Khmer',sans-serif; font-size:10pt; color:#111; margin:0; }
      .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 20px; font-family:'Noto Sans Khmer',sans-serif; }
      .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
      .pdf-bar button:hover { background:#3a6dc0; }
      .pdf-bar span { font-size:12px; opacity:.7; }
      @media print { .pdf-bar { display:none !important; } }
      .hdr { display:flex; gap:16px; align-items:flex-start; margin-bottom:16px; padding-bottom:16px; border-bottom:2px solid #111; }
      .photo { width:76px; height:76px; border-radius:8px; object-fit:cover; background:#eee; }
      .name { font-size:18pt; font-weight:700; }
      .sub  { font-size:9.5pt; color:#555; margin-top:3px; }
      .badges { display:flex; gap:5px; margin-top:6px; }
      .badge { font-size:7.5pt; padding:2px 8px; border-radius:4px; background:#111; color:#fff; }
      h3 { font-size:8.5pt; text-transform:uppercase; letter-spacing:.08em; color:#888; border-bottom:1px solid #eee; padding-bottom:3px; margin:14px 0 7px; }
      table { width:100%; border-collapse:collapse; font-size:9.5pt; }
      td { padding:4px 6px; border-bottom:1px solid #f0f0f0; }
      .g2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
      .footer { margin-top:20px; font-size:7.5pt; color:#aaa; display:flex; justify-content:space-between; border-top:1px solid #eee; padding-top:7px; }
    </style>
  </head><body>
    <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:8pt;color:#888">
      <span style="text-transform:uppercase;letter-spacing:.07em">${school}</span>
      <span>ប្រវត្តិរូប​បុគ្គលិក · STAFF PROFILE</span>
    </div>
    <div class="hdr">
      ${s.photo?`<img src="${s.photo}" class="photo"/>`:`<div class="photo" style="display:flex;align-items:center;justify-content:center;font-size:30px">👤</div>`}
      <div style="flex:1">
        <div class="name">${s.name||''}</div>
        <div class="sub">${s.en||''} &nbsp;·&nbsp; ${s.id||''}</div>
        <div class="badges">
          <span class="badge">${s.role||''}</span>
          <span class="badge">${s.dept||''}</span>
          ${s.status?`<span class="badge" style="background:#444">${s.status}</span>`:''}
        </div>
      </div>
    </div>
    <div class="g2">
      <div>
        <h3>ការ​ងារ · EMPLOYMENT</h3>
        <table>
          ${row('ចូល​ធ្វើ', s.since)}
          ${row('ប្រភេទ', ext.empType||'Full-time')}
          ${row('Dept', s.dept)} ${row('Phone', s.phone!=='—'?s.phone:'')}
          ${row('Email', s.email!=='—'?s.email:'')} ${row('Manager', ext.manager)}
        </table>
        <h3>ប្រាក់​ · COMPENSATION</h3>
        <table>
          ${row('Salary', s.salary?'$'+s.salary+'/month':'')}
          ${row('Type', s.salaryType==='hourly'?'Hourly':'Monthly')}
          ${(ext.allowance||0)>0?row('Allowance','$'+ext.allowance):''}
          ${row('Bank', ext.bankAccount)}
        </table>
        <h3>ច្បាប់​ · LEAVE</h3>
        <table>
          <tr><td style="color:#888;font-size:8.5pt">ប្រចាំ​ឆ្នាំ</td><td style="font-weight:600">${s.leave??pol.annual} / ${pol.annual} ថ្ងៃ</td></tr>
        </table>
        <h3>ឯកសារ · DOCUMENTS</h3>
        <table>
          ${docRow('contract','កិច្ចសន្យា')}
          ${docRow('license','ប័ណ្ណ​បើក​បរ')} ${docRow('medical','វិញ្ញាបន​វេជ្ជ')} ${docRow('bg','ត្រួត​ប្រវត្តិ')}
        </table>
      </div>
      <div>
        <h3>ផ្ទាល់​ខ្លួន · PERSONAL</h3>
        <table>
          ${row('Gender', ext.gender==='M'?'ប្រុស':ext.gender==='F'?'ស្រី':ext.gender)}
          ${row('DOB', ext.dob)} ${row('Marital', MARITAL[ext.marital]||ext.marital)}
          ${row('ID/Passport', ext.idNum)} ${row('Address', ext.address)}
        </table>
        ${(ext.emergencyName||ext.emergencyPhone)?`
        <h3>អន្ត​រាយ · EMERGENCY</h3>
        <table>
          ${row('Name', ext.emergencyName)} ${row('Relation', ext.emergencyRel)} ${row('Phone', ext.emergencyPhone)}
        </table>`:''}
        ${(ext.eduLevel||ext.school||ext.languages)?`
        <h3>ការ​សិក្សា · EDUCATION</h3>
        <table>
          ${row('Level', EDU[ext.eduLevel]||ext.eduLevel)} ${row('School', ext.school)}
          ${row('Languages', ext.languages)} ${row('Skills', ext.skills)}
        </table>`:''}
        ${(ext.licenseType||ext.drivingExp)?`
        <h3>បើក​បរ · DRIVING</h3>
        <table>
          ${row('License type', ext.licenseType)} ${row('Expiry', ext.licenseExpiry)}
          ${ext.drivingExp?row('Experience', ext.drivingExp+' ឆ្នាំ'):''}
          ${row('Inst. level', ext.instLevel)} ${row('Vehicle', ext.assignedVehicle)}
        </table>`:''}
      </div>
    </div>
    <div class="footer"><span>ចេញ · ${today}</span><span>${school}</span></div>
    <div class="pdf-bar">
      <button onclick="window.print()">💾 រក្សា​ទុក​ជា PDF</button>
      <span>ជ្រើស "Save as PDF" ហើយ​ចុច Save</span>
    </div>
  </body></html>`);
  w.document.close();
};

const printWorkTerms = (s) => {
  if (!s) return;
  const ss = window.__schoolSettings || {};
  const school = ss.name || 'ANZEN Driving School';
  const pol = window.__staffPolicy || {annual:20,sick:12,notice:2};
  const ext = s.ext || {};
  const today = new Date().toISOString().split('T')[0];
  const otRate = s.salary ? ((s.salary/240)*1.5).toFixed(2) : '—';
  const w = window.open('', '_blank', 'width=700,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>Work Terms · ${s.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size:A4; margin:20mm; }
      body { font-family:'Noto Sans Khmer',sans-serif; font-size:11pt; color:#111; margin:0; line-height:1.75; }
      .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 20px; font-family:'Noto Sans Khmer',sans-serif; }
      .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
      .pdf-bar button:hover { background:#3a6dc0; }
      .pdf-bar span { font-size:12px; opacity:.7; }
      @media print { .pdf-bar { display:none !important; } }
      h1 { text-align:center; font-size:17pt; margin:0 0 3px; }
      .center { text-align:center; }
      .info-box { background:#f6f6f6; border-radius:7px; padding:10px 14px; margin:14px 0; font-size:10pt; }
      .art-title { font-weight:700; font-size:11pt; margin:16px 0 4px; }
      .line { border-bottom:1px solid #111; display:inline-block; min-width:140px; padding:0 4px; }
      .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:54px; }
      .sig { text-align:center; }
      .sig-line { border-top:1px solid #ccc; margin-top:46px; padding-top:5px; font-size:8.5pt; color:#666; }
      .footer { margin-top:24px; font-size:8pt; color:#aaa; display:flex; justify-content:space-between; border-top:1px solid #eee; padding-top:7px; }
    </style>
  </head><body>
    <div class="center" style="font-size:9pt;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:6px">${school}</div>
    <h1>លក្ខខណ្ឌ​ការ​ងារ</h1>
    <div class="center" style="font-size:9pt;color:#888;margin-bottom:16px">TERMS OF EMPLOYMENT</div>
    <div class="info-box">
      <strong>ក្រុម​ហ៊ុន:</strong> ${school} &nbsp;&nbsp;
      <strong>ឈ្មោះ:</strong> ${s.name||''} (${s.en||''}) &nbsp;&nbsp;
      <strong>ID:</strong> ${s.id||''}<br/>
      <strong>តួ​នាទី:</strong> ${s.role||''} &nbsp;·&nbsp; <strong>Dept:</strong> ${s.dept||''}
    </div>
    <div class="art-title">មាត្រា ១ · ការ​ចូល​ធ្វើ​ការ</div>
    <div>ចូល​ធ្វើ​ការ​ចាប់​ពី: <span class="line">${s.since||''}</span></div>
    <div>ប្រភេទ​កិច្ចសន្យា: <span class="line">${ext.empType||'Full-time'}</span></div>
    <div class="art-title">មាត្រា ២ · ប្រាក់​ខែ</div>
    <div>ប្រាក់​ខែ​ · Salary: <span class="line">$${s.salary||'___'} / ខែ</span></div>
    <div>ការ​ទូទាត់: <span class="line">${s.salaryType==='hourly'?'ប្រចាំ​ម៉ោង':'២ ដង​ / ខែ (ថ្ងៃ​ទី ១ & ១៥)'}</span></div>
    ${(ext.allowance||0)>0?`<div>ប្រាក់​ឧបត្ថម្ភ · Allowance: <span class="line">$${ext.allowance}</span></div>`:''}
    <div class="art-title">មាត្រា ៣ · ម៉ោង​ធ្វើ​ការ</div>
    <div>ម៉ោង​ធ្វើ​ការ: ០៨:០០ – ១៧:០០ · ស​ម្រាក ១ ម៉ោង / ថ្ងៃ</div>
    <div>ម៉ោង OT: អត្រា $${otRate} / ម៉ោង</div>
    <div class="art-title">មាត្រា ៤ · ច្បាប់​ឈប់​សម្រាក</div>
    <div>ច្បាប់​ប្រចាំ​ឆ្នាំ: <span class="line">${pol.annual} ថ្ងៃ</span> &nbsp;·&nbsp; ច្បាប់​ឈឺ: <span class="line">${pol.sick} ថ្ងៃ</span></div>
    <div>ស្នើ​ច្បាប់​មុន: <span class="line">${pol.notice} សប្ដាហ៍</span></div>
    <div class="art-title">មាត្រា ៥ · ការ​បញ្ចប់​កិច្ចសន្យា</div>
    <div>ជូន​ដំណឹង​ · Notice period: <span class="line">${pol.notice} សប្ដាហ៍</span></div>
    <div style="margin-top:16px;font-size:9pt;color:#888">ស្ង្វែក​ · Signed: <span class="line">${today}</span></div>
    <div class="sig-grid">
      <div class="sig"><div class="sig-line">ហត្ថ​លេខា​បុគ្គ​លិក · Employee<br/>${s.name||''}</div></div>
      <div class="sig"><div class="sig-line">ហត្ថ​លេខា​អ្នក​គ្រប់​គ្រង · Authorized<br/>${school}</div></div>
    </div>
    <div class="footer"><span>ចេញ · ${today}</span><span>${school}</span></div>
    <div class="pdf-bar">
      <button onclick="window.print()">💾 រក្សា​ទុក​ជា PDF</button>
      <span>ជ្រើស "Save as PDF" ហើយ​ចុច Save</span>
    </div>
  </body></html>`);
  w.document.close();
};

const PrintRow = ({ label, staff, onPrint }) => {
  const [selId, setSelId] = React.useState(staff[0]?.id || '');
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{flex:1,fontSize:12.5,fontWeight:500}}>{label}</div>
      <select value={selId} onChange={e=>setSelId(e.target.value)} style={{
        padding:'5px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,
        background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit',maxWidth:180,
      }}>
        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
      </select>
      <button onClick={()=>onPrint(staff.find(s=>s.id===selId))} style={{
        background:'#111',color:'#fff',border:'none',borderRadius:6,
        padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:600,
        display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
      }}>💾 PDF</button>
    </div>
  );
};

const SfPrintMenu = ({ staff }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  if (staff.length === 0) return null;
  const ITEMS = [
    {label:'💾 កាតបុគ្គ​លិក (PDF)',                    fn: printStaffCard},
    {label:'💾 ប្រាក់ខែ (PDF)', fn: printPayslip},
    {label:'💾 ប្រវត្តិ​រូប (PDF)',            fn: printStaffProfile},
    {label:'💾 លក្ខ​ខណ្ឌ​ការ​ងារ (PDF)',                fn: printWorkTerms},
  ];
  return (
    <div style={{position:'relative'}} ref={ref}>
      <Btn kind="ghost" size="sm" onClick={()=>setOpen(v=>!v)}>
        💾 PDF
      </Btn>
      {open && (
        <div style={{
          position:'absolute',right:0,top:'calc(100% + 6px)',zIndex:9999,
          background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,
          boxShadow:'0 8px 32px rgba(0,0,0,.16)',padding:'14px 16px',minWidth:520,
        }}>
          <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>
            💾 PDF Documents
          </div>
          {ITEMS.map(({label,fn}) => (
            <PrintRow key={label} label={label} staff={staff}
              onPrint={s => { fn(s); setOpen(false); }}/>
          ))}
          <div style={{paddingTop:10,fontSize:10,color:'var(--ink-3)'}}>
            ជ្រើស​បុគ្គ​លិក​ → ចុច 💾 PDF
          </div>
        </div>
      )}
    </div>
  );
};

// ── Extended profile display ──
const SfExtendedInfo = ({ s }) => {
  const [open, setOpen] = React.useState(false);
  const ext = s.ext || {};
  const hasData = Object.values(ext).some(v => v && v !== 0 && v !== '');
  if (!hasData) return null;

  // Stack label above value so the value gets the full column width — this
  // stops dates/IDs from wrapping in the middle of a word on narrow screens.
  const XRow = ({k, v}) => v ? (
    <div style={{fontSize:12,minWidth:0}}>
      <div style={{color:'var(--ink-3)',fontSize:10.5,marginBottom:1,whiteSpace:'nowrap'}}>{k}</div>
      <div style={{fontWeight:500,overflowWrap:'break-word'}}>{v}</div>
    </div>
  ) : null;
  const Sec = ({title, children}) => (
    <div style={{minWidth:0}}>
      <div style={{fontSize:11.5,fontWeight:700,color:'var(--ink-2)',marginBottom:8}}>{title}</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>{children}</div>
    </div>
  );

  const MARITAL = {single:'នៅ​លីវ', married:'រៀបការ', divorced:'លែង​លះ'};
  const EDU = {primary:'បឋម​សិក្សា', secondary:'មធ្យម​សិក្សា', high:'វិទ្យាល័យ', bachelor:'បរិញ្ញាបត្រ', master:'អនុ​បណ្ឌិត'};
  const GENDER = {M:'ប្រុស', F:'ស្រី'};

  return (
    <div style={{borderTop:'1px dashed var(--border)'}}>
      <button onClick={()=>setOpen(v=>!v)} style={{
        width:'100%',padding:'10px 18px',background:'none',border:'none',cursor:'pointer',
        display:'flex',alignItems:'center',gap:8,color:'var(--ink-2)',fontSize:12,textAlign:'left',
      }}>
        <span style={{fontSize:10}}>{open?'▲':'▼'}</span>
        ព័ត៌មានលម្អិតបន្ថែម
        {!open && <span style={{fontSize:11,color:'var(--ink-3)',marginLeft:'auto'}}>ចុចដើម្បីបើក</span>}
      </button>
      {open && (
        <div style={{padding:'0 18px 18px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:16}}>
          {(ext.gender||ext.dob||ext.marital||ext.idNum||ext.address) && (
            <Sec title="ផ្ទាល់ខ្លួន">
              <XRow k="ភេទ" v={GENDER[ext.gender]||ext.gender}/>
              <XRow k="ថ្ងៃខែកំណើត" v={ext.dob}/>
              <XRow k="ស្ថានភាព" v={MARITAL[ext.marital]||ext.marital}/>
              <XRow k="អត្តសញ្ញាណ" v={ext.idNum}/>
              <XRow k="អាសយដ្ឋាន" v={ext.address}/>
            </Sec>
          )}
          {(ext.emergencyName||ext.emergencyRel||ext.emergencyPhone) && (
            <Sec title="ទំនាក់ទំនងបន្ទាន់">
              <XRow k="ឈ្មោះ" v={ext.emergencyName}/>
              <XRow k="ទំនាក់ទំនង" v={ext.emergencyRel}/>
              <XRow k="ទូរស័ព្ទ" v={ext.emergencyPhone}/>
            </Sec>
          )}
          {(ext.empType||ext.manager||(ext.allowance>0)||ext.bankAccount) && (
            <Sec title="ការងារ">
              <XRow k="ប្រភេទការងារ" v={ext.empType}/>
              <XRow k="អ្នកគ្រប់គ្រង" v={ext.manager}/>
              {(ext.allowance||0) > 0 && <XRow k="ប្រាក់ឧបត្ថម្ភ" v={`$${ext.allowance}`}/>}
              <XRow k="គណនីធនាគារ" v={ext.bankAccount}/>
            </Sec>
          )}
          {(ext.eduLevel||ext.school||ext.languages||ext.skills) && (
            <Sec title="ការសិក្សា">
              <XRow k="កម្រិត" v={EDU[ext.eduLevel]||ext.eduLevel}/>
              <XRow k="វិទ្យាស្ថាន" v={ext.school}/>
              <XRow k="ភាសា" v={ext.languages}/>
              <XRow k="ជំនាញ" v={ext.skills}/>
            </Sec>
          )}
          {(ext.licenseType||ext.licenseExpiry||(ext.drivingExp>0)||ext.instLevel||ext.assignedVehicle||ext.accidentHistory) && (
            <Sec title="ការបើកបរ">
              <XRow k="ប្រភេទប័ណ្ណ" v={ext.licenseType}/>
              <XRow k="ថ្ងៃផុតកំណត់" v={ext.licenseExpiry}/>
              {(ext.drivingExp||0) > 0 && <XRow k="បទពិសោធន៍" v={`${ext.drivingExp} ឆ្នាំ`}/>}
              <XRow k="ថ្នាក់គ្រូ" v={ext.instLevel}/>
              <XRow k="យានយន្ត" v={ext.assignedVehicle}/>
              <XRow k="ប្រវត្តិគ្រោះថ្នាក់" v={ext.accidentHistory}/>
            </Sec>
          )}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { StaffScreen });
