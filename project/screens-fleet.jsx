// screens-fleet.jsx — Vehicle management (fully functional, no fake data)

if (!window.__vehicleData)       window.__vehicleData       = [];
if (!window.__serviceLog)        window.__serviceLog        = [];
if (!window.__incidentData)      window.__incidentData      = [];
if (!window.__expenseLog)        window.__expenseLog        = [];
if (!window.__vehicleInspections) window.__vehicleInspections = [];
if (!window.__inspRenames)        window.__inspRenames        = {};   // itemId → {en,km} — shared across all vehicles
if (!window.__expenseLog)   window.__expenseLog   = [];

const monthsUntil = (d) => {
  if (!d) return 99;
  const target = new Date(d);
  if (isNaN(target)) return 99;
  const now = new Date();
  return Math.round((target - now) / (1000*60*60*24*30.4));
};

// Returns color for an expiry date: red if past, orange if ≤1 month, else normal
const expColor = (ym) => {
  const mo = monthsUntil(ym);
  if (!ym) return 'var(--ink-3)';
  if (mo < 0) return 'var(--danger)';
  if (mo <= 1) return 'var(--warn)';
  return 'var(--ink)';
};

const statusToneFleet = (s) => ({
  'Active':'good', 'Service due':'warn', 'Workshop':'danger', 'Idle':'neutral',
}[s] || 'neutral');

// ── Parking location options ──────────────────────────────────────────────────
const PARKING_OPTS = ['school', 'course', 'parking', 'garage'];
const PARKING_CFG = {
  school:  { label:'School',  bg:'var(--good)',    color:'#fff' },
  course:  { label:'Course',  bg:'var(--good)',    color:'#fff' },
  parking: { label:'Parking', bg:'#D4A017',        color:'#fff' },
  garage:  { label:'Garage',  bg:'var(--danger)',  color:'#fff' },
};

const Row = ({ k, v }) => (
  <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
    <span style={{color:'var(--ink-3)'}}>{k}</span>
    <span style={{fontWeight:500,textAlign:'right'}}>{v}</span>
  </div>
);

// ── Main Screen ──────────────────────────────────────────────────────────────
const FleetScreenV2 = () => {
  const { openForm, toast, tr } = useAppActions();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    window.__notifyVehiclesChanged = () => forceUpdate();
    return () => { delete window.__notifyVehiclesChanged; };
  }, []);

  const [tab,        setTab]        = React.useState('directory');
  const [view,       setView]       = React.useState('cards');
  const [cls,        setCls]        = React.useState('all');
  const [station,    setStation]    = React.useState('all');
  const [selectedId, setSelectedId] = React.useState(null);
  const [editing,    setEditing]    = React.useState(false);
  const [addSvc,     setAddSvc]     = React.useState(false);

  const vehicles   = VEHICLES;
  const serviceLog = window.__serviceLog;
  const incidents  = window.__incidentData;
  const expenseLog = window.__expenseLog || [];

  React.useEffect(() => {
    if (!selectedId && vehicles.length) setSelectedId(vehicles[0].id);
  }, [vehicles.length]);

  const selected = vehicles.find(v => v.id === selectedId) || null;

  const filtered = vehicles.filter(v =>
    (cls === 'all' || v.cls.startsWith(cls)) &&
    (station === 'all' || v.station === station)
  );

  const deleteVehicle = (id) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i !== -1) VEHICLES.splice(i, 1);
    setSelectedId(VEHICLES[0]?.id || null);
    setEditing(false);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានលុបយានយន្ត', 'Vehicle removed'), 'neutral');
  };

  const saveEdit = (updated) => {
    const i = VEHICLES.findIndex(v => v.id === updated.id);
    if (i !== -1) VEHICLES[i] = updated;
    setEditing(false);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានរក្សាទុក', 'Saved'), 'good');
  };

  const savePhoto = (id, dataUrl) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i !== -1) { VEHICLES[i].photo = dataUrl; if (window.saveAllData) window.saveAllData(); forceUpdate(); }
  };

  const cycleStatus = (id) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i === -1) return;
    const cur = VEHICLES[i].status || 'Active';
    const next = FLEET_STATUS_OPTS[(FLEET_STATUS_OPTS.indexOf(cur) + 1) % FLEET_STATUS_OPTS.length];
    VEHICLES[i].status = next;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(`${VEHICLES[i].plate || id}: ${cur} → ${next}`, 'neutral');
  };

  const cycleParking = (id) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i === -1) return;
    const cur = VEHICLES[i].parking || 'school';
    const next = PARKING_OPTS[(PARKING_OPTS.indexOf(cur) + 1) % PARKING_OPTS.length];
    VEHICLES[i].parking = next;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };

  const saveDates = (id, dates) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i !== -1) Object.assign(VEHICLES[i], dates);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានរក្សាទុក', 'Saved'), 'good');
  };

  const activeCount    = vehicles.filter(v => v.status === 'Active').length;
  const attentionCount = vehicles.filter(v => v.status !== 'Active').length;
  const svcDueCount    = vehicles.filter(v => (v.service || 0) === 0).length;
  const expCount       = vehicles.filter(v =>
    monthsUntil(v.reg_exp) < 3 || monthsUntil(v.road_tax) < 3 || monthsUntil(v.ins_exp) < 3 || monthsUntil(v.oil_exp) < 3
  ).length;
  const totalKm        = vehicles.reduce((s, v) => s + (v.km || 0), 0);
  const curMo          = new Date().toISOString().slice(0,7);
  const totalCost      = expenseLog.filter(e=>e.date.startsWith(curMo)).reduce((s,e)=>s+(e.amount||0), 0);
  const stations       = [...new Set(vehicles.map(v => v.station).filter(Boolean))];

  const tabs = [
    { id:'directory',  km:'បញ្ជី',          en:'Directory',   icon:'car'    },
    { id:'inspection', km:'ពិនិត្យប្រចាំថ្ងៃ',en:'Inspection', icon:'check'  },
    { id:'service',    km:'ការថែទាំ',       en:'Service',     icon:'wrench' },
    { id:'docs',       km:'ឯកសារ',          en:'Documents',   icon:'book'   },
    { id:'usage',      km:'ការប្រើប្រាស់',  en:'Usage',       icon:'chart'  },
    { id:'incidents',  km:'ឧប្បត្តិហេតុ',   en:'Incidents',   icon:'bell'   },
    { id:'expenses',   km:'ចំណាយ',           en:'Expenses',    icon:'cash'   },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="យានយន្ត · Fleet"
        en={vehicles.length
          ? `${vehicles.length} vehicles · ${activeCount} active · ${attentionCount} need attention`
          : 'No vehicles yet · Add your first vehicle'}
        action={
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md"
              onClick={() => toast(tr('នាំចេញ…', 'Exporting…'), 'neutral')}>
              {tr('នាំចេញ','Export')}
            </Btn>
            <Btn kind="ghost" size="md" icon={<Icon name="wrench" size={14}/>}
              onClick={() => { setTab('service'); setAddSvc(true); }}>
              {tr('បញ្ជាការងារ','Work order')}
            </Btn>
            <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>}
              onClick={() => openForm('newVehicle')}>
              {tr('បន្ថែមរថយន្ត','Add vehicle')}
            </Btn>
          </div>
        }
      />

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
        <Card><Stat label={tr('ចំនួន','Total')} value={vehicles.length} sub={`${activeCount} active`}/></Card>
        <Card><Stat label="km សរុប" value={totalKm.toLocaleString()} sub="odometer total"/></Card>
        <Card><Stat label={tr('ចំណាយ','MTD')} value={`$${totalCost.toFixed(2).replace(/\.00$/,'')}`} sub="ប្រេង + ថែទាំ"/></Card>
        <Card><Stat label={tr('ថែទាំ','Service due')} value={svcDueCount} sub="ត្រូវការ​ថែទាំ"/></Card>
        <Card><Stat label={tr('ឯកសារ','Expiring docs')} value={expCount} sub="ក្នុង 3 ខែ"/></Card>
      </div>

      {/* Inline work order form */}
      {addSvc && (
        <FvWorkOrderForm
          vehicles={vehicles}
          onClose={() => setAddSvc(false)}
          forceUpdate={forceUpdate}
        />
      )}

      <Card pad={0}>
        {/* Tabs header */}
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display:'inline-flex',alignItems:'center',gap:7,
              padding:'7px 12px',border:'none',
              background: tab === t.id ? 'var(--surface-muted)' : 'transparent',
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
              borderRadius:7,fontSize:12,fontWeight: tab === t.id ? 600 : 500,cursor:'pointer',
            }}>
              <Icon name={t.icon} size={13}/>
              {tr(t.km, t.en)}
            </button>
          ))}
          <div style={{flex:1}}/>
          {tab === 'directory' && (
            <div style={{display:'flex',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,padding:2}}>
              {['cards','table'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'4px 10px',border:'none',
                  background: view === v ? 'var(--surface)' : 'transparent',
                  color: view === v ? 'var(--ink)' : 'var(--ink-3)',
                  borderRadius:5,fontSize:11,fontWeight:500,cursor:'pointer',
                  textTransform:'capitalize',
                }}>{v}</button>
              ))}
            </div>
          )}
        </div>

        {/* Directory tab */}
        {tab === 'directory' && (
          vehicles.length === 0
            ? <FvEmpty onAdd={() => openForm('newVehicle')}/>
            : (
              <div>
                {/* Class + station filter bar */}
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  {[
                    { id:'all', l:tr('ទាំងអស់','All'),         n: vehicles.length },
                    { id:'B',   l:tr('ឡានបួនកង់','Class B'),   n: vehicles.filter(v=>v.cls.startsWith('B')).length },
                    { id:'A',   l:tr('ម៉ូតូ','Class A'),         n: vehicles.filter(v=>v.cls.startsWith('A')).length },
                    { id:'C',   l:tr('ឡានធំ','Class C'),        n: vehicles.filter(v=>v.cls.startsWith('C')).length },
                  ].map(d => (
                    <button key={d.id} onClick={() => setCls(d.id)} style={{
                      padding:'4px 10px',
                      background: cls === d.id ? 'var(--ink)' : 'var(--surface)',
                      color: cls === d.id ? 'var(--bg)' : 'var(--ink-2)',
                      border:'1px solid ' + (cls === d.id ? 'var(--ink)' : 'var(--border)'),
                      borderRadius:999,fontSize:11,fontWeight:500,cursor:'pointer',
                      display:'inline-flex',alignItems:'center',gap:6,
                    }}>{d.l} <span style={{opacity:.6,fontFamily:'"JetBrains Mono",monospace'}}>{d.n}</span></button>
                  ))}
                  {stations.length > 0 && (
                    <>
                      <Divider v/>
                      <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em'}}>STATION</span>
                      {['all', ...stations].map(s => (
                        <button key={s} onClick={() => setStation(s)} style={{
                          padding:'4px 10px',
                          background: station === s ? 'var(--ink)' : 'transparent',
                          color: station === s ? 'var(--bg)' : 'var(--ink-2)',
                          border:'1px solid ' + (station === s ? 'var(--ink)' : 'var(--border)'),
                          borderRadius:999,fontSize:11,fontWeight:500,cursor:'pointer',
                        }}>{s === 'all' ? 'All' : s}</button>
                      ))}
                    </>
                  )}
                </div>
                {view === 'cards'
                  ? <FvCards vehicles={filtered} onSelect={setSelectedId} selectedId={selectedId} onStatusChange={cycleStatus} onSaveDates={saveDates} onParkingChange={cycleParking}/>
                  : <FvTable vehicles={filtered} onSelect={setSelectedId} selectedId={selectedId}/>
                }
              </div>
            )
        )}

        {tab === 'inspection'&& <FvInspectionLog vehicles={vehicles} tr={tr}/>}
        {tab === 'service'   && <FvService   vehicles={vehicles} serviceLog={serviceLog} forceUpdate={forceUpdate} addSvc={addSvc} setAddSvc={setAddSvc}/>}
        {tab === 'docs'      && <FvDocs      vehicles={vehicles}/>}
        {tab === 'usage'     && <FvUsage     vehicles={vehicles}/>}
        {tab === 'incidents' && <FvIncidents vehicles={vehicles} incidents={incidents} forceUpdate={forceUpdate}/>}
        {tab === 'expenses'  && <FvExpenses  vehicles={vehicles} expenseLog={expenseLog} forceUpdate={forceUpdate}/>}
      </Card>

      {/* Detail / edit panel below the card */}
      {tab === 'directory' && selected && !editing && (
        <FvDetailRow v={selected} onEdit={() => setEditing(true)} forceUpdate={forceUpdate}/>
      )}
      {tab === 'directory' && selected && editing && (
        <FvEditPanel v={selected} onSave={saveEdit} onCancel={() => setEditing(false)} onDelete={deleteVehicle} onSavePhoto={savePhoto}/>
      )}
    </div>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────────
const FvEmpty = ({ onAdd }) => {
  const { tr } = useAppActions();
  return (
  <div style={{padding:'60px 24px',textAlign:'center',color:'var(--ink-3)'}}>
    <div style={{fontSize:36,marginBottom:12}}>🚗</div>
    <div style={{fontSize:16,fontWeight:600,color:'var(--ink)',marginBottom:6}}>
      {tr('មិនទាន់​មាន​យានយន្ត','No vehicles yet')}
    </div>
    <div style={{fontSize:13,marginBottom:20,color:'var(--ink-2)'}}>
      Add your first vehicle to start tracking
    </div>
    <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>} onClick={onAdd}>
      បន្ថែម​យានយន្ត​ · Add vehicle
    </Btn>
  </div>
  );
};

