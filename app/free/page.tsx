"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { uploadPostImage } from "../../lib/uploadImage";
import Navbar from "../components/Navbar";
import CommunityLayout from "../components/CommunityLayout";
import { ClanSuffix } from "../components/ClanBadge";

const CATEGORIES = ["전체", "잡담", "질문", "정보", "기타"];
const CAT_COLOR: Record<string, string> = { "잡담": "#ff6b23", "질문": "#4fc3f7", "정보": "#4caf50", "기타": "#8892a4" };
const PAGE_SIZE = 20;

export default function FreeBoardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "잡담" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("전체");

  const fetchWithProfiles = async (rows: any[]) => {
    return Promise.all(rows.map(async (row) => {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", row.user_id).single();
      const { data: mem } = await supabase.from("clan_members").select("clans(id,name,tier,accent_color)").eq("user_id", row.user_id).limit(1);
      return { ...row, profiles: prof, authorClan: (mem && (mem[0] as any)?.clans) || null };
    }));
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      const { data } = await supabase.from("free_posts").select("*").order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
      if (data) {
        setPosts(await fetchWithProfiles(data));
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const from = posts.length;
    const { data } = await supabase.from("free_posts").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (data) {
      const withProfiles = await fetchWithProfiles(data);
      setPosts(prev => [...prev, ...withProfiles]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  };

  const handlePost = async () => {
    if (!form.title || !form.content) return;
    setSubmitting(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      const { url, error: upErr } = await uploadPostImage(imageFile, user.id);
      if (upErr) { alert(upErr); setSubmitting(false); return; }
      imageUrl = url;
    }
    const { data, error } = await supabase.from("free_posts").insert({ ...form, user_id: user.id, ...(imageUrl ? { image_url: imageUrl } : {}) }).select().single();
    if (error) { alert("등록에 실패했어요. 잠시 후 다시 시도해주세요."); setSubmitting(false); return; }
    if (data) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      const { data: mem } = await supabase.from("clan_members").select("clans(id,name,tier,accent_color)").eq("user_id", user.id).limit(1);
      setPosts(prev => [{ ...data, profiles: prof, authorClan: (mem && (mem[0] as any)?.clans) || null }, ...prev]);
    }
    setForm({ title: "", content: "", category: "잡담" });
    removeImage();
    setShowForm(false);
    setSubmitting(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("글을 삭제할까요?")) return;
    await supabase.from("free_posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const filtered = posts.filter(p => (filter === "전체" || p.category === filter) && (!search || p.title.includes(search) || p.content.includes(search)));

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .cat-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 6px 16px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition: all 0.2s; white-space: nowrap; }
        .cat-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .post-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 18px 22px; cursor: pointer; transition: all 0.25s; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); margin-bottom: 8px; position: relative; display: block; text-decoration: none; color: inherit; }
        .post-card:hover { border-color: rgba(255,107,35,0.4); background: rgba(20,30,50,0.9); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(255,107,35,0.12); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 120px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .cat-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.5; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        .hero-glow { position: absolute; top: -70px; left: 0; right: 0; height: 200px; background: radial-gradient(ellipse 60% 100% at 30% 0%, rgba(255,107,35,0.1), transparent 70%); pointer-events: none; }
      `}</style>

      <Navbar active="커뮤니티" />

      <CommunityLayout active="/free">
        <div className="hero-glow" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 3, height: 24, background: "#ff6b23", flexShrink: 0, boxShadow: "0 0 10px rgba(255,107,35,0.7)" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, letterSpacing: 2, whiteSpace: "nowrap", color: "#fff", textShadow: "0 0 24px rgba(255,107,35,0.35)" }}>자유게시판</h1>
          </div>
          {user && <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ flexShrink: 0 }}>{showForm ? "취소" : "글 작성"}</button>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`cat-btn ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목, 내용 검색..." style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "7px 14px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", marginLeft: "auto", minWidth: 160 }} />
        </div>

        {showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: "24px", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
                <div>
                  <label className="label">제목</label>
                  <input className="input" placeholder="제목을 입력하세요" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={60} />
                </div>
                <div>
                  <label className="label">카테고리</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {["잡담", "질문", "정보", "기타"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">내용</label>
                <textarea className="input" placeholder="자유롭게 이야기해보세요" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <label className="label">이미지</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                {imagePreview ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img src={imagePreview} alt="" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, border: "1px solid rgba(255,107,35,0.2)", display: "block" }} />
                    <button type="button" onClick={removeImage} style={{ position: "absolute", top: 6, right: 6, background: "rgba(8,12,20,0.85)", border: "1px solid rgba(255,107,35,0.3)", color: "#e8eaf0", width: 26, height: 26, cursor: "pointer", fontSize: 14, lineHeight: 1, clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)" }}>✕</button>
                  </div>
                ) : (
                  <button type="button" className="cat-btn" onClick={() => fileInputRef.current?.click()}>＋ 이미지 첨부</button>
                )}
              </div>
              <button className="btn-primary" onClick={handlePost} disabled={submitting} style={{ alignSelf: "flex-start" }}>{submitting ? "등록 중..." : "등록하기"}</button>
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 글이 없어요. 첫 글을 남겨보세요!</div>
          ) : filtered.map(post => (
            <a key={post.id} href={`/free/${post.id}`} className="post-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span className="cat-tag" style={{ background: `${CAT_COLOR[post.category] || "#8892a4"}22`, color: CAT_COLOR[post.category] || "#8892a4", border: `1px solid ${CAT_COLOR[post.category] || "#8892a4"}44`, flexShrink: 0 }}>{post.category}</span>
                <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</span>
                {user?.id === post.user_id && (
                  <button className="btn-del" onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(post.id); }} style={{ flexShrink: 0 }}>🗑</button>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {post.profiles?.nickname}<ClanSuffix clan={post.authorClan} /> · {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </div>
            </a>
          ))}
          {!loading && hasMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="btn-primary" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "불러오는 중..." : "더보기"}</button>
            </div>
          )}
        </div>
      </CommunityLayout>
    </div>
  );
}
