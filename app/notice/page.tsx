"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";
import { createEventNotificationForAll } from "../../lib/notifications";
import { uploadPostImage } from "../../lib/uploadImage";

const CATEGORIES = ["전체", "공지", "업데이트", "이벤트"];
const ADMIN_EMAIL = "jujin2271@gmail.com";
const PAGE_SIZE = 20;

export default function NoticePage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "공지" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      if (userData.user?.email === ADMIN_EMAIL) setIsAdmin(true);
      const { data } = await supabase.from("site_notices").select("*").order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
      setNotices(data || []);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setLoading(false);
    };
    load();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    const from = notices.length;
    const { data } = await supabase.from("site_notices").select("*").order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (data) {
      setNotices(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  };

  const handlePost = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      const { url, error } = await uploadPostImage(imageFile, user.id);
      if (error) {
        alert(error);
        setSaving(false);
        return;
      }
      imageUrl = url;
    }
    const { data } = await supabase.from("site_notices").insert({ ...form, user_id: user.id, ...(imageUrl ? { image_url: imageUrl } : {}) }).select().single();
    if (data) {
      setNotices(prev => [data, ...prev]);
      // 이벤트/공지 알림을 전체 유저에게 발송
      await createEventNotificationForAll(
        `[${form.category}] ${form.title}`,
        form.content.slice(0, 60),
        `/notice/${data.id}`
      );
    }
    setForm({ title: "", content: "", category: "공지" });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("공지를 삭제할까요?")) return;
    await supabase.from("site_notices").delete().eq("id", id);
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notices.filter(n => (filter === "전체" || n.category === filter) && (!search || n.title.includes(search) || n.content.includes(search)));

  const categoryColor: Record<string, string> = { "공지": "#ff6b23", "업데이트": "#4fc3f7", "이벤트": "#4caf50" };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 22px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
        .filter-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 6px 16px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition: all 0.2s; white-space: nowrap; }
        .filter-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .hero-glow { position: absolute; top: -90px; left: 0; right: 0; height: 240px; background: radial-gradient(ellipse 55% 100% at 25% 0%, rgba(255,107,35,0.12), transparent 70%); pointer-events: none; animation: heroPulse 5s ease-in-out infinite; }
        @keyframes heroPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .notice-row { position: relative; background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.1); padding: 15px 20px; cursor: pointer; transition: all 0.2s; margin-bottom: 6px; display: flex; align-items: center; gap: 14px; flex-wrap: nowrap; text-decoration: none; color: inherit; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); }
        .notice-row:hover { border-color: rgba(255,107,35,0.35); background: rgba(20,30,50,0.85); transform: translateX(4px); box-shadow: -3px 0 0 rgba(255,107,35,0.5); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 160px; }
        .cat-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); white-space: nowrap; }
        @media (max-width: 640px) { .notice-form-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "clamp(24px, 4vw, 48px) clamp(16px, 4vw, 32px)", position: "relative" }}>
        <div className="hero-glow" />
        <div style={{ marginBottom: 24, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 3, height: 24, background: "#ff6b23", flexShrink: 0, boxShadow: "0 0 10px rgba(255,107,35,0.7)" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, letterSpacing: 2, whiteSpace: "nowrap", color: "#fff", textShadow: "0 0 24px rgba(255,107,35,0.35)" }}>오버클랜 공지사항</h1>
          </div>
          <p style={{ fontSize: 12, color: "#8892a4", margin: "0 0 14px 15px", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>클랜 운영 소식과 업데이트를 전해드려요</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-btn ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="검색..." style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "5px 12px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 12, outline: "none", width: 140 }} />
            {isAdmin && !showForm && (
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginLeft: 8 }}>+ 공지 작성</button>
            )}
            {isAdmin && showForm && (
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8892a4", padding: "8px 16px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", marginLeft: 8 }}>취소</button>
            )}
          </div>
        </div>

        {isAdmin && showForm && (
          <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: 24, marginBottom: 16 }}>
            <div className="notice-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
              <input className="input" placeholder="공지 제목" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "12px 16px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none" }}>
                {["공지", "업데이트", "이벤트"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <textarea className="input" placeholder="공지 내용" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ marginBottom: 10 }} />
            <div style={{ marginBottom: 10 }}>
              <input id="notice-image-input" type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
              <label htmlFor="notice-image-input" style={{ display: "inline-block", background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.2)", color: "#ff6b23", padding: "8px 16px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>이미지 첨부</label>
              {imagePreview && (
                <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
                  <img src={imagePreview} alt="" style={{ maxWidth: 200, maxHeight: 140, display: "block", borderRadius: 8, border: "1px solid rgba(255,107,35,0.2)" }} />
                  <button type="button" onClick={removeImage} style={{ position: "absolute", top: 6, right: 6, background: "rgba(8,12,20,0.85)", border: "1px solid rgba(255,107,35,0.3)", color: "#e8eaf0", width: 24, height: 24, borderRadius: "50%", cursor: "pointer", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" onClick={handlePost} disabled={saving}>{saving ? "등록 중..." : "등록"}</button>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8892a4", padding: "10px 20px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 13, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>취소</button>
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>공지가 없어요.</div>
          ) : filtered.map(n => (
            <a key={n.id} href={`/notice/${n.id}`} className="notice-row">
              <span className="cat-tag" style={{ background: `${categoryColor[n.category]}22`, color: categoryColor[n.category] || "#ff6b23", border: `1px solid ${categoryColor[n.category]}44`, flexShrink: 0 }}>{n.category}</span>
              <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
              <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>{new Date(n.created_at).toLocaleDateString("ko-KR")}</span>
              {isAdmin && <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(n.id); }} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 13, opacity: 0.5, flexShrink: 0 }}>🗑</button>}
            </a>
          ))}
          {!loading && hasMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button className="btn-primary" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "불러오는 중..." : "더보기"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
