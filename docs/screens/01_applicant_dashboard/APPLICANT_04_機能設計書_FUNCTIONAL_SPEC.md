# Functional Specification (機能設計書) — Applicant Dashboard 

**Document ID:** PRWM-FSD-SCR-001  
**Target Screen:** Applicant Dashboard (申請者ダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Applicant Operations  
**Function ID:** FN-001  
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
| 1.0 | 2026-06-12 | Senior Principal Architect | Initial release. Full functional specification for the Applicant Dashboard subsystem covering use cases, business rules, state transitions, validation, error handling, permission control, and real-time notification behavior. |
| 2.0 | 2026-06-15 | System Automator | Updated structure and content to fully conform to the standard `FUNCTIONAL_SPECIFICATION_TEMPLATE.md`, integrating detailed specifications from Requirement, Database, and Development Rules documents. |

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

This screen serves as the primary operational portal for users assigned the `APPLICANT` role within the Payment Request Workflow Management System. The Applicant Dashboard provides the complete set of capabilities necessary for an applicant to manage the full lifecycle of their own payment requests — from initial drafting through final submission to the approval chain.

This subsystem is the entry point for all payment request origination within the enterprise workflow. It is responsible for ensuring that only properly validated, receipt-attached, and business-rule-compliant payment requests enter the downstream verification and approval pipeline.

### 1.2 Functional Responsibilities

This screen is responsible for the following core functional areas:

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

### 1.4 Relationships with Other Functions and Peripheral Systems

```text
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│   Applicant Actor        │      │     payment_requests / etc          │
│   (Fills & Submits)      ├─────►│  Creates/Updates records            │
└──────────────────────────┘      └──────────────┬────────────────────┘
                                                 │ Reads/Writes
                                                 ▼
                                      ┌────────────────────────┐
                                      │  Applicant Dashboard   │
                                      └──────────┬─────────────┘
                                                 │ WebSocket Event
                                                 ▼
┌──────────────────────────┐      ┌─────────────────────────────────────┐
│   Manager / Approver     │      │     Manager/Approver Dashboard      │
│ (Receives Notification)  │◄────┤  Displays new pending requests       │
└──────────────────────────┘      └─────────────────────────────────────┘
```

### 1.5 Inputs / Outputs

| Input Information | Data Category | Source / Description |
| :--- | :--- | :--- |
| `payment_requests` | Database Table | Reads applicant's existing payment requests. Filtered by `applicant_user_id` and `is_deleted = false`. |
| `payment_breakdown_items` | Database Table | Reads existing breakdown items for the request. |
| Filters & Search Parameters | User Input UI | Search by request number, amount range, or status code filter. |

| Output Information | Data Category | Destination / Description |
| :--- | :--- | :--- |
| Updated `payment_requests` | Database Table | Updates status, modifications, totals, and logical deletion flags. |
| Created `payment_breakdown_items` | Database Table | Saves up to 15 breakdown lines. |
| Created `receipt_files` | Database Table/FS | Saves file attachment records and actual files in `wwwroot/uploads`. |
| WebSocket Event | Network Message | Dispatches `statusUpdate` events to assigned Manager or Approver upon submission. |
| Dashboard Toast / UI List | UI Display | Visual feedback for successful updates and real-time status changes. |

### 1.6 Related Documents

| No. | Document ID | Document Name | File Path / Reference | Remarks |
| :-- | :--- | :--- | :--- | :--- |
| 1 | PRWM-REQ-001 | Requirements Definition | `01_要件定義書_REQUIREMENT_SPEC.md` | Business workflow logic, required fields, and rules. |
| 2 | PRWM-DBS-001 | Database Design Specification | `03_データベース設計書_DATABASE_SPEC.md` | Table structures (`payment_requests`, `receipt_files`), constraints. |
| 3 | PRWM-DEV-001 | Development Rules | `02_開発ルール_DEVELOPMENT_RULES.md` | Security rules, design tokens, error responses. |

---

## 2. Use Cases and Business Workflow

### 2.1 Use Case Catalog

| UC-ID | Use Case Name | Precondition | Postcondition | Triggering Actor |
| :--- | :--- | :--- | :--- | :--- |
| UC-APP-001 | View Payment Request List | User is authenticated with `APPLICANT` role. | All non-deleted payment requests originated by the user are displayed, sorted by status priority and descending creation date. | Applicant |
| UC-APP-002 | Create New Payment Request (Draft) | User is authenticated. | A new `payment_requests` record is persisted with `status_id = 1 (DRAFT)`. Corresponding `payment_breakdown_items` records are created. An `approval_logs` entry of type `CREATED` is recorded. | Applicant |
| UC-APP-003 | Edit Existing Draft or Rejected Request | Target request exists with `status_id` ∈ {`1`, `5`, `9`}. Request ownership validated. | Updated fields are persisted. `modified_date` is refreshed. An `approval_logs` entry of type `EDITED` is recorded. | Applicant |
| UC-APP-004 | Soft Delete Draft Request | Target request exists with `status_id = 1 (DRAFT)`. Request ownership validated. | `is_deleted` flag set to `TRUE`. Record is excluded from all standard list queries. No physical deletion occurs. | Applicant |
| UC-APP-005 | Upload Receipt File | Target request exists. Request ownership validated. `has_receipt = TRUE`. | A new `receipt_files` record is created. Physical file is stored. | Applicant |
| UC-APP-006 | Delete Uploaded Receipt File | Target receipt file exists. Request is in an editable status. Request ownership validated. | `receipt_files.is_deleted` set to `TRUE`. File reference is excluded from subsequent queries. | Applicant |
| UC-APP-007 | Submit to Manager | Target request has all mandatory fields populated. Receipt validation passes (if `has_receipt = TRUE`). | `status_id` transitions to `2 (SUBMITTED_MANAGER)`. `submitted_to_manager_date` is recorded. An `approval_logs` entry of type `SUBMITTED` is recorded. WebSocket notification dispatched to Manager. | Applicant |
| UC-APP-008 | Submit to Final Approver | Target request has `status_id = 4 (MANAGER_VERIFIED)`. Request ownership validated. | `status_id` transitions to `6 (SUBMITTED_APPROVER)`. `submitted_to_approver_date` is recorded. An `approval_logs` entry of type `SUBMITTED` is recorded. WebSocket notification dispatched to Approver. | Applicant |
| UC-APP-009 | View Rejection Comments and Approval History | Target request exists. Request ownership validated. | Approval log timeline is rendered showing all historical actions, timestamps, actors, and comments. | Applicant |
| UC-APP-010 | Receive Real-Time Status Notification | Applicant is connected to WebSocket. A status transition occurs on one of their requests. | Toast notification is displayed. Request list is refreshed to reflect the updated status. | System (Automated) |

### 2.2 Primary Business Workflow

```
                        ┌──────────────────┐
                        │  Applicant Login │
                        │  (JWT Verified)  │
                        └────────┬─────────┘
                                 │
                                 ▼
                   ┌─────────────────────────────┐
                   │  Applicant Dashboard View   │
                   │ (Payment Request List Load) │
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
    │         Payment Request Form (Edit Mode)         │
    └──────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
   ┌────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Save Draft │ │ Submit to    │ │ Delete Draft │
   │  (UC-2/3)  │ │ Manager(UC-7)│ │   (UC-4)     │
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
        │ Status: SUBMITTED_   │
        │ MANAGER (ID: 2)      │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────────────┐
        ▼                             ▼
  ┌────────────────┐         ┌────────────────────┐
  │ MANAGER_VERIFIED│         │ REJECTED_MANAGER   │
  │   (ID: 4)      │         │    (ID: 5)         │
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
│   (ID: 8)    │        │    (ID: 9)          │
└──────────────┘        └─────────┬───────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │ Edit & Resubmit      │
                        │ to Manager (UC-7)    │
                        │ (Full Workflow       │
                        │  Restart Required)   │
                        └──────────────────────┘
```

### 2.3 Workflow Critical Path Summary

| Step | Action | Status Before | Status After | Assigned To |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Applicant creates request | — | `DRAFT` (1) | Applicant |
| 2 | Applicant saves draft | `DRAFT` (1) | `DRAFT` (1) | Applicant |
| 3 | Applicant uploads receipt files | `DRAFT` (1) | `DRAFT` (1) | Applicant |
| 4 | Applicant submits to Manager | `DRAFT` (1) | `SUBMITTED_MANAGER` (2) | Manager |
| 5a | Manager verifies successfully | `MANAGER_REVIEWING` (3) | `MANAGER_VERIFIED` (4) | Applicant |
| 5b | Manager rejects with comment | `MANAGER_REVIEWING` (3) | `REJECTED_MANAGER` (5) | Applicant |
| 6 | Applicant submits to Final Approver | `MANAGER_VERIFIED` (4) | `SUBMITTED_APPROVER` (6) | Final Approver |
| 7a | Final Approver approves | `APPROVER_REVIEWING` (7) | `APPROVED` (8) | Accounting |
| 7b | Final Approver rejects with comment | `APPROVER_REVIEWING` (7) | `REJECTED_APPROVER` (9) | Applicant |
| 8 | Applicant edits & resubmits rejected | `REJECTED_MANAGER` / `REJECTED_APPROVER` | `SUBMITTED_MANAGER` (2) | Manager |

### 2.4 Relevant Requirements Covered

| Requirement ID | Requirement Summary |
| :--- | :--- |
| REQ-001 | Applicant can create a new payment request with initial status "Draft". |
| REQ-002 | Applicant can edit a payment request while in "Draft" status. |
| REQ-002A | Payment request form must capture all required fields. |
| REQ-002B | Payment Breakdown Table with 1–15 line items. |
| REQ-003 | Applicant can upload receipt files (PDF, JPG, PNG). |
| REQ-004 | Applicant can submit Draft to Manager. |
| REQ-005 | Applicant can edit rejected requests and resubmit. |
| REQ-006 | Applicant submits Manager-Verified request to Final Approver. |
| REQ-023 | Applicant dashboard displays all their payment requests. |
| REQ-024 | Applicant can view comments from rejections. |
| REQ-029 | Applicant can upload receipt files with size limits. |
| REQ-030 | Receipt files are stored safely. |
| REQ-036 to REQ-045 | Various input validation data constraints and file attachment rules. |

---

## 3. State Transition Specification

### 3.1 Actor-Controllable State Transitions

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-APP-01 | `DRAFT` (1) | `SUBMITTED_MANAGER` (2) | Submit to Manager | Mandatory fields validated. Receipt attached if `has_receipt=true`. Active `manager_user_id` selected. |
| TR-APP-02 | `REJECTED_MANAGER` (5) | `SUBMITTED_MANAGER` (2) | Resubmit to Manager | Same as TR-APP-01. Request must have been modified. |
| TR-APP-03 | `REJECTED_APPROVER` (9) | `SUBMITTED_MANAGER` (2) | Resubmit to Manager | Same as TR-APP-01. Full restart required. |
| TR-APP-04 | `MANAGER_VERIFIED` (4) | `SUBMITTED_APPROVER` (6) | Submit to Approver | Status must be exactly 4. No additional field validation needed. |

### 3.2 Actor-Observable Status Set

| Status ID | Status Code | Display Name | Can View | Can Edit | Can Delete | Can Submit / Act |
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

The system defines a request as "editable" when its `status_id` resolves to a record in the `payment_statuses` table where `is_editable_state = TRUE`. The editable statuses relevant to this screen are:

- `DRAFT` (status_id: 1)
- `REJECTED_MANAGER` (status_id: 5)
- `REJECTED_APPROVER` (status_id: 9)

In these states, header fields, breakdown items, manager selection, and file attachments are modifiable.

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-APP-001 | Self-Originated Request Isolation | The applicant shall have visibility exclusively to requests where `applicant_user_id` equals their `user_id`. | Backend (`OwnershipGuard`), Frontend response filtering |
| BR-APP-002 | Direct URL Access Prevention | Direct access via URL to an unowned request returns `403 Forbidden` without leaking data. | Backend (`OwnershipGuard`) |

### 4.2 Edit Permission Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-003 | Editable Status Restriction | Modifications are only permitted when `status_id` is 1, 5, or 9. |
| BR-APP-004 | Post-Submission Immutability | Once submitted (status >= 2), the data becomes read-only for the applicant. |
| BR-APP-005 | Breakdown Item Freeze | `payment_breakdown_items` cannot be modified by anyone once beyond an editable state. |

### 4.3 Deletion Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-006 | Draft-Only Soft Delete | Logical deletion (`is_deleted = TRUE`) is only permitted when `status_id = 1`. |
| BR-APP-007 | No Physical Deletion | Records are soft-deleted for audit purposes and excluded from active queries. |
| BR-APP-008 | Deletion Confirmation | A confirmation modal is required before soft-deletion of a draft. |

### 4.4 Receipt File Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-009 | Receipt Attachment Enforcement | If `has_receipt = TRUE`, at least one active receipt file must exist before submission. |
| BR-APP-010 | Permitted File Types | Allowed: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`. |
| BR-APP-011 | File Size Constraint | Max 10MB per file, Max 50MB total per request. |
| BR-APP-012 | File Storage Path Convention | Files stored at `/uploads/{payment_request_id}/{UUID}_{stored_file_name}`. |
| BR-APP-013 | Receipt File Soft Delete | Files are soft-deleted and retained on disk for auditing. |

### 4.5 Amount Calculation Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-014 | Total Amount Auto-Calculation | `total_amount` is strictly derived from the sum of `payment_breakdown_items.amount`. Manual override is not possible. |
| BR-APP-015 | Amount Positivity Constraint | Breakdown amount > 0, total amount > 0. |
| BR-APP-016 | Decimal Precision | `NUMERIC(12,2)` precision, tracked in JS as strings to avoid floating-point loss. |

### 4.6 Workflow-Specific Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-017 | Dynamic Manager List | Manager dropdown populates active users with the `MANAGER` role. |
| BR-APP-018 | Manager Assignment | `manager_user_id` and `current_assigned_to_user_id` are set upon submission. |
| BR-APP-019 | Approver Rejection Restart | A rejection by Approver forces the workflow to restart entirely from Manager verification. |
| BR-APP-020 | Manager Rejection Restart | A rejection by Manager forces resubmission to the Manager. |

### 4.7 Audit Trail Rules

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-APP-021 | Immutable Approval Log | All state-modifying actions write to `approval_logs`, protected by `trg_approval_logs_immutable`. |
| BR-APP-022 | Timestamp Integrity | UTC timestamps. UI performs local timezone conversions. |

---

## 5. Screen Specifications

### 5.1 Screen: Applicant Dashboard List View (`/applicant`)

**Purpose:** Display all payment requests originated by the applicant.

#### 5.1.1 UI Elements

**Data Grid / List:**

| Column ID | Column Name | Data Source | Display Format | Sortable | Filterable |
| :--- | :--- | :--- | :--- | :---: | :---: |
| COL-01 | Request Number (申請番号) | `payment_requests.request_number` | String | ✓ | ✓ |
| COL-02 | Application Date (申請日) | `payment_requests.application_date` | YYYY-MM-DD | ✓ | ✗ |
| COL-03 | Total Amount (合計金額) | `payment_requests.total_amount` | Decimal (12,2) with currency | ✓ | ✓ |
| COL-04 | Currency (通貨) | `currencies.currency_code` | String | ✓ | ✗ |
| COL-05 | Status (ステータス) | `payment_statuses.status_name` | Colored Badge | ✓ | ✓ |
| COL-06 | Created Date (作成日) | `payment_requests.created_date` | YYYY-MM-DD HH:mm | ✓ | ✗ |

**Action Controls:**

| UI Element | Type | Description / Behavior |
| :--- | :--- | :--- |
| Create New Request | Button (Primary) | Navigates to Create Form View. |
| Row Click | Action Row | Navigates to Edit Form View (if editable) or Detail View (if read-only). |

**Default Filter:** Excludes records with `is_deleted = TRUE`.

### 5.2 Screen: Payment Request Form / Detail Modal (`/applicant/requests/:id`)

**Purpose:** Draft new requests, edit rejected requests, or view read-only submitted requests.

#### 5.2.1 Read-Only / Editable Display Sections

**Applicant / Requester Information:**
- Employee Number (`employee_number`), Full Name (`full_name`), Branch (`branch`) - Derived from `users`.

**Payment Information:**
- Application Date (`application_date`) — YYYY-MM-DD format
- Total Payment Amount (`total_amount`) — Decimal format (12,2), Auto-calculated
- Desired Payment Date (`desired_payment_date`) — YYYY-MM-DD format
- Currency Type — resolved from `currencies.currency_code`
- Payment Type — resolved from `payment_types.payment_type_name`
- Payment Method — resolved from `payment_methods.payment_method_name`
- Purpose / Usage (`purpose`)
- Bank Account Info (`bank_account_info`) — Conditional display

**Request Content & Attachments:**
- Payment Request Content (`request_content`)
- Receipt Present (`has_receipt`) — Yes/No indication
- Receipt Files — Hyperlinks / Upload Interface for `receipt_files`

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
| Save Draft | Button | Persists current form state. Enabled in `DRAFT`, `REJECTED_*` status. |
| Submit to Manager | Button (Primary) | Submits draft. Executes strict validations. |
| Submit to Final Approver | Button (Primary) | Submits verified request. Appears only if status is `MANAGER_VERIFIED` (4). |
| Delete Draft | Button (Danger) | Soft deletes. Appears only if status is `DRAFT` (1). Needs confirmation modal. |

---

## 6. Functional Operation Specification

### 6.1 Operation: Payment Request List Display

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Applicant navigates to Dashboard, or WebSocket triggers a refresh. |
| **Data Source** | `GET /api/v1/applicant/payment-requests` |
| **Query Filter** | `applicant_user_id = current_user.user_id AND is_deleted = FALSE` |
| **Default Sort** | Primary: `status_id` (ascending by display_order), Secondary: `created_date` (descending) |
| **Pagination** | Server-side. Default 10 records per page. |
| **Real-Time Update** | Refreshes on `statusUpdate` socket event. |

### 6.2 Operation: Create New Payment Request (Save Draft)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | "Save Draft" or initial submit action from form. |
| **API Endpoint** | `POST /api/v1/applicant/payment-requests` |
| **Request Content-Type** | `application/json` |
| **Pre-Submission Validation** | Relaxed Mode Validation (Draft). |
| **Processing Steps** | 1. Generate `request_number` (`PRF-YYYY-NNNNNN`). 2. Set `applicant_user_id`. 3. Set `status_id = 1`. 4. Compute `total_amount`. 5. Persist request and breakdown items. 6. Log `CREATED` action. 7. Return 201 Created. |

### 6.3 Operation: Edit Existing Payment Request

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Form updates on an editable existing request. |
| **Guard Condition** | Status ∈ {1, 5, 9}. Ownership validated. |
| **API Endpoint** | `PATCH /api/v1/applicant/payment-requests/:id` |
| **Processing Steps** | 1. Verify ownership/status. 2. Reconcile breakdown items. 3. Update `modified_date` using optimistic concurrency locking. 4. Log `EDITED` action. 5. Return 200 OK. |

### 6.4 Operation: Soft Delete Draft

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | "Delete Draft" button click. |
| **Guard Condition** | Status must be exactly 1 (`DRAFT`). Ownership validated. |
| **API Endpoint** | `DELETE /api/v1/applicant/payment-requests/:id` |
| **Processing Steps** | 1. Confirm deletion intent. 2. Set `is_deleted = TRUE`. 3. Return 200 OK. |

### 6.5 Operation: Upload Receipt File

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | User drops/selects a receipt file. |
| **API Endpoint** | `POST /api/v1/applicant/payment-requests/:id/receipts` |
| **Request Content-Type** | `multipart/form-data` |
| **Processing Steps** | 1. Validate file type and size. 2. Store to filesystem using naming conventions. 3. Persist to `receipt_files`. 4. Return metadata. |

### 6.6 Operation: Submit to Manager

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | "Submit to Manager" button click. |
| **API Endpoint** | `POST /api/v1/applicant/payment-requests/:id/submit-manager` |
| **Pre-Submission Validation** | Strict Mode Validation. Ensures `has_receipt` compliance. |
| **Processing Steps** | 1. Strict validation check. 2. Change `status_id = 2`. 3. Assign `current_assigned_to_user_id = manager_user_id`. 4. Set `submitted_to_manager_date = NOW()`. 5. Log `SUBMITTED` action. 6. Dispatch WebSocket to Manager. 7. Return 200 OK. |

### 6.7 Operation: Submit to Final Approver

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | "Submit to Final Approver" button click. |
| **Guard Condition** | Status must be exactly 4 (`MANAGER_VERIFIED`). |
| **API Endpoint** | `POST /api/v1/applicant/payment-requests/:id/submit-approver` |
| **Processing Steps** | 1. Validate status. 2. Change `status_id = 6`. 3. Set `submitted_to_approver_date = NOW()`. 4. Log `SUBMITTED` action. 5. Dispatch WebSocket to Approvers. 6. Return 200 OK. |

---

## 7. Input / Output Specification

### 7.1 Input Specification (入力定義)

| Section | Field (Physical Name) | Display Name (English) | Display Name (日本語) | Data Type & Length | Required | Input Control | Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| Header | `application_date` | Application Date | 申請日 | DATE | Yes | Date Picker | Today or earlier |
| Payment | `desired_payment_date` | Desired Payment Date | 支払希望日 | DATE | Yes | Date Picker | Today or later |
| Payment | `currency_id` | Currency | 通貨選択 | INT (FK) | Yes | Dropdown | From `currencies` |
| Payment | `payment_type_id` | Payment Type | 支払タイプ | INT (FK) | Yes | Dropdown | From `payment_types` |
| Payment | `payment_method_id` | Payment Method | 支払方法 | INT (FK) | Yes | Dropdown | From `payment_methods` |
| Payment | `purpose` | Purpose / Usage | 用途 | VARCHAR(500) | Yes | Text Input | - |
| Payment | `bank_account_info` | Bank Account/Phone | 銀行口座・口座名/電話番号 | VARCHAR(200) | Cond. | Text Input | Req if Bank/Cash |
| Content | `request_content` | Request Content | 支払申請内容 | TEXT | Yes | Text Area | Max 1000 chars |
| Content | `has_receipt` | Receipt Present | 領収書の有無 | BOOLEAN | Yes | Radio Yes/No | Enforces uploads |
| Routing | `manager_user_id` | Target Manager | 承認担当者 | INT (FK) | Yes | Dropdown | Filtered to `MANAGER` |

### 7.2 Output Specification (出力定義)

| Field | Display Name | Data Source | Display Format |
| :--- | :--- | :--- | :--- |
| Request Number | 申請番号 | `payment_requests.request_number` | String (e.g., "PRF-2026-001") |
| Total Amount | 合計金額 | `payment_requests.total_amount` | Decimal (12,2) with `currency_code` |
| Status Badge | ステータス | `payment_statuses.status_name` | Themed color badge based on status |

---

## 8. Input Validation Rules

### 8.1 Draft Save Validation (Relaxed Mode)

During draft save operations, partial input is permitted. 
- Dates must be logically valid if provided (e.g., `application_date` <= today).
- Amounts must be numeric and > 0 if provided.
- Line items are constrained to max 15 lines.

### 8.2 Submission / Action Validation (Strict Mode)

Full validation enforced before transitioning out of Draft or Rejected states.

| Field | Validation Rule | Error Message |
| :--- | :--- | :--- |
| `application_date` | Required. Valid calendar date <= today. | "Application Date is required and must be today or earlier." |
| `total_amount` | Computed > 0. | "Total amount must be greater than zero." |
| `desired_payment_date` | Required. Valid calendar date >= today. | "Desired Payment Date is required and must be today or a future date." |
| `bank_account_info` | Required if `payment_method_id` resolves to Bank Transfer or Cash. | "Bank account or phone information is required for the selected payment method." |
| `items` (Breakdown) | Required. Min 1, Max 15 items. | "At least one breakdown line item is required." |
| `receipt_files` | Required if `has_receipt = TRUE`. Min 1 uploaded active file. | "Receipt file attachment is required. Please upload at least one receipt before submitting." |

### 8.3 Validation Enforcement Layers

1. **Frontend (Client)**: React Hook Form validation with fast feedback.
2. **Backend (Server)**: NestJS Service Layer + `class-validator` DTOs guarding all database operations.

---

## 9. Error Handling Specification

### 9.1 Error Response Structure

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed for the submitted payment request.",
  "details": [{ "field": "desired_payment_date", "message": "Desired Payment Date must be today or a future date." }],
  "timestamp": "2026-06-12T08:45:00.000Z",
  "path": "/api/v1/applicant/payment-requests"
}
```

### 9.2 Error Classification Table

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Validation failures on fields. | Field-level inline errors + top banner summary. |
| `401` | `UNAUTHORIZED` | Invalid or expired token. | Redirect to Login. |
| `403` | `FORBIDDEN` | Accessing another user's request, or forbidden action (e.g. deleting non-draft). | Denied message. No data leaked. |
| `404` | `NOT_FOUND` | Resource not found or soft-deleted. | "Requested resource was not found." |
| `409` | `CONFLICT` | Concurrent modification detected. | "Record modified since loaded. Please refresh." |
| `413` | `PAYLOAD_TOO_LARGE` | File exceeds 10MB. | "File exceeds maximum size of 10 MB." |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Invalid file format. | "File type not supported. Permitted: PDF, PNG, JPG." |
| `422` | `UNPROCESSABLE_ENTITY` | Receipt required but not found. | Business violation message displayed. |

### 9.3 Frontend Error Display Behavior

- **Field-Level Validation**: Red borders and inline text directly below inputs.
- **Form-Level Summary**: Banner at the top of the form listing all active errors.
- **Toast Notifications**: Used for API errors and successful actions (e.g. "Draft Saved", "Failed to submit").

---

## 10. Permission and Access Control

### 10.1 Authentication Requirements

- JSON Web Token (JWT) Bearer Token passed via `Authorization` header.
- Token validated on every API request; backed by Redis session management.

### 10.2 Authorization Guard Architecture

Every endpoint executes guards sequentially:
1. `JwtAuthGuard`: Asserts valid token.
2. `RolesGuard`: Asserts user has `APPLICANT` role code.
3. `OwnershipGuard`: Asserts `applicant_user_id` matches the authenticated `user_id`.

### 10.3 API Endpoint Permission Matrix

All Applicant API endpoints located under `/api/v1/applicant` strictly require the `APPLICANT` role and enforce the implicit ownership filter or explicit `OwnershipGuard` validation.

### 10.4 Security Audit Logging

Any mutating action creates an immutable log in `approval_logs`.

| Log Field | Populated By |
| :--- | :--- |
| `action_taken_by_user_id` | Authenticated JWT |
| `action_type_id` | Mapped code: `CREATED`, `EDITED`, `SUBMITTED`, etc. |
| `previous_status_id` / `new_status_id` | Extracted from transaction state |
| `ip_address` / `user_agent` | Client request headers |
| `timestamp` | UTC Database Timestamp |

Protected by `trg_approval_logs_immutable` PostgreSQL trigger.

---

## 11. Real-Time Notification Behavior

### 11.1 WebSocket Configuration

- **Technology**: Socket.IO, Port 3001
- **Room Membership**: Users automatically join `APPLICANT` role room and `user:{user_id}` personal room upon connection handshake.

### 11.2 Notification Events Received by This Screen

| Event Name | Trigger | Action |
| :--- | :--- | :--- |
| `statusUpdate` | Upstream change (Manager reviews, Approver approves). | Display toast. Update list/detail view. |
| `notification` | Target specific messages. | Display toast. Increment counter. |

### 11.3 Notification Events Dispatched by This Screen's Actions

| Action | Event Name | Target Room | Payload Sent |
| :--- | :--- | :--- | :--- |
| Submit to Manager | `statusUpdate` | `user:{manager_id}` & `MANAGER` | `new_status: SUBMITTED_MANAGER`, details |
| Submit to Approver | `statusUpdate` | `APPROVER` | `new_status: SUBMITTED_APPROVER`, details |

### 11.4 Connection Resilience

Clients handle temporary disconnects using exponential backoff reconnections. On an extended disconnect, a full refresh of the payment request list is triggered.

---

## 12. Screen Transition Specification

### 12.1 Inbound Navigation

- **Login Screen** → Successfully logging in with `APPLICANT` role redirects to `/applicant`.
- **Global Navbar** → Clicking "Applicant" link explicitly enters the dashboard.

### 12.2 Internal Screen States

- **List View**: Default dashboard display.
- **Create Form View**: Instantiated when clicking "Create New Request".
- **Edit Form View**: Reached by opening a DRAFT or REJECTED request.
- **Read-Only Detail View**: Reached by opening a SUBMITTED or higher request.

### 12.3 Outbound Navigation

- **Logout**: Flushes JWT, navigates to Login Screen.
- **Invalid URL**: Navigates to standard 404 Error Page.

---

## 13. Non-Functional Considerations

### 13.1 Performance Requirements

- Page Load (Initial Render): ≤ 2 seconds
- Primary List Query: ≤ 1 second
- Draft Action Round-Trip: ≤ 2 seconds
- WebSocket Latency: ≤ 500 milliseconds

### 13.2 Caching Strategy

- **Master Lookup Data**: Cached in Redis with 24-hour TTL (`lookup:<table_name>`).
- **Request Payloads**: Cached in Redis with 10-min TTL (`payment_request:payload:<id>`). Evicted securely upon any status transition.

### 13.3 Responsive Design Requirements

- **Desktop (≥ 1024px)**: Dual column, list on left, detail view on right.
- **Tablet (768px – 1023px)**: Single column stacked with collapsible panes.
- **Mobile (< 768px)**: Single column optimized for touch interfaces with accordion actions.

### 13.4 Display Order / Sorting Rules

The list of requests is sorted strictly by:
1. `payment_statuses.display_order` (Ascending)
2. `payment_requests.created_date` (Descending)

---

## 14. Configurable Items (External Definitions)

Defined via `.env` configuration mapping:

| Definition Key | Default Value | Description |
| :--- | :--- | :--- |
| `MAX_RECEIPT_FILE_SIZE_MB` | `10` | Size limit per individual file upload |
| `ALLOWED_RECEIPT_MIME_TYPES` | `application/pdf,image/png,image/jpeg` | Approved attachment extensions |
| `FILE_UPLOAD_DIRECTORY` | `/var/www/uploads` | Abstracted storage root path |

---

## 15. Cross-Reference Traceability Matrix

### 15.1 Requirements Definition Traceability

| Requirement ID | Requirement Description | Covered By (This Document) |
| :--- | :--- | :--- |
| REQ-001 | Applicant creates new draft | UC-APP-002, Sec 6.2 |
| REQ-002 | Applicant edits draft | UC-APP-003, Sec 6.3, BR-APP-003 |
| REQ-004 | Submit Draft to Manager | UC-APP-007, Sec 6.6, TR-APP-01 |
| REQ-006 | Submit to Final Approver | UC-APP-008, Sec 6.7, TR-APP-04 |

### 15.2 Database Design Traceability

| Database Table | Relevant Functional Operations |
| :--- | :--- |
| `payment_requests` | All CRUD operations in Section 6. |
| `payment_breakdown_items` | Created/Edited alongside payment requests. |
| `receipt_files` | Managed via File Upload rules (Sec 4.4, Sec 6.5). |
| `approval_logs` | Immutable logging tracking (Sec 10.4). |

### 15.3 Related Document References

| Document ID | Document Name | File Path |
| :-- | :--- | :--- |
| PRWM-REQ-001 | Requirements Definition | `01_要件定義書_REQUIREMENT_SPEC.md` |
| PRWM-DBS-001 | Database Design Specification | `03_データベース設計書_DATABASE_SPEC.md` |
| PRWM-DEV-001 | Development Rules | `02_開発ルール_DEVELOPMENT_RULES.md` |
