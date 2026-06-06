// screens-invoice.jsx — Create-invoice screen with live preview

// Derive live plans from settings; falls back to hard defaults if settings not loaded yet
const getPlans = () => {
  const pricing = window.__schoolSettings?.pricing;
  if (!pricing || !pricing.length) return [
    {id:'plan-1', cls:'B', km:'ស្តង់ដារ', hrs:30, price:180, isExtra:false},
    {id:'plan-2', cls:'B', km:'បន្ថែម',  hrs:40, price:240, isExtra:false},
    {id:'plan-3', cls:'A', km:'ស្តង់ដារ ម៉ូតូ',      hrs:18, price:110, isExtra:false},
    {id:'plan-4', cls:'C', km:'ស្តង់ដារ ឡានដឹក',   hrs:40, price:320, isExtra:false},
    {id:'plan-5', cls:'+', km:'ម៉ោងបន្ថែម', hrs:null, price:20, isExtra:true},
  ];
  return pricing.map(p => ({
    id: `plan-${p.id}`,
    cls: p.cls,
    km: p.km,
    hrs: p.cls === '+' ? null : p.hrs,
    price: p.price,
    isExtra: p.cls === '+',
    inc: p.inc,
  }));
};

const ALL_PAYMENT_METHODS = [
  {id:'ABA',   l:'ABA Mobile',         k:'aba'},
  {id:'Wing',  l:'Wing',               k:'wing'},
  {id:'Cash',  l:'សាច់​ប្រាក់', k:'cash'},
  {id:'Bank',  l:'ផ្ទេរ',       k:'bank'},
  {id:'PiPay', l:'Pi Pay',             k:'pipay'},
  {id:'Card',  l:'Credit card',        k:'card'},
];

const getAddons = () => {
  const addons = window.__schoolSettings?.addons;
  if (!addons || !addons.length) return [
    {id:'ad-1', km:'ការប្រឡងផ្លូវ',         qty:0, price:25},
    {id:'ad-2', km:'មេរៀន​បន្ថែម',        qty:0, price:18},
    {id:'ad-3', km:'ការ​ប្រឡង​សាក​',    qty:0, price:30},
    {id:'ad-4', km:'ឯកសារ permit',        qty:0, price:15},
    {id:'ad-5', km:'សៀវភៅ​សិក្សា',   qty:0, price:8},
  ];
  return addons.map(a => ({
    id: `ad-${a.id}`,
    km: a.km + (a.en ? ' · ' + a.en : ''),
    qty: 0,
    price: a.price,
  }));
};

