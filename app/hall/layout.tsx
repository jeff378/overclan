import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '명예의 전당 | 오버클랜',
  description: '클랜대전에서 뛰어난 성과를 거둔 클랜들의 기록.',
  openGraph: { title: '명예의 전당 | 오버클랜', description: '클랜대전에서 뛰어난 성과를 거둔 클랜들의 기록.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
