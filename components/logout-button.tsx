'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  redirectTo?: string
}

export default function LogoutButton({ redirectTo = '/login' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push(redirectTo)
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Logging out…' : 'Logout'}
    </button>
  )
}
