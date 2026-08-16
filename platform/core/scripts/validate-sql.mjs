import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationRoot = path.join(root, "db", "migrations", "staging");
const failures = [];
const migrationFiles = fs.existsSync(migrationRoot)
  ? fs.readdirSync(migrationRoot).filter((name) => name.endsWith(".sql")).sort()
  : [];
const expectedFiles = [
  "20260719_001_core_foundation.up.sql",
  "20260719_001_core_foundation.down.sql",
  "20260814_002_commercial_workspace.up.sql",
  "20260814_002_commercial_workspace.down.sql",
  "20260814_003_whatsapp_transport.up.sql",
  "20260814_003_whatsapp_transport.down.sql",
  "20260814_004_production_release.up.sql",
  "20260814_004_production_release.down.sql",
  "20260815_005_conversation_timeline.up.sql",
  "20260815_005_conversation_timeline.down.sql",
  "20260816_006_whatsapp_media_unread.up.sql",
  "20260816_006_whatsapp_media_unread.down.sql",
];
for (const name of expectedFiles) {
  if (!migrationFiles.includes(name)) failures.push(`missing db/migrations/staging/${name}`);
}
const readMigrations = (suffix) => migrationFiles
  .filter((name) => name.endsWith(suffix))
  .map((name) => ({ name, content: fs.readFileSync(path.join(migrationRoot, name), "utf8") }));
const upMigrations = readMigrations(".up.sql");
const downMigrations = readMigrations(".down.sql");
const up = upMigrations.map((file) => file.content).join("\n");
const down = downMigrations.map((file) => file.content).join("\n");
const timelineUp = upMigrations.find((file) => file.name.startsWith("20260815_005"))?.content ?? "";
const timelineDown = downMigrations.find((file) => file.name.startsWith("20260815_005"))?.content ?? "";

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
  "commercial_contacts",
  "commercial_conversations",
  "commercial_messages",
  "commercial_opportunities",
  "commercial_core_links",
  "whatsapp_ingress_events",
  "whatsapp_outbound_messages",
  "conversation_timeline_events",
  "whatsapp_media_assets",
  "conversation_read_states",
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
for (const token of [
  "timeline_preflight_activity_data_not_array",
  "timeline_preflight_legacy_contract_invalid",
  "timeline_preflight_legacy_timestamp_invalid",
  "sportex_timeline_readable_detail(event_type text, source_detail text)",
  "char_length(pg_temp.sportex_timeline_readable_detail(",
  "char_length(detail) BETWEEN 1 AND 1015",
  "readable_first || substr(source_detail, first_separator)",
  "readable_first || ' → ' || readable_second || substr(remainder, second_separator)",
  "'activity:' || md5(concat(",
]) {
  if (!timelineUp.includes(token)) failures.push(`timeline migration missing ${token}`);
}
if (timelineDown.includes("sportex_staging_commercial_messages")) {
  failures.push("timeline rollback must not touch commercial messages");
}
for (const file of [...upMigrations, ...downMigrations]) {
  if (!/^BEGIN;/mu.test(file.content) || !/COMMIT;\s*$/u.test(file.content)) {
    failures.push(`${file.name} is not transactional`);
  }
}

if (failures.length) {
  console.error("SPORTEX SQL validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SPORTEX SQL validation passed: ${requiredTables.length} staging tables, RLS forced, rollback present.`);
