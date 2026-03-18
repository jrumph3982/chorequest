'use client'

/**
 * BlockCharacter.tsx
 *
 * Roblox-inspired block-style character rendered entirely with inline SVG.
 * Supports boy/girl body variants via the `gender` prop.
 * Supports equipped gear visual overlays via the `gear` prop.
 *
 * ViewBox: 0 0 100 130 (portrait, 100 × 130 logical units)
 *
 * Render order (back → front):
 *   BackHair → Backpack straps → Legs → Body → AccessoryOverlay
 *   → Head → Face → FrontHair → HatOverlay
 */

import { buildAvatarColors, darken, type AvatarColors, type HairStyleId, type GearSlots } from '@/lib/constants/avatar-map'

// ─── SVG layer renderers ──────────────────────────────────────────────────────

function BackHair({ style, hair, hairDark }: { style: HairStyleId; hair: string; hairDark: string }) {
  if (style === 'shaved') return null

  if (style === 'long' || style === 'braided') {
    return (
      <g>
        <rect x={30} y={20} width={40} height={75} rx={6} fill={hair} />
        <rect x={30} y={20} width={40} height={75} rx={6} fill={hairDark} opacity={0.25} />
        {style === 'braided' && (
          <>
            <ellipse cx={37} cy={55} rx={4} ry={8} fill={hairDark} opacity={0.4} />
            <ellipse cx={63} cy={55} rx={4} ry={8} fill={hairDark} opacity={0.4} />
            <ellipse cx={37} cy={72} rx={4} ry={7} fill={hairDark} opacity={0.35} />
            <ellipse cx={63} cy={72} rx={4} ry={7} fill={hairDark} opacity={0.35} />
          </>
        )}
      </g>
    )
  }

  if (style === 'ponytail') {
    return (
      <g>
        <rect x={43} y={28} width={12} height={38} rx={6} fill={hair} />
        <rect x={45} y={64} width={8} height={6} rx={3} fill={hairDark} />
      </g>
    )
  }

  return null
}

interface BodyProps extends Pick<AvatarColors, 'skin' | 'skinDark' | 'outfit' | 'outfitDark'> {
  slim?: boolean
}

function Body({ skin, skinDark, outfit, outfitDark, slim = false }: BodyProps) {
  // Girl (slim): narrower torso and arms
  const tx = slim ? 32 : 30
  const tw = slim ? 36 : 40
  const lax = slim ? 17 : 14
  const rax = slim ? 71 : 72
  const aw  = slim ? 12 : 14
  const lhx = slim ? 18 : 15
  const rhx = slim ? 73 : 73
  const hw  = slim ? 10 : 12

  return (
    <g>
      {/* Torso */}
      <rect x={tx} y={68} width={tw} height={35} rx={4} fill={outfit} />
      <rect x={tx} y={68} width={tw} height={35} rx={4} fill={outfitDark} opacity={0.25} />

      {/* Left arm */}
      <rect x={lax} y={69} width={aw} height={28} rx={5} fill={outfit} />
      <rect x={lax} y={69} width={aw} height={28} rx={5} fill={outfitDark} opacity={0.2} />
      {/* Left hand */}
      <rect x={lhx} y={94} width={hw} height={10} rx={4} fill={skin} />

      {/* Right arm */}
      <rect x={rax} y={69} width={aw} height={28} rx={5} fill={outfit} />
      <rect x={rax} y={69} width={aw} height={28} rx={5} fill={outfitDark} opacity={0.2} />
      {/* Right hand */}
      <rect x={rhx} y={94} width={hw} height={10} rx={4} fill={skin} />

      {/* Neck */}
      <rect x={43} y={60} width={14} height={12} rx={3} fill={skin} />
      <rect x={43} y={60} width={14} height={12} rx={3} fill={skinDark} opacity={0.15} />
    </g>
  )
}

interface LegsProps extends Pick<AvatarColors, 'outfit' | 'outfitDark' | 'shoe'> {
  slim?: boolean
}

function Legs({ outfit, outfitDark, shoe, slim = false }: LegsProps) {
  // Girl (slim): slightly narrower legs
  const llx = slim ? 33 : 31
  const rlx = slim ? 53 : 52
  const lw  = slim ? 14 : 17
  const lsx = slim ? 31 : 29
  const rsx = slim ? 51 : 50
  const sw  = slim ? 18 : 21

  return (
    <g>
      {/* Left leg */}
      <rect x={llx} y={102} width={lw} height={22} rx={3} fill={outfit} />
      <rect x={llx} y={102} width={lw} height={22} rx={3} fill={outfitDark} opacity={0.3} />
      {/* Left shoe */}
      <rect x={lsx} y={121} width={sw} height={9} rx={4} fill={shoe} />

      {/* Right leg */}
      <rect x={rlx} y={102} width={lw} height={22} rx={3} fill={outfit} />
      <rect x={rlx} y={102} width={lw} height={22} rx={3} fill={outfitDark} opacity={0.3} />
      {/* Right shoe */}
      <rect x={rsx} y={121} width={sw} height={9} rx={4} fill={shoe} />
    </g>
  )
}

