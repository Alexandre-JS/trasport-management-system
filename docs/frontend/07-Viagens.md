# Frontend 07 — Viagens (Listagem)

## Objetivo

Listagem de Viagens com o padrão profissional de tabela, consumindo `GET /api/v1/trips`. Última das listagens operacionais, completando o conjunto Clientes/Motoristas/Camiões/Cargas/Viagens.

## Artefactos criados

- `types/trip.ts` — `Trip`, `TripStatus`, `TripSortBy`, `ListTripsParams`.
- `services/trips-service.ts` — `listTrips`, `getTrip`, `cancelTrip`, `closeTrip`.
- `hooks/use-trips.ts` — `useTrips`, `useCancelTrip`, `useCloseTrip`.
- `utils/trip-status.ts` — mapa de estado (label + tom) e opções de filtro.
- `components/trips/trips-view.tsx` — Client Component da listagem.
- `app/viagens/page.tsx` — wrapper Server Component (`AppShell` + `TripsView`).

## Endpoints consumidos

- `GET /api/v1/trips` — `page`, `limit`, `search`, `currentStatus`, `sortBy`, `sortOrder`.
- `PATCH /api/v1/trips/:id/cancel` — cancelar viagem.
- `PATCH /api/v1/trips/:id/close` — encerrar viagem (passa a Concluída).

## Tabela (colunas)

Checkbox · Código (id abreviado) · Carga (`cargo.code`) · Motorista (`driver.fullName`) · Camião (`truck.plateNumber`) · Origem · Destino · Estado (Agendada/Iniciada/Em curso/Concluída/Cancelada) · Hora Saída (`departureDate`) · Hora Chegada (`arrivalDate`) · Ações.

## Funcionalidades

- Pesquisa instantânea (carga/motorista/matrícula), filtro por Estado, ordenação (Estado, Hora Saída, Hora Chegada — chaves suportadas pelo backend), paginação inferior + quantidade por página, colunas configuráveis, seleção, Exportar (CSV), Atualizar, Nova Viagem.
- Menu de ações por linha: Visualizar (modal), Editar, Encerrar (confirmação → `/close`), Cancelar (confirmação → `/cancel`). Encerrar/Cancelar só aparecem se a viagem não estiver Concluída/Cancelada.
- Indicadores de estado com `Badge`; loading com skeleton; erro com mensagem + repetir; responsiva.

## Regras da página

- O `Código` da viagem é derivado do `id` (a viagem não tem código dedicado); a coluna `Carga` mostra o código real da carga.
- Origem/Destino provêm da carga associada (`cargo.origin`/`cargo.destination`).
- **Nova Viagem** e **Editar** mostram toast até à etapa de formulários.

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/viagens` incluída.
- API validada: `GET /trips` autenticado → 200 com dados reais (viagem da carga SGRTC-0001, motorista Carlos Mabunda, estado SCHEDULED).

## Estado das listagens

Concluídas todas as listagens operacionais: **Clientes, Motoristas, Camiões, Cargas, Viagens**.

## Próximos passos

- Formulários de criação/edição (Nova Viagem, Criar Carga, etc.) reutilizando `Input` + RHF + Zod.
- Fluxo de atribuição (motorista/camião/carga) usando `PATCH /trips/:id/assign-*`.
- Dashboard com dados reais, Rastreamento (mapa) e Incidentes.
