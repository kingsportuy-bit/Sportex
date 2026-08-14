import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import type { SportexConfig } from "./config.js";
import { InMemoryCommercialReplayStore } from "./adapters/persistence/in-memory-commercial-replay-store.js";
import { LocalJsonCommercialReplayStore } from "./adapters/persistence/local-json-commercial-replay-store.js";
import { PostgresCommercialReplayStore } from "./adapters/persistence/postgres-commercial-replay-store.js";
import { CommercialReplayService } from "./application/commercial-replay-service.js";
import { CoreService } from "./application/core-service.js";
import { createCommercialDemoSeed } from "./fixtures/commercial-demo-seed.js";
import type { CoreStore } from "./ports/core-store.js";
import { AppError } from "./shared/errors.js";
import { registerRoutes } from "./http/routes.js";
import { checkAuthReady, resolveActorContext, type AuthFetch } from "./http/context.js";

declare module "fastify" {
  interface FastifyRequest {
    sportexCorrelationId: string;
  }
}

export interface BuildServerOptions {
  config: SportexConfig;
  store: CoreStore;
  logger?: boolean;
  authFetch?: AuthFetch;
}

export async function buildServer(options: BuildServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true });
  const service = new CoreService(options.store);
  const localCommercialReplayEnabled = options.config.storeDriver === "memory"
    && options.config.devAuthEnabled
    && (options.config.environment === "development" || options.config.environment === "test");
  const commercialStore = options.config.storeDriver === "postgres"
    ? new PostgresCommercialReplayStore(options.config)
    : localCommercialReplayEnabled
      ? options.config.commercialDemoFile
      ? new LocalJsonCommercialReplayStore(options.config.commercialDemoFile)
      : new InMemoryCommercialReplayStore()
    : null;
  const commercialService = commercialStore
    ? new CommercialReplayService(
      commercialStore,
      undefined,
      undefined,
      localCommercialReplayEnabled && options.config.commercialDemoFile ? createCommercialDemoSeed : null,
      service,
    )
    : null;
  const authFetch = options.authFetch ?? fetch;
  const resolveContext = (request: Parameters<typeof resolveActorContext>[0]) =>
    resolveActorContext(request, options.config, options.store, authFetch);

  app.decorateRequest("sportexCorrelationId", "");
  app.addHook("onRequest", async (request, reply) => {
    const candidate = request.headers["x-correlation-id"];
    const correlationId = typeof candidate === "string" && candidate.length <= 128 ? candidate : randomUUID();
    request.sportexCorrelationId = correlationId;
    reply.header("x-correlation-id", correlationId);
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    const authOrigin = options.config.authPublicUrl ? new URL(options.config.authPublicUrl).origin : "";
    reply.header("cache-control", "no-store");
    reply.header(
      "content-security-policy",
      `default-src 'self'; connect-src 'self' ${authOrigin}; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
    );
    reply.header("referrer-policy", "no-referrer");
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    return payload;
  });

  app.setErrorHandler(async (error, request, reply) => {
    const correlationId = request.sportexCorrelationId || randomUUID();
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        correlationId,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: "Payload validation failed",
        correlationId,
        details: {
          issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      });
    }

    request.log.error({ err: error, correlationId }, "Unhandled SPORTEX Core error");
    return reply.code(500).send({
      error: "internal_error",
      message: "Unexpected internal error",
      correlationId,
    });
  });

  app.get("/health", async () => ({
    ok: true,
    service: "sportex-core",
    environment: options.config.environment,
    release: options.config.release ?? "local",
  }));

  app.get("/ready", async (_request, reply) => {
    try {
      await Promise.all([
        options.store.checkReady(),
        checkAuthReady(options.config, authFetch),
      ]);
      return {
        ok: true,
        service: "sportex-core",
        store: options.config.storeDriver,
        authentication: options.config.devAuthEnabled ? "development" : "supabase",
      };
    } catch {
      return reply.code(503).send({ ok: false, error: "dependency_unavailable" });
    }
  });

  await registerRoutes(
    app,
    service,
    commercialService,
    options.config,
    resolveContext,
    localCommercialReplayEnabled,
  );

  if (options.config.frontendDir) {
    await app.register(fastifyStatic, {
      root: resolve(options.config.frontendDir),
      prefix: "/",
      wildcard: false,
    });
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/v1/") || request.url === "/health" || request.url === "/ready") {
        return reply.code(404).send({
          error: "not_found",
          message: "Resource not found",
          correlationId: request.sportexCorrelationId,
        });
      }
      return reply.type("text/html; charset=utf-8").sendFile("index.html");
    });
  }

  app.addHook("onClose", async () => {
    await Promise.all([
      options.store.close(),
      commercialStore?.close() ?? Promise.resolve(),
    ]);
  });
  return app;
}
