export type GearSlotKey =
  | 'head'
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'accessory'
  | 'backpack'
  | 'handheld'

export function resolveGearSlotKey(item: {
  cosmeticSlot?: string | null
  type?: string | null
}): GearSlotKey | null {
  if (item.cosmeticSlot) return item.cosmeticSlot as GearSlotKey
  if (item.type === 'weapon' || item.type === 'tool') return 'handheld'
  return null
}

export function resolveDisplaySlotKey(item: {
  cosmeticSlot?: string | null
  type?: string | null
}): GearSlotKey | 'other' {
  return resolveGearSlotKey(item) ?? 'other'
}

export function buildEquippedGearSlots<
  T extends { equipped: boolean; inventoryItem: { cosmeticSlot?: string | null; type?: string | null; slug?: string | null } },
>(items: T[]) {
  const slots: Partial<Record<GearSlotKey, string>> = {}
  for (const entry of items) {
    if (!entry.equipped) continue
    const slot = resolveGearSlotKey(entry.inventoryItem)
    const slug = entry.inventoryItem.slug
    if (slot && slug) slots[slot] = slug
  }
  return slots
}
