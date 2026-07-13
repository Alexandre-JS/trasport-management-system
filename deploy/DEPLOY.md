# Guia de Deploy — SGRTC / LUMAC

> ✅ **PRODUÇÃO ACTUAL (2026-07-11): Hostinger Business (hospedagem partilhada).**
> Ao contrário do que este guia assumia, a hospedagem Node.js partilhada da
> Hostinger suporta esta stack (processos persistentes via Passenger/lsnode e
> WebSocket confirmado a funcionar). O plano VPS abaixo continua válido como
> alternativa, mas **não é o que está em uso**.
>
> - Web: https://lumactraspots.com (Next.js)
> - API: https://api.lumactraspots.com (NestJS, app em `~/domains/lumactraspots.com/nodejs/api`)
> - BD: MySQL `u901633551_lumac` — o `DATABASE_URL` **tem de usar `127.0.0.1`**
>   (com `localhost` o Prisma falha com P1000 por resolver para IPv6)
> - Deploy: zip do source (sem `node_modules`/`dist`) via API/MCP da Hostinger
>   (`hosting_deployJsApplication`). O zip da API inclui um `.env` de produção
>   (cópia em `deploy/.env.api.production`, fora do git) e um
>   `deploy-postbuild.js` que copia o `.env` para `dist/` e cria um shim
>   `dist/main.js` (a Hostinger não copia o `.env` para a raiz da app).
>   O `package.json` do zip acrescenta `postinstall: prisma generate` e o build
>   corre `nest build && prisma migrate deploy && node deploy-postbuild.js`
>   (sem seed — ver a secção de CI/CD).
> - O zip do web inclui `.env` com
>   `NEXT_PUBLIC_API_URL=https://api.lumactraspots.com/api/v1` (inlined no build).
> - **Desde 2026-07-13 o deploy é automático via GitHub Actions** — ver a
>   secção "Deploy automático (CI/CD)" abaixo.

Como hospedar este monorepo. **O app mobile (`apps-mobile/`) NÃO é hospedado
aqui** — ele vai para a **Play Store** (ver a secção final). Só a **API** e o
**web** vão para o servidor.

## Deploy automático (CI/CD via GitHub Actions)

Cada push para **`main`** (e só para `main`) faz deploy automático **só do que
mudou** — trabalhar noutras branches não toca na produção até fazeres merge:

- Mudanças em `apps/api/**` → workflow [deploy-api.yml](../.github/workflows/deploy-api.yml) → api.lumactraspots.com
- Mudanças em `apps/web/**` → workflow [deploy-web.yml](../.github/workflows/deploy-web.yml) → lumactraspots.com
- Mudanças em `apps-mobile/**` → **nada** (vai para a Play Store)

Cada workflow monta o zip com `deploy/stage-zip.sh` e envia com
`deploy/hostinger-deploy.mjs`, que replica o fluxo da API da Hostinger
(upload TUS + trigger do build no servidor) e espera pelo resultado do build.

> ⚠️ **Pegadinha da pasta partilhada**: no servidor, o web instala na raiz de
> `~/domains/lumactraspots.com/nodejs/` e a API em `nodejs/api/`. O deploy do
> **web limpa a raiz inteira**, apagando os ficheiros da API (a app pode
> continuar a servir a partir da memória até ao próximo restart — e aí dá 503).
> Por isso o workflow do web **redeploya sempre a API no fim**. O deploy da API
> não afeta o web. Diagnóstico: workflow manual "Debug Hostinger"
> ([hostinger-debug.yml](../.github/workflows/hostinger-debug.yml)) lê logs de
> build e corre comandos de leitura no servidor via cron temporário.

**Secrets necessários no GitHub** (Settings → Secrets and variables → Actions):

| Secret | Conteúdo |
|--------|----------|
| `HOSTINGER_API_TOKEN` | Token da API da Hostinger (hPanel → perfil → **API** → criar token) |
| `API_ENV_PRODUCTION` | Conteúdo completo do ficheiro `deploy/.env.api.production` |

