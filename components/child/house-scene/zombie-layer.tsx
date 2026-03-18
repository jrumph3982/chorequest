'use client'

import { motion } from 'framer-motion'
import type { ZombieThreat } from '@/lib/game/base'
import type { TimeOfDay } from './index'

type ZConf = { left: string; bottom: string; scale: number; delay: number }

// Depth-based sizing in a 300px scene (spec: front 18–20%, mid 14%, far 10%):
//   far  = 300 * 0.10 = 30px  → base 60 * scale 0.50 = 30px
//   mid  = 300 * 0.14 = 42px  → base 60 * scale 0.70 = 42px
//   front= 300 * 0.19 = 57px  → base 60 * scale 0.95 = 57px
const ZOMBIE_BASE_PX = 60

// ── Seasonal monster themes ────────────────────────────────────────────────────
type SeasonalTheme = {
  emoji: string
  label: string
  accentColor: string
}

function getSeasonalTheme(): SeasonalTheme | null {
  const m = new Date().getMonth() + 1   // 1-12
  const d = new Date().getDate()
  if (m === 10) return { emoji: '🎃', label: '🎃 HALLOWEEN INVASION',      accentColor: '#ff6b00' }
  if (m === 12) return { emoji: '🎄', label: '❄️ BLIZZARD OF THE UNDEAD',   accentColor: '#cc2020' }
  if (m === 2 && d <= 14) return { emoji: '💘', label: "💘 CUPID'S CURSE", accentColor: '#e84060' }
  if ((m === 3 && d >= 15) || m === 4) return { emoji: '🐣', label: '🐣 THE BUNNY PLAGUE', accentColor: '#80c040' }
  if (m >= 6 && m <= 9) return { emoji: '🏖️', label: '🏖️ BEACH ZOMBIE BASH', accentColor: '#f5c842' }
  return null
}

// Afternoon: 2 distant zombies (far — 10% of scene)
const AFTERNOON_ZOMBIES: ZConf[] = [
  { left: '80%', bottom: '40%', scale: 0.50, delay: 0 },
  { left: '87%', bottom: '41%', scale: 0.50, delay: 0.8 },
]

// Evening: 4 mid-distance zombies near the fence (14% of scene)
const EVENING_ZOMBIES: ZConf[] = [
  { left: '68%', bottom: '30%', scale: 0.70, delay: 0 },
  { left: '75%', bottom: '29%', scale: 0.70, delay: 0.5 },
  { left: '82%', bottom: '30%', scale: 0.70, delay: 1.0 },
  { left: '89%', bottom: '28%', scale: 0.70, delay: 1.5 },
]

// Night: threat-based count at ground level (full size)
const THREAT_COUNT: Record<ZombieThreat, number> = {
  none: 0, low: 1, moderate: 2, high: 4, critical: 6,
}
const NIGHT_LEFTS = ['70%', '77%', '83%', '89%', '73%', '86%']

function nightZombies(threat: ZombieThreat): ZConf[] {
  const count = THREAT_COUNT[threat]
  // Night zombies are front-line (19% of scene height) — scale 0.95
  return NIGHT_LEFTS.slice(0, count).map((left, i) => ({
    left,
    bottom: `${26 + (i % 2) * 3}%`,
    scale: 0.95,
    delay: i * 0.35,
  }))
}

function ZombieChar({ left, bottom, scale, delay, emoji }: ZConf & { emoji: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ left, bottom, fontSize: `${ZOMBIE_BASE_PX * scale}px`, transformOrigin: 'bottom center' }}
      animate={{
        x: [-2, -6, -2, 2, -2],
        y: [0, -1, 0, -1, 0],
        rotate: [-4, 2, -4, 4, -4],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {emoji}
    </motion.div>
  )
}

// Robot uprising: a 🤖 appears on the right with orange glow
function Robot() {
  return (
    <motion.div
      className="absolute"
      style={{ bottom: '26%', right: '5%', fontSize: Math.round(ZOMBIE_BASE_PX * 0.95) }}
      animate={{ x: [-2, 2, -2], y: [0, -2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      🤖
    </motion.div>
  )
}

// Zombie swarm: extra background horde tint on right
function SwarmTint() {
  return (
    <motion.div
      className="absolute right-0 top-0 bottom-0"
      style={{
        width: '40%',
        background: 'radial-gradient(ellipse at right center, rgba(160,0,0,0.18) 0%, transparent 70%)',
      }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

interface Props {
  timeOfDay: TimeOfDay
  threat: ZombieThreat
  lastNightOverrun: boolean
  activeEventTypes: string[]
}

export function ZombieLayer({ timeOfDay, threat, lastNightOverrun, activeEventTypes }: Props) {
  const seasonal = getSeasonalTheme()
  const monsterEmoji = seasonal?.emoji ?? '🧟'

  let zombies: ZConf[] = []
  if (timeOfDay === 'afternoon') zombies = AFTERNOON_ZOMBIES
  else if (timeOfDay === 'evening') zombies = EVENING_ZOMBIES
  else if (timeOfDay === 'night') zombies = nightZombies(threat)

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Event: zombie swarm background tint */}
      {activeEventTypes.includes('zombie_swarm') && <SwarmTint />}

      {/* Seasonal banner */}
      {seasonal && zombies.length > 0 && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full z-10"
          style={{
            background: 'rgba(0,0,0,0.72)',
            border: `1px solid ${seasonal.accentColor}50`,
            fontSize: 9,
            fontWeight: 900,
            color: seasonal.accentColor,
            letterSpacing: '0.08em',
            fontFamily: "'Bungee', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          {seasonal.label}
        </div>
      )}

      {/* Monsters (seasonal or default zombie) */}
      {zombies.map((z, i) => (
        <ZombieChar key={i} {...z} emoji={monsterEmoji} />
      ))}

      {/* Event: robot uprising */}
      {activeEventTypes.includes('robot_uprising') && <Robot />}

      {/* Overrun overlay + banner */}
      {lastNightOverrun && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 bg-red-950/70" />
          <motion.div
            className="relative z-10 px-5 py-3 rounded-xl text-center"
            style={{ background: 'rgba(120,0,0,0.95)', border: '2px solid #ef4444' }}
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-red-400 font-bold text-xl tracking-widest font-mono">⚠ OVERRUN ⚠</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
