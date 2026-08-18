/**
 * PM2 process manager configuration.
 *
 * Runs ONLY the API server (NestJS, port 3000, WebSocket/realtime).
 * The Web is exported to apps/web/out and served directly by Nginx/Apache;
 * it must not consume a PM2/Node process.
 *
 * The mobile app (apps-mobile/) is intentionally NOT here — it ships to the
 * Play Store, not to the server.
 *
 * Usage (from the repo root on the server):
 *   pnpm install --frozen-lockfile
 *   NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 pnpm build
 *   pnpm --filter api exec prisma migrate deploy
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "lumac-api",
      cwd: "./apps/api",
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
