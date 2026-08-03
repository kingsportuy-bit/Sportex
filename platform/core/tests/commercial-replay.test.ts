import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryCommercialReplayStore } from "../src/adapters/persistence/in-memory-commercial-replay-store.js";
import { CommercialReplayService } from "../src/application/commercial-replay-service.js";
import type { SportexConfig } from "../src/config.js";
import type { EvolutionReplayEvent } from "../src/domain/commercial-models.js";
import type { ActorContext } from "../src/domain/models.js";
import { InMemoryCoreStore } from "../src/adapters/persistence/in-memory-core-store.js";
import { buildServer } from "../src/server.js";
import { AppError } from "../src/shared/errors.js";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const actor = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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
