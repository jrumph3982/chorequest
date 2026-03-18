'use client'

/**
 * CharacterSprite.tsx
 *
 * Public API wrapper around BlockCharacter. Maintains backward-compatible
 * props so that all existing call sites require no changes.
 *
 * The Nonemo PNG layer system has been replaced with an inline SVG block
 * character (Roblox-inspired style) that requires no external image assets.
 */

import { useEffect, useRef, useState } from 'react'
import { BlockCharacter } from './BlockCharacter'
import type { GearSlots } from '@/lib/constants/avatar-map'

// Keep these constants so CharacterRenderer can reference them
export const NATIVE_W = 100
export const NATIVE_H = 130

interface Props {
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
  eyeColor?:  string | null
  gender?:    string | null
  gear?:      GearSlots
  width?: number | string
  animate?: boolean
}

export function CharacterSprite({
  hairStyle,
  hairColor,
  skinTone,
  eyeColor,
  gender,
  gear,
  width   = 80,
  animate = true,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [pxWidth, setPxWidth] = useState<number>(
    typeof width === 'number' ? width : 80,
  )

  useEffect(() => {
    if (typeof width === 'number') {
      setPxWidth(width)
      return
    }
    // CSS-string width: measure outer div and update on every resize
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      if (w > 0) setPxWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  // Pause animation when tab is in background
  useEffect(() => {
    if (!animate) return
    const el = outerRef.current
    if (!el) return
    const toggle = () => {
      el.style.animationPlayState = document.hidden ? 'paused' : 'running'
    }
    document.addEventListener('visibilitychange', toggle)
    return () => document.removeEventListener('visibilitychange', toggle)
  }, [animate])

  const computedH = Math.round(pxWidth * (NATIVE_H / NATIVE_W))

  const outerStyle: React.CSSProperties =
    typeof width === 'string'
      ? {
          width,
          aspectRatio: `${NATIVE_W} / ${NATIVE_H}`,
          position:   'relative',
          flexShrink: 0,
        }
      : {
          width:      pxWidth,
          height:     computedH,
          position:   'relative',
          flexShrink: 0,
        }

  return (
    <div
      ref={outerRef}
      style={outerStyle}
      aria-hidden="true"
      className={animate ? 'char-idle' : undefined}
    >
      <BlockCharacter
        hairStyle={hairStyle}
        hairColor={hairColor}
        skinTone={skinTone}
        eyeColor={eyeColor}
        gender={gender}
        gear={gear}
        width={pxWidth}
        height={computedH}
      />
    </div>
  )
}
