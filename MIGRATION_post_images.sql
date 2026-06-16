-- 게시판/공지 글 이미지(대표 이미지 1장) 지원
-- ⚠️ 코드 배포 '전 또는 직후'에 실행하세요. (이미지 첨부 글이 image_url 컬럼 없으면 저장 실패)
-- Supabase SQL 에디터에서 1회 실행.

-- 1) 글 테이블에 image_url 컬럼
alter table free_posts   add column if not exists image_url text;
alter table patch_posts  add column if not exists image_url text;
alter table replay_posts add column if not exists image_url text;
alter table site_notices add column if not exists image_url text;

-- 2) 이미지 저장 버킷 (공개 읽기 / 로그인 업로드)
insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

drop policy if exists "post-images authed upload" on storage.objects;
create policy "post-images authed upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'post-images');

drop policy if exists "post-images public read" on storage.objects;
create policy "post-images public read" on storage.objects
  for select using (bucket_id = 'post-images');
