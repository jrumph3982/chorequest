'use client'

import { useState } from 'react'
import { SidebarNav } from '@/components/admin/sidebar-nav'
import LogoutButton from '@/components/logout-button'
import { FeedbackButton } from '@/components/FeedbackButton'

interface Props {
  parentName: string
  householdName: string
  pendingApprovals: number
  pendingBonus: number
  children: React.ReactNode
}

export function AdminShell({
  parentName,
  householdName,
  pendingApprovals,
  pendingBonus,
  children,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const totalBadges = pendingApprovals + pendingBonus

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 w-60 flex flex-col',
          'bg-[#0d1527] border-r border-[#1e2d45]',
          'transition-transform duration-300 ease-in-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0 lg:shrink-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-[#1e2d45]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-base leading-none shrink-0">
              ⚔️
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-100 leading-tight">ChoreQuest</p>
              <p className="text-[10px] font-semibold text-[#22c55e]/80 uppercase tracking-wider leading-tight">
                Parent Portal
              </p>
            </div>
          </div>

          {/* Identity card */}
          <div className="bg-[#111c2d] rounded-lg px-3 py-2.5 border border-[#1e2d45]">
            <p className="text-xs font-semibold text-slate-100 truncate leading-tight">
              {parentName}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{householdName}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav pendingApprovals={pendingApprovals} pendingBonus={pendingBonus} />
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-[#1e2d45] space-y-2">
          <a
            href="/support"
            className="flex items-center gap-2 text-[15px] text-slate-400 hover:text-[#f29d26] transition-colors font-semibold"
          >
            <span>🍺</span> Buy Me a Drink
          </a>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600 font-mono">ChoreQuest v1</span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0d1527] border-b border-[#1e2d45] shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            aria-label="Open navigation"
          >
            {/* Hamburger */}
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect width="18" height="2" rx="1" fill="currentColor" />
              <rect y="6" width="13" height="2" rx="1" fill="currentColor" />
              <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base leading-none">⚔️</span>
            <span className="font-bold text-slate-100 text-sm truncate">ChoreQuest Admin</span>
          </div>

          {totalBadges > 0 && (
            <span className="bg-[#f29d26] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {totalBadges}
            </span>
          )}
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>
      <FeedbackButton />
    </div>
  )
}
