"use client";
import { useEffect, useRef, useState } from "react";

export default function IntroOverlay() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const convergedRef = useRef(false);

  useEffect(() => {
    // 이미 본 사람은 인트로 스킵
    let seen = false;
    try { seen = localStorage.getItem("oc_intro_seen") === "1"; } catch {}
    if (seen) return;
    setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const cv = canvasRef.current!;
    const stage = stageRef.current!;
    const ctx = cv.getContext("2d")!;
    let W = 0, H = 0;
    let parts: { x: number; y: number; tx: number; ty: number; s: number; drift: number; tw: number }[] = [];

    const resize = () => { W = cv.width = stage.clientWidth; H = cv.height = stage.clientHeight; };
    resize();
    window.addEventListener("resize", resize);

    const cx = () => W / 2, cy = () => H / 2 - 50;
    const initParts = () => {
      parts = [];
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 90;
        parts.push({ x: Math.random() * W, y: Math.random() * H, tx: cx() + Math.cos(a) * r, ty: cy() + Math.sin(a) * r * 0.6, s: 0.6 + Math.random() * 2.2, drift: Math.random() * Math.PI * 2, tw: Math.random() * Math.PI * 2 });
      }
    };
    initParts();
    convergedRef.current = false;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        if (!convergedRef.current) { p.x += (p.tx - p.x) * 0.05; p.y += (p.ty - p.y) * 0.05; }
        else { p.drift += 0.008; p.y -= 0.25; p.x += Math.sin(p.drift) * 0.4; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } }
        p.tw += 0.05;
        const tw = 0.5 + Math.sin(p.tw) * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255," + (107 + tw * 60) + "," + (35 + tw * 40) + "," + ((convergedRef.current ? 0.35 : 0.65) * (0.4 + tw * 0.6)) + ")";
        ctx.shadowBlur = convergedRef.current ? 6 : 3;
        ctx.shadowColor = "rgba(255,107,35,0.5)";
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    const q = (id: string) => document.getElementById(id)!;
    const logoWrap = q("oc-logoWrap"), tagline = q("oc-tagline"), rule = q("oc-rule"), hex = q("oc-hex"), sweep = q("oc-sweep");
    const lines = Array.from(document.querySelectorAll<HTMLElement>(".oc-line"));
    const enter = q("oc-enter");
    const t: number[] = timersRef.current;

    const anim = (el: HTMLElement, props: Record<string, string>, dur: number, ease?: string) => {
      el.style.transition = "all " + dur + "ms " + (ease || "cubic-bezier(.2,.7,.3,1)");
      requestAnimationFrame(() => { for (const k in props) (el.style as any)[k] = props[k]; });
    };

    t.push(window.setTimeout(() => { anim(logoWrap, { opacity: "1", transform: "translateY(0) scale(1)" }, 900); hex.style.animation = "ocHexSpin 14s linear infinite"; }, 600));
    t.push(window.setTimeout(() => { rule.style.transition = "width 1s ease"; rule.style.width = "240px"; }, 1300));
    t.push(window.setTimeout(() => { convergedRef.current = true; anim(tagline, { opacity: "1" }, 1000); sweep.style.animation = "ocSweepMove 3.5s ease-in-out 1s"; }, 1600));
    let tm = 2400;
    lines.forEach((l, i) => {
      t.push(window.setTimeout(() => { anim(l, { opacity: "1", transform: "translateX(-50%) translateY(0)" }, 700); }, tm));
      t.push(window.setTimeout(() => { if (i < lines.length - 1) anim(l, { opacity: "0", transform: "translateX(-50%) translateY(-10px)" }, 550); }, tm + 1400));
      tm += 1600;
    });
    t.push(window.setTimeout(() => { anim(enter, { opacity: "1", transform: "translateY(0)" }, 800); }, tm + 200));

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [show]);

  const dismiss = () => {
    try { localStorage.setItem("oc_intro_seen", "1"); } catch {}
    timersRef.current.forEach(clearTimeout);
    cancelAnimationFrame(rafRef.current);
    setClosing(true);
    setTimeout(() => setShow(false), 700);
  };

  if (!show) return null;

  return (
    <div ref={stageRef} aria-hidden={closing}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "radial-gradient(ellipse 120% 80% at 50% 40%, #0d1322 0%, #080c14 55%, #05070d 100%)", overflow: "hidden", opacity: closing ? 0 : 1, transition: "opacity .7s ease", pointerEvents: closing ? "none" : "auto" }}>
      <style>{`
        @keyframes ocHexSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes ocSweepMove { 0%{left:-30%} 100%{left:130%} }
        .oc-accent { color:#ff6b23; font-weight:500; text-shadow:0 0 18px rgba(255,107,35,0.4); }
        #oc-enterBtn { background:transparent; border:1px solid rgba(255,107,35,0.45); color:#ff8c42; font-family:'Cinzel',serif; font-weight:500; font-size:14px; letter-spacing:5px; padding:13px 44px; cursor:pointer; clip-path:polygon(9px 0,100% 0,calc(100% - 9px) 100%,0 100%); transition:all .3s; position:relative; overflow:hidden; }
        #oc-enterBtn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,#ff6b23,#ff8c42); transform:translateY(101%); transition:transform .35s cubic-bezier(.4,0,.2,1); z-index:-1; }
        #oc-enterBtn:hover { color:#fff; border-color:#ff8c42; letter-spacing:7px; box-shadow:0 0 32px rgba(255,107,35,0.45); }
        #oc-enterBtn:hover::before { transform:translateY(0); }
        #oc-skip { position:absolute; bottom:20px; right:22px; z-index:3; background:transparent; border:none; color:#5a6478; font-family:'Cinzel',serif; font-size:11px; letter-spacing:3px; padding:6px 10px; cursor:pointer; transition:color .2s; }
        #oc-skip:hover { color:#9aa3b5; }
        @media (prefers-reduced-motion: reduce) {
          #oc-hex { animation:none !important; }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 42%, transparent 40%, rgba(5,7,13,0.55) 100%)", pointerEvents: "none", zIndex: 1 }} />
      <div id="oc-sweep" style={{ position: "absolute", top: 0, left: "-30%", width: "30%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,107,35,0.05),transparent)", zIndex: 1, pointerEvents: "none" }} />

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2, padding: "0 20px" }}>
        <div id="oc-logoWrap" style={{ textAlign: "center", opacity: 0, transform: "translateY(14px) scale(0.96)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(10px,3vw,18px)", marginBottom: 22 }}>
            <svg id="oc-hex" width="46" height="50" viewBox="0 0 46 50" style={{ transformOrigin: "center", flexShrink: 0 }}>
              <polygon points="23,2 43,13 43,37 23,48 3,37 3,13" fill="none" stroke="#ff6b23" strokeWidth="2" opacity="0.9" />
              <polygon points="23,12 34,18.5 34,31.5 23,38 12,31.5 12,18.5" fill="#ff6b23" />
              <polygon points="23,12 34,18.5 34,31.5 23,38 12,31.5 12,18.5" fill="none" stroke="#ffb380" strokeWidth="0.5" opacity="0.6" />
            </svg>
            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: "clamp(28px,8vw,44px)", letterSpacing: "clamp(3px,1.5vw,8px)", color: "#fff", textShadow: "0 0 30px rgba(255,107,35,0.25)" }}>OVERCLAN</span>
          </div>
          <div id="oc-rule" style={{ width: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,107,35,0.7),transparent)", margin: "0 auto 18px" }} />
          <div id="oc-tagline" style={{ fontFamily: "'Cinzel', serif", fontWeight: 400, fontSize: "clamp(10px,2.5vw,13px)", letterSpacing: "clamp(3px,1.5vw,7px)", color: "#9aa3b5", opacity: 0 }}>OVERWATCH&nbsp;&nbsp;CLAN&nbsp;&nbsp;PLATFORM</div>
        </div>

        <div style={{ marginTop: 46, textAlign: "center", height: 40, position: "relative", width: "100%" }}>
          <div className="oc-line" style={lineStyle}>함께할 클랜을 <span className="oc-accent">찾으세요</span></div>
          <div className="oc-line" style={lineStyle}>나만의 클랜을 <span className="oc-accent">만드세요</span></div>
          <div className="oc-line" style={lineStyle}>클랜 페이지를 <span className="oc-accent">꾸미세요</span></div>
        </div>

        <div id="oc-enter" style={{ marginTop: 52, opacity: 0, transform: "translateY(8px)" }}>
          <button id="oc-enterBtn" onClick={dismiss}>ENTER&nbsp;<span style={{ fontSize: 11, opacity: 0.8 }}>→</span></button>
        </div>
      </div>

      <button id="oc-skip" onClick={dismiss}>SKIP</button>
    </div>
  );
}

const lineStyle: React.CSSProperties = {
  fontFamily: "'Noto Sans KR', sans-serif",
  fontWeight: 300,
  fontSize: "clamp(17px,5vw,22px)",
  letterSpacing: 2,
  color: "#e8eaf0",
  opacity: 0,
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%) translateY(10px)",
  whiteSpace: "nowrap",
};
