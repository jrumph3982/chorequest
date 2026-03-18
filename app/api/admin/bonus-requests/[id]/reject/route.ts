import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { reviewBonusRequestSchema } from '@/lib/validation/bonus'

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

  const request = await prisma.bonusRequest.findUnique({
    where: { id, status: 'pending', householdId },
  })
  if (!request) {
    return NextResponse.json(
      { error: 'Request not found or already reviewed' },
      { status: 404 },
    )
  }

  const updated = await prisma.bonusRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedByUserId: session.userId,
    },
  })

  return NextResponse.json(updated)
}
