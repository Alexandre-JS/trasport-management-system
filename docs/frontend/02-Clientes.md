# Frontend 02 — Clientes (Listagem)

## Objetivo

Implementar a página de listagem de Clientes com o padrão profissional de tabela exigido para todas as listagens, consumindo a API real do backend (`GET /api/v1/clients`). Esta etapa também estabelece a camada de dados reutilizável (axios + TanStack Query) e o conjunto de componentes de listagem partilhados pelas páginas seguintes.

## Módulos/artefactos criados

### Camada de dados (`services/`, `types/`, `utils/`, `hooks/`)
- `services/http.ts` — instância axios (`baseURL` = `${NEXT_PUBLIC_API_BASE_URL}/api/v1`), interceptor que injeta `Authorization: Bearer <token>` a partir de `localStorage`, e `extractErrorMessage()` para normalizar erros.
- `services/clients-service.ts` — `listClients`, `getClient`, `deleteClient`, `setClientActive`.
- `types/api.ts` — `Paginated<T>`, `PaginationMeta`, `SortOrder`.
- `types/client.ts` — `Client`, `ClientSortBy`, `ListClientsParams`.
- `utils/auth-token.ts` — leitura/escrita do token (`sgrtc-token`).
- `utils/format.ts` — `formatDate`, `formatDateTime`, `shortCode`.
- `utils/export-csv.ts` — exportação client-side para CSV.
- `hooks/use-clients.ts` — `useClients` (query com `keepPreviousData`), `useDeleteClient`, `useSetClientActive` (mutations com invalidação).
- `hooks/use-debounced-value.ts` — debounce para pesquisa instantânea.

### Componentes reutilizáveis (`components/ui/`)
`DataTable` (genérica: checkbox de seleção, ordenação por coluna, colunas configuráveis, skeleton de loading, estado vazio, coluna de ações, slot de footer), `Pagination`, `SearchBar`, `Select`, `ColumnsMenu`, `ActionMenu`, `Modal`, `ConfirmDialog`, `Button`, `Badge`, `Spinner`.

### UX
`ToastProvider` (`providers/toast-provider.tsx`) montado no `AppProviders` — toasts de sucesso/erro/aviso/info.

### Página
- `app/clientes/page.tsx` — wrapper Server Component (`AppShell` + `ClientsView`).
- `components/clients/clients-view.tsx` — Client Component com toda a lógica da listagem.

## Endpoints consumidos

- `GET /api/v1/clients` — listagem com `page`, `limit`, `search`, `city`, `isActive`, `sortBy`, `sortOrder`.
- `DELETE /api/v1/clients/:id` — eliminar (soft delete).
- `PATCH /api/v1/clients/:id/activate` · `PATCH /api/v1/clients/:id/deactivate` — alternar estado.

## Tabela (colunas)

Checkbox · Código (id abreviado) · Empresa (+ email) · Contacto · Telefone · Cidade · Estado (Ativo/Inativo) · Data Cadastro · Atualização (oculta por omissão) · Ações.

## Funcionalidades (padrão de listagem)

- Pesquisa instantânea (debounce 350 ms).
- Filtros: Estado (Todos/Ativos/Inativos) e Cidade.
- Ordenação por Empresa, Contacto e Data Cadastro (toggle asc/desc no cabeçalho).
- Paginação inferior com total e intervalo; seletor de quantidade por página (10/20/50/100).
- Colunas configuráveis (menu Colunas).
- Seleção por linha e seleção total da página (com barra de seleção).
- Exportar (CSV da página atual), Atualizar (refetch), Novo Cliente.
- Menu de ações por linha: Detalhes (modal), Editar, Ativar/Desativar, Eliminar (confirmação).
- Indicadores de estado com `Badge`; loading com skeleton; erros com mensagem + repetir.
- Responsiva (scroll horizontal da tabela, filtros empilham em ecrãs pequenos).

## Fluxo do utilizador

1. Abre `/clientes`; a tabela carrega via TanStack Query (skeleton durante o carregamento).
2. Pesquisa/filtra/ordena; a cada alteração a página volta a 1 e a query é refeita (cache mantém dados anteriores).
3. Abre Detalhes num modal, alterna o estado ou elimina com confirmação — cada ação mostra um toast e invalida a cache.
4. Ajusta colunas visíveis, exporta CSV ou atualiza a lista.

## Regras da página

- Toda a comunicação HTTP fica em `services/` (a página nunca chama a API diretamente).
- Sem dados mockados: a lista vem do endpoint real; estados de loading/erro/vazio são honestos.
- Código do cliente é derivado do `id` (o backend não expõe um código dedicado para clientes).
- Criar/Editar mostram toast informativo até à etapa de formulários (sem rotas mortas).

## Nota de integração / autenticação

`GET /clients` exige JWT com permissão `clients:manage`. Como o **Login (etapa 2) ainda não foi implementado**, não existe token em `localStorage`, pelo que a API responde `401` e a página apresenta o estado de erro “Sessão não autenticada”. Assim que o Login estiver concluído e o token guardado em `sgrtc-token`, a listagem passa a carregar dados reais sem alterações adicionais.

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/clientes` incluída.

## Próximos passos

- Implementar o **Login** para fornecer o token e desbloquear os dados reais.
- Reutilizar este padrão (DataTable + serviços + hooks) nas listagens de Motoristas, Camiões, Cargas e Viagens.
- Formulários de criação/edição de clientes.
