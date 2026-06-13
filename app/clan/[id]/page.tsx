"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import ClanBadgeJSX from "../../components/ClanBadge";
const ClanBadge = ClanBadgeJSX as any;
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ShareButton from "../../components/ShareButton";

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

const TIER_COLORS: Record<string, string> = {
  "챔피언": "#ffd700", "그랜드마스터": "#ff9800", "마스터": "#ff6b23",
  "다이아": "#4fc3f7", "플래티넘": "#b0bec5", "골드": "#ffd54f",
  "실버": "#90a4ae", "브론즈": "#a1887f",
};

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
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState("소개");
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: clanData } = await supabase.from("clans").select("*").eq("id", id).single();
      setClan(clanData);

      const { data: membersData } = await supabase.from("clan_members").select("*").eq("clan_id", id);
      const membersWithProfiles = await Promise.all((membersData || []).map(async (m) => {
        const { data: profile } = await supabase.from("profiles").select("nickname, battletag, tier, roles, tier_tank, tier_dps, tier_support").eq("id", m.user_id).single();
        return { ...m, profiles: profile };
      }));
      setMembers(membersWithProfiles);

      const { data: battles } = await supabase.from("clan_battles")
        .select("*, clan1:clans!clan1_id(name,badge), clan2:clans!clan2_id(name,badge)")
        .or(`clan1_id.eq.${id},clan2_id.eq.${id}`)
        .eq("status", "완료")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentBattles(battles || []);

      const { data: active } = await supabase.from("clan_battles")
        .select("*, clan1:clans!clan1_id(name,badge), clan2:clans!clan2_id(name,badge)")
        .or(`clan1_id.eq.${id},clan2_id.eq.${id}`)
        .neq("status", "완료")
        .order("created_at", { ascending: false });
      setActiveBattles(active || []);

      const { data: noticeData } = await supabase.from("clan_notices")
        .select("*, profiles(nickname)").eq("clan_id", id).order("created_at", { ascending: false });
      // profiles 조인
      const noticesWithProfiles = await Promise.all((noticeData || []).map(async (n: any) => {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", n.user_id).single();
        return { ...n, profiles: prof };
      }));
      setNotices(noticesWithProfiles);

      if (userData.user) {
        setIsOwner(clanData?.owner_id === userData.user.id);
        setIsMember(!!(membersWithProfiles?.some((m: any) => m.user_id === userData.user.id)));
        const { data: req } = await supabase.from("clan_requests").select("*").eq("clan_id", id).eq("user_id", userData.user.id).eq("status", "대기중").single();
        setHasRequested(!!req);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleJoin = async () => {
    if (!user) { router.push("/login?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    const { data: existingMembers } = await supabase.from("clan_members").select("clan_id").eq("user_id", user.id).limit(1);
    if (existingMembers && existingMembers.length > 0) { alert("이미 클랜에 가입되어 있어요. 마이페이지에서 탈퇴 후 가입할 수 있어요."); return; }
    const { data: existingRequest } = await supabase.from("clan_requests").select("id").eq("user_id", user.id).eq("status", "대기중").single();
    if (existingRequest) { alert("이미 다른 클랜에 가입 신청 중이에요."); return; }
    setJoining(true);
    await supabase.from("clan_requests").insert({ clan_id: id, user_id: user.id });
    setHasRequested(true);
    setJoining(false);
  };

  // 티어 분포
  const tierDist = members.reduce((acc: Record<string, number>, m) => {
    const t = m.profiles?.tier;
    if (t) acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // 역할군 분포
  const roleDist = members.reduce((acc: Record<string, number>, m) => {
    (m.profiles?.roles || []).forEach((r: string) => { acc[r] = (acc[r] || 0) + 1; });
    return acc;
  }, {});

  const winRate = clan ? Math.round((clan.wins || 0) / Math.max((clan.wins || 0) + (clan.losses || 0), 1) * 100) : 0;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clan) return;
    setBannerUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${id}/banner.${ext}`;
      const { error: upErr } = await supabase.storage.from('clan-banners').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('clan-banners').getPublicUrl(path);
      await supabase.from('clans').update({ banner_image: publicUrl }).eq('id', id);
      setClan((prev: any) => ({ ...prev, banner_image: publicUrl }));
    } catch (err) {
      console.error('배너 업로드 실패:', err);
    } finally {
      setBannerUploading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!clan) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜을 찾을 수 없어요.</div>
    </div>
  );

  const accent = clan.accent_color || "#ff6b23";

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", ["--accent" as any]: accent }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent)); filter: brightness(1.05); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-sm { background: transparent; border: 1px solid var(--accent); color: var(--accent); padding: 8px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-sm:hover { background: var(--accent); color: #fff; }
        .btn-discord { background: rgba(88,101,242,0.15); border: 1px solid rgba(88,101,242,0.4); color: #8ea1e1; padding: 8px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); text-decoration: none; display: inline-block; }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .stat-box { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.1); padding: 16px 20px; text-align: center; clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); }
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

      {/* YouTube 스타일 배너 */}
      <div style={{ width: "100%", height: "clamp(120px, 20vw, 220px)", position: "relative", overflow: "hidden", background: clan.banner_image ? "transparent" : `linear-gradient(135deg, ${clan.banner_color || "#1a1f35"} 0%, rgba(8,12,20,0.9) 100%)`, cursor: isOwner ? "pointer" : "default" }}
        onClick={() => isOwner && (document.getElementById("banner-input") as HTMLInputElement)?.click()}>
        {/* 배너 이미지 */}
        {clan.banner_image && (
          <img src={clan.banner_image} alt="배너" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        )}
        {/* 헥사곤 패턴 오버레이 */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,12 38,34 20,44 2,34 2,12' fill='none' stroke='rgba(255,107,35,0.06)' stroke-width='1'/%3E%3C/svg%3E\")", opacity: 1 }} />
        {/* 하단 페이드 */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to bottom, transparent, rgba(8,12,20,0.8))" }} />
        {/* 클랜장: 배너 변경 버튼 */}
        {isOwner && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0)", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}>
            <span style={{ opacity: 0, transition: "opacity 0.2s", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 18px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
              {bannerUploading ? "업로드 중..." : "📷  배너 변경"}
            </span>
          </div>
        )}
        <input id="banner-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleBannerUpload} />
      </div>

      {/* 클랜 헤더 정보 */}
      <div style={{ background: "rgba(8,12,20,0.95)", borderBottom: `1px solid ${accent}33`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,12 38,34 20,44 2,34 2,12' fill='none' stroke='rgba(255,107,35,0.04)' stroke-width='1'/%3E%3C/svg%3E\")", opacity: 0.5 }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(16px, 3vw, 28px) clamp(16px, 4vw, 32px) 28px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* 클랜 배지/엠블럼 */}
              <div style={{ position: "relative" }}>
                {clan.emblem_image ? (
                  <img src={clan.emblem_image} alt={clan.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: `2px solid ${accent}`, boxShadow: `0 0 16px ${accent}55` }} />
                ) : (
                  <ClanBadge memberCount={members.length} size={80} />
                )}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: `clamp(18px, ${Math.max(18, Math.min(32, 320 / Math.max(clan.name.length, 1)))}px, 32px)`, fontWeight: 700, letterSpacing: 1, lineHeight: 1.2, wordBreak: "keep-all" }}>{clan.name}</h1>
                  <span style={{ fontSize: 13, color: accent, opacity: 0.8, fontWeight: 600, whiteSpace: "nowrap" }}>[{clan.tag}]</span>
                </div>
                {clan.slogan && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, marginBottom: 8, fontStyle: "italic" }}>"{clan.slogan}"</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="tier-tag" style={{ borderColor: `${TIER_COLORS[clan.tier]}44`, color: TIER_COLORS[clan.tier] || accent }}>{clan.tier}</span>
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
                <button className="btn-primary" onClick={handleJoin} disabled={joining || hasRequested}>
                  {hasRequested ? "신청 완료" : joining ? "신청 중..." : "가입 신청"}
                </button>
              )}
              {isOwner && (
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/clan/${id}/manage`} className="btn-sm">클랜 관리</a>
                </div>
              )}
              <ShareButton title={`${clan.name} [${clan.tag}] | 오버클랜`} accent={accent} />

            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(16px, 4vw, 28px) clamp(16px, 4vw, 32px)" }}>

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
              <div style={{ fontSize: 20, fontWeight: 700, color: accent, fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
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
                <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8 }}>{clan.description ? renderText(clan.description) : "클랜 소개가 없어요."}</p>
              </div>

              {/* 가입 조건 */}
              {clan.join_condition && (
                <>
                  <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>가입 조건</div>
                  <div style={{ background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)", padding: "16px 20px", marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8 }}>{renderText(clan.join_condition)}</p>
                  </div>
                </>
              )}


            </div>

            {/* 구성 정보 */}
            <div>
              {/* 티어 분포 */}
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>티어 구성</div>
              <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "16px 20px", marginBottom: 16 }}>
                {Object.keys(tierDist).length === 0 ? (
                  <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>티어 정보 없음</div>
                ) : Object.entries(tierDist).map(([tier, count]) => (
                  <div key={tier} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: TIER_COLORS[tier] || "#8892a4", fontWeight: 700, minWidth: 80, fontFamily: "Rajdhani, sans-serif" }}>{tier}</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${((count as number) / members.length) * 100}%`, height: "100%", background: TIER_COLORS[tier] || "#ff6b23", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Rajdhani, sans-serif", minWidth: 20 }}>{count as number}명</span>
                  </div>
                ))}
              </div>

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
                        <span style={{ fontSize: 12, color, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{role}</span>
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
                  <span style={{ fontSize: 14, fontWeight: 700, color: members.length >= clan.max_members ? "#ef5350" : "#4caf50", fontFamily: "Rajdhani, sans-serif" }}>
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
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700 }}>{m.profiles?.nickname || "유저"}</span>
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
          </div>
        )}

        {/* 공지 탭 */}
        {activeTab === "공지" && (
          <NoticeTab notices={notices} setNotices={setNotices} isOwner={isOwner} user={user} clanId={id as string} />
        )}

        {/* 진행중 대전 탭 */}
        {activeTab === "진행중 대전" && (
          <ActiveBattleTab battles={activeBattles} clanId={id as string} />
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
    const { data } = await supabase.from("clan_notices").insert({ clan_id: clanId, user_id: user.id, title, content }).select().single();
    if (data) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      setNotices((prev: any[]) => [{ ...data, profiles: prof }, ...prev]);
    }
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
            <button onClick={() => setShowForm(true)} style={{ background: "rgba(255,107,35,0.12)", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "8px 18px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>+ 공지 작성</button>
          )}
        </div>
      )}
      {isOwner && showForm && (
        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: 20, marginBottom: 16 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목" style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 14px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%", marginBottom: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="공지 내용" style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 14px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%", minHeight: 100, resize: "vertical", marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePost} disabled={saving} style={{ background: "linear-gradient(135deg, #ff6b23, #ff8c42)", border: "none", color: "#fff", padding: "10px 22px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>{saving ? "등록 중..." : "등록"}</button>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8892a4", padding: "10px 22px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>취소</button>
          </div>
        </div>
      )}
      {notices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 공지가 없어요.</div>
      ) : notices.map((n: any) => (
        <div key={n.id} style={{ background: "rgba(13,20,35,0.7)", border: "1px solid rgba(255,107,35,0.1)", padding: "20px 24px", marginBottom: 8, clipPath: "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>📢</span>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>{n.title}</span>
            </div>
            {isOwner && <button onClick={() => handleDelete(n.id)} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 14, opacity: 0.5 }}>🗑</button>}
          </div>
          <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 12 }}>{n.content}</p>
          <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{n.profiles?.nickname} · {new Date(n.created_at).toLocaleDateString("ko-KR")}</div>
        </div>
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
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              cursor: "pointer",
              clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
              transition: "all 0.2s",
            }}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 && (
          <div style={{ display: "flex", gap: 16, fontSize: 13, fontFamily: "Rajdhani, sans-serif" }}>
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
              const opName = opClan?.name || '삭제된 클랜';

        const isWin = b.winner_id === clanId;
        const isDraw = !b.winner_id;
        return (
          <div key={b.id} style={{ background: "rgba(13,20,35,0.6)", border: `1px solid ${isWin ? "rgba(76,175,80,0.15)" : isDraw ? "rgba(255,213,79,0.08)" : "rgba(239,83,80,0.1)"}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: isWin ? "rgba(76,175,80,0.15)" : isDraw ? "rgba(255,213,79,0.1)" : "rgba(239,83,80,0.1)", color: isWin ? "#4caf50" : isDraw ? "#ffd54f" : "#ef5350", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", minWidth: 28, textAlign: "center" }}>
              {isWin ? "승" : isDraw ? "무" : "패"}
            </span>
            <ClanBadge memberCount={0} size={32} />
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, flex: 1 }}>{opClan?.name}</span>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#e8eaf0" }}>{myScore} - {opScore}</span>
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

