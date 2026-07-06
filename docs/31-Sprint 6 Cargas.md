# 31 - Sprint 6 Cargas

## Objetivo

Implementar a gestão de cargas com CRUD, origem, destino, peso, cliente, estado, código automático, pesquisa, paginação, Swagger e testes.

## Módulo implementado

* Cargo

## Endpoints

* `GET /api/v1/cargo`
* `GET /api/v1/cargo/:id`
* `POST /api/v1/cargo`
* `PATCH /api/v1/cargo/:id`
* `PATCH /api/v1/cargo/:id/status`
* `PATCH /api/v1/cargo/:id/cancel`
* `DELETE /api/v1/cargo/:id`
* `GET /api/v1/cargo/health`

## DTOs

* CreateCargoDto
* UpdateCargoDto
* ListCargoQueryDto
* UpdateCargoStatusDto
* CargoResponseDto

## Funcionalidades

* CRUD completo com soft delete.
* Código automático no formato `SGRTC-YYYYMMDD-NNNN`.
* Associação obrigatória a cliente ativo.
* Pesquisa por código, descrição, origem, destino e nome do cliente.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Filtros por cliente, estado, origem e destino.
* Ordenação por `createdAt`, `code`, `origin`, `destination`, `weightKg` e `status`.
* Gestão de estado da carga.
* Cancelamento de carga.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## Regras de negócio

* Uma carga só pode ser criada para cliente ativo e não removido.
* Código da carga é gerado pelo backend.
* Carga removida recebe `deletedAt` e estado `CANCELLED`.
* Listagens ignoram cargas removidas.

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `cargo:manage`. O endpoint `health` permanece público.

## Próximos passos

No Sprint 7, implementar o módulo Viagens com criação, edição, cancelamento, encerramento, atribuições, atualização de estado, pesquisa, paginação, Swagger e testes.
