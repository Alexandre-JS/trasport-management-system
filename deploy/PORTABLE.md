# Deploy portátil — API + Web

Esta configuração não depende de Vercel ou Hostinger. Requer Node.js 20.9+ e
pnpm apenas para compilar, uma base MySQL e, em VPS, PM2 + Nginx.

## Contrato entre os serviços

- API NestJS: porta `3000`, prefixo `/api/v1`.
- Web Next.js: ficheiros estáticos em `apps/web/out`, sem porta ou processo.
- O browser chama `NEXT_PUBLIC_API_URL` diretamente.
- A API deve autorizar o domínio do Web em `CORS_ORIGIN`.

Isso mantém links públicos como `/track/{token}` válidos em qualquer domínio e
reduz o consumo do servidor a um único processo Node.

## Build

```bash
pnpm install --frozen-lockfile
pnpm --filter api exec prisma generate
NEXT_PUBLIC_API_URL=https://api.SEU-DOMINIO.com/api/v1 pnpm build
pnpm --filter api exec prisma migrate deploy
```

Defina `NEXT_PUBLIC_API_URL` com a URL HTTPS alcançável pelo navegador **antes
do build**. Publique apenas o conteúdo de `apps/web/out` no servidor estático.

## Execução com PM2

Crie `apps/api/.env` com os segredos de produção e a ligação MySQL. Depois:

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 status
```

Copie `deploy/nginx.conf.example`, substitua os domínios e o caminho do projeto,
valide com `nginx -t` e ative HTTPS. Não exponha a porta 3000 diretamente à
Internet.

## Capacidade e segurança

- O rate limit global separa sessões autenticadas por token.
- Login é limitado por conta e refresh por sessão.
- Tracking público é limitado por token opaco da carga.
- PM2 reinicia processos em caso de falha ou excesso de memória.
- Para várias instâncias da API em paralelo, use armazenamento de rate limit e
  adapter Socket.IO compartilhados (por exemplo Redis) antes de ativar cluster.
