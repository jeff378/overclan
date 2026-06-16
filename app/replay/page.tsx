"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { uploadPostImage } from "../../lib/uploadImage";
import Navbar from "../components/Navbar";
import { ClanSuffix } from "../components/ClanBadge";
import CommunityLayout from "../components/CommunityLayout";

const PAGE_SIZE = 20;

export default function ReplayPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ replay_code: "", description: "" });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    if (imagePreviews[idx]) URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const clearImages = () => {
    imagePreviews.forEach(p => URL.revokeObjectURL(p));
    setImageFiles([]);
    setImagePreviews([]);
  };

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
      const { data } = await supabase.from("replay_posts").select("*").order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
      if (data) {
        const withProfiles = await fetchWithProfiles(data);
        setPosts(withProfiles);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const from = posts.length;
    const { data } = await supabase.from("replay_posts").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (data) {
      const withProfiles = await fetchWithProfiles(data);
      setPosts(prev => [...prev, ...withProfiles]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  };

  const handlePost = async () => {
    if (!form.replay_code) return;
    setSubmitting(true);
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const { url, error } = await uploadPostImage(file, user.id);
      if (error) {
        alert(error);
        setSubmitting(false);
        return;
      }
      if (url) imageUrls.push(url);
    }
    const { data } = await supabase.from("replay_posts").insert({ ...form, user_id: user.id, ...(imageUrls.length ? { image_urls: imageUrls } : {}) }).select().single();
    if (data) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      setPosts(prev => [{ ...data, profiles: prof }, ...prev]);
    }
    setForm({ replay_code: "", description: "" });
    clearImages();
    setShowForm(false);
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("이 제보를 삭제할까요?")) return;
    await supabase.from("replay_posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const getVotePercent = (post: any) => {
    const total = (post.votes_hack || 0) + (post.votes_clean || 0);
    if (total === 0) return { hack: 0, clean: 0, total: 0 };
    return { hack: Math.round((post.votes_hack / total) * 100), clean: Math.round((post.votes_clean / total) * 100), total };
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .hero-glow { position: absolute; top: -90px; left: 0; right: 0; height: 240px; background: radial-gradient(ellipse 55% 100% at 25% 0%, rgba(255,107,35,0.12), transparent 70%); pointer-events: none; animation: heroPulse 5s ease-in-out infinite; }
        @keyframes heroPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .post-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 20px 24px; cursor: pointer; transition: all 0.25s; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); margin-bottom: 8px; display: block; text-decoration: none; color: inherit; }
        .post-card:hover { border-color: rgba(255,107,35,0.4); background: rgba(20,30,50,0.9); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(255,107,35,0.12); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 80px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .replay-code { background: rgba(255,107,35,0.1); border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; padding: 4px 12px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.5; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
      `}</style>

      <Navbar active="커뮤니티" />

      <CommunityLayout active="/replay">
        <div className="hero-glow" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 3, height: 24, background: "#ff6b23", flexShrink: 0, boxShadow: "0 0 10px rgba(255,107,35,0.7)" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, letterSpacing: 2, whiteSpace: "nowrap", color: "#fff", textShadow: "0 0 24px rgba(255,107,35,0.35)" }}>핵 의심 리플레이</h1>
          </div>
          {user && <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ flexShrink: 0 }}>{showForm ? "취소" : "리플레이 제보"}</button>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="리플레이 코드 또는 내용 검색..." style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 16px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%" }} />
        </div>

        {showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: "28px", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="label">리플레이 코드 *</label>
                <input className="input" placeholder="예: ABCD-1234" value={form.replay_code} onChange={e => setForm({ ...form, replay_code: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="label">설명</label>
                <textarea className="input" placeholder="어떤 점이 의심스러운지 설명해주세요" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">스크린샷 증거</label>
                {imagePreviews.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                        <img src={src} alt="" style={{ maxWidth: 140, maxHeight: 140, borderRadius: 8, border: "1px solid rgba(255,107,35,0.2)", display: "block" }} />
                        <button type="button" onClick={() => removeImage(idx)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(8,12,20,0.85)", border: "1px solid rgba(255,107,35,0.3)", color: "#e8eaf0", cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4, fontFamily: "Noto Sans KR, sans-serif" }}>제거</button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ display: "inline-block", background: "rgba(255,107,35,0.1)", border: "1px solid rgba(255,107,35,0.3)", color: "#ff6b23", padding: "10px 20px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>
                  이미지 첨부
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              </div>
              <button className="btn-primary" onClick={handlePost} disabled={submitting} style={{ alignSelf: "flex-start" }}>{submitting ? "등록 중..." : "제보하기"}</button>
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 제보된 리플레이가 없어요.</div>
          ) : posts.filter((p: any) => !search || p.replay_code.includes(search.toUpperCase()) || (p.description || "").includes(search)).map(post => {
            const v = getVotePercent(post);
            return (
              <a key={post.id} href={`/replay/${post.id}`} className="post-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span className="replay-code">{post.replay_code}</span>
                  {user?.id === post.user_id && (
                    <button className="btn-del" onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(post.id); }} style={{ flexShrink: 0 }}>🗑</button>
                  )}
                </div>
                {post.description && <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 10, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.description}</p>}
                {v.total > 0 && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#ef5350", fontWeight: 700, flexShrink: 0 }}>핵 {v.hack}%</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${v.hack}%`, height: "100%", background: "#ef5350", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#4caf50", fontWeight: 700, flexShrink: 0 }}>정상 {v.clean}%</span>
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#8892a4", marginTop: 8, fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{post.profiles?.nickname}<ClanSuffix clan={post.authorClan} /> · 투표 {v.total}명</div>
              </a>
            );
          })}
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
