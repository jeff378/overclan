-- ============================================================
-- 클랜 차단(영구 벤) 기능
-- 클랜장이 가입 신청을 거절하면서 차단하거나, 차단 목록에서 해제할 수 있다.
-- 차단된 유저는 해당 클랜에 재신청할 수 없다.
-- ============================================================

create table if not exists clan_bans (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid references clans(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(clan_id, user_id)
);

alter table clan_bans enable row level security;

-- 조회: 누구나 (가입 신청 시 본인이 차단됐는지 확인 / 클랜장이 목록 확인)
create policy "clan_bans_select" on clan_bans for select using (true);

-- 차단 추가: 해당 클랜의 클랜장만
create policy "clan_bans_insert" on clan_bans for insert with check (
  auth.uid() = (select owner_id from clans where id = clan_id));

-- 차단 해제: 해당 클랜의 클랜장만
create policy "clan_bans_delete" on clan_bans for delete using (
  auth.uid() = (select owner_id from clans where id = clan_id));