function Head({ skin, skinDark }: Pick<AvatarColors, 'skin' | 'skinDark'>) {
  return (
    <g>
      <rect x={23} y={10} width={54} height={54} rx={10} fill={skin} />
      <rect x={23} y={10} width={54} height={54} rx={10} fill={skinDark} opacity={0.12} />
      {/* Ear left */}
      <rect x={17} y={28} width={8} height={14} rx={4} fill={skin} />
      {/* Ear right */}
      <rect x={75} y={28} width={8} height={14} rx={4} fill={skin} />
    </g>
  )
}

function Face({ iris }: { iris: string }) {
  return (
    <g>
      {/* Eye whites */}
      <ellipse cx={38} cy={33} rx={5} ry={5.5} fill="#fff" />
      <ellipse cx={62} cy={33} rx={5} ry={5.5} fill="#fff" />
      {/* Colored irises */}
      <circle cx={39} cy={34} r={3.2} fill={iris} />
      <circle cx={63} cy={34} r={3.2} fill={iris} />
      {/* Pupils */}
      <circle cx={39} cy={34} r={1.5} fill="#0a0a0a" />
      <circle cx={63} cy={34} r={1.5} fill="#0a0a0a" />
      {/* Highlight dots */}
      <circle cx={40} cy={32.5} r={0.9} fill="#fff" opacity={0.9} />
      <circle cx={64} cy={32.5} r={0.9} fill="#fff" opacity={0.9} />
      {/* Eyebrows */}
      <path d="M33 26 Q38 23 43 26" stroke="#1a1a1a" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M57 26 Q62 23 67 26" stroke="#1a1a1a" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Smile */}
      <path d="M39 48 Q50 55 61 48" stroke="#1a1a1a" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  )
}

function FrontHair({ style, hair, hairDark }: { style: HairStyleId; hair: string; hairDark: string }) {
  if (style === 'shaved') {
    return <rect x={23} y={10} width={54} height={10} rx={6} fill={hair} opacity={0.6} />
  }

  if (style === 'short') {
    return (
      <g>
        <rect x={20} y={8} width={60} height={22} rx={8} fill={hair} />
        <rect x={20} y={22} width={60} height={10} rx={4} fill={hairDark} opacity={0.35} />
        <rect x={20} y={18} width={8} height={24} rx={4} fill={hair} />
        <rect x={72} y={18} width={8} height={24} rx={4} fill={hair} />
      </g>
    )
  }

  if (style === 'long' || style === 'braided') {
    return (
      <g>
        <rect x={20} y={8} width={60} height={20} rx={8} fill={hair} />
        <rect x={20} y={18} width={10} height={40} rx={4} fill={hair} />
        <rect x={70} y={18} width={10} height={40} rx={4} fill={hair} />
      </g>
    )
  }

  if (style === 'curly') {
    return (
      <g>
        <circle cx={50} cy={10} r={16} fill={hair} />
        <circle cx={34} cy={14} r={13} fill={hair} />
        <circle cx={66} cy={14} r={13} fill={hair} />
        <circle cx={27} cy={24} r={10} fill={hair} />
        <circle cx={73} cy={24} r={10} fill={hair} />
        <circle cx={50} cy={10} r={16} fill={hairDark} opacity={0.15} />
      </g>
    )
  }

  if (style === 'ponytail') {
    return (
      <g>
        <rect x={22} y={8} width={56} height={18} rx={8} fill={hair} />
        <rect x={44} y={60} width={12} height={5} rx={2} fill={hairDark} />
      </g>
    )
  }

  return null
}

// ─── Gear overlay renderers ───────────────────────────────────────────────────

