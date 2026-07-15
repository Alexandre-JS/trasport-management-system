-- Tipo de carga + número de container (container obrigatório só quando CONTAINER, validado na app)
ALTER TABLE `cargos`
  ADD COLUMN `type` ENUM('CONTAINER', 'GRANEL') NOT NULL DEFAULT 'GRANEL',
  ADD COLUMN `containerNumber` VARCHAR(40) NULL;

-- Peso passa a toneladas: nova coluna, backfill dividindo kg por 1000, e remoção da antiga
ALTER TABLE `cargos` ADD COLUMN `weightTonnes` DECIMAL(12, 3) NULL;
UPDATE `cargos` SET `weightTonnes` = `weightKg` / 1000 WHERE `weightKg` IS NOT NULL;
ALTER TABLE `cargos` DROP COLUMN `weightKg`;

-- Índice do novo filtro por tipo
CREATE INDEX `cargos_type_idx` ON `cargos`(`type`);
