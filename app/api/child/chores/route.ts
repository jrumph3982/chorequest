import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { generateInstances, getWeekBounds } from '@/lib/chores/instances'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await generateInstances(session.userId)

  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const { start: weekStart, end: weekEnd } = getWeekBounds(now)

  const instances = await prisma.choreInstance.findMany({
    where: {
      childUserId: session.userId,
      dueDate: { gte: weekStart, lte: weekEnd },
    },
    include: {
      assignment: {
        include: {
          chore: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              scheduleType: true,
              basePoints: true,
              difficultyScore: true,
              requiresApproval: true,
            },
          },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  const daily = instances.filter((i) => i.assignment.chore.scheduleType === 'daily')
  const weekly = instances.filter((i) => i.assignment.chore.scheduleType === 'weekly')

  return NextResponse.json({ daily, weekly })
}
