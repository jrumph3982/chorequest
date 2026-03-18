'use client'

import { useState } from 'react'
import type { ZombieThreat } from '@/lib/game/base'
import type { GearSlots } from '@/lib/constants/avatar-map'
import { Background } from './background'
import { SkyLayer } from './sky-layer'
import { HouseLayer } from './house-layer'
import { DefenseLayer, FenceFront } from './defense-layer'
import { ZombieLayer } from './zombie-layer'
import { CompanionLayer } from './companion-layer'
import { CharacterLayer } from './character-layer'

export interface BaseStateShape {
  doorLevel: number
  barricadeLevel: number
  fenceLevel: number
  lightLevel: number
  doorDamage: number
  barricadeDamage: number
  fenceDamage: number
  lightDamage: number
  // Advanced structures — level 0 means not yet built
  watchtowerLevel: number
  turretLevel: number
  watchtowerDamage: number
  turretDamage: number
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

function computeTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

interface Props {
  baseState: BaseStateShape
  threat: ZombieThreat
  lastNightOverrun?: boolean
  equippedCompanions?: { type: string; color: string }[]
  activeEventTypes?: string[]
  // Character appearance — forwarded to CharacterLayer
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
  eyeColor?:  string | null
  gender?:    string | null
  gear?:      GearSlots
  sceneHeightPx?: number
}

export function HouseScene({
  baseState,
  threat,
  lastNightOverrun = false,
  equippedCompanions = [],
  activeEventTypes = [],
  hairStyle,
  hairColor,
  skinTone,
  eyeColor,
  gender,
  gear,
  sceneHeightPx = 300,
}: Props) {
  const [timeOfDay] = useState<TimeOfDay>(computeTimeOfDay)

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ minHeight: 300 }}
    >
      <Background timeOfDay={timeOfDay} activeEventTypes={activeEventTypes} />
      <SkyLayer timeOfDay={timeOfDay} activeEventTypes={activeEventTypes} />
      <HouseLayer baseState={baseState} />
      <DefenseLayer baseState={baseState} />
      <ZombieLayer
        timeOfDay={timeOfDay}
        threat={threat}
        lastNightOverrun={lastNightOverrun}
        activeEventTypes={activeEventTypes}
      />
      <FenceFront baseState={baseState} />
      <CompanionLayer equippedCompanions={equippedCompanions} />
      <CharacterLayer
        hairStyle={hairStyle}
        hairColor={hairColor}
        skinTone={skinTone}
        eyeColor={eyeColor}
        gender={gender}
        gear={gear}
        sceneHeightPx={sceneHeightPx}
      />
    </div>
  )
}
