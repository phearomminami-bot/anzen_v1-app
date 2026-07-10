// ── Inventory / Stock management ─────────────────────────────────────────────
// Books, student jackets, lesson materials, and any other stock. Each item keeps
// a movement log (stock in / out / orders) so every change carries a date, a
// quantity, a party (supplier or recipient) and a note. Data lives inside the
// cloud-synced settings blob (window.__schoolSettings.inventory) so it persists
// and is shared across devices; every mutation calls saveAllData().

const INV_CATS = [
  { k:'book',     km:'សៀវភៅ',          en:'Books',            color:'#2A5DB0' },
  { k:'jacket',   km:'អាវសិស្ស',        en:'Student jackets',  color:'#B0413E' },
  { k:'material', km:'មេរៀនចែកសិស្ស',   en:'Lesson materials', color:'#12A302' },
  { k:'other',    km:'ផ្សេងៗ',          en:'Other',            color:'#7A45C9' },
];
// Custom categories the school added, kept in the synced settings blob.
const invCustomCats = () => ((window.__schoolSettings && window.__schoolSettings.inventoryCats) || []);
const invAllCats    = () => [...INV_CATS, ...invCustomCats()];
const invCatOf      = (k) => invAllCats().find(c => c.k === k) || INV_CATS[3];
const INV_CAT_PALETTE = ['#0E7C8B','#C6612E','#7A45C9','#B0413E','#2A5DB0','#12873F','#C98A12','#8E44AD','#16A085'];
const invAddCat = (name) => {
  const nm = (name||'').trim(); if (!nm) return null;
  if (!window.__schoolSettings) window.__schoolSettings = {};
  const cur = window.__schoolSettings.inventoryCats || [];
  const existing = invAllCats().find(c => (c.km===nm || c.en===nm));
  if (existing) return existing.k;
  const cat = { k:'cat'+Date.now().toString(36)+Math.random().toString(36).slice(2,5), km:nm, en:nm, color: INV_CAT_PALETTE[cur.length % INV_CAT_PALETTE.length], custom:true };
  window.__schoolSettings.inventoryCats = [...cur, cat];
  if (window.saveAllData) window.saveAllData();
  return cat.k;
};
const invList    = () => ((window.__schoolSettings && window.__schoolSettings.inventory) || []);
const invPersist = (list) => {
  if (!window.__schoolSettings) window.__schoolSettings = {};
  window.__schoolSettings.inventory = list;
  if (window.saveAllData) window.saveAllData();
};
const invUid   = () => 'INV' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// Current on-hand stock = stock-in + received orders − stock-out.
const invStock = (it) => (it.moves || []).reduce((a, m) =>
  a + (m.type === 'in' ? m.qty : (m.type === 'order' && m.received) ? m.qty : m.type === 'out' ? -m.qty : 0), 0);
const invOnOrder = (it) => (it.moves || []).filter(m => m.type === 'order' && !m.received).reduce((a, m) => a + m.qty, 0);
const invKhr = (n) => n ? Number(n).toLocaleString('en-US') + '៛' : '';

