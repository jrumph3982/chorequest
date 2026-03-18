import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const { id } = await params

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: guard.session.userId } } },
    select: { id: true },
  })
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  const payout = await prisma.allowancePayout.findFirst({
    where: { id, householdId: household.id },
  })
  if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })

  const updated = await prisma.allowancePayout.update({
    where: { id },
    data: { status: 'held' },
  })

  return NextResponse.json(updated)
}
