import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awnixrwkobaghowdcvkv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ASejT6-8bmA9_moUw-_KoA_z75xBtQf'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase.from('patch_posts').select('title, content, patch_version').eq('id', id).single()
    if (data) {
      const title = `${data.patch_version ? `[v${data.patch_version}] ` : ''}${data.title} | 오버클랜 패치노트`
      const description = (data.content || '오버워치 패치 토론').slice(0, 100)
      return { title, description, openGraph: { title, description, type: 'article' }, twitter: { card: 'summary', title, description } }
    }
  } catch {}
  return { title: '패치노트 토론 | 오버클랜', description: '오버워치 패치 내용을 분석하고 의견을 나눠보세요.' }
}

export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
