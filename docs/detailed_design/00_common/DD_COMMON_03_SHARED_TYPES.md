# DD_COMMON_03 — Shared Types & Enums

> **Doc ID:** PRWM-DD-COM-003 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Overview

This document defines all shared TypeScript types, enums, and interfaces used across both backend and frontend. These types are the **single source of truth** for data structures in the system.

- **Backend location:** `src/modules/shared/types/index.ts`
- **Frontend location:** `frontend/src/types/index.ts`

---

## 2. Enums

### 2.1 Payment Status

The most critical enum — maps database `status_id` (SERIAL FK) to application-level constants.

```typescript
/** Maps to payment_statuses.status_id in PostgreSQL */
export enum PaymentStatus {
  DRAFT = 1,
  SUBMITTED_MANAGER = 2,
  MANAGER_REVIEWING = 3,
  MANAGER_VERIFIED = 4,
  REJECTED_MANAGER = 5,
  SUBMITTED_APPROVER = 6,
  APPROVER_REVIEWING = 7,
  APPROVED = 8,
  REJECTED_APPROVER = 9,
  PAID = 10,
}
```

#### Status Metadata Table

| ID | Code | Japanese Label | Color (Tailwind) | Badge Classes | Editable? | Terminal? |
|----|------|---------------|-----------------|---------------|-----------|-----------|
| 1 | `DRAFT` | 下書き | gray | `bg-gray-100 text-gray-800` | ✅ Yes | No |
| 2 | `SUBMITTED_MANAGER` | マネージャーに提出済み | amber | `bg-amber-100 text-amber-800` | No | No |
| 3 | `MANAGER_REVIEWING` | マネージャー確認中 | amber | `bg-amber-100 text-amber-800` | No | No |
| 4 | `MANAGER_VERIFIED` | マネージャー確認済み | sky | `bg-sky-100 text-sky-800` | No | No |
| 5 | `REJECTED_MANAGER` | マネージャー差戻し | red | `bg-red-100 text-red-800` | ✅ Yes | No |
| 6 | `SUBMITTED_APPROVER` | 承認者に提出済み | amber | `bg-amber-100 text-amber-800` | No | No |
| 7 | `APPROVER_REVIEWING` | 承認者確認中 | amber | `bg-amber-100 text-amber-800` | No | No |
| 8 | `APPROVED` | 承認済み | emerald | `bg-emerald-100 text-emerald-800` | No | No |
| 9 | `REJECTED_APPROVER` | 承認者差戻し | red | `bg-red-100 text-red-800` | ✅ Yes | No |
| 10 | `PAID` | 支払完了 | emerald | `bg-emerald-200 text-emerald-900 font-bold` | No | ✅ Yes |

#### Helper Constants (Frontend)

```typescript
export const STATUS_LABELS_JP: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]: '下書き',
  [PaymentStatus.SUBMITTED_MANAGER]: 'マネージャーに提出済み',
  [PaymentStatus.MANAGER_REVIEWING]: 'マネージャー確認中',
  [PaymentStatus.MANAGER_VERIFIED]: 'マネージャー確認済み',
  [PaymentStatus.REJECTED_MANAGER]: 'マネージャー差戻し',
  [PaymentStatus.SUBMITTED_APPROVER]: '承認者に提出済み',
  [PaymentStatus.APPROVER_REVIEWING]: '承認者確認中',
  [PaymentStatus.APPROVED]: '承認済み',
  [PaymentStatus.REJECTED_APPROVER]: '承認者差戻し',
  [PaymentStatus.PAID]: '支払完了',
};

export const STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.DRAFT]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.SUBMITTED_MANAGER]: 'bg-amber-100 text-amber-800',
  [PaymentStatus.MANAGER_REVIEWING]: 'bg-amber-100 text-amber-800',
  [PaymentStatus.MANAGER_VERIFIED]: 'bg-sky-100 text-sky-800',
  [PaymentStatus.REJECTED_MANAGER]: 'bg-red-100 text-red-800',
  [PaymentStatus.SUBMITTED_APPROVER]: 'bg-amber-100 text-amber-800',
  [PaymentStatus.APPROVER_REVIEWING]: 'bg-amber-100 text-amber-800',
  [PaymentStatus.APPROVED]: 'bg-emerald-100 text-emerald-800',
  [PaymentStatus.REJECTED_APPROVER]: 'bg-red-100 text-red-800',
  [PaymentStatus.PAID]: 'bg-emerald-200 text-emerald-900 font-bold',
};

export const EDITABLE_STATUSES: PaymentStatus[] = [
  PaymentStatus.DRAFT,
  PaymentStatus.REJECTED_MANAGER,
  PaymentStatus.REJECTED_APPROVER,
];
```

