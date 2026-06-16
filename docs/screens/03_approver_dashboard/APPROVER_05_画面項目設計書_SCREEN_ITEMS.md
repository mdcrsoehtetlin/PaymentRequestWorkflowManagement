# Screen Items Specification (画面項目設計書) — Final Approver Dashboard

**Document ID:** PRWM-SIS-SCR-006  
**Target Screen:** Final Approver Dashboard (最終承認者ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Approver  
**Function ID:** FN-006  
**Version:** 1.0  
**Created:** 2026-06-16  
**Last Updated:** 2026-06-16  
**Author:** Senior System Engineer  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## 1. Document Control (ドキュメント管理)

### 1.1 Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-16 | Senior System Engineer | Initial release for Final Approver dashboard specification. |

### 1.2 Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` | Final Approver workflow, statuses, and role permissions. |
| 2 | PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` | Status lookup tables, field mappings, and audit log structure. |
| 3 | PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` | Coding standards, access control, and UI design constraints. |
| 4 | PRWM-FSD-APPROVER | Functional Specification — Approver | `docs/screens/03_approver_dashboard/APPROVER_04_機能設計書_FUNCTIONAL_SPEC.md` | Approver-specific use cases, validation, and queue behavior. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose (目的)
The Final Approver Dashboard provides a centralized workspace for approvers to monitor, search, and act on payment requests that have been verified by managers and are awaiting final approval. It enables rapid queue triage, request filtering, and direct navigation to request review details while preserving workflow integrity.

### 2.2 Target Users & Roles (対象ユーザーと権限)

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `APPROVER` role (`role_code = 'APPROVER'`) |
| **Required Authentication** | JWT Bearer Token (RS256, validated per request) |
| **Data Scope** | Requests assigned to the current Final Approver with statuses `SUBMITTED_APPROVER` and `APPROVER_REVIEWING` |
| **Access Control** | `JwtAuthGuard` → `RolesGuard(APPROVER)` → `OwnershipGuard(final_approver_user_id)` → `WorkflowStatusGuard([SUBMITTED_APPROVER, APPROVER_REVIEWING])` |

### 2.3 Core Functions & Basic Design Principles (主要機能・基本設計方針)
1. **Queue monitoring** — Display pending approver requests with status and submission date.
2. **Search and filter** — Enable efficient selection by request number, applicant, branch, or purpose.
3. **Action navigation** — Provide direct links to request detail/review screens and preserve workflow state transitions.

---

## 3. Screen Layout (画面レイアウト構成)

### 3.1 Overall Page Structure (全体画面構成)

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                       │
├──────────┬──────────────────────────────────────────────────────────────────────────┤
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [A] PAGE HEADER                                                    │  │
│          │  │   - Final Approver Dashboard (h1)                                  │  │
│          │  │   - Approver badge   |   Notification Bell                         │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
│  [NAV]   │                                                                          │
│ Sidebar  │  ┌──────────┬──────────┬──────────┐                                      │
│  (w-64)  │  │[B] KPI   │[B] KPI   │[B] KPI   │     ← Summary Cards                  │
│ - Logo   │  │ Total    │ Pending  │ Reviewing│                                      │
│ - Menu   │  └──────────┴──────────┴──────────┘                                      │
│ - User   │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [C] FILTER / SEARCH BAR (content area; below header)               │  │
│          │  │   [Search Input]  [Status Filter]  [Branch]  [Date Range]          │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [D] REQUEST QUEUE DATA GRID                                        │  │
│          │  │  ┌────────────────────────────────────────────────────────────────┐│  │
│          │  │  │ Request# │ Applicant │ Branch │ Status │ Amount │ Submitted    ││  │
│          │  │  │ (rows...)                                                      ││  │
│          │  │  └────────────────────────────────────────────────────────────────┘│  │
│          │  │  [E] PAGINATION / PAGE CONTROLS                                    │  │
│          │  │  [F] DETAILS PANEL (right-hand slide-over on desktop)              │  │
│          │  └────────────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Layout Composition and Hierarchy

- **Page Header**: top header with page title, approver badge, notification access, and global action controls.
- **Top Filter Bar**: centralised filter bar located within the content area directly under the header. Contains `Status`, `Branch`, `Date Range`, and `Search` controls. On desktop the bar appears inline; on mobile it collapses into a compact stacked control or an expandable panel. Follow `9.4.1` spacing and the card/container conventions in `9.5.1`.
- **Summary Cards**: displayed in the persistent left sidebar (`[B]`, `w-64`) to surface queue metrics (Total, Pending, Reviewing, Overdue). Use compact `card` components per UI rules (`p-4`, `rounded-xl`, `shadow-sm`).
- **Request Queue Data Grid**: primary work area with the table spec defined in `9.5.2` (responsive, accessible, numeric right-aligned, hover state). Rows are clickable to open the details panel.
- **Pagination**: keyboard-accessible controls under the grid; support `10 / 20 / 50` page sizes.
- **Details Panel**: on desktop show as a right-hand pane (slide-over) per component spec; on mobile navigate to a full-screen detail view.

### 3.3 Responsive Layout Breakpoints (レスポンシブ対応)

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | Single-column stacked layout; sidebar hidden behind hamburger (drawer); top filter bar collapses to an expandable panel; content stacks vertically; detail view becomes full-screen or accordion. |
| Tablet (`md:`) | 768px | Sidebar collapsible (drawer) or narrow; content shows top filter bar and queue; details panel appears below or as slide-over. |
| Desktop (`lg:`) | 1024px | Full dashboard layout with persistent left sidebar (`w-64`) showing summary KPI cards, content area with top filter bar, queue grid, pagination, and right-hand details slide-over. |
| Wide (`xl:`) | 1280px | Expanded queue columns and stable multi-pane view. |

### 3.4 Visual Focus and UX Flow

- Begin with the **filter/search bar** to scope the request queue immediately.
- Keep **summary cards** visible to surface workload at a glance.
- Use **status badges** to make urgent approvals clear.
- Keep **queue rows** actionable so approvers can move directly into review from the list.
- On desktop, maintain a **persistent details panel** so approvers can review and act without losing queue context.

---
## 4. Item Definitions (画面項目定義)

### 4.1 Section [A]: Page Header (ページヘッダー)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `pageTitle` | Screen Title | Label | — | Yes | "Final Approver Dashboard" | — | — | Visible on all viewports. |
| 2 | `userBadge` | Approver Badge | Badge | — | Yes | Approver name and role | — | `users.full_name`, `user_roles.role_name` | Confirms current approver identity. |
| 3 | `notificationButton` | Notification Bell | Button/Icon | — | No | Visible if notifications exist | — | Shared notification service | Alerts pending workflow updates. |

### 4.2 Section [B]: Filter Panel (フィルターパネル)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 4 | `statusFilter` | Status Filter | Select | — | Yes | `Submitted to Approver` | Options: `Submitted to Approver`, `Approver Reviewing` | `payment_statuses.status_code` | Filters queue by approver workflow status. |
| 5 | `branchFilter` | Branch Filter | Select | — | No | `All Branches` | Options based on active branch values | `users.branch` | Filter by applicant branch. |
| 6 | `searchField` | Search Input | Text Input | String(100) | No | Empty | Alphanumeric, hyphen | `payment_requests.request_number`, `users.full_name`, `payment_requests.purpose` | Applies to request number, applicant, purpose. |
| 7 | `dateRange` | Submission Date Range | Date Range Picker | — | No | Last 30 days | Valid date range | `payment_requests.submitted_to_approver_date` | Optional timeframe filter. |

### 4.3 Section [C]: Queue Panel (キューパネル)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 8 | `queueTable` | Request Queue | Data Grid | — | Yes | Filtered list of approver requests | Sort by `submitted_to_approver_date` desc | `payment_requests` | Click row to navigate to review screen. |
| 9 | `queueRowNumber` | Request Number | Label | String(50) | Yes | `PRF-YYYY-NNN` | Regex validation | `payment_requests.request_number` | Unique identifier. |
| 10 | `queueRowApplicant` | Applicant Name | Label | VARCHAR(200) | Yes | — | — | `users.full_name` | Applicant display. |
| 11 | `queueRowBranch` | Branch | Label | VARCHAR(100) | Yes | — | — | `users.branch` | Applicant branch. |
| 12 | `queueRowStatus` | Current Status | Badge | — | Yes | `Submitted to Approver` / `Approver Reviewing` | — | `payment_statuses.status_name` | Color-coded. |
| 13 | `queueRowAmount` | Total Amount | Label | NUMERIC(12,2) | Yes | 0.00 | > 0 | `payment_requests.total_amount` | Total payment amount. |
| 14 | `queueRowSubmittedDate` | Submitted Date | Label | TIMESTAMPTZ | Yes | — | UTC | `payment_requests.submitted_to_approver_date` | Sort and timeline context. |
| 15 | `queueRowAction` | Review Action | Button/Link | — | Yes | "Review" | — | Navigates to approver review screen | Opens detailed request review. |
| 16 | `queueRowDueIndicator` | Overdue Indicator | Icon/Label | — | No | Visible if overdue | — | computed from desired_payment_date | Highlights urgent requests. |

### 4.4 Section [B]: Status Summary Cards (ステータス概要カード)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 17 | `pendingCountCard` | Pending Requests | Summary Card | Integer | Yes | Count | — | `payment_requests.status_id = SUBMITTED_APPROVER` | Shows requests awaiting review. |
| 18 | `reviewingCountCard` | Reviewing Requests | Summary Card | Integer | Yes | Count | — | `payment_requests.status_id = APPROVER_REVIEWING` | Shows currently opened review items. |
| 19 | `overdueCountCard` | Overdue Requests | Summary Card | Integer | Yes | Count | — | computed from desired_payment_date | Draws attention to urgent cases. |
| 20 | `recentActivityCard` | Recent Activity | Summary Card | — | No | Latest actions | — | `approval_logs` | Shows latest approvals/rejections. |

---

## 5. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 5.1 Filter Panel Change (`statusFilter`, `branchFilter`, `searchField`, `dateRange`)
- **Trigger:** User adjusts a filter or search criteria.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Validate filter values.
  2. **Backend Dispatch:** Query `GET /api/v1/approver/requests` with filter parameters.
  3. **Backend Execution:** Backend applies filters against `payment_requests`, joined with `users` and `payment_statuses`.
  4. **Post-Execution UI:** Refresh queue table and summary cards.
- **Exception Handling:** Display `ERR-APR-500` banner on server failure.

### 5.2 Queue Row Click (`queueRowAction`)
- **Trigger:** User clicks "Review" on a queue row.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Ensure request still belongs to the current approver.
  2. **Backend Dispatch:** Navigate to detailed review page, optionally starting review if status is `SUBMITTED_APPROVER`.
  3. **Backend Execution:** If needed, backend transitions request to `APPROVER_REVIEWING` and logs `APPR_REVIEW_START`.
  4. **Post-Execution UI:** Open the Final Approver Review screen for the selected request.
- **Exception Handling:** If request has advanced or changed, show `ERR-APR-409` and refresh queue.

### 5.3 Status Card Refresh
- **Trigger:** Page load or filter change.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** No special input.
  2. **Backend Dispatch:** Query request counts grouped by status and overdue condition.
  3. **Backend Execution:** Aggregate counts from `payment_requests`.
  4. **Post-Execution UI:** Update summary cards.
- **Exception Handling:** If count fetch fails, show card-level placeholder and allow retry.

### 5.4 Pagination / Infinite Scroll
- **Trigger:** User navigates to next page or scrolls.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Validate page index.
  2. **Backend Dispatch:** Fetch next request batch with pagination parameters.
  3. **Backend Execution:** Return paged `payment_requests` results.
  4. **Post-Execution UI:** Append or replace queue rows.
- **Exception Handling:** Display `ERR-APR-500` for paging errors.

---

## 6. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

| Error Code | Target Field | Condition / Evaluation Logic | UI/UX Display Presentation Style | Default Error Message Text |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-APR-002** | `searchField` | Search input exceeds max length or invalid characters. | Inline error below input. | "Search text must be less than 100 characters." |
| **VAL-APR-003** | `dateRange` | End date before start date. | Inline error on date picker. | "Please select a valid date range." |
| **ERR-APR-401** | Full Viewport / API | JWT missing, expired, or invalid. | Floating modal; redirect to login. | "Session expired. Please log in again." |
| **ERR-APR-403** | Full Viewport / API | Unauthorized access or wrong role. | Full page error or toast alert. | "Access Denied. You do not have permission to view this resource." |
| **ERR-APR-409** | `queueTable` / `queueRowAction` | Optimistic lock conflict or request state changed. | Modal with refresh option. | "This record has been modified by another user. The data will now refresh." |
| **ERR-APR-500** | Full Viewport / API | Server error or data fetch failure. | Error banner with retry. | "An unexpected error occurred. Please contact support with ID: <UUID>." |

---

## 7. Special UI Notes & Styling Constraints (特記事項・UI仕様)

- **Responsive Viewport Design Boundaries:** Primary design is desktop-first for approver workflows. Mobile view collapses filters and queue rows into stacked cards for readability.
- **Accessibility Execution Rules:** All interactive elements must support keyboard navigation and ARIA labels. Buttons and links must be operable via `Enter` or `Space`.
- **Performance & Loading States:** Use skeleton loaders while queue data loads. Disable filter controls during fetches to prevent duplicate requests.
- **Security Provision (Sanitization Indicator):** Sanitize all displayed text values from database fields, especially `payment_requests.purpose` and `users.full_name`, to prevent XSS.
- **Design System Rules:** Follow color schemes, typography, and spacing from `02_開発ルール_DEVELOPMENT_RULES.md`. Use consistent badge colors and summary card styling.
