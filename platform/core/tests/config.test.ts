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
