import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const auth = request.cookies.get('wandera_auth')?.value === 'authenticated'
  const { pathname } = request.nextUrl

  const isPublic =
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'

  if (!auth && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (auth && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
