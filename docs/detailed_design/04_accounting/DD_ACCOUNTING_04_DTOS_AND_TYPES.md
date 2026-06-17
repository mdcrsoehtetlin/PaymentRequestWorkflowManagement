# DD_ACCOUNTING_04 — DTOs and Types

> **Doc ID:** PRWM-DD-ACC-04 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document defines DTOs and response types used by the accounting module.

- **Location:** `src/modules/accounting/dto/`

---

## 2. Request DTOs

### 2.1 `QueryAccountingRequestsDto`

```typescript
export class QueryAccountingRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  branch?: string;
}
```

### 2.2 `CompletePaymentDto`

```typescript
export class CompletePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
```

---

## 3. Response Types

### 3.1 `AccountingQueueItem`

```typescript
export interface AccountingQueueItem {
  paymentRequestId: number;
  requestNumber: string;
  applicantName: string;
  branch: string;
  totalAmount: string;
  currencyCode: string;
  statusId: number;
  applicationDate: string;
  desiredPaymentDate: string;
}
```

### 3.2 `AccountingDashboardSummary`

```typescript
export interface AccountingDashboardSummary {
  approvedCount: number;
  paidCount: number;
  mandalayCount: number;
  todayCompletedCount: number;
}
```

---

## 4. Shared Type Reuse

Accounting uses shared response interfaces from [DD_COMMON_03](../00_common/DD_COMMON_03_SHARED_TYPES.md):
- `PaymentRequestDetailView`
- `PaginatedResponse`
- `ApprovalLogWithUser`

---

## 5. Validation Notes

DTOs follow the patterns in [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md).
