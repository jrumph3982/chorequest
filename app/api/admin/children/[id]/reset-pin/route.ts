import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { resetPinSchema } from '@/lib/validation/children'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  const { id } = await params

  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: id } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = resetPinSchema.safeParse(body)
  if (!result.success) {
    const errors = Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
    return NextResponse.json({ errors }, { status: 400 })
  }

  const pinHash = await hashPassword(result.data.pin)
  const child = await prisma.user.update({
    where: { id },
    data: { pinHash },
    select: { name: true },
  })

  await logSecurityEvent({
    eventType:    SECURITY_EVENT.CHILD_PIN_RESET,
    householdId,
    actorUserId:  session.userId,
    targetUserId: id,
    metadata:     { childName: child.name },
  })

  return NextResponse.json({ ok: true })
}
