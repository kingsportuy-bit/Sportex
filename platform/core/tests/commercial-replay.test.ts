import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { InMemoryCommercialReplayStore } from "../src/adapters/persistence/in-memory-commercial-replay-store.js";
import { LocalJsonCommercialReplayStore } from "../src/adapters/persistence/local-json-commercial-replay-store.js";
import { CommercialReplayService } from "../src/application/commercial-replay-service.js";
import { CoreService } from "../src/application/core-service.js";
import { loadConfig, type SportexConfig } from "../src/config.js";
import type { EvolutionReplayEvent } from "../src/domain/commercial-models.js";
import type { ActorContext } from "../src/domain/models.js";
import { InMemoryCoreStore } from "../src/adapters/persistence/in-memory-core-store.js";
import { createCommercialDemoSeed } from "../src/fixtures/commercial-demo-seed.js";
import { buildServer } from "../src/server.js";
import { AppError } from "../src/shared/errors.js";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const technicalTokenProbe = "NUEVO|EN_CALIFICACION|COTIZADO|EN_SEGUIMIENTO|PERDIDO|SENA_VALIDADA|SIN_CAMBIOS|AVANZO|SIN_RESPUESTA|NO_CONTINUA|";

function maximumTechnicalTokenNote(): string {
  return technicalTokenProbe.repeat(Math.ceil(999 / technicalTokenProbe.length)).slice(0, 999) + "Z";
}

const context = (tenantId = tenantA, capabilities: ActorContext["capabilities"] = [
  "commercial.read",
  "commercial.replay",
]): ActorContext => ({
  tenantId,
  actorId: actor,
  capabilities,
  correlationId: `corr-${tenantId}`,
});

function fixture(
  suffix: string,
  options: { exact?: boolean; conversation?: string } = {},
): EvolutionReplayEvent {
  return {
    event: "messages.upsert",
    instance: "LOCAL_FIXTURE",
    data: {
      key: {
        id: `msg-ficticio-${suffix}`,
        remoteJid: `contacto-ficticio-${options.conversation ?? suffix}`,
        fromMe: false,
      },
      pushName: `Contacto ficticio ${suffix}`,
      messageTimestamp: "2026-08-02T18:30:00.000Z",
      message: {
        conversation: "Hola, quiero consultar por camisetas para mi equipo.",
      },
      ...(options.exact ? {
        contextInfo: {
          externalAdReply: {
            sourceId: `ad-ficticio-${suffix}`,
            sourceUrl: `https://example.invalid/anuncio/${suffix}`,
            ctwaClid: `ctwa-ficticio-${suffix}`,
            ref: `ref-ficticia-${suffix}`,
          },
        },
      } : {}),
    },
  };
}

function isAppError(code: string): (error: unknown) => boolean {
  return (error) => error instanceof AppError && error.code === code;
}

test("replay normalizes exact and unknown attribution without inventing an ad", async () => {
  const store = new InMemoryCommercialReplayStore();
  const service = new CommercialReplayService(store, () => new Date("2026-08-02T18:31:00.000Z"));

  const exact = await service.replay(context(), "replay-exacto", fixture("exacto", { exact: true }));
  const unknown = await service.replay(context(), "replay-desconocido", fixture("desconocido"));

  assert.equal(exact.data.attribution.classification, "META_EXACTO");
  assert.equal(exact.data.attribution.adId, "ad-ficticio-exacto");
  assert.equal(unknown.data.attribution.classification, "DESCONOCIDO");
  assert.equal(unknown.data.attribution.adId, null);
  assert.equal(exact.data.conversation.messages[0]?.direction, "CLIENTE");
  assert.equal(exact.data.opportunity.stage, "NUEVO");
  assert.equal(exact.data.opportunity.nextAction, "Revisar conversación y calificar la consulta");
});

