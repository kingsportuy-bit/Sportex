import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { SportexConfig } from "../config.js";
import type { ActorContext } from "../domain/models.js";
import { CoreService } from "../application/core-service.js";
import { idempotencyKey } from "./context.js";

type ContextResolver = (request: FastifyRequest) => Promise<ActorContext>;

const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/u, "Phone must use E.164 format");

const createClientSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  teamName: z.string().trim().min(2).max(120).optional(),
  primaryPhone: phoneSchema.optional(),
}).strict();

const certifyPaymentSchema = z.object({
  clientId: z.string().uuid(),
  evidenceReference: z.string().trim().min(3).max(160),
  amountCents: z.number().int().positive().max(1_000_000_000),
  currency: z.enum(["UYU", "USD"]),
}).strict();

const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  certifiedPaymentId: z.string().uuid(),
  teamName: z.string().trim().min(2).max(120),
  quotedTotalCents: z.number().int().positive().max(1_000_000_000),
  currency: z.enum(["UYU", "USD"]),
}).strict();

export async function registerRoutes(
  app: FastifyInstance,
  service: CoreService,
  config: SportexConfig,
  resolveContext: ContextResolver,
): Promise<void> {
  app.get("/v1/public-config", async () => ({
    data: {
      environment: config.environment,
      authUrl: config.authPublicUrl ?? null,
      authAnonKey: config.authAnonKey ?? null,
      release: config.release ?? "local",
    },
  }));

  app.get("/v1/session", async (request) => {
    const context = await resolveContext(request);
    return {
      data: {
        actorId: context.actorId,
        email: context.actorEmail ?? null,
        tenantId: context.tenantId,
        tenantName: context.tenantName ?? "SPORTEX",
        capabilities: context.capabilities,
        passwordChangeRequired: context.passwordChangeRequired ?? false,
      },
      meta: { correlationId: context.correlationId },
    };
  });

  app.post("/v1/clients", async (request, reply) => {
    const context = await resolveContext(request);
    const parsed = createClientSchema.parse(request.body);
    const input = {
      displayName: parsed.displayName,
      ...(parsed.teamName ? { teamName: parsed.teamName } : {}),
      ...(parsed.primaryPhone ? { primaryPhone: parsed.primaryPhone } : {}),
    };
    const result = await service.createClient(context, idempotencyKey(request), input);
    return reply.code(201).send({
      data: result.data,
      meta: { correlationId: context.correlationId, replayed: result.replayed },
    });
  });

  app.get("/v1/clients", async (request) => {
    const context = await resolveContext(request);
    const clients = await service.listClients(context);
    return { data: clients, meta: { correlationId: context.correlationId } };
  });

  app.post("/v1/payments/certify", async (request, reply) => {
    const context = await resolveContext(request);
    const input = certifyPaymentSchema.parse(request.body);
    const result = await service.certifyPayment(context, idempotencyKey(request), input);
    return reply.code(201).send({
      data: result.data,
      meta: { correlationId: context.correlationId, replayed: result.replayed },
    });
  });

  app.post("/v1/orders/from-certified-payment", async (request, reply) => {
    const context = await resolveContext(request);
    const input = createOrderSchema.parse(request.body);
    const result = await service.createOrderFromCertifiedPayment(context, idempotencyKey(request), input);
    return reply.code(201).send({
      data: result.data,
      meta: { correlationId: context.correlationId, replayed: result.replayed },
    });
  });

  app.get("/v1/orders", async (request) => {
    const context = await resolveContext(request);
    const orders = await service.listOrders(context);
    return { data: orders, meta: { correlationId: context.correlationId } };
  });
}
