"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function ClanChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [clan, setClan] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [activeTab, setActiveTab] = useState("채팅");
  const chatEndRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      setUser(userData.user);

      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", userData.user.id).single();
      setProfile(prof);

      const { data: clanData } = await supabase.from("clans").select("*").eq("id", id).single();
      setClan(clanData);
      setIsOwner(clanData?.owner_id === userData.user.id);

      const { data: mem } = await supabase.from("clan_members").select("*").eq("clan_id", id).eq("user_id", userData.user.id).single();
      if (!mem) { router.push(`/clan/${id}`); return; }
      setIsMember(true);

      const { data: chatData } = await supabase.from("clan_chats").select("*").eq("clan_id", id).order("created_at", { ascending: true }).limit(100);
      const chatsWithProfiles = await Promise.all((chatData || []).map(async (c: any) => {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", c.user_id).single();
        return { ...c, profiles: prof };
      }));
      setChats(chatsWithProfiles);

      const { data: noticeData } = await supabase.from("clan_notices").select("*").eq("clan_id", id).order("created_at", { ascending: false });
      const noticesWithProfiles = await Promise.all((noticeData || []).map(async (n: any) => {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", n.user_id).single();
        return { ...n, profiles: prof };
      }));
      setNotices(noticesWithProfiles);
    };
    load();

    // 실시간 채팅 구독
    const channel = supabase.channel(`clan_chat_${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "clan_chats", filter: `clan_id=eq.${id}` }, async (payload) => {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", payload.new.user_id).single();
        setChats(prev => [...prev, { ...payload.new, profiles: prof }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await supabase.from("clan_chats").insert({ clan_id: id, user_id: user.id, message });
    setMessage("");
  };

  const handleNotice = async () => {
    if (!noticeTitle || !noticeContent) return;
    const { data } = await supabase.from("clan_notices").insert({ clan_id: id, user_id: user.id, title: noticeTitle, content: noticeContent }).select().single();
    if (data) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      setNotices(prev => [{ ...data, profiles: prof }, ...prev]);
    }
    setNoticeTitle(""); setNoticeContent(""); setShowNoticeForm(false);
  };

  const handleDeleteNotice = async (noticeId: string) => {
    await supabase.from("clan_notices").delete().eq("id", noticeId);
    setNotices(prev => prev.filter(n => n.id !== noticeId));
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: transparent; border: none; color: #8892a4; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #ff6b23; border-bottom-color: #ff6b23; }
        .chat-bubble { max-width: 70%; padding: 10px 14px; margin-bottom: 8px; border-radius: 2px; }
        .chat-mine { background: rgba(255,107,35,0.15); border: 1px solid rgba(255,107,35,0.2); align-self: flex-end; }
        .chat-other { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,255,255,0.06); align-self: flex-start; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 16px; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; outline: none; width: 100%; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: none; min-height: 80px; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); white-space: nowrap; }
        .btn-small { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 6px 14px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; cursor: pointer; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .notice-card { background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.12); padding: 18px 20px; margin-bottom: 8px; }
        .notice-card.pinned { border-color: rgba(255,107,35,0.35); background: rgba(255,107,35,0.05); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ff6b23; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{clan?.badge}</span>
            <div>
              <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700 }}>{clan?.name}</h1>
              <a href={`/clan/${id}`} style={{ fontSize: 11, color: "#8892a4", textDecoration: "none" }}>← 클랜 페이지</a>
            </div>
          </div>
  
        </div>

        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,107,35,0.1)", marginBottom: 20, display: "flex" }}>
          {["채팅"].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        {/* 채팅 탭 */}
        {activeTab === "채팅" && (
          <div>
            <div style={{ height: 480, overflowY: "auto", background: "rgba(13,20,35,0.5)", border: "1px solid rgba(255,107,35,0.08)", padding: "16px", marginBottom: 12, display: "flex", flexDirection: "column" }}>
              {chats.length === 0 && (
                <div style={{ textAlign: "center", color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, margin: "auto" }}>첫 번째 메시지를 보내보세요!</div>
              )}
              {chats.map(c => (
                <div key={c.id} className={`chat-bubble ${c.user_id === user?.id ? "chat-mine" : "chat-other"}`}>
                  {c.user_id !== user?.id && (
                    <div style={{ fontSize: 11, color: "#ff6b23", fontWeight: 600, marginBottom: 4, fontFamily: "'Cinzel', 'Rajdhani', sans-serif" }}>{c.profiles?.nickname}</div>
                  )}
                  <div style={{ fontSize: 13, fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.5 }}>{c.message}</div>
                  <div style={{ fontSize: 10, color: "#8892a4", marginTop: 4, textAlign: c.user_id === user?.id ? "right" : "left" }}>
                    {new Date(c.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="메시지를 입력하세요" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} />
              <button className="btn-primary" onClick={handleSend}>전송</button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
