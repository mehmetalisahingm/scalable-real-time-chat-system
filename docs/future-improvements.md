# Future Improvements

## File Attachments
- object storage for binary files,
- attachment metadata in PostgreSQL,
- CDN delivery for efficient reads,
- async virus scanning and thumbnail generation.

## Delivery Status
- introduce server-accepted, delivered, and seen states,
- track per-device or per-user delivery semantics,
- expose state changes as websocket events.

## Read Receipts
- direct chats can support explicit read receipts more easily,
- group rooms likely need summarized receipts for scale and UI clarity,
- may require denormalized projection tables.

## Search
- async indexing pipeline into a search engine,
- scoped search by conversation membership,
- ranking and highlighting support.

## Notifications
- push notification worker,
- email digests for missed messages,
- per-room notification preferences and mute rules.

## Event-Driven Architecture
- publish message-created and user-presence-changed events,
- move secondary consumers like analytics, notifications, and search indexing out of the request path,
- reduce coupling between the synchronous API and future platform features.

## Operational Improvements
- tracing and metrics,
- rate limits for room creation and message bursts,
- replay-safe background jobs,
- blue-green or canary deployment strategy.
