-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "isResolved" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reports_targetType_targetId_status_idx" ON "reports"("targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "reports_status_isResolved_idx" ON "reports"("status", "isResolved");

-- CreateIndex
CREATE INDEX "reports_reportedBy_targetType_targetId_idx" ON "reports"("reportedBy", "targetType", "targetId");
