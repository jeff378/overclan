"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";
import ClanBadge, { getBadgeTier } from "./ClanBadge";

const tierColors = {
  "마스터": "#ff6b23", "그랜드마스터": "#ff9800", "챔피언": "#ffd700", "다이아": "#4fc3f7", "플래티넘": "#b0bec5",
  "골드": "#ffd54f", "실버": "#90a4ae", "브론즈": "#a1887f",
};

export default function OverClanRanking() {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState("전체");
  const [mode, setMode] = useState("시즌"); // "시즌" | "누적"

  useEffect(() => {
    const load = async () => {
      const orderCol = mode === "시즌" ? "points" : "wins";
      const { data } = await supabase
        .from("clans")
        .select("*, clan_members(count)")
        .order(orderCol, { ascending: false });
      setClans(data || []);
      setLoading(false);
    };
    setLoading(true);
    load();
  }, [mode]);

  const filtered = clans.filter(c => {
    const count = c.clan_members?.[0]?.count || 0;
    if (league === "소규모") return count <= 10;
    if (league === "중규모") return count > 10 && count <= 25;
    if (league === "대규모") return count > 25;
    return true;
  });

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .mode-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 24px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; white-space: nowrap; }
        .mode-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .league-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 20px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; white-space: nowrap; }
        .league-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        @media (max-width: 640px) {
          .mode-btn { padding: 7px 16px; font-size: 12px; letter-spacing: 1px; }
          .league-btn { padding: 7px 14px; font-size: 11px; letter-spacing: 1px; }
          .rank-row { padding: 12px 14px; gap: 10px; }
          .hall-row { padding: 14px 16px; gap: 12px; clip-path: none; }
          .podium-card { padding: 16px 12px; }
        }
        .rank-row { background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.08); padding: 16px 24px; display: flex; align-items: center; gap: 16px; transition: all 0.2s; cursor: pointer; text-decoration: none; color: inherit; }
        .rank-row:hover { border-color: rgba(255,107,35,0.3); transform: translateX(4px); box-shadow: -3px 0 0 rgba(255,107,35,0.5); }
        .podium-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.2); padding: 24px 20px; text-align: center; position: relative; transition: all 0.3s; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); cursor: pointer; }
        .podium-card:hover { border-color: rgba(255,107,35,0.5); transform: translateY(-4px); }
        .podium-card.first { border-color: rgba(255,107,35,0.4); background: rgba(255,107,35,0.06); }
        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .points-badge { background: rgba(255,107,35,0.1); border: 1px solid rgba(255,107,35,0.2); padding: 3px 10px; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); font-size: 14px; font-weight: 700; color: #ff6b23; font-family: 'Rajdhani', sans-serif; }
        @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .crown { animation: shimmer 2s infinite; }
        .hall-row { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 20px 28px; display: flex; align-items: center; gap: 20px; transition: all 0.3s; cursor: pointer; text-decoration: none; color: inherit; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); }
        .hall-row:hover { border-color: rgba(255,107,35,0.5); transform: translateX(4px); box-shadow: -4px 0 0 #ff6b23; }
        @keyframes shimmer2 { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .gold { color: #ffd700; animation: shimmer2 2s infinite; }
        .silver { color: #c0c0c0; }
        .bronze { color: #cd7f32; }
      `}</style>

      <Navbar active="랭킹" />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(24px, 4vw, 48px) clamp(16px, 4vw, 32px)" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif" }}>랭킹</h1>
          </div>
          {/* 모드 탭 */}
          <div style={{ display: "flex", gap: 6 }}>
            {["시즌", "누적"].map(m => (
              <button key={m} className={`mode-btn ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>{m} 랭킹</button>
            ))}
          </div>
        </div>

        {/* 시즌 랭킹 설명 + 규모 필터 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {mode === "시즌" ? (
              <>
                <span style={{ fontSize: 11, color: "#4caf50", fontFamily: "Noto Sans KR, sans-serif", background: "rgba(76,175,80,0.1)", padding: "3px 10px", borderRadius: 2 }}>정규전 승리 +3점</span>
                <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 2 }}>무승부 +1점</span>
                <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 2 }}>친선전 미반영</span>
              </>
            ) : (
              <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 2 }}>클랜대전 누적 승수 기준</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", flexShrink: 0 }}>
            {["전체", "소규모", "중규모", "대규모"].map(l => (
              <button key={l} className={`league-btn ${league === l ? "active" : ""}`} onClick={() => setLeague(l)}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            아직 클랜이 없어요. 첫 번째 클랜을 만들어보세요!
          </div>
        ) : mode === "시즌" ? (
          <>
            {/* TOP 3 포디움 */}
            {top3.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: top3.length === 1 ? "1fr" : top3.length === 2 ? "1fr 1.1fr" : "1fr 1.15fr 1fr", gap: 12, marginBottom: 36, alignItems: "end" }}>
                {top3.length === 3 && (
                  <a href={`/clan/${top3[1].id}`} className="podium-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 8 }}>2ND</div>
                    <div style={{ marginBottom: 8 }}><ClanBadge memberCount={top3[1].clan_members?.[0]?.count || 0} size={52} /></div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 6 }}>{top3[1].name}</div>
                    <div style={{ marginBottom: 10 }}><span className="tier-tag" style={{ borderColor: `${tierColors[top3[1].tier]}44`, color: tierColors[top3[1].tier] || "#ff6b23" }}>{top3[1].tier}</span></div>
                    <div className="points-badge">{top3[1].points || 0} PT</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{top3[1].wins}승 {top3[1].losses}패</div>
                  </a>
                )}
                <a href={`/clan/${top3[0].id}`} className="podium-card first" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="crown" style={{ fontSize: 20, marginBottom: 4 }}>👑</div>
                  <div style={{ fontSize: 11, color: "#ff6b23", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>1ST</div>
                  <div style={{ marginBottom: 10 }}><ClanBadge memberCount={top3[0].clan_members?.[0]?.count || 0} size={64} /></div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 6, color: "#ff6b23" }}>{top3[0].name}</div>
                  <div style={{ marginBottom: 12 }}><span className="tier-tag" style={{ borderColor: "rgba(255,107,35,0.5)", color: "#ff6b23" }}>{top3[0].tier}</span></div>
                  <div className="points-badge" style={{ fontSize: 16 }}>{top3[0].points || 0} PT</div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>{top3[0].wins}승 {top3[0].losses}패</div>
                </a>
                {top3.length >= 3 && (
                  <a href={`/clan/${top3[2].id}`} className="podium-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 8 }}>3RD</div>
                    <div style={{ marginBottom: 8 }}><ClanBadge memberCount={top3[2].clan_members?.[0]?.count || 0} size={52} /></div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", marginBottom: 6 }}>{top3[2].name}</div>
                    <div style={{ marginBottom: 10 }}><span className="tier-tag" style={{ borderColor: `${tierColors[top3[2].tier]}44`, color: tierColors[top3[2].tier] || "#ff6b23" }}>{top3[2].tier}</span></div>
                    <div className="points-badge">{top3[2].points || 0} PT</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{top3[2].wins}승 {top3[2].losses}패</div>
                  </a>
                )}
              </div>
            )}
            {/* 나머지 순위 */}
            {rest.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 48px 2fr 1fr 1fr 1fr 100px", gap: 16, padding: "8px 24px", fontSize: 11, color: "#8892a4", letterSpacing: 1, fontWeight: 600 }}>
                  <span>순위</span><span></span><span>클랜</span><span>티어</span><span>승</span><span>패</span><span style={{ textAlign: "right" }}>포인트</span>
                </div>
                {rest.map((clan, i) => (
                  <a key={clan.id} href={`/clan/${clan.id}`} className="rank-row">
                    <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: "#8892a4", minWidth: 44 }}>#{i + 4}</span>
                    <ClanBadge memberCount={clan.clan_members?.[0]?.count || 0} size={36} />
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{clan.name}</span>
                    <span className="tier-tag" style={{ borderColor: `${tierColors[clan.tier]}44`, color: tierColors[clan.tier] || "#ff6b23", width: "fit-content" }}>{clan.tier}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#4caf50", fontFamily: "Rajdhani, sans-serif" }}>{clan.wins}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#ef5350", fontFamily: "Rajdhani, sans-serif" }}>{clan.losses}</span>
                    <div className="points-badge" style={{ textAlign: "center", fontSize: 13 }}>{clan.points || 0}</div>
                  </a>
                ))}
              </div>
            )}
          </>
        ) : (
          /* 누적 랭킹 */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((clan, i) => (
              <a key={clan.id} href={`/clan/${clan.id}`} className="hall-row">
                <div style={{ minWidth: 48, textAlign: "center", flexShrink: 0 }}>
                  {i === 0 ? <span className="gold" style={{ fontSize: 28 }}>🥇</span>
                  : i === 1 ? <span className="silver" style={{ fontSize: 28 }}>🥈</span>
                  : i === 2 ? <span className="bronze" style={{ fontSize: 28 }}>🥉</span>
                  : <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#8892a4" }}>#{i + 1}</span>}
                </div>
                <div style={{ flexShrink: 0 }}><ClanBadge memberCount={clan.clan_members?.[0]?.count || 0} size={48} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, minWidth: 0 }}>
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{clan.name}</span>
                    <span style={{ fontSize: 11, color: "#ff6b23", opacity: 0.6, fontWeight: 600, flexShrink: 0 }}>[{clan.tag}]</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="tier-tag" style={{ borderColor: `${tierColors[clan.tier]}44`, color: tierColors[clan.tier] || "#ff6b23" }}>{clan.tier}</span>
                    <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜원 {clan.clan_members?.[0]?.count || 0}명</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#4caf50", fontFamily: "Rajdhani, sans-serif" }}>{clan.wins}</div>
                    <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>승</div>
                  </div>
                  <div style={{ fontSize: 16, color: "#8892a4" }}>-</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#ef5350", fontFamily: "Rajdhani, sans-serif" }}>{clan.losses}</div>
                    <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>패</div>
                  </div>
                  <div style={{ textAlign: "center", marginLeft: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{clan.points || 0}</div>
                    <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>PT</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
