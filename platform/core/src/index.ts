import { loadConfig } from "./config.js";
import { InMemoryCoreStore } from "./adapters/persistence/in-memory-core-store.js";
import { PostgresCoreStore } from "./adapters/persistence/postgres-core-store.js";
import type { CoreStore } from "./ports/core-store.js";
import { buildServer } from "./server.js";

const config = loadConfig();
const store: CoreStore = config.storeDriver === "postgres"
  ? new PostgresCoreStore(config)
  : new InMemoryCoreStore();
const app = await buildServer({ config, store });

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, "Stopping SPORTEX Core");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ host: config.host, port: config.port });
