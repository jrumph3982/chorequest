'use client'

import { useEffect, useState, useCallback } from 'react'

interface RaidReport {
  id: string
  date: string
  attackResult: string
  zombieThreat: string
  missedChores: number
  doorDamage: number
  barricadeDamage: number
  fenceDamage: number
  lightDamage: number
  repairApplied: number
}

const THREAT_LABEL: Record<string, string> = {
  none:     'NO THREAT',
  low:      'LOW THREAT',
  moderate: 'MODERATE THREAT',
  high:     'HIGH THREAT',
  critical: 'CRITICAL THREAT',
}

const THREAT_COLOR: Record<string, string> = {
  none:     '#3dff7a',
  low:      '#f5c842',
  moderate: '#f29d26',
  high:     '#ff6b00',
  critical: '#ff4a4a',
}

const RESULT_LABEL: Record<string, string> = {
  quiet:           'ALL QUIET',
  defended:        'DEFENDED',
  barely_survived: 'BARELY SURVIVED',
  overrun:         'OVERRUN!',
}

const RESULT_COLOR: Record<string, string> = {
  quiet:           '#3dff7a',
  defended:        '#3dff7a',
  barely_survived: '#f29d26',
  overrun:         '#ff4a4a',
}

const RESULT_ICON: Record<string, string> = {
  quiet:           '🌙',
  defended:        '🛡️',
  barely_survived: '⚠️',
  overrun:         '💀',
}

const RESULT_STARS: Record<string, number> = {
  quiet:           3,
  defended:        3,
  barely_survived: 2,
  overrun:         1,
}

interface Props {
  reports: RaidReport[]
  onDismiss: () => void
}