const NewInvoiceScreen = ({ studentId: initStudentId }) => {
  const { toast, navigate, settingsVersion, tr } = useAppActions();
  const bp = useBreakpoint();

  // Re-derive from settings on every settingsVersion bump
  const ss = window.__schoolSettings || {};
  const plans = getPlans();
  const enabledPMs = ss.payments || {};
  const paymentMethods = ALL_PAYMENT_METHODS.filter(m => enabledPMs[m.k] !== false);

  const [studentId, setStudentId] = React.useState(initStudentId || STUDENTS[0]?.id || 'S-1042');
  const [planId, setPlanId] = React.useState(() => plans[0]?.id || 'plan-1');
  const [discountPct, setDiscountPct] = React.useState(0);
  const [extraHours, setExtraHours] = React.useState(0);
  const [taxPct, setTaxPct] = React.useState(() => parseInt(ss.vat) || 10);
  const [paymentMethod, setPaymentMethod] = React.useState(() => paymentMethods[0]?.id || 'ABA');
  const [paymentTerm, setPaymentTerm] = React.useState('on-receipt');

  // Stable invoice ID for this session
  const [invId] = React.useState(() => 'INV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4));

  // Sync VAT rate when settings change
  React.useEffect(() => {
    setTaxPct(parseInt(window.__schoolSettings?.vat) || 10);
  }, [settingsVersion]);

  // If selected plan was deleted from settings, reset to first
  React.useEffect(() => {
    const currentPlans = getPlans();
    if (currentPlans.length > 0 && !currentPlans.find(p => p.id === planId)) {
      setPlanId(currentPlans[0].id);
    }
  }, [settingsVersion]);
  const [issueDate] = React.useState('មិថុនា 1, 2026');
  const [dueDate] = React.useState('មិថុនា 15, 2026');
  const [notes, setNotes] = React.useState('សូមអរគុណចំពោះការជឿទុកចិត្ត។ Welcome to Anzen!');
  const [addons, setAddons] = React.useState(() => getAddons());

  // Re-derive add-ons when Settings change
  React.useEffect(() => {
    setAddons(getAddons());
  }, [settingsVersion]);
  const [installments, setInstallments] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [savedDraft, setSavedDraft] = React.useState(false);

  const student = studentById(studentId);
  const plan = plans.find(p => p.id === planId) || plans[0];
  if (!plan) return <div style={{padding:40,textAlign:'center',color:'var(--ink-3)'}}>ថ្លៃ​សិក្សា​មិន​ទាន់​​​​​កំណត់ · No pricing plans configured in Settings</div>;
  const isExtraInvoice = !!plan.isExtra;
  const EXTRA_HOUR_PRICE = plan.price;

  const planLine = isExtraInvoice
    ? { id:'extra', km:'ម៉ោងបន្ថែម', sub:`${extraHours} × $${EXTRA_HOUR_PRICE} / ម៉ោង · per hour`, qty: extraHours, price: EXTRA_HOUR_PRICE }
    : { id: plan.id, km: `Class ${plan.cls} · ${plan.km}`, sub: `${plan.hrs} ម៉ោងបង្រៀន`, qty: 1, price: plan.price };
  const lines = [planLine, ...addons.filter(a => a.qty > 0)];
  const subtotal    = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const discountAmt = Math.round(subtotal * discountPct / 100);
  const taxBase     = subtotal - discountAmt;
  const taxAmt      = Math.round(taxBase * taxPct / 100);
  const total       = taxBase + taxAmt;

  const setAddonQty = (id, qty) =>
    setAddons(addons.map(a => a.id === id ? {...a, qty: Math.max(0, qty)} : a));

  const handleSend = () => {
    if (!student) { toast('សូម​ជ្រើស​សិស្ស', 'warn'); return; }
    setSent(true);
    const today = new Date().toISOString().slice(0, 10);
    INVOICES && INVOICES.push({
      id:           invId,
      student:      studentId,
      name:         student?.name,
      en:           student?.en,
      amount:       total,
      paid:         total,
      due:          dueDate,
      date:         today,
      method:       paymentMethod,
      // full snapshot for PDF regeneration
      _lines:       lines,
      _subtotal:    subtotal,
      _discountAmt: discountAmt,
      _discountPct: discountPct,
      _taxBase:     taxBase,
      _taxAmt:      taxAmt,
      _taxPct:      taxPct,
      _issueDate:   issueDate,
      _dueDate:     dueDate,
      _paymentTerm: paymentTerm,
      _notes:       notes,
      _studentSnap: { name: student?.name, en: student?.en, id: student?.id, phone: student?.phone, cls: student?.cls, photo: student?.photo },
      status:  'Paid',
    });
    const si = STUDENTS.findIndex(s => s.id === studentId);
    if (si !== -1) {
      if (!STUDENTS[si].schoolDocs) STUDENTS[si].schoolDocs = [];
      STUDENTS[si].schoolDocs.push({
        id: invId, type:'invoice', title: invId,
        date: today, amount: total, invId, status:'Paid',
      });
    }
    if (window.saveAllData) window.saveAllData();
    toast(`📨 ${invId} ត្រូវ​បាន​ផ្ញើ​ទៅ ${student?.name} · $${total}`, 'good');
  };

  const printInvoice = () => {
    const snap = {
      invId, isPaid: sent,
      student, ss,
      lines, subtotal, discountAmt, discountPct, taxBase, taxAmt, taxPct, total,
      issueDate, dueDate, paymentTerm, paymentMethod, notes,
    };
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(buildInvoiceHtml(snap));
    w.document.close();
  };

  const handleDraft = () => {
    setSavedDraft(true);
    toast(`💾 Draft ${invId} ត្រូវ​បាន​រក្សា​ទុក`, 'info');
  };

  const handleDiscard = () => {
    if (savedDraft || sent) return;
    setPlanId(plans[0]?.id || 'plan-1');
    setDiscountPct(0);
    setAddons(getAddons());
    setPaymentMethod(paymentMethods[0]?.id || 'ABA');
    setPaymentTerm('on-receipt');
    setInstallments(false);
    setSent(false);
    setSavedDraft(false);
    toast('ការ​ផ្លាស់ប្ដូរ​ត្រូវ​បាន​លុប​ចោល', 'warn');
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <SectionTitle
        km="បង្កើត​វិក្កយបត្រ​ថ្មី"
        en={`Create invoice · ${invId} · ${sent ? 'sent' : 'draft'}`}
        action={
          <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
            <Btn kind="ghost" size="md" onClick={handleDiscard}>{tr('បោះបង់','Discard')}</Btn>
            <Btn kind="ghost" size="md" icon={<Icon name="book" size={14}/>} onClick={handleDraft}>
              {savedDraft ? '✓ Saved draft' : tr('រក្សា​​ជា​ឯកសារ','Save draft')}
            </Btn>
            <Btn kind="ghost" size="md" icon={<Icon name="search" size={14}/>} onClick={printInvoice}>
              PDF · Preview
            </Btn>
            {sent && (
              <Btn kind="ghost" size="md" icon={<Icon name="download" size={14}/>} onClick={printInvoice}
                style={{color:'var(--good)',borderColor:'var(--good)'}}>
                Download PDF
              </Btn>
            )}
            <Btn kind="primary" size="md" icon={<Icon name="arrow" size={14}/>}
              onClick={handleSend} style={sent ? {background:'var(--good)',borderColor:'var(--good)'} : {}}>
              {sent ? '✓ Sent' : tr('ផ្ញើ​​ទៅ​សិស្ស','Send to student')}
            </Btn>
          </div>
        }
      />

      <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1.05fr 1fr',gap:14,alignItems:'start'}}>
        {/* ── LEFT: form ── */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* student */}
          <Card label={tr('សិស្ស','BILL TO')}>
            <div style={{display:'flex',gap:14}}>
              <Photo tag={student?.photo} w={64} h={64} r={999}/>
              <div style={{flex:1}}>
                <div style={{position:'relative'}}>
                  <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{
                    appearance:'none', width:'100%',
                    padding:'10px 32px 10px 12px',
                    background:'var(--surface-muted)',
                    border:'1px solid var(--border)',
                    borderRadius:8, fontSize:14, fontWeight:500, fontFamily:'inherit', color:'var(--ink)',
                    cursor:'default',
                  }}>
                    {STUDENTS.map(s => {
                      const prevCount = INVOICES.filter(inv => inv.student === s.id).length;
                      return (
                        <option key={s.id} value={s.id}>
                          {prevCount > 0 ? `● ` : ''}{s.name} · {s.en} · {s.id}
                        </option>
                      );
                    })}
                  </select>
                  {/* Badge: student has previous invoices */}
                  {(() => {
                    const prevInvs = INVOICES.filter(inv => inv.student === studentId);
                    if (!prevInvs.length) return null;
                    return (
                      <div style={{
                        marginTop:6, padding:'4px 10px', borderRadius:6, fontSize:11,
                        background:'var(--accent-soft)', color:'var(--accent)',
                        border:'1px solid var(--accent)', display:'inline-flex', alignItems:'center', gap:6,
                      }}>
                        <span style={{fontWeight:700}}>●</span>
                        {`បានធ្វើ​វិក្កយបត្រ ${prevInvs.length} ហើយ · ${prevInvs.length} invoice${prevInvs.length>1?'s':''} already sent`}
                      </div>
                    );
                  })()}
                  <Icon name="chev" size={14} style={{position:'absolute',right:12,top:14,transform:'rotate(90deg)',pointerEvents:'none'}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10,fontSize:11,color:'var(--ink-3)'}}>
                  <Row k="ID"        v={student?.id}/>
                  <Row k="ថ្នាក់"    v={student?.cls}/>
                  <Row k="ទូរស័ព្ទ"  v={student?.phone || '+855 12 345 678'}/>
                  <Row k="គ្រូ"      v={student?.inst}/>
                </div>
              </div>
            </div>
          </Card>

          {/* plan picker — live from Settings pricing */}
          <Card label={tr('វគ្គ​សិក្សា','COURSE PLAN')}>
            <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr':'repeat(3,1fr)',gap:8}}>
              {plans.map(p => {
                const sel = planId === p.id;
                return (
                  <button key={p.id} onClick={() => setPlanId(p.id)} style={{
                    padding:14, textAlign:'left',
                    background: sel ? 'var(--accent-soft)' : 'var(--surface)',
                    border: '2px solid ' + (sel ? 'var(--accent)' : 'var(--border)'),
                    borderRadius:10, cursor:'pointer',
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Badge tone={sel?'accent':'neutral'}>{p.isExtra ? '+ ម៉ោង' : `Class ${p.cls}`}</Badge>
                      <span style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.km}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:10}}>
                      <span style={{fontSize:11,color:'var(--ink-3)'}}>{p.isExtra ? 'តាម​ម៉ោង' : `${p.hrs} ម៉ោង · ${p.hrs}h`}</span>
                      <span style={{fontSize:20,fontWeight:600,fontFamily:'var(--font-display)'}}>
                        ${p.price}{p.isExtra && <span style={{fontSize:11,color:'var(--ink-3)',fontWeight:400}}>/h</span>}
                      </span>
                    </div>
                    {p.inc && <div style={{fontSize:10,color:'var(--ink-3)',marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.inc}</div>}
                  </button>
                );
              })}
            </div>

            {isExtraInvoice && (
              <div style={{
                marginTop:14, padding:'14px 16px',
                background:'var(--accent-soft)',
                border:'1px solid var(--accent)',
                borderRadius:10,
              }}>
                <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr auto':'1fr 130px 90px',gap:14,alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--accent)'}}>{tr('កំណត់​ចំនួន​ម៉ោង','Number of hours')}</div>
                    <div style={{fontSize:11,color:'var(--ink-2)',marginTop:2}}>
                      $<b>{EXTRA_HOUR_PRICE}</b> / {tr('ម៉ោង','hr')} · {tr('វិក្កយបត្រ​នេះ​មិន​​រួម​​ថ្លៃ​សិក្សា​ផ្សេង','this invoice excludes other tuition')}
                    </div>
                  </div>
                  <InvStepper value={extraHours} onChange={v => setExtraHours(Math.max(1, v))}/>
                  <div style={{textAlign:'right',fontSize:20,fontWeight:700,fontFamily:'var(--font-display)',fontVariantNumeric:'tabular-nums',color:'var(--accent)'}}>
                    ${extraHours * EXTRA_HOUR_PRICE}
                  </div>
                </div>
                <div style={{marginTop:12,display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginRight:4}}>QUICK</span>
                  {[1,2,5,10,20].map(n => (
                    <button key={n} onClick={() => setExtraHours(n)} style={{
                      padding:'4px 10px',
                      background: extraHours===n ? 'var(--ink)' : 'var(--surface)',
                      color:       extraHours===n ? 'var(--bg)'  : 'var(--ink-2)',
                      border:'1px solid '+(extraHours===n?'var(--ink)':'var(--border)'),
                      borderRadius:999, fontSize:11, fontWeight:500, cursor:'default',
                    }}>{n} ម៉ោង</button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* add-ons */}
          <Card label={tr('ការ​បន្ថែម','ADD-ONS')}>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {addons.map((a, i) => (
                <div key={a.id} style={{
                  display:'grid', gridTemplateColumns:bp.mobile?'1fr 64px 64px':'1fr 90px 90px', gap:bp.mobile?8:12, alignItems:'center',
                  padding:'12px 0', borderTop: i ? '1px dashed var(--border)' : 'none',
                }}>
                  <div>
                    <div style={{fontSize:13,fontWeight:a.qty>0?500:400,color:a.qty>0?'var(--ink)':'var(--ink-2)'}}>{a.km}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2,fontVariantNumeric:'tabular-nums'}}>${a.price} / unit</div>
                  </div>
                  <InvStepper value={a.qty} onChange={v => setAddonQty(a.id, v)}/>
                  <div style={{textAlign:'right',fontSize:14,fontWeight:600,fontVariantNumeric:'tabular-nums',color:a.qty>0?'var(--ink)':'var(--ink-3)'}}>
                    {a.qty>0 ? `$${a.qty * a.price}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* discount + tax + dates */}
          <Card label={tr('តម្លៃ','PRICING & DATES')}>
            <div style={{display:'grid',gridTemplateColumns:bp.mobile?'1fr':'1fr 1fr',gap:14}}>
              <div>
                <InvFieldLabel km="បញ្ចុះ​តម្លៃ" en="Discount"/>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  {[0,5,10,15,20].map(d => (
                    <button key={d} onClick={() => setDiscountPct(d)} style={{
                      flex:1, padding:'8px 0',
                      background: discountPct===d ? 'var(--ink)'          : 'var(--surface-muted)',
                      color:       discountPct===d ? 'var(--bg)'           : 'var(--ink-2)',
                      border:'1px solid '+(discountPct===d?'var(--ink)':'var(--border)'),
                      borderRadius:6, fontSize:12, fontWeight:600, cursor:'default',
                    }}>{d}%</button>
                  ))}
                </div>
                {discountPct>0 && <div style={{marginTop:6,fontSize:11,color:'var(--good)'}}>= −${discountAmt} ត្រូវ​បាន​បញ្ចុះ</div>}
              </div>
              <div>
                <InvFieldLabel km="ពន្ធ VAT · ​អនុវត្តលើ​សុទ្ធ" en="VAT applied to net"/>
                <div style={{display:'flex',gap:6,marginTop:6}}>
                  {/* include settings VAT rate if not already in list */}
                  {[...new Set([0, parseInt(ss.vat)||10, 7, 10, 15])].sort((a,b)=>a-b).map(v => (
                    <button key={v} onClick={() => setTaxPct(v)} style={{
                      flex:1, padding:'8px 0', position:'relative',
                      background: taxPct===v ? 'var(--ink)'         : 'var(--surface-muted)',
                      color:       taxPct===v ? 'var(--bg)'          : 'var(--ink-2)',
                      border:'1px solid '+(taxPct===v?'var(--ink)':'var(--border)'),
                      borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                    }}>
                      {v}%
                      {v === (parseInt(ss.vat)||10) && <span style={{position:'absolute',top:-6,right:-4,fontSize:8,background:'var(--accent)',color:'#fff',borderRadius:99,padding:'1px 3px',fontWeight:700}}>✓</span>}
                    </button>
                  ))}
                </div>
                <div style={{marginTop:6,fontSize:11,color:'var(--ink-3)',textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
                  = +${taxAmt.toFixed(2)} · <span style={{color:'var(--accent)',cursor:'pointer'}} onClick={()=>navigate('settings')}>Settings VAT: {ss.vat||10}%</span>
                </div>
              </div>
              <div>
                <InvFieldLabel km="ថ្ងៃ​​ចេញ​វិក្កយបត្រ" en="Issue date"/>
                <InvDateField value={issueDate}/>
              </div>
              <div>
                <InvFieldLabel km="ថ្ងៃ​​ផុត​កំណត់" en="Due date"/>
                <InvDateField value={dueDate} accent/>
              </div>
            </div>
          </Card>

          {/* payment — filtered by Settings payment methods */}
          <Card label={tr('ការ​ទូទាត់','PAYMENT')}>
            <InvFieldLabel km="វិធីសាស្ត្រ" en="Method"/>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${bp.mobile?Math.min(paymentMethods.length,2):Math.min(paymentMethods.length,4)},1fr)`,gap:6,marginTop:6}}>
              {paymentMethods.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                  padding:'10px 8px',
                  background: paymentMethod===m.id ? 'var(--accent-soft)' : 'var(--surface)',
                  border:'2px solid '+(paymentMethod===m.id?'var(--accent)':'var(--border)'),
                  borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer',
                  color: paymentMethod===m.id ? 'var(--accent)' : 'var(--ink-2)',
                }}>{m.l}</button>
              ))}
            </div>

            <div style={{marginTop:14}}>
              <InvFieldLabel km="លក្ខខណ្ឌ​បង់​ប្រាក់" en="Terms"/>
              <div style={{display:'flex',gap:6,marginTop:6}}>
                {[
                  {id:'on-receipt',   l:tr('បង់​ភ្លាម','On receipt')},
                  {id:'net-7',        l:tr('៧ ថ្ងៃ','Net 7')},
                  {id:'net-15',       l:tr('១៥ ថ្ងៃ','Net 15')},
                  {id:'installments', l:tr('បំ​ណែក','Installments')},
                ].map(t => (
                  <button key={t.id} onClick={() => { setPaymentTerm(t.id); setInstallments(t.id==='installments'); }} style={{
                    flex:1, padding:'8px 4px',
                    background: paymentTerm===t.id ? 'var(--ink)'    : 'var(--surface)',
                    color:       paymentTerm===t.id ? 'var(--bg)'    : 'var(--ink-2)',
                    border:'1px solid '+(paymentTerm===t.id?'var(--ink)':'var(--border)'),
                    borderRadius:6, fontSize:11, fontWeight:500, cursor:'default',
                  }}>{t.l}</button>
                ))}
              </div>
            </div>

            {installments && (
              <div style={{marginTop:14,padding:12,background:'var(--surface-muted)',borderRadius:8}}>
                <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.06em',marginBottom:8}}>{tr('គម្រោង​បំណែក','INSTALLMENT SCHEDULE')}</div>
                {[
                  {n:1, d:'មិថុនា 1',  pct:34, note:tr('ការ​ដំបូង','First')},
                  {n:2, d:'មិថុនា 15', pct:33, note:tr('ការ​ទីពីរ','Second')},
                  {n:3, d:'មិថុនា 29', pct:33, note:tr('ការ​ចុង​ក្រោយ','Final')},
                ].map(p => (
                  <div key={p.n} style={{display:'grid',gridTemplateColumns:'24px 1fr 80px',gap:10,padding:'6px 0',alignItems:'center'}}>
                    <div style={{width:22,height:22,borderRadius:999,background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600}}>{p.n}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:500}}>{p.d}</div>
                      <div style={{fontSize:10,color:'var(--ink-3)'}}>{p.note}</div>
                    </div>
                    <div style={{textAlign:'right',fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>${Math.round(total*p.pct/100)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* notes */}
          <Card label={tr('កំណត់​ចំណាំ​សម្រាប់​សិស្ស','INVOICE NOTES')}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{
                width:'100%', padding:'10px 12px',
                background:'var(--surface-muted)',
                border:'1px solid var(--border)',
                borderRadius:8, fontSize:13, fontFamily:'inherit', color:'var(--ink)',
                resize:'vertical', outline:'none',
              }}
            />
          </Card>
        </div>

        {/* ── RIGHT: live preview (hidden on mobile — use "PDF · Preview") ── */}
        {!bp.mobile && (
        <div style={{position:'sticky',top:12}}>
          <div style={{
            background:'#fff',
            border:'1px solid var(--border)',
            borderRadius:14,
            padding:'40px 42px',
            boxShadow:'0 12px 32px rgba(0,0,0,.06)',
            fontFamily:'var(--font-en), var(--font-km)',
            position:'relative',
            overflow:'hidden',
          }}>
            {/* watermark */}
            {!sent && (
              <div style={{position:'absolute',top:32,right:-46,transform:'rotate(35deg)',padding:'4px 60px',background:'var(--warn)',color:'#fff',fontSize:11,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase'}}>Draft</div>
            )}
            {sent && (
              <div style={{position:'absolute',top:32,right:-46,transform:'rotate(35deg)',padding:'4px 60px',background:'var(--good)',color:'#fff',fontSize:11,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase'}}>Sent</div>
            )}

            {/* header — school info from Settings */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                {ss.logo
                  ? <img src={ss.logo} style={{width:36,height:36,borderRadius:8,objectFit:'cover'}} alt="logo"/>
                  : <Logo size={36}/>
                }
                <div>
                  <div style={{fontSize:16,fontWeight:700,letterSpacing:'-.01em'}}>{ss.name || 'Anzen'}</div>
                  <div style={{fontSize:9,color:'var(--ink-3)',letterSpacing:'.08em'}}>{ss.nameEn || 'DRIVE ACADEMY'}</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em'}}>INVOICE</div>
                <div style={{fontSize:22,fontWeight:700,marginTop:4,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{invId}</div>
              </div>
            </div>

            <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,fontSize:11}}>
              <div>
                <div style={{color:'var(--ink-3)',fontSize:9,letterSpacing:'.08em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>From</div>
                <div style={{marginTop:6,lineHeight:1.5}}>
                  {ss.nameEn || 'Anzen'}<br/>
                  {ss.address || '123 St. Sothearos, Daun Penh'}<br/>
                  Phnom Penh, Cambodia<br/>
                  {ss.phone || '+855 12 345 678'}<br/>
                  Tax ID · {ss.taxId || 'K001-202-014'}
                </div>
              </div>
              <div>
                <div style={{color:'var(--ink-3)',fontSize:9,letterSpacing:'.08em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>Bill to</div>
                <div style={{marginTop:6,lineHeight:1.5}}>
                  <b>{student?.name || '—'}</b><br/>
                  {student?.en}<br/>
                  Student ID · {student?.id}<br/>
                  {student?.phone || ss.phone || '+855 12 345 678'}<br/>
                  Class {student?.cls?.split(' ')[0]}
                </div>
              </div>
              <div>
                <div style={{color:'var(--ink-3)',fontSize:9,letterSpacing:'.08em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>Dates</div>
                <div style={{marginTop:6,lineHeight:1.7}}>
                  Issued · {issueDate}<br/>
                  Due · <b style={{color:'var(--accent)'}}>{dueDate}</b><br/>
                  Terms · {paymentTerm==='on-receipt'?'Due on receipt':paymentTerm==='net-7'?'Net 7':paymentTerm==='net-15'?'Net 15':'Installments (×3)'}<br/>
                  Method · {paymentMethod}
                </div>
              </div>
            </div>

            {/* line items */}
            <div style={{marginTop:22}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 60px 70px 70px',gap:14,padding:'8px 0',borderBottom:'2px solid var(--ink)',fontSize:9,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.08em',color:'var(--ink-2)',textTransform:'uppercase'}}>
                <div>Description</div>
                <div style={{textAlign:'right'}}>Qty</div>
                <div style={{textAlign:'right'}}>Price</div>
                <div style={{textAlign:'right'}}>Total</div>
              </div>
              {lines.map((l, i) => (
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 60px 70px 70px',gap:14,padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:12,alignItems:'baseline'}}>
                  <div>
                    <div style={{fontWeight:500}}>{l.km}</div>
                    {l.sub && <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>{l.sub}</div>}
                  </div>
                  <div style={{textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{l.qty}</div>
                  <div style={{textAlign:'right',fontVariantNumeric:'tabular-nums'}}>${l.price.toFixed(2)}</div>
                  <div style={{textAlign:'right',fontVariantNumeric:'tabular-nums',fontWeight:500}}>${(l.qty * l.price).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* totals */}
            <div style={{marginTop:14,display:'flex',justifyContent:'flex-end'}}>
              <div style={{width:280,fontSize:12}}>
                <InvTot k={tr('តម្លៃ​សរុប','Subtotal')} v={`$${subtotal.toFixed(2)}`}/>
                {discountAmt>0 && <InvTot k={`${tr('បញ្ចុះ​តម្លៃ','Discount')} ${discountPct}%`} v={`−$${discountAmt.toFixed(2)}`} tone="good"/>}
                {discountAmt>0 && <InvTot k={tr('សុទ្ធ','Net')} v={`$${taxBase.toFixed(2)}`}/>}
                <InvTot k={`VAT ${taxPct}% ${tr('ពន្ធ','Tax')}`} v={`+$${taxAmt.toFixed(2)}`}/>
                <div style={{marginTop:10,padding:'14px 0',borderTop:'2px solid var(--ink)',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                  <span style={{fontSize:14,fontWeight:600}}>{tr('សរុប','Total')}</span>
                  <span style={{fontSize:28,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.02em',fontVariantNumeric:'tabular-nums'}}>${total.toFixed(2)}</span>
                </div>
                <div style={{textAlign:'right',fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{ss.currency || 'USD ($)'} · ដុល្លារ​អា​មេ​រិក</div>
              </div>
            </div>

            {/* notes */}
            <div style={{marginTop:24,padding:14,background:'var(--surface-muted)',borderRadius:8}}>
              <div style={{fontSize:9,color:'var(--ink-3)',letterSpacing:'.08em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace',marginBottom:6}}>Notes</div>
              <div style={{fontSize:12,color:'var(--ink-2)',lineHeight:1.5}}>{notes}</div>
            </div>

            {/* footer */}
            <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--ink-3)'}}>
              <span>បង់​ប្រាក់​ · {paymentMethod} · {ss.nameEn || 'Anzen'}</span>
              <span style={{fontFamily:'"JetBrains Mono",monospace'}}>{ss.website || 'anzen.drive'} · page 1/1</span>
            </div>
          </div>

          <div style={{marginTop:14,padding:14,background:'var(--surface-muted)',borderRadius:10,border:'1px dashed var(--border-strong)',display:'flex',alignItems:'center',gap:10,fontSize:12}}>
            <Icon name="bell" size={16}/>
            <div style={{flex:1,color:'var(--ink-2)'}}>
              ​បន្ទាប់​ពី​ផ្ញើ​ វិក្កយបត្រ​នឹង​ត្រូវ​ផ្ញើ​ទៅ​សិស្ស​តាម SMS និង​ Anzen app រួម​ជាមួយ​ links ការ​ទូទាត់​ {paymentMethod}.
            </div>
            <Btn kind="ghost" size="sm" onClick={() => navigate('settings')}>​ Settings</Btn>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

// ── Private helpers (prefixed to avoid collision with other screens) ──────────
const InvFieldLabel = ({ km, en }) => (
  <div style={{fontSize:10,color:'var(--ink-3)',letterSpacing:'.06em',textTransform:'uppercase',fontFamily:'"JetBrains Mono",monospace'}}>
    {km} <span style={{opacity:.7}}>· {en}</span>
  </div>
);

const InvDateField = ({ value, accent }) => (
  <div style={{
    marginTop:6, padding:'10px 12px',
    background:'var(--surface)',
    border:'1px solid '+(accent?'var(--accent)':'var(--border)'),
    borderRadius:8,
    display:'flex', alignItems:'center', gap:8,
    color: accent ? 'var(--accent)' : 'var(--ink)',
  }}>
    <Icon name="cal" size={14}/>
    <span style={{fontSize:13,fontWeight:500}}>{value}</span>
  </div>
);

const InvStepper = ({ value, onChange }) => (
  <div style={{display:'flex',alignItems:'center',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,overflow:'hidden'}}>
    <button onClick={() => onChange(value-1)} disabled={value<=0} style={{
      width:28, height:32, border:'none',
      background:'transparent', cursor:'default',
      color: value<=0 ? 'var(--ink-3)' : 'var(--ink)',
      fontSize:16, fontWeight:600,
    }}>−</button>
    <div style={{flex:1,textAlign:'center',fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums',borderLeft:'1px solid var(--border)',borderRight:'1px solid var(--border)',height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>{value}</div>
    <button onClick={() => onChange(value+1)} style={{
      width:28, height:32, border:'none',
      background:'transparent', cursor:'default',
      fontSize:16, fontWeight:600,
    }}>+</button>
  </div>
);

const InvTot = ({ k, v, tone }) => (
  <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',color:tone==='good'?'var(--good)':'var(--ink-2)'}}>
    <span>{k}</span>
    <span style={{fontVariantNumeric:'tabular-nums',fontWeight:500}}>{v}</span>
  </div>
);

// Alias so app.jsx's `billing: <BillingScreen .../>` still works
// ── Shared invoice HTML builder ───────────────────────────────────────────────
// Called by both the Billing tab (live form) and Students tab (stored snapshot).
// snap = { invId, isPaid, student, ss, lines, subtotal, discountAmt, discountPct,
//           taxBase, taxAmt, taxPct, total, issueDate, dueDate,
//           paymentTerm, paymentMethod, notes }
const buildInvoiceHtml = (snap) => {
  const { invId, isPaid, student: st, ss, lines,
    subtotal, discountAmt, discountPct, taxAmt, taxPct, total,
    issueDate, dueDate, paymentTerm, paymentMethod, notes } = snap;

  const termLabel = paymentTerm==='on-receipt' ? 'Due on receipt'
    : paymentTerm==='net-7' ? 'Net 7'
    : paymentTerm==='net-15' ? 'Net 15'
    : 'Installments (×3)';

  const logoSvg = ss?.logo
    ? `<img src="${ss.logo}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" alt="logo">`
    : `<svg width="40" height="40" viewBox="0 0 32 32"><g transform="translate(16,16)">
        <path d="M0 0 L0 -13 A8 8 0 0 1 7 -7 Z" fill="#2a5db0" opacity=".95"/>
        <path d="M0 0 L13 0 A8 8 0 0 1 7 7 Z"   fill="#2a5db0" opacity=".75"/>
        <path d="M0 0 L0 13 A8 8 0 0 1 -7 7 Z"  fill="#2a5db0" opacity=".55"/>
        <path d="M0 0 L-13 0 A8 8 0 0 1 -7 -7 Z" fill="#2a5db0" opacity=".35"/>
        <circle r="2" fill="#1a1a19"/>
       </g></svg>`;

  const lineRows = (lines||[]).map(l => `
    <div style="display:grid;grid-template-columns:1fr 46px 56px 56px;gap:10px;padding:8px 0;border-bottom:1px solid #e5e5e4;font-size:10px;align-items:baseline;">
      <div><div style="font-weight:500">${l.km||''}</div>${l.sub?`<div style="font-size:9px;color:#888;margin-top:2px">${l.sub}</div>`:''}</div>
      <div style="text-align:right;font-variant-numeric:tabular-nums">${l.qty}</div>
      <div style="text-align:right;font-variant-numeric:tabular-nums">$${Number(l.price).toFixed(2)}</div>
      <div style="text-align:right;font-variant-numeric:tabular-nums;font-weight:500">$${(l.qty*l.price).toFixed(2)}</div>
    </div>`).join('');

  const stampHtml = isPaid
    ? `<div style="position:absolute;bottom:54px;left:4px;pointer-events:none;transform:rotate(-14deg);display:inline-block;">
        <div style="border:3px solid #22c55e;border-radius:6px;padding:5px 16px;color:#22c55e;font-size:18px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;opacity:.55;line-height:1;font-family:'Inter',sans-serif;">PAID</div>
       </div>`
    : `<div style="position:absolute;bottom:54px;left:4px;pointer-events:none;transform:rotate(-14deg);display:inline-block;">
        <div style="border:3px solid #f59e0b;border-radius:6px;padding:5px 16px;color:#f59e0b;font-size:18px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;opacity:.55;line-height:1;font-family:'Inter',sans-serif;">DRAFT</div>
       </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<title>${invId}</title>
<style>
  @page { size:A5; margin:0; }
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { background:#fff; color:#1a1a19; font-family:'Noto Sans Khmer','Inter',sans-serif; }
  body { padding:0 24px 24px; }
  .bar { position:fixed;top:0;left:0;right:0;background:#1a1a19;color:#fff;display:flex;align-items:center;gap:10px;padding:8px 20px;z-index:99; }
  .bar button { background:#2a5db0;color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit; }
  .bar button:hover { background:#3a6dc0; }
  @media print { .bar{display:none!important} body{padding:12mm 14mm} }
</style></head><body>
<div class="bar">
  <button onclick="window.print()">⬇ Download PDF / Print</button>
  <span style="font-size:12px;opacity:.7">${invId} · ${st?.name||''} · $${Number(total).toFixed(2)}</span>
</div>

<div style="margin-top:46px;position:relative;overflow:hidden;font-family:'Noto Sans Khmer','Inter',sans-serif;font-size:11px;">
  ${stampHtml}

  <!-- Header: logo + school / INVOICE + number -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoSvg}
      <div>
        <div style="font-size:13px;font-weight:700;letter-spacing:-.01em;">${ss?.name||'Anzen'}</div>
        <div style="font-size:8px;color:#888;letter-spacing:.08em;">${ss?.nameEn||'DRIVE ACADEMY'}</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:9px;color:#888;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;">INVOICE</div>
      <div style="font-size:17px;font-weight:700;margin-top:3px;letter-spacing:-.01em;">${invId}</div>
    </div>
  </div>

  <!-- Meta: From / Bill to / Dates -->
  <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e5e4;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:9.5px;">
    <div>
      <div style="color:#888;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">From</div>
      <div style="margin-top:6px;line-height:1.5;">
        ${ss?.nameEn||'Anzen'}<br>
        ${ss?.address||'123 St. Sothearos, Daun Penh'}<br>
        Phnom Penh, Cambodia<br>
        ${ss?.phone||'+855 12 345 678'}<br>
        Tax ID · ${ss?.taxId||'K001-202-014'}
      </div>
    </div>
    <div>
      <div style="color:#888;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Bill to</div>
      <div style="margin-top:6px;line-height:1.5;">
        <strong>${st?.name||'—'}</strong><br>
        ${st?.en||''}<br>
        Student ID · ${st?.id||''}<br>
        ${st?.phone||ss?.phone||'+855 12 345 678'}<br>
        Class ${(st?.cls||'B').split(' ')[0]}
      </div>
    </div>
    <div>
      <div style="color:#888;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Dates</div>
      <div style="margin-top:6px;line-height:1.7;">
        Issued · ${issueDate}<br>
        Due · <strong style="color:#2a5db0;">${dueDate}</strong><br>
        Terms · ${termLabel}<br>
        Method · ${paymentMethod}
      </div>
    </div>
  </div>

  <!-- Line items -->
  <div style="margin-top:14px;">
    <div style="display:grid;grid-template-columns:1fr 46px 56px 56px;gap:10px;padding:6px 0;border-bottom:2px solid #1a1a19;font-size:8px;font-family:'JetBrains Mono',monospace;letter-spacing:.08em;color:#666;text-transform:uppercase;">
      <div>Description</div>
      <div style="text-align:right">Qty</div>
      <div style="text-align:right">Price</div>
      <div style="text-align:right">Total</div>
    </div>
    ${lineRows}
  </div>

  <!-- Totals -->
  <div style="margin-top:10px;display:flex;justify-content:flex-end;">
    <div style="width:220px;font-size:10px;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e5e4;"><span>តម្លៃ​សរុប · Subtotal</span><span>$${Number(subtotal).toFixed(2)}</span></div>
      ${discountAmt>0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e5e4;color:#22c55e;"><span>បញ្ចុះ​តម្លៃ ${discountPct}%</span><span>−$${Number(discountAmt).toFixed(2)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e5e5e4;"><span>VAT ${taxPct}% · Tax</span><span>+$${Number(taxAmt).toFixed(2)}</span></div>
      <div style="margin-top:6px;padding:10px 0;border-top:2px solid #1a1a19;display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:11px;font-weight:600;">សរុប · Total</span>
        <span style="font-size:22px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;">$${Number(total).toFixed(2)}</span>
      </div>
      <div style="text-align:right;font-size:8px;color:#888;font-family:'JetBrains Mono',monospace;">${ss?.currency||'USD ($)'} · ដុល្លារ​អា​មេ​រិក</div>
    </div>
  </div>

  <!-- Notes (only if present) -->
  ${notes ? `<div style="margin-top:14px;padding:10px;background:#f5f5f4;border-radius:6px;">
    <div style="font-size:8px;color:#888;letter-spacing:.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:4px;">Notes</div>
    <div style="font-size:10px;color:#555;line-height:1.5;">${notes}</div>
  </div>` : ''}

  <!-- Footer -->
  <div style="margin-top:14px;padding-top:10px;border-top:1px solid #e5e5e4;display:flex;justify-content:space-between;font-size:8px;color:#888;">
    <span>បង់​ប្រាក់​ · ${paymentMethod} · ${ss?.nameEn||'Anzen'}</span>
    <span style="font-family:'JetBrains Mono',monospace;">${ss?.website||'anzen.drive'} · page 1/1</span>
  </div>
</div>
</body></html>`;
};
window.buildInvoiceHtml = buildInvoiceHtml;

const BillingScreen = NewInvoiceScreen;
Object.assign(window, { NewInvoiceScreen, BillingScreen });
