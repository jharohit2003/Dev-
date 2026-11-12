import type { HealthResponse } from "@devpulse/shared";
import { Router } from "express";

export const healthRouter = Router();

/**
 * Liveness: "is the process running and able to answer?"
 * Used by the container platform to decide when to restart the app.
 * A /health/ready check (database and Redis reachable) is added in Phase 1.
 */
healthRouter.get("/live", (_req, res) => {
  const data: HealthResponse = {
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  res.json({ data });
});
