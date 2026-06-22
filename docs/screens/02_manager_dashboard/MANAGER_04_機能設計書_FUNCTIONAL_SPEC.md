# Functional Specification (機能設計書) — Manager Dashboard

**Document ID:** PRWM-FSD-SCR-002  
**Target Screen:** Manager Dashboard (担当マネージャーダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Manager Verification Operations  
**Function ID:** FN-002  
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
| 1.0 | 2026-06-12 | Senior Principal Architect | Initial release. Full functional specification for the Manager Dashboard subsystem covering verification queues, automatic reviewing transitions, detail inspection, receipt verification, approval/rejection operations, approval logs, and WebSocket notifications. |
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

This screen serves as the primary operational portal for users assigned the `MANAGER` role within the Payment Request Workflow Management System. This screen provides the necessary features for managers to review and verify payment requests submitted by applicants. Managers evaluate the correctness of the application date, desired payment date, payment breakdown lines, amounts, currency, purposes, bank information, and physical/digital receipt attachments before forwarding the request to the next stage.

Managers do not make the final approval; rather, they perform initial verification. If the request is correct, the manager verifies it, transitioning the status to `MANAGER_VERIFIED`, which routes the request back to the applicant's queue. The applicant then decides when to submit it to the Final Approver. If the request is incorrect, the manager rejects it back to the applicant with a mandatory comment, transitioning the status to `REJECTED_MANAGER`.

### 1.2 Functional Responsibilities

This screen is responsible for the following core functional areas:

1. **Verification Queue Management** — Listing all payment requests submitted to the manager that are pending verification.
2. **Detail Inspection** — Providing a read-only view of the payment request header, contents, and 1 to 15 payment breakdown line items.
3. **Receipt Attachment Verification** — Rendering inline previews (for PDF and image formats) and providing download links for attached receipt files.
4. **Automatic Status Transition on Access (REQ-007)** — Automatically updating a request's status from `Submitted to Manager` to `Manager Reviewing` the moment a manager opens its detail view, indicating active review.
5. **Verification Action (REQ-009)** — Allowing the manager to verify a request, moving the status to `Manager Verified (OK)` and returning routing control to the applicant.
6. **Rejection Action (REQ-010)** — Allowing the manager to reject a request, moving the status to `Rejected by Manager`, returning it to the applicant, and requiring a comment of at least 10 characters.
7. **Immutable Log Generation (REQ-011)** — Recording all verification, rejection, and review-start events in the `approval_logs` table for audit compliance.

### 1.3 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `MANAGER` role (`role_code = 'MANAGER'`) |
| **Required Authentication** | JWT Bearer Token (validated per request) |
| **Data Scope** | Exclusively payment requests assigned to the authenticated manager (`manager_user_id = current_user.user_id`) |

### 1.4 Relationships with Other Functions and Peripheral Systems

```text
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│     Applicant Actor      │      │       payment_requests Table        │
│   (Submits Draft/Reject) ├─────►│ status_id = SUBMITTED_MANAGER       │
└──────────────────────────┘      └──────────────┬────────────────────┘
                                                 │ User opens detail page
                                                 ▼
                                      ┌────────────────────────┐
                                      │   Manager Dashboard    │
                                      │ (status: MGR_REVIEW)   │
                                      └──────────┬─────────────┘
                                                 │ Verify / Reject
                                                 ▼
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│     Applicant Actor      │      │       payment_requests Table        │
│ (View Verified/Rejected) │◄─────┤ status_id = MANAGER_VERIFIED or     │
│                          │      │           REJECTED_MANAGER          │
└──────────────────────────┘      └─────────────────────────────────────┘
```

### 1.5 Inputs / Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `payment_requests` | Database Table | Consumes request details matching `manager_user_id = current_user.user_id` and `status_id` in (SUBMITTED_MANAGER, MANAGER_REVIEWING). |
| `payment_breakdown_items` | Database Table | Consumes breakdown items linked to the selected request. |
| `receipt_files` | Database Table | Consumes receipt file paths linked to the selected request. |
| `approval_logs` | Database Table | Consumes historical timeline actions for the selected request. |
| `users` | Database Table | User records linked to the applicant and current manager. |
| Verification / Rejection Comment | User Input UI | Optional comment for verification, or mandatory comment (at least 10 characters) for rejection. |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `payment_requests` | Database Table | Sets `status_id` to `MANAGER_REVIEWING`, `MANAGER_VERIFIED`, or `REJECTED_MANAGER`. Updates `modified_date` and `current_assigned_to_user_id`. |
| Created `approval_logs` | Database Table | Appends a new immutable log record mapping the transition details. |
| WebSocket Event | Network Message | Dispatches `statusUpdate` event indicating status transition to connected clients. |
| Dashboard Toast / UI List | UI Display | Visual confirmation banner and list refresh. |

### 1.6 Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` | Section 3.4.2 (Manager Verification Workflow), Rule 4.1.2, 4.1.3, 4.1.4, 4.1.5 |
| 2 | PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` | Table schemas for `payment_requests`, `approval_logs` |
| 3 | PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |
| 4 | PRWM-SIS-SCR-002 | Screen Items Specification — Manager Dashboard | `docs/screens/02_manager_dashboard/MANAGER_05_画面項目設計書_SCREEN_ITEMS.md` | Physical UI layout and validations. |
| 5 | PRWM-DDS-SCR-002 | Detail Design Specification — Manager Dashboard | `docs/screens/02_manager_dashboard/MANAGER_06_詳細設計書_DETAIL_DESIGN.md` | API endpoint contracts and SQL updates. |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-MGR-001 | View Pending Queue | User is authenticated with `MANAGER` role. | Returns list of payment requests assigned to the manager where `status_id` ∈ {`2 (SUBMITTED_MANAGER)`, `3 (MANAGER_REVIEWING)`}. | Manager |
| UC-MGR-002 | Open Request Details & Auto-Transition | Target request is assigned to this manager. | Details are loaded. If status was `SUBMITTED_MANAGER` (2), it updates to `MANAGER_REVIEWING` (3). An `approval_logs` entry of type `ManagerReview` is appended. WebSocket notification is dispatched. | Manager |
| UC-MGR-003 | Review Request Details & Attachments | Request details are loaded. | Manager inspects fields and views/downloads attached receipts. | Manager |
| UC-MGR-004 | Verify Payment Request (Verify OK) | Request is in `MANAGER_REVIEWING` (3) status. Assigned manager = current user. | `status_id` transitions to `4 (MANAGER_VERIFIED)`. `current_assigned_to_user_id` transitions back to the applicant. An `approval_logs` entry of type `ManagerVerified` is appended. WebSocket status update is dispatched. | Manager |
| UC-MGR-005 | Reject Payment Request | Request is in `MANAGER_REVIEWING` (3) status. Assigned manager = current user. Comment is entered and ≥ 10 characters. | `status_id` transitions to `5 (REJECTED_MANAGER)`. `current_assigned_to_user_id` transitions back to the applicant. An `approval_logs` entry of type `ManagerRejected` is appended. WebSocket status update is dispatched. | Manager |

### 2.2 Primary Business Workflow

```
                        ┌──────────────────┐
                        │  Manager Login   │
                        │  (JWT Verified)  │
                        └────────┬─────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │   Manager Dashboard View    │
                    │ (View Pending Queue: UC-1)  │
                    └──────────┬──────────────────┘
                               │
                               │ Click Request Row
                               ▼
                    ┌─────────────────────────────┐
                    │  Open Detail View (UC-2)    │
                    │  If Status = SUBMITTED_MGR: │
                    │   Auto-update to REVIEWING  │
                    │   Create 'Review' ApprovalLog│
                    │   WebSocket Notification    │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │   Detail & Preview (UC-3)   │
                    │   - Check Details & Breakdown│
                    │   - View Receipt Attachments│
                    │   - Input Optional/Req Comment│
                    └──────────┬──────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        【Verify OK (UC-4)】              【Reject (UC-5)】
                │                             │
        Optional Comment               Mandatory Comment
                │                     (Min 10 characters)
                │                             │
                ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │ Status: MANAGER_     │      │ Status: REJECTED_    │
    │ VERIFIED (ID: 4)     │      │ MANAGER (ID: 5)      │
    │ Assigned: Applicant  │      │ Assigned: Applicant  │
    │ Create Log: VERIFIED │      │ Create Log: REJECTED │
    │ WebSocket Notify     │      │ WebSocket Notify     │
    └──────────────────────┘      └──────────────────────┘
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Manager clicks a request from the queue | `SUBMITTED_MANAGER` (2) | `MANAGER_REVIEWING` (3) | Manager |
| 2a | Manager verifies request details | `MANAGER_REVIEWING` (3) | `MANAGER_VERIFIED` (4) | Applicant |
| 2b | Manager rejects request details | `MANAGER_REVIEWING` (3) | `REJECTED_MANAGER` (5) | Applicant |

### 2.4 Relevant Requirements Covered

| Requirement ID | Requirement Summary |
| :--- | :--- |
| REQ-007 | When a manager opens a request in "Submitted to Manager" status, the status automatically changes to "Manager Reviewing". |
| REQ-008 | The manager can inspect all details of the payment request, including invoice/receipt attachments. |
| REQ-009 | The manager can approve (verify) the request, changing the status to "Manager Verified (OK)". The request returns to the applicant. |
| REQ-010 | The manager can reject the request, changing the status to "Rejected by Manager". A rejection comment is mandatory. |
| REQ-011 | When a manager performs an action (verifying or rejecting), an ApprovalLog is created to record that action and comment. |

---

## 3. State Transition Specification

### 3.1 Actor-Controllable State Transitions

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-MGR-01 | `SUBMITTED_MANAGER` (2) | `MANAGER_REVIEWING` (3) | System-initiated on detail access | Authenticated user matches `payment_requests.manager_user_id`. Transition occurs automatically inside a transaction. |
| TR-MGR-02 | `MANAGER_REVIEWING` (3) | `MANAGER_VERIFIED` (4) | Click "Verify (確認完了)" button | Request ownership checks pass. Optional comment validated. |
| TR-MGR-03 | `MANAGER_REVIEWING` (3) | `REJECTED_MANAGER` (5) | Click "Reject (却下する)" button | Request ownership checks pass. Mandatory comment validated (non-empty and ≥ 10 characters). |

### 3.2 Actor-Observable Status Set

| Status ID | Status Code | Display Name | Can View | Can Edit | Can Delete | Can Submit / Act |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✓ | ✗ | ✗ | ✓ (Triggers status change to Manager Reviewing) |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✓ | ✗ | ✗ | ✓ (Verify or Reject) |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✓ | ✗ | ✗ | — |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✗ | ✗ | — |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✓ | ✗ | ✗ | — |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✓ | ✗ | ✗ | — |
| 8 | `APPROVED` | Approved | ✓ | ✗ | ✗ | — |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✗ | ✗ | — |
| 10 | `PAID` | Paid (Completed) | ✓ | ✗ | ✗ | — |

### 3.3 Editable Status Set Definition

Not applicable. The Manager actor has **no edit privileges** over any request header fields, breakdown items, or receipt attachments. The request is locked and rendered exclusively in read-only mode.

The only fields writable by this actor are the `comment` input field in the rejection modal and the action trigger buttons.

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-MGR-001 | Assigned Request Isolation | The manager shall have visibility and access only to payment requests where `payment_requests.manager_user_id` equals the authenticated user's `user_id`. Requests assigned to other managers or drafts are strictly excluded from lists and detailed endpoints. | Backend (TypeORM QueryBuilder `WHERE` clause), API Controller (`OwnershipGuard`) |
| BR-MGR-002 | Access Prevention for Unassigned Requests | If a manager attempts to access another user's request details using direct URL path manipulation, the system returns HTTP `403 Forbidden` and hides the resource's existence. | Backend (`OwnershipGuard`) |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-003 | Detail Immutability | Under no circumstances can the Manager alter the requested payment amount, dates, currency, bank details, breakdown items, or uploaded receipts. If details are incorrect, the request must be rejected. |
| BR-MGR-004 | Post-Action Queue Eviction | Once a request is verified or rejected, it is immediately removed from the active pending verification queue view of the Manager. |

### 4.3 Deletion Rules

Not applicable to this screen — the `MANAGER` actor has no deletion privileges.

### 4.4 Receipt File Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-005 | Receipt Read-only Access | The Manager can read, inline preview, and download uploaded receipt attachments. The system provides temporary authenticated download links. |

### 4.5 Amount Calculation Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-006 | Immutable Calculated Fields | The total amount rendered on the screen must match `payment_requests.total_amount` which is read-only. The breakdown table sum is verified against the header total. |

### 4.6 Workflow-Specific Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-007 | Automatic Status Transition on Open (REQ-007) | When a manager requests the details of a payment request whose current status is exactly `SUBMITTED_MANAGER` (2), the system must immediately and atomically transition the status to `MANAGER_REVIEWING` (3). The modification timestamp (`modified_date`) is updated. |
| BR-MGR-008 | Verification Status Transition (REQ-009) | Upon clicking "Verify (確認完了)", the request transitions to status `MANAGER_VERIFIED` (4). The `current_assigned_to_user_id` field is set back to the request's `applicant_user_id`. This returns the request to the applicant's inbox for forwarding. |
| BR-MGR-009 | Rejection Status Transition (REQ-010) | Upon clicking "Reject (却下する)", the request transitions to status `REJECTED_MANAGER` (5). The `current_assigned_to_user_id` is set back to the request's `applicant_user_id`. |
| BR-MGR-010 | Rejection Comment Requirement | Rejection is permitted only if a comment is provided. The comment must contain at least 10 characters. This prevents empty or vague feedback, ensuring applicants know what changes are required. |

### 4.7 Audit Trail Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-011 | Review Action Audit Logging (REQ-011) | An automatic status transition to `MANAGER_REVIEWING` must create a log entry in the `approval_logs` table with `action_type_id` set to `MGR_REVIEW_START` (ID: 4), `previous_status_id = 2`, `new_status_id = 3`, and the comment "Manager opened request and started reviewing". |
| BR-MGR-012 | Action Audit Logging (REQ-011) | Any click of "Verify" or "Reject" must create a log entry in the `approval_logs` table containing the action type (`MGR_VERIFIED` ID: 5 or `MGR_REJECTED` ID: 6), previous/new statuses, manager's user ID, IP address, user agent, and comment text. |
| BR-MGR-013 | Immutable Approval Log | Every state-modifying action is recorded in the `approval_logs` table. Records are append-only and protected by the `trg_approval_logs_immutable` PostgreSQL trigger. |
| BR-MGR-014 | Timestamp Integrity | All timestamps are recorded in UTC with millisecond precision. Local timezone conversion is performed exclusively at the presentation layer. |

---

## 5. Screen Specifications

### 5.1 Screen: Pending Verification Queue (`/manager/dashboard`)

**Purpose:** Displays the list of requests currently awaiting the Manager's verification.

#### 5.1.1 UI Elements

**Data Grid / List:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-01 | Request ID | `payment_requests.request_number` | "PRF-YYYY-NNN" (Anchor Link to detail view) | ✓ | ✓ |
| COL-02 | Applicant Name | `users.full_name` (Applicant) | String | ✓ | ✓ |
| COL-03 | Amount | `payment_requests.total_amount` | Currency + Decimal (e.g. USD 1,500.00) | ✓ | ✗ |
| COL-04 | Date | `payment_requests.application_date` | YYYY-MM-DD | ✓ | ✓ |
| COL-05 | Urgent Flag | Computed from `desired_payment_date` | Red Badge/Icon (Active if `desired_payment_date` is <= 48 hours from today or overdue) | ✓ | ✓ |
| COL-06 | Status | `payment_statuses.status_name` | Badge (Yellow: Submitted, Blue: Reviewing) | ✓ | ✓ |

**Action Controls:**

* **Refresh Button:** Forces reloading of the grid.
* **Search Input:** Filters grid dynamically by Request Number or Applicant Name.

**Default Filter:** `status_id = Submitted to Manager (2) OR status_id = Manager Reviewing (3)`. Sorted by `status_id ASC, created_date DESC`.

---

### 5.2 Screen: Request Detail View (Split View / Modal Layout)

**Purpose:** Renders the details of a single request, breakdown, attachment preview, and verification actions.

#### 5.2.1 Read-Only Display Sections

**Applicant / Requester Information:**
- Employee Number (`employee_number`)
- Full Name (`full_name`)
- Branch (`branch`)

**Payment Information:**
- Application Date (`application_date`) — YYYY-MM-DD format
- Total Payment Amount (`total_amount`) — Decimal format (12,2) with currency prefix
- Desired Payment Date (`desired_payment_date`) — YYYY-MM-DD format
- Currency Type — resolved from `currencies.currency_code`
- Payment Type — resolved from `payment_types.payment_type_name`
- Payment Method — resolved from `payment_methods.payment_method_name`
- Purpose / Usage (`purpose`)
- Bank Account Info (`bank_account_info`) — conditional display

**Request Content & Attachments:**
- Payment Request Content (`request_content`)
- Receipt Present (`has_receipt`) — Yes/No indication
- Receipt Files — Hyperlinks to download stored digital attachments and inline previews for image/PDF formats

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
| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| **Approve Button (Verify)** | Button (Primary Green) | Triggers approval/verification flow. Displays confirmation modal: "Are you sure you want to approve/verify this request?". |
| **Reject Button** | Button (Danger Red) | Opens Rejection Modal requiring a comment. |
| **Rejection Comment Input**| Text Area | In Rejection Modal. Mandatory for rejections. Length validator enforced (>=10 chars, max 500 chars). |
| **Cancel Rejection Button**| Button | Closes Rejection Modal and resets input. |
| **Submit Rejection Button**| Button | Submits rejection and transitions request back to Applicant with the mandatory comment. |

#### 5.2.3 Dynamic Alert Evaluation

Not applicable to this screen. (Branch alert logic is processed during final payment settlement at the Accounting Dashboard).

---

## 6. Functional Operation Specification

### 6.1 Operation: Fetch Pending Queue List

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Initial dashboard load, pagination change, or click refresh button. |
| **Data Source** | API Endpoint: `GET /api/payment-requests/pending-manager` |
| **Query Filter** | `manager_user_id = current_user.user_id AND status_id IN (2, 3) AND is_deleted = FALSE` |
| **Default Sort** | Primary: `status_id` (ascending order: `SUBMITTED_MANAGER` first, then `MANAGER_REVIEWING`), Secondary: `created_date` (descending). |
| **Pagination** | Server-side pagination. Default: 10 records per page. |
| **Display Fields** | Request ID (`payment_request_id`), Request Number (`request_number`), Applicant Name (derived from `users`), Application Date (`application_date`), Total Amount (`total_amount`), Currency Code (`currency_code`), Status Code (`status_code`). |
| **Real-Time Update** | Grid automatically updates or triggers refetch when a `statusUpdate` WebSocket event is received. |

### 6.2 Operation: Open Request Details (Auto Status Change)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager selects a request from the pending queue. |
| **Guard Condition** | Authenticated user is the assigned `manager_user_id`. |
| **API Endpoint** | `GET /api/payment-requests/:id` |
| **Server-side Processing** | 1. Validate manager ownership using `OwnershipGuard`.  <br>2. Fetch request details.  <br>3. Check if status is `SUBMITTED_MANAGER` (2).  <br>4. If yes, start a transaction:  <br>&nbsp;&nbsp;&nbsp;&nbsp;a. Update `status_id = 3` (`MANAGER_REVIEWING`).  <br>&nbsp;&nbsp;&nbsp;&nbsp;b. Create `approval_logs` record: `action_type_id = 4` (`MGR_REVIEW_START`), `previous_status_id = 2`, `new_status_id = 3`, `comment = 'Manager opened request and started reviewing'`.  <br>&nbsp;&nbsp;&nbsp;&nbsp;c. Commit transaction.  <br>&nbsp;&nbsp;&nbsp;&nbsp;d. Evict Redis cache payload (`DEL payment_request:payload:<id>`).  <br>&nbsp;&nbsp;&nbsp;&nbsp;e. Dispatch WebSocket `statusUpdate` event to notifying status transition to Reviewing.  <br>5. Return detail payload (including breakdown items, receipts, and approval logs history). |
| **Concurrency Control** | Optimistic lock comparison on status. If status has changed from `SUBMITTED_MANAGER` before transaction executes, return conflict error (HTTP 409). |

### 6.3 Operation: Verify Request (Verify OK)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager clicks "Verify (確認完了)" button on the detail form. |
| **API Endpoint** | `POST /api/payment-requests/:id/verify` |
| **Request Content-Type**| `application/json` |
| **Payload Structure** | `{ "comment": "Optional verification comment" }` |
| **Guard Condition** | Status must be `MANAGER_REVIEWING` (3). Ownership check matches. |
| **Server-side Processing** | 1. Check guards and optimistic concurrency.  <br>2. Begin transaction.  <br>3. Update `status_id = 4` (`MANAGER_VERIFIED`).  <br>4. Update `current_assigned_to_user_id = applicant_user_id` (returns to applicant).  <br>5. Update `modified_date = NOW()`.  <br>6. Insert `approval_logs` record: `action_type_id = 5` (`MGR_VERIFIED`), `previous_status_id = 3`, `new_status_id = 4`, `comment = payload.comment`.  <br>7. Commit transaction.  <br>8. Evict Redis cache payload (`DEL payment_request:payload:<id>`).  <br>9. Emit WebSocket status updates.  <br>10. Return `200 OK` indicating success. |
| **Concurrency Control** | Optimistic lock on `status_id = 3`. If another session has modified the request status, return HTTP `409 Conflict`. |
| **User Confirmation** | Modal prompt: *"Are you sure you want to verify this payment request? This will route the request back to the applicant."* |

### 6.4 Operation: Reject Request (Return)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager clicks "Reject (却下する)" button on the detail form. |
| **API Endpoint** | `POST /api/payment-requests/:id/reject-manager` |
| **Request Content-Type**| `application/json` |
| **Payload Structure** | `{ "comment": "Mandatory rejection comment (min 10 characters)" }` |
| **Guard Condition** | Status must be `MANAGER_REVIEWING` (3). Ownership check matches. Comment must pass length validation. |
| **Server-side Processing** | 1. Validate guards and rejection comment constraints.  <br>2. Begin transaction.  <br>3. Update `status_id = 5` (`REJECTED_MANAGER`).  <br>4. Update `current_assigned_to_user_id = applicant_user_id` (returns to applicant).  <br>5. Update `modified_date = NOW()`.  <br>6. Insert `approval_logs` record: `action_type_id = 6` (`MGR_REJECTED`), `previous_status_id = 3`, `new_status_id = 5`, `comment = payload.comment`.  <br>7. Commit transaction.  <br>8. Evict Redis cache payload (`DEL payment_request:payload:<id>`).  <br>9. Emit WebSocket status updates.  <br>10. Return `200 OK` indicating success. |
| **Concurrency Control** | Optimistic lock on `status_id = 3`. If another session has modified the request status, return HTTP `409 Conflict`. |
| **User Confirmation** | Modal prompt: *"Are you sure you want to reject this payment request back to the applicant?"* |

---

## 7. Input / Output Specification

### 7.1 Input Specification (入力定義)

All request detail parameters are read-only. The only interactive inputs are:

| Section | Field (Physical Name) | Display Name (English) | Display Name (日本語) | Data Type & Length | Required | Auto-populated | Input Control | Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| Action | `comment` | Manager Comment | 確認・却下コメント | VARCHAR(500) | Cond. | No | Text Area | Required for Rejection only. Optional for Verification. |

### 7.2 Output Specification (出力定義)

#### 7.2.1 Queue List View

| Field | Display Name | Data Source | Display Format |
| :--- | :--- | :--- | :--- |
| Request ID | 申請番号 (Request Number) | `payment_requests.request_number` | String (e.g., "PRF-2026-0001") |
| Applicant Name | 申請者氏名 | `users.full_name` | String |
| Amount | 合計金額 | `payment_requests.total_amount` | Decimal (12,2) with currency code |
| Date | 申請日 | `payment_requests.application_date` | YYYY-MM-DD |
| Urgent Flag | 至急フラグ | Computed from `desired_payment_date` | Red Badge/Icon (Active if `desired_payment_date` <= 48 hours or overdue) |
| Status Badge | ステータス | `payment_statuses.status_name` | Colored Badge |

#### 7.2.2 Request Detail View

The detail specifications map to the fields in **Section 5.2.1** reading from:
* `payment_requests` table
* `payment_breakdown_items` table
* `receipt_files` table
* `approval_logs` table
* `users` table

---

## 8. Input Validation Rules

### 8.1 Draft Save Validation (Relaxed Mode)

Not applicable to this screen. Managers cannot save drafts.

### 8.2 Submission / Action Validation (Strict Mode)

| Section | Field (Physical Name) | Display Name | Validation Rule | Error Message |
| :--- | :--- | :--- | :--- | :--- |
| **Verify Action** | `comment` | Manager Comment | Optional. Text format. Max 500 characters. | "Comment must be under 500 characters." |
| **Reject Action** | `comment` | Manager Comment | **Required.** Text format. Minimum 10 characters, Maximum 500 characters. | "Comment is required and must be at least 10 characters long to reject a request." |

### 8.3 Validation Enforcement Layers

All validation rules defined in this section are enforced at two independent layers to ensure defense-in-depth:

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend (Client)** | React form validation with real-time feedback | Provides immediate user feedback on input errors. Prevents submission of invalid comments. Reduces unnecessary API calls. |
| **Backend (Server)** | NestJS Service Layer + `class-validator` DTOs | Authoritative validation. Rejects invalid payloads with HTTP `400 Bad Request` and structured error response. Guards against client-side validation bypass. |

---

## 9. Error Handling Specification

### 9.1 Error Response Structure

All API error responses from the backend shall conform to the following JSON structure:

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed for the manager comments.",
  "details": [
    {
      "field": "comment",
      "constraint": "minLength",
      "message": "Comment is required and must be at least 10 characters long to reject a request."
    }
  ],
  "timestamp": "2026-06-15T09:00:00.000Z",
  "path": "/api/payment-requests/10/reject-manager"
}
```

### 9.2 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Validation failure on submitted comments. | Display inline validation error message in the comments textarea. |
| `401` | `UNAUTHORIZED` | JWT token is missing, expired, or invalid. | Redirect user to the login screen. Display session expiration message. |
| `403` | `FORBIDDEN` | User attempts to access or modify a request not assigned to them, or attempts a prohibited action. | Display access denied message: "Access denied. You are not authorized to view or verify this request." |
| `404` | `NOT_FOUND` | The specified resource does not exist or has been soft-deleted. | Display "The requested payment request was not found." |
| `409` | `CONFLICT` | Optimistic concurrency conflict — request was modified by another session. | Display "This request's status has changed since it was loaded. The list will now refresh." |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error during transaction. | Display "An unexpected error occurred. Please try again or contact your system administrator." Log full stack trace server-side. |

### 9.3 Frontend Error Display Behavior

| Error Type | Display Method |
| :--- | :--- |
| **Field-Level Validation Error** | Red border on the comment input textarea. Error message text displayed directly below the field in red. |
| **API Error (Non-Validation)** | Toast notification displayed in the top-right corner of the viewport. Auto-dismiss after 8 seconds. Color-coded: red for errors. |
| **Network Error / Timeout** | Toast banner: "Unable to connect to the server. Please check your network connection and try again." |
| **Concurrency Conflict (409)** | Modal dialog with "Refresh" action button that reloads the current data from the server. |

---

## 10. Permission and Access Control

### 10.1 Authentication Requirements

| Attribute | Specification |
| :--- | :--- |
| **Authentication Mechanism** | JSON Web Token (JWT) Bearer Token |
| **Token Transport** | `Authorization: Bearer <token>` HTTP header on every API request |
| **Token Validation** | Server-side verification of token signature, expiration (`exp` claim), and issuer (`iss` claim) on every incoming request. |
| **Session Management** | Stateless JWT with Redis-backed session caching. Session TTL: 3,600 seconds (1 hour, sliding window). |

### 10.2 Authorization Guard Architecture

The following NestJS guards are applied in sequence to every API endpoint for this screen:

| Guard Order | Guard Name | Purpose | Failure Response |
| :---: | :--- | :--- | :--- |
| 1 | `JwtAuthGuard` | Validates the JWT Bearer token. Extracts and attaches the authenticated user context. | HTTP `401 Unauthorized` |
| 2 | `RolesGuard` | Validates that the authenticated user's `role_id` maps to the `MANAGER` role code. | HTTP `403 Forbidden` |
| 3 | `OwnershipGuard` | Validates that `payment_requests.manager_user_id` matches the authenticated user ID. | HTTP `403 Forbidden` |

### 10.3 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Ownership / Assignment Check | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/payment-requests/pending-manager` | `GET` | `MANAGER` | Implicit (Query Filter) | Fetch pending reviews. |
| `/api/payment-requests/:id` | `GET` | `MANAGER` | ✓ | Load details (auto-reviews if new). |
| `/api/payment-requests/:id/verify` | `POST` | `MANAGER` | ✓ | Verify request details. |
| `/api/payment-requests/:id/reject-manager` | `POST` | `MANAGER` | ✓ | Reject request with comments. |

