# 02. Tech Stack

> Every tool in DevPulse, what it does, and why it was picked.

## In simple words

Each tool solves one problem. If you can say *what problem* a tool solves, you understand why it is in the stack.

## Frontend

| Tool | Problem it solves |
|---|---|
| **React 19** | Builds the UI from reusable components. |
| **TypeScript** | Catches bugs before the code runs by checking types. |
| **Vite** | Starts the dev server fast and builds the production bundle. |
| **Tailwind CSS** | Styles components with utility classes instead of writing CSS files. |
| **TanStack Query** | Fetches data from the API, caches it, and refetches when it gets stale. |
| **React Router** | Maps URLs (like `/projects/42/board`) to pages. |
| **React Hook Form + Zod** | Handles forms and validates input. |
| **dnd-kit** | Drag-and-drop for the Kanban board. Works with keyboard too. |
| **Recharts** | Charts for analytics. |
| **Socket.IO client** | Receives live updates from the server. |

## Backend

| Tool | Problem it solves |
|---|---|
| **Node.js (22 LTS)** | Runs JavaScript on the server. LTS means long-term support, which is what production uses. |
| **Express 5** | Handles HTTP routes. Version 5 catches errors in `async` route handlers on its own. |
| **TypeScript** | Same type safety as the frontend. |
| **Zod** | Validates request bodies and environment variables at runtime. |
| **Prisma** | Talks to PostgreSQL with type-safe queries and manages schema changes (migrations). |
| **Socket.IO** | Two-way real-time connection with the browser. |
| **BullMQ** | Job queue on top of Redis for background work. |
| **Pino** | Fast JSON logging. |
| **Helmet, cors, express-rate-limit** | Security headers, allowed origins, and request limits. |
| **argon2** | Password hashing. |
| **@google/genai** | Official Gemini SDK. |
| **Octokit** | Official GitHub API client. |

## Data

| Tool | Problem it solves |
|---|---|
| **PostgreSQL** | Stores permanent data with relations (users, projects, tasks). Reliable and widely used. |
| **Redis** | In-memory store. Used for caching, job queues, rate limits, and sharing real-time events between servers. |

## DevOps and cloud

| Tool | Problem it solves |
|---|---|
| **Docker** | Packages the app so it runs the same everywhere. |
| **Docker Compose** | Runs Postgres and Redis locally with one command. |
| **GitHub Actions** | Runs tests and deploys automatically. |
| **Terraform** | Describes AWS infrastructure as code, so it can be recreated. |
| **AWS** | Hosts the app (details in file 19). |
| **Sentry** | Captures errors from frontend and backend with stack traces. |

## Testing

| Tool | Problem it solves |
|---|---|
| **Vitest** | Unit and integration tests. |
| **Supertest** | Calls API routes in tests. |
| **React Testing Library** | Tests UI components the way a user uses them. |
| **Playwright** | End-to-end tests in a real browser. |

## Monorepo tooling

| Tool | Problem it solves |
|---|---|
| **pnpm workspaces** | One repository holds frontend, backend, and shared code. pnpm is fast and saves disk space. |
| **ESLint + Prettier** | Consistent code style and catches common mistakes. |
| **Husky + lint-staged** | Runs lint before each commit. |

## Why these choices (the trade-offs)

- **PostgreSQL over MongoDB**: the data is relational (a task belongs to a sprint, which belongs to a project, which belongs to an organization). SQL fits this naturally.
- **Prisma over raw SQL**: faster to build with and type-safe. The cost is less control over complex queries. For those, Prisma allows raw SQL.
- **Socket.IO over raw WebSockets**: it adds rooms, automatic reconnection, and a Redis adapter for scaling. Building those yourself takes weeks.
- **BullMQ over a cron script**: you get retries, delays, concurrency limits, and a record of failed jobs.
- **Monorepo**: frontend and backend share types and validation schemas, so they can't drift apart.

## Interview talking points

- Be ready to justify each choice with the problem it solves, as in the tables above.
- Know at least one alternative for each, and why you didn't pick it.

Next: [03. System Architecture](03-system-architecture.md)
