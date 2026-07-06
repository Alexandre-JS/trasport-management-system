# 06 - Modelo da Base de Dados

## Stack

* PostgreSQL
* Prisma ORM
* UUID como chave primária em todas as entidades

## Entidades

* Role
* User
* Client
* Driver
* Truck
* Cargo
* Trip
* TrackingPoint
* Delivery
* Incident
* Notification

## Enums

### DriverStatus

* AVAILABLE
* ON_TRIP
* OFFLINE
* INACTIVE

### TruckStatus

* AVAILABLE
* ON_TRIP
* MAINTENANCE
* INACTIVE

### CargoStatus

* CREATED
* WAITING_PICKUP
* PICKED_UP
* IN_TRANSIT
* NEAR_DESTINATION
* DELIVERED
* CANCELLED
* INCIDENT

### TripStatus

* SCHEDULED
* STARTED
* IN_PROGRESS
* FINISHED
* CANCELLED

### IncidentType

* ACCIDENT
* BREAKDOWN
* TRAFFIC
* ROAD_BLOCKED
* OTHER

### NotificationType

* INFO
* WARNING
* SUCCESS
* ERROR

## Relacionamentos

* Role possui muitos Users.
* User pertence a uma Role.
* User pode possuir um perfil Driver.
* User possui muitas Notifications.
* Client possui muitas Cargos.
* Cargo pertence a um Client.
* Cargo possui muitas Trips.
* Trip pertence obrigatoriamente a uma Cargo, um Truck e um Driver.
* Trip possui muitos TrackingPoints.
* Trip possui muitas Deliveries.
* Trip possui muitos Incidents.
* Notification pertence a um User.

## Constraints

* `roles.name` é único.
* `users.email` é único.
* `drivers.userId` é único quando existir.
* `drivers.licenseNumber` é único.
* `trucks.plateNumber` é único.
* `cargos.code` é único.
* Uma Trip não pode existir sem Cargo, Truck e Driver.

## Soft Delete

As entidades principais de cadastro e operação possuem `deletedAt`:

* Role
* User
* Client
* Driver
* Truck
* Cargo
* Trip

Entidades de evento/histórico, como TrackingPoint, Delivery, Incident e Notification, não usam soft delete nesta fase.

## Índices

Índices criados para pesquisa e listagens operacionais:

* email
* plateNumber
* licenseNumber
* code
* tripId
* clientId
* status
* recordedAt
* createdAt

## Migration

Migration inicial:

```text
apps/api/prisma/migrations/20260701143000_init_transport_management_schema/migration.sql
```

## Seed

Seed inicial:

```text
apps/api/prisma/seed.ts
```

Inclui:

* Roles ADMIN, DISPATCHER, DRIVER e CLIENT.
* Utilizador administrador.
* Utilizador dispatcher.
* Utilizador motorista.
* Utilizador cliente.
* Cliente de exemplo.
* Motorista de exemplo.
* Camião de exemplo.
* Carga de exemplo.
* Viagem de exemplo.
