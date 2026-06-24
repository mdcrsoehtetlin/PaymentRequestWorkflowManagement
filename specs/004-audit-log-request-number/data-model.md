# Data Model: Audit Log Request Number Display

**Date**: 2026-06-24

## Entities

### Approval Log (audit_logs)

The core entity for this feature. Already has a relationship to payment_requests via `payment_request_id`.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| approval_log_id | uuid/string | PK | Unique identifier |
| payment_request_id | integer | FK → payment_requests | Links to payment request |
| action_taken_by_user_id | integer | FK → users | User who performed action |
| action_type_id | integer | NOT NULL | Type of action taken |
| previous_status_id | integer | NULLABLE | Status before transition |
| new_status_id | integer | NULLABLE | Status after transition |
| comment | string | NULLABLE | Action comment |
| ip_address | string | NOT NULL | Client IP |
| user_agent | string | NOT NULL | Client user agent |
| timestamp | timestamp | NOT NULL | When action occurred |

### Payment Request (payment_requests)

Read-only join entity for display purposes.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| payment_request_id | integer | PK | Internal ID |
| request_number | varchar(50) | UNIQUE, NOT NULL | Human-readable number (PR-YYYY-NNN) |

## Relationships

```
approval_logs.payment_request_id → payment_requests.payment_request_id
```

**Join Type**: LEFT JOIN (preserves audit logs even if payment request is deleted)

## Query Pattern

```sql
SELECT 
  log.*,
  request.request_number
FROM approval_logs log
LEFT JOIN payment_requests request 
  ON request.payment_request_id = log.payment_request_id
WHERE 
  request.request_number ILIKE '%search_term%'
ORDER BY log.timestamp DESC
LIMIT :limit OFFSET :offset
```

## Index Considerations

Existing indexes should be sufficient:
- `approval_logs.payment_request_id` (FK index)
- `payment_requests.request_number` (unique index)

No new indexes required for this feature.
