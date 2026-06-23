# Data Model: Accounting Dashboard

Based on `03_データベース設計書_DATABASE_SPEC.md` and Detailed Design.

## Entities

### `payment_requests`
Core transaction entity that tracks the lifecycle of a payment.
- `payment_request_id` (PK)
- `request_number` (Unique string: PRF-YYYY-XXX)
- `applicant_user_id` (FK to users)
- `manager_user_id` (FK to users)
- `final_approver_user_id` (FK to users)
- `accounting_user_id` (FK to users)
- `current_assigned_to_user_id` (FK to users)
- `total_amount` (NUMERIC 12,2)
- `status_id` (FK to payment_statuses)
- `has_receipt` (BOOLEAN)
- `payment_completed_date` (TIMESTAMPTZ)
- `is_deleted` (BOOLEAN, soft delete flag)
- `branch` (via applicant_user_id join)

### `approval_logs`
Immutable audit trail for all state transitions.
- `approval_log_id` (PK, BIGSERIAL)
- `payment_request_id` (FK)
- `action_taken_by_user_id` (FK)
- `action_type_id` (FK)
- `previous_status_id` (FK)
- `new_status_id` (FK)
- `comment` (TEXT)
- `ip_address` (VARCHAR)
- `user_agent` (VARCHAR)
- `timestamp` (TIMESTAMPTZ)

### `payment_statuses`
Lookup table.
- `status_id` (PK)
- `status_code` (e.g., 'APPROVED', 'PAID')

## State Transitions
- **APPROVED (8) -> PAID (10)**
  - Action: `PAYMENT_COMPLETED` (10)
  - Actor: Accounting User
  - Condition: Previous status MUST be APPROVED (8).
  - Terminal State: Yes.
