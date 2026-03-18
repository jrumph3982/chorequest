import { prisma } from '@/lib/db'
import { StoryProgressStatus } from '@prisma/client'

interface UnlockRules {
  minLevel: number
  minApprovedChores: number
}

interface RewardJson {
  scrap?: number
}

/**
 * Check every story chapter for this child and unlock any that now meet
 * their requirements (minLevel + minApprovedChores).
 * Awards scrap rewards for newly unlocked chapters.
 * Safe to call repeatedly — already-unlocked chapters are skipped.
 */
export async function checkAndUnlockChapters(childUserId: string): Promise<void> {
  const [user, approvedCount, chapters] = await Promise.all([
    prisma.user.findUnique({ where: { id: childUserId }, select: { level: true } }),
    prisma.choreInstance.count({ where: { childUserId, status: 'approved' } }),
    prisma.storyChapter.findMany({
      orderBy: { chapterNumber: 'asc' },
      include: {
        progress: {
          where: { childUserId },
          take: 1,
        },
      },
    }),
  ])

  if (!user) return

  // Collect chapters that should be newly unlocked
  const toUnlock: Array<{ progressId: string; scrapReward: number }> = []

  for (const chapter of chapters) {
    const progress = chapter.progress[0]
    // Only process locked entries (skip missing, unlocked, or completed)
    if (!progress || progress.status !== StoryProgressStatus.locked) continue

    const rules = chapter.unlockRulesJson as unknown as UnlockRules
    if (user.level >= rules.minLevel && approvedCount >= rules.minApprovedChores) {
      const scrapReward = (chapter.rewardJson as unknown as RewardJson | null)?.scrap ?? 0
      toUnlock.push({ progressId: progress.id, scrapReward })
    }
  }

  if (toUnlock.length === 0) return

  const totalScrap = toUnlock.reduce((sum, u) => sum + u.scrapReward, 0)

  await prisma.$transaction(async (tx) => {
    for (const { progressId } of toUnlock) {
      await tx.userStoryProgress.update({
        where: { id: progressId },
        data: { status: StoryProgressStatus.unlocked },
      })
    }
    if (totalScrap > 0) {
      await tx.user.update({
        where: { id: childUserId },
        data: { gameCurrencyBalance: { increment: totalScrap } },
      })
    }
  })
}
