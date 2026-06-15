"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../components/Navbar";
import { createNotification } from "../../../lib/notifications";
import { matchupVerdict } from "../../../lib/clanTier";
import { ClanTierChip as ClanTierChipJSX } from "../../components/ClanBadge";

const ClanTierChip = ClanTierChipJSX as any;

const STATUS_LABEL: any = {
  "신청중": { label: "수락 대기", color: "#ffd54f" },
  "날짜확정": { label: "날짜 확정", color: "#4fc3f7" },
  "멤버모집": { label: "멤버 모집중", color: "#ff6b23" },
  "대전준비": { label: "대전 준비", color: "#4caf50" },
  "결과입력": { label: "결과 입력중", color: "#ff6b23" },
  "완료": { label: "완료", color: "#8892a4" },
};

const ROLE_CONFIG: any = {
  "탱커": { icon: "🛡️", color: "#4fc3f7", max: 1 },
  "딜러": { icon: "⚔️", color: "#ff6b23", max: 2 },
  "힐러": { icon: "💊", color: "#4caf50", max: 2 },
};

const CLAN_SELECT = "*, clan1:clans!clan1_id(id,name,badge,tier,emblem_image,accent_color,owner_id,clan_members(count)), clan2:clans!clan2_id(id,name,badge,tier,emblem_image,accent_color,owner_id,clan_members(count))";

