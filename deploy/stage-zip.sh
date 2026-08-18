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
# WEB  — o Next build também corre aqui. O zip leva apenas HTML/CSS/JS/imagens
#        de `apps/web/out`; o servidor não recebe source, package.json,
#        node_modules nem arranca qualquer processo Node.
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

  # O motor Rust do Prisma/Tokio cria, por defeito, uma worker thread por CPU
  # visível. Na hospedagem partilhada da Hostinger o processo vê 64 CPUs e
  # reservava 64 threads mesmo em idle, consumindo mais de metade do limite de
  # 120 processos da conta. Quatro workers mantêm boa concorrência de I/O para
  # a API e evitam que a capacidade do servidor físico determine a quota desta
  # aplicação. Removemos um valor antigo para garantir uma única definição.
  sed -i.bak '/^TOKIO_WORKER_THREADS=/d' "$STAGE/.env"
  rm -f "$STAGE/.env.bak"
  printf '\nTOKIO_WORKER_THREADS=%s\n' \
    "${TOKIO_WORKER_THREADS:-4}" >> "$STAGE/.env"

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
  command -v pnpm >/dev/null 2>&1 || {
    echo "ERRO: pnpm é necessário para compilar o Web antes de montar o zip" >&2
    exit 1
  }

  # Pré-compilação no CI/local. NEXT_PUBLIC_API_URL é embutido no JavaScript,
  # porque já não existe servidor Next para encaminhar pedidos same-origin.
  echo "→ A compilar o Web como exportação estática no CI/local…"
  ( cd "$ROOT" && \
    NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.lumactraspots.com/api/v1}" \
    pnpm --filter web build )

  [[ -f "$ROOT/apps/web/out/index.html" ]] || {
    echo "ERRO: o build estático não gerou apps/web/out/index.html" >&2
    exit 1
  }
  [[ -f "$ROOT/apps/web/out/.htaccess" ]] || {
    echo "ERRO: o build estático não incluiu public/.htaccess" >&2
    exit 1
  }

  # O arquivo contém somente o conteúdo pronto para public_html. Assets antigos
  # ainda mantidos no repositório, mas sem referência, são excluídos daqui.
  RUNTIME_STAGE="$(mktemp -d)"
  rsync -a "$ROOT/apps/web/out/" "$RUNTIME_STAGE/"
  rm -f \
    "$RUNTIME_STAGE/Lumac B.png" \
    "$RUNTIME_STAGE/file.svg" \
    "$RUNTIME_STAGE/globe.svg" \
    "$RUNTIME_STAGE/login-bg.jpg" \
    "$RUNTIME_STAGE/lumac-logo.jpeg" \
    "$RUNTIME_STAGE/next.svg" \
    "$RUNTIME_STAGE/vercel.svg" \
    "$RUNTIME_STAGE/window.svg"
  rm -rf "$STAGE"
  STAGE="$RUNTIME_STAGE"

  if find "$STAGE" -type f \( -name package.json -o -name server.js \) | grep -q .; then
    echo "ERRO: o pacote Web contém ficheiros de runtime Node" >&2
    exit 1
  fi
fi

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
(cd "$STAGE" && zip -rq "$OUT" .)
echo "Zip criado: $OUT ($(du -h "$OUT" | cut -f1))"