// ── Add / edit item form ─────────────────────────────────────────────────────
const StockItemForm = ({ item, onSave, onCancel, tr }) => {
  const editing = !!(item && item.id);
  const [name,     setName]     = React.useState(item?.name || '');
  const [category, setCategory] = React.useState(item?.category || 'book');
  const [unit,     setUnit]     = React.useState(item?.unit || '');
  const [price,    setPrice]    = React.useState(item?.price != null ? String(item.price) : '');
  const [priceKHR, setPriceKHR] = React.useState(item?.priceKHR != null ? String(item.priceKHR) : '');
  const [supplier, setSupplier] = React.useState(item?.supplier || '');
  const [minStock, setMinStock] = React.useState(item?.minStock != null ? String(item.minStock) : '');
  const [notes,    setNotes]    = React.useState(item?.notes || '');
  const [initQty,  setInitQty]  = React.useState('');   // opening stock (new items only)
  const [addingCat, setAddingCat] = React.useState(false);
  const [newCat,     setNewCat]   = React.useState('');
  const [, forceCat] = React.useReducer(n=>n+1, 0);   // re-render after adding a category

  const fld = { width:'100%', padding:'10px 12px', border:'1px solid var(--border)', borderRadius:9, fontSize:14,
    fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:600, color:'var(--ink-3)', margin:'0 0 4px' };

  const save = () => {
    if (!name.trim()) return;
    const base = editing ? { ...item } : { id: invUid(), moves: [], createdAt: (typeof todayStr==='function'?todayStr():'') };
    base.name = name.trim();
    base.category = category;
    base.unit = unit.trim();
    base.price = parseFloat(price) || 0;
    base.priceKHR = parseInt(String(priceKHR).replace(/[^\d]/g,'')) || 0;
    base.supplier = supplier.trim();
    base.minStock = parseInt(minStock) || 0;
    base.notes = notes.trim();
    if (!editing && (parseInt(initQty) || 0) > 0) {
      base.moves = [{ id: invUid(), type:'in', qty: parseInt(initQty), date: (typeof todayStr==='function'?todayStr():''),
        party: supplier.trim(), note: tr('ស្តុក​ដើម','Opening stock') }];
    }
    onSave(base);
  };

  return (
    <div style={{ padding:'6px 16px 16px', display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-km)' }}>
        {editing ? tr('កែ​ទំនិញ','Edit item') : tr('បន្ថែម​ទំនិញ​ថ្មី','New item')}
      </div>
      <div>
        <div style={lbl}>{tr('ឈ្មោះ​ទំនិញ *','Item name *')}</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={fld} placeholder={tr('ឧ. សៀវភៅ​ច្បាប់​ចរាចរណ៍','e.g. Traffic law book')}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={lbl}>{tr('ប្រភេទ','Category')}</div>
          <select value={category} onChange={e=>{ if (e.target.value==='__add') { setAddingCat(true); } else setCategory(e.target.value); }} style={fld}>
            {invAllCats().map(c => <option key={c.k} value={c.k}>{tr(c.km, c.en)}</option>)}
            <option value="__add">➕ {tr('បន្ថែម​ប្រភេទ​ថ្មី...','Add category...')}</option>
          </select>
          {addingCat && (
            <div style={{ display:'flex', gap:6, marginTop:6 }}>
              <input value={newCat} onChange={e=>setNewCat(e.target.value)} autoFocus placeholder={tr('ឈ្មោះ​ប្រភេទ​ថ្មី','New category name')}
                onKeyDown={e=>{ if(e.key==='Enter'){ const k=invAddCat(newCat); if(k){ setCategory(k); setNewCat(''); setAddingCat(false); forceCat(); } } }}
                style={{ ...fld, padding:'8px 10px', fontSize:13 }}/>
              <button type="button" onClick={()=>{ const k=invAddCat(newCat); if(k){ setCategory(k); setNewCat(''); setAddingCat(false); forceCat(); } }}
                style={{ border:'none', background:'var(--accent)', color:'#fff', borderRadius:8, padding:'0 12px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>{tr('បន្ថែម','Add')}</button>
              <button type="button" onClick={()=>{ setAddingCat(false); setNewCat(''); }} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-3)', borderRadius:8, padding:'0 10px', fontSize:13, cursor:'pointer', flexShrink:0 }}>✕</button>
            </div>
          )}
        </div>
        <div>
          <div style={lbl}>{tr('ឯកតា','Unit')}</div>
          <input value={unit} onChange={e=>setUnit(e.target.value)} style={fld} placeholder={tr('ក្បាល / សន្លឹក','pcs')}/>
        </div>
        <div>
          <div style={lbl}>{tr('តម្លៃ ($)','Price ($)')}</div>
          <input value={price} onChange={e=>setPrice(e.target.value)} style={fld} inputMode="decimal" placeholder="0.00"/>
        </div>
        <div>
          <div style={lbl}>{tr('តម្លៃ (៛)','Price (៛)')}</div>
          <input value={priceKHR} onChange={e=>setPriceKHR(e.target.value)} style={fld} inputMode="numeric" placeholder="0"/>
        </div>
        <div>
          <div style={lbl}>{tr('ស្តុក​អប្បបរមា','Low-stock alert')}</div>
          <input value={minStock} onChange={e=>setMinStock(e.target.value)} style={fld} inputMode="numeric" placeholder="0"/>
        </div>
      </div>
      <div>
        <div style={lbl}>{tr('អ្នក​ចែកចាយ / អ្នក​ផ្គត់ផ្គង់','Distributor / Supplier')}</div>
        <input value={supplier} onChange={e=>setSupplier(e.target.value)} style={fld} placeholder={tr('ឈ្មោះ​អ្នក​ចែកចាយ','Supplier name')}/>
      </div>
      {!editing && (
        <div>
          <div style={lbl}>{tr('ស្តុក​ដើម (ចំនួន)','Opening stock (qty)')}</div>
          <input value={initQty} onChange={e=>setInitQty(e.target.value)} style={fld} inputMode="numeric" placeholder="0"/>
        </div>
      )}
      <div>
        <div style={lbl}>{tr('ចំណាំ','Notes')}</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} style={{ ...fld, resize:'vertical' }} placeholder={tr('ព័ត៌មាន​បន្ថែម...','Extra details...')}/>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:2 }}>
        <button onClick={onCancel} style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--ink-2)', cursor:'pointer', fontSize:14, fontWeight:600 }}>{tr('បោះបង់','Cancel')}</button>
        <button onClick={save} disabled={!name.trim()} style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background: name.trim()?'var(--accent)':'var(--border-strong)', color:'#fff', cursor: name.trim()?'pointer':'not-allowed', fontSize:14, fontWeight:700 }}>{editing ? tr('រក្សាទុក','Save') : tr('បន្ថែម','Add item')}</button>
      </div>
    </div>
  );
};

