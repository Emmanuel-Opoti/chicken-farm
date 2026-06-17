'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Nav from './Nav'

const TIMEOUT_MS = 30 * 60 * 1000   // 30 minutes
const EVENTS     = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLogin   = pathname === '/login'

  useEffect(() => {
    if (isLogin) return   // no auto-logout on the login page itself

    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
      }, TIMEOUT_MS)
    }

    reset()
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      EVENTS.forEach(e => window.removeEventListener(e, reset))
    }
  }, [isLogin, router])

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <>
      <Nav />
      <main className="pt-14 md:pt-0 md:pl-56 min-h-screen">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </>
  )
}
