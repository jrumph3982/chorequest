import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { generateInstances, getWeekBounds } from '@/lib/chores/instances'
import { calcCurrentThreat } from '@/lib/game/base'
import { getActiveEvents, applyEventThreatBump } from '@/lib/game/events'
import { getOrCreateSettings } from '@/lib/game/settings'
import { HouseScene } from '@/components/child/house-scene'
import { SubmitButton } from '@/components/child/submit-button'
import { ThreatPoller } from '@/components/child/threat-poller'
import { MotionWrapper } from '@/components/ui/motion-wrapper'
import { PetSprite } from '@/components/child/PetSprite'
import { ScheduleType, ChoreInstanceStatus } from '@prisma/client'

// Maps difficultyScore 1-10 to 1-3 stars
const DIFF_STARS = (d: number) => Math.max(1, Math.min(3, Math.round(d / 3.5)))

const CHORE_ICON: Record<string, string> = {
  household: '🧹',
  personal:  '🪥',
  outdoor:   '🌿',
  academic:  '📚',
  pets:      '🐾',
  cooking:   '🍳',
}

const STATUS_LABEL: Record<ChoreInstanceStatus, string> = {
  available:           'To Do',
  submitted_complete:  '⏳ Pending',
  approved:            '✓ Done',
  rejected:            '✗ Rejected',
  missed:              '✗ Missed',
  expired:             '— Expired',
}

const STATUS_COLOR: Record<ChoreInstanceStatus, string> = {
  available:           'text-slate-400',
  submitted_complete:  'text-yellow-400',
  approved:            'text-green-400',
  rejected:            'text-red-400',
  missed:              'text-slate-600',
  expired:             'text-slate-700',
}

// XP thresholds per level
const XP_LEVELS = [0, 0, 500, 1500, 3000, 5000, 7500, 10500, 14000, 18000, 22500]

