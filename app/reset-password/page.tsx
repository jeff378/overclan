"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!password || !confirm) { setError("비밀번호를 입력해주세요."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 해요."); return; }
    if (password !== confirm) { setError("비밀번호가 일치하지 않아요."); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError("비밀번호 변경에 실패했어요."); setLoading(false); return; }
    alert("비밀번호가 변경됐어요!");
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .btn { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
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

        <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px 32px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
          <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>새 비밀번호 설정</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
            <div>
              <label className="label">새 비밀번호</label>
              <input className="input" type="password" placeholder="6자 이상" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">비밀번호 확인</label>
              <input className="input" type="password" placeholder="비밀번호 재입력" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReset()} />
            </div>
          </div>
          {error && <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 16, fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}
          <button className="btn" onClick={handleReset} disabled={loading}>{loading ? "변경 중..." : "비밀번호 변경"}</button>
        </div>
      </div>
    </div>
  );
}
