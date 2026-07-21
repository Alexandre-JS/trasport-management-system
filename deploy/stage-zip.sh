#!/usr/bin/env bash
# Monta o zip de deploy da API ou do web para a Hostinger (hospedagem partilhada).
#
# Uso:
#   deploy/stage-zip.sh api [saida.zip]
#   deploy/stage-zip.sh web [saida.zip]
#
# API  — o zip leva o source (sem node_modules/dist), um `.env` de produção
#        (de $API_ENV_PRODUCTION no CI, ou de deploy/.env.api.production local),
#        o deploy-postbuild.js e um package.json com `postinstall`/`build`
#        ajustados para o build no servidor (prisma generate/migrate/seed + shim).
# WEB  — o zip leva o source e um `.env` com NEXT_PUBLIC_API_URL (inlined no
#        `next build` que corre no servidor).
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
  --exclude coverage --exclude '.env' --exclude '.env.*' --exclude .DS_Store

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

  node -e '
    const fs = require("fs");
    const file = process.argv[1] + "/package.json";
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    pkg.scripts.postinstall = "prisma generate";
    // sem "prisma db seed": só era preciso no primeiro arranque — com dados
    // reais na base, o seed recriaria os registos de demonstração apagados
    pkg.scripts.build =
      "nest build && prisma migrate deploy && node deploy-postbuild.js";
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  ' "$STAGE"
else
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

  # O standalone é auto-suficiente (traz o seu próprio node_modules). Remove-se
  # o node_modules e a cache de build, e esvaziam-se as deps/scripts para o
  # servidor NÃO reinstalar nem recompilar — só arranca o standalone.
  rm -rf "$STAGE/node_modules" "$STAGE/.next/cache"
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
