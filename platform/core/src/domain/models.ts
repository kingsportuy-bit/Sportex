export type Capability =
  | "clients.create"
  | "clients.read"
  | "commercial.read"
  | "commercial.replay"
  | "commercial.manage"
  | "payments.certify"
  | "orders.create"
  | "orders.read"
  | "production.release";

export type OrderStatus = "intake_pending" | "production_ready";

export interface ActorContext {
  tenantId: string;
  tenantName?: string;
  actorId: string;
  actorEmail?: string;
  capabilities: Capability[];
  correlationId: string;
  passwordChangeRequired?: boolean;
}

export interface Membership {
  tenantId: string;
  tenantName: string;
  actorId: string;
  capabilities: Capability[];
  status: "active" | "revoked";
}

export type Currency = "UYU" | "USD";

export interface Client {
  id: string;
  tenantId: string;
  displayName: string;
  teamName?: string;
  primaryPhone?: string;
  status: "active";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CertifiedPayment {
  id: string;
  tenantId: string;
  clientId: string;
  evidenceReference: string;
  amountCents: number;
  currency: Currency;
  status: "certified";
  certifiedBy: string;
  certifiedAt: string;
  createdAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  clientId: string;
  certifiedPaymentId: string;
  teamName: string;
  status: OrderStatus;
  quotedTotalCents: number;
  depositCents: number;
  balanceCents: number;
  currency: Currency;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IdempotencyRecord<T = unknown> {
  tenantId: string;
  scope: string;
  key: string;
  requestHash: string;
  responseStatus: number;
  responseBody: T;
  resourceId: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: "succeeded" | "denied";
  correlationId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface OutboxEvent {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  status: "pending";
  attempts: number;
  availableAt: string;
  createdAt: string;
}
