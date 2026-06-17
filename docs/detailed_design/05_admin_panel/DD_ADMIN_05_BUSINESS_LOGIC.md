# DD_ADMIN_05 — Business Logic

> **Doc ID:** PRWM-DD-ADM-05 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document specifies the core business logic, transaction boundaries, and
read/write rules implemented in the `AdminService`.

- **Location:** `src/modules/admin/admin.service.ts`

The Admin module is responsible for system-wide user account maintenance,
read-only master data verification, and immutable audit log inspection.

---

## 2. Core Service Methods

### 2.1 `createUser(userData: CreateAdminUserDto)`

1. **Validation:** Handled by `CreateAdminUserDto` and admin-role authorization.
2. **Logic:**
   - Validate that `employeeNumber` is unique.
   - Validate that `email` is unique.
   - Validate that the requested `roleId` exists and is active.
   - Validate that `branch` is present and within length constraints.
   - Create a `User` entity from the submitted data.
   - Persist the new user record.
   - Record an audit event for the user creation action through the shared
     audit trail mechanism.
3. **Transaction Boundaries:**
   - `User` insert and audit recording must be treated as a single atomic
     operation.

### 2.2 `updateUser(id: number, dto: UpdateAdminUserDto)`

1. **Validation:** DTO validation plus admin authorization.
2. **Guards:**
   - The target user must exist.
   - The current authenticated admin must not be able to deactivate their own
     account.
   - If `roleId` changes, the new role must be valid and active.
3. **Logic:**
   - Update mutable user profile fields:
     - `fullName`
     - `email`
     - `branch`
     - `roleId`
     - `isActive`
   - If `isActive` changes to `false`, invalidate the affected user session(s)
     so the account is signed out immediately.
   - Write an audit entry describing the admin update action.
4. **Transaction Boundaries:**
   - `User` update and audit logging should be coordinated in one
     transactional unit where possible.

### 2.3 `toggleUserActive(id: number, isActive: boolean)`

1. **Guards:**
   - The target user must exist.
   - The target user must not be the current authenticated admin.
   - The current admin must not be allowed to deactivate their own account.
2. **Logic:**
   - Update `User.isActive`.
   - If the target user becomes inactive, revoke any active sessions.
   - Return the resulting active state to the caller.
   - Log the state change in the audit trail.
3. **Transaction Boundaries:**
   - User status update and audit logging should be treated as a single action.

### 2.4 `getAuditLogs(query: QueryAuditLogsDto)`

1. **Validation:** Input date strings must be parseable and the date range must
   be valid.
2. **Logic:**
   - Build a read-only query against `ApprovalLog`.
   - Join related request and user data for display purposes.
   - Apply optional filters:
     - `startDate`
     - `endDate`
     - `userId`
   - Apply pagination using `page` and `pageSize`.
   - Sort results by timestamp descending.
3. **Transaction Boundaries:**
   - None. This is a read-only query.
4. **Security Rule:**
   - Audit log records must never be updated or deleted through this service.

### 2.5 `getMasterData(category: MasterDataCategory)`

1. **Validation:** Category must match an allowed master data tab.
2. **Logic:**
   - Read from the corresponding lookup table.
   - Return read-only rows for:
     - system roles
     - payment statuses
     - payment types
     - payment methods
     - currencies
   - Preserve a stable response shape for the frontend tab renderer.
3. **Transaction Boundaries:**
   - None. This is a read-only query.

---

## 3. Data Calculation & Validation Rules

### 3.1 User Uniqueness Rules

- `employeeNumber` must be unique across all users.
- `email` must be unique across all users.
- Both checks should be performed before insert/update to avoid database
  constraint failures where practical.

### 3.2 Account State Rules

- Only administrators with the `ADMIN` role can mutate user status.
- An admin must not deactivate their own account.
- Disabled accounts should be treated as inactive immediately by the auth
  layer.

### 3.3 Read-Only Master Data Rules

- Master data categories are display-only in the admin panel.
- Users cannot create, edit, or delete master data from this module.
- Any changes to master data must be done through the controlled database or
  migration process.

### 3.4 Audit Log Rules

- `ApprovalLog` is append-only.
- No update or delete operation is allowed for audit history.
- Audit log entries are sorted newest-first in the UI and API responses.

### 3.5 Session Revocation Rules

- If a user is deactivated, their current sessions must be invalidated as soon
  as possible.
- Session invalidation should happen after the user record is persisted.

---

## 4. Implementation Notes

- The current controller/service shape already supports user creation,
  activation toggling, and audit log retrieval.
- The design specification additionally expects a read-only master data
  retrieval flow for the master configuration workspace.
- All admin actions should continue to use the shared auth guard chain:
  `JwtAuthGuard` -> `RolesGuard`.
- Audit log access should always be scoped to read operations only.

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ADMIN_03](./DD_ADMIN_03_API_ENDPOINTS.md) | API endpoints that call these service methods |
| [DD_ADMIN_04](./DD_ADMIN_04_DTOS_AND_TYPES.md) | DTOs and response types consumed by the service |
| [ADMIN_04](../../screens/05_admin_panel/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md) | Functional rules and admin behavior |
| [ADMIN_05](../../screens/05_admin_panel/ADMIN_05_画面項目設計書_SCREEN_ITEMS.md) | UI-driven field and filter constraints |
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Database access and transaction patterns |
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Authentication and authorization chain |
