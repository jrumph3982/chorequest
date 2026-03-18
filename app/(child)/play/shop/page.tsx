import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ShopGrid } from '@/components/child/shop-grid'

export default async function ShopPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  const [child, items, ownedInventory, companions, ownedCompanions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { level: true, gameCurrencyBalance: true },
    }),
    prisma.inventoryItem.findMany({
      orderBy: [{ unlockLevel: 'asc' }, { costCurrency: 'asc' }],
    }),
    prisma.userInventory.findMany({
      where: { childUserId: session.userId },
      select: { inventoryItemId: true, equipped: true },
    }),
    prisma.companion.findMany({
      orderBy: [{ unlockLevel: 'asc' }, { costCurrency: 'asc' }],
    }),
    prisma.userCompanion.findMany({
      where: { childUserId: session.userId },
      select: { companionId: true, equipped: true },
    }),
  ])

  const ownedMap = Object.fromEntries(
    ownedInventory.map((o) => [o.inventoryItemId, o.equipped])
  )
  const ownedCompanionMap = Object.fromEntries(
    ownedCompanions.map((o) => [o.companionId, o.equipped])
  )
  const scrap = child?.gameCurrencyBalance ?? 0
  const level = child?.level ?? 1

  return (
    <ShopGrid
      items={items}
      companions={companions}
      ownedMap={ownedMap}
      ownedCompanionMap={ownedCompanionMap}
      scrap={scrap}
      level={level}
    />
  )
}
