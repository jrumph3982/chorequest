export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { GlobalLeaderboardToggle } from '@/components/admin/GlobalLeaderboardToggle'
import { GlobalLeaderboardTable, type LeaderboardEntry } from '@/components/GlobalLeaderboardTable'

async function fetchLeaderboard(): Promise<{
  entries: LeaderboardEntry[]
  updatedAt: string
  totalParticipants: number
}> {
  // Use absolute URL for server-side fetch — fall back to relative for Docker
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/global-leaderboard`, { cache: 'no-store' })
  if (!res.ok) return { entries: [], updatedAt: new Date().toISOString(), totalParticipants: 0 }
  return res.json()
}

export default async function AdminGlobalLeaderboardPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') redirect('/login')
  if (!session.householdId) redirect('/admin')

  const [household, leaderboardData] = await Promise.all([
    prisma.household.findUnique({
      where: { id: session.householdId },
      select: {
        globalLeaderboardEnabled: true,
        members: {
          where: { role: 'child' },
          select: { userId: true },
        },
      },
    }),
    fetchLeaderboard(),
  ])

  const currentChildIds = (household?.members ?? []).map((m) => m.userId)
  const isEnabled = household?.globalLeaderboardEnabled ?? false

  const updatedAt = new Date(leaderboardData.updatedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Global Leaderboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Top 50 children across all participating families · Updated {updatedAt}
          {leaderboardData.totalParticipants > 0 && (
            <> · {leaderboardData.totalParticipants} participants</>
          )}
        </p>
      </div>

      {/* Participation toggle */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Participation Settings
        </h2>
        <GlobalLeaderboardToggle initialEnabled={isEnabled} />
      </div>

      {/* Leaderboard table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            🌍 Global Rankings
          </h2>
          {leaderboardData.entries.length > 0 && (
            <span className="text-xs text-slate-500">
              {leaderboardData.entries.length} ranked
            </span>
          )}
        </div>

        {!isEnabled && leaderboardData.entries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🌍</p>
            <p className="text-sm text-slate-400">No families are participating yet.</p>
            <p className="text-xs text-slate-600 mt-1">Enable participation above to appear on the board.</p>
          </div>
        ) : (
          <GlobalLeaderboardTable
            entries={leaderboardData.entries}
            currentChildIds={currentChildIds}
          />
        )}
      </div>
    </div>
  )
}
