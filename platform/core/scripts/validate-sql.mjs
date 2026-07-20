import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationRoot = path.join(root, "db", "migrations", "staging");
const upPath = path.join(migrationRoot, "20260719_001_core_foundation.up.sql");
const downPath = path.join(migrationRoot, "20260719_001_core_foundation.down.sql");
const failures = [];

for (const file of [upPath, downPath]) {
  if (!fs.existsSync(file)) failures.push(`missing ${path.relative(root, file)}`);
}

const up = fs.existsSync(upPath) ? fs.readFileSync(upPath, "utf8") : "";
const down = fs.existsSync(downPath) ? fs.readFileSync(downPath, "utf8") : "";

const requiredTables = [
  "tenants",
  "memberships",
  "clients",
  "certified_payments",
  "order_counters",
  "orders",
  "idempotency",
  "audit_events",
  "outbox",
].map((name) => `sportex_staging_${name}`);

for (const table of requiredTables) {
  if (!up.includes(`CREATE TABLE public.${table}`)) failures.push(`up migration missing ${table}`);
  if (!up.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)) {
    failures.push(`${table} missing ENABLE ROW LEVEL SECURITY`);
  }
  if (!up.includes(`ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY`)) {
    failures.push(`${table} missing FORCE ROW LEVEL SECURITY`);
  }
  if (!down.includes(`DROP TABLE public.${table}`)) failures.push(`down migration missing ${table}`);
}

for (const match of up.matchAll(/CREATE\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)/giu)) {
  const table = match[1] ?? "";
  if (!table.startsWith("sportex_staging_")) failures.push(`forbidden table prefix in up migration: ${table}`);
}

for (const match of down.matchAll(/DROP\s+TABLE\s+(?:public\.)?([a-zA-Z0-9_]+)/giu)) {
  const table = match[1] ?? "";
  if (!table.startsWith("sportex_staging_")) failures.push(`forbidden table prefix in down migration: ${table}`);
}

if (/CREATE\s+TABLE\s+(?:public\.)?sports_/iu.test(up)) failures.push("production table creation is forbidden");
if (/CREATE\s+TABLE\s+(?:public\.)?sportex_(?!staging_)/iu.test(up)) {
  failures.push("legacy table creation is forbidden");
}
if (!up.includes("CREATE ROLE sportex_staging_app")) failures.push("staging application role missing");
if (!up.includes("pg_advisory_xact_lock") && !fs.readFileSync(path.join(root, "src", "adapters", "persistence", "postgres-core-store.ts"), "utf8").includes("pg_advisory_xact_lock")) {
  failures.push("idempotency advisory lock missing");
}
if (/eyJ[a-zA-Z0-9_-]{20,}/u.test(`${up}\n${down}`)) failures.push("JWT-like secret found in SQL");
if (!/^BEGIN;/mu.test(up) || !/COMMIT;\s*$/u.test(up)) failures.push("up migration is not transactional");
if (!/^BEGIN;/mu.test(down) || !/COMMIT;\s*$/u.test(down)) failures.push("down migration is not transactional");

if (failures.length) {
  console.error("SPORTEX SQL validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SPORTEX SQL validation passed: ${requiredTables.length} staging tables, RLS forced, rollback present.`);
