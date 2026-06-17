# DD_ADMIN_03 — API Endpoints

> **Doc ID:** PRWM-DD-ADM-03 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** 2026-06-17

---

## 1. Controller Setup

- **File:** `src/modules/admin/admin.controller.ts`
- **Base Route:** `/api/v1/admin`
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('ADMIN')`

The Admin controller exposes system-wide administrative endpoints for user
maintenance, read-only master data verification, and audit log inspection.

---

## 2. API Endpoints Contract

### 2.1 GET /users

List users for the user management workspace with search, filtering, sorting,
and pagination.

- **Query Params:** `QueryAdminUsersDto` (page, pageSize, keyword, roleId, status, sortBy, sortOrder)
- **Response:** `200 OK` `PaginatedResponse<AdminUserListItem>`
- **Logic:** Calls `service.findUsers(query)`

### 2.2 POST /users

Create a new user account for the system administrator workflow.

- **Body:** `CreateAdminUserDto`
- **Response:** `201 Created` `AdminUserDetail`
- **Logic:** Calls `service.createUser(userData)`

### 2.3 PATCH /users/:id

Update an existing user account.

- **URL Params:** `id` (ParseIntPipe)
- **Body:** `UpdateAdminUserDto`
- **Response:** `200 OK` `AdminUserDetail`
- **Logic:** Calls `service.updateUser(id, dto)`

### 2.4 PATCH /users/:id/toggle-active

Activate or deactivate a user account.

- **URL Params:** `id` (ParseIntPipe)
- **Body:** `ToggleUserActiveDto` (`isActive`)
- **Response:** `200 OK` `{ success: true, isActive: boolean }`
- **Logic:** Calls `service.toggleUserActive(id, isActive)`

### 2.5 GET /master-data

Return read-only master data for the admin master configuration workspace.

- **Query Params:** `QueryMasterDataDto` (category)
- **Response:** `200 OK` `MasterDataResponse`
- **Logic:** Calls `service.getMasterData(query)`

### 2.6 GET /audit-logs

List global approval logs for the audit log workspace.

- **Query Params:** `QueryAuditLogsDto` (startDate, endDate, userId, page, pageSize)
- **Response:** `200 OK` `PaginatedResponse<AuditLogListItem>`
- **Logic:** Calls `service.getAuditLogs(query)`

### 2.7 GET /audit-logs/:id

Return a single audit log record for the detail panel.

- **URL Params:** `id` (ParseIntPipe)
- **Response:** `200 OK` `AuditLogDetail`
- **Logic:** Calls `service.getAuditLogById(id)`

---

## 3. Lookup Endpoints

The Admin Panel uses read-only master data that may be served from the admin
module or a shared lookup source.

- `GET /api/v1/admin/master-data?category=SYSTEM_ROLES`
- `GET /api/v1/admin/master-data?category=PAYMENT_STATUSES`
- `GET /api/v1/admin/master-data?category=PAYMENT_TYPES`
- `GET /api/v1/admin/master-data?category=PAYMENT_METHODS`
- `GET /api/v1/admin/master-data?category=CURRENCIES`

If the implementation chooses to expose each category separately, the same
response schema should be preserved.

---

## 4. Permission and Access Notes

- All endpoints require authentication.
- All endpoints require the `ADMIN` role.
- User management endpoints must prevent self-lockout actions on the currently
  authenticated admin.
- Master data and audit log endpoints are read-only.
- Audit log data must remain immutable and may only be queried.

---

## 5. Expected Response Shapes

### 5.1 AdminUserListItem

| Field | Type | Notes |
|---|---|---|
| `userId` | `number` | Primary key |
| `employeeNumber` | `string` | Unique employee identifier |
| `fullName` | `string` | User full name |
| `email` | `string` | Login email |
| `branch` | `string` | Branch name |
| `roleId` | `number` | FK to `user_roles` |
| `roleName` | `string` | Display label |
| `isActive` | `boolean` | Account state |

### 5.2 AdminUserDetail

Extends `AdminUserListItem` with audit-friendly metadata such as
`createdDate`, `modifiedDate`, and `lastLoginDate`.

### 5.3 AuditLogListItem

| Field | Type | Notes |
|---|---|---|
| `approvalLogId` | `string` | Primary key (`BIGINT` from PostgreSQL) |
| `timestamp` | `string` | UTC timestamp |
| `requestNumber` | `string` | Linked payment request number |
| `actionType` | `string` | Human-readable action label |
| `performedBy` | `string` | Actor name |
| `ipAddress` | `string` | Client IP |
| `comment` | `string \| null` | Optional comment |

### 5.4 MasterDataResponse

| Field | Type | Notes |
|---|---|---|
| `category` | `string` | Selected master data category |
| `rows` | `Array<object>` | Category-specific rows |

---

## 6. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ADMIN_01](./DD_ADMIN_01_MODULE_OVERVIEW.md) | Admin module overview |
| [DD_ADMIN_02](./DD_ADMIN_02_FRONTEND_ADMIN_PANEL.md) | Frontend page design |
| [DD_ADMIN_04](./DD_ADMIN_04_DTOS_AND_TYPES.md) | DTOs and response types |
| [DD_ADMIN_05](./DD_ADMIN_05_BUSINESS_LOGIC.md) | Service-layer business logic |
| [ADMIN_04](../../screens/05_admin_panel/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md) | Functional specification |
| [ADMIN_05](../../screens/05_admin_panel/ADMIN_05_画面項目設計書_SCREEN_ITEMS.md) | Screen item specification |
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Guard and authorization patterns |
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Database access and query patterns |
