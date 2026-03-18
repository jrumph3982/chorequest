import { NextResponse } from 'next/server'
import { requireChild } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function GET() {
  const guard = await requireChild()
  if (!guard.ok) return guard.response

  const unnotified = await prisma.userAchievement.findMany({
    where: { childUserId: guard.session.userId, notified: false },
    include: {
      achievement: {
        select: {
          slug: true,
          name: true,
          description: true,
          icon: true,
          rarity: true,
          xpReward: true,
          scrapsReward: true,
          rewardType: true,
        },
      },
    },
    orderBy: { earnedAt: 'asc' },
  })

  if (unnotified.length > 0) {
    // Mark as notified
    await prisma.userAchievement.updateMany({
      where: {
        childUserId: guard.session.userId,
        notified: false,
      },
      data: { notified: true },
    })
  }

  return NextResponse.json(unnotified.map((ua) => ({
    id: ua.id,
    earnedAt: ua.earnedAt.toISOString(),
    achievement: ua.achievement,
  })))
}
