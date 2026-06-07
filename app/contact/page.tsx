"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", category: "일반 문의", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) { alert("모든 항목을 입력해주세요."); return; }
    const subject = encodeURIComponent(`[오버클랜 ${form.category}] ${form.name}`);
    const body = encodeURIComponent(`이름: ${form.name}\n이메일: ${form.email}\n카테고리: ${form.category}\n\n내용:\n${form.message}`);
    window.open(`mailto:jujin2271@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 160px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; display: block; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px 36px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>문의하기</h1>
        </div>

        {sent ? (
          <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(76,175,80,0.3)", padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#4caf50", marginBottom: 12 }}>문의가 접수됐어요!</h2>
            <p style={{ fontSize: 14, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7 }}>
              이메일 앱이 열렸다면 전송 버튼을 눌러주세요.<br/>빠른 시일 내에 답변드릴게요.
            </p>
            <button className="btn-primary" onClick={() => setSent(false)} style={{ marginTop: 24 }}>다시 문의하기</button>
          </div>
        ) : (
          <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="label">이름 *</label>
                <input className="input" placeholder="닉네임 또는 이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">이메일 *</label>
                <input className="input" type="email" placeholder="답변받을 이메일" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">문의 유형</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "14px 18px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 14, outline: "none", width: "100%" }}>
                {["일반 문의", "버그 신고", "클랜 관련", "계정 관련", "기타"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">문의 내용 *</label>
              <textarea className="input" placeholder="문의 내용을 자세히 적어주세요." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                📧 jujin2271@gmail.com 으로 전송돼요
              </p>
              <button className="btn-primary" onClick={handleSubmit}>문의 보내기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
