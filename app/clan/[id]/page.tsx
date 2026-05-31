"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function ClanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [clan, setClan] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;
      setUser(currentUser);

      const { data: clanData } = await supabase.from("clans").select("*").eq("id", id).single();
      setClan(clanData);

      const { data: membersData } = await supabase.from("clan_members").select("*").eq("clan_id", id);
      // 각 클랜원의 프로필 가져오기
      const membersWithProfiles = await Promise.all((membersData || []).map(async (m) => {
        const { data: profile } = await supabase.from("profiles").select("nickname, battletag").eq("id", m.user_id).single();
        return { ...m, profiles: profile };
      }));
      setMembers(membersWithProfiles);

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
    
    // 이미 다른 클랜에 가입했는지 확인
    const { data: existingMember } = await supabase.from("clan_members").select("clan_id, clans(name)").eq("user_id", user.id).single();
    if (existingMember) {
      alert("이미 클랜에 가입되어 있어요. 마이페이지에서 탈퇴 후 다른 클랜에 가입할 수 있어요.");
      return;
    }

    // 이미 대기 중인 신청이 있는지 확인
    const { data: existingRequest } = await supabase.from("clan_requests").select("id").eq("user_id", user.id).eq("status", "대기중").single();
    if (existingRequest) {
      alert("이미 다른 클랜에 가입 신청 중이에요.");
      return;
    }

    setJoining(true);
    await supabase.from("clan_requests").insert({ clan_id: id, user_id: user.id });
    setHasRequested(true);
    setJoining(false);
  };

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

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .member-row { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 14px 20px; display: flex; align-items: center; gap: 16px; transition: all 0.2s; }
        .member-row:hover { border-color: rgba(255,107,35,0.2); }
        .role-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px" }}>
        {/* 클랜 헤더 */}
        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 40px", marginBottom: 24, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 64 }}>{clan.badge}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 30, fontWeight: 700 }}>{clan.name}</h1>
                <span style={{ fontSize: 14, color: "#ff6b23", opacity: 0.6, fontWeight: 600 }}>[{clan.tag}]</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <span className="tier-tag">{clan.tier}</span>
                <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.style}</span>
                <span className="tier-tag" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#8892a4" }}>{clan.play_time}</span>
              </div>
              <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, lineHeight: 1.7 }}>{clan.description}</p>
            </div>
            <div>
              {!isMember && !isOwner && (
                <button className="btn-primary" onClick={handleJoin} disabled={joining || hasRequested}>
                  {hasRequested ? "신청 완료" : joining ? "신청 중..." : "가입 신청"}
                </button>
              )}
              {isOwner && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1 }}>내 클랜</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`/clan/${id}/chat`} style={{ background: "rgba(79,195,247,0.15)", border: "1px solid rgba(79,195,247,0.4)", color: "#4fc3f7", padding: "8px 16px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textDecoration: "none", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>채팅방</a>
                    <a href={`/clan/${id}/manage`} style={{ background: "rgba(255,107,35,0.15)", border: "1px solid rgba(255,107,35,0.4)", color: "#ff6b23", padding: "8px 16px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textDecoration: "none", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>클랜 관리</a>
                  </div>
                </div>
              )}
              {isMember && !isOwner && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#4caf50", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1 }}>가입된 클랜</span>
                  <a href={`/clan/${id}/chat`} style={{ background: "rgba(79,195,247,0.15)", border: "1px solid rgba(79,195,247,0.4)", color: "#4fc3f7", padding: "8px 16px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textDecoration: "none", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>채팅방</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 클랜원 수 */}
        <div style={{ background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.1)", padding: "16px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, letterSpacing: 2, color: "#8892a4" }}>클랜원</span>
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#ff6b23" }}>{members.length} / {clan.max_members}</span>
        </div>

        {/* 클랜원 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {members.map(m => (
            <div key={m.id} className="member-row">
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, marginRight: 10 }}>
                  {m.profiles?.nickname || "유저"}
                </span>
                <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                  {m.profiles?.battletag}
                </span>
              </div>
              <span className="role-tag" style={{
                background: m.role === "클랜장" ? "rgba(255,107,35,0.2)" : "rgba(255,255,255,0.05)",
                color: m.role === "클랜장" ? "#ff6b23" : "#8892a4",
              }}>{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { };
