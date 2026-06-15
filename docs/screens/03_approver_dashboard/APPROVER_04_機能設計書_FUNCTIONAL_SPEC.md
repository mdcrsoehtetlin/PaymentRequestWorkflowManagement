# Functional Specification (機能設計書) — Approver Dashboard

**Document ID:** PRWM-FSD-SCR-003  
**Target Screen:** Approver Dashboard / Final Approver Workflow (最終承認者ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Final Approver Operations  
**Function ID:** FN-3.4.3  
**Version:** 1.0  
**Created:** 2026-06-15  
**Last Updated:** 2026-06-15  
**Author:** Senior Principal Architect  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-15 | Senior Principal Architect | Initial release covering Final Approver Workflow, automatic status transitions, review capabilities, approval/rejection logic, comment validation, real-time WebSocket updates, and audit trail generation. 

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

This screen serves as the primary operational portal for users assigned the `APPROVER` role (Final Approver) within the Payment Request Workflow Management System. It manages the final decision phase of the payment request lifecycle. The screen allows the Final Approver to inspect the verification work completed by the Manager, examine the breakdown details and digital receipts, view the complete historical log (ApprovalLog), and make a final decision to either Approve or Reject the request.

This function represents the second-level verification gate, and its completion is the entry point for the Accounting queue.

### 1.2 Functional Responsibilities

This screen is responsible for the following core functional areas:

1. **Pending Approvals Queue Display** — Renders a list of all payment requests currently in states awaiting final approver attention (`Submitted to Approver` or `Approver Reviewing`).
2. **Automatic Status Transition on Open** — Automatically updates the request status to `Approver Reviewing` the moment a request in `Submitted to Approver` status is opened by the Final Approver, giving other users real-time visibility.
3. **Comprehensive Read-Only Review** — Renders all header details, payment amounts, line item breakdowns, and digital receipt attachments in a read-only view.
4. **Approval Log Audit Trail Review** — Displays a chronological timeline of all prior approval actions, actor names, transition dates, and comments.
5. **Approval Action** — Updates request status to `Approved`, transitions assignment to Accounting, and registers the action in the immutable audit log.
6. **Rejection Action** — Validates a mandatory comment (minimum 10 characters), transitions request status to `Rejected by Approver`, returns assignment to the Applicant, and registers the action in the audit log.

### 1.3 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `APPROVER` role (`role_code = 'APPROVER'`) |
| **Required Authentication** | JWT Bearer Token (validated per request) |
| **Data Scope** | All payment requests in `Submitted to Approver` or `Approver Reviewing` statuses |

### 1.4 Relationships with Other Functions and Peripheral Systems

```text
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│        Applicant         │      │     payment_requests Table          │
│ (Submit manager-verified)├─────►│ status_id = SUBMITTED_APPROVER      │
└──────────────────────────┘      └──────────────┬────────────────────┘
                                                 │ User opens detail page
                                                 ▼
                                      ┌────────────────────────┐
                                      │   Approver Dashboard   │
                                      │ (status: REVIEWING)    │
                                      └──────────┬─────────────┘
                                                 │ Approve / Reject
                                                 ▼
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│   Accounting/Applicant   │      │     payment_requests Table          │
│ (View Approved/Rejected) │◄─────┤ status_id = APPROVED or             │
│                          │      │           REJECTED_APPROVER         │
└──────────────────────────┘      └─────────────────────────────────────┘
```

### 1.5 Inputs / Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `payment_requests` | Database Table | Consumes request details matching `status_id` in (SUBMITTED_APPROVER, APPROVER_REVIEWING). |
| `payment_breakdown_items`| Database Table | Consumes breakdown items linked to the selected request. |
| `receipt_files` | Database Table | Consumes receipt file paths linked to the selected request. |
| `approval_logs` | Database Table | Consumes historical timeline actions for the selected request. |
| `users` | Database Table | User records linked to the applicant and previous verifiers. |
| Rejection Comment | User Input UI | Mandatory text field (at least 10 characters) entered by the Final Approver. |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `payment_requests`| Database Table | Sets `status_id` to `APPROVER_REVIEWING`, `APPROVED`, or `REJECTED_APPROVER`. Updates `approval_date`, `modified_date`, and `current_assigned_to_user_id`. |
| Created `approval_logs` | Database Table | Appends a new immutable log record mapping the transition details. |
| WebSocket Event | Network Message | Dispatches `statusUpdate` event indicating status transition to connected clients. |
| Dashboard Toast / UI List | UI Display | Visual confirmation banner and list refresh. |

### 1.6 Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `REQUIREMENT_DEFINITION.md` | Section 3.4.3 (Final Approver Workflow), Rule 4.1.2, 4.1.3, 4.1.4, 4.1.5 |
| 2 | PRWM-DBS-001 | Database Design Specification | `DATABASE_DESIGN_SPECIFICATION.md` | Table schemas for `payment_requests`, `approval_logs` |
| 3 | PRWM-FSD-SCR-001 | Applicant Dashboard Functional Spec | `04_機能設計書_FUNCTIONAL_SPEC.md` | Reference for applicant resubmission logic |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-APPR-001 | View Pending Request Queue | User is authenticated with `APPROVER` role. | Renders list of requests with status `Submitted to Approver` or `Approver Reviewing`. | Final Approver |
| UC-APPR-002 | View Request Details and History | Request exists in pending queue. | Displays complete request details. If status was `Submitted to Approver`, transitions automatically to `Approver Reviewing`, writes log, and notifies via WS. | Final Approver |
| UC-APPR-003 | Approve Request | Request is currently displayed in detail view in `Approver Reviewing` status. | Status transitions to `Approved`, assigned to `Accounting` role queue, writes log, and broadcasts WS event. | Final Approver |
| UC-APPR-004 | Reject Request | Request is currently displayed in detail view in `Approver Reviewing` status. Mandatory comment is provided (>= 10 chars). | Status transitions to `Rejected by Approver`, assigned back to Applicant, writes log, and broadcasts WS event. | Final Approver |

### 2.2 Primary Business Workflow

```
                        ┌──────────────────┐
                        │  Approver Login  │
                        │  (JWT Verified)   │
                        └────────┬─────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────┐
                    │  Approver Dashboard Queue   │
                    │ (Load Status Requests)      │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │     Open Request Detail     │
                    │   (Auto Update Status:      │
                    │   to Reviewing via API)     │
                    └──────────┬──────────────────┘
                               │
               ┌───────────────┴───────────────────┐
               ▼                                   ▼
     ┌──────────────────┐                ┌──────────────────┐
     │  Approve Action  │                │  Reject Action   │
     │  (Click Button)  │                │ (Submit Comment) │
     └─────────┬────────┘                └─────────┬────────┘
               │                                   │
               │                                   ▼
               │                        ┌────────────────────┐
               │                        │Validate Comment Length│
               │                        │(>= 10 Characters)  │
               │                        └──────────┬─────────┘
               │                                   │ Pass
               ▼                                   ▼
    ┌───────────────────────┐            ┌───────────────────────┐
    │ Transaction Commit:   │            │ Transaction Commit:   │
    │ 1. Status -> APPROVED │            │ 1. Status -> REJECTED │
    │ 2. Assign ->Accountant│            │ 2. Assign -> Applicant│
    │ 3. Write ApprovalLog  │            │ 3. Write ApprovalLog  │
    └──────────┬────────────┘            └──────────┬────────────┘
               │                                   │
               └─────────────────┬─────────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │ Send WebSocket Update Event │
                    │   Return to Queue View      │
                    └─────────────────────────────┘
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Applicant submits manager-verified request | `MANAGER_VERIFIED` | `SUBMITTED_APPROVER` | Final Approver |
| 2 | Final Approver opens request details | `SUBMITTED_APPROVER` | `APPROVER_REVIEWING` | Final Approver |
| 3a | Final Approver authorizes request | `APPROVER_REVIEWING` | `APPROVED` | Accounting |
| 3b | Final Approver rejects request with comment | `APPROVER_REVIEWING` | `REJECTED_APPROVER` | Applicant |

### 2.4 Relevant Requirements Covered

| Requirement ID | Requirement Summary |
| :--- | :--- |
| REQ-012 | When a Final Approver opens a request in "Submitted to Approver" status, status automatically changes to "Approver Reviewing". |
| REQ-013 | Final Approver can review all details and approval history (ApprovalLog). |
| REQ-014 | Final Approver can approve a request, changing status to "Approved" and routing it to Accounting queue. |
| REQ-015 | Final Approver can reject a request, changing status to "Rejected by Approver". A mandatory comment field must be provided. The request returns to Applicant. |
| REQ-016 | When Final Approver performs an action, an ApprovalLog entry is created. |

---

## 3. State Transition Specification

### 3.1 Actor-Controllable State Transitions

These transitions are driven by direct action or triggers initiated within this screen subsystem by the Final Approver:

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-APPR-01 | `SUBMITTED_APPROVER` | `APPROVER_REVIEWING` | System auto-triggers when Final Approver opens the request details page. | Authenticated user has role `APPROVER`. |
| TR-APPR-02 | `APPROVER_REVIEWING` | `APPROVED` | Approver clicks "Approve" button and confirms. | Authenticated user has role `APPROVER`. Request is assigned to final approver queue. |
| TR-APPR-03 | `APPROVER_REVIEWING` | `REJECTED_APPROVER` | Approver types comment and clicks "Reject" button. | Authenticated user has role `APPROVER`. Comment length must be >= 10 characters. |

### 3.2 Actor-Observable Status Set

| Status ID | Status Code | Display Name | Can View | Can Edit Data | Can Delete | Can Approve / Reject |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| | `SUBMITTED_APPROVER` | Submitted to Approver | ✓ | ✗ | ✗ | ✓ (Triggers status change to Approver Reviewing) |
| | `APPROVER_REVIEWING` | Approver Reviewing | ✓ | ✗ | ✗ | ✓ |
| | `APPROVED` | Approved | ✓ (History) | ✗ | ✗ | — |
| | `REJECTED_APPROVER` | Rejected by Approver | ✓ (History) | ✗ | ✗ | — |

### 3.3 Editable Status Set Definition

Not applicable. The Final Approver actor has **no edit privileges** over any request header fields, breakdown items, or receipt attachments. The request is locked and rendered exclusively in read-only mode.

The only fields writable by this actor are the `comment` input field in the rejection modal and the approval action trigger buttons.

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-APPR-001 | Role-based Queue Access | Final Approvers are permitted to view and interact with all payment request records that have reached statuses `SUBMITTED_APPROVER` or `APPROVER_REVIEWING`. They cannot query Drafts or manager-level requests. | Backend (`RolesGuard` + TypeORM status filter) |
| BR-APPR-002 | Access Token Scope Verification | Every query or transaction endpoint requires a valid JWT token matching `role_code = 'APPROVER'`. | Backend (`JwtAuthGuard` + `RolesGuard`) |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APPR-003 | Detail Immutability | Under no circumstances can the Final Approver alter the requested payment amount, dates, currency, bank details, breakdown items, or uploaded receipts. If details are incorrect, the request must be rejected. |
| BR-APPR-004 | Post-Action Queue Eviction | Once a request is approved or rejected, it is immediately removed from the active pending queue view of the Final Approver. |

### 4.3 Deletion Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APPR-005 | No Deletion Privilege | The Final Approver has no physical or logical deletion privileges. The logical deletion check is restricted exclusively to the Applicant in `DRAFT` status. |

### 4.4 Receipt File Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APPR-006 | Receipt Read-only Access | The Final Approver can read and download uploaded receipt attachments. The system provides temporary authenticated download links. |

### 4.5 Amount Calculation Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APPR-007 | Immutable Calculated Fields | The total amount rendered on the screen must match `payment_requests.total_amount` which is read-only. The breakdown table sum is verified against the header total. |

### 4.6 Workflow-Specific Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APPR-008 | Mandatory Rejection Comment | A rejection action is strictly blocked unless the Final Approver provides a comment explaining the rejection. The comment must be at least 10 characters long. |
| BR-APPR-009 | Workflow Restart on Approver Rejection | If a Final Approver rejects a request (status = `Rejected by Approver`), the request returns to the Applicant. Upon resubmission, the workflow must start over from the Manager (`Submitted to Manager`). |
| BR-APPR-010 | Automatic Status Transition on View | Opening a request in status `SUBMITTED_APPROVER` must automatically update the status to `APPROVER_REVIEWING` in a database transaction and log it. |

### 4.7 Audit Trail Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APPR-011 | Immutable Audit Logging | Every action (automatic status update to Reviewing, Approve, Reject) must write a record to `approval_logs` with the actor's user ID, timestamps in UTC, action code, previous/new status IDs, comment (if rejection), IP address, and browser user agent. |

---

## 5. Screen Specifications

### 5.1 Screen: Pending Approvals Queue (`/approver/dashboard`)

**Purpose:** Displays the list of requests currently awaiting the Final Approver's action.

#### 5.1.1 UI Elements

**Data Grid Table:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-01 | Request Number | `payment_requests.request_number` | "PRF-YYYY-NNN" (Anchor Link to detail view) | ✓ | ✓ |
| COL-02 | Applicant | `users.full_name` (Applicant) | String | ✓ | ✓ |
| COL-03 | Branch | `users.branch` (Applicant) | String | ✗ | ✓ |
| COL-04 | Application Date | `payment_requests.application_date` | YYYY-MM-DD | ✓ | ✓ |
| COL-05 | Total Amount | `payment_requests.total_amount` | Currency + Decimal (e.g. USD 1,500.00) | ✓ | ✗ |
| COL-06 | Desired Payment Date| `payment_requests.desired_payment_date`| YYYY-MM-DD | ✓ | ✗ |
| COL-07 | Status | `payment_statuses.status_name` | Badge (Yellow: Submitted, Blue: Reviewing) | ✓ | ✓ |

**Action Controls:**
* **Refresh Button:** Forces reloading of the grid.
* **Search Input:** Filters grid dynamically by Request Number or Applicant Name.

**Default Filter:** `status_id = Submitted to Approver OR status_id = Approver Reviewing`. Sorted by `application_date ASC`.

---

### 5.2 Screen: Request Detail View (`/approver/requests/:id` or Modal)

**Purpose:** Renders the full details of a single request, history, and approval actions.

#### 5.2.1 Read-Only Display Sections

**Applicant Information:**
* Employee Number (`employee_number`)
* Full Name (`full_name`)
* Branch (`branch`)
* Department (`department`)

**Payment Header Info:**
* Application Date (`application_date`) — YYYY-MM-DD
* Desired Payment Date (`desired_payment_date`) — YYYY-MM-DD
* Total Amount (`total_amount`) — e.g. USD 1,500.00
* Currency Type — e.g. USD
* Payment Type — e.g. Expense Reimbursement
* Payment Method — e.g. Bank Transfer
* Bank Account Info (`bank_account_info`) — (Only displayed if method is Bank Transfer or Cash)
* Purpose (`purpose`)

**Request Details & Attachments:**
* Detailed Content Description (`request_content`)
* Receipt Attached Flag (`has_receipt`) — Yes / No
* Uploaded Receipt Files — List of links to download digital attachments: e.g., `[OfficeSupplies_20260609_01.pdf]`

**Payment Breakdown Table (支払内訳):**
* Rendered grid displaying columns: `Line No`, `Date`, `Description`, `Amount` (Sum must match Total Amount).

**Approval History Timeline (承認履歴):**
* Chronological list representing `approval_logs` data. Displays:
  * Date/Time (converted to user's local timezone)
  * Actor Name & Role
  * Action Label (e.g. Created, Submitted, Manager Verified, Approver Review Started)
  * Rejection Comments (if any) in italic blockquotes.

#### 5.2.2 Actor Controls

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| **Approve Button** | Button (Primary Green) | Triggers approval flow. Displays confirmation modal: "Are you sure you want to approve this request?". |
| **Reject Button** | Button (Danger Red) | Opens Rejection Modal requiring comment. |
| **Rejection Comment Input**| Text Area | In Rejection Modal. Length validator enforced (>=10 chars). |
| **Cancel Rejection Button**| Button | Closes Rejection Modal and resets input. |
| **Submit Rejection Button**| Button | Submits rejection and transitions request back to Applicant. |

---

## 6. Functional Operation Specification

### 6.1 Operation: Fetch Pending Queue List

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Initial dashboard load, pagination change, or click refresh button. |
| **Data Source** | API Endpoint: `GET /api/payment-requests/approver/pending` |
| **Query Filter** | `status_id IN (SUBMITTED_APPROVER, APPROVER_REVIEWING) AND is_deleted = FALSE` |
| **Default Sort** | `application_date ASC` |
| **Pagination** | Server-side pagination. Default: 20 records per page. |
| **Display Fields** | Request number, applicant name, branch, application date, total amount, desired payment date, status name. |
| **Real-Time Update** | Grid automatically updates or triggers refetch when a `statusUpdate` WebSocket event is received for status changes. |

### 6.2 Operation: Open Request Details (Auto Status Change)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | User clicks a request number link in the grid. |
| **Guard Condition** | JWT role check (`role_code = 'APPROVER'`). Request exists and is active. |
| **Processing Steps**| 1. Query request details, breakdown items, receipt paths, and approval history logs.<br>2. **If status is `SUBMITTED_APPROVER`:**<br>&nbsp;&nbsp;&nbsp;&nbsp;a. Begin Database Transaction.<br>&nbsp;&nbsp;&nbsp;&nbsp;b. Update `payment_requests` set `status_id = APPROVER_REVIEWING`, `modified_date = CURRENT_TIMESTAMP`. Assign `current_assigned_to_user_id` to current Approver user.<br>&nbsp;&nbsp;&nbsp;&nbsp;c. Insert record into `approval_logs` (`action_type_id` mapping to `APPR_REVIEW_START`, previous status `SUBMITTED_APPROVER`, new status `APPROVER_REVIEWING`).<br>&nbsp;&nbsp;&nbsp;&nbsp;d. Commit Transaction.<br>&nbsp;&nbsp;&nbsp;&nbsp;e. Evict Redis cache payload (`DEL payment_request:payload:<id>`).<br>&nbsp;&nbsp;&nbsp;&nbsp;f. Dispatch WebSocket `statusUpdate` event to notifying status transition to Reviewing.<br>3. Render detail view UI with fetched data. |
| **Concurrency Control**| Optimistic lock comparison on status. If status has changed from `SUBMITTED_APPROVER` before transaction executes, return conflict error (HTTP 409). |

### 6.3 Operation: Confirm Approval

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Approver clicks "Approve" and confirms in validation modal. |
| **Guard Condition** | Request status must be `APPROVER_REVIEWING`. Authenticated user is `APPROVER`. |
| **API Endpoint** | `POST /api/payment-requests/:id/approve` |
| **Request Payload** | `{}` (Parameters parsed from route ID) |
| **Processing Steps**| 1. Begin Database Transaction.<br>2. Verify request status is `APPROVER_REVIEWING`.<br>3. Update `payment_requests` set `status_id = APPROVED`, `approval_date = CURRENT_TIMESTAMP`, `modified_date = CURRENT_TIMESTAMP`, `final_approver_user_id = current_user.id`, `current_assigned_to_user_id = NULL` (routes to global Accounting role queue).<br>4. Insert `approval_logs` entry mapping to `APPROVED` action, previous status `APPROVER_REVIEWING`, new status `APPROVED`.<br>5. Commit Transaction.<br>6. Evict Redis cache payload (`DEL payment_request:payload:<id>`).<br>7. Broadcast WebSocket `statusUpdate` event (payload sets status to `APPROVED`). |
| **Response Payload** | `{ "success": true, "message": "Request successfully approved." }` |

### 6.4 Operation: Confirm Rejection

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Approver types rejection comment and clicks "Submit Rejection" button in modal. |
| **Guard Condition** | Request status must be `APPROVER_REVIEWING`. Rejection comment must pass validation check (non-empty, >=10 characters). |
| **API Endpoint** | `POST /api/payment-requests/:id/reject-approver` |
| **Request Payload** | `{ "comment": "String (minimum 10 characters)" }` |
| **Processing Steps**| 1. Validate comment length. If failed, abort and return validation error.<br>2. Begin Database Transaction.<br>3. Verify request status is `APPROVER_REVIEWING`.<br>4. Fetch applicant ID (`applicant_user_id`).<br>5. Update `payment_requests` set `status_id = REJECTED_APPROVER`, `modified_date = CURRENT_TIMESTAMP`, `final_approver_user_id = current_user.id`, `current_assigned_to_user_id = applicant_user_id`. (returns assignment to Applicant).<br>6. Insert `approval_logs` entry mapping to `APPR_REJECTED` action, previous status `APPROVER_REVIEWING`, new status `REJECTED_APPROVER`, saving the user comment.<br>7. Commit Transaction.<br>8. Evict Redis cache payload (`DEL payment_request:payload:<id>`).<br>9. Broadcast WebSocket `statusUpdate` event (payload sets status to `REJECTED_APPROVER`). |
| **Response Payload** | `{ "success": true, "message": "Request successfully rejected and returned to applicant." }` |

---

## 7. Input / Output Specification

### 7.1 Input Specification (入力定義)

This screen is read-only for request parameters. The only interactive inputs are:

| Field (Physical Name) | Display Name | Data Type & Length | Required | Input Control | Validation Rules / Notes |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `comment` | Rejection Comment | TEXT (up to 1000 characters) | Yes (for Rejection only) | Text Area in Rejection Modal | Mandatory for rejection. Enforces minimum length of 10 characters. |

### 7.2 Output Specification (出力定義)

Details rendered in detail view match specification in **Section 5.2.1** reading from:
* `payment_requests` table
* `payment_breakdown_items` table
* `receipt_files` table
* `approval_logs` table

---

## 8. Input Validation Rules

### 8.1 Submission / Action Validation (Strict Mode)

| Section | Field | Display Name | Validation Rule | Error Message |
| :--- | :--- | :--- | :--- | :--- |
| **Rejection Modal** | `comment` | Rejection Comment | Must be non-empty and have a minimum length of 10 characters. | "Rejection comment is mandatory and must be at least 10 characters long." |

---

## 9. Error Handling Specification

### 9.1 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Comment missing or < 10 characters during rejection submission. | Highlights comment field in red, displays validation error message inline. |
| `403` | `FORBIDDEN` | Authenticated user is not an Approver or attempts to access detail of request not in status `SUBMITTED_APPROVER` or `APPROVER_REVIEWING`. | Blocks access, displays: "Access denied. You do not have the required permissions for this action." |
| `409` | `CONFLICT` | Optimistic locking scenario where another approver has approved/rejected the request while this user had detail view open. | Displays modal dialog: "This request has already been processed by another user. Dashboard has been updated." User redirects to dashboard queue. |
| `500` | `INTERNAL_SERVER_ERROR` | Connection drop or transaction rollback failure during commit. | Displays alert toast: "A system error occurred while saving approval details. Please try again." |

---

## 10. Permission and Access Control

### 10.1 Authentication Requirements

Enforces standard JSON Web Token validation. Token transport via standard Bearer HTTP header. Sliding session window is refreshed client-side.

### 10.2 Authorization Guard Architecture

Every endpoint for final approver actions runs through:
1. `JwtAuthGuard` — Checks token validity and parses user payload.
2. `RolesGuard` — Validates user has role code `APPROVER`.
3. `AssignmentGuard` — For approve/reject operations, verifies the request status is `APPROVER_REVIEWING` and current assignee field checks.

### 10.3 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Description |
| :--- | :---: | :--- | :--- |
| `/api/payment-requests/approver/pending` | `GET` | `APPROVER` | Fetch queue list. |
| `/api/payment-requests/:id` | `GET` | `APPROVER` | Fetch single request details (Triggers auto status transition to `APPROVER_REVIEWING` if currently `SUBMITTED_APPROVER`). |
| `/api/payment-requests/:id/approve` | `POST` | `APPROVER` | Process approval workflow transition. |
| `/api/payment-requests/:id/reject-approver` | `POST` | `APPROVER` | Process rejection workflow transition. |

---

## 11. Real-Time Notification Behavior

### 11.1 WebSocket Configuration

* **Room Membership:** Final Approvers join the role-based room named `'APPROVER'`.
* **Latency Requirement:** Notification of status transitions must be dispatched within ≤ 500 milliseconds of transaction commit.

### 11.2 Notification Events Received by This Screen

* **Event `statusUpdate`:** Sent by system when requests transition status.
  * *UI Response:* If detail modal is open for that ID, displays warning notification and locks actions. Refresh pending queue list.

### 11.3 Notification Events Dispatched by This Screen's Actions

* **Approve Action:** Dispatches `statusUpdate` to `'ACCOUNTING'` and `'user:<applicant_id>'` rooms.
* **Reject Action:** Dispatches `statusUpdate` to `'user:<applicant_id>'` room.

---

## 12. Screen Transition Specification

### 12.1 Navigation Rules

* **Inbound Navigation:** Login -> redirects to `/approver/dashboard` if role is `APPROVER`.
* **Internal State Navigation:** Clicking request link opens Detail view modal on the dashboard queue screen.
* **Outbound Navigation:** Logging out, session timeout, or completing action (closes modal and refreshes dashboard list).

---

## 13. Non-Functional Considerations

### 13.1 Performance Requirements

* Page render time: ≤ 2 seconds.
* Detail view loading and auto-transition processing: ≤ 1.5 seconds.
* API response time for actions: ≤ 1 second (optimized via index `idx_payment_requests_status_id`).

### 13.2 Caching Strategy

* **Payload Caching:** Active detail JSON payloads are cached under namespace `payment_request:payload:<id>` in Redis with 10-minute TTL.
* **Invalidation:** Evicted immediately using `DEL` upon approval or rejection commits.

---

## 14. Configurable Items (External Definitions)

| Definition Key | Parameter Classification | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `REJECTION_COMMENT_MIN_LENGTH` | Integer | `10` | Enforces minimum character limit for rejection explanations. |

---

## 15. Cross-Reference Traceability Matrix

### 15.1 Requirements Definition Traceability

| Requirement ID | Requirement Description | Covered By (This Document) |
| :--- | :--- | :--- |
| REQ-012 | Auto transition to "Approver Reviewing" on open. | Section 3.1 (TR-APPR-01), Section 6.2 |
| REQ-013 | Review all details and approval history log. | Section 5.2.1, Section 6.2 |
| REQ-014 | Approve request, change to "Approved", route to Accounting. | Section 3.1 (TR-APPR-02), Section 6.3 |
| REQ-015 | Reject request, comment required, change to "Rejected by Approver", returns to Applicant. | Section 3.1 (TR-APPR-03), Section 6.4, Section 8.1 |
| REQ-016 | Create ApprovalLog entry on action. | Section 4.7 (BR-APPR-011), Section 6.2, 6.3, 6.4 |

### 15.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `payment_requests` | Fetch pending queue, update status to `APPROVER_REVIEWING`, `APPROVED`, or `REJECTED_APPROVER` on open, approve, or reject. |
| `payment_breakdown_items` | Read breakdown items for read-only grid display. |
| `receipt_files` | Fetch download URLs for attached receipt files. |
| `approval_logs` | Display timeline history; insert new transition audit records. |
| `users` | Resolve applicant full name, branch, and role details. |

### 15.3 Related Document References

| Document ID | Document Name | File Path |
| :-- | :--- | :--- |
| PRWM-REQ-001 | Requirements Definition | `docs/core_ja/01_要件定義書_REQUIREMENT_SPEC.md` |
| PRWM-DBS-001 | Database Design Specification | `docs/core_ja/03_データベース設計書_DATABASE_SPEC.md` |
| PRWM-DEV-001 | Development Rules | `docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md` |
---