**Deploy manual** (sem CI), a partir da raiz do repo:

```bash
# API
bash deploy/stage-zip.sh api
HOSTINGER_API_TOKEN=… node deploy/hostinger-deploy.mjs api.lumactraspots.com deploy/dist-zips/api.zip

# Web
bash deploy/stage-zip.sh web
HOSTINGER_API_TOKEN=… node deploy/hostinger-deploy.mjs lumactraspots.com deploy/dist-zips/web.zip
```

Também dá para disparar qualquer um dos workflows à mão no GitHub
(Actions → workflow → *Run workflow*). O build da API corre
`prisma migrate deploy` no servidor — migrations novas são aplicadas
automaticamente (nunca apaga dados; cuidado apenas ao escrever migrations
destrutivas). O `prisma db seed` **não** corre no deploy desde 2026-07-13:
só era preciso no primeiro arranque e, com dados reais na base, recriaria
os registos de demonstração apagados. Para o correr de propósito:
`pnpm --filter api exec prisma db seed`.

## O que corre no servidor

| App | Stack | Porta | Precisa de |
|-----|-------|-------|------------|
| `apps/api` | NestJS + WebSocket | 3000 | Node persistente + MySQL |
| `apps/web` | Next.js (SSR) | 3001 | Node persistente |
| `apps-mobile` | Ionic/Capacitor | — | **Não vai para o servidor** (Play Store) |

> O `apps-mobile/` está fora do workspace pnpm (só `apps/*` e `packages/*`), por
> isso `pnpm install` e `pnpm build` **já ignoram o mobile** automaticamente.

---

## Por que VPS (e não hospedagem partilhada)

Esta stack tem **dois processos Node persistentes** e usa **WebSocket** (rastreio
em tempo real). Hospedagem partilhada (cPanel) costuma bloquear WebSocket e
dificulta manter processos Node vivos. Num **VPS** (Ubuntu, com SSH) tens controlo
total: `git pull` + `pm2` + `nginx` + `certbot`. Serve qualquer provedor
(DigitalOcean, Hetzner, Contabo, Vultr…).

---

## 0. Específico do Hostinger

Usa um plano **Hostinger VPS (KVM)** — **não** a hospedagem partilhada "Node.js"
(esta não suporta processos Node persistentes, portas personalizadas nem
WebSocket, que esta app precisa). KVM 1 chega para testes; **KVM 2 (2 vCPU / 8 GB)**
é o recomendado para produção pequena.

Ao criar o VPS no hPanel, escolhe o **template de 1 clique com Node.js**
(Ubuntu + Node.js): já traz **PM2, Nginx e Certbot instalados** → podes **saltar
o passo 1**. Depois liga-te por SSH (dados no hPanel) e continua no passo 2.

Se escolheste um Ubuntu "limpo" (sem template), faz o passo 1 manualmente.

## 1. Preparar o VPS (uma vez — saltar se usaste o template Node.js do Hostinger)

Ubuntu 22.04+. Via SSH como root (ou com `sudo`):

```bash
# Node 20 LTS (o template do Hostinger já traz Node — confirma com `node -v`)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx

# pnpm + pm2
npm install -g pnpm@10 pm2

# MySQL (ou MariaDB)
apt-get install -y mysql-server
mysql_secure_installation
```

## 2. Criar a base de dados

