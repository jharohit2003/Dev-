# 15. Security

> The main threats to DevPulse and how each one is handled.

## In simple words

Security is a list of specific threats, each with a specific defense. The **OWASP Top 10** is the standard list of common web app risks. This file maps DevPulse defenses to those kinds of risks.

## Threats and defenses

| Threat | Example | Defense |
|---|---|---|
| **Broken access control** | User changes an ID in the URL and reads another org's task | Org scoping on every query, permission checks, tests (files 04, 07) |
| **Stolen passwords** | Database leak | argon2 hashing |
| **Brute force login** | Bot tries thousands of passwords | Rate limit by IP and by email, slow down after failures |
| **Stolen tokens (XSS)** | Injected script reads tokens | Access token in memory, refresh token in httpOnly cookie, React escapes output, Content Security Policy |
| **CSRF** | Another site triggers a request with your cookie | Cookie is `SameSite`. Only `/auth/refresh` uses the cookie, and it checks the `Origin` header |
| **Injection (SQL)** | `'; DROP TABLE` in input | Prisma uses parameterized queries. Never build SQL from strings |
| **Bad input** | Huge or malformed bodies | Zod validation, body size limit |
| **Fake webhooks** | Attacker posts fake GitHub events | HMAC signature check (file 11) |
| **Leaked secrets** | API key committed to Git | Secrets only in environment and AWS Secrets Manager. Secret scanning in CI |
| **Vulnerable packages** | Old library with a known bug | Dependabot, `pnpm audit` in CI |
| **Prompt injection** | PR text tries to steer the AI | Treat repo content as data, AI output is display-only (file 12) |
| **Denial of service** | Flood of requests | Rate limits, AWS load balancer, AWS WAF optional |
| **Data exposure in errors** | Stack trace sent to user | Generic 500 messages, details only in logs |
| **Insecure transport** | Traffic read on public Wi-Fi | HTTPS everywhere, HSTS header |

## Express security setup

```ts
app.set("trust proxy", 1);                 // behind the AWS load balancer
app.use(helmet());                         // security headers
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ store: redisStore, windowMs: 60_000, limit: 300 }));
```

Rate limit state is stored in Redis so limits work across all servers. Stricter limits apply on auth routes.

## Secrets

| Where | What |
|---|---|
| Local | `.env` file, listed in `.gitignore` |
| CI | GitHub Actions secrets, and OIDC to AWS (no long-lived AWS keys) |
| Production | AWS Secrets Manager, injected into containers at start |

Rotate secrets if one is ever exposed. Commit only `.env.example` with empty values.

## Sensitive data

- Passwords: argon2 hash.
- Refresh tokens: SHA-256 hash.
- GitHub App private key: Secrets Manager only.
- Logs: never log passwords, tokens, or full request bodies on auth routes. Pino's `redact` option removes fields like `authorization` and `password`.

## Database and network

- The database and Redis are in **private subnets** with no public access (file 19).
- The app connects with a database user that has only the rights it needs.
- Encryption at rest and TLS in transit are enabled on RDS and ElastiCache.

## Containers

- Run as a non-root user.
- Use small base images and update them regularly.
- Scan images (Amazon ECR scanning or Trivy in CI).

## Production checklist

- [ ] Org scoping and permission tests
- [ ] argon2, hashed refresh tokens
- [ ] Helmet, CORS allowlist, body size limit
- [ ] Redis-backed rate limits, stricter on auth
- [ ] Webhook signature verification
- [ ] Secrets in Secrets Manager, OIDC for CI
- [ ] Pino redaction
- [ ] Dependabot and secret scanning enabled
- [ ] Private subnets for data stores
- [ ] Non-root containers, image scanning

## Interview talking points

- "I mapped defenses to OWASP risks: tenant scoping against broken access control, httpOnly refresh cookies against token theft, HMAC for webhooks, and Redis-backed rate limiting."

Next: [16. Observability](16-observability.md)
