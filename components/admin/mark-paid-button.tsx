'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarkPaidButton({ recordId, amount }: { recordId: string; amount: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (!confirm(`Mark $${(amount / 100).toFixed(2)} as paid? This will reduce the child's balance.`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/allowance/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to mark as paid')
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
      style={{ background: '#22c55e', color: '#0a0a0a' }}
    >
      {loading ? '...' : 'Mark Paid'}
    </button>
  )
}
