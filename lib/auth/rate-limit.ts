import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const RATE_LIMITS = {
  parent_login: { maxAttempts: 10, lockoutSeconds: 15 * 60 },
  child_lookup: { maxAttempts: 20, lockoutSeconds: 5 * 60 },
  child_pin: { maxAttempts: 5, lockoutSeconds: 10 * 60 },
} as const

export type ActionType = keyof typeof RATE_LIMITS

export async function checkRateLimit(
  key: string,
  actionType: ActionType,
): Promise<{ blocked: false } | { blocked: true; retryAfter: Date }> {
  const record = await prisma.authRateLimit.findUnique({
    where: { key_actionType: { key, actionType } },
  })
  if (record?.lockedUntil && record.lockedUntil > new Date()) {
    return { blocked: true, retryAfter: record.lockedUntil }
  }
  return { blocked: false }
}

export async function recordFailure(key: string, actionType: ActionType): Promise<void> {
  const { maxAttempts, lockoutSeconds } = RATE_LIMITS[actionType]
  const now = new Date()

  const existing = await prisma.authRateLimit.findUnique({
    where: { key_actionType: { key, actionType } },
  })

  // If a previous lockout has expired, start a fresh attempt window
  const base =
    existing?.lockedUntil && existing.lockedUntil <= now ? 0 : (existing?.attempts ?? 0)
  const attempts = base + 1
  const lockedUntil =
    attempts >= maxAttempts
      ? new Date(now.getTime() + lockoutSeconds * 1000)
      : (existing?.lockedUntil ?? null)

  await prisma.authRateLimit.upsert({
    where: { key_actionType: { key, actionType } },
    create: { key, actionType, attempts, lockedUntil },
    update: { attempts, lockedUntil },
  })
}

export async function recordSuccess(key: string, actionType: ActionType): Promise<void> {
  await prisma.authRateLimit.upsert({
    where: { key_actionType: { key, actionType } },
    create: { key, actionType, attempts: 0, lockedUntil: null },
    update: { attempts: 0, lockedUntil: null },
  })
}

export function lockedResponse(retryAfter: Date): NextResponse {
  const secondsRemaining = Math.ceil((retryAfter.getTime() - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Too many attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(secondsRemaining) } },
  )
}
