import type { Metadata } from 'next'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'OVERCLAN - 오버워치 클랜 플랫폼',
  description: '오버워치 최초의 클랜 플랫폼. 클랜을 만들고, 대전에 참여하고, 명예를 쌓아라.',
  keywords: '오버워치, 클랜, 오버클랜, 클랜대전, 오버워치 커뮤니티',
  openGraph: {
    title: 'OVERCLAN - 오버워치 클랜 플랫폼',
    description: '오버워치 최초의 클랜 플랫폼. 혼자였던 게임이 함께하는 전쟁이 된다.',
    url: 'https://overclan.vercel.app',
    siteName: 'OVERCLAN',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'OVERCLAN - 오버워치 클랜 플랫폼',
    description: '오버워치 최초의 클랜 플랫폼. 혼자였던 게임이 함께하는 전쟁이 된다.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: "#080c14" }}>{children}</body>
    </html>
  )
}
