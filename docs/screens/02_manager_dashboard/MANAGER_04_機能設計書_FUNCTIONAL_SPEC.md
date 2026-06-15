# Functional Specification (機能設計書) — Manager Dashboard

**Document ID:** PRWM-FSD-SCR-002  
**Target Screen:** Manager Dashboard (担当マネージャーダッシュボード)  
**Subsystem:** Payment Request Lifecycle — Manager Verification Operations  
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
| 1.0 | 2026-06-12 | Senior Principal Architect | Initial release. Full functional specification for the Manager Dashboard subsystem covering verification queues, automatic reviewing transitions, detail inspection, receipt verification, approval/rejection operations, approval logs, and WebSocket notifications. |

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

The Manager Dashboard is the primary portal for users assigned the `MANAGER` role within the Payment Request Workflow Management System. This screen provides the necessary features for managers to review and verify payment requests submitted by applicants. Managers evaluate the correctness of the application date, desired payment date, payment breakdown lines, amounts, currency, purposes, bank information, and physical/digital receipt attachments before forwarding the request to the next stage.

Managers do not make the final approval; rather, they perform initial verification. If the request is correct, the manager verifies it, transitioning the status to `MANAGER_VERIFIED`, which routes the request back to the applicant's queue. The applicant then decides when to submit it to the Final Approver. If the request is incorrect, the manager rejects it back to the applicant with a mandatory comment, transitioning the status to `REJECTED_MANAGER`.

### 1.2 Functional Responsibilities

The Manager Dashboard is responsible for the following core functional areas:

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

### 2.2 Primary Business Workflow (Manager Verification)

The following diagram illustrates the workflow of the Manager Verification process:

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

---

## 3. State Transition Specification

### 3.1 Manager-Controllable State Transitions

The Manager actor is authorized to trigger or observe the following state transitions:

| Transition ID | Origin Status | Target Status | Trigger Action | Guard Conditions |
| :--- | :--- | :--- | :--- | :--- |
| TR-MGR-01 | `SUBMITTED_MANAGER` (2) | `MANAGER_REVIEWING` (3) | System-initiated on detail access | The authenticated user must match `payment_requests.manager_user_id`. Transition must occur automatically inside a transaction. |
| TR-MGR-02 | `MANAGER_REVIEWING` (3) | `MANAGER_VERIFIED` (4) | Click "Verify (確認完了)" button | Request ownership checks pass. Optional comment is validated. |
| TR-MGR-03 | `MANAGER_REVIEWING` (3) | `REJECTED_MANAGER` (5) | Click "Reject (却下する)" button | Request ownership checks pass. Mandatory comment is validated (non-empty and ≥ 10 characters). |

### 3.2 Manager-Observable Status Set

The following table defines which statuses are visible on the Manager Dashboard and what actions the manager can perform:

| Status ID | Status Code | Display Name | Manager Can View | Manager Can Action | Assigned To |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 2 | `SUBMITTED_MANAGER` | Submitted to Manager | ✓ | ✓ (Auto-triggers Reviewing) | Manager |
| 3 | `MANAGER_REVIEWING` | Manager Reviewing | ✓ | ✓ (Verify or Reject) | Manager |
| 4 | `MANAGER_VERIFIED` | Manager Verified (OK) | ✓ | ✗ | Applicant |
| 5 | `REJECTED_MANAGER` | Rejected by Manager | ✓ | ✗ | Applicant |
| 6 | `SUBMITTED_APPROVER` | Submitted to Approver | ✓ | ✗ | Final Approver |
| 7 | `APPROVER_REVIEWING` | Approver Reviewing | ✓ | ✗ | Final Approver |
| 8 | `APPROVED` | Approved | ✓ | ✗ | Accounting |
| 9 | `REJECTED_APPROVER` | Rejected by Approver | ✓ | ✗ | Applicant |
| 10 | `PAID` | Paid (Completed) | ✓ | ✗ | — |

---

## 4. Business Rules

