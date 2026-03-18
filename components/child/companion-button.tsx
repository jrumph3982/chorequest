'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'buy' | 'owned' | 'equipped'

interface Props {
  companionId: string
  cost: number
  owned: boolean
  equipped: boolean
  levelMet: boolean
  canAfford: boolean
}

export function CompanionButton({
  companionId,
  cost,
  owned: initialOwned,
  equipped: initialEquipped,
  levelMet,
  canAfford,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(
    initialOwned ? (initialEquipped ? 'equipped' : 'owned') : 'buy',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function acquire() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/child/companions/${companionId}/acquire`, { method: 'POST' })
    if (res.ok) {
      setMode('owned')
      setTimeout(() => router.refresh(), 1000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed')
    }
    setLoading(false)
  }

  async function toggleEquip() {
    setLoading(true)
    const res = await fetch(`/api/child/companions/${companionId}/equip`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setMode(data.equipped ? 'equipped' : 'owned')
      router.refresh()
    }
    setLoading(false)
  }

  if (mode === 'equipped') {
    return (
      <button
        onClick={toggleEquip}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-900 text-green-300 hover:bg-green-800 disabled:opacity-40 transition-colors"
      >
        {loading ? '…' : '✓ With you'}
      </button>
    )
  }

  if (mode === 'owned') {
    return (
      <button
        onClick={toggleEquip}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 transition-colors"
      >
        {loading ? '…' : 'Send out'}
      </button>
    )
  }

  // Buy mode
  if (!levelMet) {
    return (
      <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg">
        🔒 Level req.
      </span>
    )
  }

  return (
    <div className="text-right">
      {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
      <button
        onClick={acquire}
        disabled={loading || !canAfford}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          canAfford
            ? 'bg-green-600 text-white hover:bg-green-500'
            : 'bg-gray-800 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? '…' : canAfford ? `🔩 ${cost}` : `Need 🔩 ${cost}`}
      </button>
    </div>
  )
}
