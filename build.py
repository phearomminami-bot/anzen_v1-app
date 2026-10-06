#!/usr/bin/env python3
"""Bundle all .jsx files in project/ into a single self-contained Anzen.html."""
import pathlib, subprocess, sys, re, json

ROOT = pathlib.Path(__file__).parent
PROJ = ROOT / "project"
OUT  = ROOT / "Anzen.html"
COMPILER = ROOT / "compile_jsx.cjs"

def compile_jsx(jsx_path: pathlib.Path) -> str:
    """Pre-compile a JSX file to plain JavaScript at build time."""
    result = subprocess.run(
        ["node", str(COMPILER), str(jsx_path)],
        capture_output=True, text=True, encoding='utf-8', cwd=ROOT
    )
    if result.returncode != 0:
        print(f"ERROR compiling {jsx_path.name}:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout

def extract_tr_registry(jsx_files: list) -> dict:
    """Extract all tr('km','en') pairs from source files."""
    registry = {}
    # Matches tr('km', 'en') or tr("km", "en") — single or double quotes
    pattern = re.compile(r"tr\(\s*['\"](.+?)['\"]\s*,\s*['\"](.+?)['\"]\s*[,)]", re.DOTALL)
    for jsx_path in jsx_files:
        try:
            content = jsx_path.read_text(encoding='utf-8')
        except Exception:
            continue
        for km, en in pattern.findall(content):
            if '${' in km or '${' in en:
                continue
            km = km.replace('\\n', ' ').strip()
            en = en.replace('\\n', ' ').strip()
            if en and km:
                registry[en] = km
    return registry

# Maps each source file to a human-readable screen group (km · en) for the
# grouped translation export, plus the order groups should appear in.
FILE_GROUPS = {
    "screens-core.jsx":         "ផ្ទាំងគ្រប់គ្រង · Dashboard",
    "screens-students.jsx":     "សិស្ស · Students",
    "screens-people.jsx":       "សិស្ស & គ្រូ · Students & Instructors",
    "screens-ops.jsx":          "កាលវិភាគ · Schedule",
    "screens-lessons.jsx":      "មេរៀន · Lessons",
    "screens-admin-lessons.jsx":"កែ​មេរៀន · Lesson editor",
    "screens-fleet.jsx":        "យានយន្ត · Vehicles",
    "screens-staff.jsx":        "បុគ្គលិក · Staff",
    "screens-invoice.jsx":      "វិក្កយបត្រ · Billing",
    "screens-finance.jsx":      "ហិរញ្ញវត្ថុ · Finance",
    "screens-analytics.jsx":    "ការវិភាគ · Analytics",
    "screens-scores.jsx":       "តារាងពិន្ទុ · Scores",
    "screens-stock.jsx":        "ស្តុក · Stock",
    "screens-announce.jsx":     "ការ​ជូន​ដំណឹង · Announcements",
    "screens-bookings.jsx":     "ការ​កក់ · Booking",
    "screens-public.jsx":       "ទំព័រ​សាធារណៈ · Public site",
    "screens-settings.jsx":     "ការ​កំណត់ · Settings",
    "forms.jsx":                "ទម្រង់​បញ្ចូល · Forms",
    "details.jsx":              "ព័ត៌មាន​លម្អិត · Details",
    "nav.jsx":                  "ការ​រុករក · Navigation",
    "widgets.jsx":              "ធាតុ​ផ្សំ · Widgets",
    "ui.jsx":                   "រូបរាង​ទូទៅ · UI",
    "data.jsx":                 "ទិន្នន័យ · Data",
    "app.jsx":                  "ទូទៅ · General",
}
GROUP_DEFAULT = "ផ្សេងៗ · Other"
# Order the groups appear in the exported file (screen groups first).
GROUP_ORDER = [
    "ផ្ទាំងគ្រប់គ្រង · Dashboard",
    "សិស្ស · Students",
    "សិស្ស & គ្រូ · Students & Instructors",
    "កាលវិភាគ · Schedule",
    "មេរៀន · Lessons",
    "កែ​មេរៀន · Lesson editor",
    "យានយន្ត · Vehicles",
    "បុគ្គលិក · Staff",
    "វិក្កយបត្រ · Billing",
    "ហិរញ្ញវត្ថុ · Finance",
    "ការ​ជូន​ដំណឹង · Announcements",
    "ការ​កក់ · Booking",
    "ទំព័រ​សាធារណៈ · Public site",
    "ការ​កំណត់ · Settings",
    "ទម្រង់​បញ្ចូល · Forms",
    "ព័ត៌មាន​លម្អិត · Details",
    "ការ​រុករក · Navigation",
    "ធាតុ​ផ្សំ · Widgets",
    "រូបរាង​ទូទៅ · UI",
    "ទិន្នន័យ · Data",
    "ទូទៅ · General",
    GROUP_DEFAULT,
]

def extract_tr_groups(jsx_files):
    """Group every tr('km','en') pair by the screen it lives in (first match wins)."""
    pattern = re.compile(r"tr\(\s*['\"](.+?)['\"]\s*,\s*['\"](.+?)['\"]\s*[,)]", re.DOTALL)
    raw = {}   # label -> {en: km}
    seen = set()
    for jsx_path in jsx_files:
        label = FILE_GROUPS.get(jsx_path.name, GROUP_DEFAULT)
        try:
            content = jsx_path.read_text(encoding='utf-8')
        except Exception:
            continue
        for km, en in pattern.findall(content):
            if '${' in km or '${' in en:
                continue
            km = km.replace('\\n', ' ').strip()
            en = en.replace('\\n', ' ').strip()
            if not (en and km) or en in seen:
                continue
            seen.add(en)
            raw.setdefault(label, {})[en] = km
    # Re-order groups for a tidy export
    groups = {}
    for label in GROUP_ORDER:
        if raw.get(label):
            groups[label] = raw[label]
    for label, pairs in raw.items():
        if label not in groups:
            groups[label] = pairs
    return groups

# Order matches the original head's <script> tags — dependencies first.
JSX_ORDER = [
    "tweaks-panel.jsx",
    "ui.jsx",
    "data.jsx",
    "widgets.jsx",      # Modal/Drawer/Toast/Dropdown + AppActions context
    "forms.jsx",        # drawer forms (depends on data + widgets)
    "details.jsx",      # detail views (depends on data + widgets + ui)
    "nav.jsx",
    "screens-core.jsx",
    "screens-people.jsx",
    "screens-scores.jsx",   # Google-Sheets-backed scores (defines ScoreSheetForStudent)
    "screens-autoplan.jsx",  # auto schedule generator (planner + draft PDF)
    "screens-ops.jsx",
    "screens-lessons.jsx",
    "screens-admin-lessons.jsx",
    "screens-staff.jsx",
    "screens-fleet.jsx",
    "screens-students.jsx",
    "screens-invoice.jsx",
    "screens-public.jsx",
    "screens-bookings.jsx",
    "screens-settings.jsx",
    "screens-finance.jsx",
    "screens-analytics.jsx", # dedicated analytics dashboard (charts from live data)
    "screens-stock.jsx",     # inventory / stock management (books, jackets, materials)
    "screens-announce.jsx",
    "supabase-client.jsx",   # Supabase auth/client helpers (window.sb, __sbSignIn…)
    "supabase-data.jsx",     # Supabase load/save of all app data (Phase 2)
    "app.jsx",
]

HEAD = """<!doctype html>
<html lang="km">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>Anzen</title>

<!-- PWA / install-to-home-screen → runs full-screen like a native app (no browser bar) -->
<meta name="theme-color" content="#1B3A6B" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Anzen" />
<link rel="manifest" href="manifest.webmanifest" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png" />
<script>
  /* Register the service worker so the app is an installable PWA with offline
     support (Chrome/Android "Install app", iOS "Add to Home Screen"). */
  if ('serviceWorker' in navigator) {
    /* Auto-apply a new build: when an updated worker takes control, reload once
       so users always get the latest code (important for security fixes). */
    var __swReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (__swReloaded) return; __swReloaded = true; location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
        try { reg.update(); } catch (e) {}
      }).catch(function () {});
    });
  }
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Khmer:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Moul&family=Battambang:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
  /* ═══════════════════════════════════════════════════════════
     SKIN · ខៀវអណ្ដែត (B)
     ជ្រុងមូល · ស្រមោលទន់ · គ្មានស៊ុមរឹង · ពុម្ពអក្សរទំនើប
     ═══════════════════════════════════════════════════════════ */
  :root{
    --bg: #F1F4F9;
    --surface: #FFFFFF;
    --surface-muted: #F5F7FB;
    --surface-2: #F5F7FB;
    --surface-3: #E9EDF4;
    --border: #E6EAF1;
    --border-strong: #CFD6E2;
    --ink: #101828;
    --ink-2: #475467;
    --ink-3: #667085;
    --accent: #1D4E8F;
    --accent-2: #2D66B4;
    --accent-ink: #FFFFFF;
    --accent-soft: #EAF1FF;
    --gold: #B5892A;
    --gold-soft: #FDF4E1;
    --good: #12804A;
    --good-soft: #E7F7EE;
    --ok: #12804A;
    --warn: #B25E09;
    --warn-soft: #FEF3E2;
    --danger: #C4320A;
    --danger-soft: #FDECE7;
    --nav-bg: #163766;
    --nav-ink: #C9D5E8;
    --nav-ink-2: #92A7C7;
    --nav-active-bg: rgba(255,255,255,.16);
    --nav-active-ink: #FFFFFF;
    --nav-rule: rgba(255,255,255,.12);
    --shadow: 0 1px 2px rgba(16,24,40,.05);
    --shadow-lg: 0 12px 28px -12px rgba(16,24,40,.18);
    /* Kantumruy Pro — ពុម្ពខ្មែរទំនើប។ Noto Sans Khmer ជា fallback;
       Khmer OS ចុងក្រោយ ព្រោះវាបង្ហាញជាអក្សរទ្រេតនៅម៉ាស៊ីនខ្លះ។ */
    --font-en: 'Inter', system-ui, 'Segoe UI', Arial, sans-serif;
    --font-km: 'Kantumruy Pro', 'Noto Sans Khmer', 'Battambang', 'Khmer OS', system-ui, sans-serif;
    --font-title: 'Kantumruy Pro', 'Noto Sans Khmer', system-ui, sans-serif;
    --font-display: 'Inter', 'Kantumruy Pro', system-ui, sans-serif;
    --radius: 14px;
    --radius-sm: 10px;
    --radius-lg: 20px;
    --radius-pill: 999px;
  }
  [data-theme="dark"]{
    --bg: #0E1420;
    --surface: #151C2B;
    --surface-muted: #1C2536;
    --surface-2: #1C2536;
    --surface-3: #243047;
    --border: #222D42;
    --border-strong: #33415C;
    --ink: #EAF0FA;
    --ink-2: #A9B6CC;
    --ink-3: #7D8CA6;
    --accent: #6FA6FF;
    --accent-2: #8CBAFF;
    --accent-ink: #081120;
    --accent-soft: #16273F;
    --gold: #E0B450;
    --gold-soft: #2E2611;
    --good: #3FCB86;
    --good-soft: #10291F;
    --ok: #3FCB86;
    --warn: #E9A24B;
    --warn-soft: #2E2315;
    --danger: #FF7A66;
    --danger-soft: #2E1815;
    --nav-bg: #101A2C;
    --nav-ink: #A9B6CC;
    --nav-ink-2: #6F7F99;
    --nav-active-bg: rgba(111,166,255,.18);
    --nav-active-ink: #FFFFFF;
    --nav-rule: rgba(255,255,255,.08);
    --shadow: 0 1px 2px rgba(0,0,0,.5);
    --shadow-lg: 0 14px 30px -14px rgba(0,0,0,.75);
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--ink);
    font-family:var(--font-en),var(--font-km);
    font-size:var(--font-size-base,15px);line-height:1.5;
    font-style:normal;font-synthesis:none;
    -webkit-font-smoothing:antialiased}
  /* Khmer (Battambang) reads thin at small sizes — default to a medium weight
     so body text is heavier/easier to read. Inline fontWeight still overrides. */
  :lang(km),.km{font-family:var(--font-km);font-weight:500}
  button{font:inherit;color:inherit}
  ::selection{background:var(--accent-soft)}

  /* Khmer text in form controls needs larger size to be legible */
  select,
  select option {
    font-family: var(--font-km), sans-serif;
    font-size: 17px;
    line-height: 1.6;
    font-weight: 500;
  }
  input, textarea {
    font-family: var(--font-km), var(--font-en), sans-serif;
    font-size: 17px;
    font-weight: 500;
  }

  /* photo placeholder */
  .ph{
    background:
      repeating-linear-gradient(135deg,
        rgba(0,0,0,.04) 0 6px,
        rgba(0,0,0,.0) 6px 12px),
      var(--surface-muted);
    border:1px solid var(--border);
    color:var(--ink-3);
    display:flex;align-items:center;justify-content:center;
    font:500 10px/1 'JetBrains Mono', monospace;
    letter-spacing:.06em;
    text-transform:uppercase;
    border-radius: var(--radius-sm);
    overflow:hidden;
    position:relative;
  }
  .ph::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.4), transparent 40%);
    pointer-events:none;
  }

  /* ── Native mobile feel ───────────────────────────────────────────────── */
  html{ -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  html,body{ overscroll-behavior:none; }      /* no page rubber-band / pull-to-refresh */
  body{ -webkit-tap-highlight-color:transparent; -webkit-touch-callout:none;
        text-rendering:optimizeLegibility; }
  /* remove the 300ms tap delay on anything interactive */
  button,a,[role="button"],label,select,summary,
  input[type="button"],input[type="submit"],input[type="checkbox"],input[type="radio"]{
    touch-action:manipulation;
  }
  button,[role="button"]{ -webkit-user-select:none; user-select:none; }
  /* tactile press feedback on touch devices only (don't fight desktop hover) */
  @media (hover:none){
    button:active,[role="button"]:active,a:active{ opacity:.55; transition:opacity .04s ease; }
  }
  /* momentum scrolling everywhere */
  *{ -webkit-overflow-scrolling:touch; }
  /* native accent colour for form controls */
  input[type="checkbox"],input[type="radio"],input[type="range"],progress{ accent-color:var(--accent); }
  /* slim scrollbars on desktop, hidden on phones (like a native app) */
  ::-webkit-scrollbar{ width:8px;height:8px; }
  ::-webkit-scrollbar-thumb{ background:var(--border-strong);border-radius:8px; }
  ::-webkit-scrollbar-track{ background:transparent; }
  @media (max-width:1100px){ ::-webkit-scrollbar{ width:0;height:0; } }
  /* wheel/drum time picker: hide its scrollbar entirely */
  .wheel-col{ -ms-overflow-style:none; scrollbar-width:none; }
  .wheel-col::-webkit-scrollbar{ width:0;height:0;display:none; }
  @media (prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important;} }

  /* ── របារចំហៀង និងរបារខាងក្រោម ជាពណ៌ខៀវ ──────────────────────
     មិនកែ inline style រាប់ពាន់កន្លែង — គ្រាន់តែកំណត់តម្លៃ variable
     ឡើងវិញក្នុង subtree នេះ នោះអ្វីៗដែលប្រើ var(--…) ប្ដូរតាម។ */
  .anz-side,
  .anz-navbar{
    --bg:             var(--nav-bg);
    --surface:        var(--nav-bg);
    --surface-muted:  var(--nav-active-bg);
    --surface-2:      var(--nav-active-bg);
    --border:         var(--nav-rule);
    --border-strong:  var(--nav-rule);
    --ink:            var(--nav-active-ink);
    --ink-2:          var(--nav-ink);
    --ink-3:          var(--nav-ink-2);
    --accent:         var(--nav-active-ink);
    --accent-soft:    var(--nav-active-bg);
    background: var(--nav-bg);
    color: var(--nav-ink);
  }
  .anz-navbar{ --ink-3: var(--nav-ink); }

  /* ── ជួរ tab ដែលវែងជាងអេក្រង់ (Tablet បញ្ឈរ) ─────────────────
     ឱ្យវារំកិលក្នុងខ្លួនឯង ជំនួសការហូរហួសទំព័រ។ */
  .anz-tabrow{ overflow-x:auto; overflow-y:hidden; scrollbar-width:none; }
  .anz-tabrow::-webkit-scrollbar{ display:none; }
  .anz-tabrow > *{ flex-shrink:0; white-space:nowrap; }

  /* ── ឧបករណ៍ប៉ះ — គោលដៅធំល្មមម្រាមដៃ ─────────────────────────── */
  @media (pointer: coarse){
    .anz-side nav button{ min-height:44px; }
    .anz-navbar > button, .anz-navbar > a{ min-height:56px; }
  }

  /* ── ស្បែក B · ខៀវអណ្ដែត ─────────────────────────────────────
     ជ្រុងមូល ស្រមោលទន់សាយ គ្មានគែមរឹង និងចលនាពេលប៉ះ។ */
  body{
    background: linear-gradient(180deg, #EEF2F8 0%, #F4F6FA 100%);
    background-attachment: fixed;
  }
  [data-theme="dark"] body{
    background: linear-gradient(180deg, #0C121D 0%, #111A29 100%);
  }
  .anz-card{
    border: none !important;
    border-radius: 20px !important;
    box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 12px 28px -12px rgba(16,24,40,.16) !important;
  }
  [data-theme="dark"] .anz-card{
    box-shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 14px 30px -14px rgba(0,0,0,.7) !important;
  }
  .anz-side{
    margin: 12px 0 12px 12px;
    border-radius: 26px !important;
    border-right: none !important;
    overflow: hidden;
    background: linear-gradient(165deg, #20477F 0%, #163766 45%, #0F2A50 100%) !important;
    box-shadow: 0 1px 0 rgba(255,255,255,.12) inset,
                0 24px 48px -20px rgba(15,42,80,.55) !important;
  }
  [data-theme="dark"] .anz-side{
    background: linear-gradient(165deg, #16243C 0%, #101A2C 50%, #0A1220 100%) !important;
  }
  .anz-side nav button{ border-radius: 14px !important; }
  .anz-navbar{
    border-radius: 22px 22px 0 0 !important;
    border-top: none !important;
    background: linear-gradient(165deg, #20477F 0%, #12305A 100%) !important;
    box-shadow: 0 -10px 26px -12px rgba(15,42,80,.55) !important;
  }
  /* ── ជួរកណ្ដាលទទឹង ៩០០px ─────────────────────────────────────
     គ្រោងតែមួយប្រើគ្រប់ឧបករណ៍។ លើអេក្រង់ធំ ដាក់វាជាជួរកណ្ដាល
     ទទឹងប៉ុន Tablet ដើម្បីកុំឱ្យបន្ទាត់អក្សរវែងពេក និងកុំឱ្យ
     មុខងារក្នុងរបារខាងក្រោមឃ្លាតដល់គែមអេក្រង់។ */
  .anz-shell{
    width: 100% !important;
    max-width: 900px;
    margin: 0 auto;
    box-shadow: 0 0 60px -28px rgba(16,24,40,.30);
  }
  .anz-navbar{
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    width: min(900px, 100%);
  }

  /* ── ម៉ឺនុយពេញអេក្រង់ — តម្រឹមតាមជួរ ៩០០px ដែរ ─────────────── */
  .anz-menu{
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    width: min(900px, 100%);
  }
  /* ទូលាយល្មម (ជាពិសេសពេលផ្ដេក) — ដាក់ជាពីរជួរ ដូច្នេះមុខងារ
     ទាំង ១៧ ឃើញក្នុងអេក្រង់តែម្ដង ដោយមិនបាច់រមូរវែង។ */
  @media (min-width: 620px){
    .anz-menu nav{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px;
      align-content: start;
    }
    .anz-menu nav button{ margin-bottom: 0 !important; }
  }

  .anz-btn{ border-radius: 999px !important; }
  input, select, textarea{ border-radius: 12px; }
  .anz-btn, .anz-side nav button, .anz-navbar > button{
    transition: transform .12s ease, filter .12s ease, background .16s ease;
  }
  .anz-btn:active, .anz-side nav button:active, .anz-navbar > button:active{
    transform: scale(.97);
  }
</style>
</head>
<body>

<div id="root">
  <div id="_boot" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:14px;font-family:system-ui,sans-serif">
    <style>@keyframes _sp{to{transform:rotate(360deg)}}</style>
    <div id="_bootlogo"></div>
    <div style="width:34px;height:34px;border-radius:50%;border:3px solid #E6E3DC;border-top-color:#1B3A6B;animation:_sp .8s linear infinite"></div>
    <div style="color:#8A8881;font-size:13px;letter-spacing:.02em">Loading…</div>
  </div>
</div>
<script>
/* Show the cached real school logo while the app loads (set after first load). */
(function(){try{var b=JSON.parse(localStorage.getItem('anzen_brand')||'{}');var e=document.getElementById('_bootlogo');if(e&&b&&b.logo){e.innerHTML='<img src="'+b.logo+'" alt="" style="width:64px;height:64px;border-radius:14px;object-fit:cover;margin-bottom:4px"/>';}}catch(_){}})();
</script>

<script>
window.onerror = function(msg,src,line,col,err){
  var d=document.getElementById('root');
  if(d)d.innerHTML='<div style="padding:24px;font-family:system-ui;max-width:480px;margin:60px auto">'
    +'<div style="font-size:18px;font-weight:700;color:#B0413E;margin-bottom:10px">⚠️ App failed to load</div>'
    +'<div style="font-size:13px;color:#555;margin-bottom:10px">'+msg+'</div>'
    +'<div style="font-size:11px;color:#999;font-family:monospace;background:#f5f5f5;padding:8px;border-radius:5px">'+src+':'+line+'</div>'
    +'<div style="margin-top:14px;font-size:12px;color:#777">Try reloading the page. If this persists on mobile, try Chrome for Android.</div>'
    +'</div>';
};
</script>

<script>
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "#1D4E8F",
    "palette": [
      "#1D4E8F",
      "#B5892A",
      "#F1F4F9"
    ],
    "font": "inter",
    "nav": "sidebar",
    "calendar": "week",
    "role": "student",
    "lang": "km",
    "fontSize": "md",
    "dark": false
  }/*EDITMODE-END*/;
</script>

<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" crossorigin="anonymous"></script>

<!-- ⚙️ Supabase backend — paste your project credentials below to enable real login.
     Leave the YOUR-… placeholders to keep running in offline/demo mode. -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script>
  /* Fallback: if the primary CDN didn't deliver the library, pull it from a
     second CDN synchronously so the real (Supabase) login still works. */
  if (!(window.supabase && window.supabase.createClient)) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"><\\/script>');
  }
</script>
<script>
  window.__ANZEN_SUPABASE = {
    url:     'https://ibuvhzybdhngbwicrgzy.supabase.co',          // Project URL  (Settings → API)
    anonKey: 'sb_publishable_7bf6pG7zzEr2VtAzCionvg_vLGEtx0q'     // anon/publishable key (public by design — NOT service_role)
  };
</script>
"""

TAIL = """
</body>
</html>
"""

def main():
    jsx_files = [PROJ / name for name in JSX_ORDER]

    # Extract all tr() pairs before compiling — flat for runtime lookup, grouped
    # by screen for a tidy translation export.
    registry = extract_tr_registry(jsx_files)
    groups   = extract_tr_groups(jsx_files)
    registry_js = (
        f'\n<script>\nwindow.__trRegistry = {json.dumps(registry, ensure_ascii=False, indent=2)};\n'
        f'window.__trGroups = {json.dumps(groups, ensure_ascii=False, indent=2)};\n</script>\n'
    )

    # App version — sourced from sw.js CACHE so there is a single place to bump.
    try:
        m = re.search(r"anzen-shell-(v\d+)", (ROOT / "sw.js").read_text(encoding="utf-8"))
        app_version = m.group(1) if m else ""
    except Exception:
        app_version = ""
    version_js = f'\n<script>window.__ANZEN_VERSION={json.dumps(app_version)};</script>\n'

    parts = [HEAD, registry_js, version_js]
    total = len(JSX_ORDER)
    for i, name in enumerate(JSX_ORDER, 1):
        jsx_path = PROJ / name
        print(f"  [{i:02d}/{total}] compiling {name}…", end="\r")
        js = compile_jsx(jsx_path)
        parts.append(f'\n<script>\n{js}\n</script>\n')
    print()
    parts.append(TAIL)
    html = "".join(parts)
    OUT.write_text(html, encoding="utf-8")
    # Also write index.html so GitHub Pages serves the latest app at the repo root.
    (ROOT / "index.html").write_text(html, encoding="utf-8")
    print(f"Wrote {OUT} · {OUT.stat().st_size:,} bytes · {len(registry)} tr() pairs bundled")
    print(f"Wrote {ROOT / 'index.html'} (GitHub Pages entry)")

if __name__ == "__main__":
    main()
