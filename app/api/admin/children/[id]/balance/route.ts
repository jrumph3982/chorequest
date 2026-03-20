import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

const schema = z.object({
  allowanceBalanceCents: z.number().int().min(0).max(10000000),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const { id } = await params

  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: id } },
  })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid amount' }, { status: 422 })

  await prisma.user.update({
    where: { id },
    data: { allowanceBalanceCents: parsed.data.allowanceBalanceCents },
  })

  return NextResponse.json({ ok: true })
}
