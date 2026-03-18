'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RaidData {
  attackResult: string
  zombieThreat: string
  doorDamage: number
  barricadeDamage: number
  fenceDamage: number
  lightDamage: number
}

interface ComponentData {
  key: string
  label: string
  icon: string
  damage: number
  level: number
}

interface Props {
  lastNight: RaidData | null
  components: ComponentData[]
  scrap: number
  missedYesterday: number
}

type RepairTier = 'light' | 'heavy'

interface RepairSelection {
  component: string
  tier: RepairTier
}

const REPAIR_COSTS: Record<RepairTier, { scrapCost: number; repairAmount: number }> = {
  light: { scrapCost: 10, repairAmount: 20 },
  heavy: { scrapCost: 25, repairAmount: 60 },
}

function getIntegrity(damage: number): number {
  return 100 - damage
}

function getStatus(integrity: number): { label: string; color: string } {
  if (integrity >= 80) return { label: 'OK', color: '#3dff7a' }
  if (integrity >= 50) return { label: 'WARNING', color: '#ff9a20' }
  return { label: 'CRITICAL', color: '#ff4a4a' }
}

function getPriority(integrity: number): { label: string; color: string } {
  if (integrity < 50) return { label: 'URGENT', color: '#ff4a4a' }
  if (integrity <= 70) return { label: 'SOON', color: '#ff9a20' }
  return { label: 'LOW', color: '#4a6a4a' }
}

function attackResultBadge(result: string): { label: string; color: string; bg: string } {
  if (result === 'defended') return { label: 'DEFENDED', color: '#3dff7a', bg: 'rgba(61,255,122,0.12)' }
  if (result === 'barely_survived') return { label: 'BARELY SURVIVED', color: '#ff9a20', bg: 'rgba(255,154,32,0.12)' }
  if (result === 'overrun') return { label: 'OVERRUN', color: '#ff4a4a', bg: 'rgba(255,74,74,0.12)' }
  return { label: 'QUIET', color: '#4a6a4a', bg: 'rgba(74,106,74,0.12)' }
}

