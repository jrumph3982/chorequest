-- AddColumn SurvivalSettings.allowancePointsPerDollar
ALTER TABLE "SurvivalSettings" ADD COLUMN IF NOT EXISTS "allowancePointsPerDollar" INTEGER NOT NULL DEFAULT 100;
