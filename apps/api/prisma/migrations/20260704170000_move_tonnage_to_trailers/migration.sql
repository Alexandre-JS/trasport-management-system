-- Trailer carries the nominal tonnage. Truck/cavalo no longer carries capacity.
ALTER TABLE "trailers" ADD COLUMN "tonnage" DECIMAL(12,3);

UPDATE "trailers"
SET "tonnage" = ROUND(("capacityKg" / 1000.0)::numeric, 3)
WHERE "capacityKg" IS NOT NULL;

ALTER TABLE "trailers" DROP COLUMN "capacityKg";
ALTER TABLE "trucks" DROP COLUMN "capacityKg";