### 2.2 User Role

```typescript
/** Maps to user_roles.role_id in PostgreSQL */
export enum UserRole {
  APPLICANT = 1,
  MANAGER = 2,
  APPROVER = 3,
  ACCOUNTING = 4,
  ADMIN = 5,
}

export const ROLE_CODES: Record<UserRole, string> = {
  [UserRole.APPLICANT]: 'APPLICANT',
  [UserRole.MANAGER]: 'MANAGER',
  [UserRole.APPROVER]: 'APPROVER',
  [UserRole.ACCOUNTING]: 'ACCOUNTING',
  [UserRole.ADMIN]: 'ADMIN',
};

export const ROLE_LABELS_JP: Record<UserRole, string> = {
  [UserRole.APPLICANT]: '申請者',
  [UserRole.MANAGER]: '担当マネージャー',
  [UserRole.APPROVER]: '最終承認者',
  [UserRole.ACCOUNTING]: '経理担当者',
  [UserRole.ADMIN]: 'システム管理者',
};
```

### 2.3 Payment Type

```typescript
/** Maps to payment_types.payment_type_id */
export enum PaymentType {
  EXPENSE_REIMBURSE = 1,
  SERVICE_PAYMENT = 2,
  ADVANCE_PAYMENT = 3,
  OTHER = 4,
}

export const PAYMENT_TYPE_LABELS_JP: Record<PaymentType, string> = {
  [PaymentType.EXPENSE_REIMBURSE]: '経費精算',
  [PaymentType.SERVICE_PAYMENT]: 'サービス支払',
  [PaymentType.ADVANCE_PAYMENT]: '前払い',
  [PaymentType.OTHER]: 'その他',
};
```

### 2.4 Payment Method

```typescript
/** Maps to payment_methods.payment_method_id */
export enum PaymentMethod {
  BANK_TRANSFER = 1,
  CASH = 2,
  CHECK = 3,
}

export const PAYMENT_METHOD_LABELS_JP: Record<PaymentMethod, string> = {
  [PaymentMethod.BANK_TRANSFER]: '銀行振込',
  [PaymentMethod.CASH]: '現金',
  [PaymentMethod.CHECK]: '小切手',
};

/** Methods that REQUIRE bank_account_info */
export const BANK_INFO_REQUIRED_METHODS: PaymentMethod[] = [
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CASH,
];
```

### 2.5 Currency

```typescript
/** Maps to currencies.currency_id */
export enum Currency {
  MMK = 1,
  USD = 2,
  JPY = 3,
  THB = 4,
}

export const CURRENCY_CODES: Record<Currency, string> = {
  [Currency.MMK]: 'MMK',
  [Currency.USD]: 'USD',
  [Currency.JPY]: 'JPY',
  [Currency.THB]: 'THB',
};
```

### 2.6 Approval Action Type

