'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  choreId: string
  active: boolean
}

export function ChoreToggle({ choreId, active }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/admin/chores/${choreId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded font-medium disabled:opacity-50 ${
        active
          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
          : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
      }`}
    >
      {loading ? '…' : active ? 'Deactivate' : 'Activate'}
    </button>
  )
}
