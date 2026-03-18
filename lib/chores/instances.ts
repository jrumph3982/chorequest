import { prisma } from '@/lib/db'

/** Monday–Sunday bounds for the week containing `date`. */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

/**
 * Ensures a ChoreInstance exists for every active assignment:
 *  - daily        → one instance per calendar day
 *  - specific_days → one instance per day if today matches scheduleDays (1=Mon, 7=Sun)
 *  - weekly       → one instance per Mon–Sun week (due Sunday midnight)
 *  - monthly/once → not automatically generated (managed externally)
 *
 * Safe to call on every page load; skips instances that already exist.
 */
export async function generateInstances(childUserId: string): Promise<void> {
  const now = new Date()

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const { start: weekStart, end: weekEnd } = getWeekBounds(now)

  // Sunday of this week at midnight — due date for weekly chores
  const weekSunday = new Date(weekStart)
  weekSunday.setDate(weekStart.getDate() + 6)
  weekSunday.setHours(0, 0, 0, 0)

  // Day of week: 1=Mon, 2=Tue, ..., 7=Sun (consistent with Prisma scheduleDays)
  const jsDay = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const isoDay = jsDay === 0 ? 7 : jsDay // 1=Mon, 7=Sun

  // Fetch child's household so new instances are correctly scoped
  const membership = await prisma.householdMember.findFirst({
    where: { userId: childUserId },
    select: { householdId: true },
  })
  const householdId = membership?.householdId ?? null

  const assignments = await prisma.choreAssignment.findMany({
    where: { childUserId, active: true },
    include: {
      chore: {
        select: {
          scheduleType: true,
          active: true,
          scheduleDays: true,
        },
      },
    },
  })

  const active = assignments.filter((a) => a.chore.active)
  if (active.length === 0) return

  // Single query for all existing instances within this week
  const existing = await prisma.choreInstance.findMany({
    where: {
      childUserId,
      choreAssignmentId: { in: active.map((a) => a.id) },
      dueDate: { gte: weekStart, lte: weekEnd },
    },
    select: { choreAssignmentId: true, dueDate: true },
  })

  // IDs that already have a TODAY instance (daily check)
  const hasTodaySet = new Set(
    existing
      .filter((i) => i.dueDate >= today && i.dueDate <= todayEnd)
      .map((i) => i.choreAssignmentId),
  )

  // IDs that already have ANY instance this week (weekly check)
  const hasWeekSet = new Set(existing.map((i) => i.choreAssignmentId))

  const toCreate: Array<{
    choreAssignmentId: string
    childUserId: string
    householdId: string | null
    dueDate: Date
  }> = []

  for (const a of active) {
    const st = a.chore.scheduleType as string

    if (st === 'daily' && !hasTodaySet.has(a.id)) {
      toCreate.push({ choreAssignmentId: a.id, childUserId, householdId, dueDate: today })
    }

    if (st === 'specific_days') {
      const scheduledDays = a.chore.scheduleDays as number[]
      const isScheduledToday = scheduledDays.includes(isoDay)
      if (isScheduledToday && !hasTodaySet.has(a.id)) {
        toCreate.push({ choreAssignmentId: a.id, childUserId, householdId, dueDate: today })
      }
    }

    if (st === 'weekly' && !hasWeekSet.has(a.id)) {
      toCreate.push({ choreAssignmentId: a.id, childUserId, householdId, dueDate: weekSunday })
    }
  }

  if (toCreate.length > 0) {
    await prisma.choreInstance.createMany({ data: toCreate })
  }
}
