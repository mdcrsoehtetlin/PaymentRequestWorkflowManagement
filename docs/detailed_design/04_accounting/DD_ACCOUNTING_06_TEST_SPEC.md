# DD_ACCOUNTING_06 — Test Specification

> **Doc ID:** PRWM-DD-ACC-06 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document defines the testing strategy for the Accounting Module, covering Unit Tests, Component Tests, and End-to-End (E2E) scenarios.

---

## 2. Backend Unit Tests (`src/modules/accounting/tests/`)

### 2.1 `accounting.service.spec.ts`

Mock dependencies: `Repository<PaymentRequest>`, `Repository<ApprovalLog>`, `DataSource` (for transactions), `WebsocketGateway`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **findApprovedRequests** | Valid pagination/filter inputs | Returns only requests in `APPROVED` status and applies search/filter logic |
| **findApprovedRequests** | No matching records | Returns an empty paginated response |
| **findOneForAccounting** | Existing request with related records | Returns request detail including breakdown, approval history, and metadata |
| **findOneForAccounting** | Request not found | Throws `NotFoundException` (404) |
| **completePayment** | Request is `APPROVED` and actor is accounting user | Updates status to `PAID`, sets completion timestamp, inserts approval log |
| **completePayment** | Request is not `APPROVED` | Throws `BusinessRuleException` (422) |
| **completePayment** | Missing permission | Throws `ForbiddenException` (403) |

### 2.2 `accounting.controller.spec.ts`

Mock dependencies: `AccountingService`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **GET /** | Valid query params | Calls `service.findApprovedRequests`, returns 200 |
| **GET /:id** | Valid request ID | Calls `service.findOneForAccounting`, returns 200 |
| **POST /:id/complete-payment** | Valid payload | Calls `service.completePayment`, returns 200 |

---

## 3. Frontend Component Tests

Using Vitest + React Testing Library.

### 3.1 `AccountingDashboard.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Displays approved queue, summary cards, and branch alert banner |
| Search/filter usage | Filters the table based on keyword and branch selection |
| Click `支払完了` | Opens confirmation dialog before completing payment |
| WebSocket update | Refreshes list when a request status changes |

### 3.2 `AccountingRequestDetail.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Render detail page | Shows applicant info, breakdown items, approval history, and attachments |
| Complete payment action | Calls the success flow and updates status badge |
| Error case | Shows validation or error message if the request cannot be completed |

---

## 4. End-to-End (E2E) Scenarios (Playwright)

| Scenario ID | Flow Description |
|-------------|------------------|
| **E2E-ACC-01** | **Happy Path: Complete Payment**<br>1. Login as Accounting user.<br>2. Open accounting dashboard.<br>3. Select an approved request.<br>4. Click `支払完了`.<br>5. Confirm the dialog.<br>6. Verify status changes to `PAID` and the request is removed from the active queue. |
| **E2E-ACC-02** | **View Request Detail**<br>1. Login as Accounting user.<br>2. Open a request from the approved queue.<br>3. Verify request metadata, approval timeline, and attachments are shown correctly. |
| **E2E-ACC-03** | **Realtime Refresh**<br>1. Login as Accounting user.<br>2. Trigger a status update from another role.<br>3. Verify the queue refreshes automatically without manual reload. |

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_ACCOUNTING_05](./DD_ACCOUNTING_05_BUSINESS_LOGIC.md) | Business logic tested by unit tests |
| [DD_COMMON_08](../00_common/DD_COMMON_08_ERROR_HANDLING.md) | Error responses and exception handling |
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Validation rules covered by tests |
