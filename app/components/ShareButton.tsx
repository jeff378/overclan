"use client";
import { useState } from "react";

export default function ShareButton({ title, accent = "#ff6b23" }: { title?: string; accent?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: title || "오버클랜", url };

    // 모바일: 네이티브 공유 시트
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // 사용자가 취소한 경우 등 — 복사로 폴백하지 않고 종료
        return;
      }
    }
    // 데스크탑: 링크 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 실패 시 수동 복사 안내
      prompt("아래 링크를 복사하세요:", url);
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: copied ? `${accent}22` : "rgba(13,20,35,0.8)",
        border: `1px solid ${accent}55`, color: copied ? accent : "#c8cad0",
        padding: "8px 16px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 500,
        cursor: "pointer", clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
        transition: "all 0.2s", whiteSpace: "nowrap",
      }}
    >
      {copied ? (
        <>✓ 링크 복사됨</>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          공유
        </>
      )}
    </button>
  );
}
