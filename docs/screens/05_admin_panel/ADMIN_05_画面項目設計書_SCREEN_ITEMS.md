# Screen Items Specification (画面項目設計書) — Admin Panel

**Document ID:** PRWM-SIS-SCR-005
**Target Screen:** System Administrator Panel (Admin Panel)
**Subsystem:** Payment Request Lifecycle — Admin Management
**Function ID:** FN-005
**Version:** 1.7
**Created:** 2026-06-12
**Last Updated:** 2026-06-16
**Author:** Ye Maung Maung
**Review Status:** Approved
**Classification:** Internal — Engineering Division

---

## 1. Document Control (ドキュメント管理)

### 1.1 Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-12 | Ye Maung Maung | Initial release. |
| 1.5 | 2026-06-15 | Ye Maung Maung | Added admin panel field definitions and audit log workspace. |
| 1.6 | 2026-06-16 | Ye Maung Maung | Aligned the screen layout section with the three `SCR_005` admin screen designs and persistent side-navigation shell. |
| 1.7 | 2026-06-16 | Ye Maung Maung | Corrected broken related-document links and the user management screen mockup filename reference. |

### 1.2 Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` | Table structures, constraints, and data types. |
| 3 | PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |
| 4 | PRWM-FSD-005 | Functional Specification — Admin Panel | `docs/screens/05_admin_panel/ADMIN_04_機能設計書_FUNCTIONAL_SPEC.md` | Use cases, state transitions, validation rules. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose (目的)
The Admin Panel centralizes system administrator operations for managing users, master data, and audit log history within the Payment Request Workflow Management System.

### 2.2 Target Users & Roles (対象ユーザーと権限)

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | System Administrator (`ADMIN`) |
| **Required Authentication** | Authenticated JWT bearer token with `ADMIN` role |
| **Data Scope** | Full system scope for user, master data, and audit records |
| **Access Control** | `JwtAuthGuard` → `RolesGuard` → `AdminGuard` |

### 2.3 Core Functions & Basic Design Principles (主要機能・基本設計方針)
1. **User Management** — Search, view, register, update, and activate/deactivate users with role assignment.
2. **Master Data Configuration** — Maintain lookup tables for branches, system roles, payment types, methods, and currencies.
3. **Audit Log Review** — Inspect historical operation records with read-only filtering and detail inspection.

---

## 3. Screen Layout (画面レイアウト構成)

The Admin Panel uses a persistent split-dashboard shell across all `SCR_005` variants. The left sidebar provides module navigation, while the right workspace swaps content based on the active module selection.

### 3.1 Shared Navigation Shell
- **Sidebar Items:** `USER MANAGEMENT`, `MASTER DATA CONFIG`, and `AUDIT LOGS`.
- **Active Indicator:** The active item is marked with `(*)` and the inactive items use `( )`.
- **Workspace Behavior:** Only the right side changes between screens; the header and navigation shell remain consistent.
- **Responsive Intent:** Desktop-first layout with sidebar preservation, while smaller screens may collapse the menu into a drawer.

### 3.2 User Management Screen Design (`SCR_005_A_USER_MGMT.txt`)
```
[Admin Console] PRWM System                                              |  User Profile
========================================================================================
 MENU NAVIGATION         |  DASHBOARD WORKSPACE
 -----------------------+---------------------------------------------------------------
 (*) USER MANAGEMENT     |  USER ACCOUNT MANAGEMENT DASHBOARD
 ( ) MASTER DATA CONFIG  |  Manage application users, assign operational roles, and toggle access permissions.
 ( ) AUDIT LOGS          |
                         |  Search Filter: [Keyword] [Role] [Status] [[ Search ]]
                         |  Total Registered Users + [[ + Register New User ]]
                         |  USERS DATA GRID
                         |  [Emp No / Full Name / Email / Branch / Role / Status / Actions]
                         |  Page 1 of 3  < Previous  [1] 2 3  Next >
                         |  [MODAL POPUP: REGISTER NEW USER / EDIT DETAILS]
```

- **Layout Focus:** Search/filter row, summary/action row, paginated user grid, and modal form for register/edit.
- **Primary Interaction:** The active sidebar item stays on `USER MANAGEMENT` while the grid and modal handle user maintenance.

### 3.3 Master Data Configuration Screen Design (`SCR_005_B_MASTER_CONFIG.txt`)
```
[Admin Console] PRWM System                                              |  User Profile
========================================================================================
 MENU NAVIGATION         |  DASHBOARD WORKSPACE
 -----------------------+---------------------------------------------------------------
 ( ) USER MANAGEMENT     |  MASTER DATA CONFIGURATION
 (*) MASTER DATA CONFIG  |  Maintain global lookup values, payment rules, and currencies.
 ( ) AUDIT LOGS          |
                         |  [ Select Master Table Category ]
                         |  ( ) Branches  ( ) System Roles  (o) Payment Types  ( ) Methods  ( ) Currencies
                         |  PAYMENT TYPES CONFIGURATION
                         |  [Master Data Grid]
                         |  Total Records + [[ + Add New Entry ]]
                         |  [MODAL POPUP: ADD / EDIT ENTRY]
```

