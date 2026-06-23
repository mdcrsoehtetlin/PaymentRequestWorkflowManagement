# API Contract: User Management & Audit Logs

All endpoints are protected under the base prefix `/api/v1/admin/` and require a valid Bearer JWT token with the `ADMIN` role.

---

## 1. User Management Endpoints

### 1.1 Fetch Users List
Returns a paginated list of system users.

- **URL**: `/api/v1/admin/users`
- **Method**: `GET`
- **Query Parameters**:
  - `keyword` (string, optional) - Match against employee number or full name.
  - `role_id` (number, optional) - Filter by role ID.
  - `is_active` (boolean, optional) - Filter by activation status.
  - `page` (number, optional, default: 1)
  - `pageSize` (number, optional, default: 20)
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "user_id": 14,
        "employee_number": "EMP014",
        "full_name": "Alice Smith",
        "email": "alice@prwm.com",
        "branch": "Yangon",
        "role_id": 1,
        "role_name": "Applicant",
        "is_active": true,
        "version": 1
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

---

### 1.2 Register New User
Creates a new user profile and generates a secure random temporary password.

- **URL**: `/api/v1/admin/users`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "employee_number": "EMP015",
    "full_name": "Bob Jones",
    "email": "bob@prwm.com",
    "branch": "Mandalay",
    "role_id": 2,
    "is_active": true
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user_id": 15,
    "employee_number": "EMP015",
    "full_name": "Bob Jones",
    "email": "bob@prwm.com",
    "branch": "Mandalay",
    "role_id": 2,
    "is_active": true,
    "temporary_password": "x7F3k9pQ",
    "version": 1
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (`VAL-ADM-003`, `VAL-ADM-004`, `VAL-ADM-005`): "Validation failed."
  - `409 Conflict` (`VAL-ADM-001` or `VAL-ADM-002` duplicate): "This employee number or email is already registered."

---

### 1.3 Update User Details
Updates specific user attributes. Enforces optimistic lock validation.

- **URL**: `/api/v1/admin/users/:id`
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "full_name": "Bob Jones Jr.",
    "branch": "Naypyidaw",
    "role_id": 2,
    "is_active": false,
    "version": 1
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user_id": 15,
    "employee_number": "EMP015",
    "full_name": "Bob Jones Jr.",
    "email": "bob@prwm.com",
    "branch": "Naypyidaw",
    "role_id": 2,
    "is_active": false,
    "version": 2
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Admin self-lockout or wrong inputs): "Cannot modify status of current admin session."
  - `409 Conflict` (`ERR-ADM-409` optimistic lock): "This record has been modified by another user. Refresh and try again."

---

### 1.4 Reset User Password
Generates a new secure temporary password for a user, updates database hash, and evicts session keys.

- **URL**: `/api/v1/admin/users/:id/reset-password`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "version": 2
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user_id": 15,
    "temporary_password": "t5B9y3zK",
    "version": 3
  }
  ```
- **Error Responses**:
  - `409 Conflict`: Concurrency version conflict.

---

## 2. Global Audit Logs Endpoints

### 2.1 Fetch Global Audit Logs
Saves logs from table and returns them paginated, ordered chronologically descending.

- **URL**: `/api/v1/admin/audit-logs`
- **Method**: `GET`
- **Query Parameters**:
  - `userId` (number, optional) - Target actor ID.
  - `request_number` (string, optional) - Match request number.
  - `ip_address` (string, optional) - Filter by IP address.
  - `startDate` (string, optional, e.g. "2026-06-01")
  - `endDate` (string, optional, e.g. "2026-06-22")
  - `page` (number, optional, default: 1)
  - `pageSize` (number, optional, default: 50)
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "approval_log_id": "8451",
        "payment_request_id": 412,
        "request_number": "PRF-2026-004",
        "action_taken_by_user_id": 8,
        "actor_name": "Alice Smith",
        "action_type": "Submitted",
        "previous_status": "Draft",
        "new_status": "Submitted to Manager",
        "comment": null,
        "ip_address": "192.168.1.42",
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "timestamp": "2026-06-22T05:30:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 50,
      "totalItems": 8451,
      "totalPages": 170
    }
  }
  ```
