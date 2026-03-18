import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { calcRewards } from '@/lib/chores/rewards'
import { getOrCreateSettings } from '@/lib/game/settings'

export async function POST() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Find all instances approved today in this household
  const todayApproved = await prisma.choreInstance.findMany({
    where: {
      status: 'approved',
      reviewedAt: { gte: todayStart },
      child: { householdMembers: { some: { householdId } } },
    },
    select: { id: true, childUserId: true, pointsAwarded: true },
  })

  if (todayApproved.length === 0) {
    return NextResponse.json({ ok: true, reset: 0 })
  }

  const settings = await getOrCreateSettings(householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar

  // Group reward reversals by child
  const reversals: Record<string, { xp: number; scrap: number; allowanceCents: number }> = {}
  for (const inst of todayApproved) {
    const points = inst.pointsAwarded ?? 0
    const { xp, scrap, allowanceCents } = calcRewards(points, { allowancePointsPerDollar })
    const r = reversals[inst.childUserId] ?? { xp: 0, scrap: 0, allowanceCents: 0 }
    r.xp += xp
    r.scrap += scrap
    r.allowanceCents += allowanceCents
    reversals[inst.childUserId] = r
  }

  await prisma.$transaction([
    // Reset all approved instances back to submitted_complete
    prisma.choreInstance.updateMany({
      where: { id: { in: todayApproved.map((i) => i.id) } },
      data: { status: 'submitted_complete', pointsAwarded: null, reviewedAt: null, reviewedByUserId: null },
    }),
    // Reverse rewards for each child
    ...Object.entries(reversals).map(([childId, r]) =>
      prisma.user.update({
        where: { id: childId },
        data: {
          xp:                    { decrement: r.xp },
          gameCurrencyBalance:   { decrement: r.scrap },
          allowanceBalanceCents: { decrement: r.allowanceCents },
        },
      })
    ),
  ])

  return NextResponse.json({ ok: true, reset: todayApproved.length })
}
