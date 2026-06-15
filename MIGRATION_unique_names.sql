-- ============================================================
-- 중복 불가: 닉네임 / 클랜명 / 클랜 태그 (대소문자 무시)
-- Supabase SQL 에디터에서 실행하세요.
-- (기존 중복 데이터 없음을 확인함 — 바로 적용 가능)
-- ============================================================

create unique index if not exists profiles_nickname_unique
  on profiles (lower(nickname));

create unique index if not exists clans_name_unique
  on clans (lower(name));

create unique index if not exists clans_tag_unique
  on clans (lower(tag));
