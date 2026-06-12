"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";

export default function PatchPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", patch_version: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");

  const fetchWithProfiles = async (rows: any[], idField = "user_id") => {
    return Promise.all(rows.map(async (row) => {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", row[idField]).single();
      return { ...row, profiles: prof };
    }));
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      const { data } = await supabase.from("patch_posts").select("*").order("created_at", { ascending: false });
      if (data) {
        const withProfiles = await fetchWithProfiles(data);
        setPosts(withProfiles);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from("patch_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    if (data) {
      const withProfiles = await fetchWithProfiles(data);
      setComments(withProfiles);
    }
  };

  const handlePost = async () => {
    if (!form.title || !form.content) return;
    setSubmitting(true);
    const { data } = await supabase.from("patch_posts").insert({ ...form, user_id: user.id }).select().single();
    if (data) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      setPosts(prev => [{ ...data, profiles: prof }, ...prev]);
    }
    setForm({ title: "", content: "", patch_version: "" });
    setShowForm(false);
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("글을 삭제할까요?")) return;
    await supabase.from("patch_posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selected?.id === postId) setSelected(null);
  };

  const handleComment = async () => {
    if (!comment.trim() || !selected) return;
    const { data } = await supabase.from("patch_comments").insert({ post_id: selected.id, user_id: user.id, content: comment }).select().single();
    if (data) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      setComments(prev => [...prev, { ...data, profiles: prof }]);
    }
    setComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("patch_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleSelect = (post: any) => {
    setSelected(post);
    loadComments(post.id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .post-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 20px 24px; cursor: pointer; transition: all 0.2s; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); margin-bottom: 8px; position: relative; }
        .post-card:hover, .post-card.active { border-color: rgba(255,107,35,0.4); background: rgba(20,30,50,0.9); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 120px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .comment-row { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .patch-tag { background: rgba(255,107,35,0.15); color: #ff6b23; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.5; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>패치노트 토론장</h1>
          </div>
          {user && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "취소" : "글 작성"}</button>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목, 내용 검색..." style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 16px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%" }} />
        </div>

        <a href="https://overwatch.blizzard.com/ko-kr/news/patch-notes/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,107,35,0.06)", border: "1px solid rgba(255,107,35,0.25)", padding: "14px 20px", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", transition: "all 0.2s", cursor: "pointer" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,107,35,0.12)"; e.currentTarget.style.borderColor = "rgba(255,107,35,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,107,35,0.06)"; e.currentTarget.style.borderColor = "rgba(255,107,35,0.25)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif" }}>공식 패치노트 바로가기</div>
                <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 2 }}>블리자드 공식 패치노트를 확인하고 여기서 토론해보세요</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: "#ff6b23", fontWeight: 600, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, whiteSpace: "nowrap" }}>바로가기 →</span>
          </div>
        </a>

        {showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: "28px", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
                <div>
                  <label className="label">제목</label>
                  <input className="input" placeholder="패치 내용이나 의견을 제목으로 입력해주세요" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="label">패치 버전</label>
                  <input className="input" placeholder="예: 1.2.3" value={form.patch_version} onChange={e => setForm({ ...form, patch_version: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">내용</label>
                <textarea className="input" placeholder="패치에 대한 의견을 자유롭게 적어주세요" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <button className="btn-primary" onClick={handlePost} disabled={submitting} style={{ alignSelf: "flex-start" }}>{submitting ? "등록 중..." : "등록하기"}</button>
            </div>
          </div>
        )}

        <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr", gap: 24 }}>
          <div>
            {loading ? (
              <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 글이 없어요. 첫 번째 토론을 시작해보세요!</div>
            ) : posts.filter((p: any) => !search || p.title.includes(search) || p.content.includes(search)).map(post => (
              <div key={post.id} className={`post-card ${selected?.id === post.id ? "active" : ""}`} onClick={() => handleSelect(post)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {post.patch_version && <span className="patch-tag" style={{ flexShrink: 0 }}>v{post.patch_version}</span>}
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</span>
                  {user?.id === post.user_id && (
                    <button className="btn-del" onClick={e => { e.stopPropagation(); handleDelete(post.id); }}>🗑</button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", display: "flex", gap: 12 }}>
                  <span>{post.profiles?.nickname}</span>
                  <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  {selected.patch_version && <span className="patch-tag" style={{ marginBottom: 8, display: "inline-block" }}>v{selected.patch_version}</span>}
                  <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700 }}>{selected.title}</h2>
                  <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 4 }}>{selected.profiles?.nickname} · {new Date(selected.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,107,35,0.1)", whiteSpace: "pre-wrap" }}>{selected.content}</p>

              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 12, color: "#8892a4" }}>댓글 {comments.length}</div>
              <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
                {comments.map(c => (
                  <div key={c.id} className="comment-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#ff6b23", fontWeight: 600, marginBottom: 4, fontFamily: "Rajdhani, sans-serif" }}>{c.profiles?.nickname}</div>
                      <div style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.6 }}>{c.content}</div>
                    </div>
                    {user?.id === c.user_id && <button className="btn-del" onClick={() => handleDeleteComment(c.id)}>🗑</button>}
                  </div>
                ))}
              </div>
              {user && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" placeholder="댓글을 입력하세요" value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleComment()} style={{ flex: 1 }} />
                  <button className="btn-primary" onClick={handleComment}>등록</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
