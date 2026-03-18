import { getSession } from '@/lib/auth/session'
import { NextResponse } from 'next/server'
import type { SessionData } from '@/lib/auth/session'

type AdultSession = SessionData & { householdId: string }

export async function requireAdult(): Promise<
  { ok: true; session: AdultSession; householdId: string } | { ok: false; response: NextResponse }
> {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!session.householdId) {
    return { ok: false, response: NextResponse.json({ error: 'No household' }, { status: 400 }) }
  }
  const adultSession = session as AdultSession
  return { ok: true, session: adultSession, householdId: adultSession.householdId }
}

export async function requireChild(): Promise<
  { ok: true; session: SessionData } | { ok: false; response: NextResponse }
> {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true, session }
}
