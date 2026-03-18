export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'

const RANK_BADGE = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  const session = await getSession()

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
      xp: true,
      gameCurrencyBalance: true,
      level: true,
      childProfile: {
        select: {
          hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true,
          eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true, goggleColor: true, sigItem: true,
        } as any,
      },
      _count: {
        select: {
          choreInstances: { where: { status: 'approved' } },
        },
      },
    },
  })

  const ranked = [...children].sort(
    (a, b) => b._count.choreInstances - a._count.choreInstances,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Leaderboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Ranked by approved chores completed</p>
      </div>

      {ranked.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center">
          <p className="text-slate-400 text-sm">No children yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((child, i) => {
            const rank = i + 1
            const chores = child._count.choreInstances
            return (
              <div
                key={child.id}
                className="bg-[#1e293b] border rounded-xl p-4 flex items-center gap-4"
                style={{
                  borderColor: rank === 1 ? 'rgba(251,191,36,0.4)' : rank === 2 ? 'rgba(148,163,184,0.3)' : rank === 3 ? 'rgba(180,83,9,0.3)' : 'rgba(51,65,85,1)',
                  boxShadow: rank === 1 ? '0 0 20px rgba(251,191,36,0.08)' : 'none',
                }}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {rank <= 3 ? (
                    <span className="text-2xl">{RANK_BADGE[rank - 1]}</span>
                  ) : (
                    <span className="text-lg font-black text-slate-500">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="shrink-0" style={{ width: 40, height: 44 }}>
                  <DetailedCharacter
                    gender={(child.childProfile as any)?.gender ?? undefined}
                    skinTone={(child.childProfile as any)?.skinTone ?? undefined}
                    hairStyle={(child.childProfile as any)?.hairStyle ?? undefined}
                    hairColor={(child.childProfile as any)?.hairColor ?? undefined}
                    eyeColor={(child.childProfile as any)?.eyeColor ?? undefined}
                    eyeStyle={(child.childProfile as any)?.eyeStyle ?? undefined}
                    freckles={(child.childProfile as any)?.freckles ?? false}
                    jacketColor={(child.childProfile as any)?.jacketColor ?? undefined}
                    pantsColor={(child.childProfile as any)?.pantsColor ?? undefined}
                    goggleColor={(child.childProfile as any)?.goggleColor ?? undefined}
                    sigItem={(child.childProfile as any)?.sigItem ?? undefined}
                    width={40}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-100 text-sm">{child.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">Lv {child.level}</span>
                    <span className="text-xs text-[#f29d26]/80">
                      🔩 {child.gameCurrencyBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Chore count */}
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black text-slate-100">{chores}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    chore{chores !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* XP */}
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-sm font-bold text-[#3b82f6]">{child.xp.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider">xp</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
