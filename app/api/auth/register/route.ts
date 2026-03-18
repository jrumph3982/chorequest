import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { saveAdultSession } from '@/lib/auth/session'
import { registerSchema } from '@/lib/validation/auth'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

async function generateHouseholdCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(
      { length: 6 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join('')
    const existing = await prisma.household.findUnique({ where: { householdCode: code } })
    if (!existing) return code
  }
  throw new Error('Failed to generate unique household code')
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined
  const userAgent = request.headers.get('user-agent') ?? undefined

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = registerSchema.safeParse(body)
  if (!result.success) {
    const errors = Object.fromEntries(
      result.error.issues.map((i) => [i.path[0], i.message]),
    )
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { name, username, password, email } = result.data

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ errors: { username: 'Username already taken' } }, { status: 409 })
  }

  const [passwordHash, householdCode] = await Promise.all([
    hashPassword(password),
    generateHouseholdCode(),
  ])

  const { user, household } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, username, passwordHash, role: 'adult', ...(email ? { email } : {}) },
    })
    const household = await tx.household.create({
      data: { displayName: `${name}'s Family`, householdCode },
    })
    await tx.householdMember.create({
      data: { householdId: household.id, userId: user.id, role: 'owner' },
    })
    return { user, household }
  })

  await saveAdultSession({
    userId: user.id,
    role: 'adult',
    name: user.name,
    householdId: household.id,
  })

  await logSecurityEvent({
    eventType:   SECURITY_EVENT.PARENT_SIGNUP,
    householdId: household.id,
    actorUserId: user.id,
    metadata:    { username: user.username },
    ipAddress:   ip,
    userAgent,
  })
  await logSecurityEvent({
    eventType:   SECURITY_EVENT.HOUSEHOLD_CREATED,
    householdId: household.id,
    actorUserId: user.id,
    metadata:    { displayName: household.displayName },
    ipAddress:   ip,
    userAgent,
  })

  return NextResponse.json({ role: 'adult' }, { status: 201 })
}
