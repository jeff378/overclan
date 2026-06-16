import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } h2 { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #ff6b23; margin: 28px 0 12px; } p, li, td, th { font-size: 14px; color: #8892a4; font-family: 'Noto Sans KR', sans-serif; line-height: 1.9; font-weight: 300; } ul { padding-left: 20px; } table { width: 100%; border-collapse: collapse; margin: 8px 0; } th, td { border: 1px solid rgba(255,107,35,0.15); padding: 8px 10px; text-align: left; vertical-align: top; } th { color: #c8cad0; font-weight: 500; }`}</style>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>개인정보처리방침</h1>
        </div>
        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.1)", padding: "36px 40px" }}>
          <p>오버클랜(이하 "서비스")은 「개인정보 보호법」을 준수하며, 이용자의 개인정보를 다음과 같이 처리합니다.</p>
          <p>시행일: 2026년 6월 16일</p>

          <h2>1. 수집하는 개인정보 항목</h2>
          <ul>
            <li><b>회원가입 시(필수)</b>: 이메일 주소, 비밀번호(암호화 저장), 닉네임, 배틀태그</li>
            <li><b>선택 입력</b>: 게임 티어·역할군, 한줄소개, 대표 영웅, 클랜 프로필 정보</li>
            <li><b>자동 수집</b>: 접속 IP, 쿠키·세션 토큰, 서비스 이용 기록, 기기·브라우저 정보</li>
          </ul>

          <h2>2. 수집·이용 목적</h2>
          <ul>
            <li>회원 식별·인증 및 서비스 제공</li>
            <li>클랜 발견·매칭, 클랜대전, 랭킹, 커뮤니티(게시판·채팅) 기능 제공</li>
            <li>문의 응대 및 부정 이용 방지</li>
          </ul>

          <h2>3. 처리 위탁 및 국외 이전</h2>
          <p>서비스는 운영을 위해 아래 업체에 개인정보 처리를 위탁하며, 해당 업체의 서버는 국외(미국)에 위치합니다. 회원가입·서비스 이용 시 아래 국외 이전에 동의하는 것으로 봅니다.</p>
          <table>
            <thead><tr><th>수탁사</th><th>위탁 업무</th><th>이전 항목·국가</th></tr></thead>
            <tbody>
              <tr><td>Supabase, Inc.</td><td>데이터베이스·인증·파일 저장 호스팅</td><td>위 1항 전 항목 / 미국</td></tr>
              <tr><td>Vercel, Inc.</td><td>웹·서버리스 호스팅, 접속 로그</td><td>접속 IP·이용 기록 / 미국</td></tr>
              <tr><td>Anthropic, PBC</td><td>AI 문의 응답 처리</td><td>이용자가 문의창에 입력한 내용 / 미국</td></tr>
            </tbody>
          </table>
          <p>위탁 외의 목적으로 개인정보를 제3자에게 제공하지 않습니다.</p>

          <h2>4. 보유·이용 기간 및 파기</h2>
          <p>회원 탈퇴 시 수집한 개인정보를 지체 없이 파기합니다. 다만 관계 법령에서 보존을 요구하는 경우 해당 기간 동안 보관 후 파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제합니다.</p>

          <h2>5. 이용자의 권리</h2>
          <p>이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. 프로필 수정은 마이페이지에서, 계정·데이터 삭제는 설정 페이지의 회원 탈퇴로 직접 가능하며, 그 밖의 요청은 아래 책임자에게 연락해 주세요.</p>

          <h2>6. 안전성 확보 조치</h2>
          <p>비밀번호 암호화 저장, 접근 권한 통제(행 수준 보안), 전송 구간 암호화(HTTPS)를 적용합니다.</p>

          <h2>7. 쿠키·세션</h2>
          <p>로그인 유지를 위해 인증 세션 토큰을 사용합니다. 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 기능이 제한될 수 있습니다.</p>

          <h2>8. 개인정보 보호책임자</h2>
          <p>이메일: jujin2271@gmail.com</p>

          <h2>9. 고지의 의무</h2>
          <p>본 방침의 내용 추가·삭제·수정이 있을 경우 시행 전 서비스 공지를 통해 알립니다.</p>
        </div>
      </div>
    </div>
  );
}
