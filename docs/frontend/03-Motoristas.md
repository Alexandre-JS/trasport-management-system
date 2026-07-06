# Frontend 03 — Motoristas (Listagem)

## Objetivo

Listagem de Motoristas com o padrão profissional de tabela, consumindo `GET /api/v1/drivers`, reutilizando integralmente os componentes e a camada de dados criados na etapa de Clientes.

## Artefactos criados

- `types/driver.ts` — `Driver`, `DriverStatus`, `DriverSortBy`, `ListDriversParams`, `DriverStatusAction`.
- `services/drivers-service.ts` — `listDrivers`, `getDriver`, `deleteDriver`, `updateDriverStatus`.
- `hooks/use-drivers.ts` — `useDrivers`, `useDeleteDriver`, `useDriverStatusAction`.
- `utils/driver-status.ts` — mapa de disponibilidade (label + tom) e opções de filtro.
- `utils/query-params.ts` — `cleanParams` partilhado (extraído de clients-service para evitar duplicação).
- `components/drivers/drivers-view.tsx` — Client Component da listagem.
- `app/motoristas/page.tsx` — wrapper Server Component (`AppShell` + `DriversView`).

## Endpoints consumidos

- `GET /api/v1/drivers` — `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder`.
- `PATCH /api/v1/drivers/:id/available` · `/offline` · `/deactivate` — ações de estado.
- `DELETE /api/v1/drivers/:id` — eliminar (soft delete).

## Tabela (colunas)

Checkbox · Código (id abreviado) · Nome (+ email) · Carta · Telefone · Estado (Ativo/Inativo) · Disponibilidade (Disponível/Em viagem/Offline/Inativo) · Última Viagem · Atualização (oculta por omissão) · Ações.

## Funcionalidades

- Pesquisa instantânea (nome/carta/email), filtro por Disponibilidade, ordenação (Nome, Carta, Disponibilidade, implícita Data), paginação inferior + quantidade por página, colunas configuráveis, seleção, Exportar (CSV), Atualizar, Novo Motorista.
- Menu de ações por linha: Detalhes (modal), Editar, Marcar disponível/offline, Desativar, Eliminar (confirmação) — cada uma com toast + invalidação de cache.
- Indicadores de estado com `Badge`; loading com skeleton; erro com mensagem + repetir; responsiva.

## Regras da página

- "Estado" (Ativo/Inativo) e "Disponibilidade" derivam do mesmo campo `status` do backend.
- **"Última Viagem"** aparece como "—": o endpoint de listagem não expõe a última viagem (disponível apenas em `GET /drivers/:id/history`). A coluna é configurável e pode ser ocultada.
- Código derivado do `id` (o backend não expõe código dedicado).
- Criar/Editar mostram toast até à etapa de formulários (sem rotas mortas).

## Nota de integração

Tal como Clientes, `GET /drivers` exige JWT (`drivers:manage`). Sem o Login (etapa 2) a API responde `401` e a página mostra o estado de erro; após o Login os dados carregam sem alterações.

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/motoristas` incluída.

## Próximos passos

Camiões, Cargas e Viagens seguindo o mesmo padrão; Login para desbloquear dados reais.
