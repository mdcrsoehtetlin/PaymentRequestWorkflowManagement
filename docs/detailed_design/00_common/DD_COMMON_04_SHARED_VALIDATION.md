# DD_COMMON_04 — Shared Validation & DTO Patterns

> **Doc ID:** PRWM-DD-COM-004 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

All input validation uses **class-validator** (backend) and **manual validation functions** (frontend). This document defines shared validation patterns, base DTOs, custom validators, and the validation error message catalog.

---

## 2. Backend Validation Architecture

### 2.1 Global Validation Pipe

Registered in `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown properties
    forbidNonWhitelisted: true,   // Throw on unknown properties
    transform: true,              // Auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### 2.2 Validation Groups — Draft vs Submit

The system supports **two validation modes** via class-validator groups:

| Mode | Group Name | When Used | Behavior |
|------|-----------|-----------|----------|
| **Draft (Relaxed)** | `'draft'` | Save as draft | Partial data accepted, most fields optional |
| **Submit (Strict)** | `'submit'` | Submit to Manager | ALL mandatory fields required |

```typescript
// Usage in Controller:
@Post()
async saveDraft(
  @Body(new ValidationPipe({ groups: ['draft'] })) dto: CreatePaymentRequestDto,
) { ... }

@Post(':id/submit-manager')
async submitToManager(
  @Param('id', ParseIntPipe) id: number,
  @Body(new ValidationPipe({ groups: ['submit'] })) dto: SubmitToManagerDto,
) { ... }
```

---

## 3. Base DTO Patterns

### 3.1 Breakdown Item DTO (Nested)

```typescript
import {
  IsString, IsNotEmpty, IsOptional, IsDateString,
  MaxLength, IsNumber, Min, Max,
} from 'class-validator';

export class BreakdownItemDto {
  @IsDateString()
  @IsNotEmpty({ groups: ['submit'] })
  @IsOptional({ groups: ['draft'] })
  itemDate?: string;

  @IsString()
  @IsNotEmpty({ groups: ['submit'] })
  @IsOptional({ groups: ['draft'] })
  @MaxLength(200)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { groups: ['submit'], message: '金額は0より大きい値を入力してください' })
  @IsOptional({ groups: ['draft'] })
  @Max(9999999999.99)
  amount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  quantity?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  unitPrice?: number;
}
```

### 3.2 Query Pagination Base DTO

```typescript
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

---

## 4. Custom Validators

### 4.1 Date Validators

```typescript
// src/modules/shared/validators/is-today-or-before.validator.ts
import {
  registerDecorator, ValidationOptions, ValidationArguments,
} from 'class-validator';

export function IsTodayOrBefore(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTodayOrBefore',
      target: object.constructor,
      propertyName,
      options: {
        message: '申請日は本日以前の日付を入力してください',
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          if (!value) return true; // Let @IsOptional handle empty
          const inputDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return inputDate <= today;
        },
      },
    });
  };
}

// is-today-or-after.validator.ts
export function IsTodayOrAfter(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTodayOrAfter',
      target: object.constructor,
      propertyName,
      options: {
        message: '支払希望日は本日以降の日付を入力してください',
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          if (!value) return true;
          const inputDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return inputDate >= today;
        },
      },
    });
  };
}
```

### 4.2 File Validators

```typescript
// src/modules/shared/validators/file-validators.ts

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;       // 10MB per file
export const MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024;  // 50MB per request

export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE;
}
```

---

