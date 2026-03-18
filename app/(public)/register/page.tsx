'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type FieldErrors = Partial<Record<'name' | 'username' | 'email' | 'password' | 'confirmPassword', string>>

export default function RegisterPage() {
  const router = useRouter()
  const [fields, setFields] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((f) => ({ ...f, [key]: e.target.value }))
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.errors) {
        setFieldErrors(data.errors)
      } else {
        setError(data.error ?? 'Registration failed')
      }
      setLoading(false)
      return
    }

    router.push('/admin/setup')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-950 to-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏚️</div>
          <h1 className="text-3xl font-bold text-green-400">Chore Quest</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your family's base.</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Field
            label="Your name"
            type="text"
            value={fields.name}
            onChange={set('name')}
            placeholder="e.g. Jamie"
            autoComplete="name"
            error={fieldErrors.name}
          />
          <Field
            label="Username"
            type="text"
            value={fields.username}
            onChange={set('username')}
            placeholder="e.g. jamie_parent"
            autoComplete="username"
            autoCapitalize="none"
            error={fieldErrors.username}
          />
          <Field
            label="Email address"
            type="email"
            value={fields.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
            error={fieldErrors.email}
          />
          <Field
            label="Password"
            type="password"
            value={fields.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={fieldErrors.password}
          />
          <Field
            label="Confirm password"
            type="password"
            value={fields.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:bg-green-900 disabled:text-green-700 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
          >
            {loading ? 'Setting up…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  )
}

function Field({
  label,
  error,
  ...inputProps
}: {
  label: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        className={`w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 border placeholder-gray-600 ${
          error ? 'border-red-700' : 'border-gray-700'
        }`}
        {...inputProps}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
