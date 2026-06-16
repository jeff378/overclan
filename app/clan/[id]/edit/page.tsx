"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { VIBE_TAGS, ACCENT_COLORS, BANNER_COLORS, uploadClanImage } from "../../../../lib/clanCustomization";
import { isValueTaken } from "../../../../lib/validate";
import { resolveJoinFields, DEFAULT_JOIN_FIELDS, JoinField, JoinFieldType } from "../../../../lib/joinForm";

const BADGES = ["🔥", "🐺", "⚡", "🗡️", "✨", "🌑", "🌅", "🔴", "🦅", "🐉", "⚔️", "🛡️"];
const TIMES = ["아침", "저녁", "밤", "새벽", "주말"];
const STYLES = ["경쟁", "캐주얼", "친목"];

export default function EditClanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", tag: "", description: "", badge: "🔥",
    play_time: "저녁", style: "캐주얼", max_members: 50,
    discord_link: "", slogan: "", join_condition: "", banner_color: "#1a1f35",
    accent_color: "#ff6b23", vibe_tags: [] as string[], banner_image: "", emblem_image: "",
  });
  const [joinFields, setJoinFields] = useState<JoinField[]>(DEFAULT_JOIN_FIELDS);
  const [newQLabel, setNewQLabel] = useState("");
  const [newQType, setNewQType] = useState<JoinFieldType>("text");

  const toggleVibe = (tag: string) => {
    setForm(f => ({
      ...f,
      vibe_tags: f.vibe_tags.includes(tag)
        ? f.vibe_tags.filter(t => t !== tag)
        : f.vibe_tags.length >= 5 ? f.vibe_tags : [...f.vibe_tags, tag]
    }));
  };

  const updateJoinField = (key: string, patch: Partial<JoinField>) =>
    setJoinFields(prev => prev.map(f => f.key === key ? { ...f, ...patch } : f));
  const removeJoinField = (key: string) =>
    setJoinFields(prev => prev.filter(f => f.key !== key));
  const addCustomField = () => {
    const label = newQLabel.trim();
    if (!label) return;
    setJoinFields(prev => [...prev, { key: `custom_${Date.now()}`, label, type: newQType, required: false, enabled: true }]);
    setNewQLabel("");
    setNewQType("text");
  };
  const TYPE_LABEL: Record<string, string> = { text: "단답", textarea: "장문", yesno: "예·아니오", position: "포지션", tier: "티어" };

  const handleImageUpload = async (e: any, type: "banner" | "emblem") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    setError("");
    const { url, error: upErr } = await uploadClanImage(file, id, type);
    setUploading("");
    if (upErr) { setError(upErr); return; }
    setForm(f => ({ ...f, [type === "banner" ? "banner_image" : "emblem_image"]: url }));
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { router.push("/login"); return; }
      const { data: clan } = await supabase.from("clans").select("*").eq("id", id).single();
      if (!clan || clan.owner_id !== userData.user.id) { router.push("/"); return; }
      setForm({
        name: clan.name, tag: clan.tag, description: clan.description || "",
        badge: clan.badge, play_time: clan.play_time,
        style: clan.style, max_members: clan.max_members,
        discord_link: clan.discord_link || "",
        slogan: clan.slogan || "",
        join_condition: clan.join_condition || "",
        banner_color: clan.banner_color || "#1a1f35",
        accent_color: clan.accent_color || "#ff6b23",
        vibe_tags: clan.vibe_tags || [],
        banner_image: clan.banner_image || "",
        emblem_image: clan.emblem_image || "",
      });
      setJoinFields(resolveJoinFields(clan));
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!form.name || !form.tag || !form.description) { setError("클랜명, 태그, 소개를 입력해주세요."); return; }
    if (form.name.length > 12) { setError("클랜명은 12자 이내로 입력해주세요."); return; }
    if (await isValueTaken("clans", "name", form.name, id as string)) { setError("이미 사용 중인 클랜명이에요."); return; }
    if (await isValueTaken("clans", "tag", form.tag.toUpperCase(), id as string)) { setError("이미 사용 중인 클랜 태그예요."); return; }
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("clans").update({
      name: form.name, tag: form.tag.toUpperCase(), description: form.description,
      badge: form.badge, play_time: form.play_time,
      style: form.style, max_members: form.max_members,
      discord_link: form.discord_link, slogan: form.slogan,
      join_condition: form.join_condition, banner_color: form.banner_color,
      accent_color: form.accent_color, vibe_tags: form.vibe_tags,
      banner_image: form.banner_image || null, emblem_image: form.emblem_image || null,
      join_form: joinFields,
    }).eq("id", id);
    if (updateError) { setError(updateError.message.includes("unique") ? "이미 사용 중인 클랜명 또는 태그예요." : "저장에 실패했어요. 다시 시도해주세요."); setSaving(false); return; }
    router.push(`/clan/${id}`);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 14px 18px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; }
        .input:focus { border-color: #ff6b23; }
        .input::placeholder { color: #8892a4; }
        textarea.input { resize: vertical; min-height: 100px; }
        .label { font-size: 11px; color: #8892a4; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; display: block; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 14px 36px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-back { background: transparent; border: 1px solid rgba(255,107,35,0.3); color: #ff6b23; padding: 13px 24px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
        .select-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 8px 16px; font-family: 'Cinzel', 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .select-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .badge-btn { font-size: 24px; padding: 8px; background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .badge-btn.active { border-color: #ff6b23; background: rgba(255,107,35,0.15); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 3, height: 22, background: "#ff6b23" }} />
            <h1 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>클랜 정보 수정</h1>
          </div>
          <a href={`/clan/${id}`} className="btn-back">← 돌아가기</a>
        </div>

        <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "36px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label className="label">클랜 배지</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BADGES.map(b => (
                <button key={b} className={`badge-btn ${form.badge === b ? "active" : ""}`} onClick={() => setForm({ ...form, badge: b })}>{b}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">클랜명 * (최대 12자)</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={12} />
          </div>
          <div>
            <label className="label">클랜 태그 * (최대 6자)</label>
            <input className="input" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value.toUpperCase() })} maxLength={6} />
          </div>
          <div>
            <label className="label">클랜 소개 *</label>
            <div style={{ border: "1px solid rgba(255,107,35,0.2)", background: "rgba(13,20,35,0.9)" }}>
              {/* 툴바 */}
              <div style={{ display: "flex", gap: 4, padding: "8px 10px", borderBottom: "1px solid rgba(255,107,35,0.1)", flexWrap: "wrap" }}>
                {[
                  { label: "B", title: "굵게", wrap: ["**", "**"], insert: null },
                  { label: "줄바꿈", title: "줄 바꾸기", wrap: null, insert: "\n" },
                  { label: "• 목록", title: "목록", wrap: null, insert: "\n• " },
                  { label: "📌", title: "구분선", wrap: null, insert: "\n───────────\n" },
                ].map(btn => (
                  <button key={btn.label} title={btn.title} type="button"
                    onClick={() => {
                      const ta = document.getElementById("desc-editor") as HTMLTextAreaElement;
                      const start = ta.selectionStart, end = ta.selectionEnd;
                      const selected = form.description.slice(start, end);
                      let newText = form.description;
                      if (btn.wrap) {
                        newText = form.description.slice(0, start) + btn.wrap[0] + selected + btn.wrap[1] + form.description.slice(end);
                      } else if (btn.insert) {
                        newText = form.description.slice(0, start) + btn.insert + form.description.slice(end);
                      }
                      setForm({ ...form, description: newText });
                      setTimeout(() => { ta.focus(); ta.setSelectionRange(start + (btn.wrap ? btn.wrap[0].length : btn.insert!.length), end + (btn.wrap ? btn.wrap[0].length : btn.insert!.length)); }, 0);
                    }}
                    style={{ background: "rgba(255,107,35,0.08)", border: "1px solid rgba(255,107,35,0.15)", color: "#ff6b23", padding: "3px 10px", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 2 }}>
                    {btn.label}
                  </button>
                ))}
                <span style={{ fontSize: 10, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", alignSelf: "center", marginLeft: 4 }}>**텍스트** → 굵게</span>
              </div>
              <textarea id="desc-editor" className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ border: "none", minHeight: 140, resize: "vertical" }} placeholder="클랜을 소개하는 글을 작성해주세요." />
            </div>
          </div>
          <div>
            <label className="label">주 활동 시간</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIMES.map(t => (
                <button key={t} className={`select-btn ${form.play_time === t ? "active" : ""}`} onClick={() => setForm({ ...form, play_time: t })}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">클랜 성향</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STYLES.map(s => (
                <button key={s} className={`select-btn ${form.style === s ? "active" : ""}`} onClick={() => setForm({ ...form, style: s })}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">최대 클랜원 수</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)" }}>
              <input type="range" min={5} max={50} step={5} value={form.max_members} onChange={e => setForm({ ...form, max_members: Number(e.target.value) })} style={{ flex: 1, accentColor: "#ff6b23" }} />
              <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, color: "#ff6b23", minWidth: 48, textAlign: "right" }}>{form.max_members}명</span>
            </div>
          </div>
          <div>
            <label className="label">클랜 슬로건</label>
            <input className="input" placeholder="클랜을 한 줄로 표현해보세요" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} />
          </div>
          <div>
            <label className="label">가입 조건</label>
            <textarea className="input" style={{minHeight: "80px", resize: "vertical"}} placeholder="나이, 티어, 마이크 필수 여부 등 가입 조건을 적어주세요" value={form.join_condition} onChange={e => setForm({ ...form, join_condition: e.target.value })} />
          </div>
          <div>
            <label className="label">가입 신청 양식 — 신청자가 작성하는 항목 ('가입 신청' 버튼 → 이 양식)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(13,20,35,0.6)", border: "1px solid rgba(255,107,35,0.15)", padding: 14 }}>
              {joinFields.map(f => {
                const custom = f.key.startsWith("custom_");
                const shown = f.enabled !== false;
                return (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 10px", background: "rgba(8,12,20,0.5)", border: "1px solid rgba(255,107,35,0.08)" }}>
                    <span style={{ flex: 1, minWidth: 120, fontSize: 13, fontFamily: "Noto Sans KR, sans-serif", color: "#e8eaf0" }}>
                      {f.label}
                      <span style={{ fontSize: 10, color: "#8892a4", marginLeft: 6 }}>{TYPE_LABEL[f.type] || f.type}</span>
                    </span>
                    {f.locked ? (
                      <span style={{ fontSize: 11, color: "#ff6b23", fontWeight: 700, fontFamily: "Noto Sans KR, sans-serif" }}>항상 필수</span>
                    ) : (
                      <>
                        <button type="button" onClick={() => updateJoinField(f.key, { enabled: !shown })}
                          className={`select-btn ${shown ? "active" : ""}`} style={{ fontSize: 11, padding: "5px 12px", fontFamily: "Noto Sans KR, sans-serif" }}>
                          {shown ? "표시" : "숨김"}
                        </button>
                        <button type="button" onClick={() => updateJoinField(f.key, { required: !f.required })}
                          className={`select-btn ${f.required ? "active" : ""}`} style={{ fontSize: 11, padding: "5px 12px", fontFamily: "Noto Sans KR, sans-serif" }}>
                          {f.required ? "필수" : "선택"}
                        </button>
                        {custom && (
                          <button type="button" onClick={() => removeJoinField(f.key)}
                            style={{ background: "none", border: "1px solid rgba(239,83,80,0.4)", color: "#ef5350", fontSize: 11, padding: "5px 10px", cursor: "pointer", fontFamily: "Noto Sans KR, sans-serif" }}>삭제</button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4, alignItems: "center" }}>
                <input value={newQLabel} onChange={e => setNewQLabel(e.target.value)} placeholder="질문 추가 (예: 마이크 가능?)" maxLength={30}
                  style={{ flex: 1, minWidth: 140, background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#e8eaf0", padding: "9px 12px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none" }} />
                <select value={newQType} onChange={e => setNewQType(e.target.value as JoinFieldType)}
                  style={{ background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.2)", color: "#8892a4", padding: "9px 10px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, outline: "none" }}>
                  <option value="text">단답</option>
                  <option value="textarea">장문</option>
                  <option value="yesno">예·아니오</option>
                </select>
                <button type="button" onClick={addCustomField} className="select-btn" style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 13 }}>+ 추가</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#8892a4", marginTop: 8, fontFamily: "Noto Sans KR, sans-serif", lineHeight: 1.6 }}>배틀태그는 본인 확인에 쓰여 항상 받아요. 나머지는 표시/숨김·필수/선택을 정하거나 질문을 추가할 수 있어요.</div>
          </div>
          <div>
            <label className="label">디스코드 초대 링크</label>
            <input className="input" placeholder="https://discord.gg/..." value={form.discord_link} onChange={e => setForm({ ...form, discord_link: e.target.value })} />
          </div>
          <div>
            <label className="label">배너 색상</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {BANNER_COLORS.map(c => (
                <div key={c} onClick={() => setForm({ ...form, banner_color: c })} style={{ width: 32, height: 32, background: c, border: form.banner_color === c ? "2px solid #ff6b23" : "2px solid transparent", borderRadius: 4, cursor: "pointer" }} />
              ))}
              <input type="color" value={form.banner_color} onChange={e => setForm({ ...form, banner_color: e.target.value })} style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer" }} />
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,107,35,0.15)", margin: "4px 0" }} />
          <div style={{ fontSize: 13, color: "#ff6b23", fontWeight: 700, fontFamily: "Noto Sans KR, sans-serif", letterSpacing: 1 }}>✨ 클랜 개성 꾸미기</div>

          <div>
            <label className="label">클랜 대표 색 — 프로필 페이지 전체 포인트 컬러</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {ACCENT_COLORS.map(c => (
                <div key={c} onClick={() => setForm({ ...form, accent_color: c })} style={{ width: 34, height: 34, background: c, border: form.accent_color === c ? "3px solid #fff" : "2px solid transparent", borderRadius: "50%", cursor: "pointer", boxShadow: form.accent_color === c ? `0 0 12px ${c}` : "none", transition: "all 0.15s" }} />
              ))}
              <input type="color" value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer" }} />
            </div>
          </div>

          <div>
            <label className="label">분위기 태그 — 클랜 성격을 한눈에 (최대 5개)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VIBE_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleVibe(tag)}
                  className={`select-btn ${form.vibe_tags.includes(tag) ? "active" : ""}`}
                  style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12 }}>
                  {form.vibe_tags.includes(tag) ? "✓ " : ""}{tag}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#8892a4", marginTop: 8, fontFamily: "Noto Sans KR, sans-serif" }}>{form.vibe_tags.length}/5 선택됨</div>
          </div>

          <div>
            <label className="label">배너 이미지 — 클랜 대표 이미지 (최대 3MB)</label>
            {form.banner_image && (
              <div style={{ position: "relative", marginBottom: 10 }}>
                <img src={form.banner_image} alt="배너" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(255,107,35,0.2)" }} />
                <button type="button" onClick={() => setForm({ ...form, banner_image: "" })} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", borderRadius: 4, fontFamily: "Noto Sans KR, sans-serif" }}>삭제</button>
              </div>
            )}
            <label style={{ display: "inline-block", background: "rgba(255,107,35,0.08)", border: "1px solid rgba(255,107,35,0.25)", color: "#ff6b23", padding: "10px 20px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, cursor: "pointer", borderRadius: 2 }}>
              {uploading === "banner" ? "업로드 중..." : form.banner_image ? "다른 이미지로 변경" : "📷 배너 이미지 올리기"}
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, "banner")} style={{ display: "none" }} disabled={uploading === "banner"} />
            </label>
          </div>

          <div>
            <label className="label">커스텀 엠블럼 — 이모지 대신 클랜 로고 (최대 1MB)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {form.emblem_image ? (
                <div style={{ position: "relative" }}>
                  <img src={form.emblem_image} alt="엠블럼" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,107,35,0.3)" }} />
                  <button type="button" onClick={() => setForm({ ...form, emblem_image: "" })} style={{ position: "absolute", top: -6, right: -6, background: "#ef5350", border: "none", color: "#fff", width: 20, height: 20, fontSize: 12, cursor: "pointer", borderRadius: "50%", lineHeight: 1 }}>×</button>
                </div>
              ) : (
                <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "rgba(13,20,35,0.9)", border: "1px solid rgba(255,107,35,0.15)", borderRadius: 8 }}>{form.badge}</div>
              )}
              <label style={{ display: "inline-block", background: "rgba(255,107,35,0.08)", border: "1px solid rgba(255,107,35,0.25)", color: "#ff6b23", padding: "10px 20px", fontFamily: "Noto Sans KR, sans-serif", fontSize: 13, cursor: "pointer", borderRadius: 2 }}>
                {uploading === "emblem" ? "업로드 중..." : form.emblem_image ? "변경" : "🖼️ 로고 올리기"}
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, "emblem")} style={{ display: "none" }} disabled={uploading === "emblem"} />
              </label>
              <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>로고가 없으면 이모지 배지가 표시돼요</span>
            </div>
          </div>
          {error && <div style={{ fontSize: 13, color: "#ef5350", fontFamily: "Noto Sans KR, sans-serif" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장하기"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