test("provider message and request key are idempotent while tenants remain isolated", async () => {
  const store = new InMemoryCommercialReplayStore();
  const service = new CommercialReplayService(store);
  const input = fixture("dedupe", { exact: true });

  const created = await service.replay(context(tenantA), "key-a", input);
  const providerReplay = await service.replay(context(tenantA), "key-b", input);
  const otherTenant = await service.replay(context(tenantB), "key-a", input);

  assert.equal(created.replayed, false);
  assert.equal(providerReplay.replayed, true);
  assert.equal(providerReplay.data.id, created.data.id);
  assert.notEqual(otherTenant.data.id, created.data.id);
  assert.equal((await service.list(context(tenantA))).length, 1);
  assert.equal((await service.list(context(tenantB))).length, 1);

  await assert.rejects(
    service.replay(context(tenantA), "key-a", fixture("otro")),
    isAppError("idempotency_conflict"),
  );
  await assert.rejects(
    service.list(context(tenantA, [])),
    isAppError("permission_denied"),
  );
});

test("image bytes stay private and unread state advances per actor and conversation", async () => {
  const store = new InMemoryCommercialReplayStore();
  const service = new CommercialReplayService(store, () => new Date("2026-08-16T18:00:00.000Z"));
  const dataBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const bytes = Buffer.from(dataBase64, "base64");
  const created = await service.replay(context(), "image-inbound", {
    ...fixture("image", { conversation: "image" }),
    data: { ...fixture("image", { conversation: "image" }).data, message: { imageMessage: {
      caption: "Referencia del diseño", mimetype: "image/png", fileName: "referencia.png",
      fileLength: bytes.length, fileSha256: createHash("sha256").update(bytes).digest("hex"),
      dataBase64,
    } } },
  });
  let listed = await service.list(context());
  assert.equal(listed[0]?.conversation.unreadCount, 1);
  assert.equal(listed[0]?.conversation.messages[0]?.contentType, "IMAGE");
  assert.equal("dataBase64" in (listed[0]?.conversation.messages[0]?.media ?? {}), false);
  const asset = await service.media(context(), created.data.conversation.messages[0]!.id);
  assert.match(asset.dataBase64, /^iVBOR/u);
  await service.markConversationRead(context(), created.data.id);
  listed = await service.list(context());
  assert.equal(listed[0]?.conversation.unreadCount, 0);
  await assert.rejects(() => service.media(context(tenantB), created.data.conversation.messages[0]!.id), isAppError("commercial_media_not_found"));
});

const localConfig: SportexConfig = {
  environment: "test",
  storeDriver: "memory",
  devAuthEnabled: true,
  tablePrefix: "sportex_staging_",
  host: "127.0.0.1",
  port: 8080,
};

function headers(idempotency = "local-replay-001"): Record<string, string> {
  return {
    "x-sportex-tenant-id": tenantA,
    "x-sportex-actor-id": actor,
    "x-sportex-capabilities": "commercial.read,commercial.replay",
    "idempotency-key": idempotency,
    "x-correlation-id": "corr-commercial-api",
  };
}

