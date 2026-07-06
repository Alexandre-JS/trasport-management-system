# 28 - Sprint 3 Clientes

## Objetivo

Implementar a gestão de clientes da API com CRUD, pesquisa, paginação, filtros, estado, histórico, Swagger e testes.

## Módulo implementado

* Clients

## Endpoints

* `GET /api/v1/clients`
* `GET /api/v1/clients/:id`
* `GET /api/v1/clients/:id/history`
* `POST /api/v1/clients`
* `PATCH /api/v1/clients/:id`
* `PATCH /api/v1/clients/:id/activate`
* `PATCH /api/v1/clients/:id/deactivate`
* `DELETE /api/v1/clients/:id`
* `GET /api/v1/clients/health`

## DTOs

* CreateClientDto
* UpdateClientDto
* ListClientsQueryDto
* ClientResponseDto
* ClientHistoryResponseDto

## Funcionalidades

* CRUD completo com soft delete.
* Pesquisa por empresa, contacto, email, telefone e NUIT.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Filtros por cidade, província, país e estado ativo.
* Ordenação por `createdAt`, `companyName`, `contactName` e `email`.
* Ativar e inativar cliente.
* Histórico operacional do cliente através das suas cargas e viagens.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## Regras de negócio

* Clientes removidos recebem `deletedAt` e ficam inativos.
* Listagens e consultas ignoram clientes removidos.
* O histórico do cliente não cria tabela adicional; usa as relações existentes entre Client, Cargo e Trip.

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `clients:manage`. O endpoint `health` permanece público.

## Próximos passos

No Sprint 4, implementar o módulo Motoristas com CRUD, disponibilidade, estado, pesquisa, paginação, histórico, Swagger e testes.