### 10.4 Security Audit Logging

Every state-modifying action performed by the actor is recorded in the `approval_logs` table with the following metadata:

| Field | Source | Purpose |
| :--- | :--- | :--- |
| `action_taken_by_user_id` | JWT `user_id` claim | Identifies the actor who performed the action. |
| `action_type_id` | Business logic mapping | Classifies the type of action (e.g. `4` for MGR_REVIEW_START, `5` for MGR_VERIFIED, `6` for MGR_REJECTED). |
| `previous_status_id` | Current status before transition | Records the originating state for audit trail. |
| `new_status_id` | Target status after transition | Records the destination state. |
| `comment` | User input or system default | Captures actor comments or system-generated notes. |
| `ip_address` | Request metadata (`X-Forwarded-For`) | Security audit — client network origin. |
| `user_agent` | Request header `User-Agent` | Security audit — client browser/device. |
| `timestamp` | Server-generated timestamp | Precise temporal record in UTC. |

---

## 11. Real-Time Notification Behavior

### 11.1 WebSocket Configuration

| Attribute | Specification |
| :--- | :--- |
| **Technology** | Socket.IO (via NestJS `@WebSocketGateway`) |
| **Gateway Port** | 3001 |
| **Connection Protocol** | Upon login, the frontend client establishes a WebSocket connection and emits a `joinRoom` event. |
| **Room Membership** | The manager joins the `'MANAGER'` role room, and their personal room `'user:<user_id>'`. |

