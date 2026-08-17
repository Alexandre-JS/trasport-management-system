#!/usr/bin/env bash
# Monta o zip de deploy da API ou do web para a Hostinger (hospedagem partilhada).
#
# Uso:
#   deploy/stage-zip.sh api [saida.zip]
#   deploy/stage-zip.sh web [saida.zip]
#
# API  — a compilação NestJS corre aqui (normalmente no GitHub Actions). O zip
#        leva apenas dist/, Prisma, dependências de runtime e o `.env` de
#        produção. Na Hostinger só correm npm install, prisma generate/migrate
#        e o pequeno shim exigido pelo Passenger — nunca TypeScript/Nest build.
# WEB  — o Next build também corre aqui. O zip leva apenas o standalone já
#        pronto; o servidor não recebe source nem instala dependências.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-}"
OUT="${2:-$ROOT/deploy/dist-zips/$APP.zip}"

if [[ "$APP" != "api" && "$APP" != "web" ]]; then
  echo "Uso: deploy/stage-zip.sh <api|web> [saida.zip]" >&2
  exit 1
fi
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

rsync -a "$ROOT/apps/$APP/" "$STAGE/" \
  --exclude node_modules --exclude dist --exclude .next --exclude .turbo \
  --exclude coverage --exclude '.env' --exclude '.env.*' --exclude .DS_Store \
  --exclude .git --exclude '.git-*' --exclude '*.zip' --exclude '*.tsbuildinfo'

if [[ "$APP" == "api" ]]; then
  if [[ -n "${API_ENV_PRODUCTION:-}" ]]; then
    printf '%s\n' "$API_ENV_PRODUCTION" > "$STAGE/.env"
  elif [[ -f "$ROOT/deploy/.env.api.production" ]]; then
    cp "$ROOT/deploy/.env.api.production" "$STAGE/.env"
  else
    echo "ERRO: define API_ENV_PRODUCTION ou cria deploy/.env.api.production" >&2
    exit 1
  fi

  cp "$ROOT/deploy/deploy-postbuild.js" "$STAGE/deploy-postbuild.js"

  command -v pnpm >/dev/null 2>&1 || {
    echo "ERRO: pnpm é necessário para compilar a API antes de montar o zip" >&2
    exit 1
  }

  echo "→ A compilar a API no CI/local (sem build NestJS no servidor)…"
  ( cd "$ROOT" && pnpm --filter api build )
  rsync -a "$ROOT/apps/api/dist/" "$STAGE/dist/" \
    --exclude '*.map' --exclude '*.d.ts' --exclude '*.tsbuildinfo'

  # O runtime não precisa do source TypeScript, testes, ferramentas de lint ou
  # configurações do compilador. Mantemos prisma/schema.prisma + migrations.
  rm -rf \
    "$STAGE/src" \
    "$STAGE/test" \
    "$STAGE/node_modules" \
    "$STAGE/coverage" \
    "$STAGE/.turbo"
  rm -f \
    "$STAGE/eslint.config.mjs" \
    "$STAGE/nest-cli.json" \
    "$STAGE/tsconfig.json" \
    "$STAGE/tsconfig.build.json" \
    "$STAGE/.prettierrc" \
    "$STAGE/README.md" \
    "$STAGE/prisma/seed.ts" \
    "$STAGE/prisma/demo-seed.ts"

  node -e '
    const fs = require("fs");
    const file = process.argv[1] + "/package.json";
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    // O CLI Prisma é necessário em runtime apenas para generate/migrate. Todo
    // o restante conjunto de devDependencies (Nest CLI, TS, ESLint, Jest) sai.
    pkg.dependencies.prisma = pkg.devDependencies.prisma;
    pkg.scripts = {
      postinstall: "prisma generate",
      build: "prisma migrate deploy && node deploy-postbuild.js",
      start: "node dist/main.js",
    };
    delete pkg.devDependencies;
    delete pkg.jest;
    delete pkg.prisma;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  ' "$STAGE"
else
  # Assets antigos sem qualquer referência no Web. Permanecem no repositório
  # por enquanto, mas não entram no build/runtime publicado na Hostinger.
  rm -f \
    "$STAGE/public/Lumac B.png" \
    "$STAGE/public/file.svg" \
    "$STAGE/public/globe.svg" \
    "$STAGE/public/login-bg.jpg" \
    "$STAGE/public/lumac-logo.jpeg" \
    "$STAGE/public/next.svg" \
    "$STAGE/public/vercel.svg" \
    "$STAGE/public/window.svg"

  # NEXT_PUBLIC_* é embutido no next build — tem de existir ANTES de compilar.
  printf 'NEXT_PUBLIC_API_URL=%s\n' \
    "${NEXT_PUBLIC_API_URL:-https://api.lumactraspots.com/api/v1}" > "$STAGE/.env"

  # Pré-compilação no CI (não no servidor). Esta cópia isolada de apps/web não
  # tem o pnpm-workspace, por isso o Next produz o standalone "flat"
  # (.next/standalone/server.js) — exatamente o artefacto que o build que antes
  # corria no servidor produzia. Assim o alojamento partilhado deixa de gastar
  # CPU/RAM/E-S com o `next build` (a causa dos picos de recursos).
  echo "→ A compilar o web (next build standalone) no CI…"
  ( cd "$STAGE" && npm install --no-audit --no-fund --loglevel=error && npm run build )

  # Cria um pacote novo apenas com o standalone. O source, o node_modules usado
  # para compilar e a cache nunca chegam ao servidor.
  RUNTIME_STAGE="$(mktemp -d)"
  mkdir -p "$RUNTIME_STAGE/.next"
  rsync -a "$STAGE/.next/standalone/" "$RUNTIME_STAGE/.next/standalone/"
  cp "$STAGE/package.json" "$RUNTIME_STAGE/package.json"
  rm -rf "$STAGE"
  STAGE="$RUNTIME_STAGE"

  node -e '
    const fs = require("fs");
    const file = process.argv[1] + "/package.json";
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    pkg.scripts = {
      build: "echo \"web pré-compilado no CI — sem build no servidor\"",
      start: "node .next/standalone/server.js",
    };
    pkg.dependencies = {};
    pkg.devDependencies = {};
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  ' "$STAGE"
fi

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
(cd "$STAGE" && zip -rq "$OUT" .)
echo "Zip criado: $OUT ($(du -h "$OUT" | cut -f1))"
