// data.jsx — fake content (bilingual KH/EN)

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
      role: window.__currentRole || 'admin',
      action: action || 'edit',          // 'create' | 'edit' | 'delete' | 'settings'
      entity: entity || '',              // e.g. 'student', 'lesson', 'vehicle'
      detail: detail || '',              // human-readable label of the record
    });
    if (ss.activityLog.length > ACTIVITY_MAX) ss.activityLog.length = ACTIVITY_MAX;
    if (window.saveAllData) window.saveAllData(true);   // persist locally; cloud push rides the action's own save
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
  } catch(e) {}
  // Mirror the change up to Supabase when connected (debounced inside __sbSyncAll).
  // skipCloud=true for the periodic auto-save — only user-triggered changes push to cloud.
  if (!skipCloud) {
    try { if (window.__sbConfigured && window.__sbConfigured()) window.__sbSyncAll && window.__sbSyncAll(); } catch(e) {}
  }
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

