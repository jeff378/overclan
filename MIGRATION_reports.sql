-- 신고(reports) 테이블 — 글/댓글/유저/채팅 신고 접수
-- Supabase SQL 에디터에서 1회 실행.

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,                 -- 'post' | 'comment' | 'user' | 'chat' | 'clan'
  target_id text not null,
  target_board text,                         -- free | patch | replay | notice (post/comment일 때)
  category text,                             -- 욕설/괴롭힘 · 허위·명예훼손 · 도배·광고 · 개인정보 · 사칭 · 기타
  reason text,
  status text not null default '접수',        -- 접수 | 검토 | 처리완료
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

-- 로그인 유저는 본인 명의로만 신고 생성
drop policy if exists "reports insert authed" on reports;
create policy "reports insert authed" on reports
  for insert to authenticated with check (auth.uid() = reporter_id);

-- 본인이 낸 신고만 조회 (운영자 조회는 대시보드/서비스 롤)
drop policy if exists "reports select own" on reports;
create policy "reports select own" on reports
  for select to authenticated using (auth.uid() = reporter_id);

create index if not exists reports_target_idx on reports (target_type, target_id);
create index if not exists reports_status_idx on reports (status);
