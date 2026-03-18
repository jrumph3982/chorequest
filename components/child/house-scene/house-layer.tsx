'use client'

import { motion } from 'framer-motion'
import type { BaseStateShape } from './index'

// Layout constants (% of 280px container):
// House: left 28%, top 30%, width 44%, height 42%
// Roof: left 25%, top 12%, width 50%, height 20% (clip-path triangle)

interface Props {
  baseState: BaseStateShape
}

export function HouseLayer({ baseState }: Props) {
  const { doorDamage, lightDamage } = baseState

  const lightsOut = lightDamage > 80
  const windowFlicker = lightDamage > 60 && lightDamage <= 80
  const windowBg = lightsOut ? '#1a1a2a' : '#3a2a08'
  const windowGlow = lightsOut ? 'none' : '0 0 8px 3px rgba(200,144,10,0.6), inset 0 0 6px rgba(200,144,10,0.4)'

  const doorBg = doorDamage > 60 ? '#3a1a08' : '#5c3010'

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Roof */}
      <div
        className="absolute"
        style={{
          left: '25%',
          top: '12%',
          width: '50%',
          height: '20%',
          background: '#141428',
          clipPath: 'polygon(50% 0%, -5% 100%, 105% 100%)',
          outline: '2px solid #3a3a5c',
        }}
      />

      {/* House body */}
      <div
        className="absolute"
        style={{
          left: '28%',
          top: '30%',
          width: '44%',
          height: '42%',
          background: '#1e1e2e',
          border: '2px solid #3a3a5c',
        }}
      >
        {/* Left window */}
        <motion.div
          className="absolute"
          style={{
            left: '12%', top: '18%',
            width: '16%', height: '26%',
            background: windowBg,
            border: '1.5px solid #5a5a8a',
            boxShadow: windowGlow,
          }}
          animate={windowFlicker ? { opacity: [1, 0.3, 1, 0.6, 1] } : { opacity: 1 }}
          transition={windowFlicker ? { duration: 1.6, repeat: Infinity } : {}}
        />

        {/* Right window */}
        <motion.div
          className="absolute"
          style={{
            right: '12%', top: '18%',
            width: '16%', height: '26%',
            background: windowBg,
            border: '1.5px solid #5a5a8a',
            boxShadow: windowGlow,
          }}
          animate={windowFlicker ? { opacity: [1, 0.6, 0.2, 1, 0.7] } : { opacity: 1 }}
          transition={windowFlicker ? { duration: 2, repeat: Infinity, delay: 0.5 } : {}}
        />

        {/* Door */}
        <div
          className="absolute"
          style={{
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '18%',
            height: '38%',
            background: doorBg,
            border: '1.5px solid #8a5020',
          }}
        >
          {/* Door knob */}
          <div
            className="absolute rounded-full bg-yellow-600"
            style={{ width: 5, height: 5, right: '10%', top: '52%' }}
          />
          {/* Damage X marks */}
          {doorDamage > 60 && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(200,50,20,0.5) 0%, transparent 50%, rgba(200,50,20,0.5) 100%)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
