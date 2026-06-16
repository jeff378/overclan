"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { createNotification } from "../../../../lib/notifications";

export default function ClanManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [newBattletag, setNewBattletag] = useState("");
  const [clanName, setClanName] = useState("");
  const [loading, setLoading] = useState(true);

  const handleDeleteClan = async () => {
    const confirm1 = confirm(`"${clanName}" 클랜을 정말 삭제할까요?\n이 작업은 되돌릴 수 없어요.`);
    if (!confirm1) return;
    const input = window.prompt("확인을 위해 클랜명을 입력해주세요:");
    if (input !== clanName) { alert("클랜명이 일치하지 않아요."); return; }
    await supabase.from("clans").delete().eq("id", id);
    alert("클랜이 삭제됐어요.");
    router.push("/");
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }

      const { data: clan } = await supabase.from("clans").select("owner_id, name").eq("id", id).single();
      if (clan?.owner_id !== userData.user.id) { router.push("/"); return; }
      setClanName(clan?.name || "");

      const { data: reqs } = await supabase.from("clan_requests")
        .select("*").eq("clan_id", id)
        .or("status.eq.대기중,status.is.null");
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

      const { data: banData } = await supabase.from("clan_bans").select("*").eq("clan_id", id).order("created_at", { ascending: false });
      const bansWithProfiles = await Promise.all((banData || []).map(async (b) => {
        const { data: profile } = await supabase.from("profiles").select("nickname, battletag").eq("id", b.user_id).single();
        return { ...b, profiles: profile };
      }));
      setBans(bansWithProfiles);

      const { data: rosterData } = await supabase.from("clan_roster").select("*").eq("clan_id", id).order("created_at");
      setRoster(rosterData || []);
      setLoading(false);
    };
    load();
  }, [id]);

  // 인원수 → 티어 인덱스
  const getTierByCount = (n: number) => {
    if (n >= 51) return 4;
    if (n >= 31) return 3;
    if (n >= 16) return 2;
    if (n >= 6)  return 1;
    return 0;
  };
  const TIER_NAMES = ["신생 ROOKIE", "성장 RISING", "정예 ELITE", "강호 VANGUARD", "전설 LEGEND"];
  const TIER_EMOJI = ["🛡️", "⚡", "💎", "👑", "🏆"];

  const handleAccept = async (req: any) => {
    // 50명 제한 체크
    const { count: currentCount } = await supabase.from("clan_members").select("*", { count: "exact", head: true }).eq("clan_id", id);
    if ((currentCount || 0) >= 50) {
      alert("클랜원이 50명에 도달했어요. 더 이상 수락할 수 없어요. (최대 50명)");
      return;
    }

    const beforeTier = getTierByCount(currentCount || 0);
    const { error: insertErr } = await supabase.from("clan_members").insert({ clan_id: id, user_id: req.user_id, role: "클랜원" });
    if (insertErr) {
      console.error("클랜원 추가 오류:", insertErr);
      alert(`클랜원 추가 중 오류가 발생했어요.\n${insertErr.message}`);
      return;
    }
    await supabase.from("clan_requests").update({ status: "수락" }).eq("id", req.id);

    // 가입 승인 알림 (신청자)
    await createNotification(req.user_id, "clan_accepted", "가입 승인", `${clanName} 클랜 가입이 승인됐어요! 🎉`, `/clan/${id}`);

    // 티어 업 감지 → 클랜원 전체 알림
    const newCount = (currentCount || 0) + 1;
    const afterTier = getTierByCount(newCount);
    if (afterTier > beforeTier) {
      const tierName = TIER_NAMES[afterTier];
      const tierEmoji = TIER_EMOJI[afterTier];
      const { data: allMembers } = await supabase.from("clan_members").select("user_id").eq("clan_id", id);
      await Promise.all((allMembers || []).map(m =>
        createNotification(
          m.user_id,
          "event",
          `${tierEmoji} 클랜 티어 업!`,
          `${clanName} 클랜이 ${tierName} 단계에 진입했어요! 축하해요!`,
          `/clan/${id}`
        )
      ));
    }

    setRequests(prev => prev.filter(r => r.id !== req.id));

    // DB에서 클랜원 목록 재로드 (상태 동기화)
    const { data: mems } = await supabase.from("clan_members").select("*").eq("clan_id", id);
    const memsWithProfiles = await Promise.all((mems || []).map(async (m: any) => {
      const { data: profile } = await supabase.from("profiles").select("nickname, battletag").eq("id", m.user_id).single();
      return { ...m, profiles: profile };
    }));
    setMembers(memsWithProfiles);
  };

  const handleReject = async (req: any, ban = false) => {
    if (ban && !confirm(`${req.profiles?.nickname || "이 유저"}님을 거절하고 차단할까요?\n차단하면 이 클랜에 다시 가입 신청할 수 없어요. (차단 목록에서 해제 가능)`)) return;
    await supabase.from("clan_requests").update({ status: "거절" }).eq("id", req.id);
    await createNotification(req.user_id, "clan_rejected", "가입 신청 결과", `${clanName} 클랜 가입 신청이 반려됐어요.`, "/find");
    if (ban) {
      const { error } = await supabase.from("clan_bans").insert({ clan_id: id, user_id: req.user_id });
      if (error) { console.error("차단 오류:", error); alert("차단 처리에 실패했어요. (clan_bans 테이블 마이그레이션 확인 필요)"); }
      else setBans(prev => [{ user_id: req.user_id, clan_id: id, profiles: req.profiles, created_at: new Date().toISOString() }, ...prev]);
    }
    setRequests(prev => prev.filter(r => r.id !== req.id));
  };

  const handleKick = async (member: any, ban = false) => {
    const msg = ban
      ? `${member.profiles?.nickname}님을 내보내고 차단할까요?\n차단하면 다시 가입 신청할 수 없어요. (차단 목록에서 해제 가능)`
      : `${member.profiles?.nickname}님을 클랜에서 내보낼까요?`;
    if (!confirm(msg)) return;
    await supabase.from("clan_members").delete().eq("id", member.id);
    if (ban) {
      const { error } = await supabase.from("clan_bans").insert({ clan_id: id, user_id: member.user_id });
      if (error) { console.error("차단 오류:", error); alert("차단 처리에 실패했어요. (clan_bans 테이블 마이그레이션 확인 필요)"); }
      else setBans(prev => [{ user_id: member.user_id, clan_id: id, profiles: member.profiles, created_at: new Date().toISOString() }, ...prev]);
    }
    setMembers(prev => prev.filter(m => m.id !== member.id));
  };

  const handleUnban = async (ban: any) => {
    if (!confirm(`${ban.profiles?.nickname || "이 유저"}님의 차단을 해제할까요?\n해제하면 다시 가입 신청할 수 있어요.`)) return;
    await supabase.from("clan_bans").delete().eq("clan_id", id).eq("user_id", ban.user_id);
    setBans(prev => prev.filter(b => b.user_id !== ban.user_id));
  };

  const handleAddRoster = async () => {
    const bt = newBattletag.trim();
    if (!bt) return;
    const btRegex = /^[a-zA-Z가-힣0-9]{2,12}#[0-9]{4,7}$/;
    if (!btRegex.test(bt)) { alert("배틀태그 형식이 올바르지 않아요. 예) 닉네임#1234"); return; }
    const { data, error } = await supabase.from("clan_roster").insert({ clan_id: id, battletag: bt }).select().single();
    if (error) {
      if (error.code === "23505") alert("이미 등록된 배틀태그예요.");
      else { console.error("명단 등록 오류:", error); alert("등록 중 오류가 발생했어요."); }
      return;
    }
    setRoster(prev => [...prev, data]);
    setNewBattletag("");
  };

  const handleRemoveRoster = async (rid: string) => {
    await supabase.from("clan_roster").delete().eq("id", rid);
    setRoster(prev => prev.filter(r => r.id !== rid));
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-accept { background: linear-gradient(135deg, #4caf50, #66bb6a); border: none; color: #fff; padding: 8px 18px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); }
        .btn-reject { background: transparent; border: 1px solid rgba(239,83,80,0.4); color: #ef5350; padding: 7px 18px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); }
        .btn-kick { background: transparent; border: 1px solid rgba(239,83,80,0.2); color: #ef5350; padding: 6px 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
        .btn-kick:hover { opacity: 1; }
        .btn-ban { background: transparent; border: 1px solid rgba(239,83,80,0.5); color: #ef5350; padding: 7px 16px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); }
        .btn-ban:hover { background: rgba(239,83,80,0.12); }
        .btn-unban { background: transparent; border: 1px solid rgba(79,195,247,0.4); color: #4fc3f7; padding: 6px 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; clip-path: polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%); }
        .btn-back { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 8px 20px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); text-decoration: none; }
        .row { background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.08); padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
        .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>클랜 관리</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`/clan/${id}/edit`} style={{ background: "rgba(255,107,35,0.15)", border: "1px solid rgba(255,107,35,0.4)", color: "#ff6b23", padding: "8px 16px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, textDecoration: "none", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>클랜 수정</a>
            <a href={`/clan/${id}`} className="btn-back">← 클랜 페이지</a>
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
        ) : (
          <>
            {/* 가입 신청 목록 */}
            <div style={{ marginBottom: 40 }}>
              <div className="section-title">
                <div style={{ width: 3, height: 16, background: "#ff6b23" }} />
                <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, letterSpacing: 2 }}>가입 신청</h2>
                <span style={{ background: "rgba(255,107,35,0.2)", color: "#ff6b23", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{requests.length}</span>
              </div>
              {requests.length === 0 ? (
                <div style={{ padding: "24px", background: "rgba(13,20,35,0.5)", border: "1px solid rgba(255,107,35,0.08)", textAlign: "center", color: "#8892a4", fontSize: 13, fontFamily: "Noto Sans KR, sans-serif" }}>
                  대기 중인 가입 신청이 없어요.
                </div>
              ) : requests.map(req => (
                <div key={req.id} style={{ marginBottom: 6 }}>
                  <div className="row">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, marginRight: 10 }}>{req.profiles?.nickname || "유저"}</span>
                      <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{req.profiles?.battletag}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn-accept" onClick={() => handleAccept(req)}>수락</button>
                      <button className="btn-reject" onClick={() => handleReject(req)}>거절</button>
                      <button className="btn-ban" onClick={() => handleReject(req, true)}>차단</button>
                    </div>
                  </div>
                  {Array.isArray(req.answers) && req.answers.length > 0 && (
                    <div style={{ background: "rgba(8,12,20,0.5)", border: "1px solid rgba(255,107,35,0.06)", borderTop: "none", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {req.answers.map((a: any, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, fontFamily: "Noto Sans KR, sans-serif" }}>
                          <span style={{ color: "#8892a4", minWidth: 110, flexShrink: 0 }}>{a.label}</span>
                          <span style={{ color: "#c8cad0", wordBreak: "break-word" }}>{a.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 클랜원 목록 */}
            <div>
              <div className="section-title">
                <div style={{ width: 3, height: 16, background: "#4fc3f7" }} />
                <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, letterSpacing: 2 }}>클랜원 목록</h2>
                <span style={{ background: "rgba(79,195,247,0.1)", color: "#4fc3f7", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{members.length}명</span>
              </div>
              {members.map(m => (
                <div key={m.id} className="row" style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, marginRight: 10 }}>{m.profiles?.nickname || "유저"}</span>
                    <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{m.profiles?.battletag}</span>
                  </div>
                  <span style={{ fontSize: 11, color: m.role === "클랜장" ? "#ff6b23" : "#8892a4", fontWeight: 700, letterSpacing: 1, marginRight: 12 }}>{m.role}</span>
                  {m.role !== "클랜장" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-kick" onClick={() => handleKick(m)}>내보내기</button>
                      <button className="btn-kick" onClick={() => handleKick(m, true)} style={{ borderColor: "rgba(239,83,80,0.45)" }}>차단</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 멤버 명단 등록 (미검증) */}
            <div style={{ marginTop: 40 }}>
              <div className="section-title">
                <div style={{ width: 3, height: 16, background: "#ff6b23" }} />
                <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, letterSpacing: 2 }}>멤버 명단 등록</h2>
                <span style={{ background: "rgba(255,107,35,0.2)", color: "#ff6b23", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{roster.length}</span>
              </div>
              <p style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 12, marginLeft: 13, lineHeight: 1.6 }}>
                기존 멤버의 배틀태그를 미리 등록해 두면, 그 멤버가 본인 배틀태그로 가입할 때 자동으로 클랜원이 돼요. 인증 전(미가입)에는 클랜 티어·랭킹에 반영되지 않아요.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <input value={newBattletag} onChange={e => setNewBattletag(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddRoster()} placeholder="배틀태그 (예: 닉네임#1234)"
                  style={{ flex: 1, minWidth: 180, background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 14px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 14, outline: "none" }} />
                <button onClick={handleAddRoster} className="btn-accept">+ 등록</button>
              </div>
              {roster.map((r: any) => (
                <div key={r.id} className="row" style={{ marginBottom: 6, opacity: 0.9 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 14, color: "#c8cad0", marginRight: 10 }}>{r.battletag}</span>
                    <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>🔒 인증 대기</span>
                  </div>
                  <button className="btn-kick" onClick={() => handleRemoveRoster(r.id)}>삭제</button>
                </div>
              ))}
            </div>

            {/* 차단 목록 */}
            {bans.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <div className="section-title">
                  <div style={{ width: 3, height: 16, background: "#ef5350" }} />
                  <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, letterSpacing: 2 }}>차단 목록</h2>
                  <span style={{ background: "rgba(239,83,80,0.12)", color: "#ef5350", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{bans.length}</span>
                </div>
                <p style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 12, marginLeft: 13 }}>차단된 유저는 이 클랜에 가입 신청할 수 없어요. 해제하면 다시 신청할 수 있어요.</p>
                {bans.map(b => (
                  <div key={b.user_id} className="row" style={{ marginBottom: 6, borderColor: "rgba(239,83,80,0.12)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, marginRight: 10 }}>{b.profiles?.nickname || "유저"}</span>
                      <span style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{b.profiles?.battletag}</span>
                    </div>
                    <button className="btn-unban" onClick={() => handleUnban(b)}>차단 해제</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 클랜 삭제 */}
        <div style={{ marginTop: 48, padding: 24, border: "1px solid rgba(239,83,80,0.2)", background: "rgba(239,83,80,0.04)" }}>
          <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: "#ef5350", marginBottom: 8, letterSpacing: 1 }}>⚠️ 위험 구역</div>
          <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 16, lineHeight: 1.6 }}>
            클랜을 삭제하면 모든 클랜원, 대전 기록, 채팅이 함께 삭제돼요.<br/>이 작업은 되돌릴 수 없어요.
          </p>
          <button onClick={handleDeleteClan} style={{ background: "rgba(239,83,80,0.15)", border: "1px solid rgba(239,83,80,0.4)", color: "#ef5350", padding: "10px 24px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)" }}>
            클랜 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
