'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UPGRADE_COSTS, MAX_COMPONENT_LEVEL } from '@/lib/game/base'
import type { BaseComponent } from '@/lib/game/base'

interface Props {
  component: BaseComponent
  currentLevel: number
  scrap: number
}

export function UpgradeButton({ component, currentLevel, scrap }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (currentLevel >= MAX_COMPONENT_LEVEL) {
    return <span className="text-xs text-blue-400 font-semibold">★ MAX</span>
  }

  const cost = UPGRADE_COSTS[currentLevel] ?? 0
  const canAfford = scrap >= cost

  async function upgrade() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/child/base/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ component }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Upgrade failed')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        onClick={upgrade}
        disabled={loading || !canAfford}
        title={canAfford ? `Upgrade to level ${currentLevel + 1}` : `Need ${cost} 🔩 (have ${scrap})`}
        className="text-xs px-2 py-1 rounded font-medium bg-blue-900 text-blue-200 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '…' : `⬆ ${cost}🔩`}
      </button>
    </div>
  )
}
