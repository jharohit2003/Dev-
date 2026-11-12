# 20. Build Roadmap

> The order to build DevPulse, one phase at a time. Each phase ends with something that works.

## In simple words

Don't build everything at once. Each phase:

1. Has a clear goal.
2. Lists which architecture file to read first.
3. Ends with a **"Done when"** check. Don't move on until it passes.
4. Gets committed and pushed, so your GitHub history shows steady progress.

## Phases

### Phase 0: Foundation
**Read:** 02, 18
- pnpm monorepo: `apps/web`, `apps/api`, `packages/shared`
- TypeScript, ESLint, Prettier, Husky
- `docker-compose.yml` with PostgreSQL and Redis
- Express app with `/health/live`, validated env config, Pino logger, error handler
- Vite + React + Tailwind app showing a placeholder page
- GitHub Actions CI: lint, typecheck, build

**Done when:** `pnpm dev` starts both apps, `/health/live` returns OK, and CI passes on a PR.

### Phase 1: Database and Auth
**Read:** 06, 07
- Prisma schema: User, Organization, Membership, RefreshToken
- Register, login, refresh with rotation, logout, `/me`
- `authenticate` and `authorize` middleware, permission map
- Frontend: login and register pages, `apiClient` with auto refresh, protected routes
- Integration tests for auth

**Done when:** you can register, log in, refresh the page and stay logged in, and a Developer gets 403 on an Admin route.

### Phase 2: Organizations, Projects, Sprints, Tasks
**Read:** 04, 05, 08
- CRUD APIs with org scoping, Zod schemas in `packages/shared`
- Invitations and role changes
- Frontend pages with TanStack Query: project list, sprint list, task detail
- Seed script with demo data
- Tenant isolation tests

**Done when:** a Manager creates a project and sprint, adds tasks, and a user from another org can't see any of it.

### Phase 3: Kanban Board
**Read:** 05, 06
- Board API, move endpoint with fractional positions
- dnd-kit board with optimistic updates and rollback
- Activity rows for task changes

**Done when:** cards move instantly, order survives a page refresh, and a failed request snaps the card back.

### Phase 4: Real-Time
**Read:** 09
- Socket.IO server with JWT auth, rooms, Redis adapter
- Board, comment, and presence events
- Frontend cache updates from events, refetch on reconnect

**Done when:** two browsers on the same board see each other's moves live, and it still works with two API processes running.

### Phase 5: Background Jobs
**Read:** 10, 14
- BullMQ setup, `worker.ts`, queues, graceful shutdown
- Bull Board (admin only)
- Notifications queue and the notification bell

**Done when:** assigning a task creates a live notification through the worker, and a failing test job retries with backoff.

### Phase 6: GitHub Integration
**Read:** 11
- GitHub App, install flow, repository linking
- Webhook endpoint with signature check and dedupe
- Backfill and event processing jobs, task key linking
- PR list per project, PRs shown on task cards

**Done when:** pushing a commit with `DP-1` in the message shows up on task DP-1 within seconds.

### Phase 7: AI Summaries
**Read:** 12
- `ai.client.ts`, versioned prompts, structured output with Zod
- PR summary on PR open or update (cached by head SHA, debounced)
- Sprint summary on completion and on demand
- UI with loading, result, and retry states

**Done when:** opening a PR produces a summary in the UI without a page refresh, and the same SHA never triggers a second Gemini call.

### Phase 8: Analytics
**Read:** 13
- DailyStats table and nightly job
- Analytics endpoints with Redis caching
- Charts: cycle time, throughput, sprint completion, burndown

**Done when:** the analytics page loads quickly with 90 days of seeded data.

### Phase 9: Hardening
**Read:** 15, 16, 17
- Rate limits, Helmet, CORS, redaction, security review against file 15
- Sentry on frontend and backend, readiness check
- Playwright journeys, coverage threshold in CI
- OpenAPI docs

**Done when:** every production checklist in files 04 to 17 is ticked.

### Phase 10: Deploy to AWS
**Read:** 18, 19
- AWS Budget alert first
- Terraform: VPC, ECR, ECS, ALB, RDS, ElastiCache, S3, CloudFront, Secrets Manager
- CD pipeline with OIDC, migrations, rolling deploy
- Custom domain and HTTPS

**Done when:** merging to `main` deploys automatically and the live URL works end to end.

### Phase 11: Portfolio polish
- README with screenshots, a short demo GIF, live link, and architecture diagram
- A demo account with seeded data
- A short write-up of decisions and trade-offs (link to these docs)

## Resume bullets (fill in real numbers once you have them)

- Built DevPulse, a multi-tenant engineering management platform (React 19, TypeScript, Node.js, PostgreSQL, Redis, Socket.IO) with GitHub App integration and Gemini-powered PR and sprint summaries.
- Designed an asynchronous job architecture with BullMQ (retries, backoff, idempotent jobs) to process GitHub webhooks and AI tasks without blocking the API.
- Implemented real-time Kanban collaboration with optimistic updates and Socket.IO rooms scaled across instances with a Redis adapter.
- Secured the platform with rotating refresh tokens, permission-based RBAC, and tenant isolation covered by integration tests.
- Deployed on AWS (ECS Fargate, RDS, ElastiCache, CloudFront) with Terraform and a GitHub Actions CI/CD pipeline using OIDC.

Only claim what you actually built and can explain in an interview.
