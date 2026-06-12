import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/mypage', '/profile-edit', '/reset-password', '/forgot-password', '/clan/*/manage', '/clan/*/edit'],
    },
    sitemap: 'https://overclan.vercel.app/sitemap.xml',
  }
}
