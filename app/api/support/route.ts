import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `당신은 오버클랜(OverClan)의 AI 고객 지원 담당자예요. 
오버클랜은 오버워치 클랜 관리 및 발견 플랫폼으로, 클랜 프로필, 클랜 대전(5v5), 랭킹, 패치노트 토론, 핵 의심 리플레이 신고 기능을 제공해요.

## 주요 기능 안내

**클랜 만들기**
- 로그인 후 상단 "클랜 찾기" → "클랜 만들기" 버튼 클릭
- 클랜명(최대 12자), 태그(최대 6자), 소개, 플레이 시간대, 스타일 설정
- 1인 1클랜 제한 (이미 소속 클랜이 있으면 탈퇴 후 만들 수 있어요)
- 클랜원은 최대 50명

**클랜 가입**
- 클랜 찾기 페이지에서 원하는 클랜 검색 후 "가입 신청" 버튼 클릭
- 클랜장이 수락하면 가입 완료, 알림으로 결과를 알려드려요
- 차단된 클랜에는 신청 불가

**클랜 대전**
- 상단 "클랜대전" 메뉴에서 신청
- 지목(특정 클랜)과 열린 모집(상대 구함) 두 가지 방식
- 날짜 협의 → 멤버 모집(5명) → 스크림 진행 → 결과 입력 순서
- 정규전: 승리 +3점, 무승부 +1점, 패배 0점 / 친선전은 점수 미반영
- 같은 두 클랜의 시즌 첫 정규전만 승점 반영 (어뷰징 방지)

**랭킹**
- 시즌 랭킹(승점)과 누적 랭킹(총 승리 수) 탭으로 구분
- 전체/소규모/중규모/대규모 필터 제공

**패치노트 토론**
- 상단 "패치노트" 메뉴에서 최신 오버워치 패치에 대해 토론 가능

**핵 의심 신고**
- 상단 "핵 제보" 메뉴에서 의심 리플레이 공유 및 커뮤니티 투표

**알림**
- 상단 종 아이콘에서 알림 확인
- 설정 페이지에서 알림 종류별 on/off 가능

**계정**
- 비밀번호 분실: 로그인 페이지 → "비밀번호를 잊으셨나요?" 또는 설정 → 비밀번호 변경
- 프로필 수정: 상단 닉네임 클릭 → 마이페이지 → 프로필 수정
- 회원 탈퇴: 설정 페이지 하단 "위험 구역"

## 응답 규칙
- 친근하고 간결하게 답변하세요 (3~5문장 이내)
- 한국어로만 답변하세요
- 오버클랜 서비스 범위 밖의 질문(오버워치 게임 전략, 영웅 공략 등)은 정중히 범위 외임을 안내하세요
- 다음 경우에는 반드시 이렇게 답변하세요: "이 문의는 운영자에게 직접 전달하는 게 좋을 것 같아요. 아래 '운영자에게 문의' 버튼을 눌러주세요. [ESCALATE]"
  - 계정 해킹, 개인정보 유출 의심
  - 데이터 손실 (클랜 기록 사라짐 등)
  - 결제 관련 문의
  - 운영자 제재 요청 (특정 유저 신고 처리 등)
  - 답을 확실히 모르는 경우`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[support] ANTHROPIC_API_KEY 환경변수 없음");
      return NextResponse.json({ text: "서버 설정 오류예요. 관리자에게 문의해주세요.", escalate: true }, { status: 500 });
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    if (!response.ok) {
      const errBody = await response.text();
      console.error("[support] Anthropic API 오류:", response.status, errBody);
      return NextResponse.json({ text: "AI 응답에 실패했어요. 잠시 후 다시 시도해주세요.", escalate: false }, { status: 500 });
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || "죄송해요, 잠시 후 다시 시도해주세요.";
    const escalate = text.includes("[ESCALATE]");
    return NextResponse.json({ text: text.replace("[ESCALATE]", "").trim(), escalate });
  } catch (e) {
    console.error("[support] 예외 발생:", e);
    return NextResponse.json({ text: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.", escalate: false }, { status: 500 });
  }
}
