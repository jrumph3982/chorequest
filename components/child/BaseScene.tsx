'use client'

import { useState, useEffect, useRef } from 'react'
import { CharacterRenderer } from '@/components/child/CharacterRenderer'
import type { ZombieThreat } from '@/lib/game/base'

const THREAT_ZOMBIES: Record<string, number> = {
  none:     0,
  low:      1,
  moderate: 2,
  high:     3,
  critical: 4,
}

const THREAT_COLOR: Record<string, string> = {
  none:     'text-green-400',
  low:      'text-yellow-400',
  moderate: 'text-orange-400',
  high:     'text-red-400',
  critical: 'text-red-300',
}

const THREAT_LABEL: Record<string, string> = {
  none:     'All Clear',
  low:      'Low Threat',
  moderate: 'Moderate',
  high:     'High Threat',
  critical: 'CRITICAL',
}

interface WindowProps {
  zombieCount: number
  boardCount:  number
}

// Static star positions — deterministic, avoids hydration mismatch
const STARS = [
  { top: 12, left: 18 }, { top: 22, left: 68 }, { top: 8,  left: 44 },
  { top: 34, left: 82 }, { top: 18, left: 55 }, { top: 28, left: 30 },
]

// Window dimensions — sized so zombies are ~11% of scene height (spec: 10–15%).
// Scene height: 300px. Window: 92×114px.
const WIN_W = 92
const WIN_H = 114
// Zombie font size inside window: ~34px ≈ 11% of 300px scene height.
const WIN_ZOMBIE_SIZE = 34

function NightWindow({ zombieCount, boardCount }: WindowProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: WIN_W, height: WIN_H, border: '4px solid #374151', borderRadius: 3, background: '#080d18' }}
    >
      {/* Night sky */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #080d18 0%, #0e1c33 55%, #132213 100%)' }}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ width: 1.5, height: 1.5, top: `${s.top}%`, left: `${s.left}%`, opacity: 0.55 + i * 0.06 }}
        />
      ))}

      {/* Ground strip */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 20, background: '#132213' }} />

      {/* Zombie silhouettes — clipped by window overflow:hidden */}
      {Array.from({ length: zombieCount }).map((_, i) => (
        <div
          key={i}
          className="absolute zombie-sway"
          style={{ bottom: 10, left: `${16 + i * 36}%`, fontSize: WIN_ZOMBIE_SIZE, animationDelay: `${i * 0.35}s`, lineHeight: 1 }}
        >
          🧟
        </div>
      ))}

      {/* Window crossbars */}
      <div className="absolute top-0 bottom-0 bg-gray-700" style={{ left: '50%', width: 3, transform: 'translateX(-50%)' }} />
      <div className="absolute left-0 right-0 bg-gray-700" style={{ top: '48%', height: 3 }} />

      {/* Defence boards */}
      {Array.from({ length: Math.min(boardCount, 3) }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0"
          style={{
            height: 8, top: `${12 + i * 22}%`,
            background: '#92400e', borderTop: '1px solid #a16207', borderBottom: '1px solid #451a03', opacity: 0.92,
          }}
        />
      ))}
    </div>
  )
}

interface Props {
  threat:        ZombieThreat
  approvedCount: number
  hairStyle?:    string | null
  hairColor?:    string | null
  skinTone?:     string | null
  eyeColor?:     string | null
}

export function BaseScene({ threat, approvedCount, hairStyle, hairColor, skinTone, eyeColor }: Props) {
  const totalZombies = Math.max(0, THREAT_ZOMBIES[threat] - Math.floor(approvedCount / 2))
  const boardCount   = Math.min(4, approvedCount)
  const leftZombies  = Math.ceil(totalZombies / 2)
  const rightZombies = Math.floor(totalZombies / 2)

  const [charLeft, setCharLeft] = useState(40)
  const [facing,   setFacing]   = useState<1 | -1>(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function scheduleMove() {
      const delay = 3000 + Math.random() * 2000
      timerRef.current = setTimeout(() => {
        setCharLeft((prev) => {
          const next = 15 + Math.random() * 55
          setFacing(next >= prev ? 1 : -1)
          return next
        })
        scheduleMove()
      }, delay)
    }
    scheduleMove()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Scene: 300px tall. Floor: 40px.
  // Character: sceneHeightPx=300, targetPercent=28 → 84px height → 79px wide ≈ 28% of scene.
  // Windows at top: 32px.
  const SCENE_H  = 300
  const FLOOR_H  = 40
  const WIN_TOP  = 32
  const WIN_SIDE = 20

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-gray-800 mb-5"
      style={{ height: SCENE_H, background: '#0f172a' }}
    >
      {/* Wall texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent 0px, transparent 28px, rgba(255,255,255,0.018) 28px, rgba(255,255,255,0.018) 29px)',
        }}
      />

      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: FLOOR_H, background: '#1e293b', borderTop: '2px solid #334155' }} />

      {/* Left window */}
      <div className="absolute" style={{ top: WIN_TOP, left: WIN_SIDE }}>
        <NightWindow zombieCount={leftZombies} boardCount={boardCount} />
      </div>

      {/* Right window */}
      <div className="absolute" style={{ top: WIN_TOP, right: WIN_SIDE }}>
        <NightWindow zombieCount={rightZombies} boardCount={boardCount} />
      </div>

      {/* Character — bottom edge sits on the floor, translateX centres the sprite */}
      <div
        className="absolute"
        style={{ bottom: FLOOR_H, left: `${charLeft}%`, transform: 'translateX(-50%)', transition: 'left 0.85s ease-in-out' }}
      >
        <div style={{ transform: `scaleX(${facing})`, transformOrigin: 'center bottom' }}>
          <CharacterRenderer
            hairStyle={hairStyle}
            hairColor={hairColor}
            skinTone={skinTone}
            eyeColor={eyeColor}
            sceneHeightPx={SCENE_H}
            targetPercent={28}
            animate={true}
          />
        </div>
      </div>

      {/* Threat HUD */}
      <div className="absolute top-2 right-3">
        <span className={`text-xs font-bold tracking-wide ${THREAT_COLOR[threat]} ${threat === 'critical' ? 'animate-pulse' : ''}`}>
          {THREAT_LABEL[threat]}
        </span>
      </div>

      {/* Approved count HUD */}
      <div className="absolute top-2 left-3">
        <span className="text-xs text-gray-500">✓ {approvedCount} done</span>
      </div>
    </div>
  )
}
