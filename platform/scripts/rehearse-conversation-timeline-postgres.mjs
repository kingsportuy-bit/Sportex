import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const container = `sportex-timeline-${process.pid}`;
const database = "sportex_timeline_test";
const password = "sportex_local_test";
const migrations = [
  "20260719_001_core_foundation.up.sql",
  "20260814_002_commercial_workspace.up.sql",
  "20260814_003_whatsapp_transport.up.sql",
  "20260814_004_production_release.up.sql",
  "20260815_005_conversation_timeline.up.sql",
];
const migrationDirectory = resolve(root, "core/db/migrations/staging");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function psql(sql, { allowFailure = false, tuplesOnly = false } = {}) {
  return run("docker", [
    "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1",
    ...(tuplesOnly ? ["-At"] : []),
    "-U", "postgres", "-d", database,
  ], { input: sql, allowFailure });
}

function migration(name, options) {
  return psql(readFileSync(resolve(migrationDirectory, name), "utf8"), options);
}

function scalar(sql) {
  return psql(sql, { tuplesOnly: true }).stdout.trim();
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = run("docker", ["exec", container, "pg_isready", "-U", "postgres", "-d", database], {
      allowFailure: true,
    });
    if (ready.status === 0) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error("postgres_test_container_not_ready");
}

function appendInvalidActivity(overrides) {
  const values = {
    type: "FOLLOW_UP_RECORDED",
    occurredAt: "2026-08-15T18:00:00.000Z",
    actorId: "postgres-invalid-actor",
    correlationId: "postgres-invalid-correlation",
    evidenceMessageId: null,
    detail: "SIN_CAMBIOS: actividad inválida de preflight",
    ...overrides,
  };
  const literal = (value) => value === null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
  psql(`
    UPDATE public.sportex_staging_commercial_opportunities
    SET activity_data = activity_data || jsonb_build_array(jsonb_build_object(
      'type', ${literal(values.type)},
      'occurredAt', ${literal(values.occurredAt)},
      'actorId', ${literal(values.actorId)},
      'correlationId', ${literal(values.correlationId)},
      'evidenceMessageId', ${literal(values.evidenceMessageId)},
      'detail', ${literal(values.detail)}
    ))
    WHERE tenant_id = '11111111-1111-4111-8111-111111111111';
  `);
}

function removeLastActivity() {
  psql(`
    UPDATE public.sportex_staging_commercial_opportunities
    SET activity_data = activity_data - (jsonb_array_length(activity_data) - 1)
    WHERE tenant_id = '11111111-1111-4111-8111-111111111111';
  `);
}

function expectPreflightFailure(label, overrides, marker) {
  appendInvalidActivity(overrides);
  const attempted = migration("20260815_005_conversation_timeline.up.sql", { allowFailure: true });
  const transcript = `${attempted.stdout}\n${attempted.stderr}`;
  assert.notEqual(attempted.status, 0, `${label} unexpectedly passed`);
  assert.match(transcript, new RegExp(marker, "u"));
  removeLastActivity();
  console.log(`PREFLIGHT_${label}=PASS`);
}

let started = false;
try {
  run("docker", [
    "run", "--detach", "--rm", "--name", container,
    "-e", `POSTGRES_PASSWORD=${password}`,
    "-e", `POSTGRES_DB=${database}`,
    "-p", "127.0.0.1::5432",
    "postgres:16-alpine",
  ]);
  started = true;
  await waitForPostgres();
  const portOutput = run("docker", ["port", container, "5432/tcp"]).stdout.trim();
  const port = portOutput.match(/:(\d+)$/u)?.[1];
  assert.ok(port, `unexpected docker port output: ${portOutput}`);
  const databaseUrl = `postgres://postgres:${password}@127.0.0.1:${port}/${database}`;

  for (const name of migrations) migration(name);
  psql(`
    INSERT INTO public.sportex_staging_tenants (id, slug, name, status, created_at, updated_at)
    VALUES
      ('11111111-1111-4111-8111-111111111111', 'tenant-a', 'Tenant ficticio A', 'active', now(), now()),
      ('22222222-2222-4222-8222-222222222222', 'tenant-b', 'Tenant ficticio B', 'active', now(), now());
  `);
  run(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "-p", "core/tsconfig.json"]);
  const service = run(process.execPath, ["core/scripts/rehearse-commercial-postgres.mjs"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  process.stdout.write(service.stdout);
  if (service.stderr) process.stderr.write(service.stderr);

  const messagesBeforeDown = scalar("SELECT count(*) FROM public.sportex_staging_commercial_messages;");
  migration("20260815_005_conversation_timeline.down.sql");
  const messagesAfterDown = scalar("SELECT count(*) FROM public.sportex_staging_commercial_messages;");
  assert.equal(messagesAfterDown, messagesBeforeDown);
  console.log(`MESSAGES_BEFORE_DOWN=${messagesBeforeDown}`);
  console.log(`MESSAGES_AFTER_DOWN=${messagesAfterDown}`);

  expectPreflightFailure("NULL_ACTOR", { actorId: null }, "timeline_preflight_legacy_contract_invalid");
  expectPreflightFailure("CORRELATION_201", { correlationId: "c".repeat(201) }, "timeline_preflight_legacy_contract_invalid");
  expectPreflightFailure("INVALID_TIMESTAMP", { occurredAt: "2026-02-31T10:00:00.000Z" }, "timeline_preflight_legacy_timestamp_invalid");

  migration("20260815_005_conversation_timeline.up.sql");
  const reupEvents = scalar("SELECT count(*) FROM public.sportex_staging_conversation_timeline_events;");
  const reconstructedMaximum = scalar(`
    SELECT count(*)
    FROM public.sportex_staging_conversation_timeline_events
    WHERE event_type = 'FOLLOW_UP_RECORDED'
      AND char_length(detail) = 1015
      AND left(detail, 15) = 'Sin respuesta: ';
  `);
  assert.equal(reconstructedMaximum, "1");
  console.log(`REUP_EVENTS=${reupEvents}`);
  console.log("REUP_MAX_NOTE_RECONSTRUCTED=true");
  console.log("SPORTEX_TIMELINE_POSTGRES_HARNESS=PASS");
} finally {
  if (started) run("docker", ["stop", container], { allowFailure: true });
}
