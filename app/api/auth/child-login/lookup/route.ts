import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { householdCodeLookupSchema } from '@/lib/validation/auth'
import { checkRateLimit, recordFailure, recordSuccess, lockedResponse } from '@/lib/auth/rate-limit'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const rlKey = `lookup:${ip}`

  const rl = await checkRateLimit(rlKey, 'child_lookup')
  if (rl.blocked) return lockedResponse(rl.retryAfter)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = householdCodeLookupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid household code' },
      { status: 400 },
    )
  }

  const { householdCode } = parsed.data

  const household = await prisma.household.findUnique({
    where: { householdCode },
    select: { id: true, displayName: true },
  })

  if (!household) {
    await recordFailure(rlKey, 'child_lookup')
    await logSecurityEvent({
      eventType: SECURITY_EVENT.HOUSEHOLD_LOOKUP_FAILURE,
      // householdId unknown — code not found; no household to scope to
      metadata:  { codeLength: householdCode.length },
      ipAddress: ip === 'unknown' ? undefined : ip,
    })
    return NextResponse.json({ error: 'Household not found' }, { status: 404 })
  }

  const children = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: { some: { householdId: household.id } },
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      level: true,
      childProfile: {
        select: {
          hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true,
          eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true, goggleColor: true, sigItem: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  await recordSuccess(rlKey, 'child_lookup')
  return NextResponse.json({ displayName: household.displayName, children })
}
