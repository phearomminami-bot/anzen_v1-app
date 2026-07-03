// data.jsx — fake content (bilingual KH/EN)

// Student tracking phases. A student may pursue up to three programs; finishing
// ANY one counts as a success. Lessons are tagged with a phase so the record can
// be grouped KH / JP / AI.
const STUDENT_PHASES = [
  { k:'KH', label:'KH', color:'#2A5DB0' },
  { k:'JP', label:'JP', color:'#B0413E' },
  { k:'AI', label:'AI', color:'#12A302' },
];
const lessonPhase = (l) => (l && l.phase) || 'KH';   // legacy lessons default to KH
const phaseMeta   = (k) => STUDENT_PHASES.find(p => p.k === k) || STUDENT_PHASES[0];
if (typeof window !== 'undefined') { window.STUDENT_PHASES = STUDENT_PHASES; }

const CURRICULUM = [
  {
    id: 'stage1', km: 'ដំណាលទី១', en: 'Stage 1 — Driving Range',
    topics: [
      {id:'s1-01', km:'ឥរិយាបថបើកបរ និងការចូល និងចេញពីរថយន្ត',                                    en:'Driving posture, entering & exiting the vehicle'},
      {id:'s1-02', km:'ការគ្រប់គ្រងយន្តការរថយន្ត និងប្រព័ន្ធបើកបរ',                               en:'Vehicle controls & driving systems'},
      {id:'s1-03', km:'ការចាប់ផ្តើម និងការឈប់',                                                    en:'Starting & stopping'},
      {id:'s1-04', km:'ការលៃតម្រូវល្បឿន',                                                         en:'Speed adjustment'},
      {id:'s1-05', km:'ទីតាំងបើកបរ និងផ្លូវបើកបរ',                                                en:'Driving position & lane keeping'},
      {id:'s1-06', km:'ការចាប់ផ្តើម និងការបង្កើនល្បឿនទាន់ពេលវេលា',                               en:'Timely start & acceleration'},
      {id:'s1-07', km:'ឈប់តាមគោលដៅ',                                                             en:'Stopping at a target'},
      {id:'s1-08', km:'បើកបរលើផ្លូវកោង',                                                          en:'Driving on curves'},
      {id:'s1-09', km:'ឆ្លងកាត់លើជម្រាល',                                                         en:'Driving on slopes'},
      {id:'s1-10', km:'ដកថយ',                                                                     en:'Reversing'},
      {id:'s1-11', km:'ឆ្លងកាត់លើផ្លូវតូចចង្អៀត',                                                en:'Narrow road passage'},
      {id:'s1-12', km:'ការជ្រើសរើសផ្លូវ និងការផ្លាស់ប្តូរទិសដៅ',                                 en:'Route selection & direction change'},
      {id:'s1-13', km:'ការដោះស្រាយជាមួយឧបសគ្គ',                                                  en:'Dealing with obstacles'},
      {id:'s1-14', km:'អនុវត្តតាមផ្លាកសញ្ញា និងសញ្ញាសម្គាល់ពេលកំពុងបើកបរ',                      en:'Following signs & markings while driving'},
      {id:'s1-15', km:'បើកបរស្របតាមសញ្ញាចរាចរណ៍',                                                en:'Driving with traffic signals'},
      {id:'s1-16', km:'ឆ្លងកាត់ផ្លូវប្រសព្វត្រង់មួយ',                                             en:'Crossing a straight intersection'},
      {id:'s1-17', km:'ឆ្លងកាត់ផ្លូវប្រសព្វ (បត់ឆ្វេង)',                                          en:'Intersection — turning left'},
      {id:'s1-18', km:'ឆ្លងកាត់ផ្លូវប្រសព្វ (បត់ស្តាំ)',                                          en:'Intersection — turning right'},
      {id:'s1-19', km:'បើកបរឆ្លងកាត់ផ្លូវប្រសព្វដែលមានភាពមើលឃើញមិនល្អ',                         en:'Crossing low-visibility intersections'},
      {id:'s1-20', km:'ឆ្លងកាត់ផ្លូវរថភ្លើងឆ្លងកាត់',                                             en:'Crossing railway level crossings'},
      {id:'s1-21', km:'បើកបររថយន្តអូតូ',                                                          en:'Driving automatic transmission vehicles'},
      {id:'s1-22', km:'វិធានការក្នុងអំឡុងពេលបង្កើនល្បឿន ឬចាប់ផ្តើមភ្លាមៗ (ស្វ័យប្រវត្តិ)',       en:'Procedures for sudden acceleration/start (automatic)'},
      {id:'s1-23', km:'ការបញ្ជាក់ពីប្រសិទ្ធភាពនៃការបណ្តុះបណ្តាល (ការវាយតម្លៃ)',                   en:'Training effectiveness review (assessment)'},
    ]
  },
  {
    id: 'stage2', km: 'ដំណាលទី២', en: 'Stage 2 — Public Road',
    topics: [
      {id:'s2-01', km:'ការប្រុងប្រយ័ត្ន និងការរៀបចំមុនពេលបើកបរលើផ្លូវសាធារណៈ',                   en:'Precautions & preparation before public road driving'},
      {id:'s2-02', km:'បើកបរស្របតាមលំហូរចរាចរណ៍',                                                en:'Driving with traffic flow'},
      {id:'s2-03', km:'ទីតាំងចរាចរណ៍សមស្រប',                                                    en:'Appropriate traffic positioning'},
      {id:'s2-04', km:'ការផ្លាស់ប្តូរវគ្គ',                                                       en:'Course change / lane changing'},
      {id:'s2-05', km:'បើកបរស្របតាមសញ្ញា ផ្លាកសញ្ញា និងគំនូសសញ្ញា',                             en:'Following signals, signs & road markings'},
      {id:'s2-06', km:'ចរាចរណ៍នៅចំណុចប្រសព្វ',                                                   en:'Navigating intersections'},
      {id:'s2-07', km:'ការការពារអ្នកថ្មើរជើង និងអ្នកដទៃ',                                        en:'Protecting pedestrians & other road users'},
      {id:'s2-08', km:'បើកបរស្របតាមស្ថានភាពផ្លូវ និងចរាចរណ៍',                                   en:'Adapting to road & traffic conditions'},
      {id:'s2-09', km:'ការចត/ឈប់',                                                               en:'Parking & stopping'},
      {id:'s2-10', km:'ការផ្លាស់ប្តូរទិសដៅ និងការចតរថយន្តស្របគ្នា',                              en:'Direction change & parallel parking'},
      {id:'s2-11', km:'ការចាប់ហ្វ្រាំងភ្លាមៗ',                                                    en:'Emergency braking'},
      {id:'s2-12', km:'ការកំណត់ផ្លូវដឹកនាំដោយខ្លួនឯង',                                           en:'Independent route navigation'},
      {id:'s2-13', km:'ការបើកបរដោយផ្តោតលើការរំពឹងទុកគ្រោះថ្នាក់',                               en:'Hazard anticipation driving'},
      {id:'s2-14', km:'ការបើកបរលើផ្លូវហាយវេ',                                                   en:'Highway driving'},
      {id:'s2-15', km:'របស់របរពិសេសៗ',                                                           en:'Special situations & conditions'},
      {id:'s2-16', km:'ការបញ្ជាក់ពីប្រសិទ្ធភាពនៃការបណ្តុះបណ្តាល (ការវាយតម្លៃ)',                   en:'Training effectiveness review (assessment)'},
    ]
  }
];