function HatOverlay({ slug }: { slug: string }) {
  if (slug === 'combat-helmet') {
    return (
      <g>
        {/* Helmet dome — military olive */}
        <rect x={17} y={4} width={66} height={30} rx={12} fill="#4A5240" />
        <rect x={17} y={4} width={66} height={30} rx={12} fill="#000" opacity={0.15} />
        {/* Visor brim */}
        <rect x={14} y={27} width={72} height={8} rx={3} fill="#3A4232" />
        {/* Chin strap hint */}
        <rect x={23} y={52} width={4} height={10} rx={2} fill="#3A4232" opacity={0.6} />
        <rect x={73} y={52} width={4} height={10} rx={2} fill="#3A4232" opacity={0.6} />
      </g>
    )
  }

  if (slug === 'baseball-cap' || slug === 'starter-cap') {
    const capColor = slug === 'baseball-cap' ? '#1E3A8A' : '#374151'
    const brimColor = darken(capColor, 0.18)
    return (
      <g>
        {/* Cap body */}
        <rect x={21} y={6} width={58} height={21} rx={9} fill={capColor} />
        {/* Brim (extends left — classic forward-facing wear) */}
        <rect x={14} y={23} width={50} height={7} rx={3} fill={brimColor} />
        {/* Crown seam */}
        <line x1={50} y1={7} x2={50} y2={27} stroke="#fff" strokeWidth={0.8} opacity={0.2} />
        {/* Button on top */}
        <circle cx={50} cy={7} r={2.5} fill={brimColor} />
      </g>
    )
  }

  return null
}

function BackpackStraps({ slug }: { slug: string }) {
  const color =
    slug === 'survival-pack'  ? '#7F1D1D' :
    slug === 'adventure-pack' ? '#78350F' :
    slug === 'large-pack'     ? '#1A3A0F' :
    '#4B5563' // starter-backpack / default gray

  const strapColor = darken(color, 0.05)

  return (
    <g opacity={0.9}>
      {/* Left shoulder strap */}
      <path d="M 45 68 Q 38 80 39 92" stroke={strapColor} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* Right shoulder strap */}
      <path d="M 55 68 Q 62 80 61 92" stroke={strapColor} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* Chest buckle connecting the straps */}
      <rect x={44} y={78} width={12} height={4} rx={2} fill={strapColor} />
    </g>
  )
}

function AccessoryOverlay({ slug }: { slug: string }) {
  if (slug === 'utility-belt') {
    return (
      <g>
        {/* Belt strap across mid-torso */}
        <rect x={30} y={83} width={40} height={5} rx={2} fill="#92400E" />
        {/* Buckle */}
        <rect x={46} y={81} width={8} height={9} rx={2} fill="#78350F" />
        <rect x={48} y={83} width={4} height={5} rx={1} fill="#D97706" />
        {/* Belt pouches */}
        <rect x={32} y={82} width={6} height={7} rx={1.5} fill="#78350F" />
        <rect x={62} y={82} width={6} height={7} rx={1.5} fill="#78350F" />
      </g>
    )
  }

  if (slug === 'binoculars') {
    return (
      <g>
        {/* Strap around neck */}
        <path d="M 43 64 Q 50 70 57 64" stroke="#374151" strokeWidth={1.5} fill="none" />
        {/* Binocular lenses */}
        <ellipse cx={42} cy={80} rx={5} ry={4} fill="#1F2937" stroke="#4B5563" strokeWidth={0.8} />
        <ellipse cx={58} cy={80} rx={5} ry={4} fill="#1F2937" stroke="#4B5563" strokeWidth={0.8} />
        {/* Bridge between lenses */}
        <rect x={46} y={78} width={8} height={4} rx={1.5} fill="#374151" />
        {/* Lens glare */}
        <ellipse cx={40} cy={78} rx={1.5} ry={1.2} fill="#93C5FD" opacity={0.5} />
        <ellipse cx={56} cy={78} rx={1.5} ry={1.2} fill="#93C5FD" opacity={0.5} />
      </g>
    )
  }

  if (slug === 'starter-trinket') {
    return (
      <g>
        {/* Chain */}
        <path d="M 46 64 Q 50 68 54 64" stroke="#9CA3AF" strokeWidth={1} fill="none" />
        {/* Charm */}
        <circle cx={50} cy={72} r={4} fill="#6366F1" stroke="#818CF8" strokeWidth={0.8} />
        <circle cx={50} cy={72} r={2} fill="#A5B4FC" opacity={0.8} />
      </g>
    )
  }

  return null
}

