"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";
import ClanBadge, { ClanTierChip } from "./ClanBadge";

const tierColors = {
  "마스터": { color: "#ff6b23", border: "rgba(255,107,35,0.4)" },
  "그랜드마스터": { color: "#ff9800", border: "rgba(255,152,0,0.4)" },
  "챔피언": { color: "#ffd700", border: "rgba(255,215,0,0.4)" },
  "다이아": { color: "#4fc3f7", border: "rgba(79,195,247,0.4)" },
  "플래티넘": { color: "#b0bec5", border: "rgba(176,190,197,0.4)" },
  "골드": { color: "#ffd54f", border: "rgba(255,213,79,0.4)" },
  "실버": { color: "#90a4ae", border: "rgba(144,164,174,0.4)" },
  "브론즈": { color: "#a1887f", border: "rgba(161,136,127,0.4)" },
};

const TIERS = ["전체", "챔피언", "그랜드마스터", "마스터", "다이아", "플래티넘", "골드", "실버", "브론즈"];
const TIMES = ["전체", "아침", "저녁", "밤", "새벽", "주말"];
const STYLES = ["전체", "경쟁", "캐주얼", "친목"];
const MEMBERS = ["전체", "5+", "10+", "20+", "30+", "40+", "50+", "100+"];

export default function OverClanFind() {
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("전체");
  const [timeFilter, setTimeFilter] = useState("전체");
  const [styleFilter, setStyleFilter] = useState("전체");
  const [memberFilter, setMemberFilter] = useState("전체");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchClans = async () => {
      const { data } = await supabase.from("clans").select("*, clan_members(count)").order("created_at", { ascending: false });
      // is_hidden이 true인 클랜만 제외 (마이그레이션 전엔 null이라 전체 노출됨)
      const allClans = (data || []).filter(c => c.is_hidden !== true);
      setClans(allClans);
      setLoading(false);
    };
    fetchClans();
  }, []);

  const filtered = clans.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "전체" || c.tier === tierFilter;
    const matchTime = timeFilter === "전체" || c.play_time === timeFilter;
    const matchStyle = styleFilter === "전체" || c.style === styleFilter;
    const memberCount = c.clan_members?.[0]?.count || 0;
    const matchMember = memberFilter === "전체" || memberCount >= parseInt(memberFilter);
    return matchSearch && matchTier && matchTime && matchStyle && matchMember;
  });

  const hasActiveFilter = tierFilter !== "전체" || timeFilter !== "전체" || styleFilter !== "전체" || memberFilter !== "전체";
  const memberLabel = (t) => (t === "전체" ? "전체" : `${t.replace("+", "")}명+`);

  const renderGroup = (label, options, value, setter, fmt) => (
    <div className="fgroup">
      <span className="flabel">{label}</span>
      <div className="chip-row">
        {options.map(o => (
          <button key={o} className={`filter-chip ${value === o ? "active" : ""}`} onClick={() => setter(o)}>{fmt ? fmt(o) : o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .filter-chip { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 7px 15px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; white-space: nowrap; }
        .filter-chip.active { background: rgba(255,107,35,0.14); border-color: #ff6b23; color: #ff6b23; }
        .filter-chip:hover { border-color: rgba(255,107,35,0.4); color: #e8eaf0; }
        .search-input { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 20px 12px 44px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 14px; letter-spacing: 1px; outline: none; width: 100%; clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%); transition: border-color 0.2s; }
        .search-input:focus { border-color: #ff6b23; }
        .search-input::placeholder { color: #8892a4; }
        .hero-glow { position: absolute; top: -110px; left: 0; right: 0; height: 280px; background: radial-gradient(ellipse 55% 100% at 28% 0%, rgba(255,107,35,0.13), transparent 70%); pointer-events: none; animation: heroPulse 5s ease-in-out infinite; }
        @keyframes heroPulse { 0%,100% { opacity: 0.65; } 50% { opacity: 1; } }
        .fgroup { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 10px; }
        .flabel { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 11px; letter-spacing: 2px; color: #8892a4; font-weight: 600; min-width: 64px; padding-top: 7px; flex-shrink: 0; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .filters-panel { display: none; }
        .filters-panel.open { display: block; }
        .filter-toggle { display: inline-flex; align-items: center; gap: 8px; }
        .clan-card { position: relative; background: rgba(13,20,35,0.82); border: 1px solid rgba(255,107,35,0.12); padding: 18px 18px 18px 22px; transition: all 0.3s; cursor: pointer; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); text-decoration: none; color: inherit; display: block; }
        .clan-card:hover { border-color: rgba(255,107,35,0.4); transform: translateY(-3px); box-shadow: 0 10px 34px rgba(255,107,35,0.12); }
        .card-spine { position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px; border-radius: 2px; }
        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 9px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); white-space: nowrap; }
        .cap-bar { height: 4px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; }
        .cap-bar > i { display: block; height: 100%; border-radius: 3px; }
        .btn-create { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 11px 22px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; white-space: nowrap; box-shadow: 0 0 20px rgba(255,107,35,0.3); }
        @media (max-width: 768px) {
          .fgroup { flex-direction: column; gap: 6px; margin-bottom: 12px; }
          .flabel { padding-top: 0; }
          .chip-row { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; max-width: 100%; }
          .chip-row::-webkit-scrollbar { display: none; }
          .clan-card { padding: 16px 16px 16px 20px; }
        }
      `}</style>

      <Navbar active="클랜 찾기" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(20px,4vw,48px)", position: "relative" }}>
        <div className="hero-glow" />

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 12, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 3, height: 24, background: "#ff6b23", boxShadow: "0 0 10px rgba(255,107,35,0.7)" }} />
              <h1 style={{ fontSize: "clamp(24px,5vw,30px)", fontWeight: 700, letterSpacing: 3, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", color: "#fff", textShadow: "0 0 26px rgba(255,107,35,0.35)" }}>클랜 찾기</h1>
            </div>
            <p style={{ fontSize: 13, color: "#8892a4", margin: "8px 0 0 14px", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
              지금 <span style={{ color: "#ff6b23", fontWeight: 700, fontSize: 16, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{loading ? "—" : filtered.length}</span>개 클랜이 동료를 소집하고 있습니다
            </p>
          </div>
          <a href="/clan/create" className="btn-create">+ 클랜 만들기</a>
        </div>

        {/* 검색 + 필터 */}
        <div style={{ marginBottom: 24, position: "relative" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <svg style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b23" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input className="search-input" placeholder="클랜명 또는 태그 검색" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="filter-chip filter-toggle" onClick={() => setFilterOpen(!filterOpen)} style={{ padding: "10px 18px", color: filterOpen || hasActiveFilter ? "#ff6b23" : "#8892a4", borderColor: filterOpen || hasActiveFilter ? "#ff6b23" : "rgba(255,107,35,0.2)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
              필터 {hasActiveFilter ? "•" : ""}
            </button>
          </div>
          <div className={`filters-panel ${filterOpen ? "open" : ""}`}>
            {renderGroup("티어", TIERS, tierFilter, setTierFilter)}
            {renderGroup("활동 시간", TIMES, timeFilter, setTimeFilter)}
            {renderGroup("성향", STYLES, styleFilter, setStyleFilter)}
            {renderGroup("인원", MEMBERS, memberFilter, setMemberFilter, memberLabel)}
          </div>
        </div>

        {/* 클랜 카드 그리드 */}
        <div style={{ minHeight: 400, position: "relative" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(13,20,35,0.5)", border: "1px dashed rgba(255,107,35,0.15)" }}>
              <div style={{ fontSize: 34, marginBottom: 14, color: "#ff8c42", opacity: 0.85 }}>{clans.length === 0 ? "⚔" : "🔍"}</div>
              <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "#e8eaf0", marginBottom: 8 }}>
                {clans.length === 0 ? "아직 클랜이 없어요." : "조건에 맞는 클랜이 없어요."}
              </div>
              <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 20 }}>
                {clans.length === 0 ? "첫 번째 클랜의 주인공이 되어보세요!" : "필터를 바꿔보거나 직접 클랜을 만들어보세요."}
              </div>
              <a href="/clan/create" style={{ background: "linear-gradient(135deg, #ff6b23, #ff8c42)", color: "#fff", padding: "10px 24px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, textDecoration: "none", clipPath: "polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)", display: "inline-block" }}>+ 클랜 만들기</a>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
              {filtered.map(clan => {
                const count = clan.clan_members?.[0]?.count || 0;
                const max = clan.max_members || 30;
                const pct = Math.min(100, Math.round((count / Math.max(max, 1)) * 100));
                const accent = clan.accent_color || "#ff6b23";
                const full = count >= max;
                return (
                  <a key={clan.id} href={`/clan/${clan.id}`} className="clan-card">
                    <span className="card-spine" style={{ background: accent, boxShadow: `0 0 10px ${accent}aa` }} />
                    <div style={{ display: "flex", gap: 13 }}>
                      {clan.emblem_image ? (
                        <img src={clan.emblem_image} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: `1.5px solid ${accent}`, boxShadow: `0 0 14px ${accent}40` }} />
                      ) : (
                        <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 10, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 14px ${accent}40`, overflow: "hidden" }}><ClanBadge memberCount={count} size={42} /></div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clan.name}</span>
                            <span style={{ fontSize: 11, color: accent, opacity: 0.75, fontWeight: 600, flexShrink: 0 }}>[{clan.tag}]</span>
                            {clan.emblem_image && <ClanTierChip memberCount={count} size={18} />}
                          </div>
                          <span style={{ fontSize: 10, color: full ? "#8892a4" : "#4caf50", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, fontFamily: "Noto Sans KR, sans-serif" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: full ? "#8892a4" : "#4caf50", boxShadow: full ? "none" : "0 0 6px #4caf50", display: "inline-block" }} />
                            {full ? "정원" : "모집중"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 5, margin: "8px 0", flexWrap: "wrap" }}>
                          <span className="tier-tag" style={{ borderColor: tierColors[clan.tier]?.border || "rgba(255,107,35,0.3)", color: tierColors[clan.tier]?.color || "#ff6b23" }}>{clan.tier}</span>
                          <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#8892a4" }}>{clan.style}</span>
                          <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.12)", color: "#8892a4" }}>{clan.play_time}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                          <div className="cap-bar" style={{ flex: 1 }}><i style={{ width: `${pct}%`, background: accent }} /></div>
                          <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, color: accent, flexShrink: 0 }}>{count}<span style={{ color: "#5a6478" }}>/{max}</span></span>
                        </div>
                        {clan.vibe_tags && clan.vibe_tags.length > 0 ? (
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {clan.vibe_tags.slice(0, 4).map((tag) => (
                              <span key={tag} style={{ fontSize: 11, fontFamily: "Noto Sans KR, sans-serif", color: accent, background: `${accent}1a`, padding: "2px 9px", borderRadius: 20 }}>#{tag}</span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clan.description}</p>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