test("local API exposes the fictional replay and its visible workspace projection", async () => {
  const app = await buildServer({ config: localConfig, store: new InMemoryCoreStore(), logger: false });
  const publicConfig = await app.inject({ method: "GET", url: "/v1/public-config" });
  assert.equal(publicConfig.json().data.localCommercialReplayEnabled, true);

  const created = await app.inject({
    method: "POST",
    url: "/v1/local/evolution-replays",
    headers: headers(),
    payload: fixture("api", { exact: true }),
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json().data.attribution.adId, "ad-ficticio-api");

  const listed = await app.inject({
    method: "GET",
    url: "/v1/commercial/workspace",
    headers: headers("list-no-idempotency-use"),
  });
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json().data.length, 1);
  assert.equal(listed.json().data[0].opportunity.stage, "NUEVO");
  assert.equal(listed.json().data[0].timeline.some((entry: { kind: string }) => entry.kind === "MESSAGE"), true);
  assert.equal(
    listed.json().data[0].timeline.some((entry: { kind: string; eventType?: string }) =>
      entry.kind === "OPERATIONAL_EVENT" && entry.eventType === "OPPORTUNITY_CREATED"),
    true,
  );

  const maximumNote = maximumTechnicalTokenNote();
  const followed = await app.inject({
    method: "POST",
    url: `/v1/local/commercial/workspace/${listed.json().data[0].id}/follow-ups`,
    headers: {
      ...headers("follow-up-max-note-api"),
      "x-sportex-capabilities": "commercial.read,commercial.replay,commercial.manage",
    },
    payload: { note: maximumNote, outcome: "SIN_RESPUESTA", expectedVersion: 1 },
  });
  assert.equal(followed.statusCode, 201);
  assert.equal(followed.json().data.opportunity.followUps.at(-1).note, maximumNote);
  assert.equal(
    followed.json().data.timeline.find((entry: { eventType?: string }) =>
      entry.eventType === "FOLLOW_UP_RECORDED")?.detail,
    `Sin respuesta: ${maximumNote}`,
  );

  const sent = await app.inject({
    method: "POST",
    url: `/v1/local/whatsapp-simulated/workspace/${listed.json().data[0].id}/messages`,
    headers: {
      ...headers("simulated-outbound-api-001"),
      "x-sportex-capabilities": "commercial.read,commercial.replay,commercial.manage",
    },
    payload: { text: "Respuesta manual desde la mesa local" },
  });
  assert.equal(sent.statusCode, 201);
  assert.equal(sent.json().data.conversation.messages.length, 2);
  assert.equal(sent.json().data.conversation.messages.at(-1).direction, "DELTA");
  const transportStatus = await app.inject({
    method: "GET",
    url: "/v1/local/whatsapp-simulated/status",
    headers: {
      ...headers("status-does-not-use-idempotency"),
      "x-sportex-capabilities": "commercial.read",
    },
  });
  assert.equal(transportStatus.statusCode, 200);
  assert.equal(transportStatus.json().data.ingress.PROCESSED, 1);
  assert.equal(transportStatus.json().data.pendingOutbound, 0);
  await app.close();
});

test("commercial replay routes are absent outside the safe local gate", async () => {
  const config: SportexConfig = { ...localConfig, devAuthEnabled: false };
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const publicConfig = await app.inject({ method: "GET", url: "/v1/public-config" });
  assert.equal(publicConfig.json().data.localCommercialReplayEnabled, false);
  const replay = await app.inject({
    method: "POST",
    url: "/v1/local/evolution-replays",
    headers: headers(),
    payload: fixture("blocked"),
  });
  assert.equal(replay.statusCode, 404);
  await app.close();
});

test("PostgreSQL enables the commercial projection without exposing local replay mutations", async () => {
  const config: SportexConfig = {
    ...localConfig,
    storeDriver: "postgres",
    databaseUrl: "postgres://sportex:fixture@127.0.0.1:1/sportex",
  };
  const app = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
  const publicConfig = await app.inject({ method: "GET", url: "/v1/public-config" });
  assert.equal(publicConfig.statusCode, 200);
  assert.equal(publicConfig.json().data.commercialWorkspaceEnabled, true);
  assert.equal(publicConfig.json().data.localCommercialReplayEnabled, false);

  const replay = await app.inject({
    method: "POST",
    url: "/v1/local/evolution-replays",
    headers: headers(),
    payload: fixture("postgres-blocked"),
  });
  const mutation = await app.inject({
    method: "PATCH",
    url: "/v1/local/commercial/workspace/workspace-fixture/stage",
    headers: headers(),
    payload: { stage: "EN_CALIFICACION", expectedVersion: 1 },
  });
  assert.equal(replay.statusCode, 404);
  assert.equal(mutation.statusCode, 404);
  const simulatedOutbound = await app.inject({
    method: "POST",
    url: "/v1/local/whatsapp-simulated/workspace/workspace-fixture/messages",
    headers: headers(),
    payload: { text: "Debe permanecer bloqueado" },
  });
  assert.equal(simulatedOutbound.statusCode, 404);
  await app.close();
});

