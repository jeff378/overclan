"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";
import { createNotification } from "../../lib/notifications";
import { matchupVerdict, tierColor } from "../../lib/clanTier";

const STATUS_LABEL = {
  "모집중": { label: "상대 모집중", color: "#ba68c8" },
  "신청중": { label: "수락 대기", color: "#ffd54f" },
  "날짜확정": { label: "날짜 확정", color: "#4fc3f7" },
  "멤버모집": { label: "멤버 모집중", color: "#ff6b23" },
  "대전준비": { label: "대전 준비", color: "#4caf50" },
  "결과입력": { label: "결과 입력중", color: "#ff6b23" },
  "완료": { label: "완료", color: "#8892a4" },
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

  // 신청 폼
  const [form, setForm] = useState({
    mode: "지목", clan2_id: "", type: "친선전",
    date1: "", date2: "", date3: "",
    recruit_date: "", recruit_start: "", recruit_end: "",
    description: ""
  });

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      if (userData.user) {
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
      .select("*, clan1:clans!clan1_id(id,name,badge,tier,emblem_image,accent_color,clan_members(count)), clan2:clans!clan2_id(id,name,badge,tier,emblem_image,accent_color,clan_members(count))")
      .neq("status", "완료").order("created_at", { ascending: false });
    setBattles(active || []);

    const { data: done } = await supabase.from("clan_battles")
      .select("*, clan1:clans!clan1_id(id,name,badge,emblem_image,accent_color), clan2:clans!clan2_id(id,name,badge,emblem_image,accent_color), winner:clans!winner_id(name)")
      .eq("status", "완료").order("created_at", { ascending: false }).limit(20);
    setCompletedBattles(done || []);
  };

  // 대전 신청 / 모집글
  const BATTLE_SELECT = "*, clan1:clans!clan1_id(id,name,badge,tier,emblem_image,accent_color,clan_members(count)), clan2:clans!clan2_id(id,name,badge,tier,emblem_image,accent_color,clan_members(count))";
  const handleRequest = async () => {
    if (form.mode === "지목") {
      if (!form.clan2_id || !form.date1) { alert("상대 클랜과 날짜를 입력해주세요."); return; }
      const dates = [form.date1, form.date2, form.date3].filter(Boolean);
      const { data } = await supabase.from("clan_battles").insert({
        clan1_id: myClan.id, clan2_id: form.clan2_id,
        type: form.type, status: "신청중", mode: "지목",
        proposed_dates: dates, description: form.description || null, created_by: user.id
      }).select(BATTLE_SELECT).single();
      if (data) setBattles(prev => [data, ...prev]);
      const { data: oppClan } = await supabase.from("clans").select("owner_id, name").eq("id", form.clan2_id).single();
      if (oppClan?.owner_id) {
        await createNotification(
          oppClan.owner_id, "battle_request", "새 클랜대전 신청",
          `${myClan.name} 클랜이 ${form.type} 대전을 신청했어요. 날짜를 확인해주세요.`,
          data ? `/battle/${data.id}` : "/battle"
        );
      }
      alert("대전 신청을 보냈어요!");
    } else {
      // 열린 모집 (상대 미지정)
      if (!form.recruit_date || !form.recruit_start || !form.recruit_end) { alert("희망 날짜와 시간대를 입력해주세요."); return; }
      const { data } = await supabase.from("clan_battles").insert({
        clan1_id: myClan.id, clan2_id: null,
        type: form.type, status: "모집중", mode: "모집",
        recruit_date: form.recruit_date, recruit_start: form.recruit_start, recruit_end: form.recruit_end,
        description: form.description || null, created_by: user.id
      }).select(BATTLE_SELECT).single();
      if (data) setBattles(prev => [data, ...prev]);
      alert("열린 대전 모집글을 올렸어요! 지원하는 클랜을 기다려보세요.");
    }
    setShowForm(false);
    setForm({ mode: form.mode, clan2_id: "", type: "친선전", date1: "", date2: "", date3: "", recruit_date: "", recruit_start: "", recruit_end: "", description: "" });
  };

  const isMyBattle = (battle) => myClan && (battle.clan1_id === myClan.id || battle.clan2_id === myClan.id);

  // "우리 vs 상대" 판정 — 내 클랜 기준. 내 클랜이 참가/도전 가능한 대전에서만 표시.
  // placement: 더 센 클랜 쪽(clan1/clan2)에 칩을 붙임. 호각·도전후보는 가운데(center).
  // 색은 내 기준(내가 우세=초록 / 상대 우세=빨강), 글자는 칩이 붙는 클랜 기준 "N단계 우위".
  const verdictFor = (b) => {
    if (!myClan) return null;
    let mySide = null, myT, oppT;
    if (b.clan1_id === myClan.id) { mySide = "clan1"; myT = b.clan1?.tier; oppT = b.clan2?.tier; }
    else if (b.clan2_id === myClan.id) { mySide = "clan2"; myT = b.clan2?.tier; oppT = b.clan1?.tier; }
    else if (!b.clan2_id) { myT = myClan.tier; oppT = b.clan1?.tier; } // 도전자 모집중 → 도전 시 전력
    else return null; // 남의 클랜끼리의 대전
    const v = matchupVerdict(myT, oppT);
    if (!v) return null;
    if (!mySide || v.diff === 0) return { placement: "center", label: v.label, color: v.color };
    const strongerSide = v.diff > 0 ? mySide : (mySide === "clan1" ? "clan2" : "clan1");
    return { placement: strongerSide, label: `▲ ${Math.abs(v.diff)}단계 우위`, color: v.color };
  };
  // ── 렌더 헬퍼 ──
  const fmtDate = (d) => new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const battleDate = (b) => {
    if (b.confirmed_date) {
      const d = new Date(b.confirmed_date);
      const time = b.confirmed_date.includes("T") ? " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
      return fmtDate(b.confirmed_date) + time;
    }
    if (b.mode === "모집" && b.recruit_date) return `${fmtDate(b.recruit_date)} ${b.recruit_start || ""}~${b.recruit_end || ""}`;
    return null;
  };
  const sideEmblem = (clan, size) => {
    const accent = clan?.accent_color || "#ff6b23";
    return clan?.emblem_image
      ? <div className="m-em" style={{ width: size, height: size, borderColor: accent, boxShadow: `0 0 12px ${accent}40` }}><img src={clan.emblem_image} alt="" /></div>
      : <div className="m-em" style={{ width: size, height: size, borderColor: accent, background: "rgba(255,107,35,0.06)" }}><span style={{ fontSize: Math.round(size * 0.5) }}>{clan?.badge || "⚔"}</span></div>;
  };
  const tierTag = (tier) => (
    <span className="status-tag" style={{ color: tierColor(tier), border: `1px solid ${tierColor(tier)}55`, background: "transparent" }}>{tier}</span>
  );
  const verdictChip = (v) => (
    <span style={{
      fontSize: 10, fontWeight: 700, color: v.color,
      background: `${v.color}1f`, border: `1px solid ${v.color}55`,
      padding: "2px 8px", whiteSpace: "nowrap", letterSpacing: 0.3,
      fontFamily: "'Noto Sans KR', sans-serif",
      clipPath: "polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)",
    }}>{v.label}</span>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 11px 22px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; box-shadow: 0 0 20px rgba(255,107,35,0.3); }
        .btn-primary:hover { opacity: 0.92; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .select { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .select:focus { border-color: #ff6b23; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .status-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); white-space: nowrap; }
        @keyframes glow { 0%,100%{text-shadow:0 0 8px rgba(255,107,35,0.5)} 50%{text-shadow:0 0 16px rgba(255,107,35,0.9)} }
        .hero-glow { position: absolute; top: -110px; left: 0; right: 0; height: 280px; background: radial-gradient(ellipse 55% 100% at 50% 0%, rgba(255,107,35,0.13), transparent 70%); pointer-events: none; animation: heroPulse 5s ease-in-out infinite; }
        @keyframes heroPulse { 0%,100% { opacity: 0.65; } 50% { opacity: 1; } }
        .form-panel { position: relative; background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.22); padding: 24px; margin-bottom: 22px; clip-path: polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px)); }
        .m-card { position: relative; display: block; text-decoration: none; color: inherit; background: rgba(13,20,35,0.82); border: 1px solid rgba(255,107,35,0.12); padding: 18px 20px; transition: all 0.25s; clip-path: polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px)); }
        .m-card:hover { border-color: rgba(255,107,35,0.4); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(255,107,35,0.12); }
        .m-card.mine { border-color: rgba(255,107,35,0.25); }
        .m-row { display: flex; align-items: center; gap: 10px; }
        .m-side { display: flex; flex-direction: column; align-items: center; gap: 7px; flex: 1; min-width: 0; }
        .m-em { display: flex; align-items: center; justify-content: center; border-radius: 11px; border: 1.5px solid; overflow: hidden; flex-shrink: 0; }
        .m-em img { width: 100%; height: 100%; object-fit: cover; }
        .m-nm { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-weight: 700; font-size: 15px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; text-align: center; }
        .m-vs { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: 2px; color: #ff6b23; text-shadow: 0 0 14px rgba(255,107,35,0.7); flex-shrink: 0; padding: 0 4px; animation: glow 2s infinite; }
        .m-pill { position: absolute; top: 14px; right: 16px; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 3px 10px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); }
        .m-foot { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
        .sb-card { background: rgba(13,20,35,0.82); border: 1px solid rgba(255,107,35,0.1); padding: 16px 20px; margin-bottom: 8px; clip-path: polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px)); }
        .sb-nm { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .empty-box { text-align: center; padding: 54px 20px; background: rgba(13,20,35,0.5); border: 1px dashed rgba(255,107,35,0.18); }
        @media (max-width: 640px) {
          .tab-btn { padding: 8px 12px; font-size: 12px; letter-spacing: 1px; }
          .m-card { padding-top: 40px; }
          .m-nm { max-width: 92px; font-size: 13px; }
          .m-vs { font-size: 17px; }
          .form-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Navbar active="클랜대전" />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(20px,4vw,48px)", position: "relative" }}>
        <div className="hero-glow" />

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 12, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 3, height: 24, background: "#ff6b23", boxShadow: "0 0 10px rgba(255,107,35,0.7)" }} />
              <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(24px,5vw,28px)", fontWeight: 700, letterSpacing: 3, color: "#fff", textShadow: "0 0 24px rgba(255,107,35,0.35)" }}>클랜대전</h1>
            </div>
            <p style={{ fontSize: 13, color: "#8892a4", margin: "8px 0 0 14px", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
              <span style={{ color: "#ff6b23", fontWeight: 700, fontSize: 16, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{loading ? "—" : battles.length}</span>개의 전장이 펼쳐지고 있습니다
            </p>
          </div>
          {myClan && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "취소" : "+ 대전 신청"}</button>}
        </div>

        {/* 대전 신청 폼 */}
        {showForm && (
          <div className="form-panel">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <div style={{ width: 3, height: 16, background: "#ff6b23", boxShadow: "0 0 8px rgba(255,107,35,0.7)" }} />
              <h3 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, letterSpacing: 2, color: "#ff6b23" }}>클랜대전 신청</h3>
            </div>

            {/* 모드 토글 */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["지목", "특정 클랜 지목"], ["모집", "열린 모집 (상대 구함)"]].map(([m, lbl]) => (
                <button key={m} onClick={() => setForm({ ...form, mode: m })} style={{
                  flex: 1, padding: "11px 12px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
                  background: form.mode === m ? "rgba(255,107,35,0.15)" : "rgba(13,20,35,0.8)",
                  border: `1px solid ${form.mode === m ? "#ff6b23" : "rgba(255,255,255,0.1)"}`,
                  color: form.mode === m ? "#ff6b23" : "#8892a4",
                  clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
                }}>{lbl}</button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="label">대전 종류</label>
              <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="친선전">친선전</option>
                <option value="정규전">정규전 (승점 반영)</option>
              </select>
            </div>

            {form.mode === "지목" ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className="label">상대 클랜 *</label>
                  <select className="select" value={form.clan2_id} onChange={e => setForm({ ...form, clan2_id: e.target.value })}>
                    <option value="">클랜 선택</option>
                    {allClans.filter(c => c.id !== myClan?.id).map(c => <option key={c.id} value={c.id}>{c.badge} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[1,2,3].map(n => (
                    <div key={n}>
                      <label className="label">희망 날짜 {n}{n===1?" *":""}</label>
                      <input className="input" type="datetime-local" value={form[`date${n}`]} onChange={e => setForm({ ...form, [`date${n}`]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className="label">희망 날짜 *</label>
                  <input className="input" type="date" value={form.recruit_date} onChange={e => setForm({ ...form, recruit_date: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div>
                    <label className="label">시작 시간 *</label>
                    <input className="input" type="time" value={form.recruit_start} onChange={e => setForm({ ...form, recruit_start: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">종료 시간 *</label>
                    <input className="input" type="time" value={form.recruit_end} onChange={e => setForm({ ...form, recruit_end: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* 글 (공통) */}
            <div style={{ marginBottom: 16 }}>
              <label className="label">대전 글 (선택)</label>
              <textarea className="input" rows={3} style={{ resize: "vertical", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.5 }}
                placeholder={form.mode === "지목" ? "상대 클랜에게 전할 메시지를 적어보세요." : "원하는 상대 수준, 인원, 분위기 등을 적어보세요."}
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={500} />
            </div>

            <button className="btn-primary" onClick={handleRequest}>{form.mode === "지목" ? "신청 보내기" : "모집글 올리기"}</button>
          </div>
        )}

        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex" }}>
            {[["진행중", battles.length], ["완료된 대전", completedBattles.length]].map(([t, n]) => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t}{!loading && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>{n}</span>}
              </button>
            ))}
          </div>
          {myClan && (
            <button onClick={() => setMyClanOnly(!myClanOnly)} style={{
              background: myClanOnly ? "rgba(255,107,35,0.15)" : "transparent",
              border: `1px solid ${myClanOnly ? "#ff6b23" : "rgba(255,107,35,0.2)"}`,
              color: myClanOnly ? "#ff6b23" : "#8892a4",
              padding: "5px 14px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1,
              clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
              marginBottom: 4,
            }}>내 클랜만</button>
          )}
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>

            {/* 진행중 */}
            {activeTab === "진행중" && (() => {
              const filteredBattles = myClanOnly ? battles.filter(isMyBattle) : battles;
              if (filteredBattles.length === 0) {
                return (
                  <div className="empty-box">
                    <div style={{ fontSize: 30, marginBottom: 12, color: "#ff8c42", opacity: 0.85 }}>⚔</div>
                    <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, color: "#e8eaf0", marginBottom: 6 }}>진행중인 클랜대전이 없어요.</div>
                    <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{myClan ? "먼저 도전장을 내밀어보세요." : "클랜에 가입하면 대전을 신청할 수 있어요."}</div>
                  </div>
                );
              }
              return filteredBattles.map(b => {
                const st = STATUS_LABEL[b.status] || {};
                const dt = battleDate(b);
                const openRecruit = !b.clan2_id;
                const v = verdictFor(b);
                return (
                  <a key={b.id} href={`/battle/${b.id}`} className={`m-card ${isMyBattle(b) ? "mine" : ""}`}>
                    <span className="m-pill" style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}55` }}>{st.label}</span>
                    <div className="m-row">
                      <div className="m-side">
                        {sideEmblem(b.clan1, 48)}
                        <span className="m-nm">{b.clan1?.name}</span>
                        {(b.clan1?.tier || v?.placement === "clan1") && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {b.clan1?.tier && tierTag(b.clan1.tier)}
                            {v?.placement === "clan1" && verdictChip(v)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span className="m-vs" style={openRecruit ? { color: "#ce93d8", textShadow: "0 0 14px rgba(206,147,216,0.6)" } : {}}>VS</span>
                        {v?.placement === "center" && verdictChip(v)}
                      </div>
                      <div className="m-side">
                        {openRecruit ? (
                          <>
                            <div className="m-em" style={{ width: 48, height: 48, border: "1.5px dashed rgba(206,147,216,0.5)", background: "rgba(206,147,216,0.04)" }}><span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, color: "#ce93d8" }}>?</span></div>
                            <span style={{ color: "#ce93d8", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, textAlign: "center" }}>도전자 구하는 중</span>
                          </>
                        ) : (
                          <>
                            {sideEmblem(b.clan2, 48)}
                            <span className="m-nm">{b.clan2?.name}</span>
                            {(b.clan2?.tier || v?.placement === "clan2") && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {b.clan2?.tier && tierTag(b.clan2.tier)}
                                {v?.placement === "clan2" && verdictChip(v)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="m-foot">
                      <span className="status-tag" style={{ background: b.type === "정규전" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.05)", color: b.type === "정규전" ? "#ff6b23" : "#8892a4", border: "none" }}>{b.type}</span>
                      {dt && <span style={{ fontSize: 12, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif" }}>🗓 {dt}</span>}
                      {isMyBattle(b) && <span style={{ marginLeft: "auto", fontSize: 10, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>내 클랜</span>}
                      {b.is_disputed && <span style={{ fontSize: 10, color: "#ef5350", fontWeight: 700 }}>⚠ 분쟁</span>}
                    </div>
                  </a>
                );
              });
            })()}

            {/* 완료된 대전 */}
            {activeTab === "완료된 대전" && (
              completedBattles.length === 0 ? (
                <div className="empty-box">
                  <div style={{ fontSize: 30, marginBottom: 12, color: "#5a6478" }}>🏁</div>
                  <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, color: "#e8eaf0" }}>완료된 대전이 없어요.</div>
                </div>
              ) : completedBattles.map(b => (
                <div key={b.id} className="sb-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0 }}>
                      {sideEmblem(b.clan1, 38)}
                      <span className="sb-nm" style={{ color: b.winner_id === b.clan1_id ? "#ff6b23" : "#8892a4", display: "flex", alignItems: "center", gap: 5 }}>
                        {b.winner_id === b.clan1_id && <span style={{ color: "#ffd24a" }}>♛</span>}{b.clan1?.name}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 700, fontSize: 22, color: "#fff", letterSpacing: 2, flexShrink: 0 }}>
                      {b.clan1_score} <span style={{ color: "#5a6478" }}>-</span> {b.clan2_score}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
                      <span className="sb-nm" style={{ color: b.winner_id === b.clan2_id ? "#ff6b23" : "#8892a4", display: "flex", alignItems: "center", gap: 5 }}>
                        {b.winner_id === b.clan2_id && <span style={{ color: "#ffd24a" }}>♛</span>}{b.clan2?.name}
                      </span>
                      {sideEmblem(b.clan2, 38)}
                    </div>
                  </div>
                </div>
              ))
            )}

          </div>
        )}
      </div>
    </div>
  );
}
