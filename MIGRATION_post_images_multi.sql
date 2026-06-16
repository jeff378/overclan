-- 게시판/공지 글 여러 장 이미지 (image_urls 배열)
-- 기존 image_url(단일)은 하위호환용으로 유지, 신규 글은 image_urls 사용.
-- Supabase SQL 에디터에서 1회 실행. (post-images 버킷은 MIGRATION_post_images.sql에서 이미 생성)

alter table free_posts   add column if not exists image_urls text[];
alter table patch_posts  add column if not exists image_urls text[];
alter table replay_posts add column if not exists image_urls text[];
alter table site_notices add column if not exists image_urls text[];
