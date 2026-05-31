"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [battletag, setBattletag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        data: { nickname, battletag }
      }
    });

    if (signupError) {
      setError("회원가입에 실패했어요. 다시 시도해주세요.");
    } else if (data.user) {
      // 프로필 저장
      await supabase.from("profiles").insert({
        id: data.user.id,
        nickname,
        battletag,
        email,
      });
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
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
        {/* 로고 */}
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
