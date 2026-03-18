export interface GearStats {
  defense?: number
  visibility?: number
  attack?: number
  resistance?: number
  luck?: number
}

export const STAT_ICONS: Record<keyof GearStats, string> = {
  defense: '🛡️',
  visibility: '👁️',
  attack: '⚔️',
  resistance: '🧥',
  luck: '🍀',
}

const THREAT_PENALTY: Record<string, number> = {
  none: 0,
  low: 10,
  moderate: 25,
  high: 50,
  critical: 100,
}

/** Safely extracts standardized stat keys from a Prisma Json field. Ignores unknown keys. */
export function parseGearStats(json: unknown): GearStats {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {}
  const obj = json as Record<string, unknown>
  const result: GearStats = {}
  for (const key of ['defense', 'visibility', 'attack', 'resistance', 'luck'] as const) {
    if (typeof obj[key] === 'number') result[key] = obj[key] as number
  }
  return result
}

/** Gear bonus = sum of all stat values across equipped items × 5 per point. */
export function calcGearBonus(statsList: GearStats[]): number {
  let total = 0
  for (const s of statsList) {
    total +=
      (s.defense ?? 0) +
      (s.visibility ?? 0) +
      (s.attack ?? 0) +
      (s.resistance ?? 0) +
      (s.luck ?? 0)
  }
  return total * 5
}

/** Base health: 100 = fully intact, 0 = destroyed. */
export function calcBaseHealth(
  doorDamage: number,
  barricadeDamage: number,
  fenceDamage: number,
  lightDamage: number,
): number {
  return Math.round(100 - (doorDamage + barricadeDamage + fenceDamage + lightDamage) / 4)
}

/** Companion bonus = sum of bonusValues for equipped companions × 5. */
export function calcCompanionBonus(companions: { bonusValue: number }[]): number {
  return companions.reduce((sum, c) => sum + c.bonusValue, 0) * 5
}

export function calcSurvivalScore({
  chorePoints,
  baseHealth,
  gearBonus,
  companionBonus,
  threat,
}: {
  chorePoints: number
  baseHealth: number
  gearBonus: number
  companionBonus: number
  threat: string
}): number {
  return Math.max(
    0,
    chorePoints + baseHealth + gearBonus + companionBonus - (THREAT_PENALTY[threat] ?? 0),
  )
}
