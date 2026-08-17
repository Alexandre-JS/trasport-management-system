# SGRTC Web

Frontend Next.js do sistema de gestao de transporte.

## Requisitos

- Node.js `>=20.9.0`
- API disponivel e configurada em `.env.local`

## Desenvolvimento

Crie o ficheiro de ambiente local:

```bash
cp .env.example .env.local
```

Ajuste a origem da API, se necessario:

```env
API_ORIGIN=http://localhost:3000
```

Instale dependencias e rode o servidor:

```bash
npm install
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001).

## Produção

Defina `API_ORIGIN` no ambiente do servidor Web. No Hostinger atual, o pacote
standalone já é construído no GitHub Actions e publicado sem o source.

## Validação local

Antes de publicar, valide o codigo:

```bash
npm run lint
npm run build
```

Rodar o servidor Next em produção:

```bash
PORT=3001 npm run start:prod
```

Este projeto usa `output: "standalone"` no `next.config.ts`. Depois de `npm run build`, o script `postbuild` copia automaticamente `public` e `.next/static` para `.next/standalone`, deixando o pacote pronto para iniciar com `npm start`.

`API_ORIGIN` fica apenas no servidor. A URL usada pelo browser é sempre relativa
(`/api/v1`), e o servidor Next encaminha os pedidos para a API. Assim, o mesmo
build pode ser executado em VPS, Docker, serviços geridos ou hospedagem Node sem
expor a origem interna da API nem depender de CORS no browser.
