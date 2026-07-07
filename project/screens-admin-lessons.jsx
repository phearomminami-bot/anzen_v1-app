// screens-admin-lessons.jsx
// Admin CMS for the Anzen driving-lesson library.
// Provides full CRUD for theory + practical (text lessons, video lessons,
// quizzes) plus inline image embedding in text bodies and per-question
// images in quizzes. Stores edits in localStorage and mutates
// window.__lessonsLib in place so the student-facing LessonsScreen sees
// updates immediately (it shares the same array references).
//
// Dependencies (must already be in scope as window globals):
//   React, ReactDOM
//   useAppActions  ─ from widgets.jsx (toast / confirm / tr / lang / navigate)
//   Modal          ─ portal-based centered overlay
//   Btn, Icon      ─ from ui.jsx
//   window.LessonsScreen        ─ original student-facing screen (wrapped)
//   window.__lessonsLib         ─ live data store (initialised in screens-lessons.jsx):
//     { theoryTexts, theoryVideos, theoryExercises,
//       practicalTexts, practicalVideos, practicalExercises }
//
// Mount: replaces window.LessonsScreen with a role-aware wrapper that
// renders <AdminLessonsScreen/> for admin/instructor and falls through to
// the original screen for students.
// ──────────────────────────────────────────────────────────────────────────

// screens-admin-lessons.jsx — Admin CMS for the driving-lesson library
// (theory texts, practical texts, video lessons, in-lesson quizzes).
// Mutates window.__lessonsLib in place — student-facing LessonsScreen
// shares the same array references and re-renders on the next mount.

const ADMIN_LESSONS_STORE = 'anzen_lessons_v1';

// Restore previously-saved library — overwrites the seed arrays in-place
(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_LESSONS_STORE) || 'null');
    if (!saved || typeof saved !== 'object' || !window.__lessonsLib) return;
    const replace = (arr, src) => {
      if (Array.isArray(src)) { arr.length = 0; arr.push(...src); }
    };
    replace(window.__lessonsLib.theoryTexts,        saved.theoryTexts);
    replace(window.__lessonsLib.theoryVideos,       saved.theoryVideos);
    replace(window.__lessonsLib.theoryExercises,    saved.theoryExercises);
    replace(window.__lessonsLib.practicalTexts,     saved.practicalTexts);
    replace(window.__lessonsLib.practicalVideos,    saved.practicalVideos);
    replace(window.__lessonsLib.practicalExercises, saved.practicalExercises);
    // The saved copy may predate newly shipped lessons/fields — merge the seed
    // back in (adds missing lessons + backfills goals) without losing edits.
    if (window.__mergeSeedLessons) window.__mergeSeedLessons();
  } catch(e) {}
})();

const persistLessonsLib = () => {
  try { localStorage.setItem(ADMIN_LESSONS_STORE, JSON.stringify(window.__lessonsLib)); } catch(e) {}
  // Push the edit to Supabase too. Without this the edit lives only in this
  // browser's localStorage; the next cloud load (rebuildLib) would overwrite
  // it with the un-synced server copy and the change would disappear.
  try { if (window.__sbConfigured && window.__sbConfigured()) window.__sbSyncAll && window.__sbSyncAll(); } catch(e) {}
};
// Exposed so the Settings → Data backup export can include the lessons library.
window.__persistLessonsLib = persistLessonsLib;

// ── AI auto-translate (Khmer → English) ────────────────────────────────────
async function aiTranslateKmToEn(kmText) {
  const text = (kmText || '').trim();
  if (!text) return '';
  const apiKey = window.__schoolSettings && window.__schoolSettings.anthropicKey;
  if (!apiKey) return null;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content:
          'Translate this Khmer driving-school lesson text into natural, concise English. '
          + 'Return ONLY the English translation — no quotes, no notes, no Khmer.\n\n' + text }],
      }),
    });
    if (!resp.ok) return '';
    const data = await resp.json();
    return ((data.content && data.content[0] && data.content[0].text) || '').trim();
  } catch (e) { return ''; }
}

// Translate a rich-HTML lesson body Khmer→English while keeping every tag,
// attribute and <img> intact. Returns null when no API key is configured.
async function aiTranslateHtmlKmToEn(html) {
  const text = (html || '').trim();
  if (!text) return '';
  const apiKey = window.__schoolSettings && window.__schoolSettings.anthropicKey;
  if (!apiKey) return null;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content:
          'Translate the Khmer text inside this HTML driving-school lesson into natural, concise English. '
          + 'Keep every HTML tag, attribute and <img> element exactly as-is — translate only the human-readable text. '
          + 'Return ONLY the resulting HTML, nothing else.\n\n' + text }],
      }),
    });
    if (!resp.ok) return '';
    const data = await resp.json();
    return ((data.content && data.content[0] && data.content[0].text) || '').trim();
  } catch (e) { return ''; }
}

const useAutoTranslate = () => {
  const { tr, toast } = useAppActions();
  const [busy, setBusy] = React.useState(0);
  const warned = React.useRef(false);
  const translate = async (kmText, currentEn, fill) => {
    const km = (kmText || '').trim();
    if (!km || (currentEn || '').trim()) return;
    if (!(window.__schoolSettings && window.__schoolSettings.anthropicKey)) {
      if (!warned.current) {
        warned.current = true;
        toast(tr('បញ្ចូល Anthropic API Key ក្នុង Settings → AI ដើម្បីបកប្រែស្វ័យប្រវត្តិ',
                 'Add an Anthropic API key in Settings → AI to auto-translate'), 'warn');
      }
      return;
    }
    setBusy(n => n + 1);
    const en = await aiTranslateKmToEn(km);
    setBusy(n => n - 1);
    if (en) fill(en);
  };
  return { busy: busy > 0, translate };
};

const TrBadge = ({ show }) => show ? (
  <span style={{fontSize:10,color:'var(--accent)',display:'inline-flex',alignItems:'center',gap:4,marginTop:4}}>
    <span style={{width:8,height:8,border:'1.5px solid var(--accent)',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'_sp .7s linear infinite'}}/>
    ✦ កំពុង​បក​ប្រែ…
  </span>
) : null;

// id helpers — generate next sequential id within a list
const nextLessonContentId = (list, prefix) => {
  const used = new Set(list.map(it => it.id));
  for (let i = 1; i < 999; i++) {
    const cand = `${prefix}-${String(i).padStart(2,'0')}`;
    if (!used.has(cand)) return cand;
  }
  return `${prefix}-${Date.now()}`;
};

// ── small form helpers ────────────────────────────────────────────────────
const AlField = ({ km, children, full = true }) => (
  <div style={{display:'flex',flexDirection:'column',gap:6,gridColumn:full?'1 / -1':'auto'}}>
    <label>
      <span style={{fontSize:13,fontWeight:600}}>{km}</span>
    </label>
    {children}
  </div>
);

const AlInput = ({ onFocus, onBlur, ...p }) => (
  <input {...p} style={{
    height:42, padding:'0 12px',
    border:'1px solid var(--border)', borderRadius:8,
    background:'var(--surface)', color:'var(--ink)',
    fontFamily:'var(--font-km),var(--font-en),sans-serif', fontSize:14,
    outline:'none',transition:'border-color .12s',
    ...(p.style||{}),
  }}
    onFocus={e=>{e.target.style.borderColor='var(--accent)'; onFocus&&onFocus(e);}}
    onBlur={e=>{e.target.style.borderColor='var(--border)'; onBlur&&onBlur(e);}}
  />
);

const AlTextarea = React.forwardRef(({ onFocus, onBlur, ...p }, ref) => (
  <textarea ref={ref} {...p} style={{
    padding:'10px 12px', minHeight:140,
    border:'1px solid var(--border)', borderRadius:8,
    background:'var(--surface)', color:'var(--ink)',
    fontFamily:'var(--font-km),var(--font-en),sans-serif', fontSize:14,
    lineHeight:1.55, outline:'none', resize:'vertical',
    transition:'border-color .12s', ...(p.style||{}),
  }}
    onFocus={e=>{e.target.style.borderColor='var(--accent)'; onFocus&&onFocus(e);}}
    onBlur={e=>{e.target.style.borderColor='var(--border)'; onBlur&&onBlur(e);}}
  />
));

// ── Rich-text (WYSIWYG) body editor ───────────────────────────────────────
// Stores HTML. Supports bold / italic / underline / colour / bullet list /
// font size via document.execCommand. isLessonHtml + lessonMdToHtml live in
// screens-lessons.jsx (loaded first) and are shared here.
(() => {
  if (typeof document === 'undefined' || document.getElementById('al-rte-style')) return;
  const st = document.createElement('style'); st.id = 'al-rte-style';
  st.textContent = '.al-rte:empty:before{content:attr(data-ph);color:var(--ink-3)}.al-rte:focus{outline:none}.al-rte img{max-width:100%;border-radius:8px;margin:2px 4px;display:inline-block;vertical-align:middle;cursor:zoom-in}.al-rte img:hover{outline:2px solid var(--accent);outline-offset:1px}.al-rte ul,.al-rte ol{margin:6px 0;padding-left:24px}.al-rte li{margin:2px 0}.al-rte h1{font-size:22px;font-weight:700;margin:8px 0 4px}.al-rte h2{font-size:18px;font-weight:700;margin:7px 0 4px}.al-rte h3{font-size:16px;font-weight:600;margin:6px 0 3px}.al-rte blockquote{border-left:3px solid var(--accent);margin:6px 0;padding:2px 12px;color:var(--ink-2)}.al-rte a{color:var(--accent);text-decoration:underline}.al-rte hr{border:none;border-top:1px solid var(--border);margin:10px 0}';
  document.head.appendChild(st);
})();

const RTE_COLORS = ['#111827','#e11d48','#2563eb','#16a34a','#d97706','#7c3aed','#0891b2'];
const RTE_HILITES = ['#fef08a','#bbf7d0','#bfdbfe','#fbcfe8','#fed7aa'];
const RTE_SIZES = [{km:'តូច',v:'2'},{km:'ធម្មតា',v:'3'},{km:'ធំ',v:'4'},{km:'ធំ​បំផុត',v:'6'}];
const RTE_BLOCKS = [{km:'អត្ថបទ​ធម្មតា',v:'<p>'},{km:'ចំណងជើង ១',v:'<h1>'},{km:'ចំណងជើង ២',v:'<h2>'},{km:'ចំណងជើង ៣',v:'<h3>'},{km:'សម្រង់',v:'<blockquote>'}];

