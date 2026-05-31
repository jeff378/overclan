"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";

const BADGES = ["🔥", "🐺", "⚡", "🗡️", "✨", "🌑", "🌅", "🔴", "🦅", "🐉", "⚔️", "🛡️"];
const TIERS = ["브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];
const TIMES = ["아침", "저녁", "밤", "새벽", "주말"];
const STYLES = ["경쟁", "캐주얼", "친목"];

export default function EditClanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", tag: "", description: "", badge: "🔥",
    tier: "골드", play_time: "저녁", style: "캐주얼", max_members: 30
  });

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      const { data: clan } = await supabase.from("clans").select("*").eq("id", id).single();
      if (!clan || clan.owner_id !== userData.user.id) { router.push("/"); return; }
      setForm({
        name: clan.name, tag: clan.tag, description: clan.description || "",
        badge: clan.badge, tier: clan.tier, play_time: clan.play_time,
        style: clan.style, max_members: clan.max_members
      });
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!form.name || !form.tag || !form.description) { setError("클랜명, 태그, 소개를 입력해주세요."); return; }
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("clans").update({
      ...form, tag: form.tag.toUpperCase()
    }).eq("id", id);
    if (updateError) { setError("저장에 실패했어요. 다시 시도해주세요."); setSaving(false); return; }
    router.push(`/clan/${id}`);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

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
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px 36px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-back { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 13px 24px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
        .select-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 16px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .select-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .badge-btn { font-size: 24px; padding: 8px; background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .badge-btn.active { border-color: #ff6b23; background: rgba(255,107,35,0.15); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>클랜 정보 수정</h1>
          </div>
          <a href={`/clan/${id}`} className="btn-back">← 돌아가기</a>
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
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">클랜 태그 * (최대 6자)</label>
            <input className="input" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value.toUpperCase() })} maxLength={6} />
          </div>
          <div>
            <label className="label">클랜 소개 *</label>
            <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장하기"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
