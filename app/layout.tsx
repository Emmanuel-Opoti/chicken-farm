import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Farm Manager',
  description: 'Chicken farm management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="pt-14 md:pt-0 md:pl-56 min-h-screen">
          <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
