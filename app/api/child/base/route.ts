import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getOrCreateBaseState } from '@/lib/game/base'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = await getOrCreateBaseState(session.userId)

  const recentAttacks = await prisma.dailyBaseDamage.findMany({
    where: { childUserId: session.userId },
    orderBy: { date: 'desc' },
    take: 7,
  })

  return NextResponse.json({ base, recentAttacks })
}
