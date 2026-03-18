import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'

const RANK_BADGE = ['🥇', '🥈', '🥉']

export default async function ChildLeaderboardPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  const householdId = session.householdId
  const children = householdId
    ? await prisma.user.findMany({
        where: {
          role: 'child',
          householdMembers: { some: { householdId } },
        },
        select: {
          id: true,
          name: true,
          xp: true,
          level: true,
          gameCurrencyBalance: true,
          childProfile: {
            select: {
              hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true,
              eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true, goggleColor: true, sigItem: true,
            } as any,
          },
          _count: { select: { choreInstances: { where: { status: 'approved' } } } },
        },
      })
    : []

  const ranked = [...children].sort(
    (a, b) => b._count.choreInstances - a._count.choreInstances,
  )

  return (
    <div className="min-h-screen px-4 py-5 space-y-5" style={{ background: '#0d1117', color: '#e2e8f0' }}>
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest">Leaderboard</h1>
        <p className="text-xs text-slate-400 mt-1">Ranked by approved chores completed</p>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-slate-400 text-sm">No siblings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((child, i) => {
            const rank = i + 1
            const chores = child._count.choreInstances
            const isSelf = child.id === session.userId
            return (
              <div
                key={child.id}
                className="rounded-xl border px-4 py-3 flex items-center gap-3"
                style={{
                  borderColor: isSelf ? 'rgba(242,157,38,0.4)' : 'rgba(51,65,85,0.9)',
                  background: isSelf ? 'rgba(242,157,38,0.06)' : 'rgba(15,23,42,0.6)',
                }}
              >
                <div className="w-10 text-center shrink-0">
                  {rank <= 3 ? (
                    <span className="text-2xl">{RANK_BADGE[rank - 1]}</span>
                  ) : (
                    <span className="text-sm font-black text-slate-500">#{rank}</span>
                  )}
                </div>

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

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-100">
                    {child.name}{isSelf ? ' (you)' : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Lv {child.level}</span>
                    <span className="text-[10px] text-[#f29d26]/80">
                      🧩 {child.gameCurrencyBalance.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-blue-400">⭐ {child.xp.toLocaleString()} XP</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xl font-black text-slate-100">{chores}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    chore{chores !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
