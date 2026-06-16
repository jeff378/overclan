"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import ClanBadgeJSX, { ClanTierChip as ClanTierChipJSX } from "../../components/ClanBadge";
const ClanBadge = ClanBadgeJSX as any;
const ClanTierChip = ClanTierChipJSX as any;
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ShareButton from "../../components/ShareButton";
import { createNotification } from "../../../lib/notifications";
import { TIER_COLORS } from "../../../lib/clanTier";
import JoinFormModal from "../../components/JoinFormModal";
import { JoinAnswer } from "../../../lib/joinForm";

// 간단한 마크다운 렌더러
function renderText(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} style={{ color: "#e8eaf0", fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

const ROLE_CONFIG: Record<string, { icon: string; color: string }> = {
  "탱커": { icon: "🛡️", color: "#4fc3f7" },
  "딜러": { icon: "⚔️", color: "#ff6b23" },
  "힐러": { icon: "💊", color: "#4caf50" },
};

export default function ClanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [clan, setClan] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [recentBattles, setRecentBattles] = useState<any[]>([]);
  const [activeBattles, setActiveBattles] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState("소개");
  const [tierUpAnim, setTierUpAnim] = useState(false);
  const [bannerRatio, setBannerRatio] = useState(4.6); // 배너 이미지 실제 가로/세로 비율

  const prevTierRef = useRef<number | null>(null);

  // 티어 계산 헬퍼
  const getTierByCount = (n: number) => {
    if (n >= 50) return 4; if (n >= 30) return 3;
    if (n >= 15) return 2; if (n >= 5)  return 1; return 0;
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: clanData } = await supabase.from("clans").select("*").eq("id", id).single();
      setClan(clanData);

      const { data: membersData } = await supabase.from("clan_members").select("*").eq("clan_id", id);
      const memberIds = (membersData || []).map((m) => m.user_id);
      const { data: memberProfiles } = memberIds.length
        ? await supabase.from("profiles").select("id, nickname, battletag, tier, roles, tier_tank, tier_dps, tier_support, main_hero").in("id", memberIds)
        : { data: [] as any[] };
      const pmap = Object.fromEntries((memberProfiles || []).map((p: any) => [p.id, p]));
      const membersWithProfiles = (membersData || []).map((m) => ({ ...m, profiles: pmap[m.user_id] || null }));
      setMembers(membersWithProfiles);
      // 티어 업 이펙트 체크 (sessionStorage 기반 — 페이지 재진입 시에도 발동)
      const newTier = getTierByCount(membersWithProfiles.length);
      try {
        const seenKey = `clan_tier_seen_${id}`;
        const seenRaw = sessionStorage.getItem(seenKey);
        const seenTier = seenRaw !== null ? Number(seenRaw) : null;
        if (seenTier !== null && newTier > seenTier) {
          setTierUpAnim(true);
          setTimeout(() => setTierUpAnim(false), 3000);
        }
        sessionStorage.setItem(seenKey, String(newTier));
      } catch {}
      prevTierRef.current = newTier;

      const { data: battles } = await supabase.from("clan_battles")
        .select("*, clan1:clans!clan1_id(name,badge,clan_members(count)), clan2:clans!clan2_id(name,badge,clan_members(count))")
        .or(`clan1_id.eq.${id},clan2_id.eq.${id}`)
        .eq("status", "완료")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentBattles(battles || []);

      const { data: active } = await supabase.from("clan_battles")
        .select("*, clan1:clans!clan1_id(name,badge,clan_members(count)), clan2:clans!clan2_id(name,badge,clan_members(count))")
        .or(`clan1_id.eq.${id},clan2_id.eq.${id}`)
        .neq("status", "완료")
        .order("created_at", { ascending: false });
      setActiveBattles(active || []);

      const { data: noticeData, error: noticeErr } = await supabase.from("clan_notices")
        .select("*").eq("clan_id", id).order("created_at", { ascending: false });
      if (noticeErr) console.error("공지 로드 오류:", noticeErr);
      // 작성자 닉네임 개별 조회
      const noticeUserIds = (noticeData || []).map((n: any) => n.user_id);
      const { data: noticeProfs } = noticeUserIds.length
        ? await supabase.from("profiles").select("id, nickname").in("id", noticeUserIds)
        : { data: [] as any[] };
      const npmap = Object.fromEntries((noticeProfs || []).map((p: any) => [p.id, p]));
      const noticesWithProfiles = (noticeData || []).map((n: any) => ({ ...n, profiles: npmap[n.user_id] || null }));
      setNotices(noticesWithProfiles);

      if (userData.user) {
        setIsOwner(clanData?.owner_id === userData.user.id);
        setIsMember(!!(membersWithProfiles?.some((m: any) => m.user_id === userData.user.id)));
        const { data: req, error: reqErr } = await supabase.from("clan_requests")
          .select("*").eq("clan_id", id).eq("user_id", userData.user.id)
          .in("status", ["대기중"]).maybeSingle();
        if (reqErr) console.error("신청 상태 조회 오류:", reqErr);
        setHasRequested(!!req);
      }

      const { data: rosterData } = await supabase.from("clan_roster").select("*").eq("clan_id", id).order("created_at");
      setRoster(rosterData || []);
      setLoading(false);
    };
    load();

    // Realtime: 클랜원 변경 시 자동 갱신
    const channel = supabase.channel(`clan_members_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clan_members", filter: `clan_id=eq.${id}` },
        async () => {
          const { data: membersData } = await supabase.from("clan_members").select("*").eq("clan_id", id);
          const ids = (membersData || []).map((m) => m.user_id);
          const { data: profs } = ids.length
            ? await supabase.from("profiles").select("id, nickname, battletag, roles, tier_tank, tier_dps, tier_support, main_hero").in("id", ids)
            : { data: [] as any[] };
          const pm = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
          const updated = (membersData || []).map((m) => ({ ...m, profiles: pm[m.user_id] || null }));
          // 티어 업 이펙트 체크
          const newTier = getTierByCount(updated.length);
          if (prevTierRef.current !== null && newTier > prevTierRef.current) {
            setTierUpAnim(true);
            setTimeout(() => setTierUpAnim(false), 3000);
          }
          prevTierRef.current = newTier;
          try { sessionStorage.setItem(`clan_tier_seen_${id}`, String(newTier)); } catch {}
          setMembers(updated);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleJoin = async () => {
    if (!user) { router.push("/login?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    // 차단 여부 체크
    const { data: banned } = await supabase.from("clan_bans").select("id").eq("clan_id", id).eq("user_id", user.id).maybeSingle();
    if (banned) { alert("이 클랜에서 차단되어 가입 신청할 수 없어요."); return; }
    // 정원 체크 (클랜이 설정한 최대 인원 기준)
    const cap = clan?.max_members || 50;
    const { count: currentCount } = await supabase.from("clan_members").select("*", { count: "exact", head: true }).eq("clan_id", id);
    if ((currentCount || 0) >= cap) { alert(`이 클랜은 클랜원이 꽉 찼어요. (최대 ${cap}명)`); return; }
    const { data: existingMembers } = await supabase.from("clan_members").select("clan_id").eq("user_id", user.id).limit(1);
    if (existingMembers && existingMembers.length > 0) { alert("이미 클랜에 가입되어 있어요. 마이페이지에서 탈퇴 후 가입할 수 있어요."); return; }
    const { data: existingRequest } = await supabase.from("clan_requests").select("id").eq("user_id", user.id).eq("status", "대기중").single();
    if (existingRequest) { alert("이미 다른 클랜에 가입 신청 중이에요."); return; }
    // 통과하면 가입 신청 양식 모달 열기 (실제 신청은 submitJoin)
    setShowJoinModal(true);
  };

  const submitJoin = async (answers: JoinAnswer[]) => {
    if (!user) return;
    setJoining(true);
    // 기존 신청 row 제거 후 새로 insert (중복 방지)
    await supabase.from("clan_requests").delete().eq("clan_id", id).eq("user_id", user.id);
    const { error: insertError } = await supabase.from("clan_requests").insert({ clan_id: id, user_id: user.id, status: "대기중", answers });
    if (insertError) {
      console.error("가입신청 오류:", insertError);
      alert(`가입 신청 중 오류가 발생했어요.\n${insertError.message}`);
      setJoining(false);
      return;
    }
    // 클랜장에게 알림
    if (clan?.owner_id) {
      const { data: myProf } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      await createNotification(
        clan.owner_id,
        "clan_request",
        "새 가입 신청",
        `${myProf?.nickname || "누군가"}님이 ${clan.name} 클랜에 가입을 신청했어요.`,
        `/clan/${id}/manage`
      );
    }
    setHasRequested(true);
    setShowJoinModal(false);
    setJoining(false);
  };

  const handleCancelRequest = async () => {
    if (!confirm("가입 신청을 취소할까요?")) return;
    await supabase.from("clan_requests").delete().eq("clan_id", id).eq("user_id", user.id).eq("status", "대기중");
    setHasRequested(false);
  };

  const handleLeave = async () => {
    if (!user) return;
    if (!confirm(`"${clan?.name}" 클랜에서 탈퇴할까요?`)) return;
    const { error } = await supabase.from("clan_members").delete().eq("clan_id", id).eq("user_id", user.id);
    if (error) { alert("탈퇴 중 오류가 발생했어요. 다시 시도해주세요."); return; }
    setIsMember(false);
    setMembers(prev => prev.filter(m => m.user_id !== user.id));
  };

  // 역할군 분포
  const roleDist = members.reduce((acc: Record<string, number>, m) => {
    (m.profiles?.roles || []).forEach((r: string) => { acc[r] = (acc[r] || 0) + 1; });
    return acc;
  }, {});

  const winRate = clan ? Math.round((clan.wins || 0) / Math.max((clan.wins || 0) + (clan.losses || 0), 1) * 100) : 0;


  if (loading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!clan) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜을 찾을 수 없어요.</div>
    </div>
  );

  const accent = clan.accent_color || "#ff6b23";
  const pendingRoster = roster.filter((r: any) => !members.some((m: any) => m.profiles?.battletag === r.battletag));

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", ["--accent" as any]: accent }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes tierUpBadge { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.3)} 80%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
        @keyframes tierUpGlow { 0%,100%{box-shadow:0 0 0px transparent} 50%{box-shadow:0 0 40px 10px var(--accent)} }
        @keyframes tierUpFloat { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
        @keyframes tierUpOverlay { 0%{opacity:0} 15%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
        @keyframes starBurst { 0%{transform:scale(0) rotate(0deg);opacity:1} 100%{transform:scale(1.5) rotate(45deg);opacity:0} }
        .tier-up-badge { animation: tierUpBadge 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, tierUpGlow 1.5s ease-in-out 0.5s 2; }
        .tier-up-overlay { position:fixed; inset:0; z-index:9999; pointer-events:none; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: tierUpOverlay 3s ease forwards; background: radial-gradient(ellipse at center, rgba(255,107,35,0.15) 0%, transparent 70%); }
        .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent)); filter: brightness(1.05); border: none; color: #fff; padding: 12px 28px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-sm { background: transparent; border: 1px solid var(--accent); color: var(--accent); padding: 8px 18px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-sm:hover { background: var(--accent); color: #fff; }
        .btn-discord { background: rgba(88,101,242,0.15); border: 1px solid rgba(88,101,242,0.4); color: #8ea1e1; padding: 8px 18px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); text-decoration: none; display: inline-block; }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .stat-box { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.1); padding: 16px 20px; text-align: center; clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); transition: all 0.2s; }
        .stat-box:hover { border-color: var(--accent); transform: translateY(-2px); }
        .emblem-glow { position: absolute; inset: -7px; border-radius: 16px; filter: blur(15px); opacity: 0.3; z-index: -1; pointer-events: none; animation: emblemPulse 3s ease-in-out infinite; }
        @keyframes emblemPulse { 0%,100% { opacity: 0.22; transform: scale(0.97); } 50% { opacity: 0.45; transform: scale(1.05); } }
        @media (prefers-reduced-motion: reduce) { .emblem-glow { animation: none !important; } }
        .tier-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); white-space: nowrap; }
        .member-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 4px; transition: all 0.2s; }
        .member-row:hover { border-color: rgba(255,107,35,0.2); }
        .battle-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        @media (max-width: 640px) {
          .stat-box { padding: 12px 8px; }
          .tab-btn { padding: 10px 14px; font-size: 12px; letter-spacing: 1px; }
          .member-row { padding: 12px 14px; gap: 10px; }
          .battle-row { padding: 12px 14px; gap: 8px; flex-wrap: wrap; }
        }
      `}</style>

      <Navbar />

      {showJoinModal && (
        <JoinFormModal
          clan={clan}
          submitting={joining}
          onClose={() => setShowJoinModal(false)}
          onSubmit={submitJoin}
        />
      )}

      {/* YouTube 스타일 배너 - 이미지가 영역을 꽉 채움(cover) */}
      {clan.banner_image && (
        <div style={{ width: "100%", aspectRatio: String(bannerRatio), minHeight: 110, maxHeight: 320, position: "relative", overflow: "hidden", background: "#080c14" }}>
          {/* 흐린 배경 — 비율이 안 맞아 남는 가장자리를 채워 투명하지 않게 */}
          <img src={clan.banner_image} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(0.5)", transform: "scale(1.15)" }} />
          {/* 원본 전체 — 어떤 비율이든 잘리지 않고 다 보임 */}
          <img src={clan.banner_image} alt="배너" onLoad={(e) => { const im = e.currentTarget; if (im.naturalWidth && im.naturalHeight) setBannerRatio(im.naturalWidth / im.naturalHeight); }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", zIndex: 1, display: "block" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", zIndex: 2, background: "linear-gradient(to bottom, transparent, rgba(8,12,20,0.75))" }} />
        </div>
      )}

      {/* 클랜 헤더 정보 */}
      <div style={{ background: `linear-gradient(180deg, ${clan.banner_color || "#0d1220"} 0%, rgba(8,12,20,0.98) 60%)`, borderBottom: `1px solid ${accent}33`, position: "relative", overflow: "hidden", boxShadow: `0 0 80px 0 ${accent}18` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,12 38,34 20,44 2,34 2,12' fill='none' stroke='rgba(255,107,35,0.04)' stroke-width='1'/%3E%3C/svg%3E\")", opacity: 0.5 }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(16px, 3vw, 28px) clamp(16px, 4vw, 32px) 28px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* 클랜 배지/엠블럼 */}
              <div style={{ position: "relative", isolation: "isolate" }} className={tierUpAnim ? "tier-up-badge" : ""}>
                <div className="emblem-glow" style={{ background: accent }} />
                {clan.emblem_image ? (
                  <img src={clan.emblem_image} alt={clan.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: `2px solid ${accent}`, boxShadow: `0 0 0 4px ${accent}1a, 0 6px 16px rgba(0,0,0,0.45)` }} />
                ) : clan.badge ? (
                  <div style={{ width: 80, height: 80, borderRadius: 10, border: `2px solid ${accent}`, boxShadow: `0 0 0 4px ${accent}1a, 0 6px 16px rgba(0,0,0,0.45)`, background: "rgba(8,12,20,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>{clan.badge}</div>
                ) : (
                  <ClanBadge memberCount={members.length} size={80} />
                )}
              </div>

              {/* 티어 업 오버레이 */}
              {tierUpAnim && (() => {
                const TIER_NAMES = ["신생 ROOKIE", "성장 RISING", "정예 ELITE", "강호 VANGUARD", "전설 LEGEND"];
                const TIER_EMOJI = ["🛡️", "⚡", "💎", "👑", "🏆"];
                const t = getTierByCount(members.length);
                return (
                  <div className="tier-up-overlay">
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 48, marginBottom: 12, animation: "starBurst 1s ease-out forwards" }}>{TIER_EMOJI[t]}</div>
                      <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, color: "#ff6b23", letterSpacing: 4, fontWeight: 700, marginBottom: 8 }}>TIER UP!</div>
                      <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>{TIER_NAMES[t]}</div>
                      <div style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>클랜원 전체에게 알림이 전송됐어요!</div>
                    </div>
                  </div>
                );
              })()}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: `clamp(16px, min(5.2vw, ${Math.min(32, Math.round(360 / Math.max(clan.name.length, 1)))}px), 32px)`, fontWeight: 700, letterSpacing: 1, lineHeight: 1.2, wordBreak: "keep-all", color: "#fff", textShadow: `0 0 22px ${accent}55` }}>{clan.name}</h1>
                  <span style={{ fontSize: 13, color: accent, opacity: 0.8, fontWeight: 600, whiteSpace: "nowrap" }}>[{clan.tag}]</span>
                  <ClanTierChip memberCount={members.length} size={24} />
                </div>
                {clan.slogan && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, marginBottom: 8, fontStyle: "italic" }}>"{clan.slogan}"</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {clan.tier && <span className="tier-tag" style={{ borderColor: `${TIER_COLORS[clan.tier]}44`, color: TIER_COLORS[clan.tier] || accent }}>{clan.tier}</span>}
                  <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.style}</span>
                  <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.play_time}</span>
                  <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                    🗓️ {new Date(clan.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 창설
                  </span>
                </div>
                {clan.vibe_tags && clan.vibe_tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {clan.vibe_tags.map((tag: string) => (
                      <span key={tag} style={{ fontSize: 11, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 500, color: accent, background: `${accent}1a`, border: `1px solid ${accent}44`, padding: "3px 10px", borderRadius: 20 }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {clan.discord_link && (
                <a href={clan.discord_link} target="_blank" rel="noopener noreferrer" className="btn-discord">💬 디스코드 참여</a>
              )}
              {!isMember && !isOwner && (
                hasRequested ? (
                  <button onClick={handleCancelRequest} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.4)", color: "#ef5350", padding: "10px 20px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)" }}>
                    신청 완료 · 취소하기
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleJoin} disabled={joining}>
                    {joining ? "신청 중..." : "가입 신청"}
                  </button>
                )
              )}
              {isOwner && (
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/clan/${id}/manage`} className="btn-sm">클랜 관리</a>
                </div>
              )}
              {isMember && !isOwner && (
                <button onClick={handleLeave} style={{ background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.35)", color: "#ef5350", padding: "8px 18px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>클랜 나가기</button>
              )}
              <ShareButton title={`${clan.name} [${clan.tag}] | 오버클랜`} accent={accent} />

            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px) calc(160px + env(safe-area-inset-bottom, 0px))", minHeight: "calc(100vh - 60px)" }}>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "clamp(4px, 1.5vw, 8px)", marginBottom: 28 }}>
          {[
            { label: "클랜원", value: `${members.length}/${clan.max_members}` },
            { label: "승", value: clan.wins || 0 },
            { label: "패", value: clan.losses || 0 },
            { label: "승점", value: `${clan.points || 0}pt` },
            { label: "승률", value: `${winRate}%` },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div style={{ fontSize: 20, fontWeight: 700, color: accent, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#8892a4", marginTop: 4, letterSpacing: 0.5, fontFamily: "Noto Sans KR, sans-serif", whiteSpace: "nowrap" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div style={{ borderBottom: `1px solid ${accent}1a`, marginBottom: 24, display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any }}>
          <style>{`.tab-scroll::-webkit-scrollbar { display: none; }`}</style>
          {["소개", "클랜원", "공지", "대전 기록", "진행중 대전"].map(t => (
            <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* 소개 탭 */}
        {activeTab === "소개" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {/* 클랜 소개 */}
            <div>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>클랜 소개</div>
              <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "18px 20px", marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, wordBreak: "keep-all", overflowWrap: "anywhere" }}>{clan.description ? renderText(clan.description) : "클랜 소개가 없어요."}</p>
              </div>

              {/* 가입 조건 */}
              {clan.join_condition && (
                <>
                  <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>가입 조건</div>
                  <div style={{ background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)", padding: "16px 20px", marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, wordBreak: "keep-all", overflowWrap: "anywhere" }}>{renderText(clan.join_condition)}</p>
                  </div>
                </>
              )}
            </div>

            {/* 구성 정보 (성장 단계 · 티어 · 모집) */}
            <div>
              {/* 클랜 성장 단계 */}
              {(() => {
                const GROWTH_TIERS = [
                  { name: "신생", en: "ROOKIE",   range: "1~4명",   min: 1,  max: 4,  color: "#78909c", glow: "#78909c" },
                  { name: "성장", en: "RISING",   range: "5~14명",  min: 5,  max: 14, color: "#4fc3f7", glow: "#4fc3f7" },
                  { name: "정예", en: "ELITE",    range: "15~29명", min: 15, max: 29, color: "#ce93d8", glow: "#ba68c8" },
                  { name: "강호", en: "VANGUARD", range: "30~49명", min: 30, max: 49, color: "#ffd54f", glow: "#ffd54f" },
                  { name: "전설", en: "LEGEND",   range: "50명+",   min: 50, max: Infinity, color: "#ff6b23", glow: "#ff6b23" },
                ];
                const count = members.length;
                const currentIdx = GROWTH_TIERS.findIndex(t => count >= t.min && count <= t.max);
                const current = GROWTH_TIERS[currentIdx];
                const next = GROWTH_TIERS[currentIdx + 1];
                const needed = next ? next.min - count : 0;
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>클랜 성장 단계</div>
                    <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "18px 20px" }}>

                      {/* 타임라인 */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 16, position: "relative" }}>
                        {GROWTH_TIERS.map((tier, i) => {
                          const isActive = i === currentIdx;
                          const isPast = i < currentIdx;
                          const labelColor = isActive ? tier.color : isPast ? `${tier.color}99` : "rgba(255,255,255,0.2)";
                          return (
                            <div key={tier.en} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                              {/* 연결선 */}
                              {i > 0 && (
                                <div style={{ position: "absolute", left: "-50%", top: 20, width: "100%", height: 2,
                                  background: i <= currentIdx
                                    ? `linear-gradient(90deg, ${GROWTH_TIERS[i-1].color}88, ${tier.color}88)`
                                    : "rgba(255,255,255,0.06)",
                                  zIndex: 0 }} />
                              )}
                              {/* 배지 */}
                              <div style={{ position: "relative", zIndex: 1,
                                opacity: isPast || isActive ? 1 : 0.25,
                                filter: isActive ? `drop-shadow(0 0 8px ${tier.glow}88)` : "none",
                                transform: isActive ? "scale(1.15)" : "scale(1)",
                                transition: "all 0.3s",
                              }}>
                                <ClanBadge tierIndex={i} size={40} />
                              </div>
                              {/* 라벨 */}
                              <div style={{ marginTop: 4, textAlign: "center" }}>
                                <div style={{ fontSize: 8, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 0.5, color: labelColor }}>
                                  {tier.en}
                                </div>
                                <div style={{ fontSize: 8, color: labelColor, fontFamily: "Noto Sans KR, sans-serif", marginTop: 1 }}>
                                  {tier.range}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 현재 상태 */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ClanBadge memberCount={count} size={32} />
                          <div>
                            <div style={{ fontSize: 13, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 700, color: current?.color }}>
                              {current?.name} {current?.en}
                            </div>
                            <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>현재 {count}명</div>
                          </div>
                        </div>
                        {next && (
                          <div style={{ fontSize: 12, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", textAlign: "right" }}>
                            <span style={{ color: next.color, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{next.en}</span>까지<br />
                            <span style={{ color: "#ff6b23", fontWeight: 700 }}>{needed}명</span> 더 필요해요
                          </div>
                        )}
                        {!next && (
                          <div style={{ fontSize: 12, color: "#ffd54f", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 700 }}>
                            🏆 최고 등급 달성!
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* 역할군별 티어 분포 */}
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>역할군별 티어</div>
              <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "16px 20px", marginBottom: 16 }}>
                {[
                  { role: "탱커", icon: "🛡️", color: "#4fc3f7", key: "tier_tank" },
                  { role: "딜러", icon: "⚔️", color: "#ff6b23", key: "tier_dps" },
                  { role: "힐러", icon: "💊", color: "#4caf50", key: "tier_support" },
                ].map(({ role, icon, color, key }) => {
                  const tierMembers = members.filter(m => m.profiles?.[key]);
                  const tierCounts = tierMembers.reduce((acc: Record<string, number>, m) => {
                    const t = m.profiles?.[key];
                    if (t) acc[t] = (acc[t] || 0) + 1;
                    return acc;
                  }, {});
                  return (
                    <div key={role} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: 12, color, fontWeight: 700, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{role}</span>
                        <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{tierMembers.length}명</span>
                      </div>
                      {tierMembers.length === 0 ? (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "Noto Sans KR, sans-serif", paddingLeft: 20 }}>정보 없음</div>
                      ) : (
                        <div style={{ paddingLeft: 20, display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {Object.entries(tierCounts).map(([tier, count]) => (
                            <span key={tier} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", background: `${TIER_COLORS[tier]}22`, color: TIER_COLORS[tier] || "#8892a4", border: `1px solid ${TIER_COLORS[tier]}44`, clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>
                              {tier} {count as number}명
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 클랜원 수 바 */}
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>모집 현황</div>
              <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>현재 클랜원</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: members.length >= clan.max_members ? "#ef5350" : "#4caf50", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>
                    {members.length} / {clan.max_members}명
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(members.length / clan.max_members) * 100}%`, height: "100%", background: members.length >= clan.max_members ? "#ef5350" : "linear-gradient(90deg, #ff6b23, #ff8c42)", borderRadius: 3 }} />
                </div>
                {members.length >= clan.max_members && (
                  <div style={{ fontSize: 11, color: "#ef5350", marginTop: 6, fontFamily: "Noto Sans KR, sans-serif" }}>모집 마감</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 클랜원 탭 */}
        {activeTab === "클랜원" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: 12, padding: "8px 18px", fontSize: 11, color: "#8892a4", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>
              <span>닉네임</span><span>직책</span><span>역할군별 티어</span>
            </div>
            {members.map(m => (
              <div key={m.id} className="member-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: 12, alignItems: "center" }}>
                <a href={`/profile/${m.user_id}`} style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, color: "#e8eaf0", textDecoration: "none" }}>{m.profiles?.nickname || "유저"}</a>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: m.role === "클랜장" ? "rgba(255,107,35,0.2)" : "rgba(255,255,255,0.05)", color: m.role === "클랜장" ? "#ff6b23" : "#8892a4", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", width: "fit-content" }}>{m.role}</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { icon: "🛡️", key: "tier_tank", color: "#4fc3f7" },
                    { icon: "⚔️", key: "tier_dps", color: "#ff6b23" },
                    { icon: "💊", key: "tier_support", color: "#4caf50" },
                  ].filter(r => m.profiles?.[r.key]).map(r => (
                    <span key={r.key} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", background: `${TIER_COLORS[m.profiles?.[r.key]]}22`, color: TIER_COLORS[m.profiles?.[r.key]] || "#8892a4", border: `1px solid ${TIER_COLORS[m.profiles?.[r.key]]}44`, clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>
                      {r.icon} {m.profiles?.[r.key]}
                    </span>
                  ))}
                  {!m.profiles?.tier_tank && !m.profiles?.tier_dps && !m.profiles?.tier_support && (
                    <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>정보 없음</span>
                  )}
                </div>

              </div>
            ))}
            {pendingRoster.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 8px", padding: "0 18px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#8892a4", letterSpacing: 1, fontWeight: 600 }}>🔒 인증 대기 {pendingRoster.length}</span>
                  <span style={{ fontSize: 11, color: "#5a6478", fontFamily: "Noto Sans KR, sans-serif" }}>본인이 이 배틀태그로 가입하면 자동으로 합류해요</span>
                </div>
                {pendingRoster.map((r: any) => (
                  <div key={r.id} className="member-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: 12, alignItems: "center", opacity: 0.55 }}>
                    <span style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 14, color: "#c8cad0" }}>{r.battletag}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "rgba(255,255,255,0.05)", color: "#8892a4", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", width: "fit-content" }}>🔒 인증 대기</span>
                    <span style={{ fontSize: 11, color: "#5a6478", fontFamily: "Noto Sans KR, sans-serif" }}>{r.note || "—"}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 공지 탭 */}
        {activeTab === "공지" && (
          <NoticeTab notices={notices} setNotices={setNotices} isOwner={isOwner} user={user} clanId={id as string} />
        )}

        {/* 진행중 대전 탭 */}
        {activeTab === "진행중 대전" && (
          <ActiveBattleTab battles={activeBattles} clanId={id as string} isOwner={isOwner} setBattles={setActiveBattles} />
        )}

        {/* 대전 기록 탭 */}
        {activeTab === "대전 기록" && (
          <BattleTab battles={recentBattles} clanId={id as string} />
        )}
      </div>
    </div>
  );
}

function NoticeTab({ notices, setNotices, isOwner, user, clanId }: any) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePost = async () => {
    if (!title || !content) return;
    setSaving(true);
    const { data, error } = await supabase.from("clan_notices").insert({ clan_id: clanId, user_id: user.id, title, content }).select().single();
    if (error || !data) {
      console.error("공지 작성 오류:", error);
      alert("공지 작성에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSaving(false);
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
    setNotices((prev: any[]) => [{ ...data, profiles: prof }, ...prev]);
    setTitle(""); setContent(""); setShowForm(false); setSaving(false);
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm("공지를 삭제할까요?")) return;
    await supabase.from("clan_notices").delete().eq("id", noticeId);
    setNotices((prev: any[]) => prev.filter((n: any) => n.id !== noticeId));
  };

  return (
    <div>
      {isOwner && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ background: "rgba(255,107,35,0.12)", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "8px 18px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>+ 공지 작성</button>
          )}
        </div>
      )}
      {isOwner && showForm && (
        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: 20, marginBottom: 16 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목" style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 14px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%", marginBottom: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="공지 내용" style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 14px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%", minHeight: 100, resize: "vertical", marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePost} disabled={saving} style={{ background: "linear-gradient(135deg, #ff6b23, #ff8c42)", border: "none", color: "#fff", padding: "10px 22px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>{saving ? "등록 중..." : "등록"}</button>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8892a4", padding: "10px 22px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>취소</button>
          </div>
        </div>
      )}
      {notices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 공지가 없어요.</div>
      ) : notices.map((n: any) => (
        <a key={n.id} href={`/clan/${clanId}/notice/${n.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div style={{ background: "rgba(13,20,35,0.7)", border: "1px solid rgba(255,107,35,0.1)", padding: "18px 22px", marginBottom: 8, clipPath: "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))", transition: "border-color 0.2s", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,107,35,0.35)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,107,35,0.1)")}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>📢</span>
                <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</span>
              </div>
              {isOwner && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(n.id); }} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 14, opacity: 0.5, flexShrink: 0 }}>🗑</button>}
            </div>
            <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.content}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{n.profiles?.nickname} · {new Date(n.created_at).toLocaleDateString("ko-KR")}</span>
              <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>자세히 →</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function BattleTab({ battles, clanId }: any) {
  const [filter, setFilter] = useState("전체");
  const filtered = filter === "전체" ? battles : battles.filter((b: any) => b.type === filter);

  const wins = filtered.filter((b: any) => b.winner_id === clanId).length;
  const losses = filtered.filter((b: any) => b.winner_id && b.winner_id !== clanId).length;
  const draws = filtered.filter((b: any) => !b.winner_id).length;

  return (
    <div>
      {/* 필터 + 요약 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["전체", "정규전", "친선전"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? "rgba(255,107,35,0.15)" : "rgba(13,20,35,0.8)",
              border: `1px solid ${filter === f ? "#ff6b23" : "rgba(255,107,35,0.15)"}`,
              color: filter === f ? "#ff6b23" : "#8892a4",
              padding: "6px 16px",
              fontFamily: "'Cinzel', 'Rajdhani', sans-serif",
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              cursor: "pointer",
              clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
              transition: "all 0.2s",
            }}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 && (
          <div style={{ display: "flex", gap: 16, fontSize: 13, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>
            <span style={{ color: "#4caf50", fontWeight: 700 }}>{wins}승</span>
            <span style={{ color: "#ef5350", fontWeight: 700 }}>{losses}패</span>
            <span style={{ color: "#ffd54f", fontWeight: 700 }}>{draws}무</span>
            <span style={{ color: "#8892a4" }}>총 {filtered.length}경기</span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
          {filter === "전체" ? "아직 완료된 대전이 없어요." : `${filter} 기록이 없어요.`}
        </div>
      ) : filtered.map((b: any) => {
        const isClan1 = b.clan1_id === clanId;
        const myScore = isClan1 ? b.clan1_score : b.clan2_score;
        const opScore = isClan1 ? b.clan2_score : b.clan1_score;
        const opClan = isClan1 ? b.clan2 : b.clan1;
              const opName = opClan?.name || '해체된 클랜';

        const isWin = b.winner_id === clanId;
        const isDraw = !b.winner_id;
        return (
          <div key={b.id} style={{ background: "rgba(13,20,35,0.6)", border: `1px solid ${isWin ? "rgba(76,175,80,0.15)" : isDraw ? "rgba(255,213,79,0.08)" : "rgba(239,83,80,0.1)"}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: isWin ? "rgba(76,175,80,0.15)" : isDraw ? "rgba(255,213,79,0.1)" : "rgba(239,83,80,0.1)", color: isWin ? "#4caf50" : isDraw ? "#ffd54f" : "#ef5350", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", minWidth: 28, textAlign: "center" }}>
              {isWin ? "승" : isDraw ? "무" : "패"}
            </span>
            <ClanBadge memberCount={opClan?.clan_members?.[0]?.count || 0} size={32} />
            <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, flex: 1 }}>{opName}</span>
            <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "#e8eaf0" }}>{myScore} - {opScore}</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "2px 8px", background: b.type === "정규전" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.05)", color: b.type === "정규전" ? "#ff6b23" : "#8892a4", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>{b.type}</span>
            <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", minWidth: 70, textAlign: "right" }}>
              {new Date(b.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
// 모바일 스타일은 이미 page.tsx style 태그에 추가

function ActiveBattleTab({ battles, clanId, isOwner, setBattles }: any) {
  const router = useRouter();
  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    "모집중": { label: "상대 모집중", color: "#ba68c8" },
    "신청중": { label: "수락 대기", color: "#ffd54f" },
    "날짜확정": { label: "날짜 확정", color: "#4fc3f7" },
    "멤버모집": { label: "멤버 모집중", color: "#ff6b23" },
    "대전준비": { label: "대전 준비", color: "#4caf50" },
    "결과입력": { label: "결과 입력중", color: "#ff6b23" },
  };

  // 상대 클랜이 해체됐는지 판별 (상대 clan_id는 있는데 조인 결과가 null)
  const isOpponentGone = (b: any) => {
    const isClan1 = b.clan1_id === clanId;
    const opId = isClan1 ? b.clan2_id : b.clan1_id;
    const opClan = isClan1 ? b.clan2 : b.clan1;
    return !!opId && !opClan; // 열린모집(clan2_id null)은 opId가 null이라 false
  };

  // 일반 방문자에게는 해체된 대전 숨김, 클랜장에게는 정리할 수 있게 노출
  const visible = isOwner ? battles : battles.filter((b: any) => !isOpponentGone(b));

  // 클랜장: 진행중 대전 취소/정리 (clan_battles 행 삭제 — /battle/[id] 취소와 동일 방식)
  const handleCancel = async (b: any, gone: boolean) => {
    const msg = gone
      ? "상대 클랜이 해체되어 진행할 수 없는 대전이에요. 목록에서 정리할까요?"
      : "이 대전을 취소할까요?\n모집된 멤버 정보도 함께 삭제되고, 상대 클랜에도 취소가 반영돼요.";
    if (!confirm(msg)) return;
    const { error } = await supabase.from("clan_battles").delete().eq("id", b.id);
    if (error) { alert("처리에 실패했어요. 잠시 후 다시 시도해주세요."); return; }
    setBattles((prev: any[]) => prev.filter((x) => x.id !== b.id));
  };

  if (visible.length === 0) return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
      진행 중인 클랜대전이 없어요.
    </div>
  );

  return (
    <div>
      {visible.map((b: any) => {
        const isClan1 = b.clan1_id === clanId;
        const opClan = isClan1 ? b.clan2 : b.clan1;
        const status = STATUS_LABEL[b.status];
        const gone = isOpponentGone(b);
        const borderColor = gone ? "#ef5350" : (status?.color || "#8892a4");

        return (
          <div key={b.id}
            onClick={() => { if (!gone) router.push(`/battle/${b.id}`); }}
            style={{ background: gone ? "rgba(239,83,80,0.05)" : "rgba(13,20,35,0.6)", border: `1px solid ${borderColor}33`, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s", cursor: gone ? "default" : "pointer" }}
            onMouseEnter={e => { if (!gone) e.currentTarget.style.borderColor = `${borderColor}88`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${borderColor}33`; }}>

            {gone ? (
              <span style={{ background: "rgba(239,83,80,0.15)", color: "#ef5350", border: "1px solid rgba(239,83,80,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap", flexShrink: 0, minWidth: 74, textAlign: "center" }}>상대 해체됨</span>
            ) : (
              <span className="status-tag" style={{ background: `${status?.color}22`, color: status?.color, border: `1px solid ${status?.color}44`, fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "3px 8px", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap", flexShrink: 0, minWidth: 74, textAlign: "center" }}>{status?.label}</span>
            )}

            {!gone && (opClan ? (
              <ClanBadge memberCount={opClan?.clan_members?.[0]?.count || 0} size={28} />
            ) : (
              <span style={{ width: 28, height: 28, borderRadius: 6, border: "1px dashed rgba(186,104,200,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ce93d8", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>?</span>
            ))}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4, color: gone ? "#8892a4" : (opClan ? "#e8eaf0" : "#ce93d8"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {gone ? "해체된 클랜" : (opClan ? `vs ${opClan.name}` : "공개 모집")}
              </div>
              <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {gone ? "상대 클랜이 사라져 진행할 수 없어요." : `${b.type} · ${b.confirmed_date ? new Date(b.confirmed_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }) : "날짜 협의중"}`}
              </div>
            </div>

            {isOwner ? (
              <button onClick={(e) => { e.stopPropagation(); handleCancel(b, gone); }} style={{ background: "rgba(239,83,80,0.12)", border: "1px solid rgba(239,83,80,0.4)", color: "#ef5350", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, padding: "7px 14px", cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {gone ? "정리" : "취소"}
              </button>
            ) : (!gone && (
              <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>클랜대전 →</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// 진행중 대전 탭 렌더링 - 클랜 프로필 페이지에서 사용
// (page.tsx 내부에서 activeTab === "진행중 대전" 일 때 렌더)