```typescript
/** Maps to approval_action_types.action_type_id */
export enum ApprovalActionType {
  CREATED = 1,
  EDITED = 2,
  SUBMITTED = 3,
  MGR_REVIEW_START = 4,
  MGR_VERIFIED = 5,
  MGR_REJECTED = 6,
  APPR_REVIEW_START = 7,
  APPROVED = 8,
  APPR_REJECTED = 9,
  PAYMENT_COMPLETED = 10,
}

export const ACTION_LABELS_JP: Record<ApprovalActionType, string> = {
  [ApprovalActionType.CREATED]: '作成',
  [ApprovalActionType.EDITED]: '編集',
  [ApprovalActionType.SUBMITTED]: '提出',
  [ApprovalActionType.MGR_REVIEW_START]: 'マネージャー確認開始',
  [ApprovalActionType.MGR_VERIFIED]: 'マネージャー確認',
  [ApprovalActionType.MGR_REJECTED]: 'マネージャー差戻し',
  [ApprovalActionType.APPR_REVIEW_START]: '承認者確認開始',
  [ApprovalActionType.APPROVED]: '承認',
  [ApprovalActionType.APPR_REJECTED]: '承認者差戻し',
  [ApprovalActionType.PAYMENT_COMPLETED]: '支払完了',
};

export const ACTION_BADGE_COLORS: Record<ApprovalActionType, string> = {
  [ApprovalActionType.CREATED]: 'bg-gray-100 text-gray-700',
  [ApprovalActionType.EDITED]: 'bg-gray-100 text-gray-700',
  [ApprovalActionType.SUBMITTED]: 'bg-amber-100 text-amber-800',
  [ApprovalActionType.MGR_REVIEW_START]: 'bg-amber-100 text-amber-800',
  [ApprovalActionType.MGR_VERIFIED]: 'bg-sky-100 text-sky-800',
  [ApprovalActionType.MGR_REJECTED]: 'bg-red-100 text-red-800',
  [ApprovalActionType.APPR_REVIEW_START]: 'bg-amber-100 text-amber-800',
  [ApprovalActionType.APPROVED]: 'bg-emerald-100 text-emerald-800',
  [ApprovalActionType.APPR_REJECTED]: 'bg-red-100 text-red-800',
  [ApprovalActionType.PAYMENT_COMPLETED]: 'bg-emerald-200 text-emerald-900',
};
```

---

## 3. Entity Interfaces

### 3.1 User

```typescript
export interface User {
  userId: number;
  email: string;
  fullName: string;
  employeeNumber: string;
  department: string | null;
  branch: string;
  roleId: number;
  isActive: boolean;
  createdDate: string;    // ISO 8601
  modifiedDate: string;   // ISO 8601
  lastLoginDate: string | null;
}

/** Minimal user info for display in lists and timelines */
export interface UserSummary {
  userId: number;
  fullName: string;
  employeeNumber: string;
  branch: string;
}
```

### 3.2 Payment Request

```typescript
export interface PaymentRequest {
  paymentRequestId: number;
  requestNumber: string;            // PRF-YYYY-NNNNNN
  applicantUserId: number;
  managerUserId: number | null;
  finalApproverUserId: number | null;
  accountingUserId: number | null;
  currentAssignedToUserId: number | null;
  applicationDate: string;          // YYYY-MM-DD
  desiredPaymentDate: string;       // YYYY-MM-DD
  totalAmount: string;              // NUMERIC(12,2) as string
  currencyId: number;
  paymentTypeId: number;
  paymentMethodId: number;
  purpose: string;
  bankAccountInfo: string | null;
  requestContent: string;
  hasReceipt: boolean;
  statusId: number;
  submittedToManagerDate: string | null;
  managerVerificationDate: string | null;
  submittedToApproverDate: string | null;
  approvalDate: string | null;
  paymentCompletedDate: string | null;
  createdDate: string;
  modifiedDate: string;
  isDeleted: boolean;
}
```

### 3.3 Payment Breakdown Item

```typescript
export interface PaymentBreakdownItem {
  paymentBreakdownItemId: number;
  paymentRequestId: number;
  lineNumber: number;               // 1–15
  itemDate: string;                 // YYYY-MM-DD
  description: string;
  amount: string;                   // NUMERIC(10,2) as string
  quantity: string | null;          // NUMERIC(10,2) as string
  unitPrice: string | null;         // NUMERIC(10,2) as string
  createdDate: string;
  modifiedDate: string;
}
```

### 3.4 Approval Log

