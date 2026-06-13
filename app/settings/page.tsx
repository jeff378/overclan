"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

const NOTIFY_SETTINGS = [
  { key: "notify_clan_request", icon: "📥", label: "클랜 가입 신청", desc: "내 클랜에 가입 신청이 오면 알려드려요" },
  { key: "notify_battle_request", icon: "⚔️", label: "클랜 대전 신청", desc: "다른 클랜이 대전을 신청하면 알려드려요" },
  { key: "notify_comment", icon: "💬", label: "댓글 알림", desc: "내 글에 댓글이 달리면 알려드려요" },
  { key: "notify_event", icon: "🎉", label: "이벤트 · 공지", desc: "오버클랜의 새 소식과 이벤트를 알려드려요" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      setUser(userData.user);
      const { data } = await supabase
        .from("profiles")
        .select("notify_clan_request, notify_battle_request, notify_comment, notify_event")
        .eq("id", userData.user.id)
        .single();
      // 값이 null이면 기본 true로
      setSettings({
        notify_clan_request: data?.notify_clan_request ?? true,
        notify_battle_request: data?.notify_battle_request ?? true,
        notify_comment: data?.notify_comment ?? true,
        notify_event: data?.notify_event ?? true,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  const toggle = async (key: string) => {
    const next = !settings[key];
    setSettings(prev => ({ ...prev, [key]: next }));
    await supabase.from("profiles").update({ [key]: next }).eq("id", user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .toggle { position: relative; width: 48px; height: 26px; flex-shrink: 0; cursor: pointer; }
        .toggle-track { position: absolute; inset: 0; border-radius: 13px; transition: background 0.2s; }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
        .setting-row { display: flex; align-items: center; gap: 16px; padding: 18px 20px; background: rgba(13,20,35,0.7); border: 1px solid rgba(255,107,35,0.08); margin-bottom: 8px; }
        .back-link { color: #8892a4; text-decoration: none; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; transition: color 0.2s; }
        .back-link:hover { color: #ff6b23; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(24px, 4vw, 48px) clamp(16px, 4vw, 32px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 3, height: 22, background: "#ff6b23", flexShrink: 0 }} />
          <h1 style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 700, letterSpacing: 2 }}>설정</h1>
        </div>
        <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 28, marginLeft: 15 }}>받고 싶은 알림만 선택하세요. 변경 사항은 자동 저장돼요.</p>

        {/* 알림 설정 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: "#ff6b23", fontWeight: 700, letterSpacing: 1, marginBottom: 12, fontFamily: "Noto Sans KR, sans-serif" }}>🔔 알림 설정</div>
          {NOTIFY_SETTINGS.map(s => (
            <div key={s.key} className="setting-row">
              <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>{s.desc}</div>
              </div>
              <div className="toggle" onClick={() => toggle(s.key)}>
                <div className="toggle-track" style={{ background: settings[s.key] ? "#ff6b23" : "rgba(255,255,255,0.15)" }} />
                <div className="toggle-thumb" style={{ transform: settings[s.key] ? "translateX(22px)" : "translateX(0)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* 계정 바로가기 */}
        <div>
          <div style={{ fontSize: 13, color: "#ff6b23", fontWeight: 700, letterSpacing: 1, marginBottom: 12, fontFamily: "Noto Sans KR, sans-serif" }}>👤 계정</div>
          <a href="/profile-edit" className="setting-row" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>✏️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif" }}>프로필 수정</div>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>닉네임, 배틀태그, 티어 등을 변경해요</div>
            </div>
            <span style={{ color: "#8892a4" }}>›</span>
          </a>
          <a href="/mypage" className="setting-row" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif" }}>마이페이지</div>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>내 클랜과 활동을 확인해요</div>
            </div>
            <span style={{ color: "#8892a4" }}>›</span>
          </a>
        </div>

        {saved && (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(255,107,35,0.95)", color: "#fff", padding: "10px 24px", borderRadius: 4, fontSize: 13, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
            ✓ 저장됐어요
          </div>
        )}
      </div>
    </div>
  );
}
