// screens-finance.jsx — Comprehensive Financial Management (Cambodia Law Compliant)

if (!window.__expenseLog) window.__expenseLog = [];
if (!window.__incomeLog)  window.__incomeLog  = [];

// ── Constants ──────────────────────────────────────────────────────────────
const USD_KHR   = 4100;
const MONTHS_KM = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const currMonth = () => new Date().toISOString().slice(0,7);
const currYear  = () => new Date().getFullYear();
const fmtUSD    = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${(n||0).toLocaleString()}`;
const fmtFull   = (n) => `$${(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtKHR    = (n) => `${Math.round(n||0).toLocaleString()} ៛`;

// ── Tax helpers ────────────────────────────────────────────────────────────
const SALARY_BRACKETS = [
  { max:1500000,  rate:0.00 },
  { max:2000000,  rate:0.05 },
  { max:8500000,  rate:0.10 },
  { max:12500000, rate:0.15 },
  { max:Infinity, rate:0.20 },
];

const calcSalaryTax = (monthlyKHR) => {
  let tax = 0, prev = 0;
  for (const b of SALARY_BRACKETS) {
    const slice = Math.min(monthlyKHR, b.max) - prev;
    if (slice <= 0) break;
    tax += slice * b.rate;
    prev = b.max;
  }
  return Math.round(tax);
};

const NSSF_CAP_KHR = 1200000;
const calcNSSF = (monthlyUSD) => {
  const base = Math.min(monthlyUSD * USD_KHR, NSSF_CAP_KHR);
  return {
    empORC:     Math.round(base * 0.008),
    empHealth:  Math.round(base * 0.013),
    empPension: Math.round(base * 0.02),
    eePension:  Math.round(base * 0.02),
    get empTotal() { return this.empORC + this.empHealth + this.empPension; },
  };
};

// ── Categories ─────────────────────────────────────────────────────────────
const EXP_CATS = [
  { v:'salary',      km:'ប្រាក់ខែ',          en:'Salary',       color:'#2A5DB0', bg:'#E5EBF5' },
  { v:'fuel',        km:'សាំង',               en:'Fuel',         color:'#3B7A57', bg:'#E2EFE7' },
  { v:'maintenance', km:'ថែទាំយានយន្ត',       en:'Maintenance',  color:'#8E5223', bg:'#F6E9DC' },
  { v:'nssf',        km:'NSSF',               en:'NSSF',         color:'#1A6B3C', bg:'#D4F0E4' },
  { v:'tax',         km:'ពន្ធ',               en:'Tax',          color:'#B0413E', bg:'#F4DEDD' },
  { v:'rent',        km:'ជួល',                en:'Rent',         color:'#5B2EA0', bg:'#E5DAF5' },
  { v:'utilities',   km:'ភ្លើងទឹក',           en:'Utilities',    color:'#9B4D10', bg:'#FAE8CC' },
  { v:'supplies',    km:'សម្ភារៈ',            en:'Supplies',     color:'#666',    bg:'#F0F0F0' },
  { v:'marketing',   km:'ផ្សាយពាណិជ្ជកម្ម',  en:'Marketing',    color:'#0E6B8A', bg:'#D3EDF5' },
  { v:'insurance',   km:'ធានារ៉ាប់រង',        en:'Insurance',    color:'#7A3B8E', bg:'#F0E2F5' },
  { v:'other',       km:'ផ្សេងៗ',            en:'Other',        color:'#888',    bg:'#F5F5F5' },
];

const INC_CATS = [
  { v:'tuition',  km:'ថ្លៃបង្រៀន',          en:'Tuition fee'  },
  { v:'exam',     km:'ថ្លៃប្រឡង',            en:'Exam fee'     },
  { v:'reexam',   km:'ថ្លៃប្រឡងឡើងវិញ',    en:'Re-exam fee'  },
  { v:'license',  km:'ថ្លៃធ្វើប័ណ្ណ',        en:'License fee'  },
  { v:'material', km:'ថ្លៃសម្ភារៈ',          en:'Materials'    },
  { v:'other',    km:'ចំណូលផ្សេងៗ',         en:'Other income' },
];

const catMeta = (v) => EXP_CATS.find(c=>c.v===v) || EXP_CATS[EXP_CATS.length-1];
const incMeta = (v) => INC_CATS.find(c=>c.v===v) || INC_CATS[INC_CATS.length-1];

// ── Revenue helpers ────────────────────────────────────────────────────────
const calcRevenue = () => {
  const invPaid = INVOICES.filter(v=>v.status==='Paid').reduce((a,v)=>a+(v.amount||0),0);
  const incLog  = (window.__incomeLog||[]).reduce((a,e)=>a+(e.amount||0),0);
  return invPaid + incLog;
};

const monthlyRevenue = () => {
  const map = {};
  INVOICES.filter(v=>v.status==='Paid').forEach(v=>{
    const m=(v.date||'').slice(0,7); if(m) map[m]=(map[m]||0)+(v.amount||0);
  });
  (window.__incomeLog||[]).forEach(e=>{
    const m=(e.date||'').slice(0,7); if(m) map[m]=(map[m]||0)+(e.amount||0);
  });
  return map;
};

const staffExpense  = () => (window.__staffData||[]).reduce((a,s)=>{
  return a + (s.salaryType==='hourly' ? (s.salary||0)*(s.hours||40)*4 : (s.salary||0));
},0);
const maintExpense  = () => (window.__maintenanceData||[]).filter(m=>m.done).reduce((a,m)=>a+(m.cost||0),0);
const otherExpense  = () => (window.__expenseLog||[]).reduce((a,e)=>a+(e.amount||0),0);

// ── PDF helpers ────────────────────────────────────────────────────────────
const schoolName = () => window.__schoolSettings?.name || 'Driving School';
const schoolTIN  = () => window.__schoolSettings?.tin  || '';
const schoolAddr = () => window.__schoolSettings?.address || '';

const PDF_STYLE = `
body{font-family:'Khmer OS','Noto Serif Khmer',Arial,sans-serif;margin:0;padding:24px 32px;color:#111;font-size:12px}
h1{font-size:18px;margin:0 0 2px;color:#1a1a6b}
.sub{font-size:11px;color:#555;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th{background:#1a1a6b;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
td{padding:6px 10px;border-bottom:1px solid #ddd;font-size:11px}
.total td{font-weight:700;border-top:2px solid #1a1a6b;border-bottom:none}
.sig{margin-top:36px;display:flex;gap:60px}
.sig-line{flex:1;border-top:1px solid #111;margin-top:44px;font-size:10px;color:#555;padding-top:4px}
.alert{padding:8px 12px;border-radius:6px;font-size:11px;margin-bottom:12px}
.alert-warn{background:#fff3cd;border:1px solid #ffc107}
.alert-ok{background:#d4f0e4;border:1px solid #1a7a3c}
@media print{body{padding:12px 18px}}`;

const pdfOpen = (html) => {
  const w = window.open('','_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(()=>w.print(), 700);
};

const pdfWrap = (title, body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${PDF_STYLE}</style></head><body>${body}</body></html>`;

const pdfHeader = (subtitle) => `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:2px solid #1a1a6b;padding-bottom:12px">
    <div><h1>${schoolName()}</h1><div class="sub">${schoolAddr()}${schoolTIN()?`<br>TIN: ${schoolTIN()}`:''}` + `</div></div>
    <div style="text-align:right;font-size:13px;font-weight:700;color:#1a1a6b">${subtitle}</div>
  </div>`;

const pdfSig = (...labels) => `<div class="sig">${labels.map(l=>`<div class="sig-line">${l}</div>`).join('')}</div>`;

// VAT Invoice
const generateVATInvoice = ({ invoiceNo, date, customerName, customerTIN='', items=[], notes='' }) => {
  const sub = items.reduce((a,i)=>a+(i.qty||1)*(i.price||0),0);
  const vat  = Math.round(sub * 0.10 * 100)/100;
  const tot  = sub + vat;
  pdfOpen(pdfWrap(`VAT Invoice ${invoiceNo}`, pdfHeader('វិក្កយបត្រ VAT / TAX INVOICE') + `
    <div style="background:#f5f7fb;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:11px">
      <b>Invoice No:</b> ${invoiceNo} &nbsp;·&nbsp; <b>Date:</b> ${date}<br>
      <b>Customer / អតិថិជន:</b> ${customerName}${customerTIN?` &nbsp;·&nbsp; TIN: ${customerTIN}`:''}
    </div>
    <table><thead><tr><th>ការពិពណ៌នា / Description</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${items.map(i=>`<tr><td>${i.desc}</td><td>${i.qty||1}</td><td style="text-align:right">$${(i.price||0).toFixed(2)}</td><td style="text-align:right">$${((i.qty||1)*(i.price||0)).toFixed(2)}</td></tr>`).join('')}
    <tr><td colspan="3" style="text-align:right">Pre-tax / មុនពន្ធ</td><td style="text-align:right">$${sub.toFixed(2)}</td></tr>
    <tr><td colspan="3" style="text-align:right">VAT 10%</td><td style="text-align:right">$${vat.toFixed(2)}</td></tr>
    <tr class="total"><td colspan="3" style="text-align:right">Total / សរុប</td><td style="text-align:right">$${tot.toFixed(2)} (${fmtKHR(tot*USD_KHR)})</td></tr>
    </tbody></table>
    ${notes?`<div style="font-size:11px;color:#555;margin-top:8px">Notes: ${notes}</div>`:''}
    ${pdfSig('ហត្ថលេខាអតិថិជន / Customer Signature','ហត្ថលេខានិងត្រា / Authorized Signature & Stamp')}`));
};

// Payroll PDF
const generatePayrollPDF = (monthStr) => {
  const [y,m] = monthStr.split('-');
  const label = `${MONTHS_EN[parseInt(m)-1]} ${y}`;
  const staff = window.__staffData || [];
  let tGross=0, tEeNSSF=0, tWHT=0, tNet=0, tEmpNSSF=0;
  const rows = staff.map(s=>{
    const gross = s.salaryType==='hourly'?(s.salary||0)*(s.hours||40)*4:(s.salary||0);
    const nssf  = calcNSSF(gross);
    const whtKHR= calcSalaryTax(Math.round(gross*USD_KHR));
    const wht   = Math.round(whtKHR/USD_KHR*100)/100;
    const eeN   = Math.round(nssf.eePension/USD_KHR*100)/100;
    const empN  = Math.round(nssf.empTotal/USD_KHR*100)/100;
    const net   = Math.round((gross-wht-eeN)*100)/100;
    tGross+=gross; tEeNSSF+=eeN; tWHT+=wht; tNet+=net; tEmpNSSF+=empN;
    return `<tr><td>${s.name}</td><td>${s.role||'—'}</td><td style="text-align:right">$${gross.toFixed(2)}</td><td style="text-align:right">$${eeN.toFixed(2)}</td><td style="text-align:right">$${wht.toFixed(2)}</td><td style="text-align:right;font-weight:600">$${net.toFixed(2)}</td></tr>`;
  }).join('');
  pdfOpen(pdfWrap(`Payroll ${label}`, pdfHeader(`ទំរង់ប្រាក់ខែ / PAYROLL — ${label}`) + `
    <table><thead><tr><th>ឈ្មោះ / Name</th><th>តួនាទី</th><th style="text-align:right">Gross</th><th style="text-align:right">NSSF (EE)</th><th style="text-align:right">WHT</th><th style="text-align:right">Net Pay</th></tr></thead>
    <tbody>${rows}<tr class="total"><td colspan="2">សរុប / Total</td><td style="text-align:right">$${tGross.toFixed(2)}</td><td style="text-align:right">$${tEeNSSF.toFixed(2)}</td><td style="text-align:right">$${tWHT.toFixed(2)}</td><td style="text-align:right">$${tNet.toFixed(2)}</td></tr></tbody></table>
    <div style="font-size:11px;background:#f5f7fb;padding:10px;border-radius:6px;margin-top:8px">
      <b>Employer NSSF (4.1%):</b> $${tEmpNSSF.toFixed(2)} &nbsp;·&nbsp;
      <b>Total Labour Cost:</b> $${(tGross+tEmpNSSF).toFixed(2)}
    </div>
    ${pdfSig('Accountant / គណនេយ្យករ','Director / នាយក')}`));
};

// Monthly Tax Declaration
const generateMonthlyTaxPDF = (monthStr) => {
  const [y,m] = monthStr.split('-');
  const label   = `${MONTHS_EN[parseInt(m)-1]} ${y}`;
  const nextMo  = parseInt(m)%12+1;
  const nextY   = parseInt(m)===12?parseInt(y)+1:y;
  const dueDate = `20 ${MONTHS_EN[nextMo-1]} ${nextY}`;
  const rev     = calcRevenue();
  const vat     = Math.round(rev*0.10*100)/100;
  const prepay  = Math.round(rev*0.01*100)/100;
  const whtTotal= (window.__staffData||[]).reduce((a,s)=>{
    const g=s.salaryType==='hourly'?(s.salary||0)*(s.hours||40)*4:(s.salary||0);
    return a+Math.round(calcSalaryTax(Math.round(g*USD_KHR))/USD_KHR*100)/100;
  },0);
  const total = vat+prepay+whtTotal;
  pdfOpen(pdfWrap(`Monthly Tax ${label}`, pdfHeader(`ប្រកាសពន្ធប្រចាំខែ / MONTHLY TAX DECLARATION — ${label}`) + `
    <div class="alert alert-warn">⚠️ កាលបរិច្ឆេទផុតកំណត់ / Due: <b>${dueDate}</b> — File via GDT eTax portal (etax.tax.gov.kh)</div>
    <table><thead><tr><th>ប្រភេទពន្ធ / Tax Type</th><th>Form</th><th style="text-align:right">Base</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>VAT (អាករលើតម្លៃបន្ថែម)</td><td>VAT 001</td><td style="text-align:right">$${rev.toFixed(2)}</td><td style="text-align:right">10%</td><td style="text-align:right;font-weight:600">$${vat.toFixed(2)}</td></tr>
      <tr><td>Prepayment of TOI (ប្រាក់មុន)</td><td>PT 001</td><td style="text-align:right">$${rev.toFixed(2)}</td><td style="text-align:right">1%</td><td style="text-align:right;font-weight:600">$${prepay.toFixed(2)}</td></tr>
      <tr><td>Salary WHT (ពន្ធប្រាក់ខែ)</td><td>SRT 001</td><td style="text-align:right">$${staffExpense().toFixed(2)}</td><td style="text-align:right">Tiered</td><td style="text-align:right;font-weight:600">$${whtTotal.toFixed(2)}</td></tr>
      <tr class="total"><td colspan="4">សរុបពន្ធ / Total Tax Due</td><td style="text-align:right">$${total.toFixed(2)}</td></tr>
    </tbody></table>
    ${pdfSig('Accountant / គណនេយ្យករ','Director / នាយក')}`));
};

// NSSF Report
const generateNSSFReportPDF = (monthStr) => {
  const [y,m] = monthStr.split('-');
  const label = `${MONTHS_EN[parseInt(m)-1]} ${y}`;
  const staff = window.__staffData||[];
  let tEmp=0, tEe=0;
  const rows = staff.map(s=>{
    const gross=s.salaryType==='hourly'?(s.salary||0)*(s.hours||40)*4:(s.salary||0);
    const nssf=calcNSSF(gross);
    const empU=Math.round(nssf.empTotal/USD_KHR*100)/100;
    const eeU =Math.round(nssf.eePension/USD_KHR*100)/100;
    tEmp+=empU; tEe+=eeU;
    return `<tr><td>${s.name}</td><td>${s.id||'—'}</td><td style="text-align:right">$${gross.toFixed(2)}</td><td style="text-align:right">$${empU.toFixed(2)}</td><td style="text-align:right">$${eeU.toFixed(2)}</td><td style="text-align:right;font-weight:600">$${(empU+eeU).toFixed(2)}</td></tr>`;
  }).join('');
  pdfOpen(pdfWrap(`NSSF ${label}`, pdfHeader(`របាយការណ៍ NSSF / NSSF MONTHLY REPORT — ${label}`) + `
    <div class="alert alert-ok">Due by 15th of following month. Pay via designated bank or NSSF counter.</div>
    <table><thead><tr><th>ឈ្មោះ / Name</th><th>ID</th><th style="text-align:right">Salary</th><th style="text-align:right">Employer (4.1%)</th><th style="text-align:right">Employee (2%)</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}<tr class="total"><td colspan="3">សរុប / Total</td><td style="text-align:right">$${tEmp.toFixed(2)}</td><td style="text-align:right">$${tEe.toFixed(2)}</td><td style="text-align:right">$${(tEmp+tEe).toFixed(2)}</td></tr></tbody></table>
    <div style="font-size:10px;color:#555;margin-top:6px">Employer: ORC 0.8% + Health 1.3% + Pension 2% = 4.1% &nbsp;·&nbsp; Employee: Pension 2% &nbsp;·&nbsp; Cap: ${fmtKHR(NSSF_CAP_KHR)}/month</div>
    ${pdfSig('Accountant / គណនេយ្យករ','Director / នាយក')}`));
};

// Petty Cash
const generatePettyCash = ({ voucherNo, date, payTo, purpose, amount }) => {
  const amt = parseFloat(amount)||0;
  pdfOpen(pdfWrap(`Petty Cash ${voucherNo}`, pdfHeader('វាក្យបត្រសាច់ប្រាក់ / PETTY CASH VOUCHER') + `
    <table style="width:auto;min-width:400px"><tbody>
      <tr><td style="width:160px"><b>Voucher No:</b></td><td><b>${voucherNo}</b></td><td style="width:80px"><b>Date:</b></td><td>${date}</td></tr>
      <tr><td><b>Pay to / បង់ឱ្យ:</b></td><td colspan="3">${payTo}</td></tr>
      <tr><td><b>Purpose / គោលបំណង:</b></td><td colspan="3">${purpose}</td></tr>
      <tr><td><b>Amount / ចំនួន:</b></td><td colspan="3" style="font-size:15px;font-weight:700">$${amt.toFixed(2)} &nbsp;(${fmtKHR(amt*USD_KHR)})</td></tr>
    </tbody></table>
    ${pdfSig('Received by / ទទួលដោយ','Approved by / យល់ព្រម','Cashier / អ្នករក្សាសាច់ប្រាក់')}`));
};

// ── Mini bar ───────────────────────────────────────────────────────────────
const FMiniBar = ({ value, max, color }) => (
  <div style={{flex:1,height:60,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
    <div style={{borderRadius:'4px 4px 0 0',background:color||'var(--accent)',
      height:max>0?`${Math.max(4,Math.round((value/max)*56))}px`:'4px',transition:'height .3s'}}/>
  </div>
);

// ── Section header chip ────────────────────────────────────────────────────
const FSec = ({ label, children, action }) => (
  <div style={{display:'flex',flexDirection:'column',gap:10}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--ink-3)',letterSpacing:'.07em',fontFamily:'"JetBrains Mono",monospace'}}>{label}</div>
      {action}
    </div>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Tab: Overview
// ═══════════════════════════════════════════════════════════════════════════
const FOverviewTab = ({ revenue, expenses, profit, margin, salaries, maint, other, lang, tr }) => {
  const revMap = monthlyRevenue();
  const last6  = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-5+i); return d.toISOString().slice(0,7); });
  const maxRev = Math.max(...last6.map(m=>revMap[m]||0), 1);
  const expMap = {};
  (window.__expenseLog||[]).forEach(e=>{ const m=(e.date||'').slice(0,7); if(m) expMap[m]=(expMap[m]||0)+(e.amount||0); });
  const maxBoth = Math.max(maxRev, ...last6.map(m=>expMap[m]||0), 1);
  const YTD_rev = Object.entries(revMap).filter(([k])=>k.startsWith(String(currYear()))).reduce((a,[,v])=>a+v,0);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          { lkm:'ចំណូលសរុប', len:'REVENUE', v:fmtUSD(revenue), sub:tr(`${INVOICES.filter(v=>v.status==='Paid').length} វិក្កយបត្រ`,`${INVOICES.filter(v=>v.status==='Paid').length} paid invoices`), tone:'accent', icon:'cash' },
          { lkm:'ចំណាយសរុប', len:'EXPENSES', v:fmtUSD(expenses), sub:tr(`ខែនេះ ${fmtUSD(expenses)}`,`This month ${fmtUSD(expenses)}`), tone:'warn', icon:'book' },
          { lkm:'ចំណេញសុទ្ធ', len:'NET PROFIT', v:fmtUSD(profit), sub:`Margin ${margin}%`, tone:profit>=0?'good':'danger', icon:'chart' },
        ].map(k=>{
          const tc = k.tone==='good'?'var(--good)':k.tone==='danger'?'var(--danger)':k.tone==='warn'?'var(--warn)':'var(--accent)';
          const tb = k.tone==='good'?'#E5F0EA':k.tone==='danger'?'#F4DEDD':k.tone==='warn'?'#F6E9DC':'var(--accent-soft)';
          return (
            <Card key={k.len} style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:9,background:tb,display:'flex',alignItems:'center',justifyContent:'center',color:tc,flexShrink:0}}><Icon name={k.icon} size={17}/></div>
                <div style={{fontSize:11,color:'var(--ink-3)',letterSpacing:'.05em',fontFamily:'"JetBrains Mono",monospace',flex:1}}>{lang==='km'?k.lkm:k.len}</div>
              </div>
              <div style={{fontSize:26,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.02em',color:tc}}>{k.v}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{k.sub}</div>
            </Card>
          );
        })}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:12}}>
        {/* Revenue vs Expense chart */}
        <Card label={tr('ចំណូល vs ចំណាយ · 6 ខែចុងក្រោយ','REVENUE vs EXPENSES — LAST 6 MONTHS')}>
          <div style={{display:'flex',gap:4,alignItems:'flex-end',height:60,marginBottom:8}}>
            {last6.map(m=>(
              <React.Fragment key={m}>
                <FMiniBar value={revMap[m]||0} max={maxBoth} color='var(--accent)'/>
                <FMiniBar value={expMap[m]||0} max={maxBoth} color='#F4DEDD'/>
              </React.Fragment>
            ))}
          </div>
          <div style={{display:'flex',gap:4,marginBottom:10}}>
            {last6.map(m=>(
              <div key={m} style={{flex:2,textAlign:'center',fontSize:9,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>
                {MONTHS_EN[parseInt(m.slice(5,7))-1]}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:14,paddingTop:8,borderTop:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11}}><div style={{width:10,height:10,background:'var(--accent)',borderRadius:3}}/>{tr('ចំណូល','Revenue')}</div>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11}}><div style={{width:10,height:10,background:'#F4DEDD',borderRadius:3,border:'1px solid #e0b0b0'}}/>{tr('ចំណាយ','Expenses')}</div>
            <div style={{marginLeft:'auto',fontSize:11,color:'var(--ink-3)'}}>YTD: <b>{fmtFull(YTD_rev)}</b></div>
          </div>
        </Card>

        {/* Expense breakdown */}
        <Card label={tr('ការបែងចែកចំណាយ','EXPENSE BREAKDOWN')}>
          {[
            { km:'ប្រាក់ខែបុគ្គលិក', en:'Staff salaries', v:salaries, color:'#2A5DB0' },
            { km:'ថែទាំយានយន្ត',    en:'Vehicle maint.', v:maint,    color:'#8E5223' },
            { km:'ចំណាយផ្សេងៗ',    en:'Other expenses', v:other,    color:'#5B2EA0' },
          ].map((row,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderTop:i?'1px solid var(--border)':'none'}}>
              <div style={{width:8,height:8,borderRadius:2,background:row.color,flexShrink:0}}/>
              <div style={{flex:1,fontSize:12}}>{lang==='km'?row.km:row.en}</div>
              <div style={{fontWeight:600,fontSize:12}}>{fmtFull(row.v)}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',width:34,textAlign:'right'}}>
                {expenses>0?Math.round((row.v/expenses)*100):0}%
              </div>
            </div>
          ))}
          <div style={{marginTop:8,paddingTop:8,borderTop:'2px solid var(--border)',display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:13}}>
            <span>{tr('សរុប','Total')}</span><span>{fmtFull(expenses)}</span>
          </div>
        </Card>
      </div>

      {/* P&L summary strip */}
      <Card label={tr('សង្ខេបចំណេញ-ខាត','P&L SUMMARY')}>
        <div style={{display:'flex',gap:0}}>
          {[
            { label:tr('ចំណូល','Revenue'),  v:revenue,  color:'var(--accent)', bg:'var(--accent-soft)' },
            { label:tr('ចំណាយ','Expenses'), v:expenses, color:'var(--warn)',   bg:'#FFF4E5' },
            { label:tr('ចំណេញ','Profit'),   v:profit,   color:profit>=0?'var(--good)':'var(--danger)', bg:profit>=0?'#E5F0EA':'#F4DEDD' },
          ].map((col,i)=>(
            <div key={i} style={{flex:1,padding:'10px 14px',background:col.bg,borderRadius:i===0?'8px 0 0 8px':i===2?'0 8px 8px 0':'0',borderLeft:i?'1px solid var(--border)':'none',display:'flex',flexDirection:'column',gap:4}}>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{col.label}</div>
              <div style={{fontSize:18,fontWeight:700,color:col.color}}>{fmtFull(col.v)}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10,display:'flex',gap:20,fontSize:12,color:'var(--ink-3)'}}>
          <span>{tr('Margin','Margin')}: <b style={{color:margin>=0?'var(--good)':'var(--danger)'}}>{margin}%</b></span>
          <span>{tr('ចំណូលក្នុងមួយសិស្ស','Per student')}: <b>{STUDENTS.length>0?fmtFull(revenue/STUDENTS.length):'—'}</b></span>
          <span>{tr('សិស្សសរុប','Students')}: <b>{STUDENTS.length}</b></span>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tab: Revenue
// ═══════════════════════════════════════════════════════════════════════════
const FRevenueTab = ({ lang, tr, forceUpdate }) => {
  const [adding, setAdding] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const incLog  = window.__incomeLog || [];
  const filtered = filter==='all' ? incLog : incLog.filter(e=>e.cat===filter);

  const deleteInc = (id) => {
    window.__incomeLog = (window.__incomeLog||[]).filter(e=>e.id!==id);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {adding && <AddIncomeForm onSave={()=>{setAdding(false);forceUpdate();}} onCancel={()=>setAdding(false)}/>}

      {/* Manual income log */}
      <Card label={tr('កំណត់ត្រាចំណូល','INCOME LOG')}
        action={<Btn kind="ghost" size="sm" icon={<Icon name="plus" size={12}/>} onClick={()=>setAdding(true)}>{tr('+ ចំណូលថ្មី','+ Add income')}</Btn>}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
          {[{v:'all',km:'ទាំងអស់',en:'All'},...INC_CATS].map(c=>(
            <button key={c.v} onClick={()=>setFilter(c.v)} style={{
              padding:'3px 10px',borderRadius:20,fontSize:11,cursor:'pointer',
              border:`1px solid ${filter===c.v?'var(--accent)':'var(--border)'}`,
              background:filter===c.v?'var(--accent-soft)':'transparent',
              color:filter===c.v?'var(--accent)':'var(--ink-3)',
            }}>{lang==='km'?c.km:c.en}</button>
          ))}
        </div>
        {filtered.length===0 ? (
          <div style={{padding:'20px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនទាន់មានចំណូល','No income recorded')}</div>
        ) : filtered.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map((e,i)=>{
          const cm = incMeta(e.cat);
          return (
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none'}}>
              <div style={{width:32,height:32,borderRadius:8,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',fontSize:10,fontWeight:700,flexShrink:0}}>
                {tr(cm.km,cm.en).slice(0,3)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.desc}</div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{e.date} · <span style={{color:'var(--accent)'}}>{tr(cm.km,cm.en)}</span> · <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10}}>{e.id}</span></div>
              </div>
              <div style={{fontWeight:600,fontSize:13,flexShrink:0}}>{fmtFull(e.amount||0)}</div>
              <button onClick={()=>deleteInc(e.id)} style={{border:'none',background:'none',cursor:'pointer',color:'var(--ink-3)',fontSize:16,padding:'2px 6px',borderRadius:4,flexShrink:0}}>×</button>
            </div>
          );
        })}
        {filtered.length>0 && (
          <div style={{marginTop:8,paddingTop:8,borderTop:'2px solid var(--border)',display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:13}}>
            <span>{tr('សរុប','Total')}</span>
            <span>{fmtFull(filtered.reduce((a,e)=>a+(e.amount||0),0))}</span>
          </div>
        )}
      </Card>

      {/* Invoices */}
      <Card label={tr('វិក្កយបត្រ','INVOICES')}>
        {INVOICES.length===0 ? (
          <div style={{padding:'20px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនទាន់មានវិក្កយបត្រ','No invoices yet')}</div>
        ) : INVOICES.slice().reverse().map((inv,i)=>{
          const stu = STUDENTS.find(s=>s.id===inv.student);
          return (
            <div key={inv.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderTop:i?'1px solid var(--border)':'none'}}>
              <Avatar tag={stu?.photo} size={32}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{inv.name||stu?.name||'—'}</div>
                <div style={{fontSize:11,color:'var(--ink-3)',display:'flex',gap:8}}>
                  <span style={{fontFamily:'"JetBrains Mono",monospace',color:'var(--accent)',fontWeight:600}}>{inv.id}</span>
                  {inv.date && <span>{inv.date}</span>}
                  {inv.method && <span>{inv.method}</span>}
                </div>
              </div>
              <div style={{fontWeight:700,fontSize:14,flexShrink:0,fontFamily:'"JetBrains Mono",monospace'}}>${(inv.amount||0).toLocaleString()}</div>
              <Badge tone={inv.status==='Paid'?'good':inv.status==='Pending'?'warn':'danger'}>{inv.status||'—'}</Badge>
              <button onClick={()=>generateVATInvoice({
                invoiceNo:inv.id, date:inv.date||new Date().toISOString().slice(0,10),
                customerName:inv.name||stu?.name||'—',
                items:[{desc:tr('ថ្លៃបង្រៀនបើកបរ','Driving school tuition'),qty:1,price:inv.amount||0}],
              })} style={{border:'1px solid var(--border)',background:'transparent',cursor:'pointer',color:'var(--ink-3)',fontSize:11,padding:'3px 8px',borderRadius:4,flexShrink:0,whiteSpace:'nowrap'}}>
                PDF
              </button>
            </div>
          );
        })}
      </Card>

      {/* Student payment summary */}
      <Card label={tr('ការទូទាត់សិស្ស','STUDENT PAYMENT OVERVIEW')}>
        {STUDENTS.length===0 ? (
          <div style={{padding:'16px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនទាន់មានសិស្ស','No students')}</div>
        ) : STUDENTS.slice().sort((a,b)=>(b.paid||0)-(a.paid||0)).slice(0,10).map((s,i)=>{
          const ss = window.__schoolSettings;
          const cls = (s.cls||'B')[0];
          const base = ss?.pricing?.base||0;
          const course = (ss?.pricing?.courses||[]).find(c=>c.cls===cls);
          const price = base+(course?.price||0)+((s.addons||[]).reduce((x,id)=>{ const ao=(ss?.pricing?.addons||[]).find(a=>a.id===id); return x+(ao?.price||0); },0));
          const paidAmt = Math.round((s.paid||0)*price);
          const pct = price>0?Math.round((s.paid||0)*100):0;
          return (
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none'}}>
              <Avatar tag={s.photo} size={30}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                <div style={{fontSize:10,color:'var(--ink-3)'}}>Class {s.cls}</div>
              </div>
              <div style={{width:70,textAlign:'right'}}>
                <div style={{fontWeight:600,fontSize:12}}>${paidAmt.toLocaleString()}</div>
                <div style={{fontSize:9,color:'var(--ink-3)'}}>of ${price.toLocaleString()}</div>
              </div>
              <div style={{width:50}}>
                <div style={{height:5,background:'var(--surface-muted)',borderRadius:99,overflow:'hidden'}}>
                  <div style={{width:`${pct}%`,height:'100%',background:pct>=100?'var(--good)':'var(--accent)',borderRadius:99}}/>
                </div>
                <div style={{fontSize:9,color:'var(--ink-3)',textAlign:'right',marginTop:1}}>{pct}%</div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tab: Expenses
// ═══════════════════════════════════════════════════════════════════════════
const FExpensesTab = ({ salaries, maint, lang, tr, forceUpdate }) => {
  const [adding, setAdding]     = React.useState(false);
  const [expFilter, setExpFilter] = React.useState('all');
  const expLog    = window.__expenseLog || [];
  const filtered  = expFilter==='all' ? expLog : expLog.filter(e=>e.cat===expFilter);

  const deleteExpense = (id) => {
    window.__expenseLog = (window.__expenseLog||[]).filter(e=>e.id!==id);
    if (window.saveAllData) window.saveAllData();
    forceUpdate();
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {adding && <AddExpenseForm onSave={()=>{setAdding(false);forceUpdate();}} onCancel={()=>setAdding(false)}/>}

      {/* Staff salaries */}
      <Card label={tr('ប្រាក់ខែបុគ្គលិក','STAFF SALARIES')}>
        {(window.__staffData||[]).length===0 ? (
          <div style={{padding:'14px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនទាន់មានបុគ្គលិក','No staff yet')}</div>
        ) : (window.__staffData||[]).map((s,i)=>(
          <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none'}}>
            <Photo tag={s.photo} w={30} h={30} r={999}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{s.role} · {s.dept||'—'}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:600,fontSize:13}}>{fmtFull(s.salary||0)}</div>
              <div style={{fontSize:10,color:'var(--ink-3)'}}>{s.salaryType==='hourly'?tr('ប្រចាំម៉ោង','hourly'):tr('ប្រចាំខែ','monthly')}</div>
            </div>
          </div>
        ))}
        <div style={{marginTop:8,paddingTop:8,borderTop:'2px solid var(--border)',display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:13}}>
          <span>{tr('សរុបខែ','Monthly total')}</span><span>{fmtFull(salaries)}</span>
        </div>
      </Card>

      {/* Vehicle maintenance */}
      <Card label={tr('ការថែទាំយានយន្ត','VEHICLE MAINTENANCE')}>
        {(window.__maintenanceData||[]).length===0 ? (
          <div style={{padding:'14px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('គ្មានកំណត់ត្រាថែទាំ','No maintenance records')}</div>
        ) : (window.__maintenanceData||[]).slice().reverse().slice(0,8).map((m,i)=>(
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none'}}>
            <div style={{width:32,height:32,borderRadius:8,background:'#F6E9DC',display:'flex',alignItems:'center',justifyContent:'center',color:'#8E5223',flexShrink:0}}><Icon name="car" size={14}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500}}>{m.plate||'—'} — {m.type||'—'}</div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>{m.date} · {m.shop||'—'}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:600,fontSize:13}}>{fmtFull(m.cost||0)}</div>
              <Badge tone={m.done?'good':'neutral'}>{m.done?tr('ចប់','Done'):tr('កំពុង','Pending')}</Badge>
            </div>
          </div>
        ))}
        <div style={{marginTop:8,paddingTop:8,borderTop:'2px solid var(--border)',display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:13}}>
          <span>{tr('ចំណាយថែទាំ (ចប់)','Maint. cost (done)')}</span><span>{fmtFull(maint)}</span>
        </div>
      </Card>

      {/* Other expenses log */}
      <Card label={tr('ចំណាយផ្សេងៗ','OTHER EXPENSES')}
        action={<Btn kind="ghost" size="sm" icon={<Icon name="plus" size={12}/>} onClick={()=>setAdding(true)}>{tr('+ ចំណាយថ្មី','+ Add')}</Btn>}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
          {[{v:'all',km:'ទាំងអស់',en:'All'},...EXP_CATS].map(c=>(
            <button key={c.v} onClick={()=>setExpFilter(c.v)} style={{
              padding:'3px 10px',borderRadius:20,fontSize:11,cursor:'pointer',
              border:`1px solid ${expFilter===c.v?'var(--accent)':'var(--border)'}`,
              background:expFilter===c.v?'var(--accent-soft)':'transparent',
              color:expFilter===c.v?'var(--accent)':'var(--ink-3)',
            }}>{lang==='km'?c.km:c.en}</button>
          ))}
        </div>
        {filtered.length===0 ? (
          <div style={{padding:'14px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនទាន់មានចំណាយ','No expenses recorded')}</div>
        ) : filtered.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map((e,i)=>{
          const cm = catMeta(e.cat);
          return (
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderTop:i?'1px solid var(--border)':'none'}}>
              <div style={{width:32,height:32,borderRadius:8,background:cm.bg,display:'flex',alignItems:'center',justifyContent:'center',color:cm.color,fontSize:10,fontWeight:700,flexShrink:0}}>
                {(lang==='km'?cm.km:cm.en).slice(0,3)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.desc||e.notes||'—'}</div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{e.date} · <span style={{color:cm.color}}>{lang==='km'?cm.km:cm.en}</span> · <span style={{fontFamily:'"JetBrains Mono",monospace',fontSize:10}}>{e.id}</span></div>
              </div>
              <div style={{fontWeight:600,fontSize:13,flexShrink:0}}>{fmtFull(e.amount||0)}</div>
              <button onClick={()=>deleteExpense(e.id)} style={{border:'none',background:'none',cursor:'pointer',color:'var(--ink-3)',fontSize:16,padding:'2px 6px',borderRadius:4,flexShrink:0}}>×</button>
            </div>
          );
        })}
        {filtered.length>0 && (
          <div style={{marginTop:8,paddingTop:8,borderTop:'2px solid var(--border)',display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:13}}>
            <span>{tr('សរុប','Total')}</span>
            <span>{fmtFull(filtered.reduce((a,e)=>a+(e.amount||0),0))}</span>
          </div>
        )}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tab: Payroll
// ═══════════════════════════════════════════════════════════════════════════
const FPayrollTab = ({ lang, tr }) => {
  const [month, setMonth] = React.useState(currMonth());
  const staff = window.__staffData || [];

  const rows = staff.map(s=>{
    const gross = s.salaryType==='hourly'?(s.salary||0)*(s.hours||40)*4:(s.salary||0);
    const nssf  = calcNSSF(gross);
    const whtKHR= calcSalaryTax(Math.round(gross*USD_KHR));
    const wht   = Math.round(whtKHR/USD_KHR*100)/100;
    const eeN   = Math.round(nssf.eePension/USD_KHR*100)/100;
    const empN  = Math.round(nssf.empTotal/USD_KHR*100)/100;
    const net   = Math.round((gross-wht-eeN)*100)/100;
    return { s, gross, wht, eeN, empN, net, nssf };
  });

  const tGross = rows.reduce((a,r)=>a+r.gross,0);
  const tWHT   = rows.reduce((a,r)=>a+r.wht,0);
  const tEeN   = rows.reduce((a,r)=>a+r.eeN,0);
  const tEmpN  = rows.reduce((a,r)=>a+r.empN,0);
  const tNet   = rows.reduce((a,r)=>a+r.net,0);

  const BRACKET_LABELS = [
    { range:tr('≤ 1,500,000 ៛','≤ KHR 1.5M'),  rate:'0%' },
    { range:tr('1.5M–2M ៛','KHR 1.5M–2M'),    rate:'5%' },
    { range:tr('2M–8.5M ៛','KHR 2M–8.5M'),    rate:'10%' },
    { range:tr('8.5M–12.5M ៛','KHR 8.5M–12.5M'), rate:'15%' },
    { range:tr('> 12.5M ៛','> KHR 12.5M'),    rate:'20%' },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Field label={tr('ខែ','Month')} style={{margin:0}}>
          <Input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{width:160}}/>
        </Field>
        <div style={{marginTop:20}}>
          <Btn kind="ghost" size="md" icon={<Icon name="download" size={14}/>} onClick={()=>generatePayrollPDF(month)}>
            {tr('ទាញយក PDF','Download PDF')}
          </Btn>
        </div>
      </div>

      <Card label={tr('ទំរង់ប្រាក់ខែ','PAYROLL SHEET')}>
        {staff.length===0 ? (
          <div style={{padding:'20px 0',textAlign:'center',color:'var(--ink-3)',fontSize:13}}>{tr('មិនទាន់មានបុគ្គលិក','No staff yet')}</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  {[tr('ឈ្មោះ','Name'),tr('តួនាទី','Role'),tr('ប្រាក់ខែ Gross','Gross'),tr('NSSF (EE 2%)','NSSF (EE)'),tr('ពន្ធ WHT','WHT'),tr('ប្រាក់ស្ទុះ Net','Net Pay'),tr('NSSF ស្ថាប័ន','Employer NSSF')].map((h,i)=>(
                    <th key={i} style={{padding:'8px 10px',textAlign:i>1?'right':'left',fontWeight:600,color:'var(--ink-3)',fontSize:11,letterSpacing:'.04em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({s,gross,wht,eeN,empN,net},i)=>(
                  <tr key={s.id} style={{borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'var(--surface-muted)'}}>
                    <td style={{padding:'9px 10px'}}><div style={{fontWeight:500}}>{s.name}</div></td>
                    <td style={{padding:'9px 10px',color:'var(--ink-3)',fontSize:11}}>{s.role||'—'}</td>
                    <td style={{padding:'9px 10px',textAlign:'right',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(gross)}</td>
                    <td style={{padding:'9px 10px',textAlign:'right',color:'#1A6B3C',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(eeN)}</td>
                    <td style={{padding:'9px 10px',textAlign:'right',color:'#B0413E',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(wht)}</td>
                    <td style={{padding:'9px 10px',textAlign:'right',fontWeight:700,fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(net)}</td>
                    <td style={{padding:'9px 10px',textAlign:'right',color:'#5B2EA0',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(empN)}</td>
                  </tr>
                ))}
                <tr style={{borderTop:'2px solid var(--border)',fontWeight:700,background:'var(--surface-muted)'}}>
                  <td colSpan={2} style={{padding:'9px 10px'}}>{tr('សរុប','Total')}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(tGross)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',color:'#1A6B3C',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(tEeN)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',color:'#B0413E',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(tWHT)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(tNet)}</td>
                  <td style={{padding:'9px 10px',textAlign:'right',color:'#5B2EA0',fontFamily:'"JetBrains Mono",monospace'}}>{fmtFull(tEmpN)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {staff.length>0 && (
          <div style={{marginTop:10,padding:'10px 12px',background:'#E5DAF5',borderRadius:8,fontSize:12}}>
            <span style={{fontWeight:700,color:'#5B2EA0'}}>{tr('ថ្លៃដើមការងារសរុប','Total Labour Cost')}: {fmtFull(tGross+tEmpN)}</span>
            <span style={{color:'var(--ink-3)',marginLeft:16}}>(Gross {fmtFull(tGross)} + Employer NSSF {fmtFull(tEmpN)})</span>
          </div>
        )}
      </Card>

      {/* WHT brackets reference */}
      <Card label={tr('ចំណាត់ថ្នាក់ពន្ធប្រាក់ខែ (GDT)','SALARY TAX BRACKETS — GDT Cambodia')}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {BRACKET_LABELS.map((b,i)=>(
            <div key={i} style={{background:'var(--surface-muted)',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
              <div style={{fontSize:16,fontWeight:800,color:['#1A6B3C','#3B7A57','#8E5223','#B0413E','#5B2EA0'][i]}}>{b.rate}</div>
              <div style={{fontSize:10,color:'var(--ink-3)',marginTop:4}}>{b.range}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10,fontSize:11,color:'var(--ink-3)'}}>
          {tr('ផ្អែកតាម GDT — ពន្ធលើប្រាក់ខែ (ប្រចាំខែ KHR) — ដាក់ស្នើមុន ថ្ងៃ ២០ ខែបន្ទាប់',
              'Based on GDT salary tax brackets (monthly KHR) — file by 20th of following month via eTax')}
        </div>
      </Card>

      {/* NSSF reference */}
      <Card label={tr('ការចំណែក NSSF','NSSF CONTRIBUTION RATES')}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            { lkm:'ថ្នាក់ស្ថាប័ន (Employer)', len:'Employer Contributions', items:[
              { k:'ORC (ហានិភ័យការងារ)', e:'Occupational Risk', r:'0.8%', c:'#8E5223' },
              { k:'សុខភាព (Health)', e:'Healthcare', r:'1.3%', c:'#1A6B3C' },
              { k:'សោធននិវត្តន៍ (Pension)', e:'Pension', r:'2.0%', c:'#5B2EA0' },
              { k:'សរុប Total', e:'Total', r:'4.1%', c:'#2A5DB0', bold:true },
            ]},
            { lkm:'ថ្នាក់និយោជិត (Employee)', len:'Employee Contributions', items:[
              { k:'សោធននិវត្តន៍ (Pension)', e:'Pension', r:'2.0%', c:'#5B2EA0' },
            ]},
          ].map((col,ci)=>(
            <div key={ci} style={{background:'var(--surface-muted)',borderRadius:8,padding:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--ink-3)',marginBottom:8}}>{lang==='km'?col.lkm:col.len}</div>
              {col.items.map((item,ii)=>(
                <div key={ii} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderTop:ii?'1px solid var(--border)':'none'}}>
                  <span style={{fontSize:12,fontWeight:item.bold?700:400}}>{lang==='km'?item.k:item.e}</span>
                  <span style={{fontSize:12,fontWeight:700,color:item.c}}>{item.r}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{marginTop:8,fontSize:11,color:'var(--ink-3)'}}>
          {tr(`ដំណើរការ: Cap ${fmtKHR(NSSF_CAP_KHR)}/ខែ · ដាក់ស្នើ: ថ្ងៃ ១៥ ខែបន្ទាប់`,
              `Cap: ${fmtKHR(NSSF_CAP_KHR)}/month · Due: 15th of following month`)}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tab: Tax
// ═══════════════════════════════════════════════════════════════════════════
const FTaxTab = ({ revenue, lang, tr }) => {
  const [month, setMonth] = React.useState(currMonth());
  const y = parseInt(month.split('-')[0]);
  const m = parseInt(month.split('-')[1]);

  const vat     = Math.round(revenue * 0.10 * 100)/100;
  const prepay  = Math.round(revenue * 0.01 * 100)/100;
  const whtTotal= (window.__staffData||[]).reduce((a,s)=>{
    const g=s.salaryType==='hourly'?(s.salary||0)*(s.hours||40)*4:(s.salary||0);
    return a+Math.round(calcSalaryTax(Math.round(g*USD_KHR))/USD_KHR*100)/100;
  },0);
  const annualTOI = Math.round(revenue * 0.20 * 100)/100;

  const nextMo  = m%12+1;
  const nextY   = m===12?y+1:y;
  const due20   = `20 ${MONTHS_EN[nextMo-1]} ${nextY}`;

  const OBLIGATIONS = [
    { km:'VAT (អាករ)', en:'VAT', rate:'10%', base:fmtFull(revenue), amt:fmtFull(vat), due:due20, form:'VAT 001', tone:'accent' },
    { km:'ប្រាក់មុន TOI', en:'Prepayment TOI', rate:'1%', base:fmtFull(revenue), amt:fmtFull(prepay), due:due20, form:'PT 001', tone:'warn' },
    { km:'ពន្ធប្រាក់ខែ WHT', en:'Salary WHT', rate:'Tiered', base:fmtFull(staffExpense()), amt:fmtFull(whtTotal), due:due20, form:'SRT 001', tone:'warn' },
    { km:'ពន្ធកាត់ទុក WHT (ដៃគូ)', en:'WHT on Services', rate:'15%', base:'—', amt:'—', due:due20, form:'WTH 001', tone:'neutral' },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Field label={tr('ខែ','Reference Month')} style={{margin:0}}>
          <Input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{width:160}}/>
        </Field>
        <div style={{marginTop:20}}>
          <Btn kind="ghost" size="md" icon={<Icon name="download" size={14}/>} onClick={()=>generateMonthlyTaxPDF(month)}>
            {tr('ប្រកាសពន្ធ PDF','Tax Declaration PDF')}
          </Btn>
        </div>
      </div>

      {/* Monthly obligations */}
      <Card label={tr('ពន្ធប្រចាំខែ (ដំណើរការ ថ្ងៃ ២០)','MONTHLY TAX OBLIGATIONS — Due by 20th')}>
        {OBLIGATIONS.map((ob,i)=>{
          const tc = ob.tone==='accent'?'var(--accent)':ob.tone==='warn'?'var(--warn)':'var(--ink-3)';
          const tb = ob.tone==='accent'?'var(--accent-soft)':ob.tone==='warn'?'#FFF4E5':'var(--surface-muted)';
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderTop:i?'1px solid var(--border)':'none'}}>
              <div style={{width:40,height:40,borderRadius:10,background:tb,display:'flex',alignItems:'center',justifyContent:'center',color:tc,fontWeight:800,fontSize:12,flexShrink:0}}>{ob.rate}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500}}>{lang==='km'?ob.km:ob.en}</div>
                <div style={{fontSize:11,color:'var(--ink-3)'}}>{tr('ទម្រង់','Form')}: {ob.form} · {tr('មូលដ្ឋាន','Base')}: {ob.base} · {tr('ផុតកំណត់','Due')}: {ob.due}</div>
              </div>
              <div style={{fontWeight:700,fontSize:14,color:tc,fontFamily:'"JetBrains Mono",monospace'}}>{ob.amt}</div>
            </div>
          );
        })}
      </Card>

      {/* Annual obligations */}
      <Card label={tr('ពន្ធប្រចាំឆ្នាំ (ផុតកំណត់ ៣១ មីនា)','ANNUAL TAX OBLIGATIONS — Due by March 31')}>
        {[
          { km:'ពន្ធលើប្រាក់ចំណេញ (TOI)', en:'Tax on Profit (TOI)', rate:'20%', note:tr(`ប៉ាន់ស្មាន: ${fmtFull(annualTOI)} (ផ្អែកលើចំណូលខែ ${MONTHS_EN[m-1]})`,`Estimate: ${fmtFull(annualTOI)} (based on ${MONTHS_EN[m-1]} revenue)`) },
          { km:'ពន្ធប៉ាតង់', en:'Patent Tax', rate:'Annual', note:tr('~$99 ធុរជននូវ / ~$297 ធុរជនមធ្យម — ចុះបញ្ជីភ្លាម','~$99 small / ~$297 medium enterprise — register annually') },
          { km:'របាយការណ៍ហិរញ្ញវត្ថុ', en:'Audited Financial Statements', rate:'—', note:tr('ដាក់ជូន GDT ដោយ ៣១ មីនា','Submit to GDT by March 31') },
        ].map((row,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 0',borderTop:i?'1px solid var(--border)':'none'}}>
            <div style={{width:44,height:44,borderRadius:10,background:'#F4DEDD',display:'flex',alignItems:'center',justifyContent:'center',color:'#B0413E',fontWeight:700,fontSize:11,flexShrink:0,textAlign:'center',lineHeight:1.2}}>{row.rate}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{lang==='km'?row.km:row.en}</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{row.note}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Filing calendar */}
      <Card label={tr('ប្រតិទិនដាក់ពាក្យ','FILING CALENDAR')}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          {[
            { day:'15', what:tr('NSSF ប្រចាំខែ','NSSF Monthly'), whom:'NSSF', color:'#1A6B3C', bg:'#D4F0E4' },
            { day:'20', what:tr('VAT + ប្រាក់ខែ + ប្រាក់មុន','VAT + Salary Tax + Prepayment'), whom:'GDT eTax', color:'#2A5DB0', bg:'#E5EBF5' },
            { day:'Mar 31', what:tr('ពន្ធប្រចាំឆ្នាំ + ប៉ាតង់','Annual TOI + Patent Tax'), whom:'GDT', color:'#B0413E', bg:'#F4DEDD' },
            { day:'Mar 31', what:tr('របាយការណ៍ហិរញ្ញវត្ថុ','Audited Financial Statements'), whom:'GDT', color:'#5B2EA0', bg:'#E5DAF5' },
          ].map((ev,i)=>(
            <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 12px',background:ev.bg,borderRadius:8}}>
              <div style={{fontWeight:800,fontSize:18,color:ev.color,flexShrink:0,minWidth:40,textAlign:'center',lineHeight:1}}>{ev.day}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:ev.color}}>{ev.what}</div>
                <div style={{fontSize:10,color:'var(--ink-3)',marginTop:2}}>{ev.whom}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tab: Documents
// ═══════════════════════════════════════════════════════════════════════════
const FDocumentsTab = ({ lang, tr }) => {
  const [month, setMonth] = React.useState(currMonth());

  // VAT Invoice form state
  const [invNo,    setInvNo]    = React.useState('INV-' + new Date().getFullYear() + '-001');
  const [invDate,  setInvDate]  = React.useState(new Date().toISOString().slice(0,10));
  const [invName,  setInvName]  = React.useState('');
  const [invTIN,   setInvTIN]   = React.useState('');
  const [invDesc,  setInvDesc]  = React.useState(tr('ថ្លៃបង្រៀនបើកបរ','Driving school tuition'));
  const [invAmt,   setInvAmt]   = React.useState('');
  const [invNotes, setInvNotes] = React.useState('');

  // Petty cash state
  const [pcNo,   setPcNo]   = React.useState('PC-001');
  const [pcDate, setPcDate] = React.useState(new Date().toISOString().slice(0,10));
  const [pcTo,   setPcTo]   = React.useState('');
  const [pcPurp, setPcPurp] = React.useState('');
  const [pcAmt,  setPcAmt]  = React.useState('');

  const DocBtn = ({ icon, title, sub, onClick }) => (
    <div onClick={onClick} style={{
      display:'flex',alignItems:'center',gap:12,padding:'14px 16px',
      background:'var(--surface-muted)',borderRadius:10,cursor:'pointer',
      border:'1px solid transparent',transition:'border .15s',
    }}
      onMouseEnter={e=>e.currentTarget.style.border='1px solid var(--accent)'}
      onMouseLeave={e=>e.currentTarget.style.border='1px solid transparent'}
    >
      <div style={{width:40,height:40,borderRadius:10,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)',flexShrink:0,fontSize:18}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600}}>{title}</div>
        <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{sub}</div>
      </div>
      <Icon name="download" size={14} style={{color:'var(--ink-3)'}}/>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Field label={tr('ខែ','Month')} style={{margin:0}}>
          <Input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{width:160}}/>
        </Field>
      </div>

      {/* Quick-generate monthly docs */}
      <FSec label={tr('ឯកសារប្រចាំខែ','MONTHLY DOCUMENTS')}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <DocBtn icon="📋" title={tr('ប្រកាសពន្ធប្រចាំខែ','Monthly Tax Declaration (GDT)')} sub={tr('VAT 001 + PT 001 + SRT 001 — ផុតកំណត់ ថ្ងៃ ២០','VAT 001 + PT 001 + SRT 001 — Due by 20th')} onClick={()=>generateMonthlyTaxPDF(month)}/>
          <DocBtn icon="👥" title={tr('ទំរង់ប្រាក់ខែ','Payroll Sheet')} sub={tr('ប្រាក់ខែ + NSSF + WHT + ប្រាក់ស្ទុះ','Gross + NSSF + WHT + Net Pay')} onClick={()=>generatePayrollPDF(month)}/>
          <DocBtn icon="🏛" title={tr('របាយការណ៍ NSSF ប្រចាំខែ','NSSF Monthly Report')} sub={tr('ការចំណែករបស់ស្ថាប័ន + និយោជិត — ផុតកំណត់ ថ្ងៃ ១៥','Employer + Employee contributions — Due by 15th')} onClick={()=>generateNSSFReportPDF(month)}/>
        </div>
      </FSec>

      <Divider/>

      {/* VAT Invoice */}
      <FSec label={tr('វិក្កយបត្រ VAT','VAT INVOICE GENERATOR')}>
        <Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Field label={tr('លេខវិក្កយបត្រ','Invoice No')}>
              <Input value={invNo} onChange={e=>setInvNo(e.target.value)}/>
            </Field>
            <Field label={tr('ថ្ងៃខែ','Date')}>
              <Input type="date" value={invDate} onChange={e=>setInvDate(e.target.value)}/>
            </Field>
            <Field label={tr('ឈ្មោះអតិថិជន','Customer Name')}>
              <Input value={invName} onChange={e=>setInvName(e.target.value)} placeholder={tr('ឈ្មោះ...','Name...')}/>
            </Field>
            <Field label={tr('TIN អតិថិជន (ប្រសិនបើមាន)','Customer TIN (optional)')}>
              <Input value={invTIN} onChange={e=>setInvTIN(e.target.value)} placeholder="TIN..."/>
            </Field>
            <Field label={tr('ការពិពណ៌នា','Description')}>
              <Input value={invDesc} onChange={e=>setInvDesc(e.target.value)}/>
            </Field>
            <Field label={tr('ចំនួន ($)','Amount ($)')}>
              <Input type="number" value={invAmt} onChange={e=>setInvAmt(e.target.value)} placeholder="0.00" min="0" step="0.01"/>
            </Field>
            <Field label={tr('ចំណាំ','Notes')} style={{gridColumn:'1/-1'}}>
              <Input value={invNotes} onChange={e=>setInvNotes(e.target.value)} placeholder={tr('ចំណាំ...','Optional notes...')}/>
            </Field>
          </div>
          {invAmt && (
            <div style={{marginTop:8,padding:'8px 12px',background:'var(--accent-soft)',borderRadius:6,fontSize:12}}>
              Pre-tax: <b>{fmtFull(parseFloat(invAmt)||0)}</b> · VAT 10%: <b>{fmtFull(Math.round((parseFloat(invAmt)||0)*0.10*100)/100)}</b> · Total: <b>{fmtFull(Math.round((parseFloat(invAmt)||0)*1.10*100)/100)}</b>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
            <Btn kind="primary" size="md" icon={<Icon name="download" size={14}/>} onClick={()=>generateVATInvoice({
              invoiceNo:invNo, date:invDate, customerName:invName||'—', customerTIN:invTIN,
              items:[{desc:invDesc||tr('ថ្លៃបង្រៀន','Tuition'),qty:1,price:parseFloat(invAmt)||0}],
              notes:invNotes,
            })}>
              {tr('បង្កើត PDF','Generate PDF')}
            </Btn>
          </div>
        </Card>
      </FSec>

      <Divider/>

      {/* Petty Cash */}
      <FSec label={tr('វាក្យបត្រសាច់ប្រាក់','PETTY CASH VOUCHER')}>
        <Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Field label={tr('លេខ','Voucher No')}>
              <Input value={pcNo} onChange={e=>setPcNo(e.target.value)}/>
            </Field>
            <Field label={tr('ថ្ងៃខែ','Date')}>
              <Input type="date" value={pcDate} onChange={e=>setPcDate(e.target.value)}/>
            </Field>
            <Field label={tr('បង់ឱ្យ','Pay to')}>
              <Input value={pcTo} onChange={e=>setPcTo(e.target.value)} placeholder={tr('ឈ្មោះ...','Name...')}/>
            </Field>
            <Field label={tr('ចំនួន ($)','Amount ($)')}>
              <Input type="number" value={pcAmt} onChange={e=>setPcAmt(e.target.value)} placeholder="0.00" min="0" step="0.01"/>
            </Field>
            <Field label={tr('គោលបំណង','Purpose')} style={{gridColumn:'1/-1'}}>
              <Input value={pcPurp} onChange={e=>setPcPurp(e.target.value)} placeholder={tr('គោលបំណង...','Purpose...')}/>
            </Field>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
            <Btn kind="primary" size="md" icon={<Icon name="download" size={14}/>} onClick={()=>generatePettyCash({voucherNo:pcNo,date:pcDate,payTo:pcTo||'—',purpose:pcPurp||'—',amount:pcAmt||0})}>
              {tr('បង្កើត PDF','Generate PDF')}
            </Btn>
          </div>
        </Card>
      </FSec>

      {/* Legal info strip */}
      <div style={{padding:'12px 16px',background:'#E5EBF5',borderRadius:8,fontSize:11,color:'#2A5DB0',lineHeight:1.7}}>
        <b>{tr('ព័ត៌មានអំពីច្បាប់ពន្ធ (GDT Cambodia)','Cambodia Tax Reference (GDT)')}</b><br/>
        {tr(
          'VAT 10% · ប្រាក់មុន TOI 1% · ពន្ធប្រាក់ខែ Tiered · ពន្ធប្រចាំឆ្នាំ TOI 20% · ប៉ាតង់ $99–$297/ឆ្នាំ',
          'VAT 10% · Prepayment TOI 1% · Salary Tax tiered 0–20% · Annual TOI 20% · Patent Tax $99–$297/yr'
        )}<br/>
        {tr(
          'ដំណើរការតាមរយៈ GDT eTax Portal: etax.tax.gov.kh',
          'File via GDT eTax Portal: etax.tax.gov.kh · NSSF: nssf.gov.kh'
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Add Income / Expense forms (module-level, used by tabs)
// ═══════════════════════════════════════════════════════════════════════════
const AddIncomeForm = ({ onSave, onCancel }) => {
  const { toast, tr } = useAppActions();
  const [cat, setCat]    = React.useState('tuition');
  const [desc, setDesc]  = React.useState('');
  const [amount, setAmt] = React.useState('');
  const [date, setDate]  = React.useState(new Date().toISOString().slice(0,10));
  const save = () => {
    if (!amount || isNaN(parseFloat(amount))) { toast(tr('សូមបំពេញចំនួនទឹកប្រាក់','Enter amount'),'warn'); return; }
    if (!window.__incomeLog) window.__incomeLog = [];
    const nums = window.__incomeLog.map(e=>parseInt((e.id||'').replace(/\D/g,''))).filter(n=>!isNaN(n)&&n>0);
    const next = (nums.length>0?Math.max(...nums):0)+1;
    window.__incomeLog.unshift({ id:'IN-'+String(next).padStart(3,'0'), cat, desc:desc.trim()||tr(incMeta(cat).km,incMeta(cat).en), amount:parseFloat(amount), date });
    if (window.saveAllData) window.saveAllData();
    toast(tr('បានបន្ថែមចំណូល','Income added'),'good');
    onSave();
  };
  return (
    <div style={{background:'var(--surface-muted)',borderRadius:10,padding:16,display:'flex',flexDirection:'column',gap:10}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace'}}>+ {tr('ចំណូលថ្មី','NEW INCOME')}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Field label={tr('ប្រភេទ','Category')}><Select value={cat} onChange={e=>setCat(e.target.value)}>{INC_CATS.map(c=><option key={c.v} value={c.v}>{tr(c.km,c.en)}</option>)}</Select></Field>
        <Field label={tr('ចំនួន ($)','Amount ($)')}><Input type="number" value={amount} onChange={e=>setAmt(e.target.value)} placeholder="0.00" min="0" step="0.01"/></Field>
        <Field label={tr('ថ្ងៃខែ','Date')}><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label={tr('ការពិពណ៌នា','Description')}><Input value={desc} onChange={e=>setDesc(e.target.value)} placeholder={tr('ចំណាំ...','Note...')}/></Field>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" size="sm" onClick={onCancel}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={save}>{tr('រក្សាទុក','Save')}</Btn>
      </div>
    </div>
  );
};

const AddExpenseForm = ({ onSave, onCancel }) => {
  const { toast, tr } = useAppActions();
  const [cat, setCat]    = React.useState('other');
  const [desc, setDesc]  = React.useState('');
  const [amount, setAmt] = React.useState('');
  const [date, setDate]  = React.useState(new Date().toISOString().slice(0,10));
  const save = () => {
    if (!amount || isNaN(parseFloat(amount))) { toast(tr('សូមបំពេញចំនួនទឹកប្រាក់','Enter amount'),'warn'); return; }
    if (!window.__expenseLog) window.__expenseLog = [];
    const nums = window.__expenseLog.map(e=>parseInt((e.id||'').replace(/\D/g,''))).filter(n=>!isNaN(n)&&n>0);
    const next = (nums.length>0?Math.max(...nums):0)+1;
    window.__expenseLog.unshift({ id:'EX-'+String(next).padStart(3,'0'), cat, desc:desc.trim()||tr(catMeta(cat).km,catMeta(cat).en), amount:parseFloat(amount), date });
    if (window.saveAllData) window.saveAllData();
    if (window.__notifyFinanceChanged) window.__notifyFinanceChanged();
    toast(tr('បានបន្ថែមចំណាយ','Expense added'),'good');
    onSave();
  };
  return (
    <div style={{background:'var(--surface-muted)',borderRadius:10,padding:16,display:'flex',flexDirection:'column',gap:10}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace'}}>+ {tr('ចំណាយថ្មី','NEW EXPENSE')}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <Field label={tr('ប្រភេទ','Category')}><Select value={cat} onChange={e=>setCat(e.target.value)}>{EXP_CATS.map(c=><option key={c.v} value={c.v}>{tr(c.km,c.en)}</option>)}</Select></Field>
        <Field label={tr('ចំនួន ($)','Amount ($)')}><Input type="number" value={amount} onChange={e=>setAmt(e.target.value)} placeholder="0.00" min="0" step="0.01"/></Field>
        <Field label={tr('ថ្ងៃខែ','Date')}><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label={tr('ការពិពណ៌នា','Description')}><Input value={desc} onChange={e=>setDesc(e.target.value)} placeholder={tr('ចំណាំ...','Note...')}/></Field>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" size="sm" onClick={onCancel}>{tr('បោះបង់','Cancel')}</Btn>
        <Btn kind="primary" size="sm" icon={<Icon name="check" size={13}/>} onClick={save}>{tr('រក្សាទុក','Save')}</Btn>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Main FinanceScreen
// ═══════════════════════════════════════════════════════════════════════════
const FinanceScreen = ({ role = 'admin' }) => {
  const { toast, tr, lang } = useAppActions();
  const [, forceUpdate] = React.useReducer(x=>x+1, 0);
  const [tab, setTab]   = React.useState('overview');

  React.useEffect(() => {
    if (!window.__expenseLog) window.__expenseLog = [];
    if (!window.__incomeLog)  window.__incomeLog  = [];
    const prev = window.__notifyFinanceChanged;
    window.__notifyFinanceChanged = () => forceUpdate();
    return () => { window.__notifyFinanceChanged = prev; };
  }, []);

  const revenue  = calcRevenue();
  const salaries = staffExpense();
  const maint    = maintExpense();
  const other    = otherExpense();
  const expenses = salaries + maint + other;
  const profit   = revenue - expenses;
  const margin   = revenue > 0 ? Math.round((profit/revenue)*100) : 0;

  const TABS = [
    { id:'overview',  km:'ទិដ្ឋភាពរួម', en:'Overview'  },
    { id:'revenue',   km:'ចំណូល',        en:'Revenue'   },
    { id:'expenses',  km:'ចំណាយ',        en:'Expenses'  },
    { id:'payroll',   km:'ប្រាក់ខែ',     en:'Payroll'   },
    { id:'tax',       km:'ពន្ធ',          en:'Tax'       },
    { id:'documents', km:'ឯកសារ',        en:'Documents' },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle km="គ្រប់គ្រងហិរញ្ញវត្ថុ" en="Finance Management"/>

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[
          { lkm:'ចំណូលសរុប', len:'REVENUE', v:fmtUSD(revenue), tone:'accent' },
          { lkm:'ចំណាយសរុប', len:'EXPENSES', v:fmtUSD(expenses), tone:'warn' },
          { lkm:'ចំណេញសុទ្ធ', len:'NET PROFIT', v:`${fmtUSD(profit)} (${margin}%)`, tone:profit>=0?'good':'danger' },
        ].map(k=>{
          const tc = k.tone==='good'?'var(--good)':k.tone==='danger'?'var(--danger)':k.tone==='warn'?'var(--warn)':'var(--accent)';
          const tb = k.tone==='good'?'#E5F0EA':k.tone==='danger'?'#F4DEDD':k.tone==='warn'?'#FFF4E5':'var(--accent-soft)';
          return (
            <div key={k.len} style={{padding:'10px 14px',background:tb,borderRadius:10,display:'flex',flexDirection:'column',gap:3}}>
              <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',fontFamily:'"JetBrains Mono",monospace'}}>{lang==='km'?k.lkm:k.len}</div>
              <div style={{fontSize:20,fontWeight:700,color:tc}}>{k.v}</div>
            </div>
          );
        })}
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:2,borderBottom:'1px solid var(--border)'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 14px',border:'none',background:'transparent',cursor:'pointer',
            fontFamily:'var(--font-km),var(--font-en),sans-serif',fontSize:13,fontWeight:500,
            borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,
            color:tab===t.id?'var(--accent)':'var(--ink-3)',marginBottom:-1,whiteSpace:'nowrap',
          }}>{lang==='km'?t.km:t.en}</button>
        ))}
      </div>

      {tab==='overview'  && <FOverviewTab revenue={revenue} expenses={expenses} profit={profit} margin={margin} salaries={salaries} maint={maint} other={other} lang={lang} tr={tr}/>}
      {tab==='revenue'   && <FRevenueTab  lang={lang} tr={tr} forceUpdate={forceUpdate}/>}
      {tab==='expenses'  && <FExpensesTab salaries={salaries} maint={maint} lang={lang} tr={tr} forceUpdate={forceUpdate}/>}
      {tab==='payroll'   && <FPayrollTab  lang={lang} tr={tr}/>}
      {tab==='tax'       && <FTaxTab      revenue={revenue} lang={lang} tr={tr}/>}
      {tab==='documents' && <FDocumentsTab lang={lang} tr={tr}/>}
    </div>
  );
};

Object.assign(window, { FinanceScreen });
