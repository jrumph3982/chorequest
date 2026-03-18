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

  const uc = await prisma.userCompanion.findUnique({
    where: { childUserId_companionId: { childUserId: session.userId, companionId: id } },
  })

  if (!uc) {
    return NextResponse.json({ error: 'Companion not owned' }, { status: 403 })
  }

  const nowEquipped = !uc.equipped

  if (nowEquipped) {
    // Unequip all others, then equip this one
    await prisma.$transaction([
      prisma.userCompanion.updateMany({
        where: { childUserId: session.userId, equipped: true },
        data: { equipped: false },
      }),
      prisma.userCompanion.update({
        where: { id: uc.id },
        data: { equipped: true },
      }),
    ])
  } else {
    await prisma.userCompanion.update({
      where: { id: uc.id },
      data: { equipped: false },
    })
  }

  return NextResponse.json({ equipped: nowEquipped })
}
