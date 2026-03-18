'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHORE_CATEGORIES } from '@/lib/validation/chores'
import { TemplateLibraryModal } from './TemplateLibraryModal'

interface ChoreTemplateData {
  name: string
  description: string | null
  category: string
  defaultPoints: number
  scheduleType: string
  requiresPhoto: boolean
}

type AssignMode = 'none' | 'single' | 'multiple' | 'all'

interface ChoreData {
  id:               string
  title:            string
  description:      string | null
  category:         string
  scheduleType:     string
  scheduleDays?:    number[]
  timeWindow?:      string
  rolloverEnabled?: boolean
  rolloverGraceDays?: number
  difficultyScore:  number
  basePoints:       number
  requiresApproval: boolean
}

interface Props {
  initialData?:              ChoreData
  children:                  { id: string; name: string }[]
  initialAssignedChildIds?:  string[]
}

const CATEGORY_ICON: Record<string, string> = {
  bedroom:   '🛏️',
  kitchen:   '🍳',
  hygiene:   '🪥',
  pet:       '🐾',
  school:    '📚',
  outside:   '🌿',
  household: '🧹',
  other:     '📋',
}

const ASSIGN_MODE_LABEL: Record<AssignMode, string> = {
  none:     'Unassigned',
  single:   'Single child',
  multiple: 'Multiple',
  all:      'All children',
}

function inferAssignMode(
  assignedIds: string[],
  allChildren: { id: string }[],
): AssignMode {
  if (assignedIds.length === 0) return 'none'
  if (allChildren.length > 0 && assignedIds.length === allChildren.length) return 'all'
  if (assignedIds.length === 1) return 'single'
  return 'multiple'
}

