import { useState } from "react";

const rankings = {
  "전체": [
    { rank: 1, name: "Phoenix Squad", tag: "PHNX", badge: "🔥", tier: "마스터+", wins: 18, losses: 3, points: 2840, members: 24, change: "same" },
    { rank: 2, name: "Iron Wolves", tag: "IRON", badge: "🐺", tier: "다이아", wins: 14, losses: 5, points: 2210, members: 19, change: "up" },
    { rank: 3, name: "Dark Matter", tag: "DARK", badge: "🌑", tier: "다이아", wins: 13, losses: 6, points: 2080, members: 22, change: "down" },
    { rank: 4, name: "Code Red", tag: "CRED", badge: "🔴", tier: "마스터+", wins: 16, losses: 8, points: 1990, members: 9, change: "up" },
    { rank: 5, name: "Storm Legion", tag: "STRM", badge: "⚡", tier: "플래티넘", wins: 11, losses: 7, points: 1760, members: 31, change: "down" },
    { rank: 6, name: "Silent Edge", tag: "EDGE", badge: "🗡️", tier: "마스터+", wins: 9, losses: 5, points: 1540, members: 12, change: "same" },
    { rank: 7, name: "Nova Force", tag: "NOVA", badge: "✨", tier: "골드", wins: 5, losses: 8, points: 820, members: 8, change: "up" },
    { rank: 8, name: "Sunrise Club", tag: "SUN", badge: "🌅", tier: "플래티넘", wins: 7, losses: 10, points: 760, members: 15, change: "down" },
  ],
};

const tierColors = {
  "마스터+": "#ff6b23",
  "다이아": "#4fc3f7",
  "플래티넘": "#b0bec5",
  "골드": "#ffd54f",
};

const rankMedal = { 1: "🥇", 2: "🥈", 3: "🥉" };

const ChangeIcon = ({ change }) => {
  if (change === "up") return <span style={{ color: "#4caf50", fontSize: 12 }}>▲</span>;
  if (change === "down") return <span style={{ color: "#ef5350", fontSize: 12 }}>▼</span>;
  return <span style={{ color: "#8892a4", fontSize: 12 }}>—</span>;
};

