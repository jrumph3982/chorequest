-- CreateEnum
CREATE TYPE "Role" AS ENUM ('adult', 'child');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('daily', 'weekly');

-- CreateEnum
CREATE TYPE "ChoreInstanceStatus" AS ENUM ('available', 'submitted_complete', 'approved', 'rejected', 'missed', 'expired');

-- CreateEnum
CREATE TYPE "BonusRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "StoryProgressStatus" AS ENUM ('locked', 'unlocked', 'completed');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('weapon', 'tool', 'cosmetic', 'companion', 'base_upgrade');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatarUrl" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "allowanceBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "gameCurrencyBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "themeId" TEXT,
    "currentStoryChapter" INTEGER NOT NULL DEFAULT 0,
    "weeklyPointGoal" INTEGER NOT NULL DEFAULT 50,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "companionName" TEXT,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "difficultyScore" INTEGER NOT NULL DEFAULT 1,
    "basePoints" INTEGER NOT NULL,
    "cashValueCentsOverride" INTEGER,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreAssignment" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChoreAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreInstance" (
    "id" TEXT NOT NULL,
    "choreAssignmentId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ChoreInstanceStatus" NOT NULL DEFAULT 'available',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "pointsAwarded" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ChoreInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusRequest" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedPoints" INTEGER,
    "status" "BonusRequestStatus" NOT NULL DEFAULT 'pending',
    "approvedPoints" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,

    CONSTRAINT "BonusRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyLedger" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "approvedPointsTotal" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "gameCurrencyAwarded" INTEGER NOT NULL DEFAULT 0,
    "allowanceCentsAwarded" INTEGER NOT NULL DEFAULT 0,
    "approvedByUserId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ItemType" NOT NULL,
    "costCurrency" INTEGER NOT NULL,
    "unlockLevel" INTEGER NOT NULL DEFAULT 1,
    "statsJson" JSONB,
    "imageUrl" TEXT,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventory" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryChapter" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unlockRulesJson" JSONB NOT NULL,
    "rewardJson" JSONB,

    CONSTRAINT "StoryChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStoryProgress" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "storyChapterId" TEXT NOT NULL,
    "status" "StoryProgressStatus" NOT NULL DEFAULT 'locked',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserStoryProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_userId_key" ON "ChildProfile"("userId");

-- CreateIndex
CREATE INDEX "Chore_active_scheduleType_idx" ON "Chore"("active", "scheduleType");

-- CreateIndex
CREATE INDEX "ChoreAssignment_choreId_childUserId_idx" ON "ChoreAssignment"("choreId", "childUserId");

-- CreateIndex
CREATE INDEX "ChoreAssignment_childUserId_active_idx" ON "ChoreAssignment"("childUserId", "active");

-- CreateIndex
CREATE INDEX "ChoreInstance_childUserId_dueDate_idx" ON "ChoreInstance"("childUserId", "dueDate");

-- CreateIndex
CREATE INDEX "ChoreInstance_status_idx" ON "ChoreInstance"("status");

-- CreateIndex
CREATE INDEX "ChoreInstance_childUserId_status_idx" ON "ChoreInstance"("childUserId", "status");

-- CreateIndex
CREATE INDEX "BonusRequest_childUserId_status_idx" ON "BonusRequest"("childUserId", "status");

-- CreateIndex
CREATE INDEX "BonusRequest_status_idx" ON "BonusRequest"("status");

-- CreateIndex
CREATE INDEX "WeeklyLedger_childUserId_weekStart_idx" ON "WeeklyLedger"("childUserId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyLedger_childUserId_weekStart_key" ON "WeeklyLedger"("childUserId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_slug_key" ON "InventoryItem"("slug");

-- CreateIndex
CREATE INDEX "InventoryItem_themeId_type_idx" ON "InventoryItem"("themeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_childUserId_inventoryItemId_key" ON "UserInventory"("childUserId", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryChapter_themeId_chapterNumber_key" ON "StoryChapter"("themeId", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserStoryProgress_childUserId_storyChapterId_key" ON "UserStoryProgress"("childUserId", "storyChapterId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreAssignment" ADD CONSTRAINT "ChoreAssignment_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreAssignment" ADD CONSTRAINT "ChoreAssignment_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_choreAssignmentId_fkey" FOREIGN KEY ("choreAssignmentId") REFERENCES "ChoreAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreInstance" ADD CONSTRAINT "ChoreInstance_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusRequest" ADD CONSTRAINT "BonusRequest_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusRequest" ADD CONSTRAINT "BonusRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyLedger" ADD CONSTRAINT "WeeklyLedger_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyLedger" ADD CONSTRAINT "WeeklyLedger_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryChapter" ADD CONSTRAINT "StoryChapter_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoryProgress" ADD CONSTRAINT "UserStoryProgress_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoryProgress" ADD CONSTRAINT "UserStoryProgress_storyChapterId_fkey" FOREIGN KEY ("storyChapterId") REFERENCES "StoryChapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
