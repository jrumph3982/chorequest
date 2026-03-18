import { NextResponse } from 'next/server'
import { requireChild } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { getActiveChallengesForChild } from '@/lib/game/challenges'

export async function GET() {
  const guard = await requireChild()
  if (!guard.ok) return guard.response

  const childId = guard.session.userId

  // Get child's household
  const membership = await prisma.householdMember.findFirst({
    where: { userId: childId },
    select: { householdId: true },
  })
  if (!membership) return NextResponse.json([])

  const challenges = await getActiveChallengesForChild(childId, membership.householdId)

  return NextResponse.json(
    challenges.map((c) => ({
      id: c.id,
      type: c.type,
      title: c.title,
      description: c.description,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      targetMetric: c.targetMetric,
      targetValue: c.targetValue,
      participants: c.participants.map((p) => ({
        id: p.id,
        childId: p.childId,
        childName: p.child.name,
        progress: p.progress,
        completed: p.completed,
        isMe: p.childId === childId,
      })),
      rewards: c.rewards,
    })),
  )
}
