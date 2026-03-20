-- Add missing SurvivalSettings columns that were previously added via db push
ALTER TABLE "SurvivalSettings" ADD COLUMN IF NOT EXISTS "xpMultiplier"       DOUBLE PRECISION NOT NULL DEFAULT 1.5;
ALTER TABLE "SurvivalSettings" ADD COLUMN IF NOT EXISTS "coinMultiplier"      DOUBLE PRECISION NOT NULL DEFAULT 1.0;
ALTER TABLE "SurvivalSettings" ADD COLUMN IF NOT EXISTS "nightRaidFrequency"  TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE "SurvivalSettings" ADD COLUMN IF NOT EXISTS "rewardDropRate"      TEXT NOT NULL DEFAULT 'normal';

-- Add visualTheme to ChildProfile
ALTER TABLE "ChildProfile" ADD COLUMN IF NOT EXISTS "visualTheme" TEXT NOT NULL DEFAULT 'zombie';

-- Add startingAllowanceBalanceCents to SurvivalSettings
ALTER TABLE "SurvivalSettings" ADD COLUMN IF NOT EXISTS "startingAllowanceBalanceCents" INTEGER NOT NULL DEFAULT 0;

-- Change nightRaidFrequency default to daily (does not affect existing rows)
ALTER TABLE "SurvivalSettings" ALTER COLUMN "nightRaidFrequency" SET DEFAULT 'daily';
