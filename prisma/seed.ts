import { PrismaClient, ItemType, ItemRarity, CosmeticSlot } from '@prisma/client'

const prisma = new PrismaClient()

// ── helpers ──────────────────────────────────────────────────────────────────

async function upsertInventoryItem(data: Parameters<typeof prisma.inventoryItem.create>[0]['data']) {
  return prisma.inventoryItem.upsert({
    where: { slug: data.slug as string },
    update: data,
    create: data,
  })
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database…')

  // ── Theme ─────────────────────────────────────────────────────────────────
  const theme = await prisma.theme.upsert({
    where:  { slug: 'zombie-survival' },
    update: { name: 'Zombie Survival', configJson: { primaryColor: '#16a34a', accentColor: '#dc2626', currency: 'Scrap', currencyIcon: '🔩', baseIcon: '🏚️' } },
    create: { slug: 'zombie-survival', name: 'Zombie Survival', configJson: { primaryColor: '#16a34a', accentColor: '#dc2626', currency: 'Scrap', currencyIcon: '🔩', baseIcon: '🏚️' } },
  })
  console.log('✓ Theme upserted:', theme.name)

  // ── Inventory items (upsert on slug) ──────────────────────────────────────
  const items = await Promise.all([
    upsertInventoryItem({ themeId: theme.id, slug: 'nail-boards',           name: 'Nail Boards on Windows',   description: 'Board up the windows to slow zombie entry.',                       type: ItemType.base_upgrade, costCurrency: 10,  unlockLevel: 1, statsJson: { defense: 1 },                           rarity: ItemRarity.common }),
    upsertInventoryItem({ themeId: theme.id, slug: 'better-flashlight',     name: 'Better Flashlight',        description: 'See in the dark and spot threats early.',                          type: ItemType.tool,         costCurrency: 8,   unlockLevel: 1, statsJson: { visibility: 1 },                        rarity: ItemRarity.common }),
    upsertInventoryItem({ themeId: theme.id, slug: 'reinforced-door',       name: 'Reinforced Door',          description: 'A heavy steel door that zombies struggle to break.',               type: ItemType.base_upgrade, costCurrency: 20,  unlockLevel: 2, statsJson: { defense: 3 },                           rarity: ItemRarity.rare }),
    upsertInventoryItem({ themeId: theme.id, slug: 'alarm-cans',            name: 'Backyard Alarm Cans',      description: 'String up cans to alert you of intruders.',                        type: ItemType.tool,         costCurrency: 12,  unlockLevel: 2, statsJson: { visibility: 2 },                        rarity: ItemRarity.common }),
    upsertInventoryItem({ themeId: theme.id, slug: 'spiked-bat',            name: 'Bat with Spikes',          description: 'A trusty bat, now with extra bite.',                               type: ItemType.weapon,       costCurrency: 25,  unlockLevel: 3, statsJson: { attack: 5 },                            rarity: ItemRarity.rare }),
    upsertInventoryItem({ themeId: theme.id, slug: 'flashlight-helmet',     name: 'Flashlight Helmet',        description: 'Mounted light keeps your hands free and threats visible.',          type: ItemType.cosmetic,     costCurrency: 15,  unlockLevel: 1, statsJson: { visibility: 2 },                        rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.head }),
    upsertInventoryItem({ themeId: theme.id, slug: 'reinforced-boots',      name: 'Reinforced Boots',         description: 'Steel-toed boots — zombies hate them.',                            type: ItemType.cosmetic,     costCurrency: 18,  unlockLevel: 1, statsJson: { defense: 2 },                           rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.shoes }),
    upsertInventoryItem({ themeId: theme.id, slug: 'spike-bat',             name: 'Spike Bat',                description: 'Nails, meet zombies. Enough said.',                                type: ItemType.cosmetic,     costCurrency: 22,  unlockLevel: 2, statsJson: { attack: 3 },                            rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.handheld }),
    upsertInventoryItem({ themeId: theme.id, slug: 'survivor-jacket',       name: 'Survivor Jacket',          description: 'Thick padding absorbs scratches and bites.',                       type: ItemType.cosmetic,     costCurrency: 25,  unlockLevel: 2, statsJson: { resistance: 3 },                        rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.top }),
    upsertInventoryItem({ themeId: theme.id, slug: 'night-goggles',         name: 'Night Goggles',            description: 'See what goes bump in the night. Reduces threat impact.',          type: ItemType.cosmetic,     costCurrency: 20,  unlockLevel: 2, statsJson: { luck: 2 },                              rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.accessory }),
    upsertInventoryItem({ themeId: theme.id, slug: 'survivor-bandana',      name: 'Survivor Bandana',         description: 'Stylish. Practical. Zombie-proof? Probably not, but it looks cool.', type: ItemType.cosmetic,    costCurrency: 5,   unlockLevel: 1,                                              rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.head }),
    upsertInventoryItem({ themeId: theme.id, slug: 'starter-cap',           name: 'Starter Cap',              description: 'A basic cap for zombie survivors.',                                type: ItemType.cosmetic,     costCurrency: 0,   unlockLevel: 1, statsJson: { defense: 0 },                           rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.head }),
    upsertInventoryItem({ themeId: theme.id, slug: 'baseball-cap',          name: 'Baseball Cap',             description: 'Red cap with NY logo. Rare find.',                                 type: ItemType.cosmetic,     costCurrency: 15,  unlockLevel: 1, statsJson: { defense: 2, speed: 5 },                 rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.head }),
    upsertInventoryItem({ themeId: theme.id, slug: 'tactical-helmet',       name: 'Tactical Helmet',          description: 'Military combat helmet. Serious protection.',                      type: ItemType.cosmetic,     costCurrency: 35,  unlockLevel: 3, statsJson: { defense: 8, stealth: 15 },              rarity: ItemRarity.epic,      cosmeticSlot: CosmeticSlot.head }),
    upsertInventoryItem({ themeId: theme.id, slug: 'survivor-beanie',       name: 'Survivor Beanie',          description: 'Knit beanie. Warm and quiet.',                                     type: ItemType.cosmetic,     costCurrency: 8,   unlockLevel: 1, statsJson: { defense: 1, stealth: 10 },              rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.head }),
    upsertInventoryItem({ themeId: theme.id, slug: 'starter-jacket',        name: 'Starter Jacket',           description: 'Basic olive hoodie. Light protection.',                            type: ItemType.cosmetic,     costCurrency: 0,   unlockLevel: 1, statsJson: { defense: 0 },                           rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.top }),
    upsertInventoryItem({ themeId: theme.id, slug: 'tactical-jacket',       name: 'Tactical Jacket',          description: 'Military jacket with pockets.',                                    type: ItemType.cosmetic,     costCurrency: 20,  unlockLevel: 2, statsJson: { defense: 4, inventory_space: 10 },      rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.top }),
    upsertInventoryItem({ themeId: theme.id, slug: 'hazmat-jacket',         name: 'Hazmat Jacket',            description: 'Sealed protection against the horde.',                             type: ItemType.cosmetic,     costCurrency: 40,  unlockLevel: 3, statsJson: { defense: 10, resistance: 20 },          rarity: ItemRarity.epic,      cosmeticSlot: CosmeticSlot.top }),
    upsertInventoryItem({ themeId: theme.id, slug: 'leather-survivor-jacket', name: 'Leather Survivor Jacket', description: 'Worn leather. Legendary style.',                                  type: ItemType.cosmetic,     costCurrency: 80,  unlockLevel: 5, statsJson: { defense: 15, xp_boost: 10, style: 25 }, rarity: ItemRarity.legendary, cosmeticSlot: CosmeticSlot.top }),
    upsertInventoryItem({ themeId: theme.id, slug: 'starter-sneakers',      name: 'Starter Sneakers',         description: 'Basic canvas sneakers. At least they fit.',                        type: ItemType.cosmetic,     costCurrency: 0,   unlockLevel: 1, statsJson: { speed: 0 },                             rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.shoes }),
    upsertInventoryItem({ themeId: theme.id, slug: 'trail-runners',         name: 'Trail Runners',            description: 'Grip and speed across rough terrain.',                             type: ItemType.cosmetic,     costCurrency: 18,  unlockLevel: 2, statsJson: { speed: 15, resistance: 10 },            rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.shoes }),
    upsertInventoryItem({ themeId: theme.id, slug: 'military-boots',        name: 'Military Boots',           description: 'Combat boots for the apocalypse.',                                 type: ItemType.cosmetic,     costCurrency: 38,  unlockLevel: 3, statsJson: { defense: 5, speed: 5, resistance: 20 }, rarity: ItemRarity.epic,      cosmeticSlot: CosmeticSlot.shoes }),
    upsertInventoryItem({ themeId: theme.id, slug: 'neon-speed-kicks',      name: 'Neon Speed Kicks',         description: 'Legendary footwear. Faster than zombies.',                         type: ItemType.cosmetic,     costCurrency: 90,  unlockLevel: 5, statsJson: { speed: 30, xp_boost: 5, style: 20 },   rarity: ItemRarity.legendary, cosmeticSlot: CosmeticSlot.shoes }),
    upsertInventoryItem({ themeId: theme.id, slug: 'cargo-pants',           name: 'Cargo Pants',              description: 'Pockets everywhere. Very useful.',                                 type: ItemType.cosmetic,     costCurrency: 0,   unlockLevel: 1, statsJson: { inventory_space: 0 },                   rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.bottom }),
    upsertInventoryItem({ themeId: theme.id, slug: 'tactical-pants',        name: 'Tactical Pants',           description: 'Built for battle with extra storage.',                             type: ItemType.cosmetic,     costCurrency: 22,  unlockLevel: 2, statsJson: { inventory_space: 15, defense: 2 },      rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.bottom }),
    upsertInventoryItem({ themeId: theme.id, slug: 'hazmat-trousers',       name: 'Hazmat Trousers',          description: 'Yellow sealed trousers. Match with jacket.',                       type: ItemType.cosmetic,     costCurrency: 42,  unlockLevel: 3, statsJson: { defense: 8, resistance: 15 },           rarity: ItemRarity.epic,      cosmeticSlot: CosmeticSlot.bottom }),
    upsertInventoryItem({ themeId: theme.id, slug: 'survivor-camo-pants',   name: 'Survivor Camo Pants',      description: 'Stay hidden. Stay alive.',                                         type: ItemType.cosmetic,     costCurrency: 85,  unlockLevel: 5, statsJson: { inventory_space: 20, defense: 10, stealth: 15 }, rarity: ItemRarity.legendary, cosmeticSlot: CosmeticSlot.bottom }),
    upsertInventoryItem({ themeId: theme.id, slug: 'basic-backpack',        name: 'Basic Backpack',           description: 'Red backpack. Holds the essentials.',                              type: ItemType.cosmetic,     costCurrency: 0,   unlockLevel: 1, statsJson: { inventory_space: 5 },                   rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.backpack }),
    upsertInventoryItem({ themeId: theme.id, slug: 'tactical-pack',         name: 'Tactical Pack',            description: 'MOLLE-system tactical backpack.',                                  type: ItemType.cosmetic,     costCurrency: 25,  unlockLevel: 2, statsJson: { inventory_space: 20, defense: 3 },      rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.backpack }),
    upsertInventoryItem({ themeId: theme.id, slug: 'survival-duffel',       name: 'Survival Duffel',          description: 'Massive duffel bag. Heavy but worth it.',                          type: ItemType.cosmetic,     costCurrency: 45,  unlockLevel: 3, statsJson: { inventory_space: 35, speed: -5 },       rarity: ItemRarity.epic,      cosmeticSlot: CosmeticSlot.backpack }),
    upsertInventoryItem({ themeId: theme.id, slug: 'dimensional-pack',      name: 'Dimensional Pack',         description: 'Sci-fi pack. Bigger on the inside.',                               type: ItemType.cosmetic,     costCurrency: 100, unlockLevel: 5, statsJson: { inventory_space: 50, xp_boost: 8, style: 30 }, rarity: ItemRarity.legendary, cosmeticSlot: CosmeticSlot.backpack }),
    upsertInventoryItem({ themeId: theme.id, slug: 'starter-belt',          name: 'Starter Belt',             description: 'Simple leather belt. Keeps things together.',                      type: ItemType.cosmetic,     costCurrency: 0,   unlockLevel: 1, statsJson: {},                                       rarity: ItemRarity.common,    cosmeticSlot: CosmeticSlot.accessory }),
    upsertInventoryItem({ themeId: theme.id, slug: 'tactical-belt',         name: 'Tactical Belt',            description: 'Wide belt with pouches and MOLLE loops.',                          type: ItemType.cosmetic,     costCurrency: 20,  unlockLevel: 2, statsJson: { inventory_space: 10, speed: 10 },       rarity: ItemRarity.rare,      cosmeticSlot: CosmeticSlot.accessory }),
    upsertInventoryItem({ themeId: theme.id, slug: 'survivor-rig',          name: 'Survivor Rig',             description: 'Full chest rig. Ready for anything.',                              type: ItemType.cosmetic,     costCurrency: 40,  unlockLevel: 3, statsJson: { inventory_space: 18, defense: 4, speed: 20 }, rarity: ItemRarity.epic,     cosmeticSlot: CosmeticSlot.accessory }),
    upsertInventoryItem({ themeId: theme.id, slug: 'legendary-war-belt',    name: 'Legendary War Belt',       description: 'The belt of a true survivor.',                                     type: ItemType.cosmetic,     costCurrency: 88,  unlockLevel: 5, statsJson: { inventory_space: 25, defense: 8, xp_boost: 5 }, rarity: ItemRarity.legendary, cosmeticSlot: CosmeticSlot.accessory }),
  ])
  console.log(`✓ ${items.length} inventory items upserted`)

  // ── Companions (create only if none exist) ────────────────────────────────
  const companionCount = await prisma.companion.count()
  if (companionCount === 0) {
    await prisma.companion.createMany({
      data: [
        { name: 'Rex',     type: 'dog',     color: '#c87a3a', bonusType: 'detection',  bonusValue: 2, description: "Man's best friend. Barks at zombies within range, slowing them down.", costCurrency: 20, unlockLevel: 1 },
        { name: 'Whiskers', type: 'cat',    color: '#888898', bonusType: 'luck',        bonusValue: 2, description: 'Brings luck and occasionally distracts zombies with pure feline chaos.',  costCurrency: 15, unlockLevel: 1 },
        { name: 'Bun Bun', type: 'rabbit',  color: '#e8d0b0', bonusType: 'speed',       bonusValue: 2, description: 'Tiny speed demon. Boosts your movement and squeaks when danger is near.',  costCurrency: 18, unlockLevel: 1 },
        { name: 'Peanut',  type: 'hamster', color: '#d4a060', bonusType: 'scavenging',  bonusValue: 3, description: 'Packs its cheeks with scrap. Auto-collects nearby materials.',              costCurrency: 22, unlockLevel: 2 },
        { name: 'Polly',   type: 'parrot',  color: '#3db44a', bonusType: 'detection',   bonusValue: 4, description: 'SQUAWK! Warns you 2 seconds before zombies enter the room.',                costCurrency: 40, unlockLevel: 3 },
        { name: 'Drone',   type: 'drone',   color: '#6a8a9a', bonusType: 'visibility',  bonusValue: 3, description: 'Aerial recon drone. Spots threats from above.',                             costCurrency: 35, unlockLevel: 2 },
        { name: 'Bandit',  type: 'raccoon', color: '#7a7a8a', bonusType: 'scavenging',  bonusValue: 1, description: 'Trash panda finds extra scrap in the rubble.',                              costCurrency: 25, unlockLevel: 2 },
      ],
    })
    console.log('✓ 7 companions created')
  } else {
    console.log(`✓ ${companionCount} companions already exist, skipped`)
  }

  // ── Achievements (upsert on slug) ─────────────────────────────────────────
  const achievementData = [
    { slug: 'streak_3',             name: '3-Day Streak',           description: 'Complete chores 3 days in a row.',                               rewardType: 'badge',      rewardValue: '🔥', icon: '🔥', rarity: 'bronze',    xpReward: 50,   scrapsReward: 0,   category: 'streaks',    triggerType: 'streak',             triggerValue: 3 },
    { slug: 'streak_7',             name: '7-Day Streak',           description: 'Complete chores 7 days in a row.',                               rewardType: 'badge',      rewardValue: '🔥', icon: '🔥', rarity: 'silver',    xpReward: 150,  scrapsReward: 5,   category: 'streaks',    triggerType: 'streak',             triggerValue: 7 },
    { slug: 'streak_14',            name: '2-Week Streak',          description: 'Complete chores 14 days in a row.',                              rewardType: 'badge',      rewardValue: '⚡', icon: '⚡', rarity: 'silver',    xpReward: 300,  scrapsReward: 10,  category: 'streaks',    triggerType: 'streak',             triggerValue: 14 },
    { slug: 'streak_30',            name: '30-Day Streak',          description: 'Complete chores 30 days in a row!',                              rewardType: 'badge',      rewardValue: '🌟', icon: '🌟', rarity: 'gold',      xpReward: 750,  scrapsReward: 25,  category: 'streaks',    triggerType: 'streak',             triggerValue: 30 },
    { slug: 'streak_100',           name: '100-Day Streak',         description: 'The ultimate survivor! 100-day streak!',                         rewardType: 'badge',      rewardValue: '💎', icon: '💎', rarity: 'legendary', xpReward: 2500, scrapsReward: 100, category: 'streaks',    triggerType: 'streak',             triggerValue: 100 },
    { slug: 'chores_1',             name: 'First Mission',          description: 'Complete your very first chore.',                                rewardType: 'badge',      rewardValue: '✅', icon: '✅', rarity: 'bronze',    xpReward: 25,   scrapsReward: 0,   category: 'chores',     triggerType: 'chore_approved',     triggerValue: 1 },
    { slug: 'chores_10',            name: 'Getting Started',        description: 'Complete 10 chores total.',                                      rewardType: 'badge',      rewardValue: '📋', icon: '📋', rarity: 'bronze',    xpReward: 100,  scrapsReward: 0,   category: 'chores',     triggerType: 'chore_approved',     triggerValue: 10 },
    { slug: 'chores_50',            name: 'Dependable',             description: 'Complete 50 chores total.',                                      rewardType: 'badge',      rewardValue: '🏅', icon: '🏅', rarity: 'silver',    xpReward: 250,  scrapsReward: 5,   category: 'chores',     triggerType: 'chore_approved',     triggerValue: 50 },
    { slug: 'chores_100',           name: 'Centurion',              description: 'Complete 100 chores total.',                                     rewardType: 'badge',      rewardValue: '💯', icon: '💯', rarity: 'gold',      xpReward: 500,  scrapsReward: 15,  category: 'chores',     triggerType: 'chore_approved',     triggerValue: 100 },
    { slug: 'chores_250',           name: 'Relentless',             description: 'Complete 250 chores total.',                                     rewardType: 'badge',      rewardValue: '⚔️', icon: '⚔️', rarity: 'gold',     xpReward: 1000, scrapsReward: 30,  category: 'chores',     triggerType: 'chore_approved',     triggerValue: 250 },
    { slug: 'chores_500',           name: 'Legendary Doer',         description: 'Complete 500 chores. You are unstoppable!',                      rewardType: 'badge',      rewardValue: '🏆', icon: '🏆', rarity: 'legendary', xpReward: 2000, scrapsReward: 75,  category: 'chores',     triggerType: 'chore_approved',     triggerValue: 500 },
    { slug: 'perfect_1',            name: 'Perfect Week',           description: 'Complete all chores for a full week.',                           rewardType: 'badge',      rewardValue: '🛡️', icon: '🛡️', rarity: 'silver',   xpReward: 200,  scrapsReward: 8,   category: 'chores',     triggerType: 'week_end',           triggerValue: 1 },
    { slug: 'perfect_5',            name: 'Five Star General',      description: 'Achieve 5 perfect weeks.',                                       rewardType: 'badge',      rewardValue: '🌠', icon: '🌠', rarity: 'gold',      xpReward: 800,  scrapsReward: 30,  category: 'chores',     triggerType: 'week_end',           triggerValue: 5 },
    { slug: 'all_today_1',          name: 'All Done Today!',        description: 'Complete all your chores in one day.',                           rewardType: 'badge',      rewardValue: '☑️', icon: '☑️', rarity: 'bronze',    xpReward: 75,   scrapsReward: 2,   category: 'chores',     triggerType: 'chore_approved',     triggerValue: 1 },
    { slug: 'all_today_7',          name: 'Daily Dynamo',           description: 'Complete all chores every day for 7 days.',                      rewardType: 'badge',      rewardValue: '⚡', icon: '⚡', rarity: 'gold',      xpReward: 500,  scrapsReward: 20,  category: 'chores',     triggerType: 'streak',             triggerValue: 7 },
    { slug: 'first_raid',           name: 'First Night',            description: 'Survive your first zombie night.',                               rewardType: 'badge',      rewardValue: '🌙', icon: '🌙', rarity: 'bronze',    xpReward: 50,   scrapsReward: 2,   category: 'raids',      triggerType: 'raid_complete',      triggerValue: 1 },
    { slug: 'no_damage',            name: 'Iron Fortress',          description: 'Defend against an attack with zero damage.',                     rewardType: 'decoration', rewardValue: '🛡️', icon: '🛡️', rarity: 'silver',   xpReward: 300,  scrapsReward: 10,  category: 'raids',      triggerType: 'raid_complete',      triggerValue: 1 },
    { slug: 'kills_10',             name: 'Zombie Watcher',         description: 'Survive 10 zombie nights.',                                      rewardType: 'badge',      rewardValue: '🧟', icon: '🧟', rarity: 'bronze',    xpReward: 100,  scrapsReward: 3,   category: 'raids',      triggerType: 'raid_complete',      triggerValue: 10 },
    { slug: 'kills_50',             name: 'Zombie Slayer',          description: 'Survive 50 zombie nights.',                                      rewardType: 'outfit',     rewardValue: '⚔️', icon: '⚔️', rarity: 'silver',   xpReward: 400,  scrapsReward: 15,  category: 'raids',      triggerType: 'raid_complete',      triggerValue: 50 },
    { slug: 'kills_100',            name: 'Horde Destroyer',        description: 'Survive 100 zombie nights.',                                     rewardType: 'outfit',     rewardValue: '💀', icon: '💀', rarity: 'gold',      xpReward: 1000, scrapsReward: 40,  category: 'raids',      triggerType: 'raid_complete',      triggerValue: 100 },
    { slug: 'first_pay',            name: 'First Paycheck',         description: 'Receive your first allowance payment.',                          rewardType: 'badge',      rewardValue: '💵', icon: '💵', rarity: 'bronze',    xpReward: 75,   scrapsReward: 0,   category: 'allowance',  triggerType: 'allowance_received', triggerValue: 1 },
    { slug: 'earn_10',              name: 'Pocket Money',           description: 'Earn $10 in allowance.',                                         rewardType: 'badge',      rewardValue: '💰', icon: '💰', rarity: 'bronze',    xpReward: 100,  scrapsReward: 0,   category: 'allowance',  triggerType: 'allowance_received', triggerValue: 1000 },
    { slug: 'earn_50',              name: 'Money Maker',            description: 'Earn $50 in total allowance.',                                   rewardType: 'badge',      rewardValue: '🤑', icon: '🤑', rarity: 'silver',    xpReward: 300,  scrapsReward: 0,   category: 'allowance',  triggerType: 'allowance_received', triggerValue: 5000 },
    { slug: 'earn_100',             name: 'High Earner',            description: 'Earn $100 in total allowance!',                                  rewardType: 'badge',      rewardValue: '💎', icon: '💎', rarity: 'gold',      xpReward: 750,  scrapsReward: 0,   category: 'allowance',  triggerType: 'allowance_received', triggerValue: 10000 },
    { slug: 'beat_sibling',         name: 'Sibling Rivalry',        description: 'Win a sibling challenge.',                                       rewardType: 'badge',      rewardValue: '🏆', icon: '🏆', rarity: 'silver',    xpReward: 200,  scrapsReward: 10,  category: 'challenges', triggerType: 'chore_approved',     triggerValue: 1 },
    { slug: 'first-night-survived', name: 'First Night Survived',   description: 'Survive your first night without an overrun.',                   rewardType: 'badge',      rewardValue: '🌙', icon: '🌙', rarity: 'bronze',    xpReward: 50,   scrapsReward: 0,   category: 'raids',      triggerType: 'raid_complete',      triggerValue: 1 },
    { slug: '7-night-streak',       name: '7 Night Survival Streak', description: 'Survive 7 nights in a row without being overrun.',              rewardType: 'badge',      rewardValue: '🔥', icon: '🔥', rarity: 'silver',    xpReward: 150,  scrapsReward: 5,   category: 'raids',      triggerType: 'streak',             triggerValue: 7 },
    { slug: 'perfect-defense',      name: 'Perfect Defense',        description: 'Defend against a zombie attack with zero damage to the base.',   rewardType: 'decoration', rewardValue: '🛡️', icon: '🛡️', rarity: 'silver',   xpReward: 300,  scrapsReward: 10,  category: 'raids',      triggerType: 'raid_complete',      triggerValue: 1 },
    { slug: 'all-chores-completed', name: 'All Chores Completed',   description: 'Complete all your chores every day for 7 days straight.',        rewardType: 'outfit',     rewardValue: '✅', icon: '✅', rarity: 'gold',      xpReward: 500,  scrapsReward: 20,  category: 'chores',     triggerType: 'streak',             triggerValue: 7 },
    { slug: 'zombie-slayer',        name: 'Zombie Slayer (Classic)', description: 'Successfully defend against 30 zombie attacks.',                rewardType: 'outfit',     rewardValue: '⚔️', icon: '⚔️', rarity: 'silver',   xpReward: 400,  scrapsReward: 15,  category: 'raids',      triggerType: 'raid_complete',      triggerValue: 30 },
  ]

  for (const a of achievementData) {
    await prisma.achievement.upsert({
      where:  { slug: a.slug },
      update: { name: a.name, description: a.description, rewardType: a.rewardType, rewardValue: a.rewardValue, icon: a.icon, rarity: a.rarity, xpReward: a.xpReward, scrapsReward: a.scrapsReward, category: a.category, triggerType: a.triggerType, triggerValue: a.triggerValue, secret: (a as { secret?: boolean }).secret ?? false },
      create: { slug: a.slug, name: a.name, description: a.description, rewardType: a.rewardType, rewardValue: a.rewardValue, icon: a.icon, rarity: a.rarity, xpReward: a.xpReward, scrapsReward: a.scrapsReward, category: a.category, triggerType: a.triggerType, triggerValue: a.triggerValue, secret: (a as { secret?: boolean }).secret ?? false },
    })
  }
  console.log(`✓ ${achievementData.length} achievements upserted`)

  // ── Chore Templates (upsert on generated id) ──────────────────────────────
  const choreTemplates = [
    { name: 'Make Bed',                category: 'bedroom',   ageMin: 4,  defaultPoints: 10, scheduleType: 'daily',  tags: ['morning', 'bedroom'] },
    { name: 'Tidy Bedroom',            category: 'bedroom',   ageMin: 4,  defaultPoints: 15, scheduleType: 'daily',  tags: ['bedroom'] },
    { name: 'Change Bed Sheets',       category: 'bedroom',   ageMin: 8,  defaultPoints: 30, scheduleType: 'weekly', durationMins: 15, tags: ['bedroom', 'laundry'] },
    { name: 'Put Away Laundry',        category: 'bedroom',   ageMin: 5,  defaultPoints: 15, scheduleType: 'daily',  tags: ['bedroom', 'laundry'] },
    { name: 'Vacuum Bedroom',          category: 'bedroom',   ageMin: 7,  defaultPoints: 25, scheduleType: 'weekly', durationMins: 10, tags: ['bedroom', 'cleaning'] },
    { name: 'Dust Bedroom Surfaces',   category: 'bedroom',   ageMin: 6,  defaultPoints: 20, scheduleType: 'weekly', durationMins: 10, tags: ['bedroom', 'cleaning'] },
    { name: 'Organize Closet',         category: 'bedroom',   ageMin: 8,  defaultPoints: 35, scheduleType: 'weekly', durationMins: 20, tags: ['bedroom'] },
    { name: 'Under Bed Clean',         category: 'bedroom',   ageMin: 6,  defaultPoints: 20, scheduleType: 'weekly', durationMins: 10, tags: ['bedroom', 'cleaning'] },
    { name: 'Brush Teeth AM',          category: 'hygiene',   ageMin: 4,  defaultPoints: 5,  scheduleType: 'daily',  timeOfDay: 'morning', tags: ['hygiene', 'morning'] },
    { name: 'Brush Teeth PM',          category: 'hygiene',   ageMin: 4,  defaultPoints: 5,  scheduleType: 'daily',  timeOfDay: 'evening', tags: ['hygiene', 'evening'] },
    { name: 'Wash Face',               category: 'hygiene',   ageMin: 5,  defaultPoints: 5,  scheduleType: 'daily',  tags: ['hygiene'] },
    { name: 'Wipe Bathroom Sink',      category: 'household', ageMin: 6,  defaultPoints: 15, scheduleType: 'daily',  durationMins: 5, tags: ['bathroom', 'cleaning'] },
    { name: 'Clean Toilet',            category: 'household', ageMin: 10, defaultPoints: 30, scheduleType: 'weekly', durationMins: 10, requiresPhoto: true, tags: ['bathroom', 'cleaning'] },
    { name: 'Scrub Bathtub/Shower',    category: 'household', ageMin: 10, defaultPoints: 35, scheduleType: 'weekly', durationMins: 15, tags: ['bathroom', 'cleaning'] },
    { name: 'Mop Bathroom Floor',      category: 'household', ageMin: 10, defaultPoints: 25, scheduleType: 'weekly', durationMins: 10, tags: ['bathroom', 'cleaning'] },
    { name: 'Replace Toilet Paper',    category: 'household', ageMin: 5,  defaultPoints: 5,  scheduleType: 'daily',  tags: ['bathroom'] },
    { name: 'Clear Dishes',            category: 'kitchen',   ageMin: 5,  defaultPoints: 10, scheduleType: 'daily',  tags: ['kitchen', 'dishes'] },
    { name: 'Load Dishwasher',         category: 'kitchen',   ageMin: 7,  defaultPoints: 15, scheduleType: 'daily',  tags: ['kitchen', 'dishes'] },
    { name: 'Unload Dishwasher',       category: 'kitchen',   ageMin: 7,  defaultPoints: 15, scheduleType: 'daily',  tags: ['kitchen', 'dishes'] },
    { name: 'Wash Dishes',             category: 'kitchen',   ageMin: 8,  defaultPoints: 20, scheduleType: 'daily',  durationMins: 10, tags: ['kitchen', 'dishes'] },
    { name: 'Wipe Kitchen Counter',    category: 'kitchen',   ageMin: 6,  defaultPoints: 10, scheduleType: 'daily',  tags: ['kitchen', 'cleaning'] },
    { name: 'Sweep Kitchen Floor',     category: 'kitchen',   ageMin: 6,  defaultPoints: 15, scheduleType: 'daily',  durationMins: 10, tags: ['kitchen', 'cleaning'] },
    { name: 'Mop Kitchen Floor',       category: 'kitchen',   ageMin: 10, defaultPoints: 25, scheduleType: 'weekly', durationMins: 15, tags: ['kitchen', 'cleaning'] },
    { name: 'Take Out Trash',          category: 'household', ageMin: 6,  defaultPoints: 10, scheduleType: 'daily',  tags: ['trash', 'kitchen'] },
    { name: 'Wipe Stovetop',           category: 'kitchen',   ageMin: 10, defaultPoints: 20, scheduleType: 'weekly', durationMins: 10, tags: ['kitchen', 'cleaning'] },
    { name: 'Clean Microwave',         category: 'kitchen',   ageMin: 10, defaultPoints: 20, scheduleType: 'weekly', durationMins: 10, tags: ['kitchen', 'cleaning'] },
    { name: 'Feed Pet',                category: 'pet',       ageMin: 4,  defaultPoints: 10, scheduleType: 'daily',  timeOfDay: 'morning', tags: ['pet', 'animal'] },
    { name: 'Water Plants',            category: 'household', ageMin: 4,  defaultPoints: 10, scheduleType: 'daily',  tags: ['plants'] },
    { name: 'Vacuum Living Room',      category: 'household', ageMin: 7,  defaultPoints: 25, scheduleType: 'weekly', durationMins: 15, tags: ['living-room', 'cleaning'] },
    { name: 'Dust Furniture',          category: 'household', ageMin: 6,  defaultPoints: 20, scheduleType: 'weekly', durationMins: 15, tags: ['living-room', 'cleaning'] },
    { name: 'Tidy Living Room',        category: 'household', ageMin: 4,  defaultPoints: 15, scheduleType: 'daily',  tags: ['living-room'] },
    { name: 'Wipe Light Switches',     category: 'household', ageMin: 7,  defaultPoints: 10, scheduleType: 'weekly', durationMins: 5,  tags: ['cleaning'] },
    { name: 'Clean Windows/Mirrors',   category: 'household', ageMin: 8,  defaultPoints: 20, scheduleType: 'weekly', durationMins: 10, tags: ['cleaning'] },
    { name: 'Sort Laundry',            category: 'household', ageMin: 7,  defaultPoints: 10, scheduleType: 'weekly', durationMins: 10, tags: ['laundry'] },
    { name: 'Start Washing Machine',   category: 'household', ageMin: 9,  defaultPoints: 15, scheduleType: 'weekly', tags: ['laundry'] },
    { name: 'Move to Dryer',           category: 'household', ageMin: 9,  defaultPoints: 10, scheduleType: 'weekly', tags: ['laundry'] },
    { name: 'Fold Laundry',            category: 'household', ageMin: 8,  defaultPoints: 20, scheduleType: 'weekly', durationMins: 15, tags: ['laundry'] },
    { name: 'Iron Clothes',            category: 'household', ageMin: 12, defaultPoints: 30, scheduleType: 'weekly', durationMins: 20, tags: ['laundry'] },
    { name: 'Take Out Recycling',      category: 'outside',   ageMin: 6,  defaultPoints: 10, scheduleType: 'weekly', tags: ['outdoor', 'trash'] },
    { name: 'Rake Leaves',             category: 'outside',   ageMin: 7,  defaultPoints: 30, scheduleType: 'weekly', durationMins: 20, tags: ['outdoor', 'yard'] },
    { name: 'Sweep Porch/Driveway',    category: 'outside',   ageMin: 7,  defaultPoints: 20, scheduleType: 'weekly', durationMins: 15, tags: ['outdoor'] },
    { name: 'Water Garden',            category: 'outside',   ageMin: 5,  defaultPoints: 10, scheduleType: 'daily',  timeOfDay: 'morning', tags: ['outdoor', 'plants'] },
    { name: 'Pull Weeds',              category: 'outside',   ageMin: 8,  defaultPoints: 30, scheduleType: 'weekly', durationMins: 20, tags: ['outdoor', 'yard'] },
    { name: 'Clean Up Dog Waste',      category: 'outside',   ageMin: 8,  defaultPoints: 15, scheduleType: 'daily',  tags: ['outdoor', 'pet'] },
    { name: 'Get Dressed',             category: 'hygiene',   ageMin: 4,  defaultPoints: 5,  scheduleType: 'daily',  timeOfDay: 'morning', tags: ['personal', 'morning'] },
    { name: 'Pack School Bag',         category: 'school',    ageMin: 5,  defaultPoints: 10, scheduleType: 'daily',  timeOfDay: 'morning', tags: ['school', 'morning'] },
    { name: 'Do Homework',             category: 'school',    ageMin: 6,  defaultPoints: 30, scheduleType: 'daily',  timeOfDay: 'afternoon', durationMins: 30, tags: ['school', 'homework'] },
    { name: 'Read for 20 Minutes',     category: 'school',    ageMin: 5,  defaultPoints: 20, scheduleType: 'daily',  durationMins: 20, tags: ['school', 'reading'] },
    { name: 'Practice Instrument',     category: 'other',     ageMin: 5,  defaultPoints: 25, scheduleType: 'daily',  durationMins: 20, tags: ['personal', 'music'] },
    { name: 'Prepare Own Lunch',       category: 'kitchen',   ageMin: 9,  defaultPoints: 20, scheduleType: 'daily',  timeOfDay: 'morning', durationMins: 10, tags: ['kitchen', 'personal'] },
  ]

  for (const t of choreTemplates) {
    const id = `global-${t.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    await prisma.choreTemplate.upsert({
      where:  { id },
      update: { ...t, isGlobal: true },
      create: { id, ...t, isGlobal: true, tags: t.tags ?? [], requiresPhoto: (t as { requiresPhoto?: boolean }).requiresPhoto ?? false },
    })
  }
  console.log(`✓ ${choreTemplates.length} chore templates upserted`)

  // ── Seasonal events (create only if none exist) ───────────────────────────
  const eventCount = await prisma.gameEvent.count()
  if (eventCount === 0) {
    await prisma.gameEvent.createMany({
      data: [
        { name: 'Zombie Swarm Night', type: 'zombie_swarm',    difficultyModifier: 3, description: 'A massive zombie horde descends on the area. Threat level soars!',         startDate: new Date('2026-03-10T00:00:00Z'), endDate: new Date('2026-03-12T23:59:59Z'), active: false },
        { name: 'Alien Invasion',     type: 'alien_invasion',  difficultyModifier: 2, description: 'Unidentified craft spotted above the suburbs. Stay alert!',                 startDate: new Date('2026-03-15T00:00:00Z'), endDate: new Date('2026-03-16T23:59:59Z'), active: false },
        { name: 'Winter Storm',       type: 'winter_storm',    difficultyModifier: 1, description: 'A freezing storm blankets the area. Visibility is severely reduced.',        startDate: new Date('2026-03-20T00:00:00Z'), endDate: new Date('2026-03-23T23:59:59Z'), active: false },
        { name: 'Robot Uprising',     type: 'robot_uprising',  difficultyModifier: 2, description: 'Rogue machines have joined the zombie ranks. Things just got worse.',        startDate: new Date('2026-03-25T00:00:00Z'), endDate: new Date('2026-03-26T23:59:59Z'), active: false },
      ],
    })
    console.log('✓ 4 seasonal events created')
  } else {
    console.log(`✓ ${eventCount} seasonal events already exist, skipped`)
  }

  // ── Story chapters (create only if none exist) ────────────────────────────
  const chapterCount = await prisma.storyChapter.count()
  if (chapterCount === 0) {
    await prisma.storyChapter.createMany({
      data: [
        { themeId: theme.id, chapterNumber: 1, title: 'Night One',         description: 'The outbreak begins. The power is out. Secure your home before dark.',        unlockRulesJson: { minLevel: 1, minApprovedChores: 0 },  rewardJson: { scrap: 5 } },
        { themeId: theme.id, chapterNumber: 2, title: 'Board the Windows', description: "They're getting closer. Reinforce your defenses before the next wave.",       unlockRulesJson: { minLevel: 2, minApprovedChores: 10 }, rewardJson: { scrap: 15 } },
        { themeId: theme.id, chapterNumber: 3, title: 'The Backyard Noise', description: "Something's out there. Investigate carefully — and quietly.",                 unlockRulesJson: { minLevel: 3, minApprovedChores: 25 }, rewardJson: { scrap: 30 } },
      ],
    })
    console.log('✓ 3 story chapters created')
  } else {
    console.log(`✓ ${chapterCount} story chapters already exist, skipped`)
  }

  console.log('\n🎉 Seed complete! — Catalog data only. User and household data untouched.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
