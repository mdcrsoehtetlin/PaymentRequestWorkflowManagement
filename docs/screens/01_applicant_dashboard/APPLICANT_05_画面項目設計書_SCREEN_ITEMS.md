# Screen Items Specification (画面項目設計書) — Applicant Dashboard

---

## 1. Document Control (ドキュメント管理)

| Attribute | Value |
| :--- | :--- |
| **Document ID** | PRWM-SIS-SCR-001 |
| **Screen ID** | SCR-APP-001 |
| **Screen Name (EN)** | Applicant Dashboard |
| **Screen Name (JP)** | 申請者ダッシュボード |
| **Subsystem** | Payment Request Lifecycle — Applicant Operations |
| **Function ID** | FN-001 |
| **Version** | 1.0 |
| **Created** | 2026-06-15 |
| **Last Updated** | 2026-06-15 |
| **Author** | Senior System Engineer |
| **Review Status** | Released (承認済み) |
| **Classification** | Internal — Engineering Division |

### Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-15 | Senior System Engineer | Initial release. Complete screen items specification for the Applicant Dashboard subsystem covering all UI elements, item definitions, action/event controls, validation rules, and error handling. Fully aligned with PRWM-REQ-001, PRWM-DBS-001, PRWM-DEV-001, and PRWM-FSD-SCR-001. |

### Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `03_データベース設計書_DATABASE_SPEC.md` | Table structures, constraints, and data types. |
| 3 | PRWM-DEV-001 | Development Rules | `02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |
| 4 | PRWM-FSD-SCR-001 | Functional Specification — Applicant Dashboard | `APPLICANT_04_機能設計書_FUNCTIONAL_SPEC.md` | Use cases, state transitions, validation rules, error handling. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose

The Applicant Dashboard is the primary operational portal for users assigned the `APPLICANT` role within the Payment Request Workflow Management System. It provides a comprehensive, real-time view of all payment requests originated by the authenticated applicant, and serves as the entry point for all payment request lifecycle operations — from initial drafting through final submission to the approval chain.

### 2.2 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `APPLICANT` role (`role_code = 'APPLICANT'`) |
| **Required Authentication** | JWT Bearer Token (RS256, validated per request) |
| **Data Scope** | Exclusively the authenticated user's own originated payment requests (`applicant_user_id = current_user.user_id`) |
| **Access Control** | `JwtAuthGuard` → `RolesGuard` → `OwnershipGuard` (sequential execution) |

### 2.3 Core Functions

1. **Payment Request List Management** — Consolidated, paginated, filterable list view of all non-deleted payment requests.
2. **Payment Request Drafting (Create / Edit)** — Form-based creation and modification of payment requests with up to 15 breakdown line items.
3. **Draft Lifecycle Management** — Save draft, edit, and soft-delete operations for DRAFT-status requests.
4. **Receipt File Attachment** — Upload, view, and soft-delete receipt files (PDF, PNG, JPG, JPEG).
5. **Manager Submission** — Strict validation and state transition from `DRAFT` → `SUBMITTED_MANAGER`.
6. **Final Approver Submission** — State transition from `MANAGER_VERIFIED` → `SUBMITTED_APPROVER`.
7. **Rejection Response & Resubmission** — View rejection comments; edit and resubmit corrected requests.
8. **Approval Timeline Visibility** — Chronological display of all approval actions and status transitions.
9. **Real-Time Notification** — WebSocket-driven toast notifications and automatic list refresh on status changes.

---

## 3. Screen Layout (画面レイアウト構成)

### 3.1 Overall Page Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                        │
├──────────┬──────────────────────────────────────────────────────────────────────────┤
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [A] PAGE HEADER                                                    │  │
│          │  │   Page Title: "Applicant Dashboard" (h1)                           │  │
│          │  │   User Info Badge   |   Notification Bell                          │  │
│  [NAV]   │  └────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│ Sidebar  │  ┌──────────┬──────────┬──────────┬──────────┐                          │
│ (w-64)   │  │[B] KPI   │[B] KPI   │[B] KPI   │[B] KPI   │  ← Summary Cards       │
│          │  │ Total    │ Pending  │ Approved │ Rejected │                          │
│ - Logo   │  │ Requests │ Review   │          │          │                          │
│ - Menu   │  └──────────┴──────────┴──────────┴──────────┘                          │
│ - User   │                                                                          │
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [C] FILTER / SEARCH BAR                                            │  │
│          │  │   [Search Input]  [Status Filter]  [Date Range]   [Create New Btn] │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [D] PAYMENT REQUEST DATA GRID                                      │  │
│          │  │ ┌──────────────────────────────────────────────────────────────┐   │  │
│          │  │ │ Request# │ App Date │ Amount │ Currency │ Status │ Created  │   │  │
│          │  │ ├──────────┼──────────┼────────┼──────────┼────────┼──────────┤   │  │
│          │  │ │ PRF-2026 │2026-06-10│ 50,000 │   MMK    │ Draft  │06-10 9:30│   │  │
│          │  │ │  -001    │          │        │          │[badge] │          │   │  │
│          │  │ ├──────────┼──────────┼────────┼──────────┼────────┼──────────┤   │  │
│          │  │ │ (more rows...)                                              │   │  │
│          │  │ └──────────────────────────────────────────────────────────────┘   │  │
│          │  │ [E] PAGINATION: [◄ Prev] Page 1 of 8 [Next ►] | Rows/page: [10] │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [F] DETAIL / FORM PANEL  (Shown on row click or "Create New")     │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F1] Applicant Info Section (Read-Only)                       │ │  │
│          │  │ │ Employee#: EMP-001  |  Name: Soe Htet Lin  |  Branch: Yangon │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F2] Payment Information Section                              │ │  │
│          │  │ │ App Date | Desired Pay Date | Currency | Pay Type | Pay Method│ │  │
│          │  │ │ Purpose | Bank Account Info | Total Amount (auto-calc)        │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F3] Request Content Section                                  │ │  │
│          │  │ │ Request Content (Textarea) | Has Receipt (Radio)              │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F4] Manager Selection Section                                │ │  │
│          │  │ │ Target Manager Dropdown                                       │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F5] Payment Breakdown Table (支払内訳)                        │ │  │
│          │  │ │ No | Date | Description | Amount |  [+ Add Row] [- Remove]   │ │  │
│          │  │ │ ─────────────────────────────── TOTAL: ¥ 50,000.00           │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F6] Receipt File Upload Section                              │ │  │
│          │  │ │ [Drag & Drop Zone]  |  Attached Files List                    │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F7] Approval History Timeline (Read-Only)                    │ │  │
│          │  │ │ [Date/Time] [User] [Action] [Comment]                        │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│          │  │ │ [F8] Action Button Bar                                        │ │  │
│          │  │ │ [Delete Draft]          [Cancel] [Save Draft] [Submit to Mgr] │ │  │
│          │  │ │                                  [Submit to Final Approver]    │ │  │
│          │  │ └────────────────────────────────────────────────────────────────┘ │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Layout Breakpoints

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | Single column, hidden sidebar (hamburger menu), stacked KPI cards, accordion form sections |
| Tablet (`md:`) | 768px | Single column stacked with collapsible panes, 2-column KPI grid |
| Desktop (`lg:`) | 1024px | Full layout, fixed sidebar `w-64`, 4-column KPI grid, dual-pane list + detail |
| Wide (`xl:`) | 1280px | Extended table columns, wider content area |

---

## 4. Item Definitions — Dashboard List View (画面項目定義 — ダッシュボード一覧)

### 4.1 Section [A]: Page Header (ページヘッダー)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `lblPageTitle` | Applicant Dashboard | Static Label (`<h1>`) | String | — | Visible; always displayed. Text: "Applicant Dashboard" | — | Hardcoded UI text | Single `<h1>` per page. Tailwind: `text-2xl font-bold text-slate-900`. |
| 2 | `lblUserName` | User Display Name | Static Label | String(200) | — | Populated from JWT payload | — | `users.full_name` (via JWT `sub` → `user_id`) | Displayed in top-right header area. |
| 3 | `lblUserRole` | User Role Badge | Static Label (Badge) | String(50) | — | Populated from JWT payload. Text: "Applicant" | — | `user_roles.role_name` (via JWT `role`) | Styled as subtle badge: `text-xs text-blue-300`. |
| 4 | `btnNotificationBell` | Notification Bell Icon | Icon Button | — | — | Visible. Badge counter shows unread count. | — | WebSocket `notification` event counter | Shows unread notification count. Clicking opens notification panel. |

### 4.2 Section [B]: KPI Summary Cards (サマリーカード)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 5 | `kpiTotalRequests` | Total Requests | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `is_deleted = FALSE` | Card label: "Total Requests". Icon: document icon, BG: `bg-blue-100`. |
| 6 | `kpiPendingReview` | Pending Review | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `status_id` IN (2, 3, 6, 7) AND `is_deleted = FALSE` | Card label: "Pending Review". Icon: clock icon, BG: `bg-amber-100`. Includes statuses: SUBMITTED_MANAGER, MANAGER_REVIEWING, SUBMITTED_APPROVER, APPROVER_REVIEWING. |
| 7 | `kpiApproved` | Approved | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `status_id` IN (8, 10) AND `is_deleted = FALSE` | Card label: "Approved". Icon: check icon, BG: `bg-emerald-100`. Includes APPROVED and PAID. |
| 8 | `kpiRejected` | Rejected | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `status_id` IN (5, 9) AND `is_deleted = FALSE` | Card label: "Rejected". Icon: x-circle icon, BG: `bg-red-100`. Includes REJECTED_MANAGER and REJECTED_APPROVER. |

### 4.3 Section [C]: Filter / Search Bar (フィルター・検索バー)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 9 | `txtSearchQuery` | Search | Text Input | String(50) | Optional | Empty. Placeholder: "Search by request number or amount..." | Alphanumeric, dash, period. 300ms debounce. | Queries `payment_requests.request_number` (LIKE match) or `payment_requests.total_amount` (range match) | REQ-033. Searches request number or amount. Tooltip: "Enter request number (e.g. PRF-2026-001) or amount". |
| 10 | `ddlStatusFilter` | Status Filter | Dropdown (Select) | Integer (FK) | Optional | Default: "All Statuses" (value: `null`) | Must be a valid `status_id` from lookup or null | `payment_statuses.status_id` / `payment_statuses.status_name` | REQ-034. Options dynamically loaded from `payment_statuses` master table (cached in Redis `lookup:payment_statuses`). |
| 11 | `dtpDateRangeFrom` | Date From | Date Picker | DATE | Optional | Empty | Format: `YYYY-MM-DD`. Must be valid calendar date. | Filters `payment_requests.created_date >= :dateFrom` | REQ-034. Start of date range filter. |
| 12 | `dtpDateRangeTo` | Date To | Date Picker | DATE | Optional | Empty | Format: `YYYY-MM-DD`. Must be >= `dtpDateRangeFrom` if set. | Filters `payment_requests.created_date <= :dateTo` | REQ-034. End of date range filter. |
| 13 | `btnCreateNewRequest` | Create New Request | Button (Primary) | — | — | Visible. Enabled. | — | — | Navigates to Create Form View (Section F). Tailwind: Primary button variant per Dev Rules §9.5.4. Text: "+ Create New Request". |

### 4.4 Section [D]: Payment Request Data Grid (支払申請一覧グリッド)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 14 | `colRequestNumber` | Request Number (申請番号) | Data Grid Column (Link) | String(50) | — | Populated from API response | Display as-is. Regex: `^PRF-[0-9]{4}-[0-9]{3,6}$` | `payment_requests.request_number` | COL-01. Sortable: Yes. Filterable: Yes. Clickable — navigates to Detail/Edit view. `whitespace-nowrap`. |
| 15 | `colApplicationDate` | Application Date (申請日) | Data Grid Column | DATE | — | Populated from API response | Display format: `YYYY-MM-DD` | `payment_requests.application_date` | COL-02. Sortable: Yes. Filterable: No. `whitespace-nowrap`. |
| 16 | `colTotalAmount` | Total Amount (合計金額) | Data Grid Column | NUMERIC(12,2) | — | Populated from API response | Display format: Decimal with thousand separators and 2 decimal places (e.g., "50,000.00"). Right-aligned (`text-right`). | `payment_requests.total_amount` | COL-03. Sortable: Yes. Filterable: Yes (range). Displayed with currency code suffix. TypeORM maps NUMERIC to JS `string` to avoid float precision issues (DB Spec §6, item 1). |
| 17 | `colCurrency` | Currency (通貨) | Data Grid Column | String(3) | — | Populated from API response | Display as ISO currency code | `currencies.currency_code` (via `payment_requests.currency_id` → `currencies.currency_id`) | COL-04. Sortable: Yes. Filterable: No. |
| 18 | `colStatus` | Status (ステータス) | Data Grid Column (Badge) | String(50) | — | Populated from API response | Rendered as colored badge per Dev Rules §9.2.2 status color mapping | `payment_statuses.status_name` (via `payment_requests.status_id` → `payment_statuses.status_id`) | COL-05. Sortable: Yes. Filterable: Yes. Badge: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border`. Color classes mapped per status category (DRAFT → gray, In Progress → amber, Verified → sky, Approved → emerald, Rejected → red, Paid → emerald bold). |
| 19 | `colCreatedDate` | Created Date (作成日) | Data Grid Column | TIMESTAMPTZ | — | Populated from API response | Display format: `YYYY-MM-DD HH:mm` (UTC → local timezone conversion in client) | `payment_requests.created_date` | COL-06. Sortable: Yes. Filterable: No. `whitespace-nowrap`. Timezone conversion handled in presentation layer per DB Spec §1.3. |

