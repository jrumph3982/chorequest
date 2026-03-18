import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { calcRewards } from '@/lib/chores/rewards'
import { getOrCreateSettings } from '@/lib/game/settings'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const { id } = await params

  const instance = await prisma.choreInstance.findFirst({
    where: {
      id,
      status: 'approved',
      child: { householdMembers: { some: { householdId } } },
    },
    select: { id: true, childUserId: true, pointsAwarded: true, reviewedAt: true },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Not found or not approved' }, { status: 404 })
  }

  // Only allow undo for today's approvals
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  if (!instance.reviewedAt || instance.reviewedAt < todayStart) {
    return NextResponse.json({ error: 'Can only undo approvals from today' }, { status: 400 })
  }

  const pointsAwarded = instance.pointsAwarded ?? 0
  const settings = await getOrCreateSettings(householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar
  const { xp, scrap, allowanceCents } = calcRewards(pointsAwarded, { allowancePointsPerDollar })

  await prisma.$transaction([
    prisma.choreInstance.update({
      where: { id },
      data: {
        status: 'submitted_complete',
        pointsAwarded: null,
        reviewedAt: null,
        reviewedByUserId: null,
      },
    }),
    prisma.user.update({
      where: { id: instance.childUserId },
      data: {
        xp:                   { decrement: xp },
        gameCurrencyBalance:  { decrement: scrap },
        allowanceBalanceCents: { decrement: allowanceCents },
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
