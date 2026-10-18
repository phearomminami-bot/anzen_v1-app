// screens-attendance.jsx — did the student turn up, and what does that add up to.
//
// A lesson already carried `status`, but with only scheduled / done / cancelled
// it could not tell a student who never came from a lesson both sides agreed to
// move — "cancelled" meant either. So attendance is its own field and `status`
// is left exactly as the rest of the app expects it.
//
//   attend: 'present' | 'late' | 'absent' | 'excused'   (unset = not yet marked)
//   status: 'cancelled' still means the day was moved, and is left out of the
//           figures entirely rather than counted against anyone.

const ATTEND_MARKS = {
  present: { km:'មក',       en:'Present', ico:'✓', fg:'#12804A', bg:'#E7F7EE', edge:'#2FBF71', counts:true,  credits:true  },
  late:    { km:'មកយឺត',    en:'Late',    ico:'◷', fg:'#8A6206', bg:'#FEF3E2', edge:'#E0A51F', counts:true,  credits:true  },
  absent:  { km:'អវត្តមាន', en:'Absent',  ico:'✕', fg:'#9B2C2C', bg:'#FDECEC', edge:'#D65A5A', counts:false, credits:false },
  excused: { km:'សុំច្បាប់', en:'Excused', ico:'✉', fg:'#1D4E8F', bg:'#EAF1FF', edge:'#5B8FD9', counts:false, credits:false },
};
const ATTEND_ORDER = ['present', 'late', 'absent', 'excused'];
const ATTEND_LOW = 70;        // below this a student is flagged for follow-up

// A lesson that was moved is not an attendance event at all.
const attendCountable = (l) => !!l && l.status !== 'cancelled';

// Hours are credited for turning up, and the credit has to survive a change of
// mind: marking absent after present must take them back. `credited` records
// what was actually given, so the books balance whatever order marks arrive in.
const attendApply = (lesson, mark, who) => {
  if (!lesson) return;
  const s = (typeof STUDENTS !== 'undefined' ? STUDENTS : []).find(x => x.id === lesson.studentId);
  const want = ATTEND_MARKS[mark] ? !!ATTEND_MARKS[mark].credits : false;
  // A lesson marked done through the old button carries no flag of its own.
  const had = lesson.credited != null ? !!lesson.credited : lesson.status === 'done';

  if (s && want && !had) { s.hours = (s.hours || 0) + (lesson.len || 0); }
  if (s && !want && had) { s.hours = Math.max(0, (s.hours || 0) - (lesson.len || 0)); }

  lesson.attend   = mark || '';
  lesson.credited = want;
  lesson.status   = want ? 'done' : 'scheduled';
  lesson.attendBy = who || '';
  lesson.attendAt = new Date().toISOString();

  if (window.__logActivity) window.__logActivity('edit', 'attendance', `${lesson.date} ${lesson.id} ${mark}`);
};

// Totals for one student over a set of lessons.
const attendTally = (lessons) => {
  const t = { present:0, late:0, absent:0, excused:0, unmarked:0, hours:0 };
  lessons.forEach(l => {
    if (!attendCountable(l)) return;
    const m = l.attend;
    if (!ATTEND_MARKS[m]) { t.unmarked += 1; return; }
    t[m] += 1;
    if (ATTEND_MARKS[m].credits) t.hours += (l.len || 0);
  });
  t.marked = t.present + t.late + t.absent + t.excused;
  t.rate = t.marked ? Math.round(((t.present + t.late) / t.marked) * 100) : null;
  return t;
};