const RteBtn = ({ onClick, title, children, w }) => (
  <button type="button" title={title} onMouseDown={e=>e.preventDefault()} onClick={onClick} style={{
    minWidth:w||30, height:30, padding:'0 7px', borderRadius:6, cursor:'pointer',
    border:'1px solid var(--border)', background:'var(--surface)', color:'var(--ink)',
    fontSize:14, display:'inline-flex', alignItems:'center', justifyContent:'center',
  }}>{children}</button>
);
const RteSep = () => <span style={{width:1,height:20,background:'var(--border)',margin:'0 2px',flexShrink:0}}/>;

const RichBodyEditor = React.forwardRef(({ langKey, initialHtml, onChange, onBlur, placeholder }, ref) => {
  const edRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const savedRange = React.useRef(null);
  React.useImperativeHandle(ref, () => edRef.current);
  // Load HTML into the (uncontrolled) editor on mount and whenever the language
  // switches — never on every keystroke, so the caret doesn't jump.
  React.useEffect(() => {
    if (edRef.current && edRef.current.innerHTML !== (initialHtml || '')) edRef.current.innerHTML = initialHtml || '';
  }, [langKey]);
  const fire = () => { if (edRef.current) onChange(edRef.current.innerHTML); };

  // Remember the caret/selection so toolbar actions (and the image picker) apply
  // to the right place even after a dropdown/picker briefly steals focus.
  const saveSel = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        if (edRef.current && edRef.current.contains(r.commonAncestorContainer)) savedRange.current = r.cloneRange();
      }
    } catch(e) {}
  };
  const restoreSel = () => {
    try {
      const r = savedRange.current; const el = edRef.current;
      if (r && el && el.contains(r.commonAncestorContainer)) {
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      }
    } catch(e) {}
  };
  const exec = (cmd, val) => {
    if (edRef.current) edRef.current.focus();
    restoreSel();
    try { document.execCommand('styleWithCSS', false, true); } catch(e) {}
    try { document.execCommand(cmd, false, val); } catch(e) {}
    fire();
  };
  const setBlock = (tag) => exec('formatBlock', tag);
  const addLink = () => {
    const url = (typeof window !== 'undefined' && window.prompt) ? window.prompt('បញ្ចូល​តំណ · Enter link URL', 'https://') : '';
    if (url && url.trim()) exec('createLink', url.trim());
  };

  // Insert the image inline at the saved caret (Word-style: it flows with text).
  const insertImageAtCaret = (dataUrl) => {
    const el = edRef.current; if (!el) return;
    el.focus();
    const sel = window.getSelection();
    let range = savedRange.current;
    if (range && el.contains(range.commonAncestorContainer)) { sel.removeAllRanges(); sel.addRange(range); }
    range = sel.rangeCount ? sel.getRangeAt(0) : null;
    const img = document.createElement('img');
    img.src = dataUrl;
    img.setAttribute('data-sz', 'm');
    img.style.width = '60%';
    if (range && el.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(img);
      // trailing space so the caret can continue typing right after the picture
      const space = document.createTextNode(' ');
      if (img.parentNode) img.parentNode.insertBefore(space, img.nextSibling);
      const after = document.createRange();
      after.setStartAfter(space); after.collapse(true);
      sel.removeAllRanges(); sel.addRange(after);
    } else {
      el.appendChild(img);
    }
    savedRange.current = null;
    fire();
  };

  const pickImage = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { const url = await compressImageFile(f); insertImageAtCaret(url); } catch(err) {}
  };

  // Click an embedded image to cycle its size: small ↔ medium ↔ full.
  const onEditorClick = (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG') {
      const cur = img.getAttribute('data-sz') || 'm';
      const next = cur === 's' ? 'm' : cur === 'm' ? 'l' : 's';
      img.setAttribute('data-sz', next);
      img.style.width = next === 's' ? '30%' : next === 'l' ? '100%' : '60%';
      fire();
    }
  };

  return (
    <div style={{border:'1px solid var(--border)',borderRadius:8,background:'var(--surface)',overflow:'hidden'}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={pickImage}/>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:'7px 8px',borderBottom:'1px solid var(--border)',background:'var(--surface-muted)',alignItems:'center'}}>
        {/* Undo / redo */}
        <RteBtn onClick={()=>exec('undo')} title="មិន​ធ្វើ​វិញ · Undo">↶</RteBtn>
        <RteBtn onClick={()=>exec('redo')} title="ធ្វើ​ឡើង​វិញ · Redo">↷</RteBtn>
        <RteSep/>
        {/* Paragraph / heading style */}
        <select title="រចនាបថ · Paragraph style" onMouseDown={saveSel}
          onChange={e=>{ if(e.target.value) setBlock(e.target.value); e.target.selectedIndex=0; }}
          style={{height:30,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',fontSize:12,padding:'0 6px',cursor:'pointer'}}>
          <option value="">រចនាបថ</option>
          {RTE_BLOCKS.map(b=><option key={b.v} value={b.v}>{b.km}</option>)}
        </select>
        <select title="ទំហំ​អក្សរ · Font size" onMouseDown={saveSel}
          onChange={e=>{ if(e.target.value) exec('fontSize', e.target.value); e.target.selectedIndex=0; }}
          style={{height:30,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',fontSize:12,padding:'0 6px',cursor:'pointer'}}>
          <option value="">ទំហំ</option>
          {RTE_SIZES.map(s=><option key={s.v} value={s.v}>{s.km}</option>)}
        </select>
        <RteSep/>
        {/* Character formatting */}
        <RteBtn onClick={()=>exec('bold')}          title="ដិត · Bold"><b>B</b></RteBtn>
        <RteBtn onClick={()=>exec('italic')}        title="ទ្រេត · Italic"><i>I</i></RteBtn>
        <RteBtn onClick={()=>exec('underline')}     title="គូស​បន្ទាត់ · Underline"><span style={{textDecoration:'underline'}}>U</span></RteBtn>
        <RteBtn onClick={()=>exec('strikeThrough')} title="គូស​ឆូត · Strikethrough"><span style={{textDecoration:'line-through'}}>S</span></RteBtn>
        <RteSep/>
        {/* Text colour */}
        {RTE_COLORS.map(c=>(
          <button key={c} type="button" title="ពណ៌​អក្សរ · Text colour" onMouseDown={e=>e.preventDefault()} onClick={()=>exec('foreColor', c)}
            style={{width:18,height:18,borderRadius:'50%',background:c,border:'1px solid rgba(0,0,0,.2)',cursor:'pointer',padding:0,flexShrink:0}}/>
        ))}
        {/* Highlight */}
        {RTE_HILITES.map(c=>(
          <button key={c} type="button" title="​ពណ៌​ផ្ទៃ​ខាងក្រោយ · Highlight" onMouseDown={e=>e.preventDefault()} onClick={()=>exec('hiliteColor', c)}
            style={{width:18,height:18,borderRadius:4,background:c,border:'1px solid rgba(0,0,0,.2)',cursor:'pointer',padding:0,flexShrink:0}}/>
        ))}
        <RteBtn onClick={()=>exec('hiliteColor','transparent')} title="ដក​ពណ៌​ផ្ទៃ · No highlight" w={26}>⌫</RteBtn>
        <RteSep/>
        {/* Alignment */}
        <RteBtn onClick={()=>exec('justifyLeft')}   title="តម្រឹម​ឆ្វេង · Align left">≡</RteBtn>
        <RteBtn onClick={()=>exec('justifyCenter')} title="តម្រឹម​កណ្ដាល · Align centre">☰</RteBtn>
        <RteBtn onClick={()=>exec('justifyRight')}  title="តម្រឹម​ស្ដាំ · Align right">≣</RteBtn>
        <RteBtn onClick={()=>exec('justifyFull')}   title="តម្រឹម​សងខាង · Justify">▤</RteBtn>
        <RteSep/>
        {/* Lists / indent */}
        <RteBtn onClick={()=>exec('insertUnorderedList')} title="ចំណុច​ត្រួយ · Bullet list">•&nbsp;≡</RteBtn>
        <RteBtn onClick={()=>exec('insertOrderedList')}   title="លេខ​រៀង · Numbered list">1.</RteBtn>
        <RteBtn onClick={()=>exec('outdent')} title="បន្ថយ​ការ​ចូល​បន្ទាត់ · Outdent">⇤</RteBtn>
        <RteBtn onClick={()=>exec('indent')}  title="ចូល​បន្ទាត់ · Indent">⇥</RteBtn>
        <RteSep/>
        {/* Link / divider / clear */}
        <RteBtn onClick={addLink} title="តំណ · Link">🔗</RteBtn>
        <RteBtn onClick={()=>exec('insertHorizontalRule')} title="បន្ទាត់​ខណ្ឌ · Divider">―</RteBtn>
        <RteBtn onClick={()=>exec('removeFormat')} title="សម្អាត​ទ្រង់ទ្រាយ · Clear formatting" w={26}>✕</RteBtn>
        <RteSep/>
        {/* Image */}
        <button type="button" title="ដាក់​រូប · Insert image at cursor"
          onMouseDown={e=>{ e.preventDefault(); saveSel(); }}
          onClick={()=>fileRef.current && fileRef.current.click()}
          style={{height:30,padding:'0 10px',borderRadius:6,cursor:'pointer',border:'1px solid var(--border)',
            background:'var(--surface)',color:'var(--ink)',fontSize:12,display:'inline-flex',alignItems:'center',gap:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5L8 19"/>
          </svg>
          រូប
        </button>
      </div>
      <div ref={edRef} className="al-rte" contentEditable suppressContentEditableWarning data-ph={placeholder||''}
        onInput={fire} onBlur={()=>{ saveSel(); onBlur && onBlur(); }} onKeyUp={saveSel} onMouseUp={saveSel} onClick={onEditorClick}
        style={{minHeight:320,maxHeight:'56vh',overflowY:'auto',padding:'12px 14px',fontSize:15,lineHeight:1.8,
          color:'var(--ink)',fontFamily:'var(--font-km),var(--font-en),sans-serif'}}/>
      <div style={{padding:'6px 12px',fontSize:11,color:'var(--ink-3)',borderTop:'1px solid var(--border)',background:'var(--surface-muted)'}}>
        🖼 ដាក់​ Cursor នៅ​កន្លែង​ដែល​ចង់​បាន រួច​ចុច​ប៊ូតុង «រូប» · ចុច​លើ​រូប​ដើម្បី​ប្ដូរ​ទំហំ (តូច / មធ្យម / ពេញ)
      </div>
    </div>
  );
});

// ── Image helpers ─────────────────────────────────────────────────────────
// Resize a chosen image file down to maxDim px on the longest side and return
// a data URL. Keeps PNG transparency, otherwise uses JPEG for smaller payload.
const compressImageFile = (file, maxDim = 900, quality = 0.82) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Not an image file'));
      return;
    }
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > maxDim) {
          height = Math.round(height * (maxDim / width)); width = maxDim;
        } else if (height > width && height > maxDim) {
          width = Math.round(width * (maxDim / height)); height = maxDim;
        }
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const usePng = file.type === 'image/png';
        resolve(c.toDataURL(usePng ? 'image/png' : 'image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    fr.readAsDataURL(file);
  });

// Insert `text` at the textarea's current cursor position, then update state
// via setter. Preserves focus and re-positions cursor after the insertion.
const insertAtCursor = (refOrEl, setter, current, text) => {
  const el = refOrEl?.current || refOrEl;
  if (!el || typeof el.selectionStart !== 'number') {
    setter((current || '') + text);
    return;
  }
  const start = el.selectionStart;
  const end   = el.selectionEnd;
  const next  = current.slice(0, start) + text + current.slice(end);
  setter(next);
  requestAnimationFrame(() => {
    try {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    } catch(e) {}
  });
};

// Reusable picker — wraps a hidden <input type="file"> and a styled button
const ImagePickerButton = ({ onPick, label, accept = 'image/*', size = 'sm' }) => {
  const inputRef = React.useRef(null);
  const { toast, tr } = useAppActions();
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} style={{display:'none'}}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const dataUrl = await compressImageFile(f);
            onPick(dataUrl, f);
          } catch (err) {
            toast?.(tr('បន្ទុក​រូប​មិន​បាន','Image upload failed'), 'warn');
          } finally {
            e.target.value = '';
          }
        }}
      />
      <Btn kind="ghost" size={size} onClick={()=>inputRef.current?.click()}
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <circle cx="9" cy="11" r="2"/>
            <path d="M21 17l-5-5L8 19"/>
          </svg>
        }>
        {label}
      </Btn>
    </>
  );
};

