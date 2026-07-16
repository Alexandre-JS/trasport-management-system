-- Registos antigos do quadro guardavam Horse, trailer e motorista apenas como
-- snapshots na viagem. Materializá-los nos cadastros para que todas as páginas
-- consultem a mesma fonte operacional, preservando a conta de login opcional.

INSERT INTO `drivers` (`id`, `userId`, `fullName`, `licenseNumber`, `passportNumber`, `phone`, `email`, `status`, `createdAt`, `updatedAt`, `deletedAt`)
SELECT UUID(), NULL, source.driverName, source.driverLicense, source.driverPassport, source.driverPhone, NULL, 'AVAILABLE', NOW(3), NOW(3), NULL
FROM (
  SELECT
    `driverLicense`,
    MAX(`driverName`) AS `driverName`,
    MAX(`driverPassport`) AS `driverPassport`,
    MAX(`driverPhone`) AS `driverPhone`
  FROM `trips`
  WHERE `deletedAt` IS NULL
    AND `driverLicense` IS NOT NULL
    AND TRIM(`driverLicense`) <> ''
  GROUP BY `driverLicense`
) source
LEFT JOIN `drivers` existing ON UPPER(REPLACE(existing.`licenseNumber`, ' ', '')) = UPPER(REPLACE(source.`driverLicense`, ' ', ''))
WHERE existing.`id` IS NULL;

UPDATE `trips` trip
JOIN `drivers` driver ON UPPER(REPLACE(driver.`licenseNumber`, ' ', '')) = UPPER(REPLACE(trip.`driverLicense`, ' ', ''))
SET trip.`driverId` = driver.`id`
WHERE trip.`driverId` IS NULL AND trip.`deletedAt` IS NULL;

INSERT INTO `trucks` (`id`, `plateNumber`, `brand`, `model`, `year`, `status`, `createdAt`, `updatedAt`, `deletedAt`)
SELECT UUID(), source.horsePlate, NULL, NULL, NULL, 'AVAILABLE', NOW(3), NOW(3), NULL
FROM (
  SELECT MAX(`horsePlate`) AS `horsePlate`
  FROM `trips`
  WHERE `deletedAt` IS NULL AND `horsePlate` IS NOT NULL AND TRIM(`horsePlate`) <> ''
  GROUP BY UPPER(REPLACE(`horsePlate`, ' ', ''))
) source
LEFT JOIN `trucks` existing ON UPPER(REPLACE(existing.`plateNumber`, ' ', '')) = UPPER(REPLACE(source.`horsePlate`, ' ', ''))
WHERE existing.`id` IS NULL;

UPDATE `trips` trip
JOIN `trucks` truck ON UPPER(REPLACE(truck.`plateNumber`, ' ', '')) = UPPER(REPLACE(trip.`horsePlate`, ' ', ''))
SET trip.`truckId` = truck.`id`
WHERE trip.`truckId` IS NULL AND trip.`deletedAt` IS NULL;

INSERT INTO `trailers` (`id`, `truckId`, `plateNumber`, `brand`, `model`, `year`, `tonnage`, `status`, `createdAt`, `updatedAt`, `deletedAt`)
SELECT UUID(), NULL, source.trailerPlate, NULL, NULL, NULL, NULL, 'AVAILABLE', NOW(3), NOW(3), NULL
FROM (
  SELECT MAX(`trailerPlate`) AS `trailerPlate`
  FROM `trips`
  WHERE `deletedAt` IS NULL AND `trailerPlate` IS NOT NULL AND TRIM(`trailerPlate`) <> ''
  GROUP BY UPPER(REPLACE(`trailerPlate`, ' ', ''))
) source
LEFT JOIN `trailers` existing ON UPPER(REPLACE(existing.`plateNumber`, ' ', '')) = UPPER(REPLACE(source.`trailerPlate`, ' ', ''))
WHERE existing.`id` IS NULL;

UPDATE `trips` trip
JOIN `trailers` trailer ON UPPER(REPLACE(trailer.`plateNumber`, ' ', '')) = UPPER(REPLACE(trip.`trailerPlate`, ' ', ''))
SET trip.`trailerId` = trailer.`id`
WHERE trip.`trailerId` IS NULL AND trip.`deletedAt` IS NULL;

UPDATE `drivers` driver
JOIN `trips` trip ON trip.`driverId` = driver.`id`
SET driver.`status` = 'ON_TRIP'
WHERE trip.`deletedAt` IS NULL
  AND trip.`currentStatus` IN ('WAITING_APPOINTMENT', 'APPOINTMENT_DONE', 'LOADED', 'DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED');

UPDATE `trucks` truck
JOIN `trips` trip ON trip.`truckId` = truck.`id`
SET truck.`status` = 'ON_TRIP'
WHERE trip.`deletedAt` IS NULL
  AND trip.`currentStatus` IN ('WAITING_APPOINTMENT', 'APPOINTMENT_DONE', 'LOADED', 'DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED');

UPDATE `trailers` trailer
JOIN `trips` trip ON trip.`trailerId` = trailer.`id`
SET trailer.`status` = 'ON_TRIP'
WHERE trip.`deletedAt` IS NULL
  AND trip.`currentStatus` IN ('WAITING_APPOINTMENT', 'APPOINTMENT_DONE', 'LOADED', 'DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED');
