import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif", flexDirection: "column", gap: 24, textAlign: "center", padding: "0 24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400&display=swap');`}</style>
      <svg width="64" height="72" viewBox="0 0 32 36">
        <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5" strokeDasharray="4 2"/>
        <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.1)" stroke="rgba(255,107,35,0.4)" strokeWidth="1"/>
        <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="8" fontWeight="700" fontFamily="Rajdhani">?</text>
      </svg>
      <div>
        <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 72, fontWeight: 700, color: "#ff6b23", lineHeight: 1, letterSpacing: -2, opacity: 0.3 }}>404</div>
        <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#e8eaf0", marginTop: 8 }}>PAGE NOT FOUND</div>
        <p style={{ fontSize: 14, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, marginTop: 12, lineHeight: 1.7 }}>
          찾으시는 페이지가 존재하지 않거나<br/>이동되었을 수 있어요.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/" style={{ background: "linear-gradient(135deg, #ff6b23, #ff8c42)", color: "#fff", padding: "12px 28px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, textDecoration: "none", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>
          메인으로
        </Link>
        <Link href="/find" style={{ background: "transparent", border: "1px solid rgba(255,107,35,0.4)", color: "#ff6b23", padding: "11px 28px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, textDecoration: "none", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>
          클랜 찾기
        </Link>
      </div>
    </div>
  )
}
