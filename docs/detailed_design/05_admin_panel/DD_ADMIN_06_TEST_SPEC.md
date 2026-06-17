# DD_ADMIN_06 — Test Specification

> **Doc ID:** PRWM-DD-ADM-06 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document defines the testing strategy for the Admin Panel Module, covering
backend unit tests, frontend component tests, and end-to-end (E2E) scenarios.

The test coverage focuses on the three admin workspaces:

1. User Management
2. Master Data Config
3. Audit Logs

---

## 2. Backend Unit Tests (`src/modules/admin/tests/`)

### 2.1 `admin.service.spec.ts`

Mock dependencies: `Repository<User>`, `Repository<ApprovalLog>`, lookup
repositories for master tables, `DataSource`, `WebsocketGateway`, and the
session invalidation adapter used by authentication/session management.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **createUser** | Valid admin payload provided | Saves a new user, returns created user detail, and records an audit event |
| **createUser** | Duplicate `employeeNumber` or `email` | Throws `ConflictException` (409) |
| **createUser** | Invalid or inactive `roleId` | Throws `BusinessRuleException` (422) |
| **updateUser** | Valid payload provided | Updates mutable profile fields and records an audit event |
| **updateUser** | Target user does not exist | Throws `NotFoundException` (404) |
| **updateUser** | Current admin tries to deactivate own account | Throws `ForbiddenException` (403) |
| **toggleUserActive** | Valid deactivate request | Updates `isActive = false`, revokes sessions, records an audit event |
| **toggleUserActive** | Target user is the current admin | Throws `ForbiddenException` (403) |
| **getMasterData** | Valid master category | Returns read-only rows for the requested lookup table |
| **getMasterData** | Invalid master category | Throws `BadRequestException` (400) |
| **getAuditLogs** | Valid filters and pagination | Returns logs sorted by timestamp descending with total count |
| **getAuditLogs** | Date range is invalid | Throws `BadRequestException` (400) |
| **getAuditLogById** | Existing audit log ID provided | Returns a single immutable log detail payload |
| **getAuditLogById** | Missing audit log ID | Throws `NotFoundException` (404) |

### 2.2 `admin.controller.spec.ts`

Mock dependencies: `AdminService`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **GET /users** | Valid query parameters | Calls service with parsed DTO and returns `200 OK` |
| **POST /users** | Valid payload | Calls service and returns `201 Created` |
| **PATCH /users/:id** | Valid payload | Calls service with numeric `id` and returns `200 OK` |
| **PATCH /users/:id/toggle-active** | Valid payload | Calls service and returns `200 OK` |
| **GET /master-data** | Category provided | Calls service and returns `200 OK` |
| **GET /audit-logs** | Date range and paging provided | Calls service and returns `200 OK` |
| **GET /audit-logs/:id** | Valid ID provided | Calls service and returns `200 OK` |

---

## 3. Frontend Component Tests

Using Vitest + React Testing Library.

### 3.1 `AdminPanel.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Shows the persistent shell and defaults to the User Management workspace |
| Tab switch | Clicking `Master Data Config` or `Audit Logs` swaps the active workspace without a full page reload |
| Route entry | Visiting `/admin` renders the default admin workspace redirect behavior |

### 3.2 `UserManagementWorkspace.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Displays keyword, role, and status filters plus the user grid and register button |
| Open modal | Clicking `Register User` opens a modal with employee number, full name, email, branch, role, and active status fields |
| Password field absence | The user modal does not render a password field |
| Self-lockout prevention | The current admin row cannot be deactivated from the grid or is blocked by confirmation logic |
| Search/filter action | Submitting filters calls the admin users API with the expected query parameters |

### 3.3 `MasterDataWorkspace.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Displays the five allowed categories: system roles, payment statuses, payment types, payment methods, and currencies |
| Category switch | Selecting a category reloads the read-only grid for that lookup table |
| Read-only behavior | No create, edit, delete, or save controls are rendered |

### 3.4 `AuditLogWorkspace.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Displays date range filters, target actor filter, audit grid, and detail panel placeholder |
| Filter search | Submitting filters reloads the audit log grid with the expected query payload |
| Row selection | Selecting a row populates the metadata detail panel |
| Read-only behavior | No edit, delete, or approve actions are rendered for audit rows |

---

## 4. End-to-End (E2E) Scenarios (Playwright)

| Scenario ID | Flow Description |
|-------------|------------------|
| **E2E-ADM-01** | **Happy Path: Create a User**<br>1. Login as Admin.<br>2. Open User Management.<br>3. Click `Register User`.<br>4. Fill employee number, full name, email, branch, role, and active status.<br>5. Submit the form.<br>6. Verify the new user appears in the grid. |
| **E2E-ADM-02** | **Happy Path: Edit and Deactivate a User**<br>1. Login as Admin.<br>2. Open an existing user.<br>3. Change a profile field and save.<br>4. Deactivate the same user.<br>5. Verify the active badge updates and the list refreshes. |
| **E2E-ADM-03** | **Read-Only Path: Master Data Verification**<br>1. Login as Admin.<br>2. Open Master Data Config.<br>3. Switch between categories.<br>4. Verify the grid updates for each category.<br>5. Confirm no edit or delete controls are available. |
| **E2E-ADM-04** | **Read-Only Path: Audit Log Inspection**<br>1. Login as Admin.<br>2. Open Audit Logs.<br>3. Set a date range and target actor filter.<br>4. Search logs.<br>5. Select a row and verify the detail panel updates. |
| **E2E-ADM-05** | **Negative Path: Prevent Self-Lockout**<br>1. Login as Admin.<br>2. Open the current admin account in User Management.<br>3. Attempt to deactivate the current account.<br>4. Verify the action is blocked and the account remains active. |

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ADMIN_01](./DD_ADMIN_01_MODULE_OVERVIEW.md) | Module scope and security rules tested here |
| [DD_ADMIN_02](./DD_ADMIN_02_FRONTEND_ADMIN_PANEL.md) | Frontend page behavior under test |
| [DD_ADMIN_03](./DD_ADMIN_03_API_ENDPOINTS.md) | API contract verified by controller/service tests |
| [DD_ADMIN_04](./DD_ADMIN_04_DTOS_AND_TYPES.md) | DTO validation and response shapes |
| [DD_ADMIN_05](./DD_ADMIN_05_BUSINESS_LOGIC.md) | Admin service business rules under test |
| [ADMIN_04](../../screens/05_admin_panel/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md) | Functional behavior and restrictions |
| [ADMIN_05](../../screens/05_admin_panel/ADMIN_05_画面項目設計書_SCREEN_ITEMS.md) | Screen fields, filters, and read-only constraints |
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Validation groups, DTO rules, and shared validators |
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | Shared UI component expectations |
| [DD_COMMON_06](../00_common/DD_COMMON_06_SHARED_SERVICES_AND_HOOKS.md) | Shared hooks and websocket service patterns |
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Guard chain, RBAC, and auth flow |
| [DD_COMMON_08](../00_common/DD_COMMON_08_ERROR_HANDLING.md) | Standard error codes and response shapes |
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Transaction and query patterns used by tests |