test("commercial demo seed contains 18 safe and varied fictional dossiers", () => {
  const seed = createCommercialDemoSeed(tenantA);
  assert.equal(seed.length, 18);
  assert.deepEqual(
    Object.fromEntries([...new Set(seed.map((item) => item.opportunity.stage))]
      .map((stage) => [stage, seed.filter((item) => item.opportunity.stage === stage).length])),
    {
      NUEVO: 4,
      EN_CALIFICACION: 4,
      COTIZADO: 3,
      EN_SEGUIMIENTO: 3,
      PERDIDO: 2,
      SENA_VALIDADA: 2,
    },
  );
  assert.equal(seed.filter((item) => item.lead.productType === "CAMISETAS").length, 9);
  assert.equal(seed.filter((item) => item.lead.productType === "EQUIPO_COMPLETO").length, 9);
  assert.equal(seed.filter((item) => item.attribution.classification === "DESCONOCIDO").length, 4);
  assert.equal(new Set(seed.map((item) => item.attribution.adId).filter(Boolean)).size, 4);

  for (const item of seed) {
    assert.equal(item.tenantId, tenantA);
    assert.equal(item.contact.tenantId, tenantA);
    assert.equal(item.conversation.contactId, item.contact.id);
    assert.equal(item.lead.contactId, item.contact.id);
    assert.equal(item.opportunity.contactId, item.contact.id);
    assert.equal(item.contact.providerContactRef, item.conversation.providerConversationRef);
    assert.equal(item.fixtureVersion, "commercial-demo-v1");
    assert.match(item.id, /^workspace-ficticio-/u);
    assert.ok(item.lead.quantity && item.lead.quantity >= 10);
    assert.equal(
      item.lead.sizeBreakdown.reduce((total, size) => total + size.quantity, 0),
      item.lead.quantity,
    );
    assert.ok(item.conversation.messages.length >= 4);
    assert.deepEqual(
      [...item.conversation.messages].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
      item.conversation.messages,
    );
    assert.deepEqual(new Set(item.conversation.messages.map((message) => message.direction)), new Set(["CLIENTE", "DELTA"]));
    assert.ok(item.conversation.messages.every((message) => message.fixtureOnly));
    if (item.attribution.classification === "DESCONOCIDO") {
      assert.equal(item.attribution.adId, null);
      assert.equal(item.attribution.creative, null);
      assert.equal(item.attribution.sourceUrl, null);
    } else {
      assert.equal(new URL(item.attribution.sourceUrl ?? "").hostname, "example.invalid");
      assert.match(item.attribution.adId ?? "", /^ad-ficticio-/u);
    }
  }
});

test("Core governs stage, next action, follow-up, versions, permissions and reset", async () => {
  const store = new InMemoryCommercialReplayStore();
  const service = new CommercialReplayService(
    store,
    () => new Date("2026-08-03T15:00:00.000Z"),
    () => "generated-fictitious-id",
    createCommercialDemoSeed,
  );
  const manager = context(tenantA, ["commercial.read", "commercial.manage"]);
  const initial = await service.list(manager);
  const target = initial.find((item) => item.opportunity.stage === "NUEVO");
  assert.ok(target);

  await assert.rejects(
    service.updateStage(manager, target.id, { stage: "SENA_VALIDADA", expectedVersion: 1 }),
    isAppError("commercial_stage_transition_invalid"),
  );
  const qualified = await service.updateStage(manager, target.id, {
    stage: "EN_CALIFICACION",
    expectedVersion: 1,
    reason: "Calificación manual ficticia",
  });
  assert.equal(qualified.opportunity.version, 2);
  assert.equal(qualified.opportunity.stageHistory.at(-1)?.to, "EN_CALIFICACION");

  const nextAction = await service.updateNextAction(manager, target.id, {
    description: "Confirmar talles faltantes en la demo",
    dueAt: "2026-08-09",
    expectedVersion: 2,
  });
  assert.equal(nextAction.opportunity.version, 3);
  assert.equal(nextAction.opportunity.nextActionDueAt, "2026-08-09");

  const followed = await service.recordFollowUp(manager, target.id, {
    note: "Se revisó la ficha ficticia; faltan dos talles.",
    outcome: "AVANZO",
    expectedVersion: 3,
  });
  assert.equal(followed.opportunity.version, 4);
  assert.equal(followed.opportunity.followUps.at(-1)?.outcome, "AVANZO");
  assert.equal(followed.conversation.messages.length, target.conversation.messages.length);

  await assert.rejects(
    service.updateNextAction(manager, target.id, {
      description: "Versión desactualizada",
      dueAt: null,
      expectedVersion: 1,
    }),
    isAppError("commercial_version_conflict"),
  );
  await assert.rejects(
    service.updateStage(context(tenantA, ["commercial.read"]), target.id, {
      stage: "PERDIDO",
      expectedVersion: 4,
    }),
    isAppError("permission_denied"),
  );
  assert.equal((await service.list(context(tenantB, ["commercial.read"]))).length, 18);
  await assert.rejects(
    service.resetDemo(manager, "NO"),
    isAppError("commercial_demo_confirmation_required"),
  );
  const reset = await service.resetDemo(manager, "RESTAURAR_DATOS_FICTICIOS");
  assert.deepEqual(reset, { restored: 18, fixtureVersion: "commercial-demo-v1" });
  const restored = await service.list(manager);
  assert.equal(restored.find((item) => item.id === target.id)?.opportunity.version, 1);
});

