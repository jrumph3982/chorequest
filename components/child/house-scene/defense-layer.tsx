'use client'

import { motion } from 'framer-motion'
import type { BaseStateShape } from './index'

interface Props {
  baseState: BaseStateShape
}

function LampPost({ side, lightDamage }: { side: 'left' | 'right'; lightDamage: number }) {
  const x = side === 'left' ? '12%' : '88%'
  const isOff = lightDamage >= 90
  const isFlickering = lightDamage > 60 && lightDamage < 90

  return (
    <div className="absolute" style={{ left: x, bottom: '28%', transform: 'translateX(-50%)' }}>
      {/* Glow halo */}
      {!isOff && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 52, height: 52,
            bottom: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(255,208,80,0.55) 0%, transparent 70%)',
          }}
          animate={isFlickering ? { opacity: [0.9, 0.2, 1, 0.5, 0.85] } : { opacity: 1 }}
          transition={isFlickering ? { duration: 1.5, repeat: Infinity } : {}}
        />
      )}
      {/* Post */}
      <div
        className="absolute"
        style={{
          bottom: 0, height: 56,
          left: '50%', transform: 'translateX(-50%)',
          width: 4, background: '#3a3a4a',
        }}
      />
      {/* Lamp head */}
      <div
        className="absolute"
        style={{
          bottom: 54,
          left: '50%', transform: 'translateX(-50%)',
          width: 16, height: 8,
          background: '#4a4a5a',
        }}
      />
      {/* Bulb */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: 58,
          left: '50%', transform: 'translateX(-50%)',
          width: 8, height: 8,
          background: isOff ? '#2a2a3a' : '#ffd060',
        }}
      />
    </div>
  )
}

function Barricades({ side, damage }: { side: 'left' | 'right'; damage: number }) {
  const boardColor = damage > 70 ? '#2a1a08' : damage > 40 ? '#4a2e10' : '#6b4520'
  const style =
    side === 'left'
      ? { left: '16%', top: '36%', width: '12%', bottom: '28%' }
      : { left: '72%', top: '36%', width: '11%', bottom: '28%' }

  return (
    <div className="absolute" style={{ ...style, opacity: damage > 85 ? 0.3 : 1 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const broken = damage > 50 && i === 2
        const tilt = broken ? (side === 'left' ? -15 : 15) : 0
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${i * 21}%`,
              top: 0, bottom: 0, width: '16%',
              background: boardColor,
              border: '1px solid #1a0e04',
              transform: `rotate(${tilt}deg)`,
              transformOrigin: 'top center',
            }}
          />
        )
      })}
    </div>
  )
}

export function DefenseLayer({ baseState }: Props) {
  const { barricadeDamage, lightDamage } = baseState

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Barricades */}
      <Barricades side="left" damage={barricadeDamage} />
      <Barricades side="right" damage={barricadeDamage} />

      {/* Lamp posts */}
      <LampPost side="left" lightDamage={lightDamage} />
      <LampPost side="right" lightDamage={lightDamage} />
    </div>
  )
}

/** Full fence — place AFTER ZombieLayer so zombies appear behind the fence. */
export function FenceFront({ baseState }: Props) {
  const { fenceDamage } = baseState
  const fenceColor = fenceDamage > 70 ? '#4a3010' : fenceDamage > 40 ? '#6b4a18' : '#8b6520'
  const fenceOpacity = fenceDamage > 85 ? 0.35 : fenceDamage > 55 ? 0.65 : 1
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Fence pickets */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '62%', height: '9%',
          backgroundImage: `repeating-linear-gradient(
            90deg,
            ${fenceColor} 0px, ${fenceColor} 4px,
            transparent 4px, transparent 22px
          )`,
          opacity: fenceOpacity,
        }}
      />
      {/* Fence rail */}
      <div
        className="absolute left-0 right-0"
        style={{ top: '68.5%', height: 2, background: fenceColor, opacity: fenceOpacity }}
      />
    </div>
  )
}
