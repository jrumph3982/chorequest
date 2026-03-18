'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  itemId: string
  cost: number
  owned: boolean
  levelMet: boolean
  canAfford: boolean
}

export function BuyButton({ itemId, cost, owned, levelMet, canAfford }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bought, setBought] = useState(false)
  const [error, setError] = useState('')

  if (owned || bought) {
    return (
      <span className="text-xs bg-green-900 text-green-300 px-3 py-1.5 rounded-lg font-medium">
        ✓ {bought ? 'Got it!' : 'Owned'}
      </span>
    )
  }

  if (!levelMet) {
    return (
      <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg">
        🔒 Level req.
      </span>
    )
  }

  async function buy() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/child/shop/${itemId}/buy`, { method: 'POST' })
    if (res.ok) {
      setBought(true)
      setTimeout(() => router.refresh(), 1500)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Purchase failed')
    }
    setLoading(false)
  }

  return (
    <div className="text-right">
      {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
      <button
        onClick={buy}
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