### 11.2 Notification Events Received by This Screen

| Event Name | Trigger Condition | Payload | UI Behavior |
| :--- | :--- | :--- | :--- |
| `statusUpdate` | Applicant submits request to Manager. | `{ payment_request_id, status: 2 }` | Display toast notification; append the new request to the pending list. |

### 11.3 Notification Events Dispatched by This Screen's Actions

| Actor Action | Target Room | Event Name | Payload |
| :--- | :--- | :--- | :--- |
| Verify Request | `user:<applicant_user_id>` | `statusUpdate` | `{ payment_request_id, status: 4, action_by: manager_name, timestamp }` |
| Reject Request | `user:<applicant_user_id>` | `statusUpdate` | `{ payment_request_id, status: 5, action_by: manager_name, comment, timestamp }` |

### 11.4 Connection Resilience

| Scenario | Behavior |
| :--- | :--- |
| **Temporary Disconnection** | Socket.IO automatic reconnection with exponential backoff. Pending events are queued and delivered upon reconnection. |
| **Extended Disconnection** | Upon reconnection, the frontend issues a full data refresh request to synchronize the list with the latest server state. |
| **Latency Requirement** | Status change notifications must be delivered to connected clients within ≤ 500 milliseconds of the server-side transaction commit. |

---

## 12. Screen Transition Specification

