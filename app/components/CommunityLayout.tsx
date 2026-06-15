"use client";
import { ReactNode } from "react";

const BOARDS = [
  { label: "자유게시판", href: "/free" },
  { label: "패치노트 토론장", href: "/patch" },
  { label: "핵 제보", href: "/replay" },
];

export default function CommunityLayout({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="community-wrap">
      <aside className="community-sidebar">
        <div className="cs-title"><span style={{ width: 3, height: 14, background: "#ff6b23", display: "inline-block", boxShadow: "0 0 8px rgba(255,107,35,0.7)" }} />커뮤니티</div>
        {BOARDS.map(b => (
          <a key={b.href} href={b.href} className={`cs-link ${active === b.href ? "active" : ""}`}>{b.label}</a>
        ))}
      </aside>
      <div className="community-main">{children}</div>
    </div>
  );
}
