import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { updateChildSchema } from '@/lib/validation/children'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const { id } = await params

  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: id } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = updateChildSchema.safeParse(body)
  if (!result.success) {
    const errors = Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { name, avatarUrl, gender, hairStyle, hairColor, skinTone, eyeColor } = result.data

  const userData = {
    ...(name !== undefined && { name }),
    ...(avatarUrl !== undefined && { avatarUrl }),
  }

  const profileData = {
    ...(gender !== undefined && { gender }),
    ...(hairStyle !== undefined && { hairStyle }),
    ...(hairColor !== undefined && { hairColor }),
    ...(skinTone !== undefined && { skinTone }),
    ...(eyeColor !== undefined && { eyeColor }),
  }

  const ops = []
  if (Object.keys(userData).length > 0) {
    ops.push(prisma.user.update({ where: { id }, data: userData }))
  }
  if (Object.keys(profileData).length > 0) {
    ops.push(prisma.childProfile.update({ where: { userId: id }, data: profileData }))
  }
  if (ops.length > 0) {
    await prisma.$transaction(ops)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const { id } = await params

  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: id } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete related data in dependency order
  await prisma.$transaction([
    prisma.userInventory.deleteMany({ where: { childUserId: id } }),
    prisma.userCompanion.deleteMany({ where: { childUserId: id } }),
    prisma.userAchievement.deleteMany({ where: { childUserId: id } }),
    prisma.userStoryProgress.deleteMany({ where: { childUserId: id } }),
    prisma.allowanceRecord.deleteMany({ where: { childUserId: id } }),
    prisma.weeklyLedger.deleteMany({ where: { childUserId: id } }),
    prisma.bonusRequest.deleteMany({ where: { childUserId: id } }),
    prisma.choreInstance.deleteMany({ where: { childUserId: id } }),
    prisma.choreAssignment.deleteMany({ where: { childUserId: id } }),
    prisma.dailyBaseDamage.deleteMany({ where: { childUserId: id } }),
    prisma.baseState.deleteMany({ where: { childUserId: id } }),
    prisma.childProfile.deleteMany({ where: { userId: id } }),
    prisma.householdMember.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
