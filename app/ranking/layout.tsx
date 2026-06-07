import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '시즌 랭킹 | 오버클랜',
  description: '이번 시즌 오버클랜 랭킹. 승점을 쌓고 1위를 노려보세요.',
  openGraph: { title: '시즌 랭킹 | 오버클랜', description: '이번 시즌 오버클랜 랭킹.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
