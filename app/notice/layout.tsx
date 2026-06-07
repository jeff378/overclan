import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: '공지사항 | 오버클랜',
  description: '오버클랜 서비스 공지사항 및 업데이트 소식.',
  openGraph: { title: '공지사항 | 오버클랜', description: '오버클랜 서비스 공지사항 및 업데이트 소식.' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
