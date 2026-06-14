-- ============================================================
-- 설정 페이지 확장 마이그레이션
-- profiles에 공개 범위·언어 컬럼 추가
-- clans에 클랜 찾기 노출 여부 컬럼 추가
-- ============================================================

-- profiles 컬럼 추가
alter table profiles
  add column if not exists battletag_public boolean default true,
  add column if not exists activity_public  boolean default true,
  add column if not exists language         varchar(10) default 'ko';

-- clans 컬럼 추가 (클랜 찾기 숨기기)
alter table clans
  add column if not exists is_hidden boolean default false;
