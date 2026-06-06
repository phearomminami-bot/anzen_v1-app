// supabase-data.jsx — Phase 2: load/save all app data to Supabase.
//
// Sync model:
//   • On load        : cloud wins for existing IDs, local-only rows kept.
//   • On poll/reload : cloud is authoritative — items missing from cloud removed locally.
//   • On save        : only push records that changed LOCALLY since last cloud load.
//                      Unchanged records are skipped — never overwrite other devices' edits.
//   • Real-time      : Supabase Realtime WebSocket fires on any change → debounced reload.
//   • Poll            : 30-second heartbeat fallback when Realtime drops.

(function () {
  const nz   = v => (v === undefined || v === null || v === '' || v === '—') ? null : v;
  const blob = o => { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return {}; } };
  const rowObj = r => (r && r.extra && Object.keys(r.extra).length) ? r.extra : r;
  const toDate = v => {
    if (!v || typeof v !== 'string') return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);

  window.__sbReady         = false;
  window.__sbSyncEnabled   = true;
  window.__sbHasPendingSync = false;

  // ── ID snapshots for diff-based deletion ─────────────────────────────────
  let lastIds = null;
  const snapshotIds = () => {
    lastIds = {
      vehicles: new Set((window.VEHICLES || []).map(v => v.id).filter(Boolean)),
      students: new Set((window.STUDENTS || []).map(s => s.id).filter(Boolean)),
      lessons:  new Set((window.LESSONS  || []).map(l => l.id).filter(Boolean)),
      invoices: new Set((window.INVOICES || []).map(i => i.id).filter(Boolean)),
    };
  };

  // ── Content snapshots for change detection ────────────────────────────────
  // After every cloud load we record JSON.stringify of each record.
  // doSync() only pushes records whose content differs from this snapshot —
  // ensuring Device A never overwrites Device B's changes in tables A didn't modify.
  let contentSnap = {}; // table → Map<id, jsonStr>

  const takeContentSnap = () => {
    const snap = (t, arr) => {
      contentSnap[t] = new Map(
        (arr || []).filter(r => r.id).map(r => [String(r.id), JSON.stringify(r)])
      );
    };
    snap('vehicles',    window.VEHICLES    || []);
    snap('students',    window.STUDENTS    || []);
    snap('lessons',     window.LESSONS     || []);
    snap('invoices',    window.INVOICES    || []);
    snap('instructors', window.INSTRUCTORS || []);
    snap('staff',       window.__staffData || []);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const pull = async (t) => {
    try {
      const { data, error } = await window.sb.from(t).select('*');
      if (error) { console.error('[Anzen] load ' + t + ':', error.message); return null; }
      return data || [];
    } catch (e) { console.error('[Anzen] load ' + t, e); return null; }
  };

  const fill = (arr, rows, initialLoad) => {
    if (!rows) return;
    const cloudMap = {};
    rows.forEach(r => { const o = rowObj(r); if (o.id) cloudMap[o.id] = o; });
    for (let i = arr.length - 1; i >= 0; i--) {
      const id = arr[i].id;
      if (!id) continue;
      if (cloudMap[id]) { arr[i] = cloudMap[id]; delete cloudMap[id]; }
      else if (!initialLoad) arr.splice(i, 1);
    }
    Object.values(cloudMap).forEach(o => arr.push(o));
  };

  // ── LOAD ──────────────────────────────────────────────────────────────────
  window.__sbLoadAll = async (isInitialLoad) => {
    if (!window.sb) return false;
    const initial = (isInitialLoad === true) || !window.__sbReady;

    const [stu, ins, veh, les, inv, stf] = await Promise.all(
      ['students', 'instructors', 'vehicles', 'lessons', 'invoices', 'staff'].map(pull));

    fill(window.INSTRUCTORS, ins, initial);
    fill(window.VEHICLES,    veh, initial);
    fill(window.STUDENTS,    stu, initial);
    fill(window.LESSONS,     les, initial);
    fill(window.INVOICES,    inv, initial);
    fill(window.STAFF,       stf, initial);
    if (stf && stf.length) window.__staffData = stf.map(rowObj);

    const insp = await pull('vehicle_inspections');
    if (insp) window.__vehicleInspections = insp.map(rowObj);

    const att = await pull('attendance');
    if (att && att.length) {
      const m = {};
      att.forEach(r => { (m[r.date] = m[r.date] || {})[r.emp_id] = r.status; });
      window.__attendanceData = m;
    }

    const lc = await pull('lesson_content');
    if (lc && lc.length) rebuildLib(lc);

    try {
      const { data: ss } = await window.sb.from('school_settings').select('data').eq('id', 1).single();
      if (ss && ss.data && Object.keys(ss.data).length)
        window.__schoolSettings = Object.assign({}, window.__schoolSettings || {}, ss.data);
    } catch (e) {}

    snapshotIds();
    takeContentSnap(); // baseline for change detection

    window.__sbReady = true;
    refreshUI();
    if (window.__sbSubscribe) window.__sbSubscribe();
    return true;
  };

  // ── UI refresh ────────────────────────────────────────────────────────────
  function refreshUI() {
    ['__notifyStudentsChanged', '__notifyInstructorsChanged', '__notifyLessonsChanged',
     '__notifyStaffChanged', '__notifySettingsChanged', '__notifyLessonsLibChanged',
     '__notifyVehiclesChanged']
      .forEach(h => { try { window[h] && window[h](); } catch (e) {} });
  }

  function rebuildLib(rows) {
    const lib = window.__lessonsLib; if (!lib) return;
    const map = {
      theory:    { text: 'theoryTexts',    video: 'theoryVideos',    exercise: 'theoryExercises' },
      practical: { text: 'practicalTexts', video: 'practicalVideos', exercise: 'practicalExercises' },
    };
    Object.values(map).forEach(k => Object.values(k).forEach(key => { if (lib[key]) lib[key].length = 0; }));
    rows.sort((a, b) => (a.sort || 0) - (b.sort || 0)).forEach(r => {
      const key = map[r.track] && map[r.track][r.kind];
      if (key && lib[key]) lib[key].push(rowObj(r));
    });
  }

  // ── Realtime ──────────────────────────────────────────────────────────────
  let rtTimer = null;
  function scheduleRealtimeReload() {
    clearTimeout(rtTimer);
    rtTimer = setTimeout(() => {
      if (window.__sbHasPendingSync) {
        rtTimer = setTimeout(() => { window.__sbLoadAll && window.__sbLoadAll().catch(() => {}); }, 1500);
        return;
      }
      window.__sbLoadAll && window.__sbLoadAll().catch(() => {});
    }, 500);
  }

  window.__sbSubscribe = function () {
    if (!window.sb || window.__sbSubscribed) return;
    window.__sbSubscribed = true;
    const TABLES = ['vehicles', 'students', 'instructors', 'lessons', 'invoices', 'staff', 'vehicle_inspections'];
    TABLES.forEach(table => {
      try {
        window.sb
          .channel('anzen-rt-' + table)
          .on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRealtimeReload)
          .subscribe(status => { if (status === 'SUBSCRIBED') console.log('[Anzen] RT:', table); });
      } catch (e) { console.warn('[Anzen] RT subscribe failed:', table, e); }
    });
  };

  // ── SAVE ──────────────────────────────────────────────────────────────────
  let syncTimer = null;

  window.__sbSyncAll = function () {
    if (!window.sb || !window.__sbReady || !window.__sbSyncEnabled) return;
    window.__sbHasPendingSync = true;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { window.__sbHasPendingSync = false; doSync(); }, 1200);
  };

  window.__sbPushNow = async function () {
    if (!window.sb) return { ok: false, error: 'not-configured' };
    window.__sbHasPendingSync = false;
    clearTimeout(syncTimer);
    return await doSync();
  };

  async function doSync() {
    if (!window.sb) return { ok: false };

    // ── Snapshot everything BEFORE any await ─────────────────────────────────
    // Both the current data AND the content baseline are captured atomically.
    // This ensures: (1) concurrent __sbLoadAll() calls don't corrupt our push,
    // and (2) we compare against the correct baseline even if it updates mid-sync.
    const vehicles    = (window.VEHICLES    || []).slice();
    const students    = (window.STUDENTS    || []).slice();
    const lessons     = (window.LESSONS     || []).slice();
    const invoices    = (window.INVOICES    || []).slice();
    const instructors = (window.INSTRUCTORS || []).slice();
    const staff       = (window.__staffData || []).slice();
    const inspections = (window.__vehicleInspections || []).slice();
    const lib         = window.__lessonsLib || {};
    const ad          = window.__attendanceData || {};
    const settings    = window.__schoolSettings || {};

    // Immutable copy of content baseline for change detection
    const base = {};
    Object.entries(contentSnap).forEach(([k, v]) => { base[k] = new Map(v); });

    // Only push records that differ from baseline (changed locally since last cloud load).
    // Records that match baseline were not modified locally — don't overwrite other devices' edits.
    const changed = (table, rows) => {
      const b = base[table];
      if (!b) return rows; // first sync — push all
      return rows.filter(r => {
        if (!r.id) return true;
        const prev = b.get(String(r.id));
        return !prev || prev !== JSON.stringify(r);
      });
    };

    const vIds = new Set(vehicles.map(v => v.id).filter(Boolean));
    const sIds = new Set(students.map(s => s.id).filter(Boolean));
    const lIds = new Set(lessons.map(l => l.id).filter(Boolean));
    const iIds = new Set(invoices.map(i => i.id).filter(Boolean));

    let firstErr = null;

    const up = async (t, rows, onConflict) => {
      if (!rows || !rows.length) return;
      try {
        const { error } = await window.sb.from(t).upsert(rows, onConflict ? { onConflict } : undefined);
        if (error) { console.error('[Anzen] sync ' + t + ':', error.message); firstErr = firstErr || (t + ': ' + error.message); }
      } catch (e) { console.error('[Anzen] sync ' + t, e); firstErr = firstErr || String(e); }
    };

    const del = async (table, currentIds) => {
      if (!lastIds || !lastIds[table]) return;
      const removed = [];
      lastIds[table].forEach(id => { if (!currentIds.has(id)) removed.push(id); });
      if (!removed.length) return;
      try {
        const { error } = await window.sb.from(table).delete().in('id', removed);
        if (error) console.warn('[Anzen] delete ' + table + ':', error.message);
        else console.log('[Anzen] deleted from ' + table + ':', removed);
      } catch (e) { console.warn('[Anzen] delete', table, e); }
    };

    // Deletions first
    await del('vehicles', vIds);
    await del('students', sIds);
    await del('lessons',  lIds);
    await del('invoices', iIds);

    // Upsert only CHANGED records per table
    const cVeh = changed('vehicles',    vehicles);
    const cStu = changed('students',    students);
    const cLes = changed('lessons',     lessons);
    const cInv = changed('invoices',    invoices);
    const cIns = changed('instructors', instructors);
    const cStf = changed('staff',       staff);

    if (cIns.length) await up('instructors', cIns.map(s => ({ id: s.id, name: s.name, en: s.en, phone: nz(s.phone), email: nz(s.email), extra: blob(s) })));
    if (cVeh.length) await up('vehicles',    cVeh.map(v => ({ id: v.id, plate: v.plate, status: v.status, extra: blob(v) })));
    if (cStu.length) await up('students',    cStu.map(s => ({ id: s.id, name: s.name, en: s.en, status: s.status, inst_id: nz(s.instId), phone: nz(s.phone), email: nz(s.email), extra: blob(s) })));
    if (cLes.length) await up('lessons',     cLes.map(l => ({ id: l.id, date: toDate(l.date) || todayISO(), h: l.h, len: l.len || 1, student_id: nz(l.studentId), inst_id: nz(l.instId), veh: nz(l.veh), status: l.status, extra: blob(l) })));
    if (cInv.length) await up('invoices',    cInv.map(i => ({ id: i.id, student_id: nz(i.sId), amount: i.amount || 0, status: i.status, date: toDate(i.date), due: toDate(i.due), extra: blob(i) })));
    if (cStf.length) await up('staff',       cStf.map(s => ({ id: s.id, name: s.name, en: s.en, extra: blob(s) })));

    // Log what was skipped vs pushed
    const skipped = [
      !cVeh.length && 'vehicles', !cStu.length && 'students', !cLes.length && 'lessons',
      !cInv.length && 'invoices', !cIns.length && 'instructors', !cStf.length && 'staff',
    ].filter(Boolean);
    if (skipped.length) console.log('[Anzen] sync skipped (unchanged):', skipped.join(', '));

    // Curriculum (always push — small dataset, not per-user)
    const lc = [];
    const pushLib = (key, track, kind) => (lib[key] || []).forEach((it, idx) => lc.push({
      code: String(it.id || it.ytId || (track + '-' + kind + '-' + idx)),
      track, kind, km: it.km, en: it.en, mins: it.mins, yt_id: it.ytId, sort: idx, extra: blob(it),
    }));
    pushLib('theoryTexts', 'theory', 'text');       pushLib('theoryVideos', 'theory', 'video');       pushLib('theoryExercises', 'theory', 'exercise');
    pushLib('practicalTexts', 'practical', 'text'); pushLib('practicalVideos', 'practical', 'video'); pushLib('practicalExercises', 'practical', 'exercise');
    if (lc.length) await up('lesson_content', lc, 'code');

    await up('vehicle_inspections', inspections.map(r => ({
      vehicle_id: nz(r.vehicleId), date: toDate(r.date) || todayISO(), inspector: r.inspector,
      items: r.items || {}, fuel_level: r.fuelLevel, custom_items: r.customItems || {},
      renames: r.renames || {}, notes: r.notes, overall_status: r.overallStatus, extra: blob(r),
    })), 'vehicle_id,date');

    const attRows = [];
    Object.keys(ad).forEach(date => {
      const day = ad[date] || {};
      Object.keys(day).forEach(emp => { if (day[emp]) attRows.push({ date, emp_id: emp, status: day[emp] }); });
    });
    if (attRows.length) await up('attendance', attRows, 'date,emp_id');

    try { await window.sb.from('school_settings').upsert({ id: 1, data: blob(settings) }); }
    catch (e) { console.error('[Anzen] sync settings', e); }

    // Update snapshots to reflect what we just pushed
    lastIds = { vehicles: vIds, students: sIds, lessons: lIds, invoices: iIds };
    // Update content snap for pushed records so next sync computes correct diff
    const updateSnap = (t, pushed) => pushed.forEach(r => {
      if (!contentSnap[t]) contentSnap[t] = new Map();
      contentSnap[t].set(String(r.id), JSON.stringify(r));
    });
    updateSnap('vehicles',    cVeh);
    updateSnap('students',    cStu);
    updateSnap('lessons',     cLes);
    updateSnap('invoices',    cInv);
    updateSnap('instructors', cIns);
    updateSnap('staff',       cStf);

    return { ok: !firstErr, error: firstErr };
  }
})();
