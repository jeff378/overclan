// 전역 푸터 — 모든 페이지 하단(app/layout.tsx에서 렌더)
const FOOTER_LINKS = [
  { label: "이용약관", href: "/terms" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "커뮤니티 가이드라인", href: "/guidelines" },
  { label: "문의하기", href: "/contact" },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.6)", padding: "32px clamp(20px,5vw,48px) 40px", marginTop: 48 }}>
      <style>{`.oc-foot-link{color:#8892a4;text-decoration:none;transition:color .2s}.oc-foot-link:hover{color:#ff8c42}`}</style>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel','Rajdhani',sans-serif", fontWeight: 700, letterSpacing: 2, fontSize: 18, color: "#e8eaf0" }}>
            <span style={{ color: "#ff6b23" }}>OVER</span>CLAN
          </div>
          <p style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 8, lineHeight: 1.6, maxWidth: 320 }}>
            오버워치 클랜을 찾고·만들고·꾸미는 비공식 팬 플랫폼
          </p>
        </div>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", alignItems: "flex-start" }}>
          {FOOTER_LINKS.map(l => (
            <a key={l.href} href={l.href} className="oc-foot-link" style={{ fontSize: 13, letterSpacing: 0.5, fontFamily: "Noto Sans KR, sans-serif" }}>{l.label}</a>
          ))}
        </nav>
      </div>
      <div style={{ maxWidth: 1000, margin: "24px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ fontSize: 11, color: "#5a6478", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7 }}>
          © 2026 OVERCLAN · 비공식 팬 서비스<br />
          Overwatch™ 및 관련 자산은 Blizzard Entertainment, Inc.의 상표입니다. 오버클랜은 Blizzard와 무관한 비공식 팬 사이트입니다.
        </p>
      </div>
    </footer>
  );
}
