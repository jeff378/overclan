import { useState } from "react";

const upcomingBattles = [
  { clan1: "Phoenix Squad", clan2: "Iron Wolves", badge1: "🔥", badge2: "🐺", date: "6월 3일 (월)", time: "21:00", type: "정규", tier1: "마스터+", tier2: "다이아", status: "예정" },
  { clan1: "Storm Legion", clan2: "Dark Matter", badge1: "⚡", badge2: "🌑", date: "6월 4일 (화)", time: "22:00", type: "친선", tier1: "플래티넘", tier2: "다이아", status: "예정" },
  { clan1: "Code Red", clan2: "Silent Edge", badge1: "🔴", badge2: "🗡️", date: "6월 5일 (수)", time: "23:00", type: "정규", tier1: "마스터+", tier2: "마스터+", status: "예정" },
];

const recentBattles = [
  { clan1: "Phoenix Squad", clan2: "Code Red", badge1: "🔥", badge2: "🔴", score: "2-1", winner: "Phoenix Squad", date: "5일 전", type: "정규" },
  { clan1: "Iron Wolves", clan2: "Nova Force", badge1: "🐺", badge2: "✨", score: "3-0", winner: "Iron Wolves", date: "7일 전", type: "친선" },
  { clan1: "Storm Legion", clan2: "Phoenix Squad", badge1: "⚡", badge2: "🔥", score: "1-2", winner: "Phoenix Squad", date: "12일 전", type: "정규" },
  { clan1: "Dark Matter", clan2: "Silent Edge", badge1: "🌑", badge2: "🗡️", score: "2-2", winner: "무승부", date: "14일 전", type: "친선" },
];

const tierColors = {
  "마스터+": "#ff6b23",
  "다이아": "#4fc3f7",
  "플래티넘": "#b0bec5",
};