### 12.1 Inbound Navigation

| Source Screen | Navigation Path | Condition |
| :--- | :--- | :--- |
| Login Screen | Successful authentication with `MANAGER` role → automatic redirect to `/manager`. | User `role_id` maps to `MANAGER`. |
| Global Navigation Header | Click "Manager Dashboard" link in the top navigation bar. | User is authenticated with `MANAGER` role. |

### 12.2 Internal Screen States

| Screen State | Trigger | Content Displayed |
| :--- | :--- | :--- |
| **List View (Default)** | Dashboard initial load. | Table of requests with status `SUBMITTED_MANAGER` and `MANAGER_REVIEWING`. |
| **Detail Split View** | Click on a specific record row from the list. | Display detailed parameters, breakdown items, receipt attachments, and verification forms. |

### 12.3 Outbound Navigation

| Destination | Trigger | Condition |
| :--- | :--- | :--- |
| Login Screen | JWT token expiration or manual logout action. | Session expired or user-initiated logout. |
| 404 Page | URL path does not match any defined route. | Invalid URL entered directly. |

---

## 13. Non-Functional Considerations

### 13.1 Performance Requirements

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| Page load time (initial render) | ≤ 2 seconds | Time from navigation initiation to full DOM paint with data populated. |
| Primary list query response | ≤ 1 second | Server-side API response time. Optimized by composite index `idx_payment_requests_manager_id_status`. |
| Detail load & auto-review transition | ≤ 1.5 seconds | Time from selecting a row to detail render and status update. |
| Action commit processing | ≤ 1 second | Database transaction and WS notification commit cycle. |

