import { pino } from "pino";
import { env } from "../config/env.js";

/**
 * One shared logger for the whole app.
 * - Production: one JSON object per line, ready for CloudWatch.
 * - Development: pretty, colored output for humans.
 * - Sensitive fields are replaced with [REDACTED] before they are written.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "*.password",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
        },
      }
    : {}),
});
