'use client'

import { useEffect, useState } from 'react'

interface Achievement {
  slug: string
  name: string
  description: string
  icon: string | null
  rarity: string
  xpReward: number
  scrapsReward: number
  rewardType: string
}

interface UserAchievement {
  id: string
  earnedAt: string
  achievement: Achievement
}

const RARITY_COLORS: Record<string, string> = {
  bronze:    '#cd7f32',
  silver:    '#c0c0c0',
  gold:      '#ffd700',
  legendary: '#9b59b6',
}

const RARITY_LABELS: Record<string, string> = {
  bronze:    'BRONZE',
  silver:    'SILVER',
  gold:      'GOLD',
  legendary: 'LEGENDARY',
}

export function AchievementUnlockOverlay() {
  const [queue, setQueue] = useState<UserAchievement[]>([])
  const [current, setCurrent] = useState<UserAchievement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fetch unnotified achievements on mount
    fetch('/api/child/achievements/unnotified')
      .then((r) => r.json())
      .then((data: UserAchievement[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setQueue(data)
          setCurrent(data[0])
          setVisible(true)
        }
      })
      .catch(() => {/* silently ignore */})
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(() => {
      setQueue((prev) => {
        const next = prev.slice(1)
        if (next.length > 0) {
          setCurrent(next[0])
          setVisible(true)
        } else {
          setCurrent(null)
        }
        return next
      })
    }, 300)
  }

  if (!current || !visible) return null

  const a = current.achievement
  const rColor = RARITY_COLORS[a.rarity] ?? '#4a7a40'
  const rLabel = RARITY_LABELS[a.rarity] ?? a.rarity.toUpperCase()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: visible ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease',
      }}
      onClick={dismiss}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes badgePop { 0% { transform: scale(0) rotate(-20deg); } 80% { transform: scale(1.1) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); } }
        @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
        {/* Unlock text */}
        <p style={{
          fontFamily: "'Bungee', sans-serif",
          color: rColor,
          fontSize: 13,
          letterSpacing: 3,
          textTransform: 'uppercase',
          margin: '0 0 20px',
          animation: 'shimmer 2s infinite',
        }}>
          ACHIEVEMENT UNLOCKED!
        </p>

        {/* Badge circle */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `radial-gradient(circle, ${rColor}30, ${rColor}10)`,
          border: `3px solid ${rColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 56,
          margin: '0 auto 20px',
          boxShadow: `0 0 40px ${rColor}60`,
          animation: 'badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}>
          {a.icon ?? '🏅'}
        </div>

        {/* Rarity badge */}
        <div style={{
          display: 'inline-block',
          background: `${rColor}20`,
          border: `1px solid ${rColor}60`,
          borderRadius: 99,
          padding: '3px 12px',
          marginBottom: 12,
        }}>
          <span style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: 10,
            color: rColor,
            letterSpacing: 2,
          }}>
            {rLabel}
          </span>
        </div>

        {/* Name */}
        <h2 style={{
          fontFamily: "'Bungee', sans-serif",
          color: '#e8f5e8',
          fontSize: 22,
          letterSpacing: 1,
          margin: '0 0 8px',
          textTransform: 'uppercase',
        }}>
          {a.name}
        </h2>

        {/* Description */}
        <p style={{
          color: '#4a7a40',
          fontSize: 13,
          lineHeight: 1.5,
          margin: '0 0 20px',
        }}>
          {a.description}
        </p>

        {/* Rewards */}
        {(a.xpReward > 0 || a.scrapsReward > 0) && (
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 24,
            padding: '10px 20px',
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
          }}>
            {a.xpReward > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Bungee', sans-serif", fontSize: 20, color: '#3dff7a', margin: 0 }}>
                  +{a.xpReward}
                </p>
                <p style={{ fontSize: 9, color: '#4a7a40', textTransform: 'uppercase', margin: 0 }}>XP</p>
              </div>
            )}
            {a.xpReward > 0 && a.scrapsReward > 0 && (
              <div style={{ width: 1, background: '#1a3018' }} />
            )}
            {a.scrapsReward > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Bungee', sans-serif", fontSize: 20, color: '#f5c842', margin: 0 }}>
                  +{a.scrapsReward} 🔩
                </p>
                <p style={{ fontSize: 9, color: '#4a7a40', textTransform: 'uppercase', margin: 0 }}>SCRAP</p>
              </div>
            )}
          </div>
        )}

        {/* Dismiss hint */}
        <p style={{ color: '#2a4a2a', fontSize: 11, margin: 0 }}>
          Tap anywhere to continue
          {queue.length > 1 && ` (${queue.length - 1} more)`}
        </p>
      </div>
    </div>
  )
}
