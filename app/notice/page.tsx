"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";

const CATEGORIES = ["전체", "공지", "업데이트", "이벤트"];
const ADMIN_EMAIL = "jujin2271@gmail.com";

export default function NoticePage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("전체");
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "공지" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      if (userData.user?.email === ADMIN_EMAIL) setIsAdmin(true);
      const { data } = await supabase.from("site_notices").select("*").order("created_at", { ascending: false });
      setNotices(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handlePost = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    const { data } = await supabase.from("site_notices").insert({ ...form, user_id: user.id }).select().single();
    if (data) setNotices(prev => [data, ...prev]);
    setForm({ title: "", content: "", category: "공지" });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("공지를 삭제할까요?")) return;
    await supabase.from("site_notices").delete().eq("id", id);
    setNotices(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = filter === "전체" ? notices : notices.filter(n => n.category === filter);

  const categoryColor: Record<string, string> = {
    "공지": "#ff6b23", "업데이트": "#4fc3f7", "이벤트": "#4caf50"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 22px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
        .filter-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 6px 16px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition: all 0.2s; }
        .filter-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .notice-row { background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.08); padding: 16px 20px; cursor: pointer; transition: all 0.2s; margin-bottom: 4px; display: flex; align-items: center; gap: 14px; }
        .notice-row:hover, .notice-row.active { border-color: rgba(255,107,35,0.3); background: rgba(20,30,50,0.8); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 160px; }
        .cat-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%); white-space: nowrap; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>오버클랜 공지사항</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-btn ${filter === c ? "active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div style={{ marginBottom: 16 }}>
            {!showForm ? (
              <button className="btn-primary" onClick={() => setShowForm(true)}>+ 공지 작성</button>
            ) : (
              <div style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", padding: 24, marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
                  <input className="input" placeholder="공지 제목" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "12px 16px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none" }}>
                    {["공지", "업데이트", "이벤트"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <textarea className="input" placeholder="공지 내용" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ marginBottom: 10 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={handlePost} disabled={saving}>{saving ? "등록 중..." : "등록"}</button>
                  <button onClick={() => setShowForm(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#8892a4", padding: "10px 20px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>취소</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr", gap: 20 }}>
          <div>
            {loading ? (
              <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>공지가 없어요.</div>
            ) : filtered.map(n => (
              <div key={n.id} className={`notice-row ${selected?.id === n.id ? "active" : ""}`} onClick={() => setSelected(n)}>
                <span className="cat-tag" style={{ background: `${categoryColor[n.category]}22`, color: categoryColor[n.category] || "#ff6b23", border: `1px solid ${categoryColor[n.category]}44` }}>{n.category}</span>
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 15, fontWeight: 700, flex: 1 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", whiteSpace: "nowrap" }}>{new Date(n.created_at).toLocaleDateString("ko-KR")}</span>
                {isAdmin && <button onClick={e => { e.stopPropagation(); handleDelete(n.id); }} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 13, opacity: 0.5 }}>🗑</button>}
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span className="cat-tag" style={{ background: `${categoryColor[selected.category]}22`, color: categoryColor[selected.category] || "#ff6b23", border: `1px solid ${categoryColor[selected.category]}44`, marginBottom: 10, display: "inline-block" }}>{selected.category}</span>
                  <h2 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{selected.title}</h2>
                  <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{new Date(selected.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              <p style={{ fontSize: 14, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.9, whiteSpace: "pre-wrap", paddingTop: 16, borderTop: "1px solid rgba(255,107,35,0.1)" }}>{selected.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
