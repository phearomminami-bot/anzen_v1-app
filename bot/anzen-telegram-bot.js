#!/usr/bin/env node
/**
 * Anzen Driving School — Telegram reminder bot
 * ------------------------------------------------------------------
 * A tiny, dependency-free companion server (Node 18+) that:
 *   1. Reads the data the Anzen web-app exports (Settings → Data backup → "Backup now").
 *   2. Sends each student a Telegram reminder a set time BEFORE every lesson
 *      (default: 24 hours and 1 hour before), using the message templates
 *      saved in the app.
 *   3. De-duplicates so a reminder is sent only once.
 *   4. Replies with the chat ID when a student sends /start to the bot — copy
 *      that number into the student's profile (Telegram Chat ID field).
 *   5. (Optional) Accepts the backup JSON over HTTP at POST /ingest, so the
 *      data file can be refreshed without manual copying.
 *
 * Time-scheduled delivery needs an always-on process — run this with pm2,
 * systemd, Docker, or a cron job (see README.md).
 *
 * No npm install required: uses built-in fetch / http / fs (Node >= 18).
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const http = require('http');

// ── Config (env vars override defaults) ──────────────────────────────────────
const CFG = {
  // Bot token from @BotFather. If omitted, the token saved in the app
  // (settings.telegram.token) is used.
  token:        process.env.TELEGRAM_BOT_TOKEN || '',
  // Path to the exported Anzen backup JSON.
  dataFile:     process.env.ANZEN_DATA_FILE || path.join(__dirname, 'anzen-data.json'),
  // Where the "already sent" log is stored.
  sentFile:     process.env.ANZEN_SENT_FILE || path.join(__dirname, 'sent.json'),
  // How often to check, in seconds.
  intervalSec:  parseInt(process.env.CHECK_INTERVAL_SEC || '60', 10),
  // Reminder offsets in minutes before the lesson → template key.
  // 1440 = 24h (uses template "lesson24"), 60 = 1h (uses "lesson1").
  offsets: (process.env.REMINDER_OFFSETS_MIN || '1440:lesson24,60:lesson1')
              .split(',').map(s => { const [m,k] = s.split(':'); return { mins: parseInt(m,10), tkey: (k||'lesson24').trim() }; }),
  // Language for templates: 'km' or 'en'.
  lang:         (process.env.LANG_PREF || 'km').toLowerCase() === 'en' ? 'en' : 'km',
  // Log instead of actually sending (great for a first test, no token needed).
  dryRun:       /^(1|true|yes)$/i.test(process.env.DRY_RUN || ''),
  // Optional HTTP ingest port (0 = disabled).
  httpPort:     parseInt(process.env.INGEST_PORT || '0', 10),
};

const API = (token, method) => `https://api.telegram.org/bot${token}/${method}`;
const log = (...a) => console.log(new Date().toISOString(), ...a);
const pad = (n) => String(n).padStart(2, '0');

// ── Built-in default templates (fallback if the app has none) ────────────────
const DEFAULT_TEMPLATES = {
  lesson24: { km:'ជំរាបសួរ {student.name} 👋 មេរៀនបន្ទាប់របស់អ្នកនឹងប្រព្រឹត្តទៅ {lesson.date} ម៉ោង {lesson.time} ជាមួយលោកគ្រូ {instructor.name}។',
              en:'Hi {student.name} 👋 Your next lesson is on {lesson.date} at {lesson.time} with {instructor.name}.' },
  lesson1:  { km:'{student.name} មេរៀនរបស់អ្នកនឹងចាប់ផ្ដើមក្នុង ១ ម៉ោងទៀត ({lesson.time})។',
              en:'{student.name}, your lesson starts in 1 hour ({lesson.time}).' },
};

// ── Data loading ─────────────────────────────────────────────────────────────
function loadData() {
  try {
    const raw = fs.readFileSync(CFG.dataFile, 'utf8');
    const d = JSON.parse(raw);
    return {
      students: d.STUDENTS || [],
      lessons:  d.LESSONS  || [],
      instructors: d.INSTRUCTORS || [],
      settings: d.settings || {},
    };
  } catch (e) {
    log('⚠️  Could not read data file:', CFG.dataFile, '—', e.message);
    return { students: [], lessons: [], instructors: [], settings: {} };
  }
}

function loadSent() {
  try { return new Set(JSON.parse(fs.readFileSync(CFG.sentFile, 'utf8'))); }
  catch { return new Set(); }
}
function saveSent(set) {
  try { fs.writeFileSync(CFG.sentFile, JSON.stringify([...set]), 'utf8'); }
  catch (e) { log('⚠️  Could not write sent log:', e.message); }
}

// ── Template filling ─────────────────────────────────────────────────────────
function fillTemplate(tpl, { student, lesson, instructor, schoolName }) {
  return String(tpl || '')
    .replace(/\{student\.name\}/g,    student?.name || student?.en || '')
    .replace(/\{lesson\.date\}/g,     lesson?.date || '')
    .replace(/\{lesson\.time\}/g,     pad(lesson?.h || 0) + ':00')
    .replace(/\{instructor\.name\}/g, instructor?.en || instructor?.name || '')
    .replace(/\{school\.name\}/g,     schoolName || 'Anzen');
}

// ── Telegram send ────────────────────────────────────────────────────────────
async function tgSend(token, chatId, text) {
  if (CFG.dryRun) { log(`   [DRY-RUN] → chat ${chatId}: ${text}`); return { ok: true }; }
  try {
    const res = await fetch(API(token, 'sendMessage'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: String(chatId).trim(), text }),
    });
    const j = await res.json();
    if (!j.ok) log('   ✖ Telegram error:', j.description);
    return j;
  } catch (e) { log('   ✖ send failed:', e.message); return { ok: false, err: e.message }; }
}

// ── One reminder pass ────────────────────────────────────────────────────────
async function checkAndSend() {
  const data   = loadData();
  const token  = CFG.token || data.settings?.telegram?.token || '';
  if (!token && !CFG.dryRun) { log('⚠️  No bot token (set TELEGRAM_BOT_TOKEN or save one in the app).'); return; }

  const templates  = data.settings?.notifTemplates || {};
  const schoolName = data.settings?.name || 'Anzen';
  const sent = loadSent();
  const now  = Date.now();
  const intervalMs = CFG.intervalSec * 1000;
  let sentCount = 0;

  for (const lesson of data.lessons) {
    if (!lesson || lesson.status === 'cancelled' || lesson.status === 'done') continue;
    if (!lesson.studentId || lesson.studentId === '—' || !lesson.date) continue;

    const student = data.students.find(s => s.id === lesson.studentId);
    if (!student || !student.telegram) continue;   // student needs a chat ID

    const instructor = data.instructors.find(i => i.id === lesson.instId);
    const lessonTime = new Date(`${lesson.date}T${pad(lesson.h || 0)}:00:00`).getTime();
    if (isNaN(lessonTime)) continue;

    for (const off of CFG.offsets) {
      const fireAt = lessonTime - off.mins * 60000;          // when this reminder is due
      // Fire when "now" has just passed fireAt within this interval window,
      // and the lesson hasn't started yet.
      if (now >= fireAt && now < fireAt + intervalMs && now < lessonTime) {
        const key = `${lesson.id}:${off.mins}`;
        if (sent.has(key)) continue;
        const tpl = (templates[off.tkey] || DEFAULT_TEMPLATES[off.tkey] || DEFAULT_TEMPLATES.lesson24)[CFG.lang]
                  || (DEFAULT_TEMPLATES[off.tkey] || DEFAULT_TEMPLATES.lesson24).km;
        const text = fillTemplate(tpl, { student, lesson, instructor, schoolName });
        log(`→ Reminder (${off.mins}m) ${student.name} · lesson ${lesson.id} @ ${lesson.date} ${pad(lesson.h)}:00`);
        const r = await tgSend(token, student.telegram, text);
        if (r.ok) { sent.add(key); sentCount++; }
      }
    }
  }

  // Keep the sent log from growing forever — drop keys for past lessons (>2 days old isn't tracked here; simple cap).
  if (sent.size > 5000) { const arr=[...sent]; saveSent(new Set(arr.slice(arr.length-3000))); }
  else saveSent(sent);

  if (sentCount) log(`✓ Sent ${sentCount} reminder(s).`);
}

// ── /start chat-ID helper (long polling) ─────────────────────────────────────
let pollOffset = 0;
async function pollUpdates() {
  const token = CFG.token || loadData().settings?.telegram?.token || '';
  if (!token || CFG.dryRun) return;
  try {
    const res = await fetch(API(token, 'getUpdates') + `?timeout=30&offset=${pollOffset}`);
    const j = await res.json();
    if (!j.ok) return;
    for (const u of j.result) {
      pollOffset = u.update_id + 1;
      const msg = u.message;
      if (msg && msg.text && /^\/start/i.test(msg.text)) {
        const chatId = msg.chat.id;
        const name = msg.from?.first_name || '';
        await tgSend(token, chatId,
          `សួស្ដី ${name}! 🚗\nChat ID របស់អ្នកគឺ: ${chatId}\nសូមផ្ដល់លេខនេះទៅសាលា ដើម្បីទទួលការរំលឹកមេរៀន។\n\nYour Chat ID is: ${chatId} — give it to the school to receive lesson reminders.`);
        log(`ℹ️  /start from ${name} → chat ID ${chatId}`);
      }
    }
  } catch (e) { /* network hiccup — ignore, retry next loop */ }
}