export default function OverClanBattle() {
  const [activeTab, setActiveTab] = useState("예정 대전");

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link { color: #8892a4; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: color 0.2s; }
        .nav-link:hover { color: #ff6b23; }

        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,35,0.4); }

        .battle-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.12); padding: 28px 32px; position: relative; transition: all 0.3s; clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
        .battle-card:hover { border-color: rgba(255,107,35,0.35); box-shadow: 0 0 30px rgba(255,107,35,0.08); }

        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .tab-btn:hover { color: #ff6b23; }

        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .type-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 3px 10px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }

        .btn-apply { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 8px 20px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; white-space: nowrap; }
        .btn-apply:hover { background: rgba(255,107,35,0.15); }

        .vs-divider { display: flex; flex-direction: column; align-items: center; gap: 6; }

        @keyframes glow-pulse { 0%, 100% { text-shadow: 0 0 10px rgba(255,107,35,0.5); } 50% { text-shadow: 0 0 20px rgba(255,107,35,0.9), 0 0 40px rgba(255,107,35,0.4); } }
        .vs-text { font-size: 22px; font-weight: 700; color: #ff6b23; font-family: 'Rajdhani', sans-serif; letter-spacing: 2px; animation: glow-pulse 2s infinite; }

        .stat-card { background: rgba(13,20,35,0.6); border: 1px solid rgba(79,195,247,0.12); padding: 18px 24px; clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%); text-align: center; }

        .hex-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
      `}</style>

      <svg className="hex-bg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" x="0" y="0" width="20" height="23" patternUnits="userSpaceOnUse">
            <polygon points="10,1 19,6 19,17 10,22 1,17 1,6" fill="none" stroke="rgba(255,107,35,0.07)" strokeWidth="0.5"/>
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
              {["클랜 찾기", "클랜대전", "랭킹", "명예의 전당"].map((item, i) => (
                <span key={item} className="nav-link" style={i === 1 ? { color: "#ff6b23" } : {}}>{item}</span>
              ))}
            </div>
          </div>
          <button className="btn-primary">클랜대전 신청</button>
        </nav>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px" }}>

          {/* 헤더 */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif" }}>클랜대전</h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, background: "#ff6b23", borderRadius: "50%", boxShadow: "0 0 8px #ff6b23" }} />
                <span style={{ fontSize: 11, color: "#ff6b23", letterSpacing: 2, fontWeight: 600 }}>SEASON 3</span>
                <span style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1 }}>| 정규 클랜대전 D-12</span>
              </div>
            </div>
          </div>

          {/* 시즌 통계 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 36 }}>
            {[
              { label: "이번 시즌 총 대전", value: "284" },
              { label: "참여 클랜 수", value: "67" },
              { label: "이번 주 대전", value: "38" },
              { label: "오늘 예정 대전", value: "5" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 26, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 28, display: "flex", gap: 0 }}>
            {["예정 대전", "최근 대전 결과"].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>

          {/* 예정 대전 */}
          {activeTab === "예정 대전" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcomingBattles.map((b, i) => (
                <div key={i} className="battle-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>

                    {/* 클랜 1 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ fontSize: 36 }}>{b.badge1}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 4 }}>{b.clan1}</div>
                        <span className="tier-tag" style={{ borderColor: `${tierColors[b.tier1]}44`, color: tierColors[b.tier1] }}>{b.tier1}</span>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="vs-divider">
                      <span className="vs-text">VS</span>
                      <span className="type-tag" style={{
                        background: b.type === "정규" ? "rgba(255,107,35,0.15)" : "rgba(255,255,255,0.05)",
                        color: b.type === "정규" ? "#ff6b23" : "#8892a4",
                      }}>{b.type}</span>
                    </div>

                    {/* 클랜 2 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-end", flexDirection: "row-reverse" }}>
                      <div style={{ fontSize: 36 }}>{b.badge2}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 4 }}>{b.clan2}</div>
                        <span className="tier-tag" style={{ borderColor: `${tierColors[b.tier2]}44`, color: tierColors[b.tier2] }}>{b.tier2}</span>
                      </div>
                    </div>

                    {/* 일정 & 버튼 */}
                    <div style={{ borderLeft: "1px solid rgba(255,107,35,0.1)", paddingLeft: 24, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 140 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontFamily: "Noto Sans KR, sans-serif", color: "#8892a4", marginBottom: 2 }}>{b.date}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{b.time}</div>
                      </div>
                      <button className="btn-apply">관전하기</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 대전 신청 CTA */}
              <div style={{ background: "rgba(255,107,35,0.05)", border: "1px dashed rgba(255,107,35,0.2)", padding: "28px", textAlign: "center", marginTop: 8 }}>
                <div style={{ fontSize: 14, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 16 }}>
                  우리 클랜도 클랜대전에 참여해보세요!
                </div>
                <button className="btn-primary">클랜대전 신청하기</button>
              </div>
            </div>
          )}

          {/* 최근 대전 결과 */}
          {activeTab === "최근 대전 결과" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentBattles.map((b, i) => (
                <div key={i} className="battle-card" style={{ padding: "20px 32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

                    {/* 클랜 1 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{b.badge1}</span>
                      <span style={{
                        fontSize: 16, fontWeight: 700, fontFamily: "Rajdhani, sans-serif",
                        color: b.winner === b.clan1 ? "#ff6b23" : "#8892a4",
                      }}>{b.clan1}</span>
                      {b.winner === b.clan1 && <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>WIN</span>}
                    </div>

                    {/* 스코어 */}
                    <div style={{ textAlign: "center", minWidth: 80 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#e8eaf0" }}>{b.score}</div>
                      <span className="type-tag" style={{
                        background: b.type === "정규" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.04)",
                        color: b.type === "정규" ? "#ff6b23" : "#8892a4",
                        fontSize: 9,
                      }}>{b.type}</span>
                    </div>

                    {/* 클랜 2 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                      {b.winner === b.clan2 && <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>WIN</span>}
                      <span style={{
                        fontSize: 16, fontWeight: 700, fontFamily: "Rajdhani, sans-serif",
                        color: b.winner === b.clan2 ? "#ff6b23" : "#8892a4",
                      }}>{b.clan2}</span>
                      <span style={{ fontSize: 28 }}>{b.badge2}</span>
                    </div>

                    {/* 날짜 */}
                    <div style={{ borderLeft: "1px solid rgba(255,107,35,0.1)", paddingLeft: 20, fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", minWidth: 80, textAlign: "right" }}>
                      {b.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
