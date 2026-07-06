# Frontend 08 — Rastreamento (Mapa GPS)

## Objetivo

Página de rastreamento GPS em tempo real: mapa com as posições das cargas em movimento e tabela lateral com a última posição, velocidade, estado e hora de cada viagem ativa. Consome o módulo de Tracking do backend.

## Provedor de mapa

Usa **Leaflet + OpenStreetMap** (`react-leaflet`) — **gratuito e sem chave de API**. O componente `LiveMap` mantém a abstração, permitindo trocar de provedor (ex.: Google Maps, MapLibre) no futuro sem alterar a página.

## Artefactos criados

- `types/tracking.ts` — `TrackingPoint`, `TripRoutePoint`, `TripRoute`.
- `services/tracking-service.ts` — `getLastLocation`, `getTripRoute`.
- `hooks/use-tracking.ts` — `useLastLocations` (várias viagens via `useQueries`), `useTripRoute`.
- `components/tracking/live-map.tsx` — abstração do mapa; carrega o Leaflet dinamicamente (`ssr: false`, obrigatório porque o Leaflet acede a `window`).
- `components/tracking/leaflet-map.tsx` — mapa Leaflet/OSM com marcadores (`CircleMarker`), popups e botão Centralizar.
- `components/tracking/tracking-view.tsx` — Client Component: mapa + tabela lateral + modal de histórico.
- `app/rastreamento/page.tsx` — wrapper Server Component.

## Endpoints consumidos

- `GET /api/v1/trips` — viagens ativas (filtradas client-side para `SCHEDULED`/`STARTED`/`IN_PROGRESS`).
- `GET /api/v1/tracking/trips/:id/last` — última posição de cada viagem ativa.
- `GET /api/v1/tracking/trips/:id/route` — histórico ordenado (modal Ver Histórico).

## Componentes da página

- **Mapa Leaflet/OSM** com marcadores por viagem; botão **Centralizar** (ajusta os limites aos marcadores); centra na viagem selecionada na tabela.
- **Tabela lateral** de viagens ativas: Carga (código), Estado (badge), Última posição (lat/lng), Velocidade (km/h), Hora (`recordedAt`), e botão **Ver Histórico**.
- **Modal de Histórico**: lista de posições (Hora · Posição · Velocidade) com contagem total.

## Botões (conforme spec)

- **Centralizar** — ajusta o mapa aos marcadores (overlay no mapa).
- **Atualizar** — refaz as viagens e invalida as últimas posições.
- **Ver Histórico** — abre o percurso registado da viagem.

## Regras e integração

- **Sem chave de API**: o Leaflet + OSM funciona imediatamente; não requer configuração.
- **Dados GPS**: as posições vêm da app do motorista (via `POST /tracking/trips/:id/points`). Enquanto não existirem pontos, a tabela mostra "Sem posição registada" e o mapa fica sem marcadores — comportamento honesto (a tabela `tracking_points` está vazia no seed).
- Tempo real: o backend emite `tracking:update`/`cargo:locationUpdated` por WebSocket; a ligação do canal em tempo real ao mapa é um próximo passo (por agora usa atualização manual/`Atualizar`).

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/rastreamento` incluída.
- Backend validado: `GET /tracking/health` → 200; `.../last` → 404 "sem posição" (esperado, sem pontos GPS).

## Próximos passos

- Ligar o WebSocket (`tracking:update`) para atualização de marcadores em tempo real.
- Desenhar o percurso (polyline) no mapa a partir de `/route`.
- Alimentar pontos GPS reais via app do motorista.
