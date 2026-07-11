// ── Scores from a Google Sheet ───────────────────────────────────────────────
// Live-fetches a *public* Google Sheet as CSV and renders it. Works with any
// column layout (headers come from the sheet's first row). The sheet URL is kept
// in the synced settings blob. A shared cached fetcher backs both the Scores tab
// and a per-student section on the profile. Requires the sheet to be shared
// "Anyone with the link → Viewer" (or Published to web → CSV) so the browser can
// read it cross-origin.

const SCORE_SHEET_DEFAULT = 'https://docs.google.com/spreadsheets/d/1Z09Vq9GfmlULihgw-hV_7UxKdbQOWxErdJ8N-SI7kRw/edit';

// Turn a Google Sheets URL (edit / share / published) into a CSV endpoint.
const parseSheetRef = (url) => {
  if (!url) return null;
  const u = String(url).trim();
  if (!u) return null;
  // Already a CSV/published endpoint — use as-is.
  if (/output=csv/.test(u) || /format=csv/.test(u) || /tqx=out:csv/.test(u)) return { csvUrl: u };
  const idm = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9\-_]+)/) || u.match(/^([a-zA-Z0-9\-_]{25,})$/);
  const id = idm ? idm[1] : null;
  if (!id) return null;
  const gidm = u.match(/[#&?]gid=(\d+)/);
  const gid = gidm ? gidm[1] : null;
  // gviz CSV endpoint — served cross-origin for public sheets.
  const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`;
  return { id, gid, csvUrl };
};
window.__parseSheetRef = parseSheetRef;

// Minimal RFC-4180 CSV parser → array of string arrays (handles quotes, commas,
// and newlines inside quoted fields).
const parseSheetCSV = (text) => {
  const s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = []; let row = []; let field = ''; let inQ = false; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  row.push(field); rows.push(row);
  while (rows.length && rows[rows.length - 1].every(x => x === '')) rows.pop();
  return rows;
};
window.__parseSheetCSV = parseSheetCSV;

// Cached fetcher shared by the tab and the student section (60s freshness).
window.__scoreCache = window.__scoreCache || { url: null, at: 0, data: null };
const fetchScoreSheet = async (url, force) => {
  const ref = parseSheetRef(url);
  if (!ref) throw new Error('bad-url');
  const cache = window.__scoreCache;
  if (!force && cache.data && cache.url === url && (Date.now() - cache.at) < 60000) return cache.data;
  const res = await fetch(ref.csvUrl, { credentials: 'omit' });
  if (!res.ok) throw new Error('http-' + res.status);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('not-public');
  const rows = parseSheetCSV(text);
  const data = { headers: rows.length ? rows[0] : [], rows: rows.slice(1) };
  window.__scoreCache = { url, at: Date.now(), data };
  return data;
};
window.__fetchScoreSheet = fetchScoreSheet;

const scoreSheetUrl = () => (window.__schoolSettings && window.__schoolSettings.scoreSheetUrl) || SCORE_SHEET_DEFAULT;

// A friendly explanation for the common failure (private sheet / CORS).
const ScoreError = ({ err, tr }) => (
  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'22px 20px', textAlign:'center' }}>
    <div style={{ fontSize:30, marginBottom:8 }}>🔒</div>
    <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>{tr('ទាញ​តារាង​មិន​បាន','Couldn\'t load the sheet')}</div>
    <div style={{ fontSize:12.5, color:'var(--ink-2)', lineHeight:1.6, maxWidth:440, margin:'0 auto' }}>
      {tr('សូម​ចែករំលែក​សន្លឹក​ជា​សាធារណៈ៖ Google Sheets → Share → “Anyone with the link” → Viewer។ ឬ File → Share → Publish to web → CSV រួច​ដាក់ URL នោះ។',
          'Make the sheet public: Google Sheets → Share → “Anyone with the link” → Viewer. Or File → Share → Publish to web → CSV, then paste that URL.')}
    </div>
    <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:10, fontFamily:'"JetBrains Mono",monospace' }}>{String(err && err.message || err || '')}</div>
  </div>
);

// Google-Sheets-style table for a {headers, rows} dataset.
const SheetTable = ({ data, tr, highlight }) => {
  const th = { position:'sticky', top:0, zIndex:1, background:'var(--surface-muted)', border:'1px solid var(--border)', padding:'8px 10px', fontSize:10.5, fontWeight:700, color:'var(--ink-3)', letterSpacing:'.02em', whiteSpace:'nowrap', textAlign:'left' };
  const td = { border:'1px solid var(--border)', padding:'7px 10px', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' };
  const rowHdr = { border:'1px solid var(--border)', background:'var(--surface-muted)', color:'var(--ink-3)', textAlign:'center', fontFamily:'"JetBrains Mono",monospace', fontSize:11, width:34, padding:'7px 4px' };
  if (!data.headers.length) return <div style={{ fontSize:13, color:'var(--ink-3)', padding:'20px', textAlign:'center' }}>{tr('សន្លឹក​ទទេ','Empty sheet')}</div>;
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:10, overflowX:'auto', boxShadow:'0 4px 14px rgba(20,30,60,.05)' }}>
      <table style={{ borderCollapse:'collapse', width:'100%', fontSize:12.5 }}>
        <thead><tr>
          <th style={{ ...th, ...rowHdr, textAlign:'center' }}>#</th>
          {data.headers.map((h, i) => <th key={i} style={th}>{h || '—'}</th>)}
        </tr></thead>
        <tbody>
          {data.rows.map((r, ri) => (
            <tr key={ri}>
              <td style={rowHdr}>{ri + 1}</td>
              {data.headers.map((h, ci) => <td key={ci} style={{ ...td, ...(highlight && ci === highlight.col ? { background:'var(--accent-soft)', fontWeight:700 } : {}) }}>{r[ci] != null ? r[ci] : ''}</td>)}
            </tr>
          ))}
          {data.rows.length === 0 && <tr><td colSpan={data.headers.length + 1} style={{ textAlign:'center', padding:16, color:'var(--ink-3)' }}>{tr('គ្មាន​ទិន្នន័យ','No rows')}</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// ── Scores tab ───────────────────────────────────────────────────────────────
const ScoresScreen = ({ role }) => {
  const { tr, toast } = useAppActions();
  const [data, setData] = React.useState(window.__scoreCache.data || null);
  const [err, setErr] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [cfg, setCfg] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState(scoreSheetUrl());

  const load = React.useCallback((force) => {
    setLoading(true); setErr(null);
    fetchScoreSheet(scoreSheetUrl(), force)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e); setLoading(false); });
  }, []);
  React.useEffect(() => { load(false); }, [load]);

  const saveUrl = () => {
    if (!window.__schoolSettings) window.__schoolSettings = {};
    window.__schoolSettings.scoreSheetUrl = urlDraft.trim();
    if (window.saveAllData) window.saveAllData();
    setCfg(false); window.__scoreCache = { url:null, at:0, data:null };
    load(true); toast(tr('បាន​រក្សាទុក URL','Sheet URL saved'), 'good');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ position:'relative', borderRadius:20, padding:'15px 16px', color:'#fff',
        background:'linear-gradient(135deg,#243a66,#365a9c 60%,#4f7bc0)', boxShadow:'0 12px 28px rgba(36,58,102,.30)' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:20, pointerEvents:'none' }}>
          <div style={{ position:'absolute', right:-6, bottom:-16, opacity:.14, color:'#fff' }}><Icon name="sheet" size={104} stroke={1.4}/></div>
        </div>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>{tr('តារាង​ពិន្ទុ','Scores')}</div>
          <div style={{ display:'flex', gap:7 }}>
            <button onClick={()=>setCfg(c=>!c)} title={tr('កំណត់ URL','Sheet URL')} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff' }}><Icon name="settings" size={15}/></button>
            <button onClick={()=>load(true)} title={tr('ធ្វើ​បច្ចុប្បន្នភាព','Refresh')} style={{ display:'inline-flex', alignItems:'center', gap:5, height:32, padding:'0 13px', border:'none', borderRadius:999, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
              <Icon name="download" size={14}/>{tr('ទាញ​ម្ដង​ទៀត','Refresh')}
            </button>
          </div>
        </div>
        <div style={{ position:'relative', fontSize:11.5, opacity:.85, marginTop:8 }}>
          {loading ? tr('កំពុង​ទាញ...','Loading…') : data ? `${data.rows.length} ${tr('ជួរ','rows')} · ${data.headers.length} ${tr('ជួរឈរ','columns')}` : tr('ទាញ​ផ្ទាល់​ពី Google Sheets','Live from Google Sheets')}
        </div>
      </div>

      {cfg && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--ink-3)', marginBottom:5 }}>{tr('URL របស់ Google Sheet (សាធារណៈ)','Google Sheet URL (public)')}</div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={urlDraft} onChange={e=>setUrlDraft(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." style={{ flex:1, padding:'9px 11px', border:'1px solid var(--border)', borderRadius:8, fontSize:12.5, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)' }}/>
            <button onClick={saveUrl} style={{ border:'none', background:'var(--accent)', color:'#fff', borderRadius:8, padding:'0 14px', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'inherit', flexShrink:0 }}>{tr('រក្សាទុក','Save')}</button>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--ink-3)', fontSize:13 }}>{tr('កំពុង​ទាញ​តារាង...','Loading the sheet…')}</div>
      ) : err ? <ScoreError err={err} tr={tr}/>
        : data ? <SheetTable data={data} tr={tr}/>
        : null}
    </div>
  );
};

// ── Per-student scores (used inside the student profile) ─────────────────────
// Finds rows whose cells mention the student's name and shows them.
const ScoreSheetForStudent = ({ student }) => {
  const { tr } = useAppActions();
  const [data, setData] = React.useState(window.__scoreCache.data || null);
  const [err, setErr] = React.useState(null);
  const [loading, setLoading] = React.useState(!window.__scoreCache.data);
  React.useEffect(() => {
    let alive = true;
    fetchScoreSheet(scoreSheetUrl(), false).then(d => { if (alive) { setData(d); setLoading(false); } }).catch(e => { if (alive) { setErr(e); setLoading(false); } });
    return () => { alive = false; };
  }, []);
  if (loading) return <div style={{ fontSize:12.5, color:'var(--ink-3)', padding:'8px 0' }}>{tr('កំពុង​ទាញ​ពិន្ទុ...','Loading scores…')}</div>;
  if (err) return <div style={{ fontSize:12, color:'var(--ink-3)', padding:'8px 0' }}>{tr('ទាញ​ពិន្ទុ​មិន​បាន — សូម​ពិនិត្យ​ការ​ចែករំលែក​សន្លឹក','Couldn\'t load scores — check the sheet sharing')}</div>;
  if (!data || !data.headers.length) return <div style={{ fontSize:12.5, color:'var(--ink-3)', padding:'8px 0' }}>{tr('គ្មាន​ទិន្នន័យ','No data')}</div>;
  const names = [student.name, student.en, student.id].filter(Boolean).map(x => String(x).toLowerCase().trim());
  const mine = data.rows.filter(r => r.some(cell => { const c = String(cell || '').toLowerCase().trim(); return c && names.some(n => n && (c === n || c.includes(n) || n.includes(c))); }));
  if (!mine.length) return <div style={{ fontSize:12.5, color:'var(--ink-3)', padding:'8px 0' }}>{tr('រក​ពិន្ទុ​របស់​សិស្ស​នេះ​មិន​ឃើញ​ក្នុង​សន្លឹក','No matching rows for this student in the sheet')}</div>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {mine.map((r, ri) => (
        <div key={ri} style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          {data.headers.map((h, ci) => (r[ci] != null && String(r[ci]).trim() !== '') ? (
            <div key={ci} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'7px 11px', borderBottom: ci < data.headers.length - 1 ? '1px solid var(--border)' : 'none', fontSize:12.5 }}>
              <span style={{ color:'var(--ink-3)' }}>{h || '—'}</span>
              <span style={{ fontWeight:600, textAlign:'right' }}>{r[ci]}</span>
            </div>
          ) : null)}
        </div>
      ))}
    </div>
  );
};
window.ScoreSheetForStudent = ScoreSheetForStudent;