// ── Optional HTTP ingest (POST /ingest with the backup JSON body) ────────────
function startHttp() {
  if (!CFG.httpPort) return;
  http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/ingest') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 20e6) req.destroy(); });
      req.on('end', () => {
        try {
          JSON.parse(body);                              // validate
          fs.writeFileSync(CFG.dataFile, body, 'utf8');
          log('✓ Data refreshed via /ingest');
          res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
          res.end('{"ok":true}');
        } catch (e) {
          res.writeHead(400); res.end('{"ok":false,"err":"invalid JSON"}');
        }
      });
    } else if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST', 'Access-Control-Allow-Headers':'Content-Type' });
      res.end();
    } else {
      const d = loadData();
      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' });
      res.end(`Anzen Telegram bot is running.\nStudents: ${d.students.length} · Lessons: ${d.lessons.length}\nPOST your backup JSON to /ingest to refresh.\n`);
    }
  }).listen(CFG.httpPort, () => log(`🌐 Ingest server on http://localhost:${CFG.httpPort}  (POST /ingest)`));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const once = process.argv.includes('--once');
  log('🤖 Anzen Telegram bot starting…');
  log(`   data file : ${CFG.dataFile}`);
  log(`   offsets   : ${CFG.offsets.map(o=>o.mins+'m→'+o.tkey).join(', ')}`);
  log(`   interval  : ${CFG.intervalSec}s · lang: ${CFG.lang}${CFG.dryRun?' · DRY-RUN':''}`);

  if (once) { await checkAndSend(); log('Done (--once).'); return; }

  startHttp();
  await checkAndSend();
  setInterval(checkAndSend, CFG.intervalSec * 1000);
  // poll for /start messages continuously (long-poll loop)
  (async function loop(){ for(;;){ await pollUpdates(); await new Promise(r=>setTimeout(r, 1000)); } })();
}

main().catch(e => { console.error(e); process.exit(1); });
