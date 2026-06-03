"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";

const tierColors = {
  "마스터": { color: "#ff6b23", border: "rgba(255,107,35,0.4)" },
  "다이아": { color: "#4fc3f7", border: "rgba(79,195,247,0.4)" },
  "플래티넘": { color: "#b0bec5", border: "rgba(176,190,197,0.4)" },
  "골드": { color: "#ffd54f", border: "rgba(255,213,79,0.4)" },
  "실버": { color: "#90a4ae", border: "rgba(144,164,174,0.4)" },
  "브론즈": { color: "#a1887f", border: "rgba(161,136,127,0.4)" },
};

export default function OverClanFind() {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("전체");
  const [timeFilter, setTimeFilter] = useState("전체");
  const [styleFilter, setStyleFilter] = useState("전체");

  useEffect(() => {
    const fetchClans = async () => {
      const { data } = await supabase.from("clans").select("*, clan_members(count)").order("created_at", { ascending: false });
      setClans(data || []);
      setLoading(false);
    };
    fetchClans();
  }, []);

  const filtered = clans.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "전체" || c.tier === tierFilter;
    const matchTime = timeFilter === "전체" || c.play_time === timeFilter;
    const matchStyle = styleFilter === "전체" || c.style === styleFilter;
    return matchSearch && matchTier && matchTime && matchStyle;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .filter-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 7px 16px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .filter-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .filter-btn:hover { border-color: rgba(255,107,35,0.4); color: #e8eaf0; }
        .clan-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 24px; position: relative; transition: all 0.3s; cursor: pointer; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); text-decoration: none; color: inherit; display: block; }
        .clan-card:hover { border-color: rgba(255,107,35,0.4); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,107,35,0.1); }
        .search-input { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 20px 12px 44px; font-family: 'Rajdhani', sans-serif; font-size: 14px; letter-spacing: 1px; outline: none; width: 100%; clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%); transition: border-color 0.2s; }
        .search-input:focus { border-color: #ff6b23; }
        .search-input::placeholder { color: #8892a4; }
        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); white-space: nowrap; }
        .btn-join { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 8px 20px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-join:hover { background: rgba(255,107,35,0.15); }
        .mobile-filters { display: none; }
        @media (max-width: 768px) {
          .find-grid { grid-template-columns: 1fr !important; }
          .desktop-filters { display: none !important; }
          .mobile-filters { display: block !important; margin-bottom: 16px; }
          .mobile-filter-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
          .mobile-filter-row::-webkit-scrollbar { display: none; }
          .mobile-filter-row .filter-btn { white-space: nowrap; flex-shrink: 0; padding: 6px 12px; font-size: 11px; }
          .mobile-filter-label { font-size: 10px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; }
        }
        .btn-create { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
      `}</style>

      <Navbar active="클랜 찾기" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(20px,4vw,48px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif" }}>클랜 찾기</h1>
            </div>
            <p style={{ fontSize: 13, color: "#8892a4", marginLeft: 15, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
              {filtered.length}개의 클랜이 새로운 클랜원을 기다리고 있어요.
            </p>
          </div>
          <a href="/clan/create" className="btn-create" style={{ whiteSpace: "nowrap", fontSize: 13, padding: "10px 20px", alignSelf: "flex-start" }} onClick={e => { if (!document.cookie.includes("sb-")) { e.preventDefault(); window.location.href = "/login"; } }}>+ 클랜 만들기</a>
        </div>

        {/* 모바일 필터 - 가로 스크롤 탭 */}
        <div className="mobile-filters">
          <div style={{ marginBottom: 8 }}>
            <div className="mobile-filter-label">티어</div>
            <div className="mobile-filter-row">
              {["전체","챔피언","그랜드마스터","마스터","다이아","플래티넘","골드","실버","브론즈"].map(t => (
                <button key={t} className={`filter-btn ${tierFilter === t ? "active" : ""}`} onClick={() => setTierFilter(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div className="mobile-filter-label">활동 시간</div>
            <div className="mobile-filter-row">
              {["전체","아침","저녁","밤","새벽","주말"].map(t => (
                <button key={t} className={`filter-btn ${timeFilter === t ? "active" : ""}`} onClick={() => setTimeFilter(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="mobile-filter-label">성향</div>
            <div className="mobile-filter-row">
              {["전체","경쟁","캐주얼","친목"].map(t => (
                <button key={t} className={`filter-btn ${styleFilter === t ? "active" : ""}`} onClick={() => setStyleFilter(t)}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }} className="find-grid">
          <div className="desktop-filters">
            <div style={{ position: "relative", marginBottom: 28 }}>
              <svg style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b23" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" placeholder="클랜명 또는 태그 검색" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>티어</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["전체", "챔피언", "그랜드마스터", "마스터", "다이아", "플래티넘", "골드", "실버", "브론즈"].map(t => (
                  <button key={t} className={`filter-btn ${tierFilter === t ? "active" : ""}`} onClick={() => setTierFilter(t)} style={{ textAlign: "left" }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>주 활동 시간</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["전체", "아침", "저녁", "밤", "새벽", "주말"].map(t => (
                  <button key={t} className={`filter-btn ${timeFilter === t ? "active" : ""}`} onClick={() => setTimeFilter(t)} style={{ textAlign: "left" }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>클랜 성향</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["전체", "경쟁", "캐주얼", "친목"].map(t => (
                  <button key={t} className={`filter-btn ${styleFilter === t ? "active" : ""}`} onClick={() => setStyleFilter(t)} style={{ textAlign: "left" }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>LOADING...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontFamily: "Noto Sans KR, sans-serif" }}>
                  {clans.length === 0 ? "아직 클랜이 없어요. 첫 번째 클랜을 만들어보세요!" : "검색 결과가 없어요."}
                </div>
              </div>
            ) : filtered.map(clan => (
              <a key={clan.id} href={`/clan/${clan.id}`} className="clan-card">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{clan.badge}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clan.name}</span>
                        <span style={{ fontSize: 11, color: "#ff6b23", opacity: 0.6, fontWeight: 600, flexShrink: 0 }}>[{clan.tag}]</span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>
                          {clan.clan_members?.[0]?.count || 0}/{clan.max_members}
                        </div>
                        <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>클랜원</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "nowrap", overflow: "hidden" }}>
                      <span className="tier-tag" style={{ borderColor: tierColors[clan.tier]?.border || "rgba(255,107,35,0.3)", color: tierColors[clan.tier]?.color || "#ff6b23", flexShrink: 0 }}>{clan.tier}</span>
                      <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4", flexShrink: 0 }}>{clan.style}</span>
                      <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4", flexShrink: 0 }}>{clan.play_time}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clan.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
