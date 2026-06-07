import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '핵 의심 리플레이 | 오버클랜',
  description: '핵 의심 리플레이 코드를 공유하고 커뮤니티 투표로 판단해보세요.',
  openGraph: { title: '핵 의심 리플레이 | 오버클랜', description: '핵 의심 리플레이 코드를 공유하고 투표해보세요.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
