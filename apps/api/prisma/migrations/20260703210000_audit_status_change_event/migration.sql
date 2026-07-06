-- AlterEnum: add a generic administrative transition type. Existing TripEvent
-- rows keep their geographic milestone types (additive change, data-preserving).
ALTER TYPE "TripEventType" ADD VALUE 'STATUS_CHANGE';
