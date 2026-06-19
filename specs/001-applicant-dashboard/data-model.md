# Data Model: Applicant Dashboard

**Feature**: Applicant Dashboard

## Key Entities

### 1. `payment_requests`
Primary record of a payment request.
- **Fields**: 
  - `id` (UUID, PK)
  - `request_number` (String, unique format PRF-YYYY-NNNNNN)
  - `applicant_id` (UUID, FK to `users`)
  - `status_id` (Int, FK to `payment_statuses`)
  - `total_amount` (Numeric/String)
  - `currency_id` (Int, FK to `currencies`)
  - `application_date` (Date)
  - `desired_payment_date` (Date)
  - `payment_method_id` (Int, FK to `payment_methods`)
  - `has_receipt` (Boolean)
  - `is_deleted` (Boolean, default false)
- **Relationships**:
  - 1:M to `payment_breakdown_items`
  - 1:M to `receipt_files`
  - 1:M to `approval_logs`
- **Rules**: `total_amount` is sum of breakdown items. Soft-delete via `is_deleted`.

### 2. `payment_breakdown_items`
Line items for a payment request.
- **Fields**:
  - `id` (UUID, PK)
  - `payment_request_id` (UUID, FK)
  - `description` (String)
  - `amount` (Numeric/String)
- **Rules**: Max 15 items per request. Min 1 item per draft.

### 3. `receipt_files`
Uploaded receipt metadata.
- **Fields**:
  - `id` (UUID, PK)
  - `payment_request_id` (UUID, FK)
  - `file_name` (String)
  - `file_size` (Int, bytes)
  - `mime_type` (String)
  - `s3_key` / `local_path` (String)
  - `is_deleted` (Boolean)
- **Rules**: Max 10MB per file, 50MB total per request. Valid types: PDF, PNG, JPG/JPEG.

### 4. `approval_logs`
Immutable audit trail.
- **Fields**:
  - `id` (BigSerial, PK)
  - `payment_request_id` (UUID, FK)
  - `action_taken_by_user_id` (UUID, FK)
  - `action_type_id` (Int, FK to `approval_action_types`)
  - `previous_status_id` (Int, nullable)
  - `new_status_id` (Int)
  - `comment` (String, nullable)
  - `ip_address` (String)
  - `user_agent` (String)
  - `timestamp` (TimestampZ)
- **Rules**: Protected by DB trigger (append-only).