export default function BattleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [myClan, setMyClan] = useState<any>(null);
  const [battle, setBattle] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [myVolunteer, setMyVolunteer] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [applyMsg, setApplyMsg] = useState("");
  const [resultForm, setResultForm] = useState({ score1: "", score2: "", screenshot: "" });
  const [submittingResult, setSubmittingResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      if (userData.user) {
        const { data: mems } = await supabase.from("clan_members").select("clan_id, clans(id,name,badge,tier)").eq("user_id", userData.user.id).limit(1);
        if (mems && mems.length > 0) setMyClan(mems[0].clans);
      }
      await reloadBattle();
      await loadVolunteers(id, userData.user);
      await loadApplicants(id);
      setLoading(false);
    };
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const reloadBattle = async () => {
    const { data } = await supabase.from("clan_battles").select(CLAN_SELECT).eq("id", id).single();
    if (!data) { setNotFound(true); return null; }
    setBattle(data);
    return data;
  };

  const loadApplicants = async (battleId: string) => {
    const { data } = await supabase.from("battle_applicants")
      .select("*, clans(id,name,badge,tier,emblem_image,accent_color,owner_id,clan_members(count))")
      .eq("battle_id", battleId).order("created_at", { ascending: true });
    setApplicants(data || []);
  };

  const loadVolunteers = async (battleId: string, u = user) => {
    const { data } = await supabase.from("battle_volunteers").select("*").eq("battle_id", battleId);
    const withProfiles = await Promise.all((data || []).map(async (v: any) => {
      const { data: prof } = await supabase.from("profiles").select("nickname, battletag").eq("id", v.user_id).single();
      return { ...v, profiles: prof };
    }));
    setVolunteers(withProfiles);
    if (u) setMyVolunteer(withProfiles.find((v: any) => v.user_id === u.id) || null);
  };

  const isMyBattle = (b: any) => myClan && b && (b.clan1_id === myClan.id || b.clan2_id === myClan.id);
  const isOpponent = (b: any) => myClan && b && b.clan2_id === myClan.id;
  const scrimTitle = (b: any) => `[오버클랜] ${b.clan1?.name} vs ${b.clan2?.name}`;
  // 참가 클랜의 클랜장(소유자)만 대전 관리(취소/날짜확정/멤버확정 등) 가능
  const isClanOwner = (b: any) => !!(user && b && ((b.clan1?.owner_id && b.clan1.owner_id === user.id) || (b.clan2?.owner_id && b.clan2.owner_id === user.id)));

  // 열린 모집 — 지원
  const handleApply = async () => {
    if (!user || !myClan || !battle) return;
    const { error } = await supabase.from("battle_applicants").insert({
      battle_id: battle.id, clan_id: myClan.id, user_id: user.id, message: applyMsg || null,
    });
    if (error) { alert("이미 지원했거나 오류가 발생했어요."); return; }
    if (battle.clan1?.owner_id) {
      await createNotification(
        battle.clan1.owner_id, "battle_request", "새 대전 지원",
        `${myClan.name} 클랜이 모집글에 지원했어요.`, `/battle/${battle.id}`
      );
    }
    setApplyMsg("");
    await loadApplicants(battle.id);
    alert("지원했어요! 모집 클랜의 수락을 기다려보세요.");
  };

  // 지원 취소
  const handleWithdraw = async () => {
    const mine = applicants.find((a) => a.clan_id === myClan?.id && a.user_id === user?.id);
    if (!mine) return;
    await supabase.from("battle_applicants").delete().eq("id", mine.id);
    await loadApplicants(battle.id);
  };

  // 모집글 작성자 — 지원 수락 → 대전 확정
  const handleAcceptApplicant = async (applicant: any) => {
    if (!confirm(`${applicant.clans?.name} 클랜의 지원을 수락할까요? 대전이 확정돼요.`)) return;
    const confirmedDate = battle.recruit_date && battle.recruit_start ? `${battle.recruit_date}T${battle.recruit_start}` : null;
    await supabase.from("clan_battles").update({ clan2_id: applicant.clan_id, status: "멤버모집", confirmed_date: confirmedDate }).eq("id", battle.id);
    if (applicant.clans?.owner_id) {
      await createNotification(
        applicant.clans.owner_id, "battle_request", "대전 지원 수락",
        `${battle.clan1?.name} 클랜이 지원을 수락했어요! 멤버 모집을 시작하세요.`, `/battle/${battle.id}`
      );
    }
    await reloadBattle();
    await loadVolunteers(battle.id);
    alert("대전이 확정됐어요! 멤버 모집을 시작하세요.");
  };

  // 모집글 삭제
  const handleCancelPost = async () => {
    if (!confirm("모집글을 삭제할까요?")) return;
    await supabase.from("battle_applicants").delete().eq("battle_id", battle.id);
    await supabase.from("clan_battles").delete().eq("id", battle.id);
    router.push("/battle");
  };

  // 날짜 수락
  const handleAcceptDate = async (date: string) => {
    await supabase.from("clan_battles").update({ status: "멤버모집", confirmed_date: date }).eq("id", battle.id);
    await reloadBattle();
    alert("날짜가 확정됐어요! 멤버 모집을 시작하세요.");
  };

  // 자원 신청
  const handleVolunteer = async (roles: string[]) => {
    if (!user || !battle) return;
    if (myVolunteer) {
      await supabase.from("battle_volunteers").update({ roles }).eq("id", myVolunteer.id);
    } else {
      await supabase.from("battle_volunteers").insert({ battle_id: battle.id, clan_id: myClan.id, user_id: user.id, roles });
    }
    await loadVolunteers(battle.id);
  };

  // 멤버 확정
  const handleConfirmMember = async (volunteerId: string, role: string) => {
    await supabase.from("battle_volunteers").update({ is_confirmed: true, confirmed_role: role }).eq("id", volunteerId);
    await loadVolunteers(battle.id);
    const { data: confirmed } = await supabase.from("battle_volunteers").select("*").eq("battle_id", battle.id).eq("is_confirmed", true);
    if ((confirmed || []).length >= 10) {
      await supabase.from("clan_battles").update({ status: "대전준비" }).eq("id", battle.id);
      await reloadBattle();
    }
  };

  // 결과 입력
  const handleResult = async () => {
    if (resultForm.score1 === "" || resultForm.score2 === "") { alert("점수를 입력해주세요."); return; }
    setSubmittingResult(true);
    const isClan1 = battle.clan1_id === myClan?.id;
    const updateData: any = isClan1
      ? { clan1_result: `${resultForm.score1}-${resultForm.score2}`, clan1_screenshot: resultForm.screenshot, status: "결과입력" }
      : { clan2_result: `${resultForm.score1}-${resultForm.score2}`, clan2_screenshot: resultForm.screenshot, status: "결과입력" };
    const { error: resErr } = await supabase.from("clan_battles").update(updateData).eq("id", battle.id);
    if (resErr) {
      alert("결과 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSubmittingResult(false);
      return;
    }

    const { data: updated } = await supabase.from("clan_battles").select("*").eq("id", battle.id).single();
    if (!updated) {
      alert("결과를 저장했지만 확인에 실패했어요. 새로고침 후 확인해주세요.");
      setSubmittingResult(false);
      return;
    }
    if (updated.clan1_result && updated.clan2_result) {
      if (updated.clan1_result === updated.clan2_result) {
        const [s1, s2] = updated.clan1_result.split("-").map(Number);
        const winnerId = s1 > s2 ? updated.clan1_id : s2 > s1 ? updated.clan2_id : null;

        // 랭킹 점수 캡: 같은 두 클랜의 '시즌 첫 정규전'만 승점 반영
        let pointsCounted = false;
        if (updated.type === "정규전") {
          const a = updated.clan1_id, b = updated.clan2_id;
          const { count: prior } = await supabase.from("clan_battles")
            .select("id", { count: "exact", head: true })
            .eq("status", "완료").eq("type", "정규전").eq("points_counted", true)
            .neq("id", battle.id)
            .or(`and(clan1_id.eq.${a},clan2_id.eq.${b}),and(clan1_id.eq.${b},clan2_id.eq.${a})`);
          pointsCounted = (prior || 0) === 0;
        }

        await supabase.from("clan_battles").update({ status: "완료", winner_id: winnerId, clan1_score: s1, clan2_score: s2, points_counted: pointsCounted }).eq("id", battle.id);

        if (updated.type === "정규전" && pointsCounted) {
          if (winnerId) {
            const loserId = winnerId === updated.clan1_id ? updated.clan2_id : updated.clan1_id;
            const { data: w } = await supabase.from("clans").select("wins,points").eq("id", winnerId).single();
            if (w) await supabase.from("clans").update({ wins: (w.wins || 0) + 1, points: (w.points || 0) + 3 }).eq("id", winnerId);
            const { data: l } = await supabase.from("clans").select("losses").eq("id", loserId).single();
            if (l) await supabase.from("clans").update({ losses: (l.losses || 0) + 1 }).eq("id", loserId);
          } else {
            for (const cid of [updated.clan1_id, updated.clan2_id]) {
              const { data: c } = await supabase.from("clans").select("points").eq("id", cid).single();
              if (c) await supabase.from("clans").update({ points: (c.points || 0) + 1 }).eq("id", cid);
            }
          }
          alert("결과가 확정됐어요!");
        } else if (updated.type === "정규전" && !pointsCounted) {
          alert("결과가 확정됐어요! (이미 맞붙은 클랜이라 이번 정규전은 승점에 반영되지 않아요.)");
        } else {
          alert("결과가 확정됐어요!");
        }
      } else {
        await supabase.from("clan_battles").update({ is_disputed: true, status: "결과입력" }).eq("id", battle.id);
        alert("양쪽 결과가 일치하지 않아요. 분쟁으로 처리됩니다.");
      }
    } else {
      alert("결과를 입력했어요. 상대 클랜의 입력을 기다리세요.");
    }
    setResultForm({ score1: "", score2: "", screenshot: "" });
    setSubmittingResult(false);
    await reloadBattle();
  };

  // 클랜 헤더 (엠블럼 우선 + 티어 칩)
  const ClanHead = ({ clan, clanId, size = 24 }: any) => (
    <a href={`/clan/${clanId}`} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit", minWidth: 0 }}>
      {clan?.emblem_image
        ? <img src={clan.emblem_image} alt="" style={{ width: size + 6, height: size + 6, objectFit: "cover", borderRadius: 6, border: `1px solid ${clan.accent_color || "#ff6b23"}55`, flexShrink: 0 }} />
        : <span style={{ fontSize: size }}>{clan?.badge}</span>}
      <span className="matchup-name" style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, borderBottom: "1px solid rgba(255,107,35,0.3)" }}>{clan?.name}</span>
      {clan?.emblem_image && <ClanTierChip memberCount={clan?.clan_members?.[0]?.count || 0} size={18} />}
    </a>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 22px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-sm { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 6px 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); transition: all 0.2s; }
        .btn-sm:hover { background: rgba(255,107,35,0.1); }
        .btn-green { background: rgba(76,175,80,0.2); border: 1px solid rgba(76,175,80,0.4); color: #4caf50; padding: 6px 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .status-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .role-btn { padding: 8px 16px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 2px; transition: all 0.2s; border: 1px solid; }
        .scrim-box { background: rgba(255,107,35,0.06); border: 1px solid rgba(255,107,35,0.2); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; clip-path: polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px)); }
        .member-slot { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .member-slot.confirmed { border-color: rgba(76,175,80,0.3); }
        .empty-slot { background: rgba(13,20,35,0.3); border: 1px dashed rgba(255,255,255,0.08); padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .detail-panel { position: relative; background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 24px; clip-path: polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px)); }
        .hero-glow { position: absolute; top: -90px; left: 0; right: 0; height: 240px; background: radial-gradient(ellipse 55% 100% at 50% 0%, rgba(255,107,35,0.12), transparent 70%); pointer-events: none; animation: heroPulse 5s ease-in-out infinite; }
        @keyframes heroPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes glow { 0%,100%{text-shadow:0 0 8px rgba(255,107,35,0.5)} 50%{text-shadow:0 0 16px rgba(255,107,35,0.9)} }
        .vs { animation: glow 2s infinite; color: #ff6b23; font-family:'Cinzel','Rajdhani',sans-serif; font-weight:700; font-size:18px; letter-spacing:2px; }
        .back-link { display:inline-flex; align-items:center; gap:6px; color:#8892a4; font-family:'Cinzel','Rajdhani',sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; text-decoration:none; transition:color .2s; }
        .back-link:hover { color:#ff6b23; }
        @media (max-width: 640px) { .detail-panel { padding: 16px; } .matchup-name { font-size: 14px !important; } }
      `}</style>

      <Navbar active="클랜대전" />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 60px", position: "relative" }}>
        <div className="hero-glow" />
        <div style={{ marginBottom: 20, position: "relative" }}>
          <a href="/battle" className="back-link">← 클랜대전 목록</a>
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "60px 0" }}>LOADING...</div>
        ) : notFound || !battle ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            대전을 찾을 수 없어요. 이미 취소되었거나 종료된 대전일 수 있어요.
            <div style={{ marginTop: 16 }}><a href="/battle" className="btn-primary" style={{ textDecoration: "none" }}>목록으로</a></div>
          </div>
        ) : (
          <div className="detail-panel">
            {/* 상단 버튼 줄 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center", marginBottom: 12 }}>
              {isClanOwner(battle) &&
               (battle.status === "멤버모집" || battle.status === "대전준비" || battle.status === "결과입력") && (
                <button onClick={async () => {
                  if (!confirm("대전을 취소할까요? 모집된 멤버 정보도 모두 삭제돼요.")) return;
                  await supabase.from("battle_volunteers").delete().eq("battle_id", battle.id);
                  await supabase.from("clan_battles").delete().eq("id", battle.id);
                  alert("대전이 취소됐어요.");
                  router.push("/battle");
                }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "6px 14px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap" }}>대전 취소</button>
              )}
            </div>

            {/* 매치업 */}
            <div style={{ marginBottom: 20 }}>
              <div className="matchup-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <ClanHead clan={battle.clan1} clanId={battle.clan1_id} />
                {battle.clan2_id ? (
                  <>
                    <span className="vs">VS</span>
                    <ClanHead clan={battle.clan2} clanId={battle.clan2_id} />
                  </>
                ) : (
                  <span style={{ fontSize: 14, color: "#ba68c8", fontWeight: 700, letterSpacing: 1 }}>· 상대 모집중</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span className="status-tag" style={{ background: `${STATUS_LABEL[battle.status]?.color}22`, color: STATUS_LABEL[battle.status]?.color, border: `1px solid ${STATUS_LABEL[battle.status]?.color}44` }}>{STATUS_LABEL[battle.status]?.label}</span>
                <span className="status-tag" style={{ background: battle.type === "정규전" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.05)", color: battle.type === "정규전" ? "#ff6b23" : "#8892a4", border: "none" }}>{battle.type}</span>
                {battle.is_disputed && <span style={{ fontSize: 10, color: "#ef5350", fontWeight: 700 }}>⚠️ 분쟁</span>}
              </div>
            </div>

            {/* 대전 글 */}
            {battle.description && (
              <div style={{ marginBottom: 16, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1, marginBottom: 6 }}>대전 글</div>
                <div style={{ fontSize: 13, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{battle.description}</div>
              </div>
            )}

            {/* 열린 모집 — 상대 모집중 */}
            {battle.status === "모집중" && (() => {
              const isPoster = isClanOwner(battle) && myClan && myClan.id === battle.clan1_id;
              const alreadyApplied = applicants.some((a) => a.clan_id === myClan?.id);
              const canApply = user && myClan && myClan.id !== battle.clan1_id && !alreadyApplied;
              return (
                <div style={{ marginBottom: 16 }}>
                  {/* 희망 일정 */}
                  {battle.recruit_date && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", background: "rgba(186,104,200,0.08)", border: "1px solid rgba(186,104,200,0.25)" }}>
                      <span style={{ fontSize: 12, color: "#ba68c8", fontWeight: 700, letterSpacing: 1 }}>🗓 희망 일정</span>
                      <span style={{ fontSize: 13, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif" }}>
                        {new Date(battle.recruit_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })} {battle.recruit_start}~{battle.recruit_end}
                      </span>
                    </div>
                  )}

                  {/* 모집글 작성 클랜 — 지원자 관리 */}
                  {isPoster ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: "#ff6b23", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 600 }}>지원한 클랜 ({applicants.length})</div>
                        <button onClick={handleCancelPost} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "5px 14px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>모집 취소</button>
                      </div>
                      {applicants.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", padding: "16px 0", textAlign: "center" }}>아직 지원한 클랜이 없어요.</div>
                      ) : applicants.map((a) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", marginBottom: 6, background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)" }}>
                          <a href={`/clan/${a.clan_id}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", minWidth: 0, flex: 1 }}>
                            {a.clans?.emblem_image
                              ? <img src={a.clans.emblem_image} alt="" style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 6, flexShrink: 0, border: `1px solid ${a.clans.accent_color || "#ff6b23"}55` }} />
                              : <span style={{ fontSize: 22 }}>{a.clans?.badge}</span>}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.clans?.name}</span>
                                <ClanTierChip memberCount={a.clans?.clan_members?.[0]?.count || 0} size={16} showName={false} />
                                {a.clans?.tier && <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", flexShrink: 0 }}>{a.clans.tier}</span>}
                                {(() => {
                                  const v = matchupVerdict(myClan?.tier, a.clans?.tier);
                                  return v ? (
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, color: v.color,
                                      background: `${v.color}1f`, border: `1px solid ${v.color}55`,
                                      padding: "2px 8px", whiteSpace: "nowrap", letterSpacing: 0.3, flexShrink: 0,
                                      fontFamily: "'Noto Sans KR', sans-serif",
                                      clipPath: "polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)",
                                    }}>{v.label}</span>
                                  ) : null;
                                })()}
                              </div>
                              {a.message && <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.message}</div>}
                            </div>
                          </a>
                          <button className="btn-green" style={{ flexShrink: 0 }} onClick={() => handleAcceptApplicant(a)}>✓ 수락</button>
                        </div>
                      ))}
                    </div>
                  ) : alreadyApplied ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 13, color: "#4caf50", fontFamily: "Noto Sans KR, sans-serif" }}>✅ 지원 완료 — 모집 클랜의 수락을 기다려보세요.</div>
                      <button onClick={handleWithdraw} style={{ background: "none", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "5px 12px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap" }}>지원 취소</button>
                    </div>
                  ) : canApply ? (
                    <div>
                      <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 8 }}>이 일정에 가능하다면 지원해보세요.</div>
                      <textarea className="input" rows={2} style={{ resize: "vertical", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 8 }} placeholder="모집 클랜에게 전할 메시지 (선택)" value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} maxLength={300} />
                      <button className="btn-primary" onClick={handleApply}>이 대전에 지원하기</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                      {!user ? "지원하려면 로그인이 필요해요." : !myClan ? "지원하려면 먼저 클랜에 가입해야 해요." : "지원할 수 없는 모집글이에요."}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 확정 날짜 (스크림방 제목 위) */}
            {battle.confirmed_date && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "12px 16px", background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.3)", clipPath: "polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))" }}>
                <span style={{ fontSize: 12, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>📅 확정 날짜</span>
                <span style={{ fontSize: 14, color: "#fff", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 500 }}>
                  {new Date(battle.confirmed_date).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}

            {/* 스크림방 제목 */}
            {(battle.status === "대전준비" || battle.status === "멤버모집") && (
              <div className="scrim-box" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1, marginBottom: 4 }}>스크림방 제목 (복사해서 사용하세요)</div>
                  <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: "#ff6b23" }}>{scrimTitle(battle)}</div>
                </div>
                <button className="btn-sm" onClick={() => { navigator.clipboard.writeText(scrimTitle(battle)); alert("복사됐어요!"); }}>복사</button>
              </div>
            )}

            {/* 신청중 - 상대 클랜 날짜 선택 */}
            {battle.status === "신청중" && isOpponent(battle) && isClanOwner(battle) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#ff6b23", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 600 }}>📅 날짜를 선택해주세요</div>
                  <button onClick={async () => {
                    if (!confirm("대전 신청을 거절할까요?")) return;
                    await supabase.from("clan_battles").delete().eq("id", battle.id);
                    alert("대전 신청을 거절했어요.");
                    router.push("/battle");
                  }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "5px 14px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>거절</button>
                </div>
                {(battle.proposed_dates || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: "#ef5350", fontFamily: "Noto Sans KR, sans-serif" }}>제안된 날짜가 없어요.</div>
                ) : (battle.proposed_dates || []).map((date: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)", padding: "12px 14px", marginBottom: 6, gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, color: "#e8eaf0", fontWeight: 500 }}>
                        {new Date(date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                      </div>
                      <div style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 12, color: "#8892a4", marginTop: 2 }}>
                        {new Date(date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <button className="btn-green" onClick={() => handleAcceptDate(date)}>✓ 확정</button>
                  </div>
                ))}
              </div>
            )}

            {/* 신청중 - 신청한 클랜 대기 */}
            {battle.status === "신청중" && !isOpponent(battle) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", flex: 1, marginRight: 8 }}>
                    ⏳ 상대 클랜의 날짜 수락을 기다리고 있어요.
                  </div>
                  {isClanOwner(battle) && (
                  <button onClick={async () => {
                    if (!confirm("대전 신청을 취소할까요?")) return;
                    await supabase.from("clan_battles").delete().eq("id", battle.id);
                    router.push("/battle");
                  }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "5px 14px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap" }}>신청 취소</button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 4 }}>제안한 날짜</div>
                {(battle.proposed_dates || []).map((date: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", padding: "6px 10px", marginBottom: 4, background: "rgba(255,255,255,0.03)" }}>
                    {new Date(date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} {new Date(date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                ))}
              </div>
            )}

            {/* 멤버 모집 */}
            {(battle.status === "멤버모집" || battle.status === "대전준비") && isMyBattle(battle) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>멤버 구성 (탱커1 / 딜러2 / 힐러2)</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#ff6b23", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
                    {myClan?.badge} {myClan?.name} 출전 명단
                  </div>
                  {Object.entries(ROLE_CONFIG).map(([role, cfg]: any) => {
                    const confirmed = volunteers.filter((v) => v.clan_id === myClan?.id && v.is_confirmed && v.confirmed_role === role);
                    const available = volunteers.filter((v) => v.clan_id === myClan?.id && !v.is_confirmed && v.roles?.includes(role));
                    return (
                      <div key={role} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: cfg.color, letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>{cfg.icon} {role} ({confirmed.length}/{cfg.max})</div>
                        {confirmed.map((v) => (
                          <div key={v.id} className="member-slot confirmed" style={{ justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                              <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: "#4caf50" }}>{v.profiles?.nickname}</span>
                            </div>
                            {isClanOwner(battle) && (
                              <button onClick={async () => {
                                await supabase.from("battle_volunteers").update({ is_confirmed: false, confirmed_role: null }).eq("id", v.id);
                                await loadVolunteers(battle.id);
                              }} style={{ background: "none", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "3px 10px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 10, fontWeight: 700, cursor: "pointer", opacity: 0.7 }}>확정 취소</button>
                            )}
                          </div>
                        ))}
                        {confirmed.length < cfg.max && available.map((v) => (
                          <div key={v.id} className="member-slot" style={{ justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                              <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13 }}>{v.profiles?.nickname}</span>                            </div>
                            {isClanOwner(battle) && (
                              <button className="btn-green" style={{ fontSize: 10 }} onClick={() => handleConfirmMember(v.id, role)}>확정</button>
                            )}
                          </div>
                        ))}
                        {confirmed.length < cfg.max && available.length === 0 && (
                          <div className="empty-slot"><span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "Noto Sans KR, sans-serif" }}>자원자 없음</span></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!myVolunteer && user && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>역할군 선택 후 자원 신청 (중복 가능)</div>
                    <VolunteerForm onSubmit={handleVolunteer} />
                  </div>
                )}
                {myVolunteer && !myVolunteer.is_confirmed && (
                  <div style={{ fontSize: 12, color: "#4caf50", fontFamily: "Noto Sans KR, sans-serif", marginTop: 8 }}>✅ 자원 신청 완료 — 클랜장의 확정을 기다리세요.</div>
                )}
              </div>
            )}

            {/* 결과 입력 */}
            {(battle.status === "대전준비" || battle.status === "결과입력") && isMyBattle(battle) && (
              <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,107,35,0.1)", paddingTop: 16 }}>
                <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>결과 입력</div>
                {((myClan?.id === battle.clan1_id && !battle.clan1_result) || (myClan?.id === battle.clan2_id && !battle.clan2_result)) ? (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <label className="label">우리 팀 승수</label>
                        <input className="input" type="number" min="0" max="9" placeholder="0" value={resultForm.score1} onChange={(e) => setResultForm({ ...resultForm, score1: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">상대 팀 승수</label>
                        <input className="input" type="number" min="0" max="9" placeholder="0" value={resultForm.score2} onChange={(e) => setResultForm({ ...resultForm, score2: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label className="label">스크린샷 URL (선택)</label>
                      <input className="input" placeholder="이미지 URL 붙여넣기" value={resultForm.screenshot} onChange={(e) => setResultForm({ ...resultForm, screenshot: e.target.value })} />
                    </div>
                    <button className="btn-primary" onClick={handleResult} disabled={submittingResult}>{submittingResult ? "입력 중..." : "결과 제출"}</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: "#4caf50", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 8 }}>✅ 결과 입력 완료 — 상대 클랜의 입력을 기다리세요.</div>
                    {(() => {
                      const myResult = myClan?.id === battle.clan1_id ? battle.clan1_result : battle.clan2_result;
                      const createdAt = new Date(battle.created_at);
                      const canEdit = (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
                      return canEdit && myResult ? (
                        <button onClick={async () => {
                          await supabase.from("clan_battles").update(myClan?.id === battle.clan1_id ? { clan1_result: null } : { clan2_result: null }).eq("id", battle.id);
                          await reloadBattle();
                        }} style={{ background: "none", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "6px 14px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>수정하기 (24시간 이내)</button>
                      ) : null;
                    })()}
                  </div>
                )}
                {battle.is_disputed && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#ef5350", fontFamily: "Noto Sans KR, sans-serif" }}>⚠️ 양쪽 결과가 일치하지 않아요. 관리자에게 문의해주세요.</div>
                )}
              </div>
            )}

            {/* 완료된 대전 결과 */}
            {battle.status === "완료" && (
              <div style={{ marginTop: 8, padding: "20px", background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 10 }}>최종 결과</div>
                <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 32, fontWeight: 700 }}>{battle.clan1_score} - {battle.clan2_score}</div>
                {battle.winner_id && (
                  <div style={{ marginTop: 8, fontSize: 14, color: "#ff6b23", fontWeight: 700 }}>
                    🏆 {battle.winner_id === battle.clan1_id ? battle.clan1?.name : battle.clan2?.name} 승리
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VolunteerForm({ onSubmit }: { onSubmit: (roles: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (role: string) => setSelected((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {Object.entries(ROLE_CONFIG).map(([role, cfg]: any) => (
        <button key={role} className="role-btn" onClick={() => toggle(role)} style={{
          background: selected.includes(role) ? `${cfg.color}22` : "rgba(13,20,35,0.8)",
          borderColor: selected.includes(role) ? cfg.color : "rgba(255,255,255,0.1)",
          color: selected.includes(role) ? cfg.color : "#8892a4",
        }}>{cfg.icon} {role}</button>
      ))}
      <button className="btn-primary" onClick={() => selected.length > 0 && onSubmit(selected)} disabled={selected.length === 0}>자원 신청</button>
    </div>
  );
}
