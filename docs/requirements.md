# Requirements

## Functional Requirements
- Users can register, login, refresh sessions, and logout.
- Authenticated users can fetch their own profile and discover other users.
- Users can create direct conversations and group rooms.
- Users can fetch their conversation list with last message and unread count.
- Users can fetch paginated message history for a conversation.
- Users can send messages in real time.
- Users can see typing indicators and online or offline presence.
- Users can mark conversations as read and keep unread counts updated.
- Operators can seed the system with demo users and sample conversations.
- Developers can inspect the API through Swagger UI.

## Non-Functional Requirements
- Low-latency interactive chat experience for active conversations.
- Stateless access-token based authentication at the API layer.
- Refresh token rotation with server-side revocation storage.
- Clear fault boundaries between request validation, business logic, data access, and realtime handlers.
- Readable codebase structure appropriate for team growth.
- Local developer setup should be fast and reproducible.
- Architecture should be horizontally scalable without a rewrite of the core data model.

## Scale Assumptions
This implementation assumes a meaningful but still interview-friendly scale target:

- 100,000 registered users
- 10,000 daily active users
- 2,000 to 5,000 concurrent websocket connections during normal peaks
- 50 messages per second average
- 500 messages per second burst traffic during busy periods
- text-only messages in the current version

These assumptions are intentionally higher than a toy demo but lower than global consumer scale. They are large enough to justify Redis, read-optimized indexes, pagination, and websocket fan-out discussions.

## Capacity Estimation
### Message write estimate
- Assume average message payload plus metadata is about 1 KB stored.
- At 500 messages per second peak, that is about 500 KB per second of raw message data.
- That is about 43 GB per day before compression, retention rules, backups, indexes, and overhead.

### Connection estimate
- 5,000 concurrent websocket clients across 5 nodes means about 1,000 active sockets per node.
- Presence and typing state cannot live in process memory only if nodes are scaled horizontally.
- Redis becomes the shared state and adapter layer for fan-out and presence coordination.

### Read estimate
- Conversation list fetches are read-heavy because every page load asks for summaries, last messages, and unread counts.
- Message history requests are bursty and pagination-heavy.
- This favors strong relational modeling, indexes on conversation and message timestamps, and later read replicas.

## Out of Scope for the Initial Version
- file uploads,
- read receipts per user,
- delivery receipts,
- full-text message search,
- push notifications,
- moderation workflows,
- message edits and deletes,
- end-to-end encryption.

Those are intentionally deferred so the current version stays coherent and explainable.
