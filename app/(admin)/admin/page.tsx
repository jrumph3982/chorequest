import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getWeekBounds } from '@/lib/chores/instances'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'

export default async function AdminDashboard() {
  const session = await getSession()

  // Redirect to onboarding if not completed
  const onboardingCheck = await prisma.household.findFirst({
    where: { members: { some: { userId: session.userId } } },
    select: { onboardingComplete: true },
  })
  if (onboardingCheck && !onboardingCheck.onboardingComplete) {
    redirect('/admin/onboarding')
  }
  const { start: weekStart, end: weekEnd } = getWeekBounds(new Date())

  const [
    pendingApprovals,
    pendingBonus,
    activeChores,
    household,
    weeklyStats,
    recentPending,
    children,
    weekAllowance,
  ] = await Promise.all([
    prisma.choreInstance.count({ where: { status: 'submitted_complete' } }),
    prisma.bonusRequest.count({ where: { status: 'pending' } }),
    prisma.chore.count({ where: { active: true } }),
    prisma.household.findFirst({
      where: { members: { some: { userId: session.userId } } },
      select: { householdCode: true, displayName: true },
    }),
    Promise.all([
      prisma.choreInstance.count({
        where: { dueDate: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.choreInstance.count({
        where: { status: 'approved', dueDate: { gte: weekStart, lte: weekEnd } },
      }),
    ]),
    prisma.choreInstance.findMany({
      where: { status: { in: ['submitted_complete', 'available', 'missed'] } },
      include: {
        assignment: { include: { chore: { select: { title: true, basePoints: true } } } },
        child: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        role: 'child',
        householdMembers: {
          some: { household: { members: { some: { userId: session.userId } } } },
        },
      },
      select: {
        id: true,
        name: true,
        level: true,
        gameCurrencyBalance: true,
        allowanceBalanceCents: true,
        childProfile: { select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true, eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true, goggleColor: true, sigItem: true } as any },
      },
      take: 4,
    }),
    // Allowance records for this week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).allowanceRecord.findMany({
      where: { weekStart: { gte: weekStart, lte: weekEnd } },
      include: { child: { select: { name: true } } },
    }) as Promise<Array<{ id: string; childUserId: string; moneyEarned: number; paid: boolean; child: { name: string } }>>,
  ])

  const [weekTotal, weekApproved] = weeklyStats
  const weekCompletion = weekTotal > 0 ? Math.round((weekApproved / weekTotal) * 100) : 0

  return (
    <div className="space-y-6 pb-4">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {household?.displayName ?? 'Your Household'}
          </p>
        </div>
        <Link
          href="/admin/chores/new"
          className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-[#22c55e]/20"
        >
          + New Mission
        </Link>
      </div>

      {/* Household code */}
      {household?.householdCode && (
        <div className="bg-[#1e293b] rounded-xl px-5 py-4 border border-[#334155] flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Household Code
            </p>
            <p className="text-2xl font-bold font-mono text-[#3b82f6] tracking-[0.15em]">
              {household.householdCode}
            </p>
          </div>
          <p className="text-xs text-slate-500 text-right max-w-[160px] leading-relaxed hidden sm:block">
            Share with family so kids can log in
          </p>
        </div>
      )}

      {/* Stats row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly completion */}
        <div className="col-span-2 bg-[#1e293b] rounded-xl p-5 border border-[#334155] flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">This Week</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#3b82f6]">{weekCompletion}%</span>
              <span className="text-[#22c55e] text-xs font-bold">
                {weekApproved}/{weekTotal} done
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700/60 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#3b82f6] rounded-full transition-all"
                style={{ width: `${weekCompletion}%` }}
              />
            </div>
          </div>
          <div className="w-14 h-14 relative flex items-center justify-center ml-4 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#334155" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="5"
                strokeDasharray="150.8"
                strokeDashoffset={150.8 - (150.8 * weekCompletion) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[8px] font-bold text-slate-400">GOAL</span>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              pendingApprovals > 0 ? 'text-[#f29d26]' : 'text-slate-100'
            }`}
          >
            {pendingApprovals}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Chores
          </p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{activeChores}</p>
          <p className="text-[10px] text-slate-500 mt-1">Missions deployed</p>
        </div>
      </section>

      {/* Children at a glance */}
      {children.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Survivors
            </h2>
            <Link
              href="/admin/children"
              className="text-[#22c55e] text-xs font-bold hover:text-[#22c55e]/80"
            >
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/admin/children/${c.id}/edit`}
                className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] hover:border-[#22c55e]/30 transition-colors group flex flex-col items-center gap-2"
              >
                {/* Avatar preview */}
                <div className="rounded-xl overflow-hidden bg-[#0f172a] border border-[#334155] p-1">
                  <DetailedCharacter
                    gender={(c.childProfile as any)?.gender ?? undefined}
                    skinTone={(c.childProfile as any)?.skinTone ?? undefined}
                    hairStyle={(c.childProfile as any)?.hairStyle ?? undefined}
                    hairColor={(c.childProfile as any)?.hairColor ?? undefined}
                    eyeColor={(c.childProfile as any)?.eyeColor ?? undefined}
                    eyeStyle={(c.childProfile as any)?.eyeStyle ?? undefined}
                    freckles={(c.childProfile as any)?.freckles ?? false}
                    jacketColor={(c.childProfile as any)?.jacketColor ?? undefined}
                    pantsColor={(c.childProfile as any)?.pantsColor ?? undefined}
                    goggleColor={(c.childProfile as any)?.goggleColor ?? undefined}
                    sigItem={(c.childProfile as any)?.sigItem ?? undefined}
                    width={72}
                  />
                </div>
                <p className="text-xs font-bold text-slate-200 truncate group-hover:text-[#22c55e] transition-colors text-center w-full">
                  {c.name}
                </p>
                <p className="text-lg font-bold text-slate-100">Lv.{c.level}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs">🔩</span>
                  <span className="text-xs text-[#f29d26]/80 font-semibold">
                    {c.gameCurrencyBalance.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent Activity
          </h2>
          {pendingApprovals > 0 && (
            <Link
              href="/admin/approvals"
              className="text-[#f29d26] text-xs font-bold hover:text-[#f29d26]/80"
            >
              {pendingApprovals} pending →
            </Link>
          )}
        </div>

        <div className="space-y-2">
          {recentPending.length === 0 ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-center">
              <p className="text-slate-500 text-sm">All clear — no chores need attention.</p>
            </div>
          ) : (
            recentPending.map((inst) => {
              const isPending = inst.status === 'submitted_complete'
              const isOverdue = inst.status === 'missed'
              return (
                <div
                  key={inst.id}
                  className={`bg-[#1e293b] rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
                    isPending
                      ? 'border-[#3b82f6]/30'
                      : isOverdue
                      ? 'border-red-800/40'
                      : 'border-[#334155]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                        isPending
                          ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                          : isOverdue
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-[#22c55e]/10 text-[#22c55e]'
                      }`}
                    >
                      {isPending ? '⏳' : isOverdue ? '❌' : '📋'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {inst.assignment.chore.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{inst.child?.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isPending
                              ? 'bg-[#3b82f6]/15 text-[#3b82f6]'
                              : isOverdue
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {isPending ? 'Review' : isOverdue ? 'Missed' : 'Open'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isPending && (
                    <Link
                      href="/admin/approvals"
                      className="bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0"
                    >
                      Verify
                    </Link>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Weekly allowance summary */}
      {weekAllowance.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              💵 This Week&apos;s Allowance
            </h2>
            <Link
              href="/admin/weekly-review"
              className="text-[#22c55e] text-xs font-bold hover:text-[#22c55e]/80"
            >
              Review →
            </Link>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 space-y-2">
            {weekAllowance.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">{rec.child.name}</span>
                  {rec.paid && (
                    <span className="text-[10px] bg-[#22c55e]/15 text-[#22c55e] px-1.5 py-0.5 rounded font-bold">PAID</span>
                  )}
                </div>
                <span className="text-sm font-bold text-[#22c55e]">
                  ${(rec.moneyEarned / 100).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-[#334155] pt-2 flex justify-between">
              <span className="text-xs text-slate-500">Total this week</span>
              <span className="text-xs font-bold text-slate-100">
                ${(weekAllowance.reduce((s, r) => s + r.moneyEarned, 0) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Bonus requests banner */}
      {pendingBonus > 0 && (
        <Link
          href="/admin/bonus-requests"
          className="flex items-center justify-between bg-[#f29d26]/10 border border-[#f29d26]/20 rounded-xl px-5 py-4 hover:bg-[#f29d26]/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div>
              <p className="text-sm font-bold text-[#f29d26]">
                {pendingBonus} Bonus Request{pendingBonus > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-400">Awaiting your review</p>
            </div>
          </div>
          <span className="text-[#f29d26]">→</span>
        </Link>
      )}
    </div>
  )
}
