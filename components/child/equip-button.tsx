'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  itemId: string
  equipped: boolean
}

export function EquipButton({ itemId, equipped: initialEquipped }: Props) {
  const router = useRouter()
  const [equipped, setEquipped] = useState(initialEquipped)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/child/shop/${itemId}/equip`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setEquipped(data.equipped)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
        equipped
          ? 'bg-green-900 text-green-300 hover:bg-green-800'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {loading ? '…' : equipped ? '✓ Equipped' : 'Equip'}
    </button>
  )
}
