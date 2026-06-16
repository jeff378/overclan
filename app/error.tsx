"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: "75vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px", textAlign: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <div style={{ fontSize: 42, color: "#ff8c42" }}>⚠</div>
      <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 2, color: "#e8eaf0" }}>문제가 발생했어요</h1>
      <p style={{ fontSize: 14, color: "#8892a4", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.7, maxWidth: 380 }}>
        일시적인 오류일 수 있어요. 다시 시도하거나 잠시 후 새로고침해주세요.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={reset} style={{ background: "linear-gradient(135deg, #ff6b23, #ff8c42)", border: "none", color: "#fff", padding: "11px 26px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>다시 시도</button>
        <a href="/" style={{ background: "transparent", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "11px 26px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, textDecoration: "none", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>홈으로</a>
      </div>
    </div>
  );
}