- **Layout Focus:** Category selector, reference data grid, total-record summary, and modal entry editor.
- **Primary Interaction:** The selected master category changes the right workspace content without leaving the admin shell.

### 3.4 Audit Log History Screen Design (`SCR_005_C_AUDIT_LOGS.txt`)
```
[Admin Console] PRWM System                                              |  User Profile
========================================================================================
 MENU NAVIGATION         |  DASHBOARD WORKSPACE
 -----------------------+---------------------------------------------------------------
 ( ) USER MANAGEMENT     |  AUDIT LOG HISTORY
 ( ) MASTER DATA CONFIG  |  Review the immutable tracking log of system events, state changes,
 (*) AUDIT LOGS          |  and authorization adjustments.
                         |  Search Filters: [Start Date] [End Date] [Target Actor] [[ Fetch ]]
                         |  AUDIT TRANSACTIONS GRID
                         |  Page 1 of 12 ... Next >
                         |  [ Selected Item Metadata Detail Panel ]
```

- **Layout Focus:** Date-range search area, actor filter, transaction grid, pagination, and docked metadata detail panel.
- **Primary Interaction:** The audit list remains read-only and the detail panel updates from the selected row.

### 3.5 Responsive Layout Breakpoints (レスポンシブ対応)

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | Single column, collapsible sidebar, stacked workspace blocks. |
| Tablet (`md:`) | 768px | Sidebar persists, sections stack vertically with collapsible panels. |
| Desktop (`lg:`) | 1024px | Fixed sidebar, full-width workspace content, and consistent split-shell presentation. |

---

## 4. Item Definitions (画面項目定義)

### 4.1 Section [A]: Persistent Navigation & Module Selection

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `nav_user_mgmt` | User Management | Sidebar Link | — | Y | Selected by default | — | N/A | Switches to User Management workspace |
| 2 | `nav_master_data` | Master Data Config | Sidebar Link | — | Y | — | — | N/A | Switches to Master Data Configuration workspace |
| 3 | `nav_audit_logs` | Audit Logs | Sidebar Link | — | Y | — | — | N/A | Switches to Audit Log History workspace |

### 4.2 Section [B]: User Management Workspace (`USER MGMT`)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 4 | `search_keyword` | Search Keyword | Text Input | String(200) | N | Empty | Partial match search | `users.name`, `users.employee_number` | Searches names or employee codes |
| 5 | `filter_role` | Role | Dropdown | Enum | N | `All Roles` | Select from role master | `roles` | Populated from system roles master data |
| 6 | `filter_status` | Status | Dropdown | Enum | N | `All` | `All`, `Active`, `Inactive` | `users.status` | Filters active/inactive users |
| 7 | `user_grid` | Users Data Grid | Table Grid | — | N | Empty | Paginated | `users` | Displays up to 20 rows per page |
| 8 | `grid_is_active` | Status Toggle | Toggle Switch | Boolean | Y | Based on DB state | Read-only when current session user row selected | `users.is_active` | Prevents admin self-lockout |
| 9 | `btn_open_user_modal` | Add/Edit User | Button | — | Y | Enabled | — | N/A | Opens registration/edit modal |

#### 4.2.1 User Registration & Modification Form (Modal Popup)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 10 | `employee_number` | Employee Number | Text Input | String(20) | Y | Empty | Unique, max 20 chars | `users.employee_number` | Globally unique identifier |
| 11 | `full_name` | Full Name | Text Input | String(200) | Y | Empty | Max 200 chars | `users.full_name` | Required field |
| 12 | `email` | Email Address | Email Input | String(255) | Y | Empty | RFC-compliant email | `users.email` | Must be unique |
| 13 | `password` | Password | Password Input | String(128) | Y for new / N for edit | Empty | Min 8 chars, alphanumeric | `users.password_hash` | Optional on edit, required on create |
| 14 | `branch` | Branch Office | Dropdown | Enum | Y | Empty | Lookup from branch master | `branches.id` | Branch options from master data |
| 15 | `role_id` | System Role | Dropdown | Enum | Y | Empty | Lookup from roles master | `roles.id` | Selects RBAC role |
| 16 | `modal_is_active` | Account Status | Radio Group | Boolean | Y | Enabled | `Enabled` / `Disabled` | `users.is_active` | Controls account activation state |
| 17 | `btn_submit_user_form` | Save User | Button | — | Y | Enabled when valid | — | N/A | Saves create/update action |

### 4.3 Section [C]: Master Data Configuration Workspace (`MASTERS`)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 18 | `master_category` | Select Master Table | Radio Group | Enum | Y | `Payment Types` | `Branches`, `System Roles`, `Payment Types`, `Methods`, `Currencies` | N/A | Switches active master data view |
| 19 | `master_grid` | Master Data Grid | Table Grid | — | N | Empty | Paginated | `master_tables` | Displays selected master data rows |
| 20 | `btn_open_master_modal` | Add/Edit Master | Button | — | Y | Enabled | — | N/A | Opens master data modal |

