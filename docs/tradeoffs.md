# Tradeoffs

## Monolith vs Microservices
### Chosen now: modular monolith
- Easier to build, test, and explain.
- Lower operational burden.
- Good fit for a portfolio project and an early-stage product.

### What is traded away
- Independent scaling of auth versus messaging versus presence is limited.
- One deployment can affect more than one domain.
- Team boundaries are process-level rather than service-level.

## PostgreSQL vs MongoDB
### Chosen now: PostgreSQL
- Better fit for relational membership and message ownership.
- Easier unique constraints for direct thread deduplication.
- Strong consistency and indexing model.

### What is traded away
- Horizontal write sharding is more deliberate and operationally involved.
- Some document-style flexibility is reduced.

## Socket.IO vs Raw WebSockets
### Chosen now: Socket.IO
- Simpler developer experience.
- Rooms, acknowledgements, reconnection support, and Redis adapter are readily available.
- Good for a pragmatic interview project where implementation time matters.

### What is traded away
- Extra abstraction and protocol overhead versus raw websockets.
- Less control over a custom binary or ultra-lean protocol.

## Polling vs WebSockets
### Chosen now: WebSockets for realtime, HTTP for initial and paginated data
- Lower latency for active conversations.
- Better user experience for typing and live delivery.
- Cleaner separation of concerns than frequent polling.

### What is traded away
- More operational complexity than pure request-response.
- Connection management becomes a first-class concern.

## Redis Necessity
### Why it is justified here
- Presence must be shared across instances.
- Typing signals are short-lived and a good fit for TTL-based storage.
- Socket.IO horizontal fan-out needs a cross-node adapter.

### What is traded away
- Another moving part in local and production environments.
- Failure handling becomes more complex.

## Simplicity vs Future-Proofing
The project deliberately stops before event sourcing, microservices, or CQRS projections. Those patterns are powerful, but introducing them too early would make the codebase harder to understand and less honest as a portfolio artifact. The current design shows that the engineer understands where complexity belongs and when it does not.
