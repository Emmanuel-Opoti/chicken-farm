'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [welcome, setWelcome]   = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      })
      if (res.ok) {
        const data = await res.json()
        setDisplayName(data.displayName || 'Welcome')
        setWelcome(true)
        setTimeout(() => router.push('/dashboard'), 2200)
      } else {
        setError('Wrong username or password. Please try again.')
      }
    } catch {
      setError('Could not connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes sunrise {
          0%   { transform: translateY(60px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes sunpulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.4); }
          50%       { box-shadow: 0 0 0 18px rgba(234,179,8,0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes waddle {
          0%, 100% { transform: rotate(-8deg) translateX(0); }
          50%       { transform: rotate(8deg)  translateX(4px); }
        }
        @keyframes grassway {
          0%   { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes cardup {
          0%   { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes eggspin {
          0%   { transform: rotate(-15deg) scale(0.8); opacity: 0; }
          100% { transform: rotate(0deg)   scale(1);   opacity: 1; }
        }
        @keyframes welcomepop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95%            { transform: scaleY(0.1); }
        }
        @keyframes cloud {
          0%   { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0);     opacity: 0.7; }
        }
        .sun         { animation: sunrise 1s ease-out forwards, sunpulse 2.5s ease-in-out 1s infinite; }
        .chicken     { animation: float 3s ease-in-out 1s infinite; }
        .wing        { animation: waddle 1.2s ease-in-out infinite; transform-origin: top right; }
        .grass       { animation: grassway 1s ease-out 0.3s both; transform-origin: left center; }
        .card        { animation: cardup 0.7s ease-out 0.4s both; }
        .egg1        { animation: eggspin 0.6s ease-out 1.4s both; }
        .egg2        { animation: eggspin 0.6s ease-out 1.7s both; }
        .egg3        { animation: eggspin 0.6s ease-out 2.0s both; }
        .eye         { animation: blink 4s ease-in-out infinite; transform-origin: center center; }
        .cloud1      { animation: cloud 1.2s ease-out 0.1s both; }
        .cloud2      { animation: cloud 1.4s ease-out 0.5s both; }
        .welcomepop  { animation: welcomepop 0.5s cubic-bezier(.175,.885,.32,1.275) forwards; }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #1e3a5f 0%, #2563eb 35%, #60a5fa 65%, #86efac 100%)' }}>

        {/* Clouds */}
        <div className="cloud1 absolute top-10 left-10 opacity-70">
          <div style={{ width: 80, height: 28, background: 'white', borderRadius: 99, position: 'relative' }}>
            <div style={{ width: 48, height: 38, background: 'white', borderRadius: 99, position: 'absolute', top: -16, left: 14 }} />
          </div>
        </div>
        <div className="cloud2 absolute top-20 right-16 opacity-60">
          <div style={{ width: 60, height: 22, background: 'white', borderRadius: 99, position: 'relative' }}>
            <div style={{ width: 36, height: 30, background: 'white', borderRadius: 99, position: 'absolute', top: -12, left: 10 }} />
          </div>
        </div>

        {/* Sun */}
        <div className="sun absolute" style={{ top: 28, right: 60, width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#fde047,#facc15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#ca8a04" />
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <line key={i}
                x1={12 + 7 * Math.cos(deg * Math.PI / 180)}
                y1={12 + 7 * Math.sin(deg * Math.PI / 180)}
                x2={12 + 10 * Math.cos(deg * Math.PI / 180)}
                y2={12 + 10 * Math.sin(deg * Math.PI / 180)}
                stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
            ))}
          </svg>
        </div>

        {/* Chicken SVG */}
        <div className="chicken absolute" style={{ bottom: 108, left: '12%' }}>
          <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
            {/* body */}
            <ellipse cx="34" cy="42" rx="18" ry="15" fill="#fefce8" stroke="#d97706" strokeWidth="1.5" />
            {/* wing */}
            <g className="wing">
              <ellipse cx="22" cy="44" rx="9" ry="6" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
            </g>
            {/* head */}
            <circle cx="48" cy="28" r="11" fill="#fefce8" stroke="#d97706" strokeWidth="1.5" />
            {/* comb */}
            <ellipse cx="46" cy="18" rx="4" ry="5" fill="#dc2626" />
            <ellipse cx="50" cy="16" rx="3" ry="4" fill="#dc2626" />
            <ellipse cx="54" cy="18" rx="3" ry="4" fill="#dc2626" />
            {/* wattle */}
            <ellipse cx="52" cy="33" rx="3" ry="4" fill="#dc2626" />
            {/* beak */}
            <polygon points="58,28 64,26 64,30" fill="#eab308" />
            {/* eye */}
            <circle className="eye" cx="50" cy="26" r="3" fill="#1e3a5f" />
            <circle cx="51" cy="25" r="1" fill="white" />
            {/* tail feathers */}
            <ellipse cx="17" cy="36" rx="6" ry="4" fill="#eab308" transform="rotate(-30 17 36)" />
            <ellipse cx="14" cy="40" rx="5" ry="3.5" fill="#dc2626" transform="rotate(-50 14 40)" />
            {/* legs */}
            <rect x="28" y="55" width="4" height="9" rx="2" fill="#eab308" />
            <rect x="36" y="55" width="4" height="9" rx="2" fill="#eab308" />
            {/* feet */}
            <line x1="28" y1="64" x2="22" y2="67" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
            <line x1="28" y1="64" x2="28" y2="68" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="64" x2="46" y2="67" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="64" x2="40" y2="68" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Eggs */}
        <div className="egg1 absolute" style={{ bottom: 115, left: '22%' }}>
          <svg width="20" height="24" viewBox="0 0 20 24"><ellipse cx="10" cy="13" rx="8" ry="11" fill="white" stroke="#d97706" strokeWidth="1.5" /></svg>
        </div>
        <div className="egg2 absolute" style={{ bottom: 112, left: '26%' }}>
          <svg width="18" height="22" viewBox="0 0 20 24"><ellipse cx="10" cy="13" rx="8" ry="11" fill="#fef9c3" stroke="#d97706" strokeWidth="1.5" /></svg>
        </div>
        <div className="egg3 absolute" style={{ bottom: 116, left: '30%' }}>
          <svg width="16" height="20" viewBox="0 0 20 24"><ellipse cx="10" cy="13" rx="8" ry="11" fill="white" stroke="#d97706" strokeWidth="1.5" /></svg>
        </div>

        {/* Grass strip */}
        <div className="grass absolute bottom-0 left-0 right-0" style={{ height: 110, background: 'linear-gradient(to top, #15803d, #22c55e)', borderRadius: '50% 50% 0 0 / 20px 20px 0 0' }} />

        {/* Farm name on grass */}
        <div className="absolute bottom-5 right-6 text-white/60 text-xs font-bold tracking-widest uppercase">
          Wandera Farm
        </div>

        {/* Welcome overlay */}
        {welcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(21,128,61,0.92)' }}>
            <div className="welcomepop text-center px-10 py-10 rounded-3xl"
              style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div className="text-6xl mb-4">🐔</div>
              <h2 className="text-3xl font-bold text-green-800 mb-2">Welcome,</h2>
              <h1 className="text-4xl font-extrabold text-green-700 mb-3">{displayName}!</h1>
              <p className="text-gray-500 text-sm">Taking you to your farm dashboard...</p>
              <div className="mt-5 flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-green-500"
                    style={{ animation: `float ${0.8 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Login card */}
        <div className={`card relative z-10 w-full max-w-sm mx-4 ${mounted ? '' : 'opacity-0'}`}>
          {/* Logo top */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-3"
              style={{ background: 'linear-gradient(135deg,#15803d,#166534)', boxShadow: '0 8px 30px rgba(21,128,61,0.5)' }}>
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                <ellipse cx="21" cy="27" rx="13" ry="11" fill="white" opacity="0.9" />
                <circle cx="31" cy="16" r="8" fill="white" opacity="0.9" />
                <ellipse cx="30" cy="10" rx="3" ry="3.5" fill="#dc2626" />
                <ellipse cx="33" cy="9" rx="2.5" ry="3" fill="#dc2626" />
                <polygon points="38,16 42,14 42,18" fill="#eab308" />
                <circle cx="32" cy="15" r="2" fill="#1e3a5f" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">Wandera Farm</h1>
            <p className="text-green-100 text-sm mt-0.5">Chicken Business Manager</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Good morning!</h2>
            <p className="text-gray-400 text-sm mb-6">Sign in to manage your farm</p>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Username</label>
                <div className="flex items-center gap-3 border-2 border-gray-100 rounded-2xl px-4 py-3 focus-within:border-green-500 transition-colors bg-gray-50">
                  <svg className="shrink-0 text-green-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError('') }}
                    placeholder="Enter your username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="flex-1 bg-transparent text-gray-800 text-sm outline-none placeholder:text-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="flex items-center gap-3 border-2 border-gray-100 rounded-2xl px-4 py-3 focus-within:border-green-500 transition-colors bg-gray-50">
                  <svg className="shrink-0 text-green-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent text-gray-800 text-sm outline-none placeholder:text-gray-300"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                  <svg className="text-red-500 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-60"
                style={{ background: loading ? '#86efac' : 'linear-gradient(135deg,#15803d,#16a34a)', boxShadow: '0 4px 20px rgba(21,128,61,0.4)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In to My Farm'}
              </button>
            </form>

            {/* Bottom badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Private family farm system
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