### 4.1 Data Ownership and Access Isolation

| Rule ID | Rule Name | Description | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| BR-MGR-001 | Assigned Request Isolation | The manager shall have visibility and access only to payment requests where `payment_requests.manager_user_id` equals the authenticated user's `user_id`. Requests assigned to other managers or drafts are strictly excluded from lists and detailed endpoints. | Backend (TypeORM QueryBuilder `WHERE` clause), API Controller (`OwnershipGuard`) |
| BR-MGR-002 | Access Prevention for Unassigned Requests | If a manager attempts to access another user's request details using direct URL path manipulation, the system returns HTTP `403 Forbidden` and hides the resource's existence. | Backend (`OwnershipGuard`) |

### 4.2 Auto-Reviewing Behavior

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-003 | Automatic Status Transition on Open (REQ-007) | When a manager requests the details of a payment request whose current status is exactly `SUBMITTED_MANAGER` (2), the system must immediately and atomicaly transition the status to `MANAGER_REVIEWING` (3). The modification timestamp (`modified_date`) is updated. |
| BR-MGR-004 | Review Action Audit Logging (REQ-011) | An automatic status transition to `MANAGER_REVIEWING` must create a log entry in the `approval_logs` table with `action_type_id` set to `ManagerReview` (ID: 4), `previous_status_id = 2`, `new_status_id = 3`, and the system comment "Manager opened request and started reviewing". |

### 4.3 Content Immutability

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-005 | Read-Only Field Enforcement (REQ-008) | The manager is not permitted to modify any payment request header data, breakdown items, or uploaded files. The frontend must render all data blocks as read-only. The backend must reject any patch requests to payment request content originating from users with the `MANAGER` role. |
| BR-MGR-006 | Receipt Attachment Verification | The manager has permissions to view and download all receipt attachments linked to the request via the file storage abstraction. Access to physical attachments remains locked unless they have been checked by accounting. |

### 4.4 Verification and Rejection Operations

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-007 | Verification Status Transition (REQ-009) | Upon clicking "Verify (確認完了)", the request transitions to status `MANAGER_VERIFIED` (4). The `current_assigned_to_user_id` field is set back to the request's `applicant_user_id`. This returns the request to the applicant's inbox for forwarding. |
| BR-MGR-008 | Rejection Status Transition (REQ-010) | Upon clicking "Reject (却下する)", the request transitions to status `REJECTED_MANAGER` (5). The `current_assigned_to_user_id` is set back to the request's `applicant_user_id`. |
| BR-MGR-009 | Rejection Comment Requirement | Rejection is permitted only if a comment is provided. The comment must contain at least 10 characters. This prevents empty or vague feedback, ensuring applicants know what changes are required. |
| BR-MGR-010 | Action Audit Logging (REQ-011) | Any click of "Verify" or "Reject" must create a log entry in the `approval_logs` table containing the action type (`ManagerVerified` ID: 5 or `ManagerRejected` ID: 6), previous/new statuses, manager's user ID, IP address, user agent, and comment text. |

### 4.5 Concurrency Control

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| BR-MGR-011 | Optimistic Concurrency Check | Before completing verification or rejection, the database transaction checks if the status of the request is still `MANAGER_REVIEWING` (3). If the request was updated by another session, the action is aborted with HTTP `409 Conflict`. |

---

## 5. Functional Operation Specification

### 5.1 Operation: Display Pending Verification Queue

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager navigates to the Manager Dashboard, or screen refreshes. |
| **Data Source** | `GET /api/payment-requests/pending-manager` with authenticated user context. |
| **Query Filter** | `manager_user_id = current_user.user_id AND status_id IN (2, 3) AND is_deleted = FALSE` |
| **Default Sort** | Primary: `status_id` (ascending order: `SUBMITTED_MANAGER` first, then `MANAGER_REVIEWING`), Secondary: `created_date` (descending). |
| **Display Fields** | Request ID (`payment_request_id`), Request Number (`request_number`), Applicant Name (derived from `users`), Application Date (`application_date`), Total Amount (`total_amount`), Currency Code (`currency_code`), Status Code (`status_code`). |
| **Real-Time Update** | Queue automatically updates when a WebSocket `statusUpdate` event indicating a new assignment is received. |

