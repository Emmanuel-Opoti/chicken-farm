import { NextResponse } from 'next/server'

const USERNAME = 'fredwandera'
const PASSWORD = 'Fwandera2026'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (username === USERNAME && password === PASSWORD) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('wandera_auth', 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return res
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
