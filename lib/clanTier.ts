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

export type Verdict = { label: string; color: string; diff: number };

const VERDICT_GOOD = "#4caf50"; // 우세
const VERDICT_EVEN = "#ff6b23"; // 호각 (포인트 컬러)
const VERDICT_BAD = "#ef5350"; // 열세

/**
 * "우리 vs 상대" 판정 칩. 두 티어 모두 있어야 산출, 아니면 null.
 * myTier 기준 — 양수 diff면 우리가 위.
 */
export function matchupVerdict(myTier?: string | null, oppTier?: string | null): Verdict | null {
  const a = tierScore(myTier);
  const b = tierScore(oppTier);
  if (a == null || b == null) return null;
  const diff = a - b;
  if (diff >= 2) return { label: `▲ 우세 +${diff}단계`, color: VERDICT_GOOD, diff };
  if (diff === 1) return { label: "▲ 우세", color: VERDICT_GOOD, diff };
  if (diff === 0) return { label: "⚖ 호각", color: VERDICT_EVEN, diff };
  if (diff === -1) return { label: "▼ 열세", color: VERDICT_BAD, diff };
  return { label: `▼ 열세 ${-diff}단계`, color: VERDICT_BAD, diff };
}
