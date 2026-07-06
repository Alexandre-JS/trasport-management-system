# 26 - Sprint 1 Autenticação

## Objetivo

Implementar a autenticação base da API sem alterar a arquitetura existente.

## Módulo implementado

* Auth

## Endpoints

* `POST /api/v1/auth/login`
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`
* `GET /api/v1/auth/me`
* `PATCH /api/v1/auth/password`
* `GET /api/v1/auth/health`

## DTOs

* LoginDto
* RefreshTokenDto
* ChangePasswordDto
* AuthResponseDto
* ProfileResponseDto

## Segurança

* Access Token com JWT.
* Refresh Token com JWT e secret separado.
* Password hash com bcrypt.
* Guard JWT para rotas protegidas.
* Guard de permissões.
* Decorator `@CurrentUser()`.
* Decorators `@Roles()` e `@Permissions()`.

## Roles e permissões

Roles já suportadas pelo seed:

* ADMIN
* DISPATCHER
* DRIVER
* CLIENT

As permissões foram mapeadas em código nesta sprint para evitar alterações desnecessárias no schema.

## Decisão arquitetural

O refresh token foi implementado de forma stateless com JWT. O logout confirma a saída para o cliente, mas ainda não faz revogação persistida de token porque o schema atual não possui tabela de sessões/tokens e a sprint não exigiu alteração obrigatória da base.

## Próximos passos

No Sprint 2, implementar o módulo Users com CRUD, pesquisa, paginação, filtros, ativação/inativação, reset de password e alteração de perfil.
