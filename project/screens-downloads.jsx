// screens-downloads.jsx — PDF Downloads centre

const DOWNLOAD_CATEGORIES = [
  {
    id: 'student',
    km: 'ឯកសារ​សិស្ស',
    en: 'Student Documents',
    icon: 'users',
    color: 'var(--accent)',
    colorSoft: 'var(--accent-soft)',
    docs: [
      {
        id: 'reg-form',
        km: 'ទម្រង់​ចុះ​ឈ្មោះ​សិស្ស',
        en: 'Student Registration Form',
        descKm: 'ទម្រង់​បំពេញ​ព័ត៌មាន​សម្រាប់​សិស្ស​ចូល​រៀន​ថ្មី',
        descEn: 'Blank registration form for new student enrollment',
        icon: 'file',
        pages: 1,
        generate: 'generateRegForm',
      },
      {
        id: 'certificate',
        km: 'វិញ្ញាបនបត្រ​បញ្ចប់​វគ្គ',
        en: 'Completion Certificate',
        descKm: 'វិញ្ញាបនបត្រ​ជូន​ដល់​សិស្ស​ដែល​បញ្ចប់​វគ្គ​បណ្ដុះ​បណ្ដាល',
        descEn: 'Certificate awarded upon course completion',
        icon: 'star',
        pages: 1,
        generate: 'generateCertificate',
      },
      {
        id: 'id-card',
        km: 'អត្ត​សញ្ញាណ​ប័ណ្ណ​សិស្ស',
        en: 'Student ID Card',
        descKm: 'ប័ណ្ណ​សម្គាល់​អត្ត​សញ្ញាណ​សិស្ស',
        descEn: 'Student identity card for driving school',
        icon: 'users',
        pages: 1,
        generate: 'generateIdCard',
      },
    ],
  },
  {
    id: 'financial',
    km: 'ឯកសារ​ហិរញ្ញ​វត្ថុ',
    en: 'Financial Documents',
    icon: 'cash',
    color: '#3B7A57',
    colorSoft: 'color-mix(in oklch,#3B7A57 12%,var(--surface))',
    docs: [
      {
        id: 'receipt',
        km: 'បង្កាន់​ដៃ​ទូទាត់',
        en: 'Payment Receipt',
        descKm: 'បង្កាន់​ដៃ​បញ្ជាក់​ការ​ទូទាត់​ប្រាក់',
        descEn: 'Official payment confirmation receipt',
        icon: 'cash',
        pages: 1,
        generate: 'generateReceipt',
      },
      {
        id: 'invoice',
        km: 'វិក្ក​យបត្រ',
        en: 'Invoice',
        descKm: 'វិក្ក​យបត្រ​សម្រាប់​ចេញ​ជូន​អ្នក​ក្រោម​អាណាព្យាបាល',
        descEn: 'Invoice for guardian or institutional billing',
        icon: 'cash',
        pages: 1,
        generate: 'generateInvoice',
      },
      {
        id: 'price-list',
        km: 'បញ្ជី​តម្លៃ​វគ្គ​សិក្សា',
        en: 'Course Price List',
        descKm: 'បញ្ជី​តម្លៃ​ជា​លាយ​ល័ក្ខ​អក្សរ​សម្រាប់​សិស្ស​ថ្មី',
        descEn: 'Official course price list for prospective students',
        icon: 'file',
        pages: 1,
        generate: 'generatePriceList',
      },
    ],
  },
  {
    id: 'admin',
    km: 'ឯកសារ​រដ្ឋ​បាល',
    en: 'Administrative Documents',
    icon: 'settings',
    color: '#C66A2E',
    colorSoft: 'color-mix(in oklch,#C66A2E 12%,var(--surface))',
    docs: [
      {
        id: 'attendance',
        km: 'សៀវភៅ​វត្ត​មាន',
        en: 'Attendance Sheet',
        descKm: 'ទម្រង់​ចុះ​វត្ត​មាន​សំរាប់​ថ្នាក់​មួយ',
        descEn: 'Class attendance tracking sheet',
        icon: 'check',
        pages: 1,
        generate: 'generateAttendance',
      },
      {
        id: 'schedule-pdf',
        km: 'កាល​វិភាគ​ប្រចាំ​សប្ដាហ៍',
        en: 'Weekly Schedule',
        descKm: 'ផ្ទាំង​កាល​វិភាគ​មេរៀន​ប្រចាំ​សប្ដាហ៍',
        descEn: 'Printable weekly lesson schedule',
        icon: 'cal',
        pages: 1,
        generate: 'generateSchedule',
      },
      {
        id: 'student-list',
        km: 'បញ្ជី​សិស្ស​សរុប',
        en: 'Student Roster',
        descKm: 'បញ្ជី​សិស្ស​ទាំង​អស់​ដែល​ចុះ​ឈ្មោះ',
        descEn: 'Full list of enrolled students',
        icon: 'users',
        pages: 1,
        generate: 'generateStudentList',
      },
    ],
  },
];

// ── PDF generators ─────────────────────────────────────────────────────────

const pdfWin = (title, html) => {
  let fullHtml = `<!doctype html><html><head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&family=Noto+Serif+Khmer:wght@400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter','Noto Sans Khmer',sans-serif;background:#fff;color:#111;padding:32px}
      @media print{body{padding:0}.no-print{display:none!important}@page{size:A4;margin:16mm}}
      .pdf-bar{position:fixed;top:0;left:0;right:0;padding:10px 20px;background:#1a1a19;display:flex;gap:10px;align-items:center;z-index:999}
      .pdf-bar button{padding:7px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600}
      .pdf-btn{background:#2A5DB0;color:#fff}
      .pdf-close{background:#333;color:#aaa}
      .page{padding-top:52px}
      @media print{.pdf-bar{display:none!important}.page{padding-top:0}}
    </style>
  </head><body>
    <div class="pdf-bar no-print">
      <button class="pdf-btn" onclick="window.print()">💾 រក្សា​ទុក​ជា PDF · Save as PDF</button>
      <button class="pdf-close" onclick="window.close()">✕ បិទ</button>
    </div>
    <div class="page">${html}</div>
  </body></html>`;
  const theme = window.__schoolSettings?.pdfTheme;
  if (theme) fullHtml = applyPdfTheme(fullHtml, theme);
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(fullHtml);
  w.document.close();
};

const ss = () => window.__schoolSettings || {};

// ── PDF Theme ──────────────────────────────────────────────────────────────
const DEFAULT_THEME = {
  primaryColor:     '#2A5DB0',
  bgColor:          '#ffffff',
  bodyColor:        '#111111',
  titleFontSize:    18,
  bodyFontSize:     12,
  titleAlign:       'center',
  fontFamily:       'sans',
  logo:             null,
  logoSize:         52,
  borderStyle:      'solid',
  borderWidth:      3,
  showWatermark:    true,
  watermarkOpacity: 0.04,
};

const getPdfTheme = () => ({ ...DEFAULT_THEME, ...(window.__schoolSettings?.pdfTheme || {}) });

