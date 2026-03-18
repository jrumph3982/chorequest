import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
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
  if (payout.status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 409 })

  const body = await request.json()
  const { paymentMethod, parentNote } = body

  const updated = await prisma.$transaction(async (tx) => {
    const up = await tx.allowancePayout.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paidByUserId: guard.session.userId,
        paymentMethod: paymentMethod ?? null,
        parentNote: parentNote ?? null,
      },
    })
    // Reduce child's allowance balance (recorded as paid out)
    await tx.user.update({
      where: { id: payout.childId },
      data: { allowanceBalanceCents: { decrement: Math.max(0, payout.amountCents) } },
    })
    return up
  })

  return NextResponse.json(updated)
}