// ── Daily Vehicle Inspection (日常点検表) ─────────────────────────────────────
const INSP_SECTIONS = [
  {
    id:'engine', km:'ផ្នែករថយន្ត · エンジンルーム', en:'Engine Room',
    items:[
      { id:'engine_oil',    km:'ប្រេងម៉ាស៊ីន · エンジンオイル',        en:'Engine oil level'        },
      { id:'coolant',       km:'ទឹកត្រជាក់ · 冷却水',                 en:'Coolant level'           },
      { id:'brake_fluid',   km:'ប្រេងហ្វ្រែន · ブレーキ液',            en:'Brake fluid level'       },
      { id:'battery',       km:'ថ្ម · バッテリ',                       en:'Battery condition'       },
      { id:'fan_belt',      km:'ខ្សែក · ファンベルト',                  en:'Fan belt tension/damage' },
      { id:'washer',        km:'ទឹកជម្រះកញ្ចក់ · ウォッシャー液',       en:'Washer fluid level'      },
    ],
  },
  {
    id:'lights', km:'ភ្លើង · 灯火装置', en:'Lighting',
    items:[
      { id:'headlight',     km:'ភ្លើងមុខ · ヘッドライト',               en:'Headlights'              },
      { id:'brake_light',   km:'ភ្លើងហ្វ្រែន · ブレーキランプ',          en:'Brake lights'            },
      { id:'turn_signal',   km:'ភ្លើងស្ដាំ-ឆ្វេង · ウィンカー',          en:'Turn signals'            },
      { id:'hazard',        km:'ភ្លើងគ្រោះថ្នាក់ · ハザード',            en:'Hazard lights'           },
      { id:'reverse_light', km:'ភ្លើងថយក្រោយ · バックランプ',            en:'Reverse lights'          },
    ],
  },
  {
    id:'brakes', km:'ហ្វ្រែន · ブレーキ', en:'Brakes',
    items:[
      { id:'brake_pedal',   km:'ក្បាល​ហ្វ្រែន · ブレーキペダル',         en:'Brake pedal play/feel'   },
      { id:'parking_brake', km:'ហ្វ្រែនដៃ · パーキングブレーキ',         en:'Parking brake'           },
    ],
  },
  {
    id:'tires', km:'កង់ · タイヤ', en:'Tires',
    items:[
      { id:'tire_pressure', km:'សម្ពាធកង់ · 空気圧',                   en:'Tire pressure (all 4)'   },
      { id:'tire_wear',     km:'ស្នាម​កង់ · 溝の深さ',                  en:'Tread depth'             },
      { id:'tire_damage',   km:'ខូចខាតកង់ · 亀裂・損傷',               en:'Cracks / damage'         },
      { id:'wheel_nuts',    km:'គ្រាប់ចំណ្ចុះ · ホイールナット',          en:'Wheel nut tightness'     },
    ],
  },
  {
    id:'other', km:'ផ្សេងៗ · その他', en:'Others',
    items:[
      { id:'wipers',        km:'វីស · ワイパー',                        en:'Wiper operation'         },
      { id:'horn',          km:'កណ្ដឹង · ホーン',                       en:'Horn'                    },
      { id:'mirrors',       km:'កញ្ចក់ · ミラー',                       en:'Mirrors (all)'           },
      { id:'body',          km:'ខ្លួនរថយន្ត · 車体',                   en:'Body / exterior damage'  },
      { id:'seat_belt',     km:'ខ្សែ​ក​សុវត្ថិភាព · シートベルト',        en:'Seat belts'              },
    ],
  },
];

const INSP_VALS = {
  ok:   { label:'○', km:'ធម្មតា',       en:'Good',    color:'var(--good)',   bg:'rgba(59,122,87,.12)'  },
  warn: { label:'△', km:'ប្រុងប្រយ័ត្ន', en:'Caution', color:'var(--warn)',  bg:'rgba(198,106,46,.12)' },
  fail: { label:'×', km:'ខ្វះខាត',       en:'Problem', color:'var(--danger)', bg:'rgba(176,65,62,.12)'  },
};

const FUEL_STEPS = [
  { v:0,   label:'E',  color:'var(--danger)' },
  { v:25,  label:'¼',  color:'var(--warn)'   },
  { v:50,  label:'½',  color:'#C5A200'       },
  { v:75,  label:'¾',  color:'var(--good)'   },
  { v:100, label:'F',  color:'#1E7A38'       },
];

const fuelColor = (pct) =>
  pct <= 20 ? 'var(--danger)' : pct <= 40 ? 'var(--warn)' : pct <= 65 ? '#C5A200' : 'var(--good)';

