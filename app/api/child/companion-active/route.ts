import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uc = await prisma.userCompanion.findFirst({
    where: { childUserId: session.userId, equipped: true },
    include: { companion: true },
  })

  if (!uc) return NextResponse.json(null)

  return NextResponse.json({
    id: uc.companion.id,
    name: uc.companion.name,
    type: uc.companion.type,
    color: uc.companion.color,
    bonusType: uc.companion.bonusType,
    bonusValue: uc.companion.bonusValue,
  })
}
