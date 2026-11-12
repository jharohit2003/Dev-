import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { healthRouter } from "./modules/health/health.routes.js";

/**
 * Builds the Express app without starting a server.
 * Keeping this separate from server.ts lets tests call the app directly.
 */
export function createApp() {
  const app = express();

  // In AWS the app sits behind a load balancer. This makes req.ip the real client IP.
  app.set("trust proxy", 1);

  // Order matters: middleware runs top to bottom for every request.
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  const api = Router();
  api.use("/health", healthRouter);
  // Phase 1 onward: api.use("/auth", authRouter), api.use("/projects", projectsRouter), ...

  app.use("/api/v1", api);

  // These two must come last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
