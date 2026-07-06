# 30 - Sprint 5 Camiões

## Objetivo

Implementar a gestão de camiões com CRUD, capacidade, estado, disponibilidade, pesquisa, paginação, Swagger e testes.

## Módulo implementado

* Trucks

## Endpoints

* `GET /api/v1/trucks`
* `GET /api/v1/trucks/:id`
* `POST /api/v1/trucks`
* `PATCH /api/v1/trucks/:id`
* `PATCH /api/v1/trucks/:id/status`
* `PATCH /api/v1/trucks/:id/available`
* `PATCH /api/v1/trucks/:id/maintenance`
* `PATCH /api/v1/trucks/:id/deactivate`
* `DELETE /api/v1/trucks/:id`
* `GET /api/v1/trucks/health`

## DTOs

* CreateTruckDto
* UpdateTruckDto
* ListTrucksQueryDto
* UpdateTruckStatusDto
* TruckResponseDto

## Funcionalidades

* CRUD completo com soft delete.
* Pesquisa por matrícula, marca e modelo.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Filtro por estado.
* Ordenação por `createdAt`, `plateNumber`, `brand`, `model`, `capacityKg` e `status`.
* Gestão de capacidade em kg.
* Gestão de disponibilidade com estados `AVAILABLE`, `ON_TRIP`, `MAINTENANCE` e `INACTIVE`.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## Regras de negócio

* Matrícula deve ser única.
* Camião removido recebe `deletedAt` e estado `INACTIVE`.
* Listagens ignoram camiões removidos.

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `trucks:manage`. O endpoint `health` permanece público.

## Próximos passos

No Sprint 6, implementar o módulo Cargas com CRUD, origem, destino, peso, cliente, estado, código automático, pesquisa, paginação, Swagger e testes.