## 5. class-validator Decorator Reference

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@IsString()` | Must be a string | `@IsString() purpose: string` |
| `@IsNotEmpty()` | Cannot be empty/null/undefined | `@IsNotEmpty({ groups: ['submit'] })` |
| `@IsOptional()` | Field is optional | `@IsOptional({ groups: ['draft'] })` |
| `@MaxLength(n)` | Max string length | `@MaxLength(500)` |
| `@IsInt()` | Must be an integer | `@IsInt() currencyId: number` |
| `@IsNumber({maxDecimalPlaces})` | Numeric with precision | `@IsNumber({ maxDecimalPlaces: 2 })` |
| `@Min(n)` / `@Max(n)` | Numeric range | `@Min(0.01) amount: number` |
| `@IsDateString()` | ISO 8601 date string | `@IsDateString() applicationDate: string` |
| `@IsBoolean()` | Must be boolean | `@IsBoolean() hasReceipt: boolean` |
| `@IsEnum(E)` | Must be enum member | `@IsEnum(SortOrder)` |
| `@ValidateNested()` | Validate nested objects | For breakdown items array |
| `@Type(() => C)` | Transform to class | `@Type(() => BreakdownItemDto)` |
| `@ArrayMinSize(n)` | Min array length | `@ArrayMinSize(1, { groups: ['submit'] })` |
| `@ArrayMaxSize(n)` | Max array length | `@ArrayMaxSize(15)` |
| `@IsArray()` | Must be an array | `@IsArray() breakdownItems` |
| `@Transform(fn)` | Transform input | `@Transform(({ value }) => value?.trim())` |

---

## 6. Validation Error Message Catalog

### 6.1 Field-Level Validation Errors

| Code | Japanese Message | Field | Rule |
|------|-----------------|-------|------|
| `VAL-APP-001` | 申請日は本日以前の日付を入力してください | applicationDate | Date ≤ today |
| `VAL-APP-002` | 支払希望日は本日以降の日付を入力してください | desiredPaymentDate | Date ≥ today |
| `VAL-APP-003` | 目的を入力してください（最大500文字） | purpose | Required, maxLength 500 |
| `VAL-APP-004` | 申請内容を入力してください（最大1000文字） | requestContent | Required, maxLength 1000 |
| `VAL-APP-005` | 銀行口座情報を入力してください | bankAccountInfo | Required when method=BANK_TRANSFER/CASH |
| `VAL-APP-006` | 明細は1件以上15件以内で入力してください | breakdownItems | ArrayMinSize(1), ArrayMaxSize(15) |
| `VAL-APP-007` | 金額は0より大きい値を入力してください | amount | Min(0.01) |
| `VAL-APP-008` | 許可されていないファイル形式です（PDF, PNG, JPEG, JPGのみ） | receiptFile | MIME type check |
| `VAL-APP-009` | ファイルサイズが上限（10MB）を超えています | receiptFile | Size ≤ 10MB |
| `VAL-APP-010` | 領収書ファイルを添付してください | receiptFiles | Required when hasReceipt=TRUE |

### 6.2 Business Rule Errors

| Code | Japanese Message | HTTP Status | Trigger |
|------|-----------------|-------------|---------|
| `ERR-APP-401` | 認証が必要です。再度ログインしてください | 401 | JWT expired/missing |
| `ERR-APP-403` | この操作を実行する権限がありません | 403 | Wrong role or not owner |
| `ERR-APP-404` | 指定された申請が見つかりません | 404 | Request doesn't exist |
| `ERR-APP-409` | この申請は他のユーザーによって更新されました | 409 | Concurrent modification |
| `ERR-APP-422-01` | この操作は現在のステータスでは実行できません | 422 | Invalid status transition |
| `ERR-APP-422-02` | 下書き以外のステータスの申請は削除できません | 422 | Delete non-draft |
| `ERR-APP-422-03` | 合計金額が明細金額の合計と一致しません | 422 | Amount mismatch |
| `ERR-APP-500` | システムエラーが発生しました。管理者に連絡してください | 500 | Unexpected server error |

---

## 7. Frontend Validation Approach

The frontend uses **manual validation functions** (not class-validator, which is backend-only).

```typescript
// frontend/src/pages/applicant/utils/validation.ts

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export function validateDraft(
  values: PaymentRequestFormValues,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate fields that have values
  if (values.applicationDate) {
    const date = new Date(values.applicationDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      errors.push({
        field: 'applicationDate',
        code: 'VAL-APP-001',
        message: '申請日は本日以前の日付を入力してください',
      });
    }
  }

  if (values.purpose && values.purpose.length > 500) {
    errors.push({
      field: 'purpose',
      code: 'VAL-APP-003',
      message: '目的を入力してください（最大500文字）',
    });
  }

  return errors;
}

export function validateSubmit(
  values: PaymentRequestFormValues,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // All mandatory fields required
  if (!values.applicationDate) {
    errors.push({ field: 'applicationDate', code: 'VAL-APP-001', message: '申請日を入力してください' });
  }
  if (!values.desiredPaymentDate) {
    errors.push({ field: 'desiredPaymentDate', code: 'VAL-APP-002', message: '支払希望日を入力してください' });
  }
  if (!values.purpose?.trim()) {
    errors.push({ field: 'purpose', code: 'VAL-APP-003', message: '目的を入力してください（最大500文字）' });
  }
  if (!values.requestContent?.trim()) {
    errors.push({ field: 'requestContent', code: 'VAL-APP-004', message: '申請内容を入力してください（最大1000文字）' });
  }
  if (!values.currencyId) {
    errors.push({ field: 'currencyId', code: 'VAL-APP-003', message: '通貨を選択してください' });
  }
  if (!values.paymentTypeId) {
    errors.push({ field: 'paymentTypeId', code: 'VAL-APP-003', message: '支払種別を選択してください' });
  }
  if (!values.paymentMethodId) {
    errors.push({ field: 'paymentMethodId', code: 'VAL-APP-003', message: '支払方法を選択してください' });
  }
  if (!values.managerUserId) {
    errors.push({ field: 'managerUserId', code: 'VAL-APP-003', message: '担当マネージャーを選択してください' });
  }

  // Conditional: bank account info
  if (
    values.paymentMethodId &&
    BANK_INFO_REQUIRED_METHODS.includes(values.paymentMethodId) &&
    !values.bankAccountInfo?.trim()
  ) {
    errors.push({ field: 'bankAccountInfo', code: 'VAL-APP-005', message: '銀行口座情報を入力してください' });
  }

  // Breakdown items
  if (!values.breakdownItems || values.breakdownItems.length === 0) {
    errors.push({ field: 'breakdownItems', code: 'VAL-APP-006', message: '明細は1件以上15件以内で入力してください' });
  }

  // Draft-mode validations also apply
  errors.push(...validateDraft(values));

  return errors;
}
```

---

## 8. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_03](./DD_COMMON_03_SHARED_TYPES.md) | TypeScript types used in validation |
| [DD_COMMON_08](./DD_COMMON_08_ERROR_HANDLING.md) | How validation errors are returned to client |
| [DD_APPLICANT_06](../01_applicant/DD_APPLICANT_06_DTOS_AND_TYPES.md) | Applicant-specific DTOs |
| [Functional Spec](../../screens/01_applicant_dashboard/APPLICANT_04_機能設計書_FUNCTIONAL_SPEC.md) | Source validation rules |
