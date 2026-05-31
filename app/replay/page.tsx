"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";

export default function ReplayPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ replay_code: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      const { data } = await supabase.from("replay_posts").select("*, profiles(nickname)").order("created_at", { ascending: false });
      setPosts(data || []);
      if (userData.user) {
        const { data: votes } = await supabase.from("replay_votes").select("post_id, vote").eq("user_id", userData.user.id);
        const voteMap: Record<string, string> = {};
        votes?.forEach(v => { voteMap[v.post_id] = v.vote; });
        setMyVotes(voteMap);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from("replay_comments").select("*, profiles(nickname)").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(data || []);
  };

  const handlePost = async () => {
    if (!form.replay_code) return;
    setSubmitting(true);
    const { data } = await supabase.from("replay_posts").insert({ ...form, user_id: user.id }).select("*, profiles(nickname)").single();
    if (data) setPosts(prev => [data, ...prev]);
    setForm({ replay_code: "", description: "" });
    setShowForm(false);
    setSubmitting(false);
  };

  const handleVote = async (post: any, vote: string) => {
    if (!user) return;
    if (myVotes[post.id]) return;
    await supabase.from("replay_votes").insert({ post_id: post.id, user_id: user.id, vote });
    const field = vote === "핵" ? "votes_hack" : "votes_clean";
    await supabase.from("replay_posts").update({ [field]: post[field] + 1 }).eq("id", post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, [field]: p[field] + 1 } : p));
    if (selected?.id === post.id) setSelected((prev: any) => ({ ...prev, [field]: prev[field] + 1 }));
    setMyVotes(prev => ({ ...prev, [post.id]: vote }));
  };

  const handleComment = async () => {
    if (!comment.trim() || !selected) return;
    const { data } = await supabase.from("replay_comments").insert({ post_id: selected.id, user_id: user.id, content: comment }).select("*, profiles(nickname)").single();
    if (data) setComments(prev => [...prev, data]);
    setComment("");
  };

  const handleSelect = (post: any) => {
    setSelected(post);
    loadComments(post.id);
  };

  const getVotePercent = (post: any) => {
    const total = post.votes_hack + post.votes_clean;
    if (total === 0) return { hack: 0, clean: 0, total: 0 };
    return { hack: Math.round((post.votes_hack / total) * 100), clean: Math.round((post.votes_clean / total) * 100), total };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .post-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 20px 24px; cursor: pointer; transition: all 0.2s; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); margin-bottom: 8px; }
        .post-card:hover, .post-card.active { border-color: rgba(255,107,35,0.4); background: rgba(20,30,50,0.9); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 80px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; display: block; }
        .vote-btn { padding: 10px 20px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; cursor: pointer; border: none; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .vote-hack { background: rgba(239,83,80,0.2); color: #ef5350; border: 1px solid rgba(239,83,80,0.4); }
        .vote-hack:hover, .vote-hack.voted { background: rgba(239,83,80,0.4); }
        .vote-clean { background: rgba(76,175,80,0.2); color: #4caf50; border: 1px solid rgba(76,175,80,0.4); }
        .vote-clean:hover, .vote-clean.voted { background: rgba(76,175,80,0.4); }
        .comment-row { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .replay-code { background: rgba(255,107,35,0.1); border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; padding: 4px 12px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>핵 의심 리플레이</h1>
          </div>
          {user && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "취소" : "리플레이 제보"}</button>}
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
              <button className="btn-primary" onClick={handlePost} disabled={submitting} style={{ alignSelf: "flex-start" }}>{submitting ? "등록 중..." : "제보하기"}</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.4fr" : "1fr", gap: 24 }}>
          {/* 글 목록 */}
          <div>
            {loading ? (
              <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>
                아직 제보된 리플레이가 없어요.
              </div>
            ) : posts.map(post => {
              const v = getVotePercent(post);
              return (
                <div key={post.id} className={`post-card ${selected?.id === post.id ? "active" : ""}`} onClick={() => handleSelect(post)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span className="replay-code">{post.replay_code}</span>
                  </div>
                  {post.description && <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 10, lineHeight: 1.5 }}>{post.description.slice(0, 60)}{post.description.length > 60 ? "..." : ""}</p>}
                  {v.total > 0 && (
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#ef5350", fontWeight: 700 }}>핵 {v.hack}%</span>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${v.hack}%`, height: "100%", background: "linear-gradient(90deg, #ef5350, #4caf50)", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#4caf50", fontWeight: 700 }}>정상 {v.clean}%</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#8892a4", marginTop: 8, fontFamily: "Noto Sans KR, sans-serif" }}>{post.profiles?.nickname} · 투표 {v.total}명</div>
                </div>
              );
            })}
          </div>

          {/* 상세 */}
          {selected && (
            <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <span className="replay-code" style={{ fontSize: 18 }}>{selected.replay_code}</span>
                  <div style={{ fontSize: 12, color: "#8892a4", marginTop: 8, fontFamily: "Noto Sans KR, sans-serif" }}>{selected.profiles?.nickname} · {new Date(selected.created_at).toLocaleDateString("ko-KR")}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>

              {selected.description && <p style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,107,35,0.1)" }}>{selected.description}</p>}

              {/* 투표 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 12, color: "#8892a4" }}>이 유저, 핵인가요?</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <button className={`vote-btn vote-hack ${myVotes[selected.id] === "핵" ? "voted" : ""}`} onClick={() => handleVote(selected, "핵")} disabled={!!myVotes[selected.id]}>
                    🚨 핵 맞음 ({selected.votes_hack})
                  </button>
                  <button className={`vote-btn vote-clean ${myVotes[selected.id] === "정상" ? "voted" : ""}`} onClick={() => handleVote(selected, "정상")} disabled={!!myVotes[selected.id]}>
                    ✅ 정상 ({selected.votes_clean})
                  </button>
                </div>
                {(selected.votes_hack + selected.votes_clean) > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: "#ef5350", fontWeight: 700 }}>핵 {getVotePercent(selected).hack}%</span>
                      <span style={{ color: "#4caf50", fontWeight: 700 }}>정상 {getVotePercent(selected).clean}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(239,83,80,0.3)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${getVotePercent(selected).hack}%`, height: "100%", background: "#ef5350", borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#8892a4", marginTop: 6, textAlign: "center" }}>총 {getVotePercent(selected).total}명 투표</div>
                  </div>
                )}
              </div>

              {/* 댓글 */}
              <div style={{ borderTop: "1px solid rgba(255,107,35,0.1)", paddingTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 12, color: "#8892a4" }}>댓글 {comments.length}</div>
                <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 12 }}>
                  {comments.map(c => (
                    <div key={c.id} className="comment-row">
                      <div style={{ fontSize: 12, color: "#ff6b23", fontWeight: 600, marginBottom: 4, fontFamily: "Rajdhani, sans-serif" }}>{c.profiles?.nickname}</div>
                      <div style={{ fontSize: 13, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.6 }}>{c.content}</div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
