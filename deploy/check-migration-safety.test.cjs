"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const repositoryRoot = path.resolve(__dirname, "..");
const checker = path.join(__dirname, "check-migration-safety.cjs");
const sourceMigrations = path.join(
  repositoryRoot,
  "apps/api/prisma/migrations",
);

function temporaryMigrations(t) {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "lumac-migration-safety-"),
  );
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const migrations = path.join(temporaryRoot, "migrations");
  fs.cpSync(sourceMigrations, migrations, { recursive: true });
  return migrations;
}

function run(migrations) {
  return spawnSync(process.execPath, [checker, migrations], {
    encoding: "utf8",
  });
}

test("accepts the locked migration history", () => {
  const result = run(sourceMigrations);
  assert.equal(result.status, 0, result.stderr);
});

test("blocks changes to a historical migration", (t) => {
  const migrations = temporaryMigrations(t);
  const file = path.join(
    migrations,
    "20260720100000_client_public_share_token/migration.sql",
  );
  fs.appendFileSync(file, "\nCREATE INDEX `unexpected` ON `clients` (`id`);\n");

  const result = run(migrations);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Migration histórica alterada/);
});

test("blocks an unregistered destructive migration", (t) => {
  const migrations = temporaryMigrations(t);
  const directory = path.join(migrations, "20990101000000_unsafe");
  fs.mkdirSync(directory);
  fs.writeFileSync(
    path.join(directory, "migration.sql"),
    "DELETE FROM `clients`;\n",
  );

  const result = run(migrations);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Migration nova ainda não registada/);
  assert.match(result.stderr, /contém DELETE/);
});
