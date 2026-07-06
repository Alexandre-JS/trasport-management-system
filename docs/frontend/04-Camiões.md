# Frontend 04 — Camiões (Listagem)

## Objetivo

Listagem de Camiões com o padrão profissional de tabela, consumindo `GET /api/v1/trucks`, reutilizando os componentes e a camada de dados partilhados.

## Artefactos criados

- `types/truck.ts` — `Truck`, `TruckStatus`, `TruckSortBy`, `ListTrucksParams`, `TruckStatusAction`.
- `services/trucks-service.ts` — `listTrucks`, `getTruck`, `deleteTruck`, `updateTruckStatus`.
- `hooks/use-trucks.ts` — `useTrucks`, `useDeleteTruck`, `useTruckStatusAction`.
- `utils/truck-status.ts` — mapa de estado (label + tom) e opções de filtro.
- `utils/format.ts` — `formatWeight` adicionado (capacidade em kg).
- `components/trucks/trucks-view.tsx` — Client Component da listagem.
- `app/camioes/page.tsx` — wrapper Server Component (`AppShell` + `TrucksView`).

## Endpoints consumidos

- `GET /api/v1/trucks` — `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder`.
- `PATCH /api/v1/trucks/:id/available` · `/maintenance` · `/deactivate` — ações de estado.
- `DELETE /api/v1/trucks/:id` — eliminar (soft delete).

## Tabela (colunas)

Checkbox · Matrícula · Marca · Modelo · Capacidade (kg) · Estado (Disponível/Em viagem/Manutenção/Inativo) · Motorista Atual · Atualização (oculta por omissão) · Ações.

## Funcionalidades

- Pesquisa instantânea (matrícula/marca/modelo), filtro por Estado, ordenação (Matrícula, Marca, Modelo, Capacidade, Estado), paginação inferior + quantidade por página, colunas configuráveis, seleção, Exportar (CSV), Atualizar, Novo Camião.
- Menu de ações por linha: Detalhes (modal), Editar, Marcar disponível, Enviar p/ manutenção, Desativar, Eliminar (confirmação) — cada uma com toast + invalidação de cache.
- Indicadores de estado com `Badge`; loading com skeleton; erro com mensagem + repetir; responsiva.

## Regras da página

- A Matrícula é o identificador natural do camião (não há coluna "Código" separada).
- **"Motorista Atual"** aparece como "—": o endpoint de listagem não expõe o motorista/viagem ativa. A coluna é configurável.
- Criar/Editar mostram toast até à etapa de formulários.

## Nota de integração

`GET /trucks` exige JWT (`trucks:manage`). Sem o Login (etapa 2) a API responde `401` e a página mostra o estado de erro; após o Login os dados carregam sem alterações.

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/camioes` incluída.

## Próximos passos

Cargas e Viagens seguindo o mesmo padrão; Login para desbloquear dados reais.
