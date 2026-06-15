"use client";
import { useId } from "react";

// ─── 애니메이션 CSS (한 번만 주입) ───────────────────────────────────────────
const BADGE_CSS = `
  @keyframes badgePulse { 0%,100%{opacity:.3} 50%{opacity:var(--gmax,.6)} }
  .badge-glow { animation: badgePulse 2.6s ease-in-out infinite; transform-origin: center; will-change: opacity; }
  @keyframes badgeSpin { to{transform:rotate(360deg)} }
  .badge-aura { transform-box:fill-box; transform-origin:center; animation:badgeSpin 16s linear infinite; }
  .badge-aura-rev { transform-box:fill-box; transform-origin:center; animation:badgeSpin 22s linear infinite reverse; }
  @keyframes badgeScan { 0%{transform:translateY(-90px);opacity:0} 18%{opacity:.9} 50%{opacity:.9} 75%,100%{transform:translateY(120px);opacity:0} }
  .badge-scan { animation: badgeScan 5.5s ease-in-out infinite; will-change: transform,opacity; }
  @keyframes badgeSpark { 0%{transform:translateY(0);opacity:0} 15%{opacity:1} 100%{transform:translateY(-46px);opacity:0} }
  .badge-spark { animation: badgeSpark 2.8s ease-in-out infinite; will-change: transform,opacity; }
  @media (prefers-reduced-motion:reduce) {
    .badge-glow { animation:none; opacity:var(--gmax,.6); }
    .badge-aura,.badge-aura-rev,.badge-scan,.badge-spark { animation:none; }
    .badge-scan { opacity:0; }
  }
`;

// ─── 티어 데이터 ─────────────────────────────────────────────────────────────
export const TIER_DATA = [
  { key:"rookie", idx:0, name:"신생", en:"ROOKIE",   range:"1–5명",
    base:"#9AA6BC", light:"#E6ECF6", deep:"#3A414F", glow:"#AEB9D0", ink:"#262B35" },
  { key:"growth", idx:1, name:"성장", en:"RISING",   range:"6–15명",
    base:"#3E90FF", light:"#B6D6FF", deep:"#123A7A", glow:"#5AA4FF", ink:"#0A1E40" },
  { key:"elite",  idx:2, name:"정예", en:"ELITE",    range:"16–30명",
    base:"#B469FF", light:"#E3C6FF", deep:"#451A8C", glow:"#C788FF", ink:"#270D52" },
  { key:"strong", idx:3, name:"강호", en:"VANGUARD", range:"31–50명",
    base:"#FFB12E", light:"#FFE7AC", deep:"#7C4D06", glow:"#FFC659", ink:"#3A2602" },
  { key:"legend", idx:4, name:"전설", en:"LEGEND",   range:"51명+",
    base:"#FF5FB0", light:"#A6F0FF", deep:"#3A1466", glow:"#FF82C4", ink:"#1A0A30", holo:true },
];

const HOLO_STOPS = [
  ["0","#FF5FB0"],["0.25","#9B7BFF"],["0.5","#52E0FF"],
  ["0.72","#7DFFB0"],["0.88","#FFE066"],["1","#FF7AB8"],
];

// 멤버 수 → 티어 인덱스
export function getBadgeTier(memberCount) {
  if (memberCount >= 51) return 4;
  if (memberCount >= 31) return 3;
  if (memberCount >= 16) return 2;
  if (memberCount >= 6)  return 1;
  return 0;
}

// ─── 헥사곤 경로 ─────────────────────────────────────────────────────────────
const NEON_OUT  = "M100,22 L176,58 L176,136 L100,206 L24,136 L24,58 Z";
const NEON_VERTS = [[100,22],[176,58],[176,136],[100,206],[24,136],[24,58]];