**Data Grid Behavior:**

| Attribute | Specification |
| :--- | :--- |
| **API Endpoint** | `GET /api/v1/applicant/payment-requests` |
| **Default Filter** | `applicant_user_id = current_user.user_id` AND `is_deleted = FALSE` |
| **Default Sort** | Primary: `payment_statuses.display_order` ASC, Secondary: `payment_requests.created_date` DESC |
| **Pagination** | Server-side, default 10 records per page |
| **Row Click Action** | Navigate to Edit Form View (if `status_id` ∈ {1, 5, 9}) or Read-Only Detail View (all other statuses) |
| **Row Hover** | `hover:bg-slate-50 transition-colors duration-150 cursor-pointer` |
| **Empty State** | Display centered empty state component: "No requests found. Create your first payment request to get started." |

### 4.5 Section [E]: Pagination Controls (ページネーション)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 20 | `btnPrevPage` | Previous Page | Button (Secondary) | — | — | Disabled if `page = 1` | — | API query param `?page={n-1}` | Navigates to previous page. Disabled state: `opacity-50 cursor-not-allowed`. |
| 21 | `lblPageInfo` | Page Indicator | Static Label | String | — | Format: "Page {page} of {totalPages}" | — | API response `meta.page` / `meta.totalPages` | Read-only display of current pagination state. |
| 22 | `btnNextPage` | Next Page | Button (Secondary) | — | — | Disabled if `page = totalPages` | — | API query param `?page={n+1}` | Navigates to next page. |
| 23 | `ddlPageSize` | Rows Per Page | Dropdown (Select) | Integer | Optional | Default: `10` | Options: 10, 20, 50 | API query param `?pageSize={value}` | REQ-035. Controls pagination size. Resets to page 1 on change. |

