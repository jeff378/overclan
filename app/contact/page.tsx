"use client";
import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";

const FAQS = [
  { q: "클랜은 어떻게 만드나요?", c: "계정",
    a: "로그인 후 상단 '클랜 찾기' 메뉴 → 우측 상단 '클랜 만들기' 버튼을 눌러주세요. 클랜명(최대 12자), 태그, 소개, 플레이 시간대 등을 설정하면 바로 만들 수 있어요. 이미 소속 클랜이 있으면 탈퇴 후 만들 수 있어요." },
  { q: "클랜 가입 신청을 했는데 수락이 안 돼요.", c: "클랜",
    a: "클랜장이 직접 수락해야 가입이 완료돼요. 클랜장이 바쁘거나 아직 확인 전일 수 있어요. 수락 또는 거절 시 알림으로 결과를 알려드려요. 거절됐다면 클랜장이 차단 설정을 했을 수 있어요." },
  { q: "클랜 대전은 어떻게 신청하나요?", c: "대전",
    a: "상단 '클랜대전' 메뉴에서 신청할 수 있어요. 특정 클랜을 지목하거나, 열린 모집으로 상대 클랜을 구할 수 있어요. 날짜 협의 → 멤버 5명 모집 → 스크림 진행 → 결과 입력 순서로 진행돼요." },
  { q: "클랜 랭킹 점수는 어떻게 계산되나요?", c: "랭킹",
    a: "정규전 결과에 따라 승리 +3점, 무승부 +1점, 패배 0점이에요. 친선전은 랭킹에 반영되지 않아요. 단, 어뷰징 방지를 위해 같은 두 클랜 간의 시즌 첫 정규전만 승점이 반영돼요." },
  { q: "비밀번호를 잊어버렸어요.", c: "계정",
    a: "로그인 페이지 하단의 '비밀번호를 잊으셨나요?' 링크를 클릭하시거나, 설정 페이지 → '비밀번호 변경'을 누르시면 이메일로 재설정 링크를 받을 수 있어요." },
  { q: "핵 의심 플레이어는 어떻게 신고하나요?", c: "신고",
    a: "상단 '핵 제보' 메뉴에서 의심 리플레이 영상 링크를 공유하면, 다른 유저들이 투표로 판별해줘요. 커뮤니티가 함께 판단하는 방식이에요." },
  { q: "클랜원은 최대 몇 명까지 가능한가요?", c: "클랜",
    a: "현재 클랜원은 최대 50명까지 가능해요. 50명 초과가 필요한 경우 추후 클랜 확장 기능이 추가될 예정이에요." },
  { q: "클랜을 클랜 찾기에서 숨길 수 있나요?", c: "클랜",
    a: "네, 가능해요. 설정 페이지 → '공개 범위' → '클랜 찾기 노출' 토글을 끄면 클랜 찾기 목록에서 숨길 수 있어요. 클랜장만 설정할 수 있어요." },
];

const CATEGORIES = ["전체", "계정", "클랜", "대전", "랭킹", "신고"];

type Msg = { role: "user" | "assistant"; content: string; escalate?: boolean };

