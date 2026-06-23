# Research: Audit Log Search Enhancement

**Date**: 2026-06-22

## Overview

No NEEDS CLARIFICATION items were outstanding after `/speckit-clarify`. This research document captures the key technical decisions and implementation patterns for the audit log search enhancement.

## 1. Actor Name Search Strategy

**Decision**: Use PostgreSQL `ILIKE` with `%` wildcard wrapping on `users.full_name` via TypeORM `createQueryBuilder` left join.

**Rationale**: `ILIKE` provides case-insensitive partial matching natively in PostgreSQL. Using TypeORM query builder maintains SQL injection protection and keeps the query within the ORM layer (no raw SQL). The `actionTakenByUser` relation is already loaded via `leftJoinAndSelect` in the existing query.

**Alternatives considered**:
- Full-text search (`tsvector`/`tsquery`): Overkill for simple name search; adds index maintenance complexity.
- Client-side filtering: Impractical for paginated datasets.
- `LOWER(full_name) LIKE LOWER(:pattern)`: Equivalent to `ILIKE` but less idiomatic PostgreSQL.

## 2. Action Type Filter

**Decision**: Accept `actionTypeId` as optional integer query parameter. Add `AND log.actionTypeId = :actionTypeId` condition to the query builder when present.

**Rationale**: The existing `approval_logs` table has a `fk_approval_logs_user` foreign key to `approval_action_types`. Direct integer equality check is the most performant filter. No additional join needed.

**Alternatives considered**:
- Action type code filter: Would require an extra join; no benefit over ID-based filter.
- Multi-select: Out of scope per spec (single-select dropdown).

## 3. Request ID Filter

**Decision**: Accept `requestId` as optional integer query parameter. Add `AND log.paymentRequestId = :requestId` condition when present.

**Rationale**: Direct integer match on an indexed foreign key column. Efficient with existing B-Tree index.

## 4. Removing userId Parameter

**Decision**: Remove the existing `userId` query parameter from the backend endpoint. The new `actorName` parameter replaces it.

**Rationale**: The existing userId filter was exact-match on `action_taken_by_user_id`. The new actorName filter provides a more user-friendly experience (name search, partial match). Keeping both would create confusion about which filter takes precedence.

## 5. Debounce Implementation

**Decision**: Implement 300ms debounce using a custom `useDebounce` hook or inline `setTimeout`/`clearTimeout` pattern in the `AuditLogWorkspace` component.

**Rationale**: 300ms is the constitution-standard debounce delay for search/filter inputs. A custom `useDebounce` hook is reusable and keeps the component clean.

**Alternatives considered**:
- Lodash `debounce`: Avoid external dependency for a simple utility.
- `useEffect` with timer: Slightly more boilerplate but same result.

## 6. Action Type Japanese Labels

**Decision**: Hardcode the Japanese label mapping in the frontend, consistent with the existing pattern for role labels in `UserManagementWorkspace`.

**Rationale**: The `approval_action_types` table stores English names. Adding a Japanese `action_type_name_jp` column would require a database migration. Hardcoding the 10 labels in the frontend is simpler and matches the existing convention used for role labels and action type labels in `AuditLogWorkspace`.

**Label mapping**:

| action_type_id | action_code | Japanese label |
|---------------|-------------|---------------|
| 1 | CREATED | 作成 |
| 2 | EDITED | 編集 |
| 3 | SUBMITTED | 提出 |
| 4 | MGR_REVIEW_START | マネージャー確認開始 |
| 5 | MGR_VERIFIED | マネージャー確認 |
| 6 | MGR_REJECTED | マネージャー差戻し |
| 7 | APPR_REVIEW_START | 承認者確認開始 |
| 8 | APPROVED | 承認 |
| 9 | APPR_REJECTED | 承認者差戻し |
| 10 | PAYMENT_COMPLETED | 支払完了 |

## Pending Concerns

- Backward compatibility: Existing API consumers sending the removed `userId` parameter will have it silently ignored. No error will be thrown, so no breaking change occurs.
- The `approval_action_types` table may need to be verified seeded before frontend integration tests run.
