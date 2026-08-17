# Deploy portátil — API + Web

Esta configuração não depende de Vercel ou Hostinger. Requer Node.js 20.9+, pnpm,
uma base MySQL e, em VPS, PM2 + Nginx.

## Contrato entre os serviços

- API NestJS: porta `3000`, prefixo `/api/v1`.
- Web Next.js: porta `3001`.
- O browser chama sempre `/api/v1` na mesma origem da Web.
- `API_ORIGIN` é privada e diz ao Next onde está a API.
- Nginx pode encaminhar `/api/` diretamente para a API, evitando um salto.

Isso mantém links públicos como `/track/{token}` válidos em qualquer domínio e
evita problemas de CORS e variáveis públicas antigas.

## Build

```bash
pnpm install --frozen-lockfile
pnpm --filter api exec prisma generate
API_ORIGIN=http://127.0.0.1:3000 pnpm build
pnpm --filter api exec prisma migrate deploy
```

Para API e Web em servidores diferentes, defina `API_ORIGIN` com a URL privada
ou HTTPS alcançável pela Web **antes do build**.

## Execução com PM2

Crie `apps/api/.env` com os segredos de produção e a ligação MySQL. Depois:

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 status
```

Copie `deploy/nginx.conf.example`, substitua os domínios, valide com `nginx -t`
e ative HTTPS. Não exponha diretamente as portas 3000 e 3001 à Internet.

## Capacidade e segurança

- O rate limit global separa sessões autenticadas por token.
- Login é limitado por conta e refresh por sessão.
- Tracking público é limitado por token opaco da carga.
- PM2 reinicia processos em caso de falha ou excesso de memória.
- Para várias instâncias da API em paralelo, use armazenamento de rate limit e
  adapter Socket.IO compartilhados (por exemplo Redis) antes de ativar cluster.
