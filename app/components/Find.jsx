import { useState } from "react";

const clans = [
  { name: "Phoenix Squad", tag: "PHNX", tier: "마스터+", members: 24, maxMembers: 30, wins: 18, time: "저녁", style: "경쟁", badge: "🔥", desc: "진지하게 클랜대전 참여할 분 모집합니다. 마스터 이상 우대.", premium: true },
  { name: "Iron Wolves", tag: "IRON", tier: "다이아", members: 19, maxMembers: 30, wins: 14, time: "밤", style: "캐주얼", badge: "🐺", desc: "부담 없이 같이 즐길 수 있는 클랜이에요. 탱커 환영!", premium: true },
  { name: "Storm Legion", tag: "STRM", tier: "플래티넘", members: 31, maxMembers: 50, wins: 11, time: "주말", style: "경쟁", badge: "⚡", desc: "주말 클랜대전 집중 운영. 팀플레이 중시합니다.", premium: true },
  { name: "Silent Edge", tag: "EDGE", tier: "마스터+", members: 12, maxMembers: 20, wins: 9, time: "새벽", style: "경쟁", badge: "🗡️", desc: "새벽 게이머 모여라. 조용하지만 실력은 확실합니다.", premium: false },
  { name: "Nova Force", tag: "NOVA", tier: "골드", members: 8, maxMembers: 30, wins: 5, time: "저녁", style: "친목", badge: "✨", desc: "초보자도 환영! 같이 성장하는 클랜입니다.", premium: false },
  { name: "Dark Matter", tag: "DARK", tier: "다이아", members: 22, maxMembers: 30, wins: 13, time: "밤", style: "경쟁", badge: "🌑", desc: "다이아~마스터 실력자 모집. 정기 클랜대전 참여 필수.", premium: true },
  { name: "Sunrise Club", tag: "SUN", tier: "플래티넘", members: 15, maxMembers: 25, wins: 7, time: "아침", style: "친목", badge: "🌅", desc: "아침형 인간 모여라! 부담 없이 즐기는 클랜.", premium: false },
  { name: "Code Red", tag: "CRED", tier: "마스터+", members: 9, maxMembers: 15, wins: 16, time: "밤", style: "경쟁", badge: "🔴", desc: "소규모 정예 클랜. 실력자만 지원 가능합니다.", premium: false },
];

const tierColors = {
  "마스터+": { color: "#ff6b23", border: "rgba(255,107,35,0.4)" },
  "다이아": { color: "#4fc3f7", border: "rgba(79,195,247,0.4)" },
  "플래티넘": { color: "#b0bec5", border: "rgba(176,190,197,0.4)" },
  "골드": { color: "#ffd54f", border: "rgba(255,213,79,0.4)" },
};

