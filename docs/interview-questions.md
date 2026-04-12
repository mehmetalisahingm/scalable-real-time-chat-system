# Interview Questions

## 1. Why did you choose a modular monolith instead of microservices?
Because it keeps delivery speed high and operational complexity low while still preserving clean internal boundaries. The code is already separated by responsibility, so services can be extracted later if scale or org complexity requires it.

## 2. Why split REST and websocket responsibilities?
REST is better for authentication, pagination, and initial page data. Websocket is better for low-latency events like message delivery and typing. Combining both gives clearer semantics than forcing one transport to do everything.

## 3. Why PostgreSQL for chat instead of MongoDB?
The domain has strong relationships between users, conversations, participants, refresh tokens, and messages. PostgreSQL makes those relationships, indexes, and consistency guarantees easier to manage cleanly.

## 4. Why is Redis used here?
Redis supports shared ephemeral state. In this project it handles presence counters, typing TTL state, and the Socket.IO adapter needed for multi-node realtime fan-out.

## 5. How do you avoid duplicate direct message threads?
Direct conversations use a deterministic `directKey` built from the sorted pair of user IDs. That key is unique, so repeated create requests resolve to the same thread.

## 6. How are unread counts tracked?
Each participant row stores `lastReadAt`. Unread count is the number of messages in that conversation newer than `lastReadAt` and not sent by the current user.

## 7. Why not store unread counts directly?
Direct counters are faster to read but harder to keep correct. This version prefers correctness and clarity. At larger scale, denormalized counters could be introduced.

## 8. How do optimistic updates work on the frontend?
The client inserts a pending message into the query cache immediately, keyed by a client-generated ID. When the server acknowledges the send, the pending entry is replaced with the canonical persisted message.

## 9. How do you avoid duplicate optimistic messages?
Messages include `clientId`, and the backend enforces uniqueness on `(conversationId, senderId, clientId)`. That gives idempotency for retries and optimistic UI reconciliation.

## 10. How is presence implemented?
Redis stores connection counts per user and last seen timestamps. If the count is above zero, the user is online. When it reaches zero, last seen is updated.

## 11. Why not keep presence only in memory?
That breaks as soon as multiple backend instances are running. Memory-only presence would be wrong for cross-node visibility.

## 12. How does the system scale websocket delivery?
Socket.IO uses the Redis adapter so events emitted on one node can reach sockets connected to other nodes.

## 13. What happens if Redis goes down?
Durable messaging can still exist if PostgreSQL is healthy, but presence, typing indicators, and cross-node websocket fan-out degrade. The system would need degraded-mode behavior and alerts.

## 14. Why use refresh token rotation?
It reduces the blast radius of a stolen refresh token and gives a clear server-side revocation path.

## 15. How are passwords protected?
Passwords are hashed with bcrypt before storage. The backend never stores plaintext passwords.

## 16. What is the biggest scaling bottleneck in this version?
Unread count computation and conversation summary aggregation would become expensive at very large scale without denormalized projections or precomputed counters.

## 17. Why use timestamp pagination for messages?
It is easy to explain and works well with a conversation-timestamp index. For very large scale, unique monotonic message IDs would be more robust.

## 18. How would you add message search?
Introduce a search pipeline, likely through an asynchronous indexing flow into Elasticsearch or OpenSearch, instead of putting full-text search pressure directly on the transactional database.

## 19. How would you add file attachments?
Store metadata in PostgreSQL, binary objects in object storage, and serve them through a CDN. Attachment processing should be offloaded to async workers.

## 20. How would you support read receipts?
Add per-message or per-conversation read-state projections depending on product granularity. For many-member rooms, read receipts may need summarization rather than one row per recipient per message.

## 21. How would you handle millions of active sockets?
Run many websocket nodes behind a load balancer, keep auth stateless, use Redis or a more advanced broker for coordination, and split presence and messaging concerns into dedicated services as traffic grows.

## 22. Why use shared schemas across frontend and backend?
It reduces drift, improves developer speed, and makes validation behavior consistent. The repo uses the shared package for zod contracts and shared DTO types.

## 23. How do you think about reliability versus feature speed?
This project intentionally picks features that demonstrate correct architecture rather than packing in surface-level complexity. Presence, typing, unread counts, and refresh rotation provide higher design value than many shallow UI-only features.

## 24. What would you monitor in production?
API latency, websocket connection count, Redis memory and command latency, PostgreSQL slow queries, message send failure rate, refresh token failure rate, and unread-count query cost.

## 25. If you had one week to improve this project, what would you do?
I would add observability, stronger tests around realtime flows, denormalized unread counters, and attachment infrastructure because those improve operational credibility without changing the core architecture direction.