export default function ContactPage() {
  const [openIdx, setOpenIdx]       = useState<number | null>(null);
  const [catFilter, setCatFilter]   = useState("전체");
  const [messages, setMessages]     = useState<Msg[]>([
    { role: "assistant", content: "안녕하세요! 오버클랜 AI 고객 지원이에요 👋\n궁금한 점을 자유롭게 물어보세요. 간단한 사용법부터 대전 방법까지 도와드릴게요!" }
  ]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [form, setForm]             = useState({ name: "", email: "", message: "" });
  const [sent, setSent]             = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = [...messages, userMsg]
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content.replace("[ESCALATE]", "").trim() }));
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text, escalate: data.escalate }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요." }]);
    }
    setLoading(false);
  };

  const handleEmail = () => {
    if (!form.name || !form.email || !form.message) { alert("모든 항목을 입력해주세요."); return; }
    const subject = encodeURIComponent(`[오버클랜 문의] ${form.name}`);
    const body = encodeURIComponent(`이름: ${form.name}\n이메일: ${form.email}\n\n내용:\n${form.message}`);
    window.open(`mailto:jujin2271@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
  };

  const filtered = catFilter === "전체" ? FAQS : FAQS.filter(f => f.c === catFilter);

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani','Noto Sans KR',sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        .faq-item { background:rgba(13,20,35,0.7); border:1px solid rgba(255,107,35,0.1); margin-bottom:8px; transition:border-color 0.2s; cursor:pointer; }
        .faq-item:hover, .faq-item.open { border-color:rgba(255,107,35,0.35); }
        .faq-q { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px; }
        .faq-a { padding:0 20px 18px; font-size:13.5px; color:#c8cad0; font-family:'Noto Sans KR',sans-serif; line-height:1.8; }
        .cat-btn { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#8892a4; padding:6px 14px; font-family:'Noto Sans KR',sans-serif; font-size:12px; cursor:pointer; transition:all 0.2s; white-space:nowrap; clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%); }
        .cat-btn.active { background:rgba(255,107,35,0.15); border-color:#ff6b23; color:#ff6b23; }
        .chat-bubble { max-width:80%; padding:12px 16px; font-family:'Noto Sans KR',sans-serif; font-size:13.5px; line-height:1.7; white-space:pre-wrap; word-break:break-word; }
        .bubble-ai { background:rgba(13,20,35,0.9); border:1px solid rgba(255,107,35,0.15); align-self:flex-start; clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%); }
        .bubble-user { background:rgba(255,107,35,0.15); border:1px solid rgba(255,107,35,0.3); align-self:flex-end; clip-path:polygon(0 10px,10px 0,100% 0,100% 100%,0 100%); }
        .chat-input { background:rgba(13,20,35,0.9); border:1px solid rgba(255,107,35,0.2); color:#e8eaf0; padding:13px 18px; font-family:'Noto Sans KR',sans-serif; font-size:14px; outline:none; flex:1; transition:border-color 0.2s; }
        .chat-input:focus { border-color:#ff6b23; }
        .chat-input::placeholder { color:#8892a4; }
        .send-btn { background:linear-gradient(135deg,#ff6b23,#ff8c42); border:none; color:#fff; padding:13px 22px; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; letter-spacing:1px; cursor:pointer; clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition:opacity 0.2s; white-space:nowrap; }
        .send-btn:disabled { opacity:0.45; cursor:not-allowed; }
        @media (max-width: 720px) { .contact-grid { grid-template-columns: 1fr !important; } .chat-sticky { position: static !important; } }
        .escalate-btn { background:rgba(255,107,35,0.12); border:1px solid rgba(255,107,35,0.4); color:#ff6b23; padding:8px 18px; font-family:'Rajdhani',sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; cursor:pointer; clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); margin-top:10px; }
        .form-input { background:rgba(13,20,35,0.9); border:1px solid rgba(255,107,35,0.2); color:#e8eaf0; padding:12px 16px; font-family:'Noto Sans KR',sans-serif; font-size:14px; outline:none; width:100%; transition:border-color 0.2s; }
        .form-input:focus { border-color:#ff6b23; }
        .form-input::placeholder { color:#8892a4; }
        .dot { width:7px; height:7px; border-radius:50%; background:#ff6b23; animation:bounce 1.1s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay:.18s; }
        .dot:nth-child(3) { animation-delay:.36s; }
        @keyframes bounce { 0%,80%,100% { transform:scale(0.6); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
      `}</style>

      <Navbar />

      <div style={{ maxWidth:900, margin:"0 auto", padding:"clamp(24px,4vw,48px) clamp(16px,4vw,32px) 80px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:3, height:22, background:"#ff6b23", flexShrink:0 }} />
          <h1 style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"clamp(20px,5vw,26px)", fontWeight:700, letterSpacing:2 }}>고객 지원</h1>
        </div>
        <p style={{ fontSize:13, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif", marginBottom:40, marginLeft:15 }}>자주 묻는 질문을 확인하거나, AI에게 바로 물어보세요.</p>

        <div className="contact-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"start" }}>

          {/* ── 좌측: FAQ ── */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <div style={{ width:3, height:16, background:"#ff6b23" }} />
              <span style={{ fontFamily:"Rajdhani,sans-serif", fontSize:16, fontWeight:700, letterSpacing:1 }}>자주 묻는 질문</span>
            </div>

            {/* 카테고리 필터 */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
              {CATEGORIES.map(c => (
                <button key={c} className={`cat-btn${catFilter===c?" active":""}`} onClick={()=>setCatFilter(c)}>{c}</button>
              ))}
            </div>

            {filtered.map((faq, i) => {
              const idx = FAQS.indexOf(faq);
              const isOpen = openIdx === idx;
              return (
                <div key={idx} className={`faq-item${isOpen?" open":""}`} onClick={() => setOpenIdx(isOpen ? null : idx)}>
                  <div className="faq-q">
                    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                      <span style={{ fontSize:10, background:"rgba(255,107,35,0.15)", color:"#ff6b23", border:"1px solid rgba(255,107,35,0.3)", padding:"2px 7px", fontFamily:"Rajdhani,sans-serif", fontWeight:700, letterSpacing:1, flexShrink:0 }}>{faq.c}</span>
                      <span style={{ fontFamily:"Noto Sans KR,sans-serif", fontSize:13.5, fontWeight:600, color:"#e8eaf0", lineHeight:1.4 }}>{faq.q}</span>
                    </div>
                    <span style={{ color:"#ff6b23", fontSize:16, flexShrink:0, transition:"transform 0.2s", transform:isOpen?"rotate(180deg)":"rotate(0deg)" }}>▾</span>
                  </div>
                  {isOpen && <div className="faq-a">{faq.a}</div>}
                </div>
              );
            })}
          </div>

          {/* ── 우측: AI 채팅 ── */}
          <div className="chat-sticky" style={{ position:"sticky", top:80 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <div style={{ width:3, height:16, background:"#4fc3f7" }} />
              <span style={{ fontFamily:"Rajdhani,sans-serif", fontSize:16, fontWeight:700, letterSpacing:1 }}>AI 지원</span>
              <span style={{ fontSize:10, background:"rgba(79,195,247,0.12)", color:"#4fc3f7", border:"1px solid rgba(79,195,247,0.3)", padding:"2px 8px", fontFamily:"Rajdhani,sans-serif", fontWeight:700, letterSpacing:1 }}>24/7</span>
            </div>

            <div style={{ background:"rgba(13,20,35,0.8)", border:"1px solid rgba(79,195,247,0.15)", display:"flex", flexDirection:"column", height:440 }}>
              {/* 메시지 영역 */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start" }}>
                    {m.role==="assistant" && (
                      <div style={{ fontSize:10, color:"#4fc3f7", fontFamily:"Rajdhani,sans-serif", letterSpacing:1, marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                        <span>⚡</span> AI 지원
                      </div>
                    )}
                    <div className={`chat-bubble ${m.role==="assistant"?"bubble-ai":"bubble-user"}`}>{m.content}</div>
                    {m.escalate && (
                      <button className="escalate-btn" onClick={() => setShowEmailForm(true)}>
                        📧 운영자에게 문의
                      </button>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                    <div style={{ fontSize:10, color:"#4fc3f7", fontFamily:"Rajdhani,sans-serif", letterSpacing:1, marginBottom:4 }}>⚡ AI 지원</div>
                    <div className="chat-bubble bubble-ai" style={{ display:"flex", gap:5, alignItems:"center", padding:"14px 18px" }}>
                      <div className="dot" /><div className="dot" /><div className="dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* 입력창 */}
              <div style={{ borderTop:"1px solid rgba(79,195,247,0.1)", display:"flex" }}>
                <input className="chat-input" placeholder="궁금한 점을 입력하세요..." value={input}
                  onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} />
                <button className="send-btn" onClick={send} disabled={loading||!input.trim()}>전송</button>
              </div>
            </div>

            {/* 운영자 문의 바로가기 */}
            <div style={{ marginTop:10, textAlign:"center" }}>
              <button onClick={()=>setShowEmailForm(v=>!v)} style={{ background:"none", border:"none", color:"#8892a4", fontSize:12, fontFamily:"Noto Sans KR,sans-serif", cursor:"pointer", textDecoration:"underline" }}>
                AI 대신 운영자에게 직접 문의하기
              </button>
            </div>

            {/* 이메일 폼 */}
            {showEmailForm && !sent && (
              <div style={{ marginTop:16, background:"rgba(13,20,35,0.9)", border:"1px solid rgba(255,107,35,0.2)", padding:"20px" }}>
                <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:14, fontWeight:700, letterSpacing:1, marginBottom:14 }}>📧 운영자 직접 문의</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <input className="form-input" placeholder="닉네임 또는 이름" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                  <input className="form-input" type="email" placeholder="답변받을 이메일" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
                  <textarea className="form-input" placeholder="문의 내용을 자세히 적어주세요." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{ resize:"vertical", minHeight:100 }} />
                  <button onClick={handleEmail} style={{ background:"linear-gradient(135deg,#ff6b23,#ff8c42)", border:"none", color:"#fff", padding:"12px", fontFamily:"Rajdhani,sans-serif", fontSize:14, fontWeight:700, letterSpacing:1, cursor:"pointer", clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>문의 전송</button>
                </div>
              </div>
            )}
            {sent && (
              <div style={{ marginTop:16, background:"rgba(76,175,80,0.08)", border:"1px solid rgba(76,175,80,0.25)", padding:"16px 20px", textAlign:"center" }}>
                <div style={{ fontSize:13, color:"#4caf50", fontFamily:"Noto Sans KR,sans-serif" }}>✅ 이메일 앱이 열렸다면 전송 버튼을 눌러주세요. 빠르게 답변드릴게요!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
