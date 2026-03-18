'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  instanceId: string
  basePoints: number
}

export function ApprovalActions({ instanceId, basePoints }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [pointsOverride, setPointsOverride] = useState(String(basePoints))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(action: 'approve' | 'reject') {
    setLoading(true)
    setError('')
    const body: Record<string, unknown> = { notes: notes || undefined }
    if (action === 'approve') body.pointsOverride = Number(pointsOverride)

    const res = await fetch(`/api/admin/chore-instances/${instanceId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
      setError(msg ?? 'Request failed')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg px-3 py-2 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/30">
          ⚠ {error}
        </div>
      )}

      {/* Primary action buttons */}
      {expanded === null && (
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded('approve')}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }}
          >
            ✅ Approve
          </button>
          <button
            onClick={() => setExpanded('reject')}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            ✗ Reject
          </button>
        </div>
      )}

      {/* Approve expand panel */}
      {expanded === 'approve' && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <p className="text-xs font-bold text-[#22c55e] uppercase tracking-wider">Confirm Approval</p>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 shrink-0">Points awarded:</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={pointsOverride}
              onChange={(e) => setPointsOverride(e.target.value)}
              className="w-20 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-bold"
              style={{ background: '#0f172a', border: '1px solid rgba(34,197,94,0.3)' }}
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg px-3 py-2 text-xs text-slate-200 resize-none"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => submit('approve')}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all active:scale-95"
              style={{ background: '#22c55e', color: '#052e16' }}
            >
              {loading ? '⏳ Saving…' : '✓ Confirm Approve'}
            </button>
            <button
              onClick={() => { setExpanded(null); setError('') }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reject expand panel */}
      {expanded === 'reject' && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Confirm Rejection</p>
          <textarea
            placeholder="Reason for rejection (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg px-3 py-2 text-xs text-slate-200 resize-none"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => submit('reject')}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all active:scale-95"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              {loading ? '⏳ Saving…' : '✗ Confirm Reject'}
            </button>
            <button
              onClick={() => { setExpanded(null); setError('') }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
