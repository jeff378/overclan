"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";

export default function HallOfFamePage() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("clans")
        .select("*, clan_members(count)")
        .gt("wins", 0)
        .order("wins", { ascending: false })
        .limit(20);
      setWinners(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hall-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 24px 28px; display: flex; align-items: center; gap: 20px; transition: all 0.3s; cursor: pointer; text-decoration: none; color: inherit; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); }
        .hall-card:hover { border-color: rgba(255,107,35,0.5); transform: translateX(4px); box-shadow: -4px 0 0 #ff6b23; }
        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        @keyframes shimmer { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .gold { color: #ffd700; animation: shimmer 2s infinite; }
        .silver { color: #c0c0c0; }
        .bronze { color: #cd7f32; }
      `}</style>

      <Navbar active="명예의 전당" />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px", minHeight: "calc(100vh - 61px)" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>명예의 전당 🏆</h1>
          <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>클랜대전 누적 승점 순위</span>
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : winners.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚔️</div>
            <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 14, lineHeight: 2 }}>
              아직 클랜대전 기록이 없어요.<br/>첫 번째 클랜대전의 주인공이 되어보세요!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {winners.map((clan, i) => (
              <a key={clan.id} href={`/clan/${clan.id}`} className="hall-card">
                {/* 순위 */}
                <div style={{ minWidth: 48, textAlign: "center" }}>
                  {i === 0 ? <span className="gold" style={{ fontSize: 28 }}>🥇</span>
                  : i === 1 ? <span className="silver" style={{ fontSize: 28 }}>🥈</span>
                  : i === 2 ? <span className="bronze" style={{ fontSize: 28 }}>🥉</span>
                  : <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#8892a4" }}>#{i + 1}</span>}
                </div>

                {/* 배지 */}
                <div style={{ fontSize: 36 }}>{clan.badge}</div>

                {/* 클랜 정보 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700 }}>{clan.name}</span>
                    <span style={{ fontSize: 11, color: "#ff6b23", opacity: 0.6, fontWeight: 600 }}>[{clan.tag}]</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="tier-tag">{clan.tier}</span>
                    <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                      클랜원 {clan.clan_members?.[0]?.count || 0}명
                    </span>
                  </div>
                </div>

                {/* 전적 */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
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
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
