import { prisma } from '@/lib/db'
import { getOrCreateSettings, DIFFICULTY_MULTIPLIER, type SurvivalSettings } from '@/lib/game/settings'

export type ZombieThreat = 'none' | 'low' | 'moderate' | 'high' | 'critical'
export type AttackResult = 'quiet' | 'defended' | 'barely_survived' | 'overrun'

const THREAT_DAMAGE: Record<ZombieThreat, number> = {
  none: 0,
  low: 5,
  moderate: 15,
  high: 30,
  critical: 50,
}

export const REPAIR_TIERS = {
  light: { scrapCost: 10, repairAmount: 20 },
  heavy: { scrapCost: 25, repairAmount: 60 },
} as const

export type RepairTier = keyof typeof REPAIR_TIERS
export type BaseComponent = 'door' | 'barricade' | 'fence' | 'light' | 'watchtower' | 'turret'

export const MAX_COMPONENT_LEVEL = 5

/**
 * Scrap cost to upgrade a component FROM a given level to the next.
 * Key = current level. Watchtower/turret start at 0 (not built); door etc. start at 1.
 */
export const UPGRADE_COSTS: Record<number, number> = {
  0: 50,   // build from scratch (watchtower / turret only)
  1: 30,   // 1 → 2
  2: 60,   // 2 → 3
  3: 120,  // 3 → 4
  4: 200,  // 4 → 5
}

/** Maps a BaseComponent to its level field on BaseState. */
const LEVEL_FIELD_MAP = {
  door:       'doorLevel',
  barricade:  'barricadeLevel',
  fence:      'fenceLevel',
  light:      'lightLevel',
  watchtower: 'watchtowerLevel',
  turret:     'turretLevel',
} as const satisfies Record<BaseComponent, string>

/** Maps a BaseComponent to its damage field on BaseState. */
const DAMAGE_FIELD_MAP = {
  door:       'doorDamage',
  barricade:  'barricadeDamage',
  fence:      'fenceDamage',
  light:      'lightDamage',
  watchtower: 'watchtowerDamage',
  turret:     'turretDamage',
} as const satisfies Record<BaseComponent, string>

/** Returns today at midnight UTC as a stable date key. */
function todayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/** Returns yesterday at midnight UTC. */
function yesterdayUTC(): Date {
  const d = todayUTC()
  d.setUTCDate(d.getUTCDate() - 1)
  return d
}

export type ThreatFactors = {
  threat: ZombieThreat
  /** Raw score 0–7+ that drives the threat level. */
  threatScore: number
  /** How many points short of minimumDailyPoints (0 = met or setting disabled). */
  pointsShortfall: number
  /** How many critical chores short of requiredCriticalChores (0 = met or setting disabled). */
  criticalShortfall: number
}

/**
 * Calculates zombie threat from three weighted factors:
 *
 *  Factor 1 — Missed-chore ratio (0–3 pts)
 *    ratio = missedCount / totalCount
 *    0 %      → +0   (clean sweep)
 *    1–25 %   → +1   (a couple slipped through)
 *    26–50 %  → +2   (significant miss)
 *    > 50 %   → +3   (majority missed — feeds overrun check separately)
 *
 *  Factor 2 — Points shortfall vs minimumDailyPoints (0–2 pts)
 *    ≤ 50 % below minimum → +1
 *    > 50 % below minimum → +2
 *
 *  Factor 3 — Critical-chore shortfall vs requiredCriticalChores (0–2 pts)
 *    1 short  → +1
 *    2+ short → +2
 *
 *  Score → threat:  0=none  1=low  2–3=moderate  4–5=high  6+=critical
 */
