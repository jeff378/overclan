"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";

const HexPattern = () => (
  <svg className="hex-pattern" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hexagons" x="0" y="0" width="20" height="23" patternUnits="userSpaceOnUse">
        <polygon points="10,1 19,6 19,17 10,22 1,17 1,6" fill="none" stroke="rgba(255,107,35,0.12)" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hexagons)"/>
  </svg>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("전체");
  const [scanLine, setScanLine] = useState(0);
  const [stats, setStats] = useState({ clans: 0, members: 0, battles: 0 });
  const [topClans, setTopClans] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      const { count: clanCount } = await supabase.from("clans").select("*", { count: "exact", head: true });
      const { count: memberCount } = await supabase.from("clan_members").select("*", { count: "exact", head: true });
      const { count: battleCount } = await supabase.from("clan_battles").select("*", { count: "exact", head: true });
      setStats({ clans: clanCount || 0, members: memberCount || 0, battles: battleCount || 0 });

      const { data: clans } = await supabase.from("clans").select("*, clan_members(count)").order("points", { ascending: false }).limit(4);
      setTopClans(clans || []);
    };
    loadStats();
  }, []);

  const statItems = [
    { label: "활성 클랜", value: stats.clans.toLocaleString() },
    { label: "총 클랜원", value: stats.members.toLocaleString() },
    { label: "총 클랜대전", value: stats.battles.toLocaleString() },
  ];

  const filtered = activeTab === "전체" ? topClans : topClans.filter(c => {
    const count = c.clan_members?.[0]?.count || 0;
    if (activeTab === "소규모") return count <= 10;
    if (activeTab === "중규모") return count > 10 && count <= 25;
    if (activeTab === "대규모") return count > 25;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hex-pattern { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .glow-orange { color: #ff6b23; text-shadow: 0 0 20px rgba(255,107,35,0.6); }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,35,0.4); }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 11px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,107,35,0.1); }
        .clan-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 20px 24px; position: relative; transition: all 0.3s; cursor: pointer; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); text-decoration: none; color: inherit; display: block; }
        .clan-card:hover { border-color: rgba(255,107,35,0.5); background: rgba(20,30,50,0.9); transform: translateX(4px); box-shadow: -4px 0 0 #ff6b23; }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .stat-card { background: rgba(13,20,35,0.6); border: 1px solid rgba(79,195,247,0.15); padding: 20px 24px; text-align: center; clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%); }
        .rank-badge { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
        .tier-tag { font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .hero-title { font-size: clamp(48px, 8vw, 96px); font-weight: 700; line-height: 0.9; letter-spacing: -2px; font-family: 'Rajdhani', sans-serif; }
        .scan-line { position: fixed; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,107,35,0.3), transparent); pointer-events: none; z-index: 1; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeInUp 0.6s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .live-dot { width: 6px; height: 6px; background: #4caf50; border-radius: 50%; animation: pulse-glow 1.5s infinite; box-shadow: 0 0 8px #4caf50; }
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: inline; }
          .hero-title { font-size: clamp(36px, 12vw, 72px) !important; }
          .stat-card { padding: 14px 10px !important; }
          .stat-card > div:first-child { font-size: 22px !important; }
          .stat-card > div:last-child { font-size: 10px !important; white-space: nowrap; }
          .clan-card { padding: 14px 16px !important; }
          .tab-btn { padding: 6px 10px !important; font-size: 11px !important; letter-spacing: 0.5px !important; }
        }
      `}</style>

      <HexPattern />
      <div className="scan-line" style={{ top: `${scanLine}%` }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 20% 20%, rgba(255,107,35,0.06) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />

        <section style={{ padding: "clamp(40px, 6vw, 80px) clamp(20px, 5vw, 48px) clamp(32px, 5vw, 64px)", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, letterSpacing: 3, color: "#4caf50", fontWeight: 600 }}>SEASON 1 진행중</span>
          </div>
          <div className="hero-title animate-in">
            <div style={{ color: "#e8eaf0" }}>같이 싸울</div>
            <div><span className="glow-orange">클랜</span><span style={{ color: "#e8eaf0" }}>을 찾아라</span></div>
          </div>
          <p className="animate-in delay-1" style={{ marginTop: 24, fontSize: 16, color: "#8892a4", lineHeight: 1.7, maxWidth: 480, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
            오버워치를 같이 할 클랜을 찾아보세요.
          </p>
          <div className="animate-in delay-2" style={{ display: "flex", gap: 12, marginTop: 36 }}>
            <a href="/clan/create" style={{ textDecoration: "none" }}><button className="btn-primary" style={{whiteSpace:"nowrap"}}>클랜 만들기</button></a>
            <a href="/find" style={{ textDecoration: "none" }}><button className="btn-secondary" style={{whiteSpace:"nowrap"}}>클랜 찾기</button></a>
          </div>

          {/* 실제 DB 통계 */}
          <div className="animate-in delay-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 60, maxWidth: 600 }}>
            {statItems.map(stat => (
              <div key={stat.label} className="stat-card">
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#ff6b23", letterSpacing: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 랭킹 섹션 */}
        <section style={{ padding: "0 clamp(16px, 4vw, 48px) clamp(40px, 6vw, 80px)", maxWidth: 1200, margin: "0 auto", minHeight: 300 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", fontFamily: "Rajdhani, sans-serif" }}>시즌 랭킹</h2>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[{k:"전체",v:"전체"},{k:"소규모",v:"소"},{k:"중규모",v:"중"},{k:"대규모",v:"대"}].map(tab => (
                <button key={tab.k} className={`tab-btn ${activeTab === tab.k ? "active" : ""}`} onClick={() => setActiveTab(tab.k)} style={{minWidth: 0}}><span className="desktop-only">{tab.k}</span><span className="mobile-only">{tab.v}</span></button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", background: "rgba(13,20,35,0.5)", border: "1px dashed rgba(255,107,35,0.15)" }}>
              아직 클랜이 없어요. 첫 번째 클랜을 만들어보세요!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((clan, i) => (
                <a key={clan.id} href={`/clan/${clan.id}`} className="clan-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div className="rank-badge" style={{ background: i === 0 ? "#ff6b23" : i === 1 ? "#8892a4" : i === 2 ? "#cd7f32" : "#1a2535", color: i < 3 ? "#fff" : "#8892a4", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                    <div style={{ fontSize: 28 }}>{clan.badge}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{clan.name}</span>
                        <span style={{ fontSize: 11, color: "#ff6b23", fontWeight: 600, opacity: 0.7 }}>[{clan.tag}]</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                        <span className="tier-tag" style={{ borderColor: "rgba(255,107,35,0.4)", color: "#ff6b23", fontSize: 10 }}>{clan.tier}</span>
                        <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜원 {clan.clan_members?.[0]?.count || 0}명</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#ff6b23" }}>{clan.wins || 0}승</div>
                      <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1 }}>{clan.points || 0} PT</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section style={{ padding: "60px 48px", background: "rgba(255,107,35,0.05)", borderTop: "1px solid rgba(255,107,35,0.1)", borderBottom: "1px solid rgba(255,107,35,0.1)", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#ff6b23", marginBottom: 16, fontWeight: 600 }}>지금 바로 시작</div>
          <h2 style={{ fontSize: 40, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", letterSpacing: -1, marginBottom: 12 }}>혼자 하는 오버워치는 이제 그만</h2>
          <p style={{ fontSize: 15, color: "#8892a4", marginBottom: 32, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>클랜을 만들고, 대전에 참여하고, 명예를 쌓아라.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href="/clan/create" style={{ textDecoration: "none" }}><button className="btn-primary" style={{ padding: "11px 24px", fontSize: 13, whiteSpace: "nowrap" }}>무료로 클랜 만들기</button></a>
            <a href="/find" style={{ textDecoration: "none" }}><button className="btn-secondary" style={{ padding: "11px 24px", fontSize: 13, whiteSpace: "nowrap" }}>클랜 둘러보기</button></a>
          </div>
        </section>

        <footer style={{ padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>© 2026 OVERCLAN — 비공식 팬 플랫폼</span>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "이용약관", href: "/terms" },
              { label: "개인정보처리방침", href: "/privacy" },
              { label: "문의하기", href: "/contact" },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ fontSize: 11, color: "#8892a4", textDecoration: "none", letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif", transition: "color 0.2s" }}>{item.label}</a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