---

## 5. Item Definitions — Payment Request Form / Detail View (画面項目定義 — 申請フォーム / 詳細表示)

### 5.1 Section [F1]: Applicant Information (申請者情報 — Read-Only)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 24 | `lblEmployeeNumber` | Employee Number (社員番号) | Static Label | String(20) | — | Auto-populated from authenticated user profile | — | `users.employee_number` (via JWT `sub` → `user_id`) | REQ-002A. Read-only. Always displayed. Cannot be modified by applicant. |
| 25 | `lblFullName` | Employee Name (氏名) | Static Label | String(200) | — | Auto-populated from authenticated user profile | — | `users.full_name` (via JWT `sub` → `user_id`) | REQ-002A. Read-only. Always displayed. |
| 26 | `lblBranch` | Branch (支店) | Static Label | String(100) | — | Auto-populated from authenticated user profile | — | `users.branch` (via JWT `sub` → `user_id`) | Read-only. Displayed for reference. Also used downstream for Mandalay branch alert logic (Rule 4.3.1). |
| 27 | `lblDepartment` | Department (部署) | Static Label | String(100) | — | Auto-populated from authenticated user profile. May be NULL. | — | `users.department` (via JWT `sub` → `user_id`) | Read-only. Display "—" if NULL. |

### 5.2 Section [F2]: Payment Information (支払情報)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 28 | `dtpApplicationDate` | Application Date (申請日) | Date Picker | DATE | Mandatory | Default: Current date (`TODAY()`) | Format: `YYYY-MM-DD`. Must be today or earlier (`<= TODAY()`). REQ-036. | `payment_requests.application_date` | Editable in states {1, 5, 9}. Read-only otherwise. Label: `text-sm font-medium text-slate-700 mb-1`. Required indicator: red asterisk `*`. |
| 29 | `dtpDesiredPaymentDate` | Desired Payment Date (支払希望日) | Date Picker | DATE | Mandatory | Empty | Format: `YYYY-MM-DD`. Must be today or later (`>= TODAY()`). REQ-037. | `payment_requests.desired_payment_date` | Editable in states {1, 5, 9}. Read-only otherwise. |
| 30 | `lblTotalAmount` | Total Payment Amount (支払金額) | Static Label (Computed) | NUMERIC(12,2) | Mandatory | Auto-calculated: `0.00` | Display format: Decimal with thousand separators (e.g., "1,234,567.89"). Always > 0 at submission. REQ-038. | `payment_requests.total_amount` | **Read-only, auto-computed.** Value is the SUM of all `payment_breakdown_items.amount` for this request. Manual override is FORBIDDEN (BR-APP-014). Displayed with currency code. TypeORM: mapped as JS `string` to avoid float precision loss (DB Spec §6). DB constraint: `chk_payment_requests_total_amount CHECK (total_amount > 0)`. |
| 31 | `ddlCurrency` | Currency Type (通貨選択) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select --" (value: `null`) | Must select a valid active currency from lookup. REQ-041. | `payment_requests.currency_id` → `currencies.currency_id`. Display: `currencies.currency_code` | Options populated from `currencies` master table WHERE `is_active = TRUE`. Cached in Redis: `lookup:currencies` (24h TTL). Editable in states {1, 5, 9}. Seeded values: MMK, USD, JPY, THB. REQ-043. |
| 32 | `ddlPaymentType` | Payment Type (支払タイプ) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select --" (value: `null`) | Must select a valid active payment type from lookup. REQ-041. | `payment_requests.payment_type_id` → `payment_types.payment_type_id`. Display: `payment_types.payment_type_name` | Options populated from `payment_types` master table WHERE `is_active = TRUE`. Cached in Redis: `lookup:payment_types`. Editable in states {1, 5, 9}. Seeded values: Expense Reimbursement, Service Payment, Advance Payment, Other. |
| 33 | `ddlPaymentMethod` | Payment Method (支払方法) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select --" (value: `null`) | Must select a valid active payment method from lookup. REQ-041. | `payment_requests.payment_method_id` → `payment_methods.payment_method_id`. Display: `payment_methods.payment_method_name` | Options populated from `payment_methods` master table WHERE `is_active = TRUE`. Cached in Redis: `lookup:payment_methods`. Editable in states {1, 5, 9}. Seeded values: Bank Transfer, Cash, Check. **On change event**: Toggles visibility/required state of `txtBankAccountInfo` (Item 35). |
| 34 | `txtPurpose` | Purpose / Usage (用途) | Text Input | String(500) / VARCHAR(500) | Mandatory | Empty | Max length: 500 characters. Trimmed whitespace on submit (`@Transform`). | `payment_requests.purpose` | REQ-002A. Editable in states {1, 5, 9}. Placeholder: "Enter the purpose of this payment...". |
| 35 | `txtBankAccountInfo` | Bank Account / Phone (銀行口座・口座名/電話番号) | Text Input | String(200) / VARCHAR(200) | Conditional | Empty. Initially hidden if payment method is "Check". | Max length: 200 characters. Trimmed whitespace on submit. | `payment_requests.bank_account_info` | **Conditional Required**: Mandatory when `ddlPaymentMethod` resolves to "Bank Transfer" (`BANK_TRANSFER`) or "Cash" (`CASH`). Hidden or optional when "Check" (`CHECK`). REQ-042, REQ-002A. Editable in states {1, 5, 9}. Placeholder: "Enter bank account number, account holder name, or phone number". |

### 5.3 Section [F3]: Request Content (申請内容)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 36 | `txaRequestContent` | Payment Request Content (支払申請内容) | Textarea | TEXT (max 1000 chars) | Mandatory | Empty | Max length: 1000 characters. Trimmed whitespace on submit. Character counter displayed below field. | `payment_requests.request_content` | REQ-002A. Editable in states {1, 5, 9}. Read-only otherwise. Rows: 4. Placeholder: "Describe the details of this payment request...". |
| 37 | `rdoHasReceipt` | Receipt Present (領収書の有無) | Radio Button Group | BOOLEAN | Mandatory | Default: `TRUE` (Yes) | Options: "Yes" (`true`), "No" (`false`). | `payment_requests.has_receipt` | REQ-002A. Editable in states {1, 5, 9}. When `TRUE`, receipt file upload section is enabled and at least one file must be attached before submission (BR-APP-009, REQ-045). DB default: `TRUE`. |

### 5.4 Section [F4]: Manager Selection (マネージャー選択)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 38 | `ddlTargetManager` | Target Manager (承認担当者) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select Manager --" (value: `null`). Pre-populated with previously selected manager if editing a rejected request. | Must select an active user with MANAGER role. | `payment_requests.manager_user_id` → `users.user_id`. Display: `users.full_name` | REQ-002A, BR-APP-017. Options dynamically loaded: `SELECT user_id, full_name FROM users WHERE role_id = (SELECT role_id FROM user_roles WHERE role_code = 'MANAGER') AND is_active = TRUE`. Editable in states {1, 5, 9}. Read-only otherwise. Upon submission, also sets `payment_requests.current_assigned_to_user_id` (BR-APP-018). |

### 5.5 Section [F5]: Payment Breakdown Table (支払内訳テーブル)

