// widgets.jsx — Reusable UI infra: Modal, Drawer, Toast, ConfirmDialog,
// Dropdown, Tooltip + AppActions context for global toasts/forms/details/nav.

// ── Modal — center overlay ─────────────────────────────────────────────────
const Modal = ({ open, onClose, children, width = 520 }) => {
  useBackHandler(!!open, () => onClose?.());
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div onMouseDown={onClose} style={{
      position:'fixed', inset:0, zIndex:9000,
      background:'rgba(20,20,18,.4)', backdropFilter:'blur(2px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, animation:'fadeIn .15s ease',
    }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background:'var(--surface)', borderRadius:14,
        width, maxWidth:'100%', maxHeight:'85vh', overflow:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,.25), 0 0 0 1px var(--border)',
        animation:'modalPop .18s cubic-bezier(.2,.8,.3,1)',
      }}>{children}</div>
    </div>,
    document.body
  );
};

// ── FormModal — centered form dialog with header ────────────────────────────
const FormModal = ({ open, onClose, title, subtitle, children, width = 640, dark = false }) => {
  useBackHandler(!!open, () => onClose?.());
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const darkBg     = '#0E1829';
  const darkBorder = 'rgba(100,160,220,0.18)';
  const isMobile = window.innerWidth < 700;
  return ReactDOM.createPortal(
    <div onMouseDown={onClose} style={{
      position:'fixed', inset:0, zIndex:9000,
      background: dark ? 'rgba(4,8,18,.72)' : 'rgba(20,20,18,.5)',
      backdropFilter:'blur(4px)',
      display:'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent:'center',
      padding: isMobile ? 0 : '24px 20px',
      animation:'fadeIn .15s ease',
    }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background: dark ? darkBg : 'var(--surface)',
        borderRadius: isMobile ? '18px 18px 0 0' : 18,
        width: isMobile ? '100%' : width,
        maxWidth: isMobile ? '100%' : '96vw',
        maxHeight: isMobile ? '94vh' : '92vh',
        display:'flex', flexDirection:'column',
        boxShadow: dark
          ? `0 40px 100px rgba(0,0,0,.7), 0 0 0 1px ${darkBorder}`
          : '0 40px 100px rgba(0,0,0,.32), 0 0 0 1px var(--border)',
        animation:'modalPop .2s cubic-bezier(.2,.8,.3,1)',
      }}>
        {/* Header — hidden in dark mode (form provides its own header) */}
        {!dark && (
          <div style={{
            padding: isMobile ? '18px 20px 16px' : '24px 32px 20px',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'flex-start', gap:16, flexShrink:0,
          }}>
            <div style={{flex:1}}>
              {title && <div style={{fontSize: isMobile ? 18 : 22,fontWeight:700,fontFamily:'var(--font-display)',letterSpacing:'-.02em',lineHeight:1.2}}>{title}</div>}
              {subtitle && <div style={{fontSize:13,color:'var(--ink-3)',marginTop:5,fontFamily:'"JetBrains Mono",monospace',letterSpacing:'.04em'}}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{
              width:38,height:38,border:'1px solid var(--border)',
              background:'var(--surface-muted)',borderRadius:10,
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',color:'var(--ink-2)',flexShrink:0,marginTop:-2,
              transition:'background .1s',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--border)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface-muted)'}
              title="បិទ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        )}
        <div style={{flex:1,minHeight:0,overflow:'auto'}}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

// ── Drawer — slide in from right (bottom sheet on mobile) ─────────────────
const Drawer = ({ open, onClose, children, width = 520, title, subtitle }) => {
  useBackHandler(!!open, () => onClose?.());
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const isMobile = window.innerWidth < 700;
  return ReactDOM.createPortal(
    <div onMouseDown={onClose} style={{
      position:'fixed', inset:0, zIndex:9000,
      background:'rgba(20,20,18,.35)',
      display:'flex',
      justifyContent: isMobile ? 'center' : 'flex-end',
      alignItems: isMobile ? 'flex-end' : 'stretch',
      animation:'fadeIn .15s ease',
    }}>
      <div onMouseDown={e => e.stopPropagation()} style={{
        background:'var(--surface)',
        height: isMobile ? 'auto' : '100%',
        maxHeight: isMobile ? '90vh' : '100%',
        width: isMobile ? '100%' : width,
        maxWidth:'94vw', overflow:'auto', display:'flex', flexDirection:'column',
        borderRadius: isMobile ? '18px 18px 0 0' : 0,
        boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,.2)' : '-16px 0 40px rgba(0,0,0,.2)',
        animation:'drawerSlide .22s cubic-bezier(.2,.8,.3,1)',
      }}>
        {isMobile && <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'12px auto 4px',flexShrink:0}}/>}
        {(title || subtitle) && (
          <div style={{
            padding:'18px 24px', borderBottom:'1px solid var(--border)',
            display:'flex',alignItems:'center',gap:12,flexShrink:0,
          }}>
            <div style={{flex:1,minWidth:0}}>
              {title && <div style={{fontSize:17,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:'-.01em'}}>{title}</div>}
              {subtitle && <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{
              width:32,height:32,border:'1px solid var(--border)',
              background:'var(--surface)',borderRadius:8,
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',color:'var(--ink-2)',
            }} title="បិទ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        )}
        <div style={{flex:1,minHeight:0,overflow:'auto'}}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ msg, tone = 'neutral', icon }) => {
  const tones = {
    neutral: { bg:'var(--ink)',     fg:'var(--bg)' },
    good:    { bg:'var(--good)',    fg:'#fff' },
    warn:    { bg:'var(--warn)',    fg:'#fff' },
    danger:  { bg:'var(--danger)',  fg:'#fff' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <div style={{
      background:t.bg, color:t.fg,
      padding:'10px 16px', borderRadius:10,
      display:'flex', alignItems:'center', gap:10,
      fontSize:13, fontWeight:500,
      boxShadow:'0 8px 24px rgba(0,0,0,.18)',
      animation:'toastSlide .25s cubic-bezier(.2,.8,.3,1)',
      maxWidth:420,
    }}>
      {icon && <Icon name={icon} size={15}/>}
      <span>{msg}</span>
    </div>
  );
};

// ── ConfirmDialog ──────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, title, body, confirmText='យល់ព្រម', cancelText='បោះបង់', danger=false, onConfirm, onCancel }) => (
  <Modal open={open} onClose={onCancel} width={420}>
    <div style={{padding:24}}>
      <div style={{fontSize:17,fontWeight:600,marginBottom:8,fontFamily:'var(--font-display)'}}>{title}</div>
      <div style={{fontSize:13,color:'var(--ink-2)',lineHeight:1.5,marginBottom:20}}>{body}</div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <Btn kind="ghost" onClick={onCancel}>{cancelText}</Btn>
        <Btn
          kind={danger?'primary':'accent'}
          onClick={onConfirm}
          style={danger?{background:'var(--danger)',borderColor:'var(--danger)',color:'#fff'}:{}}
        >{confirmText}</Btn>
      </div>
    </div>
  </Modal>
);

// ── Dropdown ───────────────────────────────────────────────────────────────
const Dropdown = ({ trigger, children, align = 'right', width = 240, dropUp = false }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} style={{position:'relative',display:'inline-flex'}}>
      <div onClick={() => setOpen(o => !o)} style={{display:'inline-flex'}}>{trigger}</div>
      {open && (
        <div style={{
          position:'absolute',
          ...(dropUp ? {bottom:'calc(100% + 6px)'} : {top:'calc(100% + 6px)'}),
          [align]: 0,
          background:'var(--surface)',
          border:'1px solid var(--border)',
          borderRadius:10, padding:6, minWidth:width,
          boxShadow:'0 12px 32px rgba(0,0,0,.12)',
          zIndex:8000,
          animation:'fadeIn .12s ease',
        }} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon, children, onClick, danger=false, sub }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:10,
    width:'100%', padding:'8px 10px', textAlign:'left',
    border:'none', background:'transparent',
    borderRadius:6, cursor:'pointer',
    color: danger ? 'var(--danger)' : 'var(--ink)',
    fontSize:13, fontFamily:'inherit',
  }}
  onMouseEnter={e => e.currentTarget.style.background='var(--surface-muted)'}
  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
    {icon && <Icon name={icon} size={14}/>}
    <span style={{flex:1}}>{children}</span>
    {sub && <span style={{fontSize:10,color:'var(--ink-3)',fontFamily:'"JetBrains Mono",monospace'}}>{sub}</span>}
  </button>
);

