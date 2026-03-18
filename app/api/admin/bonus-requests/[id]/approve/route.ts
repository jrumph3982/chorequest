import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { reviewBonusRequestSchema } from '@/lib/validation/bonus'
import { calcRewards } from '@/lib/chores/rewards'
import { applyLevelUp } from '@/lib/game/leveling'
import { checkAndUnlockChapters } from '@/lib/game/story'
import { getOrCreateSettings } from '@/lib/game/settings'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  const { id } = await params
  const body = await req.json()
  const parsed = reviewBonusRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  if (!parsed.data.approvedPoints) {
    return NextResponse.json(
      { error: 'approvedPoints is required to approve a bonus request' },
      { status: 422 },
    )
  }

  const request = await prisma.bonusRequest.findUnique({
    where: { id, status: 'pending', householdId },
  })
  if (!request) {
    return NextResponse.json(
      { error: 'Request not found or already reviewed' },
      { status: 404 },
    )
  }

  const points = parsed.data.approvedPoints
  const settings = await getOrCreateSettings(householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar
  const { xp, scrap, allowanceCents } = calcRewards(points, { allowancePointsPerDollar })
  const now = new Date()

  const [updated] = await prisma.$transaction([
    prisma.bonusRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approvedPoints: points,
        reviewedAt: now,
        reviewedByUserId: session.userId,
      },
    }),
    prisma.user.update({
      where: { id: request.childUserId },
      data: {
        xp: { increment: xp },
        gameCurrencyBalance: { increment: scrap },
        allowanceBalanceCents: { increment: allowanceCents },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: session.userId,
        targetType: 'BonusRequest',
        targetId: id,
        action: 'bonus_approve',
        metadataJson: { approvedPoints: points, childUserId: request.childUserId },
      },
    }),
  ])

  await applyLevelUp(request.childUserId)
  await checkAndUnlockChapters(request.childUserId)

  return NextResponse.json(updated)
}
