'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  eventId: string
  active: boolean
}

export function EventToggle({ eventId, active: initialActive }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/admin/events/${eventId}/toggle`, { method: 'PATCH' })
    if (res.ok) {
      const data = await res.json()
      setActive(data.active)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
        active
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {loading ? '…' : active ? '✓ Enabled' : 'Disabled'}
    </button>
  )
}
