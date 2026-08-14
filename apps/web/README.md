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
NEXT_PUBLIC_API_URL=/api/v1
```

Instale dependencias e rode o servidor:

```bash
npm install
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001).

## Produção no Vercel

Ao importar o repositório no Vercel, configure:

```text
Framework Preset: Next.js
Root Directory: apps/web
Node.js: 20.x
```

Adicione a variável de ambiente para Production, Preview e Development:

```env
API_ORIGIN=https://api.lumactraspots.com
```

O browser chama `/api/v1` no mesmo domínio da Web. O rewrite definido em
`next.config.ts` encaminha esses pedidos para a API na Hostinger, evitando
dependência de CORS e permitindo testar os deployments de preview do Vercel.

Não coloque `DATABASE_URL`, segredos JWT ou credenciais da Hostinger no projeto
Vercel. Esses valores pertencem exclusivamente à API.

Depois do primeiro deployment, associe `lumactraspots.com` e
`www.lumactraspots.com` em **Settings → Domains**. Só altere o DNS depois de o
deployment `*.vercel.app` estar operacional.

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

`API_ORIGIN` fica apenas no servidor. A URL pública usada pelo browser permanece
relativa (`/api/v1`) e, por isso, não precisa ser reconstruída quando o domínio
do frontend muda.
