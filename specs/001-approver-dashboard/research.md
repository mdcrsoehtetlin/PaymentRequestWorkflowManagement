# Research Findings: Final Approver Dashboard

This document details the architectural decisions and best practices evaluated for the Final Approver Dashboard implementation.

---

## 1. DB Transactions & Audit Logging (TypeORM)

- **Decision**: Use DataSource `queryRunner` pattern for transactions instead of TypeORM `@Transaction()` decorators or Repository-based transactions.
- **Rationale**: 
  - Allows precise control over transaction bounds, ensuring that updates to the `PaymentRequest` status, assignee ID, and the addition of `ApprovalLog` entries are fully atomic.
  - Required for reliable audit logging to guarantee an immutable trail (`approval_logs`) is recorded for every workflow state transition.
  - Matches the project standard pattern defined in `DD_COMMON_09`.
- **Alternatives Considered**: 
  - `@Transaction()` decorator: Rejected due to issues with NestJS dependency injection scopes and lack of flexibility in dynamic error mapping.
  - Standard Repository save: Rejected because updating the status and inserting logs are separate calls, which could result in partial writes on failure.

---

## 2. Real-Time Status Updates (Socket.IO)

- **Decision**: Emit events through the shared `WebsocketGateway` using room-based propagation (`'ACCOUNTING'`, `'user:<applicant_id>'`).
- **Rationale**: 
  - Minimizes network overhead by targeting only relevant users (e.g. notifying the Applicant when their request is rejected, or the Accounting group when a request is approved).
  - Ensures compliance with the ≤ 500ms latency requirement.
- **Alternatives Considered**: 
  - Global broadcast (`io.emit`): Rejected as it leaks event metadata to unauthorized roles and degrades performance at scale.
  - Polling: Rejected due to latency constraints and higher server resource load.

---

## 3. Redis Cache Eviction

- **Decision**: Invalidate cached payloads under namespace `payment_request:payload:<id>` using Redis `DEL` immediately upon transaction commit.
- **Rationale**: 
  - Prevents stale details from being displayed to other roles when a request advances in the workflow.
  - Ensures immediate cache consistency without waiting for the 10-minute TTL to expire.
- **Alternatives Considered**: 
  - Relying on TTL expiration: Rejected because users would see stale dashboard data for up to 10 minutes.
  - Dynamic cache update: Rejected because rebuilding the complex detail view payload to re-cache is expensive. Eviction is simpler and cheaper.

---

## 4. Optimistic Locking Concurrency Control

- **Decision**: Implement status-checking guards on the API endpoints (`status_id === 7` before approve/reject, and validation on transition from status `6`).
- **Rationale**: 
  - Protects against concurrency conflicts if multiple Approvers open the same request. If the status in the database doesn't match the expected source status, return a `CONFLICT` (HTTP 409) error.
- **Alternatives Considered**: 
  - Database version column (TypeORM `@VersionColumn`): Rejected because the conflict detection is status-based and context-specific for workflow state transitions rather than row edits.