export function BaseRaidReport({ lastNight, components, scrap, missedYesterday }: Props) {
  const router = useRouter()
  const [selections, setSelections] = useState<RepairSelection[]>([])
  const [isRepairing, setIsRepairing] = useState(false)
  const [repairError, setRepairError] = useState<string | null>(null)

  // Compute overall integrity
  const overallIntegrity =
    components.length > 0
      ? Math.round(
          components.reduce((sum, c) => sum + getIntegrity(c.damage), 0) / components.length
        )
      : 100

  const overallStatus = getStatus(overallIntegrity)

  // Damaged components for repair section
  const damagedComponents = components.filter((c) => c.damage > 0)

  // Total cost of current selections
  const totalCost = selections.reduce((sum, sel) => sum + REPAIR_COSTS[sel.tier].scrapCost, 0)
  const overBudget = totalCost > scrap
  const canRepair = selections.length > 0 && !overBudget

  function toggleSelection(componentKey: string, tier: RepairTier) {
    setRepairError(null)
    setSelections((prev) => {
      const existing = prev.find((s) => s.component === componentKey)
      if (existing && existing.tier === tier) {
        // Deselect
        return prev.filter((s) => s.component !== componentKey)
      }
      // Select or change tier
      const without = prev.filter((s) => s.component !== componentKey)
      return [...without, { component: componentKey, tier }]
    })
  }

  async function handleRepair() {
    if (!canRepair || isRepairing) return
    setIsRepairing(true)
    setRepairError(null)

    try {
      const res = await fetch('/api/child/base/repair-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairs: selections }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setRepairError(data.error ?? 'Repair failed')
        return
      }

      setSelections([])
      router.refresh()
    } catch {
      setRepairError('Network error. Please try again.')
    } finally {
      setIsRepairing(false)
    }
  }

  // Synthesize event log from lastNight
  const eventLog: { time: string; description: string; damage: number; isBreachSuccess: boolean }[] = []
  if (lastNight && lastNight.attackResult !== 'quiet') {
    eventLog.push({
      time: '23:00',
      description: `Night raid initiated — Threat: ${lastNight.zombieThreat}`,
      damage: 0,
      isBreachSuccess: false,
    })

    const dmgComponents: { label: string; dmg: number }[] = [
      { label: 'door', dmg: lastNight.doorDamage },
      { label: 'barricade', dmg: lastNight.barricadeDamage },
      { label: 'fence', dmg: lastNight.fenceDamage },
      { label: 'light', dmg: lastNight.lightDamage },
    ].filter((c) => c.dmg > 0)

    dmgComponents.forEach((c, i) => {
      eventLog.push({
        time: `23:${String(15 + i * 10).padStart(2, '0')}`,
        description: `Breach attempt at ${c.label} — ${c.dmg} damage dealt`,
        damage: c.dmg,
        isBreachSuccess: true,
      })
    })

    if (lastNight.attackResult === 'overrun') {
      eventLog.push({
        time: '23:55',
        description: 'BASE OVERRUN — Zombies entered the house!',
        damage: 0,
        isBreachSuccess: true,
      })
    }

    const totalDmg =
      lastNight.doorDamage +
      lastNight.barricadeDamage +
      lastNight.fenceDamage +
      lastNight.lightDamage

    eventLog.push({
      time: '23:59',
      description: `Wave cleared — ${totalDmg} total damage dealt`,
      damage: 0,
      isBreachSuccess: false,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* SECTION 1: Raid report banner */}
      {lastNight && lastNight.attackResult !== 'quiet' && (
        <div
          style={{
            background: 'rgba(255,48,48,0.06)',
            border: '1px solid rgba(255,48,48,0.25)',
            borderTop: '3px solid #ff3030',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <h3
              style={{
                fontFamily: "'Bungee', sans-serif",
                color: '#ff4a4a',
                fontSize: 12,
                letterSpacing: 2,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              LAST NIGHT'S RAID
            </h3>
            {/* Attack result badge */}
            {(() => {
              const { label, color, bg } = attackResultBadge(lastNight.attackResult)
              return (
                <span
                  style={{
                    background: bg,
                    border: `1px solid ${color}`,
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontFamily: "'Bungee', sans-serif",
                    color,
                    fontSize: 10,
                    letterSpacing: 1,
                    animation: lastNight.attackResult === 'overrun' ? 'pulse 1s ease-in-out infinite' : undefined,
                  }}
                >
                  {label}
                </span>
              )
            })()}
          </div>

          <p style={{ color: '#4a6a4a', fontSize: 11, margin: '0 0 8px' }}>
            Threat level: <span style={{ color: '#ff9a20' }}>{lastNight.zombieThreat}</span>
          </p>

          {/* Damage breakdown */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {[
              { label: 'Door', dmg: lastNight.doorDamage, icon: '🚪' },
              { label: 'Barricade', dmg: lastNight.barricadeDamage, icon: '🪵' },
              { label: 'Fence', dmg: lastNight.fenceDamage, icon: '🔩' },
              { label: 'Light', dmg: lastNight.lightDamage, icon: '💡' },
            ]
              .filter((c) => c.dmg > 0)
              .map((c) => (
                <div
                  key={c.label}
                  style={{
                    background: 'rgba(255,74,74,0.08)',
                    border: '1px solid rgba(255,74,74,0.3)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 11,
                    color: '#ff4a4a',
                  }}
                >
                  {c.icon} {c.label}: -{c.dmg}
                </div>
              ))}
          </div>

          {missedYesterday > 0 && (
            <p style={{ color: 'rgba(255,74,74,0.7)', fontSize: 11, margin: 0 }}>
              ⚠ {missedYesterday} missed chore{missedYesterday !== 1 ? 's' : ''} ={' '}
              {missedYesterday} extra zombie{missedYesterday !== 1 ? 's' : ''} in tonight's wave
            </p>
          )}
        </div>
      )}

      {/* SECTION 2: Base integrity */}
      <div
        style={{
          background: '#0d1810',
          border: '1px solid #1a3018',
          borderRadius: 10,
          padding: '14px 16px',
        }}
      >
        <h3
          style={{
            fontFamily: "'Bungee', sans-serif",
            color: '#ff6b00',
            fontSize: 12,
            letterSpacing: 2,
            margin: '0 0 12px',
            textTransform: 'uppercase',
          }}
        >
          BASE INTEGRITY
        </h3>

        {/* Overall % */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
          <span
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: overallStatus.color,
              fontSize: 36,
              lineHeight: 1,
            }}
          >
            {overallIntegrity}%
          </span>
          <span
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: overallStatus.color,
              fontSize: 13,
              letterSpacing: 1,
            }}
          >
            {overallStatus.label}
          </span>
        </div>

        {/* Per-component rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {components.map((comp) => {
            const integrity = getIntegrity(comp.damage)
            const { label: statusLabel, color: statusColor } = getStatus(integrity)
            return (
              <div key={comp.key}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{comp.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#e8f5e8' }}>{comp.label}</span>
                  <span style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>
                    {integrity}%
                  </span>
                  <span
                    style={{
                      background: `${statusColor}20`,
                      border: `1px solid ${statusColor}`,
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 9,
                      fontFamily: "'Bungee', sans-serif",
                      color: statusColor,
                      letterSpacing: 0.5,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    background: '#1a3018',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${integrity}%`,
                      background: statusColor,
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 3: Recommended repairs */}
      {damagedComponents.length > 0 && (
        <div
          style={{
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          {/* Header with cost summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3
              style={{
                fontFamily: "'Bungee', sans-serif",
                color: '#ff6b00',
                fontSize: 12,
                letterSpacing: 2,
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              REPAIR STATION
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selections.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    color: overBudget ? '#ff4a4a' : '#f5c842',
                    fontFamily: "'VT323', monospace",
                  }}
                >
                  Cost: {totalCost}🔩
                </span>
              )}
              <span style={{ fontSize: 11, color: '#4a6a4a' }}>Balance: {scrap}🔩</span>
            </div>
          </div>

          {/* Component repair rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {damagedComponents.map((comp) => {
              const integrity = getIntegrity(comp.damage)
              const { label: priorityLabel, color: priorityColor } = getPriority(integrity)
              const selectedForThis = selections.find((s) => s.component === comp.key)

              return (
                <div
                  key={comp.key}
                  style={{
                    background: '#0a160a',
                    border: '1px solid #1a3018',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{comp.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#e8f5e8' }}>{comp.label}</span>
                    <span
                      style={{
                        background: `${priorityColor}20`,
                        border: `1px solid ${priorityColor}`,
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: 9,
                        fontFamily: "'Bungee', sans-serif",
                        color: priorityColor,
                        letterSpacing: 0.5,
                      }}
                    >
                      {priorityLabel}
                    </span>
                  </div>

                  {/* Tier buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['light', 'heavy'] as RepairTier[]).map((tier) => {
                      const { scrapCost, repairAmount } = REPAIR_COSTS[tier]
                      const isSelected = selectedForThis?.tier === tier
                      return (
                        <button
                          key={tier}
                          onClick={() => toggleSelection(comp.key, tier)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: isSelected ? 'rgba(61,255,122,0.12)' : '#0d1810',
                            border: isSelected ? '1px solid #3dff7a' : '1px solid #2a4a2a',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Bungee', sans-serif",
                              fontSize: 10,
                              color: isSelected ? '#3dff7a' : '#4a6a4a',
                              letterSpacing: 0.5,
                              textTransform: 'uppercase',
                            }}
                          >
                            {tier}
                          </span>
                          <span style={{ fontSize: 10, color: '#f5c842' }}>{scrapCost}🔩</span>
                          <span style={{ fontSize: 10, color: '#60b0ff' }}>-{repairAmount} dmg</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {repairError && (
            <p style={{ color: '#ff4a4a', fontSize: 11, marginBottom: 10, margin: '0 0 10px' }}>
              ⚠ {repairError}
            </p>
          )}

          {/* Repair button */}
          <button
            onClick={handleRepair}
            disabled={!canRepair || isRepairing}
            style={{
              width: '100%',
              padding: '12px',
              background: canRepair ? '#3dff7a' : '#1a3018',
              border: 'none',
              borderRadius: 8,
              fontFamily: "'Bungee', sans-serif",
              fontSize: 14,
              letterSpacing: 2,
              color: canRepair ? '#060a06' : '#2a4a2a',
              cursor: canRepair ? 'pointer' : 'not-allowed',
              textTransform: 'uppercase',
              transition: 'background 0.2s',
            }}
          >
            {isRepairing ? 'REPAIRING…' : overBudget ? 'NOT ENOUGH SCRAP' : 'REPAIR NOW'}
          </button>
        </div>
      )}

      {/* SECTION 4: Raid event log */}
      {eventLog.length > 0 && (
        <div
          style={{
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <h3
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#ff6b00',
              fontSize: 12,
              letterSpacing: 2,
              margin: '0 0 12px',
              textTransform: 'uppercase',
            }}
          >
            RAID EVENT LOG
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {eventLog.map((event, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '6px 8px',
                  background: event.isBreachSuccess ? 'rgba(255,74,74,0.06)' : 'transparent',
                  borderRadius: 4,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: 14,
                    color: '#4a6a4a',
                    flexShrink: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {event.time}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: event.isBreachSuccess ? 'rgba(255,74,74,0.85)' : '#6a8a6a',
                    flex: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {event.description}
                </span>
                {event.damage > 0 && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: "'VT323', monospace",
                      fontSize: 14,
                      color: '#ff4a4a',
                    }}
                  >
                    -{event.damage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
