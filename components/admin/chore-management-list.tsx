'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChoreToggle } from '@/components/admin/chore-toggle'

type FilterStatus = 'all' | 'active' | 'inactive'

interface Assignment {
  id: string
  child: { name: string }
}

interface Chore {
  id: string
  title: string
  category: string
  scheduleType: string
  basePoints: number
  difficultyScore: number
  active: boolean
  requiresApproval: boolean
  assignments: Assignment[]
}

const DIFF_STARS = (score: number) => Math.max(1, Math.min(3, Math.round(score / 3.5)))

const BORDER_COLOR: Record<FilterStatus | 'inactive', string> = {
  all:      'border-l-[#39ff14]',
  active:   'border-l-[#39ff14]',
  inactive: 'border-l-slate-600',
}

const CATEGORY_EMOJI: Record<string, string> = {
  household: '🧹', personal: '🪥', outdoor: '🌿', academic: '📚', pets: '🐾', cooking: '🍳',
}

export function ChoreManagementList({
  chores,
  children,
}: {
  chores: Chore[]
  children: { id: string; name: string }[]
}) {
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState<FilterStatus>('all')
  const [childFilter,setChildFilter]= useState<string>('all')

  const filtered = chores.filter((c) => {
    if (status === 'active'   && !c.active) return false
    if (status === 'inactive' && c.active)  return false
    if (childFilter !== 'all' && !c.assignments.some((a) => a.child.name === childFilter)) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-5">
      {/* Child selector chips */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setChildFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
            childFilter === 'all'
              ? 'bg-[#f29d26] text-slate-900'
              : 'bg-[#1e1e1e] border border-[#333] text-slate-300'
          }`}
        >
          👥 All Squad
        </button>
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setChildFilter(childFilter === child.name ? 'all' : child.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              childFilter === child.name
                ? 'bg-[#39ff14]/20 border border-[#39ff14]/50 text-[#39ff14] font-bold'
                : 'bg-[#1e1e1e] border border-[#333] text-slate-300'
            }`}
          >
            <span className="text-[14px]">👤</span>
            {child.name}
          </button>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tactical missions..."
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#39ff14]/50 focus:ring-1 focus:ring-[#39ff14]/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'active', 'inactive'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                status === f
                  ? 'bg-[#1e1e1e] border border-[#39ff14]/40 text-[#39ff14]'
                  : 'bg-[#1e1e1e] border border-[#333] text-slate-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mission cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">
          Active Operations ({filtered.length})
        </h3>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500 text-sm">No missions match your filters.</p>
          </div>
        ) : (
          filtered.map((chore) => {
            const stars = DIFF_STARS(chore.difficultyScore)
            const borderColor = chore.active ? 'border-l-[#39ff14]' : 'border-l-slate-600'

            return (
              <div
                key={chore.id}
                className={`bg-[#1e1e1e] rounded-xl p-4 border-l-4 ${borderColor} shadow-lg relative overflow-hidden group ${
                  !chore.active ? 'opacity-60' : ''
                }`}
              >
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase border ${
                    !chore.active
                      ? 'bg-slate-700/30 text-slate-500 border-slate-700/30'
                      : 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/20'
                  }`}>
                    {chore.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Title + difficulty */}
                <div className="pr-16">
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-[#39ff14] transition-colors">
                    {CATEGORY_EMOJI[chore.category] ?? '📋'} {chore.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Difficulty:</span>
                    <div className="flex text-[#f29d26] text-xs gap-0.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i}>{i < stars ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-600 uppercase">{chore.scheduleType}</span>
                    {!chore.requiresApproval && (
                      <span className="text-[10px] text-green-500 uppercase">auto-approve</span>
                    )}
                  </div>
                </div>

                {/* Operator + actions */}
                <div className="mt-4 flex items-center justify-between border-t border-[#333] pt-4">
                  <div className="flex items-center gap-3">
                    {chore.assignments.length > 0 ? (
                      chore.assignments.slice(0, 2).map((a) => (
                        <div key={a.id} className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-[#333] flex items-center justify-center text-sm">
                            👤
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black">Operator</p>
                            <p className="text-xs font-bold text-slate-200">{a.child.name}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-600">Unassigned</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/chores/${chore.id}/edit`}
                      className="text-xs text-[#00e5ff] hover:text-[#00e5ff]/80 font-bold uppercase tracking-wider"
                    >
                      Edit
                    </Link>
                    <ChoreToggle choreId={chore.id} active={chore.active} />
                  </div>
                </div>

                {/* Rewards */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-[#121212]/60 rounded-lg p-2 flex items-center gap-2 border border-[#333]">
                    <span className="text-[#00e5ff] text-sm">⚡</span>
                    <span className="text-xs font-black text-slate-100 italic">{chore.basePoints} XP</span>
                  </div>
                  <div className="bg-[#121212]/60 rounded-lg p-2 flex items-center gap-2 border border-[#333]">
                    <span className="text-[#f29d26] text-sm">🔩</span>
                    <span className="text-xs font-black text-slate-100 italic">{chore.basePoints} COINS</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
