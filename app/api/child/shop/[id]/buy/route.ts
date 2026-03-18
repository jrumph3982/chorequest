import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [item, child, existing] = await Promise.all([
    prisma.inventoryItem.findUnique({ where: { id } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { level: true, gameCurrencyBalance: true },
    }),
    prisma.userInventory.findUnique({
      where: {
        childUserId_inventoryItemId: { childUserId: session.userId, inventoryItemId: id },
      },
    }),
  ])

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  if (existing) return NextResponse.json({ error: 'Already owned' }, { status: 409 })
  if (!child || child.level < item.unlockLevel) {
    return NextResponse.json(
      { error: `Requires Level ${item.unlockLevel}` },
      { status: 400 },
    )
  }
  if (child.gameCurrencyBalance < item.costCurrency) {
    return NextResponse.json({ error: 'Not enough Scrap' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { gameCurrencyBalance: { decrement: item.costCurrency } },
    }),
    prisma.userInventory.create({
      data: { childUserId: session.userId, inventoryItemId: id },
    }),
  ])

  return NextResponse.json({ ok: true }, { status: 201 })
}
