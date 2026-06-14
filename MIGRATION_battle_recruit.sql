-- ============================================================
-- 오버클랜 — 클랜대전 '열린 모집' + 신청 글 + 랭킹 점수 캡 마이그레이션
-- Supabase SQL 에디터에서 실행하세요.
-- ============================================================

-- 1) clan_battles 컬럼 추가 -----------------------------------
-- mode: '지목'(특정 클랜 지목) | '모집'(열린 모집 게시판)
alter table clan_battles add column if not exists mode text default '지목';
-- description: 대전 신청/모집 글 (양쪽 모드 공통)
alter table clan_battles add column if not exists description text;
-- 열린 모집용 희망 일정 (며칠 / 몇시~몇시)
alter table clan_battles add column if not exists recruit_date text;   -- 'YYYY-MM-DD'
alter table clan_battles add column if not exists recruit_start text;  -- 'HH:MM'
alter table clan_battles add column if not exists recruit_end text;    -- 'HH:MM'
-- points_counted: 이 정규전이 실제로 승점에 반영됐는지 (랭킹 점수 캡용)
alter table clan_battles add column if not exists points_counted boolean default true;

-- 열린 모집은 상대(clan2_id)가 아직 없으므로 NULL 허용
alter table clan_battles alter column clan2_id drop not null;

-- 2) battle_applicants (열린 모집 지원자) -----------------------
create table if not exists battle_applicants (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references clan_battles(id) on delete cascade,
  clan_id uuid references clans(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  message text,
  created_at timestamptz default now(),
  unique (battle_id, clan_id)
);

alter table battle_applicants enable row level security;

-- 읽기: 누구나
drop policy if exists "battle_applicants_select" on battle_applicants;
create policy "battle_applicants_select" on battle_applicants
  for select using (true);

-- 지원(insert): 본인만
drop policy if exists "battle_applicants_insert" on battle_applicants;
create policy "battle_applicants_insert" on battle_applicants
  for insert with check (auth.uid() = user_id);

-- 지원 취소(delete): 본인만
drop policy if exists "battle_applicants_delete" on battle_applicants;
create policy "battle_applicants_delete" on battle_applicants
  for delete using (auth.uid() = user_id);

-- 완료 ✅
