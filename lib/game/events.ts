import { prisma } from '@/lib/db'
import type { ZombieThreat } from '@/lib/game/base'

export const EVENT_ICON: Record<string, string> = {
  zombie_swarm: '🧟',
  alien_invasion: '👽',
  winter_storm: '❄️',
  robot_uprising: '🤖',
}

export const EVENT_COLOR: Record<string, string> = {
  zombie_swarm: 'border-red-900 bg-red-950 text-red-300',
  alien_invasion: 'border-purple-900 bg-purple-950 text-purple-300',
  winter_storm: 'border-blue-900 bg-blue-950 text-blue-300',
  robot_uprising: 'border-orange-900 bg-orange-950 text-orange-300',
}

const THREAT_ORDER: ZombieThreat[] = ['none', 'low', 'moderate', 'high', 'critical']

/** Returns events whose date range includes now AND are enabled by the parent. */
export async function getActiveEvents() {
  const now = new Date()
  return prisma.gameEvent.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  })
}

/** Bumps base threat up by the sum of active event difficultyModifiers (capped at critical). */
export function applyEventThreatBump(
  base: ZombieThreat,
  events: { difficultyModifier: number }[],
): ZombieThreat {
  const total = events.reduce((sum, e) => sum + e.difficultyModifier, 0)
  const idx = THREAT_ORDER.indexOf(base)
  return THREAT_ORDER[Math.min(idx + total, 4)]
}

/**
 * Winter storm reduces visibility: halves the gear bonus contribution to survival score.
 * Returns the amount to subtract.
 */
export function calcStormVisibilityPenalty(
  gearBonus: number,
  events: { type: string }[],
): number {
  return events.some((e) => e.type === 'winter_storm') ? Math.round(gearBonus * 0.5) : 0
}
