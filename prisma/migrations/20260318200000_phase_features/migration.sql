-- Add new enum values to ScheduleType
ALTER TYPE "ScheduleType" ADD VALUE IF NOT EXISTS 'specific_days';
ALTER TYPE "ScheduleType" ADD VALUE IF NOT EXISTS 'monthly';
ALTER TYPE "ScheduleType" ADD VALUE IF NOT EXISTS 'once';

-- Household additions
ALTER TABLE "Household" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Household" ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER NOT NULL DEFAULT 0;

-- User additions
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Chore additions
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "scheduleDays" INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "timeWindow" TEXT NOT NULL DEFAULT 'any';
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "rolloverEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Chore" ADD COLUMN IF NOT EXISTS "rolloverGraceDays" INTEGER NOT NULL DEFAULT 0;

-- Achievement extensions
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "rarity" TEXT NOT NULL DEFAULT 'bronze';
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "xpReward" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "scrapsReward" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'chores';
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "triggerType" TEXT NOT NULL DEFAULT 'chore_approved';
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "triggerValue" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "secret" BOOLEAN NOT NULL DEFAULT false;

-- UserAchievement extension
ALTER TABLE "UserAchievement" ADD COLUMN IF NOT EXISTS "notified" BOOLEAN NOT NULL DEFAULT false;

-- DailyBaseDamage extensions for raid cinematic
ALTER TABLE "DailyBaseDamage" ADD COLUMN IF NOT EXISTS "raidEventsJson" JSONB;
ALTER TABLE "DailyBaseDamage" ADD COLUMN IF NOT EXISTS "cinematicSeen" BOOLEAN NOT NULL DEFAULT false;

-- ChoreTemplate table
CREATE TABLE IF NOT EXISTS "ChoreTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "ageMin" INTEGER NOT NULL DEFAULT 4,
  "ageMax" INTEGER,
  "defaultPoints" INTEGER NOT NULL DEFAULT 10,
  "durationMins" INTEGER,
  "scheduleType" TEXT NOT NULL DEFAULT 'daily',
  "timeOfDay" TEXT NOT NULL DEFAULT 'any',
  "requiresPhoto" BOOLEAN NOT NULL DEFAULT false,
  "icon" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "isGlobal" BOOLEAN NOT NULL DEFAULT true,
  "householdId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChoreTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChoreTemplate_householdId_idx" ON "ChoreTemplate"("householdId");

-- AllowancePayout table
CREATE TABLE IF NOT EXISTS "AllowancePayout" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "paidAt" TIMESTAMP(3),
  "paidByUserId" TEXT,
  "paymentMethod" TEXT,
  "parentNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AllowancePayout_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AllowancePayout_householdId_idx" ON "AllowancePayout"("householdId");
CREATE INDEX IF NOT EXISTS "AllowancePayout_childId_idx" ON "AllowancePayout"("childId");

-- Challenge table
CREATE TABLE IF NOT EXISTS "Challenge" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "targetMetric" TEXT NOT NULL DEFAULT 'points',
  "targetValue" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT NOT NULL,
  "winnerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Challenge_householdId_idx" ON "Challenge"("householdId");

-- ChallengeParticipant table
CREATE TABLE IF NOT EXISTS "ChallengeParticipant" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChallengeParticipant_challengeId_childId_key" UNIQUE ("challengeId", "childId")
);

-- ChallengeReward table
CREATE TABLE IF NOT EXISTS "ChallengeReward" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "rewardType" TEXT NOT NULL,
  "rewardAmount" INTEGER NOT NULL DEFAULT 0,
  "recipientType" TEXT NOT NULL DEFAULT 'winner',
  CONSTRAINT "ChallengeReward_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (DEFERRABLE to avoid ordering issues)
ALTER TABLE "ChoreTemplate" ADD CONSTRAINT "ChoreTemplate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "AllowancePayout" ADD CONSTRAINT "AllowancePayout_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "AllowancePayout" ADD CONSTRAINT "AllowancePayout_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "AllowancePayout" ADD CONSTRAINT "AllowancePayout_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "ChallengeReward" ADD CONSTRAINT "ChallengeReward_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- Record migration
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid()::text, 'manual-phase-features', NOW(), '20260318200000_phase_features', NULL, NULL, NOW(), 1)
ON CONFLICT DO NOTHING;
