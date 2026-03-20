'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FeedbackButton } from '@/components/FeedbackButton'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res  = await fetch('/api/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(to bottom, #0f0b05, #221b10)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🔑</div>
          <h1 className="text-3xl font-black text-[#f29d26] tracking-tight">Chore Quest</h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: 'rgba(242,157,38,0.5)' }}>
            Password Reset
          </p>
        </div>

        {sent ? (
          <div
            className="rounded-2xl border p-8 space-y-4 text-center"
            style={{ background: 'rgba(34,27,16,0.95)', borderColor: 'rgba(242,157,38,0.25)' }}
          >
            <div className="text-4xl">📬</div>
            <p className="text-slate-100 font-bold text-lg">Check your inbox</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              If that email is registered, you&apos;ll receive a reset link within a few minutes.
              The link expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 text-sm font-bold"
              style={{ color: '#f29d26' }}
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'rgba(34,27,16,0.95)', borderColor: 'rgba(242,157,38,0.25)' }}
          >
            <p className="text-sm text-slate-300 text-center">
              Enter the email address on your account and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 border placeholder-slate-600 text-slate-100"
                style={{ background: 'rgba(15,10,5,0.7)', borderColor: 'rgba(242,157,38,0.2)' }}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold rounded-xl py-3 text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#f29d26', color: '#0f0b05' }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <Link
              href="/login"
              className="block text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to login
            </Link>
          </form>
        )}
      </div>
      <FeedbackButton />
    </main>
  )
}
