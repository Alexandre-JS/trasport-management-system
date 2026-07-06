-- AlterTable: public, unguessable tracking token per trip (backfill existing rows)
ALTER TABLE "trips" ADD COLUMN "trackingToken" UUID;
UPDATE "trips" SET "trackingToken" = gen_random_uuid() WHERE "trackingToken" IS NULL;
ALTER TABLE "trips" ALTER COLUMN "trackingToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "trips_trackingToken_key" ON "trips"("trackingToken");
