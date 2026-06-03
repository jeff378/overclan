"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

const BADGES = ["🔥", "🐺", "⚡", "🗡️", "✨", "🌑", "🌅", "🔴", "🦅", "🐉", "⚔️", "🛡️"];
const TIERS = ["브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];
const TIMES = ["아침", "저녁", "밤", "새벽", "주말"];
const STYLES = ["경쟁", "캐주얼", "친목"];

export default function CreateClanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", tag: "", description: "", badge: "🔥",
    tier: "골드", play_time: "저녁", style: "캐주얼", max_members: 30
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);

      // 이미 클랜장인지 확인
      const { data: existingClans } = await supabase.from("clans").select("id, name").eq("owner_id", data.user.id).limit(1);
      if (existingClans && existingClans.length > 0) {
        alert(`이미 "${existingClans[0].name}" 클랜을 운영 중이에요. 클랜은 1개만 만들 수 있어요.`);
        router.push(`/clan/${existingClans[0].id}`);
        return;
      }

      // 이미 다른 클랜에 가입했는지 확인
      const { data: existingMembers } = await supabase.from("clan_members").select("clan_id").eq("user_id", data.user.id).limit(1);
      if (existingMembers && existingMembers.length > 0) {
        alert("이미 클랜에 가입되어 있어요. 탈퇴 후 새 클랜을 만들 수 있어요.");
        router.push("/mypage");
        return;
      }
    });
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.tag || !form.description) {
      setError("클랜명, 태그, 소개를 입력해주세요.");
      return;
    }
    if (form.tag.length > 6) {
      setError("태그는 6자 이내로 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    const { data: clan, error: clanError } = await supabase.from("clans").insert({
      ...form,
      tag: form.tag.toUpperCase(),
      owner_id: user.id,
    }).select().single();

    if (clanError) {
      if (clanError.message.includes("unique")) {
        setError("이미 사용 중인 클랜명 또는 태그예요.");
      } else {
        setError("클랜 생성에 실패했어요. 다시 시도해주세요.");
      }
      setLoading(false);
      return;
    }

    await supabase.from("clan_members").insert({
      clan_id: clan.id,
      user_id: user.id,
      role: "클랜장",
    });

    router.push(`/clan/${clan.id}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 100px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; display: block; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px 36px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .select-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 16px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .select-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .badge-btn { font-size: 24px; padding: 8px; background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .badge-btn.active { border-color: #ff6b23; background: rgba(255,107,35,0.15); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>클랜 만들기</h1>
        </div>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label className="label">클랜 배지</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BADGES.map(b => (
                <button key={b} className={`badge-btn ${form.badge === b ? "active" : ""}`} onClick={() => setForm({ ...form, badge: b })}>{b}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">클랜명 *</label>
            <input className="input" placeholder="클랜 이름을 입력하세요" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">클랜 태그 * (최대 6자)</label>
            <input className="input" placeholder="CLAN" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value.toUpperCase() })} maxLength={6} />
          </div>
          <div>
            <label className="label">클랜 소개 *</label>
            <textarea className="input" placeholder="클랜을 소개해주세요. 어떤 유저를 찾고 있나요?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">주요 티어</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIERS.map(t => (
                <button key={t} className={`select-btn ${form.tier === t ? "active" : ""}`} onClick={() => setForm({ ...form, tier: t })}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">주 활동 시간</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIMES.map(t => (
                <button key={t} className={`select-btn ${form.play_time === t ? "active" : ""}`} onClick={() => setForm({ ...form, play_time: t })}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">클랜 성향</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STYLES.map(s => (
                <button key={s} className={`select-btn ${form.style === s ? "active" : ""}`} onClick={() => setForm({ ...form, style: s })}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">최대 클랜원 수: {form.max_members}명</label>
            <input type="range" min={5} max={50} value={form.max_members} onChange={e => setForm({ ...form, max_members: Number(e.target.value) })} style={{ width: "100%", accentColor: "#ff6b23" }} />
          </div>
          {error && <div style={{ fontSize: 13, color: "#ef5350", fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}
          <button className="btn-primary" onClick={handleCreate} disabled={loading} style={{ alignSelf: "flex-start" }}>
            {loading ? "생성 중..." : "클랜 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