```bash
mysql -u root -p
```
```sql
CREATE DATABASE lumac CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lumac'@'localhost' IDENTIFIED BY 'UMA_SENHA_FORTE';
GRANT ALL PRIVILEGES ON lumac.* TO 'lumac'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. Clonar o repositório

```bash
cd /var/www
git clone SEU_REPO_GIT lumac
cd lumac
```

## 4. Variáveis de ambiente

**API** — criar `apps/api/.env` (baseado em `apps/api/.env.example`):

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
DATABASE_URL="mysql://lumac:UMA_SENHA_FORTE@localhost:3306/lumac"

# GERAR SECRETS FORTES (a app recusa arrancar em produção com 'change-me'):
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_ACCESS_SECRET=COLE_UM_SECRET_FORTE_AQUI
JWT_REFRESH_SECRET=COLE_OUTRO_SECRET_FORTE_AQUI
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Domínio(s) do web em produção (separados por vírgula). Sem isto o browser bloqueia.
CORS_ORIGIN=https://app.SEU-DOMINIO.com
```

**WEB** — criar `apps/web/.env` (baseado em `apps/web/.env.example`):

> ⚠️ O Next.js **injeta as `NEXT_PUBLIC_*` no momento do build**. Define isto
> **antes** de `pnpm build`, senão o web aponta para localhost.

```env
NEXT_PUBLIC_API_URL=https://api.SEU-DOMINIO.com/api/v1
```

## 5. Instalar, migrar e construir

```bash
pnpm install --frozen-lockfile

# Aplicar o schema na base (produção usa migrate deploy, nunca dev):
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma generate

# Criar o super admin + roles (só na primeira vez):
pnpm --filter api exec prisma db seed

# Build da API (dist/) e do web (.next/) — o mobile é ignorado:
pnpm build
```

Credenciais iniciais do seed: **`admin@sgrtc.local` / `Admin@12345`**
→ **troca a senha no primeiro login.**

## 6. Arrancar com PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup      # segue a instrução impressa para arrancar no boot
```
Verificar: `pm2 status` e `pm2 logs`.

## 7. Nginx + HTTPS

```bash
cp deploy/nginx.conf.example /etc/nginx/sites-available/lumac
# edita e substitui SEU-DOMINIO.com pelos teus domínios (api.* e app.*)
ln -s /etc/nginx/sites-available/lumac /etc/nginx/sites-enabled/lumac
nginx -t && systemctl reload nginx

# HTTPS grátis (aponta os DNS A dos subdomínios para o IP do VPS antes):
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.SEU-DOMINIO.com -d app.SEU-DOMINIO.com
```

---

## Atualizações (a cada nova versão)

```bash
cd /var/www/lumac
git pull
pnpm install --frozen-lockfile
pnpm --filter api exec prisma migrate deploy   # se houver novas migrations
pnpm build
pm2 reload deploy/ecosystem.config.js          # reinício sem downtime
```

---

## Mobile → Play Store (separado do servidor)

O app do motorista **não** vai para o VPS. Fluxo próprio:

1. Definir a API de produção em `apps-mobile/src/environments/environment.prod.ts`
   (`apiBaseUrl: 'https://api.SEU-DOMINIO.com/api/v1'`).
2. `cd apps-mobile && pnpm install && pnpm build`
3. `npx cap sync android`
4. Abrir no Android Studio (`npx cap open android`), gerar o **AAB assinado** e
   publicar na Play Console.

> Como o mobile é nativo (Capacitor), **não passa por CORS** — não precisa de
> entrar em `CORS_ORIGIN`. Só o domínio do **web** entra lá.

---

## Checklist de produção

- [ ] `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` fortes e únicos (não `change-me`).
- [ ] `CORS_ORIGIN` com o domínio real do web (https).
- [ ] `NEXT_PUBLIC_API_URL` definida **antes** do `pnpm build` do web.
- [ ] Base de dados com `utf8mb4` / `utf8mb4_unicode_ci`.
- [ ] Senha do super admin trocada após o primeiro login.
- [ ] HTTPS ativo (certbot) nos dois domínios.
- [ ] `pm2 save` + `pm2 startup` feitos (sobrevive a reboot).
- [ ] Backups automáticos do MySQL agendados (ex.: `mysqldump` diário via cron).
```
