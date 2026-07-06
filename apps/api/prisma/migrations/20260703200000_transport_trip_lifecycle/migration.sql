-- CreateEnum
CREATE TYPE "Border" AS ENUM ('CHIRUNDU', 'CHANIDA');

-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED', 'DISCHARGED');

-- AlterEnum: rebuild TripStatus into the unified lifecycle, mapping legacy values (data-preserving)
ALTER TYPE "TripStatus" RENAME TO "TripStatus_old";

CREATE TYPE "TripStatus" AS ENUM (
    'WAITING_APPOINTMENT',
    'APPOINTMENT_DONE',
    'LOADED',
    'DISPATCHED_ORIGIN',
    'AT_BORDER',
    'BORDER_CLEARED',
    'ARRIVED',
    'DISCHARGED',
    'CANCELLED'
);

ALTER TABLE "trips" ALTER COLUMN "currentStatus" DROP DEFAULT;

ALTER TABLE "trips"
    ALTER COLUMN "currentStatus" TYPE "TripStatus"
    USING (
        CASE "currentStatus"::text
            WHEN 'SCHEDULED'   THEN 'WAITING_APPOINTMENT'
            WHEN 'STARTED'     THEN 'APPOINTMENT_DONE'
            WHEN 'IN_PROGRESS' THEN 'DISPATCHED_ORIGIN'
            WHEN 'FINISHED'    THEN 'DISCHARGED'
            WHEN 'CANCELLED'   THEN 'CANCELLED'
        END
    )::"TripStatus";

ALTER TABLE "trips" ALTER COLUMN "currentStatus" SET DEFAULT 'WAITING_APPOINTMENT';

DROP TYPE "TripStatus_old";

-- AlterTable: Driver identity (cross-border)
ALTER TABLE "drivers" ADD COLUMN "passportNumber" VARCHAR(30);

-- AlterTable: Trip operational fields
ALTER TABLE "trips" ADD COLUMN "loadedDate" TIMESTAMP(3);
ALTER TABLE "trips" ADD COLUMN "currentPosition" VARCHAR(150);
ALTER TABLE "trips" ADD COLUMN "border" "Border";
ALTER TABLE "trips" ADD COLUMN "tonnage" DECIMAL(12,3);

-- CreateTable: auditable milestone events
CREATE TABLE "trip_events" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "type" "TripEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "fromStatus" "TripStatus",
    "toStatus" "TripStatus",
    "note" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_events_tripId_occurredAt_idx" ON "trip_events"("tripId", "occurredAt");

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
