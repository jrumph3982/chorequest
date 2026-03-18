import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { LoadoutAvatarClient } from '@/components/child/LoadoutAvatarClient'
import { LoadoutInventoryClient } from '@/components/child/LoadoutInventoryClient'
import { CompanionLoadoutSection } from '@/components/child/CompanionLoadoutSection'
import { CosmeticSlot } from '@prisma/client'
import { resolveGearSlotKey } from '@/lib/gear/slots'

const SLOT_ICON: Record<CosmeticSlot, string> = {
  head:      '🪖',
  top:       '👕',
  bottom:    '👖',
  shoes:     '👟',
  accessory: '🕶️',
  backpack:  '🎒',
  handheld:  '🔧',
}

const SLOT_LABEL: Record<CosmeticSlot, string> = {
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

// Slots shown on either side of the character in the RPG layout
const LEFT_SLOTS:  string[] = ['head', 'top', 'backpack']
const RIGHT_SLOTS: string[] = ['accessory', 'bottom', 'handheld']

export default async function LoadoutPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  const [ownedCosmetics, childProfile, child, ownedCompanions, allCompanions] = await Promise.all([
    prisma.userInventory.findMany({
      where: {
        childUserId: session.userId,
        OR: [
          { inventoryItem: { cosmeticSlot: { not: null } } },
          { inventoryItem: { type: { in: ['weapon', 'tool'] } } },
        ],
      },
      include: {
        inventoryItem: {
          select: { id: true, name: true, slug: true, type: true, cosmeticSlot: true, rarity: true, description: true, statsJson: true },
        },
      },
    }),
    prisma.childProfile.findUnique({
      where: { userId: session.userId },
      select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true } as any,
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { level: true, gameCurrencyBalance: true },
    }),
    prisma.userCompanion.findMany({
      where: { childUserId: session.userId },
      include: {
        companion: {
          select: { id: true, name: true, type: true, color: true, bonusType: true, bonusValue: true, description: true, costCurrency: true },
        },
      },
    }),
    prisma.companion.findMany({
      orderBy: [{ unlockLevel: 'asc' }, { costCurrency: 'asc' }],
      select: { id: true, name: true, type: true, color: true, bonusType: true, bonusValue: true, description: true, costCurrency: true, unlockLevel: true },
    }),
  ])

  const equippedBySlot = new Map<string, typeof ownedCosmetics[number]>()
  for (const entry of ownedCosmetics) {
    if (!entry.equipped) continue
    const key = resolveGearSlotKey(entry.inventoryItem as any)
    if (key) equippedBySlot.set(key, entry)
  }

  const hasAny = ownedCosmetics.length > 0

  // ── Slot tile helper ────────────────────────────────────────────────────────
  function SlotTile({ slot }: { slot: string }) {
    const equipped = equippedBySlot.get(slot)
    const rarity = equipped ? (RARITY_COLOR[equipped.inventoryItem.rarity] ?? RARITY_COLOR.common) : null
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex items-center justify-center rounded-xl text-xl transition-all"
          style={{
            width: 48, height: 48,
            background: equipped ? 'rgba(61,255,122,0.08)' : '#0d1810',
            border: equipped ? '2px solid #3dff7a' : '2px solid #1a3018',
            boxShadow: equipped ? '0 0 10px rgba(61,255,122,0.25)' : 'none',
          }}
        >
          {equipped
            ? <span style={{ fontSize: 20, opacity: 1 }}>{(SLOT_ICON as Record<string, string>)[slot]}</span>
            : <span style={{ color: '#1a3018', fontSize: 18, opacity: 0.4 }}>{(SLOT_ICON as Record<string, string>)[slot]}</span>
          }
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: equipped ? '#3dff7a' : '#2a4a28' }}>
          {(SLOT_LABEL as Record<string, string>)[slot]}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#060a06', color: '#c8e0c0' }}>

      {/* ── STAT BAR ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: '#060a06', borderBottom: '1px solid #1a3018' }}
      >
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)', color: '#f5c842' }}
        >
          ⚡ LVL {child?.level ?? 1}
        </div>
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(61,255,122,0.06)', border: '1px solid #1a3018', color: '#4a7a40' }}
        >
          🔩 {(child?.gameCurrencyBalance ?? 0).toLocaleString()} scrap
        </div>
      </div>

      {/* Stats panel + inventory managed by LoadoutInventoryClient (client-side, live equip) */}

      {/* ── RPG CHARACTER PREVIEW ───────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: 'clamp(240px, 38vh, 300px)',
          background: 'linear-gradient(180deg, #060a06 0%, #0d1610 60%, #060a06 100%)',
          borderBottom: '1px solid #1a3018',
        }}
      >
        {/* Left equipment slots */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {LEFT_SLOTS.map((slot) => <SlotTile key={slot} slot={slot} />)}
        </div>

        {/* Character centred */}
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          {/* Glow beneath feet */}
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 90,
              height: 14,
              background: 'rgba(61,255,122,0.15)',
              filter: 'blur(6px)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
          <LoadoutAvatarClient gear={{ head: equippedBySlot.get('head')?.inventoryItem.slug ?? null, belt: equippedBySlot.get('accessory')?.inventoryItem.slug ?? null, backpack: equippedBySlot.get('backpack')?.inventoryItem.slug ?? null }} />
        </div>

        {/* Right equipment slots */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {RIGHT_SLOTS.map((slot) => <SlotTile key={slot} slot={slot} />)}
        </div>
      </div>

      {/* ── INVENTORY (client-side, instant equip + live stats) ──────────────── */}
      {!hasAny ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="text-4xl">🎒</div>
          <p style={{ fontSize: 13, color: '#4a6a4a' }}>No gear yet. Visit the shop!</p>
          <Link
            href="/play/shop"
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: '#f5c842' }}
          >
            Browse the shop →
          </Link>
        </div>
      ) : (
        <LoadoutInventoryClient
          ownedCosmetics={ownedCosmetics as any}
          baseInventory={20}
        />
      )}

      {/* ── COMPANION SECTION ───────────────────────────────────────────────── */}
      <div style={{ background: '#060a06', borderTop: '1px solid #1a3018', paddingTop: 16 }}>
        <CompanionLoadoutSection
          owned={ownedCompanions.map((uc) => ({
            userCompanionId: uc.id,
            companionId: uc.companionId,
            equipped: uc.equipped,
            companion: uc.companion,
          }))}
          allCompanions={allCompanions}
          playerLevel={child?.level ?? 1}
          scrap={child?.gameCurrencyBalance ?? 0}
        />
      </div>

      {/* Shop CTA */}
      <div className="px-4 pb-24 mt-2" style={{ background: '#060a06' }}>
        <Link
          href="/play/shop"
          className="w-full rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform uppercase tracking-wider btn-pulse"
          style={{ background: '#ff6b00', color: '#1a0800', boxShadow: '0 0 18px rgba(255,107,0,0.4)', height: 52, fontFamily: "'Bungee', sans-serif", letterSpacing: 2 }}
        >
          📦 GEAR SHOP
        </Link>
      </div>
    </div>
  )
}
