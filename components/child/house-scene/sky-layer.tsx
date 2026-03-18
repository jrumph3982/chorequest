'use client'

import { motion } from 'framer-motion'
import type { TimeOfDay } from './index'

const STARS = [
  [5, 8], [15, 5], [25, 12], [45, 4], [55, 9],
  [70, 6], [82, 11], [90, 3], [8, 20], [35, 15], [60, 18], [78, 20],
]

function Stars() {
  return (
    <>
      {STARS.map(([x, y], i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${x}%`, top: `${y}%`, width: 2, height: 2 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
        />
      ))}
    </>
  )
}

function Moon() {
  return (
    <div
      className="absolute rounded-full"
      style={{ right: '12%', top: '10%', width: 30, height: 30, background: '#e8e0c8' }}
    />
  )
}

function Sun({ morning }: { morning: boolean }) {
  const pos = morning
    ? { left: '12%', top: '14%' }
    : { left: '50%', top: '8%', transform: 'translateX(-50%)' }
  return (
    <motion.div
      className="absolute rounded-full bg-yellow-300"
      style={{
        width: 34, height: 34,
        boxShadow: '0 0 20px 8px rgba(250,204,21,0.4)',
        ...pos,
      }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function UFO() {
  return (
    <motion.div
      className="absolute"
      style={{ left: '18%', top: '8%', fontSize: 28 }}
      animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      🛸
    </motion.div>
  )
}

function Snowflakes() {
  const flakes = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${(i * 4.5 + 2) % 96}%`,
    delay: (i * 0.3) % 4,
    duration: 3.5 + (i % 4) * 0.6,
  }))
  return (
    <>
      {flakes.map((f) => (
        <motion.div
          key={f.id}
          className="absolute text-blue-100 select-none"
          style={{ left: f.left, top: 0, fontSize: 9 }}
          animate={{ y: ['0px', '295px'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: f.duration, repeat: Infinity, ease: 'linear', delay: f.delay }}
        >
          ❄
        </motion.div>
      ))}
    </>
  )
}

interface Props {
  timeOfDay: TimeOfDay
  activeEventTypes: string[]
}

export function SkyLayer({ timeOfDay, activeEventTypes }: Props) {
  const showStars = timeOfDay === 'night' || timeOfDay === 'evening'
  const showMoon = timeOfDay === 'night'
  const showSun = timeOfDay === 'morning' || timeOfDay === 'afternoon'

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Sky objects (confined to sky area) */}
      <div className="absolute left-0 right-0 top-0" style={{ height: '72%' }}>
        {showStars && <Stars />}
        {showMoon && <Moon />}
        {showSun && <Sun morning={timeOfDay === 'morning'} />}
        {activeEventTypes.includes('alien_invasion') && <UFO />}
      </div>
      {/* Snowflakes fall across entire scene */}
      {activeEventTypes.includes('winter_storm') && <Snowflakes />}
    </div>
  )
}
