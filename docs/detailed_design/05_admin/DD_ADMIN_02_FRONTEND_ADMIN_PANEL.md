# DD_ADMIN_02 — Frontend Page Specification

> **Doc ID:** PRWM-DD-ADM-02 | **Version:** 1.0 | **Status:** Draft  
> **Last Updated:** 2026-06-17

---

## 1. Overview

The `AdminPanel` is the root frontend screen for the `ADMIN` role. It provides
a persistent dashboard shell with three workspaces: user management, master
data verification, and audit log review.

- **File Path:** `frontend/src/pages/admin/AdminPanel.tsx`
- **Route:** `/admin`

This page is the entry point for all admin operations. It does not modify
payment requests; it only manages user accounts and read-only administrative
views.

---

## 2. Layout Structure

The page uses a split-dashboard shell with a fixed sidebar and a workspace area
that swaps content based on the selected tab.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Admin Shell Header (System name, current user, logout)              │
├───────────────────────────────┬──────────────────────────────────────┤
│ Sidebar Navigation             │ Workspace Header                     │
│ [User Management]              │ Title + short description            │
│ [Master Data Config]           │                                      │
│ [Audit Logs]                   ├──────────────────────────────────────┤
│                                │ Active Workspace Content             │
│                                │ - User Management workspace         │
│                                │ - Master Data workspace              │
│                                │ - Audit Log workspace                │
└───────────────────────────────┴──────────────────────────────────────┘
```

### 2.1 User Management Workspace

```
┌──────────────────────────────────────────────────────────────┐
│ Toolbar: [Keyword] [Role] [Status] [Search] [Register User]  │
├──────────────────────────────────────────────────────────────┤
│ Summary Row: Total Users / Active / Inactive                 │
├──────────────────────────────────────────────────────────────┤
│ Users Data Grid                                              │
│ [Emp No] [Full Name] [Email] [Branch] [Role] [Status] [Actions]
├──────────────────────────────────────────────────────────────┤
│ Pagination                                                   │
├──────────────────────────────────────────────────────────────┤
│ Modal (Register / Edit User)                                 │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Master Data Workspace

```
┌──────────────────────────────────────────────────────────────┐
│ Category Selector                                            │
│ [System Roles] [Payment Statuses] [Payment Types]           │
│ [Payment Methods] [Currencies]                               │
├──────────────────────────────────────────────────────────────┤
│ Toolbar: [Refresh]                                           │
├──────────────────────────────────────────────────────────────┤
│ Read-Only Master Data Grid                                   │
│ [Code] [Name] [Status/Order if applicable]                  │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Audit Log Workspace

```
┌──────────────────────────────────────────────────────────────┐
│ Filters: [Start Date] [End Date] [Target Actor] [Fetch]      │
├──────────────────────────────────────────────────────────────┤
│ Audit Transactions Grid                                      │
│ [Timestamp] [Request No] [Action] [Performed By] [IP] [Comment]
├──────────────────────────────────────────────────────────────┤
│ Pagination                                                   │
├──────────────────────────────────────────────────────────────┤
│ Selected Log Detail Panel                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Data Fetching & Hooks

The page uses tab-specific hooks so that each workspace can fetch and refresh
data independently.

```typescript
// frontend/src/pages/admin/hooks/useAdminPanel.ts
export function useAdminPanel() {
  // Manages active tab and top-level shell state
}

// frontend/src/pages/admin/hooks/useAdminUsers.ts
export function useAdminUsers() {
  // Fetches user list, filters, pagination, and register/edit modal state
}

// frontend/src/pages/admin/hooks/useAdminMasterData.ts
export function useAdminMasterData() {
  // Fetches read-only master data for the selected category
}

// frontend/src/pages/admin/hooks/useAdminAuditLogs.ts
export function useAdminAuditLogs() {
  // Fetches audit log history with date-range and actor filters
}
```

### 3.1 Data Sources

- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/toggle-active`
- `GET /api/v1/admin/master-data`
- `GET /api/v1/admin/audit-logs`

---

## 4. Sub-Components

### 4.1 `AdminSidebar`

- **Purpose:** Displays the three admin workspaces and highlights the active
  tab.
- **Props:** `activeTab`, `onTabChange`
- **Behavior:** Switches between `USER MANAGEMENT`, `MASTER DATA CONFIG`, and
  `AUDIT LOGS`.

### 4.2 `UserManagementWorkspace`

- **Purpose:** Renders the user list, filters, summary cards, and register/edit
  modal entry point.
- **Props:** `users`, `filters`, `pagination`, `onSearch`, `onRegister`,
  `onEdit`, `onToggleActive`
- **Behavior:** Supports keyword search, role/status filtering, pagination, and
  activation toggles with self-lockout prevention.

### 4.3 `AdminUserFormModal`

- **Purpose:** Creates or edits a user account.
- **Props:** `initialValues`, `mode`, `isOpen`, `onSubmit`, `onClose`
- **Behavior:** Handles employee number, full name, email, branch, role, and
  active status. Password is not part of the admin form.

### 4.4 `MasterDataWorkspace`

- **Purpose:** Displays read-only lookup tables for system roles, payment
  statuses, payment types, payment methods, and currencies.
- **Props:** `selectedCategory`, `rows`, `onCategoryChange`, `onRefresh`
- **Behavior:** Only refreshes and switches categories; no create/edit actions
  are exposed.

### 4.5 `AuditLogWorkspace`

- **Purpose:** Displays immutable approval history records with filters and a
  detail panel.
- **Props:** `filters`, `logs`, `selectedLog`, `onSearch`, `onSelectLog`
- **Behavior:** Supports date range and target actor filtering, then shows a
  selected log metadata panel.

### 4.6 Shared Presentational Components

- **`DataTable`**: Generic table rendering for users, masters, and audit logs.
- **`StatusBadge`**: Displays `is_active` and workflow labels consistently.
- **`ConfirmDialog`**: Used for activation/deactivation confirmation.
- **`Pagination`**: Shared paging controls for large data sets.
- **`EmptyState`**: Shown when no records are returned.

---

## 5. Contextual Actions / Business Logic

| Action / Button | Triggers API | Post-Action Behavior |
|-----------------|--------------|----------------------|
| Search Users | `GET /api/v1/admin/users` | Refreshes user table and summary state |
| Register User | `POST /api/v1/admin/users` | Closes modal, shows success toast, refreshes list |
| Save User Changes | `PATCH /api/v1/admin/users/:id` | Closes modal, shows success toast, refreshes list |
| Activate / Deactivate | `PATCH /api/v1/admin/users/:id/toggle-active` | Opens `ConfirmDialog`, updates status, refreshes list |
| Change Master Category | `GET /api/v1/admin/master-data` | Loads read-only rows for the selected category |
| Refresh Master Data | `GET /api/v1/admin/master-data` | Reloads the current master table |
| Search Audit Logs | `GET /api/v1/admin/audit-logs` | Refreshes audit grid and selected detail state |
| Select Audit Row | `GET /api/v1/admin/audit-logs/:id` or detail payload from list | Updates right-side metadata panel |

---

## 6. Real-time Updates (WebSocket)

- Joins the shared `ADMIN` role room via `joinRoom`
- Listens to: `statusUpdate` and `notification`
- Action on event: refreshes affected workspace data and shows a toast when
  the current admin-relevant data changes

### 6.1 Expected Event Reactions

- If a user is activated or deactivated by another admin, refresh the user list.
- If a system lookup table changes, refresh the master data workspace.
- If an audit log entry is appended, refresh the audit grid when the active
  filter scope matches the new record.
- If a personal admin notification arrives, show a non-blocking toast and
  refresh the affected workspace if needed.

---

## 7. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ADMIN_01](./DD_ADMIN_01_MODULE_OVERVIEW.md) | Admin module overview |
| [DD_ADMIN_03](./DD_ADMIN_03_API_ENDPOINTS.md) | Admin API design |
| [DD_ADMIN_04](./DD_ADMIN_04_DTOS_AND_TYPES.md) | Admin DTO and type design |
| [DD_ADMIN_05](./DD_ADMIN_05_BUSINESS_LOGIC.md) | Admin service logic |
| [ADMIN_04](../../screens/05_admin_panel/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md) | Admin functional behavior |
| [ADMIN_05](../../screens/05_admin_panel/ADMIN_05_画面項目設計書_SCREEN_ITEMS.md) | Admin screen items and field definitions |
| [DD_COMMON_05](../00_common/DD_COMMON_05_SHARED_COMPONENTS.md) | Shared components such as DataTable and ConfirmDialog |
| [DD_COMMON_06](../00_common/DD_COMMON_06_SHARED_SERVICES_AND_HOOKS.md) | Shared services, hooks, and API client patterns |
| [DD_COMMON_07](../00_common/DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Authentication and authorization chain |
