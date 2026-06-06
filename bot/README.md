# Anzen — Telegram reminder bot 🤖

A tiny, **zero-dependency** Node.js (≥18) companion that sends each student a
Telegram reminder **before every lesson** (default 24 h and 1 h before), using
the data and message templates from the Anzen web app.

> The web app can already send Telegram messages *on events* (when a lesson is
> booked) while it's open. This bot adds **time-scheduled** delivery, which
> needs an always-on process.

---

## 1. Create the bot
1. Open Telegram → talk to **@BotFather** → `/newbot` → copy the **token**.
2. Each student opens your bot and sends **`/start`**. The bot replies with
   their **Chat ID** — paste that number into the student's profile in the app
   (Students → profile → *Telegram Chat ID*).

## 2. Give the bot your data
The app stores data in the browser. Export it:
**Settings → Data backup → “Backup now”** → you get `anzen-backup.json`.

Put that file where the bot can read it (default `./anzen-data.json`), e.g.:
```bash
cp ~/Downloads/anzen-backup.json bot/anzen-data.json
```
Refresh it whenever the schedule changes (or use the optional `/ingest`
endpoint below to push it automatically).

## 3. Run it
```bash
cd bot
cp .env.example .env          # then edit .env and paste your token

# Node 20+ (loads .env automatically):
node --env-file=.env anzen-telegram-bot.js

# or set the token inline:
TELEGRAM_BOT_TOKEN=123456:ABC... node anzen-telegram-bot.js
```

Test first **without sending anything**:
```bash
npm run dry        # DRY_RUN — logs the messages it *would* send, no token needed
```

Run a single check (handy for cron):
```bash
node anzen-telegram-bot.js --once
```

## 4. Keep it always-on
**pm2**
```bash
npm i -g pm2
pm2 start anzen-telegram-bot.js --name anzen-bot
pm2 save && pm2 startup
```

**systemd** (`/etc/systemd/system/anzen-bot.service`)
```ini
[Unit]
Description=Anzen Telegram bot
After=network.target
[Service]
WorkingDirectory=/opt/anzen/bot
EnvironmentFile=/opt/anzen/bot/.env
ExecStart=/usr/bin/node /opt/anzen/bot/anzen-telegram-bot.js
Restart=always
[Install]
WantedBy=multi-user.target
```

**cron** (every minute, instead of a long-running process)
```cron
* * * * * cd /opt/anzen/bot && /usr/bin/node anzen-telegram-bot.js --once >> bot.log 2>&1
```

---

## Configuration (env vars)
| Variable | Default | Meaning |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | *(from app settings)* | Bot token from @BotFather |
| `ANZEN_DATA_FILE` | `./anzen-data.json` | Path to the exported backup JSON |
| `ANZEN_SENT_FILE` | `./sent.json` | Where “already sent” keys are stored |
| `CHECK_INTERVAL_SEC` | `60` | How often to check |
| `REMINDER_OFFSETS_MIN` | `1440:lesson24,60:lesson1` | `minutesBefore:templateKey`, comma-separated |
| `LANG_PREF` | `km` | Template language (`km` / `en`) |
| `DRY_RUN` | – | `1` = log instead of send |
| `INGEST_PORT` | `0` | If set, opens `POST /ingest` to refresh the data file |

## Optional: push data instead of copying
Run with `INGEST_PORT=8090` and POST the backup JSON:
```bash
curl -X POST --data-binary @anzen-backup.json http://localhost:8090/ingest
```
Visit `http://localhost:8090/` to see live status (student & lesson counts).

---

## How reminders are chosen
For every lesson that is **scheduled** (not done/cancelled), has a **student**
with a **Telegram Chat ID**, and a valid `date` + hour:

* the bot computes `lessonTime − offset` for each configured offset;
* when the current time first passes that moment, it sends the matching
  template (`lesson24` for 24 h, `lesson1` for 1 h), filling
  `{student.name} {lesson.date} {lesson.time} {instructor.name} {school.name}`;
* each `(lesson, offset)` is recorded in `sent.json` so it is sent **once**.

Lesson times use the **server's timezone** — run the bot in your local TZ
(or set `TZ=Asia/Phnom_Penh`).
