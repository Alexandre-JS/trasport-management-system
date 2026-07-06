-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "incidents_resolvedAt_idx" ON "incidents"("resolvedAt");
