import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword } from '@/lib/auth/password'
import { saveAdultSession } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validation/auth'
import { checkRateLimit, recordFailure, recordSuccess, lockedResponse } from '@/lib/auth/rate-limit'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'

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

  const result = loginSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { username, password } = result.data
  const rlKey = `login:${username}`

  const rl = await checkRateLimit(rlKey, 'parent_login')
  if (rl.blocked) return lockedResponse(rl.retryAfter)

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !user.passwordHash) {
    await recordFailure(rlKey, 'parent_login')
    await logSecurityEvent({
      eventType: SECURITY_EVENT.PARENT_LOGIN_FAILURE,
      // householdId unknown — user doesn't exist
      metadata:  { usernameAttempted: username },
      ipAddress: ip,
      userAgent,
    })
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // Resolve household now so both success and failure paths can be scoped.
  let householdId: string | undefined
  if (user.role === 'adult') {
    const member = await prisma.householdMember.findFirst({
      where: { userId: user.id },
      select: { householdId: true },
    })
    householdId = member?.householdId ?? undefined
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    await recordFailure(rlKey, 'parent_login')
    await logSecurityEvent({
      eventType:   SECURITY_EVENT.PARENT_LOGIN_FAILURE,
      householdId,
      actorUserId: user.id,
      metadata:    { username: user.username },
      ipAddress:   ip,
      userAgent,
    })
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  await saveAdultSession({
    userId: user.id,
    role:   user.role as 'adult',
    name:   user.name,
    householdId,
  })
  await recordSuccess(rlKey, 'parent_login')
  await logSecurityEvent({
    eventType:   SECURITY_EVENT.PARENT_LOGIN_SUCCESS,
    householdId,
    actorUserId: user.id,
    ipAddress:   ip,
    userAgent,
  })

  return NextResponse.json({ role: user.role })
}
