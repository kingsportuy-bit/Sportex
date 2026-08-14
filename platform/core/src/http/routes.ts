import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { SportexConfig } from "../config.js";
import type { EvolutionReplayEvent } from "../domain/commercial-models.js";
import type { ActorContext } from "../domain/models.js";
import { CommercialReplayService } from "../application/commercial-replay-service.js";
import { CoreService } from "../application/core-service.js";
import { LocalWhatsAppSimulationService } from "../application/local-whatsapp-simulation-service.js";
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

const orderParamsSchema = z.object({
  orderId: z.string().uuid(),
}).strict();

const releaseOrderToProductionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  confirmation: z.literal("ENTREGAR_A_PRODUCCION"),
}).strict();

const evolutionReplaySchema = z.object({
  event: z.literal("messages.upsert"),
  instance: z.literal("LOCAL_FIXTURE"),
  data: z.object({
    key: z.object({
      id: z.string().regex(/^msg-ficticio-[a-z0-9-]{1,80}$/u),
      remoteJid: z.string().regex(/^contacto-ficticio-[a-z0-9-]{1,80}$/u),
      fromMe: z.literal(false),
    }).strict(),
    pushName: z.string().trim().min(2).max(120),
    messageTimestamp: z.string().datetime({ offset: true }),
    message: z.object({
      conversation: z.string().trim().min(1).max(4_000),
    }).strict(),
    contextInfo: z.object({
      externalAdReply: z.object({
        sourceId: z.string().regex(/^ad-ficticio-[a-z0-9-]{1,80}$/u).optional(),
        sourceUrl: z.string().url().optional(),
        ctwaClid: z.string().max(160).optional(),
        ref: z.string().max(160).optional(),
      }).strict().optional(),
    }).strict().optional(),
  }).strict(),
}).strict();

const commercialItemParamsSchema = z.object({
  itemId: z.string().trim().min(3).max(120),
}).strict();

const expectedVersionSchema = z.number().int().positive();
const commercialStageSchema = z.enum([
  "NUEVO",
  "EN_CALIFICACION",
  "COTIZADO",
  "EN_SEGUIMIENTO",
  "PERDIDO",
  "SENA_VALIDADA",
]);

const updateCommercialStageSchema = z.object({
  stage: commercialStageSchema,
  expectedVersion: expectedVersionSchema,
  reason: z.string().trim().min(3).max(240).optional(),
}).strict();

const updateCommercialNextActionSchema = z.object({
  description: z.string().trim().min(3).max(240),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).nullable(),
  expectedVersion: expectedVersionSchema,
}).strict();

const recordCommercialFollowUpSchema = z.object({
  note: z.string().trim().min(3).max(1_000),
  outcome: z.enum(["SIN_CAMBIOS", "AVANZO", "SIN_RESPUESTA", "NO_CONTINUA"]),
  expectedVersion: expectedVersionSchema,
}).strict();

const convertCommercialOpportunitySchema = z.object({
  evidenceReference: z.string().trim().min(3).max(160),
  depositCents: z.number().int().positive().max(1_000_000_000),
  expectedVersion: expectedVersionSchema,
}).strict();

const releaseCommercialOrderToProductionSchema = z.object({
  expectedVersion: expectedVersionSchema,
  confirmation: z.literal("ENTREGAR_A_PRODUCCION"),
}).strict();

const resetCommercialDemoSchema = z.object({
  confirmation: z.literal("RESTAURAR_DATOS_FICTICIOS"),
}).strict();

const simulatedOutboundSchema = z.object({
  text: z.string().trim().min(1).max(4_000),
}).strict();

