import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awnixrwkobaghowdcvkv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ASejT6-8bmA9_moUw-_KoA_z75xBtQf'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.from('replay_posts').select('replay_code, description, votes_hack, votes_clean').eq('id', id).single()
    if (data) {
      const total = (data.votes_hack || 0) + (data.votes_clean || 0)
      const voteInfo = total > 0 ? ` (투표 ${total}명)` : ''
      const title = `핵 의심 리플레이 ${data.replay_code}${voteInfo} | 오버클랜`
      const description = (data.description || '이 리플레이, 핵일까요? 투표로 의견을 모아보세요.').slice(0, 100)
      return { title, description, openGraph: { title, description, type: 'article' }, twitter: { card: 'summary', title, description } }
    }
  } catch {}
  return { title: '핵 의심 리플레이 | 오버클랜', description: '의심스러운 플레이를 제보하고 함께 판단해보세요.' }
}

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
