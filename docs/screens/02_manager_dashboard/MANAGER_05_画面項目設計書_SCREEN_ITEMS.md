# Screen Items Specification (画面項目設計書) — Manager Dashboard

**Document ID:** PRWM-SIS-SCR-002  
**Target Screen:** Manager Dashboard (担当マネージャーダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Manager Verification Operations  
**Function ID:** FN-002  
**Version:** 1.0  
**Created:** 2026-06-15  
**Last Updated:** 2026-06-15  
**Author:** Lead UI/UX Architect  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## 1. Document Control (ドキュメント管理)

### 1.1 Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-15 | Lead UI/UX Architect | Initial release aligned with system requirements. |

### 1.2 Related Documents

| No. | Document ID | Document Name | File Path | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `03_データベース設計書_DATABASE_SPEC.md` | Table structures, constraints, and data types. |
| 3 | PRWM-DEV-001 | Development Rules | `02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |
| 4 | PRWM-FSD-[XXX] | Functional Specification — Manager Ops | `MGR_04_機能設計書_FUNCTIONAL_SPEC.md` | Use cases, state transitions, validation rules. |

---

## 2. Screen Overview & Purpose (画面概要・目的)

### 2.1 Purpose (目的)
This screen is an integrated dashboard designed for users with the system authority of "Manager". It allows them to efficiently inspect and review the contents of payment requests submitted by general users, and make operational decisions to either verify ("Verify") or send back/decline ("Reject") within the Payment Request Lifecycle module.

### 2.2 Target Users & Roles (対象ユーザーと権限)

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `MANAGER` role (`role_code = 'MANAGER'`) |
| **Required Authentication** | JWT Bearer Token (RS256, validated per request) |
| **Data Scope** | Filters data dynamically where `manager_user_id` matches current manager and `status_id` is 3 (Submitted) or 4 (Reviewing). |
| **Access Control** | `JwtAuthGuard` → `RolesGuard` → `OwnershipGuard` (sequential execution) |

### 2.3 Core Functions & Basic Design Principles (主要機能・基本設計方針)
1. **Split-Pane Layout (2-Column Split Configuration)** — The screen places the "Pending Verification Queue List" on the left side and the "Request Detail & Action Panel" for the selected request on the right side. This minimizes screen transitions and enables high-speed verification operations.
2. **Real-Time Synchronicity** — Via secure WebSocket communication channels, state changes made by other actors or new request arrivals are immediately reflected on the list without requiring a manual page reload.
3. **Optimistic Locking View Visualisation** — To handle cases where processing conflicts with other concurrent managers, a hidden timestamp field tracks the modification date, triggering descriptive alerts and automatic list refreshes.

---

## 3. Screen Layout (画面レイアウト構成)

### 3.1 Overall Page Structure (全体画面構成)

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER VIEWPORT                                        │
├──────────┬──────────────────────────────────────────────────────────────────────────┤
│          │  ┌────────────────────────────────────────────────────────────────────┐  │
│          │  │ [A] COMMON HEADER AREA                                             │  │
│          │  │   System Logo & Title: "支払申請システム"                           │  │
│          │  │   User Badge: Manager Name  |  Role Badges   |  Logout Button      │  │
│  [NAV]   │  └────────────────────────────────────────────────────────────────────┘  │
│          │                                                                          │
│ Sidebar  │  ┌───────────────────────────────┐┌──────────────────────────────────────┐  │
│ (w-64)   │  │ [B] PENDING VERIFICATION LIST ││ [C] REQUEST DETAIL & ACTION PANEL    │  │
│          │  │     - Keyword Filter Search   ││     - Selected Record Status         │  │
│ - Logo   │  │     - Data Grid (10 rows max) ││     - Basic Applicant Info Fields    │  │
│ - Menu   │  │     - Pagination Controls     ││     - Receipt Attachment Preview Area│  │
│ - User   │  │                               ││     - Comment Field & Action Buttons │  │
│          │  └───────────────────────────────┘└──────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Layout Breakpoints (レスポンシブ対応)

| Breakpoint | Min Width | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (default) | 0px | Single column stacked layout, hidden sidebar via mobile hamburger drawer, panels stack gracefully into scrollable rows. |
| Tablet (`md:`) | 768px | Single column configuration with collapsible split panes, grid elements adjusted for tighter viewport visibility. |
| Desktop (`lg:`) | 1024px | Layout optimized for high-density 1280px+ desktop monitor views. Full split 2-pane fixed layout with desktop sidebar (`w-64`). |

---

## 4. Item Definitions (画面項目定義)

### 4.1 Section [A]: Common Header Area (共通ヘッダー領域)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `lbl_system_title` | System Logo & Title | Label | String | — | "支払申請システム" | — | — | Redirects to dashboard home upon clicking. |
| 2 | `lbl_user_name` | Login User Name | Label | String | — | Connected user's `full_name` | Format: "ログイン: 山田 マネージャー" | `users.full_name` | — |
| 3 | `lbl_user_role` | User Role | Label | String | — | "MANAGER" | Badge formatting style | `users.role_code` | — |
| 4 | `btn_logout` | Logout Button | Button | — | — | Enabled / Visible | "ログアウト" | — | Destroys current session and JWT, then redirects to the login screen. |

### 4.2 Section [B]: Pending Verification List Area (左カラム：審査待ち申請一覧)

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 5 | `txt_search_keyword` | Search Keyword Entry | TextBox | String(100) | Optional | Empty | Special characters sanitized | — | Triggers incremental client-side filtering on applicant name, description, etc. |
| 6 | `btn_refresh_list` | Manual Refresh Button | Button | — | — | Enabled / Sync Icon | — | — | Forces API re-request fallback if WebSocket dropped. |
| 7 | `tbl_pending_queue` | Pending Queue Data Grid | Grid/Table | Object | — | Targeted records list | Max display records: `PENDING_QUEUE_PAGE_SIZE` (10 rows) | — | Data scoped by manager context. Triggers Row Click Event. |
| 8 | `col_request_id` | Grid: Request ID | Label | String | — | `payment_requests.id` | Unique string with prefix format | `payment_requests.id` | — |
| 9 | `col_created_date` | Grid: Submission Date | Label | DATE | — | `payment_requests.created_date` | YYYY-MM-DD Format | `payment_requests.created_date` | The date the request was submitted. |
| 10 | `col_applicant_name` | Grid: Applicant Name | Label | String | — | `users.full_name` | — | `users.full_name` | Full name of applicant employee. |
| 11 | `col_total_amount` | Grid: Total Amount | Label | NUMERIC | — | `payment_requests.total_amount` | Currency format (e.g., ¥15,400) | `payment_requests.total_amount` | Formatted with commas and currency symbols. |
| 12 | `col_status_name` | Grid: Current Status | Label | String | — | Map label from `status_id` | "Submitted to Manager" / "Manager Reviewing" | `payment_requests.status_id` | Color-coded according to state (Warning / Processing). |
| 13 | `ctrl_pagination` | Pagination Controls | Component | — | — | 1st Page | Based on matching scope counts | — | Includes Prev/Next buttons and indices. |

### 4.3 Section [C]: Request Detail & Action Panel Area (右カラム：申請詳細・審査パネル)

*(Note: Activated only when an explicit row is selected in the data grid. Otherwise, a placeholder layout is displayed).*

| No. | Item ID | Item Name (Logical) | Component Type | Data Type & Max Length | Required | Initial State / Default Value | Input Constraints / Formats | Data Source / DB Mapping | Remarks / Business Rules |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| 14 | `lbl_detail_status` | Detail: Current Status Text | Label | String | — | Selected row's state string | — | `payment_requests.status_id` | Auto-transitions to state `4 (Reviewing)` upon select if current state is `3`. |
| 15 | `lbl_detail_req_id` | Detail: Request ID | Label | String | — | `payment_requests.id` | Read-only | `payment_requests.id` | — |
| 16 | `lbl_detail_created_at` | Detail: Submission Timestamp | Label | DATE | — | `payment_requests.created_date` | YYYY-MM-DD HH:mm:ss | `payment_requests.created_date` | Read-only. |
| 17 | `lbl_detail_app_name` | Detail: Applicant Name | Label | String | — | `users.full_name` | Read-only | `users.full_name` | — |
| 18 | `lbl_detail_app_dept` | Detail: Applicant Branch/Dept | Label | String | — | `users.branch` / Dept Info | Read-only | `users.branch` | — |
| 19 | `lbl_detail_item_type` | Detail: Payment Item Breakdown | Label | String | — | Ledger categorization | Read-only | — | e.g., Entertainment (交際費), Consumables (消耗品費). |
| 20 | `lbl_detail_due_date` | Detail: Desired Payment Deadline | Label | DATE | — | `payment_requests.payment_deadline` | YYYY-MM-DD (Read-only) | `payment_requests.payment_deadline` | — |
| 21 | `lbl_detail_total_amt` | Detail: Total Amount (Tax Incl.) | Label | NUMERIC | — | `payment_requests.total_amount` | Currency formatted (Read-only) | `payment_requests.total_amount` | — |
| 22 | `lbl_detail_tax_amt` | Detail: Internal Consumption Tax | Label | NUMERIC | — | `payment_requests.tax_amount` | Currency formatted (Read-only) | `payment_requests.tax_amount` | — |
| 23 | `txt_detail_purpose` | Detail: Purpose / Description | TextArea | String | — | `payment_requests.purpose` | Read-only, multi-line view | `payment_requests.purpose` | Newlines must be rendered properly. |
| 24 | `lnk_receipt_file` | Receipt File Name Link | Link | String | — | `receipt_attachments.file_name` | Opens in a new tab | `receipt_attachments.file_name` | Uses short-lived signed URLs for security. |
| 25 | `img_receipt_preview` | Receipt Inline Preview Area | Previewer | — | — | Thumbnail / First page PDF | PNG, JPG, PDF supported | — | Placeholder rendered if unsupported mime-type. |
| 26 | `txt_manager_comment` | Review Manager Comment Box | TextArea | String(500) | Conditional | Empty | Max 500 characters (`VAL-MGR-001`), sanitized | — | Min length 10 characters required when Rejecting (`VAL-MGR-002`). |
| 27 | `btn_action_reject` | Send Back / Reject Button | Button | — | — | Enabled / Visible | Triggers `VAL-MGR-002` | — | Transitions state to 5. Appends log to `approval_logs`. |
| 28 | `btn_action_verify` | Approve / Verify Button | Button | — | — | Enabled / Visible | Triggers Optimistic Lock rules | — | Transitions state to 6. Appends log to `approval_logs`. |
| 29 | `btn_close_panel` | Panel Close Button | Button | — | — | Enabled / "閉じる" | — | — | Clears panel context and unselects active row. |
| 30 | `hdn_modified_date` | Hidden: Last Modified Date | Hidden | String | — | `payment_requests.modified_date` | Timestamp string text | `payment_requests.modified_date` | Used for Concurrency Checking (Optimistic Locking). |

---

## 5. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 5.1 Row Click Event (`tbl_pending_queue` Row Click)
- **Trigger:** Clicking any specific row inside the pending queue data grid.
- **Processing Logic:**
  1. Fetch the latest record database fields matching the target row's `payment_requests.id` via backend API.
  2. If the active `status_id` of the record is exactly 3 (Submitted to Manager), dispatch a tracking update call to endpoint `/api/payment-requests/:id/verify` (review-initiation mode) to automatically shift state to 4 (Manager Reviewing).
  3. When state writing succeeds, a trigger records a row update event automatically in `approval_logs`.
  4. Map and render all detailed attributes into the right "Request Detail & Action Panel", making comment fields and buttons fully operational.
  5. Store the fetched latest `modified_date` string value inside the hidden control `hdn_modified_date` for locking calculations.
- **Exception Handling:** If another manager updated or claimed the record state before row click execution, follow rule `ERR-MGR-409` to display an error modal alert and refresh data lists.

### 5.2 Verify Button Click (`btn_action_verify` Click)
- **Trigger:** The manager clicks the verify button after performing request inspections.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Assure that user entry text lengths inside the comment area do not violate bounds (`VAL-MGR-001`).
  2. **Backend Dispatch:** Send backend dispatch payload toward API endpoint `/api/payment-requests/:id/verify` providing parameters `action = 'VERIFY'`, `comment = txt_manager_comment.value`, and `modified_date = hdn_modified_date.value`.
  3. **Backend Execution:** Verify concurrency parameters comparing `hdn_modified_date` against database current record timestamp (Optimistic Locking Verification). Upon verification match, shift request state to 6 (Manager Verified (OK)) and record an immutable entry containing action data in `approval_logs` labeled as "VERIFY".
  4. **Post-Execution UI:** Dispatch real-time server messages across WebSocket rooms (`statusUpdate` event) directly alerting the specific applicant and final approval stage actors' dashboards. Clear active details inside the right panel, slice out the row item from the left queue list, and push a success toast window confirmation to the viewport.

### 5.3 Reject Button Click (`btn_action_reject` Click)
- **Trigger:** The manager detects receipt defects or incorrect application values and presses the reject action.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Evaluate the current character count inside `txt_manager_comment`. If the clean trimmed length is less than 10 characters, halt progression and render a red error string directly below the input text frame (`VAL-MGR-002`).
  2. **Backend Dispatch:** If validations pass cleanly, dispatch a backend payload toward API endpoint `/api/payment-requests/:id/reject-manager`. Execute similar concurrency verification and parsing rules as verification actions.
  3. **Backend Execution:** Rewrite target row status value to 5 (Rejected by Manager), mapping defect notes inside `approval_logs`.
  4. **Post-Execution UI:** Dispatch instant WebSocket event lines toward the original applicant user workspace context room. Close out panel details, pop out rows, and display confirmation toasts.

---

## 6. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

| Error Code | Target Field | Condition / Evaluation Logic | UI/UX Display Presentation Style | Default Error Message Text |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-MGR-001** | `txt_manager_comment` | Character count exceeds 500 characters bounds (Evaluated on real-time keystrokes or submit event). | Text box boundary borders switch to red outline states, displaying error string text under the panel field. Submit controls become disabled. | "Comment cannot exceed 500 characters." |
| **VAL-MGR-002** | `txt_manager_comment` | `btn_action_reject` is executed while trimmed comment text length evaluates to under 10 characters long. | Applies high-visibility emphasis around the comment entry box, triggering red-text field warnings under the perimeter. | "Comment is required and must be at least 10 characters long to reject a request." |
| **ERR-MGR-401** | Full Viewport / API | Provided user JWT token is absent, expired, or has an invalid signature pattern. | Displays a floating modal alert toast at the top level of the interface viewport, then automatically reroutes views to the login screen. | "Session expired. Please log in again." |
| **ERR-MGR-403** | Full Viewport / Detail Request | Logged user role code does not match `MANAGER`, or requests an out-of-context assigned record `manager_user_id`. | Immediate screen replacement with an explicit "HTTP 403 Forbidden" system page block layout. System info is completely hidden. | "Access Denied. You do not have permission to view this resource." |
| **ERR-MGR-409** | `tbl_pending_queue` / Panel | Database `modified_date` does not match client-side hidden timestamp value `hdn_modified_date` (concurrent write conflict). | Renders a high-importance floating modal block layout. Once the user clicks "OK" or timeout triggers expire, automatically execute left list reloads. | "This request's status has changed since it was loaded. The list will now refresh." |
| **ERR-MGR-500** | Full Viewport / API | Database connectivity breakdown or unhandled systemic server exception events. | Shows standard center-aligned system notification modal windows. Exposes backend log mapping UUID trace strings, prompting admin contact. | "An unexpected internal error occurred. Please contact the administrator with Error ID: \<UUID\>." |

---

## 7. Special UI Notes & Styling Constraints (特記事項・UI仕様)

- **Responsive Viewport Design Boundaries:** Given the structural density of request rows and inspection steps, layout styles optimize primarily for standard desktop monitor layouts (resolutions from 1280px and wider). When executing under tablet configurations or smartphone resolutions, responsive CSS grid configurations must smoothly stack columns from an explicit 2-pane configuration into single scrollable row panels.
- **Accessibility Execution Rules:** Every actionable control instance (including `Verify`, `Reject`, and `Refresh` buttons) must remain keyboard navigable via standard sequential `Tab` focus tracking and toggle-executable utilizing `Enter` or `Space` key actions.
- **Performance & Loading States:** Actions buttons must exhibit responsive visual spinning states and pass immediately into `disabled` mode during active async execution queues to explicitly control duplicate processing hazards.
- **Security Provision (Sanitization Indicator):** If specific raw HTML characters or unsafe patterns (e.g., `<script>`) populate inside `txt_manager_comment`, the front-end rendering engine must not block input flows entirely, but must escape sequences cleanly (`&lt;script&gt;`) before database storage or layout reflection to block Cross-Site Scripting (XSS) risks.
- **Design System Rules:** Adhere strictly to UI consistency controls, component metrics, micro-animations, and error visualization design specifications detailed within `02_開発ルール_DEVELOPMENT_RULES.md`.