# Guia de Deploy — SGRTC / LUMAC

> ✅ **ARQUITETURA PREPARADA EM 2026-08-18: Hostinger Business (hospedagem partilhada).**
> Ao contrário do que este guia assumia, a hospedagem Node.js partilhada da
> Hostinger suporta esta stack (processos persistentes via Passenger/lsnode e
> WebSocket confirmado a funcionar). O plano VPS abaixo continua válido como
> alternativa, mas **não é o que está em uso**.
>
> - Web: https://lumactraspots.com (exportação estática do Next.js, sem Node)
> - API: https://api.lumactraspots.com (NestJS, app em `~/domains/lumactraspots.com/nodejs/api`)
> - BD: MySQL `u901633551_lumac` — o `DATABASE_URL` **tem de usar `127.0.0.1`**
>   (com `localhost` o Prisma falha com P1000 por resolver para IPv6)
> - Deploy: artefactos de runtime via API da Hostinger
>   (`hosting_deployJsApplication`). O zip da API inclui um `.env` de produção
>   (cópia em `deploy/.env.api.production`, fora do git) e um
>   `deploy-postbuild.js` que copia o `.env` para `dist/` e cria um shim
>   `dist/main.js` (a Hostinger não copia o `.env` para a raiz da app).
>   A API é compilada no GitHub; o servidor só instala dependências de runtime,
>   executa `prisma generate`, verifica a integridade das migrations e cria o
>   shim. Num push normal apenas consulta `prisma migrate status` (sem escrever
>   na base); migrations só são aplicadas no fluxo manual protegido (sem seed).
> - **Web: totalmente estático**. O `stage-zip.sh web` corre `next build` no
>   GitHub e empacota somente `apps/web/out` (HTML, CSS, JavaScript e imagens).
>   O endpoint de website estático da Hostinger substitui `public_html` sem
>   instalar dependências, executar build ou arrancar Node/Passenger. O
>   `NEXT_PUBLIC_API_URL` aponta diretamente para a API pública.
> - **Desde 2026-07-13 o deploy é automático via GitHub Actions** — ver a
>   secção "Deploy automático (CI/CD)" abaixo.

Como hospedar este monorepo. **O app mobile (`apps-mobile/`) NÃO é hospedado
aqui** — ele vai para a **Play Store** (ver a secção final). Só a **API** e o
**web** vão para o servidor.

## Deploy automático (CI/CD via GitHub Actions)

Cada push para **`main`** (e só para `main`) passa por um único workflow. Outras
branches não tocam na produção até fazer merge:

- Mudanças em `apps/web/**` → valida e publica apenas o Web estático.
- Mudanças em `apps/api/**` → publica a API e republica o Web estático por
  último, protegendo o `public_html` do domínio principal.
- Mudanças em `apps-mobile/**` → **nada** (vai para a Play Store)

O workflow [deploy-production.yml](../.github/workflows/deploy-production.yml)
instala, valida, testa e compila no GitHub. Só depois monta os ZIPs com
`deploy/stage-zip.sh`. A API usa `deploy/hostinger-deploy.mjs` (upload TUS +
runtime Node); o Web usa `deploy/hostinger-static-deploy.mjs` (upload TUS +
extração direta em `public_html`). API, CORS e Web são verificados por HTTP no
fim; deploys concorrentes entram numa fila única.

> ⚠️ **Aplicações relacionadas na Hostinger**: `api.lumactraspots.com` está
> registado como subdomínio da mesma website/conta de `lumactraspots.com`, não
> como uma segunda website isolada. Em 2026-08-17 ficou comprovado que publicar
> a API por último fazia o domínio principal arrancar o NestJS: `/login`
> devolvia `Cannot GET /login`. Por isso, sempre que a API muda, o workflow
> publica **API primeiro e Web estático por último** e só termina se API direta,
> CORS e `/login` passarem nos testes externos. Diagnóstico: workflow manual "Debug Hostinger"
> ([hostinger-debug.yml](../.github/workflows/hostinger-debug.yml)) lê logs de
> build e corre comandos de leitura no servidor via cron temporário.
>
> **Limite de processos**: a API define `TOKIO_WORKER_THREADS=4` no artefacto
> de produção. Sem este limite, o motor Rust do Prisma detetava os 64 CPUs do
> servidor Hostinger partilhado e criava 64 workers inativos, fazendo a API
> ocupar 76 threads e aproximando a conta do limite de 120 processos. O valor
> pode ser ajustado no CI com `TOKIO_WORKER_THREADS`, mas não deve ser removido
> neste tipo de alojamento.

**Secrets necessários no GitHub** (Settings → Secrets and variables → Actions):

| Secret | Conteúdo |
|--------|----------|
| `HOSTINGER_API_TOKEN` | Token da API da Hostinger (hPanel → perfil → **API** → criar token) |
| `API_ENV_PRODUCTION` | Conteúdo completo do ficheiro `deploy/.env.api.production` |

