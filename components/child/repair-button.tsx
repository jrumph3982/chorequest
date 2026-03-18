'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { REPAIR_TIERS } from '@/lib/game/base'
import type { BaseComponent, RepairTier } from '@/lib/game/base'

interface Props {
  component: BaseComponent
  currentDamage: number
  scrap: number
}

const COMPONENT_LABEL: Record<BaseComponent, string> = {
  door:       'Door',
  barricade:  'Barricade',
  fence:      'Fence',
  light:      'Lights',
  watchtower: 'Watchtower',
  turret:     'Turret',
}

export function RepairButton({ component, currentDamage, scrap }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (currentDamage === 0) {
    return (
      <span className="text-xs text-green-500 font-medium">✓ Intact</span>
    )
  }

  async function repair(tier: RepairTier) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/child/base/repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ component, tier }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Repair failed')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-1.5">
        <button
          onClick={() => repair('light')}
          disabled={loading || scrap < REPAIR_TIERS.light.scrapCost}
          title={`Repair ${COMPONENT_LABEL[component]} (light) — -${REPAIR_TIERS.light.repairAmount} dmg`}
          className="text-xs px-2 py-1 rounded font-medium bg-yellow-800 text-yellow-200 hover:bg-yellow-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '…' : `🔧 ${REPAIR_TIERS.light.scrapCost}🔩`}
        </button>
        <button
          onClick={() => repair('heavy')}
          disabled={loading || scrap < REPAIR_TIERS.heavy.scrapCost}
          title={`Repair ${COMPONENT_LABEL[component]} (heavy) — -${REPAIR_TIERS.heavy.repairAmount} dmg`}
          className="text-xs px-2 py-1 rounded font-medium bg-orange-800 text-orange-200 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '…' : `🔨 ${REPAIR_TIERS.heavy.scrapCost}🔩`}
        </button>
      </div>
    </div>
  )
}
