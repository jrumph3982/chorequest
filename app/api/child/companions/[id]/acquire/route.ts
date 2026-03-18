import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [companion, child, existing] = await Promise.all([
    prisma.companion.findUnique({ where: { id } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { level: true, gameCurrencyBalance: true },
    }),
    prisma.userCompanion.findUnique({
      where: { childUserId_companionId: { childUserId: session.userId, companionId: id } },
    }),
  ])

  if (!companion) return NextResponse.json({ error: 'Companion not found' }, { status: 404 })
  if (existing) return NextResponse.json({ error: 'Already owned' }, { status: 409 })
  if (!child || child.level < companion.unlockLevel) {
    return NextResponse.json(
      { error: `Requires Level ${companion.unlockLevel}` },
      { status: 400 },
    )
  }
  if (child.gameCurrencyBalance < companion.costCurrency) {
    return NextResponse.json({ error: 'Not enough Scrap' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { gameCurrencyBalance: { decrement: companion.costCurrency } },
    }),
    prisma.userCompanion.create({
      data: { childUserId: session.userId, companionId: id },
    }),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}
