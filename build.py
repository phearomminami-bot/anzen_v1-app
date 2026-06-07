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
        capture_output=True, text=True, cwd=ROOT
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

# Order matches the original head's <script> tags — dependencies first.
JSX_ORDER = [
    "tweaks-panel.jsx",
    "ios-frame.jsx",
    "ui.jsx",
    "data.jsx",
    "widgets.jsx",      # Modal/Drawer/Toast/Dropdown + AppActions context
    "forms.jsx",        # drawer forms (depends on data + widgets)
    "details.jsx",      # detail views (depends on data + widgets + ui)
    "nav.jsx",
    "screens-core.jsx",
    "screens-people.jsx",
    "screens-ops.jsx",
    "screens-lessons.jsx",
    "screens-admin-lessons.jsx",
    "screens-staff.jsx",
    "screens-fleet.jsx",
    "screens-students.jsx",
    "screens-invoice.jsx",
    "screens-public.jsx",
    "screens-bookings.jsx",
    "screens-mobile.jsx",
    "screens-settings.jsx",
    "screens-downloads.jsx",
    "screens-finance.jsx",
    "screens-announce.jsx",
    "supabase-client.jsx",   # Supabase auth/client helpers (window.sb, __sbSignIn…)
    "supabase-data.jsx",     # Supabase load/save of all app data (Phase 2)
    "app.jsx",
]

HEAD = """<!doctype html>
<html lang="km">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Anzen</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Moul&family=Battambang:wght@400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
  :root{
    --bg: #FAFAF7;
    --surface: #FFFFFF;
    --surface-muted: #F4F2EC;
    --border: #E6E3DC;
    --border-strong: #C9C5BB;
    --ink: #1A1A19;
    --ink-2: #4A4A47;
    --ink-3: #8A8881;
    --accent: #1B3A6B;
    --accent-soft: #E4EAF4;
    --gold: #F2B705;
    --gold-soft: #FCEFC2;
    --warn: #C66A2E;
    --good: #3B7A57;
    --danger: #B0413E;
    /* Two Khmer typefaces only — Khmer OS (body) + Khmer OS Muol (titles).
       local() uses the installed fonts; Google Moul / Battambang are the web fallbacks. */
    --font-en: 'Inter', system-ui, sans-serif;
    --font-km: 'Khmer OS', 'Battambang', sans-serif;
    --font-title: 'Khmer OS Muol', 'Moul', serif;
    --font-display: 'Inter', 'Khmer OS Muol', 'Moul', system-ui, sans-serif;
    --radius: 10px;
    --radius-sm: 6px;
  }
  [data-theme="dark"]{
    --bg: #0F1117;
    --surface: #181B24;
    --surface-muted: #1E2230;
    --border: #272C3C;
    --border-strong: #353C52;
    --ink: #E4E8F2;
    --ink-2: #8A96B4;
    --ink-3: #4E587A;
    --accent: #5E8AD0;
    --accent-soft: #1F2B45;
    --gold: #F2B705;
    --gold-soft: #3A3208;
    --warn: #E07840;
    --good: #4A9A6A;
    --danger: #D45A56;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--ink);
    font-family:var(--font-en),var(--font-km);
    font-size:var(--font-size-base,14px);line-height:1.45;
    -webkit-font-smoothing:antialiased}
  :lang(km),.km{font-family:var(--font-km)}
  button{font:inherit;color:inherit}
  ::selection{background:var(--accent-soft)}

  /* Khmer text in form controls needs larger size to be legible */
  select,
  select option {
    font-family: var(--font-km), sans-serif;
    font-size: 16px;
    line-height: 1.6;
  }
  input, textarea {
    font-family: var(--font-km), var(--font-en), sans-serif;
    font-size: 16px;
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
</style>
</head>
<body>

<div id="root">
  <div id="_boot" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:14px;font-family:system-ui,sans-serif">
    <style>@keyframes _sp{to{transform:rotate(360deg)}}</style>
    <div style="width:34px;height:34px;border-radius:50%;border:3px solid #E6E3DC;border-top-color:#1B3A6B;animation:_sp .8s linear infinite"></div>
    <div style="color:#8A8881;font-size:13px;letter-spacing:.02em">Loading…</div>
  </div>
</div>

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
    "accent": "#1B3A6B",
    "palette": [
      "#1B3A6B",
      "#F2B705",
      "#FAFAF7"
    ],
    "font": "inter",
    "nav": "sidebar",
    "calendar": "week",
    "role": "admin",
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
    url:     'https://lnpaxsaxweshxoicvhec.supabase.co',          // Project URL  (Settings → API)
    anonKey: 'sb_publishable_cC-v6zgUQ5q3P82bq3RPeQ_aCx5jRb3'     // anon/publishable key (public by design — NOT service_role)
  };
</script>
"""

TAIL = """
</body>
</html>
"""

def main():
    jsx_files = [PROJ / name for name in JSX_ORDER]

    # Extract all tr() pairs before compiling
    registry = extract_tr_registry(jsx_files)
    registry_js = f'\n<script>\nwindow.__trRegistry = {json.dumps(registry, ensure_ascii=False, indent=2)};\n</script>\n'

    parts = [HEAD, registry_js]
    total = len(JSX_ORDER)
    for i, name in enumerate(JSX_ORDER, 1):
        jsx_path = PROJ / name
        print(f"  [{i:02d}/{total}] compiling {name}…", end="\r")
        js = compile_jsx(jsx_path)
        parts.append(f'\n<script>\n{js}\n</script>\n')
    print()
    parts.append(TAIL)
    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"Wrote {OUT} · {OUT.stat().st_size:,} bytes · {len(registry)} tr() pairs bundled")

if __name__ == "__main__":
    main()
