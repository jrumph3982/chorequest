import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { reviewInstanceSchema } from '@/lib/validation/chores'

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
    return NextResponse.json({ error: 'Chore is not pending review' }, { status: 404 })
  }

  // Reset to available so the child can resubmit; keep reviewedAt + notes as
  // rejection audit trail and "REDO" indicator for the child dashboard.
  const updated = await prisma.choreInstance.update({
    where: { id },
    data: {
      status: 'available',
      reviewedAt: new Date(),
      reviewedByUserId: session.userId,
      notes: parsed.data.notes ?? null,
      submittedAt: null,
      proofImageUrl: null,
    },
  })

  return NextResponse.json(updated)
}