### 13.2 Caching Strategy

| Cache Domain | Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| Master lookup tables | `lookup:<table_name>` | 86,400 seconds (24 hours) | Administrator modification of master data. |
| Payment request payload | `payment_request:payload:<id>` | 600 seconds (10 minutes) | Any status transition, field update, or action on the request. Evicted via `DEL` on transaction commit. |

### 13.3 Responsive Design Requirements

| Device Category | Viewport Range | Layout Adaptation |
| :--- | :--- | :--- |
| Desktop | ≥ 1024px | Two-column split layout with list on left, detail view on right. |
| Tablet | 768px – 1023px | Single-column layout. Row click collapses list and opens detail panel as modal overlay. |
| Mobile | < 768px | Stacked card view. Hides less critical columns, optimized modal interfaces for comments and actions. |

### 13.4 Display Order / Sorting Rules

The primary verification queue list displays records in accordance with the following sorting rules:

1. **Status Code (`status_id`)**: Ascending (routing `SUBMITTED_MANAGER` to the top to prioritize newly submitted items).
2. **Created Date (`created_date`)**: Descending (most recent submissions first).

---

## 14. Configurable Items (External Definitions)

The following system properties are defined externally in the application's configuration file (`.env` or environment variables) and can be modified without altering compilation code:

| Definition Key | Parameter Classification | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `REJECTION_COMMENT_MIN_LENGTH` | Integer | `10` | Enforces minimum character limit for rejection explanations. |

