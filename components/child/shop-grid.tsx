'use client'

import { useState } from 'react'
import { BuyButton } from '@/components/child/buy-button'
import { EquipButton } from '@/components/child/equip-button'
import { CompanionButton } from '@/components/child/companion-button'
import { ItemType, CosmeticSlot } from '@prisma/client'
import { getItemIcon } from '@/lib/constants/item-icons'

type Tab = 'head' | 'body' | 'accessory' | 'backpack' | 'handheld' | 'pets'

const TABS: { key: Tab; label: string }[] = [
  { key: 'head',      label: 'Head'      },
  { key: 'body',      label: 'Body'      },
  { key: 'accessory', label: 'Accessory' },
  { key: 'backpack',  label: 'Backpack'  },
  { key: 'handheld',  label: 'Handheld'  },
  { key: 'pets',      label: 'Pets'      },
]

// Inline rarity style config
const RARITY_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  common:    { bg: '#2a2a2a', color: '#888',    border: '#3a3a3a', label: 'Common'  },
  rare:      { bg: '#1a2a4a', color: '#60a0ff', border: '#2a4a7a', label: 'Rare'    },
  epic:      { bg: '#2a1a4a', color: '#a060ff', border: '#4a2a7a', label: 'Epic'    },
  legendary: { bg: '#3a2a00', color: '#f5c842', border: '#6a5000', label: 'Legend'  },
}

export interface ShopItem {
  id: string
  slug: string
  name: string
  description: string | null
  type: ItemType
  rarity: string
  cosmeticSlot: CosmeticSlot | null
  costCurrency: number
  unlockLevel: number
  imageUrl?: string | null
  statsJson?: unknown
}

export interface ShopCompanion {
  id: string
  name: string
  description: string | null
  type: string
  costCurrency: number
  unlockLevel: number
  bonusType: string
  bonusValue: number
  imageUrl?: string | null
}

interface Props {
  items: ShopItem[]
  companions: ShopCompanion[]
  ownedMap: Record<string, boolean>
  ownedCompanionMap: Record<string, boolean>
  scrap: number
  level: number
}

/** Build a concise stat summary string from statsJson */
function buildStatLine(statsJson: unknown): string {
  if (!statsJson || typeof statsJson !== 'object') return ''
  const stats = statsJson as Record<string, number>
  const parts: string[] = []
  if (stats.defense)         parts.push(`🛡️ +${stats.defense}`)
  if (stats.xp_boost)        parts.push(`⭐ +${stats.xp_boost}%`)
  if (stats.inventory_space) parts.push(`📦 +${stats.inventory_space}`)
  if (stats.speed)           parts.push(`⚡ +${stats.speed}`)
  if (stats.resistance)      parts.push(`🧪 +${stats.resistance}`)
  if (stats.stealth)         parts.push(`👁 +${stats.stealth}`)
  if (stats.attack)          parts.push(`⚔️ +${stats.attack}`)
  if (stats.visibility)      parts.push(`🔦 +${stats.visibility}`)
  return parts.slice(0, 3).join('  ')
}

