# Feature Specification: User Management Page of Admin Panel

**Feature Branch**: `001-admin-user-management`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "User Management Page of Admin Panel"

## Metadata Header
- **Target Screen ID**: SCR_005_A_USER_MGMT, SCR_005_B_MASTER_CONFIG, SCR_005_C_AUDIT_LOGS
- **Function ID**: FN-005001, FN-005
- **Command Tag**: `/speckit-specify`
- **Document Reference Alignment**: 
  - Requirement Reference: [01_要件定義書_REQUIREMENT_SPEC.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md) (Section 2.1, 2.2, 3.4, 4.4, 4.5, 5.2, 5.8)
  - Development Rules Reference: [02_開発ルール_DEVELOPMENT_RULES.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md) (Section 1, 2, 3, 5, 6, 7, 8, 9, 10)
  - Database Design Reference: [03_データベース設計書_DATABASE_SPEC.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/core_ja/03_データベース設計書_DATABASE_SPEC.md) (Section 2, 3.1, 3.4, 4, 5)
  - Functional Spec Reference: [ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/screens/05_admin_dashboard/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md)
  - Screen Items Spec Reference: [ADMIN_05_画面項目設計書_SCREEN_ITEMS.md](file:///d:/AI/開発/PaymentRequestWorkflowManagement/docs/screens/05_admin_dashboard/ADMIN_05_画面項目設計書_SCREEN_ITEMS.md)

---

## Clarifications

### Session 2026-06-22
- Q: How should the system initialize the password for a newly registered user account? → A: Automatically generate a secure, random temporary password displayed to the administrator upon registration.
- Q: If a user forgets their password, how should the administrator reset it? → A: Add a "Reset Password" action trigger inside the Edit Details modal that generates and displays a new random temporary password.
- Q: Should the branch field be restricted to a dropdown menu of pre-defined branch offices, or remain a free-text input? → A: Restrict to a Dropdown list of organization-approved branches (Yangon, Mandalay, Naypyidaw).
- Q: Should we restrict the maximum date range selection for a single audit log query? → A: Allow unlimited date ranges (no constraint), relying solely on indexing and pagination.

---

## User Scenarios & Testing *(mandatory)*

### Functional Overview
This module acts as the central control console for the `ADMIN` role. It provides tools to manage system users (creation, updates, deactivation), verify system lookup tables (currencies, roles, statuses, payment methods, payment types), and review the immutable global audit logs. System administrators have global read-only visibility into payment requests and logs, but are strictly prohibited from creating or approving payment requests to ensure separation of duties and prevent conflicts of interest.

### User Story 1 - User Registration and Profile Modification (Priority: P1)

Administrators need a secure portal to register new employee accounts and update existing profiles (name, email, branch, role assignment) to keep system directory data aligned with organizational changes.

**Why this priority**: Crucial for onboarding/offboarding employees and assigning roles. Without this, no user can log in or access the system, making it the most critical blocker for system operation.

**Independent Test**: Can be verified by calling the user creation API, checking database record insertion in the `users` table, logging in with the newly registered user, and editing user attributes.

**Acceptance Scenarios**:

1. **Given** the Admin is logged in and is on the User Account Management screen, **When** they click "+ Register New User", fill in the form with a unique Employee Number, valid email, name, branch, and role, and click "Save", **Then** the user account is created in the database, a secure random temporary password is generated and displayed on screen to the Admin, and the new user is visible in the users grid.
2. **Given** the Admin is on the User Account Management screen, **When** they select an existing user, click "Edit Details", update their name and branch, and click "Save Changes", **Then** the database record is updated and the users grid shows the modified data.
3. **Given** the Admin attempts to register a user with an Employee Number or Email that already exists in the database, **When** they click "Save", **Then** the transaction fails, and the UI displays validation error `VAL-ADM-001` or `VAL-ADM-002` respectively.
4. **Given** the Admin has opened the Edit Details modal for an existing user, **When** they click "Reset Password", **Then** the system generates a new secure, random temporary password, displays it on screen to the Admin, updates the database password hash, and invalidates any active sessions for that user in Redis.

---

### User Story 2 - User Account Activation & Deactivation (Priority: P2)

Administrators need to immediately activate or deactivate user accounts (toggling `is_active` flag) to prevent former employees or unauthorized users from accessing the system, and to restore locked accounts.

**Why this priority**: Key security control for offboarding. Disabling an account must take effect instantly across all sessions to prevent security breaches.

**Independent Test**: Can be tested by deactivating an active user and attempting to log in or make API requests with that user's active session, verifying immediate token invalidation.

**Acceptance Scenarios**:

1. **Given** a user account is active, **When** the Admin toggles the status toggle to "Inactive" and confirms the prompt, **Then** the user's `is_active` status changes to `FALSE` in the database, and their active session tokens are immediately evicted from the Redis cache.
2. **Given** a user account is inactive, **When** the Admin toggles the status to "Active", **Then** the user's `is_active` status changes to `TRUE` in the database, allowing them to log in again.
3. **Given** the Admin is viewing their own user profile in the users grid, **When** they attempt to toggle their own status, **Then** the toggle control is disabled to prevent self-lockout.

---

### User Story 3 - Global Audit Log & Master Data Inspection (Priority: P3)

Administrators need to view system master data tables and inspect global transaction history (`approval_logs`) containing timestamps, actions, IP addresses, and user agents to comply with corporate auditing requirements.

**Why this priority**: Required for regulatory compliance and tracing workflow changes. It is a secondary auditing requirement once transactional systems are running.

**Independent Test**: Can be tested by creating workflow transitions (e.g. submitting a payment request) and verifying that a corresponding immutable entry is immediately queried in the global audit grid.

**Acceptance Scenarios**:

1. **Given** the Admin selects the "MASTER DATA CONFIG" tab, **When** they select a category (e.g., "Payment Types"), **Then** a read-only list of configured categories from the database is rendered on screen.
2. **Given** the Admin selects the "AUDIT LOGS" tab, **When** they search by a date range and target actor, **Then** the grid displays matching immutable logs sorted chronologically descending.
3. **Given** the Admin selects an audit log entry from the grid, **When** they view the details, **Then** the Metadata Detail Panel displays the executor's IP address, browser User Agent, and action details.

### Edge Cases

- **Concurrent Modification (Optimistic Locking)**: If an Admin attempts to update a user's details or toggle status while another Admin is updating the same user, the system must detect the version conflict, roll back the second transaction, and display `ERR-ADM-409` ("This record has been modified by another user. Refresh and try again.").
- **Deactivation of Assignees**: If an Admin deactivates a user who is currently the `current_assigned_to_user_id` for active payment requests, the system must allow the deactivation, but system logic should ensure active tasks are re-assigned or flagged for manager intervention.
- **Audit Log Database Downtime**: If the audit log insert fails during a payment request status transition, the primary database transaction must roll back to prevent un-audited state modifications.

---

## Technical Stack & Governance Alignment

### Role-Based Access Control (RBAC) Guardrails
- **Access Guard Stack**: All admin endpoints must be decorated with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.Admin)`.
- **JWT Payload Claims**: The incoming JWT token must be verified, and the payload must contain the claim `role: 'ADMIN'` (role code mapping to database `user_roles.role_code`).
- **Frontend Guardrail**: React router routes under `/admin/*` must use a higher-order `AdminRoute` wrapper to inspect the logged-in user's role and redirect unauthorized users (`ERR-ADM-403`) to the home route.

### Directory Isolation & Module Dependency Rules
- **Backend Isolation**: All admin endpoints must be implemented inside `AdminController` located in `src/modules/admin/admin.controller.ts`, backed by `AdminService` in `src/modules/admin/admin.service.ts`.
- **Strict Anti-Conflict Rules**: The admin module is strictly prohibited from importing services from applicant, manager, approver, or accounting modules. It must only communicate via `@shared/*` entities or the shared database layer.
- **Path Aliases**: Must use absolute path mapping as defined in tsconfig:
  - `@shared/` maps to `src/modules/shared/`
  - `@modules/` maps to `src/modules/`
  - `@config/` maps to `src/config/`
- **Frontend Layout Persistence**: The UI must be implemented under `frontend/src/pages/admin/` using the persistent split-dashboard layout shell, swapping the right-side workspace panel based on active tab selection without full page refreshes.

---

## Screen Layout & UI Component Architecture

### Persistent Split-Dashboard Shell

```text
+---------------------------------------------------------------------------------------------------+
|  [Admin Console] PRWM System                                                       | User Profile |
+===================================================================================================+
|  MENU NAVIGATION         |  DASHBOARD WORKSPACE                                                   |
|                          |                                                                        |
|  ( ) USER MANAGEMENT     |  USER ACCOUNT MANAGEMENT DASHBOARD                                     |
|  ( ) MASTER DATA CONFIG  |  Manage application users, assign operational roles, and toggle access |
|  ( ) AUDIT LOGS          |                                                                        |
|                          |  Search Filter: [Keyword       ] [Role      ] [Status]   [[ Search ]]  |
|                          |  Total Registered Users (42)                   [[ + Register New User ]] |
|                          |                                                                        |
|                          |  +------------------------------------------------------------------+  |
|                          |  | Emp No | Full Name | Email       | Branch | Role  | Status | Actions|  |
|                          |  +--------+-----------+-------------+--------+-------+--------+--------+  |
|                          |  | EMP001 | John Doe  | jd@prwm.com | Yangon | Admin | Active | [Edit] |  |
|                          |  +------------------------------------------------------------------+  |
|                          |  Page 1 of 3  < Previous  [1] 2 3  Next >                              |
+--------------------------+------------------------------------------------------------------------+
```

### Component Hierarchy
- `AdminDashboardShell` (Layout wrapper providing the sidebar frame and user profile header)
  - `AdminSidebarNavigation` (Left-hand navigation component with links and active indicators)
  - `UserManagementWorkspace` (Active workspace component when `/admin/users` is active)
    - `UserSearchFilters` (Keyword field, role and status dropdowns, search trigger button)
    - `UsersDataGrid` (Paginated grid table displaying employee numbers, names, email, branches, roles, status)
      - `StatusToggleSwitch` (Interactive toggle to switch user `is_active` state)
    - UserFormModal (Overlay modal popup used for registering a new user, editing details, and resetting passwords)
  - `MasterDataWorkspace` (Active workspace component when `/admin/master-data` is active)
    - `MasterCategorySelector` (Radio group buttons to choose the active master table configuration)
    - `MasterDataGrid` (Read-only data grid rendering lookup rows and codes)
  - `AuditLogWorkspace` (Active workspace component when `/admin/audit-logs` is active)
    - `AuditLogSearchFilters` (Start date, end date, actor dropdowns, fetch action button)
    - `AuditTransactionsGrid` (Grid table rendering timestamp, request number, action, actor name, IP)
    - `MetadataDetailPanel` (Docked right/bottom side-panel displaying client user agent and details)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-ADM-01**: System MUST restrict access to all administrative routes and APIs to users with active `role_code = 'ADMIN'`.
- **FR-ADM-02**: System MUST prevent administrators from creating, editing, soft-deleting, or approving payment requests to maintain segregation of duties.
- **FR-ADM-03**: System MUST support creating new user profiles with valid Employee Number, Name, Email, Branch, and Role ID. The system MUST automatically generate a secure, random temporary password, display it to the administrator on successful registration, and save the password hash using BCrypt (min 12 rounds).
- **FR-ADM-04**: System MUST support updating user details and immediately evicting deactivated user session tokens from Redis to force logout.
- **FR-ADM-05**: System MUST enforce Role-Based Access Control using JwtAuthGuard and RolesGuard on all API endpoints.
- **FR-ADM-06**: System MUST adhere to the premium enterprise dashboard aesthetic and exact Color Tokens from the Design System (Primary Corporate: `#1E3A8A`).
- **FR-ADM-07**: System MUST meet Performance Targets: Dashboard load ≤ 2s, search/filter query ≤ 1.5s, session eviction ≤ 200ms.
- **FR-ADM-08**: System MUST produce an immutable audit log (`approval_logs`) for every state-modifying action and prevent updates or deletions to logs.
- **FR-ADM-09**: System MUST display read-only lookup table lists (Roles, Payment Statuses, Payment Types, Payment Methods, Currencies) sourced from the database configurations.
- **FR-ADM-10**: System MUST comply with WCAG 2.1 AA accessibility requirements, including visible focus rings, aria-labels, and screen reader-friendly error message associations.
- **FR-ADM-11**: System MUST allow resetting a user's password inside the Edit Details modal. The action MUST generate a new secure, random temporary password, display it to the Admin, save the new hashed password using BCrypt (min 12 rounds), and instantly evict the target user's active session keys from Redis.

### Fields Matrix Table

| Field Name (Physical) | Logical Name | Component Type | Data Type | Constraints / Boundaries | Validation Error ID | HTTP Error Map |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `employee_number` | Employee Number | Text Input | VARCHAR(20) | Max 20 chars, alphanumeric only, must be globally unique | `VAL-ADM-001` | `409 CONFLICT` |
| `email` | Email Address | Email Input | VARCHAR(255) | Max 255 chars, valid RFC 5322 syntax, must be globally unique | `VAL-ADM-002` | `409 CONFLICT` |
| `full_name` | Full Name | Text Input | VARCHAR(200) | Max 200 chars, not empty | `VAL-ADM-003` | `400 BAD_REQUEST` |
| `branch` | Branch Office | Dropdown | VARCHAR(100) | Restricted to approved branches (Yangon, Mandalay, Naypyidaw) | `VAL-ADM-004` | `400 BAD_REQUEST` |
| `role_id` | System Role | Dropdown | INT (FK) | Reference active role ID in `user_roles` lookup | `VAL-ADM-005` | `400 BAD_REQUEST` |
| `is_active` | Account Status | Toggle Switch | BOOLEAN | Required, default `TRUE`. Cannot toggle self-admin profile. | N/A | `400 BAD_REQUEST` |
| `startDate` | Start Date | Date Picker | DATE | Required, format `YYYY-MM-DD`. Cannot exceed `endDate`. No range span limit; relies on B-Tree index optimization and server-side pagination. | N/A | `400 BAD_REQUEST` |
| `endDate` | End Date | Date Picker | DATE | Required, format `YYYY-MM-DD`. Cannot be in the future. No range span limit; relies on B-Tree index optimization and server-side pagination. | N/A | `400 BAD_REQUEST` |
| `version` | Optimistic Lock Version | Hidden Input | INT | Required for update mutations. Incremented on save. | N/A | `409 CONFLICT` |

### Key Entities

- **User**: Represents system user profiles and credentials. Attributes: `user_id` (PK), `email` (unique), `password_hash`, `full_name`, `employee_number` (unique), `branch`, `role_id` (FK), `is_active` (default true), `version` (optimistic lock version).
- **UserRole**: Static lookup table defining authorization roles. Attributes: `role_id` (PK), `role_code` (unique), `role_name` (unique).
- **ApprovalLog**: Immutable audit logs tracking all transactional workflow adjustments. Attributes: `approval_log_id` (PK), `payment_request_id` (FK), `action_taken_by_user_id` (FK), `action_type_id` (FK), `previous_status_id` (FK), `new_status_id` (FK), `comment` (nullable), `ip_address`, `user_agent`, `timestamp`.

---

## Data Mutation & Security Guardrails

### Transaction Lifecycle & Isolation
- **Database Engine & Isolation**: Sourced from PostgreSQL with Read Committed isolation level. All write mutations on the `users` table or lookup data checks must be executed within an explicit database transaction context.
- **Cache Eviction Order**: To prevent inconsistent stale state, writes must update PostgreSQL first. Upon successful database commit, the backend must immediately clear the corresponding cache keys in Redis (e.g. `session:<token>` and `payment_request:payload:<id>`).

### Mandatory Optimistic Locking
- **Mechanics**: The `users` table contains a `version` column (integer type).
- **Query Verification**: Every UPDATE operation on a user account profile or toggle action must include the current `version` in the WHERE clause:
  ```sql
  UPDATE users 
  SET full_name = :fullName, is_active = :isActive, version = version + 1 
  WHERE user_id = :userId AND version = :currentVersion;
  ```
- **Conflict Handling**: If the row count returned from this query is `0`, a concurrency conflict has occurred. The transaction must roll back, and the backend must throw an HTTP `409 Conflict` exception, mapping to `ERR-ADM-409` in the UI to notify the administrator.

### Immutable Audit Trail Operations
- **Log Execution**: Every action taken on payment requests (submission, verification, approval, rejection, payment completion) must write a row to the `approval_logs` table.
- **IP & User Agent Capturing**: The backend must extract the client's IP address (handling `X-Forwarded-For` proxy headers) and the full browser `User-Agent` string from the request context and write them to the log.
- **Database Immutability Enforcement**: The database enforces a `protect_approval_logs_immutability` trigger that raises an exception and aborts any transaction attempting an `UPDATE` or `DELETE` on the `approval_logs` table, ensuring audit trail integrity.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-ADM-01**: Dashboard load time for the User Account Management grid is ≤ 2 seconds under 100 concurrent admin requests.
- **SC-ADM-02**: Audit log searches across a dataset of up to 10,000 logs return results within ≤ 1.5 seconds.
- **SC-ADM-03**: Revocation latency for deactivated sessions takes ≤ 200 milliseconds to evict keys from Redis and force client logout.
- **SC-ADM-04**: Task completion rate for registering new users improves by 30% due to clear validation highlighting.

---

## Assumptions

- **A-ADM-01**: Active lookups and configurations (currencies, roles, statuses) are managed via database seeding and migrations; dynamic runtime configuration UI is out of scope for v1.
- **A-ADM-02**: The admin dashboard is intended for desktop/tablet use first. Collapsible mobile sidebars are supported, but data grid density is optimized for desktop viewports.
- **A-ADM-03**: Redis is running and connection pooling is configured correctly to handle high-speed session checks.
- **A-ADM-04**: Database triggers for `approval_logs` immutability are fully supported and active on the database engine instance.

---

## Verification & Test Boundary Criteria

### Automated Integration Test Cases
- **TC-ADM-POS-01 (Create User)**: Succeeded user creation returns HTTP `201 Created` and asserts the `users` database table contains the exact column values.
- **TC-ADM-POS-02 (Deactivate Session Eviction)**: Deactivating a user switches `is_active` to `FALSE` in the DB and immediately deletes their active session key from Redis, returning HTTP `200 OK`.
- **TC-ADM-NEG-01 (Duplicate Employee Number)**: Registering a user with a duplicate employee number must fail database constraints and return HTTP `409 Conflict` mapping to error `VAL-ADM-001`.
- **TC-ADM-NEG-02 (Admin Self-Lockout Guard)**: Attempting a `PATCH` request to toggle `is_active` to `FALSE` for the logged-in administrator's own ID must fail with HTTP `400 Bad Request` and prevent database mutation.
- **TC-ADM-NEG-03 (Optimistic Locking Conflict)**: Attempting to update a user profile with an expired version integer must return HTTP `409 Conflict` and roll back transaction changes.
- **TC-ADM-NEG-04 (Immutable Logs Check)**: Executing a direct SQL query attempting to delete or edit a row in `approval_logs` must trigger database exception `protect_approval_logs_immutability` and abort the action.

### Automated Unit Test Command
```bash
# Run unit and integration tests specifically for the admin module
npm run test -- --testPathPattern=admin
```
