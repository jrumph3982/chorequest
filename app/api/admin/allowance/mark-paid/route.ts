import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

const schema = z.object({ recordId: z.string().min(1) })

export async function POST(req: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { recordId } = parsed.data

  const record = await prisma.allowanceRecord.findUnique({
    where: { id: recordId },
    select: { id: true, paid: true, moneyEarned: true, childUserId: true, householdId: true },
  })

  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.householdId !== guard.householdId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (record.paid) return NextResponse.json({ error: 'Already paid' }, { status: 409 })

  await prisma.$transaction([
    prisma.allowanceRecord.update({ where: { id: recordId }, data: { paid: true } }),
    prisma.user.update({
      where: { id: record.childUserId },
      data: { allowanceBalanceCents: { decrement: record.moneyEarned } },
    }),
  ])

  return NextResponse.json({ ok: true })
}
