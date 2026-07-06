# Frontend 05 — Login e Autenticação

## Objetivo

Implementar a autenticação do painel administrativo (etapa 2 do plano): página de Login, contexto de autenticação, persistência do token, guarda de rotas e ligação da identidade do utilizador ao header. Desbloqueia os dados reais em todas as listagens.

## Artefactos criados

- `types/auth.ts` — `AuthUser`, `AuthResponse`, `LoginPayload`, `Profile`.
- `services/auth-service.ts` — `login` (`POST /auth/login`), `getProfile` (`GET /auth/me`), `logout` (`POST /auth/logout`).
- `providers/auth-provider.tsx` — contexto de auth: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`. Ao montar, se existir token, hidrata o utilizador via `/auth/me`; senão fica não autenticado.
- `components/auth/auth-guard.tsx` — protege as rotas: mostra spinner enquanto carrega e redireciona para `/login` se não autenticado.
- `components/ui/input.tsx` — campo de formulário reutilizável (label + ícone + erro).
- `app/login/page.tsx` — formulário de Login (React Hook Form + Zod).
- Integrações: `AuthProvider` adicionado ao `AppProviders`; `AppShell` envolvido pelo `AuthGuard`; `UserMenu` ligado ao contexto (nome/email reais + terminar sessão).

## Stack de formulários

- **React Hook Form** + **Zod** (`@hookform/resolvers/zod`) — validação com mensagens de erro. Este é o padrão para todos os formulários seguintes (criação/edição).

## Endpoints consumidos

- `POST /api/v1/auth/login` — `{ email, password }` → `{ accessToken, refreshToken, user }`.
- `GET /api/v1/auth/me` — perfil do utilizador autenticado (hidratação e refrescamento).
- `POST /api/v1/auth/logout` — encerramento de sessão (best-effort; JWT é stateless).

## Fluxo do utilizador

1. Utilizador sem token é redirecionado para `/login`.
2. Introduz email + palavra-passe; validação client-side (Zod) antes do envio.
3. `login()` guarda `accessToken`/`refreshToken` em `localStorage` (`sgrtc-token`) e define o utilizador.
4. É redirecionado para o Dashboard; o header passa a mostrar o nome/email reais.
5. Todas as chamadas às APIs passam a incluir `Authorization: Bearer` (via interceptor axios), pelo que as listagens carregam dados reais.
6. "Terminar sessão" limpa os tokens e volta ao `/login`.

## Regras

- Rotas do painel (tudo o que usa `AppShell`) exigem sessão; `/login` é pública.
- O token é persistido em `localStorage` e reidratado no arranque via `/auth/me`; se inválido/expirado, é limpo e o utilizador volta ao Login.
- Credenciais de teste (seed): `admin@sgrtc.local` / `Admin@12345`.

## Verificação

- `pnpm run lint` (web) — sem erros.
- `pnpm run build` (web) — compila; rota `/login` incluída.
- API validada ponta-a-ponta: `POST /auth/login` → token; `GET /auth/me` → perfil (formato coincide com `Profile`); `GET /trucks` com token → 200 com dados reais.

## Próximos passos

- Refresh automático do token (usar `refreshToken` no interceptor ao receber 401).
- Ligar as notificações do header às APIs (`/notifications`).
- Formulários de criação/edição (Clientes, Motoristas, Camiões) reutilizando `Input` + RHF + Zod.