// ── The report ──────────────────────────────────────────────────────────────
// Same in-app overlay as the schedule PDF: a new tab traps people on a phone.
const attendanceReportPDF = (rows, meta, lang) => {
  const HOST_ID = '__anzenAttHost';
  document.getElementById(HOST_ID)?.remove();
  document.getElementById('__anzenAttStyle')?.remove();

  const ss = window.__schoolSettings || {};
  const curLang = (lang || window.__anzenLang || 'km') === 'en' ? 'en' : 'km';
  const L  = (km, en) => (curLang === 'km' ? km : en);
  const kd = s => curLang === 'km' ? String(s).replace(/[0-9]/g, d => '០១២៣៤៥៦៧៨៩'[+d]) : String(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const nameOf = s => esc(curLang === 'km' ? (s.name || s.en || s.id) : (s.en || s.name || s.id));

  const sum = rows.reduce((a, r) => {
    ATTEND_ORDER.forEach(k => { a[k] += r.t[k]; });
    a.hours += r.t.hours; a.marked += r.t.marked; return a;
  }, { present:0, late:0, absent:0, excused:0, hours:0, marked:0 });
  const avg = sum.marked ? Math.round(((sum.present + sum.late) / sum.marked) * 100) : 0;
  const watch = rows.filter(r => r.t.rate != null && r.t.rate < ATTEND_LOW);

  const tile = (v, lab, bg, ink) => `
    <div style="flex:1;border-radius:9px;background:${bg};padding:8px 10px">
      <div style="font-size:18px;font-weight:800;color:${ink};line-height:1.15">${kd(v)}</div>
      <div style="font-size:10px;color:#475467;margin-top:2px">${lab}</div></div>`;

  const body = rows.map((r, i) => {
    const z = i % 2 ? '#FAFBFD' : '#fff';
    const low = r.t.rate != null && r.t.rate < ATTEND_LOW;
    const td = (v, extra) => `<td style="padding:5px 6px;border:1px solid #E6EAF1;background:${z};font-size:10.5px;${extra || ''}">${v}</td>`;
    return `<tr>
      ${td('<b>' + nameOf(r.s) + '</b>')}
      ${ATTEND_ORDER.map(k => td(kd(r.t[k]), 'text-align:center;color:' + ATTEND_MARKS[k].fg + (k === 'absent' && r.t.absent >= 3 ? ';font-weight:800' : ''))).join('')}
      ${td(r.t.rate == null ? '—' : `<b style="color:${low ? '#9B2C2C' : '#101828'}">${kd(r.t.rate)}%</b>`, 'text-align:center')}
      ${td(kd(Math.max(0, Math.round((r.s.hours || 0) * 10) / 10)) + 'h', 'text-align:center')}
      ${td(r.s.target ? kd(Math.max(0, Math.round((r.s.target - (r.s.hours || 0)) * 10) / 10)) + 'h' : '—', 'text-align:center')}
      ${td(low ? `<span style="color:#9B2C2C;font-weight:700">${L('ត្រូវតាមដាន','Follow up')}</span>` : '')}
    </tr>`;
  }).join('');

  const th = (t, w) => `<th style="padding:6px;border:1px solid #D6DEEA;background:#EEF2F8;font-size:9.5px;color:#475467;${w ? 'width:' + w + ';' : ''}">${t}</th>`;

  const paper = `
    <div style="display:flex;align-items:flex-start;gap:12px;padding-bottom:9px;border-bottom:2px solid #1A4F96">
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;font-weight:800;color:#101828">${esc(ss.name || 'Anzen')}</div>
        <div style="font-size:10.5px;color:#667085">${L('សាលាបង្រៀនបើកបរ','Driving school')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:700;color:#1A4F96">${L('របាយការណ៍វត្តមាន','Attendance report')}</div>
        <div style="font-size:10.5px;color:#667085;margin-top:1px">${kd(meta.from)} → ${kd(meta.to)}</div>
      </div>
    </div>
    <div style="font-size:10.5px;color:#667085;padding:7px 0 9px;line-height:1.75">
      ${L('សិស្ស','Students')} ${kd(rows.length)} ·
      ${L('មេរៀនបានកត់','Lessons marked')} ${kd(sum.marked)} ·
      ${L('គិតត្រឹម','as at')} ${kd(meta.today)}${meta.scope ? ' · ' + esc(meta.scope) : ''}
    </div>
    <div style="display:flex;gap:7px">
      ${tile(avg + '%', L('វត្តមានមធ្យម','Average attendance'), '#EAF1FF', '#1A4F96')}
      ${ATTEND_ORDER.map(k => tile(sum[k], L(ATTEND_MARKS[k].km, ATTEND_MARKS[k].en), ATTEND_MARKS[k].bg, ATTEND_MARKS[k].fg)).join('')}
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:14px">
      <thead><tr>
        ${th(L('សិស្ស','Student'), '21%')}
        ${ATTEND_ORDER.map(k => th(L(ATTEND_MARKS[k].km, ATTEND_MARKS[k].en))).join('')}
        ${th(L('វត្តមាន','Rate'))}${th(L('រៀនរួច','Done'))}${th(L('នៅសល់','Left'))}${th(L('កំណត់សម្គាល់','Note'), '16%')}
      </tr></thead>
      <tbody>${body}</tbody></table>
    ${watch.length ? `<div style="margin-top:14px;padding:10px 12px;border-radius:9px;background:#FDECEC">
      <div style="font-size:11px;font-weight:700;color:#9B2C2C;margin-bottom:4px">
        ${L(`សិស្សដែលត្រូវតាមដាន (វត្តមានក្រោម ${kd(ATTEND_LOW)}%)`, `Follow up — attendance below ${ATTEND_LOW}%`)}</div>
      <div style="font-size:10.5px;color:#8A2C06;line-height:1.7">
        ${watch.map(r => `${nameOf(r.s)} — ${L('អវត្តមាន','absent')} ${kd(r.t.absent)} · ${kd(r.t.rate)}%`).join('<br>')}
      </div></div>` : ''}
    <div style="margin-top:12px;font-size:10px;color:#98A2B3;line-height:1.7">
      ${L('«មកយឺត» រាប់ជាវត្តមាន។ «សុំច្បាប់» មិនរាប់ទាស់នឹងសិស្ស តែរាប់ក្នុងមេរៀនដែលខកខាន។',
          'Late counts as attending. Excused is not held against the student but is still a missed lesson.')}<br>
      ${L('មេរៀនដែលប្ដូរថ្ងៃ មិនរាប់ក្នុងរបាយការណ៍នេះទេ។','Lessons moved to another day are left out entirely.')}
    </div>
    <div style="display:flex;margin-top:16px;padding-top:9px;border-top:1px solid #E6EAF1;font-size:10px;color:#98A2B3">
      <span>${L('ហត្ថលេខានាយក ៖ ___________________','Director: ___________________')}</span>
      <span style="margin-left:auto">${kd(meta.today)}</span>
    </div>`;

  const style = document.createElement('style');
  style.id = '__anzenAttStyle';
  style.textContent = `
    #${HOST_ID}{position:fixed;inset:0;z-index:100000;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch}
    #${HOST_ID} .att-paper{font-family:'Kantumruy Pro',Inter,'Khmer OS',sans-serif;font-size:12px;color:#222;background:#fff;padding:18px 20px 24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @media print{
      body > *:not(#${HOST_ID}){display:none !important}
      #${HOST_ID}{position:static !important;overflow:visible !important}
      #${HOST_ID} .att-bar{display:none !important}
      #${HOST_ID} .att-paper{zoom:1 !important;width:auto !important}
      @page{size:A4 landscape;margin:11mm}
    }`;
  document.head.appendChild(style);

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.innerHTML = `
    <div class="att-bar" style="position:sticky;top:0;z-index:2;display:flex;gap:6px;align-items:center;overflow-x:auto;padding:calc(10px + env(safe-area-inset-top,0px)) 10px 10px;background:#1A4F96;color:#fff;box-shadow:0 1px 8px rgba(0,0,0,.25)">
      <button id="__attBack" style="flex-shrink:0;border:none;background:rgba(255,255,255,.2);color:#fff;font-size:16px;width:38px;height:38px;border-radius:8px;cursor:pointer">⬅</button>
      <div style="display:flex;flex-shrink:0;background:rgba(255,255,255,.16);border-radius:8px;padding:2px">
        <button id="__attKm" style="border:none;background:${curLang==='km'?'#fff':'transparent'};color:${curLang==='km'?'#1A4F96':'#fff'};font-size:12px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer">ខ្មែរ</button>
        <button id="__attEn" style="border:none;background:${curLang==='en'?'#fff':'transparent'};color:${curLang==='en'?'#1A4F96':'#fff'};font-size:12px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer">EN</button>
      </div>
      <div style="flex:1;min-width:2px"></div>
      <button id="__attPrint" style="flex-shrink:0;border:none;background:#fff;color:#1A4F96;font-size:16px;width:40px;height:38px;border-radius:8px;cursor:pointer">🖨</button>
    </div>
    <div class="att-paper">${paper}</div>`;
  document.body.appendChild(host);

  const SHEET_W = 840;
  const fit = () => {
    const p = host.querySelector('.att-paper');
    const avail = host.clientWidth || window.innerWidth || SHEET_W;
    if (avail < SHEET_W) { p.style.width = SHEET_W + 'px'; p.style.zoom = (avail / SHEET_W).toFixed(3); }
    else { p.style.width = ''; p.style.zoom = ''; }
  };
  const cleanup = () => { window.removeEventListener('resize', fit); host.remove(); style.remove(); };
  host.querySelector('#__attBack').onclick  = cleanup;
  host.querySelector('#__attPrint').onclick = () => { try { window.print(); } catch (e) {} };
  const relang = (n) => { if (n !== curLang) { cleanup(); attendanceReportPDF(rows, meta, n); } };
  host.querySelector('#__attKm').onclick = () => relang('km');
  host.querySelector('#__attEn').onclick = () => relang('en');
  fit();
  window.addEventListener('resize', fit);
};

// ── The screen ──────────────────────────────────────────────────────────────
const AttendanceScreen = ({ role = 'admin' }) => {
  const { tr, lang, toast, openDetail } = useAppActions();
  const [tab, setTab]   = React.useState('day');
  const [span, setSpan] = React.useState('month');     // week | month | all
  const [ver, setVer]   = React.useState(0);
  const force = () => setVer(n => n + 1);

  React.useEffect(() => {
    window.__notifyLessonsChanged = force;
    return () => { delete window.__notifyLessonsChanged; };
  }, []);

  // An instructor marks their own lessons; the admin marks anyone's. Nothing
  // here is a security boundary — it keeps a busy screen down to what the
  // person in front of it actually teaches.
  const myInstId = window.__loggedInInstructorId || '';
  const mine = (l) => role === 'admin' || !myInstId || l.instId === myInstId;
  const meName = window.__currentUserName || '';

  const save = () => {
    if (window.__notifyLessonsChanged) window.__notifyLessonsChanged();
    if (window.saveAllData) window.saveAllData();
    force();
  };
  const mark = (lesson, k) => { attendApply(lesson, k, meName); save(); };

  const studentOf = (id) => (STUDENTS || []).find(s => s.id === id);
  const instOf    = (id) => (INSTRUCTORS || []).find(i => i.id === id);
  const vehOf     = (id) => (VEHICLES || []).find(v => v.id === id);
  const nm = (x) => !x ? '—' : ((lang === 'km' ? (x.name || x.en) : (x.en || x.name)) || x.id);

  // ── the register ──────────────────────────────────────────────────────────
  // A month at a time, students down and days across — the shape a paper
  // register already has, so a whole class is marked without changing screen.
  const [month, setMonth] = React.useState(() => todayStr().slice(0, 7));

  const monthDays = React.useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    if (!y || !m) return [];
    const n = new Date(y, m, 0).getDate();
    const p = x => String(x).padStart(2, '0');
    return Array.from({ length: n }, (_, i) => {
      const iso = `${y}-${p(m)}-${p(i + 1)}`;
      const d = new Date(iso + 'T00:00:00');
      return { iso, dn: i + 1, dow: d.getDay(), rest: typeof isRestDay === 'function' ? isRestDay(iso) : d.getDay() === 0 };
    });
  }, [month]);

  const shiftMonth = (n) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // studentId|date → the lessons that day. A student can sit twice in a day,
  // so a cell is a list and a mark applies to all of it.
  const cells = React.useMemo(() => {
    const map = new Map();
    (LESSONS || []).forEach(l => {
      if (!l || !l.date || !l.date.startsWith(month) || !attendCountable(l) || !mine(l)) return;
      const k = l.studentId + '|' + l.date;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(l);
    });
    return map;
  }, [month, ver, myInstId]);

  const roster = (STUDENTS || []).filter(s => s && s.status !== 'Former' && s.status !== 'Cleared');

  // One tap steps through the marks. Marking is mostly confirming that people
  // turned up, so the first tap is the common answer and the rest follow.
  const CYCLE = ['present', 'late', 'absent', 'excused', ''];
  const stepCell = (list) => {
    const cur = list[0] ? (list[0].attend || '') : '';
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
    list.forEach(l => attendApply(l, next, meName));
    save();
  };

  const monthUnmarked = [...cells.values()].flat().filter(l => !ATTEND_MARKS[l.attend]);
  const markMonthPresent = () => {
    if (!monthUnmarked.length) return;
    monthUnmarked.forEach(l => attendApply(l, 'present', meName));
    save();
    toast(tr(`បាន​កត់ ${monthUnmarked.length} មេរៀន​ថា «មក» ✓`, `Marked ${monthUnmarked.length} present ✓`), 'good');
  };

  const monthTally = (k) => [...cells.values()].flat().filter(l => l.attend === k).length;
  const KM_MON = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
  const EN_MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = (() => {
    const [y, m] = month.split('-').map(Number);
    return tr(`${KM_MON[m - 1]} ${y}`, `${EN_MON[m - 1]} ${y}`);
  })();
  const DOW_KM = ['អា','ច','អ','ព','ព្រ','សុ','ស'];
  const DOW_EN = ['S','M','T','W','T','F','S'];

  const NAME_W = 118, CELL_W = 30, CELL_H = 34, SUM_W = 54;

  // Hours across the whole course, which is what a school is actually counting
  // down. `hours` is kept on the student and credited as lessons are marked.
  const doneHours = (s) => Math.max(0, Math.round((s.hours || 0) * 10) / 10);
  const leftHours = (s) => (s.target ? Math.max(0, Math.round((s.target - (s.hours || 0)) * 10) / 10) : null);

  const dayView = (
    <>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <Btn kind="ghost" size="md" onClick={() => shiftMonth(-1)}>◀</Btn>
        <div style={{flex:1,minWidth:0,textAlign:'center',padding:'8px 10px',borderRadius:12,
          background:'var(--surface)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--ink)'}}>{monthLabel}</div>
        </div>
        <Btn kind="ghost" size="md" onClick={() => shiftMonth(1)}>▶</Btn>
        <Btn kind="ghost" size="md" onClick={() => setMonth(todayStr().slice(0, 7))}>{tr('ខែ​នេះ','This month')}</Btn>
      </div>

      <div style={{display:'flex',gap:7,marginBottom:12}}>
        {ATTEND_ORDER.map(k => {
          const c = ATTEND_MARKS[k];
          return (
            <div key={k} style={{flex:1,minWidth:0,background:c.bg,borderRadius:13,padding:'9px 10px'}}>
              <div style={{fontSize:19,fontWeight:800,color:c.fg,lineHeight:1.1}}>{monthTally(k)}</div>
              <div style={{fontSize:10.5,color:c.fg,opacity:.85,marginTop:1}}>{c.ico} {tr(c.km, c.en)}</div>
            </div>
          );
        })}
      </div>

      {monthUnmarked.length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12,padding:'10px 13px',
          borderRadius:13,background:'rgba(202,138,4,.12)'}}>
          <span style={{flex:1,minWidth:0,fontSize:12,color:'#8A6206',lineHeight:1.5}}>
            {tr(`នៅ​សល់ ${monthUnmarked.length} មេរៀន​មិន​ទាន់​កត់​ក្នុង​ខែ​នេះ`, `${monthUnmarked.length} unmarked this month`)}
          </span>
          <Btn kind="accent" size="sm" onClick={markMonthPresent}
            style={{flexShrink:0,background:'#2FBF71',borderColor:'#2FBF71'}}>
            {tr('កត់​ទាំង​អស់​ថា «មក»','Mark all present')}
          </Btn>
        </div>
      )}

      <div style={{fontSize:11.5,color:'var(--ink-3)',lineHeight:1.6,marginBottom:9}}>
        {tr('ប៉ះ​ប្រអប់​ដើម្បី​កត់ — ម្ដង​មួយ​ជំហាន៖ មក → មកយឺត → អវត្តមាន → សុំច្បាប់ → លុប',
            'Tap a box to step through: present → late → absent → excused → clear')}
      </div>

      <Card>
        <div style={{overflowX:'auto',overflowY:'hidden',WebkitOverflowScrolling:'touch'}}>
          <div style={{minWidth: NAME_W + monthDays.length * CELL_W + SUM_W * 3}}>

            {/* day numbers */}
            <div style={{display:'flex',alignItems:'stretch',borderBottom:'1px solid var(--border)'}}>
              <div style={{position:'sticky',left:0,zIndex:2,width:NAME_W,flexShrink:0,
                background:'var(--surface)',borderRight:'1px solid var(--border)',
                display:'flex',alignItems:'flex-end',padding:'6px 10px 6px'}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--ink-3)'}}>{tr('សិស្ស','Student')}</span>
              </div>
              {monthDays.map(d => (
                <div key={d.iso} style={{width:CELL_W,flexShrink:0,textAlign:'center',padding:'5px 0 4px',
                  background: d.rest ? 'rgba(176,65,62,.13)' : 'transparent'}}>
                  <div style={{fontSize:9,color: d.rest ? '#b0413e' : 'var(--ink-3)',lineHeight:1.2}}>
                    {tr(DOW_KM[d.dow], DOW_EN[d.dow])}</div>
                  <div style={{fontSize:11,fontWeight:700,lineHeight:1.3,
                    color: d.rest ? '#b0413e' : (d.iso === todayStr() ? 'var(--accent)' : 'var(--ink)')}}>{d.dn}</div>
                </div>
              ))}
              {[tr('វត្តមាន','Rate'), tr('រៀន​រួច','Done'), tr('នៅ​សល់','Left')].map((t, k) => (
                <div key={k} style={{width:SUM_W,flexShrink:0,display:'flex',alignItems:'flex-end',justifyContent:'center',
                  padding:'6px 0',borderLeft: k ? '1px solid var(--border)' : 'none'}}>
                  <span style={{fontSize:10.5,fontWeight:700,color:'var(--ink-3)',textAlign:'center'}}>{t}</span>
                </div>
              ))}
            </div>

            {/* one row per student */}
            {roster.length === 0 ? (
              <div style={{padding:'28px 16px',textAlign:'center',fontSize:13,color:'var(--ink-3)'}}>
                {tr('គ្មាន​សិស្ស','No students')}
              </div>
            ) : roster.map((s, ri) => {
              const rowLessons = monthDays.flatMap(d => cells.get(s.id + '|' + d.iso) || []);
              const t = attendTally(rowLessons);
              const low = t.rate != null && t.rate < ATTEND_LOW;
              return (
                <div key={s.id} style={{display:'flex',alignItems:'stretch',
                  borderTop: ri ? '1px solid var(--border)' : 'none'}}>
                  <div style={{position:'sticky',left:0,zIndex:2,width:NAME_W,flexShrink:0,
                    background:'var(--surface)',borderRight:'1px solid var(--border)',
                    display:'flex',flexDirection:'column',justifyContent:'center',padding:'4px 10px'}}>
                    <div style={{fontSize:12.5,fontWeight:600,color:'var(--ink)',
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nm(s)}</div>
                    <div style={{fontSize:9.5,color:'var(--ink-3)'}}>
                      {tr('ខែ​នេះ','this month')} {t.hours}{tr('ម៉ោង','h')}</div>
                  </div>

                  {monthDays.map(d => {
                    const list = cells.get(s.id + '|' + d.iso) || [];
                    const has = list.length > 0;
                    const m = has ? ATTEND_MARKS[list[0].attend] : null;
                    const mixed = has && list.length > 1 && list.some(l => l.attend !== list[0].attend);
                    return (
                      <div key={d.iso} style={{width:CELL_W,height:CELL_H,flexShrink:0,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        background: d.rest ? 'rgba(176,65,62,.06)' : 'transparent'}}>
                        {has ? (
                          <button onClick={() => stepCell(list)}
                            title={`${nm(s)} · ${d.iso}${m ? ' · ' + tr(m.km, m.en) : ''}`}
                            aria-label={`${nm(s)} ${d.iso}`}
                            style={{width:24,height:24,borderRadius:7,cursor:'pointer',fontFamily:'inherit',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              fontSize:12,fontWeight:800,lineHeight:1,
                              border: m ? 'none' : '1.5px dashed var(--border-strong)',
                              background: m ? m.edge : 'transparent',
                              color: m ? '#fff' : 'var(--ink-3)'}}>
                            {mixed ? '•' : (m ? m.ico : '')}
                            {list.length > 1 && !mixed && (
                              <span style={{fontSize:7,marginLeft:1,opacity:.85}}>{list.length}</span>
                            )}
                          </button>
                        ) : (
                          <span style={{width:4,height:4,borderRadius:999,background:'var(--border)'}}/>
                        )}
                      </div>
                    );
                  })}

                  <div style={{width:SUM_W,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:12.5,fontWeight:800,
                      color: t.rate == null ? 'var(--ink-3)' : low ? ATTEND_MARKS.absent.fg : 'var(--ink)'}}>
                      {t.rate == null ? '—' : t.rate + '%'}</span>
                  </div>
                  <div style={{width:SUM_W,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                    borderLeft:'1px solid var(--border)'}}>
                    <span style={{fontSize:12.5,fontWeight:700,color:'var(--ink)'}}>{doneHours(s)}h</span>
                  </div>
                  <div style={{width:SUM_W,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                    borderLeft:'1px solid var(--border)'}}>
                    {leftHours(s) == null ? (
                      <span style={{fontSize:12,color:'var(--ink-3)'}}>—</span>
                    ) : (
                      <span style={{fontSize:12.5,fontWeight:800,
                        color: leftHours(s) === 0 ? ATTEND_MARKS.present.fg : 'var(--ink-2)'}}>
                        {leftHours(s) === 0 ? tr('ចប់ ✓','Done ✓') : leftHours(s) + 'h'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',marginTop:10,fontSize:11,color:'var(--ink-3)'}}>
        {ATTEND_ORDER.map(k => (
          <span key={k} style={{display:'inline-flex',alignItems:'center',gap:5}}>
            <span style={{width:16,height:16,borderRadius:5,background:ATTEND_MARKS[k].edge,color:'#fff',
              display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800}}>
              {ATTEND_MARKS[k].ico}</span>
            {tr(ATTEND_MARKS[k].km, ATTEND_MARKS[k].en)}
          </span>
        ))}
        <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
          <span style={{width:16,height:16,borderRadius:5,border:'1.5px dashed var(--border-strong)'}}/>
          {tr('មាន​មេរៀន — មិន​ទាន់​កត់','Lesson, not marked')}
        </span>
        <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
          <span style={{width:4,height:4,borderRadius:999,background:'var(--border)'}}/>
          {tr('គ្មាន​មេរៀន','No lesson')}
        </span>
      </div>
    </>
  );


  // ── overview ──────────────────────────────────────────────────────────────
  const inSpan = (l) => {
    if (span === 'all') return true;
    const d = new Date(l.date + 'T00:00:00'), now = new Date(todayStr() + 'T00:00:00');
    if (isNaN(d)) return false;
    if (span === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  };

  const rows = (STUDENTS || [])
    .filter(s => s && s.status !== 'Former')
    .map(s => ({ s, t: attendTally((LESSONS || []).filter(l => l.studentId === s.id && inSpan(l) && mine(l))) }))
    .filter(r => r.t.marked + r.t.unmarked > 0)
    .sort((a, b) => (a.t.rate ?? 999) - (b.t.rate ?? 999));

  const spanLabel = span === 'week' ? tr('សប្ដាហ៍​នេះ','This week')
                  : span === 'month' ? tr('ខែ​នេះ','This month') : tr('វគ្គ​ទាំង​មូល','Everything');
  const spanDates = (() => {
    const all = rows.flatMap(r => (LESSONS || []).filter(l => l.studentId === r.s.id && inSpan(l) && attendCountable(l)).map(l => l.date)).sort();
    return { from: all[0] || todayStr(), to: all[all.length - 1] || todayStr() };
  })();

  const overall = rows.reduce((a, r) => {
    ATTEND_ORDER.forEach(k => { a[k] += r.t[k]; }); a.marked += r.t.marked; return a;
  }, { present:0, late:0, absent:0, excused:0, marked:0 });
  const avgRate = overall.marked ? Math.round(((overall.present + overall.late) / overall.marked) * 100) : 0;

  const doPDF = () => {
    if (!rows.length) { toast(tr('គ្មាន​ទិន្នន័យ​ដើម្បី​បង្ហាញ','Nothing to report'), 'warn'); return; }
    attendanceReportPDF(rows, { from: spanDates.from, to: spanDates.to, today: todayStr(), scope: spanLabel }, lang);
  };
  const doCSV = () => {
    if (!rows.length) { toast(tr('គ្មាន​ទិន្នន័យ​ដើម្បី​បង្ហាញ','Nothing to export'), 'warn'); return; }
    const cols = [
      [tr('សិស្ស','Student'), r => nm(r.s)],
      [tr('លេខ​សម្គាល់','ID'), r => r.s.id],
      ...ATTEND_ORDER.map(k => [tr(ATTEND_MARKS[k].km, ATTEND_MARKS[k].en), r => r.t[k]]),
      [tr('មិន​ទាន់​កត់','Not marked'), r => r.t.unmarked],
      [tr('វត្តមាន %','Attendance %'), r => (r.t.rate == null ? '' : r.t.rate)],
      [tr('ម៉ោង​ខែ​នេះ','Hours this month'), r => r.t.hours],
      [tr('សរុប​ម៉ោង​រៀន','Hours done total'), r => Math.max(0, Math.round((r.s.hours || 0) * 10) / 10)],
      [tr('ម៉ោង​នៅ​សល់','Hours left'), r => (r.s.target ? Math.max(0, Math.round((r.s.target - (r.s.hours || 0)) * 10) / 10) : '')],
      [tr('ម៉ោង​គោលដៅ','Target hours'), r => r.s.target || ''],
    ];
    const ok = (typeof exportCSV === 'function') &&
      exportCSV(`anzen-attendance-${span}-${todayStr()}.csv`, cols, rows);
    toast(ok ? tr('បាន​ទាញ​យក Excel ✓','Exported ✓') : tr('ទាញ​យក​មិន​បាន','Export failed'), ok ? 'good' : 'warn');
  };

  const overviewView = (
    <>
      <div style={{display:'flex',gap:4,marginBottom:12,background:'var(--surface-3, var(--surface-muted))',borderRadius:13,padding:3}}>
        {[['week', tr('សប្ដាហ៍​នេះ','Week')], ['month', tr('ខែ​នេះ','Month')], ['all', tr('ទាំង​មូល','All')]].map(([k, t]) => (
          <button key={k} onClick={() => setSpan(k)}
            style={{flex:1,height:38,border:'none',borderRadius:10,cursor:'pointer',fontFamily:'inherit',
              fontSize:12.5,fontWeight: span === k ? 700 : 500,
              background: span === k ? 'var(--surface)' : 'transparent',
              color: span === k ? 'var(--accent)' : 'var(--ink-3)'}}>{t}</button>
        ))}
      </div>

      <div style={{borderRadius:18,padding:'15px 17px',marginBottom:12,color:'#fff',
        background:'linear-gradient(135deg,#1A4785,#2E6FD0 68%,#4C8BE8)'}}>
        <div style={{fontSize:11.5,opacity:.8}}>{tr('វត្តមាន​មធ្យម','Average attendance')} · {spanLabel}</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:10}}>
          <div style={{fontSize:44,fontWeight:900,lineHeight:.95,letterSpacing:'-.035em'}}>{avgRate}%</div>
          <div style={{fontSize:13,paddingBottom:7,opacity:.9}}>
            {tr(`នៃ ${overall.marked} មេរៀន​ដែល​បាន​កត់`, `of ${overall.marked} marked lessons`)}
          </div>
        </div>
        <div style={{display:'flex',gap:7,marginTop:13}}>
          {ATTEND_ORDER.map(k => (
            <div key={k} style={{flex:1,background:'rgba(255,255,255,.16)',borderRadius:12,padding:'8px 10px'}}>
              <div style={{fontSize:17,fontWeight:800,lineHeight:1.1}}>{overall[k]}</div>
              <div style={{fontSize:10,opacity:.82}}>{tr(ATTEND_MARKS[k].km, ATTEND_MARKS[k].en)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'flex',gap:9,marginBottom:12}}>
        <Btn kind="accent" size="lg" onClick={doPDF} style={{flex:1,justifyContent:'center'}}
          icon={<Icon name="download" size={14}/>}>{tr('របាយការណ៍ PDF','Report PDF')}</Btn>
        <Btn kind="ghost" size="lg" onClick={doCSV} style={{flex:1,justifyContent:'center'}}
          icon={<Icon name="sheet" size={14}/>}>{tr('ទាញ​យក Excel','Export Excel')}</Btn>
      </div>

      {rows.length === 0 ? (
        <Card><div style={{padding:'28px 16px',textAlign:'center',fontSize:13,color:'var(--ink-3)'}}>
          {tr('គ្មាន​មេរៀន​ក្នុង​ចន្លោះ​ពេល​នេះ','No lessons in this period')}
        </div></Card>
      ) : (
        <Card>
          {rows.map((r, i) => {
            const low = r.t.rate != null && r.t.rate < ATTEND_LOW;
            const tot = r.t.marked || 1;
            return (
              <div key={r.s.id} style={{padding:'11px 14px',borderTop: i ? '1px solid var(--border)' : 'none'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:'var(--ink)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nm(r.s)}</div>
                    <div style={{fontSize:10.5,color:'var(--ink-3)'}}>
                      {r.t.hours}{r.s.target ? '/' + r.s.target : ''} {tr('ម៉ោង','h')}
                      {r.t.unmarked ? ` · ${r.t.unmarked} ${tr('មិន​ទាន់​កត់','unmarked')}` : ''}
                    </div>
                  </div>
                  {low && (
                    <span style={{flexShrink:0,background:ATTEND_MARKS.absent.bg,color:ATTEND_MARKS.absent.fg,
                      fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999}}>{tr('ត្រូវ​តាម​ដាន','Follow up')}</span>
                  )}
                  <div style={{flexShrink:0,textAlign:'right',width:52}}>
                    <div style={{fontSize:17,fontWeight:800,lineHeight:1.1,
                      color: low ? ATTEND_MARKS.absent.fg : 'var(--ink)'}}>
                      {r.t.rate == null ? '—' : r.t.rate + '%'}</div>
                    <div style={{fontSize:9.5,color:'var(--ink-3)'}}>{tr('វត្តមាន','rate')}</div>
                  </div>
                </div>
                <div style={{display:'flex',height:7,borderRadius:999,overflow:'hidden',background:'var(--border)'}}>
                  {ATTEND_ORDER.map(k => r.t[k] ? (
                    <span key={k} style={{width:`${(r.t[k] / tot * 100).toFixed(1)}%`,background:ATTEND_MARKS[k].edge}}/>
                  ) : null)}
                </div>
                <div style={{display:'flex',gap:11,marginTop:6,fontSize:10.5,color:'var(--ink-3)'}}>
                  {ATTEND_ORDER.map(k => <span key={k}>{tr(ATTEND_MARKS[k].km, ATTEND_MARKS[k].en)} {r.t[k]}</span>)}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{borderRadius:18,padding:'13px 14px',color:'#fff',
        background:'linear-gradient(135deg,#243a66,#365a9c 60%,#4f7bc0)',
        boxShadow:'0 10px 24px rgba(36,58,102,.28)'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <Icon name="clipboard" size={18}/>
          <div style={{fontSize:16,fontWeight:800}}>{tr('វត្តមាន​សិស្ស','Attendance')}</div>
          {role !== 'admin' && myInstId && (
            <span style={{marginLeft:'auto',fontSize:11,opacity:.9}}>{tr('មេរៀន​របស់​ខ្ញុំ','My lessons')}</span>
          )}
        </div>
        <div style={{display:'flex',gap:4,marginTop:11,background:'rgba(255,255,255,.14)',borderRadius:12,padding:3}}>
          {[['day', tr('កត់​វត្តមាន','Mark')], ['roll', tr('ទិដ្ឋភាព​រួម','Overview')]].map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{flex:1,height:36,border:'none',borderRadius:9,cursor:'pointer',fontFamily:'inherit',
                fontSize:12.5,fontWeight: tab === k ? 700 : 500,
                background: tab === k ? '#fff' : 'transparent',
                color: tab === k ? '#243a66' : '#fff'}}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'day' ? dayView : overviewView}
    </div>
  );
};

Object.assign(window, { ATTEND_MARKS, attendApply, attendTally, attendanceReportPDF });
