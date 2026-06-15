"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) { setError("이메일을 입력해주세요."); return; }
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://overclan.vercel.app/reset-password"
    });
    if (resetError) {
      setError("이메일 발송에 실패했어요. 다시 시도해주세요.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .btn { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <svg width="48" height="54" viewBox="0 0 32 36" style={{ marginBottom: 12 }}>
              <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
              <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
              <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
            </svg>
            <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#e8eaf0" }}>
              <span style={{ color: "#ff6b23" }}>OVER</span>CLAN
            </div>
          </a>
        </div>

        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 32px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 12, color: "#4caf50" }}>이메일 발송 완료</h2>
              <p style={{ fontSize: 14, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7, marginBottom: 24 }}>
                {email}로 비밀번호 재설정 링크를 발송했어요.<br/>이메일을 확인해주세요.
              </p>
              <a href="/login" style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, letterSpacing: 1 }}>← 로그인으로 돌아가기</a>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 8, color: "#e8eaf0" }}>비밀번호 찾기</h2>
              <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 24, lineHeight: 1.6 }}>가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <input className="input" type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReset()} />
              </div>
              {error && <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 16, fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}
              <button className="btn" onClick={handleReset} disabled={loading}>{loading ? "발송 중..." : "재설정 링크 발송"}</button>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                <a href="/login" style={{ color: "#ff6b23", textDecoration: "none" }}>← 로그인으로 돌아가기</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
