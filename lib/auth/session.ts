import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId: string
  role: 'adult' | 'child'
  name: string
  isLoggedIn: boolean
  householdId?: string
}

const COOKIE_NAME = 'chq-session'
const SESSION_PASSWORD =
  process.env.SESSION_SECRET ?? 'dev_secret_please_change_this_in_prod_!!'

const SEVEN_DAYS = 60 * 60 * 24 * 7 // seconds
const EIGHT_HOURS = 60 * 60 * 8     // seconds

// COOKIE_SECURE can be set to 'false' explicitly to allow HTTP access on a local
// network (e.g. http://192.168.x.x) even when NODE_ENV=production.
// Defaults to true in production so HTTPS deployments stay secure.
const isSecure =
  process.env.COOKIE_SECURE === 'false'
    ? false
    : process.env.NODE_ENV === 'production'

const baseCookieOptions = {
  secure: isSecure,
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
}

// Used for reading sessions in guards and server components.
// TTL here is intentionally generous — actual expiry is embedded in the sealed token.
export const sessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: COOKIE_NAME,
  cookieOptions: baseCookieOptions,
}

// Adult: 7-day persistent cookie + 7-day server-side token TTL
const adultSessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: COOKIE_NAME,
  ttl: SEVEN_DAYS,
  cookieOptions: {
    ...baseCookieOptions,
    maxAge: SEVEN_DAYS,
  },
}

// Child: session cookie (browser clears on close) + 8-hour server-side token TTL.
// Safer on shared devices: session is gone when the browser is closed, and the
// sealed token is invalid after 8 hours even if the cookie somehow persists.
const childSessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: COOKIE_NAME,
  ttl: EIGHT_HOURS,
  cookieOptions: baseCookieOptions, // no maxAge → session cookie
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function saveAdultSession(
  data: Omit<SessionData, 'isLoggedIn'>,
): Promise<void> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, adultSessionOptions)
  session.userId = data.userId
  session.role = data.role
  session.name = data.name
  session.householdId = data.householdId
  session.isLoggedIn = true
  await session.save()
}

export async function saveChildSession(
  data: Omit<SessionData, 'isLoggedIn'>,
): Promise<void> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, childSessionOptions)
  session.userId = data.userId
  session.role = data.role
  session.name = data.name
  session.householdId = data.householdId
  session.isLoggedIn = true
  await session.save()
}
