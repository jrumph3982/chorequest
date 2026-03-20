import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdult } from '@/lib/auth/guards'
import { z } from 'zod'

const schema = z.object({
  enabled: z.boolean(),
})

export async function POST(req: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { enabled } = parsed.data
  const { householdId } = guard

  await prisma.household.update({
    where: { id: householdId },
    data: { globalLeaderboardEnabled: enabled },
  })

  return NextResponse.json({ enabled })
}
