import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

const RARITY_COLORS: Record<string, string> = {
  bronze:    '#cd7f32',
  silver:    '#c0c0c0',
  gold:      '#ffd700',
  legendary: '#9b59b6',
}

const RARITY_GLOW: Record<string, string> = {
  bronze:    'rgba(205,127,50,0.3)',
  silver:    'rgba(192,192,192,0.3)',
  gold:      'rgba(255,215,0,0.4)',
  legendary: 'rgba(155,89,182,0.5)',
}

const CATEGORY_LABELS: Record<string, string> = {
  chores:     'Chores',
  streaks:    'Streaks',
  raids:      'Raids',
  allowance:  'Allowance',
  challenges: 'Challenges',
}

export default async function BadgesPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    redirect('/child-login')
  }

  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({
      where: { secret: false },
      orderBy: [{ category: 'asc' }, { triggerValue: 'asc' }],
    }),
    prisma.userAchievement.findMany({
      where: { childUserId: session.userId },
      select: { achievementId: true, earnedAt: true },
    }),
  ])

  const earnedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.earnedAt]))
  const earnedCount = userAchievements.length

  // Group by category
  const byCategory: Record<string, typeof allAchievements> = {}
  for (const a of allAchievements) {
    if (!byCategory[a.category]) byCategory[a.category] = []
    byCategory[a.category].push(a)
  }

  return (
    <main style={{ padding: '16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Bungee', sans-serif",
          color: '#f5c842',
          fontSize: 24,
          letterSpacing: 2,
          margin: '0 0 4px',
          textTransform: 'uppercase',
        }}>
          ACHIEVEMENT BADGES
        </h1>
        <p style={{ color: '#4a7a40', fontSize: 12, margin: 0 }}>
          {earnedCount} / {allAchievements.length} earned
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        background: '#0d1810',
        border: '1px solid #1a3018',
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 12, color: '#f5c842', letterSpacing: 1 }}>
            COLLECTION PROGRESS
          </span>
          <span style={{ fontSize: 12, color: '#4a7a40' }}>
            {Math.round((earnedCount / Math.max(1, allAchievements.length)) * 100)}%
          </span>
        </div>
        <div style={{ height: 6, background: '#1a3018', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.round((earnedCount / Math.max(1, allAchievements.length)) * 100)}%`,
            background: 'linear-gradient(90deg, #f5c842, #f29d26)',
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Categories */}
      {Object.entries(byCategory).map(([cat, achievements]) => {
        const catEarned = achievements.filter((a) => earnedMap.has(a.id)).length
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h2 style={{
                fontFamily: "'Bungee', sans-serif",
                fontSize: 13,
                color: '#ff6b00',
                letterSpacing: 2,
                textTransform: 'uppercase',
                margin: 0,
              }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <span style={{
                fontSize: 10,
                color: '#4a7a40',
                padding: '2px 6px',
                borderRadius: 99,
                background: '#0d1810',
                border: '1px solid #1a3018',
              }}>
                {catEarned}/{achievements.length}
              </span>
              <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {achievements.map((achievement) => {
                const earnedAt = earnedMap.get(achievement.id)
                const isEarned = !!earnedAt
                const rColor = RARITY_COLORS[achievement.rarity] ?? '#4a7a40'
                const rGlow = RARITY_GLOW[achievement.rarity] ?? 'transparent'

                return (
                  <div
                    key={achievement.id}
                    style={{
                      background: isEarned ? '#0d1810' : '#080e08',
                      border: `1px solid ${isEarned ? rColor : '#1a3018'}`,
                      borderRadius: 12,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      opacity: isEarned ? 1 : 0.5,
                      boxShadow: isEarned ? `0 0 12px ${rGlow}` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: isEarned ? `${rColor}20` : '#1a3018',
                      border: `2px solid ${isEarned ? rColor : '#2a4a2a'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {isEarned ? (achievement.icon ?? '🏅') : '🔒'}
                    </div>

                    <p style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      color: isEarned ? '#e8f5e8' : '#4a7a40',
                      textAlign: 'center',
                      margin: 0,
                      lineHeight: 1.2,
                    }}>
                      {achievement.name}
                    </p>

                    <p style={{
                      fontSize: 9,
                      color: isEarned ? rColor : '#2a4a2a',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: 1,
                    }}>
                      {achievement.rarity}
                    </p>

                    {isEarned && earnedAt && (
                      <p style={{ fontSize: 9, color: '#4a7a40', margin: 0 }}>
                        {new Date(earnedAt).toLocaleDateString()}
                      </p>
                    )}

                    {!isEarned && (
                      <p style={{ fontSize: 9, color: '#2a4a2a', textAlign: 'center', margin: 0, lineHeight: 1.3 }}>
                        {achievement.description}
                      </p>
                    )}

                    {isEarned && (achievement.xpReward > 0 || achievement.scrapsReward > 0) && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {achievement.xpReward > 0 && (
                          <span style={{ fontSize: 9, color: '#3dff7a', fontWeight: 700 }}>
                            +{achievement.xpReward} XP
                          </span>
                        )}
                        {achievement.scrapsReward > 0 && (
                          <span style={{ fontSize: 9, color: '#f5c842', fontWeight: 700 }}>
                            +{achievement.scrapsReward} 🔩
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </main>
  )
}
