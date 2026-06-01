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

const ROLE_ICONS: Record<string, string> = { "탱커": "🛡️", "딜러": "⚔️", "힐러": "💊" };

export default function ClanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [clan, setClan] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [recentBattles, setRecentBattles] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState("소개");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

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

      if (currentUser) {
        setIsOwner(clanData?.owner_id === currentUser.id);
        setIsMember(!!(membersWithProfiles?.some((m: any) => m.user_id === currentUser.id)));
        const { data: req } = await supabase.from("clan_requests").select("*").eq("clan_id", id).eq("user_id", currentUser.id).single();
        setHasRequested(!!req);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleJoin = async () => {
    if (!user) { router.push("/login?redirect=" + encodeURIComponent(window.location.pathname)); return; }
    const { data: existingMembers } = await supabase.from("clan_members").select("clan_id").eq("user_id", user.id).limit(1);
    if (existingMembers && existingMembers.length > 0) { alert("이미 클랜에 가입되어 있어요. 마이페이지에서 탈퇴 후 다른 클랜에 가입할 수 있어요."); return; }
    const { data: existingRequest } = await supabase.from("clan_requests").select("id").eq("user_id", user.id).eq("status", "대기중").single();
    if (existingRequest) { alert("이미 다른 클랜에 가입 신청 중이에요."); return; }
    setJoining(true);
    await supabase.from("clan_requests").insert({ clan_id: id, user_id: user.id });
    setHasRequested(true);
    setJoining(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 클랜원 티어 분포
  const tierDistrib = members.reduce((acc: any, m) => {
    const tier = m.profiles?.tier;
    if (tier) acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  // 역할군 분포
  const roleDistrib = members.reduce((acc: any, m) => {
    (m.profiles?.roles || []).forEach((r: string) => { acc[r] = (acc[r] || 0) + 1; });
    return acc;
  }, {});

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", fontSize: 18, letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!clan) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>클랜을 찾을 수 없어요.</div>
    </div>
  );

  const bannerColor = clan.banner_color || "#1a1f35";

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-sm { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 8px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-sm:hover { background: rgba(255,107,35,0.1); }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .tab-btn:hover { color: #ff6b23; }
        .member-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 20px; display: flex; align-items: center; gap: 14px; transition: all 0.2s; margin-bottom: 6px; }
        .member-row:hover { border-color: rgba(255,107,35,0.2); }
        .role-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .stat-box { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.1); padding: 16px 20px; text-align: center; clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
        .battle-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 6px; }
        .tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 10px; border: 1px solid; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
      `}</style>

      <Navbar />

      {/* 배너 */}
      <div style={{ background: `linear-gradient(135deg, ${bannerColor} 0%, #080c14 100%)`, borderBottom: "1px solid rgba(255,107,35,0.15)", position: "relative", overflow: "hidden" }}>
        {/* 헥사곤 패턴 */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }} viewBox="0 0 100 40" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="hex" x="0" y="0" width="20" height="23" patternUnits="userSpaceOnUse"><polygon points="10,1 19,6 19,17 10,22 1,17 1,6" fill="none" stroke="#ff6b23" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#hex)"/>
        </svg>

        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 32px 32px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
            {/* 클랜 배지 */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width="90" height="100" viewBox="0 0 80 90">
                <polygon points="40,4 76,22 76,68 40,86 4,68 4,22" fill="rgba(255,107,35,0.15)" stroke="#ff6b23" strokeWidth="1.5"/>
                <polygon points="40,14 66,28 66,62 40,76 14,62 14,28" fill="rgba(255,107,35,0.08)" stroke="rgba(255,107,35,0.4)" strokeWidth="1"/>
                <text x="40" y="54" textAnchor="middle" fontSize="30">{clan.badge}</text>
              </svg>
            </div>

            {/* 클랜 정보 */}
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>{clan.name}</h1>
                <span style={{ fontSize: 15, color: "#ff6b23", opacity: 0.7, fontWeight: 600 }}>[{clan.tag}]</span>
              </div>
              {clan.slogan && (
                <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, marginBottom: 10, fontStyle: "italic" }}>"{clan.slogan}"</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="tag" style={{ borderColor: `${TIER_COLORS[clan.tier] || "#ff6b23"}66`, color: TIER_COLORS[clan.tier] || "#ff6b23" }}>{clan.tier}</span>
                <span className="tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.style}</span>
                <span className="tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.play_time}</span>
                <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                  👥 {members.length} / {clan.max_members}명
                </span>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", paddingBottom: 8 }}>
              {!isMember && !isOwner && (
                <button className="btn-primary" onClick={handleJoin} disabled={joining || hasRequested}>
                  {hasRequested ? "신청 완료" : joining ? "신청 중..." : "가입 신청"}
                </button>
              )}
              {isOwner && (
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/clan/${id}/chat`} className="btn-sm">채팅방</a>
                  <a href={`/clan/${id}/manage`} className="btn-sm">관리</a>
                </div>
              )}
              {isMember && !isOwner && (
                <a href={`/clan/${id}/chat`} className="btn-sm">채팅방</a>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                {clan.discord_link && (
                  <a href={clan.discord_link} target="_blank" rel="noreferrer" className="btn-sm" style={{ borderColor: "rgba(88,101,242,0.5)", color: "#8893f0" }}>
                    디스코드 입장
                  </a>
                )}
                <button className="btn-sm" onClick={copyLink}>{copied ? "✅ 복사됨" : "🔗 공유"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px" }}>
        {/* 통계 바 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "20px 0", borderBottom: "1px solid rgba(255,107,35,0.1)" }}>
          {[
            { label: "클랜원", value: `${members.length}명` },
            { label: "클랜대전 승", value: `${clan.wins || 0}` },
            { label: "클랜대전 패", value: `${clan.losses || 0}` },
            { label: "승점", value: `${clan.points || 0}PT` },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", display: "flex" }}>
          {["소개", "클랜원", "대전 기록"].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        <div style={{ padding: "24px 0" }}>

          {/* 소개 탭 */}
          {activeTab === "소개" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* 클랜 소개 */}
              <div>
                <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>클랜 소개</div>
                <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.08)", padding: "18px 20px", marginBottom: 14 }}>
                  <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, fontWeight: 300 }}>{clan.description || "소개가 없어요."}</p>
                </div>

                {/* 가입 조건 */}
                {clan.join_condition && (
                  <>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>가입 조건</div>
                    <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.08)", padding: "18px 20px" }}>
                      <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, fontWeight: 300, whiteSpace: "pre-wrap" }}>{clan.join_condition}</p>
                    </div>
                  </>
                )}
              </div>

              {/* 클랜원 구성 */}
              <div>
                {/* 티어 분포 */}
                <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>클랜원 티어 분포</div>
                <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.08)", padding: "18px 20px", marginBottom: 14 }}>
                  {Object.keys(tierDistrib).length === 0 ? (
                    <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>티어 정보 없음</div>
                  ) : Object.entries(tierDistrib).map(([tier, count]: any) => (
                    <div key={tier} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: TIER_COLORS[tier] || "#8892a4", fontWeight: 700, letterSpacing: 1 }}>{tier}</span>
                        <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Rajdhani, sans-serif" }}>{count}명</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{ width: `${(count / members.length) * 100}%`, height: "100%", background: TIER_COLORS[tier] || "#ff6b23", borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 역할군 분포 */}
                <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>역할군 분포</div>
                <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.08)", padding: "18px 20px" }}>
                  {Object.keys(roleDistrib).length === 0 ? (
                    <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>역할군 정보 없음</div>
                  ) : (
                    <div style={{ display: "flex", gap: 16 }}>
                      {["탱커", "딜러", "힐러"].map(role => (
                        <div key={role} style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>{ROLE_ICONS[role]}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{roleDistrib[role] || 0}</div>
                          <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1 }}>{role}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 클랜원 탭 */}
          {activeTab === "클랜원" && (
            <div>
              {members.map(m => (
                <div key={m.id} className="member-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>{m.profiles?.nickname || "유저"}</span>
                      <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{m.profiles?.battletag}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {m.profiles?.tier && (
                        <span className="role-tag" style={{ background: `${TIER_COLORS[m.profiles.tier] || "#ff6b23"}22`, color: TIER_COLORS[m.profiles.tier] || "#ff6b23", border: `1px solid ${TIER_COLORS[m.profiles.tier] || "#ff6b23"}44` }}>{m.profiles.tier}</span>
                      )}
                      {(m.profiles?.roles || []).map((r: string) => (
                        <span key={r} style={{ fontSize: 11 }}>{ROLE_ICONS[r]}</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: m.role === "클랜장" ? "#ff6b23" : "#8892a4", fontWeight: 700, letterSpacing: 1, background: m.role === "클랜장" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.04)", padding: "3px 10px", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>{m.role}</span>
                </div>
              ))}
            </div>
          )}

          {/* 대전 기록 탭 */}
          {activeTab === "대전 기록" && (
            <div>
              {recentBattles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 대전 기록이 없어요.</div>
              ) : recentBattles.map(b => {
                const isWin = b.winner_id === id;
                const isDraw = b.winner_id === null;
                return (
                  <div key={b.id} className="battle-row">
                    <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700, clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", background: isWin ? "rgba(76,175,80,0.2)" : isDraw ? "rgba(255,213,79,0.2)" : "rgba(239,83,80,0.2)", color: isWin ? "#4caf50" : isDraw ? "#ffd54f" : "#ef5350" }}>
                      {isWin ? "승" : isDraw ? "무" : "패"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700 }}>
                        {b.clan1?.badge} {b.clan1?.name} <span style={{ color: "#ff6b23" }}>vs</span> {b.clan2?.badge} {b.clan2?.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#8892a4", marginTop: 2 }}>{new Date(b.created_at).toLocaleDateString("ko-KR")}</div>
                    </div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#e8eaf0" }}>
                      {b.clan1_score} - {b.clan2_score}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
