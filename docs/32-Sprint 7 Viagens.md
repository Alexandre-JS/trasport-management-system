# 32 - Sprint 7 Viagens

## Objetivo

Implementar a gestão de viagens com criação, edição, cancelamento, encerramento, atribuições, atualização de estado, pesquisa, paginação, Swagger e testes.

## Módulo implementado

* Trips

## Endpoints

* `GET /api/v1/trips`
* `GET /api/v1/trips/:id`
* `POST /api/v1/trips`
* `PATCH /api/v1/trips/:id`
* `PATCH /api/v1/trips/:id/status`
* `PATCH /api/v1/trips/:id/cancel`
* `PATCH /api/v1/trips/:id/close`
* `PATCH /api/v1/trips/:id/assign-driver`
* `PATCH /api/v1/trips/:id/assign-truck`
* `PATCH /api/v1/trips/:id/assign-cargo`
* `DELETE /api/v1/trips/:id`
* `GET /api/v1/trips/health`

## DTOs

* CreateTripDto
* UpdateTripDto
* ListTripsQueryDto
* UpdateTripStatusDto
* AssignDriverDto
* AssignTruckDto
* AssignCargoDto
* TripResponseDto

## Funcionalidades

* Criar viagem com carga, camião e motorista obrigatórios.
* Editar viagem.
* Cancelar viagem.
* Encerrar viagem.
* Atribuir motorista.
* Atribuir camião.
* Atribuir carga.
* Atualizar estado da viagem.
* Pesquisa por código/origem/destino da carga, motorista e matrícula do camião.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Filtros por carga, camião, motorista e estado.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## Regras de negócio

* Viagem não pode existir sem carga, camião e motorista.
* Carga atribuída deve existir, estar ativa e não estar entregue/cancelada.
* Motorista atribuído deve existir e não estar inativo.
* Camião atribuído deve existir e não estar inativo.
* Viagem removida recebe `deletedAt` e estado `CANCELLED`.
* Encerramento define estado `FINISHED`.

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `trips:manage`. O endpoint `health` permanece público.

## Próximos passos

No Sprint 8, implementar o módulo Rastreamento GPS com receção de coordenadas, última localização, histórico, WebSocket, eventos em tempo real, Swagger e testes.
