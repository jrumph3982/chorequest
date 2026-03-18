export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getWeekBounds } from '@/lib/chores/instances'
import { FinalizeWeekButton } from '@/components/admin/finalize-week-button'
import { calcRewards } from '@/lib/chores/rewards'
import { getOrCreateSettings } from '@/lib/game/settings'

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export default async function WeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>
}) {
  const session = await getSession()
  const { weekStart: weekStartParam } = await searchParams

  const now = new Date()
  const targetDate = weekStartParam
    ? parseLocalDate(weekStartParam)
    : now

  const { start: weekStart, end: weekEnd } = getWeekBounds(targetDate)

  const prevWeekStr = isoDate(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))
  const nextWeekStr = isoDate(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))
  const isCurrentWeek = weekStart <= now && now <= weekEnd

  const children = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: {
        some: { household: { members: { some: { userId: session.userId } } } },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const settings = await getOrCreateSettings(session.householdId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar

  const summaries = await Promise.all(
    children.map(async (child) => {
      const [instances, bonusRequests, ledger] = await Promise.all([
        prisma.choreInstance.findMany({
          where: { childUserId: child.id, dueDate: { gte: weekStart, lte: weekEnd } },
          select: { status: true, pointsAwarded: true },
        }),
        prisma.bonusRequest.findMany({
          where: { childUserId: child.id, submittedAt: { gte: weekStart, lte: weekEnd } },
          select: { status: true, approvedPoints: true, requestedPoints: true },
        }),
        prisma.weeklyLedger.findUnique({
          where: { childUserId_weekStart: { childUserId: child.id, weekStart } },
        }),
      ])

      const approved = instances.filter((i) => i.status === 'approved')
      const pending  = instances.filter((i) => i.status === 'submitted_complete')
      const rejected = instances.filter((i) => i.status === 'rejected')
      const notDone  = instances.filter((i) => i.status === 'available' || i.status === 'missed')

      const chorePoints = approved.reduce((s, i) => s + (i.pointsAwarded ?? 0), 0)
      const bonusPoints = bonusRequests
        .filter((b) => b.status === 'approved')
        .reduce((s, b) => s + (b.approvedPoints ?? 0), 0)
      const totalPoints = chorePoints + bonusPoints
      const { xp: xpEarned, allowanceCents } = calcRewards(totalPoints, { allowancePointsPerDollar })
      const pendingBonus = bonusRequests.filter((b) => b.status === 'pending').length

      return {
        child,
        approved: approved.length,
        pending:  pending.length,
        rejected: rejected.length,
        notDone:  notDone.length,
        pendingBonus,
        totalPoints,
        allowanceCents,
        xpEarned,
        ledger,
      }
    }),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Weekly Review</h1>
          <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
            {fmtDate(weekStart)} – {fmtDate(weekEnd)}
            {isCurrentWeek && (
              <span className="text-[10px] bg-[#3b82f6]/15 text-[#3b82f6] px-2 py-0.5 rounded-full font-bold uppercase">
                Current Week
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/weekly-review?weekStart=${prevWeekStr}`}
            className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors"
          >
            ← Prev
          </Link>
          <Link
            href={`/admin/weekly-review?weekStart=${nextWeekStr}`}
            className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors"
          >
            Next →
          </Link>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">No children added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map((s) => (
            <div key={s.child.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
              <h2 className="text-base font-bold text-slate-100 mb-4">{s.child.name}</h2>

              {/* Status breakdown */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#22c55e]">{s.approved}</p>
                  <p className="text-[10px] text-[#22c55e]/70 font-semibold uppercase mt-0.5">
                    Approved
                  </p>
                </div>
                <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#f59e0b]">{s.pending}</p>
                  <p className="text-[10px] text-[#f59e0b]/70 font-semibold uppercase mt-0.5">
                    Pending
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{s.rejected}</p>
                  <p className="text-[10px] text-red-400/70 font-semibold uppercase mt-0.5">
                    Rejected
                  </p>
                </div>
                <div className="bg-slate-700/30 border border-slate-600/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-400">{s.notDone}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                    Not Done
                  </p>
                </div>
              </div>

              {s.pendingBonus > 0 && (
                <p className="text-xs text-[#f29d26] mb-3">
                  ⭐ {s.pendingBonus} bonus request{s.pendingBonus > 1 ? 's' : ''} still pending
                </p>
              )}

              <div className="flex items-end justify-between gap-4 flex-wrap border-t border-[#334155] pt-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Points
                    </p>
                    <p className="text-xl font-bold text-slate-100">{s.totalPoints}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Allowance
                    </p>
                    <p className="text-xl font-bold text-[#22c55e]">
                      ${(s.allowanceCents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      XP
                    </p>
                    <p className="text-xl font-bold text-[#3b82f6]">{s.xpEarned}</p>
                  </div>
                </div>
                <FinalizeWeekButton
                  childUserId={s.child.id}
                  weekStart={isoDate(weekStart)}
                  alreadyFinalized={!!s.ledger}
                />
              </div>

              {s.ledger && (
                <div className="mt-3 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg px-4 py-3 text-xs text-[#22c55e]">
                  Finalized {fmtDate(new Date(s.ledger.approvedAt))} · {s.ledger.approvedPointsTotal}{' '}
                  pts · ${(s.ledger.allowanceCentsAwarded / 100).toFixed(2)} allowance ·{' '}
                  {s.ledger.xpAwarded} XP · {s.ledger.gameCurrencyAwarded} Scrap
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