#### 5.5.1 Breakdown Table Grid

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 39 | `grdBreakdownItems` | Payment Breakdown Table (支払内訳) | Editable Data Grid | — | Mandatory (min 1 row) | Initialized with 1 empty row | Min rows: 1, Max rows: 15. REQ-039. | `payment_breakdown_items` table | Editable in states {1, 5, 9}. Read-only otherwise (BR-APP-005). Each row maps to a `payment_breakdown_items` record linked by `payment_request_id`. |

#### 5.5.2 Breakdown Table Columns (Per Row)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 40 | `colLineNumber` | No (行番号) | Static Label (Auto-numbered) | Integer (1-15) | — | Auto-incremented starting from 1 | Range: 1–15. Auto-assigned sequentially. | `payment_breakdown_items.line_number` | REQ-002B. Read-only. Auto-numbered. DB constraint: `chk_payment_breakdown_items_line_range CHECK (line_number >= 1 AND line_number <= 15)`. Compound unique: `(payment_request_id, line_number)`. |
| 41 | `colItemDate` | Date (日付) | Date Picker (Inline) | DATE | Mandatory | Empty | Format: `YYYY-MM-DD`. Must be a valid calendar date. REQ-040. | `payment_breakdown_items.item_date` | Editable in states {1, 5, 9}. Each breakdown line item date. |
| 42 | `colDescription` | Description (内容) | Text Input (Inline) | String(200) / VARCHAR(200) | Mandatory | Empty | Max length: 200 characters. REQ-040. | `payment_breakdown_items.description` | Editable in states {1, 5, 9}. Used for receipt file naming convention guidance (Rule 4.2.3). Placeholder: "Expense description". |
| 43 | `colAmount` | Amount (金額) | Number Input (Inline) | NUMERIC(10,2) | Mandatory | Empty (`0.00`) | Decimal, max 2 decimal places. Must be > 0. Max value: 9,999,999,999.99. REQ-040, REQ-044. | `payment_breakdown_items.amount` | Editable in states {1, 5, 9}. Right-aligned (`text-right`). DB constraint: `chk_payment_breakdown_items_amount CHECK (amount > 0)`. On change: triggers total amount recalculation (BR-APP-014). |
| 44 | `colQuantity` | Quantity (数量) | Number Input (Inline) | NUMERIC(10,2) | Optional | Default: `1.00` | Decimal, max 2 decimal places. | `payment_breakdown_items.quantity` | Editable in states {1, 5, 9}. Optional field. DB default: `1.00`. |
| 45 | `colUnitPrice` | Unit Price (単価) | Number Input (Inline) | NUMERIC(10,2) | Optional | Empty (NULL) | Decimal, max 2 decimal places. | `payment_breakdown_items.unit_price` | Editable in states {1, 5, 9}. Optional field. |

#### 5.5.3 Breakdown Table Controls

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 46 | `btnAddBreakdownRow` | Add Row (行追加) | Button (Secondary) | — | — | Enabled if row count < 15 | Disabled when row count reaches 15. | — | Adds a new empty breakdown row. Hidden in read-only states. |
| 47 | `btnRemoveBreakdownRow` | Remove Row (行削除) | Icon Button (Danger) | — | — | Enabled if row count > 1 | Disabled when only 1 row remains (minimum). | — | Removes the specified breakdown row. Recalculates total. Hidden in read-only states. Displays per-row as a trash icon. |
| 48 | `lblBreakdownTotal` | Total (合計) | Static Label (Computed) | NUMERIC(12,2) | — | `0.00` | Auto-calculated: SUM of all `colAmount` values. Display: Decimal with thousand separators. | Derived → written to `payment_requests.total_amount` | REQ-002B. Read-only. Updates in real-time as amounts change. Rule 4.2.1: must equal `payment_requests.total_amount`. |

### 5.6 Section [F6]: Receipt File Upload (領収書アップロード)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 49 | `uplReceiptDropzone` | Receipt File Upload Zone | Drag & Drop / File Picker | File (Binary) | Conditional | Visible when `rdoHasReceipt = TRUE`. Drop zone state: "Drop receipt files here or click to browse". | Accepted MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`. Max size per file: 10MB (10,485,760 bytes). Max total per request: 50MB (52,428,800 bytes). REQ-029, BR-APP-010, BR-APP-011. | Upload API: `POST /api/v1/applicant/payment-requests/:id/receipts` (multipart/form-data). Stored to `receipt_files` table. Physical file: `/uploads/{payment_request_id}/{UUID}_{stored_file_name}`. | Editable in states {1, 5, 9}. Disabled/hidden in read-only states. Border: `border-2 border-dashed border-slate-300 rounded-xl`. Hover: `hover:border-indigo-400 hover:bg-indigo-50/50`. Helper text: "PDF, JPEG, PNG — Max 10MB per file, 50MB total". |
| 50 | `lstReceiptFiles` | Attached Receipt Files List | List / Table | — | — | Empty list or populated with existing files | — | `receipt_files` WHERE `payment_request_id = :id` AND `is_deleted = FALSE` | Displays each file as a row: original filename, file size (formatted), upload date, download link. Each row has a delete icon button (Item 51) if in editable state. |
| 51 | `btnDeleteReceiptFile` | Delete Receipt File | Icon Button (Danger) | — | — | Visible only in editable states {1, 5, 9} | — | Sets `receipt_files.is_deleted = TRUE` for the target file | UC-APP-006. Soft-delete only (BR-APP-013). File retained on disk for auditing. Requires confirmation tooltip. |

#### Receipt File Data Row Columns

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 52 | `lblReceiptFileName` | File Name | Static Label (Link) | String(255) | — | Populated from DB | — | `receipt_files.original_file_name` | Clickable link to download/preview the file. Authorized access only (REQ-032). |
| 53 | `lblReceiptFileSize` | File Size | Static Label | String | — | Computed from byte value | Display format: "1.2 MB", "345 KB" | `receipt_files.file_size` (BIGINT, in bytes) | DB constraint: `chk_receipt_files_file_size CHECK (file_size > 0 AND file_size <= 10485760)`. |
| 54 | `lblReceiptMimeType` | File Type | Static Label | String(100) | — | Populated from DB | — | `receipt_files.mime_type` | Display as badge or icon (PDF icon, image icon). |
| 55 | `lblReceiptUploadDate` | Upload Date | Static Label | TIMESTAMPTZ | — | Populated from DB | Display format: `YYYY-MM-DD HH:mm` (UTC → local conversion) | `receipt_files.uploaded_date` | Client-side timezone conversion per DB Spec §1.3. |

### 5.7 Section [F7]: Approval History Timeline (承認履歴タイムライン)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 56 | `tlnApprovalHistory` | Approval History Timeline | Timeline Component (Read-Only) | — | — | Empty for new drafts. Populated for existing requests. | — | `approval_logs` WHERE `payment_request_id = :id` ORDER BY `timestamp` DESC | REQ-024, REQ-028, UC-APP-009. Read-only for applicant. Displays chronological list of all approval actions. Compound index: `idx_approval_logs_request_timestamp`. |

#### Approval History Timeline Columns

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 57 | `lblLogTimestamp` | Date/Time (日時) | Static Label | TIMESTAMPTZ | — | Populated from DB | Display format: `YYYY-MM-DD HH:mm:ss` (UTC → local timezone conversion) | `approval_logs.timestamp` | BR-APP-022. UTC storage, client-side local conversion. |
| 58 | `lblLogUser` | User (担当者) | Static Label | String(200) | — | Populated from DB via JOIN | — | `approval_logs.action_taken_by_user_id` → `users.full_name` (JOIN) | Displays full name of the actor who performed the action. |
| 59 | `lblLogAction` | Action (アクション) | Static Label (Badge) | String(50) | — | Populated from DB via JOIN | — | `approval_logs.action_type_id` → `approval_action_types.action_type` (JOIN) | Displayed as styled badge. Action types: Created, Edited, Submitted, Manager Review Started, Manager Verified, Manager Rejected, Approver Review Started, Approved, Approver Rejected, Payment Completed. |
| 60 | `lblLogComment` | Comment (コメント) | Static Label | TEXT | — | Populated from DB. Display "—" if NULL. | — | `approval_logs.comment` | Particularly important for rejection actions. Rejection comments are mandatory (>= 10 chars) per Rule 4.1.3. Highlighted with a distinct background for reject actions. |

