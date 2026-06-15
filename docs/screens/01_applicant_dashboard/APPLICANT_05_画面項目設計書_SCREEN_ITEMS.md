# Screen Items Specification (画面項目設計書) — Applicant Dashboard

**Document ID:** PRWM-SIS-SCR-001  
**Target Screen:** Applicant Dashboard (申請者ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Applicant Operations  
**Function ID:** FN-001  
**Version:** 1.0  
**Created:** 2026-06-15  
**Last Updated:** 2026-06-15  
**Author:** Senior System Engineer  
**Review Status:** Released (承認済み)  
**Classification:** Internal — Engineering Division

---

## 1. Document Control (ドキュメント管理)

### 1.1 Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-15 | Senior System Engineer | Initial release. Complete screen items specification for the Applicant Dashboard subsystem covering all UI elements, item definitions, action/event controls, validation rules, and error handling. Fully aligned with PRWM-REQ-001, PRWM-DBS-001, PRWM-DEV-001, and PRWM-FSD-SCR-001. |

### 1.2 Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `03_データベース設計書_DATABASE_SPEC.md` | Table structures, constraints, and data types. |
| 3 | PRWM-DEV-001 | Development Rules | `02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |
| 4 | PRWM-FSD-SCR-001 | Functional Specification — Applicant Dashboard | `APPLICANT_04_機能設計書_FUNCTIONAL_SPEC.md` | Use cases, state transitions, validation rules, error handling. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose (目的)
The Applicant Dashboard is the primary operational portal for users assigned the `APPLICANT` role within the Payment Request Workflow Management System. It provides a comprehensive, real-time view of all payment requests originated by the authenticated applicant, and serves as the entry point for all payment request lifecycle operations — from initial drafting through final submission to the approval chain.

### 2.2 Target Users & Roles (対象ユーザーと権限)

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `APPLICANT` role (`role_code = 'APPLICANT'`) |
| **Required Authentication** | JWT Bearer Token (RS256, validated per request) |
| **Data Scope** | Exclusively the authenticated user's own originated payment requests (`applicant_user_id = current_user.user_id`) |
| **Access Control** | `JwtAuthGuard` → `RolesGuard` → `OwnershipGuard` (sequential execution) |

### 2.3 Core Functions & Basic Design Principles (主要機能・基本設計方針)
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

### 3.1 Overall Page Structure (全体画面構成)

```text
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

### 3.2 Responsive Layout Breakpoints (レスポンシブ対応)

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | Single column, hidden sidebar (hamburger menu), stacked KPI cards, accordion form sections |
| Tablet (`md:`) | 768px | Single column stacked with collapsible panes, 2-column KPI grid |
| Desktop (`lg:`) | 1024px | Full layout, fixed sidebar `w-64`, 4-column KPI grid, dual-pane list + detail |
| Wide (`xl:`) | 1280px | Extended table columns, wider content area |

---

## 4. Item Definitions (画面項目定義)

### 4.1 Section [A]: Page Header (ページヘッダー)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `lblPageTitle` | Applicant Dashboard | Static Label (`<h1>`) | String | — | Visible; always displayed. Text: "Applicant Dashboard" | — | Hardcoded UI text | Single `<h1>` per page. Tailwind: `text-2xl font-bold text-slate-900`. |
| 2 | `lblUserName` | User Display Name | Static Label | String(200) | — | Populated from JWT payload | — | `users.full_name` (via JWT `sub` → `user_id`) | Displayed in top-right header area. |
| 3 | `lblUserRole` | User Role Badge | Static Label (Badge) | String(50) | — | Populated from JWT payload. Text: "Applicant" | — | `user_roles.role_name` (via JWT `role`) | Styled as subtle badge: `text-xs text-blue-300`. |
| 4 | `btnNotificationBell` | Notification Bell Icon | Icon Button | — | — | Visible. Badge counter shows unread count. | — | WebSocket `notification` event counter | Shows unread notification count. Clicking opens notification panel. |

### 4.2 Section [B]: KPI Summary Cards (サマリーカード)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 5 | `kpiTotalRequests` | Total Requests | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `is_deleted = FALSE` | Card label: "Total Requests". Icon: document icon, BG: `bg-blue-100`. |
| 6 | `kpiPendingReview` | Pending Review | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `status_id` IN (2, 3, 6, 7) AND `is_deleted = FALSE` | Card label: "Pending Review". Icon: clock icon, BG: `bg-amber-100`. Includes statuses: SUBMITTED_MANAGER, MANAGER_REVIEWING, SUBMITTED_APPROVER, APPROVER_REVIEWING. |
| 7 | `kpiApproved` | Approved | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `status_id` IN (8, 10) AND `is_deleted = FALSE` | Card label: "Approved". Icon: check icon, BG: `bg-emerald-100`. Includes APPROVED and PAID. |
| 8 | `kpiRejected` | Rejected | KPI Summary Card | Integer | — | Displays count on load. Default: `0` | Numeric display only | `COUNT(*)` from `payment_requests` WHERE `applicant_user_id = current_user.user_id` AND `status_id` IN (5, 9) AND `is_deleted = FALSE` | Card label: "Rejected". Icon: x-circle icon, BG: `bg-red-100`. Includes REJECTED_MANAGER and REJECTED_APPROVER. |

### 4.3 Section [C]: Filter / Search Bar (フィルター・検索バー)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 9 | `txtSearchQuery` | Search | Text Input | String(50) | Optional | Empty. Placeholder: "Search by request number or amount..." | Alphanumeric, dash, period. 300ms debounce. | Queries `payment_requests.request_number` (LIKE match) or `payment_requests.total_amount` (range match) | REQ-033. Searches request number or amount. Tooltip: "Enter request number (e.g. PRF-2026-001) or amount". |
| 10 | `ddlStatusFilter` | Status Filter | Dropdown (Select) | Integer (FK) | Optional | Default: "All Statuses" (value: `null`) | Must be a valid `status_id` from lookup or null | `payment_statuses.status_id` / `payment_statuses.status_name` | REQ-034. Options dynamically loaded from `payment_statuses` master table (cached in Redis `lookup:payment_statuses`). |
| 11 | `dtpDateRangeFrom` | Date From | Date Picker | DATE | Optional | Empty | Format: `YYYY-MM-DD`. Must be valid calendar date. | Filters `payment_requests.created_date >= :dateFrom` | REQ-034. Start of date range filter. |
| 12 | `dtpDateRangeTo` | Date To | Date Picker | DATE | Optional | Empty | Format: `YYYY-MM-DD`. Must be >= `dtpDateRangeFrom` if set. | Filters `payment_requests.created_date <= :dateTo` | REQ-034. End of date range filter. |
| 13 | `btnCreateNewRequest` | Create New Request | Button (Primary) | — | — | Visible. Enabled. | — | — | Navigates to Create Form View (Section F). Tailwind: Primary button variant per Dev Rules §9.5.4. Text: "+ Create New Request". |

### 4.4 Section [D]: Payment Request Data Grid (支払申請一覧グリッド)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 14 | `colRequestNumber` | Request Number (申請番号) | Data Grid Column (Link) | String(50) | — | Populated from API response | Display as-is. Regex: `^PRF-[0-9]{4}-[0-9]{3,6}$` | `payment_requests.request_number` | COL-01. Sortable: Yes. Filterable: Yes. Clickable — navigates to Detail/Edit view. `whitespace-nowrap`. |
| 15 | `colApplicationDate` | Application Date (申請日) | Data Grid Column | DATE | — | Populated from API response | Display format: `YYYY-MM-DD` | `payment_requests.application_date` | COL-02. Sortable: Yes. Filterable: No. `whitespace-nowrap`. |
| 16 | `colTotalAmount` | Total Amount (合計金額) | Data Grid Column | NUMERIC(12,2) | — | Populated from API response | Display format: Decimal with thousand separators and 2 decimal places. | `payment_requests.total_amount` | COL-03. Sortable: Yes. Filterable: Yes (range). Displayed with currency code suffix. TypeORM maps NUMERIC to JS `string`. |
| 17 | `colCurrency` | Currency (通貨) | Data Grid Column | String(3) | — | Populated from API response | Display as ISO currency code | `currencies.currency_code` | COL-04. Sortable: Yes. Filterable: No. |
| 18 | `colStatus` | Status (ステータス) | Data Grid Column (Badge) | String(50) | — | Populated from API response | Rendered as colored badge per Dev Rules §9.2.2 status color mapping | `payment_statuses.status_name` | COL-05. Sortable: Yes. Filterable: Yes. Badge: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border`. |
| 19 | `colCreatedDate` | Created Date (作成日) | Data Grid Column | TIMESTAMPTZ | — | Populated from API response | Display format: `YYYY-MM-DD HH:mm` (UTC → local timezone conversion) | `payment_requests.created_date` | COL-06. Sortable: Yes. Filterable: No. `whitespace-nowrap`. Timezone conversion handled in presentation layer per DB Spec §1.3. |

### 4.5 Section [E]: Pagination Controls (ページネーション)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 20 | `btnPrevPage` | Previous Page | Button (Secondary) | — | — | Disabled if `page = 1` | — | API query param `?page={n-1}` | Navigates to previous page. Disabled state: `opacity-50 cursor-not-allowed`. |
| 21 | `lblPageInfo` | Page Indicator | Static Label | String | — | Format: "Page {page} of {totalPages}" | — | API response `meta.page` / `meta.totalPages` | Read-only display of current pagination state. |
| 22 | `btnNextPage` | Next Page | Button (Secondary) | — | — | Disabled if `page = totalPages` | — | API query param `?page={n+1}` | Navigates to next page. |
| 23 | `ddlPageSize` | Rows Per Page | Dropdown (Select) | Integer | Optional | Default: `10` | Options: 10, 20, 50 | API query param `?pageSize={value}` | REQ-035. Controls pagination size. Resets to page 1 on change. |

### 4.6 Section [F1]: Applicant Information (申請者情報 — Read-Only)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 24 | `lblEmployeeNumber` | Employee Number (社員番号) | Static Label | String(20) | — | Auto-populated from authenticated user profile | — | `users.employee_number` | REQ-002A. Read-only. Always displayed. Cannot be modified by applicant. |
| 25 | `lblFullName` | Employee Name (氏名) | Static Label | String(200) | — | Auto-populated from authenticated user profile | — | `users.full_name` | REQ-002A. Read-only. Always displayed. |
| 26 | `lblBranch` | Branch (支店) | Static Label | String(100) | — | Auto-populated from authenticated user profile | — | `users.branch` | Read-only. Displayed for reference. Also used downstream for Mandalay branch alert logic (Rule 4.3.1). |
| 27 | `lblDepartment` | Department (部署) | Static Label | String(100) | — | Auto-populated from authenticated user profile. May be NULL. | — | `users.department` | Read-only. Display "—" if NULL. |

### 4.7 Section [F2]: Payment Information (支払情報)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 28 | `dtpApplicationDate` | Application Date (申請日) | Date Picker | DATE | Mandatory | Default: Current date (`TODAY()`) | Format: `YYYY-MM-DD`. Must be today or earlier (`<= TODAY()`). REQ-036. | `payment_requests.application_date` | Editable in states {1, 5, 9}. Read-only otherwise. Required indicator: red asterisk `*`. |
| 29 | `dtpDesiredPaymentDate` | Desired Payment Date (支払希望日) | Date Picker | DATE | Mandatory | Empty | Format: `YYYY-MM-DD`. Must be today or later (`>= TODAY()`). REQ-037. | `payment_requests.desired_payment_date` | Editable in states {1, 5, 9}. Read-only otherwise. |
| 30 | `lblTotalAmount` | Total Payment Amount (支払金額) | Static Label (Computed) | NUMERIC(12,2) | Mandatory | Auto-calculated: `0.00` | Display format: Decimal with thousand separators. Always > 0 at submission. REQ-038. | `payment_requests.total_amount` | **Read-only, auto-computed.** Value is the SUM of all `payment_breakdown_items.amount`. Manual override is FORBIDDEN. DB constraint: `chk_payment_requests_total_amount CHECK (total_amount > 0)`. |
| 31 | `ddlCurrency` | Currency Type (通貨選択) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select --" (value: `null`) | Must select a valid active currency from lookup. REQ-041. | `payment_requests.currency_id` | Options populated from `currencies` master table. Editable in states {1, 5, 9}. |
| 32 | `ddlPaymentType` | Payment Type (支払タイプ) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select --" (value: `null`) | Must select a valid active payment type from lookup. REQ-041. | `payment_requests.payment_type_id` | Options populated from `payment_types` master table. Editable in states {1, 5, 9}. |
| 33 | `ddlPaymentMethod` | Payment Method (支払方法) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select --" (value: `null`) | Must select a valid active payment method from lookup. REQ-041. | `payment_requests.payment_method_id` | **On change event**: Toggles visibility/required state of `txtBankAccountInfo`. Editable in states {1, 5, 9}. |
| 34 | `txtPurpose` | Purpose / Usage (用途) | Text Input | String(500) | Mandatory | Empty | Max length: 500 characters. Trimmed whitespace on submit. | `payment_requests.purpose` | REQ-002A. Editable in states {1, 5, 9}. Placeholder: "Enter the purpose of this payment...". |
| 35 | `txtBankAccountInfo` | Bank Account / Phone (銀行口座・電話番号) | Text Input | String(200) | Conditional | Empty. Initially hidden if payment method is "Check". | Max length: 200 characters. Trimmed whitespace on submit. | `payment_requests.bank_account_info` | **Conditional Required**: Mandatory when `ddlPaymentMethod` resolves to "Bank Transfer" or "Cash". Hidden when "Check". REQ-042. Editable in states {1, 5, 9}. |

### 4.8 Section [F3]: Request Content (申請内容)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 36 | `txaRequestContent` | Payment Request Content (支払申請内容) | Textarea | TEXT (max 1000) | Mandatory | Empty | Max length: 1000 characters. Trimmed whitespace on submit. Character counter displayed below field. | `payment_requests.request_content` | REQ-002A. Editable in states {1, 5, 9}. Rows: 4. |
| 37 | `rdoHasReceipt` | Receipt Present (領収書の有無) | Radio Button Group | BOOLEAN | Mandatory | Default: `TRUE` (Yes) | Options: "Yes" (`true`), "No" (`false`). | `payment_requests.has_receipt` | REQ-002A. Editable in states {1, 5, 9}. When `TRUE`, receipt file upload section is enabled and at least one file must be attached before submission (BR-APP-009). |

### 4.9 Section [F4]: Manager Selection (マネージャー選択)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 38 | `ddlTargetManager` | Target Manager (承認担当者) | Dropdown (Select) | Integer (FK) | Mandatory | Default: "-- Select Manager --". Pre-populated with previously selected manager if editing a rejected request. | Must select an active user with MANAGER role. | `payment_requests.manager_user_id` | REQ-002A, BR-APP-017. Editable in states {1, 5, 9}. Upon submission, also sets `payment_requests.current_assigned_to_user_id` (BR-APP-018). |

### 4.10 Section [F5]: Payment Breakdown Table (支払内訳テーブル)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 39 | `grdBreakdownItems` | Payment Breakdown Table | Editable Data Grid | — | Mandatory | Initialized with 1 empty row | Min rows: 1, Max rows: 15. REQ-039. | `payment_breakdown_items` | Editable in states {1, 5, 9}. |
| 40 | `colLineNumber` | No (行番号) | Static Label | Integer (1-15) | — | Auto-incremented starting from 1 | Range: 1–15. Auto-assigned sequentially. | `payment_breakdown_items.line_number` | REQ-002B. Read-only. DB constraint: `chk_payment_breakdown_items_line_range`. |
| 41 | `colItemDate` | Date (日付) | Date Picker | DATE | Mandatory | Empty | Format: `YYYY-MM-DD`. Must be a valid calendar date. | `payment_breakdown_items.item_date` | Editable in states {1, 5, 9}. |
| 42 | `colDescription` | Description (内容) | Text Input | String(200) | Mandatory | Empty | Max length: 200 characters. | `payment_breakdown_items.description` | Editable in states {1, 5, 9}. |
| 43 | `colAmount` | Amount (金額) | Number Input | NUMERIC(10,2) | Mandatory | Empty (`0.00`) | Decimal, max 2 decimal places. Must be > 0. Max: 9,999,999,999.99. | `payment_breakdown_items.amount` | Editable in states {1, 5, 9}. On change: triggers total amount recalculation (BR-APP-014). |
| 44 | `colQuantity` | Quantity (数量) | Number Input | NUMERIC(10,2) | Optional | Default: `1.00` | Decimal, max 2 decimal places. | `payment_breakdown_items.quantity` | Editable in states {1, 5, 9}. |
| 45 | `colUnitPrice` | Unit Price (単価) | Number Input | NUMERIC(10,2) | Optional | Empty (NULL) | Decimal, max 2 decimal places. | `payment_breakdown_items.unit_price` | Editable in states {1, 5, 9}. |
| 46 | `btnAddBreakdownRow` | Add Row (行追加) | Button (Secondary) | — | — | Enabled if row count < 15 | Disabled when row count reaches 15. | — | Adds a new empty breakdown row. |
| 47 | `btnRemoveBreakdownRow` | Remove Row (行削除) | Icon Button (Danger) | — | — | Enabled if row count > 1 | Disabled when only 1 row remains. | — | Removes row and recalculates total. |
| 48 | `lblBreakdownTotal` | Total (合計) | Static Label | NUMERIC(12,2) | — | `0.00` | Auto-calculated: SUM of all `colAmount`. | Derived → `payment_requests.total_amount` | Updates in real-time as amounts change. |

### 4.11 Section [F6]: Receipt File Upload (領収書アップロード)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 49 | `uplReceiptDropzone` | Receipt File Upload Zone | File Picker | File (Binary) | Conditional | Visible when `rdoHasReceipt = TRUE`. | Accepted MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`. Max size: 10MB/file, 50MB/total. | `receipt_files` / `/uploads/{id}/{UUID}` | Editable in states {1, 5, 9}. Disabled/hidden in read-only states. |
| 50 | `lstReceiptFiles` | Attached Receipt Files List | List / Table | — | — | Empty list | — | `receipt_files` | Displays each file as a row. |
| 51 | `btnDeleteReceiptFile` | Delete Receipt File | Icon Button (Danger) | — | — | Visible only in editable states {1, 5, 9} | — | Sets `receipt_files.is_deleted = TRUE` | UC-APP-006. Soft-delete only (BR-APP-013). |
| 52 | `lblReceiptFileName` | File Name | Static Label (Link) | String(255) | — | Populated from DB | — | `receipt_files.original_file_name` | Clickable link to download/preview. |
| 53 | `lblReceiptFileSize` | File Size | Static Label | String | — | Computed from byte value | — | `receipt_files.file_size` | DB constraint enforces max 10MB. |

### 4.12 Section [F7]: Approval History Timeline (承認履歴タイムライン)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 56 | `tlnApprovalHistory` | Approval History Timeline | Timeline | — | — | Populated for existing requests. | — | `approval_logs` | REQ-024. Read-only. |
| 57 | `lblLogTimestamp` | Date/Time (日時) | Static Label | TIMESTAMPTZ | — | Populated from DB | UTC → local timezone conversion | `approval_logs.timestamp` | BR-APP-022. |
| 58 | `lblLogUser` | User (担当者) | Static Label | String(200) | — | Populated from DB via JOIN | — | `approval_logs.action_taken_by_user_id` | Displays full name. |
| 59 | `lblLogAction` | Action (アクション) | Static Label (Badge) | String(50) | — | Populated from DB via JOIN | — | `approval_logs.action_type_id` | Displayed as styled badge. |
| 60 | `lblLogComment` | Comment (コメント) | Static Label | TEXT | — | Populated from DB | — | `approval_logs.comment` | Highlighted with a distinct background for reject actions. |

### 4.13 Section [F8]: Action Button Bar (アクションボタンバー) & Modals

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 61 | `btnDeleteDraft` | Delete Draft | Button (Danger) | — | — | Visible only when `status_id = 1` (DRAFT). | — | `payment_requests.is_deleted = TRUE` | Triggers `mdlDeleteConfirm` confirmation modal. |
| 62 | `btnCancel` | Cancel | Button (Secondary) | — | — | Visible in form view. | — | — | Navigates back to List View without saving. |
| 63 | `btnSaveDraft` | Save Draft | Button (Primary) | — | — | Visible when `status_id` ∈ {1, 5, 9}. | — | `POST/PATCH /api/v1/applicant/payment-requests` | Saves form state with relaxed validation. |
| 64 | `btnSubmitToManager` | Submit to Manager | Button (Primary) | — | — | Visible when `status_id` ∈ {1, 5, 9}. | All mandatory fields must pass strict validation. | `POST /api/v1/applicant/payment-requests/:id/submit-manager` | Transitions status to `SUBMITTED_MANAGER` (2). |
| 65 | `btnSubmitToApprover` | Submit to Final Approver | Button (Primary) | — | — | Visible ONLY when `status_id = 4` (MANAGER_VERIFIED). | — | `POST /api/v1/applicant/payment-requests/:id/submit-approver` | Transitions status to `SUBMITTED_APPROVER` (6). |
| 66 | `mdlDeleteConfirm` | Delete Draft Modal | Modal Dialog | — | — | Hidden. | — | — | Backdrop: `bg-black/50`. |
| 70 | `btnDeleteModalConfirm`| Delete | Button (Danger) | — | — | Enabled in modal | — | `DELETE /api/v1/applicant/payment-requests/:id` | Executes soft deletion. |

---

## 5. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 5.1 Create New Request (`btnCreateNewRequest` onClick)
- **Trigger:** User clicks "+ Create New Request" from the Dashboard list view.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Ensure user is authenticated with `APPLICANT` role.
  2. **Post-Execution UI:** Form opens with default values. Employee info auto-populated. 1 empty breakdown row initialized.

### 5.2 Row Click / Open Request (Data Grid Row onClick)
- **Trigger:** User clicks a row in the pending queue data grid.
- **Processing Logic:**
  1. **Backend Dispatch:** `GET /api/v1/applicant/payment-requests/:id`
  2. **Backend Execution:** Verify ownership (`applicant_user_id = current_user.user_id`). Fetch request details, breakdown items, and approval logs.
  3. **Post-Execution UI:** Detail view is populated. If `status_id` ∈ {1,5,9}, opens in Edit Mode. Otherwise, opens in Read-Only Detail Mode.

### 5.3 Save Draft (`btnSaveDraft` onClick)
- **Trigger:** User clicks "Save Draft" in the action bar.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Form undergoes "Relaxed Validation" (basic type/range checks only).
  2. **Backend Dispatch:** `POST /api/v1/applicant/payment-requests` (for new) or `PATCH /api/v1/applicant/payment-requests/:id` (for existing).
  3. **Backend Execution:** Upsert data. Append `CREATED` or `EDITED` to `approval_logs`.
  4. **Post-Execution UI:** Form remains open. Success toast: "Draft saved successfully." Request number generated.

### 5.4 Submit to Manager (`btnSubmitToManager` onClick)
- **Trigger:** User clicks "Submit to Manager" in the action bar.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Form undergoes "Strict Validation". All mandatory fields must be populated, valid, and if `has_receipt = TRUE`, at least one receipt must exist.
  2. **Backend Dispatch:** `POST /api/v1/applicant/payment-requests/:id/submit-manager`
  3. **Backend Execution:** Validate data integrity. Update `status_id` to 2 (`SUBMITTED_MANAGER`). Append `SUBMITTED` to `approval_logs`.
  4. **Post-Execution UI:** Dispatch real-time WebSocket `statusUpdate` event to `user:{manager_id}` and `MANAGER` room. Navigate to list view and auto-refresh grid. Success toast: "Request submitted to Manager successfully."

### 5.5 Submit to Final Approver (`btnSubmitToApprover` onClick)
- **Trigger:** User clicks "Submit to Final Approver" (only visible when `status_id = 4`).
- **Processing Logic:**
  1. **Backend Dispatch:** `POST /api/v1/applicant/payment-requests/:id/submit-approver`
  2. **Backend Execution:** Status transitions to 6 (`SUBMITTED_APPROVER`). Append `SUBMITTED` to `approval_logs`.
  3. **Post-Execution UI:** Dispatch WebSocket `statusUpdate` to `APPROVER` room. Refresh grid. Success toast: "Request submitted to Final Approver successfully."

### 5.6 Delete Draft (`btnDeleteModalConfirm` onClick)
- **Trigger:** User clicks "Delete" inside the `mdlDeleteConfirm` modal.
- **Processing Logic:**
  1. **Backend Dispatch:** `DELETE /api/v1/applicant/payment-requests/:id`
  2. **Backend Execution:** Backend verifies status is 1 (`DRAFT`) and user ownership. Sets `is_deleted = TRUE` (Soft delete).
  3. **Post-Execution UI:** Close modal. Success toast: "Draft deleted successfully." Navigate back to list view and refresh.

### 5.7 Receipt File Upload (`uplReceiptDropzone` onDrop/onChange)
- **Trigger:** User drags & drops a file or selects one via file picker.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Validate file MIME type (PDF, PNG, JPG) and max size (10MB/file, 50MB/total).
  2. **Backend Dispatch:** `POST /api/v1/applicant/payment-requests/:id/receipts` (multipart/form-data)
  3. **Backend Execution:** Store physical file, insert record into `receipt_files`.
  4. **Post-Execution UI:** Add file to `lstReceiptFiles`.

### 5.8 Dynamic Field Visibility: Payment Method (`ddlPaymentMethod` onChange)
- **Trigger:** User selects a new payment method.
- **Processing Logic:**
  1. **Post-Execution UI:** If method is `BANK_TRANSFER` or `CASH`, set `txtBankAccountInfo` to visible and mandatory. If `CHECK`, set to hidden and optional, and clear its value.

### 5.9 Dynamic Field Visibility: Receipt Presence (`rdoHasReceipt` onChange)
- **Trigger:** User toggles "Receipt Present" radio button.
- **Processing Logic:**
  1. **Post-Execution UI:** If `TRUE`, `uplReceiptDropzone` becomes visible. If `FALSE`, it hides. Existing files remain attached in DB but strict validation for receipt presence is bypassed.

### 5.10 Dynamic Recalculation: Amount (`colAmount` onChange)
- **Trigger:** User modifies any `colAmount` in the breakdown table.
- **Processing Logic:**
  1. **Post-Execution UI:** Instantly sum all `colAmount` rows. Update `lblBreakdownTotal` and the main `lblTotalAmount` values.

---

## 6. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

| Error Code | Target Field | Condition / Evaluation Logic | UI/UX Display Presentation Style | Default Error Message Text |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-APP-001** | `dtpApplicationDate` | Missing, or date is after today. (Strict mode) | Red border. Text below field. | "Application Date is required and must be today or earlier." |
| **VAL-APP-002** | `dtpDesiredPaymentDate` | Missing, or date is before today. (Strict mode) | Red border. Text below field. | "Desired Payment Date is required and must be today or a future date." |
| **VAL-APP-003** | `txtPurpose` | Trimmed string empty, or > 500 chars. | Red border. Text below field. | "Purpose is required and must not exceed 500 characters." |
| **VAL-APP-004** | `txaRequestContent` | Trimmed string empty, or > 1000 chars. | Red border. Text below field. | "Request Content is required and must not exceed 1000 characters." |
| **VAL-APP-005** | `txtBankAccountInfo` | Empty when Payment Method is Bank Transfer/Cash. | Red border. Text below field. | "Bank account or phone information is required for the selected payment method." |
| **VAL-APP-006** | `grdBreakdownItems` | Breakdown rows = 0 or > 15. | Form-level summary banner. | "At least one breakdown line item is required." / "Maximum of 15 items allowed." |
| **VAL-APP-007** | `colAmount` | Amount missing, non-numeric, or <= 0. | Red border in cell. | "Amount is required and must be greater than zero for breakdown line item #{lineNumber}." |
| **VAL-APP-008** | `uplReceiptDropzone` | MIME type invalid (not PDF/PNG/JPG). | Inline error on upload zone. | "File type not supported. Permitted file types: PDF, PNG, JPG." |
| **VAL-APP-009** | `uplReceiptDropzone` | File exceeds 10MB limit. | Inline error on upload zone. | "File exceeds maximum size of 10 MB." |
| **VAL-APP-010** | Receipt Files List | `has_receipt=TRUE` but no active files exist during Submit. | Top form banner + Inline error. | "Receipt file attachment is required. Please upload at least one receipt before submitting." |
| **ERR-APP-401** | Full Viewport / API | JWT token missing, expired, or invalid. | Floating modal alert, redirect to login. | "Session expired. Please log in again." |
| **ERR-APP-403** | Full Viewport / API | User lacks `APPLICANT` role or tries to view someone else's request. | Toast notification. | "You do not have permission to perform this action." |
| **ERR-APP-409** | Full Viewport / API | Optimistic lock violation; record modified by another actor. | Toast notification + auto-refresh. | "This record has been modified since you loaded it. Please refresh and try again." |
| **ERR-APP-500** | Full Viewport / API | Unhandled server error. | Toast notification. Stack trace logged server-side. | "An unexpected error occurred. Please try again later." |

---

## 7. Special UI Notes & Styling Constraints (特記事項・UI仕様)

- **Responsive Viewport Design Boundaries:** Layout optimized primarily for standard desktop configurations (1024px+). The breakdown table uses horizontal scrolling or stacks into cards on mobile. Sidebar becomes a hamburger menu on mobile/tablet.
- **Accessibility Execution Rules:** Every actionable control (buttons, inputs, dropdowns) must be keyboard navigable via sequential `Tab` focus tracking and executable using `Enter` or `Space`. ARIA labels required for `grdBreakdownItems` inputs.
- **Performance & Loading States:** Data grid uses skeleton loaders during initial data fetch. Buttons (`btnSubmitToManager`, `btnSaveDraft`) must display a spinner and enter a `disabled` state while asynchronous API calls are pending to prevent double-submission. 300ms debounce on search inputs.
- **Security Provision (Sanitization Indicator):** Explicitly sanitize and escape all user input fields (specifically `txtPurpose` and `txaRequestContent`) to prevent Cross-Site Scripting (XSS) injection. Server applies `@Transform` to trim whitespace.
- **Design System Rules:** strictly adhere to the Tailwind color palette and design guidelines established in `02_開発ルール_DEVELOPMENT_RULES.md`. Status badges use standard color mapping (Draft=gray, Submitted=amber, Approved=emerald, Rejected=red). Rejection comments display in a prominent warning banner at the top of the form view.

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

| Database Table | Physical Columns Used by This Screen | CRUD Operations |
| :--- | :--- | :--- |
| `payment_requests` | `payment_request_id`, `request_number`, `applicant_user_id`, `manager_user_id`, `application_date`, `desired_payment_date`, `total_amount`, `currency_id`, `payment_type_id`, `payment_method_id`, `purpose`, `bank_account_info`, `request_content`, `has_receipt`, `status_id`, `created_date`, `is_deleted` | Create, Read, Update, Soft Delete |
| `payment_breakdown_items` | `payment_breakdown_item_id`, `payment_request_id`, `line_number`, `item_date`, `description`, `amount`, `quantity`, `unit_price` | Create, Read, Update, Delete (cascade) |
| `receipt_files` | `receipt_file_id`, `payment_request_id`, `original_file_name`, `file_size`, `mime_type`, `uploaded_date`, `is_deleted` | Create, Read, Soft Delete |
| `approval_logs` | `approval_log_id`, `payment_request_id`, `action_taken_by_user_id`, `action_type_id`, `comment`, `timestamp` | Create (append-only), Read |
| `users` | `user_id`, `full_name`, `employee_number`, `department`, `branch`, `role_id`, `is_active` | Read only |
| `payment_statuses` | `status_id`, `status_name`, `display_order`, `is_editable_state` | Read only |
| `currencies` | `currency_id`, `currency_code`, `is_active` | Read only |
| `payment_types` | `payment_type_id`, `payment_type_name`, `is_active` | Read only |
| `payment_methods` | `payment_method_id`, `payment_method_name`, `is_active` | Read only |
| `approval_action_types` | `action_type_id`, `action_type` | Read only |
| `user_roles` | `role_id`, `role_name` | Read only |

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

| HTTP Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/v1/applicant/payment-requests` | List all applicant's payment requests (paginated) |
| `GET` | `/api/v1/applicant/payment-requests/:id` | Get single payment request detail |
| `POST` | `/api/v1/applicant/payment-requests` | Create new payment request (draft) |
| `PATCH` | `/api/v1/applicant/payment-requests/:id` | Update existing payment request |
| `DELETE` | `/api/v1/applicant/payment-requests/:id` | Soft-delete draft payment request |
| `POST` | `/api/v1/applicant/payment-requests/:id/receipts` | Upload receipt file |
| `DELETE` | `/api/v1/applicant/payment-requests/:id/receipts/:fileId` | Soft-delete receipt file |
| `POST` | `/api/v1/applicant/payment-requests/:id/submit-manager` | Submit to Manager |
| `POST` | `/api/v1/applicant/payment-requests/:id/submit-approver` | Submit to Final Approver |
| `GET` | `/api/v1/shared/lookups` | Retrieve cached master data |

---

**END OF DOCUMENT**
