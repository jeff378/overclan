"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import ShareButton from "../../components/ShareButton";
import { ClanSuffix } from "../../components/ClanBadge";
import LikeButton from "../../components/LikeButton";
import ReportButton from "../../components/ReportButton";

export default function ReplayDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [myVote, setMyVote] = useState<string | null>(null);

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
      const { data } = await supabase.from("replay_posts").select("*").eq("id", id).single();
      if (data) {
        const prof = await fetchProfile(data.user_id);
        setPost({ ...data, profiles: prof, authorClan: await fetchClan(data.user_id) });
        const { data: cs } = await supabase.from("replay_comments").select("*").eq("post_id", id).order("created_at", { ascending: true });
        if (cs) {
          const withProfiles = await Promise.all(cs.map(async (c) => ({ ...c, profiles: await fetchProfile(c.user_id), authorClan: await fetchClan(c.user_id) })));
          setComments(withProfiles);
        }
        if (userData.user) {
          const { data: vote } = await supabase.from("replay_votes").select("vote").eq("post_id", id).eq("user_id", userData.user.id).single();
          if (vote) setMyVote(vote.vote);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleVote = async (vote: string) => {
    if (!user || myVote) return;
    if (!confirm(`'${vote}'에 투표하시겠습니까?\n한 번 투표하면 변경하거나 취소할 수 없어요.`)) return;
    await supabase.from("replay_votes").insert({ post_id: id, user_id: user.id, vote });
    const field = vote === "핵" ? "votes_hack" : "votes_clean";
    await supabase.from("replay_posts").update({ [field]: (post[field] || 0) + 1 }).eq("id", id);
    setPost((prev: any) => ({ ...prev, [field]: (prev[field] || 0) + 1 }));
    setMyVote(vote);
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const { data } = await supabase.from("replay_comments").insert({ post_id: id, user_id: user.id, content: comment }).select().single();
    if (data) {
      const prof = await fetchProfile(user.id);
      const myClan = await fetchClan(user.id);
      setComments(prev => [...prev, { ...data, profiles: prof, authorClan: myClan }]);
    }
    setComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("replay_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeletePost = async () => {
    if (!confirm("이 제보를 삭제할까요?")) return;
    await supabase.from("replay_posts").delete().eq("id", id);
    router.push("/replay");
  };

  const getVotePercent = () => {
    if (!post) return { hack: 0, clean: 0, total: 0 };
    const total = (post.votes_hack || 0) + (post.votes_clean || 0);
    if (total === 0) return { hack: 0, clean: 0, total: 0 };
    return { hack: Math.round((post.votes_hack / total) * 100), clean: Math.round((post.votes_clean / total) * 100), total };
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  if (!post) return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 20 }}>제보를 찾을 수 없어요.</div>
        <a href="/replay" style={{ color: "#ff6b23", textDecoration: "none" }}>← 목록으로</a>
      </div>
    </div>
  );

  const v = getVotePercent();

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .vote-btn { padding: 12px 20px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; border: none; flex: 1; }
        .vote-hack { background: rgba(239,83,80,0.2); color: #ef5350; border: 1px solid rgba(239,83,80,0.4) !important; }
        .vote-hack.voted, .vote-hack:hover:not(:disabled) { background: rgba(239,83,80,0.4); }
        .vote-clean { background: rgba(76,175,80,0.2); color: #4caf50; border: 1px solid rgba(76,175,80,0.4) !important; }
        .vote-clean.voted, .vote-clean:hover:not(:disabled) { background: rgba(76,175,80,0.4); }
        .vote-btn:disabled { cursor: default; }
        .comment-row { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .replay-code { background: rgba(255,107,35,0.1); border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 2px; padding: 4px 12px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); display: inline-block; }
        .btn-del { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 13px; opacity: 0.5; padding: 2px 6px; }
        .btn-del:hover { opacity: 1; color: #ef5350; }
        .back-link { color: #8892a4; text-decoration: none; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; transition: color 0.2s; }
        .back-link:hover { color: #ff6b23; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px)" }}>
        <a href="/replay" className="back-link" style={{ marginBottom: 20, display: "inline-block" }}>← 핵 의심 리플레이</a>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "clamp(20px, 4vw, 32px)", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
            <div style={{ minWidth: 0 }}>
              <span className="replay-code">{post.replay_code}</span>
              <div style={{ fontSize: 12, color: "#8892a4", marginTop: 10, fontFamily: "Noto Sans KR, sans-serif", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{post.profiles?.nickname}<ClanSuffix clan={post.authorClan} /> · {new Date(post.created_at).toLocaleDateString("ko-KR")}</div>
            </div>
            {(user?.id === post.user_id) ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <ShareButton title={`핵 의심 리플레이 ${post.replay_code} | 오버클랜`} />
                <button className="btn-del" onClick={handleDeletePost}>🗑 삭제</button>
              </div>
            ) : (
              <div style={{ flexShrink: 0, display: "flex", gap: 10, alignItems: "center" }}>
                <ShareButton title={`핵 의심 리플레이 ${post.replay_code} | 오버클랜`} />
                <ReportButton targetType="post" targetId={id as string} targetBoard="replay" />
              </div>
            )}
          </div>
          {post.description && <p style={{ fontSize: 15, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.8, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,107,35,0.1)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.description}</p>}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <LikeButton postType="replay" postId={id as string} />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 14, color: "#e8eaf0", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>이 유저, 핵인가요?</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button className={`vote-btn vote-hack ${myVote === "핵" ? "voted" : ""}`} onClick={() => handleVote("핵")} disabled={!!myVote || !user}>🚨 핵 맞음 ({post.votes_hack || 0})</button>
              <button className={`vote-btn vote-clean ${myVote === "정상" ? "voted" : ""}`} onClick={() => handleVote("정상")} disabled={!!myVote || !user}>✅ 정상 ({post.votes_clean || 0})</button>
            </div>
            {!user && <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", textAlign: "center", marginBottom: 12 }}><a href="/login" style={{ color: "#ff6b23", textDecoration: "none" }}>로그인</a> 후 투표할 수 있어요.</div>}
            {v.total > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: "#ef5350", fontWeight: 700 }}>핵 {v.hack}%</span>
                  <span style={{ color: "#4caf50", fontWeight: 700 }}>정상 {v.clean}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${v.hack}%`, height: "100%", background: "#ef5350", borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: "#8892a4", marginTop: 6, textAlign: "center" }}>총 {v.total}명 투표</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 12, color: "#e8eaf0", fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>댓글 {comments.length}</div>
          <div style={{ background: "rgba(13,20,35,0.5)", border: "1px solid rgba(255,107,35,0.08)", marginBottom: 16 }}>
            {comments.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13 }}>첫 댓글을 남겨보세요.</div>
            ) : comments.map(c => (
              <div key={c.id} className="comment-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#ff6b23", fontWeight: 600, marginBottom: 4, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{c.profiles?.nickname}<ClanSuffix clan={c.authorClan} /></div>
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
