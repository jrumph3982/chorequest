-- Add universal starter gear and purchasable cosmetic shop items.
-- Uses a DO block to look up the theme ID dynamically so no hardcoded IDs are needed.
-- ON CONFLICT (slug) DO NOTHING makes the migration safe to re-run.

DO $$
DECLARE
  v_theme_id TEXT;
BEGIN
  -- Prefer the zombie-survival theme; fall back to any theme.
  SELECT id INTO v_theme_id FROM "Theme" WHERE slug = 'zombie-survival' LIMIT 1;
  IF v_theme_id IS NULL THEN
    SELECT id INTO v_theme_id FROM "Theme" LIMIT 1;
  END IF;

  IF v_theme_id IS NOT NULL THEN
    INSERT INTO "InventoryItem"
      ("id", "themeId", "slug", "name", "description", "type",
       "costCurrency", "unlockLevel", "rarity", "cosmeticSlot")
    VALUES
      -- ── Universal Starter Gear (FREE, level 1) ────────────────────────────
      (gen_random_uuid()::text, v_theme_id,
       'starter-cap',     'Starter Cap',
       'Basic head protection for new survivors.',
       'cosmetic', 0, 1, 'common', 'head'),

      (gen_random_uuid()::text, v_theme_id,
       'starter-jacket',  'Starter Jacket',
       'A worn jacket — still better than nothing.',
       'cosmetic', 0, 1, 'common', 'top'),

      (gen_random_uuid()::text, v_theme_id,
       'starter-pants',   'Starter Pants',
       'Durable cargo pants for the apocalypse.',
       'cosmetic', 0, 1, 'common', 'bottom'),

      (gen_random_uuid()::text, v_theme_id,
       'starter-sneakers', 'Starter Sneakers',
       'Gotta run fast.',
       'cosmetic', 0, 1, 'common', 'shoes'),

      (gen_random_uuid()::text, v_theme_id,
       'starter-backpack', 'Starter Backpack',
       'Basic pack for carrying survival gear.',
       'cosmetic', 0, 1, 'common', 'backpack'),

      (gen_random_uuid()::text, v_theme_id,
       'starter-trinket',  'Starter Trinket',
       'A lucky charm — might keep zombies away.',
       'cosmetic', 0, 1, 'common', 'accessory'),

      -- ── Purchasable Gear ─────────────────────────────────────────────────

      -- Head
      (gen_random_uuid()::text, v_theme_id,
       'baseball-cap',   'Baseball Cap',
       'Classic cap, worn backwards for extra style.',
       'cosmetic', 15, 1, 'common', 'head'),

      (gen_random_uuid()::text, v_theme_id,
       'combat-helmet',  'Combat Helmet',
       'Military-grade protection against bites.',
       'cosmetic', 35, 3, 'rare', 'head'),

      -- Body
      (gen_random_uuid()::text, v_theme_id,
       'leather-jacket', 'Leather Jacket',
       'Tough hide deflects zombie claws.',
       'cosmetic', 30, 2, 'common', 'top'),

      (gen_random_uuid()::text, v_theme_id,
       'armor-vest',     'Armor Vest',
       'Heavy plate vest with serious stopping power.',
       'cosmetic', 60, 4, 'rare', 'top'),

      -- Accessory
      (gen_random_uuid()::text, v_theme_id,
       'utility-belt',   'Utility Belt',
       'Extra pouches for tools and scavenged ammo.',
       'cosmetic', 20, 1, 'common', 'accessory'),

      (gen_random_uuid()::text, v_theme_id,
       'binoculars',     'Binoculars',
       'Spot threats before they spot you.',
       'cosmetic', 45, 3, 'rare', 'accessory'),

      -- Backpack
      (gen_random_uuid()::text, v_theme_id,
       'large-pack',     'Large Pack',
       'High-capacity pack for long expeditions.',
       'cosmetic', 25, 2, 'common', 'backpack'),

      (gen_random_uuid()::text, v_theme_id,
       'survival-pack',  'Survival Pack',
       'The ultimate survivor loadout — holds everything.',
       'cosmetic', 55, 4, 'epic', 'backpack')

    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
