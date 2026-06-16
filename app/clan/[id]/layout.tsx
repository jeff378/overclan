import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awnixrwkobaghowdcvkv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ASejT6-8bmA9_moUw-_KoA_z75xBtQf'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.from('clans').select('name, tag, tier, description, slogan, banner_image, vibe_tags').eq('id', id).single()
    if (data) {
      const title = `${data.name} [${data.tag}] | 오버클랜`
      const vibeStr = data.vibe_tags && data.vibe_tags.length > 0 ? data.vibe_tags.map((t: string) => `#${t}`).join(' ') + ' · ' : ''
      const baseDesc = (data.slogan || data.description || (data.tier ? `${data.tier} 클랜` : '오버워치 클랜')).slice(0, 90)
      const fullDesc = `${vibeStr}${baseDesc}`.slice(0, 100)
      return {
        title, description: fullDesc,
        openGraph: { title, description: fullDesc, type: 'profile', ...(data.banner_image ? { images: [{ url: data.banner_image }] } : {}) },
        twitter: { card: data.banner_image ? 'summary_large_image' : 'summary', title, description: fullDesc },
      }
    }
  } catch {}
  return { title: '클랜 | 오버클랜', description: '오버워치 클랜 프로필' }
}

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
