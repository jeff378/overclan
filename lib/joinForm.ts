// 클랜 가입 신청 양식 정의 (기본 양식 + 클랜장 커스텀)
// clans.join_form (jsonb)에 필드 배열이 저장됨. 없으면 DEFAULT_JOIN_FIELDS 사용.

export type JoinFieldType = "text" | "textarea" | "position" | "tier" | "yesno" | "playtime";

export interface JoinField {
  key: string;
  label: string;
  type: JoinFieldType;
  required: boolean;
  locked?: boolean;  // 끄거나 필수 해제 불가 (배틀태그 — claim 매칭에 쓰임)
  enabled?: boolean; // 양식에 표시 여부 (기본 필드 끄기용)
}

// 신청자가 작성한 답변 1건 (양식이 바뀌어도 신청 당시 라벨이 보존되도록 함께 저장)
export interface JoinAnswer {
  key: string;
  label: string;
  value: string;
}

export const DEFAULT_JOIN_FIELDS: JoinField[] = [
  { key: "battletag", label: "배틀태그", type: "text", required: true, locked: true, enabled: true },
  { key: "position", label: "주 포지션", type: "position", required: true, enabled: true },
  { key: "tier", label: "주 포지션 경쟁전 티어", type: "tier", required: true, enabled: true },
  { key: "playtime", label: "주 활동 시간대", type: "playtime", required: false, enabled: true },
  { key: "intro", label: "가입 한마디 / 각오", type: "textarea", required: false, enabled: true },
];

export const JOIN_TIERS = ["브론즈", "실버", "골드", "플래티넘", "다이아", "마스터", "그랜드마스터", "챔피언"];
export const JOIN_POSITIONS = ["탱커", "딜러", "힐러"];
export const JOIN_TIMES = ["낮", "저녁", "밤", "새벽", "주말"];

// 클랜의 양식 정의를 해석 (커스텀 없으면 기본 양식)
export function resolveJoinFields(clan: any): JoinField[] {
  const f = clan?.join_form;
  if (Array.isArray(f) && f.length > 0) {
    const valid = f.filter((x: any) => x && x.key && x.label && x.type);
    if (valid.length > 0) return valid;
  }
  return DEFAULT_JOIN_FIELDS;
}

// 신청 폼에 실제로 보여줄 필드 (enabled !== false)
export function visibleJoinFields(clan: any): JoinField[] {
  return resolveJoinFields(clan).filter((f) => f.enabled !== false);
}