function HandheldOverlay({ slug }: { slug: string }) {
  // Rendered at right hand position (rhx=73, y=94)
  if (slug === 'starter-flashlight' || slug === 'flashlight' || slug === 'better-flashlight') {
    return (
      <g>
        {/* Flashlight body */}
        <rect x={79} y={88} width={7} height={20} rx={2.5} fill="#374151" />
        {/* Lens */}
        <rect x={78} y={84} width={9} height={7} rx={3} fill="#6B7280" />
        {/* Beam glow */}
        <ellipse cx={82} cy={80} rx={5} ry={3} fill="#FEF08A" opacity={0.6} />
        {/* Grip band */}
        <rect x={79} y={97} width={7} height={3} rx={1} fill="#1F2937" />
      </g>
    )
  }

  if (slug === 'wrench' || slug === 'starter-tool') {
    return (
      <g>
        {/* Wrench handle */}
        <rect x={80} y={88} width={5} height={18} rx={2} fill="#6B7280" />
        {/* Wrench head */}
        <ellipse cx={82} cy={86} rx={5} ry={4} fill="#4B5563" />
        <ellipse cx={82} cy={86} rx={2} ry={2} fill="#374151" />
      </g>
    )
  }

  if (slug === 'alarm-cans') {
    return (
      <g>
        {/* Hanging cans */}
        <rect x={79} y={86} width={6} height={10} rx={1.5} fill="#9CA3AF" />
        <rect x={86} y={88} width={6} height={9} rx={1.5} fill="#6B7280" />
        {/* String */}
        <path d="M 82 82 L 82 86" stroke="#94A3B8" strokeWidth={1} />
        <path d="M 89 82 L 89 88" stroke="#94A3B8" strokeWidth={1} />
      </g>
    )
  }

  if (slug === 'spike-bat' || slug === 'spiked-bat') {
    return (
      <g>
        {/* Bat handle */}
        <rect x={81} y={92} width={4} height={20} rx={2} fill="#78350F" />
        {/* Bat head */}
        <rect x={78} y={84} width={10} height={10} rx={2} fill="#92400E" />
        {/* Spikes */}
        <polygon points="79,84 81,80 83,84" fill="#9CA3AF" />
        <polygon points="84,84 86,80 88,84" fill="#9CA3AF" />
      </g>
    )
  }

  // Default: generic tool/weapon (knife/blade)
  return (
    <g>
      {/* Handle */}
      <rect x={80} y={96} width={5} height={14} rx={2} fill="#78350F" />
      {/* Blade */}
      <path d="M 81 96 L 79 80 L 85 86 Z" fill="#9CA3AF" />
      {/* Guard */}
      <rect x={78} y={94} width={9} height={3} rx={1} fill="#6B7280" />
    </g>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const NATIVE_W = 100
const NATIVE_H = 130

interface Props {
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
  eyeColor?:  string | null
  gender?:    string | null
  gear?:      GearSlots
  width?:     number
  height?:    number
  className?: string
}

export function BlockCharacter({
  hairStyle,
  hairColor,
  skinTone,
  eyeColor,
  gender,
  gear,
  width  = NATIVE_W,
  height,
  className,
}: Props) {
  const colors = buildAvatarColors({ hairStyle, hairColor, skinTone, eyeColor, topSlug: gear?.top })
  const h = height ?? Math.round(width * (NATIVE_H / NATIVE_W))
  const slim = gender === 'girl'

  const headSlug      = gear?.head      ?? null
  const accessorySlug = gear?.accessory  ?? null
  const backpackSlug  = gear?.backpack   ?? null
  const handheldSlug  = gear?.handheld   ?? null

  return (
    <svg
      viewBox={`0 0 ${NATIVE_W} ${NATIVE_H}`}
      width={width}
      height={h}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Layer 1: back hair */}
      <BackHair  style={colors.hairStyle} hair={colors.hair} hairDark={colors.hairDark} />
      {/* Layer 2: backpack shoulder straps (behind body, visible at top) */}
      {backpackSlug && <BackpackStraps slug={backpackSlug} />}
      {/* Layer 3: legs */}
      <Legs      outfit={colors.outfit} outfitDark={colors.outfitDark} shoe={colors.shoe} slim={slim} />
      {/* Layer 4: body (torso, arms, neck) */}
      <Body      skin={colors.skin} skinDark={colors.skinDark} outfit={colors.outfit} outfitDark={colors.outfitDark} slim={slim} />
      {/* Layer 5: accessory overlay (belt / binoculars / trinket) */}
      {accessorySlug && <AccessoryOverlay slug={accessorySlug} />}
      {/* Layer 6: handheld item (right hand) */}
      {handheldSlug && <HandheldOverlay slug={handheldSlug} />}
      {/* Layer 7: head */}
      <Head      skin={colors.skin} skinDark={colors.skinDark} />
      {/* Layer 8: face */}
      <Face      iris={colors.iris} />
      {/* Layer 9: front hair */}
      <FrontHair style={colors.hairStyle} hair={colors.hair} hairDark={colors.hairDark} />
      {/* Layer 10: hat overlay (renders above all hair) */}
      {headSlug && <HatOverlay slug={headSlug} />}
    </svg>
  )
}
