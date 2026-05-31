import { useState } from "react";

const members = [
  { name: "Zenith", role: "클랜장", tier: "마스터", hero: "트레이서", wins: 18, joinDate: "시즌 1", online: true },
  { name: "IronFist", role: "부클랜장", tier: "마스터", hero: "라인하르트", wins: 16, joinDate: "시즌 1", online: true },
  { name: "NightHawk", role: "클랜원", tier: "다이아", hero: "위도우메이커", wins: 12, joinDate: "시즌 2", online: false },
  { name: "StarBlaze", role: "클랜원", tier: "다이아", hero: "메르시", wins: 14, joinDate: "시즌 2", online: true },
  { name: "ColdWave", role: "클랜원", tier: "플래티넘", hero: "겐지", wins: 9, joinDate: "시즌 3", online: false },
  { name: "DawnRider", role: "클랜원", tier: "마스터", hero: "아나", wins: 17, joinDate: "시즌 1", online: true },
];

const battles = [
  { opponent: "Iron Wolves", result: "승", score: "2-1", date: "5일 전", tier: "정규" },
  { opponent: "Code Red", result: "승", score: "3-0", date: "12일 전", tier: "정규" },
  { opponent: "Storm Legion", result: "패", score: "1-2", date: "19일 전", tier: "친선" },
  { opponent: "Dark Matter", result: "승", score: "2-0", date: "26일 전", tier: "정규" },
];

const tierColors = {
  "마스터": "#ff6b23",
  "다이아": "#4fc3f7",
  "플래티넘": "#b0bec5",
};

