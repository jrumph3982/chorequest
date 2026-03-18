import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { EventToggle } from '@/components/admin/event-toggle'
import { EVENT_ICON, EVENT_COLOR } from '@/lib/game/events'

export default async function AdminEventsPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') return null

  const gameEvents = await prisma.gameEvent.findMany({ orderBy: { startDate: 'asc' } })
  const now = new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Seasonal Events</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Enable or disable events that affect your child&apos;s base threat level.
        </p>
      </div>

      <div className="space-y-3">
        {gameEvents.map((ev) => {
          const isLive = ev.active && ev.startDate <= now && ev.endDate >= now
          const isPast = ev.endDate < now
          const isUpcoming = ev.startDate > now

          return (
            <div
              key={ev.id}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex items-start gap-4 hover:border-slate-600 transition-colors"
            >
              <span className="text-2xl mt-0.5 shrink-0">
                {EVENT_ICON[ev.type] ?? '🌍'}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-100 text-sm">{ev.name}</span>
                  {isLive && (
                    <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                      LIVE
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[10px] bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">
                      Ended
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="text-[10px] bg-[#3b82f6]/15 text-[#3b82f6] px-2 py-0.5 rounded-full font-bold uppercase">
                      Upcoming
                    </span>
                  )}
                </div>

                {ev.description && (
                  <p className="text-xs text-slate-400 mb-1.5">{ev.description}</p>
                )}

                <div className="flex gap-3 text-xs text-slate-500 flex-wrap items-center">
                  <span>
                    {ev.startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {' – '}
                    {ev.endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                      EVENT_COLOR[ev.type] ?? 'border-slate-600 text-slate-400'
                    }`}
                  >
                    +{ev.difficultyModifier} threat
                    {ev.type === 'winter_storm' && ' · −50% visibility'}
                  </span>
                </div>
              </div>

              <EventToggle eventId={ev.id} active={ev.active} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
