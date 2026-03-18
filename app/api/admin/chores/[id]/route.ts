import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { updateChoreSchema } from '@/lib/validation/chores'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const { id } = await params
  const body = await req.json()
  const parsed = updateChoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Accept chores that belong to this household OR legacy chores with null householdId
  const existing = await prisma.chore.findFirst({
    where: { id, OR: [{ householdId }, { householdId: null }] },
    select: { id: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { childUserIds, ...choreData } = parsed.data

  // ── Assignment update ────────────────────────────────────────────────────
  if (childUserIds !== undefined) {
    // Validate that every supplied child belongs to this household
    if (childUserIds.length > 0) {
      const members = await prisma.householdMember.findMany({
        where: { householdId, userId: { in: childUserIds } },
        select: { userId: true },
      })
      const validIds = new Set(members.map((m) => m.userId))
      const invalid  = childUserIds.find((cid) => !validIds.has(cid))
      if (invalid) {
        return NextResponse.json({ error: 'One or more children not in household' }, { status: 403 })
      }
    }

    // Diff against current active assignments to minimise disruption
    const currentAssignments = await prisma.choreAssignment.findMany({
      where: { choreId: id, active: true },
      select: { id: true, childUserId: true },
    })
    const currentIds = new Set(currentAssignments.map((a) => a.childUserId))
    const newIds     = new Set(childUserIds)

    const toDeactivate = currentAssignments.filter((a) => !newIds.has(a.childUserId))
    const toAdd        = childUserIds.filter((cid) => !currentIds.has(cid))

    await prisma.$transaction([
      // Soft-delete removed assignments (preserves ChoreInstance history)
      ...(toDeactivate.length > 0
        ? [prisma.choreAssignment.updateMany({
            where: { id: { in: toDeactivate.map((a) => a.id) } },
            data:  { active: false, endDate: new Date() },
          })]
        : []),
      // Create assignments for newly added children
      ...(toAdd.length > 0
        ? [prisma.choreAssignment.createMany({
            data: toAdd.map((childUserId) => ({
              choreId: id,
              childUserId,
              startDate:   new Date(),
              householdId,
            })),
          })]
        : []),
    ])
  }

  // Also stamp householdId so legacy chores get migrated on first edit
  const chore = await prisma.chore.update({ where: { id }, data: { ...choreData, householdId } })
  return NextResponse.json(chore)
}

// Toggles active/inactive — does not delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const { id } = await params
  const current = await prisma.chore.findFirst({
    where: { id, OR: [{ householdId }, { householdId: null }] },
    select: { active: true },
  })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const chore = await prisma.chore.update({
    where: { id },
    data: { active: !current.active },
  })
  return NextResponse.json(chore)
}
