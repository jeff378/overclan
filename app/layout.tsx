import type { Metadata } from 'next'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff6b23',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://overclan.vercel.app'),
  title: {
    default: '오버클랜 - 오버워치 클랜 찾기·클랜대전·랭킹 플랫폼',
    template: '%s | 오버클랜',
  },
  description: '오버워치 클랜을 찾고, 클랜대전을 신청하고, 랭킹을 겨뤄보세요. 오버클랜은 오버워치 클랜 운영과 클랜원 모집을 위한 무료 팬 플랫폼입니다.',
  keywords: ['오버워치', '오버워치 클랜', '클랜', '오버클랜', '클랜대전', '오버워치 클랜 모집', '오버워치 커뮤니티', '오버워치 클랜 찾기', '옵치 클랜'],
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
  verification: {
    google: 'K2kn8h1201L6ZSotI1Kx_F7WuwUDjvqRWMTnB618UcQ',
    other: {
      'naver-site-verification': ['a1fa806bd2d2cac58fb2377a038c8254314f7c29'],
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '오버클랜',
  },
  openGraph: {
    title: '오버클랜 - 오버워치 클랜 찾기·클랜대전·랭킹 플랫폼',
    description: '오버워치 클랜을 찾고, 클랜대전을 신청하고, 랭킹을 겨뤄보세요.',
    url: 'https://overclan.vercel.app',
    siteName: '오버클랜',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '오버클랜 - 오버워치 클랜 플랫폼',
    description: '오버워치 클랜을 찾고, 클랜대전을 신청하고, 랭킹을 겨뤄보세요.',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="오버클랜" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: '오버클랜',
            alternateName: 'OVERCLAN',
            url: 'https://overclan.vercel.app',
            description: '오버워치 클랜을 찾고, 클랜대전을 신청하고, 랭킹을 겨뤄보세요.',
            inLanguage: 'ko-KR',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://overclan.vercel.app/find?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#080c14", fontFamily: "'Rajdhani', 'Noto Sans KR', sans-serif" }}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </body>
    </html>
  )
}