const CURRICULUM_DONE_DEFAULT = [];

const STUDENTS = [];

const INSTRUCTORS = [];

const VEHICLES = [];

// Lessons: date=YYYY-MM-DD, h=start hour (7-18), len=hours, studentId/instId/veh=IDs or '—'
// status: 'scheduled' | 'done' | 'cancelled'  color: a=practical b=practical c=theory d=mock e=exam
const LESSONS = [];

const INVOICES = [];

const DAYS_KM = ["ច័ន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍","អាទិត្យ"];
const DAYS_EN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Staff (people who work at the school — includes instructors + admin/ops) ──
const STAFF = [];

// Today's attendance (keyed by staff id). status: 'in' | 'out' | 'absent' | 'leave'
const ATTENDANCE_TODAY = {};

// Weekly attendance grid — daysPresent / expectedDays per staff this week
const ATTENDANCE_WEEK = {};

// Leave requests
const LEAVE_REQUESTS = [];

const nextLessonId = () => {
  const nums = LESSONS.map(l => parseInt((l.id||'').replace('L-',''))).filter(n=>!isNaN(n));
  const n = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return 'L-' + String(n).padStart(4,'0');
};

// ── Activity history (audit log) ──────────────────────────────────────────
// Records who did what (create / edit / delete / settings) so admins can review
// instructor activity. Stored inside the synced settings blob so it reaches the
// admin's device through the normal cloud sync.
const ACTIVITY_MAX = 600;
window.__logActivity = function (action, entity, detail) {
  try {
    const ss = window.__schoolSettings || (window.__schoolSettings = {});
    if (!Array.isArray(ss.activityLog)) ss.activityLog = [];
    const u = window.__currentUser || {};
    ss.activityLog.unshift({
      id: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts: Date.now(),
      user: window.__currentUserName || u.en || u.km || 'Unknown',
      role: window.__currentRole || 'student',
      action: action || 'edit',          // 'create' | 'edit' | 'delete' | 'settings'
      entity: entity || '',              // e.g. 'student', 'lesson', 'vehicle'
      detail: detail || '',              // human-readable label of the record
    });
    if (ss.activityLog.length > ACTIVITY_MAX) ss.activityLog.length = ACTIVITY_MAX;
    if (window.saveAllData) window.saveAllData(true);   // persist locally; cloud push rides the action's own save
    try { window.__captureSnapshot && window.__captureSnapshot(true); } catch(e) {}   // restore point for this action
    if (window.__notifyAuditChanged) window.__notifyAuditChanged();
  } catch (e) {}
};

