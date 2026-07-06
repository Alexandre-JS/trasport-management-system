# Frontend 01 — Layout Principal

## Objetivo

Estabelecer a estrutura base do Frontend Administrativo (Next.js 16 / React 19 / Tailwind v4), servindo de casca a todas as páginas seguintes. Inclui sidebar fixa, header, breadcrumb, pesquisa global, notificações, menu do utilizador, modo claro/escuro e os providers da aplicação (Tema + TanStack Query).

## Stack e fundações

- **Next.js 16.2.9** (App Router, Server Components por omissão, Client Components apenas quando há interatividade).
- **Tailwind CSS v4** com dark mode por classe (`@custom-variant dark`).
- **lucide-react** para ícones.
- **@tanstack/react-query** para o estado de dados (provider já montado, consumido pelas páginas seguintes).
- **axios** instalado para a futura camada `services/` autenticada.

## Componentes utilizados

### Providers (`providers/`)
- `app-providers.tsx` — compõe `ThemeProvider` + `QueryProvider`, montado no `app/layout.tsx`.
- `theme-provider.tsx` — tema claro/escuro via `useSyncExternalStore` (fonte de verdade = classe `dark` no `<html>`), persistido em `localStorage` (`sgrtc-theme`). Sem flash graças ao script inline no `layout.tsx`.
- `query-provider.tsx` — `QueryClient` com `staleTime` 30s, `retry` 1, `refetchOnWindowFocus` desligado.

### Layout (`components/layout/`)
- `app-shell.tsx` — grelha sidebar + header + `main`.
- `sidebar.tsx` — sidebar fixa (desktop) com logótipo e navegação.
- `header.tsx` — barra superior (hambúrguer mobile, breadcrumb, pesquisa, notificações, tema, utilizador).
- `global-search.tsx` — pesquisa global (salto rápido entre páginas com base na navegação).
- `notifications-menu.tsx` — dropdown de notificações (shell; integração ligada após o Login).
- `theme-toggle.tsx` — alterna claro/escuro.
- `user-menu.tsx` — dropdown do utilizador (perfil, configurações, terminar sessão).

### Navegação (`components/navigation/`)
- `navigation-list.tsx` — navegação agrupada por secções (reutilizada no desktop e no drawer mobile).
- `mobile-navigation.tsx` — botão hambúrguer + drawer lateral com overlay.
- `breadcrumb.tsx` — trilho Secção / Página derivado da rota atual.

### UI partilhada (`components/ui/`) — preparada para dark mode
`page-header`, `stat-card`, `status-badge`, `data-table`, `empty-state`, `module-placeholder`.

### Hooks / Utils / Types
- `hooks/use-click-outside.ts` — fecha dropdowns por clique fora / tecla `Escape`.
- `utils/navigation.ts` — `navigationSections`, `navigationItems`, `getBreadcrumbTrail`, `isItemActive`.
- `types/navigation.ts` — `NavigationItem`, `NavigationSection`, `BreadcrumbTrail`.

## Menu principal

- **Geral**: Dashboard (`/`)
- **Operações**: Cargas (`/cargas`), Viagens (`/viagens`), Rastreamento (`/rastreamento`)
- **Cadastros**: Clientes (`/clientes`), Motoristas (`/motoristas`), Camiões (`/camioes`)
- **Monitorização**: Incidentes (`/incidentes`), Mapa em Tempo Real (`/mapa`)
- **Gestão**: Relatórios (`/relatorios`), Configurações (`/configuracoes`)

## Endpoints consumidos

Nenhum nesta etapa — o Layout é estrutural. A pesquisa global usa a navegação local (não são dados de API). O menu de notificações e a identidade do utilizador ficam como *shell* e são ligados às APIs (`/notifications`, `/auth/me`) a partir da etapa de Login.

## Fluxo do utilizador

1. O utilizador entra em qualquer rota; o `AppShell` renderiza sidebar + header + conteúdo.
2. Navega pela sidebar (desktop) ou pelo drawer (mobile, hambúrguer no header).
3. O breadcrumb reflete a secção e a página atuais.
4. A pesquisa global permite saltar para qualquer página escrevendo o nome.
5. O botão de tema alterna claro/escuro, com preferência persistida.
6. Notificações e menu do utilizador abrem em dropdown (fecham por clique fora / `Escape`).

## Regras da página

- Sidebar fixa apenas em `lg+`; abaixo disso usa-se o drawer.
- Toda a comunicação HTTP fica em `services/` (nunca nas páginas) — regra herdada para as próximas etapas.
- Sem dados mockados quando existir endpoint; os shells atuais mostram estados vazios honestos até à ligação com a API.
- Modo claro/escuro é uma fundação transversal: os componentes UI partilhados já têm variantes `dark:`.

## Verificação

- `pnpm run lint` — sem erros (incl. regra `react-hooks/set-state-in-effect`).
- `pnpm run build` — compila; 12 rotas pré-renderizadas (inclui `/mapa`).
- Responsividade validada pelas breakpoints Tailwind (`lg` para sidebar/conteúdo, `md` para pesquisa, drawer mobile).

## Próximos passos

Etapa 2 — **Login**: camada `services/` com axios + interceptors, contexto de autenticação, e ligação real das notificações e da identidade do utilizador no header.
