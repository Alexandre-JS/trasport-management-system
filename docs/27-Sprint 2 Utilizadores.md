# 27 - Sprint 2 Utilizadores

## Objetivo

Implementar a gestão de utilizadores da API mantendo Clean Architecture, Repository Pattern e validação por DTOs.

## Módulo implementado

* Users

## Endpoints

* `GET /api/v1/users`
* `GET /api/v1/users/:id`
* `POST /api/v1/users`
* `PATCH /api/v1/users/:id`
* `PATCH /api/v1/users/:id/activate`
* `PATCH /api/v1/users/:id/deactivate`
* `PATCH /api/v1/users/:id/password/reset`
* `PATCH /api/v1/users/:id/role`
* `DELETE /api/v1/users/:id`
* `GET /api/v1/users/health`

## DTOs

* CreateUserDto
* UpdateUserDto
* ListUsersQueryDto
* ResetPasswordDto
* ChangeUserRoleDto
* UserResponseDto

## Funcionalidades

* CRUD completo com soft delete.
* Pesquisa por nome, email e telefone.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Filtros por `roleId`, `role` e `isActive`.
* Ordenação por `createdAt`, `email`, `firstName` e `lastName`.
* Ativar e inativar utilizador.
* Reset de password com bcrypt.
* Alteração de perfil/role.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## Regras de negócio

* Email deve ser único entre utilizadores não eliminados.
* Role deve existir antes de criar ou alterar perfil.
* Password não pode ser alterada pelo endpoint genérico de update.
* Remoção de utilizador é soft delete (`deletedAt`) e também inativa o utilizador.

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `users:manage`. O endpoint `health` permanece público para preservar compatibilidade operacional.

## Próximos passos

No Sprint 3, implementar o módulo Clientes com CRUD, pesquisa, paginação, filtros, estado, histórico, Swagger e testes.
