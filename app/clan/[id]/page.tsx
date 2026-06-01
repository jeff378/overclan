"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

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
  const [notices, setNotices] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState("소개");

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: clanData } = await supabase.from("clans").select("*").eq("id", id).single();
      setClan(clanData);

      const { data: membersData } = await supabase.from("clan_members").select("*").eq("clan_id", id);
      const membersWithProfiles = await Promise.all((membersData || []).map(async (m) => {
        const { data: profile } = await supabase.from("profiles").select("nickname, battletag, tier, roles").eq("id", m.user_id).single();
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

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-sm { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 8px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-sm:hover { background: rgba(255,107,35,0.1); }
        .btn-discord { background: rgba(88,101,242,0.15); border: 1px solid rgba(88,101,242,0.4); color: #8ea1e1; padding: 8px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); text-decoration: none; display: inline-block; }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .stat-box { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.1); padding: 16px 20px; text-align: center; clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); }
        .tier-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .member-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 18px; display: flex; align-items: center; gap: 14px; margin-bottom: 4px; transition: all 0.2s; }
        .member-row:hover { border-color: rgba(255,107,35,0.2); }
        .battle-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
      `}</style>

      <Navbar />

      {/* 배너 */}
      <div style={{ background: clan.banner_color || "#1a1f35", borderBottom: "1px solid rgba(255,107,35,0.2)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,12 38,34 20,44 2,34 2,12' fill='none' stroke='rgba(255,107,35,0.08)' stroke-width='1'/%3E%3C/svg%3E\")", opacity: 0.5 }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 32px 32px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* 클랜 배지 */}
              <div style={{ position: "relative" }}>
                <svg width="80" height="90" viewBox="0 0 80 90">
                  <polygon points="40,4 76,22 76,68 40,86 4,68 4,22" fill="rgba(255,107,35,0.1)" stroke="#ff6b23" strokeWidth="1.5"/>
                  <polygon points="40,16 64,30 64,60 40,74 16,60 16,30" fill="rgba(255,107,35,0.05)" stroke="rgba(255,107,35,0.3)" strokeWidth="1"/>
                  <text x="40" y="54" textAnchor="middle" fontSize="28">{clan.badge}</text>
                </svg>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>{clan.name}</h1>
                  <span style={{ fontSize: 14, color: "#ff6b23", opacity: 0.6, fontWeight: 600 }}>[{clan.tag}]</span>
                </div>
                {clan.slogan && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, marginBottom: 8, fontStyle: "italic" }}>"{clan.slogan}"</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="tier-tag" style={{ borderColor: `${TIER_COLORS[clan.tier]}44`, color: TIER_COLORS[clan.tier] || "#ff6b23" }}>{clan.tier}</span>
                  <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.style}</span>
                  <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.play_time}</span>
                  <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                    🗓️ {new Date(clan.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 창설
                  </span>
                </div>
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
                  <a href={`/clan/${id}/chat`} className="btn-sm">채팅방</a>
                  <a href={`/clan/${id}/manage`} className="btn-sm">클랜 관리</a>
                </div>
              )}
              {isMember && !isOwner && (
                <a href={`/clan/${id}/chat`} className="btn-sm">채팅방</a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px" }}>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "클랜원", value: `${members.length}/${clan.max_members}` },
            { label: "정규전 승", value: clan.wins || 0 },
            { label: "정규전 패", value: clan.losses || 0 },
            { label: "승점", value: `${clan.points || 0}pt` },
            { label: "승률", value: `${winRate}%` },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 24, display: "flex" }}>
          {["소개", "클랜원", "공지", "대전 기록"].map(t => (
            <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* 소개 탭 */}
        {activeTab === "소개" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* 클랜 소개 */}
            <div>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>클랜 소개</div>
              <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "18px 20px", marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{clan.description || "클랜 소개가 없어요."}</p>
              </div>

              {/* 가입 조건 */}
              {clan.join_condition && (
                <>
                  <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>가입 조건</div>
                  <div style={{ background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)", padding: "16px 20px", marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{clan.join_condition}</p>
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

              {/* 역할군 분포 */}
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>역할군 구성</div>
              <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "16px 20px", marginBottom: 16 }}>
                {Object.keys(roleDist).length === 0 ? (
                  <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>역할군 정보 없음</div>
                ) : Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                  <div key={role} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 12, color: cfg.color, fontWeight: 700, minWidth: 40, fontFamily: "Rajdhani, sans-serif" }}>{role}</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${((roleDist[role] || 0) / members.length) * 100}%`, height: "100%", background: cfg.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Rajdhani, sans-serif" }}>{roleDist[role] || 0}명</span>
                  </div>
                ))}
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
            <div style={{ display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1fr", gap: 12, padding: "8px 18px", fontSize: 11, color: "#8892a4", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>
              <span>역할</span><span>닉네임</span><span>배틀태그</span><span>티어</span><span>직책</span>
            </div>
            {members.map(m => (
              <div key={m.id} className="member-row" style={{ display: "grid", gridTemplateColumns: "80px 2fr 1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {(m.profiles?.roles || []).length === 0 ? (
                    <span style={{ fontSize: 11, color: "#8892a4" }}>-</span>
                  ) : (m.profiles?.roles || []).map((r: string) => (
                    <span key={r} style={{ fontSize: 14 }}>{ROLE_CONFIG[r]?.icon}</span>
                  ))}
                </div>
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700 }}>{m.profiles?.nickname || "유저"}</span>
                <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{m.profiles?.battletag}</span>
                <span style={{ fontSize: 11, color: TIER_COLORS[m.profiles?.tier] || "#8892a4", fontWeight: 700 }}>{m.profiles?.tier || "-"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: m.role === "클랜장" ? "rgba(255,107,35,0.2)" : "rgba(255,255,255,0.05)", color: m.role === "클랜장" ? "#ff6b23" : "#8892a4", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", width: "fit-content" }}>{m.role}</span>
              </div>
            ))}
          </div>
        )}

        {/* 공지 탭 */}
        {activeTab === "공지" && (
          <div>
            {notices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 공지가 없어요.</div>
            ) : notices.map(n => (
              <div key={n.id} style={{ background: "rgba(13,20,35,0.7)", border: "1px solid rgba(255,107,35,0.1)", padding: "20px 24px", marginBottom: 8, clipPath: "polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14 }}>📢</span>
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>{n.title}</span>
                </div>
                <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, whiteSpace: "pre-wrap", marginBottom: 12 }}>{n.content}</p>
                <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                  {n.profiles?.nickname} · {new Date(n.created_at).toLocaleDateString("ko-KR")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 대전 기록 탭 */}
        {activeTab === "대전 기록" && (
          <div>
            {recentBattles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 완료된 대전이 없어요.</div>
            ) : recentBattles.map(b => {
              const isClan1 = b.clan1_id === id;
              const myScore = isClan1 ? b.clan1_score : b.clan2_score;
              const opScore = isClan1 ? b.clan2_score : b.clan1_score;
              const opClan = isClan1 ? b.clan2 : b.clan1;
              const isWin = b.winner_id === id;
              const isDraw = !b.winner_id;
              return (
                <div key={b.id} className="battle-row">
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", background: isWin ? "rgba(76,175,80,0.15)" : isDraw ? "rgba(255,213,79,0.1)" : "rgba(239,83,80,0.1)", color: isWin ? "#4caf50" : isDraw ? "#ffd54f" : "#ef5350", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>
                    {isWin ? "승" : isDraw ? "무" : "패"}
                  </span>
                  <span style={{ fontSize: 22 }}>{opClan?.badge}</span>
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, flex: 1 }}>{opClan?.name}</span>
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, fontWeight: 700, color: "#e8eaf0" }}>{myScore} - {opScore}</span>
                  <span style={{ fontSize: 10, color: b.type === "정규전" ? "#ff6b23" : "#8892a4", fontWeight: 700, letterSpacing: 1 }}>{b.type}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
