-- 클랜 멤버 명단(미검증) + 배틀태그 claim 자동검증
-- clan_roster: 클랜장이 배틀태그로 미리 등록하는 '미검증' 멤버. profiles가 없으므로
--   기존 clan_members ⋈ profiles 기반 클랜티어/랭킹 계산에 자연히 안 잡힘(=조작 불가).
-- 유저가 본인 배틀태그로 가입(또는 프로필에 배틀태그 저장)하면 트리거가 자동으로
--   clan_members로 승격(검증 ✓) + roster에서 제거 → clan_members_tier 트리거가 클랜티어 재계산.
-- Supabase SQL 에디터에서 1회 실행.

create table if not exists clan_roster (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references clans(id) on delete cascade,
  battletag text not null,
  note text,
  created_at timestamptz default now(),
  unique (clan_id, battletag)
);

alter table clan_roster enable row level security;

-- 명단은 클랜 프로필에 공개 표시되므로 select 공개
drop policy if exists "roster_select_all" on clan_roster;
create policy "roster_select_all" on clan_roster for select using (true);

-- 등록/삭제는 해당 클랜장만
drop policy if exists "roster_insert_owner" on clan_roster;
create policy "roster_insert_owner" on clan_roster for insert
  with check (exists (select 1 from clans c where c.id = clan_id and c.owner_id = auth.uid()));
drop policy if exists "roster_delete_owner" on clan_roster;
create policy "roster_delete_owner" on clan_roster for delete
  using (exists (select 1 from clans c where c.id = clan_id and c.owner_id = auth.uid()));

-- claim 자동검증: 유저의 battletag가 등록/변경될 때 매칭되는 미검증 명단을 승격
create or replace function trg_claim_roster() returns trigger
language plpgsql security definer as $$
declare r record;
begin
  if new.battletag is null or new.battletag = '' then return new; end if;
  -- 이미 어느 클랜 소속이면 스킵 (1인 1클랜)
  if exists (select 1 from clan_members where user_id = new.id) then return new; end if;
  -- 같은 배틀태그로 등록된 미검증 명단 중 가장 먼저 등록된 것
  select * into r from clan_roster where battletag = new.battletag order by created_at limit 1;
  if not found then return new; end if;
  -- 정원(50) 체크
  if (select count(*) from clan_members where clan_id = r.clan_id) >= 50 then return new; end if;
  -- 검증 멤버로 승격 + 명단에서 제거
  insert into clan_members (clan_id, user_id, role) values (r.clan_id, new.id, '클랜원');
  delete from clan_roster where id = r.id;
  return new;
end; $$;

drop trigger if exists claim_roster_on_profile on profiles;
create trigger claim_roster_on_profile
  after insert or update of battletag on profiles
  for each row execute function trg_claim_roster();
