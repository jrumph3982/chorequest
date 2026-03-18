import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { finalizeWeekSchema } from '@/lib/validation/bonus'
import { finalizeWeek } from '@/lib/weekly/finalize'

export async function POST(req: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  const body = await req.json()
  const parsed = finalizeWeekSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { childUserId, weekStart } = parsed.data

  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: childUserId } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Child not in household' }, { status: 403 })
  }

  // Parse weekStart safely — use noon local time to avoid UTC/TZ boundary issues
  const [y, m, d] = weekStart.split('-').map(Number)
  const weekStartDate = new Date(y, m - 1, d, 12, 0, 0)

  const result = await finalizeWeek(childUserId, weekStartDate, session.userId)

  const status = result.alreadyFinalized ? 200 : 201
  return NextResponse.json(result, { status })
}
