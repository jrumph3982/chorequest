'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PetSprite } from '@/components/child/PetSprite'

interface Companion {
  type: string
  color: string
}

const PET_SHADOW = 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))'

function Dog({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ bottom: '40%', left: '10%', filter: PET_SHADOW }}
      animate={{ x: [0, 28, 0, -8, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="dog" color={color} size={36} />
    </motion.div>
  )
}

function Cat({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ bottom: '40%', left: '47%', filter: PET_SHADOW }}
      animate={{ scaleY: [1, 0.88, 1], y: [0, 2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="cat" color={color} size={32} />
    </motion.div>
  )
}

function Rabbit({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ bottom: '40%', right: '18%', filter: PET_SHADOW }}
      animate={{ y: [0, -8, 0], x: [0, 10, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="rabbit" color={color} size={30} />
    </motion.div>
  )
}

function Hamster({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ bottom: '40%', right: '8%', filter: PET_SHADOW }}
      animate={{ x: [0, 14, 0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="hamster" color={color} size={28} />
    </motion.div>
  )
}

function Parrot({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ bottom: '48%', left: '30%', filter: PET_SHADOW }}
      animate={{ rotate: [-4, 4, -4] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="parrot" color={color} size={30} />
    </motion.div>
  )
}

function Drone({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ top: '12%', right: '30%', filter: PET_SHADOW }}
      animate={{ y: [0, -7, 0], x: [0, 4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="drone" color={color} size={34} />
    </motion.div>
  )
}

function Raccoon({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute select-none"
      style={{ bottom: '40%', left: '20%', filter: PET_SHADOW }}
      animate={{ x: [0, 18, 0, -10, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <PetSprite type="raccoon" color={color} size={32} />
    </motion.div>
  )
}

const COMPANION_MAP: Record<string, (color: string) => React.ReactElement> = {
  dog:     (c) => <Dog key="dog" color={c} />,
  cat:     (c) => <Cat key="cat" color={c} />,
  rabbit:  (c) => <Rabbit key="rabbit" color={c} />,
  hamster: (c) => <Hamster key="hamster" color={c} />,
  parrot:  (c) => <Parrot key="parrot" color={c} />,
  drone:   (c) => <Drone key="drone" color={c} />,
  raccoon: (c) => <Raccoon key="raccoon" color={c} />,
}

export function CompanionLayer({ equippedCompanions }: { equippedCompanions: Companion[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {equippedCompanions.map((c) => {
        const render = COMPANION_MAP[c.type.toLowerCase()]
        return render ? render(c.color) : null
      })}
    </div>
  )
}