// ── Persistence ───────────────────────────────────────────────────────────
const STORE_KEY = 'anzen_v1';

const saveAllData = (skipCloud) => {
  // Accidents live inside the synced settings blob so they persist and are
  // shared with everyone (Vehicle-management Accident log), not just this device.
  try { if (window.__schoolSettings) window.__schoolSettings.accidents = window.__incidentData || []; } catch (e) {}
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      v: 1,
      STUDENTS, INSTRUCTORS, VEHICLES, LESSONS, INVOICES, STAFF, LEAVE_REQUESTS,
      staffData:    window.__staffData        || [],
      appData:      window.__applicationsData || [],
      bookData:     window.__bookingData      || [],
      maintData:    window.__maintenanceData  || [],
      serviceLog:   window.__serviceLog       || [],
      inspections:  window.__vehicleInspections || [],
      inspRenames:  window.__inspRenames       || {},
      studentColors: window.__studentColorAssign || {},
      incidentLog:  window.__incidentData     || [],
      expenseLog:   window.__expenseLog       || [],
      auditLog:     window.__auditLog         || [],
      leaveData:    window.__leaveData        || [],
      waitlist:     window.__waitlistData     || [],
      attendanceData: window.__attendanceData || {},
      payrollRuns:  window.__payrollRuns      || [],
      attToday:     ATTENDANCE_TODAY,
      attWeek:      ATTENDANCE_WEEK,
      settings:     window.__schoolSettings   || {},
      staffPolicy:  window.__staffPolicy      || {},
      currDone:     window.__curriculumDone ? [...window.__curriculumDone] : [],
      currFeedback: window.__curriculumFeedback || {},
    }));
    window.__autoBackup?.();
    try { window.__captureSnapshot && window.__captureSnapshot(); } catch(e) {}
  } catch(e) {}
  // Cache the real logo/name in its own tiny key (independent of the big blob
  // above, which can fail on quota) so the loading splash shows it next reload.
  try { const _b = window.__schoolSettings || {}; if (_b.logo || _b.name) localStorage.setItem('anzen_brand', JSON.stringify({ logo: _b.logo || null, name: _b.name || null })); } catch (e) {}
  // Mirror the change up to Supabase when connected (debounced inside __sbSyncAll).
  // skipCloud=true for the periodic auto-save — only user-triggered changes push to cloud.
  if (!skipCloud) {
    try { if (window.__sbConfigured && window.__sbConfigured()) window.__sbSyncAll && window.__sbSyncAll(); } catch(e) {}
  }
};

