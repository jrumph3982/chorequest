-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "householdId" TEXT,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityAuditLog_householdId_createdAt_idx" ON "SecurityAuditLog"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_eventType_createdAt_idx" ON "SecurityAuditLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_actorUserId_idx" ON "SecurityAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_targetUserId_idx" ON "SecurityAuditLog"("targetUserId");

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
