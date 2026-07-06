# Frontend 11 — Formulários (Criação & Edição)

## Objetivo

Formulários de criação e edição para os cadastros (Clientes, Motoristas, Camiões), com validação, mensagens de erro, loading e os botões padrão: Guardar, Guardar e Continuar, Cancelar, Limpar. Consomem os endpoints reais de `POST`/`PATCH`.

## Stack de formulários

React Hook Form + Zod (`@hookform/resolvers/zod`). Componentes de campo reutilizáveis: `Input`, `Textarea`, `Select`.

## Artefactos criados

- `components/ui/form-actions.tsx` — barra de ações (Limpar, Cancelar, Guardar e Continuar, Guardar) com estado de loading.
- `components/ui/textarea.tsx` — campo de texto reutilizável (label + erro).
- `components/ui/modal.tsx` — passou a aceitar `size` (`md`/`lg`) para formulários mais largos.
- `utils/form.ts` — `emptyToUndefined` (omite campos vazios no payload).
- Modais de formulário: `components/clients/client-form-modal.tsx`, `components/drivers/driver-form-modal.tsx`, `components/trucks/truck-form-modal.tsx`.
- Serviços e hooks de create/update: `createClient`/`updateClient`, `createDriver`/`updateDriver`, `createTruck`/`updateTruck` (+ `useCreateX`/`useUpdateX`).

## Comportamento dos botões

- **Guardar** — submete; em criação fecha o modal, em edição guarda e fecha.
- **Guardar e Continuar** — (apenas em criação) submete e limpa o formulário para novo registo, mantendo o modal aberto.
- **Cancelar** — fecha sem guardar.
- **Limpar** — repõe os valores iniciais (vazios na criação; valores originais na edição).

## Validação & estados

- Validação client-side com Zod (ex.: nome/matrícula obrigatórios, email válido, ano/capacidade numéricos).
- Mensagens de erro por campo (a borda do campo fica vermelha).
- Loading nos botões durante a mutação (TanStack Query); erros do servidor apresentados via toast (`extractErrorMessage`).
- Sucesso invalida a listagem correspondente (a tabela atualiza automaticamente).

## Endpoints consumidos

- Clientes: `POST /clients`, `PATCH /clients/:id`.
- Motoristas: `POST /drivers`, `PATCH /drivers/:id`.
- Camiões: `POST /trucks`, `PATCH /trucks/:id`.

## Integração nas listagens

Os botões "Novo …" (toolbar) e a ação "Editar" (menu de linha) abrem o respetivo modal em modo criação/edição. Substituíram os toasts de "em preparação".

## Verificação

- `pnpm run lint` (web) — sem erros (incl. a regra `react-hooks/refs`: o modo de submissão passou a usar dois handlers `handleSubmit` em vez de um ref).
- `pnpm run build` (web) — compila.
- API validada: `POST /clients` e `POST /trucks` → 201 com os payloads gerados pelos formulários (números convertidos, campos vazios omitidos).

## Próximos passos

- Formulários de **Cargas** (com seleção de cliente) e **Viagens** (seleção de carga/motorista/camião) + fluxo de **Atribuição** (`PATCH /trips/:id/assign-*`).
