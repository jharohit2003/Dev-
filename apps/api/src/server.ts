import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

// A plain Node HTTP server wraps Express, so Socket.IO can attach to the same server in Phase 4.
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/**
 * Graceful shutdown. On deploy, AWS sends SIGTERM to the old container.
 * We stop taking new connections, let in-flight requests finish, then exit.
 * If that takes too long, we force exit so the deploy is not stuck.
 */
let shuttingDown = false;

function shutdown(reason: string, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, "Shutting down gracefully");

  server.close((err) => {
    if (err) {
      logger.error({ err }, "Error while closing server");
      process.exit(1);
    }
    // Phase 1 onward: close Prisma and Redis connections here.
    logger.info("Shutdown complete");
    process.exit(exitCode);
  });
  server.closeIdleConnections();

  setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// A bug we did not catch. Log it and restart cleanly rather than run in a broken state.
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  shutdown("uncaughtException", 1);
});
