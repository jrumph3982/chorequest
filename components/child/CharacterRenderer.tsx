'use client'

import { CharacterSprite, NATIVE_W, NATIVE_H } from './CharacterSprite'
import type { GearSlots } from '@/lib/constants/avatar-map'

interface Props {
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
  eyeColor?:  string | null
  gender?:    string | null
  gear?:      GearSlots

  /** Pixel width — simplest fixed-size mode. */
  width?: number
  /** CSS width string ("50%", "12cqw") — responsive mode via ResizeObserver. */
  cssWidth?: string
  /** Scene height in CSS pixels; combined with targetPercent for auto-sizing. */
  sceneHeightPx?: number
  /** Target character height as % of sceneHeightPx. Default 30. */
  targetPercent?: number

  /** Enable idle-bounce animation. Default true. */
  animate?: boolean
  /** Optional wrapper className. */
  className?: string
}

export function CharacterRenderer({
  hairStyle,
  hairColor,
  skinTone,
  eyeColor,
  gender,
  gear,
  width,
  cssWidth,
  sceneHeightPx,
  targetPercent = 30,
  animate = true,
  className,
}: Props) {
  let resolvedWidth: number | string

  if (cssWidth) {
    resolvedWidth = cssWidth
  } else if (sceneHeightPx != null && width == null) {
    const targetHeightPx = (sceneHeightPx * targetPercent) / 100
    resolvedWidth = Math.max(40, Math.round((targetHeightPx / NATIVE_H) * NATIVE_W))
  } else {
    resolvedWidth = width ?? 80
  }

  return (
    <div className={className}>
      <CharacterSprite
        hairStyle={hairStyle}
        hairColor={hairColor}
        skinTone={skinTone}
        eyeColor={eyeColor}
        gender={gender}
        gear={gear}
        width={resolvedWidth}
        animate={animate}
      />
    </div>
  )
}
