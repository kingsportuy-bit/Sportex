import { randomUUID } from "node:crypto";
import type {
  ActorContext,
  AuditEvent,
  CertifiedPayment,
  Client,
  Currency,
  IdempotencyRecord,
  Order,
  OutboxEvent,
} from "../domain/models.js";
import type { CoreStore, CoreTransaction } from "../ports/core-store.js";
import { requireCapability } from "../shared/authorization.js";
import { requestHash } from "../shared/canonical-json.js";
import { AppError, conflict, notFound } from "../shared/errors.js";

export interface CommandResult<T> {
  data: T;
  replayed: boolean;
}

export interface CreateClientInput {
  displayName: string;
  teamName?: string;
  primaryPhone?: string;
}

export interface CertifyPaymentInput {
  clientId: string;
  evidenceReference: string;
  amountCents: number;
  currency: Currency;
}

export interface CreateOrderInput {
  clientId: string;
  certifiedPaymentId: string;
  teamName: string;
  quotedTotalCents: number;
  currency: Currency;
}

type Clock = () => Date;
type IdFactory = () => string;

export class CoreService {
  constructor(
    private readonly store: CoreStore,
    private readonly clock: Clock = () => new Date(),
    private readonly idFactory: IdFactory = randomUUID,
  ) {}

  async createClient(
    context: ActorContext,
    idempotencyKey: string,
    input: CreateClientInput,
  ): Promise<CommandResult<Client>> {
    requireCapability(context, "clients.create");
    return this.idempotent(context, "clients.create", idempotencyKey, input, async (transaction, now) => {
      const displayName = this.text(input.displayName, "displayName", 2, 120);
      const teamName = input.teamName ? this.text(input.teamName, "teamName", 2, 120) : undefined;
      const primaryPhone = input.primaryPhone ? this.phone(input.primaryPhone) : undefined;
      if (primaryPhone) {
        const duplicate = await transaction.findClientByPhone(primaryPhone);
        if (duplicate) throw conflict("client_phone_conflict", "A client already uses this phone");
      }

      const client: Client = {
        id: this.idFactory(),
        tenantId: context.tenantId,
        displayName,
        ...(teamName ? { teamName } : {}),
        ...(primaryPhone ? { primaryPhone } : {}),
        status: "active",
        version: 1,
        createdAt: now,
        updatedAt: now,
      };

      await transaction.createClient(client);
      await transaction.appendAudit(
        this.audit(context, "client.created", "client", client.id, { phonePresent: Boolean(client.primaryPhone) }, now),
      );
      return client;
    });
  }

  async listClients(context: ActorContext): Promise<Client[]> {
    requireCapability(context, "clients.read");
    return this.store.transaction(context.tenantId, (transaction) => transaction.listClients());
  }

  async certifyPayment(
    context: ActorContext,
    idempotencyKey: string,
    input: CertifyPaymentInput,
  ): Promise<CommandResult<CertifiedPayment>> {
    requireCapability(context, "payments.certify");
    return this.idempotent(context, "payments.certify", idempotencyKey, input, async (transaction, now) => {
      const client = await transaction.findClientById(input.clientId);
      if (!client) throw notFound("client_not_found", "Client not found");

      const evidenceReference = this.text(input.evidenceReference, "evidenceReference", 3, 160);
      this.positiveMoney(input.amountCents, "amountCents");
      const existing = await transaction.findPaymentByEvidence(evidenceReference);
      if (existing) throw conflict("payment_evidence_conflict", "Payment evidence already certified");

      const payment: CertifiedPayment = {
        id: this.idFactory(),
        tenantId: context.tenantId,
        clientId: client.id,
        evidenceReference,
        amountCents: input.amountCents,
        currency: input.currency,
        status: "certified",
        certifiedBy: context.actorId,
        certifiedAt: now,
        createdAt: now,
      };

      await transaction.createPayment(payment);
      await transaction.appendAudit(
        this.audit(context, "payment.certified", "certified_payment", payment.id, {
          clientId: client.id,
          amountCents: payment.amountCents,
          currency: payment.currency,
        }, now),
      );
      return payment;
    });
  }

