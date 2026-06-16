-- 클랜 가입 신청 양식
-- clans.join_form: 클랜장이 편집한 양식 정의(JoinField[]). null이면 코드의 기본 양식 사용.
-- clan_requests.answers: 신청자가 작성한 답변(JoinAnswer[] = [{key,label,value}]).
-- Supabase SQL 에디터에서 1회 실행. (컬럼 추가만이므로 기존 RLS 영향 없음)

alter table clans add column if not exists join_form jsonb;
alter table clan_requests add column if not exists answers jsonb;
