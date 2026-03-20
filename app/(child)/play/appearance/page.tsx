import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { AvatarCreatorV2 } from '@/components/child/AvatarCreatorV2'

export default async function AppearancePage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  const [childProfile, ownedInventory] = await Promise.all([
    (prisma.childProfile.findUnique as any)({
      where: { userId: session.userId },
      select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true, visualTheme: true },
    }) as Promise<{ hairStyle: string | null; hairColor: string | null; skinTone: string | null; eyeColor: string | null; gender: string | null; visualTheme: string | null } | null>,
    prisma.userInventory.findMany({
      where: { childUserId: session.userId },
      include: {
        inventoryItem: {
          select: { id: true, name: true, slug: true, type: true, cosmeticSlot: true, rarity: true, statsJson: true },
        },
      },
    }),
  ])

  return (
    <AvatarCreatorV2
      initialHairStyle={childProfile?.hairStyle ?? null}
      initialHairColor={childProfile?.hairColor ?? null}
      initialSkinTone={childProfile?.skinTone ?? null}
      initialEyeColor={childProfile?.eyeColor ?? null}
      initialGender={childProfile?.gender ?? null}
    />
  )
}
