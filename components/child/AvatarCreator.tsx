'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  HAIR_STYLES,
  HAIR_COLORS,
  SKIN_TONES,
  EYE_COLORS,
  HAIR_COLOR_SWATCH,
  SKIN_TONE_SWATCH,
  EYE_COLOR_SWATCH,
} from '@/lib/constants/appearance'
import { CharacterRenderer } from '@/components/child/CharacterRenderer'
import { buildEquippedGearSlots, resolveDisplaySlotKey } from '@/lib/gear/slots'

// ─── Category definition ─────────────────────────────────────────────────────

type Category = 'skin' | 'eyes' | 'hair' | 'gear'

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'skin', label: 'Skin',  icon: '🎨' },
  { id: 'eyes', label: 'Eyes',  icon: '👁️' },
  { id: 'hair', label: 'Hair',  icon: '✂️' },
  { id: 'gear', label: 'Gear',  icon: '🎽' },
]

const HAIR_STYLE_ICON: Record<string, string> = {
  Short:    '⚡',
  Long:     '🌊',
  Curly:    '〰️',
  Braided:  '🧶',
  Shaved:   '✦',
  Ponytail: '🎀',
}

const RARITY_COLOR: Record<string, string> = {
  common:    '#475569',
  rare:      '#f29d26',
  epic:      '#a855f7',
  legendary: '#fbbf24',
}

// ─── Slot helpers ─────────────────────────────────────────────────────────────

const SLOT_LABEL: Record<string, string> = {
  head: 'Hat', top: 'Outfit', bottom: 'Bottoms', shoes: 'Shoes',
  accessory: 'Accessory', backpack: 'Backpack', handheld: 'Handheld',
}

