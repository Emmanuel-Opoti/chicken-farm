import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import SWRegister from '@/components/SWRegister'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Wandera Chicken Business',
  description: 'Daily tracking of eggs, feed, water, sales and reports for Wandera Retirement Chicken Business',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wandera Farm',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SWRegister />
        <Nav />
        <main className="pt-14 md:pt-0 md:pl-56 min-h-screen">
          <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
        <Analytics />
      </body>
    </html>
  )
}
