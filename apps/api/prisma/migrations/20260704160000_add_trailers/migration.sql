-- CreateEnum
CREATE TYPE "TrailerStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE');

-- CreateTable
CREATE TABLE "trailers" (
    "id" UUID NOT NULL,
    "truckId" UUID,
    "plateNumber" VARCHAR(30) NOT NULL,
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "year" INTEGER,
    "capacityKg" DECIMAL(12,2),
    "status" "TrailerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "trailers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "trips" ADD COLUMN "trailerId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "trailers_plateNumber_key" ON "trailers"("plateNumber");

-- CreateIndex
CREATE INDEX "trailers_truckId_idx" ON "trailers"("truckId");

-- CreateIndex
CREATE INDEX "trailers_plateNumber_idx" ON "trailers"("plateNumber");

-- CreateIndex
CREATE INDEX "trailers_status_idx" ON "trailers"("status");

-- CreateIndex
CREATE INDEX "trailers_createdAt_idx" ON "trailers"("createdAt");

-- CreateIndex
CREATE INDEX "trips_trailerId_idx" ON "trips"("trailerId");

-- AddForeignKey
ALTER TABLE "trailers" ADD CONSTRAINT "trailers_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "trailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
