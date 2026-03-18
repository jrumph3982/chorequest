'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  choreName?: string
  xpEarned?: number
  coinsEarned?: number
  currentXp?: number
  xpToNextLevel?: number
  level?: number
  onDismiss?: () => void
}

/**
 * RewardCompleteModal — full-screen overlay shown after a chore is approved.
 * Render conditionally from a parent component.
 *
 * Usage:
 *   {approved && (
 *     <RewardCompleteModal
 *       choreName="Clean Room"
 *       xpEarned={50}
 *       coinsEarned={20}
 *       currentXp={850}
 *       xpToNextLevel={1000}
 *       level={14}
 *       onDismiss={() => setApproved(false)}
 *     />
 *   )}
 */
export function RewardCompleteModal({
  choreName,
  xpEarned = 50,
  coinsEarned = 20,
  currentXp = 0,
  xpToNextLevel = 1000,
  level = 1,
  onDismiss,
}: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  const xpPct = Math.min(100, Math.round((currentXp / Math.max(1, xpToNextLevel)) * 100))
  const remaining = Math.max(0, xpToNextLevel - currentXp)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative flex flex-col w-full max-w-[480px] h-full bg-[#221b10] overflow-auto"
      >
        {/* Header */}
        <div className="flex items-center p-4 pb-2 justify-between z-10">
          <button
            onClick={dismiss}
            className="text-slate-100 flex w-12 h-12 shrink-0 items-center justify-center text-2xl"
          >
            ✕
          </button>
          <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12 opacity-60 uppercase">
            Mission Log
          </h2>
        </div>

        {/* Central graphic + title */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f29d26]/5 via-transparent to-transparent pointer-events-none" />

          {/* Treasure chest */}
          <div className="relative w-full aspect-square max-w-[260px] flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-[#f29d26]/20 rounded-full blur-[80px]" />
            <div className="absolute inset-4 border-2 border-[#f29d26]/30 rounded-full border-dashed opacity-60" />
            <span className="relative z-10 text-9xl" style={{ filter: 'drop-shadow(0 0 20px rgba(242,157,38,0.6))' }}>
              🎁
            </span>
          </div>

          {/* Mission complete text */}
          <div className="text-center space-y-2 mb-8 relative z-10">
            <h1
              className="text-[#f29d26] tracking-tighter text-[36px] font-extrabold leading-none"
              style={{ textShadow: '0 0 15px rgba(242,157,38,0.5)' }}
            >
              MISSION COMPLETE!
            </h1>
            {choreName && (
              <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">
                {choreName}
              </p>
            )}
          </div>

          {/* XP + Coins cards */}
          <div className="grid grid-cols-2 gap-4 w-full mb-8 relative z-10">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#f29d26]/20 bg-[#f29d26]/10 p-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f29d26]/20 text-[#f29d26]">
                <span className="text-3xl">⭐</span>
              </div>
              <div className="text-center">
                <h2 className="text-slate-100 text-xl font-bold leading-tight">+{xpEarned} XP</h2>
                <p className="text-[#f29d26]/70 text-[10px] font-bold uppercase tracking-wider">Experience Gained</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#f29d26]/20 bg-[#f29d26]/10 p-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f29d26]/20 text-[#f29d26]">
                <span className="text-3xl">🔩</span>
              </div>
              <div className="text-center">
                <h2 className="text-slate-100 text-xl font-bold leading-tight">+{coinsEarned}</h2>
                <p className="text-[#f29d26]/70 text-[10px] font-bold uppercase tracking-wider">Scrap Earned</p>
              </div>
            </div>
          </div>

          {/* Level progress */}
          <div className="w-full space-y-3 px-2 mb-8 relative z-10">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#f29d26]/70 uppercase tracking-widest">Rank Progression</span>
                <p className="text-slate-100 text-lg font-bold">Level {level}</p>
              </div>
              <p className="text-slate-100 text-sm font-bold bg-white/10 px-3 py-1 rounded-full border border-white/5">
                {currentXp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
              </p>
            </div>
            <div className="h-4 w-full rounded-full bg-slate-800 p-1 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f29d26] to-amber-300"
                style={{ width: `${xpPct}%`, boxShadow: '0 0 10px rgba(242,157,38,0.6)' }}
              />
            </div>
            {remaining > 0 && (
              <div className="flex items-center gap-2 text-[#f29d26]/80">
                <span className="text-sm">↑</span>
                <p className="text-xs font-semibold">{remaining.toLocaleString()} XP remaining to reach Level {level + 1}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-0 space-y-3 relative z-10">
          <button
            onClick={dismiss}
            className="w-full text-[#221b10] text-lg font-extrabold py-5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: '#f29d26',
              boxShadow: '0 8px 0 0 #b37119',
            }}
          >
            CONTINUE →
          </button>
          <Link
            href="/play/loadout"
            onClick={dismiss}
            className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full border-2 border-[#f29d26]/40 flex items-center justify-center text-2xl">
              🎒
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">View Inventory</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
