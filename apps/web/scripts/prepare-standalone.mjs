import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const standaloneRoot = join(".next", "standalone");
const monorepoAppRoot = join(standaloneRoot, "apps", "web");
const runtimeRoot = existsSync(join(monorepoAppRoot, "server.js"))
  ? monorepoAppRoot
  : standaloneRoot;

if (!existsSync(join(runtimeRoot, "server.js"))) {
  throw new Error("Standalone server not found. Run `next build` first.");
}

mkdirSync(join(runtimeRoot, ".next"), { recursive: true });
cpSync("public", join(runtimeRoot, "public"), { recursive: true });
cpSync(join(".next", "static"), join(runtimeRoot, ".next", "static"), {
  recursive: true,
});

console.log(`[postbuild] standalone runtime prepared at ${runtimeRoot}`);
