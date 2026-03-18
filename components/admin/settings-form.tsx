'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SurvivalSettings } from '@/lib/game/settings'

interface Props {
  initial: SurvivalSettings
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-gray-300'}`}
        style={{ height: '1.375rem', width: '2.5rem' }}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  )
}

const DIFFICULTIES = ['easy', 'normal', 'hard'] as const
const DIFF_LABEL: Record<string, string> = { easy: 'Easy', normal: 'Normal', hard: 'Hard' }

export function SettingsForm({ initial }: Props) {
  const router = useRouter()
  const [s, setS] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function patch<K extends keyof SurvivalSettings>(key: K, value: SurvivalSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Nightly Attacks */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Nightly Attacks</h2>
        <p className="text-xs text-gray-500 mb-3">Controls whether zombie attacks run each night.</p>
        <Toggle
          label="Enable nightly attacks"
          value={s.nightAttacksEnabled}
          onChange={(v) => patch('nightAttacksEnabled', v)}
        />
      </div>

      {/* Chore Thresholds */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Chore Thresholds</h2>
        <p className="text-xs text-gray-500 mb-3">Points and critical chores required to defend.</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Minimum daily points</label>
            <input
              type="number"
              min={0}
              max={200}
              value={s.minimumDailyPoints}
              onChange={(e) => patch('minimumDailyPoints', Number(e.target.value))}
              className="w-20 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Required critical chores</label>
            <input
              type="number"
              min={0}
              max={10}
              value={s.requiredCriticalChores}
              onChange={(e) => patch('requiredCriticalChores', Number(e.target.value))}
              className="w-20 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Survival Difficulty</h2>
        <p className="text-xs text-gray-500 mb-3">Scales zombie damage multiplier.</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => patch('difficulty', d)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                s.difficulty === d
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Bonuses & Events */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Bonuses & Events</h2>
        <p className="text-xs text-gray-500 mb-3">Toggle gear, companion, and event modifiers.</p>
        <Toggle
          label="Enable gear bonuses"
          value={s.gearBonusesEnabled}
          onChange={(v) => patch('gearBonusesEnabled', v)}
        />
        <Toggle
          label="Enable companion bonuses"
          value={s.companionBonusesEnabled}
          onChange={(v) => patch('companionBonusesEnabled', v)}
        />
        <Toggle
          label="Enable seasonal events"
          value={s.eventsEnabled}
          onChange={(v) => patch('eventsEnabled', v)}
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
      </div>
    </div>
  )
}