export function calcThreat(
  missedCount: number,
  totalCount: number,
  approvedPoints: number,
  criticalApprovedCount: number,
  settings: Pick<SurvivalSettings, 'minimumDailyPoints' | 'requiredCriticalChores'>,
): ThreatFactors {
  let threatScore = 0

  // Factor 1: missed ratio
  if (totalCount > 0) {
    const ratio = missedCount / totalCount
    if (ratio > 0.5)       threatScore += 3
    else if (ratio > 0.25) threatScore += 2
    else if (ratio > 0)    threatScore += 1
  }

  // Factor 2: points shortfall
  const pointsShortfall = Math.max(0, settings.minimumDailyPoints - approvedPoints)
  if (settings.minimumDailyPoints > 0 && pointsShortfall > 0) {
    const shortfallRatio = pointsShortfall / settings.minimumDailyPoints
    threatScore += shortfallRatio > 0.5 ? 2 : 1
  }

  // Factor 3: critical chores shortfall
  const criticalShortfall = Math.max(0, settings.requiredCriticalChores - criticalApprovedCount)
  if (settings.requiredCriticalChores > 0 && criticalShortfall > 0) {
    threatScore += criticalShortfall >= 2 ? 2 : 1
  }

  let threat: ZombieThreat
  if (threatScore === 0)      threat = 'none'
  else if (threatScore === 1) threat = 'low'
  else if (threatScore <= 3)  threat = 'moderate'
  else if (threatScore <= 5)  threat = 'high'
  else                        threat = 'critical'

  return { threat, threatScore, pointsShortfall, criticalShortfall }
}

/**
 * Returns the overall threat level based on average component damage.
 * Used to display the current state of the base to the child.
 */
export function calcCurrentThreat(
  doorDamage: number,
  barricadeDamage: number,
  fenceDamage: number,
  lightDamage: number,
): ZombieThreat {
  const avg = (doorDamage + barricadeDamage + fenceDamage + lightDamage) / 4
  if (avg <= 10) return 'none'
  if (avg <= 30) return 'low'
  if (avg <= 50) return 'moderate'
  if (avg <= 75) return 'high'
  return 'critical'
}

/** Ensures a BaseState row exists for this child. Safe to call repeatedly. */
export async function getOrCreateBaseState(childUserId: string) {
  return prisma.baseState.upsert({
    where: { childUserId },
    create: { childUserId },
    update: {},
  })
}

/**
 * Simulates the nightly zombie attack for today.
 * Idempotent — if today's DailyBaseDamage already exists, returns immediately.
 * Looks at yesterday's chore results to determine damage and repair.
 */
