import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";
import { logger } from "../lib/logger.js";

const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;

/**
 * Logs every request once it finishes, and gives each request an ID.
 * - Reuses an incoming X-Request-Id (for example from the load balancer) if it looks safe.
 * - Sends the ID back in the X-Request-Id response header.
 * - Adds req.log, a logger that automatically includes the request ID.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const incoming = req.headers["x-request-id"];
    const id =
      typeof incoming === "string" && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  // Keep log lines small: full headers are noisy and cost money to store.
  serializers: {
    req: (req: { id: unknown; method: string; url: string; remoteAddress?: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.remoteAddress,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
  // Health checks run every few seconds. Logging them would bury everything else.
  autoLogging: {
    ignore: (req) => req.url?.startsWith("/api/v1/health") ?? false,
  },
});
