-- Populate statsJson for all purchasable gear items.
-- Also inserts adventure-pack if not already present.

UPDATE "InventoryItem" SET "statsJson" = '{"defense":2}'::jsonb               WHERE slug = 'baseball-cap';
UPDATE "InventoryItem" SET "statsJson" = '{"defense":5,"xp_boost":1}'::jsonb  WHERE slug = 'combat-helmet';
UPDATE "InventoryItem" SET "statsJson" = '{"defense":5}'::jsonb               WHERE slug = 'leather-jacket';
UPDATE "InventoryItem" SET "statsJson" = '{"defense":10}'::jsonb              WHERE slug = 'armor-vest';
UPDATE "InventoryItem" SET "statsJson" = '{"xp_boost":5}'::jsonb              WHERE slug = 'utility-belt';
UPDATE "InventoryItem" SET "statsJson" = '{"xp_boost":2}'::jsonb              WHERE slug = 'binoculars';
UPDATE "InventoryItem" SET "statsJson" = '{"inventory_space":5}'::jsonb       WHERE slug = 'starter-backpack';
UPDATE "InventoryItem" SET "statsJson" = '{"inventory_space":10}'::jsonb      WHERE slug = 'large-pack';
UPDATE "InventoryItem" SET "statsJson" = '{"inventory_space":15}'::jsonb      WHERE slug = 'survival-pack';

-- Insert adventure-pack (common between large-pack and survival-pack in level and cost)
DO $$
DECLARE v_theme_id TEXT;
BEGIN
  SELECT id INTO v_theme_id FROM "Theme" WHERE slug = 'zombie-survival' LIMIT 1;
  IF v_theme_id IS NULL THEN SELECT id INTO v_theme_id FROM "Theme" LIMIT 1; END IF;
  IF v_theme_id IS NOT NULL THEN
    INSERT INTO "InventoryItem"
      ("id","themeId","slug","name","description","type","costCurrency","unlockLevel","rarity","cosmeticSlot","statsJson")
    VALUES
      (gen_random_uuid()::text, v_theme_id,
       'adventure-pack', 'Adventure Pack',
       'A rugged pack built for serious exploration.',
       'cosmetic', 40, 3, 'rare', 'backpack', '{"inventory_space":12}'::jsonb)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