export default function OverClanFind() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("전체");
  const [timeFilter, setTimeFilter] = useState("전체");
  const [styleFilter, setStyleFilter] = useState("전체");

  const filtered = clans.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.tag.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "전체" || c.tier === tierFilter;
    const matchTime = timeFilter === "전체" || c.time === timeFilter;
    const matchStyle = styleFilter === "전체" || c.style === styleFilter;
    return matchSearch && matchTier && matchTime && matchStyle;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .nav-link { color: #8892a4; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: color 0.2s; }
        .nav-link:hover { color: #ff6b23; }

        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 12px 28px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,35,0.4); }

        .filter-btn { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.15); color: #8892a4; padding: 7px 16px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .filter-btn.active { background: rgba(255,107,35,0.15); border-color: #ff6b23; color: #ff6b23; }
        .filter-btn:hover { border-color: rgba(255,107,35,0.4); color: #e8eaf0; }

        .clan-card { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.1); padding: 24px; position: relative; transition: all 0.3s; cursor: pointer; clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); }
        .clan-card:hover { border-color: rgba(255,107,35,0.4); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(255,107,35,0.1); }

        .search-input { background: rgba(13,20,35,0.8); border: 1px solid rgba(255,107,35,0.2); color: #e8eaf0; padding: 12px 20px 12px 44px; font-family: 'Rajdhani', sans-serif; font-size: 14px; letter-spacing: 1px; outline: none; width: 100%; clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%); transition: border-color 0.2s; }
        .search-input:focus { border-color: #ff6b23; }
        .search-input::placeholder { color: #8892a4; }

        .tier-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; border: 1px solid; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }
        .style-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 2px 8px; background: rgba(255,255,255,0.05); clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }

        .btn-join { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 8px 20px; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); transition: all 0.2s; }
        .btn-join:hover { background: rgba(255,107,35,0.15); border-color: #ff6b23; }

        .premium-badge { background: linear-gradient(135deg, #ff6b23, #ff8c42); color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%); }

        .member-bar-bg { background: rgba(255,255,255,0.08); height: 3px; border-radius: 2px; overflow: hidden; }
        .member-bar-fill { height: 100%; background: linear-gradient(90deg, #ff6b23, #ff8c42); border-radius: 2px; transition: width 0.3s; }
      `}</style>

      {/* 네비게이션 */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid rgba(255,107,35,0.1)", background: "rgba(8,12,20,0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="28" height="32" viewBox="0 0 32 36">
              <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
              <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
              <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
            </svg>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, fontFamily: "Rajdhani, sans-serif" }}>
              <span style={{ color: "#ff6b23" }}>OVER</span><span>CLAN</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {["클랜 찾기", "클랜대전", "랭킹", "명예의 전당"].map((item, i) => (
              <span key={item} className="nav-link" style={i === 0 ? { color: "#ff6b23" } : {}}>{item}</span>
            ))}
          </div>
        </div>
        <button className="btn-primary">클랜 만들기</button>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px" }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 3, height: 20, background: "#ff6b23" }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif" }}>클랜 찾기</h1>
          </div>
          <p style={{ fontSize: 14, color: "#8892a4", marginLeft: 15, fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300 }}>
            {filtered.length}개의 클랜이 새로운 클랜원을 기다리고 있어요.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>

          {/* 사이드바 필터 */}
          <div>
            {/* 검색 */}
            <div style={{ position: "relative", marginBottom: 28 }}>
              <svg style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b23" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="search-input" placeholder="클랜명 또는 태그 검색" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* 티어 필터 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>티어</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["전체", "마스터+", "다이아", "플래티넘", "골드"].map(t => (
                  <button key={t} className={`filter-btn ${tierFilter === t ? "active" : ""}`} onClick={() => setTierFilter(t)} style={{ textAlign: "left" }}>{t}</button>
                ))}
              </div>
            </div>

            {/* 시간대 필터 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>주 활동 시간</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["전체", "아침", "저녁", "밤", "새벽", "주말"].map(t => (
                  <button key={t} className={`filter-btn ${timeFilter === t ? "active" : ""}`} onClick={() => setTimeFilter(t)} style={{ textAlign: "left" }}>{t}</button>
                ))}
              </div>
            </div>

            {/* 스타일 필터 */}
            <div>
              <div style={{ fontSize: 11, color: "#8892a4", letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>클랜 성향</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["전체", "경쟁", "캐주얼", "친목"].map(t => (
                  <button key={t} className={`filter-btn ${styleFilter === t ? "active" : ""}`} onClick={() => setStyleFilter(t)} style={{ textAlign: "left" }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 클랜 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8892a4" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <div style={{ fontFamily: "Noto Sans KR, sans-serif" }}>검색 결과가 없어요.</div>
              </div>
            ) : filtered.map(clan => (
              <div key={clan.name} className="clan-card">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ fontSize: 36 }}>{clan.badge}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "Rajdhani, sans-serif" }}>{clan.name}</span>
                      <span style={{ fontSize: 11, color: "#ff6b23", opacity: 0.6, fontWeight: 600 }}>[{clan.tag}]</span>
                      {clan.premium && <span className="premium-badge">PRO</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span className="tier-tag" style={{ borderColor: tierColors[clan.tier]?.border, color: tierColors[clan.tier]?.color }}>{clan.tier}</span>
                      <span className="style-tag" style={{ color: "#8892a4" }}>{clan.style}</span>
                      <span className="style-tag" style={{ color: "#8892a4" }}>{clan.time}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", fontWeight: 300, lineHeight: 1.6, marginBottom: 14 }}>{clan.desc}</p>

                    {/* 클랜원 바 */}
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#8892a4", letterSpacing: 1 }}>클랜원</span>
                        <span style={{ fontSize: 11, color: "#ff6b23", fontWeight: 600, fontFamily: "Rajdhani, sans-serif" }}>{clan.members} / {clan.maxMembers}</span>
                      </div>
                      <div className="member-bar-bg">
                        <div className="member-bar-fill" style={{ width: `${(clan.members / clan.maxMembers) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#ff6b23", fontFamily: "Rajdhani, sans-serif" }}>{clan.wins}승</div>
                      <div style={{ fontSize: 10, color: "#8892a4", letterSpacing: 1 }}>이번 시즌</div>
                    </div>
                    <button className="btn-join">가입 신청</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
