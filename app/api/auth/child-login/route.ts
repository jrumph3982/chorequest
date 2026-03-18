import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword } from '@/lib/auth/password'
import { saveChildSession } from '@/lib/auth/session'
import { childLoginSchema } from '@/lib/validation/auth'
import { checkRateLimit, recordFailure, recordSuccess, lockedResponse } from '@/lib/auth/rate-limit'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'

const GENERIC_ERROR = 'Invalid household code or PIN'

async function logAttempt({
  householdCodeAttempted,
  childUserId,
  ipAddress,
  userAgent,
  success,
}: {
  householdCodeAttempted: string
  childUserId?: string
  ipAddress?: string
  userAgent?: string
  success: boolean
}) {
  await prisma.loginAttempt.create({
    data: { householdCodeAttempted, childUserId, ipAddress, userAgent, success },
  })
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
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }

  const parsed = childLoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  const { householdCode, childUserId, pin } = parsed.data

  const rlKey = `pin:${childUserId}`
  const rl = await checkRateLimit(rlKey, 'child_pin')
  if (rl.blocked) return lockedResponse(rl.retryAfter)

  const household = await prisma.household.findUnique({
    where: { householdCode },
    select: { id: true },
  })

  if (!household) {
    await logAttempt({ householdCodeAttempted: householdCode, childUserId, ipAddress: ip, userAgent, success: false })
    await recordFailure(rlKey, 'child_pin')
    await logSecurityEvent({
      eventType: SECURITY_EVENT.CHILD_LOGIN_FAILURE,
      // householdId unknown — code not found
      metadata:  { reason: 'household_not_found' },
      ipAddress: ip,
      userAgent,
    })
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  const child = await prisma.user.findFirst({
    where: {
      id: childUserId,
      role: 'child',
      householdMembers: { some: { householdId: household.id } },
    },
    select: { id: true, name: true, pinHash: true },
  })

  if (!child || !child.pinHash) {
    await logAttempt({ householdCodeAttempted: householdCode, childUserId, ipAddress: ip, userAgent, success: false })
    await recordFailure(rlKey, 'child_pin')
    await logSecurityEvent({
      eventType:   SECURITY_EVENT.CHILD_LOGIN_FAILURE,
      householdId: household.id,
      metadata:    { reason: 'child_not_found' },
      ipAddress:   ip,
      userAgent,
    })
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  const valid = await comparePassword(pin, child.pinHash)

  await logAttempt({
    householdCodeAttempted: householdCode,
    childUserId: child.id,
    ipAddress: ip,
    userAgent,
    success: valid,
  })

  if (!valid) {
    await recordFailure(rlKey, 'child_pin')
    await logSecurityEvent({
      eventType:    SECURITY_EVENT.CHILD_LOGIN_FAILURE,
      householdId:  household.id,
      targetUserId: child.id,
      metadata:     { reason: 'wrong_pin', childName: child.name },
      ipAddress:    ip,
      userAgent,
    })
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  await saveChildSession({
    userId:      child.id,
    role:        'child',
    name:        child.name,
    householdId: household.id,
  })

  await recordSuccess(rlKey, 'child_pin')
  await logSecurityEvent({
    eventType:   SECURITY_EVENT.CHILD_LOGIN_SUCCESS,
    householdId: household.id,
    actorUserId: child.id,
    ipAddress:   ip,
    userAgent,
  })
  return NextResponse.json({ ok: true })
}
