import { prisma } from '@/lib/db'
import { getWeekBounds } from '@/lib/chores/instances'
import { getOrCreateSettings } from '@/lib/game/settings'
import { WeeklyLedger } from '@prisma/client'

export type FinalizeResult =
  | { ledger: WeeklyLedger; alreadyFinalized: false }
  | { ledger: WeeklyLedger; alreadyFinalized: true }

/**
 * Creates a WeeklyLedger for the given child + week.
 * Sums all approved ChoreInstances (by dueDate) and approved BonusRequests
 * (by submittedAt) within the week.
 *
 * The XP / scrap / allowance totals recorded in the ledger reflect what
 * was earned that week — the actual increments on the User row happen at
 * individual approval time (Phase 3). The ledger is the audit record.
 *
 * Safe to call multiple times — returns the existing ledger on repeats.
 */
export async function finalizeWeek(
  childUserId: string,
  weekStartInput: Date,
  approvedByUserId: string,
): Promise<FinalizeResult> {
  const { start, end } = getWeekBounds(weekStartInput)

  // ── Duplicate prevention ───────────────────────────────────────────────
  const existing = await prisma.weeklyLedger.findUnique({
    where: { childUserId_weekStart: { childUserId, weekStart: start } },
  })
  if (existing) return { ledger: existing, alreadyFinalized: true }

  // ── Aggregate approved work ────────────────────────────────────────────
  const [instances, bonusRequests] = await Promise.all([
    prisma.choreInstance.findMany({
      where: { childUserId, status: 'approved', dueDate: { gte: start, lte: end } },
      select: { pointsAwarded: true },
    }),
    prisma.bonusRequest.findMany({
      where: { childUserId, status: 'approved', submittedAt: { gte: start, lte: end } },
      select: { approvedPoints: true },
    }),
  ])

  const chorePoints = instances.reduce((sum, i) => sum + (i.pointsAwarded ?? 0), 0)
  const bonusPoints = bonusRequests.reduce((sum, b) => sum + (b.approvedPoints ?? 0), 0)
  const totalPoints = chorePoints + bonusPoints

  const household = await prisma.householdMember.findFirst({
    where: { userId: childUserId },
    select: { householdId: true },
  })
  const settings = await getOrCreateSettings(household?.householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = settings as any

  const xpPerPoint = Number(process.env.XP_PER_POINT ?? 5)
  const scrapPerPoint = Number(process.env.GAME_CURRENCY_PER_POINT ?? 2)
  const allowancePointsPerDollar = s.allowancePointsPerDollar ?? Number(process.env.ALLOWANCE_POINTS_PER_DOLLAR ?? 100)

  const xpAwarded = totalPoints * xpPerPoint
  const gameCurrencyAwarded = totalPoints * scrapPerPoint
  const allowanceCentsAwarded = Math.floor((totalPoints / allowancePointsPerDollar) * 100)

  // ── Allowance cap (from settings) ─────────────────────────────────────
  const xpConversionRate: number = s.xpConversionRate ?? 100  // XP per $1
  const weeklyAllowanceCap: number | null = s.weeklyAllowanceCap ?? null
  // XP-based allowance: xpEarned / xpConversionRate * 100 cents
  let xpAllowanceCents = Math.floor((xpAwarded / Math.max(1, xpConversionRate)) * 100)
  if (weeklyAllowanceCap != null) {
    xpAllowanceCents = Math.min(xpAllowanceCents, weeklyAllowanceCap)
  }
  const totalMoneyEarned = allowanceCentsAwarded + xpAllowanceCents

  // ── Atomic write ───────────────────────────────────────────────────────
  const ledger = await prisma.$transaction(async (tx) => {
    const l = await tx.weeklyLedger.create({
      data: {
        childUserId,
        weekStart: start,
        weekEnd: end,
        approvedPointsTotal: totalPoints,
        xpAwarded,
        gameCurrencyAwarded,
        allowanceCentsAwarded,
        approvedByUserId,
      },
    })

    // Upsert AllowanceRecord for this week (types resolve after npx prisma generate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (tx as any).allowanceRecord.upsert({
      where: { childUserId_weekStart: { childUserId, weekStart: start } },
      create: {
        childUserId,
        householdId: household?.householdId,
        weekStart: start,
        weekEnd: end,
        xpEarned: xpAwarded,
        moneyEarned: totalMoneyEarned,
      },
      update: {
        xpEarned: xpAwarded,
        moneyEarned: totalMoneyEarned,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: approvedByUserId,
        targetType: 'WeeklyLedger',
        targetId: l.id,
        action: 'weekly_finalize',
        metadataJson: {
          childUserId,
          weekStart: start.toISOString(),
          weekEnd: end.toISOString(),
          chorePoints,
          bonusPoints,
          totalPoints,
          xpAllowanceCents,
        },
      },
    })

    return l
  })

  return { ledger, alreadyFinalized: false }
}
