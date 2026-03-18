/**
 * avatar-map.ts
 *
 * Maps stored appearance values to visual properties for the SVG-based
 * block character (Roblox-inspired style). Replaces the Nonemo PNG layer system.
 */

// ─── Skin tones ────────────────────────────────────────────────────────────────

export const SKIN_COLORS: Record<string, string> = {
  'Light':        '#FDDBB4',
  'Medium-Light': '#EFC891',
  'Medium':       '#D4A574',
  'Medium-Dark':  '#A67C52',
  'Dark':         '#6B4226',
}

export const DEFAULT_SKIN_COLOR = '#EFC891'

// ─── Hair colors ───────────────────────────────────────────────────────────────

export const HAIR_COLORS: Record<string, string> = {
  'Black':  '#1a1a1a',
  'Brown':  '#6B3A2A',
  'Blonde': '#F5D073',
  'Red':    '#C0392B',
  'White':  '#F0F0F0',
  'Gray':   '#9E9E9E',
  'Blue':   '#3B82F6',
  'Green':  '#22C55E',
}

export const DEFAULT_HAIR_COLOR = '#6B3A2A'

// ─── Hair style identifiers ────────────────────────────────────────────────────

export type HairStyleId = 'short' | 'long' | 'curly' | 'braided' | 'shaved' | 'ponytail'

export const HAIR_STYLE_IDS: Record<string, HairStyleId> = {
  'Short':    'short',
  'Long':     'long',
  'Curly':    'curly',
  'Braided':  'braided',
  'Shaved':   'shaved',
  'Ponytail': 'ponytail',
}

export const DEFAULT_HAIR_STYLE: HairStyleId = 'short'

// ─── Outfit colors (themed to zombie survivor) ────────────────────────────────

export const OUTFIT_COLOR   = '#3D5A1F'  // dark olive green
export const OUTFIT_DARK    = '#2A3E14'  // darker shade for depth
export const SHOE_COLOR     = '#3B3B3B'  // dark grey boots

// ─── Eye colors ───────────────────────────────────────────────────────────────

export const EYE_IRIS_COLORS: Record<string, string> = {
  'Brown': '#7c3d12',
  'Blue':  '#2563eb',
  'Green': '#16a34a',
  'Hazel': '#65a30d',
  'Gray':  '#6b7280',
  'Amber': '#d97706',
}

export const DEFAULT_EYE_COLOR = '#1a1a1a'

// ─── Builder ──────────────────────────────────────────────────────────────────

export interface AvatarColors {
  skin:        string
  skinDark:    string  // shadow/depth shade
  hair:        string
  hairDark:    string  // shadow shade
  outfit:      string
  outfitDark:  string
  shoe:        string
  hairStyle:   HairStyleId
  iris:        string  // eye iris color
}

export function darken(hex: string, amount = 0.2): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0
  const g = Math.max(0, ((n >> 8)  & 0xff) * (1 - amount)) | 0
  const b = Math.max(0,  (n        & 0xff) * (1 - amount)) | 0
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ─── Equipped gear slot slugs passed through the character render chain ────────

export interface GearSlots {
  head?:      string | null
  top?:       string | null
  accessory?: string | null
  backpack?:  string | null
  handheld?:  string | null
}

// Outfit colors for equipped top items
export function getTopColors(topSlug?: string | null): { outfit: string; outfitDark: string } {
  switch (topSlug) {
    case 'leather-jacket':           return { outfit: '#5C3D2E', outfitDark: '#3E2723' }
    case 'armor-vest':               return { outfit: '#4A5568', outfitDark: '#334155' }
    case 'tactical-jacket':          return { outfit: '#3a4a1a', outfitDark: '#2a3a0a' }
    case 'hazmat-jacket':            return { outfit: '#c8a820', outfitDark: '#8a7a10' }
    case 'leather-survivor-jacket':  return { outfit: '#3a1a08', outfitDark: '#2a1008' }
    case 'starter-jacket':           return { outfit: '#2a5a1a', outfitDark: '#1a4a0a' }
    default:                         return { outfit: OUTFIT_COLOR, outfitDark: OUTFIT_DARK }
  }
}

export function buildAvatarColors(appearance: {
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
  eyeColor?:  string | null
  topSlug?:   string | null
}): AvatarColors {
  const skin      = SKIN_COLORS[appearance.skinTone ?? '']  ?? DEFAULT_SKIN_COLOR
  const hair      = HAIR_COLORS[appearance.hairColor ?? ''] ?? DEFAULT_HAIR_COLOR
  const hairStyle = HAIR_STYLE_IDS[appearance.hairStyle ?? ''] ?? DEFAULT_HAIR_STYLE
  const iris      = EYE_IRIS_COLORS[appearance.eyeColor ?? ''] ?? DEFAULT_EYE_COLOR

  const { outfit, outfitDark } = getTopColors(appearance.topSlug)

  return {
    skin,
    skinDark:   darken(skin, 0.15),
    hair,
    hairDark:   darken(hair, 0.25),
    outfit,
    outfitDark,
    shoe:       SHOE_COLOR,
    hairStyle,
    iris,
  }
}
