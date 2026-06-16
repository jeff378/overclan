-- 대댓글(1단계 답글) — 댓글에 parent_comment_id 추가
-- free/patch/replay 게시판 (notice는 댓글 없음). Supabase SQL 에디터에서 1회 실행.

alter table free_comments   add column if not exists parent_comment_id uuid references free_comments(id) on delete cascade;
alter table patch_comments  add column if not exists parent_comment_id uuid references patch_comments(id) on delete cascade;
alter table replay_comments add column if not exists parent_comment_id uuid references replay_comments(id) on delete cascade;

create index if not exists free_comments_parent_idx   on free_comments (parent_comment_id);
create index if not exists patch_comments_parent_idx  on patch_comments (parent_comment_id);
create index if not exists replay_comments_parent_idx on replay_comments (parent_comment_id);