// ── Shared rich-text controller ───────────────────────────────────────────
// One toolbar drives several contentEditable regions (the title AND the body).
// Whichever field was focused last is the "active" one; toolbar commands apply
// there via document.execCommand, with its caret/selection saved + restored.
const useSharedRte = () => {
  const active = React.useRef(null);        // { el, fire }
  const savedRange = React.useRef(null);
  const saveSel = () => {
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        const el = active.current && active.current.el;
        if (el && el.contains(r.commonAncestorContainer)) savedRange.current = r.cloneRange();
      }
    } catch (e) {}
  };
  const restoreSel = () => {
    try {
      const r = savedRange.current, el = active.current && active.current.el;
      if (r && el && el.contains(r.commonAncestorContainer)) {
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      }
    } catch (e) {}
  };
  const setActive = (entry) => { active.current = entry; };
  const exec = (cmd, val) => {
    const el = active.current && active.current.el; if (!el) return;
    el.focus(); restoreSel();
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    try { document.execCommand(cmd, false, val); } catch (e) {}
    if (active.current && active.current.fire) active.current.fire();
    saveSel();
  };
  const setBlock = (tag) => exec('formatBlock', tag);
  const addLink = () => {
    const url = (typeof window !== 'undefined' && window.prompt) ? window.prompt('បញ្ចូល​តំណ · Enter link URL', 'https://') : '';
    if (url && url.trim()) exec('createLink', url.trim());
  };
  const insertImage = (dataUrl) => {
    const el = active.current && active.current.el; if (!el) return;
    el.focus();
    const sel = window.getSelection();
    let range = savedRange.current;
    if (range && el.contains(range.commonAncestorContainer)) { sel.removeAllRanges(); sel.addRange(range); }
    range = sel.rangeCount ? sel.getRangeAt(0) : null;
    const img = document.createElement('img');
    img.src = dataUrl; img.setAttribute('data-sz', 'm'); img.style.width = '60%';
    if (range && el.contains(range.commonAncestorContainer)) {
      range.deleteContents(); range.insertNode(img);
      const space = document.createTextNode(' ');
      if (img.parentNode) img.parentNode.insertBefore(space, img.nextSibling);
      const after = document.createRange(); after.setStartAfter(space); after.collapse(true);
      sel.removeAllRanges(); sel.addRange(after);
    } else { el.appendChild(img); }
    savedRange.current = null;
    if (active.current && active.current.fire) active.current.fire();
  };
  return { active, savedRange, saveSel, restoreSel, setActive, exec, setBlock, addLink, insertImage };
};

