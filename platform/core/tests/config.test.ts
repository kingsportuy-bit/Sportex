import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";

const authConfig = {
  SPORTEX_AUTH_INTERNAL_URL: "https://supabase-staging.example/auth/v1",
  SPORTEX_AUTH_PUBLIC_URL: "https://supabase-staging.example/auth/v1",
  SPORTEX_AUTH_ANON_KEY: "test-anon-key-with-enough-length",
};

test("development auth cannot start outside development or test", () => {
  assert.throws(
    () => loadConfig({ SPORTEX_ENV: "staging", SPORTEX_DEV_AUTH: "true" }),
    /development_auth_forbidden/u,
  );
});

test("memory store cannot start in staging", () => {
  assert.throws(
    () => loadConfig({ SPORTEX_ENV: "staging", SPORTEX_STORE: "memory" }),
    /memory_store_forbidden/u,
  );
});

test("staging requires exact table prefix and role", () => {
  assert.throws(
    () => loadConfig({
      ...authConfig,
      SPORTEX_ENV: "staging",
      SPORTEX_STORE: "postgres",
      SPORTEX_TABLE_PREFIX: "sports_",
      SPORTEX_DATABASE_ROLE: "sports_app",
      DATABASE_URL: "postgresql://example.invalid/db",
    }),
    /staging_prefix_required/u,
  );

  const config = loadConfig({
    ...authConfig,
    SPORTEX_ENV: "staging",
    SPORTEX_STORE: "postgres",
    SPORTEX_TABLE_PREFIX: "sportex_staging_",
    SPORTEX_DATABASE_ROLE: "sportex_staging_app",
    DATABASE_URL: "postgresql://example.invalid/db",
  });
  assert.equal(config.tablePrefix, "sportex_staging_");
  assert.equal(config.databaseRole, "sportex_staging_app");
});

test("production requires sports prefix", () => {
  const config = loadConfig({
    ...authConfig,
    SPORTEX_ENV: "production",
    SPORTEX_STORE: "postgres",
    SPORTEX_TABLE_PREFIX: "sports_",
    SPORTEX_DATABASE_ROLE: "sports_app",
    DATABASE_URL: "postgresql://example.invalid/db",
  });
  assert.equal(config.tablePrefix, "sports_");
});

test("staging rejects missing Supabase authentication configuration", () => {
  assert.throws(
    () => loadConfig({
      SPORTEX_ENV: "staging",
      SPORTEX_STORE: "postgres",
      SPORTEX_TABLE_PREFIX: "sportex_staging_",
      SPORTEX_DATABASE_ROLE: "sportex_staging_app",
      DATABASE_URL: "postgresql://example.invalid/db",
    }),
    /supabase_auth_config_required/u,
  );
});

test("real Evolution ingress is staging-only, binds DELTA identity and keeps outbound denied", () => {
  const base = {
    SPORTEX_ENV: "staging",
    SPORTEX_STORE: "postgres",
    SPORTEX_DEV_AUTH: "false",
    SPORTEX_TABLE_PREFIX: "sportex_staging_",
    SPORTEX_DATABASE_ROLE: "sportex_staging_app",
    DATABASE_URL: "postgresql://runtime:secret@db:5432/postgres",
    SPORTEX_AUTH_INTERNAL_URL: "http://auth:9999",
    SPORTEX_AUTH_PUBLIC_URL: "https://supabase-staging.example.test/auth/v1",
    SPORTEX_AUTH_ANON_KEY: "anon-key-long-enough-for-test",
    SPORTEX_EVOLUTION_INGRESS_ENABLED: "true",
    SPORTEX_EVOLUTION_INSTANCE: "DELTA",
    SPORTEX_EVOLUTION_WEBHOOK_SECRET: "01234567890123456789012345678901",
    SPORTEX_DELTA_TENANT_ID: "11111111-1111-4111-8111-111111111111",
    SPORTEX_EVOLUTION_ACTOR_ID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  };
  const config = loadConfig(base);
  assert.equal(config.evolutionIngressEnabled, true);
  assert.equal(config.evolutionOutboundEnabled, false);
  assert.equal(config.evolutionInstance, "DELTA");
  assert.throws(() => loadConfig({ ...base, SPORTEX_EVOLUTION_OUTBOUND_ENABLED: "true" }), /evolution_outbound_transport_required/u);
  const outbound = loadConfig({
    ...base,
    SPORTEX_EVOLUTION_OUTBOUND_ENABLED: "true",
    SPORTEX_EVOLUTION_BASE_URL: "https://evolution.example.test",
    SPORTEX_EVOLUTION_API_KEY: "evolution-api-key-for-test",
  });
  assert.equal(outbound.evolutionOutboundEnabled, true);
  assert.throws(() => loadConfig({ ...base, SPORTEX_EVOLUTION_INSTANCE: "OTRA" }), /delta_instance_required/u);
});