---

## 15. Cross-Reference Traceability Matrix

### 15.1 Requirements Definition Traceability

| Requirement ID | Requirement Description | Covered By (This Spec) |
| :--- | :--- | :--- |
| **REQ-007** | Auto transition to "Manager Reviewing" on open. | Section 3.1 (TR-MGR-01), Section 4.6 (BR-MGR-007), Section 6.2 |
| **REQ-008** | Review all details and receipt attachments. | Section 1.2, Section 4.4 (BR-MGR-005), Section 5.2.1 |
| **REQ-009** | Verify request, change status to "Manager Verified (OK)", return to Applicant. | Section 3.1 (TR-MGR-02), Section 4.6 (BR-MGR-008), Section 6.3 |
| **REQ-010** | Reject request, mandatory comment, change to "Rejected by Manager", return to Applicant. | Section 3.1 (TR-MGR-03), Section 4.6 (BR-MGR-009, BR-MGR-010), Section 6.4 |
| **REQ-011** | Create ApprovalLog entry on action. | Section 4.7 (BR-MGR-011, BR-MGR-012), Section 6.2, 6.3, 6.4 |

### 15.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `payment_requests` | Fetch pending queue (6.1), auto-update to `MANAGER_REVIEWING` (6.2), update status to `MANAGER_VERIFIED` (6.3) or `REJECTED_MANAGER` (6.4). |
| `payment_breakdown_items` | Read breakdown items for read-only grid display (5.2.1, 6.2). |
| `receipt_files` | Fetch download URLs and preview targets for receipt files (5.2.1, 6.2). |
| `approval_logs` | Display timeline history (5.2.1); insert new transition audit records (6.2, 6.3, 6.4). |
| `users` | Resolve applicant names, branch, and role details (6.1, 6.2). |

