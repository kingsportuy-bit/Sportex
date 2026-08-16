import { readFileSync } from "node:fs";
import { z } from "zod";

export type SportexEnvironment = "development" | "test" | "staging" | "production";
export type StoreDriver = "memory" | "postgres";

export interface SportexConfig {
  environment: SportexEnvironment;
  storeDriver: StoreDriver;
  devAuthEnabled: boolean;
  tablePrefix: "sportex_staging_" | "sports_";
  databaseUrl?: string;
  databaseRole?: "sportex_staging_app" | "sports_app";
  authInternalUrl?: string;
  authPublicUrl?: string;
  authAnonKey?: string;
  authTimeoutMs?: number;
  frontendDir?: string;
  commercialDemoFile?: string;
  conversationTimelineEnabled?: boolean;
  whatsappMediaEnabled?: boolean;
  whatsappUnreadEnabled?: boolean;
  evolutionIngressEnabled?: boolean;
  evolutionOutboundEnabled?: boolean;
  evolutionInstance?: string;
  evolutionWebhookSecret?: string;
  evolutionApiKey?: string;
  evolutionBaseUrl?: string;
  deltaTenantId?: string;
  evolutionActorId?: string;
  release?: string;
  host: string;
  port: number;
}

const boolFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const schema = z.object({
  SPORTEX_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  SPORTEX_STORE: z.enum(["memory", "postgres"]).default("memory"),
  SPORTEX_DEV_AUTH: boolFromString.default("false"),
  SPORTEX_TABLE_PREFIX: z.enum(["sportex_staging_", "sports_"]).default("sportex_staging_"),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_URL_FILE: z.string().min(1).optional(),
  SPORTEX_DATABASE_ROLE: z.enum(["sportex_staging_app", "sports_app"]).optional(),
  SPORTEX_AUTH_INTERNAL_URL: z.string().url().optional(),
  SPORTEX_AUTH_PUBLIC_URL: z.string().url().optional(),
  SPORTEX_AUTH_ANON_KEY: z.string().min(20).optional(),
  SPORTEX_AUTH_ANON_KEY_FILE: z.string().min(1).optional(),
  SPORTEX_AUTH_TIMEOUT_MS: z.coerce.number().int().min(250).max(30_000).default(5_000),
  SPORTEX_FRONTEND_DIR: z.string().min(1).optional(),
  SPORTEX_COMMERCIAL_DEMO_FILE: z.string().min(1).optional(),
  SPORTEX_CONVERSATION_TIMELINE_ENABLED: boolFromString.default("false"),
  SPORTEX_WHATSAPP_MEDIA_ENABLED: boolFromString.default("false"),
  SPORTEX_WHATSAPP_UNREAD_ENABLED: boolFromString.default("false"),
  SPORTEX_EVOLUTION_INGRESS_ENABLED: boolFromString.default("false"),
  SPORTEX_EVOLUTION_OUTBOUND_ENABLED: boolFromString.default("false"),
  SPORTEX_EVOLUTION_INSTANCE: z.string().trim().min(1).max(120).optional(),
  SPORTEX_EVOLUTION_WEBHOOK_SECRET: z.string().min(32).optional(),
  SPORTEX_EVOLUTION_WEBHOOK_SECRET_FILE: z.string().min(1).optional(),
  SPORTEX_EVOLUTION_API_KEY: z.string().min(20).optional(),
  SPORTEX_EVOLUTION_API_KEY_FILE: z.string().min(1).optional(),
  SPORTEX_EVOLUTION_BASE_URL: z.string().url().optional(),
  SPORTEX_DELTA_TENANT_ID: z.string().uuid().optional(),
  SPORTEX_EVOLUTION_ACTOR_ID: z.string().uuid().optional(),
  SPORTEX_RELEASE: z.string().trim().min(1).max(160).default("local"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
});

function valueOrFile(value: string | undefined, file: string | undefined, label: string): string | undefined {
  if (value && file) throw new Error(`${label}_and_file_conflict`);
  if (value) return value;
  if (!file) return undefined;
  const content = readFileSync(file, "utf8").trim();
  if (!content) throw new Error(`${label}_file_empty`);
  return content;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): SportexConfig {
  const parsed = schema.parse(source);
  const isSafeLocalEnvironment = parsed.SPORTEX_ENV === "development" || parsed.SPORTEX_ENV === "test";
  const databaseUrl = valueOrFile(parsed.DATABASE_URL, parsed.DATABASE_URL_FILE, "database_url");
  const authAnonKey = valueOrFile(
    parsed.SPORTEX_AUTH_ANON_KEY,
    parsed.SPORTEX_AUTH_ANON_KEY_FILE,
    "auth_anon_key",
  );
  const evolutionWebhookSecret = valueOrFile(
    parsed.SPORTEX_EVOLUTION_WEBHOOK_SECRET,
    parsed.SPORTEX_EVOLUTION_WEBHOOK_SECRET_FILE,
    "evolution_webhook_secret",
  );
  const evolutionApiKey = valueOrFile(
    parsed.SPORTEX_EVOLUTION_API_KEY,
    parsed.SPORTEX_EVOLUTION_API_KEY_FILE,
    "evolution_api_key",
  );

  if (parsed.SPORTEX_DEV_AUTH && !isSafeLocalEnvironment) {
    throw new Error("development_auth_forbidden");
  }

  if (parsed.SPORTEX_STORE === "memory" && !isSafeLocalEnvironment) {
    throw new Error("memory_store_forbidden");
  }

  if (parsed.SPORTEX_STORE === "postgres" && !databaseUrl) {
    throw new Error("database_url_required");
  }

  if (parsed.SPORTEX_COMMERCIAL_DEMO_FILE
      && !(isSafeLocalEnvironment && parsed.SPORTEX_STORE === "memory" && parsed.SPORTEX_DEV_AUTH)) {
    throw new Error("commercial_demo_file_forbidden");
  }

  if (!isSafeLocalEnvironment) {
    if (!parsed.SPORTEX_AUTH_INTERNAL_URL || !parsed.SPORTEX_AUTH_PUBLIC_URL || !authAnonKey) {
      throw new Error("supabase_auth_config_required");
    }
  }

  if (parsed.SPORTEX_ENV === "staging") {
    if (parsed.SPORTEX_TABLE_PREFIX !== "sportex_staging_") throw new Error("staging_prefix_required");
    if (parsed.SPORTEX_DATABASE_ROLE !== "sportex_staging_app") throw new Error("staging_role_required");
  }

  if (parsed.SPORTEX_ENV === "production") {
    if (parsed.SPORTEX_TABLE_PREFIX !== "sports_") throw new Error("production_prefix_required");
    if (parsed.SPORTEX_DATABASE_ROLE !== "sports_app") throw new Error("production_role_required");
  }

  if (parsed.SPORTEX_EVOLUTION_INGRESS_ENABLED) {
    if (parsed.SPORTEX_ENV !== "staging" || parsed.SPORTEX_STORE !== "postgres") {
      throw new Error("evolution_ingress_staging_postgres_required");
    }
    if (parsed.SPORTEX_EVOLUTION_INSTANCE !== "DELTA") throw new Error("delta_instance_required");
    if (!evolutionWebhookSecret || evolutionWebhookSecret.length < 32) {
      throw new Error("evolution_webhook_secret_required");
    }
    if (!parsed.SPORTEX_DELTA_TENANT_ID || !parsed.SPORTEX_EVOLUTION_ACTOR_ID) {
      throw new Error("evolution_identity_binding_required");
    }
  }

  if (parsed.SPORTEX_EVOLUTION_OUTBOUND_ENABLED) {
    if (!parsed.SPORTEX_EVOLUTION_INGRESS_ENABLED || parsed.SPORTEX_ENV !== "staging") {
      throw new Error("evolution_outbound_staging_ingress_required");
    }
    if (!parsed.SPORTEX_EVOLUTION_BASE_URL || !evolutionApiKey) {
      throw new Error("evolution_outbound_transport_required");
    }
  }

  return {
    environment: parsed.SPORTEX_ENV,
    storeDriver: parsed.SPORTEX_STORE,
    devAuthEnabled: parsed.SPORTEX_DEV_AUTH,
    tablePrefix: parsed.SPORTEX_TABLE_PREFIX,
    ...(databaseUrl ? { databaseUrl } : {}),
    ...(parsed.SPORTEX_DATABASE_ROLE ? { databaseRole: parsed.SPORTEX_DATABASE_ROLE } : {}),
    ...(parsed.SPORTEX_AUTH_INTERNAL_URL ? { authInternalUrl: parsed.SPORTEX_AUTH_INTERNAL_URL.replace(/\/$/u, "") } : {}),
    ...(parsed.SPORTEX_AUTH_PUBLIC_URL ? { authPublicUrl: parsed.SPORTEX_AUTH_PUBLIC_URL.replace(/\/$/u, "") } : {}),
    ...(authAnonKey ? { authAnonKey } : {}),
    authTimeoutMs: parsed.SPORTEX_AUTH_TIMEOUT_MS,
    ...(parsed.SPORTEX_FRONTEND_DIR ? { frontendDir: parsed.SPORTEX_FRONTEND_DIR } : {}),
    ...(parsed.SPORTEX_COMMERCIAL_DEMO_FILE ? { commercialDemoFile: parsed.SPORTEX_COMMERCIAL_DEMO_FILE } : {}),
    conversationTimelineEnabled: parsed.SPORTEX_CONVERSATION_TIMELINE_ENABLED,
    whatsappMediaEnabled: parsed.SPORTEX_WHATSAPP_MEDIA_ENABLED,
    whatsappUnreadEnabled: parsed.SPORTEX_WHATSAPP_UNREAD_ENABLED,
    evolutionIngressEnabled: parsed.SPORTEX_EVOLUTION_INGRESS_ENABLED,
    evolutionOutboundEnabled: parsed.SPORTEX_EVOLUTION_OUTBOUND_ENABLED,
    ...(parsed.SPORTEX_EVOLUTION_INSTANCE ? { evolutionInstance: parsed.SPORTEX_EVOLUTION_INSTANCE } : {}),
    ...(evolutionWebhookSecret ? { evolutionWebhookSecret } : {}),
    ...(evolutionApiKey ? { evolutionApiKey } : {}),
    ...(parsed.SPORTEX_EVOLUTION_BASE_URL ? { evolutionBaseUrl: parsed.SPORTEX_EVOLUTION_BASE_URL.replace(/\/$/u, "") } : {}),
    ...(parsed.SPORTEX_DELTA_TENANT_ID ? { deltaTenantId: parsed.SPORTEX_DELTA_TENANT_ID } : {}),
    ...(parsed.SPORTEX_EVOLUTION_ACTOR_ID ? { evolutionActorId: parsed.SPORTEX_EVOLUTION_ACTOR_ID } : {}),
    release: parsed.SPORTEX_RELEASE,
    host: parsed.HOST,
    port: parsed.PORT,
  };
}
