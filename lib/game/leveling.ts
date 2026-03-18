import { prisma } from '@/lib/db'

/**
 * Total XP required to *reach* each level (indexed by level number).
 * Index 0 is unused. Level 1 always starts at 0 XP.
 *
 * With XP_PER_POINT=5 and ~15 pts/day, a child earns ~75 XP/day:
 *   Level 2 ≈ 1 week   Level 3 ≈ 3 weeks   Level 4 ≈ 6 weeks
 */
const XP_THRESHOLDS = [
  0,      // [0] unused
  0,      // [1] level 1
  500,    // [2] level 2
  1500,   // [3] level 3
  3000,   // [4] level 4
  5000,   // [5] level 5
  7500,   // [6] level 6
  10500,  // [7] level 7
  14000,  // [8] level 8
  18000,  // [9] level 9
  22500,  // [10] level 10
]

export const MAX_LEVEL = XP_THRESHOLDS.length - 1 // 10

/** Returns the level a player should be at for the given total XP. */
export function xpToLevel(totalXp: number): number {
  let level = 1
  for (let l = 1; l <= MAX_LEVEL; l++) {
    if (totalXp >= XP_THRESHOLDS[l]) level = l
    else break
  }
  return level
}

/** Total XP required to reach the given level (from 0). */
export function xpForLevel(level: number): number {
  const clamped = Math.min(Math.max(level, 1), MAX_LEVEL)
  return XP_THRESHOLDS[clamped]
}

/** Progress data for rendering an XP progress bar. */
export function xpProgressInLevel(totalXp: number): {
  level: number
  xpIntoLevel: number   // XP earned since entering current level
  xpNeeded: number      // total XP span of this level
  progress: number      // 0–1
  isMaxLevel: boolean
} {
  const level = xpToLevel(totalXp)
  const isMaxLevel = level >= MAX_LEVEL
  const currentFloor = xpForLevel(level)
  const nextFloor = isMaxLevel ? currentFloor : xpForLevel(level + 1)
  const xpIntoLevel = totalXp - currentFloor
  const xpNeeded = isMaxLevel ? 1 : nextFloor - currentFloor
  const progress = isMaxLevel ? 1 : xpIntoLevel / xpNeeded
  return { level, xpIntoLevel, xpNeeded, progress, isMaxLevel }
}

/**
 * After awarding XP, check whether the child levelled up and persist it.
 * Returns true if a level-up occurred.
 */
export async function applyLevelUp(childUserId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: childUserId },
    select: { xp: true, level: true },
  })
  if (!user) return false

  const newLevel = xpToLevel(user.xp)
  if (newLevel <= user.level) return false

  await prisma.user.update({
    where: { id: childUserId },
    data: { level: newLevel },
  })
  return true
}
