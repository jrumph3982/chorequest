'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'tiles' | 'adult-form'

export default function LoginPage() {
  const router  = useRouter()
  const [step,     setStep]     = useState<Step>('tiles')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Login failed')
      setLoading(false)
      return
    }

    router.push(data.role === 'adult' ? '/admin' : '/play')
  }

  // ── Tile selection ────────────────────────────────────────────────────────
  if (step === 'tiles') {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #071407 0%, #020702 100%)' }}
      >
        {/* Atmospheric scanlines overlay */}
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
          zIndex: 0,
        }} />

        {/* Boarded window decoration (top-right) */}
        <svg className="pointer-events-none absolute top-6 right-6 opacity-10" width="80" height="70" viewBox="0 0 80 70">
          <rect x="0" y="0" width="80" height="70" rx="3" fill="none" stroke="#3dff7a" strokeWidth="2"/>
          <line x1="0"  y1="0"  x2="80" y2="70" stroke="#3dff7a" strokeWidth="1.5"/>
          <line x1="80" y1="0"  x2="0"  y2="70" stroke="#3dff7a" strokeWidth="1.5"/>
          <rect x="8"  y="8"  width="8" height="8" rx="1" fill="#3dff7a" opacity="0.5"/>
          <rect x="64" y="8"  width="8" height="8" rx="1" fill="#3dff7a" opacity="0.5"/>
          <rect x="8"  y="54" width="8" height="8" rx="1" fill="#3dff7a" opacity="0.5"/>
          <rect x="64" y="54" width="8" height="8" rx="1" fill="#3dff7a" opacity="0.5"/>
        </svg>
        {/* Left window */}
        <svg className="pointer-events-none absolute top-8 left-6 opacity-8" width="60" height="52" viewBox="0 0 60 52">
          <rect x="0" y="0" width="60" height="52" rx="3" fill="none" stroke="#f29d26" strokeWidth="1.5"/>
          <line x1="0"  y1="0"  x2="60" y2="52" stroke="#f29d26" strokeWidth="1"/>
          <line x1="60" y1="0"  x2="0"  y2="52" stroke="#f29d26" strokeWidth="1"/>
        </svg>

        <div className="w-full max-w-sm relative z-10">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 idle-float inline-block">🧟</div>
            <h1
              className="text-4xl text-[#3dff7a] mb-1"
              style={{ fontFamily: "'Bungee Shade', sans-serif", textShadow: '0 0 30px rgba(61,255,122,0.6), 0 0 60px rgba(61,255,122,0.2)' }}
            >
              Chore Quest
            </h1>
            <p className="text-slate-600 mt-2 text-xs tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Defend the base. Complete your chores.
            </p>
          </div>

          <p className="text-center text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-5">
            Who&apos;s entering the base?
          </p>

          <div className="flex flex-col gap-3">
            {/* Child tile — PRIMARY (pulsing orange) */}
            <button
              onClick={() => router.push('/child-login')}
              className="btn-pulse flex items-center gap-4 px-5 py-5 rounded-2xl border-2 transition-all active:scale-95"
              style={{ background: 'rgba(255,107,0,0.12)', borderColor: 'rgba(255,107,0,0.6)', color: '#ff8c40' }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 border-2"
                style={{ background: 'rgba(255,107,0,0.15)', borderColor: 'rgba(255,107,0,0.5)' }}
              >
                🧟
              </div>
              <div className="text-left">
                <p className="text-base font-black uppercase tracking-wide" style={{ fontFamily: "'Bungee', sans-serif", color: '#ff8c40' }}>
                  Survivor Login
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,140,64,0.6)' }}>
                  Play the game &amp; complete missions
                </p>
              </div>
              <span className="ml-auto text-lg">→</span>
            </button>

            {/* Adult tile — SECONDARY (outlined green) */}
            <button
              onClick={() => setStep('adult-form')}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all active:scale-95 hover:border-[#3dff7a]/40"
              style={{ background: 'rgba(61,255,122,0.03)', borderColor: 'rgba(61,255,122,0.15)', color: '#4a6a4a' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 border"
                style={{ background: 'rgba(61,255,122,0.05)', borderColor: 'rgba(61,255,122,0.15)' }}
              >
                🛡️
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-400">Commander Access</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Manage chores, rewards &amp; family settings</p>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-slate-700 mt-7">
            New here?{' '}
            <Link href="/register" className="text-[#3dff7a]/60 hover:text-[#3dff7a] transition-colors">
              Create a parent account →
            </Link>
          </p>

        </div>
      </main>
    )
  }

  // ── Adult login form ──────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #071407 0%, #020702 100%)' }}
    >
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-2xl font-black text-slate-100" style={{ fontFamily: "'Bungee', sans-serif" }}>Commander Access</h1>
          <p className="text-slate-600 mt-1 text-xs tracking-widest uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Parent &amp; admin portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/60 border border-slate-700 placeholder-slate-600"
              placeholder="Enter your username"
              required
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/60 border border-slate-700 placeholder-slate-600"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: 'rgba(242,157,38,0.6)' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22c55e] hover:bg-[#22c55e]/90 disabled:opacity-50 text-slate-900 font-bold rounded-xl py-3 text-sm transition-colors active:scale-95"
          >
            {loading ? 'Entering base…' : 'Enter the Base'}
          </button>
        </form>

        <button
          onClick={() => { setStep('tiles'); setError('') }}
          className="mt-4 w-full text-xs text-slate-600 hover:text-slate-400 py-2 transition-colors"
        >
          ← Back to selection
        </button>
      </div>
    </main>
  )
}
