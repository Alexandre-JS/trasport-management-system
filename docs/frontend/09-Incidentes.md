# Frontend 09 — Incidentes (Listagem)

## Objetivo

Listagem de Incidentes com o padrão profissional de tabela, consumindo `GET /api/v1/incidents`, com ação de **Resolver**. Esta etapa também completou o módulo de Incidentes no backend.

## Backend completado nesta etapa

O módulo `incidents` (que estava em stub) foi concluído:
- Novo campo `resolvedAt DateTime?` no modelo `Incident` (migration `add_incident_resolved_at`) para suportar Estado (Aberto/Resolvido) e a ação Resolver.
- `IncidentsService` + `IncidentsController` completos; `IncidentsModule` a importar `EventsModule`.
- Endpoints: `GET /incidents`, `GET /incidents/types`, `GET /incidents/:id`, `POST /incidents`, `PATCH /incidents/:id`, `PATCH /incidents/:id/resolve`, `DELETE /incidents/:id`.
- Ao reportar um incidente: a carga passa a `INCIDENT`, é emitido `incident:created` + `cargo:statusChanged` (WebSocket) e são notificados os perfis ADMIN/DISPATCHER.
- A resposta inclui a viagem aninhada (`trip.cargo.code`, `trip.driver.fullName`).

## Artefactos frontend criados

- `types/incident.ts` — `Incident`, `IncidentType`, `IncidentSortBy`, `ListIncidentsParams`.
- `services/incidents-service.ts` — `listIncidents`, `resolveIncident`, `deleteIncident`.
- `hooks/use-incidents.ts` — `useIncidents`, `useResolveIncident`.
- `utils/incident-type.ts` — mapa de tipo (label + tom) e opções de filtro (tipo e estado).
- `components/incidents/incidents-view.tsx` — Client Component da listagem.
- `app/incidentes/page.tsx` — wrapper Server Component.

## Endpoints consumidos

- `GET /api/v1/incidents` — `page`, `limit`, `type`, `resolved`, `sortBy`, `sortOrder`.
- `PATCH /api/v1/incidents/:id/resolve` — marcar como resolvido.

## Tabela (colunas)

Checkbox · Código (id abreviado) · Tipo (Acidente/Avaria/Trânsito/Via bloqueada/Outro) · Motorista (`trip.driver.fullName`) · Viagem (`trip.cargo.code`) · Local (lat/lng) · Data (`reportedAt`) · Estado (Aberto/Resolvido) · Ações.

## Funcionalidades

- Filtros por Tipo e por Estado (Todos/Abertos/Resolvidos), ordenação (Tipo, Data), paginação inferior + quantidade por página, colunas configuráveis, seleção, Exportar (CSV), Atualizar.
- Menu de ações por linha: **Visualizar** (modal), **Resolver** (confirmação → `PATCH /incidents/:id/resolve`, apenas se ainda estiver Aberto).
- Indicadores de estado com `Badge`; loading com skeleton; erro com mensagem + repetir; responsiva.

## Regras da página

- **Estado** deriva de `resolvedAt` (nulo = Aberto; preenchido = Resolvido).
- A criação de incidentes é feita no terreno (app do motorista via `POST /incidents`), pelo que a listagem não expõe "Novo".
- Não há pesquisa por texto: o endpoint de incidentes filtra por Tipo/Estado (não por texto livre).

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/incidentes` incluída.
- API validada: `GET /incidents` → 200 com dados reais (incidente BREAKDOWN na viagem SGRTC-0001, motorista Carlos Mabunda, Aberto).

## Próximos passos

- Dashboard com indicadores reais (endpoints `/dashboard/*`).
- Formulários de criação/edição.
