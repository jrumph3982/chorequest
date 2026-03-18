import { NextResponse } from 'next/server'
import { requireChild } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function GET() {
  const guard = await requireChild()
  if (!guard.ok) return guard.response

  const childUserId = guard.session.userId

  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // Get unseen raid reports from today or yesterday
  const reports = await prisma.dailyBaseDamage.findMany({
    where: {
      childUserId,
      cinematicSeen: false,
      attackResult: { not: 'quiet' },
      date: { gte: yesterday },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(
    reports.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      attackResult: r.attackResult,
      zombieThreat: r.zombieThreat,
      missedChores: r.missedChores,
      doorDamage: r.doorDamage,
      barricadeDamage: r.barricadeDamage,
      fenceDamage: r.fenceDamage,
      lightDamage: r.lightDamage,
      repairApplied: r.repairApplied,
      raidEventsJson: r.raidEventsJson,
    })),
  )
}

export async function POST(request: Request) {
  const guard = await requireChild()
  if (!guard.ok) return guard.response

  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Verify ownership
  const report = await prisma.dailyBaseDamage.findFirst({
    where: { id, childUserId: guard.session.userId },
  })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.dailyBaseDamage.update({
    where: { id },
    data: { cinematicSeen: true },
  })

  return NextResponse.json({ success: true })
}
