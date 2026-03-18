import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { assignChoreSchema } from '@/lib/validation/chores'

export async function POST(req: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const body = await req.json()
  const parsed = assignChoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { choreId, childUserId } = parsed.data

  const [chore, member] = await Promise.all([
    prisma.chore.findUnique({ where: { id: choreId, householdId }, select: { id: true } }),
    prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId: childUserId } },
    }),
  ])
  if (!chore || !member) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const existing = await prisma.choreAssignment.findFirst({
    where: { choreId, childUserId, active: true },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already assigned' }, { status: 409 })
  }

  const assignment = await prisma.choreAssignment.create({
    data: { choreId, childUserId, startDate: new Date(), householdId },
  })

  return NextResponse.json(assignment, { status: 201 })
}