export function ShopGrid({ items, companions, ownedMap, ownedCompanionMap, scrap, level }: Props) {
  const [tab, setTab] = useState<Tab>('head')

  function filterItems(): ShopItem[] {
    switch (tab) {
      case 'head':      return items.filter((i) => i.cosmeticSlot === 'head')
      case 'body':      return items.filter((i) => i.cosmeticSlot && ['top','bottom','shoes'].includes(i.cosmeticSlot))
      case 'accessory': return items.filter((i) => i.cosmeticSlot === 'accessory')
      case 'backpack':  return items.filter((i) => i.cosmeticSlot === 'backpack')
      case 'handheld':  return items.filter((i) => i.type === 'weapon' || i.type === 'tool' || i.cosmeticSlot === 'handheld')
      default:          return []
    }
  }

  const visibleItems = tab === 'pets' ? [] : filterItems()
  const visibleCompanions = tab === 'pets' ? companions : []

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#060a06' }}>
      {/* Category tabs */}
      <div className="flex gap-0 px-4 overflow-x-auto border-b border-[#1a3018] bg-[#060a06]/90 backdrop-blur-md">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 pb-2 pt-1 text-xs font-bold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-[#3dff7a] text-[#3dff7a]'
                : 'border-transparent text-slate-400 hover:text-slate-200 opacity-60 hover:opacity-100'
            }`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3 pb-8">
        {visibleItems.length === 0 && visibleCompanions.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-12">Nothing here yet — keep earning Scrap!</p>
        )}

        <div className="grid grid-cols-3" style={{ gap: 10 }}>
          {/* Inventory items */}
          {visibleItems.map((item) => {
            const isOwned    = item.id in ownedMap
            const isEquipped = ownedMap[item.id] ?? false
            const levelMet   = level >= item.unlockLevel
            const canAfford  = scrap >= item.costCurrency
            const rStyle     = RARITY_STYLE[item.rarity] ?? RARITY_STYLE.common
            const statLine   = buildStatLine(item.statsJson)

            return (
              <div
                key={item.id}
                style={{
                  maxHeight: 160,
                  borderRadius: 10,
                  background: '#0d1810',
                  border: `1px solid ${isEquipped ? '#3dff7a' : '#1a3018'}`,
                  overflow: 'hidden',
                  boxShadow: isEquipped ? '0 0 8px rgba(61,255,122,0.2)' : 'none',
                  opacity: !levelMet ? 0.55 : 1,
                }}
              >
                {/* Image / icon area */}
                <div
                  style={{
                    height: 80,
                    background: '#0a1208',
                    borderRadius: '9px 9px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: 64, height: 64, objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getItemIcon(item.slug)}
                    </div>
                  )}

                  {/* Rarity badge — top-left */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: rStyle.bg,
                      color: rStyle.color,
                      border: `1px solid ${rStyle.border}`,
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {rStyle.label}
                  </div>

                  {/* Lock overlay */}
                  {!levelMet && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.65)',
                        borderRadius: '9px 9px 0 0',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>LVL {item.unlockLevel}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '8px 10px', background: '#0d1810' }}>
                  <div
                    style={{
                      fontFamily: "'Bungee', sans-serif",
                      fontSize: 12,
                      color: '#fff',
                      marginBottom: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </div>

                  {/* Stat line */}
                  {statLine ? (
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 10,
                        color: '#4a7a40',
                        marginBottom: 5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {statLine}
                    </div>
                  ) : (
                    <div style={{ marginBottom: 5 }} />
                  )}

                  {/* Cost + action row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span
                      style={{
                        fontFamily: "'Bungee', sans-serif",
                        fontSize: 12,
                        color: '#f5c842',
                        flexShrink: 0,
                      }}
                    >
                      {item.costCurrency === 0 ? 'Free' : `${item.costCurrency} ⚙`}
                    </span>
                    <div style={{ height: 28, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      {isOwned ? (
                        <EquipButton itemId={item.id} equipped={isEquipped} />
                      ) : (
                        <BuyButton
                          itemId={item.id}
                          cost={item.costCurrency}
                          owned={isOwned}
                          levelMet={levelMet}
                          canAfford={canAfford}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Companions (pets tab) */}
          {visibleCompanions.map((c) => {
            const isOwned    = c.id in ownedCompanionMap
            const isEquipped = ownedCompanionMap[c.id] ?? false
            const levelMet   = level >= c.unlockLevel
            const canAfford  = scrap >= c.costCurrency

            return (
              <div
                key={c.id}
                style={{
                  maxHeight: 160,
                  borderRadius: 10,
                  background: '#0d1810',
                  border: `1px solid ${isEquipped ? '#3dff7a' : '#1a3018'}`,
                  overflow: 'hidden',
                  opacity: !levelMet ? 0.55 : 1,
                }}
              >
                <div
                  style={{
                    height: 80,
                    background: '#0a1208',
                    borderRadius: '9px 9px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 36 }}>🐾</span>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: '#1a2a1a',
                      color: '#3dff7a',
                      border: '1px solid #2a4a2a',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    Pet
                  </div>
                  {!levelMet && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.65)',
                        borderRadius: '9px 9px 0 0',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginTop: 2 }}>LVL {c.unlockLevel}</span>
                    </div>
                  )}
                </div>

                <div style={{ padding: '8px 10px', background: '#0d1810' }}>
                  <div
                    style={{
                      fontFamily: "'Bungee', sans-serif",
                      fontSize: 12,
                      color: '#fff',
                      marginBottom: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      color: '#4a7a40',
                      marginBottom: 5,
                    }}
                  >
                    +{c.bonusValue} {c.bonusType}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 12, color: '#f5c842', flexShrink: 0 }}>
                      {c.costCurrency} ⚙
                    </span>
                    <div style={{ height: 28, display: 'flex', alignItems: 'center' }}>
                      <CompanionButton
                        companionId={c.id}
                        cost={c.costCurrency}
                        owned={isOwned}
                        equipped={isEquipped}
                        levelMet={levelMet}
                        canAfford={canAfford}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
