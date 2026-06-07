"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .btn { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn:hover { box-shadow: 0 8px 24px rgba(255,107,35,0.4); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <svg width="48" height="54" viewBox="0 0 32 36" style={{ marginBottom: 12 }}>
            <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
            <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
            <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
          </svg>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#e8eaf0" }}>
            <span style={{ color: "#ff6b23" }}>OVER</span>CLAN
          </div>
        </div>

        {/* 카드 */}
        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 32px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
          <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 28, color: "#e8eaf0" }}>로그인</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <input className="input" type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>

          {error && <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 16, fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}

          <button className="btn" onClick={handleLogin} disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
            계정이 없으신가요?{" "}
            <a href="/signup" style={{ color: "#ff6b23", textDecoration: "none", fontWeight: 500 }}>회원가입</a>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, fontFamily: "Noto Sans KR, sans-serif" }}>
            <a href="/forgot-password" style={{ color: "#8892a4", textDecoration: "none" }}>비밀번호를 잊으셨나요?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
