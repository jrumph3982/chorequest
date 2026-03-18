'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UndoApprovalButton({ instanceId }: { instanceId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUndo() {
    if (!confirm('Undo this approval? The chore will return to pending and rewards will be reversed.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/chore-instances/${instanceId}/undo`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Failed to undo')
      } else {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUndo}
      disabled={loading}
      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      {loading ? '…' : '↩ Undo'}
    </button>
  )
}