export default async function ChildDashboard() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  await generateInstances(session.userId)

  const { start: weekStart, end: weekEnd } = getWeekBounds(new Date())

  const [child, instances, baseState, childProfile, userAchievements, equippedCompanion] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { level: true, xp: true, gameCurrencyBalance: true, allowanceBalanceCents: true },
    }),
    prisma.choreInstance.findMany({
      where: { childUserId: session.userId, dueDate: { gte: weekStart, lte: weekEnd } },
      include: {
        assignment: {
          include: {
            chore: { select: { title: true, basePoints: true, scheduleType: true, difficultyScore: true, category: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.baseState.findUnique({
      where: { childUserId: session.userId },
      select: {
        survivalStreak: true,
        doorLevel: true, doorDamage: true,
        fenceLevel: true, fenceDamage: true,
        barricadeLevel: true, barricadeDamage: true,
        lightLevel: true, lightDamage: true,
        watchtowerLevel: true, watchtowerDamage: true,
        turretLevel: true, turretDamage: true,
      },
    }),
    prisma.childProfile.findUnique({
      where: { userId: session.userId },
      select: { streakCount: true, hairStyle: true, hairColor: true, skinTone: true, eyeColor: true },
    }),
    prisma.userAchievement.findMany({
      where: { childUserId: session.userId },
      include: { achievement: { select: { name: true, description: true, rewardValue: true } } },
      orderBy: { earnedAt: 'asc' },
    }),
    prisma.userCompanion.findFirst({
      where: { childUserId: session.userId, equipped: true },
      include: { companion: { select: { name: true, type: true, color: true, bonusType: true, bonusValue: true } } },
    }),
  ])

  const approvedCount   = instances.filter((i) => i.status === ChoreInstanceStatus.approved).length
  const activeInstances = instances.filter((i) => i.status === ChoreInstanceStatus.available)
  const totalActive     = instances.filter((i) => i.status !== ChoreInstanceStatus.expired).length
  const doneInstances   = instances.filter(
    (i) => i.status !== ChoreInstanceStatus.available && i.status !== ChoreInstanceStatus.expired,
  )

  const allowanceDollars = ((child?.allowanceBalanceCents ?? 0) / 100).toFixed(2)
  const survivalStreak   = baseState?.survivalStreak ?? 0

  // Leaderboard: find household siblings
  const householdId = session.householdId
  const leaderboard = householdId ? await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: { some: { householdId } },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { choreInstances: { where: { status: 'approved' } } } },
    },
  }) : []
  const leaderboardRanked = [...leaderboard].sort(
    (a, b) => b._count.choreInstances - a._count.choreInstances,
  )

  const [allActiveEvents, settings] = await Promise.all([
    getActiveEvents(),
    getOrCreateSettings(),
  ])
  const activeEvents = settings.eventsEnabled ? allActiveEvents : []
  const baseThreat   = baseState
    ? calcCurrentThreat(baseState.doorDamage, baseState.barricadeDamage, baseState.fenceDamage, baseState.lightDamage)
    : 'none'
  const threat = applyEventThreatBump(baseThreat, activeEvents)

  // XP progress
  const level      = child?.level ?? 1
  const xp         = child?.xp ?? 0
  const xpCurrent  = XP_LEVELS[Math.min(level, XP_LEVELS.length - 1)] ?? 0
  const xpNext     = XP_LEVELS[Math.min(level + 1, XP_LEVELS.length - 1)] ?? xpCurrent
  const xpProgress = xpNext > xpCurrent ? Math.round(((xp - xpCurrent) / (xpNext - xpCurrent)) * 100) : 100

  const primary = '#f29d26'
  const bg      = '#221b10'

  return (
    <MotionWrapper>
      <ThreatPoller />

      <main className="px-4 py-4 space-y-5 pb-4">

        {/* ── Fortification scene + mission overlay ──────────────────── */}
        <div>
          <div className="rounded-xl overflow-hidden border border-[#3dff7a]/20 mb-1">
            <HouseScene
              baseState={baseState ?? {
                doorLevel: 1, doorDamage: 0, fenceLevel: 1, fenceDamage: 0,
                barricadeLevel: 1, barricadeDamage: 0, lightLevel: 1, lightDamage: 0,
                watchtowerLevel: 0, watchtowerDamage: 0, turretLevel: 0, turretDamage: 0,
              }}
              threat={threat}
              equippedCompanions={equippedCompanion
                ? [{ type: equippedCompanion.companion.type, color: equippedCompanion.companion.color }]
                : []}
              activeEventTypes={activeEvents.map((e) => e.type)}
              hairStyle={childProfile?.hairStyle}
              hairColor={childProfile?.hairColor}
              skinTone={childProfile?.skinTone}
              eyeColor={childProfile?.eyeColor}
              sceneHeightPx={300}
            />
          </div>

          {/* Mission panel */}
          <div className="relative z-10 -mt-1">
            <div
              className="relative overflow-hidden rounded-xl border-2 p-4"
              style={{ background: 'rgba(15,23,42,0.92)', borderColor: 'rgba(242,157,38,0.5)', backdropFilter: 'blur(8px)' }}
            >
              <span className="absolute top-3 right-3 flex h-2 w-2 rounded-full animate-pulse" style={{ background: primary }} />
              <div className="flex items-center gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-lg text-2xl"
                  style={{ background: 'rgba(242,157,38,0.2)' }}
                >
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black uppercase italic tracking-tight text-slate-100" style={{ fontFamily: "'Bungee', sans-serif" }}>Active Missions</h3>
                  <p className="text-xs text-slate-400">Complete your chore missions</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${totalActive > 0 ? Math.round((approvedCount / totalActive) * 100) : 0}%`, background: primary }}
                      />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: primary }}>
                      {approvedCount}/{totalActive} Done
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily progress ─────────────────────────────────────────── */}
        <div
          className="rounded-xl p-5 border"
          style={{ background: 'rgba(242,157,38,0.05)', borderColor: 'rgba(242,157,38,0.2)' }}
        >
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(242,157,38,0.7)' }}>Daily Progress</p>
              <h2 className="text-base font-bold text-slate-100">Hero's Journey</h2>
            </div>
            <p className="text-sm font-bold" style={{ color: primary }}>{xp.toLocaleString()} XP</p>
          </div>
          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full rounded-full"
              style={{ width: `${xpProgress}%`, background: primary, boxShadow: '0 0 10px rgba(242,157,38,0.6)' }}
            />
          </div>
        </div>

        {/* ── Active mission cards ────────────────────────────────────── */}
        {activeInstances.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Missions</h3>
              <span className="text-xs font-bold" style={{ color: primary }}>{activeInstances.length} remaining</span>
            </div>
            {activeInstances.map((inst) => {
              const chore = inst.assignment.chore
              const stars = DIFF_STARS(chore.difficultyScore)
              return (
                <div
                  key={inst.id}
                  className="relative rounded-xl border overflow-hidden"
                  style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(242,157,38,0.4)', boxShadow: '0 0 15px -3px rgba(242,157,38,0.4)' }}
                >
                  <div className="flex gap-3 p-4">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0 border text-3xl"
                      style={{ background: 'rgba(242,157,38,0.15)', borderColor: 'rgba(242,157,38,0.35)', boxShadow: '0 0 12px rgba(242,157,38,0.2)' }}
                    >
                      {CHORE_ICON[chore.category] ?? '📋'}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-black text-sm leading-tight text-slate-100" style={{ fontFamily: "'Bungee', sans-serif" }}>{chore.title}</h4>
                        <span className="text-sm shrink-0" style={{ color: primary }}>
                          {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-slate-400" style={{ fontFamily: "'VT323', monospace", fontSize: '1.1rem' }}>⚡ {chore.basePoints} pts</span>
                        <span className="font-bold text-slate-500" style={{ fontFamily: "'VT323', monospace", fontSize: '1.1rem' }}>
                          {chore.scheduleType === ScheduleType.daily ? '📅 DAILY' : '🗓️ WEEKLY'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <SubmitButton instanceId={inst.id} />
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── Completed / pending ─────────────────────────────────────── */}
        {doneInstances.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 px-1">Completed &amp; Pending</h3>
            {doneInstances.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 border"
                style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-sm text-slate-400">{inst.assignment.chore.title}</span>
                <span className={`text-xs font-bold ${STATUS_COLOR[inst.status]}`}>
                  {STATUS_LABEL[inst.status]}
                </span>
              </div>
            ))}
          </section>
        )}

        {instances.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-gray-400 text-sm">No chores assigned yet. Ask a parent to add some!</p>
          </div>
        )}

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 text-center border"
            style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs text-slate-500">Allowance</p>
            <p className="text-lg font-bold text-white mt-0.5">💵 ${allowanceDollars}</p>
          </div>
          <div
            className="rounded-xl p-3 text-center border"
            style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs text-slate-500">Night Streak</p>
            <p className="text-lg font-bold text-blue-400 mt-0.5">🌙 {survivalStreak}d</p>
          </div>
        </div>

        {/* ── Companion ──────────────────────────────────────────────── */}
        {equippedCompanion && (() => {
          const pet = equippedCompanion.companion
          const todayApproved = instances.filter((i) => i.status === ChoreInstanceStatus.approved).length
          const mood = todayApproved >= 3 ? 'HAPPY' : todayApproved >= 1 ? 'CONTENT' : 'HUNGRY'
          const moodColor = mood === 'HAPPY' ? '#3dff7a' : mood === 'CONTENT' ? '#f5c842' : '#ff4a4a'
          return (
            <div
              className="rounded-xl p-3 border flex items-center gap-3"
              style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(61,255,122,0.18)' }}
            >
              <PetSprite type={pet.type} color={pet.color} size={40} />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-100" style={{ fontFamily: "'Bungee', sans-serif" }}>{pet.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Companion · +{pet.bonusValue} {pet.bonusType}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold" style={{ color: moodColor, fontFamily: "'Bungee', sans-serif" }}>{mood}</span>
                <p className="text-[9px] text-slate-600 uppercase">mood</p>
              </div>
            </div>
          )
        })()}

        {/* ── Achievements ───────────────────────────────────────────── */}
        {userAchievements.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🏆 Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {userAchievements.map((ua) => (
                <div
                  key={ua.achievementId}
                  className="rounded-xl px-3 py-2 flex items-center gap-1.5 border"
                  style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
                  title={ua.achievement.description}
                >
                  <span className="text-base">{ua.achievement.rewardValue}</span>
                  <span className="text-xs text-gray-300 font-medium">{ua.achievement.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Leaderboard ──────────────────────────────────────────────── */}
        {leaderboardRanked.length > 1 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">🏆 Leaderboard</h2>
              <Link href="/play/leaderboard" className="text-[10px] font-bold uppercase tracking-wider text-[#f29d26]">
                View all
              </Link>
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {leaderboardRanked.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    background: r.id === session.userId ? 'rgba(242,157,38,0.06)' : undefined,
                    borderBottom: i < leaderboardRanked.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                  }}
                >
                  <span className="text-sm w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                  <span className={`text-sm font-semibold flex-1 ${r.id === session.userId ? 'text-[#f29d26]' : 'text-slate-300'}`}>
                    {r.name}{r.id === session.userId ? ' (you)' : ''}
                  </span>
                  <span className="text-sm font-bold text-slate-400">{r._count.choreInstances} chores</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Quick nav tiles ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: '/play/base',       icon: '🏠', label: 'Your Base',    accent: false },
            { href: '/play/bonus',      icon: '⭐', label: 'Bonus',        accent: false },
            { href: '/play/story',      icon: '📖', label: 'Story',        accent: false },
            { href: '/play/appearance', icon: '👤', label: 'Appearance',   accent: false },
            { href: '/play/leaderboard', icon: '🏆', label: 'Leaderboard',  accent: false },
            { href: '/play/zombie',      icon: '☣',  label: 'Zombie Defense', accent: true },
          ].map(({ href, icon, label, accent }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-4 py-3 flex items-center justify-between border transition-colors hover:border-slate-600"
              style={{
                background: accent ? 'rgba(249,115,22,0.08)' : 'rgba(15,23,42,0.4)',
                borderColor: accent ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <span className={`text-sm font-medium ${accent ? 'text-orange-400' : 'text-slate-300'}`}>{icon} {label}</span>
              <span className="text-xs text-slate-600">→</span>
            </Link>
          ))}
        </div>
      </main>
    </MotionWrapper>
  )
}
