# 14. Notifications and Activity

> How DevPulse records what happened and tells the right people.

## In simple words

- **Activity** is a project's history: "Priya moved DP-42 to Done". Everyone on the project can see it.
- **Notifications** are personal: "You were assigned DP-42". Only the recipient sees them.

One event can create both.

## Flow

```mermaid
flowchart LR
    ACT[Action in a service<br/>e.g. task assigned] --> A[(Activity row)]
    ACT --> Q[notifications queue]
    Q --> W[Worker]
    W --> WHO[Decide recipients<br/>skip the actor]
    WHO --> N[(Notification rows)]
    N --> S[Socket: notification:new<br/>to user:{id}]
    N --> E[Optional email<br/>if user prefers]
```

The activity row is written in the **same transaction** as the change, so history is always accurate. Notifications go through the queue because deciding recipients and sending email can be slow.

## Events that notify

| Event | Who gets notified |
|---|---|
| Task assigned to you | Assignee |
| Comment on your task | Assignee and earlier commenters |
| You are @mentioned | Mentioned user |
| Your PR has an AI summary | PR author (if linked) |
| Sprint started or completed | Project members |
| Sprint summary ready | Managers |
| You were added to an org or project | That user |

The person who performed the action is never notified about their own action.

## Data

```prisma
model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String
  payload   Json        // e.g. { taskId, taskKey, actorName }
  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId, readAt, createdAt])
}
```

Store enough in `payload` to display the notification without extra lookups.

## UI

- A bell icon with an unread count.
- A dropdown list with cursor pagination.
- "Mark all as read".
- Clicking a notification opens the related task or PR.

## Preferences

Users choose which types they want in-app and by email. Store this as a small JSON field on `Membership` or a separate table. For email, use AWS SES, and batch frequent events into a digest instead of sending one email per event.

## Retention

Delete read notifications older than, for example, 90 days with a scheduled maintenance job. Activity can be kept longer since it is project history.

## Production checklist

- [ ] Activity written in the same transaction as the change
- [ ] Notifications created by a background job
- [ ] Actor excluded from recipients
- [ ] Duplicate protection with job IDs
- [ ] Index on `(userId, readAt, createdAt)`
- [ ] User preferences respected
- [ ] Retention cleanup job

## Interview talking points

- "Activity is written transactionally with the change. Notification fan-out is asynchronous and pushed over Socket.IO to the user's room."

Next: [15. Security](15-security.md)
