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

Ajuste a URL da API, se necessario:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Instale dependencias e rode o servidor:

```bash
npm install
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001).

## Producao

Antes de publicar, valide o codigo:

```bash
npm run lint
npm run build
```

Rodar o servidor Next em producao:

```bash
PORT=3001 npm run start:prod
```

Este projeto usa `output: "standalone"` no `next.config.ts`. Depois de `npm run build`, o script `postbuild` copia automaticamente `public` e `.next/static` para `.next/standalone`, deixando o pacote pronto para iniciar com `npm start`.

Defina `NEXT_PUBLIC_API_URL` com a URL publica final da API antes de rodar `npm run build`, porque variaveis `NEXT_PUBLIC_*` sao embutidas no bundle do navegador durante o build.