### 5.8 Section [F8]: Action Button Bar (アクションボタンバー)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 61 | `btnDeleteDraft` | Delete Draft | Button (Danger) | — | — | **Visible only** when `status_id = 1` (DRAFT). Hidden for all other statuses. | — | Sets `payment_requests.is_deleted = TRUE` via `DELETE /api/v1/applicant/payment-requests/:id` | UC-APP-004, BR-APP-006. Left-aligned in button bar. Triggers confirmation modal (BR-APP-008). Tailwind: Danger button variant per Dev Rules §9.5.4. Soft delete only — no physical deletion (BR-APP-007). |
| 62 | `btnCancel` | Cancel | Button (Secondary) | — | — | Visible in form view. Always enabled. | — | — | Navigates back to List View without saving changes. Left of primary action buttons. Tailwind: Secondary button variant per Dev Rules §9.5.4. |
| 63 | `btnSaveDraft` | Save Draft | Button (Primary) | — | — | **Visible and enabled** when `status_id` ∈ {1, 5, 9} (editable states). Hidden in read-only states. | — | `POST /api/v1/applicant/payment-requests` (create) or `PATCH /api/v1/applicant/payment-requests/:id` (update) | UC-APP-002 / UC-APP-003. Saves current form state with relaxed validation (Func Spec §8.1). On success: displays toast "Draft saved successfully." Right-aligned in button bar, left of Submit button. |
| 64 | `btnSubmitToManager` | Submit to Manager | Button (Primary) | — | — | **Visible and enabled** when `status_id` ∈ {1, 5, 9} (editable states). Hidden in non-editable states. | All mandatory fields must pass strict validation (Func Spec §8.2). Receipt file must be attached if `has_receipt = TRUE`. | `POST /api/v1/applicant/payment-requests/:id/submit-manager` | UC-APP-007, TR-APP-01/02/03. Right-most in button bar. Triggers strict mode validation. On success: status transitions to `SUBMITTED_MANAGER` (2). WebSocket dispatched to Manager. Toast: "Request submitted to Manager successfully." |
| 65 | `btnSubmitToApprover` | Submit to Final Approver | Button (Primary) | — | — | **Visible and enabled** ONLY when `status_id = 4` (MANAGER_VERIFIED). Hidden for all other statuses. | Status must be exactly 4. No additional field validation required. | `POST /api/v1/applicant/payment-requests/:id/submit-approver` | UC-APP-008, TR-APP-04, REQ-006. Special action button. Appears exclusively when Manager has verified the request. On success: status transitions to `SUBMITTED_APPROVER` (6). WebSocket dispatched to Approver room. Toast: "Request submitted to Final Approver successfully." Rule 4.1.1: Manager is verifier, not submitter — applicant must explicitly initiate this step. |

### 5.9 Confirmation Modal: Delete Draft (削除確認モーダル)

| No. | Item ID | Item Name | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Tooltips |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 66 | `mdlDeleteConfirm` | Delete Draft Confirmation Modal | Modal Dialog | — | — | Hidden. Triggered by `btnDeleteDraft` click. | — | — | BR-APP-008. Floating modal per Dev Rules §9.5.5. Backdrop: `bg-black/50 backdrop-blur-sm`. Entry animation: `animate-in fade-in zoom-in-95`. Max-width: `max-w-md`. |
| 67 | `lblDeleteModalTitle` | Modal Title | Static Label (`<h3>`) | String | — | Text: "Delete Draft Request" | — | — | `text-lg font-semibold text-slate-900 mb-2`. |
| 68 | `lblDeleteModalDesc` | Modal Description | Static Label (`<p>`) | String | — | Text: "Are you sure you want to delete this draft payment request? This action cannot be undone." | — | — | `text-sm text-slate-500 mb-4`. |
| 69 | `btnDeleteModalCancel` | Cancel | Button (Secondary) | — | — | Enabled | — | — | Closes modal without action. |
| 70 | `btnDeleteModalConfirm` | Delete | Button (Danger) | — | — | Enabled | — | Calls `DELETE /api/v1/applicant/payment-requests/:id` | Executes soft deletion. On success: toast "Draft deleted successfully." Navigates back to list view. Refreshes data grid. |

---

## 6. Action & Event Controls (アクション・イベント定義)

### 6.1 Button Actions

| No. | UI Element (Item ID) | Event | Action Description | API / Function Called | Guard Conditions | Success Behavior | Functional Spec Reference |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ACT-01 | `btnCreateNewRequest` (Item 13) | `onClick` | Navigates to an empty payment request form in Create mode. | No API call (client-side navigation). | User authenticated with `APPLICANT` role. | Form opens with default values. Employee info auto-populated. 1 empty breakdown row initialized. | UC-APP-002, Sec 6.2 |
| ACT-02 | Data Grid Row Click (Items 14–19) | `onClick` | Opens the selected payment request in either Edit mode (editable states) or Read-Only Detail mode. | `GET /api/v1/applicant/payment-requests/:id` | Ownership: `applicant_user_id = current_user.user_id`. | Form/detail view populated with fetched data. Mode determined by `status_id` ∈ {1,5,9} → Edit, else → Read-only. | UC-APP-003 / UC-APP-009, Sec 6.3 |
| ACT-03 | `btnSaveDraft` (Item 63) | `onClick` | Saves the current form state as a draft. Performs relaxed validation. | **Create:** `POST /api/v1/applicant/payment-requests` (returns 201). **Update:** `PATCH /api/v1/applicant/payment-requests/:id` (returns 200). | Status ∈ {1, 5, 9}. Ownership validated. | Toast: "Draft saved successfully." Request number generated (for new). `approval_logs` entry: `CREATED` or `EDITED`. Form remains open. | UC-APP-002 / UC-APP-003, Sec 6.2 / 6.3 |
| ACT-04 | `btnSubmitToManager` (Item 64) | `onClick` | Validates all mandatory fields (strict mode). Transitions status to `SUBMITTED_MANAGER`. | `POST /api/v1/applicant/payment-requests/:id/submit-manager` (returns 200). | Status ∈ {1, 5, 9}. All strict validations pass (Sec 8.2). `manager_user_id` selected. Receipt attached if `has_receipt = TRUE`. | Toast: "Request submitted to Manager successfully." List view refreshed. WebSocket `statusUpdate` dispatched to `user:{manager_id}` and `MANAGER` room. `approval_logs` entry: `SUBMITTED`. | UC-APP-007, Sec 6.6, TR-APP-01/02/03 |
| ACT-05 | `btnSubmitToApprover` (Item 65) | `onClick` | Transitions status from `MANAGER_VERIFIED` to `SUBMITTED_APPROVER`. | `POST /api/v1/applicant/payment-requests/:id/submit-approver` (returns 200). | Status must be exactly 4 (`MANAGER_VERIFIED`). Ownership validated. | Toast: "Request submitted to Final Approver successfully." WebSocket `statusUpdate` dispatched to `APPROVER` room. `approval_logs` entry: `SUBMITTED`. | UC-APP-008, Sec 6.7, TR-APP-04 |
| ACT-06 | `btnDeleteDraft` (Item 61) | `onClick` | Opens delete confirmation modal (`mdlDeleteConfirm`). | No API call (modal display). | Status must be exactly 1 (`DRAFT`). | Modal displayed with backdrop blur. | UC-APP-004, Sec 6.4, BR-APP-008 |
| ACT-07 | `btnDeleteModalConfirm` (Item 70) | `onClick` | Executes soft deletion of the draft request. | `DELETE /api/v1/applicant/payment-requests/:id` (returns 200). | Status = 1 (`DRAFT`). Ownership validated (backend `OwnershipGuard`). | Toast: "Draft deleted successfully." Navigate to list view. List refreshed. `is_deleted` set to `TRUE`. | UC-APP-004, Sec 6.4, BR-APP-006/007 |
| ACT-08 | `btnCancel` (Item 62) | `onClick` | Discards unsaved changes and navigates back to list view. | No API call (client-side navigation). | None. | Navigate to list view. Unsaved changes discarded. | — |

