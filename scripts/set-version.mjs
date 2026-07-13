#!/usr/bin/env node
// Sincroniza a versão de lançamento em todas as apps do monorepo (api, web, mobile).
// Uso: pnpm version:set 1.2.3
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('Uso: pnpm version:set <x.y.z>  (ex.: pnpm version:set 0.2.0)');
  process.exit(1);
}

const packageFiles = [
  'package.json',
  'apps/api/package.json',
  'apps/web/package.json',
  'apps-mobile/package.json',
];

for (const file of packageFiles) {
  const path = join(root, file);
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  pkg.version = version;
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`✓ ${file} → ${version}`);
}

const banner =
  '// Gerado por scripts/set-version.mjs — não editar à mão; corra "pnpm version:set <x.y.z>".\n';
const versionFiles = [
  'apps/api/src/version.ts',
  'apps/web/version.ts',
  'apps-mobile/src/environments/version.ts',
];

for (const file of versionFiles) {
  writeFileSync(
    join(root, file),
    `${banner}export const APP_VERSION = '${version}';\n`,
  );
  console.log(`✓ ${file} → ${version}`);
}

console.log(`\nVersão ${version} sincronizada. Próximos passos:`);
console.log(`  git add -A && git commit -m "chore(release): v${version}"`);
console.log(`  git tag v${version} && git push && git push --tags`);
