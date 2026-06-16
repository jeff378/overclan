"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { isValueTaken } from "../../lib/validate";
import { useRouter } from "next/navigation";
import { ROLES } from "../../lib/roles";

const TIERS = ["", "브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];

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
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const toggleRole = (role: string) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  // 인증번호 확인 → 프로필 생성 → 로그인 완료
  const handleVerify = async () => {
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) { setError("6자리 인증번호를 입력해주세요."); return; }
    setVerifying(true);
    setError("");
    const { data, error: vErr } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
    if (vErr || !data.user) {
      setError("인증번호가 올바르지 않거나 만료됐어요. 다시 확인해주세요.");
      setVerifying(false);
      return;
    }
    await supabase.from("profiles").upsert({
      id: data.user.id,
      nickname, battletag, email, roles,
      tier_tank: tierTank, tier_dps: tierDps, tier_support: tierSupport,
    });
    router.push("/");
  };

  // 인증번호 재발송 (60초 쿨다운)
  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendMsg("");
    setError("");
    const { error: rErr } = await supabase.auth.resend({ type: "signup", email });
    if (rErr) { setError("재발송에 실패했어요. 잠시 후 다시 시도해주세요."); return; }
    setResendMsg("인증번호를 다시 보냈어요. 메일함(스팸함 포함)을 확인해주세요.");
    setCooldown(60);
  };

  const handleSignup = async () => {
    if (!email || !password || !nickname || !battletag) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    if (nickname.length > 10) {
      setError("닉네임은 10자 이내로 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    // 배틀태그 형식 검증: 한글/영문 2~12자 + # + 숫자 4~7자
    const btRegex = /^[a-zA-Z가-힣0-9]{2,12}#[0-9]{4,7}$/;
    if (!btRegex.test(battletag)) {
      setError("배틀태그 형식이 올바르지 않아요. 예) 닉네임#1234");
      return;
    }
    if (await isValueTaken("profiles", "nickname", nickname)) {
      setError("이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
        // 인증 후 첫 로그인 때 프로필을 생성하기 위해 메타데이터에 보관
        data: { nickname, battletag, roles, tier_tank: tierTank, tier_dps: tierDps, tier_support: tierSupport },
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

    if (data.session) {
      // 이메일 확인이 꺼져 있으면 바로 로그인됨 → 프로필 생성
      await supabase.from("profiles").upsert({
        id: data.user!.id,
        nickname, battletag, email, roles,
        tier_tank: tierTank, tier_dps: tierDps, tier_support: tierSupport,
      });
      router.push("/");
    } else {
      // 이메일 확인이 켜져 있으면 인증 메일 발송 → 안내 화면
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", padding: "0 24px" }}>
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 46, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 2, color: "#fff", marginBottom: 14 }}>인증번호를 보냈어요</h1>
          <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, marginBottom: 22 }}>
            <span style={{ color: "#ff6b23", fontWeight: 700 }}>{email}</span> 로 보낸<br />6자리 인증번호를 입력해주세요.
          </p>

          <input
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
            inputMode="numeric"
            autoFocus
            placeholder="------"
            style={{
              width: "100%", background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.35)",
              color: "#ff8c42", fontFamily: "'Courier New', monospace", fontSize: 32, fontWeight: 700,
              letterSpacing: 14, textAlign: "center", padding: "16px 0", outline: "none", marginBottom: 16,
              clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
            }}
          />

          {error && <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 14, fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}
          {resendMsg && <div style={{ fontSize: 13, color: "#4caf50", marginBottom: 14, fontFamily: "Noto Sans KR, sans-serif" }}>{resendMsg}</div>}

          <button onClick={handleVerify} disabled={verifying || otp.length !== 6} style={{
            width: "100%", background: "linear-gradient(135deg, #ff6b23, #ff8c42)", border: "none", color: "#fff",
            padding: 14, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2,
            cursor: verifying || otp.length !== 6 ? "not-allowed" : "pointer", opacity: verifying || otp.length !== 6 ? 0.5 : 1,
            clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
          }}>{verifying ? "인증 중..." : "인증하고 가입 완료"}</button>

          <div style={{ marginTop: 20, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            번호가 안 왔나요?{" "}
            <button onClick={handleResend} disabled={cooldown > 0} style={{
              background: "none", border: "none", color: cooldown > 0 ? "#5a6478" : "#ff6b23", fontWeight: 600,
              cursor: cooldown > 0 ? "default" : "pointer", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, padding: 0,
            }}>{cooldown > 0 ? `재발송 (${cooldown}초)` : "다시 보내기"}</button>
          </div>
          <p style={{ fontSize: 12, color: "#5a6478", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7, marginTop: 14 }}>
            메일이 안 보이면 스팸함도 확인해주세요. 인증번호는 10분 후 만료돼요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .btn { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
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
          <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#e8eaf0" }}>
            <span style={{ color: "#ff6b23" }}>OVER</span>CLAN
          </div>
        </div>

        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 32px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
          <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 28, color: "#e8eaf0" }}>회원가입</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            <div>
              <label className="label">닉네임</label>
              <input className="input" type="text" placeholder="오버클랜에서 사용할 이름" value={nickname} onChange={e => setNickname(e.target.value)} maxLength={10} />
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
                      padding: "4px 10px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
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
