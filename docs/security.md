# Security

## JWT Strategy
- Access tokens are short-lived and sent as Bearer tokens.
- Refresh tokens are longer-lived, rotated, and stored in an HTTP-only cookie.
- Refresh token hashes are stored in PostgreSQL so tokens can be revoked on logout.

This avoids long-lived bearer tokens being the only session mechanism and gives the system a clear revocation path.

## Password Hashing
- Passwords are hashed with `bcrypt` using a strong work factor.
- Plaintext passwords are never stored.
- The schema is ready for future migration to Argon2 if desired.

## Rate Limiting
Authentication routes are rate-limited because:

- login endpoints are brute-force targets,
- registration endpoints are abuse targets,
- refresh endpoints can be abused during token probing.

The current implementation applies a simple auth-route limiter. In production, rate limits would usually be layered:

- edge or CDN,
- API gateway or ingress,
- application-specific limits for sensitive routes.

## Validation
- Input validation uses shared zod schemas.
- The same request shapes are reused in the frontend and backend.
- Validation errors are normalized through centralized error middleware.

This reduces drift between client and server contracts.

## Common Attack Considerations
### Credential stuffing
- mitigate with rate limiting,
- add login anomaly detection later,
- encourage password hygiene.

### Token theft
- keep refresh tokens in HTTP-only cookies,
- keep access tokens short-lived,
- rotate refresh tokens regularly.

### Mass assignment
- use explicit schemas and DTO parsing,
- map validated inputs into service methods rather than passing raw bodies through.

### Injection attacks
- Prisma parameterization avoids raw string query composition in normal paths,
- direct SQL should remain limited and parameterized if introduced later.

### Cross-site concerns
- cookie settings use `httpOnly` and `sameSite=lax`,
- CORS is restricted to the configured frontend origin.

## Additional Hardening for Production
- HTTPS everywhere,
- secret rotation policies,
- secure cookie mode in production,
- audit logging for auth events,
- device-based session management,
- CSP headers on the frontend,
- attachment malware scanning,
- abuse detection for spam and room creation bursts.
