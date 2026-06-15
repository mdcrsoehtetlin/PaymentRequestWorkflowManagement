# Screen Items Specification — Admin Panel

**Target Screen:** System Administrator Panel (Admin Panel)  
**Subsystem:** User Accounts, Masters, & Audit Lifecycle Management  
**Version:** 1.5  
**Created Date:** 2026-06-12  
**Updated Date:** 2026-06-15  
**Status:** Approved  
**Classification:** Internal — Engineering Division  

---

## 1. Screen Layout & Navigation Architecture
The Admin Panel utilizes a persistent split-dashboard layout wrapper to provide an efficient and consistent system administrative environment:
- **Left Panel (Persistent Navigation Menu):** A fixed sidebar layout containing the main module navigation context controls (`User Management`, `Master Data Config`, and `Audit Logs`).
- **Right Panel (Main Workspace):** A dynamic main workspace container that completely replaces its layout form variables, operational data grids, and search filters based on the active selection in the left panel.

---

## 2. Component & Field Definitions

### Module 1: User Management Workspace (`USER MGMT`)
Enables system administrators to search, display, register, and update application user access, assign structural roles, and toggle operational status.

#### 1.1 Search Filter & Data Grid Area
| Field Physical Name | UI Display Label | Component Type | Required | Default Value | Validation & Operational Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `search_keyword` | Search Keyword | Input Text | N | Blank | Performs partial string matching against user names or unique employee codes. |
| `filter_role` | Role | Dropdown | N | `"All Roles"` | Dynamically populated from the live roles master database table. |
| `filter_status` | Status | Dropdown | N | `"All"` | Contains static selectable parameters: `All`, `Active`, `Inactive`. |
| `user_grid` | Users Data Grid | Table Grid | N | N/A | Server-side paginated data array. Truncated to a maximum of **20 rows per page view**. |
| `grid_is_active` | Status Toggle | Toggle Switch | Y | DB State | **Security Guardrail:** The interface component is automatically **disabled** (read-only) for the row matching the active login session to prevent administrative self-lockout. |

#### 1.2 User Registration & Modification Form (Modal Popup)
| Field Physical Name | UI Display Label | Component Type | Required | Default Value | Validation & Operational Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `employee_number` | Employee Number | Input Text | Y | Blank | Must be globally unique. Enforces a maximum boundary of 20 characters. |
| `full_name` | Full Name | Input Text | Y | Blank | Enforces a maximum length of 200 characters. |
| `email` | Email Address | Input Email | Y | Blank | Must be unique. Validated against standard RFC domain format validations. |
| `password` | Password | Input Password | Y/N | Blank | **Mandatory** during new registration (min 8 characters, alphanumeric required). **Optional** during profile edits (retains existing hash signature if left blank). |
| `branch` | Branch Office | Dropdown | Y | Blank | Selectable lookup options driven by master records (e.g., `Yangon`, `Mandalay`, `Naypyidaw`). |
| `role_id` | System Role | Dropdown | Y | Blank | Selects permission tier matching RBAC rules (`ADMIN`, `MANAGER`, `APPROVER`, `ACCOUNTING`, `APPLICANT`). |
| `modal_is_active` | Account Status | Radio Group | Y | Enabled | Radio toggle options mapped to: `Enabled (Active)`, `Disabled (Inactive)`. |

---

### Module 2: Master Data Configuration Workspace (`MASTERS`)
Maintains core lookup parameters across 5 independent database tables. This section omits manual keyword search criteria, using an upper category selector bar to structuralize lists.

#### 2.1 Category Selection Bar & Table Grid
| Field Physical Name | UI Display Label | Component Type | Required | Default Value | Validation & Operational Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `master_category` | Select Master Table | Radio Group | Y | Payment Types | Switches active data views between: `Branches`, `System Roles`, `Payment Types`, `Methods`, `Currencies`. |
| `master_grid` | Master Data Grid | Table Grid | N | N/A | Displays reference properties. Since seed structures are naturally small (3–4 rows initially), items display cleanly in a unified standard view. |

#### 2.2 Entry Configuration Sub-Form (Modal Popup Window)
| Source Context Table | Field Physical Name | UI Display Label | Required | Data Type / Boundary Rules (DDL Aligned) |
| :--- | :--- | :--- | :---: | :--- |
| **All Master Tables**| `is_active` | Status Flag | Y | Toggle switch mechanism. Default: `TRUE`. Setting to `FALSE` removes option availability from user lookup menus. |
| **Payment Types** | `payment_type_code` | Type Code | Y | Max 30 characters. Enforces unique key constraints. Alphanumeric uppercase (e.g., `EXPENSE_REIMBURSE`, `SERVICE_PAYMENT`). |
| | `payment_type_name` | Type Name | Y | Max 100 characters. Unique name description (e.g., `Expense Reimbursement`, `Service Payment`). |
| **Payment Methods** | `payment_method_code`| Method Code | Y | Max 20 characters. Unique configuration tag (e.g., `BANK_TRANSFER`, `CASH`, `CHECK`). |
| | `payment_method_name`| Method Name | Y | Max 50 characters. Unique interface text representation (e.g., `Bank Transfer`, `Cash`). |
| **Currencies** | `currency_code` | Currency Code | Y | Max 3 characters. Unique. Alpha-only upper formatting string (e.g., `MMK`, `USD`, `JPY`, `THB`). |
| | `currency_name` | Currency Name | Y | Max 100 characters. Full descriptive asset classification (e.g., `Myanmar Kyat`, `US Dollar`). |
| **Branches** | `branch_name` | Branch Name | Y | Max 100 characters. Unique workplace location identity string (e.g., `Yangon`, `Mandalay`). |
| **System Roles** | `role_code` | Role Code | Y | Unique role code constraint utilized by RBAC verification filters (e.g., `APPLICANT`, `ADMIN`). |

---

### Module 3: Audit Log History Workspace (`AUDIT LOGS`)
Provides a read-only tracking stream recording user mutations, state modifications, and lifecycle updates.

#### 3.1 Timeframe Constraints & Chronological Grid
| Field Physical Name | UI Display Label | Component Type | Required | Default Value | Validation & Operational Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `startDate` | Start Date | Date Picker | Y | 1st day of current month | Format rule: `YYYY-MM-DD`. Boundary check prevents values greater than `endDate`. |
| `endDate` | End Date | Date Picker | Y | Current System Date | Format rule: `YYYY-MM-DD`. Boundary check limits choices up to today (no future values). |
| `userId` | Target Actor | Dropdown | N | `"All Users"` | Optional selection dropdown item parameters to target actions taken by a specific account ID. |
| `audit_grid` | Audit Transactions | Table Grid | N | N/A | **Strictly read-only**. Sorted in descending chronological sequence. Paginated to **20 records per view index**. |

#### 3.2 Metadata Detail Panel (Docked Footer Viewport)
Renders internal payload parameters immediately when a tracking row item is selected within the `audit_grid` without launching independent dialog blocks:
- `approval_log_id`: Primary execution database identity tracking key.
- `ip_address`: Renders connection network source IP (e.g., `192.168.4.112`).
- `user_agent`: Renders client configuration details (browser platform, version tags).
- `comment`: Renders multi-line string logs input by users during workflow operations.