const FuelGauge = ({ level, onChange }) => {
  const c = fuelColor(level);
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
      <div style={{flex:1,height:12,borderRadius:6,background:'var(--surface-muted)',border:'1px solid var(--border)',position:'relative',overflow:'hidden',minWidth:80}}>
        <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${level}%`,background:c,borderRadius:6,transition:'width .25s'}}/>
        {[25,50,75].map(p=>(
          <div key={p} style={{position:'absolute',left:`${p}%`,top:'15%',bottom:'15%',width:1,background:'rgba(0,0,0,.15)'}}/>
        ))}
      </div>
      <div style={{display:'flex',gap:3,flexShrink:0}}>
        {FUEL_STEPS.map(s=>(
          <button key={s.v} onClick={()=>onChange(s.v)} style={{
            padding:'3px 7px',borderRadius:5,border:`1.5px solid ${level===s.v?s.color:'var(--border)'}`,
            background:level===s.v?s.color:'var(--surface)',color:level===s.v?'#fff':'var(--ink-3)',
            fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'"JetBrains Mono",monospace',
            transition:'all .12s',lineHeight:1,
          }}>{s.label}</button>
        ))}
      </div>
      <span style={{fontSize:12,fontWeight:700,color:c,minWidth:34,fontFamily:'"JetBrains Mono",monospace'}}>{level}%</span>
    </div>
  );
};

const initInspItems = (customItems = {}) => {
  const out = {};
  INSP_SECTIONS.forEach(sec => {
    sec.items.forEach(it => { out[it.id] = 'ok'; });
    (customItems[sec.id]||[]).forEach(it => { out[it.id] = 'ok'; });
  });
  return out;
};

const EXPENSE_TYPES = [
  { id:'fuel',    icon:'⛽', en:'Fuel refill',  km:'បំពេញសាំ'    },
  { id:'parking', icon:'🅿️', en:'Parking',      km:'ចំណតរថយន្ត' },
  { id:'toll',    icon:'🛣️', en:'Toll',         km:'ថ្លៃផ្លូវ'   },
  { id:'wash',    icon:'🚿', en:'Car wash',      km:'លាងរថយន្ត'  },
  { id:'repair',  icon:'🔧', en:'Repair',        km:'ជួសជុល'     },
  { id:'oil',     icon:'🛢️', en:'Oil change',    km:'ប្ដូរប្រេង'  },
  { id:'other',   icon:'📝', en:'Other',         km:'ផ្សេងៗ'      },
];

const VehicleInspectionModal = ({ vehicle, onClose, tr }) => {
  const { toast } = useAppActions();
  const [date,        setDate]        = React.useState(todayStr());
  const [inspector,   setInspector]   = React.useState(LOGIN_USERS?.admin?.km || LOGIN_USERS?.admin?.en || '');
  const [items,       setItems]       = React.useState(() => initInspItems());
  const [notes,       setNotes]       = React.useState('');
  const [fuelLevel,   setFuelLevel]   = React.useState(100);
  const [customItems, setCustomItems] = React.useState({});   // secId → [{id,en,km}]
  const [renames,     setRenames]     = React.useState({});   // itemId → {en,km}
  const [editingId,   setEditingId]   = React.useState(null); // itemId currently being renamed
  const [editVal,     setEditVal]     = React.useState({en:'',km:''});
  const [vPhoto,      setVPhoto]      = React.useState(vehicle.photo);
  const [expenses,    setExpenses]    = React.useState([]);
  const [showInsp,    setShowInsp]    = React.useState(true);
  const [showExp,     setShowExp]     = React.useState(false);
  const photoRef = React.useRef();

  // Load existing record for this vehicle+date
  React.useEffect(() => {
    const rec = (window.__vehicleInspections||[]).find(r => r.vehicleId === vehicle.id && r.date === date);
    if (rec) {
      const ci = rec.customItems || {};
      setItems({...initInspItems(ci), ...rec.items});
      setNotes(rec.notes || '');
      setInspector(rec.inspector || inspector);
      setFuelLevel(rec.fuelLevel ?? 100);
      setCustomItems(ci);
      // Global renames are the base; this record's own renames override
      setRenames({ ...(window.__inspRenames||{}), ...(rec.renames||{}) });
      setExpenses(rec.expenses || []);
    } else {
      setItems(initInspItems(customItems));
      setNotes('');
      setFuelLevel(100);
      setExpenses([]);
      // Start from the shared/global renames so past edits carry over
      setRenames({ ...(window.__inspRenames||{}) });
    }
    setEditingId(null);
  }, [date, vehicle.id]);

  // Photo upload
  const handlePhotoFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setVPhoto(url);
      const i = VEHICLES.findIndex(v => v.id === vehicle.id);
      if (i !== -1) { VEHICLES[i].photo = url; vehicle.photo = url; if(window.saveAllData) window.saveAllData(); }
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const overallStatus = () => {
    const vals = Object.values(items);
    if (vals.includes('fail')) return 'fail';
    if (vals.includes('warn')) return 'warn';
    return 'ok';
  };

  const handleSave = () => {
    const os = overallStatus();
    const rec = { vehicleId:vehicle.id, date, inspector, items:{...items}, notes, fuelLevel, customItems, renames, expenses, overallStatus:os, savedAt:new Date().toISOString() };
    const arr = window.__vehicleInspections || [];
    const idx = arr.findIndex(r => r.vehicleId === vehicle.id && r.date === date);
    if (idx !== -1) arr[idx] = rec; else arr.push(rec);
    window.__vehicleInspections = arr;

    // Sync expenses to __expenseLog (remove old, add new)
    if (!window.__expenseLog) window.__expenseLog = [];
    const inspKey = `insp_${vehicle.id}_${date}`;
    window.__expenseLog = window.__expenseLog.filter(e => e.inspKey !== inspKey);
    const validExp = expenses.filter(e => parseFloat(e.amount) > 0);
    if (validExp.length > 0) {
      const nums = window.__expenseLog.map(e => parseInt((e.id||'').replace(/\D/g,''))).filter(n=>!isNaN(n)&&n>0);
      let nextNum = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
      const vName = `${vehicle.make} · ${vehicle.plate}`;
      validExp.forEach(e => {
        const id = 'EX-' + String(nextNum++).padStart(3,'0');
        const desc = e.note ? `${vName} — ${e.note}` : vName;
        window.__expenseLog.unshift({ id, vId:vehicle.id, date, cat:e.type, amount:parseFloat(e.amount), notes:e.note||'', desc, inspKey });
      });
      const vv = VEHICLES.find(x => x.id === vehicle.id);
      if (vv) {
        const mo = date.slice(0,7);
        const vExp = window.__expenseLog.filter(e => e.vId === vehicle.id && e.date.startsWith(mo));
        vv.cost_mo = Math.round(vExp.reduce((s,e) => s+(e.amount||0), 0)*100)/100;
        vv.fuel_mo = Math.round(vExp.filter(e=>e.cat==='fuel').reduce((s,e)=>s+(e.amount||0), 0)*100)/100;
      }
      if (window.__notifyFinanceChanged) window.__notifyFinanceChanged();
    }

    if (window.saveAllData) window.saveAllData();
    toast(tr('បានរក្សាទុកកំណត់ត្រាពិនិត្យ ✓','Inspection saved ✓'), 'good');
    onClose();
  };

  const setItem = (id, val) => setItems(prev => ({...prev, [id]: val}));

  const startRename = (it) => {
    const cur = renames[it.id] || {};
    setEditVal({ en: cur.en || it.en, km: cur.km || it.km.split(' · ')[0] });
    setEditingId(it.id);
  };
  const commitRename = (id) => {
    const en = editVal.en.trim(), km = editVal.km.trim();
    if (en || km) {
      const val = { en, km };
      setRenames(prev => ({...prev, [id]: val}));
      // Remember globally so the rename applies to every vehicle's inspection
      if (!window.__inspRenames) window.__inspRenames = {};
      window.__inspRenames[id] = val;
      if (window.saveAllData) window.saveAllData();
    }
    setEditingId(null);
  };

  const addCustomItem = (secId) => {
    const newId = `custom_${secId}_${Date.now()}`;
    const newIt = { id:newId, en:'New item', km:'ចំណុចថ្មី', isCustom:true };
    setCustomItems(prev => ({...prev, [secId]: [...(prev[secId]||[]), newIt]}));
    setItems(prev => ({...prev, [newId]: 'ok'}));
    setEditVal({ en:'New item', km:'ចំណុចថ្មី' });
    setEditingId(newId);
  };
  const removeCustomItem = (secId, itemId) => {
    setCustomItems(prev => ({...prev, [secId]: (prev[secId]||[]).filter(i=>i.id!==itemId)}));
    setItems(prev => { const n={...prev}; delete n[itemId]; return n; });
    if (editingId === itemId) setEditingId(null);
  };

  const addExpense = (type) => {
    const t = EXPENSE_TYPES.find(x=>x.id===type) || EXPENSE_TYPES[EXPENSE_TYPES.length-1];
    setExpenses(prev => [...prev, { id:`exp_${Date.now()}`, type:t.id, icon:t.icon, en:t.en, km:t.km, amount:'', note:'' }]);
  };
  const updExp = (id, field, val) => setExpenses(prev => prev.map(e => e.id===id ? {...e, [field]:val} : e));
  const delExp = (id) => setExpenses(prev => prev.filter(e => e.id !== id));
  const expTotal = expenses.reduce((s,e) => s + (parseFloat(e.amount)||0), 0);

  const toggleInsp = () => setShowInsp(v => { if (!v) setShowExp(false); return !v; });
  const toggleExp  = () => setShowExp(v  => { if (!v) setShowInsp(false); return !v; });

  const os = overallStatus();
  const osC = INSP_VALS[os];

  const renderItem = (it, secId, isCustom) => {
    const cur = items[it.id] || 'ok';
    const name  = renames[it.id] || {};
    const dispEn = name.en || it.en;
    const dispKm = name.km || it.km.split(' · ')[0];
    const isEditing = editingId === it.id;
    return (
      <div key={it.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:7,background:INSP_VALS[cur].bg,transition:'background .15s'}}>
        <div style={{flex:1,minWidth:0}}>
          {isEditing ? (
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}
              onBlur={(e)=>{ if(!e.currentTarget.contains(e.relatedTarget)) commitRename(it.id); }}>
              <input autoFocus value={editVal.en} onChange={e=>setEditVal(p=>({...p,en:e.target.value}))}
                onKeyDown={e=>{ if(e.key==='Enter') commitRename(it.id); if(e.key==='Escape') setEditingId(null); }}
                placeholder="English" style={{flex:1,minWidth:100,border:'1px solid var(--accent)',borderRadius:5,padding:'3px 7px',fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)'}}/>
              <input value={editVal.km} onChange={e=>setEditVal(p=>({...p,km:e.target.value}))}
                onKeyDown={e=>{ if(e.key==='Enter') commitRename(it.id); if(e.key==='Escape') setEditingId(null); }}
                placeholder="ខ្មែរ" style={{flex:1,minWidth:80,border:'1px solid var(--accent)',borderRadius:5,padding:'3px 7px',fontSize:12,fontFamily:'var(--font-km)',background:'var(--surface)',color:'var(--ink)'}}/>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:6,cursor:'text'}} onClick={()=>startRename(it)}>
              <span style={{fontSize:13,color:'var(--ink)',fontWeight:500}}>{dispEn}</span>
              <span style={{fontSize:11,color:'var(--ink-3)',fontFamily:'var(--font-km)'}}>{dispKm}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" style={{opacity:.4,flexShrink:0}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:3,flexShrink:0}}>
          {Object.entries(INSP_VALS).map(([k,v]) => (
            <button key={k} onClick={()=>setItem(it.id, k)} style={{
              width:34,height:27,borderRadius:6,border:`1.5px solid ${cur===k?v.color:'var(--border)'}`,
              background:cur===k?v.color:'var(--surface)',color:cur===k?'#fff':'var(--ink-3)',
              fontFamily:'"JetBrains Mono",monospace',fontWeight:700,fontSize:14,
              cursor:'pointer',transition:'all .12s',lineHeight:1,
            }}>{v.label}</button>
          ))}
        </div>
        {isCustom && (
          <button onClick={()=>removeCustomItem(secId, it.id)} style={{border:'none',background:'transparent',cursor:'pointer',color:'var(--danger)',opacity:.5,padding:'2px',display:'flex',alignItems:'center',flexShrink:0}}
            title="Remove"
            onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.5'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9997,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'3vh',overflowY:'auto'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:700,margin:'0 16px 40px',background:'var(--surface)',borderRadius:16,border:'1px solid var(--border)',boxShadow:'0 32px 80px rgba(0,0,0,.25)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:14}}>
          {/* Clickable photo */}
          <div onClick={()=>photoRef.current?.click()} style={{width:56,height:40,borderRadius:8,overflow:'hidden',flexShrink:0,cursor:'pointer',position:'relative',border:'2px solid var(--border)'}}>
            <Photo tag={vPhoto} w={56} h={40} r={0}/>
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity .15s'}}
              onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoFile}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700}}>{vehicle.make} · {vehicle.plate}</div>
            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>
              {tr('ទម្រង់ពិនិត្យប្រចាំថ្ងៃ · 日常点検表','Daily Vehicle Inspection')}
            </div>
          </div>
          <div style={{padding:'5px 12px',borderRadius:8,background:osC.bg,color:osC.color,fontWeight:700,fontSize:18,fontFamily:'"JetBrains Mono",monospace',flexShrink:0}}>
            {osC.label} <span style={{fontSize:11,fontWeight:600}}>{osC.en}</span>
          </div>
          <button onClick={onClose} style={{border:'none',background:'transparent',cursor:'pointer',padding:4,color:'var(--ink-3)',flexShrink:0,display:'flex',alignItems:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Meta row */}
        <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,minWidth:170}}>
            <span style={{fontSize:11,color:'var(--ink-3)',whiteSpace:'nowrap'}}>{tr('ថ្ងៃ','Date')}:</span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:6,padding:'5px 8px',fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',flex:1}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:180}}>
            <span style={{fontSize:11,color:'var(--ink-3)',whiteSpace:'nowrap'}}>{tr('ពិនិត្យដោយ','By')}:</span>
            <input value={inspector} onChange={e=>setInspector(e.target.value)} placeholder="Name" style={{border:'1px solid var(--border)',borderRadius:6,padding:'5px 8px',fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',flex:1}}/>
          </div>
        </div>

        {/* Fuel level row */}
        <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,background:'var(--surface-muted)'}}>
          <span style={{fontSize:11,fontWeight:600,color:'var(--ink-3)',whiteSpace:'nowrap',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>
            ⛽ {tr('កំរិតសាំ','FUEL')}
          </span>
          <FuelGauge level={fuelLevel} onChange={setFuelLevel}/>
        </div>

        {/* Scrollable body */}
        <div style={{maxHeight:'60vh',overflowY:'auto'}}>

          {/* Inspection toggle header */}
          <button onClick={toggleInsp} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 20px',border:'none',borderBottom:'1px solid var(--border)',background:'var(--surface-muted)',cursor:'pointer',fontFamily:'inherit',transition:'background .12s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--accent-soft)'} onMouseLeave={e=>e.currentTarget.style.background='var(--surface-muted)'}>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-2)',display:'flex',alignItems:'center',gap:6}}>
              🔍 {tr('ការពិនិត្យ','INSPECTION ITEMS')}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" style={{transform:showInsp?'rotate(0deg)':'rotate(-90deg)',transition:'transform .2s',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {showInsp && (
          <div style={{padding:'14px 20px',display:'flex',flexDirection:'column',gap:14}}>
          {INSP_SECTIONS.map(sec => (
            <div key={sec.id}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'var(--ink-3)',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace',marginBottom:7,paddingBottom:4,borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
                <span>{sec.en}</span>
                <span style={{opacity:.5,fontWeight:500,letterSpacing:'.03em',fontFamily:'var(--font-km)'}}>{sec.km.split(' · ')[0]}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {sec.items.map(it => renderItem(it, sec.id, false))}
                {(customItems[sec.id]||[]).map(it => renderItem(it, sec.id, true))}
              </div>
              {/* Add item button */}
              <button onClick={()=>addCustomItem(sec.id)} style={{
                marginTop:6,width:'100%',padding:'5px 0',border:'1px dashed var(--border)',borderRadius:7,
                background:'transparent',color:'var(--ink-3)',cursor:'pointer',fontSize:12,fontFamily:'inherit',
                display:'flex',alignItems:'center',justifyContent:'center',gap:5,transition:'all .12s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--ink-3)';}}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {tr('បន្ថែមការពិនិត្យ','Add item')}
              </button>
            </div>
          ))}
          </div>
          )}

          {/* Expenses toggle header */}
          <button onClick={toggleExp} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 20px',border:'none',borderBottom:'1px solid var(--border)',borderTop:'1px solid var(--border)',background:'var(--surface-muted)',cursor:'pointer',fontFamily:'inherit',transition:'background .12s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--accent-soft)'} onMouseLeave={e=>e.currentTarget.style.background='var(--surface-muted)'}>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-2)',display:'flex',alignItems:'center',gap:6}}>
              💰 {tr('ចំណាយប្រចាំថ្ងៃ','DAILY EXPENSES')}
              {expTotal > 0 && <span style={{fontSize:12,fontWeight:700,color:'var(--warn)',letterSpacing:0}}>· $ {expTotal.toFixed(2)}</span>}
              {expenses.length > 0 && expTotal === 0 && <span style={{fontSize:10,color:'var(--ink-3)',letterSpacing:0,fontWeight:400}}>({expenses.length})</span>}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" style={{transform:showExp?'rotate(0deg)':'rotate(-90deg)',transition:'transform .2s',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {showExp && (
          <div style={{padding:'12px 20px 14px',display:'flex',flexDirection:'column',gap:8}}>
            {/* Quick-add chips */}
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {EXPENSE_TYPES.map(t=>(
                <button key={t.id} onClick={()=>addExpense(t.id)} style={{
                  padding:'4px 10px',borderRadius:20,border:'1px solid var(--border)',
                  background:'var(--surface)',cursor:'pointer',fontSize:11,fontFamily:'inherit',
                  display:'flex',alignItems:'center',gap:4,color:'var(--ink-2)',
                  transition:'all .12s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.background='var(--accent-soft)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--ink-2)';e.currentTarget.style.background='var(--surface)';}}
                >
                  <span>{t.icon}</span>
                  <span style={{fontFamily:'var(--font-km)'}}>{t.km}</span>
                </button>
              ))}
            </div>

            {/* Expense rows */}
            {expenses.length > 0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {expenses.map(e=>(
                  <div key={e.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:'var(--surface-muted)',borderRadius:8,border:'1px solid var(--border)'}}>
                    <span style={{fontSize:16,flexShrink:0}}>{e.icon}</span>
                    <span style={{fontSize:11,color:'var(--ink-2)',fontFamily:'var(--font-km)',minWidth:56,flexShrink:0}}>{e.km}</span>
                    <div style={{display:'flex',alignItems:'center',gap:4,border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',padding:'3px 8px',minWidth:90,flexShrink:0}}>
                      <span style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>$</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={e.amount}
                        onChange={ev=>updExp(e.id,'amount',ev.target.value)}
                        placeholder="0.00"
                        style={{border:'none',outline:'none',background:'transparent',width:64,fontSize:13,fontFamily:'"JetBrains Mono",monospace',fontWeight:600,color:'var(--ink)'}}
                      />
                    </div>
                    <input
                      value={e.note}
                      onChange={ev=>updExp(e.id,'note',ev.target.value)}
                      placeholder={tr('កំណត់សម្គាល់…','Note…')}
                      style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',minWidth:0}}
                    />
                    <button onClick={()=>delExp(e.id)} style={{border:'none',background:'transparent',cursor:'pointer',color:'var(--danger)',opacity:.5,padding:2,display:'flex',alignItems:'center',flexShrink:0}}
                      onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='.5'}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                  </div>
                ))}
                {expTotal > 0 && (
                  <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:10,padding:'6px 10px',borderTop:'1px solid var(--border)',marginTop:2}}>
                    <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('សរុប','Total')}</span>
                    <span style={{fontSize:15,fontWeight:700,color:'var(--warn)',fontFamily:'"JetBrains Mono",monospace'}}>$ {expTotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{fontSize:11,color:'var(--ink-3)',textAlign:'center',padding:'6px 0',fontStyle:'italic'}}>
                {tr('ចុចប្រភេទខាងលើ ដើម្បីបន្ថែមចំណាយ','Tap a type above to add an expense')}
              </div>
            )}
          </div>
          )}

          {/* Notes */}
          <div style={{padding:'12px 20px 14px',borderTop:'1px solid var(--border)'}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',color:'var(--ink-3)',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace',marginBottom:6}}>
              {tr('កំណត់សម្គាល់','Notes / Remarks')}
            </div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
              placeholder={tr('ការខូចខាត ឬ ចំណាំផ្សេងៗ…','Damage, observations, or other notes…')}
              style={{width:'100%',padding:'8px 10px',border:'1px solid var(--border)',borderRadius:8,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',resize:'vertical',boxSizing:'border-box'}}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:'12px 20px',borderTop:'1px solid var(--border)',display:'flex',gap:10,justifyContent:'flex-end',background:'var(--surface-muted)'}}>
          <button onClick={onClose} style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:13,fontFamily:'inherit',color:'var(--ink-2)'}}>
            {tr('បោះបង់','Cancel')}
          </button>
          <button onClick={handleSave} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:600}}>
            {tr('រក្សាទុក ✓','Save inspection ✓')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Inspection PDF Generator ──────────────────────────────────────────────────
const generateInspectionPDF = (vehicles, selDate, selVeh) => {
  const ss = window.__schoolSettings || {};
  const allRecs = window.__vehicleInspections || [];
  const targetVehs = selVeh === 'all' ? vehicles : vehicles.filter(v => v.id === selVeh);

  const fuelColorHex = (p) => p == null ? '#999' : p <= 20 ? '#B0413E' : p <= 40 ? '#C66A2E' : p <= 65 ? '#C5A200' : '#3B7A57';

  const fuelBarHTML = (level) => {
    if (level == null) return '<span style="color:#aaa;font-size:11px">—</span>';
    const c = fuelColorHex(level);
    const steps = [0,25,50,75,100].map(s=>`<span style="font-family:monospace;font-size:10px;color:${level===s?c:'#aaa'};font-weight:${level===s?700:400}">${s===0?'E':s===100?'F':s/25+'⁄4'}</span>`).join('<span style="color:#ccc;margin:0 2px">|</span>');
    return `<div style="display:flex;align-items:center;gap:8px">
      <div style="flex:1;height:7px;background:#eee;border-radius:4px;overflow:hidden;position:relative;min-width:60px">
        <div style="width:${level}%;height:100%;background:${c};border-radius:4px"></div>
        <div style="position:absolute;left:25%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.12)"></div>
        <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.12)"></div>
        <div style="position:absolute;left:75%;top:0;bottom:0;width:1px;background:rgba(0,0,0,.12)"></div>
      </div>
      <span style="font-family:monospace;font-weight:700;font-size:11px;color:${c};min-width:30px">${level}%</span>
    </div>`;
  };

  const itemRowsHTML = (rec) => {
    let rows = '';
    INSP_SECTIONS.forEach(sec => {
      const secItems = [
        ...sec.items,
        ...(rec.customItems?.[sec.id] || []),
      ];
      rows += `<tr><td colspan="3" style="padding:6px 10px 4px;background:#f7f7f5;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#666;font-family:monospace;border-top:2px solid #e0e0e0">${sec.en} <span style="font-weight:400;font-family:inherit;opacity:.6">${sec.km.split(' · ')[0]}</span></td></tr>`;
      secItems.forEach(it => {
        const val = rec.items?.[it.id] || 'ok';
        const nm  = rec.renames?.[it.id] || {};
        const en  = nm.en || it.en;
        const km  = nm.km || it.km.split(' · ')[0];
        const iv  = INSP_VALS[val];
        const bg  = val === 'ok' ? 'transparent' : val === 'warn' ? '#FFF8F0' : '#FFF0F0';
        rows += `<tr style="background:${bg}">
          <td style="padding:5px 10px;font-size:12px;font-weight:500">${en}</td>
          <td style="padding:5px 6px;font-size:11px;color:#888;font-family:inherit">${km}</td>
          <td style="padding:5px 10px;text-align:right;font-family:monospace;font-size:15px;font-weight:700;color:${iv.color}">${iv.label}</td>
        </tr>`;
      });
    });
    return rows;
  };

  let vehicleSections = '';
  targetVehs.forEach(v => {
    const rec = allRecs.find(r => r.vehicleId === v.id && r.date === selDate);
    const osC = rec ? INSP_VALS[rec.overallStatus] : null;
    vehicleSections += `
    <div style="margin-bottom:24px;border:1px solid #ddd;border-radius:8px;overflow:hidden;page-break-inside:avoid">
      <div style="padding:12px 16px;background:#f5f5f2;border-bottom:1px solid #ddd;display:flex;align-items:center;gap:14px">
        <div style="font-size:22px;font-weight:700;font-family:monospace;color:${osC?osC.color:'#aaa'};min-width:28px;text-align:center">${osC?osC.label:'—'}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700">${v.plate} &nbsp;·&nbsp; ${v.make} ${v.year?'('+v.year+')':''}</div>
          <div style="font-size:11px;color:#666;margin-top:2px">
            ${rec ? `<span style="color:#3B7A57;font-weight:600">${osC?.en}</span> &nbsp;·&nbsp; ${rec.inspector} &nbsp;·&nbsp; ${rec.date}` : '<span style="color:#aaa">No inspection record</span>'}
          </div>
        </div>
        ${rec ? `<div style="min-width:170px">
          <div style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888;font-family:monospace;margin-bottom:3px">⛽ កំរិតសាំង · Fuel Level</div>
          ${fuelBarHTML(rec.fuelLevel)}
        </div>` : ''}
      </div>
      ${rec
        ? `<table style="width:100%;border-collapse:collapse">${itemRowsHTML(rec)}</table>${rec.notes ? `<div style="padding:8px 16px;border-top:1px solid #eee;font-size:11px;color:#555;font-style:italic">📝 ${rec.notes}</div>` : ''}
           <div style="padding:10px 16px;border-top:1px solid #eee;display:flex;gap:40px;font-size:11px;color:#888">
             <span>Inspected by: <strong style="color:#333">${rec.inspector}</strong></span>
             <span>Signature: ___________________________</span>
           </div>`
        : '<div style="padding:16px;text-align:center;color:#aaa;font-size:12px">No inspection record for this date</div>'
      }
    </div>`;
  });

  const inspected = targetVehs.filter(v => allRecs.find(r=>r.vehicleId===v.id&&r.date===selDate)).length;
  // Tally inspection ITEMS (○ △ ×) across every inspected vehicle, so the
  // summary sums each check — not just one overall status per vehicle.
  let okItems = 0, warnItems = 0, failItems = 0;
  targetVehs.forEach(v => {
    const r = allRecs.find(x => x.vehicleId === v.id && x.date === selDate);
    if (!r) return;
    Object.values(r.items || {}).forEach(val => {
      if (val === 'fail') failItems++;
      else if (val === 'warn') warnItems++;
      else okItems++;
    });
  });
  const totalItems = okItems + warnItems + failItems;
  // Vehicle-level rollup (kept for the per-vehicle status badges below)
  const failCount = targetVehs.filter(v=>{const r=allRecs.find(x=>x.vehicleId===v.id&&x.date===selDate);return r?.overallStatus==='fail';}).length;
  const warnCount = targetVehs.filter(v=>{const r=allRecs.find(x=>x.vehicleId===v.id&&x.date===selDate);return r?.overallStatus==='warn';}).length;

  const html = `<!doctype html><html lang="km"><head><meta charset="utf-8"/>