const SLOT_ICON: Record<string, string> = {
  head: '🪖', top: '👕', bottom: '👖', shoes: '👟',
  accessory: '🕶️', backpack: '🎒', handheld: '🔦',
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface OwnedItem {
  inventoryItemId: string
  equipped: boolean
  inventoryItem: {
    id: string
    name: string
    slug: string
    type: string
    cosmeticSlot: string | null
    rarity: string
    statsJson: unknown
  }
}

interface Props {
  initialHairStyle: string | null
  initialHairColor: string | null
  initialSkinTone:  string | null
  initialEyeColor:  string | null
  initialGender?:   string | null
  ownedInventory?:  OwnedItem[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AvatarCreator({
  initialHairStyle,
  initialHairColor,
  initialSkinTone,
  initialEyeColor,
  initialGender,
  ownedInventory = [],
}: Props) {
  const router = useRouter()

  const [category,  setCategory]  = useState<Category>('skin')
  const [hairStyle, setHairStyle] = useState(initialHairStyle ?? '')
  const [hairColor, setHairColor] = useState(initialHairColor ?? '')
  const [skinTone,  setSkinTone]  = useState(initialSkinTone  ?? '')
  const [eyeColor,  setEyeColor]  = useState(initialEyeColor  ?? '')
  const [gender,    setGender]    = useState(initialGender    ?? '')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')
  const [equipLoading, setEquipLoading] = useState<string | null>(null)

  const hasSelection = !!(hairStyle || hairColor || skinTone || eyeColor || gender)

  const equippedSlots = {
    head:      null,
    top:       null,
    accessory: null,
    backpack:  null,
    handheld:  null,
    ...buildEquippedGearSlots(ownedInventory),
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)

    const body: Record<string, string> = {}
    if (hairStyle) body.hairStyle = hairStyle
    if (hairColor) body.hairColor = hairColor
    if (skinTone)  body.skinTone  = skinTone
    if (eyeColor)  body.eyeColor  = eyeColor
    if (gender)    body.gender    = gender

    const res = await fetch('/api/child/profile/appearance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed')
    }
    setSaving(false)
  }

  async function toggleEquip(itemId: string) {
    setEquipLoading(itemId)
    await fetch(`/api/child/shop/${itemId}/equip`, { method: 'POST' })
    setEquipLoading(null)
    router.refresh()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0d1117', color: '#e2e8f0' }}>

      {/* ── CHARACTER PREVIEW ──────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-end overflow-hidden flex-shrink-0"
        style={{
          height: 'clamp(200px, 42dvh, 340px)',
          background: 'linear-gradient(180deg, #0d1117 0%, #0f2027 50%, #0d1117 100%)',
          borderBottom: '1px solid rgba(34,197,94,0.15)',
        }}
      >
        {/* Radial ground glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            width: 220, height: 80,
            background: 'radial-gradient(ellipse, rgba(34,197,94,0.18) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />

        {/* Floating info tags */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1.5">
            {skinTone && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
                {skinTone}
              </span>
            )}
            {eyeColor && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                {eyeColor} eyes
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            {hairStyle && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(242,157,38,0.3)', color: '#fbbf24' }}>
                {hairStyle}
              </span>
            )}
            {hairColor && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(242,157,38,0.3)', color: '#fbbf24' }}>
                {hairColor}
              </span>
            )}
          </div>
        </div>

        {/* Character sprite */}
        <div className="relative z-10 pb-5">
          <CharacterRenderer
            hairStyle={hairStyle || null}
            hairColor={hairColor || null}
            skinTone={skinTone   || null}
            eyeColor={eyeColor   || null}
            gender={gender || null}
            gear={equippedSlots}
            width={110}
            animate
          />
        </div>

        {/* Floor line */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.3), transparent)' }}
        />
      </div>

      {/* ── CATEGORY TABS ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all"
            style={
              category === cat.id
                ? { background: '#22c55e', color: '#052e16' }
                : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }
            }
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── ITEM GRID ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* ── SKIN TONE ── */}
        {category === 'skin' && (
          <div className="space-y-6">
            {/* Gender selector */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#475569' }}>
                Character — {gender || 'not set'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['boy', 'girl'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(gender === g ? '' : g)}
                    className="h-14 rounded-xl flex items-center justify-center gap-3 transition-all"
                    style={{
                      border: gender === g ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.07)',
                      background: gender === g ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="text-2xl">{g === 'boy' ? '🧒' : '👧'}</span>
                    <span className="text-sm font-bold capitalize" style={{ color: gender === g ? '#86efac' : '#64748b' }}>
                      {g}
                    </span>
                    {gender === g && <span className="text-[#22c55e] font-black">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin tones */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#475569' }}>
                Skin Tone — {skinTone || 'none selected'}
              </p>
              <div className="grid grid-cols-5 gap-3">
                {SKIN_TONES.map((t) => {
                  const selected = skinTone === t
                  return (
                    <button key={t} onClick={() => setSkinTone(t === skinTone ? '' : t)} title={t}
                      className="flex flex-col items-center gap-2">
                      <div className={`w-full aspect-square rounded-2xl transition-all ${SKIN_TONE_SWATCH[t]}`}
                        style={{
                          border: selected ? '3px solid #22c55e' : '3px solid transparent',
                          boxShadow: selected ? '0 0 18px rgba(34,197,94,0.45)' : undefined,
                          transform: selected ? 'scale(1.08)' : undefined,
                          outline: selected ? undefined : '1px solid rgba(255,255,255,0.08)',
                        }} />
                      <span className="text-[9px] font-bold uppercase tracking-tight leading-none"
                        style={{ color: selected ? '#86efac' : '#475569' }}>
                        {t.split('-')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── EYE COLOR ── */}
        {category === 'eyes' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#475569' }}>
              Eye Color — {eyeColor || 'none selected'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EYE_COLORS.map((c) => {
                const selected = eyeColor === c
                return (
                  <button key={c} onClick={() => setEyeColor(c === eyeColor ? '' : c)}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      border: selected ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.06)',
                      background: selected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                      boxShadow: selected ? '0 0 12px rgba(34,197,94,0.25)' : undefined,
                    }}>
                    <div className={`w-9 h-9 rounded-full shrink-0 ${EYE_COLOR_SWATCH[c]}`}
                      style={{ outline: '2px solid rgba(255,255,255,0.15)' }} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-slate-200">{c}</span>
                      {selected && <span className="text-[9px] font-bold" style={{ color: '#22c55e' }}>EQUIPPED</span>}
                    </div>
                    {selected && <span className="ml-auto text-[#22c55e] font-black">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── HAIR ── */}
        {category === 'hair' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#475569' }}>
                Style — {hairStyle || 'none'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {HAIR_STYLES.map((s) => {
                  const selected = hairStyle === s
                  return (
                    <button key={s} onClick={() => setHairStyle(s === hairStyle ? '' : s)}
                      className="relative aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
                      style={{
                        border: selected ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.07)',
                        background: selected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                        boxShadow: selected ? '0 0 16px rgba(34,197,94,0.3)' : undefined,
                      }}>
                      <span className="text-3xl">{HAIR_STYLE_ICON[s] ?? '💈'}</span>
                      <span className="text-[9px] font-bold uppercase tracking-tight"
                        style={{ color: selected ? '#86efac' : '#64748b' }}>
                        {s}
                      </span>
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-black" style={{ color: '#22c55e' }}>✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#475569' }}>
                Color — {hairColor || 'none'}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {HAIR_COLORS.map((c) => {
                  const selected = hairColor === c
                  return (
                    <button key={c} onClick={() => setHairColor(c === hairColor ? '' : c)}
                      className="flex flex-col items-center gap-2">
                      <div className={`w-full aspect-square rounded-xl transition-all ${HAIR_COLOR_SWATCH[c]}`}
                        style={{
                          border: selected ? '3px solid #22c55e' : '3px solid transparent',
                          boxShadow: selected ? '0 0 16px rgba(34,197,94,0.45)' : undefined,
                          transform: selected ? 'scale(1.08)' : undefined,
                          outline: selected ? undefined : '1px solid rgba(255,255,255,0.1)',
                        }} />
                      <span className="text-[9px] font-bold uppercase tracking-tight leading-none"
                        style={{ color: selected ? '#86efac' : '#475569' }}>
                        {c}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── GEAR ── */}
        {category === 'gear' && (
          <div className="space-y-4">
            {ownedInventory.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="text-5xl">🔒</div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No gear yet</p>
                <p className="text-xs text-slate-600 text-center max-w-xs">
                  Earn Scrap by completing missions and spend it in the shop to unlock gear.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ownedInventory.map((entry) => {
                  const slotKey = resolveDisplaySlotKey(entry.inventoryItem)
                  const rarityColor = RARITY_COLOR[entry.inventoryItem.rarity] ?? RARITY_COLOR.common
                  const stats = entry.inventoryItem.statsJson as Record<string, number> | null
                  return (
                    <div
                      key={entry.inventoryItemId}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{
                        background: entry.equipped ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${entry.equipped ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <span className="text-xl shrink-0">{SLOT_ICON[slotKey] ?? '🎨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">{entry.inventoryItem.name}</p>
                        <p className="text-[10px] capitalize" style={{ color: rarityColor }}>
                          {SLOT_LABEL[slotKey] ?? slotKey} · {entry.inventoryItem.rarity}
                        </p>
                        {stats && typeof stats === 'object' && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {stats.defense        ? <span className="text-[9px] bg-blue-500/15 text-blue-300 px-1 py-0.5 rounded font-bold">🛡️ +{stats.defense}</span> : null}
                            {stats.xp_boost       ? <span className="text-[9px] bg-purple-500/15 text-purple-300 px-1 py-0.5 rounded font-bold">⭐ +{stats.xp_boost}%</span> : null}
                            {stats.inventory_space ? <span className="text-[9px] bg-green-500/15 text-green-300 px-1 py-0.5 rounded font-bold">📦 +{stats.inventory_space}</span> : null}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleEquip(entry.inventoryItemId)}
                        disabled={equipLoading === entry.inventoryItemId}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
                        style={entry.equipped
                          ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
                        }
                      >
                        {equipLoading === entry.inventoryItemId ? '…' : entry.equipped ? '✓ On' : 'Equip'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SAVE BUTTON ────────────────────────────────────────────────────── */}
      {category !== 'gear' && (
        <div className="flex-shrink-0 px-4 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
          {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
          <button
            onClick={save}
            disabled={saving || !hasSelection}
            className="w-full py-4 rounded-xl font-extrabold uppercase tracking-wider text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: hasSelection && !saving ? '#22c55e' : 'rgba(34,197,94,0.25)',
              color: '#052e16',
              boxShadow: hasSelection && !saving ? '0 0 28px rgba(34,197,94,0.3)' : 'none',
            }}
          >
            {saving ? '⏳ Saving…' : saved ? '✓ Saved!' : '✔ Save Look'}
          </button>
        </div>
      )}
    </div>
  )
}
