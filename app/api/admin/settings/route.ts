import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { getOrCreateSettings } from '@/lib/game/settings'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'

const survivalSettingsSchema = z.object({
  nightAttacksEnabled:     z.boolean().optional(),
  minimumDailyPoints:      z.number().int().min(0).max(10000).optional(),
  requiredCriticalChores:  z.number().int().min(0).max(50).optional(),
  difficulty:              z.enum(['easy', 'normal', 'hard']).optional(),
  gearBonusesEnabled:      z.boolean().optional(),
  companionBonusesEnabled: z.boolean().optional(),
  eventsEnabled:           z.boolean().optional(),
  xpMultiplier:            z.number().min(0.5).max(3).optional(),
  coinMultiplier:          z.number().min(0.5).max(3).optional(),
  nightRaidFrequency:      z.enum(['daily', 'weekly', 'custom']).optional(),
  rewardDropRate:              z.enum(['low', 'normal', 'high']).optional(),
  allowancePointsPerDollar:        z.number().int().min(1).max(10000).optional(),
  weeklyAllowanceCap:              z.number().int().min(0).nullable().optional(),
  startingAllowanceBalanceCents:   z.number().int().min(0).max(100000).optional(),
})

export async function GET() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const settings = await getOrCreateSettings(householdId)
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = survivalSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const settings = await getOrCreateSettings(householdId)

  const updated = await prisma.survivalSettings.update({
    where: { id: settings.id },
    data: parsed.data,
  })

  await logSecurityEvent({
    eventType:   SECURITY_EVENT.SETTINGS_CHANGED,
    householdId,
    actorUserId: session.userId,
    // Log field names and new values — these are game settings, no secrets
    metadata:    { changes: parsed.data },
  })

  return NextResponse.json(updated)
}