```typescript
export interface ApprovalLog {
  approvalLogId: string;            // BIGSERIAL as string
  paymentRequestId: number;
  actionTakenByUserId: number;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;                // ISO 8601
}
```

### 3.5 Receipt File

```typescript
export interface ReceiptFile {
  receiptFileId: number;
  paymentRequestId: number;
  originalFileName: string;
  storedFileName: string;
  fileStoragePath: string;
  fileSize: string;                 // BIGINT as string (bytes)
  mimeType: string;
  uploadedByUserId: number;
  uploadedDate: string;
  isDeleted: boolean;
}
```

---

## 4. Composite View Types

### 4.1 PaymentRequestListItem

Used in the dashboard data table. Flattened for table rendering.

```typescript
export interface PaymentRequestListItem {
  paymentRequestId: number;
  requestNumber: string;
  applicationDate: string;
  totalAmount: string;
  currencyCode: string;             // Resolved from currencies lookup
  statusId: number;
  createdDate: string;
}
```

### 4.2 PaymentRequestDetailView

Full detail view with all relations loaded.

```typescript
export interface PaymentRequestDetailView extends PaymentRequest {
  applicant: UserSummary;
  manager: UserSummary | null;
  finalApprover: UserSummary | null;
  currencyCode: string;
  paymentTypeName: string;
  paymentMethodName: string;
  breakdownItems: PaymentBreakdownItem[];
  receiptFiles: ReceiptFile[];
  approvalLogs: ApprovalLogWithUser[];
}

export interface ApprovalLogWithUser extends ApprovalLog {
  actionTakenByUser: UserSummary;
}
```

---

## 5. API Response Types

### 5.1 Standard Paginated Response

```typescript
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
```

### 5.2 Standard Error Response

```typescript
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: ValidationErrorDetail[];
  timestamp: string;
  path: string;
}

export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;              // Japanese user-facing message
}
```

### 5.3 Standard Action Response

```typescript
export interface ActionResponse {
  success: boolean;
  message: string;
}
```

---

## 6. Form Data Types

### 6.1 Payment Request Form Values

```typescript
export interface PaymentRequestFormValues {
  applicationDate: string;
  desiredPaymentDate: string;
  currencyId: number | null;
  paymentTypeId: number | null;
  paymentMethodId: number | null;
  purpose: string;
  bankAccountInfo: string;
  requestContent: string;
  hasReceipt: boolean;
  managerUserId: number | null;
  breakdownItems: BreakdownItemFormValues[];
}

export interface BreakdownItemFormValues {
  lineNumber: number;
  itemDate: string;
  description: string;
  amount: string;
  quantity: string;
  unitPrice: string;
}
```

### 6.2 Lookup Option

```typescript
export interface LookupOption {
  id: number;
  code: string;
  name: string;
}
```

---

## 7. WebSocket Event Payloads

```typescript
export interface StatusUpdatePayload {
  paymentRequestId: number;
  requestNumber: string;
  previousStatusId: number;
  newStatusId: number;
  actionByUserId: number;
  actionByUserName: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: 'status_change' | 'action_required';
  title: string;
  message: string;
  paymentRequestId: number;
  timestamp: string;
}
```

---

## 8. JWT Payload Type

```typescript
export interface JwtPayload {
  sub: number;                // user_id
  email: string;
  role: string;               // role_code from user_roles
  roleId: number;
  branch: string;
  employeeNumber: string;
  fullName: string;
  iat: number;                // Issued at (Unix timestamp)
  exp: number;                // Expiration (Unix timestamp)
}
```

---

## 9. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_04](./DD_COMMON_04_SHARED_VALIDATION.md) | Validation schemas using these types |
| [DD_COMMON_05](./DD_COMMON_05_SHARED_COMPONENTS.md) | Components that consume these types |
| [DD_APPLICANT_06](../01_applicant/DD_APPLICANT_06_DTOS_AND_TYPES.md) | Applicant-specific DTOs derived from these types |
| [Database Spec](../../core_ja/03_データベース設計書_DATABASE_SPEC.md) | Source DB column definitions |
