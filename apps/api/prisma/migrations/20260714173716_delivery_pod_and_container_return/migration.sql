-- Fase 2: documento POD na entrega
ALTER TABLE `deliveries` ADD COLUMN `podDocument` MEDIUMTEXT NULL;

-- Fase 3: novos estados de devolução de container no ciclo da viagem
ALTER TABLE `trips`
  MODIFY `currentStatus` ENUM(
    'WAITING_APPOINTMENT','APPOINTMENT_DONE','LOADED','DISPATCHED_ORIGIN',
    'AT_BORDER','BORDER_CLEARED','ARRIVED','DISCHARGED',
    'CONTAINER_RETURN_PENDING','CONTAINER_RETURNED','CANCELLED'
  ) NOT NULL DEFAULT 'WAITING_APPOINTMENT';

-- Fase 3: registo dedicado da devolução do container (com o seu POD)
CREATE TABLE `container_returns` (
  `id` CHAR(36) NOT NULL,
  `tripId` CHAR(36) NOT NULL,
  `returnedTo` VARCHAR(150) NULL,
  `receiverName` VARCHAR(150) NULL,
  `podDocument` MEDIUMTEXT NULL,
  `returnedAt` DATETIME(3) NULL,
  `observations` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `container_returns_tripId_key`(`tripId`),
  INDEX `container_returns_returnedAt_idx`(`returnedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `container_returns`
  ADD CONSTRAINT `container_returns_tripId_fkey`
  FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- trip_events.fromStatus/toStatus também são ENUM(TripStatus) e precisam dos novos valores
ALTER TABLE `trip_events`
  MODIFY `fromStatus` ENUM(
    'WAITING_APPOINTMENT','APPOINTMENT_DONE','LOADED','DISPATCHED_ORIGIN',
    'AT_BORDER','BORDER_CLEARED','ARRIVED','DISCHARGED',
    'CONTAINER_RETURN_PENDING','CONTAINER_RETURNED','CANCELLED'
  ) NULL,
  MODIFY `toStatus` ENUM(
    'WAITING_APPOINTMENT','APPOINTMENT_DONE','LOADED','DISPATCHED_ORIGIN',
    'AT_BORDER','BORDER_CLEARED','ARRIVED','DISCHARGED',
    'CONTAINER_RETURN_PENDING','CONTAINER_RETURNED','CANCELLED'
  ) NULL;
