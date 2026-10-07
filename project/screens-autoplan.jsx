// screens-autoplan.jsx — Draft a whole intake's timetable from a few numbers.
//
// Building a term by hand is slow once there are a dozen students, and the
// result is hard to judge until it is all laid out. This takes the counts
// (students / instructors / cars), the opening hours and the weekdays, lays a
// draft over the free slots, and shows it as a printable sheet. Nothing enters
// LESSONS until the user confirms on that sheet.
//
// Three pieces: autoPlanBuild (pure), autoPlanPDF (the sheet), AutoPlanModal
// (the form). Cars rotate slot by slot rather than belonging to an instructor.

const AUTOPLAN_DOW    = [1, 2, 3, 4, 5, 6, 0];        // Mon…Sun, as JS day numbers
const AUTOPLAN_DOW_KM = ['ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស', 'អា'];
const AUTOPLAN_DOW_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const autoPlanISO = (d) => {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const autoPlanOverlaps = (aH, aLen, bH, bLen) => aH < bH + bLen && bH < aH + aLen;

// Who is available to be scheduled at all: students still training, every
// instructor, and any car not sitting in the workshop.
// `trans` of 'MT' or 'AT' narrows it to that gearbox: the cars must match, and
// so must the students who are already enrolled for one. A student record with
// no transmission set is left in either way rather than silently dropped.
const autoPlanLeftOut = (trans) => {
  const t = trans === 'MT' || trans === 'AT' ? trans : '';
  const S = (typeof STUDENTS !== 'undefined' ? STUDENTS : []).filter(Boolean);
  const V = (typeof VEHICLES !== 'undefined' ? VEHICLES : []).filter(Boolean);
  const finished = s => s.status === 'Completed' || s.status === 'Former' || s.status === 'Cleared';
  return {
    studentsTotal: S.length,
    studentsFinished: S.filter(finished).length,
    studentsOtherGear: t ? S.filter(s => !finished(s) && s.trans && s.trans !== t).length : 0,
    vehiclesTotal: V.length,
    vehiclesWorkshop: V.filter(v => v.status === 'Workshop').length,
    vehiclesOtherGear: t ? V.filter(v => v.status !== 'Workshop' && v.trans !== t).length : 0,
  };
};

const autoPlanPools = (trans) => {
  const t = trans === 'MT' || trans === 'AT' ? trans : '';
  return {
    students: (typeof STUDENTS !== 'undefined' ? STUDENTS : [])
      .filter(s => s && s.status !== 'Completed' && s.status !== 'Former' && s.status !== 'Cleared')
      .filter(s => !t || !s.trans || s.trans === t),
    instructors: (typeof INSTRUCTORS !== 'undefined' ? INSTRUCTORS : []).filter(Boolean),
    vehicles: (typeof VEHICLES !== 'undefined' ? VEHICLES : [])
      .filter(v => v && v.status !== 'Workshop')
      .filter(v => !t || v.trans === t),
  };
};

// ── Who the plan is for ─────────────────────────────────────────────────────
// Real people first, so a plan that fits the school is made of its own staff
// and cars, then numbered stand-ins for whatever was asked for beyond them.
const autoPlanRoster = (o) => {
  const pools = autoPlanPools(o.trans);
  // A count takes whoever is at the top of the list, which is right for "what
  // if twenty enrolled" and wrong once the plan is for particular people. A
  // pick names them; an empty pick falls back to the count.
  const take = (real, want, pick, make) => {
    const chosen = (pick || []).filter(Boolean);
    if (chosen.length) {
      // Kept in the order they were picked, not the order of the roll: the
      // planner takes the earliest sitting for whoever comes first here.
      return chosen.map(id => real.find(x => x.id === id)).filter(Boolean);
    }
    const out = real.slice(0, Math.max(0, want));
    for (let n = out.length; n < want; n++) out.push(make(n + 1));
    return out;
  };
  const students = take(pools.students, o.studentCount, o.pickS,
    n => ({ id: 'NEW-S' + n, name: 'សិស្សថ្មី ' + n, en: 'New student ' + n, newSeq: n, isNew: true }));
  const instructors = take(pools.instructors, o.instCount, o.pickI,
    n => ({ id: 'NEW-I' + n, name: 'គ្រូថ្មី ' + n, en: 'New instructor ' + n, newSeq: n, isNew: true }));
  const vehicles = take(pools.vehicles, o.vehCount, o.pickV,
    n => ({ id: 'NEW-V' + n, plate: '', trans: o.trans || '', newSeq: n, isNew: true }));
  return {
    students, instructors, vehicles, pools,
    projected: [...students, ...instructors, ...vehicles].some(x => x.isNew),
  };
};

// ── Slots in a day ──────────────────────────────────────────────────────────
// The day is cut into sittings of at most maxLen, but the tail of a stretch is
// kept rather than discarded: 13:00-16:00 with two-hour sittings is 13-15 and
// then 15-16, not 13-15 and an idle hour.
const autoPlanSlots = (o) => {
  const maxLen = Math.max(1, o.maxLen), minLen = Math.max(1, Math.min(o.minLen, maxLen));
  const hasLunch = o.lunchTo > o.lunchFrom && o.lunchFrom >= o.dayStart && o.lunchTo <= o.dayEnd;
  const stretches = hasLunch
    ? [[o.dayStart, o.lunchFrom], [o.lunchTo, o.dayEnd]]
    : [[o.dayStart, o.dayEnd]];
  const out = [];
  stretches.forEach(([from, to]) => {
    for (let h = from; to - h >= minLen; ) {
      const len = Math.min(maxLen, to - h);
      out.push({ h, len });
      h += len;
    }
  });
  return out;
};

// ── The planner ─────────────────────────────────────────────────────────────
// Walks forward one day at a time. For each sitting it reads who the real
// schedule already has busy, then pairs the free instructors and cars with
// students who still owe hours. A sitting can be shorter than its slot - some
// students take an hour where others take two - and a course can be told to
// last a minimum number of days, which thins out how much anyone does per day.
const autoPlanBuild = (o) => {
  const roster = autoPlanRoster(o);
  const students    = roster.students;
  const instructors = roster.instructors;
  const vehicles    = roster.vehicles;
  const maxLen    = Math.max(1, o.maxLen);
  const minLen    = Math.max(1, Math.min(o.minLen, maxLen));
  const maxPerDay = Math.max(minLen, o.maxPerDay);
  const grid = autoPlanSlots(o);
  const existing = (typeof LESSONS !== 'undefined' ? LESSONS : []).filter(l => l && l.status !== 'cancelled');

  // A minimum course length is given in calendar days, which is how a school
  // thinks about it; pacing happens in teaching days, so convert through the
  // teaching week. A longer course means coming in less often, NOT sitting in
  // the car for less time — an hour in a two-hour slot wastes the slot and the
  // student would rather have the full sitting and a rest day after it.
  const perWeek = Math.max(1, o.weekdays.length);
  const spread = o.minSpanDays > 0 ? Math.max(1, Math.round(o.minSpanDays * perWeek / 7)) : 0;
  const visits = Math.max(1, Math.ceil(o.totalHours / maxPerDay));   // attendances at full load
  // How many teaching days apart a student's lessons sit. The school sets it
  // directly; a minimum course length can only widen it further.
  const gap = Math.max(1, o.gapDays || 1, spread ? Math.round(spread / visits) : 1);

  const need = new Map(students.map(s => [s.id, o.totalHours]));
  const lastSeen = new Map();          // teaching-day index of each student's last lesson
  let teachIndex = -1;
  const days = [];
  let skipped = 0, vehCursor = 0, instCursor = 0;
  let cursor = new Date(o.startDate + 'T00:00:00');
  if (isNaN(cursor.getTime())) cursor = new Date();

  // Calendar days to walk, not teaching days: a thin school with one car can
  // legitimately need a couple of years, and stopping early would quietly
  // drop students instead of reporting them as short.
  for (let guard = 0; guard < 1100; guard++) {
    if (![...need.values()].some(v => v > 0)) break;
    const iso = autoPlanISO(cursor);

    if (o.weekdays.includes(cursor.getDay()) && students.length && instructors.length && vehicles.length && grid.length) {
      const sameDay = existing.filter(l => l.date === iso);
      const todayH = new Map();
      const slots = [];

      teachIndex += 1;
      // Who is due today. With no minimum span everyone is due every day.
      const due = new Set(students
        .filter(s => teachIndex - (lastSeen.has(s.id) ? lastSeen.get(s.id) : -gap) >= gap)
        .map(s => s.id));

      grid.forEach(({ h, len: slotLen }) => {
        const clash = o.avoidExisting ? sameDay.filter(l => autoPlanOverlaps(h, slotLen, l.h, l.len || 1)) : [];
        const busyI = new Set(clash.map(l => l.instId).filter(Boolean));
        const busyV = new Set(clash.map(l => l.veh).filter(Boolean));
        const busyS = new Set(clash.map(l => l.studentId).filter(Boolean));
        skipped += clash.length;

        const freeI = instructors.filter(i => !busyI.has(i.id));
        const freeV = vehicles.filter(v => !busyV.has(v.id));
        const cap = Math.min(freeI.length, freeV.length);
        if (cap <= 0) return;

        // What this student would take here, or 0 if nothing useful fits. A
        // final stub below minLen is still worth giving - it is the last of
        // their hours, not a badly-sized sitting.
        const takeFor = (s) => {
          const rem = need.get(s.id) || 0;
          if (rem <= 0 || busyS.has(s.id)) return 0;
          if (!due.has(s.id) && !(todayH.get(s.id) > 0)) return 0;   // resting today
          const room = maxPerDay - (todayH.get(s.id) || 0);
          const take = Math.min(slotLen, rem, room);
          if (take <= 0) return 0;
          return (take >= minLen || take >= rem) ? take : 0;
        };

        // Students already under way come first, the most overdue of them
        // ahead of the rest, so their lessons stay `gap` days apart. Someone
        // who has not started yet waits for a free day rather than taking a
        // slot from someone mid-course — which is what pushed a student's
        // second lesson days away from their first.
        const dueAt = s => lastSeen.has(s.id) ? lastSeen.get(s.id) + gap : Infinity;
        const queue = students.filter(s => takeFor(s) > 0).sort((a, b) => {
          const da = dueAt(a), db = dueAt(b);
          if (da !== db) return da - db;
          return (need.get(b.id) || 0) - (need.get(a.id) || 0);
        });
        if (!queue.length) return;

        const items = queue.slice(0, cap).map((s, k) => {
          const take = takeFor(s);
          need.set(s.id, need.get(s.id) - take);
          if (!(todayH.get(s.id) > 0)) lastSeen.set(s.id, teachIndex);
          todayH.set(s.id, (todayH.get(s.id) || 0) + take);
          return {
            student: s, len: take,
            inst: freeI[(instCursor + k) % freeI.length],
            veh:  freeV[(vehCursor  + k) % freeV.length],
          };
        });
        // Shift both rotations so the next slot starts with different pairings.
        vehCursor  = (vehCursor  + items.length) % freeV.length;
        instCursor = (instCursor + items.length) % freeI.length;
        slots.push({ h, len: slotLen, items, clashes: clash.length });
      });
      if (slots.length) days.push({ date: iso, dow: cursor.getDay(), slots });
    }
    cursor = new Date(cursor.getTime() + 86400000);
  }

  const sessions = days.reduce((n, d) => n + d.slots.reduce((m, s) => m + s.items.length, 0), 0);
  return {
    days, students, instructors, vehicles,
    projected: roster.projected,
    stats: {
      dayCount: days.length,
      sessions,
      hoursEach: o.totalHours,
      skipped,
      short: [...need.entries()].filter(([, v]) => v > 0).length,
      from: days.length ? days[0].date : '—',
      to:   days.length ? days[days.length - 1].date : '—',
    },
  };
};

// Turn the draft into real lesson records. IDs are handed out in one pass here
// rather than through nextLessonId() per lesson, which would re-scan LESSONS
// every time and collide until each one is pushed.
const autoPlanToLessons = (plan, o) => {
  const nums = (typeof LESSONS !== 'undefined' ? LESSONS : [])
    .map(l => parseInt(String(l.id || '').replace('L-', ''))).filter(n => !isNaN(n));
  let n = nums.length ? Math.max(...nums) : 0;
  const stamp = new Date().toISOString();
  const out = [];
  plan.days.forEach(d => d.slots.forEach(s => s.items.forEach(it => {
    n += 1;
    out.push({
      id: 'L-' + String(n).padStart(4, '0'),
      studentId: it.student.id, date: d.date, h: s.h, len: it.len || s.len,
      instId: it.inst.id, guests: [], veh: it.veh.id,
      type: '', color: 'a', phase: o.phase,
      pickup: '', location: '', note: '',
      status: 'scheduled', autoPlan: true,
      createdBy: window.__currentUserName || '', createdAt: stamp,
    });
  })));
  return out;
};

// ── The printable sheet ─────────────────────────────────────────────────────
// Same shape as the schedule PDF: an in-app overlay (never a new tab, which
// traps phone users) plus a print stylesheet that hides the rest of the app.
// A draft is about shape, not about who exactly sits where, so a hue per
// student is what makes it readable. Golden-angle spacing keeps neighbouring
// numbers far apart on the wheel, which matters more than a fixed palette once
// there are a dozen students.
const autoPlanHue = (i) => (i * 137.508) % 360;
const autoPlanTint = (i) => ({
  bg:   `hsl(${autoPlanHue(i).toFixed(1)},72%,93%)`,
  edge: `hsl(${autoPlanHue(i).toFixed(1)},58%,52%)`,
  ink:  `hsl(${autoPlanHue(i).toFixed(1)},62%,27%)`,
});

// `lang` overrides the app's language for this sheet only — the toolbar toggle
// re-invokes the whole thing, exactly as the schedule PDF does.
const autoPlanPDF = (plan, o, onSave, lang) => {
  const HOST_ID = '__autoPlanHost';
  document.getElementById(HOST_ID)?.remove();
  document.getElementById('__autoPlanStyle')?.remove();

  const ss = window.__schoolSettings || {};
  const curLang = (lang || o.pdfLang || window.__anzenLang || 'km') === 'en' ? 'en' : 'km';
  const L  = (km, en) => (curLang === 'km' ? km : en);
  const kd = s => curLang === 'km' ? String(s).replace(/[0-9]/g, d => '០១២៣៤៥៦៧៨៩'[+d]) : String(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  // Until the real people are pinned to the slots, numbered placeholders say
  // more than real names do — the draft is about how many and when.
  const sIdx = new Map(plan.students.map((s, i) => [s.id, i]));
  const iIdx = new Map(plan.instructors.map((i, k) => [i.id, k]));
  const generic = o.names !== 'real';
  const sName = s => generic
    ? L(`សិស្ស ${kd((sIdx.get(s.id) ?? 0) + 1)}`, `Student ${(sIdx.get(s.id) ?? 0) + 1}`)
    : esc(curLang === 'km' ? (s.name || s.en || s.id) : (s.en || s.name || s.id));
  const vName = v => v.plate ? esc(v.plate) + (v.trans ? ' · ' + esc(v.trans) : '')
    : L(`ឡាន ${kd(v.newSeq || 1)}`, `Car ${v.newSeq || 1}`) + (v.trans ? ' · ' + esc(v.trans) : '');
  const iName = i => generic
    ? L(`គ្រូ ${kd((iIdx.get(i.id) ?? 0) + 1)}`, `Instructor ${(iIdx.get(i.id) ?? 0) + 1}`)
    : esc(curLang === 'km' ? (i.name || i.en || i.id) : (i.en || i.name || i.id));
  const DAYS = curLang === 'km'
    ? ['អាទិត្យ','ច័ន្ទ','អង្គារ','ពុធ','ព្រហស្បតិ៍','សុក្រ','សៅរ៍']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmtH = h => kd(String(h).padStart(2, '0') + ':00');
  const st = plan.stats;
  const insts = plan.instructors;

  const tile = (v, lab, bg, ink) => `
    <div style="flex:1;min-width:0;border-radius:9px;background:${bg};padding:8px 10px">
      <div style="font-size:18px;font-weight:800;color:${ink};line-height:1.15">${kd(v)}</div>
      <div style="font-size:10px;color:#475467;margin-top:2px">${lab}</div>
    </div>`;

  // Hours done after each lesson. Sittings vary in length now, so neither "how
  // long is this one" nor "how far along is this student" can be read off the
  // grid. Rebuilt on every render, so re-opening the sheet in another language
  // or view gives the same numbers.
  const done = new Map();
  const runningTotal = new Map();
  plan.days.forEach(d => d.slots.forEach(sl => sl.items.forEach(it => {
    const n = (runningTotal.get(it.student.id) || 0) + (it.len || sl.len);
    runningTotal.set(it.student.id, n);
    done.set(it, n);
  })));
  const hoursTag = (it, slotLen) => {
    const end = done.get(it) || 0, len = it.len || slotLen;
    const list = [];
    for (let n = end - len + 1; n <= end; n++) list.push(kd(n));
    return list.join(',');
  };
  const progressTag = (it) => `${kd(done.get(it) || 0)}/${kd(o.totalHours)}h`;

  const dayBlock = (d) => {
    const rows = d.slots.map((s, si) => {
      const by = {}; s.items.forEach(it => { by[it.inst.id] = it; });
      const zebra = si % 2 ? '#FAFBFD' : '#fff';
      const cells = insts.map(i => {
        const it = by[i.id];
        if (!it) return `<td style="padding:5px;border:1px solid #E6EAF1;background:${zebra};color:#C8CFDA;text-align:center">—</td>`;
        const c = autoPlanTint(sIdx.get(it.student.id) ?? 0);
        const len = it.len || s.len;
        const ends = len < s.len ? ` ${fmtH(s.h)}–${fmtH(s.h + len)}` : '';
        return `<td style="padding:4px 5px;border:1px solid #E6EAF1;background:${zebra}">
          <div style="border-radius:5px;background:${c.bg};border-left:3px solid ${c.edge};padding:3px 6px">
            <div style="font-size:10.5px;font-weight:700;color:${c.ink};line-height:1.3">${sName(it.student)}
              <span style="display:inline-block;margin-left:3px;padding:0 4px;border-radius:3px;background:${c.edge};color:#fff;font-size:9px;font-weight:800">${hoursTag(it, s.len)}</span></div>
            <div style="font-size:9px;color:#5A6B82;line-height:1.3">${vName(it.veh)}${ends}</div>
            <div style="font-size:9px;color:${c.ink};line-height:1.3;opacity:.8">${progressTag(it)}</div>
          </div></td>`;
      }).join('');
      return `<tr>
        <td style="padding:5px;border:1px solid #E6EAF1;background:${zebra};font-size:10px;font-weight:700;color:#344054;white-space:nowrap">${fmtH(s.h)}–${fmtH(s.h + s.len)}</td>
        ${cells}</tr>`;
    }).join('');
    const n = d.slots.reduce((m, s) => m + s.items.length, 0);
    const cl = d.slots.reduce((m, s) => m + s.clashes, 0);
    return `<div class="ap-day">
      <div style="margin:12px 0 5px;display:flex;align-items:baseline;gap:8px">
        <b style="font-size:12.5px;color:#101828">${DAYS[d.dow]} · ${kd(d.date)}</b>
        <span style="font-size:10.5px;color:#667085">${kd(n)} ${L('វគ្គ','sessions')}</span>
        ${cl ? `<span style="font-size:10px;color:#B25E09;background:#FEF3E2;border-radius:5px;padding:1px 6px">${L('វៀស','skipped')} ${kd(cl)}</span>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="width:86px;padding:6px 5px;border:1px solid #D6DEEA;background:#EEF2F8;font-size:9.5px;color:#475467;text-align:left">${L('ម៉ោង','Time')}</th>
          ${insts.map(i => `<th style="padding:6px 5px;border:1px solid #D6DEEA;background:#EEF2F8;font-size:9.5px;color:#475467;text-align:left">${iName(i)}</th>`).join('')}
        </tr></thead>
        <tbody>${rows}</tbody></table></div>`;
  };

  const monthGrid = () => {
    const byDate = new Map(plan.days.map(d => [d.date, d]));
    const first = new Date(plan.days[0].date + 'T00:00:00');
    const last  = new Date(plan.days[plan.days.length - 1].date + 'T00:00:00');
    const MONTHS = curLang === 'km'
      ? ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ']
      : ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const HEAD = curLang === 'km' ? ['ច','អ','ព','ព្រ','សុ','ស','អា'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const out = [];

    for (let m = new Date(first.getFullYear(), first.getMonth(), 1);
         m <= last; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
      const y = m.getFullYear(), mo = m.getMonth();
      const daysIn = new Date(y, mo + 1, 0).getDate();
      const lead = (new Date(y, mo, 1).getDay() + 6) % 7;   // Monday-first
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push('<td style="border:1px solid #E6EAF1;background:#F7F9FC"></td>');
      for (let dn = 1; dn <= daysIn; dn++) {
        const iso = autoPlanISO(new Date(y, mo, dn));
        const d = byDate.get(iso);
        const chips = d ? d.slots.flatMap(sl => sl.items.map(it => {
          const c = autoPlanTint(sIdx.get(it.student.id) ?? 0);
          return `<div style="border-radius:3px;background:${c.bg};border-left:2px solid ${c.edge};padding:1px 3px;margin-top:1px;font-size:8px;line-height:1.35;color:${c.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${fmtH(sl.h)} ${sName(it.student)} <b>${hoursTag(it, sl.len)}</b></div>`;
        })).join('') : '';
        const total = d ? d.slots.reduce((n, sl) => n + sl.items.length, 0) : 0;
        cells.push(`<td style="vertical-align:top;border:1px solid #E6EAF1;background:${d ? '#fff' : '#F7F9FC'};padding:2px 3px;height:62px">
          <div style="display:flex;align-items:baseline;gap:3px">
            <span style="font-size:9px;font-weight:700;color:${d ? '#101828' : '#B6BFCC'}">${kd(dn)}</span>
            ${total ? `<span style="font-size:7.5px;color:#98A2B3">${kd(total)}</span>` : ''}
          </div>${chips}</td>`);
      }
      while (cells.length % 7) cells.push('<td style="border:1px solid #E6EAF1;background:#F7F9FC"></td>');
      const rows = [];
      for (let i = 0; i < cells.length; i += 7) rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
      out.push(`<div class="ap-day">
        <div style="margin:13px 0 5px;font-size:13px;font-weight:800;color:#101828">${MONTHS[mo]} ${kd(y)}</div>
        <table style="width:100%;table-layout:fixed;border-collapse:collapse">
          <thead><tr>${HEAD.map(h => `<th style="padding:4px;border:1px solid #D6DEEA;background:#EEF2F8;font-size:9px;color:#475467">${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.join('')}</tbody></table></div>`);
    }
    return out.join('');
  };

  const paper = `
    <div style="display:flex;align-items:flex-start;gap:12px;padding-bottom:9px;border-bottom:2px solid #1A4F96">
      <div style="flex:1;min-width:0">
        <div style="font-size:16px;font-weight:800;color:#101828">${esc(ss.name || 'Anzen Driving School')}</div>
        <div style="font-size:10.5px;color:#667085">${plan.projected
          ? L('ការប៉ាន់ស្មាន — បើទទួលសិស្សចំនួននេះ','A projection — if this many students enrolled')
          : L('កាលវិភាគបឋម — គំរូ មិនទាន់រក្សាទុក','Draft timetable — not saved yet')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:700;color:#1A4F96">${L('កាលវិភាគស្វ័យប្រវត្ត','Auto schedule')}</div>
        <div style="font-size:10.5px;color:#667085;margin-top:1px">${kd(st.from)} → ${kd(st.to)}</div>
      </div>
    </div>
    <div style="font-size:10.5px;color:#667085;padding:7px 0 9px;line-height:1.8">
      ${L('សិស្ស','Students')} ${kd(plan.students.length)} ·
      ${L('គ្រូ','Instructors')} ${kd(plan.instructors.length)} ·
      ${L('ឡាន','Cars')} ${kd(plan.vehicles.length)} ·
      ${fmtH(o.dayStart)}–${fmtH(o.dayEnd)}${o.lunchTo > o.lunchFrom ? ` (${L('សម្រាក','break')} ${fmtH(o.lunchFrom)}–${fmtH(o.lunchTo)})` : ''} ·
      ${L('១ វគ្គ','sitting')} ${kd(o.minLen)}–${kd(o.maxLen)}h ·
      ${L('អតិបរមា','max')} ${kd(o.maxPerDay)}h/${L('ថ្ងៃ','day')}/${L('សិស្ស','student')} ·
      ${L('វគ្គសិក្សា','phase')} ${esc(o.phase)}${o.trans ? ' · ' + esc(o.trans) : ''}
    </div>
    <div style="font-size:10px;color:#98A2B3;padding-bottom:7px">
      ${L('លេខក្រោយឈ្មោះ = ម៉ោងទីប៉ុន្មាននៃវគ្គ (ឧ. 1,2 = ម៉ោងទី ១ និង ២)',
          'The number after a name is which hours of the course it covers (1,2 = the 1st and 2nd hour)')}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px 9px;padding-bottom:9px">
      ${plan.students.map((stu, i) => { const c = autoPlanTint(i); return `
        <span style="display:inline-flex;align-items:center;gap:4px;font-size:9.5px;color:#475467">
          <span style="width:9px;height:9px;border-radius:2px;background:${c.bg};border-left:3px solid ${c.edge}"></span>
          ${sName(stu)}</span>`; }).join('')}
    </div>
    <div style="display:flex;gap:7">
      ${tile(st.dayCount, L('ថ្ងៃរៀន','Teaching days'), '#EAF1FF', '#1A4F96')}
      ${tile(st.sessions, L('វគ្គសរុប','Total sessions'), '#E7F7EE', '#12804A')}
      ${tile(st.hoursEach + 'h', L('ម៉ោង / សិស្ស','Hours each'), '#FEF3E2', '#B25E09')}
      ${tile(st.skipped, L('ម៉ោងជាន់គ្នា — វៀស','Clashes avoided'), '#F0F2F6', '#475467')}
    </div>
    ${o.view === 'calendar' ? monthGrid() : plan.days.map(dayBlock).join('')}
    ${st.short ? `<div style="margin-top:11px;padding:8px 10px;border-radius:8px;background:#FDECE7;font-size:10.5px;color:#8A2C06;line-height:1.6">
      ${L('សិស្ស','Students')} ${kd(st.short)} ${L('នាក់មិនទាន់គ្រប់ម៉ោងនៅថ្ងៃទាំងនេះ — បន្ថែមថ្ងៃរៀន គ្រូ ឬឡាន។',
          'are still short of hours within these days — add teaching days, instructors or cars.')}</div>` : ''}
    <div style="display:flex;margin-top:11px;padding-top:8px;border-top:1px solid #E6EAF1;font-size:10px;color:#98A2B3">
      <span>${L('បង្កើតដោយស្វ័យប្រវត្តិ · មិនជាន់លើមេរៀនដែលមានស្រាប់','Generated automatically · existing lessons untouched')}</span>
      <span style="margin-left:auto">${kd(autoPlanISO(new Date()))}</span>
    </div>`;

  const style = document.createElement('style');
  style.id = '__autoPlanStyle';
  style.textContent = `
    #${HOST_ID}{position:fixed;inset:0;z-index:100000;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch}
    #${HOST_ID} .ap-paper{font-family:'Kantumruy Pro',Inter,'Khmer OS','Battambang',sans-serif;font-size:12px;color:#222;background:#fff;padding:18px 20px 24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    #${HOST_ID} .ap-bar button{font-family:inherit}
    @media print{
      body > *:not(#${HOST_ID}){display:none !important}
      #${HOST_ID}{position:static !important;overflow:visible !important}
      #${HOST_ID} .ap-bar{display:none !important}
      #${HOST_ID} .ap-paper{zoom:1 !important;width:auto !important}
      #${HOST_ID} .ap-day{page-break-inside:avoid}
      @page{size:A4 landscape;margin:11mm}
    }`;
  document.head.appendChild(style);

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.innerHTML = `
    <div class="ap-bar" style="position:sticky;top:0;z-index:2;display:flex;gap:6px;flex-wrap:nowrap;align-items:center;overflow-x:auto;padding:calc(10px + env(safe-area-inset-top,0px)) 10px 10px;background:#1A4F96;color:#fff;box-shadow:0 1px 8px rgba(0,0,0,.25)">
      <button id="__apBack" title="${L('ត្រឡប់','Back')}" style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border:none;background:rgba(255,255,255,.2);color:#fff;font-size:16px;width:38px;height:38px;border-radius:8px;cursor:pointer">⬅</button>
      <div style="display:flex;flex-shrink:0;background:rgba(255,255,255,.16);border-radius:8px;padding:2px">
        <button id="__apKm" style="border:none;background:${curLang==='km'?'#fff':'transparent'};color:${curLang==='km'?'#1A4F96':'#fff'};font-size:12px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer">ខ្មែរ</button>
        <button id="__apEn" style="border:none;background:${curLang==='en'?'#fff':'transparent'};color:${curLang==='en'?'#1A4F96':'#fff'};font-size:12px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer">EN</button>
      </div>
      <div style="display:flex;flex-shrink:0;background:rgba(255,255,255,.16);border-radius:8px;padding:2px">
        <button id="__apTable" style="border:none;background:${o.view!=='calendar'?'#fff':'transparent'};color:${o.view!=='calendar'?'#1A4F96':'#fff'};font-size:12px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer">${L('តារាង','Table')}</button>
        <button id="__apCal" style="border:none;background:${o.view==='calendar'?'#fff':'transparent'};color:${o.view==='calendar'?'#1A4F96':'#fff'};font-size:12px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer">${L('ប្រតិទិន','Calendar')}</button>
      </div>
      <div style="flex:1;min-width:2px"></div>
      ${plan.projected
        ? `<span style="flex-shrink:0;padding:0 12px;height:38px;display:inline-flex;align-items:center;border-radius:8px;background:rgba(255,255,255,.16);font-size:12px;font-weight:600;white-space:nowrap">${L('ការប៉ាន់ស្មាន — រក្សាទុកមិនបាន','A projection — cannot be saved')}</span>`
        : `<button id="__apSave" style="flex-shrink:0;border:none;background:#2FBF71;color:#fff;font-size:12.5px;font-weight:700;padding:0 13px;height:38px;border-radius:8px;cursor:pointer;white-space:nowrap">${L('រក្សាទុកចូលកាលវិភាគពិត','Save to schedule')}</button>`}
      <button id="__apPrint" title="${L('បោះពុម្ព / PDF','Print / PDF')}" style="flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;border:none;background:#fff;color:#1A4F96;font-size:17px;width:40px;height:38px;border-radius:8px;cursor:pointer">🖨</button>
    </div>
    <div id="__apConfirm" style="display:none;align-items:center;gap:8px;padding:10px 12px;background:#FFF8E1;border-bottom:1px solid #F0D79A;font-size:12px;color:#7A4A05;line-height:1.6">
      <span style="flex:1;min-width:0">${L(`មេរៀន ${kd(st.sessions)} នឹងបន្ថែមចូលកាលវិភាគពិត។ លុបម្ដងមួយៗក្រោយបាន។`,
            `${st.sessions} lessons will be added to the real schedule. You can delete them individually later.`)}</span>
      <button id="__apNo" style="flex-shrink:0;border:1px solid #D9BE86;background:#fff;color:#7A4A05;font-size:12px;font-weight:600;padding:0 12px;height:34px;border-radius:7px;cursor:pointer">${L('បោះបង់','Cancel')}</button>
      <button id="__apYes" style="flex-shrink:0;border:none;background:#2FBF71;color:#fff;font-size:12px;font-weight:700;padding:0 14px;height:34px;border-radius:7px;cursor:pointer">${L('បញ្ជាក់','Confirm')}</button>
    </div>
    <div class="ap-paper">${paper}</div>`;
  document.body.appendChild(host);

  // With seven instructors the table is far wider than a phone. Render it at a
  // tablet-ish width and zoom-to-fit, the same trick the month PDF uses, so the
  // whole day stays on one screen instead of wrapping into a tall column.
  const SHEET_W = 840;
  const fit = () => {
    const p = host.querySelector('.ap-paper');
    if (!p) return;
    const avail = host.clientWidth || window.innerWidth || SHEET_W;
    if (avail < SHEET_W) { p.style.width = SHEET_W + 'px'; p.style.zoom = (avail / SHEET_W).toFixed(3); }
    else { p.style.width = ''; p.style.zoom = ''; }
  };
  const cleanup = () => { window.removeEventListener('resize', fit); host.remove(); style.remove(); };
  const bar = host.querySelector('#__apConfirm');
  host.querySelector('#__apBack').onclick  = cleanup;
  const relang = (next) => { if (next !== curLang) { cleanup(); autoPlanPDF(plan, o, onSave, next); } };
  host.querySelector('#__apKm').onclick = () => relang('km');
  host.querySelector('#__apEn').onclick = () => relang('en');
  const review = (v) => { if (v !== o.view) { cleanup(); autoPlanPDF(plan, { ...o, view: v }, onSave, curLang); } };
  host.querySelector('#__apTable').onclick = () => review('table');
  host.querySelector('#__apCal').onclick   = () => review('calendar');
  host.querySelector('#__apPrint').onclick = () => { try { window.print(); } catch (e) {} };
  // Confirm inside the sheet rather than through the app's dialog: the sheet
  // sits above every overlay, so a normal dialog would open behind it.
  if (!plan.projected) {
    host.querySelector('#__apSave').onclick = () => { bar.style.display = 'flex'; };
    host.querySelector('#__apNo').onclick   = () => { bar.style.display = 'none'; };
    host.querySelector('#__apYes').onclick  = () => { cleanup(); onSave?.(); };
  }
  fit();
  window.addEventListener('resize', fit);
};

// ── The form ────────────────────────────────────────────────────────────────
const AutoPlanModal = ({ open, onClose }) => {
  const { tr, toast, lang } = useAppActions();
  const [o, setO] = React.useState(() => {
    const p0 = autoPlanPools('');
    return {
    studentCount: p0.students.length,
    instCount:    p0.instructors.length,
    vehCount:     p0.vehicles.length,
    startDate: autoPlanISO(new Date()),
    weekdays:  [1, 2, 3, 4, 5, 6],
    dayStart: 7, dayEnd: 18, lunchFrom: 12, lunchTo: 13,
    totalHours: 20, minLen: 1, maxLen: 2, maxPerDay: 2, minSpanDays: 0, gapDays: 1,
    phase: 'KH', trans: '', avoidExisting: true, view: 'table',
    pickS: [], pickI: [], pickV: [], picking: false,
    names: 'generic', pdfLang: 'en',
    };
  });
  // Re-read on every render so the hints track the chosen gearbox.
  const pools = autoPlanPools(o.trans);
  const leftOut = autoPlanLeftOut(o.trans);
  // A named pick decides its own count; the number field follows it.
  const pickLen = { pickS: (o.pickS || []).length, pickI: (o.pickI || []).length, pickV: (o.pickV || []).length };
  const nS = pickLen.pickS || o.studentCount;
  const nI = pickLen.pickI || o.instCount;
  const nV = pickLen.pickV || o.vehCount;
  const projected = nS > pools.students.length
    || nI > pools.instructors.length
    || nV > pools.vehicles.length;
  // Changing the gearbox changes which cars and students are in play, so the
  // counts have to follow it rather than keep yesterday's numbers.
  const set = (k, v) => setO(p => {
    const next = { ...p, [k]: v };
    if (k === 'trans') {
      // Only raise the counts to match the newly available pool; a larger
      // number the user typed is a question they asked, so leave it alone.
      const np = autoPlanPools(v);
      next.studentCount = Math.max(p.studentCount, np.students.length);
      next.vehCount     = Math.max(p.vehCount, np.vehicles.length);
    }
    return next;
  });
  if (!open) return null;

  // Live read-out of what the numbers imply. A school with few instructors is
  // not an impossible plan — the students simply take turns across more days —
  // so the only thing that genuinely blocks is a day with no room in it at all.
  const slotGrid = autoPlanSlots(o);                                // the day, cut up
  const openHours = slotGrid.reduce((n, sl) => n + sl.len, 0);      // teachable, after cutting
  const perDay  = slotGrid.length;                                  // sittings in a day
  const atOnce  = Math.min(nI, nV);                // lessons side by side
  const cap     = atOnce * openHours;                               // teachable hours a day
  const totalHoursNeeded = nS * o.totalHours;
  const perStudentDay = Math.max(1, Math.min(o.maxPerDay, o.maxLen * perDay));
  // Two floors on the length: nobody may exceed their daily ceiling, and the
  // school can only teach `cap` hours a day. The longer one wins — and a
  // requested minimum course length can stretch it further still.
  const dayCnt = Math.max(
    Math.ceil(o.totalHours / perStudentDay),
    cap ? Math.ceil(totalHoursNeeded / cap) : 0,
    o.minSpanDays > 0 ? Math.round(o.minSpanDays * Math.max(1, o.weekdays.length) / 7) : 0);
  const ok = perDay > 0 && atOnce > 0;
  const blockReason =
    perDay <= 0 ? tr('ម៉ោង​បើក–បិទ ខ្លី​ជាង​វគ្គ​ខ្លី​បំផុត — បើក​យូរ​ជាង​នេះ ឬ​បន្ថយ​វគ្គ​ខ្លី​បំផុត',
                     'The opening hours are shorter than the shortest sitting — open longer, or shorten it') :
    atOnce <= 0 ? tr('ត្រូវ​មាន​គ្រូ និង​ឡាន​យ៉ាង​តិច ១','Need at least one instructor and one car') : '';
  // What the day actually breaks into, which is the thing that was invisible.
  const slotNote = slotGrid.length
    ? slotGrid.map(sl => `${String(sl.h).padStart(2,'0')}:00–${String(sl.h + sl.len).padStart(2,'0')}:00`).join(' · ')
    : '';
  const idleHours = ((o.dayEnd - o.dayStart) - Math.max(0, o.lunchTo - o.lunchFrom)) - openHours;

  const fieldCss = {
    width:'100%', boxSizing:'border-box', height:48, padding:'0 12px',
    fontFamily:'inherit', fontSize:17, fontWeight:700, color:'var(--ink)',
    background:'var(--surface-muted)', border:'1px solid var(--border)',
    borderRadius:11, outline:'none',
  };
  const labelCss = { display:'block', fontSize:12, color:'var(--ink-3)', marginBottom:5 };

  // `pickKey` set and non-empty means the count is decided by the names chosen,
  // so the field shows that number and stops taking input.
  const numField = (k, label, hint, max, pickKey, shown) => {
    const locked = pickKey && (o[pickKey] || []).length > 0;
    return (
      <label style={{flex:1,minWidth:0,display:'block'}}>
        <span style={labelCss}>{label}</span>
        <input type="number" inputMode="numeric" readOnly={locked}
          value={locked ? shown : o[k]} max={max}
          onChange={e => {
            if (locked) return;
            const n = Math.max(0, parseInt(e.target.value) || 0);
            set(k, max === undefined ? n : Math.min(n, max));
          }}
          style={{...fieldCss,
            background: locked ? 'var(--accent-soft)' : fieldCss.background,
            borderColor: locked ? 'var(--accent)' : 'var(--border)',
            color: locked ? 'var(--accent)' : fieldCss.color}}/>
        {hint && <span style={{display:'block',fontSize:10.5,color: locked ? 'var(--accent)' : 'var(--ink-3)',marginTop:4}}>{hint}</span>}
      </label>
    );
  };

  // One group of pickable chips. All and Clear carry most of the work: a
  // school usually wants everyone but two, or only two.
  const pickGroup = (key, label, list, labelOf) => {
    const on = o[key] || [];
    const toggle = (id) => set(key, on.includes(id) ? on.filter(x => x !== id) : [...on, id]);
    return (
      <div style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
          <span style={{fontSize:12,fontWeight:700,color:'var(--ink-2)'}}>{label}</span>
          <span style={{fontSize:11,color:'var(--ink-3)'}}>{on.length ? `${on.length}/${list.length}` : tr(`ទាំងអស់ ${list.length}`, `all ${list.length}`)}</span>
          <span style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button type="button" onClick={() => set(key, list.map(x => x.id))}
              style={{border:'none',background:'transparent',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:600,color:'var(--accent)'}}>{tr('ទាំងអស់','All')}</button>
            {on.length > 0 && (
              <button type="button" onClick={() => set(key, [])}
                style={{border:'none',background:'transparent',cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:600,color:'var(--ink-3)'}}>{tr('សម្អាត','Clear')}</button>
            )}
          </span>
        </div>
        {list.length === 0 ? (
          <div style={{fontSize:11.5,color:'var(--ink-3)'}}>{tr('គ្មាន​ក្នុង​ប្រព័ន្ធ','None on record')}</div>
        ) : (
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {list.map(x => {
              const at = on.indexOf(x.id);
              const sel = at >= 0;
              return (
                <button key={x.id} type="button" onClick={() => toggle(x.id)}
                  style={{display:'inline-flex',alignItems:'center',gap:6,padding: sel ? '7px 11px 7px 7px' : '7px 11px',
                    borderRadius:999,cursor:'pointer',fontFamily:'inherit',
                    fontSize:12,fontWeight: sel ? 700 : 500,
                    border: sel ? 'none' : '1px solid var(--border)',
                    background: sel ? 'var(--accent)' : 'var(--surface)',
                    color: sel ? '#fff' : 'var(--ink-2)'}}>
                  {sel && (
                    <span style={{flexShrink:0,width:18,height:18,borderRadius:999,background:'rgba(255,255,255,.25)',
                      display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:10.5,fontWeight:800}}>{at + 1}</span>
                  )}
                  {labelOf(x)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  const hourField = (k, label) => (
    <label style={{flex:1,minWidth:0,display:'block'}}>
      <span style={labelCss}>{label}</span>
      <select value={o[k]} onChange={e => set(k, parseInt(e.target.value))}
        style={{...fieldCss, fontSize:15, cursor:'pointer'}}>
        {Array.from({length:20}, (_, i) => i + 5).map(h =>
          <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
      </select>
    </label>
  );
  const row = (label, value, strong) => (
    <div style={{display:'flex',alignItems:'baseline',gap:10,padding:'5px 0',
      borderTop: strong ? '1px solid var(--border)' : 'none'}}>
      <span style={{fontSize:12.5,fontWeight: strong ? 700 : 500,color: strong ? 'var(--accent)' : 'var(--ink-2)'}}>{label}</span>
      <span style={{marginLeft:'auto',fontSize: strong ? 16 : 14,fontWeight: strong ? 800 : 700,
        color: strong ? 'var(--accent)' : 'var(--ink)'}}>{value}</span>
    </div>
  );

  const run = () => {
    if (!o.weekdays.length)   { toast(tr('ជ្រើស​ថ្ងៃ​រៀន​យ៉ាង​តិច​មួយ','Pick at least one weekday'), 'warn'); return; }
    if (o.dayEnd <= o.dayStart) { toast(tr('ម៉ោង​បិទ​ត្រូវ​ក្រោយ​ម៉ោង​បើក','Closing time must be after opening'), 'warn'); return; }
    if (!nS || !nI || !nV) { toast(tr('ត្រូវ​មាន​សិស្ស គ្រូ និង​ឡាន','Need students, instructors and cars'), 'warn'); return; }
    if (!ok) { toast(blockReason, 'warn'); return; }

    const plan = autoPlanBuild(o);
    if (!plan.days.length) { toast(tr('បង្កើត​មិន​បាន — ពិនិត្យ​ម៉ោង និង​ថ្ងៃ','Nothing generated — check hours and days'), 'warn'); return; }

    autoPlanPDF(plan, o, plan.projected ? null : () => {
      autoPlanToLessons(plan, o).forEach(l => LESSONS.push(l));
      if (window.__logActivity) window.__logActivity('create', 'lesson', `auto ×${plan.stats.sessions}`);
      if (window.__notifyLessonsChanged) window.__notifyLessonsChanged();
      if (window.saveAllData) window.saveAllData();
      toast(tr(`បាន​បន្ថែម​មេរៀន ${plan.stats.sessions} ✓`, `Added ${plan.stats.sessions} lessons ✓`), 'good');
      onClose?.();
    });
  };

  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div style={{padding:'14px 16px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <Icon name="cal" size={30}/>
          <div style={{minWidth:0}}>
            <div style={{fontSize:16,fontWeight:700,color:'var(--ink)'}}>{tr('បង្កើត​កាលវិភាគ​ស្វ័យប្រវត្ត','Auto-generate schedule')}</div>
            <div style={{fontSize:11.5,color:'var(--ink-3)'}}>{tr('មើល PDF គំរូ​មុន​រក្សាទុក','Preview the PDF before saving')}</div>
          </div>
        </div>

        {/* Resources */}
        <span style={labelCss}>{tr('ប្រអប់​លេខ','Gearbox')}</span>
        <div style={{display:'flex',gap:6,marginBottom:11}}>
          {[['', tr('ទាំង​ពីរ','Both')], ['MT', tr('លេខ​ដៃ · MT','Manual · MT')], ['AT', tr('អូតូ · AT','Automatic · AT')]].map(([k, lab]) => {
            const on = o.trans === k;
            return (
              <button key={k || 'all'} type="button" onClick={() => set('trans', k)}
                style={{flex:1,minWidth:0,height:40,borderRadius:11,cursor:'pointer',fontFamily:'inherit',
                  border: on ? 'none' : '1px solid var(--border)',
                  background: on ? 'var(--accent)' : 'var(--surface-muted)',
                  color: on ? '#fff' : 'var(--ink-3)', fontSize:12.5, fontWeight: on ? 700 : 500}}>{lab}</button>
            );
          })}
        </div>
        <div style={{display:'flex',gap:9,marginBottom:13}}>
          {numField('studentCount', tr('សិស្ស','Students'),  pickLen.pickS ? tr('តាម​ឈ្មោះ','by name')  : tr(`ក្នុង​បញ្ជី ${pools.students.length}`,    `${pools.students.length} on the roll`),   undefined, 'pickS', nS)}
          {numField('instCount',    tr('គ្រូ','Instructors'), pickLen.pickI ? tr('តាម​ឈ្មោះ','by name')  : tr(`ក្នុង​បញ្ជី ${pools.instructors.length}`, `${pools.instructors.length} on staff`),   undefined, 'pickI', nI)}
          {numField('vehCount',     tr('ឡាន','Cars'),        pickLen.pickV ? tr('តាម​ផ្លាក','by plate') : tr(`ក្នុង​បញ្ជី ${pools.vehicles.length}`,    `${pools.vehicles.length} in the fleet`), undefined, 'pickV', nV)}
        </div>

        {/* Counts take whoever is at the top of the list, which stops being
            what you want as soon as the plan is for particular people. */}
        <button type="button" onClick={() => set('picking', !o.picking)}
          style={{display:'flex',alignItems:'center',gap:8,width:'100%',boxSizing:'border-box',marginBottom:13,padding:'11px 13px',
            borderRadius:12,cursor:'pointer',fontFamily:'inherit',textAlign:'left',
            border:'1px solid var(--border)',background:'var(--surface-muted)'}}>
          <Icon name="cap" size={18}/>
          <span style={{flex:1,minWidth:0,fontSize:12.5,fontWeight:600,color:'var(--ink-2)'}}>
            {tr('ជ្រើស​ឈ្មោះ​ដោយ​ខ្លួន​ឯង','Choose who takes part')}
          </span>
          {(pickLen.pickS + pickLen.pickI + pickLen.pickV) > 0 && (
            <span style={{fontSize:11,fontWeight:700,color:'#fff',background:'var(--accent)',borderRadius:999,padding:'2px 8px'}}>
              {pickLen.pickS + pickLen.pickI + pickLen.pickV}
            </span>
          )}
          <span style={{fontSize:12,color:'var(--ink-3)'}}>{o.picking ? '▴' : '▾'}</span>
        </button>

        {o.picking && (
          <div style={{marginBottom:13,padding:'13px 14px',borderRadius:14,background:'var(--surface-muted)',border:'1px solid var(--border)'}}>
            {pickGroup('pickS', tr('សិស្ស','Students'), pools.students,
              x => (lang === 'km' ? (x.name || x.en) : (x.en || x.name)) || x.id)}
            {pickGroup('pickI', tr('គ្រូ','Instructors'), pools.instructors,
              x => (lang === 'km' ? (x.name || x.en) : (x.en || x.name)) || x.id)}
            {pickGroup('pickV', tr('ឡាន','Cars'), pools.vehicles,
              x => (x.plate || x.id) + (x.trans ? ' · ' + x.trans : ''))}
            <div style={{fontSize:11,color:'var(--ink-3)',lineHeight:1.6}}>
              {tr('លេខ​លើ​ឈ្មោះ = លំដាប់​រៀន។ អ្នក​ប៉ះ​មុន​គេ​បាន​ម៉ោង​មុន​គេ — ប៉ះ​ម្ដង​ទៀត​ដើម្បី​ដក​ចេញ។',
                  'The number on a name is its turn: whoever is picked first gets the earliest sitting. Tap again to remove.')}
              <br/>
              {tr('មិន​ជ្រើស = យក​តាម​ចំនួន​ខាង​លើ','Nothing chosen = go by the counts above')}
            </div>
          </div>
        )}
        {projected ? (
          <div style={{padding:'9px 12px',borderRadius:11,marginBottom:13,lineHeight:1.65,
            background:'rgba(202,138,4,.12)',fontSize:12,color:'#8A6206'}}>
            {tr('ការ​ប៉ាន់​ស្មាន — លើស​ពី​អ្វី​ដែល​មាន​ក្នុង​ប្រព័ន្ធ។ ល្អ​សម្រាប់​បង្ហាញ​អតិថិជន តែ​រក្សាទុក​ចូល​កាលវិភាគ​ពិត​មិន​បាន។',
                'A projection — more than the school has on record. Good for showing a customer, but it cannot be saved into the real schedule.')}
          </div>
        ) : (leftOut.studentsTotal > pools.students.length || leftOut.vehiclesTotal > pools.vehicles.length) && (
          <div style={{padding:'9px 12px',borderRadius:11,marginBottom:13,lineHeight:1.65,
            background:'var(--surface-muted)',border:'1px solid var(--border)',fontSize:11.5,color:'var(--ink-3)'}}>
            {leftOut.studentsTotal > pools.students.length && (
              <div>{tr(`សិស្ស​ក្នុង​ប្រព័ន្ធ ${leftOut.studentsTotal} នាក់ — រាប់​បញ្ចូល ${pools.students.length}`,
                       `${leftOut.studentsTotal} students on record, ${pools.students.length} counted`)}
                {leftOut.studentsFinished ? tr(` · ចប់​វគ្គ​ហើយ ${leftOut.studentsFinished}`, ` · ${leftOut.studentsFinished} finished`) : ''}
                {leftOut.studentsOtherGear ? tr(` · ប្រអប់​លេខ​ផ្សេង ${leftOut.studentsOtherGear}`, ` · ${leftOut.studentsOtherGear} on the other gearbox`) : ''}
              </div>
            )}
            {leftOut.vehiclesTotal > pools.vehicles.length && (
              <div>{tr(`ឡាន​ក្នុង​ប្រព័ន្ធ ${leftOut.vehiclesTotal} — រាប់​បញ្ចូល ${pools.vehicles.length}`,
                       `${leftOut.vehiclesTotal} cars on record, ${pools.vehicles.length} counted`)}
                {leftOut.vehiclesWorkshop ? tr(` · ជួសជុល ${leftOut.vehiclesWorkshop}`, ` · ${leftOut.vehiclesWorkshop} in the workshop`) : ''}
                {leftOut.vehiclesOtherGear ? tr(` · ប្រអប់​លេខ​ផ្សេង ${leftOut.vehiclesOtherGear}`, ` · ${leftOut.vehiclesOtherGear} on the other gearbox`) : ''}
              </div>
            )}
          </div>
        )}

        {/* Time window */}
        <div style={{display:'flex',gap:9,marginBottom:10}}>
          <label style={{flex:1.3,minWidth:0,display:'block'}}>
            <span style={labelCss}>{tr('ថ្ងៃ​ចាប់​ផ្ដើម','Start date')}</span>
            <input type="date" value={o.startDate} onChange={e => set('startDate', e.target.value)}
              style={{...fieldCss, fontSize:15}}/>
          </label>
          {hourField('dayStart', tr('ម៉ោង​បើក','Opens'))}
          {hourField('dayEnd',   tr('ម៉ោង​បិទ','Closes'))}
        </div>
        <div style={{display:'flex',gap:9,marginBottom:13}}>
          {hourField('lunchFrom', tr('សម្រាក​ពី','Break from'))}
          {hourField('lunchTo',   tr('ដល់','until'))}
          <label style={{flex:1,minWidth:0,display:'block'}}>
            <span style={labelCss}>{tr('វគ្គ​សិក្សា','Phase')}</span>
            <select value={o.phase} onChange={e => set('phase', e.target.value)}
              style={{...fieldCss, cursor:'pointer'}}>
              {(window.STUDENT_PHASES || [{k:'KH',label:'KH'}]).map(p =>
                <option key={p.k} value={p.k}>{p.label}</option>)}
            </select>
          </label>
        </div>

        {/* Weekdays */}
        <span style={labelCss}>{tr('ថ្ងៃ​រៀន​ក្នុង​សប្ដាហ៍','Teaching days')}</span>
        <div style={{display:'flex',gap:5,marginBottom:13}}>
          {AUTOPLAN_DOW.map((d, i) => {
            const on = o.weekdays.includes(d);
            return (
              <button key={d} type="button"
                onClick={() => set('weekdays', on ? o.weekdays.filter(x => x !== d) : [...o.weekdays, d])}
                style={{flex:1,minWidth:0,height:42,border: on ? 'none' : '1px solid var(--border)',
                  borderRadius:11,cursor:'pointer',fontFamily:'inherit',fontSize:13.5,
                  fontWeight: on ? 700 : 500,
                  background: on ? 'var(--accent)' : 'var(--surface-muted)',
                  color: on ? '#fff' : 'var(--ink-3)'}}>
                {tr(AUTOPLAN_DOW_KM[i], AUTOPLAN_DOW_EN[i])}
              </button>
            );
          })}
        </div>

        {/* Course load, as questions about one student. A sitting is a range
            now, not a fixed size, so one student can take an hour where the
            next takes two. */}
        <span style={labelCss}>{tr('សិស្ស ១ នាក់ រៀន​យ៉ាង​ណា?','For one student')}</span>
        <div style={{display:'flex',gap:9,marginBottom:9}}>
          {numField('minLen',    tr('រៀន​ម្ដង យ៉ាង​តិច','Sitting, least (h)'),   tr('ធម្មតា ១','usually 1'))}
          {numField('maxLen',    tr('រៀន​ម្ដង យ៉ាង​ច្រើន','Sitting, most (h)'),  tr('ធម្មតា ២','usually 2'))}
          {numField('maxPerDay', tr('១ ថ្ងៃ យ៉ាង​ច្រើន','Per day, most (h)'),        tr('២ ឬ ៣ ពេល​ចាំបាច់','2, or 3 if needed'))}
        </div>
        <div style={{display:'flex',gap:9,marginBottom:9}}>
          {numField('totalHours',  tr('ទាំង​អស់ ប៉ុន្មាន​ម៉ោង?','Course total (h)'), tr('រហូត​ចប់​វគ្គ','to graduate'))}
          {numField('minSpanDays', tr('វគ្គ​យូរ​យ៉ាង​តិច (ថ្ងៃ)','Course lasts at least (days)'), tr('០ = មិន​កំណត់','0 = no minimum'))}
        </div>
        <span style={labelCss}>{tr('គម្លាត​រវាង​លើក​រៀន','Days between lessons')}</span>
        <div style={{display:'flex',gap:6,marginBottom:9}}>
          {[[1, tr('រាល់​ថ្ងៃ','Every day')], [2, tr('រៀង​រាល់ ២ ថ្ងៃ','Every 2nd day')], [3, tr('រៀង​រាល់ ៣ ថ្ងៃ','Every 3rd day')]].map(([k, lab]) => {
            const on = (o.gapDays || 1) === k;
            return (
              <button key={k} type="button" onClick={() => set('gapDays', k)}
                style={{flex:1,minWidth:0,height:40,borderRadius:11,cursor:'pointer',fontFamily:'inherit',
                  border: on ? 'none' : '1px solid var(--border)',
                  background: on ? 'var(--accent)' : 'var(--surface-muted)',
                  color: on ? '#fff' : 'var(--ink-3)', fontSize:12.5, fontWeight: on ? 700 : 500}}>{lab}</button>
            );
          })}
        </div>
        <div style={{padding:'9px 12px',borderRadius:11,marginBottom:13,lineHeight:1.65,
          background:'var(--surface-muted)',border:'1px solid var(--border)',
          fontSize:12.5,color:'var(--ink-2)'}}>
          {ok
            ? tr(`វេន​ក្នុង ១ ថ្ងៃ៖ ${slotNote}`, `Sittings in a day: ${slotNote}`)
            : tr('គ្មាន​វេន​ក្នុង ១ ថ្ងៃ','No sitting fits in the day')}
          {ok && idleHours > 0 && (
            <span style={{display:'block',marginTop:3,color:'#B25E09',fontSize:11.5}}>
              {tr(`នៅ​សល់ ${idleHours} ម៉ោង​មិន​បាន​ប្រើ — បន្ថយ «រៀន​ម្ដង យ៉ាង​តិច»`,
                  `${idleHours}h of the day goes unused — lower the shortest sitting`)}
            </span>
          )}
          {ok && o.minSpanDays > 0 && (
            <span style={{display:'block',marginTop:3,color:'var(--ink-3)',fontSize:11.5}}>
              {tr(`សិស្ស​មក​រៀន​មិន​រាល់​ថ្ងៃ — មាន​ថ្ងៃ​សម្រាក​ចន្លោះ ដើម្បី​អោយ​វគ្គ​យូរ​យ៉ាង​តិច ${o.minSpanDays} ថ្ងៃ។ ម៉ោង​ក្នុង ១ វេន​នៅ​ដដែល។`,
                  `Students come in less often, with rest days between, so the course lasts at least ${o.minSpanDays} days. Sittings stay full length.`)}
            </span>
          )}
        </div>

        <span style={labelCss}>{tr('ឈ្មោះ​ក្នុង PDF','Names on the sheet')}</span>
        <div style={{display:'flex',gap:6,marginBottom:13}}>
          {[['generic', tr('Student 1, 2, 3…','Student 1, 2, 3…')], ['real', tr('ឈ្មោះ​ពិត','Real names')]].map(([k, lab]) => {
            const on = o.names === k;
            return (
              <button key={k} type="button" onClick={() => set('names', k)}
                style={{flex:1,minWidth:0,height:40,borderRadius:11,cursor:'pointer',fontFamily:'inherit',
                  border: on ? 'none' : '1px solid var(--border)',
                  background: on ? 'var(--accent)' : 'var(--surface-muted)',
                  color: on ? '#fff' : 'var(--ink-3)', fontSize:12.5, fontWeight: on ? 700 : 500}}>{lab}</button>
            );
          })}
          {[['km','ខ្មែរ'],['en','EN']].map(([k, lab]) => {
            const on = o.pdfLang === k;
            return (
              <button key={k} type="button" onClick={() => set('pdfLang', k)}
                style={{width:58,flexShrink:0,height:40,borderRadius:11,cursor:'pointer',fontFamily:'inherit',
                  border: on ? 'none' : '1px solid var(--border)',
                  background: on ? 'var(--ink)' : 'var(--surface-muted)',
                  color: on ? 'var(--bg)' : 'var(--ink-3)', fontSize:12.5, fontWeight: on ? 700 : 500}}>{lab}</button>
            );
          })}
        </div>

        <label style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',borderRadius:12,
          background:'var(--surface-muted)',border:'1px solid var(--border)',cursor:'pointer',marginBottom:13}}>
          <input type="checkbox" checked={o.avoidExisting} onChange={e => set('avoidExisting', e.target.checked)}
            style={{width:19,height:19,flexShrink:0,accentColor:'var(--accent)'}}/>
          <span style={{fontSize:12.5,fontWeight:600,color:'var(--ink-2)',lineHeight:1.5}}>
            {tr('វៀស​ម៉ោង​ដែល​មាន​កាលវិភាគ​រួច — មិន​ដាក់​ជាន់​គ្នា','Skip hours already booked — never double-book')}
          </span>
        </label>

        {/* What the plan will come out as. Few instructors only means a longer
            term, not an impossible one, so this reports rather than refuses. */}
        <div style={{borderRadius:14,background:'var(--accent-soft)',padding:'11px 13px',marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--accent)',marginBottom:3}}>{tr('គណនា​មុន​បង្កើត','Before you generate')}</div>
          {row(tr('មេរៀន​ស្រប​គ្នា​បាន','Lessons at once'), atOnce)}
          {row(tr('វេន​ក្នុង ១ ថ្ងៃ','Sittings per day'), perDay)}
          {row(tr('ចំណុះ ១ ថ្ងៃ','Capacity per day'), tr(`${cap} ម៉ោង`, `${cap} hours`))}
          {row(tr('ម៉ោង​ត្រូវ​ការ​ទាំង​អស់','Hours needed'), tr(`${totalHoursNeeded} ម៉ោង`, `${totalHoursNeeded} hours`))}
          {row(tr('ថ្ងៃ​រៀន​ប្រហែល','Teaching days'), ok ? tr(`${dayCnt} ថ្ងៃ`, `${dayCnt} days`) : '—', true)}
          {ok && dayCnt > 60 && (
            <div style={{marginTop:7,padding:'8px 10px',borderRadius:9,background:'rgba(202,138,4,.14)',
              fontSize:12,fontWeight:600,color:'#8A6206',lineHeight:1.55}}>
              {tr(`វែង ${dayCnt} ថ្ងៃ — បន្ថែម​គ្រូ ឡាន ឬ​ម៉ោង​បើក ទើប​ខ្លី​ជាង`,
                  `${dayCnt} teaching days is long — more instructors, cars or opening hours would shorten it`)}
            </div>
          )}
          {!ok && (
            <div style={{marginTop:7,padding:'8px 10px',borderRadius:9,background:'rgba(176,65,62,.12)',
              fontSize:12,fontWeight:600,color:'#B0413E',lineHeight:1.55}}>{blockReason}</div>
          )}
        </div>

        <div style={{display:'flex',gap:9}}>
          <Btn kind="ghost" size="lg" onClick={onClose} style={{flex:1,justifyContent:'center'}}>{tr('បោះបង់','Cancel')}</Btn>
          <Btn kind="accent" size="lg" onClick={run} style={{flex:2,justifyContent:'center',fontWeight:700}}>
            {tr('បង្កើត — មើល PDF','Generate — preview PDF')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
};
