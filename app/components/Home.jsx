"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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

const clans = [
  { name: "Phoenix Squad", tag: "PHNX", tier: "마스터", members: 24, wins: 18, rank: 1, badge: "🔥" },
  { name: "Iron Wolves", tag: "IRON", tier: "다이아", members: 19, wins: 14, rank: 2, badge: "🐺" },
  { name: "Storm Legion", tag: "STRM", tier: "플래티넘", members: 31, wins: 11, rank: 3, badge: "⚡" },
  { name: "Silent Edge", tag: "EDGE", tier: "마스터", members: 12, wins: 9, rank: 4, badge: "🗡️" },
];

const stats = [
  { label: "활성 클랜", value: "1,247" },
  { label: "총 클랜원", value: "18,392" },
  { label: "이번 시즌 클랜전", value: "3,841" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("전체");
  const [scanLine, setScanLine] = useState(0);
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        supabase.from("profiles").select("nickname").eq("id", data.user.id).single().then(({ data: profile }) => {
          if (profile) setNickname(profile.nickname);
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNickname("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hex-pattern { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .glow-orange { color: #ff6b23; text-shadow: 0 0 20px rgba(255,107,35,0.6); }
        .nav-link { color: #8892a4; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #ff6b23; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,35,0.4); }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 11px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,107,35,0.1); }
        .clan-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 20px 24px; position: relative; transition: all 0.3s; cursor: pointer; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); }
        .clan-card:hover { border-color: rgba(255,107,35,0.5); background: rgba(20,30,50,0.9); transform: translateX(4px); box-shadow: -4px 0 0 #ff6b23, 0 0 30px rgba(255,107,35,0.15); }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .tab-btn:hover { color: #ff6b23; }
        .stat-card { background: rgba(13,20,35,0.6); border: 1px solid rgba(79,195,247,0.15); padding: 20px 24px; text-align: center; position: relative; clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%); }
        .rank-badge { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
        .tier-tag { font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .hero-title { font-size: clamp(48px, 8vw, 96px); font-weight: 700; line-height: 0.9; letter-spacing: -2px; font-family: 'Rajdhani', sans-serif; }
        .scan-line { position: fixed; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,107,35,0.3), transparent); pointer-events: none; z-index: 1; }
        .user-badge { display: flex; align-items: center; gap: 10px; background: rgba(255,107,35,0.08); border: 1px solid rgba(255,107,35,0.2); padding: 8px 16px; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn-logout { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; transition: color 0.2s; }
        .btn-logout:hover { color: #ef5350; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeInUp 0.6s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .delay-4 { animation-delay: 0.4s; opacity: 0; }
        .live-dot { width: 6px; height: 6px; background: #4caf50; border-radius: 50%; animation: pulse-glow 1.5s infinite; box-shadow: 0 0 8px #4caf50; }
      `}</style>

      <HexPattern />
      <div className="scan-line" style={{ top: `${scanLine}%` }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 20% 20%, rgba(255,107,35,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(79,195,247,0.04) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* 네비게이션 */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid rgba(255,107,35,0.1)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="32" height="36" viewBox="0 0 32 36">
                <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
                <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
                <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
              </svg>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 3, fontFamily: "Rajdhani, sans-serif" }}>
                <span className="glow-orange">OVER</span><span style={{ color: "#e8eaf0" }}>CLAN</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 28, marginLeft: 16 }}>
              {["클랜 찾기", "클랜대전", "랭킹", "명예의 전당"].map(item => (
                <span key={item} className="nav-link">{item}</span>
              ))}
            </div>
          </div>

          {/* 로그인 상태에 따라 다르게 표시 */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="user-badge">
                <div style={{ width: 8, height: 8, background: "#4caf50", borderRadius: "50%", boxShadow: "0 0 6px #4caf50" }} />
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, color: "#e8eaf0" }}>{nickname || "클랜원"}</span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <a href="/login"><button className="btn-secondary">로그인</button></a>
              <a href="/signup"><a href="/clan/create" style={{textDecoration:"none"}}><button className="btn-primary">클랜 만들기</button></a></a>
            </div>
          )}
        </nav>

        {/* 히어로 섹션 */}
        <section style={{ padding: "80px 48px 64px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, letterSpacing: 3, color: "#4caf50", fontWeight: 600 }}>SEASON 3 진행중</span>
          </div>
          <div className="hero-title animate-in">
            <div style={{ color: "#e8eaf0" }}>같이 싸울</div>
            <div className="glow-orange">클랜</div>
            <div style={{ color: "#e8eaf0" }}>을 찾아라</div>
          </div>
          <p className="animate-in delay-1" style={{ marginTop: 24, fontSize: 16, color: "#8892a4", lineHeight: 1.7, maxWidth: 480, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
            오버워치 최초의 클랜 플랫폼.<br/>혼자였던 게임이 함께하는 전쟁이 된다.
          </p>
          <div className="animate-in delay-2" style={{ display: "flex", gap: 12, marginTop: 36 }}>
            <a href="/clan/create" style={{textDecoration:"none"}}><button className="btn-primary">클랜 만들기</button></a>
            <a href="/find" style={{textDecoration:"none"}}><button className="btn-secondary">클랜 찾기</button></a>
          </div>
          <div className="animate-in delay-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 60, maxWidth: 600 }}>
            {stats.map(stat => (
              <div key={stat.label} className="stat-card">
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#ff6b23", letterSpacing: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 랭킹 섹션 */}
        <section style={{ padding: "0 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", fontFamily: "Rajdhani, sans-serif" }}>시즌 랭킹</h2>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["전체", "소규모", "중규모", "대규모"].map(tab => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clans.map((clan, i) => (
              <div key={clan.name} className={`clan-card animate-in delay-${i + 1}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div className="rank-badge" style={{ background: clan.rank === 1 ? "#ff6b23" : clan.rank === 2 ? "#8892a4" : clan.rank === 3 ? "#cd7f32" : "#1a2535", color: clan.rank <= 3 ? "#fff" : "#8892a4", fontSize: 12, fontWeight: 700 }}>{clan.rank}</div>
                  <div style={{ fontSize: 28 }}>{clan.badge}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{clan.name}</span>
                      <span style={{ fontSize: 11, color: "#ff6b23", fontWeight: 600, opacity: 0.7 }}>[{clan.tag}]</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                      <span className="tier-tag" style={{ borderColor: clan.tier === "마스터" ? "rgba(255,107,35,0.5)" : "rgba(79,195,247,0.3)", color: clan.tier === "마스터" ? "#ff6b23" : "#4fc3f7", fontSize: 10 }}>{clan.tier}</span>
                      <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜원 {clan.members}명</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#ff6b23" }}>{clan.wins}승</div>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1 }}>이번 시즌</div>
                  </div>
                  <div style={{ color: "#ff6b23", fontSize: 18, opacity: 0.4, marginLeft: 8 }}>›</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "60px 48px", background: "rgba(255,107,35,0.05)", borderTop: "1px solid rgba(255,107,35,0.1)", borderBottom: "1px solid rgba(255,107,35,0.1)", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#ff6b23", marginBottom: 16, fontWeight: 600 }}>지금 바로 시작</div>
          <h2 style={{ fontSize: 40, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", letterSpacing: -1, marginBottom: 12 }}>혼자 하는 오버워치는 이제 그만</h2>
          <p style={{ fontSize: 15, color: "#8892a4", marginBottom: 32, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>클랜을 만들고, 대전에 참여하고, 명예를 쌓아라.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href="/clan/create" style={{textDecoration:"none"}}><button className="btn-primary" style={{ padding: "14px 36px", fontSize: 15 }}>무료로 클랜 만들기</button></a>
            <button className="btn-secondary" style={{ padding: "14px 36px", fontSize: 15 }}>클랜 둘러보기</button>
          </div>
        </section>

        {/* 푸터 */}
        <footer style={{ padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>© 2025 OVERCLAN — 비공식 팬 플랫폼</span>
          <div style={{ display: "flex", gap: 24 }}>
            {["이용약관", "개인정보처리방침", "문의하기"].map(item => (
              <span key={item} style={{ fontSize: 11, color: "#8892a4", cursor: "pointer", letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{item}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
