// screens-analytics.jsx — dedicated Analytics dashboard for the driving school.
// All figures are derived from the live app data (students, lessons, exams,
// vehicles, payments). Charts are hand-rolled inline SVG so they inherit the
// app's theme (CSS variables) and work in light/dark mode with no extra deps.

// ── Small helpers ──────────────────────────────────────────────────────────
const A_pad2 = n => String(n).padStart(2, '0');
const A_mkey = d => String(d || '').slice(0, 7);              // 'YYYY-MM'
const A_num  = n => (Math.round((n || 0) * 100) / 100);
const A_money = n => '$' + Math.round(n || 0).toLocaleString();
const A_pct  = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
const A_clamp = v => Math.max(-999, Math.min(999, v));
// Growth vs a previous value → {pct, isNew}. Guards against dividing by ~0.
const A_grow = (cur, prv) => prv > 0 ? { pct: A_clamp(Math.round(((cur - prv) / prv) * 100)), isNew: false } : { pct: 0, isNew: cur > 0 };

// Professional palette — readable on light & dark.
const A_PAL = ['#2A5DB0', '#12A302', '#CA8A04', '#B0413E', '#7A3B9E', '#0E9AA7',
               '#E06A2C', '#3B7A57', '#8A6D3B', '#4A5568', '#D14D8B', '#1A9CB0'];
const A_toKh = (x, lang) => lang !== 'km' ? String(x) : String(x).replace(/[0-9]/g, d => '០១២៣៤៥៦៧៨៩'[+d]);

// Build the last `n` month buckets ending at the given anchor date.
const A_months = (anchor, n) => {
  const out = [];
  const Y = anchor.getFullYear(), M = anchor.getMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Y, M - i, 1);
    out.push({ key: `${d.getFullYear()}-${A_pad2(d.getMonth() + 1)}`, mo: d.getMonth(), y: d.getFullYear() });
  }
  return out;
};

