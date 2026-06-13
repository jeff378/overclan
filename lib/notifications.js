import { supabase } from "./supabase";

// 알림 타입별 → 프로필의 설정 컬럼 매핑
const SETTING_COLUMN = {
  clan_request: "notify_clan_request",
  battle_request: "notify_battle_request",
  comment: "notify_comment",
  event: "notify_event",
  // 아래는 항상 보냄(본인 관련 중요 알림이라 설정과 무관)
  clan_accepted: null,
  clan_rejected: null,
  battle_result: null,
  battle_accepted: null,
};

/**
 * 알림 생성. 받는 사람의 알림 설정을 확인해 꺼져 있으면 보내지 않음.
 * @param {string} userId - 받을 사람 user_id
 * @param {string} type - 알림 타입
 * @param {string} title - 제목
 * @param {string} message - 내용(선택)
 * @param {string} link - 클릭 시 이동 경로(선택)
 */
export async function createNotification(userId, type, title, message = "", link = "") {
  if (!userId) return;
  try {
    // 설정 확인이 필요한 타입이면 받는 사람 설정 조회
    const settingCol = SETTING_COLUMN[type];
    if (settingCol) {
      const { data: prof } = await supabase
        .from("profiles")
        .select(settingCol)
        .eq("id", userId)
        .single();
      // 설정이 명시적으로 false면 알림 생성 안 함
      if (prof && prof[settingCol] === false) return;
    }
    await supabase.from("notifications").insert({
      user_id: userId, type, title, message, link,
    });
  } catch (e) {
    // 알림 실패가 본 작업을 막으면 안 되므로 조용히 무시
    console.error("notification error", e);
  }
}

// 읽지 않은 알림 개수
export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("is_read", false);
  return data?.length || 0;
}

// 알림 목록 (최근 30개)
export async function getNotifications(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  return data || [];
}

// 모두 읽음 처리
export async function markAllRead(userId) {
  if (!userId) return;
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

// 단일 읽음 처리
export async function markRead(notificationId) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
}

// 이벤트 알림을 전체 유저에게 발송 (관리자 공지용)
export async function createEventNotificationForAll(title, message = "", link = "") {
  try {
    const { data: users } = await supabase.from("profiles").select("id, notify_event");
    if (!users) return;
    const rows = users
      .filter(u => u.notify_event !== false)
      .map(u => ({ user_id: u.id, type: "event", title, message, link }));
    // 한 번에 너무 많으면 나눠서 insert (500개씩)
    for (let i = 0; i < rows.length; i += 500) {
      await supabase.from("notifications").insert(rows.slice(i, i + 500));
    }
  } catch (e) {
    console.error("event notification error", e);
  }
}