// The shared toolbar UI. `sticky` pins it to the top of the scroll container.
const RteToolbar = ({ rte, sticky = true }) => {
  const fileRef = React.useRef(null);
  const pickImage = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { const url = await compressImageFile(f); rte.insertImage(url); } catch (err) {}
  };
  return (
    <div style={{position: sticky ? 'sticky' : 'static', top:0, zIndex:5,
      display:'flex',flexWrap:'wrap',gap:4,padding:'7px 8px',borderBottom:'1px solid var(--border)',background:'var(--surface-muted)',alignItems:'center'}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={pickImage}/>
      <RteBtn onClick={()=>rte.exec('undo')} title="មិន​ធ្វើ​វិញ · Undo">↶</RteBtn>
      <RteBtn onClick={()=>rte.exec('redo')} title="ធ្វើ​ឡើង​វិញ · Redo">↷</RteBtn>
      <RteSep/>
      <select title="រចនាបថ · Paragraph style" onMouseDown={rte.saveSel}
        onChange={e=>{ if(e.target.value) rte.setBlock(e.target.value); e.target.selectedIndex=0; }}
        style={{height:30,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',fontSize:12,padding:'0 6px',cursor:'pointer'}}>
        <option value="">រចនាបថ</option>
        {RTE_BLOCKS.map(b=><option key={b.v} value={b.v}>{b.km}</option>)}
      </select>
      <select title="ទំហំ​អក្សរ · Font size" onMouseDown={rte.saveSel}
        onChange={e=>{ if(e.target.value) rte.exec('fontSize', e.target.value); e.target.selectedIndex=0; }}
        style={{height:30,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink)',fontSize:12,padding:'0 6px',cursor:'pointer'}}>
        <option value="">ទំហំ</option>
        {RTE_SIZES.map(s=><option key={s.v} value={s.v}>{s.km}</option>)}
      </select>
      <RteSep/>
      <RteBtn onClick={()=>rte.exec('bold')}          title="ដិត · Bold"><b>B</b></RteBtn>
      <RteBtn onClick={()=>rte.exec('italic')}        title="ទ្រេត · Italic"><i>I</i></RteBtn>
      <RteBtn onClick={()=>rte.exec('underline')}     title="គូស​បន្ទាត់ · Underline"><span style={{textDecoration:'underline'}}>U</span></RteBtn>
      <RteBtn onClick={()=>rte.exec('strikeThrough')} title="គូស​ឆូត · Strikethrough"><span style={{textDecoration:'line-through'}}>S</span></RteBtn>
      <RteSep/>
      {RTE_COLORS.map(c=>(
        <button key={c} type="button" title="ពណ៌​អក្សរ · Text colour" onMouseDown={e=>e.preventDefault()} onClick={()=>rte.exec('foreColor', c)}
          style={{width:18,height:18,borderRadius:'50%',background:c,border:'1px solid rgba(0,0,0,.2)',cursor:'pointer',padding:0,flexShrink:0}}/>
      ))}
      {RTE_HILITES.map(c=>(
        <button key={c} type="button" title="​ពណ៌​ផ្ទៃ​ខាងក្រោយ · Highlight" onMouseDown={e=>e.preventDefault()} onClick={()=>rte.exec('hiliteColor', c)}
          style={{width:18,height:18,borderRadius:4,background:c,border:'1px solid rgba(0,0,0,.2)',cursor:'pointer',padding:0,flexShrink:0}}/>
      ))}
      <RteBtn onClick={()=>rte.exec('hiliteColor','transparent')} title="ដក​ពណ៌​ផ្ទៃ · No highlight" w={26}>⌫</RteBtn>
      <RteSep/>
      <RteBtn onClick={()=>rte.exec('justifyLeft')}   title="តម្រឹម​ឆ្វេង · Align left">≡</RteBtn>
      <RteBtn onClick={()=>rte.exec('justifyCenter')} title="តម្រឹម​កណ្ដាល · Align centre">☰</RteBtn>
      <RteBtn onClick={()=>rte.exec('justifyRight')}  title="តម្រឹម​ស្ដាំ · Align right">≣</RteBtn>
      <RteBtn onClick={()=>rte.exec('justifyFull')}   title="តម្រឹម​សងខាង · Justify">▤</RteBtn>
      <RteSep/>
      <RteBtn onClick={()=>rte.exec('insertUnorderedList')} title="ចំណុច​ត្រួយ · Bullet list">•&nbsp;≡</RteBtn>
      <RteBtn onClick={()=>rte.exec('insertOrderedList')}   title="លេខ​រៀង · Numbered list">1.</RteBtn>
      <RteBtn onClick={()=>rte.exec('outdent')} title="បន្ថយ​ការ​ចូល​បន្ទាត់ · Outdent">⇤</RteBtn>
      <RteBtn onClick={()=>rte.exec('indent')}  title="ចូល​បន្ទាត់ · Indent">⇥</RteBtn>
      <RteSep/>
      <RteBtn onClick={rte.addLink} title="តំណ · Link">🔗</RteBtn>
      <RteBtn onClick={()=>rte.exec('insertHorizontalRule')} title="បន្ទាត់​ខណ្ឌ · Divider">―</RteBtn>
      <RteBtn onClick={()=>rte.exec('removeFormat')} title="សម្អាត​ទ្រង់ទ្រាយ · Clear formatting" w={26}>✕</RteBtn>
      <RteSep/>
      <button type="button" title="ដាក់​រូប · Insert image at cursor"
        onMouseDown={e=>{ e.preventDefault(); rte.saveSel(); }}
        onClick={()=>fileRef.current && fileRef.current.click()}
        style={{height:30,padding:'0 10px',borderRadius:6,cursor:'pointer',border:'1px solid var(--border)',
          background:'var(--surface)',color:'var(--ink)',fontSize:12,display:'inline-flex',alignItems:'center',gap:6}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5L8 19"/>
        </svg>
        រូប
      </button>
    </div>
  );
};

// A single contentEditable region wired to a shared controller. `single` keeps
// it to one line (used for the title); otherwise it's a multi-line body.
const RteField = React.forwardRef(({ rte, langKey, initialHtml, onChange, onBlur, placeholder, single=false, minHeight=280, maxHeight, fontSize=15, fontWeight=400 }, ref) => {
  const edRef = React.useRef(null);
  React.useImperativeHandle(ref, () => edRef.current);
  React.useEffect(() => {
    if (edRef.current && edRef.current.innerHTML !== (initialHtml || '')) edRef.current.innerHTML = initialHtml || '';
  }, [langKey]);
  const fire = () => { if (edRef.current) onChange(edRef.current.innerHTML); };
  const entry = React.useRef({ el:null, fire });
  entry.current.fire = fire;
  const activate = () => { entry.current.el = edRef.current; rte.setActive(entry.current); rte.saveSel(); };
  const onImgClick = (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG') {
      const cur = img.getAttribute('data-sz') || 'm';
      const next = cur === 's' ? 'm' : cur === 'm' ? 'l' : 's';
      img.setAttribute('data-sz', next);
      img.style.width = next === 's' ? '30%' : next === 'l' ? '100%' : '60%';
      fire();
    }
  };
  return (
    <div ref={edRef} className="al-rte" contentEditable suppressContentEditableWarning data-ph={placeholder||''}
      onFocus={activate}
      onInput={()=>{ fire(); rte.saveSel(); }}
      onKeyUp={activate} onMouseUp={activate}
      onKeyDown={single ? (e)=>{ if (e.key==='Enter') e.preventDefault(); } : undefined}
      onClick={onImgClick}
      onBlur={()=>{ rte.saveSel(); onBlur && onBlur(); }}
      style={{minHeight:single?undefined:minHeight, maxHeight, overflowY: maxHeight?'auto':(single?'hidden':'visible'),
        whiteSpace: single?'pre-wrap':'normal',
        padding:single?'9px 12px':'12px 14px', fontSize, fontWeight, lineHeight:single?1.3:1.8,
        color:'var(--ink)', fontFamily:'var(--font-km),var(--font-en),sans-serif',
        border:'1px solid var(--border)', borderRadius:8, background:'var(--surface)', outline:'none'}}/>
  );
});

// ── Text-lesson form ──────────────────────────────────────────────────────
const TextLessonForm = ({ initial, crumb, headerTitle, onSave, onCancel }) => {
  const { tr, lang } = useAppActions();
  const bp = useBreakpoint();
  const { busy: trBusy, translate } = useAutoTranslate();
  const rte = useSharedRte();
  // Titles may carry light inline formatting now — stored as HTML like the body.
  const [km,    setKm]    = React.useState(initial?.km    || '');
  const [en,    setEn]    = React.useState(initial?.en    || '');
  // Bodies are stored as rich HTML. Legacy markdown bodies are converted on
  // open so they show formatted in the WYSIWYG editor (and migrate on save).
  const [bodyKm, setBodyKm] = React.useState(() => { const b = initial?.body_km || ''; return isLessonHtml(b) ? b : lessonMdToHtml(b, initial?.images); });
  const [bodyEn, setBodyEn] = React.useState(() => { const b = initial?.body_en || ''; return isLessonHtml(b) ? b : lessonMdToHtml(b, initial?.images); });
  const [saving, setSaving] = React.useState(false);
  // Instructor teaching guide (指導内容/指導事項/留意事項) — editable, ships with the
  // lesson. Instructor-facing; the toggle lets students see it too.
  const [guideStudent, setGuideStudent] = React.useState(!!initial?.guideStudent);
  const arr = (v) => Array.isArray(v) ? [...v] : [];
  const [teachKm,    setTeachKm]    = React.useState(arr(initial?.teach_km));
  const [teachEn,    setTeachEn]    = React.useState(arr(initial?.teach_en));
  const [pointsKm,   setPointsKm]   = React.useState(arr(initial?.points_km));
  const [pointsEn,   setPointsEn]   = React.useState(arr(initial?.points_en));
  const [cautionsKm, setCautionsKm] = React.useState(arr(initial?.cautions_km));
  const [cautionsEn, setCautionsEn] = React.useState(arr(initial?.cautions_en));
  const [guideLoc,   setGuideLoc]   = React.useState(initial?.guideLoc || '');

  // Everything is authored in Khmer; when the whole UI is in English we edit /
  // show the English variant, auto-translated from Khmer (needs an API key).
  const enMode = lang === 'en';
  const curTitle    = enMode ? en : km;
  const setCurTitle = enMode ? setEn : setKm;
  const curBody     = enMode ? bodyEn : bodyKm;
  const setCurBody  = enMode ? setBodyEn : setBodyKm;
  const langKey     = enMode ? 'en' : 'km';
  const plain = (s) => (window.lessonPlainText ? window.lessonPlainText(s) : String(s||'').replace(/<[^>]+>/g,'')).trim();

  // Estimate reading time from the Khmer body length (~500 chars ≈ 1 min).
  const estMins = () => Math.max(1, Math.round(plain(bodyKm).replace(/\s+/g,'').length / 500)) || 1;

  const submit = async () => {
    if (!plain(km) && !plain(en)) return;
    setSaving(true);
    let outEn = en, outBodyEn = bodyEn;
    // When the English variants are empty, translate them from Khmer so English
    // viewers see real English (falls back to Khmer if no API key / failure).
    try {
      if (!plain(en) && plain(km)) { const t = await aiTranslateKmToEn(plain(km)); if (t) outEn = t; }
      if (!plain(bodyEn) && plain(bodyKm)) { const t = await aiTranslateHtmlKmToEn(bodyKm); if (t) outBodyEn = t; }
    } catch (e) {}
    setSaving(false);
    // Clean the guide arrays; fall back EN→KH so English viewers still see content.
    const clean = (a) => a.map(x => (x||'').trim()).filter(Boolean);
    const orKm = (en2, km2) => { const e = clean(en2); return e.length ? e : clean(km2); };
    onSave({
      ...(initial || {}),
      km: (km||'').trim(), en: (outEn||'').trim(),
      mins: estMins(),
      body_km: bodyKm,
      body_en: plain(outBodyEn) ? outBodyEn : bodyKm,   // fall back to KH so EN viewers still see content
      guideStudent,   // instructor's "let students see the teaching guide" choice
      teach_km: clean(teachKm),       teach_en: orKm(teachEn, teachKm),
      points_km: clean(pointsKm),     points_en: orKm(pointsEn, pointsKm),
      cautions_km: clean(cautionsKm), cautions_en: orKm(cautionsEn, cautionsKm),
      guideLoc: (guideLoc||'').trim(),
      images: {},   // images are embedded inline in the HTML body now
    });
  };

  // Editable teaching-guide sections (language-aware, like the title/body).
  const gSections = [
    { km:'មាតិកាបង្រៀន',            jp:'指導内容', c:'var(--accent)', ph:'ឧ. វិធីឡើងជិះ · ចេញដំណើរ', items: enMode?teachEn:teachKm,       set: enMode?setTeachEn:setTeachKm },
    { km:'ចំណុចបង្រៀន',             jp:'指導事項', c:'#6246C9',       ph:'ឧ. ពិនិត្យជុំវិញរថយន្ត',   items: enMode?pointsEn:pointsKm,     set: enMode?setPointsEn:setPointsKm },
    { km:'ចំណុចត្រូវប្រុងប្រយ័ត្ន', jp:'留意事項', c:'#C98A0A',       ph:'ឧ. ធ្វើឲ្យសិស្សយល់ថា…',     items: enMode?cautionsEn:cautionsKm, set: enMode?setCautionsEn:setCautionsKm },
  ];

  const fieldLabel = { fontSize:11, fontWeight:600, color:'var(--ink-3)', letterSpacing:'.02em', margin:'0 0 6px' };

  return (
    <div style={{display:'flex',flexDirection:'column',maxHeight: bp.mobile ? '86vh' : '84vh'}}>
      {/* Sticky header: breadcrumb + title + the shared formatting toolbar */}
      <div style={{flexShrink:0,position:'sticky',top:0,zIndex:6,background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
        <div style={{padding:bp.mobile?'14px 16px 10px':'18px 24px 12px'}}>
          {crumb && <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{crumb}</div>}
          <div style={{fontSize:bp.mobile?17:20,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em',marginTop:4}}>{headerTitle}</div>
        </div>
        <RteToolbar rte={rte} sticky={false}/>
      </div>

      {/* Scrollable middle: title (rich) + content (rich) */}
      <div style={{flex:1,minHeight:0,overflowY:'auto',padding:bp.mobile?'14px 16px 18px':'16px 24px 20px',display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <div style={fieldLabel}>{enMode ? tr('ចំណងជើង · អង់គ្លេស','Title · English') : tr('ចំណងជើង · ខ្មែរ','Title · Khmer')}</div>
          <RteField rte={rte} langKey={langKey} initialHtml={curTitle} onChange={setCurTitle}
            single fontSize={17} fontWeight={700}
            placeholder={enMode ? 'e.g. Road Traffic Law' : 'ឧ. ច្បាប់ចរាចរណ៍'}/>
          {saving && <TrBadge show={true}/>}
        </div>
        <div>
          <div style={fieldLabel}>{enMode ? tr('ខ្លឹមសារ · អង់គ្លេស','Content · English') : tr('ខ្លឹមសារ · ខ្មែរ','Content · Khmer')}</div>
          <RteField rte={rte} langKey={langKey} initialHtml={curBody} onChange={setCurBody}
            minHeight={300}
            placeholder={enMode ? 'Lesson content…' : 'ខ្លឹមសារ​មេរៀន…'}/>
          <div style={{marginTop:6,fontSize:11,color:'var(--ink-3)'}}>
            🖼 {tr('ដាក់ Cursor ក្នុងចំណងជើង ឬ ខ្លឹមសារ រួចប្រើ Tool ខាងលើ · ចុចលើរូបដើម្បីប្ដូរទំហំ','Put the cursor in the title or content, then use the toolbar above · click an image to resize')}
          </div>
        </div>

        {/* Instructor teaching guide — EDITABLE + student-visibility toggle.
            flexShrink:0 — this box uses overflow:hidden (rounded corners), which
            makes its flex min-height resolve to 0; without this the flex column
            shrinks it away and its content overflows unreachably. */}
        <div style={{flexShrink:0,border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 13px',background:'var(--surface-muted)',borderBottom:'1px solid var(--border)'}}>
            <Icon name="book" size={14}/>
            <span style={{fontSize:13,fontWeight:700}}>{tr('ការណែនាំបង្រៀន','Teaching guide')}</span>
            <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>· {tr('សម្រាប់គ្រូ','Instructor')}</span>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontSize:11}}>📍</span>
              <input value={guideLoc} onChange={e=>setGuideLoc(e.target.value)} placeholder={tr('ទីតាំង','Location')}
                style={{width:90,fontSize:11,padding:'3px 8px',border:'1px solid var(--border)',borderRadius:99,background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit',boxSizing:'border-box'}}/>
            </div>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:9,padding:'9px 13px',borderBottom:'1px solid var(--border)',cursor:'pointer',fontSize:12.5}}>
            <input type="checkbox" checked={guideStudent} onChange={()=>setGuideStudent(v=>!v)} style={{width:16,height:16,accentColor:'var(--accent)',cursor:'pointer'}}/>
            <span style={{color:'var(--ink-2)'}}>{tr('អនុញ្ញាតឲ្យសិស្សមើលឃើញ','Allow students to view')}</span>
            <span style={{marginLeft:'auto',fontSize:10,color:'var(--ink-3)'}}>{guideStudent ? tr('សិស្សឃើញ','Visible') : tr('គ្រូតែប៉ុណ្ណោះ','Instructor only')}</span>
          </label>
          <div style={{padding:'12px 13px',display:'flex',flexDirection:'column',gap:14}}>
            {gSections.map((s,si)=>(
              <div key={si}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
                  <span style={{width:8,height:8,borderRadius:2,background:s.c,flexShrink:0}}/>
                  <span style={{fontSize:12.5,fontWeight:700,color:s.c}}>{s.km}</span>
                  <span style={{fontSize:9.5,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{s.jp}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {s.items.map((it,i)=>(
                    <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{color:s.c,flexShrink:0}}>•</span>
                      <input value={it} placeholder={s.ph}
                        onChange={e=>{ const n=[...s.items]; n[i]=e.target.value; s.set(n); }}
                        style={{flex:1,fontSize:13,padding:'6px 9px',border:'1px solid var(--border)',borderRadius:7,background:'var(--surface)',color:'var(--ink)',fontFamily:'inherit',boxSizing:'border-box'}}/>
                      <button onClick={()=>s.set(s.items.filter((_,j)=>j!==i))} title={tr('លុប','Remove')}
                        style={{flexShrink:0,width:26,height:26,borderRadius:7,border:'1px solid var(--border)',background:'var(--surface)',color:'var(--ink-3)',cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>
                    </div>
                  ))}
                  <button onClick={()=>s.set([...s.items,''])}
                    style={{alignSelf:'flex-start',fontSize:11.5,fontWeight:600,color:s.c,background:'transparent',border:'1px dashed var(--border-strong)',borderRadius:7,padding:'5px 11px',cursor:'pointer',fontFamily:'inherit'}}>
                    + {tr('បន្ថែមចំណុច','Add item')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{flexShrink:0,position:'sticky',bottom:0,zIndex:6,background:'var(--surface)',borderTop:'1px solid var(--border)',padding:bp.mobile?'12px 16px':'14px 24px',display:'flex',justifyContent:'flex-end',gap:8}}>
        <Btn kind="ghost"   size="md" onClick={onCancel} style={saving?{opacity:.5,pointerEvents:'none'}:{}}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="md" onClick={submit} style={saving?{opacity:.6,pointerEvents:'none'}:{}}>
          {saving ? tr('កំពុង​រក្សាទុក…','Saving…') : (initial ? tr('រក្សាទុក','Save') : tr('បន្ថែម','Add lesson'))}
        </Btn>
      </div>
    </div>
  );
};

// ── Image-preview strip — shows thumbnails for all images currently embedded
//    in a markdown body; click × on one to remove it from the body text.
const BODY_IMG_RE_G = /!\[[^\]]*\]\(([^)]+)\)/g;

const extractBodyImages = (body) => {
  if (!body) return [];
  const out = []; let m;
  const re = new RegExp(BODY_IMG_RE_G);
  while ((m = re.exec(body)) !== null) out.push(m[1]);
  return out;
};

const stripImageFromBody = (body, src) => {
  // Escape regex special chars in the src so we can use it inside a RegExp
  const esc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Strip the *first* matching image line, then collapse any blank-line buildup.
  return (body || '')
    .replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(${esc}\\)\\n?`), '\n')
    .replace(/\n{3,}/g, '\n\n');
};

const ImagePreviewStrip = ({ body, images = {}, onRemove }) => {
  const srcs = extractBodyImages(body);   // tokens (img:ID) or legacy data URLs
  if (!srcs.length) return null;
  const resolve = (s) => s.startsWith('img:') ? (images[s.slice(4)] || '') : s;
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
      {srcs.map((src, i) => (
        <div key={i} style={{
          position:'relative', width:48, height:36, borderRadius:6,
          background:`#000 url(${resolve(src)}) center/cover no-repeat`,
          border:'1px solid var(--border)', flexShrink:0,
        }}>
          <button onClick={()=>onRemove(src)}
            title="Remove"
            style={{
              position:'absolute', top:-6, right:-6, width:18, height:18,
              border:0, borderRadius:999, cursor:'pointer',
              background:'var(--ink)', color:'#fff', fontSize:11, lineHeight:1,
              display:'flex',alignItems:'center',justifyContent:'center',padding:0,
            }}>×</button>
        </div>
      ))}
    </div>
  );
};

// ── Video-lesson form ─────────────────────────────────────────────────────
const VideoLessonForm = ({ initial, onSave, onCancel }) => {
  const { tr } = useAppActions();
  const bp = useBreakpoint();
  const { busy: trBusy, translate } = useAutoTranslate();
  const [km,   setKm]   = React.useState(initial?.km   || '');
  const [en,   setEn]   = React.useState(initial?.en   || '');
  const [ytId, setYtId] = React.useState(initial?.ytId || '');
  const [mins, setMins] = React.useState(Math.round((initial?.duration || 600) / 60));

  // Accept full YouTube URLs and extract the ID
  const cleanYtId = (raw) => {
    const v = (raw || '').trim();
    const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : v;
  };

  const id = cleanYtId(ytId);

  const submit = () => {
    if (!id || (!km.trim() && !en.trim())) return;
    onSave({
      ...(initial || {}),
      km: km.trim(), en: en.trim(),
      ytId: id,
      duration: (parseInt(mins) || 10) * 60,
    });
  };

  return (
    <div style={{padding:bp.mobile?'18px 16px 22px':'20px 28px 24px',display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1fr 1fr',gap:bp.mobile?12:16}}>
      <AlField km="ចំណងជើង · ខ្មែរ"   en="Title · Khmer" full={false}>
        <AlInput value={km} onChange={e=>setKm(e.target.value)} onBlur={()=>translate(km, en, v=>setEn(p=>(p||'').trim()?p:v))} placeholder="ឧ. ការចត Parallel"/>
      </AlField>
      <AlField km="ចំណងជើង · អង់គ្លេស" en="Title · English" full={false}>
        <TrBadge show={trBusy}/>
        <AlInput value={en} onChange={e=>setEn(e.target.value)} placeholder="e.g. Parallel Parking"/>
      </AlField>
      <AlField km="YouTube ID ឬ URL" en="YouTube ID or full URL">
        <AlInput value={ytId} onChange={e=>setYtId(e.target.value)} placeholder="oS_MbVJuLb0 ឬ https://youtu.be/oS_MbVJuLb0"/>
      </AlField>
      <AlField km="រយៈពេល (នាទី)" en="Duration (minutes)" full={false}>
        <AlInput type="number" min="1" max="180" value={mins} onChange={e=>setMins(e.target.value)} style={{width:120}}/>
      </AlField>
      <AlField km="មើល​មុន" en="Preview" full={false}>
        {id ? (
          <div style={{
            width:'100%',aspectRatio:'16/9',borderRadius:8,overflow:'hidden',
            background:`#000 url(https://i.ytimg.com/vi/${id}/hqdefault.jpg) center/cover no-repeat`,
            border:'1px solid var(--border)',position:'relative',
          }}>
            <div style={{
              position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
              background:'linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,.45) 100%)',
            }}>
              <div style={{width:44,height:44,borderRadius:999,background:'rgba(0,0,0,.7)',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width:'100%',aspectRatio:'16/9',borderRadius:8,
            background:'var(--surface-muted)',border:'1px dashed var(--border-strong)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:12,color:'var(--ink-3)',
          }}>{tr('វាយ YouTube ID ដើម្បីមើល','Enter a YouTube ID to preview')}</div>
        )}
      </AlField>
      <div style={{gridColumn:'1 / -1',display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
        <Btn kind="ghost"   size="md" onClick={onCancel}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="md" onClick={submit}>{initial ? tr('រក្សាទុក','Save') : tr('បន្ថែម','Add video')}</Btn>
      </div>
    </div>
  );
};

// ── Quiz form ─────────────────────────────────────────────────────────────
const blankQuestion = () => ({
  q_km:'', q_en:'',
  opts_km:['','','',''], opts_en:['','','',''],
  answer: 0,
});

const QuizForm = ({ initial, onSave, onCancel }) => {
  const { tr } = useAppActions();
  const bp = useBreakpoint();
  const { busy: trBusy, translate } = useAutoTranslate();
  const [km, setKm] = React.useState(initial?.km || '');
  const [en, setEn] = React.useState(initial?.en || '');
  const [formUrl, setFormUrl] = React.useState(initial?.formUrl || '');
  const [questions, setQuestions] = React.useState(
    initial?.questions ? JSON.parse(JSON.stringify(initial.questions)) : [blankQuestion()]
  );
  const useForm = !!formUrl.trim();   // a Google Form replaces the built-in questions

  const updateQ = (idx, patch) => {
    setQuestions(qs => qs.map((q,i) => i===idx ? {...q, ...patch} : q));
  };
  const updateOpt = (qIdx, optIdx, lang, val) => {
    setQuestions(qs => qs.map((q,i) => {
      if (i !== qIdx) return q;
      const key = lang === 'km' ? 'opts_km' : 'opts_en';
      const arr = [...q[key]]; arr[optIdx] = val;
      return { ...q, [key]: arr };
    }));
  };
  const fillQEn = (qIdx, v) => setQuestions(qs => qs.map((q,i) =>
    (i===qIdx && !(q.q_en||'').trim()) ? {...q, q_en:v} : q));
  const fillOptEn = (qIdx, optIdx, v) => setQuestions(qs => qs.map((q,i) => {
    if (i !== qIdx || (q.opts_en[optIdx]||'').trim()) return q;
    const arr = [...q.opts_en]; arr[optIdx] = v;
    return { ...q, opts_en: arr };
  }));

  const submit = () => {
    if (!km.trim() && !en.trim()) return;
    onSave({
      ...(initial || {}),
      km: km.trim(), en: en.trim(),
      formUrl: formUrl.trim(),
      // A Google Form replaces the built-in questions; keep any existing ones but
      // they aren't used while a form URL is set.
      questions: useForm ? [] : questions.map(q => ({
        ...q,
        opts_km: q.opts_km.map(o => o || ''),
        opts_en: q.opts_en.map(o => o || ''),
      })),
    });
  };

  return (
    <div style={{padding:bp.mobile?'18px 16px 22px':'20px 28px 24px',display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1fr 1fr',gap:bp.mobile?12:16}}>
        <AlField km="ចំណងជើង · ខ្មែរ"   en="Quiz title · Khmer" full={false}>
          <AlInput value={km} onChange={e=>setKm(e.target.value)} onBlur={()=>translate(km, en, v=>setEn(p=>(p||'').trim()?p:v))} placeholder="ឧ. លំហាត់ ១"/>
        </AlField>
        <AlField km="ចំណងជើង · អង់គ្លេស" en="Quiz title · English" full={false}>
          <AlInput value={en} onChange={e=>setEn(e.target.value)} placeholder="e.g. Quiz 1"/>
          <TrBadge show={trBusy}/>
        </AlField>
      </div>

      {/* Google Form — paste a link to use a Google Form as this exercise */}
      <AlField km="Google Form (តំណ)" en="Google Form (link)">
        <AlInput value={formUrl} onChange={e=>setFormUrl(e.target.value)}
          placeholder="https://docs.google.com/forms/d/e/…/viewform"/>
        <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>
          {tr('បើ​ដាក់​តំណ Google Form នោះ​លំហាត់​នេះ​នឹង​ប្រើ Google Form ជំនួស​សំណួរ​ខាង​ក្រោម។',
              'If you paste a Google Form link, this exercise uses the form instead of the questions below.')}
        </div>
      </AlField>

      {useForm ? (
        <div style={{padding:'12px 14px',background:'var(--accent-soft)',border:'1px solid var(--accent)',borderRadius:10,fontSize:12,color:'var(--accent)',display:'flex',alignItems:'center',gap:8}}>
          <Icon name="book" size={15}/>
          {tr('លំហាត់​នេះ​ប្រើ Google Form ✓ — សំណួរ​ខាង​ក្នុង​មិន​ត្រូវ​បាន​ប្រើ​ទេ។',
              'This exercise uses a Google Form ✓ — the built-in questions are not used.')}
        </div>
      ) : (
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
        <div style={{fontSize:13,fontWeight:600}}>{tr('សំណួរ','Questions')} <span style={{color:'var(--ink-3)',fontWeight:400}}>· {questions.length}</span></div>
        <Btn kind="ghost" size="sm" icon={<Icon name="plus" size={12}/>}
          onClick={()=>setQuestions(qs => [...qs, blankQuestion()])}>
          {tr('បន្ថែម​សំណួរ','Add question')}
        </Btn>
      </div>
      )}

      {!useForm && (
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {questions.map((q, qi) => (
          <div key={qi} style={{
            border:'1px solid var(--border)', borderRadius:10, padding:14,
            background:'var(--surface-muted)',
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',letterSpacing:'.08em'}}>
                Q{qi+1}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <ImagePickerButton
                  size="sm"
                  label={q.image ? tr('ប្ដូរ​រូប','Replace') : tr('ដាក់​រូប','Add image')}
                  onPick={(dataUrl) => updateQ(qi, { image: dataUrl })}
                />
                {questions.length > 1 && (
                  <button onClick={()=>setQuestions(qs => qs.filter((_,i)=>i!==qi))}
                    style={{
                      border:0,background:'transparent',cursor:'pointer',
                      color:'var(--ink-3)',padding:4,display:'flex',
                    }}
                    title={tr('លុបសំណួរ','Remove question')}>
                    <Icon name="trash" size={13}/>
                  </button>
                )}
              </div>
            </div>

            {q.image && (
              <div style={{position:'relative',marginBottom:10,width:'fit-content',maxWidth:'100%'}}>
                <img src={q.image} alt="" style={{
                  display:'block', maxWidth:'100%', maxHeight:180,
                  borderRadius:8, border:'1px solid var(--border)',
                  background:'#fff',
                }}/>
                <button onClick={()=>updateQ(qi, { image: undefined })}
                  title={tr('លុបរូប','Remove image')}
                  style={{
                    position:'absolute', top:6, right:6,
                    width:24, height:24, border:0, borderRadius:999,
                    background:'rgba(20,20,18,.78)', color:'#fff', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, lineHeight:1, padding:0,
                  }}>×</button>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1fr 1fr',gap:10,marginBottom:10}}>
              <AlInput value={q.q_km} onChange={e=>updateQ(qi,{q_km:e.target.value})} onBlur={()=>translate(q.q_km, q.q_en, v=>fillQEn(qi, v))} placeholder="សំណួរ · ខ្មែរ"/>
              <AlInput value={q.q_en} onChange={e=>updateQ(qi,{q_en:e.target.value})} placeholder="Question · English"/>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {[0,1,2,3].map(oi => (
                <div key={oi} style={{display:'grid',gridTemplateColumns:bp.mobile?'auto 1fr':'auto 1fr 1fr',gap:8,alignItems:bp.mobile?'flex-start':'center'}}>
                  <label style={{
                    display:'flex',alignItems:'center',gap:6,cursor:'pointer',
                    fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',
                    marginTop:bp.mobile?8:0,
                  }}
                    title={tr('ជា​ចម្លើយ​ត្រឹមត្រូវ','Mark as correct')}>
                    <input
                      type="radio"
                      name={`q-${qi}-correct`}
                      checked={q.answer === oi}
                      onChange={()=>updateQ(qi,{answer:oi})}
                      style={{accentColor:'var(--good)',width:14,height:14,cursor:'pointer'}}
                    />
                    {String.fromCharCode(65+oi)}
                  </label>
                  {bp.mobile ? (
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <AlInput value={q.opts_km[oi]} onChange={e=>updateOpt(qi,oi,'km',e.target.value)} onBlur={()=>translate(q.opts_km[oi], q.opts_en[oi], v=>fillOptEn(qi, oi, v))} placeholder={`ជម្រើស ${String.fromCharCode(65+oi)} · ខ្មែរ`} style={{height:36,background:'var(--surface)'}}/>
                      <AlInput value={q.opts_en[oi]} onChange={e=>updateOpt(qi,oi,'en',e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)} · English`} style={{height:36,background:'var(--surface)'}}/>
                    </div>
                  ) : (
                    <>
                      <AlInput value={q.opts_km[oi]} onChange={e=>updateOpt(qi,oi,'km',e.target.value)} onBlur={()=>translate(q.opts_km[oi], q.opts_en[oi], v=>fillOptEn(qi, oi, v))} placeholder={`ជម្រើស ${String.fromCharCode(65+oi)} · ខ្មែរ`} style={{height:36,background:'var(--surface)'}}/>
                      <AlInput value={q.opts_en[oi]} onChange={e=>updateOpt(qi,oi,'en',e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)} · English`} style={{height:36,background:'var(--surface)'}}/>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}

      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
        <Btn kind="ghost"   size="md" onClick={onCancel}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="md" onClick={submit}>{initial ? tr('រក្សាទុក','Save') : tr('បន្ថែម','Add quiz')}</Btn>
      </div>
    </div>
  );
};

// ── Row layouts for the list view ─────────────────────────────────────────
const AlDelBtn = ({ onDelete, tr }) => (
  <button onClick={onDelete} title={tr('លុប','Delete')}
    style={{
      width:30,height:30,border:'1px solid var(--border)',
      background:'var(--surface)',borderRadius:8,cursor:'pointer',
      color:'var(--ink-3)',display:'flex',alignItems:'center',justifyContent:'center',
      transition:'all .12s',flexShrink:0,
    }}
    onMouseEnter={e=>{e.currentTarget.style.color='var(--danger)';e.currentTarget.style.borderColor='var(--danger)';}}
    onMouseLeave={e=>{e.currentTarget.style.color='var(--ink-3)';e.currentTarget.style.borderColor='var(--border)';}}
  ><Icon name="trash" size={13}/></button>
);

// Read-only preview popup for a text lesson — body + teaching guide. Opened by
// tapping the lesson row; the footer "Edit" jumps into the editor.
const LessonPreview = ({ item, onClose, onEdit }) => {
  const { tr, lang } = useAppActions();
  const enMode = lang === 'en';
  const body = enMode ? (item.body_en || item.body_km) : (item.body_km || item.body_en);
  const gp = [
    { km:'មាតិកាបង្រៀន',            jp:'指導内容', c:'var(--accent)', items: enMode?item.teach_en:item.teach_km },
    { km:'ចំណុចបង្រៀន',             jp:'指導事項', c:'#6246C9',       items: enMode?item.points_en:item.points_km },
    { km:'ចំណុចត្រូវប្រុងប្រយ័ត្ន', jp:'留意事項', c:'#C98A0A',       items: enMode?item.cautions_en:item.cautions_km },
  ];
  const hasGuide = gp.some(p => Array.isArray(p.items) && p.items.length);
  const renderBody = (text) => {
    const b = text || '';
    if (isLessonHtml(b)) return <div className="lesson-rich-body" style={{fontSize:13,lineHeight:1.75}} dangerouslySetInnerHTML={{__html: sanitizeLessonHtml(b, item.images)}}/>;
    return b.split('\n').map((line,i)=>{
      if(!line.trim()) return <div key={i} style={{height:8}}/>;
      const m=line.trim().match(/^!\[[^\]]*\]\(([^)]+)\)$/);
      if(m){ let src=m[1]; if(src.startsWith('img:')) src=(item.images||{})[src.slice(4)]||''; return src?<img key={i} src={src} alt="" style={{maxWidth:'100%',borderRadius:8,margin:'8px 0',display:'block',border:'1px solid var(--border)'}}/>:null; }
      if(line.startsWith('**')&&line.endsWith('**')) return <div key={i} style={{fontWeight:700,marginTop:12,marginBottom:4,fontSize:13}}>{line.slice(2,-2)}</div>;
      if(line.startsWith('• ')) return <div key={i} style={{display:'flex',gap:8,color:'var(--ink-2)',marginBottom:4,paddingLeft:4}}><span style={{color:'var(--accent)',flexShrink:0}}>·</span><span>{line.slice(2)}</span></div>;
      return <div key={i} style={{color:'var(--ink-2)',marginBottom:3}}>{line}</div>;
    });
  };
  return (
    <Modal open onClose={onClose} width={720}>
      <div style={{display:'flex',flexDirection:'column',maxHeight: window.innerWidth<700?'86vh':'84vh'}}>
        <div style={{flexShrink:0,position:'sticky',top:0,background:'var(--surface)',padding:'16px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:12,zIndex:2}}>
          <div style={{width:38,height:38,borderRadius:10,flexShrink:0,background:'var(--surface-muted)',color:'var(--ink-3)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="book" size={18}/></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:17,fontWeight:700,lineHeight:1.25}}>{window.lessonInlineHtml?window.lessonInlineHtml(tr(item.km,item.en)):tr(item.km,item.en)}</div>
            <div style={{fontSize:12,color:'var(--ink-3)',marginTop:3,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              {item.no && <span style={{fontFamily:'"JetBrains Mono",monospace',color:'var(--accent)',fontWeight:600}}>{item.no}</span>}
              {item.ja && <span style={{color:'var(--ink-2)'}}>{item.ja}</span>}
              <span>· {item.mins} {tr('នាទី','min')}</span>
            </div>
          </div>
          <button onClick={onClose} title={tr('បិទ','Close')} style={{flexShrink:0,width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',color:'var(--ink-2)',fontSize:16,lineHeight:1}}>✕</button>
        </div>
        <div style={{flex:1,minHeight:0,overflowY:'auto',padding:'14px 20px 18px',fontSize:14,lineHeight:1.8}}>
          {renderBody(body)}
          {hasGuide && (
            <div style={{marginTop:18,border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 13px',background:'var(--surface-muted)',borderBottom:'1px solid var(--border)'}}>
                <Icon name="book" size={14}/>
                <span style={{fontSize:13,fontWeight:700}}>{tr('ការណែនាំបង្រៀន','Teaching guide')}</span>
                <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>· {tr('សម្រាប់គ្រូ','Instructor')}</span>
                {item.guideLoc && <span style={{marginLeft:'auto',fontSize:11,color:'var(--ink-3)',background:'var(--surface)',border:'1px solid var(--border)',padding:'2px 9px',borderRadius:99,whiteSpace:'nowrap'}}>📍 {item.guideLoc}</span>}
              </div>
              <div style={{padding:'12px 13px',display:'flex',flexDirection:'column',gap:13}}>
                {gp.filter(p=>Array.isArray(p.items)&&p.items.length).map((p,pi)=>(
                  <div key={pi}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                      <span style={{width:8,height:8,borderRadius:2,background:p.c,flexShrink:0}}/>
                      <span style={{fontSize:12.5,fontWeight:700,color:p.c}}>{p.km}</span>
                      <span style={{fontSize:9.5,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{p.jp}</span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:4,paddingLeft:2}}>
                      {p.items.map((it,i)=>(
                        <div key={i} style={{display:'flex',gap:7,fontSize:13,color:'var(--ink-2)',lineHeight:1.55}}>
                          <span style={{color:p.c,flexShrink:0}}>•</span><span>{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{flexShrink:0,position:'sticky',bottom:0,background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'12px 20px',display:'flex',justifyContent:'flex-end',gap:8}}>
          <Btn kind="primary" size="md" icon={<Icon name="edit" size={14}/>} onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        </div>
      </div>
    </Modal>
  );
};

const TextLessonRow = ({ item, onEdit, onDelete, onPreview, tr, mobile }) => {
  const iconBox = (
    <div style={{width:38,height:38,borderRadius:8,flexShrink:0,background:'var(--surface-muted)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ink-2)'}}>
      <Icon name="book" size={16}/>
    </div>
  );
  const title = (
    <div style={{minWidth:0,flex:1}}>
      <div style={{fontSize:14,fontWeight:600,lineHeight:1.3}}>{window.lessonInlineHtml ? window.lessonInlineHtml(item.km) : item.km}</div>
      <div style={{fontSize:12,color:'var(--ink-3)',marginTop:1}}>{window.lessonPlainText ? window.lessonPlainText(item.en) : item.en} · {item.mins} {tr('នាទី','min')}</div>
    </div>
  );
  if (mobile) return (
    <div style={{display:'flex',flexDirection:'column',gap:10,padding:'12px 14px',border:'1px solid var(--border)',borderRadius:10,background:'var(--surface)'}}>
      <div onClick={onPreview} style={{display:'flex',gap:12,alignItems:'flex-start',cursor:onPreview?'pointer':'default'}}>{iconBox}{title}</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8}}>
        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)',marginRight:'auto'}}>{item.id}</span>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <AlDelBtn onDelete={onDelete} tr={tr}/>
      </div>
    </div>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto',gap:14,alignItems:'center',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:10,background:'var(--surface)'}}>
      <div onClick={onPreview} style={{display:'contents',cursor:onPreview?'pointer':'default'}}>{iconBox}{title}</div>
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)'}}>{item.id}</div>
      <div style={{display:'flex',gap:6}}>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <AlDelBtn onDelete={onDelete} tr={tr}/>
      </div>
    </div>
  );
};

const VideoLessonRow = ({ item, onEdit, onDelete, tr, mobile }) => {
  const thumb = (
    <div style={{width:88,height:50,borderRadius:6,flexShrink:0,background:`#000 url(https://i.ytimg.com/vi/${item.ytId}/mqdefault.jpg) center/cover no-repeat`,position:'relative'}}>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:24,height:24,borderRadius:999,background:'rgba(0,0,0,.65)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    </div>
  );
  const title = (
    <div style={{minWidth:0,flex:1}}>
      <div style={{fontSize:14,fontWeight:600,lineHeight:1.3}}>{item.km}</div>
      <div style={{fontSize:12,color:'var(--ink-3)',marginTop:1}}>{item.en} · {Math.floor(item.duration/60)} {tr('នាទី','min')}</div>
    </div>
  );
  if (mobile) return (
    <div style={{display:'flex',flexDirection:'column',gap:10,padding:'12px 14px',border:'1px solid var(--border)',borderRadius:10,background:'var(--surface)'}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>{thumb}{title}</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8}}>
        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)',marginRight:'auto',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'40%'}}>{item.ytId}</span>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <AlDelBtn onDelete={onDelete} tr={tr}/>
      </div>
    </div>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto',gap:14,alignItems:'center',padding:'12px 16px 12px 12px',border:'1px solid var(--border)',borderRadius:10,background:'var(--surface)'}}>
      {thumb}{title}
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)'}}>{item.ytId}</div>
      <div style={{display:'flex',gap:6}}>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <AlDelBtn onDelete={onDelete} tr={tr}/>
      </div>
    </div>
  );
};

const QuizRow = ({ item, onEdit, onDelete, tr, mobile }) => {
  const isForm = !!item.formUrl;
  const qCount = (item.questions || []).length;
  const iconBox = (
    <div style={{width:38,height:38,borderRadius:8,flexShrink:0,background:isForm?'#E8F0E6':'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center',color:isForm?'#3B7A57':'var(--accent)'}}>
      <Icon name={isForm?'book':'star'} size={16}/>
    </div>
  );
  const title = (
    <div style={{minWidth:0,flex:1}}>
      <div style={{fontSize:14,fontWeight:600,lineHeight:1.3,display:'flex',alignItems:'center',gap:8}}>
        {item.km}
        {isForm && <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:4,background:'#E8F0E6',color:'#3B7A57',whiteSpace:'nowrap'}}>Google Form</span>}
      </div>
      <div style={{fontSize:12,color:'var(--ink-3)',marginTop:1}}>
        {item.en}{isForm
          ? ' · ' + tr('លំហាត់ Google Form','Google Form exercise')
          : ' · ' + qCount + ' ' + tr('សំណួរ','question' + (qCount===1?'':'s'))}
      </div>
    </div>
  );
  if (mobile) return (
    <div style={{display:'flex',flexDirection:'column',gap:10,padding:'12px 14px',border:'1px solid var(--border)',borderRadius:10,background:'var(--surface)'}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>{iconBox}{title}</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8}}>
        <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)',marginRight:'auto'}}>{item.id}</span>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <AlDelBtn onDelete={onDelete} tr={tr}/>
      </div>
    </div>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto',gap:14,alignItems:'center',padding:'14px 16px',border:'1px solid var(--border)',borderRadius:10,background:'var(--surface)'}}>
      {iconBox}{title}
      <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--ink-3)'}}>{item.id}</div>
      <div style={{display:'flex',gap:6}}>
        <Btn kind="ghost" size="sm" onClick={onEdit}>{tr('កែ','Edit')}</Btn>
        <AlDelBtn onDelete={onDelete} tr={tr}/>
      </div>
    </div>
  );
};

// ── Section block (title + list + add button) ─────────────────────────────
const AlSection = ({ km, en, count, icon, addLabel, onAdd, children }) => {
  const { tr } = useAppActions();
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:8}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:28,height:28,borderRadius:7,
            background:'var(--surface-muted)',color:'var(--ink-2)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <Icon name={icon} size={14}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{km}</div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>{en} · {count}</div>
          </div>
        </div>
        <Btn kind="ghost" size="sm" icon={<Icon name="plus" size={12}/>} onClick={onAdd}>
          {addLabel}
        </Btn>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {children}
      </div>
    </div>
  );
};

// ── AdminLessonsScreen ────────────────────────────────────────────────────
const AdminLessonsScreen = ({ role = 'admin' }) => {
  const { tr, toast, confirm, lang } = useAppActions();
  const bp = useBreakpoint();
  const [section, setSection] = React.useState('theory');
  const [, force] = React.useReducer(x => x+1, 0);

  // editor state: { type: 'text'|'video'|'quiz', target: 'theoryTexts'|..., initial?: item }
  const [editor, setEditor] = React.useState(null);
  const [preview, setPreview] = React.useState(null);   // read-only lesson preview popup

  React.useEffect(() => {
    window.__notifyLessonsLibChanged = () => force();
    return () => { delete window.__notifyLessonsLibChanged; };
  }, []);

  const lib = window.__lessonsLib;
  const isTheory = section === 'theory';
  const textsKey   = isTheory ? 'theoryTexts'     : 'practicalTexts';
  const videosKey  = isTheory ? 'theoryVideos'    : 'practicalVideos';
  const quizzesKey = isTheory ? 'theoryExercises' : 'practicalExercises';
  const texts   = lib[textsKey];
  const videos  = lib[videosKey];
  const quizzes = lib[quizzesKey];

  const idPrefixFor = (type) => {
    if (type === 'text')  return isTheory ? 'tt' : 'pt';
    if (type === 'video') return isTheory ? 'tv' : 'pv';
    return isTheory ? 'te' : 'pe';
  };

  const openNew = (type) => {
    const key = type === 'text' ? textsKey : type === 'video' ? videosKey : quizzesKey;
    setEditor({ type, target: key, initial: null });
  };
  const openEdit = (type, item) => {
    const key = type === 'text' ? textsKey : type === 'video' ? videosKey : quizzesKey;
    setEditor({ type, target: key, initial: item });
  };

  const handleSave = (data) => {
    const { type, target, initial } = editor;
    const arr = lib[target];
    if (initial) {
      // update in place
      const idx = arr.findIndex(it => it.id === initial.id);
      if (idx >= 0) arr[idx] = { ...arr[idx], ...data };
      toast(tr('បាន​រក្សា​ទុក','Saved'), 'good');
    } else {
      // create new with auto id
      const id = nextLessonContentId(arr, idPrefixFor(type));
      arr.push({ id, ...data });
      toast(tr('បាន​បន្ថែម','Added'), 'good');
    }
    if (window.__logActivity) window.__logActivity(initial ? 'edit' : 'create', 'lesson-content', (data.km || data.en || '').slice(0,60));
    persistLessonsLib();
    setEditor(null);
    force();
  };

  const handleDelete = (target, item) => {
    confirm({
      title: tr('លុប​មេរៀន?', 'Delete this item?'),
      body: lang === 'km'
        ? `«${item.km || item.en}» នឹង​ត្រូវ​លុប​ជា​អចិន្ត្រៃយ៍។`
        : `"${item.en || item.km}" will be permanently removed.`,
      confirmText: tr('លុប', 'Delete'),
      danger: true,
      onConfirm: () => {
        const arr = lib[target];
        const idx = arr.findIndex(it => it.id === item.id);
        if (idx >= 0) arr.splice(idx, 1);
        if (window.__logActivity) window.__logActivity('delete', 'lesson-content', (item.km || item.en || '').slice(0,60));
        persistLessonsLib();
        toast(tr('បាន​លុប','Removed'),'neutral');
        force();
      },
    });
  };

  const totalAll = texts.length + videos.length + quizzes.length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:1080}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:16}}>
        <div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>
            {tr('បណ្ណាល័យ​មេរៀន','LESSON LIBRARY')}
          </div>
          <div style={{fontSize:bp.mobile?21:28,fontWeight:600,letterSpacing:'-.02em',marginTop:6,fontFamily:'var(--font-display)'}}>
            {tr('មេរៀន​បើក​បរ','Driving Lessons')}
          </div>
          {!bp.mobile && (
            <div style={{fontSize:13,color:'var(--ink-2)',marginTop:4,maxWidth:560}}>
              {tr(
                'គ្រប់​គ្រង​មាតិកា​មេរៀន​ដែល​សិស្ស​អាច​មើល​នៅ​ផ្ទាំង "មេរៀន" — អត្ថបទ​ទ្រឹស្ដី, អត្ថបទ​អនុវត្ត, វីដេអូ និង​លំហាត់។',
                'Manage the content students see in their Lessons tab — theory texts, practical guides, video tutorials, and quizzes.'
              )}
            </div>
          )}
        </div>
        {!bp.mobile && (
          <div style={{display:'flex',gap:8,flexShrink:0}}>
            <Btn kind="ghost" size="md" onClick={()=>openNew('video')} icon={<Icon name="plus" size={14}/>}>
              {tr('វីដេអូ​ថ្មី','New video')}
            </Btn>
            <Btn kind="primary" size="md" onClick={()=>openNew('text')} icon={<Icon name="plus" size={14}/>}>
              {tr('មេរៀន​ថ្មី','New lesson')}
            </Btn>
          </div>
        )}
      </div>

      {/* Section pills + meta */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          {[
            { id:'theory',    km:'មេរៀន​ទ្រឹស្ដី',  en:'Theory',    icon:'book' },
            { id:'practical', km:'មេរៀន​អនុវត្ត',    en:'Practical', icon:'car'  },
          ].map(s => (
            <button key={s.id} onClick={()=>setSection(s.id)} style={{
              padding:'8px 18px', borderRadius:999, cursor:'pointer',
              border:`1.5px solid ${section===s.id?'var(--ink)':'var(--border)'}`,
              background:section===s.id?'var(--ink)':'var(--surface)',
              color:section===s.id?'var(--bg)':'var(--ink-2)',
              fontSize:13, fontWeight:500,
              display:'flex', alignItems:'center', gap:8, transition:'all .15s',
            }}>
              <Icon name={s.icon} size={14}/>
              {tr(s.km, s.en)}
            </button>
          ))}
        </div>
        {!bp.mobile && (
          <div style={{fontSize:11,fontFamily:'"JetBrains Mono",monospace',color:'var(--ink-3)',letterSpacing:'.06em'}}>
            {tr(`សរុប ${totalAll} ធាតុ`, `${totalAll} item${totalAll===1?'':'s'} · ${section}`)}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[
          { km:'អត្ថបទ', en:'Text lessons',  val:texts.length,   icon:'book' },
          { km:'វីដេអូ', en:'Video lessons', val:videos.length,  icon:'star' },
          { km:'លំហាត់', en:'Quizzes',       val:quizzes.length, icon:'check' },
        ].map((it,i)=>(
          <div key={i} style={{
            padding:'14px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,
            display:'flex',alignItems:'center',gap:12,
          }}>
            <div style={{
              width:36,height:36,borderRadius:9,background:'var(--surface-muted)',
              display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ink-2)',
            }}><Icon name={it.icon} size={15}/></div>
            <div>
              <div style={{fontSize:22,fontWeight:700,lineHeight:1.05,fontFamily:'var(--font-display)'}}>{it.val}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{tr(it.km, it.en)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Text lessons */}
      <AlSection
        km="មេរៀន​អត្ថបទ" en="Text lessons" count={texts.length} icon="book"
        addLabel={tr('បន្ថែម​អត្ថបទ','Add text')}
        onAdd={()=>openNew('text')}
      >
        {texts.length === 0 ? (
          <EmptyState
            km="មិន​ទាន់​មាន​មេរៀន​អត្ថបទ"
            en="No text lessons yet"
            cta={tr('បន្ថែម​មេរៀន​អត្ថបទ​ដំបូង','Add the first text lesson')}
            onClick={()=>openNew('text')}
          />
        ) : texts.map((t,i)=>(
          <TextLessonRow key={t.id||i} item={t} tr={tr} mobile={bp.mobile}
            onPreview={()=>setPreview(t)}
            onEdit={()=>openEdit('text', t)}
            onDelete={()=>handleDelete(textsKey, t)}
          />
        ))}
      </AlSection>

      {/* Video lessons */}
      <AlSection
        km="មេរៀន​វីដេអូ" en="Video lessons" count={videos.length} icon="star"
        addLabel={tr('បន្ថែម​វីដេអូ','Add video')}
        onAdd={()=>openNew('video')}
      >
        {videos.length === 0 ? (
          <EmptyState
            km="មិន​ទាន់​មាន​វីដេអូ"
            en="No video lessons yet"
            cta={tr('បន្ថែម​វីដេអូ​ដំបូង','Add the first video')}
            onClick={()=>openNew('video')}
          />
        ) : videos.map((v,i)=>(
          <VideoLessonRow key={v.id||i} item={v} tr={tr} mobile={bp.mobile}
            onEdit={()=>openEdit('video', v)}
            onDelete={()=>handleDelete(videosKey, v)}
          />
        ))}
      </AlSection>

      {/* Quizzes */}
      <AlSection
        km="លំហាត់" en="Quizzes" count={quizzes.length} icon="check"
        addLabel={tr('បន្ថែម​លំហាត់','Add quiz')}
        onAdd={()=>openNew('quiz')}
      >
        {quizzes.length === 0 ? (
          <EmptyState
            km="មិន​ទាន់​មាន​លំហាត់"
            en="No quizzes yet"
            cta={tr('បន្ថែម​លំហាត់​ដំបូង','Add the first quiz')}
            onClick={()=>openNew('quiz')}
          />
        ) : quizzes.map((q,i)=>(
          <QuizRow key={q.id||i} item={q} tr={tr} mobile={bp.mobile}
            onEdit={()=>openEdit('quiz', q)}
            onDelete={()=>handleDelete(quizzesKey, q)}
          />
        ))}
      </AlSection>

      {/* Editor modal */}
      <Modal open={!!editor} onClose={()=>setEditor(null)} width={editor?.type === 'text' ? 900 : 820}>
        {editor && (() => {
          const crumb = editor.target === textsKey   ? (isTheory?'ទ្រឹស្ដី · អត្ថបទ':'អនុវត្តន៍ · អត្ថបទ')   :
                        editor.target === videosKey  ? (isTheory?'ទ្រឹស្ដី · វីដេអូ':'អនុវត្តន៍ · វីដេអូ') :
                                                       (isTheory?'ទ្រឹស្ដី · លំហាត់':'អនុវត្តន៍ · លំហាត់');
          const headerTitle = editor.initial
            ? tr('កែ​មេរៀន', 'Edit lesson')
            : editor.type === 'text'  ? tr('បន្ថែម​មេរៀន​អត្ថបទ', 'Add text lesson')
            : editor.type === 'video' ? tr('បន្ថែម​មេរៀន​វីដេអូ', 'Add video lesson')
                                      : tr('បន្ថែម​លំហាត់', 'Add quiz');
          // The text editor renders its own sticky header (with the toolbar); the
          // other forms keep the shared static header above them.
          if (editor.type === 'text') {
            return <TextLessonForm initial={editor.initial} crumb={crumb} headerTitle={headerTitle} onSave={handleSave} onCancel={()=>setEditor(null)}/>;
          }
          return (
            <div>
              <div style={{padding:'22px 28px 16px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>{crumb}</div>
                <div style={{fontSize:20,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em',marginTop:4}}>{headerTitle}</div>
              </div>
              {editor.type === 'video' && <VideoLessonForm initial={editor.initial} onSave={handleSave} onCancel={()=>setEditor(null)}/>}
              {editor.type === 'quiz'  && <QuizForm        initial={editor.initial} onSave={handleSave} onCancel={()=>setEditor(null)}/>}
            </div>
          );
        })()}
      </Modal>

      {/* Read-only preview popup — opened by tapping a lesson row */}
      {preview && (
        <LessonPreview item={preview} onClose={()=>setPreview(null)}
          onEdit={()=>{ const it = preview; setPreview(null); openEdit('text', it); }}/>
      )}
    </div>
  );
};

// ── Empty state placeholder ───────────────────────────────────────────────
const EmptyState = ({ km, en, cta, onClick }) => (
  <div style={{
    padding:'28px 20px',textAlign:'center',
    border:'1px dashed var(--border-strong)',borderRadius:10,
    background:'var(--surface-muted)',
  }}>
    <div style={{fontSize:13,fontWeight:500,color:'var(--ink-2)'}}>{km}</div>
    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2,fontFamily:'"JetBrains Mono",monospace'}}>{en}</div>
    {cta && (
      <div style={{marginTop:14}}>
        <Btn kind="ghost" size="sm" onClick={onClick} icon={<Icon name="plus" size={12}/>}>{cta}</Btn>
      </div>
    )}
  </div>
);

// ── Smart wrapper: route by role ──────────────────────────────────────────
const _StudentLessonsScreen = window.LessonsScreen;
const LessonsScreen = ({ role, studentId }) => {
  if (role === 'admin' || role === 'instructor') {
    return <AdminLessonsScreen role={role}/>;
  }
  return _StudentLessonsScreen
    ? React.createElement(_StudentLessonsScreen, { role, studentId })
    : <AdminLessonsScreen role={role}/>;
};

Object.assign(window, { AdminLessonsScreen, LessonsScreen });