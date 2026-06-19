# DD_APPLICANT_08 — Test Specification

> **Doc ID:** PRWM-DD-APP-08 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document defines the testing strategy for the Applicant Module, covering Unit Tests, Component Tests, and End-to-End (E2E) Scenarios.

---

## 2. Backend Unit Tests (`src/modules/applicant/tests/`)

### 2.1 `applicant.service.spec.ts`

Mock dependencies: `Repository<PaymentRequest>`, `Repository<PaymentBreakdownItem>`, `Repository<ApprovalLog>`, `DataSource` (for transactions), `WebsocketGateway`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **createDraft** | Valid data provided | Saves as DRAFT, creates ApprovalLog (CREATED), returns new ID |
| **updateDraft** | User owns request, status is DRAFT | Updates fields, syncs breakdown items, saves successfully |
| **updateDraft** | User is not owner | Throws `OwnershipException` (403) |
| **updateDraft** | Status is SUBMITTED_MANAGER | Throws `BusinessRuleException` (422) |
| **submitToManager**| Valid data, sum of breakdown == totalAmount | Updates status to SUBMITTED_MANAGER, logs action, fires WS event |
| **submitToManager**| totalAmount mismatch with breakdown items | Throws `BusinessRuleException` (422) |
| **submitToManager**| hasReceipt is true, but no files uploaded | Throws `BusinessRuleException` (422) |
| **withdraw** | Status is SUBMITTED_MANAGER | Reverts status to DRAFT, logs action |
| **withdraw** | Status is MANAGER_REVIEWING | Throws `BusinessRuleException` (422) |
| **softDelete** | Status is DRAFT | Sets `isDeleted = true` |
| **softDelete** | Status is REJECTED_MANAGER | Throws `BusinessRuleException` (422) |

### 2.2 `applicant.controller.spec.ts`

Mock dependencies: `ApplicantService`.

| Test Suite | Scenario | Expected Outcome |
|------------|----------|------------------|
| **POST /** | Valid payload | Calls `service.createDraft`, returns 201 |
| **GET /** | With pagination params | Passes parsed queries to `service.findMyRequests`, returns 200 |
| **POST /:id/submit-manager** | Valid payload | Calls `service.submitToManager`, returns 200 |

---

## 3. Frontend Component Tests

Using Vitest + React Testing Library.

### 3.1 `PaymentRequestForm.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Initial render (New mode) | Displays empty form, today's date for applicationDate |
| Add breakdown item | Clicking "Add Row" adds a new line item. Sum is updated. |
| Validation (Submit) | Leaving purpose blank and clicking "Submit" shows inline validation error. |
| Validation (Draft) | Leaving purpose blank and clicking "Save as Draft" succeeds (assuming no strict validation). |
| Calculate Amount | Entering quantity=2, unitPrice=500 updates row amount to 1000 and totalAmount to 1000. |

### 3.2 `RequestTable.test.tsx`

| Scenario | Expected Outcome |
|----------|------------------|
| Render rows | Correctly maps `statusId` to `StatusBadge` and `amount` to `CurrencyDisplay`. |
| Action buttons | Only DRAFT status row shows "Delete" button. SUBMITTED shows only "View". |

---

## 4. End-to-End (E2E) Scenarios (Playwright)

| Scenario ID | Flow Description |
|-------------|------------------|
| **E2E-APP-01** | **Happy Path: Create and Submit**<br>1. Login as Applicant.<br>2. Click "New Request".<br>3. Fill all mandatory fields and 1 breakdown item.<br>4. Click "Submit to Manager".<br>5. Verify redirection to Dashboard and status shows "Submitted to Manager". |
| **E2E-APP-02** | **Save as Draft and Delete**<br>1. Login as Applicant.<br>2. Click "New Request".<br>3. Fill partial data, click "Save as Draft".<br>4. On Dashboard, click Delete icon for the new draft.<br>5. Confirm dialog.<br>6. Verify item is removed from table. |
| **E2E-APP-03** | **Withdraw Request**<br>1. Login as Applicant.<br>2. Open detail view of a "Submitted to Manager" request.<br>3. Click "Withdraw".<br>4. Confirm dialog.<br>5. Verify status changes back to "Draft". |
| **E2E-APP-04** | **Edit Rejected Request**<br>1. Open detail view of a "Rejected by Manager" request.<br>2. Click "Edit and Resubmit".<br>3. Change amount, click "Submit to Manager".<br>4. Verify status changes to "Submitted to Manager". |
| **E2E-APP-05** | **File Upload Validation**<br>1. In New Request, check "has receipt".<br>2. Attempt to upload a .exe file.<br>3. Verify error toast appears ("Invalid file type").<br>4. Upload valid .png.<br>5. Submit request.<br>6. Verify file appears in detail view. |

---

## 5. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_APPLICANT_07](./DD_APPLICANT_07_BUSINESS_LOGIC.md) | Business logic tested by unit tests |
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Validation rules tested by E2E/Component tests |
