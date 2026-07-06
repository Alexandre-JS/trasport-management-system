# Frontend 06 — Cargas (Listagem)

## Objetivo

Listagem de Cargas com o padrão profissional de tabela, consumindo `GET /api/v1/cargo`, reutilizando os componentes e a camada de dados partilhados.

## Artefactos criados

- `types/cargo.ts` — `Cargo`, `CargoStatus`, `CargoSortBy`, `ListCargoParams`.
- `services/cargo-service.ts` — `listCargo`, `getCargo`, `cancelCargo`, `deleteCargo`.
- `hooks/use-cargo.ts` — `useCargo`, `useCancelCargo`.
- `utils/cargo-status.ts` — mapa de estado da carga (label + tom) e opções de filtro (8 estados).
- `components/cargo/cargo-view.tsx` — Client Component da listagem.
- `app/cargas/page.tsx` — wrapper Server Component (`AppShell` + `CargoView`).

## Endpoints consumidos

- `GET /api/v1/cargo` — `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder`.
- `PATCH /api/v1/cargo/:id/cancel` — cancelar carga.

## Tabela (colunas)

Checkbox · Código (`code`, ex.: SGRTC-0001) · Cliente · Origem · Destino · Peso (kg) · Estado (8 estados) · Data Recolha · Entrega Prevista · Atualização (oculta por omissão) · Ações.

## Funcionalidades

- Pesquisa instantânea (código/cliente/origem/destino), filtro por Estado, ordenação (Código, Origem, Destino, Peso, Estado), paginação inferior + quantidade por página, colunas configuráveis, seleção, Exportar (CSV), Atualizar, Criar Carga.
- Menu de ações por linha: Visualizar (modal), Editar, Atribuir, Cancelar (confirmação → `PATCH /cargo/:id/cancel`, apenas quando a carga não está entregue/cancelada).
- Indicadores de estado com `Badge` (Criada, Aguarda recolha, Recolhida, Em trânsito, Próx. destino, Entregue, Cancelada, Com incidente); loading com skeleton; erro com mensagem + repetir; responsiva.

## Regras da página

- O `Código` é o `code` real da carga (gerado pelo backend).
- **Cancelar** é a única ação de estado exposta na listagem (conforme spec); disponível apenas se a carga não estiver `DELIVERED`/`CANCELLED`.
- **Criar Carga**, **Editar** e **Atribuir** mostram toast informativo até às etapas de formulários e de atribuição a viagens.

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/cargas` incluída.
- API validada: `GET /cargo` autenticado → 200 com dados reais (`SGRTC-0001`, cliente, peso, datas, estado).

## Próximos passos

Viagens (última listagem); depois formulários (Criar Carga) e o fluxo de Atribuição a viagens.
