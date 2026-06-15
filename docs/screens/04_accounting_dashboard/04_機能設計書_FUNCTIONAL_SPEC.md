# Functional Specification (機能設計書) — Accounting Dashboard

**Document ID:** PRWM-FSD-SCR-004  
**Target Screen:** Accounting Dashboard (経理ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Accounting Operations  
**Function ID:** FN-004  
**Version:** 2.0  
**Created:** 2026-06-12  
**Last Updated:** 2026-06-15  
**Author:** Senior Principal Architect  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-12 | Systems Analyst | Initial release. Functional design specification for the Accounting Dashboard. |
| 2.0 | 2026-06-15 | Senior Principal Architect | Converted file structure and design to fully conform to the standard `FUNCTIONAL_SPECIFICATION_TEMPLATE.md`, integrating detailed specifications from Requirement, Database, and Development Rules documents. |

---

## Table of Contents

1. [Functional Overview](#1-functional-overview)
2. [Use Cases and Business Workflow](#2-use-cases-and-business-workflow)
3. [State Transition Specification](#3-state-transition-specification)
4. [Business Rules](#4-business-rules)
5. [Screen Specifications](#5-screen-specifications)
6. [Functional Operation Specification](#6-functional-operation-specification)
7. [Input / Output Specification](#7-input--output-specification)
8. [Input Validation Rules](#8-input-validation-rules)
9. [Error Handling Specification](#9-error-handling-specification)
10. [Permission and Access Control](#10-permission-and-access-control)
11. [Real-Time Notification Behavior](#11-real-time-notification-behavior)
12. [Screen Transition Specification](#12-screen-transition-specification)
13. [Non-Functional Considerations](#13-non-functional-considerations)
14. [Configurable Items (External Definitions)](#14-configurable-items-external-definitions)
15. [Cross-Reference Traceability Matrix](#15-cross-reference-traceability-matrix)

---

## 1. Functional Overview

### 1.1 Purpose and Scope

This screen serves as the primary operational portal for users assigned the `ACCOUNTING` role within the Payment Request Workflow Management System. The Accounting Dashboard provides the accounting team with a secure and centralized user interface to view, search, review, and process all payment requests that have received final approval (status `APPROVED` (8)). 

This function sits at the final operational stage of the payment request lifecycle. It is the entry point for payment settlement verification, including checking digital/physical receipts, evaluating branch-specific routing rules, inputting payment notes/comments, and marking requests as "Paid (Completed)". Transitioning a request to this state terminates the request lifecycle.

### 1.2 Functional Responsibilities

This screen is responsible for the following core functional areas:

1. **Approved Request Queue List Display** — Presenting a consolidated, real-time list of all payment requests in the `APPROVED` (8) state awaiting payment processing.
2. **Detailed Request Auditing** — Enabling accountants to inspect request headers, applicant profiles, bank details, breakdown items, digital receipt attachments, and the complete approval history timeline within a detail modal.
3. **Dynamic Branch Alert Routing** — Evaluating the applicant's corporate branch attribute dynamically to render warning messages if specific routing logic applies (e.g., Mandalay branch cash payment alert `ALR-01` vs. Standard bank transfer alert `ALR-02`).
4. **Payment Completion Processing** — Performing database updates within an atomic transaction to mark the request as `PAID` (10), record the completion date, log the action in `approval_logs`, invalidate the Redis cache, and notify the applicant.
5. **Real-time Queue Synchronization** — Integrating WebSocket updates to automatically append newly approved requests to the dashboard list and remove processed requests in real-time.

### 1.3 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `ACCOUNTING` role (`role_code = 'ACCOUNTING'`) |
| **Required Authentication** | JWT Bearer Token (validated per request) |
| **Data Scope** | All active (non-deleted) payment requests with `status_id = 8 (APPROVED)` assigned to the Accounting queue. |

### 1.4 Relationships with Other Functions and Peripheral Systems

The dashboard interacts with user roles, status triggers, the physical file server, and audit logs as described below:

```text
┌──────────────────────┐      ┌─────────────────────────────────┐
│    Final Approver    │      │      Payment Requests DB        │
│   (Approve Action)   ├─────►│  Sets status to APPROVED (8)    │
└──────────────────────┘      └──────────────┬──────────────────┘
                                             │ Query
                                             ▼
                                  ┌────────────────────┐
                                  │Accounting Dashboard│
                                  └──────────┬─────────┘
                                             │ Update status
                                             ▼
┌──────────────────────┐      ┌─────────────────────────────────┐
│    Applicant User    │      │      Payment Requests DB        │
│ Dashboard Notification│◄────┤  Sets status to PAID (10)       │
└──────────────────────┘      └─────────────────────────────────┘
```

* **Upstream Triggers**: The `APPROVED` status is set by the Final Approver action. Once approved, the request is automatically routed to this function's work queue.
* **Downstream Events**: Transitioning a request to `PAID` locks the request from future alterations, notifies the applicant via WebSockets, and writes a permanent log in the audit trail.
* **External Storage**: The function queries physical receipts stored on the server's local file abstraction layer to render links in the detail window.

### 1.5 Inputs / Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `payment_requests` | Database Table | Primary transaction record where status_id = 8 (`APPROVED`) and is_deleted = false. |
| `users` | Database Table | User profiles for applicant (checks branch name), manager, and approver. |
| `payment_breakdown_items` | Database Table | Detailed items contributing to the total payment amount. |
| `receipt_files` | Database Table | Storage metadata paths associated with the payment request. |
| `approval_logs` | Database Table | Prior verification logs and comments. |
| Filters & Search Parameters | User Input UI | Dropdown selections and keyword text. |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `payment_requests` | Database Table | Status updated to `PAID` (status_id = 10) and `payment_completed_date` set. |
| Created `approval_logs` | Database Table | New row inserted with Action Code `PAYMENT_COMPLETED` (10), transition details, and comment. |
| WebSocket Event | Network Message | Pushes payload to candidate users to synchronize queue lists and applicant dashboards. |
| Dashboard Toast / UI List | UI Display | Queue table row removed; success notification generated. |

### 1.6 Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules (Section 3.4.4, Section 4.3). |
| 2 | PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` | Table structures, indexes, cache keys. |
| 3 | PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-ACC-001 | View Approved Request Queue | User is authenticated with `ACCOUNTING` role. | All active payment requests with status `APPROVED` (8) are loaded and sorted by the queue's rules. | Accountant |
| UC-ACC-002 | View Request Detail Modal | User clicks Request Number or "Process" button. | Request header, applicant info, bank details, breakdown table, and timeline are rendered, and branch-specific warnings are dynamically evaluated. | Accountant |
| UC-ACC-003 | Mark Request as Paid | Request Detail Modal is active. Optional notes are filled. | The request status is changed to `PAID` (10) within an atomic transaction. Redis cache is invalidated. Socket notifications are sent. | Accountant |
| UC-ACC-004 | Receive Real-Time Queue Updates | Accountant is connected to WebSocket. An upstream approval occurs or a payment is completed. | Toast notification is displayed. Queue table row is added or removed in real-time. | System (Automated) |

### 2.2 Primary Business Workflow

The flow from authentication to list inspection and transaction execution is designed as follows:

```text
┌──────────────────────────┐
│     Accounting Login     │
│      (JWT Verified)      │
└────────────┬─────────────┘
             │ Successful Authentication (Role: ACCOUNTING)
             ▼
┌──────────────────────────┐
│   Accounting Dashboard   │◄───────────────────────────────────┐
│     (Queue Active)       │                                    │
└────────────┬─────────────┘                                    │
             │ Click Request No. or [Process] Button            │
             ▼                                                  │ Cancel
┌──────────────────────────┐                                    │ or Close
│   Payment Detail Modal   ├────────────────────────────────────┤
│ (ALR-01/ALR-02 Rendering)│                                    │
└────────────┬─────────────┘                                    │
             │ Click [Mark as Paid]                             │
             ▼                                                  │
┌──────────────────────────┐                                    │
│   Confirmation Dialog    │                                    │
└────────────┬─────────────┘                                    │
             │ Confirm (Commit DB Transaction)                  │
             └──────────────────────────────────────────────────┘
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Final Approver approves payment request | `APPROVER_REVIEWING` (7) | `APPROVED` (8) | Accounting |
| 2 | Accountant opens request detail modal | `APPROVED` (8) | `APPROVED` (8) | Accounting |
| 3 | Accountant validates breakdown, alerts, and receipt links | `APPROVED` (8) | `APPROVED` (8) | Accounting |
| 4 | Accountant inputs optional note and clicks "Mark as Paid" | `APPROVED` (8) | `APPROVED` (8) | Accounting |
| 5 | Accountant confirms payment processing | `APPROVED` (8) | `PAID` (10) | — (Completed) |

### 2.4 Relevant Requirements Covered

| Requirement ID | Requirement Summary |
| :--- | :--- |
| REQ-017 | Accounting team sees a dashboard displaying all requests in "Approved" status. |
| REQ-018 | Accounting can view detailed information for each approved payment request including receipt attachment. |
| REQ-019 | Accounting can mark a payment as "Paid (Completed)", ending the workflow for that request. |
| REQ-020 | For requests where the Applicant's branch is "Mandalay", Accounting dashboard displays a prominent alert: "Coordinate with Toe San for Cash Payment". |
| REQ-021 | For requests where the Applicant's branch is NOT "Mandalay", Accounting dashboard displays: "Standard Bank Transfer". |
| REQ-022 | When Accounting marks a request as paid, an ApprovalLog entry is created and timestamp is recorded. |
| REQ-027 | All users can view real-time status updates via WebSocket push notifications. |
| REQ-028 | Each request displays a timeline/history view showing all approval log entries and status transitions. |

---

## 3. State Transition Specification

### 3.1 Actor-Controllable State Transitions

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-ACC-01 | `APPROVED` (8) | `PAID` (10) | Mark as Paid | Target request has status `APPROVED` (8) and is not deleted. Active session checks and role validation pass. |

### 3.2 Actor-Observable Status Set

| Status ID | Status Code | Display Name | Can View | Can Edit | Can Delete | Can Submit / Act |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `DRAFT` | Draft | ✓ | ✗ | ✗ | — |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✓ | ✗ | ✗ | — |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✓ | ✗ | ✗ | — |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✓ | ✗ | ✗ | — |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✗ | ✗ | — |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✓ | ✗ | ✗ | — |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✓ | ✗ | ✗ | — |
| 8 | `APPROVED` | Approved | ✓ | ✗ | ✗ | Mark as Paid |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✗ | ✗ | — |
| 10 | `PAID` | Paid (Completed) | ✓ | ✗ | ✗ | — |

### 3.3 Editable Status Set Definition

The Accounting Dashboard is a workflow processing dashboard. The accountant only processes approved requests and enters optional processing notes; they are not authorized to modify request headers, breakdown items, or file attachments. 

* **Not applicable to this screen — the `ACCOUNTING` actor has no request editing privileges.** All status structures are read-only.

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-ACC-001 | Access Role Restriction | Only users with the system role code `ACCOUNTING` (referencing `user_roles.role_code` = 'ACCOUNTING') are authorized to access the dashboard. | Backend (`RolesGuard`), Frontend route protection |
| BR-ACC-002 | Queue Status Restriction | The active dashboard work queue must query only payment request records where `status_id = 8` (`APPROVED`) and `is_deleted = FALSE`. | Backend controller query / Database view |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ACC-003 | Approved Request Immutability | Once a request is approved (status = 8), all core fields (amounts, items, applicants, accounts) are locked and immutable. Only optional payment comments can be recorded during completion. |

### 4.3 Deletion Rules

* **Not applicable to this screen — the `ACCOUNTING` actor has no deletion privileges.** Soft-delete controls are hidden and requests cannot be deleted at this phase.

### 4.4 Receipt File Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ACC-004 | Digital Receipt Auditing | If `has_receipt = TRUE`, the accountant must verify that digital receipt files are accessible and correspond to the breakdown items before clicking "Mark as Paid". |
| BR-ACC-005 | Paper Receipt Handover | Paper receipts can be submitted to Accounting after payment is processed. The system handles this via secondary operational processes. |

### 4.5 Amount Calculation Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ACC-006 | Payment Breakdown Reconcile | The total amount (`total_amount`) must equal the sum of all breakdown line items. If a mismatch is detected, a warning is flagged in the modal. |

### 4.6 Workflow-Specific Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ACC-007 | Mandalay Branch Cash Alert | If the applicant's branch is `"Mandalay"`, the system displays the alert block `ALR-01` (red background, bold font): *"⚠️ IMPORTANT: Coordinate with Toe San for Cash Payment"*. |
| BR-ACC-008 | Non-Mandalay Standard Alert | If the applicant's branch is NOT `"Mandalay"`, the system displays the alert block `ALR-02` (blue background): *"Standard Bank Transfer Processing"*. |
| BR-ACC-009 | Payment Completed Transition | Transitioning to status `PAID` (10) is terminal and locks the record indefinitely from any future status updates or workflow cycles. |

### 4.7 Audit Trail Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-ACC-010 | Immutable Audit Logging | Every payment completion writes a log to `approval_logs`, protected by postgres trigger `trg_approval_logs_immutable`. |
| BR-ACC-011 | UTC Timestamp | All transaction and log timestamps are stored in UTC. UI performs local timezone conversions for presentation. |

---

## 5. Screen Specifications

### 5.1 Screen: Accounting Dashboard List View (`/accounting`)

**Purpose:** Display all pending approved requests awaiting payment processing.

#### 5.1.1 UI Elements

**Data Grid / List:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-01 | Request Number | `payment_requests.request_number` | Hyperlink (opens Detail Modal) | ✓ | ✓ |
| COL-02 | Applicant | `users.full_name` | String | ✓ | ✓ |
| COL-03 | Branch | `users.branch` | String | ✓ | ✓ |
| COL-04 | Desired Payment Date | `payment_requests.desired_payment_date` | YYYY-MM-DD | ✓ | ✗ |
| COL-05 | Total Amount | `payment_requests.total_amount` | Decimal (12,2) with currency | ✓ | ✗ |
| COL-06 | Status | `payment_statuses.status_name` | Badge (Themed colored style) | ✗ | ✗ |
| COL-07 | Action | None (UI button) | "Process" Button | ✗ | ✗ |

**Action Controls:**

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| Process Button (COL-07) | Button (Primary) | Opens the Detail Modal for the corresponding payment request. |

**Default Filter:** `status_id = 8 AND is_deleted = FALSE`

---

### 5.2 Screen: Payment Detail Modal

**Purpose:** Display complete audit details of the payment request and capture completion comments.

#### 5.2.1 Read-Only Display Sections

**Applicant / Requester Information:**
* Employee Number (`employee_number`)
* Full Name (`full_name`)
* Branch (`branch`)

**Payment Information:**
* Application Date (`application_date`) — YYYY-MM-DD format
* Total Payment Amount (`total_amount`) — Decimal format (12,2) with currency prefix
* Desired Payment Date (`desired_payment_date`) — YYYY-MM-DD format
* Currency Type — resolved from `currencies.currency_code`
* Payment Type — resolved from `payment_types.payment_type_name`
* Payment Method — resolved from `payment_methods.payment_method_name`
* Purpose / Usage (`purpose`)
* Bank Account Info (`bank_account_info`) — conditional display

**Request Content & Attachments:**
* Payment Request Content (`request_content`)
* Receipt Present (`has_receipt`) — Yes/No indication
* Receipt Files — Hyperlinks to download stored digital attachments

**Payment Breakdown Table (支払内訳):**

| Column | Data Source | Format |
| :--- | :--- | :--- |
| No (行番号) | `line_number` | Integer 1–15 |
| Date (日付) | `item_date` | YYYY-MM-DD |
| Description (内容) | `description` | String (200 chars) |
| Amount (金額) | `amount` | Decimal (10,2) |

**Approval History (承認履歴):**

Timeline component rendering all previous `approval_logs` entries:

| Field | Data Source | Display Format |
| :--- | :--- | :--- |
| Date/Time (日時) | `timestamp` | UTC → Local timezone |
| User (担当者) | `action_taken_by_user_id` → `users.full_name` | Full name |
| Action (アクション) | `action_type_id` → `approval_action_types.action_type` | Action label |
| Comment (コメント) | `comment` | Text or "—" |

#### 5.2.2 Actor Controls

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| Comment Field (TXT-01) | Text Area | Optional accounting notes. Max 500 characters. |
| Mark as Paid (BTN-03) | Button (Primary) | Initiates payment completion. Triggers modal confirmation. |
| Close (BTN-04) | Button | Closes detail modal without saving. |

#### 5.2.3 Dynamic Alert Evaluation

| Condition | Evaluation Logic | Alert Style | Display Message |
| :--- | :--- | :--- | :--- |
| Mandalay Branch | `users.branch == "Mandalay"` | Warning Alert (`ALR-01`) | *"⚠️ IMPORTANT: Coordinate with Toe San for Cash Payment"* |
| Other Branches | `users.branch != "Mandalay"` | Neutral Alert (`ALR-02`) | *"Standard Bank Transfer Processing"* |

---

## 6. Functional Operation Specification

### 6.1 Operation: Load Active Queue List

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Dashboard initialization, manual refresh, or WebSocket reload. |
| **Data Source** | `GET /api/payment-requests/approved-queue` |
| **Query Filter** | `status_id = 8 AND is_deleted = FALSE` |
| **Default Sort** | 1. `desired_payment_date` (Ascending)<br>2. `application_date` (Ascending)<br>3. `request_number` (Ascending) |
| **Pagination** | Server-side. Default page size: 10 records. |
| **Real-Time Update** | Dashboard joins the `"Accounting"` WebSocket room to listen for live status updates. |

### 6.2 Operation: Open Detail Modal

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Clicking Request Number link (COL-01) or "Process" button (COL-07). |
| **Data Source** | `GET /api/payment-requests/:id` |
| **Query Filter** | Matches target ID, verifies access roles. |
| **Processing Steps** | 1. Fetch request header and applicant branch details.<br>2. Query `payment_breakdown_items` where `payment_request_id = :id`.<br>3. Query active `receipt_files` where `payment_request_id = :id AND is_deleted = FALSE`.<br>4. Query `approval_logs` where `payment_request_id = :id` ordered by `timestamp` ascending.<br>5. Sum breakdown items and verify match with header `total_amount`. If mismatch, raise UI flag.<br>6. Evaluate branch and render alert `ALR-01` or `ALR-02`. |

### 6.3 Operation: Payment Completion

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Clicking "Mark as Paid" button (BTN-03) in detail modal. |
| **Guard Condition** | Target request must have `status_id = 8` (`APPROVED`). User role must be `ACCOUNTING`. |
| **API Endpoint** | `POST /api/payment-requests/:id/mark-paid` |
| **Payload Structure** | `{ comment: string }` |
| **Processing Steps** | 1. Request client confirmation.<br>2. Start database transaction.<br>3. Verify target request is still `status_id = 8` (optimistic lock).<br>4. Update `payment_requests` status to `10` (`PAID`), record `payment_completed_date` and `accounting_user_id`.<br>5. Insert audit log record to `approval_logs` table (Action Code: 10).<br>6. Commit transaction. (Rollback if any step fails).<br>7. Invalidate Redis cache: `DEL payment_request:payload:<targetRequestId>`.<br>8. Broadcast WebSocket notifications: send update to applicant's room (`user:<applicantId>`), and row removal to `"Accounting"` room.<br>9. Return HTTP 200 OK. |
| **Concurrency Control** | Optimistic lock on `status_id = 8`. If another accountant has completed payment, return HTTP `409 Conflict`. |
| **User Confirmation** | Modal prompt: *"Are you sure you want to mark payment request [Request Number] as Paid? This action cannot be undone."* |

---

## 7. Input / Output Specification

### 7.1 Input Specification (入力定義)

| Section | Field (Physical Name) | Display Name (English) | Display Name (日本語) | Data Type & Length | Required | Auto-populated | Input Control | Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| Comments | `comment` | Accounting Comment | 経理コメント | VARCHAR(500) | No | No | Text Area | TXT-01, optional notes |

### 7.2 Output Specification (出力定義)

#### 7.2.1 Queue List View

| Field | Display Name | Data Source | Display Format |
| :--- | :--- | :--- | :--- |
| Request Number | 申請番号 | `payment_requests.request_number` | String (e.g., "PRF-2026-001") |
| Applicant | 申請者 | `users.full_name` | String |
| Branch | ブランチ | `users.branch` | String |
| Desired Date | 支払希望日 | `payment_requests.desired_payment_date` | YYYY-MM-DD |
| Total Amount | 合計金額 | `payment_requests.total_amount` | Decimal (12,2) with currency code |

---

## 8. Input Validation Rules

### 8.1 Draft Save Validation

* **Not applicable to this screen.** Accountants cannot save drafts.

### 8.2 Submission / Action Validation (Strict Mode)

| Section | Field (Physical Name) | Display Name | Validation Rule | Error Message |
| :--- | :--- | :--- | :--- | :--- |
| Comments | `comment` | Accounting Comment | Maximum 500 characters if input. | "Comment cannot exceed 500 characters." |

### 8.3 Validation Enforcement Layers

* **Frontend**: Evaluated before submission. Restricts comment field character length.
* **Backend**: Validated at controller/service layers using NestJS class-validator DTOs, returning HTTP `400 Bad Request` on failure.

---

## 9. Error Handling Specification

### 9.1 Error Response Structure

All backend error responses conform to the standard schema:

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed for the payment comment.",
  "details": [
    {
      "field": "comment",
      "constraint": "maxLength",
      "message": "Comment cannot exceed 500 characters."
    }
  ],
  "timestamp": "2026-06-15T09:00:00.000Z",
  "path": "/api/payment-requests/10/mark-paid"
}
```

### 9.2 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Validation error (e.g., comment too long). | Display error message inline/alert. |
| `401` | `UNAUTHORIZED` | Session expired or missing token. | Redirect to Login page. |
| `403` | `FORBIDDEN` | Non-Accounting user attempts access. | Display access denied screen. |
| `404` | `NOT_FOUND` | Selected request soft-deleted or missing. | Display "The requested payment request was not found." |
| `409` | `CONFLICT` | Concurrent modification (already paid by another user). | Display modal: "This request has already been processed by another accountant. Refreshing list." |
| `500` | `INTERNAL_SERVER_ERROR` | Server/Database failure during save. | Display "A system error occurred. Please try again later." |

---

## 10. Permission and Access Control

### 10.1 Authentication Requirements

* **Mechanism**: JWT Bearer Token passed via HTTP Header (`Authorization: Bearer <token>`).
* **Session Cache**: Session validation backed by Redis. sliding-window TTL: 1 hour (3,600s).

### 10.2 Authorization Guard Architecture

Guards executed sequentially for Accounting API endpoints:
1. `JwtAuthGuard`: Asserts valid token, decodes payload.
2. `RolesGuard`: Asserts user's role code is exactly `ACCOUNTING`.

### 10.3 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Ownership / Assignment Check | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/payment-requests/approved-queue` | `GET` | `ACCOUNTING` | N/A | Fetch all approved requests. |
| `/api/payment-requests/:id` | `GET` | `ACCOUNTING` | N/A | Fetch details of approved request. |
| `/api/payment-requests/:id/mark-paid` | `POST` | `ACCOUNTING` | N/A | Mark request as completed. |

### 10.4 Security Audit Logging

Mutating actions log to `approval_logs` containing client context (IP, User Agent, User ID, Timestamp). Immutable log state is enforced at database layer.

---

## 11. Real-Time Notification Behavior

### 11.1 WebSocket Configuration

* **Technology**: Socket.IO (Port 3001)
* **Rooms**: Accounting users join the `"Accounting"` role room and `"user:<user_id>"` room upon connection.

### 11.2 Notification Events Received by This Screen

| Event Name | Trigger | UI Behavior |
| :--- | :--- | :--- |
| `statusUpdate` | Final Approver approves request (transitions to status 8). | Display toast notification; append the new request to the list. |
| `row-removed` | Another accountant marks request as Paid (transitions to status 10). | Remove the row from the active table list. |

### 11.3 Notification Events Dispatched by This Screen's Actions

| Actor Action | Target Room | Event Name | Payload |
| :--- | :--- | :--- | :--- |
| Mark as Paid | `user:<applicant_id>` | `statusUpdate` | `{ payment_request_id, status: 10, message: "Your request has been paid" }` |
| Mark as Paid | `"Accounting"` | `row-removed` | `{ payment_request_id }` |

---

## 12. Screen Transition Specification

### 12.1 Inbound Navigation

* **Login Screen** → Successfully logging in with `ACCOUNTING` role redirects to `/accounting`.
* **Global Header** → Clicking "Accounting Dashboard" link enters queue.

### 12.2 Internal Screen States

* **Queue List View**: Default dashboard display.
* **Detail Modal**: Activated by clicking row processing controls.
* **Confirmation Modal**: Prompted during action validation.

### 12.3 Outbound Navigation

* **Logout**: Clears session, redirects to Login.
* **Invalid URL**: Navigates to 404 page.

---

## 13. Non-Functional Considerations

### 13.1 Performance Requirements

* Page load time (initial render): ≤ 2 seconds.
* Active queue query response: ≤ 1 second.
* Action commit processing: ≤ 2 seconds.
* WebSocket synchronization latency: ≤ 500 milliseconds.

### 13.2 Caching Strategy

* **Lookups**: `lookup:<table_name>` cached in Redis (TTL: 24h).
* **Eviction**: Completing payment evicts request cache `payment_request:payload:<id>` instantly via database trigger hook or service commit.

### 13.3 Responsive Design Requirements

* **Desktop (≥ 1024px)**: Full table display with columns COL-01 to COL-07.
* **Tablet (768px – 1023px)**: Single column list view with card design; action button triggers modal overlay.
* **Mobile (< 768px)**: Stacked cards view. Hides less critical columns (COL-02, COL-06), optimized modal interface.

### 13.4 Display Order / Sorting Rules

1. **Desired Payment Date (`desired_payment_date`)**: Ascending (earliest dates first, to prioritize imminent payments).
2. **Application Date (`application_date`)**: Ascending (oldest requests processed first in case of identical desired payment dates).
3. **Request Number (`request_number`)**: Ascending (alphabetical string sort for unique identity consistency).

---

## 14. Configurable Items (External Definitions)

The following system properties are defined externally in the application's configuration file (`appsettings.json` or environment variables) and can be modified without altering compilation code:

| Definition Key | Parameter Classification | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `MandalayBranchName` | System String | `"Mandalay"` | The branch identifier key used to activate custom payment warning logic. |
| `MandalayContactPerson`| System String | `"Toe San"` | The contact name displayed in the cash payment alert block. |
| `UploadDirectory` | Path String | `"wwwroot/uploads/"` | Root folder directory where physical receipts reside. |
| `ApprovedStatusCode` | System Integer | `8` | Status ID referencing the `APPROVED` database lookup code. |
| `PaidStatusCode` | System Integer | `10` | Status ID referencing the `PAID` database lookup code. |

---

## 15. Cross-Reference Traceability Matrix

### 15.1 Requirements Definition Traceability

| Requirement ID | Covered By (This Document) |
| :--- | :--- |
| REQ-017 | Section 1.1, Section 5.1, Section 6.1 |
| REQ-018 | Section 1.2, Section 5.2, Section 6.2 |
| REQ-019 | Section 1.2, Section 6.3 |
| REQ-020 | Section 4.6, Section 5.2.3, Section 6.2 |
| REQ-021 | Section 4.6, Section 5.2.3, Section 6.2 |
| REQ-022 | Section 4.7, Section 6.3 |
| REQ-027 | Section 11 |
| REQ-028 | Section 5.2.1 |

### 15.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `payment_requests` | Read in approved queue query (6.1) and modal display (6.2). Updated on payment completion (6.3). |
| `payment_breakdown_items` | Read to render the breakdown table in the modal (6.2) and confirm sum matches total (6.2). |
| `receipt_files` | Queried to display digital receipt files in the detail modal (6.2). |
| `approval_logs` | Queried to display historical timeline (6.2); inserted to record completion (6.3). |
| `users` | Joined to retrieve applicant names, employee numbers, and branches. |
| `payment_statuses` | Joined to render themed status badges. |

### 15.3 Related Document References

| Document ID | Document Name | File Path |
| :-- | :--- | :--- |
| PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` |
| PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` |
| PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` |