test("validated deposit converts once into Core client, payment and order", async () => {
  const commercialStore = new InMemoryCommercialReplayStore();
  const coreStore = new InMemoryCoreStore();
  const now = () => new Date("2026-08-14T15:00:00.000Z");
  const core = new CoreService(coreStore, now);
  const service = new CommercialReplayService(
    commercialStore,
    now,
    undefined,
    createCommercialDemoSeed,
    core,
  );
  const manager = context(tenantA, [
    "commercial.read",
    "commercial.manage",
    "clients.create",
    "payments.certify",
    "orders.create",
  ]);
  const target = (await service.list(manager)).find((item) => item.opportunity.stage === "SENA_VALIDADA");
  assert.ok(target);

  const converted = await service.convertValidatedOpportunity(manager, target.id, {
    evidenceReference: "fixture-transferencia-delta-001",
    depositCents: 500_000,
    expectedVersion: target.opportunity.version,
  });
  const replayed = await service.convertValidatedOpportunity(manager, target.id, {
    evidenceReference: "fixture-transferencia-delta-001",
    depositCents: 500_000,
    expectedVersion: target.opportunity.version,
  });

  assert.equal(converted.opportunity.coreConversion?.orderId, replayed.opportunity.coreConversion?.orderId);
  assert.match(converted.opportunity.coreConversion?.orderNumber ?? "", /^SPX-2026-/u);
  assert.equal(converted.opportunity.nextAction, "Preparar el pedido para producción");
  assert.equal(converted.activity.at(-1)?.type, "ORDER_CREATED");
  assert.equal(coreStore.snapshot().clients.length, 1);
  assert.equal(coreStore.snapshot().payments.length, 1);
  assert.equal(coreStore.snapshot().orders.length, 1);
  assert.equal(coreStore.snapshot().orders[0]?.details.quantity, target.lead.quantity);
  assert.deepEqual(coreStore.snapshot().orders[0]?.details.colors, target.lead.colors);
  assert.equal(coreStore.snapshot().outboxEvents.length, 1);

  await assert.rejects(
    service.convertValidatedOpportunity(manager, target.id, {
      evidenceReference: "otra-transferencia",
      depositCents: 500_000,
      expectedVersion: converted.opportunity.version,
    }),
    isAppError("commercial_conversion_conflict"),
  );
});

test("commercial conversion requires a quoted opportunity before certifying the deposit", async () => {
  const commercialStore = new InMemoryCommercialReplayStore();
  const coreStore = new InMemoryCoreStore();
  const core = new CoreService(coreStore);
  const service = new CommercialReplayService(
    commercialStore,
    undefined,
    undefined,
    createCommercialDemoSeed,
    core,
  );
  const manager = context(tenantA, [
    "commercial.read",
    "commercial.manage",
    "clients.create",
    "payments.certify",
    "orders.create",
  ]);
  const target = (await service.list(manager)).find((item) => item.opportunity.stage === "NUEVO");
  assert.ok(target);

  await assert.rejects(
    service.convertValidatedOpportunity(manager, target.id, {
      evidenceReference: "fixture-transferencia-bloqueada",
      depositCents: 100_000,
      expectedVersion: target.opportunity.version,
    }),
    isAppError("commercial_deposit_not_validated"),
  );
  assert.equal(coreStore.snapshot().clients.length, 0);
  assert.equal(coreStore.snapshot().orders.length, 0);
});

