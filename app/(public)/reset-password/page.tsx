'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors,          setErrors]          = useState<Record<string, string>>({})
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)

  useEffect(() => {
    if (!token) setError('No reset token found. Please request a new link.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrors({})

    const res  = await fetch('/api/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password, confirmPassword }),
    })
    const data = await res.json()

    if (!res.ok) {
      if (data.errors) setErrors(data.errors)
      else setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  const inputCls = 'w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 border placeholder-slate-600 text-slate-100'
  const inputStyle = { background: 'rgba(15,10,5,0.7)', borderColor: 'rgba(242,157,38,0.2)' }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(to bottom, #0f0b05, #221b10)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🔐</div>
          <h1 className="text-3xl font-black text-[#f29d26] tracking-tight">Chore Quest</h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: 'rgba(242,157,38,0.5)' }}>
            New Password
          </p>
        </div>

        {done ? (
          <div
            className="rounded-2xl border p-8 space-y-4 text-center"
            style={{ background: 'rgba(34,27,16,0.95)', borderColor: 'rgba(242,157,38,0.25)' }}
          >
            <div className="text-4xl">✅</div>
            <p className="text-slate-100 font-bold text-lg">Password updated!</p>
            <p className="text-slate-400 text-sm">Redirecting you to login…</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'rgba(34,27,16,0.95)', borderColor: 'rgba(242,157,38,0.25)' }}
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
                {!token && (
                  <div className="mt-2">
                    <Link href="/forgot-password" className="underline">Request a new link →</Link>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                style={inputStyle}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
                style={inputStyle}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full font-bold rounded-xl py-3 text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#f29d26', color: '#0f0b05' }}
            >
              {loading ? 'Updating…' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
