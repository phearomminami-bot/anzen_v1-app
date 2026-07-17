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
// Normalise a date cell to a comparable YYYYMMDD number (or null). Handles
// 2026-07-10, 2026/7/10, 2026年7月10日, and anything Date can parse.
const parseRowDate = (v) => {
  const s = String(v == null ? '' : v).trim();
  if (!s) return null;
  let m = s.match(/(\d{4})\s*[-/年.]\s*(\d{1,2})\s*[-/月.]\s*(\d{1,2})/);
  if (m) return (+m[1]) * 10000 + (+m[2]) * 100 + (+m[3]);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return null;
};
const dateStrToNum = (s) => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[1]) * 10000 + (+m[2]) * 100 + (+m[3]) : null; };
// Group name of a lesson title = the title with a trailing number stripped.
// e.g. "仮免①" → "仮免", "仮免 10" → "仮免", "本免" → "本免".
// The circled ranges cover ①-⑳ (U+2460-2473), ㉑-㉟ (U+3251-325F) and
// ㊱-㊿ (U+32B1-32BF) so a group can hold up to 50 items, not just 20.
const scoreGroup = (title) => {
  const t = String(title || '').trim();
  const m = t.match(/^(.+?)[\s·・\-]*([①-⑳㉑-㉟㊱-㊿]+|\d+|[IVXivx]+)\s*$/);
  return (m && m[1].trim()) ? m[1].trim() : t;
};
// A sheet's group / item. When stored explicitly (s.group / s.item) they are
// independent — the group name need not relate to the item at all. Older links
// that saved only a combined title fall back to deriving both from the title.
const sheetGroup = (s) => {
  const g = s && s.group;
  return (g != null && String(g).trim() !== '') ? String(g).trim() : scoreGroup(s && s.title);
};
const sheetItem = (s) => {
  if (s && s.item != null && String(s.item).trim() !== '') return String(s.item);
  const t = String((s && s.title) || '');
  const g = scoreGroup(t);
  const rest = (g && t.startsWith(g)) ? t.slice(g.length).replace(/^[\s·・\-]*/, '') : '';
  return rest || t;
};
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
const ScoreTable = ({ data, tr, sheet, compact }) => {
  const cols = resolveScoreCols(data.headers, sheet);
  // Only use the compact 4-column view when we can identify at least the
  // student and the score; otherwise show every column so nothing is hidden.
  const some = cols.student >= 0 && cols.score >= 0;
  // On phones: smaller text, tighter padding, wrap long cells so it fits.
  const pad = compact ? '5px 6px' : '8px 11px';
  const th = { position:'sticky', top:0, zIndex:1, background:'var(--surface-muted)', border:'1px solid var(--border)', padding:pad, fontSize:compact?9:10.5, fontWeight:700, color:'var(--ink-3)', letterSpacing:'.02em', whiteSpace:'nowrap', textAlign:'left', textTransform:'uppercase' };
  const td = { border:'1px solid var(--border)', padding:pad, whiteSpace: compact?'normal':'nowrap', wordBreak: compact?'break-word':'normal', fontSize:compact?11:12.5, fontVariantNumeric:'tabular-nums', verticalAlign:'top' };
  const rowHdr = { border:'1px solid var(--border)', background:'var(--surface-muted)', color:'var(--ink-3)', textAlign:'center', fontFamily:'"JetBrains Mono",monospace', fontSize:compact?9.5:11, width:compact?22:34, padding:compact?'5px 2px':'8px 4px' };
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
      <table style={{ borderCollapse:'collapse', width:'100%', fontSize:compact?11:12.5, minWidth:compact?0:480, tableLayout:compact?'fixed':'auto' }}>
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
  const bp = useBreakpoint();
  const [selIdx, setSelIdx] = React.useState(0);
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [cfg, setCfg] = React.useState(false);
  const [draft, setDraft] = React.useState(null);        // editable list while cfg is open
  const [draftHeaders, setDraftHeaders] = React.useState([]);  // headers per draft row (for mapping)
  const [cfgOpen, setCfgOpen] = React.useState(-1);      // which cfg row is expanded (accordion); -1 = all collapsed
  const [studentQ, setStudentQ]     = React.useState('');
  const [passFilter, setPassFilter] = React.useState('all');   // all | pass | fail
  const [companyF, setCompanyF]     = React.useState('');      // '' = all
  const [fromDate, setFromDate]     = React.useState('');      // 'YYYY-MM-DD'
  const [toDate, setToDate]         = React.useState('');

  const sheets = scoreSheets();
  const cur = sheets[Math.min(selIdx, sheets.length - 1)] || sheets[0];
  // Existing group names — offered as autocomplete suggestions on the add form
  // so you can pick an existing group (e.g. 仮免) instead of retyping it, while
  // still being free to type a brand-new one by hand.
  const allGroups = [...new Set(sheets.map(s => sheetGroup(s)).filter(Boolean))];

  const load = React.useCallback((url, force) => {
    if (!url) return;
    setLoading(true); setErr(null);
    // Tag the loaded rows with the URL they came from so the view can tell when
    // the on-screen data belongs to the currently-selected sheet (see below).
    fetchScoreSheet(url, force).then(d => { setData(d ? { ...d, __url: url } : d); setLoading(false); }).catch(e => { setErr(e); setLoading(false); });
  }, []);
  // Reset only the company filter on an item switch (companies differ per sheet).
  // Keep the date range — it applies across every sheet and should persist until
  // the user clears it with the Clear button.
  React.useEffect(() => { load(cur && cur.url, false); setCompanyF(''); /* eslint-disable-next-line */ }, [selIdx]);

  const loadHeadersFor = (i, url) => {
    if (!url) return;
    fetchScoreSheet(url, false).then(d => setDraftHeaders(h => { const c = [...h]; c[i] = d.headers; return c; })).catch(() => setDraftHeaders(h => { const c = [...h]; c[i] = null; return c; }));
  };
  const openCfg = (addBlank) => {
    // Migrate each row to explicit group/item so they can be edited apart.
    const d = sheets.map(s => ({ group: sheetGroup(s), item: sheetItem(s), url: s.url || '', map: { ...(s.map || {}) } }));
    if (addBlank) d.push({ group: '', item: '', url: '', map: {} });
    setDraft(d); setDraftHeaders([]); setCfgOpen(-1); setCfg(true);
  };
  const saveCfg = () => {
    const clean = (draft || []).map(s => {
      const group = (s.group || '').trim(), item = (s.item || '').trim();
      const title = [group, item].filter(Boolean).join(' ').trim() || tr('មេរៀន','Lesson');
      return { title, group, item, url: (s.url || '').trim(), map: s.map || {} };
    }).filter(s => s.url);
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

  // Quick "add a new link" — a blank form only (no existing links shown).
  const [addMode, setAddMode]     = React.useState(false);
  const [addForm, setAddForm]     = React.useState({ group:'', item:'', url:'', map:{} });
  const [addHeaders, setAddHeaders] = React.useState(null);
  const openAdd = () => { setAddForm({ group:'', item:'', url:'', map:{} }); setAddHeaders(null); setCfg(false); setAddMode(true); };
  const loadAddHeaders = () => { if (!addForm.url.trim()) return; fetchScoreSheet(addForm.url.trim(), false).then(d => setAddHeaders(d.headers)).catch(() => setAddHeaders(null)); };
  const saveAdd = () => {
    const url = addForm.url.trim();
    if (!url) { toast(tr('សូម​ដាក់ URL','Enter a URL'), 'warn'); return; }
    const group = (addForm.group || '').trim();
    const item  = (addForm.item  || '').trim();
    // Store group & item independently. title (used for the profile card label)
    // is the two joined, or whichever is present.
    const title = [group, item].filter(Boolean).join(' ').trim() || tr('មេរៀន','Lesson');
    const list = [...scoreSheets(), { title, group, item, url, map: addForm.map || {} }];
    saveScoreSheets(list); window.__scoreCache = {}; setAddMode(false);
    setSelIdx(list.length - 1); toast(tr('បាន​បន្ថែម​តំណ ✓','Link added ✓'), 'good');
    setTimeout(() => load(list[list.length - 1].url, true), 0);
  };

  const inp = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, fontSize:12.5, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box' };

  // The sheet the on-screen `data` actually belongs to. While a group/item
  // switch is loading, `cur` already points at the new sheet but `data` is still
  // the old one — deriving columns/companies from `viewSheet` (not `cur`) keeps
  // the table, filters and column mapping consistent instead of thrashing, so
  // the swap happens in one clean step rather than reflowing twice (the jitter).
  const viewSheet = (data && data.__url && sheets.find(s => s.url === data.__url)) || cur;
  const switching = loading && (!data || data.__url !== (cur && cur.url));

  // Filter rows by student name, pass/fail, and company.
  const fcols = data ? resolveScoreCols(data.headers, viewSheet) : null;
  const companies = (data && fcols && fcols.company >= 0)
    ? [...new Set(data.rows.map(r => String(r[fcols.company] || '').trim()).filter(Boolean))].sort() : [];
  const filtered = React.useMemo(() => {
    if (!data || !fcols) return data;
    const q = studentQ.trim().toLowerCase();
    const fromN = dateStrToNum(fromDate), toN = dateStrToNum(toDate);
    const rows = data.rows.filter(r => {
      if (q && fcols.student >= 0 && !String(r[fcols.student] || '').toLowerCase().includes(q)) return false;
      if (companyF && fcols.company >= 0 && String(r[fcols.company] || '').trim() !== companyF) return false;
      if (passFilter !== 'all' && fcols.score >= 0) {
        const p = scorePct(r[fcols.score]); const passed = p != null && p >= SCORE_PASS;
        if (passFilter === 'pass' && !passed) return false;
        if (passFilter === 'fail' && passed) return false;
      }
      if ((fromN || toN) && fcols.date >= 0) {
        const dn = parseRowDate(r[fcols.date]);
        if (dn == null) return false;                 // can't confirm the date → exclude
        if (fromN && dn < fromN) return false;
        if (toN && dn > toN) return false;
      }
      return true;
    });
    return { headers: data.headers, rows };
  }, [data, fcols, studentQ, passFilter, companyF, fromDate, toDate]);
  const canFilter = !!(data && fcols && (fcols.student >= 0 || fcols.company >= 0 || fcols.score >= 0 || fcols.date >= 0));

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
            <button onClick={()=>openCfg(false)} title={tr('គ្រប់គ្រង​តំណ','Manage links')} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff' }}><Icon name="settings" size={15}/></button>
            <button onClick={openAdd} title={tr('បន្ថែម​តំណ​ថ្មី','Add new link')} aria-label={tr('បន្ថែម​តំណ​ថ្មី','Add new link')} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff' }}><Icon name="plus" size={16}/></button>
            <button onClick={()=>load(cur && cur.url, true)} title={tr('ធ្វើ​បច្ចុប្បន្នភាព','Refresh')} style={{ display:'inline-flex', alignItems:'center', gap:5, height:32, padding: bp.mobile?'0':'0 13px', width: bp.mobile?32:'auto', justifyContent:'center', border:'none', borderRadius: bp.mobile?10:999, cursor:'pointer', background:'rgba(255,255,255,.18)', color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
              <Icon name="download" size={bp.mobile?15:14}/>{bp.mobile ? '' : tr('ទាញ​ម្ដង​ទៀត','Refresh')}
            </button>
          </div>
        </div>
        {/* Filter: group (仮免) → item (仮免①‐⑩) + quick add-link */}
        {(() => {
          const groups = []; sheets.forEach(s => { const g = sheetGroup(s); if (!groups.includes(g)) groups.push(g); });
          const curGroup = sheetGroup(cur);
          const items = sheets.map((s, i) => ({ s, i })).filter(x => sheetGroup(x.s) === curGroup);
          const selStyle = { padding:'7px 11px', borderRadius:9, border:'none', cursor:'pointer', background:'rgba(255,255,255,.92)', color:'#1a2032', fontSize:13, fontWeight:600, fontFamily:'inherit' };
          return (
            <div style={{ position:'relative', display:'flex', alignItems:'center', gap:7, marginTop:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:11.5, opacity:.85 }}>{tr('មេរៀន','Lesson')}</span>
              {/* Dropdown 1 — group */}
              <select value={curGroup} onChange={e=>{ const g=e.target.value; const first=sheets.findIndex(s=>sheetGroup(s)===g); if(first>=0) setSelIdx(first); }} style={{ ...selStyle, flex:'0 1 150px' }}>
                {groups.map((g, i) => <option key={i} value={g}>{g}</option>)}
              </select>
              {/* Dropdown 2 — items within the group */}
              <select value={Math.min(selIdx, sheets.length-1)} onChange={e=>setSelIdx(+e.target.value)} style={{ ...selStyle, flex:'0 1 150px' }}>
                {items.map(x => <option key={x.i} value={x.i}>{sheetItem(x.s) || tr('មេរៀន','Lesson')+' '+(x.i+1)}</option>)}
              </select>
              <span style={{ fontSize:11.5, opacity:.8, marginLeft:'auto' }}>{loading ? tr('កំពុង​ទាញ...','Loading…') : data ? `${data.rows.length} ${tr('ជួរ','rows')}` : ''}</span>
            </div>
          );
        })()}
      </div>

      {/* Shared group-name suggestions for the add form and the config rows. */}
      <datalist id="scoreGroupList">{allGroups.map((g, i) => <option key={i} value={g}/>)}</datalist>

      {/* Add a new link — blank form only (group · item · url · mapping) */}
      {addMode && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>{tr('បន្ថែម​តំណ​ភ្ជាប់​ថ្មី','Add a new link')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:10.5, color:'var(--ink-3)', marginBottom:3 }}>{tr('ក្រុម','Group')}</div>
              <input value={addForm.group} onChange={e=>setAddForm(f=>({...f,group:e.target.value}))} list="scoreGroupList" autoComplete="off" placeholder={tr('ឧ. 仮免','e.g. 仮免')} style={inp}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--ink-3)', marginBottom:3 }}>{tr('ធាតុ','Item')}</div>
              <input value={addForm.item} onChange={e=>setAddForm(f=>({...f,item:e.target.value}))} placeholder={tr('ឧ. ①','e.g. ①')} style={inp}/>
            </div>
          </div>
          <div>
            <div style={{ fontSize:10.5, color:'var(--ink-3)', marginBottom:3 }}>{tr('តំណ Google Sheet (សាធារណៈ)','Google Sheet link (public)')}</div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={addForm.url} onChange={e=>setAddForm(f=>({...f,url:e.target.value}))} onBlur={loadAddHeaders} placeholder="https://docs.google.com/spreadsheets/d/..." style={{ ...inp, flex:1 }}/>
              <button onClick={loadAddHeaders} title={tr('ផ្ទុក​ជួរ​ឈរ','Load columns')} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-2)', borderRadius:8, width:34, height:34, cursor:'pointer', flexShrink:0 }}>↻</button>
            </div>
          </div>
          {addHeaders && addHeaders.length ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8 }}>
              {MAP_FIELDS.map(f => (
                <div key={f.k}>
                  <div style={{ fontSize:10.5, color:'var(--ink-3)', marginBottom:3 }}>{f.label}</div>
                  <select value={(addForm.map && Number.isInteger(addForm.map[f.k])) ? addForm.map[f.k] : ''} onChange={e=>{ const v=e.target.value; setAddForm(fm=>({...fm,map:{...(fm.map||{}),[f.k]: v===''?undefined:+v}})); }} style={{ ...inp, padding:'7px 9px', fontSize:12 }}>
                    <option value="">{tr('— ស្វ័យ​ប្រវត្តិ —','— auto —')}</option>
                    {addHeaders.map((h, ci) => <option key={ci} value={ci}>{h || ('Col '+(ci+1))}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={()=>setAddMode(false)} style={{ border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--ink-2)', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{tr('បោះបង់','Cancel')}</button>
            <button onClick={saveAdd} style={{ border:'none', background:'var(--accent)', color:'#fff', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{tr('បន្ថែម','Add')}</button>
          </div>
        </div>
      )}

      {/* Config: multiple {title, url} */}
      {cfg && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:13, fontWeight:700 }}>{tr('តំណ Google Sheet (សាធារណៈ)','Google Sheet links (public)')}</div>
          {(draft || []).map((s, i) => { const hdrs = draftHeaders[i]; const open = cfgOpen === i;
            const toggle = () => { const willOpen = !open; setCfgOpen(willOpen ? i : -1); if (willOpen && !hdrs && s.url) loadHeadersFor(i, s.url); };
            const iconBtn = { border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-3)', borderRadius:8, width:32, height:32, cursor:'pointer', flexShrink:0, fontSize:13, lineHeight:1 };
            return (
            <div key={i} style={{ border:'1px solid '+(open?'var(--accent)':'var(--border)'), borderRadius:10, padding:'7px 8px', display:'flex', flexDirection:'column', gap:8 }}>
              {/* Compact one-line row: title · url · load · expand-mapping · remove */}
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input value={s.group||''} onChange={e=>setDraft(d=>d.map((x,j)=>j===i?{...x,group:e.target.value}:x))} list="scoreGroupList" autoComplete="off" placeholder={tr('ក្រុម','Group')} title={tr('ក្រុម','Group')} style={{ ...inp, flex:'0 0 92px', padding:'7px 9px' }}/>
                <input value={s.item||''} onChange={e=>setDraft(d=>d.map((x,j)=>j===i?{...x,item:e.target.value}:x))} placeholder={tr('ធាតុ','Item')} title={tr('ធាតុ','Item')} style={{ ...inp, flex:'0 0 84px', padding:'7px 9px' }}/>
                <input value={s.url} onChange={e=>setDraft(d=>d.map((x,j)=>j===i?{...x,url:e.target.value}:x))} onBlur={()=>{ if (open) loadHeadersFor(i, s.url); }} placeholder="https://docs.google.com/spreadsheets/d/..." style={{ ...inp, flex:1, minWidth:0, padding:'7px 9px', textOverflow:'ellipsis' }}/>
                <button onClick={toggle} title={tr('កំណត់​ជួរ​ឈរ','Column mapping')} style={{ ...iconBtn, color: open?'var(--accent)':'var(--ink-3)', borderColor: open?'var(--accent)':'var(--border)' }}>{open ? '▾' : '⚙'}</button>
                <button onClick={()=>{ setDraft(d=>d.filter((_,j)=>j!==i)); setCfgOpen(-1); }} title={tr('លុប','Remove')} style={iconBtn}>✕</button>
              </div>
              {/* Column mapping — only for the expanded row */}
              {open && (hdrs && hdrs.length ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8, paddingTop:2 }}>
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
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--ink-3)', paddingTop:2 }}>
                  <button onClick={()=>loadHeadersFor(i, s.url)} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-2)', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>↻ {tr('ផ្ទុក​ជួរ​ឈរ','Load columns')}</button>
                  <span>{s.url ? tr('ដើម្បី​កំណត់​ជួរ​ឈរ','to map columns') : tr('ដាក់ URL សិន','enter a URL first')}</span>
                </div>
              ))}
            </div>
            );
          })}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setDraft(d=>[...(d||[]), { group:'', item:'', url:'', map:{} }])} style={{ border:'1px dashed var(--border-strong)', background:'transparent', color:'var(--accent)', borderRadius:8, padding:'8px 12px', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ {tr('បន្ថែម​តំណ','Add link')}</button>
            <div style={{ flex:1 }}/>
            <button onClick={()=>setCfg(false)} style={{ border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--ink-2)', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{tr('បោះបង់','Cancel')}</button>
            <button onClick={saveCfg} style={{ border:'none', background:'var(--accent)', color:'#fff', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{tr('រក្សាទុក','Save')}</button>
          </div>
        </div>
      )}

      {/* Filters: student name · pass/fail · company · date. Compact on mobile. */}
      {canFilter && (() => {
        const m = bp.mobile;
        const fsz = m ? 12 : 13, fpad = m ? '7px 10px' : '9px 12px';
        return (
        <div style={{ display:'flex', gap:m?6:8, flexWrap:'wrap', alignItems:'center' }}>
          {fcols.student >= 0 && (
            <input value={studentQ} onChange={e=>setStudentQ(e.target.value)} placeholder={tr('🔍 ស្វែងរក​ឈ្មោះ​សិស្ស...','🔍 Search student name…')}
              style={{ flex: m?'1 1 100%':'1 1 200px', minWidth:0, padding:fpad, border:'1px solid var(--border)', borderRadius:9, fontSize:fsz, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)' }}/>
          )}
          {fcols.score >= 0 && (
            <div style={{ display:'inline-flex', flex:m?'1 1 auto':'0 0 auto', background:'var(--surface-muted)', border:'1px solid var(--border)', borderRadius:9, padding:2 }}>
              {[{k:'all',l:tr('ទាំងអស់','All'),c:'var(--ink)'},{k:'pass',l:tr('ជាប់','Pass'),c:'#2A5DB0'},{k:'fail',l:tr('ធ្លាក់','Fail'),c:'#B0413E'}].map(o => (
                <button key={o.k} onClick={()=>setPassFilter(o.k)} style={{ flex:m?1:'none', border:'none', borderRadius:7, padding:m?'6px 8px':'6px 12px', cursor:'pointer', fontSize:m?11.5:12.5, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap',
                  background: passFilter===o.k ? 'var(--surface)' : 'transparent', color: passFilter===o.k ? o.c : 'var(--ink-3)', boxShadow: passFilter===o.k ? '0 1px 2px rgba(20,30,60,.12)' : 'none' }}>{o.l}</button>
              ))}
            </div>
          )}
          {fcols.company >= 0 && companies.length > 0 && (
            <select value={companyF} onChange={e=>setCompanyF(e.target.value)} style={{ flex: m?'1 1 46%':'0 1 200px', padding:fpad, border:'1px solid var(--border)', borderRadius:9, fontSize:fsz, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', cursor:'pointer' }}>
              <option value="">{tr('ក្រុមហ៊ុន​ទាំងអស់','All companies')}</option>
              {companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          )}
          {fcols.date >= 0 && (
            <div style={{ display:'inline-flex', flex:m?'1 1 100%':'0 0 auto', alignItems:'center', gap:5, border:'1px solid var(--border)', borderRadius:9, padding:'3px 8px', background:'var(--surface)' }}>
              <span style={{ fontSize:11, color:'var(--ink-3)' }}>{tr('ពី','From')}</span>
              <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{ flex:m?1:'none', minWidth:0, border:'none', background:'transparent', color:'var(--ink)', fontSize:m?11:12.5, fontFamily:'inherit' }}/>
              <span style={{ fontSize:11, color:'var(--ink-3)' }}>{tr('ដល់','to')}</span>
              <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{ flex:m?1:'none', minWidth:0, border:'none', background:'transparent', color:'var(--ink)', fontSize:m?11:12.5, fontFamily:'inherit' }}/>
            </div>
          )}
          {(studentQ || passFilter!=='all' || companyF || fromDate || toDate) && (
            <button onClick={()=>{ setStudentQ(''); setPassFilter('all'); setCompanyF(''); setFromDate(''); setToDate(''); }} style={{ border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink-3)', borderRadius:9, padding:m?'6px 10px':'8px 12px', fontSize:m?11.5:12.5, cursor:'pointer', fontFamily:'inherit' }}>{tr('សម្អាត','Clear')}</button>
          )}
          <span style={{ fontSize:11, color:'var(--ink-3)', marginLeft:'auto' }}>{filtered ? `${filtered.rows.length}/${data.rows.length} ${tr('ជួរ','rows')}` : ''}</span>
        </div>
        );
      })()}

      {loading && !data ? (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--ink-3)', fontSize:13 }}>{tr('កំពុង​ទាញ​តារាង...','Loading the sheet…')}</div>
      ) : err ? <ScoreError err={err} tr={tr}/>
        : data ? (
          <div style={{ position:'relative' }}>
            {/* While switching sheets, freeze the current table (dimmed + not
                clickable) so nothing reflows under the finger; it's replaced in
                one step when the new sheet's rows arrive. */}
            <div style={{ opacity: switching ? 0.35 : 1, pointerEvents: switching ? 'none' : 'auto', transition:'opacity .15s ease' }}>
              <ScoreTable data={filtered || data} tr={tr} sheet={viewSheet} compact={bp.mobile}/>
            </div>
            {switching && (
              <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'5px 14px', fontSize:12, color:'var(--ink-3)', boxShadow:'0 4px 14px rgba(20,30,60,.12)', whiteSpace:'nowrap' }}>{tr('កំពុង​ទាញ...','Loading…')}</div>
            )}
          </div>
        )
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
            // Match ONLY the student-name column (fall back to the whole row if
            // the sheet has no student column). Strict: the name cell must equal
            // or contain the student's full name — never the reverse, so a short
            // value like "T" can't match because a name happens to contain "t".
            const nameCell = cols.student >= 0
              ? String(row[cols.student] || '').toLowerCase().trim()
              : row.map(c => String(c || '')).join(' ').toLowerCase();
            if (!nameCell) return;
            const match = names.some(n => n && n.length >= 2 && (nameCell === n || nameCell.includes(n)));
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
