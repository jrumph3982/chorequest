'use client'

import type { TimeOfDay } from './index'

const SKY: Record<TimeOfDay, [string, string]> = {
  morning:   ['#87ceeb', '#c8e8f0'],
  afternoon: ['#3a7fc8', '#6ab0e8'],
  evening:   ['#8b3000', '#2a0060'],
  night:     ['#0a0514', '#1a0a2e'],
}

interface Props {
  timeOfDay: TimeOfDay
  activeEventTypes: string[]
}

export function Background({ timeOfDay, activeEventTypes }: Props) {
  const [from, to] = SKY[timeOfDay]
  const hasStorm = activeEventTypes.includes('winter_storm')
  const hasAlien = activeEventTypes.includes('alien_invasion')

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sky */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{ bottom: '28%', background: `linear-gradient(to bottom, ${from}, ${to})` }}
      />
      {/* Event tints over sky */}
      {hasStorm && (
        <div
          className="absolute left-0 right-0 top-0"
          style={{ bottom: '28%', background: 'rgba(160,190,240,0.12)' }}
        />
      )}
      {hasAlien && (
        <div
          className="absolute left-0 right-0 top-0"
          style={{ bottom: '28%', background: 'rgba(0,80,20,0.10)' }}
        />
      )}
      {/* Ground */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{ top: '72%', background: 'linear-gradient(to bottom, #0d1f0d, #060f06)' }}
      />
    </div>
  )
}
