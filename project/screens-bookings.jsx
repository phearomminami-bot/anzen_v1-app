// screens-bookings.jsx — Booking management (admin-facing)

if (!window.__bookingData) window.__bookingData = [];

const bookingStatusTone = s => ({
  Confirmed:'good', Pending:'warn', Rescheduled:'accent',
  Completed:'neutral', Cancelled:'danger', 'No-show':'danger',
}[s] || 'neutral');

const sourceLabel = s => ({app:'App', phone:'Phone', reception:'Reception', walkin:'Walk-in'}[s] || s);

// ── Main admin screen ────────────────────────────────────────────────────────
const BookingsScreen = () => {
  const { openForm, toast, tr } = useAppActions();
  const bp = useBreakpoint();
  const [bookings, setBookings] = React.useState(window.__bookingData);
  const [tab, setTab]       = React.useState('queue');
  const [filter, setFilter] = React.useState('all');
  const [view, setView]     = React.useState('list');
  const [selected, setSelected] = React.useState(null);

  React.useEffect(() => {
    window.__notifyBookingsChanged = () => setBookings([...window.__bookingData]);
    return () => { delete window.__notifyBookingsChanged; };
  }, []);

  const approve = (id) => {
    setBookings(prev => prev.map(b => b.id===id ? {...b, status:'Confirmed'} : b));
    toast(`✅ BK ត្រូវ​បាន​អនុម័ត`, 'good');
  };
  const decline = (id) => {
    setBookings(prev => prev.map(b => b.id===id ? {...b, status:'Cancelled'} : b));
    toast(`❌ BK ត្រូវ​បាន​បដិសេធ`, 'warn');
  };
  const cancel = (id) => {
    setBookings(prev => prev.map(b => b.id===id ? {...b, status:'Cancelled'} : b));
    if (selected?.id === id) setSelected(prev => ({...prev, status:'Cancelled'}));
    toast('ការ​កក់​ត្រូវ​បាន​លុបចោល', 'warn');
  };

  const tabs = [
    {id:'queue',         km:'ការ​កក់',          en:'Bookings',       icon:'cal'},
    {id:'requests',      km:'សំណើ​រង់ចាំ',      en:'Requests',       icon:'bell'},
    {id:'availability',  km:'ម៉ោង​ទំនេរ',       en:'Availability',   icon:'star'},
    {id:'waitlist',      km:'បញ្ជី​រង់ចាំ',      en:'Waitlist',       icon:'users'},
    {id:'cancellations', km:'លុបចោល​ & ផ្លាស់',  en:'Cancellations',  icon:'chev'},
  ];

  const filtered = bookings.filter(b =>
    filter==='all'        ||
    (filter==='confirmed'  && b.status==='Confirmed') ||
    (filter==='pending'    && b.status==='Pending') ||
    (filter==='resched'    && b.status==='Rescheduled') ||
    (filter==='completed'  && b.status==='Completed') ||
    (filter==='cancelled'  && b.status==='Cancelled')
  );

  const pendingCount = bookings.filter(b => b.status==='Pending').length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="ការគ្រប់គ្រងការកក់"
        en={`Bookings · ${bookings.filter(b=>b.status==='Confirmed').length} confirmed · ${pendingCount} pending`}
        action={bp.mobile ? null : (
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" icon={<Icon name="cal" size={14}/>}
              onClick={() => toast('Calendar view មិន​ទាន់​អាច​ប្រើ','warn')}>
              {tr('បើក​ប្រតិទិន','Calendar')}
            </Btn>
            <Btn kind="ghost" size="md" onClick={() => toast('Export មិន​ទាន់​អាច​ប្រើ','warn')}>
              {tr('នាំចេញ','Export')}
            </Btn>
            <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}
              onClick={() => openForm('newLesson')}>
              {tr('ការ​កក់​ដោយ​ដៃ','Manual book')}
            </Btn>
          </div>
        )}
      />

      {/* KPI strip — 2 columns on mobile so the cards don't crush */}
      <div style={{display:'grid',gridTemplateColumns:bp.mobile?'repeat(2,1fr)':'repeat(5,1fr)',gap:bp.mobile?8:12}}>
        <Card><Stat label={tr('ការ​កក់​សកម្ម','Active')}        value={bookings.filter(b=>['Confirmed','Pending','Rescheduled'].includes(b.status)).length}/></Card>
        <Card><Stat label={tr('សំណើ​​រង់ចាំ','Pending')}         value={pendingCount} sub="ត្រូវ​​អនុម័ត"/></Card>
        <Card><Stat label={tr('ការ​ប្រឡង​ផ្លូវ','Road exams')}  value={bookings.filter(b=>b.type&&b.type.toLowerCase().includes('exam')&&b.status==='Confirmed').length} sub="Confirmed"/></Card>
        <Card><Stat label={tr('ការ​លុបចោល','Cancellations')}   value={bookings.filter(b=>b.status==='Cancelled').length} sub="ទាំងអស់"/></Card>
        <Card><Stat label="No-show"                        value={bookings.filter(b=>b.status==='No-show').length} sub="ទាំងអស់"/></Card>
      </div>

      <Card pad={0}>
        {/* Sub-tabs */}
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:4,alignItems:'center',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          {tabs.map(t => {
            const badge = t.id==='requests' ? pendingCount : null;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display:'inline-flex',alignItems:'center',gap:7,
                padding:'7px 12px',border:'none',
                background: tab===t.id ? 'var(--surface-muted)' : 'transparent',
                color:       tab===t.id ? 'var(--ink)'           : 'var(--ink-3)',
                borderRadius:7, fontSize:12, fontWeight: tab===t.id ? 600 : 500, cursor:'default',
              }}>
                <Icon name={t.icon} size={13}/>
                {tr(t.km, t.en)}
                {badge > 0 && <span style={{padding:'1px 6px',background:'var(--warn)',color:'#fff',borderRadius:999,fontSize:9,fontWeight:700}}>{badge}</span>}
              </button>
            );
          })}
          <div style={{flex:1}}/>
          {tab==='queue' && (
            <div style={{display:'flex',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,padding:2}}>
              {['list','timeline'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'4px 10px',border:'none',
                  background: view===v ? 'var(--surface)' : 'transparent',
                  color:       view===v ? 'var(--ink)'     : 'var(--ink-3)',
                  borderRadius:5, fontSize:11, fontWeight:500, cursor:'default', textTransform:'capitalize',
                }}>{v}</button>
              ))}
            </div>
          )}
        </div>

        {tab==='queue' && (
          <div>
            {/* Filter chips */}
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap'}}>
              {[
                {id:'all',       l:tr('ទាំងអស់','All'),              n: bookings.length},
                {id:'confirmed', l:tr('បាន​បញ្ជាក់','Confirmed'),    n: bookings.filter(b=>b.status==='Confirmed').length},
                {id:'pending',   l:tr('រង់ចាំ','Pending'),           n: bookings.filter(b=>b.status==='Pending').length},
                {id:'resched',   l:tr('ផ្លាស់​','Rescheduled'),       n: bookings.filter(b=>b.status==='Rescheduled').length},
                {id:'completed', l:tr('រួច​រាល់','Completed'),        n: bookings.filter(b=>b.status==='Completed').length},
                {id:'cancelled', l:tr('លុបចោល','Cancelled'),         n: bookings.filter(b=>b.status==='Cancelled').length},
              ].map(d => (
                <button key={d.id} onClick={() => setFilter(d.id)} style={{
                  padding:'4px 10px',
                  background: filter===d.id ? 'var(--ink)'    : 'var(--surface)',
                  color:       filter===d.id ? 'var(--bg)'    : 'var(--ink-2)',
                  border:'1px solid '+(filter===d.id ? 'var(--ink)' : 'var(--border)'),
                  borderRadius:999, fontSize:11, fontWeight:500, cursor:'default',
                  display:'inline-flex', alignItems:'center', gap:6,
                }}>
                  {d.l} <span style={{opacity:.6,fontFamily:'"JetBrains Mono",monospace'}}>{d.n}</span>
                </button>
              ))}
            </div>
            {view==='list' ? (
              <BkList bookings={filtered} onSelect={setSelected} selected={selected}/>
            ) : (
              <BkTimeline bookings={filtered}/>
            )}
          </div>
        )}

        {tab==='requests'      && <BkPending bookings={bookings} onApprove={approve} onDecline={decline}/>}
        {tab==='availability'  && <BkAvailability/>}
        {tab==='waitlist'      && <BkWaitlist openForm={openForm}/>}
        {tab==='cancellations' && <BkCancellations/>}
      </Card>

      {tab==='queue' && selected && (
        <BkDetail b={selected} onApprove={approve} onDecline={decline} onCancel={cancel}
          onReschedule={() => openForm('newLesson', {studentId: selected.student})}
          onCall={s => toast(`📞 ${s?.phone || '+855 12 345 678'}`, 'info')}/>
      )}
      {bp.mobile && <MobileFab onClick={() => openForm('newLesson')} label={tr('ការ​កក់​ដោយ​ដៃ','Manual book')}/>}
    </div>
  );
};

