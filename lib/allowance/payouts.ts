import { prisma } from '@/lib/db'

/**
 * Syncs AllowanceRecords → AllowancePayout rows.
 * Creates a pending payout for any approved week that has earned money but no payout yet.
 */
export async function syncPayoutsFromRecords(householdId: string): Promise<number> {
  const unpaidRecords = await prisma.allowanceRecord.findMany({
    where: { householdId, paid: false, moneyEarned: { gt: 0 } },
  })

  let created = 0
  for (const record of unpaidRecords) {
    const existing = await prisma.allowancePayout.findFirst({
      where: {
        childId: record.childUserId,
        periodStart: record.weekStart,
      },
    })
    if (!existing) {
      await prisma.allowancePayout.create({
        data: {
          householdId: householdId,
          childId: record.childUserId,
          amountCents: record.moneyEarned,
          periodStart: record.weekStart,
          periodEnd: record.weekEnd,
          status: 'pending',
        },
      })
      created++
    }
  }
  return created
}

/** Returns pending payouts grouped by child for a household. */
export async function getPendingPayouts(householdId: string) {
  return prisma.allowancePayout.findMany({
    where: { householdId, status: 'pending' },
    include: {
      child: { select: { id: true, name: true, allowanceBalanceCents: true } },
      paidBy: { select: { name: true } },
    },
    orderBy: [{ childId: 'asc' }, { periodStart: 'desc' }],
  })
}

/** Returns recent payout history (last 30 days) for a household. */
export async function getRecentPayouts(householdId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return prisma.allowancePayout.findMany({
    where: { householdId, status: 'paid', paidAt: { gte: thirtyDaysAgo } },
    include: {
      child: { select: { id: true, name: true } },
      paidBy: { select: { name: true } },
    },
    orderBy: { paidAt: 'desc' },
  })
}
