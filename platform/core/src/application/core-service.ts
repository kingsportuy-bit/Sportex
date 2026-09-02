import { randomUUID } from "node:crypto";
import type {
  ActorContext,
  AuditEvent,
  CertifiedPayment,
  Client,
  Currency,
  IdempotencyRecord,
  Order,
  OrderCurrentSketch,
  OrderDetails,
  OrderStatus,
  OutboxEvent,
} from "../domain/models.js";
import type { CoreStore, CoreTransaction } from "../ports/core-store.js";
import { requireCapability } from "../shared/authorization.js";
import { requestHash } from "../shared/canonical-json.js";
import { AppError, conflict, notFound } from "../shared/errors.js";
import { defaultStageDefinitions, type StageBoardKind, type StageDefinition } from "../domain/stage-configuration.js";
import type {
  CompanyConfiguration,
  CompanyProduct,
  CompanyProductInput,
  CompanyResource,
  CompanyResourceInput,
  CompanySizeChart,
  CompanySizeChartInput,
  ProductPriceTier,
  SaveCompanyConfigurationInput,
  SizeChartRow,
} from "../domain/company-configuration.js";

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
  details?: OrderDetails;
}

export interface ReleaseOrderToProductionInput {
  expectedVersion: number;
  confirmation: "ENTREGAR_A_PRODUCCION";
}

export interface MoveOrderStageInput {
  status: OrderStatus;
  expectedVersion: number;
  reason?: string;
}

export interface UpdateOrderDetailsInput {
  details: Omit<OrderDetails, "currentSketch"> & { currentSketch?: OrderCurrentSketch | null };
  expectedVersion: number;
}

export interface SaveStageDefinitionInput {
  id: string;
  name: string;
  position: number;
  terminal: boolean;
}

const orderTransitions: Record<string, OrderStatus[]> = {
  intake_pending: ["design_pending"],
  design_pending: ["intake_pending", "production_ready"],
  production_ready: ["design_pending", "in_production"],
  in_production: ["production_ready", "completed"],
  completed: [],
};

type Clock = () => Date;
type IdFactory = () => string;

export class CoreService {
  constructor(
    private readonly store: CoreStore,
    private readonly clock: Clock = () => new Date(),
    private readonly idFactory: IdFactory = randomUUID,
  ) {}

  async listStageDefinitions(context: ActorContext, board: StageBoardKind): Promise<StageDefinition[]> {
    requireCapability(context, board === "lead" ? "commercial.read" : "orders.read");
    return this.store.transaction(context.tenantId, async (transaction) => this.ensureStageDefinitions(transaction, context.tenantId, board));
  }

  async saveStageDefinition(context: ActorContext, board: StageBoardKind, input: SaveStageDefinitionInput): Promise<StageDefinition[]> {
    requireCapability(context, board === "lead" ? "commercial.manage" : "production.release");
    return this.store.transaction(context.tenantId, async (transaction) => {
      const current = await this.ensureStageDefinitions(transaction, context.tenantId, board);
      const id = this.text(input.id, "stageId", 2, 80);
      if (!/^[A-Za-z0-9_-]+$/u.test(id)) throw new AppError("invalid_payload", 400, "Invalid stage id");
      const now = this.clock().toISOString();
      const existing = current.find((stage) => stage.id === id);
      const definition: StageDefinition = {
        id, tenantId: context.tenantId, board, name: this.text(input.name, "stageName", 2, 80),
        position: this.positiveInteger(input.position, "position"), terminal: Boolean(input.terminal),
        createdAt: existing?.createdAt ?? now, updatedAt: now,
      };
      await transaction.saveStageDefinition(definition);
      await transaction.appendAudit(this.audit(context, existing ? "stage_definition.updated" : "stage_definition.created", "stage_definition", `${board}:${id}`, {
        board, stageId: id, name: definition.name, position: definition.position, terminal: definition.terminal,
      }, now));
      return transaction.listStageDefinitions(board);
    });
  }

