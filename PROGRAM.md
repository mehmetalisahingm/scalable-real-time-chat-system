# Program Walkthrough

## Purpose
This file explains how the program is organized, how requests move through the system, and how to talk about the project during a demo or interview.

## What The Program Does
Scalable Real-Time Chat System is a full-stack messaging application that supports:
- account registration and login,
- protected chat access,
- direct conversations,
- group rooms,
- real-time message delivery,
- typing indicators,
- unread counts,
- presence and last seen tracking.

## Runtime Components
### `apps/web`
The frontend is a Next.js application responsible for:
- auth pages,
- route protection,
- conversation sidebar,
- thread view,
- optimistic messaging UX,
- websocket connection management in the browser.

### `apps/api`
The backend is an Express + Socket.IO application responsible for:
- REST endpoints,
- authentication and refresh flow,
- validation and middleware,
- message persistence,
- realtime broadcasts,
- presence updates.

### `packages/shared`
This package keeps request and response contracts aligned across the frontend and backend.

### `docs`
This folder explains the design choices and makes the repository stronger as a portfolio artifact.

## Backend Structure
The backend follows a layered architecture:

- `routes`: define versioned endpoints
- `controllers`: translate request/response handling into use-case calls
- `services`: core business logic
- `repositories`: Prisma access layer
- `middlewares`: auth, validation, error handling
- `sockets`: websocket lifecycle and realtime events
- `config`: environment and OpenAPI setup
- `utils`: token, password, cookie, async helper logic

## Request Lifecycle
For a normal REST request:

1. A route receives the request.
2. Validation middleware checks the payload.
3. Auth middleware resolves the current user when required.
4. The controller calls a service.
5. The service coordinates repositories and supporting services.
6. Repositories talk to PostgreSQL through Prisma.
7. The controller returns a typed JSON response.

## Realtime Lifecycle
For a message send:

1. The frontend emits `message:send`.
2. The socket handler validates the event and user membership.
3. The message service writes the message to PostgreSQL.
4. The conversation is touched for sort order and read state.
5. The websocket layer broadcasts the new message.
6. Other connected clients receive `message:created`.
7. The sender reconciles the optimistic message with the persisted server response.

## Data Responsibilities
### PostgreSQL
Stores durable records:
- users,
- refresh tokens,
- conversations,
- conversation participants,
- messages.

### Redis
Stores ephemeral shared state:
- presence counters,
- last seen cache,
- typing keys with TTL,
- Socket.IO pub-sub adapter state.

## Frontend Flow
The frontend loads in this order:

1. restore session via refresh token,
2. fetch current user and conversation list,
3. connect websocket with access token,
4. join the active conversation room,
5. fetch paginated messages,
6. send and receive real-time updates.

## Demo Flow
If you want to show the project quickly:

1. Login with `alice@example.com`.
2. Open the seeded direct thread.
3. Open the seeded `General` room.
4. Show Swagger docs.
5. Walk through the `docs/architecture.md` and `docs/scaling.md` files.

## Interview Angles
Good angles for discussion:

- why modular monolith before microservices,
- why PostgreSQL is appropriate here,
- why Redis is necessary for presence and websocket scaling,
- where the bottlenecks appear at larger scale,
- how you would introduce queues, replicas, and sharding later.

## Recommended Next Steps
If this program were extended further, the next meaningful additions would be:
- attachments,
- delivery and read receipts,
- search indexing,
- notifications,
- background event processing,
- observability and metrics.
