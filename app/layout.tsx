export const metadata = {
  title: 'OverClan - 오버워치 클랜 플랫폼',
  description: '오버워치 최초의 클랜 플랫폼. 혼자였던 게임이 함께하는 전쟁이 된다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
