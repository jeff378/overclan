"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

const NOTIFY_SETTINGS = [
  { key: "notify_clan_request",  icon: "📥", label: "클랜 가입 신청",  desc: "내 클랜에 가입 신청이 오면 알려드려요" },
  { key: "notify_battle_request",icon: "⚔️", label: "클랜 대전 신청",  desc: "다른 클랜이 대전을 신청하면 알려드려요" },
  { key: "notify_comment",       icon: "💬", label: "댓글 알림",       desc: "내 글에 댓글이 달리면 알려드려요" },
  { key: "notify_event",         icon: "🎉", label: "이벤트 · 공지",   desc: "오버클랜의 새 소식과 이벤트를 알려드려요" },
];

const PRIVACY_SETTINGS = [
  { key: "battletag_public", icon: "🏷️", label: "배틀태그 공개",    desc: "다른 유저가 내 배틀태그를 볼 수 있어요" },
  { key: "activity_public",  icon: "📊", label: "활동 기록 공개",   desc: "대전 기록 등 활동 정보를 공개해요" },
];

const LANGUAGES = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸", soon: true },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser]       = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ownedClan, setOwnedClan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);

  // 탈퇴 모달
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [heirs, setHeirs]         = useState<any[]>([]);
  const [clanMode, setClanMode]   = useState<"delegate"|"delete"|null>(null);
  const [selectedHeir, setSelectedHeir] = useState("");
  const [processing, setProcessing]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      setUser(userData.user);

      const { data: prof } = await supabase.from("profiles")
        .select("notify_clan_request,notify_battle_request,notify_comment,notify_event,battletag_public,activity_public,language")
        .eq("id", userData.user.id).single();
      setProfile({
        notify_clan_request:  prof?.notify_clan_request  ?? true,
        notify_battle_request:prof?.notify_battle_request ?? true,
        notify_comment:       prof?.notify_comment        ?? true,
        notify_event:         prof?.notify_event          ?? true,
        battletag_public:     prof?.battletag_public      ?? true,
        activity_public:      prof?.activity_public       ?? true,
        language:             prof?.language              ?? "ko",
      });

      const { data: clanData } = await supabase.from("clans")
        .select("id,name,is_hidden").eq("owner_id", userData.user.id).single();
      if (clanData) setOwnedClan(clanData);

      setLoading(false);
    };
    load();
  }, [router]);

  // 프로필 boolean 토글 (자동저장)
  const toggle = async (key: string) => {
    const next = !profile[key];
    setProfile((p: any) => ({ ...p, [key]: next }));
    await supabase.from("profiles").update({ [key]: next }).eq("id", user.id);
    flash();
  };

  // 언어 변경
  const setLang = async (code: string) => {
    if (code === "en") return; // 준비중
    setProfile((p: any) => ({ ...p, language: code }));
    await supabase.from("profiles").update({ language: code }).eq("id", user.id);
    flash();
  };

  // 클랜 찾기 노출 토글 (clans 테이블)
  const toggleClanHidden = async () => {
    if (!ownedClan) return;
    const next = !ownedClan.is_hidden;
    setOwnedClan((c: any) => ({ ...c, is_hidden: next }));
    await supabase.from("clans").update({ is_hidden: next }).eq("id", ownedClan.id);
    flash();
  };

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1500); };

  // 탈퇴 모달 열기
  const openWithdraw = async () => {
    setClanMode(null); setSelectedHeir(""); setProcessing(false);
    if (ownedClan) {
      const { data: members } = await supabase.from("clan_members")
        .select("user_id").eq("clan_id", ownedClan.id).neq("user_id", user.id);
      const list = await Promise.all((members || []).map(async (m: any) => {
        const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", m.user_id).single();
        return { user_id: m.user_id, nickname: prof?.nickname || "이름없음" };
      }));
      setHeirs(list);
      setClanMode(list.length > 0 ? null : "delete");
    }
    setShowWithdraw(true);
  };

  const confirmWithdraw = async () => {
    if (processing) return;
    if (ownedClan && clanMode === null) { alert("클랜 처리 방식을 선택해주세요."); return; }
    if (ownedClan && clanMode === "delegate" && !selectedHeir) { alert("클랜장을 넘겨받을 클랜원을 선택해주세요."); return; }
    if (!confirm("정말 탈퇴하시겠어요?\n이 작업은 되돌릴 수 없어요.")) return;
    setProcessing(true);
    try {
      if (ownedClan && clanMode === "delegate" && selectedHeir) {
        const { error: e } = await supabase.from("clans").update({ owner_id: selectedHeir }).eq("id", ownedClan.id);
        if (e) { alert("클랜장 위임에 실패했어요."); setProcessing(false); return; }
        await supabase.from("notifications").insert({ user_id: selectedHeir, type: "event", title: "클랜장이 되었어요", message: `${ownedClan.name}의 새 클랜장으로 임명되었어요.`, link: `/clan/${ownedClan.id}` });
      }
      const { error } = await supabase.rpc("delete_my_account");
      if (error) { alert("탈퇴 처리에 실패했어요. 관리자에게 문의해주세요."); setProcessing(false); return; }
      await supabase.auth.signOut();
      alert("탈퇴가 완료됐어요. 그동안 이용해주셔서 감사해요.");
      router.push("/");
    } catch { alert("탈퇴 처리 중 문제가 발생했어요."); setProcessing(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background: "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#ff6b23", fontFamily:"'Cinzel', 'Rajdhani', sans-serif", letterSpacing:2 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background: "transparent", color:"#e8eaf0", fontFamily:"'Rajdhani','Noto Sans KR',sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        .toggle { position:relative; width:48px; height:26px; flex-shrink:0; cursor:pointer; }
        .toggle-track { position:absolute; inset:0; border-radius:13px; transition:background 0.2s; }
        .toggle-thumb { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform 0.2s; }
        .setting-row { display:flex; align-items:center; gap:16px; padding:18px 20px; background:rgba(13,20,35,0.7); border:1px solid rgba(255,107,35,0.08); margin-bottom:8px; transition:border-color 0.2s; }
        .setting-row:hover { border-color:rgba(255,107,35,0.18); }
        .section-label { font-size:13px; color:#ff6b23; font-weight:700; letter-spacing:1px; margin-bottom:12px; font-family:'Noto Sans KR',sans-serif; }
        .back-link { color:#8892a4; text-decoration:none; font-family:'Noto Sans KR',sans-serif; font-size:13px; }
        .back-link:hover { color:#ff6b23; }
        .lang-btn { background:rgba(13,20,35,0.7); border:1px solid rgba(255,107,35,0.08); padding:14px 20px; display:flex; align-items:center; gap:12px; cursor:pointer; flex:1; transition:all 0.2s; }
        .lang-btn:hover:not(.disabled) { border-color:rgba(255,107,35,0.3); }
        .lang-btn.active { border-color:#ff6b23; background:rgba(255,107,35,0.08); }
        .lang-btn.disabled { opacity:0.4; cursor:not-allowed; }
        .soon-tag { font-size:10px; background:rgba(255,107,35,0.15); color:#ff6b23; border:1px solid rgba(255,107,35,0.3); padding:2px 7px; font-family:'Cinzel','Rajdhani',sans-serif; font-weight:700; letter-spacing:1px; }
        a.setting-row { text-decoration:none; color:inherit; cursor:pointer; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth:700, margin:"0 auto", padding:"clamp(24px,4vw,48px) clamp(16px,4vw,32px) 80px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
          <div style={{ width:3, height:22, background:"#ff6b23", flexShrink:0 }} />
          <h1 style={{ fontFamily:"Rajdhani,sans-serif", fontSize:"clamp(20px,5vw,26px)", fontWeight:700, letterSpacing:2 }}>설정</h1>
        </div>
        <p style={{ fontSize:13, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif", marginBottom:36, marginLeft:15 }}>변경 사항은 자동으로 저장돼요.</p>

        {/* ── 알림 설정 ── */}
        <div style={{ marginBottom:36 }}>
          <div className="section-label">🔔 알림 설정</div>
          {NOTIFY_SETTINGS.map(s => (
            <div key={s.key} className="setting-row">
              <span style={{ fontSize:22, flexShrink:0 }}>{s.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:2 }}>{s.label}</div>
                <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>{s.desc}</div>
              </div>
              <div className="toggle" onClick={() => toggle(s.key)}>
                <div className="toggle-track" style={{ background: profile[s.key] ? "#ff6b23" : "rgba(255,255,255,0.15)" }} />
                <div className="toggle-thumb" style={{ transform: profile[s.key] ? "translateX(22px)" : "translateX(0)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── 공개 범위 ── */}
        <div style={{ marginBottom:36 }}>
          <div className="section-label">🔒 공개 범위</div>
          {PRIVACY_SETTINGS.map(s => (
            <div key={s.key} className="setting-row">
              <span style={{ fontSize:22, flexShrink:0 }}>{s.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:2 }}>{s.label}</div>
                <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>{s.desc}</div>
              </div>
              <div className="toggle" onClick={() => toggle(s.key)}>
                <div className="toggle-track" style={{ background: profile[s.key] ? "#ff6b23" : "rgba(255,255,255,0.15)" }} />
                <div className="toggle-thumb" style={{ transform: profile[s.key] ? "translateX(22px)" : "translateX(0)" }} />
              </div>
            </div>
          ))}

          {/* 클랜 찾기 노출 (클랜장만) */}
          {ownedClan && (
            <div className="setting-row">
              <span style={{ fontSize:22, flexShrink:0 }}>🔍</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:2 }}>클랜 찾기 노출</div>
                <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>
                  {ownedClan.is_hidden ? `"${ownedClan.name}"이 클랜 찾기에서 숨겨져 있어요` : `"${ownedClan.name}"이 클랜 찾기에 표시돼요`}
                </div>
              </div>
              <div className="toggle" onClick={toggleClanHidden}>
                <div className="toggle-track" style={{ background: !ownedClan.is_hidden ? "#ff6b23" : "rgba(255,255,255,0.15)" }} />
                <div className="toggle-thumb" style={{ transform: !ownedClan.is_hidden ? "translateX(22px)" : "translateX(0)" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── 언어 ── */}
        <div style={{ marginBottom:36 }}>
          <div className="section-label">🌐 언어 / Language</div>
          <div style={{ display:"flex", gap:8 }}>
            {LANGUAGES.map(l => (
              <div key={l.code} className={`lang-btn${profile.language === l.code ? " active" : ""}${l.soon ? " disabled" : ""}`} onClick={() => setLang(l.code)}>
                <span style={{ fontSize:22 }}>{l.flag}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif" }}>{l.label}</div>
                </div>
                {l.soon
                  ? <span className="soon-tag">SOON</span>
                  : profile.language === l.code && <span style={{ color:"#ff6b23", fontSize:16 }}>✓</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── 계정 ── */}
        <div style={{ marginBottom:36 }}>
          <div className="section-label">👤 계정</div>
          <a href="/profile-edit" className="setting-row">
            <span style={{ fontSize:22 }}>✏️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif" }}>프로필 수정</div>
              <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>닉네임, 배틀태그, 티어 등을 변경해요</div>
            </div>
            <span style={{ color:"#8892a4" }}>›</span>
          </a>
          <a href="/forgot-password" className="setting-row">
            <span style={{ fontSize:22 }}>🔑</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif" }}>비밀번호 변경</div>
              <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>이메일로 비밀번호 재설정 링크를 받아요</div>
            </div>
            <span style={{ color:"#8892a4" }}>›</span>
          </a>
          <a href="/mypage" className="setting-row">
            <span style={{ fontSize:22 }}>📋</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif" }}>마이페이지</div>
              <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>내 클랜과 활동을 확인해요</div>
            </div>
            <span style={{ color:"#8892a4" }}>›</span>
          </a>
        </div>

        {/* ── 차단 유저 목록 (미래 기능) ── */}
        <div style={{ marginBottom:36 }}>
          <div className="section-label">🚫 차단 목록</div>
          <div className="setting-row" style={{ opacity:0.5, cursor:"default" }}>
            <span style={{ fontSize:22, flexShrink:0 }}>🚷</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:2, display:"flex", alignItems:"center", gap:8 }}>
                차단한 유저
                <span style={{ fontSize:10, background:"rgba(255,107,35,0.15)", color:"#ff6b23", border:"1px solid rgba(255,107,35,0.3)", padding:"2px 7px", fontFamily:"Rajdhani,sans-serif", fontWeight:700, letterSpacing:1 }}>SOON</span>
              </div>
              <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif" }}>DM 기능 출시 후 차단한 유저 목록을 관리할 수 있어요</div>
            </div>
          </div>
        </div>

        {/* ── 위험 구역 ── */}
        <div>
          <div style={{ fontSize:13, color:"#ef5350", fontWeight:700, letterSpacing:1, marginBottom:12, fontFamily:"Noto Sans KR,sans-serif" }}>⚠️ 위험 구역</div>
          <div style={{ background:"rgba(239,83,80,0.04)", border:"1px solid rgba(239,83,80,0.15)", padding:"18px 20px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:2 }}>회원 탈퇴</div>
              <div style={{ fontSize:12, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif", lineHeight:1.5 }}>계정과 모든 활동 기록이 삭제돼요. 되돌릴 수 없어요.</div>
            </div>
            <button onClick={openWithdraw} style={{ background:"rgba(239,83,80,0.12)", border:"1px solid rgba(239,83,80,0.4)", color:"#ef5350", padding:"9px 18px", fontFamily:"Rajdhani,sans-serif", fontSize:12, fontWeight:700, letterSpacing:1, cursor:"pointer", clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", whiteSpace:"nowrap" }}>회원 탈퇴</button>
          </div>
        </div>

        {/* ── 탈퇴 모달 ── */}
        {showWithdraw && (
          <div onClick={() => !processing && setShowWithdraw(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:"#0d1423", border:"1px solid rgba(239,83,80,0.3)", maxWidth:440, width:"100%", padding:"clamp(20px,5vw,32px)", clipPath:"polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))", maxHeight:"85vh", overflowY:"auto" }}>
              <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:20, fontWeight:700, letterSpacing:1, marginBottom:16, color:"#ef5350" }}>회원 탈퇴</div>
              {ownedClan ? (
                <>
                  <p style={{ fontSize:13.5, color:"#c8cad0", fontFamily:"Noto Sans KR,sans-serif", lineHeight:1.7, marginBottom:18 }}>
                    회원님은 <span style={{ color:"#ff6b23", fontWeight:700 }}>{ownedClan.name}</span>의 클랜장이에요.<br/>
                    탈퇴 시 가입한 다른 클랜에서는 자동으로 나가지고, 내 클랜은 아래 선택에 따라 처리돼요.
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
                    <div onClick={() => heirs.length > 0 && setClanMode("delegate")} style={{ background:clanMode==="delegate"?"rgba(255,107,35,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${clanMode==="delegate"?"#ff6b23":"rgba(255,255,255,0.1)"}`, padding:"14px 16px", cursor:heirs.length>0?"pointer":"not-allowed", opacity:heirs.length>0?1:0.45 }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:3 }}>👑 클랜장 넘기고 탈퇴</div>
                      <div style={{ fontSize:11.5, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif", lineHeight:1.5 }}>{heirs.length>0?"클랜원에게 클랜장을 넘기면 클랜은 사라지지 않아요.":"위임할 클랜원이 없어요."}</div>
                      {clanMode==="delegate" && heirs.length>0 && (
                        <select value={selectedHeir} onChange={e=>setSelectedHeir(e.target.value)} onClick={e=>e.stopPropagation()} style={{ marginTop:12, width:"100%", background:"#080c14", border:"1px solid rgba(255,107,35,0.3)", color:"#e8eaf0", padding:"9px 12px", fontFamily:"Noto Sans KR,sans-serif", fontSize:13, outline:"none" }}>
                          <option value="">넘겨받을 클랜원 선택</option>
                          {heirs.map(h=><option key={h.user_id} value={h.user_id}>{h.nickname}</option>)}
                        </select>
                      )}
                    </div>
                    <div onClick={()=>setClanMode("delete")} style={{ background:clanMode==="delete"?"rgba(239,83,80,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${clanMode==="delete"?"#ef5350":"rgba(255,255,255,0.1)"}`, padding:"14px 16px", cursor:"pointer" }}>
                      <div style={{ fontSize:13.5, fontWeight:700, color:"#e8eaf0", fontFamily:"Noto Sans KR,sans-serif", marginBottom:3 }}>🗑 클랜 삭제하고 탈퇴</div>
                      <div style={{ fontSize:11.5, color:"#8892a4", fontFamily:"Noto Sans KR,sans-serif", lineHeight:1.5 }}>클랜과 모든 대전·공지 기록이 함께 사라져요.</div>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontSize:13.5, color:"#c8cad0", fontFamily:"Noto Sans KR,sans-serif", lineHeight:1.7, marginBottom:20 }}>
                  탈퇴하면 가입한 클랜에서 자동으로 나가지고, 프로필과 모든 활동 기록이 영구히 삭제돼요.
                </p>
              )}
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={()=>setShowWithdraw(false)} disabled={processing} style={{ background:"none", border:"1px solid rgba(255,255,255,0.15)", color:"#a8b0c0", padding:"10px 20px", fontFamily:"Rajdhani,sans-serif", fontSize:13, fontWeight:700, cursor:processing?"default":"pointer", clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>취소</button>
                <button onClick={confirmWithdraw} disabled={processing} style={{ background:"rgba(239,83,80,0.9)", border:"none", color:"#fff", padding:"10px 22px", fontFamily:"Rajdhani,sans-serif", fontSize:13, fontWeight:700, letterSpacing:1, cursor:processing?"default":"pointer", clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", opacity:processing?0.6:1 }}>{processing?"처리 중...":"탈퇴하기"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 자동저장 토스트 */}
      {saved && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"rgba(255,107,35,0.95)", color:"#fff", padding:"10px 24px", fontSize:13, fontFamily:"Noto Sans KR,sans-serif", fontWeight:600, zIndex:1000, boxShadow:"0 4px 16px rgba(0,0,0,0.4)", clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)", whiteSpace:"nowrap" }}>
          ✓ 저장됐어요
        </div>
      )}
    </div>
  );
}
