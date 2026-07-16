-- Novo tipo de carga: GERAL (carga geral / diversificada). Só acrescenta o
-- valor ao ENUM — sem perda de dados.
ALTER TABLE `cargos`
  MODIFY `type` ENUM('CONTAINER', 'GRANEL', 'GERAL') NOT NULL DEFAULT 'GRANEL';