### 5.2 Operation: View Detail & Auto-Transition

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager selects a request from the pending queue. |
| **Guard Condition** | Authenticated user is the assigned `manager_user_id`. |
| **API Endpoint** | `GET /api/payment-requests/:id` |
| **Server-side Processing** | 1. Validate manager ownership using `OwnershipGuard`.  <br>2. Fetch request details.  <br>3. Check if status is `SUBMITTED_MANAGER` (2).  <br>4. If yes, start a transaction:  <br>&nbsp;&nbsp;&nbsp;&nbsp;a. Update `status_id = 3` (`MANAGER_REVIEWING`).  <br>&nbsp;&nbsp;&nbsp;&nbsp;b. Create `approval_logs` record: `action_type_id = 4` (`ManagerReview`), `previous_status_id = 2`, `new_status_id = 3`, `comment = 'Manager opened request and started reviewing'`.  <br>&nbsp;&nbsp;&nbsp;&nbsp;c. Commit transaction.  <br>&nbsp;&nbsp;&nbsp;&nbsp;d. Dispatch WebSocket `statusUpdate` event.  <br>5. Return detail payload (including breakdown items, receipts, and approval logs history). |

### 5.3 Operation: Verify Request (Verify OK)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager clicks "Verify (確認完了)" button on the detail form. |
| **API Endpoint** | `POST /api/payment-requests/:id/verify` |
| **Payload** | `{ "comment": "Optional verification comment" }` |
| **Guard Condition** | Status must be `MANAGER_REVIEWING` (3). Ownership check matches. |
| **Server-side Processing** | 1. Check guards and optimistic concurrency.  <br>2. Begin transaction.  <br>3. Update `status_id = 4` (`MANAGER_VERIFIED`).  <br>4. Update `current_assigned_to_user_id = applicant_user_id` (returns to applicant).  <br>5. Update `modified_date = NOW()`.  <br>6. Insert `approval_logs` record: `action_type_id = 5` (`ManagerVerified`), `previous_status_id = 3`, `new_status_id = 4`, `comment = payload.comment`.  <br>7. Commit transaction.  <br>8. Emit WebSocket status updates.  <br>9. Return `200 OK` indicating success. |

### 5.4 Operation: Reject Request (Return)

| Attribute | Specification |
| :--- | :--- |
| **Trigger** | Manager clicks "Reject (却下する)" button on the detail form. |
| **API Endpoint** | `POST /api/payment-requests/:id/reject-manager` |
| **Payload** | `{ "comment": "Mandatory rejection comment (min 10 characters)" }` |
| **Guard Condition** | Status must be `MANAGER_REVIEWING` (3). Ownership check matches. Comment must pass length validation. |
| **Server-side Processing** | 1. Validate guards and rejection comment constraints.  <br>2. Begin transaction.  <br>3. Update `status_id = 5` (`REJECTED_MANAGER`).  <br>4. Update `current_assigned_to_user_id = applicant_user_id` (returns to applicant).  <br>5. Update `modified_date = NOW()`.  <br>6. Insert `approval_logs` record: `action_type_id = 6` (`ManagerRejected`), `previous_status_id = 3`, `new_status_id = 5`, `comment = payload.comment`.  <br>7. Commit transaction.  <br>8. Emit WebSocket status updates.  <br>9. Return `200 OK` indicating success. |

---

## 6. Input Validation Rules

### 6.1 Action Form Fields

The comments entered by the manager during approval or rejection undergo the following validation rules:

| Operation | Input Field | Constraint Rule | Error Message |
| :--- | :--- | :--- | :--- |
| **Verify OK** | `comment` | Optional. Text format. Max 500 characters. | "Comment must be under 500 characters." |
| **Reject** | `comment` | **Required.** Text format. Minimum 10 characters, Maximum 500 characters. | "Comment is required and must be at least 10 characters long to reject a request." |