  async createOrderFromCertifiedPayment(
    context: ActorContext,
    idempotencyKey: string,
    input: CreateOrderInput,
  ): Promise<CommandResult<Order>> {
    requireCapability(context, "orders.create");
    return this.idempotent(context, "orders.create_from_payment", idempotencyKey, input, async (transaction, now) => {
      const client = await transaction.findClientById(input.clientId);
      if (!client) throw notFound("client_not_found", "Client not found");

      const payment = await transaction.findPaymentById(input.certifiedPaymentId);
      if (!payment) throw notFound("payment_not_found", "Certified payment not found");
      if (payment.clientId !== client.id) {
        throw conflict("payment_client_mismatch", "Certified payment belongs to another client");
      }
      if (payment.currency !== input.currency) {
        throw conflict("currency_mismatch", "Payment and order currencies differ");
      }
      if (input.quotedTotalCents < payment.amountCents) {
        throw conflict("quoted_total_below_deposit", "Quoted total cannot be lower than the deposit");
      }

      const previousOrder = await transaction.findOrderByPaymentId(payment.id);
      if (previousOrder) throw conflict("payment_already_used", "Certified payment already created an order");

      const sequence = await transaction.nextOrderSequence();
      const year = new Date(now).getUTCFullYear();
      const teamName = this.text(input.teamName, "teamName", 2, 120);
      this.positiveMoney(input.quotedTotalCents, "quotedTotalCents");
      const order: Order = {
        id: this.idFactory(),
        tenantId: context.tenantId,
        orderNumber: `SPX-${year}-${String(sequence).padStart(5, "0")}`,
        clientId: client.id,
        certifiedPaymentId: payment.id,
        teamName,
        status: "intake_pending",
        quotedTotalCents: input.quotedTotalCents,
        depositCents: payment.amountCents,
        balanceCents: input.quotedTotalCents - payment.amountCents,
        currency: input.currency,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };

      await transaction.createOrder(order);
      await transaction.appendAudit(
        this.audit(context, "order.created", "order", order.id, {
          clientId: client.id,
          certifiedPaymentId: payment.id,
          orderNumber: order.orderNumber,
        }, now),
      );

      const event: OutboxEvent = {
        id: this.idFactory(),
        tenantId: context.tenantId,
        eventType: "order.created",
        aggregateType: "order",
        aggregateId: order.id,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientId: client.id,
          status: order.status,
        },
        correlationId: context.correlationId,
        status: "pending",
        attempts: 0,
        availableAt: now,
        createdAt: now,
      };
      await transaction.enqueueOutbox(event);
      return order;
    });
  }

  async listOrders(context: ActorContext): Promise<Order[]> {
    requireCapability(context, "orders.read");
    return this.store.transaction(context.tenantId, (transaction) => transaction.listOrders());
  }

  private async idempotent<T>(
    context: ActorContext,
    scope: string,
    key: string,
    input: unknown,
    operation: (transaction: CoreTransaction, now: string) => Promise<T>,
  ): Promise<CommandResult<T>> {
    if (!key.trim()) throw new AppError("idempotency_key_required", 400, "Idempotency-Key is required");
    if (key.length > 200) throw new AppError("idempotency_key_invalid", 400, "Idempotency-Key is too long");
    const hash = requestHash(input);

    return this.store.transaction(context.tenantId, async (transaction) => {
      await transaction.lockIdempotency(scope, key);
      const existing = await transaction.findIdempotency<T>(scope, key);
      if (existing) {
        if (existing.requestHash !== hash) {
          throw conflict("idempotency_conflict", "Idempotency key was used with another payload");
        }
        return { data: existing.responseBody, replayed: true };
      }

      const now = this.clock().toISOString();
      const data = await operation(transaction, now);
      const resourceId = this.resourceId(data);
      const record: IdempotencyRecord<T> = {
        tenantId: context.tenantId,
        scope,
        key,
        requestHash: hash,
        responseStatus: 201,
        responseBody: data,
        resourceId,
        createdAt: now,
      };
      await transaction.saveIdempotency(record);
      return { data, replayed: false };
    });
  }

  private resourceId(value: unknown): string {
    if (!value || typeof value !== "object" || typeof (value as { id?: unknown }).id !== "string") {
      throw new Error("idempotent_result_requires_id");
    }
    return (value as { id: string }).id;
  }

  private audit(
    context: ActorContext,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
    createdAt: string,
  ): AuditEvent {
    return {
      id: this.idFactory(),
      tenantId: context.tenantId,
      actorId: context.actorId,
      action,
      resourceType,
      resourceId,
      result: "succeeded",
      correlationId: context.correlationId,
      metadata,
      createdAt,
    };
  }

  private text(value: string, field: string, min: number, max: number): string {
    const normalized = value.trim();
    if (normalized.length < min || normalized.length > max) {
      throw new AppError("invalid_payload", 400, `Invalid ${field}`, { field });
    }
    return normalized;
  }

  private phone(value: string): string {
    if (!/^\+[1-9]\d{7,14}$/u.test(value)) {
      throw new AppError("invalid_payload", 400, "Phone must use E.164 format", { field: "primaryPhone" });
    }
    return value;
  }

  private positiveMoney(value: number, field: string): void {
    if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000) {
      throw new AppError("invalid_payload", 400, `Invalid ${field}`, { field });
    }
  }
}
