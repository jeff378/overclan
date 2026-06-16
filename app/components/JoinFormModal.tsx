"use client";
import { useState } from "react";
import { visibleJoinFields, JOIN_TIERS, JOIN_POSITIONS, JOIN_TIMES, JoinField, JoinAnswer } from "../../lib/joinForm";

const isMulti = (t: string) => t === "position" || t === "playtime";

export default function JoinFormModal({
  clan,
  onClose,
  onSubmit,
  submitting,
}: {
  clan: any;
  onClose: () => void;
  onSubmit: (answers: JoinAnswer[]) => void;
  submitting: boolean;
}) {
  const accent = clan?.accent_color || "#ff6b23";
  const fields = visibleJoinFields(clan);
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    fields.forEach((f) => { init[f.key] = isMulti(f.type) ? [] : ""; });
    return init;
  });
  const [error, setError] = useState("");

  const setVal = (key: string, v: any) => setValues((prev) => ({ ...prev, [key]: v }));
  const togglePosition = (key: string, pos: string) => {
    setValues((prev) => {
      const cur: string[] = prev[key] || [];
      return { ...prev, [key]: cur.includes(pos) ? cur.filter((p) => p !== pos) : [...cur, pos] };
    });
  };

  const handleSubmit = () => {
    for (const f of fields) {
      const v = values[f.key];
      const empty = isMulti(f.type) ? !(v && v.length) : !String(v || "").trim();
      if (f.required && empty) { setError(`'${f.label}'을(를) 입력해주세요.`); return; }
    }
    const answers: JoinAnswer[] = fields
      .map((f) => {
        const v = values[f.key];
        const value = isMulti(f.type) ? (v || []).join(", ") : String(v || "").trim();
        return { key: f.key, label: f.label, value };
      })
      .filter((a) => a.value);
    setError("");
    onSubmit(answers);
  };

  const renderField = (f: JoinField) => {
    const v = values[f.key];
    if (f.type === "textarea") {
      return (
        <textarea className="jf-input" value={v} onChange={(e) => setVal(f.key, e.target.value)}
          placeholder="자유롭게 적어주세요" style={{ minHeight: 80, resize: "vertical" }} />
      );
    }
    if (f.type === "tier") {
      return (
        <select className="jf-input" value={v} onChange={(e) => setVal(f.key, e.target.value)}>
          <option value="">티어 선택</option>
          {JOIN_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      );
    }
    if (f.type === "position" || f.type === "playtime") {
      const opts = f.type === "position" ? JOIN_POSITIONS : JOIN_TIMES;
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {opts.map((opt) => {
            const on = (v || []).includes(opt);
            return (
              <button key={opt} type="button" onClick={() => togglePosition(f.key, opt)}
                style={{
                  background: on ? `${accent}22` : "rgba(13,20,35,0.8)",
                  border: `1px solid ${on ? accent : "rgba(255,255,255,0.1)"}`,
                  color: on ? accent : "#8892a4", padding: "8px 16px",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
                }}>{opt}</button>
            );
          })}
        </div>
      );
    }
    if (f.type === "yesno") {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          {["예", "아니오"].map((opt) => {
            const on = v === opt;
            return (
              <button key={opt} type="button" onClick={() => setVal(f.key, opt)}
                style={{
                  background: on ? `${accent}22` : "rgba(13,20,35,0.8)",
                  border: `1px solid ${on ? accent : "rgba(255,255,255,0.1)"}`,
                  color: on ? accent : "#8892a4", padding: "8px 22px",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
                }}>{opt}</button>
            );
          })}
        </div>
      );
    }
    // text
    return (
      <input className="jf-input" value={v} onChange={(e) => setVal(f.key, e.target.value)}
        placeholder={f.key === "battletag" ? "닉네임#1234" : ""} />
    );
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(4,7,12,0.78)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <style>{`
        .jf-input { background: rgba(13,20,35,0.9); border: 1px solid rgba(255,255,255,0.12); color: #e8eaf0; padding: 12px 14px; font-family: 'Noto Sans KR', sans-serif; font-size: 14px; outline: none; width: 100%; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
        .jf-input:focus { border-color: ${accent}; }
        .jf-input::placeholder { color: #5a6478; }
      `}</style>
      <div style={{
        width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto",
        background: "rgba(13,20,35,0.98)", border: `1px solid ${accent}55`, padding: "28px 26px",
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 1, color: "#fff" }}>가입 신청</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8892a4", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <p style={{ fontSize: 12.5, color: "#8892a4", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 22, lineHeight: 1.6 }}>
          <span style={{ color: accent, fontWeight: 700 }}>{clan?.name}</span> 클랜에 신청해요. 클랜장이 아래 정보를 보고 수락 여부를 결정해요.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 11.5, color: "#a8b0bf", letterSpacing: 0.5, fontWeight: 600, marginBottom: 8, display: "block", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {f.label}{f.required && <span style={{ color: accent }}> *</span>}
              </label>
              {renderField(f)}
            </div>
          ))}
        </div>

        {error && <div style={{ fontSize: 13, color: "#ef5350", marginTop: 16, fontFamily: "'Noto Sans KR', sans-serif" }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#8892a4",
            padding: 13, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
            clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
          }}>취소</button>
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 2, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: "none", color: "#fff",
            padding: 13, fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 1,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
            clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
          }}>{submitting ? "신청 중..." : "신청서 제출"}</button>
        </div>
      </div>
    </div>
  );
}
