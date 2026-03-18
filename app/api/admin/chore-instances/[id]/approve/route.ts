import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { reviewInstanceSchema } from '@/lib/validation/chores'
import { calcRewards } from '@/lib/chores/rewards'
import { applyLevelUp } from '@/lib/game/leveling'
import { checkAndUnlockChapters } from '@/lib/game/story'
import { getOrCreateSettings } from '@/lib/game/settings'
import { checkAndAwardAchievements } from '@/lib/game/achievements'
import { updateChallengeProgress } from '@/lib/game/challenges'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  const { id } = await params
  const body = await req.json()
  const parsed = reviewInstanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const instance = await prisma.choreInstance.findFirst({
    where: {
      id,
      child: { householdMembers: { some: { householdId } } },
    },
    include: { assignment: { include: { chore: { select: { basePoints: true } } } } },
  })
  if (!instance) {
    return NextResponse.json(
      { error: 'Completion record missing. Please refresh the page.' },
      { status: 404 },
    )
  }
  if (instance.status === 'approved') {
    return NextResponse.json({ error: 'Chore already approved' }, { status: 409 })
  }
  if (instance.status !== 'submitted_complete') {
    return NextResponse.json({ error: 'Instance not found or already reviewed' }, { status: 404 })
  }

  const pointsAwarded = parsed.data.pointsOverride ?? instance.assignment.chore.basePoints
  const settings = await getOrCreateSettings(householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar
  const { xp, scrap, allowanceCents } = calcRewards(pointsAwarded, { allowancePointsPerDollar })
  const now = new Date()

  const [updated] = await prisma.$transaction([
    prisma.choreInstance.update({
      where: { id },
      data: {
        status: 'approved',
        pointsAwarded,
        reviewedAt: now,
        reviewedByUserId: session.userId,
        notes: parsed.data.notes,
      },
    }),
    prisma.user.update({
      where: { id: instance.childUserId },
      data: {
        xp: { increment: xp },
        gameCurrencyBalance: { increment: scrap },
        allowanceBalanceCents: { increment: allowanceCents },
      },
    }),
  ])

  // Level-up, story unlock, achievements, and challenge progress run after the transaction
  await applyLevelUp(instance.childUserId)
  await checkAndUnlockChapters(instance.childUserId)
  await checkAndAwardAchievements(instance.childUserId, 'chore_approved', { points: pointsAwarded })
  await updateChallengeProgress(instance.childUserId, householdId, pointsAwarded)

  return NextResponse.json(updated)
}