// ── List view ────────────────────────────────────────────────────────────────
const BkList = ({ bookings, onSelect, selected }) => {
  const { tr } = useAppActions();
  const bp = useBreakpoint();

  const empty = bookings.length === 0 && (
    <div style={{padding:48,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      <div style={{fontSize:28,marginBottom:10}}>📅</div>
      <div>មិន​ទាន់​មាន​ការ​កក់ · No bookings yet</div>
      <div style={{fontSize:11,marginTop:6}}>Use "Manual book" to add the first booking</div>
    </div>
  );

  // ── Mobile: stacked cards instead of a wide 8-column table ────────────────
  if (bp.mobile) {
    return (
      <div style={{display:'flex',flexDirection:'column',gap:8,padding:'12px 12px'}}>
        {empty}
        {bookings.map(b => {
          const s   = studentById(b.student);
          const ins = instById(b.inst);
          const v   = vehById(b.veh);
          return (
            <button key={b.id} onClick={() => onSelect(b)} style={{
              width:'100%',textAlign:'left',border:'1px solid var(--border)',borderRadius:10,
              background: selected?.id===b.id ? 'var(--surface-muted)' : 'var(--surface)',
              padding:'11px 12px',cursor:'pointer',display:'flex',flexDirection:'column',gap:8,
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Avatar tag={s?.photo} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s?.en || s?.name || '—'}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.id} · {clsKm(s?.cls)}</div>
                </div>
                <Badge tone={bookingStatusTone(b.status)}>{b.status}</Badge>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'4px 12px',fontSize:11,color:'var(--ink-2)'}}>
                <span style={{fontWeight:600,color:'var(--ink)',fontVariantNumeric:'tabular-nums'}}>{b.date} · {b.time} · {b.len}h</span>
                {b.type && <span>{b.type}</span>}
                {ins?.en && <span>👤 {ins.en}</span>}
                {v?.plate && <span style={{fontFamily:'"JetBrains Mono",monospace'}}>{v.plate}</span>}
                <span style={{color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',letterSpacing:'.04em'}}>{sourceLabel(b.source)}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
  <div>
    <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'130px 1.4fr 1.2fr 1fr 0.9fr 1fr 0.8fr 24px',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
      <div>Date · Time</div><div>Student</div><div>Type</div>
      <div>Instructor</div><div>Vehicle</div><div>Status</div><div>Source</div><div></div>
    </div>
    {empty}
    {bookings.map((b,i) => {
      const s   = studentById(b.student);
      const ins = instById(b.inst);
      const v   = vehById(b.veh);
      return (
        <div key={b.id} onClick={() => onSelect(b)} style={{
          padding:'12px 16px',display:'grid',gridTemplateColumns:'130px 1.4fr 1.2fr 1fr 0.9fr 1fr 0.8fr 24px',gap:14,
          alignItems:'center',
          borderBottom: i<bookings.length-1 ? '1px solid var(--border)' : 'none',
          background: selected?.id===b.id ? 'var(--surface-muted)' : 'transparent',
          cursor:'default',
        }}>
          <div>
            <div style={{fontSize:12,fontWeight:600}}>{b.date}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',fontVariantNumeric:'tabular-nums'}}>{b.time} · {b.len}h</div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center',minWidth:0}}>
            <Avatar tag={s?.photo} size={28}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s?.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.id} · {clsKm(s?.cls)}</div>
            </div>
          </div>
          <div style={{fontSize:12,color:'var(--ink-2)'}}>{b.type}</div>
          <div style={{fontSize:12,color:'var(--ink-2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ins?.en}</div>
          <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-2)'}}>{v?.plate || '—'}</div>
          <Badge tone={bookingStatusTone(b.status)}>{b.status}</Badge>
          <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em',textTransform:'uppercase'}}>{sourceLabel(b.source)}</div>
          <Icon name="chev" size={14} stroke={1.5}/>
        </div>
      );
    })}
  </div>
  );
};

// ── Timeline view ────────────────────────────────────────────────────────────
const BkTimeline = ({ bookings }) => {
  const groups = {};
  bookings.forEach(b => { (groups[b.date] = groups[b.date] || []).push(b); });
  return (
    <div style={{padding:18,display:'flex',flexDirection:'column',gap:12}}>
      {Object.keys(groups).map(d => (
        <div key={d}>
          <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:600,fontFamily:'var(--font-display)'}}>{d}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{groups[d].length} ការ​កក់</div>
            <div style={{flex:1,height:1,background:'var(--border)'}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[...groups[d]].sort((a,b) => a.time.localeCompare(b.time)).map(b => {
              const s   = studentById(b.student);
              const ins = instById(b.inst);
              const tone   = bookingStatusTone(b.status);
              const accent = {good:'var(--good)',warn:'var(--warn)',danger:'var(--danger)',accent:'var(--accent)',neutral:'var(--ink-3)'}[tone];
              return (
                <div key={b.id} style={{display:'grid',gridTemplateColumns:'70px 4px 1fr auto',gap:14,alignItems:'center',padding:'10px 12px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,fontVariantNumeric:'tabular-nums',fontFamily:'var(--font-display)'}}>{b.time}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)'}}>{b.len}h</div>
                  </div>
                  <div style={{width:4,height:32,borderRadius:2,background:accent}}/>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <Avatar tag={s?.photo} size={28}/>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{s?.name} <span style={{color:'var(--ink-3)',fontWeight:400}}>· {b.type}</span></div>
                      <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{ins?.en} · {b.id}</div>
                    </div>
                  </div>
                  <Badge tone={tone}>{b.status}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Booking detail panel ─────────────────────────────────────────────────────
const BkDetail = ({ b, onApprove, onDecline, onCancel, onReschedule, onCall }) => {
  const bp = useBreakpoint();
  if (!b) return null;
  const s   = studentById(b.student);
  const ins = instById(b.inst);
  const v   = vehById(b.veh);
  const isPending = b.status === 'Pending';
  const isActive  = ['Confirmed','Rescheduled'].includes(b.status);
  return (
    <Card pad={0}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:bp.mobile?8:14,flexWrap:'wrap'}}>
        <div style={{padding:'8px 14px',background:'var(--ink)',color:'var(--bg)',borderRadius:8,fontFamily:'"JetBrains Mono",monospace',fontSize:13,fontWeight:600}}>{b.id}</div>
        <Badge tone={bookingStatusTone(b.status)}>{b.status}</Badge>
        <div style={{fontSize:11,color:'var(--ink-3)'}}>បាន​បង្កើត · created {b.created} · via {sourceLabel(b.source)}</div>
        <div style={{flex:1}}/>
        {isPending && <>
          <Btn kind="ghost"   size="sm" onClick={() => onDecline(b.id)}>បដិសេធ · Decline</Btn>
          <Btn kind="ghost"   size="sm" icon={<Icon name="cal" size={13}/>} onClick={onReschedule}>ស្នើ​ម៉ោង​ផ្សេង</Btn>
          <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={() => onApprove(b.id)}>អនុម័ត · Approve</Btn>
        </>}
        {isActive && <>
          <Btn kind="ghost" size="sm" icon={<Icon name="phone" size={13}/>} onClick={() => onCall && onCall(s)}>ហៅ​សិស្ស</Btn>
          <Btn kind="ghost" size="sm" onClick={onReschedule}>ផ្លាស់​ប្ដូរ · Reschedule</Btn>
          <Btn kind="ghost" size="sm" onClick={() => onCancel(b.id)}>លុបចោល · Cancel</Btn>
        </>}
      </div>

      <div style={{padding:18,display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1.3fr 1fr 1fr 1fr',gap:16}}>
        {/* Booking info */}
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>ការ​កក់ · BOOKING</div>
          <div style={{display:'flex',alignItems:'baseline',gap:10}}>
            <div style={{fontSize:32,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{b.time}</div>
            <div style={{fontSize:14,color:'var(--ink-2)',fontWeight:500}}>{b.date}</div>
          </div>
          <div style={{fontSize:13,color:'var(--ink-2)',marginTop:6}}>{b.type} · <b>{b.len}h</b></div>
          <div style={{marginTop:12,padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8,fontSize:12,color:'var(--ink-2)',display:'flex',alignItems:'center',gap:8}}>
            <Icon name="map" size={14}/>
            <span>Phnom Penh campus · St. Sothearos #123</span>
          </div>
        </div>
        {/* Student */}
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>សិស្ស · STUDENT</div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <Avatar tag={s?.photo} size={40}/>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{s?.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.id} · {s?.cls}</div>
            </div>
          </div>
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6,fontSize:11,color:'var(--ink-2)'}}>
            <div>📞 {s?.phone}</div>
            <div>📈 {s?.hours}/{s?.target} ម៉ោង​​បាន​អនុវត្ត</div>
            <div>💳 បាន​បង់ {Math.round((s?.paid||0)*100)}%</div>
          </div>
        </div>
        {/* Instructor */}
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>គ្រូ · INSTRUCTOR</div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <Avatar tag={ins?.photo} size={40}/>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{ins?.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{ins?.role}</div>
            </div>
          </div>
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6,fontSize:11,color:'var(--ink-2)'}}>
            <div>⭐ {ins?.rating} · {ins?.students} សិស្ស</div>
            <div>🌐 {ins?.lang}</div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,borderRadius:999,background:'var(--good)'}}/>
              ទំនេរ​នៅ​ម៉ោង​នេះ
            </div>
          </div>
        </div>
        {/* Vehicle */}
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>យានយន្ត · VEHICLE</div>
          {v ? (
            <>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <Photo tag={v.photo} w={48} h={32} r={4}/>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{v.make}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{v.plate}</div>
                </div>
              </div>
              <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6,fontSize:11,color:'var(--ink-2)'}}>
                <div>⛽ ប្រេង 78%</div>
                <div>🛠 ​ថែទាំ​ដល់​ឆាប់ៗ 1,200 km</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:6,height:6,borderRadius:999,background:'var(--good)'}}/>
                  ទំនេរ · Available
                </div>
              </div>
            </>
          ) : (
            <div style={{fontSize:12,color:'var(--ink-3)'}}>មិន​ត្រូវ​ការ​យានយន្ត · No vehicle needed</div>
          )}
        </div>
      </div>

      {/* Booking timeline */}
      <div style={{padding:'14px 18px',borderTop:'1px solid var(--border)',background:'var(--surface-muted)'}}>
        <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>ដំណើរការ · BOOKING TIMELINE</div>
        <div style={{display:'flex',gap:0,alignItems:'flex-start'}}>
          {[
            {l:'ស្នើ​សុំ',        sub:'Created via app',         d:b.created,                                              done:true},
            {l:'ការ​បញ្ជាក់',    sub:b.status==='Pending'?'Pending review':'Auto-confirmed', d:b.status==='Pending'?'—':b.created, done:b.status!=='Pending'},
            {l:'​រំលឹក​មុន 24h', sub:'SMS + app push',            d:b.status==='Confirmed'?'នឹង​ផ្ញើ':'—',               done:false},
            {l:'ការ​មេរៀន',      sub:'Lesson check-in',          d:'—',                                                    done:b.status==='Completed'},
            {l:'បញ្ចប់',         sub:'Hours logged',             d:b.status==='Completed'?b.created:'—',                   done:b.status==='Completed'},
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{
                  width:24,height:24,borderRadius:999,
                  background: step.done ? 'var(--good)' : 'var(--surface)',
                  border:'2px solid '+(step.done?'var(--good)':'var(--border-strong)'),
                  color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                  margin:'0 auto 6px',
                }}>{step.done && <Icon name="check" size={11} stroke={3}/>}</div>
                <div style={{fontSize:11,fontWeight:600,color:step.done?'var(--ink)':'var(--ink-3)'}}>{step.l}</div>
                <div style={{fontSize:10,color:'var(--ink-3)',marginTop:1}}>{step.sub}</div>
                <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:2}}>{step.d}</div>
              </div>
              {i < arr.length-1 && <div style={{height:2,flex:'0 0 auto',width:24,background:step.done?'var(--good)':'var(--border)',marginTop:11}}/>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ── Pending requests ─────────────────────────────────────────────────────────
const BkPending = ({ bookings, onApprove, onDecline }) => {
  const bp = useBreakpoint();
  const pending = bookings.filter(b => b.status === 'Pending');
  return (
    <div style={{padding:bp.mobile?12:18,display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1fr 1fr',gap:14}}>
      {pending.map(b => {
        const s   = studentById(b.student);
        const ins = instById(b.inst);
        return (
          <div key={b.id} style={{padding:18,border:'2px solid var(--warn)',borderRadius:12,background:'var(--surface)',position:'relative'}}>
            <div style={{position:'absolute',top:0,right:0,padding:'2px 10px',background:'var(--warn)',color:'#fff',fontSize:10,fontWeight:700,letterSpacing:'.08em',borderRadius:'0 12px 0 12px',fontFamily:'"JetBrains Mono",monospace'}}>PENDING</div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <Avatar tag={s?.photo} size={48}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600}}>{s?.name}</div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.id} · {s?.cls} · ​បាន​​ស្នើ {b.created}</div>
              </div>
            </div>
            <div style={{padding:14,background:'var(--surface-muted)',borderRadius:10,marginBottom:14}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                <div style={{fontSize:26,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{b.time}</div>
                <div style={{fontSize:13,color:'var(--ink-2)',fontWeight:500}}>{b.date}</div>
                <div style={{flex:1}}/>
                <div style={{fontSize:12,color:'var(--ink-3)'}}>{b.len}h</div>
              </div>
              <div style={{fontSize:12,color:'var(--ink-2)',marginTop:6}}>{b.type} · {ins?.en}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11,padding:'8px 0 14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--good)'}}><Icon name="check" size={13} stroke={2.5}/> គ្រូ​ទំនេរ · Instructor available</div>
              <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--good)'}}><Icon name="check" size={13} stroke={2.5}/> យានយន្ត​ទំនេរ · Vehicle available</div>
              <div style={{display:'flex',alignItems:'center',gap:8,color:s&&s.paid>=0.5?'var(--good)':'var(--warn)'}}>
                <Icon name={s&&s.paid>=0.5?"check":"bell"} size={13} stroke={2.5}/>
                {s&&s.paid>=0.5 ? 'ការ​ទូទាត់​ឲ្យ​ត្រូវ' : 'ការ​ទូទាត់​នៅ​ខ្វះ'}
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn kind="ghost"   size="md" style={{flex:1,justifyContent:'center'}} onClick={() => onDecline(b.id)}>បដិសេធ</Btn>
              <Btn kind="ghost"   size="md" style={{flex:1,justifyContent:'center'}}>ស្នើ​ម៉ោង​ផ្សេង</Btn>
              <Btn kind="primary" size="md" style={{flex:1,justifyContent:'center'}} icon={<Icon name="check" size={14}/>} onClick={() => onApprove(b.id)}>អនុម័ត</Btn>
            </div>
          </div>
        );
      })}
      {pending.length===0 && (
        <div style={{padding:60,textAlign:'center',color:'var(--ink-3)',fontSize:13,gridColumn:'1 / -1'}}>
          គ្មាន​សំណើ​​ ✓ · No pending requests
        </div>
      )}
    </div>
  );
};

// ── Availability grid ─────────────────────────────────────────────────────────
const BkAvailability = () => {
  const { openForm, tr } = useAppActions();
  const [selDate, setSelDate] = React.useState(todayStr());
  const [ver, setVer] = React.useState(0);

  React.useEffect(() => {
    const prev = window.__notifyLessonsChanged;
    window.__notifyLessonsChanged = () => setVer(v => v+1);
    return () => { window.__notifyLessonsChanged = prev || null; };
  }, []);

  const slots = [7,8,9,10,11,12,13,14,15,16,17];

  const navDate = (delta) => {
    const d = new Date(selDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelDate(localDateStr(d));
  };

  const dayLessons = LESSONS.filter(l => l.date === selDate && l.status !== 'cancelled');

  const getSlot = (instId, h) => {
    const lesson = dayLessons.find(l =>
      (l.instId === instId || (l.guests||[]).includes(instId)) &&
      l.h <= h && h < l.h + (l.len || 1)
    );
    return lesson ? { state:'booked', lesson } : { state:'free' };
  };

  const d = new Date(selDate + 'T00:00:00');
  const DNAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MNAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateLabel = `${DNAMES[d.getDay()]} · ${MNAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const isToday   = selDate === todayStr();

  return (
    <div style={{padding:18}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{fontSize:14,fontWeight:600,flex:1}}>
          ម៉ោង​ទំនេរ · Availability
          <span style={{fontSize:12,color:'var(--ink-3)',fontWeight:400,marginLeft:10,fontFamily:'"JetBrains Mono",monospace'}}>
            {dateLabel}{isToday ? '  ·  TODAY' : ''}
          </span>
        </div>
        <Btn kind="ghost" size="sm" onClick={()=>navDate(-1)}>← មុន</Btn>
        <Btn kind="ghost" size="sm" onClick={()=>setSelDate(todayStr())} style={isToday?{fontWeight:700}:{}}>ថ្ងៃ​នេះ</Btn>
        <Btn kind="ghost" size="sm" onClick={()=>navDate(1)}>បន្ទាប់ →</Btn>
        <Btn kind="primary" size="sm" onClick={()=>openForm('newLesson',{date:selDate})} icon={<Icon name="plus" size={13}/>}>
          {tr('កក់​ថ្មី','New booking')}
        </Btn>
      </div>

      <div style={{overflowX:'auto'}}>
        <div style={{minWidth:700,border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {/* Header */}
          <div style={{display:'grid',gridTemplateColumns:`170px repeat(${slots.length},1fr)`,
            background:'var(--surface-muted)',padding:'10px 12px',gap:3,
            fontSize:10,letterSpacing:'.06em',color:'var(--ink-3)',
            fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase'}}>
            <div>INSTRUCTOR</div>
            {slots.map(h => <div key={h} style={{textAlign:'center'}}>{String(h).padStart(2,'0')}:00</div>)}
          </div>

          {INSTRUCTORS.length === 0 ? (
            <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
              {tr('គ្មាន​គ្រូ — បន្ថែម​ក្នុង Tab Staff','No instructors — add in Staff tab')}
            </div>
          ) : INSTRUCTORS.map(ins => (
            <div key={ins.id} style={{display:'grid',gridTemplateColumns:`170px repeat(${slots.length},1fr)`,
              padding:'8px 12px',gap:3,borderTop:'1px solid var(--border)',alignItems:'center'}}>
              <div style={{display:'flex',gap:8,alignItems:'center',minWidth:0}}>
                <Avatar tag={ins.photo} size={26}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ins.name}</div>
                  <div style={{fontSize:10,color:'var(--ink-3)',whiteSpace:'nowrap'}}>{ins.role?.split('·')[0]||ins.en}</div>
                </div>
              </div>
              {slots.map(h => {
                const { state, lesson } = getSlot(ins.id, h);
                const s = lesson ? studentById(lesson.studentId) : null;
                const shortName = s?.name?.split(' ').slice(-1)[0] || s?.name?.substring(0,5) || 'BK';
                return (
                  <button key={h}
                    disabled={state === 'booked'}
                    onClick={() => state === 'free' && openForm('newLesson', { date:selDate, hour:h, instId:ins.id })}
                    title={state==='booked'
                      ? `${s?.name||lesson?.studentId||'—'} · ${lesson?.type||''} · ${String(h).padStart(2,'0')}:00`
                      : tr('ចុច​ដើម្បី​កក់​ —  '+ins.name+' '+String(h).padStart(2,'0')+':00','Click to book')}
                    style={{
                      height:34, borderRadius:5, border:'none', width:'100%',
                      background: state==='booked' ? 'var(--accent)' : '#E2EFE7',
                      color:      state==='booked' ? '#fff'          : 'var(--good)',
                      cursor:     state==='free'   ? 'pointer'       : 'default',
                      fontSize:10, fontWeight:600,
                      overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                      padding:'0 3px', transition:'filter .1s',
                    }}
                    onMouseEnter={e=>{ if(state==='free') e.currentTarget.style.filter='brightness(.9)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.filter=''; }}
                  >
                    {state==='booked' ? shortName : '+'}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:14,display:'flex',gap:18,fontSize:11,color:'var(--ink-3)',alignItems:'center',flexWrap:'wrap'}}>
        {[
          {c:'#E2EFE7',       l:'ទំ​នេរ · Free — ចុច​ដើម្បី​កក់'},
          {c:'var(--accent)', l:'បាន​កក់'},
        ].map(({c,l})=>(
          <span key={l} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:14,height:14,borderRadius:3,background:c,display:'inline-block',flexShrink:0}}/>
            {l}
          </span>
        ))}
        <span style={{marginLeft:'auto',fontFamily:'"JetBrains Mono",monospace',fontSize:10,letterSpacing:'.04em'}}>
          {dayLessons.length} {tr('មេរៀន','lessons')} · {INSTRUCTORS.length} {tr('គ្រូ','instructors')}
        </span>
      </div>
    </div>
  );
};

// ── Waitlist ─────────────────────────────────────────────────────────────────
const BkWaitlist = ({ openForm }) => {
  const { toast } = useAppActions();
  const bp = useBreakpoint();
  const waitlist = window.__waitlistData || [];
  return (
    <div style={{padding:bp.mobile?12:18}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>បញ្ជី​រង់ចាំ​ · Waitlist · សិស្ស​​​ដែល​​ចង់​បាន​​ម៉ោង​មិន​ទាន់​មាន</div>
      <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden',overflowX:'auto'}}>
        {waitlist.length === 0 && (
          <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
            <div style={{fontSize:24,marginBottom:8}}>✓</div>
            គ្មាន​បញ្ជី​រង់ចាំ · No waitlist entries
          </div>
        )}
        {waitlist.map((w, i) => {
          const s = studentById(w.s);
          return (
            <div key={i} style={{padding:'14px 16px',display:'grid',gridTemplateColumns:'30px 1.5fr 1.5fr 1fr 1fr auto',gap:14,alignItems:'center',borderTop:i?'1px solid var(--border)':'none',minWidth:bp.mobile?560:'auto'}}>
              <div style={{fontSize:14,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--ink-3)'}}>{i+1}</div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <Avatar tag={s?.photo} size={32}/>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{s?.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s?.id} · {s?.cls}</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:500}}>{w.want}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>flexibility: {w.flex}</div>
              </div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>រង់ចាំ​​​ {w.since}</div>
              <Badge tone={w.priority==='high'?'warn':'neutral'}>{w.priority==='high'?'អាទិភាព':'ធម្មតា'}</Badge>
              <Btn kind="primary" size="sm"
                onClick={() => { openForm('newLesson', {studentId: w.s}); toast(`ផ្ដល់​ម៉ោង​ទៅ ${s?.name}`, 'good'); }}>
                ផ្តល់​ម៉ោង · Offer slot
              </Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Cancellations ─────────────────────────────────────────────────────────────
const BkCancellations = () => {
  const { tr } = useAppActions();
  const bp = useBreakpoint();
  return (
  <div style={{padding:bp.mobile?12:18,display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1.4fr 1fr',gap:14}}>
    <div>
      <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>ការ​លុបចោល & ផ្លាស់​ប្ដូរ​ថ្មីៗ​ · Recent cancellations & changes</div>
      <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
        {(() => {
          const cancelled = (window.__bookingData||[]).filter(b => ['Cancelled','No-show','Rescheduled'].includes(b.status));
          if (cancelled.length === 0) return (
            <div style={{padding:40,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
              <div style={{fontSize:24,marginBottom:8}}>✓</div>
              គ្មាន​ការ​លុបចោល​ · No cancellations or changes
            </div>
          );
          return cancelled.map((c, i) => {
            const s = studentById(c.student);
            return (
              <div key={i} style={{padding:'14px 16px',borderTop:i?'1px solid var(--border)':'none',display:'grid',gridTemplateColumns:'auto 1fr',gap:14}}>
                <Avatar tag={s?.photo} size={36}/>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <div style={{fontSize:13,fontWeight:500}}>{s?.name || c.student}</div>
                    <Badge tone={['Cancelled','No-show'].includes(c.status)?'danger':'accent'}>{c.status}</Badge>
                    <div style={{fontSize:10,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{c.id}</div>
                  </div>
                  <div style={{marginTop:6,fontSize:12,color:'var(--ink-2)'}}>{c.date} · {c.time} · {c.type}</div>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>

    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <Card label={tr('អត្រា​','CANCEL RATE')+' (30d)'}>
        <Stat label="" value="3.8%" delta="-1.2%" sub="​ល្អ​ជាង​មធ្យម​ឧស្សាហកម្ម"/>
        <div style={{marginTop:14,display:'flex',gap:4,alignItems:'flex-end',height:60}}>
          {[5,7,6,4,5,3,4,6,4,3,4,3].map((v,i) => (
            <div key={i} style={{flex:1,height:`${v*8}%`,background:i===11?'var(--accent)':'var(--surface-muted)',borderRadius:'2px 2px 0 0'}}/>
          ))}
        </div>
      </Card>
      <Card label={tr('មូលហេតុ​​ទូទៅ','TOP REASONS')}>
        <BarRow label="Sick / family"    value={42} max={100} sub="42%"/>
        <BarRow label="Work conflict"    value={28} max={100} sub="28%"/>
        <BarRow label="Weather"          value={14} max={100} sub="14%"/>
        <BarRow label="School-initiated" value={10} max={100} sub="10%"/>
        <BarRow label="Other"            value={6}  max={100} sub="6%"/>
      </Card>
      <Card label={tr('គោលនយោបាយ','POLICY')}>
        <div style={{fontSize:12,color:'var(--ink-2)',lineHeight:1.6}}>
          • ​ការ​លុបចោល​មុន <b>24 ម៉ោង</b> · ឥត​បង់​ប្រាក់<br/>
          • ​ការ​លុបចោល​ &lt; 24 ម៉ោង · បង់ 50% នៃ​តម្លៃ​មេរៀន<br/>
          • No-show · បង់ 100% នៃ​​តម្លៃ​មេរៀន​<br/>
          • School ផ្លាស់​ប្តូរ · ​ផ្តល់​មេរៀន​ជំនួស​ឥត​​គិត​ថ្លៃ
        </div>
      </Card>
    </div>
  </div>
  );
};

// Smart wrapper: admin → BookingsScreen, student → original public BookingScreen
const _PublicBookingScreen = window.BookingScreen;
const BookingScreen = ({ role, studentId }) => {
  if (role === 'admin') return <BookingsScreen/>;
  return _PublicBookingScreen
    ? React.createElement(_PublicBookingScreen, { role, studentId })
    : <BookingsScreen/>;
};

Object.assign(window, { BookingsScreen, BookingScreen });
