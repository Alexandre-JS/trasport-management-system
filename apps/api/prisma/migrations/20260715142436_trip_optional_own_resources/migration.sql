-- Viagens subcontratadas: o Horse e o motorista podem não ser recursos
-- próprios (registados). Passam a opcionais; os dados vivem nos campos
-- snapshot (horsePlate, driverName, etc.). O trailer já era opcional.
ALTER TABLE `trips` MODIFY `truckId` CHAR(36) NULL;
ALTER TABLE `trips` MODIFY `driverId` CHAR(36) NULL;
