import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { SportexConfig } from "../config.js";
import type { ActorContext } from "../domain/models.js";
import type { RealWhatsAppIntegrationService } from "../application/real-whatsapp-integration-service.js";
import { requireCapability } from "../shared/authorization.js";
import { AppError } from "../shared/errors.js";
import type { RealWhatsAppOutboundService } from "../application/real-whatsapp-outbound-service.js";
import { z } from "zod";
import { idempotencyKey } from "./context.js";

type ContextResolver = (request: FastifyRequest) => Promise<ActorContext>;

const expectedIngressRejections = new Set([
  "evolution_contact_ambiguous",
  "evolution_event_out_of_scope",
  "evolution_group_out_of_scope",
  "evolution_message_type_out_of_scope",
]);

export function evolutionIngressErrorStatus(error: unknown): number | null {
  return error instanceof Error && expectedIngressRejections.has(error.message) ? 422 : null;
}

function secretMatches(candidate: unknown, expected: string): boolean {
  if (typeof candidate !== "string") return false;
  const actualBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function registerEvolutionWebhookRoutes(
  app: FastifyInstance,
  config: SportexConfig,
  integration: RealWhatsAppIntegrationService,
  outbound: RealWhatsAppOutboundService | null,
  resolveContext: ContextResolver,
): Promise<void> {
  app.post("/v1/webhooks/evolution", async (request, reply) => {
    if (!config.evolutionIngressEnabled || !config.evolutionWebhookSecret) {
      throw new AppError("evolution_ingress_disabled", 404, "Evolution ingress is disabled");
    }
    if (!secretMatches(request.headers["x-sportex-webhook-secret"], config.evolutionWebhookSecret)) {
      throw new AppError("evolution_webhook_unauthorized", 401, "Evolution webhook authentication failed");
    }
    let result: Awaited<ReturnType<RealWhatsAppIntegrationService["ingest"]>>;
    try {
      result = await integration.ingest(request.body);
    } catch (error) {
      const status = evolutionIngressErrorStatus(error);
      if (!status) throw error;
      return reply.code(status).send({
        error: { code: (error as Error).message, message: "Evolution event is outside the active SPORTEX scope" },
        meta: { correlationId: request.sportexCorrelationId },
      });
    }
    return reply.code(result.duplicate ? 200 : 202).send({
      data: { accepted: true, duplicate: result.duplicate },
      meta: { correlationId: request.sportexCorrelationId },
    });
  });

  app.get("/v1/integrations/evolution/status", async (request) => {
    const context = await resolveContext(request);
    requireCapability(context, "commercial.read");
    if (context.tenantId !== config.deltaTenantId) {
      throw new AppError("evolution_tenant_forbidden", 403, "Evolution integration is not available for this tenant");
    }
    return {
      data: {
        instance: config.evolutionInstance,
        ingressEnabled: config.evolutionIngressEnabled,
        outboundEnabled: Boolean(outbound),
        ...(await integration.status()),
      },
      meta: { correlationId: context.correlationId },
    };
  });

  app.post("/v1/integrations/evolution/workspace/:itemId/messages", async (request, reply) => {
    if (!outbound) throw new AppError("evolution_outbound_disabled", 409, "Evolution outbound is disabled");
    const context = await resolveContext(request);
    if (context.tenantId !== config.deltaTenantId) {
      throw new AppError("evolution_tenant_forbidden", 403, "Evolution integration is not available for this tenant");
    }
    const params = z.object({ itemId: z.string().trim().min(3).max(120) }).strict().parse(request.params);
    const body = z.object({
      text: z.string().trim().min(1).max(4_000),
      confirmation: z.literal("ENVIAR_A_WHATSAPP"),
    }).strict().parse(request.body);
    const result = await outbound.send(context, params.itemId, body.text, idempotencyKey(request));
    return reply.code(result.duplicate ? 200 : 201).send({
      data: result.record,
      meta: { correlationId: context.correlationId, replayed: result.duplicate },
    });
  });
}
