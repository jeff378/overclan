"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";
import { createNotification } from "../../lib/notifications";

const STATUS_LABEL = {
  "신청중": { label: "수락 대기", color: "#ffd54f" },
  "날짜확정": { label: "날짜 확정", color: "#4fc3f7" },
  "멤버모집": { label: "멤버 모집중", color: "#ff6b23" },
  "대전준비": { label: "대전 준비", color: "#4caf50" },
  "결과입력": { label: "결과 입력중", color: "#ff6b23" },
  "완료": { label: "완료", color: "#8892a4" },
};

const ROLE_CONFIG = {
  "탱커": { icon: "🛡️", color: "#4fc3f7", max: 1 },
  "딜러": { icon: "⚔️", color: "#ff6b23", max: 2 },
  "힐러": { icon: "💊", color: "#4caf50", max: 2 },
};

export default function OverClanBattle() {
  const [activeTab, setActiveTab] = useState("진행중");
  const [battles, setBattles] = useState([]);
  const [completedBattles, setCompletedBattles] = useState([]);
  const [user, setUser] = useState(null);
  const [myClan, setMyClan] = useState(null);
  const [allClans, setAllClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myClanOnly, setMyClanOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [myVolunteer, setMyVolunteer] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  // 신청 폼
  const [form, setForm] = useState({
    clan2_id: "", type: "친선전",
    date1: "", date2: "", date3: ""
  });

  // 결과 입력
  const [resultForm, setResultForm] = useState({ score1: "", score2: "", screenshot: "" });
  const [submittingResult, setSubmittingResult] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      if (userData.user) {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", userData.user.id).single();
        setMyProfile(prof);
        const { data: mems } = await supabase.from("clan_members").select("clan_id, clans(id,name,badge,tier)").eq("user_id", userData.user.id).limit(1);
        if (mems && mems.length > 0) setMyClan(mems[0].clans);
      }

      const { data: allC } = await supabase.from("clans").select("id,name,badge,tier");
      setAllClans(allC || []);

      await loadBattles();
      setLoading(false);
    };
    load();
  }, []);

  const loadBattles = async () => {
    const { data: active } = await supabase.from("clan_battles")
      .select("*, clan1:clans!clan1_id(id,name,badge,tier), clan2:clans!clan2_id(id,name,badge,tier)")
      .neq("status", "완료").order("created_at", { ascending: false });
    setBattles(active || []);

    const { data: done } = await supabase.from("clan_battles")
      .select("*, clan1:clans!clan1_id(id,name,badge), clan2:clans!clan2_id(id,name,badge), winner:clans!winner_id(name)")
      .eq("status", "완료").order("created_at", { ascending: false }).limit(20);
    setCompletedBattles(done || []);
  };

  const loadVolunteers = async (battleId) => {
    const { data } = await supabase.from("battle_volunteers")
      .select("*").eq("battle_id", battleId);
    const withProfiles = await Promise.all((data || []).map(async v => {
      const { data: prof } = await supabase.from("profiles").select("nickname, battletag").eq("id", v.user_id).single();
      return { ...v, profiles: prof };
    }));
    setVolunteers(withProfiles);
    if (user) setMyVolunteer(withProfiles.find(v => v.user_id === user.id) || null);
  };

  const handleSelectBattle = async (battle) => {
    setSelected(battle);
    setMyVolunteer(null);
    await loadVolunteers(battle.id);
  };

  // 대전 신청
  const handleRequest = async () => {
    if (!form.clan2_id || !form.date1) { alert("상대 클랜과 날짜를 입력해주세요."); return; }
    const dates = [form.date1, form.date2, form.date3].filter(Boolean);
    const { data } = await supabase.from("clan_battles").insert({
      clan1_id: myClan.id, clan2_id: form.clan2_id,
      type: form.type, status: "신청중",
      proposed_dates: dates, created_by: user.id
    }).select("*, clan1:clans!clan1_id(id,name,badge,tier), clan2:clans!clan2_id(id,name,badge,tier)").single();
    if (data) setBattles(prev => [data, ...prev]);
    // 상대 클랜장에게 알림
    const { data: oppClan } = await supabase.from("clans").select("owner_id, name").eq("id", form.clan2_id).single();
    if (oppClan?.owner_id) {
      await createNotification(
        oppClan.owner_id,
        "battle_request",
        "새 클랜대전 신청",
        `${myClan.name} 클랜이 ${form.type} 대전을 신청했어요. 날짜를 확인해주세요.`,
        "/battle"
      );
    }
    setShowForm(false);
    setForm({ clan2_id: "", type: "친선전", date1: "", date2: "", date3: "" });
    alert("대전 신청을 보냈어요!");
  };

  // 날짜 수락
  const handleAcceptDate = async (battle, date) => {
    await supabase.from("clan_battles").update({
      status: "멤버모집", confirmed_date: date
    }).eq("id", battle.id);
    await loadBattles();
    setSelected(prev => ({ ...prev, status: "멤버모집", confirmed_date: date }));
    alert("날짜가 확정됐어요! 멤버 모집을 시작하세요.");
  };

  // 자원 신청
  const handleVolunteer = async (roles) => {
    if (!user || !selected) return;
    if (myVolunteer) {
      await supabase.from("battle_volunteers").update({ roles }).eq("id", myVolunteer.id);
    } else {
      await supabase.from("battle_volunteers").insert({
        battle_id: selected.id, clan_id: myClan.id, user_id: user.id, roles
      });
    }
    await loadVolunteers(selected.id);
  };

  // 멤버 확정
  const handleConfirmMember = async (volunteerId, role) => {
    await supabase.from("battle_volunteers").update({ is_confirmed: true, confirmed_role: role }).eq("id", volunteerId);
    await loadVolunteers(selected.id);
    // 5명 다 확정됐는지 체크
    const { data: confirmed } = await supabase.from("battle_volunteers").select("*").eq("battle_id", selected.id).eq("is_confirmed", true);
    if ((confirmed || []).length >= 10) {
      await supabase.from("clan_battles").update({ status: "대전준비" }).eq("id", selected.id);
    }
  };

  // 결과 입력
  const handleResult = async () => {
    if (resultForm.score1 === "" || resultForm.score2 === "") { alert("점수를 입력해주세요."); return; }
    setSubmittingResult(true);
    const isClan1 = selected.clan1_id === myClan?.id;
    const updateData = isClan1
      ? { clan1_result: `${resultForm.score1}-${resultForm.score2}`, clan1_screenshot: resultForm.screenshot, status: "결과입력" }
      : { clan2_result: `${resultForm.score1}-${resultForm.score2}`, clan2_screenshot: resultForm.screenshot, status: "결과입력" };
    await supabase.from("clan_battles").update(updateData).eq("id", selected.id);

    // 양쪽 다 입력했는지 확인
    const { data: updated } = await supabase.from("clan_battles").select("*").eq("id", selected.id).single();
    if (updated.clan1_result && updated.clan2_result) {
      if (updated.clan1_result === updated.clan2_result) {
        const [s1, s2] = updated.clan1_result.split("-").map(Number);
        const winnerId = s1 > s2 ? updated.clan1_id : s2 > s1 ? updated.clan2_id : null;
        await supabase.from("clan_battles").update({ status: "완료", winner_id: winnerId, clan1_score: s1, clan2_score: s2 }).eq("id", selected.id);
        if (updated.type === "정규전") {
          if (winnerId) {
            const loserId = winnerId === updated.clan1_id ? updated.clan2_id : updated.clan1_id;
            const { data: w } = await supabase.from("clans").select("wins,points").eq("id", winnerId).single();
            if (w) await supabase.from("clans").update({ wins: (w.wins||0)+1, points: (w.points||0)+3 }).eq("id", winnerId);
            const { data: l } = await supabase.from("clans").select("losses").eq("id", loserId).single();
            if (l) await supabase.from("clans").update({ losses: (l.losses||0)+1 }).eq("id", loserId);
          } else {
            for (const cid of [updated.clan1_id, updated.clan2_id]) {
              const { data: c } = await supabase.from("clans").select("points").eq("id", cid).single();
              if (c) await supabase.from("clans").update({ points: (c.points||0)+1 }).eq("id", cid);
            }
          }
        }
        alert("결과가 확정됐어요!");
      } else {
        await supabase.from("clan_battles").update({ is_disputed: true, status: "결과입력" }).eq("id", selected.id);
        alert("양쪽 결과가 일치하지 않아요. 분쟁으로 처리됩니다.");
      }
    } else {
      alert("결과를 입력했어요. 상대 클랜의 입력을 기다리세요.");
    }
    setResultForm({ score1: "", score2: "", screenshot: "" });
    setSubmittingResult(false);
    await loadBattles();
  };

  const isMyBattle = (battle) => myClan && (battle.clan1_id === myClan.id || battle.clan2_id === myClan.id);
  const isOpponent = (battle) => myClan && battle.clan2_id === myClan.id;
  const scrimTitle = (battle) => `[오버클랜] ${battle.clan1?.name} vs ${battle.clan2?.name}`;

  const getMyClanVolunteers = () => volunteers.filter(v => v.clan_id === myClan?.id);
  const getOpponentVolunteers = () => volunteers.filter(v => v.clan_id !== myClan?.id && selected && (v.clan_id === selected.clan1_id || v.clan_id === selected.clan2_id));
  const getConfirmedByRole = (clanId) => {
    const confirmed = volunteers.filter(v => v.clan_id === clanId && v.is_confirmed);
    return { "탱커": confirmed.filter(v => v.confirmed_role === "탱커"), "딜러": confirmed.filter(v => v.confirmed_role === "딜러"), "힐러": confirmed.filter(v => v.confirmed_role === "힐러") };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 22px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-sm { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 6px 14px; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); transition: all 0.2s; }
        .btn-sm:hover { background: rgba(255,107,35,0.1); }
        .btn-green { background: rgba(76,175,80,0.2); border: 1px solid rgba(76,175,80,0.4); color: #4caf50; padding: 6px 14px; font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .battle-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 18px 22px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; clip-path: polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px)); }
        .battle-card:hover, .battle-card.active { border-color: rgba(255,107,35,0.4); background: rgba(20,30,50,0.9); }
        .battle-card.mine { border-color: rgba(255,107,35,0.25); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .select { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .status-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .role-btn { padding: 8px 16px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 2px; transition: all 0.2s; border: 1px solid; }
        .scrim-box { background: rgba(255,107,35,0.06); border: 1px solid rgba(255,107,35,0.2); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .member-slot { background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .member-slot.confirmed { border-color: rgba(76,175,80,0.3); }
        .empty-slot { background: rgba(13,20,35,0.3); border: 1px dashed rgba(255,255,255,0.08); padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .detail-panel { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); padding: 24px; }
        @keyframes glow { 0%,100%{text-shadow:0 0 8px rgba(255,107,35,0.5)} 50%{text-shadow:0 0 16px rgba(255,107,35,0.9)} }
        .vs { animation: glow 2s infinite; color: #ff6b23; font-family:'Rajdhani',sans-serif; font-weight:700; font-size:18px; letter-spacing:2px; }
        .clan-name { font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }
        @media (max-width: 640px) {
          .battle-grid { grid-template-columns: 1fr !important; }
          .detail-panel { padding: 16px; }
          .tab-btn { padding: 8px 12px; font-size: 12px; letter-spacing: 1px; }
          .clan-name { max-width: 90px; font-size: 13px; }
        }
      `}</style>

      <Navbar active="클랜대전" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>클랜대전</h1>
          </div>
          {myClan && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "취소" : "대전 신청"}</button>}
        </div>

        {/* 대전 신청 폼 */}
        {showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, letterSpacing: 2, marginBottom: 18, color: "#ff6b23" }}>클랜대전 신청</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label className="label">상대 클랜 *</label>
                <select className="select" value={form.clan2_id} onChange={e => setForm({ ...form, clan2_id: e.target.value })}>
                  <option value="">클랜 선택</option>
                  {allClans.filter(c => c.id !== myClan?.id).map(c => <option key={c.id} value={c.id}>{c.badge} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">대전 종류</label>
                <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="친선전">친선전</option>
                  <option value="정규전">정규전 (승점 반영)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[1,2,3].map(n => (
                <div key={n}>
                  <label className="label">희망 날짜 {n}{n===1?" *":""}</label>
                  <input className="input" type="datetime-local" value={form[`date${n}`]} onChange={e => setForm({ ...form, [`date${n}`]: e.target.value })} />
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={handleRequest}>신청 보내기</button>
          </div>
        )}

        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {["진행중", "완료된 대전"].map(t => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => { setActiveTab(t); setSelected(null); }}>{t}</button>
            ))}
          </div>
          {myClan && (
            <button onClick={() => setMyClanOnly(!myClanOnly)} style={{
              background: myClanOnly ? "rgba(255,107,35,0.15)" : "transparent",
              border: `1px solid ${myClanOnly ? "#ff6b23" : "rgba(255,107,35,0.2)"}`,
              color: myClanOnly ? "#ff6b23" : "#8892a4",
              padding: "5px 14px", fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1,
              clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
              marginBottom: 4,
            }}>내 클랜만</button>
          )}
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : (
          <div className="battle-grid responsive-2col" style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.6fr" : "1fr", gap: 20 }}>

            {/* 대전 목록 */}
            <div>
              {activeTab === "진행중" && (() => {
                const filteredBattles = myClanOnly ? battles.filter(isMyBattle) : battles;
                return filteredBattles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>진행중인 클랜대전이 없어요.</div>
                ) : filteredBattles.map(b => (
                  <div key={b.id} className={`battle-card ${selected?.id === b.id ? "active" : ""} ${isMyBattle(b) ? "mine" : ""}`} onClick={() => handleSelectBattle(b)}>
                    <div className="matchup-row" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 22 }}>{b.clan1?.badge}</span>
                      <span className="clan-name">{b.clan1?.name}</span>
                      <span className="vs">VS</span>
                      <span className="clan-name">{b.clan2?.name}</span>
                      <span style={{ fontSize: 22 }}>{b.clan2?.badge}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="status-tag" style={{ background: `${STATUS_LABEL[b.status]?.color}22`, color: STATUS_LABEL[b.status]?.color, border: `1px solid ${STATUS_LABEL[b.status]?.color}44` }}>{STATUS_LABEL[b.status]?.label}</span>
                      <span className="status-tag" style={{ background: b.type === "정규전" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.05)", color: b.type === "정규전" ? "#ff6b23" : "#8892a4", border: "none" }}>{b.type}</span>
                      {isMyBattle(b) && <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>내 클랜</span>}
                      {b.is_disputed && <span style={{ fontSize: 10, color: "#ef5350", fontWeight: 700 }}>⚠️ 분쟁</span>}
                    </div>
                  </div>
                ));
              })()}

              {activeTab === "완료된 대전" && (
                completedBattles.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>완료된 대전이 없어요.</div>
                ) : completedBattles.map(b => (
                  <div key={b.id} className="battle-card">
                    <div className="matchup-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{b.clan1?.badge}</span>
                      <span className="matchup-name" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, color: b.winner_id === b.clan1_id ? "#ff6b23" : "#8892a4" }}>{b.clan1?.name}</span>
                      <div style={{ textAlign: "center", minWidth: 60 }}>
                        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700 }}>{b.clan1_score} - {b.clan2_score}</div>
                      </div>
                      <span className="matchup-name" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, color: b.winner_id === b.clan2_id ? "#ff6b23" : "#8892a4" }}>{b.clan2?.name}</span>
                      <span style={{ fontSize: 22 }}>{b.clan2?.badge}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 상세 패널 */}
            {selected && (
              <div className="detail-panel">
                {/* 버튼 줄 (맨 위, 우측 정렬) */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  {/* 클랜장 대전 취소 버튼 */}
                  {myClan && (selected.clan1_id === myClan.id || selected.clan2_id === myClan.id) &&
                   (selected.status === "멤버모집" || selected.status === "대전준비" || selected.status === "결과입력") && (
                    <button onClick={async () => {
                      if (!confirm("대전을 취소할까요? 모집된 멤버 정보도 모두 삭제돼요.")) return;
                      await supabase.from("battle_volunteers").delete().eq("battle_id", selected.id);
                      await supabase.from("clan_battles").delete().eq("id", selected.id);
                      setSelected(null);
                      await loadBattles();
                      alert("대전이 취소됐어요.");
                    }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "6px 14px", fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap" }}>대전 취소</button>
                  )}
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
                </div>

                {/* 매치업 (전체 너비) */}
                <div style={{ marginBottom: 20 }}>
                  <div className="matchup-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <a href={`/clan/${selected.clan1_id}`} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit", minWidth: 0 }}>
                      <span style={{ fontSize: 24 }}>{selected.clan1?.badge}</span>
                      <span className="matchup-name" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, borderBottom: "1px solid rgba(255,107,35,0.3)" }}>{selected.clan1?.name}</span>
                    </a>
                    <span className="vs">VS</span>
                    <a href={`/clan/${selected.clan2_id}`} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit", minWidth: 0 }}>
                      <span className="matchup-name" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, borderBottom: "1px solid rgba(255,107,35,0.3)" }}>{selected.clan2?.name}</span>
                      <span style={{ fontSize: 24 }}>{selected.clan2?.badge}</span>
                    </a>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="status-tag" style={{ background: `${STATUS_LABEL[selected.status]?.color}22`, color: STATUS_LABEL[selected.status]?.color, border: `1px solid ${STATUS_LABEL[selected.status]?.color}44` }}>{STATUS_LABEL[selected.status]?.label}</span>
                    <span className="status-tag" style={{ background: selected.type === "정규전" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.05)", color: selected.type === "정규전" ? "#ff6b23" : "#8892a4", border: "none" }}>{selected.type}</span>
                  </div>
                </div>

                {/* 스크림방 제목 */}
                {(selected.status === "대전준비" || selected.status === "멤버모집") && (
                  <div className="scrim-box" style={{ marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1, marginBottom: 4 }}>스크림방 제목 (복사해서 사용하세요)</div>
                      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, fontWeight: 700, color: "#ff6b23" }}>{scrimTitle(selected)}</div>
                    </div>
                    <button className="btn-sm" onClick={() => { navigator.clipboard.writeText(scrimTitle(selected)); alert("복사됐어요!"); }}>복사</button>
                  </div>
                )}

                {/* 신청중 - 날짜 선택 */}
                {selected.status === "신청중" && isOpponent(selected) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: "#ff6b23", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 600 }}>📅 날짜를 선택해주세요</div>
                      <button onClick={async () => {
                        if (!confirm("대전 신청을 거절할까요?")) return;
                        await supabase.from("clan_battles").delete().eq("id", selected.id);
                        setSelected(null);
                        await loadBattles();
                        alert("대전 신청을 거절했어요.");
                      }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "5px 14px", fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>거절</button>
                    </div>
                    {(selected.proposed_dates || []).length === 0 ? (
                      <div style={{ fontSize: 12, color: "#ef5350", fontFamily: "Noto Sans KR, sans-serif" }}>제안된 날짜가 없어요.</div>
                    ) : (selected.proposed_dates || []).map((date, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,107,35,0.05)", border: "1px solid rgba(255,107,35,0.15)", padding: "12px 14px", marginBottom: 6, gap: 10 }}>
                        <div>
                          <div style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, color: "#e8eaf0", fontWeight: 500 }}>
                            {new Date(date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                          </div>
                          <div style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 12, color: "#8892a4", marginTop: 2 }}>
                            {new Date(date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <button className="btn-green" onClick={() => handleAcceptDate(selected, date)}>✓ 확정</button>
                      </div>
                    ))}
                  </div>
                )}

                {selected.status === "신청중" && !isOpponent(selected) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", flex: 1, marginRight: 8 }}>
                        ⏳ 상대 클랜의 날짜 수락을 기다리고 있어요.
                      </div>
                      <button onClick={async () => {
                        if (!confirm("대전 신청을 취소할까요?")) return;
                        await supabase.from("clan_battles").delete().eq("id", selected.id);
                        setSelected(null);
                        await loadBattles();
                      }} style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "5px 14px", fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap" }}>신청 취소</button>
                    </div>
                    <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 4 }}>제안한 날짜</div>
                    {(selected.proposed_dates || []).map((date, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", padding: "6px 10px", marginBottom: 4, background: "rgba(255,255,255,0.03)" }}>
                        {new Date(date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} {new Date(date).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    ))}
                  </div>
                )}

                {/* 확정 날짜 표시 */}
                {selected.confirmed_date && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)" }}>
                    <span style={{ fontSize: 12, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>📅 확정 날짜</span>
                    <span style={{ fontSize: 13, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif" }}>
                      {new Date(selected.confirmed_date).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}

                {/* 멤버 모집 */}
                {(selected.status === "멤버모집" || selected.status === "대전준비") && isMyBattle(selected) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>멤버 구성 (탱커1 / 딜러2 / 힐러2)</div>

                    {/* 내 클랜 라인업 */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: "#ff6b23", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>
                        {myClan?.badge} {myClan?.name} 출전 명단
                      </div>
                      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
                        const confirmed = volunteers.filter(v => v.clan_id === myClan?.id && v.is_confirmed && v.confirmed_role === role);
                        const available = volunteers.filter(v => v.clan_id === myClan?.id && !v.is_confirmed && v.roles?.includes(role));
                        return (
                          <div key={role} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, color: cfg.color, letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>{cfg.icon} {role} ({confirmed.length}/{cfg.max})</div>
                            {confirmed.map(v => (
                              <div key={v.id} className="member-slot confirmed" style={{ justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14, fontWeight: 700, color: "#4caf50" }}>{v.profiles?.nickname}</span>
                                  <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{v.profiles?.battletag}</span>
                                </div>
                                {myClan && (selected.clan1_id === myClan.id || selected.clan2_id === myClan.id) && (
                                  <button onClick={async () => {
                                    await supabase.from("battle_volunteers").update({ is_confirmed: false, confirmed_role: null }).eq("id", v.id);
                                    await loadVolunteers(selected.id);
                                  }} style={{ background: "none", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", padding: "3px 10px", fontFamily: "Rajdhani, sans-serif", fontSize: 10, fontWeight: 700, cursor: "pointer", opacity: 0.7 }}>확정 취소</button>
                                )}
                              </div>
                            ))}
                            {confirmed.length < cfg.max && available.map(v => (
                              <div key={v.id} className="member-slot" style={{ justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 13 }}>{v.profiles?.nickname}</span>
                                </div>
                                {myClan && selected && (selected.clan1_id === myClan.id || selected.clan2_id === myClan.id) && (
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

                    {/* 자원 신청 버튼 */}
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
                {(selected.status === "대전준비" || selected.status === "결과입력") && isMyBattle(selected) && (
                  <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,107,35,0.1)", paddingTop: 16 }}>
                    <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>결과 입력</div>
                    {((myClan?.id === selected.clan1_id && !selected.clan1_result) || (myClan?.id === selected.clan2_id && !selected.clan2_result)) ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div>
                            <label className="label">우리 팀 승수</label>
                            <input className="input" type="number" min="0" max="9" placeholder="0" value={resultForm.score1} onChange={e => setResultForm({ ...resultForm, score1: e.target.value })} />
                          </div>
                          <div>
                            <label className="label">상대 팀 승수</label>
                            <input className="input" type="number" min="0" max="9" placeholder="0" value={resultForm.score2} onChange={e => setResultForm({ ...resultForm, score2: e.target.value })} />
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label className="label">스크린샷 URL (선택)</label>
                          <input className="input" placeholder="이미지 URL 붙여넣기" value={resultForm.screenshot} onChange={e => setResultForm({ ...resultForm, screenshot: e.target.value })} />
                        </div>
                        <button className="btn-primary" onClick={handleResult} disabled={submittingResult}>{submittingResult ? "입력 중..." : "결과 제출"}</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 12, color: "#4caf50", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 8 }}>✅ 결과 입력 완료 — 상대 클랜의 입력을 기다리세요.</div>
                        {/* 24시간 이내 수정 가능 */}
                        {(() => {
                          const myResult = myClan?.id === selected.clan1_id ? selected.clan1_result : selected.clan2_result;
                          const createdAt = new Date(selected.created_at);
                          const canEdit = (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
                          return canEdit && myResult ? (
                            <button onClick={() => { supabase.from("clan_battles").update(myClan?.id === selected.clan1_id ? { clan1_result: null } : { clan2_result: null }).eq("id", selected.id).then(() => loadBattles()); }} style={{ background: "none", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "6px 14px", fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>수정하기 (24시간 이내)</button>
                          ) : null;
                        })()}
                      </div>
                    )}
                    {selected.is_disputed && (
                      <div style={{ marginTop: 10, fontSize: 12, color: "#ef5350", fontFamily: "Noto Sans KR, sans-serif" }}>⚠️ 양쪽 결과가 일치하지 않아요. 관리자에게 문의해주세요.</div>
                    )}
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

function VolunteerForm({ onSubmit }) {
  const [selected, setSelected] = useState([]);
  const toggle = (role) => setSelected(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
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
