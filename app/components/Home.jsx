"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";
import ClanBadge, { ClanTierChip, ClanEmblem } from "./ClanBadge";

// Count-up hook
function useCountUp(target, duration = 1800, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || target === 0) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return count;
}

// Scroll reveal hook
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

// Particle canvas
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    const mkParticle = () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      size: Math.random() * 1.2 + 0.3,
      sx: (Math.random() - 0.5) * 0.25,
      sy: -(Math.random() * 0.4 + 0.1),
      opacity: Math.random() * 0.45 + 0.1,
      life: Math.random() * 0.8 + 0.2,
    });

    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 55; i++) particles.push(mkParticle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.sx; p.y += p.sy; p.life -= 0.0015;
        if (p.life <= 0 || p.y < 0) particles[i] = { ...mkParticle(), y: canvas.height };
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,107,35,${p.opacity * p.life})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
  );
}

// Hex background
function HexPattern() {
  return (
    <svg style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hexagons" x="0" y="0" width="20" height="23" patternUnits="userSpaceOnUse">
          <polygon points="10,1 19,6 19,17 10,22 1,17 1,6" fill="none" stroke="rgba(255,107,35,0.07)" strokeWidth="0.5"/>
        </pattern>
        <radialGradient id="hexFade" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id="hexMask">
          <rect width="200" height="200" fill="url(#hexFade)"/>
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexagons)" mask="url(#hexMask)"/>
    </svg>
  );
}

