import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getWeekBounds } from '@/lib/chores/instances'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { start: weekStart, end: weekEnd } = getWeekBounds(new Date())

    // Get all children from opted-in households
    const children = await prisma.user.findMany({
      where: {
        role: 'child',
        householdMembers: {
          some: {
            household: {
              globalLeaderboardEnabled: true,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        level: true,
        childProfile: {
          select: {
            streakCount: true,
            gender: true,
            skinTone: true,
            hairStyle: true,
            hairColor: true,
            eyeColor: true,
            eyeStyle: true,
            freckles: true,
            jacketColor: true,
            pantsColor: true,
            goggleColor: true,
            sigItem: true,
          },
        },
        _count: {
          select: {
            userAchievements: true,
          },
        },
      },
    })

    // Count weekly approved chores for each child
    const weeklyChoresCounts = await prisma.choreInstance.groupBy({
      by: ['childUserId'],
      where: {
        childUserId: { in: children.map((c) => c.id) },
        status: 'approved',
        dueDate: { gte: weekStart, lte: weekEnd },
      },
      _count: { id: true },
    })

    const choreCountMap = new Map(
      weeklyChoresCounts.map((r) => [r.childUserId, r._count.id])
    )

    // Build entries
    const entries = children
      .map((child) => ({
        childId: child.id,
        name: child.name,
        level: child.level,
        weeklyChores: choreCountMap.get(child.id) ?? 0,
        streak: child.childProfile?.streakCount ?? 0,
        achievementCount: child._count.userAchievements,
        gender: child.childProfile?.gender ?? null,
        skinTone: child.childProfile?.skinTone ?? null,
        hairStyle: child.childProfile?.hairStyle ?? null,
        hairColor: child.childProfile?.hairColor ?? null,
        eyeColor: child.childProfile?.eyeColor ?? null,
        eyeStyle: child.childProfile?.eyeStyle ?? null,
        freckles: child.childProfile?.freckles ?? false,
        jacketColor: child.childProfile?.jacketColor ?? null,
        pantsColor: child.childProfile?.pantsColor ?? null,
        goggleColor: child.childProfile?.goggleColor ?? null,
        sigItem: child.childProfile?.sigItem ?? null,
      }))
      .sort((a, b) => {
        if (b.weeklyChores !== a.weeklyChores) return b.weeklyChores - a.weeklyChores
        if (b.streak !== a.streak) return b.streak - a.streak
        return b.achievementCount - a.achievementCount
      })
      .slice(0, 50)
      .map((entry, i) => ({ rank: i + 1, ...entry }))

    return NextResponse.json({
      entries,
      updatedAt: new Date().toISOString(),
      totalParticipants: children.length,
    })
  } catch (err) {
    console.error('[global-leaderboard] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
