'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  childId: string
  currentCents: number
}

export function EditBalanceButton({ childId, currentCents }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState((currentCents / 100).toFixed(2))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const cents = Math.round(parseFloat(value || '0') * 100)
    if (isNaN(cents) || cents < 0) return
    setSaving(true)
    await fetch(`/api/admin/children/${childId}/balance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowanceBalanceCents: cents }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue((currentCents / 100).toFixed(2)); setEditing(true) }}
        className="text-xs font-semibold text-slate-500 hover:text-[#22c55e] transition-colors underline decoration-dotted underline-offset-2 ml-1"
        title="Edit balance"
      >
        ✏️
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-slate-400 text-sm">$</span>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus
        className="w-24 rounded-lg px-2 py-1 text-sm font-bold text-slate-100 bg-[#0f172a] border border-[#22c55e]/60 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/40"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs font-bold text-[#22c55e] hover:text-[#22c55e]/80 disabled:opacity-50"
      >
        {saving ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        ✕
      </button>
    </div>
  )
}
