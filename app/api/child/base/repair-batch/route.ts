import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { repairComponent, REPAIR_TIERS, type BaseComponent, type RepairTier } from '@/lib/game/base'

const repairSchema = z.object({
  repairs: z
    .array(
      z.object({
        component: z.enum(['door', 'barricade', 'fence', 'light', 'watchtower', 'turret']),
        tier: z.enum(['light', 'heavy']),
      })
    )
    .min(1, 'At least one repair required')
    .max(10, 'Too many repairs in one batch'),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = repairSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { repairs } = parsed.data

  // Compute total scrap cost upfront
  const totalCost = repairs.reduce((sum, r) => sum + REPAIR_TIERS[r.tier as RepairTier].scrapCost, 0)

  // Fetch current balance
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { gameCurrencyBalance: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.gameCurrencyBalance < totalCost) {
    return NextResponse.json(
      {
        error: 'Insufficient scrap',
        required: totalCost,
        balance: user.gameCurrencyBalance,
      },
      { status: 400 }
    )
  }

  // Apply repairs sequentially — repairComponent is already transactional
  let updatedBase = null
  for (const r of repairs) {
    try {
      updatedBase = await repairComponent(session.userId, r.component as BaseComponent, r.tier as RepairTier)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Repair failed'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  // Fetch final state for response
  const finalBase = await prisma.baseState.findUnique({ where: { childUserId: session.userId } })
  const finalUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { gameCurrencyBalance: true },
  })

  return NextResponse.json({
    success: true,
    baseState: finalBase ?? updatedBase,
    gameCurrencyBalance: finalUser?.gameCurrencyBalance ?? 0,
  })
}
