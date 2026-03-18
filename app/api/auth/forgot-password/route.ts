import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validation/auth'
import { sendPasswordResetEmail } from '@/lib/email/resend'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid email' }, { status: 400 })
  }

  const { email } = parsed.data

  // Always return 200 to avoid leaking which emails are registered
  const user = await prisma.user.findFirst({ where: { email, role: 'adult' } })
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  })

  await sendPasswordResetEmail(email, token)

  return NextResponse.json({ ok: true })
}
