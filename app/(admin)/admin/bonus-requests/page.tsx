import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { BonusReviewActions } from '@/components/admin/bonus-review-actions'

export default async function BonusRequestsPage() {
  const session = await getSession()

  const [pending, recent] = await Promise.all([
    prisma.bonusRequest.findMany({
      where: {
        status: 'pending',
        child: {
          householdMembers: {
            some: { household: { members: { some: { userId: session.userId } } } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
      include: { child: { select: { id: true, name: true } } },
    }),
    prisma.bonusRequest.findMany({
      where: {
        status: { in: ['approved', 'rejected'] },
        child: {
          householdMembers: {
            some: { household: { members: { some: { userId: session.userId } } } },
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 10,
      include: { child: { select: { id: true, name: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Bonus Requests
            {pending.length > 0 && (
              <span className="bg-[#f29d26] text-slate-900 text-sm font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review extra credit requests from your survivors
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-slate-300 font-semibold">No pending bonus requests</p>
          <p className="text-slate-500 text-sm mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div
              key={r.id}
              className="bg-[#1e293b] border border-[#f29d26]/20 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 text-sm leading-snug">
                    {r.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-[#f29d26] font-semibold">{r.child.name}</span>
                    {r.requestedPoints != null && (
                      <span className="text-xs text-slate-400">
                        requested {r.requestedPoints} pts
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(r.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-2xl shrink-0">⭐</span>
              </div>
              <BonusReviewActions requestId={r.id} requestedPoints={r.requestedPoints} />
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recently Reviewed
          </h2>
          <div className="space-y-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 opacity-60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{r.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.child.name}
                      {r.approvedPoints != null && ` · ${r.approvedPoints} pts awarded`}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      r.status === 'approved'
                        ? 'bg-[#22c55e]/15 text-[#22c55e]'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
