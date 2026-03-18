-- CreateEnum
CREATE TYPE "ItemRarity" AS ENUM ('common', 'rare', 'epic', 'legendary');

-- CreateEnum
CREATE TYPE "CosmeticSlot" AS ENUM ('head', 'top', 'bottom', 'shoes', 'accessory', 'backpack', 'handheld');

-- AlterTable
ALTER TABLE "BaseState" ADD COLUMN     "turretDamage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "turretLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "watchtowerDamage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "watchtowerLevel" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "eyeColor" TEXT,
ADD COLUMN     "hairColor" TEXT,
ADD COLUMN     "hairStyle" TEXT,
ADD COLUMN     "skinTone" TEXT;

-- AlterTable
ALTER TABLE "DailyBaseDamage" ADD COLUMN     "turretDamage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "watchtowerDamage" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "cosmeticSlot" "CosmeticSlot",
ADD COLUMN     "rarity" "ItemRarity" NOT NULL DEFAULT 'common';
