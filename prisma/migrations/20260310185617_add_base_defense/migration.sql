-- CreateTable
CREATE TABLE "BaseState" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "doorLevel" INTEGER NOT NULL DEFAULT 1,
    "barricadeLevel" INTEGER NOT NULL DEFAULT 1,
    "fenceLevel" INTEGER NOT NULL DEFAULT 1,
    "lightLevel" INTEGER NOT NULL DEFAULT 1,
    "doorDamage" INTEGER NOT NULL DEFAULT 0,
    "barricadeDamage" INTEGER NOT NULL DEFAULT 0,
    "fenceDamage" INTEGER NOT NULL DEFAULT 0,
    "lightDamage" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBaseDamage" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "baseStateId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "doorDamage" INTEGER NOT NULL DEFAULT 0,
    "barricadeDamage" INTEGER NOT NULL DEFAULT 0,
    "fenceDamage" INTEGER NOT NULL DEFAULT 0,
    "lightDamage" INTEGER NOT NULL DEFAULT 0,
    "missedChores" INTEGER NOT NULL DEFAULT 0,
    "zombieThreat" TEXT NOT NULL DEFAULT 'none',
    "repairApplied" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBaseDamage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BaseState_childUserId_key" ON "BaseState"("childUserId");

-- CreateIndex
CREATE INDEX "DailyBaseDamage_childUserId_date_idx" ON "DailyBaseDamage"("childUserId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBaseDamage_childUserId_date_key" ON "DailyBaseDamage"("childUserId", "date");

-- AddForeignKey
ALTER TABLE "BaseState" ADD CONSTRAINT "BaseState_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBaseDamage" ADD CONSTRAINT "DailyBaseDamage_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBaseDamage" ADD CONSTRAINT "DailyBaseDamage_baseStateId_fkey" FOREIGN KEY ("baseStateId") REFERENCES "BaseState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
