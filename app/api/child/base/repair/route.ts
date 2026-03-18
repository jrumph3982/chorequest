import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { repairSchema } from '@/lib/validation/base'
import { repairComponent } from '@/lib/game/base'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = repairSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const updated = await repairComponent(
      session.userId,
      parsed.data.component,
      parsed.data.tier,
    )
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Repair failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
