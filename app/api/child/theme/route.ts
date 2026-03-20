import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireChild } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'

const schema = z.object({
  visualTheme: z.enum(['zombie', 'castle', 'racing']),
})

export async function PATCH(req: NextRequest) {
  const guard = await requireChild()
  if (!guard.ok) return guard.response
  const { session } = guard

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 422 })
  }

  await prisma.childProfile.update({
    where: { userId: session.userId },
    data: { visualTheme: parsed.data.visualTheme } as any,
  })

  return NextResponse.json({ ok: true })
}
