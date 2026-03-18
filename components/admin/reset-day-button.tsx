'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ResetDayButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReset() {
    if (!confirm("Reset today's approvals? All chores approved today will return to pending and their XP/allowance rewards will be reversed.")) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reset-day', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error ?? 'Failed to reset')
      } else {
        alert(`Reset complete. ${data.reset} approval${data.reset !== 1 ? 's' : ''} undone.`)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
    >
      {loading ? '⏳ Resetting…' : '🔄 Reset Day'}
    </button>
  )
}
