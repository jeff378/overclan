"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ShareButton from "../../components/ShareButton";
import LikeButton from "../../components/LikeButton";
import ReportButton from "../../components/ReportButton";

const ADMIN_EMAIL = "jujin2271@gmail.com";

export default function NoticeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const categoryColor: Record<string, string> = { "공지": "#ff6b23", "업데이트": "#4fc3f7", "이벤트": "#4caf50" };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.email === ADMIN_EMAIL) setIsAdmin(true);
      const { data } = await supabase.from("site_notices").select("*").eq("id", id).single();
      setNotice(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("공지를 삭제할까요?")) return;
    await supabase.from("site_notices").delete().eq("id", id);
    router.push("/notice");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!notice) return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 20 }}>공지를 찾을 수 없어요.</div>
        <a href="/notice" style={{ color: "#ff6b23", textDecoration: "none" }}>← 목록으로</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cat-tag { font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 3px 10px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); white-space: nowrap; display: inline-block; }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.6; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        .back-link { color: #8892a4; text-decoration: none; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; transition: color 0.2s; }
        .back-link:hover { color: #ff6b23; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
        <a href="/notice" className="back-link" style={{ marginBottom: 20, display: "inline-block" }}>← 오버클랜 공지사항</a>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "clamp(20px, 4vw, 32px)", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <span className="cat-tag" style={{ background: `${categoryColor[notice.category]}22`, color: categoryColor[notice.category] || "#ff6b23", border: `1px solid ${categoryColor[notice.category]}44`, marginBottom: 12 }}>{notice.category}</span>
              <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, lineHeight: 1.3, wordBreak: "keep-all" }}>{notice.title}</h1>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 8 }}>{new Date(notice.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              <ShareButton title={`[${notice.category}] ${notice.title} | 오버클랜`} />
              {isAdmin ? (
                <button className="btn-del" onClick={handleDelete}>🗑 삭제</button>
              ) : (
                <ReportButton targetType="post" targetId={id as string} targetBoard="notice" />
              )}
            </div>
          </div>
          <p style={{ fontSize: 15, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.9, paddingTop: 20, borderTop: "1px solid rgba(255,107,35,0.1)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{notice.content}</p>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,107,35,0.1)", display: "flex", justifyContent: "center" }}>
            <LikeButton postType="notice" postId={id as string} />
          </div>
        </div>
      </div>
    </div>
  );
}
