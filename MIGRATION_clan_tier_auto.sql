-- 클랜 전력 티어 자동 계산 (수동 설정 폐지)
-- clans.tier 를 클랜원 실제 티어로 자동 산출 → clan_members 가입/탈퇴, profiles 티어 변경 시 재계산.
-- ⚠️ 공식은 lib/clanTier.ts 의 computeClanTier 와 동일하게 유지할 것:
--    멤버 점수 = 역할별 티어 중 최고 / 클랜 점수 = 평균 − 0.15 × (최고 − 최저)
-- Supabase SQL 에디터에서 1회 실행.

-- 1. 티어 문자열 → 점수(1~8)
create or replace function oc_tier_score(t text) returns int language sql immutable as $$
  select case t
    when '브론즈' then 1 when '실버' then 2 when '골드' then 3 when '플래티넘' then 4
    when '다이아' then 5 when '마스터' then 6 when '그랜드마스터' then 7 when '챔피언' then 8
    else null end;
$$;

-- 2. 점수 → 티어 문자열 (반올림·1~8 클램프)
create or replace function oc_score_to_tier(s numeric) returns text language sql immutable as $$
  select case least(8, greatest(1, round(s)::int))
    when 1 then '브론즈' when 2 then '실버' when 3 then '골드' when 4 then '플래티넘'
    when 5 then '다이아' when 6 then '마스터' when 7 then '그랜드마스터' when 8 then '챔피언'
  end;
$$;

-- 3. 클랜 전력 재계산: 멤버별 최고 역할티어 → 평균 − 0.15×(최고−최저)
create or replace function recompute_clan_tier(target_clan uuid)
returns void language plpgsql security definer as $$
declare v_avg numeric; v_max int; v_min int; v_cnt int;
begin
  with member_best as (
    select greatest(
      coalesce(oc_tier_score(p.tier_tank), 0),
      coalesce(oc_tier_score(p.tier_dps), 0),
      coalesce(oc_tier_score(p.tier_support), 0)) as best
    from clan_members cm join profiles p on p.id = cm.user_id
    where cm.clan_id = target_clan
  ), filtered as (select best from member_best where best > 0)
  select avg(best), max(best), min(best), count(*) into v_avg, v_max, v_min, v_cnt from filtered;
  if v_cnt is null or v_cnt = 0 then return; end if;  -- 입력 멤버 없으면 기존 값 유지
  update clans set tier = oc_score_to_tier(v_avg - (v_max - v_min) * 0.15) where id = target_clan;
end; $$;

-- 4. 트리거 함수
create or replace function trg_clan_members_tier() returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then perform recompute_clan_tier(old.clan_id); return old; end if;
  perform recompute_clan_tier(new.clan_id); return new;
end; $$;

create or replace function trg_profile_tier() returns trigger language plpgsql as $$
declare c record;
begin
  for c in select clan_id from clan_members where user_id = new.id loop
    perform recompute_clan_tier(c.clan_id);
  end loop;
  return new;
end; $$;

-- 5. 트리거 연결
drop trigger if exists clan_members_tier on clan_members;
create trigger clan_members_tier after insert or delete on clan_members
  for each row execute function trg_clan_members_tier();

drop trigger if exists profile_tier on profiles;
create trigger profile_tier after update of tier_tank, tier_dps, tier_support on profiles
  for each row execute function trg_profile_tier();

-- 6. 입력 멤버 없는 클랜 대비 NULL 허용 + 기존 클랜 일괄 재계산(백필)
alter table clans alter column tier drop not null;
do $$ declare r record; begin
  for r in select id from clans loop perform recompute_clan_tier(r.id); end loop;
end $$;
