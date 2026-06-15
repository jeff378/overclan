import Navbar from "../components/Navbar";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } h2 { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #ff6b23; margin: 28px 0 12px; } p, li { font-size: 14px; color: #8892a4; font-family: 'Noto Sans KR', sans-serif; line-height: 1.9; font-weight: 300; } ul { padding-left: 20px; }`}</style>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>이용약관</h1>
        </div>
        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.1)", padding: "36px 40px" }}>
          <p>시행일: 2025년 6월 1일</p>
          <h2>제1조 (목적)</h2>
          <p>본 약관은 오버클랜(이하 "서비스")이 제공하는 오버워치 클랜 플랫폼 서비스의 이용 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          <h2>제2조 (정의)</h2>
          <ul>
            <li>"서비스"란 오버클랜이 제공하는 웹 기반 클랜 플랫폼을 의미합니다.</li>
            <li>"이용자"란 본 약관에 따라 서비스를 이용하는 회원을 말합니다.</li>
            <li>"클랜"이란 이용자들이 서비스 내에서 생성하는 게임 그룹을 의미합니다.</li>
          </ul>
          <h2>제3조 (서비스 이용)</h2>
          <ul>
            <li>서비스는 오버워치 플레이어를 위한 클랜 매칭 및 커뮤니티 플랫폼입니다.</li>
            <li>이용자는 하나의 클랜에만 가입할 수 있습니다.</li>
            <li>클랜은 1인 1개만 생성할 수 있습니다.</li>
          </ul>
          <h2>제4조 (금지 행위)</h2>
          <ul>
            <li>타인을 비방하거나 욕설, 혐오 발언을 사용하는 행위</li>
            <li>허위 정보를 게시하거나 다른 이용자를 기만하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>저작권 등 타인의 권리를 침해하는 행위</li>
          </ul>
          <h2>제5조 (면책조항)</h2>
          <p>오버클랜은 블리자드 엔터테인먼트의 공식 서비스가 아닌 비공식 팬 플랫폼입니다. 서비스 이용 중 발생하는 클랜원 간의 분쟁에 대해 운영자는 책임을 지지 않습니다.</p>
          <h2>제6조 (약관 변경)</h2>
          <p>운영자는 필요한 경우 약관을 변경할 수 있으며, 변경 시 서비스 내 공지사항을 통해 안내합니다.</p>
        </div>
      </div>
    </div>
  );
}
