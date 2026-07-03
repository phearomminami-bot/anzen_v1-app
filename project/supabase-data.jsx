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
  let _lastAuxPull = 0;   // throttle for heavy auxiliary tables (see __sbLoadAll)
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
  let _loadErrors = 0; // counts failed pulls in the current __sbLoadAll pass
  const pull = async (t) => {
    try {
      const { data, error } = await window.sb.from(t).select('*');
      if (error) { console.error('[Anzen] load ' + t + ':', error.message); _loadErrors++; return null; }
      return data || [];
    } catch (e) { console.error('[Anzen] load ' + t, e); _loadErrors++; return null; }
  };

  const fill = (arr, rows, initialLoad, table) => {
    if (!rows) return;
    // SAFETY GUARD: an empty cloud table while we still hold local rows is almost
    // always a failed/incomplete load — NEVER mass-delete local data on that basis.
    // (This is what wiped a device after a failed migration push.)
    if (!initialLoad && rows.length === 0 && arr.length > 0) return;
    const cloudMap = {};
    rows.forEach(r => { const o = rowObj(r); if (o.id) cloudMap[o.id] = o; });
    // Baseline = the cloud-confirmed state. Used to protect un-synced LOCAL changes
    // from being clobbered when a cloud reload races a local edit — which is what
    // caused new lessons to vanish, edits to revert, and deletes to come back.
    // On a reload we update the baseline ONLY for rows we adopt from the cloud, so
    // un-synced local changes stay "different" and still get pushed on next sync.
    const base = contentSnap[table];
    const wasSynced = (id) => !!(base && base.has(String(id)));
    const setBase = (id, val) => { if (!initialLoad && base) base.set(String(id), val); };
    for (let i = arr.length - 1; i >= 0; i--) {
      const id = arr[i].id;
      if (!id) continue;
      if (cloudMap[id]) {
        // Keep the local copy if we edited it since the last sync (local edit wins
        // until it is pushed); otherwise adopt the cloud copy + advance the baseline.
        const localEdited = wasSynced(id) && base.get(String(id)) !== JSON.stringify(arr[i]);
        if (!localEdited) { arr[i] = cloudMap[id]; setBase(id, JSON.stringify(cloudMap[id])); }
        delete cloudMap[id];
      } else if (!initialLoad) {
        // Cloud lacks this row. Remove only if we'd synced it before (so it was
        // genuinely deleted on another device). A fresh local create stays.
        if (wasSynced(id)) { arr.splice(i, 1); if (base) base.delete(String(id)); }
      }
    }
    Object.values(cloudMap).forEach(o => {
      // Cloud has a row we don't. If we'd synced it before, we deleted it locally —
      // don't resurrect it (the pending delete will push). Otherwise it's new.
      if (wasSynced(o.id)) return;
      arr.push(o);
      setBase(o.id, JSON.stringify(o));
    });
  };

  // ── LOAD ──────────────────────────────────────────────────────────────────
  window.__sbLoadAll = async (isInitialLoad) => {
    if (!window.sb) return false;
    const initial = (isInitialLoad === true) || !window.__sbReady;

    _loadErrors = 0;
    const [stu, ins, veh, les, inv, stf] = await Promise.all(
      ['students', 'instructors', 'vehicles', 'lessons', 'invoices', 'staff'].map(pull));

    // If every core table failed (network/auth down on a cold session), don't
    // adopt the empty result or mark ready — let the caller retry so we never
    // strand the user on a blank "default" app while the cloud data still exists.
    const coreAllFailed = (stu === null && ins === null && veh === null && les === null);
    if (coreAllFailed) { return false; }

    fill(window.INSTRUCTORS, ins, initial, 'instructors');
    fill(window.VEHICLES,    veh, initial, 'vehicles');
    fill(window.STUDENTS,    stu, initial, 'students');
    fill(window.LESSONS,     les, initial, 'lessons');
    fill(window.INVOICES,    inv, initial, 'invoices');
    fill(window.STAFF,       stf, initial, 'staff');
    if (stf && stf.length) window.__staffData = stf.map(rowObj);

    // Heavy auxiliary tables (curriculum, inspections, attendance, and the
    // settings blob — which can carry the base64 logo) rarely change. Re-pulling
    // them on every 3-min poll / realtime burst wastes a lot of egress, so fetch
    // them on the initial load and then at most once every ~2 minutes.
    if (initial || (Date.now() - _lastAuxPull > 120000)) {
      _lastAuxPull = Date.now();

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
      // Cache the real logo/name so the loading splash can show it on next reload.
      try {
        const b = window.__schoolSettings || {};
        if (b.logo || b.name) localStorage.setItem('anzen_brand', JSON.stringify({ logo: b.logo || null, name: b.name || null }));
      } catch (e) {}
    }

    snapshotIds();
    // Only reset the whole baseline on the first load. On reloads, fill() advances
    // the baseline per-row for adopted cloud rows, so un-synced local changes keep
    // their pending state and still push (instead of being absorbed + lost).
    if (initial) takeContentSnap();

    window.__sbReady = true;
    refreshUI();
    if (window.__sbSubscribe) window.__sbSubscribe();
    return true;
  };

  // Resilient load: waits for the Supabase client to come up (its library
  // <script> can lag on mobile), then retries the load on transient failure
  // with exponential backoff. Prevents a single failed cold-start request from
  // dropping the user into a blank, default-branded app.
  window.__sbLoadAllRetry = async (isInitialLoad) => {
    // Wait for the client library/credentials to be ready (up to ~8s).
    const start = Date.now();
    while (!window.sb && Date.now() - start < 8000) {
      await new Promise(r => setTimeout(r, 150));
    }
    if (!window.sb) return false;
    const delays = [0, 1000, 2000, 4000, 8000];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
      try {
        const ok = await window.__sbLoadAll(isInitialLoad);
        if (ok) return true;
      } catch (e) { /* retry */ }
    }
    return false;
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
  // Reload ONLY the table that changed — not every table. A full select('*')
  // across all tables re-downloads every base64 photo + the logo on each edit,
  // which is what burned through the free-tier egress quota.
  const TABLE_ARR = {
    students: () => window.STUDENTS, instructors: () => window.INSTRUCTORS,
    vehicles: () => window.VEHICLES, lessons: () => window.LESSONS,
    invoices: () => window.INVOICES, staff: () => window.STAFF,
  };
  window.__sbLoadTable = async (t) => {
    if (!window.sb || !window.__sbReady) return;
    if (t === 'vehicle_inspections') {
      const insp = await pull(t); if (insp) { window.__vehicleInspections = insp.map(rowObj); refreshUI(); }
      return;
    }
    const getArr = TABLE_ARR[t];
    if (!getArr) { return window.__sbLoadAll && window.__sbLoadAll(); }
    const rows = await pull(t);
    if (rows === null) return;               // network error — skip this reload
    fill(getArr(), rows, false, t);
    if (t === 'staff') window.__staffData = rows.map(rowObj);
    snapshotIds();
    refreshUI();
  };

  let rtTimer = null;
  const rtTables = new Set();
  let rtPendingHidden = false;
  function scheduleRealtimeReload(table) {
    if (table) rtTables.add(table);
    // Tab hidden → nobody's looking, so don't spend egress. Reload once on return.
    if (typeof document !== 'undefined' && document.hidden) { rtPendingHidden = true; return; }
    clearTimeout(rtTimer);
    rtTimer = setTimeout(() => {
      // Never pull while local changes are still waiting to push.
      if (window.__sbHasPendingSync) { scheduleRealtimeReload(); return; }
      const tables = [...rtTables]; rtTables.clear();
      // Many tables at once → one full reload beats several round-trips.
      if (tables.length === 0 || tables.length >= 4) {
        window.__sbLoadAll && window.__sbLoadAll().catch(() => {});
      } else {
        tables.forEach(t => window.__sbLoadTable(t).catch(() => {}));
      }
    }, 1200);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && rtPendingHidden) { rtPendingHidden = false; scheduleRealtimeReload(); }
    });
  }

  window.__sbSubscribe = function () {
    if (!window.sb || window.__sbSubscribed) return;
    window.__sbSubscribed = true;
    const TABLES = ['vehicles', 'students', 'instructors', 'lessons', 'invoices', 'staff', 'vehicle_inspections'];
    TABLES.forEach(table => {
      try {
        window.sb
          .channel('anzen-rt-' + table)
          .on('postgres_changes', { event: '*', schema: 'public', table }, () => scheduleRealtimeReload(table))
          .subscribe(status => { if (status === 'SUBSCRIBED') console.log('[Anzen] RT:', table); });
      } catch (e) { console.warn('[Anzen] RT subscribe failed:', table, e); }
    });
  };

  // ── SAVE ──────────────────────────────────────────────────────────────────
  let syncTimer = null;

  window.__sbSyncAll = function () {
    if (!window.sb || !window.__sbReady || !window.__sbSyncEnabled) return;
    // Stays true through the ENTIRE push below (debounce + async upserts), so cloud
    // reloads keep deferring until our local changes are safely in the cloud.
    window.__sbHasPendingSync = true;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      doSync().catch(() => {}).finally(() => { window.__sbHasPendingSync = false; });
    }, 1200);
  };

  window.__sbPushNow = async function () {
    if (!window.sb) return { ok: false, error: 'not-configured' };
    clearTimeout(syncTimer);
    try { return await doSync(); }
    finally { window.__sbHasPendingSync = false; }
  };

  // One-time migration helper: forget the change-tracking baseline so doSync
  // pushes EVERY local record up to the (new/empty) cloud project. Used when
  // moving to a fresh Supabase project — uploads all local data in one go.
  window.__sbForcePushAll = async function () {
    if (!window.sb) return { ok: false, error: 'not-configured' };
    clearTimeout(syncTimer);
    contentSnap = {};        // empty baseline → changed() returns all rows
    lastIds = null;          // don't delete anything based on a stale snapshot
    window.__sbHasPendingSync = true;
    try { return await doSync(); }
    finally { window.__sbHasPendingSync = false; }
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
        else { console.log('[Anzen] deleted from ' + table + ':', removed); removed.forEach(id => { if (contentSnap[table]) contentSnap[table].delete(String(id)); }); }
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

    // Only advance the "synced" baseline when the push actually SUCCEEDED. If any
    // upsert errored, leave records un-synced so (a) they get re-pushed next time,
    // and (b) a later reload doesn't treat them as "deleted from cloud" and wipe
    // local data — which is exactly how a failed migration push lost data.
    if (!firstErr) {
      lastIds = { vehicles: vIds, students: sIds, lessons: lIds, invoices: iIds };
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
    }

    return { ok: !firstErr, error: firstErr };
  }
})();
