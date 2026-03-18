import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { calcRewards } from '@/lib/chores/rewards'
import { getOrCreateSettings } from '@/lib/game/settings'

const adjustSchema = z.object({
  pointsAwarded: z.number().int().min(1).max(10000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId, session } = guard

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = adjustSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const instance = await prisma.choreInstance.findFirst({
    where: {
      id,
      status: 'approved',
      child: { householdMembers: { some: { householdId } } },
    },
    include: { assignment: { include: { chore: { select: { basePoints: true } } } } },
  })

  if (!instance) {
    return NextResponse.json({ error: 'Not found or not approved' }, { status: 404 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  if (!instance.reviewedAt || instance.reviewedAt < todayStart) {
    return NextResponse.json({ error: 'Can only edit approvals from today' }, { status: 400 })
  }

  const oldPoints = instance.pointsAwarded ?? instance.assignment.chore.basePoints
  const newPoints = parsed.data.pointsAwarded
  if (oldPoints === newPoints) {
    return NextResponse.json({ ok: true })
  }

  const settings = await getOrCreateSettings(householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar

  const oldRewards = calcRewards(oldPoints, { allowancePointsPerDollar })
  const newRewards = calcRewards(newPoints, { allowancePointsPerDollar })

  const deltaXp = newRewards.xp - oldRewards.xp
  const deltaScrap = newRewards.scrap - oldRewards.scrap
  const deltaAllowance = newRewards.allowanceCents - oldRewards.allowanceCents

  await prisma.$transaction([
    prisma.choreInstance.update({
      where: { id },
      data: {
        pointsAwarded: newPoints,
        reviewedAt: new Date(),
        reviewedByUserId: session.userId,
      },
    }),
    prisma.user.update({
      where: { id: instance.childUserId },
      data: {
        xp: { increment: deltaXp },
        gameCurrencyBalance: { increment: deltaScrap },
        allowanceBalanceCents: { increment: deltaAllowance },
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
