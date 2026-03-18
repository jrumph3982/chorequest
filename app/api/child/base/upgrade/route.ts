import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { upgradeComponent, UPGRADE_COSTS, MAX_COMPONENT_LEVEL } from '@/lib/game/base'
import type { BaseComponent } from '@/lib/game/base'

const upgradeSchema = z.object({
  component: z.enum(['door', 'barricade', 'fence', 'light', 'watchtower', 'turret']),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = upgradeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  try {
    const updatedBase = await upgradeComponent(session.userId, parsed.data.component as BaseComponent)
    return NextResponse.json(updatedBase)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upgrade failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// Expose upgrade costs so the client can display them without hardcoding
export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ costs: UPGRADE_COSTS, maxLevel: MAX_COMPONENT_LEVEL })
}