const applyPdfTheme = (html, rawTheme) => {
  const t = { ...DEFAULT_THEME, ...rawTheme };
  const pc = t.primaryColor;

  // Replace hardcoded primary colours
  html = html.replace(/#2[Aa]5[Dd][Bb]0/g, pc);
  html = html.replace(/#2155a0/gi, pc);

  // Background colour (inline styles)
  if (t.bgColor !== '#ffffff') {
    html = html.replace(/background:#fff\b/g,   `background:${t.bgColor}`);
    html = html.replace(/background:\s*white\b/gi, `background:${t.bgColor}`);
  }

  // Logo: replace 🏫 emoji with an actual <img> when logo is set
  if (t.logo) {
    const logoImg = `<img src="${t.logo}" style="max-height:${t.logoSize}px;max-width:${t.logoSize}px;object-fit:contain;display:block;"/>`;
    html = html.replace(/🏫/g, logoImg);
  }

  // Certificate border (inline style replacement)
  const bs = t.borderStyle || 'solid';
  const bw = t.borderWidth || 3;
  if (bs === 'none') {
    html = html.replace(/border:\d+px solid [^;]+;outline:[^;]+;/g, 'border:none;outline:none;');
  } else {
    html = html.replace(/border:(\d+px) solid (#[0-9a-fA-F]{6})/g, `border:${bw}px ${bs} ${pc}`);
    html = html.replace(/outline:(\d+px) solid (#[0-9a-fA-F]{6})/g, `outline:${bw}px ${bs} ${pc}`);
  }

  // Watermark opacity
  if (!t.showWatermark) {
    html = html.replace(/opacity:\s*\.0[0-9]+/g, 'opacity:0');
  } else {
    html = html.replace(/opacity:\s*\.0[0-9]+/g, `opacity:${t.watermarkOpacity}`);
  }

  // Font family mapping
  const ff = t.fontFamily === 'serif'
    ? "'Noto Serif Khmer','Georgia',serif"
    : t.fontFamily === 'mono'
    ? "'JetBrains Mono','Courier New',monospace"
    : "'Inter','Noto Sans Khmer',sans-serif";

  // CSS override block injected before </head>
  const overrideCss = `<style>
    body{font-size:${t.bodyFontSize}px!important;color:${t.bodyColor}!important;background:${t.bgColor}!important;font-family:${ff}!important}
    h1{font-size:${t.titleFontSize}px!important;text-align:${t.titleAlign}!important}
    h2{font-size:${Math.round(t.titleFontSize*0.85)}px!important;text-align:${t.titleAlign}!important}
    .pdf-btn{background:${pc}!important}
  </style>`;
  html = html.replace('</head>', overrideCss + '</head>');

  return html;
};

// Capture PDF HTML by mocking window.open (used for live preview)
const capturePdfHtml = (genName, themeDraft) => {
  const prev = window.__schoolSettings?.pdfTheme;
  if (window.__schoolSettings) window.__schoolSettings.pdfTheme = themeDraft;
  let html = '';
  const origOpen = window.open;
  window.open = () => ({ document: { write: h => { html = h; }, close: () => {} } });
  try { GEN_FNS[genName](); } catch(e) { console.error(e); }
  window.open = origOpen;
  if (window.__schoolSettings) window.__schoolSettings.pdfTheme = prev;
  return html;
};

const generateRegForm = () => {
  const s = ss();
  const shifts = (s.studentForm?.shifts || ['ព្រឹក','ថ្ងៃ​ត្រង់','រសៀល','យប់']).join(' / ');
  const days   = (s.studentForm?.days   || ['ចន្ទ-សុក្រ','ចន្ទ-សៅរ៍']).join(' / ');
  const plans  = (s.pricing || []).map(p => p.n || p.km).join(' · ') || 'Standard / Intensive';

  pdfWin('ទម្រង់​ចុះ​ឈ្មោះ​សិស្ស', `
    <style>
      h1{font-size:18px;font-weight:700;text-align:center;margin-bottom:4px}
      .sub{text-align:center;font-size:12px;color:#555;margin-bottom:20px}
      .section{margin-bottom:18px}
      .section-title{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2A5DB0;border-bottom:2px solid #2A5DB0;padding-bottom:4px;margin-bottom:12px}
      .grid{display:grid;gap:10px}
      .grid-2{grid-template-columns:1fr 1fr}
      .grid-3{grid-template-columns:1fr 1fr 1fr}
      .field{display:flex;flex-direction:column;gap:4px}
      .label{font-size:10px;color:#666;font-weight:600}
      .line{border:none;border-bottom:1px solid #aaa;height:28px;width:100%}
      .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}
      .sig-box{border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666;text-align:center}
    </style>
    <div style="border:2px solid #2A5DB0;padding:24px;max-width:680px;margin:0 auto;">
      <h1>${s.nameKm || s.name || 'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h1>
      <div class="sub">${s.nameEn || 'ANZEN DRIVING SCHOOL'} · ${s.address || ''}</div>
      <div style="text-align:center;font-size:15px;font-weight:700;color:#2A5DB0;margin-bottom:20px;letter-spacing:.05em">ទម្រង់​ចុះ​ឈ្មោះ​សិស្ស · STUDENT REGISTRATION FORM</div>

      <div class="section">
        <div class="section-title">ព័ត៌មាន​ផ្ទាល់​ខ្លួន · Personal Information</div>
        <div class="grid grid-2">
          <div class="field"><span class="label">គោត្ត​នាម (ខ្មែរ) / Full Name (Khmer)</span><div class="line"></div></div>
          <div class="field"><span class="label">Full Name (English)</span><div class="line"></div></div>
          <div class="field"><span class="label">ភេទ / Gender</span><div class="line"></div></div>
          <div class="field"><span class="label">ថ្ងៃ​ខែ​ឆ្នាំ​កំណើត / Date of Birth</span><div class="line"></div></div>
          <div class="field"><span class="label">ជំនាន់​អត្ត​សញ្ញាណ​ប័ណ្ណ / National ID</span><div class="line"></div></div>
          <div class="field"><span class="label">លេខ​ទូរ​ស័ព្ទ / Phone Number</span><div class="line"></div></div>
        </div>
        <div class="grid" style="margin-top:10px">
          <div class="field"><span class="label">អាសយ​ដ្ឋាន / Address</span><div class="line"></div></div>
          <div class="field"><span class="label">អ៊ីម៉ែល / Email</span><div class="line"></div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">ព័ត៌មាន​ការ​ចុះ​ឈ្មោះ · Enrollment Information</div>
        <div class="grid grid-2">
          <div class="field"><span class="label">វគ្គ​សិក្សា / Course Package</span>
            <div style="font-size:11px;color:#444;border:1px solid #ddd;border-radius:4px;padding:6px 8px">${plans}</div>
          </div>
          <div class="field"><span class="label">ថ្ងៃ​ចាប់​ផ្ដើម / Start Date</span><div class="line"></div></div>
          <div class="field"><span class="label">វេន​សិក្សា / Study Shift</span>
            <div style="font-size:11px;color:#444;border:1px solid #ddd;border-radius:4px;padding:6px 8px">${shifts}</div>
          </div>
          <div class="field"><span class="label">ថ្ងៃ​សិក្សា / Study Days</span>
            <div style="font-size:11px;color:#444;border:1px solid #ddd;border-radius:4px;padding:6px 8px">${days}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">ព័ត៌មាន​អ្នក​ក្រោម​អាណាព្យាបាល · Guardian Information</div>
        <div class="grid grid-2">
          <div class="field"><span class="label">ឈ្មោះ​អ្នក​ក្រោម​អាណាព្យាបាល / Guardian Name</span><div class="line"></div></div>
          <div class="field"><span class="label">ទំនាក់​ទំនង / Relationship</span><div class="line"></div></div>
          <div class="field"><span class="label">លេខ​ទូរ​ស័ព្ទ / Phone</span><div class="line"></div></div>
          <div class="field"><span class="label">អ៊ីម៉ែល / Email</span><div class="line"></div></div>
        </div>
      </div>

      <div class="sig-row">
        <div class="sig-box">ហត្ថ​លេខា​សិស្ស / Student Signature<br><br><br></div>
        <div class="sig-box">ហត្ថ​លេខា​អ្នក​ទទួល / Staff Signature<br><br><br></div>
      </div>
      <div style="text-align:right;font-size:10px;color:#888;margin-top:8px">កាល​បរិច្ឆេទ: ……/……/……</div>
    </div>
  `);
};

const generateCertificate = () => {
  const s = ss();
  const school   = s.nameEn || s.name || 'ANZEN DRIVING SCHOOL';
  const schoolKm = s.nameKm || s.name || 'អ្នហ្សិន ដ្រាយវីង ស្គូល';
  const director = s.director || '…………………';
  const today    = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  pdfWin('វិញ្ញាបនបត្រ', `
    <style>
      @page{size:A4 landscape}
      body{background:#fff}
      .cert{width:260mm;height:178mm;border:3px solid #2155a0;outline:6px solid #2155a0;outline-offset:-10px;
        padding:16mm 18mm;position:relative;font-family:'Inter','Noto Sans Khmer',sans-serif;
        display:flex;flex-direction:column;gap:10px;box-sizing:border-box}
      .cert::before,.cert::after{content:'❖';position:absolute;font-size:22px;color:#2155a0}
      .cert::before{top:6px;left:6px}.cert::after{bottom:6px;right:6px}
      .hdr{display:flex;align-items:center;gap:16px}
      .logo{width:60px;height:60px;border-radius:50%;background:#e5ebf5;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
      .school-name{flex:1;text-align:center}
      .school-name .km{font-size:18px;font-weight:700;color:#2155a0}
      .school-name .en{font-size:13px;color:#444;margin-top:2px}
      .title{text-align:center;margin:6px 0}
      .title .km{font-size:28px;font-weight:700;color:#2155a0;letter-spacing:.05em}
      .title .en{font-size:14px;letter-spacing:.25em;color:#444;font-weight:600}
      .fields{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:12px}
      .frow{display:flex;gap:6px;align-items:baseline}
      .flabel{color:#666;min-width:80px;font-size:11px}
      .fval{flex:1;border-bottom:1px solid #bbb;padding-bottom:2px;min-width:80px}
      .body-text{font-size:12px;color:#333;text-align:center;line-height:1.7}
      .footer{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:end;margin-top:auto}
      .sig{text-align:center;font-size:11px;color:#555}
      .sig-line{border-top:1px solid #888;padding-top:4px;margin-top:28px}
      .no-cert{border:2px solid #2155a0;padding:4px 12px;font-size:11px;text-align:center;font-family:monospace}
    </style>
    <div class="cert">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:60px;opacity:.04;font-weight:700;white-space:nowrap;pointer-events:none">${school}</div>
      <div class="hdr">
        <div class="logo">🏫</div>
        <div class="school-name">
          <div class="km">${schoolKm}</div>
          <div class="en">${school}${s.address ? ' · ' + s.address : ''}</div>
        </div>
        <div class="no-cert">NO. CERT<br>……………</div>
      </div>
      <div class="title">
        <div class="km">វិញ្ញាបនបត្រ</div>
        <div class="en">C E R T I F I C A T E</div>
      </div>
      <div class="fields">
        <div class="frow"><span class="flabel">ឈ្មោះ / Name:</span><span class="fval">…………………………………</span></div>
        <div class="frow"><span class="flabel">លេខ​សម្គាល់:</span><span class="fval">…………………</span></div>
        <div class="frow"><span class="flabel">ភេទ / Sex:</span><span class="fval">…………………</span></div>
        <div class="frow"><span class="flabel">ថ្ងៃ​កំណើត:</span><span class="fval">…………………</span></div>
      </div>
      <div class="body-text">
        បាន​បញ្ចប់​វគ្គ​បណ្ដុះ​បណ្ដាល​បើក​បរ <strong>………………………………</strong>
        ចាប់​ពី​ <strong>……………………</strong> ដល់ <strong>……………………</strong> ដោយ​ជោគ​ជ័យ<br>
        <em>Has successfully completed the driving training course from … to …</em>
      </div>
      <div class="footer">
        <div class="sig"><div class="sig-line">នាយក​សាលា · Director<br>${director}</div></div>
        <div style="text-align:center;font-size:11px;color:#666">ចុះ​ថ្ងៃ​ទី ${today}</div>
        <div class="sig"><div class="sig-line">ហត្ថ​លេខា​សិស្ស · Student</div></div>
      </div>
    </div>
  `);
};

const generatePriceList = () => {
  const s = ss();
  const plans  = s.pricing || [];
  const addons = s.addons  || [];
  const pay    = s.payments || {};
  const payStr = Object.entries(pay).filter(([,v])=>v).map(([k])=>({aba:'ABA Mobile',wing:'Wing',cash:'Cash',bank:'Bank Transfer',pipay:'Pi Pay',card:'Card'}[k]||k)).join(' · ');

  pdfWin('បញ្ជី​តម្លៃ​វគ្គ​សិក្សា', `
    <style>
      h1{font-size:17px;font-weight:700;text-align:center;color:#2A5DB0}
      .sub{text-align:center;font-size:11px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#2A5DB0;color:#fff;padding:8px 12px;text-align:left;font-size:11px;letter-spacing:.06em}
      td{padding:8px 12px;border-bottom:1px solid #eee}
      tr:nth-child(even) td{background:#f7f8fc}
      .price{font-weight:700;font-size:14px;color:#2A5DB0;text-align:right}
      .sec{font-size:11px;font-weight:700;color:#C66A2E;margin:16px 0 6px;letter-spacing:.08em;text-transform:uppercase}
      .note{font-size:10px;color:#888;margin-top:16px}
    </style>
    <div style="max-width:620px;margin:0 auto">
      <div style="text-align:center;margin-bottom:6px;font-size:22px">🏫</div>
      <h1>${s.nameKm || s.name || 'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h1>
      <div class="sub">${s.nameEn || 'ANZEN DRIVING SCHOOL'} · ${s.address || ''}<br>
      ទូរ​ស័ព្ទ: ${s.phone || '…'} · ${s.email || ''}</div>

      <div style="text-align:center;font-size:14px;font-weight:700;color:#2A5DB0;border:2px solid #2A5DB0;padding:6px;margin-bottom:16px">
        បញ្ជី​តម្លៃ​វគ្គ​សិក្សា · OFFICIAL COURSE PRICE LIST
      </div>

      ${plans.length ? `
      <div class="sec">វគ្គ​សិក្សា · Course Packages</div>
      <table>
        <tr><th>វគ្គ​សិក្សា</th><th>ថ្នាក់</th><th>ម៉ោង</th><th style="text-align:right">ថ្លៃ</th></tr>
        ${plans.map(p=>`<tr>
          <td><strong>${p.n||''}</strong>${p.km?`<br><span style="color:#888;font-size:10px">${p.km}</span>`:''}</td>
          <td>Class ${p.cls||''}</td>
          <td>${p.hrs||0}h</td>
          <td class="price">$${p.price||0}</td>
        </tr>`).join('')}
      </table>` : ''}

      ${addons.length ? `
      <div class="sec">ការ​ចំណាយ​បន្ថែម · Add-ons</div>
      <table>
        <tr><th>ឈ្មោះ</th><th>Description</th><th style="text-align:right">ថ្លៃ</th></tr>
        ${addons.map(a=>`<tr>
          <td>${a.km||''}</td>
          <td style="color:#666">${a.en||''}</td>
          <td class="price">$${a.price||0}</td>
        </tr>`).join('')}
      </table>` : ''}

      <div class="note">
        ✦ VAT ${s.vat||10}% ${s.vat&&s.vat!='0'?'​រួម​បញ្ចូល​រួច​ហើយ':'មិន​រួម​បញ្ចូល'} · ទំ​រូប​ទូ​ទាត់: ${payStr||'Cash, ABA'}<br>
        ✦ ការ​ចុះ​ឈ្មោះ​សូម​ទំ​នាក់​ទំ​នង​ការ​ិយា​ល័យ · Contact office to enroll
      </div>
    </div>
  `);
};

const generateAttendance = () => {
  const s = ss();
  const rows = Array.from({length:20}, (_,i) => `
    <tr>
      <td style="text-align:center;color:#aaa">${i+1}</td>
      <td></td><td></td>
      ${Array.from({length:6},()=>'<td style="text-align:center">☐</td>').join('')}
      <td></td>
    </tr>`).join('');

  pdfWin('សៀវភៅ​វត្ត​មាន', `
    <style>
      h2{font-size:15px;font-weight:700;text-align:center;color:#2A5DB0;margin-bottom:4px}
      .sub{text-align:center;font-size:11px;color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#2A5DB0;color:#fff;padding:6px 8px;font-size:10px;letter-spacing:.06em}
      td{border:1px solid #ddd;padding:5px 8px;height:24px}
    </style>
    <div style="max-width:700px;margin:0 auto">
      <h2>${s.nameKm || 'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h2>
      <div class="sub">សៀវភៅ​វត្ត​មាន · ATTENDANCE SHEET</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:11px;margin-bottom:14px">
        <div>វគ្គ​: ……………………………</div>
        <div>គ្រូ: ……………………………</div>
        <div>ខែ / Month: ……………………</div>
      </div>
      <table>
        <tr>
          <th style="width:30px">#</th>
          <th>ឈ្មោះ​សិស្ស</th>
          <th>Student Name</th>
          <th>ថ្ងៃ​ 1</th><th>ថ្ងៃ​ 2</th><th>ថ្ងៃ​ 3</th><th>ថ្ងៃ​ 4</th><th>ថ្ងៃ​ 5</th><th>ថ្ងៃ​ 6</th>
          <th>ចំណាំ</th>
        </tr>
        ${rows}
      </table>
      <div style="display:flex;gap:24px;font-size:10px;color:#666;margin-top:8px">
        <span>☑ = វត្ត​មាន / Present</span>
        <span>☐ = អវត្ត​មាន / Absent</span>
        <span>⊘ = ច្បាប់ / Excused</span>
      </div>
    </div>
  `);
};

const generateSchedule = () => {
  const s = ss();
  const days = ['ចន្ទ Mon','អង្គារ Tue','ពុធ Wed','ព្រហ Thu','សុក្រ Fri','សៅរ៍ Sat','អាទិត្យ Sun'];
  const shifts = s.studentForm?.shifts || ['ព្រឹក','ថ្ងៃ​ត្រង់','រសៀល'];

  pdfWin('កាល​វិភាគ​ប្រចាំ​សប្ដាហ៍', `
    <style>
      h2{font-size:15px;font-weight:700;text-align:center;color:#2A5DB0;margin-bottom:4px}
      .sub{text-align:center;font-size:11px;color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#2A5DB0;color:#fff;padding:7px 10px;font-size:10px;letter-spacing:.04em;text-align:center}
      td{border:1px solid #ddd;padding:6px 8px;height:40px;vertical-align:top;font-size:10px;color:#999}
      .shift-col{background:#f7f8fc;font-weight:600;color:#333;text-align:center;font-size:10px}
    </style>
    <div style="max-width:720px;margin:0 auto">
      <h2>${s.nameKm || 'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h2>
      <div class="sub">កាល​វិភាគ​ប្រចាំ​សប្ដាហ៍ · WEEKLY SCHEDULE — ​ ……………… ដល់ ………………</div>
      <table>
        <tr><th style="width:80px">វេន</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr>
        ${shifts.map(sh=>`<tr>
          <td class="shift-col">${sh}</td>
          ${days.map(()=>'<td></td>').join('')}
        </tr>`).join('')}
      </table>
    </div>
  `);
};

const generateStudentList = () => {
  const s = ss();
  const students = (window.STUDENTS || []).slice(0, 50);

  pdfWin('បញ្ជី​សិស្ស', `
    <style>
      h2{font-size:15px;font-weight:700;text-align:center;color:#2A5DB0;margin-bottom:4px}
      .sub{text-align:center;font-size:11px;color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th{background:#2A5DB0;color:#fff;padding:6px 10px;font-size:10px;letter-spacing:.06em}
      td{border-bottom:1px solid #eee;padding:6px 10px}
      tr:nth-child(even) td{background:#f7f8fc}
    </style>
    <div style="max-width:680px;margin:0 auto">
      <h2>${s.nameKm || 'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h2>
      <div class="sub">បញ្ជី​សិស្ស​ចុះ​ឈ្មោះ · ENROLLED STUDENT ROSTER · ${new Date().toLocaleDateString('km-KH')}</div>
      <table>
        <tr><th>#</th><th>ឈ្មោះ​ / Name</th><th>លេខ​ / ID</th><th>ភេទ</th><th>ថ្ងៃ​ចាប់​ផ្ដើម</th><th>ស្ថានភាព</th></tr>
        ${students.length ? students.map((st,i)=>`<tr>
          <td style="color:#aaa">${i+1}</td>
          <td><strong>${st.name||''}</strong>${st.nameEn?`<br><span style="color:#888">${st.nameEn}</span>`:''}</td>
          <td style="font-family:monospace;font-size:10px">${st.id||''}</td>
          <td>${st.gender==='M'?'ប្រុស':st.gender==='F'?'ស្រី':'—'}</td>
          <td>${st.enrollDate||'—'}</td>
          <td>${st.status==='active'?'✅ សកម្ម':'⏸ ផ្អាក'}</td>
        </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px">មិន​ទាន់​មាន​សិស្ស</td></tr>`}
      </table>
      <div style="text-align:right;font-size:10px;color:#888;margin-top:8px">
        សរុប: ${students.length} នាក់ · Total: ${students.length} students
      </div>
    </div>
  `);
};

const generateIdCard = () => {
  const s = ss();
  pdfWin('អត្ត​សញ្ញាណ​ប័ណ្ណ​សិស្ស', `
    <style>
      @page{size:A4}
      .page{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,1fr);gap:10px;padding:12px;height:calc(297mm - 24px)}
      .card{border:1.5px solid #2A5DB0;border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;font-size:10px}
      .card-hdr{display:flex;align-items:center;gap:6px;border-bottom:1px solid #ddd;padding-bottom:6px}
      .card-logo{width:28px;height:28px;border-radius:50%;background:#e5ebf5;display:flex;align-items:center;justify-content:center;font-size:14px}
      .school-nm{font-size:8px;font-weight:700;color:#2A5DB0;line-height:1.3}
      .photo{width:50px;height:60px;border:1px solid #ddd;border-radius:4px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:8px;flex-shrink:0}
      .fields{flex:1}
      .frow{margin-bottom:4px}
      .flabel{color:#999;font-size:8px}
      .fval{border-bottom:1px solid #ccc;min-height:12px;font-size:9px}
    </style>
    <div class="page">
      ${Array.from({length:12}, (_,i) => `
        <div class="card">
          <div class="card-hdr">
            <div class="card-logo">🏫</div>
            <div class="school-nm">${s.nameKm||'អ្នហ្សិន ដ្រាយវីង ស្គូល'}<br>${s.nameEn||'ANZEN DRIVING SCHOOL'}</div>
          </div>
          <div style="display:flex;gap:8px;flex:1">
            <div class="photo">រូប​ថត</div>
            <div class="fields">
              <div class="frow"><div class="flabel">ឈ្មោះ / Name</div><div class="fval"></div></div>
              <div class="frow"><div class="flabel">ID</div><div class="fval"></div></div>
              <div class="frow"><div class="flabel">ភេទ / Sex</div><div class="fval"></div></div>
              <div class="frow"><div class="flabel">ថ្ងៃ​ចុះ​ឈ្មោះ</div><div class="fval"></div></div>
            </div>
          </div>
          <div style="text-align:center;font-size:7px;color:#aaa;border-top:1px solid #eee;padding-top:4px">STUDENT ID CARD</div>
        </div>`).join('')}
    </div>
  `);
};

const generateReceipt = () => {
  const s = ss();
  pdfWin('បង្កាន់​ដៃ​ទូទាត់', `
    <style>
      .receipt{max-width:380px;margin:0 auto;border:1px solid #ddd;padding:24px;font-size:12px}
      h2{text-align:center;font-size:16px;font-weight:700;color:#2A5DB0;margin-bottom:2px}
      .sub{text-align:center;font-size:10px;color:#666;margin-bottom:16px}
      .divider{border:none;border-top:1px dashed #ccc;margin:12px 0}
      .row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px}
      .label{color:#666}.value{font-weight:500}
      .total{display:flex;justify-content:space-between;font-size:15px;font-weight:700;color:#2A5DB0;border-top:2px solid #2A5DB0;padding-top:8px;margin-top:4px}
      .sig{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:24px;font-size:10px;color:#666;text-align:center}
      .sig-line{border-top:1px solid #aaa;padding-top:4px;margin-top:20px}
    </style>
    <div class="receipt">
      <h2>${s.nameKm||'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h2>
      <div class="sub">${s.nameEn||'ANZEN DRIVING SCHOOL'}<br>${s.address||''} · ${s.phone||''}</div>
      <div style="text-align:center;font-weight:700;font-size:13px;margin-bottom:16px;color:#2A5DB0">
        🧾 បង្កាន់​ដៃ​ទូទាត់ · PAYMENT RECEIPT
      </div>
      <div class="row"><span class="label">លេខ​បង្កាន់​ដៃ / Receipt #</span><span class="value">RCP-……………</span></div>
      <div class="row"><span class="label">កាល​បរិច្ឆេទ / Date</span><span class="value">……/……/………</span></div>
      <div class="row"><span class="label">ឈ្មោះ​សិស្ស / Student</span><span class="value">……………………………</span></div>
      <div class="row"><span class="label">លេខ​សម្គាល់ / ID</span><span class="value">………………</span></div>
      <hr class="divider"/>
      <div class="row"><span class="label">វគ្គ​សិក្សា / Course</span><span class="value">…………………………</span></div>
      <div class="row"><span class="label">ចំនួន​ទឹក​ប្រាក់ / Amount</span><span class="value">$……………</span></div>
      <div class="row"><span class="label">VAT ${s.vat||10}%</span><span class="value">$……………</span></div>
      <div class="total"><span>សរុប​ / Total</span><span>$……………</span></div>
      <div class="row" style="margin-top:10px"><span class="label">វិធី​ទូទាត់ / Method</span><span class="value">……………………</span></div>
      <div class="sig">
        <div class="sig-line">អ្នក​ទទួល​ / Received by</div>
        <div class="sig-line">ហត្ថ​លេខា​សិស្ស / Student</div>
      </div>
    </div>
  `);
};

const generateInvoice = () => {
  const s = ss();
  pdfWin('វិក្ក​យបត្រ', `
    <style>
      body{font-size:12px}
      .inv{max-width:600px;margin:0 auto}
      h2{font-size:18px;font-weight:700;color:#2A5DB0}.sub{color:#666;font-size:11px}
      .inv-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #2A5DB0}
      .to-from{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px;font-size:11px}
      .box-title{font-size:10px;font-weight:700;letter-spacing:.08em;color:#2A5DB0;text-transform:uppercase;margin-bottom:6px}
      table{width:100%;border-collapse:collapse}
      th{background:#2A5DB0;color:#fff;padding:7px 12px;font-size:10px;text-align:left}
      td{padding:8px 12px;border-bottom:1px solid #eee;font-size:11px}
      .total-row td{font-weight:700;font-size:13px;border-top:2px solid #2A5DB0;border-bottom:none}
    </style>
    <div class="inv">
      <div class="inv-hdr">
        <div>
          <h2>${s.nameKm||'អ្នហ្សិន ដ្រាយវីង ស្គូល'}</h2>
          <div class="sub">${s.nameEn||'ANZEN DRIVING SCHOOL'}<br>${s.address||''}<br>${s.phone||''} · ${s.email||''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:700;color:#2A5DB0">INVOICE</div>
          <div style="font-size:11px;color:#666">INV-………-……<br>ថ្ងៃ: ……/……/………<br>ផុត​កំណត់: ……/……/………</div>
        </div>
      </div>
      <div class="to-from">
        <div><div class="box-title">Bill To</div>
          ឈ្មោះ: ………………………………<br>
          អាសយ​ដ្ឋាន: …………………………<br>
          ទូរ​ស័ព្ទ: ………………………………<br>
        </div>
        <div><div class="box-title">Student</div>
          ឈ្មោះ: ………………………………<br>
          ID: ………………<br>
          វគ្គ: ……………………………<br>
        </div>
      </div>
      <table>
        <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr>
        <tr><td>…………………………………</td><td style="text-align:right">1</td><td style="text-align:right">$……</td><td style="text-align:right">$……</td></tr>
        <tr><td>…………………………………</td><td style="text-align:right">1</td><td style="text-align:right">$……</td><td style="text-align:right">$……</td></tr>
        <tr><td style="color:#aaa">VAT ${s.vat||10}%</td><td></td><td></td><td style="text-align:right">$……</td></tr>
        <tr class="total-row"><td>Total</td><td></td><td></td><td style="text-align:right;color:#2A5DB0">$……………</td></tr>
      </table>
      <div style="font-size:10px;color:#888;margin-top:12px">
        ទំ​រូប​ទូ​ទាត់ · Payment: ${Object.entries(s.payments||{}).filter(([,v])=>v).map(([k])=>k).join(', ') || 'Cash, ABA'}
      </div>
    </div>
  `);
};

const GEN_FNS = { generateRegForm, generateCertificate, generateIdCard, generateReceipt, generateInvoice, generatePriceList, generateAttendance, generateSchedule, generateStudentList };

// ── Uploaded-docs persistence (separate localStorage key) ──────────────────
const DOCS_KEY = 'anzen_docs_v1';
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const loadUploadedDocs = () => {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || '[]'); }
  catch { return []; }
};
const saveUploadedDocs = (docs) => {
  try { localStorage.setItem(DOCS_KEY, JSON.stringify(docs)); return true; }
  catch { return false; }
};

const FILE_TYPES = {
  pdf:  { label:'PDF',   color:'#B0413E', bg:'#fdeaea', icon:'📄' },
  docx: { label:'Word',  color:'#2A5DB0', bg:'#e5ebf5', icon:'📝' },
  doc:  { label:'Word',  color:'#2A5DB0', bg:'#e5ebf5', icon:'📝' },
  xlsx: { label:'Excel', color:'#3B7A57', bg:'#e3f1ea', icon:'📊' },
  xls:  { label:'Excel', color:'#3B7A57', bg:'#e3f1ea', icon:'📊' },
  pptx: { label:'PPT',   color:'#C66A2E', bg:'#fdf0e5', icon:'📑' },
  ppt:  { label:'PPT',   color:'#C66A2E', bg:'#fdf0e5', icon:'📑' },
};
const extOf = (name) => (name.split('.').pop() || '').toLowerCase();
const ftOf  = (name) => FILE_TYPES[extOf(name)] || { label: extOf(name).toUpperCase(), color:'var(--ink-3)', bg:'var(--surface-muted)', icon:'📎' };
const fmtSize = (b) => b < 1024 ? b+'B' : b < 1024*1024 ? (b/1024).toFixed(1)+'KB' : (b/1024/1024).toFixed(2)+'MB';
const fmtDate = (iso) => new Date(iso).toLocaleDateString('km-KH', { year:'numeric', month:'short', day:'numeric' });

const DOC_CATS = [
  { id:'student',   km:'ឯកសារ​សិស្ស',        en:'Student' },
  { id:'financial', km:'ឯកសារ​ហិរញ្ញ​វត្ថុ',   en:'Financial' },
  { id:'admin',     km:'ឯកសារ​រដ្ឋ​បាល',      en:'Administrative' },
  { id:'other',     km:'ផ្សេង​ទៀត',           en:'Other' },
];

// ── Upload zone component ──────────────────────────────────────────────────
const UploadZone = ({ onFiles }) => {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef();
  const accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    onFiles([...e.dataTransfer.files]);
  };
  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e=>{e.preventDefault();setDrag(true);}}
      onDragLeave={()=>setDrag(false)}
      onDrop={handleDrop}
      style={{
        border:`2px dashed ${drag?'var(--accent)':'var(--border-strong)'}`,
        borderRadius:10, padding:'28px 20px', textAlign:'center', cursor:'pointer',
        background: drag ? 'var(--accent-soft)' : 'var(--surface-muted)',
        transition:'all .15s', userSelect:'none',
      }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
      onMouseLeave={e=>{ if(!drag) e.currentTarget.style.borderColor='var(--border-strong)'; }}
    >
      <div style={{fontSize:28,marginBottom:8}}>📂</div>
      <div style={{fontSize:13,fontWeight:600,color:'var(--ink)'}}>ចុច​ ឬ អូស​ file មក​នេះ</div>
      <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>PDF · Word · Excel · PowerPoint · ទំហំ​អតិបរមា 5MB</div>
      <input ref={inputRef} type="file" accept={accept} multiple style={{display:'none'}}
        onChange={e=>{ onFiles([...e.target.files]); e.target.value=''; }}/>
    </div>
  );
};

// ── Inline edit form ───────────────────────────────────────────────────────
const DocEditForm = ({ doc, onSave, onCancel, lang }) => {
  const [name, setName]   = React.useState(doc.name);
  const [desc, setDesc]   = React.useState(doc.desc || '');
  const [cat,  setCat]    = React.useState(doc.cat  || 'other');
  const inp = { style:{ width:'100%', padding:'7px 10px', border:'1px solid var(--border)', borderRadius:7,
    fontSize:13, background:'var(--surface)', color:'var(--ink)', outline:'none' } };
  return (
    <div style={{padding:'14px 16px', background:'var(--accent-soft)', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:10}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        <div>
          <div style={{fontSize:10,fontWeight:600,color:'var(--ink-2)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>
            {lang==='km'?'ឈ្មោះ​ឯកសារ':'File name'}
          </div>
          <input {...inp} value={name} onChange={e=>setName(e.target.value)} autoFocus/>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:600,color:'var(--ink-2)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>
            {lang==='km'?'ប្រភេទ':'Category'}
          </div>
          <select value={cat} onChange={e=>setCat(e.target.value)}
            style={{...inp.style, cursor:'pointer'}}>
            {DOC_CATS.map(c=>(
              <option key={c.id} value={c.id}>{lang==='km'?c.km:c.en}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:600,color:'var(--ink-2)',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>
          {lang==='km'?'ចំណាំ / Description':'Description'}
        </div>
        <input {...inp} value={desc} onChange={e=>setDesc(e.target.value)}
          placeholder={lang==='km'?'ចំណាំ​ (ស្រេចចិត្ត)…':'Note (optional)…'}/>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" size="sm" onClick={onCancel}>{lang==='km'?'បោះ​បង់':'Cancel'}</Btn>
        <Btn kind="primary" size="sm" icon={<Icon name="check" size={12}/>}
          onClick={()=>onSave({name:name.trim()||doc.name, desc, cat})}>
          {lang==='km'?'រក្សា​ទុក':'Save'}
        </Btn>
      </div>
    </div>
  );
};

// ── Uploaded docs section ──────────────────────────────────────────────────
const UploadedDocsSection = ({ toast, lang }) => {
  const [docs, setDocs]       = React.useState(loadUploadedDocs);
  const [editId, setEditId]   = React.useState(null);
  const [search, setSearch]   = React.useState('');
  const [catFilter, setCat]   = React.useState('all');

  const persist = (next) => { setDocs(next); saveUploadedDocs(next); };

  const handleFiles = (files) => {
    const tooBig = files.filter(f => f.size > MAX_FILE_BYTES);
    if (tooBig.length) {
      toast(`ឯកសារ​ធំ​ពេក (>${fmtSize(MAX_FILE_BYTES)}): ${tooBig.map(f=>f.name).join(', ')}`, 'warn');
    }
    const valid = files.filter(f => f.size <= MAX_FILE_BYTES);
    if (!valid.length) return;

    let done = 0;
    const results = [];
    valid.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        results.push({
          id:         Date.now() + Math.random(),
          name:       file.name,
          desc:       '',
          cat:        'other',
          size:       file.size,
          uploadedAt: new Date().toISOString(),
          data:       e.target.result, // base64 data URL
        });
        done++;
        if (done === valid.length) {
          const next = [...loadUploadedDocs(), ...results];
          if (saveUploadedDocs(next)) {
            setDocs(next);
            toast(lang==='km'
              ? `Upload ${done} ឯកសារ​ជោគ​ជ័យ ✓`
              : `${done} file(s) uploaded ✓`, 'good');
          } else {
            toast(lang==='km'
              ? 'មិន​អាច​រក្សា​ទុក — localStorage ពេញ'
              : 'Could not save — storage full', 'warn');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDownloadFile = (doc) => {
    const a = document.createElement('a');
    a.href = doc.data;
    a.download = doc.name;
    a.click();
  };

  const handleDelete = (id) => {
    persist(docs.filter(d => d.id !== id));
    toast(lang==='km'?'បាន​លុប​ឯកសារ':'File deleted', 'neutral');
  };

  const handleSaveEdit = (id, patch) => {
    persist(docs.map(d => d.id===id ? {...d,...patch} : d));
    setEditId(null);
    toast(lang==='km'?'បាន​រក្សា​ទុក ✓':'Saved ✓', 'good');
  };

  const q = search.trim().toLowerCase();
  const filtered = docs.filter(d =>
    (catFilter==='all' || d.cat===catFilter) &&
    (!q || d.name.toLowerCase().includes(q) || (d.desc||'').toLowerCase().includes(q))
  );

  const catCounts = DOC_CATS.map(c => ({ ...c, count: docs.filter(d=>d.cat===c.id).length }));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {/* Section header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:'color-mix(in oklch,#C66A2E 14%,var(--surface))',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>📂</div>
          <div style={{fontSize:14,fontWeight:600,color:'var(--ink)'}}>
            {lang==='km'?'ឯកសារ​ដែល​Upload':'Uploaded Files'}
            {docs.length>0 && <span style={{marginLeft:6,fontSize:11,fontWeight:400,color:'var(--ink-3)'}}>{docs.length} ឯកសារ</span>}
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <UploadZone onFiles={handleFiles}/>

      {/* Filter + search bar */}
      {docs.length > 0 && (
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {/* Category chips */}
          <div style={{display:'flex',gap:4,flex:1,flexWrap:'wrap'}}>
            {[{id:'all',km:'ទាំង​អស់',en:'All',count:docs.length},...catCounts.filter(c=>c.count>0)].map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{
                padding:'4px 10px',borderRadius:20,border:'1px solid',fontSize:11,fontWeight:500,cursor:'pointer',
                background:catFilter===c.id?'var(--accent)':'var(--surface)',
                borderColor:catFilter===c.id?'var(--accent)':'var(--border)',
                color:catFilter===c.id?'#fff':'var(--ink-2)',
              }}>
                {lang==='km'?c.km:c.en} {c.count>0&&<span style={{opacity:.7}}>({c.count})</span>}
              </button>
            ))}
          </div>
          {/* Search */}
          <div style={{position:'relative',minWidth:180}}>
            <Icon name="search" size={12} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'var(--ink-3)',pointerEvents:'none'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={lang==='km'?'ស្វែង​រក…':'Search…'}
              style={{padding:'6px 8px 6px 26px',border:'1px solid var(--border)',borderRadius:7,
                fontSize:12,background:'var(--surface)',color:'var(--ink)',outline:'none',width:'100%'}}/>
          </div>
        </div>
      )}

      {/* File list */}
      {filtered.length > 0 && (
        <Card pad={0}>
          {filtered.map((doc, i) => {
            const ft = ftOf(doc.name);
            const isEditing = editId === doc.id;
            return (
              <div key={doc.id}>
                <div style={{
                  display:'grid', gridTemplateColumns:'36px 1fr auto',
                  gap:12, padding:'12px 16px', alignItems:'center',
                  borderTop: i>0 ? '1px solid var(--border)' : 'none',
                  background: isEditing ? 'var(--accent-soft)' : 'transparent',
                }}>
                  {/* File icon */}
                  <div style={{width:36,height:36,borderRadius:8,background:ft.bg,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                    {ft.icon}
                  </div>

                  {/* Name + meta */}
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--ink)',
                      whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {doc.name}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
                      <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,letterSpacing:'.05em',
                        background:ft.bg,color:ft.color,border:`1px solid ${ft.color}30`}}>{ft.label}</span>
                      <span style={{fontSize:11,color:'var(--ink-3)'}}>{fmtSize(doc.size)}</span>
                      <span style={{fontSize:11,color:'var(--ink-3)'}}>·</span>
                      <span style={{fontSize:11,color:'var(--ink-3)'}}>{fmtDate(doc.uploadedAt)}</span>
                      {doc.cat && doc.cat!=='other' && (
                        <>
                          <span style={{fontSize:11,color:'var(--ink-3)'}}>·</span>
                          <span style={{fontSize:11,color:'var(--accent)',fontWeight:500}}>
                            {DOC_CATS.find(c=>c.id===doc.cat)?.[lang==='km'?'km':'en'] || doc.cat}
                          </span>
                        </>
                      )}
                    </div>
                    {doc.desc && (
                      <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2,fontStyle:'italic',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{doc.desc}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
                    <button onClick={()=>handleDownloadFile(doc)} title={lang==='km'?'ទាញ​យក':'Download'}
                      style={{padding:'6px 10px',border:'1px solid var(--border)',borderRadius:6,
                        background:'var(--surface)',color:'var(--accent)',cursor:'pointer',
                        display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600}}>
                      <Icon name="download" size={12}/>{lang==='km'?'ទាញ​យក':'Download'}
                    </button>
                    <button onClick={()=>setEditId(isEditing?null:doc.id)} title={lang==='km'?'កែ':'Edit'}
                      style={{padding:'6px 8px',border:'1px solid var(--border)',borderRadius:6,
                        background:isEditing?'var(--accent)':'var(--surface)',
                        color:isEditing?'#fff':'var(--ink-2)',cursor:'pointer'}}>
                      ✏️
                    </button>
                    <button onClick={()=>handleDelete(doc.id)} title={lang==='km'?'លុប':'Delete'}
                      style={{padding:'6px 8px',border:'1px solid var(--border)',borderRadius:6,
                        background:'var(--surface)',color:'var(--danger)',cursor:'pointer'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--danger)';e.currentTarget.style.color='#fff';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='var(--surface)';e.currentTarget.style.color='var(--danger)';}}>
                      🗑
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <DocEditForm
                    doc={doc}
                    lang={lang}
                    onSave={(patch) => handleSaveEdit(doc.id, patch)}
                    onCancel={() => setEditId(null)}
                  />
                )}
              </div>
            );
          })}
        </Card>
      )}

      {docs.length > 0 && filtered.length === 0 && (
        <div style={{textAlign:'center',padding:'24px',color:'var(--ink-3)',fontSize:13}}>
          {lang==='km'?'រក​មិន​ឃើញ​ឯកសារ':'No files match your search'}
        </div>
      )}

      {/* Storage indicator */}
      {docs.length > 0 && (() => {
        const used = docs.reduce((s,d)=>s+(d.data?.length||0)*0.75, 0);
        const pct  = Math.min(100, (used / (5*1024*1024)) * 100);
        return (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{flex:1,height:4,background:'var(--border)',borderRadius:999,overflow:'hidden'}}>
              <div style={{width:`${pct}%`,height:'100%',
                background: pct>80?'var(--danger)':pct>60?'var(--warn)':'var(--good)',
                borderRadius:999,transition:'width .3s'}}/>
            </div>
            <span style={{fontSize:10,color:'var(--ink-3)',whiteSpace:'nowrap'}}>
              {fmtSize(used)} / 5MB ({pct.toFixed(0)}%)
            </span>
          </div>
        );
      })()}
    </div>
  );
};

// ── PDF Template Editor ────────────────────────────────────────────────────

const PanelRow = ({ label, children }) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:10,fontWeight:700,color:'var(--ink-3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:5}}>{label}</div>
    {children}
  </div>
);

const PanelSec = ({ title, children }) => (
  <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
    <div style={{fontSize:11,fontWeight:700,color:'var(--ink-2)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:12}}>{title}</div>
    {children}
  </div>
);

const TEMPLATE_GEN_OPTIONS = [
  { id:'generateRegForm',     km:'ទម្រង់​ចុះ​ឈ្មោះ',    en:'Registration Form' },
  { id:'generateCertificate', km:'វិញ្ញាបនបត្រ',         en:'Certificate' },
  { id:'generateReceipt',     km:'បង្កាន់​ដៃ',           en:'Receipt' },
  { id:'generatePriceList',   km:'បញ្ជី​តម្លៃ',          en:'Price List' },
  { id:'generateAttendance',  km:'វត្ត​មាន',             en:'Attendance' },
  { id:'generateSchedule',    km:'កាល​វិភាគ',            en:'Schedule' },
  { id:'generateStudentList', km:'បញ្ជី​សិស្ស',          en:'Student List' },
  { id:'generateIdCard',      km:'អត្ត​សញ្ញាណ​ប័ណ្ណ',    en:'ID Card' },
  { id:'generateInvoice',     km:'វិក្ក​យបត្រ',          en:'Invoice' },
];

const TemplateEditorModal = ({ onClose, lang }) => {
  const [draft, setDraft]         = React.useState(() => getPdfTheme());
  const [previewGen, setPreviewGen] = React.useState('generateRegForm');
  const [previewHtml, setPreviewHtml] = React.useState('');
  const logoRef = React.useRef();

  React.useEffect(() => {
    const t = setTimeout(() => {
      try { setPreviewHtml(capturePdfHtml(previewGen, draft)); }
      catch(e) { console.error('preview error', e); }
    }, 220);
    return () => clearTimeout(t);
  }, [draft, previewGen]);

  const upd = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const handleSave = () => {
    if (!window.__schoolSettings) window.__schoolSettings = {};
    window.__schoolSettings.pdfTheme = draft;
    if (window.saveAllData) window.saveAllData();
    onClose();
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,background:'rgba(0,0,0,.55)',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{padding:'12px 20px',background:'var(--surface)',borderBottom:'1px solid var(--border)',
        display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>🎨</span>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--ink)'}}>{lang==='km'?'ប្ដូររូបមន្ត PDF':'PDF Template Editor'}</div>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>Customize the appearance of all generated PDFs</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn kind="ghost" size="sm" onClick={()=>setDraft({...DEFAULT_THEME})}>↩ {lang==='km'?'លំនាំ​ដើម':'Reset'}</Btn>
          <Btn kind="ghost" size="sm" onClick={onClose}>{lang==='km'?'បោះ​បង់':'Cancel'}</Btn>
          <Btn kind="primary" size="sm" icon={<Icon name="check" size={12}/>} onClick={handleSave}>{lang==='km'?'រក្សា​ទុក':'Save'}</Btn>
        </div>
      </div>

      {/* Body */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── Left controls panel ── */}
        <div style={{width:268,overflowY:'auto',borderRight:'1px solid var(--border)',background:'var(--surface)',flexShrink:0}}>

          <PanelSec title={lang==='km'?'Logo':'Logo'}>
            {draft.logo
              ? <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <img src={draft.logo} style={{height:44,maxWidth:80,objectFit:'contain',borderRadius:6,border:'1px solid var(--border)'}}/>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    <Btn kind="ghost" size="sm" onClick={()=>logoRef.current?.click()}>ប្ដូរ</Btn>
                    <Btn kind="ghost" size="sm" onClick={()=>upd('logo',null)}
                      style={{color:'var(--danger)',borderColor:'var(--danger)'}}>លុប</Btn>
                  </div>
                </div>
              : <button onClick={()=>logoRef.current?.click()} style={{
                  width:'100%',padding:'14px',border:'2px dashed var(--border-strong)',
                  borderRadius:8,background:'var(--surface-muted)',cursor:'pointer',
                  color:'var(--ink-3)',fontSize:12,marginBottom:8,
                }}>+ {lang==='km'?'Upload Logo':'Upload Logo'}</button>
            }
            <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>{
                const f = e.target.files[0]; if (!f) return;
                const r = new FileReader();
                r.onload = ev => upd('logo', ev.target.result);
                r.readAsDataURL(f);
              }}/>
            {draft.logo && (
              <PanelRow label={lang==='km'?'ទំហំ Logo':'Logo Size'}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="range" min={24} max={120} value={draft.logoSize}
                    onChange={e=>upd('logoSize',+e.target.value)} style={{flex:1}}/>
                  <span style={{fontSize:11,color:'var(--ink-3)',minWidth:30}}>{draft.logoSize}px</span>
                </div>
              </PanelRow>
            )}
          </PanelSec>

          <PanelSec title={lang==='km'?'ពណ៌':'Colors'}>
            {[
              {k:'primaryColor', km:'ពណ៌​ចម្បង',          en:'Primary Color'},
              {k:'bgColor',      km:'ផ្ទៃ​ខាង​ក្រោយ',      en:'Background'},
              {k:'bodyColor',    km:'ពណ៌​អក្សរ',           en:'Text Color'},
            ].map(({k,km,en}) => (
              <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <span style={{fontSize:12,color:'var(--ink)'}}>{lang==='km'?km:en}</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="color" value={draft[k]} onChange={e=>upd(k,e.target.value)}
                    style={{width:30,height:26,border:'1px solid var(--border)',borderRadius:4,cursor:'pointer',padding:1}}/>
                  <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'monospace'}}>{draft[k]}</span>
                </div>
              </div>
            ))}
          </PanelSec>

          <PanelSec title={lang==='km'?'អក្សរ':'Font & Size'}>
            <PanelRow label={lang==='km'?'ប្រភេទ​អក្សរ':'Font Family'}>
              <div style={{display:'flex',gap:4}}>
                {[['sans','Sans'],['serif','Serif'],['mono','Mono']].map(([id,lbl])=>(
                  <button key={id} onClick={()=>upd('fontFamily',id)} style={{
                    flex:1,padding:'5px',borderRadius:6,border:'1px solid',cursor:'pointer',fontSize:11,fontWeight:600,
                    background:draft.fontFamily===id?'var(--accent)':'var(--surface)',
                    borderColor:draft.fontFamily===id?'var(--accent)':'var(--border)',
                    color:draft.fontFamily===id?'#fff':'var(--ink)',
                  }}>{lbl}</button>
                ))}
              </div>
            </PanelRow>
            <PanelRow label={lang==='km'?'ទំហំ​ចំណងជើង':'Title Size'}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={12} max={36} value={draft.titleFontSize}
                  onChange={e=>upd('titleFontSize',+e.target.value)} style={{flex:1}}/>
                <span style={{fontSize:11,color:'var(--ink-3)',minWidth:30}}>{draft.titleFontSize}px</span>
              </div>
            </PanelRow>
            <PanelRow label={lang==='km'?'ទំហំ​ខ្លឹម​សារ':'Body Size'}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={8} max={18} value={draft.bodyFontSize}
                  onChange={e=>upd('bodyFontSize',+e.target.value)} style={{flex:1}}/>
                <span style={{fontSize:11,color:'var(--ink-3)',minWidth:30}}>{draft.bodyFontSize}px</span>
              </div>
            </PanelRow>
            <PanelRow label={lang==='km'?'តម្រឹម​ចំណងជើង':'Title Align'}>
              <div style={{display:'flex',gap:4}}>
                {[['left','◀ ឆ្វេង'],['center','▬ កណ្ដាល'],['right','ស្ដាំ ▶']].map(([id,lbl])=>(
                  <button key={id} onClick={()=>upd('titleAlign',id)} style={{
                    flex:1,padding:'5px 3px',borderRadius:6,border:'1px solid',cursor:'pointer',fontSize:10,fontWeight:600,
                    background:draft.titleAlign===id?'var(--accent)':'var(--surface)',
                    borderColor:draft.titleAlign===id?'var(--accent)':'var(--border)',
                    color:draft.titleAlign===id?'#fff':'var(--ink)',
                  }}>{lbl}</button>
                ))}
              </div>
            </PanelRow>
          </PanelSec>

          <PanelSec title={lang==='km'?'គែម Certificate':'Certificate Border'}>
            <PanelRow label={lang==='km'?'ប្រភេទ​គែម':'Border Style'}>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {['none','solid','dashed','double'].map(s=>(
                  <button key={s} onClick={()=>upd('borderStyle',s)} style={{
                    padding:'4px 8px',borderRadius:6,border:'1px solid',cursor:'pointer',fontSize:11,fontWeight:600,
                    background:draft.borderStyle===s?'var(--accent)':'var(--surface)',
                    borderColor:draft.borderStyle===s?'var(--accent)':'var(--border)',
                    color:draft.borderStyle===s?'#fff':'var(--ink)',
                  }}>{s}</button>
                ))}
              </div>
            </PanelRow>
            {draft.borderStyle !== 'none' && (
              <PanelRow label={lang==='km'?'កម្រាស់​គែម':'Border Width'}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="range" min={1} max={8} value={draft.borderWidth}
                    onChange={e=>upd('borderWidth',+e.target.value)} style={{flex:1}}/>
                  <span style={{fontSize:11,color:'var(--ink-3)',minWidth:25}}>{draft.borderWidth}px</span>
                </div>
              </PanelRow>
            )}
          </PanelSec>

          <PanelSec title={lang==='km'?'ស្លាក​ទឹក':'Watermark'}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:10}}>
              <input type="checkbox" checked={draft.showWatermark}
                onChange={e=>upd('showWatermark',e.target.checked)}/>
              <span style={{fontSize:12,color:'var(--ink)'}}>{lang==='km'?'បង្ហាញ​ស្លាក​ទឹក':'Show watermark'}</span>
            </label>
            {draft.showWatermark && (
              <PanelRow label={lang==='km'?'ភាព​ថ្លា (opacity)':'Opacity'}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <input type="range" min={0.01} max={0.15} step={0.01} value={draft.watermarkOpacity}
                    onChange={e=>upd('watermarkOpacity',+e.target.value)} style={{flex:1}}/>
                  <span style={{fontSize:11,color:'var(--ink-3)',minWidth:35}}>{Math.round(draft.watermarkOpacity*100)}%</span>
                </div>
              </PanelRow>
            )}
          </PanelSec>

        </div>

        {/* ── Right preview panel ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',background:'var(--bg)',overflow:'hidden'}}>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface)',
            display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            <span style={{fontSize:12,color:'var(--ink-2)',fontWeight:600,whiteSpace:'nowrap'}}>
              {lang==='km'?'ជ្រើស​ Template:':'Preview:'}
            </span>
            <select value={previewGen} onChange={e=>setPreviewGen(e.target.value)}
              style={{padding:'5px 10px',border:'1px solid var(--border)',borderRadius:6,
                background:'var(--surface)',color:'var(--ink)',fontSize:12,cursor:'pointer',flex:1,maxWidth:220}}>
              {TEMPLATE_GEN_OPTIONS.map(g=>(
                <option key={g.id} value={g.id}>{lang==='km'?g.km:g.en}</option>
              ))}
            </select>
            <span style={{fontSize:11,color:'var(--ink-3)'}}>Live preview</span>
          </div>
          <div style={{flex:1,overflow:'hidden',padding:12}}>
            {previewHtml
              ? <iframe srcDoc={previewHtml} style={{width:'100%',height:'100%',border:'none',borderRadius:8,
                  boxShadow:'0 2px 16px rgba(0,0,0,.1)',background:'#fff'}}/>
              : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',
                  color:'var(--ink-3)',fontSize:13}}>
                  ⏳ {lang==='km'?'ផ្ទុក…':'Loading…'}
                </div>
            }
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────

const DownloadsScreen = ({ role }) => {
  const { tr, lang, toast } = useAppActions();
  const [search, setSearch]       = React.useState('');
  const [loading, setLoading]     = React.useState(null);
  const [showEditor, setShowEditor] = React.useState(false);

  const q = search.trim().toLowerCase();

  const filteredCats = DOWNLOAD_CATEGORIES
    .filter(cat => role !== 'student' || cat.id !== 'admin')
    .map(cat => ({
      ...cat,
      docs: cat.docs.filter(d =>
        !q ||
        d.km.toLowerCase().includes(q) ||
        d.en.toLowerCase().includes(q) ||
        d.descKm.toLowerCase().includes(q) ||
        d.descEn.toLowerCase().includes(q)
      ),
    }))
    .filter(cat => cat.docs.length > 0);

  const handleDownload = (doc) => {
    setLoading(doc.id);
    setTimeout(() => {
      try {
        GEN_FNS[doc.generate]();
        toast(tr('បើក​ PDF រួច​ហើយ · ចុច Ctrl+P ឬ ប៊ូតុង​ "Save as PDF"', 'PDF opened — press Ctrl+P or click "Save as PDF"'), 'good');
      } catch(e) {
        toast(tr('មិន​អាច​បើក​ PDF បាន', 'Could not generate PDF'), 'warn');
        console.error(e);
      }
      setLoading(null);
    }, 50);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {showEditor && <TemplateEditorModal onClose={()=>setShowEditor(false)} lang={lang}/>}

      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <SectionTitle
          km="ទាញ​យក​ ឯកសារ PDF · PDF Downloads"
          en="Print or save official school documents as PDF"
        />
        <button onClick={()=>setShowEditor(true)} style={{
          display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
          border:'1px solid var(--border)',borderRadius:8,
          background:'var(--surface)',color:'var(--ink-2)',
          cursor:'pointer',fontSize:12,fontWeight:600,flexShrink:0,
          transition:'border-color .15s,color .15s',
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--ink-2)';}}>
          <span style={{fontSize:14}}>🎨</span>
          {lang==='km'?'ប្ដូររូបមន្ត':'Customize PDFs'}
        </button>
      </div>

      {/* Search */}
      <div style={{position:'relative',maxWidth:400}}>
        <Icon name="search" size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--ink-3)',pointerEvents:'none'}}/>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder={lang==='km' ? 'ស្វែង​រក​ឯកសារ…' : 'Search documents…'}
          style={{width:'100%',padding:'9px 10px 9px 34px',border:'1px solid var(--border)',borderRadius:8,
            background:'var(--surface)',color:'var(--ink)',fontSize:13,outline:'none'}}
        />
      </div>

      {filteredCats.length === 0 && (
        <Card>
          <div style={{textAlign:'center',padding:'40px 0',color:'var(--ink-3)',fontSize:13}}>
            {lang==='km' ? 'រក​មិន​ឃើញ​ឯកសារ' : 'No documents found'}
          </div>
        </Card>
      )}

      {filteredCats.map(cat => (
        <div key={cat.id}>
          {/* Category header */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:cat.colorSoft,display:'flex',alignItems:'center',justifyContent:'center',color:cat.color}}>
              <Icon name={cat.icon} size={14}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:'var(--ink)'}}>{lang==='km' ? cat.km : cat.en}</div>
            </div>
          </div>

          {/* Doc cards grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12,marginBottom:6}}>
            {cat.docs.map(doc => (
              <div key={doc.id} style={{
                background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,
                padding:'16px 18px',display:'flex',flexDirection:'column',gap:10,
                transition:'box-shadow .15s,border-color .15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.07)';e.currentTarget.style.borderColor='var(--accent)';}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='var(--border)';}}>

                <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <div style={{width:36,height:36,borderRadius:8,background:cat.colorSoft,
                    display:'flex',alignItems:'center',justifyContent:'center',color:cat.color,flexShrink:0}}>
                    <Icon name={doc.icon} size={16}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--ink)',lineHeight:1.3}}>
                      {lang==='km' ? doc.km : doc.en}
                    </div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3,lineHeight:1.4}}>
                      {lang==='km' ? doc.descKm : doc.descEn}
                    </div>
                  </div>
                </div>

                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:10,padding:'2px 8px',background:'var(--surface-muted)',
                      border:'1px solid var(--border)',borderRadius:4,color:'var(--ink-3)',
                      fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>PDF</span>
                    <span style={{fontSize:10,color:'var(--ink-3)'}}>{doc.pages} {lang==='km'?'ទំព័រ':'page'}</span>
                  </div>
                  <Btn
                    kind="primary" size="sm"
                    icon={loading===doc.id
                      ? <span style={{display:'inline-block',width:12,height:12,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                      : <Icon name="download" size={12}/>}
                    onClick={() => handleDownload(doc)}
                    style={{gap:5}}
                  >
                    {lang==='km' ? 'ទាញ​យក' : 'Download'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Tip */}
      <div style={{padding:'12px 16px',background:'var(--accent-soft)',border:'1px solid color-mix(in oklch,var(--accent) 20%,transparent)',borderRadius:8,fontSize:12,color:'var(--ink-2)',display:'flex',gap:10,alignItems:'flex-start'}}>
        <span style={{fontSize:16}}>💡</span>
        <div>
          <strong>{lang==='km'?'របៀប​រក្សា​ទុក PDF':'How to save as PDF'}:</strong>{' '}
          {lang==='km'
            ? 'ចុច​ "ទាញ​យក" → ក្នុង​ window ថ្មី ចុច​ "💾 រក្សា​ទុក​ជា PDF" ឬ ចុច Ctrl+P → ជ្រើស "Save as PDF"'
            : 'Click "Download" → in the new window click "💾 Save as PDF" or press Ctrl+P → choose "Save as PDF"'}
        </div>
      </div>

      {/* Divider */}
      <Divider/>

      {/* Uploaded docs section */}
      <UploadedDocsSection toast={toast} lang={lang}/>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

Object.assign(window, { DownloadsScreen });
