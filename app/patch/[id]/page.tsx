"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ShareButton from "../../components/ShareButton";

export default function PatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("nickname").eq("id", uid).single();
    return data;
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      const { data } = await supabase.from("patch_posts").select("*").eq("id", id).single();
      if (data) {
        const prof = await fetchProfile(data.user_id);
        setPost({ ...data, profiles: prof });
        const { data: cs } = await supabase.from("patch_comments").select("*").eq("post_id", id).order("created_at", { ascending: true });
        if (cs) {
          const withProfiles = await Promise.all(cs.map(async (c) => ({ ...c, profiles: await fetchProfile(c.user_id) })));
          setComments(withProfiles);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    const { data } = await supabase.from("patch_comments").insert({ post_id: id, user_id: user.id, content: comment }).select().single();
    if (data) {
      const prof = await fetchProfile(user.id);
      setComments(prev => [...prev, { ...data, profiles: prof }]);
    }
    setComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("patch_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeletePost = async () => {
    if (!confirm("글을 삭제할까요?")) return;
    await supabase.from("patch_posts").delete().eq("id", id);
    router.push("/patch");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!post) return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 20 }}>글을 찾을 수 없어요.</div>
        <a href="/patch" className="btn-back" style={{ color: "#ff6b23", textDecoration: "none" }}>← 목록으로</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .comment-row { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .patch-tag { background: rgba(255,107,35,0.15); color: #ff6b23; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.5; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        .back-link { color: #8892a4; text-decoration: none; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; transition: color 0.2s; }
        .back-link:hover { color: #ff6b23; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
        <a href="/patch" className="back-link" style={{ marginBottom: 20, display: "inline-flex" }}>← 패치노트 토론장</a>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "clamp(20px, 4vw, 32px)", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              {post.patch_version && <span className="patch-tag" style={{ marginBottom: 10, display: "inline-block" }}>v{post.patch_version}</span>}
              <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, lineHeight: 1.3, wordBreak: "keep-all" }}>{post.title}</h1>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 8 }}>{post.profiles?.nickname} · {new Date(post.created_at).toLocaleDateString("ko-KR")}</div>
            </div>
            {(user?.id === post.user_id) ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <ShareButton title={`${post.title} | 오버클랜`} />
                <button className="btn-del" onClick={handleDeletePost}>🗑 삭제</button>
              </div>
            ) : (
              <div style={{ flexShrink: 0 }}><ShareButton title={`${post.title} | 오버클랜`} /></div>
            )}
          </div>
          <p style={{ fontSize: 15, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.9, paddingTop: 20, borderTop: "1px solid rgba(255,107,35,0.1)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.content}</p>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 12, color: "#e8eaf0", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>댓글 {comments.length}</div>
          <div style={{ background: "rgba(13,20,35,0.5)", border: "1px solid rgba(255,107,35,0.08)", marginBottom: 16 }}>
            {comments.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13 }}>첫 댓글을 남겨보세요.</div>
            ) : comments.map(c => (
              <div key={c.id} className="comment-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#ff6b23", fontWeight: 600, marginBottom: 4, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{c.profiles?.nickname}</div>
                  <div style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.6, wordBreak: "break-word" }}>{c.content}</div>
                </div>
                {user?.id === c.user_id && <button className="btn-del" onClick={() => handleDeleteComment(c.id)}>🗑</button>}
              </div>
            ))}
          </div>
          {user ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="댓글을 입력하세요" value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleComment()} style={{ flex: 1 }} />
              <button className="btn-primary" onClick={handleComment}>등록</button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13 }}>
              <a href="/login" style={{ color: "#ff6b23", textDecoration: "none" }}>로그인</a> 후 댓글을 남길 수 있어요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
