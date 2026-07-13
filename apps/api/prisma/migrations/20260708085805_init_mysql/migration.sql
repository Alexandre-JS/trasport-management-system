-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    INDEX `roles_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `clientId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_roleId_idx`(`roleId`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_isActive_idx`(`isActive`),
    INDEX `users_clientId_idx`(`clientId`),
    INDEX `users_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` CHAR(36) NOT NULL,
    `companyName` VARCHAR(150) NOT NULL,
    `contactName` VARCHAR(150) NULL,
    `nuit` VARCHAR(30) NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(150) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `province` VARCHAR(100) NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'Moçambique',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `clients_companyName_idx`(`companyName`),
    INDEX `clients_email_idx`(`email`),
    INDEX `clients_isActive_idx`(`isActive`),
    INDEX `clients_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `fullName` VARCHAR(150) NOT NULL,
    `licenseNumber` VARCHAR(80) NOT NULL,
    `passportNumber` VARCHAR(30) NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(150) NULL,
    `status` ENUM('AVAILABLE', 'ON_TRIP', 'OFFLINE', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `drivers_userId_key`(`userId`),
    UNIQUE INDEX `drivers_licenseNumber_key`(`licenseNumber`),
    INDEX `drivers_licenseNumber_idx`(`licenseNumber`),
    INDEX `drivers_status_idx`(`status`),
    INDEX `drivers_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trucks` (
    `id` CHAR(36) NOT NULL,
    `plateNumber` VARCHAR(30) NOT NULL,
    `brand` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `year` INTEGER NULL,
    `status` ENUM('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `trucks_plateNumber_key`(`plateNumber`),
    INDEX `trucks_plateNumber_idx`(`plateNumber`),
    INDEX `trucks_status_idx`(`status`),
    INDEX `trucks_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trailers` (
    `id` CHAR(36) NOT NULL,
    `truckId` CHAR(36) NULL,
    `plateNumber` VARCHAR(30) NOT NULL,
    `brand` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `year` INTEGER NULL,
    `tonnage` DECIMAL(12, 3) NULL,
    `status` ENUM('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `trailers_plateNumber_key`(`plateNumber`),
    INDEX `trailers_truckId_idx`(`truckId`),
    INDEX `trailers_plateNumber_idx`(`plateNumber`),
    INDEX `trailers_status_idx`(`status`),
    INDEX `trailers_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cargos` (
    `id` CHAR(36) NOT NULL,
    `clientId` CHAR(36) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,
    `weightKg` DECIMAL(12, 2) NULL,
    `volumeM3` DECIMAL(12, 3) NULL,
    `origin` VARCHAR(150) NOT NULL,
    `destination` VARCHAR(150) NOT NULL,
    `pickupDate` DATETIME(3) NULL,
    `expectedDelivery` DATETIME(3) NULL,
    `status` ENUM('CREATED', 'WAITING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED', 'CANCELLED', 'INCIDENT') NOT NULL DEFAULT 'CREATED',
    `observations` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `cargos_code_key`(`code`),
    INDEX `cargos_clientId_idx`(`clientId`),
    INDEX `cargos_code_idx`(`code`),
    INDEX `cargos_status_idx`(`status`),
    INDEX `cargos_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trips` (
    `id` CHAR(36) NOT NULL,
    `cargoId` CHAR(36) NOT NULL,
    `truckId` CHAR(36) NOT NULL,
    `trailerId` CHAR(36) NULL,
    `driverId` CHAR(36) NOT NULL,
    `departureDate` DATETIME(3) NULL,
    `arrivalEstimate` DATETIME(3) NULL,
    `arrivalDate` DATETIME(3) NULL,
    `loadedDate` DATETIME(3) NULL,
    `currentStatus` ENUM('WAITING_APPOINTMENT', 'APPOINTMENT_DONE', 'LOADED', 'DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED', 'DISCHARGED', 'CANCELLED') NOT NULL DEFAULT 'WAITING_APPOINTMENT',
    `currentPosition` VARCHAR(150) NULL,
    `border` ENUM('CHIRUNDU', 'CHANIDA') NULL,
    `tonnage` DECIMAL(12, 3) NULL,
    `trackingToken` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `trips_trackingToken_key`(`trackingToken`),
    INDEX `trips_cargoId_idx`(`cargoId`),
    INDEX `trips_truckId_idx`(`truckId`),
    INDEX `trips_trailerId_idx`(`trailerId`),
    INDEX `trips_driverId_idx`(`driverId`),
    INDEX `trips_currentStatus_idx`(`currentStatus`),
    INDEX `trips_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_events` (
    `id` CHAR(36) NOT NULL,
    `tripId` CHAR(36) NOT NULL,
    `type` ENUM('DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED', 'DISCHARGED', 'STATUS_CHANGE') NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `fromStatus` ENUM('WAITING_APPOINTMENT', 'APPOINTMENT_DONE', 'LOADED', 'DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED', 'DISCHARGED', 'CANCELLED') NULL,
    `toStatus` ENUM('WAITING_APPOINTMENT', 'APPOINTMENT_DONE', 'LOADED', 'DISPATCHED_ORIGIN', 'AT_BORDER', 'BORDER_CLEARED', 'ARRIVED', 'DISCHARGED', 'CANCELLED') NULL,
    `note` VARCHAR(191) NULL,
    `createdBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trip_events_tripId_occurredAt_idx`(`tripId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracking_points` (
    `id` CHAR(36) NOT NULL,
    `tripId` CHAR(36) NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `speed` DECIMAL(8, 2) NULL,
    `heading` DECIMAL(6, 2) NULL,
    `accuracy` DECIMAL(8, 2) NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tracking_points_tripId_idx`(`tripId`),
    INDEX `tracking_points_recordedAt_idx`(`recordedAt`),
    INDEX `tracking_points_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliveries` (
    `id` CHAR(36) NOT NULL,
    `tripId` CHAR(36) NOT NULL,
    `receiverName` VARCHAR(150) NULL,
    `receiverDocument` VARCHAR(80) NULL,
    `deliveryPhoto` MEDIUMTEXT NULL,
    `signature` MEDIUMTEXT NULL,
    `deliveredAt` DATETIME(3) NULL,
    `observations` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `deliveries_tripId_idx`(`tripId`),
    INDEX `deliveries_deliveredAt_idx`(`deliveredAt`),
    INDEX `deliveries_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidents` (
    `id` CHAR(36) NOT NULL,
    `tripId` CHAR(36) NOT NULL,
    `type` ENUM('ACCIDENT', 'BREAKDOWN', 'TRAFFIC', 'ROAD_BLOCKED', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `photo` MEDIUMTEXT NULL,
    `reportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `incidents_tripId_idx`(`tripId`),
    INDEX `incidents_type_idx`(`type`),
    INDEX `incidents_reportedAt_idx`(`reportedAt`),
    INDEX `incidents_resolvedAt_idx`(`resolvedAt`),
    INDEX `incidents_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'SUCCESS', 'ERROR') NOT NULL DEFAULT 'INFO',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trailers` ADD CONSTRAINT `trailers_truckId_fkey` FOREIGN KEY (`truckId`) REFERENCES `trucks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargos` ADD CONSTRAINT `cargos_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_cargoId_fkey` FOREIGN KEY (`cargoId`) REFERENCES `cargos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_truckId_fkey` FOREIGN KEY (`truckId`) REFERENCES `trucks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_trailerId_fkey` FOREIGN KEY (`trailerId`) REFERENCES `trailers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_events` ADD CONSTRAINT `trip_events_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tracking_points` ADD CONSTRAINT `tracking_points_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