test("local JSON store persists across reconstruction and fails closed on corruption", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sportex-crm-"));
  const file = join(directory, "commercial-demo-v1.json");
  const corruptFile = join(directory, "corrupt.json");
  const manager = context(tenantA, ["commercial.read", "commercial.manage"]);
  try {
    const firstStore = new LocalJsonCommercialReplayStore(file);
    const firstService = new CommercialReplayService(
      firstStore,
      () => new Date("2026-08-03T16:00:00.000Z"),
      () => "persistent-fictitious-id",
      createCommercialDemoSeed,
    );
    const target = (await firstService.list(manager))[0];
    assert.ok(target);
    const changed = await firstService.updateNextAction(manager, target.id, {
      description: "Esta acción debe sobrevivir el reinicio",
      dueAt: "2026-08-12",
      expectedVersion: target.opportunity.version,
    });
    await firstStore.close();

    const secondStore = new LocalJsonCommercialReplayStore(file);
    const secondService = new CommercialReplayService(secondStore, undefined, undefined, createCommercialDemoSeed);
    const persisted = (await secondService.list(manager)).find((item) => item.id === target.id);
    assert.equal(persisted?.opportunity.nextAction, "Esta acción debe sobrevivir el reinicio");
    assert.equal(persisted?.opportunity.version, changed.opportunity.version);
    await secondStore.close();

    const legacyState = JSON.parse(await readFile(file, "utf8")) as {
      items: Array<Record<string, unknown>>;
    };
    delete legacyState.items[0]?.contact;
    await writeFile(file, `${JSON.stringify(legacyState)}\n`, "utf8");
    const compatibleStore = new LocalJsonCommercialReplayStore(file);
    const compatibleService = new CommercialReplayService(
      compatibleStore,
      undefined,
      undefined,
      createCommercialDemoSeed,
    );
    const compatibleItem = (await compatibleService.list(manager)).find((item) => item.id === target.id);
    assert.equal(
      compatibleItem?.contact.providerContactRef,
      compatibleItem?.conversation.providerConversationRef,
    );
    await compatibleStore.close();

    await writeFile(corruptFile, "{estado-invalido", "utf8");
    const corruptStore = new LocalJsonCommercialReplayStore(corruptFile);
    await assert.rejects(
      corruptStore.transaction(tenantA, (transaction) => transaction.list()),
      /commercial_demo_file_invalid/u,
    );
    assert.equal(await readFile(corruptFile, "utf8"), "{estado-invalido");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("persistent CRM API edits, restarts and restores only fictional fixtures", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sportex-api-crm-"));
  const file = join(directory, "commercial-demo-v1.json");
  const config: SportexConfig = { ...localConfig, commercialDemoFile: file };
  const managerHeaders = {
    ...headers(),
    "x-sportex-capabilities": "commercial.read,commercial.replay,commercial.manage,clients.create,clients.read,payments.certify,orders.create,orders.read,production.release",
  };
  try {
    const firstApp = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
    const listed = await firstApp.inject({ method: "GET", url: "/v1/commercial/workspace", headers: managerHeaders });
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.json().data.length, 18);
    const target = listed.json().data.find((item: { opportunity: { stage: string } }) => item.opportunity.stage === "NUEVO");
    assert.ok(target);
    const changed = await firstApp.inject({
      method: "PATCH",
      url: `/v1/local/commercial/workspace/${target.id}/stage`,
      headers: managerHeaders,
      payload: { stage: "EN_CALIFICACION", expectedVersion: target.opportunity.version },
    });
    assert.equal(changed.statusCode, 200);
    assert.equal(changed.json().data.opportunity.stage, "EN_CALIFICACION");
    await firstApp.close();

    const secondApp = await buildServer({ config, store: new InMemoryCoreStore(), logger: false });
    const afterRestart = await secondApp.inject({ method: "GET", url: "/v1/commercial/workspace", headers: managerHeaders });
    const persisted = afterRestart.json().data.find((item: { id: string }) => item.id === target.id);
    assert.equal(persisted.opportunity.stage, "EN_CALIFICACION");
    const reset = await secondApp.inject({
      method: "POST",
      url: "/v1/local/commercial-demo/reset",
      headers: managerHeaders,
      payload: { confirmation: "RESTAURAR_DATOS_FICTICIOS" },
    });
    assert.equal(reset.statusCode, 200);
    assert.equal(reset.json().data.restored, 18);
    const restored = await secondApp.inject({ method: "GET", url: "/v1/commercial/workspace", headers: managerHeaders });
    assert.equal(restored.json().data.find((item: { id: string }) => item.id === target.id).opportunity.stage, "NUEVO");

    const convertible = restored.json().data.find((item: { opportunity: { stage: string } }) => item.opportunity.stage === "SENA_VALIDADA");
    assert.ok(convertible);
    const converted = await secondApp.inject({
      method: "POST",
      url: `/v1/local/commercial/workspace/${convertible.id}/convert-to-order`,
      headers: managerHeaders,
      payload: {
        evidenceReference: "fixture-api-transferencia-001",
        depositCents: 250_000,
        expectedVersion: convertible.opportunity.version,
      },
    });
    assert.equal(converted.statusCode, 201);
    assert.match(converted.json().data.opportunity.coreConversion.orderNumber, /^SPX-\d{4}-/u);
    const released = await secondApp.inject({
      method: "POST",
      url: `/v1/local/commercial/workspace/${convertible.id}/release-to-production`,
      headers: managerHeaders,
      payload: {
        expectedVersion: converted.json().data.opportunity.version,
        confirmation: "ENTREGAR_A_PRODUCCION",
      },
    });
    assert.equal(released.statusCode, 200);
    assert.ok(released.json().data.opportunity.coreConversion.productionReleasedAt);
    assert.equal(released.json().data.opportunity.nextAction, "Coordinar la primera etapa de producción");
    const orders = await secondApp.inject({ method: "GET", url: "/v1/orders", headers: managerHeaders });
    const clients = await secondApp.inject({ method: "GET", url: "/v1/clients", headers: managerHeaders });
    assert.equal(orders.json().data.length, 1);
    assert.equal(orders.json().data[0].status, "production_ready");
    assert.equal(clients.json().data.length, 1);
    await secondApp.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("persistent commercial demo configuration is rejected outside the local triple guard", () => {
  const base = {
    SPORTEX_COMMERCIAL_DEMO_FILE: "C:\\fixture\\commercial-demo.json",
  };
  assert.throws(() => loadConfig({ ...base, SPORTEX_ENV: "development", SPORTEX_STORE: "memory", SPORTEX_DEV_AUTH: "false" }), /commercial_demo_file_forbidden/u);
  assert.throws(() => loadConfig({ ...base, SPORTEX_ENV: "test", SPORTEX_STORE: "postgres", SPORTEX_DEV_AUTH: "true", DATABASE_URL: "postgres://fixture" }), /commercial_demo_file_forbidden/u);
  assert.throws(() => loadConfig({ ...base, SPORTEX_ENV: "staging", SPORTEX_STORE: "postgres", SPORTEX_DEV_AUTH: "false", DATABASE_URL: "postgres://fixture", SPORTEX_TABLE_PREFIX: "sportex_staging_", SPORTEX_DATABASE_ROLE: "sportex_staging_app", SPORTEX_AUTH_INTERNAL_URL: "https://auth.example.invalid", SPORTEX_AUTH_PUBLIC_URL: "https://auth.example.invalid", SPORTEX_AUTH_ANON_KEY: "fixture-anon-key-1234567890" }), /commercial_demo_file_forbidden/u);
});
