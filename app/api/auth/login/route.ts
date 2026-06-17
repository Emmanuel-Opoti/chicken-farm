import { NextResponse } from 'next/server'

const USERS: Record<string, { password: string; displayName: string }> = {
  'fredwandera':    { password: 'Fwandera2026',      displayName: 'Fred Wandera' },
  'hildawandera':   { password: 'hildawandera2026',  displayName: 'Hilda Wandera' },
  'emmanuelopoti':  { password: 'EmmanuelOpoti2026', displayName: 'Emmanuel Opoti' },
  'zawadiopoti':    { password: 'Zawadiopoti2026',   displayName: 'Zawadi Opoti' },
  'alvinopoti':     { password: 'Alvinopoti2026',    displayName: 'Alvin Opoti' },
}

export async function POST(req: Request) {
  const { username, password } = await req.json()
  const user = USERS[username?.toLowerCase?.()]

  if (user && user.password === password) {
    const res = NextResponse.json({ ok: true, displayName: user.displayName })
    res.cookies.set('wandera_auth', 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
