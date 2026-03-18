'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  childId: string
  companionId: string
  alreadyOwned: boolean
}

export function GiftCompanionButton({ childId, companionId, alreadyOwned }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyOwned)

  async function handleGift() {
    setLoading(true)
    const res = await fetch(`/api/admin/children/${childId}/gift-companion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companionId }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
  }

  if (done) {
    return (
      <span
        className="text-xs font-bold px-3 py-1.5 rounded-lg"
        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
      >
        ✓ Owned
      </span>
    )
  }

  return (
    <button
      onClick={handleGift}
      disabled={loading}
      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
      style={{
        background: loading ? 'rgba(249,115,22,0.05)' : 'rgba(249,115,22,0.1)',
        border: '1px solid rgba(249,115,22,0.3)',
        color: loading ? '#64748b' : '#f97316',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '...' : 'Gift'}
    </button>
  )
}
