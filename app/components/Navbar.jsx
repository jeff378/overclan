"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar({ active = "" }) {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        supabase.from("profiles").select("nickname").eq("id", data.user.id).single().then(({ data: profile }) => {
          if (profile) setNickname(profile.nickname);
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const links = [
    { label: "클랜 찾기", href: "/find" },
    { label: "클랜대전", href: "/battle" },
    { label: "랭킹", href: "/ranking" },
    { label: "명예의 전당", href: "/hall" },
    { label: "공지사항", href: "/notice" },
    { label: "패치노트", href: "/patch" },
    { label: "핵 제보", href: "/replay" },
  ];

  return (
    <nav style={{ background: "rgba(8,12,20,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,107,35,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
        .nav-link { color: #8892a4; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; transition: color 0.2s; }
        .nav-link:hover, .nav-link.active { color: #ff6b23; }
        .btn-primary { background: linear-gradient(135deg, #ff6b23, #ff8c42); border: none; color: #fff; padding: 10px 20px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; text-decoration: none; }
        .btn-secondary { background: transparent; border: 1px solid rgba(255,107,35,0.4); color: #ff6b23; padding: 9px 20px; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 2px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: all 0.2s; text-decoration: none; }
        .btn-secondary:hover { background: rgba(255,107,35,0.1); }
        .user-badge { display: flex; align-items: center; gap: 8px; background: rgba(255,107,35,0.08); border: 1px solid rgba(255,107,35,0.2); padding: 7px 14px; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); text-decoration: none; }
        .btn-logout { background: transparent; border: none; color: #8892a4; font-family: 'Rajdhani', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: color 0.2s; }
        .btn-logout:hover { color: #ef5350; }
        .hamburger { background: none; border: none; cursor: pointer; padding: 4px; display: none; flex-direction: column; gap: 5px; }
        .hamburger span { display: block; width: 22px; height: 2px; background: #e8eaf0; transition: all 0.2s; }
        .mobile-menu { display: none; flex-direction: column; gap: 0; background: rgba(8,12,20,0.98); border-top: 1px solid rgba(255,107,35,0.1); }
        .mobile-link { color: #8892a4; text-decoration: none; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); display: block; transition: all 0.2s; }
        .mobile-link:hover { color: #ff6b23; background: rgba(255,107,35,0.05); }
        @media (max-width: 768px) {
          .desktop-links { display: none !important; }
          .desktop-auth { display: none !important; }
          .hamburger { display: flex !important; }
          .mobile-menu { display: flex; }
        }
      `}</style>

      {/* 데스크탑 네브 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="26" height="30" viewBox="0 0 32 36">
              <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#ff6b23" strokeWidth="1.5"/>
              <polygon points="16,8 24,13 24,23 16,28 8,23 8,13" fill="rgba(255,107,35,0.2)" stroke="#ff6b23" strokeWidth="1"/>
              <text x="16" y="22" textAnchor="middle" fill="#ff6b23" fontSize="10" fontWeight="700" fontFamily="Rajdhani">OC</text>
            </svg>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 3, fontFamily: "Rajdhani, sans-serif" }}>
              <span style={{ color: "#ff6b23" }}>OVER</span><span style={{ color: "#e8eaf0" }}>CLAN</span>
            </span>
          </a>
          <div className="desktop-links" style={{ display: "flex", gap: 20 }}>
            {links.map(link => (
              <a key={link.label} href={link.href} className={`nav-link ${active === link.label ? "active" : ""}`}>{link.label}</a>
            ))}
          </div>
        </div>

        <div className="desktop-auth" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <a href="/mypage" className="user-badge">
                <div style={{ width: 7, height: 7, background: "#4caf50", borderRadius: "50%", boxShadow: "0 0 6px #4caf50" }} />
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, color: "#e8eaf0" }}>{nickname || "클랜원"}</span>
              </a>
              <button className="btn-logout" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <a href="/login" className="btn-secondary">로그인</a>
              <a href="/signup" className="btn-primary">회원가입</a>
            </>
          )}
        </div>

        {/* 햄버거 버튼 */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="mobile-menu">
          {links.map(link => (
            <a key={link.label} href={link.href} className="mobile-link" onClick={() => setMenuOpen(false)}>{link.label}</a>
          ))}
          <div style={{ padding: "16px 24px", display: "flex", gap: 10, borderTop: "1px solid rgba(255,107,35,0.1)" }}>
            {user ? (
              <>
                <a href="/mypage" className="btn-primary" style={{ flex: 1, textAlign: "center" }}>내 프로필</a>
                <button className="btn-logout" onClick={handleLogout} style={{ flex: 1 }}>로그아웃</button>
              </>
            ) : (
              <>
                <a href="/login" className="btn-secondary" style={{ flex: 1, textAlign: "center" }}>로그인</a>
                <a href="/signup" className="btn-primary" style={{ flex: 1, textAlign: "center" }}>회원가입</a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
