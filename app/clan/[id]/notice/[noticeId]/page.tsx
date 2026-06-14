"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import ShareButton from "../../../../components/ShareButton";

export default function ClanNoticeDetailPage() {
  const { id, noticeId } = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<any>(null);
  const [clan, setClan] = useState<any>(null);
  const [author, setAuthor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: noticeData } = await supabase.from("clan_notices").select("*").eq("id", noticeId).single();
      if (noticeData) {
        const { data: clanData } = await supabase.from("clans").select("id, name, accent_color, owner_id, emblem_image").eq("id", noticeData.clan_id).single();
        setClan(clanData);
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", noticeData.user_id).single();
        setAuthor(prof?.nickname || "");
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user?.id && clanData?.owner_id === userData.user.id) setIsOwner(true);
      }
      setNotice(noticeData);
      setLoading(false);
    };
    load();
  }, [noticeId]);

  const handleDelete = async () => {
    if (!confirm("공지를 삭제할까요?")) return;
    await supabase.from("clan_notices").delete().eq("id", noticeId);
    router.push(`/clan/${id}`);
  };

  const accent = clan?.accent_color || "#ff6b23";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!notice) return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 20 }}>공지를 찾을 수 없어요. 이미 삭제됐을 수 있어요.</div>
        <a href={`/clan/${id}`} style={{ color: "#ff6b23", textDecoration: "none" }}>← 클랜으로</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.6; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        .back-link { color: #8892a4; text-decoration: none; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; transition: color 0.2s; }
        .back-link:hover { color: ${accent}; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
        <a href={`/clan/${id}`} className="back-link" style={{ marginBottom: 20, display: "inline-block" }}>← {clan?.name || "클랜"} 공지</a>

        <div style={{ background: "rgba(13,20,35,0.8)", border: `1px solid ${accent}26`, padding: "clamp(20px, 4vw, 32px)", marginTop: 16, clipPath: "polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44`, fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: "3px 10px", clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)", whiteSpace: "nowrap", display: "inline-block", marginBottom: 12 }}>📢 클랜 공지</span>
              <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, lineHeight: 1.3, wordBreak: "keep-all" }}>{notice.title}</h1>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 8 }}>{author && `${author} · `}{new Date(notice.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <ShareButton title={`[${clan?.name || "클랜"} 공지] ${notice.title} | 오버클랜`} />
              {isOwner && <button className="btn-del" onClick={handleDelete}>🗑 삭제</button>}
            </div>
          </div>
          <p style={{ fontSize: 15, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.9, paddingTop: 20, borderTop: `1px solid ${accent}1a`, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{notice.content}</p>
        </div>
      </div>
    </div>
  );
}
