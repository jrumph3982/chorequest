-- AddColumns: xpConversionRate and weeklyAllowanceCap on SurvivalSettings
ALTER TABLE "SurvivalSettings"
    ADD COLUMN "xpConversionRate"   INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN "weeklyAllowanceCap" INTEGER;

-- CreateTable: AllowanceRecord
CREATE TABLE "AllowanceRecord" (
    "id"          TEXT    NOT NULL,
    "childUserId" TEXT    NOT NULL,
    "householdId" TEXT,
    "xpEarned"    INTEGER NOT NULL DEFAULT 0,
    "moneyEarned" INTEGER NOT NULL DEFAULT 0,
    "weekStart"   TIMESTAMP(3) NOT NULL,
    "weekEnd"     TIMESTAMP(3) NOT NULL,
    "paid"        BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AllowanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowanceRecord_childUserId_weekStart_key"
    ON "AllowanceRecord"("childUserId", "weekStart");

CREATE INDEX "AllowanceRecord_childUserId_idx" ON "AllowanceRecord"("childUserId");
CREATE INDEX "AllowanceRecord_householdId_idx" ON "AllowanceRecord"("householdId");

-- AddForeignKey
ALTER TABLE "AllowanceRecord"
    ADD CONSTRAINT "AllowanceRecord_childUserId_fkey"
    FOREIGN KEY ("childUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AllowanceRecord"
    ADD CONSTRAINT "AllowanceRecord_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
