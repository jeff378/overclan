-- ============================================================
-- 자유게시판 (free_posts / free_comments)
-- Supabase SQL 에디터에서 실행하세요.
-- ============================================================

create table if not exists free_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  content    text not null,
  category   text not null default '잡담',
  created_at timestamptz not null default now()
);
alter table free_posts enable row level security;
drop policy if exists free_posts_select on free_posts;
create policy free_posts_select on free_posts for select using (true);
drop policy if exists free_posts_insert on free_posts;
create policy free_posts_insert on free_posts for insert with check (auth.uid() = user_id);
drop policy if exists free_posts_update_own on free_posts;
create policy free_posts_update_own on free_posts for update using (auth.uid() = user_id);
drop policy if exists free_posts_delete_own on free_posts;
create policy free_posts_delete_own on free_posts for delete using (auth.uid() = user_id);

create table if not exists free_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references free_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
alter table free_comments enable row level security;
drop policy if exists free_comments_select on free_comments;
create policy free_comments_select on free_comments for select using (true);
drop policy if exists free_comments_insert on free_comments;
create policy free_comments_insert on free_comments for insert with check (auth.uid() = user_id);
drop policy if exists free_comments_delete_own on free_comments;
create policy free_comments_delete_own on free_comments for delete using (auth.uid() = user_id);
