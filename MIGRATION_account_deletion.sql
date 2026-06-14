-- ============================================================
-- 회원 탈퇴 RPC 함수 (SECURITY DEFINER)
-- 클라이언트에서는 auth.users를 직접 삭제할 수 없으므로
-- 권한 상승된 함수로 본인 계정과 관련 데이터를 모두 정리한다.
--
-- 클랜장 위임은 클라이언트에서 owner_id를 미리 변경해두므로,
-- 이 함수 실행 시점에 owner_id = 본인인 클랜은 "삭제 대상"이다.
-- (위임된 클랜은 owner_id가 바뀌어 루프에 걸리지 않아 유지된다)
-- ============================================================

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  owned_clan uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- 1) 본인이 아직 클랜장인(위임 안 된) 클랜들: 관련 데이터까지 정리 후 삭제
  for owned_clan in select id from clans where owner_id = uid loop
    delete from battle_volunteers where battle_id in (
      select id from clan_battles where clan1_id = owned_clan or clan2_id = owned_clan
    );
    delete from battle_applicants where battle_id in (
      select id from clan_battles where clan1_id = owned_clan or clan2_id = owned_clan
    );
    delete from clan_battles where clan1_id = owned_clan or clan2_id = owned_clan;
    delete from clan_chats where clan_id = owned_clan;
    delete from clan_notices where clan_id = owned_clan;
    delete from clan_requests where clan_id = owned_clan;
    delete from clan_members where clan_id = owned_clan;
    delete from clans where id = owned_clan;
  end loop;

  -- 2) 가입했던 다른 클랜에서 탈퇴 / 본인이 남긴 흔적 정리
  delete from battle_volunteers where user_id = uid;
  delete from clan_requests where user_id = uid;
  delete from clan_members where user_id = uid;
  delete from notifications where user_id = uid;

  -- 3) 프로필 삭제
  delete from profiles where id = uid;

  -- 4) 인증 계정 삭제 (이후 같은 이메일로 재가입 가능)
  delete from auth.users where id = uid;
end;
$$;

-- 로그인한 사용자가 자신의 계정만 삭제하도록 실행 권한 부여
grant execute on function delete_my_account() to authenticated;
