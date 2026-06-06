# Anzen — Driving School Management App

## Build
```bash
cd /home/claude/repo && python3 build.py
# Output: Anzen.html (~1.5 MB single-file)
```
`build.py` compiles all 24 JSX files in `project/` via `compile_jsx.cjs` (Babel),
injects `window.__trRegistry` (808+ KM/EN pairs) at the top, and writes `Anzen.html`.

## Project structure
```
project/
  app.jsx               — Shell, router, auth, global state, SearchModal, ContentTopbar
  nav.jsx               — Sidebar (collapsible), Topbar, TabsBar, UserPill
  ui.jsx                — Card, Stat, Btn, Icon, Photo, UploadPhoto, Divider…
  data.jsx              — Global arrays: STUDENTS, INSTRUCTORS, VEHICLES, LESSONS, INVOICES, STAFF
  widgets.jsx           — Modal/Drawer/Toast/Dropdown + AppActionsContext
  forms.jsx             — NewStudentForm, NewLessonForm, NewVehicleForm, NewStaffForm…
  details.jsx           — LessonDetail, StudentProfile, InstructorProfile, VehicleDetail…
  screens-fleet.jsx     — FleetScreenV2, VehicleInspectionModal, FvInspectionLog, FvCard…
  screens-staff.jsx     — SfEditPanel, SfSchedule (Attendance), SfPolicyCard…
  screens-settings.jsx  — SettingsScreen, DataBackup (+ Translation export/import)
  screens-public.jsx    — PublicScreen, BookingPrototype (6 steps)
  screens-bookings.jsx  — BkAvailability (real LESSONS grid)
  screens-core.jsx      — Dashboard, KPICard
  screens-*.jsx         — other screens
```

## Key globals
| Variable | Description |
|---|---|
| `window.__schoolSettings` | School config: name, logo, pricing, payments, addons, rolePermissions |
| `window.__staffPolicy` | `{ annual:18, sick:12, notice:2 }` |
| `window.__attendanceData` | `{ "YYYY-MM-DD": { "EMP-001": "P"\|"A"\|"L"\|"H" } }` |
| `window.__vehicleInspections` | `[{ vehicleId, date, inspector, items, fuelLevel, customItems, renames, notes, overallStatus }]` |
| `window.__trRegistry` | All `tr(km,en)` pairs — pre-populated at build time |
| `window.__trOverrides` | User-corrected translations (applied at runtime) |
| `window.__notifyTrChanged()` | Trigger re-render after import translation overrides |
| `window.__openSearch()` | Open the global search modal (also ⌘K) |
| `window.saveAllData()` | Persist all data to localStorage (`anzen_v1`) |
| `window.NOTIFICATIONS` | Global notification array |
| `attGet(date, empId)` / `attSet(date, empId, val)` | Attendance helpers |
| `todayStr()` / `localDateStr(d)` | Date helpers (defined in data.jsx) |

## Core patterns

### Translation
```jsx
const { tr } = useAppActions();
tr('ខ្មែរ', 'English')   // returns km or en based on lang
// tr() also registers pairs into window.__trRegistry and checks window.__trOverrides
```

### Navigation / Actions
```jsx
const { navigate, openForm, openDetail, toast, confirm, setLang, lang } = useAppActions();
navigate('fleet');
openForm('newVehicle');
openDetail('vehicle', vehicleObj);
toast('Message', 'good' | 'warn' | 'danger' | 'neutral');
```

### Forcing re-render
```jsx
const [, forceUpdate] = React.useReducer(x => x + 1, 0);
// or use window.__notify*Changed() hooks
```

## Login users
```js
admin:      { km:'ឆាយ ភារម្យ', en:'Chhay Phearom', title:'នាយក · School director', avatar:'admin' }
instructor: { km:'លោក ស៊ុំ វិច្ឆេយ្យ', en:'Sum Vichea', ... }
student:    { ... }
```

## Recent changes (completed)

### Dashboard
- KPI card labels aligned using `label` prop on `KPICard` with `whiteSpace:nowrap`

### Public site (`screens-public.jsx`)
- Live school stats, real pricing from `window.__schoolSettings`
- Language toggle (`setLang`), working nav scroll, BookingPrototype 6-step flow

### Bookings (`screens-bookings.jsx`)
- `BkAvailability`: real LESSONS grid, date navigation, free slots open `newLesson` form

