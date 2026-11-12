# DevPulse

**AI-powered engineering management platform.**

DevPulse helps software teams manage projects, track development progress, and understand engineering productivity. It connects to GitHub, organizes work into projects and sprints, and uses AI to summarize sprints and pull requests so managers and developers spend less time writing status updates.

> Status: in active development. This is a learning and portfolio project.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How a Request Flows](#how-a-request-flows)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Roles and Permissions](#roles-and-permissions)
- [API Overview](#api-overview)
- [Real-Time Events](#real-time-events)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [CI/CD and Deployment](#cicd-and-deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| GitHub integration | Connect repositories, sync commits and pull requests through OAuth and webhooks. |
| Projects and sprints | Create projects, plan sprints with start and end dates, and assign tasks. |
| Kanban board | Drag-and-drop tasks across columns (To Do, In Progress, In Review, Done). |
| AI sprint summaries | Gemini generates a plain-language summary of what a sprint delivered, what slipped, and risks. |
| AI PR summaries | Gemini summarizes a pull request diff: what changed, why, and what to review carefully. |
| Developer analytics | Commits, PRs opened and merged, review turnaround, and cycle time per developer and team. |
| Real-time collaboration | Board changes, comments, and presence update live for everyone viewing a project. |
| Role-based access | Admin, Manager, and Developer roles with different permissions. |
| Notifications and activity feed | In-app notifications and a per-project timeline of events. |

---

## Tech Stack

| Layer | Technology | Why it is used |
|---|---|---|
| Frontend | React 19, TypeScript | Component-based UI with type safety. |
| Styling | Tailwind CSS | Utility classes for fast, consistent styling. |
| Server state | TanStack Query | Fetching, caching, and syncing API data on the client. |
| Drag and drop | dnd-kit | Accessible drag-and-drop for the Kanban board. |
| Charts | Recharts | Analytics charts. |
| Backend | Node.js, Express 5, TypeScript | REST API with native async error handling in Express 5. |
| Validation | Zod | Validate request bodies and environment variables. |
| Database | PostgreSQL | Relational data: users, projects, sprints, tasks. |
| ORM | Prisma | Type-safe queries and schema migrations. |
| Cache and queues | Redis, BullMQ | Caching, rate limiting, Socket.IO scaling, background jobs. |
| Real-time | Socket.IO | WebSocket events for live board and notifications. |
| AI | Google Gemini API | Sprint and PR summaries. |
| Auth | JWT (access + refresh), GitHub OAuth | Stateless auth and GitHub account linking. |
| DevOps | Docker, Docker Compose, GitHub Actions | Local environment, CI pipeline. |
| Cloud | AWS (ECS Fargate, RDS, ElastiCache, S3, CloudFront, ECR) | Production hosting. |

---

## Architecture

### High-level system

```mermaid
flowchart LR
    subgraph Client
        UI[React 19 SPA<br/>TanStack Query<br/>Socket.IO client]
    end

    subgraph AWS
        CF[CloudFront + S3<br/>static frontend]
        ALB[Application Load Balancer]

        subgraph ECS[ECS Fargate]
            API[API Server<br/>Express 5 + Socket.IO]
            WORKER[Worker<br/>BullMQ jobs]
        end

        RDS[(PostgreSQL<br/>RDS)]
        REDIS[(Redis<br/>ElastiCache)]
    end

    GH[GitHub<br/>OAuth + REST API + Webhooks]
    GEM[Gemini API]

    UI -->|HTTPS| CF
    UI -->|REST /api + WebSocket| ALB
    ALB --> API
    API --> RDS
    API --> REDIS
    API -->|enqueue jobs| REDIS
    REDIS -->|consume jobs| WORKER
    WORKER --> RDS
    WORKER --> GEM
    WORKER --> GH
    GH -->|webhooks| ALB
    WORKER -->|publish events| REDIS
    REDIS -->|pub/sub adapter| API
```

### The two backend processes

The backend runs as two processes from the same codebase:

1. **API server** handles HTTP requests and WebSocket connections. It must respond fast, so it never waits on slow work like AI calls or full GitHub syncs.
2. **Worker** pulls jobs from a Redis queue (BullMQ) and does the slow work: syncing GitHub data, calling Gemini, computing analytics, sending notifications. When it finishes, it publishes an event to Redis, and the API server pushes it to connected browsers through Socket.IO.

This split keeps the API responsive and lets each process scale independently.

### Backend layers

```mermaid
flowchart TB
    R[Routes] --> M[Middleware<br/>auth, RBAC, validation, rate limit]
    M --> C[Controllers<br/>parse request, send response]
    C --> S[Services<br/>business logic]
    S --> REPO[Prisma Client<br/>data access]
    S --> INT[Integrations<br/>GitHub, Gemini]
    S --> Q[Queue producers]
    S --> E[Event emitter<br/>Socket.IO]
    REPO --> DB[(PostgreSQL)]
```

| Layer | Responsibility | Should not |
|---|---|---|
| Routes | Map URL and HTTP method to a controller. | Contain logic. |
| Middleware | Authenticate, check role, validate input with Zod. | Touch the database for business data. |
| Controllers | Read request, call a service, return JSON. | Contain business rules. |
| Services | Business rules, transactions, orchestration. | Know about `req` or `res`. |
| Integrations | Wrap external APIs (GitHub, Gemini). | Be called directly from controllers. |

Each feature lives in its own module (`auth`, `projects`, `sprints`, `tasks`, `github`, `ai`, `analytics`, `notifications`) with its own routes, controller, service, and schemas. This is a **modular monolith**: one deployable app, organized so a module could be split out later if needed.

### Frontend architecture

- **Feature folders**: each feature (`board`, `sprints`, `analytics`) owns its components, hooks, and API calls.
- **TanStack Query** owns all server data. No global store for API data.
- **Socket.IO events** update the TanStack Query cache directly (`queryClient.setQueryData`) so the UI reflects other users' changes without refetching.
- **Optimistic updates** on the Kanban board: the card moves instantly, and rolls back if the API call fails.
- **Small local state** (UI toggles, modals) stays in React state or a light store such as Zustand.

---

## How a Request Flows

### Example 1: moving a card on the Kanban board

```mermaid
sequenceDiagram
    participant A as User A (browser)
    participant API as API Server
    participant DB as PostgreSQL
    participant R as Redis
    participant B as User B (browser)

    A->>A: Optimistic update (card moves instantly)
    A->>API: PATCH /api/tasks/:id {status, position}
    API->>API: Verify JWT, check role, validate body
    API->>DB: Update task, insert activity row
    API->>R: Publish "task:moved"
    R-->>API: Fan out to all API instances
    API-->>B: Socket.IO "task:moved" to room project:{id}
    API-->>A: 200 OK
    B->>B: Update query cache, card moves
```

### Example 2: AI summary of a pull request

```mermaid
sequenceDiagram
    participant GH as GitHub
    participant API as API Server
    participant Q as Redis Queue
    participant W as Worker
    participant G as Gemini
    participant DB as PostgreSQL
    participant U as Browser

    GH->>API: Webhook pull_request.opened
    API->>API: Verify HMAC signature
    API->>Q: Enqueue "summarize-pr"
    API-->>GH: 202 Accepted
    Q->>W: Deliver job
    W->>GH: Fetch PR diff
    W->>G: Prompt with diff
    G-->>W: Summary text
    W->>DB: Save summary
    W->>Q: Publish "pr:summarized"
    Q-->>API: Event
    API-->>U: Socket.IO notification
```

---

## Data Model

```mermaid
erDiagram
    Organization ||--o{ Membership : has
    User ||--o{ Membership : has
    Organization ||--o{ Project : owns
    Project ||--o{ Sprint : has
    Project ||--o{ Task : has
    Sprint ||--o{ Task : contains
    User ||--o{ Task : "assigned to"
    Task ||--o{ Comment : has
    Project ||--o{ Repository : links
    Repository ||--o{ Commit : has
    Repository ||--o{ PullRequest : has
    PullRequest ||--o| AiSummary : has
    Sprint ||--o| AiSummary : has
    User ||--o{ Notification : receives
    Project ||--o{ Activity : logs

    User {
        uuid id
        string email
        string name
        string githubId
        string githubLogin
    }
    Membership {
        uuid userId
        uuid orgId
        enum role "ADMIN | MANAGER | DEVELOPER"
    }
    Task {
        uuid id
        string title
        enum status
        enum priority
        float position
        int storyPoints
    }
    Sprint {
        uuid id
        string name
        date startDate
        date endDate
        enum status
    }
    PullRequest {
        uuid id
        int number
        string state
        datetime mergedAt
        int additions
        int deletions
    }
```

Notes:

- **Role lives on `Membership`**, not on `User`, so one person can be an Admin in one organization and a Developer in another.
- **`Task.position` is a float** so a card can be inserted between two others without renumbering the whole column (fractional indexing).
- **GitHub IDs are stored** on commits and PRs so webhook events can be matched and deduplicated.

---

## Project Structure

A monorepo using npm workspaces (or pnpm).

```
devpulse/
├── apps/
│   ├── web/                      # React 19 frontend
│   │   ├── src/
│   │   │   ├── app/              # router, providers, layout
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── board/        # Kanban, dnd-kit
│   │   │   │   ├── sprints/
│   │   │   │   ├── analytics/
│   │   │   │   └── notifications/
│   │   │   ├── components/ui/    # shared buttons, inputs, modals
│   │   │   ├── lib/              # api client, socket client, query client
│   │   │   └── main.tsx
│   │   └── vite.config.ts
│   │
│   └── api/                      # Express 5 backend
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/         # routes, controller, service, schemas
│       │   │   ├── projects/
│       │   │   ├── sprints/
│       │   │   ├── tasks/
│       │   │   ├── github/
│       │   │   ├── ai/
│       │   │   ├── analytics/
│       │   │   └── notifications/
│       │   ├── middleware/       # auth, rbac, validate, errorHandler
│       │   ├── realtime/         # Socket.IO setup and event emitters
│       │   ├── jobs/             # BullMQ queues and processors
│       │   ├── lib/              # prisma, redis, logger, env
│       │   ├── app.ts            # Express app
│       │   ├── server.ts         # HTTP + Socket.IO entry
│       │   └── worker.ts         # worker entry
│       └── tests/
│
├── packages/
│   └── shared/                   # shared TypeScript types and Zod schemas
│
├── infra/                        # AWS infrastructure (Terraform or CDK)
├── .github/workflows/            # CI/CD pipelines
├── docker-compose.yml
└── README.md
```

`packages/shared` holds Zod schemas used by both apps, so the frontend and backend agree on request and response shapes.

---

## Roles and Permissions

| Action | Admin | Manager | Developer |
|---|:-:|:-:|:-:|
| Manage organization and members | ✅ | | |
| Connect GitHub repositories | ✅ | ✅ | |
| Create and delete projects | ✅ | ✅ | |
| Create and close sprints | ✅ | ✅ | |
| Create, edit, and move tasks | ✅ | ✅ | ✅ |
| Comment on tasks | ✅ | ✅ | ✅ |
| Generate AI sprint summary | ✅ | ✅ | |
| View AI PR summaries | ✅ | ✅ | ✅ |
| View team analytics | ✅ | ✅ | Own only |

Enforced on the backend with a `requireRole(...)` middleware. The frontend hides actions the user cannot perform, but the backend is the source of truth.

---

## API Overview

Base URL: `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Log in, returns access token, sets refresh cookie |
| POST | `/auth/refresh` | Rotate tokens |
| GET | `/auth/github` | Start GitHub OAuth |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id/sprints` | List sprints |
| POST | `/projects/:id/sprints` | Create sprint |
| GET | `/projects/:id/tasks` | List tasks (board) |
| PATCH | `/tasks/:id` | Update task or move on board |
| POST | `/tasks/:id/comments` | Add comment |
| POST | `/projects/:id/repositories` | Link a GitHub repo |
| POST | `/webhooks/github` | GitHub webhook receiver |
| POST | `/sprints/:id/summary` | Queue AI sprint summary |
| GET | `/pull-requests/:id/summary` | Get AI PR summary |
| GET | `/analytics/projects/:id` | Team metrics |
| GET | `/analytics/users/:id` | Developer metrics |
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark as read |

---

## Real-Time Events

Clients join a Socket.IO room per project (`project:{id}`) and a personal room (`user:{id}`).

| Event | Room | Payload |
|---|---|---|
| `task:created` | project | Task |
| `task:updated` | project | Task |
| `task:moved` | project | `{ id, status, position }` |
| `comment:created` | project | Comment |
| `presence:update` | project | List of users viewing |
| `notification:new` | user | Notification |
| `ai:summary-ready` | project | `{ type, id }` |

The Redis adapter (`@socket.io/redis-adapter`) lets events reach users connected to any API instance when running more than one.

---

## Getting Started

### Prerequisites

- Node.js 22 LTS or later
- Docker and Docker Compose
- A GitHub OAuth App ([create one](https://github.com/settings/developers))
- A Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### Setup

```bash
# 1. Clone
git clone https://github.com/<your-username>/devpulse.git
cd devpulse

# 2. Install dependencies
npm install

# 3. Start PostgreSQL and Redis
docker compose up -d postgres redis

# 4. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# fill in the values (see below)

# 5. Run database migrations and seed data
npm run db:migrate -w apps/api
npm run db:seed -w apps/api

# 6. Start everything
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

---

## Environment Variables

### `apps/api/.env`

| Variable | Example | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `4000` | API port |
| `DATABASE_URL` | `postgresql://devpulse:devpulse@localhost:5432/devpulse` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `JWT_ACCESS_SECRET` | random string | Signs access tokens |
| `JWT_REFRESH_SECRET` | random string | Signs refresh tokens |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `GITHUB_CLIENT_ID` | | GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | | GitHub OAuth app |
| `GITHUB_WEBHOOK_SECRET` | random string | Verifies webhook signatures |
| `GEMINI_API_KEY` | | Gemini API key |
| `GEMINI_MODEL` | | Gemini model name |

### `apps/web/.env`

| Variable | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:4000/api/v1` |
| `VITE_SOCKET_URL` | `http://localhost:4000` |

Never commit `.env` files. Only `.env.example` is committed.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run web, API, and worker in watch mode |
| `npm run build` | Build all apps |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run tests |
| `npm run db:migrate -w apps/api` | Apply Prisma migrations |
| `npm run db:studio -w apps/api` | Open Prisma Studio |

---

## Testing

| Type | Tool | Scope |
|---|---|---|
| Unit | Vitest | Services, utilities |
| Integration | Vitest + Supertest | API routes against a test database |
| Component | React Testing Library | UI components |
| End-to-end | Playwright | Login, board drag-and-drop, sprint flow |

External APIs (GitHub, Gemini) are mocked in tests.

---

## CI/CD and Deployment

### Pipeline

```mermaid
flowchart LR
    PR[Pull request] --> CI[GitHub Actions CI<br/>lint, typecheck, test, build]
    CI --> MERGE[Merge to main]
    MERGE --> IMG[Build Docker images<br/>push to ECR]
    IMG --> MIG[Run Prisma migrations]
    MIG --> DEPLOY[Update ECS services<br/>API + Worker]
    MERGE --> WEB[Build frontend<br/>upload to S3<br/>invalidate CloudFront]
```

### AWS resources

| Service | Purpose |
|---|---|
| S3 + CloudFront | Host and cache the React build |
| ECR | Store Docker images |
| ECS Fargate | Run API and worker containers |
| Application Load Balancer | HTTPS, routes `/api` and WebSocket traffic |
| RDS PostgreSQL | Managed database |
| ElastiCache Redis | Cache, queues, Socket.IO adapter |
| Secrets Manager | API keys and secrets |
| CloudWatch | Logs and alarms |

Cost note: RDS, ElastiCache, ALB, and NAT gateways bill hourly even when idle. For a portfolio deployment, keep instances small, or tear down the stack when not demoing.

---

## Roadmap

Built in phases. Each phase ends with something working and demoable.

- [ ] **Phase 0: Foundation.** Monorepo, TypeScript, ESLint, Prettier, Docker Compose for Postgres and Redis.
- [ ] **Phase 1: Auth and RBAC.** Register, login, JWT with refresh tokens, organizations, roles.
- [ ] **Phase 2: Projects, sprints, tasks.** CRUD APIs with Prisma, React pages with TanStack Query.
- [ ] **Phase 3: Kanban board.** dnd-kit drag-and-drop, fractional ordering, optimistic updates.
- [ ] **Phase 4: Real-time.** Socket.IO rooms, live board updates, presence, Redis adapter.
- [ ] **Phase 5: GitHub integration.** OAuth, repo linking, webhooks, background sync with BullMQ.
- [ ] **Phase 6: AI.** Gemini PR summaries and sprint summaries via worker jobs.
- [ ] **Phase 7: Analytics.** Commit and PR metrics, cycle time, charts.
- [ ] **Phase 8: Notifications and activity feed.**
- [ ] **Phase 9: Testing and CI.** Vitest, Playwright, GitHub Actions.
- [ ] **Phase 10: Deploy to AWS.**

---

## License

MIT
