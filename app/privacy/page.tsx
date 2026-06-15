import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } h2 { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #ff6b23; margin: 28px 0 12px; } p, li { font-size: 14px; color: #8892a4; font-family: 'Noto Sans KR', sans-serif; line-height: 1.9; font-weight: 300; } ul { padding-left: 20px; }`}</style>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>개인정보처리방침</h1>
        </div>
        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.1)", padding: "36px 40px" }}>
          <p>시행일: 2025년 6월 1일</p>
          <h2>1. 수집하는 개인정보</h2>
          <ul>
            <li>이메일 주소 (회원가입 시)</li>
            <li>닉네임 및 배틀태그 (이용자 직접 입력)</li>
            <li>게임 티어 및 역할군 정보 (이용자 직접 입력)</li>
          </ul>
          <h2>2. 개인정보 수집 목적</h2>
          <ul>
            <li>회원 식별 및 서비스 제공</li>
            <li>클랜 매칭 및 커뮤니티 기능 제공</li>
          </ul>
          <h2>3. 개인정보 보유 기간</h2>
          <p>회원 탈퇴 시 즉시 삭제합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
          <h2>4. 개인정보 제3자 제공</h2>
          <p>이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
          <h2>5. 개인정보 보호책임자</h2>
          <p>이메일: jujin2271@gmail.com</p>
          <h2>6. 권리 행사</h2>
          <p>이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 문의는 위 이메일로 연락해주세요.</p>
        </div>
      </div>
    </div>
  );
}
