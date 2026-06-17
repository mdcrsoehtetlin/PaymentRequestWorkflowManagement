# DD_APPROVER_04 — DTOs and Types

> **Doc ID:** PRWM-DD-APPROVER-04 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-17

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) used by the Approver module's API endpoints. These DTOs utilize `class-validator` for request validation.

- **Location:** `src/modules/approver/dto/`

---

## 2. Request DTOs

### 2.1 QueryApproverRequestsDto

Used for `GET /` to list Approver queue requests.

```typescript
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

export enum ApproverRequestSortFields {
  CREATED_DATE = 'createdDate',
  APPLICATION_DATE = 'applicationDate',
  DESIRED_PAYMENT_DATE = 'desiredPaymentDate',
  TOTAL_AMOUNT = 'totalAmount',
  STATUS = 'statusId',
  MANAGER_VERIFIED_DATE = 'managerVerificationDate',
}

export class QueryApproverRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(ApproverRequestSortFields)
  sortBy?: ApproverRequestSortFields = ApproverRequestSortFields.MANAGER_VERIFIED_DATE;
}
```

### 2.2 ApprovePaymentRequestDto

Used for `POST /:id/approve`.

```typescript
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ApprovePaymentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string; // Optional approval comment for the approval log

  @IsOptional()
  @IsInt()
  @Min(1)
  accountingUserId?: number; // Optional direct assignment to Accounting user
}
```

### 2.3 RejectPaymentRequestDto

Used for `POST /:id/reject`.

```typescript
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectPaymentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  comment!: string; // Mandatory rejection reason for Applicant feedback
}
```

### 2.4 ApproverRequest Response Types

Used by `GET /` and `GET /:id`. These are response interfaces rather than request DTOs.

```typescript
import {
  PaymentRequestDetailView,
  PaymentStatus,
  UserSummary,
} from '@shared/types';

export interface ApproverRequestListItem {
  paymentRequestId: number;
  requestNumber: string;
  applicant: UserSummary;
  manager: UserSummary | null;
  applicationDate: string;
  desiredPaymentDate: string;
  totalAmount: string;
  currencyCode: string;
  statusId: PaymentStatus;
  purpose: string;
  managerVerificationDate: string | null;
  submittedToApproverDate: string | null;
  createdDate: string;
}

export interface ApproverRequestDetailView extends PaymentRequestDetailView {
  canApprove: boolean;
  canReject: boolean;
  latestManagerComment: string | null;
  latestApplicantSubmissionComment: string | null;
}
```

---

## 3. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Base validation rules and custom validators |
| [DD_APPROVER_03](./DD_APPROVER_03_API_ENDPOINTS.md) | Endpoints that consume these DTOs |
