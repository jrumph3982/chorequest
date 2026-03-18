import { prisma } from '@/lib/db'

export type SurvivalSettings = {
  id: string
  nightAttacksEnabled: boolean
  minimumDailyPoints: number
  requiredCriticalChores: number
  difficulty: string
  gearBonusesEnabled: boolean
  companionBonusesEnabled: boolean
  eventsEnabled: boolean
  xpMultiplier: number
  coinMultiplier: number
  nightRaidFrequency: string
  rewardDropRate: string
  allowancePointsPerDollar: number
  weeklyAllowanceCap: number | null
}

export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 0.5,
  normal: 1.0,
  hard: 1.5,
}

export async function getOrCreateSettings(householdId?: string): Promise<SurvivalSettings> {
  const where = householdId ? { householdId } : {}
  const existing = await prisma.survivalSettings.findFirst({ where })
  if (existing) return existing

  return prisma.survivalSettings.create({ data: householdId ? { householdId } : {} })
}