export default function OverClanProfile() {
  const [activeTab, setActiveTab] = useState("클랜원");

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link { color: #8892a4; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: color 0.2s; }
        .nav-link:hover { color: #ff6b23; }

        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,35,0.4); }

        .btn-secondary { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 11px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-secondary:hover { background: rgba(255,107,35,0.1); }

        .stat-box { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.12); padding: 20px 24px; clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%); text-align: center; }

        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .tab-btn:hover { color: #ff6b23; }

        .member-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 16px 20px; display: flex; align-items: center; gap: 16; transition: all 0.2s; cursor: pointer; }
        .member-row:hover { border-color: rgba(255,107,35,0.3); background: rgba(20,30,50,0.8); }

        .battle-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 16px 20px; display: flex; align-items: center; transition: all 0.2s; }
        .battle-row:hover { border-color: rgba(255,107,35,0.2); }

        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .role-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }

        .online-dot { width: 8px; height: 8px; border-radius: 50%; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .online { background: #4caf50; box-shadow: 0 0 6px #4caf50; animation: pulse 2s infinite; }
        .offline { background: #37474f; }

        .win-badge { color: #4caf50; font-weight: 700; font-size: 16px; font-family: 'Rajdhani', sans-serif; }
        .lose-badge { color: #ef5350; font-weight: 700; font-size: 16px; font-family: 'Rajdhani', sans-serif; }

        .hex-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0.4; z-index: 0; }
      `}</style>

      <svg className="hex-bg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="20" height="23" patternUnits="userSpaceOnUse">
            <polygon points="10,1 19,6 19,17 10,22 1,17 1,6" fill="none" stroke="rgba(255,107,35,0.08)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)"/>
      </svg>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* 네비게이션 */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid rgba(255,107,35,0.1)", background: "rgba(8,12,20,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="28" height="32" viewBox="0 0 32 36">
                <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
                <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
                <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
              </svg>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, fontFamily: "Rajdhani, sans-serif" }}>
                <span style={{ color: "#ff6b23" }}>OVER</span><span>CLAN</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 28 }}>
              {["클랜 찾기", "클랜대전", "랭킹", "명예의 전당"].map(item => (
                <span key={item} className="nav-link">{item}</span>
              ))}
            </div>
          </div>
          <button className="btn-primary">클랜 만들기</button>
        </nav>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px" }}>

          {/* 클랜 헤더 */}
          <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 40px", marginBottom: 28, position: "relative", clipPath: "polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))" }}>
            {/* 코너 장식 */}
            <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRight: "2px solid #ff6b23", borderTop: "2px solid #ff6b23" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, borderLeft: "2px solid #ff6b23", borderBottom: "2px solid #ff6b23" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {/* 클랜 배지 */}
              <div style={{ position: "relative" }}>
                <svg width="80" height="90" viewBox="0 0 80 90">
                  <polygon points="40,4 76,22 76,68 40,86 4,68 4,22" fill="rgba(255,107,35,0.1)" stroke="#ff6b23" strokeWidth="1.5"/>
                  <polygon points="40,16 64,30 64,60 40,74 16,60 16,30" fill="rgba(255,107,35,0.05)" stroke="rgba(255,107,35,0.4)" strokeWidth="1"/>
                  <text x="40" y="52" textAnchor="middle" fontSize="28">🔥</text>
                </svg>
              </div>

              {/* 클랜 정보 */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1 }}>Phoenix Squad</h1>
                  <span style={{ fontSize: 14, color: "#ff6b23", opacity: 0.6, fontWeight: 600 }}>[PHNX]</span>
                  <span style={{ background: "linear-gradient(135deg, #ff6b23, #ff8c42)", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "2px 8px", clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)" }}>PRO</span>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <span className="tier-tag" style={{ borderColor: "rgba(255,107,35,0.4)", color: "#ff6b23" }}>마스터</span>
                  <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>경쟁</span>
                  <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>저녁</span>
                </div>
                <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, lineHeight: 1.6, maxWidth: 480 }}>
                  진지하게 클랜대전 참여할 분 모집합니다. 마스터 이상 우대. 팀플레이와 소통을 중시하는 클랜이에요.
                </p>
              </div>

              {/* 가입 버튼 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn-primary">가입 신청</button>
                <button className="btn-secondary" style={{ padding: "10px 28px", fontSize: 13 }}>클랜대전 신청</button>
              </div>
            </div>
          </div>

          {/* 통계 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 32 }}>
            {[
              { label: "시즌 순위", value: "#1" },
              { label: "클랜원", value: "24명" },
              { label: "클랜대전 승", value: "18" },
              { label: "클랜대전 패", value: "3" },
              { label: "승률", value: "85.7%" },
            ].map(s => (
              <div key={s.label} className="stat-box">
                <div style={{ fontSize: 26, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 24, display: "flex", gap: 0 }}>
            {["클랜원", "클랜대전 기록"].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>

          {/* 클랜원 탭 */}
          {activeTab === "클랜원" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* 헤더 */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 16, padding: "8px 20px", fontSize: 11, color: "#8892a4", letterSpacing: 1, fontWeight: 600 }}>
                <span>닉네임</span>
                <span>역할</span>
                <span>티어</span>
                <span>주 영웅</span>
                <span>클랜대전 기여</span>
                <span>상태</span>
              </div>
              {members.map(m => (
                <div key={m.name} className="member-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 16, alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontFamily: "Rajdhani, sans-serif", fontSize: 15 }}>{m.name}</span>
                  <span className="role-tag" style={{
                    background: m.role === "클랜장" ? "rgba(255,107,35,0.2)" : m.role === "부클랜장" ? "rgba(79,195,247,0.1)" : "rgba(255,255,255,0.05)",
                    color: m.role === "클랜장" ? "#ff6b23" : m.role === "부클랜장" ? "#4fc3f7" : "#8892a4",
                    width: "fit-content",
                  }}>{m.role}</span>
                  <span className="tier-tag" style={{ borderColor: `${tierColors[m.tier]}44`, color: tierColors[m.tier], width: "fit-content" }}>{m.tier}</span>
                  <span style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{m.hero}</span>
                  <span style={{ fontSize: 15, color: "#ff6b23", fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{m.wins}승</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className={`online-dot ${m.online ? "online" : "offline"}`} />
                    <span style={{ fontSize: 11, color: m.online ? "#4caf50" : "#8892a4" }}>{m.online ? "온라인" : "오프라인"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 클랜대전 기록 탭 */}
          {activeTab === "클랜대전 기록" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px 100px", gap: 16, padding: "8px 20px", fontSize: 11, color: "#8892a4", letterSpacing: 1, fontWeight: 600 }}>
                <span>상대 클랜</span>
                <span>결과</span>
                <span>스코어</span>
                <span>종류</span>
                <span>날짜</span>
              </div>
              {battles.map((b, i) => (
                <div key={i} className="battle-row" style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px 100px", gap: 16, alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontFamily: "Rajdhani, sans-serif", fontSize: 15 }}>{b.opponent}</span>
                  <span className={b.result === "승" ? "win-badge" : "lose-badge"}>{b.result}</span>
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, color: "#e8eaf0", fontWeight: 600 }}>{b.score}</span>
                  <span style={{ fontSize: 11, color: b.tier === "정규" ? "#ff6b23" : "#8892a4", letterSpacing: 1 }}>{b.tier}</span>
                  <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{b.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
