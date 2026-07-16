ALTER TABLE `trips`
  ADD COLUMN `dischargeDate` DATETIME(3) NULL,
  ADD COLUMN `transporterName` VARCHAR(150) NULL,
  ADD COLUMN `isSubcontracted` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `dispatchedBy` VARCHAR(150) NULL,
  ADD COLUMN `remarks` TEXT NULL,
  ADD COLUMN `horsePlate` VARCHAR(30) NULL,
  ADD COLUMN `trailerPlate` VARCHAR(30) NULL,
  ADD COLUMN `driverName` VARCHAR(150) NULL,
  ADD COLUMN `driverPassport` VARCHAR(30) NULL,
  ADD COLUMN `driverLicense` VARCHAR(80) NULL,
  ADD COLUMN `driverPhone` VARCHAR(30) NULL,
  ADD COLUMN `bookingReference` VARCHAR(80) NULL;
