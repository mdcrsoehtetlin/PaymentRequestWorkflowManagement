# DD_ACCOUNTING_05 — Business Logic

> **Doc ID:** PRWM-DD-ACC-05 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document specifies the core business logic, transaction boundaries, and state transition rules implemented in the `AccountingService`.

- **Location:** `src/modules/accounting/accounting.service.ts`

---

## 2. Core Service Methods

### 2.1 `findApprovedRequests(query: QueryAccountingRequestsDto)`

1. **Validation:** Ensure pagination and filter values are valid.
2. **Logic:**
   - Query `PaymentRequest` records where `statusId = APPROVED`.
   - Apply search/filter conditions for branch, request number, applicant, and date range if provided.
   - Return a paginated result for the accounting queue.
3. **Transaction Boundaries:** Read-only operation; no write is required.

### 2.2 `findOneForAccounting(id: number)`

1. **Validation:** Ensure the request exists and is accessible by the accounting role.
2. **Logic:**
   - Load the request together with applicant details, breakdown items, approval history, and receipt references.
   - Attach branch-specific guidance metadata if needed.
   - Return a full request detail view suitable for accounting review.
3. **Transaction Boundaries:** Read-only operation.

### 2.3 `completePayment(id: number, accountingUserId: number, dto: CompletePaymentDto)`

1. **Validation:**
   - Verify the request exists.
   - Ensure the current status is exactly `APPROVED`.
   - Confirm the actor has accounting privileges.
2. **Logic:**
   - Update `PaymentRequest`:
     - `statusId = PAID`
     - `accountingUserId = accountingUserId`
     - `paymentCompletedDate = NOW()`
   - Insert `ApprovalLog` with the payment completion action.
   - Persist the optional completion comment if provided.
   - **Notification:** Call `WebsocketGateway` after commit to notify relevant roles.
3. **Transaction Boundaries:** The status update and approval log insertion must be executed in a single database transaction.

---

## 3. Data Calculation Rules

### 3.1 Approved-Only Payment Rule
- A request can be completed as paid only when its current status is `APPROVED`.
- Requests in other states must not be transitioned to `PAID`.

### 3.2 Audit Log Requirement
- Every payment completion must create an approval log entry containing:
  - actor information
  - previous status
  - new status
  - optional comment
  - timestamp

### 3.3 Branch Guidance Rule
- If the applicant branch is `Mandalay`, the frontend should display branch-specific guidance for cash/payment handling.

### 3.4 Completion Timestamp Rule
- `paymentCompletedDate` must be set only when the payment state transition succeeds.

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Transaction boundary examples |
| [DD_ACCOUNTING_03](./DD_ACCOUNTING_03_API_ENDPOINTS.md) | Endpoint routing to these methods |
| [DD_ACCOUNTING_04](./DD_ACCOUNTING_04_DTOS_AND_TYPES.md) | DTO definitions used by the service |
| [Requirement Spec](../../core_ja/01_要件定義書_REQUIREMENT_SPEC.md) | Source business rules |
