import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { submitInstanceSchema } from '@/lib/validation/chores'
import { calcRewards } from '@/lib/chores/rewards'
import { applyLevelUp } from '@/lib/game/leveling'
import { checkAndUnlockChapters } from '@/lib/game/story'
import { getOrCreateSettings } from '@/lib/game/settings'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = submitInstanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const instance = await prisma.choreInstance.findFirst({
    where: { id, childUserId: session.userId },
    include: {
      assignment: {
        include: { chore: { select: { basePoints: true, requiresApproval: true } } },
      },
    },
  })
  if (!instance) {
    return NextResponse.json(
      { error: 'Instance not found or not available' },
      { status: 404 },
    )
  }
  if (instance.status !== 'available' && instance.status !== 'rejected') {
    return NextResponse.json(
      { error: 'Instance not available for submission' },
      { status: 409 },
    )
  }

  const now = new Date()

  // Auto-approve if no adult review needed
  if (!instance.assignment.chore.requiresApproval) {
    const points = instance.assignment.chore.basePoints
    const settings = await getOrCreateSettings(session.householdId)
    const { xp, scrap, allowanceCents } = calcRewards(points, {
      allowancePointsPerDollar: settings.allowancePointsPerDollar,
    })

    const [updated] = await prisma.$transaction([
      prisma.choreInstance.update({
        where: { id },
        data: {
          status: 'approved',
          submittedAt: now,
          reviewedAt: now,
          pointsAwarded: points,
          notes: parsed.data.notes,
          proofImageUrl: parsed.data.proofImageUrl,
        },
      }),
      prisma.user.update({
        where: { id: session.userId },
        data: {
          xp: { increment: xp },
          gameCurrencyBalance: { increment: scrap },
          allowanceBalanceCents: { increment: allowanceCents },
        },
      }),
    ])
    await applyLevelUp(session.userId)
    await checkAndUnlockChapters(session.userId)
    return NextResponse.json(updated)
  }

  // Requires approval — mark as submitted
  const updated = await prisma.choreInstance.update({
    where: { id },
    data: {
      status: 'submitted_complete',
      submittedAt: now,
      notes: parsed.data.notes,
      proofImageUrl: parsed.data.proofImageUrl,
    },
  })

  return NextResponse.json(updated)
}
