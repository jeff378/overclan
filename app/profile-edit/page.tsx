"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

const TIERS = ["", "브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];
const ROLES = [
  { key: "탱커", tierKey: "tier_tank", icon: "🛡️", color: "#4fc3f7" },
  { key: "딜러", tierKey: "tier_dps", icon: "⚔️", color: "#ff6b23" },
  { key: "힐러", tierKey: "tier_support", icon: "💊", color: "#4caf50" },
];

const TIER_COLORS: Record<string, string> = {
  "챔피언": "#ffd700", "그랜드마스터": "#ff9800", "마스터": "#ff6b23",
  "다이아": "#4fc3f7", "플래티넘": "#b0bec5", "골드": "#ffd54f",
  "실버": "#90a4ae", "브론즈": "#a1887f",
};

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nickname: "", battletag: "", main_hero: "",
    roles: [] as string[],
    tier_tank: "", tier_dps: "", tier_support: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
      if (prof) setForm({
        nickname: prof.nickname || "",
        battletag: prof.battletag || "",
        main_hero: prof.main_hero || "",
        roles: prof.roles || [],
        tier_tank: prof.tier_tank || "",
        tier_dps: prof.tier_dps || "",
        tier_support: prof.tier_support || "",
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
    if (form.nickname.length > 10) { alert("닉네임은 10자 이내로 입력해주세요."); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("profiles").update({
      nickname: form.nickname,
      battletag: form.battletag,
      main_hero: form.main_hero,
      roles: form.roles,
      tier_tank: form.tier_tank,
      tier_dps: form.tier_dps,
      tier_support: form.tier_support,
    }).eq("id", userData.user!.id);
    setSaving(false);
    alert("프로필이 저장됐어요!");
    router.push("/mypage");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; display: block; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px 36px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-back { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 13px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
        .role-toggle { padding: 10px 20px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; border-radius: 2px; transition: all 0.2s; border: 1px solid; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); }
        .tier-select { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 10px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; cursor: pointer; flex: 1; }
        .tier-select:focus { border-color: #ff6b23; }
        .role-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(13,20,35,0.6); border: 1px solid rgba(255,107,35,0.08); margin-bottom: 6px; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>프로필 수정</h1>
          </div>
          <a href="/mypage" className="btn-back">← 돌아가기</a>
        </div>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* 기본 정보 */}
          <div>
            <label className="label">닉네임 * (최대 10자)</label>
            <input className="input" placeholder="오버클랜에서 사용할 이름" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} maxLength={10} />
          </div>

          <div>
            <label className="label">배틀태그 *</label>
            <input className="input" placeholder="닉네임#1234" value={form.battletag} onChange={e => setForm({ ...form, battletag: e.target.value })} />
          </div>

          {/* 역할군 & 티어 */}
          <div>
            <label className="label">역할군별 티어 (플레이하는 포지션만 입력)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ROLES.map(r => (
                <div key={r.key} className="role-row">
                  {/* 역할군 토글 */}
                  <button className="role-toggle" onClick={() => toggleRole(r.key)} style={{
                    background: form.roles.includes(r.key) ? `${r.color}22` : "rgba(13,20,35,0.8)",
                    borderColor: form.roles.includes(r.key) ? r.color : "rgba(255,255,255,0.1)",
                    color: form.roles.includes(r.key) ? r.color : "#8892a4",
                    minWidth: 90,
                  }}>
                    {r.icon} {r.key}
                  </button>

                  {/* 티어 선택 */}
                  <select className="tier-select" value={(form as any)[r.tierKey]} onChange={e => setForm({ ...form, [r.tierKey]: e.target.value })}
                    style={{ color: TIER_COLORS[(form as any)[r.tierKey]] || "#8892a4" }}>
                    <option value="">티어 선택</option>
                    {TIERS.filter(t => t).map(t => (
                      <option key={t} value={t} style={{ color: TIER_COLORS[t] || "#e8eaf0" }}>{t}</option>
                    ))}
                  </select>

                  {/* 티어 배지 미리보기 */}
                  {(form as any)[r.tierKey] && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px",
                      background: `${TIER_COLORS[(form as any)[r.tierKey]]}22`,
                      color: TIER_COLORS[(form as any)[r.tierKey]],
                      border: `1px solid ${TIER_COLORS[(form as any)[r.tierKey]]}44`,
                      clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)",
                      whiteSpace: "nowrap",
                    }}>{(form as any)[r.tierKey]}</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#8892a4", marginTop: 8, fontFamily: "Noto Sans KR, sans-serif" }}>
              역할군 버튼을 클릭해서 활성화하고 티어를 선택해주세요. 여러 포지션 선택 가능해요.
            </div>
          </div>

          {/* 주력 영웅 */}
          <div>
            <label className="label">주력 영웅 (선택)</label>
            <input className="input" placeholder="예: 트레이서, 라인하르트, 아나..." value={form.main_hero} onChange={e => setForm({ ...form, main_hero: e.target.value })} />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,107,35,0.1)", paddingTop: 20 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장하기"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