// ─── 티어별 중앙 심볼 ────────────────────────────────────────────────────────
function NeonSymbol({ t, I }) {
  const c = t.base, l = t.light;
  switch (t.idx) {
    case 0: return (
      <g fill="none" stroke={l} strokeWidth="2.4" strokeLinejoin="round">
        <path d="M100,90 L116,110 L100,130 L84,110 Z" />
        <circle cx="100" cy="110" r="3" fill={l} stroke="none" />
      </g>
    );
    case 1: return (
      <g fill="none" stroke={l} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M82,114 L100,96 L118,114" />
        <path d="M82,130 L100,112 L118,130" opacity="0.6" />
      </g>
    );
    case 2: return (
      <g strokeLinejoin="round">
        <path d="M100,82 L122,106 L100,138 L78,106 Z" fill={t.deep} stroke={l} strokeWidth="2.2" />
        <path d="M100,82 L100,138 M78,106 L122,106 M88,94 L112,94" stroke={c} strokeWidth="1.4" opacity="0.85" />
        <path d="M100,82 L112,94 L100,106 L88,94 Z" fill={l} opacity="0.5" stroke="none" />
      </g>
    );
    case 3: return (
      <g strokeLinejoin="round">
        <path
          d="M100,80 C112,96 118,106 110,122 C118,118 120,110 119,104 C126,116 124,132 110,140 C104,144 96,144 90,140 C76,132 74,116 81,104 C80,110 82,118 90,122 C82,106 88,96 100,80 Z"
          fill={c} stroke={l} strokeWidth="1.6" opacity="0.96"
        />
        <path d="M100,102 C106,112 106,120 100,132 C94,120 94,112 100,102 Z" fill={t.light} opacity="0.8" stroke="none" />
      </g>
    );
    default: return (
      <g strokeLinejoin="round">
        <g stroke={l} strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
          <path d="M100,74 L100,66 M72,111 L62,111 M128,111 L138,111 M80,91 L74,85 M120,91 L126,85" />
        </g>
        <path d={`M100,80 L124,106 L100,144 L76,106 Z`} fill={`url(#${I("holo")})`} stroke={l} strokeWidth="1.8" />
        <path d="M100,80 L100,144 M76,106 L124,106 M86,93 L114,93" stroke="#fff" strokeWidth="1.1" opacity="0.7" />
        <path d="M100,80 L114,93 L100,106 L86,93 Z" fill="#fff" opacity="0.6" stroke="none" />
      </g>
    );
  }
}

