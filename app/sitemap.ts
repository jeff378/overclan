import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://overclan.vercel.app'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awnixrwkobaghowdcvkv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ASejT6-8bmA9_moUw-_KoA_z75xBtQf'

export const revalidate = 3600 // 1시간마다 갱신

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 고정 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/find`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/ranking`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/battle`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/patch`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/replay`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE}/notice`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE}/clan/create`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/signup`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/guidelines`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/contact`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // 동적 페이지 (클랜, 패치글, 핵제보, 공지)
  const dynamicPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const [clans, patches, replays, notices] = await Promise.all([
      supabase.from('clans').select('id, created_at'),
      supabase.from('patch_posts').select('id, created_at'),
      supabase.from('replay_posts').select('id, created_at'),
      supabase.from('site_notices').select('id, created_at'),
    ])
    for (const c of clans.data || []) dynamicPages.push({ url: `${BASE}/clan/${c.id}`, lastModified: c.created_at ? new Date(c.created_at) : undefined, changeFrequency: 'weekly', priority: 0.8 })
    for (const p of patches.data || []) dynamicPages.push({ url: `${BASE}/patch/${p.id}`, lastModified: p.created_at ? new Date(p.created_at) : undefined, changeFrequency: 'weekly', priority: 0.5 })
    for (const r of replays.data || []) dynamicPages.push({ url: `${BASE}/replay/${r.id}`, lastModified: r.created_at ? new Date(r.created_at) : undefined, changeFrequency: 'weekly', priority: 0.4 })
    for (const n of notices.data || []) dynamicPages.push({ url: `${BASE}/notice/${n.id}`, lastModified: n.created_at ? new Date(n.created_at) : undefined, changeFrequency: 'monthly', priority: 0.4 })
  } catch {}

  return [...staticPages, ...dynamicPages]
}
