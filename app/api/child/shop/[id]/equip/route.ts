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

  const inv = await prisma.userInventory.findUnique({
    where: {
      childUserId_inventoryItemId: { childUserId: session.userId, inventoryItemId: id },
    },
    include: { inventoryItem: { select: { cosmeticSlot: true, type: true } } },
  })

  if (!inv) {
    return NextResponse.json({ error: 'Item not owned' }, { status: 403 })
  }

  const newEquipped = !inv.equipped

  // When equipping a slotted cosmetic or handheld tool/weapon, unequip any other item in the same slot first
  const slot =
    inv.inventoryItem.cosmeticSlot ??
    (inv.inventoryItem.type === 'weapon' || inv.inventoryItem.type === 'tool' ? 'handheld' : null)

  if (newEquipped && slot) {
    const conflictingItems = await prisma.inventoryItem.findMany({
      where:
        slot === 'handheld'
          ? {
              OR: [
                { cosmeticSlot: 'handheld' },
                { type: { in: ['weapon', 'tool'] } },
              ],
              id: { not: id },
            }
          : { cosmeticSlot: slot, id: { not: id } },
      select: { id: true },
    })
    if (conflictingItems.length > 0) {
      await prisma.userInventory.updateMany({
        where: {
          childUserId: session.userId,
          inventoryItemId: { in: conflictingItems.map((i) => i.id) },
          equipped: true,
        },
        data: { equipped: false },
      })
    }
  }

  await prisma.userInventory.update({
    where: { id: inv.id },
    data: { equipped: newEquipped },
  })

  return NextResponse.json({ equipped: newEquipped })
}
