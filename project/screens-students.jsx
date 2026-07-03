// screens-students.jsx — Students management (fully editable)

// Normalise a class value — single letter ('B'), Khmer letter ('ខ'), or long
// label ('ខ (ឡានបួនកង់)') — to its letter code, so edit pre-fill and filters
// stay consistent regardless of how the value was stored.
const clsLetter = (v) => {
  if (!v) return 'B';
  const s = String(v).trim();
  if (/^[A-E]$/i.test(s)) return s.toUpperCase();
  const km = { 'ក':'A', 'ខ':'B', 'គ':'C', 'ឃ':'D', 'ង':'E' };
  return km[s[0]] || 'B';
};
// Khmer class letter for display ('ខ' not the long 'ខ (ឡានបួនកង់)' label),
// so the list shows exactly the letter that was entered in the form.
const CLS_KM = { 'A':'ក', 'B':'ខ', 'C':'គ', 'D':'ឃ', 'E':'ង' };
const clsKm = (v) => CLS_KM[clsLetter(v)] || 'ខ';
// English student-type label for the list badge.
const ST_TYPE_EN = { 'ធម្មតា':'Regular', 'ពិសេស':'Special', 'SSW':'SSW' };
const stTypeEn = (t) => ST_TYPE_EN[t] || 'Regular';

// A student is "graduated" once explicitly marked finished. Graduated students
// are hidden from the active lists/pickers but kept under the "Completed" filter.
// Reversible — clearing the flag restores them everywhere.
// A student is archived ("graduated") only when they have FINISHED a phase and
// have NO phase currently in progress. If any phase is "starting", they're still
// active and must show up in the normal lists — even if another phase is done.
const isGraduated = (s) => {
  if (!s) return false;
  const vals = Object.values(s.phaseStatus || {});
  if (vals.includes('starting')) return false;            // actively pursuing a phase
  if (vals.includes('finished')) return true;             // finished, nothing in progress
  if (s.phaseDone && Object.values(s.phaseDone).some(Boolean) && !vals.length) return true; // legacy phaseDone
  return !!s.graduated;                                    // legacy / manual graduation
};
if (typeof window !== 'undefined') window.__isGraduated = isGraduated;

// Pure-Khmer lesson type label (no English/Japanese), derived from the colour
// code so it's consistent regardless of what was stored in l.type.
const lessonTypeKm = (l) => {
  if (!l) return 'មេរៀន';
  if (l.color === 'c' || l.color === 'e') return 'ទ្រឹស្ដី';
  return 'អនុវត្តន៍';
};

// Expandable lesson row: tap to rate, note strengths/weaknesses and add a
// comment. Saves back onto the lesson via onSave.
// Curriculum lessons (from Tab Lessons) selected for a scheduled lesson —
// shown as number + name so each entry lists what was covered.
const lessonsCoveredByIds = (lessonIds, lessonNo) => {
  const lib = (typeof window !== 'undefined' && window.__lessonsLib) || {};
  const all = [...(lib.theoryTexts||[]), ...(lib.practicalTexts||[]), ...(lib.theoryVideos||[]), ...(lib.practicalVideos||[])];
  const num = (no) => { const m = String(no||'').match(/\d+/); return m ? m[0] : String(no||'').trim(); };
  if (Array.isArray(lessonIds) && lessonIds.length) {
    return lessonIds.map(id => { const u = all.find(x => x.id === id); return u ? { no: num(u.no), name: u.km || u.en || '' } : null; }).filter(Boolean);
  }
  if (lessonNo) return String(lessonNo).split(',').map(x => ({ no: num(x), name: '' })).filter(c => c.no);
  return [];
};
const lessonsCoveredBy = (l) => lessonsCoveredByIds(l.lessonIds, l.lessonNo);

// ── Per-hour lesson records ────────────────────────────────────────────────
// A scheduled lesson may span several hours; the record book lists each hour on
// its own line so every hour can be evaluated separately. Hour 0 keeps using the
// lesson's own fields (so existing data + the calendar stay in sync); extra hours
// store their rating/notes/curriculum in l.hourNotes[offset]. Status stays
// lesson-level (shared) so the hours-completed total is unaffected.
const lessonHourSlices = (l) => {
  const n = Math.max(1, Math.round((l && l.len) || 1));
  const out = [];
  for (let o = 0; o < n; o++) out.push({ offset: o, h: ((l && l.h) || 0) + o, total: n });
  return out;
};
const hourFbOf = (l, o) => {
  const src = o === 0 ? l : ((l.hourNotes && l.hourNotes[o]) || {});
  return {
    rating: src.rating || 0, didWell: src.didWell || '', toImprove: src.toImprove || '',
    note: src.note || '', status: l.status || 'pending',
    lessonIds: Array.isArray(src.lessonIds) ? src.lessonIds : [], lessonNo: src.lessonNo || '',
  };
};
// Cumulative lesson-hour numbering, oldest-first, skipping cancelled lessons.
// Theory and Practical each keep their OWN running count → {lessonId:[n0,n1,…]}.
const buildHourNumbering = (lessons) => {
  const isTh = (l) => l.color === 'c' || l.color === 'e';
  const chrono = lessons.filter(l => l.status !== 'cancelled').slice()
    .sort((a,b)=>{ const ka=(a.date||'')+' '+String(a.h||0).padStart(2,'0'), kb=(b.date||'')+' '+String(b.h||0).padStart(2,'0'); return ka<kb?-1:ka>kb?1:0; });
  const map = {}; let accT = 0, accP = 0;
  chrono.forEach(l => {
    const n = Math.max(1, Math.round(l.len||1));
    const theory = isTh(l);
    const start = theory ? accT : accP;
    const nums = [];
    for (let i=0;i<n;i++) nums.push(start+1+i);
    if (theory) accT += n; else accP += n;
    map[l.id] = nums;
  });
  return map;
};

// Curriculum lessons (from Tab Lessons) grouped by type, for the feedback picker.
const lessonLibGroups = () => {
  const lib = (typeof window !== 'undefined' && window.__lessonsLib) || {};
  return { theory: lib.theoryTexts || [], practical: lib.practicalTexts || [] };
};
const lessonNumOf = (no) => { const m = String(no||'').match(/\d+/); return m ? m[0] : String(no||'').trim(); };

const CvLessonRow = ({ l, offset = 0, h, total = 1, cumNo, tr, onSave }) => {
  const fb0 = hourFbOf(l, offset);
  const hr  = (h == null ? (l.h || 0) : h);
  const pad = (n) => String(n).padStart(2, '0');
  const timeLabel = `${pad(hr)}:00–${pad(hr+1)}:00`;
  const cancelled = l.status === 'cancelled';   // "change day" in the schedule
  const isTheory  = (l.color === 'c' || l.color === 'e');   // theory vs practical lesson
  const [open, setOpen]           = React.useState(false);
  const covered = lessonsCoveredByIds(fb0.lessonIds, fb0.lessonNo);
  const [rating, setRating]       = React.useState(fb0.rating);
  const [didWell, setDidWell]     = React.useState(fb0.didWell);
  const [toImprove, setToImprove] = React.useState(fb0.toImprove);
  const [note, setNote]           = React.useState(fb0.note);
  const [done, setDone]           = React.useState(fb0.status === 'done');
  const [lessonIds, setLessonIds] = React.useState([...fb0.lessonIds]);
  const groups = lessonLibGroups();
  const allLib = [...groups.theory, ...groups.practical];
  const fieldStyle = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box', resize:'vertical' };
  const lbl = { fontSize:11, color:'var(--ink-3)', fontWeight:600, margin:'10px 0 4px' };
  const resetFields = () => { setRating(fb0.rating); setDidWell(fb0.didWell); setToImprove(fb0.toImprove); setNote(fb0.note); setDone(fb0.status==='done'); setLessonIds([...fb0.lessonIds]); };
  // The evaluation form opens in a separate popup (Modal), not inline.
  const openEval  = () => { resetFields(); setOpen(true); };
  const closeEval = () => { resetFields(); setOpen(false); };
  const save = () => {
    const selObjs  = allLib.filter(u => lessonIds.includes(u.id));
    const lessonNo = selObjs.map(u => u.no).filter(Boolean).join(', ');   // short code for the calendar
    onSave(l, { rating, didWell: didWell.trim(), toImprove: toImprove.trim(), note: note.trim(), status: done ? 'done' : 'pending', lessonIds: [...lessonIds], lessonNo }, offset);
    setOpen(false);
  };
  const stars = (n) => <span style={{color:'var(--gold)',letterSpacing:1}}>{'★'.repeat(n)}<span style={{color:'var(--border-strong)'}}>{'★'.repeat(5-n)}</span></span>;
  return (
    <div style={{borderBottom:'1px solid var(--border)', opacity: cancelled ? .55 : 1}}>
      <button onClick={openEval} style={{
        width:'100%', textAlign:'left', background:'transparent', border:'none', cursor:'pointer',
        padding:'10px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10,
      }}>
        <div style={{minWidth:0}}>
          <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:12.5,fontWeight:600,color:'var(--ink)',textDecoration:cancelled?'line-through':'none'}}>{l.date}</span>
            <span style={{fontSize:11.5,fontWeight:600,color:'var(--accent)',fontFamily:'monospace'}}>{timeLabel}</span>
            {/* Running Theory/Practical hour count — italic so it isn't read as a date. */}
            {cumNo != null && <span style={{fontSize:12,fontStyle:'italic',fontWeight:700,color:'var(--accent)'}}>({cumNo})</span>}
          </div>
          <div style={{fontSize:12,color:'var(--ink-2)',marginTop:1}}>{lessonTypeKm(l)}{total > 1 ? ` · ${tr('ម៉ោងទី','Hr')} ${offset+1}/${total}` : ''}</div>
          {covered.length > 0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:3}}>
              {covered.map((c,i)=>(
                <span key={i} style={{fontSize:10.5,padding:'1px 7px',borderRadius:5,background:'var(--accent-soft)',color:'var(--accent)',whiteSpace:'nowrap'}}>
                  <b>{c.no}</b>{c.name ? ' · '+c.name : ''}
                </span>
              ))}
            </div>
          )}
          {(fb0.rating > 0) && <div style={{fontSize:12,color:'var(--gold)',marginTop:1,letterSpacing:1}}>{'★'.repeat(fb0.rating)}<span style={{color:'var(--border-strong)'}}>{'★'.repeat(5-fb0.rating)}</span></div>}
          {fb0.note && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fb0.note}</div>}
        </div>
        <span style={{fontSize:11,color:cancelled?'var(--warn)':fb0.status==='done'?'var(--good)':'var(--ink-3)',fontWeight:500,flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
          {cancelled?tr('បានប្ដូរថ្ងៃ','Changed'):fb0.status==='done'?tr('រួចរាល់','Done'):tr('កំពុង','Pending')}
          <Icon name="edit" size={13} stroke={2}/>
        </span>
      </button>
      {open && (
        <Modal open onClose={closeEval} width={460}>
          <div style={{padding:20,maxHeight:'86vh',overflowY:'auto'}}>
            {/* Navy title bar — bleeds to the modal edges, white text */}
            <div style={{background:'var(--accent)',color:'#fff',padding:'12px 20px',margin:'-20px -20px 16px'}}>
              <div style={{fontSize:15,fontWeight:700}}>{tr('វាយ​តម្លៃ​មេរៀន','Lesson evaluation')}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.82)',marginTop:2}}>
                {l.date} · <span style={{fontFamily:'monospace',fontWeight:600}}>{timeLabel}</span>{cumNo!=null?` · (${cumNo})`:''} · {lessonTypeKm(l)}
              </div>
            </div>

            <div style={lbl}>{tr('មេរៀន (ពី Tab Lessons)','Lessons (from Tab Lessons)')}</div>
            {lessonIds.length > 0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                {allLib.filter(u=>lessonIds.includes(u.id)).map(u=>(
                  <div key={u.id} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 9px',
                    background:'var(--accent-soft)',border:'1px solid var(--accent)',borderRadius:6,
                    fontSize:12,fontWeight:500,color:'var(--accent)'}}>
                    {u.no ? lessonNumOf(u.no)+' · ' : ''}{tr(u.km,u.en)}
                    <button onClick={()=>setLessonIds(prev=>prev.filter(x=>x!==u.id))} style={{
                      border:'none',background:'none',cursor:'pointer',color:'var(--accent)',
                      fontSize:14,lineHeight:1,padding:0,display:'flex',alignItems:'center'}}>×</button>
                  </div>
                ))}
              </div>
            )}
            {allLib.length === 0 ? (
              <div style={{fontSize:12,color:'var(--ink-3)'}}>{tr('មិនទាន់មានមេរៀននៅ Tab Lessons','No lessons defined in Tab Lessons')}</div>
            ) : (
              <select value="" onChange={e=>{ const id=e.target.value; if(id && !lessonIds.includes(id)) setLessonIds(prev=>[...prev,id]); }} style={fieldStyle}>
                {/* Only offer curriculum matching this lesson's type: theory→theory, practical→practical. */}
                <option value="">+ {tr('បន្ថែម​មេរៀន','Add lesson')}</option>
                {(isTheory ? groups.theory : groups.practical).filter(u=>!lessonIds.includes(u.id)).map(u=>(
                  <option key={u.id} value={u.id}>{u.no?lessonNumOf(u.no)+' · ':''}{tr(u.km,u.en)}</option>
                ))}
              </select>
            )}

            <div style={lbl}>{tr('ស្ថានភាព','Status')}</div>
            <div style={{display:'flex',gap:6}}>
              {[[false,tr('កំពុង','Pending')],[true,tr('រួចរាល់','Done')]].map(([v,t])=>(
                <button key={String(v)} onClick={()=>setDone(v)} style={{
                  flex:1,padding:'7px 0',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit',
                  border:`1.5px solid ${done===v?'var(--accent)':'var(--border)'}`,
                  background:done===v?'var(--accent-soft)':'var(--surface)',color:done===v?'var(--accent)':'var(--ink-2)',
                }}>{t}</button>
              ))}
            </div>

            <div style={lbl}>{tr('វាយតម្លៃ','Rating')}</div>
            <div style={{display:'flex',gap:6}}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setRating(n===rating?0:n)} style={{
                  background:'none',border:'none',cursor:'pointer',padding:0,fontSize:28,lineHeight:1,
                  color: n<=rating ? 'var(--gold)' : 'var(--border-strong)',
                }}>★</button>
              ))}
            </div>

            <div style={lbl}>{tr('ធ្វើ​បាន​ល្អ','Did well')}</div>
            <input value={didWell} onChange={e=>setDidWell(e.target.value)} placeholder={tr('ឧ. បញ្ជា​ចង្កូត​បាន​ល្អ','e.g. good steering control')} style={fieldStyle}/>

            <div style={lbl}>{tr('ខ្វះខាត​ត្រូវ​កែ','Needs work')}</div>
            <input value={toImprove} onChange={e=>setToImprove(e.target.value)} placeholder={tr('ឧ. ត្រូវ​ហ្វឹកហាត់​ចតរថយន្ត','e.g. practise parking')} style={fieldStyle}/>

            <div style={lbl}>{tr('មតិ​បន្ថែម','Comment')}</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder={tr('💬 មតិ​គ្រូ​លើ​មេរៀន​នេះ...','💬 Instructor comment...')} style={fieldStyle}/>

            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={closeEval} style={{flex:1,padding:'11px',borderRadius:8,border:'1px solid var(--border-strong)',
                background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>{tr('បោះបង់','Cancel')}</button>
              <button onClick={save} style={{flex:2,padding:'11px',borderRadius:8,border:'none',
                background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'inherit'}}>{tr('រក្សា​ទុក','Save')}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Print a student's lessons + exams (with feedback / results) as an A4 PDF.
// Eye condition (was "glasses"): Normal / Glasses / Contact Lens.
// NB: distinct from forms.jsx EYE_OPTS (the vision-value list) — different name.
const EYE_COND_OPTS = [
  { v:'ធម្មតា',        en:'Normal' },
  { v:'វ៉ែនតា',        en:'Glasses' },
  { v:'កែវ​ប៉ះ​ភ្នែក',  en:'Contact Lens' },
];
// Normalise legacy values (មិនពាក់/ពាក់) to the new option set.
const normEye = (v) => v==='មិនពាក់' ? 'ធម្មតា' : v==='ពាក់' ? 'វ៉ែនតា' : (v || 'ធម្មតា');
const eyeEn   = (v) => { const o = EYE_COND_OPTS.find(x => x.v === normEye(v)); return o ? o.en : (v || ''); };

// Translate short free-text feedback to the target language via the configured
// Anthropic key. Returns a map original→translation, or {} if no key / failure.
const translateFeedbackTexts = async (texts, target) => {
  const key = (window.__schoolSettings || {}).anthropicKey;
  const list = [...new Set((texts||[]).filter(Boolean))];
  if (!key || !list.length) return {};
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':key, 'anthropic-version':'2023-06-01', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:1500,
        messages:[{ role:'user', content:
          'Translate each item in this JSON array of short driving-lesson feedback notes to ' + (target==='en'?'natural English':'ខ្មែរ') +
          '. Keep them concise. Return ONLY a JSON array of strings in the same order, nothing else.\n\n' + JSON.stringify(list) }] })
    });
    if (!r.ok) return {};
    const j = await r.json();
    const txt = (j.content && j.content[0] && j.content[0].text) || '';
    const m = txt.match(/\[[\s\S]*\]/);
    const arr = m ? JSON.parse(m[0]) : null;
    if (!Array.isArray(arr) || arr.length !== list.length) return {};
    const map = {};
    list.forEach((k,i)=>{ if (typeof arr[i] === 'string') map[k] = arr[i]; });
    return map;
  } catch (e) { return {}; }
};

