"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "./Navbar";

export default function OverClanBattle() {
  const [activeTab, setActiveTab] = useState("예정 대전");
  const [battles, setBattles] = useState([]);
  const [recentBattles, setRecentBattles] = useState([]);
  const [myClans, setMyClans] = useState([]);
  const [allClans, setAllClans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clan1_id: "", clan2_id: "", type: "친선", scheduled_at: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: upcoming } = await supabase.from("clan_battles").select("*, clan1:clans!clan1_id(name,badge,tier), clan2:clans!clan2_id(name,badge,tier)").eq("status", "대기중").order("scheduled_at", { ascending: true });
      setBattles(upcoming || []);

      const { data: recent } = await supabase.from("clan_battles").select("*, clan1:clans!clan1_id(name,badge), clan2:clans!clan2_id(name,badge), winner:clans!winner_id(name)").eq("status", "완료").order("created_at", { ascending: false }).limit(10);
      setRecentBattles(recent || []);

      const { data: allC } = await supabase.from("clans").select("id, name, badge");
      setAllClans(allC || []);

      if (userData.user) {
        const { data: mems } = await supabase.from("clan_members").select("clan_id, clans(id, name, badge)").eq("user_id", userData.user.id);
        setMyClans(mems?.map(m => m.clans) || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!form.clan1_id || !form.clan2_id || !form.scheduled_at) return;
    if (form.clan1_id === form.clan2_id) { alert("같은 클랜끼리는 대전할 수 없어요."); return; }
    setSubmitting(true);
    const { data } = await supabase.from("clan_battles").insert({ ...form }).select("*, clan1:clans!clan1_id(name,badge,tier), clan2:clans!clan2_id(name,badge,tier)").single();
    if (data) setBattles(prev => [data, ...prev]);
    setShowForm(false);
    setForm({ clan1_id: "", clan2_id: "", type: "친선", scheduled_at: "" });
    setSubmitting(false);
  };

  const handleResult = async (battle, clan1Score, clan2Score) => {
    const winnerId = clan1Score > clan2Score ? battle.clan1_id : clan2Score > clan1Score ? battle.clan2_id : null;
    await supabase.from("clan_battles").update({ status: "완료", clan1_score: clan1Score, clan2_score: clan2Score, winner_id: winnerId }).eq("id", battle.id);
    if (winnerId) {
      const loserId = winnerId === battle.clan1_id ? battle.clan2_id : battle.clan1_id;
      await supabase.rpc("increment_wins", { clan_id: winnerId });
      await supabase.rpc("increment_losses", { clan_id: loserId });
    }
    setBattles(prev => prev.filter(b => b.id !== battle.id));
    alert("결과가 등록됐어요!");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 11px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .battle-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.12); padding: 24px 28px; transition: all 0.3s; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); margin-bottom: 10px; }
        .type-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 3px 10px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .select { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        @keyframes glow-pulse { 0%, 100% { text-shadow: 0 0 10px rgba(255,107,35,0.5); } 50% { text-shadow: 0 0 20px rgba(255,107,35,0.9); } }
        .vs-text { font-size: 20px; font-weight: 700; color: #ff6b23; font-family: 'Rajdhani', sans-serif; letter-spacing: 2px; animation: glow-pulse 2s infinite; }
      `}</style>

      <Navbar active="클랜대전" />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif" }}>클랜대전</h1>
          </div>
          {user && myClans.length > 0 && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? "취소" : "대전 신청"}
            </button>
          )}
        </div>

        {/* 대전 신청 폼 */}
        {showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: "28px", marginBottom: 28 }}>
            <h3 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, letterSpacing: 2, marginBottom: 20 }}>클랜대전 신청</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">우리 클랜</label>
                <select className="select" value={form.clan1_id} onChange={e => setForm({ ...form, clan1_id: e.target.value })}>
                  <option value="">클랜 선택</option>
                  {myClans.map(c => <option key={c.id} value={c.id}>{c.badge} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">상대 클랜</label>
                <select className="select" value={form.clan2_id} onChange={e => setForm({ ...form, clan2_id: e.target.value })}>
                  <option value="">클랜 선택</option>
                  {allClans.filter(c => c.id !== form.clan1_id).map(c => <option key={c.id} value={c.id}>{c.badge} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">대전 종류</label>
                <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="친선">친선</option>
                  <option value="정규">정규</option>
                </select>
              </div>
              <div>
                <label className="label">날짜 & 시간</label>
                <input className="input" type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "신청 중..." : "신청하기"}
            </button>
          </div>
        )}

        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 24, display: "flex" }}>
          {["예정 대전", "최근 대전 결과"].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : activeTab === "예정 대전" ? (
          battles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
              예정된 대전이 없어요. 첫 번째 클랜대전을 신청해보세요!
            </div>
          ) : battles.map(b => (
            <div key={b.id} className="battle-card">
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{b.clan1?.badge}</span>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{b.clan1?.name}</div>
                    <div style={{ fontSize: 11, color: "#8892a4" }}>{b.clan1?.tier}</div>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="vs-text">VS</div>
                  <span className="type-tag" style={{ background: b.type === "정규" ? "rgba(255,107,35,0.15)" : "rgba(255,255,255,0.05)", color: b.type === "정규" ? "#ff6b23" : "#8892a4" }}>{b.type}</span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end", flexDirection: "row-reverse" }}>
                  <span style={{ fontSize: 32 }}>{b.clan2?.badge}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{b.clan2?.name}</div>
                    <div style={{ fontSize: 11, color: "#8892a4" }}>{b.clan2?.tier}</div>
                  </div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(255,107,35,0.1)", paddingLeft: 20, textAlign: "right", minWidth: 120 }}>
                  <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                    {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" }) : "날짜 미정"}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>
                    {b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                  {user && myClans.some(c => c.id === b.clan1_id || c.id === b.clan2_id) && (
                    <button onClick={() => {
                      const s1 = parseInt(prompt("우리 클랜 점수?") || "0");
                      const s2 = parseInt(prompt("상대 클랜 점수?") || "0");
                      handleResult(b, s1, s2);
                    }} style={{ marginTop: 8, background: "rgba(255,107,35,0.15)", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "4px 12px", fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      결과 입력
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          recentBattles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 완료된 대전이 없어요.</div>
          ) : recentBattles.map(b => (
            <div key={b.id} className="battle-card">
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{b.clan1?.badge}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: b.winner_id === b.clan1_id ? "#ff6b23" : "#8892a4" }}>{b.clan1?.name}</span>
                  {b.winner_id === b.clan1_id && <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 700 }}>WIN</span>}
                </div>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{b.clan1_score} - {b.clan2_score}</div>
                  <span className="type-tag" style={{ background: b.type === "정규" ? "rgba(255,107,35,0.12)" : "rgba(255,255,255,0.04)", color: b.type === "정규" ? "#ff6b23" : "#8892a4", fontSize: 9 }}>{b.type}</span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                  {b.winner_id === b.clan2_id && <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 700 }}>WIN</span>}
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Rajdhani, sans-serif", color: b.winner_id === b.clan2_id ? "#ff6b23" : "#8892a4" }}>{b.clan2?.name}</span>
                  <span style={{ fontSize: 28 }}>{b.clan2?.badge}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
