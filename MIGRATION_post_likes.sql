-- ============================================================
-- 글 추천(좋아요) 기능 — 패치노트 토론장 / 핵 제보 / 공지사항 공통
-- Supabase SQL 에디터에서 실행하세요.
-- ============================================================

create table if not exists post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_type  text not null check (post_type in ('patch', 'replay', 'notice')),
  post_id    uuid not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_type, post_id, user_id)
);

create index if not exists idx_post_likes_post on post_likes (post_type, post_id);

alter table post_likes enable row level security;

-- 추천 수는 누구나 조회 가능
drop policy if exists "post_likes_select_all" on post_likes;
create policy "post_likes_select_all" on post_likes
  for select using (true);

-- 본인 추천만 추가 가능
drop policy if exists "post_likes_insert_own" on post_likes;
create policy "post_likes_insert_own" on post_likes
  for insert with check (auth.uid() = user_id);

-- 본인 추천만 취소 가능
drop policy if exists "post_likes_delete_own" on post_likes;
create policy "post_likes_delete_own" on post_likes
  for delete using (auth.uid() = user_id);
