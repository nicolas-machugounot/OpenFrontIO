# Authentication & Authorization Flow

## Token Management

1. **Long-lived refresh token**: Stored as an HTTP-only cookie with a 30-day TTL
2. **Token exchange**: User sends refresh token to the API server, receives a short-lived JWT in return, and the refresh token is rotated
3. **JWT properties**:
   - 15-minute TTL (limits damage window if compromised)
   - Contains the persistentID
   - Stored in memory only (lost on page refresh)

## WebSocket Authorization

1. **WebSocket connection**: When user connects, server validates the JWT and creates a `clientID => persistentID` mapping, establishing that this client is authorized to act on behalf of this persistent identity

2. **Post-connection authorization**: Once WebSocket connection is established, no further token verification is needed. For actions like pause requests, simple ownership checks suffice.

## Key Insight

JWT verification happens once at WebSocket connection time. After that, the established mapping allows for lightweight authorization checks based on clientID rather than repeated token validation.

## Development Mode

When running the game in development, the API server is not active, so the game falls back to checking only persistentIDs for verification instead of JWTs. This is less secure, as stealing a persistentID means the attacker has indefinite control of the victim's account.

## Account Linking Strategy (Discord + Email)

### Problem

Some players cannot access Discord from their network. If they use magic-link login without prior account linking, they can end up on a different identity, losing access to their existing stats/cosmetics progression.

### Goal

Allow players to authenticate with either Discord or email while preserving a single persistent account identity.

### Scope split

- **This repository (client + game server):**
   - Expose clear UI paths for linking Discord and email in account settings.
   - Consume existing auth endpoints and avoid breaking JWT/persistentID behavior.
- **Identity API service (`jwtIssuer()` backend):**
   - Enforce canonical account identity and perform safe merge/link operations.
   - Prevent accidental account forks when a Discord-owned account later uses email.

### Required backend contract

At minimum, the identity API should support these guarantees:

1. If a user is authenticated and adds another login method, both methods map to the same `persistentID`.
2. Linking is idempotent and conflict-safe (clear error for already-linked to another identity).
3. Magic-link completion returns/sets session for the canonical linked identity.
4. `/users/@me` returns linked auth methods so client can render account state accurately.

### Suggested rollout

1. **UI discoverability (safe, immediate):** show Discord↔email linking actions in account modal.
2. **API linking semantics:** backend ensures login methods resolve to same canonical identity.
3. **Migration/backfill:** detect duplicate identities and provide explicit merge flow where needed.
4. **Validation:** add tests for Discord-only, email-only, dual-linked, and conflict cases.
