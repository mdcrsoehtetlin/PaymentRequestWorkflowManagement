# Data Model: Audit Log Search Enhancement

**Date**: 2026-06-22

## Overview

This feature does not introduce new entities or modify existing tables. All changes are limited to query parameters on existing entities. This document describes the filterable attributes of existing entities relevant to the audit log search.

## Entity: ApprovalLog (approval_logs)

The immutable audit trail table. This is the primary entity being queried.

| Attribute | Type | Filterable | Description |
|-----------|------|-----------|-------------|
| `approval_log_id` | INTEGER (PK) | No | Primary key |
| `payment_request_id` | INTEGER (FK) | **Yes** (as `requestId`) | References `payment_requests.payment_request_id` |
| `action_taken_by_user_id` | INTEGER (FK) | No (replaced by actorName) | References `users.user_id` |
| `action_type_id` | INTEGER (FK) | **Yes** (as `actionTypeId`) | References `approval_action_types.action_type_id` |
| `previous_status_id` | INTEGER (FK, nullable) | No | Previous workflow status |
| `new_status_id` | INTEGER (FK, nullable) | No | New workflow status |
| `comment` | VARCHAR(1000, nullable) | No | Rejection reason |
| `ip_address` | VARCHAR(45) | No | Client IP |
| `user_agent` | TEXT | No | Browser user agent |
| `timestamp` | TIMESTAMPTZ | **Yes** (as `startDate`/`endDate`) | Log creation timestamp |

### Key Relationships

- `ApprovalLog` N:1 `User` (via `action_taken_by_user_id`) — used for actor name resolution
- `ApprovalLog` N:1 `ApprovalActionType` (via `action_type_id`) — used for action type filter
- `ApprovalLog` N:1 `PaymentRequest` (via `payment_request_id`) — used for request ID filter

### Existing Indexes (relevant to search)

| Index Name | Columns | Purpose |
|-----------|---------|---------|
| `idx_approval_logs_timestamp` | `timestamp` | Date range filtering |
| `idx_approval_logs_action_type` | `action_type_id` | Action type filtering |
| `idx_approval_logs_request` | `payment_request_id` | Request ID filtering |
| `idx_approval_logs_actor` | `action_taken_by_user_id` | Actor lookup |

## Filter Combination Logic (AND)

All active filters are combined with AND logic:

```sql
SELECT al.*, u.full_name AS actor_name
FROM approval_logs al
LEFT JOIN users u ON al.action_taken_by_user_id = u.user_id
WHERE (al.timestamp >= :startDate OR :startDate IS NULL)
  AND (al.timestamp <= :endDate OR :endDate IS NULL)
  AND (al.action_type_id = :actionTypeId OR :actionTypeId IS NULL)
  AND (al.payment_request_id = :requestId OR :requestId IS NULL)
  AND (u.full_name ILIKE :actorNamePattern OR :actorName IS NULL)
ORDER BY al.timestamp DESC
```

- All filter parameters are optional. When omitted/null, that condition is skipped.
- `actorNamePattern` is `%<search_term>%` for partial matching.
- `startDate` and `endDate` are inclusive (`>=`, `<=`).