// ── Stock-movement form (in / out / order) ───────────────────────────────────
const StockMoveForm = ({ item, type, onSave, onCancel, tr }) => {
  const [qty,   setQty]   = React.useState('');
  const [date,  setDate]  = React.useState(typeof todayStr==='function' ? todayStr() : '');
  const [party, setParty] = React.useState(type === 'out' ? '' : (item.supplier || ''));
  const [note,  setNote]  = React.useState('');
  const meta = {
    in:    { km:'ដាក់​ចូល​ស្តុក',  en:'Stock in',    color:'#12873f', party: tr('អ្នក​ផ្គត់ផ្គង់','Supplier') },
    out:   { km:'ដក​ចេញ​ស្តុក',   en:'Stock out',   color:'#B0413E', party: tr('អ្នក​ទទួល','Recipient') },
    order: { km:'ដាក់​កម្មង់',     en:'Place order', color:'#C98A12', party: tr('អ្នក​ចែកចាយ','Supplier') },
  }[type];
  const fld = { width:'100%', padding:'10px 12px', border:'1px solid var(--border)', borderRadius:9, fontSize:14, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:600, color:'var(--ink-3)', margin:'0 0 4px' };
  const save = () => {
    const n = parseInt(qty);
    if (!n || n <= 0) return;
    onSave({ id: invUid(), type, qty: n, date, party: party.trim(), note: note.trim(), received: type==='order' ? false : undefined });
  };
  return (
    <div style={{ padding:'6px 16px 16px', display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-km)', color:meta.color }}>{tr(meta.km, meta.en)} · {item.name}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={lbl}>{tr('ចំនួន *','Quantity *')}</div>
          <input value={qty} onChange={e=>setQty(e.target.value)} style={fld} inputMode="numeric" placeholder="0" autoFocus/>
        </div>
        <div>
          <div style={lbl}>{tr('ថ្ងៃ','Date')}</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={fld}/>
        </div>
      </div>
      <div>
        <div style={lbl}>{meta.party}</div>
        <input value={party} onChange={e=>setParty(e.target.value)} style={fld} placeholder={meta.party}/>
      </div>
      <div>
        <div style={lbl}>{tr('ចំណាំ','Note')}</div>
        <input value={note} onChange={e=>setNote(e.target.value)} style={fld} placeholder={tr('ចំណាំ...','Note...')}/>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:2 }}>
        <button onClick={onCancel} style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--ink-2)', cursor:'pointer', fontSize:14, fontWeight:600 }}>{tr('បោះបង់','Cancel')}</button>
        <button onClick={save} disabled={!(parseInt(qty)>0)} style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:(parseInt(qty)>0)?meta.color:'var(--border-strong)', color:'#fff', cursor:(parseInt(qty)>0)?'pointer':'not-allowed', fontSize:14, fontWeight:700 }}>{tr('រក្សាទុក','Save')}</button>
      </div>
    </div>
  );
};

