# API Contract: Admin User Creation

**Date**: 2026-06-24
**Feature**: fix-admin-user-creation

## Endpoint

### POST /api/v1/admin/users

Creates a new user account with an auto-generated temporary password.

**Authentication**: Required (JWT Bearer token with ADMIN role)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employee_number` | string | Yes | Unique employee identifier (max 20 chars) |
| `full_name` | string | Yes | User's full name (max 200 chars) |
| `email` | string | Yes | Valid email address (max 255 chars, unique) |
| `branch` | string | Yes | Office branch name (max 100 chars) |
| `role_id` | integer | Yes | Role ID from user_roles table |
| `password` | string | **No** | **Ignored** (auto-generated server-side) |
| `is_active` | boolean | No | Account status (default: true) |

**Example Request**:
```json
{
  "employee_number": "EMP001",
  "full_name": "John Doe",
  "email": "john.doe@company.com",
  "branch": "Yangon",
  "role_id": 1
}
```

**Success Response (201 Created)**:

```json
{
  "user_id": 123,
  "employee_number": "EMP001",
  "full_name": "John Doe",
  "email": "john.doe@company.com",
  "branch": "Yangon",
  "role_id": 1,
  "role_name": "Applicant",
  "is_active": true,
  "temporary_password": "aB3kL9mN",
  "created_date": "2026-06-24T10:30:00.000Z"
}
```

**Error Responses**:

| Status | Code | Condition | Message |
|--------|------|-----------|---------|
| 400 | BAD_REQUEST | Validation error | "Employee number must be unique and contain only alphanumeric characters." |
| 409 | CONFLICT | Duplicate employee_number | "この社員番号は既に登録されています" |
| 409 | CONFLICT | Duplicate email | "このメールアドレスは既に登録されています" |
| 403 | FORBIDDEN | Not ADMIN role | "Access Denied" |

**Notes**:
- The `password` field in the request is completely ignored
- The `temporary_password` in the response is the plaintext password for first login
- The temporary password is only returned once in this response
- The password is hashed with bcrypt (12 rounds) before storage

---

*End of API Contract*