  async deleteStageDefinition(context: ActorContext, board: StageBoardKind, id: string, replacementId?: string): Promise<StageDefinition[]> {
    requireCapability(context, board === "lead" ? "commercial.manage" : "production.release");
    return this.store.transaction(context.tenantId, async (transaction) => {
      const current = await this.ensureStageDefinitions(transaction, context.tenantId, board);
      if (current.length <= 1) throw new AppError("stage_definition_required", 409, "At least one stage is required");
      if (!current.some((stage) => stage.id === id)) throw notFound("stage_definition_not_found", "Stage definition not found");
      const replacement = replacementId?.trim();
      if (!replacement || replacement === id || !current.some((stage) => stage.id === replacement)) {
        throw new AppError("stage_definition_reassignment_required", 409, "Choose a destination stage before deleting this column");
      }
      const now = this.clock().toISOString();
      const affectedOrders = board === "order" ? (await transaction.listOrders()).filter((order) => order.status === id) : [];
      for (const order of affectedOrders) {
        const updated: Order = { ...order, status: replacement, version: order.version + 1, updatedAt: now };
        await transaction.updateOrder(updated, order.version);
        await transaction.appendAudit(this.audit(context, "order.stage_reassigned", "order", order.id, {
          orderNumber: order.orderNumber, previousStatus: id, status: replacement, reason: "Columna eliminada",
        }, now));
      }
      await transaction.deleteStageDefinition(board, id);
      await transaction.appendAudit(this.audit(context, "stage_definition.deleted", "stage_definition", `${board}:${id}`, {
        board, stageId: id, replacementId: replacement, reassignedOrders: affectedOrders.length,
      }, now));
      return transaction.listStageDefinitions(board);
    });
  }

  async reorderStageDefinition(context: ActorContext, board: StageBoardKind, id: string, direction: "earlier" | "later"): Promise<StageDefinition[]> {
    requireCapability(context, board === "lead" ? "commercial.manage" : "production.release");
    return this.store.transaction(context.tenantId, async (transaction) => {
      const current = [...await this.ensureStageDefinitions(transaction, context.tenantId, board)].sort((left, right) => left.position - right.position);
      const index = current.findIndex((stage) => stage.id === id);
      if (index < 0) throw notFound("stage_definition_not_found", "Stage definition not found");
      const other = current[direction === "earlier" ? index - 1 : index + 1];
      if (!other) return current;
      const stage = current[index]!;
      const now = this.clock().toISOString();
      // El índice único tenant+board+posición se respeta durante el intercambio.
      const temporaryPosition = Math.max(...current.map((candidate) => candidate.position)) + 1;
      await transaction.saveStageDefinition({ ...stage, position: temporaryPosition, updatedAt: now });
      await transaction.saveStageDefinition({ ...other, position: stage.position, updatedAt: now });
      await transaction.saveStageDefinition({ ...stage, position: other.position, updatedAt: now });
      await transaction.appendAudit(this.audit(context, "stage_definition.reordered", "stage_definition", `${board}:${id}`, {
        board, stageId: id, direction, position: other.position,
      }, now));
      return transaction.listStageDefinitions(board);
    });
  }

  private async ensureStageDefinitions(transaction: CoreTransaction, tenantId: string, board: StageBoardKind): Promise<StageDefinition[]> {
    const existing = await transaction.listStageDefinitions(board);
    if (existing.length > 0) return existing;
    const now = this.clock().toISOString();
    for (const stage of defaultStageDefinitions[board]) {
      await transaction.saveStageDefinition({ ...stage, tenantId, board, createdAt: now, updatedAt: now });
    }
    return transaction.listStageDefinitions(board);
  }

  async getCompanyConfiguration(context: ActorContext): Promise<CompanyConfiguration> {
    requireCapability(context, "company.read");
    return this.store.transaction(context.tenantId, async (transaction) => {
      const current = await transaction.findCompanyConfiguration();
      return current ?? this.emptyCompanyConfiguration(context);
    });
  }

  async saveCompanyConfiguration(
    context: ActorContext,
    idempotencyKey: string,
    input: SaveCompanyConfigurationInput,
  ): Promise<CommandResult<CompanyConfiguration>> {
    requireCapability(context, "company.manage");
    return this.idempotent(context, "company.configuration.save", idempotencyKey, input, async (transaction, now) => {
      const current = await transaction.findCompanyConfiguration();
      const expectedVersion = this.nonNegativeInteger(input.expectedVersion, "expectedVersion", 1_000_000_000);
      const configuration = this.normalizeCompanyConfiguration(context, input, current, now);
      await transaction.saveCompanyConfiguration(configuration, expectedVersion);
      await transaction.appendAudit(this.audit(context, "company.configuration_saved", "company_configuration", context.tenantId, {
        previousVersion: current?.version ?? 0,
        version: configuration.version,
        products: configuration.products.length,
        sizeCharts: configuration.sizeCharts.length,
        resources: configuration.resources.length,
      }, now));
      return configuration;
    });
  }