### 6.2 Dropdown Change Events

| No. | UI Element (Item ID) | Event | Action Description | Functional Spec Reference |
| :---: | :--- | :--- | :--- | :--- |
| EVT-01 | `ddlPaymentMethod` (Item 33) | `onChange` | When the selected payment method changes: (1) If method resolves to `BANK_TRANSFER` or `CASH`, set `txtBankAccountInfo` (Item 35) to **visible and mandatory**. (2) If method resolves to `CHECK`, set `txtBankAccountInfo` to **hidden and optional**. Clear any existing value and validation error. | REQ-042, Func Spec §7.1 |
| EVT-02 | `ddlStatusFilter` (Item 10) | `onChange` | Refreshes the data grid with the selected status filter applied. Resets pagination to page 1. Calls `GET /api/v1/applicant/payment-requests?statusId={value}&page=1&pageSize={current}`. | REQ-034, Func Spec §6.1 |
| EVT-03 | `ddlPageSize` (Item 23) | `onChange` | Refreshes the data grid with the selected page size. Resets pagination to page 1. | REQ-035, Func Spec §6.1 |

### 6.3 Input Events

| No. | UI Element (Item ID) | Event | Action Description | Functional Spec Reference |
| :---: | :--- | :--- | :--- | :--- |
| EVT-04 | `txtSearchQuery` (Item 9) | `onInput` (debounced 300ms) | Triggers search/filter refresh on the data grid after 300ms debounce. Searches by `request_number` (LIKE) or `total_amount` (exact/range). Resets pagination to page 1. | REQ-033, Dev Rules §10.3 |
| EVT-05 | `colAmount` (Item 43) | `onChange` | Recalculates the breakdown total (`lblBreakdownTotal`, Item 48) and updates `lblTotalAmount` (Item 30) in real-time. SUM of all `colAmount` values across breakdown rows. | BR-APP-014, Rule 4.2.1 |
| EVT-06 | `rdoHasReceipt` (Item 37) | `onChange` | When set to `TRUE`: Receipt upload section (`uplReceiptDropzone`, Item 49) becomes visible and active. When set to `FALSE`: Receipt upload section is hidden. Existing uploaded files remain but are no longer validated as required for submission. | REQ-045, BR-APP-009 |

### 6.4 File Upload Events

| No. | UI Element (Item ID) | Event | Action Description | API Called | Functional Spec Reference |
| :---: | :--- | :--- | :--- | :--- | :--- |
| EVT-07 | `uplReceiptDropzone` (Item 49) | `onDrop` / `onChange` (file input) | Validates file type and size client-side. If valid, uploads file to server. On success, adds file to `lstReceiptFiles` (Item 50). | `POST /api/v1/applicant/payment-requests/:id/receipts` (`multipart/form-data`) | UC-APP-005, Sec 6.5, BR-APP-010/011 |
| EVT-08 | `btnDeleteReceiptFile` (Item 51) | `onClick` | Soft-deletes the selected receipt file. Removes from displayed list. | `DELETE /api/v1/applicant/payment-requests/:id/receipts/:fileId` | UC-APP-006, BR-APP-013 |

### 6.5 WebSocket Events (Real-Time)

| No. | Event Name | Direction | Trigger | UI Action | Functional Spec Reference |
| :---: | :--- | :--- | :--- | :--- | :--- |
| EVT-09 | `statusUpdate` | Receive (Inbound) | Upstream status change by Manager or Approver (e.g., MANAGER_VERIFIED, REJECTED_MANAGER, APPROVED). | (1) Display toast notification with status change details. (2) Auto-refresh data grid list. (3) If detail view is open for the affected request, update status badge and action buttons. | UC-APP-010, Func Spec §11.2 |
| EVT-10 | `notification` | Receive (Inbound) | Targeted notification to the applicant. | Display toast notification. Increment `btnNotificationBell` (Item 4) counter. | Func Spec §11.2 |
| EVT-11 | `statusUpdate` | Send (Outbound) | Applicant submits to Manager (ACT-04). | Dispatched to `user:{manager_id}` room and `MANAGER` role room. Payload: `{ requestId, requestNumber, applicantName, new_status: 'SUBMITTED_MANAGER' }`. | Func Spec §11.3 |
| EVT-12 | `statusUpdate` | Send (Outbound) | Applicant submits to Approver (ACT-05). | Dispatched to `APPROVER` role room. Payload: `{ requestId, requestNumber, applicantName, new_status: 'SUBMITTED_APPROVER' }`. | Func Spec §11.3 |

---

## 7. Validation & Error Handling (入力チェック・エラー処理)

### 7.1 Draft Save Validation — Relaxed Mode (下書き保存 — 緩和バリデーション)

During draft save operations, partial input is permitted. Only basic type and range checks are enforced.

| No. | Target Item (Item ID) | Validation Rule | Error Message (EN) | Error Display |
| :---: | :--- | :--- | :--- | :--- |
| VLD-R01 | `dtpApplicationDate` (28) | If provided, must be a valid calendar date <= today. | "Application Date must be today or earlier." | Inline field error |
| VLD-R02 | `dtpDesiredPaymentDate` (29) | If provided, must be a valid calendar date >= today. | "Desired Payment Date must be today or a future date." | Inline field error |
| VLD-R03 | `colAmount` (43) | If provided, must be numeric and > 0. | "Amount must be greater than zero." | Inline cell error |
| VLD-R04 | `grdBreakdownItems` (39) | Maximum 15 rows. | "Maximum of 15 breakdown line items allowed." | Form-level banner |
| VLD-R05 | `txtPurpose` (34) | If provided, max 500 characters. | "Purpose must not exceed 500 characters." | Inline field error |
| VLD-R06 | `txaRequestContent` (36) | If provided, max 1000 characters. | "Request Content must not exceed 1000 characters." | Inline field error |

### 7.2 Submission Validation — Strict Mode (提出 — 厳格バリデーション)

Full validation is enforced before transitioning out of Draft or Rejected states (Submit to Manager).

