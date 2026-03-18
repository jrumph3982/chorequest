import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getWeekBounds } from '@/lib/chores/instances'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!session.householdId) return NextResponse.json([])

  const { start: weekStart, end: weekEnd } = getWeekBounds(new Date())

  const members = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: { some: { householdId: session.householdId } },
    },
    select: {
      id: true,
      name: true,
      level: true,
      childProfile: {
        select: {
          hairStyle: true,
          hairColor: true,
          skinTone: true,
          eyeColor: true,
          gender: true,
          eyeStyle: true,
          freckles: true,
          jacketColor: true,
          pantsColor: true,
          goggleColor: true,
          sigItem: true,
        },
      },
      choreInstances: {
        where: { status: 'approved', dueDate: { gte: weekStart, lte: weekEnd } },
        select: { pointsAwarded: true },
      },
    },
  })

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      level: m.level,
      childProfile: m.childProfile,
      weekPoints: m.choreInstances.reduce((s, i) => s + (i.pointsAwarded ?? 0), 0),
      weekChores: m.choreInstances.length,
    }))
  )
}
