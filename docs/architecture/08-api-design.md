# 08. API Design

> The rules every endpoint follows, and the list of endpoints.

## In simple words

A consistent API is easier to use and debug. Every endpoint follows the same rules for URLs, responses, errors, and pagination.

## URL rules

- Base path: `/api/v1`. The `v1` lets you release `v2` later without breaking old clients.
- Plural nouns: `/projects`, `/tasks`.
- Nest only one level: `/projects/:id/tasks` is fine. `/orgs/:id/projects/:id/sprints/:id/tasks` is not.
- HTTP methods carry the meaning:

| Method | Meaning | Success code |
|---|---|---|
| GET | Read | 200 |
| POST | Create, or trigger an action | 201 (created) or 202 (accepted, will happen later) |
| PATCH | Update some fields | 200 |
| DELETE | Delete | 204 |

## Response shape

Success:

```json
{ "data": { "id": "…", "title": "Fix login bug" } }
```

List with pagination:

```json
{
  "data": [ … ],
  "pagination": { "nextCursor": "eyJpZCI6Ij…", "hasMore": true }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": [{ "path": "title", "message": "Required" }],
    "requestId": "a1b2c3"
  }
}
```

`requestId` lets you find the exact log lines for a user's bug report.

## Error codes

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad input |
| 401 | `UNAUTHENTICATED` | Missing or expired token |
| 403 | `FORBIDDEN` | Logged in but not allowed |
| 404 | `NOT_FOUND` | Doesn't exist, **or** belongs to another organization |
| 409 | `CONFLICT` | Duplicate, or the record changed since you loaded it |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Bug on our side |

Return 404, not 403, for another organization's records. A 403 would confirm the record exists.

## Pagination

Use **cursor pagination** for feeds and lists that grow: "give me 20 items after this one". It stays fast on large tables and doesn't skip or repeat items when new rows are added. Simple offset pagination (`?page=3`) is fine for small admin lists.

## Validation

Every request body, query string, and URL parameter is checked by a Zod schema from `packages/shared`. The frontend uses the same schema for its forms.

## Idempotency for important POSTs

If a user double-clicks "Generate summary", you shouldn't create two jobs. The client can send an `Idempotency-Key` header. The server stores the key in Redis for a short time and returns the first result for repeats.

## Endpoints

### Auth

| Method | Path | Who |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Cookie |
| POST | `/auth/logout` | Logged in |
| GET | `/auth/github` and `/auth/github/callback` | Public |
| GET | `/me` | Logged in |

### Organizations and members

| Method | Path | Who |
|---|---|---|
| POST | `/organizations` | Logged in |
| GET | `/organizations/:id/members` | All roles |
| POST | `/organizations/:id/invitations` | Admin |
| PATCH | `/organizations/:id/members/:userId` | Admin |
| DELETE | `/organizations/:id/members/:userId` | Admin |

### Projects, sprints, tasks

| Method | Path | Who |
|---|---|---|
| GET, POST | `/projects` | Read all, create Admin/Manager |
| GET, PATCH, DELETE | `/projects/:id` | Write Admin/Manager |
| GET, POST | `/projects/:id/sprints` | Create Admin/Manager |
| PATCH | `/sprints/:id` | Admin/Manager |
| POST | `/sprints/:id/start`, `/sprints/:id/complete` | Admin/Manager |
| GET, POST | `/projects/:id/tasks` | All roles |
| GET, PATCH, DELETE | `/tasks/:id` | All roles (delete Admin/Manager) |
| POST | `/tasks/:id/move` | All roles. Body: `{ status, beforeId?, afterId? }` |
| GET, POST | `/tasks/:id/comments` | All roles |

### GitHub

| Method | Path | Who |
|---|---|---|
| GET | `/github/install` | Admin/Manager. Redirects to GitHub App install |
| GET | `/github/repositories` | Admin/Manager. Repos available to link |
| POST | `/projects/:id/repositories` | Admin/Manager |
| GET | `/projects/:id/pull-requests` | All roles |
| POST | `/webhooks/github` | GitHub only (signature checked) |

### AI

| Method | Path | Who |
|---|---|---|
| POST | `/sprints/:id/summary` | Admin/Manager. Returns 202 |
| GET | `/sprints/:id/summary` | All roles |
| GET | `/pull-requests/:id/summary` | All roles |
| POST | `/pull-requests/:id/summary/regenerate` | Admin/Manager |

### Analytics, activity, notifications

| Method | Path | Who |
|---|---|---|
| GET | `/analytics/projects/:id?from=&to=` | Admin/Manager |
| GET | `/analytics/users/:id?from=&to=` | Self, or Admin/Manager |
| GET | `/projects/:id/activity` | All roles |
| GET | `/notifications` | Self |
| PATCH | `/notifications/:id/read` | Self |
| POST | `/notifications/read-all` | Self |

### System

| Method | Path | Purpose |
|---|---|---|
| GET | `/health/live` | Process is running |
| GET | `/health/ready` | Database and Redis reachable |

## API documentation

Generate an OpenAPI (Swagger) spec from the Zod schemas (for example with `zod-to-openapi`) and serve it at `/api/docs` outside production. Reviewers and interviewers like being able to click through it.

## Production checklist

- [ ] Versioned base path
- [ ] One response shape and one error shape
- [ ] Zod validation on every input
- [ ] Cursor pagination on growing lists
- [ ] 404 for other organizations' records
- [ ] Request ID in every error
- [ ] OpenAPI docs

## Interview talking points

- "Consistent REST conventions with typed, shared Zod schemas, cursor pagination, and request IDs for traceability."

Next: [09. Real-Time](09-realtime.md)
