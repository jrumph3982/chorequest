import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { createChoreSchema } from '@/lib/validation/chores'

export async function GET() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const chores = await prisma.chore.findMany({
    where: { householdId },
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    include: {
      assignments: {
        where: { active: true },
        include: { child: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json(chores)
}

export async function POST(req: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  const body   = await req.json()
  const parsed = createChoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { childUserIds, ...choreData } = parsed.data

  const chore = await prisma.chore.create({
    data: { ...choreData, createdByUserId: session.userId, householdId },
  })

  if (childUserIds && childUserIds.length > 0) {
    // Validate every child belongs to this household
    const members = await prisma.householdMember.findMany({
      where: {
        householdId,
        userId: { in: childUserIds },
      },
      select: { userId: true },
    })

    const validIds = new Set(members.map((m) => m.userId))
    const invalid  = childUserIds.find((id) => !validIds.has(id))
    if (invalid) {
      // Roll back the chore we just created
      await prisma.chore.delete({ where: { id: chore.id } })
      return NextResponse.json({ error: 'One or more children not in household' }, { status: 403 })
    }

    await prisma.choreAssignment.createMany({
      data: childUserIds.map((childUserId) => ({
        choreId:    chore.id,
        childUserId,
        startDate:  new Date(),
        householdId,
      })),
    })
  }

  return NextResponse.json(chore, { status: 201 })
}
