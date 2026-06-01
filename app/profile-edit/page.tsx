"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

const TIERS = ["브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];
const ROLES = [
  { key: "탱커", icon: "🛡️", color: "#4fc3f7" },
  { key: "딜러", icon: "⚔️", color: "#ff6b23" },
  { key: "힐러", icon: "💊", color: "#4caf50" },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nickname: "", battletag: "", tier: "", roles: [] as string[], main_hero: ""
  });

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
      if (prof) setForm({
        nickname: prof.nickname || "",
        battletag: prof.battletag || "",
        tier: prof.tier || "",
        roles: prof.roles || [],
        main_hero: prof.main_hero || "",
      });
      setLoading(false);
    };
    load();
  }, []);

  const toggleRole = (role: string) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role]
    }));
  };

  const handleSave = async () => {
    if (!form.nickname || !form.battletag) { alert("닉네임과 배틀태그를 입력해주세요."); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("profiles").update({
      nickname: form.nickname,
      battletag: form.battletag,
      tier: form.tier,
      roles: form.roles,
      main_hero: form.main_hero,
    }).eq("id", userData.user!.id);
    setSaving(false);
    alert("프로필이 저장됐어요!");
    router.push("/mypage");
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
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; display: block; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px 36px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-back { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 13px 24px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
        .select-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 16px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .select-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>프로필 수정</h1>
          </div>
          <a href="/mypage" className="btn-back">← 돌아가기</a>
        </div>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* 기본 정보 */}
          <div>
            <label className="label">닉네임 *</label>
            <input className="input" placeholder="오버클랜에서 사용할 이름" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
          </div>

          <div>
            <label className="label">배틀태그 *</label>
            <input className="input" placeholder="닉네임#1234" value={form.battletag} onChange={e => setForm({ ...form, battletag: e.target.value })} />
          </div>

          {/* 티어 */}
          <div>
            <label className="label">내 티어</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIERS.map(t => (
                <button key={t} className={`select-btn ${form.tier === t ? "active" : ""}`} onClick={() => setForm({ ...form, tier: form.tier === t ? "" : t })}>{t}</button>
              ))}
            </div>
          </div>

          {/* 역할군 */}
          <div>
            <label className="label">주 역할군 (중복 선택 가능)</label>
            <div style={{ display: "flex", gap: 10 }}>
              {ROLES.map(r => (
                <button key={r.key} onClick={() => toggleRole(r.key)} style={{
                  padding: "10px 20px",
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${form.roles.includes(r.key) ? r.color : "rgba(255,255,255,0.1)"}`,
                  background: form.roles.includes(r.key) ? `${r.color}22` : "rgba(13,20,35,0.8)",
                  color: form.roles.includes(r.key) ? r.color : "#8892a4",
                  clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                  transition: "all 0.2s",
                }}>{r.icon} {r.key}</button>
              ))}
            </div>
            {form.roles.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                선택됨: {form.roles.join(", ")}
              </div>
            )}
          </div>

          {/* 주력 영웅 */}
          <div>
            <label className="label">주력 영웅 (선택)</label>
            <input className="input" placeholder="예: 트레이서, 라인하르트, 아나..." value={form.main_hero} onChange={e => setForm({ ...form, main_hero: e.target.value })} />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,107,35,0.1)", paddingTop: 20, display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장하기"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