// ─── 뱃지 SVG ────────────────────────────────────────────────────────────────
function NeonBadge({ tier, size = 200 }) {
  const t = tier;
  const lvl = t.idx;
  const holo = !!t.holo;
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const uid = "n" + rawId;
  const I = (s) => s + uid;
  const stroke = holo ? `url(#${I("holo")})` : t.base;
  const fins   = lvl >= 2;
  const nodes  = lvl >= 3;
  const aura   = lvl >= 3;
  const crown  = lvl >= 4;

  return (
    <svg
      viewBox="0 0 200 236"
      width={size}
      height={Math.round(size * 236 / 200)}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id={I("body")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.deep} stopOpacity="0.62" />
          <stop offset="1" stopColor="#05070d" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={I("plate")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10131b" />
          <stop offset="1" stopColor="#070a11" />
        </linearGradient>
        <radialGradient id={I("hi")} cx="0.5" cy="0.28" r="0.72">
          <stop offset="0" stopColor={t.base} stopOpacity={(0.46 + lvl * 0.06).toFixed(2)} />
          <stop offset="0.66" stopColor={t.base} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={I("core")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={holo ? "#fff" : t.glow} stopOpacity={(0.55 + lvl * 0.07).toFixed(2)} />
          <stop offset="1" stopColor={t.base} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={I("steel")} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#5a6172" />
          <stop offset="0.5" stopColor="#2a2f3a" />
          <stop offset="1" stopColor="#13161e" />
        </linearGradient>
        <linearGradient id={I("holo")} x1="0" y1="0" x2="1" y2="1">
          {HOLO_STOPS.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
        </linearGradient>
        <linearGradient id={I("scan")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0"   stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1"   stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern id={I("grid")} width="13" height="11.3" patternUnits="userSpaceOnUse">
          <path d="M0,5.65 L6.5,0 L13,5.65 M0,5.65 L6.5,11.3 L13,5.65 M6.5,0 L6.5,11.3"
            fill="none" stroke={t.base} strokeWidth="0.5" opacity="0.5" />
        </pattern>
        <filter id={I("blur")} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation={(3.5 + lvl * 1.7).toFixed(1)} />
        </filter>
        <clipPath id={I("clip")}>
          <path d={NEON_OUT} transform="translate(100 114) scale(0.84) translate(-100 -114)" />
        </clipPath>
      </defs>

      {/* 외부 펄스 글로우 */}
      <g className="badge-glow" style={{ "--gmax": (0.42 + lvl * 0.12).toFixed(2), animationDuration: (3 - lvl * 0.28).toFixed(2) + "s" }}>
        <path d={NEON_OUT} fill="none"
          stroke={holo ? `url(#${I("holo")})` : t.glow}
          strokeWidth={7 + lvl * 2.4}
          filter={`url(#${I("blur")})`} />
      </g>

      {/* 회전 오라 링 (강호+) */}
      {aura && (
        <g opacity={holo ? 0.85 : 0.6}>
          <circle className="badge-aura" cx="100" cy="114" r="98" fill="none"
            stroke={holo ? `url(#${I("holo")})` : t.base}
            strokeWidth="1.4" strokeDasharray="2 12" />
          {lvl >= 4 && (
            <circle className="badge-aura-rev" cx="100" cy="114" r="106" fill="none"
              stroke={t.glow} strokeWidth="1" strokeDasharray="1 18" opacity="0.7" />
          )}
        </g>
      )}

      {/* 측면 핀 (정예+) */}
      {fins && [-1, 1].map((s) => (
        <g key={s} transform={`translate(100 100) scale(${s} 1) translate(-100 0)`}>
          <path
            d={lvl >= 4
              ? "M177,68 L212,78 L200,104 L212,122 L196,142 L177,128 Z"
              : "M177,76 L204,88 L194,116 L177,126 Z"}
            fill={t.deep} stroke={stroke} strokeWidth="2" strokeLinejoin="round" opacity="0.92"
          />
          <path
            d={lvl >= 4 ? "M183,80 L200,86 M188,118 L200,124" : "M183,86 L196,92"}
            stroke={stroke} strokeWidth="1" opacity="0.7"
          />
        </g>
      ))}

      {/* 바디 */}
      <path d={NEON_OUT} fill={`url(#${I("body")})`} />
      <path d={NEON_OUT} fill={`url(#${I("hi")})`} />

      {/* 내부 리세스 플레이트 */}
      <path d={NEON_OUT} transform="translate(100 114) scale(0.84) translate(-100 -114)"
        fill={`url(#${I("plate")})`} stroke="#000" strokeWidth="1" />

      {/* 헥사곤 회로 텍스처 + 스캔 */}
      <g clipPath={`url(#${I("clip")})`}>
        <rect x="20" y="40" width="160" height="170" fill={`url(#${I("grid")})`} opacity={(0.18 + lvl * 0.05).toFixed(2)} />
        <g stroke={t.base} strokeWidth="0.9" fill="none" opacity={(0.4 + lvl * 0.08).toFixed(2)}>
          <path d="M40,60 L60,60 L72,72 M160,60 L140,60 L128,72" />
          {lvl >= 1 && <path d="M40,150 L62,150 L72,140 M160,150 L138,150 L128,140" />}
          {lvl >= 2 && <path d="M52,114 L40,114 M148,114 L160,114" />}
          {lvl >= 3 && <path d="M100,176 L100,158 M86,170 L114,170" />}
        </g>
        <circle cx="100" cy="111" r={26 + lvl} fill={`url(#${I("core")})`} />
        {/* 스캔 스윕 */}
        <rect className="badge-scan" x="22" y="60" width="156" height="26"
          fill={`url(#${I("scan")})`} opacity="0"
          style={{ animationDuration: (6 - lvl * 0.4).toFixed(1) + "s" }} />
      </g>

      {/* 내부 베벨 */}
      <path d={NEON_OUT} transform="translate(100 114) scale(0.84) translate(-100 -114)"
        fill="none" stroke={t.light} strokeWidth="0.9" opacity="0.22" />

      {/* 중앙 심볼 */}
      <NeonSymbol t={t} I={I} />

      {/* 랭크 핍 (하단 다이아몬드) */}
      <g>
        {[0,1,2,3,4].map((i) => {
          const x = 100 + (i - 2) * 12;
          const on = i <= lvl;
          return (
            <path key={i}
              d={`M${x},170 l4,4 l-4,4 l-4,-4 Z`}
              fill={on ? (holo ? t.light : t.base) : "none"}
              stroke={on ? (holo ? t.light : t.glow) : "#3a4150"}
              strokeWidth="1.2"
            />
          );
        })}
      </g>

      {/* 외부 프레임 (스틸 + 네온) */}
      <path d={NEON_OUT} fill="none"
        stroke={`url(#${I("steel")})`}
        strokeWidth={lvl >= 3 ? 5 : 4} strokeLinejoin="round" />
      <path d={NEON_OUT} fill="none"
        stroke={stroke}
        strokeWidth={(2.2 + lvl * 0.35).toFixed(2)} strokeLinejoin="round" />

      {/* 코너 브래킷 (정예+) */}
      {lvl >= 2 && (
        <g stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.85">
          <path d="M100,30 l-8,5 M100,30 l8,5 M100,198 l-8,-5 M100,198 l8,-5" />
        </g>
      )}

      {/* 버텍스 리벳 */}
      {NEON_VERTS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={lvl >= 3 ? 3 : 2.4}
            fill={`url(#${I("steel")})`} stroke="#05070d" strokeWidth="0.8" />
          <circle cx={x - 0.7} cy={y - 0.7} r="0.9" fill={t.light} opacity="0.7" />
        </g>
      ))}

      {/* 오비팅 노드 (강호+) */}
      {nodes && NEON_VERTS.slice(0, lvl >= 4 ? 6 : 3).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y}
          r={lvl >= 4 ? 3.4 : 2.6}
          fill={holo ? t.light : t.glow}
          stroke="#05070d" strokeWidth="1" />
      ))}

      {/* 상승 스파크 (전설) */}
      {lvl >= 4 && [[78,150],[122,150],[100,158]].map(([x, y], i) => (
        <circle key={i} className="badge-spark" cx={x} cy={y} r="1.8" fill={t.light}
          style={{ animationDelay: (i * 0.7) + "s", transformBox: "fill-box", transformOrigin: "center" }} />
      ))}

      {/* 왕관 (전설) */}
      {crown && (
        <g transform="translate(100 12)">
          <path d="M-27,12 L-19,-9 L-7,6 L0,-15 L7,6 L19,-9 L27,12 Z"
            fill={`url(#${I("holo")})`} stroke={t.light} strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="-27" y="11" width="54" height="4" rx="2" fill={t.light} opacity="0.9" />
          <circle cx="0" cy="-15" r="3.2" fill="#fff" />
          <circle cx="-19" cy="-9" r="2.2" fill={t.light} />
          <circle cx="19"  cy="-9" r="2.2" fill={t.light} />
        </g>
      )}
    </svg>
  );
}