const printStudentLessonsPDF = (s, lessons, exams, lang) => {
  if (!s) return;
  lang = lang === 'en' ? 'en' : 'km';
  // Render in an in-app overlay with a Back button — NOT a new tab/window, which
  // traps mobile/PWA users with no way back. An <iframe> isolates the A4
  // record-book styles from the app. Fill it after any async translation.
  const HOST_ID = '__anzenStuPdfHost';
  document.getElementById(HOST_ID)?.remove();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#e8e8e8;display:flex;flex-direction:column;-webkit-overflow-scrolling:touch';
  const titleTxt = String(s.name || s.en || '').replace(/[&<>]/g, '');
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:space-between;flex-shrink:0;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;background:#1a1a19;color:#fff;box-shadow:0 1px 8px rgba(0,0,0,.3)';
  bar.innerHTML =
    '<button id="__stuBack" style="flex-shrink:0;display:inline-flex;align-items:center;gap:6px;border:none;background:rgba(255,255,255,.18);color:#fff;font-size:15px;font-weight:600;padding:10px 16px;border-radius:9px;cursor:pointer">⬅ ' + (lang==='en'?'Back':'ត្រឡប់') + '</button>'
    + '<span style="flex:1;min-width:0;text-align:center;font-size:12px;font-weight:600;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + titleTxt + '</span>'
    + '<button id="__stuPrint" style="flex-shrink:0;display:inline-flex;align-items:center;gap:6px;border:none;background:#2a5db0;color:#fff;font-size:15px;font-weight:700;padding:10px 16px;border-radius:9px;cursor:pointer">🖨 ' + (lang==='en'?'Print / PDF':'បោះពុម្ព') + '</button>';
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'flex:1;width:100%;border:none;background:#e8e8e8';
  host.appendChild(bar); host.appendChild(iframe);
  document.body.appendChild(host);
  bar.querySelector('#__stuBack').onclick  = () => host.remove();
  bar.querySelector('#__stuPrint').onclick = () => { try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch(e){} };
  try { const ld = iframe.contentWindow.document; ld.open(); ld.write('<!DOCTYPE html><body style="font-family:system-ui,sans-serif;padding:40px;color:#555;font-size:15px">' + (lang==='en'?'Preparing the document…':'កំពុង​រៀបចំ​ឯកសារ…') + '</body>'); ld.close(); } catch(e){}
  (async () => {
  const L = (km, en) => lang === 'en' ? en : km;   // structural labels only — entered data is left as-is
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const ss = window.__schoolSettings || {};
  const school = ss.name || 'Anzen';
  const sid = s.id;
  const schoolEn = ss.nameEn || '';
  const logo = ss.logo || '';
  const isUrl = (x) => typeof x === 'string' && /^(data:|https?:)/.test(x);
  const typeKm = (l) => (l.color==='c'||l.color==='e') ? L('ទ្រឹស្ដី','Theory') : L('អនុវត្តន៍','Practical');
  const stars = (n) => '★'.repeat(n||0) + '☆'.repeat(5-(n||0));

  // Translate enumerable data values (not free text) to the chosen language.
  const trGender = (g) => g==='M' ? L('ប្រុស','Male') : g==='F' ? L('ស្រី','Female') : (g||'');
  const trNat = (v) => { if(!v) return ''; const m={'ខ្មែរ':'Khmer','ខ្មែរ​':'Khmer'}; return lang==='en' ? (m[v]||v) : v; };
  const trGlasses = (v) => { if(!v) return ''; return lang==='en' ? eyeEn(v) : normEye(v); };
  // Covered curriculum lessons, names in the chosen language (library has km+en).
  const coveredFor = (lessonIds, lessonNo) => {
    const lib = (typeof window !== 'undefined' && window.__lessonsLib) || {};
    const all = [...(lib.theoryTexts||[]), ...(lib.practicalTexts||[]), ...(lib.theoryVideos||[]), ...(lib.practicalVideos||[])];
    const num = (no)=>{ const m=String(no||'').match(/\d+/); return m?m[0]:String(no||'').trim(); };
    if (Array.isArray(lessonIds) && lessonIds.length) {
      return lessonIds.map(id=>{ const u=all.find(x=>x.id===id); if(!u) return null; const name = lang==='en' ? (u.en||u.km||'') : (u.km||u.en||''); return {no:num(u.no), name}; }).filter(Boolean);
    }
    if (lessonNo) return String(lessonNo).split(',').map(x=>({no:num(x),name:''})).filter(c=>c.no);
    return [];
  };

  // For the English export, machine-translate Khmer free-text feedback (if a key
  // is set). T(x) returns the translation when available, else the original.
  let txMap = {};
  if (lang === 'en') {
    const hasKh = (x) => typeof x==='string' && /[ក-៿]/.test(x);
    const src = [];
    lessons.forEach(l => { lessonHourSlices(l).forEach(sl => { const f = hourFbOf(l, sl.offset); [f.didWell, f.toImprove, f.note].forEach(v=>{ if(hasKh(v)) src.push(v); }); }); });
    exams.forEach(e => { const r=(e.results&&e.results[sid])||{}; [r.failLocation, r.failReason].forEach(v=>{ if(hasKh(v)) src.push(v); }); });
    if (src.length) txMap = await translateFeedbackTexts(src, 'en');
  }
  const T = (x) => (x && txMap[x]) ? txMap[x] : x;

  // ── Row renderers (reused inside each phase's table) ────────────────────────
  const examRowHtml = (e) => {
    const r = (e.results && e.results[sid]) || {};
    const km = window.__SCHED_KIND ? window.__SCHED_KIND(e.kind) : {km:'ប្រឡង',en:'Exam',icon:'🎓',color:'#12A302'};
    const ins = (e.instIds||[]).map(id=>{ const it=instById(id); return it?esc(it.en||it.name):null; }).filter(Boolean).join(', ') || '—';
    const isApply = e.kind === 'apply';
    const isFail = !isApply && r.result === 'fail';
    const badge = isApply ? '—' : (r.result==='pass' ? `<b style="color:#12A302">${L('ជាប់','Pass')} ✓</b>` : (r.result==='fail') ? `<b style="color:#B0413E">${L('ធ្លាក់','Fail')} ✗</b>` : '—');
    const failInfo = isFail ? `${r.failLocation?'<div>📍 '+esc(T(r.failLocation))+'</div>':''}${r.failReason?'<div style="color:#7a2b29">'+esc(T(r.failReason))+'</div>':''}` : '';
    const bg = isApply ? '#fff8e1' : (isFail ? '#fbeceb' : '#eafbe7');
    return `<tr style="background:${bg};-webkit-print-color-adjust:exact;print-color-adjust:exact">
      <td style="white-space:nowrap;font-family:monospace;color:${km.color};font-weight:700">${esc(e.date)}<br>${esc(String(e.time||'').slice(0,5))}</td>
      <td><b>${km.icon} ${L(km.km,km.en)}</b><br><span style="color:#555">${ins}</span>${e.note?'<div style="color:#777;font-size:11px">'+esc(e.note)+'</div>':''}</td>
      <td>${badge}${failInfo}</td>
    </tr>`;
  };
  const lessonRowHtml = (l, o, phaseHourMap) => {
    const f = hourFbOf(l, o);
    const it = instById(l.instId); const inst = it ? esc(it.en||it.name) : '—';
    const coveredArr = coveredFor(f.lessonIds, f.lessonNo).map(c => esc(c.no + (c.name ? ' '+c.name : '')));
    const coveredHtml = coveredArr.length ? '<div style="color:#1A4F96;margin-top:2px">' + coveredArr.map(c=>'<div>'+c+'</div>').join('') + '</div>' : '';
    const fb = [];
    if (f.rating)     fb.push('<div>'+stars(f.rating)+'</div>');
    if (f.didWell)    fb.push('<div><b>'+L('ធ្វើបានល្អ','Did well')+':</b> '+esc(T(f.didWell))+'</div>');
    if (f.toImprove)  fb.push('<div><b>'+L('ខ្វះខាត','Needs work')+':</b> '+esc(T(f.toImprove))+'</div>');
    if (f.note)       fb.push('<div><b>'+L('មតិ','Comment')+':</b> '+esc(T(f.note))+'</div>');
    const status = l.status==='done' ? `<b style="color:#1A6B3C">${L('រួចរាល់','Done')}</b>` : l.status==='cancelled' ? `<span style="color:#999">${L('បានលុប','Cancelled')}</span>` : L('កំពុង','Pending');
    const hrs = phaseHourMap[l.id];
    const cumNo = hrs && hrs[o] != null ? hrs[o] : null;
    // Italic so the running hour count isn't mistaken for the date number.
    const hrLabel = cumNo != null ? ` <span style="color:#2a5db0;font-weight:700;font-size:10px;font-style:italic">(${cumNo})</span>` : '';
    const hh = (l.h||0) + o;
    const timeStr = `${String(hh).padStart(2,'0')}:00-${String(hh+1).padStart(2,'0')}:00`;
    return `<tr>
      <td style="white-space:nowrap;font-family:monospace;color:#444;font-weight:700">${esc(l.date)}<br>${timeStr}${hrLabel}</td>
      <td><b>${typeKm(l)}</b>${coveredHtml}<div style="color:#888;margin-top:2px">${inst}</div></td>
      <td>${status}${fb.length?'<div style="margin-top:3px;color:#333">'+fb.join('')+'</div>':''}</td>
    </tr>`;
  };

  // ── Group by tracking phase (KH → JP → AI) ──────────────────────────────────
  // Each phase gets its own heading + table and numbers its OWN hours (Theory &
  // Practical counted separately). Exams belong to the KH (licence) journey.
  const PH_LIST = (window.STUDENT_PHASES || [{k:'KH',label:'KH',color:'#2A5DB0'}]);
  const getPhase = (l) => (typeof lessonPhase==='function' ? lessonPhase(l) : (l.phase||'KH'));
  const isTheoryL = (l) => l.color==='c' || l.color==='e';
  const phaseSections = PH_LIST.map(p => {
    const pl = lessons.filter(l => getPhase(l) === p.k);
    const pExams = exams.filter(e => (e.phase || 'KH') === p.k);
    if (!pl.length && !pExams.length) return null;
    const phaseHourMap = buildHourNumbering(pl);   // restarts per phase, theory/practical separate
    let thHrs = 0, prHrs = 0;
    pl.filter(l => l.status !== 'cancelled').forEach(l => { const n = lessonHourSlices(l).length; if (isTheoryL(l)) thHrs += n; else prHrs += n; });
    const its = [
      ...pl.filter(l => l.status !== 'cancelled').flatMap(l => lessonHourSlices(l).map(sl => ({ t:'lesson', k:(l.date||'')+' '+String(sl.h).padStart(2,'0'), l, sl }))),
      ...pExams.map(e => ({ t:'exam', k:(e.date||'')+' '+String(e.time||'').slice(0,5), e })),
    ].sort((a,b)=> a.k<b.k ? -1 : a.k>b.k ? 1 : 0);
    const body = its.map(row => row.t==='exam' ? examRowHtml(row.e) : lessonRowHtml(row.l, row.sl.offset, phaseHourMap)).join('');
    return { p, thHrs, prHrs, body };
  }).filter(Boolean);
  const totalRows = phaseSections.reduce((a,s)=>a+s.thHrs+s.prHrs,0) + exams.length;

  // ── Record-book header (Japanese driving-school style) ──────────────────────
  const NV = '#1e3a6e';
  const address = ss.address || '';
  const fmtDob = (d) => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(d||'')) return '';
    const mi = +d.slice(5,7)-1;
    const enM = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const kmM = (typeof KM_MONTHS !== 'undefined' && KM_MONTHS) ? KM_MONTHS : enM;
    const mon = lang==='en' ? enM[mi] : (kmM[mi] || enM[mi]);
    return d.slice(8,10)+' '+mon+' '+d.slice(0,4);
  };
  const genderTxt = trGender(s.gender);
  const instr = (()=>{ const it = instById(s.instId); return it ? (it.en||it.name) : ''; })();
  const permit = [s.cls, s.trans].filter(Boolean).join(' · ');
  const logoHtml = isUrl(logo)
    ? `<img src="${esc(logo)}" style="width:62px;height:62px;border-radius:50%;object-fit:cover">`
    : `<div style="width:62px;height:62px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${NV};line-height:1.05;text-align:center"><div style="font-size:11px;font-weight:800">${esc((school||'').slice(0,6))}</div><div style="font-size:6.5px;letter-spacing:.5px">DRIVE</div></div>`;
  const photoHtml = isUrl(s.photo)
    ? `<img src="${esc(s.photo)}" style="width:100%;height:100%;object-fit:cover">`
    : `<div style="width:100%;height:100%;background:#eef1f5;display:flex;align-items:center;justify-content:center;color:#9aa6b5;font-size:11px">គ្មានរូប</div>`;

  const ir = (lab, val) => `<tr><td class="lab">${lab}</td><td class="val">${val && String(val).trim() ? esc(val) : '—'}</td></tr>`;
  const aptBox = (km, en, val) => `<div class="apt"><div class="aptlab">${L(km,en)}</div><div class="aptval">${val && String(val).trim() ? esc(val) : '—'}</div></div>`;

  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<title>${L('សៀវភៅប្រវត្តិសិក្សាបើកបរ','Driving Lesson Record Book')} · ${esc(s.name||s.en||'')}</title>
<style>
  @page { size:A4 portrait; margin:14mm 12mm; @bottom-right { content:"${L('ទំព័រ','PAGE')} " counter(page) " / " counter(pages); font:700 9px Inter,sans-serif; color:${NV}; } }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#e8e8e8;font-family:'Noto Sans Khmer','Inter',sans-serif;color:#222;}
  .bar{position:fixed;top:0;left:0;right:0;z-index:9;background:#1a1a19;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 18px;}
  .bar button{background:#2a5db0;color:#fff;border:none;border-radius:6px;padding:9px 18px;font:inherit;font-weight:700;cursor:pointer;}
  .bar .t{font-size:13px;font-weight:600;}
  .sheet{width:210mm;min-height:297mm;margin:58px auto 30px;background:#fff;padding:12mm;box-shadow:0 6px 30px rgba(0,0,0,.18);}
  .jp{font-family:'Noto Sans JP',sans-serif;}
  /* top header */
  .head{display:flex;align-items:center;gap:14px;}
  .head .nm{font-size:21px;font-weight:800;color:${NV};line-height:1.1;}
  .head .en{font-size:13px;font-weight:700;color:#2a5db0;}
  .head .ad{font-size:10px;color:#666;margin-top:2px;}
  .head .pg{margin-left:auto;text-align:right;color:${NV};}
  .head .pg .l{font-size:10px;font-weight:700;letter-spacing:.1em;color:#888;}
  .head .pg .n{font-size:26px;font-weight:800;line-height:1;}
  .head .pg .t{font-size:11px;color:#888;}
  .rule{border-top:3px double ${NV};margin:8px 0 0;}
  /* title */
  .title{text-align:center;margin:14px 0 16px;}
  .title .k{font-size:27px;font-weight:800;color:${NV};letter-spacing:.01em;}
  .title .j{font-size:15px;font-weight:700;color:#2a5db0;margin-top:1px;}
  .title .e{font-size:11px;color:#8a93a0;letter-spacing:.22em;margin-top:3px;}
  /* section bar */
  .secbar{display:flex;justify-content:space-between;align-items:center;background:${NV};color:#fff;padding:7px 12px;font-size:14px;font-weight:700;border-radius:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:14px 0 0;}
  .secbar .r{font-size:11px;font-weight:500;opacity:.92;}
  /* info tables */
  .itbl{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;}
  .itbl td{border:1px solid #c7d0dd;padding:7px 10px;vertical-align:middle;}
  .itbl .lab{width:34%;background:#eef2f7;color:#33445c;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .itbl .val{font-weight:700;color:#1a2433;}
  .inforow{display:flex;gap:10px;align-items:stretch;margin-top:8px;}
  .photo{width:150px;height:190px;border:1px solid #c7d0dd;flex-shrink:0;overflow:hidden;}
  /* aptitude boxes */
  .aptrow{display:flex;gap:10px;margin-top:10px;}
  .apt{flex:1;border:1px solid #c7d0dd;border-radius:4px;padding:10px 8px;text-align:center;}
  .apt .aptlab{font-size:10px;color:#7a8597;margin-bottom:6px;}
  .apt .aptval{font-size:14px;font-weight:700;color:#1a2433;min-height:18px;}
  /* lessons table */
  .lt{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;}
  .lt th{background:${NV};color:#fff;text-align:left;padding:7px 8px;border:1px solid ${NV};font-size:11px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .lt td{padding:7px 8px;border:1px solid #d7dde6;vertical-align:top;line-height:1.5;}
  @media print{ body{background:#fff;zoom:1 !important;} .bar{display:none;} .sheet{margin:0;box-shadow:none;width:auto;min-height:auto;padding:0;} }
</style></head><body>
<!-- toolbar (Back / Print) is provided by the in-app overlay, not inside the sheet -->
<div class="sheet">
  <div class="head">
    ${logoHtml}
    <div>
      <div class="nm">${esc(school)}</div>
      ${schoolEn?`<div class="en">${esc(schoolEn)}</div>`:''}
      ${address?`<div class="ad">${esc(address)}</div>`:''}
    </div>
    <div class="pg"><div class="l">${L('ទំព័រ','PAGE')}</div><div class="n">1</div><div class="t">/${Math.max(1,Math.ceil(totalRows/18)+1)}</div></div>
  </div>
  <div class="rule"></div>

  <div class="title">
    <div class="k">${L('សៀវភៅប្រវត្តិសិក្សាបើកបរ','Driving Lesson Record Book')}</div>
  </div>

  <div class="secbar">${L('ពត៌មានសិស្ស','Student Information')}</div>
  <div class="inforow">
    <div class="photo">${photoHtml}</div>
    <table class="itbl" style="margin-top:0">
      ${ir(L('ឈ្មោះ','Name'), s.name)}
      ${ir(L('ឈ្មោះឡាតាំង','Latin name'), s.en)}
      ${ir(L('លេខសម្គាល់','ID'), s.id)}
      ${ir(L('ភេទ','Gender'), genderTxt)}
      ${ir(L('ថ្ងៃកំណើត','Date of birth'), fmtDob(s.dob))}
      ${ir(L('ប្រភេទសិស្ស','Student type'), s.studentType)}
    </table>
  </div>
  <table class="itbl">
    ${ir(L('សញ្ជាតិ','Nationality'), trNat(s.nationality))}
    ${ir(L('ទូរស័ព្ទ','Phone'), s.phone)}
    ${ir(L('ប្រភេទប័ណ្ណ','Licence type'), permit)}
    ${ir(L('ថ្ងៃចុះឈ្មោះ','Reg. date'), s.regDate)}
    ${ir(L('គ្រូទទួលបន្ទុក','Instructor'), instr)}
    ${ir(L('អាសយដ្ឋាន','Address'), s.address)}
  </table>

  <div class="secbar">${L('ការត្រួតពិនិត្យសុខភាព','Aptitude Test')}</div>
  <div class="aptrow">
    ${aptBox('ភ្នែកឆ្វេង','Left eye', s.eye_left)}
    ${aptBox('ភ្នែកស្ដាំ','Right eye', s.eye_right)}
    ${aptBox('ភ្នែកទាំងពីរ','Both eyes', s.eye_both)}
    ${aptBox('ស្ថានភាពភ្នែក','Eye condition', trGlasses(s.glasses))}
  </div>

  ${phaseSections.length ? phaseSections.map(sec => `
  <div class="secbar" style="background:${sec.p.color}">${L('វគ្គ','Phase')} ${sec.p.label}<span class="r">${L('ទ្រឹស្ដី','Theory')} ${sec.thHrs} · ${L('អនុវត្តន៍','Practical')} ${sec.prHrs}</span></div>
  <table class="lt">
    <thead><tr><th style="width:124px">${L('ថ្ងៃ/ម៉ោង','Date / Time')}</th><th style="width:36%">${L('ប្រភេទ · គ្រូ','Type · Instructor')}</th><th>${L('លទ្ធផល · មតិគ្រូ','Result · Feedback')}</th></tr></thead>
    <tbody>${sec.body}</tbody>
  </table>`).join('') : `
  <div class="secbar">${L('ប្រវត្តិសិក្សា','Lesson Records')}</div>
  <table class="lt"><tbody><tr><td colspan="3" style="text-align:center;color:#999;padding:18px">គ្មានទិន្នន័យ</td></tr></tbody></table>`}
</div>
</body></html>`;
  try { const idoc = iframe.contentWindow.document; idoc.open(); idoc.write(doc); idoc.close(); } catch(e){}
  // Fit the A4 sheet to the iframe width (like a mobile tab used to), so it isn't
  // wider than the phone. Print resets zoom (see @media print in the doc).
  const fitStu = () => {
    if (!document.getElementById(HOST_ID)) { window.removeEventListener('resize', fitStu); return; }
    try { const w = iframe.clientWidth || window.innerWidth || 390; const b = iframe.contentWindow.document.body; if (b) b.style.zoom = Math.min(1, (w - 2) / 800).toFixed(3); } catch(e){}
  };
  fitStu(); setTimeout(fitStu, 80);
  window.addEventListener('resize', fitStu);
  })();
};

// Exam row in a student's Lessons & Comments — mark pass/fail per student and
// record where they failed. Fail turns the row red.
const ExamFeedbackRow = ({ e, sid, tr, onSave }) => {
  const isApply = e.kind === 'apply';
  const km = window.__SCHED_KIND(e.kind);
  const r = (e.results && e.results[sid]) || {};
  const [open, setOpen]                 = React.useState(false);
  const [editing, setEditing]           = React.useState(false);
  const [result, setResult]             = React.useState(r.result || '');
  const [failLocation, setFailLocation] = React.useState(r.failLocation || '');
  const [failReason, setFailReason]     = React.useState(r.failReason || '');
  const ins = (e.instIds||[]).map(id=>{ const it=instById(id); return it?(it.en||it.name):null; }).filter(Boolean);
  const savedFail = r.result === 'fail';
  const savedPass = r.result === 'pass';
  const hasResult = !!r.result;
  const showForm  = editing;
  const reset = () => { setResult(r.result||''); setFailLocation(r.failLocation||''); setFailReason(r.failReason||''); };
  const toggleOpen = () => { if (open) { setEditing(false); reset(); } setOpen(o=>!o); };
  const save = () => { onSave(e.id, sid, { result, failLocation: failLocation.trim(), failReason: failReason.trim() }); setEditing(false); };
  const th = isApply
    ? { bg:km.soft, bd:km.border, accent:km.color, text:km.text }
    : savedFail
      ? { bg:'rgba(176,65,62,.08)', bd:'rgba(176,65,62,.4)', accent:'#B0413E', text:'#7a2b29' }
      : { bg:'rgba(18,163,2,.08)',  bd:'rgba(18,163,2,.35)', accent:'#12A302', text:'#0c5a01' };
  const fld = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box' };
  const lbl = { fontSize:11, color:'var(--ink-3)', fontWeight:600, margin:'10px 0 4px' };
  return (
    <div style={{borderRadius:8,marginBottom:6,background:th.bg,border:`1px solid ${th.bd}`,borderLeft:`3px solid ${th.accent}`,overflow:'hidden'}}>
      <button onClick={toggleOpen} style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',padding:'9px 10px',display:'flex',gap:10,alignItems:'flex-start'}}>
        <div style={{fontSize:11,fontWeight:700,fontFamily:'"JetBrains Mono",monospace',color:th.accent,minWidth:54,lineHeight:1.5}}>{e.date}<br/>{String(e.time||'').slice(0,5)}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:th.text}}>{km.icon} {tr(km.km,km.en)}</div>
          {ins.length>0 && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>👨‍🏫 {ins.join(' · ')}</div>}
          {!isApply && savedFail && r.failLocation && <div style={{fontSize:11,color:th.text,marginTop:1}}>📍 {r.failLocation}</div>}
          {isApply && e.note && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>{e.note}</div>}
        </div>
        <span style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
          {!isApply && savedPass && <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,background:'rgba(18,163,2,.16)',color:'#12A302'}}>{tr('ជាប់','Pass')}</span>}
          {!isApply && savedFail && <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,background:'rgba(176,65,62,.16)',color:'#B0413E'}}>{tr('ធ្លាក់','Fail')}</span>}
          {!isApply && !hasResult && <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('កំណត់​លទ្ធផល','Set result')}</span>}
          {!isApply && <span style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none',color:'var(--ink-3)'}}>▾</span>}
        </span>
      </button>
      {open && !isApply && (
        <div style={{padding:'2px 10px 12px'}}>
          {!showForm && hasResult ? (
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {savedFail && r.failReason && <div><div style={lbl}>{tr('មូលហេតុ​ធ្លាក់','Fail reason')}</div><div style={{fontSize:13,color:'var(--ink)'}}>{r.failReason}</div></div>}
              <button onClick={()=>setEditing(true)} style={{alignSelf:'flex-start',marginTop:6,padding:'7px 14px',borderRadius:8,border:'1px solid var(--border-strong)',background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>✎ {tr('កែ','Edit')}</button>
            </div>
          ) : (
            <>
              <div style={lbl}>{tr('លទ្ធផល','Result')}</div>
              <div style={{display:'flex',gap:6}}>
                {[['pass',tr('ជាប់','Pass'),'#12A302'],['fail',tr('ធ្លាក់','Fail'),'#B0413E']].map(([v,t,c])=>(
                  <button key={v} onClick={()=>setResult(v)} style={{flex:1,padding:'8px 0',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:700,fontFamily:'inherit',
                    border:`1.5px solid ${result===v?c:'var(--border)'}`,
                    background: result===v ? c : 'var(--surface)', color: result===v ? '#fff' : 'var(--ink-2)'}}>{t}</button>
                ))}
              </div>
              {result==='fail' && (<>
                <div style={lbl}>{tr('កន្លែង​ធ្លាក់','Failed at')}</div>
                <input value={failLocation} onChange={ev=>setFailLocation(ev.target.value)} placeholder={tr('ឧ. ប្រឡង​ផ្លូវ','e.g. road test')} style={fld}/>
                <div style={lbl}>{tr('មូលហេតុ​ធ្លាក់','Fail reason')}</div>
                <input value={failReason} onChange={ev=>setFailReason(ev.target.value)} placeholder={tr('ឧ. ចត​មិន​ត្រូវ','e.g. parking error')} style={fld}/>
              </>)}
              <button onClick={save} style={{width:'100%',marginTop:12,padding:'10px',borderRadius:8,border:'none',background:th.accent,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>{tr('រក្សា​ទុក​លទ្ធផល','Save result')}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Collapsible profile section. Defined at module scope (NOT inside the screen's
// render) so its identity is stable — otherwise every parent re-render (e.g. the
// mobile keyboard resizing the viewport) would remount the section and drop
// focus from any input being typed into.
const CvSection = ({ label, children, action, isOpen, onToggle }) => (
  <div style={{borderRadius:10,overflow:'hidden',border:'1px solid var(--border)',marginBottom:8}}>
    <div onClick={onToggle} style={{
      width:'100%',padding:'12px 14px',display:'flex',alignItems:'center',gap:10,
      background: isOpen ? 'var(--surface-muted)' : 'var(--surface)', cursor:'pointer',textAlign:'left',
    }}>
      <span style={{flex:1,minWidth:0,fontSize:14,fontWeight:700,fontFamily:'var(--font-km)',color:'var(--ink)'}}>{label}</span>
      {isOpen && action}
      <span style={{fontSize:13,color:'var(--ink-3)',transition:'transform .2s',flexShrink:0,
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
    </div>
    {isOpen && (
      <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)',background:'var(--surface)'}}>
        {children}
      </div>
    )}
  </div>
);

const InfoPair = ({ label, val }) => (
  <div>
    <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:1}}>{label}</div>
    <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>{val || '—'}</div>
  </div>
);

// Per-section edit toggle button (rendered in a section header).
const SectionEditBtn = ({ active, label, onClick }) => (
  <button onClick={onClick}
    style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,flexShrink:0,
      border:'1px solid '+(active?'var(--accent)':'var(--border)'),
      background:active?'var(--accent)':'var(--surface)',
      color:active?'#fff':'var(--ink-2)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
    <Icon name="users" size={12}/>{label}
  </button>
);

// Focused editor for the Study-History section — only the dates + result +
// target hours (NOT the whole student form). Module-level + inline inputs so
// typing keeps focus across re-renders.
const _stFld = { width:'100%', padding:'8px 10px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'inherit', background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box' };
const _stLbl = { fontSize:11, color:'var(--ink-3)', fontWeight:600, margin:'10px 0 4px' };
// Assemble all exam attempts (first exam + resits) into one list for display.
const examAttemptsOf = (s) => [
  { apply: s.exam_apply || '', date: s.exam_date || '', result: s.exam_result || '', failLocation: s.fail_location || '', failReason: s.fail_reason || '' },
  ...((s.exam_resits || []).map(r => ({ apply: r.apply || '', date: r.date || '', result: r.result || '', failLocation: r.failLocation || '', failReason: r.failReason || '' }))),
].filter(a => a.apply || a.date || a.result || a.failLocation || a.failReason);

const StudyEditForm = ({ s, tr, onSave }) => {
  const [start, setStart]   = React.useState(s.study_start || '');
  const [end, setEnd]       = React.useState(s.study_end || '');
  const [target, setTarget] = React.useState(s.target || 0);
  // Unified exam attempts: [0] = first exam (legacy fields), [1..] = resits.
  const [attempts, setAttempts] = React.useState(() => {
    const first = { apply: s.exam_apply||'', date: s.exam_date||'', result: s.exam_result||'', failLocation: s.fail_location||'', failReason: s.fail_reason||'' };
    const rest = (s.exam_resits||[]).map(r => ({ apply: r.apply||'', date: r.date||'', result: r.result||'', failLocation: r.failLocation||'', failReason: r.failReason||'' }));
    return [first, ...rest];
  });
  const setAtt = (i, patch) => setAttempts(prev => prev.map((a,j)=>j===i?{...a,...patch}:a));
  const addAttempt = () => setAttempts(prev => [...prev, {apply:'',date:'',result:'',failLocation:'',failReason:''}]);
  const removeAttempt = (i) => setAttempts(prev => prev.filter((_,j)=>j!==i));
  const save = () => {
    const a0 = attempts[0] || {};
    onSave({ id: s.id, study_start: start, study_end: end, target: Number(target) || 0,
      exam_apply: a0.apply||'', exam_date: a0.date||'', exam_result: a0.result||'',
      fail_location: a0.failLocation||'', fail_reason: a0.failReason||'',
      exam_resits: attempts.slice(1).map(a => ({ apply:a.apply||'', date:a.date||'', result:a.result||'', failLocation:a.failLocation||'', failReason:a.failReason||'' })) });
  };
  return (
    <div style={{paddingTop:4}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
        <div><div style={_stLbl}>{tr('ចាប់ផ្ដើម','Start')}</div><input type="date" value={start} onChange={e=>setStart(e.target.value)} style={_stFld}/></div>
        <div><div style={_stLbl}>{tr('បញ្ចប់','Completion')}</div><input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={_stFld}/></div>
        <div style={{gridColumn:'1/-1'}}><div style={_stLbl}>{tr('ម៉ោង​គោលដៅ','Target hours')}</div><input type="number" value={target} onChange={e=>setTarget(e.target.value)} style={_stFld}/></div>
      </div>

      <div style={{marginTop:14,fontSize:12,fontWeight:700,color:'var(--ink-2)'}}>{tr('ការ​ប្រឡង','Exams')}</div>
      {attempts.map((a, i) => (
        <div key={i} style={{marginTop:8,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:9,background:'var(--surface-muted)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>
              {i===0 ? tr('ប្រឡង​លើក​ដំបូង','First exam') : tr('ប្រឡង​សង លើកទី '+i, 'Resit #'+i)}
            </div>
            {i>0 && <button onClick={()=>removeAttempt(i)} style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:16,lineHeight:1,padding:0}}>×</button>}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
            <div><div style={_stLbl}>{tr('ថ្ងៃ​ដាក់​ពាក្យ','Apply date')}</div><input type="date" value={a.apply} onChange={e=>setAtt(i,{apply:e.target.value})} style={_stFld}/></div>
            <div><div style={_stLbl}>{tr('ថ្ងៃ​ប្រឡង','Exam date')}</div><input type="date" value={a.date} onChange={e=>setAtt(i,{date:e.target.value})} style={_stFld}/></div>
            <div style={{gridColumn:'1/-1'}}><div style={_stLbl}>{tr('លទ្ធផល','Result')}</div>
              <select value={a.result} onChange={e=>setAtt(i,{result:e.target.value})} style={_stFld}>
                <option value="">—</option>
                <option value="pass">{tr('ជាប់','Pass')}</option>
                <option value="fail">{tr('ធ្លាក់','Fail')}</option>
              </select>
            </div>
            {a.result==='fail' && (<>
              <div style={{gridColumn:'1/-1'}}><div style={_stLbl}>{tr('កន្លែង​ធ្លាក់','Failed at')}</div><input type="text" value={a.failLocation} onChange={e=>setAtt(i,{failLocation:e.target.value})} placeholder={tr('ឧ. ប្រឡង​ផ្លូវ','e.g. road test')} style={_stFld}/></div>
              <div style={{gridColumn:'1/-1'}}><div style={_stLbl}>{tr('មូលហេតុ​ធ្លាក់','Fail reason')}</div><input type="text" value={a.failReason} onChange={e=>setAtt(i,{failReason:e.target.value})} placeholder={tr('ឧ. ចត​មិន​ត្រូវ','e.g. parking error')} style={_stFld}/></div>
            </>)}
          </div>
        </div>
      ))}
      <button onClick={addAttempt} style={{width:'100%',marginTop:8,padding:'9px',borderRadius:8,border:'1.5px dashed var(--border-strong)',background:'transparent',color:'var(--ink-2)',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>+ {tr('បន្ថែម​ការ​ប្រឡង​សង','Add resit')}</button>

      <button onClick={save} style={{width:'100%',marginTop:14,padding:'10px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>{tr('រក្សា​ទុក','Save')}</button>
    </div>
  );
};

// Focused editor for the Enrollment & Payment section: registration date +
// amount paid, with a "paid in full" checkbox. Edits only these fields.
const PaymentEditForm = ({ s, tr, onSave }) => {
  const price = studentPrice(s);
  const [regDate, setRegDate] = React.useState(s.regDate || '');
  const [paidAmt, setPaidAmt] = React.useState(String(Math.round((s.paid || 0) * price)));
  const fullyPaid = (parseFloat(paidAmt) || 0) >= price && price > 0;
  const save = () => {
    const amt = Math.max(0, parseFloat(paidAmt) || 0);
    onSave({ id: s.id, regDate, paid: price > 0 ? Math.min(1, amt / price) : 0 });
  };
  return (
    <div style={{paddingTop:4}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
        <div><div style={_stLbl}>{tr('ថ្ងៃ​ចុះ​ឈ្មោះ','Reg. date')}</div><input type="date" value={regDate} onChange={e=>setRegDate(e.target.value)} style={_stFld}/></div>
        <div><div style={_stLbl}>{tr('បាន​បង់','Paid')+` ($) / $${price}`}</div><input type="number" min="0" max={price} value={paidAmt} onChange={e=>setPaidAmt(e.target.value)} style={_stFld}/></div>
      </div>
      <label style={{display:'flex',alignItems:'center',gap:8,marginTop:14,cursor:'pointer',fontSize:13,fontWeight:500,color:'var(--ink)'}}>
        <input type="checkbox" checked={fullyPaid} onChange={e=>setPaidAmt(e.target.checked ? String(price) : '0')} style={{width:18,height:18,cursor:'pointer',accentColor:'var(--good)'}}/>
        {tr('បាន​បង់​ប្រាក់​ពេញ','Paid in full')}
      </label>
      <button onClick={save} style={{width:'100%',marginTop:14,padding:'10px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>{tr('រក្សា​ទុក','Save')}</button>
    </div>
  );
};

const extendStudent = (s) => {
  const trans = s.trans || 'AT';
  const pracCount = trans === 'MT' ? 13 : 10;
  return {
    ...s,
    age:          s.dob
      ? Math.floor((Date.now() - new Date(s.dob).getTime()) / (365.25*24*3600*1000))
      : (s.age || 24),
    gender:       s.gender === 'ប្រុស' ? 'M' : s.gender === 'ស្រី' ? 'F' : (s.gender || 'M'),
    district:     s.district || s.addr_district || '',
    enrolled:     s.enrolled || '—',
    inst:         s.inst || (INSTRUCTORS.find(ii => ii.id === s.instId)?.en) || '',
    permit:       s.permit   !== undefined ? s.permit   : 0,
    id_doc:       s.id_doc   !== undefined ? s.id_doc   : 0,
    medical:      s.medical  !== undefined ? s.medical  : 0,
    photo_id:     s.photo_id !== undefined ? s.photo_id : 0,
    mock_avg:     s.mock_avg || 0,
    theory:       s.theory   || 0,
    yard:         s.yard     || 0,
    city:         s.city     || 0,
    highway:      s.highway  !== undefined ? s.highway  : 0,
    parking:      s.parking  || 0,
    lessons_count:s.lessons_count || LESSONS.filter(l=>l.studentId===s.id&&l.status==='done').length,
    trans,
    studentType:   s.studentType   || 'ធម្មតា',
    nationality:   s.nationality   || 'ខ្មែរ',
    eye_left:      s.eye_left      || '',
    eye_right:     s.eye_right     || '',
    eye_both:      s.eye_both      || '',
    glasses:       normEye(s.glasses),
    addr_house:    s.addr_house    || '',
    addr_street:   s.addr_street   || '',
    addr_village:  s.addr_village  || '',
    addr_commune:  s.addr_commune  || '',
    addr_district: s.addr_district || s.district || '',
    addr_province: s.addr_province || '',
    study_goal:    s.study_goal    || '',
    referral:      s.referral      || '',
    study_start:  s.study_start  || '',
    study_end:    s.study_end    || '',
    exam_apply:   s.exam_apply   || '',
    exam_date:    s.exam_date    || '',
    exam_result:  s.exam_result  || '',
    fail_location: s.fail_location || '',
    fail_reason:   s.fail_reason   || '',
    exam_resits:  s.exam_resits  || [],
    theory_done:      Array.isArray(s.theory_done)      ? s.theory_done      : Array(3).fill(false),
    practice_done:    Array.isArray(s.practice_done)    ? s.practice_done    : Array(pracCount).fill(false),
    extra_done:       Array.isArray(s.extra_done)        ? s.extra_done       : [],
    theory_jp_done:   Array.isArray(s.theory_jp_done)   ? s.theory_jp_done   : [],
    practice_jp_done: Array.isArray(s.practice_jp_done) ? s.practice_jp_done : [],
  };
};

const studentPrice = (s) => {
  const ss = window.__schoolSettings || {};
  return s.trans === 'MT' ? (ss.price_MT ?? 230) : (ss.price_AT ?? 200);
};

if (!window.__applicationsData) window.__applicationsData = [];
const APPLICATIONS_LIST = window.__applicationsData;

if (!window.__messagesData) window.__messagesData = [];
const MESSAGES_LIST = window.__messagesData;

// ── Main screen ──────────────────────────────────────────────────────────────
const StudentsScreenV2 = () => {
  const { openForm, toast, tr, lang, navigate, hideChrome } = useAppActions();
  const bp = useBreakpoint();
  const [, forceUpdate] = React.useReducer(n => n + 1, 0);
  const [tab, setTab]         = React.useState('directory');
  const [view, setView]       = React.useState('list');
  const [filter, setFilter]   = React.useState('all');
  const [selectedId, setSelectedId] = React.useState(STUDENTS[0]?.id);
  const [editing, setEditing] = React.useState(false);
  const [mobileProfileId, setMobileProfileId] = React.useState(null);
  const [mobileEdit, setMobileEdit] = React.useState(null);  // holds the section id being edited, or null
  const [openSections, setOpenSections] = React.useState({bio:true});
  const [pdfPhase, setPdfPhase] = React.useState('all');     // which phase(s) to include in the PDF export

  // Swipe from the left edge → go back (edit → profile → list)
  const mobileBack = React.useCallback(() => {
    if (mobileEdit) setMobileEdit(null);
    else if (mobileProfileId) setMobileProfileId(null);
  }, [mobileEdit, mobileProfileId]);
  useBackHandler(bp.mobile && (mobileEdit || mobileProfileId), mobileBack);
  // Hide the app header/footer while the mobile student card/profile is open,
  // so the bars don't cover its controls — same behaviour as the vehicle card.
  React.useEffect(() => {
    if (bp.mobile && mobileProfileId) { hideChrome?.(true); return () => hideChrome?.(false); }
  }, [bp.mobile, mobileProfileId]);

  React.useEffect(() => {
    window.__notifyStudentsChanged = forceUpdate;
    return () => { delete window.__notifyStudentsChanged; };
  }, [forceUpdate]);

  // Keep the lesson record in sync with the schedule: when a lesson is logged,
  // moved (change-day → cancelled), deleted, restored or synced from the cloud,
  // re-render so the student's history reflects it immediately.
  React.useEffect(() => {
    const prev = window.__notifyLessonsChanged;
    window.__notifyLessonsChanged = forceUpdate;
    return () => { window.__notifyLessonsChanged = (prev && prev !== forceUpdate) ? prev : null; };
  }, [forceUpdate]);

  const allStudents = STUDENTS.map(extendStudent)
    .sort((a, b) => String(a.id||'').localeCompare(String(b.id||''), undefined, { numeric:true }));
  const selected    = allStudents.find(s => s.id === selectedId) || allStudents[0];

  // Export all students to a Google Sheets-friendly CSV.
  const exportStudentsCSV = () => {
    const G = {M:'ប្រុស',F:'ស្រី'}, R = {pass:'ជាប់',fail:'ធ្លាក់'};
    const cols = [
      ['ID', s=>s.id],
      ['ឈ្មោះ (ខ្មែរ)', s=>s.name],
      ['ឈ្មោះ (EN)', s=>s.en],
      ['ស្ថានភាព', s=>s.status],
      ['ថ្នាក់', s=>s.cls],
      ['ប្រអប់លេខ', s=>s.trans],
      ['ភេទ', s=>G[s.gender]||s.gender],
      ['អាយុ', s=>s.age],
      ['ទូរស័ព្ទ', s=>s.phone],
      ['ថ្ងៃចុះឈ្មោះ', s=>s.regDate],
      ['ម៉ោងរៀន', s=>s.hours],
      ['គោលដៅម៉ោង', s=>s.target],
      ['បានបង់ (%)', s=>Math.round((s.paid||0)*100)],
      ['លទ្ធផលប្រឡង', s=>R[s.exam_result]||''],
      ['សាខា', s=>s.branch],
      ['ប្រភព', s=>s.source],
      ['លេខបណ្ណបើកបរ', s=>s.license_no],
      ['អត្តសញ្ញាណប័ណ្ណ', s=>s.natId],
    ];
    const ok = exportCSV(`anzen-students-${typeof todayStr==='function'?todayStr():'export'}.csv`, cols, allStudents);
    toast(ok ? tr('បាននាំចេញ CSV ✓','CSV exported ✓') : tr('នាំចេញបរាជ័យ','Export failed'), ok?'good':'danger');
  };

  const goToProfile  = (s) => { setSelectedId(s.id); setTab('profile'); setEditing(false); };
  const goToEdit     = (s) => { setSelectedId(s.id); setTab('profile'); setEditing(true);  };
  const goToMessages = (s) => { setSelectedId(s.id); setTab('messages'); };
  const bookLesson   = (s) => openForm('newLesson', { studentId: s.id });

  const saveStudent = (updated) => {
    const i = STUDENTS.findIndex(s => s.id === updated.id);
    if (i !== -1) Object.assign(STUDENTS[i], updated);
    setEditing(false);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានរក្សាទុក', 'Saved'), 'good');
  };

  const savePhoto = (id, dataUrl) => {
    const i = STUDENTS.findIndex(s => s.id === id);
    if (i !== -1) { STUDENTS[i].photo = dataUrl; if (window.saveAllData) window.saveAllData(); forceUpdate(); }
  };

  const addPayment = (id, entry) => {
    const i = STUDENTS.findIndex(s => s.id === id);
    if (i !== -1) {
      const log = [...(STUDENTS[i].payment_log || []), entry];
      const price = studentPrice(STUDENTS[i]);
      const logTotal = log.reduce((sum, e) => sum + (e.amount || 0), 0);
      STUDENTS[i].payment_log = log;
      STUDENTS[i].paid = Math.min(1, logTotal / Math.max(1, price));
      if (window.saveAllData) window.saveAllData();
      forceUpdate();
      toast(tr('បានចងចាំការបង់', 'Payment recorded'), 'good');
    }
  };

  const saveStudentProgress = (id, updates) => {
    const i = STUDENTS.findIndex(s => s.id === id);
    if (i !== -1) Object.assign(STUDENTS[i], updates);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };

  // Mark a student as graduated / restore them — fully reversible.
  const toggleGraduate = (stu) => {
    const i = STUDENTS.findIndex(x => x.id === stu.id);
    if (i === -1) return;
    STUDENTS[i].graduated = !STUDENTS[i].graduated;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(STUDENTS[i].graduated
      ? tr('បាន​សម្គាល់​ថា​បញ្ចប់​ការសិក្សា ✓', 'Marked as graduated ✓')
      : tr('បាន​យក​មក​សិក្សា​វិញ', 'Restored to active'), 'good');
  };

  // Read a phase's status ('' | 'starting' | 'finished'), with backward-compat
  // for the old boolean phaseDone (true → finished).
  const phaseStatusOf = (stu, ph) =>
    (stu.phaseStatus && stu.phaseStatus[ph]) || (stu.phaseDone && stu.phaseDone[ph] ? 'finished' : '');

  // Set a tracking phase (KH/JP/AI) to Starting or Finished (tap again to clear).
  // Finishing ANY phase counts as success, so we keep phaseDone + the graduated
  // flag in sync (= any phase finished).
  const setPhaseStatus = (stu, ph, status) => {
    const i = STUDENTS.findIndex(x => x.id === stu.id);
    if (i === -1) return;
    const cur = phaseStatusOf(STUDENTS[i], ph);
    const next = cur === status ? '' : status;
    STUDENTS[i].phaseStatus = { ...(STUDENTS[i].phaseStatus || {}), [ph]: next };
    const pd = { ...(STUDENTS[i].phaseDone || {}) };
    pd[ph] = next === 'finished';
    STUDENTS[i].phaseDone = pd;
    // Archived only when a phase is finished AND none is currently in progress.
    const psVals = Object.values(STUDENTS[i].phaseStatus);
    STUDENTS[i].graduated = psVals.includes('finished') && !psVals.includes('starting');
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(`${ph} · ${next==='finished'?tr('បញ្ចប់','Finished'):next==='starting'?tr('ចាប់​ផ្ដើម','Starting'):tr('សម្អាត','Cleared')}`, 'good');
  };

  // Save an instructor evaluation/feedback back onto a lesson (rating, notes,
  // status). Persists to localStorage + cloud via saveAllData.
  const saveLessonFeedback = (lesson, fields, offset = 0) => {
    const i = LESSONS.findIndex(l => l.id === lesson.id);
    if (i === -1) return;
    const { status, ...rest } = fields;
    if (status !== undefined) LESSONS[i].status = status;   // status is lesson-level (shared by all hours)
    if (offset === 0) {
      Object.assign(LESSONS[i], rest);
    } else {
      const hn = { ...(LESSONS[i].hourNotes || {}) };
      hn[offset] = { ...(hn[offset] || {}), ...rest };
      LESSONS[i].hourNotes = hn;
    }
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បាន​រក្សា​ទុក​មតិ ✓', 'Feedback saved ✓'), 'good');
  };

  // Per-student exam result (pass/fail + fail details). An exam can hold many
  // students, so results are keyed by student id on the exam record.
  const saveExamResult = (examId, studentId, patch) => {
    const list = (window.__schoolSettings && window.__schoolSettings.scheduleExams) || [];
    const ex = list.find(e => e.id === examId);
    if (!ex) return;
    ex.results = { ...(ex.results || {}), [studentId]: patch };
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បាន​រក្សា​ទុក​លទ្ធផល ✓', 'Result saved ✓'), 'good');
  };

  const deleteStudent = (id) => {
    const i = STUDENTS.findIndex(s => s.id === id);
    if (i !== -1) STUDENTS.splice(i, 1);
    setSelectedId(STUDENTS[0]?.id || null);
    setEditing(false);
    setTab('directory');
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានលុបសិស្ស', 'Student removed'), 'neutral');
  };

  const tabs = [
    {id:'directory', km:'បញ្ជី',        en:'Directory',  icon:'users'},
    {id:'profile',   km:'ប្រវត្តិរូប',   en:'Profile',    icon:'star'},
    {id:'pipeline',  km:'ការ​ចូល​រៀន',  en:'Enrollment', icon:'plus'},
    {id:'progress',  km:'វឌ្ឍនភាព',    en:'Progress',   icon:'chart'},
    {id:'messages',  km:'សារ',          en:'Messages',   icon:'bell'},
    {id:'docs',      km:'ឯកសារ',        en:'Documents',  icon:'book'},
  ];

  const filtered = allStudents.filter(s => {
    if (filter === 'finished') return isGraduated(s);
    if (isGraduated(s)) return false;   // graduated → hidden from every other view
    return (
      filter==='all'        ||
      (filter==='new'        && s.status==='New') ||
      (filter==='inprogress' && s.status==='In progress') ||
      (filter==='exam'       && s.status==='Road exam soon') ||
      (filter==='cleared'    && s.status==='Cleared') ||
      (filter==='graduated'  && s.exam_result==='pass') ||
      (filter==='B'          && clsLetter(s.cls)==='B') ||
      (filter==='A'          && clsLetter(s.cls)==='A') ||
      (filter==='C'          && clsLetter(s.cls)==='C') ||
      (filter==='t_normal'   && s.studentType==='ធម្មតា') ||
      (filter==='t_special'  && s.studentType==='ពិសេស') ||
      (filter==='t_ssw'      && s.studentType==='SSW')
    );
  });

  const examReady = allStudents.filter(s => s.status==='Road exam soon').length;

  // ── Mobile: list + CV profile ──────────────────────────────────────────────
  if (bp.mobile) {
    const filterChips = [
      {id:'all',       l:tr('ទាំងអស់','All')},
      {id:'t_normal',  l:tr('ធម្មតា','Regular')},
      {id:'t_special', l:tr('ពិសេស','Special')},
      {id:'t_ssw',     l:'SSW'},
      {id:'finished',  l:tr('បាន​បញ្ចប់','Completed')},
    ];
    const toggleSection = (id) => setOpenSections(prev => ({...prev, [id]: !prev[id]}));
    // Build the edit-toggle button for a section header.
    const editAction = (sec) => (
      <SectionEditBtn active={mobileEdit===sec}
        label={mobileEdit===sec ? tr('បិទ','Close') : tr('កែ','Edit')}
        onClick={(e)=>{ e.stopPropagation(); setMobileEdit(m => m===sec ? null : sec); }}/>
    );

    // ── CV profile view ────────────────────────────────────────────────────
    if (mobileProfileId) {
      const s = allStudents.find(x => x.id === mobileProfileId);
      if (!s) { setMobileProfileId(null); return null; }

      const inst = instById(s.instId);
      // Hours learned = sum of lengths of this student's lessons marked done in
      // the feedback list (so completed lessons reflect here), never below the
      // stored s.hours.
      const doneHours = LESSONS.filter(l => l.studentId === s.id && l.status === 'done').reduce((a,l)=>a+(l.len||1),0);
      const learnedHours = Math.max(s.hours || 0, doneHours);
      const pct = s.target > 0 ? Math.min(100, Math.round((learnedHours / s.target) * 100)) : 0;
      const price = studentPrice(s);
      const paidAmt = Math.round((s.paid || 0) * price);
      // Show ALL of this student's lessons (newest first). Previously capped at
      // 12, which hid older lessons that exist in the schedule.
      const studentLessons = LESSONS.filter(l => l.studentId === s.id).slice()
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      // Exam slots (scheduled separately) that include this student — shown green.
      const studentExams = ((window.__schoolSettings && window.__schoolSettings.scheduleExams) || [])
        .filter(e => (e.studentIds || []).includes(s.id))
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      const grad = isGraduated(s);
      // Shared edit form — rendered inside whichever section is being edited.
      const editForm = (
        <StudentEditPanel key={s.id} s={s}
          onSave={(u)=>{ saveStudent(u); setMobileEdit(null); }}
          onCancel={()=>setMobileEdit(null)}
          onDelete={(id)=>{ deleteStudent(id); setMobileEdit(null); setMobileProfileId(null); }}/>
      );

      return (
        <div style={{display:'flex',flexDirection:'column'}}>
          {/* Floating Back button — icon only, bottom-right corner */}
          <button onClick={()=>setMobileProfileId(null)} title={tr('ត្រឡប់','Back')} aria-label={tr('ត្រឡប់','Back')}
            style={{position:'fixed',right:16,bottom:'calc(18px + env(safe-area-inset-bottom,0px))',zIndex:120,
              width:52,height:52,borderRadius:'50%',cursor:'pointer',border:'none',padding:0,
              background:'var(--accent)',color:'#fff',boxShadow:'0 4px 16px rgba(0,0,0,.3)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{display:'flex',transform:'scaleX(-1)'}}><Icon name="arrow" size={22} stroke={2.4}/></span>
          </button>
          {/* Profile title */}
          <div style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-km)',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0,marginBottom:8}}>
            {lang==='km' ? s.name : (s.en || s.name)}
          </div>
          {/* Phase tracking — Starting / Finished per phase (KH / JP / AI).
              Finishing any one counts as success. */}
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
            {(window.STUDENT_PHASES||[]).map(p => {
              const st = phaseStatusOf(s, p.k);
              const seg = (val, label, activeColor) => {
                const active = st === val;
                return (
                  <button onClick={()=>setPhaseStatus(s, p.k, val)} style={{
                    padding:'5px 11px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',border:'none',
                    background: active?activeColor:'transparent', color: active?'#fff':'var(--ink-3)'}}>{label}</button>
                );
              };
              return (
                <div key={p.k} style={{display:'inline-flex',alignItems:'stretch',borderRadius:8,overflow:'hidden',border:'1px solid var(--border)'}}>
                  <span style={{display:'inline-flex',alignItems:'center',background:p.color,color:'#fff',fontSize:11,fontWeight:800,padding:'0 9px'}}>{p.label}</span>
                  {seg('starting', tr('ចាប់​ផ្ដើម','Starting'), 'var(--warn)')}
                  <span style={{width:1,background:'var(--border)'}}/>
                  {seg('finished', tr('បញ្ចប់','Finished'), 'var(--good)')}
                </div>
              );
            })}
          </div>

          {/* Section 1: Photo & bio — edit toggle lives in the header */}
          <CvSection label={tr('រូបថត និង ប្រវត្តិរូបសង្ខេប','Photo & Bio')} isOpen={openSections.bio} onToggle={()=>toggleSection('bio')} action={editAction('bio')}>
            {mobileEdit==='bio' ? editForm : (<>
            <div style={{display:'flex',gap:14,marginBottom:12,alignItems:'flex-start'}}>
              <div style={{textAlign:'center',flexShrink:0}}>
                <UploadAvatar id={s.id} photo={s.photo} size={72} onUpload={savePhoto}/>
                <div style={{fontSize:10,color:'var(--accent)',marginTop:4}}>{tr('ប្ដូររូប','Change')}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,fontFamily:'var(--font-km)',lineHeight:1.3}}>{s.name}</div>
                <div style={{fontSize:13,color:'var(--ink-2)',marginTop:2}}>{s.en}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{s.id}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 14px'}}>
              <InfoPair label={tr('ថ្នាក់','Class')} val={clsKm(s.cls)}/>
              <InfoPair label={tr('ភេទ','Gender')} val={s.gender==='M'?tr('ប្រុស','Male'):tr('ស្រី','Female')}/>
              <InfoPair label={tr('អាយុ','Age')} val={s.age ? `${s.age} ${tr('ឆ្នាំ','y')}` : null}/>
              <InfoPair label={tr('ប្រភេទ','Type')} val={s.studentType}/>
              <InfoPair label={tr('ទូរស័ព្ទ','Phone')} val={s.phone}/>
              <InfoPair label={tr('គ្រូ','Instructor')} val={inst?.name || inst?.en}/>
              <InfoPair label={tr('ប្រអប់លេខ','Trans.')} val={s.trans}/>
              <InfoPair label={tr('ស្ថានភាព','Status')} val={s.status}/>
              <InfoPair label={tr('លេខ​បណ្ណ​បើកបរ','License No.')} val={s.license_no}/>
              <InfoPair label={tr('លេខ​អត្តសញ្ញាណប័ណ្ណ','National ID')} val={s.natId}/>
              <InfoPair label={tr('ទីតាំង​ប្រឡង','Exam location')} val={s.exam_location}/>
            </div>
            </>)}
          </CvSection>

          {/* Section 2: Enrollment & payment */}
          <CvSection label={tr('ចុះឈ្មោះ និង កាបង់ប្រាក់','Enrollment & Payment')} isOpen={openSections.payment} onToggle={()=>toggleSection('payment')} action={editAction('payment')}>
            {mobileEdit==='payment'
              ? <PaymentEditForm s={s} tr={tr} onSave={(u)=>{ saveStudent(u); setMobileEdit(null); }}/>
              : (<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 14px',marginBottom:12}}>
              <InfoPair label={tr('ថ្ងៃចុះឈ្មោះ','Reg. date')} val={s.regDate}/>
              <InfoPair label={tr('ថ្លៃ​វគ្គ','Course fee')} val={`$${price}`}/>
              <InfoPair label={tr('បានបង់','Paid')} val={`$${paidAmt}`}/>
              <InfoPair label={tr('នៅខ្វះ','Balance')} val={`$${Math.max(0, price - paidAmt)}`}/>
            </div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:4,display:'flex',justifyContent:'space-between'}}>
              <span>{tr('ការបង់ប្រាក់','Payment progress')}</span>
              <span style={{fontWeight:600}}>{Math.round((s.paid||0)*100)}%</span>
            </div>
            <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden',marginBottom:12}}>
              <div style={{width:`${Math.round((s.paid||0)*100)}%`,height:'100%',background:'var(--good)',borderRadius:999}}/>
            </div>
            {s.payment_log?.length > 0 && (
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'var(--ink-3)',marginBottom:6}}>{tr('ប្រវត្តិ​បង់','Payment log')}</div>
                {s.payment_log.map((e,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,
                    padding:'5px 0',borderBottom:'1px solid var(--border)',color:'var(--ink-2)'}}>
                    <span>{e.date}</span>
                    <span style={{fontWeight:600,color:'var(--good)'}}>+${e.amount}</span>
                  </div>
                ))}
              </div>
            )}
            </>)}
          </CvSection>

          {/* Section 4: Documents */}
          <CvSection label={tr('ឯកសារសិស្ស','Documents')} isOpen={openSections.docs} onToggle={()=>toggleSection('docs')}>
            <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:6}}>{tr('ចុច​ដើម្បី​ប្ដូរ​ស្ថានភាព','Tap to toggle status')}</div>
            {[
              {key:'permit',   km:'ប័ណ្ណ​អនុញ្ញាត',       en:"Learner's permit"},
              {key:'id_doc',   km:'អត្តសញ្ញាណ​ប័ណ្ណ',     en:'National ID'},
              {key:'medical',  km:'វេជ្ជ​បណ្ណ',            en:'Medical cert.'},
              {key:'photo_id', km:'រូប​ថត 4×6',             en:'Photo 4×6'},
            ].map(d => (
              <div key={d.key}
                onClick={() => { const i = STUDENTS.findIndex(x=>x.id===s.id); if(i!==-1){ STUDENTS[i][d.key] = s[d.key]?0:1; if(window.saveAllData) window.saveAllData(); forceUpdate(); } }}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'9px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
                <span style={{fontSize:13,color:'var(--ink-2)'}}>{tr(d.km, d.en)}</span>
                <span style={{fontSize:13,fontWeight:600,padding:'2px 10px',borderRadius:6,
                  background: s[d.key] ? 'color-mix(in srgb,var(--good) 14%,transparent)' : 'var(--surface-muted)',
                  color: s[d.key] ? 'var(--good)' : 'var(--ink-3)'}}>
                  {s[d.key] ? '✓ '+tr('មាន','Done') : tr('មិន​ទាន់','Missing')}
                </span>
              </div>
            ))}
            {/* Upload actual files (image/PDF) */}
            <SchoolDocs student={s}/>
          </CvSection>

          {/* Section 5: Lessons & comments */}
          <CvSection label={tr('បញ្ជីមេរៀន និង មតិគ្រូ','Lessons & Comments')} isOpen={openSections.lessons} onToggle={()=>toggleSection('lessons')}>
            {(() => {
              // Group by tracking phase (KH / JP / AI). Within each phase, exams &
              // applications are mixed in with the lessons in date order.
              const hourNumMap = buildHourNumbering(studentLessons);
              if (studentLessons.length === 0 && studentExams.length === 0) return (
                <div style={{fontSize:13,color:'var(--ink-3)',textAlign:'center',padding:'12px 0'}}>{tr('មិន​ទាន់​មាន​មេរៀន','No lessons yet')}</div>
              );
              const examPhase = (e) => e.phase || 'KH';
              const groups = (window.STUDENT_PHASES || []).map(p => {
                const lessonItems = studentLessons.filter(l => lessonPhase(l) === p.k)
                  .flatMap(l => lessonHourSlices(l).map(sl => ({ type:'lesson', l, sl, k:(l.date||'')+' '+String(sl.h).padStart(2,'0') })));
                const examItems = studentExams.filter(e => examPhase(e) === p.k)
                  .map(e => ({ type:'exam', e, k:(e.date||'')+' '+String(e.time||'').slice(0,5) }));
                const items = [...lessonItems, ...examItems].sort((a,b)=> a.k<b.k ? -1 : a.k>b.k ? 1 : 0);
                return { p, items, hours: lessonItems.length };
              }).filter(g => g.items.length > 0);
              const GroupHead = ({bg, label, sub}) => (
                <div style={{display:'flex',alignItems:'center',gap:8,margin:'10px 0 8px'}}>
                  <span style={{background:bg,color:'#fff',fontSize:11,fontWeight:800,padding:'3px 10px',borderRadius:6,letterSpacing:'.03em'}}>{label}</span>
                  {sub!=null && <span style={{fontSize:11,color:'var(--ink-3)'}}>{sub}</span>}
                  <div style={{flex:1,height:1,background:'var(--border)'}}/>
                </div>
              );
              return (<>
                {groups.map(g => (
                  <div key={g.p.k}>
                    <GroupHead bg={g.p.color} label={g.p.label} sub={`${g.hours} ${tr('ម៉ោង','hrs')}`}/>
                    {g.items.map((it,i) => it.type === 'exam'
                      ? <ExamFeedbackRow key={it.e.id||('ex'+i)} e={it.e} sid={s.id} tr={tr} onSave={saveExamResult}/>
                      : (() => { const cumNo = (hourNumMap[it.l.id] || [])[it.sl.offset];
                          return <CvLessonRow key={(it.l.id||('ls'+i))+'-'+it.sl.offset} l={it.l} offset={it.sl.offset} h={it.sl.h} total={it.sl.total} cumNo={cumNo} tr={tr} onSave={saveLessonFeedback}/>; })()
                    )}
                  </div>
                ))}
              </>);
            })()}
            {/* PDF export — choose which phase(s) to include, then a language */}
            {(() => {
              const pdfLessons = studentLessons.filter(l => pdfPhase === 'all' || lessonPhase(l) === pdfPhase);
              const pdfExams   = studentExams.filter(e => pdfPhase === 'all' || (e.phase||'KH') === pdfPhase);
              const PHASE_OPTS = [{k:'all', label:tr('ទាំង៣','All')}, ...(window.STUDENT_PHASES||[]).map(p=>({k:p.k,label:p.label,color:p.color}))];
              return (<>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:12,marginBottom:5}}>⬇ {tr('ទាញយក PDF — ជ្រើសវគ្គ','Download PDF — choose phase')}</div>
                <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                  {PHASE_OPTS.map(o => {
                    const active = pdfPhase === o.k;
                    const c = o.color || 'var(--accent)';
                    return (
                      <button key={o.k} onClick={()=>setPdfPhase(o.k)} style={{
                        padding:'5px 14px',borderRadius:999,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',
                        border:'1.5px solid '+(active?c:'var(--border)'),
                        background: active?c:'var(--surface)', color: active?'#fff':'var(--ink-2)'}}>{o.label}</button>
                    );
                  })}
                </div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:4}}>{tr('ជ្រើសភាសា','Choose language')}</div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>printStudentLessonsPDF(s, pdfLessons, pdfExams, 'km')} style={{
                    flex:1,padding:'10px',borderRadius:8,border:'1px solid var(--border-strong)',
                    background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer',fontSize:13,fontWeight:600,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  }}>🇰🇭 {tr('ខ្មែរ','Khmer')}</button>
                  <button onClick={()=>printStudentLessonsPDF(s, pdfLessons, pdfExams, 'en')} style={{
                    flex:1,padding:'10px',borderRadius:8,border:'1px solid var(--border-strong)',
                    background:'var(--surface)',color:'var(--ink-2)',cursor:'pointer',fontSize:13,fontWeight:600,
                    display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                  }}>🇬🇧 English</button>
                </div>
              </>);
            })()}
            <button onClick={()=>bookLesson(s)} style={{
              width:'100%',marginTop:8,padding:'10px',borderRadius:8,
              border:'none',background:'var(--accent)',color:'#fff',
              cursor:'pointer',fontSize:13,fontWeight:600,
            }}>{tr('ណាត់​មេរៀន​ថ្មី','Book new lesson')}</button>
          </CvSection>
        </div>
      );
    }

    // ── List view ──────────────────────────────────────────────────────────
    return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',justifyContent:'flex-start'}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={{
            padding:'9px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)',
            color:'var(--ink)',fontSize:13,fontFamily:'inherit',cursor:'pointer',minWidth:170}}>
            {filterChips.map(c => <option key={c.id} value={c.id}>{c.l}</option>)}
          </select>
        </div>
        <MobileFab onClick={()=>openForm('newStudent')} label={tr('ចុះឈ្មោះ​សិស្ស','Enroll student')}/>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {filtered.length === 0 && (
            <div style={{padding:'40px 16px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
              {tr('គ្មាន​សិស្ស','No students')}
            </div>
          )}
          {filtered.map(s => {
            const tMeta = ST_TYPE_META[s.studentType] || ST_TYPE_META['ធម្មតា'];
            return (
              <div key={s.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
                <button onClick={()=>{ setMobileProfileId(s.id); setOpenSections({bio:true}); }} style={{
                  width:'100%',padding:'11px 14px',display:'flex',alignItems:'center',gap:10,
                  background:'transparent',border:'none',cursor:'pointer',textAlign:'left',
                }}>
                  <Avatar tag={s.photo} size={36}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,lineHeight:1.3,
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {s.en || s.name}
                    </div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1}}>{s.id} · {clsKm(s.cls)}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                    <div style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,
                      background:tMeta.bg,color:tMeta.color,border:`1px solid ${tMeta.color}33`}}>
                      {stTypeEn(s.studentType)}
                    </div>
                    <div style={{fontSize:13,color:'var(--ink-3)'}}>›</div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="សិស្ស"
        en={`${allStudents.length} active${APPLICATIONS_LIST.length > 0 ? ` · ${APPLICATIONS_LIST.length} applications pending` : ''} · ${examReady} exam-ready`}
        action={
          <div style={{display:'flex',gap:8}}>
            <Btn kind="ghost" size="md" icon={<Icon name="search" size={14}/>}>{tr('តម្រង','Filter')}</Btn>
            <Btn kind="ghost" size="md" icon={<Icon name="download" size={14}/>} onClick={exportStudentsCSV}>{tr('នាំចេញ CSV','Export CSV')}</Btn>
            <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>} onClick={() => openForm('newStudent')}>{tr('ចុះឈ្មោះ​សិស្ស','Enroll')}</Btn>
          </div>
        }
      />

      {/* KPI strip — desktop only */}
      {(() => {
        const avgMock = allStudents.length > 0 ? Math.round(allStudents.reduce((a,s)=>a+(s.mock_avg||0),0)/allStudents.length) : '—';
        const cleared = allStudents.filter(s=>s.status==='Cleared').length;
        return (
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
            <Card><Stat label={tr('សកម្ម','Active')}         value={allStudents.length} sub="ខែនេះ"/></Card>
            <Card><Stat label={tr('ការ​ចូលរៀន','Pending')}   value={APPLICATIONS_LIST.length} sub="ពាក្យ​ស្នើ"/></Card>
            <Card><Stat label={tr('នឹង​ប្រឡង','Exam-ready')}  value={examReady} sub="ខាង​មុខ"/></Card>
            <Card><Stat label={tr('មធ្យម','Avg mock')}        value={avgMock === '—' ? '—' : `${avgMock}%`}/></Card>
            <Card><Stat label={tr('បានជាប់','Cleared')}       value={cleared} sub="ទាំង​អស់"/></Card>
          </div>
        );
      })()}

      <Card pad={0}>
        {/* Tab bar */}
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:4,alignItems:'center'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setEditing(false); }} style={{
              display:'inline-flex',alignItems:'center',gap:7,
              padding:'7px 12px',border:'none',
              background: tab===t.id ? 'var(--surface-muted)' : 'transparent',
              color:       tab===t.id ? 'var(--ink)'           : 'var(--ink-3)',
              borderRadius:7, fontSize:12, fontWeight: tab===t.id ? 600 : 500, cursor:'pointer',
            }}>
              <Icon name={t.icon} size={13}/>
              {tr(t.km, t.en)}
            </button>
          ))}
          <div style={{flex:1}}/>
          {tab==='directory' && (
            <div style={{display:'flex',background:'var(--surface-muted)',border:'1px solid var(--border)',borderRadius:7,padding:2}}>
              {['list','grid'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'4px 10px',border:'none',
                  background: view===v ? 'var(--surface)' : 'transparent',
                  color:       view===v ? 'var(--ink)'     : 'var(--ink-3)',
                  borderRadius:5,fontSize:11,fontWeight:500,cursor:'pointer',textTransform:'capitalize',
                }}>{v}</button>
              ))}
            </div>
          )}
          {tab==='docs' && <StPrintMenuStudents students={allStudents}/>}
        </div>

        {/* Directory */}
        {tab==='directory' && (
          <div>
            <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:6,flexWrap:'wrap'}}>
              {[
                {id:'all',        l:tr('ទាំងអស់','All'),             n: allStudents.length},
                {id:'new',        l:tr('ថ្មី','New'),                 n: allStudents.filter(s=>s.status==='New').length},
                {id:'inprogress', l:tr('កំពុង​បន្ត','In progress'),   n: allStudents.filter(s=>s.status==='In progress').length},
                {id:'exam',       l:tr('នឹង​ប្រឡង','Exam-ready'),    n: allStudents.filter(s=>s.status==='Road exam soon').length},
                {id:'cleared',    l:tr('ជាប់','Cleared'),             n: allStudents.filter(s=>s.status==='Cleared').length},
                {id:'graduated',  l:tr('🎓 ជាប់ប្រឡង','🎓 Passed'),    n: allStudents.filter(s=>s.exam_result==='pass').length},
                {id:'B', l:'Class B', n: allStudents.filter(s=>clsLetter(s.cls)==='B').length},
                {id:'A', l:'Class A', n: allStudents.filter(s=>clsLetter(s.cls)==='A').length},
                {id:'C', l:'Class C', n: allStudents.filter(s=>clsLetter(s.cls)==='C').length},
                {id:'sep'},
                {id:'t_normal',  l:tr('ធម្មតា','Regular'),  n: allStudents.filter(s=>s.studentType==='ធម្មតា').length},
                {id:'t_special', l:tr('ពិសេស','Special'),    n: allStudents.filter(s=>s.studentType==='ពិសេស').length},
                {id:'t_ssw',     l:'SSW',                     n: allStudents.filter(s=>s.studentType==='SSW').length},
              ].map(d => d.id==='sep' ? (
                <div key="sep" style={{width:1,alignSelf:'stretch',background:'var(--border)',margin:'0 2px'}}/>
              ) : (
                <button key={d.id} onClick={() => setFilter(d.id)} style={{
                  padding:'4px 10px',
                  background: filter===d.id ? 'var(--ink)'    : 'var(--surface)',
                  color:       filter===d.id ? 'var(--bg)'    : 'var(--ink-2)',
                  border:'1px solid '+(filter===d.id ? 'var(--ink)' : 'var(--border)'),
                  borderRadius:999,fontSize:11,fontWeight:500,cursor:'pointer',
                  display:'inline-flex',alignItems:'center',gap:6,
                }}>
                  {d.l} <span style={{opacity:.6,fontFamily:'"JetBrains Mono",monospace'}}>{d.n}</span>
                </button>
              ))}
            </div>
            {allStudents.length === 0 ? (
              <div style={{padding:'60px 24px',textAlign:'center',color:'var(--ink-3)'}}>
                <div style={{fontSize:36,marginBottom:12}}>🎓</div>
                <div style={{fontSize:16,fontWeight:600,color:'var(--ink)',marginBottom:6}}>{tr('មិន​ទាន់​មាន​សិស្ស','No students yet')}</div>
                <div style={{fontSize:13,marginBottom:20}}>Add your first student to get started</div>
                <Btn kind="primary" size="md" icon={<Icon name="plus" size={14}/>} onClick={() => openForm('newStudent')}>{tr('ចុះឈ្មោះ​សិស្ស','Enroll')}</Btn>
              </div>
            ) : view==='list' ? (
              <StudentsList students={filtered} onSelect={s => setSelectedId(s.id)} selected={selected}
                onProfile={goToProfile} onEdit={goToEdit} onDelete={deleteStudent}/>
            ) : (
              <StudentsGrid students={filtered} onSelect={s => setSelectedId(s.id)} selected={selected}
                onProfile={goToProfile} onEdit={goToEdit} onDelete={deleteStudent}/>
            )}
          </div>
        )}

        {tab==='profile' && !editing && (
          <StudentProfile s={selected} onEdit={() => goToEdit(selected)}
            onBook={bookLesson} onMessage={goToMessages} onAddPayment={addPayment}
            onSavePhoto={savePhoto}
            onCall={s => toast(`📞 ${s.phone}`, 'neutral')}
            onSaveDoc={(id, field, val) => {
              const i = STUDENTS.findIndex(s => s.id === id);
              if (i !== -1) { STUDENTS[i][field] = val; if(window.saveAllData)window.saveAllData(); forceUpdate(); }
            }}
            onSavePaid={(id, val) => {
              const i = STUDENTS.findIndex(s => s.id === id);
              if (i !== -1) { STUDENTS[i].paid = val; if(window.saveAllData)window.saveAllData(); forceUpdate(); toast(tr('បានបង់'),'good'); }
            }}
            onSaveBio={(id, updates) => {
              const i = STUDENTS.findIndex(s => s.id === id);
              if (i !== -1) { Object.assign(STUDENTS[i], updates); if(window.saveAllData)window.saveAllData(); forceUpdate(); toast(tr('បានរក្សាទុក','Saved'),'good'); }
            }}
          />
        )}
        {tab==='profile' && editing && selected && (
          <StudentEditPanel key={selected.id} s={selected} onSave={saveStudent} onCancel={() => setEditing(false)} onDelete={deleteStudent}/>
        )}
        {tab==='pipeline' && (
          <StudentEnrollmentDetail
            s={selected}
            onEdit={() => goToEdit(selected)}
            onAddPayment={addPayment}
            onSavePaid={(id, val) => {
              const i = STUDENTS.findIndex(s => s.id === id);
              if (i !== -1) { STUDENTS[i].paid = val; if(window.saveAllData)window.saveAllData(); forceUpdate(); toast(tr('បានបង់'),'good'); }
            }}
          />
        )}
        {tab==='progress' && <StudentsProgress students={selected ? [selected] : []} onView={goToProfile} onSave={saveStudentProgress}/>}
        {tab==='messages' && <StudentMessages activeStudentId={selectedId} students={allStudents}/>}
        {tab==='docs'     && <StudentDocs students={selected ? [selected] : []} onToggleDoc={(id,field,val) => {
          const i = STUDENTS.findIndex(s => s.id === id);
          if (i !== -1) { STUDENTS[i][field] = val; if(window.saveAllData)window.saveAllData(); forceUpdate(); }
        }}/>}
      </Card>
    </div>
  );
};

const studentStatusTone = (s) => ({
  'New':'accent','In progress':'neutral','Road exam soon':'warn','Cleared':'good',
}[s] || 'neutral');

// ── Student-type tag ─────────────────────────────────────────────────────────
const ST_TYPE_META = {
  'ធម្មតា': { label:'ធម្មតា', color:'#4A4A47', bg:'#F0F0EC' },
  'ពិសេស':  { label:'ពិសេស',  color:'#8E5223', bg:'#F6E9DC' },
  'SSW':    { label:'SSW',    color:'#2A5DB0', bg:'#E5EBF5' },
};
const StTypeTag = ({ type }) => {
  const m = ST_TYPE_META[type] || ST_TYPE_META['ធម្មតា'];
  return (
    <span style={{
      fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4,
      background:m.bg, color:m.color, whiteSpace:'nowrap', flexShrink:0,
      fontFamily:'var(--font-km),sans-serif',
    }}>{m.label}</span>
  );
};

// ── Directory: list ──────────────────────────────────────────────────────────
const StudentsList = ({ students, onSelect, selected, onProfile, onEdit, onDelete }) => {
  const { toast, tr } = useAppActions();
  const [confirmDel, setConfirmDel] = React.useState(null);

  return (
    <div style={{overflowX:'auto'}}>
    <div style={{minWidth:600}}>
      <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.5fr 0.8fr 1fr 1fr 1.3fr 0.7fr 100px',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',borderBottom:'1px solid var(--border)'}}>
        <div>{tr('សិស្ស','Student')}</div><div>Class</div><div>Instructor</div>
        <div>Progress</div><div>{tr('មេរៀន​បន្ទាប់','Next lesson')}</div><div>Mock</div><div style={{textAlign:'right'}}>Actions</div>
      </div>
      {students.map((s,i) => (
        <div key={s.id} onClick={() => onSelect(s)} style={{
          padding:'12px 16px',display:'grid',gridTemplateColumns:'1.5fr 0.8fr 1fr 1fr 1.3fr 0.7fr 100px',gap:14,
          alignItems:'center',
          borderBottom: i<students.length-1 ? '1px solid var(--border)' : 'none',
          background: selected?.id===s.id ? 'var(--surface-muted)' : 'transparent',
          cursor:'pointer',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
            <Avatar tag={s.photo} size={32} ring={selected?.id===s.id}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'flex',alignItems:'center',gap:6}}>
                {s.name}
                {s.studentType && s.studentType!=='ធម្មតា' && <StTypeTag type={s.studentType}/>}
              </div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.id} · {s.en} · {s.age}y</div>
            </div>
          </div>
          <div style={{fontSize:12,color:'var(--ink-2)'}}>{s.cls}</div>
          <div style={{fontSize:12,color:'var(--ink-2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.inst || '—'}</div>
          <div>
            <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
              <div style={{width:`${Math.min(100,(s.hours/(s.target||1))*100)}%`,height:'100%',background:'var(--accent)'}}/>
            </div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4,fontVariantNumeric:'tabular-nums'}}>{s.hours}/{s.target}h · {s.lessons_count} lessons</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <div style={{fontSize:11,color:'var(--ink-2)'}}>{s.next || '—'}</div>
            <Badge tone={studentStatusTone(s.status)}>{s.status}</Badge>
          </div>
          <div style={{fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums',color:s.mock_avg>=85?'var(--good)':s.mock_avg>=70?'var(--ink)':'var(--warn)'}}>
            {s.mock_avg > 0 ? `${s.mock_avg}%` : '—'}
          </div>
          <div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e => e.stopPropagation()}>
            {confirmDel === s.id ? (
              <>
                <Btn kind="danger" size="sm" onClick={() => { onDelete(s.id); setConfirmDel(null); }}>លុប?</Btn>
                <Btn kind="ghost" size="sm" onClick={() => setConfirmDel(null)}>ទេ</Btn>
              </>
            ) : (
              <>
                <Btn kind="ghost" size="sm" onClick={() => onProfile(s)}>មើល</Btn>
                <Btn kind="ghost" size="sm" onClick={() => onEdit(s)}>កែ</Btn>
                <button onClick={() => setConfirmDel(s.id)} title="លុបសិស្ស" style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,padding:'2px 4px',borderRadius:4,lineHeight:1}}>✕</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
};

// ── Directory: grid ──────────────────────────────────────────────────────────
const StudentsGrid = ({ students, onSelect, selected, onProfile, onEdit, onDelete }) => (
  <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
    {students.map(s => (
      <div key={s.id} onClick={() => onSelect(s)} style={{
        padding:14,
        background: selected?.id===s.id ? 'var(--surface-muted)' : 'var(--surface)',
        border:'1px solid '+(selected?.id===s.id ? 'var(--border-strong)' : 'var(--border)'),
        borderRadius:10, cursor:'pointer',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{position:'relative',flexShrink:0}}>
            <Avatar tag={s.photo} size={48}/>
            {(s.paid||0) >= 1 && (
              <div style={{
                position:'absolute',bottom:0,right:0,
                width:16,height:16,borderRadius:'50%',
                background:'var(--good)',border:'2px solid var(--surface)',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                <Icon name="check" size={8} stroke={3} color="#fff"/>
              </div>
            )}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',alignItems:'center',gap:6}}>
              {s.id} · {s.cls}
              {s.studentType && s.studentType!=='ធម្មតា' && <StTypeTag type={s.studentType}/>}
            </div>
          </div>
          <div style={{display:'flex',gap:5,alignItems:'center'}}>
            <div style={{
              fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,
              background: s.trans==='MT' ? '#B0413E' : '#1A4FA8',
              color:'#fff',
            }}>{s.trans||'AT'}</div>
            <Badge tone={studentStatusTone(s.status)}>{s.status==='Road exam soon'?'Exam':s.status}</Badge>
          </div>
        </div>
        {(() => {
          const pracCount = s.trans === 'MT' ? 13 : 10;
          const thDone = (s.theory_done || []).filter(Boolean).length;
          const prDone = (s.practice_done || []).filter(Boolean).length;
          return (
            <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:8}}>
              {[{l:'Theory',done:thDone,total:3},{l:'Practice',done:prDone,total:pracCount}].map(r=>(
                <div key={r.l}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.05em',textTransform:'uppercase'}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:600,fontVariantNumeric:'tabular-nums',color:r.done===r.total?'var(--good)':'var(--ink-3)'}}>{r.done}/{r.total}</span>
                  </div>
                  <div style={{height:5,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
                    <div style={{width:`${Math.min(100,(r.done/r.total)*100)}%`,height:'100%',background:r.done===r.total?'var(--good)':'var(--accent)'}}/>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        {/* Study history — show only filled dates */}
        {(() => {
          const rows = [
            { label:'ចូលរៀន',   date: s.study_start, result: null },
            { label:'បញ្ចប់',    date: s.study_end,   result: null },
            { label:'ដាក់ពាក្យ', date: s.exam_apply,  result: null },
            { label:'ប្រឡង',     date: s.exam_date,   result: s.exam_result },
            ...(s.exam_resits||[]).map((r,i) => ({
              label: `សង${i+1}`, date: r.date, result: r.result,
            })),
          ].filter(r => r.date);
          if (!rows.length) return null;
          return (
            <div style={{marginTop:10,paddingTop:8,borderTop:'1px dashed var(--border)',display:'flex',flexDirection:'column',gap:4}}>
              {rows.map((r,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:11}}>
                  <span style={{color:'var(--ink-3)',fontSize:10}}>{r.label}</span>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,fontWeight:500}}>{r.date}</span>
                    {r.result && (
                      <span style={{
                        fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:3,
                        background: r.result==='pass'?'var(--good)':r.result==='fail'?'var(--danger)':'var(--surface-muted)',
                        color: r.result?'#fff':'var(--ink)',
                      }}>{r.result==='pass'?'ជាប់':'ធ្លាក់'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        <div style={{marginTop:12,display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}} onClick={e => e.stopPropagation()}>
          <Btn kind="ghost" size="sm" onClick={() => onEdit(s)}>កែ</Btn>
          <Btn kind="ghost" size="sm" onClick={() => onProfile(s)}>Profile</Btn>
          {onDelete && <button onClick={() => { if(window.confirm(`លុប ${s.name}?`)) onDelete(s.id); }} title="លុបសិស្ស" style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:14,padding:'2px 4px',lineHeight:1}}>✕</button>}
        </div>
      </div>
    ))}
  </div>
);

// ── Biography inline-edit card (module-level to avoid focus-loss) ────────────
const BiographyCard = ({ s, onSave }) => {
  const [editing, setEditing] = React.useState(false);
  const [name,        setName]        = React.useState(s.name          || '');
  const [en,          setEn]          = React.useState(s.en            || '');
  const [gender,      setGender]      = React.useState(s.gender        || 'M');
  const [age,         setAge]         = React.useState(String(s.age    || ''));
  const [nationality, setNationality] = React.useState(s.nationality   || 'ខ្មែរ');
  const [phone,       setPhone]       = React.useState(s.phone         || '');
  const [telegram,    setTelegram]    = React.useState(s.telegram      || '');
  const [licenseNo,   setLicenseNo]   = React.useState(s.license_no    || '');
  const [natId,       setNatId]       = React.useState(s.natId         || '');
  const [examLoc,     setExamLoc]     = React.useState(s.exam_location || '');
  const [eyeLeft,     setEyeLeft]     = React.useState(s.eye_left      || '');
  const [eyeRight,    setEyeRight]    = React.useState(s.eye_right     || '');
  const [eyeBoth,     setEyeBoth]     = React.useState(s.eye_both      || '');
  const [glasses,     setGlasses]     = React.useState(normEye(s.glasses));
  const [addrHouse,   setAddrHouse]   = React.useState(s.addr_house    || '');
  const [addrStreet,  setAddrStreet]  = React.useState(s.addr_street   || '');
  const [addrVillage, setAddrVillage] = React.useState(s.addr_village  || '');
  const [addrCommune, setAddrCommune] = React.useState(s.addr_commune  || '');
  const [addrDist,    setAddrDist]    = React.useState(s.addr_district || s.district || '');
  const [addrProv,    setAddrProv]    = React.useState(s.addr_province || '');
  const [studyGoal,   setStudyGoal]   = React.useState(s.study_goal    || '');
  const [referral,    setReferral]    = React.useState(s.referral      || '');
  const [studentType, setStudentType] = React.useState(s.studentType   || 'ធម្មតា');

  // Sync state when student changes (different selection)
  React.useEffect(() => {
    if (editing) return;
    setName(s.name || ''); setEn(s.en || ''); setGender(s.gender || 'M');
    setAge(String(s.age || '')); setNationality(s.nationality || 'ខ្មែរ');
    setPhone(s.phone || ''); setTelegram(s.telegram || ''); setLicenseNo(s.license_no || ''); setNatId(s.natId || ''); setExamLoc(s.exam_location || ''); setEyeLeft(s.eye_left || ''); setEyeRight(s.eye_right || ''); setEyeBoth(s.eye_both || ''); setGlasses(normEye(s.glasses));
    setAddrHouse(s.addr_house || ''); setAddrStreet(s.addr_street || '');
    setAddrVillage(s.addr_village || ''); setAddrCommune(s.addr_commune || '');
    setAddrDist(s.addr_district || s.district || ''); setAddrProv(s.addr_province || '');
    setStudyGoal(s.study_goal || ''); setReferral(s.referral || ''); setStudentType(s.studentType || 'ធម្មតា');
  }, [s.id]);

  const cancel = () => {
    setEditing(false);
    setName(s.name || ''); setEn(s.en || ''); setGender(s.gender || 'M');
    setAge(String(s.age || '')); setNationality(s.nationality || 'ខ្មែរ');
    setPhone(s.phone || ''); setTelegram(s.telegram || ''); setLicenseNo(s.license_no || ''); setNatId(s.natId || ''); setExamLoc(s.exam_location || ''); setEyeLeft(s.eye_left || ''); setEyeRight(s.eye_right || ''); setEyeBoth(s.eye_both || ''); setGlasses(normEye(s.glasses));
    setAddrHouse(s.addr_house || ''); setAddrStreet(s.addr_street || '');
    setAddrVillage(s.addr_village || ''); setAddrCommune(s.addr_commune || '');
    setAddrDist(s.addr_district || s.district || ''); setAddrProv(s.addr_province || '');
    setStudyGoal(s.study_goal || ''); setReferral(s.referral || ''); setStudentType(s.studentType || 'ធម្មតា');
  };

  const save = () => {
    onSave(s.id, {
      name: name.trim() || s.name, en: en.trim(), gender,
      age: parseInt(age) || s.age || 24, nationality: nationality.trim(),
      phone: phone.trim(), telegram: telegram.trim(), license_no: licenseNo.trim(), natId: natId.trim(), exam_location: examLoc.trim(), eye_left: eyeLeft, eye_right: eyeRight, eye_both: eyeBoth, glasses,
      addr_house: addrHouse.trim(), addr_street: addrStreet.trim(),
      addr_village: addrVillage.trim(), addr_commune: addrCommune.trim(),
      addr_district: addrDist.trim(), addr_province: addrProv.trim(),
      study_goal: studyGoal, referral, studentType,
    });
    setEditing(false);
  };

  const inp = {style:{width:'100%',padding:'6px 9px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}};
  const sel = {style:{width:'100%',padding:'6px 9px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}};
  const g2  = {style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}};
  const Lbl = ({children}) => <div style={{fontSize:10,color:'var(--ink-3)',marginBottom:3,fontWeight:500}}>{children}</div>;

  if (editing) return (
    <div style={{border:'1px solid var(--accent)',borderRadius:10,overflow:'hidden'}}>
      <div style={{padding:'8px 12px',background:'var(--accent-soft)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--accent)'}}>ប្រវត្តិ · BIOGRAPHY</span>
        <div style={{display:'flex',gap:6}}>
          <Btn kind="ghost" size="sm" onClick={cancel}>បោះបង់</Btn>
          <Btn kind="primary" size="sm" onClick={save}>✓ រក្សាទុក</Btn>
        </div>
      </div>
      <div style={{padding:12,display:'flex',flexDirection:'column',gap:0}}>
        <div {...g2}>
          <div><Lbl>ឈ្មោះ​ខ្មែរ · Name KH</Lbl><input {...inp} value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><Lbl>ឈ្មោះ​អង្គ​លេស · Name EN</Lbl><input {...inp} value={en} onChange={e=>setEn(e.target.value)}/></div>
        </div>
        <div {...g2}>
          <div><Lbl>ភេទ · Gender</Lbl>
            <select {...sel} value={gender} onChange={e=>setGender(e.target.value)}>
              <option value="M">♂ ប្រុស · Male</option>
              <option value="F">♀ ស្រី · Female</option>
            </select>
          </div>
          <div><Lbl>អាយុ · Age</Lbl><input {...inp} type="number" min="16" max="80" value={age} onChange={e=>setAge(e.target.value)}/></div>
        </div>
        <div {...g2}>
          <div><Lbl>ប្រភេទសិស្ស · Student Type</Lbl>
            <select {...sel} value={studentType} onChange={e=>setStudentType(e.target.value)}>
              <option value="ធម្មតា">ធម្មតា · Regular</option>
              <option value="ពិសេស">ពិសេស · Special</option>
              <option value="SSW">SSW</option>
            </select>
          </div>
          <div><Lbl>ជនជាតិ · Nationality</Lbl><input {...inp} value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="ខ្មែរ"/></div>
        </div>
        <div {...g2}>
          <div><Lbl>លេខ​ទូរស័ព្ទ · Phone</Lbl><input {...inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+855 12 000 000"/></div>
          <div><Lbl>Telegram Chat ID</Lbl><input {...inp} value={telegram} onChange={e=>setTelegram(e.target.value)} placeholder="123456789"/></div>
          <div><Lbl>លេខ​បណ្ណ​បើកបរ · License No.</Lbl><input {...inp} value={licenseNo} onChange={e=>setLicenseNo(e.target.value)} placeholder="01234567"/></div>
          <div><Lbl>លេខ​អត្តសញ្ញាណប័ណ្ណ · National ID</Lbl><input {...inp} value={natId} onChange={e=>setNatId(e.target.value)} placeholder="010203045"/></div>
          <div><Lbl>ទីតាំង​ប្រឡង · Exam location</Lbl><input {...inp} value={examLoc} onChange={e=>setExamLoc(e.target.value)} placeholder="ភ្នំពេញ"/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
          <div><Lbl>ភ្នែកឆ្វេង · Left</Lbl>
            <select {...sel} value={eyeLeft} onChange={e=>setEyeLeft(e.target.value)}>
              {EYE_OPTS.map(v=><option key={v||'none'} value={v}>{v||'—'}</option>)}
            </select>
          </div>
          <div><Lbl>ភ្នែកស្ដាំ · Right</Lbl>
            <select {...sel} value={eyeRight} onChange={e=>setEyeRight(e.target.value)}>
              {EYE_OPTS.map(v=><option key={v||'none'} value={v}>{v||'—'}</option>)}
            </select>
          </div>
          <div><Lbl>ភ្នែកទាំងពីរ · Both</Lbl>
            <select {...sel} value={eyeBoth} onChange={e=>setEyeBoth(e.target.value)}>
              {EYE_OPTS.map(v=><option key={v||'none'} value={v}>{v||'—'}</option>)}
            </select>
          </div>
        </div>
        <div {...g2}>
          <div><Lbl>ស្ថានភាពភ្នែក · Eye condition</Lbl>
            <select {...sel} value={normEye(glasses)} onChange={e=>setGlasses(e.target.value)}>
              {EYE_COND_OPTS.map(o=> <option key={o.v} value={o.v}>{o.v} · {o.en}</option>)}
            </select>
          </div>
        </div>
        <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',margin:'8px 0 6px'}}>អាសយដ្ឋាន · ADDRESS</div>
        <div {...g2}>
          <div><Lbl>ផ្ទះ​លេខ · House No.</Lbl><input {...inp} value={addrHouse} onChange={e=>setAddrHouse(e.target.value)} placeholder="123"/></div>
          <div><Lbl>ផ្លូវ · Street</Lbl><input {...inp} value={addrStreet} onChange={e=>setAddrStreet(e.target.value)} placeholder="ផ្លូវ 310"/></div>
          <div><Lbl>ភូមិ · Village</Lbl><input {...inp} value={addrVillage} onChange={e=>setAddrVillage(e.target.value)}/></div>
          <div><Lbl>ឃុំ/សង្កាត់ · Commune</Lbl><input {...inp} value={addrCommune} onChange={e=>setAddrCommune(e.target.value)}/></div>
          <div><Lbl>ស្រុក/ខណ្ឌ · District</Lbl><input {...inp} value={addrDist} onChange={e=>setAddrDist(e.target.value)}/></div>
          <div><Lbl>ខេត្ត/រាជធានី · Province</Lbl><input {...inp} value={addrProv} onChange={e=>setAddrProv(e.target.value)} placeholder="ភ្នំពេញ"/></div>
        </div>
        <div {...g2}>
          <div><Lbl>គោលបំណង​សិក្សា · Purpose</Lbl>
            <select {...sel} value={studyGoal} onChange={e=>setStudyGoal(e.target.value)}>
              <option value="">—</option>
              <option value="បើកបរក្នុងស្រុកខ្មែរ">ក្នុងស្រុកខ្មែរ</option>
              <option value="បើកបរនៅបរទេស">នៅបរទេស</option>
            </select>
          </div>
          <div><Lbl>ស្គាល់​សាលា​តាម · Referral</Lbl>
            <select {...sel} value={referral} onChange={e=>setReferral(e.target.value)}>
              <option value="">—</option>
              <option value="នៅជិតសាលា">នៅជិតសាលា</option>
              <option value="មិត្តភក្ដិ">មិត្តភក្ដិ</option>
              <option value="គ្រួសារ">គ្រួសារ</option>
              <option value="ការផ្សព្វផ្សាយ">ការផ្សព្វផ្សាយ</option>
              <option value="ផ្សេងៗ">ផ្សេងៗ</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // View mode — always read from s prop so it reflects the latest saved data
  const addrParts = [
    s.addr_house, s.addr_street,
    s.addr_village, s.addr_commune,
    s.addr_district||s.district, s.addr_province,
  ].filter(Boolean);
  const bioRows = [
    {l:'ឈ្មោះ​ខ្មែរ',     v: s.name                                    || '—'},
    {l:'ឈ្មោះ​អង្គ​លេស',   v: s.en                                      || '—'},
    {l:'ភេទ',            v: s.gender==='M'?'♂ ប្រុស':'♀ ស្រី'},
    {l:'អាយុ',           v: s.age ? `${s.age} ឆ្នាំ` : '—'},
    {l:'ប្រភេទសិស្ស',     v: s.studentType                              || 'ធម្មតា'},
    {l:'ជនជាតិ',         v: s.nationality                              || '—'},
    {l:'លេខ​ទូរស័ព្ទ',    v: s.phone                                   || '—'},
    {l:'Telegram',       v: s.telegram                                || '—'},
    {l:'លេខ​បណ្ណ​បើកបរ',  v: s.license_no                              || '—'},
    {l:'លេខ​អត្តសញ្ញាណប័ណ្ណ', v: s.natId                                || '—'},
    {l:'ទីតាំង​ប្រឡង',    v: s.exam_location                           || '—'},
    {l:'ភ្នែកឆ្វេង',     v: s.eye_left                                || '—'},
    {l:'ភ្នែកស្ដាំ',      v: s.eye_right                               || '—'},
    {l:'ភ្នែកទាំងពីរ',    v: s.eye_both                                || '—'},
    {l:'ស្ថានភាពភ្នែក',   v: s.glasses ? normEye(s.glasses)             : '—'},
    {l:'អាសយដ្ឋាន',      v: (s.address && s.address!=='—') ? s.address : (addrParts.length ? addrParts.join(', ') : '—')},
    {l:'គោលបំណង​សិក្សា', v: s.study_goal                              || '—'},
    {l:'ស្គាល់​សាលា​តាម', v: s.referral                                || '—'},
  ];
  return (
    <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
      <div style={{padding:'8px 12px',background:'var(--surface-muted)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)'}}>ប្រវត្តិ · BIOGRAPHY</span>
        <button onClick={()=>setEditing(true)} style={{background:'none',border:'1px solid var(--border)',borderRadius:5,padding:'3px 8px',fontSize:11,cursor:'pointer',color:'var(--ink-2)'}}>✎ កែ</button>
      </div>
      {bioRows.map((r,i) => (
        <div key={i} style={{display:'grid',gridTemplateColumns:'130px 1fr',gap:10,padding:'8px 12px',borderTop:'1px solid var(--border)',background:i%2===0?'var(--surface)':'var(--surface-muted)',fontSize:12}}>
          <span style={{color:'var(--ink-3)',fontWeight:500}}>{r.l}</span>
          <span style={{color:'var(--ink)',wordBreak:'break-word'}}>{r.v}</span>
        </div>
      ))}
    </div>
  );
};

// ── Payment card (module-level to avoid remount) ────────────────────────────
const PaymentCard = ({ s, onAddPayment, onMarkPaid }) => {
  const { tr } = useAppActions();
  const [showForm, setShowForm] = React.useState(false);
  const [amount,   setAmount]   = React.useState('');
  const [date,     setDate]     = React.useState(new Date().toISOString().split('T')[0]);
  const [method,   setMethod]   = React.useState('cash');

  const basePrice = studentPrice(s);
  const log = s.payment_log || [];
  const logTotal = log.reduce((sum, e) => sum + (e.amount || 0), 0);
  const displayPaid = log.length > 0 ? logTotal : Math.round((s.paid || 0) * basePrice);
  const remaining = Math.max(0, basePrice - displayPaid);
  const pct = Math.min(100, Math.round((displayPaid / Math.max(1, basePrice)) * 100));

  const inp = (extra) => ({style:{padding:'5px 8px',border:'1px solid var(--border)',borderRadius:5,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',...extra}});

  const addPayment = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onAddPayment && onAddPayment(s.id, { amount: amt, date, method });
    setAmount('');
    setShowForm(false);
  };

  return (
    <Card label={tr('ការ​ទូទាត់','PAYMENTS')}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--font-display)',color:displayPaid>=basePrice?'var(--good)':'var(--ink)'}}>
            ${displayPaid} <span style={{fontSize:13,fontWeight:400,color:'var(--ink-3)'}}>/ ${basePrice}</span>
          </div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{pct}% បាន​បង់</div>
        </div>
        {displayPaid >= basePrice ? (
          <div style={{width:36,height:36,borderRadius:'50%',background:'var(--good)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Icon name="check" size={16} stroke={3} color="#fff"/>
          </div>
        ) : (
          <button onClick={() => onMarkPaid && onMarkPaid(s.id, 1)} style={{border:'1px dashed var(--border)',background:'var(--surface)',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer',color:'var(--ink-2)'}}>
            ✓ Full
          </button>
        )}
      </div>
      <div style={{height:6,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden',marginBottom:remaining>0?6:10}}>
        <div style={{width:`${pct}%`,height:'100%',background:'var(--good)',transition:'width .3s'}}/>
      </div>
      {remaining > 0 && (
        <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:8}}>
          នៅខ្វះ: <b style={{color:'var(--warn)'}}>${remaining}</b>
        </div>
      )}
      {log.length > 0 && (
        <div style={{marginBottom:8,paddingTop:6,borderTop:'1px dashed var(--border)'}}>
          {log.map((e,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:i<log.length-1?'1px solid var(--border)':'none',color:'var(--ink-2)'}}>
              <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10,color:'var(--ink-3)'}}>{e.date}</span>
              <span>{e.method}</span>
              <span style={{fontWeight:600,color:'var(--good)'}}>${e.amount}</span>
            </div>
          ))}
        </div>
      )}
      {showForm ? (
        <div style={{border:'1px solid var(--border)',borderRadius:8,padding:10,marginTop:4}}>
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="$0"
              {...inp({width:70})} onKeyDown={e=>e.key==='Enter'&&addPayment()}/>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} {...inp({flex:1})}/>
          </div>
          <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
            {['cash','ABA','Wing','bank'].map(m => (
              <button key={m} onClick={()=>setMethod(m)} style={{
                padding:'3px 8px',fontSize:10,borderRadius:4,cursor:'pointer',
                border:'1px solid '+(method===m?'var(--accent)':'var(--border)'),
                background:method===m?'var(--accent-soft)':'transparent',
                color:method===m?'var(--accent)':'var(--ink-3)',
              }}>{m}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:6}}>
            <Btn kind="primary" size="sm" onClick={addPayment}>✓ Save</Btn>
            <Btn kind="ghost" size="sm" onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <button onClick={()=>setShowForm(true)} style={{fontSize:11,border:'1px dashed var(--border)',background:'transparent',borderRadius:6,padding:'4px 10px',cursor:'pointer',color:'var(--ink-2)',marginTop:2}}>
          + បន្ថែម​ការ​បង់ · Add payment
        </button>
      )}
    </Card>
  );
};

// ── Profile tab ──────────────────────────────────────────────────────────────
const StudentProfile = ({ s, onEdit, onBook, onMessage, onCall, onSaveDoc, onSavePaid, onSaveBio, onAddPayment, onSavePhoto }) => {
  const { tr } = useAppActions();
  if (!s) return (
    <div style={{padding:'60px 24px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      ជ្រើស​សិស្ស​ពី​បញ្ជី​ · Select a student from the directory
    </div>
  );

  const skills = [
    {k:'Theory',  l:'ច្បាប់​ចរាចរណ៍',      v:s.theory},
    {k:'Yard',    l:'ការ​បើក​ក្នុង​ទីលាន',   v:s.yard},
    {k:'Parking', l:'ការ​ចត',              v:s.parking},
    {k:'City',    l:'ការ​បើក​ក្នុង​ទីក្រុង', v:s.city},
    {k:'Highway', l:'ផ្លូវ​លឿន',            v:s.highway},
  ];

  const docs = [
    {k:'permit',   l:'Learner permit',  ok:s.permit},
    {k:'id_doc',   l:'អត្តសញ្ញាណប័ណ្ណ', ok:s.id_doc},
    {k:'medical',  l:'Medical cert.',    ok:s.medical},
    {k:'photo_id', l:'រូប 4×6',          ok:s.photo_id},
  ];

  const mockHistory = s.mock_history || (s.mock_avg > 0 ? [s.mock_avg] : []);

  return (
    <div>
      {/* Header */}
      <div style={{padding:'24px 24px 20px',display:'flex',alignItems:'center',gap:20,borderBottom:'1px solid var(--border)',background:'var(--surface-muted)'}}>
        <UploadAvatar id={s.id} photo={s.photo} size={96} ring onUpload={onSavePhoto}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap'}}>
            <div style={{fontSize:26,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{s.name}</div>
            <div style={{fontSize:13,color:'var(--ink-3)'}}>{s.en} · {s.id} · {s.age}y{s.dob?` · 🎂 ${s.dob}`:''} · {s.gender==='M'?'♂':'♀'}</div>
            <Badge tone={studentStatusTone(s.status)}>{s.status}</Badge>
          </div>
          <div style={{display:'flex',gap:16,marginTop:10,fontSize:12,color:'var(--ink-2)',flexWrap:'wrap'}}>
            <span>📞 {s.phone || '—'}</span>
            <span>📍 {s.addr_province || s.district || '—'}</span>
            <span>📅 enrolled {s.enrolled}</span>
            {s.inst && <span>👨‍🏫 {s.inst}</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn kind="ghost"   size="md" icon={<Icon name="phone" size={14}/>} onClick={() => onCall && onCall(s)}>ហៅ</Btn>
          <Btn kind="ghost"   size="md" icon={<Icon name="bell"  size={14}/>} onClick={() => onMessage && onMessage(s)}>សារ</Btn>
          <Btn kind="ghost"   size="md" icon={<Icon name="cal"   size={14}/>} onClick={() => onBook && onBook(s)}>កក់​មេរៀន</Btn>
          <Btn kind="ghost"   size="md" icon={<Icon name="book"  size={14}/>} onClick={() => printStudyRecord(s)}>📘 ប្រវត្តិសិក្សា</Btn>
          <Btn kind="primary" size="md" onClick={onEdit}>កែ​ · Edit</Btn>
        </div>
      </div>

      <div style={{padding:24,display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:24}}>
        {/* Left: biography + mock history + lesson log */}
        <div>
          <BiographyCard s={s} onSave={onSaveBio}/>

          <div style={{marginTop:28,font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:14}}>ការ​ប្រឡង​សាកល្បង​ · MOCK TEST HISTORY</div>
          {mockHistory.length > 0 ? (
            <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120,padding:12,background:'var(--surface-muted)',borderRadius:10}}>
              {mockHistory.map((v,i,arr)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:10,color:'var(--ink-3)',fontVariantNumeric:'tabular-nums'}}>{v}</div>
                  <div style={{width:'100%',height:`${(v/100)*80}px`,minHeight:4,background:i===arr.length-1?'var(--accent)':'var(--surface)',border:'1px solid '+(i===arr.length-1?'var(--accent)':'var(--border)'),borderRadius:'3px 3px 0 0'}}/>
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:20,fontSize:12,color:'var(--ink-3)',textAlign:'center',background:'var(--surface-muted)',borderRadius:10}}>
              មិន​ទាន់​មាន​ប្រវត្តិ​ · No mock history yet
            </div>
          )}
          <div style={{marginTop:6,fontSize:11,color:'var(--ink-3)',textAlign:'center'}}>
            ចុច "កែ · Edit" ដើម្បី​បន្ថែម​ពិន្ទុ​ · Click Edit to add scores
          </div>

          <div style={{marginTop:28,font:'500 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:14}}>មេរៀន​ថ្មីៗ · LESSON LOG</div>
          {(() => {
            const sLessons = LESSONS.filter(l=>l.studentId===s.id).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,8);
            if (sLessons.length === 0) return <div style={{padding:'12px 0',fontSize:12,color:'var(--ink-3)'}}>មិន​ទាន់​មាន​មេរៀន · No lessons yet</div>;
            return sLessons.map((l,i) => {
              const inst = INSTRUCTORS.find(ii=>ii.id===l.instId);
              return (
                <div key={i} style={{padding:'12px 0',borderTop:i?'1px dashed var(--border)':'none',display:'grid',gridTemplateColumns:'100px 1fr 120px',gap:12,alignItems:'flex-start',fontSize:12}}>
                  <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)'}}>{l.date}</div>
                  <div>
                    <div style={{fontWeight:500}}>{l.type || l.color}</div>
                    {l.note && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3,fontStyle:'italic'}}>"{l.note}"</div>}
                  </div>
                  <div style={{fontSize:11,color:'var(--ink-2)',textAlign:'right'}}>{inst?.en || l.inst || '—'}</div>
                </div>
              );
            });
          })()}
        </div>

        {/* Right: exam readiness + docs + payments */}
        <div>
          <Card label={tr('ការ​ត្រៀម​ប្រឡង','EXAM READINESS')}>
            <div style={{textAlign:'center'}}>
              <svg width="160" height="100" style={{margin:'0 auto',display:'block'}} viewBox="0 0 160 100">
                <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke="var(--surface-muted)" strokeWidth="14" strokeLinecap="round"/>
                <path d="M 20 90 A 60 60 0 0 1 140 90" fill="none" stroke={s.mock_avg>=85?'var(--good)':s.mock_avg>=70?'var(--accent)':'var(--warn)'} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(s.mock_avg/100)*188} 188`}/>
                <text x="80" y="78" textAnchor="middle" fontSize="32" fontWeight="700" fontFamily="Inter" letterSpacing="-1">{s.mock_avg}%</text>
              </svg>
              <div style={{fontSize:12,color:'var(--ink-2)',marginTop:4}}>
                {s.mock_avg>=85?'រួចរាល់​សម្រាប់​ប្រឡង':s.mock_avg>=70?'ស្ទើរ​រួចរាល់':'ត្រូវ​ការ​ហ្វឹកហ្វឺន​​បន្ថែម'}
              </div>
            </div>
            <Divider/>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:14}}>
              {[
                {l:'ម៉ោង​សិក្សា', v:`${s.hours} / ${s.target}`},
                {l:'មេរៀន',      v:`${s.lessons_count}`},
                {l:'Mock tests', v: mockHistory.length > 0 ? `${mockHistory.length} done` : 'None yet'},
              ].map(r => (
                <div key={r.l} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'var(--ink-3)'}}>{r.l}</span>
                  <span style={{fontWeight:500,fontVariantNumeric:'tabular-nums'}}>{r.v}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{marginTop:14}}>
            <Card label={tr('ឯកសារ','DOCUMENTS')}>
              {docs.map((d,i) => (
                <div key={d.k} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px dashed var(--border)':'none'}}>
                  <button onClick={() => onSaveDoc && onSaveDoc(s.id, d.k, d.ok ? 0 : 1)} style={{
                    width:22,height:22,borderRadius:5,border:'none',cursor:'pointer',
                    background:d.ok?'var(--good)':'var(--warn)',color:'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                  }}>
                    {d.ok ? <Icon name="check" size={11} stroke={3}/> : <span style={{fontSize:11,fontWeight:700}}>!</span>}
                  </button>
                  <div style={{flex:1,fontSize:12}}>{d.l}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{d.ok?'on file':'missing'}</div>
                </div>
              ))}
              <div style={{marginTop:6,fontSize:10,color:'var(--ink-3)'}}>ចុច​លើ​រង្វង់ ដើម្បី​ប្ដូរ​ · Click badge to toggle</div>
            </Card>
          </div>

          <div style={{marginTop:14}}>
            <PaymentCard s={s} onAddPayment={onAddPayment} onMarkPaid={onSavePaid}/>
          </div>

          <div style={{marginTop:14}}>
            <Card label={tr('ប្រវត្តិ​សិក្សា','STUDY HISTORY')}>
              {(() => {
                const rows = [
                  { label:'ថ្ងៃចូលរៀន',          date: s.study_start, result: null },
                  { label:'ថ្ងៃបញ្ចប់',            date: s.study_end,   result: null },
                  { label:'ថ្ងៃដាក់ពាក្យប្រឡង',   date: s.exam_apply,  result: null },
                  { label:'ថ្ងៃប្រឡង',             date: s.exam_date,   result: s.exam_result },
                  ...(s.exam_resits||[]).map((r,i) => ({
                    label: `ប្រឡងសង លើកទី${i+1}`,
                    date: r.date, result: r.result,
                  })),
                ];
                const hasAny = rows.some(r => r.date);
                if (!hasAny) return (
                  <div style={{fontSize:12,color:'var(--ink-3)',textAlign:'center',padding:'12px 0'}}>
                    មិន​ទាន់​មាន​ · No history yet
                  </div>
                );
                return (
                  <div style={{display:'flex',flexDirection:'column',gap:0}}>
                    {rows.map((r, i) => {
                      if (!r.date && r.result === null) return null;
                      const pass = r.result === 'pass';
                      const fail = r.result === 'fail';
                      return (
                        <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',
                          borderTop: i ? '1px dashed var(--border)' : 'none'}}>
                          <div style={{
                            width:10,height:10,borderRadius:'50%',marginTop:3,flexShrink:0,
                            background: fail?'var(--danger)':pass?'var(--good)':'var(--accent)',
                          }}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:11,color:'var(--ink-3)'}}>{r.label}</div>
                            <div style={{fontSize:12,fontWeight:500,fontFamily:'"JetBrains Mono",monospace',marginTop:1}}>
                              {r.date || '—'}
                            </div>
                          </div>
                          {r.result && (
                            <div style={{
                              fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,
                              background: pass?'var(--good)':fail?'var(--danger)':'var(--surface-muted)',
                              color: (pass||fail)?'#fff':'var(--ink)',
                            }}>
                              {pass?'ជាប់':fail?'ធ្លាក់':'—'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Edit panel helpers — defined at module level to avoid remount on every render ──
const SELbl = ({children}) => <div style={{fontSize:11,fontWeight:500,color:'var(--ink-2)',marginBottom:4}}>{children}</div>;
const SEField = ({label, children}) => <div style={{minWidth:0}}><SELbl>{label}</SELbl>{children}</div>;
const SEDocChk = ({label, checked, onChange}) => (
  <label style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',background:checked?'color-mix(in oklch,var(--good) 10%,var(--surface))':'var(--surface)',userSelect:'none'}}>
    <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${checked?'var(--good)':'var(--border)'}`,background:checked?'var(--good)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
      {checked && <Icon name="check" size={11} stroke={3} color="#fff"/>}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} style={{display:'none'}}/>
    <span style={{fontSize:12,fontWeight:checked?600:400}}>{label}</span>
  </label>
);

// ── Edit panel ───────────────────────────────────────────────────────────────
const StudentEditPanel = ({ s, onSave, onCancel, onDelete }) => {
  const { tr, toast } = useAppActions();
  const bp = useBreakpoint();

  const [name,    setName]    = React.useState(s.name    || '');
  const [en,      setEn]      = React.useState(s.en      || '');
  const [gender,  setGender]  = React.useState(s.gender  || 'M');
  const [age,     setAge]     = React.useState(String(s.age || ''));
  const [phone,   setPhone]   = React.useState(s.phone   || '');
  const [telegram,setTelegram]= React.useState(s.telegram|| '');
  const [email,   setEmail]   = React.useState(s.email   || '');
  const [licenseNo, setLicenseNo] = React.useState(s.license_no || '');
  const [natId,     setNatId]     = React.useState(s.natId || '');
  const [examLoc,   setExamLoc]   = React.useState(s.exam_location || '');

  const [nationality,   setNationality]   = React.useState(s.nationality   || 'ខ្មែរ');
  const [eyeLeft,       setEyeLeft]       = React.useState(s.eye_left      || '');
  const [eyeRight,      setEyeRight]      = React.useState(s.eye_right     || '');
  const [eyeBoth,       setEyeBoth]       = React.useState(s.eye_both      || '');
  const [glasses,       setGlasses]       = React.useState(normEye(s.glasses));
  // Single address box — start from the saved address, or compose it from any
  // legacy split address fields so existing data still shows.
  const [address, setAddress] = React.useState(
    s.address && s.address !== '—' ? s.address
    : [s.addr_house, s.addr_street, s.addr_village, s.addr_commune, s.addr_district || s.district, s.addr_province].filter(Boolean).join(', ')
  );
  const [studyGoal,     setStudyGoal]     = React.useState(s.study_goal    || '');
  const [referral,      setReferral]      = React.useState(s.referral      || '');
  const [studentType,   setStudentType]   = React.useState(s.studentType   || 'ធម្មតា');

  const [cls,     setCls]     = React.useState(clsLetter(s.cls));
  const [trans,   setTrans]   = React.useState(s.trans   || 'AT');
  const [instId,  setInstId]  = React.useState(s.instId  || '');
  const [status,  setStatus]  = React.useState(s.status  || 'New');
  const [enrolled,setEnrolled]= React.useState(s.enrolled==='—'?'':s.enrolled||'');
  const [target,  setTarget]  = React.useState(String(s.target || 40));
  const [hours,   setHours]   = React.useState(String(s.hours  || 0));
  const [paid,    setPaid]    = React.useState(String(Math.round((s.paid||0)*studentPrice(s))));
  const [next,    setNext]    = React.useState(s.next || '');

  const [theory,  setTheory]  = React.useState(String(s.theory  || 0));
  const [yard,    setYard]    = React.useState(String(s.yard    || 0));
  const [parking, setParking] = React.useState(String(s.parking || 0));
  const [city,    setCity]    = React.useState(String(s.city    || 0));
  const [highway, setHighway] = React.useState(String(s.highway || 0));
  const [mockAvg, setMockAvg] = React.useState(String(s.mock_avg|| 0));
  const [mockHistory, setMockHistory] = React.useState(s.mock_history || (s.mock_avg > 0 ? [s.mock_avg] : []));
  const [mockNew, setMockNew] = React.useState('');

  const [permit,  setPermit]  = React.useState(!!s.permit);
  const [idDoc,   setIdDoc]   = React.useState(!!s.id_doc);
  const [medical, setMedical] = React.useState(!!s.medical);
  const [photoId, setPhotoId] = React.useState(!!s.photo_id);

  // Study history
  const [studyStart, setStudyStart] = React.useState(s.study_start || '');
  const [studyEnd,   setStudyEnd]   = React.useState(s.study_end   || '');
  const [examApply,  setExamApply]  = React.useState(s.exam_apply  || '');
  const [examDate,   setExamDate]   = React.useState(s.exam_date   || '');
  const [examResult, setExamResult] = React.useState(s.exam_result || '');

  const [confirmDel, setConfirmDel] = React.useState(false);

  const addMockScore = () => {
    const v = parseInt(mockNew);
    if (isNaN(v) || v < 0 || v > 100) { toast(tr('ពិន្ទុត្រូវ 0–100','Score must be 0–100'), 'warn'); return; }
    const hist = [...mockHistory, v];
    setMockHistory(hist);
    setMockAvg(String(Math.round(hist.reduce((a,b)=>a+b,0)/hist.length)));
    setMockNew('');
  };

  const removeMockScore = (idx) => {
    const hist = mockHistory.filter((_,i) => i !== idx);
    setMockHistory(hist);
    if (hist.length > 0) setMockAvg(String(Math.round(hist.reduce((a,b)=>a+b,0)/hist.length)));
    else setMockAvg('0');
  };

  const save = () => {
    if (!name.trim()) { toast(tr('ត្រូវការ​ឈ្មោះ','Name required'), 'warn'); return; }
    const instObj = INSTRUCTORS.find(i => i.id === instId);
    onSave({
      ...s,
      name:     name.trim(),
      en:       en.trim() || s.en,
      gender,
      age:      parseInt(age) || s.age || 24,
      phone:    phone.trim(),
      telegram: telegram.trim(),
      email:    email.trim(),
      license_no:    licenseNo.trim(),
      natId:         natId.trim(),
      exam_location: examLoc.trim(),
      nationality:   nationality.trim(),
      eye_left:      eyeLeft,
      eye_right:     eyeRight,
      eye_both:      eyeBoth,
      glasses:       glasses,
      address:       address.trim(),
      study_goal:    studyGoal,
      referral:      referral,
      studentType,
      cls,
      trans,
      instId:   instId || s.instId || '',
      inst:     instObj ? instObj.en : (s.inst || ''),
      status,
      enrolled: enrolled || s.enrolled || '—',
      target:   parseInt(target) || 40,
      hours:    parseFloat(hours) || 0,
      paid:     Math.min(1, (parseFloat(paid) || 0) / studentPrice({trans})),
      next:     next.trim() || '—',
      theory:   Math.min(100, parseInt(theory) || 0),
      yard:     Math.min(100, parseInt(yard)   || 0),
      parking:  Math.min(100, parseInt(parking)|| 0),
      city:     Math.min(100, parseInt(city)   || 0),
      highway:  Math.min(100, parseInt(highway)|| 0),
      mock_avg: Math.min(100, parseInt(mockAvg)|| 0),
      mock_history: mockHistory,
      permit:   permit  ? 1 : 0,
      id_doc:   idDoc   ? 1 : 0,
      medical:  medical ? 1 : 0,
      photo_id: photoId ? 1 : 0,
      study_start: studyStart,
      study_end:   studyEnd,
      exam_apply:  examApply,
      exam_date:   examDate,
      exam_result: examResult,
      exam_resits: s.exam_resits || [],
    });
  };

  const inp = {style:{width:'100%',minWidth:0,padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}};
  const sel = {style:{width:'100%',minWidth:0,padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}};
  // On mobile, one field per row (g2) — guarantees date boxes never touch.
  const g2 = {style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:bp.mobile?'12px 14px':10,marginBottom:12}};
  const g3 = {style:{display:'grid',gridTemplateColumns:bp.mobile?'1fr 1fr':'1fr 1fr 1fr',gap:bp.mobile?'12px 14px':10,marginBottom:12}};
  const secTitle = (t) => (
    <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',margin:'18px 0 10px'}}>{t}</div>
  );

  return (
    <div style={{padding:bp.mobile?14:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <div style={{fontSize:15,fontWeight:600}}>
          {tr('កែ​', 'Edit')} — {s.name} <span style={{fontSize:12,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{s.id}</span>
        </div>
        {confirmDel ? (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:12,color:'var(--danger)'}}>ប្រាកដ​ចង់​លុប​ទេ? Sure?</span>
            <Btn kind="danger" size="sm" onClick={() => onDelete(s.id)}>{tr('លុប','Delete')}</Btn>
            <Btn kind="ghost" size="sm" onClick={() => setConfirmDel(false)}>{tr('ទេ','No')}</Btn>
          </div>
        ) : (
          <Btn kind="ghost" size="sm" style={{color:'var(--danger)'}} onClick={() => setConfirmDel(true)}>
            {tr('លុបសិស្ស','Delete student')}
          </Btn>
        )}
      </div>

      {secTitle(tr('ព័ត៌មាន​','PERSONAL INFO'))}
      <div {...g2}>
        <SEField label="ឈ្មោះ​ខ្មែរ"><input {...inp} value={name} onChange={e=>setName(e.target.value)} placeholder="ស្រ៊ន ណារី"/></SEField>
        <SEField label="ឈ្មោះ​អង្គ​លេស"><input {...inp} value={en} onChange={e=>setEn(e.target.value)} placeholder="Sron Nary"/></SEField>
        <SEField label={tr('ភេទ','Gender')}>
          <select {...sel} value={gender} onChange={e=>setGender(e.target.value)}>
            <option value="M">{tr('♂ ប្រុស','♂ Male')}</option>
            <option value="F">{tr('♀ ស្រី','♀ Female')}</option>
          </select>
        </SEField>
        <SEField label={tr('អាយុ','Age')}><input {...inp} type="number" value={age} onChange={e=>setAge(e.target.value)} min="16" max="80" placeholder="24"/></SEField>
        <SEField label={tr('ទូរស័ព្ទ','Phone')}><input {...inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+855 12 000 000"/></SEField>
        <SEField label="Telegram Chat ID"><input {...inp} value={telegram} onChange={e=>setTelegram(e.target.value)} placeholder="123456789"/></SEField>
        <SEField label={tr('អ៊ីមែល','Email')}><input {...inp} value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@email.com"/></SEField>
        <SEField label={tr('ប្រភេទសិស្ស','Student Type')}>
          <select {...sel} value={studentType} onChange={e=>setStudentType(e.target.value)}>
            <option value="ធម្មតា">{tr('ធម្មតា','Regular')}</option>
            <option value="ពិសេស">{tr('ពិសេស','Special')}</option>
            <option value="SSW">SSW</option>
          </select>
        </SEField>
        <SEField label={tr('លេខ​បណ្ណ​បើកបរ','Driver license No.')}><input {...inp} value={licenseNo} onChange={e=>setLicenseNo(e.target.value)} placeholder={tr('ឧ. 01234567','e.g. 01234567')}/></SEField>
        <SEField label={tr('លេខ​អត្តសញ្ញាណប័ណ្ណ','National ID No.')}><input {...inp} value={natId} onChange={e=>setNatId(e.target.value)} placeholder={tr('ឧ. 010203045','e.g. 010203045')}/></SEField>
        <SEField label={tr('ទីតាំង​ប្រឡង','Exam location')}><input {...inp} value={examLoc} onChange={e=>setExamLoc(e.target.value)} placeholder={tr('ឧ. ភ្នំពេញ','e.g. Phnom Penh')}/></SEField>
      </div>

      {secTitle(tr('ប្រវត្តិ','BIOGRAPHY'))}
      <div {...g3}>
        <SEField label={tr('ភ្នែកឆ្វេង','Left Eye')}>
          <select {...sel} value={eyeLeft} onChange={e=>setEyeLeft(e.target.value)}>
            {EYE_OPTS.map(v=><option key={v||'none'} value={v}>{v||'—'}</option>)}
          </select>
        </SEField>
        <SEField label={tr('ភ្នែកស្ដាំ','Right Eye')}>
          <select {...sel} value={eyeRight} onChange={e=>setEyeRight(e.target.value)}>
            {EYE_OPTS.map(v=><option key={v||'none'} value={v}>{v||'—'}</option>)}
          </select>
        </SEField>
        <SEField label={tr('ភ្នែកទាំងពីរ','Both Eyes')}>
          <select {...sel} value={eyeBoth} onChange={e=>setEyeBoth(e.target.value)}>
            {EYE_OPTS.map(v=><option key={v||'none'} value={v}>{v||'—'}</option>)}
          </select>
        </SEField>
      </div>
      <div {...g2}>
        <SEField label={tr('ជនជាតិ','Nationality')}><input {...inp} value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="ខ្មែរ"/></SEField>
        <SEField label={tr('ស្ថានភាពភ្នែក','Eye condition')}>
          <select {...sel} value={normEye(glasses)} onChange={e=>setGlasses(e.target.value)}>
            {EYE_COND_OPTS.map(o=> <option key={o.v} value={o.v}>{tr(o.v, o.en)}</option>)}
          </select>
        </SEField>
        <SEField label={tr('ស្គាល់​សាលា​តាម','Referral')}>
          <select {...sel} value={referral} onChange={e=>setReferral(e.target.value)}>
            <option value="">— {tr('មិន​ទាន់​បញ្ជាក់','Not specified')} —</option>
            <option value="នៅជិតសាលា">{tr('នៅជិតសាលា','Near school')}</option>
            <option value="មិត្តភក្ដិ">{tr('មិត្តភក្ដិ','Friend')}</option>
            <option value="គ្រួសារ">{tr('គ្រួសារ','Family')}</option>
            <option value="ការផ្សព្វផ្សាយ">{tr('ការផ្សព្វផ្សាយ','Advertisement')}</option>
            <option value="ផ្សេងៗ">{tr('ផ្សេងៗ','Other')}</option>
          </select>
        </SEField>
      </div>

      {secTitle(tr('អាសយដ្ឋាន','ADDRESS'))}
      <div style={{marginBottom:12}}>
        <SEField label={tr('អាសយដ្ឋាន​ពេញ','Full address')}>
          <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2}
            placeholder={tr('ឧ. ផ្ទះ:១៥ ផ្លូវ៣១០ ភូមិ... ឃុំ/សង្កាត់... ស្រុក/ខណ្ឌ... ខេត្ត/រាជធានី...','e.g. House:15, St.310, Village..., Commune..., District..., Province...')}
            style={{...inp.style, minHeight:54, resize:'vertical', fontFamily:'inherit'}}/>
        </SEField>
      </div>

      {secTitle(tr('ការ​ចុះ​ឈ្មោះ','ENROLLMENT'))}
      <div {...g2}>
        <SEField label={tr('ថ្នាក់','Class')}>
          <select {...sel} value={cls} onChange={e=>setCls(e.target.value)}>
            <option value="A">ក</option>
            <option value="B">ខ</option>
            <option value="C">គ</option>
            <option value="D">ឃ</option>
            <option value="E">ង</option>
          </select>
        </SEField>
        <SEField label={tr('លេខ​','Transmission')}>
          <select {...sel} value={trans} onChange={e=>setTrans(e.target.value)}>
            <option value="AT">{tr('AT · លេខ​អូតូ (10 ម៉ោង)','AT · Auto (10 h)')}</option>
            <option value="MT">{tr('MT · លេខ​ដៃ (13 ម៉ោង)','MT · Manual (13 h)')}</option>
          </select>
        </SEField>
        <SEField label={tr('ស្ថានភាព','Status')}>
          <select {...sel} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="New">New</option>
            <option value="In progress">In progress</option>
            <option value="Road exam soon">Road exam soon</option>
            <option value="Cleared">Cleared</option>
          </select>
        </SEField>
        <SEField label={tr('គ្រូ​','Instructor')}>
          <select {...sel} value={instId} onChange={e=>setInstId(e.target.value)}>
            <option value="">{tr('— មិន​ទាន់​','— Not assigned')} —</option>
            {INSTRUCTORS.map(i => (
              <option key={i.id} value={i.id}>{i.en || i.name} ({i.cls || i.classes || 'B'})</option>
            ))}
          </select>
        </SEField>
        <SEField label={tr('ថ្ងៃ​ចុះ​ឈ្មោះ','Enrolled')}><input {...inp} type="date" value={enrolled} onChange={e=>setEnrolled(e.target.value)}/></SEField>
        <SEField label={tr('ម៉ោងគោល','Target hours')}><input {...inp} type="number" value={target} onChange={e=>setTarget(e.target.value)} min="1" placeholder="40"/></SEField>
        <SEField label={tr('ទូទាត់​','Paid')+` ($) / $${studentPrice({trans})}`}><input {...inp} type="number" value={paid} onChange={e=>setPaid(e.target.value)} min="0" max={studentPrice({trans})} placeholder="0"/></SEField>
      </div>

      {secTitle(tr('ប្រវត្តិសិក្សា','STUDY HISTORY'))}
      <div {...g2}>
        <SEField label={tr('ចាប់ផ្ដើមសិក្សា','Study start')}><input {...inp} type="date" value={studyStart} onChange={e=>setStudyStart(e.target.value)}/></SEField>
        <SEField label={tr('បញ្ចប់សិក្សា','Study end')}><input {...inp} type="date" value={studyEnd} onChange={e=>setStudyEnd(e.target.value)}/></SEField>
        <SEField label={tr('ស្នើរ​ប្រឡង','Exam apply')}><input {...inp} type="date" value={examApply} onChange={e=>setExamApply(e.target.value)}/></SEField>
        <SEField label={tr('ថ្ងៃ​ប្រឡង','Exam date')}><input {...inp} type="date" value={examDate} onChange={e=>setExamDate(e.target.value)}/></SEField>
        <SEField label={tr('លទ្ធផល​ប្រឡង','Exam result')}>
          <select {...sel} value={examResult} onChange={e=>setExamResult(e.target.value)}>
            <option value="">— {tr('មិន​ទាន់','Pending')} —</option>
            <option value="pass">{tr('ជាប់','Pass')}</option>
            <option value="fail">{tr('ធ្លាក់','Fail')}</option>
          </select>
        </SEField>
      </div>

      {secTitle(tr('ឯកសារ','DOCUMENTS'))}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        <SEDocChk label={tr('អនុញ្ញាត​សិក្សា','Learner permit')}  checked={permit}  onChange={e=>setPermit(e.target.checked)}/>
        <SEDocChk label={tr('អត្តសញ្ញាណប័ណ្ណ','ID card')}          checked={idDoc}   onChange={e=>setIdDoc(e.target.checked)}/>
        <SEDocChk label={tr('វិញ្ញាបនបត្រ','Medical cert.')}        checked={medical} onChange={e=>setMedical(e.target.checked)}/>
        <SEDocChk label={tr('រូប​ថត','Photo 4×6')}                  checked={photoId} onChange={e=>setPhotoId(e.target.checked)}/>
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:14,borderTop:'1px solid var(--border)'}}>
        <Btn kind="ghost" size="md" onClick={onCancel}>{tr('បោះ​បង់','Cancel')}</Btn>
        <Btn kind="primary" size="md" onClick={save}>{tr('រក្សា​ទុក','Save changes')}</Btn>
      </div>
    </div>
  );
};

// ── Enrollment pipeline ──────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  {id:'New',               km:'ថ្មី',                  en:'New',       tone:'accent'},
  {id:'Documents OK',      km:'ឯកសារ​គ្រប់',           en:'Docs OK',   tone:'neutral'},
  {id:'Awaiting payment',  km:'រង់ចាំ​ការ​ទូទាត់',     en:'Payment',   tone:'warn'},
  {id:'Scheduled intake',  km:'កំណត់​ការ​ចូល​រៀន',     en:'Scheduled', tone:'good'},
];

const StudentEnrollmentDetail = ({ s, onEdit, onAddPayment, onSavePaid }) => {
  const { tr } = useAppActions();
  if (!s) return (
    <div style={{padding:'60px 24px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      {tr('ជ្រើសសិស្ស​','Select a student from the directory')}
    </div>
  );

  const price = studentPrice(s);
  const instObj = (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).find(i => i.en === s.inst || i.id === s.instId);

  const ERow = ({k, v}) => (
    <div style={{display:'flex',justifyContent:'space-between',gap:12,padding:'7px 0',borderBottom:'1px dashed var(--border)',fontSize:12}}>
      <span style={{color:'var(--ink-3)'}}>{k}</span>
      <span style={{fontWeight:500,textAlign:'right'}}>{v || '—'}</span>
    </div>
  );

  return (
    <div style={{padding:18}}>
      {/* Student header */}
      <div style={{display:'flex',alignItems:'center',gap:14,paddingBottom:16,borderBottom:'1px solid var(--border)',marginBottom:18}}>
        <Avatar tag={s.photo} size={52}/>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:600,fontFamily:'var(--font-display)'}}>{s.name}</div>
          <div style={{fontSize:12,color:'var(--ink-3)',marginTop:3}}>{s.id} · {s.en} · {s.cls} · {s.trans}</div>
          <div style={{marginTop:6,display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
            <Badge tone={studentStatusTone(s.status)}>{s.status}</Badge>
            {s.inst && <Badge tone="neutral">👨‍🏫 {s.inst}</Badge>}
            {(s.paid||0) >= 1 && <Badge tone="good">✓ Paid</Badge>}
          </div>
        </div>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ​','Edit')}</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Left: Enrollment + exam info */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card label={tr('ព័ត៌មាន​ចុះ​ឈ្មោះ','ENROLLMENT')}>
            <ERow k={tr('ចុះ​ឈ្មោះ​','Enrolled')} v={s.enrolled}/>
            <ERow k={tr('ប្រភេទ','Class')}
              v={`${s.cls} · ${s.trans==='MT'?tr('លេខ​ដៃ','Manual'):tr('លេខ​អូតូ','Auto')}`}/>
            <ERow k={tr('គ្រូ​បង្រៀន','Instructor')}
              v={s.inst||(instObj?.name)||'—'}/>
            <ERow k={tr('ចាប់​ផ្ដើម','Study start')} v={s.study_start}/>
            <ERow k={tr('បញ្ចប់','Study end')} v={s.study_end}/>
            <ERow k={tr('ថ្លៃ​សិក្សា','Tuition')} v={`$${price}`}/>
          </Card>

          {(s.exam_apply||s.exam_date||s.exam_result) && (
            <Card label={tr('ការ​ប្រឡង','EXAM')}>
              <ERow k={tr('ដាក់​ពាក្យ','Apply date')} v={s.exam_apply}/>
              <ERow k={tr('ថ្ងៃ​ប្រឡង','Exam date')} v={s.exam_date}/>
              <ERow k={tr('លទ្ធផល','Result')}
                v={s.exam_result==='pass'?'✅ ជាប់':s.exam_result==='fail'?'❌ ធ្លាក់':s.exam_result}/>
              {(s.exam_resits||[]).filter(r=>r.date).map((r,i) => (
                <ERow key={i} k={`ប្រឡង​ម្ដង​ទៀត ${i+1}`}
                  v={`${r.date} · ${r.result==='pass'?'✅':r.result==='fail'?'❌':r.result||'—'}`}/>
              ))}
            </Card>
          )}
        </div>

        {/* Right: Payment card (reuse existing) */}
        <PaymentCard s={s} onAddPayment={onAddPayment} onMarkPaid={onSavePaid}/>
      </div>
    </div>
  );
};

const EnrollmentPipeline = ({ openForm }) => {
  const { toast, tr } = useAppActions();
  const [apps, setApps] = React.useState(APPLICATIONS_LIST);

  const advance = (appId) => {
    setApps(prev => {
      const idx = PIPELINE_STAGES.findIndex(st => st.id === prev.find(a => a.id===appId)?.status);
      if (idx === PIPELINE_STAGES.length - 1) {
        const a = prev.find(x => x.id===appId);
        toast(`${a.name} ត្រូវ​បាន​ scheduled`, 'good');
        return prev;
      }
      return prev.map(a => a.id!==appId ? a : {...a, status: PIPELINE_STAGES[idx+1].id});
    });
  };

  const removeApp = (appId) => setApps(prev => prev.filter(a => a.id!==appId));

  return (
    <div style={{padding:18}}>
      <div style={{display:'flex',alignItems:'baseline',marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:600}}>{tr('ដំណើរការ​ចូលរៀន','Enrollment pipeline')}</div>
        <div style={{flex:1}}/>
        <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>} onClick={() => openForm('newStudent')}>
          {tr('ចុះ​ឈ្មោះ​','Enroll')}
        </Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {PIPELINE_STAGES.map(st => {
          const stApps = apps.filter(a => a.status === st.id);
          const isLast = st.id === 'Scheduled intake';
          return (
            <div key={st.id} style={{background:'var(--surface-muted)',borderRadius:10,padding:10,minHeight:340}}>
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 6px 10px'}}>
                <Badge tone={st.tone}>{tr(st.km, st.en)}</Badge>
                <div style={{fontSize:11,color:'var(--ink-3)',marginLeft:'auto',fontFamily:'"JetBrains Mono",monospace'}}>{stApps.length}</div>
              </div>
              {stApps.map(a => (
                <div key={a.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Avatar tag={a.photo} size={26}/>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.name}</div>
                      <div style={{fontSize:10,color:'var(--ink-3)'}}>{a.en} · {a.age}y</div>
                    </div>
                  </div>
                  <div style={{marginTop:8,display:'flex',gap:4,flexWrap:'wrap'}}>
                    <Badge tone="neutral">Class {a.cls}</Badge>
                    {a.source && <Badge tone="neutral">{a.source}</Badge>}
                  </div>
                  <div style={{marginTop:8,paddingTop:8,borderTop:'1px dashed var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10}}>
                    <span style={{color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{a.id} · {a.applied}</span>
                    {isLast ? (
                      <Btn kind="primary" size="sm" onClick={() => { openForm('newStudent'); removeApp(a.id); }}>
                        ចុះ​ឈ្មោះ →
                      </Btn>
                    ) : (
                      <Btn kind="ghost" size="sm" onClick={() => advance(a.id)}>
                        បន្ទាប់ →
                      </Btn>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => openForm('newStudent')} style={{
                width:'100%',padding:'8px',
                border:'1.5px dashed var(--border-strong)',background:'transparent',
                borderRadius:8,color:'var(--ink-3)',fontSize:11,fontWeight:500,cursor:'pointer',
              }}>+ បន្ថែម</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Progress helpers — module level ──────────────────────────────────────────
const kNum = n => String(n).replace(/[0-9]/g, d => '០១២៣៤៥៦៧៨៩'[+d]);

const HourDot = ({ done, label, onClick }) => (
  <div onClick={onClick} title={label} style={{
    width:30, height:30, borderRadius:'50%', cursor:'pointer',
    border:`2px solid ${done ? 'var(--good)' : 'var(--border)'}`,
    background: done ? 'var(--good)' : 'var(--surface-muted)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:9, fontWeight:700, color: done ? '#fff' : 'var(--ink-3)',
    flexShrink:0, transition:'all .12s', userSelect:'none',
  }}>{label}</div>
);

const SProgressCard = ({ s, onSave }) => {
  const { tr } = useAppActions();
  const pracCount = s.trans === 'MT' ? 13 : 10;
  const norm = (arr, len) => Array.from({length: len}, (_, i) => arr[i] ?? false);

  const [thDone,     setThDone]     = React.useState(() => norm(s.theory_done   || [], 3));
  const [prDone,     setPrDone]     = React.useState(() => norm(s.practice_done || [], pracCount));
  const [exDone,     setExDone]     = React.useState(() => s.extra_done || []);
  const [studyStart, setStudyStart] = React.useState(s.study_start || '');
  const [studyEnd,   setStudyEnd]   = React.useState(s.study_end   || '');
  const [examApply,  setExamApply]  = React.useState(s.exam_apply  || '');
  const [examDate,   setExamDate]   = React.useState(s.exam_date   || '');
  const [examResult, setExamResult] = React.useState(s.exam_result || '');
  const [resits,     setResits]     = React.useState(
    s.exam_resits && s.exam_resits.length > 0 ? s.exam_resits : [{date:'',result:''}]
  );

  const toggle = (arr, setArr, i, field) => {
    const next = [...arr];
    next[i] = !next[i];
    setArr(next);
    onSave(s.id, { [field]: next });
  };

  const addExtra = () => {
    const next = [...exDone, false];
    setExDone(next);
    onSave(s.id, { extra_done: next });
  };

  const saveHistory = (patch) => onSave(s.id, patch);

  const dInp = { type:'date', style:{
    width:'100%', padding:'5px 8px', border:'1px solid var(--border)',
    borderRadius:5, fontSize:11, fontFamily:'inherit',
    background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box',
  }};
  const rSel = { style:{
    padding:'5px 8px', border:'1px solid var(--border)',
    borderRadius:5, fontSize:11, fontFamily:'inherit',
    background:'var(--surface)', color:'var(--ink)', width:95,
  }};

  const secHd = (label, done, total) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
      <span style={{fontSize:11,fontWeight:600,color:'var(--ink-2)'}}>{label}</span>
      <span style={{fontSize:10,color:done===total?'var(--good)':'var(--ink-3)',fontWeight:done===total?700:400}}>
        {done}/{total}
      </span>
    </div>
  );
  const miniLbl = (t) => <div style={{fontSize:9,color:'var(--ink-3)',marginBottom:3}}>{t}</div>;

  return (
    <Card>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingBottom:10,borderBottom:'1px dashed var(--border)'}}>
        <Avatar tag={s.photo} size={36}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
          <div style={{fontSize:10,color:'var(--ink-3)'}}>{s.en} · {s.id}</div>
        </div>
        <div style={{
          fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,
          background: s.trans==='MT'?'#B0413E':'#1A4FA8', color:'#fff',
        }}>{s.trans||'AT'}</div>
      </div>

      {/* Body: hours left | dates right */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

        {/* Left — hours */}
        <div>
          <div style={{marginBottom:12}}>
            {secHd(tr('ទ្រឹស្ដី','Theory'), thDone.filter(Boolean).length, 3)}
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {thDone.map((done,i) => (
                <HourDot key={i} done={done} label={`ម${kNum(i+1)}`}
                  onClick={() => toggle(thDone, setThDone, i, 'theory_done')}/>
              ))}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            {secHd(`អនុវត្តន៍ (${pracCount}h)`, prDone.filter(Boolean).length, pracCount)}
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {prDone.map((done,i) => (
                <HourDot key={i} done={done} label={`ម${kNum(i+1)}`}
                  onClick={() => toggle(prDone, setPrDone, i, 'practice_done')}/>
              ))}
            </div>
          </div>
          {exDone.length > 0 && (
            <div style={{marginBottom:10}}>
              {secHd(tr('ថែម','Extra'), exDone.filter(Boolean).length, exDone.length)}
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {exDone.map((done,i) => (
                  <HourDot key={i} done={done} label={`+${kNum(i+1)}`}
                    onClick={() => toggle(exDone, setExDone, i, 'extra_done')}/>
                ))}
              </div>
            </div>
          )}
          <Btn kind="ghost" size="sm" onClick={addExtra}>+ បន្ថែម​ម៉ោង</Btn>
        </div>

        {/* Right — exam history dates */}
        <div style={{borderLeft:'1px dashed var(--border)',paddingLeft:16}}>
          <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:10}}>
            ប្រវត្តិ​ប្រឡង
          </div>
          <div style={{marginBottom:7}}>
            {miniLbl('ថ្ងៃចូលរៀន')}
            <input {...dInp} value={studyStart} onChange={e=>setStudyStart(e.target.value)}
              onBlur={()=>saveHistory({study_start:studyStart})}/>
          </div>
          <div style={{marginBottom:7}}>
            {miniLbl('ថ្ងៃបញ្ចប់')}
            <input {...dInp} value={studyEnd} onChange={e=>setStudyEnd(e.target.value)}
              onBlur={()=>saveHistory({study_end:studyEnd})}/>
          </div>
          <div style={{marginBottom:7}}>
            {miniLbl('ថ្ងៃដាក់ពាក្យប្រឡង')}
            <input {...dInp} value={examApply} onChange={e=>setExamApply(e.target.value)}
              onBlur={()=>saveHistory({exam_apply:examApply})}/>
          </div>
          <div style={{marginBottom:7}}>
            {miniLbl('ថ្ងៃប្រឡង')}
            <div style={{display:'flex',gap:5}}>
              <input {...dInp} style={{...dInp.style,flex:1,minWidth:0}} value={examDate}
                onChange={e=>setExamDate(e.target.value)}
                onBlur={()=>saveHistory({exam_date:examDate})}/>
              <select {...rSel} value={examResult} onChange={e=>{ setExamResult(e.target.value); saveHistory({exam_result:e.target.value}); }}>
                <option value="">—</option>
                <option value="pass">ជាប់ ✓</option>
                <option value="fail">ធ្លាក់ ✗</option>
              </select>
            </div>
          </div>
          {resits.map((r, i) => (
            <div key={i} style={{marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                {miniLbl(`ប្រឡងសង លើកទី${i+1}`)}
                <button onClick={()=>{ const next=resits.filter((_,j)=>j!==i); setResits(next); saveHistory({exam_resits:next}); }}
                  style={{border:'none',background:'none',color:'var(--danger)',cursor:'pointer',fontSize:13,lineHeight:1,padding:0}}>×</button>
              </div>
              <div style={{display:'flex',gap:5}}>
                <input {...dInp} style={{...dInp.style,flex:1,minWidth:0}} value={r.date}
                  onChange={e=>setResits(resits.map((x,j)=>j===i?{...x,date:e.target.value}:x))}
                  onBlur={()=>saveHistory({exam_resits:resits})}/>
                <select {...rSel} value={r.result} onChange={e=>{ const next=resits.map((x,j)=>j===i?{...x,result:e.target.value}:x); setResits(next); saveHistory({exam_resits:next}); }}>
                  <option value="">—</option>
                  <option value="pass">ជាប់ ✓</option>
                  <option value="fail">ធ្លាក់ ✗</option>
                </select>
              </div>
            </div>
          ))}
          <Btn kind="ghost" size="sm" onClick={()=>setResits([...resits,{date:'',result:''}])}>
            + ប្រឡងសង
          </Btn>
        </div>

      </div>
    </Card>
  );
};

// ── JP Hour Tracker card ──────────────────────────────────────────────────────
const SProgressCardJP = ({ s, onSave }) => {
  const { tr } = useAppActions();
  const [thJP, setThJP] = React.useState(() => s.theory_jp_done   || []);
  const [prJP, setPrJP] = React.useState(() => s.practice_jp_done || []);

  // Sync when student switches
  React.useEffect(() => {
    setThJP(s.theory_jp_done   || []);
    setPrJP(s.practice_jp_done || []);
  }, [s.id]);

  const toggle = (arr, setArr, i, field) => {
    const next = [...arr]; next[i] = !next[i];
    setArr(next); onSave(s.id, { [field]: next });
  };
  const addDot = (arr, setArr, field) => {
    const next = [...arr, false];
    setArr(next); onSave(s.id, { [field]: next });
  };
  const removeLast = (arr, setArr, field) => {
    if (!arr.length) return;
    const next = arr.slice(0, -1);
    setArr(next); onSave(s.id, { [field]: next });
  };

  const secHd = (label, done, total) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
      <span style={{fontSize:11,fontWeight:600,color:'var(--ink-2)'}}>{label}</span>
      {total > 0 && (
        <span style={{fontSize:10,fontWeight: done===total ? 700 : 400,
          color: done===total ? 'var(--good)' : 'var(--ink-3)'}}>
          {done}/{total}
        </span>
      )}
    </div>
  );

  return (
    <Card>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,paddingBottom:10,borderBottom:'1px dashed var(--border)'}}>
        <Avatar tag={s.photo} size={36}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
          <div style={{fontSize:10,color:'var(--ink-3)'}}>{s.en} · {s.id}</div>
        </div>
        <div style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,
          background:'#B0413E',color:'#fff',letterSpacing:'.06em'}}>JP</div>
      </div>

      {/* Theory JP */}
      <div style={{marginBottom:14}}>
        {secHd(tr('ទ្រឹស្ដី JP','Theory JP'), thJP.filter(Boolean).length, thJP.length)}
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:6,minHeight:32}}>
          {thJP.map((done,i) => (
            <HourDot key={i} done={done} label={`ម${kNum(i+1)}`}
              onClick={() => toggle(thJP, setThJP, i, 'theory_jp_done')}/>
          ))}
          {thJP.length === 0 && (
            <span style={{fontSize:11,color:'var(--ink-3)',alignSelf:'center'}}>— មិន​ទាន់​មាន —</span>
          )}
        </div>
        <div style={{display:'flex',gap:6}}>
          <Btn kind="ghost" size="sm" onClick={() => addDot(thJP, setThJP, 'theory_jp_done')}>+ ​​ម៉ោង</Btn>
          {thJP.length > 0 && (
            <Btn kind="ghost" size="sm" onClick={() => removeLast(thJP, setThJP, 'theory_jp_done')}>−</Btn>
          )}
        </div>
      </div>

      {/* Practice JP */}
      <div>
        {secHd(tr('អនុវត្តន៍ JP','Practice JP'), prJP.filter(Boolean).length, prJP.length)}
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:6,minHeight:32}}>
          {prJP.map((done,i) => (
            <HourDot key={i} done={done} label={`ម${kNum(i+1)}`}
              onClick={() => toggle(prJP, setPrJP, i, 'practice_jp_done')}/>
          ))}
          {prJP.length === 0 && (
            <span style={{fontSize:11,color:'var(--ink-3)',alignSelf:'center'}}>— មិន​ទាន់​មាន —</span>
          )}
        </div>
        <div style={{display:'flex',gap:6}}>
          <Btn kind="ghost" size="sm" onClick={() => addDot(prJP, setPrJP, 'practice_jp_done')}>+ ​​ម៉ោង</Btn>
          {prJP.length > 0 && (
            <Btn kind="ghost" size="sm" onClick={() => removeLast(prJP, setPrJP, 'practice_jp_done')}>−</Btn>
          )}
        </div>
      </div>
    </Card>
  );
};

// ── Progress ─────────────────────────────────────────────────────────────────
// ── Per-lesson checklist + instructor comments (Japanese curriculum) ─────────
const SLessonChecklist = ({ s, onSave }) => {
  const { tr } = useAppActions();
  const lib       = window.__lessonsLib || {};
  const theory    = lib.theoryTexts    || [];
  const practical = lib.practicalTexts || [];
  const [sec, setSec]   = React.useState('theory');
  const [prog, setProg] = React.useState(() => ({ ...(s.lessonProgress || {}) }));

  React.useEffect(() => { setProg({ ...(s.lessonProgress || {}) }); }, [s.id]);

  const persist = (next) => { onSave && onSave(s.id, { lessonProgress: next }); };
  const toggleDone = (id) => {
    const cur = prog[id] || {};
    const next = { ...prog, [id]: { ...cur, done: !cur.done, doneAt: !cur.done ? todayStrLocal() : cur.doneAt } };
    setProg(next); persist(next);
  };
  const setComment = (id, comment) => setProg(p => ({ ...p, [id]: { ...(p[id]||{}), comment } }));
  const commitComment = () => persist(prog);

  const list = sec === 'theory' ? theory : practical;
  const stage1 = list.filter(u => u.stage === 1);
  const stage2 = list.filter(u => u.stage === 2);
  const doneCount = list.filter(u => prog[u.id]?.done).length;

  const row = (u) => {
    const p = prog[u.id] || {};
    return (
      <div key={u.id} style={{display:'flex',gap:10,padding:'9px 10px',borderTop:'1px solid var(--border)',alignItems:'flex-start',background:p.done?'rgba(27,58,107,.04)':'transparent'}}>
        <button onClick={()=>toggleDone(u.id)} title={tr('សម្គាល់ថាបានរៀន','Mark as learned')} style={{
          width:22,height:22,borderRadius:6,flexShrink:0,cursor:'pointer',marginTop:1,
          border:`1.5px solid ${p.done?'var(--accent)':'var(--border-strong)'}`,
          background:p.done?'var(--accent)':'var(--surface)',color:'#fff',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,
        }}>{p.done?'✓':''}</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12.5,fontWeight:500,display:'flex',gap:6,alignItems:'baseline',flexWrap:'wrap'}}>
            {u.no && <span style={{fontFamily:'"JetBrains Mono",monospace',color:'var(--accent)',fontWeight:700,fontSize:11}}>{u.no}</span>}
            <span>{tr(u.km, u.en)}</span>
            {u.ja && <span style={{fontSize:11,color:'var(--ink-3)'}}>{u.ja}</span>}
            {p.done && p.doneAt && <span style={{fontSize:10,color:'var(--good)',fontFamily:'"JetBrains Mono",monospace'}}>✓ {p.doneAt}</span>}
          </div>
          <input
            value={p.comment || ''}
            onChange={e=>setComment(u.id, e.target.value)}
            onBlur={commitComment}
            onKeyDown={e=>{ if(e.key==='Enter') e.target.blur(); }}
            placeholder={tr('💬 មតិគ្រូលើមេរៀននេះ...','💬 Instructor comment on this lesson...')}
            style={{marginTop:5,width:'100%',padding:'5px 9px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,fontFamily:'inherit',background:'var(--surface)',color:'var(--ink)',boxSizing:'border-box'}}
          />
        </div>
      </div>
    );
  };

  const StageHdr = ({n,labelKm,labelEn}) => (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--surface-muted)',borderRadius:'6px 6px 0 0',marginTop:10}}>
      <span style={{width:20,height:20,borderRadius:5,background:n===1?'#1B3A6B':'#3B7A57',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{n}</span>
      <span style={{fontSize:11,fontWeight:700,color:'var(--ink-2)'}}>{tr(labelKm,labelEn)}</span>
    </div>
  );

  return (
    <Card label={tr('បញ្ជីមេរៀន & មតិគ្រូ','LESSON CHECKLIST & INSTRUCTOR NOTES')}>
      {/* section toggle */}
      <div style={{display:'flex',gap:6,marginBottom:4}}>
        {[
          {id:'theory',    km:'ទ្រឹស្ដី', en:'Theory · 学科',    total:theory.length},
          {id:'practical', km:'អនុវត្ត', en:'Practical · 技能', total:practical.length},
        ].map(t=>{
          const dn = (t.id==='theory'?theory:practical).filter(u=>prog[u.id]?.done).length;
          return (
            <button key={t.id} onClick={()=>setSec(t.id)} style={{
              flex:1,padding:'7px 10px',borderRadius:8,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,
              border:`1.5px solid ${sec===t.id?'var(--accent)':'var(--border)'}`,
              background:sec===t.id?'var(--accent-soft)':'var(--surface)',
              color:sec===t.id?'var(--accent)':'var(--ink-2)',
            }}>{tr(t.km,t.en)} <span style={{opacity:.7}}>· {dn}/{t.total}</span></button>
          );
        })}
      </div>
      <div style={{fontSize:11,color:'var(--ink-3)',margin:'6px 0 2px'}}>
        {tr(`បានរៀន ${doneCount}/${list.length} មេរៀន`,`${doneCount}/${list.length} lessons completed`)}
      </div>

      {stage1.length>0 && <StageHdr n={1} labelKm="ដំណាក់កាលទី១ · 第一段階" labelEn="Stage 1 · 第一段階"/>}
      {stage1.map(row)}
      {stage2.length>0 && <StageHdr n={2} labelKm="ដំណាក់កាលទី២ · 第二段階" labelEn="Stage 2 · 第二段階"/>}
      {stage2.map(row)}
      {list.length===0 && <div style={{padding:'18px 0',textAlign:'center',color:'var(--ink-3)',fontSize:12}}>{tr('មិនទាន់មានមេរៀន','No lessons defined')}</div>}
    </Card>
  );
};

// local date helper (avoids dependency on global ordering)
const todayStrLocal = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const StudentsProgress = ({ students, onView, onSave }) => {
  const { tr } = useAppActions();
  return (
  <div style={{padding:18,display:'flex',flexDirection:'column',gap:16}}>
    {students.length === 0 ? (
      <div style={{padding:'48px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
        {tr('មិន​ទាន់​មាន​សិស្ស','No students yet')}
      </div>
    ) : (
      <>
        {/* Per-student hour trackers — KH left, JP right */}
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
            <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--ink-3)'}}>
              {tr('ការ​តាម​ដាន​ម៉ោង','HOUR TRACKER')}
            </div>
            <div style={{font:'600 10px/1 "JetBrains Mono",monospace',letterSpacing:'.08em',textTransform:'uppercase',color:'#B0413E'}}>
              HOUR TRACKER JP
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {students.map(s => (
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <SProgressCard s={s} onSave={onSave}/>
                <SProgressCardJP s={s} onSave={onSave}/>
              </div>
            ))}
          </div>
        </div>

        {/* Per-lesson checklist + instructor comments */}
        {students.map(s => <SLessonChecklist key={s.id} s={s} onSave={onSave}/>)}

        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
          <Card label={tr('វឌ្ឍនភាព​សិស្ស​ទាំងអស់','PROGRESS HEATMAP')}>
            <div style={{display:'grid',gridTemplateColumns:'180px repeat(5,1fr) 80px',gap:6,marginTop:10}}>
              <div/>
              {['Theory','Yard','Parking','City','Highway'].map(c => (
                <div key={c} style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em',textTransform:'uppercase',textAlign:'center'}}>{c}</div>
              ))}
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.05em',textTransform:'uppercase',textAlign:'right'}}>Mock</div>
              {students.map(s => (
                <React.Fragment key={s.id}>
                  <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0,padding:'3px 0',cursor:'pointer'}} onClick={() => onView && onView(s)}>
                    <Avatar tag={s.photo} size={22}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.en || s.name}</div>
                      <div style={{fontSize:10,color:'var(--ink-3)'}}>{s.cls}</div>
                    </div>
                  </div>
                  {[s.theory,s.yard,s.parking,s.city,s.highway].map((v,i) => (
                    <div key={i} style={{
                      height:32,borderRadius:4,
                      background: v===0?'var(--surface-muted)':`oklch(${0.55+(v/100)*0.25} ${v===0?0:0.06} ${v>=70?160:v>=40?80:30})`,
                      color: v===0?'var(--ink-3)':v>=50?'#fff':'var(--ink)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,fontWeight:600,fontVariantNumeric:'tabular-nums',
                    }}>{v===0?'—':v}</div>
                  ))}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',fontSize:13,fontWeight:600,color:s.mock_avg>=85?'var(--good)':s.mock_avg>=70?'var(--ink)':'var(--warn)'}}>{s.mock_avg||'—'}</div>
                </React.Fragment>
              ))}
            </div>
          </Card>

          <Card label={tr('ការ​ត្រៀម​ប្រឡង','EXAM READINESS')}>
            {[...students].sort((a,b)=>b.mock_avg-a.mock_avg).slice(0,8).map((s,i) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none',cursor:'pointer'}} onClick={() => onView && onView(s)}>
                <Avatar tag={s.photo} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.hours}/{s.target}h</div>
                </div>
                <div style={{width:70,height:5,background:'var(--surface-muted)',borderRadius:999,overflow:'hidden'}}>
                  <div style={{width:`${s.mock_avg}%`,height:'100%',background:s.mock_avg>=85?'var(--good)':'var(--accent)'}}/>
                </div>
                <div style={{fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums',width:30,textAlign:'right',color:s.mock_avg>=85?'var(--good)':'var(--ink)'}}>{s.mock_avg||'—'}</div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <Card label={tr('ត្រូវ​ការ​ការ​យក​ចិត្ត','NEEDS ATTENTION')}>
            {students.filter(s => s.mock_avg > 0 && s.mock_avg < 75).map((s,i) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none'}}>
                <Avatar tag={s.photo} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500}}>{s.name}</div>
                  <div style={{fontSize:11,color:'var(--warn)',marginTop:2}}>
                    Mock: {s.mock_avg}% {s.mock_avg < 70 ? '· Below pass' : '· Needs work'}
                  </div>
                </div>
                <Btn kind="ghost" size="sm" onClick={() => onView && onView(s)}>មើល</Btn>
              </div>
            ))}
            {students.filter(s=>s.mock_avg>0&&s.mock_avg<75).length===0 && (
              <div style={{padding:20,fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>
                {students.length===0 ? 'No students yet' : 'គ្មាន​សិស្ស​ខ្សោយ​ ✓'}
              </div>
            )}
          </Card>
          <Card label={tr('ជិត​បញ្ចប់','GRADUATING SOON')}>
            {students.filter(s=>s.hours>0&&s.hours>=s.target-5).map((s,i) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none',cursor:'pointer'}} onClick={() => onView && onView(s)}>
                <Avatar tag={s.photo} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.hours}/{s.target}h</div>
                </div>
                <Badge tone="good">{s.status}</Badge>
              </div>
            ))}
            {students.filter(s=>s.hours>0&&s.hours>=s.target-5).length===0 && (
              <div style={{padding:20,fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>—</div>
            )}
          </Card>
          <Card label={tr('ប្រ​ឡ​ង​','EXAM-READY')}>
            {students.filter(s=>s.status==='Road exam soon').map((s,i) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i?'1px dashed var(--border)':'none',cursor:'pointer'}} onClick={() => onView && onView(s)}>
                <Avatar tag={s.photo} size={28}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>Mock avg: {s.mock_avg}%</div>
                </div>
                <Badge tone="warn">Exam</Badge>
              </div>
            ))}
            {students.filter(s=>s.status==='Road exam soon').length===0 && (
              <div style={{padding:20,fontSize:12,color:'var(--ink-3)',textAlign:'center'}}>—</div>
            )}
          </Card>
        </div>
      </>
    )}
  </div>
  );
};

// ── Messages ─────────────────────────────────────────────────────────────────
const CHAT_SEED = [
  {side:'them', who:'ច័ន្ទ​ថា',  time:'ម្សិល 17:24', text:'សួស្ដី​លោកគ្រូ ខ្ញុំ​មិន​ប្រាកដ​ថា​ត្រូវ​បាន​ឯកសារ​អ្វី​ខ្លះ​យក​មក​ខែ​នេះ​ទេ។ ជួយ​ប្រាប់​ផង​បាន​ទេ?'},
  {side:'me',   who:'You',       time:'ម្សិល 17:28', text:'ជំរាបសួរ​ច័ន្ទ​ថា! សម្រាប់​មេរៀន​ស្អែក សូម​យក learner permit, អត្តសញ្ញាណប័ណ្ណ, និង​មួក​ការពារ​មក​ឲ្យ​បាន។'},
  {side:'them', who:'ច័ន្ទ​ថា',  time:'ម្សិល 18:02', text:'អរគុណ​លោកគ្រូ! ឃើញ​ហើយ។ ខ្ញុំ​នឹង​ត្រៀម​នូវ​ឯកសារ​ទាំងអស់។'},
  {side:'me',   who:'You',       time:'10:42',         text:'ស្អែក​ត្រៀម​ឯកសារ permit របស់​អ្នក​មក​ឲ្យ​បាន, បើ​ភ្លេច​ប្រាប់​ខ្ញុំ​មុន​ម៉ោង 8 ផង។'},
];

const StudentMessages = ({ activeStudentId, students }) => {
  const { tr } = useAppActions();
  const [activeMsgId, setActiveMsgId] = React.useState(() => {
    if (activeStudentId) {
      const t = MESSAGES_LIST.find(m => m.s === activeStudentId);
      if (t) return t.id;
    }
    return MESSAGES_LIST[0]?.id ?? null;
  });
  const [chatLines, setChatLines]     = React.useState(CHAT_SEED);
  const [inputVal, setInputVal]       = React.useState('');
  const chatRef = React.useRef(null);

  React.useEffect(() => {
    if (activeStudentId) {
      const t = MESSAGES_LIST.find(m => m.s === activeStudentId);
      if (t) { setActiveMsgId(t.id); setChatLines(CHAT_SEED); }
    }
  }, [activeStudentId]);

  if (MESSAGES_LIST.length === 0) {
    return (
      <div style={{padding:60,textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
        <div style={{fontSize:28,marginBottom:12}}>💬</div>
        <div>{tr('មិន​ទាន់​មាន​សារ','No messages yet')}</div>
        <div style={{fontSize:11,marginTop:8,color:'var(--ink-3)'}}>Messages from students will appear here</div>
      </div>
    );
  }

  const activeThread = MESSAGES_LIST.find(m => m.id === activeMsgId) || MESSAGES_LIST[0] || null;
  const conv = activeThread ? students.find(s => s.id === activeThread.s) : null;

  const sendMsg = () => {
    const text = inputVal.trim();
    if (!text) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    setChatLines(prev => [...prev, {side:'me', who:'You', time, text}]);
    setInputVal('');
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 50);
  };

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [activeMsgId]);

  return (
    <div style={{display:'grid',gridTemplateColumns:'320px 1fr',minHeight:520}}>
      <div style={{borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}>
          <Icon name="search" size={14}/>
          <span style={{fontSize:12,color:'var(--ink-3)'}}>{tr('ស្វែងរក​សារ','search')}</span>
        </div>
        <div style={{flex:1,overflow:'auto'}}>
          {MESSAGES_LIST.map(m => {
            const s = students.find(x => x.id===m.s);
            return (
              <div key={m.id} onClick={() => { setActiveMsgId(m.id); setChatLines(CHAT_SEED); }} style={{
                padding:'12px 14px',borderBottom:'1px solid var(--border)',
                background: activeMsgId===m.id ? 'var(--surface-muted)' : 'transparent',
                display:'flex',gap:10,cursor:'pointer',
              }}>
                <Avatar tag={s?.photo} size={36}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <div style={{fontSize:13,fontWeight:m.unread?600:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s?.name}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)',whiteSpace:'nowrap',fontFamily:'"JetBrains Mono",monospace'}}>{m.time}</div>
                  </div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.lastMsg}</div>
                  <div style={{display:'flex',gap:5,marginTop:6,alignItems:'center'}}>
                    <span style={{fontSize:9,padding:'1px 6px',background:'var(--surface-muted)',color:'var(--ink-3)',borderRadius:3,fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',letterSpacing:'.05em'}}>{m.channel}</span>
                    {m.unread>0 && <span style={{fontSize:10,padding:'1px 6px',background:'var(--accent)',color:'#fff',borderRadius:999,fontWeight:600}}>{m.unread}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',minHeight:0}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
          <Avatar tag={conv?.photo} size={36}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>{conv?.name}</div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>{conv?.en} · {conv?.phone}</div>
          </div>
          <Btn kind="ghost" size="sm" icon={<Icon name="cal" size={13}/>}>កក់​មេរៀន</Btn>
        </div>
        <div ref={chatRef} style={{flex:1,padding:'18px 24px',overflow:'auto',display:'flex',flexDirection:'column',gap:12,background:'var(--surface-muted)'}}>
          {chatLines.map((line,i) => (
            <Bubble key={i} side={line.side} who={line.who} time={line.time}>{line.text}</Bubble>
          ))}
        </div>
        <div style={{padding:'14px 18px',borderTop:'1px solid var(--border)',background:'var(--surface)'}}>
          <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
            {['👋 Hello','✅ Confirmed','📅 Reschedule','💰 Payment reminder'].map(t => (
              <button key={t} onClick={() => setInputVal(t)} style={{
                padding:'4px 10px',background:'var(--surface-muted)',border:'1px solid var(--border)',
                borderRadius:999,fontSize:11,cursor:'pointer',
              }}>{t}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8}}>
            <input
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:13,color:'var(--ink)',fontFamily:'var(--font-km),var(--font-en),sans-serif'}}
              placeholder={tr('សរសេរ​សារ…','type a message…')}
            />
            <Btn kind="primary" size="sm" icon={<Icon name="arrow" size={13}/>} onClick={sendMsg}>ផ្ញើ</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ side, who, time, children }) => (
  <div style={{alignSelf:side==='me'?'flex-end':'flex-start',maxWidth:'72%',display:'flex',flexDirection:'column',gap:4,alignItems:side==='me'?'flex-end':'flex-start'}}>
    <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>{who} · {time}</div>
    <div style={{
      padding:'10px 14px',
      borderRadius: side==='me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
      background: side==='me' ? 'var(--ink)' : 'var(--surface)',
      color:       side==='me' ? 'var(--bg)'  : 'var(--ink)',
      border:      side==='me' ? 'none' : '1px solid var(--border)',
      fontSize:13, lineHeight:1.45,
    }}>{children}</div>
  </div>
);

// ── Documents ─────────────────────────────────────────────────────────────────
const StudentDocs = ({ students, onToggleDoc }) => {
  const { toast, tr } = useAppActions();
  const [reminded, setReminded] = React.useState({});

  const types = [
    {k:'permit',   l:tr('អនុញ្ញាត​សិក្សា','Learner permit')},
    {k:'id_doc',   l:tr('អត្តសញ្ញាណប័ណ្ណ','ID card')},
    {k:'medical',  l:tr('វិញ្ញាបនបត្រ​វេជ្ជសាស្ត្រ','Medical cert.')},
    {k:'photo_id', l:tr('រូប​ថត','Photo 4×6')},
  ];

  const remind = (s) => {
    setReminded(p => ({...p, [s.id]: true}));
    toast(`📨 Reminder sent to ${s.name} (${s.phone})`, 'good');
  };

  if (students.length === 0) return (
    <div style={{padding:'48px',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>
      {tr('មិន​ទាន់​មាន​សិស្ស','No students yet')}
    </div>
  );

  return (
    <div style={{padding:18}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        {types.map(t => {
          const ok = students.filter(s => s[t.k]).length;
          return (
            <Card key={t.k}>
              <div style={{fontSize:12,fontWeight:500}}>{t.l}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:6,marginTop:8}}>
                <div style={{fontSize:28,fontWeight:600,fontFamily:'var(--font-display)',color:ok===students.length?'var(--good)':'var(--warn)'}}>{ok}</div>
                <div style={{fontSize:12,color:'var(--ink-3)'}}>/ {students.length}</div>
              </div>
              <div style={{height:4,background:'var(--surface-muted)',borderRadius:999,marginTop:8,overflow:'hidden'}}>
                <div style={{width:`${students.length>0?(ok/students.length)*100:0}%`,height:'100%',background:ok===students.length?'var(--good)':'var(--warn)'}}/>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>{tr('ឯកសារ​សិស្ស​ទាំងអស់','All student documents')}</div>
      <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:10}}>{tr('ចុច​លើ​រង្វង់​ ដើម្បី​ប្ដូរ​','Click badge to toggle status')}</div>
      <div style={{border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'10px 16px',display:'grid',gridTemplateColumns:'1.6fr repeat(4,1fr) 1fr',gap:14,fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',background:'var(--surface-muted)'}}>
          <div>Student</div>
          {types.map(t => <div key={t.k} style={{textAlign:'center'}}>{t.l}</div>)}
          <div>Actions</div>
        </div>
        {students.map((s,i) => {
          const missing = types.filter(t => !s[t.k]);
          return (
            <div key={s.id} style={{padding:'12px 16px',display:'grid',gridTemplateColumns:'1.6fr repeat(4,1fr) 1fr',gap:14,alignItems:'center',borderTop: i>0 ? '1px solid var(--border)' : 'none'}}>
              <div style={{display:'flex',gap:10,alignItems:'center',minWidth:0}}>
                <Avatar tag={s.photo} size={28}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.id} · {s.cls}</div>
                </div>
              </div>
              {types.map(t => (
                <div key={t.k} style={{display:'flex',justifyContent:'center'}}>
                  <button onClick={() => onToggleDoc && onToggleDoc(s.id, t.k, s[t.k] ? 0 : 1)} style={{
                    width:26,height:26,borderRadius:6,border:'none',cursor:'pointer',
                    background:s[t.k]?'var(--good)':'var(--surface-muted)',
                    border:'1px solid '+(s[t.k]?'var(--good)':'var(--border)'),
                    color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
                    transition:'all .15s',
                  }}>
                    {s[t.k] ? <Icon name="check" size={12} stroke={3}/> : <span style={{color:'var(--warn)',fontWeight:700,fontSize:14}}>!</span>}
                  </button>
                </div>
              ))}
              <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                {missing.length>0 ? (
                  reminded[s.id] ? (
                    <span style={{fontSize:11,color:'var(--good)',fontWeight:500,padding:'4px 8px'}}>✓ Sent</span>
                  ) : (
                    <Btn kind="primary" size="sm" onClick={() => remind(s)}>រំលឹក</Btn>
                  )
                ) : (
                  <span style={{fontSize:11,color:'var(--good)',fontWeight:500,padding:'4px 8px'}}>✓ OK</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── School-issued documents section ───────────────────────── */}
      {students.length === 1 && <SchoolDocs student={students[0]}/>}
    </div>
  );
};

// ── Invoice PDF printer (from school docs) ────────────────────────────────────
const printStudentInvoiceDoc = (doc, student) => {
  const ss = window.__schoolSettings || {};
  const inv = (typeof INVOICES !== 'undefined' ? INVOICES : []).find(i => i.id === doc.invId) || {};
  // Build snap from stored snapshot fields (saved by handleSend) or fall back to minimal data
  const snap = {
    invId:        inv.id || doc.invId || doc.title,
    isPaid:       true,
    student:      inv._studentSnap || student,
    ss,
    lines:        inv._lines        || [{ km: inv.id || doc.title, qty: 1, price: doc.amount || inv.amount || 0 }],
    subtotal:     inv._subtotal     ?? (doc.amount || inv.amount || 0),
    discountAmt:  inv._discountAmt  ?? 0,
    discountPct:  inv._discountPct  ?? 0,
    taxBase:      inv._taxBase      ?? (doc.amount || inv.amount || 0),
    taxAmt:       inv._taxAmt       ?? 0,
    taxPct:       inv._taxPct       ?? 0,
    total:        doc.amount || inv.amount || 0,
    issueDate:    inv._issueDate    || inv.date || doc.date || '—',
    dueDate:      inv._dueDate      || inv.due  || doc.date || '—',
    paymentTerm:  inv._paymentTerm  || 'on-receipt',
    paymentMethod: inv._paymentMethod || inv.method || '—',
    notes:        inv._notes        || '',
  };
  if (!window.buildInvoiceHtml) return;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(window.buildInvoiceHtml(snap));
  w.document.close();
};

// ── School-issued documents (per student) ────────────────────────────────────
const DOC_TYPES = [
  { k:'invoice',     km:'វិក្កយបត្រ',      en:'Invoice',      icon:'cash'  },
  { k:'license',     km:'បណ្ណបើកបរ',      en:'Driving license', icon:'car' },
  { k:'certificate', km:'វិញ្ញាបនបត្រ',    en:'Certificate',  icon:'star'  },
  { k:'other',       km:'ផ្សេងៗ',          en:'Other',        icon:'book'  },
];

// ── Print: Request to certify driver license for use abroad (A4 portrait) ────
// Official Khmer letter; placeholders are filled per-student.
const printLicenseAbroadRequest = (s) => {
  if (!s) return;
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const blank = (w) => `<span class="blank" style="min-width:${w||90}px"></span>`;
  const v = (x, w) => (x && String(x).trim()) ? esc(x) : blank(w);
  // Honorific (ងារ): female → នាងខ្ញុំ, male → ខ្ញុំបាទ
  const honor = s.gender === 'F' ? 'នាងខ្ញុំ' : 'ខ្ញុំបាទ';
  const genderTxt = s.gender === 'F' ? 'ស្រី' : s.gender === 'M' ? 'ប្រុស' : '';
  const dob = (s.dob && /^\d{4}-\d{2}-\d{2}/.test(s.dob)) ? s.dob : '';
  const toKh = (x) => String(x).replace(/[0-9]/g, d => '០១២៣៤៥៦៧៨៩'[+d]);
  const KMM = (typeof KM_MONTHS !== 'undefined' && KM_MONTHS) || ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
  const bDay = dob ? toKh(dob.slice(8,10)) : '';
  const bMonth = dob ? (KMM[+dob.slice(5,7)-1] || toKh(dob.slice(5,7))) : '';
  const bYear = dob ? toKh(dob.slice(0,4)) : '';
  // Prefer the single saved address (what the profile form writes today);
  // fall back to composing from any legacy split fields so old data still shows.
  const addrParts = [
    s.addr_house   && 'ផ្ទះលេខ ' + s.addr_house,
    s.addr_street  && 'ផ្លូវ ' + s.addr_street,
    s.addr_village && 'ភូមិ' + s.addr_village,
    s.addr_commune && 'ឃុំ/សង្កាត់ ' + s.addr_commune,
    (s.addr_district || s.district) && 'ស្រុក/ខណ្ឌ ' + (s.addr_district || s.district),
    s.addr_province && 'ខេត្ត/រាជធានី ' + s.addr_province,
  ].filter(Boolean).join(' ');
  const addr = (s.address && s.address.trim() && s.address.trim() !== '—') ? s.address.trim() : addrParts;
  const name = s.name || s.en || '';
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@400;600;700&family=Noto+Sans+Khmer:wght@400;600;700&family=Moul&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<title>លិខិតស្នើសុំបញ្ជាក់បណ្ណបើកបរ</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background:#e8e8e8; font-family:'Noto Serif Khmer', serif; }
  .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 24px; font-family:'Noto Sans Khmer','Inter',sans-serif; }
  .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
  .pdf-bar .t { font-size:13px; font-weight:600; }
  .sheet { width:210mm; min-height:297mm; margin:60px auto 30px; background:#fff; padding:12.7mm; box-shadow:0 6px 30px rgba(0,0,0,.18); font-size:15px; line-height:2.1; color:#111; }
  .moul { font-family:'Moul','Noto Serif Khmer',serif; }
  .center { text-align:center; }
  .title { font-size:18px; font-weight:700; }
  .sub   { font-size:15px; font-weight:700; font-family:'Moul','Noto Serif Khmer',serif; }
  /* Empty fill-in lines: sit on the text baseline (level with the letters). */
  .blank { display:inline-block; border-bottom:1px dotted #333; vertical-align:baseline; line-height:1; }
  /* Left-aligned (not justified) so unfilled lines don't stretch the spaces. */
  .p { text-indent:48px; margin:14px 0; text-align:left; }
  .strong { font-weight:700; font-family:'Moul','Noto Serif Khmer',serif; }
  .signwrap { width:58%; margin:26px 0 0 auto; text-align:center; }
  .sign { line-height:2.3; }
  .signname { margin-top:46px; font-weight:700; font-family:'Moul','Noto Serif Khmer',serif; }
  .attach { margin-top:34px; font-size:14px; line-height:2; }
  @media print { body { background:#fff; } .pdf-bar { display:none; } .sheet { margin:0; box-shadow:none; width:auto; min-height:auto; } }
</style></head><body>
<div class="pdf-bar"><span class="t">លិខិតស្នើសុំបញ្ជាក់បណ្ណបើកបរ · ${esc(name)}</span><button onclick="window.print()">🖨 បោះពុម្ព / រក្សាជា PDF</button></div>
<div class="sheet">
  <div class="center moul title">ព្រះរាជាណាចក្រកម្ពុជា</div>
  <div class="center moul sub">ជាតិ&nbsp;&nbsp;សាសនា&nbsp;&nbsp;ព្រះមហាក្សត្រ</div>
  <div style="height:18px"></div>

  <div class="p">${honor}ឈ្មោះ <span class="strong">${v(name,140)}</span> ភេទ ${v(genderTxt,40)} កើតថ្ងៃទី${v(bDay,34)} ខែ${v(bMonth,34)} ឆ្នាំ${v(bYear,54)} ជនជាតិ ខ្មែរ កាន់អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ លេខ ${v(s.natId,120)} អាស័យដ្ឋាន៖ ${v(addr,220)} ។</div>

  <div class="center sub" style="margin-top:8px">សូមគោរពជូន</div>
  <div class="center sub">លោកប្រធានមន្ទីរសាធារណការ និង ដឹកជញ្ជូន${v(s.exam_location,120)}</div>

  <div class="p"><span class="strong">កម្មវត្ថុ ៖</span> សំណើសុំបញ្ជាក់ភាពត្រឹមត្រូវលើបណ្ណបើកបរយានយន្តរបស់${honor} លេខ ${v(s.license_no,120)}។</div>

  <div class="p">សេចក្ដីដូចមានសរសេរក្នុងកម្មវត្ថុខាងលើ ${honor}សូមគោរពជូន <span class="strong">លោកប្រធានមន្ទីរ</span> មេត្ដាជ្រាប ៖ ដោយ${honor}ត្រូវទៅធ្វើការនៅក្រៅប្រទេស ហើយត្រូវការបញ្ជាក់ភាពត្រឹមត្រូវលើបណ្ណបើកបរយានយន្តរបស់${honor} លេខ ${v(s.license_no,120)} ដើម្បីយកទៅប្រើប្រាស់នៅក្រៅប្រទេសបាន។</div>

  <div class="p">អាស្រ័យដូចបានជម្រាបជូនខាងលើ សូម <span class="strong">លោកប្រធានមន្ទីរ</span> មេត្ដាពិនិត្យ និងជួយសម្រួលដោយក្ដីអនុគ្រោះ។</div>

  <div class="p">សូម <span class="strong">លោកប្រធានមន្ទីរ</span> មេត្ដាទទួលនូវការគោរពដ៏ខ្ពង់ខ្ពស់ពី${honor}។</div>

  <div class="signwrap">
    <div class="sign">ថ្ងៃ ${blank(40)} ខែ ${blank(40)} ឆ្នាំ ${blank(50)} ព.ស ${blank(70)}<br/>
      ធ្វើនៅ${blank(70)}ថ្ងៃទី${blank(36)}ខែ${blank(36)}ឆ្នាំ${blank(50)}<br/>
      <span class="strong">ស្នាមមេដៃស្ដាំ</span></div>
    <div class="signname">${v(name,140)}</div>
  </div>

  <div class="attach">សូមជូនភ្ជាប់មកជាមួយនូវ ៖
    <div style="display:flex;align-items:baseline;margin-top:4px">
      <span style="flex:0 0 330px;display:inline-flex;align-items:baseline">
        <span style="white-space:nowrap">- ច្បាប់ចម្លងបណ្ណបើកបរ&nbsp;</span>
        <span class="blank" style="flex:1;margin:0 8px"></span>
      </span>
      <span style="white-space:nowrap">១ច្បាប់</span>
    </div>
    <div style="display:flex;align-items:baseline">
      <span style="flex:0 0 330px;display:inline-flex;align-items:baseline">
        <span style="white-space:nowrap">- ច្បាប់ចម្លងអត្តសញ្ញាណប័ណ្ណ&nbsp;</span>
        <span class="blank" style="flex:1;margin:0 8px"></span>
      </span>
      <span style="white-space:nowrap">១ច្បាប់</span>
    </div>
  </div>
</div>
</body></html>`);
  w.document.close();
};

const SchoolDocs = ({ student }) => {
  const { toast, tr } = useAppActions();
  const bp = useBreakpoint();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [adding, setAdding] = React.useState(false);
  const [newType, setNewType] = React.useState('license');
  const [newTitle, setNewTitle] = React.useState('');
  const [newNote, setNewNote] = React.useState('');
  const [newDate, setNewDate] = React.useState(new Date().toISOString().slice(0,10));
  const [newFile, setNewFile] = React.useState(null);   // {data,name,type}
  const fileRef = React.useRef(null);

  const docs = student.schoolDocs || [];

  // Pick an image or PDF → store as a data URL (images are compressed).
  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type === 'application/pdf' && f.size > 8*1024*1024) {
      toast(tr('ឯកសារ PDF ធំពេក (អតិបរមា 8MB)','PDF too large (max 8MB)'), 'warn'); return;
    }
    const fill = (dataUrl) => {
      setNewFile({ data: dataUrl, name: f.name, type: f.type });
      setNewTitle(t => t.trim() ? t : f.name.replace(/\.[^.]+$/, ''));
    };
    if (f.type.startsWith('image/') && window.resizeImageFile) {
      window.resizeImageFile(f, 1600, 1600).then(fill).catch(() => {
        const r = new FileReader(); r.onload = () => fill(r.result); r.readAsDataURL(f);
      });
    } else {
      const r = new FileReader(); r.onload = () => fill(r.result); r.readAsDataURL(f);
    }
  };

  // Open an attached file (image/PDF) reliably in a new tab via a Blob URL.
  const viewDoc = (d) => {
    const src = d.file; if (!src) return;
    if (/^https?:\/\//.test(src)) { window.open(src, '_blank'); return; }   // Storage URL
    try {
      const [meta, b64] = src.split(',');
      const mime = (meta.match(/data:(.*?);/) || [])[1] || d.fileType || 'application/octet-stream';
      const bin = atob(b64), arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr], { type: mime }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { window.open(src, '_blank'); }
  };

  const addDoc = async () => {
    if (!newTitle.trim() && !newFile) { toast(tr('សូមបំពេញឈ្មោះ ឬ ភ្ជាប់ឯកសារ','Enter a title or attach a file'), 'warn'); return; }
    if (!student.schoolDocs) student.schoolDocs = [];
    // Upload the attachment to Storage (keeps the big base64 out of the synced
    // DB); fall back to the inline data URL if Storage isn't available.
    let fileVal = newFile ? newFile.data : undefined;
    if (newFile && window.__sbUploadMedia) {
      const u = await window.__sbUploadMedia(newFile.data, { folder:'docs', name:(student.id||'')+'-'+(newFile.name||'doc') });
      if (u) fileVal = u;
    }
    student.schoolDocs.push({
      id: 'doc-' + Date.now(),
      type: newType,
      title: (newTitle.trim() || (newFile && newFile.name) || 'Document'),
      date: newDate,
      note: newNote.trim(),
      file:     fileVal,
      fileName: newFile ? newFile.name : undefined,
      fileType: newFile ? newFile.type : undefined,
    });
    if (window.saveAllData) window.saveAllData();
    setAdding(false);
    setNewTitle(''); setNewNote(''); setNewFile(null);
    forceUpdate();
    toast(tr('បានបន្ថែមឯកសារ','Document added'), 'good');
  };

  const removeDoc = (id) => {
    const i = student.schoolDocs.findIndex(d => d.id === id);
    if (i !== -1) student.schoolDocs.splice(i, 1);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានលុបឯកសារ','Document removed'), 'neutral');
  };

  const inp = {
    style: {
      width:'100%', padding:'6px 9px', border:'1px solid var(--border)',
      borderRadius:6, fontSize:12, fontFamily:'inherit',
      background:'var(--surface)', color:'var(--ink)', boxSizing:'border-box',
    }
  };

  const typeMeta = (k) => DOC_TYPES.find(t => t.k === k) || DOC_TYPES[3];

  return (
    <div style={{marginTop:24,paddingTop:18,borderTop:'2px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:700}}>{tr('ឯកសារពីសាលា','School Documents')}</div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>
            {tr('បណ្ណបើកបរ វិញ្ញាបនបត្រ វិក្កយបត្រ ។ល។','Driving license, certificate, invoice, etc.')}
          </div>
        </div>
        <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>} onClick={() => setAdding(v => !v)}>
          {tr('បន្ថែម','Add')}
        </Btn>
      </div>

      {/* Generate official A4 letters from student data */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
        <Btn kind="ghost" size="sm" icon={<Icon name="book" size={13}/>} onClick={() => printLicenseAbroadRequest(student)}>
          {tr('លិខិតស្នើសុំបញ្ជាក់បណ្ណបើកបរ (A4)','License certification letter (A4)')}
        </Btn>
      </div>

      {adding && (
        <div style={{
          padding:14, marginBottom:14, borderRadius:9,
          border:'1px solid var(--accent)', background:'var(--accent-soft)',
          display:'flex',flexDirection:'column',gap:10,
        }}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            <div>
              <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:4}}>{tr('ប្រភេទ','Type')}</div>
              <select value={newType} onChange={e => setNewType(e.target.value)} {...inp}>
                {DOC_TYPES.map(t => <option key={t.k} value={t.k}>{tr(t.km, t.en)}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:4}}>{tr('ឈ្មោះ','Title')}</div>
              <input {...inp} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={tr('ឧ. បណ្ណបើកបរ B','e.g. License Class B')}/>
            </div>
            <div>
              <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:4}}>{tr('កាលបរិច្ឆេទ','Date')}</div>
              <input type="date" {...inp} value={newDate} onChange={e => setNewDate(e.target.value)}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:4}}>{tr('កំណត់ចំណាំ','Note')}</div>
            <input {...inp} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder={tr('ផ្សេងៗ…','Optional note…')}/>
          </div>
          {/* File upload — image or PDF */}
          <div>
            <div style={{fontSize:11,color:'var(--ink-2)',marginBottom:4}}>{tr('ឯកសារ (រូបភាព ឬ PDF)','File (image or PDF)')}</div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{display:'none'}} onChange={onPickFile}/>
            {newFile ? (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',border:'1px solid var(--border)',borderRadius:6,background:'var(--surface)',fontSize:12}}>
                <Icon name={newFile.type==='application/pdf'?'book':'star'} size={14}/>
                <span style={{flex:1,minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{newFile.name}</span>
                <button onClick={()=>setNewFile(null)} title={tr('ដក​ចេញ','Remove')} style={{border:'none',background:'none',cursor:'pointer',color:'var(--ink-3)',fontSize:14,lineHeight:1}}>✕</button>
              </div>
            ) : (
              <Btn kind="ghost" size="sm" onClick={()=>fileRef.current?.click()} icon={<Icon name="plus" size={12}/>}>
                {tr('ភ្ជាប់ រូប / PDF','Attach image / PDF')}
              </Btn>
            )}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <Btn kind="ghost" size="sm" onClick={() => { setAdding(false); setNewFile(null); }}>{tr('បោះបង់','Cancel')}</Btn>
            <Btn kind="primary" size="sm" onClick={addDoc}>{tr('រក្សាទុក','Save')}</Btn>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div style={{
          padding:'32px 24px', textAlign:'center',
          border:'1px dashed var(--border)', borderRadius:9,
          color:'var(--ink-3)', fontSize:12,
        }}>
          {tr('មិន​ទាន់​មាន​ឯកសារ – ផ្ញើ​វិក្កយបត្រ​ ឬ​ បន្ថែម​ដោយ​ដៃ',
              'No documents yet – Send an invoice or add manually')}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {docs.slice().reverse().map(d => {
            const tm = typeMeta(d.type);
            const isInv = d.type === 'invoice';
            const iconBox = (
              <div style={{width:36,height:36,borderRadius:8,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background: isInv ? 'var(--good)18' : 'var(--accent-soft)'}}>
                <Icon name={tm.icon} size={16} color={isInv ? 'var(--good)' : 'var(--accent)'}/>
              </div>
            );
            const info = (
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,lineHeight:1.35,...(bp.mobile?{}:{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'})}}>{d.title}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:1,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span>{tm.km} · {tm.en}</span>
                  {d.date && <span style={{fontFamily:'"JetBrains Mono",monospace'}}>{d.date}</span>}
                  {d.note && <span style={{fontStyle:'italic'}}>{d.note}</span>}
                </div>
              </div>
            );
            const actions = (
              <>
                {isInv && d.amount && (
                  <div style={{padding:'4px 10px',borderRadius:6,fontSize:12,fontWeight:700,background:'var(--good)18',color:'var(--good)',border:'1px solid var(--good)40',whiteSpace:'nowrap',flexShrink:0,fontFamily:'"JetBrains Mono",monospace'}}>${d.amount}</div>
                )}
                {d.status && (
                  <div style={{padding:'3px 8px',borderRadius:5,fontSize:11,fontWeight:600,flexShrink:0,background: d.status==='Paid'?'var(--good)':'var(--warn)',color:'#fff'}}>{d.status}</div>
                )}
                {d.type === 'invoice' && (
                  <button onClick={() => printStudentInvoiceDoc(d, student)} style={{background:'var(--accent-soft)',border:'1px solid var(--accent)',cursor:'pointer',padding:'4px 10px',borderRadius:6,flexShrink:0,display:'flex',alignItems:'center',gap:5,color:'var(--accent)',fontSize:11,fontWeight:600}} title={tr('ទាញយក PDF','Download PDF')}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v8M4 6l3 3 3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2"/></svg>
                    PDF
                  </button>
                )}
                {d.file && (
                  <button onClick={() => viewDoc(d)} style={{background:'var(--accent-soft)',border:'1px solid var(--accent)',cursor:'pointer',padding:'4px 10px',borderRadius:6,flexShrink:0,display:'flex',alignItems:'center',gap:5,color:'var(--accent)',fontSize:11,fontWeight:600}} title={tr('មើល​ឯកសារ','View file')}>
                    <Icon name="search" size={12}/> {tr('មើល','View')}
                  </button>
                )}
                <button onClick={() => removeDoc(d.id)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px',color:'var(--ink-3)',borderRadius:5,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}} title={tr('លុប','Remove')}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                </button>
              </>
            );
            if (bp.mobile) return (
              <div key={d.id} style={{display:'flex',flexDirection:'column',gap:10,padding:'11px 14px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)'}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>{iconBox}{info}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>{actions}</div>
              </div>
            );
            return (
              <div key={d.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:9,border:'1px solid var(--border)',background:'var(--surface)'}}>
                {iconBox}{info}{actions}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Print: Graduation Certificate ────────────────────────────────────────────
const printCertificate = (s) => {
  if (!s) return;
  const ss = window.__schoolSettings || {};
  const school     = ss.nameEn || ss.name || 'ANZEN DRIVING SCHOOL';
  const schoolKm   = ss.nameKm || ss.name || 'អ្នហ្សិន ដ្រាយវីង ស្គូល';
  const schoolAddr = ss.address || '';
  const director   = ss.director || '';
  const certNo     = s.id ? s.id.replace(/\D/g,'') || '001' : '001';
  const yr         = new Date().getFullYear();
  const todayEn    = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  const todayKm    = new Date().toLocaleDateString('km-KH', { year:'numeric', month:'long', day:'numeric' });
  const dob        = s.dob ? new Date(s.dob).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) : '..................';
  const enrollD    = s.enrollDate ? new Date(s.enrollDate).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) : '..................';
  const genderTxt  = s.gender === 'M' ? 'Male / ប្រុស' : s.gender === 'F' ? 'Female / ស្រី' : '..........';
  const w = window.open('', '_blank', 'width=1050,height=780');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@400;600;700&family=Noto+Sans+Khmer:wght@400;600;700&family=Cinzel:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<title>វិញ្ញាបនបត្រ</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  *  { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 297mm; height: 210mm; overflow: hidden;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Noto Sans Khmer', sans-serif;
  }
  .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 24px; font-family:'Noto Sans Khmer','Inter',sans-serif; }
  .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
  .pdf-bar button:hover { background:#3a6dc0; }
  .pdf-bar span { font-size:12px; opacity:.7; }
  @media print { .pdf-bar { display:none !important; } body { width:297mm; height:210mm; } }

  /* ── outer page frame ── */
  .page {
    width: 288mm; height: 202mm;
    position: relative;
    border: 3px solid #2155a0;
    outline: 6px solid #2155a0;
    outline-offset: -12px;
    background: #fff;
    padding: 18mm 16mm 12mm 16mm;
  }

  /* ornamental corner SVG diamonds */
  .page::before, .page::after,
  .page .corner-bl::before, .page .corner-br::before {
    content: '';
    position: absolute;
    width: 22px; height: 22px;
    background: #2155a0;
    transform: rotate(45deg);
  }
  .page::before  { top: -3px;  left: -3px; }
  .page::after   { top: -3px;  right: -3px; }
  .page .corner-bl::before { bottom: -3px; left: -3px; }
  .page .corner-br::before { bottom: -3px; right: -3px; }

  /* blue side rules */
  .page .rule-top, .page .rule-bot {
    position: absolute; left: 14px; right: 14px; height: 2px; background: #2155a0;
  }
  .page .rule-top { top: 14px; }
  .page .rule-bot { bottom: 14px; }
  .page .rule-l, .page .rule-r {
    position: absolute; top: 14px; bottom: 14px; width: 2px; background: #2155a0;
  }
  .page .rule-l { left: 14px; }
  .page .rule-r { right: 14px; }

  /* ── watermark ── */
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 140px; height: 140px;
    border-radius: 50%;
    border: 3px solid #2155a040;
    display: flex; align-items: center; justify-content: center;
    font-size: 11pt; font-weight: 700; color: #2155a022;
    font-family: 'Cinzel', serif;
    text-align: center; line-height: 1.3;
    pointer-events: none; user-select: none;
    letter-spacing: .06em;
  }
  .watermark::before, .watermark::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid #2155a030;
  }
  .watermark::before { inset: 8px; }
  .watermark::after  { inset: 16px; }

  /* ── header row ── */
  .hdr { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 5mm; }

  .logo-circle {
    flex-shrink: 0;
    width: 52px; height: 52px; border-radius: 50%;
    border: 2.5px solid #2155a0;
    display: flex; align-items: center; justify-content: center;
    font-size: 7pt; font-weight: 700; color: #2155a0;
    font-family: 'Cinzel', serif;
    text-align: center; line-height: 1.2; padding: 4px;
  }

  .school-info { flex: 1; text-align: center; }
  .school-name-km { font-size: 11pt; font-weight: 700; font-family: 'Noto Serif Khmer', serif; color: #1a1a19; }
  .school-name-en { font-size: 9.5pt; font-weight: 700; font-family: 'Cinzel', serif; color: #1a1a19; letter-spacing: .08em; }
  .school-addr    { font-size: 7.5pt; color: #555; margin-top: 2px; }

  .cert-no-box {
    flex-shrink: 0;
    border: 1.5px solid #2155a0;
    padding: 4px 10px;
    font-size: 8pt; font-family: 'Inter', sans-serif;
    text-align: center; color: #2155a0; font-weight: 700;
    min-width: 70px;
  }
  .cert-no-box span { display: block; font-size: 13pt; letter-spacing: .1em; }

  /* ── title ── */
  .title-row { text-align: center; margin-bottom: 4mm; border-top: 1.5px solid #2155a0; border-bottom: 1.5px solid #2155a0; padding: 3px 0; }
  .title-km { font-size: 17pt; font-weight: 700; font-family: 'Noto Serif Khmer', serif; color: #1a1a19; }
  .title-en { font-size: 10pt; font-weight: 600; font-family: 'Cinzel', serif; color: #2155a0; letter-spacing: .12em; }

  /* ── body fields ── */
  .fields { font-size: 9.5pt; line-height: 2; font-family: 'Noto Sans Khmer', sans-serif; }
  .field-row { display: flex; gap: 8px; align-items: baseline; }
  .field-label { white-space: nowrap; color: #333; flex-shrink: 0; }
  .field-val {
    flex: 1; border-bottom: 1px solid #555;
    min-width: 60px; padding: 0 4px;
    font-weight: 600; color: #1a1a19;
    font-family: 'Noto Serif Khmer', serif;
  }
  .field-val.long { min-width: 200px; }
  .inline-fields { display: flex; gap: 16px; }

  .completion-text {
    margin-top: 3mm;
    font-size: 9.5pt; line-height: 1.85;
    font-family: 'Noto Sans Khmer', sans-serif;
    color: #1a1a19;
  }
  .completion-text b { font-family: 'Noto Serif Khmer', serif; font-size: 10.5pt; }

  /* ── footer ── */
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4mm; }
  .sig-block { text-align: center; }
  .sig-line { width: 120px; border-bottom: 1.5px solid #1a1a19; margin: 0 auto 4px; height: 28px; }
  .sig-lbl { font-size: 8.5pt; font-family: 'Noto Sans Khmer', sans-serif; color: #333; }
  .sig-name { font-size: 8pt; color: #666; }
  .issued-box { text-align: center; font-size: 8.5pt; color: #333; }
</style>
</head><body>
<div class="page">
  <!-- corner decorations -->
  <div class="corner-bl"></div>
  <div class="corner-br"></div>
  <!-- inner rules -->
  <div class="rule-top"></div>
  <div class="rule-bot"></div>
  <div class="rule-l"></div>
  <div class="rule-r"></div>

  <!-- watermark -->
  <div class="watermark">${school}</div>

  <!-- header -->
  <div class="hdr">
    <div class="logo-circle">ANZEN<br/>DRIVE</div>
    <div class="school-info">
      <div class="school-name-km">${schoolKm}</div>
      <div class="school-name-en">${school}</div>
      ${schoolAddr ? '<div class="school-addr">'+schoolAddr+'</div>' : ''}
    </div>
    <div class="cert-no-box">
      NO. CERT<br/><span>${certNo}</span>
    </div>
  </div>

  <!-- title -->
  <div class="title-row">
    <div class="title-km">វិញ្ញាបនបត្រ</div>
    <div class="title-en">C E R T I F I C A T E</div>
  </div>

  <!-- fields -->
  <div class="fields">
    <div class="field-row">
      <span class="field-label">ឈ្មោះ / Name:</span>
      <span class="field-val long">${s.name || ''}${s.en ? ' ('+s.en+')' : ''}</span>
      <span class="field-label" style="margin-left:12px;">ID:</span>
      <span class="field-val">${s.id || ''}</span>
    </div>
    <div class="inline-fields">
      <div class="field-row">
        <span class="field-label">ភេទ / Sex:</span>
        <span class="field-val">${genderTxt}</span>
      </div>
      <div class="field-row">
        <span class="field-label">ថ្ងៃខែឆ្នាំ​កំណើត / Date of Birth:</span>
        <span class="field-val">${dob}</span>
      </div>
    </div>
    <div class="completion-text">
      បានបញ្ចប់​ការ​បណ្ដុះ​បណ្ដាល​បើក​បរ​ប្រភេទ <b>( ${s.cls || 'B'} )</b> ជោគជ័យ ​ · ​
      Has successfully completed Technical Driving Training with Category <b>( ${s.cls || 'B'} )</b><br/>
      ចាប់ពី / From: <b>${enrollD}</b>
      &nbsp;&nbsp;&nbsp;
      ដល់ / To: <b>${todayEn}</b>
      <br/>
      <span style="font-size:8.5pt;color:#555;">វិញ្ញាបនបត្រ​នេះ​ចេញ​ជូន​ដល់​អ្នក​កាន់​ឯកសារ​នេះ​ · This certificate is issued to the bearer for official purpose.</span>
    </div>
  </div>

  <!-- footer -->
  <div class="footer">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-lbl">ជ.យក / Director</div>
      <div class="sig-name">${director}</div>
    </div>
    <div class="issued-box">
      <div style="font-size:8pt;color:#888;">ចុះ​ថ្ងៃ​ · Date issued</div>
      <div style="font-weight:600;">${todayKm}</div>
      <div style="font-size:7.5pt;color:#888;">${todayEn}</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-lbl">ហត្ថលេខា / Signature</div>
      <div class="sig-name">${s.name || ''}</div>
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

// ── Print: Study Record (教習原簿 · A3 fold → 4-page A4 booklet) ──────────────
const printStudyRecord = (s) => {
  if (!s) return;
  const ss = window.__schoolSettings || {};
  const schoolKm   = ss.nameKm || ss.name || 'សាលាបង្រៀនបើកបរ អាន់ហ្សិន';
  const schoolEn   = ss.nameEn || ss.name || 'ANZEN DRIVING SCHOOL';
  const schoolAddr = ss.address || '';
  const director   = ss.director || '';
  const lib        = window.__lessonsLib || {};
  const theory     = lib.theoryTexts    || [];
  const practical  = lib.practicalTexts || [];
  const exams      = lib.examMilestones || [];

  const esc = (v) => String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '';
  const today   = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});

  const photoIsImg = typeof s.photo==='string' && (s.photo.startsWith('data:')||s.photo.startsWith('http'));
  const photoCell  = photoIsImg
    ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;display:block"/>`
    : `<div class="ph-ph">រូបថត 4×6<br/>PHOTO</div>`;

  const addr = [s.addr_house,s.addr_street,s.addr_village,s.addr_commune,s.addr_district||s.district,s.addr_province].filter(Boolean).map(esc).join(', ') || '—';
  const genderTxt = s.gender==='M'?'ប្រុស':s.gender==='F'?'ស្រី':'—';

  // bio rows
  const bio = (l,v) => `<tr><td class="bl">${l}</td><td class="bv">${v||'—'}</td></tr>`;

  // ── Map each curriculum lesson → the actual date(s) it was taught, pulled
  //    from the schedule (LESSONS) for this student. A 'done' lesson wins;
  //    otherwise the most recent scheduled date is shown.
  const dateMap = {};   // lessonId → { date, done }
  let schedHours = 0, schedHoursDone = 0, schedLessons = 0;   // totals from the schedule
  (typeof LESSONS !== 'undefined' ? LESSONS : []).forEach(l => {
    if (l.studentId !== s.id || l.status === 'cancelled') return;
    const isDone = l.status === 'done';
    const len = parseFloat(l.len) || 0;
    schedHours += len; schedLessons += 1; if (isDone) schedHoursDone += len;
    if (!Array.isArray(l.lessonIds) || !l.lessonIds.length) return;
    // Split the lesson's total hours evenly across its contents
    // e.g. 10:00–12:00 (2h) with 技能2, 技能3 → 1h each
    const perLesson = len / l.lessonIds.length;
    l.lessonIds.forEach(id => {
      const cur = dateMap[id];
      if (!cur) { dateMap[id] = { date: l.date, done: isDone, hours: perLesson }; return; }
      cur.hours = (cur.hours || 0) + perLesson;   // accumulate this lesson's share
      // prefer a done record; else keep the later date
      if (isDone && !cur.done) { cur.date = l.date; cur.done = true; }
      else if (isDone === cur.done && (l.date||'') > (cur.date||'')) cur.date = l.date;
    });
  });
  const shortDate = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '';
  const fmtHr = (h) => h ? (Number.isInteger(h) ? h : h.toFixed(1)) + 'h' : '';

  // lesson table rows — date + hours taken from the schedule
  const lessonRows = (arr, doneArr) => arr.map((u,i) => {
    const sched = dateMap[u.id];
    const done  = !!(sched ? sched.done : (Array.isArray(doneArr) && doneArr[i]));
    const dateTxt = sched ? shortDate(sched.date) : '';
    const hrTxt   = sched ? fmtHr(sched.hours) : '';
    return `<tr>
      <td class="ln">${esc(u.no||'')}</td>
      <td class="lj">${esc(u.ja||'')}</td>
      <td class="lk">${esc(u.km||'')}</td>
      <td class="lm">${esc(hrTxt)}</td>
      <td class="lc">${done?'✓':(sched?'<span style="color:#2A5DB0">●</span>':'<span class="box"></span>')}</td>
      <td class="ld">${esc(dateTxt)}</td>
    </tr>`;
  }).join('');

  const th1 = theory.filter(t=>t.stage===1), th2 = theory.filter(t=>t.stage===2);
  const pr1 = practical.filter(t=>t.stage===1), pr2 = practical.filter(t=>t.stage===2);

  const examRows = exams.map(e => `<tr>
    <td class="en">${esc(e.no)}</td>
    <td class="ej">${esc(e.ja)}</td>
    <td class="ek">${esc(e.km)}</td>
    <td class="ep">${esc(e.pass)}</td>
    <td class="ed"></td>
    <td class="er"></td>
  </tr>`).join('');

  const w = window.open('', '_blank', 'width=1100,height=820');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@400;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<title>ប្រវត្តិសិក្សា · 教習原簿 — ${esc(s.name)}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#9aa0a6; font-family:'Noto Sans Khmer','Noto Sans JP','Inter',sans-serif; color:#1a1a19; }
  .pdf-bar { position:fixed; top:0; left:0; right:0; z-index:999; background:#1a1a19; color:#fff; display:flex; align-items:center; gap:14px; padding:10px 24px; }
  .pdf-bar button { background:#2a5db0; color:#fff; border:none; border-radius:6px; padding:8px 20px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
  .pdf-bar span { font-size:12px; opacity:.75; }
  @media print { .pdf-bar { display:none !important; } body { background:#fff; } }

  .sheet { width:210mm; height:297mm; background:#fff; margin:18px auto; padding:14mm 13mm; position:relative; page-break-after:always; overflow:hidden; }
  .sheet:last-child { page-break-after:auto; }

  /* page header */
  .ph-hdr { display:flex; align-items:center; gap:10px; border-bottom:2px solid #1a3a6b; padding-bottom:7px; margin-bottom:10px; }
  .ph-logo { width:46px; height:46px; border-radius:50%; border:2px solid #1a3a6b; display:flex; align-items:center; justify-content:center; font:700 6.5pt/1.1 'Inter'; color:#1a3a6b; text-align:center; flex-shrink:0; }
  .ph-sname { flex:1; }
  .ph-km { font:700 13pt/1.2 'Noto Serif Khmer',serif; }
  .ph-en { font:700 8.5pt/1.2 'Inter'; letter-spacing:.08em; color:#1a3a6b; }
  .ph-addr { font-size:7pt; color:#666; margin-top:1px; }
  .ph-pg { font:700 8pt/1.3 'Inter'; color:#1a3a6b; text-align:right; }
  .ph-pg b { display:block; font-size:11pt; }

  .doc-title { text-align:center; margin:6px 0 12px; }
  .doc-title .km { font:700 16pt/1.2 'Noto Serif Khmer',serif; }
  .doc-title .jp { font:700 11pt/1.2 'Noto Sans JP',sans-serif; color:#1a3a6b; letter-spacing:.18em; }
  .doc-title .en { font-size:8pt; color:#777; letter-spacing:.12em; }

  .sec-h { background:#1a3a6b; color:#fff; font:700 9pt/1 'Noto Sans Khmer'; padding:5px 9px; margin:12px 0 0; border-radius:3px 3px 0 0; display:flex; justify-content:space-between; }
  .sec-h .ja { font-family:'Noto Sans JP'; font-weight:500; opacity:.9; }

  /* bio + photo grid */
  .id-grid { display:flex; gap:10px; }
  .id-photo { width:34mm; height:44mm; border:1.5px solid #1a3a6b; flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f4f6fa; }
  .ph-ph { font:600 8pt/1.5 'Noto Sans Khmer'; color:#9aa6bb; text-align:center; }
  table.bio { width:100%; border-collapse:collapse; }
  table.bio td { border:1px solid #c8d0dc; padding:4px 7px; font-size:8.5pt; vertical-align:middle; }
  table.bio td.bl { background:#eef2f8; color:#33415c; width:32%; font-weight:600; white-space:nowrap; }
  table.bio td.bv { font-weight:600; font-family:'Noto Serif Khmer',serif; }

  /* aptitude box */
  .apt { display:flex; gap:8px; margin-top:6px; }
  .apt .cell { flex:1; border:1px solid #c8d0dc; border-radius:4px; padding:6px 8px; text-align:center; }
  .apt .cell .l { font-size:7pt; color:#667; }
  .apt .cell .v { font:700 11pt/1.2 'Inter'; margin-top:2px; }

  /* lesson tables */
  table.les { width:100%; border-collapse:collapse; margin-bottom:2px; }
  table.les th { background:#33415c; color:#fff; font:600 7.5pt/1.2 'Noto Sans Khmer'; padding:4px 5px; text-align:left; }
  table.les td { border:1px solid #d5dbe5; padding:3px 5px; font-size:7.8pt; }
  table.les tr:nth-child(even) td { background:#f6f8fb; }
  td.ln { font:700 7.5pt 'Inter'; color:#1a3a6b; white-space:nowrap; width:9%; }
  td.lj { font-family:'Noto Sans JP'; width:30%; }
  td.lk { width:38%; font-family:'Noto Serif Khmer',serif; }
  td.lm { width:7%; color:#888; text-align:center; font-family:'Inter'; }
  td.lc { width:8%; text-align:center; color:#1a7a3c; font-weight:700; }
  td.ld { width:14%; }
  .box { display:inline-block; width:11px; height:11px; border:1.3px solid #99a; border-radius:2px; }
  .stage-tag { display:inline-block; font:700 7pt 'Inter'; color:#fff; padding:1px 7px; border-radius:3px; margin-left:6px; }

  /* exam table */
  table.exm { width:100%; border-collapse:collapse; }
  table.exm th { background:#7a3b2b; color:#fff; font:600 8pt 'Noto Sans Khmer'; padding:5px 6px; text-align:left; }
  table.exm td { border:1px solid #d5cdc8; padding:5px 7px; font-size:8.2pt; }
  td.en { font:700 9pt 'Inter'; text-align:center; width:6%; }
  td.ej { font-family:'Noto Sans JP'; width:24%; }
  td.ek { width:34%; font-family:'Noto Serif Khmer',serif; }
  td.ep { width:12%; text-align:center; font:700 8pt 'Inter'; color:#7a3b2b; }
  td.ed, td.er { width:12%; }

  /* progress + signature */
  .prog { display:flex; gap:8px; margin-top:8px; }
  .prog .b { flex:1; border:1px solid #c8d0dc; border-radius:5px; padding:8px; text-align:center; }
  .prog .b .l { font-size:7.5pt; color:#667; }
  .prog .b .v { font:700 15pt 'Inter'; color:#1a3a6b; margin-top:2px; }
  .notes-box { border:1px solid #c8d0dc; border-radius:5px; min-height:26mm; margin-top:6px; padding:8px; font-size:8pt; color:#445; }
  .sig-row { display:flex; justify-content:space-between; margin-top:14mm; }
  .sig { text-align:center; width:46%; }
  .sig .line { border-bottom:1.4px solid #1a1a19; height:24px; margin-bottom:5px; }
  .sig .lbl { font-size:8.5pt; color:#333; }
  .sig .nm { font-size:8pt; color:#777; }
  .foot-note { position:absolute; bottom:8mm; left:13mm; right:13mm; text-align:center; font-size:6.8pt; color:#aaa; border-top:1px solid #e0e0e0; padding-top:4px; }
</style></head><body>

<!-- ══ PAGE 1 — Cover + Student profile ══ -->
<div class="sheet">
  <div class="ph-hdr">
    <div class="ph-logo">ANZEN<br/>DRIVE</div>
    <div class="ph-sname"><div class="ph-km">${esc(schoolKm)}</div><div class="ph-en">${esc(schoolEn)}</div>${schoolAddr?`<div class="ph-addr">${esc(schoolAddr)}</div>`:''}</div>
    <div class="ph-pg">PAGE<b>1</b>/4</div>
  </div>
  <div class="doc-title">
    <div class="km">សៀវភៅប្រវត្តិសិក្សាបើកបរ</div>
    <div class="jp">教 習 原 簿</div>
    <div class="en">DRIVING LESSON RECORD BOOK · JAPANESE STANDARD</div>
  </div>

  <div class="sec-h">ព័ត៌មានសិស្ស <span class="ja">教習生情報 · Student Information</span></div>
  <div class="id-grid" style="margin-top:7px">
    <div class="id-photo">${photoCell}</div>
    <table class="bio">
      ${bio('ឈ្មោះ', esc(s.name))}
      ${bio('ឈ្មោះឡាតាំង', esc(s.en))}
      ${bio('លេខសម្គាល់', esc(s.id))}
      ${bio('ភេទ', genderTxt)}
      ${bio('ថ្ងៃកំណើត', fmtDate(s.dob) || (s.age?esc(s.age)+' ឆ្នាំ':'—'))}
      ${bio('ប្រភេទសិស្ស', esc(s.studentType||'ធម្មតា'))}
    </table>
  </div>
  <table class="bio" style="margin-top:8px">
    ${bio('សញ្ជាតិ', esc(s.nationality))}
    ${bio('ទូរស័ព្ទ', esc(s.phone))}
    ${bio('ប្រភេទប័ណ្ណ', esc(s.cls)+' · '+esc(s.trans||'AT'))}
    ${bio('ថ្ងៃចុះឈ្មោះ', esc(s.enrolled))}
    ${bio('គ្រូទទួលបន្ទុក', esc(s.inst))}
    ${bio('អាសយដ្ឋាន', addr)}
  </table>

  <div class="sec-h">ការត្រួតពិនិត្យសមត្ថភាព <span class="ja">適性検査 · Aptitude Test</span></div>
  <div class="apt">
    <div class="cell"><div class="l">ភ្នែកឆ្វេង · 左眼</div><div class="v">${esc(s.eye_left)||'—'}</div></div>
    <div class="cell"><div class="l">ភ្នែកស្ដាំ · 右眼</div><div class="v">${esc(s.eye_right)||'—'}</div></div>
    <div class="cell"><div class="l">ភ្នែកទាំងពីរ · 両眼</div><div class="v">${esc(s.eye_both)||'—'}</div></div>
    <div class="cell"><div class="l">ស្ថានភាពភ្នែក · Eye condition</div><div class="v" style="font-size:9pt;font-family:'Noto Sans Khmer'">${esc(normEye(s.glasses))||'—'}</div></div>
  </div>

  <div class="sec-h">ខ្លឹមសារកម្មវិធីសិក្សា <span class="ja">教習課程の概要 · Curriculum Overview</span></div>
  <table class="bio" style="margin-top:7px">
    ${bio('ដំណាក់កាលទី១', 'បើកបរក្នុងសាលា (所内) · ទ្រឹស្ដី 学科 1–10 · អនុវត្ត AT 12h / MT 15h')}
    ${bio('ដំណាក់កាលទី២', 'បើកបរលើផ្លូវ (路上) · ទ្រឹស្ដី 学科 11–26 · អនុវត្ត 19h')}
    ${bio('ការប្រឡង', '適性検査 → 修了検定 → 仮免学科 → 卒業検定 → 本免学科')}
  </table>
  <div class="foot-note">教習原簿 · ${esc(schoolEn)} · បោះពុម្ព ${today}</div>
</div>

<!-- ══ PAGE 2 — Theory record ══ -->
<div class="sheet">
  <div class="ph-hdr">
    <div class="ph-logo">ANZEN<br/>DRIVE</div>
    <div class="ph-sname"><div class="ph-km">${esc(schoolKm)}</div><div class="ph-en">${esc(schoolEn)}</div></div>
    <div class="ph-pg">PAGE<b>2</b>/4</div>
  </div>
  <div class="doc-title"><div class="km">មេរៀនទ្រឹស្ដី</div><div class="jp">学 科 教 習 記 録</div><div class="en">THEORY LESSON RECORD</div></div>

  <div class="sec-h">ដំណាក់កាលទី១ <span class="ja">第一段階 · 学科 1–10 (仮免許)</span><span class="stage-tag" style="background:#2a5db0">STAGE 1</span></div>
  <table class="les"><tr><th>No</th><th>科目 · Subject</th><th>ខ្មែរ</th><th>時間 · ម៉ោង</th><th>受講</th><th>月日 · Date</th></tr>${lessonRows(th1, s.theory_jp_done)}</table>

  <div class="sec-h">ដំណាក់កាលទី២ <span class="ja">第二段階 · 学科 11–26 (本免許)</span><span class="stage-tag" style="background:#3b7a57">STAGE 2</span></div>
  <table class="les"><tr><th>No</th><th>科目 · Subject</th><th>ខ្មែរ</th><th>時間 · ម៉ោង</th><th>受講</th><th>月日 · Date</th></tr>${lessonRows(th2, (s.theory_jp_done||[]).slice(th1.length))}</table>
  <div class="foot-note">学科教習記録 · ${esc(s.name)} (${esc(s.id)}) · ${today}</div>
</div>

<!-- ══ PAGE 3 — Practical record ══ -->
<div class="sheet">
  <div class="ph-hdr">
    <div class="ph-logo">ANZEN<br/>DRIVE</div>
    <div class="ph-sname"><div class="ph-km">${esc(schoolKm)}</div><div class="ph-en">${esc(schoolEn)}</div></div>
    <div class="ph-pg">PAGE<b>3</b>/4</div>
  </div>
  <div class="doc-title"><div class="km">មេរៀនអនុវត្តន៍</div><div class="jp">技 能 教 習 記 録</div><div class="en">PRACTICAL LESSON RECORD</div></div>

  <div class="sec-h">ដំណាក់កាលទី១ <span class="ja">第一段階 · 所内 (AT 12h / MT 15h)</span><span class="stage-tag" style="background:#2a5db0">STAGE 1</span></div>
  <table class="les"><tr><th>No</th><th>項目 · Item</th><th>ខ្មែរ</th><th>時間 · ម៉ោង</th><th>印</th><th>月日 · Date</th></tr>${lessonRows(pr1, s.practice_jp_done)}</table>

  <div class="sec-h">ដំណាក់កាលទី២ <span class="ja">第二段階 · 路上 (19h)</span><span class="stage-tag" style="background:#3b7a57">STAGE 2</span></div>
  <table class="les"><tr><th>No</th><th>項目 · Item</th><th>ខ្មែរ</th><th>時間 · ម៉ោង</th><th>印</th><th>月日 · Date</th></tr>${lessonRows(pr2, (s.practice_jp_done||[]).slice(pr1.length))}</table>
  <div class="foot-note">技能教習記録 · ${esc(s.name)} (${esc(s.id)}) · ${today}</div>
</div>

<!-- ══ PAGE 4 — Exams + Completion ══ -->
<div class="sheet">
  <div class="ph-hdr">
    <div class="ph-logo">ANZEN<br/>DRIVE</div>
    <div class="ph-sname"><div class="ph-km">${esc(schoolKm)}</div><div class="ph-en">${esc(schoolEn)}</div></div>
    <div class="ph-pg">PAGE<b>4</b>/4</div>
  </div>
  <div class="doc-title"><div class="km">កំណត់ត្រាការប្រឡង និងការបញ្ចប់</div><div class="jp">検 定 ・ 修 了 記 録</div><div class="en">EXAMINATION &amp; COMPLETION RECORD</div></div>

  <div class="sec-h">កំណត់ត្រាការប្រឡង <span class="ja">検定・試験記録 · Examination Records</span></div>
  <table class="exm"><tr><th>#</th><th>試験 · Exam</th><th>ខ្មែរ</th><th>合格 · Pass</th><th>月日 · Date</th><th>結果 · Result</th></tr>${examRows}</table>

  <div class="sec-h">សង្ខេបវឌ្ឍនភាព <span class="ja">進捗状況 · Progress Summary</span></div>
  <div class="prog">
    <div class="b"><div class="l">ម៉ោងសិក្សា · 教習時間</div><div class="v">${schedHours}/${esc(s.target||40)}</div></div>
    <div class="b"><div class="l">មេរៀន · 教習回数</div><div class="v">${schedLessons}</div></div>
    <div class="b"><div class="l">ប្រឡងសាកល្បង · 模擬試験</div><div class="v">${esc(s.mock_avg||0)}%</div></div>
    <div class="b"><div class="l">ស្ថានភាព · 状態</div><div class="v" style="font-size:9pt;font-family:'Noto Sans Khmer'">${esc(s.status||'—')}</div></div>
  </div>

  <div class="sec-h">មតិយោបល់គ្រូបង្រៀន <span class="ja">指導員所見 · Instructor's Comments</span></div>
  <div class="notes-box"></div>

  <div class="sig-row">
    <div class="sig"><div class="line"></div><div class="lbl">គ្រូទទួលបន្ទុក · 指導員 / Instructor</div><div class="nm">${esc(s.inst)||''}</div></div>
    <div class="sig"><div class="line"></div><div class="lbl">នាយកសាលា · 校長 / Director</div><div class="nm">${esc(director)}</div></div>
  </div>
  <div style="text-align:center;margin-top:10mm;font-size:8.5pt;color:#445">ចេញនៅថ្ងៃ · 発行日 / Issued: <b>${today}</b></div>
  <div class="foot-note">${esc(schoolEn)} · 教習原簿 · A3 បត់ជាពីរ → ៤ ទំព័រ</div>
</div>

<div class="pdf-bar">
  <button onclick="window.print()">💾 រក្សាទុកជា PDF</button>
  <span>ជ្រើស "Save as PDF" · បោះពុម្ពលើ A3 បត់ជាពីរ (ឬ A4 ៤សន្លឹក)</span>
</div>
</body></html>`);
  w.document.close();
};

// ── Student Print Menu ────────────────────────────────────────────────────────
const StPrintMenuStudents = ({ students }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  if (!students || students.length === 0) return null;

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={() => setOpen(v => !v)} style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'7px 12px', border:'1px solid var(--border)',
        background: open ? 'var(--surface-muted)' : 'var(--surface)',
        color:'var(--ink)', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer',
      }}>
        💾 PDF
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:200,
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,.12)',
          padding:'10px 14px', minWidth:380,
        }}>
          <div style={{fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',textTransform:'uppercase',marginBottom:8}}>💾 PDF DOCUMENTS</div>
          <StPrintRowStudents
            label="📘 ប្រវត្តិសិក្សា"
            students={students}
            onPrint={(s) => { printStudyRecord(s); setOpen(false); }}
          />
          <div style={{height:1,background:'var(--border)',margin:'4px 0'}}/>
          <StPrintRowStudents
            label="💾 វិញ្ញាបនបត្រ (PDF)"
            students={students}
            onPrint={(s) => { printCertificate(s); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
};

const StPrintRowStudents = ({ label, students, onPrint }) => {
  const [selId, setSelId] = React.useState(students[0]?.id || '');
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
      <div style={{flex:1,fontSize:12.5,fontWeight:500}}>{label}</div>
      <select value={selId} onChange={e => setSelId(e.target.value)}
        style={{padding:'5px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,
          background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit',maxWidth:140}}>
        {students.map(s => (
          <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
        ))}
      </select>
      <button onClick={() => onPrint(students.find(s => s.id === selId))}
        style={{background:'#111',color:'#fff',border:'none',borderRadius:6,
          padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer',
          display:'inline-flex',alignItems:'center',gap:5}}>
        💾 PDF
      </button>
    </div>
  );
};

const StudentsScreen = StudentsScreenV2;
Object.assign(window, { StudentsScreenV2, StudentsScreen });
