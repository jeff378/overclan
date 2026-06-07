import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '클랜 찾기 | 오버클랜',
  description: '티어, 활동시간, 성향으로 나에게 맞는 오버워치 클랜을 찾아보세요.',
  openGraph: { title: '클랜 찾기 | 오버클랜', description: '티어, 활동시간, 성향으로 나에게 맞는 오버워치 클랜을 찾아보세요.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
