import { healthResponseSchema } from "@devpulse/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const app = createApp();

describe("GET /api/v1/health/live", () => {
  it("returns ok in the standard response shape", async () => {
    const res = await request(app).get("/api/v1/health/live");

    expect(res.status).toBe(200);
    expect(() => healthResponseSchema.parse(res.body.data)).not.toThrow();
  });

  it("adds a request ID header", async () => {
    const res = await request(app).get("/api/v1/health/live");
    expect(res.headers["x-request-id"]).toMatch(/^[\w-]+$/);
  });

  it("reuses a safe incoming request ID", async () => {
    const res = await request(app).get("/api/v1/health/live").set("X-Request-Id", "abc-123");
    expect(res.headers["x-request-id"]).toBe("abc-123");
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/api/v1/health/live");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("error handling", () => {
  it("returns 404 in the standard error shape for unknown routes", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.requestId).toBe(res.headers["x-request-id"]);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/v1/health/live")
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