**Deploy manual** (sem CI), a partir da raiz do repo:

```bash
# API primeiro
bash deploy/stage-zip.sh api
# Se existir migration pendente, criar primeiro o backup no hPanel e usar esta
# linha no lugar da anterior para montar o pacote no modo protegido:
# APPLY_DATABASE_MIGRATIONS=true bash deploy/stage-zip.sh api
HOSTINGER_API_TOKEN=… node deploy/hostinger-deploy.mjs api.lumactraspots.com deploy/dist-zips/api.zip

# Web estático sempre por último para restaurar public_html
bash deploy/stage-zip.sh web
HOSTINGER_API_TOKEN=… node deploy/hostinger-static-deploy.mjs \
  lumactraspots.com deploy/dist-zips/web.zip
```

Também dá para disparar o workflow à mão no GitHub
(Actions → Deploy Production → *Run workflow*) e escolher `all`, `api` ou `web`.
Num push normal, a API corre apenas `prisma migrate status`: o deploy **não
altera a base de dados** e falha de forma segura se existir uma migration
pendente. Para aplicar uma migration, primeiro cria um backup manual no hPanel,
espera que termine e depois executa o workflow manual marcando
`database_backup_confirmed`.

O `prisma db seed` **não** corre no deploy desde 2026-07-13: só era preciso no
primeiro arranque e, com dados reais na base, recriaria os registos de
demonstração apagados. Nunca use `migrate reset`, `db push` ou `db seed` em
produção.

## Proteção dos dados durante deploy

O deploy tem quatro barreiras:

1. `deploy/check-migration-safety.cjs` bloqueia `DROP`, `TRUNCATE`, `DELETE`,
   `UPDATE`, `REPLACE`, mudanças de colunas existentes e alterações às
   migrations históricas. A mesma validação corre no GitHub e novamente no
   servidor antes do Prisma.
2. Pushes automáticos nunca aplicam migrations. Apenas um workflow manual com
   o campo `database_backup_confirmed` marcado pode executar
   `prisma migrate deploy`.
3. O pacote de produção não contém os ficheiros de seed e não chama
   `migrate reset` nem `db push`.
4. O Web substitui `public_html`, mas essa pasta contém **somente artefactos
   estáticos descartáveis**. Dados, utilizadores, viagens e documentos POD
   ficam no MySQL; nunca devem ser guardados manualmente em `public_html`.

Ao criar uma migration nova, use apenas operações aditivas (`CREATE TABLE`,
`ADD COLUMN`, `CREATE INDEX`, etc.). Registe o caminho e o SHA-256 em
`LOCKED_MIGRATIONS` no verificador. O hash torna o ficheiro imutável. Se uma
mudança realmente exigir transformar ou remover dados, ela não pertence ao
deploy automático: deve ter script manual, backup concluído, validação de
contagens e plano de restauro.

No plano Business, o backup manual é criado em **hPanel → Websites → Dashboard
→ Backups → Create backup**. Confirme a data/hora e aguarde a conclusão antes
de marcar o campo no GitHub Actions.

## O que corre no servidor

| App | Stack | Porta | Precisa de |
|-----|-------|-------|------------|
| `apps/api` | NestJS + WebSocket | 3000 | Node persistente + MySQL |
| `apps/web` | Next.js exportado | — | Ficheiros estáticos em `public_html` |
| `apps-mobile` | Ionic/Capacitor | — | **Não vai para o servidor** (Play Store) |

> O `apps-mobile/` está fora do workspace pnpm (só `apps/*` e `packages/*`), por
> isso `pnpm install` e `pnpm build` **já ignoram o mobile** automaticamente.

---

## Alternativa futura: VPS

Esta arquitetura tem **um único processo Node persistente**, a API, que também
mantém o WebSocket. O Web é servido como ficheiros estáticos. O plano Business
atual suporta esta configuração; um VPS daria mais controlo, mas não é
necessário para este deploy.

---

## 0. Específico do Hostinger

Esta secção fica apenas como referência para uma eventual migração futura para
um plano **Hostinger VPS (KVM)**. Não se aplica ao servidor Business atual.

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
node deploy/check-migration-safety.cjs
pnpm --filter api exec prisma migrate deploy  # somente depois de backup
pnpm --filter api exec prisma generate

# Criar o super admin + roles (só na primeira vez):
pnpm --filter api exec prisma db seed

# Build da API (dist/) e do Web estático (out/) — o mobile é ignorado:
NEXT_PUBLIC_API_URL=https://api.SEU-DOMINIO.com/api/v1 pnpm build
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
node deploy/check-migration-safety.cjs
pnpm --filter api exec prisma migrate deploy   # só após backup, se necessário
NEXT_PUBLIC_API_URL=https://api.SEU-DOMINIO.com/api/v1 pnpm build
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