export function ChoreForm({ initialData, children, initialAssignedChildIds = [] }: Props) {
  const router = useRouter()
  const isEdit = Boolean(initialData)

  const [form, setForm] = useState(() => {
    const assignedIds = initialAssignedChildIds
    return {
      title:             initialData?.title             ?? '',
      description:       initialData?.description       ?? '',
      category:          initialData?.category          ?? 'household',
      scheduleType:      initialData?.scheduleType      ?? 'daily',
      scheduleDays:      initialData?.scheduleDays      ?? [] as number[],
      timeWindow:        initialData?.timeWindow        ?? 'any',
      rolloverEnabled:   initialData?.rolloverEnabled   ?? true,
      rolloverGraceDays: initialData?.rolloverGraceDays ?? 0,
      difficultyScore:   initialData?.difficultyScore   ?? 3,
      basePoints:        initialData?.basePoints        ?? 50,
      requiresApproval:  initialData?.requiresApproval  ?? true,
      assignMode:        inferAssignMode(assignedIds, children) as AssignMode,
      childUserIds:      assignedIds,
    }
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [templateName, setTemplateName] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  function set(key: string, value: string | boolean | number | string[] | number[]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applyTemplate(t: ChoreTemplateData) {
    const validCategory = CHORE_CATEGORIES.includes(t.category as typeof CHORE_CATEGORIES[number])
      ? t.category
      : 'other'
    const validSchedule = ['daily', 'weekly'].includes(t.scheduleType) ? t.scheduleType : 'daily'
    setForm((prev) => ({
      ...prev,
      title: t.name,
      description: t.description ?? '',
      category: validCategory,
      scheduleType: validSchedule,
      basePoints: t.defaultPoints,
      requiresApproval: true,
    }))
    setTemplateName(t.name)
  }

  function setAssignMode(mode: AssignMode) {
    setForm((prev) => ({
      ...prev,
      assignMode:   mode,
      childUserIds: mode === 'all' ? children.map((c) => c.id) : [],
    }))
  }

  function toggleChild(id: string) {
    setForm((prev) => ({
      ...prev,
      childUserIds: prev.childUserIds.includes(id)
        ? prev.childUserIds.filter((x) => x !== id)
        : [...prev.childUserIds, id],
    }))
  }

  // Compute final assignment IDs for submission
  function resolveChildUserIds(): string[] {
    switch (form.assignMode) {
      case 'none':     return []
      case 'all':      return children.map((c) => c.id)
      case 'single':   return form.childUserIds.slice(0, 1)
      case 'multiple': return form.childUserIds
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const url    = isEdit ? `/api/admin/chores/${initialData!.id}` : '/api/admin/chores'
    const method = isEdit ? 'PATCH' : 'POST'
    const assignedIds = resolveChildUserIds()
    const body = {
      title:             form.title,
      description:       form.description || undefined,
      category:          form.category,
      scheduleType:      form.scheduleType,
      scheduleDays:      form.scheduleType === 'specific_days' ? form.scheduleDays : [],
      timeWindow:        form.timeWindow,
      rolloverEnabled:   form.rolloverEnabled,
      rolloverGraceDays: form.rolloverGraceDays,
      difficultyScore:   form.difficultyScore,
      basePoints:        form.basePoints,
      requiresApproval:  form.requiresApproval,
      // Always send childUserIds so edits can clear all assignments (empty array)
      ...(children.length > 0 ? { childUserIds: assignedIds } : {}),
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/admin/chores')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  const inputCls =
    'w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500'

  return (
    <>
    <TemplateLibraryModal
      open={showTemplateModal}
      onClose={() => setShowTemplateModal(false)}
      onSelectTemplate={applyTemplate}
    />
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-32">
      {error && (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Category selector */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Mission Category</p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {CHORE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => set('category', cat)}
              className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-2xl transition-all ${
                form.category === cat
                  ? 'bg-[#22c55e] text-slate-950 ring-2 ring-[#22c55e] ring-offset-4 ring-offset-[#0f172a]'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {CATEGORY_ICON[cat] ?? '📋'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2 capitalize">{form.category}</p>
      </div>

      {/* Title + Description */}
      <div className="px-4 py-4 space-y-5">
        <label className="block space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-slate-300 text-sm font-semibold">Mission Title *</p>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="text-xs font-bold px-3 py-1 rounded-lg bg-[#1a3018] border border-[#3dff7a]/40 text-[#3dff7a] hover:bg-[#3dff7a]/10 transition-colors"
            >
              📚 FROM LIBRARY
            </button>
          </div>
          {templateName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a3018] border border-[#3dff7a]/20">
              <span className="text-xs">📚</span>
              <span className="text-xs text-[#3dff7a] font-medium">Based on: {templateName}</span>
              <button
                type="button"
                onClick={() => setTemplateName(null)}
                className="ml-auto text-[#4a7a40] hover:text-slate-400 text-xs"
              >
                ×
              </button>
            </div>
          )}
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g., Tactical Room Sweep (Clean Living Room)"
            maxLength={100}
            required
          />
        </label>

        <label className="block space-y-2">
          <p className="text-slate-300 text-sm font-semibold">Mission Description</p>
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Clear all toy zombies from the floor and neutralize the laundry pile..."
            maxLength={500}
            rows={3}
          />
        </label>
      </div>

      {/* Difficulty */}
      <div className="px-4 py-4">
        <p className="text-slate-300 text-sm font-semibold mb-3">Difficulty Level</p>
        <div className="flex items-center gap-2 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
          {Array.from({ length: 10 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => set('difficultyScore', i + 1)}
              className={`text-xl transition-transform hover:scale-110 ${
                i < form.difficultyScore ? 'text-[#22c55e]' : 'text-slate-600'
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-auto text-xs font-bold text-slate-400 uppercase">Level {form.difficultyScore}</span>
        </div>
      </div>

      {/* Reward settings */}
      <div className="px-4 py-4">
        <p className="text-slate-300 text-sm font-semibold mb-3">Reward Settings</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[#22c55e]">⚡</span>
              <span className="text-xs font-bold text-slate-400 uppercase">XP Points</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set('basePoints', Math.max(1, form.basePoints - 10))}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold hover:bg-slate-600 transition-colors"
              >
                −
              </button>
              <span className="text-xl font-bold text-slate-100 w-12 text-center">{form.basePoints}</span>
              <button
                type="button"
                onClick={() => set('basePoints', Math.min(1000, form.basePoints + 10))}
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold hover:bg-slate-600 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🔩</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Scrap</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-sm">≈</span>
              <span className="text-xl font-bold text-slate-100">{Math.round(form.basePoints / 2)}</span>
            </div>
            <p className="text-[10px] text-slate-500 text-center">Auto-calculated from XP</p>
          </div>
        </div>
      </div>

      {/* Frequency */}
      <div className="px-4 py-4">
        <p className="text-slate-300 text-sm font-semibold mb-3">Frequency</p>
        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'weekly', 'specific_days'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set('scheduleType', type)}
              className={`py-2 px-1 rounded-lg border text-xs font-bold transition-colors capitalize ${
                form.scheduleType === type
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'
              }`}
            >
              {type === 'specific_days' ? 'Specific Days' : type}
            </button>
          ))}
        </div>

        {/* Specific days picker */}
        {form.scheduleType === 'specific_days' && (
          <div className="mt-3">
            <p className="text-slate-400 text-xs mb-2">Select days:</p>
            <div className="flex gap-1.5">
              {[
                { day: 1, label: 'M' },
                { day: 2, label: 'T' },
                { day: 3, label: 'W' },
                { day: 4, label: 'T' },
                { day: 5, label: 'F' },
                { day: 6, label: 'S' },
                { day: 7, label: 'S' },
              ].map(({ day, label }) => {
                const selected = (form.scheduleDays as number[]).includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const days = form.scheduleDays as number[]
                      set('scheduleDays', selected ? days.filter((d) => d !== day) : [...days, day])
                    }}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold border transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Time window */}
        <div className="mt-3">
          <p className="text-slate-400 text-xs mb-2">Time Window:</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(['any', 'morning', 'afternoon', 'evening'] as const).map((tw) => (
              <button
                key={tw}
                type="button"
                onClick={() => set('timeWindow', tw)}
                className={`py-1.5 rounded-lg border text-xs font-bold transition-colors capitalize ${
                  form.timeWindow === tw
                    ? 'border-[#f29d26] bg-[#f29d26]/10 text-[#f29d26]'
                    : 'border-slate-700 bg-slate-800/50 text-slate-500 hover:border-slate-600'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>
        </div>

        {/* Rollover toggle */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => set('rolloverEnabled', !form.rolloverEnabled)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
              form.rolloverEnabled
                ? 'border-[#f29d26]/30 bg-[#f29d26]/5'
                : 'border-slate-700 bg-slate-800/30'
            }`}
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-300">Rollover</p>
              <p className="text-[10px] text-slate-500">Allow incomplete tasks to roll to next day</p>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.rolloverEnabled ? 'bg-[#f29d26]' : 'bg-slate-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${form.rolloverEnabled ? 'left-5' : 'left-0.5'}`} />
            </div>
          </button>
          {form.rolloverEnabled && (
            <div className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700">
              <span className="text-xs text-slate-400">Grace days:</span>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={() => set('rolloverGraceDays', Math.max(0, (form.rolloverGraceDays as number) - 1))} className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-600">−</button>
                <span className="text-sm font-bold text-slate-200 w-6 text-center">{form.rolloverGraceDays as number}</span>
                <button type="button" onClick={() => set('rolloverGraceDays', Math.min(7, (form.rolloverGraceDays as number) + 1))} className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-600">+</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-slate-500 text-xs italic mt-2.5 flex items-center gap-1.5">
          <span>ℹ️</span>
          {form.scheduleType === 'daily'
            ? 'Resets every morning.'
            : form.scheduleType === 'weekly'
            ? 'Resets every week on Sunday.'
            : form.scheduleType === 'specific_days'
            ? `Only runs on selected days (${(form.scheduleDays as number[]).length} selected).`
            : form.scheduleType}
        </p>
      </div>

      {/* Requires approval toggle */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => set('requiresApproval', !form.requiresApproval)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
            form.requiresApproval
              ? 'border-blue-500/30 bg-blue-500/10'
              : 'border-slate-700 bg-slate-800/30'
          }`}
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-200">Requires Approval</p>
            <p className="text-xs text-slate-500">Adult must verify before XP is awarded</p>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-colors ${form.requiresApproval ? 'bg-blue-500' : 'bg-slate-700'}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${form.requiresApproval ? 'left-7' : 'left-1'}`} />
          </div>
        </button>
      </div>

      {/* ── Assignment section ── */}
      {children.length > 0 && (
        <div className="px-4 py-4 space-y-4">
          <p className="text-slate-300 text-sm font-semibold">Assign to Operator</p>

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2">
            {(['none', 'single', 'multiple', 'all'] as AssignMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAssignMode(mode)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors text-left flex items-center gap-2 ${
                  form.assignMode === mode
                    ? 'border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                }`}
              >
                <span className="text-base leading-none">
                  {mode === 'none' ? '—' : mode === 'single' ? '👤' : mode === 'multiple' ? '👥' : '🏠'}
                </span>
                {ASSIGN_MODE_LABEL[mode]}
              </button>
            ))}
          </div>

          {/* Single child — dropdown */}
          {form.assignMode === 'single' && (
            <select
              value={form.childUserIds[0] ?? ''}
              onChange={(e) => set('childUserIds', e.target.value ? [e.target.value] : [])}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none focus:ring-2 focus:ring-[#22c55e]/50"
            >
              <option value="">— Select a child —</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Multiple children — checkboxes */}
          {form.assignMode === 'multiple' && (
            <div className="space-y-2">
              {children.map((c) => {
                const checked = form.childUserIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChild(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      checked
                        ? 'border-[#22c55e]/50 bg-[#22c55e]/8 text-[#22c55e]'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-[#22c55e] border-[#22c55e]' : 'border-slate-600'
                    }`}>
                      {checked && <span className="text-slate-900 text-xs font-black">✓</span>}
                    </span>
                    <span className="text-sm font-medium">👤 {c.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* All — confirmation banner */}
          {form.assignMode === 'all' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#f29d26]/30 bg-[#f29d26]/8">
              <span className="text-xl">🏠</span>
              <div>
                <p className="text-sm font-bold text-[#f29d26]">Assigned to all {children.length} children</p>
                <p className="text-xs text-slate-500">Each child will receive this mission</p>
              </div>
            </div>
          )}

          {/* Summary line */}
          {form.assignMode !== 'none' && (
            <p className="text-[10px] text-slate-500 px-1">
              {form.assignMode === 'all'
                ? `${children.length} assignment${children.length !== 1 ? 's' : ''} will be created`
                : form.assignMode === 'single'
                ? form.childUserIds[0]
                  ? `Assigned to: ${children.find((c) => c.id === form.childUserIds[0])?.name}`
                  : 'No child selected yet'
                : form.childUserIds.length > 0
                ? `${form.childUserIds.length} child${form.childUserIds.length !== 1 ? 'ren' : ''} selected`
                : 'No children selected yet'}
            </p>
          )}
        </div>
      )}

      {/* No children in household */}
      {children.length === 0 && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30">
            <span className="text-slate-500">ℹ️</span>
            <p className="text-xs text-slate-500">Add children under <strong className="text-slate-300">Children</strong> to assign missions.</p>
          </div>
        </div>
      )}

      {/* Footer deploy button */}
      <div
        className="sticky bottom-0 left-0 right-0 p-4 pt-10"
        style={{ background: 'linear-gradient(to top, #0f172a, #0f172a, transparent)' }}
      >
        <button
          type="submit"
          disabled={loading}
          className="w-full max-w-md mx-auto flex bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-[#22c55e]/20 items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 uppercase tracking-wider"
        >
          🛡️ {loading ? 'Deploying…' : isEdit ? 'Save Changes' : 'Deploy Mission'}
        </button>
      </div>
    </form>
    </>
  )
}
