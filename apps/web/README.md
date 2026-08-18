# SGRTC Web

Frontend Next.js do sistema de gestão de transporte, exportado como ficheiros
estáticos para produção.

## Requisitos

- Node.js `>=20.9.0`
- API disponivel e configurada em `.env.local`

## Desenvolvimento

Crie o ficheiro de ambiente local:

```bash
cp .env.example .env.local
```

Ajuste a URL pública da API, se necessário:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Instale dependencias e rode o servidor:

```bash
npm install
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001).

## Produção

Defina `NEXT_PUBLIC_API_URL` **durante o build**. O valor é incorporado no
JavaScript e deve ser uma URL HTTPS autorizada no `CORS_ORIGIN` da API:

```bash
NEXT_PUBLIC_API_URL=https://api.exemplo.com/api/v1 npm run build
```

O resultado fica em `out/`. Publique apenas o conteúdo dessa pasta no diretório
público do servidor. Não envie source, `node_modules`, `.next`, `package.json`
ou `server.js`, e não arranque um processo Node para o Web.

## Validação local

Antes de publicar, valide o codigo:

```bash
npm run lint
npm run build
```

O servidor estático deve preservar URLs com barra final e encaminhar
`/track/*`, `/portal/*` e `/viagens/*` para o `index.html` da respetiva pasta.
Na Hostinger/Apache essas regras já seguem no ficheiro `public/.htaccess`; o
exemplo Nginx equivalente está em `deploy/nginx.conf.example`.
