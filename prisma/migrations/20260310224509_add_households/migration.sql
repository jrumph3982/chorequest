-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('owner', 'parent', 'child');

-- AlterTable
ALTER TABLE "BaseState" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "BonusRequest" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "ChildProfile" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "Chore" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "ChoreAssignment" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "ChoreInstance" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "DailyBaseDamage" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "SurvivalSettings" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "UserAchievement" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "UserCompanion" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "UserInventory" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "UserStoryProgress" ADD COLUMN     "householdId" TEXT;

-- AlterTable
ALTER TABLE "WeeklyLedger" ADD COLUMN     "householdId" TEXT;

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "householdCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Household_householdCode_key" ON "Household"("householdCode");

-- CreateIndex
CREATE INDEX "HouseholdMember_householdId_idx" ON "HouseholdMember"("householdId");

-- CreateIndex
CREATE INDEX "HouseholdMember_userId_idx" ON "HouseholdMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");

-- CreateIndex
CREATE INDEX "BaseState_householdId_idx" ON "BaseState"("householdId");

-- CreateIndex
CREATE INDEX "BonusRequest_householdId_idx" ON "BonusRequest"("householdId");

-- CreateIndex
CREATE INDEX "ChildProfile_householdId_idx" ON "ChildProfile"("householdId");

-- CreateIndex
CREATE INDEX "Chore_householdId_idx" ON "Chore"("householdId");

-- CreateIndex
CREATE INDEX "ChoreAssignment_householdId_idx" ON "ChoreAssignment"("householdId");

-- CreateIndex
CREATE INDEX "ChoreInstance_householdId_idx" ON "ChoreInstance"("householdId");

-- CreateIndex
CREATE INDEX "DailyBaseDamage_householdId_idx" ON "DailyBaseDamage"("householdId");

-- CreateIndex
CREATE INDEX "SurvivalSettings_householdId_idx" ON "SurvivalSettings"("householdId");

-- CreateIndex
CREATE INDEX "UserAchievement_householdId_idx" ON "UserAchievement"("householdId");

-- CreateIndex
CREATE INDEX "UserCompanion_householdId_idx" ON "UserCompanion"("householdId");

-- CreateIndex
CREATE INDEX "UserInventory_householdId_idx" ON "UserInventory"("householdId");

-- CreateIndex
CREATE INDEX "UserStoryProgress_householdId_idx" ON "UserStoryProgress"("householdId");

-- CreateIndex
CREATE INDEX "WeeklyLedger_householdId_idx" ON "WeeklyLedger"("householdId");

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreAssignment" ADD CONSTRAINT "ChoreAssignment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusRequest" ADD CONSTRAINT "BonusRequest_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyLedger" ADD CONSTRAINT "WeeklyLedger_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoryProgress" ADD CONSTRAINT "UserStoryProgress_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseState" ADD CONSTRAINT "BaseState_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBaseDamage" ADD CONSTRAINT "DailyBaseDamage_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompanion" ADD CONSTRAINT "UserCompanion_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurvivalSettings" ADD CONSTRAINT "SurvivalSettings_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Backfill: create default household for existing single-family data ───────

INSERT INTO "Household" (id, "displayName", "householdCode", "createdAt", "updatedAt")
VALUES ('default-household-001', 'My Family', 'DEFAULT', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Backfill householdId on all household-owned tables
UPDATE "Chore"             SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "ChoreAssignment"   SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "ChoreInstance"     SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "BonusRequest"      SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "WeeklyLedger"      SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "ChildProfile"      SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "BaseState"         SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "DailyBaseDamage"   SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "UserInventory"     SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "UserCompanion"     SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "UserAchievement"   SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "UserStoryProgress" SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;
UPDATE "SurvivalSettings"  SET "householdId" = 'default-household-001' WHERE "householdId" IS NULL;

-- Backfill HouseholdMember for all existing users (adults → owner, children → child)
INSERT INTO "HouseholdMember" (id, "householdId", "userId", role, "createdAt", "updatedAt")
SELECT
  'hm-' || id,
  'default-household-001',
  id,
  CASE WHEN role::text = 'adult' THEN 'owner'::"HouseholdRole"
       ELSE 'child'::"HouseholdRole" END,
  NOW(),
  NOW()
FROM "User"
ON CONFLICT DO NOTHING;