export async function simulateNightAttack(childUserId: string): Promise<void> {
  const today = todayUTC()

  // Idempotency check — already ran today
  const existing = await prisma.dailyBaseDamage.findUnique({
    where: { childUserId_date: { childUserId, date: today } },
  })
  if (existing) return

  const base = await getOrCreateBaseState(childUserId)
  const yesterday = yesterdayUTC()

  // Fetch child profile and yesterday's outcomes in parallel
  const [childProfile, missedCount, approvedCount, totalCount, pointsAgg, criticalApprovedCount] = await Promise.all([
    prisma.childProfile.findUnique({
      where: { userId: childUserId },
      select: { streakCount: true, householdId: true },
    }),
    prisma.choreInstance.count({
      where: { childUserId, status: 'missed', dueDate: { gte: yesterday, lt: today } },
    }),
    prisma.choreInstance.count({
      where: { childUserId, status: 'approved', reviewedAt: { gte: yesterday, lt: today } },
    }),
    prisma.choreInstance.count({
      where: { childUserId, dueDate: { gte: yesterday, lt: today } },
    }),
    // Sum points from approved instances (pointsAwarded may be null → treat as 0)
    prisma.choreInstance.aggregate({
      _sum: { pointsAwarded: true },
      where: { childUserId, status: 'approved', reviewedAt: { gte: yesterday, lt: today } },
    }),
    // Count approved high-difficulty chores (difficultyScore >= 3 = "critical")
    prisma.choreInstance.count({
      where: {
        childUserId,
        status: 'approved',
        reviewedAt: { gte: yesterday, lt: today },
        assignment: { chore: { difficultyScore: { gte: 3 } } },
      },
    }),
  ])
  const approvedPoints = pointsAgg._sum.pointsAwarded ?? 0
  const settings = await getOrCreateSettings(childProfile?.householdId ?? undefined)

  // If nightly attacks are disabled, log a quiet night and return
  if (!settings.nightAttacksEnabled) {
    await prisma.$transaction(async (tx) => {
      await tx.dailyBaseDamage.create({
        data: {
          childUserId,
          baseStateId: base.id,
          date: today,
          missedChores: 0,
          zombieThreat: 'none',
          attackResult: 'quiet',
          repairApplied: 0,
        },
      })
      await tx.baseState.update({
        where: { childUserId },
        data: { survivalStreak: base.survivalStreak + 1 },
      })
      if (childProfile) {
        await tx.childProfile.update({
          where: { userId: childUserId },
          data: { streakCount: (childProfile.streakCount ?? 0) + (totalCount > 0 && missedCount === 0 ? 1 : 0) },
        })
      }
    })
    return
  }

  const { threat, threatScore, pointsShortfall, criticalShortfall } = calcThreat(
    missedCount,
    totalCount,
    approvedPoints,
    criticalApprovedCount,
    settings,
  )
  const diffMult = DIFFICULTY_MULTIPLIER[settings.difficulty] ?? 1.0
  const baseDamage = Math.round(THREAT_DAMAGE[threat] * diffMult)
  const repairPoints = approvedCount * 10

  // Overrun: missed ≥ 50% of total assigned (and there were chores assigned)
  const isOverrun = totalCount > 0 && missedCount >= totalCount * 0.5

  let attackResult: AttackResult
  if (baseDamage === 0 && repairPoints === 0) {
    // No chores or all quiet — nothing happened
    attackResult = 'quiet'
  } else if (isOverrun) {
    attackResult = 'overrun'
  } else if (threatScore >= 4) {
    // High or critical threat (score 4+) — a genuine close call
    attackResult = 'barely_survived'
  } else if (threatScore >= 2 && (pointsShortfall > 0 || criticalShortfall > 0)) {
    // Moderate threat (score 2–3) made worse by points or critical-chore shortfall
    attackResult = 'barely_survived'
  } else {
    attackResult = 'defended'
  }

  // survivalStreak: increment on any non-overrun night, reset on overrun
  const newSurvivalStreak = attackResult === 'overrun' ? 0 : base.survivalStreak + 1

  // choreStreak: increment if had chores and missed none, reset if missed any
  let newChoreStreak = childProfile?.streakCount ?? 0
  if (totalCount > 0) {
    newChoreStreak = missedCount === 0 ? newChoreStreak + 1 : 0
  }

  if (attackResult === 'quiet') {
    await prisma.$transaction(async (tx) => {
      await tx.dailyBaseDamage.create({
        data: {
          childUserId,
          baseStateId: base.id,
          date: today,
          missedChores: 0,
          zombieThreat: 'none',
          attackResult: 'quiet',
          repairApplied: 0,
        },
      })
      await tx.baseState.update({
        where: { childUserId },
        data: { survivalStreak: newSurvivalStreak },
      })
      if (childProfile) {
        await tx.childProfile.update({
          where: { userId: childUserId },
          data: { streakCount: newChoreStreak },
        })
      }
    })
    return
  }

  // Number of installed components for distributing repair evenly
  const installedCount =
    4 +
    (base.watchtowerLevel > 0 ? 1 : 0) +
    (base.turretLevel > 0 ? 1 : 0)

  // Per-component damage: higher level = less damage taken
  // Formula: rawDamage = baseDamage * (6 - level) / 5
  // Repair is split evenly across all installed components
  const repairPerComponent = Math.floor(repairPoints / installedCount)

  function netDamage(level: number): number {
    const raw = Math.round((baseDamage * (6 - level)) / 5)
    return Math.max(0, raw - repairPerComponent)
  }

  function clamp(val: number): number {
    return Math.min(100, Math.max(0, val))
  }

  // Build net damage map for all installed components
  const netMap: Record<string, number> = {
    door:      netDamage(base.doorLevel),
    barricade: netDamage(base.barricadeLevel),
    fence:     netDamage(base.fenceLevel),
    light:     netDamage(base.lightLevel),
  }
  if (base.watchtowerLevel > 0) netMap.watchtower = netDamage(base.watchtowerLevel)
  if (base.turretLevel > 0)     netMap.turret     = netDamage(base.turretLevel)

  // Overrun spike: +40 damage to the most-damaged (weakest) installed component
  if (isOverrun) {
    const currentDamages = [
      { key: 'door',      current: base.doorDamage },
      { key: 'barricade', current: base.barricadeDamage },
      { key: 'fence',     current: base.fenceDamage },
      { key: 'light',     current: base.lightDamage },
      ...(base.watchtowerLevel > 0 ? [{ key: 'watchtower', current: base.watchtowerDamage }] : []),
      ...(base.turretLevel > 0     ? [{ key: 'turret',     current: base.turretDamage     }] : []),
    ]
    const weakest = currentDamages.reduce((a, b) => (a.current >= b.current ? a : b))
    netMap[weakest.key] = (netMap[weakest.key] ?? 0) + 40
  }

  await prisma.$transaction(async (tx) => {
    await tx.dailyBaseDamage.create({
      data: {
        childUserId,
        baseStateId: base.id,
        date: today,
        doorDamage:       netMap.door,
        barricadeDamage:  netMap.barricade,
        fenceDamage:      netMap.fence,
        lightDamage:      netMap.light,
        watchtowerDamage: netMap.watchtower ?? 0,
        turretDamage:     netMap.turret     ?? 0,
        missedChores:  missedCount,
        zombieThreat:  threat,
        attackResult,
        repairApplied: repairPoints,
      },
    })
    await tx.baseState.update({
      where: { childUserId },
      data: {
        doorDamage:      clamp(base.doorDamage      + netMap.door),
        barricadeDamage: clamp(base.barricadeDamage + netMap.barricade),
        fenceDamage:     clamp(base.fenceDamage     + netMap.fence),
        lightDamage:     clamp(base.lightDamage     + netMap.light),
        ...(base.watchtowerLevel > 0 && {
          watchtowerDamage: clamp(base.watchtowerDamage + netMap.watchtower),
        }),
        ...(base.turretLevel > 0 && {
          turretDamage: clamp(base.turretDamage + (netMap.turret ?? 0)),
        }),
        survivalStreak: newSurvivalStreak,
      },
    })
    if (childProfile) {
      await tx.childProfile.update({
        where: { userId: childUserId },
        data: { streakCount: newChoreStreak },
      })
    }
  })
}

