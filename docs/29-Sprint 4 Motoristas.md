# 29 - Sprint 4 Motoristas

## Objetivo

Implementar a gestão de motoristas com CRUD, disponibilidade, estado, pesquisa, paginação, histórico, Swagger e testes.

## Módulo implementado

* Drivers

## Endpoints

* `GET /api/v1/drivers`
* `GET /api/v1/drivers/:id`
* `GET /api/v1/drivers/:id/history`
* `POST /api/v1/drivers`
* `PATCH /api/v1/drivers/:id`
* `PATCH /api/v1/drivers/:id/status`
* `PATCH /api/v1/drivers/:id/available`
* `PATCH /api/v1/drivers/:id/offline`
* `PATCH /api/v1/drivers/:id/deactivate`
* `DELETE /api/v1/drivers/:id`
* `GET /api/v1/drivers/health`

## DTOs

* CreateDriverDto
* UpdateDriverDto
* ListDriversQueryDto
* UpdateDriverStatusDto
* DriverResponseDto
* DriverHistoryResponseDto

## Funcionalidades

* CRUD completo com soft delete.
* Pesquisa por nome, carta, email e telefone.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Filtro por estado.
* Ordenação por `createdAt`, `fullName`, `licenseNumber`, `email` e `status`.
* Gestão de disponibilidade com estados `AVAILABLE`, `ON_TRIP`, `OFFLINE` e `INACTIVE`.
* Histórico operacional por viagens e cargas atribuídas.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## Regras de negócio

* Número da carta deve ser único.
* Um utilizador só pode estar ligado a um motorista.
* Motorista removido recebe `deletedAt` e estado `INACTIVE`.
* Listagens ignoram motoristas removidos.

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `drivers:manage`. O endpoint `health` permanece público.

## Próximos passos

No Sprint 5, implementar o módulo Camiões com CRUD, capacidade, estado, disponibilidade, pesquisa, paginação, Swagger e testes.
