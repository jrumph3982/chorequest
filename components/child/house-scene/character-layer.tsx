'use client'

import { motion } from 'framer-motion'
import { CharacterRenderer } from '@/components/child/CharacterRenderer'
import type { GearSlots } from '@/lib/constants/avatar-map'

interface Props {
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
  eyeColor?:  string | null
  gender?:    string | null
  gear?:      GearSlots
  sceneHeightPx?: number
}

const PATROL_X = [-25, -25, 0, 25, 25, 0, -25]
const PATROL_Y = [0, 4, 0, 0, 4, 0, 0]
const PATROL_TIMES = [0, 0.12, 0.25, 0.5, 0.62, 0.75, 1]

export function CharacterLayer({ hairStyle, hairColor, skinTone, eyeColor, gender, gear, sceneHeightPx = 300 }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute"
        style={{ bottom: '8%', left: '43%', translateX: '-50%' }}
        animate={{ x: PATROL_X, y: PATROL_Y }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          times: PATROL_TIMES,
        }}
      >
        <CharacterRenderer
          hairStyle={hairStyle}
          hairColor={hairColor}
          skinTone={skinTone}
          eyeColor={eyeColor}
          gender={gender}
          gear={gear}
          sceneHeightPx={sceneHeightPx}
          targetPercent={28}
          animate={true}
        />
      </motion.div>
    </div>
  )
}