  private emptyCompanyConfiguration(context: ActorContext): CompanyConfiguration {
    const now = this.clock().toISOString();
    return {
      id: context.tenantId,
      tenantId: context.tenantId,
      brand: {
        brandName: context.tenantName?.trim() || "Mi empresa",
        legalName: null,
        primaryPhone: null,
        primaryEmail: null,
        website: null,
        description: null,
      },
      operations: {
        defaultCurrency: "UYU",
        depositPercentage: 50,
        defaultQuoteValidityDays: 7,
        defaultLeadTimeDays: 15,
        paymentMethods: [],
        deliveryMethods: [],
        salesTerms: null,
        productionNotes: null,
      },
      products: [],
      sizeCharts: [],
      resources: [],
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  private normalizeCompanyConfiguration(
    context: ActorContext,
    input: SaveCompanyConfigurationInput,
    current: CompanyConfiguration | null,
    now: string,
  ): CompanyConfiguration {
    if ((current?.version ?? 0) !== input.expectedVersion) {
      throw conflict("company_configuration_version_conflict", "Company configuration changed", {
        expectedVersion: input.expectedVersion,
        currentVersion: current?.version ?? 0,
      });
    }
    if (input.products.length > 200 || input.sizeCharts.length > 100 || input.resources.length > 200) {
      throw new AppError("invalid_payload", 400, "Company configuration exceeds supported limits");
    }

    const sizeChartIds = this.uniqueIds(input.sizeCharts.map((chart) => chart.id), "sizeChartId");
    this.uniqueIds(input.products.map((product) => product.id), "productId");
    this.uniqueIds(input.products.flatMap((product) => product.priceTiers.map((tier) => tier.id)), "priceTierId");
    this.uniqueIds(input.resources.map((resource) => resource.id), "resourceId");
    const currentProducts = new Map((current?.products ?? []).map((product) => [product.id, product]));
    const currentCharts = new Map((current?.sizeCharts ?? []).map((chart) => [chart.id, chart]));
    const currentResources = new Map((current?.resources ?? []).map((resource) => [resource.id, resource]));

    const sizeCharts = input.sizeCharts.map((chart) => this.normalizeSizeChart(chart, currentCharts.get(chart.id), now));
    const products = input.products.map((product) => {
      if (product.sizeChartId && !sizeChartIds.has(product.sizeChartId)) {
        throw new AppError("invalid_payload", 400, "Product references an unknown size chart", { productId: product.id });
      }
      return this.normalizeProduct(product, currentProducts.get(product.id), now);
    });
    const resources = input.resources.map((resource) => this.normalizeResource(resource, currentResources.get(resource.id), now));
    const website = this.optionalText(input.brand.website, "website", 3, 300);
    if (website && !/^https?:\/\//iu.test(website)) {
      throw new AppError("invalid_payload", 400, "Website must start with http:// or https://", { field: "website" });
    }
    const primaryEmail = this.optionalText(input.brand.primaryEmail, "primaryEmail", 3, 254);
    if (primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(primaryEmail)) {
      throw new AppError("invalid_payload", 400, "Invalid primaryEmail", { field: "primaryEmail" });
    }
    const primaryPhone = input.brand.primaryPhone ? this.phone(input.brand.primaryPhone) : null;
    const paymentMethods = this.stringList(input.operations.paymentMethods, "paymentMethods", 20);
    const deliveryMethods = this.stringList(input.operations.deliveryMethods, "deliveryMethods", 20);

    return {
      id: context.tenantId,
      tenantId: context.tenantId,
      brand: {
        brandName: this.text(input.brand.brandName, "brandName", 2, 120),
        legalName: this.optionalText(input.brand.legalName, "legalName", 2, 160),
        primaryPhone,
        primaryEmail,
        website,
        description: this.optionalText(input.brand.description, "description", 2, 1_000),
      },
      operations: {
        defaultCurrency: input.operations.defaultCurrency,
        depositPercentage: this.nonNegativeInteger(input.operations.depositPercentage, "depositPercentage", 100),
        defaultQuoteValidityDays: this.positiveInteger(input.operations.defaultQuoteValidityDays, "defaultQuoteValidityDays"),
        defaultLeadTimeDays: this.positiveInteger(input.operations.defaultLeadTimeDays, "defaultLeadTimeDays"),
        paymentMethods,
        deliveryMethods,
        salesTerms: this.optionalText(input.operations.salesTerms, "salesTerms", 2, 2_000),
        productionNotes: this.optionalText(input.operations.productionNotes, "productionNotes", 2, 2_000),
      },
      products,
      sizeCharts,
      resources,
      version: (current?.version ?? 0) + 1,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
  }

  private normalizeProduct(product: CompanyProductInput, current: CompanyProduct | undefined, now: string): CompanyProduct {
    if (product.priceTiers.length > 50) throw new AppError("invalid_payload", 400, "Too many price tiers");
    this.uniqueIds(product.priceTiers.map((tier) => tier.id), "priceTierId");
    const priceTiers = product.priceTiers
      .map((tier) => this.normalizePriceTier(tier))
      .sort((left, right) => left.minQuantity - right.minQuantity || left.currency.localeCompare(right.currency));
    for (const currency of ["UYU", "USD"] as const) {
      const tiers = priceTiers.filter((tier) => tier.currency === currency);
      for (let index = 1; index < tiers.length; index += 1) {
        const previous = tiers[index - 1]!;
        const next = tiers[index]!;
        if (previous.maxQuantity === null || previous.maxQuantity >= next.minQuantity) {
          throw new AppError("invalid_payload", 400, "Product price tiers overlap", { productId: product.id, currency });
        }
      }
    }
    return {
      id: this.uuid(product.id, "productId"),
      name: this.text(product.name, "productName", 2, 120),
      category: this.text(product.category, "productCategory", 2, 80),
      description: this.optionalText(product.description, "productDescription", 2, 1_000),
      active: Boolean(product.active),
      minimumQuantity: this.positiveInteger(product.minimumQuantity, "minimumQuantity"),
      defaultLeadTimeDays: this.positiveInteger(product.defaultLeadTimeDays, "productLeadTimeDays"),
      sizeChartId: product.sizeChartId ? this.uuid(product.sizeChartId, "sizeChartId") : null,
      priceTiers,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
  }

  private normalizePriceTier(tier: ProductPriceTier): ProductPriceTier {
    const minQuantity = this.positiveInteger(tier.minQuantity, "minQuantity");
    const maxQuantity = tier.maxQuantity === null ? null : this.positiveInteger(tier.maxQuantity, "maxQuantity");
    if (maxQuantity !== null && maxQuantity < minQuantity) {
      throw new AppError("invalid_payload", 400, "Price tier maximum is below minimum");
    }
    this.positiveMoney(tier.unitPriceCents, "unitPriceCents");
    return { id: this.uuid(tier.id, "priceTierId"), minQuantity, maxQuantity, unitPriceCents: tier.unitPriceCents, currency: tier.currency };
  }

  private normalizeSizeChart(chart: CompanySizeChartInput, current: CompanySizeChart | undefined, now: string): CompanySizeChart {
    if (chart.rows.length > 100) throw new AppError("invalid_payload", 400, "Too many size chart rows");
    return {
      id: this.uuid(chart.id, "sizeChartId"),
      name: this.text(chart.name, "sizeChartName", 2, 120),
      audience: chart.audience,
      notes: this.optionalText(chart.notes, "sizeChartNotes", 2, 1_000),
      rows: chart.rows.map((row) => this.normalizeSizeChartRow(row)),
      active: Boolean(chart.active),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
  }

  private normalizeSizeChartRow(row: SizeChartRow): SizeChartRow {
    const entries = Object.entries(row.measurements);
    if (entries.length > 30) throw new AppError("invalid_payload", 400, "Too many measurements in size row");
    return {
      label: this.text(row.label, "sizeLabel", 1, 40),
      measurements: Object.fromEntries(entries.map(([key, value]) => [
        this.text(key, "measurementName", 1, 60),
        this.text(value, "measurementValue", 1, 60),
      ])),
    };
  }

  private normalizeResource(resource: CompanyResourceInput, current: CompanyResource | undefined, now: string): CompanyResource {
    return {
      id: this.uuid(resource.id, "resourceId"),
      kind: resource.kind,
      name: this.text(resource.name, "resourceName", 2, 120),
      description: this.optionalText(resource.description, "resourceDescription", 2, 1_000),
      reference: this.optionalText(resource.reference, "resourceReference", 2, 500),
      active: Boolean(resource.active),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
  }

  private uniqueIds(ids: string[], field: string): Set<string> {
    const normalized = ids.map((id) => this.uuid(id, field));
    const unique = new Set(normalized);
    if (unique.size !== normalized.length) throw new AppError("invalid_payload", 400, `Duplicate ${field}`, { field });
    return unique;
  }

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
        details: this.normalizeOrderDetails(input.details),
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

  async releaseOrderToProduction(
    context: ActorContext,
    orderId: string,
    idempotencyKey: string,
    input: ReleaseOrderToProductionInput,
  ): Promise<CommandResult<Order>> {
    requireCapability(context, "production.release");
    if (input.confirmation !== "ENTREGAR_A_PRODUCCION") {
      throw new AppError("production_release_confirmation_required", 400, "Exact production release confirmation is required");
    }
    return this.idempotent(context, "orders.release_to_production", idempotencyKey, input, async (transaction, now) => {
      const current = await transaction.findOrderById(orderId);
      if (!current) throw notFound("order_not_found", "Order not found");
      if (current.status === "production_ready") return current;
      if (current.version !== input.expectedVersion) {
        throw conflict("order_version_conflict", "Order version changed", {
          expectedVersion: input.expectedVersion,
          currentVersion: current.version,
        });
      }
      const updated: Order = {
        ...current,
        status: "production_ready",
        version: current.version + 1,
        updatedAt: now,
      };
      await transaction.updateOrder(updated, current.version);
      await transaction.appendAudit(
        this.audit(context, "order.production_released", "order", updated.id, {
          orderNumber: updated.orderNumber,
          previousStatus: current.status,
          status: updated.status,
        }, now),
      );
      await transaction.enqueueOutbox({
        id: this.idFactory(),
        tenantId: context.tenantId,
        eventType: "order.production_released",
        aggregateType: "order",
        aggregateId: updated.id,
        payload: {
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          status: updated.status,
        },
        correlationId: context.correlationId,
        status: "pending",
        attempts: 0,
        availableAt: now,
        createdAt: now,
      });
      return updated;
    });
  }

  async moveOrderStage(
    context: ActorContext,
    orderId: string,
    idempotencyKey: string,
    input: MoveOrderStageInput,
  ): Promise<CommandResult<Order>> {
    requireCapability(context, "production.release");
    return this.idempotent(context, "orders.move_stage", idempotencyKey, input, async (transaction, now) => {
      const current = await transaction.findOrderById(orderId);
      if (!current) throw notFound("order_not_found", "Order not found");
      if (current.status === input.status) return current;
      if (current.version !== input.expectedVersion) {
        throw conflict("order_version_conflict", "Order version changed", {
          expectedVersion: input.expectedVersion,
          currentVersion: current.version,
        });
      }
      const configuredStages = await this.ensureStageDefinitions(transaction, context.tenantId, "order");
      if (!configuredStages.some((stage) => stage.id === input.status)) {
        throw conflict("order_stage_not_configured", "Order stage is not configured for this company", { to: input.status });
      }
      const customStage = !Object.hasOwn(orderTransitions, current.status) || !Object.hasOwn(orderTransitions, input.status);
      if (!customStage && !(orderTransitions[current.status] ?? Object.keys(orderTransitions)).includes(input.status)) {
        throw conflict("order_stage_transition_invalid", "Order stage transition is not allowed", {
          from: current.status,
          to: input.status,
        });
      }
      const updated: Order = {
        ...current,
        status: input.status,
        version: current.version + 1,
        updatedAt: now,
      };
      await transaction.updateOrder(updated, current.version);
      const reason = input.reason?.trim().slice(0, 500) || "Cambio manual desde SPORTEX";
      await transaction.appendAudit(
        this.audit(context, "order.stage_changed", "order", updated.id, {
          orderNumber: updated.orderNumber,
          previousStatus: current.status,
          status: updated.status,
          reason,
        }, now),
      );
      await transaction.enqueueOutbox({
        id: this.idFactory(),
        tenantId: context.tenantId,
        eventType: "order.stage_changed",
        aggregateType: "order",
        aggregateId: updated.id,
        payload: { orderId: updated.id, orderNumber: updated.orderNumber, previousStatus: current.status, status: updated.status },
        correlationId: context.correlationId,
        status: "pending",
        attempts: 0,
        availableAt: now,
        createdAt: now,
      });
      return updated;
    });
  }

  async updateOrderDetails(
    context: ActorContext,
    orderId: string,
    idempotencyKey: string,
    input: UpdateOrderDetailsInput,
  ): Promise<CommandResult<Order>> {
    requireCapability(context, "production.release");
    return this.idempotent(context, "orders.update_details", idempotencyKey, input, async (transaction, now) => {
      const current = await transaction.findOrderById(orderId);
      if (!current) throw notFound("order_not_found", "Order not found");
      if (current.version !== input.expectedVersion) {
        throw conflict("order_version_conflict", "Order version changed", {
          expectedVersion: input.expectedVersion,
          currentVersion: current.version,
        });
      }
      const details = this.normalizeOrderDetails({
        ...input.details,
        currentSketch: input.details.currentSketch === undefined ? current.details.currentSketch ?? null : input.details.currentSketch,
      });
      const updated: Order = { ...current, details, version: current.version + 1, updatedAt: now };
      await transaction.updateOrder(updated, current.version);
      await transaction.appendAudit(this.audit(context, "order.details_updated", "order", updated.id, {
        orderNumber: updated.orderNumber,
        fields: Object.entries(details).filter(([, value]) => Array.isArray(value) ? value.length : value !== null).map(([key]) => key),
      }, now));
      return updated;
    });
  }

  private normalizeOrderDetails(details?: OrderDetails): OrderDetails {
    if (!details) return { product: null, quantity: null, colors: [], sizes: null, notes: null, currentSketch: null };
    return {
      product: details.product ? this.text(details.product, "product", 2, 120) : null,
      quantity: details.quantity === null ? null : this.positiveInteger(details.quantity, "quantity"),
      colors: details.colors.map((color) => this.text(color, "color", 2, 60)).slice(0, 12),
      sizes: details.sizes ? this.text(details.sizes, "sizes", 2, 1_000) : null,
      notes: details.notes ? this.text(details.notes, "notes", 2, 2_000) : null,
      currentSketch: details.currentSketch ? {
        messageId: this.text(details.currentSketch.messageId, "sketch_message_id", 2, 160),
        assetId: this.text(details.currentSketch.assetId, "sketch_asset_id", 2, 160),
        mimeType: details.currentSketch.mimeType,
        fileName: this.text(details.currentSketch.fileName, "sketch_file_name", 1, 240),
        width: details.currentSketch.width === null ? null : this.positiveInteger(details.currentSketch.width, "sketch_width"),
        height: details.currentSketch.height === null ? null : this.positiveInteger(details.currentSketch.height, "sketch_height"),
      } : null,
    };
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

  private optionalText(value: string | null, field: string, min: number, max: number): string | null {
    if (value === null || value.trim() === "") return null;
    return this.text(value, field, min, max);
  }

  private stringList(values: string[], field: string, maxItems: number): string[] {
    if (values.length > maxItems) throw new AppError("invalid_payload", 400, `Too many ${field}`, { field });
    const normalized = values.map((value) => this.text(value, field, 2, 120));
    return [...new Set(normalized)];
  }

  private uuid(value: string, field: string): string {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) {
      throw new AppError("invalid_payload", 400, `Invalid ${field}`, { field });
    }
    return value.toLowerCase();
  }

  private nonNegativeInteger(value: number, field: string, max: number): number {
    if (!Number.isSafeInteger(value) || value < 0 || value > max) {
      throw new AppError("invalid_payload", 400, `Invalid ${field}`, { field });
    }
    return value;
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

  private positiveInteger(value: number, field: string): number {
    if (!Number.isSafeInteger(value) || value < 1 || value > 100_000) {
      throw new AppError("invalid_payload", 400, `Invalid ${field}`, { field });
    }
    return value;
  }
}
