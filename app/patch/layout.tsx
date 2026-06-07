import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '패치노트 토론 | 오버클랜',
  description: '오버워치 패치 내용을 분석하고 의견을 나눠보세요.',
  openGraph: { title: '패치노트 토론 | 오버클랜', description: '오버워치 패치 내용을 분석하고 의견을 나눠보세요.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
