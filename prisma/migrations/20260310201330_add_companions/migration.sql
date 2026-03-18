-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bonusType" TEXT NOT NULL,
    "bonusValue" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "costCurrency" INTEGER NOT NULL DEFAULT 20,
    "unlockLevel" INTEGER NOT NULL DEFAULT 1,
    "assetPath" TEXT,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompanion" (
    "id" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL DEFAULT 1,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCompanion_childUserId_idx" ON "UserCompanion"("childUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompanion_childUserId_companionId_key" ON "UserCompanion"("childUserId", "companionId");

-- AddForeignKey
ALTER TABLE "UserCompanion" ADD CONSTRAINT "UserCompanion_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompanion" ADD CONSTRAINT "UserCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
