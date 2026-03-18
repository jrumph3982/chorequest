import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function GET() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const requests = await prisma.bonusRequest.findMany({
    where: { status: 'pending', householdId },
    orderBy: { submittedAt: 'asc' },
    include: { child: { select: { id: true, name: true } } },
  })

  return NextResponse.json(requests)
}
