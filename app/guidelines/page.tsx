import Navbar from "../components/Navbar";

export default function GuidelinesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } h2 { font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #ff6b23; margin: 28px 0 12px; } p, li { font-size: 14px; color: #8892a4; font-family: 'Noto Sans KR', sans-serif; line-height: 1.9; font-weight: 300; } ul { padding-left: 20px; } b { color: #c8cad0; font-weight: 500; }`}</style>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
          <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>커뮤니티 가이드라인</h1>
        </div>
        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.1)", padding: "36px 40px" }}>
          <p>오버클랜은 오버워치 클랜원들이 서로를 존중하며 즐기는 공간입니다. 모두를 위해 아래 규칙을 지켜주세요.</p>

          <h2>이런 행동은 금지돼요</h2>
          <ul>
            <li><b>욕설·혐오·괴롭힘</b>: 특정인·집단을 향한 모욕, 차별, 지속적 괴롭힘</li>
            <li><b>허위 핵 제보·명예훼손</b>: 근거 없는 핵 의심 제보, 사실과 다른 비방. 핵 제보는 신중하게, 리플레이 등 근거와 함께</li>
            <li><b>도배·광고·스팸</b>: 동일 글 반복, 무관한 외부 홍보</li>
            <li><b>개인정보 노출</b>: 본인·타인의 실명·연락처·주소 등 게시</li>
            <li><b>사칭·부정 이용</b>: 운영자/타인 사칭, 어뷰징, 시스템 악용</li>
          </ul>

          <h2>신고 방법</h2>
          <p>게시글·댓글·이용자에서 <b>신고</b> 버튼을 누르면 운영자에게 접수됩니다. 긴급하거나 별도 사안은 <a href="/contact" style={{ color: "#ff8c42" }}>문의 페이지</a>로 알려주세요. 허위·악의적 신고도 제재 대상입니다.</p>

          <h2>제재</h2>
          <p>위반 시 사안에 따라 <b>경고 → 콘텐츠 삭제 → 일시 정지 → 영구 정지</b>가 적용될 수 있습니다. 심각한 위반(괴롭힘, 개인정보 노출 등)은 즉시 정지될 수 있어요.</p>

          <h2>핵 제보 유의사항</h2>
          <p>핵 제보는 커뮤니티 투표로 의견을 모으는 기능이며, 블리자드의 공식 제재가 아닙니다. 확정적 단정·신상 공개는 명예훼손이 될 수 있으니 삼가주세요.</p>
        </div>
      </div>
    </div>
  );
}
