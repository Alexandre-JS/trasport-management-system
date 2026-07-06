# 33 - Sprint 8 Rastreamento GPS

## Objetivo

Implementar o rastreamento GPS das viagens com receção de pontos, última localização, histórico, percurso pronto para mapa, distribuição por WebSocket, eventos em tempo real, Swagger e testes.

## Módulo implementado

* Tracking

## Endpoints

* `POST /api/v1/tracking/trips/:tripId/points`
* `GET /api/v1/tracking/trips/:tripId/last`
* `GET /api/v1/tracking/trips/:tripId/history`
* `GET /api/v1/tracking/trips/:tripId/route`
* `GET /api/v1/tracking/health`

## DTOs

* CreateTrackingPointDto
* ListTrackingQueryDto
* TrackingPointResponseDto
* TripRouteResponseDto

## Funcionalidades

* Receção de pontos GPS (latitude, longitude, velocidade, direção, precisão e data/hora) associados a uma viagem.
* Última localização conhecida da viagem.
* Histórico do percurso com paginação e filtro por intervalo de datas (`from`/`to`).
* Percurso pronto para mapa, com posições ordenadas cronologicamente.
* Paginação com `page`, `limit`, `total` e `totalPages`.
* Logs estruturados no service.
* Endpoints documentados no Swagger.

## WebSocket e tempo real

* Gateway com salas por viagem (`trip:{tripId}`).
* Cliente subscreve com `tracking:subscribe` e cancela com `tracking:unsubscribe`.
* Cada ponto recebido emite `tracking:update` para a sala da viagem.
* Cada ponto recebido emite `cargo:locationUpdated` de forma global para o painel administrativo.

## Regras de negócio

* Só são aceites pontos para viagens existentes e não canceladas.
* A data/hora da posição assume o momento atual quando omitida.
* A última localização e o percurso ordenam pela data/hora da posição (`recordedAt`).

## Segurança

Todos os endpoints de gestão exigem JWT válido e permissão `tracking:manage`, concedida a `ADMIN`, `DISPATCHER` e `DRIVER`. O endpoint `health` permanece público.

## Próximos passos

No Sprint 9, implementar Entregas e Incidentes com confirmação de recolha e entrega, fotografia, assinatura, observações, tipos de incidente, notificações, Swagger e testes.