export async function registerRoutes(
  app: FastifyInstance,
  service: CoreService,
  commercialService: CommercialReplayService | null,
  config: SportexConfig,
  resolveContext: ContextResolver,
  localCommercialReplayEnabled: boolean,
  localWhatsAppSimulation: LocalWhatsAppSimulationService | null,
): Promise<void> {
  app.get("/v1/public-config", async () => ({
    data: {
      environment: config.environment,
      authUrl: config.authPublicUrl ?? null,
      authAnonKey: config.authAnonKey ?? null,
      release: config.release ?? "local",
      commercialWorkspaceEnabled: commercialService !== null,
      localCommercialReplayEnabled,
      localCommercialPersistenceEnabled: localCommercialReplayEnabled && Boolean(config.commercialDemoFile),
      localWhatsAppSimulationEnabled: localWhatsAppSimulation !== null,
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

  app.post("/v1/orders/:orderId/release-to-production", async (request) => {
    const context = await resolveContext(request);
    const params = orderParamsSchema.parse(request.params);
    const input = releaseOrderToProductionSchema.parse(request.body);
    const result = await service.releaseOrderToProduction(
      context,
      params.orderId,
      idempotencyKey(request),
      input,
    );
    return {
      data: result.data,
      meta: { correlationId: context.correlationId, replayed: result.replayed },
    };
  });

  if (commercialService) {
    app.get("/v1/commercial/workspace", async (request) => {
      const context = await resolveContext(request);
      const items = await commercialService.list(context);
      return { data: items, meta: { correlationId: context.correlationId } };
    });
  }

  if (commercialService && localCommercialReplayEnabled) {
    app.post("/v1/local/evolution-replays", async (request, reply) => {
      const context = await resolveContext(request);
      const input = evolutionReplaySchema.parse(request.body) as EvolutionReplayEvent;
      const result = await commercialService.replay(context, idempotencyKey(request), input);
      return reply.code(201).send({
        data: result.data,
        meta: { correlationId: context.correlationId, replayed: result.replayed },
      });
    });

    app.patch("/v1/local/commercial/workspace/:itemId/stage", async (request) => {
      const context = await resolveContext(request);
      const params = commercialItemParamsSchema.parse(request.params);
      const input = updateCommercialStageSchema.parse(request.body);
      const item = await commercialService.updateStage(context, params.itemId, {
        stage: input.stage,
        expectedVersion: input.expectedVersion,
        ...(input.reason ? { reason: input.reason } : {}),
      });
      return { data: item, meta: { correlationId: context.correlationId } };
    });

    app.patch("/v1/local/commercial/workspace/:itemId/next-action", async (request) => {
      const context = await resolveContext(request);
      const params = commercialItemParamsSchema.parse(request.params);
      const input = updateCommercialNextActionSchema.parse(request.body);
      const item = await commercialService.updateNextAction(context, params.itemId, input);
      return { data: item, meta: { correlationId: context.correlationId } };
    });

    app.post("/v1/local/commercial/workspace/:itemId/follow-ups", async (request, reply) => {
      const context = await resolveContext(request);
      const params = commercialItemParamsSchema.parse(request.params);
      const input = recordCommercialFollowUpSchema.parse(request.body);
      const item = await commercialService.recordFollowUp(context, params.itemId, input);
      return reply.code(201).send({ data: item, meta: { correlationId: context.correlationId } });
    });

    app.post("/v1/local/commercial/workspace/:itemId/convert-to-order", async (request, reply) => {
      const context = await resolveContext(request);
      const params = commercialItemParamsSchema.parse(request.params);
      const input = convertCommercialOpportunitySchema.parse(request.body);
      const item = await commercialService.convertValidatedOpportunity(context, params.itemId, input);
      return reply.code(201).send({ data: item, meta: { correlationId: context.correlationId } });
    });

    app.post("/v1/local/commercial/workspace/:itemId/release-to-production", async (request) => {
      const context = await resolveContext(request);
      const params = commercialItemParamsSchema.parse(request.params);
      const input = releaseCommercialOrderToProductionSchema.parse(request.body);
      const item = await commercialService.releaseOrderToProduction(context, params.itemId, input);
      return { data: item, meta: { correlationId: context.correlationId } };
    });

    app.post("/v1/local/commercial-demo/reset", async (request) => {
      const context = await resolveContext(request);
      const input = resetCommercialDemoSchema.parse(request.body);
      const result = await commercialService.resetDemo(context, input.confirmation);
      return { data: result, meta: { correlationId: context.correlationId } };
    });

    if (localWhatsAppSimulation) {
      app.get("/v1/local/whatsapp-simulated/status", async (request) => {
        const context = await resolveContext(request);
        const result = await localWhatsAppSimulation.status(context);
        return { data: result, meta: { correlationId: context.correlationId } };
      });

      app.post("/v1/local/whatsapp-simulated/workspace/:itemId/messages", async (request, reply) => {
        const context = await resolveContext(request);
        const params = commercialItemParamsSchema.parse(request.params);
        const input = simulatedOutboundSchema.parse(request.body);
        const item = await localWhatsAppSimulation.send(
          context,
          params.itemId,
          input.text,
          idempotencyKey(request),
        );
        return reply.code(201).send({ data: item, meta: { correlationId: context.correlationId } });
      });
    }
  }
}
