import type { FastifyRequest } from "fastify";
import { z } from "zod";
import type { SportexConfig } from "../config.js";
import type { ActorContext, Capability } from "../domain/models.js";
import type { CoreStore } from "../ports/core-store.js";
import { AppError } from "../shared/errors.js";

const capabilitySchema = z.enum([
  "clients.create",
  "clients.read",
  "commercial.read",
  "commercial.replay",
  "commercial.manage",
  "payments.certify",
  "orders.create",
  "orders.read",
  "production.release",
]);

const uuidSchema = z.string().uuid();
const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  app_metadata: z.record(z.unknown()).default({}),
  user_metadata: z.record(z.unknown()).default({}),
});

export type AuthFetch = typeof fetch;

function header(request: FastifyRequest, name: string): string {
  const value = request.headers[name];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function developmentContext(request: FastifyRequest): ActorContext {
  const tenantId = uuidSchema.safeParse(header(request, "x-sportex-tenant-id"));
  const actorId = uuidSchema.safeParse(header(request, "x-sportex-actor-id"));
  if (!tenantId.success || !actorId.success) {
    throw new AppError("authentication_required", 401, "Valid development identity headers are required");
  }

  const rawCapabilities = header(request, "x-sportex-capabilities")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const parsedCapabilities = z.array(capabilitySchema).safeParse(rawCapabilities);
  if (!parsedCapabilities.success) {
    throw new AppError("authentication_required", 401, "Invalid development capabilities");
  }

  return {
    tenantId: tenantId.data,
    actorId: actorId.data,
    capabilities: [...new Set(parsedCapabilities.data)] as Capability[],
    correlationId: request.sportexCorrelationId,
  };
}

export async function resolveActorContext(
  request: FastifyRequest,
  config: SportexConfig,
  store: CoreStore,
  fetcher: AuthFetch = fetch,
): Promise<ActorContext> {
  if (config.devAuthEnabled) return developmentContext(request);
  if (!config.authInternalUrl || !config.authAnonKey) {
    throw new AppError("authentication_unavailable", 503, "Authentication is unavailable");
  }

  const authorization = header(request, "authorization");
  const match = /^Bearer\s+(.+)$/iu.exec(authorization);
  if (!match?.[1]) throw new AppError("authentication_required", 401, "Authentication is required");

  let response: Response;
  try {
    response = await fetcher(`${config.authInternalUrl}/user`, {
      method: "GET",
      headers: {
        apikey: config.authAnonKey,
        authorization: `Bearer ${match[1]}`,
      },
      signal: AbortSignal.timeout(config.authTimeoutMs ?? 5_000),
    });
  } catch {
    throw new AppError("authentication_unavailable", 503, "Authentication is unavailable");
  }

  if (!response.ok) throw new AppError("authentication_required", 401, "Authentication is required");
  const parsedUser = authUserSchema.safeParse(await response.json());
  if (!parsedUser.success) throw new AppError("authentication_required", 401, "Authentication is required");

  const tenantCandidate = parsedUser.data.app_metadata.sportex_tenant_id;
  const tenantId = uuidSchema.safeParse(tenantCandidate);
  if (!tenantId.success) throw new AppError("tenant_membership_required", 403, "No SPORTEX company is assigned");

  const membership = await store.findActiveMembership(tenantId.data, parsedUser.data.id);
  if (!membership) throw new AppError("tenant_membership_required", 403, "No active SPORTEX membership was found");
  const capabilities = z.array(capabilitySchema).safeParse(membership.capabilities);
  if (!capabilities.success) throw new AppError("permission_denied", 403, "Membership capabilities are invalid");

  return {
    tenantId: membership.tenantId,
    tenantName: membership.tenantName,
    actorId: membership.actorId,
    ...(parsedUser.data.email ? { actorEmail: parsedUser.data.email } : {}),
    capabilities: [...new Set(capabilities.data)] as Capability[],
    correlationId: request.sportexCorrelationId,
    passwordChangeRequired: parsedUser.data.user_metadata.password_change_required === true,
  };
}

export async function checkAuthReady(config: SportexConfig, fetcher: AuthFetch = fetch): Promise<void> {
  if (config.devAuthEnabled) return;
  if (!config.authInternalUrl || !config.authAnonKey) throw new Error("auth_config_missing");
  const response = await fetcher(`${config.authInternalUrl}/health`, {
    headers: { apikey: config.authAnonKey },
    signal: AbortSignal.timeout(config.authTimeoutMs ?? 5_000),
  });
  if (!response.ok) throw new Error("auth_unavailable");
}

export function idempotencyKey(request: FastifyRequest): string {
  return header(request, "idempotency-key").trim();
}
