import { prisma } from '@/lib/db'

interface AwardedAchievement {
  slug: string
  name: string
  icon: string | null
  rarity: string
  xpReward: number
  scrapsReward: number
  description: string
}

/**
 * Checks achievements relevant to the given triggerType and awards any newly unlocked ones.
 * Awards XP and scraps for new achievements.
 * Returns newly earned achievements with their details.
 *
 * @param childUserId  The child to check
 * @param triggerType  One of: 'chore_approved' | 'streak' | 'raid_complete' | 'allowance_received' | 'week_end'
 * @param data         Context data for the trigger (e.g. { count: 5, streak: 3 })
 */
export async function checkAndAwardAchievements(
  childUserId: string,
  triggerType: string = 'chore_approved',
  data: Record<string, number> = {},
): Promise<AwardedAchievement[]> {
  // Fetch all achievements for the given trigger type plus the earned set
  const [allAchievements, earned] = await Promise.all([
    prisma.achievement.findMany({
      where: { triggerType },
    }),
    prisma.userAchievement.findMany({
      where: { childUserId },
      select: { achievementId: true },
    }),
  ])

  const earnedIds = new Set(earned.map((e) => e.achievementId))
  const newlyEarned: AwardedAchievement[] = []

  // Get child profile/household for context data if not already provided
  const [childProfile, baseState, approvedTotal, nightCount, perfectNightCount] = await Promise.all([
    prisma.childProfile.findUnique({
      where: { userId: childUserId },
      select: { streakCount: true, householdId: true },
    }),
    prisma.baseState.findUnique({
      where: { childUserId },
      select: { survivalStreak: true },
    }),
    prisma.choreInstance.count({
      where: { childUserId, status: 'approved' },
    }),
    prisma.dailyBaseDamage.count({ where: { childUserId, attackResult: { not: 'quiet' } } }),
    prisma.dailyBaseDamage.count({
      where: {
        childUserId,
        attackResult: 'defended',
        doorDamage: 0,
        barricadeDamage: 0,
        fenceDamage: 0,
        lightDamage: 0,
      },
    }),
  ])

  const contextData = {
    choresTotalApproved: approvedTotal,
    currentStreak: data.streak ?? childProfile?.streakCount ?? 0,
    survivalStreak: data.survivalStreak ?? baseState?.survivalStreak ?? 0,
    nightCount,
    perfectNightCount,
    weeklyAllowanceCents: data.weeklyAllowanceCents ?? 0,
    ...data,
  }

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue

    let unlocked = false
    const tv = achievement.triggerValue

    switch (achievement.triggerType) {
      case 'chore_approved':
        unlocked = contextData.choresTotalApproved >= tv
        break

      case 'streak':
        unlocked = contextData.currentStreak >= tv
        break

      case 'raid_complete':
        unlocked = nightCount >= tv
        break

      case 'allowance_received':
        // triggerValue in cents (e.g. 1000 = $10)
        unlocked = contextData.weeklyAllowanceCents >= tv
        break

      case 'week_end':
        // For perfect weeks: count via data.perfectWeeks if provided
        unlocked = (data.perfectWeeks ?? 0) >= tv
        break
    }

    // Special slug overrides for backward compat + unique logic
    if (achievement.slug === 'no_damage' || achievement.slug === 'perfect-defense') {
      unlocked = perfectNightCount > 0
    }
    if (achievement.slug === 'first-night-survived' || achievement.slug === 'first_raid') {
      unlocked = nightCount > 0
    }

    if (unlocked) {
      // Get child membership for household
      const membership = await prisma.householdMember.findFirst({
        where: { userId: childUserId },
        select: { householdId: true },
      })

      await prisma.userAchievement.create({
        data: {
          childUserId,
          achievementId: achievement.id,
          householdId: membership?.householdId ?? childProfile?.householdId ?? null,
          notified: false,
        },
      })

      // Award XP and scraps
      if (achievement.xpReward > 0 || achievement.scrapsReward > 0) {
        await prisma.user.update({
          where: { id: childUserId },
          data: {
            xp: { increment: achievement.xpReward },
            gameCurrencyBalance: { increment: achievement.scrapsReward },
          },
        })
      }

      newlyEarned.push({
        slug: achievement.slug,
        name: achievement.name,
        icon: achievement.icon,
        rarity: achievement.rarity,
        xpReward: achievement.xpReward,
        scrapsReward: achievement.scrapsReward,
        description: achievement.description,
      })
    }
  }

  return newlyEarned
}

/**
 * Legacy wrapper that matches the original signature.
 * Returns achievement names only.
 */
export async function checkAndAwardAchievementsLegacy(childUserId: string): Promise<string[]> {
  const earned = await checkAndAwardAchievements(childUserId, 'chore_approved')
  const raidEarned = await checkAndAwardAchievements(childUserId, 'raid_complete')
  const streakEarned = await checkAndAwardAchievements(childUserId, 'streak')
  return [...earned, ...raidEarned, ...streakEarned].map((a) => a.name)
}
