// screens-announce.jsx — Announcements: broadcast info to students via Telegram
// Two delivery modes:
//   1) Bot (automatic) — to students who have a Telegram Chat ID
//   2) Phone link (manual) — opens Telegram/WhatsApp to the student's phone number
//      with the message ready to paste/send (no bot required)

// Normalise a Cambodian phone number to international digits (855…) for wa.me / tg links
const normPhone = (p = '') => {
  let d = String(p).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('855')) return d;
  if (d.startsWith('0'))   return '855' + d.slice(1);
  return d.length <= 9 ? '855' + d : d;
};

const ANNOUNCE_TEMPLATES = [
  { km:'ជំរាបសួរ {ឈ្មោះសិស្ស} 👋 មេរៀនបន្ទាប់របស់អ្នកនឹងប្រព្រឹត្តទៅ {ថ្ងៃទីក្នុងកាលវិភាគបន្ទាប់} ចាប់ពីម៉ោង {ម៉ោងចាប់ផ្ដើម} ដល់ម៉ោង {ម៉ោងបញ្ចប់} ជាមួយលោកគ្រូ {ឈ្មោះគ្រូក្នុងកាលវិភាគ}។',
    en:'Hi {student.name} 👋 Your next lesson is on {next.date} from {next.start} to {next.end} with {next.instructor}.' },
  { km:'សួស្ដី {student.name}! 🚗 សាលា {school.name} សូមជូនដំណឹង៖ ',  en:'Hi {student.name}! 🚗 {school.name} announcement: ' },
  { km:'ជូនដំណឹង៖ ថ្ងៃ {date} សាលាបិទ​ឈប់​សម្រាក។ សូម​អភ័យទោស​ចំពោះ​ភាព​រអាក់រអួល។', en:'Notice: the school is closed on {date}. Sorry for any inconvenience.' },
  { km:'រំលឹក {student.name}៖ សូម​នាំ​យក​ឯកសារ និង​ថ្លៃ​សិក្សា​មក​សាលា។', en:'Reminder {student.name}: please bring your documents and tuition fee.' },
  { km:'🎉 អបអរសាទរ {student.name}! សូម​បន្ត​ការ​ខិតខំ។', en:'🎉 Congratulations {student.name}! Keep up the great work.' },
];

