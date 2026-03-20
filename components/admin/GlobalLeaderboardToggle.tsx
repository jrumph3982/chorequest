'use client'

import { useState } from 'react'

interface Props {
  initialEnabled: boolean
}

export function GlobalLeaderboardToggle({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    const next = !enabled
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/household/leaderboard-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const data = await res.json()
      setEnabled(data.enabled)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-pressed={enabled}
          className="relative inline-flex shrink-0 h-6 w-11 rounded-full border-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 disabled:opacity-50"
          style={{
            borderColor: enabled ? '#22c55e' : '#334155',
            background: enabled ? 'rgba(34,197,94,0.2)' : 'rgba(51,65,85,0.4)',
          }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full transition-transform duration-200 mt-0.5"
            style={{
              background: enabled ? '#22c55e' : '#64748b',
              transform: enabled ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-200">
            Include our family on the global leaderboard
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Your children&apos;s first names, level, and weekly stats will be visible to other families.
          </p>
          <p className="text-xs font-medium mt-1" style={{ color: enabled ? '#22c55e' : '#64748b' }}>
            {enabled ? 'Participating — your family is visible on the global board' : 'Not participating — your family is hidden'}
          </p>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
