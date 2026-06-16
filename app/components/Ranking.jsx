"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";
import ClanBadge, { getBadgeTier, ClanTierChip, ClanEmblem } from "./ClanBadge";
import { TIER_COLORS as tierColors } from "../../lib/clanTier";

// 랭킹 등재 기준: 완료된 정규전 N판 이상부터 (미만은 "배치 중")
const PLACEMENT_GAMES = 2;

const medalMeta = {
  1: { ribbon: "tp-ribbon-1", base: "tp-base-1", ring: "tp-ring-1" },
  2: { ribbon: "tp-ribbon-2", base: "tp-base-2", ring: "tp-ring-2" },
  3: { ribbon: "tp-ribbon-3", base: "tp-base-3", ring: "tp-ring-3" },
};

// 긴 닉네임을 칸 너비에 맞게 폰트 크기를 자동 축소 (짧으면 기준 크기 유지, 한계까지 줄여도 넘치면 말줄임)
function FitText({ text, max, maxSm, min, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let fs = window.innerWidth <= 600 ? maxSm : max;
      el.style.fontSize = fs + "px";
      let guard = 0;
      while (el.scrollWidth > el.clientWidth && fs > min && guard < 80) {
        fs -= 0.5;
        el.style.fontSize = fs + "px";
        guard++;
      }
    };
    fit();
    let ro;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(fit); ro.observe(el); }
    window.addEventListener("resize", fit);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", fit); };
  }, [text, max, maxSm, min]);
  return <div ref={ref} className={className} style={{ ...style, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>;
}

export default function OverClanRanking() {
  const [clans, setClans] = useState([]);
  const [gamesMap, setGamesMap] = useState({}); // clanId -> 완료된 정규전 경기 수
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState("전체");
  const [mode, setMode] = useState("시즌"); // "시즌" | "누적"
  const burstRef = useRef(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      const orderCol = mode === "시즌" ? "points" : "wins";
      const { data } = await supabase
        .from("clans")
        .select("*, clan_members(count)")
        .order(orderCol, { ascending: false });
      // 완료된 정규전 경기 수 카운트 (무승부 포함 — clans 테이블엔 draws 컬럼이 없어 직접 집계)
      const { data: battles } = await supabase
        .from("clan_battles")
        .select("clan1_id, clan2_id")
        .eq("status", "완료")
        .eq("type", "정규전");
      const counts = {};
      (battles || []).forEach(b => {
        if (b.clan1_id) counts[b.clan1_id] = (counts[b.clan1_id] || 0) + 1;
        if (b.clan2_id) counts[b.clan2_id] = (counts[b.clan2_id] || 0) + 1;
      });
      setGamesMap(counts);
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

  const gamesOf = (c) => gamesMap[c.id] || 0;
  // 정규전 N판 이상만 랭킹 등재, 미만은 "배치 중"
  const ranked = filtered.filter(c => gamesOf(c) >= PLACEMENT_GAMES);
  const placement = filtered.filter(c => gamesOf(c) < PLACEMENT_GAMES);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  // 챔피언 등장 시 광파 폭발 (시즌 모드, 1등 존재, 최초 1회)
  useEffect(() => {
    if (loading || mode !== "시즌" || top3.length === 0 || playedRef.current) return;
    const bc = burstRef.current;
    if (!bc) return;
    playedRef.current = true;
    const prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const bx = bc.getContext("2d");
    const rect = bc.getBoundingClientRect();
    bc.width = rect.width; bc.height = rect.height;
    const cx = bc.width / 2, cy = 150, sparks = [];
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5;
      sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, s: 1 + Math.random() * 2.5 });
    }
    let ring = 0;
    const bl = () => {
      bx.clearRect(0, 0, bc.width, bc.height);
      ring += 6;
      if (ring < 180) { bx.beginPath(); bx.arc(cx, cy, ring, 0, Math.PI * 2); bx.strokeStyle = "rgba(255,140,66," + (1 - ring / 180) * 0.5 + ")"; bx.lineWidth = 2; bx.stroke(); }
      let alive = false;
      for (const s of sparks) {
        if (s.life <= 0) continue; alive = true;
        s.x += s.vx; s.y += s.vy; s.vy += 0.12; s.life -= 0.018;
        bx.beginPath(); bx.arc(s.x, s.y, Math.max(0, s.s * s.life), 0, Math.PI * 2);
        bx.fillStyle = "rgba(255," + (150 + Math.random() * 80) + ",60," + s.life + ")"; bx.fill();
      }
      if (alive || ring < 180) requestAnimationFrame(bl); else bx.clearRect(0, 0, bc.width, bc.height);
    };
    const t = setTimeout(bl, 250);
    return () => clearTimeout(t);
  }, [loading, mode, top3.length]);

  // 포디움 1칸 렌더 (clan이 없으면 빈 왕좌)
  const renderPodium = (clan, rank) => {
    const meta = medalMeta[rank];
    const isFirst = rank === 1;
    const count = clan?.clan_members?.[0]?.count || 0;
    const accent = clan?.accent_color || "#ff6b23";

    // 빈 왕좌 (해당 순위 클랜 없음)
    if (!clan) {
      return (
        <div className={`tp-pod tp-pod-${rank} tp-empty`} style={{ opacity: 0.5 }}>
          {isFirst ? (
            <>
              <div className="tp-crown" style={{ filter: "grayscale(1) opacity(0.5)" }}>
                <svg width="52" height="40" viewBox="0 0 52 40"><path d="M5 34 L2 9 L14 20 L26 4 L38 20 L50 9 L47 34 Z" fill="#3a4150" stroke="#5a6478" strokeWidth="1"/><rect x="5" y="33" width="42" height="4" fill="#3a4150"/></svg>
              </div>
              <div className="tp-champ-label" style={{ color: "#5a6478", textShadow: "none", animation: "none" }}>EMPTY</div>
            </>
          ) : (
            <div className={`tp-ribbon ${meta.ribbon}`} style={{ background: "rgba(90,100,120,0.3)", boxShadow: "none", color: "#8892a4" }}>{rank}<small>{rank === 2 ? "ND" : "RD"}</small></div>
          )}
          <div className="tp-emblem-wrap">
            <div className={`tp-emblem ${isFirst ? "tp-emblem-1" : ""}`} style={isFirst ? { animation: "none", boxShadow: "none", borderColor: "rgba(255,107,35,0.25)", borderStyle: "dashed" } : {}}>
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: isFirst ? 26 : 20, color: "#5a6478" }}>?</span>
            </div>
          </div>
          <div className={`tp-name ${isFirst ? "tp-name-1" : ""}`} style={{ color: "#5a6478", textShadow: "none" }}>비어있음</div>
          <div className={`tp-base ${meta.base}`} style={{ opacity: 0.25, filter: "grayscale(1)" }} />
        </div>
      );
    }

    return (
      <a href={`/clan/${clan.id}`} className={`tp-pod tp-pod-${rank}`}>
        {isFirst && <div className="tp-spotlight" />}
        {isFirst ? (
          <>
            <div className="tp-crown">
              <svg width="52" height="40" viewBox="0 0 52 40"><defs><linearGradient id="rkcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe680"/><stop offset="1" stopColor="#f5a623"/></linearGradient></defs><path d="M5 34 L2 9 L14 20 L26 4 L38 20 L50 9 L47 34 Z" fill="url(#rkcg)" stroke="#ffb020" strokeWidth="1"/><circle cx="26" cy="4" r="3" fill="#fff3c4"/><circle cx="2" cy="9" r="2.5" fill="#ffe680"/><circle cx="50" cy="9" r="2.5" fill="#ffe680"/><rect x="5" y="33" width="42" height="4" fill="#ffcb52"/></svg>
            </div>
            <div className="tp-champ-label">CHAMPION</div>
          </>
        ) : (
          <div className={`tp-ribbon ${meta.ribbon}`}>{rank}<small>{rank === 2 ? "ND" : "RD"}</small></div>
        )}
        <div className="tp-emblem-wrap">
          {isFirst ? (<><div className="tp-ring tp-ring-1" /><div className="tp-ring tp-ring-1b" /></>) : <div className={`tp-ring ${meta.ring}`} />}
          <div className={`tp-emblem ${isFirst ? "tp-emblem-1" : ""}`} style={{ borderColor: isFirst ? "#ff8c42" : (rank === 2 ? "#9aa3b5" : "#cd9b6a") }}>
            {clan.emblem_image ? <img src={clan.emblem_image} alt="" /> : clan.badge ? <span style={{ fontSize: isFirst ? 46 : 30, lineHeight: 1 }}>{clan.badge}</span> : <ClanBadge memberCount={count} size={isFirst ? 88 : 60} />}
          </div>
        </div>
        <FitText text={clan.name} max={isFirst ? 22 : 16} maxSm={isFirst ? 15 : 12} min={isFirst ? 11 : 9} className={`tp-name ${isFirst ? "tp-name-1" : ""}`} />
        <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "7px 0 4px", flexWrap: "wrap" }}>
          {clan.tier && <span className="tp-tier" style={{ color: tierColors[clan.tier] || "#ff8c42", borderColor: `${tierColors[clan.tier] || "#ff8c42"}66` }}>{clan.tier}</span>}
          <ClanTierChip memberCount={count} size={18} />
        </div>
        <div className={`tp-pt ${isFirst ? "tp-pt-1" : ""}`} style={{ color: isFirst ? "#ff6b23" : (rank === 2 ? "#c0c8d4" : "#cd9b6a") }}>
          {clan.points || 0}<span style={{ fontSize: isFirst ? 14 : 12, opacity: 0.6 }}>PT</span>
        </div>
        <div className="tp-record">{clan.wins}승 {clan.losses}패</div>
        <div className={`tp-base ${meta.base}`} />
      </a>
    );
  };

  // 배치 중 섹션 (정규전 N판 미만 — 시즌/누적 공용)
  const placementSection = placement.length > 0 && (
    <div style={{ maxWidth: 640, margin: "34px auto 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ width: 3, height: 16, background: "#8892a4" }} />
        <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2, color: "#c0c8d4" }}>배치 중</span>
        <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>정규전 {PLACEMENT_GAMES}판을 치르면 랭킹에 등재돼요</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {placement.map(clan => (
          <a key={clan.id} href={`/clan/${clan.id}`} className="rank-row" style={{ borderRadius: 6, clipPath: "none" }}>
            <div style={{ flexShrink: 0 }}><ClanEmblem clan={clan} size={36} radius={8} /></div>
            <FitText text={clan.name} max={15} maxSm={15} min={9} style={{ fontWeight: 700, fontFamily: "Noto Sans KR, sans-serif", flex: 1, minWidth: 0 }} />
            {clan.tier && <span className="tier-tag" style={{ borderColor: `${tierColors[clan.tier]}44`, color: tierColors[clan.tier] || "#ff6b23", width: "fit-content", flexShrink: 0 }}>{clan.tier}</span>}
            <span className="placement-chip">정규전 {gamesOf(clan)}/{PLACEMENT_GAMES}</span>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Cinzel', 'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .mode-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; white-space: nowrap; }
        .mode-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .league-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 20px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; white-space: nowrap; }
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
        .points-badge { background: rgba(255,107,35,0.1); border: 1px solid rgba(255,107,35,0.2); padding: 3px 10px; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); font-size: 14px; font-weight: 700; color: #ff6b23; font-family: 'Cinzel', 'Rajdhani', sans-serif; }
        @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .crown { animation: shimmer 2s infinite; }
        .hall-row { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 20px 28px; display: flex; align-items: center; gap: 20px; transition: all 0.3s; cursor: pointer; text-decoration: none; color: inherit; clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px)); }
        .hall-row:hover { border-color: rgba(255,107,35,0.5); transform: translateX(4px); box-shadow: -4px 0 0 #ff6b23; }
        @keyframes shimmer2 { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .gold { color: #ffd700; animation: shimmer2 2s infinite; }
        .silver { color: #c0c0c0; }
        .bronze { color: #cd7f32; }

        /* ─── 왕좌(Throne) 포디움 ─── */
        .throne-wrap { display:flex; align-items:flex-end; justify-content:center; gap:20px; margin:54px 0 30px; min-height:360px; position:relative; }
        .tp-pod { display:flex; flex-direction:column; align-items:center; width:160px; position:relative; transition:all .7s cubic-bezier(.2,.8,.3,1); text-decoration:none; color:inherit; }
        .tp-pod-1 { width:210px; z-index:3; }
        .tp-emblem-wrap { position:relative; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
        .tp-ring { position:absolute; border-radius:50%; pointer-events:none; }
        .tp-ring-1 { width:120px; height:120px; border:1.5px dashed rgba(255,140,66,0.5); animation:tpSpin 9s linear infinite; }
        .tp-ring-1b { width:148px; height:148px; border:1px dotted rgba(255,107,35,0.3); animation:tpSpin 14s linear infinite reverse; }
        .tp-ring-2 { width:88px; height:88px; border:1px dashed rgba(154,163,181,0.4); animation:tpSpin 12s linear infinite; }
        .tp-ring-3 { width:88px; height:88px; border:1px dashed rgba(205,155,106,0.4); animation:tpSpin 12s linear infinite reverse; }
        .tp-emblem { width:64px; height:64px; border:2px solid; border-radius:12px; background:rgba(8,12,20,0.9); display:flex; align-items:center; justify-content:center; position:relative; z-index:2; box-shadow:0 0 20px rgba(0,0,0,0.5); overflow:hidden; }
        .tp-emblem img { width:100%; height:100%; object-fit:cover; }
        .tp-emblem-1 { width:90px; height:90px; border:2px solid #ff8c42; box-shadow:0 0 44px rgba(255,107,35,0.6), inset 0 0 22px rgba(255,107,35,0.15); animation:tpPulse 2.4s ease-in-out infinite; }
        .tp-ribbon { font-family:'Cinzel',serif; font-weight:900; font-size:16px; color:#fff; padding:5px 16px; margin-bottom:14px; clip-path:polygon(0 0,100% 0,90% 100%,10% 100%); }
        .tp-ribbon small { font-size:0.55em; vertical-align:super; opacity:0.8; }
        .tp-ribbon-2 { background:linear-gradient(135deg,#aab2c2,#7e8798); box-shadow:0 0 18px rgba(154,163,181,0.4); }
        .tp-ribbon-3 { background:linear-gradient(135deg,#d8a571,#b5824f); box-shadow:0 0 18px rgba(205,155,106,0.4); }
        .tp-champ-label { font-family:'Cinzel',serif; font-weight:700; font-size:14px; letter-spacing:4px; color:#ffd24a; margin-bottom:12px; text-shadow:0 0 16px rgba(255,210,74,0.6); animation:tpGlowText 2.5s ease-in-out infinite; }
        .tp-crown { margin-bottom:6px; animation:tpFloat 3s ease-in-out infinite; filter:drop-shadow(0 0 14px rgba(255,210,74,0.7)); position:relative; z-index:3; }
        .tp-name { font-family:'Noto Sans KR',sans-serif; font-weight:700; font-size:16px; margin-bottom:6px; text-align:center; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tp-name-1 { font-size:22px; color:#ff6b23; text-shadow:0 0 22px rgba(255,107,35,0.6); }
        .tp-tier { font-size:10px; padding:2px 8px; border:1px solid; border-radius:3px; font-family:'Noto Sans KR',sans-serif; white-space:nowrap; }
        .tp-pt { font-family:'Cinzel',serif; font-weight:700; font-size:24px; margin:8px 0 2px; }
        .tp-pt-1 { font-size:34px; color:#ff6b23; text-shadow:0 0 28px rgba(255,107,35,0.6); }
        .tp-record { font-size:12px; color:#8892a4; font-weight:300; font-family:'Noto Sans KR',sans-serif; }
        .tp-base { margin-top:16px; width:100%; border-radius:5px 5px 0 0; position:relative; overflow:hidden; }
        .tp-base::after { content:''; position:absolute; top:0; left:-60%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent); animation:tpShine 3.5s ease-in-out infinite; }
        .tp-base-1 { height:100px; background:linear-gradient(180deg, rgba(255,107,35,0.32), rgba(255,107,35,0.04)); border-top:2px solid #ff6b23; box-shadow:inset 0 8px 24px rgba(255,107,35,0.15); }
        .tp-base-2 { height:68px; background:linear-gradient(180deg, rgba(154,163,181,0.26), rgba(154,163,181,0.03)); border-top:2px solid #9aa3b5; }
        .tp-base-3 { height:48px; background:linear-gradient(180deg, rgba(205,155,106,0.26), rgba(205,155,106,0.03)); border-top:2px solid #cd9b6a; }
        .tp-spotlight { position:absolute; top:-44px; left:50%; transform:translateX(-50%); width:230px; height:430px; background:linear-gradient(180deg, rgba(255,107,35,0.18) 0%, rgba(255,107,35,0.045) 38%, transparent 72%); clip-path:polygon(40% 0, 60% 0, 100% 100%, 0% 100%); pointer-events:none; z-index:0; animation:tpSpotPulse 4s ease-in-out infinite; }
        /* 빈 왕좌 */
        .tp-empty .tp-emblem { border-color:rgba(255,107,35,0.25)!important; border-style:dashed; background:rgba(255,107,35,0.03); }
        .tp-empty .tp-name { color:#5a6478; }
        .tp-throne-cta { max-width:560px; margin:6px auto 0; border:1px dashed rgba(255,107,35,0.28); border-radius:8px; padding:22px; text-align:center; background:rgba(255,107,35,0.03); }
        .placement-chip { font-size:12px; font-family:'Noto Sans KR',sans-serif; color:#9aa3b5; background:rgba(255,255,255,0.04); border:1px solid rgba(255,107,35,0.18); padding:3px 10px; border-radius:3px; flex-shrink:0; white-space:nowrap; }
        @keyframes tpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes tpSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes tpPulse { 0%,100%{box-shadow:0 0 44px rgba(255,107,35,0.6), inset 0 0 22px rgba(255,107,35,0.15)} 50%{box-shadow:0 0 64px rgba(255,107,35,0.85), inset 0 0 30px rgba(255,107,35,0.25)} }
        @keyframes tpGlowText { 0%,100%{text-shadow:0 0 16px rgba(255,210,74,0.6)} 50%{text-shadow:0 0 28px rgba(255,210,74,0.95)} }
        @keyframes tpSpotPulse { 0%,100%{opacity:0.65} 50%{opacity:0.95} }
        @keyframes tpShine { 0%{left:-60%} 50%,100%{left:120%} }
        .tp-pod:hover .tp-emblem { box-shadow:0 0 30px rgba(255,107,35,0.4); }
        .tp-pod-1:hover .tp-emblem-1 { box-shadow:0 0 70px rgba(255,107,35,0.9), inset 0 0 30px rgba(255,107,35,0.25); }
        @media (max-width:600px){
          .throne-wrap{gap:8px; min-height:300px;}
          .tp-pod{width:31%} .tp-pod-1{width:36%}
          .tp-emblem{width:46px;height:46px} .tp-emblem-1{width:58px;height:58px}
          .tp-ring-1{width:80px;height:80px} .tp-ring-1b{width:100px;height:100px} .tp-ring-2,.tp-ring-3{width:64px;height:64px}
          .tp-name{font-size:12px} .tp-name-1{font-size:15px} .tp-pt{font-size:18px} .tp-pt-1{font-size:22px}
          .tp-champ-label{font-size:11px;letter-spacing:2px} .tp-ribbon{font-size:13px;padding:4px 12px}
        }
        @media (prefers-reduced-motion:reduce){
          .tp-ring-1,.tp-ring-1b,.tp-ring-2,.tp-ring-3,.tp-crown,.tp-emblem-1,.tp-champ-label,.tp-spotlight,.tp-base::after{animation:none!important}
        }
      `}</style>

      <Navbar active="랭킹" />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(24px, 4vw, 48px) clamp(16px, 4vw, 32px)" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>랭킹</h1>
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
          <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            아직 클랜이 없어요. 첫 번째 클랜을 만들어보세요!
          </div>
        ) : mode === "시즌" ? (
          <>
            {/* ─── 왕좌 포디움 (1·2·3등) ─── */}
            <div className="throne-wrap">
              <canvas ref={burstRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 4, pointerEvents: "none" }} />

              {/* 2등 (왼쪽) */}
              {renderPodium(top3[1], 2)}

              {/* 1등 (가운데, 챔피언) */}
              {renderPodium(top3[0], 1)}

              {/* 3등 (오른쪽) */}
              {renderPodium(top3[2], 3)}
            </div>

            {/* 콜드스타트: 1등만 있고 2·3등이 비어있으면 도전장 CTA */}
            {top3.length < 3 && (
              <div className="tp-throne-cta">
                <div style={{ fontSize: 26, marginBottom: 8, color: "#ff8c42", opacity: 0.85 }}>♛</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 500, fontSize: 15, letterSpacing: 2, color: "#ff8c42", marginBottom: 6 }}>THE THRONE AWAITS</div>
                <div style={{ fontSize: 13, color: "#8892a4", fontWeight: 300, fontFamily: "Noto Sans KR, sans-serif", marginBottom: 16 }}>
                  아직 정복되지 않은 자리. 다음 정복자가 되어보세요.
                </div>
                <a href="/clan/create" style={{ display: "inline-block", background: "linear-gradient(135deg, #ff6b23, #ff8c42)", color: "#fff", padding: "9px 24px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, textDecoration: "none", clipPath: "polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)" }}>+ 클랜 만들기</a>
              </div>
            )}

            {/* ─── 나머지 순위 (4등~) ─── */}
            {rest.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 9, maxWidth: 640, margin: "32px auto 0" }}>
                {rest.map((clan, i) => (
                  <a key={clan.id} href={`/clan/${clan.id}`} className="rank-row" style={{ borderRadius: 6, clipPath: "none" }}>
                    <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", color: "#5a6478", width: 30, textAlign: "center", flexShrink: 0 }}>{i + 4}</span>
                    <div style={{ flexShrink: 0 }}><ClanEmblem clan={clan} size={36} radius={8} /></div>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}><FitText text={clan.name} max={15} maxSm={15} min={9} style={{ fontWeight: 700, fontFamily: "Noto Sans KR, sans-serif", flex: 1, minWidth: 0 }} /><ClanTierChip memberCount={clan.clan_members?.[0]?.count || 0} size={18} /></span>
                    {clan.tier && <span className="tier-tag" style={{ borderColor: `${tierColors[clan.tier]}44`, color: tierColors[clan.tier] || "#ff6b23", width: "fit-content", flexShrink: 0 }}>{clan.tier}</span>}
                    <span style={{ display: "flex", gap: 4, flexShrink: 0, fontSize: 13, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 600 }}><span style={{ color: "#4caf50" }}>{clan.wins}</span><span style={{ color: "#5a6478" }}>·</span><span style={{ color: "#ef5350" }}>{clan.losses}</span></span>
                    <div className="points-badge" style={{ textAlign: "center", fontSize: 14, flexShrink: 0, minWidth: 56 }}>{clan.points || 0}</div>
                  </a>
                ))}
              </div>
            )}
            {placementSection}
          </>
        ) : (
          /* 누적 랭킹 */
          <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ranked.length === 0 && placement.length > 0 && (
              <div style={{ textAlign: "center", padding: "10px 0 4px", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13 }}>
                아직 배치를 마친 클랜이 없어요.
              </div>
            )}
            {ranked.map((clan, i) => (
              <a key={clan.id} href={`/clan/${clan.id}`} className="hall-row">
                <div style={{ minWidth: 48, textAlign: "center", flexShrink: 0 }}>
                  {i === 0 ? <span className="gold" style={{ fontSize: 28 }}>🥇</span>
                  : i === 1 ? <span className="silver" style={{ fontSize: 28 }}>🥈</span>
                  : i === 2 ? <span className="bronze" style={{ fontSize: 28 }}>🥉</span>
                  : <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "#8892a4" }}>#{i + 1}</span>}
                </div>
                <div style={{ flexShrink: 0 }}><ClanEmblem clan={clan} size={48} radius={10} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, minWidth: 0, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{clan.name}</span>
                    <span style={{ fontSize: 11, color: "#ff6b23", opacity: 0.6, fontWeight: 600, flexShrink: 0 }}>[{clan.tag}]</span>
                    <ClanTierChip memberCount={clan.clan_members?.[0]?.count || 0} size={20} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {clan.tier && <span className="tier-tag" style={{ borderColor: `${tierColors[clan.tier]}44`, color: tierColors[clan.tier] || "#ff6b23" }}>{clan.tier}</span>}
                    <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜원 {clan.clan_members?.[0]?.count || 0}명</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#4caf50", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{clan.wins}</div>
                    <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>승</div>
                  </div>
                  <div style={{ fontSize: 16, color: "#8892a4" }}>-</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#ef5350", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{clan.losses}</div>
                    <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>패</div>
                  </div>
                  <div style={{ textAlign: "center", marginLeft: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{clan.points || 0}</div>
                    <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>PT</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {placementSection}
          </>
        )}
      </div>
    </div>
  );
}
