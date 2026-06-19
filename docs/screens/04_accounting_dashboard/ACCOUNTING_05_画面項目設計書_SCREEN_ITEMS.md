# Screen Items Specification (画面項目設計書) — Accounting Dashboard

**Document ID:** PRWM-SIS-SCR-004  
**Target Screen:** Accounting Dashboard (経理ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Accounting Operations  
**Function ID:** FN-004  
**Version:** 1.1  
**Created:** 2026-06-15  
**Last Updated:** 2026-06-16  
**Author:** Senior System Engineer  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## 1. Document Control (ドキュメント管理)

### 1.1 Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-15 | Senior System Engineer | Initial release. Accounting Dashboard screen items specification. |
| 1.1 | 2026-06-16 | Senior System Engineer | Reorganized to match Applicant screen items structure; added detailed section definitions and integration requirements. |

### 1.2 Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, role definitions, and special branch rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` | Table structures, field mappings, and workflow constraints. |
| 3 | PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` | Naming conventions, UI rules, validation, and access controls. |
| 4 | PRWM-FSD-SCR-004 | Functional Specification — Accounting Dashboard | `docs/screens/04_accounting_dashboard/ACCOUNTING_04_機能設計書_FUNCTIONAL_SPEC.md` | Use cases, status transitions, business rules, and operational requirements. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose (目的)
The Accounting Dashboard is the primary operational portal for users assigned the `ACCOUNTING` role within the Payment Request Workflow Management System. It provides a consolidated queue of approved payment requests, detailed audit review for each request, and the ability to complete payment processing with branch-specific alert guidance.

### 2.2 Target Users & Roles (対象ユーザーと権限)

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `ACCOUNTING` role (`role_code = 'ACCOUNTING'`) |
| **Required Authentication** | JWT Bearer Token (RS256, validated per request) |
| **Data Scope** | All active payment requests in status `APPROVED` that are available for accounting processing. |
| **Access Control** | `JwtAuthGuard` → `RolesGuard` → `AccountingGuard` (sequential execution) |

### 2.3 Core Functions & Basic Design Principles (主要機能・基本設計方針)
1. **Approved Request Queue Visibility** — Display an ordered list of payment requests ready for payment completion.  
2. **Detail Review and Audit** — Show full request details, breakdown items, receipt attachments, and approval history in a read-only detail pane.  
3. **Branch-Specific Alert Guidance** — Dynamically render a payment instruction banner based on applicant branch rules.  
4. **Payment Completion Action** — Allow accountants to confirm payment completion, set `PAID` status, and record optional comments and audit logs.  
5. **Real-Time Queue Synchronization** — Refresh the queue automatically via WebSocket when approved requests arrive or payments complete. 

---

## 3. Screen Layout (画面レイアウト構成)

### 3.1 Overall Page Structure (全体画面構成)

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                        │
├──────────┬───────────────────────────────────────────────────────────────────────────┤
│          │  ┌────────────────────────────────────────────────────────────────────┐   │
│          │  │ [A] PAGE HEADER                                                    │   │
│          │  │   Page Title: "Accounting Dashboard" (h1)                          │   │
│  [NAV]   │  │   User Info Badge   |   Notification Bell                          │   │  
│          │  └────────────────────────────────────────────────────────────────────┘   │
│          │                                                                           │
│ Sidebar  │  ┌────────────────────────────────────────────────────────────────────┐   │
│ (w-64)   │  │ [B] SUMMARY CARDS                                                  │   │
│          │  │   [Total Approved]  [Total Pending]  [Mandalay Alerts]             │   │
│          │  └────────────────────────────────────────────────────────────────────┘   │
│ - Logo   │                                                                           │
│ - Menu   │  ┌────────────────────────────────────────────────────────────────────┐   │
│ - User   │  │ [C] FILTER / SEARCH BAR                                            │   │
│          │  │   [Search Input]  [Branch Filter]  [Date Range]                    │   │
│          │  └────────────────────────────────────────────────────────────────────┘   │
│ - User   │  ┌────────────────────────────────────────────────────────────────────┐   │
│          │  │ [D] APPROVED PAYMENT REQUEST QUEUE                                 │   │
│          │  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│          │  │ │ Request# │ Applicant │ Branch │ Amount │ Method │ Status │   │   │   │
│          │  │ ├──────────┼───────────┼────────┼────────┼────────┼────────┤   │   │   │
│          │  │ │ PRF-2026 │ John Doe  │ Mandalay │ 1,500,000 │ Cash │ Approved│   │   │
│          │  │ └──────────────────────────────────────────────────────────────┘   │   │
│          │  └────────────────────────────────────────────────────────────────────┘   │
│          │                                                                           │
│          │  ┌────────────────────────────────────────────────────────────────────┐   │
│          │  │ [D] REQUEST DETAIL PANEL                                           │   │
│          │  │ ┌────────────────────────────────────────────────────────────────┐ │   │
│          │  │ │ [D1] Request Header Section                                    │ │   │
│          │  │ │ [D2] Payment Details Section                                   │ │   │
│          │  │ │ [D3] Request Content Section                                   │ │   │
│          │  │ │ [D4] Breakdown Items Grid                                      │ │   │
│          │  │ │ [D5] Attachments / Approval Timeline                           │ │   │ 
│          │  │ └────────────────────────────────────────────────────────────────┘ │   │
│          │  └────────────────────────────────────────────────────────────────────┘   │
│          │                                                                           │
│          │  ┌────────────────────────────────────────────────────────────────────┐   │
│          │  │ [F] PAYMENT ACTIONS PANEL                                          │   │
│          │  │   [Confirm Payment] [Download All Receipts] [Back to List]         │   │
│          │  └────────────────────────────────────────────────────────────────────┘   │
└──────────┴───────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Layout Breakpoints (レスポンシブ対応)

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | Single column, hidden sidebar, stacked queue and detail panels. |
| Tablet (`md:`) | 768px | Collapsible list/detail panes, banner remains visible. |
| Desktop (`lg:`) | 1024px | Dual-pane list + detail layout, fixed sidebar width. |
| Wide (`xl:`) | 1280px | Expanded grid columns and broader detail panel. |

---

## 4. Item Definitions (画面項目定義)

### 4.1 Section [A]: Page Header (ページヘッダー)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `lblPageTitle` | Accounting Dashboard | Static Label (`<h1>`) | String | — | Text: "Accounting Dashboard" | — | Hardcoded UI text | Should use page title style from Dev Rules. |
| 2 | `lblUserName` | User Display Name | Static Label | String(200) | — | Populated from JWT payload | — | `users.full_name` (authenticated user) | Display in top header. |
| 3 | `lblUserRole` | User Role Badge | Static Label (Badge) | String(50) | — | Text: "Accounting" | — | `user_roles.role_name` via JWT role | Styled as badge. |
| 4 | `btnNotificationBell` | Notification Bell | Icon Button | — | — | Visible | — | WebSocket notification service | Shows unread counter. |

### 4.2 Section [B]: Summary Cards (サマリーカード)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 5 | `kpiTotalApproved` | Total Approved Requests | KPI Card | Integer | — | Displays count on load | Numeric display | `COUNT(*)` from `payment_requests` WHERE `status_id = 8` AND `is_deleted = FALSE` | Card label: "Total Approved". |
| 6 | `kpiPendingToday` | Pending Today | KPI Card | Integer | — | Displays count of approved requests with `application_date = TODAY()` | Numeric display | `COUNT(*)` from `payment_requests` WHERE `status_id = 8` AND `application_date = CURRENT_DATE` | Card label: "Pending Today". |
| 7 | `kpiMandalayAlerts` | Mandalay Alerts | KPI Card | Integer | — | Displays count of approved requests from Mandalay branch | Numeric display | `COUNT(*)` from `payment_requests` JOIN `users` ON `payment_requests.applicant_user_id = users.user_id` WHERE `status_id = 8` AND `users.branch = 'Mandalay'` | Card label: "Mandalay Alerts". |
| 8 | `kpiReceiptMissing` | Missing Receipts | KPI Card | Integer | — | Displays count of approved requests where `has_receipt = TRUE` and no receipt files attached | Numeric display | `COUNT(*)` from `payment_requests` LEFT JOIN `receipt_files` ON ... | Card label: "Missing Receipts". |

### 4.3 Section [C]: Filter / Search Bar (フィルター / 検索バー)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 9 | `txtSearchQuery` | Search | Text Input | String(100) | Optional | Empty | 300ms debounce, alphanumeric, dash | Query against `payment_requests.request_number`, `users.full_name`, `payment_requests.total_amount` | Should support quick filtering of the approved queue. |
| 10 | `ddlBranchFilter` | Branch Filter | Dropdown (Select) | String(100) | Optional | `All Branches` | Select active branch values | `users.branch` | Default selections include all branches. |
| 11 | `dtpDateFrom` | Application Date From | Date Picker | DATE | Optional | Empty | `YYYY-MM-DD` | `payment_requests.application_date >= :dateFrom` | Must be a valid calendar date. |
| 12 | `dtpDateTo` | Application Date To | Date Picker | DATE | Optional | Empty | `YYYY-MM-DD`; must be >= Date From | `payment_requests.application_date <= :dateTo` | If set, should validate range. |
| 13 | `btnClearFilters` | Clear Filters | Button (Secondary) | — | — | Enabled | — | Resets search and filter values | Clears queue filters. |

### 4.4 Section [D]: Approved Payment Request Queue (承認済み支払待ちキュー)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 10 | `colRequestNumber` | Request Number | Data Grid Column (Link) | String(50) | — | Populated from API | Regex: `^PRF-[0-9]{4}-[0-9]{3,6}$` | `payment_requests.request_number` | Clicking opens request detail. |
| 11 | `colApplicantName` | Applicant Name | Data Grid Column | String(200) | — | Populated from API | — | `users.full_name` | Sortable. |
| 12 | `colApplicantBranch` | Branch | Data Grid Column | String(100) | — | Populated from API | — | `users.branch` | Sortable. |
| 13 | `colApplicationDate` | Application Date | Data Grid Column | DATE | — | Populated from API | `YYYY-MM-DD` | `payment_requests.application_date` | Sortable. |
| 14 | `colTotalAmount` | Total Amount | Data Grid Column | NUMERIC(12,2) | — | Populated from API | Thousand separators, currency symbol | `payment_requests.total_amount` | Displays value with `currency_code`. |
| 15 | `colPaymentMethod` | Payment Method | Data Grid Column | String(50) | — | Populated from API | — | `payment_methods.payment_method_name` | Sortable. |
| 16 | `colStatus` | Status | Data Grid Column (Badge) | String(50) | — | Populated from API | Render badge using status color system | `payment_statuses.status_name` | Always `Approved` for queue filter. |
| 17 | `colPaidBy` | Accounting Assigned User | Data Grid Column | String(200) | — | Populated from API | — | `users.full_name` via `payment_requests.accounting_user_id` | Empty until completed. |

### 4.5 Section [E]: Request Detail Panel (リクエスト詳細パネル)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 22 | `lblRequestNumber` | Request Number | Label | String(50) | — | Read-only | — | `payment_requests.request_number` | Always visible when a request is selected. |
| 23 | `lblApplicantName` | Applicant Name | Label | String(200) | — | Read-only | — | `users.full_name` | |
| 24 | `lblBranch` | Branch | Label | String(100) | — | Read-only | — | `users.branch` | |
| 25 | `lblApplicationDate` | Application Date | Label | DATE | — | Read-only | `YYYY-MM-DD` | `payment_requests.application_date` | |
| 26 | `lblStatusName` | Current Status | Label | String(50) | — | Read-only | — | `payment_statuses.status_name` | Should display `Approved` when selected. |
| 27 | `lblTotalAmount` | Total Amount | Label | NUMERIC(12,2) | — | Read-only | Currency formatting | `payment_requests.total_amount` | |
| 28 | `lblCurrency` | Currency | Label | String(3) | — | Read-only | ISO currency code | `currencies.currency_code` | |
| 29 | `lblDesiredPaymentDate` | Desired Payment Date | Label | DATE | — | Read-only | `YYYY-MM-DD` | `payment_requests.desired_payment_date` | |
| 30 | `lblPaymentMethod` | Payment Method | Label | String(50) | — | Read-only | — | `payment_methods.payment_method_name` | |
| 31 | `lblBankAccountInfo` | Bank Account / Phone Number | Label | String(200) | — | Read-only | — | `payment_requests.bank_account_info` | |
| 32 | `lblPaymentType` | Payment Type | Label | String(100) | — | Read-only | — | `payment_types.payment_type_name` | |
| 33 | `lblPurpose` | Purpose | Label | String(500) | — | Read-only | — | `payment_requests.purpose` | |
| 34 | `lblRequestContent` | Payment Request Details | Label | TEXT | — | Read-only | — | `payment_requests.request_content` | |
| 35 | `lblHasReceipt` | Receipt Attached | Label | BOOLEAN | — | Read-only | Yes/No | `payment_requests.has_receipt` | |
| 36 | `grdBreakdownItems` | Payment Breakdown Items | Grid | — | — | Read-only | | `payment_breakdown_items` | Displays date, description, quantity, unit price, amount. |
| 37 | `lblBreakdownItemCount` | Breakdown Line Count | Label | Integer | — | Read-only | 1–15 | `payment_breakdown_items` count | |
| 38 | `lblAttachmentCount` | Receipt Attachment Count | Label | Integer | — | Read-only | — | `receipt_files` where `is_deleted = FALSE` | |
| 39 | `lstReceiptPreview` | Receipt Preview | File Preview | — | — | Read-only | | `receipt_files` | Provides download/open links for attachments. |
| 40 | `payment_alert_banner` | Payment Instruction Banner | Banner | — | — | Rendered on request selection | Text depends on branch rule | `users.branch` | Fixed at top of request detail panel. |
| 41 | `approval_timeline` | Approval History Timeline | Timeline | — | — | Populated from API | Sorted by descending `timestamp` | `approval_logs` | Includes date, user, action, comment. |
| 42 | `txtAccountingComment` | Accounting Comment | Textarea | String(500) | Optional | Empty | Max length 500 | `approval_logs.comment` on completion | Optional processing note saved on payment completion. |

### 4.6 Section [F]: Payment Actions (支払アクション)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 43 | `btnConfirmPayment` | Confirm Payment | Button (Primary) | — | — | Enabled if selected request status = `APPROVED` | Disabled if no request or already PAID | Triggers `POST /api/payment-requests/:id/complete-payment` | Requires confirmation modal. |
| 44 | `btnDownloadAllReceipts` | Download All Receipts | Button (Secondary) | — | — | Enabled if attachments exist | Disabled when attachment count = 0 | Triggers batch download of `receipt_files` | Uses `receipt_files` metadata. |
| 45 | `btnBackToList` | Back to List | Button (Secondary) | — | — | Always enabled | — | Returns focus to pending payment queue | |

---

## 5. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 5.1 Search / Filter Behavior
- **Trigger:** User enters a search query, selects branch/date filters, or clears filters.  
- **Processing Logic:** Client validates input, then sends request to `/api/payment-requests/pending-payment` with query params `search`, `branch`, `dateFrom`, `dateTo`.  
- **Exception Handling:** If the backend returns an error, display inline message `Unable to retrieve queue data. Please refresh.`.

### 5.2 Request Selection Behavior
- **Trigger:** User clicks a row or request number in the approved payment queue.  
- **Processing Logic:** Load request details and related `approval_logs`, `receipt_files`, and `payment_breakdown_items`.  
- **Exception Handling:** If request details fail to load, show `Unable to load payment details. Please try again.` and keep the queue active.

### 5.3 Confirm Payment Behavior
- **Trigger:** User clicks `Confirm Payment`.  
- **Processing Logic:** Open confirmation modal. On approval, send `POST /api/payment-requests/:id/complete-payment` with optional comment. On success, update queue and remove request.  
- **Exception Handling:** If the request status is no longer `APPROVED`, refresh queue and display `The request status has changed. Please select an updated request.`. If network error occurs, show `Unable to complete payment. Please try again.`.

### 5.4 Download Receipts Behavior
- **Trigger:** User clicks `Download All Receipts`.  
- **Processing Logic:** Request file package from backend or initiate client-side downloads for each attachment.  
- **Exception Handling:** If no attachments exist, disable the button and show `No attached receipts found.`. If the download fails, show `Unable to download receipt files. Please try again.`.

---

## 6. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

| Error Code | Target Field | Condition | UI Display | Default Message |
| :--- | :--- | :--- | :--- | :--- |
| `ERR-ACC-001` | Queue Load | Backend fetch failure | Inline banner | `Unable to retrieve approved payment requests. Please refresh.` |
| `ERR-ACC-002` | Request Detail | Request detail load failure | Modal / inline alert | `Unable to load payment request details. Please try again.` |
| `ERR-ACC-003` | Confirm Payment | Payment completion failure | Toast / modal | `Unable to complete payment. Please try again.` |
| `ERR-ACC-004` | Receipt Download | Receipt download failure | Toast | `Unable to download receipt files. Please try again.` |
| `ERR-ACC-005` | Stale Request | Status conflict after selection | Modal | `The request status has changed. Please refresh the queue.` |

---

## 7. Dynamic Display Rules (動的表示ルール)

- If the applicant branch is `Mandalay`:  
  - Banner type: Warning (red)  
  - Message: `IMPORTANT: Mandalay branch - please coordinate with Toe San for cash payment.`
- Otherwise:  
  - Banner type: Information (blue)  
  - Message: `Standard bank transfer process.`
- Banner evaluation must run on request selection and on queue refresh.

---

## 8. Integration Requirements (連携要件)

- The pending payment list must query `payment_requests` records where `status_id = 8` (`APPROVED`) and `is_deleted = FALSE`.  
- The detail panel must load related `approval_logs`, `payment_breakdown_items`, and `receipt_files` for the selected request.  
- The accounting completion action must update `payment_requests.status_id = 10` (`PAID`), set `payment_completed_date`, and insert a corresponding `approval_logs` entry.  
- Real-time WebSocket events must refresh the queue when a request transitions into `APPROVED` or when a request is marked `PAID`.  
- All API responses and display text must comply with the development rules in `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md`.
