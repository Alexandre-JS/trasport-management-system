# 05 - Arquitetura do Sistema

## Frontend Administrativo

* Next.js
* Tailwind CSS

## Aplicação do Motorista

* Ionic
* Angular

## Backend

* NestJS
* API REST
* WebSocket para eventos em tempo real

## Base de Dados

* PostgreSQL

## Tempo Real

* WebSocket para localização, estados e notificações.

## Mapas

* Google Maps ou OpenStreetMap.

## Armazenamento

* Supabase Storage ou Amazon S3 para fotografias de entregas e incidentes.

## Autenticação

* JWT.

## Princípios

* Arquitetura modular.
* APIs desacopladas do frontend.
* Backend orientado ao domínio.
* Todas as alterações relevantes registadas em histórico.
* Dados de localização transmitidos em tempo real.
* Segurança baseada em permissões por perfil.

## Backend API

O backend NestJS deve seguir a estrutura:

```text
src/
  common/
  config/
  core/
    auth/
    database/
    events/
    gps/
    logger/
    notifications/
    shared/
    tracking/
  modules/
```

Os módulos de negócio ficam em `src/modules` e devem manter separação entre `controller`, `services`, `repository`, `dto`, `entities`, `interfaces`, `mappers`, `validators` e `events`.

Controllers não acessam Prisma diretamente. O acesso a dados passa por repositories e o Prisma fica encapsulado em `core/database`.
