'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  instanceId: string
  currentPoints: number
}

export function TodayApprovalActions({ instanceId, currentPoints }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [points, setPoints] = useState(String(currentPoints))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function savePoints() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/chore-instances/${instanceId}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsAwarded: Number(points) }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to update points')
    } else {
      setEditing(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function rejectApproval() {
    if (!confirm('Reject this approval? Rewards will be reversed.')) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/chore-instances/${instanceId}/reject-approved`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to reject approval')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={1000}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-16 rounded-md px-2 py-1 text-xs text-slate-100"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button
            onClick={savePoints}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded-md font-bold uppercase"
            style={{ background: '#22c55e', color: '#052e16' }}
          >
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setError('') }}
            className="text-[10px] px-2 py-1 rounded-md font-bold uppercase text-slate-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            disabled={loading}
            className="text-[10px] font-bold uppercase text-blue-300"
          >
            Edit pts
          </button>
          <button
            onClick={rejectApproval}
            disabled={loading}
            className="text-[10px] font-bold uppercase text-red-300"
          >
            Reject
          </button>
        </div>
      )}
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  )
}
