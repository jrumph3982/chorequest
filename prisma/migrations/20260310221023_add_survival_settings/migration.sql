-- CreateTable
CREATE TABLE "SurvivalSettings" (
    "id" TEXT NOT NULL,
    "nightAttacksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "minimumDailyPoints" INTEGER NOT NULL DEFAULT 20,
    "requiredCriticalChores" INTEGER NOT NULL DEFAULT 2,
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "gearBonusesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "companionBonusesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "eventsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurvivalSettings_pkey" PRIMARY KEY ("id")
);
