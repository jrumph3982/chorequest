import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { createBonusRequestSchema } from '@/lib/validation/bonus'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requests = await prisma.bonusRequest.findMany({
    where: { childUserId: session.userId },
    orderBy: { submittedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createBonusRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const bonusRequest = await prisma.bonusRequest.create({
    data: {
      childUserId: session.userId,
      description: parsed.data.description,
      requestedPoints: parsed.data.requestedPoints,
    },
  })

  return NextResponse.json(bonusRequest, { status: 201 })
}