---

## 7. Error Handling Specification

### 7.1 Error Responses

API endpoints conform to the standard error JSON schema. Specific error cases for manager actions are described below:

| HTTP Status | Error Code | Scenario | User-Facing Behavior |
| :---: | :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Rejection comment is empty or less than 10 characters. | Displays warning banner: "A detailed comment of at least 10 characters is required for rejections." |
| `403` | `FORBIDDEN` | JWT payload role is not `MANAGER`, or the request's `manager_user_id` does not match the active user's ID. | Displays error page: "Access denied. You are not authorized to view or verify this request." |
| `404` | `NOT_FOUND` | The target request ID does not exist or has been deleted. | Displays message: "The requested payment request was not found." |
| `409` | `CONFLICT` | Optimistic concurrency conflict. The request is no longer in `SUBMITTED_MANAGER` or `MANAGER_REVIEWING` state. | Displays popup: "This request's status has changed since it was loaded. The list will now refresh." |

---

## 8. Permission and Access Control

### 8.1 Authorization Guards

Every Manager Dashboard API endpoint implements the following NestJS guards:

1. `JwtAuthGuard` — Checks token validity and parses user profile.
2. `RolesGuard` — Checks if user has `role_code = 'MANAGER'`.
3. `OwnershipGuard` — Checks if `payment_requests.manager_user_id` matches the token's `user_id`.

### 8.2 API Endpoint Permission Matrix

