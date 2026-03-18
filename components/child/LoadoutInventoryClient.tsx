'use client'

import { useState, useMemo } from 'react'
import { CosmeticSlot } from '@prisma/client'

const SLOT_ICON: Record<string, string> = {
  head:      '🪖',
  top:       '👕',
  bottom:    '👖',
  shoes:     '👟',
  accessory: '🕶️',
  backpack:  '🎒',
  handheld:  '🔧',
}

const SLOT_LABEL: Record<string, string> = {
  head:      'Hat',
  top:       'Outfit',
  bottom:    'Bottoms',
  shoes:     'Shoes',
  accessory: 'Accessory',
  backpack:  'Backpack',
  handheld:  'Handheld',
}

const RARITY_COLOR: Record<string, { border: string; glow: string; label: string }> = {
  common:    { border: '#475569', glow: 'none',                                  label: '#94a3b8' },
  rare:      { border: '#f29d26', glow: '0 0 8px rgba(242,157,38,0.4)',          label: '#f29d26' },
  epic:      { border: '#a855f7', glow: '0 0 8px rgba(168,85,247,0.4)',          label: '#c084fc' },
  legendary: { border: '#fbbf24', glow: '0 0 12px rgba(251,191,36,0.6)',         label: '#fde68a' },
}

interface ItemStats {
  defense?:        number
  xp_boost?:       number
  inventory_space?: number
  scrap_bonus?:    number
}

interface OwnedItem {
  inventoryItemId: string
  equipped:        boolean
  inventoryItem: {
    id:           string
    name:         string
    slug:         string
    type:         string
    cosmeticSlot: CosmeticSlot | null
    rarity:       string
    description:  string | null
    statsJson:    ItemStats | null
  }
}

interface Props {
  ownedCosmetics:    OwnedItem[]
  baseInventory?:    number
}

function StatValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  return <span>{value}{suffix}</span>
}