// ── Restore points (point-in-time snapshots) ──────────────────────────────
// A snapshot = the full local data blob + timestamp, kept in a local ring so the
// admin can roll the whole system back to a chosen hour/day. Snapshots are
// device-local (not synced — too large); restoring re-pushes to the cloud.
const SNAP_KEY = 'anzen_snapshots';
let __lastSnapTs = 0;
function __readSnaps() { try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); } catch(e) { return []; } }
function __writeSnaps(list) {
  let arr = list.slice(0, 40);                 // hard cap; newest-first
  while (arr.length) {
    try { localStorage.setItem(SNAP_KEY, JSON.stringify(arr)); return true; }
    catch(e) { arr = arr.slice(0, arr.length - 1); }   // over quota → drop the oldest, retry
  }
  return false;
}
window.__captureSnapshot = function (force) {
  const now = Date.now();
  if (!force && now - __lastSnapTs < 90000) return;     // throttle automatic captures to ≥90s apart
  __lastSnapTs = now;
  try {
    const data = localStorage.getItem(STORE_KEY);
    if (!data) return;
    const snaps = __readSnaps();
    // collapse near-duplicate timestamps (avoid two within 2s)
    if (snaps[0] && now - snaps[0].ts < 2000) { snaps[0] = { id: snaps[0].id, ts: now, data }; }
    else snaps.unshift({ id: 'S' + now.toString(36), ts: now, data });
    __writeSnaps(snaps);
  } catch(e) {}
};
window.__listSnapshots = function () { return __readSnaps().map(s => ({ id: s.id, ts: s.ts })); };
function __hydrateFromBlob(saved) {
  const setArr = (arr, key) => { if (Array.isArray(arr)) { arr.length = 0; if (Array.isArray(saved[key])) arr.push(...saved[key]); } };
  setArr(STUDENTS,'STUDENTS'); setArr(INSTRUCTORS,'INSTRUCTORS'); setArr(VEHICLES,'VEHICLES');
  setArr(LESSONS,'LESSONS'); setArr(INVOICES,'INVOICES'); setArr(STAFF,'STAFF'); setArr(LEAVE_REQUESTS,'LEAVE_REQUESTS');
  window.__staffData = saved.staffData || []; window.__applicationsData = saved.appData || [];
  window.__bookingData = saved.bookData || []; window.__maintenanceData = saved.maintData || [];
  window.__serviceLog = saved.serviceLog || []; window.__vehicleInspections = saved.inspections || [];
  window.__inspRenames = saved.inspRenames || {}; window.__studentColorAssign = saved.studentColors || {};
  window.__incidentData = saved.incidentLog || []; window.__expenseLog = saved.expenseLog || [];
  window.__auditLog = saved.auditLog || []; window.__leaveData = saved.leaveData || [];
  window.__waitlistData = saved.waitlist || []; window.__attendanceData = saved.attendanceData || {};
  window.__payrollRuns = saved.payrollRuns || [];
  try { if (saved.attToday) Object.assign(ATTENDANCE_TODAY, saved.attToday); } catch(e){}
  try { if (saved.attWeek) Object.assign(ATTENDANCE_WEEK, saved.attWeek); } catch(e){}
  window.__schoolSettings = saved.settings || {};
  if (saved.staffPolicy) window.__staffPolicy = saved.staffPolicy;
  window.__curriculumDone = new Set(saved.currDone || []);
  window.__curriculumFeedback = saved.currFeedback || {};
}
window.__restoreSnapshot = async function (id) {
  const s = __readSnaps().find(x => x.id === id);
  if (!s) return false;
  let saved; try { saved = JSON.parse(s.data); } catch(e) { return false; }
  if (!saved) return false;
  try { localStorage.setItem(STORE_KEY, s.data); } catch(e) {}   // local ← restored
  try {
    if (window.__sbConfigured && window.__sbConfigured() && window.__sbPushNow) {
      __hydrateFromBlob(saved);          // load restored data into memory…
      await window.__sbPushNow();         // …so the cloud is overwritten with the restored state
    }
  } catch(e) {}
  setTimeout(() => { try { location.reload(); } catch(e) {} }, 300);
  return true;
};

