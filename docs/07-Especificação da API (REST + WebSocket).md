# 07 - Especificação da API (REST + WebSocket)

## REST

### Autenticação

* `POST /auth/login`
* `POST /auth/refresh`
* `POST /auth/logout`

### Clientes

* `GET /clients`
* `POST /clients`
* `GET /clients/:id`
* `PATCH /clients/:id`
* `DELETE /clients/:id`

### Motoristas

* `GET /drivers`
* `POST /drivers`
* `GET /drivers/:id`
* `PATCH /drivers/:id`

### Camiões

* `GET /trucks`
* `POST /trucks`
* `GET /trucks/:id`
* `PATCH /trucks/:id`

### Cargas

* `GET /cargos`
* `POST /cargos`
* `GET /cargos/:id`
* `PATCH /cargos/:id`
* `GET /cargos/:id/history`

### Viagens

* `GET /trips`
* `POST /trips`
* `GET /trips/:id`
* `PATCH /trips/:id`
* `POST /trips/:id/assign-driver`
* `POST /trips/:id/assign-truck`
* `POST /trips/:id/close`

### Operação do motorista

* `GET /driver/trips`
* `POST /driver/trips/:id/confirm-pickup`
* `POST /driver/trips/:id/start`
* `POST /driver/trips/:id/tracking`
* `POST /driver/trips/:id/incidents`
* `POST /driver/trips/:id/confirm-delivery`

## WebSocket

### Eventos emitidos pelo cliente

* `tracking:update`
* `trip:statusChanged`
* `incident:created`

### Eventos emitidos pelo servidor

* `cargo:locationUpdated`
* `cargo:statusChanged`
* `notification:created`
* `trip:assigned`