### 15.3 Related Document References

| Document ID | Document Name | File Path |
| :-- | :--- | :--- |
| PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` |
| PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` |
| PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` |
| PRWM-SIS-SCR-002 | Screen Items Specification — Manager Dashboard | `docs/screens/02_manager_dashboard/MANAGER_05_画面項目設計書_SCREEN_ITEMS.md` |
| PRWM-DDS-SCR-002 | Detail Design Specification — Manager Dashboard | `docs/screens/02_manager_dashboard/MANAGER_06_詳細設計書_DETAIL_DESIGN.md` |

---

## Appendix A: Status Code Quick Reference

| Status ID | Status Code | Display Name | Editable | Terminal | Assigned To |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `DRAFT` | Draft | ✓ | ✗ | Applicant |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✗ | ✗ | Manager |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✗ | ✗ | Manager |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✗ | ✗ | Applicant |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✗ | Applicant |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✗ | ✗ | Final Approver |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✗ | ✗ | Final Approver |
| 8 | `APPROVED` | Approved | ✗ | ✗ | Accounting |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✗ | Applicant |
| 10 | `PAID` | Paid (Completed) | ✗ | ✓ | N/A |

---

## Appendix B: Approval Action Types Quick Reference

| Action Type ID | Action Code | Action Type | Description |
| :---: | :--- | :--- | :--- |
| 1 | `CREATED` | Created | Payment request draft initialized. |
| 2 | `EDITED` | Edited | Draft or rejected request modified by applicant. |
| 3 | `SUBMITTED` | Submitted | Request submitted by applicant for review. |
| 4 | `MGR_REVIEW_START` | Manager Review Started | System auto-transition on manager open. |
| 5 | `MGR_VERIFIED` | Manager Verified | Manager completed verification successfully. |
| 6 | `MGR_REJECTED` | Manager Rejected | Manager rejected request back to applicant. |
| 7 | `APPR_REVIEW_START` | Approver Review Started | System auto-transition on approver open. |
| 8 | `APPROVED` | Approved | Final Approver authorized the payment request. |
| 9 | `APPR_REJECTED` | Approver Rejected | Final Approver rejected request back to applicant. |
| 10 | `PAYMENT_COMPLETED` | Payment Completed | Accounting completed payment processing. |

---

## Appendix C: Standard Database Schema Reference

### C.1 Core Tables Used by This Screen

| Table Name | Purpose | Key Columns |
| :--- | :--- | :--- |
| `payment_requests` | Stores payment request headers and assignment tracking. | `payment_request_id`, `status_id`, `applicant_user_id`, `manager_user_id`, ... |
| `payment_breakdown_items` | Stores individual line item details. | `payment_breakdown_item_id`, `payment_request_id`, `line_number`, `amount`, ... |
| `receipt_files` | Metadata paths for uploaded receipt attachments. | `receipt_file_id`, `payment_request_id`, `file_storage_path`, `is_deleted`, ... |
| `approval_logs` | Audit log tracking all actions and comments. | `approval_log_id`, `payment_request_id`, `action_type_id`, `comment`, ... |
| `users` | User information for applicants and reviewers. | `user_id`, `role_id`, `full_name`, `branch`, `is_active`, ... |

---

## Appendix D: Glossary & Terminology (用語集)

| Term (English) | Term (Japanese) | Definition |
| :--- | :--- | :--- |
| State Transition | 状態遷移 | A change in `payment_requests.status_id` according to the defined state diagram. |
| Approval Log | 承認履歴ログ | Immutable audit table (`approval_logs`) tracking all actions, transitions, and comments. |
| Applicant | 申請者 | Employee submitting payment requests. |
| Manager | 担当マネージャー | First-level reviewer; verifies request details. |
| Final Approver | 最終承認者 | Second-level reviewer; makes final approval decision. |
| Accounting | 経理 | Finance team; processes payments and marks requests complete. |
| Soft Delete | 論理削除 | Logical deletion using `is_deleted` flag; physical records retained for audit. |
| RBAC | ロールベースアクセス制御 | Authorization model based on user's assigned role. |
| Receipt File | 領収書ファイル | Attachment (PDF, JPG, PNG) supporting the payment request. |
| Guard Condition | ガード条件 | Preconditions that must be satisfied before a state transition or action is permitted. |
| Optimistic Locking | 楽観的ロック | Concurrency control using `modified_date` comparison to detect conflicting updates. |
| WebSocket Room | WebSocketルーム | Named channel for targeted real-time notification delivery. |

---

*End of Functional Specification — Manager Dashboard (担当マネージャーダッシュボード)*