const AnnounceScreen = ({ role = 'admin' }) => {
  const { tr, toast, navigate, lang } = useAppActions();
  const [, forceUpdate] = React.useReducer(x=>x+1, 0);
  const ss = window.__schoolSettings || {};

  const [msg, setMsg]         = React.useState('');
  const [filter, setFilter]   = React.useState('all');   // all | A | B | C | telegram | phone
  const [sel, setSel]         = React.useState(() => new Set());
  const [sending, setSending] = React.useState(false);
  if (!window.__announceLog) window.__announceLog = [];

  const allStudents = STUDENTS;
  const matches = (s) =>
    filter==='all' ? true :
    filter==='telegram' ? !!s.telegram :
    filter==='phone' ? !!s.phone :
    (s.cls||'B').startsWith(filter);
  const visible = allStudents.filter(matches);

  const toggle = (id) => setSel(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const selectAll = () => setSel(new Set(visible.map(s=>s.id)));
  const selectNone = () => setSel(new Set());
  const selStudents = allStudents.filter(s => sel.has(s.id));

  // The student's next lesson — the earliest still-pending lesson from today
  // onward. Done & cancelled lessons are skipped; we sort by date then by start
  // hour so the FIRST lesson of the next session (e.g. 09:00 before 11:00) wins.
  const pad2 = (n) => String(n).padStart(2,'0');
  const nextLessonOf = (s) => {
    if (!s) return null;
    const today = (typeof todayStr==='function'?todayStr():'');
    return (LESSONS||[])
      .filter(l => l.studentId===s.id && l.status!=='cancelled' && l.status!=='done' && (l.date||'') >= today)
      .sort((a,b) => (a.date||'').localeCompare(b.date||'') || (a.h||0)-(b.h||0))[0] || null;
  };
  // Branch location links (from Settings → Branches)
  const branches   = Array.isArray(ss.branches) ? ss.branches : [];
  const branchLink = (b) => b ? ((b.mapUrl||'').trim() || (b.addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.addr)}` : '')) : '';
  const mainBranch = branches.find(b=>b.status==='Active') || branches[0] || null;

  // Fill both English and Khmer variable tokens; unknown tokens stay as-is
  const fillVars = (text, s) => {
    const nl   = nextLessonOf(s);
    const inst = nl ? (INSTRUCTORS||[]).find(i=>i.id===nl.instId) : null;
    const start = nl ? pad2(nl.h||0)+':00' : '';
    const end   = nl ? pad2((nl.h||0)+(nl.len||0))+':00' : '';
    const instN = inst?.en || inst?.name || '';
    const map = {
      'student.name': s?.name || s?.en || '',  'ឈ្មោះសិស្ស': s?.name || s?.en || '',
      'school.name':  ss.name || 'Anzen',
      'date':         (typeof todayStr==='function'?todayStr():''),
      'next.date':    nl?.date || '',          'ថ្ងៃទីក្នុងកាលវិភាគបន្ទាប់': nl?.date || '',
      'next.start':   start,                    'ម៉ោងចាប់ផ្ដើម': start,
      'next.end':     end,                      'ម៉ោងបញ្ចប់':    end,
      'next.instructor': instN,                 'ឈ្មោះគ្រូក្នុងកាលវិភាគ': instN,
      'location':     branchLink(mainBranch),   'ទីតាំង':       branchLink(mainBranch),
    };
    return String(text||'').replace(/\{([^}]+)\}/g, (m, key) => {
      const k = key.trim();
      return (k in map) ? map[k] : m;
    });
  };

  const insertVar = (v) => setMsg(m => (m + (m && !m.endsWith(' ') ? ' ' : '') + v));

  // ── User-created templates (saved in school settings) ─────────────────────
  if (!ss.announceTemplates) ss.announceTemplates = [];
  const saveTemplate = () => {
    if (!msg.trim()) { toast(tr('សូមសរសេរសារជាមុនសិន','Write a message first'),'warn'); return; }
    const auto = msg.trim().replace(/\s+/g,' ').slice(0,28) + (msg.trim().length>28?'…':'');
    let name = window.prompt(tr('ឈ្មោះគំរូ','Template name'), auto);
    if (name === null) return;            // cancelled
    name = name.trim() || auto;
    ss.announceTemplates.unshift({ name, text: msg });
    if (ss.announceTemplates.length > 30) ss.announceTemplates.length = 30;
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានរក្សាគំរូ ✓','Template saved ✓'),'good');
  };
  const delTemplate = (i) => {
    ss.announceTemplates.splice(i,1);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
    toast(tr('បានលុបគំរូ','Template deleted'),'neutral');
  };

  const pushLog = (entry) => { window.__announceLog.unshift(entry); if (window.__announceLog.length>30) window.__announceLog.length=30; };

  // ── Bot send (automatic, needs chat IDs) ──────────────────────────────────
  const sendBot = async () => {
    if (!msg.trim()) { toast(tr('សូមសរសេរសារជាមុនសិន','Write a message first'),'warn'); return; }
    const tg = ss.telegram || {};
    if (!tg.enabled || !tg.token) {
      toast(tr('សូមភ្ជាប់ Bot នៅ ការកំណត់ → ការជូនដំណឹង','Connect a bot in Settings → Notifications'),'warn');
      return;
    }
    const targets = selStudents.filter(s => s.telegram);
    if (!targets.length) { toast(tr('គ្មានសិស្សជ្រើស​ដែលមាន Chat ID','No selected student has a Chat ID'),'warn'); return; }
    setSending(true);
    let ok=0, fail=0;
    for (const s of targets) {
      const r = await window.__sendTelegram(s.telegram, fillVars(msg, s));
      if (r && r.ok) ok++; else fail++;
    }
    setSending(false);
    pushLog({ when:new Date().toISOString(), text:msg, ok, fail, via:'bot' });
    forceUpdate();
    toast(tr(`📨 ផ្ញើតាម Bot៖ ជោគជ័យ ${ok}${fail?` · បរាជ័យ ${fail}`:''}`,`📨 Bot sent: ${ok} ok${fail?` · ${fail} failed`:''}`), fail?'warn':'good');
  };

  // ── Manual per-student (phone, no bot) ────────────────────────────────────
  const openTelegramPhone = (s) => {
    const txt = fillVars(msg || tr('សួស្ដី','Hi'), s);
    try { navigator.clipboard?.writeText(txt); } catch(_) {}
    const ph = normPhone(s.phone);
    if (!ph) { toast(tr('សិស្សនេះគ្មានលេខទូរសព្ទ','No phone number for this student'),'warn'); return; }
    window.open(`tg://resolve?phone=${ph}`, '_blank');
    pushLog({ when:new Date().toISOString(), text:msg, ok:1, fail:0, via:'tg-phone', who:s.name });
    toast(tr('សារបានចម្លង ✓ — បើក Telegram ហើយ paste','Message copied ✓ — open Telegram and paste'),'good');
  };
  const openWhatsApp = (s) => {
    const ph = normPhone(s.phone);
    if (!ph) { toast(tr('សិស្សនេះគ្មានលេខទូរសព្ទ','No phone number'),'warn'); return; }
    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(fillVars(msg||'Hi', s))}`, '_blank');
    pushLog({ when:new Date().toISOString(), text:msg, ok:1, fail:0, via:'whatsapp', who:s.name });
  };

  const btnSm = (extra={}) => ({style:{border:'1px solid var(--border)',background:'var(--surface)',borderRadius:6,padding:'4px 9px',fontSize:11,fontWeight:600,cursor:'pointer',color:'var(--ink-2)',whiteSpace:'nowrap',...extra}});
  const tgOK = !!(ss.telegram?.enabled && ss.telegram?.token);
  const selWithTg = selStudents.filter(s=>s.telegram).length;

  const FILTERS = [
    {v:'all',      l:tr('ទាំងអស់','All'),         n:allStudents.length},
    {v:'B',        l:'Class B',                   n:allStudents.filter(s=>(s.cls||'B').startsWith('B')).length},
    {v:'A',        l:'Class A',                   n:allStudents.filter(s=>(s.cls||'').startsWith('A')).length},
    {v:'C',        l:'Class C',                   n:allStudents.filter(s=>(s.cls||'').startsWith('C')).length},
    {v:'telegram', l:tr('មាន Chat ID','Has Chat ID'), n:allStudents.filter(s=>s.telegram).length},
    {v:'phone',    l:tr('មានទូរសព្ទ','Has phone'),    n:allStudents.filter(s=>s.phone).length},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle km="ការជូនដំណឹង" en="Announcements · Telegram broadcast"/>

      {!tgOK && (
        <div style={{padding:'10px 14px',background:'#FFF4E5',border:'1px solid var(--warn)',borderRadius:8,fontSize:12,color:'var(--warn)',display:'flex',gap:10,alignItems:'center'}}>
          ⚠️ {tr('Bot មិនទាន់ភ្ជាប់ — ការផ្ញើស្វ័យប្រវត្តិមិនដំណើរការ។ អ្នកនៅតែអាចផ្ញើតាមលេខទូរសព្ទ (manual) បាន។','Bot not connected — auto-send is off. You can still send via phone links (manual).')}
          <button onClick={()=>navigate('settings')} {...btnSm({marginLeft:'auto',color:'var(--warn)',borderColor:'var(--warn)'})}>{tr('ភ្ជាប់ Bot','Connect bot')}</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14}}>
        {/* Compose */}
        <Card label={tr('សារ','MESSAGE')}
          action={<button onClick={saveTemplate} {...btnSm({color:'var(--accent)',borderColor:'var(--accent)'})}>💾 {tr('រក្សាជាគំរូ','Save as template')}</button>}>
          {/* starter templates */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6,alignItems:'center'}}>
            <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginRight:2}}>{tr('គំរូដើម','STARTERS')}</span>
            {ANNOUNCE_TEMPLATES.map((t,i)=>(
              <button key={i} onClick={()=>setMsg(tr(t.km,t.en))} {...btnSm()}>{tr('គំរូ','Tmpl')} {i+1}</button>
            ))}
          </div>
          {/* user templates */}
          {(ss.announceTemplates||[]).length > 0 && (
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8,alignItems:'center'}}>
              <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginRight:2}}>{tr('គំរូរបស់អ្នក','MY TEMPLATES')}</span>
              {ss.announceTemplates.map((t,i)=>(
                <span key={i} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 8px',borderRadius:6,fontSize:11,fontWeight:600,background:'var(--accent-soft)',border:'1px solid var(--accent)',color:'var(--accent)'}}>
                  <span onClick={()=>setMsg(t.text)} style={{cursor:'pointer'}} title={t.text}>{t.name}</span>
                  <button onClick={()=>delTemplate(i)} title={tr('លុប','Delete')} style={{border:'none',background:'none',cursor:'pointer',color:'var(--accent)',fontSize:13,lineHeight:1,padding:0}}>×</button>
                </span>
              ))}
            </div>
          )}
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={6}
            placeholder={tr('សរសេរសារជូនដំណឹង… (ឧ. ការផ្លាស់ប្ដូរម៉ោង សាលាបិទ ការទូទាត់…)','Write your announcement… (e.g. schedule change, closure, payment…)')}
            style={{width:'100%',padding:'12px 14px',border:'1px solid var(--border)',borderRadius:8,fontSize:14,lineHeight:1.7,fontFamily:'var(--font-km),var(--font-en)',background:'var(--surface)',color:'var(--ink)',resize:'vertical',boxSizing:'border-box'}}/>
          <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
            {tr('បញ្ចូលអថេរ','Insert variable')}: {(lang==='km'
              ? ['{ឈ្មោះសិស្ស}','{ថ្ងៃទីក្នុងកាលវិភាគបន្ទាប់}','{ម៉ោងចាប់ផ្ដើម}','{ម៉ោងបញ្ចប់}','{ឈ្មោះគ្រូក្នុងកាលវិភាគ}','{ទីតាំង}','{school.name}','{date}']
              : ['{student.name}','{next.date}','{next.start}','{next.end}','{next.instructor}','{location}','{school.name}','{date}']
            ).map(v=>(
              <span key={v} onClick={()=>insertVar(v)} style={{display:'inline-block',margin:'2px 4px 0 0',padding:'1px 7px',background:'var(--accent-soft)',color:'var(--accent)',borderRadius:4,fontFamily:'var(--font-km),"JetBrains Mono",monospace',fontSize:10,cursor:'pointer'}}>{v}</span>
            ))}
          </div>
          {/* Insert a branch location link directly */}
          <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--ink-3)'}}>📍 {tr('បញ្ចូលតំណទីតាំង','Insert location link')}:</span>
            {branches.length === 0 ? (
              <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('មិនទាន់មានសាខា — បន្ថែមនៅ ការកំណត់ → Branches','No branches — add in Settings → Branches')}</span>
            ) : branches.map(b=>(
              <button key={b.id} onClick={()=>{ const lk=branchLink(b); insertVar(`\n📍 ${b.name}${lk?': '+lk:''}`); }}
                {...btnSm({color:'var(--accent)',borderColor:'var(--accent)'})}>📍 {b.name}</button>
            ))}
          </div>
          {msg && selStudents[0] && (
            <div style={{marginTop:10,padding:'10px 12px',background:'var(--surface-muted)',borderRadius:8,fontSize:12,lineHeight:1.6}}>
              <div style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',marginBottom:4}}>{tr('មើលជាមុន (សិស្សដំបូង)','PREVIEW (first selected)')}</div>
              {fillVars(msg, selStudents[0])}
            </div>
          )}
          <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center'}}>
            <Btn kind="primary" size="md" onClick={sendBot} icon={<Icon name="bell" size={14}/>}
              style={(!tgOK||!selWithTg||sending)?{opacity:.55}:{}}>
              {sending ? tr('កំពុងផ្ញើ…','Sending…') : tr(`📨 ផ្ញើតាម Bot (${selWithTg})`,`📨 Send via Bot (${selWithTg})`)}
            </Btn>
            <span style={{fontSize:11,color:'var(--ink-3)'}}>{tr('ផ្ញើទៅសិស្សដែលមាន Chat ID','To selected students with a Chat ID')}</span>
          </div>
        </Card>

        {/* Recipients */}
        <Card label={tr('អ្នកទទួល','RECIPIENTS')}
          action={<div style={{display:'flex',gap:6}}><button onClick={selectAll} {...btnSm()}>{tr('ជ្រើសទាំងអស់','Select all')}</button><button onClick={selectNone} {...btnSm()}>{tr('សម្អាត','Clear')}</button></div>}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
            {FILTERS.map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)} style={{
                padding:'3px 10px',borderRadius:20,fontSize:11,cursor:'pointer',
                border:`1px solid ${filter===f.v?'var(--accent)':'var(--border)'}`,
                background:filter===f.v?'var(--accent-soft)':'transparent',
                color:filter===f.v?'var(--accent)':'var(--ink-3)',
              }}>{f.l} <span style={{opacity:.6,fontFamily:'"JetBrains Mono",monospace'}}>{f.n}</span></button>
            ))}
          </div>
          <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:8}}>{tr(`បានជ្រើស ${sel.size} នាក់`,`${sel.size} selected`)}</div>
          <div style={{maxHeight:360,overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
            {visible.length===0 ? (
              <div style={{padding:'20px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនមានសិស្ស','No students')}</div>
            ) : visible.map(s=>{
              const on = sel.has(s.id);
              return (
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',borderRadius:8,background:on?'var(--accent-soft)':'transparent'}}>
                  <input type="checkbox" checked={on} onChange={()=>toggle(s.id)} style={{width:16,height:16,cursor:'pointer',accentColor:'var(--accent)'}}/>
                  <Avatar tag={s.photo} size={28}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                    <div style={{fontSize:10,color:'var(--ink-3)',display:'flex',gap:6}}>
                      {s.telegram ? <span style={{color:'var(--good)'}}>● Chat ID</span> : <span>○ {tr('គ្មាន Chat ID','no Chat ID')}</span>}
                      {s.phone && <span>📞 {s.phone}</span>}
                    </div>
                  </div>
                  <button onClick={()=>openTelegramPhone(s)} title={tr('បើក Telegram តាមលេខ + ចម្លងសារ','Open Telegram by phone + copy message')} {...btnSm({padding:'4px 7px'})}>📱 TG</button>
                  <button onClick={()=>openWhatsApp(s)} title="WhatsApp" {...btnSm({padding:'4px 7px',color:'#1A6B3C',borderColor:'#96D9B8'})}>🟢 WA</button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* How it works */}
      <div style={{padding:'12px 16px',background:'var(--surface-muted)',borderRadius:8,fontSize:11.5,color:'var(--ink-2)',lineHeight:1.7}}>
        <b>{tr('វិធីផ្ញើ','How sending works')}</b><br/>
        • <b>{tr('តាម Bot (ស្វ័យប្រវត្តិ)','Via Bot (automatic)')}</b> — {tr('ផ្ញើភ្លាមៗ ដោយមិនបាច់​ធ្វើ​អ្វី​ផ្សេង។ ត្រូវ​ការ​សិស្ស​មាន Chat ID (សិស្ស​ផ្ញើ /start ទៅ bot)។','Sends instantly. Requires the student to have a Chat ID (student sends /start to the bot).')}<br/>
        • <b>📱 TG ({tr('តាមលេខទូរសព្ទ','by phone')})</b> — {tr('បើក Telegram ទៅលេខ​សិស្ស ហើយ​ចម្លង​សារ​ស្រាប់ → អ្នក​គ្រាន់​តែ paste + ផ្ញើ (មិន​បាច់ bot)។','Opens Telegram to the student\'s number and copies the message → you just paste & send (no bot).')}<br/>
        • <b>🟢 WA</b> — {tr('បើក WhatsApp ជាមួយ​សារ​ស្រាប់ (ផ្ញើ​តាម​លេខ​ទូរសព្ទ​ផ្ទាល់)។','Opens WhatsApp with the message pre-filled (sends by phone number directly).')}
      </div>

      {/* Recent log */}
      {window.__announceLog.length > 0 && (
        <Card label={tr('ប្រវត្តិផ្ញើថ្មីៗ','RECENT SENDS')}>
          {window.__announceLog.slice(0,8).map((e,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none',fontSize:12,alignItems:'center'}}>
              <span style={{fontSize:14}}>{e.via==='bot'?'📨':e.via==='whatsapp'?'🟢':'📱'}</span>
              <div style={{flex:1,minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.text || '—'}</div>
              <span style={{fontSize:11,color:'var(--ink-3)',flexShrink:0}}>
                {e.via==='bot' ? tr(`${e.ok} ផ្ញើ${e.fail?` · ${e.fail} បរាជ័យ`:''}`,`${e.ok} sent${e.fail?` · ${e.fail} failed`:''}`) : (e.who||'')}
              </span>
              <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',flexShrink:0}}>{(e.when||'').slice(11,16)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

Object.assign(window, { AnnounceScreen });