### Fleet / Vehicle (`screens-fleet.jsx`)
- `FvCard`: photo is view-only; clicking photo opens `VehicleInspectionModal`
- Card shows fuel bar from latest inspection (`window.__vehicleInspections`)
- **`VehicleInspectionModal`** (日常点検表 — Japanese standard):
  - Photo upload (updates `VEHICLES[i].photo`)
  - Inline rename of any inspection item (click label → edit EN + KM)
  - "Add item" button per section → custom items stored in record
  - Fuel gauge: E / ¼ / ½ / ¾ / F steps with color (red→orange→yellow→green)
  - Sections: Engine Room, Lighting, Brakes, Tires, Others
  - All labels bilingual (English + ខ្មែរ) always shown
- **`FvInspectionLog`** tab in Vehicle management:
  - Date picker + vehicle filter
  - Grid of vehicles with inspection status
  - "Download PDF" button → `generateInspectionPDF()` → new window → auto-print
  - PDF includes: school header, summary strip, per-vehicle table (○△× colored), fuel bar, notes, signature line
- Tab added: `{ id:'inspection', km:'ពិនិត្យប្រចាំថ្ងៃ', en:'Inspection', icon:'check' }`

### Staff (`screens-staff.jsx`)
- `SfEditPanel`: fixed crash (`tr` was missing from `useAppActions` destructure)
- Attendance tab renamed from "Schedule" (`{ id:'schedule', km:'វត្តមាន', en:'Attendance' }`)
- Auto-mark Present (P) for Mon–Fri past days with no record
- Default leave: 18 days (from `window.__staffPolicy.annual`)
- Policy change propagates to all staff: `newAnnual + ((s.leave ?? prevAnnual) - prevAnnual)`

### Navigation (`nav.jsx`)
- Sidebar collapse toggle button (chevron `‹ ›`) in header and collapsed mode
- State persisted in `localStorage` key `anzen_side_collapsed`
- `onToggleCollapse` prop on `Sidebar`

### Search (`app.jsx`)
- `SearchModal` component: searches STUDENTS, INSTRUCTORS, VEHICLES, INVOICES, LESSONS, STAFF
- Opens on search bar click or ⌘K / Ctrl+K
- Keyboard navigation (↑↓ Enter Esc), click navigates to tab + opens detail
- `window.__openSearch()` hook

### Language toggle
- `LangToggleBtn` component in `ContentTopbar` (next to notifications bell)
- Switches KM ↔ EN instantly

### Settings (`screens-settings.jsx`)
- Translation export: downloads `window.__trRegistry` as `anzen-translations-DATE.json`
- Translation import: uploads corrected JSON → sets `window.__trOverrides` → `window.__notifyTrChanged()` triggers re-render
- Shows active override count + Reset button

### Other
- Downloads tab removed from nav
- Admin renamed to Chhay Phearom (ឆាយ ភារម្យ)
- `NewLessonForm` vehicles: filter `status !== 'Workshop'` (shows Idle + Service due)
- `build.py` now extracts all `tr()` pairs and embeds as `window.__trRegistry` in HTML

## Vehicle inspection data structure
```js
window.__vehicleInspections = [{
  vehicleId: 'VH-001',
  date: '2026-05-30',        // YYYY-MM-DD
  inspector: 'ឆាយ ភារម្យ',
  items: {                   // itemId → 'ok' | 'warn' | 'fail'
    engine_oil: 'ok',
    coolant: 'warn',
    // ...custom item IDs too
  },
  fuelLevel: 75,             // 0 | 25 | 50 | 75 | 100
  customItems: {             // secId → [{id, en, km, isCustom}]
    engine: [{ id:'custom_engine_1234', en:'Turbo', km:'ធូប៊ូ', isCustom:true }]
  },
  renames: {                 // itemId → {en, km}
    engine_oil: { en:'Engine Oil (5W-30)', km:'ប្រេងម៉ាស៊ីន' }
  },
  notes: 'Left rear tire slightly low',
  overallStatus: 'warn',     // 'ok' | 'warn' | 'fail'
  savedAt: '2026-05-30T08:00:00.000Z',
}]
```

## Inspection sections (INSP_SECTIONS)
Engine Room · Lighting · Brakes · Tires · Others
Each item: `{ id, km:'ខ្មែរ · 日本語', en:'English' }`
Values: `INSP_VALS = { ok:{label:'○'}, warn:{label:'△'}, fail:{label:'×'} }`
Fuel steps: `FUEL_STEPS = [E=0, ¼=25, ½=50, ¾=75, F=100]`
Color: `fuelColor(pct)` — red≤20 / orange≤40 / yellow≤65 / green>65
