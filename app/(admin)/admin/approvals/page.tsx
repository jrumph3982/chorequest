export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ApprovalsGroupedClient, type ChildSection } from '@/components/admin/ApprovalsGroupedClient'
import { UndoApprovalButton } from '@/components/admin/undo-approval-button'
import { ResetDayButton } from '@/components/admin/reset-day-button'
import { TodayApprovalActions } from '@/components/admin/today-approval-actions'
import { calcRewards } from '@/lib/chores/rewards'
import { getOrCreateSettings } from '@/lib/game/settings'

export default async function ApprovalsPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') redirect('/login')

  const { householdId, userId } = session

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayLabel = todayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const historyStart = new Date()
  historyStart.setDate(historyStart.getDate() - 30)
  historyStart.setHours(0, 0, 0, 0)

  const householdFilter = {
    child: {
      householdMembers: {
        some: { household: { members: { some: { userId } } } },
      },
    },
  }

  const settings = await getOrCreateSettings(householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar

  const [pendingInstances, allChildren, todayApproved, recentApproved] = await Promise.all([
    // All submitted_complete instances in this household
    prisma.choreInstance.findMany({
      where: { status: 'submitted_complete', ...householdFilter },
      orderBy: { submittedAt: 'asc' },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            childProfile: {
              select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true },
            },
          },
        },
        assignment: { include: { chore: { select: { id: true, title: true, basePoints: true } } } },
      },
    }),

    // All children in this household (for sections with 0 pending)
    householdId
      ? prisma.user.findMany({
          where: { role: 'child', householdMembers: { some: { householdId } } },
          select: {
            id: true,
            name: true,
            childProfile: {
              select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true },
            },
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([] as { id: string; name: string; childProfile: { hairStyle: string | null; hairColor: string | null; skinTone: string | null; eyeColor: string | null; gender: string | null } | null }[]),

    // Today's approved (for history section)
    prisma.choreInstance.findMany({
      where: { status: 'approved', reviewedAt: { gte: todayStart }, ...householdFilter },
      orderBy: { reviewedAt: 'desc' },
      include: {
        child: { select: { id: true, name: true } },
        assignment: { include: { chore: { select: { id: true, title: true, basePoints: true } } } },
      },
    }),

    // 30-day history
    prisma.choreInstance.findMany({
      where: { status: 'approved', reviewedAt: { gte: historyStart, lt: todayStart }, ...householdFilter },
      orderBy: { reviewedAt: 'desc' },
      take: 100,
      include: {
        child: { select: { id: true, name: true } },
        assignment: { include: { chore: { select: { id: true, title: true, basePoints: true } } } },
      },
    }),
  ])

  // ── Group history by child ─────────────────────────────────────────────────────

  function groupByChild<T extends { child: { id: string; name: string } }>(items: T[]) {
    const map = new Map<string, { childId: string; childName: string; items: T[] }>()
    for (const item of items) {
      const existing = map.get(item.child.id)
      if (existing) { existing.items.push(item) }
      else { map.set(item.child.id, { childId: item.child.id, childName: item.child.name, items: [item] }) }
    }
    return Array.from(map.values()).sort((a, b) => a.childName.localeCompare(b.childName))
  }

  const todayByChild   = groupByChild(todayApproved)
  const recentByChild  = groupByChild(recentApproved)

  // ── Build child sections ──────────────────────────────────────────────────────

  const sectionMap = new Map<string, ChildSection>()

  // Seed with all children (0-pending sections)
  for (const child of allChildren) {
    sectionMap.set(child.id, {
      childId: child.id,
      childName: child.name,
      childProfile: {
        skinTone: child.childProfile?.skinTone ?? null,
        hairColor: child.childProfile?.hairColor ?? null,
        eyeColor: child.childProfile?.eyeColor ?? null,
        gender: child.childProfile?.gender ?? null,
      },
      instances: [],
    })
  }

  // Add pending instances to their child's section
  for (const inst of pendingInstances) {
    let section = sectionMap.get(inst.child.id)
    if (!section) {
      section = {
        childId: inst.child.id,
        childName: inst.child.name,
        childProfile: {
          skinTone: inst.child.childProfile?.skinTone ?? null,
          hairColor: inst.child.childProfile?.hairColor ?? null,
          eyeColor: inst.child.childProfile?.eyeColor ?? null,
          gender: inst.child.childProfile?.gender ?? null,
        },
        instances: [],
      }
      sectionMap.set(inst.child.id, section)
    }
    section.instances.push({
      id: inst.id,
      choreTitle: inst.assignment.chore.title,
      basePoints: inst.assignment.chore.basePoints,
      submittedAt: inst.submittedAt?.toISOString() ?? null,
      notes: inst.notes ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proofImageUrl: (inst as any).proofImageUrl ?? null,
      reviewedAt: inst.reviewedAt?.toISOString() ?? null,
    })
  }

  // Sort: children with pending first, then alphabetically
  const childSections = Array.from(sectionMap.values()).sort((a, b) => {
    if (a.instances.length > 0 && b.instances.length === 0) return -1
    if (a.instances.length === 0 && b.instances.length > 0) return 1
    return a.childName.localeCompare(b.childName)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Approvals
            {pendingInstances.length > 0 && (
              <span className="bg-[#f29d26] text-slate-900 text-sm font-bold px-2 py-0.5 rounded-full">
                {pendingInstances.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Verify completed missions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Today: {todayLabel}</span>
          <ResetDayButton />
        </div>
      </div>

      {/* Grouped child accordion */}
      <ApprovalsGroupedClient children={childSections} />

      {/* History divider */}
      {(todayApproved.length > 0 || recentApproved.length > 0) && (
        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-[#334155]" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Approval History</span>
          <div className="h-px flex-1 bg-[#334155]" />
        </div>
      )}

      {/* Today's Approved — grouped by child */}
      {todayByChild.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span className="text-[#22c55e]">✓</span> Approved Today ({todayApproved.length})
          </h2>
          {todayByChild.map(({ childId, childName, items }) => {
            const totalPts = items.reduce((s, i) => s + (i.pointsAwarded ?? i.assignment.chore.basePoints), 0)
            const totalAllowance = items.reduce((s, i) => {
              const pts = i.pointsAwarded ?? i.assignment.chore.basePoints
              return s + calcRewards(pts, { allowancePointsPerDollar }).allowanceCents
            }, 0)
            return (
              <details key={childId} open className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg bg-[#1e293b] border border-[#22c55e]/20 list-none">
                  <span className="text-sm font-bold text-slate-200">{childName}</span>
                  <span className="text-[10px] font-bold text-[#22c55e] ml-auto">${(totalAllowance / 100).toFixed(2)} earned</span>
                  <span className="text-[10px] text-slate-500">{items.length} chore{items.length !== 1 ? 's' : ''}</span>
                  <span className="text-slate-500 text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="ml-3 mt-1 space-y-1">
                  {items.map((inst) => {
                    const pts = inst.pointsAwarded ?? inst.assignment.chore.basePoints
                    const { xp, allowanceCents } = calcRewards(pts, { allowancePointsPerDollar })
                    return (
                      <div key={inst.id} className="bg-[#0f172a] border border-[#22c55e]/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-200 truncate block">{inst.assignment.chore.title}</span>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-500">
                              {inst.reviewedAt ? new Date(inst.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <span className="text-[10px] text-[#3b82f6]">⭐ +{xp} XP</span>
                            <span className="text-[10px] text-[#22c55e]">💵 +${(allowanceCents / 100).toFixed(2)}</span>
                            <span className="text-[10px] text-[#f29d26]">🔩 {pts} pts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TodayApprovalActions instanceId={inst.id} currentPoints={pts} />
                          <UndoApprovalButton instanceId={inst.id} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="px-4 py-2 text-[10px] text-slate-500 font-medium">
                    Subtotal: {totalPts} pts · ${(totalAllowance / 100).toFixed(2)}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* 30-day history — grouped by child */}
      {recentByChild.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span className="text-slate-600">✓</span> Past 30 Days ({recentApproved.length})
          </h2>
          {recentByChild.map(({ childId, childName, items }) => {
            const totalPts = items.reduce((s, i) => s + (i.pointsAwarded ?? i.assignment.chore.basePoints), 0)
            const totalAllowance = items.reduce((s, i) => {
              const pts = i.pointsAwarded ?? i.assignment.chore.basePoints
              return s + calcRewards(pts, { allowancePointsPerDollar }).allowanceCents
            }, 0)
            return (
              <details key={childId} className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-lg bg-[#1e293b] border border-[#334155] list-none">
                  <span className="text-sm font-bold text-slate-300">{childName}</span>
                  <span className="text-[10px] font-bold text-[#f5c842] ml-auto">${(totalAllowance / 100).toFixed(2)} total</span>
                  <span className="text-[10px] text-slate-500">{items.length} chore{items.length !== 1 ? 's' : ''}</span>
                  <span className="text-slate-500 text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="ml-3 mt-1 space-y-1">
                  {items.map((inst) => {
                    const pts = inst.pointsAwarded ?? inst.assignment.chore.basePoints
                    const { xp, allowanceCents } = calcRewards(pts, { allowancePointsPerDollar })
                    return (
                      <div key={inst.id} className="bg-[#0f172a] border border-[#334155]/60 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-300 truncate block">{inst.assignment.chore.title}</span>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-500">{inst.reviewedAt ? new Date(inst.reviewedAt).toLocaleDateString() : ''}</span>
                            <span className="text-[10px] text-[#3b82f6]">⭐ +{xp} XP</span>
                            <span className="text-[10px] text-[#22c55e]">💵 +${(allowanceCents / 100).toFixed(2)}</span>
                            <span className="text-[10px] text-[#f29d26]">🔩 {pts} pts</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div className="px-4 py-2 text-[10px] text-slate-500 font-medium">
                    Month total: {items.length} chores · {totalPts} pts · ${(totalAllowance / 100).toFixed(2)}
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