| Endpoint | Method | Required Role | Ownership Check | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/payment-requests/pending-manager` | `GET` | `MANAGER` | Implicit (query filter) | List pending reviews. |
| `/api/payment-requests/:id` | `GET` | `MANAGER` | ✓ | Load details (auto-reviews if new). |
| `/api/payment-requests/:id/verify` | `POST` | `MANAGER` | ✓ | Verify request details. |
| `/api/payment-requests/:id/reject-manager` | `POST` | `MANAGER` | ✓ | Reject request with comments. |

---

## 9. Real-Time Notification Behavior

### 9.1 WebSocket Rooms & Subscriptions

- **Room Join** — Upon logging in, managers connect to the WebSocket server on port 3001 and automatically join `'MANAGER'` and `'user:<user_id>'` rooms.
- **Inbound Event** — When an applicant submits a request to the manager (transitioning to `SUBMITTED_MANAGER`), the server broadcasts a `statusUpdate` event. The manager's dashboard intercept this event and adds the request to the queue in real-time.
- **Outbound Event** — When a manager performs verification or rejection, the server emits a `statusUpdate` event to `'user:<applicant_user_id>'` and the applicant dashboard is updated dynamically.

---

## 10. Screen Transition Specification

### 10.1 Navigation Paths

- **Landing Redirect** — If a manager successfully signs in, they are redirected to `/manager` (Manager Dashboard).
- **Split View Navigation** — Clicking on a row in the pending queue opens the detail split viewport on the right (or stacked panel on mobile).
- **Session End** — Logging out clears tokens and returns the user to the login portal `/login`.

---

## 11. Non-Functional Considerations

### 11.1 Performance & Caching

- **Load Speed** — Verification queue loads must take ≤ 2 seconds. Details must load in ≤ 1 second.
- **Database Indexing** — Queries are optimized by the `idx_payment_requests_manager_id_status` database index.
- **Redis Integration** — Lookup tables (currencies, methods) are loaded from Redis with a 24-hour TTL to reduce database query overhead.

---

## 12. Cross-Reference Traceability Matrix

### 12.1 Requirements Definition Traceability

The following matrix maps the functional requirements from the Requirements Definition (`REQUIREMENT_DEFINITION.md`) to the specifications in this document:

| Requirement ID | Requirement Description (Burmese / English) | Covered By (This Spec) |
| :--- | :--- | :--- |
| **REQ-007** | မန်နေဂျာတစ်ဦးသည် "Submitted to Manager" အခြေအနေရှိ တောင်းဆိုလွှာကို ဖွင့်ကြည့်သောအခါ၊ status သည် "Manager Reviewing" သို့ အလိုအလျောက် ပြောင်းလဲသွားမည်။ <br>*(When a manager opens a request in "Submitted to Manager" status, the status automatically changes to "Manager Reviewing".)* | UC-MGR-002, BR-MGR-003, Section 5.2 |
| **REQ-008** | မန်နေဂျာသည် ပြေစာပူးတွဲဖိုင်များ အပါအဝင် ငွေပေးချေမှု တောင်းဆိုလွှာ၏ အသေးစိတ်အချက်အလက်အားလုံးကို စစ်ဆေးနိုင်သည်။ <br>*(The manager can inspect all details of the payment request, including invoice/receipt attachments.)* | UC-MGR-003, BR-MGR-005, BR-MGR-006, Section 5.2 |
| **REQ-009** | မန်နေဂျာသည် တောင်းဆိုလွှာကို စိစစ်အတည်ပြု (approve) နိုင်ပြီး၊ status ကို "Manager Verified (OK)" သို့ ပြောင်းလဲမည်။ နောက်ဆုံးအတည်ပြုသူထံ ဆက်လက်တင်ပြနိုင်ရန်အတွက် တောင်းဆိုလွှာသည် လျှောက်ထားသူထံ ပြန်လည်ရောက်ရှိသွားမည်။ <br>*(The manager can approve (verify) the request, changing the status to "Manager Verified (OK)". The request returns to the applicant so they can submit it to the Final Approver.)* | UC-MGR-004, TR-MGR-02, BR-MGR-007, Section 5.3 |
| **REQ-010** | မန်နေဂျာသည် တောင်းဆိုလွှာကို ငြင်းပယ်နိုင်ပြီး၊ status ကို "Rejected by Manager" သို့ ပြောင်းလဲမည်။ မဖြစ်မနေ လိုအပ်သော မှတ်ချက် (comment) အကွက်ကို ဖြည့်သွင်းရမည်။ <br>*(The manager can reject the request, changing the status to "Rejected by Manager". A rejection comment is mandatory.)* | UC-MGR-005, TR-MGR-03, BR-MGR-008, BR-MGR-009, Section 5.4, Section 6.1 |
| **REQ-011** | မန်နေဂျာမှ လုပ်ဆောင်ချက်တစ်ခု (စိစစ်ခြင်း သို့မဟုတ် ငြင်းပယ်ခြင်း) ကို ပြုလုပ်သောအခါ၊ ၎င်းလုပ်ဆောင်ချက်နှင့် မှတ်ချက်ကို မှတ်တမ်းတင်ထားသော ApprovalLog တစ်ခုကို ဖန်တီးမည်။ <br>*(When a manager performs an action (verifying or rejecting), an ApprovalLog is created to record that action and comment.)* | UC-MGR-002, UC-MGR-004, UC-MGR-005, BR-MGR-004, BR-MGR-010, Section 5.2, Section 5.3, Section 5.4 |

### 12.2 Related Document References

| Document ID | Document Name | Relationship |
| :--- | :--- | :--- |
| PRWM-SIS-SCR-002 | Screen Items Specification — Manager Dashboard (`05_画面項目設計書_SCREEN_ITEMS.md`) | Defines UI elements, comment textareas, and buttons referenced in this spec. |
| PRWM-DDS-SCR-002 | Detail Design Specification — Manager Dashboard (`06_詳細設計書_DETAIL_DESIGN.md`) | Defines API request/response structures and SQL statements implementing operations specified herein. |
| PRWM-REQ-001 | Requirements Definition (`REQUIREMENT_DEFINITION.md`) | Upstream system requirements. |

---

*End of Functional Specification — Manager Dashboard (担当マネージャーダッシュボード)*