| No. | Target Item (Item ID) | Validation Rule | Error Message (EN) | REQ / Rule Reference |
| :---: | :--- | :--- | :--- | :--- |
| VLD-S01 | `dtpApplicationDate` (28) | **Required.** Must be a valid calendar date <= today. | "Application Date is required and must be today or earlier." | REQ-036 |
| VLD-S02 | `dtpDesiredPaymentDate` (29) | **Required.** Must be a valid calendar date >= today. | "Desired Payment Date is required and must be today or a future date." | REQ-037 |
| VLD-S03 | `ddlCurrency` (31) | **Required.** Must select a valid active currency. | "Currency Type is required. Please select a currency." | REQ-041, REQ-043 |
| VLD-S04 | `ddlPaymentType` (32) | **Required.** Must select a valid active payment type. | "Payment Type is required. Please select a payment type." | REQ-041 |
| VLD-S05 | `ddlPaymentMethod` (33) | **Required.** Must select a valid active payment method. | "Payment Method is required. Please select a payment method." | REQ-041 |
| VLD-S06 | `txtPurpose` (34) | **Required.** Max 500 characters. Non-empty after trim. | "Purpose / Usage is required." | REQ-002A |
| VLD-S07 | `txtBankAccountInfo` (35) | **Conditionally required.** Mandatory when `ddlPaymentMethod` resolves to `BANK_TRANSFER` or `CASH`. Max 200 characters. | "Bank account or phone information is required for the selected payment method." | REQ-042 |
| VLD-S08 | `txaRequestContent` (36) | **Required.** Max 1000 characters. Non-empty after trim. | "Payment Request Content is required." | REQ-002A |
| VLD-S09 | `rdoHasReceipt` (37) | **Required.** Must be explicitly selected (TRUE or FALSE). | "Please indicate whether a receipt is present." | REQ-002A |
| VLD-S10 | `ddlTargetManager` (38) | **Required.** Must select an active user with MANAGER role. | "Target Manager is required. Please select a manager for verification." | REQ-002A, BR-APP-017 |
| VLD-S11 | `grdBreakdownItems` (39) | **Required.** Minimum 1 row, maximum 15 rows. | "At least one breakdown line item is required." / "Maximum of 15 breakdown line items allowed." | REQ-039 |
| VLD-S12 | `colItemDate` (41) | **Required** for each row. Must be a valid calendar date. | "Date is required for breakdown line item #{lineNumber}." | REQ-040 |
| VLD-S13 | `colDescription` (42) | **Required** for each row. Max 200 characters. Non-empty after trim. | "Description is required for breakdown line item #{lineNumber}." | REQ-040 |
| VLD-S14 | `colAmount` (43) | **Required** for each row. Must be numeric, > 0, max 2 decimal places. | "Amount is required and must be greater than zero for breakdown line item #{lineNumber}." | REQ-040, REQ-044, BR-APP-015 |
| VLD-S15 | `lblTotalAmount` (30) | Computed total must be > 0. | "Total amount must be greater than zero." | REQ-038, BR-APP-015 |
| VLD-S16 | Receipt Files (Items 49–50) | If `rdoHasReceipt = TRUE`, at least one active (non-deleted) receipt file must exist in `receipt_files` for this request. | "Receipt file attachment is required. Please upload at least one receipt before submitting." | REQ-045, BR-APP-009, Rule 4.1.6 |

### 7.3 File Upload Validation

