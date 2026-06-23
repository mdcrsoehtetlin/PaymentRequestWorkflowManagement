# Data Model: User Management & Auditing

## 1. Entities & Fields

### 1.1 User Entity (`users` table)
Represents application users with authentication credentials and system roles.

| Column Name | Database Type | TS Type | Nullable | Constraints & Validation |
| :--- | :--- | :--- | :---: | :--- |
| `user_id` | `SERIAL` | `number` | No | Primary Key |
| `email` | `VARCHAR(255)` | `string` | No | Unique, valid email format (`VAL-ADM-002`) |
| `password_hash` | `VARCHAR(512)` | `string` | No | Hashed using BCrypt (12 salt rounds) |
| `full_name` | `VARCHAR(200)` | `string` | No | Max 200 chars, not empty (`VAL-ADM-003`) |
| `employee_number`| `VARCHAR(20)` | `string` | No | Unique, alphanumeric (`VAL-ADM-001`) |
| `department` | `VARCHAR(100)` | `string` | Yes | Max 100 chars |
| `branch` | `VARCHAR(100)` | `string` | No | Restricted to active branches: 'Yangon', 'Mandalay', 'Naypyidaw' (`VAL-ADM-004`) |
| `role_id` | `INT` | `number` | No | Foreign Key to `user_roles.role_id` (`VAL-ADM-005`) |
| `is_active` | `BOOLEAN` | `boolean` | No | Default `TRUE` |
| `version` | `INT` | `number` | No | Default `1` (Optimistic locking version field) |
| `created_date` | `TIMESTAMPTZ` | `Date` | No | Default `CURRENT_TIMESTAMP` |
| `modified_date` | `TIMESTAMPTZ` | `Date` | No | Default `CURRENT_TIMESTAMP` |
| `last_login_date`| `TIMESTAMPTZ` | `Date` | Yes | Updated on login |

### 1.2 UserRole Entity (`user_roles` table)
Lookup master table for RBAC roles.

| Column Name | Database Type | TS Type | Nullable | Constraints & Validation |
| :--- | :--- | :--- | :---: | :--- |
| `role_id` | `SERIAL` | `number` | No | Primary Key |
| `role_code` | `VARCHAR(20)` | `string` | No | Unique, uppercase (e.g. `APPLICANT`, `ADMIN`) |
| `role_name` | `VARCHAR(50)` | `string` | No | Unique, description name (e.g. `Applicant`) |
| `description` | `VARCHAR(500)` | `string` | Yes | |
| `is_active` | `BOOLEAN` | `boolean` | No | Default `TRUE` |

### 1.3 ApprovalLog Entity (`approval_logs` table)
Immutable audit trails of state changes for workflow transactions.

| Column Name | Database Type | TS Type | Nullable | Constraints & Validation |
| :--- | :--- | :--- | :---: | :--- |
| `approval_log_id`| `BIGSERIAL` | `string` | No | Primary Key (large integer for high volume logs) |
| `payment_request_id` | `INT` | `number` | No | Foreign Key to `payment_requests` |
| `action_taken_by_user_id`| `INT` | `number` | No | Foreign Key to `users` (author of the action) |
| `action_type_id` | `INT` | `number` | No | Foreign Key to `approval_action_types` |
| `previous_status_id` | `INT` | `number` | Yes | Foreign Key to `payment_statuses` |
| `new_status_id` | `INT` | `number` | Yes | Foreign Key to `payment_statuses` |
| `comment` | `TEXT` | `string` | Yes | Mandatory for rejections (min 10 characters) |
| `ip_address` | `VARCHAR(50)` | `string` | No | Sourced from request client IP headers |
| `user_agent` | `VARCHAR(500)` | `string` | No | Sourced from browser HTTP headers |
| `timestamp` | `TIMESTAMPTZ` | `Date` | No | Default `CURRENT_TIMESTAMP` |

---

## 2. Relationships

- **User ──► UserRole**: Many-to-One (`users.role_id` references `user_roles.role_id`).
- **ApprovalLog ──► User**: Many-to-One (`approval_logs.action_taken_by_user_id` references `users.user_id`).
- **ApprovalLog ──► PaymentRequest**: Many-to-One (`approval_logs.payment_request_id` references `payment_requests.payment_request_id`).

---

## 3. Database Constraints & Triggers
- **Trigger `trg_approval_logs_immutable`**: Intercepts `UPDATE` and `DELETE` queries on the `approval_logs` table, raising a database exception to enforce absolute immutability of transaction history.
- **Index `idx_users_email`**: Index on `users.email` for authentication check speed.
- **Index `idx_users_employee_number`**: Index on `users.employee_number` for query lookup speed.
- **Index `idx_approval_logs_request_timestamp`**: Composite index on `(payment_request_id, timestamp DESC)` for fast chronology timeline loads.
