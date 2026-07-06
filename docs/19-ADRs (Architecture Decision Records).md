# 19 - ADRs (Architecture Decision Records)

## ADR-001 - Monorepo

Decisão: organizar o projeto como monorepo.

Contexto: o sistema possui painel administrativo, app mobile, backend e pacotes partilhados.

Consequência: facilita partilha de tipos, configurações e scripts.

## ADR-002 - Backend com NestJS

Decisão: usar NestJS no backend.

Contexto: o domínio possui módulos claros e precisa de API REST, WebSocket, autenticação e validação.

Consequência: estrutura modular e adequada a aplicações empresariais.

## ADR-003 - Frontend administrativo com Next.js

Decisão: usar Next.js no painel administrativo.

Contexto: o painel precisa de rotas, formulários, tabelas, dashboard e boa experiência web.

Consequência: permite evolução organizada do frontend administrativo.

## ADR-004 - App do motorista com Ionic + Angular

Decisão: usar Ionic + Angular para o app do motorista.

Contexto: o motorista precisa de app mobile com GPS, câmera e operação em campo.

Consequência: permite entregar app multiplataforma com acesso a recursos do dispositivo.
