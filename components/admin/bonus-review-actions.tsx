'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  requestId: string
  requestedPoints?: number | null
}

export function BonusReviewActions({ requestId, requestedPoints }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<'approve' | 'reject' | null>(null)
  const [approvedPoints, setApprovedPoints] = useState(String(requestedPoints ?? 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(action: 'approve' | 'reject') {
    setLoading(true)
    setError('')
    const body: Record<string, unknown> = { notes: notes || undefined }
    if (action === 'approve') body.approvedPoints = Number(approvedPoints)

    const res = await fetch(`/api/admin/bonus-requests/${requestId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed')
    }
    setLoading(false)
  }

  return (
    <div className="mt-3 space-y-2">
      {error && <p className="text-red-600 text-xs">{error}</p>}

      {expanded === null && (
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded('approve')}
            className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
          >
            ✅ Approve
          </button>
          <button
            onClick={() => setExpanded('reject')}
            className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {expanded === 'approve' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Award Points:</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={approvedPoints}
              onChange={(e) => setApprovedPoints(e.target.value)}
              className="border border-gray-200 rounded px-2 py-0.5 text-xs w-20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => submit('approve')}
              disabled={loading}
              className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '…' : 'Confirm Approve'}
            </button>
            <button onClick={() => setExpanded(null)} className="text-xs text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {expanded === 'reject' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
          <textarea
            placeholder="Reason (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={() => submit('reject')}
              disabled={loading}
              className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '…' : 'Confirm Reject'}
            </button>
            <button onClick={() => setExpanded(null)} className="text-xs text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