// ─── 인라인 티어 칩 (클랜명 옆 표시용) ──────────────────────────────────────
/**
 * 클랜명 오른쪽에 작게 붙는 티어 칩 (배지 아이콘 + 티어명)
 * @param {number}  memberCount  클랜원 수
 * @param {number}  tierIndex    직접 지정 (옵션)
 * @param {number}  size         배지 아이콘 px (기본 22)
 * @param {boolean} showName     티어명 텍스트 표시 (기본 true)
 */
export function ClanTierChip({ memberCount = 0, tierIndex, size = 22, showName = true, style = {} }) {
  const idx = tierIndex !== undefined ? tierIndex : getBadgeTier(memberCount);
  const tier = TIER_DATA[Math.min(idx, 4)];
  return (
    <span
      title={`${tier.name} · ${tier.en} (${tier.range})`}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, verticalAlign: "middle", ...style }}
    >
      <span style={{ display: "inline-flex", lineHeight: 0 }}>
        <ClanBadge tierIndex={idx} size={size} />
      </span>
      {showName && (
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.5)), fontWeight: 700, color: tier.base, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
          {tier.name}
        </span>
      )}
    </span>
  );
}

// ─── 글로벌 CSS 주입 ─────────────────────────────────────────────────────────
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.id = "clan-badge-styles";
  s.textContent = BADGE_CSS;
  document.head.appendChild(s);
  cssInjected = true;
}

// ─── 공개 컴포넌트 ───────────────────────────────────────────────────────────
/**
 * @param {number}  memberCount  클랜원 수 (자동으로 티어 계산)
 * @param {number}  tierIndex    직접 티어 지정 (0-4), memberCount 무시
 * @param {number}  size         배지 너비(px), 기본 80
 * @param {boolean} showLabel    이름/영문/범위 라벨 표시 여부
 * @param {"full"|"mini"} variant  "mini" = 라벨 없이 아이콘만
 */
export default function ClanBadge({ memberCount = 0, tierIndex, size = 80, showLabel = false }) {
  if (typeof window !== "undefined") injectCSS();

  const idx  = tierIndex !== undefined ? tierIndex : getBadgeTier(memberCount);
  const tier = TIER_DATA[Math.min(idx, 4)];

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <NeonBadge tier={tier} size={size} />
      {showLabel && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: tier.base, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 1 }}>
            {tier.name}
          </div>
          <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1.5, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>
            {tier.en} · {tier.range}
          </div>
        </div>
      )}
    </div>
  );
}
