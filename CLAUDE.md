# CLAUDE.md — 오버클랜(OverClan) 프로젝트 작업 지침

> Claude Code가 이 폴더에서 작업을 시작할 때 자동으로 읽는 핵심 문서.
> 상세 맥락은 `SESSION_2026-06-15_design.md`, `overclan-context-v5.md` 참고.

@AGENTS.md

---

## 프로젝트 한 줄 요약
오버워치 클랜을 **찾고·만들고·꾸미는** 비공식 팬 플랫폼 (PWA). 디스코드와 상호보완 (오버클랜=클랜 발견/프로필/전적, 디스코드=실시간 소통).

## 기본 정보
- **URL**: https://overclan.vercel.app
- **GitHub**: https://github.com/jeff378/overclan (public)
- **Supabase ID**: awnixrwkobaghowdcvkv
- **스택**: Next.js(App Router) + Supabase + PostgreSQL + Vercel
- **로컬 경로**: C:\Users\user\overclan
- **관리자 이메일**: jujin2271@gmail.com (코드에 ADMIN_EMAIL 하드코딩)
- **개발자**: 주진 / GitHub jeff378 / 배틀태그 제프카플란#3776 (그마 탱·힐 / 마스터 딜)

## 협업 방식
- 주진님 = 기획/방향/미적·전략 판단 / Claude = 코딩·배포·자가검증
- **실행 요청**(만들어줘/수정해줘) → 바로 실행
- **사고·판단 요청**(어떻게 할까/고민이야) → 소크라테스 모드(질문 1개씩, 스스로 결론 유도), "정리해줘/결론내줘" 하면 종료하고 정리
- 존댓말 사용
- 주진님은 자율적으로 문제를 찾아 수정하는 것을 선호

## 배포 워크플로우 (중요)
1. 코드 수정
2. `npm run build`로 타입/문법 에러 사전 검증 (필수)
3. `git add . && git commit -m "메시지" && git push`
4. Vercel 자동 배포 (CDN 전파 1~2분)
- ⚠️ Vercel 환경변수 변경 후엔 반드시 Redeploy (자동 안 됨)
- ⚠️ API 키는 절대 public 레포에 커밋 금지 → Vercel 환경변수로만

## 자가 검증 워크플로우 (Claude Code 전용)
- 코드 수정 후 **Claude Preview**(`mcp__Claude_Preview__*`)로 직접 띄워 확인:
  `preview_start`(서버) → `preview_screenshot`(화면) → `preview_click`/`preview_fill`(상호작용)
- ⚠️ 인트로 오버레이가 먼저 뜸 → SKIP 버튼(`#oc-skip`) 클릭해야 실제 페이지 보임
- 명백한 버그/깨짐은 스스로 수정. 미적·전략 판단은 주진님께 A/B 후보로 질문.

## 디자인 시스템
- 배경 `#080c14`, 포인트 `#ff6b23`
- 폰트: **Cinzel**(영문/숫자/제목/로고) + Rajdhani(폴백) + Noto Sans KR(한글)
  - 전역 패턴: `fontFamily: "'Cinzel', 'Rajdhani', sans-serif"`
  - ⚠️ 한글 본문용 `"'Rajdhani', 'Noto Sans KR', sans-serif"`는 건드리지 말 것 (Cinzel은 한글 미지원)
  - layout.tsx에서 전역 로드
- 버튼 clip-path: `polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)`
- 카드 clip-path: `polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))`
- 빈 상태/로딩: 0 대신 "—" 또는 "LOADING..." (깜빡임 방지)
- 클랜별 accent_color로 프로필 물듦
- **디자인 지향**: 살아있는 배경(파티클/글로우) + 호버 인터랙션 + 시네마틱 몰입감
- **콜드스타트 원칙**: 빈 자리는 "비었다"가 아니라 "도전장"으로 (랭킹 왕좌 = THE THRONE AWAITS 참고)
- ⚠️ god ray(회전 conic-gradient)는 싸 보임 → 자제. 맥동 스포트라이트 선호.

## 흔한 함정 (학습됨)
- **setLoading(false) 누락** → 무한 LOADING. 모든 fetch useEffect에서 확인.
- **쿠키로 인증 체크 금지**: `document.cookie.includes("sb-")` 부정확. 페이지 자체 `getUser()`에 위임.
- **PostgREST 조인은 FK 필요**: `profiles(nickname)` 조인이 FK 없으면 조용히 빈 배열 → 개별 조회로 대체.
- **RLS 누락 = 조용한 실패**: insert가 막혀도 에러 없이 넘어감. 모든 쓰기에 error 핸들링.
- **.jsx에 TypeScript 문법 금지**: `(c: any)` 쓰면 Turbopack 파싱 에러 → .tsx로 바꾸거나 타입 제거.
- RLS 정책은 Supabase SQL 에디터에서 수동 추가 (Claude가 SQL 제공, 주진님 실행).

## 핵심 기능 (완성됨)
인증(회원가입 역할군/티어), 클랜 CRUD(유튜브식 프로필), 클랜 찾기(필터), 클랜대전 5v5, 랭킹(시즌 왕좌+누적), 패치노트/리플레이/공지 게시판, 알림 시스템(종+실시간), 클랜 채팅, 차단/탈퇴, 설정, SEO, PWA, 문의(AI 응답)

## 현재 단계 & 방향
- **콜드스타트** (클랜 2개, 클랜원 소수) — 디자인 리뉴얼로 첫인상 강화 중
- **진행 중 대전환**: 개발 워크플로우를 Claude Code 자율 시스템으로 이전 중
  - [완료] Claude Preview 자가검증 / [다음] 텔레그램 보고 봇 → 자동 루프 → 역할분리 → 템플릿화
  - 최종 목표: 재사용 가능한 자율 개발 시스템 (이후 자동매매/그로브/로블록스에 재활용)
- 수익화(프리미엄+토스페이먼츠), 앱스토어는 유저 검증 후로 미룸
