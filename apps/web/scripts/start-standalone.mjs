import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const candidates = [
  resolve(".next", "standalone", "apps", "web", "server.js"),
  resolve(".next", "standalone", "server.js"),
];
const server = candidates.find(existsSync);

if (!server) {
  throw new Error("Standalone server not found. Run `pnpm build` first.");
}

await import(pathToFileURL(server).href);
