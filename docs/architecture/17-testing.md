# 17. Testing

> What to test, with which tool, and how much.

## In simple words

Tests are code that checks your code. They let you change things without fear. Use many small fast tests, fewer bigger tests, and a handful of full browser tests. This shape is called the **testing pyramid**.

```
          /\        E2E (Playwright): a few key user journeys
         /  \
        /----\      Integration (Vitest + Supertest): API routes + real test DB
       /      \
      /--------\    Unit (Vitest): services, utilities, pure functions
```

## What each level covers

| Level | Tool | Example |
|---|---|---|
| **Unit** | Vitest | `computePosition(before, after)` returns a value between them. Prompt builder trims a large diff. |
| **Integration** | Vitest + Supertest + real PostgreSQL and Redis | `PATCH /tasks/:id` as a Developer works. `POST /projects` as a Developer returns 403. |
| **Component** | React Testing Library | Task card shows assignee. Login form shows validation errors. |
| **End-to-end** | Playwright | Log in, create a sprint, drag a task to Done, see it update in a second browser. |

## Tests that matter most

Write these first. They protect against the worst bugs:

1. **Tenant isolation**: a user from Org A gets 404 for every Org B resource.
2. **Permissions**: each role can and can't do what the table in file 07 says.
3. **Auth**: refresh rotation works. A reused refresh token revokes the family.
4. **Webhooks**: bad signature is rejected. The same delivery ID twice is processed once.
5. **Kanban ordering**: moving cards keeps a correct order.
6. **Jobs are idempotent**: running a job twice gives the same database state.

## Test database

- Integration tests use a **real PostgreSQL**, not a mock, because many bugs live in queries.
- Locally, Docker Compose provides it. In CI, GitHub Actions service containers provide it.
- Reset data between tests (truncate tables), and apply migrations before the test run.

## Mocking external services

Never call GitHub or Gemini from tests:

- Mock `ai.client.ts` and the GitHub client module.
- Save real webhook payloads as JSON files and replay them in tests.
- For HTTP-level mocks, use **MSW** (Mock Service Worker) on the frontend and `nock` or MSW on the backend.

## Test data factories

Use small helper functions to create test data:

```ts
const org = await createOrg();
const dev = await createUser({ org, role: "DEVELOPER" });
const task = await createTask({ org });
```

This keeps tests short and readable.

## Coverage

Aim for meaningful coverage of services and critical paths rather than a number. A reasonable target is around 70 to 80% on the backend services, enforced in CI so it doesn't drop.

## Production checklist

- [ ] Unit tests for pure logic
- [ ] Integration tests with a real database
- [ ] Tenant isolation and permission tests for every module
- [ ] Webhook and job idempotency tests
- [ ] A few Playwright journeys including real-time
- [ ] All external APIs mocked
- [ ] Tests run on every pull request

## Interview talking points

- "Integration tests run against real PostgreSQL in CI and specifically cover tenant isolation and role permissions."

Next: [18. DevOps and CI/CD](18-devops-cicd.md)
