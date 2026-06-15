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

## 1. Screen Overview (画面概要)

### 1.1 Purpose (目的)
This screen is an integrated dashboard designed for users with the system authority of "Manager (`role_code = 'MANAGER'`)". It allows them to efficiently inspect and review the contents of payment requests submitted by general users, and make operational decisions to either verify ("Verify") or send back/decline ("Reject").

### 1.2 Basic Design Principles (基本設計方針)
- **Split-Pane Layout (2-Column Split Configuration):** The screen places the "Pending Verification Queue List" on the left side and the "Request Detail & Action Panel" for the selected request on the right side. This minimizes screen transitions and enables high-speed verification operations.
- **Real-Time Synchronicity:** Via secure WebSocket communication channels, state changes made by other actors or new request arrivals are immediately reflected on the list without requiring a manual page reload.
- **Optimistic Locking View Visualisation:** To handle cases where processing conflicts with other concurrent managers, a hidden timestamp field tracks the modification date, triggering descriptive alerts and automatic list refreshes.

---

## 2. Screen Layout Image (画面レイアウトイメージ)

```text
+------------------------------------------------------------------------------------------------------------------------+
| [Header]  Payment Request System                                        [User: Manager Name (ID: MGR-1002)] [Logout] |
+------------------------------------------------------------------------------------------------------------------------+
| 【Manager Dashboard】                                                                                                  |
+------------------------------------------------------------+-----------------------------------------------------------+
| ■ Pending Verification List                                | ■ Request Detail & Action Panel                           |
|   [Search: Enter keyword...       ] [Refresh]              |   [Status: MANAGER_REVIEWING]                             |
+-----+------------+---------------+------------+------------+-----------------------------------------------------------+
| ID  | RequestDate| Applicant     | Amount     | Status     | 【Basic Information】                                     |
+-----+------------+---------------+------------+------------+   Request ID: PR-20260612-004   Request Date/Time: 2026-06-12 14:30:22 |
| 004 | 2026-06-12 | Taro Yamada   | ¥15,400    | Reviewing  |   Applicant: Taro Yamada (Department: R&D Dept 1)         |
| 005 | 2026-06-13 | Hanako Sato   | ¥8,900     | Pending    |   Expense Item: Consumables     Expected Payment Date: 2026-06-25      |
| 007 | 2026-06-15 | Ichiro Suzuki | ¥42,000    | Pending    |   Amount: ¥15,400 (Tax Amount: ¥1,400)                    |
|     |            |               |            |            | --------------------------------------------------------- |
|     |            |               |            |            | 【Purpose / Detailed Description】                        |
|     |            |               |            |            |   Purchase cost for project verification terminal         |
|     |            |               |            |            |   (smartphone for testing).                               |
|     |            |               |            |            | --------------------------------------------------------- |
|     |            |               |            |            | 【Receipt Verification】                                  |
|     |            |               |            |            |   [PDF] 20260612_receipt_yamada.pdf  [Preview]            |
|     |            |               |            |            | --------------------------------------------------------- |
|     |            |               |            |            | 【Review Actions】                                        |
|     |            |               |            |            |   Review Comment (Min 10 chars required for Rejection, max 500 chars) |
|     |            |               |            |            |   +---------------------------------------------------+   |
|     |            |               |            |            |   | I have confirmed the contents. No issues found.   |   |
|     |            |               |            |            |   +---------------------------------------------------+   |
|     |            |               |            |            |                                                           |
|     |            |               |            |            |        [ 差し戻し・却下 (Reject) ]     [ 承認・確認 (Verify) ] |
+-----+------------+---------------+------------+------------+-----------------------------------------------------------+
| [Pagination: < 1 2 3 > ]   Display: 10 items/page          | * Selecting an item automatically changes the status to   |
|                                                            |   "Reviewing".                                            |
+------------------------------------------------------------+-----------------------------------------------------------+
## 3. Screen Item Definitions (画面項目定義)

### 3.1 Common Header Area (共通ヘッダー領域)

| No. | Item Name (Logical) | Physical Name (ID/Name) | Type / Attr | View/Input | Default / Choices Definition | Constraints / Validation Rules | Remarks / Business Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| H-01 | System Logo & Title | `lbl_system_title` | Label | View | "支払申請システム" | None | Redirects to dashboard home upon clicking. |
| H-02 | Login User Name | `lbl_user_name` | Label | View | Connected user's `full_name` | None | Format example: "ログイン: 山田 マネージャー" |
| H-03 | User Role | `lbl_user_role` | Label | View | "MANAGER" | None | Displayed in badge format style. |
| H-04 | Logout Button | `btn_logout` | Button | Input | "ログアウト" | None | Destroys current session and JWT, then redirects to the login screen. |

### 3.2 Pending Verification List Area (左カラム：審査待ち申請一覧)

| No. | Item Name (Logical) | Physical Name (ID/Name) | Type / Attr | View/Input | Default / Choices Definition | Constraints / Validation Rules | Remarks / Business Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| L-01 | Search Keyword Entry | `txt_search_keyword` | TextBox | Input | Empty | Max 100 chars, special chars sanitized | Triggers incremental client-side filtering (on applicant name, purpose description, etc.). |
| L-02 | Manual Refresh Button | `btn_refresh_list` | Button | Input | Sync Icon | None | Forces API re-request fallback in case of WebSocket connection dropped states. |
| L-03 | Pending Queue Data Grid | `tbl_pending_queue` | Grid/Table | View | Targeted records list | Max display records: `PENDING_QUEUE_PAGE_SIZE` (10 rows) | Filters data where `manager_user_id` matches current manager and `status_id` is 3 (Submitted) or 4 (Reviewing). |
| L-04 | Grid: Request ID | `col_request_id` | Label | View | `payment_requests.id` | None | Unique string key with prefix format. |
| L-05 | Grid: Submission Date | `col_created_date` | Label | View | `payment_requests.created_date` | YYYY-MM-DD Format | The date the request was submitted. |
| L-06 | Grid: Applicant Name | `col_applicant_name` | Label | View | `users.full_name` | None | Full name of the applicant employee. |
| L-07 | Grid: Total Amount | `col_total_amount` | Label | View | `payment_requests.total_amount` | Currency format (e.g., ¥15,400) | Formatted with commas and currency symbols. |
| L-08 | Grid: Current Status | `col_status_name` | Label | View | Map label from `status_id` | "Submitted to Manager" / "Manager Reviewing" | Color-coded according to state (Submitted = warning color, Reviewing = processing color). |
| L-09 | Pagination Controls | `ctrl_pagination` | Component | Input | 1st Page | Generates based on matching data scope counts | Includes Prev/Next buttons and specific page indices. |

### 3.3 Request Detail & Action Panel Area (右カラム：申請詳細・審査パネル)

This panel is activated or toggled from hidden to visible only when an explicit row is selected in the left list area. In the initial unselected state, a placeholder layout reading "Please select an item from the queue list to review" must be rendered.

| No. | Item Name (Logical) | Physical Name (ID/Name) | Type / Attr | View/Input | Default / Choices Definition | Constraints / Validation Rules | Remarks / Business Rules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R-01 | Detail: Current Status Text | `lbl_detail_status` | Label | View | Selected row's state string | None | Upon row selection, if `status_id = 3`, immediately auto-transitions target to `status_id = 4 (Reviewing)`. |
| R-02 | Detail: Request ID | `lbl_detail_req_id` | Label | View | `payment_requests.id` | None | Read-only. |
| R-03 | Detail: Submission Timestamp | `lbl_detail_created_at` | Label | View | `payment_requests.created_date` | YYYY-MM-DD HH:mm:ss | Read-only. |
| R-04 | Detail: Applicant Name | `lbl_detail_app_name` | Label | View | `users.full_name` | None | Read-only. |
| R-05 | Detail: Applicant Branch/Dept | `lbl_detail_app_dept` | Label | View | `users.branch` / Dept Info | None | Read-only. |
| R-06 | Detail: Payment Item Breakdown | `lbl_detail_item_type` | Label | View | Matching categorization ledger | None | e.g., Entertainment (交際費), Consumables (消耗品費), Travel Expenses (旅費交通費). |
| R-07 | Detail: Desired Payment Deadline | `lbl_detail_due_date` | Label | View | `payment_requests.payment_deadline` | YYYY-MM-DD | Read-only. |
| R-08 | Detail: Total Amount (Tax Incl.) | `lbl_detail_total_amt` | Label | View | `payment_requests.total_amount` | Currency format | Read-only. |
| R-09 | Detail: Internal Consumption Tax | `lbl_detail_tax_amt` | Label | View | `payment_requests.tax_amount` | Currency format | Read-only. |
| R-10 | Detail: Purpose / Description | `txt_detail_purpose` | TextArea | View | `payment_requests.purpose` | Read-only, scrollable view | Multi-line text layout. Newlines must be rendered properly. |
| R-11 | Receipt File Name Link | `lnk_receipt_file` | Link | View/Input | `receipt_attachments.file_name` | Opens in a new tab via Short-lived Signed URL | Security rule forced. Generates a temporary short-lived signed URL to access. |
| R-12 | Receipt Inline Preview Area | `img_receipt_preview` | Previewer | View | Image data or first page of PDF | None | Supports PNG, JPG, and PDF. Displays placeholder icons for unsupported mime-types. |
| R-13 | Review Manager Comment Box | `txt_manager_comment` | TextArea | Input | Empty | Max 500 characters (`VAL-MGR-001`), sanitization executed (`VAL-MGR-003`) | Mandatory field with min length 10 when executing a Reject action (`VAL-MGR-002`). |
| R-14 | Send Back / Reject Button | `btn_action_reject` | Button | Input | "差し戻し・却下 (Reject)" | Triggers validation rule `VAL-MGR-002` | Transitions state to 5 (Rejected by Manager). Appends a log into `approval_logs`. |
| R-15 | Approve / Verify Button | `btn_action_verify` | Button | Input | "承認・確認 (Verify)" | Triggers optimistic locking and cross-validations | Transitions state to 6 (Manager Verified (OK)). Appends a log into `approval_logs`. |
| R-16 | Panel Close Button | `btn_close_panel` | Button | Input | "×" or "閉じる" | None | Clears right-pane data context and unselects active table row. |
| R-17 | Hidden: Last Modified Date | `hdn_modified_date` | Hidden | View | `payment_requests.modified_date` | Timestamp string text | Non-visible hidden element used for Concurrency Checking (Optimistic Locking). |

---

## 4. Item Behaviors & Event Specifications (各項目における挙動・イベント仕様)

### 4.1 Row Click Event (`tbl_pending_queue` Row Click)
- **Trigger:** Clicking any specific row inside the pending queue data grid.
- **Processing Logic:**
  1. Fetch the latest record database fields matching the target row's `payment_requests.id` via backend API.
  2. If the active `status_id` of the record is exactly 3 (Submitted to Manager), dispatch a tracking update call to endpoint `/api/payment-requests/:id/verify` (review-initiation mode) to automatically shift state to 4 (Manager Reviewing).
  3. When state writing succeeds, a trigger records a row update event automatically in `approval_logs`.
  4. Map and render all detailed attributes into the right "Request Detail & Action Panel", making comment fields and buttons fully operational.
  5. Store the fetched latest `modified_date` string value inside the hidden control `hdn_modified_date` for locking calculations.
- **Exception Handling:** If another manager updated or claimed the record state before row click execution, follow rule `ERR-MGR-409` to display an error modal alert and refresh data lists.

### 4.2 Verify Button Click (`btn_action_verify` Click)
- **Trigger:** The manager clicks the verify button after performing request inspections.
- **Processing Logic:**
  1. **Client-Side Pre-Check:** Assure that user entry text lengths inside the comment area do not violate bounds (`VAL-MGR-001`).
  2. **Send backend dispatch payload:** Request API endpoint `/api/payment-requests/:id/verify` providing parameters `action = 'VERIFY'`, `comment = txt_manager_comment.value`, and `modified_date = hdn_modified_date.value`.
  3. **Backend Execution:** Verify concurrency parameters comparing `hdn_modified_date` against database current record timestamp (Optimistic Locking Verification).
  4. Upon verification match, shift request state to 6 (Manager Verified (OK)) and record an immutable entry containing action data in `approval_logs` labeled as "VERIFY".
  5. Dispatch real-time server messages across WebSocket rooms (`statusUpdate` event) directly alerting the specific applicant and final approval stage actors' dashboards.
  6. **Post-Execution UI:** Clear active details inside the right panel, slice out the row item from the left queue list, and push a success toast window confirmation to the viewport.

### 4.3 Reject Button Click (`btn_action_reject` Click)
- **Trigger:** The manager detects receipt defects or incorrect application values and presses the reject action.
- **Processing Logic:**
  1. **Client-Side Correlation Validation:** Evaluate the current character count inside `txt_manager_comment`. If the clean trimmed length is less than 10 characters, halt progression and render a red error string directly below the input text frame stating: "Comment is required and must be at least 10 characters long to reject a request." (`VAL-MGR-002`).
  2. If validations pass cleanly, dispatch a backend payload toward API endpoint `/api/payment-requests/:id/reject-manager`. Execute similar concurrency verification and parsing rules as verification actions.
  3. Rewrite target row status value to 5 (Rejected by Manager), mapping defect notes inside `approval_logs`.
  4. Dispatch instant WebSocket event lines toward the original applicant user workspace context room.
  5. Close out panel details, pop out rows, and display confirmation toasts.

---

## 5. Validation & Error Message Mapping (バリデーション及びエラーメッセージマッピング)

Definitions of validation logic blocks, error scopes, and user experience rendering styles occurring at UI entry coordinates or returned from backend API services.

| Error Code | Target Field | Condition / Evaluation Logic | UI/UX Display Presentation Style | Default Error Message Text |
| :--- | :--- | :--- | :--- | :--- |
| **VAL-MGR-001** | `txt_manager_comment` | Character count exceeds 500 characters bounds (Evaluated on real-time keystrokes or submit event). | Text box boundary borders switch to red outline states, displaying error string text under the panel field. Submit controls become disabled. | "Comment cannot exceed 500 characters." |
| **VAL-MGR-002** | `txt_manager_comment` | `btn_action_reject` is executed while trimmed comment text length evaluates to under 10 characters long. | Applies high-visibility emphasis around the comment entry box, triggering red-text field warnings under the perimeter. | "Comment is required and must be at least 10 characters long to reject a request." |
| **ERR-MGR-401** | Full Viewport / API | Provided user JWT token is absent, expired, or has an invalid signature pattern. | Displays a floating modal alert toast at the top level of the interface viewport, then automatically reroutes views to the login screen. | "Session expired. Please log in again." |
| **ERR-MGR-403** | Full Viewport / Detail Request | Logged user role code does not match `MANAGER`, or requests an out-of-context assigned record `manager_user_id`. | Immediate screen replacement with an explicit "HTTP 403 Forbidden" system page block layout. System info is completely hidden. | "Access Denied. You do not have permission to view this resource." |
| **ERR-MGR-409** | `tbl_pending_queue` / Panel | Database `modified_date` does not match client-side hidden timestamp value `hdn_modified_date` (concurrent write conflict). | Renders a high-importance floating modal block layout. Once the user clicks "OK" or timeout triggers expire, automatically execute left list reloads. | "This request's status has changed since it was loaded. The list will now refresh." |
| **ERR-MGR-500** | Full Viewport | Database connectivity breakdown or unhandled systemic server exception events. | Shows standard center-aligned system notification modal windows. Exposes backend log mapping UUID trace strings, prompting admin contact. | "An unexpected internal error occurred. Please contact the administrator with Error ID: \<UUID\>." |

---

## 6. Special UI Notes & Styling Constraints (特記事項・UI仕様)

- **Responsive Viewport Design Boundaries:** Given the structural density of request rows and inspection steps, layout styles optimize primarily for standard desktop monitor layouts (resolutions from 1280px and wider). When executing under tablet configurations or smartphone resolutions, responsive CSS grid configurations must smoothly stack columns from an explicit 2-pane configuration into single scrollable row panels.
- **Accessibility Execution Rules:** Every actionable control instance (including `Verify`, `Reject`, and `Refresh` buttons) must remain keyboard navigable via standard sequential `Tab` focus tracking and toggle-executable utilizing `Enter` or `Space` key actions.
- **Security Provision (Sanitization Indicator):** If specific raw HTML characters or unsafe patterns (e.g., `<script>`) populate inside `txt_manager_comment`, the front-end rendering engine must not block input flows entirely, but must escape sequences cleanly (`&lt;script&gt;`) before database storage or layout reflection to block Cross-Site Scripting (XSS) risks.