export function RaidCinematic({ reports, onDismiss }: Props) {
  const [reportIndex, setReportIndex] = useState(0)
  const [phase, setPhase] = useState(0) // 0–4
  const [dismissed, setDismissed] = useState(false)

  const report = reports[reportIndex]
  const isLast = reportIndex === reports.length - 1

  const markSeen = useCallback(async (id: string) => {
    await fetch('/api/child/raid-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

  useEffect(() => {
    if (!report) return
    // Auto-advance phases
    const timers = [
      setTimeout(() => setPhase(1), 1500),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => setPhase(4), 6000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [report])

  async function handleDismiss() {
    if (!report) return
    await markSeen(report.id)
    if (!isLast) {
      setReportIndex((i) => i + 1)
      setPhase(0)
    } else {
      setDismissed(true)
      onDismiss()
    }
  }

  if (!report || dismissed) return null

  const threatColor = THREAT_COLOR[report.zombieThreat] ?? '#4a7a40'
  const resultColor = RESULT_COLOR[report.attackResult] ?? '#3dff7a'
  const resultLabel = RESULT_LABEL[report.attackResult] ?? report.attackResult.toUpperCase()
  const resultIcon = RESULT_ICON[report.attackResult] ?? '🌙'
  const stars = RESULT_STARS[report.attackResult] ?? 1
  const totalDamage = report.doorDamage + report.barricadeDamage + report.fenceDamage + report.lightDamage

  const damageItems = [
    { label: 'Door',      value: report.doorDamage },
    { label: 'Barricade', value: report.barricadeDamage },
    { label: 'Fence',     value: report.fenceDamage },
    { label: 'Lights',    value: report.lightDamage },
  ].filter((d) => d.value > 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        cursor: 'pointer',
      }}
      onClick={phase >= 4 ? handleDismiss : () => setPhase((p) => Math.min(4, p + 1))}
    >
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        @keyframes zombieFlash { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>

      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>

        {/* Phase 0: Establishing shot */}
        {phase >= 0 && (
          <div style={{ animation: 'fadeUp 0.5s ease', marginBottom: 20 }}>
            <p style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#ff4a4a',
              fontSize: 11,
              letterSpacing: 3,
              textTransform: 'uppercase',
              margin: '0 0 4px',
              animation: 'zombieFlash 1.5s infinite',
            }}>
              LAST NIGHT&apos;S RAID
            </p>
            <p style={{ color: '#2a4a2a', fontSize: 11, margin: 0 }}>
              {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        )}

        {/* Zombie silhouettes */}
        <div style={{
          fontSize: 40,
          marginBottom: 20,
          letterSpacing: 8,
          opacity: phase >= 0 ? 1 : 0,
          transition: 'opacity 0.5s',
          animation: report.attackResult === 'overrun' ? 'shake 0.4s infinite' : undefined,
        }}>
          🧟‍♂️🧟‍♀️🧟
        </div>

        {/* Phase 1: Threat level */}
        {phase >= 1 && (
          <div style={{
            background: '#0d1810',
            border: `1px solid ${threatColor}`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 14,
            animation: 'fadeUp 0.4s ease',
          }}>
            <p style={{ color: '#4a7a40', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>
              Zombie Threat
            </p>
            <p style={{ fontFamily: "'Bungee', sans-serif", color: threatColor, fontSize: 18, margin: 0, letterSpacing: 2 }}>
              {THREAT_LABEL[report.zombieThreat] ?? report.zombieThreat.toUpperCase()}
            </p>
            {report.missedChores > 0 && (
              <p style={{ color: '#ff4a4a', fontSize: 11, margin: '4px 0 0' }}>
                {report.missedChores} missed chore{report.missedChores !== 1 ? 's' : ''} weakened your defenses!
              </p>
            )}
          </div>
        )}

        {/* Phase 2: Damage breakdown */}
        {phase >= 2 && totalDamage > 0 && (
          <div style={{
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 14,
            animation: 'fadeUp 0.4s ease',
          }}>
            <p style={{ color: '#4a7a40', fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 10px' }}>
              Damage Report
            </p>
            {damageItems.map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#4a7a40', fontSize: 11, width: 70, textAlign: 'left' }}>{item.label}</span>
                <div style={{ flex: 1, height: 6, background: '#1a3018', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.value}%`,
                    background: item.value > 50 ? '#ff4a4a' : item.value > 25 ? '#f29d26' : '#f5c842',
                    borderRadius: 99,
                  }} />
                </div>
                <span style={{ color: '#ff4a4a', fontSize: 11, width: 32, textAlign: 'right', fontWeight: 700 }}>
                  -{item.value}
                </span>
              </div>
            ))}
            {report.repairApplied > 0 && (
              <p style={{ color: '#3dff7a', fontSize: 11, margin: '8px 0 0' }}>
                +{report.repairApplied} repair from yesterday&apos;s chores
              </p>
            )}
          </div>
        )}

        {/* Phase 3: Result */}
        {phase >= 3 && (
          <div style={{
            background: '#0d1810',
            border: `2px solid ${resultColor}`,
            borderRadius: 10,
            padding: '16px',
            marginBottom: 14,
            animation: 'fadeUp 0.4s ease',
            boxShadow: `0 0 20px ${resultColor}40`,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{resultIcon}</div>
            <p style={{
              fontFamily: "'Bungee', sans-serif",
              color: resultColor,
              fontSize: 24,
              letterSpacing: 2,
              margin: '0 0 8px',
              textTransform: 'uppercase',
            }}>
              {resultLabel}
            </p>
          </div>
        )}

        {/* Phase 4: Stars + dismiss */}
        {phase >= 4 && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ fontSize: 28, marginBottom: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ opacity: i < stars ? 1 : 0.2, marginRight: 4 }}>⭐</span>
              ))}
            </div>
            <div style={{
              background: resultColor === '#ff4a4a' ? 'rgba(255,74,74,0.08)' : 'rgba(61,255,122,0.08)',
              border: `1px solid ${resultColor}30`,
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 16,
            }}>
              <p style={{ color: resultColor, fontSize: 12, margin: 0, fontWeight: 700 }}>
                {report.attackResult === 'overrun'
                  ? '☠️ Complete more chores tomorrow to defend your base!'
                  : report.attackResult === 'barely_survived'
                  ? '⚠️ Close call! Keep up the chores to strengthen your base.'
                  : '✅ Great job keeping your base safe!'}
              </p>
            </div>
            <button
              style={{
                width: '100%',
                padding: '12px 0',
                background: resultColor,
                border: 'none',
                borderRadius: 10,
                fontFamily: "'Bungee', sans-serif",
                fontSize: 13,
                color: '#060e06',
                cursor: 'pointer',
                letterSpacing: 1,
              }}
            >
              {!isLast ? `NEXT REPORT (${reports.length - reportIndex - 1} MORE)` : 'CONTINUE →'}
            </button>
            <p style={{ color: '#2a4a2a', fontSize: 10, margin: '8px 0 0' }}>
              Tap anywhere to {phase < 4 ? 'skip' : 'continue'}
            </p>
          </div>
        )}

        {phase < 4 && (
          <p style={{ color: '#2a4a2a', fontSize: 10, margin: '16px 0 0' }}>
            Tap to advance
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Wrapper that auto-fetches unread raid reports and shows the cinematic.
 */
export function RaidCinematicLoader() {
  const [reports, setReports] = useState<RaidReport[] | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    fetch('/api/child/raid-report')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReports(data)
          setShown(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!shown || !reports || reports.length === 0) return null

  return <RaidCinematic reports={reports} onDismiss={() => setShown(false)} />
}
