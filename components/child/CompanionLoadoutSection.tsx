'use client'

import { useState } from 'react'
import { PetSprite } from './PetSprite'

interface CompanionEntry {
  userCompanionId: string
  companionId: string
  equipped: boolean
  companion: {
    name: string
    type: string
    color: string
    bonusType: string
    bonusValue: number
    description: string | null
    costCurrency: number
  }
}

interface Props {
  owned: CompanionEntry[]
  allCompanions: {
    id: string
    name: string
    type: string
    color: string
    bonusType: string
    bonusValue: number
    description: string | null
    costCurrency: number
    unlockLevel: number
  }[]
  playerLevel: number
  scrap: number
}

const BONUS_LABEL: Record<string, string> = {
  detection: '🔍 Detection',
  luck: '🍀 Luck',
  visibility: '👁 Visibility',
  scavenging: '🔩 Scavenging',
  speed: '⚡ Speed',
  comfort: '💚 Comfort',
}

export function CompanionLoadoutSection({ owned, allCompanions, playerLevel, scrap }: Props) {
  const [equippedId, setEquippedId] = useState<string | null>(
    () => owned.find((e) => e.equipped)?.companionId ?? null,
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [ownedIds] = useState<Set<string>>(() => new Set(owned.map((e) => e.companionId)))
  const [ownedSet, setOwnedSet] = useState<Set<string>>(ownedIds)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const equipped = allCompanions.find((c) => c.id === equippedId) ?? null

  async function handleEquip(companionId: string) {
    if (loadingId) return
    setErrorMsg(null)
    setLoadingId(companionId)
    const res = await fetch(`/api/child/companions/${companionId}/equip`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setEquippedId(data.equipped ? companionId : null)
    } else {
      setErrorMsg('Could not update companion. Try again.')
    }
    setLoadingId(null)
  }

  async function handleBuy(companionId: string, cost: number) {
    if (buyingId) return
    if (scrap < cost) {
      setErrorMsg(`Not enough scrap — need ${cost}, have ${scrap}.`)
      return
    }
    setErrorMsg(null)
    setBuyingId(companionId)
    const res = await fetch(`/api/child/companions/${companionId}/acquire`, { method: 'POST' })
    if (res.ok) {
      setOwnedSet((prev) => new Set(prev).add(companionId))
    } else {
      const data = await res.json().catch(() => ({}))
      setErrorMsg(data?.error ?? 'Could not acquire companion. Try again.')
    }
    setBuyingId(null)
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h3
          style={{
            fontFamily: "'Bungee', sans-serif",
            color: '#ff6b00',
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          COMPANIONS
        </h3>
        <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
      </div>

      {errorMsg && (
        <div
          style={{
            background: 'rgba(255,74,74,0.1)',
            border: '1px solid rgba(255,74,74,0.35)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 10,
            fontSize: 11,
            color: '#ff9090',
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* Equipped companion card */}
      <div
        style={{
          background: '#0d1810',
          border: equipped ? '1px solid #3dff7a' : '2px dashed #1a3018',
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
          minHeight: 72,
        }}
      >
        {equipped ? (
          <>
            <PetSprite type={equipped.type} color={equipped.color} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 14, color: '#fff' }}>
                  {equipped.name}
                </span>
                <span
                  style={{
                    background: '#1a4020',
                    color: '#3dff7a',
                    fontSize: 8,
                    fontFamily: "'Bungee', sans-serif",
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#4a7a40' }}>
                {BONUS_LABEL[equipped.bonusType] ?? equipped.bonusType} +{equipped.bonusValue}
              </p>
              {equipped.description && (
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#3a5a38', fontStyle: 'italic' }}>
                  {equipped.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleEquip(equipped.id)}
              disabled={!!loadingId}
              style={{
                background: 'none',
                border: 'none',
                color: '#4a6a4a',
                fontSize: 10,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              UNEQUIP
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: '#0a1208',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 19 Q7 16 9 18 Q11 20 12 18 Q13 16 15 18 Q17 20 20 19"
                  stroke="#2a4a28"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <ellipse cx="12" cy="10" rx="5" ry="4" stroke="#2a4a28" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Bungee', sans-serif", fontSize: 12, color: '#2a4a28', margin: 0 }}>
                No Companion
              </p>
              <p style={{ fontSize: 10, color: '#1a3018', margin: '3px 0 0' }}>
                Select a companion below
              </p>
            </div>
          </>
        )}
      </div>

      {/* Companion grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {allCompanions.map((c) => {
          const isOwned = ownedSet.has(c.id)
          const isEquipped = equippedId === c.id
          const isLoading = loadingId === c.id || buyingId === c.id
          const canUnlock = playerLevel >= c.unlockLevel
          const canAfford = scrap >= c.costCurrency

          return (
            <div key={c.id} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  if (isOwned) handleEquip(c.id)
                  else if (canUnlock && canAfford) handleBuy(c.id, c.costCurrency)
                }}
                disabled={isLoading || (!isOwned && (!canUnlock || !canAfford))}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  background: isEquipped
                    ? 'rgba(61,255,122,0.08)'
                    : isOwned
                    ? '#0d1810'
                    : 'rgba(10,18,8,0.6)',
                  border: isEquipped
                    ? '2px solid #3dff7a'
                    : isOwned
                    ? '1px solid #1a3018'
                    : '1px dashed #1a3018',
                  cursor: isLoading ? 'wait' : isOwned || (canUnlock && canAfford) ? 'pointer' : 'default',
                  transition: 'transform 0.1s, border-color 0.15s',
                  padding: '8px 4px 6px',
                  opacity: !isOwned && (!canUnlock || !canAfford) ? 0.5 : 1,
                }}
              >
                {isLoading ? (
                  <span style={{ fontSize: 18 }}>⏳</span>
                ) : (
                  <PetSprite type={c.type} color={c.color} size={36} />
                )}
                <span
                  style={{
                    fontSize: 7,
                    fontFamily: "'Bungee', sans-serif",
                    color: isEquipped ? '#3dff7a' : isOwned ? '#4a7a40' : '#2a4a28',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    letterSpacing: 0.3,
                  }}
                >
                  {c.name}
                </span>

                {/* EQ badge */}
                {isEquipped && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: 3,
                      background: '#3dff7a',
                      padding: '1px 3px',
                      borderRadius: 3,
                    }}
                  >
                    <span style={{ fontSize: 6, fontWeight: 900, color: '#060a06', lineHeight: 1 }}>EQ</span>
                  </div>
                )}

                {/* Cost badge if not owned */}
                {!isOwned && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 3,
                      background: canUnlock && canAfford ? 'rgba(245,200,66,0.2)' : 'rgba(0,0,0,0.4)',
                      padding: '1px 3px',
                      borderRadius: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 7,
                        color: canUnlock && canAfford ? '#f5c842' : '#4a4a4a',
                        fontFamily: "'VT323', monospace",
                        lineHeight: 1,
                      }}
                    >
                      🔩{c.costCurrency}
                    </span>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
