'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SurvivalSettings } from '@/lib/game/settings'

// ─── Design tokens (matching Stitch export) ───────────────────────────────────
const CLR_GREEN  = '#39ff14'
const CLR_BLUE   = '#00d4ff'
const CLR_BG     = '#020617'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  emoji,
  label,
  color,
}: {
  emoji: string
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span style={{ color, fontSize: 16 }}>{emoji}</span>
      <h2
        className="text-xs font-bold uppercase tracking-widest text-slate-400"
        style={{ letterSpacing: '0.12em' }}
      >
        {label}
      </h2>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center cursor-pointer flex-shrink-0"
      style={{ width: 44, height: 24 }}
    >
      <span
        className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ background: checked ? CLR_GREEN : '#334155' }}
      />
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ left: 2, transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function SegmentedButtons<T extends string>({
  options,
  value,
  onChange,
  activeStyle,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  activeStyle: React.CSSProperties
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="py-2 text-xs font-bold rounded-lg transition-all"
            style={
              active
                ? activeStyle
                : { background: '#1e293b', color: '#94a3b8', border: '1px solid transparent' }
            }
          >
            {opt.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface Props {
  initial: SurvivalSettings
}

export function GameSettingsForm({ initial }: Props) {
  const router = useRouter()

  const [eventsEnabled,      setEventsEnabled]      = useState(initial.eventsEnabled)
  const [nightRaidFrequency, setNightRaidFrequency] = useState(
    initial.nightRaidFrequency as 'daily' | 'weekly' | 'custom',
  )
  const [allowancePointsPerDollar, setAllowancePointsPerDollar] = useState(
    initial.allowancePointsPerDollar ?? 100,
  )

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/admin/settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventsEnabled,
        nightRaidFrequency,
        allowancePointsPerDollar,
      }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      setError('Failed to save. Please try again.')
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8">

      {/* ── Event Controls ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader emoji="⚡" label="Event Controls" color={CLR_BLUE} />
        <div
          className="border border-slate-800 rounded-2xl divide-y divide-slate-800"
          style={{ background: 'rgba(15,23,42,0.4)' }}
        >
          {/* Zombie Event toggle */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                💀
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Zombie Event</p>
                <p className="text-xs text-slate-500">Random mid-day chore spawns</p>
              </div>
            </div>
            <Toggle checked={eventsEnabled} onChange={setEventsEnabled} />
          </div>

          {/* Night Raid Frequency */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
              >
                🌙
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Night Raid Frequency</p>
                <p className="text-xs text-slate-500">Special late-night reward windows</p>
              </div>
            </div>
            <SegmentedButtons
              options={['daily', 'weekly', 'custom'] as const}
              value={nightRaidFrequency}
              onChange={setNightRaidFrequency}
              activeStyle={{
                background: `rgba(0,212,255,0.2)`,
                color:      CLR_BLUE,
                border:     `1px solid rgba(0,212,255,0.3)`,
                boxShadow:  '0 0 10px rgba(0,212,255,0.2)',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Economy ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader emoji="💰" label="Economy" color="#eab308" />
        <div
          className="border border-slate-800 rounded-2xl p-5"
          style={{ background: 'rgba(15,23,42,0.4)' }}
        >
          <div className="space-y-3">
            <label className="block text-sm font-bold uppercase tracking-tight text-slate-300">
              Points per $1.00 allowance
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10000}
                value={allowancePointsPerDollar}
                onChange={(e) => setAllowancePointsPerDollar(Number(e.target.value || 0))}
                className="w-28 rounded-lg px-3 py-2 text-sm font-bold text-slate-100"
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <span className="text-xs text-slate-500">
                Example: {allowancePointsPerDollar || 100} pts = $1.00
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic px-1">
              Higher numbers make allowance harder to earn.
            </p>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      {/* Save button */}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          background:  CLR_GREEN,
          color:       CLR_BG,
          boxShadow:   saving || saved ? 'none' : '0 0 20px rgba(57,255,20,0.4)',
        }}
      >
        <span>💾</span>
        {saving ? 'SAVING…' : saved ? 'SAVED ✓' : 'SAVE SETTINGS'}
      </button>
    </div>
  )
}
