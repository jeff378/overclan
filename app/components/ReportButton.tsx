"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

const CATEGORIES = ["욕설·괴롭힘", "허위·명예훼손", "도배·광고", "개인정보 노출", "사칭", "기타"];

export default function ReportButton({ targetType, targetId, targetBoard }: { targetType: string; targetId: string | number; targetBoard?: string }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { alert("로그인 후 신고할 수 있어요."); setBusy(false); setOpen(false); return; }
    const { error } = await supabase.from("reports").insert({
      reporter_id: u.user.id, target_type: targetType, target_id: String(targetId),
      target_board: targetBoard || null, category: cat, reason: reason || null,
    });
    setBusy(false); setOpen(false); setReason("");
    if (error) { alert("신고 접수에 실패했어요. 문의 페이지로 알려주세요."); return; }
    alert("신고가 접수됐어요. 검토 후 조치할게요.");
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", color: "#5a6478", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>🚩 신고</button>
      {open && (
        <div onClick={() => !busy && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "0 24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#0d1423", border: "1px solid rgba(255,107,35,0.25)", padding: 24, clipPath: "polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 1, color: "#ff6b23", marginBottom: 14 }}>신고하기</div>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: "100%", background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 12px", fontSize: 13, marginBottom: 10, outline: "none" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={300} placeholder="상세 사유 (선택)" style={{ width: "100%", background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 12px", fontSize: 13, marginBottom: 14, outline: "none", resize: "vertical", fontFamily: "'Noto Sans KR', sans-serif" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)} disabled={busy} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#8892a4", padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>취소</button>
              <button onClick={submit} disabled={busy} style={{ background: "linear-gradient(135deg,#ff6b23,#ff8c42)", border: "none", color: "#fff", padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "접수 중..." : "신고"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
