// ── Scores from Google Sheets ────────────────────────────────────────────────
// Live-fetches one or more *public* Google Sheets as CSV. Each sheet has a lesson
// title; a filter dropdown switches between them. The table shows just four
// columns — date, student, company, score — auto-detected from the sheet's
// headers. Scores under 95% are red, 95%+ (passed) are blue. Data lives in the
// synced settings blob. Sheets must be shared "Anyone with the link → Viewer"
// (or Published to web → CSV) so the browser can read them cross-origin.

const SCORE_SHEET_DEFAULT = 'https://docs.google.com/spreadsheets/d/1Z09Vq9GfmlULihgw-hV_7UxKdbQOWxErdJ8N-SI7kRw/edit';
const SCORE_PASS = 95;   // pass threshold (%)

// Turn a Google Sheets URL (edit / share / published) into a CSV endpoint.
const parseSheetRef = (url) => {
  if (!url) return null;
  const u = String(url).trim();
  if (!u) return null;
  if (/output=csv/.test(u) || /format=csv/.test(u) || /tqx=out:csv/.test(u)) return { csvUrl: u };
  const idm = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9\-_]+)/) || u.match(/^([a-zA-Z0-9\-_]{25,})$/);
  const id = idm ? idm[1] : null;
  if (!id) return null;
  const gidm = u.match(/[#&?]gid=(\d+)/);
  const gid = gidm ? gidm[1] : null;
  return { id, gid, csvUrl: `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}` };
};
window.__parseSheetRef = parseSheetRef;

// Minimal RFC-4180 CSV parser → array of string arrays.
const parseSheetCSV = (text) => {
  const s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = []; let row = []; let field = ''; let inQ = false; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inQ) { if (c === '"') { if (s[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; } field += c; i++; continue; }
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

// Per-URL cache (60s freshness), shared by the tab and the student section.
window.__scoreCache = window.__scoreCache || {};
const fetchScoreSheet = async (url, force) => {
  const ref = parseSheetRef(url);
  if (!ref) throw new Error('bad-url');
  const c = window.__scoreCache[url];
  if (!force && c && (Date.now() - c.at) < 60000) return c.data;
  const res = await fetch(ref.csvUrl, { credentials: 'omit' });
  if (!res.ok) throw new Error('http-' + res.status);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('not-public');
  const rows = parseSheetCSV(text);
  const data = { headers: rows.length ? rows[0] : [], rows: rows.slice(1) };
  window.__scoreCache[url] = { at: Date.now(), data };
  return data;
};
window.__fetchScoreSheet = fetchScoreSheet;

// Configured sheets: [{title, url}]. Migrates the legacy single url.
const scoreSheets = () => {
  const ss = window.__schoolSettings || {};
  if (Array.isArray(ss.scoreSheets) && ss.scoreSheets.length) return ss.scoreSheets;
  return [{ title: 'តារាងពិន្ទុ', url: ss.scoreSheetUrl || SCORE_SHEET_DEFAULT }];
};
const saveScoreSheets = (list) => { if (!window.__schoolSettings) window.__schoolSettings = {}; window.__schoolSettings.scoreSheets = list; if (window.saveAllData) window.saveAllData(); };

// Detect the four columns of interest from the header row.
const findCol = (headers, regexes, exclude) => {
  for (let i = 0; i < headers.length; i++) {
    if (exclude && exclude.includes(i)) continue;
    const h = String(headers[i] || '').toLowerCase();
    if (regexes.some(r => r.test(h))) return i;
  }
  return -1;
};
const detectScoreCols = (headers) => {
  // Keywords in Khmer / English / Japanese.
  const company = findCol(headers, [/company/, /ក្រុមហ៊ុន/, /firm/, /会社/, /企業/, /社名/]);
  const student = findCol(headers, [/student/, /សិស្ស/, /ឈ្មោះ/, /\bname\b/, /氏名/, /名前/, /生徒/, /受験者/], [company]);
  const date    = findCol(headers, [/date/, /ថ្ងៃ/, /កាល/, /បរិច្ឆេ/, /日付/, /年月日/, /月日/, /受験日/, /日にち/], [company, student]);
  const score   = findCol(headers, [/score/, /ពិន្ទុ/, /mark/, /grade/, /point/, /%/, /result/, /点数/, /得点/, /成績/, /スコア/, /点/], [company, student, date]);
  return { date, student, company, score };
};
// Percentage of a score cell. Handles "47/50" (→94%), "96 / 100" (→96%),
// "88%", or a bare number (treated as a percentage). Pass = ≥95%.
const scorePct = (v) => {
  const s = String(v == null ? '' : v).trim();
  const frac = s.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (frac) { const den = parseFloat(frac[2]); if (den > 0) return parseFloat(frac[1]) / den * 100; }
  const pct = s.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (pct) return parseFloat(pct[1]);
  const n = s.match(/-?\d+(?:\.\d+)?/);
  return n ? parseFloat(n[0]) : null;
};
const scoreColor = (v) => { const p = scorePct(v); if (p == null) return 'var(--ink)'; return p < SCORE_PASS ? '#B0413E' : '#2A5DB0'; };
// Column indices: use the sheet's manual map where set, else auto-detect.
const resolveScoreCols = (headers, sheet) => {
  const auto = detectScoreCols(headers);
  const m = (sheet && sheet.map) || {};
  const pick = (k) => (Number.isInteger(m[k]) && m[k] >= 0 && m[k] < headers.length) ? m[k] : auto[k];
  return { date: pick('date'), student: pick('student'), company: pick('company'), score: pick('score') };
};

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

// Four-column score table (date · student · company · score) with pass colours.
const ScoreTable = ({ data, tr, sheet }) => {
  const cols = resolveScoreCols(data.headers, sheet);
  // Only use the compact 4-column view when we can identify at least the
  // student and the score; otherwise show every column so nothing is hidden.
  const some = cols.student >= 0 && cols.score >= 0;
  const th = { position:'sticky', top:0, zIndex:1, background:'var(--surface-muted)', border:'1px solid var(--border)', padding:'8px 11px', fontSize:10.5, fontWeight:700, color:'var(--ink-3)', letterSpacing:'.02em', whiteSpace:'nowrap', textAlign:'left', textTransform:'uppercase' };
  const td = { border:'1px solid var(--border)', padding:'8px 11px', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' };
  const rowHdr = { border:'1px solid var(--border)', background:'var(--surface-muted)', color:'var(--ink-3)', textAlign:'center', fontFamily:'"JetBrains Mono",monospace', fontSize:11, width:34, padding:'8px 4px' };
  if (!some) {  // couldn't map — show the whole sheet so nothing is hidden
    return <>
      <div style={{ fontSize:11.5, color:'var(--ink-2)', marginBottom:8, background:'var(--surface-muted)', borderRadius:8, padding:'8px 11px' }}>💡 {tr('រក​ជួរ​ឈរ​ស្វ័យ​ប្រវត្តិ​មិន​ឃើញ​ទេ — ចុច ⚙ → ↻ → ជ្រើស​ជួរ​ឈរ (កាលបរិច្ឆេទ/សិស្ស/ក្រុមហ៊ុន/ពិន្ទុ)។ ខាង​ក្រោម​បង្ហាញ​ទិន្នន័យ​ទាំង​អស់​សិន។','Couldn\'t auto-detect columns — tap ⚙ → ↻ → choose the date/student/company/score columns. Showing all data for now.')}</div>
      <RawSheetTable data={data} tr={tr} scoreCol={cols.score}/>
    </>;
  }
  const C = [
    { i: cols.date,    label: tr('កាលបរិច្ឆេទ','Date') },
    { i: cols.student, label: tr('ឈ្មោះ​សិស្ស','Student') },
    { i: cols.company, label: tr('ក្រុមហ៊ុន','Company') },
    { i: cols.score,   label: tr('ពិន្ទុ','Score'), score:true },
  ].filter(c => c.i >= 0);
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:10, overflowX:'auto', boxShadow:'0 4px 14px rgba(20,30,60,.05)' }}>
      <table style={{ borderCollapse:'collapse', width:'100%', fontSize:12.5, minWidth:480 }}>
        <thead><tr>
          <th style={{ ...th, ...rowHdr, textAlign:'center' }}>#</th>
          {C.map((c, i) => <th key={i} style={{ ...th, textAlign: c.score ? 'right' : 'left' }}>{c.label}</th>)}
        </tr></thead>
        <tbody>
          {data.rows.map((r, ri) => (
            <tr key={ri}>
              <td style={rowHdr}>{ri + 1}</td>
              {C.map((c, i) => c.score
                ? <td key={i} style={{ ...td, textAlign:'right', fontWeight:800, color:scoreColor(r[c.i]) }}>{r[c.i] != null ? r[c.i] : ''}</td>
                : <td key={i} style={{ ...td, ...(c.i === cols.student ? { fontWeight:600 } : {}) }}>{r[c.i] != null ? r[c.i] : ''}</td>
              )}
            </tr>
          ))}
          {data.rows.length === 0 && <tr><td colSpan={C.length + 1} style={{ textAlign:'center', padding:16, color:'var(--ink-3)' }}>{tr('គ្មាន​ទិន្នន័យ','No rows')}</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// Fallback: full sheet.
const RawSheetTable = ({ data, tr, scoreCol }) => {
  const th = { position:'sticky', top:0, background:'var(--surface-muted)', border:'1px solid var(--border)', padding:'8px 10px', fontSize:10.5, fontWeight:700, color:'var(--ink-3)', whiteSpace:'nowrap', textAlign:'left' };
  const td = { border:'1px solid var(--border)', padding:'7px 10px', whiteSpace:'nowrap' };
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border-strong)', borderRadius:10, overflowX:'auto' }}>
      <table style={{ borderCollapse:'collapse', width:'100%', fontSize:12.5 }}>
        <thead><tr>{data.headers.map((h, i) => <th key={i} style={th}>{h || '—'}</th>)}</tr></thead>
        <tbody>{data.rows.map((r, ri) => <tr key={ri}>{data.headers.map((h, ci) => <td key={ci} style={{ ...td, ...(ci === scoreCol ? { fontWeight:800, color:scoreColor(r[ci]) } : {}) }}>{r[ci] != null ? r[ci] : ''}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
};

// ── Scores tab ───────────────────────────────────────────────────────────────
const ScoresScreen = ({ role }) => {
  const { tr, toast } = useAppActions();
  const [selIdx, setSelIdx] = React.useState(0);
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [cfg, setCfg] = React.useState(false);
  const [draft, setDraft] = React.useState(null);        // editable list while cfg is open
  const [draftHeaders, setDraftHeaders] = React.useState([]);  // headers per draft row (for mapping)
  const [studentQ, setStudentQ]     = React.useState('');
  const [passFilter, setPassFilter] = React.useState('all');   // all | pass | fail
  const [companyF, setCompanyF]     = React.useState('');      // '' = all

  const sheets = scoreSheets();
  const cur = sheets[Math.min(selIdx, sheets.length - 1)] || sheets[0];

  const load = React.useCallback((url, force) => {
    if (!url) return;
    setLoading(true); setErr(null);
    fetchScoreSheet(url, force).then(d => { setData(d); setLoading(false); }).catch(e => { setErr(e); setLoading(false); });
  }, []);
  React.useEffect(() => { load(cur && cur.url, false); setCompanyF(''); /* eslint-disable-next-line */ }, [selIdx]);

  const loadHeadersFor = (i, url) => {
    if (!url) return;
    fetchScoreSheet(url, false).then(d => setDraftHeaders(h => { const c = [...h]; c[i] = d.headers; return c; })).catch(() => setDraftHeaders(h => { const c = [...h]; c[i] = null; return c; }));
  };
  const openCfg = () => {
    const d = sheets.map(s => ({ title: s.title || '', url: s.url || '', map: { ...(s.map || {}) } }));
    setDraft(d); setDraftHeaders([]); setCfg(true);
    d.forEach((s, i) => loadHeadersFor(i, s.url));
  };
  const saveCfg = () => {
    const clean = (draft || []).map(s => ({ title: (s.title || '').trim() || tr('មេរៀន','Lesson'), url: (s.url || '').trim(), map: s.map || {} })).filter(s => s.url);
    saveScoreSheets(clean.length ? clean : [{ title: tr('តារាងពិន្ទុ','Scores'), url: SCORE_SHEET_DEFAULT, map:{} }]);
    window.__scoreCache = {};
    setCfg(false); setSelIdx(0); toast(tr('បាន​រក្សាទុក','Saved'), 'good');
    setTimeout(() => load(scoreSheets()[0].url, true), 0);
  };
  const MAP_FIELDS = [
    { k:'date',    label:tr('កាលបរិច្ឆេទ','Date') },
    { k:'student', label:tr('ឈ្មោះ​សិស្ស','Student') },
    { k:'company', label:tr('ក្រុមហ៊ុន','Company') },
    { k:'score',   label:tr('ពិន្ទុ','Score') },
  ];

  const inp = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, fontSize:12.5, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box' };

  // Filter rows by student name, pass/fail, and company.
  const fcols = data ? resolveScoreCols(data.headers, cur) : null;
  const companies = (data && fcols && fcols.company >= 0)
    ? [...new Set(data.rows.map(r => String(r[fcols.company] || '').trim()).filter(Boolean))].sort() : [];
  const filtered = React.useMemo(() => {
    if (!data || !fcols) return data;
    const q = studentQ.trim().toLowerCase();
    const rows = data.rows.filter(r => {
      if (q && fcols.student >= 0 && !String(r[fcols.student] || '').toLowerCase().includes(q)) return false;
      if (companyF && fcols.company >= 0 && String(r[fcols.company] || '').trim() !== companyF) return false;
      if (passFilter !== 'all' && fcols.score >= 0) {
        const p = scorePct(r[fcols.score]); const passed = p != null && p >= SCORE_PASS;
        if (passFilter === 'pass' && !passed) return false;
        if (passFilter === 'fail' && passed) return false;
      }
      return true;
    });
    return { headers: data.headers, rows };
  }, [data, fcols, studentQ, passFilter, companyF]);
  const canFilter = !!(data && fcols && (fcols.student >= 0 || fcols.company >= 0 || fcols.score >= 0));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Hero */}
      <div style={{ position:'relative', borderRadius:20, padding:'15px 16px', color:'#fff',
        background:'linear-gradient(135deg,#243a66,#365a9c 60%,#4f7bc0)', boxShadow:'0 12px 28px rgba(36,58,102,.30)' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:20, pointerEvents:'none' }}>
          <div style={{ position:'absolute', right:-6, bottom:-16, opacity:.14, color:'#fff' }}><Icon name="sheet" size={104} stroke={1.4}/></div>
        </div>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ fontSize:17, fontWeight:800 }}>{tr('តារាង​ពិន្ទុ','Scores')}</div>
          <div style={{ display:'flex', gap:7 }}>
            <button onClick={openCfg} title={tr('គ្រប់គ្រង​តំណ','Manage links')} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff' }}><Icon name="settings" size={15}/></button>
            <button onClick={()=>load(cur && cur.url, true)} title={tr('ធ្វើ​បច្ចុប្បន្នភាព','Refresh')} style={{ display:'inline-flex', alignItems:'center', gap:5, height:32, padding:'0 13px', border:'none', borderRadius:999, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
              <Icon name="download" size={14}/>{tr('ទាញ​ម្ដង​ទៀត','Refresh')}
            </button>
          </div>
        </div>
        {/* Filter: pick a lesson (title only) */}
        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
          <span style={{ fontSize:11.5, opacity:.85 }}>{tr('មេរៀន','Lesson')}</span>
          <select value={Math.min(selIdx, sheets.length-1)} onChange={e=>setSelIdx(+e.target.value)} style={{
            flex:'0 1 260px', maxWidth:'70%', padding:'7px 11px', borderRadius:9, border:'none', cursor:'pointer',
            background:'rgba(255,255,255,.92)', color:'#1a2032', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
            {sheets.map((s, i) => <option key={i} value={i}>{s.title || tr('មេរៀន','Lesson')+' '+(i+1)}</option>)}
          </select>
          <span style={{ fontSize:11.5, opacity:.8, marginLeft:'auto' }}>{loading ? tr('កំពុង​ទាញ...','Loading…') : data ? `${data.rows.length} ${tr('ជួរ','rows')}` : ''}</span>
        </div>
      </div>

      {/* Config: multiple {title, url} */}
      {cfg && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>{tr('តំណ Google Sheet (សាធារណៈ)','Google Sheet links (public)')}</div>
          {(draft || []).map((s, i) => { const hdrs = draftHeaders[i];
            return (
            <div key={i} style={{ border:'1px solid var(--border)', borderRadius:10, padding:11, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                <div style={{ flex:'0 0 140px' }}>
                  <input value={s.title} onChange={e=>setDraft(d=>d.map((x,j)=>j===i?{...x,title:e.target.value}:x))} placeholder={tr('ឈ្មោះ​មេរៀន','Lesson name')} style={inp}/>
                </div>
                <input value={s.url} onChange={e=>setDraft(d=>d.map((x,j)=>j===i?{...x,url:e.target.value}:x))} onBlur={()=>loadHeadersFor(i, s.url)} placeholder="https://docs.google.com/spreadsheets/d/..." style={{ ...inp, flex:1 }}/>
                <button onClick={()=>loadHeadersFor(i, s.url)} title={tr('ផ្ទុក​ជួរ​ឈរ','Load columns')} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-2)', borderRadius:8, width:34, height:34, cursor:'pointer', flexShrink:0 }}>↻</button>
                <button onClick={()=>setDraft(d=>d.filter((_,j)=>j!==i))} title={tr('លុប','Remove')} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-3)', borderRadius:8, width:34, height:34, cursor:'pointer', flexShrink:0 }}>✕</button>
              </div>
              {/* Column mapping — choose which sheet column is which */}
              {hdrs && hdrs.length ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8 }}>
                  {MAP_FIELDS.map(f => (
                    <div key={f.k}>
                      <div style={{ fontSize:10.5, color:'var(--ink-3)', marginBottom:3 }}>{f.label}</div>
                      <select value={(s.map && Number.isInteger(s.map[f.k])) ? s.map[f.k] : ''} onChange={e=>{ const v=e.target.value; setDraft(d=>d.map((x,j)=>j===i?{...x,map:{...(x.map||{}),[f.k]: v===''?undefined:+v}}:x)); }} style={{ ...inp, padding:'7px 9px', fontSize:12 }}>
                        <option value="">{tr('— ស្វ័យ​ប្រវត្តិ —','— auto —')}</option>
                        {hdrs.map((h, ci) => <option key={ci} value={ci}>{h || ('Col '+(ci+1))}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:11, color:'var(--ink-3)' }}>{s.url ? tr('ចុច ↻ ដើម្បី​ផ្ទុក​ជួរ​ឈរ​សម្រាប់​ការ​កំណត់','Click ↻ to load columns for mapping') : ''}</div>
              )}
            </div>
            );
          })}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setDraft(d=>[...(d||[]), { title:'', url:'' }])} style={{ border:'1px dashed var(--border-strong)', background:'transparent', color:'var(--accent)', borderRadius:8, padding:'8px 12px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ {tr('បន្ថែម​តំណ','Add link')}</button>
            <div style={{ flex:1 }}/>
            <button onClick={()=>setCfg(false)} style={{ border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--ink-2)', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{tr('បោះបង់','Cancel')}</button>
            <button onClick={saveCfg} style={{ border:'none', background:'var(--accent)', color:'#fff', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{tr('រក្សាទុក','Save')}</button>
          </div>
        </div>
      )}

      {/* Filters: student name · pass/fail · company */}
      {canFilter && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {fcols.student >= 0 && (
            <input value={studentQ} onChange={e=>setStudentQ(e.target.value)} placeholder={tr('🔍 ស្វែងរក​ឈ្មោះ​សិស្ស...','🔍 Search student name…')}
              style={{ flex:'1 1 200px', minWidth:0, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:9, fontSize:13, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)' }}/>
          )}
          {fcols.score >= 0 && (
            <div style={{ display:'inline-flex', background:'var(--surface-muted)', border:'1px solid var(--border)', borderRadius:9, padding:2 }}>
              {[{k:'all',l:tr('ទាំងអស់','All'),c:'var(--ink)'},{k:'pass',l:tr('ជាប់','Pass'),c:'#2A5DB0'},{k:'fail',l:tr('ធ្លាក់','Fail'),c:'#B0413E'}].map(o => (
                <button key={o.k} onClick={()=>setPassFilter(o.k)} style={{ border:'none', borderRadius:7, padding:'6px 12px', cursor:'pointer', fontSize:12.5, fontWeight:700, fontFamily:'inherit',
                  background: passFilter===o.k ? 'var(--surface)' : 'transparent', color: passFilter===o.k ? o.c : 'var(--ink-3)', boxShadow: passFilter===o.k ? '0 1px 2px rgba(20,30,60,.12)' : 'none' }}>{o.l}</button>
              ))}
            </div>
          )}
          {fcols.company >= 0 && companies.length > 0 && (
            <select value={companyF} onChange={e=>setCompanyF(e.target.value)} style={{ flex:'0 1 200px', padding:'9px 11px', border:'1px solid var(--border)', borderRadius:9, fontSize:13, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', cursor:'pointer' }}>
              <option value="">{tr('ក្រុមហ៊ុន​ទាំងអស់','All companies')}</option>
              {companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          )}
          {(studentQ || passFilter!=='all' || companyF) && (
            <button onClick={()=>{ setStudentQ(''); setPassFilter('all'); setCompanyF(''); }} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-3)', borderRadius:9, padding:'8px 12px', fontSize:12.5, cursor:'pointer', fontFamily:'inherit' }}>{tr('សម្អាត','Clear')}</button>
          )}
          <span style={{ fontSize:11.5, color:'var(--ink-3)', marginLeft:'auto' }}>{filtered ? `${filtered.rows.length}/${data.rows.length} ${tr('ជួរ','rows')}` : ''}</span>
        </div>
      )}

      {loading && !data ? (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--ink-3)', fontSize:13 }}>{tr('កំពុង​ទាញ​តារាង...','Loading the sheet…')}</div>
      ) : err ? <ScoreError err={err} tr={tr}/>
        : data ? <ScoreTable data={filtered || data} tr={tr} sheet={cur}/>
        : null}
    </div>
  );
};

// ── Per-student scores (profile section) — searches every configured sheet ───
const ScoreSheetForStudent = ({ student }) => {
  const { tr } = useAppActions();
  const [hits, setHits] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    const names = [student.name, student.en, student.id].filter(Boolean).map(x => String(x).toLowerCase().trim());
    Promise.allSettled(scoreSheets().map(sh => fetchScoreSheet(sh.url, false).then(d => ({ sh, d }))))
      .then(results => {
        if (!alive) return;
        let anyOk = false; const out = [];
        results.forEach(r => {
          if (r.status !== 'fulfilled') return; anyOk = true;
          const { sh, d } = r.value; const cols = resolveScoreCols(d.headers, sh);
          d.rows.forEach(row => {
            const match = row.some(cell => { const c = String(cell || '').toLowerCase().trim(); return c && names.some(n => n && (c === n || c.includes(n) || n.includes(c))); });
            if (match) out.push({ title: sh.title, cols, row, headers: d.headers });
          });
        });
        setHits(out); setErr(!anyOk); setLoading(false);
      });
    return () => { alive = false; };
  }, []);
  if (loading) return <div style={{ fontSize:12.5, color:'var(--ink-3)', padding:'8px 0' }}>{tr('កំពុង​ទាញ​ពិន្ទុ...','Loading scores…')}</div>;
  if (err) return <div style={{ fontSize:12, color:'var(--ink-3)', padding:'8px 0' }}>{tr('ទាញ​ពិន្ទុ​មិន​បាន — ពិនិត្យ​ការ​ចែករំលែក​សន្លឹក','Couldn\'t load — check sheet sharing')}</div>;
  if (!hits || !hits.length) return <div style={{ fontSize:12.5, color:'var(--ink-3)', padding:'8px 0' }}>{tr('រក​ពិន្ទុ​សិស្ស​នេះ​មិន​ឃើញ','No scores found for this student')}</div>;
  const cell = (h, ci) => (ci >= 0 && h.row[ci] != null ? h.row[ci] : '');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {hits.map((h, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:10, borderLeft:'3px solid '+scoreColor(cell(h, h.cols.score)) }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>{h.title}{h.cols.company>=0 && cell(h,h.cols.company) ? <span style={{ color:'var(--ink-3)', fontWeight:500 }}> · {cell(h,h.cols.company)}</span> : ''}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', fontFamily:'"JetBrains Mono",monospace', marginTop:1 }}>{cell(h, h.cols.date) || '—'}</div>
          </div>
          <div style={{ fontSize:20, fontWeight:800, fontFamily:'"JetBrains Mono",monospace', color:scoreColor(cell(h, h.cols.score)), flexShrink:0 }}>{cell(h, h.cols.score) || '—'}</div>
        </div>
      ))}
    </div>
  );
};
window.ScoreSheetForStudent = ScoreSheetForStudent;
