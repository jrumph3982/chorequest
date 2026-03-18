import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { checkAndUnlockChapters } from '@/lib/game/story'
import { MotionWrapper } from '@/components/ui/motion-wrapper'
import { StoryProgressStatus } from '@prisma/client'

interface UnlockRules {
  minLevel: number
  minApprovedChores: number
}

interface RewardJson {
  scrap?: number
}

export default async function StoryPage() {
  const session = await getSession()

  await checkAndUnlockChapters(session.userId)

  const [child, approvedCount, chapters] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { level: true, gameCurrencyBalance: true },
    }),
    prisma.choreInstance.count({ where: { childUserId: session.userId, status: 'approved' } }),
    prisma.storyChapter.findMany({
      orderBy: { chapterNumber: 'asc' },
      include: {
        progress: { where: { childUserId: session.userId }, take: 1 },
      },
    }),
  ])

  return (
    <MotionWrapper>
      <main className="px-4 py-6 space-y-4">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="text-5xl mb-2">📖</div>
          <h1 className="text-xl font-extrabold text-[#22c55e] uppercase tracking-wide">The Story</h1>
          <p className="text-slate-500 text-sm mt-1">
            The zombie survival saga unfolds as you complete chores.
          </p>
        </div>

        {/* Chapters */}
        <div className="space-y-3">
          {chapters.map((chapter) => {
            const progress  = chapter.progress[0]
            const status    = progress?.status ?? StoryProgressStatus.locked
            const isLocked    = status === StoryProgressStatus.locked
            const isCompleted = status === StoryProgressStatus.completed
            const rules  = chapter.unlockRulesJson as unknown as UnlockRules
            const reward = (chapter.rewardJson as unknown as RewardJson | null)?.scrap

            return (
              <div
                key={chapter.id}
                className="rounded-xl border p-5 transition-all"
                style={{
                  background: isLocked
                    ? 'rgba(15,23,42,0.3)'
                    : 'rgba(15,23,42,0.5)',
                  borderColor: isLocked
                    ? 'rgba(255,255,255,0.05)'
                    : isCompleted
                    ? 'rgba(34,197,94,0.3)'
                    : 'rgba(34,197,94,0.5)',
                  boxShadow: (!isLocked && !isCompleted)
                    ? '0 0 16px -4px rgba(34,197,94,0.2)'
                    : 'none',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0 mt-0.5">
                    {isLocked ? '🔒' : isCompleted ? '✅' : '🧟'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs text-slate-500 font-mono">
                        Chapter {chapter.chapterNumber}
                      </span>
                      {!isLocked && !isCompleted && (
                        <span className="text-xs bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 px-2 py-0.5 rounded-full font-medium">
                          🔓 Unlocked
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-xs bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 px-2 py-0.5 rounded-full font-medium">
                          ✓ Complete
                        </span>
                      )}
                      {reward != null && !isLocked && (
                        <span className="text-xs text-[#f29d26]">+🔩 {reward}</span>
                      )}
                    </div>

                    <h3 className={`font-bold text-base ${isLocked ? 'text-slate-600' : 'text-slate-100'}`}>
                      {isLocked ? '???' : chapter.title}
                    </h3>

                    {!isLocked && chapter.description && (
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        {chapter.description}
                      </p>
                    )}

                    {isLocked && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-slate-600">
                          🔒 Reach Level {rules.minLevel} to unlock
                        </p>
                        {rules.minApprovedChores > 0 && (
                          <p className="text-xs text-slate-600">
                            🔒 Complete {rules.minApprovedChores} approved chores
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress summary */}
        <div
          className="rounded-xl p-4 border"
          style={{ background: 'rgba(15,23,42,0.4)', borderColor: 'rgba(242,157,38,0.15)' }}
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">Your Progress</p>
          <div className="flex gap-6">
            <div>
              <p className="text-lg font-bold text-slate-100">⚔️ {child?.level ?? 1}</p>
              <p className="text-xs text-slate-500">Level</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">{approvedCount}</p>
              <p className="text-xs text-slate-500">Chores done</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">🔩 {child?.gameCurrencyBalance ?? 0}</p>
              <p className="text-xs text-slate-500">Scrap</p>
            </div>
          </div>
        </div>
      </main>
    </MotionWrapper>
  )
}
