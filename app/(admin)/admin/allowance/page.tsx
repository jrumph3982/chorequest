export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { MarkPaidButton } from '@/components/admin/mark-paid-button'
import { AllowanceRatioEditor } from '@/components/admin/allowance-ratio-editor'
import { getOrCreateSettings } from '@/lib/game/settings'

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AllowancePage() {
  const session = await getSession()

  const settings = await getOrCreateSettings(session.householdId ?? undefined)

  const children = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: {
        some: { household: { members: { some: { userId: session.userId } } } },
      },
    },
    select: {
      id: true,
      name: true,
      allowanceBalanceCents: true,
      allowanceRecords: {
        orderBy: { weekStart: 'desc' },
        take: 12,
        select: {
          id: true,
          weekStart: true,
          weekEnd: true,
          moneyEarned: true,
          xpEarned: true,
          paid: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const allowancePointsPerDollar = (settings as any).allowancePointsPerDollar ?? Number(process.env.ALLOWANCE_POINTS_PER_DOLLAR ?? 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Allowance</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Track and pay out earned allowances.
        </p>
      </div>

      <AllowanceRatioEditor initialRatio={allowancePointsPerDollar} />

      {children.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">No children added yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map((child) => {
            const unpaidTotal = child.allowanceRecords
              .filter((r) => !r.paid)
              .reduce((s, r) => s + r.moneyEarned, 0)

            return (
              <div key={child.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                {/* Child header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">{child.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {unpaidTotal > 0
                        ? `${child.allowanceRecords.filter((r) => !r.paid).length} unpaid week${child.allowanceRecords.filter((r) => !r.paid).length !== 1 ? 's' : ''}`
                        : 'All weeks paid'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                      Total Owed
                    </p>
                    <p className="text-2xl font-bold text-[#22c55e]">
                      ${(child.allowanceBalanceCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Records table */}
                {child.allowanceRecords.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No finalized weeks yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {child.allowanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
                        style={{
                          background: record.paid ? 'rgba(255,255,255,0.02)' : 'rgba(34,197,94,0.04)',
                          border: `1px solid ${record.paid ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.2)'}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200">
                            {fmtDate(new Date(record.weekStart))} – {fmtDate(new Date(record.weekEnd))}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {record.xpEarned} XP earned
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-bold ${record.paid ? 'text-slate-500' : 'text-[#22c55e]'}`}>
                            ${(record.moneyEarned / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="shrink-0 w-24 text-right">
                          {record.paid ? (
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              ✓ Paid
                            </span>
                          ) : (
                            <MarkPaidButton recordId={record.id} amount={record.moneyEarned} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
