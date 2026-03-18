'use client'

interface DailyEarning {
  label: string
  dollars: number
  isToday: boolean
}

interface Props {
  earnedDollars: number
  goalDollars: number
  dailyEarnings: DailyEarning[]
}

export function AllowanceRing({ earnedDollars, goalDollars, dailyEarnings }: Props) {
  const radius = 48
  const circumference = 2 * Math.PI * radius // ~301.6
  const effectiveGoal = goalDollars > 0 ? goalDollars : 0
  const pct = effectiveGoal > 0 ? Math.min(1, earnedDollars / effectiveGoal) : 0
  const offset = circumference - pct * circumference
  const goalReached = effectiveGoal > 0 && earnedDollars >= effectiveGoal

  const maxDaily = dailyEarnings.length > 0 ? Math.max(...dailyEarnings.map((d) => d.dollars), 0.01) : 0.01

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={60}
            cy={60}
            r={radius}
            fill="none"
            stroke="#1a3018"
            strokeWidth={10}
          />
          {/* Progress ring */}
          <circle
            cx={60}
            cy={60}
            r={radius}
            fill="none"
            stroke="#f5c842"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#f5c842',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ${earnedDollars.toFixed(2)}
          </span>
          {effectiveGoal > 0 && (
            <span style={{ color: '#4a6a4a', fontSize: 10, marginTop: 2 }}>
              of ${effectiveGoal.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Goal reached badge */}
      {goalReached && (
        <div
          style={{
            background: 'rgba(61,255,122,0.12)',
            border: '1px solid #3dff7a',
            borderRadius: 20,
            padding: '4px 14px',
          }}
        >
          <span
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#3dff7a',
              fontSize: 12,
              letterSpacing: 1,
            }}
          >
            GOAL REACHED!
          </span>
        </div>
      )}

      {/* More to go subtitle */}
      {!goalReached && effectiveGoal > 0 && (
        <p style={{ color: '#4a6a4a', fontSize: 11, margin: 0, textAlign: 'center' }}>
          ${(effectiveGoal - earnedDollars).toFixed(2)} more to hit weekly goal
        </p>
      )}

      {/* Daily breakdown */}
      {dailyEarnings.length > 0 && (
        <div style={{ display: 'flex', gap: 6, width: '100%' }}>
          {dailyEarnings.map((day, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: day.isToday ? 'rgba(245,200,66,0.08)' : '#0a160a',
                border: day.isToday ? '1px solid #f5c842' : '1px solid #1a3018',
                borderRadius: 8,
                padding: '6px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: day.isToday ? '#f5c842' : '#4a6a4a',
                  letterSpacing: 0.5,
                }}
              >
                {day.label}
              </span>
              <span
                style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: 13,
                  color: day.dollars > 0 ? '#f5c842' : '#2a4a2a',
                }}
              >
                ${day.dollars.toFixed(2)}
              </span>
              {/* Mini bar */}
              <div
                style={{
                  width: '100%',
                  height: 3,
                  background: '#1a3018',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((day.dollars / maxDaily) * 100))}%`,
                    background: '#f5c842',
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linear progress bar */}
      {effectiveGoal > 0 && (
        <div style={{ width: '100%' }}>
          <div
            style={{
              height: 6,
              background: '#1a3018',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.round(pct * 100))}%`,
                background: '#f5c842',
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <span style={{ color: '#4a6a4a', fontSize: 10 }}>$0</span>
            <span style={{ color: '#4a6a4a', fontSize: 10 }}>${effectiveGoal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