const MenuDivider = () => (
  <div style={{height:1,background:'var(--border)',margin:'4px 0'}}/>
);

const MenuLabel = ({ children }) => (
  <div style={{
    fontSize:10,letterSpacing:'.08em',color:'var(--ink-3)',
    fontFamily:'"JetBrains Mono",monospace',
    padding:'8px 10px 4px',textTransform:'uppercase',
  }}>{children}</div>
);

// ── Tooltip ────────────────────────────────────────────────────────────────
const Tooltip = ({ text, children, placement = 'top' }) => {
  const [show, setShow] = React.useState(false);
  if (!text) return children;
  const pos = {
    top:    { bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)' },
    bottom: { top:'calc(100% + 6px)',    left:'50%', transform:'translateX(-50%)' },
    left:   { right:'calc(100% + 6px)',  top:'50%',  transform:'translateY(-50%)' },
    right:  { left:'calc(100% + 6px)',   top:'50%',  transform:'translateY(-50%)' },
  }[placement] || {};
  return (
    <span style={{position:'relative',display:'inline-flex'}}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position:'absolute', ...pos,
          background:'var(--ink)', color:'var(--bg)',
          fontSize:11, padding:'4px 8px', borderRadius:6,
          whiteSpace:'nowrap', pointerEvents:'none', zIndex:9999,
          boxShadow:'0 4px 12px rgba(0,0,0,.18)',
        }}>{text}</span>
      )}
    </span>
  );
};

// ── App actions context ───────────────────────────────────────────────────
const AppActionsContext = React.createContext(null);
const useAppActions = () => React.useContext(AppActionsContext) || {};

// ── Animations (inject once) ──────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('anzen-anim')) {
  const s = document.createElement('style');
  s.id = 'anzen-anim';
  s.textContent = `
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes modalPop { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes drawerSlide { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes toastSlide { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
    button[data-clickable]:hover { background: var(--surface-muted) !important; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  Modal, FormModal, Drawer, Toast, ConfirmDialog,
  Dropdown, MenuItem, MenuDivider, MenuLabel,
  Tooltip, AppActionsContext, useAppActions,
});
