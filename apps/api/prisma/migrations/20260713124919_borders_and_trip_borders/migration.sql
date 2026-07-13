/*
  Warnings:

  - You are about to drop the column `border` on the `trips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `trips` DROP COLUMN `border`;

-- CreateTable
CREATE TABLE `borders` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `countryA` VARCHAR(80) NOT NULL,
    `countryB` VARCHAR(80) NOT NULL,
    `lat` DECIMAL(9, 6) NULL,
    `lng` DECIMAL(9, 6) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `borders_name_key`(`name`),
    INDEX `borders_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_borders` (
    `id` CHAR(36) NOT NULL,
    `tripId` CHAR(36) NOT NULL,
    `borderId` CHAR(36) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `arrivedAt` DATETIME(3) NULL,
    `clearedAt` DATETIME(3) NULL,

    INDEX `trip_borders_borderId_idx`(`borderId`),
    UNIQUE INDEX `trip_borders_tripId_sequence_key`(`tripId`, `sequence`),
    UNIQUE INDEX `trip_borders_tripId_borderId_key`(`tripId`, `borderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trip_borders` ADD CONSTRAINT `trip_borders_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_borders` ADD CONSTRAINT `trip_borders_borderId_fkey` FOREIGN KEY (`borderId`) REFERENCES `borders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
