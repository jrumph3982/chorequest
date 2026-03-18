export function calcRewards(
  points: number,
  overrides?: {
    xpPerPoint?: number
    scrapPerPoint?: number
    allowancePointsPerDollar?: number
  },
): {
  xp: number
  scrap: number
  allowanceCents: number
} {
  const xpPerPoint = overrides?.xpPerPoint ?? Number(process.env.XP_PER_POINT ?? 5)
  const scrapPerPoint = overrides?.scrapPerPoint ?? Number(process.env.GAME_CURRENCY_PER_POINT ?? 2)
  const allowancePointsPerDollar =
    overrides?.allowancePointsPerDollar ?? Number(process.env.ALLOWANCE_POINTS_PER_DOLLAR ?? 100)

  return {
    xp: points * xpPerPoint,
    scrap: points * scrapPerPoint,
    allowanceCents: Math.floor((points / allowancePointsPerDollar) * 100),
  }
}
