import { NextResponse } from 'next/server'
import { requireChild } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function GET() {
  const guard = await requireChild()
  if (!guard.ok) return guard.response

  const payouts = await prisma.allowancePayout.findMany({
    where: { childId: guard.session.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      paidBy: { select: { name: true } },
    },
  })

  return NextResponse.json(payouts)
}
