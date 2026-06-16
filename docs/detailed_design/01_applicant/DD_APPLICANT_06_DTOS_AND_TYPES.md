# DD_APPLICANT_06 — DTOs and Types

> **Doc ID:** PRWM-DD-APP-06 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document specifies the Data Transfer Objects (DTOs) used by the Applicant module's API endpoints. These DTOs utilize `class-validator` for request validation.

- **Location:** `src/modules/applicant/dto/`

---

## 2. Request DTOs

### 2.1 CreatePaymentRequestDto

Used for `POST /` to create a new draft. Validation group: `draft`.

```typescript
import { 
  IsString, IsOptional, IsInt, IsBoolean, IsDateString, 
  ValidateNested, ArrayMinSize, ArrayMaxSize, MaxLength, Min 
} from 'class-validator';
import { Type } from 'class-transformer';
import { BreakdownItemDto } from '@shared/dto/breakdown-item.dto';
import { IsTodayOrBefore, IsTodayOrAfter } from '@shared/validators';

export class CreatePaymentRequestDto {
  @IsOptional({ groups: ['draft'] })
  @IsDateString()
  @IsTodayOrBefore()
  applicationDate?: string;

  @IsOptional({ groups: ['draft'] })
  @IsDateString()
  @IsTodayOrAfter()
  desiredPaymentDate?: string;

  @IsOptional({ groups: ['draft'] })
  @IsInt()
  @Min(1)
  currencyId?: number;

  @IsOptional({ groups: ['draft'] })
  @IsInt()
  @Min(1)
  paymentTypeId?: number;

  @IsOptional({ groups: ['draft'] })
  @IsInt()
  @Min(1)
  paymentMethodId?: number;

  @IsOptional({ groups: ['draft'] })
  @IsString()
  @MaxLength(500)
  purpose?: string;

  @IsOptional()
  @IsString()
  bankAccountInfo?: string;

  @IsOptional({ groups: ['draft'] })
  @IsString()
  @MaxLength(1000)
  requestContent?: string;

  @IsOptional()
  @IsBoolean()
  hasReceipt?: boolean;

  @IsOptional()
  @IsInt()
  managerUserId?: number;

  @IsOptional({ groups: ['draft'] })
  @ValidateNested({ each: true })
  @Type(() => BreakdownItemDto)
  @ArrayMaxSize(15)
  breakdownItems?: BreakdownItemDto[];
}
```

### 2.2 UpdatePaymentRequestDto

Used for `PATCH /:id`. Identical to Create, but wrapped in NestJS `PartialType`.

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentRequestDto } from './create-payment-request.dto';
import { IsOptional, IsInt } from 'class-validator';

export class UpdatePaymentRequestDto extends PartialType(CreatePaymentRequestDto) {
  @IsOptional()
  @IsInt()
  version?: number; // For optimistic locking
}
```

### 2.3 SubmitToManagerDto

Used for `POST /:id/submit-manager`. Extends `UpdatePaymentRequestDto` but enforces the `submit` validation group.

```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { UpdatePaymentRequestDto } from './update-payment-request.dto';

export class SubmitToManagerDto extends UpdatePaymentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string; // Optional submission comment for the approval log
}
```

### 2.4 QueryPaymentRequestsDto

Used for `GET /`.

```typescript
import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@shared/dto/pagination-query.dto';

export enum PaymentRequestSortFields {
  CREATED_DATE = 'createdDate',
  APPLICATION_DATE = 'applicationDate',
  TOTAL_AMOUNT = 'totalAmount',
}

export class QueryPaymentRequestsDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PaymentRequestSortFields)
  sortBy?: PaymentRequestSortFields = PaymentRequestSortFields.CREATED_DATE;
}
```

---

## 3. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_04](../00_common/DD_COMMON_04_SHARED_VALIDATION.md) | Base validation rules and custom validators |
| [DD_APPLICANT_05](./DD_APPLICANT_05_API_ENDPOINTS.md) | Endpoints that consume these DTOs |
