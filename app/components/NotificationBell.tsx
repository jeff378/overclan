"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { getUnreadCount, getNotifications, markAllRead, markRead } from "../../lib/notifications";

export default function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let channel: any;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      setUserId(uid);
      setUnread(await getUnreadCount(uid));

      // Realtime 구독 — 새 알림 오면 뱃지 갱신
      channel = supabase
        .channel(`notif-${uid}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, () => {
          setUnread(c => c + 1);
        })
        .subscribe();
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && userId) {
      setLoading(true);
      const list = await getNotifications(userId);
      setItems(list);
      setLoading(false);
      // 열면 모두 읽음 처리
      if (unread > 0) {
        await markAllRead(userId);
        setUnread(0);
      }
    }
  };

  const handleClick = async (n: any) => {
    if (!n.is_read) await markRead(n.id);
    if (n.link) window.location.href = n.link;
  };

  const timeAgo = (date: any) => {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금";
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}일 전`;
    return new Date(date).toLocaleDateString("ko-KR");
  };

  const typeIcon = (type: string) => {
    if (type === "clan_request") return "📥";
    if (type === "clan_accepted") return "✅";
    if (type === "clan_rejected") return "❌";
    if (type === "battle_request" || type === "battle_accepted") return "⚔️";
    if (type === "battle_result") return "🏆";
    if (type === "comment") return "💬";
    if (type === "event") return "🎉";
    return "🔔";
  };

  if (!userId) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={toggle} aria-label="알림" style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6, display: "flex", alignItems: "center", color: "#e8eaf0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, background: "#ff6b23", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", fontFamily: "Rajdhani, sans-serif" }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, maxWidth: "85vw", maxHeight: 420, overflowY: "auto", background: "#0d1423", border: "1px solid rgba(255,107,35,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 1000, clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,107,35,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 1, color: "#e8eaf0" }}>알림</span>
            <a href="/settings" style={{ fontSize: 11, color: "#8892a4", textDecoration: "none", fontFamily: "Noto Sans KR, sans-serif" }}>⚙ 설정</a>
          </div>
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, fontSize: 13 }}>LOADING...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>🔔</div>
              새로운 알림이 없어요.
            </div>
          ) : (
            <div>
              {items.map(n => (
                <div key={n.id} onClick={() => handleClick(n)} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: n.link ? "pointer" : "default", display: "flex", gap: 10, alignItems: "flex-start", background: n.is_read ? "transparent" : "rgba(255,107,35,0.05)", transition: "background 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.background = "rgba(255,107,35,0.1)"}
                  onMouseOut={e => e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(255,107,35,0.05)"}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 2 }}>{n.title}</div>
                    {n.message && <div style={{ fontSize: 12, color: "#a8b0c0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.4, wordBreak: "break-word" }}>{n.message}</div>}
                    <div style={{ fontSize: 10, color: "#8892a4", marginTop: 4, fontFamily: "Rajdhani, sans-serif" }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff6b23", flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
