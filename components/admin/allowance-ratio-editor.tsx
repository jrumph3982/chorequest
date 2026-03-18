'use client'

import { useState } from 'react'

export function AllowanceRatioEditor({ initialRatio }: { initialRatio: number }) {
  const [ratio, setRatio] = useState(String(initialRatio))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const parsed = parseInt(ratio, 10)
    if (isNaN(parsed) || parsed < 1 || parsed > 10000) {
      setError('Ratio must be between 1 and 10000')
      return
    }
    setSaving(true)
    setError('')
    setSaved(false)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowancePointsPerDollar: parsed }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
      <h3 className="text-sm font-bold text-slate-100 mb-1">Point → Dollar Ratio</h3>
      <p className="text-xs text-slate-400 mb-4">
        How many chore points equal $1.00 of allowance.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="number"
            min={1}
            max={10000}
            value={ratio}
            onChange={(e) => { setRatio(e.target.value); setSaved(false) }}
            className="w-24 rounded-lg text-slate-100 bg-[#0f172a] border border-[#334155] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40 h-10 px-3 text-sm"
          />
          <span className="text-sm text-slate-400">points = $1.00</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
          style={{ background: '#22c55e', color: '#0a0a0a' }}
        >
          {saving ? '…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <p className="text-xs text-slate-500 mt-3">
        Example: {ratio || '100'} pts → $1.00 · 10 pts → ${(10 / (parseInt(ratio) || 100)).toFixed(2)}
      </p>
    </div>
  )
}
