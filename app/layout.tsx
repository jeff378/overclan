import type { Metadata } from 'next'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff6b23',
}

export const metadata: Metadata = {
  title: 'OVERCLAN - 오버워치 클랜 플랫폼',
  description: '오버워치를 같이 할 클랜을 찾아보세요.',
  keywords: '오버워치, 클랜, 오버클랜, 클랜대전, 오버워치 커뮤니티',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '오버클랜',
  },
  openGraph: {
    title: 'OVERCLAN - 오버워치 클랜 플랫폼',
    description: '오버워치를 같이 할 클랜을 찾아보세요.',
    url: 'https://overclan.vercel.app',
    siteName: 'OVERCLAN',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'OVERCLAN - 오버워치 클랜 플랫폼',
    description: '오버워치를 같이 할 클랜을 찾아보세요.',
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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="오버클랜" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#080c14" }}>
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
