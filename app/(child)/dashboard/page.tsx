import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getWeekBounds, generateInstances } from '@/lib/chores/instances'
import { getOrCreateSettings } from '@/lib/game/settings'
import { calcCurrentThreat } from '@/lib/game/base'
import { getActiveEvents, applyEventThreatBump } from '@/lib/game/events'
import { DashboardChoreList } from '@/components/child/DashboardChoreList'
import { AllowanceRing } from '@/components/child/AllowanceRing'
import { FamilyLeaderboard } from '@/components/child/FamilyLeaderboard'
import { FortificationScene } from '@/components/child/FortificationScene'
import { ThreatPoller } from '@/components/child/threat-poller'
import { PetSprite } from '@/components/child/PetSprite'
import { ChallengeCard } from '@/components/child/ChallengeCard'
import { getActiveChallengesForChild } from '@/lib/game/challenges'

// ---------------------------------------------------------------------------
// Local server-only helper components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <h2
        style={{
          fontFamily: "'Bungee', sans-serif",
          color: '#ff6b00',
          fontSize: 13,
          letterSpacing: 2,
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
    </div>
  )
}

function StatCard({
  label,
  value,
  barPct,
  barColor,
  subtitle,
  accentBorder,
}: {
  label: string
  value: string | number
  barPct: number
  barColor: string
  subtitle?: string
  accentBorder?: string
}) {
  return (
    <div style={{
      background: '#0d1810',
      border: `1px solid ${accentBorder ?? '#1a3018'}`,
      borderTop: `3px solid ${barColor}`,
      borderRadius: 10,
      padding: 14,
    }}>
      <p
        style={{
          color: '#4a6a4a',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          margin: '0 0 4px',
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Bungee', sans-serif",
          color: '#e8f5e8',
          fontSize: 32,
          lineHeight: 1,
          margin: '0 0 6px',
        }}
      >
        {value}
      </p>
      {subtitle && (
        <p style={{ color: barColor, fontSize: 10, margin: '0 0 8px', fontWeight: 700 }}>{subtitle}</p>
      )}
      <div style={{ height: 3, background: '#1a3018', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.round(barPct * 100))}%`,
            background: barColor,
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  )
}

type DayStatus = 'completed' | 'missed' | 'pending' | 'empty'
interface StreakDay {
  label: string
  status: DayStatus
  isToday: boolean
}

function StreakRow({ days }: { days: StreakDay[] }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        background: '#0d1810',
        border: '1px solid #1a3018',
        borderRadius: 10,
        padding: '12px 10px',
      }}
    >
      {days.map((d, i) => {
        const isCompleted = d.status === 'completed'
        const isMissed    = d.status === 'missed'
        const isPending   = d.status === 'pending'

        const bg = isCompleted
          ? 'rgba(61,255,122,0.18)'
          : isMissed
          ? 'rgba(255,74,74,0.15)'
          : isPending
          ? 'rgba(255,107,0,0.12)'
          : 'rgba(0,0,0,0.2)'

        const border = isCompleted
          ? '2px solid #3dff7a'
          : isMissed
          ? '2px solid #ff4a4a'
          : isPending
          ? '2px solid #ff6b00'
          : '2px dashed #1a3018'

        const glow = isCompleted
          ? '0 0 8px rgba(61,255,122,0.4)'
          : isMissed
          ? '0 0 6px rgba(255,74,74,0.25)'
          : 'none'

        const labelColor = isCompleted
          ? '#3dff7a'
          : isMissed
          ? '#ff4a4a'
          : isPending
          ? '#ff6b00'
          : '#2a4a2a'

        return (
          <div
            key={i}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 8,
                background: bg,
                border,
                boxShadow: glow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCompleted && (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5L5 9L13 1" stroke="#3dff7a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isMissed && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="#ff4a4a" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {isPending && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b00', boxShadow: '0 0 6px #ff6b00' }} />
              )}
            </div>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: labelColor,
              }}
            >
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    redirect('/child-login')
  }

  const userId = session.userId
  const householdId = session.householdId

  // Generate instances first (idempotent)
  await generateInstances(userId)

  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(23, 59, 59, 999)

  const sixDaysAgo = new Date(today)
  sixDaysAgo.setDate(today.getDate() - 6)

  const { start: weekStart, end: weekEnd } = getWeekBounds(now)

  // Parallel data fetches
  const [
    child,
    childProfile,
    choreDisplayInstances,
    weekInstances,
    recentInstances,
    familyMembersRaw,
    settings,
    lastNightAttack,
    baseState,
    allActiveEvents,
    equippedCompanion,
    activeChallengesRaw,
  ] = await Promise.all([
    // 1. Child user
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        level: true,
        xp: true,
        gameCurrencyBalance: true,
        allowanceBalanceCents: true,
      },
    }),

    // 2. Child profile
    prisma.childProfile.findUnique({
      where: { userId },
      select: {
        streakCount: true,
        hairStyle: true,
        hairColor: true,
        skinTone: true,
        eyeColor: true,
        gender: true,
      },
    }),

    // 3. Chore instances for the checklist: daily=today, weekly=whole week
    prisma.choreInstance.findMany({
      where: { childUserId: userId, dueDate: { gte: weekStart, lte: weekEnd } },
      select: {
        id: true,
        status: true,
        dueDate: true,
        pointsAwarded: true,
        notes: true,
        reviewedAt: true,
        assignment: {
          select: {
            chore: {
              select: {
                title: true,
                basePoints: true,
                category: true,
                difficultyScore: true,
                requiresApproval: true,
                scheduleType: true,
              },
            },
          },
        },
      },
    }),

    // 4. Week instances
    prisma.choreInstance.findMany({
      where: { childUserId: userId, dueDate: { gte: weekStart, lte: weekEnd } },
      select: { status: true, pointsAwarded: true, dueDate: true },
    }),

    // 5. Recent 7-day instances for streak
    prisma.choreInstance.findMany({
      where: { childUserId: userId, dueDate: { gte: sixDaysAgo, lte: todayEnd } },
      select: { status: true, dueDate: true },
    }),

    // 6. Family members for leaderboard
    householdId
      ? prisma.user.findMany({
          where: {
            role: 'child',
            householdMembers: { some: { householdId } },
          },
          select: {
            id: true,
            name: true,
            level: true,
            childProfile: {
              select: {
                hairStyle: true,
                hairColor: true,
                skinTone: true,
                eyeColor: true,
                gender: true,
                eyeStyle: true,
                freckles: true,
                jacketColor: true,
                pantsColor: true,
                goggleColor: true,
                sigItem: true,
              },
            },
            choreInstances: {
              where: { status: 'approved', dueDate: { gte: weekStart, lte: weekEnd } },
              select: { pointsAwarded: true },
            },
          },
        })
      : Promise.resolve([]),

    // 7. Settings
    getOrCreateSettings(householdId),

    // 8. Last night's attack
    prisma.dailyBaseDamage.findUnique({
      where: { childUserId_date: { childUserId: userId, date: yesterday } },
    }),

    // 9. Base state for threat calculation
    prisma.baseState.findUnique({
      where: { childUserId: userId },
      select: { doorDamage: true, barricadeDamage: true, fenceDamage: true, lightDamage: true },
    }),

    // 10. Active events for threat bump
    getActiveEvents(),

    // 11. Equipped companion
    prisma.userCompanion.findFirst({
      where: { childUserId: userId, equipped: true },
      include: {
        companion: { select: { name: true, type: true, color: true, bonusType: true } },
      },
    }),

    // 12. Active challenges
    householdId
      ? getActiveChallengesForChild(userId, householdId)
      : Promise.resolve([]),
  ])

  if (!child) redirect('/child-login')

  // ---------------------------------------------------------------------------
  // Compute stats
  // ---------------------------------------------------------------------------

  // todayInstances: daily chores due today (for stat cards — unchanged behaviour)
  const todayInstances = choreDisplayInstances.filter((i) => {
    const instDate = new Date(i.dueDate)
    return isSameDay(instDate, today)
  })

  const nonExpiredToday = todayInstances.filter((i) => i.status !== 'expired')
  const todayApproved = nonExpiredToday.filter((i) => i.status === 'approved').length
  const todayTotal = nonExpiredToday.length
  const todayPoints = nonExpiredToday
    .filter((i) => i.status === 'approved')
    .reduce((s, i) => s + (i.pointsAwarded ?? 0), 0)
  const todayMaxPoints = nonExpiredToday.reduce(
    (s, i) => s + (i.assignment.chore.basePoints ?? 0),
    0
  )

  const nonExpiredWeek = weekInstances.filter((i) => i.status !== 'expired')
  const weekApproved = nonExpiredWeek.filter((i) => i.status === 'approved').length
  const weekMissed = nonExpiredWeek.filter((i) => i.status === 'missed').length
  const weekTotal = nonExpiredWeek.length
  const weekPoints = nonExpiredWeek
    .filter((i) => i.status === 'approved')
    .reduce((s, i) => s + (i.pointsAwarded ?? 0), 0)

  const allowancePointsPerDollar =
    (settings.allowancePointsPerDollar ?? 0) > 0 ? settings.allowancePointsPerDollar : 100
  const earnedDollars = weekPoints / allowancePointsPerDollar
  const goalDollars =
    settings.weeklyAllowanceCap != null ? settings.weeklyAllowanceCap / allowancePointsPerDollar : 0

  const baseDamaged =
    lastNightAttack?.attackResult === 'overrun' ||
    lastNightAttack?.attackResult === 'barely_survived'

  const baseThreat = baseState
    ? calcCurrentThreat(baseState.doorDamage, baseState.barricadeDamage, baseState.fenceDamage, baseState.lightDamage)
    : 'none'
  const activeEvents = settings.eventsEnabled ? allActiveEvents : []
  const threat = applyEventThreatBump(baseThreat, activeEvents)

  const streakCount = childProfile?.streakCount ?? 0

  // ---------------------------------------------------------------------------
  // Streak days: 7 days from 6 days ago through today
  // ---------------------------------------------------------------------------
  const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  const streakDays: StreakDay[] = []
  for (let daysBack = 6; daysBack >= 0; daysBack--) {
    const d = new Date(today)
    d.setDate(today.getDate() - daysBack)
    const isToday = daysBack === 0

    const dayInstances = recentInstances.filter((inst) => {
      const instDate = new Date(inst.dueDate)
      return isSameDay(instDate, d)
    })

    let status: DayStatus
    if (dayInstances.length === 0) {
      status = 'empty'
    } else if (dayInstances.some((i) => i.status === 'approved')) {
      status = 'completed'
    } else if (isToday && dayInstances.some((i) => i.status === 'available' || i.status === 'submitted_complete')) {
      status = 'pending'
    } else if (dayInstances.some((i) => i.status === 'missed')) {
      status = 'missed'
    } else if (isToday) {
      status = 'pending'
    } else {
      status = 'empty'
    }

    streakDays.push({ label: DAY_LABELS[d.getDay()], status, isToday })
  }

  // ---------------------------------------------------------------------------
  // Daily earnings for AllowanceRing: Mon → today
  // ---------------------------------------------------------------------------
  const FULL_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekDayIndex = now.getDay() // 0=Sun, 1=Mon ... 6=Sat
  // Days elapsed this week (Mon=0 through today)
  const daysElapsed = weekDayIndex === 0 ? 6 : weekDayIndex - 1 // Mon=0, Tue=1 ... Sun=6

  const dailyEarnings: { label: string; dollars: number; isToday: boolean }[] = []
  for (let i = 0; i <= daysElapsed; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dEnd = new Date(d)
    dEnd.setHours(23, 59, 59, 999)
    const isToday = isSameDay(d, now)

    const dayApprovedPts = weekInstances
      .filter((inst) => {
        const instDate = new Date(inst.dueDate)
        return inst.status === 'approved' && isSameDay(instDate, d)
      })
      .reduce((s, inst) => s + (inst.pointsAwarded ?? 0), 0)

    dailyEarnings.push({
      label: FULL_DAY_LABELS[i] ?? d.toLocaleDateString('en', { weekday: 'short' }),
      dollars: dayApprovedPts / allowancePointsPerDollar,
      isToday,
    })
  }

  // ---------------------------------------------------------------------------
  // Leaderboard initial data
  // ---------------------------------------------------------------------------
  const leaderboardInitial = (familyMembersRaw as typeof familyMembersRaw)
    .map((m) => ({
      id: m.id,
      name: m.name,
      level: m.level,
      childProfile: m.childProfile,
      weekPoints: m.choreInstances.reduce((s: number, i: { pointsAwarded: number | null }) => s + (i.pointsAwarded ?? 0), 0),
      weekChores: m.choreInstances.length,
    }))
    .sort((a, b) => b.weekPoints - a.weekPoints)

  // ---------------------------------------------------------------------------
  // Serialize challenges
  // ---------------------------------------------------------------------------
  const activeChallenges = (activeChallengesRaw as Awaited<ReturnType<typeof getActiveChallengesForChild>>).map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    description: c.description,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    targetMetric: c.targetMetric,
    targetValue: c.targetValue,
    participants: c.participants.map((p) => ({
      id: p.id,
      childId: p.childId,
      childName: p.child.name,
      progress: p.progress,
      completed: p.completed,
      isMe: p.childId === userId,
    })),
    rewards: c.rewards.map((r) => ({
      id: r.id,
      rewardType: r.rewardType,
      rewardAmount: r.rewardAmount,
      recipientType: r.recipientType,
    })),
  }))

  // ---------------------------------------------------------------------------
  // Serialize instances for the chore checklist (daily=today + weekly=all week)
  // ---------------------------------------------------------------------------
  const displayInstances = choreDisplayInstances.filter((i) => {
    if (i.assignment.chore.scheduleType === 'weekly') return true
    const instDate = new Date(i.dueDate)
    return isSameDay(instDate, today)
  })

  const todayInstancesSerialized = displayInstances.map((inst) => ({
    id: inst.id,
    status: inst.status as ChoreStatus,
    dueDate: inst.dueDate.toISOString(),
    pointsAwarded: inst.pointsAwarded,
    notes: inst.notes ?? null,
    reviewedAt: inst.reviewedAt ? inst.reviewedAt.toISOString() : null,
    assignment: {
      chore: {
        title: inst.assignment.chore.title,
        basePoints: inst.assignment.chore.basePoints,
        category: inst.assignment.chore.category,
        scheduleType: inst.assignment.chore.scheduleType,
      },
    },
  }))

  return (
    <main className="py-4 space-y-6 pb-24">
      <ThreatPoller />

      {/* Fortification scene animation */}
      <div className="mx-4 rounded-xl overflow-hidden border border-[#3dff7a]/20">
        <FortificationScene threat={threat} />
      </div>

      <div className="px-4 space-y-6">

      {/* BASE DAMAGED banner */}
      {baseDamaged && (
        <div
          style={{
            background: 'rgba(255,48,48,0.08)',
            border: '1px solid rgba(255,48,48,0.4)',
            borderLeft: '3px solid #ff3030',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span>🚨</span>
          <div>
            <p
              style={{
                fontFamily: "'Bungee', sans-serif",
                color: '#ff4a4a',
                fontSize: 13,
                letterSpacing: 1,
                margin: 0,
              }}
            >
              BASE DAMAGED
            </p>
            <p style={{ color: 'rgba(255,74,74,0.7)', fontSize: 11, margin: 0, marginTop: 2 }}>
              Your base took damage last night. Visit Base to repair.
            </p>
          </div>
        </div>
      )}

      {/* TODAY'S MISSION STATUS — 2×2 grid */}
      <section>
        <SectionHeader title="MISSION STATUS" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard
            label="Chores Today"
            value={`${todayApproved}/${todayTotal}`}
            barPct={todayTotal > 0 ? todayApproved / todayTotal : 0}
            barColor="#3dff7a"
            accentBorder="rgba(61,255,122,0.2)"
          />
          <StatCard
            label="Points Today"
            value={todayPoints}
            barPct={todayMaxPoints > 0 ? todayPoints / todayMaxPoints : 0}
            barColor="#f5c842"
            accentBorder="rgba(245,200,66,0.2)"
          />
          <StatCard
            label="Chores This Week"
            value={`${weekApproved}/${weekTotal}`}
            barPct={weekTotal > 0 ? weekApproved / weekTotal : 0}
            barColor="#60b0ff"
            accentBorder="rgba(96,176,255,0.2)"
          />
          <StatCard
            label="Missed This Week"
            value={weekMissed}
            barPct={weekTotal > 0 ? weekMissed / weekTotal : 0}
            barColor="#ff4a4a"
            accentBorder="rgba(255,74,74,0.25)"
            subtitle="zombie damage!"
          />
        </div>
      </section>

      {/* DAILY STREAK */}
      <section>
        <SectionHeader title={`${streakCount} DAY STREAK`} />
        <StreakRow days={streakDays} />
      </section>

      {/* COMPANION CARD */}
      {equippedCompanion && (() => {
        const pet = equippedCompanion.companion
        const todayDone = todayInstances.filter((i) => i.status === 'approved').length
        const mood = todayDone >= 3 ? 'HAPPY' : todayDone >= 1 ? 'CONTENT' : 'HUNGRY'
        const moodColor = mood === 'HAPPY' ? '#3dff7a' : mood === 'CONTENT' ? '#f5c842' : '#ff4a4a'
        return (
          <div
            style={{
              background: '#0d1810',
              border: '1px solid #1a3018',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <PetSprite type={pet.type} color={pet.color} size={36} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontFamily: "'Bungee', sans-serif", fontSize: 12, color: '#fff' }}>
                {pet.name}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4a7a40', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase' }}>
                Companion
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 12, color: moodColor }}>
                {mood}
              </span>
              <p style={{ margin: '2px 0 0', fontSize: 9, color: '#4a7a40', textTransform: 'uppercase' }}>
                mood
              </p>
            </div>
          </div>
        )
      })()}

      {/* SIBLING CHALLENGES */}
      {activeChallenges.length > 0 && (
        <section>
          <SectionHeader title="CHALLENGES" />
          <ChallengeCard challenges={activeChallenges} currentUserId={userId} />
        </section>
      )}

      {/* TODAY'S CHORE CHECKLIST */}
      <DashboardChoreList instances={todayInstancesSerialized} />

      {/* ALLOWANCE EARNED */}
      <section>
        <SectionHeader title="ALLOWANCE EARNED" />
        <div
          style={{
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
            padding: 16,
          }}
        >
          <AllowanceRing
            earnedDollars={earnedDollars}
            goalDollars={goalDollars}
            dailyEarnings={dailyEarnings}
          />
        </div>
      </section>

      {/* FAMILY LEADERBOARD */}
      {leaderboardInitial.length > 1 && (
        <FamilyLeaderboard initial={leaderboardInitial} currentUserId={userId} />
      )}

      </div>{/* end px-4 wrapper */}

      {/* Beta notice */}
      <div
        style={{
          margin: '8px 16px 0',
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(245,200,66,0.05)',
          border: '1px solid rgba(245,200,66,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>🚧</span>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#a08020', textTransform: 'uppercase', letterSpacing: 1 }}>
            Beta — App Under Development
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#5a5020', lineHeight: 1.4 }}>
            Found a bug or have feedback? Use the <span style={{ color: '#f5c842' }}>Report Bug</span> button (bottom-right).
          </p>
        </div>
      </div>

    </main>
  )
}

// ---------------------------------------------------------------------------
// Types (local)
// ---------------------------------------------------------------------------
type ChoreStatus =
  | 'available'
  | 'submitted_complete'
  | 'approved'
  | 'rejected'
  | 'missed'
  | 'expired'
