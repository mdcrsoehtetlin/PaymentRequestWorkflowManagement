# Data Model: Applicant Dashboard

This document details the data model and entities extracted from the feature specifications for the Applicant Dashboard.

## Key Entities

### 1. Payment Request (`payment_requests`)
Primary entity representing one payment request through its full lifecycle.

**Fields & Validation:**
- `payment_request_id` (PK, INT): Unique identifier.
- `request_number` (VARCHAR): Generated as `PRF-YYYY-NNNNNN`. Resets yearly.
- `applicant_user_id` (FK, INT): User who created the request.
- `manager_user_id` (FK, INT): Selected manager for verification. Required for submission.
- `current_assigned_to_user_id` (FK, INT): Who currently needs to act on this request.
- `application_date` (DATE): Default to today. Cannot be future date.
- `desired_payment_date` (DATE): Must be today or later.
- `total_amount` (NUMERIC): Must be > 0. Sum of breakdown item amounts. Auto-calculated. Manual override forbidden.
- `currency_id` (FK, INT): Mandatory dropdown (MMK, USD, JPY).
- `payment_type_id` (FK, INT): Mandatory dropdown.
- `payment_method_id` (FK, INT): Mandatory dropdown (Bank Transfer, Cash, Check).
- `purpose` (VARCHAR): Max 255 chars in spec (wait, DATABASE_SPEC says 500, requirement says 255 - sticking to 500 from DB).
- `bank_account_info` (VARCHAR): Mandatory if Payment Method is Bank Transfer or Cash.
- `request_content` (TEXT): Max 1000 characters.
- `has_receipt` (BOOLEAN): Yes/No radio. If true, at least one receipt file required on submission.
- `status_id` (FK, INT): Workflow status.
- `is_deleted` (BOOLEAN): Soft delete flag. Can only be true if status is DRAFT.

**Relationships:**
- Belongs to `users` (applicant).
- Has many `payment_breakdown_items`.
- Has many `receipt_files`.
- Has many `approval_logs`.

### 2. Payment Breakdown Item (`payment_breakdown_items`)
Individual line-item breakdowns associated with each payment request.

**Fields & Validation:**
- `payment_breakdown_item_id` (PK, INT): Unique identifier.
- `payment_request_id` (FK, INT): Parent request.
- `line_number` (INT): Sequence 1 to 15.
- `item_date` (DATE): Date of expense usage.
- `description` (VARCHAR): Detailed description.
- `amount` (NUMERIC): Must be > 0 and <= 1,000,000,000.
- `quantity` (NUMERIC): Default 1.00.
- `unit_price` (NUMERIC): Optional.

**Relationships:**
- Belongs to `payment_requests`.

### 3. Receipt File (`receipt_files`)
Uploaded file metadata linked to a payment request.

**Fields & Validation:**
- `receipt_file_id` (PK, INT): Unique identifier.
- `payment_request_id` (FK, INT): Parent request.
- `original_file_name` (VARCHAR): Uploaded file name. Enforced convention `{Description}_{Date}_{Seq}.{ext}` server-side.
- `file_size` (BIGINT): Max 10 MB per file, 50 MB total per request.
- `mime_type` (VARCHAR): PDF, PNG, JPG, JPEG only.
- `is_deleted` (BOOLEAN): Soft delete flag.

**Relationships:**
- Belongs to `payment_requests`.

### 4. Approval Log (`approval_logs`)
Immutable audit record of every state transition and action.

**Fields:**
- `approval_log_id` (PK, BIGINT): Auto-increment.
- `payment_request_id` (FK, INT): Target request.
- `action_taken_by_user_id` (FK, INT): Actor.
- `action_type_id` (FK, INT): Action taken (e.g. CREATED, SUBMITTED).
- `previous_status_id` (FK, INT): Status before action.
- `new_status_id` (FK, INT): Target status.
- `comment` (TEXT): Mandatory for rejection.
- `ip_address` (VARCHAR): Client IP.
- `user_agent` (VARCHAR): Browser User Agent.

**Relationships:**
- Belongs to `payment_requests`.

## State Transitions
1. `DRAFT` -> `SUBMITTED_MANAGER` (Action: Submit to Manager)
2. `MANAGER_VERIFIED` -> `SUBMITTED_APPROVER` (Action: Submit to Final Approver)
3. `REJECTED_MANAGER` -> `SUBMITTED_MANAGER` (Action: Resubmit from Manager Rejection)
4. `REJECTED_APPROVER` -> `SUBMITTED_MANAGER` (Action: Resubmit from Approver Rejection - full restart)

*Note: Transition to DRAFT is not possible once submitted. It can only be rejected back.*
