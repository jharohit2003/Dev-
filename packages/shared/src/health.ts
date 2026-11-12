import { z } from "zod";

/** Shape of GET /api/v1/health/live. Shared so the frontend can parse it safely. */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