<title>Inspection Report · ${selDate}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Noto Sans Khmer','Hanuman',Arial,sans-serif;font-size:13px;color:#1a1a19;background:#fff;padding:28px 32px}
  @page{margin:18mm 16mm;size:A4}
  @media print{body{padding:0}}
  .header-logo{width:40px;height:40px;border-radius:8px;object-fit:cover}
</style>
</head><body>
  <!-- Document Header -->
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #ddd">
    ${ss.logo ? `<img src="${ss.logo}" class="header-logo" alt="logo"/>` : '<div style="width:40px;height:40px;border-radius:8px;background:#2A5DB0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px">A</div>'}
    <div style="flex:1">
      <div style="font-size:18px;font-weight:700">${ss.name || 'Anzen Driving Academy'}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">ទម្រង់ពិនិត្យប្រចាំថ្ងៃ &nbsp;·&nbsp; Daily Vehicle Inspection Report &nbsp;·&nbsp; 日常点検表</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:700;font-family:monospace">${selDate}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <!-- Summary strip -->
  <div style="display:flex;gap:12px;margin-bottom:20px">
    ${[
      ['Vehicles', `${inspected} / ${targetVehs.length}`, '#2A5DB0'],
      ['All Good (○)',  `${okItems}`,   '#3B7A57'],
      ['Caution (△)',   `${warnItems}`, '#C66A2E'],
      ['Problem (×)',   `${failItems}`, '#B0413E'],
      ['Total checks',  `${totalItems}`, '#555'],
    ].map(([l,v,c])=>`<div style="flex:1;padding:10px 14px;border:1px solid ${c}33;border-radius:8px;background:${c}0d">
      <div style="font-size:10px;color:#888;font-family:monospace;text-transform:uppercase;letter-spacing:.06em">${l}</div>
      <div style="font-size:22px;font-weight:700;color:${c};font-family:monospace">${v}</div>
    </div>`).join('')}
  </div>

  <!-- Vehicle sections -->
  ${vehicleSections}
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=750');
  if (!w) { alert('Pop-up blocked. Please allow pop-ups for this page.'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 600);
};

