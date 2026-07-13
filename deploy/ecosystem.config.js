/**
 * PM2 process manager configuration.
 *
 * Runs ONLY the two server apps of the monorepo:
 *   - api  (NestJS, port 3000, WebSocket/realtime)
 *   - web  (Next.js, port 3001, SSR)
 *
 * The mobile app (apps-mobile/) is intentionally NOT here — it ships to the
 * Play Store, not to the server.
 *
 * Usage (from the repo root on the server):
 *   pnpm install --frozen-lockfile
 *   pnpm build                       # turbo builds api (dist/) and web (.next/)
 *   pnpm --filter api exec prisma migrate deploy
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "lumac-api",
      cwd: "./apps/api",
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "lumac-web",
      cwd: "./apps/web",
      // Run Next.js in production mode on port 3001.
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
