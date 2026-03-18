import { prisma } from '@/lib/db'
import { getWeekBounds } from '@/lib/chores/instances'

/**
 * Generates a weekly head-to-head challenge between the first two children in a household.
 * Only runs on Mondays and only if no challenge exists for the current week.
 */
export async function generateWeeklyChallenges(householdId: string) {
  const today = new Date()
  // Only generate on Monday (day 1)
  if (today.getDay() !== 1) return null

  const { start, end } = getWeekBounds(today)

  // Check if we already have a challenge this week
  const existing = await prisma.challenge.findFirst({
    where: {
      householdId,
      type: 'head_to_head',
      startDate: { gte: start },
    },
  })
  if (existing) return existing

  // Get all children in household
  const children = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: { some: { householdId } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  if (children.length < 2) return null

  const [c1, c2] = children

  const challenge = await prisma.challenge.create({
    data: {
      householdId,
      type: 'head_to_head',
      status: 'active',
      title: `${c1.name} vs ${c2.name} — Points Battle!`,
      description: 'Who earns the most points this week? Winner gets bonus XP!',
      startDate: start,
      endDate: end,
      targetMetric: 'points',
      targetValue: 0,
      createdBy: 'system',
      participants: {
        create: [{ childId: c1.id }, { childId: c2.id }],
      },
      rewards: {
        create: [
          { rewardType: 'xp',     rewardAmount: 200, recipientType: 'winner' },
          { rewardType: 'scraps', rewardAmount: 10,  recipientType: 'winner' },
          { rewardType: 'xp',     rewardAmount: 50,  recipientType: 'all_participants' },
        ],
      },
    },
    include: {
      participants: true,
      rewards: true,
    },
  })

  return challenge
}

/**
 * Updates challenge progress for a child when they earn points.
 */
export async function updateChallengeProgress(
  childId: string,
  householdId: string,
  points: number,
) {
  const now = new Date()
  const activeChallenges = await prisma.challenge.findMany({
    where: {
      householdId,
      status: 'active',
      endDate: { gte: now },
      participants: { some: { childId } },
    },
    include: { participants: true },
  })

  for (const challenge of activeChallenges) {
    const participant = challenge.participants.find((p) => p.childId === childId)
    if (!participant) continue

    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: { progress: { increment: points } },
    })
  }
}

/**
 * Finalizes expired challenges: determine winner, award rewards.
 */
export async function finalizeExpiredChallenges(householdId: string) {
  const now = new Date()
  const expired = await prisma.challenge.findMany({
    where: { householdId, status: 'active', endDate: { lt: now } },
    include: {
      participants: { orderBy: { progress: 'desc' } },
      rewards: true,
    },
  })

  for (const challenge of expired) {
    if (challenge.participants.length === 0) continue

    const winner = challenge.participants[0] // highest progress
    const winnerId = winner.progress > 0 ? winner.childId : null

    // Award winner rewards
    if (winnerId) {
      const winnerRewards = challenge.rewards.filter((r) => r.recipientType === 'winner')
      for (const reward of winnerRewards) {
        if (reward.rewardType === 'xp') {
          await prisma.user.update({
            where: { id: winnerId },
            data: { xp: { increment: reward.rewardAmount } },
          })
        } else if (reward.rewardType === 'scraps') {
          await prisma.user.update({
            where: { id: winnerId },
            data: { gameCurrencyBalance: { increment: reward.rewardAmount } },
          })
        }
      }
    }

    // Award participation rewards to all
    const allRewards = challenge.rewards.filter((r) => r.recipientType === 'all_participants')
    for (const participant of challenge.participants) {
      for (const reward of allRewards) {
        if (reward.rewardType === 'xp') {
          await prisma.user.update({
            where: { id: participant.childId },
            data: { xp: { increment: reward.rewardAmount } },
          })
        }
      }
    }

    // Mark as completed
    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { status: 'completed', winnerId },
    })
  }
}

/**
 * Gets active challenges for a child with participant progress.
 */
export async function getActiveChallengesForChild(childId: string, householdId: string) {
  const now = new Date()
  return prisma.challenge.findMany({
    where: {
      householdId,
      status: 'active',
      endDate: { gte: now },
      participants: { some: { childId } },
    },
    include: {
      participants: {
        include: {
          child: { select: { id: true, name: true } },
        },
        orderBy: { progress: 'desc' },
      },
      rewards: true,
    },
    orderBy: { endDate: 'asc' },
  })
}
