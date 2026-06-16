"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../components/Navbar";
import { ClanEmblem } from "../../components/ClanBadge";
import { tierColor } from "../../../lib/clanTier";
import { ROLES } from "../../../lib/roles";

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [prof, setProf] = useState<any>(null);
  const [clan, setClan] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("profiles").select("nickname, battletag, main_hero, roles, tier_tank, tier_dps, tier_support").eq("id", id).single();
        if (!data) { setNotFound(true); return; }
        setProf(data);
        const { data: mem } = await supabase.from("clan_members").select("clans(id,name,badge,tier,accent_color,emblem_image)").eq("user_id", id).limit(1);
        if (mem && mem.length > 0) setClan((mem[0] as any).clans);
        const { data: ps } = await supabase.from("free_posts").select("id, title, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(8);
        setPosts(ps || []);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const tierChip = (tier: string, role: { icon: string; color: string; key: string }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "4px 11px", background: `${tierColor(tier)}1f`, color: tierColor(tier), border: `1px solid ${tierColor(tier)}55`, clipPath: "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)" }}>
      {role.icon} {tier}
    </span>
  );

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#e8eaf0", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 32px" }}>
        {loading ? (
          <div style={{ color: "#ff6b23", fontFamily: "'Cinzel', 'Rajdhani', sans-serif", letterSpacing: 2, textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : notFound ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 34, marginBottom: 12, color: "#5a6478" }}>👤</div>
            <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 18, fontWeight: 700, color: "#e8eaf0" }}>존재하지 않는 유저예요.</div>
          </div>
        ) : (
          <>
            <div style={{ background: "rgba(13,20,35,0.8)", border: "1px solid rgba(255,107,35,0.15)", padding: "32px 36px", clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ width: 60, height: 60, flexShrink: 0, background: "rgba(255,107,35,0.1)", border: "1px solid #ff6b23", clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "#ff6b23" }}>
                  {prof.nickname?.[0] || "?"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff" }}>{prof.nickname}</div>
                  {prof.battletag && <div style={{ fontSize: 13, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif", marginTop: 2 }}>{prof.battletag}</div>}
                  {prof.main_hero && <div style={{ fontSize: 12, color: "#ff8c42", fontFamily: "Noto Sans KR, sans-serif", marginTop: 4 }}>주 영웅 · {prof.main_hero}</div>}
                </div>
              </div>

              {(prof.tier_tank || prof.tier_dps || prof.tier_support) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
                  {ROLES.filter(r => prof[r.tierKey]).map(r => <span key={r.key}>{tierChip(prof[r.tierKey], r)}</span>)}
                </div>
              )}

              {clan && (
                <a href={`/clan/${clan.id}`} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,107,35,0.12)", textDecoration: "none", color: "inherit" }}>
                  <ClanEmblem clan={clan} size={36} radius={8} accent={clan.accent_color} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#8892a4", fontFamily: "Noto Sans KR, sans-serif" }}>소속 클랜</div>
                    <div style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontWeight: 700, fontSize: 15, color: "#e8eaf0" }}>{clan.badge} {clan.name}</div>
                  </div>
                </a>
              )}
            </div>

            {posts.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 3, height: 16, background: "#ff6b23" }} />
                  <span style={{ fontFamily: "'Cinzel', 'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 2, color: "#c0c8d4" }}>최근 작성글</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {posts.map(p => (
                    <a key={p.id} href={`/free/${p.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "rgba(13,20,35,0.7)", border: "1px solid rgba(255,107,35,0.08)", textDecoration: "none", color: "inherit" }}>
                      <span style={{ fontFamily: "Noto Sans KR, sans-serif", fontSize: 14, color: "#e8eaf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                      <span style={{ fontSize: 12, color: "#5a6478", fontFamily: "Noto Sans KR, sans-serif", flexShrink: 0 }}>{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
