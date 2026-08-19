#!/usr/bin/env node
"use strict";

/**
 * Protege os dados de produção contra migrations acidentalmente destrutivas.
 *
 * - As migrations que já existiam quando esta proteção foi introduzida são
 *   imutáveis: apagar ou alterar uma delas bloqueia o deploy.
 * - Migrations novas podem criar/adicionar estruturas, mas não podem apagar ou
 *   sobrescrever dados. Alterações destrutivas exigem um procedimento manual,
 *   separado do deploy da aplicação e precedido por backup.
 *
 * O script funciona tanto no repositório como dentro do ZIP runtime da API.
 */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const LOCKED_MIGRATIONS = Object.freeze({
  "20260708085805_init_mysql/migration.sql":
    "5d0388c82968a9d51d4cd1eccc02a8063b93a0c8c5964c1fba76d1fe01f007fb",
  "20260713124919_borders_and_trip_borders/migration.sql":
    "ce041e05396336a94adab969fad30c9bc305472f14c136524974bbd3c8fe8d9e",
  "20260714084449_tracking_trip_recorded_index/migration.sql":
    "60c797cd4eb240b8fc72f040b22db01224ac0be99a80b8376184538ab3f8c0d3",
  "20260714172527_cargo_type_container_tonnes/migration.sql":
    "ab42cf26519cb8bf3618b6b5187175c9c1b5d92b5641ca9aa6b76a5566776b39",
  "20260714173716_delivery_pod_and_container_return/migration.sql":
    "dcf75952d0858f46dd5f87a72e265014ca49ae891c5dfd6f793aaec37af0ea20",
  "20260715113000_add_operational_board_fields/migration.sql":
    "984924068488b4942dd7173771667752efdb9beef04b93df5fd0e529442e2e04",
  "20260715142436_trip_optional_own_resources/migration.sql":
    "25deb03638cd689b7181471ab30e9c6346df4a10713fa34228283a660143701e",
  "20260716121928_cargo_type_geral/migration.sql":
    "d0376ad80f6ac2f11019ab7a46f558168507463f4179664067c676f835e6a68d",
  "20260716143000_backfill_operational_resources/migration.sql":
    "1205f34e6ad37d1bbaf5ea502b42c89800cc5a862ea2956cecef6da7b28868d8",
  "20260720100000_client_public_share_token/migration.sql":
    "06479d81aa6162be92899c80a668e397ef51a0288c0d03da66d7aac72e509845",
});

// Estas migrations já tinham sido aplicadas antes da introdução da proteção.
// A exceção é segura apenas porque o hash acima impede qualquer alteração.
// Nunca acrescente migrations novas a esta lista.
const HISTORICAL_DESTRUCTIVE_EXCEPTIONS = new Set([
  "20260713124919_borders_and_trip_borders/migration.sql",
  "20260714172527_cargo_type_container_tonnes/migration.sql",
  "20260714173716_delivery_pod_and_container_return/migration.sql",
  "20260715142436_trip_optional_own_resources/migration.sql",
  "20260716121928_cargo_type_geral/migration.sql",
  "20260716143000_backfill_operational_resources/migration.sql",
  "20260720100000_client_public_share_token/migration.sql",
]);

const BLOCKED_OPERATIONS = [
  [
    "DROP de base, schema, tabela ou view",
    /\bDROP\s+(?:DATABASE|SCHEMA|TABLE|VIEW)\b/i,
  ],
  ["DROP dentro de ALTER TABLE", /\bALTER\s+TABLE\b[\s\S]*?\bDROP\b/i],
  ["TRUNCATE", /\bTRUNCATE\b/i],
  ["DELETE", /(?:^|;)\s*DELETE\s+FROM\b/i],
  ["UPDATE/backfill automático", /(?:^|;)\s*UPDATE\b/i],
  ["REPLACE", /(?:^|;)\s*REPLACE\s+INTO\b/i],
  [
    "mudança de coluna existente",
    /\bALTER\s+TABLE\b[\s\S]*?\b(?:MODIFY|CHANGE)\b/i,
  ],
  ["desativação de foreign keys", /\bFOREIGN_KEY_CHECKS\s*=\s*0\b/i],
  [
    "trigger ou rotina com efeitos indiretos",
    /\bCREATE\s+(?:TRIGGER|PROCEDURE|FUNCTION|EVENT)\b/i,
  ],
];

function fail(messages) {
  console.error("\nERRO: deploy bloqueado para proteger os dados de produção.");
  for (const message of messages) console.error(`- ${message}`);
  console.error(
    "\nCrie uma migration apenas aditiva. Uma transformação destrutiva deve ser " +
      "executada separadamente, com backup confirmado e plano de recuperação.",
  );
  process.exit(1);
}

function migrationRoot() {
  if (process.argv[2]) return path.resolve(process.argv[2]);

  const candidates = [
    path.resolve(process.cwd(), "prisma/migrations"),
    path.resolve(__dirname, "../apps/api/prisma/migrations"),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) fail(["Diretório prisma/migrations não encontrado."]);
  return found;
}

function sqlFiles(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "migration.sql"))
    .filter((file) => fs.existsSync(file))
    .sort();
}

function digest(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

function preserveLines(match) {
  return match.replace(/[^\n]/g, " ");
}

function withoutComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, preserveLines)
    .replace(/--[^\n]*/g, preserveLines)
    .replace(/#[^\n]*/g, preserveLines);
}

function lineAt(sql, index) {
  return sql.slice(0, index).split("\n").length;
}

const root = migrationRoot();
const files = sqlFiles(root);
const byRelativePath = new Map(
  files.map((file) => [
    path.relative(root, file).split(path.sep).join("/"),
    file,
  ]),
);
const errors = [];

for (const [relative, expectedHash] of Object.entries(LOCKED_MIGRATIONS)) {
  const file = byRelativePath.get(relative);
  if (!file) {
    errors.push(`Migration histórica removida: ${relative}`);
    continue;
  }

  const actualHash = digest(fs.readFileSync(file));
  if (actualHash !== expectedHash) {
    errors.push(`Migration histórica alterada: ${relative}`);
  }
}

for (const [relative, file] of byRelativePath) {
  if (!Object.hasOwn(LOCKED_MIGRATIONS, relative)) {
    errors.push(
      `Migration nova ainda não registada: ${relative} ` +
        `(sha256 ${digest(fs.readFileSync(file))})`,
    );
  }
  if (HISTORICAL_DESTRUCTIVE_EXCEPTIONS.has(relative)) continue;

  const sql = withoutComments(fs.readFileSync(file, "utf8"));
  for (const [label, pattern] of BLOCKED_OPERATIONS) {
    const match = pattern.exec(sql);
    if (match) {
      errors.push(`${relative}:${lineAt(sql, match.index)} contém ${label}`);
    }
  }
}

if (errors.length) fail(errors);

console.log(
  `Migration safety: ${Object.keys(LOCKED_MIGRATIONS).length} migrations ` +
    "registadas, imutáveis e aprovadas.",
);
