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
  // 회원 탈퇴
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [ownedClan, setOwnedClan] = useState<any>(null);
  const [heirs, setHeirs] = useState<any[]>([]);
  const [clanMode, setClanMode] = useState<"delegate" | "delete" | null>(null);
  const [selectedHeir, setSelectedHeir] = useState("");
  const [processing, setProcessing] = useState(false);

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

  // 탈퇴 모달 열기 — 본인이 클랜장인 클랜과 위임 가능한 클랜원 조회
  const openWithdraw = async () => {
    setClanMode(null); setSelectedHeir(""); setProcessing(false);
    const { data: clans } = await supabase.from("clans").select("id, name").eq("owner_id", user.id);
    const clan = clans?.[0] || null;
    setOwnedClan(clan);
    if (clan) {
      const { data: members } = await supabase.from("clan_members").select("user_id").eq("clan_id", clan.id).neq("user_id", user.id);
      const list = await Promise.all((members || []).map(async (m: any) => {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", m.user_id).single();
        return { user_id: m.user_id, nickname: prof?.nickname || "이름없음" };
      }));
      setHeirs(list);
      setClanMode(list.length > 0 ? null : "delete"); // 위임할 클랜원이 없으면 삭제만 가능
    }
    setShowWithdraw(true);
  };

  // 최종 탈퇴 실행
  const confirmWithdraw = async () => {
    if (processing) return;
    // 클랜장인데 처리 방식 미선택이면 막기
    if (ownedClan && clanMode === null) { alert("클랜 처리 방식을 선택해주세요."); return; }
    if (ownedClan && clanMode === "delegate" && !selectedHeir) { alert("클랜장을 넘겨받을 클랜원을 선택해주세요."); return; }
    if (!confirm("정말 탈퇴하시겠어요?\n이 작업은 되돌릴 수 없어요.")) return;

    setProcessing(true);
    try {
      // 위임 선택 시: owner_id를 후계자로 변경 (이러면 RPC에서 이 클랜은 삭제되지 않음)
      if (ownedClan && clanMode === "delegate" && selectedHeir) {
        const { error: delegateErr } = await supabase.from("clans").update({ owner_id: selectedHeir }).eq("id", ownedClan.id);
        if (delegateErr) { alert("클랜장 위임에 실패했어요. 잠시 후 다시 시도해주세요."); setProcessing(false); return; }
        // 새 클랜장 알림
        await supabase.from("notifications").insert({ user_id: selectedHeir, type: "event", title: "클랜장이 되었어요", message: `${ownedClan.name}의 새 클랜장으로 임명되었어요.`, link: `/clan/${ownedClan.id}` });
      }
      // 계정 삭제 RPC
      const { error } = await supabase.rpc("delete_my_account");
      if (error) {
        console.error("탈퇴 오류:", error);
        alert("탈퇴 처리에 실패했어요. 관리자에게 문의해주세요.");
        setProcessing(false);
        return;
      }
      await supabase.auth.signOut();
      alert("탈퇴가 완료됐어요. 그동안 이용해주셔서 감사해요.");
      router.push("/");
    } catch (e) {
      console.error(e);
      alert("탈퇴 처리 중 문제가 발생했어요.");
      setProcessing(false);
    }
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

        {/* 회원 탈퇴 */}
        <div style={{ marginTop: 36 }}>
          <div style={{ fontSize: 13, color: "#ef5350", fontWeight: 700, letterSpacing: 1, marginBottom: 12, fontFamily: "Noto Sans KR, sans-serif" }}>⚠️ 위험 구역</div>
          <div style={{ background: "rgba(239,83,80,0.04)", border: "1px solid rgba(239,83,80,0.15)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 2 }}>회원 탈퇴</div>
              <div style={{ fontSize: 12, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.5 }}>계정과 모든 활동 기록이 삭제돼요. 되돌릴 수 없어요.</div>
            </div>
            <button onClick={openWithdraw} style={{ background: "rgba(239,83,80,0.12)", border: "1px solid rgba(239,83,80,0.4)", color: "#ef5350", padding: "9px 18px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", whiteSpace: "nowrap" }}>회원 탈퇴</button>
          </div>
        </div>

        {/* 탈퇴 모달 */}
        {showWithdraw && (
          <div onClick={() => !processing && setShowWithdraw(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#0d1423", border: "1px solid rgba(239,83,80,0.3)", maxWidth: 440, width: "100%", padding: "clamp(20px, 5vw, 32px)", clipPath: "polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 16, color: "#ef5350" }}>회원 탈퇴</div>

              {ownedClan ? (
                <>
                  <p style={{ fontSize: 13.5, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7, marginBottom: 18 }}>
                    회원님은 <span style={{ color: "#ff6b23", fontWeight: 700 }}>{ownedClan.name}</span>의 클랜장이에요.<br />
                    탈퇴 시 가입한 다른 클랜에서는 자동으로 나가지고, 내 클랜은 아래 선택에 따라 처리돼요.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                    {/* 위임 옵션 */}
                    <div onClick={() => heirs.length > 0 && setClanMode("delegate")} style={{ background: clanMode === "delegate" ? "rgba(255,107,35,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${clanMode === "delegate" ? "#ff6b23" : "rgba(255,255,255,0.1)"}`, padding: "14px 16px", cursor: heirs.length > 0 ? "pointer" : "not-allowed", opacity: heirs.length > 0 ? 1 : 0.45 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 3 }}>👑 클랜장 넘기고 탈퇴</div>
                      <div style={{ fontSize: 11.5, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.5 }}>{heirs.length > 0 ? "클랜원에게 클랜장을 넘기면 클랜은 사라지지 않아요." : "위임할 클랜원이 없어요."}</div>
                      {clanMode === "delegate" && heirs.length > 0 && (
                        <select value={selectedHeir} onChange={e => setSelectedHeir(e.target.value)} onClick={e => e.stopPropagation()} style={{ marginTop: 12, width: "100%", background: "#080c14", border: "1px solid rgba(255,107,35,0.3)", color: "#e8eaf0", padding: "9px 12px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none" }}>
                          <option value="">넘겨받을 클랜원 선택</option>
                          {heirs.map(h => <option key={h.user_id} value={h.user_id}>{h.nickname}</option>)}
                        </select>
                      )}
                    </div>

                    {/* 삭제 옵션 */}
                    <div onClick={() => setClanMode("delete")} style={{ background: clanMode === "delete" ? "rgba(239,83,80,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${clanMode === "delete" ? "#ef5350" : "rgba(255,255,255,0.1)"}`, padding: "14px 16px", cursor: "pointer" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e8eaf0", fontFamily: "Noto Sans KR, sans-serif", marginBottom: 3 }}>🗑 클랜 삭제하고 탈퇴</div>
                      <div style={{ fontSize: 11.5, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.5 }}>클랜과 모든 대전·공지 기록이 함께 사라져요.</div>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13.5, color: "#c8cad0", fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.7, marginBottom: 20 }}>
                  탈퇴하면 가입한 클랜에서 자동으로 나가지고, 프로필과 모든 활동 기록이 영구히 삭제돼요. 이 작업은 되돌릴 수 없어요.
                </p>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowWithdraw(false)} disabled={processing} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#a8b0c0", padding: "10px 20px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700, cursor: processing ? "default" : "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>취소</button>
                <button onClick={confirmWithdraw} disabled={processing} style={{ background: "rgba(239,83,80,0.9)", border: "none", color: "#fff", padding: "10px 22px", fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: processing ? "default" : "pointer", clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", opacity: processing ? 0.6 : 1 }}>{processing ? "처리 중..." : "탈퇴하기"}</button>
              </div>
            </div>
          </div>
        )}

        {saved && (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(255,107,35,0.95)", color: "#fff", padding: "10px 24px", borderRadius: 4, fontSize: 13, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 600, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
            ✓ 저장됐어요
          </div>
        )}
      </div>
    </div>
  );
}
