import { spawn, spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = 8091;
const baseUrl = `http://127.0.0.1:${port}`;
const outputDirectory = resolve(root, ".sportex-local/e2e-conversation-timeline");
const demoDataFile = resolve(outputDirectory, `demo-${process.pid}.json`);
let server;
let serverOutput = "";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

async function reachable() {
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(350) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`e2e_server_exited\n${serverOutput}`);
    if (await reachable()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`e2e_server_not_ready\n${serverOutput}`);
}

await mkdir(outputDirectory, { recursive: true });
if (await reachable()) throw new Error(`sportex_e2e_port_in_use:${port}`);

try {
  run(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "-p", "core/tsconfig.json"]);
  server = spawn(process.execPath, [resolve(root, "core/dist/index.js")], {
    cwd: root,
    env: {
      ...process.env,
      SPORTEX_ENV: "development",
      SPORTEX_STORE: "memory",
      SPORTEX_DEV_AUTH: "true",
      SPORTEX_FRONTEND_DIR: resolve(root, "frontend"),
      SPORTEX_COMMERCIAL_DEMO_FILE: demoDataFile,
      SPORTEX_CONVERSATION_TIMELINE_ENABLED: "true",
      SPORTEX_RELEASE: "timeline-e2e-self-contained",
      HOST: "127.0.0.1",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const capture = (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-20_000); };
  server.stdout.on("data", capture);
  server.stderr.on("data", capture);
  await waitForServer();

  const browser = run(process.execPath, [resolve(root, "scripts/e2e-conversation-timeline-browser.mjs")], {
    env: { ...process.env, SPORTEX_BASE_URL: baseUrl, SPORTEX_E2E_OUTPUT: outputDirectory },
  });
  process.stdout.write(browser.stdout);
  if (browser.stderr) process.stderr.write(browser.stderr);
  console.log("SPORTEX_TIMELINE_E2E_SELF_CONTAINED=PASS");
} finally {
  if (server?.exitCode === null) {
    server.kill();
    await Promise.race([
      new Promise((resolveExit) => server.once("exit", resolveExit)),
      new Promise((resolveWait) => setTimeout(resolveWait, 5_000)),
    ]);
  }
  await rm(demoDataFile, { force: true });
}
