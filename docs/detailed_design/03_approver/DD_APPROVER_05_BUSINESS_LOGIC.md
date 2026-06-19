# DD_APPROVER_05 — Business Logic

> **Doc ID:** PRWM-DD-APPROVER-05 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document specifies the core business logic, transaction boundaries, and state transition rules implemented in the `ApproverService`.

- **Location:** `src/modules/approver/approver.service.ts`

---

## 2. Core Service Methods

### 2.1 `findAssignedRequests(approverUserId: number, query: QueryApproverRequestsDto)`

1. **Validation:** Handled by DTO query validation.
2. **Logic:**
   - Query `PaymentRequest` records where `isDeleted = false`.
   - Default queue statuses are `6 (SUBMITTED_APPROVER)` and `7 (APPROVER_REVIEWING)`.
   - If `query.statusId` is provided, filter by that status.
   - Restrict explicitly assigned records to `finalApproverUserId = approverUserId`.
   - Join applicant, manager, currency, payment type, and payment method display data.
   - Apply branch, date range, search, sorting, and pagination.
3. **Transaction Boundaries:** Read-only operation; transaction not required.

### 2.2 `findOneForReview(id: number, approverUserId: number, auditContext: AuditContext)`

1. **Guards:** Request must exist, must not be deleted, and must be visible to the current Approver.
2. **Logic:**
   - Load request details with applicant, manager, breakdown items, receipt files, lookup labels, and approval logs.
   - If status is `6 (SUBMITTED_APPROVER)`, automatically start review:
     - Update `PaymentRequest.statusId = 7 (APPROVER_REVIEWING)`.
     - Set `finalApproverUserId = approverUserId` if null.
     - Set `currentAssignedToUserId = approverUserId`.
     - Insert `ApprovalLog` with `actionTypeId = 7 (APPR_REVIEW_START)`.
   - Return `ApproverRequestDetailView`.
3. **Transaction Boundaries:** Review-start status update and log insertion must be in a single transaction.

### 2.3 `approve(id: number, approverUserId: number, dto: ApprovePaymentRequestDto, auditContext: AuditContext)`

1. **Guards:** Status must be exactly `7 (APPROVER_REVIEWING)`.
2. **Logic:**
   - Update `PaymentRequest`:
     - `statusId = 8 (APPROVED)`
     - `approvalDate = NOW()`
     - `finalApproverUserId = approverUserId`
     - `accountingUserId = dto.accountingUserId ?? null`
     - `currentAssignedToUserId = dto.accountingUserId ?? null`
   - Insert `ApprovalLog`:
     - `actionTypeId = 8 (APPROVED)`
     - `previousStatusId = 7`
     - `newStatusId = 8`
     - `comment = dto.comment`
   - **Notification:**
     - Call `WebsocketGateway.sendPersonalNotification(request.applicantUserId, payload)`.
     - Call `WebsocketGateway.sendStatusUpdate('ACCOUNTING', payload)`.
3. **Transaction Boundaries:** DB update + log insertion must be transactional. Notifications fire after commit.

### 2.4 `reject(id: number, approverUserId: number, dto: RejectPaymentRequestDto, auditContext: AuditContext)`

1. **Guards:** Status must be exactly `7 (APPROVER_REVIEWING)`. Rejection comment is mandatory and must contain at least 10 characters.
2. **Logic:**
   - Update `PaymentRequest`:
     - `statusId = 9 (REJECTED_APPROVER)`
     - `finalApproverUserId = approverUserId`
     - `currentAssignedToUserId = request.applicantUserId`
   - Keep `managerUserId` unchanged so the Applicant's resubmission restarts from Manager review.
   - Insert `ApprovalLog`:
     - `actionTypeId = 9 (APPR_REJECTED)`
     - `previousStatusId = 7`
     - `newStatusId = 9`
     - `comment = dto.comment`
   - **Notification:** Send to Applicant that the request was rejected by the Final Approver.
3. **Transaction Boundaries:** DB update + log insertion must be transactional. Notifications fire after commit.

---

## 3. Data Calculation Rules

### 3.1 Status Transition Rules

```typescript
const APPROVER_TRANSITIONS = {
  SUBMITTED_APPROVER: PaymentStatus.APPROVER_REVIEWING,
  APPROVER_REVIEWING_APPROVE: PaymentStatus.APPROVED,
  APPROVER_REVIEWING_REJECT: PaymentStatus.REJECTED_APPROVER,
};
```

The Approver module must reject any transition outside:
- `6 (SUBMITTED_APPROVER)` -> `7 (APPROVER_REVIEWING)`
- `7 (APPROVER_REVIEWING)` -> `8 (APPROVED)`
- `7 (APPROVER_REVIEWING)` -> `9 (REJECTED_APPROVER)`

### 3.2 Rejection Comment Rule

Approver rejection requires a comment between 10 and 500 characters. The comment is stored in `ApprovalLog.comment` and displayed to the Applicant in the approval timeline.

---

## 4. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_09](../00_common/DD_COMMON_09_DATABASE_ACCESS_PATTERNS.md) | Transaction code examples |
| [DD_APPROVER_03](./DD_APPROVER_03_API_ENDPOINTS.md) | Endpoint routing to these methods |
| [Requirement Spec](../../core_ja/01_要件定義書_REQUIREMENT_SPEC.md) | Source business rules |