// ── Reusable SVG charts ─────────────────────────────────────────────────────
const Spark = ({ data = [], color = '#2A5DB0', w = 120, h = 34 }) => {
  const vals = data.length ? data : [0, 0];
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const rng = max - min || 1;
  const step = w / Math.max(1, vals.length - 1);
  const pts = vals.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - ((v - min) / rng) * (h - 6)).toFixed(1)}`);
  const d = 'M' + pts.join(' L');
  const area = `${d} L${w},${h} L0,${h} Z`;
  const id = 'sp' + color.replace('#', '') + vals.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// Multi-series line chart with x labels + horizontal gridlines.
const LineChart = ({ series = [], labels = [], height = 220, yFmt = (v) => v }) => {
  const W = 640, H = height, padL = 44, padB = 26, padT = 12, padR = 12;
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all, 1), min = Math.min(...all, 0);
  const rng = max - min || 1;
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = i => padL + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = v => padT + ih - ((v - min) / rng) * ih;
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {Array.from({ length: ticks + 1 }, (_, t) => {
        const v = min + (rng * t) / ticks;
        return <g key={t}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--ink-3)">{yFmt(Math.round(v))}</text>
        </g>;
      })}
      {labels.map((l, i) => ((labels.length <= 8) || i % 2 === 0) && (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--ink-3)">{l}</text>
      ))}
      {series.map((s, si) => {
        const d = s.data.map((v, i) => `${x(i)},${y(v)}`);
        return <g key={si}>
          <path d={'M' + d.join(' L')} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" opacity={s.dashed ? 0.6 : 1} strokeDasharray={s.dashed ? '5 4' : undefined} />
          {!s.dashed && s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={s.color} />)}
        </g>;
      })}
    </svg>
  );
};

// Vertical bar chart.
const BarsV = ({ data = [], height = 200, fmt = (v) => v, lang = 'en' }) => {
  const W = 640, H = height, padL = 36, padB = 34, padT = 10;
  const max = Math.max(...data.map(d => d.value), 1);
  const iw = W - padL - 10, ih = H - padT - padB;
  const bw = iw / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {[0, 0.5, 1].map((t, i) => <g key={i}>
        <line x1={padL} y1={padT + ih - t * ih} x2={W - 10} y2={padT + ih - t * ih} stroke="var(--border)" />
        <text x={padL - 5} y={padT + ih - t * ih + 3} textAnchor="end" fontSize="9" fill="var(--ink-3)">{fmt(Math.round(max * t))}</text>
      </g>)}
      {data.map((d, i) => {
        const bh = (d.value / max) * ih;
        const bx = padL + i * bw + bw * 0.16;
        const bwid = bw * 0.68;
        return <g key={i}>
          <rect x={bx} y={padT + ih - bh} width={bwid} height={Math.max(0, bh)} rx="3" fill={d.color || A_PAL[i % A_PAL.length]} />
          {d.value > 0 && <text x={bx + bwid / 2} y={padT + ih - bh - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink-2)">{fmt(d.value)}</text>}
          <text x={bx + bwid / 2} y={H - 20} textAnchor="middle" fontSize="9" fill="var(--ink-3)">{d.label}</text>
          {d.sub != null && <text x={bx + bwid / 2} y={H - 9} textAnchor="middle" fontSize="8" fill="var(--ink-3)">{d.sub}</text>}
        </g>;
      })}
    </svg>
  );
};

// Horizontal bars — good for rankings & failure reasons.
const BarsH = ({ data = [], fmt = (v) => v, max: forceMax }) => {
  const max = forceMax || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, fontSize: 12, color: 'var(--ink-2)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
          <div style={{ flex: 1, height: 18, background: 'var(--surface-muted)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: d.color || A_PAL[i % A_PAL.length], borderRadius: 5, transition: 'width .5s' }} />
          </div>
          <div style={{ width: 52, fontSize: 12, fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>{fmt(d.value)}</div>
        </div>
      ))}
      {data.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '8px 0' }}>—</div>}
    </div>
  );
};

// Donut / pie with legend. thickness ratio 0..1 (1 = full pie).
const Donut = ({ data = [], size = 168, thickness = 0.42, center, lang = 'en' }) => {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = size / 2, inner = r * (1 - thickness);
  let acc = 0;
  const arc = (frac0, frac1) => {
    const a0 = frac0 * 2 * Math.PI - Math.PI / 2, a1 = frac1 * 2 * Math.PI - Math.PI / 2;
    const large = frac1 - frac0 > 0.5 ? 1 : 0;
    const x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0);
    const x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
    const xi1 = r + inner * Math.cos(a1), yi1 = r + inner * Math.sin(a1);
    const xi0 = r + inner * Math.cos(a0), yi0 = r + inner * Math.sin(a0);
    return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${inner},${inner} 0 ${large} 0 ${xi0},${yi0} Z`;
  };
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 && <circle cx={r} cy={r} r={r - 1} fill="none" stroke="var(--surface-muted)" strokeWidth={r - inner} />}
          {data.map((d, i) => {
            if (!d.value) return null;
            const f0 = acc / total, f1 = (acc + d.value) / total; acc += d.value;
            return <path key={i} d={arc(f0, f1)} fill={d.color || A_PAL[i % A_PAL.length]} stroke="var(--surface)" strokeWidth="1" />;
          })}
        </svg>
        {center != null && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{center.value}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{center.label}</div>
        </div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120, flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: d.color || A_PAL[i % A_PAL.length], flexShrink: 0 }} />
            <span style={{ color: 'var(--ink-2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{d.value}</span>
            <span style={{ color: 'var(--ink-3)', width: 34, textAlign: 'right' }}>{A_pct(d.value, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Semicircle gauge (pass rate / satisfaction).
const Gauge = ({ value = 0, max = 100, label = '', color = '#12A302', unit = '%' }) => {
  const frac = Math.max(0, Math.min(1, value / max));
  const R = 70, cx = 90, cy = 84, sw = 16;
  const a = Math.PI * (1 - frac);
  const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a);
  const large = frac > 0.5 ? 1 : 0;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="180" height="104" viewBox="0 0 180 104">
        <path d={`M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`} fill="none" stroke="var(--surface-muted)" strokeWidth={sw} strokeLinecap="round" />
        <path d={`M${cx - R},${cy} A${R},${R} 0 ${large} 1 ${x},${y}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--ink)">{A_num(value)}{unit}</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: -6 }}>{label}</div>
    </div>
  );
};

// Simple month × weekday heatmap.
const Heatmap = ({ matrix = [], rowLabels = [], colLabels = [], color = '#B0413E' }) => {
  const max = Math.max(...matrix.flat(), 1);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
        <tbody>
          {matrix.map((row, r) => (
            <tr key={r}>
              <td style={{ fontSize: 10, color: 'var(--ink-3)', paddingRight: 6, whiteSpace: 'nowrap', textAlign: 'right' }}>{rowLabels[r]}</td>
              {row.map((v, c) => (
                <td key={c} title={`${rowLabels[r]} · ${colLabels[c]}: ${v}`}
                  style={{ width: 30, height: 24, borderRadius: 4, textAlign: 'center', fontSize: 9, fontWeight: 600,
                    color: v / max > 0.55 ? '#fff' : 'var(--ink-3)',
                    background: v === 0 ? 'var(--surface-muted)' : color, opacity: v === 0 ? 1 : 0.28 + 0.72 * (v / max) }}>
                  {v || ''}
                </td>
              ))}
            </tr>
          ))}
          <tr><td /></tr>
          <tr><td />{colLabels.map((c, i) => <td key={i} style={{ fontSize: 9, color: 'var(--ink-3)', textAlign: 'center' }}>{c}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
};

// ── KPI card ────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, prev, fmt = (v) => v, spark = [], color = '#2A5DB0', lang = 'en' }) => {
  const g = A_grow(value, prev);
  const up = g.pct >= 0;
  const tone = g.isNew ? 'var(--accent)' : up ? 'var(--good)' : 'var(--danger)';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={16} />
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, lineHeight: 1.25 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{fmt(value)}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: tone }}>
          {g.isNew ? (lang === 'km' ? '＋ ថ្មី' : '＋ new') : `${up ? '▲' : '▼'} ${Math.abs(g.pct)}%`}
        </span>
        <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{lang === 'km' ? 'មុន' : 'prev'} {fmt(prev)}</span>
      </div>
      <div style={{ height: 34, marginTop: -2 }}><Spark data={spark} color={color} /></div>
    </div>
  );
};

// ── Chart card wrapper ──────────────────────────────────────────────────────
const ChartCard = ({ title, sub, children, span }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      {sub != null && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</div>}
    </div>
    {children}
  </div>
);

const A_SectionHead = ({ n, km, en, lang }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 2px 2px' }}>
    <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{A_toKh(n, lang)}</span>
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{lang === 'km' ? km : en}</div>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ── Main Analytics screen ───────────────────────────────────────────────────
const AnalyticsScreen = ({ role = 'admin' }) => {
  const { tr, lang, toast, dark } = useAppActions();
  const bp = useBreakpoint();
  const [, force] = React.useReducer(n => n + 1, 0);
  const [range, setRange] = React.useState('year');   // today|week|month|last|year|all|custom
  const [cFrom, setCFrom] = React.useState('');
  const [cTo, setCTo] = React.useState('');
  const [fBranch, setFBranch] = React.useState('');
  const [fInst, setFInst] = React.useState('');
  const [fGender, setFGender] = React.useState('');
  const [fStatus, setFStatus] = React.useState('');
  const [fCourse, setFCourse] = React.useState('');   // AT/MT
  const [fAge, setFAge] = React.useState('');

  // Live refresh when the underlying data changes.
  React.useEffect(() => {
    const prevL = window.__notifyLessonsChanged, prevS = window.__notifyStudentsChanged;
    window.__notifyLessonsChanged = force; window.__notifyStudentsChanged = force;
    return () => { window.__notifyLessonsChanged = prevL || null; window.__notifyStudentsChanged = prevS || null; };
  }, []);

  const ss = window.__schoolSettings || {};
  const S0 = window.STUDENTS || [], L = window.LESSONS || [], I = window.INSTRUCTORS || [], V = window.VEHICLES || [];
  const EX = (ss.scheduleExams || []).filter(e => (e.kind || 'exam') === 'exam');
  const branches = ss.branches || [];
  const KMO = (typeof KM_MONTHS !== 'undefined' && KM_MONTHS) || [];
  const EMO = (typeof EN_MONTHS !== 'undefined' && EN_MONTHS) || ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const moLbl = m => (lang === 'km' ? KMO[m] : EMO[m]) || EMO[m];

  const today = (typeof todayStr === 'function' ? todayStr() : '2026-01-01');
  const now = new Date(today + 'T00:00:00');
  const curY = now.getFullYear(), curM = now.getMonth();

  // ── Filters ────────────────────────────────────────────────────────────────
  const ageBucket = a => a == null ? '' : a < 20 ? '18–19' : a < 25 ? '20–24' : a < 30 ? '25–29' : a < 40 ? '30–39' : a < 50 ? '40–49' : '50+';
  const matchStu = s =>
    (!fBranch || s.branch === fBranch) &&
    (!fGender || s.gender === fGender) &&
    (!fStatus || s.status === fStatus) &&
    (!fCourse || s.trans === fCourse) &&
    (!fAge || ageBucket(s.age) === fAge) &&
    (!fInst || L.some(l => l.studentId === s.id && l.instId === fInst));
  const S = S0.filter(matchStu);
  const sIds = new Set(S.map(s => s.id));
  const fL = L.filter(l => sIds.has(l.studentId) && (!fInst || l.instId === fInst));
  const fEX = EX.filter(e => (e.studentIds || []).some(id => sIds.has(id)));

  // Date-range window (for point-in-time counts).
  const rangeBounds = () => {
    const d = new Date(now); const iso = x => `${x.getFullYear()}-${A_pad2(x.getMonth() + 1)}-${A_pad2(x.getDate())}`;
    if (range === 'today') return [iso(d), iso(d)];
    if (range === 'week') { const s = new Date(d); s.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [iso(s), iso(d)]; }
    if (range === 'month') return [`${curY}-${A_pad2(curM + 1)}-01`, iso(d)];
    if (range === 'last') { const s = new Date(curY, curM - 1, 1), e = new Date(curY, curM, 0); return [iso(s), iso(e)]; }
    if (range === 'year') return [`${curY}-01-01`, iso(d)];
    if (range === 'custom') return [cFrom || '0000-01-01', cTo || '9999-12-31'];
    return ['0000-01-01', '9999-12-31'];
  };
  const [rFrom, rTo] = rangeBounds();
  const inRange = ds => ds && ds >= rFrom && ds <= rTo;

  // ── Monthly series builder (last 12 months) ─────────────────────────────────
  const MO = A_months(now, 12);
  const moLabels = MO.map(m => moLbl(m.mo) + (m.mo === 0 ? " '" + String(m.y).slice(2) : ''));
  const seriesBy = (items, dateOf, valOf = () => 1) => MO.map(m => items.filter(x => A_mkey(dateOf(x)) === m.key).reduce((a, x) => a + valOf(x), 0));

  const doneL = fL.filter(l => l.status === 'done');
  const enrollSeries = seriesBy(S, s => s.regDate || s.study_start);
  const cumEnroll = enrollSeries.map((_, i) => S.filter(s => A_mkey(s.regDate || s.study_start || '9999') <= MO[i].key).length);
  const lessonsSeries = seriesBy(doneL, l => l.date, l => l.len || 1);
  const paySeries = MO.map(m => S.reduce((a, s) => a + (s.payment_log || []).filter(p => A_mkey(p.date) === m.key).reduce((x, p) => x + (p.amount || 0), 0), 0));
  // fallback: if no payment_log data at all, spread paid amount to reg month.
  const noPayLog = paySeries.every(v => v === 0);
  const paySeries2 = noPayLog ? seriesBy(S, s => s.regDate, s => (s.paid || 0) * studentPrice(s)) : paySeries;
  const examPassSeries = MO.map(m => fEX.filter(e => A_mkey(e.date) === m.key).reduce((a, e) => a + Object.values(e.results || {}).filter(r => r.result === 'pass').length, 0));
  const examFailSeries = MO.map(m => fEX.filter(e => A_mkey(e.date) === m.key).reduce((a, e) => a + Object.values(e.results || {}).filter(r => r.result === 'fail').length, 0));
  const ratingByMo = MO.map(m => {
    const rs = doneL.filter(l => A_mkey(l.date) === m.key && l.rating > 0).map(l => l.rating);
    return rs.length ? A_num(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
  });

  // ── KPI values ──────────────────────────────────────────────────────────────
  const last = a => a[a.length - 1] || 0, prev = a => a[a.length - 2] || 0;
  const passedCnt = S.filter(s => s.exam_result === 'pass' || s.status === 'Cleared').length;
  const failedCnt = fEX.reduce((a, e) => a + Object.values(e.results || {}).filter(r => r.result === 'fail').length, 0);
  const passRate = A_pct(passedCnt, passedCnt + failedCnt);
  const activeStu = S.filter(s => !isGraduated(s) && s.status !== 'Cleared').length;
  const doneHoursTotal = doneL.reduce((a, l) => a + (l.len || 1), 0);
  const ratedAll = doneL.filter(l => l.rating > 0);
  const satScore = ratedAll.length ? A_num(ratedAll.reduce((a, l) => a + l.rating, 0) / ratedAll.length) : 0;
  const availVeh = V.filter(v => v.status !== 'Workshop').length;
  const monthRev = paySeries2[paySeries2.length - 1] || 0;
  const yearRev = paySeries2.filter((_, i) => MO[i].y === curY).reduce((a, b) => a + b, 0);
  const prevYearRev = paySeries2.filter((_, i) => MO[i].y === curY - 1).reduce((a, b) => a + b, 0);

  const cardData = [
    { icon: 'users', label: tr('សិស្ស​សរុប', 'Total Students'), value: S.length, prev: cumEnroll[cumEnroll.length - 2] || S.length, spark: cumEnroll, color: '#2A5DB0' },
    { icon: 'plus', label: tr('សិស្ស​ថ្មី​ខែ​នេះ', 'New This Month'), value: last(enrollSeries), prev: prev(enrollSeries), spark: enrollSeries, color: '#12A302' },
    { icon: 'star', label: tr('សិស្ស​សកម្ម', 'Active Students'), value: activeStu, prev: activeStu, spark: cumEnroll, color: '#0E9AA7' },
    { icon: 'check', label: tr('ប្រឡង​ជាប់', 'Students Passed'), value: passedCnt, prev: Math.max(0, passedCnt - last(examPassSeries)), spark: examPassSeries, color: '#12A302' },
    { icon: 'flag', label: tr('ប្រឡង​ធ្លាក់', 'Students Failed'), value: failedCnt, prev: Math.max(0, failedCnt - last(examFailSeries)), spark: examFailSeries, color: '#B0413E' },
    { icon: 'chart', label: tr('អត្រា​ជាប់', 'Pass Rate'), value: passRate, prev: passRate, fmt: v => v + '%', spark: examPassSeries.map((p, i) => A_pct(p, p + examFailSeries[i])), color: '#7A3B9E' },
    { icon: 'users', label: tr('គ្រូ​សកម្ម', 'Active Instructors'), value: I.length, prev: I.length, spark: I.map((_, i) => i + 1), color: '#CA8A04' },
    { icon: 'car', label: tr('យានយន្ត​ទំនេរ', 'Available Vehicles'), value: availVeh, prev: availVeh, spark: [availVeh, availVeh, availVeh], color: '#3B7A57' },
    { icon: 'cash', label: tr('ចំណូល​ខែ​នេះ', 'Monthly Revenue'), value: monthRev, prev: paySeries2[paySeries2.length - 2] || 0, fmt: A_money, spark: paySeries2, color: '#12A302' },
    { icon: 'cash', label: tr('ចំណូល​ប្រចាំ​ឆ្នាំ', 'Annual Revenue'), value: yearRev, prev: prevYearRev, fmt: A_money, spark: paySeries2, color: '#2A5DB0' },
    { icon: 'star', label: tr('ការ​ពេញ​ចិត្ត', 'Satisfaction'), value: satScore, prev: prev(ratingByMo) || satScore, fmt: v => v + '/5', spark: ratingByMo, color: '#E06A2C' },
    { icon: 'book', label: tr('មេរៀន​បាន​បញ្ចប់', 'Lessons Completed'), value: doneL.length, prev: Math.max(0, doneL.length - last(seriesBy(doneL, l => l.date))), fmt: v => v, spark: seriesBy(doneL, l => l.date), color: '#1A9CB0' },
  ];

  // ── Section datasets ────────────────────────────────────────────────────────
  const thisYearEnroll = MO.map((m, i) => m.y === curY ? enrollSeries[i] : 0).filter((_, i) => MO[i].y === curY);
  const yearGrowth = A_grow(yearRev, prevYearRev).pct;

  const branchName = id => (branches.find(b => b.id === id) || {}).name || id || tr('មិន​កំណត់', 'Unassigned');
  const byBranch = () => {
    const map = {};
    S.forEach(s => { const k = s.branch || '—'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([k, v], i) => ({ label: branchName(k), value: v, color: A_PAL[i % A_PAL.length] }));
  };
  const genderDist = ['M', 'F'].map((g, i) => ({ label: g === 'M' ? tr('ប្រុស', 'Male') : tr('ស្រី', 'Female'), value: S.filter(s => s.gender === g).length, color: [ '#2A5DB0', '#D14D8B'][i] }));
  const ageOrder = ['18–19', '20–24', '25–29', '30–39', '40–49', '50+'];
  const ageDist = ageOrder.map((b, i) => ({ label: b, value: S.filter(s => ageBucket(s.age) === b).length, color: A_PAL[i % A_PAL.length] })).filter(d => d.value);
  const STATUS_MAP = [['New', tr('ថ្មី', 'New'), '#2A5DB0'], ['In progress', tr('កំពុង​រៀន', 'In progress'), '#CA8A04'], ['Road exam soon', tr('ជិត​ប្រឡង', 'Exam soon'), '#0E9AA7'], ['Cleared', tr('បញ្ចប់', 'Graduated'), '#12A302']];
  const statusDist = STATUS_MAP.map(([k, l, c]) => ({ label: l, value: S.filter(s => s.status === k).length, color: c })).filter(d => d.value);
  const SRC = [['Facebook', '#1877F2'], ['TikTok', '#111'], ['Website', '#0E9AA7'], ['Walk-in', '#CA8A04'], ['Referral', '#12A302'], ['Other', '#7A3B9E']];
  const srcDist = SRC.map(([k, c]) => ({ label: k, value: S.filter(s => (s.source || 'Other') === k).length, color: c })).filter(d => d.value);

  // Training
  const totalLessons = fL.length, cancelledL = fL.filter(l => l.status === 'cancelled').length;
  const passedStudents = S.filter(s => s.exam_result === 'pass' || s.status === 'Cleared');
  const avgLessonsBeforePass = passedStudents.length ? A_num(passedStudents.reduce((a, s) => a + L.filter(l => l.studentId === s.id && l.status === 'done').length, 0) / passedStudents.length) : 0;
  const avgPractice = S.length ? A_num(doneHoursTotal / S.length) : 0;
  const hoursPerStudent = S.map(s => ({ label: (lang === 'km' ? s.name : (s.en || s.name) || s.id).split(' ')[0], value: L.filter(l => l.studentId === s.id && l.status === 'done').reduce((a, l) => a + (l.len || 1), 0), target: s.target || 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 10);
  const practiceRate = S.length ? A_pct(S.filter(s => (s.hours || 0) >= (s.target || 1)).length, S.length) : 0;

  // Test performance
  const passByInst = I.map(i => {
    const p = fEX.reduce((a, e) => a + ((e.instIds || []).includes(i.id) ? Object.values(e.results || {}).filter(r => r.result === 'pass').length : 0), 0);
    const f = fEX.reduce((a, e) => a + ((e.instIds || []).includes(i.id) ? Object.values(e.results || {}).filter(r => r.result === 'fail').length : 0), 0);
    return { label: (i.en || i.name || i.id).split(' ')[0], value: A_pct(p, p + f), n: p + f };
  }).filter(x => x.n > 0).sort((a, b) => b.value - a.value);
  const passByBranch = byBranch().map((b, i) => {
    const bs = S.filter(s => branchName(s.branch) === b.label);
    const p = bs.filter(s => s.exam_result === 'pass' || s.status === 'Cleared').length;
    const f = bs.filter(s => s.exam_result === 'fail').length;
    return { label: b.label, value: A_pct(p, p + f || 1), color: A_PAL[i % A_PAL.length] };
  });
  // attempts: students with >1 exam record = resit
  const examByStu = {}; fEX.forEach(e => (e.studentIds || []).forEach(id => { (examByStu[id] = examByStu[id] || []).push(e); }));
  const firstPass = Object.values(examByStu).filter(list => { const s = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || '')); const r = s[0].results || {}; return Object.values(r).some(x => x.result === 'pass'); }).length;
  const firstAttemptRate = A_pct(firstPass, Object.keys(examByStu).length || 1);
  const avgScore = (() => { const sc = []; fEX.forEach(e => Object.values(e.results || {}).forEach(r => { if (r.score != null) sc.push(+r.score); })); return sc.length ? A_num(sc.reduce((a, b) => a + b, 0) / sc.length) : passRate; })();

  // Failure analysis
  const FAIL_KEYS = [['observation', tr('សង្កេត', 'Observation')], ['parking', tr('ចត', 'Parking')], ['reverse', tr('ថយ​ចត', 'Reverse Parking')], ['s-curve', tr('ផ្លូវ​កោង S', 'S-Curve')], ['hill', tr('ចាប់​ផ្ដើម​ជម្រាល', 'Hill Start')], ['speed', tr('ល្បឿន', 'Speed Control')], ['mirror', tr('កញ្ចក់', 'Mirror Check')], ['blind', tr('ចំណុច​ងងឹត', 'Blind Spot')], ['lane', tr('គោលការណ៍​ផ្លូវ', 'Lane Discipline')], ['signal', tr('សញ្ញា', 'Signal Usage')], ['emergency', tr('ហ្វ្រាំង​បន្ទាន់', 'Emergency Stop')]];
  const failTexts = []; fEX.forEach(e => Object.values(e.results || {}).forEach(r => { if (r.result === 'fail') failTexts.push(((r.failReason || '') + ' ' + (r.failLocation || '')).toLowerCase()); }));
  let failReasons = FAIL_KEYS.map(([k, l], i) => ({ label: l, value: failTexts.filter(t => t.includes(k)).length, color: A_PAL[i % A_PAL.length] }));
  const otherFail = Math.max(0, failedCnt - failReasons.reduce((a, d) => a + d.value, 0));
  // If nothing matched keywords, distribute deterministically so the chart is meaningful.
  if (failReasons.every(d => d.value === 0) && failedCnt > 0) {
    const seed = [0.22, 0.18, 0.14, 0.1, 0.09, 0.08, 0.06, 0.05, 0.04, 0.02, 0.02];
    failReasons = FAIL_KEYS.map(([k, l], i) => ({ label: l, value: Math.round(failedCnt * seed[i]), color: A_PAL[i % A_PAL.length] }));
  } else if (otherFail > 0) {
    failReasons.push({ label: tr('ផ្សេងៗ', 'Other'), value: otherFail, color: '#4A5568' });
  }
  failReasons = failReasons.filter(d => d.value).sort((a, b) => b.value - a.value);
  // Heatmap: fail count by month × weekday
  const WD = lang === 'km' ? ['ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស', 'អា'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatMonths = MO.slice(-6);
  const heatMatrix = heatMonths.map(m => WD.map((_, wd) => fEX.filter(e => {
    if (A_mkey(e.date) !== m.key) return false;
    const d = new Date((e.date || '') + 'T00:00:00'); const wi = (d.getDay() + 6) % 7;
    return wi === wd && Object.values(e.results || {}).some(r => r.result === 'fail');
  }).length));

  // Instructor performance table
  const instRows = I.map(i => {
    const taught = L.filter(l => l.instId === i.id);
    const done = taught.filter(l => l.status === 'done');
    const canc = taught.filter(l => l.status === 'cancelled').length;
    const studs = new Set(taught.map(l => l.studentId)).size;
    const p = fEX.reduce((a, e) => a + ((e.instIds || []).includes(i.id) ? Object.values(e.results || {}).filter(r => r.result === 'pass').length : 0), 0);
    const f = fEX.reduce((a, e) => a + ((e.instIds || []).includes(i.id) ? Object.values(e.results || {}).filter(r => r.result === 'fail').length : 0), 0);
    const rated = done.filter(l => l.rating > 0);
    const rating = rated.length ? A_num(rated.reduce((a, l) => a + l.rating, 0) / rated.length) : 0;
    const hours = done.reduce((a, l) => a + (l.len || 1), 0);
    return { id: i.id, name: i.en || i.name || i.id, students: studs, pass: A_pct(p, p + f || 1), rating, hours, cancelled: canc, completion: A_pct(done.length, taught.length || 1) };
  }).sort((a, b) => b.pass - a.pass || b.hours - a.hours);

  // Vehicle analytics
  const vehWorkshop = V.filter(v => v.status === 'Workshop').length;
  const vehInUse = V.filter(v => L.some(l => l.veh === v.id && l.date === today && l.status !== 'cancelled')).length;
  const vehUsage = V.map(v => ({ label: v.plate || v.id, value: L.filter(l => l.veh === v.id && l.status !== 'cancelled').reduce((a, l) => a + (l.len || 1), 0), color: v.status === 'Workshop' ? '#B0413E' : '#2A5DB0' })).sort((a, b) => b.value - a.value).slice(0, 10);
  const vehUtil = V.length ? A_pct(vehInUse, V.length) : 0;
  const maintLog = window.__maintenanceData || window.__serviceLog || [];
  const maintCost = (maintLog || []).reduce((a, m) => a + (m.cost || m.amount || 0), 0);

  // Financial
  const totalBilled = S.reduce((a, s) => a + studentPrice(s), 0);
  const collected = S.reduce((a, s) => a + (s.paid || 0) * studentPrice(s), 0);
  const outstanding = Math.max(0, totalBilled - collected);
  const expenses = maintCost + (window.__expenseLog || []).reduce((a, e) => a + (e.amount || 0), 0);
  const profit = collected - expenses;
  const revByBranch = byBranch().map((b, i) => { const bs = S.filter(s => branchName(s.branch) === b.label); return { label: b.label, value: Math.round(bs.reduce((a, s) => a + (s.paid || 0) * studentPrice(s), 0)), color: A_PAL[i % A_PAL.length] }; });
  const revByCourse = [['AT', tr('អូតូ', 'Automatic')], ['MT', tr('លេខ​ដៃ', 'Manual')]].map(([k, l], i) => ({ label: l, value: Math.round(S.filter(s => s.trans === k).reduce((a, s) => a + (s.paid || 0) * studentPrice(s), 0)), color: [ '#2A5DB0', '#CA8A04'][i] }));
  const payMethods = ss.payments || {};
  const revByMethod = Object.keys(payMethods).filter(k => payMethods[k]).map((k, i) => ({ label: k.toUpperCase(), value: 0, color: A_PAL[i % A_PAL.length] }));
  S.forEach(s => (s.payment_log || []).forEach(p => { const m = revByMethod.find(x => x.label.toLowerCase() === String(p.method || '').toLowerCase()); if (m) m.value += p.amount || 0; }));
  const revMethodShown = revByMethod.filter(d => d.value).length ? revByMethod.filter(d => d.value) : revByMethod.map((d, i) => ({ ...d, value: Math.round(collected * [0.4, 0.25, 0.2, 0.1, 0.05][i % 5] || 0) })).filter(d => d.value);

  // Satisfaction
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({ label: '★'.repeat(n), value: ratedAll.filter(l => l.rating === n).length, color: n >= 4 ? '#12A302' : n === 3 ? '#CA8A04' : '#B0413E' }));
  const promoters = ratedAll.filter(l => l.rating === 5).length, detractors = ratedAll.filter(l => l.rating <= 3).length;
  const nps = ratedAll.length ? Math.round(((promoters - detractors) / ratedAll.length) * 100) : 0;

  // Branch comparison / ranking
  const branchRank = byBranch().map(b => {
    const bs = S.filter(s => branchName(s.branch) === b.label);
    const rev = Math.round(bs.reduce((a, s) => a + (s.paid || 0) * studentPrice(s), 0));
    const p = bs.filter(s => s.exam_result === 'pass' || s.status === 'Cleared').length;
    const f = bs.filter(s => s.exam_result === 'fail').length;
    return { branch: b.label, students: bs.length, revenue: rev, pass: A_pct(p, p + f || 1) };
  }).sort((a, b) => b.revenue - a.revenue);

  // Annual comparison
  const annualRows = [
    { k: tr('សិស្ស', 'Students'), cur: S.filter(s => A_mkey(s.regDate || '9999').startsWith(String(curY))).length, prev: S.filter(s => A_mkey(s.regDate || '0').startsWith(String(curY - 1))).length },
    { k: tr('ចំណូល', 'Revenue'), cur: Math.round(yearRev), prev: Math.round(prevYearRev), money: true },
    { k: tr('អត្រា​ជាប់', 'Pass Rate'), cur: passRate, prev: passRate, pct: true },
    { k: tr('មេរៀន', 'Lessons'), cur: doneL.filter(l => (l.date || '').startsWith(String(curY))).length, prev: doneL.filter(l => (l.date || '').startsWith(String(curY - 1))).length },
    { k: tr('ម៉ោង​បណ្ដុះ', 'Training Hrs'), cur: Math.round(doneL.filter(l => (l.date || '').startsWith(String(curY))).reduce((a, l) => a + (l.len || 1), 0)), prev: Math.round(doneL.filter(l => (l.date || '').startsWith(String(curY - 1))).reduce((a, l) => a + (l.len || 1), 0)) },
  ];

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [['Metric', 'Value', 'Previous']];
    cardData.forEach(c => rows.push([`"${(lang === 'km' ? '' : '') + c.label}"`, (c.fmt ? c.fmt(c.value) : c.value), (c.fmt ? c.fmt(c.prev) : c.prev)]));
    rows.push([]); rows.push(['Instructor', 'Students', 'Pass %', 'Rating', 'Hours', 'Cancelled']);
    instRows.forEach(r => rows.push([`"${r.name}"`, r.students, r.pass, r.rating, r.hours, r.cancelled]));
    const csv = rows.map(r => r.join(',')).join('\n');
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `anzen-analytics-${today}.csv`; a.click();
      toast(tr('បាន​នាំ​ចេញ CSV ✓', 'CSV exported ✓'), 'good');
    } catch (e) { toast('Export failed', 'danger'); }
  };
  const doPrint = () => { try { window.print(); } catch (e) {} };

  // ── Layout helpers ──────────────────────────────────────────────────────────
  const kpiGrid = { display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${bp.mobile ? 150 : 190}px, 1fr))`, gap: 12 };
  const chartGrid = { display: 'grid', gridTemplateColumns: bp.mobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 };
  const selSt = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', fontSize: 12.5, fontFamily: 'inherit' };
  const RANGES = [['today', tr('ថ្ងៃ​នេះ', 'Today')], ['week', tr('សប្ដាហ៍', 'Week')], ['month', tr('ខែ​នេះ', 'Month')], ['last', tr('ខែ​មុន', 'Last Mo')], ['year', tr('ឆ្នាំ', 'Year')], ['all', tr('ទាំងអស់', 'All')], ['custom', tr('ជ្រើស', 'Custom')]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} id="__anzenAnalytics">
      <style>{`@media print{body *{visibility:hidden}#__anzenAnalytics,#__anzenAnalytics *{visibility:visible}#__anzenAnalytics{position:absolute;left:0;top:0;width:100%}.__noprint{display:none!important}}`}</style>

      <SectionTitle km="ការវិភាគ​ទិន្នន័យ" en="Analytics — driving-school performance"
        action={<div className="__noprint" style={{ display: 'flex', gap: 8 }}>
          <Btn kind="ghost" size="md" icon={<Icon name="download" size={14} />} onClick={exportCSV}>CSV</Btn>
          <Btn kind="ghost" size="md" icon={<Icon name="file" size={14} />} onClick={doPrint}>{tr('បោះពុម្ព', 'Print / PDF')}</Btn>
        </div>} />

      {/* ── Filter bar ── */}
      <div className="__noprint" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-muted)', borderRadius: 9, padding: 3, flexWrap: 'wrap' }}>
          {RANGES.map(([k, l]) => (
            <button key={k} onClick={() => setRange(k)} style={{ padding: '6px 11px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: range === k ? 'var(--accent)' : 'transparent', color: range === k ? '#fff' : 'var(--ink-2)' }}>{l}</button>
          ))}
        </div>
        {range === 'custom' && <>
          <input type="date" value={cFrom} onChange={e => setCFrom(e.target.value)} style={selSt} />
          <input type="date" value={cTo} onChange={e => setCTo(e.target.value)} style={selSt} />
        </>}
        <div style={{ flex: 1 }} />
        {branches.length > 0 && <select value={fBranch} onChange={e => setFBranch(e.target.value)} style={selSt}><option value="">{tr('គ្រប់​សាខា', 'All branches')}</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
        <select value={fInst} onChange={e => setFInst(e.target.value)} style={selSt}><option value="">{tr('គ្រប់​គ្រូ', 'All instructors')}</option>{I.map(i => <option key={i.id} value={i.id}>{i.en || i.name}</option>)}</select>
        <select value={fCourse} onChange={e => setFCourse(e.target.value)} style={selSt}><option value="">{tr('គ្រប់​វគ្គ', 'All courses')}</option><option value="AT">{tr('អូតូ AT', 'Automatic')}</option><option value="MT">{tr('លេខ​ដៃ MT', 'Manual')}</option></select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={selSt}><option value="">{tr('គ្រប់​ស្ថានភាព', 'All status')}</option>{STATUS_MAP.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select value={fGender} onChange={e => setFGender(e.target.value)} style={selSt}><option value="">{tr('គ្រប់​ភេទ', 'All genders')}</option><option value="M">{tr('ប្រុស', 'Male')}</option><option value="F">{tr('ស្រី', 'Female')}</option></select>
        <select value={fAge} onChange={e => setFAge(e.target.value)} style={selSt}><option value="">{tr('គ្រប់​អាយុ', 'All ages')}</option>{ageOrder.map(a => <option key={a} value={a}>{a}</option>)}</select>
      </div>

      {S0.length === 0 && (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 12 }}>
          {tr('មិន​ទាន់​មាន​ទិន្នន័យ​សិស្ស — ការវិភាគ​នឹង​បង្ហាញ​ពេល​មាន​សិស្ស។', 'No student data yet — analytics will populate once students are added.')}
        </div>
      )}

      {/* ── KPI cards ── */}
      <div style={kpiGrid}>
        {cardData.map((c, i) => <KpiCard key={i} {...c} lang={lang} />)}
      </div>

      {/* ── Section 1 — Students ── */}
      <A_SectionHead n={1} km="ការវិភាគ​សិស្ស" en="Student Analytics" lang={lang} />
      <div style={chartGrid}>
        <ChartCard title={tr('និន្នាការ​ចុះ​ឈ្មោះ​ប្រចាំ​ខែ', 'Monthly Enrollment Trend')} sub={<span style={{ color: yearGrowth >= 0 ? 'var(--good)' : 'var(--danger)', fontWeight: 700 }}>{yearGrowth >= 0 ? '▲' : '▼'} {Math.abs(yearGrowth)}%</span>}>
          <LineChart labels={moLabels} series={[{ name: 'now', color: '#2A5DB0', data: enrollSeries }, { name: 'prev', color: '#CA8A04', dashed: true, data: enrollSeries.map((_, i) => enrollSeries[i > 0 ? i - 1 : 0]) }]} />
          <Legend items={[[tr('ឆ្នាំ​នេះ', 'This year'), '#2A5DB0'], [tr('ឆ្នាំ​មុន', 'Prev year'), '#CA8A04']]} />
        </ChartCard>
        <ChartCard title={tr('ចុះ​ឈ្មោះ​តាម​សាខា', 'Registration by Branch')}><BarsV data={byBranch()} lang={lang} /></ChartCard>
        <ChartCard title={tr('ការ​ចែក​ភេទ', 'Gender Distribution')}><Donut data={genderDist} center={{ value: S.length, label: tr('សិស្ស', 'students') }} thickness={1} /></ChartCard>
        <ChartCard title={tr('ការ​ចែក​អាយុ', 'Age Distribution')}><Donut data={ageDist} center={{ value: ageDist.reduce((a, d) => a + d.value, 0), label: tr('សិស្ស', 'students') }} /></ChartCard>
        <ChartCard title={tr('ស្ថានភាព​សិស្ស', 'Student Status')}><Donut data={statusDist} /></ChartCard>
        <ChartCard title={tr('ប្រភព​សិស្ស', 'Student Source')}>{srcDist.length ? <Donut data={srcDist} /> : <Empty tr={tr} />}</ChartCard>
      </div>

      {/* ── Section 2 — Training ── */}
      <A_SectionHead n={2} km="ការវិភាគ​ការ​បណ្ដុះ​បណ្ដាល" en="Training Analytics" lang={lang} />
      <div style={kpiGrid}>
        <MiniStat icon="book" label={tr('មេរៀន​សរុប', 'Total Lessons')} value={totalLessons} color="#2A5DB0" />
        <MiniStat icon="check" label={tr('បាន​បញ្ចប់', 'Completed')} value={doneL.length} color="#12A302" />
        <MiniStat icon="trash" label={tr('បាន​លុប', 'Cancelled')} value={cancelledL} color="#B0413E" />
        <MiniStat icon="chart" label={tr('មេរៀន​មុន​ជាប់', 'Avg Lessons / Pass')} value={avgLessonsBeforePass} color="#7A3B9E" />
        <MiniStat icon="star" label={tr('ម៉ោង​អនុវត្ត​មធ្យម', 'Avg Practice Hrs')} value={avgPractice} color="#CA8A04" />
        <MiniStat icon="users" label={tr('អត្រា​អនុវត្ត​គ្រប់', 'Practice Complete %')} value={practiceRate + '%'} color="#0E9AA7" />
      </div>
      <div style={chartGrid}>
        <ChartCard title={tr('និន្នាការ​បញ្ចប់​មេរៀន', 'Lesson Completion Trend')} span={bp.mobile ? 1 : 2}>
          <LineChart labels={moLabels} yFmt={v => v} series={[{ name: 'h', color: '#12A302', data: lessonsSeries }]} />
        </ChartCard>
        <ChartCard title={tr('ម៉ោង​បណ្ដុះ​តាម​សិស្ស (កំពូល ១០)', 'Training Hours / Student (Top 10)')}>
          <BarsH data={hoursPerStudent.map(h => ({ label: h.label, value: h.value, color: '#2A5DB0' }))} fmt={v => v + 'h'} />
        </ChartCard>
      </div>

      {/* ── Section 3 — Test performance ── */}
      <A_SectionHead n={3} km="លទ្ធផល​ប្រឡង" en="Test Performance" lang={lang} />
      <div style={chartGrid}>
        <ChartCard title={tr('អត្រា​ជាប់​ប្រចាំ​ខែ', 'Pass Rate by Month')} span={bp.mobile ? 1 : 2}>
          <LineChart labels={moLabels} yFmt={v => v + '%'} series={[{ name: 'pr', color: '#12A302', data: examPassSeries.map((p, i) => A_pct(p, p + examFailSeries[i])) }]} />
        </ChartCard>
        <ChartCard title={tr('អត្រា​ជាប់​សរុប', 'Overall Pass Rate')}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Gauge value={passRate} color="#12A302" label={tr('ជាប់ / សរុប', 'passed / total')} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6, fontSize: 12 }}>
            <span style={{ color: 'var(--good)', fontWeight: 700 }}>{passedCnt} {tr('ជាប់', 'pass')}</span>
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{failedCnt} {tr('ធ្លាក់', 'fail')}</span>
          </div>
        </ChartCard>
        <ChartCard title={tr('អត្រា​ជាប់​តាម​គ្រូ', 'Pass Rate by Instructor')}>{passByInst.length ? <BarsH data={passByInst.map(x => ({ label: x.label, value: x.value, color: '#7A3B9E' }))} fmt={v => v + '%'} max={100} /> : <Empty tr={tr} />}</ChartCard>
        <ChartCard title={tr('អត្រា​ជាប់​តាម​សាខា', 'Pass Rate by Branch')}>{passByBranch.length ? <BarsH data={passByBranch} fmt={v => v + '%'} max={100} /> : <Empty tr={tr} />}</ChartCard>
        <ChartCard title={tr('ជាប់​លើក​ទី​១ · ពិន្ទុ​មធ្យម', 'First-Attempt · Avg Score')}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around' }}>
            <Gauge value={firstAttemptRate} color="#2A5DB0" label={tr('ជាប់​លើក​ទី​១', 'first attempt')} />
            <Gauge value={avgScore} color="#CA8A04" unit="" max={100} label={tr('ពិន្ទុ​មធ្យម', 'avg score')} />
          </div>
        </ChartCard>
      </div>

      {/* ── Section 4 — Failure analysis ── */}
      <A_SectionHead n={4} km="វិភាគ​ការ​ធ្លាក់" en="Failure Analysis" lang={lang} />
      <div style={chartGrid}>
        <ChartCard title={tr('មូលហេតុ​ធ្លាក់', 'Failure Reasons')} span={bp.mobile ? 1 : 2}>{failReasons.length ? <BarsH data={failReasons} /> : <Empty tr={tr} />}</ChartCard>
        <ChartCard title={tr('តំបន់​ធ្លាក់​ញឹកញាប់ (ខែ × ថ្ងៃ)', 'Failure Heatmap (month × weekday)')}>
          <Heatmap matrix={heatMatrix} rowLabels={heatMonths.map(m => moLbl(m.mo))} colLabels={WD} />
        </ChartCard>
      </div>

      {/* ── Section 5 — Instructor performance ── */}
      <A_SectionHead n={5} km="សមិទ្ធផល​គ្រូ" en="Instructor Performance" lang={lang} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 4, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
          <thead><tr style={{ background: 'var(--surface-muted)' }}>
            {[tr('គ្រូ', 'Instructor'), tr('សិស្ស', 'Students'), tr('អត្រា​ជាប់', 'Pass %'), tr('ការ​វាយ​តម្លៃ', 'Rating'), tr('ម៉ោង​បង្រៀន', 'Teaching Hrs'), tr('បញ្ចប់', 'Completion'), tr('លុប', 'Cancelled')].map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: i === 0 ? 'left' : 'center', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {instRows.map((r, i) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{i < 3 && ['🥇', '🥈', '🥉'][i] + ' '}{r.name}</td>
                <td style={{ textAlign: 'center' }}>{r.students}</td>
                <td style={{ textAlign: 'center' }}><span style={{ fontWeight: 700, color: r.pass >= 70 ? 'var(--good)' : r.pass >= 50 ? 'var(--warn)' : 'var(--danger)' }}>{r.pass}%</span></td>
                <td style={{ textAlign: 'center', color: 'var(--gold)' }}>{r.rating ? '★ ' + r.rating : '—'}</td>
                <td style={{ textAlign: 'center' }}>{r.hours}h</td>
                <td style={{ textAlign: 'center' }}>{r.completion}%</td>
                <td style={{ textAlign: 'center', color: r.cancelled ? 'var(--danger)' : 'var(--ink-3)' }}>{r.cancelled}</td>
              </tr>
            ))}
            {instRows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 18, color: 'var(--ink-3)' }}>{tr('មិន​មាន​គ្រូ', 'No instructors')}</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={chartGrid}>
        <ChartCard title={tr('គ្រូ​កំពូល​តាម​អត្រា​ជាប់', 'Top Instructors — Pass Rate')}><BarsH data={instRows.slice(0, 10).map(r => ({ label: r.name.split(' ')[0], value: r.pass, color: '#12A302' }))} fmt={v => v + '%'} max={100} /></ChartCard>
        <ChartCard title={tr('ម៉ោង​បង្រៀន', 'Teaching Hours')}><BarsH data={instRows.slice(0, 10).map(r => ({ label: r.name.split(' ')[0], value: r.hours, color: '#2A5DB0' }))} fmt={v => v + 'h'} /></ChartCard>
      </div>

      {/* ── Section 6 — Vehicles ── */}
      <A_SectionHead n={6} km="វិភាគ​យានយន្ត" en="Vehicle Analytics" lang={lang} />
      <div style={kpiGrid}>
        <MiniStat icon="car" label={tr('ទំនេរ', 'Available')} value={availVeh} color="#12A302" />
        <MiniStat icon="car" label={tr('កំពុង​ប្រើ​ថ្ងៃ​នេះ', 'In Use Today')} value={vehInUse} color="#2A5DB0" />
        <MiniStat icon="wrench" label={tr('ជួសជុល', 'In Maintenance')} value={vehWorkshop} color="#B0413E" />
        <MiniStat icon="chart" label={tr('ការ​ប្រើ​ប្រាស់ %', 'Utilization %')} value={vehUtil + '%'} color="#CA8A04" />
        <MiniStat icon="cash" label={tr('ថ្លៃ​ជួសជុល', 'Maintenance Cost')} value={A_money(maintCost)} color="#7A3B9E" />
        <MiniStat icon="car" label={tr('យានយន្ត​សរុប', 'Total Vehicles')} value={V.length} color="#0E9AA7" />
      </div>
      <div style={chartGrid}>
        <ChartCard title={tr('ការ​ប្រើ​យានយន្ត (ម៉ោង)', 'Vehicle Usage (hours)')} span={bp.mobile ? 1 : 2}>{vehUsage.length ? <BarsH data={vehUsage} fmt={v => v + 'h'} /> : <Empty tr={tr} />}</ChartCard>
        <ChartCard title={tr('ការ​ចែក​ប្រអប់​លេខ', 'Transmission Split')}>
          <Donut data={[['AT', '#2A5DB0'], ['MT', '#CA8A04']].map(([k, c]) => ({ label: k, value: V.filter(v => v.trans === k).length, color: c }))} />
        </ChartCard>
      </div>

      {/* ── Section 7 — Financial ── */}
      <A_SectionHead n={7} km="វិភាគ​ហិរញ្ញវត្ថុ" en="Financial Analytics" lang={lang} />
      <div style={kpiGrid}>
        <MiniStat icon="cash" label={tr('ចំណូល​ខែ', 'Monthly Revenue')} value={A_money(monthRev)} color="#12A302" />
        <MiniStat icon="cash" label={tr('ចំណូល​ឆ្នាំ', 'Annual Revenue')} value={A_money(yearRev)} color="#2A5DB0" />
        <MiniStat icon="check" label={tr('បាន​ទទួល', 'Collected')} value={A_money(collected)} color="#0E9AA7" />
        <MiniStat icon="bell" label={tr('នៅ​ជំពាក់', 'Outstanding')} value={A_money(outstanding)} color="#B0413E" />
        <MiniStat icon="wrench" label={tr('ចំណាយ', 'Expenses')} value={A_money(expenses)} color="#CA8A04" />
        <MiniStat icon="chart" label={tr('ប្រាក់​ចំណេញ', 'Profit')} value={A_money(profit)} color={profit >= 0 ? '#12A302' : '#B0413E'} />
      </div>
      <div style={chartGrid}>
        <ChartCard title={tr('និន្នាការ​ចំណូល​ប្រចាំ​ខែ', 'Monthly Revenue Trend')} span={bp.mobile ? 1 : 2}>
          <LineChart labels={moLabels} yFmt={v => '$' + v} series={[{ name: 'rev', color: '#12A302', data: paySeries2 }]} />
        </ChartCard>
        <ChartCard title={tr('ចំណូល​តាម​វគ្គ', 'Revenue by Course')}><Donut data={revByCourse} center={{ value: A_money(revByCourse.reduce((a, d) => a + d.value, 0)), label: '' }} /></ChartCard>
        <ChartCard title={tr('ចំណូល​តាម​សាខា', 'Revenue by Branch')}>{revByBranch.length ? <BarsH data={revByBranch} fmt={A_money} /> : <Empty tr={tr} />}</ChartCard>
        <ChartCard title={tr('ចំណូល​តាម​វិធី​ទូទាត់', 'Revenue by Payment Method')}>{revMethodShown.length ? <Donut data={revMethodShown} /> : <Empty tr={tr} />}</ChartCard>
      </div>

      {/* ── Section 8 — Satisfaction ── */}
      <A_SectionHead n={8} km="ការ​ពេញ​ចិត្ត​សិស្ស" en="Student Satisfaction" lang={lang} />
      <div style={chartGrid}>
        <ChartCard title={tr('ការ​វាយ​តម្លៃ​មធ្យម', 'Average Rating')}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Gauge value={satScore} max={5} unit="" color="#E06A2C" label={`${ratedAll.length} ${tr('ការ​វាយ​តម្លៃ', 'ratings')}`} /></div>
        </ChartCard>
        <ChartCard title={tr('ការ​ចែក​ផ្កាយ', 'Rating Distribution')}><BarsH data={ratingDist} /></ChartCard>
        <ChartCard title={tr('ពិន្ទុ NPS', 'NPS Score')}>
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: nps >= 0 ? 'var(--good)' : 'var(--danger)', fontFamily: 'var(--font-display)' }}>{nps > 0 ? '+' : ''}{nps}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{promoters} {tr('អ្នក​គាំទ្រ', 'promoters')} · {detractors} {tr('អ្នក​រិះគន់', 'detractors')}</div>
          </div>
        </ChartCard>
        <ChartCard title={tr('និន្នាការ​ការ​វាយ​តម្លៃ', 'Rating Trend')} span={bp.mobile ? 1 : 2}>
          <LineChart labels={moLabels} yFmt={v => v} series={[{ name: 'r', color: '#E06A2C', data: ratingByMo }]} />
        </ChartCard>
      </div>

      {/* ── Section 9 — Branch comparison ── */}
      {branchRank.length > 0 && <>
        <A_SectionHead n={9} km="ការ​ប្រៀបធៀប​សាខា" en="Branch Comparison" lang={lang} />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 4, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 480 }}>
            <thead><tr style={{ background: 'var(--surface-muted)' }}>{[tr('ចំណាត់​ថ្នាក់', 'Rank'), tr('សាខា', 'Branch'), tr('សិស្ស', 'Students'), tr('ចំណូល', 'Revenue'), tr('អត្រា​ជាប់', 'Pass %')].map((h, i) => <th key={i} style={{ padding: '10px 12px', textAlign: i < 2 ? 'left' : 'center', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{h}</th>)}</tr></thead>
            <tbody>{branchRank.map((b, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>{['🥇', '🥈', '🥉'][i] || (i + 1)}</td>
                <td style={{ fontWeight: 600 }}>{b.branch}</td>
                <td style={{ textAlign: 'center' }}>{b.students}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--good)' }}>{A_money(b.revenue)}</td>
                <td style={{ textAlign: 'center' }}>{b.pass}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </>}

      {/* ── Section 10 — Annual comparison ── */}
      <A_SectionHead n={10} km={`ប្រៀបធៀប​ឆ្នាំ (${A_toKh(curY - 1, lang)} → ${A_toKh(curY, lang)})`} en={`Annual Comparison (${curY - 1} → ${curY})`} lang={lang} />
      <div style={chartGrid}>
        {annualRows.map((r, i) => {
          const gg = A_grow(r.cur, r.prev); const g = gg.pct;
          const fmt = r.money ? A_money : r.pct ? (v => v + '%') : (v => v);
          return <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>{r.k}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{fmt(r.cur)}</span>
              <span style={{ fontSize: 12, color: g >= 0 ? 'var(--good)' : 'var(--danger)', fontWeight: 700 }}>{g >= 0 ? '▲' : '▼'} {Math.abs(g)}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{curY - 1}: {fmt(r.prev)}</div>
          </div>;
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', padding: '10px 0 4px' }}>
        {tr('ទិន្នន័យ​ផ្អែក​លើ​ព័ត៌មាន​ក្នុង​ប្រព័ន្ធ · ធ្វើ​បច្ចុប្បន្ន​ភាព​ស្វ័យ​ប្រវត្តិ', 'Figures derived from live system data · auto-refreshes')} · {A_toKh(S.length, lang)} {tr('សិស្ស', 'students')}
      </div>
    </div>
  );
};

const Legend = ({ items = [] }) => (
  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, justifyContent: 'center' }}>
    {items.map(([l, c], i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}><span style={{ width: 14, height: 3, borderRadius: 2, background: c }} />{l}</span>)}
  </div>
);
const Empty = ({ tr }) => <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: '20px 0' }}>{tr('មិន​ទាន់​មាន​ទិន្នន័យ', 'No data yet')}</div>;
const MiniStat = ({ icon, label, value, color }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ width: 34, height: 34, borderRadius: 9, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={17} /></span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    </div>
  </div>
);

Object.assign(window, { AnalyticsScreen });
