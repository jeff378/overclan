import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awnixrwkobaghowdcvkv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ASejT6-8bmA9_moUw-_KoA_z75xBtQf'

export async function generateMetadata({ params }: { params: Promise<{ id: string; noticeId: string }> }): Promise<Metadata> {
  const { noticeId } = await params
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.from('clan_notices').select('title, content, clan_id').eq('id', noticeId).single()
    if (data) {
      let clanName = '클랜'
      const { data: clan } = await supabase.from('clans').select('name').eq('id', data.clan_id).single()
      if (clan?.name) clanName = clan.name
      const title = `[${clanName} 공지] ${data.title} | 오버클랜`
      const description = (data.content || '클랜 공지사항').slice(0, 100)
      return { title, description, openGraph: { title, description, type: 'article' }, twitter: { card: 'summary', title, description } }
    }
  } catch {}
  return { title: '클랜 공지 | 오버클랜', description: '클랜의 새로운 소식을 확인하세요.' }
}

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