function ActiveBattleTab({ battles, clanId }: any) {
  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    "신청중": { label: "수락 대기", color: "#ffd54f" },
    "날짜확정": { label: "날짜 확정", color: "#4fc3f7" },
    "멤버모집": { label: "멤버 모집중", color: "#ff6b23" },
    "대전준비": { label: "대전 준비", color: "#4caf50" },
    "결과입력": { label: "결과 입력중", color: "#ff6b23" },
  };

  if (battles.length === 0) return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
      진행 중인 클랜대전이 없어요.
    </div>
  );

  return (
    <div>
      {battles.map((b: any) => {
        const isClan1 = b.clan1_id === clanId;
        const opClan = isClan1 ? b.clan2 : b.clan1;
        const status = STATUS_LABEL[b.status];
        return (
          <a key={b.id} href="/battle" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ background: "rgba(13,20,35,0.6)", border: `1px solid ${status?.color}33`, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${status?.color}88`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = `${status?.color}33`)}>
              <div>
                <span className="status-tag" style={{ background: `${status?.color}22`, color: status?.color, border: `1px solid ${status?.color}44`, fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "2px 8px", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>{status?.label}</span>
              </div>
              <ClanBadge memberCount={0} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  vs {opClan?.name || "삭제된 클랜"}
                </div>
                <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                  {b.type} · {b.confirmed_date ? new Date(b.confirmed_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }) : "날짜 협의중"}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Rajdhani, sans-serif" }}>클랜대전 →</div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// 진행중 대전 탭 렌더링 - 클랜 프로필 페이지에서 사용
// (page.tsx 내부에서 activeTab === "진행중 대전" 일 때 렌더)
