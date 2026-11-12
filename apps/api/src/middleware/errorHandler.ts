import type { ApiErrorBody } from "@devpulse/shared";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, NotFoundError } from "../lib/errors.js";

/** Runs when no route matched. Turns it into a normal 404 error. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};

/** Errors from Express's body parser (bad JSON, body too large) carry these fields. */
function isHttpClientError(err: unknown): err is { status: number; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  );
}

/**
 * The single place where errors become HTTP responses.
 * Express 5 sends errors thrown in async route handlers here automatically.
 * Unknown errors are logged in full, but the client only gets a generic message.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = String(req.id);

  const send = (status: number, error: Omit<ApiErrorBody["error"], "requestId">) => {
    const body: ApiErrorBody = { error: { ...error, requestId } };
    res.status(status).json(body);
  };

  if (err instanceof AppError) {
    send(err.statusCode, { code: err.code, message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    send(400, { code: "VALIDATION_ERROR", message: "Invalid request", details: err.issues });
    return;
  }

  if (isHttpClientError(err)) {
    send(err.status, { code: "VALIDATION_ERROR", message: err.message });
    return;
  }

  req.log.error({ err }, "Unhandled error");
  send(500, { code: "INTERNAL_ERROR", message: "Something went wrong" });
};
