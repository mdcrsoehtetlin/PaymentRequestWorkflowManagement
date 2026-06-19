# DD_APPROVER_06 — Test Specification

> **Doc ID:** PRWM-DD-APPROVER-06 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document defines the testing strategy for the Approver Module, covering Unit Tests, Component Tests, and End-to-End (E2E) Scenarios.

---

## 2. Backend Unit Tests (`src/modules/approver/tests/`)

### 2.1 `approver.service.spec.ts`

Mock dependencies: `Repository<PaymentRequest>`, `Repository<ApprovalLog>`, `DataSource` (for transactions), `WebsocketGateway`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **findAssignedRequests** | Default query | Returns SUBMITTED_APPROVER and APPROVER_REVIEWING requests |
| **findAssignedRequests** | Status/branch/search filters provided | Applies filters and returns paginated response |
| **findOneForReview** | Status is SUBMITTED_APPROVER | Updates status to APPROVER_REVIEWING, creates ApprovalLog (APPR_REVIEW_START), returns detail |
| **findOneForReview** | Status is already APPROVER_REVIEWING | Returns detail without duplicate review-start log |
| **findOneForReview** | Request not found | Throws `NotFoundException` (404) |
| **findOneForReview** | Request assigned to another approver | Throws `ForbiddenException` (403) |
| **approve** | Valid APPROVER_REVIEWING request | Updates status to APPROVED, sets approvalDate, logs action, fires WS event |
| **approve** | Status is SUBMITTED_APPROVER | Throws `BusinessRuleException` (422) |
| **approve** | Status is APPROVED | Throws `BusinessRuleException` (422) |
| **reject** | Valid comment and APPROVER_REVIEWING status | Updates status to REJECTED_APPROVER, logs action, fires WS event |
| **reject** | Comment missing or too short | Throws validation error or `BadRequestException` (400) |
| **reject** | Status is APPROVED | Throws `BusinessRuleException` (422) |

### 2.2 `approver.controller.spec.ts`

Mock dependencies: `ApproverService`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **GET /** | With pagination params | Passes parsed queries to `service.findAssignedRequests`, returns 200 |
| **GET /:id** | Valid ID | Calls `service.findOneForReview`, returns 200 |
| **POST /:id/approve** | Valid payload | Calls `service.approve`, returns 200 |
| **POST /:id/reject** | Valid payload | Calls `service.reject`, returns 200 |
| **POST /:id/reject** | Invalid payload | Validation rejects request before service call |

---

## 3. Frontend Component Tests

Using Vitest + React Testing Library.

### 3.1 `ApproverDashboard.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Shows loading state, then KPI cards and request table |
| Empty queue | Shows shared `EmptyState` |
| Render rows | Correctly maps `statusId` to `StatusBadge` and `totalAmount` to `CurrencyDisplay` |
| Row click | Navigates to `/approver/requests/:id` |
| Filter change | Refetches list and resets pagination |
| WebSocket update | Shows toast and refreshes data |

### 3.2 `ApproverRequestDetail.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render | Shows loading state, then request detail |
| Status APPROVER_REVIEWING | Shows Approve and Reject buttons |
| Status APPROVED | Hides Approve and Reject buttons |
| Approve action | Opens confirm dialog, calls approve API, shows success toast |
| Reject with short comment | Shows inline validation error and does not call API |
| Reject with valid comment | Calls reject API, shows success toast |
| Approval timeline | Renders shared `ApprovalTimeline` with log entries |

---

## 4. End-to-End (E2E) Scenarios (Playwright)

| Scenario ID | Flow Description |
|-------------|------------------|
| **E2E-APR-01** | **Happy Path: Approve Request**<br>1. Login as Final Approver.<br>2. Open Approver Dashboard.<br>3. Open a request in "Submitted to Approver".<br>4. Verify status changes to "Approver Reviewing".<br>5. Click "Approve" and confirm.<br>6. Verify status changes to "Approved". |
| **E2E-APR-02** | **Reject Request**<br>1. Login as Final Approver.<br>2. Open a request in "Approver Reviewing".<br>3. Click "Reject".<br>4. Enter a short comment and verify validation error.<br>5. Enter a valid comment and confirm.<br>6. Verify status changes to "Rejected by Approver". |
| **E2E-APR-03** | **Access Control**<br>1. Login as Applicant or Manager.<br>2. Navigate to `/approver/dashboard`.<br>3. Verify access is denied. |
| **E2E-APR-04** | **Concurrent Status Change**<br>1. Open same request in two approver sessions.<br>2. Approve in one session.<br>3. Attempt reject in the other.<br>4. Verify conflict/status error and refreshed data. |
| **E2E-APR-05** | **Real-time Queue Update**<br>1. Keep Approver Dashboard open.<br>2. Submit a Manager-verified request to Final Approver.<br>3. Verify dashboard updates without manual refresh. |

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_APPROVER_05](./DD_APPROVER_05_BUSINESS_LOGIC.md) | Business logic tested by unit tests |
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Validation rules tested by E2E/Component tests |
