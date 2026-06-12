import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awnixrwkobaghowdcvkv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ASejT6-8bmA9_moUw-_KoA_z75xBtQf'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.from('site_notices').select('title, content, category').eq('id', id).single()
    if (data) {
      const title = `[${data.category}] ${data.title} | 오버클랜 공지`
      const description = (data.content || '오버클랜 공지사항').slice(0, 100)
      return { title, description, openGraph: { title, description, type: 'article' }, twitter: { card: 'summary', title, description } }
    }
  } catch {}
  return { title: '공지사항 | 오버클랜', description: '오버클랜의 새로운 소식을 확인하세요.' }
}

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