// ── Inspection Log Viewer ─────────────────────────────────────────────────────
const FvInspectionLog = ({ vehicles, tr }) => {
  const [selDate, setSelDate]   = React.useState(todayStr());
  const [selVeh, setSelVeh]     = React.useState('all');
  const [inspOpen, setInspOpen] = React.useState(null);
  const [, forceUp] = React.useReducer(x=>x+1,0);

  const shiftDay = (dateStr, delta) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    return localDateStr ? localDateStr(d) : d.toISOString().slice(0,10);
  };

  const records = (window.__vehicleInspections||[]).filter(r =>
    r.date === selDate && (selVeh === 'all' || r.vehicleId === selVeh)
  );

  // Recent inspections across ALL dates (most recent first), respecting vehicle filter
  const recentAll = (window.__vehicleInspections||[])
    .filter(r => selVeh === 'all' || r.vehicleId === selVeh)
    .slice()
    .sort((a,b) => (b.date||'').localeCompare(a.date||'') || (b.savedAt||'').localeCompare(a.savedAt||''))
    .slice(0, 12);

  const allToday = vehicles.map(v => {
    const rec = (window.__vehicleInspections||[]).find(r => r.vehicleId === v.id && r.date === selDate);
    return { v, rec };
  });

  const osC = (s) => INSP_VALS[s||'ok'];

  return (
    <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:14}}>
      {inspOpen && <VehicleInspectionModal vehicle={inspOpen} onClose={()=>{setInspOpen(null);forceUp();}} tr={tr}/>}

      {/* Controls */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:12,color:'var(--ink-3)'}}>{tr('ថ្ងៃ','Date')}:</span>
          <button onClick={()=>setSelDate(shiftDay(selDate,-1))} title={tr('ថ្ងៃមុន','Previous day')} style={{border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',cursor:'pointer',width:28,height:30,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ink-2)',fontSize:14,lineHeight:1}}>‹</button>
          <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:6,padding:'5px 10px',fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)'}}/>
          <button onClick={()=>setSelDate(shiftDay(selDate,1))} title={tr('ថ្ងៃបន្ទាប់','Next day')} style={{border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',cursor:'pointer',width:28,height:30,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ink-2)',fontSize:14,lineHeight:1}}>›</button>
          {selDate !== todayStr() && (
            <button onClick={()=>setSelDate(todayStr())} style={{border:'1px solid var(--accent)',borderRadius:6,background:'var(--accent-soft)',cursor:'pointer',padding:'5px 10px',fontSize:11,fontWeight:600,color:'var(--accent)',fontFamily:'inherit'}}>{tr('ថ្ងៃនេះ','Today')}</button>
          )}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:'var(--ink-3)'}}>{tr('យានយន្ត','Vehicle')}:</span>
          <select value={selVeh} onChange={e=>setSelVeh(e.target.value)} style={{border:'1px solid var(--border)',borderRadius:6,padding:'5px 10px',fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)'}}>
            <option value="all">{tr('ទាំងអស់','All vehicles')}</option>
            {vehicles.map(v=><option key={v.id} value={v.id}>{v.plate} · {v.make}</option>)}
          </select>
        </div>
        <div style={{flex:1,textAlign:'right',fontSize:12,color:'var(--ink-3)'}}>
          {records.length} {tr('កំណត់ត្រា','record(s)')} · {allToday.filter(x=>x.rec).length}/{vehicles.length} {tr('យានយន្ត​បានពិនិត្យ','vehicles checked')}
        </div>
        <button
          onClick={() => generateInspectionPDF(vehicles, selDate, selVeh)}
          style={{
            display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
            border:'none',borderRadius:8,background:'var(--accent)',color:'#fff',
            cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit',flexShrink:0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {tr('ទាញ PDF','Download PDF')}
        </button>
      </div>

      {/* Vehicle grid — tick if inspected, cross if not */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
        {allToday.filter(x=>selVeh==='all'||x.v.id===selVeh).map(({v,rec})=>{
          const c = rec ? osC(rec.overallStatus) : null;
          return (
            <div key={v.id} onClick={()=>setInspOpen(v)} style={{
              display:'flex',alignItems:'center',gap:12,padding:'10px 14px',
              border:`1px solid ${rec ? c.color+'44' : 'var(--border)'}`,
              borderRadius:10,cursor:'pointer',background:'var(--surface)',
              transition:'all .15s',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}
            >
              <div style={{width:40,height:26,borderRadius:5,overflow:'hidden',flexShrink:0}}><Photo tag={v.photo} w={40} h={26} r={0}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.plate} · {v.make}</div>
                {rec ? (
                  <div style={{fontSize:11,color:c.color,fontWeight:600}}>{c.label} {tr(c.km,c.en)}</div>
                ) : (
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{tr('មិន​ទាន់​ពិនិត្យ','Not inspected')}</div>
                )}
              </div>
              {rec
                ? <div style={{fontSize:18,color:c.color,fontFamily:'"JetBrains Mono",monospace',fontWeight:700}}>{c.label}</div>
                : <div style={{fontSize:18,color:'var(--ink-3)',opacity:.3}}>—</div>
              }
            </div>
          );
        })}
      </div>

      {/* Detail of records */}
      {records.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',color:'var(--ink-3)',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>{tr('លម្អិត · Detail','Inspection detail')}</div>
          {records.map((rec,ri) => {
            const veh = vehicles.find(v=>v.id===rec.vehicleId);
            const c = osC(rec.overallStatus);
            const failItems = Object.entries(rec.items||{}).filter(([,v])=>v==='fail');
            const warnItems = Object.entries(rec.items||{}).filter(([,v])=>v==='warn');
            return (
              <div key={ri} style={{border:`1px solid ${c.color}44`,borderRadius:10,overflow:'hidden'}}>
                <div style={{padding:'10px 14px',background:c.bg,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{fontSize:20,fontFamily:'"JetBrains Mono",monospace',fontWeight:700,color:c.color}}>{c.label}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{veh?.plate} · {veh?.make}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>
                      {tr('ពិនិត្យដោយ','Inspector')}: {rec.inspector} · {rec.date}
                    </div>
                  </div>
                  <button onClick={()=>setInspOpen(veh)} style={{padding:'5px 12px',borderRadius:7,border:`1px solid ${c.color}`,background:'transparent',color:c.color,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
                    {tr('កែ','Edit')}
                  </button>
                </div>
                {(failItems.length > 0 || warnItems.length > 0) && (
                  <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:4}}>
                    {[...failItems,...warnItems].map(([id,val])=>{
                      const itMeta = INSP_SECTIONS.flatMap(s=>s.items).find(it=>it.id===id);
                      return itMeta ? (
                        <div key={id} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                          <span style={{fontFamily:'"JetBrains Mono",monospace',fontWeight:700,color:INSP_VALS[val].color}}>{INSP_VALS[val].label}</span>
                          <span style={{fontWeight:500}}>{itMeta.en}</span>
                          <span style={{fontSize:11,color:'var(--ink-3)',marginLeft:5,fontFamily:'var(--font-km)'}}>{itMeta.km.split(' · ')[0]}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                {rec.notes && <div style={{padding:'8px 14px',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--ink-2)',fontStyle:'italic'}}>📝 {rec.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {records.length === 0 && (
        <div style={{textAlign:'center',padding:'32px 16px',color:'var(--ink-3)',fontSize:13}}>
          <div style={{fontSize:28,marginBottom:8}}>📋</div>
          <div style={{fontWeight:600,marginBottom:4}}>{tr('គ្មានកំណត់ត្រានៅថ្ងៃ','No inspection records for')} {selDate}</div>
          <div style={{fontSize:12}}>{tr('ចុចលើរូបរថយន្តក្នុង Directory ដើម្បីបន្ថែម','Click a vehicle photo in Directory to add')}</div>
        </div>
      )}

      {/* Recent inspections across ALL dates — so past records (e.g. yesterday) are always visible */}
      {recentAll.length > 0 && (
        <div style={{marginTop:6,paddingTop:12,borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',color:'var(--ink-3)',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>
            🕘 {tr('ប្រវត្តិពិនិត្យថ្មីៗ (គ្រប់ថ្ងៃ)','Recent inspections (all dates)')}
          </div>
          {recentAll.map((rec,ri) => {
            const veh = vehicles.find(v=>v.id===rec.vehicleId);
            const c = osC(rec.overallStatus);
            const isSel = rec.date === selDate;
            return (
              <div key={ri} onClick={()=>setSelDate(rec.date)} title={tr('ចុចដើម្បីបើកថ្ងៃនេះ','Click to open this date')} style={{
                display:'flex',alignItems:'center',gap:10,padding:'8px 12px',
                border:`1px solid ${isSel?c.color+'66':'var(--border)'}`,borderRadius:8,cursor:'pointer',
                background:isSel?c.bg:'var(--surface)',transition:'background .12s',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface-muted)'}
                onMouseLeave={e=>e.currentTarget.style.background=isSel?c.bg:'var(--surface)'}>
                <span style={{fontSize:16,fontFamily:'"JetBrains Mono",monospace',fontWeight:700,color:c.color,width:18,textAlign:'center',flexShrink:0}}>{c.label}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{veh?.plate || rec.vehicleId} · {veh?.make || ''}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{tr(c.km,c.en)} · {rec.inspector || '—'}</div>
                </div>
                <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-2)',flexShrink:0}}>{rec.date}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Cards view ───────────────────────────────────────────────────────────────
const FLEET_STATUS_OPTS = ['Active','Idle','Service due','Workshop'];

const plateBg = (trans) => {
  if (trans === 'AT' || trans === 'CVT') return { bg:'#1A4FA8', color:'#FFFFFF' };
  if (trans === 'MT') return { bg:'#B0413E', color:'#FFFFFF' };
  return { bg:'rgba(0,0,0,.72)', color:'#FFFFFF' };
};

const FvCard = ({ v, onSelect, selectedId, onStatusChange, onSaveDates, onParkingChange }) => {
  const { tr } = useAppActions();
  const bp = useBreakpoint();
  const [editDates, setEditDates] = React.useState(false);
  const [regExp,  setRegExp]  = React.useState(v.reg_exp   || '');
  const [roadTax, setRoadTax] = React.useState(v.road_tax  || '');
  const [insExp,  setInsExp]  = React.useState(v.ins_exp   || '');
  const [oilExp,  setOilExp]  = React.useState(v.oil_exp   || '');
  const [inspOpen, setInspOpen] = React.useState(false);
  const [, forceUp] = React.useReducer(x=>x+1,0);

  React.useEffect(() => {
    setRegExp(v.reg_exp   || '');
    setRoadTax(v.road_tax || '');
    setInsExp(v.ins_exp   || '');
    setOilExp(v.oil_exp   || '');
  }, [v.reg_exp, v.road_tax, v.ins_exp, v.oil_exp]);

  const pc = plateBg(v.trans);
  const dInp = { type:'date', style:{
    width:'100%', padding:'4px 6px', border:'1px solid var(--border)',
    borderRadius:5, fontSize:11, fontFamily:'inherit',
    background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box',
  }};

  const handleSave = (e) => {
    e.stopPropagation();
    onSaveDates(v.id, { reg_exp: regExp, road_tax: roadTax, ins_exp: insExp, oil_exp: oilExp });
    setEditDates(false);
  };

  // Latest inspection for fuel + today's status
  const allInsp = (window.__vehicleInspections||[]).filter(r=>r.vehicleId===v.id).sort((a,b)=>b.date.localeCompare(a.date));
  const latestInsp = allInsp[0] || null;
  const todayRec = allInsp.find(r=>r.date===todayStr()) || null;
  const todayC = todayRec ? INSP_VALS[todayRec.overallStatus] : null;
  const fuel = latestInsp?.fuelLevel ?? null;

  // Sections with data for mobile: hide empty ones
  const hasServiceInfo = !bp.mobile || (v.service && v.service > 0) || (v.inst && v.inst !== '—');
  const hasDocs = !bp.mobile || !!(v.reg_exp || v.road_tax || v.ins_exp || v.oil_exp);
  const photoH = bp.mobile ? 80 : 110;
  const cardPad = bp.mobile ? 10 : 12;

  return (
    <>
      {inspOpen && <VehicleInspectionModal vehicle={v} onClose={()=>{setInspOpen(false);forceUp();}} tr={tr}/>}
      <div onClick={() => onSelect(v.id)} style={{
        background: selectedId === v.id ? 'var(--surface-muted)' : 'var(--surface)',
        border:'1px solid ' + (selectedId === v.id ? 'var(--border-strong)' : 'var(--border)'),
        borderRadius:10, overflow:'hidden', cursor:'pointer',
        transition:'border-color .15s',
      }}>
      <div style={{position:'relative'}}>
        {/* Photo — view only, click opens inspection */}
        <div onClick={e=>{e.stopPropagation();setInspOpen(true);}} style={{position:'relative',cursor:'pointer'}}>
          <Photo tag={v.photo} w="100%" h={photoH} r={0}/>
          {/* Inspection shortcut overlay */}
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'flex-end',justifyContent:'flex-end',padding:6,background:'linear-gradient(to top, rgba(0,0,0,.35) 0%, transparent 50%)'}}>
            <div style={{
              padding:'3px 8px',borderRadius:5,fontSize:10,fontWeight:700,
              background: todayC ? todayC.color : 'rgba(0,0,0,.55)',
              color:'#fff',fontFamily:'"JetBrains Mono",monospace',
              display:'flex',alignItems:'center',gap:4,
              boxShadow:'0 1px 4px rgba(0,0,0,.3)',
            }}>
              <span style={{fontSize:13}}>{todayC ? todayC.label : '📋'}</span>
              {tr('ពិនិត្យ','Inspect')}
            </div>
          </div>
        </div>
        <div style={{position:'absolute',top:8,left:8}} onClick={e=>{e.stopPropagation();onStatusChange(v.id);}}>
          <div style={{
            padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',
            background: v.status==='Active'?'var(--good)':v.status==='Workshop'?'var(--danger)':v.status==='Service due'?'var(--warn)':'var(--surface-muted)',
            color: v.status==='Idle'?'var(--ink)':'#fff',
            boxShadow:'0 1px 4px rgba(0,0,0,.25)',
            display:'flex',alignItems:'center',gap:5,
          }}>
            {v.status}
            <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" style={{opacity:.7}}><path d="M0 0h8L4 5z"/></svg>
          </div>
        </div>
        {/* Plate */}
        <div style={{position:'absolute',top:8,right:8,
          background:pc.bg, color:pc.color,
          padding:'3px 8px',borderRadius:6,
          fontFamily:'"JetBrains Mono",monospace',
          fontSize:11,fontWeight:700,
          boxShadow:'0 1px 4px rgba(0,0,0,.3)',
          display:'flex',alignItems:'center',gap:4,
        }}>
          {v.plate}
          {v.trans && <span style={{fontSize:9,opacity:.85,fontWeight:500}}>·{v.trans}</span>}
        </div>
        {/* Parking location — below plate */}
        <div style={{position:'absolute',top:36,right:8}} onClick={e=>{e.stopPropagation(); onParkingChange && onParkingChange(v.id);}}>
          {(() => {
            const pk = v.parking || 'school';
            const cfg = PARKING_CFG[pk] || PARKING_CFG.school;
            return (
              <div style={{
                padding:'2px 7px',borderRadius:5,fontSize:10,fontWeight:700,cursor:'pointer',
                background:cfg.bg, color:cfg.color,
                boxShadow:'0 1px 4px rgba(0,0,0,.3)',
                letterSpacing:'.03em',
              }}>P · {cfg.label}</div>
            );
          })()}
        </div>
      </div>
      <div style={{padding:cardPad}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:bp.mobile?15:14,fontWeight:700}}>{v.make}</div>
            <div style={{fontSize:bp.mobile?12:11,color:'var(--ink-3)',marginTop:2}}>
              {v.year} · {v.cls}{v.color ? ' · ' + v.color : ''}
            </div>
          </div>
          {(!bp.mobile || (v.km && v.km > 0)) && (
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{(v.km||0).toLocaleString()}</div>
            <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>km</div>
          </div>
          )}
        </div>
        <div style={{marginTop:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:10,color:'var(--ink-3)'}}>
            <span>⛽ ប្រេង · Fuel</span>
            {fuel !== null
              ? <span style={{fontVariantNumeric:'tabular-nums',fontWeight:600,color:fuelColor(fuel)}}>{fuel}%</span>
              : <span style={{color:'var(--ink-3)',fontStyle:'italic'}}>—</span>
            }
          </div>
          <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden',position:'relative'}}>
            {fuel !== null && (
              <div style={{width:`${fuel}%`,height:'100%',background:fuelColor(fuel),borderRadius:999,transition:'width .3s'}}/>
            )}
            {[25,50,75].map(p=>(
              <div key={p} style={{position:'absolute',left:`${p}%`,top:0,bottom:0,width:1,background:'rgba(0,0,0,.12)'}}/>
            ))}
          </div>
        </div>
        {hasServiceInfo && (
        <div style={{marginTop:10,paddingTop:8,borderTop:'1px dashed var(--border)',
          display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:bp.mobile?12:11}}>
          <div>
            <div style={{color:'var(--ink-3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Service</div>
            <div style={{marginTop:2,fontWeight:500,color:(v.service||0)<1500&&(v.service||0)>0?'var(--warn)':'inherit'}}>
              {(v.service||0) === 0 ? 'ឥឡូវ · Due now' : `in ${(v.service||0).toLocaleString()} km`}
            </div>
          </div>
          <div>
            <div style={{color:'var(--ink-3)',fontSize:10,textTransform:'uppercase',letterSpacing:'.05em'}}>Instructor</div>
            <div style={{marginTop:2,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.inst || '—'}</div>
          </div>
        </div>
        )}

        {/* Document expiry — inline editable, hidden on mobile if all empty */}
        {hasDocs && <div style={{marginTop:10,paddingTop:8,borderTop:'1px dashed var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.04em',textTransform:'uppercase'}}>ឯកសារ</span>
            {editDates ? (
              <div style={{display:'flex',gap:5}} onClick={e=>e.stopPropagation()}>
                <div onClick={() => setEditDates(false)} style={{cursor:'pointer',fontSize:10,fontWeight:500,
                  color:'var(--ink-3)',padding:'2px 7px',borderRadius:4,
                  background:'var(--surface-muted)',border:'1px solid var(--border)'}}>បោះបង់</div>
                <div onClick={handleSave} style={{cursor:'pointer',fontSize:10,fontWeight:600,
                  color:'#fff',padding:'2px 8px',borderRadius:4,
                  background:'var(--good)'}}>✓ រក្សាទុក</div>
              </div>
            ) : (
              <div onClick={e=>{e.stopPropagation();setEditDates(true);}} style={{cursor:'pointer',fontSize:10,fontWeight:500,
                color:'var(--ink-3)',padding:'2px 7px',borderRadius:4,
                background:'var(--surface-muted)',border:'1px solid var(--border)'}}>✎ កែ</div>
            )}
          </div>

          {editDates ? (
            <div onClick={e=>e.stopPropagation()} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {[
                { label:'ឆៀក',        val:regExp,  set:setRegExp  },
                { label:'ពន្ធផ្លូវ',    val:roadTax, set:setRoadTax },
                { label:'ធានារ៉ាប់រង', val:insExp,  set:setInsExp  },
                { label:'ប្រេងម៉ាស៊ីន', val:oilExp,  set:setOilExp  },
              ].map(f => (
                <div key={f.label}>
                  <div style={{fontSize:9,color:'var(--ink-3)',marginBottom:2}}>{f.label}</div>
                  <input {...dInp} value={f.val} onChange={e=>f.set(e.target.value)}/>
                </div>
              ))}
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {[
                { km:'ឆៀក',            d: v.reg_exp  },
                { km:'ពន្ធផ្លូវ',        d: v.road_tax },
                { km:'ធានារ៉ាប់រង',     d: v.ins_exp  },
                { km:'ប្ដូប្រេងម៉ាស៊ីន', d: v.oil_exp  },
              ].map(row => (
                <div key={row.km} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11}}>
                  <span style={{color:'var(--ink-3)',fontSize:10}}>{row.km}</span>
                  <span style={{fontWeight:row.d?600:400,fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:expColor(row.d)}}>
                    {row.d || '—'}
                    {row.d && monthsUntil(row.d) < 0 && ' ⚠'}
                    {row.d && monthsUntil(row.d) >= 0 && monthsUntil(row.d) <= 1 && ' !'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </div>
    </>
  );
};

const FvCards = ({ vehicles, onSelect, selectedId, onStatusChange, onSaveDates, onParkingChange }) => (
  <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
    {vehicles.map(v => (
      <FvCard key={v.id} v={v} onSelect={onSelect} selectedId={selectedId}
        onStatusChange={onStatusChange} onSaveDates={onSaveDates} onParkingChange={onParkingChange}/>
    ))}
  </div>
);

// ── Table view ───────────────────────────────────────────────────────────────
const FvTable = ({ vehicles, onSelect, selectedId }) => (
  <div style={{overflowX:'auto'}}>
  <div style={{minWidth:640}}>
    <div style={{
      padding:'8px 16px',display:'grid',
      gridTemplateColumns:'72px 1.6fr 1fr .8fr 1fr 1fr 1fr 1fr',gap:12,
      fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',
      fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',
      borderBottom:'1px solid var(--border)',
    }}>
      <div/><div>Vehicle</div><div>Class</div><div>Year</div>
      <div>Odometer</div><div>Fuel</div><div>Service</div><div>Status</div>
    </div>
    {vehicles.map(v => (
      <div key={v.id} onClick={() => onSelect(v.id)} style={{
        padding:'10px 16px',display:'grid',
        gridTemplateColumns:'72px 1.6fr 1fr .8fr 1fr 1fr 1fr 1fr',gap:12,
        alignItems:'center',borderTop:'1px solid var(--border)',
        background: selectedId === v.id ? 'var(--surface-muted)' : 'transparent',
        cursor:'pointer',
      }}>
        <Photo tag={v.photo} w={64} h={40} r={5}/>
        <div>
          <div style={{fontSize:13,fontWeight:500}}>{v.make}</div>
          {(() => { const pc = plateBg(v.trans); return (
            <div style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:2,
              background:pc.bg,color:pc.color,
              padding:'1px 6px',borderRadius:4,
              fontFamily:'"JetBrains Mono",monospace',fontSize:10,fontWeight:700}}>
              {v.plate}{v.trans&&<span style={{opacity:.75,fontWeight:400}}>·{v.trans}</span>}
            </div>
          ); })()}
        </div>
        <div style={{fontSize:12,color:'var(--ink-2)'}}>{v.cls}</div>
        <div style={{fontSize:12,fontVariantNumeric:'tabular-nums'}}>{v.year}</div>
        <div style={{fontSize:13,fontVariantNumeric:'tabular-nums'}}>
          {(v.km||0).toLocaleString()} <span style={{fontSize:10,color:'var(--ink-3)'}}>km</span>
        </div>
        <div>
          <div style={{height:5,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden',width:52}}>
            <div style={{width:`${v.fuel||0}%`,height:'100%',
              background:(v.fuel||0)<30?'var(--danger)':(v.fuel||0)<50?'var(--warn)':'var(--good)'}}/>
          </div>
          <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2,fontVariantNumeric:'tabular-nums'}}>{v.fuel||0}%</div>
        </div>
        <div style={{fontSize:12,color:(v.service||0)===0?'var(--danger)':(v.service||0)<1500?'var(--warn)':'var(--ink-2)'}}>
          {(v.service||0) === 0 ? 'Due now' : `${(v.service||0).toLocaleString()} km`}
        </div>
        <Badge tone={statusToneFleet(v.status)}>{v.status}</Badge>
      </div>
    ))}
  </div>
  </div>
);

// ── Detail row ────────────────────────────────────────────────────────────────
const FvDetailRow = ({ v, onEdit, forceUpdate }) => {
  const { toast, tr } = useAppActions();
  if (!v) return null;
  return (
    <Card pad={0}>
      {/* Header */}
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <Photo tag={v.photo} w={110} h={64} r={7}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={{fontSize:20,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{v.make}</div>
            {(() => { const pc = plateBg(v.trans); return (
              <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:12,padding:'3px 10px',
                background:pc.bg,color:pc.color,borderRadius:5,fontWeight:700,
                display:'flex',alignItems:'center',gap:5}}>
                {v.plate}
                {v.trans && <span style={{fontSize:9,opacity:.8,fontWeight:500}}>·{v.trans}</span>}
              </div>
            ); })()}
            <Badge tone={statusToneFleet(v.status)}>{v.status}</Badge>
          </div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:4}}>
            {[v.year, v.cls, v.trans === 'AT' ? 'Automatic' : v.trans === 'MT' ? 'Manual' : v.trans, v.color, v.station].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button
          onClick={() => {
            v.visible = v.visible === false ? true : false;
            if (window.saveAllData) window.saveAllData();
            if (window.__notifyVehiclesChanged) window.__notifyVehiclesChanged();
            forceUpdate();
            toast(v.visible === false
              ? tr('លាក់​ចេញ​ពី Tab Vehicle', 'Hidden from Vehicle tab')
              : tr('បង្ហាញ​នៅ Tab Vehicle', 'Shown in Vehicle tab'),
            'neutral');
          }}
          style={{
            padding:'6px 12px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',
            border:'1px solid var(--border)',transition:'all .12s',flexShrink:0,
            background: v.visible === false ? 'var(--surface-muted)' : 'var(--good)18',
            color:       v.visible === false ? 'var(--ink-3)' : 'var(--good)',
          }}>
          {v.visible === false ? tr('លាក់ Tab Vehicle ●','Hidden in Vehicle ●') : tr('បង្ហាញ Tab Vehicle ●','Visible in Vehicle ●')}
        </button>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <Btn kind="primary" size="sm" icon={<Icon name="wrench" size={13}/>}
          onClick={() => toast(tr('សូម​ប្រើ​ "Work order" ខាង​ជើង', 'Use "Work order" button above'), 'neutral')}>
          បញ្ជារការងារ
        </Btn>
      </div>

      {/* 4-column detail grid */}
      <div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',
            textTransform:'uppercase',color:'var(--ink-3)',marginBottom:8}}>SPECS</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <Row k="Fuel type"     v={v.fuel_type || '—'}/>
            <Row k="Transmission"  v={v.trans === 'AT' ? 'Automatic' : v.trans === 'MT' ? 'Manual' : (v.trans || '—')}/>
            <Row k="Odometer"      v={`${(v.km||0).toLocaleString()} km`}/>
            <Row k="Color"         v={v.color || '—'}/>
          </div>
        </div>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',
            textTransform:'uppercase',color:'var(--ink-3)',marginBottom:8}}>USAGE (mo.)</div>
          <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:8}}>
            <div style={{fontSize:24,fontWeight:600,fontFamily:'var(--font-display)'}}>{v.lessons_mo || 0}</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>មេរៀន · lessons</div>
          </div>
          <div style={{display:'flex',gap:1}}>
            {Array.from({length:30}).map((_, i) => {
              const used = i < Math.round(((v.lessons_mo||0)/60)*30);
              return <div key={i} style={{flex:1,height:12,background:used?'var(--accent)':'var(--surface-muted)',borderRadius:1}}/>;
            })}
          </div>
        </div>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',
            textTransform:'uppercase',color:'var(--ink-3)',marginBottom:8}}>COSTS (mo.)</div>
          <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:8}}>
            <div style={{fontSize:24,fontWeight:600,fontFamily:'var(--font-display)'}}>${v.cost_mo || 0}</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>total</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <Row k="Fuel"          v={`$${v.fuel_mo || 0}`}/>
            <Row k="Service"       v={`$${Math.max(0,(v.cost_mo||0)-(v.fuel_mo||0))}`}/>
          </div>
        </div>
        <div>
          <div style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',
            textTransform:'uppercase',color:'var(--ink-3)',marginBottom:8}}>DOCUMENTS</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              { k:'ឆៀក · Reg.',      d: v.reg_exp  },
              { k:'ពន្ធផ្លូវ · Tax',   d: v.road_tax },
              { k:'ធានារ៉ាប់រង · Ins.', d: v.ins_exp  },
              { k:'ប្រេង · Oil',       d: v.oil_exp  },
            ].map(doc => {
              const color = expColor(doc.d);
              return (
                <div key={doc.k} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--ink-3)'}}>{doc.k}</span>
                  <span style={{fontWeight:500,color}}>{doc.d || '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ── Edit panel ───────────────────────────────────────────────────────────────
// ── Edit panel helpers — module level to avoid remount/focus loss ─────────────
const FvLbl = ({ children }) => (
  <div style={{fontSize:11,fontWeight:500,color:'var(--ink-2)',marginBottom:4}}>{children}</div>
);
const FvField = ({ label, children }) => (
  <div><FvLbl>{label}</FvLbl>{children}</div>
);
const fvSecTitle = (t) => (
  <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',
    textTransform:'uppercase',color:'var(--ink-3)',margin:'16px 0 10px'}}>{t}</div>
);

const FvEditPanel = ({ v, onSave, onCancel, onDelete, onSavePhoto }) => {
  const { tr } = useAppActions();
  const [plate,    setPlate]    = React.useState(v.plate    || '');
  const [make,     setMake]     = React.useState(v.make     || '');
  const [year,     setYear]     = React.useState(v.year     || '');
  const [clsVal,   setClsVal]   = React.useState(v.cls      || 'B · Sedan');
  const [color,    setColor]    = React.useState(v.color    || '');
  const [km,       setKm]       = React.useState(String(v.km      || ''));
  const [fuel,     setFuel]     = React.useState(String(v.fuel     || ''));
  const [fuelType, setFuelType] = React.useState(v.fuel_type || 'Gasoline 95');
  const [trans,    setTrans]    = React.useState(v.trans    || 'AT');
  const [status,   setStatus]   = React.useState(v.status   || 'Active');
  const [inst,     setInst]     = React.useState(v.inst     || '');
  const [station,  setStation]  = React.useState(v.station  || '');
  const [svc,      setSvc]      = React.useState(String(v.service  || ''));
  const [regExp,   setRegExp]   = React.useState(v.reg_exp   || '');
  const [roadTax,  setRoadTax]  = React.useState(v.road_tax  || '');
  const [insExp,   setInsExp]   = React.useState(v.ins_exp   || '');
  const [oilExp,   setOilExp]   = React.useState(v.oil_exp   || '');
  const [costMo,   setCostMo]   = React.useState(String(v.cost_mo  || ''));
  const [fuelMo,   setFuelMo]   = React.useState(String(v.fuel_mo  || ''));
  const [confirmDel, setConfirmDel] = React.useState(false);

  const clsOptions = ['A · Moto', 'B · Sedan', 'B · SUV', 'B · Van', 'C · Truck', 'C · Bus', 'D · Bus'];

  const save = () => {
    if (!plate.trim()) return;
    onSave({
      ...v,
      plate:     plate.trim(),
      make:      make.trim(),
      year:      year.trim(),
      cls:       clsVal,
      color:     color.trim(),
      km:        parseFloat(km) || 0,
      fuel:      parseFloat(fuel) || 0,
      fuel_type: fuelType,
      trans,
      status,
      inst:      inst.trim() || '—',
      station:   station.trim(),
      service:   parseFloat(svc) || 0,
      reg_exp:   regExp,
      road_tax:  roadTax,
      ins_exp:   insExp,
      oil_exp:   oilExp,
      cost_mo:   parseFloat(costMo) || 0,
      fuel_mo:   parseFloat(fuelMo) || 0,
    });
  };

  const inp = { style:{
    width:'100%',padding:'7px 10px',border:'1px solid var(--border)',
    borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',
    boxSizing:'border-box',
  }};
  const sel = { style:{...inp.style} };
  const grid2 = { style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12} };

  return (
    <Card>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600}}>
          កែ​ · Edit — {v.plate}
        </div>
        {confirmDel ? (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:12,color:'var(--danger)'}}>
              {tr('ប្រាកដ​ទេ?', 'Are you sure?')}
            </span>
            <Btn kind="danger" size="sm" onClick={() => onDelete(v.id)}>
              {tr('លុប', 'Delete')}
            </Btn>
            <Btn kind="ghost" size="sm" onClick={() => setConfirmDel(false)}>
              {tr('បោះបង់', 'Cancel')}
            </Btn>
          </div>
        ) : (
          <Btn kind="ghost" size="sm"
            onClick={() => setConfirmDel(true)}
            style={{color:'var(--danger)'}}>
            {tr('លុប​យានយន្ត', 'Delete vehicle')}
          </Btn>
        )}
      </div>

      {fvSecTitle('ព័ត៌មាន​ · BASIC')}
      <div style={{marginBottom:14,display:'flex',gap:16,alignItems:'center'}}>
        <UploadPhoto id={v.id} photo={v.photo} w={140} h={88} r={8} onUpload={onSavePhoto}/>
        <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.5}}>
          {tr('ចុចលើរូបភាព ដើម្បី upload រូប','Click photo to upload')}
        </div>
      </div>
      <div {...grid2}>
        <FvField label={tr('ផ្លាក','Plate *')}><input {...inp} value={plate} onChange={e=>setPlate(e.target.value)} placeholder="2AB-1234"/></FvField>
        <FvField label={tr('ម៉ាក ម៉ូដែល','Make / Model')}><input {...inp} value={make} onChange={e=>setMake(e.target.value)} placeholder="Toyota Vios"/></FvField>
        <FvField label={tr('ឆ្នាំ','Year')}><input {...inp} value={year} onChange={e=>setYear(e.target.value)} placeholder="2024"/></FvField>
        <FvField label={tr('ពណ៌','Color')}><input {...inp} value={color} onChange={e=>setColor(e.target.value)} placeholder="Pearl White"/></FvField>
      </div>

      {fvSecTitle(tr('ប្រភេទ','CLASS & SPECS'))}
      <div {...grid2}>
        <FvField label={tr('ថ្នាក់','Class')}>
          <select {...sel} value={clsVal} onChange={e=>setClsVal(e.target.value)}>
            {clsOptions.map(c => <option key={c}>{c}</option>)}
          </select>
        </FvField>
        <FvField label={tr('ប្រេង','Fuel type')}>
          <select {...sel} value={fuelType} onChange={e=>setFuelType(e.target.value)}>
            <option>Gasoline 95</option>
            <option>Gasoline 92</option>
            <option>Diesel</option>
            <option>Electric</option>
            <option>Hybrid</option>
          </select>
        </FvField>
        <FvField label={tr('លេខ​បន្ទាត់','Odometer (km)')}>
          <input {...inp} type="number" value={km} onChange={e=>setKm(e.target.value)} min="0"/>
        </FvField>
        <FvField label={tr('ប្រអប់​លេខ','Transmission')}>
          <select {...sel} value={trans} onChange={e=>setTrans(e.target.value)}>
            <option value="AT">Automatic (AT)</option>
            <option value="MT">Manual (MT)</option>
          </select>
        </FvField>
        <FvField label={tr('ប្រេង','Fuel level (%)')}>
          <input {...inp} type="number" value={fuel} onChange={e=>setFuel(e.target.value)} min="0" max="100"/>
        </FvField>
        <FvField label={tr('ស្ថានភាព','Status')}>
          <select {...sel} value={status} onChange={e=>setStatus(e.target.value)}>
            <option>Active</option>
            <option>Service due</option>
            <option>Workshop</option>
            <option>Idle</option>
          </select>
        </FvField>
      </div>

      {fvSecTitle(tr('ការ​ចាត់​ចែង','ASSIGNMENT'))}
      <div {...grid2}>
        <FvField label={tr('គ្រូ','Assigned instructor')}>
          <input {...inp} value={inst} onChange={e=>setInst(e.target.value)} placeholder="Mr. Vichea"/>
        </FvField>
        <FvField label={tr('មជ្ឈមណ្ឌល','Station')}>
          <input {...inp} value={station} onChange={e=>setStation(e.target.value)} placeholder="Phnom Penh"/>
        </FvField>
        <FvField label={tr('ថែទាំ​បន្ទាប់','Next service (km left)')}>
          <input {...inp} type="number" value={svc} onChange={e=>setSvc(e.target.value)} min="0"/>
        </FvField>
      </div>

      {fvSecTitle(tr('ឯកសារ','DOCUMENT EXPIRY'))}
      <div {...grid2}>
        <FvField label={tr('ឆៀក','Registration exp.')}>
          <input {...inp} type="date" value={regExp} onChange={e=>setRegExp(e.target.value)}/>
        </FvField>
        <FvField label={tr('ពន្ធផ្លូវ','Road tax exp.')}>
          <input {...inp} type="date" value={roadTax} onChange={e=>setRoadTax(e.target.value)}/>
        </FvField>
        <FvField label={tr('ធានា​រ៉ាប់រង','Insurance exp.')}>
          <input {...inp} type="date" value={insExp} onChange={e=>setInsExp(e.target.value)}/>
        </FvField>
        <FvField label={tr('ប្ដូប្រេងម៉ាស៊ីន','Next oil change')}>
          <input {...inp} type="date" value={oilExp} onChange={e=>setOilExp(e.target.value)}/>
        </FvField>
      </div>

      {fvSecTitle(tr('ការ​ចំណាយ','MONTHLY COSTS (optional)'))}
      <div {...grid2}>
        <FvField label={tr('ប្រេង','Fuel cost / mo ($)')}>
          <input {...inp} type="number" value={fuelMo} onChange={e=>setFuelMo(e.target.value)} min="0"/>
        </FvField>
        <FvField label={tr('ថែទាំ + ប្រេង','Total cost / mo ($)')}>
          <input {...inp} type="number" value={costMo} onChange={e=>setCostMo(e.target.value)} min="0"/>
        </FvField>
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8,paddingTop:12,borderTop:'1px solid var(--border)'}}>
        <Btn kind="ghost" size="md" onClick={onCancel}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="md" onClick={save}>{tr('រក្សា​ទុក','Save changes')}</Btn>
      </div>
    </Card>
  );
};

// ── Work order quick form ────────────────────────────────────────────────────
const FvWorkOrderForm = ({ vehicles, onClose, forceUpdate }) => {
  const { toast, tr } = useAppActions();
  const [vId,   setVId]   = React.useState(vehicles[0]?.id || '');
  const [type,  setType]  = React.useState('');
  const [cost,  setCost]  = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [stat,  setStat]  = React.useState('Pending');

  const save = () => {
    if (!type.trim()) { toast(tr('សូម​បញ្ចូល​ប្រភេទ​ការងារ','Enter work type'), 'warn'); return; }
    const now = new Date();
    const id  = 'WO-' + now.getFullYear() + '-' + String(window.__serviceLog.length + 1).padStart(3,'0');
    window.__serviceLog.unshift({
      id,
      v:     vId,
      date:  now.toISOString().slice(0,10),
      type:  type.trim(),
      cost:  parseFloat(cost) || 0,
      status: stat,
      notes: notes.trim(),
    });
    if (window.__notifyVehiclesChanged) window.__notifyVehiclesChanged();
    toast(tr('បាន​បន្ថែម​ការ​ងារ · ' + id, 'Work order added · ' + id), 'good');
    onClose();
  };

  const inp = { style:{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',
    borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'} };

  return (
    <Card>
      <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>
        ➕ {tr('បញ្ជា​ការ​ថែទាំ​ · New work order', 'New work order')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>យានយន្ត · Vehicle</div>
          <select {...inp} value={vId} onChange={e=>setVId(e.target.value)}>
            {vehicles.length === 0
              ? <option value="">— No vehicles —</option>
              : vehicles.map(v => <option key={v.id} value={v.id}>{v.make} · {v.plate}</option>)
            }
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ប្រភេទ​ការ​ងារ · Work type *</div>
          <input {...inp} value={type} onChange={e=>setType(e.target.value)} placeholder="Oil change, Brake pads…"/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>តម្លៃ · Cost ($)</div>
          <input {...inp} type="number" value={cost} onChange={e=>setCost(e.target.value)} min="0" placeholder="0"/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ស្ថានភាព · Status</div>
          <select {...inp} value={stat} onChange={e=>setStat(e.target.value)}>
            <option>Pending</option>
            <option>In progress</option>
            <option>Completed</option>
          </select>
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>កំណត់​ចំណាំ · Notes</div>
          <input {...inp} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Details…"/>
        </div>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" size="sm" onClick={onClose}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="sm" onClick={save}>{tr('រក្សា​ទុក','Save')}</Btn>
      </div>
    </Card>
  );
};

// ── Service tab ──────────────────────────────────────────────────────────────
const FvService = ({ vehicles, serviceLog, forceUpdate, addSvc, setAddSvc }) => {
  const { tr } = useAppActions();
  const updateStatus = (id, status) => {
    const i = window.__serviceLog.findIndex(s => s.id === id);
    if (i !== -1) window.__serviceLog[i].status = status;
    forceUpdate();
  };

  return (
    <div style={{padding:18,display:'flex',flexDirection:'column',gap:16}}>
      {addSvc && (
        <FvWorkOrderForm vehicles={vehicles} onClose={() => setAddSvc(false)} forceUpdate={forceUpdate}/>
      )}

      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <div style={{fontSize:14,fontWeight:600}}>ការ​ងារ · Work orders</div>
        <Badge tone="warn">{serviceLog.filter(s=>s.status==='Pending').length} pending</Badge>
        <Badge tone="accent">{serviceLog.filter(s=>s.status==='In progress').length} in progress</Badge>
        <div style={{flex:1}}/>
        <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}
          onClick={() => setAddSvc(true)}>
          {tr('បន្ថែម','Add')}
        </Btn>
      </div>

      {serviceLog.length === 0 ? (
        <div style={{padding:'40px 24px',textAlign:'center',color:'var(--ink-3)',border:'1px solid var(--border)',borderRadius:10}}>
          <div style={{fontSize:13}}>{tr('មិន​ទាន់​មាន​ការ​ងារ · No work orders yet','No work orders yet')}</div>
        </div>
      ) : (
        <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {serviceLog.map((s, i) => {
            const veh = vehicles.find(x => x.id === s.v);
            return (
              <div key={s.id} style={{padding:'12px 14px',borderTop:i?'1px solid var(--border)':'none',
                display:'grid',gridTemplateColumns:'100px 1fr 1fr 70px 110px 100px',gap:10,alignItems:'center'}}>
                <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{s.date}</div>
                <div style={{display:'flex',gap:8,alignItems:'center',minWidth:0}}>
                  <Photo tag={veh?.photo} w={36} h={24} r={4}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500}}>{veh?.make || s.v}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{veh?.plate || ''} · {s.id}</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{s.type}</div>
                  {s.notes && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{s.notes}</div>}
                </div>
                <div style={{fontSize:13,fontWeight:600,textAlign:'right'}}>${s.cost}</div>
                <Badge tone={s.status==='Completed'?'good':s.status==='Pending'?'warn':'accent'}>{s.status}</Badge>
                {s.status !== 'Completed' ? (
                  <Btn kind="ghost" size="sm"
                    onClick={() => updateStatus(s.id, s.status === 'Pending' ? 'In progress' : 'Completed')}>
                    {s.status === 'Pending' ? tr('ចាប់​ផ្ដើម','Start') : tr('បញ្ចប់','Complete')}
                  </Btn>
                ) : <div/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Documents tab ────────────────────────────────────────────────────────────
const FvDocs = ({ vehicles }) => {
  const { tr } = useAppActions();
  const types = [
    { k:'reg_exp',  l:'ការ​ចុះ​បញ្ជី',              en:'Registration'     },
    { k:'ins_exp',  l:'ការ​ធានា​រ៉ាប់​រង',           en:'Insurance'        },
    { k:'road_tax', l:'ពន្ធ​ផ្លូវ',                  en:'Road tax'         },
    { k:'oil_exp',  l:'ប្ដូ​ប្រេង​ម៉ាស៊ីន',          en:'Oil change'       },
  ];
  if (vehicles.length === 0) return (
    <div style={{padding:'48px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      {tr('មិន​ទាន់​មាន​យានយន្ត', 'No vehicles to show documents for')}
    </div>
  );
  return (
    <div style={{padding:18}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        {types.map(t => {
          const expiring = vehicles.filter(v => monthsUntil(v[t.k]) < 3).length;
          return (
            <Card key={t.k}>
              <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em'}}>{t.en.toUpperCase()}</div>
              <div style={{fontSize:13,marginTop:4,marginBottom:8}}>{t.l}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                <div style={{fontSize:28,fontWeight:600,fontFamily:'var(--font-display)',
                  color: expiring ? 'var(--warn)' : 'var(--good)'}}>{expiring}</div>
                <div style={{fontSize:12,color:'var(--ink-3)'}}>expiring ≤ 3 mo.</div>
              </div>
            </Card>
          );
        })}
      </div>
      <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.6fr 1.4fr 1.4fr 1.4fr',gap:14,
          fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',
          textTransform:'uppercase',background:'var(--surface-muted)'}}>
          <div>Vehicle</div><div>Registration</div><div>Insurance</div><div>Inspection</div>
        </div>
        {vehicles.map((v,i)=>(
          <div key={v.id} style={{padding:'10px 16px',display:'grid',
            gridTemplateColumns:'1.6fr 1.4fr 1.4fr 1.4fr',gap:14,
            alignItems:'center',borderTop:'1px solid var(--border)'}}>
            <div style={{display:'flex',gap:10,alignItems:'center',minWidth:0}}>
              <Photo tag={v.photo} w={48} h={30} r={4}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{v.make}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{v.plate}</div>
              </div>
            </div>
            {types.map(t => {
              const mo   = monthsUntil(v[t.k]);
              const tone = mo < 2 ? 'danger' : mo < 6 ? 'warn' : mo >= 99 ? 'neutral' : 'good';
              return (
                <div key={t.k} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:5,height:22,borderRadius:3,
                    background: tone==='good'?'var(--good)':tone==='warn'?'var(--warn)':tone==='danger'?'var(--danger)':'var(--border)'}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:500}}>{v[t.k] || '—'}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:1}}>
                      {mo >= 99 ? 'not set' : mo === 0 ? 'expired' : `${mo} mo. left`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Usage tab ────────────────────────────────────────────────────────────────
const FvUsage = ({ vehicles }) => {
  if (vehicles.length === 0) return (
    <div style={{padding:'48px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      No vehicles to show usage for
    </div>
  );
  const sorted = [...vehicles].sort((a, b) => (b.lessons_mo||0) - (a.lessons_mo||0));
  const maxLessons = Math.max(...vehicles.map(v => v.lessons_mo||0), 1);
  return (
    <div style={{padding:18,display:'flex',flexDirection:'column',gap:14}}>
      <Card label="ការ​ប្រើ​ប្រាស់​ · MONTHLY LESSONS BY VEHICLE">
        {sorted.map((v, i) => (
          <div key={v.id} style={{display:'flex',alignItems:'center',gap:12,padding:'6px 0',
            borderTop:i?'1px dashed var(--border)':'none'}}>
            <Photo tag={v.photo} w={44} h={28} r={4}/>
            <div style={{width:140,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.make}</div>
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{v.plate}</div>
            </div>
            <div style={{flex:1,height:12,background:'var(--surface-muted)',borderRadius:6,overflow:'hidden'}}>
              <div style={{width:`${((v.lessons_mo||0)/maxLessons)*100}%`,height:'100%',background:'var(--accent)',borderRadius:6}}/>
            </div>
            <div style={{fontSize:13,fontWeight:600,width:30,textAlign:'right'}}>{v.lessons_mo||0}</div>
          </div>
        ))}
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card label="ប្រភេទ​ · UTILIZATION BY CLASS">
          {['A','B','C'].map(c => {
            const sub   = vehicles.filter(v => v.cls.startsWith(c));
            const total = sub.reduce((s,v) => s+(v.lessons_mo||0), 0);
            return sub.length > 0 ? (
              <BarRow key={c}
                label={`Class ${c} · ${sub.length} vehicle${sub.length>1?'s':''}`}
                value={total} max={Math.max(...['A','B','C'].map(x=>vehicles.filter(v=>v.cls.startsWith(x)).reduce((s,v)=>s+(v.lessons_mo||0),0)),1)}
                sub={`${total} lessons`}
              />
            ) : null;
          })}
        </Card>
        <Card label="ការ​ចំណាយ · COSTS BY VEHICLE">
          {sorted.slice(0,6).map((v,i) => (
            <div key={v.id} style={{display:'flex',justifyContent:'space-between',
              alignItems:'center',padding:'5px 0',borderTop:i?'1px dashed var(--border)':'none',fontSize:12}}>
              <span style={{color:'var(--ink-2)'}}>{v.make} <span style={{color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',fontSize:10}}>{v.plate}</span></span>
              <span style={{fontWeight:600}}>${v.cost_mo||0}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── Incidents tab ────────────────────────────────────────────────────────────
const FvIncidents = ({ vehicles, incidents, forceUpdate }) => {
  const { tr } = useAppActions();
  const [adding, setAdding] = React.useState(false);

  const updateStatus = (id, status) => {
    const i = window.__incidentData.findIndex(x => x.id === id);
    if (i !== -1) window.__incidentData[i].status = status;
    forceUpdate();
  };

  return (
    <div style={{padding:18,display:'flex',flexDirection:'column',gap:14}}>
      {adding && (
        <FvIncidentForm vehicles={vehicles} onClose={() => setAdding(false)} forceUpdate={forceUpdate}/>
      )}
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{fontSize:14,fontWeight:600}}>ឧប្បត្តិហេតុ · Incidents</div>
        <Badge tone="neutral">{incidents.length} total</Badge>
        <div style={{flex:1}}/>
        <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}
          onClick={() => setAdding(true)}>
          {tr('រាយ​ការណ៍','Report')}
        </Btn>
      </div>

      {incidents.length === 0 ? (
        <div style={{padding:'48px',textAlign:'center',color:'var(--ink-3)',
          border:'1px solid var(--border)',borderRadius:10}}>
          <div style={{fontSize:13,color:'var(--good)',fontWeight:500}}>
            ✓ {tr('គ្មាន​ឧប្បត្តិហេតុ · No incidents recorded','No incidents recorded')}
          </div>
        </div>
      ) : (
        <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          {incidents.map((inc, i) => {
            const veh = vehicles.find(x => x.id === inc.v);
            return (
              <div key={inc.id} style={{padding:'14px 16px',borderTop:i?'1px solid var(--border)':'none',
                display:'grid',gridTemplateColumns:'100px 1fr 70px 100px',gap:12,alignItems:'center'}}>
                <div>
                  <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{inc.date}</div>
                  <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2,fontFamily:'"JetBrains Mono",monospace'}}>{inc.id}</div>
                </div>
                <div style={{display:'flex',gap:10,alignItems:'flex-start',minWidth:0}}>
                  <Photo tag={veh?.photo} w={44} h={28} r={4}/>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <div style={{fontSize:13,fontWeight:600}}>{inc.type}</div>
                      <Badge tone={inc.severity==='High'?'danger':inc.severity==='Medium'?'warn':'neutral'}>{inc.severity}</Badge>
                    </div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
                      {veh ? `${veh.make} ${veh.plate}` : inc.v} · {inc.driver || '—'}
                    </div>
                    {inc.desc && <div style={{fontSize:11,color:'var(--ink-2)',marginTop:3}}>{inc.desc}</div>}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:14,fontWeight:600}}>${inc.cost || 0}</div>
                </div>
                <div>
                  <Badge tone={inc.status==='Resolved'?'good':inc.status==='Open'?'warn':'neutral'}>{inc.status}</Badge>
                  {inc.status !== 'Resolved' && (
                    <div style={{marginTop:6}}>
                      <Btn kind="ghost" size="sm" onClick={() => updateStatus(inc.id, 'Resolved')}>
                        {tr('ដោះ​ស្រាយ','Resolve')}
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Incident report form ─────────────────────────────────────────────────────
const FvIncidentForm = ({ vehicles, onClose, forceUpdate }) => {
  const { toast, tr } = useAppActions();
  const [vId,      setVId]      = React.useState(vehicles[0]?.id || '');
  const [date,     setDate]     = React.useState(new Date().toISOString().slice(0,10));
  const [type,     setType]     = React.useState('');
  const [severity, setSeverity] = React.useState('Low');
  const [driver,   setDriver]   = React.useState('');
  const [cost,     setCost]     = React.useState('');
  const [desc,     setDesc]     = React.useState('');

  const save = () => {
    if (!type.trim()) { toast(tr('សូម​បញ្ចូល​ប្រភេទ​ · Enter incident type', 'Enter incident type'), 'warn'); return; }
    const id = 'IC-' + String(window.__incidentData.length + 1).padStart(3,'0');
    window.__incidentData.unshift({
      id, v: vId, date, type: type.trim(),
      severity, driver: driver.trim() || '—',
      cost: parseFloat(cost) || 0,
      status: 'Open',
      desc: desc.trim(),
    });
    if (window.__notifyVehiclesChanged) window.__notifyVehiclesChanged();
    toast(tr('បាន​រាយ​ការណ៍ · ' + id, 'Incident reported · ' + id), 'warn');
    onClose();
  };

  const inp = { style:{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',
    borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'} };

  return (
    <Card>
      <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>
        ⚠️ {tr('រាយ​ការណ៍​ឧប្បត្តិហេតុ · Report incident','Report incident')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>យានយន្ត · Vehicle</div>
          <select {...inp} value={vId} onChange={e=>setVId(e.target.value)}>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} · {v.plate}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ថ្ងៃ​ · Date</div>
          <input {...inp} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ប្រភេទ · Type *</div>
          <input {...inp} value={type} onChange={e=>setType(e.target.value)} placeholder="Minor scrape, Flat tire…"/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>កម្រិត · Severity</div>
          <select {...inp} value={severity} onChange={e=>setSeverity(e.target.value)}>
            <option>None</option><option>Very low</option><option>Low</option>
            <option>Medium</option><option>High</option>
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>អ្នក​បើក · Driver</div>
          <input {...inp} value={driver} onChange={e=>setDriver(e.target.value)} placeholder="Mr. Vichea or Student ID"/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>តម្លៃ​ជួស​ជុល · Repair cost ($)</div>
          <input {...inp} type="number" value={cost} onChange={e=>setCost(e.target.value)} min="0" placeholder="0"/>
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ការ​ពិពណ៌នា · Description</div>
          <input {...inp} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What happened…"/>
        </div>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" size="sm" onClick={onClose}>{tr('បោះ​បង់','Cancel')}</Btn>
        <Btn kind="primary" size="sm" onClick={save}>{tr('រាយ​ការណ៍','Submit report')}</Btn>
      </div>
    </Card>
  );
};

// ── Expense categories ────────────────────────────────────────────────────────
const EXP_CATS = [
  { v:'fuel',         km:'ប្រេង',        en:'Fuel',         icon:'⛽', tone:'accent'  },
  { v:'maintenance',  km:'ថែទាំ',        en:'Maintenance',  icon:'🔧', tone:'warn'    },
  { v:'insurance',    km:'ធានារ៉ាប់រង',  en:'Insurance',    icon:'🛡️', tone:'good'    },
  { v:'registration', km:'ចុះបញ្ជី',     en:'Registration', icon:'📋', tone:'neutral' },
  { v:'other',        km:'ផ្សេងៗ',       en:'Other',        icon:'📦', tone:'neutral' },
];

// ── Add Expense inline form ───────────────────────────────────────────────────
const FvExpenseForm = ({ vehicles, onClose, forceUpdate }) => {
  const { toast, tr } = useAppActions();
  const [vId,    setVId]    = React.useState(vehicles[0]?.id || '');
  const [date,   setDate]   = React.useState(new Date().toISOString().slice(0,10));
  const [cat,    setCat]    = React.useState('fuel');
  const [amount, setAmount] = React.useState('');
  const [litres, setLitres] = React.useState('');
  const [notes,  setNotes]  = React.useState('');

  const recomputeVehicleCosts = (vId, month) => {
    const v = VEHICLES.find(x => x.id === vId);
    if (!v) return;
    const vExp = (window.__expenseLog||[]).filter(e => e.vId === vId && e.date.startsWith(month));
    v.cost_mo = Math.round(vExp.reduce((s,e) => s+(e.amount||0), 0)*100)/100;
    v.fuel_mo = Math.round(vExp.filter(e=>e.cat==='fuel').reduce((s,e)=>s+(e.amount||0), 0)*100)/100;
  };

  const save = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast(tr('សូមបញ្ចូលចំនួនទឹកប្រាក់','Enter amount'), 'warn'); return; }
    if (!window.__expenseLog) window.__expenseLog = [];
    const nums = window.__expenseLog.map(e => parseInt((e.id||'').replace(/\D/g,''))).filter(n=>!isNaN(n)&&n>0);
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    const id = 'EX-' + String(next).padStart(3,'0');
    window.__expenseLog.unshift({
      id, vId, date, cat,
      amount: amt,
      litres: cat==='fuel' && litres ? parseFloat(litres)||null : null,
      notes: notes.trim(),
    });
    recomputeVehicleCosts(vId, date.slice(0,7));
    if (window.saveAllData) window.saveAllData();
    if (window.__notifyVehiclesChanged) window.__notifyVehiclesChanged();
    toast(tr('បានបន្ថែម · '+id, 'Added · '+id), 'good');
    onClose();
  };

  const inp = {style:{width:'100%',padding:'7px 10px',border:'1px solid var(--border)',
    borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',
    color:'var(--ink)',boxSizing:'border-box'}};

  return (
    <Card>
      <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>
        ➕ {tr('បន្ថែម​ការ​ចំណាយ','Add expense')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>យានយន្ត · Vehicle</div>
          <select {...inp} value={vId} onChange={e=>setVId(e.target.value)}>
            {vehicles.length===0
              ? <option value="">— No vehicles —</option>
              : vehicles.map(v=><option key={v.id} value={v.id}>{v.make} · {v.plate}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ថ្ងៃ · Date</div>
          <input {...inp} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ប្រភេទ · Category</div>
          <select {...inp} value={cat} onChange={e=>setCat(e.target.value)}>
            {EXP_CATS.map(c=><option key={c.v} value={c.v}>{c.icon} {c.km} · {c.en}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>ចំនួន ($) *</div>
          <input {...inp} type="number" min="0" step="0.01" value={amount}
            onChange={e=>setAmount(e.target.value)} placeholder="0.00"/>
        </div>
        {cat === 'fuel' && (
          <div>
            <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>លីត្រ · Litres</div>
            <input {...inp} type="number" min="0" step="0.1" value={litres}
              onChange={e=>setLitres(e.target.value)} placeholder="40"/>
          </div>
        )}
        <div style={{gridColumn:cat==='fuel'?'':'2 / -1'}}>
          <div style={{fontSize:11,fontWeight:500,marginBottom:4}}>កំណត់ចំណាំ · Notes</div>
          <input {...inp} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Details…"/>
        </div>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" size="sm" onClick={onClose}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="sm" onClick={save}>{tr('រក្សាទុក','Save')}</Btn>
      </div>
    </Card>
  );
};

// ── Expenses tab ──────────────────────────────────────────────────────────────
const FvExpenses = ({ vehicles, expenseLog, forceUpdate }) => {
  const { toast, tr } = useAppActions();
  const [adding,    setAdding]    = React.useState(false);
  const [filterV,   setFilterV]   = React.useState('all');
  const [filterCat, setFilterCat] = React.useState('all');
  const [filterMo,  setFilterMo]  = React.useState(new Date().toISOString().slice(0,7));

  const deleteExpense = (id) => {
    const i = (window.__expenseLog||[]).findIndex(e=>e.id===id);
    if (i !== -1) {
      const ex = window.__expenseLog[i];
      window.__expenseLog.splice(i,1);
      const v = VEHICLES.find(x=>x.id===ex.vId);
      if (v) {
        const mo = ex.date.slice(0,7);
        const vExp = window.__expenseLog.filter(e=>e.vId===ex.vId&&e.date.startsWith(mo));
        v.cost_mo = Math.round(vExp.reduce((s,e)=>s+(e.amount||0),0)*100)/100;
        v.fuel_mo = Math.round(vExp.filter(e=>e.cat==='fuel').reduce((s,e)=>s+(e.amount||0),0)*100)/100;
      }
    }
    if (window.saveAllData) window.saveAllData();
    if (window.__notifyVehiclesChanged) window.__notifyVehiclesChanged();
    toast(tr('បានលុប','Removed'), 'neutral');
  };

  const moExp      = expenseLog.filter(e=>e.date.startsWith(filterMo));
  const totalMTD   = moExp.reduce((s,e)=>s+(e.amount||0), 0);
  const catTotals  = Object.fromEntries(EXP_CATS.map(c=>[c.v, moExp.filter(e=>e.cat===c.v).reduce((s,e)=>s+(e.amount||0),0)]));

  const filtered = expenseLog.filter(e=>
    e.date.startsWith(filterMo) &&
    (filterV   === 'all' || e.vId === filterV) &&
    (filterCat === 'all' || e.cat === filterCat)
  );

  const fmtAmt = (n) => '$'+(n||0).toFixed(2).replace(/\.00$/,'');
  const catOf  = (v) => EXP_CATS.find(c=>c.v===v) || EXP_CATS[4];
  const vehOf  = (id) => vehicles.find(v=>v.id===id);

  return (
    <div style={{padding:18,display:'flex',flexDirection:'column',gap:16}}>

      {/* Monthly KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'1.5fr repeat(4,1fr)',gap:10}}>
        <Card>
          <div style={{fontSize:10,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em',
            textTransform:'uppercase',color:'var(--ink-3)',marginBottom:6}}>ចំណាយ​សរុប · TOTAL</div>
          <div style={{fontSize:30,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.02em'}}>{fmtAmt(totalMTD)}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>
            {moExp.length} {tr('ធាតុ','entries')} · {filterMo}
          </div>
        </Card>
        {EXP_CATS.slice(0,4).map(c=>(
          <Card key={c.v} style={{opacity:catTotals[c.v]===0?0.5:1}}>
            <div style={{fontSize:18,marginBottom:4}}>{c.icon}</div>
            <div style={{fontSize:10,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',
              textTransform:'uppercase',color:'var(--ink-3)',marginBottom:4}}>{c.en}</div>
            <div style={{fontSize:20,fontWeight:600,fontFamily:'var(--font-display)'}}>{fmtAmt(catTotals[c.v])}</div>
          </Card>
        ))}
      </div>

      {/* Filter + Add button */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <input type="month" value={filterMo} onChange={e=>setFilterMo(e.target.value)}
          style={{padding:'5px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,
            background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit'}}/>
        <select value={filterV} onChange={e=>setFilterV(e.target.value)}
          style={{padding:'5px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,
            background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit'}}>
          <option value="all">{tr('រថយន្ត​ទាំងអស់','All vehicles')}</option>
          {vehicles.map(v=><option key={v.id} value={v.id}>{v.make} · {v.plate}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
          style={{padding:'5px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,
            background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit'}}>
          <option value="all">{tr('ប្រភេទ​ទាំងអស់','All categories')}</option>
          {EXP_CATS.map(c=><option key={c.v} value={c.v}>{c.icon} {c.km} · {c.en}</option>)}
        </select>
        <div style={{flex:1}}/>
        <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}
          onClick={()=>setAdding(v=>!v)}>
          {tr('បន្ថែម​ការ​ចំណាយ','Add expense')}
        </Btn>
      </div>

      {adding && (
        <FvExpenseForm vehicles={vehicles} onClose={()=>setAdding(false)} forceUpdate={forceUpdate}/>
      )}

      {/* Per-vehicle summary cards (only when showing all vehicles) */}
      {filterV==='all' && filtered.length>0 && (() => {
        const vIds = [...new Set(filtered.map(e=>e.vId))];
        return (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
            {vIds.map(vid=>{
              const veh   = vehOf(vid);
              const vExp  = filtered.filter(e=>e.vId===vid);
              const vTotal= vExp.reduce((s,e)=>s+(e.amount||0),0);
              return (
                <Card key={vid} pad={12}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                    {veh && <Photo tag={veh.photo} w={44} h={28} r={4}/>}
                    <div>
                      <div style={{fontSize:12,fontWeight:600}}>{veh?.make || vid}</div>
                      <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{veh?.plate||''}</div>
                    </div>
                  </div>
                  <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--font-display)',marginBottom:6}}>{fmtAmt(vTotal)}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {EXP_CATS.map(c=>{
                      const a=vExp.filter(e=>e.cat===c.v).reduce((s,e)=>s+(e.amount||0),0);
                      return a>0 ? <Badge key={c.v} tone="neutral" size="sm">{c.icon} {fmtAmt(a)}</Badge> : null;
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })()}

      {/* Expense list */}
      {filtered.length===0 ? (
        <div style={{padding:'48px',textAlign:'center',color:'var(--ink-3)',
          border:'1px solid var(--border)',borderRadius:10}}>
          <div style={{fontSize:13}}>{tr('មិន​ទាន់​មាន​ការ​ចំណាយ','No expenses recorded')}</div>
          <div style={{marginTop:12}}>
            <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}
              onClick={()=>setAdding(true)}>{tr('បន្ថែម​ការ​ចំណាយ','Add expense')}</Btn>
          </div>
        </div>
      ) : (
        <div style={{overflowX:'auto'}}>
        <div style={{minWidth:560,border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
          <div style={{padding:'8px 14px',display:'grid',
            gridTemplateColumns:'90px 1fr 130px 80px 60px 1fr 36px',gap:10,
            fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',
            fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',
            background:'var(--surface-muted)',borderBottom:'1px solid var(--border)'}}>
            <div>ថ្ងៃ</div><div>យានយន្ត</div><div>ប្រភេទ</div>
            <div style={{textAlign:'right'}}>ចំនួន</div>
            <div style={{textAlign:'right'}}>លីត្រ</div>
            <div>កំណត់ចំណាំ</div><div/>
          </div>
          {filtered.map((e,i)=>{
            const c  = catOf(e.cat);
            const veh= vehOf(e.vId);
            return (
              <div key={e.id} style={{padding:'10px 14px',display:'grid',
                gridTemplateColumns:'90px 1fr 130px 80px 60px 1fr 36px',gap:10,
                alignItems:'center',borderTop:i?'1px solid var(--border)':'none'}}>
                <div>
                  <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)'}}>{e.date}</div>
                  <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginTop:1,opacity:.6}}>{e.id}</div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',minWidth:0}}>
                  {veh && <Photo tag={veh.photo} w={36} h={22} r={3}/>}
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{veh?.make||e.vId}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{veh?.plate||''}</div>
                  </div>
                </div>
                <div><Badge tone={c.tone} size="sm">{c.icon} {c.km}</Badge></div>
                <div style={{fontSize:13,fontWeight:600,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{fmtAmt(e.amount)}</div>
                <div style={{fontSize:12,color:'var(--ink-3)',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
                  {e.litres ? e.litres+'L' : '—'}
                </div>
                <div style={{fontSize:11,color:'var(--ink-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {e.notes||'—'}
                </div>
                <button onClick={()=>deleteExpense(e.id)} style={{
                  width:28,height:28,border:'none',background:'transparent',
                  color:'var(--ink-3)',cursor:'pointer',borderRadius:4,
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}
                  onMouseEnter={ev=>ev.currentTarget.style.color='var(--danger)'}
                  onMouseLeave={ev=>ev.currentTarget.style.color='var(--ink-3)'}
                ><Icon name="trash" size={13}/></button>
              </div>
            );
          })}
          {/* Footer total */}
          <div style={{padding:'10px 14px',display:'grid',
            gridTemplateColumns:'90px 1fr 130px 80px 60px 1fr 36px',gap:10,
            alignItems:'center',borderTop:'2px solid var(--border)',
            background:'var(--surface-muted)'}}>
            <div style={{gridColumn:'1/4',fontSize:11,fontWeight:600,color:'var(--ink-2)'}}>
              {tr('សរុប','Total')} · {filtered.length} {tr('ធាតុ','entries')}
            </div>
            <div style={{fontSize:14,fontWeight:700,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
              {fmtAmt(filtered.reduce((s,e)=>s+(e.amount||0),0))}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

const FleetScreen = FleetScreenV2;

// ── Public vehicle card view ──────────────────────────────────────────────────
const VehicleScreen = () => {
  const { tr } = useAppActions();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [selectedId, setSelectedId] = React.useState(null);
  React.useEffect(() => {
    const prev = window.__notifyVehiclesChanged;
    window.__notifyVehiclesChanged = () => forceUpdate();
    return () => { window.__notifyVehiclesChanged = prev; };
  }, []);

  const visible = VEHICLES.filter(v => v.visible !== false);

  const noop = () => {};
  const saveDates = (id, dates) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i !== -1) Object.assign(VEHICLES[i], dates);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };
  const savePhoto = (id, dataUrl) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i !== -1) { VEHICLES[i].photo = dataUrl; if (window.saveAllData) window.saveAllData(); forceUpdate(); }
  };
  const cycleStatus = (id) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i === -1) return;
    const cur = VEHICLES[i].status || 'Active';
    const next = FLEET_STATUS_OPTS[(FLEET_STATUS_OPTS.indexOf(cur) + 1) % FLEET_STATUS_OPTS.length];
    VEHICLES[i].status = next;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };
  const cycleParking = (id) => {
    const i = VEHICLES.findIndex(v => v.id === id);
    if (i === -1) return;
    const cur = VEHICLES[i].parking || 'school';
    const next = PARKING_OPTS[(PARKING_OPTS.indexOf(cur) + 1) % PARKING_OPTS.length];
    VEHICLES[i].parking = next;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km={`យានយន្ត · ${visible.length} គ្រឿង`}
        en={`Vehicles · ${visible.length} available`}
      />
      {visible.length === 0 ? (
        <Card pad={48} style={{textAlign:'center',color:'var(--ink-3)'}}>
          <div style={{fontSize:32,marginBottom:10}}>🚗</div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--ink)',marginBottom:4}}>
            {tr('មិន​ទាន់​មាន​យានយន្ត', 'No vehicles to display')}
          </div>
          <div style={{fontSize:12}}>
            {tr('ធ្វើ​ឲ្យ​យានយន្ត​មើលឃើញ​នៅ​ Vehicle management', 'Toggle vehicles visible in Vehicle management')}
          </div>
        </Card>
      ) : (
        <FvCards
          vehicles={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onStatusChange={cycleStatus}
          onSaveDates={saveDates}
          onParkingChange={cycleParking}
        />
      )}
    </div>
  );
};

Object.assign(window, { FleetScreenV2, FleetScreen, VehicleScreen });
