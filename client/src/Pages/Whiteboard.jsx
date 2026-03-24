import { useState, useEffect, useRef, useCallback } from "react";

// ── CSS injected once ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#06080F;--surface:#0C0F1C;--surface2:#121626;
  --blue:#1D4ED8;--blue2:#2563EB;--blue3:#3B82F6;--blue-dim:rgba(37,99,235,.15);
  --text:#E8EEFF;--text2:#5A6A9A;--text3:#2C3560;
  --border:rgba(59,130,246,.1);--red:#EF4444;
  --TW:56px;--TH:50px;--OH:52px;
}
html,body{width:100%;height:100%;overflow:hidden;background:var(--bg);}
body{font-family:'IBM Plex Sans',sans-serif;color:var(--text);font-size:13px;}
::-webkit-scrollbar{display:none;}
.wb-app{display:flex;flex-direction:column;height:100vh;font-family:'IBM Plex Sans',sans-serif;color:var(--text);font-size:13px;background:var(--bg);}
.wb-topbar{height:var(--TH);background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 12px;gap:6px;flex-shrink:0;z-index:20;}
.wb-brand{display:flex;align-items:center;gap:8px;margin-right:4px;}
.wb-brand-mark{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,var(--blue),var(--blue3));display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.wb-brand-mark svg{width:13px;height:13px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.wb-brand-name{font-size:14px;font-weight:700;letter-spacing:-.3px;}
.wb-sep{width:1px;height:22px;background:var(--border);flex-shrink:0;}
.wb-spacer{flex:1;}
.wb-btn{height:30px;padding:0 10px;border-radius:6px;border:none;background:transparent;color:var(--text2);cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;display:flex;align-items:center;gap:5px;transition:background .12s,color .12s;white-space:nowrap;flex-shrink:0;}
.wb-btn:hover{background:rgba(255,255,255,.06);color:var(--text);}
.wb-btn:disabled{opacity:.28;pointer-events:none;}
.wb-btn svg{width:14px;height:14px;flex-shrink:0;}
.wb-btn.danger:hover{background:rgba(239,68,68,.12);color:var(--red);}
.wb-btn.primary{background:var(--blue2);color:#fff;font-weight:600;}
.wb-btn.primary:hover{background:var(--blue3);}
.wb-zoom-cluster{display:flex;align-items:center;background:var(--surface2);border:1px solid var(--border);border-radius:7px;overflow:hidden;flex-shrink:0;}
.wb-zoom-cluster button{width:26px;height:28px;border:none;background:transparent;color:var(--text2);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.wb-zoom-cluster button:hover{background:rgba(255,255,255,.07);color:var(--text);}
.wb-zoom-val{font-size:11px;font-weight:600;color:var(--text2);min-width:42px;text-align:center;cursor:pointer;user-select:none;letter-spacing:.3px;}
.wb-zoom-val:hover{color:var(--text);}
.wb-bg-chips{display:flex;gap:4px;align-items:center;}
.wb-bgchip{width:24px;height:24px;border-radius:5px;cursor:pointer;border:2px solid transparent;transition:border-color .14s;flex-shrink:0;}
.wb-bgchip:hover,.wb-bgchip.on{border-color:var(--blue3);}
.bgc-white{background:#F5F8FF;}
.bgc-grid{background-color:#F5F8FF;background-image:linear-gradient(rgba(30,64,175,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(30,64,175,.12) 1px,transparent 1px);background-size:10px 10px;}
.bgc-dot{background-color:#F5F8FF;background-image:radial-gradient(circle,rgba(30,64,175,.22) 1px,transparent 1px);background-size:10px 10px;}
.bgc-dark{background:#0C1225;}
.wb-workspace{flex:1;display:flex;overflow:hidden;position:relative;}
.wb-toolbar{width:var(--TW);background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:1px;flex-shrink:0;z-index:10;}
.wb-tool{width:38px;height:38px;border-radius:8px;border:none;background:transparent;color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;position:relative;flex-shrink:0;}
.wb-tool:hover{background:rgba(255,255,255,.06);color:var(--text);}
.wb-tool.on{background:var(--blue-dim);color:var(--blue3);}
.wb-tool svg{width:16px;height:16px;pointer-events:none;}
.wb-tsep{width:24px;height:1px;background:var(--border);margin:3px 0;flex-shrink:0;}
.wb-tool::after{content:attr(data-tip);position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:#090C19;color:var(--text);padding:4px 9px;border-radius:5px;font-size:11px;font-weight:500;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .1s;z-index:200;border:1px solid var(--border);}
.wb-tool:hover::after{opacity:1;}
.wb-canvas-wrap{flex:1;position:relative;overflow:hidden;background:repeating-conic-gradient(#0B0F1F 0% 25%,#060810 0% 50%) 0 0/20px 20px;}
.wb-canvas-wrap canvas{position:absolute;top:0;left:0;width:100%;height:100%;display:block;}
#wb-bg-c{z-index:0;}
#wb-main-c{z-index:1;}
#wb-tmp-c{z-index:2;}
.wb-sticky-layer{position:absolute;top:0;left:0;width:0;height:0;z-index:3;transform-origin:0 0;pointer-events:none;}
.wb-optbar{height:var(--OH);background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:10px;flex-shrink:0;}
.wb-olabel{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;flex-shrink:0;}
.wb-palette{display:flex;gap:3px;align-items:center;flex-shrink:0;}
.wb-sw{width:20px;height:20px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:transform .1s,border-color .12s;flex-shrink:0;}
.wb-sw:hover{transform:scale(1.2);}
.wb-sw.on{border-color:#fff;transform:scale(1.1);}
.wb-sw-custom{width:20px;height:20px;border-radius:50%;border:2px dashed var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .12s;position:relative;}
.wb-sw-custom:hover{border-color:var(--text2);}
.wb-sw-custom input{position:absolute;width:100%;height:100%;opacity:0;cursor:pointer;border:none;padding:0;}
.wb-widths{display:flex;gap:3px;flex-shrink:0;}
.wb-wb{width:30px;height:30px;border-radius:6px;border:1.5px solid transparent;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;flex-shrink:0;}
.wb-wb:hover{background:rgba(255,255,255,.05);}
.wb-wb.on{border-color:var(--blue3);background:var(--blue-dim);}
.wb-wl{background:var(--text2);border-radius:99px;}
.wb-wb.on .wb-wl,.wb-wb:hover .wb-wl{background:var(--text);}
.wb-fill-sec,.wb-font-sec{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.wb-fill-sec.hide,.wb-font-sec.hide{display:none!important;}
.wb-ftoggle{width:28px;height:28px;border-radius:6px;border:1.5px solid rgba(255,255,255,.08);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;position:relative;}
.wb-ftoggle:hover{border-color:var(--text2);}
.wb-ftoggle.on{border-color:var(--blue3);background:var(--blue-dim);}
.wb-f-box{width:13px;height:13px;border-radius:2px;border:1.5px solid var(--text2);}
.wb-f-slash{position:absolute;width:20px;height:1.5px;background:var(--red);transform:rotate(45deg);}
.wb-ftoggle.on .wb-f-slash{display:none;}
.wb-ftoggle.on .wb-f-box{border-color:var(--blue3);}
.wb-opa-row{display:flex;align-items:center;gap:6px;flex-shrink:0;}
.wb-opa-row input[type=range]{width:72px;accent-color:var(--blue3);cursor:pointer;}
.wb-opa-num{font-size:11px;color:var(--text2);min-width:28px;text-align:right;}
.wb-fsel{background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:5px;padding:3px 7px;font-size:12px;font-family:inherit;cursor:pointer;outline:none;}
.wb-txt-inp{position:absolute;z-index:20;display:none;background:rgba(255,255,255,0.97);border:2px solid var(--blue3);border-radius:4px;padding:6px 10px;font-family:'IBM Plex Sans',sans-serif;line-height:1.5;outline:none;min-width:140px;min-height:36px;max-width:480px;box-shadow:0 4px 20px rgba(0,0,0,.28);color:#111111;white-space:pre-wrap;word-break:break-word;cursor:text;}
.wb-txt-inp:empty::before{content:attr(data-placeholder);color:#999;pointer-events:none;}
.wb-er-ring{position:fixed;border:2px solid rgba(255,255,255,.75);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);display:none;background:rgba(255,255,255,.04);}
.wb-toast{position:fixed;bottom:66px;left:50%;transform:translateX(-50%) translateY(4px);background:rgba(9,12,25,.96);color:var(--text);padding:6px 14px;border-radius:7px;font-size:12px;font-weight:500;pointer-events:none;opacity:0;transition:all .25s;z-index:9999;border:1px solid var(--border);backdrop-filter:blur(8px);white-space:nowrap;}
.wb-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.wb-sticky{position:absolute;width:175px;min-height:130px;border-radius:2px;box-shadow:2px 4px 18px rgba(0,0,0,.45);display:flex;flex-direction:column;pointer-events:all;}
.wb-s-head{height:22px;background:rgba(0,0,0,.12);border-radius:2px 2px 0 0;display:flex;align-items:center;justify-content:space-between;padding:0 7px;cursor:move;flex-shrink:0;}
.wb-s-dots{display:flex;gap:3px;}
.wb-s-dot{width:4px;height:4px;border-radius:50%;background:rgba(0,0,0,.3);}
.wb-s-del{width:14px;height:14px;border-radius:50%;border:none;background:rgba(0,0,0,.18);color:rgba(0,0,0,.55);font-size:9px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .12s;padding:0;line-height:1;}
.wb-sticky:hover .wb-s-del{opacity:1;}
.wb-s-del:hover{background:rgba(0,0,0,.3);}
.wb-s-ta{flex:1;margin:6px 8px 8px;border:none;background:transparent;font-family:inherit;font-size:12.5px;line-height:1.6;color:rgba(0,0,0,.7);resize:none;outline:none;min-height:90px;}
.wb-s-ta::placeholder{color:rgba(0,0,0,.3);}
.wb-sel-bar{position:fixed;bottom:calc(var(--OH) + 10px);left:50%;transform:translateX(-50%);background:rgba(9,12,25,.96);color:var(--text);padding:5px 12px;border-radius:6px;font-size:11px;font-weight:500;pointer-events:none;z-index:500;border:1px solid var(--blue3);backdrop-filter:blur(8px);}
`;

// ── Constants ──────────────────────────────────────────────────────────────
const COLORS = [
  '#000000','#1C2030','#374151','#6B7280','#D1D5DB','#FFFFFF',
  '#1E3A8A','#1D4ED8','#2563EB','#3B82F6','#60A5FA','#BFDBFE'
];
const STICKY_COLS = ['#FFF9C4','#DBEAFE','#D1FAE5','#FCE7F3','#FEF3C7','#EDE9FE'];
const TOOL_CURSORS = {
  select:'default', pen:'crosshair', highlighter:'crosshair',
  eraser:'none', line:'crosshair', arrow:'crosshair',
  rect:'crosshair', ellipse:'crosshair', triangle:'crosshair',
  text:'text', sticky:'crosshair'
};
const STATUSES = {
  select:'Click to select · Del to delete · Esc to deselect',
  pen:'Drag to draw freehand',
  highlighter:'Drag to highlight',
  eraser:'Drag to erase · Size affects radius',
  line:'Drag to draw a line',
  arrow:'Drag to draw an arrow',
  rect:'Drag to draw a rectangle · Shift = perfect square',
  ellipse:'Drag to draw an ellipse · Shift = perfect circle',
  triangle:'Drag to draw a triangle',
  text:'Click to place text · Ctrl+Enter or Esc to confirm',
  sticky:'Click to place a sticky note',
};
const WIDTH_OPTS = [
  { w: 1, h: '1.5px' }, { w: 2, h: '2px' }, { w: 4, h: '3.5px' },
  { w: 7, h: '5px' }, { w: 12, h: '8px' }, { w: 20, h: '12px' },
];
let _uid = 0;
const uid = () => ++_uid;

// ── Pure rendering helpers ─────────────────────────────────────────────────
function normRect(x, y, w, h) {
  return { x: w < 0 ? x + w : x, y: h < 0 ? y + h : y, w: Math.abs(w), h: Math.abs(h) };
}
function getBounds(el) {
  if (el.type === 'stroke' || el.type === 'hl') {
    if (!el.pts?.length) return null;
    const xs = el.pts.map(p => p.x), ys = el.pts.map(p => p.y);
    const pad = el.sw / 2 + 6;
    return { x: Math.min(...xs)-pad, y: Math.min(...ys)-pad, w: Math.max(...xs)-Math.min(...xs)+pad*2, h: Math.max(...ys)-Math.min(...ys)+pad*2 };
  }
  if (el.type === 'shape') {
    const r = normRect(el.x, el.y, el.w, el.h);
    return { x: r.x, y: r.y, w: Math.max(r.w,4), h: Math.max(r.h,4) };
  }
  if (el.type === 'text') {
    const lc = (el.content||'').split('\n').length;
    return { x: el.x-2, y: el.y-2, w: (el.mw||150)+8, h: el.fs*1.45*lc+8 };
  }
  return null;
}
function hitTest(el, x, y) {
  const b = getBounds(el); if (!b) return false;
  return x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h;
}
function renderStroke(ctx, el) {
  const pts = el.pts; if (!pts?.length) return;
  ctx.save();
  ctx.lineCap='round'; ctx.lineJoin='round';
  if (el.type==='hl') {
    ctx.globalAlpha=0.35; ctx.strokeStyle=el.color; ctx.lineWidth=el.sw*3; ctx.lineCap='square';
  } else {
    ctx.globalAlpha=el.opa??1; ctx.strokeStyle=el.color; ctx.lineWidth=el.sw;
  }
  ctx.beginPath();
  if (pts.length===1) {
    ctx.arc(pts[0].x,pts[0].y,ctx.lineWidth/2,0,Math.PI*2);
    ctx.fillStyle=ctx.strokeStyle; ctx.fill();
  } else {
    ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length-1;i++) {
      const mx2=(pts[i].x+pts[i+1].x)/2, my2=(pts[i].y+pts[i+1].y)/2;
      ctx.quadraticCurveTo(pts[i].x,pts[i].y,mx2,my2);
    }
    ctx.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);
    ctx.stroke();
  }
  ctx.restore();
}
function renderShape(ctx, el) {
  ctx.save();
  ctx.globalAlpha=el.opa??1; ctx.strokeStyle=el.color; ctx.lineWidth=el.sw;
  ctx.lineCap='round'; ctx.lineJoin='round';
  const { x, y, w, h } = normRect(el.x, el.y, el.w, el.h);
  ctx.beginPath();
  if (el.kind==='line') {
    ctx.moveTo(el.x,el.y); ctx.lineTo(el.x+el.w,el.y+el.h); ctx.stroke();
  } else if (el.kind==='arrow') {
    const ax1=el.x,ay1=el.y,ax2=el.x+el.w,ay2=el.y+el.h;
    const ang=Math.atan2(ay2-ay1,ax2-ax1), hl=Math.max(12,el.sw*3.5);
    ctx.moveTo(ax1,ay1); ctx.lineTo(ax2,ay2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax2,ay2);
    ctx.lineTo(ax2-hl*Math.cos(ang-Math.PI/6),ay2-hl*Math.sin(ang-Math.PI/6));
    ctx.lineTo(ax2-hl*Math.cos(ang+Math.PI/6),ay2-hl*Math.sin(ang+Math.PI/6));
    ctx.closePath(); ctx.fillStyle=el.color; ctx.fill();
  } else if (el.kind==='rect') {
    if (el.fill){ctx.fillStyle=el.fill;ctx.fillRect(x,y,w,h);}
    ctx.strokeRect(x,y,w,h);
  } else if (el.kind==='ellipse') {
    ctx.ellipse(x+w/2,y+h/2,Math.max(w/2,1),Math.max(h/2,1),0,0,Math.PI*2);
    if (el.fill){ctx.fillStyle=el.fill;ctx.fill();}
    ctx.stroke();
  } else if (el.kind==='triangle') {
    ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.closePath();
    if (el.fill){ctx.fillStyle=el.fill;ctx.fill();}
    ctx.stroke();
  }
  ctx.restore();
}
function renderText(ctx, el) {
  if (!el.content) return;
  ctx.save();
  ctx.globalAlpha=el.opa??1; ctx.fillStyle=el.color;
  ctx.font=`${el.fs}px 'IBM Plex Sans', sans-serif`;
  ctx.textBaseline='top';
  const lh=el.fs*1.45;
  el.content.split('\n').forEach((line,i)=>ctx.fillText(line,el.x,el.y+i*lh));
  ctx.restore();
}
function drawEl(ctx, el) {
  if (el.type==='stroke'||el.type==='hl') renderStroke(ctx,el);
  else if (el.type==='shape') renderShape(ctx,el);
  else if (el.type==='text') renderText(ctx,el);
}
function drawBg(ctx, w, h, bg, vp) {
  const { scale, tx: vx, ty: vy } = vp;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = bg==='dark' ? '#0C1225' : '#F5F8FF';
  ctx.fillRect(0,0,w,h);
  const pm = (n,m) => ((n%m)+m)%m;
  if (bg==='grid') {
    const gs=40*scale, ox=pm(vx,gs), oy=pm(vy,gs);
    ctx.strokeStyle='rgba(30,64,175,0.12)'; ctx.lineWidth=1;
    ctx.beginPath();
    for (let x=ox;x<w;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,h);}
    for (let y=oy;y<h;y+=gs){ctx.moveTo(0,y);ctx.lineTo(w,y);}
    ctx.stroke();
  } else if (bg==='dot') {
    const gs=40*scale, ox=pm(vx,gs), oy=pm(vy,gs);
    ctx.fillStyle='rgba(30,64,175,0.22)';
    for (let x=ox;x<w;x+=gs)
      for (let y=oy;y<h;y+=gs){
        ctx.beginPath(); ctx.arc(x,y,Math.max(1.5,1.5*scale),0,Math.PI*2); ctx.fill();
      }
  } else if (bg==='dark') {
    const gs=50*scale, ox=pm(vx,gs), oy=pm(vy,gs);
    ctx.strokeStyle='rgba(59,130,246,0.06)'; ctx.lineWidth=1;
    ctx.beginPath();
    for (let x=ox;x<w;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,h);}
    for (let y=oy;y<h;y+=gs){ctx.moveTo(0,y);ctx.lineTo(w,y);}
    ctx.stroke();
  }
}

// ── StickyNote component ───────────────────────────────────────────────────
function StickyNote({ el, vp, onDelete, onContentChange, onDragEnd }) {
  const divRef = useRef(null);
  const [pos, setPos] = useState({ x: el.x, y: el.y });

  const onMouseDown = useCallback((e) => {
    if (e.target.classList.contains('wb-s-del')) return;
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origX = el.x, origY = el.y;
    divRef.current.style.boxShadow = '4px 8px 28px rgba(0,0,0,.55)';
    const onMove = (me) => {
      el.x = origX + (me.clientX - startX) / vp.scale;
      el.y = origY + (me.clientY - startY) / vp.scale;
      setPos({ x: el.x, y: el.y });
    };
    const onUp = () => {
      divRef.current && (divRef.current.style.boxShadow = '');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      onDragEnd();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [el, vp, onDragEnd]);

  return (
    <div ref={divRef} className="wb-sticky" style={{ left: pos.x, top: pos.y, background: el.bg }}>
      <div className="wb-s-head" onMouseDown={onMouseDown}>
        <div className="wb-s-dots">
          <div className="wb-s-dot"/><div className="wb-s-dot"/><div className="wb-s-dot"/>
        </div>
        <button className="wb-s-del" onClick={e=>{e.stopPropagation();onDelete(el.id);}}>✕</button>
      </div>
      <textarea
        className="wb-s-ta"
        placeholder="Type here…"
        defaultValue={el.content||''}
        onChange={e=>onContentChange(el.id, e.target.value)}
        onBlur={onDragEnd}
      />
    </div>
  );
}

// ── Main Whiteboard component ──────────────────────────────────────────────
export default function Whiteboard() {
  // Inject CSS
  useEffect(() => {
    if (!document.getElementById('wb-style')) {
      const s = document.createElement('style');
      s.id = 'wb-style'; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Canvas refs
  const bgRef   = useRef(null);
  const mainRef = useRef(null);
  const tmpRef  = useRef(null);
  const wrapRef = useRef(null);
  const txtRef  = useRef(null);
  const erRef   = useRef(null);

  // App state (mutable ref for performance during drawing)
  const S = useRef({
    tool:'select', color:'#000000', fillColor:'#1D4ED8', hasFill:false,
    strokeW:1, opacity:1, fontSize:20, bg:'white',
    vp:{ scale:1, tx:0, ty:0 },
    els:[], hist:[], hIdx:-1,
    drawing:false, panning:false, spaceDown:false,
    panStart:null, panSnap:null,
    currentEl:null, selectedId:null,
    txtActive:false, txtEl:null,
  });

  // React state for UI re-renders
  const [tool, setToolState]       = useState('select');
  const [color, setColorState]     = useState('#000000');
  const [fillColor, setFillColor]  = useState('#1D4ED8');
  const [hasFill, setHasFill]      = useState(false);
  const [strokeW, setStrokeWState] = useState(1);
  const [opacity, setOpacityState] = useState(100);
  const [fontSize, setFontSize]    = useState(20);
  const [bg, setBgState]           = useState('white');
  const [zoomLabel, setZoomLabel]  = useState('100%');
  const [canUndo, setCanUndo]      = useState(false);
  const [canRedo, setCanRedo]      = useState(false);
  const [status, setStatus]        = useState('Click to select · Del to delete · Esc to deselect');
  const [toast, setToastState]     = useState({ msg:'', show:false });
  const [selectedId, setSelectedIdState] = useState(null);
  const [stickies, setStickies]    = useState([]);

  // ── Helpers (direct ref mutations + re-renders) ────────────────────────
  const showToast = useCallback((msg) => {
    setToastState({ msg, show:true });
    setTimeout(() => setToastState(t=>({...t, show:false})), 2500);
  }, []);

  const syncUndoRedo = useCallback(() => {
    setCanUndo(S.current.hIdx >= 1);
    setCanRedo(S.current.hIdx < S.current.hist.length - 1);
  }, []);

  const saveHistory = useCallback(() => {
    const s = S.current;
    s.hist = s.hist.slice(0, s.hIdx+1);
    s.hist.push(JSON.stringify(s.els));
    if (s.hist.length > 80) s.hist.shift();
    s.hIdx = s.hist.length - 1;
    syncUndoRedo();
  }, [syncUndoRedo]);

  // ── Canvas rendering ───────────────────────────────────────────────────
  const renderBg = useCallback(() => {
    const c = bgRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    drawBg(ctx, c.width, c.height, S.current.bg, S.current.vp);
  }, []);

  const renderMain = useCallback(() => {
    const c = mainRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { scale, tx, ty } = S.current.vp;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.setTransform(scale,0,0,scale,tx,ty);
    S.current.els.forEach(el => { if (el.type!=='sticky') drawEl(ctx,el); });
    if (S.current.selectedId !== null) {
      const el = S.current.els.find(e=>e.id===S.current.selectedId);
      if (el && el.type!=='sticky') {
        const b = getBounds(el);
        if (b) {
          ctx.save();
          ctx.strokeStyle='rgba(59,130,246,0.85)';
          ctx.lineWidth=1.5/scale;
          ctx.setLineDash([5/scale,3/scale]);
          ctx.strokeRect(b.x-4,b.y-4,b.w+8,b.h+8);
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }
    ctx.setTransform(1,0,0,1,0,0);
    setSelectedIdState(S.current.selectedId);
  }, []);

  const renderTemp = useCallback(() => {
    const c = tmpRef.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { scale, tx, ty } = S.current.vp;
    ctx.clearRect(0,0,c.width,c.height);
    if (!S.current.currentEl) return;
    ctx.setTransform(scale,0,0,scale,tx,ty);
    drawEl(ctx, S.current.currentEl);
    ctx.setTransform(1,0,0,1,0,0);
  }, []);

  const syncStickyLayer = useCallback(() => {
    const { scale, tx, ty } = S.current.vp;
    const sl = wrapRef.current?.querySelector('.wb-sticky-layer');
    if (sl) sl.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }, []);

  // ── Resize ────────────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const wrap = wrapRef.current; if (!wrap) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    [bgRef, mainRef, tmpRef].forEach(r => {
      if (r.current) { r.current.width = w; r.current.height = h; }
    });
    renderBg(); renderMain();
  }, [renderBg, renderMain]);

  useEffect(() => {
    resize();
    const s = S.current;
    s.hist.push(JSON.stringify(s.els));
    s.hIdx = 0;
    syncUndoRedo();
    setTimeout(() => showToast('Press ? for shortcuts · Space+drag to pan · Scroll to zoom'), 800);
  }, [resize, syncUndoRedo, showToast]);

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  // ── Zoom ─────────────────────────────────────────────────────────────
  const setZoom = useCallback((newScale, sx, sy) => {
    const ns = Math.min(8, Math.max(0.08, newScale));
    const wrap = wrapRef.current;
    if (sx === undefined && wrap) { sx = wrap.clientWidth/2; sy = wrap.clientHeight/2; }
    const { scale, tx: vx, ty: vy } = S.current.vp;
    S.current.vp.tx = sx - (sx-vx)*(ns/scale);
    S.current.vp.ty = sy - (sy-vy)*(ns/scale);
    S.current.vp.scale = ns;
    setZoomLabel(Math.round(ns*100)+'%');
    renderBg(); renderMain(); syncStickyLayer();
  }, [renderBg, renderMain, syncStickyLayer]);

  // ── Tool ──────────────────────────────────────────────────────────────
  const setTool = useCallback((t) => {
    commitText();
    S.current.tool = t;
    S.current.selectedId = null;
    const c = tmpRef.current;
    if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    if (tmpRef.current) tmpRef.current.style.cursor = TOOL_CURSORS[t]||'default';
    if (erRef.current) erRef.current.style.display='none';
    setToolState(t);
    setStatus(STATUSES[t]||'');
    renderMain();
  }, []); // eslint-disable-line

  // ── Eraser ───────────────────────────────────────────────────────────
  const eraseRadius = () => Math.max(10, S.current.strokeW*5) / S.current.vp.scale;

  const eraseAt = useCallback((cx, cy) => {
    const r = eraseRadius();
    const newEls = [];
    let changed = false;
    for (const el of S.current.els) {
      if (el.type==='sticky') { newEls.push(el); continue; }
      if (el.type==='stroke'||el.type==='hl') {
        const hitAny = el.pts.some(p=>Math.hypot(p.x-cx,p.y-cy)<r+el.sw/2);
        if (!hitAny) { newEls.push(el); continue; }
        changed = true;
        let seg = [];
        for (const p of el.pts) {
          if (Math.hypot(p.x-cx,p.y-cy)<r+el.sw/2) {
            if (seg.length>=1) { newEls.push({...el,id:uid(),pts:[...seg]}); seg=[]; }
          } else seg.push(p);
        }
        if (seg.length>=1) newEls.push({...el,id:uid(),pts:[...seg]});
      } else {
        const b=getBounds(el);
        if (b&&cx>=b.x-r&&cx<=b.x+b.w+r&&cy>=b.y-r&&cy<=b.y+b.h+r) changed=true;
        else newEls.push(el);
      }
    }
    if (changed) { S.current.els=newEls; renderMain(); }
  }, [renderMain]);

  // ── Text ─────────────────────────────────────────────────────────────
  function getScreenPos(e) {
    const r = tmpRef.current.getBoundingClientRect();
    return { x: e.clientX-r.left, y: e.clientY-r.top };
  }
  function getCanvasPos(e) {
    const sc = getScreenPos(e);
    return { x:(sc.x-S.current.vp.tx)/S.current.vp.scale, y:(sc.y-S.current.vp.ty)/S.current.vp.scale };
  }

  const startText = useCallback((sx, sy, cx, cy) => {
    const s = S.current;
    s.txtEl = { id:uid(), type:'text', x:cx, y:cy, color:s.color, fs:s.fontSize, opa:s.opacity, content:'', mw:0 };
    s.txtActive = true;
    const inp = txtRef.current;
    inp.innerHTML = '';
    inp.style.display='block';
    inp.style.left=sx+'px'; inp.style.top=sy+'px';
    inp.style.color=s.color;
    inp.style.fontSize=(s.fontSize*s.vp.scale)+'px';
    inp.style.lineHeight='1.5';
    setTimeout(()=>inp.focus(), 0);
  }, []);

  function commitText() {
    const s = S.current;
    if (!s.txtActive) return;
    s.txtActive = false;
    const inp = txtRef.current;
    if (inp) inp.style.display='none';
    const content = inp ? (inp.innerText||'').replace(/\n$/,'') : '';
    if (!s.txtEl||!content.trim()) { s.txtEl=null; return; }
    s.txtEl.content = content;
    const ctx = mainRef.current.getContext('2d');
    ctx.save(); ctx.font=`${s.txtEl.fs}px 'IBM Plex Sans', sans-serif`;
    s.txtEl.mw = Math.max(...content.split('\n').map(l=>ctx.measureText(l).width));
    ctx.restore();
    s.els.push(s.txtEl); s.txtEl=null;
    saveHistory(); renderMain();
  }

  function cancelText() {
    const s = S.current;
    s.txtActive = false;
    const inp = txtRef.current;
    if (inp) { inp.style.display='none'; inp.innerHTML=''; }
    s.txtEl = null;
  }

  // ── Mouse events ──────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    const s = S.current;
    if (e.button===1||s.spaceDown) {
      s.panning=true; s.panStart=getScreenPos(e); s.panSnap={...s.vp};
      if (tmpRef.current) tmpRef.current.style.cursor='grabbing';
      e.preventDefault(); return;
    }
    if (e.button!==0) return;
    if (s.txtActive) commitText();

    const sc = getScreenPos(e);
    const { x, y } = getCanvasPos(e);

    if (s.tool==='select') {
      let found = null;
      for (let i=s.els.length-1;i>=0;i--) {
        if (s.els[i].type==='sticky') continue;
        if (hitTest(s.els[i],x,y)) { found=s.els[i]; break; }
      }
      s.selectedId = found ? found.id : null;
      renderMain(); return;
    }
    if (s.tool==='pen'||s.tool==='highlighter') {
      s.drawing=true;
      s.currentEl={id:uid(),type:s.tool==='pen'?'stroke':'hl',pts:[{x,y}],color:s.color,sw:s.strokeW,opa:s.opacity};
      return;
    }
    if (s.tool==='eraser') { s.drawing=true; eraseAt(x,y); return; }
    if (['line','arrow','rect','ellipse','triangle'].includes(s.tool)) {
      s.drawing=true;
      s.currentEl={id:uid(),type:'shape',kind:s.tool,x,y,w:0,h:0,color:s.color,sw:s.strokeW,fill:s.hasFill?s.fillColor:null,opa:s.opacity};
      return;
    }
    if (s.tool==='text') { startText(sc.x,sc.y,x,y); return; }
    if (s.tool==='sticky') {
      const bgCol = STICKY_COLS[s.els.filter(e=>e.type==='sticky').length%STICKY_COLS.length];
      const el = { id:uid(), type:'sticky', x, y, bg:bgCol, content:'' };
      s.els.push(el);
      setStickies(prev=>[...prev, el]);
      saveHistory();
    }
  }, [eraseAt, startText, renderMain, saveHistory]);

  const onMouseMove = useCallback((e) => {
    const s = S.current;
    const sc = getScreenPos(e);
    const { x, y } = getCanvasPos(e);

    if (s.panning && s.panStart) {
      s.vp.tx = s.panSnap.tx + (sc.x-s.panStart.x);
      s.vp.ty = s.panSnap.ty + (sc.y-s.panStart.y);
      renderBg(); renderMain(); syncStickyLayer(); return;
    }
    if (s.tool==='eraser') {
      const r = eraseRadius()*s.vp.scale;
      const er = erRef.current;
      if (er) { er.style.display='block'; er.style.left=e.clientX+'px'; er.style.top=e.clientY+'px'; er.style.width=r*2+'px'; er.style.height=r*2+'px'; }
      if (s.drawing) eraseAt(x,y);
      return;
    }
    if (erRef.current) erRef.current.style.display='none';
    if (!s.drawing||!s.currentEl) return;
    if (s.tool==='pen'||s.tool==='highlighter') {
      s.currentEl.pts.push({x,y}); renderTemp();
    } else if (['line','arrow','rect','ellipse','triangle'].includes(s.tool)) {
      let dw=x-s.currentEl.x, dh=y-s.currentEl.y;
      if (e.shiftKey&&['rect','ellipse','triangle'].includes(s.tool)) {
        const side=Math.max(Math.abs(dw),Math.abs(dh));
        dw=dw<0?-side:side; dh=dh<0?-side:side;
      }
      s.currentEl.w=dw; s.currentEl.h=dh; renderTemp();
    }
  }, [eraseAt, renderBg, renderMain, renderTemp, syncStickyLayer]);

  const onMouseUp = useCallback(() => {
    const s = S.current;
    if (s.panning) {
      s.panning=false; s.panStart=null;
      if (!s.spaceDown && tmpRef.current) tmpRef.current.style.cursor=TOOL_CURSORS[s.tool]||'default';
      return;
    }
    if (!s.drawing) return;
    s.drawing=false;
    if (s.tool==='eraser') { saveHistory(); return; }
    if (s.currentEl) {
      let valid=false;
      if ((s.tool==='pen'||s.tool==='highlighter')&&s.currentEl.pts.length>0) valid=true;
      if (['line','arrow','rect','ellipse','triangle'].includes(s.tool)&&(Math.abs(s.currentEl.w)>2||Math.abs(s.currentEl.h)>2)) valid=true;
      if (valid) { s.els.push(s.currentEl); saveHistory(); }
    }
    s.currentEl=null;
    const c=tmpRef.current; if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    renderMain();
  }, [saveHistory, renderMain]);

  // ── Wheel ─────────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const r=tmpRef.current.getBoundingClientRect();
    setZoom(S.current.vp.scale*(e.deltaY<0?1.12:0.9), e.clientX-r.left, e.clientY-r.top);
  }, [setZoom]);

  useEffect(() => {
    const wrap = wrapRef.current; if (!wrap) return;
    wrap.addEventListener('wheel', onWheel, { passive:false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // ── Keyboard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (['TEXTAREA','INPUT','SELECT'].includes(tag)) return;
      if (e.code==='Space'&&!S.current.spaceDown) {
        S.current.spaceDown=true;
        if (tmpRef.current) tmpRef.current.style.cursor='grab';
        e.preventDefault(); return;
      }
      if ((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key==='z') { undo(); e.preventDefault(); return; }
      if (((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==='z')||((e.ctrlKey||e.metaKey)&&e.key==='y')) { redo(); e.preventDefault(); return; }
      const toolKeys={s:'select',p:'pen',h:'highlighter',e:'eraser',l:'line',a:'arrow',r:'rect',c:'ellipse',t:'triangle',x:'text',n:'sticky'};
      if (toolKeys[e.key.toLowerCase()]) { setTool(toolKeys[e.key.toLowerCase()]); return; }
      if ((e.key==='Delete'||e.key==='Backspace')&&S.current.selectedId!==null) {
        S.current.els=S.current.els.filter(el=>el.id!==S.current.selectedId);
        S.current.selectedId=null; saveHistory(); renderMain(); e.preventDefault(); return;
      }
      if (e.key==='+'||e.key==='=') setZoom(S.current.vp.scale*1.2);
      if (e.key==='-') setZoom(S.current.vp.scale/1.2);
      if (e.key==='0') {
        S.current.vp={scale:1,tx:0,ty:0}; setZoomLabel('100%');
        renderBg(); renderMain(); syncStickyLayer();
      }
      if (e.key==='Escape') { S.current.selectedId=null; cancelText(); renderMain(); }
      if (e.key==='?') showToast('S·Select  P·Pen  H·Highlight  E·Eraser  L·Line  A·Arrow  R·Rect  C·Ellipse  T·Triangle  X·Text  N·Note · Space=Pan · Scroll=Zoom');
    };
    const onKeyUp = (e) => {
      if (e.code==='Space') {
        S.current.spaceDown=false;
        if (!S.current.panning&&tmpRef.current) tmpRef.current.style.cursor=TOOL_CURSORS[S.current.tool]||'default';
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp); };
  }, [setTool, setZoom, renderBg, renderMain, syncStickyLayer, showToast, saveHistory]); // eslint-disable-line

  // ── Undo / Redo ───────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const s=S.current; if (s.hIdx<1) return;
    s.hIdx--; s.els=JSON.parse(s.hist[s.hIdx]); s.selectedId=null;
    syncUndoRedo();
    setStickies(s.els.filter(e=>e.type==='sticky'));
    syncStickyLayer(); renderMain();
  }, [syncUndoRedo, syncStickyLayer, renderMain]);

  const redo = useCallback(() => {
    const s=S.current; if (s.hIdx>=s.hist.length-1) return;
    s.hIdx++; s.els=JSON.parse(s.hist[s.hIdx]); s.selectedId=null;
    syncUndoRedo();
    setStickies(s.els.filter(e=>e.type==='sticky'));
    syncStickyLayer(); renderMain();
  }, [syncUndoRedo, syncStickyLayer, renderMain]);

  // ── Clear ─────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    cancelText();
    S.current.els=[]; S.current.currentEl=null; S.current.selectedId=null;
    const c=tmpRef.current; if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    setStickies([]);
    saveHistory(); renderMain();
  }, [saveHistory, renderMain]);

  // ── Export ────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const mc=mainRef.current, bc=bgRef.current; if (!mc||!bc) return;
    const w=mc.width, h=mc.height;
    const off=document.createElement('canvas'); off.width=w; off.height=h;
    const oc=off.getContext('2d');
    oc.drawImage(bc,0,0); oc.drawImage(mc,0,0);
    S.current.els.filter(e=>e.type==='sticky').forEach(el=>{
      const { scale, tx, ty } = S.current.vp;
      const sx=el.x*scale+tx, sy=el.y*scale+ty, sw=175*scale, sh=130*scale;
      oc.fillStyle=el.bg; oc.fillRect(sx,sy,sw,sh);
      oc.fillStyle='rgba(0,0,0,0.1)'; oc.fillRect(sx,sy,sw,22*scale);
      oc.fillStyle='rgba(0,0,0,0.65)';
      oc.font=`${12*scale}px 'IBM Plex Sans', sans-serif`; oc.textBaseline='top';
      const lh=12*scale*1.6;
      (el.content||'').split('\n').forEach((line,i)=>oc.fillText(line,sx+8*scale,sy+26*scale+i*lh));
    });
    const a=document.createElement('a'); a.download='whiteboard.png'; a.href=off.toDataURL('image/png'); a.click();
    showToast('Exported as PNG ✓');
  }, [showToast]);

  // ── Color/option change handlers ──────────────────────────────────────
  const handleColorClick = (c) => { S.current.color=c; setColorState(c); };
  const handleCustomColor = (e) => { S.current.color=e.target.value; setColorState(e.target.value); };
  const handleFillToggle = () => { const nv=!S.current.hasFill; S.current.hasFill=nv; setHasFill(nv); };
  const handleFillColor = (e) => { S.current.fillColor=e.target.value; setFillColor(e.target.value); };
  const handleStrokeW = (w) => { S.current.strokeW=w; setStrokeWState(w); };
  const handleOpacity = (v) => { S.current.opacity=v/100; setOpacityState(v); };
  const handleFontSize = (v) => { S.current.fontSize=v; setFontSize(v); };
  const handleBg = (b) => {
    S.current.bg=b; setBgState(b);
    renderBg(); renderMain();
  };
  const handleZoomReset = () => {
    S.current.vp={scale:1,tx:0,ty:0}; setZoomLabel('100%');
    renderBg(); renderMain(); syncStickyLayer();
  };

  // Sticky callbacks
  const handleStickyDelete = useCallback((id) => {
    S.current.els=S.current.els.filter(e=>e.id!==id);
    setStickies(prev=>prev.filter(e=>e.id!==id));
    saveHistory();
  }, [saveHistory]);
  const handleStickyContent = useCallback((id, val) => {
    const el=S.current.els.find(e=>e.id===id); if (el) el.content=val;
  }, []);
  const handleStickyDragEnd = useCallback(() => { saveHistory(); }, [saveHistory]);

  const isShape = ['rect','ellipse','triangle','line','arrow'].includes(tool);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="wb-app">
      {/* TOPBAR */}
      <div className="wb-topbar">
        <div className="wb-brand">
          <div className="wb-brand-mark">
            <svg viewBox="0 0 14 14"><path d="M2 11 Q5 5 7 7 Q9 9 12 3"/></svg>
          </div>
          <span className="wb-brand-name">Whiteboard</span>
        </div>
        <div className="wb-sep"/>
        <button className="wb-btn" disabled={!canUndo} onClick={undo}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8H13C15.2 8 17 9.8 17 12S15.2 16 13 16H6"/><path d="M7 5L4 8L7 11"/></svg>
          Undo
        </button>
        <button className="wb-btn" disabled={!canRedo} onClick={redo}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8H7C4.8 8 3 9.8 3 12S4.8 16 7 16H14"/><path d="M13 5L16 8L13 11"/></svg>
          Redo
        </button>
        <button className="wb-btn danger" onClick={handleClear}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 8H16L15 16H5L4 8ZM2 5H18M8 5V3H12V5"/><line x1="8" y1="11" x2="8" y2="14"/><line x1="12" y1="11" x2="12" y2="14"/></svg>
          Clear
        </button>
        <div className="wb-sep"/>
        <span className="wb-olabel" style={{fontSize:'10px',fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.7px'}}>BG</span>
        <div className="wb-bg-chips">
          {[['white','bgc-white','White'],['grid','bgc-grid','Grid'],['dot','bgc-dot','Dots'],['dark','bgc-dark','Dark']].map(([key,cls,title])=>(
            <div key={key} className={`wb-bgchip ${cls}${bg===key?' on':''}`} title={title} onClick={()=>handleBg(key)}/>
          ))}
        </div>
        <div className="wb-spacer"/>
        <div className="wb-zoom-cluster">
          <button onClick={()=>setZoom(S.current.vp.scale*1.25)}>+</button>
          <span className="wb-zoom-val" onClick={handleZoomReset}>{zoomLabel}</span>
          <button onClick={()=>setZoom(S.current.vp.scale/1.25)}>−</button>
        </div>
        <div className="wb-sep"/>
        <button className="wb-btn primary" onClick={handleExport}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3V13M6 9L10 13L14 9"/><path d="M3 15V17H17V15"/></svg>
          Export PNG
        </button>
      </div>

      {/* WORKSPACE */}
      <div className="wb-workspace">
        {/* TOOLBAR */}
        <div className="wb-toolbar">
          {[
            ['select','S','Select (S) · Del to delete','M5 3L16 10L11 12L9 17Z',null],
          ].map(()=>null)}
          <button className={`wb-tool${tool==='select'?' on':''}`} data-tip="Select (S) · Del to delete" onClick={()=>setTool('select')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3L16 10L11 12L9 17Z"/></svg>
          </button>
          <div className="wb-tsep"/>
          <button className={`wb-tool${tool==='pen'?' on':''}`} data-tip="Pen (P)" onClick={()=>setTool('pen')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17L7 14L14 7L13 6L6 13Z"/><path d="M13 6L14 5C15 4 16 4 17 5S17 7 16 8L15 9L13 6"/></svg>
          </button>
          <button className={`wb-tool${tool==='highlighter'?' on':''}`} data-tip="Highlighter (H)" onClick={()=>setTool('highlighter')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="8" height="10" rx="1"/><path d="M8 13L8 17L12 17L12 13"/><line x1="8.5" y1="7" x2="11.5" y2="7" strokeWidth="2.5"/></svg>
          </button>
          <button className={`wb-tool${tool==='eraser'?' on':''}`} data-tip="Eraser (E)" onClick={()=>setTool('eraser')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17H16M3 13L9 5L15 9L9 17Z"/></svg>
          </button>
          <div className="wb-tsep"/>
          <button className={`wb-tool${tool==='line'?' on':''}`} data-tip="Line (L)" onClick={()=>setTool('line')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="16" x2="16" y2="4"/></svg>
          </button>
          <button className={`wb-tool${tool==='arrow'?' on':''}`} data-tip="Arrow (A)" onClick={()=>setTool('arrow')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="16" x2="15" y2="5"/><polyline points="9,5 15,5 15,11"/></svg>
          </button>
          <button className={`wb-tool${tool==='rect'?' on':''}`} data-tip="Rectangle (R) · Shift=square" onClick={()=>setTool('rect')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="4" y="5" width="12" height="10" rx="1"/></svg>
          </button>
          <button className={`wb-tool${tool==='ellipse'?' on':''}`} data-tip="Ellipse (C) · Shift=circle" onClick={()=>setTool('ellipse')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><ellipse cx="10" cy="10" rx="7" ry="5"/></svg>
          </button>
          <button className={`wb-tool${tool==='triangle'?' on':''}`} data-tip="Triangle (T)" onClick={()=>setTool('triangle')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="10,4 17,16 3,16"/></svg>
          </button>
          <div className="wb-tsep"/>
          <button className={`wb-tool${tool==='text'?' on':''}`} data-tip="Text (X) · Ctrl+Enter to confirm" onClick={()=>setTool('text')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><line x1="4" y1="5" x2="16" y2="5"/><line x1="10" y1="5" x2="10" y2="16"/></svg>
          </button>
          <button className={`wb-tool${tool==='sticky'?' on':''}`} data-tip="Sticky Note (N)" onClick={()=>setTool('sticky')}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4H16V13L11 17H4V4Z"/><line x1="7" y1="8" x2="13" y2="8"/><line x1="7" y1="11" x2="10" y2="11"/></svg>
          </button>
        </div>

        {/* CANVAS WRAP */}
        <div className="wb-canvas-wrap" ref={wrapRef}>
          <canvas id="wb-bg-c" ref={bgRef}/>
          <canvas id="wb-main-c" ref={mainRef}/>
          <canvas id="wb-tmp-c" ref={tmpRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
          <div className="wb-sticky-layer">
            {stickies.map(el=>(
              <StickyNote key={el.id} el={el} vp={S.current.vp}
                onDelete={handleStickyDelete}
                onContentChange={handleStickyContent}
                onDragEnd={handleStickyDragEnd}
              />
            ))}
          </div>
          <div
            ref={txtRef}
            className="wb-txt-inp"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder="Type here…"
            onKeyDown={e=>{
              e.stopPropagation();
              if (e.key==='Escape') { cancelText(); e.preventDefault(); return; }
              if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)) { commitText(); e.preventDefault(); }
            }}
            onMouseDown={e=>e.stopPropagation()}
          />
        </div>
      </div>

      {/* OPTBAR */}
      <div className="wb-optbar">
        <span className="wb-olabel">Color</span>
        <div className="wb-palette">
          {COLORS.map(c=>(
            <div key={c} className={`wb-sw${color===c?' on':''}`}
              style={{ background:c, boxShadow: ['#FFFFFF','#BFDBFE','#D1D5DB'].includes(c)?'0 0 0 1.5px rgba(255,255,255,0.18) inset':'' }}
              title={c}
              onClick={()=>handleColorClick(c)}
            />
          ))}
        </div>
        <div className="wb-sw-custom" title="Custom color">
          <input type="color" value={color.length===7?color:'#000000'} onInput={handleCustomColor} onChange={handleCustomColor}/>
        </div>
        <div className="wb-sep"/>
        <span className="wb-olabel">Size</span>
        <div className="wb-widths">
          {WIDTH_OPTS.map(({w,h})=>(
            <button key={w} className={`wb-wb${strokeW===w?' on':''}`} onClick={()=>handleStrokeW(w)}>
              <div className="wb-wl" style={{width:'13px',height:h}}/>
            </button>
          ))}
        </div>
        <div className={`wb-fill-sec${isShape?'':' hide'}`}>
          <div className="wb-sep"/>
          <span className="wb-olabel">Fill</span>
          <button className={`wb-ftoggle${hasFill?' on':''}`} title="Toggle fill" onClick={handleFillToggle}>
            <div className="wb-f-box"/>
            {!hasFill && <div className="wb-f-slash"/>}
          </button>
          <div className="wb-sw-custom" style={{borderRadius:'4px'}} title="Fill color">
            <input type="color" value={fillColor} onInput={handleFillColor} onChange={handleFillColor}/>
          </div>
        </div>
        <div className={`wb-font-sec${tool==='text'?'':' hide'}`}>
          <div className="wb-sep"/>
          <span className="wb-olabel">Size</span>
          <select className="wb-fsel" value={fontSize} onChange={e=>handleFontSize(parseInt(e.target.value))}>
            {[12,16,20,28,36,48,64].map(s=><option key={s} value={s}>{s}px</option>)}
          </select>
        </div>
        <div className="wb-sep"/>
        <span className="wb-olabel">Opacity</span>
        <div className="wb-opa-row">
          <input type="range" min="10" max="100" value={opacity}
            onChange={e=>handleOpacity(parseInt(e.target.value))}/>
          <span className="wb-opa-num">{opacity}%</span>
        </div>
        <div className="wb-spacer"/>
        <span style={{fontSize:'11px',color:'var(--text3)',flexShrink:0}}>{status}</span>
      </div>

      {/* Eraser ring */}
      <div ref={erRef} className="wb-er-ring"/>

      {/* Toast */}
      <div className={`wb-toast${toast.show?' show':''}`}>{toast.msg}</div>

      {/* Selection bar */}
      {selectedId !== null && (
        <div className="wb-sel-bar">
          Selected — press <kbd style={{background:'rgba(255,255,255,.1)',padding:'1px 5px',borderRadius:'3px',fontSize:'10px',fontFamily:'inherit'}}>Del</kbd> to delete
        </div>
      )}
    </div>
  );
}