import type { Metadata, Viewport } from 'next'
import './globals.css'
import SWRegister from '@/components/SWRegister'
import AppShell from '@/components/AppShell'

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
