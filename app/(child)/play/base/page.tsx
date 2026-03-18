import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getOrCreateBaseState, simulateNightAttack, calcCurrentThreat, UPGRADE_COSTS, MAX_COMPONENT_LEVEL } from '@/lib/game/base'
import { getWeekBounds } from '@/lib/chores/instances'
import { parseGearStats, calcGearBonus, calcCompanionBonus, calcBaseHealth, calcSurvivalScore } from '@/lib/game/score'
import { getActiveEvents, applyEventThreatBump, calcStormVisibilityPenalty, EVENT_ICON, EVENT_COLOR } from '@/lib/game/events'
import { getOrCreateSettings } from '@/lib/game/settings'
import { BaseExteriorScene } from '@/components/child/BaseExteriorScene'
import { RepairButton } from '@/components/child/repair-button'
import { UpgradeButton } from '@/components/child/upgrade-button'
import { ThreatPoller } from '@/components/child/threat-poller'
import { PetSprite } from '@/components/child/PetSprite'
import { checkAndAwardAchievements } from '@/lib/game/achievements'
import { buildEquippedGearSlots } from '@/lib/gear/slots'
import { BaseRaidReport } from '@/components/child/BaseRaidReport'
import type { ChoreInstanceStatus } from '@prisma/client'

const THREAT_BADGE: Record<string, { bg: string; label: string; emoji: string; barColor: string }> = {
  none:     { bg: 'border-green-500/50 bg-green-500/10 text-green-400',     label: 'All Clear', emoji: '🟢', barColor: 'bg-green-500'  },
  low:      { bg: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',  label: 'Low',       emoji: '🟡', barColor: 'bg-yellow-500' },
  moderate: { bg: 'border-orange-500/50 bg-orange-500/10 text-orange-400',  label: 'Moderate',  emoji: '🟠', barColor: 'bg-orange-500' },
  high:     { bg: 'border-red-500/50 bg-red-500/10 text-red-400',           label: 'High',      emoji: '🔴', barColor: 'bg-red-500'    },
  critical: { bg: 'border-red-700/50 bg-red-700/10 text-red-300 animate-pulse', label: 'Critical', emoji: '💀', barColor: 'bg-red-600' },
}

const MISSION_ICON: Record<ChoreInstanceStatus, string> = {
  approved: '✔', submitted_complete: '⏳', available: '✘', rejected: '✘', missed: '✘', expired: '—',
}
const MISSION_COLOR: Record<ChoreInstanceStatus, string> = {
  approved: 'text-green-400', submitted_complete: 'text-yellow-400', available: 'text-red-400',
  rejected: 'text-red-500', missed: 'text-slate-600', expired: 'text-slate-700',
}

function HealthBar({ damage }: { damage: number }) {
  const pct = Math.max(0, 100 - damage)
  const color = pct > 70 ? '#3dff7a' : pct > 40 ? '#f5c842' : '#ff4a4a'
  const glow = pct > 70
    ? '0 0 8px rgba(61,255,122,0.4)'
    : pct > 40
    ? '0 0 8px rgba(245,200,66,0.4)'
    : '0 0 8px rgba(255,74,74,0.4)'
  return (
    <div style={{ width: '100%', background: '#0a140a', borderRadius: 99, height: 8, overflow: 'hidden', border: '1px solid #1a3018' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          boxShadow: glow,
          borderRadius: 99,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  )
}

export default async function BasePage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  await getOrCreateBaseState(session.userId)
  await simulateNightAttack(session.userId)
  await checkAndAwardAchievements(session.userId)
  const settings = await getOrCreateSettings(session.householdId)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayEnd = new Date(yesterdayStart)
  yesterdayEnd.setHours(23, 59, 59, 999)

  const { start: weekStart, end: weekEnd } = getWeekBounds(new Date())

  const [baseState, child, todayInstances, recentAttacks, weekPoints, equippedGear, equippedCompanions, childProfile, missedYesterday] =
    await Promise.all([
      prisma.baseState.findUnique({ where: { childUserId: session.userId } })!,
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { level: true, gameCurrencyBalance: true },
      }),
      prisma.choreInstance.findMany({
        where: { childUserId: session.userId, dueDate: { gte: todayStart, lte: todayEnd } },
        include: { assignment: { include: { chore: { select: { title: true } } } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.dailyBaseDamage.findMany({
        where: { childUserId: session.userId },
        orderBy: { date: 'desc' },
        take: 7,
      }),
      prisma.choreInstance.aggregate({
        where: {
          childUserId: session.userId,
          status: 'approved',
          dueDate: { gte: weekStart, lte: weekEnd },
        },
        _sum: { pointsAwarded: true },
      }),
      prisma.userInventory.findMany({
        where: { childUserId: session.userId, equipped: true },
        include: { inventoryItem: { select: { statsJson: true, cosmeticSlot: true, slug: true } } },
      }),
      prisma.userCompanion.findMany({
        where: { childUserId: session.userId, equipped: true },
        include: { companion: { select: { name: true, type: true, color: true, bonusType: true, bonusValue: true } } },
      }),
      prisma.childProfile.findUnique({
        where: { userId: session.userId },
        select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true } as any,
      }),
      prisma.choreInstance.count({
        where: { childUserId: session.userId, status: 'missed', dueDate: { gte: yesterdayStart, lte: yesterdayEnd } },
      }),
    ])

  if (!baseState) return null

  const baseThreat = calcCurrentThreat(
    baseState.doorDamage, baseState.barricadeDamage, baseState.fenceDamage, baseState.lightDamage,
  )
  const allActiveEvents = await getActiveEvents()
  const activeEvents = settings.eventsEnabled ? allActiveEvents : []
  const threat = applyEventThreatBump(baseThreat, activeEvents)
  const activeEventTypes = activeEvents.map((e) => e.type)
  const lastNightOverrun = recentAttacks[0]?.attackResult === 'overrun'
  const scrap = child?.gameCurrencyBalance ?? 0
  const chorePoints = weekPoints._sum.pointsAwarded ?? 0
  const baseHealth = calcBaseHealth(
    baseState.doorDamage, baseState.barricadeDamage, baseState.fenceDamage, baseState.lightDamage,
  )
  const gearBonus = settings.gearBonusesEnabled
    ? calcGearBonus(equippedGear.map((g) => parseGearStats(g.inventoryItem.statsJson))) : 0
  const companionBonus = settings.companionBonusesEnabled
    ? calcCompanionBonus(equippedCompanions.map((c) => c.companion)) : 0
  const stormPenalty = calcStormVisibilityPenalty(gearBonus, activeEvents)
  const survivalScore = Math.max(
    0, calcSurvivalScore({ chorePoints, baseHealth, gearBonus, companionBonus, threat }) - stormPenalty,
  )
  const threatBadge = THREAT_BADGE[threat] ?? THREAT_BADGE.none

  // Build gear slots for avatar rendering
  const equippedGearSlots = {
    head:      null,
    top:       null,
    accessory: null,
    backpack:  null,
    handheld:  null,
    ...buildEquippedGearSlots(equippedGear as any),
  }

  const components = [
    { key: 'door'       as const, label: 'Board Windows', icon: '🚪', level: baseState.doorLevel,       damage: baseState.doorDamage,       desc: 'Seals entry points'  },
    { key: 'fence'      as const, label: 'Walls',          icon: '🧱', level: baseState.fenceLevel,      damage: baseState.fenceDamage,       desc: 'Outer perimeter'     },
    { key: 'barricade'  as const, label: 'Barricades',     icon: '⚡', level: baseState.barricadeLevel,  damage: baseState.barricadeDamage,   desc: 'Buzzer trap network' },
    { key: 'light'      as const, label: 'Flood Lights',   icon: '💡', level: baseState.lightLevel,      damage: baseState.lightDamage,       desc: 'Night visibility'    },
    ...(baseState.watchtowerLevel > 0
      ? [{ key: 'watchtower' as const, label: 'Watch Tower', icon: '🗼', level: baseState.watchtowerLevel, damage: baseState.watchtowerDamage, desc: 'Advanced recon'    }]
      : []),
    ...(baseState.turretLevel > 0
      ? [{ key: 'turret' as const, label: 'Auto Turret',   icon: '🔫', level: baseState.turretLevel,     damage: baseState.turretDamage,      desc: 'Auto defense'      }]
      : []),
  ]

  return (
    <div className="flex flex-col min-h-screen text-slate-100 relative" style={{ background: '#060a06' }}>
      {/* Red vignette overlay for high/critical threat */}
      {(threat === 'high' || threat === 'critical') && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(220,30,30,0.28) 100%)',
            animation: threat === 'critical' ? 'zombie-sway 3s ease-in-out infinite' : undefined,
          }}
        />
      )}
      <ThreatPoller />

      {/* Top Defense Status Bar */}
      <div className="z-20 px-4 pt-4 pb-3">
        <div
          className="rounded-xl p-4"
          style={{
            background: '#0d1610',
            border: '1px solid #1a3018',
            borderTop: '3px solid #f5c842',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h1
                style={{
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: 15,
                  letterSpacing: 1,
                  color: '#f5c842',
                  margin: 0,
                }}
              >
                FORTIFICATION
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <p
                style={{
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: 18,
                  color: baseHealth > 70 ? '#3dff7a' : baseHealth > 40 ? '#f5c842' : '#ff4a4a',
                  margin: 0,
                }}
              >
                {baseHealth}%
              </p>
              <span style={{ color: '#4a6a4a', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>SECURE</span>
            </div>
          </div>
          <HealthBar damage={100 - baseHealth} />
          <div className="flex items-center justify-between mt-2">
            <p style={{ color: '#4a6a4a', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              {threat === 'none' ? '✓ Base is secure' : `⚠ ${threatBadge.label} threat`}
            </p>
            <div className="flex items-center gap-2">
              <span style={{ color: '#4a7a40', fontSize: 11, fontWeight: 700 }}>🔩 {scrap.toLocaleString()}</span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${threatBadge.bg}`}>
                {threatBadge.emoji} {threatBadge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exterior base scene */}
      <div className="relative mx-4 rounded-xl overflow-hidden border border-[#3dff7a]/20 mb-3">
        <BaseExteriorScene
          threat={threat}
          baseHealth={baseHealth}
          companion={equippedCompanions[0]?.companion
            ? { type: equippedCompanions[0].companion.type, color: equippedCompanions[0].companion.color }
            : null}
        />
      </div>

      {/* Active event banners */}
      {activeEvents.length > 0 && (
        <div className="px-4 mb-3 space-y-1.5">
          {activeEvents.map((ev) => (
            <div
              key={ev.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-xs font-medium ${EVENT_COLOR[ev.type] ?? 'border-slate-800 bg-slate-900 text-slate-300'}`}
            >
              <span>{EVENT_ICON[ev.type] ?? '🌍'}</span>
              <span>{ev.name}</span>
              <span className="ml-auto opacity-60">
                {ev.type === 'winter_storm'
                  ? `+${ev.difficultyModifier} threat · −${stormPenalty} vis`
                  : `+${ev.difficultyModifier} threat`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Equipped companion */}
      {equippedCompanions.length > 0 && (() => {
        const pet = equippedCompanions[0].companion
        return (
          <div className="px-4 mb-3">
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: '#0d1810', border: '1px solid rgba(61,255,122,0.25)' }}
            >
              <PetSprite type={pet.type} color={pet.color} size={40} />
              <div className="flex-1">
                <p style={{ margin: 0, fontFamily: "'Bungee', sans-serif", fontSize: 13, color: '#fff' }}>{pet.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4a7a40', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Companion · +{pet.bonusValue} {pet.bonusType}
                </p>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#3dff7a', fontFamily: "'Bungee', sans-serif", textTransform: 'uppercase', letterSpacing: 1 }}>ACTIVE</span>
            </div>
          </div>
        )
      })()}

      {/* Base Upgrade Shop */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <h3
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#ff6b00',
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            BASE UPGRADES
          </h3>
          <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
          <span style={{ color: '#4a7a40', fontSize: 11, fontWeight: 700 }}>🔩 {scrap.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {components.map((c) => {
            const health = Math.max(0, 100 - c.damage)
            const needsRepair = c.damage > 0
            const canUpgrade = c.level < MAX_COMPONENT_LEVEL
            const upgradeCost = UPGRADE_COSTS[c.level as keyof typeof UPGRADE_COSTS] ?? 9999
            const isMaxed = !canUpgrade && !needsRepair

            return (
              <div
                key={c.key}
                className="flex flex-col rounded-xl overflow-hidden"
                style={{
                  background: '#0d1810',
                  border: `1px solid ${isMaxed ? 'rgba(61,255,122,0.25)' : needsRepair ? 'rgba(255,74,74,0.3)' : '#1a3018'}`,
                  borderTop: `3px solid ${isMaxed ? '#3dff7a' : needsRepair ? '#ff4a4a' : '#f5c842'}`,
                }}
              >
                {/* Icon area */}
                <div className="relative flex items-center justify-center py-4"
                     style={{ background: isMaxed ? 'rgba(61,255,122,0.05)' : needsRepair ? 'rgba(255,74,74,0.05)' : 'rgba(245,200,66,0.04)' }}>
                  <span className="text-4xl">{c.icon}</span>
                  {/* Level badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded"
                       style={{ background: '#0d1810', border: '1px solid #2a5028' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#4a7a40', fontFamily: "'Bungee', sans-serif" }}>L{c.level}</span>
                  </div>
                  {/* Status badge */}
                  {isMaxed && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded"
                         style={{ background: 'rgba(61,255,122,0.2)', border: '1px solid #3dff7a' }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#3dff7a' }}>MAX</span>
                    </div>
                  )}
                  {needsRepair && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded"
                         style={{ background: 'rgba(255,74,74,0.2)', border: '1px solid #ff4a4a' }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#ff4a4a' }}>DMG</span>
                    </div>
                  )}
                  {/* Health bar */}
                  <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: '#0a140a' }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${health}%`,
                        background: health > 70 ? '#3dff7a' : health > 40 ? '#f5c842' : '#ff4a4a',
                      }}
                    />
                  </div>
                </div>

                {/* Info + buttons */}
                <div className="p-3 flex flex-col flex-1">
                  <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: '#c8e0c0', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</h4>
                  <p style={{ fontSize: 9, color: '#2a4a28', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.desc}</p>

                  {/* Upgrade cost */}
                  {canUpgrade && (
                    <div className="flex items-center gap-1 mb-2"
                         style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.15)', borderRadius: 6, padding: '3px 6px' }}>
                      <span style={{ fontSize: 10 }}>🔩</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#4a7a40' }}>{upgradeCost} scrap</span>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-1.5">
                    {needsRepair && (
                      <RepairButton component={c.key} currentDamage={c.damage} scrap={scrap} />
                    )}
                    {canUpgrade && (
                      <UpgradeButton component={c.key} currentLevel={c.level} scrap={scrap} />
                    )}
                    {isMaxed && (
                      <div className="text-center py-1.5 rounded-lg"
                           style={{ background: 'rgba(61,255,122,0.08)', border: '1px solid rgba(61,255,122,0.2)', fontSize: 9, fontWeight: 900, color: '#3dff7a', textTransform: 'uppercase', letterSpacing: 1 }}>
                        ✓ MAXED OUT
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's Missions */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 style={{ fontFamily: "'Bungee', sans-serif", color: '#ff6b00', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            TODAY&apos;S MISSIONS
          </h3>
          <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: '#0d1810', border: '1px solid #1a3018' }}>
          {todayInstances.length === 0 ? (
            <p style={{ color: '#2a4a28', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No missions today.</p>
          ) : (
            <div>
              {todayInstances.map((inst, idx) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderBottom: idx < todayInstances.length - 1 ? '1px solid #1a3018' : 'none',
                    minHeight: 48,
                  }}
                >
                  <span style={{ fontSize: 13, color: inst.status === 'approved' ? '#4a6a4a' : '#c8e0c0', textDecoration: inst.status === 'approved' ? 'line-through' : 'none' }}>
                    {inst.assignment.chore.title}
                  </span>
                  <span className={`text-base font-bold ${MISSION_COLOR[inst.status]}`}>{MISSION_ICON[inst.status]}</span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/play"
            className="block text-center py-3 transition-colors"
            style={{ borderTop: '1px solid #1a3018', color: '#f5c842', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            → View All Missions
          </Link>
        </div>
      </div>

      {/* ── Base Raid Report ──────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <BaseRaidReport
          lastNight={recentAttacks[0] ? {
            attackResult: recentAttacks[0].attackResult,
            zombieThreat: recentAttacks[0].zombieThreat,
            doorDamage: recentAttacks[0].doorDamage,
            barricadeDamage: recentAttacks[0].barricadeDamage,
            fenceDamage: recentAttacks[0].fenceDamage,
            lightDamage: recentAttacks[0].lightDamage,
          } : null}
          components={components.map(c => ({ key: c.key, label: c.label, icon: c.icon, damage: c.damage, level: c.level }))}
          scrap={scrap}
          missedYesterday={missedYesterday}
        />
      </div>

      {/* Recent Nights */}
      {recentAttacks.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 style={{ fontFamily: "'Bungee', sans-serif", color: '#ff6b00', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
              RECENT NIGHTS
            </h3>
            <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#0d1810', border: '1px solid #1a3018' }}
          >
            {recentAttacks.map((a, idx) => {
              const totalDmg = a.doorDamage + a.barricadeDamage + a.fenceDamage + a.lightDamage
              const b = THREAT_BADGE[a.zombieThreat] ?? THREAT_BADGE.none
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderBottom: idx < recentAttacks.length - 1 ? '1px solid #1a3018' : 'none',
                    minHeight: 44,
                  }}
                >
                  <span style={{ fontSize: 11, color: '#4a6a4a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-2">
                    {a.attackResult === 'barely_survived' && (
                      <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', padding: '2px 6px', borderRadius: 99, fontSize: 9, fontWeight: 900 }}>⚠ BARELY</span>
                    )}
                    {a.attackResult === 'overrun' && (
                      <span className="animate-pulse" style={{ background: 'rgba(255,74,74,0.15)', border: '1px solid rgba(255,74,74,0.4)', color: '#ff4a4a', padding: '2px 6px', borderRadius: 99, fontSize: 9, fontWeight: 900 }}>💀 OVERRUN</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] border ${b.bg}`}>
                      {b.emoji} {b.label}
                    </span>
                    {totalDmg > 0 && <span style={{ color: '#ff4a4a', fontSize: 11, fontWeight: 700 }}>-{totalDmg}hp</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
