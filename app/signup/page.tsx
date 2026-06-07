"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const TIERS = ["", "브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];
const ROLES = [
  { key: "탱커", tierKey: "tier_tank", icon: "🛡️", color: "#4fc3f7" },
  { key: "딜러", tierKey: "tier_dps", icon: "⚔️", color: "#ff6b23" },
  { key: "힐러", tierKey: "tier_support", icon: "💊", color: "#4caf50" },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [battletag, setBattletag] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [tierTank, setTierTank] = useState("");
  const [tierDps, setTierDps] = useState("");
  const [tierSupport, setTierSupport] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: string) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSignup = async () => {
    if (!email || !password || !nickname || !battletag) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: { nickname, battletag }
      }
    });

    if (signupError) {
      console.error(signupError);
      if (signupError.message.includes("already registered")) {
        setError("이미 가입된 이메일이에요. 로그인해주세요.");
      } else {
        setError(`오류: ${signupError.message}`);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        nickname,
        battletag,
        email,
        roles,
        tier_tank: tierTank,
        tier_dps: tierDps,
        tier_support: tierSupport,
      });
      if (profileError) console.error("프로필 저장 오류:", profileError);
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .btn { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn:hover { box-shadow: 0 8px 24px rgba(255,107,35,0.4); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .hint { font-size: 11px; color: #8892a4; margin-top: 6px; font-family: 'Noto Sans KR', sans-serif; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <svg width="48" height="54" viewBox="0 0 32 36" style={{ marginBottom: 12 }}>
            <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
            <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
            <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
          </svg>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#e8eaf0" }}>
            <span style={{ color: "#ff6b23" }}>OVER</span>CLAN
          </div>
        </div>

        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 32px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
          <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 28, color: "#e8eaf0" }}>회원가입</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label">닉네임</label>
              <input className="input" type="text" placeholder="오버클랜에서 사용할 이름" value={nickname} onChange={e => setNickname(e.target.value)} />
            </div>
            <div>
              <label className="label">배틀태그</label>
              <input className="input" type="text" placeholder="닉네임#1234" value={battletag} onChange={e => setBattletag(e.target.value)} />
              <div className="hint">오버워치 배틀태그를 입력해주세요</div>
            </div>
            <div>
              <label className="label">이메일</label>
              <input className="input" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">비밀번호</label>
              <input className="input" type="password" placeholder="6자 이상" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignup()} />
            </div>

            {/* 역할군 & 티어 */}
            <div>
              <label className="label">역할군별 티어 (선택)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ROLES.map(r => (
                  <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(13,20,35,0.6)", border: `1px solid ${roles.includes(r.key) ? r.color + "44" : "rgba(255,107,35,0.08)"}`, padding: "8px 10px" }}>
                    <button type="button" onClick={() => toggleRole(r.key)} style={{
                      background: roles.includes(r.key) ? `${r.color}22` : "rgba(13,20,35,0.8)",
                      border: `1px solid ${roles.includes(r.key) ? r.color : "rgba(255,255,255,0.1)"}`,
                      color: roles.includes(r.key) ? r.color : "#8892a4",
                      padding: "4px 10px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap", flexShrink: 0,
                    }}>{r.icon} {r.key}</button>
                    <select value={r.key === "탱커" ? tierTank : r.key === "딜러" ? tierDps : tierSupport}
                      onChange={e => { if (r.key === "탱커") setTierTank(e.target.value); else if (r.key === "딜러") setTierDps(e.target.value); else setTierSupport(e.target.value); }}
                      style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", color: "#8892a4", padding: "6px 10px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 12, outline: "none", flex: 1 }}>
                      <option value="">티어 선택</option>
                      {TIERS.filter(t => t).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="hint">나중에 프로필에서 수정할 수 있어요</div>
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 16, fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}

          <button className="btn" onClick={handleSignup} disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            이미 계정이 있으신가요?{" "}
            <a href="/login" style={{ color: "#ff6b23", textDecoration: "none", fontWeight: 500 }}>로그인</a>
          </div>
        </div>
      </div>
    </div>
  );
}
