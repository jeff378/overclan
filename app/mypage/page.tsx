"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [myClans, setMyClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
      setProfile(prof);

      const { data: mems } = await supabase.from("clan_members").select("role, clans(id, name, badge, tier, wins, losses, points)").eq("user_id", userData.user.id);
      setMyClans(mems || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleLeave = async (clanId: string, clanName: string) => {
    if (!confirm(`"${clanName}" 클랜에서 탈퇴할까요?`)) return;
    await supabase.from("clan_members").delete().eq("clan_id", clanId).eq("user_id", profile.id);
    setMyClans(prev => prev.filter(m => m.clans?.id !== clanId));
  };

  const handleDeleteClan = async (clanId: string, clanName: string) => {
    const confirm1 = confirm(`"${clanName}" 클랜을 삭제할까요?
모든 클랜원, 대전 기록이 함께 삭제돼요.`);
    if (!confirm1) return;
    const input = window.prompt("확인을 위해 클랜명을 입력해주세요:");
    if (input !== clanName) { alert("클랜명이 일치하지 않아요."); return; }
    await supabase.from("clans").delete().eq("id", clanId);
    setMyClans(prev => prev.filter(m => m.clans?.id !== clanId));
    alert("클랜이 삭제됐어요.");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", fontSize: 18, letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .clan-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.12); padding: 20px 24px; display: flex; align-items: center; gap: 16px; transition: all 0.2s; text-decoration: none; color: inherit; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); }
        .clan-card:hover { border-color: rgba(255,107,35,0.4); transform: translateX(4px); box-shadow: -3px 0 0 #ff6b23; }
        .stat-box { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.1); padding: 16px 20px; text-align: center; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .role-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>

        {/* 프로필 카드 */}
        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "32px 36px", marginBottom: 28, position: "relative", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRight: "2px solid #ff6b23", borderTop: "2px solid #ff6b23" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 64, height: 64, background: "rgba(255,107,35,0.15)", border: "2px solid rgba(255,107,35,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{profile?.nickname}</div>
              <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{profile?.battletag}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {profile?.tier && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", background: "rgba(255,107,35,0.15)", color: "#ff6b23", border: "1px solid rgba(255,107,35,0.3)", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>{profile.tier}</span>
                )}
                {(profile?.roles || []).map((r: string) => (
                  <span key={r} style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", background: "rgba(255,255,255,0.05)", color: "#8892a4", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>
                    {r === "탱커" ? "🛡️" : r === "딜러" ? "⚔️" : "💊"} {r}
                  </span>
                ))}
                {profile?.main_hero && (
                  <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>주력: {profile.main_hero}</span>
                )}
              </div>
            </div>
            <a href="/profile-edit" style={{ background: "rgba(255,107,35,0.12)", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "8px 16px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textDecoration: "none", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", alignSelf: "flex-start" }}>프로필 수정</a>
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
          {[
            { label: "소속 클랜", value: myClans.length },
            { label: "클랜장", value: myClans.filter(m => m.role === "클랜장").length },
            { label: "총 클랜대전 승", value: myClans.reduce((acc, m) => acc + (m.clans?.wins || 0), 0) },
          ].map(s => (
            <div key={s.label} className="stat-box">
              <div style={{ fontSize: 26, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#8892a4", marginTop: 4, letterSpacing: 1, fontFamily: "Noto Sans KR, sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 내 클랜 목록 */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 16, background: "#ff6b23" }} />
              <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, letterSpacing: 2 }}>내 클랜</h2>
            </div>
            <a href="/clan/create" className="btn-primary">+ 클랜 만들기</a>
          </div>

          {myClans.length === 0 ? (
            <div style={{ background: "rgba(13,20,35,0.5)", border: "1px dashed rgba(255,107,35,0.2)", padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
              <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, marginBottom: 20 }}>아직 소속된 클랜이 없어요.</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <a href="/clan/create" className="btn-primary">클랜 만들기</a>
                <a href="/find" style={{ background: "transparent", border: "1px solid rgba(255,107,35,0.4)", color: "#ff6b23", padding: "10px 24px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, textDecoration: "none", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>클랜 찾기</a>
              </div>
            </div>
          ) : myClans.map(m => (
            <a key={m.clans?.id} href={`/clan/${m.clans?.id}`} className="clan-card" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 32 }}>{m.clans?.badge}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700 }}>{m.clans?.name}</span>
                  <span className="tier-tag">{m.clans?.tier}</span>
                </div>
                <span className="role-tag" style={{
                  background: m.role === "클랜장" ? "rgba(255,107,35,0.2)" : "rgba(255,255,255,0.05)",
                  color: m.role === "클랜장" ? "#ff6b23" : "#8892a4",
                }}>{m.role}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#4caf50", fontFamily: "Rajdhani, sans-serif" }}>{m.clans?.wins || 0}</div>
                    <div style={{ fontSize: 10, color: "#8892a4" }}>승</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#ef5350", fontFamily: "Rajdhani, sans-serif" }}>{m.clans?.losses || 0}</div>
                    <div style={{ fontSize: 10, color: "#8892a4" }}>패</div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
