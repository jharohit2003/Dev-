import type { ApiErrorBody, ErrorCode } from "@devpulse/shared";
import type { z } from "zod";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

/** An error returned by our API, with the code and request ID from the response. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ErrorCode | "NETWORK_ERROR";
  readonly requestId?: string;

  constructor(status: number, code: ApiClientError["code"], message: string, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

/**
 * The one function the app uses to call the API.
 * - Unwraps the { data } envelope.
 * - Turns error responses into ApiClientError.
 * - Validates the response against a shared Zod schema, so a backend change
 *   that breaks the contract fails loudly instead of rendering bad data.
 * Phase 1 adds the access token header and automatic refresh on 401 here.
 */
export async function apiRequest<T>(path: string, schema: z.ZodType<T>, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "include",
    });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "Cannot reach the server");
  }

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      res.status,
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? `Request failed with status ${res.status}`,
      error?.requestId,
    );
  }

  return schema.parse((body as { data: unknown }).data);
}
