// 오버워치 역할군 — 가입/프로필 공용 (역할명 + profiles 티어 컬럼 키 + 아이콘/색)
export type Role = {
  key: string;
  tierKey: "tier_tank" | "tier_dps" | "tier_support";
  icon: string;
  color: string;
};

export const ROLES: Role[] = [
  { key: "탱커", tierKey: "tier_tank", icon: "🛡️", color: "#4fc3f7" },
  { key: "딜러", tierKey: "tier_dps", icon: "⚔️", color: "#ff6b23" },
  { key: "힐러", tierKey: "tier_support", icon: "💊", color: "#4caf50" },
];