/**
 * Spends scrap to repair a specific base component.
 * Returns the updated BaseState, or throws if insufficient scrap.
 */
export async function repairComponent(
  childUserId: string,
  component: BaseComponent,
  tier: RepairTier,
) {
  const { scrapCost, repairAmount } = REPAIR_TIERS[tier]

  const [child, base] = await Promise.all([
    prisma.user.findUnique({
      where: { id: childUserId },
      select: { gameCurrencyBalance: true },
    }),
    prisma.baseState.findUnique({ where: { childUserId } }),
  ])

  if (!child || !base) throw new Error('Base state not found')
  if (child.gameCurrencyBalance < scrapCost) throw new Error('Not enough Scrap')

  const damageField = DAMAGE_FIELD_MAP[component]
  const currentDamage = base[damageField] as number
  const newDamage = Math.max(0, currentDamage - repairAmount)

  const [, updatedBase] = await prisma.$transaction([
    prisma.user.update({
      where: { id: childUserId },
      data: { gameCurrencyBalance: { decrement: scrapCost } },
    }),
    prisma.baseState.update({
      where: { childUserId },
      data: { [damageField]: newDamage },
    }),
  ])

  return updatedBase
}

/**
 * Spends scrap to upgrade a base component to the next level.
 * Level 0 components become level 1 (newly built); max level is MAX_COMPONENT_LEVEL.
 * Returns the updated BaseState, or throws if insufficient scrap or already max level.
 */
export async function upgradeComponent(
  childUserId: string,
  component: BaseComponent,
) {
  const [child, base] = await Promise.all([
    prisma.user.findUnique({
      where: { id: childUserId },
      select: { gameCurrencyBalance: true },
    }),
    prisma.baseState.findUnique({ where: { childUserId } }),
  ])

  if (!child || !base) throw new Error('Base state not found')

  const levelField = LEVEL_FIELD_MAP[component]
  const currentLevel = base[levelField] as number
  if (currentLevel >= MAX_COMPONENT_LEVEL) throw new Error('Already at maximum level')

  const cost = UPGRADE_COSTS[currentLevel]
  if (cost === undefined) throw new Error('Invalid upgrade level')
  if (child.gameCurrencyBalance < cost) throw new Error('Not enough Scrap')

  const [, updatedBase] = await prisma.$transaction([
    prisma.user.update({
      where: { id: childUserId },
      data: { gameCurrencyBalance: { decrement: cost } },
    }),
    prisma.baseState.update({
      where: { childUserId },
      data: { [levelField]: currentLevel + 1 },
    }),
  ])

  return updatedBase
}
