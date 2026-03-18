import { NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

export async function POST() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: guard.session.userId } } },
    select: { id: true },
  })
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  await prisma.household.update({
    where: { id: household.id },
    data: { onboardingComplete: true, onboardingStep: 6 },
  })

  return NextResponse.json({ success: true })
}
