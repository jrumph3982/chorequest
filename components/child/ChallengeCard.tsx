'use client'

interface Participant {
  id: string
  childId: string
  childName: string
  progress: number
  completed: boolean
  isMe: boolean
}

interface Reward {
  id: string
  rewardType: string
  rewardAmount: number
  recipientType: string
}

interface Challenge {
  id: string
  type: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  targetMetric: string
  targetValue: number
  participants: Participant[]
  rewards: Reward[]
}

interface Props {
  challenges: Challenge[]
  currentUserId: string
}

function TimeRemaining({ endDate }: { endDate: string }) {
  const end = new Date(endDate)
  const now = new Date()
  const diffMs = end.getTime() - now.getTime()
  if (diffMs <= 0) return <span style={{ color: '#ff4a4a' }}>ENDED</span>

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return <span style={{ color: '#f29d26' }}>{days}d {hours}h remaining</span>
  return <span style={{ color: '#ff6b00' }}>{hours}h remaining!</span>
}

function HeadToHeadCard({ challenge, currentUserId }: { challenge: Challenge; currentUserId: string }) {
  const me = challenge.participants.find((p) => p.childId === currentUserId)
  const opponent = challenge.participants.find((p) => p.childId !== currentUserId)

  if (!me || !opponent) return null

  const myProgress = me.progress
  const oppProgress = opponent.progress
  const totalProgress = myProgress + oppProgress
  const myPct = totalProgress > 0 ? (myProgress / totalProgress) * 100 : 50

  const isWinning = myProgress > oppProgress
  const isTied = myProgress === oppProgress
  const message = isTied
    ? "IT'S A TIE! PULL AHEAD!"
    : isWinning
    ? "YOU'RE WINNING!"
    : "CLOSE THE GAP!"
  const messageColor = isTied ? '#f5c842' : isWinning ? '#3dff7a' : '#ff6b00'

  const winnerRewards = challenge.rewards.filter((r) => r.recipientType === 'winner')
  const xpReward = winnerRewards.find((r) => r.rewardType === 'xp')?.rewardAmount ?? 0
  const scrapReward = winnerRewards.find((r) => r.rewardType === 'scraps')?.rewardAmount ?? 0

  return (
    <div style={{
      background: '#0d1810',
      border: '1px solid #1a3018',
      borderTop: '2px solid #f5c842',
      borderRadius: 10,
      padding: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontFamily: "'Bungee', sans-serif",
          fontSize: 10,
          color: '#f5c842',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}>
          ⚔️ SIBLING CHALLENGE
        </span>
        <span style={{ fontSize: 9, color: '#4a7a40' }}>
          <TimeRemaining endDate={challenge.endDate} />
        </span>
      </div>

      {/* VS display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {/* Me */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: 14,
            color: '#3dff7a',
            margin: '0 0 2px',
          }}>
            {myProgress}
          </p>
          <p style={{ fontSize: 10, color: '#3dff7a', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>
            YOU
          </p>
        </div>

        {/* VS */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#1a3018',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 10, color: '#ff6b00' }}>VS</span>
        </div>

        {/* Opponent */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Bungee', sans-serif",
            fontSize: 14,
            color: '#f29d26',
            margin: '0 0 2px',
          }}>
            {oppProgress}
          </p>
          <p style={{ fontSize: 10, color: '#f29d26', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>
            {opponent.childName}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, background: '#1a3018', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%',
          width: `${myPct}%`,
          background: 'linear-gradient(90deg, #3dff7a, #2ac560)',
          borderRadius: 99,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Message */}
      <p style={{
        fontFamily: "'Bungee', sans-serif",
        fontSize: 11,
        color: messageColor,
        textAlign: 'center',
        margin: '0 0 8px',
        letterSpacing: 1,
      }}>
        {message}
      </p>

      {/* Rewards */}
      {(xpReward > 0 || scrapReward > 0) && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '6px 10px',
          background: '#0a1a08',
          borderRadius: 6,
          border: '1px solid #1a3018',
        }}>
          <span style={{ fontSize: 9, color: '#4a7a40', textTransform: 'uppercase', fontWeight: 700 }}>WINNER GETS:</span>
          {xpReward > 0 && (
            <span style={{ fontSize: 9, color: '#3dff7a', fontWeight: 700 }}>+{xpReward} XP</span>
          )}
          {scrapReward > 0 && (
            <span style={{ fontSize: 9, color: '#f5c842', fontWeight: 700 }}>+{scrapReward} 🔩</span>
          )}
        </div>
      )}
    </div>
  )
}

export function ChallengeCard({ challenges, currentUserId }: Props) {
  if (challenges.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {challenges.map((challenge) => {
        if (challenge.type === 'head_to_head') {
          return (
            <HeadToHeadCard key={challenge.id} challenge={challenge} currentUserId={currentUserId} />
          )
        }
        return null
      })}
    </div>
  )
}
