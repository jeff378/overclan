// 클랜 전력 점수 — 클랜원 실제 티어로 자동 계산 (수동 설정 폐지)
// ⚠️ 이 공식은 DB 트리거(recompute_clan_tier)와 반드시 동일하게 유지할 것.
//    멤버 점수 = 역할별 티어 중 최고값
//    클랜 점수 = 멤버 평균 − 0.15 × (최고멤버 − 최저멤버)   (약한 고리 소폭 반영)

export const TIER_ORDER = [
  "브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언",
] as const;

export type MemberTiers = {
  tier_tank?: string | null;
  tier_dps?: string | null;
  tier_support?: string | null;
};

/** 티어 문자열 → 점수(1~8). 미입력/미인식은 null. */
export function tierScore(t?: string | null): number | null {
  if (!t) return null;
  const i = TIER_ORDER.indexOf(t as (typeof TIER_ORDER)[number]);
  return i < 0 ? null : i + 1;
}

/** 점수 → 티어 문자열 (반올림·1~8 클램프). */
export function scoreToTier(s: number): string {
  const i = Math.min(8, Math.max(1, Math.round(s))) - 1;
  return TIER_ORDER[i];
}

/** 멤버 1명 점수 = 역할별 티어 중 최고. 입력한 티어가 없으면 null. */
export function memberScore(m: MemberTiers): number | null {
  const scores = [m.tier_tank, m.tier_dps, m.tier_support]
    .map(tierScore)
    .filter((x): x is number => x != null);
  return scores.length ? Math.max(...scores) : null;
}

/** 클랜 전력 티어. 티어 입력 멤버가 하나도 없으면 null. */
export function computeClanTier(members: MemberTiers[]): string | null {
  const scores = members
    .map(memberScore)
    .filter((x): x is number => x != null);
  if (!scores.length) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const spread = Math.max(...scores) - Math.min(...scores);
  return scoreToTier(avg - spread * 0.15);
}
