-- Token público de partilha por cliente: 1 link fixo que mostra todas as
-- cargas do cliente. Adiciona a coluna, faz backfill com UUID() para as
-- linhas existentes, torna NOT NULL e cria o índice único.
ALTER TABLE `clients` ADD COLUMN `publicShareToken` CHAR(36) NULL;

UPDATE `clients` SET `publicShareToken` = (UUID()) WHERE `publicShareToken` IS NULL;

ALTER TABLE `clients` MODIFY `publicShareToken` CHAR(36) NOT NULL;

CREATE UNIQUE INDEX `clients_publicShareToken_key` ON `clients`(`publicShareToken`);
