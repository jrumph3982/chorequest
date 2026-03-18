/**
 * sprite-map.ts — DEPRECATED
 *
 * This file is no longer imported. CharacterSprite now uses the SVG-based
 * BlockCharacter system (see lib/constants/avatar-map.ts). The Nonemo PNG
 * asset pack at public/characters/nonemo/ is no longer referenced in code.
 *
 * Original description:
 * Maps stored appearance values (hairStyle, hairColor, skinTone) to the exact
 * file paths and position types used by CharacterSprite to assemble a character.
 *
 * Coordinate system:
 *   All positions are expressed in "1x" CSS pixels while the actual image files
 *   are PNG@2x.  CharacterSprite renders the inner sprite at 145×155 CSS pixels
 *   and scales it down with a CSS transform to whatever display size is requested.
 *
 * Source of truth for positions:
 *   SVG viewBox values from the Nonemo Modular Character pack:
 *     head / face / hair layers → 145×143 unified canvas (stack directly)
 *     body (skin)               → 35×25,  top=100, left=55
 *     shirt (trousers 35×25,    → same position as body
 *            dress   41×25)
 *     arm  (skin)               → 12×28,  left arm at left=43, right at left=90
 *     sleeve                    → 12×28,  same x/y as arm
 *     leg  (skin)               → 13×28,  left at left=60, right at left=73
 *     pants                     → 13×28,  same x/y as leg
 */

const BASE = '/characters/nonemo'

// ─── Skin tone ────────────────────────────────────────────────────────────────

/** Maps DB skinTone values to the tint folder in the asset pack. */
export const SKIN_TINT: Record<string, string> = {
  'Light':        'tint_1',
  'Medium-Light': 'tint_1',
  'Medium':       'tint_2',
  'Medium-Dark':  'tint_3',
  'Dark':         'tint_3',
}

const DEFAULT_TINT = 'tint_1'

// ─── Hair style ───────────────────────────────────────────────────────────────

/**
 * Maps DB hairStyle values to the front and back hair filename prefixes.
 * null means "no hair layer" (e.g. Shaved).
 */
const HAIR_STYLE_MAP: Record<string, { front: string | null; back: string | null }> = {
  'Short':    { front: 'regular',  back: 'short' },
  'Long':     { front: 'straight', back: 'long'  },
  'Curly':    { front: 'curly',    back: 'curly' },
  'Braided':  { front: 'elegant',  back: 'long'  },  // elegant is closest match
  'Shaved':   { front: null,       back: null    },
  'Ponytail': { front: 'chupchik', back: 'short' },
}

const DEFAULT_HAIR_STYLE = { front: 'regular', back: 'short' } as const

// ─── Hair color ───────────────────────────────────────────────────────────────

/**
 * Maps DB hairColor values to filename color tokens used by the asset pack.
 * Note: the pack spells it 'blond', not 'blonde'.
 * Gray has no direct match; 'white' is the closest available.
 */
const HAIR_COLOR_MAP: Record<string, string> = {
  'Black':  'black',
  'Brown':  'brown',
  'Blonde': 'blond',  // pack uses 'blond'
  'Red':    'red',
  'White':  'white',
  'Gray':   'white',  // no gray in pack; white is the closest
  'Blue':   'blue',
  'Green':  'green',
}

const DEFAULT_HAIR_COLOR = 'brown'

// ─── Default clothing (not yet user-customisable) ─────────────────────────────

// Zombie survivor green: matches the game theme.
const SHIRT_SRC   = `${BASE}/shirts/trousers.green.png`   // 70×50 @2x → 35×25 at 1x
const SLEEVE_SRC  = `${BASE}/sleeves/green.short.png`     // 24×56 @2x → 12×28 at 1x
const PANTS_SRC   = `${BASE}/pants/pants.png`             // 26×56 @2x → 13×28 at 1x

// ─── Layer types + positions ──────────────────────────────────────────────────

/**
 * Each layer has a type that determines its CSS position within the
 * 145×155 sprite viewport.
 *
 *  full   — 145×143 canvas (head, hair, face, eyes, mouth, cheeks, beard, glasses)
 *  body   — 35×25   at top=100 left=55
 *  arm-l  — 12×28   at top=102 left=43  (left arm/sleeve)
 *  arm-r  — 12×28   at top=102 left=90  (right arm/sleeve, flipped)
 *  leg-l  — 13×28   at top=125 left=60  (left leg/pants)
 *  leg-r  — 13×28   at top=125 left=73  (right leg/pants)
 */
export type LayerType = 'full' | 'body' | 'arm-l' | 'arm-r' | 'leg-l' | 'leg-r'

export interface SpriteLayer {
  src:  string
  type: LayerType
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Returns the ordered list of sprite layers for a character.
 * Layers are in DOM render order — first = furthest back.
 *
 * Accepts null / undefined for any field; defaults are applied so the
 * character always renders something (backward-compatible with profiles
 * created before appearance customisation existed).
 */
export function buildSpriteLayers(appearance: {
  hairStyle?: string | null
  hairColor?: string | null
  skinTone?:  string | null
}): SpriteLayer[] {
  const tint  = SKIN_TINT[appearance.skinTone ?? '']  ?? DEFAULT_TINT
  const style = HAIR_STYLE_MAP[appearance.hairStyle ?? ''] ?? DEFAULT_HAIR_STYLE
  const color = HAIR_COLOR_MAP[appearance.hairColor ?? ''] ?? DEFAULT_HAIR_COLOR

  const skin = (part: string) => `${BASE}/skin/${tint}/${part}.png`

  const layers: SpriteLayer[] = []

  // 1 — Back hair (behind everything, including body)
  if (style.back) {
    layers.push({ src: `${BASE}/hairs/back/${style.back}.${color}.png`, type: 'full' })
  }

  // 2 — Body skin (torso, provides skin colour where shirt doesn't cover)
  layers.push({ src: skin('body'),  type: 'body' })

  // 3 — Shirt overlaid on torso
  layers.push({ src: SHIRT_SRC,    type: 'body' })

  // 4 & 5 — Left arm: skin then sleeve
  layers.push({ src: skin('arm'),   type: 'arm-l' })
  layers.push({ src: SLEEVE_SRC,   type: 'arm-l' })

  // 6 & 7 — Right arm: skin then sleeve (horizontally mirrored in CharacterSprite)
  layers.push({ src: skin('arm'),   type: 'arm-r' })
  layers.push({ src: SLEEVE_SRC,   type: 'arm-r' })

  // 8 & 9 — Left leg: skin then pants
  layers.push({ src: skin('leg'),   type: 'leg-l' })
  layers.push({ src: PANTS_SRC,    type: 'leg-l' })

  // 10 & 11 — Right leg: skin then pants
  layers.push({ src: skin('leg'),   type: 'leg-r' })
  layers.push({ src: PANTS_SRC,    type: 'leg-r' })

  // 12 — Head skin (covers upper torso/neck, sits above body layers)
  layers.push({ src: skin('head'),  type: 'full' })

  // 13 — Eyes (expression layer)
  layers.push({ src: `${BASE}/faces/parts/eyes/ordinary.png`, type: 'full' })

  // 14 — Mouth
  layers.push({ src: `${BASE}/faces/parts/mouth/smile.png`,   type: 'full' })

  // 15 — Cheek blush (on top of face, under hair)
  layers.push({ src: skin('head.cheeks'), type: 'full' })

  // 16 — Front hair (topmost layer)
  if (style.front) {
    layers.push({ src: `${BASE}/hairs/front/${style.front}.${color}.png`, type: 'full' })
  }

  return layers
}
