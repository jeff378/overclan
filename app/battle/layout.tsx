import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '클랜대전 | 오버클랜',
  description: '클랜끼리 5v5로 맞붙는 정규전/친선전. 클랜대전 신청하고 순위를 높여보세요.',
  openGraph: { title: '클랜대전 | 오버클랜', description: '클랜끼리 5v5로 맞붙는 정규전/친선전.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
