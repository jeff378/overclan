"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: all 0.25s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input:focus { border-color: #ff6b23; box-shadow: 0 0 0 1px rgba(255,107,35,0.4), 0 0 18px rgba(255,107,35,0.15); }
        .input::placeholder { color: #8892a4; }
        .btn { position: relative; background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; overflow: hidden; }
        .btn::after { content: ''; position: absolute; top: 0; left: -120%; width: 60%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent); transform: skewX(-20deg); transition: left 0.6s; }
        .btn:hover { box-shadow: 0 8px 28px rgba(255,107,35,0.45); }
        .btn:hover::after { left: 130%; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn:disabled::after { display: none; }
        .glow-orb { position: absolute; border-radius: 50%; pointer-events: none; will-change: transform; }
        .login-card { animation: cardIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .login-logo { animation: logoIn 0.6s ease-out both; }
        .auth-link { transition: color 0.2s; }
        .auth-link:hover { color: #ff8c42 !important; }
        @keyframes floatGlow1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(50px,-36px) scale(1.1); } }
        @keyframes floatGlow2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px,44px) scale(1.15); } }
        @keyframes hexPulse { 0%,100% { filter: drop-shadow(0 0 4px rgba(255,107,35,0.4)); } 50% { filter: drop-shadow(0 0 14px rgba(255,107,35,0.85)); } }
        @keyframes ringSpin { to { transform: rotate(360deg); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes logoIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanline { 0% { transform: translateY(0); opacity: 0; } 8% { opacity: 0.6; } 92% { opacity: 0.6; } 100% { transform: translateY(100vh); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .glow-orb, .scan-line, .hex-pulse, .ring-spin { animation: none !important; }
          .login-card, .login-logo { animation: none !important; }
        }
      `}</style>

      {/* 배경: 헥사곤 그리드 */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='46'%3E%3Cpolygon points='20,2 38,12 38,34 20,44 2,34 2,12' fill='none' stroke='rgba(255,107,35,0.05)' stroke-width='1'/%3E%3C/svg%3E\")", opacity: 0.6, pointerEvents: "none" }} />
      {/* 배경: 떠다니는 글로우 오브 */}
      <div className="glow-orb" style={{ width: 420, height: 420, background: "radial-gradient(circle, rgba(255,107,35,0.13), transparent 70%)", top: "6%", left: "2%", animation: "floatGlow1 13s ease-in-out infinite" }} />
      <div className="glow-orb" style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(79,195,247,0.09), transparent 70%)", bottom: "6%", right: "2%", animation: "floatGlow2 16s ease-in-out infinite" }} />
      {/* 스캔라인 */}
      <div className="scan-line" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,107,35,0.5), transparent)", animation: "scanline 7s linear infinite", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* 로고 */}
        <div className="login-logo" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 14px" }}>
            {/* 회전 점선 링 */}
            <svg className="ring-spin" width="64" height="64" viewBox="0 0 64 64" style={{ position: "absolute", inset: 0, animation: "ringSpin 14s linear infinite" }}>
              <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,107,35,0.25)" strokeWidth="1" strokeDasharray="3 6" />
            </svg>
            {/* 헥사곤 로고 */}
            <svg className="hex-pulse" width="64" height="64" viewBox="0 0 32 36" style={{ position: "absolute", inset: 0, animation: "hexPulse 2.6s ease-in-out infinite" }}>
              <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
              <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
              <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
            </svg>
          </div>
          <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#e8eaf0" }}>
            <span style={{ color: "#ff6b23" }}>OVER</span>CLAN
          </div>
          <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, letterSpacing: 5, color: "#8892a4", marginTop: 6 }}>OVERWATCH CLAN PLATFORM</div>
        </div>

        {/* 카드 */}
        <div className="login-card" style={{ position: "relative", background: "rgba(13,20,35,0.92)", border: "1px solid rgba(255,107,35,0.18)", padding: "36px 32px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          {/* 코너 액센트 */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 24, height: 2, background: "#ff6b23" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: 24, background: "#ff6b23" }} />

          <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 28, color: "#e8eaf0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 18, background: "#ff6b23", display: "inline-block" }} />로그인
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <input className="input" type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <div style={{ position: "relative" }}>
              <input className="input" type={showPassword ? "text" : "password"} placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 46 }} />
              <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8892a4", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, lineHeight: 0 }}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 16, fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 6 }}><span>⚠️</span>{error}</div>}

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            계정이 없으신가요?{" "}
            <a href="/signup" className="auth-link" style={{ color: "#ff6b23", textDecoration: "none", fontWeight: 500 }}>회원가입</a>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, fontFamily: "Noto Sans KR, sans-serif" }}>
            <a href="/forgot-password" className="auth-link" style={{ color: "#8892a4", textDecoration: "none" }}>비밀번호를 잊으셨나요?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
