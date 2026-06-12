# Functional Specification (機能設計書) — Applicant Dashboard

**Document ID:** PRWM-FSD-SCR-001  
**Target Screen:** Applicant Dashboard (申請者ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Applicant Operations  
**Version:** 1.0  
**Created:** 2026-06-12  
**Last Updated:** 2026-06-12  
**Author:** Senior Principal Architect  
**Review Status:** Approved (承認済み)  
**Classification:** Internal — Engineering Division

---

## Document Revision History

| Version | Date | Author | Description of Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-06-12 | Senior Principal Architect | Initial release. Full functional specification for the Applicant Dashboard subsystem covering use cases, business rules, state transitions, validation, error handling, permission control, and real-time notification behavior. |

---

## Table of Contents

1. [Functional Overview](#1-functional-overview)
2. [Use Cases and Business Workflow](#2-use-cases-and-business-workflow)
3. [State Transition Specification](#3-state-transition-specification)
4. [Business Rules](#4-business-rules)
5. [Functional Operation Specification](#5-functional-operation-specification)
6. [Input Validation Rules](#6-input-validation-rules)
7. [Error Handling Specification](#7-error-handling-specification)
8. [Permission and Access Control](#8-permission-and-access-control)
9. [Real-Time Notification Behavior](#9-real-time-notification-behavior)
10. [Screen Transition Specification](#10-screen-transition-specification)
11. [Non-Functional Considerations](#11-non-functional-considerations)
12. [Cross-Reference Traceability Matrix](#12-cross-reference-traceability-matrix)

---

## 1. Functional Overview

### 1.1 Purpose and Scope

The Applicant Dashboard is the primary operational portal for users assigned the `APPLICANT` role within the Payment Request Workflow Management System. This screen provides the complete set of capabilities necessary for an applicant to manage the full lifecycle of their own payment requests — from initial drafting through final submission to the approval chain.

This subsystem is the entry point for all payment request origination within the enterprise workflow. It is responsible for ensuring that only properly validated, receipt-attached, and business-rule-compliant payment requests enter the downstream verification and approval pipeline.

### 1.2 Functional Responsibilities

The Applicant Dashboard is responsible for the following core functional areas:

1. **Payment Request List Management** — Presenting a consolidated, real-time view of all payment requests originated by the authenticated applicant, organized by status priority and chronological order.
2. **Payment Request Drafting** — Enabling the creation of new payment requests with full header information and up to fifteen (15) payment breakdown line items, persisted as draft records.
3. **Draft Lifecycle Management** — Supporting the editing, updating, and logical (soft) deletion of payment requests while they remain in the `DRAFT` state.
4. **Receipt File Attachment** — Providing file upload capabilities for attaching receipt documentation (PDF, PNG, JPG, JPEG) to payment requests, with enforced naming conventions and size constraints.
5. **Manager Submission** — Validating all mandatory fields and receipt attachment requirements before transitioning a payment request to the `SUBMITTED_MANAGER` state for manager verification.
6. **Final Approver Submission** — Upon successful manager verification (status `MANAGER_VERIFIED`), enabling the applicant to forward the request to the Final Approver by transitioning the status to `SUBMITTED_APPROVER`.
7. **Rejection Response and Resubmission** — Displaying rejection comments from the Manager or Final Approver, and enabling the applicant to modify and resubmit corrected requests.
8. **Approval Timeline Visibility** — Presenting a chronological timeline of all approval actions, status transitions, and reviewer comments associated with each payment request.

### 1.3 Target Users

| Attribute | Value |
| :--- | :--- |
| **Primary Actor** | Authenticated user with `APPLICANT` role (`role_code = 'APPLICANT'`) |
| **Required Authentication** | JWT Bearer Token (validated per request) |
| **Data Scope** | Exclusively the authenticated user's own originated payment requests (`applicant_user_id = current_user.user_id`) |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

The following table enumerates all use cases governed by this functional specification. Each use case is assigned a unique identifier for traceability against the requirements definition and test case specifications.

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-APP-001 | View Payment Request List | User is authenticated with `APPLICANT` role. | All non-deleted payment requests originated by the user are displayed, sorted by status priority and descending creation date. | Applicant |
| UC-APP-002 | Create New Payment Request (Draft) | User is authenticated. No open draft limit exceeded. | A new `payment_requests` record is persisted with `status_id = 1 (DRAFT)`. Corresponding `payment_breakdown_items` records are created. An `approval_logs` entry of type `CREATED` is recorded. | Applicant |
| UC-APP-003 | Edit Existing Draft or Rejected Request | Target request exists with `status_id` ∈ {`1 (DRAFT)`, `5 (REJECTED_MANAGER)`, `9 (REJECTED_APPROVER)`}. Request ownership validated. | Updated fields are persisted. `modified_date` is refreshed. An `approval_logs` entry of type `EDITED` is recorded. | Applicant |
| UC-APP-004 | Soft Delete Draft Request | Target request exists with `status_id = 1 (DRAFT)`. Request ownership validated. | `is_deleted` flag set to `TRUE`. Record is excluded from all standard list queries. No physical deletion occurs. | Applicant |
| UC-APP-005 | Upload Receipt File | Target request exists. Request ownership validated. `has_receipt = TRUE`. | A new `receipt_files` record is created. Physical file is stored at `/uploads/{payment_request_id}/{UUID}_{stored_file_name}`. | Applicant |
| UC-APP-006 | Delete Uploaded Receipt File | Target receipt file exists. Request is in an editable status. Request ownership validated. | `receipt_files.is_deleted` set to `TRUE`. File reference is excluded from subsequent queries. | Applicant |
| UC-APP-007 | Submit to Manager | Target request has all mandatory fields populated. Receipt validation passes (if `has_receipt = TRUE`, at least one active receipt file exists). `manager_user_id` is selected. | `status_id` transitions from `1 (DRAFT)` or `5 (REJECTED_MANAGER)` or `9 (REJECTED_APPROVER)` → `2 (SUBMITTED_MANAGER)`. `submitted_to_manager_date` is recorded. `current_assigned_to_user_id` is set to the selected manager. An `approval_logs` entry of type `SUBMITTED` is recorded. WebSocket notification dispatched to the target manager. | Applicant |
| UC-APP-008 | Submit to Final Approver | Target request has `status_id = 4 (MANAGER_VERIFIED)`. Request ownership validated. | `status_id` transitions from `4 (MANAGER_VERIFIED)` → `6 (SUBMITTED_APPROVER)`. `submitted_to_approver_date` is recorded. An `approval_logs` entry of type `SUBMITTED` is recorded. WebSocket notification dispatched to the Final Approver role room. | Applicant |
| UC-APP-009 | View Rejection Comments and Approval History | Target request exists. Request ownership validated. | Approval log timeline is rendered showing all historical actions, timestamps, actors, and comments for the selected request. | Applicant |
| UC-APP-010 | Receive Real-Time Status Notification | Applicant is connected to WebSocket. A status transition occurs on one of their requests. | Toast notification is displayed. Request list is refreshed to reflect the updated status. | System (Automated) |

### 2.2 Primary Business Workflow (Applicant Perspective)

The following diagram illustrates the complete business workflow from the perspective of the Applicant actor, covering all possible paths from initial drafting through final submission and rejection recovery.

```
                        ┌──────────────────┐
                        │  Applicant Login  │
                        │  (JWT Verified)   │
                        └────────┬─────────┘
                                 │
                                 ▼
                   ┌─────────────────────────────┐
                   │   Applicant Dashboard View   │
                   │  (Payment Request List Load) │
                   └──────────┬──────────────────┘
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                   ▼
    ┌─────────────┐  ┌──────────────┐   ┌──────────────────┐
    │ Create New  │  │ Open Existing│   │ View Rejected    │
    │ Draft (UC-2)│  │ Draft (UC-3) │   │ Request (UC-9)   │
    └──────┬──────┘  └──────┬───────┘   └────────┬─────────┘
           │                │                    │
           ▼                ▼                    ▼
    ┌──────────────────────────────────────────────────┐
    │         Payment Request Form (Edit Mode)          │
    │  ┌─────────────────────────────────────────────┐  │
    │  │ Header: Date, Employee Info, Amount, etc.   │  │
    │  │ Breakdown: 1–15 Line Items                  │  │
    │  │ Receipt Upload: PDF/PNG/JPG/JPEG            │  │
    │  │ Manager Selection: Active MANAGER Dropdown  │  │
    │  └─────────────────────────────────────────────┘  │
    └──────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
   ┌────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Save Draft │ │ Submit to    │ │ Delete Draft  │
   │  (UC-2/3)  │ │ Manager(UC-7)│ │   (UC-4)      │
   └────────────┘ └──────┬───────┘ └──────────────┘
                         │
                   ┌─────┴──────┐
                   ▼            ▼
            ┌───────────┐ ┌──────────────────┐
            │Validation │ │ Validation FAIL  │
            │  PASS     │ │ (Error Display)  │
            └─────┬─────┘ └──────────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │ Status: SUBMITTED    │
        │ _MANAGER (ID: 2)     │
        │ WebSocket → Manager  │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────────────┐
        ▼                             ▼
  ┌────────────────┐         ┌────────────────────┐
  │ MANAGER_VERIFIED│         │ REJECTED_MANAGER   │
  │   (ID: 4)      │         │    (ID: 5)          │
  └───────┬────────┘         └─────────┬──────────┘
          │                            │
          ▼                            ▼
  ┌────────────────────┐      ┌──────────────────────┐
  │ Submit to Final    │      │ Edit & Resubmit      │
  │ Approver (UC-8)    │      │ to Manager (UC-7)    │
  │ Status → SUBMITTED │      │ (Workflow Restarts)  │
  │ _APPROVER (ID: 6)  │      └──────────────────────┘
  └────────┬───────────┘
           │
  ┌────────┴──────────────────────┐
  ▼                               ▼
┌──────────────┐        ┌─────────────────────┐
│  APPROVED    │        │ REJECTED_APPROVER   │
│   (ID: 8)    │        │    (ID: 9)           │
└──────────────┘        └─────────┬───────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ Edit & Resubmit      │
                        │ to Manager (UC-7)    │
                        │ (Full Workflow        │
                        │  Restart Required)   │
                        └──────────────────────┘
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Applicant creates a new payment request | — | `DRAFT` (1) | Applicant |
| 2 | Applicant saves draft (iterative edits) | `DRAFT` (1) | `DRAFT` (1) | Applicant |
| 3 | Applicant uploads receipt file(s) | `DRAFT` (1) | `DRAFT` (1) | Applicant |
| 4 | Applicant submits to selected Manager | `DRAFT` (1) | `SUBMITTED_MANAGER` (2) | Manager |
| 5a | Manager verifies successfully | `MANAGER_REVIEWING` (3) | `MANAGER_VERIFIED` (4) | Applicant |
| 5b | Manager rejects with mandatory comment | `MANAGER_REVIEWING` (3) | `REJECTED_MANAGER` (5) | Applicant |
| 6 | Applicant submits to Final Approver | `MANAGER_VERIFIED` (4) | `SUBMITTED_APPROVER` (6) | Final Approver |
| 7a | Final Approver approves | `APPROVER_REVIEWING` (7) | `APPROVED` (8) | Accounting |
| 7b | Final Approver rejects with mandatory comment | `APPROVER_REVIEWING` (7) | `REJECTED_APPROVER` (9) | Applicant |
| 8 | Applicant edits and resubmits rejected request | `REJECTED_MANAGER` (5) / `REJECTED_APPROVER` (9) | `SUBMITTED_MANAGER` (2) | Manager |

---

## 3. State Transition Specification

### 3.1 Applicant-Controllable State Transitions

The Applicant actor is authorized to initiate the following state transitions only. All other transitions are system-initiated or initiated by other actors (Manager, Final Approver, Accounting).

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-APP-01 | `DRAFT` (1) | `SUBMITTED_MANAGER` (2) | Submit to Manager button | All mandatory fields validated. Receipt attachment validated (if `has_receipt = TRUE`). `manager_user_id` selected and active. |
| TR-APP-02 | `REJECTED_MANAGER` (5) | `SUBMITTED_MANAGER` (2) | Resubmit to Manager button | Same guard conditions as TR-APP-01. Request must have been modified since last rejection. |
| TR-APP-03 | `REJECTED_APPROVER` (9) | `SUBMITTED_MANAGER` (2) | Resubmit to Manager button | Same guard conditions as TR-APP-01. Full workflow restart is enforced — the request must pass through Manager verification again before reaching the Final Approver. |
| TR-APP-04 | `MANAGER_VERIFIED` (4) | `SUBMITTED_APPROVER` (6) | Submit to Final Approver button | Status must be exactly `MANAGER_VERIFIED` (4). No additional field validation required as the request has already been verified by the Manager. |

### 3.2 Applicant-Observable Status Set

The following statuses may appear on the Applicant Dashboard. For each status, the table defines the permitted applicant operations.

| Status ID | Status Code | Display Name | Applicant Can View | Applicant Can Edit | Applicant Can Delete | Applicant Can Submit |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| 1 | `DRAFT` | Draft | ✓ | ✓ | ✓ | Submit to Manager |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✓ | ✗ | ✗ | — |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✓ | ✗ | ✗ | — |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✓ | ✗ | ✗ | Submit to Final Approver |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✓ | ✗ | Resubmit to Manager |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✓ | ✗ | ✗ | — |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✓ | ✗ | ✗ | — |
| 8 | `APPROVED` | Approved | ✓ | ✗ | ✗ | — |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✓ | ✗ | Resubmit to Manager |
| 10 | `PAID` | Paid (Completed) | ✓ | ✗ | ✗ | — |

### 3.3 Editable Status Set Definition

The system defines a request as "editable" when its `status_id` resolves to a record in the `payment_statuses` table where `is_editable_state = TRUE`. Per the master data seed, the editable statuses are:

- `DRAFT` (status_id: 1)
- `REJECTED_MANAGER` (status_id: 5)
- `REJECTED_APPROVER` (status_id: 9)

All form fields, breakdown line items, receipt file attachments, and manager selection are modifiable only when the request is in one of these three states.

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-APP-001 | Self-Originated Request Isolation | The applicant shall have visibility and operational access exclusively to payment requests where `payment_requests.applicant_user_id` equals the authenticated user's `user_id`. Requests originated by other users are categorically excluded from all query results, regardless of URL parameters or direct API invocation. | Backend (TypeORM QueryBuilder `WHERE` clause), API Controller (`@UseGuards(OwnershipGuard)`), Frontend (API response filtering) |
| BR-APP-002 | Direct URL Access Prevention | Attempts to access a payment request detail view via direct URL manipulation (e.g., `/api/payment-requests/999`) where the request is not owned by the authenticated user shall return HTTP `403 Forbidden` with an appropriate error payload. The response body must not leak any information about the existence or content of the target request. | Backend (`OwnershipGuard`) |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-003 | Editable Status Restriction | Modification of payment request fields (header, breakdown items, receipt attachments, manager selection) is permitted only when the request's current `status_id` maps to a `payment_statuses` record where `is_editable_state = TRUE`. Specifically: `DRAFT` (1), `REJECTED_MANAGER` (5), or `REJECTED_APPROVER` (9). |
| BR-APP-004 | Post-Submission Immutability | Once a payment request transitions beyond an editable state (i.e., `SUBMITTED_MANAGER` or any subsequent status), all request data becomes read-only from the applicant's perspective. The edit form shall not be rendered; only the read-only detail view shall be presented. |
| BR-APP-005 | Breakdown Item Freeze | Payment breakdown line items (`payment_breakdown_items`) become read-only upon status transition beyond `DRAFT`. While visible to all reviewers (Manager, Final Approver, Accounting), they cannot be modified by any actor once the request leaves an editable state. |

### 4.3 Deletion Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-006 | Draft-Only Soft Delete | Logical deletion (`is_deleted = TRUE`) of a payment request is permitted exclusively when the request's current `status_id = 1 (DRAFT)`. For any other status, the delete action shall be hidden from the UI and rejected at the API level with HTTP `403 Forbidden`. |
| BR-APP-007 | No Physical Deletion | Payment request records are never physically removed from the `payment_requests` table. The `is_deleted` boolean flag is used to exclude archived records from standard dashboard queries. Soft-deleted records remain accessible for audit and compliance review purposes. |
| BR-APP-008 | Deletion Confirmation Requirement | Prior to executing a soft delete operation, the system shall present a confirmation dialog to the user. The dialog must clearly state that the action will archive the draft and remove it from the active list. The operation shall proceed only upon explicit user confirmation. |

### 4.4 Receipt File Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-009 | Receipt Attachment Enforcement on Submission | When the `has_receipt` field is set to `TRUE` (receipt present = "Yes"), the system shall validate that at least one (1) active (non-deleted) receipt file exists in the `receipt_files` table for the target `payment_request_id` before permitting status transition to `SUBMITTED_MANAGER`. This validation is enforced at both the frontend (pre-submission check) and backend (service layer guard) layers. |
| BR-APP-010 | Permitted File Types | Receipt file uploads are restricted to the following MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`. Files with unrecognized or mismatched MIME types shall be rejected with a descriptive error message. |
| BR-APP-011 | File Size Constraint | Individual receipt file size must not exceed 10 megabytes (10,485,760 bytes). The database enforces this via `CHECK` constraint `chk_receipt_files_file_size`. The total cumulative attachment size per payment request must not exceed 50 megabytes. |
| BR-APP-012 | File Storage Path Convention | Uploaded files are stored in the server filesystem at the path: `/uploads/{payment_request_id}/{UUID}_{stored_file_name}`. The `stored_file_name` follows the payment breakdown content naming convention: `{BreakdownDescription}_{Date}_{SequenceNumber}.{extension}` (e.g., `OfficeSupplies_20260611_01.pdf`). |
| BR-APP-013 | Receipt File Soft Delete Behavior | Receipt files are soft-deleted by setting `receipt_files.is_deleted = TRUE`. Physical files are retained on disk for audit purposes. Soft-deleted receipt files are excluded from active file count validation (BR-APP-009) and from the UI display. |

### 4.5 Amount Calculation Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-014 | Total Amount Auto-Calculation | The `total_amount` field on the `payment_requests` record is derived exclusively from the sum of all `payment_breakdown_items.amount` values associated with the request. The applicant cannot manually input or override the total amount. The frontend dynamically computes and displays the running total as line items are added, modified, or removed. |
| BR-APP-015 | Amount Positivity Constraint | Each individual breakdown line item amount must satisfy `amount > 0`. The computed total amount must also satisfy `total_amount > 0`. These constraints are enforced at both the frontend (input validation) and database (`CHECK` constraint `chk_payment_breakdown_items_amount` and `chk_payment_requests_total_amount`) layers. |
| BR-APP-016 | Decimal Precision | All monetary values support up to two (2) decimal places (e.g., `1,234,567.89`). The database column type `NUMERIC(12,2)` for `total_amount` and `NUMERIC(10,2)` for individual line item `amount` enforce this precision. Values are mapped to JavaScript `string` type in the TypeORM entity layer to prevent floating-point precision loss. |

### 4.6 Manager Selection Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-017 | Dynamic Manager List | The manager selection dropdown is populated dynamically from the `users` table, filtered by `role_id` corresponding to the `MANAGER` role code and `is_active = TRUE`. Inactive or non-manager users shall not appear in the selection list. |
| BR-APP-018 | Manager Assignment on Submission | The selected `manager_user_id` is persisted to the `payment_requests` record upon draft save and is used as the routing target when the request transitions to `SUBMITTED_MANAGER`. The `current_assigned_to_user_id` field is simultaneously updated to match the selected manager. |

### 4.7 Workflow Restart Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-019 | Approver Rejection Full Restart | When a payment request is rejected by the Final Approver (status `REJECTED_APPROVER`, ID: 9), the applicant must edit and resubmit the request to a Manager. The workflow restarts from the Manager verification stage — the request cannot be submitted directly to the Final Approver from a rejected state. The entire approval chain must execute again. |
| BR-APP-020 | Manager Rejection Partial Restart | When a payment request is rejected by the Manager (status `REJECTED_MANAGER`, ID: 5), the applicant may edit the request and resubmit it to the same or a different Manager. The workflow resumes from the Manager verification stage. |

---

## 5. Functional Operation Specification

### 5.1 Operation: Payment Request List Display

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant navigates to the Dashboard screen, or screen refresh event occurs. |
| **Data Source** | `GET /api/payment-requests/my-requests` with authenticated user context. |
| **Query Filter** | `applicant_user_id = current_user.user_id AND is_deleted = FALSE` |
| **Default Sort** | Primary: `status_id` (ascending display order per `payment_statuses.display_order`), Secondary: `created_date` (descending). |
| **Pagination** | Server-side pagination. Default page size: 10 records. Query parameters: `page` (default: 1), `limit` (default: 10). |
| **Status Filter** | Optional. Client-side status filter dropdown allows filtering by specific `status_code` values. |
| **Display Fields** | Request Number (`request_number`), Application Date (`application_date`), Total Amount (`total_amount`), Currency Code (resolved from `currencies.currency_code`), Status Name (resolved from `payment_statuses.status_name`), Created Date (`created_date`). |
| **Real-Time Update** | List automatically refreshes when a WebSocket `statusUpdate` event is received for any request owned by the current user. |

### 5.2 Operation: Create New Payment Request (Save Draft)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant clicks the "Create New Request" (新規申請作成) button. |
| **API Endpoint** | `POST /api/payment-requests` |
| **Request Content-Type** | `application/json` |
| **Authentication** | `Authorization: Bearer <JWT>` header required. |
| **Payload Structure** | JSON object containing header fields (`application_date`, `desired_payment_date`, `currency_id`, `payment_type_id`, `payment_method_id`, `purpose`, `bank_account_info`, `request_content`, `has_receipt`, `manager_user_id`) and a nested `items` array of breakdown line items (each with `line_number`, `item_date`, `description`, `amount`, `quantity`, `unit_price`). |
| **Processing Steps** | 1. Validate authenticated user has `APPLICANT` role. 2. Generate unique `request_number` in format `PRF-YYYY-NNNNNN`. 3. Set `applicant_user_id` from JWT payload. 4. Set `status_id = 1 (DRAFT)`. 5. Compute `total_amount` from sum of line item amounts. 6. Persist `payment_requests` record. 7. Persist associated `payment_breakdown_items` records. 8. Write `approval_logs` entry with `action_type_id` = `CREATED`. 9. Return `201 Created` with the newly created request object. |
| **Draft Save Behavior** | Draft save does not enforce all mandatory field validations. Fields may be partially populated. Validation is relaxed to allow incremental form completion across multiple sessions. |
| **Request Number Generation** | Format: `PRF-{YYYY}-{NNNNNN}` where `YYYY` is the four-digit year and `NNNNNN` is a zero-padded sequential number. Uniqueness is enforced by the `uq_payment_requests_number` database constraint. Format is validated by the `chk_payment_requests_number_format` CHECK constraint: `^PRF-[0-9]{4}-[0-9]{3,6}$`. |

### 5.3 Operation: Edit Existing Payment Request

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant selects an existing request in editable status from the list. |
| **Guard Condition** | Request `status_id` ∈ {1, 5, 9} (editable states). Ownership verified (`applicant_user_id = current_user.user_id`). |
| **API Endpoint** | `PATCH /api/payment-requests/:id` |
| **Processing Steps** | 1. Validate ownership and editable status. 2. Apply field-level updates to the `payment_requests` record. 3. Reconcile `payment_breakdown_items` (insert new, update existing, delete removed items). 4. Recalculate `total_amount`. 5. Update `modified_date`. 6. Write `approval_logs` entry with `action_type_id` = `EDITED`. 7. Return `200 OK` with the updated request object. |
| **Concurrency Control** | Optimistic concurrency using `modified_date` comparison. If the server-side `modified_date` differs from the client's last-known value, the update is rejected with HTTP `409 Conflict` and a message instructing the user to reload and retry. |

### 5.4 Operation: Soft Delete Draft

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant clicks the "Delete Draft" (下書きを削除) button on a `DRAFT` status request. |
| **Guard Condition** | Request `status_id = 1 (DRAFT)` exclusively. Ownership verified. |
| **API Endpoint** | `DELETE /api/payment-requests/:id` |
| **User Confirmation** | A modal confirmation dialog is presented before API invocation. Dialog text: "This action will permanently archive this draft. The draft will be removed from your active list and cannot be restored. Do you wish to proceed?" Buttons: "Confirm Delete" (primary action), "Cancel" (dismiss). |
| **Processing Steps** | 1. Validate ownership and `DRAFT` status. 2. Set `is_deleted = TRUE`. 3. Update `modified_date`. 4. Return `200 OK` with success confirmation. 5. Frontend removes the item from the displayed list. |
| **Rejection Behavior** | If the request is not in `DRAFT` status, return HTTP `403 Forbidden` with error payload: `{ "error": "FORBIDDEN", "message": "Deletion is only permitted for requests in DRAFT status." }` |

### 5.5 Operation: Upload Receipt File

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant selects files via the receipt upload interface on the payment request form. |
| **API Endpoint** | `POST /api/payment-requests/:id/receipts` |
| **Request Content-Type** | `multipart/form-data` |
| **Payload** | `file` field containing the binary file data. |
| **Processing Steps** | 1. Validate ownership. 2. Validate MIME type against allowed types (PDF, PNG, JPG, JPEG). 3. Validate file size ≤ 10 MB. 4. Validate cumulative attachment size ≤ 50 MB. 5. Generate `stored_file_name` following breakdown content naming convention. 6. Persist file to `/uploads/{payment_request_id}/{UUID}_{stored_file_name}`. 7. Create `receipt_files` record with file metadata. 8. Return `201 Created` with the receipt file metadata object. |
| **Response Payload** | `{ "receipt_file_id": <int>, "original_file_name": "<string>", "stored_file_name": "<string>", "file_storage_path": "<string>", "file_size": <bigint>, "mime_type": "<string>" }` |

### 5.6 Operation: Submit to Manager

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant clicks the "Submit to Manager" (マネージャーへ提出) button. |
| **API Endpoint** | `POST /api/payment-requests/:id/submit-manager` |
| **Pre-Submission Validation** | Full mandatory field validation is enforced (see Section 6). Receipt file attachment validation is enforced per BR-APP-009. |
| **Processing Steps** | 1. Validate ownership. 2. Validate current status ∈ {`DRAFT`, `REJECTED_MANAGER`, `REJECTED_APPROVER`}. 3. Execute full field validation suite. 4. Verify receipt attachment if `has_receipt = TRUE`. 5. Begin database transaction. 6. Update `status_id = 2 (SUBMITTED_MANAGER)`. 7. Set `current_assigned_to_user_id = manager_user_id`. 8. Record `submitted_to_manager_date = NOW()`. 9. Write `approval_logs` entry with `action_type_id` = `SUBMITTED`, `previous_status_id` = (prior status), `new_status_id = 2`. 10. Commit transaction. 11. Dispatch WebSocket `statusUpdate` event to the Manager role room and the individual manager's user room (`user:{manager_user_id}`). 12. Return `200 OK` with updated request object. |

### 5.7 Operation: Submit to Final Approver

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant clicks the "Submit to Final Approver" (最終承認者へ送信) button. |
| **Guard Condition** | Request `status_id = 4 (MANAGER_VERIFIED)` exclusively. |
| **API Endpoint** | `POST /api/payment-requests/:id/submit-approver` |
| **Processing Steps** | 1. Validate ownership. 2. Validate current status is exactly `MANAGER_VERIFIED` (4). 3. Begin database transaction. 4. Update `status_id = 6 (SUBMITTED_APPROVER)`. 5. Record `submitted_to_approver_date = NOW()`. 6. Write `approval_logs` entry with `action_type_id` = `SUBMITTED`, `previous_status_id = 4`, `new_status_id = 6`. 7. Commit transaction. 8. Dispatch WebSocket `statusUpdate` event to the Final Approver role room. 9. Return `200 OK` with updated request object. |
| **Button Visibility** | The "Submit to Final Approver" button is rendered exclusively when the request's current status is `MANAGER_VERIFIED` (4). For all other statuses, this button is hidden. |

---

## 6. Input Validation Rules

### 6.1 Draft Save Validation (Relaxed Mode)

During draft save operations, the system applies relaxed validation. The following rules are enforced during draft save:

| Field | Validation Rule | Error Condition |
| :--- | :--- | :--- |
| `application_date` | If provided, must be a valid date ≤ today. | Future date provided. |
| `desired_payment_date` | If provided, must be a valid date ≥ today. | Past date provided. |
| `amount` (line items) | If provided, must be numeric and > 0. | Non-numeric or ≤ 0 value. |
| `line_number` | Must be within range 1–15. | Value outside range. |

All other fields may be left empty during draft save without triggering validation errors.

### 6.2 Submission Validation (Strict Mode)

Upon submission to Manager (UC-APP-007), the system enforces the complete validation suite. Every field listed below must pass validation before the status transition is permitted.

| Section | Field (Physical Name) | Display Name | Validation Rule | Error Message |
| :--- | :--- | :--- | :--- | :--- |
| **Header** | `application_date` | Application Date | Required. Must be a valid calendar date. Must be ≤ today (no future dates). | "Application Date is required and must be today or earlier." |
| **Header** | `employee_number` | Employee Number | Required. Auto-populated from authenticated user profile. Read-only — no user modification permitted. | (System error if missing from user profile.) |
| **Header** | `full_name` | Full Name | Required. Auto-populated from authenticated user profile. Read-only. | (System error if missing from user profile.) |
| **Header** | `branch` | Branch | Required. Auto-populated from authenticated user profile. Read-only. | (System error if missing from user profile.) |
| **Payment** | `total_amount` | Total Payment Amount | Required. Auto-calculated from breakdown items. Must satisfy `total_amount > 0`. | "Total amount must be greater than zero. Add at least one breakdown item." |
| **Payment** | `desired_payment_date` | Desired Payment Date | Required. Must be a valid calendar date ≥ today (today or future). | "Desired Payment Date is required and must be today or a future date." |
| **Payment** | `currency_id` | Currency | Required. Must reference an active record in the `currencies` table. | "Please select a currency." |
| **Payment** | `payment_type_id` | Payment Type | Required. Must reference an active record in the `payment_types` table. | "Please select a payment type." |
| **Payment** | `payment_method_id` | Payment Method | Required. Must reference an active record in the `payment_methods` table. | "Please select a payment method." |
| **Payment** | `purpose` | Purpose / Usage | Required. Maximum 500 characters. | "Purpose is required (maximum 500 characters)." |
| **Payment** | `bank_account_info` | Bank Account / Phone | **Conditionally Required.** Mandatory when `payment_method_id` resolves to `BANK_TRANSFER` or `CASH`. Maximum 200 characters. | "Bank account or phone information is required for the selected payment method." |
| **Content** | `request_content` | Payment Request Content | Required. Maximum 1,000 characters. | "Payment request content is required (maximum 1,000 characters)." |
| **Content** | `has_receipt` | Receipt Present | Required. Boolean (Yes/No radio selection). | "Please indicate whether a receipt is attached." |
| **Breakdown** | `items` (array) | Payment Breakdown | Required. Must contain at least 1 and at most 15 line items. | "At least one breakdown line item is required (maximum 15)." |
| **Breakdown** | `items[n].item_date` | Line Item Date | Required for each line item. Must be a valid calendar date. | "Date is required for breakdown line item #{n}." |
| **Breakdown** | `items[n].description` | Line Item Description | Required for each line item. Maximum 200 characters. | "Description is required for breakdown line item #{n} (maximum 200 characters)." |
| **Breakdown** | `items[n].amount` | Line Item Amount | Required for each line item. Must be numeric, > 0, and support up to 2 decimal places. | "Amount must be a positive number for breakdown line item #{n}." |
| **Receipt** | `receipt_files` | Receipt File Attachment | **Conditionally Required.** If `has_receipt = TRUE`, at least one (1) non-deleted receipt file must exist for the payment request. | "Receipt file attachment is required. Please upload at least one receipt before submitting." |
| **Routing** | `manager_user_id` | Submission Target Manager | Required. Must reference an active user with `MANAGER` role. | "Please select a manager for submission." |

### 6.3 Validation Enforcement Layers

All validation rules defined in this section are enforced at two independent layers to ensure defense-in-depth:

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend (Client)** | React form validation with real-time feedback | Provides immediate user feedback on input errors. Prevents submission of invalid forms. Reduces unnecessary API calls. |
| **Backend (Server)** | NestJS Service Layer + class-validator DTOs | Authoritative validation. Rejects invalid payloads with HTTP `400 Bad Request` and structured error response. Guards against client-side validation bypass. |

---

## 7. Error Handling Specification

### 7.1 Error Response Structure

All API error responses from the backend shall conform to the following JSON structure:

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed for the submitted payment request.",
  "details": [
    {
      "field": "desired_payment_date",
      "constraint": "isDateAfterToday",
      "message": "Desired Payment Date must be today or a future date."
    }
  ],
  "timestamp": "2026-06-12T08:45:00.000Z",
  "path": "/api/payment-requests"
}
```

### 7.2 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Validation failure on submitted data. One or more fields failed validation rules. | Display inline field-level error messages adjacent to each invalid field. Display a summary error banner at the top of the form. |
| `401` | `UNAUTHORIZED` | JWT token is missing, expired, or invalid. | Redirect user to the login screen. Display session expiration message. |
| `403` | `FORBIDDEN` | User attempts to access or modify a resource they do not own, or attempts a prohibited action (e.g., deleting a non-draft request). | Display an access denied message. Do not disclose details about the target resource. |
| `404` | `NOT_FOUND` | The specified payment request ID does not exist or has been soft-deleted. | Display "The requested payment request was not found or has been archived." |
| `409` | `CONFLICT` | Optimistic concurrency conflict. The record was modified by another session since the user's last read. | Display "This request has been modified since you last loaded it. Please refresh the page and try again." |
| `413` | `PAYLOAD_TOO_LARGE` | Uploaded receipt file exceeds the 10 MB size limit. | Display "The selected file exceeds the maximum allowed size of 10 MB. Please select a smaller file." |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Uploaded file MIME type is not in the permitted set. | Display "The selected file type is not supported. Permitted types: PDF, PNG, JPG, JPEG." |
| `422` | `UNPROCESSABLE_ENTITY` | Business rule violation (e.g., receipt required but not attached, invalid status transition attempt). | Display specific business rule violation message. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error. | Display a generic error message: "An unexpected error occurred. Please try again or contact your system administrator." Log full stack trace server-side. |

### 7.3 Frontend Error Display Behavior

| Error Type | Display Method |
| :--- | :--- |
| **Field-Level Validation Error** | Red border on the invalid input field. Error message text displayed directly below the field in red. Field retains focus until corrected. |
| **Form-Level Validation Summary** | A dismissible error banner displayed at the top of the form listing all validation errors with anchor links to the corresponding fields. |
| **API Error (Non-Validation)** | Toast notification displayed in the top-right corner of the viewport. Auto-dismiss after 8 seconds. Manual dismiss available. Color-coded: red for errors, amber for warnings. |
| **Network Error / Timeout** | Full-width banner: "Unable to connect to the server. Please check your network connection and try again." Retry button provided. |

---

## 8. Permission and Access Control

### 8.1 Authentication Requirements

| Attribute | Specification |
| :--- | :--- |
| **Authentication Mechanism** | JSON Web Token (JWT) Bearer Token |
| **Token Transport** | `Authorization: Bearer <token>` HTTP header on every API request |
| **Token Validation** | Server-side verification of token signature, expiration (`exp` claim), and issuer (`iss` claim) on every incoming request. |
| **Session Management** | Stateless JWT with Redis-backed session caching for enhanced security. Session TTL: 3,600 seconds (1 hour, sliding window). |
| **Token Refresh** | Client-side token refresh before expiration. If token expires mid-session, user is redirected to the login screen with a session expiration notification. |

### 8.2 Authorization Guard Architecture

The following NestJS guards are applied in sequence to every Applicant Dashboard API endpoint:

| Guard Order | Guard Name | Purpose | Failure Response |
| :---: | :--- | :--- | :--- |
| 1 | `JwtAuthGuard` | Validates the JWT Bearer token. Extracts and attaches the authenticated user context to the request object. | HTTP `401 Unauthorized` |
| 2 | `RolesGuard` | Validates that the authenticated user's `role_id` maps to the `APPLICANT` role code. Rejects requests from users with non-applicant roles. | HTTP `403 Forbidden` |
| 3 | `OwnershipGuard` | For resource-specific endpoints (e.g., `GET /api/payment-requests/:id`), validates that `payment_requests.applicant_user_id` matches the authenticated user's `user_id`. | HTTP `403 Forbidden` |

### 8.3 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Ownership Check | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/payment-requests/my-requests` | `GET` | `APPLICANT` | Implicit (query filter) | List all owned payment requests. |
| `/api/payment-requests` | `POST` | `APPLICANT` | N/A (new resource) | Create a new payment request draft. |
| `/api/payment-requests/:id` | `GET` | `APPLICANT` | ✓ | View a specific payment request detail. |
| `/api/payment-requests/:id` | `PATCH` | `APPLICANT` | ✓ | Update an existing payment request (editable status only). |
| `/api/payment-requests/:id` | `DELETE` | `APPLICANT` | ✓ | Soft delete a draft payment request. |
| `/api/payment-requests/:id/receipts` | `POST` | `APPLICANT` | ✓ | Upload a receipt file to a payment request. |
| `/api/payment-requests/:id/receipts/:fileId` | `DELETE` | `APPLICANT` | ✓ | Soft delete a receipt file attachment. |
| `/api/payment-requests/:id/submit-manager` | `POST` | `APPLICANT` | ✓ | Submit payment request to the selected Manager. |
| `/api/payment-requests/:id/submit-approver` | `POST` | `APPLICANT` | ✓ | Submit verified request to the Final Approver. |
| `/api/payment-requests/:id/approval-logs` | `GET` | `APPLICANT` | ✓ | Retrieve approval history timeline for a request. |

### 8.4 Security Audit Logging

Every state-modifying action performed by the applicant is recorded in the `approval_logs` table with the following metadata:

| Field | Source | Purpose |
| :--- | :--- | :--- |
| `action_taken_by_user_id` | JWT `user_id` claim | Identifies the actor who performed the action. |
| `action_type_id` | Business logic mapping | Classifies the type of action (CREATED, EDITED, SUBMITTED, etc.). |
| `previous_status_id` | Current `status_id` before transition | Records the originating state for audit trail reconstruction. |
| `new_status_id` | Target `status_id` after transition | Records the destination state. |
| `comment` | User input (if applicable) | Captures applicant comments or system-generated notes. |
| `ip_address` | Request metadata (`X-Forwarded-For` or socket address) | Security audit — identifies the client network origin. |
| `user_agent` | Request header `User-Agent` | Security audit — identifies the client browser/device. |
| `timestamp` | Server-generated `CURRENT_TIMESTAMP` (UTC) | Precise temporal record of the action. |

The `approval_logs` table is protected by the `trg_approval_logs_immutable` PostgreSQL trigger, which prevents all `UPDATE` and `DELETE` operations. Records in this table are append-only and retained for a minimum of five (5) years per regulatory compliance requirements.

---

## 9. Real-Time Notification Behavior

### 9.1 WebSocket Configuration

| Attribute | Specification |
| :--- | :--- |
| **Technology** | Socket.IO (via NestJS `@WebSocketGateway`) |
| **Gateway Port** | 3001 |
| **CORS Policy** | Configurable per environment. Development: `origin: '*'`. Production: restricted to application domain. |
| **Connection Protocol** | Upon login, the frontend client establishes a WebSocket connection and emits a `joinRoom` event with `{ role: 'APPLICANT', userId: <user_id> }`. |
| **Room Membership** | Each applicant joins two rooms: (1) their role room (`'APPLICANT'`), and (2) their personal room (`'user:<user_id>'`). |

### 9.2 Notification Events Received by Applicant

| Event Name | Trigger Condition | Payload | UI Behavior |
| :--- | :--- | :--- | :--- |
| `statusUpdate` | Status of an owned request changes (e.g., Manager verifies, Manager rejects, Approver approves, Accounting marks paid). | `{ payment_request_id, request_number, previous_status, new_status, action_by, timestamp }` | 1. Display toast notification with status change summary. 2. Update the affected row in the payment request list with the new status badge. 3. If the detail view of the affected request is currently open, refresh the status display and approval timeline. |
| `notification` | Personal notification targeted to the specific user (e.g., rejection comment notification). | `{ type, title, message, payment_request_id, timestamp }` | 1. Display prominent toast notification. 2. Increment unread notification badge counter. |

### 9.3 Notification Events Dispatched by Applicant Actions

| Applicant Action | Target Room | Event Name | Payload |
| :--- | :--- | :--- | :--- |
| Submit to Manager | `user:<manager_user_id>` + `MANAGER` role room | `statusUpdate` | `{ payment_request_id, request_number, new_status: 'SUBMITTED_MANAGER', submitted_by: <applicant_name>, timestamp }` |
| Submit to Final Approver | `APPROVER` role room | `statusUpdate` | `{ payment_request_id, request_number, new_status: 'SUBMITTED_APPROVER', submitted_by: <applicant_name>, timestamp }` |

### 9.4 Connection Resilience

| Scenario | Behavior |
| :--- | :--- |
| **Temporary Disconnection** | Socket.IO automatic reconnection with exponential backoff. Pending events are queued and delivered upon reconnection. |
| **Extended Disconnection** | Upon reconnection, the frontend issues a full data refresh request to synchronize the payment request list with the latest server state. |
| **Latency Requirement** | Status change notifications must be delivered to connected clients within ≤ 500 milliseconds of the server-side transaction commit (per NFR-003). |

---

## 10. Screen Transition Specification

### 10.1 Inbound Navigation

| Source Screen | Navigation Path | Condition |
| :--- | :--- | :--- |
| Login Screen | Successful authentication with `APPLICANT` role → automatic redirect to `/applicant`. | User `role_id` maps to `APPLICANT`. |
| Global Navigation Header | Click "申請者" (Applicant) link in the top navigation bar. | User is authenticated. |
| Root URL (`/`) | Automatic redirect via `<Navigate to="/applicant" replace />`. | Default landing route. |

### 10.2 Internal Screen States

| Screen State | Trigger | Content Displayed |
| :--- | :--- | :--- |
| **List View (Default)** | Dashboard initial load. | Payment request list with status badges, pagination controls, and "Create New Request" button. |
| **Create Form View** | Click "Create New Request" button. | Empty payment request form with all editable fields, breakdown table, receipt upload area, and manager selection dropdown. |
| **Edit Form View** | Click on a request with editable status from the list. | Pre-populated payment request form with existing data. All fields editable. |
| **Read-Only Detail View** | Click on a request with non-editable status from the list. | Pre-populated payment request detail with all fields in read-only mode. Approval timeline displayed. Action buttons contextually shown (e.g., "Submit to Final Approver" for `MANAGER_VERIFIED` status). |
| **Approval Timeline View** | Expand timeline section within the detail view. | Chronological list of all `approval_logs` entries for the request, showing actor name, action type, status transition, comment, and timestamp. |

### 10.3 Outbound Navigation

| Destination | Trigger | Condition |
| :--- | :--- | :--- |
| Login Screen | JWT token expiration or manual logout action. | Session expired or user-initiated logout. |
| 404 Page | URL path does not match any defined route. | Invalid URL entered directly. |

---

## 11. Non-Functional Considerations

### 11.1 Performance Requirements

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| Dashboard page load time (initial render) | ≤ 2 seconds | Time from navigation initiation to full DOM paint with data populated. |
| Payment request list query response | ≤ 1 second | Server-side API response time for paginated list with default parameters. Optimized by `idx_payment_requests_applicant_id` and `idx_payment_requests_status_created` indexes. |
| Draft save operation round-trip | ≤ 2 seconds | Time from form submission to server confirmation and UI update. |
| Receipt file upload | ≤ 5 seconds for 10 MB file | Time from upload initiation to server confirmation, dependent on network bandwidth. |
| WebSocket notification delivery | ≤ 500 milliseconds | Time from server-side transaction commit to client-side toast display. |

### 11.2 Caching Strategy

| Cache Domain | Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| Master lookup tables (currencies, payment types, payment methods, statuses) | `lookup:<table_name>` | 86,400 seconds (24 hours) | Administrator modification of master data. |
| Active payment request payload | `payment_request:payload:<id>` | 600 seconds (10 minutes) | Any status transition, field update, or action on the request. Evicted via `DEL` on transaction commit. |
| Manager user list (for dropdown) | `lookup:active_managers` | 3,600 seconds (1 hour) | Administrator changes to user roles or active status. |

### 11.3 Responsive Design Requirements

The Applicant Dashboard layout shall be responsive and functional across the following device categories:

| Device Category | Viewport Range | Layout Adaptation |
| :--- | :--- | :--- |
| Desktop | ≥ 1024px | Two-column layout: request list/timeline on the left, form/detail view on the right. |
| Tablet | 768px – 1023px | Single-column stacked layout with collapsible sections. |
| Mobile | < 768px | Full-width single-column layout with accordion-style form sections and bottom-sheet action buttons. |

---

## 12. Cross-Reference Traceability Matrix

### 12.1 Requirements Definition Traceability

| Requirement ID | Requirement Description | Covered By (This Document) |
| :--- | :--- | :--- |
| REQ-001 | Applicant can create a new payment request with initial status "Draft". | UC-APP-002, Section 5.2 |
| REQ-002 | Applicant can edit a payment request while in "Draft" status. | UC-APP-003, Section 5.3, BR-APP-003 |
| REQ-002A | Payment request form must capture all required fields. | Section 6.2 (Full Validation Table) |
| REQ-002B | Payment Breakdown Table with 1–15 line items. | Section 6.2 (Breakdown validation), BR-APP-014 |
| REQ-003 | Applicant can upload receipt files (PDF, JPG, PNG). | UC-APP-005, Section 5.5, BR-APP-010 |
| REQ-003A | Receipt file naming convention follows breakdown content. | BR-APP-012 |
| REQ-004 | Applicant can submit Draft to Manager. | UC-APP-007, Section 5.6, TR-APP-01 |
| REQ-005 | Applicant can edit rejected requests and resubmit. | UC-APP-003, BR-APP-003, TR-APP-02, TR-APP-03 |
| REQ-006 | Applicant submits Manager-Verified request to Final Approver. | UC-APP-008, Section 5.7, TR-APP-04 |
| REQ-023 | Applicant dashboard displays all their payment requests with current status. | UC-APP-001, Section 5.1 |
| REQ-024 | Applicant can view comments and feedback from rejections. | UC-APP-009 |
| REQ-029 | Applicant can upload receipt files with size limit. | UC-APP-005, BR-APP-011 |
| REQ-029A | Receipt submission is required when applying for payment. | BR-APP-009 |
| REQ-030 | Receipt files stored with directory structure by request ID. | BR-APP-012 |
| REQ-036 | Application Date must be today or earlier. | Section 6.2 (`application_date` validation) |
| REQ-037 | Desired Payment Date must be today or later. | Section 6.2 (`desired_payment_date` validation) |
| REQ-038 | Total Payment Amount > 0, calculated from breakdown items. | BR-APP-014, BR-APP-015 |
| REQ-039 | Breakdown must contain 1–15 line items. | Section 6.2 (`items` array validation) |
| REQ-040 | Each breakdown line requires Date, Description, Amount. | Section 6.2 (line item validations) |
| REQ-041 | Currency and Payment Method are required dropdowns. | Section 6.2 (`currency_id`, `payment_method_id` validations) |
| REQ-042 | Bank Account/Phone required if Payment Method is Bank Transfer or Cash. | Section 6.2 (`bank_account_info` conditional validation) |
| REQ-045 | Validate file attachment before submission (Receipt Present = Yes). | BR-APP-009 |

### 12.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `payment_requests` | UC-APP-001 through UC-APP-008. All CRUD and state transition operations. |
| `payment_breakdown_items` | UC-APP-002 (create), UC-APP-003 (edit), UC-APP-001 (display). Line item management. |
| `receipt_files` | UC-APP-005 (upload), UC-APP-006 (delete). Receipt attachment lifecycle. |
| `approval_logs` | UC-APP-002 (CREATED log), UC-APP-003 (EDITED log), UC-APP-007/008 (SUBMITTED log), UC-APP-009 (timeline display). Immutable audit trail. |
| `users` | BR-APP-001 (ownership), BR-APP-017 (manager list), Section 8 (authentication/authorization). |
| `payment_statuses` | Section 3 (state transitions), BR-APP-003 (editable state determination). |
| `currencies` | Section 6.2 (currency dropdown validation). |
| `payment_types` | Section 6.2 (payment type dropdown validation). |
| `payment_methods` | Section 6.2 (payment method dropdown validation). |
| `approval_action_types` | Section 8.4 (audit log action classification). |

### 12.3 Related Document References

| Document ID | Document Name | Relationship |
| :--- | :--- | :--- |
| PRWM-SIS-SCR-001 | Screen Items Specification — Applicant Dashboard (`05_画面項目設計書_SCREEN_ITEMS.md`) | Defines the physical field layout, input types, initial values, and display specifications for all UI elements referenced in this functional specification. |
| PRWM-DDS-SCR-001 | Detail Design Specification — Applicant Dashboard (`06_詳細設計書_DETAIL_DESIGN.md`) | Defines API endpoint contracts, database query implementations, and processing sequence diagrams that implement the functional operations specified herein. |
| PRWM-REQ-001 | Requirements Definition (`REQUIREMENT_DEFINITION.md`) | Upstream requirements document. All functional operations and business rules in this specification trace to requirements defined in this document. |
| PRWM-DBS-001 | Database Design Specification (`DATABASE_DESIGN_SPECIFICATION.md`) | Defines the physical database schema, constraints, indexes, and data dictionary upon which this functional specification's data operations are built. |

---

*End of Functional Specification — Applicant Dashboard (申請者ダッシュボード)*
