import { NextResponse } from 'next/server'
import { requireChild } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

/**
 * GET /api/child/game-state-version
 *
 * Returns { ts: number } — the unix-ms timestamp of the most recently
 * changed piece of game state relevant to this child.
 *
 * Tracked sources:
 *   - BaseState.updatedAt          (repair, upgrade, nightly attack)
 *   - ChoreInstance.reviewedAt     (admin approve / reject)
 *   - BonusRequest.reviewedAt      (admin approve / reject bonus)
 *   - SurvivalSettings.updatedAt   (admin changes survival rules)
 *
 * Used by ThreatPoller to decide whether a full router.refresh() is needed.
 * The queries are intentionally lightweight (single-row reads / aggregates).
 */
export async function GET() {
  const guard = await requireChild()
  if (!guard.ok) return guard.response
  const { userId } = guard.session

  const [baseState, lastChoreReview, lastBonusReview, childProfile] = await Promise.all([
    prisma.baseState.findUnique({
      where: { childUserId: userId },
      select: { updatedAt: true },
    }),
    prisma.choreInstance.findFirst({
      where: { childUserId: userId, reviewedAt: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      select: { reviewedAt: true },
    }),
    prisma.bonusRequest.findFirst({
      where: { childUserId: userId, reviewedAt: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      select: { reviewedAt: true },
    }),
    prisma.childProfile.findUnique({
      where: { userId },
      select: { householdId: true },
    }),
  ])

  const settings = childProfile?.householdId
    ? await prisma.survivalSettings.findFirst({
        where: { householdId: childProfile.householdId },
        select: { updatedAt: true },
      })
    : null

  const ts = Math.max(
    baseState?.updatedAt.getTime() ?? 0,
    lastChoreReview?.reviewedAt?.getTime() ?? 0,
    lastBonusReview?.reviewedAt?.getTime() ?? 0,
    settings?.updatedAt.getTime() ?? 0,
  )

  return NextResponse.json({ ts })
}