#### 4.3.1 Master Data Entry Configuration (Modal Popup)

| No. | Source Context Table | Field Physical Name | Item Name (Logical) | Required | Data Type / Boundary Rules | Remarks |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| 21 | All Master Tables | `is_active` | Status Flag | Y | Boolean (default `TRUE`) | Controls lookup availability |
| 22 | Payment Types | `payment_type_code` | Type Code | Y | String(30), uppercase, unique | e.g. `EXPENSE_REIMBURSE` |
| 23 | Payment Types | `payment_type_name` | Type Name | Y | String(100), unique | e.g. `Expense Reimbursement` |
| 24 | Payment Methods | `payment_method_code` | Method Code | Y | String(20), unique | e.g. `BANK_TRANSFER` |
| 25 | Payment Methods | `payment_method_name` | Method Name | Y | String(50), unique | e.g. `Bank Transfer` |
| 26 | Currencies | `currency_code` | Currency Code | Y | String(3), uppercase, unique | e.g. `MMK`, `USD` |
| 27 | Currencies | `currency_name` | Currency Name | Y | String(100), unique | e.g. `Myanmar Kyat` |
| 28 | Branches | `branch_name` | Branch Name | Y | String(100), unique | e.g. `Yangon` |
| 29 | System Roles | `role_code` | Role Code | Y | String(50), unique | e.g. `APPLICANT`, `ADMIN` |

### 4.4 Section [D]: Audit Log History Workspace (`AUDIT LOGS`)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 30 | `startDate` | Start Date | Date Picker | DATE | Y | 1st day of current month | `YYYY-MM-DD` | `audit_logs.timestamp` | Cannot exceed `endDate` |
| 31 | `endDate` | End Date | Date Picker | DATE | Y | Current date | `YYYY-MM-DD` | `audit_logs.timestamp` | Cannot be in future |
| 32 | `userId` | Target Actor | Dropdown | Enum | N | `All Users` | User lookup | `audit_logs.user_id` | Optional filter |
| 33 | `audit_grid` | Audit Transactions | Table Grid | — | N | Empty | Paginated, descending order | `audit_logs` | Read-only audit history |
| 34 | `audit_detail_panel` | Metadata Detail Panel | Read-only Panel | — | N | Hidden until row selected | — | `audit_logs` detail | Shows selected audit metadata |

---

## 5. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 5.1 User Search (`search_keyword` Text Input)
- **Trigger:** User enters search criteria and confirms by pressing Enter or clicking search.
- **Processing Logic:**
  1. Validate keyword length and sanitize input.
  2. Dispatch request to `/api/admin/users?keyword=<value>&role=<role>&status=<status>`.
  3. Render returned user list in `user_grid`.
  4. Show no-data state if no records are returned.
- **Exception Handling:** Display inline message when the search service returns an error.

### 5.2 Manage Master Table Selection (`master_category` Radio Group)
- **Trigger:** User clicks a master category radio button.
- **Processing Logic:**
  1. Switch the active view to the selected category.
  2. Fetch corresponding master rows from the backend.
  3. Populate `master_grid` with the selected data.
- **Exception Handling:** Show a toast or banner when master data retrieval fails.

### 5.3 Audit Log Row Selection (`audit_grid`)
- **Trigger:** User selects an audit row.
- **Processing Logic:**
  1. Load selected row details.
  2. Display metadata in `audit_detail_panel`.
  3. Keep the list scroll position stable.
- **Exception Handling:** Display a message panel if details cannot be loaded.

---

## 6. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

| Error Code | Target Field | Condition / Evaluation Logic | UI/UX Display Presentation Style | Default Error Message Text |
| :--- | :--- | :--- | :--- | :--- |
| VAL-ADM-001 | `employee_number` | Empty or duplicate | Inline error text | "Employee number is required and must be unique." |
| VAL-ADM-002 | `email` | Invalid or duplicate | Inline error text | "Please enter a valid email address." |
| VAL-ADM-003 | `password` | Too short or missing on create | Inline error text | "Password must be at least 8 characters." |
| ERR-ADM-401 | Full Viewport / API | JWT missing or invalid | Modal / toast | "Session expired. Please log in again." |
| ERR-ADM-403 | Full Viewport / API | Unauthorized access | Modal / page banner | "Access Denied. You do not have permission to view this resource." |
| ERR-ADM-409 | `user_grid` / `master_grid` | Optimistic lock conflict | Modal dialog | "This record has been modified by another user. Refresh and try again." |
| ERR-ADM-500 | Full Viewport / API | Unhandled backend exception | Modal / toast | "An unexpected error occurred. Please contact support." |

---

## 7. Special UI Notes & Styling Constraints (特記事項・UI仕様)

- **Responsive Design:** Desktop-first layout with stacked mobile panels for smaller viewport widths.
- **Accessibility:** Ensure keyboard focus order and screen reader labels for all form controls.
- **Loading States:** Use skeleton loaders and disabled button spinners during backend requests.
- **Security:** Sanitize all user input on both client and server sides to prevent XSS.
- **Design Tokens:** Follow the color palette, spacing, and typography rules defined in `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md`.
