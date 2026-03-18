import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const { id } = await params

  const event = await prisma.gameEvent.findUnique({ where: { id } })
  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.gameEvent.update({ where: { id }, data: { active: !event.active } })

  return NextResponse.json({ active: !event.active })
}
