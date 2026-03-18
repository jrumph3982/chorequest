import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  parent_signup:            { icon: '👤', label: 'Parent signed up',       color: 'bg-[#3b82f6]/10 text-[#3b82f6]' },
  household_created:        { icon: '🏚️', label: 'Household created',      color: 'bg-[#3b82f6]/10 text-[#3b82f6]' },
  parent_login_success:     { icon: '✅', label: 'Parent logged in',        color: 'bg-[#22c55e]/10 text-[#22c55e]' },
  parent_login_failure:     { icon: '❌', label: 'Parent login failed',     color: 'bg-red-500/10 text-red-400' },
  child_login_success:      { icon: '✅', label: 'Child logged in',         color: 'bg-[#22c55e]/10 text-[#22c55e]' },
  child_login_failure:      { icon: '⚠️', label: 'Child login failed',      color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
  child_account_created:    { icon: '➕', label: 'Child account created',   color: 'bg-[#3b82f6]/10 text-[#3b82f6]' },
  child_pin_reset:          { icon: '🔑', label: 'Child PIN reset',         color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
  household_lookup_failure: { icon: '⚠️', label: 'Household code not found', color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
  settings_changed:         { icon: '⚙️', label: 'Settings changed',        color: 'bg-slate-600/20 text-slate-400' },
}

function eventDisplay(eventType: string) {
  return (
    EVENT_META[eventType] ?? {
      icon: '📋',
      label: eventType,
      color: 'bg-slate-700/30 text-slate-400',
    }
  )
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function maskIp(ip: string | null): string {
  if (!ip) return '—'
  const v4 = ip.match(/^(\d+\.\d+)\.\d+\.\d+$/)
  if (v4) return `${v4[1]}.*.*`
  const v6 = ip.match(/^([0-9a-f]+:[0-9a-f]+):/i)
  if (v6) return `${v6[1]}:…`
  return ip.slice(0, 8) + '…'
}

export default async function SecurityPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult' || !session.householdId) {
    redirect('/login')
  }

  const logs = await prisma.securityAuditLog.findMany({
    where: { householdId: session.householdId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      actor: { select: { name: true, role: true } },
      target: { select: { name: true, role: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Security Activity</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Recent auth and account events for your household · Last 100 entries
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-slate-400 text-sm">No security events recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => {
            const { icon, label, color } = eventDisplay(log.eventType)
            const actorName = log.actor?.name ?? null
            const targetName = log.target?.name ?? null

            return (
              <div
                key={log.id}
                className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 flex items-start gap-3 hover:border-slate-600 transition-colors"
              >
                <span className="text-xl mt-0.5 shrink-0 leading-none">{icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
                      {label}
                    </span>
                    {actorName && (
                      <span className="text-xs text-slate-400">
                        by <span className="font-medium text-slate-300">{actorName}</span>
                        {log.actor?.role === 'child' && (
                          <span className="ml-1 text-slate-500">(child)</span>
                        )}
                      </span>
                    )}
                    {targetName && (
                      <span className="text-xs text-slate-500">
                        → <span className="font-medium text-slate-400">{targetName}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                    {log.ipAddress && (
                      <span className="text-[10px] text-slate-600 font-mono">
                        {maskIp(log.ipAddress)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-slate-600 hidden sm:block whitespace-nowrap mt-0.5 shrink-0">
                  {log.createdAt.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
