import { supabase } from "./supabase";

/**
 * 특정 테이블 컬럼에 같은 값(대소문자 무시)이 이미 있는지 확인.
 * excludeId가 주어지면 그 행(본인)은 제외.
 */
export async function isValueTaken(
  table: string,
  column: string,
  value: string,
  excludeId?: string
): Promise<boolean> {
  const v = (value || "").trim();
  if (!v) return false;
  try {
    let q = supabase.from(table).select("id").ilike(column, v).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q;
    return !!(data && data.length > 0);
  } catch {
    return false; // 조회 실패 시 막지 않음 (DB unique 제약이 최종 방어)
  }
}
