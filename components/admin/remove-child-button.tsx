'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RemoveChildButton({ childId, childName }: { childId: string; childName: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRemove() {
    if (!confirm(`Are you sure you want to remove ${childName}? This will permanently delete their profile, chores, inventory, stats, and allowance history.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/children/${childId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to remove child')
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="shrink-0 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
    >
      {loading ? '…' : 'Remove'}
    </button>
  )
}
