import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [items, owned] = await Promise.all([
    prisma.inventoryItem.findMany({
      orderBy: [{ unlockLevel: 'asc' }, { costCurrency: 'asc' }],
    }),
    prisma.userInventory.findMany({
      where: { childUserId: session.userId },
      select: { inventoryItemId: true },
    }),
  ])

  const ownedSet = new Set(owned.map((o) => o.inventoryItemId))
  return NextResponse.json(items.map((item) => ({ ...item, owned: ownedSet.has(item.id) })))
}
