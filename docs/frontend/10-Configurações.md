# Frontend 10 — Configurações

## Objetivo

Hub de configurações do painel administrativo, organizado por secções: Empresa, Utilizadores, Perfis & Permissões, Integrações, Mapas e Notificações. A secção de Utilizadores consome dados reais; as restantes apresentam informação/estado de forma honesta (read-only), sem dados fictícios.

## Artefactos criados

- `types/user.ts` — `User`, `UserSortBy`, `ListUsersParams`.
- `services/users-service.ts` — `listUsers`, `setUserActive`.
- `hooks/use-users.ts` — `useUsers`, `useSetUserActive`.
- `utils/role-permissions.ts` — catálogo de perfis/permissões (referência que espelha `core/auth/permissions.ts`), mapas de rótulo e tom por perfil.
- `components/settings/users-panel.tsx` — listagem real de utilizadores.
- `components/settings/settings-view.tsx` — hub com abas e painéis informativos.
- `app/configuracoes/page.tsx` — wrapper Server Component.

## Secções

- **Empresa** — dados institucionais (read-only; edição numa próxima etapa).
- **Utilizadores** — listagem real (`GET /api/v1/users`): Nome (+ email), Perfil (badge), Estado, Último acesso, Criado em, Ações (Ativar/Desativar). Pesquisa, filtro por perfil e estado, ordenação, paginação + quantidade por página, Atualizar.
- **Perfis & Permissões** — matriz dos 4 perfis (ADMIN, DISPATCHER, DRIVER, CLIENT) com descrição e permissões.
- **Integrações** — estado (WebSocket ativo, GPS ativo, Email/SMS planeado).
- **Mapas** — provedor atual (OpenStreetMap via Leaflet, gratuito, sem chave) + nota de abstração.
- **Notificações** — canais (in-app e WebSocket ativos; push e email/SMS futuros).

## Endpoints consumidos

- `GET /api/v1/users` — `page`, `limit`, `search`, `role`, `isActive`, `sortBy`, `sortOrder`.
- `PATCH /api/v1/users/:id/activate` · `/deactivate` — ativar/desativar utilizador.

## Regras da página

- Apenas a secção Utilizadores tem endpoint dedicado; as restantes são informativas/read-only (sem mocks de API).
- A matriz de Perfis & Permissões espelha o backend (definido em código, sem endpoint próprio); é apresentada como referência.
- Acesso a `GET /users` exige permissão `users:manage` (perfil ADMIN).

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/configuracoes` incluída.
- API validada: `GET /users` → 200 com utilizadores reais do seed (ADMIN, DISPATCHER, DRIVER, CLIENT).

## Estado do plano de páginas

Concluídas: Layout · Login · Clientes · Motoristas · Camiões · Cargas · Viagens · Rastreamento · Incidentes · Configurações.
Em falta: **Dashboard** (indicadores reais — endpoints `/dashboard/*` a completar no backend) e **Relatórios**; além dos **formulários** de criação/edição.
