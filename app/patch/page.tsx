"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";
import { ClanSuffix } from "../components/ClanBadge";
import CommunityLayout from "../components/CommunityLayout";

export default function PatchPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", patch_version: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchWithProfiles = async (rows: any[], idField = "user_id") => {
    return Promise.all(rows.map(async (row) => {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", row[idField]).single();
      const { data: mem } = await supabase.from("clan_members").select("clans(id,name,tier,accent_color)").eq("user_id", row[idField]).limit(1);
      return { ...row, profiles: prof, authorClan: (mem && (mem[0] as any)?.clans) || null };
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
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .hero-glow { position: absolute; top: -90px; left: 0; right: 0; height: 240px; background: radial-gradient(ellipse 55% 100% at 25% 0%, rgba(255,107,35,0.12), transparent 70%); pointer-events: none; animation: heroPulse 5s ease-in-out infinite; }
        @keyframes heroPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .post-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 20px 24px; cursor: pointer; transition: all 0.25s; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); margin-bottom: 8px; position: relative; display: block; text-decoration: none; color: inherit; }
        .post-card:hover { border-color: rgba(255,107,35,0.4); background: rgba(20,30,50,0.9); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(255,107,35,0.12); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 120px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .patch-tag { background: rgba(255,107,35,0.15); color: #ff6b23; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.5; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Navbar active="커뮤니티" />

      <CommunityLayout active="/patch">
        <div className="hero-glow" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 3, height: 24, background: "#ff6b23", flexShrink: 0, boxShadow: "0 0 10px rgba(255,107,35,0.7)" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, letterSpacing: 2, whiteSpace: "nowrap", color: "#fff", textShadow: "0 0 24px rgba(255,107,35,0.35)" }}>패치노트 토론장</h1>
          </div>
          {user && <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ flexShrink: 0 }}>{showForm ? "취소" : "글 작성"}</button>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목, 내용 검색..." style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "10px 16px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none", width: "100%" }} />
        </div>

        <a href="https://overwatch.blizzard.com/ko-kr/news/patch-notes/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "rgba(255,107,35,0.06)", border: "1px solid rgba(255,107,35,0.25)", padding: "14px 20px", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", transition: "all 0.2s", cursor: "pointer" }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,107,35,0.12)"; e.currentTarget.style.borderColor = "rgba(255,107,35,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,107,35,0.06)"; e.currentTarget.style.borderColor = "rgba(255,107,35,0.25)"; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>📋</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif" }}>공식 패치노트 바로가기</div>
                <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 2 }}>블리자드 공식 패치노트를 확인하고 여기서 토론해보세요</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: "#ff6b23", fontWeight: 600, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 1, whiteSpace: "nowrap", flexShrink: 0 }}>바로가기 →</span>
          </div>
        </a>

        {showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: "28px", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
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

        <div>
          {loading ? (
            <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>아직 글이 없어요. 첫 번째 토론을 시작해보세요!</div>
          ) : posts.filter((p: any) => !search || p.title.includes(search) || p.content.includes(search)).map(post => (
            <a key={post.id} href={`/patch/${post.id}`} className="post-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {post.patch_version && <span className="patch-tag" style={{ flexShrink: 0 }}>v{post.patch_version}</span>}
                <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</span>
                {user?.id === post.user_id && (
                  <button className="btn-del" onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(post.id); }} style={{ flexShrink: 0 }}>🗑</button>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", display: "flex", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{post.profiles?.nickname}<ClanSuffix clan={post.authorClan} /></span>
                <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
              </div>
            </a>
          ))}
        </div>
      </CommunityLayout>
    </div>
  );
}
