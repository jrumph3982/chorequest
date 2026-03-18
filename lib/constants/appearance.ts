export const HAIR_STYLES = [
  'Short',
  'Long',
  'Curly',
  'Braided',
  'Shaved',
  'Ponytail',
] as const

export const HAIR_COLORS = [
  'Black',
  'Brown',
  'Blonde',
  'Red',
  'White',
  'Gray',
  'Blue',
  'Green',
] as const

export const SKIN_TONES = [
  'Light',
  'Medium-Light',
  'Medium',
  'Medium-Dark',
  'Dark',
] as const

export const EYE_COLORS = [
  'Brown',
  'Blue',
  'Green',
  'Hazel',
  'Gray',
  'Amber',
] as const

export type HairStyle = (typeof HAIR_STYLES)[number]
export type HairColor = (typeof HAIR_COLORS)[number]
export type SkinTone  = (typeof SKIN_TONES)[number]
export type EyeColor  = (typeof EYE_COLORS)[number]

// Tailwind swatch classes — must be full class names for the scanner to include them
export const HAIR_COLOR_SWATCH: Record<HairColor, string> = {
  Black:  'bg-gray-950',
  Brown:  'bg-amber-800',
  Blonde: 'bg-yellow-300',
  Red:    'bg-red-500',
  White:  'bg-white',
  Gray:   'bg-gray-400',
  Blue:   'bg-blue-500',
  Green:  'bg-green-500',
}

export const SKIN_TONE_SWATCH: Record<SkinTone, string> = {
  'Light':        'bg-amber-100',
  'Medium-Light': 'bg-orange-200',
  'Medium':       'bg-amber-400',
  'Medium-Dark':  'bg-amber-700',
  'Dark':         'bg-amber-900',
}

export const EYE_COLOR_SWATCH: Record<EyeColor, string> = {
  Brown: 'bg-amber-700',
  Blue:  'bg-blue-500',
  Green: 'bg-green-500',
  Hazel: 'bg-lime-600',
  Gray:  'bg-gray-400',
  Amber: 'bg-orange-400',
}
