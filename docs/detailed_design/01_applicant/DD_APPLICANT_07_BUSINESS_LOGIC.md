# DD_APPLICANT_07 — Business Logic

> **Doc ID:** PRWM-DD-APP-07 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document specifies the core business logic, transaction boundaries, and state transition rules implemented in the `ApplicantService`.

- **Location:** `src/modules/applicant/applicant.service.ts`

---

## 2. Core Service Methods

### 2.1 `createDraft(userId: number, dto: CreatePaymentRequestDto)`

1. **Validation:** Handled by DTO `draft` group.
2. **Logic:**
   - Generate `requestNumber` using `RequestNumberService`.
   - Calculate `totalAmount` from `dto.breakdownItems` (if provided).
   - Insert `PaymentRequest` with `statusId = 1 (DRAFT)` and `applicantUserId = userId`.
   - Insert `PaymentBreakdownItem` records (if provided).
   - Insert `ApprovalLog` with `actionTypeId = 1 (CREATED)`.
3. **Transaction Boundaries:** `PaymentRequest`, `PaymentBreakdownItem`, `ApprovalLog` must be inserted in a single transaction.

### 2.2 `updateDraft(id: number, userId: number, dto: UpdatePaymentRequestDto)`

1. **Guards:** Ownership check. Status must be in `EDITABLE_STATUSES` (`1`, `5`, `9`).
2. **Logic:**
   - Recalculate `totalAmount` from updated breakdown items.
   - Update `PaymentRequest` fields.
   - Sync `PaymentBreakdownItem` records (delete missing, update existing, insert new).
   - *If status is `5` or `9`*, insert `ApprovalLog` with `actionTypeId = 2 (EDITED)`. (Draft edits do not typically require a log entry, but rejections do to track modifications).
3. **Transaction Boundaries:** Same as create.

### 2.3 `submitToManager(id: number, userId: number, dto: SubmitToManagerDto)`

1. **Guards:** Ownership check. Status must be in `EDITABLE_STATUSES`.
2. **Validation:** 
   - Strict validation (DTO `submit` group).
   - **Business Rule Check:** `totalAmount` must equal the sum of `amount` in `breakdownItems` to prevent mismatched totals.
   - **Business Rule Check:** If `hasReceipt` is true, check if `ReceiptFile` records exist for this `paymentRequestId`.
3. **Logic:**
   - Update `PaymentRequest`:
     - `statusId = 2 (SUBMITTED_MANAGER)`
     - `managerUserId = dto.managerUserId`
     - `currentAssignedToUserId = dto.managerUserId`
     - `submittedToManagerDate = NOW()`
   - Insert `ApprovalLog`:
     - `actionTypeId = 3 (SUBMITTED)`
     - `previousStatusId = request.statusId`
     - `newStatusId = 2`
     - `comment = dto.comment`
   - **Notification:**
     - Call `WebsocketGateway.sendPersonalNotification(dto.managerUserId, payload)`
     - Call `WebsocketGateway.sendStatusUpdate('MANAGER', payload)`
4. **Transaction Boundaries:** DB update + log insertion must be transactional. Notifications fire *after* commit.

### 2.4 `withdraw(id: number, userId: number)`

1. **Guards:** Ownership check. Status MUST be exactly `2 (SUBMITTED_MANAGER)`. If it is `3 (MANAGER_REVIEWING)` or higher, withdrawal is blocked.
2. **Logic:**
   - Update `PaymentRequest`:
     - `statusId = 1 (DRAFT)`
     - `currentAssignedToUserId = userId`
   - Insert `ApprovalLog`:
     - `actionTypeId = 2 (EDITED)` (Using edited or a dedicated withdrawn action if defined).
     - `previousStatusId = 2`
     - `newStatusId = 1`
   - **Notification:** Send to Manager that request was withdrawn.

### 2.5 `softDelete(id: number, userId: number)`

1. **Guards:** Ownership check. Status MUST be exactly `1 (DRAFT)`.
2. **Logic:**
   - Update `PaymentRequest.isDeleted = true`.
   - Update `ReceiptFile.isDeleted = true` for associated files.
   - (Breakdown items remain soft-deleted implicitly via join).

---

## 3. Data Calculation Rules

### 3.1 Total Amount Calculation

```typescript
const calculatedTotal = breakdownItems.reduce((acc, item) => {
  return acc + Number(item.amount);
}, 0);

// Round to 2 decimal places to match NUMERIC(12,2)
const formattedTotal = calculatedTotal.toFixed(2);
```

### 3.2 Breakdown Item Default Amount

If `quantity` and `unitPrice` are provided on a line item, the backend MUST validate that `amount == quantity * unitPrice` (with rounding tolerance). If they differ, the backend should reject the request or auto-correct if defined in rules.

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Transaction code examples |
| [DD_APPLICANT_05](./DD_APPLICANT_05_API_ENDPOINTS.md) | Endpoint routing to these methods |
| [Requirement Spec](../../core_ja/01_要件定義書_REQUIREMENT_SPEC.md) | Source business rules |