// ── Item detail — stock, actions, movement history ───────────────────────────
const StockItemDetail = ({ item, onClose, onEdit, onMove, onReceive, onDeleteMove, onDelete, tr, confirm }) => {
  const cat = invCatOf(item.category);
  const stock = invStock(item);
  const onOrder = invOnOrder(item);
  const low = item.minStock > 0 && stock <= item.minStock;
  const moves = [...(item.moves || [])].sort((a, b) => String(b.date||'').localeCompare(String(a.date||'')));
  const MTYPE = {
    in:    { km:'ដាក់​ចូល',  en:'In',    sign:'+', color:'#12873f' },
    out:   { km:'ដក​ចេញ',   en:'Out',   sign:'−', color:'#B0413E' },
    order: { km:'កម្មង់',    en:'Order', sign:'⌛', color:'#C98A12' },
  };
  const actBtn = (bg, icon, label, onClick) => (
    <button onClick={onClick} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'11px 4px', borderRadius:11, border:'none', background:bg+'18', color:bg, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:11.5 }}>
      <span style={{ fontSize:17, lineHeight:1 }}>{icon}</span>{label}
    </button>
  );
  return (
    <div style={{ padding:'4px 16px 18px', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:4 }}>
            <span style={{ background:cat.color, color:'#fff', fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:6 }}>{tr(cat.km, cat.en)}</span>
            {low && <span style={{ background:'rgba(176,65,62,.14)', color:'#B0413E', fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:6 }}>⚠ {tr('ស្តុក​ជិត​អស់','Low stock')}</span>}
          </div>
          <div style={{ fontSize:19, fontWeight:700, fontFamily:'var(--font-km)', lineHeight:1.25 }}>{item.name}</div>
        </div>
        <button onClick={onClose} aria-label={tr('បិទ','Close')} style={{ border:'none', background:'var(--surface-muted)', borderRadius:8, width:30, height:30, cursor:'pointer', color:'var(--ink-2)', fontSize:15, flexShrink:0 }}>✕</button>
      </div>

      {/* Stat row */}
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ flex:1, background:'var(--surface-muted)', borderRadius:12, padding:'11px 12px' }}>
          <div style={{ fontSize:24, fontWeight:800, fontFamily:'"JetBrains Mono",monospace', color: low?'#B0413E':'var(--ink)', lineHeight:1 }}>{stock}</div>
          <div style={{ fontSize:10.5, color:'var(--ink-3)', marginTop:3 }}>{tr('ស្តុក​ក្នុង​ដៃ','On hand')}{item.unit?` · ${item.unit}`:''}</div>
        </div>
        <div style={{ flex:1, background:'var(--surface-muted)', borderRadius:12, padding:'11px 12px' }}>
          <div style={{ fontSize:24, fontWeight:800, fontFamily:'"JetBrains Mono",monospace', color:'#C98A12', lineHeight:1 }}>{onOrder}</div>
          <div style={{ fontSize:10.5, color:'var(--ink-3)', marginTop:3 }}>{tr('កំពុង​កម្មង់','On order')}</div>
        </div>
        <div style={{ flex:1, background:'var(--surface-muted)', borderRadius:12, padding:'11px 12px' }}>
          <div style={{ fontSize:24, fontWeight:800, fontFamily:'"JetBrains Mono",monospace', lineHeight:1 }}>${(stock * (item.price||0)).toFixed(0)}</div>
          <div style={{ fontSize:10.5, color:'var(--ink-3)', marginTop:3 }}>{tr('តម្លៃ​សរុប','Value')} · ${item.price||0}{item.priceKHR?` · ${invKhr(item.priceKHR)}`:''}</div>
          {item.priceKHR ? <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace', marginTop:2 }}>{invKhr(stock*item.priceKHR)}</div> : null}
        </div>
      </div>
      {item.supplier && <div style={{ fontSize:12, color:'var(--ink-2)' }}>🚚 {tr('អ្នក​ចែកចាយ','Supplier')}: <b>{item.supplier}</b></div>}

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        {actBtn('#12873f', '＋', tr('ដាក់​ចូល','Stock in'),  () => onMove('in'))}
        {actBtn('#B0413E', '－', tr('ដក​ចេញ','Stock out'),  () => onMove('out'))}
        {actBtn('#C98A12', '🛒', tr('ដាក់​កម្មង់','Order'),  () => onMove('order'))}
      </div>

      {/* Movement history */}
      <div>
        <div style={{ fontSize:11, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--ink-3)', fontWeight:700, margin:'2px 0 8px', fontFamily:'"JetBrains Mono",monospace' }}>{tr('ចលនា​ស្តុក','Movement history')}</div>
        {moves.length === 0 ? (
          <div style={{ fontSize:12.5, color:'var(--ink-3)', textAlign:'center', padding:'14px 0' }}>{tr('គ្មាន​ចលនា​ស្តុក​នៅ​ឡើយ','No movements yet')}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {moves.map(m => { const mt = MTYPE[m.type] || MTYPE.in; const pending = m.type==='order' && !m.received; return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background:'var(--surface-muted)', borderRadius:10 }}>
                <span style={{ width:26, height:26, borderRadius:7, background:mt.color+'22', color:mt.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>{mt.sign}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>
                    <span style={{ color:mt.color }}>{m.type==='out'?'−':'+'}{m.qty}</span> · {tr(mt.km, mt.en)}
                    {pending && <span style={{ fontSize:10, marginLeft:6, background:'rgba(201,138,18,.16)', color:'#C98A12', padding:'1px 7px', borderRadius:5, fontWeight:800 }}>{tr('រង់ចាំ','Pending')}</span>}
                    {m.type==='order' && m.received && <span style={{ fontSize:10, marginLeft:6, color:'#12873f', fontWeight:800 }}>✓ {tr('បាន​ទទួល','Received')}</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace', marginTop:1 }}>{m.date}{m.party?` · ${m.party}`:''}{m.by?` · ${tr('ដោយ','by')} ${m.by}`:''}{m.note?` · ${m.note}`:''}</div>
                </div>
                {pending && <button onClick={()=>onReceive(m.id)} style={{ border:'none', background:'#12873f', color:'#fff', borderRadius:7, padding:'6px 10px', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>{tr('ទទួល','Receive')}</button>}
                <button onClick={()=>confirm?.({ title:tr('លុប​ចលនា​នេះ?','Delete this movement?'), confirmText:tr('លុប','Delete'), danger:true, onConfirm:()=>onDeleteMove(m.id) })} aria-label={tr('លុប','Delete')} style={{ border:'none', background:'transparent', color:'var(--ink-3)', cursor:'pointer', fontSize:14, flexShrink:0, padding:2 }}>🗑</button>
              </div>
            ); })}
          </div>
        )}
      </div>

      {item.notes && <div style={{ fontSize:12, color:'var(--ink-2)', background:'var(--surface-muted)', borderRadius:9, padding:'9px 11px' }}>📝 {item.notes}</div>}

      <div style={{ display:'flex', gap:8, borderTop:'1px solid var(--border)', paddingTop:12 }}>
        <button onClick={onEdit} style={{ flex:1, padding:'10px', borderRadius:9, border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--ink-2)', cursor:'pointer', fontSize:13, fontWeight:600 }}>{tr('កែ​ព័ត៌មាន','Edit item')}</button>
        <button onClick={()=>confirm?.({ title:tr('លុប​ទំនិញ​នេះ?','Delete this item?'), body:tr('ទិន្នន័យ​ស្តុក​ទាំងអស់​នឹង​បាត់​បង់។','All its stock data will be removed.'), confirmText:tr('លុប','Delete'), danger:true, onConfirm:onDelete })} style={{ padding:'10px 16px', borderRadius:9, border:'1px solid rgba(176,65,62,.4)', background:'transparent', color:'#B0413E', cursor:'pointer', fontSize:13, fontWeight:600 }}>{tr('លុប','Delete')}</button>
      </div>
    </div>
  );
};

// ── Main screen ──────────────────────────────────────────────────────────────
const StockScreen = ({ role }) => {
  const { tr, toast, confirm } = useAppActions();
  const bp = useBreakpoint();
  const [, force] = React.useReducer(n => n + 1, 0);
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [stView, setStViewRaw] = React.useState(() => { try { return localStorage.getItem('anzen_stockView') || 'card'; } catch (e) { return 'card'; } });
  const setStView = (v) => { setStViewRaw(v); try { localStorage.setItem('anzen_stockView', v); } catch (e) {} };
  const [formItem, setFormItem] = React.useState(null);   // {} new · item edit · null closed
  const [detailId, setDetailId] = React.useState(null);
  const [move, setMove] = React.useState(null);           // { itemId, type }

  const items = invList();
  const detailItem = items.find(i => i.id === detailId) || null;

  const mutate = (fn) => { const next = fn(items.slice()); invPersist(next); force(); };
  const upsertItem = (it) => mutate(list => {
    const i = list.findIndex(x => x.id === it.id);
    if (i === -1) list.push(it); else list[i] = it;
    return list;
  });
  const addMove = (itemId, m) => mutate(list => list.map(x => x.id === itemId ? { ...x, moves:[...(x.moves||[]), m] } : x));
  const receiveMove = (itemId, moveId) => mutate(list => list.map(x => x.id === itemId
    ? { ...x, moves:(x.moves||[]).map(m => m.id===moveId ? { ...m, received:true, receivedDate:(typeof todayStr==='function'?todayStr():'') } : m) } : x));
  const deleteMove = (itemId, moveId) => mutate(list => list.map(x => x.id === itemId ? { ...x, moves:(x.moves||[]).filter(m => m.id!==moveId) } : x));
  const deleteItem = (itemId) => { mutate(list => list.filter(x => x.id !== itemId)); setDetailId(null); toast(tr('បាន​លុប​ទំនិញ','Item deleted'), 'neutral'); };

  const q = query.trim().toLowerCase();
  const filtered = items.filter(it =>
    (filter === 'all' || it.category === filter) &&
    (!q || (it.name||'').toLowerCase().includes(q) || (it.supplier||'').toLowerCase().includes(q))
  );

  const totalItems = items.length;
  const totalUnits = items.reduce((a, it) => a + invStock(it), 0);
  const lowCount   = items.filter(it => it.minStock > 0 && invStock(it) <= it.minStock).length;
  const totalValue = items.reduce((a, it) => a + invStock(it) * (it.price || 0), 0);

  const stat = { flex:1, background:'rgba(255,255,255,.13)', borderRadius:12, padding:'9px 11px' };
  const statNum = { fontFamily:'"JetBrains Mono",monospace', fontSize:18, fontWeight:800, lineHeight:1 };
  const statLbl = { fontSize:10, opacity:.85, marginTop:3 };

  const CHIPS = [{ k:'all', label:tr('ទាំងអស់','All'), color:'var(--accent)' }, ...invAllCats().map(c => ({ k:c.k, label:tr(c.km, c.en), color:c.color }))];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Blue summary hero */}
      <div style={{ position:'relative', borderRadius:20, padding:'15px 16px', color:'#fff',
        background:'linear-gradient(135deg,#243a66,#365a9c 60%,#4f7bc0)', boxShadow:'0 12px 28px rgba(36,58,102,.30)' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:20, pointerEvents:'none' }}>
          <div style={{ position:'absolute', right:-6, bottom:-16, opacity:.14, color:'#fff' }}><Icon name="box" size={104} stroke={1.4}/></div>
        </div>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>{tr('គ្រប់គ្រង​ស្តុក','Stock management')}</div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            {/* Card / Table view switcher */}
            <div style={{ display:'inline-flex', background:'rgba(255,255,255,.16)', borderRadius:10, padding:3, gap:2 }}>
              {[
                { id:'card',  svg:(<><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/></>) },
                { id:'table', svg:(<><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/></>) },
              ].map(v => (
                <button key={v.id} onClick={()=>setStView(v.id)} title={v.id} aria-label={v.id+' view'} style={{
                  width:30, height:28, display:'flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:7, cursor:'pointer',
                  background: stView===v.id ? '#fff' : 'transparent', color: stView===v.id ? 'var(--accent)' : '#fff', transition:'background .14s,color .14s' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{v.svg}</svg>
                </button>
              ))}
            </div>
            <button onClick={()=>setFormItem({})} style={{ display:'inline-flex', alignItems:'center', gap:5, height:32, padding:'0 13px', border:'none', borderRadius:999, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
              <Icon name="plus" size={14}/>{tr('បន្ថែម','Add')}
            </button>
          </div>
        </div>
        <div style={{ position:'relative', display:'flex', gap:8, marginTop:14 }}>
          <div style={stat}><div style={{ display:'flex', alignItems:'center', gap:6 }}><Icon name="box" size={14}/><span style={statNum}>{totalItems}</span></div><div style={statLbl}>{tr('ប្រភេទ​ទំនិញ','Items')}</div></div>
          <div style={stat}><div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={statNum}>{totalUnits}</span></div><div style={statLbl}>{tr('ចំនួន​សរុប','Total units')}</div></div>
          <div style={stat}><div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background: lowCount?'#F0A93B':'#6BE39A' }}/><span style={statNum}>{lowCount}</span></div><div style={statLbl}>{tr('ស្តុក​ជិត​អស់','Low stock')}</div></div>
          <div style={stat}><div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={statNum}>${totalValue.toFixed(0)}</span></div><div style={statLbl}>{tr('តម្លៃ','Value')}</div></div>
        </div>
      </div>

      {/* Search + category filter */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('ស្វែងរក​ទំនិញ...','Search items...')}
          style={{ flex:'1 1 180px', minWidth:0, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:9, fontSize:13, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)' }}/>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {CHIPS.map(c => { const active = filter===c.k; const n = c.k==='all' ? items.length : items.filter(i=>i.category===c.k).length;
          return (
            <button key={c.k} onClick={()=>setFilter(c.k)} style={{ padding:'5px 12px', borderRadius:999, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              border:'1.5px solid '+(active?c.color:'var(--border)'), background: active?c.color:'var(--surface)', color: active?'#fff':'var(--ink-2)',
              display:'inline-flex', alignItems:'center', gap:6 }}>
              {c.label} <span style={{ opacity:.7, fontFamily:'"JetBrains Mono",monospace' }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Item list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--ink-3)' }}>
          <div style={{ opacity:.5, marginBottom:10, display:'flex', justifyContent:'center' }}><Icon name="box" size={40}/></div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:5 }}>{items.length===0 ? tr('មិន​ទាន់​មាន​ទំនិញ','No items yet') : tr('គ្មាន​លទ្ធផល','No matches')}</div>
          {items.length===0 && <button onClick={()=>setFormItem({})} style={{ marginTop:10, padding:'9px 18px', borderRadius:9, border:'none', background:'var(--accent)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>{tr('បន្ថែម​ទំនិញ​ដំបូង','Add first item')}</button>}
        </div>
      ) : stView === 'table' ? (
        // Google-Sheets-style grid: row numbers, gridlines, sticky header, scrollable.
        (() => {
          const th = { position:'sticky', top:0, zIndex:1, background:'var(--surface-muted)', border:'1px solid var(--border)', padding:'8px 10px', fontSize:10.5, fontWeight:700, color:'var(--ink-3)', letterSpacing:'.02em', whiteSpace:'nowrap', textTransform:'uppercase' };
          const td = { border:'1px solid var(--border)', padding:'7px 10px', whiteSpace:'nowrap' };
          const num = { ...td, textAlign:'right', fontFamily:'"JetBrains Mono",monospace', fontVariantNumeric:'tabular-nums' };
          const rowHdr = { border:'1px solid var(--border)', background:'var(--surface-muted)', color:'var(--ink-3)', textAlign:'center', fontFamily:'"JetBrains Mono",monospace', fontSize:11, width:34, padding:'7px 4px', position:'sticky', left:0 };
          return (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:10, overflowX:'auto', boxShadow:'0 4px 14px rgba(20,30,60,.05)' }}>
              <table style={{ borderCollapse:'collapse', width:'100%', minWidth:680, fontSize:12.5 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, ...rowHdr, textTransform:'none' }}>#</th>
                    <th style={{ ...th, textAlign:'left', position:'sticky', left:34 }}>{tr('ឈ្មោះ','Name')}</th>
                    <th style={{ ...th, textAlign:'left' }}>{tr('ប្រភេទ','Category')}</th>
                    <th style={{ ...th, textAlign:'right' }}>{tr('ស្តុក','Stock')}</th>
                    <th style={{ ...th, textAlign:'left' }}>{tr('ឯកតា','Unit')}</th>
                    <th style={{ ...th, textAlign:'right' }}>{tr('តម្លៃ','Price')}</th>
                    <th style={{ ...th, textAlign:'right' }}>{tr('តម្លៃ​សរុប','Value')}</th>
                    <th style={{ ...th, textAlign:'right' }}>{tr('កម្មង់','On order')}</th>
                    <th style={{ ...th, textAlign:'left' }}>{tr('អ្នក​ចែកចាយ','Supplier')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it, idx) => {
                    const cat = invCatOf(it.category);
                    const stock = invStock(it);
                    const onOrder = invOnOrder(it);
                    const low = it.minStock > 0 && stock <= it.minStock;
                    return (
                      <tr key={it.id} onClick={()=>setDetailId(it.id)} style={{ cursor:'pointer' }}>
                        <td style={rowHdr}>{idx+1}</td>
                        <td style={{ ...td, fontWeight:700, position:'sticky', left:34, background:'var(--surface)', borderLeft:`3px solid ${cat.color}` }}>{it.name}{low && <span style={{ color:'#B0413E', marginLeft:5 }}>⚠</span>}</td>
                        <td style={td}><span style={{ color:cat.color, fontWeight:700 }}>{tr(cat.km, cat.en)}</span></td>
                        <td style={{ ...num, color: low?'#B0413E':'var(--ink)', fontWeight:800 }}>{stock}</td>
                        <td style={td}>{it.unit || '—'}</td>
                        <td style={num}>{it.price ? '$'+it.price : (it.priceKHR?'':'—')}{it.priceKHR ? <div style={{ fontSize:10, color:'var(--ink-3)', fontWeight:400 }}>{invKhr(it.priceKHR)}</div> : null}</td>
                        <td style={num}>${(stock*(it.price||0)).toFixed(0)}{it.priceKHR ? <div style={{ fontSize:10, color:'var(--ink-3)', fontWeight:400 }}>{invKhr(stock*it.priceKHR)}</div> : null}</td>
                        <td style={{ ...num, color: onOrder?'#C98A12':'var(--ink-3)' }}>{onOrder || '—'}</td>
                        <td style={{ ...td, color:'var(--ink-2)' }}>{it.supplier || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()
      ) : (
        <div style={{ display: bp.mobile ? 'flex' : 'grid', flexDirection:'column', gridTemplateColumns: bp.mobile ? undefined : '1fr 1fr', gap:8 }}>
          {filtered.map(it => {
            const cat = invCatOf(it.category);
            const stock = invStock(it);
            const onOrder = invOnOrder(it);
            const low = it.minStock > 0 && stock <= it.minStock;
            return (
              <button key={it.id} onClick={()=>setDetailId(it.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderLeft:`3px solid ${cat.color}`, borderRadius:14, boxShadow:'0 4px 14px rgba(20,30,60,.05)', cursor:'pointer', textAlign:'left', width:'100%' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ fontSize:14.5, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.name}</span>
                    {low && <span style={{ fontSize:9, fontWeight:800, color:'#B0413E', background:'rgba(176,65,62,.13)', padding:'1px 6px', borderRadius:5, flexShrink:0 }}>⚠ {tr('ជិត​អស់','Low')}</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>
                    <span style={{ color:cat.color, fontWeight:700 }}>{tr(cat.km, cat.en)}</span>
                    {it.price ? <span style={{ fontFamily:'"JetBrains Mono",monospace' }}> · ${it.price}</span> : null}
                    {it.priceKHR ? <span style={{ fontFamily:'"JetBrains Mono",monospace' }}> · {invKhr(it.priceKHR)}</span> : null}
                    {it.supplier ? ` · ${it.supplier}` : ''}
                    {onOrder ? <span style={{ color:'#C98A12', fontWeight:700 }}> · 🛒 {onOrder}</span> : null}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:20, fontWeight:800, fontFamily:'"JetBrains Mono",monospace', color: low?'#B0413E':'var(--ink)', lineHeight:1 }}>{stock}</div>
                  <div style={{ fontSize:9.5, color:'var(--ink-3)', marginTop:2 }}>{it.unit || tr('ក្នុង​ដៃ','on hand')}</div>
                </div>
                <span style={{ fontSize:15, color:'var(--ink-3)', flexShrink:0 }}>›</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Item detail popup */}
      <Modal open={!!detailItem} onClose={()=>setDetailId(null)}>
        {detailItem && (
          <StockItemDetail item={detailItem} tr={tr} confirm={confirm}
            onClose={()=>setDetailId(null)}
            onEdit={()=>{ setFormItem(detailItem); setDetailId(null); }}
            onMove={(type)=>setMove({ itemId:detailItem.id, type })}
            onReceive={(mid)=>{ receiveMove(detailItem.id, mid); toast(tr('បាន​ទទួល​ចូល​ស្តុក','Received into stock'),'good'); }}
            onDeleteMove={(mid)=>deleteMove(detailItem.id, mid)}
            onDelete={()=>deleteItem(detailItem.id)}/>
        )}
      </Modal>

      {/* Add / edit item form */}
      <Modal open={!!formItem} onClose={()=>setFormItem(null)}>
        {formItem && (
          <StockItemForm item={formItem.id ? formItem : null} tr={tr}
            onCancel={()=>setFormItem(null)}
            onSave={(it)=>{ upsertItem(it); setFormItem(null); toast(it.id && items.some(x=>x.id===it.id) ? tr('បាន​រក្សាទុក','Saved') : tr('បាន​បន្ថែម​ទំនិញ','Item added'),'good'); }}/>
        )}
      </Modal>

      {/* Stock movement form */}
      <Modal open={!!move} onClose={()=>setMove(null)}>
        {move && (() => { const it = items.find(x => x.id === move.itemId); if (!it) return null;
          return <StockMoveForm item={it} type={move.type} tr={tr}
            onCancel={()=>setMove(null)}
            onSave={(m)=>{ addMove(it.id, m); setMove(null);
              toast(m.type==='in'?tr('បាន​ដាក់​ចូល​ស្តុក','Stocked in'):m.type==='out'?tr('បាន​ដក​ចេញ','Stocked out'):tr('បាន​ដាក់​កម្មង់','Order placed'),'good'); }}/>;
        })()}
      </Modal>
    </div>
  );
};
