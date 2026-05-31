"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function ClanManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }

      const { data: clan } = await supabase.from("clans").select("owner_id").eq("id", id).single();
      if (clan?.owner_id !== userData.user.id) { router.push("/"); return; }

      const { data: reqs } = await supabase.from("clan_requests").select("*").eq("clan_id", id).eq("status", "대기중");
      const reqsWithProfiles = await Promise.all((reqs || []).map(async (r) => {
        const { data: profile } = await supabase.from("profiles").select("nickname, battletag").eq("id", r.user_id).single();
        return { ...r, profiles: profile };
      }));
      setRequests(reqsWithProfiles);

      const { data: mems } = await supabase.from("clan_members").select("*").eq("clan_id", id);
      const memsWithProfiles = await Promise.all((mems || []).map(async (m) => {
        const { data: profile } = await supabase.from("profiles").select("nickname, battletag").eq("id", m.user_id).single();
        return { ...m, profiles: profile };
      }));
      setMembers(memsWithProfiles);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAccept = async (req: any) => {
    await supabase.from("clan_members").insert({ clan_id: id, user_id: req.user_id, role: "클랜원" });
    await supabase.from("clan_requests").update({ status: "수락" }).eq("id", req.id);
    setRequests(prev => prev.filter(r => r.id !== req.id));
    setMembers(prev => [...prev, { ...req, role: "클랜원" }]);
  };

  const handleReject = async (req: any) => {
    await supabase.from("clan_requests").update({ status: "거절" }).eq("id", req.id);
    setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleKick = async (member: any) => {
    if (!confirm(`${member.profiles?.nickname}님을 클랜에서 내보낼까요?`)) return;
    await supabase.from("clan_members").delete().eq("id", member.id);
    setMembers(prev => prev.filter(m => m.id !== member.id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-accept { background: linear-gradient(135deg, #4caf50, #66bb6a); border: none; color: #fff; padding: 8px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); }
        .btn-reject { background: transparent; border: 1px solid rgba(239,83,80,0.4); color: #ef5350; padding: 7px 18px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); }
        .btn-kick { background: transparent; border: 1px solid rgba(239,83,80,0.2); color: #ef5350; padding: 6px 14px; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
        .btn-kick:hover { opacity: 1; }
        .btn-back { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 8px 20px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); text-decoration: none; }
        .row { background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.08); padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
        .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>클랜 관리</h1>
          </div>
          <a href={`/clan/${id}`} className="btn-back">← 클랜 페이지</a>
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>LOADING...</div>
        ) : (
          <>
            {/* 가입 신청 목록 */}
            <div style={{ marginBottom: 40 }}>
              <div className="section-title">
                <div style={{ width: 3, height: 16, background: "#ff6b23" }} />
                <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, letterSpacing: 2 }}>가입 신청</h2>
                <span style={{ background: "rgba(255,107,35,0.2)", color: "#ff6b23", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{requests.length}</span>
              </div>
              {requests.length === 0 ? (
                <div style={{ padding: "24px", background: "rgba(13,20,35,0.5)", border: "1px solid rgba(255,107,35,0.08)", textAlign: "center", color: "#8892a4", fontSize: 13, fontFamily: "Noto Sans KR, sans-serif" }}>
                  대기 중인 가입 신청이 없어요.
                </div>
              ) : requests.map(req => (
                <div key={req.id} className="row" style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, marginRight: 10 }}>{req.profiles?.nickname || "유저"}</span>
                    <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{req.profiles?.battletag}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-accept" onClick={() => handleAccept(req)}>수락</button>
                    <button className="btn-reject" onClick={() => handleReject(req)}>거절</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 클랜원 목록 */}
            <div>
              <div className="section-title">
                <div style={{ width: 3, height: 16, background: "#4fc3f7" }} />
                <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, letterSpacing: 2 }}>클랜원 목록</h2>
                <span style={{ background: "rgba(79,195,247,0.1)", color: "#4fc3f7", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{members.length}명</span>
              </div>
              {members.map(m => (
                <div key={m.id} className="row" style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, marginRight: 10 }}>{m.profiles?.nickname || "유저"}</span>
                    <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{m.profiles?.battletag}</span>
                  </div>
                  <span style={{ fontSize: 11, color: m.role === "클랜장" ? "#ff6b23" : "#8892a4", fontWeight: 700, letterSpacing: 1, marginRight: 12 }}>{m.role}</span>
                  {m.role !== "클랜장" && (
                    <button className="btn-kick" onClick={() => handleKick(m)}>내보내기</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
