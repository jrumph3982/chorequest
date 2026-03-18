import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { syncPayoutsFromRecords, getPendingPayouts, getRecentPayouts } from '@/lib/allowance/payouts'

export async function GET() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: guard.session.userId } } },
    select: { id: true },
  })
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  // Sync first
  await syncPayoutsFromRecords(household.id)

  const [pending, recent] = await Promise.all([
    getPendingPayouts(household.id),
    getRecentPayouts(household.id),
  ])

  const totalOwedCents = pending.reduce((s, p) => s + p.amountCents, 0)

  return NextResponse.json({ pending, recent, totalOwedCents })
}

export async function POST(request: Request) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: guard.session.userId } } },
    select: { id: true },
  })
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  const body = await request.json()
  const { childId, amountCents, periodStart, periodEnd } = body

  if (!childId || !amountCents || !periodStart || !periodEnd) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const payout = await prisma.allowancePayout.create({
    data: {
      householdId: household.id,
      childId,
      amountCents: Math.round(amountCents),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      status: 'pending',
    },
  })

  return NextResponse.json(payout)
}
