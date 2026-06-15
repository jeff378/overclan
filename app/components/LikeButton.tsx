"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function LikeButton({ postType, postId }: { postType: string; postId: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id || null;
      if (active) setUid(userId);
      try {
        const { count: c } = await supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_type", postType).eq("post_id", postId);
        if (active && typeof c === "number") setCount(c);
        if (userId) {
          const { data: mine } = await supabase.from("post_likes").select("id").eq("post_type", postType).eq("post_id", postId).eq("user_id", userId).limit(1);
          if (active) setLiked(!!(mine && mine.length));
        }
      } catch { /* 테이블 준비 전엔 0으로 표시 */ }
    })();
    return () => { active = false; };
  }, [postType, postId]);

  const toggle = async (e: any) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    if (!uid) { alert("로그인 후 추천할 수 있어요."); return; }
    if (busy) return;
    setBusy(true);
    if (liked) {
      setLiked(false); setCount(c => Math.max(0, c - 1));
      const { error } = await supabase.from("post_likes").delete().eq("post_type", postType).eq("post_id", postId).eq("user_id", uid);
      if (error) { setLiked(true); setCount(c => c + 1); }
    } else {
      setLiked(true); setCount(c => c + 1);
      const { error } = await supabase.from("post_likes").insert({ post_type: postType, post_id: postId, user_id: uid });
      if (error) { setLiked(false); setCount(c => Math.max(0, c - 1)); }
    }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, background: liked ? "rgba(255,107,35,0.15)" : "rgba(13,20,35,0.7)", border: `1px solid ${liked ? "#ff6b23" : "rgba(255,107,35,0.2)"}`, color: liked ? "#ff6b23" : "#8892a4", padding: "8px 18px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", transition: "all 0.15s" }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>{liked ? "♥" : "♡"}</span> 추천 {count}
    </button>
  );
}