| No. | Target Item (Item ID) | Validation Rule | Error Message (EN) | HTTP Status / Error Code |
| :---: | :--- | :--- | :--- | :--- |
| VLD-F01 | `uplReceiptDropzone` (49) | File MIME type must be one of: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`. | "File type not supported. Permitted file types: PDF, PNG, JPG." | 415 `UNSUPPORTED_MEDIA_TYPE` |
| VLD-F02 | `uplReceiptDropzone` (49) | Individual file size must not exceed 10MB (10,485,760 bytes). | "File exceeds maximum size of 10 MB." | 413 `PAYLOAD_TOO_LARGE` |
| VLD-F03 | `uplReceiptDropzone` (49) | Total aggregate file size for the request must not exceed 50MB (52,428,800 bytes). | "Total attachment size exceeds the maximum limit of 50 MB." | 413 `PAYLOAD_TOO_LARGE` |

### 7.4 Validation Enforcement Layers

| Layer | Technology | Scope | Description |
| :--- | :--- | :--- | :--- |
| **Frontend (Client)** | React Hook Form + Zod/Yup | Immediate UI feedback | Field-level inline validation with red borders and error messages. Form-level summary banner at top. 300ms debounce on search. |
| **Backend (Server)** | NestJS `class-validator` + `class-transformer` DTOs | Data integrity enforcement | All request bodies validated. Strings trimmed (`@Transform`). SQL injection prevented by TypeORM parameterized queries. |
| **Database** | PostgreSQL CHECK constraints | Last-resort data integrity | `chk_payment_requests_total_amount CHECK (total_amount > 0)`, `chk_payment_breakdown_items_amount CHECK (amount > 0)`, `chk_payment_breakdown_items_line_range CHECK (line_number >= 1 AND line_number <= 15)`, `chk_receipt_files_file_size CHECK (file_size > 0 AND file_size <= 10485760)`. |

### 7.5 Error Response Handling (API Error Classification)

| No. | HTTP Status | Error Code | Scenario | User-Facing Behavior | Functional Spec Reference |
| :---: | :---: | :--- | :--- | :--- | :--- |
| ERR-01 | `400` | `BAD_REQUEST` | Validation failures on request body fields. | Field-level inline errors (red border + text below field). Top banner summary listing all active errors. | Func Spec §9.1, §9.3 |
| ERR-02 | `401` | `UNAUTHORIZED` | Invalid, expired, or missing JWT token. | Redirect to Login page. Session cleared. | Func Spec §9.2 |
| ERR-03 | `403` | `FORBIDDEN` | Accessing another user's request (ownership violation). Attempting forbidden action (e.g., deleting non-DRAFT). | Toast: "You do not have permission to perform this action." No data leaked. | Func Spec §9.2, BR-APP-002 |
| ERR-04 | `404` | `NOT_FOUND` | Requested resource not found or soft-deleted (`is_deleted = TRUE`). | Toast: "Requested resource was not found." Navigate to list view. | Func Spec §9.2 |
| ERR-05 | `409` | `CONFLICT` | Concurrent modification detected (optimistic concurrency lock violation). Invalid state transition attempted. | Toast: "This record has been modified since you loaded it. Please refresh and try again." Auto-refresh data. | Func Spec §9.2, Dev Rules §6.2 |
| ERR-06 | `413` | `PAYLOAD_TOO_LARGE` | Uploaded file exceeds 10MB limit. | Inline error on upload zone: "File exceeds maximum size of 10 MB." | Func Spec §9.2, BR-APP-011 |
| ERR-07 | `415` | `UNSUPPORTED_MEDIA_TYPE` | Invalid file format (not PDF/PNG/JPG). | Inline error on upload zone: "File type not supported. Permitted: PDF, PNG, JPG." | Func Spec §9.2, BR-APP-010 |
| ERR-08 | `422` | `UNPROCESSABLE_ENTITY` | Business rule violation — receipt required but not found (`has_receipt = TRUE` with zero active files). | Toast + inline error: "Receipt file attachment is required. Please upload at least one receipt before submitting." | Func Spec §9.2, BR-APP-009 |
| ERR-09 | `429` | `THROTTLED` | Rate limit exceeded (100 req/min global, 10 req/min auth endpoints). | Toast: "Too many requests. Please wait a moment and try again." | Dev Rules §5.5 |
| ERR-10 | `500` | `INTERNAL_SERVER_ERROR` | Unhandled server error. | Toast: "An unexpected error occurred. Please try again later." Full stack trace logged server-side. | Dev Rules §6.2 |

### 7.6 Frontend Error Display Behavior

| Display Type | Visual Specification | Context |
| :--- | :--- | :--- |
| **Field-Level Inline Error** | Red border on input (`border-red-500`). Error text below: `<p class="mt-1 text-xs text-red-500">{message}</p>`. ARIA: `aria-invalid="true"`, `aria-describedby="{field}-error"`. | Individual field validation failures. |
| **Form-Level Summary Banner** | Top of form. Red background banner listing all active errors as a bulleted list. | Displayed after submit attempt with multiple validation failures. |
| **Toast Notification (Success)** | Slide-in from top-right. Green accent. Auto-dismiss after 5 seconds. `duration-300 ease-out`. | Successful save, submit, delete operations. |
| **Toast Notification (Error)** | Slide-in from top-right. Red accent. Auto-dismiss after 8 seconds. `duration-300 ease-out`. | API errors, server-side validation failures. |
| **Confirmation Modal** | Per Dev Rules §9.5.5. Backdrop blur, centered modal. Cancel + Confirm buttons. | Delete draft, destructive actions. |

---

## 8. State-Dependent Display Rules (状態別表示ルール)

This section summarizes which UI elements are visible, editable, or disabled based on the current `status_id` of the payment request.

### 8.1 Form Field Editability Matrix

| Status ID | Status Code | Form Fields (F2–F4) | Breakdown Table (F5) | Receipt Upload (F6) | Save Draft | Submit to Mgr | Submit to Approver | Delete Draft |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `DRAFT` | Editable | Editable | Editable | Visible | Visible | Hidden | Visible |
| 2 | `SUBMITTED_MANAGER` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | Hidden | Hidden |
| 3 | `MANAGER_REVIEWING` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | Hidden | Hidden |
| 4 | `MANAGER_VERIFIED` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | **Visible** | Hidden |
| 5 | `REJECTED_MANAGER` | Editable | Editable | Editable | Visible | Visible | Hidden | Hidden |
| 6 | `SUBMITTED_APPROVER` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | Hidden | Hidden |
| 7 | `APPROVER_REVIEWING` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | Hidden | Hidden |
| 8 | `APPROVED` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | Hidden | Hidden |
| 9 | `REJECTED_APPROVER` | Editable | Editable | Editable | Visible | Visible | Hidden | Hidden |
| 10 | `PAID` | Read-Only | Read-Only | Read-Only | Hidden | Hidden | Hidden | Hidden |

> **Rule Reference:** Editable status set is determined by `payment_statuses.is_editable_state = TRUE` (status_id: 1, 5, 9). See Func Spec §3.3 and BR-APP-003.

### 8.2 Approval History Visibility

The Approval History Timeline (Section F7) is **always visible** regardless of status, but is **empty** for newly created drafts that have not yet been saved. It is populated from the first `CREATED` log entry onward.

### 8.3 Rejection Comment Highlight

When `status_id` ∈ {5 (`REJECTED_MANAGER`), 9 (`REJECTED_APPROVER`)}, the most recent rejection comment from the approval history shall be displayed prominently at the top of the form in a **warning banner** (red/amber background) to immediately communicate the rejection reason to the applicant.

---

## 9. Appendix: Data Source Summary (データソース参照一覧)

### 9.1 Database Table Usage Map

| Database Table | Physical Columns Used by This Screen | CRUD Operations | Functional Spec Reference |
| :--- | :--- | :--- | :--- |
| `payment_requests` | `payment_request_id`, `request_number`, `applicant_user_id`, `manager_user_id`, `current_assigned_to_user_id`, `application_date`, `desired_payment_date`, `total_amount`, `currency_id`, `payment_type_id`, `payment_method_id`, `purpose`, `bank_account_info`, `request_content`, `has_receipt`, `status_id`, `submitted_to_manager_date`, `submitted_to_approver_date`, `created_date`, `modified_date`, `is_deleted` | Create, Read, Update, Soft Delete | Sec 6.1–6.7 |
| `payment_breakdown_items` | `payment_breakdown_item_id`, `payment_request_id`, `line_number`, `item_date`, `description`, `amount`, `quantity`, `unit_price`, `created_date`, `modified_date` | Create, Read, Update, Delete (cascade) | Sec 6.2, 6.3 |
| `receipt_files` | `receipt_file_id`, `payment_request_id`, `original_file_name`, `stored_file_name`, `file_storage_path`, `file_size`, `mime_type`, `uploaded_by_user_id`, `uploaded_date`, `is_deleted` | Create, Read, Soft Delete | Sec 6.5, BR-APP-009–013 |
| `approval_logs` | `approval_log_id`, `payment_request_id`, `action_taken_by_user_id`, `action_type_id`, `previous_status_id`, `new_status_id`, `comment`, `ip_address`, `user_agent`, `timestamp` | Create (append-only), Read | Sec 10.4 |
| `users` | `user_id`, `full_name`, `employee_number`, `department`, `branch`, `role_id`, `is_active` | Read only (profile info, manager list) | Sec 5.1, BR-APP-017 |
| `payment_statuses` | `status_id`, `status_code`, `status_name`, `display_order`, `is_editable_state` | Read only (lookup / badge display) | Sec 3.2, 5.1 |
| `currencies` | `currency_id`, `currency_code`, `currency_name`, `is_active` | Read only (dropdown options) | Sec 5.2 |
| `payment_types` | `payment_type_id`, `payment_type_code`, `payment_type_name`, `is_active` | Read only (dropdown options) | Sec 5.2 |
| `payment_methods` | `payment_method_id`, `payment_method_code`, `payment_method_name`, `is_active` | Read only (dropdown options) | Sec 5.2 |
| `approval_action_types` | `action_type_id`, `action_code`, `action_type` | Read only (timeline display) | Sec 5.7 |
| `user_roles` | `role_id`, `role_code`, `role_name` | Read only (manager filtering) | Sec 5.4 |

### 9.2 Redis Cache Key References

| Cache Key Pattern | Source Table | TTL | Used By (Item ID) |
| :--- | :--- | :--- | :--- |
| `lookup:payment_statuses` | `payment_statuses` | 24 hours | `ddlStatusFilter` (10), `colStatus` (18) |
| `lookup:currencies` | `currencies` | 24 hours | `ddlCurrency` (31) |
| `lookup:payment_types` | `payment_types` | 24 hours | `ddlPaymentType` (32) |
| `lookup:payment_methods` | `payment_methods` | 24 hours | `ddlPaymentMethod` (33) |
| `payment_request:payload:{id}` | `payment_requests` (+ joins) | 10 minutes | Detail/Edit view data population |
| `session:{token}` | User session data | 1 hour (sliding) | Authentication across all items |

### 9.3 API Endpoint Summary

| HTTP Method | Endpoint | Purpose | Used By (Action ID) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/applicant/payment-requests` | List all applicant's payment requests (paginated) | Data Grid load, ACT-02 |
| `GET` | `/api/v1/applicant/payment-requests/:id` | Get single payment request detail | Row click (ACT-02) |
| `POST` | `/api/v1/applicant/payment-requests` | Create new payment request (draft) | ACT-03 (create mode) |
| `PATCH` | `/api/v1/applicant/payment-requests/:id` | Update existing payment request | ACT-03 (edit mode) |
| `DELETE` | `/api/v1/applicant/payment-requests/:id` | Soft-delete draft payment request | ACT-07 |
| `POST` | `/api/v1/applicant/payment-requests/:id/receipts` | Upload receipt file | EVT-07 |
| `DELETE` | `/api/v1/applicant/payment-requests/:id/receipts/:fileId` | Soft-delete receipt file | EVT-08 |
| `POST` | `/api/v1/applicant/payment-requests/:id/submit-manager` | Submit to Manager | ACT-04 |
| `POST` | `/api/v1/applicant/payment-requests/:id/submit-approver` | Submit to Final Approver | ACT-05 |
| `GET` | `/api/v1/shared/lookups` | Retrieve cached master data (statuses, currencies, etc.) | Filter/Dropdown population |

---

**END OF DOCUMENT**
