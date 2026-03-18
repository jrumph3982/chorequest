import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { BonusRequestForm } from '@/components/child/bonus-request-form'
import { MotionWrapper } from '@/components/ui/motion-wrapper'
import { BonusRequestStatus } from '@prisma/client'

const STATUS_BADGE: Record<BonusRequestStatus, string> = {
  pending:  'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  approved: 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30',
  rejected: 'bg-red-900/30 text-red-400 border border-red-800/40',
}

const STATUS_LABEL: Record<BonusRequestStatus, string> = {
  pending:  'Pending ⏳',
  approved: 'Approved ✓',
  rejected: 'Rejected',
}

export default async function BonusRequestPage() {
  const session = await getSession()

  const requests = await prisma.bonusRequest.findMany({
    where: { childUserId: session.userId },
    orderBy: { submittedAt: 'desc' },
    take: 15,
  })

  return (
    <MotionWrapper>
      <main className="px-4 py-6 space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">⭐</div>
          <h1 className="text-xl font-extrabold text-[#22c55e] uppercase tracking-wide">Bonus Mission</h1>
          <p className="text-slate-500 text-sm mt-1">
            Did extra work? Tell a parent and earn bonus points!
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-xl p-5 border"
          style={{ background: 'rgba(15,23,42,0.5)', borderColor: 'rgba(242,157,38,0.2)' }}
        >
          <BonusRequestForm />
        </div>

        {/* History */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
            Your Requests
          </h2>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">⭐</p>
              <p className="text-slate-500 text-sm">No requests yet. Do something awesome and tell a parent!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl p-4 border"
                  style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-100">{r.description}</p>
                      <div className="flex gap-3 mt-1">
                        {r.requestedPoints && (
                          <span className="text-xs text-slate-500">
                            Requested: {r.requestedPoints} pts
                          </span>
                        )}
                        {r.approvedPoints && (
                          <span className="text-xs text-[#22c55e] font-medium">
                            Awarded: {r.approvedPoints} pts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </MotionWrapper>
  )
}
