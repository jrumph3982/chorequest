import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function GET() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const instances = await prisma.choreInstance.findMany({
    where: { status: 'submitted_complete', householdId },
    orderBy: { submittedAt: 'asc' },
    include: {
      child: { select: { id: true, name: true } },
      assignment: {
        include: {
          chore: { select: { id: true, title: true, basePoints: true } },
        },
      },
    },
  })

  return NextResponse.json(instances)
}
