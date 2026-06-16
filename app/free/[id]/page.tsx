"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ShareButton from "../../components/ShareButton";
import { ClanSuffix } from "../../components/ClanBadge";
import LikeButton from "../../components/LikeButton";
import ReportButton from "../../components/ReportButton";

const CAT_COLOR: Record<string, string> = { "잡담": "#ff6b23", "질문": "#4fc3f7", "정보": "#4caf50", "기타": "#8892a4" };

export default function FreePostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("nickname").eq("id", uid).single();
    return data;
  };
  const fetchClan = async (uid: string) => {
    const { data } = await supabase.from("clan_members").select("clans(id,name,tier,accent_color)").eq("user_id", uid).limit(1);
    return (data && (data[0] as any)?.clans) || null;
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      const { data } = await supabase.from("free_posts").select("*").eq("id", id).single();
      if (data) {
        const prof = await fetchProfile(data.user_id);
        setPost({ ...data, profiles: prof, authorClan: await fetchClan(data.user_id) });
        const { data: cs } = await supabase.from("free_comments").select("*").eq("post_id", id).order("created_at", { ascending: true });
        if (cs) {
          const withProfiles = await Promise.all(cs.map(async (c) => ({ ...c, profiles: await fetchProfile(c.user_id), authorClan: await fetchClan(c.user_id) })));
          setComments(withProfiles);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    const { data } = await supabase.from("free_comments").insert({ post_id: id, user_id: user.id, content: comment }).select().single();
    if (data) {
      const prof = await fetchProfile(user.id);
      const myClan = await fetchClan(user.id);
      setComments(prev => [...prev, { ...data, profiles: prof, authorClan: myClan }]);
    }
    setComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("free_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeletePost = async () => {
    if (!confirm("글을 삭제할까요?")) return;
    await supabase.from("free_posts").delete().eq("id", id);
    router.push("/free");
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 22px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 12px; opacity: 0.6; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        .back-link { display:inline-flex; align-items:center; gap:6px; color:#8892a4; font-family:'Cinzel','Rajdhani',sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; text-decoration:none; }
        .back-link:hover { color:#ff6b23; }
        .cat-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
      `}</style>

      <Navbar active="커뮤니티" />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div style={{ marginBottom: 20 }}><a href="/free" className="back-link">← 자유게시판</a></div>

        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "60px 0" }}>LOADING...</div>
        ) : !post ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>글을 찾을 수 없어요.</div>
        ) : (
          <>
            <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "clamp(20px, 4vw, 32px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <span className="cat-tag" style={{ background: `${CAT_COLOR[post.category] || "#8892a4"}22`, color: CAT_COLOR[post.category] || "#8892a4", border: `1px solid ${CAT_COLOR[post.category] || "#8892a4"}44`, marginBottom: 10, display: "inline-block" }}>{post.category}</span>
                  <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, lineHeight: 1.3, wordBreak: "keep-all" }}>{post.title}</h1>
                  <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{post.profiles?.nickname}<ClanSuffix clan={post.authorClan} /> · {new Date(post.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
                {(user?.id === post.user_id) ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <ShareButton title={`${post.title} | 오버클랜`} />
                    <button className="btn-del" onClick={handleDeletePost}>🗑 삭제</button>
                  </div>
                ) : (
                  <div style={{ flexShrink: 0, display: "flex", gap: 10, alignItems: "center" }}>
                    <ShareButton title={`${post.title} | 오버클랜`} />
                    <ReportButton targetType="post" targetId={id as string} targetBoard="free" />
                  </div>
                )}
              </div>
              <p style={{ fontSize: 15, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.9, paddingTop: 20, borderTop: "1px solid rgba(255,107,35,0.1)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.content}</p>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,107,35,0.1)", display: "flex", justifyContent: "center" }}>
                <LikeButton postType="free" postId={id as string} />
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 12, color: "#e8eaf0", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>댓글 {comments.length}</div>
              <div style={{ background: "rgba(13,20,35,0.5)", border: "1px solid rgba(255,107,35,0.08)", marginBottom: 16 }}>
                {comments.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#8892a4", fontSize: 13, fontFamily: "Noto Sans KR, sans-serif" }}>첫 댓글을 남겨보세요.</div>
                ) : comments.map(c => (
                  <div key={c.id} style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,107,35,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 12, color: "#ff6b23", fontWeight: 600, marginBottom: 4, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{c.profiles?.nickname}<ClanSuffix clan={c.authorClan} /></div>
                      {user?.id === c.user_id && <button className="btn-del" onClick={() => handleDeleteComment(c.id)}>삭제</button>}
                    </div>
                    <div style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.content}</div>
                  </div>
                ))}
              </div>
              {user ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" placeholder="댓글을 입력하세요" value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleComment()} />
                  <button className="btn-primary" onClick={handleComment} style={{ whiteSpace: "nowrap" }}>등록</button>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", textAlign: "center", padding: "12px" }}><a href="/login" style={{ color: "#ff6b23", textDecoration: "none" }}>로그인</a> 후 댓글을 남길 수 있어요.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
