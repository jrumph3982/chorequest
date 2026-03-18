'use client'

import { useEffect, useState } from 'react'
import { xpProgressInLevel } from '@/lib/game/leveling'

interface Props {
  xp: number
}

export function XpBar({ xp }: Props) {
  const { level, xpIntoLevel, xpNeeded, progress, isMaxLevel } = xpProgressInLevel(xp)
  const targetPct = Math.min(100, Math.round(progress * 100))

  // Animate from 0 to target on mount
  const [displayPct, setDisplayPct] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(targetPct), 50)
    return () => clearTimeout(t)
  }, [targetPct])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚔️</span>
          <span className="font-bold text-white text-sm">Level {level}</span>
        </div>
        {isMaxLevel ? (
          <span className="text-xs text-yellow-400 font-medium">✨ MAX LEVEL</span>
        ) : (
          <span className="text-xs text-gray-400">
            {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
        )}
      </div>

      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-green-500 h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${displayPct}%` }}
        />
      </div>

      {!isMaxLevel && (
        <p className="text-xs text-gray-600 mt-1.5">
          {(xpNeeded - xpIntoLevel).toLocaleString()} XP to Level {level + 1}
        </p>
      )}
    </div>
  )
}