export function LoadoutInventoryClient({ ownedCosmetics, baseInventory = 20 }: Props) {
  const [equippedIds, setEquippedIds] = useState<Set<string>>(
    () => new Set(ownedCosmetics.filter((e) => e.equipped).map((e) => e.inventoryItemId))
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [loading,   setLoading]   = useState<string | null>(null)

  // Compute totals from equipped items
  const totals = useMemo(() => {
    let defense = 0, xpBoost = 0, inventory = 0, scrapBonus = 0
    for (const entry of ownedCosmetics) {
      if (!equippedIds.has(entry.inventoryItemId)) continue
      const s = entry.inventoryItem.statsJson
      if (!s) continue
      defense    += s.defense         ?? 0
      xpBoost    += s.xp_boost        ?? 0
      inventory  += s.inventory_space ?? 0
      scrapBonus += s.scrap_bonus     ?? 0
    }
    return { defense, xpBoost, inventory, scrapBonus }
  }, [ownedCosmetics, equippedIds])

  async function handleEquip(itemId: string) {
    if (loading) return
    setLoading(itemId)
    const res = await fetch(`/api/child/shop/${itemId}/equip`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setEquippedIds((prev) => {
        const next = new Set(prev)
        if (data.equipped) {
          next.add(itemId)
        } else {
          next.delete(itemId)
        }
        return next
      })
    }
    setLoading(null)
  }

  const stats = totals

  return (
    <div>
      {/* ── STATS PANEL ─────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3 grid grid-cols-4 gap-2 mb-0"
        style={{ background: '#0d1610', borderBottom: '1px solid #1a3018' }}
      >
        {[
          { icon: '🛡️', value: stats.defense,       suffix: '',  color: '#60b0ff', label: 'Defense'  },
          { icon: '⭐', value: stats.xpBoost,        suffix: '%', color: '#f5c842', label: 'XP Boost' },
          { icon: '📦', value: baseInventory + stats.inventory, suffix: '', color: '#3dff7a', label: 'Capacity' },
          { icon: '🔩', value: stats.scrapBonus,     suffix: '%', color: '#f5c842', label: 'Scrap'    },
        ].map(({ icon, value, suffix, color, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 rounded-lg"
            style={{ padding: 10, background: '#0d1810', border: '1px solid #1a3018', borderRadius: 8 }}
          >
            <span className="text-sm">{icon}</span>
            <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 22, color, lineHeight: 1 }}>
              <StatValue value={value} suffix={suffix} />
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: '#4a7a40', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── GEAR INVENTORY GRID ─────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 style={{ fontFamily: "'Bungee', sans-serif", color: '#ff6b00', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            GEAR INVENTORY
          </h3>
          <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2a4a28', textTransform: 'uppercase' }}>
            {ownedCosmetics.length}/50
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6" style={{ gap: 8 }}>
          {ownedCosmetics.map((entry) => {
            const isEquipped = equippedIds.has(entry.inventoryItemId)
            const rarity     = RARITY_COLOR[entry.inventoryItem.rarity] ?? RARITY_COLOR.common
            const isLoading  = loading === entry.inventoryItemId
            const isHovered  = hoveredId === entry.inventoryItemId
            const stats      = entry.inventoryItem.statsJson

            return (
              <div key={entry.inventoryItemId} className="relative" style={{ width: 60, height: 60 }}>
                <button
                  onClick={() => handleEquip(entry.inventoryItemId)}
                  onMouseEnter={() => setHoveredId(entry.inventoryItemId)}
                  onMouseLeave={() => setHoveredId(null)}
                  disabled={!!loading}
                  style={{
                    width: 60, height: 60,
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                    background: isEquipped ? 'rgba(61,255,122,0.08)' : '#0d1810',
                    border: `2px solid ${isEquipped ? rarity.border : '#1a3018'}`,
                    boxShadow: isEquipped ? rarity.glow : 'none',
                    cursor: isLoading ? 'wait' : 'pointer',
                    position: 'relative',
                    transition: 'transform 0.1s, border-color 0.15s',
                    transform: isHovered && !isLoading ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {isLoading
                    ? <span style={{ fontSize: 14, color: '#4a7a40' }}>⏳</span>
                    : SLOT_ICON[entry.inventoryItem.cosmeticSlot ?? ''] ?? (
                        (entry.inventoryItem.type === 'weapon' || entry.inventoryItem.type === 'tool') ? '🔦' : '🎨'
                      )
                  }
                  {/* Rarity dot */}
                  <div
                    style={{
                      position: 'absolute', bottom: 4, right: 4,
                      width: 6, height: 6, borderRadius: '50%',
                      background: rarity.border,
                    }}
                  />
                  {/* EQ badge */}
                  {isEquipped && (
                    <div
                      style={{
                        position: 'absolute', top: 2, left: 2,
                        padding: '1px 3px', borderRadius: 3,
                        background: '#3dff7a',
                      }}
                    >
                      <span style={{ fontSize: 6, fontWeight: 900, color: '#060a06', lineHeight: 1 }}>EQ</span>
                    </div>
                  )}
                </button>

                {/* Hover tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '110%', left: '50%',
                      transform: 'translateX(-50%)',
                      minWidth: 140, maxWidth: 180,
                      background: '#0f1e10',
                      border: `1px solid ${rarity.border}`,
                      borderRadius: 10,
                      padding: '8px 10px',
                      zIndex: 50,
                      pointerEvents: 'none',
                      boxShadow: `0 4px 18px rgba(0,0,0,0.7), ${rarity.glow !== 'none' ? rarity.glow : ''}`,
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#c8e0c0', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.inventoryItem.name}
                    </p>
                    <p style={{ fontSize: 9, color: rarity.label, margin: '0 0 6px', textTransform: 'capitalize' }}>
                      {SLOT_LABEL[entry.inventoryItem.cosmeticSlot ?? ''] ?? 'Handheld'} · {entry.inventoryItem.rarity}
                    </p>
                    {stats && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {stats.defense         != null && stats.defense         > 0 && <span style={{ fontSize: 9, color: '#60b0ff', fontWeight: 700 }}>🛡️ +{stats.defense} Defense</span>}
                        {stats.xp_boost        != null && stats.xp_boost        > 0 && <span style={{ fontSize: 9, color: '#c084fc', fontWeight: 700 }}>⭐ +{stats.xp_boost}% XP</span>}
                        {stats.inventory_space != null && stats.inventory_space > 0 && <span style={{ fontSize: 9, color: '#3dff7a', fontWeight: 700 }}>📦 +{stats.inventory_space} Slots</span>}
                        {stats.scrap_bonus     != null && stats.scrap_bonus     > 0 && <span style={{ fontSize: 9, color: '#f5c842', fontWeight: 700 }}>🔩 +{stats.scrap_bonus}% Scrap</span>}
                      </div>
                    )}
                    {(!stats || Object.values(stats).every((v) => !v)) && (
                      <p style={{ fontSize: 9, color: '#4a6a4a', margin: 0 }}>Cosmetic only</p>
                    )}
                    <p style={{ fontSize: 8, color: isEquipped ? '#3dff7a' : '#ff6b00', margin: '6px 0 0', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isEquipped ? 'Tap to unequip' : 'Tap to equip'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Empty filler cells */}
          {Array.from({ length: Math.max(0, 8 - ownedCosmetics.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                width: 60, height: 60,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0a140a',
                border: '2px dashed #1a3018',
              }}
            >
              <span style={{ fontSize: 10, color: '#1a3018' }}>+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
