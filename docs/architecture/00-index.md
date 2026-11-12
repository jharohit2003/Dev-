# DevPulse Architecture Guide

Read these files in order. Each one builds on the previous one.

Every file follows the same layout:

1. **In simple words**: the idea in a few sentences.
2. **How it works**: the design, with diagrams.
3. **Production checklist**: what makes it production-grade, not just a demo.
4. **Interview talking points**: how to explain it on your resume or in an interview.

## Reading order

| # | File | What you learn |
|---|---|---|
| 01 | [Overview](01-overview.md) | What DevPulse is, who uses it, the big picture |
| 02 | [Tech Stack](02-tech-stack.md) | Every tool and why it was chosen |
| 03 | [System Architecture](03-system-architecture.md) | The main components and how they talk |
| 04 | [Backend Architecture](04-backend-architecture.md) | Layers, modules, errors, config |
| 05 | [Frontend Architecture](05-frontend-architecture.md) | Folders, data fetching, state, routing |
| 06 | [Database Design](06-database-design.md) | Tables, relations, indexes, migrations |
| 07 | [Auth and RBAC](07-auth-and-rbac.md) | Login, tokens, roles, permissions |
| 08 | [API Design](08-api-design.md) | URL rules, errors, pagination, endpoints |
| 09 | [Real-Time](09-realtime.md) | Socket.IO rooms, events, scaling |
| 10 | [Background Jobs](10-background-jobs.md) | Queues, workers, retries |
| 11 | [GitHub Integration](11-github-integration.md) | GitHub App, webhooks, syncing |
| 12 | [AI Integration](12-ai-integration.md) | Gemini summaries, prompts, cost control |
| 13 | [Analytics](13-analytics.md) | Which metrics, how they are computed |
| 14 | [Notifications and Activity](14-notifications-and-activity.md) | Feeds and alerts |
| 15 | [Security](15-security.md) | Threats and defenses |
| 16 | [Observability](16-observability.md) | Logs, errors, health checks, alerts |
| 17 | [Testing](17-testing.md) | Test types and strategy |
| 18 | [DevOps and CI/CD](18-devops-cicd.md) | Docker, GitHub Actions, environments |
| 19 | [AWS Deployment](19-aws-deployment.md) | Cloud layout, networking, cost |
| 20 | [Build Roadmap](20-build-roadmap.md) | The order to build everything |

## How to use this guide

Read 01 to 03 first to get the big picture. Then read 20 (the roadmap). After that, read each remaining file just before you build that part. You don't need to memorize everything up front.