export default function OverClanRanking() {
  const [league, setLeague] = useState("전체");
  const data = rankings["전체"];

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link { color: #8892a4; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: color 0.2s; }
        .nav-link:hover { color: #ff6b23; }

        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }

        .league-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 20px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .league-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .league-btn:hover { border-color: rgba(255,107,35,0.4); color: #e8eaf0; }

        .rank-row { background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.08); padding: 18px 24px; display: grid; grid-template-columns: 60px 48px 2fr 1fr 1fr 1fr 1fr 80px; gap: 16px; align-items: center; transition: all 0.2s; cursor: pointer; }
        .rank-row:hover { border-color: rgba(255,107,35,0.3); background: rgba(20,30,50,0.8); transform: translateX(4px); box-shadow: -3px 0 0 rgba(255,107,35,0.5); }

        .podium-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.2); padding: 28px 24px; text-align: center; position: relative; transition: all 0.3s; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); cursor: pointer; }
        .podium-card:hover { border-color: rgba(255,107,35,0.5); box-shadow: 0 8px 32px rgba(255,107,35,0.15); transform: translateY(-4px); }
        .podium-card.first { border-color: rgba(255,107,35,0.4); background: rgba(255,107,35,0.06); }

        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }

        .win-rate-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; margin-top: 6px; }
        .win-rate-fill { height: 100%; background: linear-gradient(90deg, #ff6b23, #ff8c42); border-radius: 2px; }

        .hex-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }

        @keyframes shimmer { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        .crown { animation: shimmer 2s infinite; }

        .points-badge { background: rgba(255,107,35,0.1); border: 1px solid rgba(255,107,35,0.2); padding: 3px 10px; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); font-size: 14px; font-weight: 700; color: #ff6b23; font-family: 'Rajdhani', sans-serif; }
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
                <span key={item} className="nav-link" style={i === 2 ? { color: "#ff6b23" } : {}}>{item}</span>
              ))}
            </div>
          </div>
          <button className="btn-primary">클랜 만들기</button>
        </nav>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px" }}>

          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif" }}>시즌 3 랭킹</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["전체", "소규모", "중규모", "대규모"].map(l => (
                <button key={l} className={`league-btn ${league === l ? "active" : ""}`} onClick={() => setLeague(l)}>{l}</button>
              ))}
            </div>
          </div>

          {/* 포디움 TOP 3 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 12, marginBottom: 40, alignItems: "end" }}>
            {/* 2위 */}
            <div className="podium-card" style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 8 }}>2ND</div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{top3[1].badge}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 6 }}>{top3[1].name}</div>
              <div style={{ marginBottom: 10 }}>
                <span className="tier-tag" style={{ borderColor: `${tierColors[top3[1].tier]}44`, color: tierColors[top3[1].tier] }}>{top3[1].tier}</span>
              </div>
              <div className="points-badge">{top3[1].points.toLocaleString()} PT</div>
              <div style={{ marginTop: 10, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                {top3[1].wins}승 {top3[1].losses}패
              </div>
            </div>

            {/* 1위 */}
            <div className="podium-card first">
              <div className="crown" style={{ fontSize: 24, marginBottom: 4 }}>👑</div>
              <div style={{ fontSize: 11, color: "#ff6b23", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>1ST</div>
              <div style={{ fontSize: 48, marginBottom: 10 }}>{top3[0].badge}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 6, color: "#ff6b23" }}>{top3[0].name}</div>
              <div style={{ marginBottom: 12 }}>
                <span className="tier-tag" style={{ borderColor: "rgba(255,107,35,0.5)", color: "#ff6b23" }}>{top3[0].tier}</span>
              </div>
              <div className="points-badge" style={{ fontSize: 16 }}>{top3[0].points.toLocaleString()} PT</div>
              <div style={{ marginTop: 10, fontSize: 14, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
                {top3[0].wins}승 {top3[0].losses}패
              </div>
            </div>

            {/* 3위 */}
            <div className="podium-card" style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 8 }}>3RD</div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{top3[2].badge}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 6 }}>{top3[2].name}</div>
              <div style={{ marginBottom: 10 }}>
                <span className="tier-tag" style={{ borderColor: `${tierColors[top3[2].tier]}44`, color: tierColors[top3[2].tier] }}>{top3[2].tier}</span>
              </div>
              <div className="points-badge">{top3[2].points.toLocaleString()} PT</div>
              <div style={{ marginTop: 10, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                {top3[2].wins}승 {top3[2].losses}패
              </div>
            </div>
          </div>

          {/* 나머지 순위 */}
          <div>
            {/* 테이블 헤더 */}
            <div style={{ display: "grid", gridTemplateColumns: "60px 48px 2fr 1fr 1fr 1fr 1fr 80px", gap: 16, padding: "8px 24px", fontSize: 11, color: "#8892a4", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>
              <span>순위</span>
              <span></span>
              <span>클랜</span>
              <span>티어</span>
              <span>승</span>
              <span>패</span>
              <span>클랜원</span>
              <span style={{ textAlign: "right" }}>포인트</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {rest.map(clan => {
                const winRate = Math.round((clan.wins / (clan.wins + clan.losses)) * 100);
                return (
                  <div key={clan.name} className="rank-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#8892a4" }}>#{clan.rank}</span>
                      <ChangeIcon change={clan.change} />
                    </div>
                    <div style={{ fontSize: 28 }}>{clan.badge}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{clan.name}</span>
                        <span style={{ fontSize: 11, color: "#ff6b23", opacity: 0.5, fontWeight: 600 }}>[{clan.tag}]</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#8892a4" }}>승률 {winRate}%</span>
                        <div className="win-rate-bar" style={{ width: 60 }}>
                          <div className="win-rate-fill" style={{ width: `${winRate}%` }} />
                        </div>
                      </div>
                    </div>
                    <span className="tier-tag" style={{ borderColor: `${tierColors[clan.tier]}44`, color: tierColors[clan.tier], width: "fit-content" }}>{clan.tier}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#4caf50", fontFamily: "Rajdhani, sans-serif" }}>{clan.wins}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#ef5350", fontFamily: "Rajdhani, sans-serif" }}>{clan.losses}</span>
                    <span style={{ fontSize: 14, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{clan.members}명</span>
                    <div className="points-badge" style={{ textAlign: "center", fontSize: 13 }}>{clan.points.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
