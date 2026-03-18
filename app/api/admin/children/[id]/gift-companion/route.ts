import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({ companionId: z.string().min(1) })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const { id: childId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 422 })

  // Verify child belongs to this household
  const child = await prisma.user.findFirst({
    where: {
      id: childId,
      role: 'child',
      householdMembers: { some: { householdId: guard.householdId } },
    },
  })
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const companion = await prisma.companion.findUnique({ where: { id: parsed.data.companionId } })
  if (!companion) return NextResponse.json({ error: 'Companion not found' }, { status: 404 })

  // Upsert — idempotent gift
  const uc = await prisma.userCompanion.upsert({
    where: { childUserId_companionId: { childUserId: childId, companionId: companion.id } },
    create: {
      childUserId: childId,
      companionId: companion.id,
      householdId: guard.householdId ?? undefined,
    },
    update: {},
  })

  return NextResponse.json({ userCompanionId: uc.id, companionName: companion.name })
}
