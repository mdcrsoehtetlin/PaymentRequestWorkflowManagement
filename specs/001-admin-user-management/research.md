# Research Notes: User Management Page of Admin Panel

## 1. Technical Decisions & Approach

### 1.1 Secure Password Generation & Hashing
- **Decision**: Automatically generate an 8-character alphanumeric temporary password using Node.js built-in `crypto` library. Hash the password using `bcrypt` with exactly 12 salt rounds before database insertion.
- **Rationale**: Built-in `crypto.randomBytes` ensures cryptographically strong pseudorandom generation. `bcrypt` with 12 rounds meets the minimum safety security threshold defined in `constitution.md` without compromising API response time.
- **Alternatives Considered**: 
  - Standard system default password (e.g. `Welcome123!`): Rejected due to security risks (common credentials).
  - Deferring setting password via email invitation link: Rejected because email service is out of scope for v1.

### 1.2 Redis Session Eviction
- **Decision**: When an administrator toggles a user's active status to `FALSE`, the backend must immediately locate all active session keys matching `session:<token>` in Redis and evict them via the `DEL` command. It must also fetch active WebSocket connection IDs from Redis Set `websocket:user:<user_id>:sockets` and close the connections.
- **Rationale**: Immediate session eviction enforces real-time access revocation (≤ 200ms) as required by `FR-ADM-04`.
- **Alternatives Considered**:
  - Waiting for session token expiration (15 minutes): Rejected due to security vulnerability window.

### 1.3 Optimistic Locking Validation
- **Decision**: Maintain a `version` column in the `users` table. Every update operation must verify the version matches the state loaded in the client. On conflict (row count is 0), throw `ConflictException` (HTTP 409).
- **Rationale**: Prevents concurrent updates by multiple administrators from overwriting each other's changes.
- **Alternatives Considered**:
  - Pessimistic locking: Rejected as it blocks read operations and limits concurrency unnecessarily.

### 1.4 Date Range Audit Log Queries
- **Decision**: Perform queries against `approval_logs` without restricting date range span limits, relying on B-Tree composite index `(payment_request_id, timestamp DESC)` and server-side pagination (limit 50).
- **Rationale**: Simplifies audit capabilities for administrators who need to scan multi-year timelines, while B-Tree indexes ensure P95 query execution resolves under 1.5 seconds.
- **Alternatives Considered**:
  - Restricting dates to 3 months: Rejected by the product specification to allow full audits.
