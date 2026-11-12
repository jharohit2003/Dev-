# 16. Observability

> How you know what the app is doing in production, and find out quickly when it breaks.

## In simple words

On your laptop you can use `console.log` and a debugger. In production you can't. Observability means the app **reports on itself** through:

| Signal | Question it answers | Tool |
|---|---|---|
| **Logs** | What happened? | Pino → CloudWatch Logs |
| **Errors** | What broke, and where in the code? | Sentry |
| **Metrics** | How much, how fast, how often? | CloudWatch metrics |
| **Health checks** | Is it alive and ready? | `/health/live`, `/health/ready` |
| **Traces** (optional) | Where did a slow request spend its time? | OpenTelemetry |

## Structured logs

Logs are JSON, not plain text, so you can search and filter them:

```json
{"level":"info","time":"2026-11-12T10:00:00Z","requestId":"a1b2c3","userId":"u_9","orgId":"o_3","method":"PATCH","path":"/api/v1/tasks/…","status":200,"durationMs":42}
```

Rules:

- Every log line from a request includes its **request ID** (`pino-http` plus a request ID middleware).
- The request ID is returned in the `X-Request-Id` header and in error responses, so a user can report it.
- Jobs log their job ID and queue name.
- Levels: `error` for failures, `warn` for odd but handled cases, `info` for important events, `debug` only locally.
- Sensitive fields are redacted (file 15).

## Error tracking

Sentry on both frontend and backend:

- Captures unhandled errors with stack traces and the request context.
- Groups repeated errors and alerts on new ones.
- Upload source maps in CI so frontend stack traces point to your TypeScript code.
- Tag events with the release version (Git commit SHA) to see which deploy introduced a bug.

## Health checks

| Endpoint | Checks | Used by |
|---|---|---|
| `/health/live` | The process responds | Container restart decisions |
| `/health/ready` | Database and Redis reachable | Load balancer: only send traffic when ready |

Keep them fast and unauthenticated, and don't expose internal details in the response.

## Metrics worth watching

| Metric | Why |
|---|---|
| Request rate, error rate (5xx), latency (p95) | Overall API health |
| CPU and memory per container | Scaling decisions |
| Database connections and slow queries | Database health |
| Queue waiting count and failed count | Background job health |
| Socket.IO connected clients | Real-time load |
| Gemini calls and tokens per day | AI cost |

ALB, ECS, RDS, and ElastiCache publish most of these to CloudWatch automatically. Queue and AI metrics can be sent as custom metrics from the worker.

## Alerts

Start with a few alerts that matter. Too many alerts get ignored.

| Alert | Example threshold (tune it) |
|---|---|
| 5xx error rate high | Over 2% for 5 minutes |
| API p95 latency high | Over 1 second for 10 minutes |
| No healthy API targets | Any time |
| Queue backlog growing | Waiting jobs keep rising for 15 minutes |
| Failed jobs spike | Sudden increase |
| Database CPU or storage high | Over 80% |

Send alerts to email or Slack through Amazon SNS.

## Production checklist

- [ ] JSON logs with request ID, user ID, org ID
- [ ] Log redaction
- [ ] Sentry on frontend and backend, with releases and source maps
- [ ] Liveness and readiness endpoints wired to ECS and the load balancer
- [ ] CloudWatch dashboard for API, database, queues
- [ ] A small set of actionable alerts
- [ ] Log retention set (for example 30 days) to control cost

## Interview talking points

- "Structured JSON logs with request IDs that flow into error responses, Sentry with release tracking, readiness checks wired to the load balancer, and alerts on error rate and queue backlog."

Next: [17. Testing](17-testing.md)
