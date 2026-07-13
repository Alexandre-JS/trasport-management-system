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
  printf 'NEXT_PUBLIC_API_URL=%s\n' \
    "${NEXT_PUBLIC_API_URL:-https://api.lumactraspots.com/api/v1}" > "$STAGE/.env"
fi

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
(cd "$STAGE" && zip -rq "$OUT" .)
echo "Zip criado: $OUT ($(du -h "$OUT" | cut -f1))"