// Stat card with count-up
function StatCard({ label, value, started, delay = 0 }) {
  const numeric = typeof value === "number" ? value : 0;
  const counted = useCountUp(numeric, 1800, started && typeof value === "number");
  const display = typeof value === "number" ? counted.toLocaleString() : value;
  return (
    <div className="stat-card" style={{ transitionDelay: `${delay}s` }}>
      <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", color: "#ff6b23", letterSpacing: 1 }}>{display}</div>
      <div style={{ fontSize: 11, color: "#8892a4", marginTop: 5, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{label}</div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("전체");
  const [stats, setStats] = useState({ clans: 0, members: 0, battles: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [topClans, setTopClans] = useState([]);
  const [clansLoaded, setClansLoaded] = useState(false);

  const [statsRef, statsVisible] = useScrollReveal(0.1);
  const [rankingRef, rankingVisible] = useScrollReveal(0.1);
  const [ctaRef, ctaVisible] = useScrollReveal(0.2);

  useEffect(() => {
    const load = async () => {
      const { count: clanCount } = await supabase.from("clans").select("*", { count: "exact", head: true });
      const { count: memberCount } = await supabase.from("clan_members").select("*", { count: "exact", head: true });
      const { count: battleCount } = await supabase.from("clan_battles").select("*", { count: "exact", head: true });
      setStats({ clans: clanCount || 0, members: memberCount || 0, battles: battleCount || 0 });
      setStatsLoaded(true);
      const { data: clans } = await supabase.from("clans").select("*, clan_members(count)").order("points", { ascending: false }).limit(4);
      setTopClans(clans || []);
      setClansLoaded(true);
    };
    load();
  }, []);

  const filtered = activeTab === "전체" ? topClans : topClans.filter(c => {
    const count = c.clan_members?.[0]?.count || 0;
    if (activeTab === "소규모") return count <= 10;
    if (activeTab === "중규모") return count > 10 && count <= 25;
    if (activeTab === "대규모") return count > 25;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani','Noto Sans KR',sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}

        /* Ambient glows */
        .amb1{position:fixed;width:700px;height:700px;top:-15%;left:-10%;background:rgba(255,107,35,0.07);border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0;animation:glowPulse 7s ease-in-out infinite;}
        .amb2{position:fixed;width:500px;height:500px;bottom:5%;right:-10%;background:rgba(79,195,247,0.04);border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;animation:glowPulse 9s ease-in-out 2s infinite;}

        /* Buttons */
        .btn-primary{
          background:linear-gradient(135deg,#ff6b23,#ff8c42);
          border:none;color:#fff;padding:14px 32px;
          font-family:'Cinzel','Rajdhani',sans-serif;font-size:14px;font-weight:700;
          letter-spacing:2px;text-transform:uppercase;cursor:pointer;
          clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
          transition:transform 0.3s,box-shadow 0.3s;
          position:relative;overflow:hidden;white-space:nowrap;
        }
        .btn-primary::after{
          content:'';position:absolute;top:-50%;left:-60%;
          width:35%;height:200%;background:rgba(255,255,255,0.18);
          transform:skewX(-20deg);transition:left 0.5s;
        }
        .btn-primary:hover::after{left:130%;}
        .btn-primary:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(255,107,35,0.45);}

        .btn-secondary{
          background:transparent;border:1px solid rgba(255,107,35,0.4);
          color:#ff6b23;padding:13px 32px;
          font-family:'Cinzel','Rajdhani',sans-serif;font-size:14px;font-weight:700;
          letter-spacing:2px;text-transform:uppercase;cursor:pointer;
          clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
          transition:all 0.3s;white-space:nowrap;
        }
        .btn-secondary:hover{
          background:rgba(255,107,35,0.1);border-color:rgba(255,107,35,0.8);
          transform:translateY(-3px);box-shadow:0 8px 24px rgba(255,107,35,0.2);
        }

        /* Stat card */
        .stat-card{
          background:rgba(13,20,35,0.75);
          border:1px solid rgba(255,107,35,0.12);
          padding:22px 18px;text-align:center;
          clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
          position:relative;overflow:hidden;
          transition:transform 0.35s,border-color 0.35s,box-shadow 0.35s;
        }
        .stat-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,107,35,0.6),transparent);
        }
        .stat-card:hover{
          transform:translateY(-4px);
          border-color:rgba(255,107,35,0.3);
          box-shadow:0 14px 36px rgba(255,107,35,0.1);
        }

        /* Clan card */
        .clan-card{
          background:rgba(13,20,35,0.8);
          border:1px solid rgba(255,107,35,0.1);
          padding:20px 24px;position:relative;
          transition:all 0.35s cubic-bezier(0.4,0,0.2,1);
          cursor:pointer;
          clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px));
          text-decoration:none;color:inherit;display:block;overflow:hidden;
        }
        .clan-card::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(255,107,35,0.06) 0%,transparent 60%);
          opacity:0;transition:opacity 0.35s;
        }
        .clan-card:hover{
          border-color:rgba(255,107,35,0.5);
          background:rgba(18,28,48,0.95);
          transform:translateX(6px);
          box-shadow:-4px 0 0 #ff6b23,0 8px 32px rgba(255,107,35,0.12);
        }
        .clan-card:hover::before{opacity:1;}

        /* Tab */
        .tab-btn{background:transparent;border:none;color:#8892a4;font-family:'Cinzel','Rajdhani',sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:8px 16px;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;}
        .tab-btn.active{color:#ff6b23;border-bottom-color:#ff6b23;}
        .tab-btn:not(.active):hover{color:#e8eaf0;}

        /* Rank badge */
        .rank-badge{width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);flex-shrink:0;}

        /* Tier tag */
        .tier-tag{font-size:10px;font-weight:600;letter-spacing:1px;padding:2px 8px;border:1px solid;clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);}

        /* Hero */
        .hero-title{font-size:clamp(52px,8.5vw,104px);font-weight:700;line-height:1.05;letter-spacing:-2px;font-family:'Cinzel','Rajdhani',sans-serif;}
        .glow-orange{color:#ff6b23;text-shadow:0 0 40px rgba(255,107,35,0.5),0 0 80px rgba(255,107,35,0.2);}

        /* Live dot */
        .live-dot{width:6px;height:6px;background:#4caf50;border-radius:50%;animation:pulseDot 1.5s infinite;box-shadow:0 0 8px #4caf50;flex-shrink:0;}

        /* Reveal */
        .reveal{opacity:0;transform:translateY(28px);transition:opacity 0.7s ease,transform 0.7s ease;}
        .reveal.visible{opacity:1;transform:translateY(0);}
        .rd1{transition-delay:0.1s;}.rd2{transition-delay:0.2s;}.rd3{transition-delay:0.3s;}.rd4{transition-delay:0.4s;}

        /* Clan card stagger */
        .cc-wrap{opacity:0;transform:translateX(-16px);transition:opacity 0.5s ease,transform 0.5s ease;}
        .cc-wrap.visible{opacity:1;transform:translateX(0);}

        /* Section accent */
        .sec-line{width:0;height:2px;background:linear-gradient(90deg,#ff6b23,transparent);transition:width 0.8s ease;margin-bottom:10px;}
        .sec-line.visible{width:48px;}

        /* Divider */
        .divider{height:1px;background:linear-gradient(90deg,rgba(255,107,35,0.25),rgba(255,107,35,0.05) 60%,transparent);}

        /* Animations */
        @keyframes glowPulse{0%,100%{opacity:0.7;transform:scale(1);}50%{opacity:1;transform:scale(1.04);}}
        @keyframes pulseDot{0%,100%{opacity:1;box-shadow:0 0 8px #4caf50;}50%{opacity:0.55;box-shadow:0 0 16px #4caf50;}}
        @keyframes heroIn{from{opacity:0;transform:translateY(36px);}to{opacity:1;transform:translateY(0);}}
        .hi0{animation:heroIn 0.75s ease forwards;}
        .hi1{animation:heroIn 0.75s ease 0.15s forwards;opacity:0;}
        .hi2{animation:heroIn 0.75s ease 0.3s forwards;opacity:0;}
        .hi3{animation:heroIn 0.75s ease 0.45s forwards;opacity:0;}
        .hi4{animation:heroIn 0.75s ease 0.6s forwards;opacity:0;}

        /* Mobile */
        .mobile-only{display:none;}
        @media(max-width:768px){
          .desktop-only{display:none;}.mobile-only{display:inline;}
          .hero-title{font-size:clamp(40px,12vw,68px)!important;letter-spacing:-1px!important;}
          .stat-card{padding:14px 10px!important;}
          .clan-card{padding:14px 16px!important;}
          .tab-btn{padding:6px 10px!important;font-size:11px!important;letter-spacing:0.5px!important;}
          .btn-primary,.btn-secondary{padding:12px 20px!important;font-size:13px!important;}
        }
      `}</style>

      <HexPattern />
      <div className="amb1"/><div className="amb2"/>

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <Navbar />

        {/* ──────── HERO ──────── */}
        <section style={{ padding: "clamp(48px,7vw,100px) clamp(20px,5vw,48px) clamp(48px,6vw,80px)", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <ParticleField />
          </div>

          <div style={{ position: "relative" }}>
            {/* Badge row */}
            <div className="hi0" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
              <div className="live-dot"/>
              <span style={{ fontSize: 11, letterSpacing: 3, color: "#4caf50", fontWeight: 600 }}>SEASON 1 진행중</span>
              <span style={{ fontSize: 11, letterSpacing: 1, color: "#ff6b23", fontWeight: 600, fontFamily: "Noto Sans KR, sans-serif", background: "rgba(255,107,35,0.1)", border: "1px solid rgba(255,107,35,0.25)", padding: "2px 10px", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>🔥 오픈 멤버 모집중</span>
            </div>

            {/* Title */}
            <div className="hero-title hi1">
              <div style={{ color: "#e8eaf0" }}>같이 싸울</div>
              <div><span className="glow-orange">클랜</span><span style={{ color: "#e8eaf0" }}>을 찾아라</span></div>
            </div>

            {/* Sub */}
            <p className="hi2" style={{ marginTop: 28, fontSize: 16, color: "#8892a4", lineHeight: 1.8, maxWidth: 500, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
              오버워치를 같이 할 클랜을 찾아보세요.<br/>
              <span style={{ color: "#ff6b23", fontWeight: 400 }}>지금 합류하면 시즌 1 초기 멤버가 됩니다.</span>
            </p>

            {/* CTAs */}
            <div className="hi3" style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
              <a href="/clan/create" style={{ textDecoration: "none" }}><button className="btn-primary">클랜 만들기</button></a>
              <a href="/find" style={{ textDecoration: "none" }}><button className="btn-secondary">클랜 찾기</button></a>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="hi4" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 64, maxWidth: 560 }}>
              {[
                { label: "활성 클랜", value: statsLoaded ? stats.clans : "—" },
                { label: "총 클랜원", value: statsLoaded ? stats.members : "—" },
                { label: "총 클랜대전", value: statsLoaded ? stats.battles : "—" },
              ].map((s, i) => (
                <StatCard key={s.label} label={s.label} value={s.value} started={statsLoaded && statsVisible} delay={i * 0.08} />
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px,5vw,48px)" }}>
          <div className="divider"/>
        </div>

        {/* ──────── RANKING ──────── */}
        <section ref={rankingRef} style={{ padding: "clamp(40px,5vw,72px) clamp(20px,5vw,48px)", maxWidth: 1200, margin: "0 auto" }}>
          <div className={`reveal ${rankingVisible ? "visible" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div className={`sec-line ${rankingVisible ? "visible" : ""}`}/>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", color: "#8892a4" }}>시즌 랭킹</h2>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[{k:"전체",v:"전체"},{k:"소규모",v:"소"},{k:"중규모",v:"중"},{k:"대규모",v:"대"}].map(tab => (
                <button key={tab.k} className={`tab-btn ${activeTab === tab.k ? "active" : ""}`} onClick={() => setActiveTab(tab.k)}>
                  <span className="desktop-only">{tab.k}</span>
                  <span className="mobile-only">{tab.v}</span>
                </button>
              ))}
            </div>
          </div>

          {!clansLoaded ? (
            <div style={{ textAlign: "center", padding: 48, color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 3, opacity: 0.4, fontSize: 13 }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div className={`reveal ${rankingVisible ? "visible" : ""}`} style={{ textAlign: "center", padding: "56px 40px", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", background: "rgba(13,20,35,0.5)", border: "1px dashed rgba(255,107,35,0.15)" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>🏆</div>
              <div style={{ fontSize: 16, color: "#e8eaf0", fontWeight: 500, marginBottom: 8 }}>아직 랭킹 1위 자리가 비어있어요</div>
              <div style={{ fontSize: 13, marginBottom: 24 }}>지금 클랜을 만들면 시즌 1 첫 번째 클랜이 됩니다.</div>
              <a href="/clan/create" style={{ textDecoration: "none" }}><button className="btn-primary" style={{ padding: "10px 24px", fontSize: 13 }}>1호 클랜 만들기</button></a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((clan, i) => (
                <div key={clan.id} className={`cc-wrap ${rankingVisible ? "visible" : ""}`} style={{ transitionDelay: `${i * 0.09}s` }}>
                  <a href={`/clan/${clan.id}`} className="clan-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <div className="rank-badge" style={{ background: i===0?"#ff6b23":i===1?"#8892a4":i===2?"#cd7f32":"#1a2535", color: i<3?"#fff":"#8892a4" }}>{i+1}</div>
                      <ClanEmblem clan={clan} size={44} radius={8} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{clan.name}</span>
                          <span style={{ fontSize: 11, color: "#ff6b23", fontWeight: 600, opacity: 0.7 }}>[{clan.tag}]</span>
                          <ClanTierChip memberCount={clan.clan_members?.[0]?.count || 0} size={22} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5 }}>
                          <span className="tier-tag" style={{ borderColor: "rgba(255,107,35,0.4)", color: "#ff6b23" }}>{clan.tier}</span>
                          <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜원 {clan.clan_members?.[0]?.count || 0}명</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", color: "#ff6b23" }}>{clan.wins||0}승</div>
                        <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1 }}>{clan.points||0} PT</div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className={`reveal rd4 ${rankingVisible ? "visible" : ""}`} style={{ marginTop: 20, textAlign: "right" }}>
            <a href="/ranking" style={{ fontSize: 12, color: "#8892a4", textDecoration: "none", letterSpacing: 2, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 600, transition: "color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="#ff6b23"} onMouseLeave={e=>e.target.style.color="#8892a4"}>
              전체 랭킹 보기 →
            </a>
          </div>
        </section>

        {/* Divider */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px,5vw,48px)" }}>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,107,35,0.12),transparent)" }}/>
        </div>

        {/* ──────── CTA ──────── */}
        <section ref={ctaRef} style={{ padding: "clamp(60px,8vw,100px) clamp(20px,5vw,48px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,rgba(255,107,35,0.07) 0%,transparent 70%)", pointerEvents: "none" }}/>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,107,35,0.22),transparent)" }}/>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(255,107,35,0.12),transparent)" }}/>

          <div style={{ position: "relative" }}>
            <div className={`reveal ${ctaVisible?"visible":""}`} style={{ fontSize: 11, letterSpacing: 4, color: "#ff6b23", marginBottom: 20, fontWeight: 600 }}>지금 바로 시작</div>
            <h2 className={`reveal rd1 ${ctaVisible?"visible":""}`} style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: -1, marginBottom: 16, lineHeight: 1.1 }}>혼자 하는 오버워치는 이제 그만</h2>
            <p className={`reveal rd2 ${ctaVisible?"visible":""}`} style={{ fontSize: 15, color: "#8892a4", marginBottom: 40, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, lineHeight: 1.7 }}>
              클랜을 만들고, 대전에 참여하고, 명예를 쌓아라.
            </p>
            <div className={`reveal rd3 ${ctaVisible?"visible":""}`} style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/clan/create" style={{ textDecoration: "none" }}><button className="btn-primary">무료로 클랜 만들기</button></a>
              <a href="/find" style={{ textDecoration: "none" }}><button className="btn-secondary">클랜 둘러보기</button></a>
            </div>
          </div>
        </section>

        <footer style={{ padding: "28px clamp(20px,5vw,48px)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>© 2026 OVERCLAN — 비공식 팬 플랫폼</span>
          <div style={{ display: "flex", gap: 24 }}>
            {[{label:"이용약관",href:"/terms"},{label:"개인정보처리방침",href:"/privacy"},{label:"문의하기",href:"/contact"}].map(item => (
              <a key={item.label} href={item.href} style={{ fontSize: 11, color: "#8892a4", textDecoration: "none", letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif", transition: "color 0.2s" }}
                onMouseEnter={e=>e.target.style.color="#e8eaf0"} onMouseLeave={e=>e.target.style.color="#8892a4"}>
                {item.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