// Restore saved data on startup
(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!saved || saved.v !== 1) return;
    const fill = (arr, key) => { if (saved[key]?.length) { arr.length = 0; arr.push(...saved[key]); } };
    fill(STUDENTS,       'STUDENTS');
    fill(INSTRUCTORS,    'INSTRUCTORS');
    fill(VEHICLES,       'VEHICLES');
    fill(LESSONS,        'LESSONS');
    fill(INVOICES,       'INVOICES');
    fill(STAFF,          'STAFF');
    fill(LEAVE_REQUESTS, 'LEAVE_REQUESTS');
    if (saved.staffData?.length)  window.__staffData        = saved.staffData;
    if (saved.appData?.length)    window.__applicationsData = saved.appData;
    if (saved.bookData?.length)   window.__bookingData      = saved.bookData;
    if (saved.maintData?.length)   window.__maintenanceData  = saved.maintData;
    if (saved.serviceLog?.length)  window.__serviceLog       = saved.serviceLog;
    if (saved.inspections?.length) window.__vehicleInspections = saved.inspections;
    if (saved.inspRenames && Object.keys(saved.inspRenames).length) window.__inspRenames = saved.inspRenames;
    if (saved.studentColors && Object.keys(saved.studentColors).length) window.__studentColorAssign = saved.studentColors;
    if (saved.incidentLog?.length) window.__incidentData     = saved.incidentLog;
    if (saved.expenseLog?.length)  window.__expenseLog       = saved.expenseLog;
    if (saved.auditLog?.length)   window.__auditLog         = saved.auditLog;
    if (saved.leaveData?.length)  window.__leaveData        = saved.leaveData;
    if (saved.waitlist?.length)   window.__waitlistData     = saved.waitlist;
    if (saved.attendanceData)     window.__attendanceData   = saved.attendanceData;
    if (saved.payrollRuns?.length) window.__payrollRuns     = saved.payrollRuns;
    if (saved.attToday) Object.assign(ATTENDANCE_TODAY, saved.attToday);
    if (saved.attWeek)  Object.assign(ATTENDANCE_WEEK,  saved.attWeek);
    if (saved.settings) window.__savedSettings = saved.settings;
    if (saved.staffPolicy && Object.keys(saved.staffPolicy).length) window.__staffPolicy = saved.staffPolicy;
    if (saved.currDone?.length)  window.__savedCurriculumDone     = new Set(saved.currDone);
    if (saved.currFeedback)      window.__savedCurriculumFeedback = saved.currFeedback;
  } catch(e) {}
})();

setInterval(() => { try { saveAllData(true); } catch(e) {} }, 30000); // localStorage only — cloud sync only on user actions

Object.assign(window, { STUDENTS, INSTRUCTORS, VEHICLES, LESSONS, INVOICES, DAYS_KM, DAYS_EN, STAFF, ATTENDANCE_TODAY, ATTENDANCE_WEEK, LEAVE_REQUESTS, CURRICULUM, CURRICULUM_DONE_DEFAULT, nextLessonId, saveAllData });

// ── Telegram delivery (client-side via the Bot API) ─────────────────────────
// Sends a message to a chat_id using the school's bot token (CORS-enabled API).
window.__sendTelegram = async (chatId, text) => {
  const tg = (window.__schoolSettings || {}).telegram || {};
  if (!tg.enabled)        return { ok:false, err:'Telegram disabled' };
  if (!tg.token)          return { ok:false, err:'No bot token' };
  if (!chatId)            return { ok:false, err:'No chat ID' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${tg.token}/sendMessage`, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ chat_id:String(chatId).trim(), text }),
    });
    const j = await res.json().catch(() => ({ ok:false, description:'Invalid response' }));
    return { ok: !!j.ok, err: j.description };
  } catch (e) { return { ok:false, err: e.message }; }
};
// Auto-send to a student's Telegram when auto-send is enabled
window.__autoTelegramStudent = (studentId, text) => {
  const tg = (window.__schoolSettings || {}).telegram || {};
  if (!tg.enabled || !tg.autoSend) return Promise.resolve({ ok:false, err:'auto-send off' });
  const s = (window.STUDENTS || []).find(x => x.id === studentId);
  if (!s || !s.telegram) return Promise.resolve({ ok:false, err:'no student chat ID' });
  return window.__sendTelegram(s.telegram, text);
};

